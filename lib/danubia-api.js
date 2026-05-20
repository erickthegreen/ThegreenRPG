"use strict";

const { authenticate } = require("./danubia-auth");
const {
  DEFAULT_ROOM,
  cleanRoom,
  ensureRoom,
  writeRoom,
  mergePlayerState,
  sanitizeState,
} = require("./danubia-store");

const clients = globalThis.__danubiaSseClients || new Map();
globalThis.__danubiaSseClients = clients;

async function handleLogin(req, res, url = requestUrl(req)) {
  if (req.method !== "POST") return sendJson(res, 405, { error: "Metodo nao permitido." });
  const body = await readBody(req);
  const user = authenticate(body.username, body.password);
  if (!user) return sendJson(res, 401, { error: "Login ou senha invalidos." });
  const roomId = cleanRoom(body.room || DEFAULT_ROOM);
  const room = await ensureRoom(roomId);
  const redirect = sessionUrl(roomId, room, user);
  const session = sessionPayload(roomId, room, user);
  return sendJson(res, 200, {
    ok: true,
    role: user.role,
    slot: user.slot,
    name: user.name,
    room: roomId,
    session,
    redirect,
    origin: `${url.protocol}//${url.host}`,
  });
}

async function handleRoom(req, res, url = requestUrl(req)) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Metodo nao permitido." });
  const roomId = roomFromRequest(url, "/api/room/");
  const room = await ensureRoom(roomId);
  const role = url.searchParams.get("role") || "gm";
  const key = url.searchParams.get("key") || "";
  if (role === "gm" && key && key !== room.gmKey) return sendJson(res, 403, { error: "Chave do mestre invalida." });
  if (role !== "gm" && !validPlayer(room, url)) return sendJson(res, 403, { error: "Chave do jogador invalida." });
  return sendJson(res, 200, roomLinks(roomId, room));
}

async function handleState(req, res, url = requestUrl(req)) {
  const roomId = roomFromRequest(url, "/api/state/");
  const room = await ensureRoom(roomId);
  if (req.method === "GET") {
    if (!authorized(room, url)) return sendJson(res, 403, { error: "Acesso negado." });
    return sendJson(res, 200, { state: room.state || {}, empty: !room.updatedAt, updatedAt: room.updatedAt || null });
  }
  if (req.method !== "POST") return sendJson(res, 405, { error: "Metodo nao permitido." });
  if (!authorized(room, url)) return sendJson(res, 403, { error: "Acesso negado." });
  const body = await readBody(req);
  const role = url.searchParams.get("role") || "gm";
  const nextState = role === "player" ? mergePlayerState(room.state || {}, body, Number(url.searchParams.get("slot"))) : sanitizeState(body);
  room.state = nextState;
  room.updatedAt = new Date().toISOString();
  await writeRoom(roomId, room);
  broadcast(roomId, { type: "state", state: room.state, updatedAt: room.updatedAt });
  return sendJson(res, 200, { ok: true, updatedAt: room.updatedAt });
}

async function handleEvents(req, res, url = requestUrl(req)) {
  if (req.method !== "GET") return sendJson(res, 405, { error: "Metodo nao permitido." });
  const roomId = roomFromRequest(url, "/api/events/");
  const room = await ensureRoom(roomId);
  if (!authorized(room, url)) return sendJson(res, 403, { error: "Acesso negado." });
  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.write(`event: state\ndata: ${JSON.stringify({ type: "state", state: room.state || {}, updatedAt: room.updatedAt || null })}\n\n`);
  const list = clients.get(roomId) || new Set();
  list.add(res);
  clients.set(roomId, list);
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 15000);
  const vercelClose = process.env.VERCEL ? setTimeout(() => res.end(), 25000) : null;
  req.on("close", () => {
    clearInterval(heartbeat);
    if (vercelClose) clearTimeout(vercelClose);
    list.delete(res);
  });
}

function roomLinks(roomId, room) {
  return {
    room: roomId,
    gm: `/mesa-danubia.html?role=gm&room=${roomId}&key=${room.gmKey}#map`,
    players: room.playerKeys.map((playerKey, index) => `/mesa-danubia.html?role=player&room=${roomId}&slot=${index + 1}&key=${playerKey}#mesa`),
  };
}

function sessionUrl(roomId, room, user) {
  const session = sessionPayload(roomId, room, user);
  const query = new URLSearchParams({ role: session.role, room: session.room, key: session.key });
  if (session.slot) query.set("slot", String(session.slot));
  return `/mesa-danubia.html?${query.toString()}${session.role === "gm" ? "#map" : "#mesa"}`;
}

function sessionPayload(roomId, room, user) {
  const key = user.role === "player" ? room.playerKeys[user.slot - 1] : room.gmKey;
  return {
    role: user.role,
    room: roomId,
    slot: user.slot || 0,
    key,
    name: user.name,
  };
}

function authorized(room, url) {
  const role = url.searchParams.get("role") || "gm";
  const key = url.searchParams.get("key") || "";
  if (role === "player") return validPlayer(room, url);
  return key === room.gmKey;
}

function validPlayer(room, url) {
  const slot = Number(url.searchParams.get("slot"));
  const key = url.searchParams.get("key") || "";
  return Number.isInteger(slot) && slot >= 1 && slot <= 5 && room.playerKeys[slot - 1] === key;
}

function broadcast(roomId, payload) {
  const list = clients.get(roomId);
  if (!list) return;
  const data = `event: state\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of list) res.write(data);
}

function roomFromRequest(url, prefix) {
  const fromQuery = url.searchParams.get("room");
  if (fromQuery) return cleanRoom(fromQuery);
  const pathname = url.pathname || "";
  const afterPrefix = pathname.startsWith(prefix) ? pathname.slice(prefix.length).split("/")[0] : "";
  return cleanRoom(afterPrefix || DEFAULT_ROOM);
}

function requestUrl(req) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  return new URL(req.url || "/", `${proto}://${req.headers.host || "localhost"}`);
}

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 12 * 1024 * 1024) {
        reject(new Error("Payload grande demais."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        const type = String(req.headers["content-type"] || "");
        if (!raw) return resolve({});
        if (type.includes("application/x-www-form-urlencoded")) {
          return resolve(Object.fromEntries(new URLSearchParams(raw)));
        }
        return resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

module.exports = {
  handleLogin,
  handleRoom,
  handleState,
  handleEvents,
  roomLinks,
};
