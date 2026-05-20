"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { DEFAULT_ROOM, cleanRoom, ensureRoom } = require("../lib/danubia-store");

module.exports = async function compendio(req, res) {
  const url = new URL(req.url || "/", `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host || "localhost"}`);
  const roomId = cleanRoom(url.searchParams.get("room") || DEFAULT_ROOM);
  const key = url.searchParams.get("key") || "";
  const role = url.searchParams.get("role") || "";
  const room = await ensureRoom(roomId);
  if (role !== "gm" || key !== room.gmKey) {
    res.writeHead(302, { Location: "/login.html", "Cache-Control": "no-store" });
    res.end();
    return;
  }
  const html = await fs.readFile(path.join(process.cwd(), "index.html"), "utf8");
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
  res.end(html);
};
