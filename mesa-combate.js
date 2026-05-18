(() => {
  "use strict";

  const STORAGE_KEY = "danubia-mesa-tools-v1";
  const MONSTER_CACHE_KEY = "danubia-monsters-cache-v1";
  const CACHE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
  const CONDITIONS = [
    "Agarrado", "Amedrontado", "Atordoado", "Caido", "Cego", "Enfeiticado",
    "Envenenado", "Impedido", "Incapacitado", "Inconsciente", "Paralisado",
    "Petrificado", "Surdo"
  ];
  const SKILLS = [
    ["acrobatics", "Acrobacia", "dex"], ["animal_handling", "Adestrar Animais", "wis"],
    ["arcana", "Arcanismo", "int"], ["athletics", "Atletismo", "str"],
    ["deception", "Enganacao", "cha"], ["history", "Historia", "int"],
    ["insight", "Intuicao", "wis"], ["intimidation", "Intimidacao", "cha"],
    ["investigation", "Investigacao", "int"], ["medicine", "Medicina", "wis"],
    ["nature", "Natureza", "int"], ["perception", "Percepcao", "wis"],
    ["performance", "Atuacao", "cha"], ["persuasion", "Persuasao", "cha"],
    ["religion", "Religiao", "int"], ["sleight_of_hand", "Prestidigitacao", "dex"],
    ["stealth", "Furtividade", "dex"], ["survival", "Sobrevivencia", "wis"]
  ];
  const ABILITIES = [
    ["str", "Forca"], ["dex", "Destreza"], ["con", "Constituicao"],
    ["int", "Inteligencia"], ["wis", "Sabedoria"], ["cha", "Carisma"]
  ];
  const TOKEN_COLORS = {
    player: "#4e7388",
    monster: "#9f332c",
    npc: "#d2ad55",
    object: "#8d887b"
  };
  const MESA_GRID_MIN = 5;
  const MESA_GRID_MAX = 500;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const params = new URLSearchParams(location.search);
  const isPlayerView = params.get("view") === "player";
  let playerSlot = parseInt(params.get("slot") || "", 10);
  if (!Number.isInteger(playerSlot) || playerSlot < 1 || playerSlot > 5) playerSlot = null;

  const state = {
    tokens: [],
    grid: { cols: 20, rows: 15, cellPx: 64 },
    scene: null,
    view: { x: 80, y: 60, scale: 1 },
    initiative: [],
    selectedTokenId: null,
    round: 0,
    turnIndex: 0,
    diceHistory: [],
  };

  let sheets = Array.from({ length: 5 }, (_, index) => defaultSheet(index + 1));
  let monsters = [];
  let monsterCache = null;
  let currentSheetSlot = 1;
  let currentSheetTab = "stats";
  let currentMonster = null;
  let spriteUploadTarget = null;
  let persistTimer = null;
  let filterTimer = null;
  let lastPayloadRaw = "";
  const ui = {};

  const fallbackMonsters = makeFallbackMonsters();

  function init() {
    cacheDom();
    if (!ui.grid || !ui.viewport) return;
    hydrateFromStorage();
    bindControls();
    if (isPlayerView) setupPlayerView();
    syncInputs();
    render();
    loadMonsters(false);
    if (isPlayerView) {
      window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY) {
          hydrateFromStorage(event.newValue || "");
          render();
        }
      });
      setInterval(() => {
        const raw = localStorage.getItem(STORAGE_KEY) || "";
        if (raw !== lastPayloadRaw) {
          hydrateFromStorage(raw);
          render();
        }
      }, 500);
    }
  }

  function cacheDom() {
    Object.assign(ui, {
      viewport: $("#mesaGridViewport"),
      grid: $("#mesaGrid"),
      playerSlot: $("#mesaPlayerSlot"),
      openPlayer: $("#mesaOpenPlayerBtn"),
      cols: $("#mesaGridCols"),
      rows: $("#mesaGridRows"),
      cellSize: $("#mesaCellSize"),
      applyGrid: $("#mesaApplyGridBtn"),
      fitGrid: $("#mesaFitGridBtn"),
      addPlayer: $("#mesaAddPlayerBtn"),
      addMonster: $("#mesaAddMonsterBtn"),
      addNpc: $("#mesaAddNpcBtn"),
      addObject: $("#mesaAddObjectBtn"),
      sheetSlots: $("#mesaSheetSlots"),
      rollInitiative: $("#mesaRollInitiativeBtn"),
      addSelectedInitiative: $("#mesaAddSelectedInitiativeBtn"),
      prevTurn: $("#mesaPrevTurnBtn"),
      nextTurn: $("#mesaNextTurnBtn"),
      sortInitiative: $("#mesaSortInitiativeBtn"),
      clearInitiative: $("#mesaClearInitiativeBtn"),
      diceExpression: $("#mesaDiceExpression"),
      rollDice: $("#mesaRollDiceBtn"),
      shieldToggle: $("#mesaShieldToggle"),
      shieldBody: $("#mesaShieldBody"),
      gridReadout: $("#mesaGridReadout"),
      zoomReadout: $("#mesaZoomReadout"),
      tokenReadout: $("#mesaTokenReadout"),
      roundReadout: $("#mesaRoundReadout"),
      selectedToken: $("#mesaSelectedToken"),
      initiativeList: $("#mesaInitiativeList"),
      diceHistory: $("#mesaDiceHistory"),
      monsterSearch: $("#mesaMonsterSearch"),
      monsterCr: $("#mesaMonsterCr"),
      monsterType: $("#mesaMonsterType"),
      monsterSize: $("#mesaMonsterSize"),
      monsterStatus: $("#mesaMonsterStatus"),
      monsterList: $("#mesaMonsterList"),
      monsterRefresh: $("#mesaRefreshMonstersBtn"),
      monsterClearFilters: $("#mesaClearMonsterFiltersBtn"),
      sheetModal: $("#mesaSheetModal"),
      sheetTitle: $("#mesaSheetTitle"),
      sheetContent: $("#mesaSheetContent"),
      sheetClose: $("#mesaSheetCloseBtn"),
      monsterModal: $("#mesaMonsterModal"),
      monsterTitle: $("#mesaMonsterTitle"),
      monsterContent: $("#mesaMonsterContent"),
      monsterClose: $("#mesaMonsterCloseBtn"),
      spriteUpload: $("#mesaSpriteUpload"),
      playerPicker: $("#mesaPlayerSlotPicker"),
    });
  }

  function bindControls() {
    ui.openPlayer?.addEventListener("click", () => {
      const slot = parseInt(ui.playerSlot.value || "1", 10);
      const url = `${location.pathname}?view=player&slot=${slot}#mesa`;
      window.open(url, `danubia-jogador-${slot}`, "width=1280,height=800");
    });
    ui.applyGrid?.addEventListener("click", applyGridInputs);
    ui.fitGrid?.addEventListener("click", fitGridToViewport);
    $$("[data-mesa-grid-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const [cols, rows] = String(button.dataset.mesaGridPreset || "").split("x").map((value) => parseInt(value, 10));
        setGridSize(cols, rows, true);
      });
    });
    $$("[data-mesa-grid-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const step = parseInt(button.dataset.mesaGridStep, 10) || 0;
        setGridSize(state.grid.cols + step, state.grid.rows + step, true);
      });
    });
    ui.cellSize?.addEventListener("input", () => {
      state.grid.cellPx = clamp(parseInt(ui.cellSize.value, 10) || 64, 32, 96);
      syncInputs();
      render();
      persistSoon();
    });
    ui.addPlayer?.addEventListener("click", () => addToken("player"));
    ui.addMonster?.addEventListener("click", () => addToken("monster"));
    ui.addNpc?.addEventListener("click", () => addToken("npc"));
    ui.addObject?.addEventListener("click", () => addToken("object"));
    ui.rollInitiative?.addEventListener("click", rollAllInitiative);
    ui.addSelectedInitiative?.addEventListener("click", addSelectedToInitiative);
    ui.prevTurn?.addEventListener("click", () => moveTurn(-1));
    ui.nextTurn?.addEventListener("click", () => moveTurn(1));
    ui.sortInitiative?.addEventListener("click", sortInitiative);
    ui.clearInitiative?.addEventListener("click", clearInitiative);
    ui.rollDice?.addEventListener("click", () => rollDiceExpression(ui.diceExpression.value));
    ui.diceExpression?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") rollDiceExpression(ui.diceExpression.value);
    });
    ui.shieldToggle?.addEventListener("click", () => {
      ui.shieldBody.classList.toggle("is-collapsed");
      ui.shieldToggle.textContent = ui.shieldBody.classList.contains("is-collapsed") ? "Abrir escudo" : "Fechar escudo";
    });
    ui.viewport?.addEventListener("wheel", handleGridWheel, { passive: false });
    ui.viewport?.addEventListener("pointerdown", handleGridPointerDown);
    ui.sheetClose?.addEventListener("click", closeSheetModal);
    ui.monsterClose?.addEventListener("click", closeMonsterModal);
    ui.sheetModal?.addEventListener("click", (event) => {
      if (event.target === ui.sheetModal) closeSheetModal();
    });
    ui.monsterModal?.addEventListener("click", (event) => {
      if (event.target === ui.monsterModal) closeMonsterModal();
    });
    $$(".sheet-tabs button").forEach((button) => {
      button.addEventListener("click", () => {
        currentSheetTab = button.dataset.sheetTab;
        renderSheetModal();
      });
    });
    ui.spriteUpload?.addEventListener("change", handleSpriteUpload);
    [ui.monsterSearch, ui.monsterCr, ui.monsterType, ui.monsterSize].forEach((input) => {
      input?.addEventListener("input", () => {
        clearTimeout(filterTimer);
        filterTimer = setTimeout(renderMonsterList, 250);
      });
    });
    ui.monsterRefresh?.addEventListener("click", () => loadMonsters(true));
    ui.monsterClearFilters?.addEventListener("click", () => {
      ui.monsterSearch.value = "";
      ui.monsterCr.value = "30";
      ui.monsterType.value = "";
      ui.monsterSize.value = "";
      renderMonsterList();
    });
    window.addEventListener("danubia:state-saved", () => {
      lastPayloadRaw = localStorage.getItem(STORAGE_KEY) || "";
    });
  }

  function setupPlayerView() {
    document.body.classList.add("player-view");
    if (location.hash !== "#mesa") history.replaceState(null, "", `${location.pathname}${location.search}#mesa`);
    const badge = document.createElement("div");
    badge.className = "player-badge";
    badge.innerHTML = `<span id="mesaPlayerBadgeText">Visao do jogador</span> <button type="button" id="mesaPlayerSheetBtn">Ficha</button>`;
    $("#mesaFrame")?.appendChild(badge);
    $("#mesaPlayerSheetBtn")?.addEventListener("click", () => {
      if (playerSlot) openSheetModal(playerSlot);
    });
    renderPlayerSlotPicker();
  }

  function hydrateFromStorage(raw = localStorage.getItem(STORAGE_KEY) || "") {
    lastPayloadRaw = raw;
    let payload = {};
    try {
      payload = JSON.parse(raw || "{}");
    } catch {
      payload = {};
    }
    const storedMesa = payload.mesa || {};
    if (storedMesa.grid) {
      state.grid = {
        cols: clamp(parseInt(storedMesa.grid.cols, 10) || 20, MESA_GRID_MIN, MESA_GRID_MAX),
        rows: clamp(parseInt(storedMesa.grid.rows, 10) || 15, MESA_GRID_MIN, MESA_GRID_MAX),
        cellPx: clamp(parseInt(storedMesa.grid.cellPx, 10) || 64, 32, 96),
      };
    }
    if (storedMesa.view) {
      state.view = {
        x: Number.isFinite(storedMesa.view.x) ? storedMesa.view.x : state.view.x,
        y: Number.isFinite(storedMesa.view.y) ? storedMesa.view.y : state.view.y,
        scale: clamp(Number(storedMesa.view.scale) || 1, 0.03, 5),
      };
    }
    state.scene = normalizeScene(storedMesa.scene);
    state.tokens = Array.isArray(storedMesa.tokens) ? storedMesa.tokens.map(normalizeToken) : state.tokens;
    state.initiative = Array.isArray(storedMesa.initiative) ? storedMesa.initiative : [];
    state.selectedTokenId = storedMesa.selectedTokenId || state.selectedTokenId;
    state.round = Math.max(0, parseInt(storedMesa.round, 10) || 0);
    state.turnIndex = Math.max(0, parseInt(storedMesa.turnIndex, 10) || 0);
    state.diceHistory = Array.isArray(storedMesa.diceHistory) ? storedMesa.diceHistory.slice(0, 30) : state.diceHistory;
    sheets = normalizeSheets(payload.sheets);
    monsterCache = payload.monsters_cache || readMonsterCache();
    if (monsterCache?.data?.length) monsters = monsterCache.data.map(normalizeMonster);
  }

  function normalizeSheets(value) {
    const next = Array.from({ length: 5 }, (_, index) => defaultSheet(index + 1));
    if (!Array.isArray(value)) return next;
    value.slice(0, 5).forEach((sheet, index) => {
      next[index] = mergeDeep(defaultSheet(index + 1), sheet || {});
      next[index].slot = index + 1;
      recalcSheet(next[index]);
    });
    return next;
  }

  function normalizeToken(token) {
    const type = ["player", "monster", "npc", "object"].includes(token.type) ? token.type : "monster";
    return {
      id: token.id || uuid(),
      label: String(token.label || typeLabel(type)),
      type,
      col: clamp(parseInt(token.col, 10) || 0, 0, state.grid.cols - 1),
      row: clamp(parseInt(token.row, 10) || 0, 0, state.grid.rows - 1),
      spriteDataUrl: token.spriteDataUrl || null,
      spriteColor: token.spriteColor || TOKEN_COLORS[type],
      sizeCells: clamp(parseInt(token.sizeCells, 10) || 1, 1, 4),
      hp_current: Math.max(0, parseInt(token.hp_current, 10) || 1),
      hp_max: Math.max(1, parseInt(token.hp_max, 10) || 1),
      armor_class: Math.max(0, parseInt(token.armor_class, 10) || 10),
      conditions: Array.isArray(token.conditions) ? token.conditions.filter((item) => CONDITIONS.includes(item)) : [],
      monster_key: token.monster_key || null,
      sheet_slot: token.sheet_slot ? clamp(parseInt(token.sheet_slot, 10), 1, 5) : null,
      visible_to_players: token.visible_to_players !== false,
      hp_visible: token.hp_visible !== false,
      ac_visible: token.ac_visible !== false,
      initiative_roll: Number.isFinite(Number(token.initiative_roll)) ? Number(token.initiative_roll) : null,
    };
  }

  function normalizeScene(scene) {
    if (!scene || typeof scene !== "object" || !String(scene.imageDataUrl || "").startsWith("data:image/")) return null;
    return {
      type: String(scene.type || "image"),
      name: String(scene.name || "Mapa"),
      imageDataUrl: scene.imageDataUrl,
      cols: clamp(parseInt(scene.cols, 10) || state.grid.cols, MESA_GRID_MIN, MESA_GRID_MAX),
      rows: clamp(parseInt(scene.rows, 10) || state.grid.rows, MESA_GRID_MIN, MESA_GRID_MAX),
      cellPx: clamp(parseInt(scene.cellPx, 10) || state.grid.cellPx, 32, 96),
      importedAt: Number(scene.importedAt) || Date.now(),
    };
  }

  function exportMesaState() {
    return {
      tokens: state.tokens,
      grid: state.grid,
      scene: state.scene,
      view: state.view,
      initiative: state.initiative,
      selectedTokenId: state.selectedTokenId,
      round: state.round,
      turnIndex: state.turnIndex,
      diceHistory: state.diceHistory,
    };
  }

  function getPersistPayload() {
    return {
      mesa: exportMesaState(),
      sheets,
      monsters_cache: monsterCache,
    };
  }

  function persistSoon() {
    if (isPlayerView) return;
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistNow, 120);
  }

  function persistNow() {
    const payload = readPayload();
    payload.mesa = exportMesaState();
    payload.sheets = sheets;
    if (monsterCache) payload.monsters_cache = monsterCache;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (monsterCache) localStorage.setItem(MONSTER_CACHE_KEY, JSON.stringify(monsterCache));
    } catch (error) {
      const fallback = { ...payload, mesa: { ...payload.mesa, scene: null } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      alert("A cena da Mesa ficou grande demais para salvar no navegador. Ela esta visivel agora, mas pode sumir ao recarregar.");
    }
    lastPayloadRaw = localStorage.getItem(STORAGE_KEY) || "";
    const saveStatus = $("#saveStatus");
    if (saveStatus) {
      const now = new Date();
      saveStatus.textContent = `Salvo ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    }
    window.dispatchEvent(new CustomEvent("danubia:state-saved", { detail: payload }));
  }

  function readPayload() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function syncInputs() {
    if (ui.cols) ui.cols.value = state.grid.cols;
    if (ui.rows) ui.rows.value = state.grid.rows;
    if (ui.cellSize) ui.cellSize.value = state.grid.cellPx;
  }

  function render() {
    renderGrid();
    renderTokens();
    renderSheetSlots();
    renderTokenPanel();
    renderInitiative();
    renderDiceHistory();
    renderReadouts();
    renderPlayerBadge();
    if (!ui.sheetModal?.classList.contains("is-hidden")) renderSheetModal();
  }

  function renderGrid() {
    const { cols, rows, cellPx } = state.grid;
    ui.grid.style.width = `${cols * cellPx}px`;
    ui.grid.style.height = `${rows * cellPx}px`;
    ui.grid.style.backgroundSize = `${cellPx}px ${cellPx}px, ${cellPx}px ${cellPx}px, 32px 32px, auto`;
    ui.grid.style.setProperty("--mesa-cell", `${cellPx}px`);
    ui.grid.classList.toggle("has-map-background", Boolean(state.scene?.imageDataUrl));
    ui.grid.style.transform = `translate(${state.view.x}px, ${state.view.y}px) scale(${state.view.scale})`;
  }

  function renderTokens() {
    const visibleTokens = state.tokens.filter((token) => !isPlayerView || token.visible_to_players);
    const sceneHtml = state.scene?.imageDataUrl
      ? `<img class="mesa-map-background" src="${attr(state.scene.imageDataUrl)}" alt="${attr(state.scene.name || "Mapa da cena")}"><div class="mesa-grid-lines"></div>`
      : "";
    ui.grid.innerHTML = sceneHtml + visibleTokens.map(tokenHtml).join("");
    $$(".mesa-token", ui.grid).forEach((node) => {
      const token = getToken(node.dataset.tokenId);
      if (!token) return;
      positionTokenElement(node, token);
      node.addEventListener("pointerdown", (event) => handleTokenPointerDown(event, token.id));
      node.addEventListener("click", (event) => {
        event.stopPropagation();
        selectToken(token.id);
      });
    });
  }

  function tokenHtml(token) {
    const hpPct = token.hp_max > 0 ? clamp(token.hp_current / token.hp_max, 0, 1) : 0;
    const hpClass = hpPct <= 0.1 ? "hp-bar-critical" : hpPct < 0.25 ? "hp-bar-low" : hpPct < 0.5 ? "hp-bar-medium" : "hp-bar-high";
    const hiddenClass = !token.visible_to_players ? " is-hidden-token" : "";
    const selectedClass = state.selectedTokenId === token.id ? " is-selected" : "";
    const meta = [];
    if (!isPlayerView || token.hp_visible) meta.push(`PV ${token.hp_current}/${token.hp_max}`);
    if (!isPlayerView || token.ac_visible) meta.push(`CA ${token.armor_class}`);
    token.conditions.slice(0, 3).forEach((condition) => meta.push(condition.slice(0, 3)));
    const sprite = token.spriteDataUrl
      ? `<img src="${attr(token.spriteDataUrl)}" alt="">`
      : escapeHtml(token.label.trim().charAt(0).toUpperCase() || "?");
    return `
      <div class="mesa-token token-${token.type}${hiddenClass}${selectedClass}" data-token-id="${attr(token.id)}">
        <div class="token-circle">${sprite}</div>
        <div class="token-hpbar"><span class="${hpClass}" style="width:${Math.round(hpPct * 100)}%"></span></div>
        <div class="token-label">${escapeHtml(token.label)}</div>
        <div class="token-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      </div>
    `;
  }

  function positionTokenElement(node, token) {
    const cell = state.grid.cellPx;
    const size = Math.max(1, token.sizeCells) * cell;
    node.style.left = `${token.col * cell}px`;
    node.style.top = `${token.row * cell}px`;
    node.style.width = `${size}px`;
    node.style.height = `${size}px`;
  }

  function handleGridWheel(event) {
    event.preventDefault();
    const rect = ui.viewport.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const before = screenToGrid(point.x, point.y);
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    state.view.scale = clamp(state.view.scale * factor, 0.03, 5);
    state.view.x = point.x - before.x * state.view.scale;
    state.view.y = point.y - before.y * state.view.scale;
    renderGrid();
    renderReadouts();
    persistSoon();
  }

  function handleGridPointerDown(event) {
    if (event.target.closest(".mesa-token")) return;
    if (event.button !== 0) return;
    const start = { x: event.clientX, y: event.clientY, vx: state.view.x, vy: state.view.y };
    ui.viewport.classList.add("is-panning");
    function move(ev) {
      state.view.x = start.vx + ev.clientX - start.x;
      state.view.y = start.vy + ev.clientY - start.y;
      renderGrid();
    }
    function up() {
      ui.viewport.classList.remove("is-panning");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      persistSoon();
    }
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  function handleTokenPointerDown(event, tokenId) {
    event.stopPropagation();
    selectToken(tokenId);
    if (isPlayerView || event.button !== 0) return;
    const token = getToken(tokenId);
    const node = event.currentTarget;
    if (!token || !node) return;
    node.classList.add("is-dragging");
    function move(ev) {
      const rect = ui.viewport.getBoundingClientRect();
      const point = screenToGrid(ev.clientX - rect.left, ev.clientY - rect.top);
      token.col = clamp(Math.floor(point.x / state.grid.cellPx), 0, state.grid.cols - token.sizeCells);
      token.row = clamp(Math.floor(point.y / state.grid.cellPx), 0, state.grid.rows - token.sizeCells);
      positionTokenElement(node, token);
    }
    function up() {
      node.classList.remove("is-dragging");
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      render();
      persistSoon();
    }
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  function screenToGrid(x, y) {
    return {
      x: (x - state.view.x) / state.view.scale,
      y: (y - state.view.y) / state.view.scale,
    };
  }

  function fitGridToViewport() {
    const rect = ui.viewport.getBoundingClientRect();
    const w = state.grid.cols * state.grid.cellPx;
    const h = state.grid.rows * state.grid.cellPx;
    state.view.scale = clamp(Math.min(rect.width / w, rect.height / h) * 0.92, 0.03, 5);
    state.view.x = (rect.width - w * state.view.scale) / 2;
    state.view.y = (rect.height - h * state.view.scale) / 2;
    render();
    persistSoon();
  }

  function applyGridInputs() {
    state.grid.cellPx = clamp(parseInt(ui.cellSize.value, 10) || 64, 32, 96);
    setGridSize(parseInt(ui.cols.value, 10) || 20, parseInt(ui.rows.value, 10) || 15, false);
  }

  function setGridSize(cols, rows, fit) {
    state.grid.cols = clamp(parseInt(cols, 10) || 20, MESA_GRID_MIN, MESA_GRID_MAX);
    state.grid.rows = clamp(parseInt(rows, 10) || 15, MESA_GRID_MIN, MESA_GRID_MAX);
    state.tokens.forEach((token) => {
      token.col = clamp(token.col, 0, state.grid.cols - token.sizeCells);
      token.row = clamp(token.row, 0, state.grid.rows - token.sizeCells);
    });
    syncInputs();
    if (fit) {
      fitGridToViewport();
    } else {
      render();
      persistSoon();
    }
  }

  function importDungeonMap(payload) {
    if (isPlayerView || !payload) return false;
    const cols = clamp(parseInt(payload.cols, 10) || 20, MESA_GRID_MIN, MESA_GRID_MAX);
    const rows = clamp(parseInt(payload.rows, 10) || 15, MESA_GRID_MIN, MESA_GRID_MAX);
    const cellPx = clamp(parseInt(payload.cellPx, 10) || 64, 32, 96);
    state.grid = { cols, rows, cellPx };
    state.scene = normalizeScene({
      type: "dungeon",
      name: payload.name || "Masmorra",
      imageDataUrl: payload.imageDataUrl,
      cols,
      rows,
      cellPx,
      importedAt: Date.now(),
    });
    if (!state.scene) return false;
    state.tokens.forEach((token) => {
      token.col = clamp(token.col, 0, Math.max(0, state.grid.cols - token.sizeCells));
      token.row = clamp(token.row, 0, Math.max(0, state.grid.rows - token.sizeCells));
    });
    syncInputs();
    fitGridToViewport();
    persistNow();
    return true;
  }

  function addToken(type, monster = null) {
    if (isPlayerView) return;
    const slot = type === "player" ? firstOpenSheetSlot() : null;
    const token = normalizeToken({
      id: uuid(),
      label: monster?.name || (slot ? sheets[slot - 1].char_name || `Jogador ${slot}` : typeLabel(type)),
      type,
      col: 0,
      row: 0,
      spriteColor: TOKEN_COLORS[type],
      hp_current: monster?.hp || (slot ? sheets[slot - 1].hp_current || 10 : 10),
      hp_max: monster?.hp || (slot ? sheets[slot - 1].hp_max || 10 : 10),
      armor_class: monster?.ac || (slot ? sheets[slot - 1].ac || 10 : 10),
      monster_key: monster?.key || null,
      sheet_slot: slot,
      visible_to_players: type !== "monster",
      hp_visible: type === "player",
      ac_visible: type === "player",
    });
    const open = firstOpenCell(token.sizeCells);
    token.col = open.col;
    token.row = open.row;
    state.tokens.push(token);
    state.selectedTokenId = token.id;
    syncSheetFromToken(token);
    render();
    persistSoon();
  }

  function firstOpenCell(size) {
    for (let row = 0; row <= state.grid.rows - size; row += 1) {
      for (let col = 0; col <= state.grid.cols - size; col += 1) {
        const blocked = state.tokens.some((token) => rectsOverlap(col, row, size, size, token.col, token.row, token.sizeCells, token.sizeCells));
        if (!blocked) return { col, row };
      }
    }
    return { col: 0, row: 0 };
  }

  function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  function selectToken(id) {
    state.selectedTokenId = id;
    render();
    persistSoon();
  }

  function renderTokenPanel() {
    if (!ui.selectedToken) return;
    const token = getToken(state.selectedTokenId);
    if (!token) {
      ui.selectedToken.innerHTML = `<div class="empty-state">Clique em um token no grid.</div>`;
      return;
    }
    const disabled = isPlayerView ? "disabled" : "";
    ui.selectedToken.innerHTML = `
      <div class="token-editor-grid">
        ${fieldHtml("Nome", "label", token.label, "text", disabled)}
        <label class="field-row">Tipo
          <select data-token-field="type" ${disabled}>
            ${["player", "monster", "npc", "object"].map((type) => `<option value="${type}" ${token.type === type ? "selected" : ""}>${typeLabel(type)}</option>`).join("")}
          </select>
        </label>
        ${fieldHtml("PV atual", "hp_current", token.hp_current, "number", disabled)}
        ${fieldHtml("PV max.", "hp_max", token.hp_max, "number", disabled)}
        ${fieldHtml("CA", "armor_class", token.armor_class, "number", disabled)}
        ${fieldHtml("Tamanho", "sizeCells", token.sizeCells, "number", disabled, "1", "4")}
        <label class="field-row">Ficha
          <select data-token-field="sheet_slot" ${disabled}>
            <option value="">Nenhuma</option>
            ${sheets.map((sheet) => `<option value="${sheet.slot}" ${token.sheet_slot === sheet.slot ? "selected" : ""}>Slot ${sheet.slot} - ${escapeHtml(sheet.char_name || "sem nome")}</option>`).join("")}
          </select>
        </label>
      </div>
      <div class="visibility-grid">
        ${checkHtml("Visivel para jogadores", "visible_to_players", token.visible_to_players, disabled)}
        ${checkHtml("Mostrar PV", "hp_visible", token.hp_visible, disabled)}
        ${checkHtml("Mostrar CA", "ac_visible", token.ac_visible, disabled)}
      </div>
      <div class="section-title">Condicoes</div>
      <div class="condition-grid">
        ${CONDITIONS.map((condition) => `
          <label><input type="checkbox" data-token-condition="${attr(condition)}" ${token.conditions.includes(condition) ? "checked" : ""} ${disabled}> ${escapeHtml(condition)}</label>
        `).join("")}
      </div>
      <div class="token-editor-actions">
        <button type="button" data-token-action="sprite" ${disabled}>Upload sprite</button>
        <button type="button" data-token-action="monster" ${disabled}>Ficha monstro</button>
        <button type="button" data-token-action="remove" ${disabled}>Remover</button>
      </div>
    `;
    bindTokenPanel(token);
  }

  function bindTokenPanel(token) {
    $$("[data-token-field]", ui.selectedToken).forEach((input) => {
      input.addEventListener("input", () => {
        const key = input.dataset.tokenField;
        if (input.type === "checkbox") token[key] = input.checked;
        else if (["hp_current", "hp_max", "armor_class", "sizeCells"].includes(key)) token[key] = parseInt(input.value, 10) || 0;
        else if (key === "sheet_slot") token[key] = input.value ? parseInt(input.value, 10) : null;
        else token[key] = input.value;
        token.sizeCells = clamp(token.sizeCells, 1, 4);
        token.col = clamp(token.col, 0, state.grid.cols - token.sizeCells);
        token.row = clamp(token.row, 0, state.grid.rows - token.sizeCells);
        token.hp_max = Math.max(1, token.hp_max);
        token.hp_current = clamp(token.hp_current, 0, token.hp_max);
        token.spriteColor = TOKEN_COLORS[token.type] || token.spriteColor;
        if (key === "sheet_slot") syncTokenFromSheet(token);
        else syncSheetFromToken(token);
        render();
        persistSoon();
      });
      input.addEventListener("change", () => input.dispatchEvent(new Event("input")));
    });
    $$("[data-token-condition]", ui.selectedToken).forEach((input) => {
      input.addEventListener("change", () => {
        const condition = input.dataset.tokenCondition;
        token.conditions = input.checked
          ? unique([...token.conditions, condition])
          : token.conditions.filter((item) => item !== condition);
        render();
        persistSoon();
      });
    });
    $$("[data-token-action]", ui.selectedToken).forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.tokenAction;
        if (action === "remove") removeToken(token.id);
        if (action === "sprite") {
          spriteUploadTarget = token.id;
          ui.spriteUpload.value = "";
          ui.spriteUpload.click();
        }
        if (action === "monster") {
          const monster = monsters.find((item) => item.key === token.monster_key);
          if (monster) openMonsterModal(monster);
        }
      });
    });
  }

  function removeToken(id) {
    state.tokens = state.tokens.filter((token) => token.id !== id);
    state.initiative = state.initiative.filter((entry) => entry.id !== id);
    if (state.selectedTokenId === id) state.selectedTokenId = null;
    render();
    persistSoon();
  }

  function handleSpriteUpload() {
    const file = ui.spriteUpload.files?.[0];
    const token = getToken(spriteUploadTarget);
    if (!file || !token) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      alert("Use PNG, JPG ou WEBP com ate 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      token.spriteDataUrl = String(reader.result || "");
      render();
      persistSoon();
    };
    reader.readAsDataURL(file);
  }

  function renderSheetSlots() {
    if (!ui.sheetSlots) return;
    ui.sheetSlots.innerHTML = sheets.map((sheet) => `
      <button type="button" class="sheet-slot-card" data-sheet-slot="${sheet.slot}">
        <span><strong>Slot ${sheet.slot}</strong><br>${escapeHtml(sheet.char_name || "Personagem sem nome")}</span>
        <span>${escapeHtml(sheet.class_level || "Nivel")}</span>
      </button>
    `).join("");
    $$("[data-sheet-slot]", ui.sheetSlots).forEach((button) => {
      button.addEventListener("click", () => openSheetModal(parseInt(button.dataset.sheetSlot, 10)));
    });
  }

  function openSheetModal(slot) {
    currentSheetSlot = clamp(slot, 1, 5);
    currentSheetTab = currentSheetTab || "stats";
    ui.sheetModal?.classList.remove("is-hidden");
    renderSheetModal();
  }

  function closeSheetModal() {
    ui.sheetModal?.classList.add("is-hidden");
  }

  function renderSheetModal() {
    if (!ui.sheetModal || ui.sheetModal.classList.contains("is-hidden")) return;
    const sheet = sheets[currentSheetSlot - 1];
    recalcSheet(sheet);
    ui.sheetTitle.textContent = `Slot ${sheet.slot} - ${sheet.char_name || "Personagem"}`;
    $$(".sheet-tabs button").forEach((button) => button.classList.toggle("active", button.dataset.sheetTab === currentSheetTab));
    const disabled = isPlayerView ? "disabled" : "";
    if (currentSheetTab === "appearance") ui.sheetContent.innerHTML = appearanceTab(sheet, disabled);
    else if (currentSheetTab === "spells") ui.sheetContent.innerHTML = spellsTab(sheet, disabled);
    else ui.sheetContent.innerHTML = statsTab(sheet, disabled);
    bindSheetInputs(sheet);
  }

  function statsTab(sheet, disabled) {
    return `
      <div class="sheet-section">
        <h3>Identidade</h3>
        <div class="sheet-grid">
          ${sheetField("Jogador", "player_name", sheet.player_name, "text", disabled)}
          ${sheetField("Personagem", "char_name", sheet.char_name, "text", disabled)}
          ${sheetField("Classe e nivel", "class_level", sheet.class_level, "text", disabled)}
          ${sheetField("Antecedente", "background", sheet.background, "text", disabled)}
          ${sheetField("Raca", "race", sheet.race, "text", disabled)}
          ${sheetField("Tendencia", "alignment", sheet.alignment, "text", disabled)}
          ${sheetField("XP", "xp", sheet.xp, "number", disabled)}
          <label class="sheet-field">Token
            <select id="mesaSheetTokenLink" ${disabled}>
              <option value="">Nenhum</option>
              ${state.tokens.map((token) => `<option value="${attr(token.id)}" ${token.sheet_slot === sheet.slot ? "selected" : ""}>${escapeHtml(token.label)}</option>`).join("")}
            </select>
          </label>
        </div>
        <button type="button" id="mesaSheetLinkBtn" ${disabled}>Vincular ao token</button>
      </div>
      <div class="sheet-section">
        <h3>Atributos</h3>
        <div class="sheet-grid">
          ${ABILITIES.map(([key, label]) => attrBox(label, key, sheet[key], mod(sheet[key]), disabled)).join("")}
        </div>
      </div>
      <div class="sheet-section">
        <h3>Combate</h3>
        <div class="sheet-grid">
          ${sheetCheck("Inspiracao", "inspiration", sheet.inspiration, disabled)}
          ${sheetField("Bonus prof.", "proficiency_bonus", sheet.proficiency_bonus, "number", disabled)}
          ${sheetField("CA", "ac", sheet.ac, "number", disabled)}
          ${sheetField("Iniciativa", "initiative_bonus", sheet.initiative_bonus, "number", disabled)}
          ${sheetField("Deslocamento", "speed", sheet.speed, "number", disabled)}
          ${sheetField("PV max.", "hp_max", sheet.hp_max, "number", disabled)}
          ${sheetField("PV atual", "hp_current", sheet.hp_current, "number", disabled)}
          ${sheetField("PV temp.", "hp_temp", sheet.hp_temp, "number", disabled)}
          ${sheetField("Dados de vida", "hit_dice", sheet.hit_dice, "text", disabled)}
          ${sheetField("Sucessos morte", "death_saves.success", sheet.death_saves.success, "number", disabled)}
          ${sheetField("Falhas morte", "death_saves.failure", sheet.death_saves.failure, "number", disabled)}
          <div class="sheet-field"><span>Percepcao passiva</span><div class="attr-mod">${sheet.passive_perception}</div></div>
        </div>
      </div>
      <div class="sheet-section">
        <h3>Salvaguardas</h3>
        <div class="sheet-grid">
          ${ABILITIES.map(([key, label]) => saveRow(sheet, key, label, disabled)).join("")}
        </div>
      </div>
      <div class="sheet-section">
        <h3>Pericias</h3>
        <div class="sheet-grid">
          ${SKILLS.map(([key, label, ability]) => skillRow(sheet, key, label, ability, disabled)).join("")}
        </div>
      </div>
      <div class="sheet-section">
        <h3>Ataques</h3>
        <div class="sheet-grid">
          ${sheet.attacks.map((attack, index) => `
            <div class="sheet-field">
              <label>Ataque ${index + 1}<input data-sheet-field="attacks.${index}.name" value="${attr(attack.name)}" ${disabled}></label>
              <label>Bonus<input data-sheet-field="attacks.${index}.bonus" value="${attr(attack.bonus)}" ${disabled}></label>
              <label>Dano<input data-sheet-field="attacks.${index}.damage" value="${attr(attack.damage)}" ${disabled}></label>
            </div>
          `).join("")}
        </div>
      </div>
      <div class="sheet-section">
        <h3>Equipamento e personalidade</h3>
        <div class="sheet-grid">
          ${["cp", "sp", "ep", "gp", "pp"].map((coin) => sheetField(coin.toUpperCase(), coin, sheet[coin], "number", disabled)).join("")}
        </div>
        ${textareaField("Equipamento", "equipment", sheet.equipment, disabled)}
        ${textareaField("Tracos", "traits", sheet.traits, disabled)}
        ${textareaField("Ideais", "ideals", sheet.ideals, disabled)}
        ${textareaField("Vinculos", "bonds", sheet.bonds, disabled)}
        ${textareaField("Defeitos", "flaws", sheet.flaws, disabled)}
        ${textareaField("Caracteristicas", "features", sheet.features, disabled)}
        ${textareaField("Idiomas e proficiencias", "languages", sheet.languages, disabled)}
      </div>
    `;
  }

  function appearanceTab(sheet, disabled) {
    return `
      <div class="sheet-section">
        <h3>Aparencia</h3>
        <div class="sheet-grid">
          ${sheetField("Idade", "age", sheet.age, "text", disabled)}
          ${sheetField("Altura", "height", sheet.height, "text", disabled)}
          ${sheetField("Peso", "weight", sheet.weight, "text", disabled)}
          ${sheetField("Olhos", "eyes", sheet.eyes, "text", disabled)}
          ${sheetField("Pele", "skin", sheet.skin, "text", disabled)}
          ${sheetField("Cabelo", "hair", sheet.hair, "text", disabled)}
        </div>
        ${textareaField("Notas de aparencia", "appearance_notes", sheet.appearance_notes, disabled)}
        ${textareaField("Historia", "backstory", sheet.backstory, disabled)}
        ${textareaField("Aliados", "allies", sheet.allies, disabled)}
        ${textareaField("Tesouro", "treasure", sheet.treasure, disabled)}
      </div>
    `;
  }

  function spellsTab(sheet, disabled) {
    return `
      <div class="sheet-section">
        <h3>Conjuracao</h3>
        <div class="sheet-grid">
          ${sheetField("Classe conjuradora", "spellcasting_class", sheet.spellcasting_class, "text", disabled)}
          ${sheetField("Atributo", "spellcasting_ability", sheet.spellcasting_ability, "text", disabled)}
          ${sheetField("CD", "spell_save_dc", sheet.spell_save_dc, "number", disabled)}
          ${sheetField("Ataque magico", "spell_attack_bonus", sheet.spell_attack_bonus, "number", disabled)}
        </div>
        ${textareaField("Truques, um por linha", "cantrips", sheet.cantrips.join("\\n"), disabled)}
      </div>
      <div class="sheet-section">
        <h3>Espacos</h3>
        <div class="spell-grid">
          ${Array.from({ length: 9 }, (_, index) => index + 1).map((level) => `
            <div class="sheet-field">
              <label>Nivel ${level}<input type="number" data-sheet-field="spell_slots.${level}" value="${sheet.spell_slots[level] || 0}" ${disabled}></label>
              <label>Usados<input type="number" data-sheet-field="spell_slots_used.${level}" value="${sheet.spell_slots_used[level] || 0}" ${disabled}></label>
              <textarea rows="4" data-sheet-field="spells.${level}" ${disabled}>${escapeHtml((sheet.spells[level] || []).map((spell) => spell.name || spell).join("\\n"))}</textarea>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function bindSheetInputs(sheet) {
    if (isPlayerView) return;
    $$("[data-sheet-field]", ui.sheetContent).forEach((input) => {
      input.addEventListener("input", () => {
        const path = input.dataset.sheetField;
        let value = input.type === "checkbox" ? input.checked : input.value;
        if (input.type === "number") value = parseInt(value, 10) || 0;
        if (path === "cantrips") value = linesToArray(input.value);
        if (/^spells\.\d+$/.test(path)) value = linesToArray(input.value).map((name) => ({ name, prepared: false }));
        setPath(sheet, path, value);
        recalcSheet(sheet);
        syncTokenFromSheetSlot(sheet.slot);
        renderSheetSlots();
        persistSoon();
      });
      input.addEventListener("change", () => input.dispatchEvent(new Event("input")));
    });
    $("#mesaSheetLinkBtn", ui.sheetContent)?.addEventListener("click", () => {
      const token = getToken($("#mesaSheetTokenLink", ui.sheetContent)?.value);
      if (!token) return;
      token.sheet_slot = sheet.slot;
      syncTokenFromSheet(token);
      state.selectedTokenId = token.id;
      render();
      persistSoon();
    });
  }

  function rollAllInitiative() {
    if (isPlayerView) return;
    state.tokens.forEach((token) => {
      const sheet = token.sheet_slot ? sheets[token.sheet_slot - 1] : null;
      token.initiative_roll = randomInt(1, 20) + (sheet ? Number(sheet.initiative_bonus || 0) : 0);
    });
    state.initiative = state.tokens
      .map((token) => ({ id: token.id, roll: token.initiative_roll || 0 }))
      .sort((a, b) => b.roll - a.roll);
    state.turnIndex = 0;
    state.round = Math.max(1, state.round || 1);
    render();
    persistSoon();
  }

  function addSelectedToInitiative() {
    if (isPlayerView) return;
    const token = getToken(state.selectedTokenId);
    if (!token) return;
    if (!state.initiative.some((entry) => entry.id === token.id)) {
      const sheet = token.sheet_slot ? sheets[token.sheet_slot - 1] : null;
      token.initiative_roll = token.initiative_roll ?? randomInt(1, 20) + (sheet ? Number(sheet.initiative_bonus || 0) : 0);
      state.initiative.push({ id: token.id, roll: token.initiative_roll || 0 });
    }
    state.turnIndex = clamp(state.turnIndex, 0, Math.max(0, state.initiative.length - 1));
    state.round = Math.max(1, state.round || 1);
    render();
    persistSoon();
  }

  function sortInitiative() {
    if (isPlayerView) return;
    const activeId = state.initiative[state.turnIndex]?.id;
    state.initiative.sort((a, b) => Number(b.roll || 0) - Number(a.roll || 0));
    const nextIndex = state.initiative.findIndex((entry) => entry.id === activeId);
    state.turnIndex = nextIndex >= 0 ? nextIndex : 0;
    render();
    persistSoon();
  }

  function clearInitiative() {
    if (isPlayerView) return;
    state.initiative = [];
    state.turnIndex = 0;
    state.round = 0;
    state.tokens.forEach((token) => {
      token.initiative_roll = null;
    });
    render();
    persistSoon();
  }

  function moveTurn(delta) {
    if (isPlayerView || !state.initiative.length) return;
    const next = state.turnIndex + delta;
    if (next >= state.initiative.length) {
      state.turnIndex = 0;
      state.round += 1;
    } else if (next < 0) {
      state.turnIndex = state.initiative.length - 1;
      state.round = Math.max(1, state.round - 1);
    } else {
      state.turnIndex = next;
    }
    render();
    persistSoon();
  }

  function renderInitiative() {
    if (!ui.initiativeList) return;
    normalizeInitiative();
    const visibleEntries = state.initiative
      .filter((entry) => !isPlayerView || getToken(entry.id)?.visible_to_players)
    const list = visibleEntries
      .map((entry) => {
        const token = getToken(entry.id);
        if (!token) return "";
        const index = state.initiative.findIndex((item) => item.id === entry.id);
        const active = state.initiative[state.turnIndex]?.id === entry.id;
        if (isPlayerView) {
          return `<div class="initiative-row ${active ? "is-active" : ""}"><strong>${entry.roll}</strong><span>${escapeHtml(token.label)}</span><span>${escapeHtml(typeLabel(token.type))}</span></div>`;
        }
        return `
          <div class="initiative-row initiative-edit-row ${active ? "is-active" : ""}" data-init-id="${attr(entry.id)}">
            <button type="button" data-init-action="active" title="Tornar turno atual">${active ? "Turno" : "Ativar"}</button>
            <span>
              <strong>${escapeHtml(token.label)}</strong>
              <small>${escapeHtml(typeLabel(token.type))}${token.conditions.length ? ` | ${escapeHtml(token.conditions.join(", "))}` : ""}</small>
            </span>
            <input type="number" data-init-roll="${attr(entry.id)}" value="${attr(entry.roll)}" />
            <button type="button" data-init-action="up" ${index <= 0 ? "disabled" : ""} title="Subir">Subir</button>
            <button type="button" data-init-action="down" ${index >= state.initiative.length - 1 ? "disabled" : ""} title="Descer">Descer</button>
            <button type="button" data-init-action="remove" title="Remover">X</button>
          </div>
        `;
      }).join("");
    ui.initiativeList.innerHTML = list || `<div class="empty-state">Nenhuma iniciativa rolada.</div>`;
    bindInitiativeList();
  }

  function bindInitiativeList() {
    if (isPlayerView) return;
    $$("[data-init-roll]", ui.initiativeList).forEach((input) => {
      input.addEventListener("input", () => {
        const entry = state.initiative.find((item) => item.id === input.dataset.initRoll);
        const token = getToken(input.dataset.initRoll);
        if (!entry) return;
        entry.roll = parseInt(input.value, 10) || 0;
        if (token) token.initiative_roll = entry.roll;
        persistSoon();
      });
    });
    $$("[data-init-action]", ui.initiativeList).forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest("[data-init-id]");
        const id = row?.dataset.initId;
        const index = state.initiative.findIndex((entry) => entry.id === id);
        if (index < 0) return;
        const action = button.dataset.initAction;
        if (action === "active") state.turnIndex = index;
        if (action === "remove") removeInitiativeEntry(index);
        if (action === "up") moveInitiativeEntry(index, -1);
        if (action === "down") moveInitiativeEntry(index, 1);
        render();
        persistSoon();
      });
    });
  }

  function moveInitiativeEntry(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= state.initiative.length) return;
    const activeId = state.initiative[state.turnIndex]?.id;
    const [entry] = state.initiative.splice(index, 1);
    state.initiative.splice(target, 0, entry);
    state.turnIndex = Math.max(0, state.initiative.findIndex((item) => item.id === activeId));
  }

  function removeInitiativeEntry(index) {
    const activeId = state.initiative[state.turnIndex]?.id;
    const [removed] = state.initiative.splice(index, 1);
    const token = getToken(removed?.id);
    if (token) token.initiative_roll = null;
    const activeIndex = state.initiative.findIndex((entry) => entry.id === activeId);
    state.turnIndex = activeIndex >= 0 ? activeIndex : clamp(state.turnIndex, 0, Math.max(0, state.initiative.length - 1));
    if (!state.initiative.length) state.round = 0;
  }

  function normalizeInitiative() {
    const seen = new Set();
    state.initiative = state.initiative
      .filter((entry) => entry?.id && getToken(entry.id) && !seen.has(entry.id) && seen.add(entry.id))
      .map((entry) => ({ id: entry.id, roll: Number.isFinite(Number(entry.roll)) ? Number(entry.roll) : 0 }));
    state.turnIndex = state.initiative.length ? clamp(state.turnIndex, 0, state.initiative.length - 1) : 0;
  }

  function rollDiceExpression(expression) {
    const roll = parseDice(expression);
    if (!roll) return;
    state.diceHistory.unshift(roll);
    state.diceHistory = state.diceHistory.slice(0, 30);
    renderDiceHistory();
    persistSoon();
  }

  function parseDice(expression) {
    const text = String(expression || "").replace(/\s+/g, "").toLowerCase();
    const match = text.match(/^(\d*)d(\d+)([+-]\d+)?$/);
    if (!match) return null;
    const count = clamp(parseInt(match[1] || "1", 10), 1, 100);
    const sides = clamp(parseInt(match[2], 10), 2, 1000);
    const bonus = parseInt(match[3] || "0", 10);
    const rolls = Array.from({ length: count }, () => randomInt(1, sides));
    const total = rolls.reduce((sum, value) => sum + value, 0) + bonus;
    return { id: uuid(), expression: text, rolls, bonus, total, at: Date.now() };
  }

  function renderDiceHistory() {
    if (!ui.diceHistory) return;
    ui.diceHistory.innerHTML = state.diceHistory.map((roll) => `
      <div class="dice-row">
        <strong>${escapeHtml(roll.expression)} = ${roll.total}</strong>
        <span>${roll.rolls.join(", ")}${roll.bonus ? ` ${roll.bonus > 0 ? "+" : ""}${roll.bonus}` : ""}</span>
      </div>
    `).join("") || `<div class="empty-state">Nenhuma rolagem.</div>`;
  }

  async function loadMonsters(force) {
    const cached = readMonsterCache();
    if (!force && cached?.data?.length && Date.now() - cached.fetched_at < CACHE_MAX_AGE) {
      monsterCache = cached;
      monsters = cached.data.map(normalizeMonster);
      renderMonsterFilters();
      renderMonsterList();
      setMonsterStatus(`${monsters.length} monstros em cache.`);
      return;
    }
    setMonsterStatus("Buscando Open5e...");
    try {
      const response = await fetch("https://api.open5e.com/v1/monsters/?limit=500&document__slug=mm");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      monsters = (json.results || []).map(normalizeMonster).filter((monster) => monster.name);
      if (!monsters.length) throw new Error("empty monster response");
      monsterCache = { data: monsters, fetched_at: Date.now() };
      localStorage.setItem(MONSTER_CACHE_KEY, JSON.stringify(monsterCache));
      persistSoon();
      setMonsterStatus(`${monsters.length} monstros carregados da Open5e.`);
    } catch {
      monsters = fallbackMonsters.map(normalizeMonster);
      monsterCache = { data: monsters, fetched_at: Date.now(), fallback: true };
      localStorage.setItem(MONSTER_CACHE_KEY, JSON.stringify(monsterCache));
      persistSoon();
      setMonsterStatus("API indisponivel. Usando fallback local com 50 monstros.");
    }
    renderMonsterFilters();
    renderMonsterList();
  }

  function readMonsterCache() {
    try {
      return JSON.parse(localStorage.getItem(MONSTER_CACHE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function renderMonsterFilters() {
    if (!ui.monsterType) return;
    const current = ui.monsterType.value;
    const types = unique(monsters.map((monster) => monster.type).filter(Boolean)).sort();
    ui.monsterType.innerHTML = `<option value="">Todos</option>${types.map((type) => `<option value="${attr(type)}">${escapeHtml(type)}</option>`).join("")}`;
    ui.monsterType.value = types.includes(current) ? current : "";
  }

  function renderMonsterList() {
    if (!ui.monsterList) return;
    const search = (ui.monsterSearch?.value || "").trim().toLowerCase();
    const crMax = Number(ui.monsterCr?.value || 30);
    const type = ui.monsterType?.value || "";
    const size = ui.monsterSize?.value || "";
    const results = monsters
      .filter((monster) => !search || monster.name.toLowerCase().includes(search))
      .filter((monster) => !type || monster.type === type)
      .filter((monster) => !size || monster.size === size)
      .filter((monster) => crToNumber(monster.cr) <= crMax)
      .slice(0, 80);
    ui.monsterList.innerHTML = results.map((monster) => `
      <div class="monster-card" data-monster-key="${attr(monster.key)}">
        <strong>${escapeHtml(monster.name)}</strong>
        <span>${escapeHtml(monster.size)} ${escapeHtml(monster.type)} | CR ${escapeHtml(monster.cr)} | PV ${monster.hp} | CA ${monster.ac}</span>
      </div>
    `).join("") || `<div class="empty-state">Nenhum monstro encontrado.</div>`;
    $$(".monster-card", ui.monsterList).forEach((card) => {
      card.addEventListener("click", () => openMonsterModal(monsters.find((monster) => monster.key === card.dataset.monsterKey)));
    });
  }

  function openMonsterModal(monster) {
    if (!monster || !ui.monsterModal) return;
    currentMonster = monster;
    ui.monsterTitle.textContent = monster.name;
    ui.monsterContent.innerHTML = `
      <div class="sheet-section">
        <h3>${escapeHtml(monster.name)}</h3>
        <div class="metric-grid">
          <div><span>Tamanho</span><strong>${escapeHtml(monster.size)}</strong></div>
          <div><span>Tipo</span><strong>${escapeHtml(monster.type)}</strong></div>
          <div><span>CA</span><strong>${monster.ac}</strong></div>
          <div><span>PV</span><strong>${monster.hp}</strong></div>
          <div><span>CR</span><strong>${escapeHtml(monster.cr)}</strong></div>
          <div><span>XP</span><strong>${Number(monster.xp || 0).toLocaleString("pt-BR")}</strong></div>
        </div>
        <p>${escapeHtml(monster.senses || "")}</p>
        <p>${escapeHtml(monster.languages || "")}</p>
        <button type="button" id="mesaAddCurrentMonsterBtn" ${isPlayerView ? "disabled" : ""}>Adicionar ao grid</button>
      </div>
      <div class="sheet-section">
        <h3>Habilidades</h3>
        ${(monster.special_abilities || []).map((item) => `<p><strong>${escapeHtml(item.name)}</strong>. ${escapeHtml(item.desc || "")}</p>`).join("") || "<p>Nenhuma habilidade especial.</p>"}
      </div>
      <div class="sheet-section">
        <h3>Acoes</h3>
        ${(monster.actions || []).map((item) => `<p><strong>${escapeHtml(item.name)}</strong>. ${escapeHtml(item.desc || "")}</p>`).join("") || "<p>Nenhuma acao registrada.</p>"}
      </div>
    `;
    $("#mesaAddCurrentMonsterBtn", ui.monsterContent)?.addEventListener("click", () => {
      addToken("monster", currentMonster);
      closeMonsterModal();
    });
    ui.monsterModal.classList.remove("is-hidden");
  }

  function closeMonsterModal() {
    ui.monsterModal?.classList.add("is-hidden");
  }

  function normalizeMonster(raw) {
    const ac = firstNumber(raw.ac ?? raw.armor_class);
    const hp = firstNumber(raw.hp ?? raw.hit_points);
    const key = raw.key || raw.slug || slugify(raw.name || "monster");
    return {
      key,
      name: raw.name || key,
      size: raw.size || "Medium",
      type: raw.type || "creature",
      subtype: raw.subtype || "",
      alignment: raw.alignment || "",
      ac: ac || 10,
      ac_note: raw.ac_note || "",
      hp: hp || 1,
      hit_dice: raw.hit_dice || "",
      speed: raw.speed || "",
      str: firstNumber(raw.strength ?? raw.str) || 10,
      dex: firstNumber(raw.dexterity ?? raw.dex) || 10,
      con: firstNumber(raw.constitution ?? raw.con) || 10,
      int: firstNumber(raw.intelligence ?? raw.int) || 10,
      wis: firstNumber(raw.wisdom ?? raw.wis) || 10,
      cha: firstNumber(raw.charisma ?? raw.cha) || 10,
      saving_throws: raw.saving_throws || {},
      skills: raw.skills || {},
      damage_resistances: raw.damage_resistances || "",
      damage_immunities: raw.damage_immunities || "",
      condition_immunities: raw.condition_immunities || "",
      senses: raw.senses || "",
      languages: raw.languages || "",
      cr: String(raw.cr ?? raw.challenge_rating ?? "0"),
      xp: firstNumber(raw.xp) || 0,
      special_abilities: raw.special_abilities || raw.special || [],
      actions: raw.actions || [],
      reactions: raw.reactions || [],
      legendary_actions: raw.legendary_actions || [],
      sprite_url: raw.sprite_url || null,
    };
  }

  function renderReadouts() {
    if (ui.gridReadout) ui.gridReadout.textContent = `${state.grid.cols} x ${state.grid.rows}`;
    if (ui.zoomReadout) ui.zoomReadout.textContent = `${Math.round(state.view.scale * 100)}%`;
    if (ui.tokenReadout) ui.tokenReadout.textContent = String(state.tokens.length);
    if (ui.roundReadout) ui.roundReadout.textContent = String(state.round);
  }

  function renderPlayerBadge() {
    if (!isPlayerView) return;
    const sheet = playerSlot ? sheets[playerSlot - 1] : null;
    const text = $("#mesaPlayerBadgeText");
    if (text) text.textContent = sheet ? `Visao: ${sheet.char_name || `Jogador ${playerSlot}`}` : "Escolha um jogador";
    renderPlayerSlotPicker();
  }

  function renderPlayerSlotPicker() {
    if (!ui.playerPicker || !isPlayerView) return;
    if (playerSlot) {
      ui.playerPicker.classList.add("is-hidden");
      return;
    }
    ui.playerPicker.classList.remove("is-hidden");
    ui.playerPicker.innerHTML = sheets.map((sheet) => `
      <button type="button" data-player-pick="${sheet.slot}">Slot ${sheet.slot} - ${escapeHtml(sheet.char_name || "Personagem sem nome")}</button>
    `).join("");
    $$("[data-player-pick]", ui.playerPicker).forEach((button) => {
      button.addEventListener("click", () => {
        playerSlot = parseInt(button.dataset.playerPick, 10);
        history.replaceState(null, "", `${location.pathname}?view=player&slot=${playerSlot}#mesa`);
        render();
      });
    });
  }

  function setMonsterStatus(text) {
    if (ui.monsterStatus) ui.monsterStatus.textContent = text;
  }

  function defaultSheet(slot) {
    return {
      slot,
      player_name: "",
      char_name: "",
      class_level: "",
      background: "",
      race: "",
      alignment: "",
      xp: 0,
      str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      inspiration: false,
      proficiency_bonus: 2,
      ac: 10,
      initiative_bonus: 0,
      speed: 30,
      hp_max: 10,
      hp_current: 10,
      hp_temp: 0,
      hit_dice: "",
      death_saves: { success: 0, failure: 0 },
      saves: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
      skills: Object.fromEntries(SKILLS.map(([key]) => [key, false])),
      passive_perception: 10,
      attacks: Array.from({ length: 5 }, () => ({ name: "", bonus: "", damage: "" })),
      cp: 0, sp: 0, ep: 0, gp: 0, pp: 0,
      equipment: "",
      traits: "", ideals: "", bonds: "", flaws: "",
      features: "",
      languages: "",
      age: "", height: "", weight: "", eyes: "", skin: "", hair: "",
      appearance_notes: "",
      backstory: "",
      allies: "",
      treasure: "",
      spellcasting_class: "",
      spellcasting_ability: "",
      spell_save_dc: 0,
      spell_attack_bonus: 0,
      cantrips: [],
      spell_slots: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
      spell_slots_used: { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
      spells: { 1:[], 2:[], 3:[], 4:[], 5:[], 6:[], 7:[], 8:[], 9:[] },
    };
  }

  function recalcSheet(sheet) {
    sheet.initiative_bonus = Number.isFinite(Number(sheet.initiative_bonus)) ? Number(sheet.initiative_bonus) : mod(sheet.dex);
    const perceptionProf = sheet.skills?.perception ? Number(sheet.proficiency_bonus || 0) : 0;
    sheet.passive_perception = 10 + mod(sheet.wis) + perceptionProf;
    sheet.hp_max = Math.max(0, Number(sheet.hp_max || 0));
    sheet.hp_current = clamp(Number(sheet.hp_current || 0), 0, Math.max(sheet.hp_max, 0));
  }

  function syncSheetFromToken(token) {
    if (!token.sheet_slot) return;
    const sheet = sheets[token.sheet_slot - 1];
    if (!sheet) return;
    sheet.hp_current = token.hp_current;
    sheet.hp_max = token.hp_max;
    sheet.ac = token.armor_class;
    if (!sheet.char_name && token.type === "player") sheet.char_name = token.label;
    recalcSheet(sheet);
  }

  function syncTokenFromSheet(token) {
    if (!token.sheet_slot) return;
    const sheet = sheets[token.sheet_slot - 1];
    if (!sheet) return;
    token.hp_current = sheet.hp_current;
    token.hp_max = Math.max(1, sheet.hp_max || token.hp_max);
    token.armor_class = sheet.ac || token.armor_class;
    if (sheet.char_name && token.type === "player") token.label = sheet.char_name;
  }

  function syncTokenFromSheetSlot(slot) {
    state.tokens.filter((token) => token.sheet_slot === slot).forEach(syncTokenFromSheet);
  }

  function getToken(id) {
    return state.tokens.find((token) => token.id === id);
  }

  function firstOpenSheetSlot() {
    const used = new Set(state.tokens.map((token) => token.sheet_slot).filter(Boolean));
    const sheet = sheets.find((item) => !used.has(item.slot));
    return sheet?.slot || null;
  }

  function typeLabel(type) {
    return { player: "Jogador", monster: "Monstro", npc: "NPC", object: "Objeto" }[type] || "Token";
  }

  function fieldHtml(label, key, value, type, disabled, min = "", max = "") {
    return `<label class="field-row">${label}<input data-token-field="${key}" type="${type}" value="${attr(value)}" ${min ? `min="${min}"` : ""} ${max ? `max="${max}"` : ""} ${disabled}></label>`;
  }

  function checkHtml(label, key, checked, disabled) {
    return `<label><input type="checkbox" data-token-field="${key}" ${checked ? "checked" : ""} ${disabled}> ${label}</label>`;
  }

  function sheetField(label, key, value, type, disabled) {
    return `<label class="sheet-field">${label}<input data-sheet-field="${key}" type="${type}" value="${attr(value)}" ${disabled}></label>`;
  }

  function sheetCheck(label, key, value, disabled) {
    return `<label class="sheet-field"><span>${label}</span><input data-sheet-field="${key}" type="checkbox" ${value ? "checked" : ""} ${disabled}></label>`;
  }

  function textareaField(label, key, value, disabled) {
    return `<label class="sheet-field">${label}<textarea rows="4" data-sheet-field="${key}" ${disabled}>${escapeHtml(value || "")}</textarea></label>`;
  }

  function attrBox(label, key, value, modifier, disabled) {
    return `<div class="attr-box"><label class="sheet-field">${label}<input type="number" min="1" max="30" data-sheet-field="${key}" value="${attr(value)}" ${disabled}></label><div class="attr-mod">${signed(modifier)}</div></div>`;
  }

  function saveRow(sheet, key, label, disabled) {
    const value = mod(sheet[key]) + (sheet.saves[key] ? Number(sheet.proficiency_bonus || 0) : 0);
    return `<label class="skill-row"><input type="checkbox" data-sheet-field="saves.${key}" ${sheet.saves[key] ? "checked" : ""} ${disabled}><span>${label}</span><strong>${signed(value)}</strong></label>`;
  }

  function skillRow(sheet, key, label, ability, disabled) {
    const value = mod(sheet[ability]) + (sheet.skills[key] ? Number(sheet.proficiency_bonus || 0) : 0);
    return `<label class="skill-row"><input type="checkbox" data-sheet-field="skills.${key}" ${sheet.skills[key] ? "checked" : ""} ${disabled}><span>${label}</span><strong>${signed(value)}</strong></label>`;
  }

  function getPath(object, path) {
    return path.split(".").reduce((target, part) => target?.[part], object);
  }

  function setPath(object, path, value) {
    const parts = path.split(".");
    let target = object;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const part = parts[i];
      if (!target[part]) target[part] = {};
      target = target[part];
    }
    target[parts[parts.length - 1]] = value;
  }

  function mergeDeep(base, extra) {
    const result = Array.isArray(base) ? [...base] : { ...base };
    Object.keys(extra || {}).forEach((key) => {
      if (extra[key] && typeof extra[key] === "object" && !Array.isArray(extra[key]) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
        result[key] = mergeDeep(base[key], extra[key]);
      } else {
        result[key] = extra[key];
      }
    });
    return result;
  }

  function mod(score) {
    return Math.floor((Number(score || 10) - 10) / 2);
  }

  function signed(value) {
    return value >= 0 ? `+${value}` : `${value}`;
  }

  function linesToArray(value) {
    return String(value || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  }

  function uuid() {
    return crypto?.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function randomInt(min, max) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function unique(values) {
    return Array.from(new Set(values));
  }

  function firstNumber(value) {
    if (typeof value === "number") return value;
    if (Array.isArray(value)) return firstNumber(value[0]);
    const match = String(value || "").match(/-?\d+(\.\d+)?/);
    return match ? Number(match[0]) : 0;
  }

  function crToNumber(cr) {
    const text = String(cr || "0");
    if (text.includes("/")) {
      const [a, b] = text.split("/").map(Number);
      return b ? a / b : 0;
    }
    return Number(text) || 0;
  }

  function slugify(text) {
    return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
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

  function attr(value) {
    return escapeHtml(value);
  }

  function makeFallbackMonsters() {
    const rows = [
      ["goblin","Goblin","humanoid","Small","1/4",15,7], ["orc","Orc","humanoid","Medium","1/2",13,15],
      ["kobold","Kobold","humanoid","Small","1/8",12,5], ["bandit","Bandit","humanoid","Medium","1/8",12,11],
      ["cultist","Cultist","humanoid","Medium","1/8",12,9], ["guard","Guarda","humanoid","Medium","1/8",16,11],
      ["scout","Batedor","humanoid","Medium","1/2",13,16], ["thug","Capanga","humanoid","Medium","1/2",11,32],
      ["veteran","Veterano","humanoid","Medium","3",17,58], ["knight","Cavaleiro","humanoid","Medium","3",18,52],
      ["skeleton","Esqueleto","undead","Medium","1/4",13,13], ["zombie","Zumbi","undead","Medium","1/4",8,22],
      ["ghoul","Carniçal","undead","Medium","1",12,22], ["wight","Inumano","undead","Medium","3",14,45],
      ["mummy","Mumia","undead","Medium","3",11,58], ["vampire-spawn","Cria Vampirica","undead","Medium","5",15,82],
      ["giant-rat","Rato Gigante","beast","Small","1/8",12,7], ["wolf","Lobo","beast","Medium","1/4",13,11],
      ["dire-wolf","Lobo Atroz","beast","Large","1",14,37], ["giant-spider","Aranha Gigante","beast","Large","1",14,26],
      ["black-bear","Urso Negro","beast","Medium","1/2",11,19], ["brown-bear","Urso Pardo","beast","Large","1",11,34],
      ["owlbear","Ursocoruja","monstrosity","Large","3",13,59], ["harpy","Harpia","monstrosity","Medium","1",11,38],
      ["minotaur","Minotauro","monstrosity","Large","3",14,76], ["basilisk","Basilisco","monstrosity","Medium","3",15,52],
      ["cockatrice","Cocatriz","monstrosity","Small","1/2",11,27], ["medusa","Medusa","monstrosity","Medium","6",15,127],
      ["gargoyle","Gargula","elemental","Medium","2",15,52], ["griffon","Grifo","monstrosity","Large","2",12,59],
      ["hippogriff","Hipogrifo","monstrosity","Large","1",11,19], ["wyvern","Wyvern","dragon","Large","6",13,110],
      ["ogre","Ogro","giant","Large","2",11,59], ["troll","Troll","giant","Large","5",15,84],
      ["hill-giant","Gigante da Colina","giant","Huge","5",13,105], ["stone-giant","Gigante de Pedra","giant","Huge","7",17,126],
      ["fire-elemental","Elemental do Fogo","elemental","Large","5",13,102], ["water-elemental","Elemental da Agua","elemental","Large","5",14,114],
      ["air-elemental","Elemental do Ar","elemental","Large","5",15,90], ["earth-elemental","Elemental da Terra","elemental","Large","5",17,126],
      ["imp","Diabrete","fiend","Tiny","1",13,10], ["quasit","Quasit","fiend","Tiny","1",13,7],
      ["hell-hound","Cao Infernal","fiend","Medium","3",15,45], ["night-hag","Bruxa Noturna","fiend","Medium","5",17,112],
      ["werewolf","Lobisomem","humanoid","Medium","3",12,58], ["ettin","Ettin","giant","Large","4",12,85],
      ["young-black-dragon","Dragao Negro Jovem","dragon","Large","7",18,127], ["young-red-dragon","Dragao Vermelho Jovem","dragon","Large","10",18,178],
      ["adult-red-dragon","Dragao Vermelho Adulto","dragon","Huge","17",19,256], ["ancient-white-dragon","Dragao Branco Anciao","dragon","Gargantuan","20",20,333],
    ];
    return rows.map(([key, name, type, size, cr, ac, hp]) => ({
      key, name, type, size, cr, ac, hp, xp: Math.round(crToNumber(cr) * 1000),
      speed: "30 ft.", str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
      senses: "Percepcao passiva variavel", languages: "",
      special_abilities: [],
      actions: [{ name: "Ataque", desc: `Ataque basico de ${name}. Ajuste dano e bonus conforme a cena.` }],
      reactions: [], legendary_actions: [], sprite_url: null,
    }));
  }

  window.MesaCombate = {
    render,
    getPersistPayload,
    importDungeonMap,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
