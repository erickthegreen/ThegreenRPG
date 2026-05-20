(() => {
  "use strict";

  const STORAGE_KEY = "danubia-mesa-tools-v1";
  const SESSION_KEY = "danubia-online-session";
  const params = new URLSearchParams(location.search);
  const room = clean(params.get("room") || "");
  if (!room) {
    const session = readSession();
    if (requiresLogin() && session) location.replace(sessionUrl(session, location.hash || "#mesa"));
    else if (requiresLogin()) location.replace("/login.html");
    return;
  }

  const role = params.get("role") === "player" ? "player" : "gm";
  const slot = clamp(parseInt(params.get("slot") || "0", 10) || 0, 0, 5);
  const key = params.get("key") || "";
  const isPlayer = role === "player";
  if (!key && requiresLogin()) {
    const session = readSession();
    if (session) location.replace(sessionUrl(session, location.hash || "#mesa"));
    else location.replace("/login.html");
    return;
  }
  let applyingRemote = false;
  let sendTimer = null;
  let lastSent = "";
  let lastRemoteRaw = "";
  let eventSource = null;
  let pollTimer = null;

  init();

  function init() {
    document.body.classList.add("online-mode");
    if (isPlayer) {
      document.body.classList.add("online-tabs");
      if (!location.hash) history.replaceState(null, "", `${location.pathname}${location.search}#mesa`);
    }
    rememberSession();
    bindSessionLinks();
    renderStatus("Conectando", `${isPlayer ? `Jogador ${slot}` : "Mestre"} | sala ${room}`);
    bindPermissionControls();
    fetchInitialState();
    connectEvents();
    pollTimer = setInterval(fetchRemoteState, 4000);
    window.addEventListener("danubia:state-saved", () => {
      if (applyingRemote) return;
      scheduleSend();
    });
    window.addEventListener("hashchange", enforcePlayerTabs);
  }

  async function fetchInitialState() {
    try {
      const payload = await loadRemoteState();
      const localRaw = localStorage.getItem(STORAGE_KEY) || "{}";
      const localHasState = localRaw.length > 20;
      if (payload.empty && role === "gm" && localHasState) {
        await sendState(JSON.parse(localRaw));
      } else {
        applyState(payload.state || {});
      }
      renderStatus("Online", `${isPlayer ? `Jogador ${slot}` : "Mestre"} | sala ${room}`);
    } catch (error) {
      renderStatus("Offline", "Servidor online nao respondeu.");
    }
  }

  async function fetchRemoteState() {
    try {
      const payload = await loadRemoteState();
      const localRaw = localStorage.getItem(STORAGE_KEY) || "{}";
      if (payload.empty && role === "gm" && localRaw.length > 20) {
        await sendState(JSON.parse(localRaw));
        return;
      }
      const raw = JSON.stringify(payload.state || {});
      if (raw && raw !== lastRemoteRaw) applyState(payload.state || {});
      renderStatus("Online", `${isPlayer ? `Jogador ${slot}` : "Mestre"} | sala ${room}`);
    } catch {
      renderStatus("Reconectando", `Sala ${room}`);
    }
  }

  async function loadRemoteState() {
    const response = await fetch(apiUrl("state"), { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function connectEvents() {
    if (!window.EventSource) return;
    eventSource = new EventSource(apiUrl("events"));
    eventSource.addEventListener("state", (event) => {
      try {
        const payload = JSON.parse(event.data || "{}");
        if (payload.state) applyState(payload.state);
      } catch {
        // Ignore malformed event payloads.
      }
    });
    eventSource.onerror = () => renderStatus("Reconectando", `Sala ${room}`);
  }

  function bindPermissionControls() {
    if (isPlayer) return;
    document.querySelectorAll("[data-player-tab-toggle]").forEach((input) => {
      input.addEventListener("change", () => {
        const state = readState();
        state.permissions = state.permissions || {};
        state.permissions.playerTabs = selectedPlayerTabs();
        saveLocalState(state);
        scheduleSend();
      });
    });
    applyPermissionControls(readState().permissions);
  }

  function applyState(state) {
    applyingRemote = true;
    lastRemoteRaw = JSON.stringify(state || {});
    saveLocalState(state || {});
    applyPermissionControls(state?.permissions);
    if (window.MesaCombate?.loadPayload) {
      window.MesaCombate.loadPayload(JSON.stringify(state || {}));
    }
    enforcePlayerTabs();
    applyingRemote = false;
  }

  function saveLocalState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state || {}));
  }

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function selectedPlayerTabs() {
    const tabs = Array.from(document.querySelectorAll("[data-player-tab-toggle]"))
      .filter((input) => input.checked)
      .map((input) => input.dataset.playerTabToggle)
      .filter(Boolean);
    return tabs.length ? tabs : ["mesa"];
  }

  function applyPermissionControls(permissions) {
    const allowed = allowedTabs(permissions);
    document.querySelectorAll("[data-player-tab-toggle]").forEach((input) => {
      input.checked = allowed.includes(input.dataset.playerTabToggle);
    });
    if (!isPlayer) return;
    document.querySelectorAll(".mode-link").forEach((link) => {
      link.hidden = true;
      link.setAttribute("aria-hidden", "true");
    });
    document.querySelectorAll(".mode-tab").forEach((button) => {
      const mode = button.dataset.mode;
      button.hidden = !allowed.includes(mode);
    });
  }

  function enforcePlayerTabs() {
    if (!isPlayer) return;
    const allowed = allowedTabs(readState().permissions);
    const mode = location.hash.replace("#", "") || "mesa";
    if (allowed.includes(mode)) return;
    const next = allowed[0] || "mesa";
    const button = document.querySelector(`.mode-tab[data-mode='${next}']`);
    if (button) button.click();
    else history.replaceState(null, "", `#${next}`);
  }

  function allowedTabs(permissions) {
    const tabs = Array.isArray(permissions?.playerTabs) ? permissions.playerTabs : ["mesa"];
    const cleanTabs = tabs.filter((tab) => ["map", "city", "dungeon", "mesa"].includes(tab));
    return cleanTabs.length ? cleanTabs : ["mesa"];
  }

  function scheduleSend() {
    clearTimeout(sendTimer);
    sendTimer = setTimeout(() => sendState(readState()), 350);
  }

  async function sendState(state) {
    const raw = JSON.stringify(state || {});
    if (raw === lastSent) return;
    lastSent = raw;
    const response = await fetch(apiUrl("state"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    });
    if (!response.ok) {
      renderStatus("Erro", "Nao consegui salvar online.");
      return;
    }
    renderStatus("Online", `${isPlayer ? `Jogador ${slot}` : "Mestre"} | salvo`);
  }

  function apiUrl(kind) {
    const query = new URLSearchParams({ role, room, key });
    if (slot) query.set("slot", String(slot));
    return `/api/${kind}/${room}?${query.toString()}`;
  }

  function rememberSession() {
    if (!key) return;
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      role,
      room,
      slot,
      key,
      name: isPlayer ? `Jogador ${slot}` : "Mestre",
    }));
  }

  function bindSessionLinks() {
    document.querySelectorAll("a[href='index.html'], a[href='/index.html'], a[href='escudo.html'], a[href='/escudo.html'], a[href='/escudo']").forEach((link) => {
      if (isPlayer) {
        link.hidden = true;
        link.setAttribute("aria-hidden", "true");
        return;
      }
      const query = new URLSearchParams({ role, room, key });
      const target = link.getAttribute("href")?.includes("escudo") ? "/escudo.html" : "/index.html";
      link.href = `${target}?${query.toString()}`;
    });
  }

  function readSession() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (!session || !session.role || !session.room || !session.key) return null;
      return session;
    } catch {
      return null;
    }
  }

  function sessionUrl(session, hash) {
    const query = new URLSearchParams({
      role: session.role === "player" ? "player" : "gm",
      room: clean(session.room),
      key: session.key,
    });
    if (session.slot) query.set("slot", String(session.slot));
    const targetHash = hash || "#mesa";
    return `/mesa-danubia.html?${query.toString()}${targetHash}`;
  }

  function renderStatus(title, detail) {
    let node = document.querySelector("#danubiaOnlineStatus");
    if (!node) {
      node = document.createElement("div");
      node.id = "danubiaOnlineStatus";
      node.className = "online-status";
      document.body.appendChild(node);
    }
    node.innerHTML = `<strong>${escapeHtml(title)}</strong> ${escapeHtml(detail || "")}`;
  }

  function clean(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 48);
  }

  function requiresLogin() {
    if (location.protocol === "file:") return false;
    return !["localhost", "127.0.0.1", ""].includes(location.hostname);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);
  }
})();
