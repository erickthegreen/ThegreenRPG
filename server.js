"use strict";

const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { DEFAULT_ROOM, cleanRoom, ensureRoom } = require("./lib/danubia-store");
const { handleLogin, handleRoom, handleState, handleEvents, roomLinks } = require("./lib/danubia-api");

const PORT = Number(process.env.PORT || 8767);
const ROOT = __dirname;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/api/login") return handleLogin(req, res, url);
    if (url.pathname.startsWith("/api/room/")) return handleRoom(req, res, url);
    if (url.pathname.startsWith("/api/state/")) return handleState(req, res, url);
    if (url.pathname.startsWith("/api/events/")) return handleEvents(req, res, url);
    if (url.pathname === "/index.html" || url.pathname === "/compendio") return serveProtectedPage(req, res, url, "index.html");
    if (url.pathname === "/escudo.html" || url.pathname === "/escudo") return serveProtectedPage(req, res, url, "escudo.html");
    return serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "Erro interno do servidor." });
  }
});

server.listen(PORT, async () => {
  const room = await ensureRoom(DEFAULT_ROOM);
  const links = roomLinks(DEFAULT_ROOM, room);
  console.log(`Danubia online em http://127.0.0.1:${PORT}/login.html`);
  console.log(`Mestre: http://127.0.0.1:${PORT}${links.gm}`);
  links.players.forEach((playerUrl, index) => {
    console.log(`Jogador ${index + 1}: http://127.0.0.1:${PORT}${playerUrl}`);
  });
});

async function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendText(res, 405, "Metodo nao permitido.");
  }
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/login.html";
  const filePath = path.normalize(path.join(ROOT, pathname));
  if (!filePath.startsWith(ROOT)) return sendText(res, 403, "Acesso negado.");
  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) return sendText(res, 403, "Diretorio negado.");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") return res.end();
    const data = await fs.readFile(filePath);
    res.end(data);
  } catch {
    sendText(res, 404, "Arquivo nao encontrado.");
  }
}

async function serveProtectedPage(req, res, url, filename) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendText(res, 405, "Metodo nao permitido.");
  }
  const roomId = cleanRoom(url.searchParams.get("room") || DEFAULT_ROOM);
  const room = await ensureRoom(roomId);
  const role = url.searchParams.get("role") || "";
  const key = url.searchParams.get("key") || "";
  if (role !== "gm" || key !== room.gmKey) {
    res.writeHead(302, { Location: "/login.html", "Cache-Control": "no-store" });
    res.end();
    return;
  }
  const filePath = path.join(ROOT, filename);
  const data = await fs.readFile(filePath);
  res.writeHead(200, { "Content-Type": mimeTypes[".html"], "Cache-Control": "no-store" });
  if (req.method === "HEAD") return res.end();
  res.end(data);
}

function sendJson(res, status, value) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(value));
}

function sendText(res, status, value) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end(value);
}
