"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = process.env.DANUBIA_DATA_DIR
  ? path.resolve(process.env.DANUBIA_DATA_DIR)
  : path.join(ROOT, ".danubia-data");
const DEFAULT_ROOM = cleanRoom(process.env.DANUBIA_ROOM || "danubia");
const STABLE_GM_KEY = process.env.DANUBIA_GM_KEY || "eoqsGDYLHw2AnwtMWW9yTSUn";
const STABLE_PLAYER_KEYS = (process.env.DANUBIA_PLAYER_KEYS || "TrpoImAKpK72YC3mV9GKr1Bg,so6IumvRVYt28v87GAes-l05,d2Z_uC90BXv8ihtXfdy5k5Pd,r-30VesdwTyVGLfKIM-NrMIT,JmtkbyxEEncN6CGTjnGxHru0")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)
  .slice(0, 5);
const memoryStore = globalThis.__danubiaRoomStore || new Map();
globalThis.__danubiaRoomStore = memoryStore;

async function ensureRoom(roomId = DEFAULT_ROOM) {
  const cleanId = cleanRoom(roomId);
  const existing = await readRoom(cleanId);
  if (existing) return existing;
  const room = createRoom();
  await writeRoom(cleanId, room);
  return room;
}

async function readRoom(roomId = DEFAULT_ROOM) {
  const cleanId = cleanRoom(roomId);
  const redisRoom = await readRedis(cleanId);
  if (redisRoom) return redisRoom;
  if (canUseFileStore()) {
    try {
      const raw = await fs.readFile(roomPath(cleanId), "utf8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return memoryStore.get(cleanId) || null;
}

async function writeRoom(roomId = DEFAULT_ROOM, room) {
  const cleanId = cleanRoom(roomId);
  const normalized = normalizeRoom(room);
  const redisOk = await writeRedis(cleanId, normalized);
  if (redisOk) return;
  if (canUseFileStore()) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(roomPath(cleanId), JSON.stringify(normalized, null, 2), "utf8");
    return;
  }
  memoryStore.set(cleanId, normalized);
}

function createRoom() {
  const playerKeys = Array.from({ length: 5 }, (_, index) => STABLE_PLAYER_KEYS[index] || secret());
  return {
    gmKey: STABLE_GM_KEY,
    playerKeys,
    permissions: { playerTabs: ["mesa"] },
    state: { permissions: { playerTabs: ["mesa"] } },
    updatedAt: null,
  };
}

function normalizeRoom(room) {
  const base = createRoom();
  const normalized = room && typeof room === "object" ? { ...base, ...room } : base;
  if (!Array.isArray(normalized.playerKeys) || normalized.playerKeys.length < 5) {
    normalized.playerKeys = base.playerKeys;
  }
  normalized.playerKeys = normalized.playerKeys.slice(0, 5);
  normalized.permissions = normalized.permissions || { playerTabs: ["mesa"] };
  normalized.state = normalized.state || { permissions: normalized.permissions };
  return normalized;
}

function mergePlayerState(current, incoming, slot) {
  const next = sanitizeState(current);
  if (!Number.isInteger(slot) || slot < 1 || slot > 5) return next;
  const incomingSheets = Array.isArray(incoming?.sheets) ? incoming.sheets : [];
  if (!Array.isArray(next.sheets)) next.sheets = Array.from({ length: 5 }, (_, index) => ({ slot: index + 1 }));
  if (incomingSheets[slot - 1]) next.sheets[slot - 1] = incomingSheets[slot - 1];
  return next;
}

function sanitizeState(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function cleanRoom(value) {
  const room = String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  return room || "danubia";
}

function canUseFileStore() {
  return !process.env.VERCEL && process.env.DANUBIA_MEMORY_ONLY !== "1";
}

function roomPath(roomId) {
  return path.join(DATA_DIR, `${roomId}.json`);
}

async function readRedis(roomId) {
  if (!hasRedis()) return null;
  const result = await redisCommand(["GET", redisKey(roomId)]);
  if (!result) return null;
  return typeof result === "string" ? JSON.parse(result) : result;
}

async function writeRedis(roomId, room) {
  if (!hasRedis()) return false;
  await redisCommand(["SET", redisKey(roomId), JSON.stringify(room)]);
  return true;
}

async function redisCommand(command) {
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.error || `Redis HTTP ${response.status}`);
  }
  return payload.result;
}

function hasRedis() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function redisKey(roomId) {
  return `danubia:room:${roomId}`;
}

function secret() {
  return crypto.randomBytes(9).toString("base64url");
}

module.exports = {
  DEFAULT_ROOM,
  cleanRoom,
  ensureRoom,
  readRoom,
  writeRoom,
  mergePlayerState,
  sanitizeState,
};
