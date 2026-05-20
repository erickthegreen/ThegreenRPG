"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { DEFAULT_ROOM, cleanRoom, ensureRoom } = require("../lib/danubia-store");

module.exports = async function escudo(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    res.end("Metodo nao permitido.");
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host || "danubia.local"}`);
  const roomId = cleanRoom(url.searchParams.get("room") || DEFAULT_ROOM);
  const room = await ensureRoom(roomId);
  const role = url.searchParams.get("role") || "";
  const key = url.searchParams.get("key") || "";

  if (role !== "gm" || key !== room.gmKey) {
    res.writeHead(302, { Location: "/login.html", "Cache-Control": "no-store" });
    res.end();
    return;
  }

  const filePath = path.join(process.cwd(), "escudo.html");
  const data = await fs.readFile(filePath);
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  if (req.method === "HEAD") return res.end();
  res.end(data);
};
