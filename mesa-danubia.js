(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const STORAGE_KEY = "danubia-mesa-tools-v1";
  const DUNGEON_MAX_SIZE = 500;
  const DUNGEON_EXPORT_MIN_CELL = 8;
  const DUNGEON_EXPORT_MAX_CELL = 180;
  const DUNGEON_EXPORT_MAX_SIDE = 8192;

  const assets = {
    mapBase: "https://tibiamaps.github.io/tibia-map-data",
    markers: "https://raw.githubusercontent.com/tibiamaps/tibia-map-data/main/data/markers.json",
  };

  const tibiaMap = {
    originX: 31744,
    originY: 30976,
  };

  const builtInPlaces = [
    { id: "thais", name: "Thais", type: "Capital humana", coordX: 32368, coordY: 32198, floor: 7, note: "Centro recomendado da campanha. Este e o ponto do link original do TibiaMaps." },
    { id: "carlin", name: "Carlin", type: "Cidade", coordX: 32360, coordY: 31782, floor: 7, note: "Cidade ao norte de Thais, boa para intriga politica e rotas frias." },
    { id: "venore", name: "Venore", type: "Cidade pantanosa", coordX: 32957, coordY: 32076, floor: 7, note: "Pantanos, comercio, familias ricas e rotas perigosas." },
    { id: "ab-dendriel", name: "Ab'Dendriel", type: "Cidade elfica", coordX: 32656, coordY: 31693, floor: 7, note: "Territorio elfico e floresta antiga." },
    { id: "kazordoon", name: "Kazordoon", type: "Montanha ana", coordX: 32645, coordY: 31925, floor: 7, note: "Montanhas, minas, forjas e entradas subterraneas." },
    { id: "edron", name: "Edron", type: "Ilha arcana", coordX: 33217, coordY: 31814, floor: 7, note: "Academias, portais, ruinas e experimentos arcanos." },
    { id: "darashia", name: "Darashia", type: "Deserto", coordX: 33213, coordY: 32455, floor: 7, note: "Caravanas, desertos e templos esquecidos." },
    { id: "ankrahmun", name: "Ankrahmun", type: "Necropole", coordX: 33194, coordY: 32854, floor: 7, note: "Mumias, tumbas e politica religiosa." },
    { id: "port-hope", name: "Port Hope", type: "Selva", coordX: 32595, coordY: 32745, floor: 7, note: "Base perfeita para hex crawl em selva." },
    { id: "liberty-bay", name: "Liberty Bay", type: "Ilha portuaria", coordX: 32317, coordY: 32826, floor: 7, note: "Piratas, plantacoes e viagens maritimas." },
    { id: "svargrond", name: "Svargrond", type: "Norte gelado", coordX: 32212, coordY: 31134, floor: 7, note: "Gelo, barbaros, espiritos e sobrevivencia." },
    { id: "yalahar", name: "Yalahar", type: "Cidade antiga", coordX: 32791, coordY: 31247, floor: 7, note: "Distritos tematicos, ruinas e tecnologia perdida." },
    { id: "farmine", name: "Farmine", type: "Fronteira oriental", coordX: 33023, coordY: 31536, floor: 7, note: "Posto avancado para expedicoes subterraneas e exoticas." },
    { id: "gray-beach", name: "Gray Beach", type: "Ilha", coordX: 33447, coordY: 31311, floor: 7, note: "Ilha remota para ganchos de investigacao e monstros marinhos." },
  ];

  const routeSets = [
    ["thais", "carlin", "ab-dendriel", "kazordoon", "venore", "thais"],
    ["thais", "port-hope", "ankrahmun", "darashia", "venore"],
    ["svargrond", "carlin", "thais", "liberty-bay", "port-hope"],
    ["yalahar", "farmine", "edron", "gray-beach"],
  ];

  const tileDefs = [
    { id: "empty", label: "Vazio", color: "#1d1b18" },
    { id: "floor", label: "Piso", color: "#a99058" },
    { id: "wall", label: "Parede", color: "#55575a" },
    { id: "door", label: "Porta", color: "#8d4f24" },
    { id: "secret", label: "Secreta", color: "#3f4144" },
    { id: "water", label: "Agua", color: "#4e7388" },
    { id: "acid", label: "Acido", color: "#79b84a" },
    { id: "grass", label: "Grama", color: "#34933b" },
    { id: "forest", label: "Floresta", color: "#1d5229" },
    { id: "lava", label: "Lava", color: "#c75b2e" },
    { id: "rough", label: "Dificil", color: "#806844" },
    { id: "trap", label: "Armadilha", color: "#a83832" },
    { id: "chest", label: "Bau", color: "#b88632" },
    { id: "stairs", label: "Escada", color: "#ddd0af" },
  ];
  const tileById = Object.fromEntries(tileDefs.map((tile) => [tile.id, tile]));

  const importProfileDefs = [
    { id: "tibia-auto", label: "Tibia automatico" },
    { id: "tibia-dungeon", label: "Tibia dungeon" },
    { id: "tibia-world", label: "Tibia mundo" },
    { id: "tibia-city", label: "Tibia cidade" },
    { id: "generic", label: "Imagem generica" },
  ];

  const importRuleDefs = [
    { id: "void", label: "Preto / vazio", color: "#171717" },
    { id: "water", label: "Azul / agua", color: "#4e7388" },
    { id: "orange", label: "Laranja / lava", color: "#ff6a18" },
    { id: "red", label: "Vermelho / parede", color: "#f0442f" },
    { id: "lightGreen", label: "Verde claro / acido", color: "#34e03d" },
    { id: "green", label: "Verde / grama", color: "#2fa53a" },
    { id: "darkGreen", label: "Verde escuro / floresta", color: "#17451f" },
    { id: "yellow", label: "Amarelo / buraco ou escada", color: "#d6b74b" },
    { id: "earth", label: "Vermelho escuro / terra", color: "#89512d" },
    { id: "sand", label: "Bege / areia", color: "#f2c38a" },
    { id: "stone", label: "Cinza / pedra", color: "#747672" },
  ];

  const importProfileDefaults = {
    "tibia-auto": {
      void: "empty",
      water: "water",
      orange: "wall",
      red: "wall",
      lightGreen: "acid",
      green: "grass",
      darkGreen: "forest",
      yellow: "stairs",
      earth: "rough",
      sand: "floor",
      stone: "wall",
    },
    "tibia-dungeon": {
      void: "empty",
      water: "water",
      orange: "lava",
      red: "wall",
      lightGreen: "acid",
      green: "grass",
      darkGreen: "forest",
      yellow: "stairs",
      earth: "rough",
      sand: "floor",
      stone: "wall",
    },
    "tibia-world": {
      void: "empty",
      water: "water",
      orange: "lava",
      red: "wall",
      lightGreen: "acid",
      green: "grass",
      darkGreen: "forest",
      yellow: "stairs",
      earth: "rough",
      sand: "floor",
      stone: "wall",
    },
    "tibia-city": {
      void: "empty",
      water: "water",
      orange: "wall",
      red: "wall",
      lightGreen: "acid",
      green: "grass",
      darkGreen: "forest",
      yellow: "stairs",
      earth: "rough",
      sand: "floor",
      stone: "wall",
    },
    generic: {
      void: "empty",
      water: "water",
      orange: "lava",
      red: "wall",
      lightGreen: "acid",
      green: "grass",
      darkGreen: "forest",
      yellow: "stairs",
      earth: "rough",
      sand: "floor",
      stone: "wall",
    },
  };

  const mapCanvas = $("#mapCanvas");
  const mapCtx = mapCanvas.getContext("2d");
  const dungeonCanvas = $("#dungeonCanvas");
  const dungeonCtx = dungeonCanvas.getContext("2d");
  const cityCanvas = $("#cityCanvas");
  const cityCtx = cityCanvas.getContext("2d");
  const mapImage = new Image();
  const mapEditCache = document.createElement("canvas");
  const mapEditCacheCtx = mapEditCache.getContext("2d");
  let mapEditCacheDirty = true;

  let activeMode = "map";
  let persisted = loadPersistedState();

  const mapState = {
    ready: false,
    loadingMarkers: false,
    tool: "pan",
    floor: persisted.map?.floor ?? 7,
    tibiaMarkers: [],
    view: { x: 0, y: 0, scale: 1 },
    dragging: false,
    painting: false,
    cropping: false,
    dragStart: null,
    currentStroke: null,
    crop: persisted.map?.crop || null,
    selectedId: null,
    ruler: { start: null, end: null },
    customMarkers: persisted.map?.customMarkers || [],
    editStrokes: normalizeMapStrokes(persisted.map?.editStrokes),
    redoStrokes: [],
    settings: {
      gridPx: persisted.map?.settings?.gridPx || 64,
      metersPerTile: persisted.map?.settings?.metersPerTile || 1.5,
      partySpeed: persisted.map?.settings?.partySpeed || 38,
      cityPopulation: persisted.map?.settings?.cityPopulation || 273110,
      cityDensity: persisted.map?.settings?.cityDensity || 199.49,
      cityAreaOverride: persisted.map?.settings?.cityAreaOverride || 35,
      showCityFootprint: persisted.map?.settings?.showCityFootprint ?? true,
      paintMode: persisted.map?.settings?.paintMode || "paint",
      paintColor: persisted.map?.settings?.paintColor || "#3f6d3f",
      paintSize: persisted.map?.settings?.paintSize || 8,
      paintOpacity: persisted.map?.settings?.paintOpacity || 0.8,
      importMaxSize: persisted.map?.settings?.importMaxSize || 240,
      importProfile: normalizeImportProfileId(persisted.map?.settings?.importProfile, persisted.map?.settings?.importRules),
      importUseMapPaint: persisted.map?.settings?.importUseMapPaint ?? true,
      importRules: normalizeImportRules(persisted.map?.settings?.importRules, normalizeImportProfileId(persisted.map?.settings?.importProfile, persisted.map?.settings?.importRules)),
      showGrid: persisted.map?.settings?.showGrid ?? true,
      showRoutes: persisted.map?.settings?.showRoutes ?? true,
      showMarkers: persisted.map?.settings?.showMarkers ?? true,
      showTibiaMarkers: persisted.map?.settings?.showTibiaMarkers ?? true,
      showLabels: persisted.map?.settings?.showLabels ?? true,
      showScale: persisted.map?.settings?.showScale ?? true,
    },
  };

  const dungeonState = {
    mode: "paint",
    tile: "floor",
    brushSize: 1,
    drawing: false,
    dragStart: null,
    dragCurrent: null,
    panStart: null,
    view: { x: 0, y: 0, scale: 24 },
    undo: [],
    showGrid: persisted.dungeon?.showGrid ?? true,
    showLabels: persisted.dungeon?.showLabels ?? true,
    showSecrets: persisted.dungeon?.showSecrets ?? true,
    exportCellSize: persisted.dungeon?.exportCellSize || 70,
    data: normalizeDungeon(persisted.dungeon?.data) || createDungeon(30, 22),
  };

  const cityState = {
    view: { x: 0, y: 0, scale: 1 },
    dragging: false,
    drawing: false,
    dragStart: null,
    currentStroke: null,
    lastStamp: null,
    undo: [],
    redo: [],
    settings: {
      styleVersion: 3,
      name: persisted.city?.settings?.name || "Thais",
      population: persisted.city?.settings?.population || 273110,
      areaKm2: persisted.city?.settings?.areaKm2 || 35,
      seed: persisted.city?.settings?.seed || "thais-273110",
      visualStyle: persisted.city?.settings?.visualStyle || "green",
      densityMode: persisted.city?.settings?.densityMode || "high",
      labelMode: persisted.city?.settings?.labelMode || "clean",
      buildingMode: persisted.city?.settings?.buildingMode || "symbols",
      gridMeters: persisted.city?.settings?.gridMeters || 250,
      exportWidth: persisted.city?.settings?.exportWidth || 3600,
      tool: persisted.city?.settings?.tool || "pan",
      terrainKind: persisted.city?.settings?.terrainKind || "grass",
      buildingKind: persisted.city?.settings?.buildingKind || "house",
      brushMeters: persisted.city?.settings?.brushMeters || 80,
      roadWidth: persisted.city?.settings?.roadWidth || 18,
      markerName: persisted.city?.settings?.markerName || "Novo ponto",
      markerType: persisted.city?.settings?.markerType || "Ponto",
      showGrid: persisted.city?.settings?.styleVersion === 2 ? persisted.city?.settings?.showGrid ?? false : false,
      showWalls: persisted.city?.settings?.showWalls ?? true,
      showBuildings: persisted.city?.settings?.showBuildings ?? true,
      showWater: persisted.city?.settings?.showWater ?? true,
      showMarkers: persisted.city?.settings?.styleVersion === 2 ? persisted.city?.settings?.showMarkers ?? true : true,
      showMarkerLabels: persisted.city?.settings?.styleVersion === 2 ? persisted.city?.settings?.showMarkerLabels ?? false : false,
      showDistrictLabels: persisted.city?.settings?.showDistrictLabels ?? true,
      showFields: persisted.city?.settings?.showFields ?? true,
    },
    data: persisted.city?.data || null,
  };

  initialize();

  function initialize() {
    bindTopbar();
    bindMapControls();
    bindDungeonControls();
    bindCityControls();
    renderTilePalette();
    renderTileLegend();
    syncMapInputs();
    syncDungeonInputs();
    syncCityInputs();
    renderMarkerList();
    renderLabelList();
    if (!cityState.data || cityState.data.mapVersion !== 3) generateCity();
    else {
      ensureCityManual(cityState.data);
      renderCityLists();
    }

    mapImage.onload = () => {
      mapState.ready = true;
      mapEditCacheDirty = true;
      if (mapState.floor === 7) {
        selectMarker("thais", true);
      } else {
        fitMap();
      }
      renderMap();
      updateMapCropReadout();
    };
    mapImage.onerror = () => {
      mapState.ready = false;
      renderMap();
    };
    mapImage.crossOrigin = "anonymous";
    mapImage.src = mapUrlForFloor(mapState.floor);
    loadTibiaMarkers();

    resizeAll();
    window.addEventListener("resize", resizeAll);
    window.addEventListener("keydown", handleKeyboard);
  }

  function bindTopbar() {
    $$(".mode-tab").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveMode(button.dataset.mode, true);
      });
    });
    window.addEventListener("hashchange", () => setActiveMode(hashMode(), false));
    setActiveMode(hashMode(), false);
  }

  function hashMode() {
    const mode = location.hash.replace("#", "");
    return ["map", "city", "dungeon"].includes(mode) ? mode : "map";
  }

  function setActiveMode(mode, updateHash) {
    activeMode = ["map", "city", "dungeon"].includes(mode) ? mode : "map";
    $$(".mode-tab").forEach((item) => item.classList.toggle("active", item.dataset.mode === activeMode));
    ["map", "city", "dungeon"].forEach((panel) => {
      $(`[data-panel='${panel}']`)?.classList.toggle("is-hidden", activeMode !== panel);
      $(`#${panel}Frame`)?.classList.toggle("active", activeMode === panel);
      $$(`[data-info='${panel}']`).forEach((node) => node.classList.toggle("is-hidden", activeMode !== panel));
    });
    if (updateHash && location.hash !== `#${activeMode}`) {
      history.replaceState(null, "", `#${activeMode}`);
    }
    requestAnimationFrame(() => {
      if (activeMode === "city" && cityState.data && cityState.view.scale <= 0.01) fitCity();
      else resizeAll();
    });
  }

  function bindMapControls() {
    $("#mapFitBtn").addEventListener("click", fitMap);
    $("#mapZoomInBtn").addEventListener("click", () => zoomMap(1.18));
    $("#mapZoomOutBtn").addEventListener("click", () => zoomMap(0.84));
    $("#mapUndoBtn").addEventListener("click", undoMapEdit);
    $("#mapRedoBtn").addEventListener("click", redoMapEdit);
    $("#sendCropDungeonBtn").addEventListener("click", sendMapCropToDungeon);
    $("#resetImportProfileBtn").addEventListener("click", () => {
      mapState.settings.importRules = defaultImportRules(mapState.settings.importProfile);
      renderImportRuleControls();
      renderMapImportPreview();
      persistSoon();
    });
    $("#clearMapCropBtn").addEventListener("click", () => {
      mapState.crop = null;
      persistSoon();
      updateMapCropReadout();
      renderMapImportPreview();
      renderMap();
    });
    $("#mapResetBtn").addEventListener("click", () => {
      mapState.ruler = { start: null, end: null };
      mapState.selectedId = null;
      fitMap();
      renderSelectedMarker();
    });
    $("#mapDownloadBtn").addEventListener("click", downloadMapPng);

    $("#mapFloor").addEventListener("change", (event) => {
      mapState.floor = parseInt(event.target.value, 10) || 7;
      mapState.ready = false;
      mapState.painting = false;
      mapState.currentStroke = null;
      mapState.selectedId = null;
      mapState.ruler = { start: null, end: null };
      mapEditCacheDirty = true;
      mapImage.src = mapUrlForFloor(mapState.floor);
      persistSoon();
      renderMarkerList();
      renderSelectedMarker();
      renderMap();
    });

    $$("[data-map-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        if (mapState.painting) finishMapPaint();
        mapState.tool = button.dataset.mapTool;
        $$("[data-map-tool]").forEach((item) => item.classList.toggle("active", item === button));
        renderMap();
      });
    });

    [
      ["#mapGridPx", "gridPx", Number],
      ["#mapMetersTile", "metersPerTile", Number],
      ["#partySpeed", "partySpeed", Number],
      ["#cityPopulation", "cityPopulation", Number],
      ["#cityDensity", "cityDensity", Number],
      ["#cityAreaOverride", "cityAreaOverride", Number],
      ["#mapPaintSize", "paintSize", Number],
      ["#mapPaintOpacity", "paintOpacity", Number],
      ["#mapImportMaxSize", "importMaxSize", Number],
    ].forEach(([selector, key, parser]) => {
      $(selector).addEventListener("input", (event) => {
        mapState.settings[key] = parser(event.target.value);
        persistSoon();
        updateMapCropReadout();
        renderMap();
      });
    });

    $("#showCityFootprint").addEventListener("change", (event) => {
      mapState.settings.showCityFootprint = event.target.checked;
      persistSoon();
      renderMap();
    });

    $("#mapPaintMode").addEventListener("change", (event) => {
      mapState.settings.paintMode = event.target.value;
      persistSoon();
    });
    $("#mapPaintColor").addEventListener("input", (event) => {
      mapState.settings.paintColor = event.target.value;
      persistSoon();
    });
    $("#mapImportProfile").addEventListener("change", (event) => {
      mapState.settings.importProfile = event.target.value;
      mapState.settings.importRules = defaultImportRules(mapState.settings.importProfile);
      renderImportRuleControls();
      renderMapImportPreview();
      persistSoon();
    });
    $("#mapImportUsePaint").addEventListener("change", (event) => {
      mapState.settings.importUseMapPaint = event.target.checked;
      renderMapImportPreview();
      persistSoon();
    });
    $("#mapImportRules").addEventListener("change", (event) => {
      const selector = event.target.closest("[data-import-rule]");
      if (!selector) return;
      mapState.settings.importRules[selector.dataset.importRule] = selector.value;
      renderMapImportPreview();
      persistSoon();
    });

    [
      ["#showMapGrid", "showGrid"],
      ["#showMapRoutes", "showRoutes"],
      ["#showMapMarkers", "showMarkers"],
      ["#showTibiaMarkers", "showTibiaMarkers"],
      ["#showMapLabels", "showLabels"],
      ["#showMapScale", "showScale"],
    ].forEach(([selector, key]) => {
      $(selector).addEventListener("change", (event) => {
        mapState.settings[key] = event.target.checked;
        persistSoon();
        renderMap();
      });
    });

    $("#markerSearch").addEventListener("input", renderMarkerList);
    $("#markerList").addEventListener("click", (event) => {
      const focusButton = event.target.closest("[data-focus-marker]");
      const deleteButton = event.target.closest("[data-delete-marker]");
      if (focusButton) {
        selectMarker(focusButton.dataset.focusMarker, true);
      }
      if (deleteButton) {
        deleteCustomMarker(deleteButton.dataset.deleteMarker);
      }
    });

    mapCanvas.addEventListener("wheel", handleMapWheel, { passive: false });
    mapCanvas.addEventListener("pointerdown", handleMapPointerDown);
    mapCanvas.addEventListener("pointermove", handleMapPointerMove);
    mapCanvas.addEventListener("pointerup", handleMapPointerUp);
    mapCanvas.addEventListener("pointercancel", handleMapPointerUp);
  }

  function bindDungeonControls() {
    $("#newDungeonBtn").addEventListener("click", () => {
      const width = clamp(parseInt($("#dungeonWidth").value, 10) || 30, 5, DUNGEON_MAX_SIZE);
      const height = clamp(parseInt($("#dungeonHeight").value, 10) || 22, 5, DUNGEON_MAX_SIZE);
      pushDungeonUndo();
      dungeonState.data = createDungeon(width, height);
      fitDungeon();
      persistSoon();
      renderDungeon();
      renderLabelList();
    });
    $("#undoDungeonBtn").addEventListener("click", undoDungeon);
    $("#fitDungeonBtn").addEventListener("click", fitDungeon);
    $("#clearDungeonBtn").addEventListener("click", () => {
      pushDungeonUndo();
      dungeonState.data.cells.fill("empty");
      dungeonState.data.labels = [];
      persistSoon();
      renderDungeon();
      renderLabelList();
    });
    $("#saveDungeonJsonBtn").addEventListener("click", downloadDungeonJson);
    $("#loadDungeonJsonBtn").addEventListener("click", () => $("#loadDungeonFile").click());
    $("#loadDungeonFile").addEventListener("change", loadDungeonJson);
    $("#downloadDungeonBtn").addEventListener("click", () => downloadDungeonPng(true));
    $("#downloadPlayerDungeonBtn").addEventListener("click", () => downloadDungeonPng(false));

    $$("[data-dungeon-mode]").forEach((button) => {
      button.addEventListener("click", () => {
        dungeonState.mode = button.dataset.dungeonMode;
        $$("[data-dungeon-mode]").forEach((item) => item.classList.toggle("active", item === button));
        updateDungeonReadouts();
        renderDungeon();
      });
    });

    $("#brushSize").addEventListener("input", (event) => {
      dungeonState.brushSize = parseInt(event.target.value, 10) || 1;
      renderDungeon();
    });
    $("#showDungeonGrid").addEventListener("change", (event) => {
      dungeonState.showGrid = event.target.checked;
      persistSoon();
      renderDungeon();
    });
    $("#showDungeonLabels").addEventListener("change", (event) => {
      dungeonState.showLabels = event.target.checked;
      persistSoon();
      renderDungeon();
    });
    $("#showDungeonSecrets").addEventListener("change", (event) => {
      dungeonState.showSecrets = event.target.checked;
      persistSoon();
      renderDungeon();
    });
    $("#exportCellSize").addEventListener("input", (event) => {
      dungeonState.exportCellSize = clamp(parseInt(event.target.value, 10) || 70, DUNGEON_EXPORT_MIN_CELL, DUNGEON_EXPORT_MAX_CELL);
      persistSoon();
      updateDungeonReadouts();
    });

    $("#labelList").addEventListener("click", (event) => {
      const deleteButton = event.target.closest("[data-delete-label]");
      if (!deleteButton) return;
      pushDungeonUndo();
      dungeonState.data.labels = dungeonState.data.labels.filter((label) => label.id !== deleteButton.dataset.deleteLabel);
      persistSoon();
      renderDungeon();
      renderLabelList();
    });

    dungeonCanvas.addEventListener("wheel", handleDungeonWheel, { passive: false });
    dungeonCanvas.addEventListener("pointerdown", handleDungeonPointerDown);
    dungeonCanvas.addEventListener("pointermove", handleDungeonPointerMove);
    dungeonCanvas.addEventListener("pointerup", handleDungeonPointerUp);
    dungeonCanvas.addEventListener("pointercancel", handleDungeonPointerUp);
  }

  function bindCityControls() {
    $("#generateCityBtn").addEventListener("click", () => {
      readCitySettings();
      generateCity();
      persistSoon();
    });
    $("#randomCitySeedBtn").addEventListener("click", () => {
      $("#cityMapSeed").value = `${$("#cityMapName").value.trim() || "cidade"}-${Date.now().toString(36)}`;
      readCitySettings();
      generateCity();
      persistSoon();
    });
    $("#fitCityBtn").addEventListener("click", fitCity);
    $("#downloadCityBtn").addEventListener("click", downloadCityPng);
    $("#cityUndoBtn").addEventListener("click", undoCityEdit);
    $("#cityRedoBtn").addEventListener("click", redoCityEdit);

    $$("[data-city-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        finishCityDrawing();
        cityState.settings.tool = button.dataset.cityTool;
        $$("[data-city-tool]").forEach((item) => item.classList.toggle("active", item === button));
        persistSoon();
        renderCity();
      });
    });

    [
      "#cityMapName",
      "#cityMapPopulation",
      "#cityMapArea",
      "#cityMapSeed",
      "#cityVisualStyle",
      "#cityDensityMode",
      "#cityLabelMode",
      "#cityBuildingMode",
      "#cityGridMeters",
      "#cityExportWidth",
      "#cityBrushMeters",
      "#cityRoadWidth",
      "#cityMarkerName",
    ].forEach((selector) => {
      $(selector).addEventListener("input", () => {
        readCitySettings();
        updateCityReadouts();
        persistSoon();
      });
    });

    ["#cityTerrainKind", "#cityBuildingKind", "#cityMarkerType", "#cityVisualStyle", "#cityDensityMode", "#cityLabelMode", "#cityBuildingMode"].forEach((selector) => {
      $(selector).addEventListener("change", () => {
        readCitySettings();
        persistSoon();
        renderCity();
      });
    });

    [
      ["#showCityGrid", "showGrid"],
      ["#showCityWalls", "showWalls"],
      ["#showCityBuildings", "showBuildings"],
      ["#showCityWater", "showWater"],
      ["#showCityMarkers", "showMarkers"],
      ["#showCityMarkerLabels", "showMarkerLabels"],
      ["#showCityDistrictLabels", "showDistrictLabels"],
      ["#showCityFields", "showFields"],
    ].forEach(([selector, key]) => {
      $(selector).addEventListener("change", (event) => {
        cityState.settings[key] = event.target.checked;
        persistSoon();
        renderCity();
      });
    });

    cityCanvas.addEventListener("wheel", handleCityWheel, { passive: false });
    cityCanvas.addEventListener("pointerdown", handleCityPointerDown);
    cityCanvas.addEventListener("pointermove", handleCityPointerMove);
    cityCanvas.addEventListener("pointerup", handleCityPointerUp);
    cityCanvas.addEventListener("pointercancel", handleCityPointerUp);
  }

  function syncCityInputs() {
    $("#cityMapName").value = cityState.settings.name;
    $("#cityMapPopulation").value = cityState.settings.population;
    $("#cityMapArea").value = cityState.settings.areaKm2;
    $("#cityMapSeed").value = cityState.settings.seed;
    $("#cityVisualStyle").value = cityState.settings.visualStyle;
    $("#cityDensityMode").value = cityState.settings.densityMode;
    $("#cityLabelMode").value = cityState.settings.labelMode;
    $("#cityBuildingMode").value = cityState.settings.buildingMode;
    $("#cityGridMeters").value = cityState.settings.gridMeters;
    $("#cityExportWidth").value = cityState.settings.exportWidth;
    $("#cityTerrainKind").value = cityState.settings.terrainKind;
    $("#cityBuildingKind").value = cityState.settings.buildingKind;
    $("#cityBrushMeters").value = cityState.settings.brushMeters;
    $("#cityRoadWidth").value = cityState.settings.roadWidth;
    $("#cityMarkerName").value = cityState.settings.markerName;
    $("#cityMarkerType").value = cityState.settings.markerType;
    $$("[data-city-tool]").forEach((button) => button.classList.toggle("active", button.dataset.cityTool === cityState.settings.tool));
    $("#showCityGrid").checked = cityState.settings.showGrid;
    $("#showCityWalls").checked = cityState.settings.showWalls;
    $("#showCityBuildings").checked = cityState.settings.showBuildings;
    $("#showCityWater").checked = cityState.settings.showWater;
    $("#showCityMarkers").checked = cityState.settings.showMarkers;
    $("#showCityMarkerLabels").checked = cityState.settings.showMarkerLabels;
    $("#showCityDistrictLabels").checked = cityState.settings.showDistrictLabels;
    $("#showCityFields").checked = cityState.settings.showFields;
  }

  function readCitySettings() {
    cityState.settings.name = $("#cityMapName").value.trim() || "Cidade";
    cityState.settings.population = clamp(parseInt($("#cityMapPopulation").value, 10) || 10000, 1000, 1000000);
    cityState.settings.areaKm2 = clamp(Number($("#cityMapArea").value) || 10, 1, 300);
    cityState.settings.seed = $("#cityMapSeed").value.trim() || cityState.settings.name;
    cityState.settings.visualStyle = $("#cityVisualStyle").value;
    cityState.settings.densityMode = $("#cityDensityMode").value;
    cityState.settings.labelMode = $("#cityLabelMode").value;
    cityState.settings.buildingMode = $("#cityBuildingMode").value;
    cityState.settings.gridMeters = clamp(parseInt($("#cityGridMeters").value, 10) || 250, 50, 1000);
    cityState.settings.exportWidth = clamp(parseInt($("#cityExportWidth").value, 10) || 3600, 1600, 8000);
    cityState.settings.terrainKind = $("#cityTerrainKind").value;
    cityState.settings.buildingKind = $("#cityBuildingKind").value;
    cityState.settings.brushMeters = clamp(parseInt($("#cityBrushMeters").value, 10) || 80, 5, 500);
    cityState.settings.roadWidth = clamp(parseInt($("#cityRoadWidth").value, 10) || 18, 4, 120);
    cityState.settings.markerName = $("#cityMarkerName").value.trim() || "Novo ponto";
    cityState.settings.markerType = $("#cityMarkerType").value;
  }

  function syncMapInputs() {
    $("#mapFloor").value = mapState.floor;
    $("#mapGridPx").value = mapState.settings.gridPx;
    $("#mapMetersTile").value = mapState.settings.metersPerTile;
    $("#partySpeed").value = mapState.settings.partySpeed;
    $("#cityPopulation").value = mapState.settings.cityPopulation;
    $("#cityDensity").value = mapState.settings.cityDensity;
    $("#cityAreaOverride").value = mapState.settings.cityAreaOverride;
    $("#showCityFootprint").checked = mapState.settings.showCityFootprint;
    $("#mapPaintMode").value = mapState.settings.paintMode;
    $("#mapPaintColor").value = mapState.settings.paintColor;
    $("#mapPaintSize").value = mapState.settings.paintSize;
    $("#mapPaintOpacity").value = mapState.settings.paintOpacity;
    $("#mapImportMaxSize").value = mapState.settings.importMaxSize;
    $("#mapImportProfile").value = mapState.settings.importProfile;
    $("#mapImportUsePaint").checked = mapState.settings.importUseMapPaint;
    renderImportRuleControls();
    $("#showMapGrid").checked = mapState.settings.showGrid;
    $("#showMapRoutes").checked = mapState.settings.showRoutes;
    $("#showMapMarkers").checked = mapState.settings.showMarkers;
    $("#showTibiaMarkers").checked = mapState.settings.showTibiaMarkers;
    $("#showMapLabels").checked = mapState.settings.showLabels;
    $("#showMapScale").checked = mapState.settings.showScale;
    updateMapCropReadout();
    renderMapImportPreview();
  }

  function syncDungeonInputs() {
    $("#dungeonWidth").value = dungeonState.data.width;
    $("#dungeonHeight").value = dungeonState.data.height;
    $("#brushSize").value = dungeonState.brushSize;
    $("#showDungeonGrid").checked = dungeonState.showGrid;
    $("#showDungeonLabels").checked = dungeonState.showLabels;
    $("#showDungeonSecrets").checked = dungeonState.showSecrets;
    $("#exportCellSize").value = dungeonState.exportCellSize;
    updateDungeonReadouts();
  }

  function resizeAll() {
    if (activeMode === "map") {
      resizeCanvas(mapCanvas, mapCtx);
      renderMap();
    } else if (activeMode === "dungeon") {
      resizeCanvas(dungeonCanvas, dungeonCtx);
      renderDungeon();
    } else {
      resizeCanvas(cityCanvas, cityCtx);
      renderCity();
    }
  }

  function resizeCanvas(canvas, ctx) {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.floor(rect.width * ratio));
    const height = Math.max(1, Math.floor(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width: rect.width, height: rect.height };
  }

  function canvasSize(canvas) {
    const rect = canvas.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }

  function getCanvasPoint(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function fitMap() {
    if (!mapState.ready) return;
    const size = canvasSize(mapCanvas);
    const scale = Math.min(size.width / mapImage.width, size.height / mapImage.height) * 0.94;
    mapState.view.scale = scale;
    mapState.view.x = (size.width - mapImage.width * scale) / 2;
    mapState.view.y = (size.height - mapImage.height * scale) / 2;
    persistSoon();
    renderMap();
  }

  function zoomMap(multiplier) {
    if (!mapState.ready) return;
    const size = canvasSize(mapCanvas);
    const point = { x: size.width / 2, y: size.height / 2 };
    zoomMapAt(point, multiplier);
  }

  function zoomMapAt(point, multiplier) {
    const before = screenToMapImage(point);
    const nextScale = clamp(mapState.view.scale * multiplier, 0.12, 5);
    mapState.view.scale = nextScale;
    mapState.view.x = point.x - before.x * nextScale;
    mapState.view.y = point.y - before.y * nextScale;
    persistSoon();
    renderMap();
  }

  function renderMap() {
    const size = resizeCanvas(mapCanvas, mapCtx);
    mapCtx.clearRect(0, 0, size.width, size.height);
    mapCtx.fillStyle = "#171513";
    mapCtx.fillRect(0, 0, size.width, size.height);

    if (!mapState.ready) {
      drawCenteredText(mapCtx, size.width, size.height, "Carregando mapa...");
      return;
    }

    const view = mapState.view;
    mapCtx.imageSmoothingEnabled = mapState.view.scale < 1;
    mapCtx.drawImage(mapImage, view.x, view.y, mapImage.width * view.scale, mapImage.height * view.scale);
    drawMapEditsScreen(mapCtx);

    if (mapState.settings.showCityFootprint) drawCityFootprintScreen(mapCtx);
    if (mapState.settings.showGrid) drawMapGridScreen(mapCtx);
    drawMapCropScreen(mapCtx);
    if (mapState.settings.showRoutes) drawRoutesScreen(mapCtx);
    if (mapState.settings.showMarkers) drawMarkersScreen(mapCtx);
    if (mapState.ruler.start) drawRulerScreen(mapCtx);
    if (mapState.settings.showScale) drawScaleBarScreen(mapCtx, size.width, size.height);
    updateMapReadouts();
  }

  function drawMapEditsScreen(ctx) {
    rebuildMapEditCacheIfNeeded();
    if (!mapEditCache.width || !mapEditCache.height) return;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      mapEditCache,
      mapState.view.x,
      mapState.view.y,
      mapImage.width * mapState.view.scale,
      mapImage.height * mapState.view.scale
    );
    ctx.restore();
  }

  function drawCityFootprintScreen(ctx) {
    const info = cityScaleInfo();
    if (!info || !Number.isFinite(info.sideTiles)) return;
    const centerPlace = findPlace(mapState.selectedId) || findPlace("thais") || builtInPlaces.find((place) => place.floor === mapState.floor);
    if (!centerPlace) return;
    const center = placePoint(centerPlace);
    const side = info.sideTiles;
    const topLeft = mapImageToScreen({ x: center.x - side / 2, y: center.y - side / 2 });
    const size = side * mapState.view.scale;

    ctx.save();
    ctx.fillStyle = "rgba(210, 173, 85, 0.10)";
    ctx.strokeStyle = "rgba(255, 224, 161, 0.90)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 7]);
    ctx.fillRect(topLeft.x, topLeft.y, size, size);
    ctx.strokeRect(topLeft.x, topLeft.y, size, size);
    ctx.setLineDash([]);
    ctx.font = "700 14px Georgia";
    const label = `${info.displayAreaKm2.toFixed(info.displayAreaKm2 < 100 ? 1 : 0)} km²`;
    const width = ctx.measureText(label).width + 16;
    roundedRect(ctx, topLeft.x + 8, topLeft.y + 8, width, 24, 5);
    ctx.fillStyle = "rgba(24, 19, 14, 0.88)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 224, 161, 0.58)";
    ctx.stroke();
    ctx.fillStyle = "#ffe0a1";
    ctx.fillText(label, topLeft.x + 16, topLeft.y + 25);
    ctx.restore();
  }

  function rebuildMapEditCacheIfNeeded() {
    if (!mapState.ready) return;
    if (mapEditCache.width !== mapImage.width || mapEditCache.height !== mapImage.height) {
      mapEditCache.width = mapImage.width;
      mapEditCache.height = mapImage.height;
      mapEditCacheDirty = true;
    }
    if (!mapEditCacheDirty) return;
    mapEditCacheCtx.clearRect(0, 0, mapEditCache.width, mapEditCache.height);
    mapState.editStrokes
      .filter((stroke) => stroke.floor === mapState.floor)
      .forEach((stroke) => drawMapStroke(mapEditCacheCtx, stroke));
    if (mapState.currentStroke) drawMapStroke(mapEditCacheCtx, mapState.currentStroke);
    mapEditCacheDirty = false;
  }

  function drawMapStroke(ctx, stroke) {
    if (!stroke || !stroke.points || stroke.points.length === 0) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalCompositeOperation = stroke.mode === "erase" ? "destination-out" : "source-over";
    ctx.globalAlpha = stroke.mode === "erase" ? 1 : clamp(stroke.opacity ?? 0.8, 0.05, 1);
    ctx.strokeStyle = stroke.color || "#3f6d3f";
    ctx.lineWidth = Math.max(1, stroke.sizeTiles || 4);
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    if (stroke.points.length === 1) {
      ctx.lineTo(stroke.points[0].x + 0.01, stroke.points[0].y + 0.01);
    } else {
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawMapGridScreen(ctx) {
    const step = clamp(mapState.settings.gridPx, 16, 512);
    const view = mapState.view;
    ctx.save();
    ctx.strokeStyle = "rgba(30, 24, 16, 0.40)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let x = 0; x <= mapImage.width; x += step) {
      const sx = view.x + x * view.scale;
      ctx.beginPath();
      ctx.moveTo(sx, view.y);
      ctx.lineTo(sx, view.y + mapImage.height * view.scale);
      ctx.stroke();
    }
    for (let y = 0; y <= mapImage.height; y += step) {
      const sy = view.y + y * view.scale;
      ctx.beginPath();
      ctx.moveTo(view.x, sy);
      ctx.lineTo(view.x + mapImage.width * view.scale, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMapCropScreen(ctx) {
    const crop = normalizedMapCrop();
    if (!crop) return;
    const a = mapImageToScreen({ x: crop.x, y: crop.y });
    const b = mapImageToScreen({ x: crop.x + crop.w, y: crop.y + crop.h });
    ctx.save();
    ctx.fillStyle = "rgba(255, 224, 161, 0.12)";
    ctx.strokeStyle = "rgba(255, 224, 161, 0.95)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 6]);
    ctx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    ctx.setLineDash([]);
    ctx.font = "700 13px Georgia";
    const importSize = importSizeForCrop(crop);
    const label = `${Math.round(crop.w)} x ${Math.round(crop.h)} -> ${importSize.width} x ${importSize.height}`;
    const width = ctx.measureText(label).width + 16;
    roundedRect(ctx, a.x + 8, a.y + 8, width, 24, 5);
    ctx.fillStyle = "rgba(24, 19, 14, 0.88)";
    ctx.fill();
    ctx.fillStyle = "#ffe0a1";
    ctx.fillText(label, a.x + 16, a.y + 25);
    ctx.restore();
  }

  function drawRoutesScreen(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(84, 37, 26, 0.72)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 7]);
    routeSets.forEach((route) => {
      const routePlaces = route.map((id) => findPlace(id)).filter(Boolean);
      if (routePlaces.length < 2) return;
      ctx.beginPath();
      routePlaces.forEach((place, index) => {
        const point = mapImageToScreen(placePoint(place));
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawMarkersScreen(ctx) {
    const allPlaces = getDrawablePlaces();
    allPlaces.forEach((place) => {
      const point = mapImageToScreen(placePoint(place));
      const isSelected = place.id === mapState.selectedId;
      const isCustom = place.custom === true;
      const isTibia = place.source === "tibiamaps";
      const radius = isTibia ? (isSelected ? 6 : 4) : (isSelected ? 9 : 7);
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.fillStyle = isTibia ? "#d2ad55" : isCustom ? "#4e7388" : "#9f332c";
      ctx.strokeStyle = isSelected ? "#ffe0a1" : "#2b1b12";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f8e8c2";
      ctx.beginPath();
      ctx.arc(0, 0, isTibia ? 1.4 : 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      if (mapState.settings.showLabels && (!isTibia || isSelected || mapState.view.scale > 1.6)) {
        drawMarkerLabel(ctx, place, point, isSelected);
      }
    });
  }

  function drawMarkerLabel(ctx, place, point, selected) {
    ctx.save();
    const text = place.name;
    ctx.font = selected ? "700 15px Georgia" : "600 13px Georgia";
    const width = ctx.measureText(text).width + 14;
    const x = point.x + 10;
    const y = point.y - 22;
    ctx.fillStyle = selected ? "rgba(38, 28, 18, 0.92)" : "rgba(38, 28, 18, 0.78)";
    roundedRect(ctx, x, y, width, 24, 5);
    ctx.fill();
    ctx.strokeStyle = selected ? "rgba(255, 224, 161, 0.88)" : "rgba(232, 219, 188, 0.28)";
    ctx.stroke();
    ctx.fillStyle = "#f4e5c3";
    ctx.fillText(text, x + 7, y + 16);
    ctx.restore();
  }

  function drawRulerScreen(ctx) {
    const start = mapImageToScreen(mapState.ruler.start);
    const endImage = mapState.ruler.end || mapState.ruler.start;
    const end = mapImageToScreen(endImage);
    const distance = distanceKm(mapState.ruler.start, endImage);
    ctx.save();
    ctx.strokeStyle = "#2f1c10";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.strokeStyle = "#f3d38a";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#9f332c";
    ctx.strokeStyle = "#ffe0a1";
    [start, end].forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
    const label = formatDistance(distance);
    ctx.font = "700 14px Georgia";
    const width = ctx.measureText(label).width + 16;
    roundedRect(ctx, mid.x - width / 2, mid.y - 30, width, 24, 5);
    ctx.fillStyle = "rgba(24, 19, 14, 0.92)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 224, 161, 0.64)";
    ctx.stroke();
    ctx.fillStyle = "#ffe0a1";
    ctx.fillText(label, mid.x - width / 2 + 8, mid.y - 14);
    ctx.restore();
  }

  function drawScaleBarScreen(ctx, width, height) {
    const candidates = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 40];
    const pxPerKm = mapState.view.scale * 1000 / mapState.settings.metersPerTile;
    let chosen = candidates[0];
    for (const km of candidates) {
      const px = km * pxPerKm;
      if (px >= 90 && px <= 220) {
        chosen = km;
        break;
      }
      if (px < 220) chosen = km;
    }
    const barWidth = chosen * pxPerKm;
    const x = 22;
    const y = height - 34;
    ctx.save();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#201812";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + barWidth, y);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#f0d48b";
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + barWidth, y);
    ctx.stroke();
    ctx.fillStyle = "#f0d48b";
    ctx.font = "700 13px Georgia";
    ctx.fillText(formatDistance(chosen), x, y - 9);
    ctx.restore();
  }

  function handleMapWheel(event) {
    event.preventDefault();
    if (!mapState.ready) return;
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    zoomMapAt(getCanvasPoint(mapCanvas, event), factor);
  }

  function handleMapPointerDown(event) {
    if (!mapState.ready) return;
    mapCanvas.setPointerCapture(event.pointerId);
    const screenPoint = getCanvasPoint(mapCanvas, event);
    const imagePoint = screenToMapImage(screenPoint);
    const hit = hitTestMarker(screenPoint);

    if (hit && mapState.tool !== "marker" && mapState.tool !== "paint" && mapState.tool !== "crop") {
      selectMarker(hit.id, false);
      return;
    }

    if (mapState.tool === "ruler") {
      if (!mapState.ruler.start || mapState.ruler.end) {
        mapState.ruler = { start: imagePoint, end: null };
      } else {
        mapState.ruler.end = imagePoint;
      }
      renderMap();
      return;
    }

    if (mapState.tool === "marker") {
      if (isInsideMap(imagePoint)) addCustomMarker(imagePoint);
      return;
    }

    if (mapState.tool === "paint") {
      if (isInsideMap(imagePoint)) startMapPaint(imagePoint);
      return;
    }

    if (mapState.tool === "crop") {
      if (isInsideMap(imagePoint)) startMapCrop(imagePoint);
      return;
    }

    mapState.dragging = true;
    mapState.dragStart = {
      point: screenPoint,
      view: { ...mapState.view },
    };
  }

  function handleMapPointerMove(event) {
    if (!mapState.ready) return;
    const screenPoint = getCanvasPoint(mapCanvas, event);
    if (mapState.tool === "ruler" && mapState.ruler.start && !mapState.ruler.end) {
      mapState.ruler.end = screenToMapImage(screenPoint);
      renderMap();
      mapState.ruler.end = null;
      return;
    }
    if (mapState.painting && mapState.tool === "paint") {
      continueMapPaint(screenToMapImage(screenPoint));
      return;
    }
    if (mapState.cropping && mapState.tool === "crop") {
      continueMapCrop(screenToMapImage(screenPoint));
      return;
    }
    if (!mapState.dragging || !mapState.dragStart) return;
    const dx = screenPoint.x - mapState.dragStart.point.x;
    const dy = screenPoint.y - mapState.dragStart.point.y;
    mapState.view.x = mapState.dragStart.view.x + dx;
    mapState.view.y = mapState.dragStart.view.y + dy;
    renderMap();
  }

  function handleMapPointerUp(event) {
    if (mapCanvas.hasPointerCapture(event.pointerId)) mapCanvas.releasePointerCapture(event.pointerId);
    if (mapState.dragging) persistSoon();
    if (mapState.painting) finishMapPaint();
    if (mapState.cropping) finishMapCrop();
    mapState.dragging = false;
    mapState.dragStart = null;
  }

  function startMapCrop(point) {
    mapState.cropping = true;
    const p = clampMapPoint(point);
    mapState.crop = { start: p, end: p, floor: mapState.floor };
    updateMapCropReadout();
    renderMap();
  }

  function continueMapCrop(point) {
    if (!mapState.crop) return;
    mapState.crop.end = clampMapPoint(point);
    updateMapCropReadout();
    renderMap();
  }

  function finishMapCrop() {
    mapState.cropping = false;
    if (normalizedMapCrop()) persistSoon();
    updateMapCropReadout();
    renderMap();
  }

  function clampMapPoint(point) {
    return {
      x: Math.round(clamp(point.x, 0, mapImage.width)),
      y: Math.round(clamp(point.y, 0, mapImage.height)),
    };
  }

  function startMapPaint(point) {
    mapState.painting = true;
    mapState.currentStroke = {
      id: `stroke-${Date.now()}`,
      floor: mapState.floor,
      mode: mapState.settings.paintMode === "erase" ? "erase" : "paint",
      color: mapState.settings.paintColor,
      sizeTiles: clamp(Number(mapState.settings.paintSize) || 8, 1, 96),
      opacity: clamp(Number(mapState.settings.paintOpacity) || 0.8, 0.05, 1),
      points: [normalizePaintPoint(point)],
    };
    mapEditCacheDirty = true;
    renderMap();
  }

  function continueMapPaint(point) {
    if (!mapState.currentStroke || !isInsideMap(point)) return;
    const nextPoint = normalizePaintPoint(point);
    const points = mapState.currentStroke.points;
    const previous = points[points.length - 1];
    const minDistance = Math.max(0.6, mapState.currentStroke.sizeTiles * 0.18);
    const dx = nextPoint.x - previous.x;
    const dy = nextPoint.y - previous.y;
    if (Math.sqrt(dx * dx + dy * dy) < minDistance) return;
    points.push(nextPoint);
    mapEditCacheDirty = true;
    renderMap();
  }

  function finishMapPaint() {
    mapState.painting = false;
    if (mapState.currentStroke && mapState.currentStroke.points.length > 0) {
      mapState.editStrokes.push(mapState.currentStroke);
      mapState.redoStrokes = [];
      mapState.currentStroke = null;
      mapEditCacheDirty = true;
      persistSoon();
      renderMap();
    }
  }

  function normalizePaintPoint(point) {
    return {
      x: Math.round(clamp(point.x, 0, mapImage.width) * 10) / 10,
      y: Math.round(clamp(point.y, 0, mapImage.height) * 10) / 10,
    };
  }

  function undoMapEdit() {
    const stroke = mapState.editStrokes.pop();
    if (!stroke) return;
    mapState.redoStrokes.push(stroke);
    mapEditCacheDirty = true;
    persistSoon();
    renderMap();
  }

  function redoMapEdit() {
    const stroke = mapState.redoStrokes.pop();
    if (!stroke) return;
    mapState.editStrokes.push(stroke);
    mapEditCacheDirty = true;
    persistSoon();
    renderMap();
  }

  function normalizedMapCrop() {
    const crop = mapState.crop;
    if (!crop || crop.floor !== mapState.floor || !crop.start || !crop.end) return null;
    const x1 = clamp(Math.min(crop.start.x, crop.end.x), 0, mapImage.width);
    const y1 = clamp(Math.min(crop.start.y, crop.end.y), 0, mapImage.height);
    const x2 = clamp(Math.max(crop.start.x, crop.end.x), 0, mapImage.width);
    const y2 = clamp(Math.max(crop.start.y, crop.end.y), 0, mapImage.height);
    const w = Math.round(x2 - x1);
    const h = Math.round(y2 - y1);
    if (w < 2 || h < 2) return null;
    return { x: Math.round(x1), y: Math.round(y1), w, h, floor: mapState.floor };
  }

  function importSizeForCrop(crop) {
    const maxSide = clamp(Number(mapState.settings.importMaxSize) || 240, 20, 500);
    const scale = Math.min(1, maxSide / Math.max(crop.w, crop.h));
    return {
      width: clamp(Math.max(2, Math.round(crop.w * scale)), 2, 500),
      height: clamp(Math.max(2, Math.round(crop.h * scale)), 2, 500),
      scale,
    };
  }

  function updateMapCropReadout() {
    const target = $("#mapCropReadout");
    if (!target) return;
    const crop = normalizedMapCrop();
    if (!crop) {
      target.innerHTML = `<span>Use a ferramenta <strong>Recorte</strong> e arraste no mapa.</span>`;
      renderMapImportPreview();
      return;
    }
    const size = importSizeForCrop(crop);
    target.innerHTML = `
      <span>Recorte: <strong>${crop.w} x ${crop.h}</strong> tiles do Tibia</span>
      <span>Masmorra: <strong>${size.width} x ${size.height}</strong> quadrados</span>
      <span>Andar: <strong>${crop.floor}</strong></span>
    `;
    renderMapImportPreview();
  }

  function sendMapCropToDungeon() {
    const crop = normalizedMapCrop();
    if (!crop || !mapState.ready) return;
    const size = importSizeForCrop(crop);
    const conversion = convertMapCropToDungeon(crop, size);
    const dungeon = createDungeon(size.width, size.height);
    dungeon.cells = conversion.cells;
    dungeon.labels.push({
      id: `crop-label-${Date.now()}`,
      x: 1,
      y: 1,
      text: `${conversion.profileLabel} z${crop.floor}`,
      secret: true,
    });
    dungeonState.data = dungeon;
    dungeonState.undo = [];
    syncDungeonInputs();
    setActiveMode("dungeon", true);
    requestAnimationFrame(fitDungeon);
    persistSoon();
  }

  function renderImportRuleControls() {
    const target = $("#mapImportRules");
    if (!target) return;
    mapState.settings.importRules = normalizeImportRules(mapState.settings.importRules, mapState.settings.importProfile);
    const options = tileDefs.map((tile) => `<option value="${escapeHtml(tile.id)}">${escapeHtml(tile.label)}</option>`).join("");
    target.innerHTML = importRuleDefs.map((rule) => `
      <label class="import-rule-row">
        <span class="import-rule-swatch" style="background:${rule.color}"></span>
        <span class="import-rule-name">${escapeHtml(rule.label)}</span>
        <select data-import-rule="${escapeHtml(rule.id)}">${options}</select>
      </label>
    `).join("");
    target.querySelectorAll("[data-import-rule]").forEach((select) => {
      select.value = mapState.settings.importRules[select.dataset.importRule] || "floor";
    });
  }

  function renderMapImportPreview() {
    const canvas = $("#mapImportPreviewCanvas");
    const summary = $("#mapImportSummary");
    if (!canvas || !summary) return;
    const crop = normalizedMapCrop();
    if (!crop || !mapState.ready) {
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, 1, 1);
      summary.innerHTML = `<span>Nenhum recorte para pre-visualizar.</span>`;
      return;
    }
    const importSize = importSizeForCrop(crop);
    const previewSize = previewSizeForImport(importSize);
    const conversion = convertMapCropToDungeon(crop, previewSize);
    canvas.width = previewSize.width;
    canvas.height = previewSize.height;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < previewSize.height; y += 1) {
      for (let x = 0; x < previewSize.width; x += 1) {
        const tileId = conversion.cells[y * previewSize.width + x];
        ctx.fillStyle = tileById[tileId]?.color || tileById.empty.color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
    summary.innerHTML = `
      <span>Perfil: <strong>${escapeHtml(conversion.profileLabel)}</strong></span>
      <span>Previa: <strong>${previewSize.width} x ${previewSize.height}</strong> | Final: <strong>${importSize.width} x ${importSize.height}</strong></span>
      <span>${formatImportCounts(conversion.counts)}</span>
    `;
  }

  function convertMapCropToDungeon(crop, size) {
    const source = createMapCropSourceCanvas(crop, size);
    const imageData = source.ctx.getImageData(0, 0, size.width, size.height).data;
    const ruleIds = Array(size.width * size.height);
    const ruleCounts = {};
    for (let i = 0; i < ruleIds.length; i += 1) {
      const offset = i * 4;
      const ruleId = classifyImportPixel(
        imageData[offset],
        imageData[offset + 1],
        imageData[offset + 2],
        imageData[offset + 3]
      );
      ruleIds[i] = ruleId;
      ruleCounts[ruleId] = (ruleCounts[ruleId] || 0) + 1;
    }
    const profile = resolveImportProfile(crop, size, ruleCounts);
    const rules = importRulesForProfile(profile);
    const cells = Array(size.width * size.height);
    const counts = {};
    for (let y = 0; y < size.height; y += 1) {
      for (let x = 0; x < size.width; x += 1) {
        const index = y * size.width + x;
        const tileId = tileById[rules[ruleIds[index]]] ? rules[ruleIds[index]] : "floor";
        cells[index] = tileId;
        counts[tileId] = (counts[tileId] || 0) + 1;
      }
    }
    return { cells, counts, ruleCounts, profile, profileLabel: resolvedImportProfileLabel(profile) };
  }

  function createMapCropSourceCanvas(crop, size) {
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mapImage, crop.x, crop.y, crop.w, crop.h, 0, 0, size.width, size.height);
    if (mapState.settings.importUseMapPaint) {
      rebuildMapEditCacheIfNeeded();
      ctx.drawImage(mapEditCache, crop.x, crop.y, crop.w, crop.h, 0, 0, size.width, size.height);
    }
    return { canvas, ctx };
  }

  function importPixelToDungeonTile(r, g, b, a) {
    const ruleId = classifyImportPixel(r, g, b, a);
    const mapped = importRulesForProfile(mapState.settings.importProfile)?.[ruleId];
    if (tileById[mapped]) return mapped;
    return legacyPixelToDungeonTile(r, g, b, a);
  }

  function classifyImportPixel(r, g, b, a) {
    if (a < 20) return "void";
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 20) return "void";
    const { h, s, l } = rgbToHsl(r, g, b);
    const chroma = max - min;
    if (b > r + 18 && b > g + 4 && h >= 175 && h <= 235) return "water";
    if (h >= 18 && h <= 38 && s > 0.48 && r > 145 && g > 55 && b < 105) return "orange";
    if ((h <= 17 || h >= 344) && s > 0.42 && r > 105 && g < 115 && b < 105) return "red";
    if (h >= 78 && h <= 152 && s > 0.32 && g > r + 8 && g > b + 8) {
      if (l > 0.56 || (g > 220 && r > 45 && b > 35)) return "lightGreen";
      if (g > 150 && r < 80 && b < 90) return "green";
      if (l < 0.43 || g < 140) return "darkGreen";
      return "green";
    }
    if (h >= 42 && h <= 65 && s > 0.28 && r > 120 && g > 105 && b < 115) return "yellow";
    if (h >= 8 && h <= 34 && s > 0.24 && l < 0.48 && r > g && g >= b) return "earth";
    if (r > 150 && g > 118 && b > 78 && h >= 28 && h <= 55 && l > 0.44) return "sand";
    if (chroma < 34 && max > 45) return "stone";
    return legacyPixelRule(r, g, b, a);
  }

  function legacyPixelRule(r, g, b, a) {
    const tile = legacyPixelToDungeonTile(r, g, b, a);
    if (tile === "water") return "water";
    if (tile === "lava") return "orange";
    if (tile === "wall") return "stone";
    if (tile === "rough") return "green";
    if (tile === "empty") return "void";
    return "sand";
  }

  function legacyPixelToDungeonTile(r, g, b, a) {
    if (a < 20) return "empty";
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 18) return "empty";
    if (b > r + 20 && b > g + 8) return "water";
    if (r > 180 && g < 110 && b < 80) return "lava";
    if (g > 120 && r < 110 && b < 110) return "grass";
    if (Math.abs(r - g) < 18 && Math.abs(g - b) < 18) return max > 120 ? "floor" : "wall";
    if (r > 120 && g > 70 && g < 150 && b < 95) return "floor";
    if (r > 90 && g > 55 && b < 55) return "wall";
    if (max - min < 35) return "wall";
    return "floor";
  }

  function previewSizeForImport(size) {
    const maxSide = 180;
    const scale = Math.min(1, maxSide / Math.max(size.width, size.height));
    return {
      width: Math.max(2, Math.round(size.width * scale)),
      height: Math.max(2, Math.round(size.height * scale)),
    };
  }

  function normalizeImportRules(rules, profile) {
    const defaults = defaultImportRules(profile);
    const normalized = { ...defaults };
    if (rules && typeof rules === "object") {
      importRuleDefs.forEach((rule) => {
        if (tileById[rules[rule.id]]) normalized[rule.id] = rules[rule.id];
      });
      if (profile === "tibia-auto" && rules.orange === "lava") normalized.orange = defaults.orange;
      if (rules.darkGreen === "rough" && defaults.darkGreen === "forest") normalized.darkGreen = "forest";
      if (!Object.prototype.hasOwnProperty.call(rules, "green") && defaults.green) normalized.green = defaults.green;
    }
    return normalized;
  }

  function normalizeImportProfileId(profile, rules) {
    if (!profile) return "tibia-auto";
    if (profile === "tibia-dungeon" && rules && !Object.prototype.hasOwnProperty.call(rules, "green")) return "tibia-auto";
    return importProfileDefaults[profile] ? profile : "tibia-auto";
  }

  function defaultImportRules(profile) {
    return { ...(importProfileDefaults[profile] || importProfileDefaults["tibia-auto"]) };
  }

  function importRulesForProfile(profile) {
    if (profile === mapState.settings.importProfile) {
      return normalizeImportRules(mapState.settings.importRules, profile);
    }
    return defaultImportRules(profile);
  }

  function resolveImportProfile(crop, size, ruleCounts) {
    const selectedProfile = normalizeImportProfileId(mapState.settings.importProfile);
    if (selectedProfile !== "tibia-auto") return selectedProfile;
    const total = Math.max(1, size.width * size.height);
    const ratio = (ruleId) => (ruleCounts[ruleId] || 0) / total;
    const greenRatio = ratio("green") + ratio("darkGreen") + ratio("lightGreen");
    const urbanRatio = ratio("orange") + ratio("red") + ratio("stone") + ratio("sand");

    if (crop.floor >= 6 && crop.floor <= 8 && ratio("orange") > 0.035 && urbanRatio > 0.38 && greenRatio > 0.035) {
      return "tibia-city";
    }
    if (ratio("orange") > 0.075 && greenRatio < 0.06) return "tibia-dungeon";
    if (crop.floor >= 6 && crop.floor <= 8) return "tibia-world";
    return "tibia-dungeon";
  }

  function importProfileLabel(profile = mapState.settings.importProfile) {
    return importProfileDefs.find((item) => item.id === profile)?.label || "Tibia automatico";
  }

  function resolvedImportProfileLabel(profile) {
    const selectedProfile = normalizeImportProfileId(mapState.settings.importProfile);
    if (selectedProfile === "tibia-auto" && profile !== "tibia-auto") {
      return `${importProfileLabel("tibia-auto")} -> ${importProfileLabel(profile)}`;
    }
    return importProfileLabel(profile);
  }

  function formatImportCounts(counts) {
    const total = Math.max(1, Object.values(counts).reduce((sum, count) => sum + count, 0));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tileId, count]) => `${escapeHtml(tileById[tileId]?.label || tileId)} ${Math.round(count / total * 100)}%`)
      .join(" | ") || "Sem tiles detectados.";
  }

  function rgbToHsl(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    let h = 0;
    const l = (max + min) / 2;
    const d = max - min;
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (d !== 0) {
      if (max === rn) h = 60 * (((gn - bn) / d) % 6);
      else if (max === gn) h = 60 * ((bn - rn) / d + 2);
      else h = 60 * ((rn - gn) / d + 4);
    }
    if (h < 0) h += 360;
    return { h, s, l };
  }

  function addCustomMarker(point) {
    const marker = {
      id: `custom-${Date.now()}`,
      custom: true,
      name: $("#newMarkerName").value.trim() || "Ponto de Interesse",
      type: $("#newMarkerType").value,
      note: $("#newMarkerNote").value.trim(),
      x: clamp(point.x, 0, mapImage.width),
      y: clamp(point.y, 0, mapImage.height),
      floor: mapState.floor,
    };
    mapState.customMarkers.push(marker);
    mapState.selectedId = marker.id;
    persistSoon();
    renderMarkerList();
    renderSelectedMarker();
    renderMap();
  }

  function deleteCustomMarker(id) {
    mapState.customMarkers = mapState.customMarkers.filter((marker) => marker.id !== id);
    if (mapState.selectedId === id) mapState.selectedId = null;
    persistSoon();
    renderMarkerList();
    renderSelectedMarker();
    renderMap();
  }

  function selectMarker(id, focus) {
    const place = findPlace(id);
    if (!place) return;
    mapState.selectedId = id;
    if (focus && mapState.ready) {
      const size = canvasSize(mapCanvas);
      const point = placePoint(place);
      const scale = clamp(Math.max(mapState.view.scale, place.source === "tibiamaps" ? 1.8 : 1.25), 0.22, 4);
      mapState.view.scale = scale;
      mapState.view.x = size.width / 2 - point.x * scale;
      mapState.view.y = size.height / 2 - point.y * scale;
    }
    renderSelectedMarker();
    renderMarkerList();
    renderMap();
  }

  function renderMarkerList() {
    const query = ($("#markerSearch")?.value || "").toLowerCase();
    const places = getListPlaces(query)
      .filter((place) => `${place.name} ${place.type} ${place.note}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
      .slice(0, 90);

    $("#markerList").innerHTML = places.map((place) => `
      <div class="marker-item">
        <div>
          <div class="marker-name">${escapeHtml(place.name)}</div>
          <div class="marker-type">${escapeHtml(place.type)}${place.source === "tibiamaps" ? " - TibiaMaps" : ""}</div>
        </div>
        <div class="button-row">
          <button type="button" data-focus-marker="${escapeHtml(place.id)}">Ir</button>
          ${place.custom ? `<button type="button" data-delete-marker="${escapeHtml(place.id)}">X</button>` : ""}
        </div>
      </div>
    `).join("") || `<div class="empty-state">Nenhum local encontrado.</div>`;
  }

  function renderSelectedMarker() {
    const target = $("#selectedMarker");
    const place = findPlace(mapState.selectedId);
    if (!place) {
      target.innerHTML = `<div class="empty-state">Clique em um marcador do mapa.</div>`;
      return;
    }
    const point = placePoint(place);
    const gridX = Math.round(point.x / mapState.settings.gridPx);
    const gridY = Math.round(point.y / mapState.settings.gridPx);
    const coords = placeCoords(place);
    target.innerHTML = `
      <h3>${escapeHtml(place.name)}</h3>
      <div class="tag">${escapeHtml(place.type)}</div>
      <p>${escapeHtml(place.note || "Sem nota.")}</p>
      <div class="coords">Tibia ${coords.x}, ${coords.y}, ${mapState.floor} | Grid ${gridX}, ${gridY}</div>
      ${place.custom ? `<div class="button-row"><button type="button" data-delete-selected="${escapeHtml(place.id)}">Remover marco</button></div>` : ""}
    `;
    const deleteButton = target.querySelector("[data-delete-selected]");
    if (deleteButton) {
      deleteButton.addEventListener("click", () => deleteCustomMarker(deleteButton.dataset.deleteSelected));
    }
  }

  function updateMapReadouts() {
    $("#mapScaleReadout").textContent = `1 tile = ${mapState.settings.metersPerTile} m`;
    $("#mapZoomReadout").textContent = `${Math.round(mapState.view.scale * 100)}%`;
    updateCityScaleReadout();
    const hasRuler = mapState.ruler.start && mapState.ruler.end;
    if (hasRuler) {
      const km = distanceKm(mapState.ruler.start, mapState.ruler.end);
      const days = km / Math.max(1, mapState.settings.partySpeed);
      $("#rulerReadout").textContent = formatDistance(km);
      $("#travelReadout").textContent = `${days.toFixed(days < 10 ? 1 : 0)} dias`;
    } else {
      $("#rulerReadout").textContent = "--";
      $("#travelReadout").textContent = "--";
    }
  }

  function updateCityScaleReadout() {
    const target = $("#cityScaleReadout");
    if (!target) return;
    const info = cityScaleInfo();
    if (!info) {
      target.innerHTML = "<span>Preencha populacao e densidade validas.</span>";
      return;
    }
    target.innerHTML = `
      <span>Area por densidade: <strong>${info.densityAreaKm2.toFixed(info.densityAreaKm2 < 100 ? 1 : 0)} km²</strong></span>
      <span>Area desenhada: <strong>${info.displayAreaKm2.toFixed(info.displayAreaKm2 < 100 ? 1 : 0)} km²</strong></span>
      <span>Lado equivalente: <strong>${info.sideKm.toFixed(info.sideKm < 10 ? 2 : 1)} km</strong></span>
      <span>Tiles por lado: <strong>${Math.round(info.sideTiles).toLocaleString("pt-BR")}</strong></span>
      <span>Mapa atual: <strong>${info.mapWidthKm.toFixed(1)} x ${info.mapHeightKm.toFixed(1)} km</strong></span>
      <span>${info.fitsMap ? "Cabe no andar atual." : "Nao cabe inteiro no andar atual nessa escala."}</span>
    `;
  }

  function downloadMapPng() {
    if (!mapState.ready) return;
    const scale = 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = mapImage.width * scale;
    offscreen.height = mapImage.height * scale;
    const ctx = offscreen.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mapImage, 0, 0);
    rebuildMapEditCacheIfNeeded();
    ctx.drawImage(mapEditCache, 0, 0);
    if (mapState.settings.showCityFootprint) drawCityFootprintNatural(ctx);
    if (mapState.settings.showGrid) drawMapGridNatural(ctx);
    if (mapState.settings.showRoutes) drawRoutesNatural(ctx);
    if (mapState.settings.showMarkers) drawMarkersNatural(ctx);
    drawMapExportScale(ctx);
    downloadCanvas(offscreen, "danubia-mapa-campanha.png");
  }

  function drawMapGridNatural(ctx) {
    const step = clamp(mapState.settings.gridPx, 16, 512);
    ctx.save();
    ctx.strokeStyle = "rgba(30, 24, 16, 0.34)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    for (let x = 0; x <= mapImage.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, mapImage.height);
      ctx.stroke();
    }
    for (let y = 0; y <= mapImage.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(mapImage.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRoutesNatural(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(84, 37, 26, 0.78)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    routeSets.forEach((route) => {
      const routePlaces = route.map((id) => findPlace(id)).filter(Boolean);
      if (routePlaces.length < 2) return;
      ctx.beginPath();
      routePlaces.forEach((place, index) => {
        const point = placePoint(place);
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawMarkersNatural(ctx) {
    getExportPlaces().forEach((place) => {
      const point = placePoint(place);
      ctx.save();
      ctx.fillStyle = place.source === "tibiamaps" ? "#d2ad55" : place.custom ? "#4e7388" : "#9f332c";
      ctx.strokeStyle = "#2b1b12";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (mapState.settings.showLabels) {
        ctx.font = "700 18px Georgia";
        ctx.fillStyle = "rgba(38, 28, 18, 0.86)";
        const width = ctx.measureText(place.name).width + 18;
        roundedRect(ctx, point.x + 12, point.y - 30, width, 28, 6);
        ctx.fill();
        ctx.fillStyle = "#f4e5c3";
        ctx.fillText(place.name, point.x + 21, point.y - 11);
      }
      ctx.restore();
    });
  }

  function drawCityFootprintNatural(ctx) {
    const info = cityScaleInfo();
    if (!info || !Number.isFinite(info.sideTiles)) return;
    const centerPlace = findPlace(mapState.selectedId) || findPlace("thais") || builtInPlaces.find((place) => place.floor === mapState.floor);
    if (!centerPlace) return;
    const center = placePoint(centerPlace);
    const side = info.sideTiles;
    const x = center.x - side / 2;
    const y = center.y - side / 2;
    ctx.save();
    ctx.fillStyle = "rgba(210, 173, 85, 0.10)";
    ctx.strokeStyle = "rgba(255, 224, 161, 0.90)";
    ctx.lineWidth = 3;
    ctx.setLineDash([14, 10]);
    ctx.fillRect(x, y, side, side);
    ctx.strokeRect(x, y, side, side);
    ctx.restore();
  }

  function drawMapExportScale(ctx) {
    const km = 1;
    const width = km * 1000 / mapState.settings.metersPerTile;
    const x = 48;
    const y = mapImage.height - 54;
    ctx.save();
    ctx.strokeStyle = "#201812";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.strokeStyle = "#f0d48b";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.fillStyle = "#201812";
    ctx.font = "700 20px Georgia";
    ctx.fillText(formatDistance(km), x, y - 14);
    ctx.restore();
  }

  function renderTilePalette() {
    $("#tilePalette").innerHTML = tileDefs.map((tile) => `
      <button type="button" class="tile-button ${tile.id === dungeonState.tile ? "active" : ""}" data-tile="${tile.id}">
        <span class="swatch" style="background:${tile.color}"></span>
        <span>${tile.label}</span>
      </button>
    `).join("");

    $$(".tile-button").forEach((button) => {
      button.addEventListener("click", () => {
        dungeonState.tile = button.dataset.tile;
        $$(".tile-button").forEach((item) => item.classList.toggle("active", item === button));
        updateDungeonReadouts();
      });
    });
  }

  function renderTileLegend() {
    $("#tileLegend").innerHTML = tileDefs.filter((tile) => tile.id !== "empty").map((tile) => `
      <div class="legend-row">
        <span class="swatch" style="background:${tile.color}"></span>
        <span><strong>${tile.label}</strong></span>
      </div>
    `).join("");
  }

  function fitDungeon() {
    const size = canvasSize(dungeonCanvas);
    const scale = Math.min(size.width / dungeonState.data.width, size.height / dungeonState.data.height) * 0.92;
    dungeonState.view.scale = clamp(scale, 1, 72);
    dungeonState.view.x = (size.width - dungeonState.data.width * dungeonState.view.scale) / 2;
    dungeonState.view.y = (size.height - dungeonState.data.height * dungeonState.view.scale) / 2;
    renderDungeon();
  }

  function renderDungeon() {
    const size = resizeCanvas(dungeonCanvas, dungeonCtx);
    dungeonCtx.clearRect(0, 0, size.width, size.height);
    dungeonCtx.fillStyle = "#121110";
    dungeonCtx.fillRect(0, 0, size.width, size.height);

    drawDungeonToContext(dungeonCtx, {
      x: dungeonState.view.x,
      y: dungeonState.view.y,
      cell: dungeonState.view.scale,
      grid: dungeonState.showGrid,
      labels: dungeonState.showLabels,
      gm: dungeonState.showSecrets,
      screen: true,
    });

    drawDungeonPreview(dungeonCtx);
    updateDungeonReadouts();
  }

  function drawDungeonToContext(ctx, options) {
    const { data } = dungeonState;
    const cell = options.cell;
    for (let y = 0; y < data.height; y += 1) {
      for (let x = 0; x < data.width; x += 1) {
        const tileId = data.cells[indexFor(x, y)];
        drawDungeonTile(ctx, options.x + x * cell, options.y + y * cell, cell, tileId, options.gm, x, y);
      }
    }

    if (options.grid && (!options.screen || cell >= 4)) {
      drawDungeonGrid(ctx, options.x, options.y, data.width, data.height, cell);
    }

    if (options.labels) {
      drawDungeonLabels(ctx, options.x, options.y, cell, options.gm);
    }
  }

  function drawDungeonTile(ctx, x, y, size, tileId, gmView, gridX, gridY) {
    const tile = tileById[tileId] || tileById.empty;
    const visibleId = tileId === "secret" && !gmView ? "wall" : tileId;
    const visibleTile = tileById[visibleId] || tile;
    ctx.save();
    ctx.fillStyle = visibleTile.color;
    ctx.fillRect(x, y, size, size);
    if (size < 4) {
      ctx.restore();
      return;
    }

    if (visibleId === "floor") drawFloorTexture(ctx, x, y, size);
    if (visibleId === "wall") drawWallTexture(ctx, x, y, size);
    if (visibleId === "door") drawDoor(ctx, x, y, size, doorOrientation(gridX, gridY));
    if (visibleId === "secret") drawSecretDoor(ctx, x, y, size, doorOrientation(gridX, gridY));
    if (visibleId === "water") drawWater(ctx, x, y, size);
    if (visibleId === "acid") drawAcid(ctx, x, y, size);
    if (visibleId === "grass") drawGrass(ctx, x, y, size);
    if (visibleId === "forest") drawForest(ctx, x, y, size);
    if (visibleId === "lava") drawLava(ctx, x, y, size);
    if (visibleId === "rough") drawRough(ctx, x, y, size);
    if (visibleId === "trap") drawTrap(ctx, x, y, size);
    if (visibleId === "chest") drawChest(ctx, x, y, size);
    if (visibleId === "stairs") drawStairs(ctx, x, y, size);

    ctx.restore();
  }

  function drawFloorTexture(ctx, x, y, size) {
    ctx.strokeStyle = "rgba(55, 36, 18, 0.18)";
    ctx.lineWidth = Math.max(1, size * 0.025);
    ctx.strokeRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);
  }

  function drawWallTexture(ctx, x, y, size) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(x, y, size, size * 0.18);
    ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
    ctx.fillRect(x, y + size * 0.76, size, size * 0.24);
    ctx.strokeStyle = "rgba(0, 0, 0, 0.28)";
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.strokeRect(x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84);
  }

  function drawDoor(ctx, x, y, size, orientation) {
    ctx.fillStyle = tileById.floor.color;
    ctx.fillRect(x, y, size, size);
    drawDoorPanel(ctx, x, y, size, orientation);
  }

  function drawDoorPanel(ctx, x, y, size, orientation) {
    const angles = {
      horizontal: 0,
      vertical: Math.PI / 2,
      diagonalDown: Math.PI / 4,
      diagonalUp: -Math.PI / 4,
    };
    const angle = angles[orientation] ?? 0;
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(angle);
    ctx.fillStyle = "#6e341b";
    roundedRect(ctx, -size * 0.38, -size * 0.13, size * 0.76, size * 0.26, Math.max(1, size * 0.04));
    ctx.fill();
    ctx.strokeStyle = "#2a130a";
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.stroke();
    ctx.fillStyle = "#d7aa48";
    ctx.beginPath();
    ctx.arc(size * 0.24, 0, Math.max(1.3, size * 0.045), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSecretDoor(ctx, x, y, size, orientation) {
    drawWallTexture(ctx, x, y, size);
    ctx.save();
    ctx.globalAlpha = 0.42;
    drawDoorPanel(ctx, x, y, size, orientation);
    ctx.restore();
    ctx.fillStyle = "rgba(255, 224, 161, 0.82)";
    ctx.font = `700 ${Math.max(11, size * 0.44)}px Georgia`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("S", x + size / 2, y + size / 2);
    ctx.textAlign = "start";
    ctx.textBaseline = "alphabetic";
  }

  function doorOrientation(gridX, gridY) {
    if (!Number.isFinite(gridX) || !Number.isFinite(gridY)) return "horizontal";

    const openWest = isDoorConnectionTile(dungeonTileAt(gridX - 1, gridY));
    const openEast = isDoorConnectionTile(dungeonTileAt(gridX + 1, gridY));
    const openNorth = isDoorConnectionTile(dungeonTileAt(gridX, gridY - 1));
    const openSouth = isDoorConnectionTile(dungeonTileAt(gridX, gridY + 1));
    const openNorthWest = isDoorConnectionTile(dungeonTileAt(gridX - 1, gridY - 1));
    const openSouthEast = isDoorConnectionTile(dungeonTileAt(gridX + 1, gridY + 1));
    const openNorthEast = isDoorConnectionTile(dungeonTileAt(gridX + 1, gridY - 1));
    const openSouthWest = isDoorConnectionTile(dungeonTileAt(gridX - 1, gridY + 1));

    const horizontalScore = Number(openWest) + Number(openEast);
    const verticalScore = Number(openNorth) + Number(openSouth);
    const diagonalDownScore = Number(openNorthWest) + Number(openSouthEast);
    const diagonalUpScore = Number(openNorthEast) + Number(openSouthWest);

    if (diagonalDownScore === 2 && horizontalScore < 2 && verticalScore < 2) return "diagonalDown";
    if (diagonalUpScore === 2 && horizontalScore < 2 && verticalScore < 2) return "diagonalUp";
    if (verticalScore > horizontalScore) return "vertical";
    if (horizontalScore > verticalScore) return "horizontal";
    if (diagonalDownScore > diagonalUpScore && diagonalDownScore > 0) return "diagonalDown";
    if (diagonalUpScore > diagonalDownScore && diagonalUpScore > 0) return "diagonalUp";
    return "horizontal";
  }

  function dungeonTileAt(x, y) {
    if (!inDungeon(x, y)) return "empty";
    return dungeonState.data.cells[indexFor(x, y)] || "empty";
  }

  function isDoorConnectionTile(tileId) {
    return tileId !== "empty" && tileId !== "wall" && Boolean(tileById[tileId]);
  }

  function drawWater(ctx, x, y, size) {
    ctx.strokeStyle = "rgba(226, 244, 255, 0.34)";
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.12, y + size * 0.42);
    ctx.quadraticCurveTo(x + size * 0.35, y + size * 0.22, x + size * 0.58, y + size * 0.42);
    ctx.quadraticCurveTo(x + size * 0.76, y + size * 0.58, x + size * 0.92, y + size * 0.42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + size * 0.08, y + size * 0.66);
    ctx.quadraticCurveTo(x + size * 0.30, y + size * 0.48, x + size * 0.54, y + size * 0.66);
    ctx.quadraticCurveTo(x + size * 0.72, y + size * 0.80, x + size * 0.94, y + size * 0.64);
    ctx.stroke();
  }

  function drawAcid(ctx, x, y, size) {
    ctx.fillStyle = "rgba(222, 255, 82, 0.24)";
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(x + size * (0.24 + i * 0.22), y + size * (0.36 + (i % 2) * 0.22), size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(30, 72, 20, 0.36)";
    ctx.lineWidth = Math.max(1, size * 0.025);
    ctx.strokeRect(x + size * 0.12, y + size * 0.12, size * 0.76, size * 0.76);
  }

  function drawGrass(ctx, x, y, size) {
    ctx.strokeStyle = "rgba(205, 239, 145, 0.34)";
    ctx.lineWidth = Math.max(1, size * 0.026);
    for (const [px, py] of [[0.25, 0.62], [0.46, 0.42], [0.69, 0.68]]) {
      ctx.beginPath();
      ctx.moveTo(x + size * px, y + size * py);
      ctx.quadraticCurveTo(x + size * (px + 0.04), y + size * (py - 0.15), x + size * (px + 0.12), y + size * (py - 0.05));
      ctx.stroke();
    }
  }

  function drawForest(ctx, x, y, size) {
    ctx.fillStyle = "rgba(8, 30, 15, 0.30)";
    for (const [px, py, r] of [[0.28, 0.34, 0.14], [0.50, 0.50, 0.18], [0.70, 0.32, 0.13], [0.35, 0.72, 0.12]]) {
      ctx.beginPath();
      ctx.arc(x + size * px, y + size * py, size * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(212, 229, 161, 0.22)";
    ctx.lineWidth = Math.max(1, size * 0.022);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.82);
    ctx.lineTo(x + size * 0.80, y + size * 0.18);
    ctx.stroke();
  }

  function drawLava(ctx, x, y, size) {
    ctx.fillStyle = "rgba(255, 214, 92, 0.52)";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.18, y + size * 0.72);
    ctx.lineTo(x + size * 0.36, y + size * 0.26);
    ctx.lineTo(x + size * 0.52, y + size * 0.74);
    ctx.lineTo(x + size * 0.72, y + size * 0.28);
    ctx.lineTo(x + size * 0.86, y + size * 0.72);
    ctx.closePath();
    ctx.fill();
  }

  function drawRough(ctx, x, y, size) {
    ctx.fillStyle = "rgba(37, 26, 16, 0.34)";
    for (const [px, py, r] of [[0.28, 0.30, 0.12], [0.62, 0.42, 0.15], [0.40, 0.72, 0.10]]) {
      ctx.beginPath();
      ctx.arc(x + size * px, y + size * py, size * r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTrap(ctx, x, y, size) {
    ctx.fillStyle = tileById.floor.color;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "#3d1614";
    ctx.fillStyle = "rgba(168, 56, 50, 0.86)";
    ctx.lineWidth = Math.max(1, size * 0.045);
    ctx.beginPath();
    ctx.moveTo(x + size * 0.50, y + size * 0.18);
    ctx.lineTo(x + size * 0.82, y + size * 0.78);
    ctx.lineTo(x + size * 0.18, y + size * 0.78);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function drawChest(ctx, x, y, size) {
    ctx.fillStyle = tileById.floor.color;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#8b5422";
    ctx.strokeStyle = "#321c0d";
    ctx.lineWidth = Math.max(1, size * 0.04);
    roundedRect(ctx, x + size * 0.22, y + size * 0.34, size * 0.56, size * 0.38, size * 0.06);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e2ba57";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.22, y + size * 0.50);
    ctx.lineTo(x + size * 0.78, y + size * 0.50);
    ctx.stroke();
  }

  function drawStairs(ctx, x, y, size) {
    ctx.fillStyle = tileById.floor.color;
    ctx.fillRect(x, y, size, size);
    ctx.strokeStyle = "rgba(35, 24, 15, 0.76)";
    ctx.lineWidth = Math.max(1, size * 0.045);
    for (let i = 0; i < 5; i += 1) {
      const yy = y + size * (0.22 + i * 0.13);
      ctx.beginPath();
      ctx.moveTo(x + size * 0.22, yy);
      ctx.lineTo(x + size * 0.78, yy);
      ctx.stroke();
    }
  }

  function drawDungeonGrid(ctx, x, y, width, height, cell) {
    ctx.save();
    ctx.strokeStyle = "rgba(23, 18, 14, 0.58)";
    ctx.lineWidth = Math.max(1, cell * 0.02);
    for (let gx = 0; gx <= width; gx += 1) {
      const px = x + gx * cell;
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + height * cell);
      ctx.stroke();
    }
    for (let gy = 0; gy <= height; gy += 1) {
      const py = y + gy * cell;
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + width * cell, py);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDungeonLabels(ctx, x, y, cell, gmView) {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    dungeonState.data.labels.forEach((label) => {
      if (label.secret && !gmView) return;
      const sx = x + (label.x + 0.5) * cell;
      const sy = y + (label.y + 0.5) * cell;
      const fontSize = clamp(cell * 0.38, 10, 28);
      ctx.font = `700 ${fontSize}px Georgia`;
      const width = ctx.measureText(label.text).width + 12;
      ctx.fillStyle = "rgba(20, 16, 12, 0.72)";
      roundedRect(ctx, sx - width / 2, sy - fontSize * 0.72, width, fontSize * 1.35, 5);
      ctx.fill();
      ctx.fillStyle = "#ffe0a1";
      ctx.fillText(label.text, sx, sy);
    });
    ctx.restore();
  }

  function drawDungeonPreview(ctx) {
    if (!dungeonState.drawing || !dungeonState.dragStart || !dungeonState.dragCurrent) return;
    const a = dungeonState.dragStart;
    const b = dungeonState.dragCurrent;
    ctx.save();
    ctx.strokeStyle = "#ffe0a1";
    ctx.fillStyle = "rgba(255, 224, 161, 0.16)";
    ctx.lineWidth = 2;
    if (dungeonState.mode === "room") {
      const rect = cellRect(a, b);
      ctx.fillRect(
        dungeonState.view.x + rect.x * dungeonState.view.scale,
        dungeonState.view.y + rect.y * dungeonState.view.scale,
        rect.w * dungeonState.view.scale,
        rect.h * dungeonState.view.scale
      );
      ctx.strokeRect(
        dungeonState.view.x + rect.x * dungeonState.view.scale,
        dungeonState.view.y + rect.y * dungeonState.view.scale,
        rect.w * dungeonState.view.scale,
        rect.h * dungeonState.view.scale
      );
    }
    if (dungeonState.mode === "corridor") {
      cellsOnLine(a, b).forEach((cell) => {
        ctx.fillRect(
          dungeonState.view.x + cell.x * dungeonState.view.scale,
          dungeonState.view.y + cell.y * dungeonState.view.scale,
          dungeonState.view.scale,
          dungeonState.view.scale
        );
      });
    }
    ctx.restore();
  }

  function handleDungeonWheel(event) {
    event.preventDefault();
    const point = getCanvasPoint(dungeonCanvas, event);
    const before = screenToDungeonCellFloat(point);
    const factor = event.deltaY < 0 ? 1.12 : 0.89;
    const next = clamp(dungeonState.view.scale * factor, 1, 110);
    dungeonState.view.scale = next;
    dungeonState.view.x = point.x - before.x * next;
    dungeonState.view.y = point.y - before.y * next;
    renderDungeon();
  }

  function handleDungeonPointerDown(event) {
    dungeonCanvas.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(dungeonCanvas, event);
    const cell = screenToDungeonCell(point);
    if (dungeonState.mode === "pan") {
      dungeonState.drawing = true;
      dungeonState.panStart = { point, view: { ...dungeonState.view } };
      return;
    }
    if (!inDungeon(cell.x, cell.y)) return;

    if (dungeonState.mode === "label") {
      const text = $("#labelText").value.trim();
      if (!text) return;
      pushDungeonUndo();
      dungeonState.data.labels.push({ id: `label-${Date.now()}`, x: cell.x, y: cell.y, text, secret: false });
      persistSoon();
      renderDungeon();
      renderLabelList();
      return;
    }

    pushDungeonUndo();
    dungeonState.drawing = true;
    dungeonState.dragStart = cell;
    dungeonState.dragCurrent = cell;
    if (dungeonState.mode === "paint") {
      paintDungeon(cell);
      persistSoon();
    }
    renderDungeon();
  }

  function handleDungeonPointerMove(event) {
    if (!dungeonState.drawing) return;
    const point = getCanvasPoint(dungeonCanvas, event);
    if (dungeonState.mode === "pan" && dungeonState.panStart) {
      const dx = point.x - dungeonState.panStart.point.x;
      const dy = point.y - dungeonState.panStart.point.y;
      dungeonState.view.x = dungeonState.panStart.view.x + dx;
      dungeonState.view.y = dungeonState.panStart.view.y + dy;
      renderDungeon();
      return;
    }

    const cell = screenToDungeonCell(point);
    dungeonState.dragCurrent = cell;
    if (dungeonState.mode === "paint" && inDungeon(cell.x, cell.y)) {
      paintDungeon(cell);
      persistSoon();
    }
    renderDungeon();
  }

  function handleDungeonPointerUp(event) {
    if (dungeonCanvas.hasPointerCapture(event.pointerId)) dungeonCanvas.releasePointerCapture(event.pointerId);
    if (dungeonState.drawing && dungeonState.dragStart && dungeonState.dragCurrent) {
      if (dungeonState.mode === "room") {
        applyRoom(dungeonState.dragStart, dungeonState.dragCurrent);
        persistSoon();
      }
      if (dungeonState.mode === "corridor") {
        applyCorridor(dungeonState.dragStart, dungeonState.dragCurrent);
        persistSoon();
      }
    }
    dungeonState.drawing = false;
    dungeonState.dragStart = null;
    dungeonState.dragCurrent = null;
    dungeonState.panStart = null;
    renderDungeon();
  }

  function paintDungeon(cell) {
    const radius = Math.floor((dungeonState.brushSize - 1) / 2);
    for (let y = cell.y - radius; y <= cell.y + radius; y += 1) {
      for (let x = cell.x - radius; x <= cell.x + radius; x += 1) {
        if (inDungeon(x, y)) dungeonState.data.cells[indexFor(x, y)] = dungeonState.tile;
      }
    }
  }

  function applyRoom(start, end) {
    const rect = cellRect(start, end);
    for (let y = rect.y; y < rect.y + rect.h; y += 1) {
      for (let x = rect.x; x < rect.x + rect.w; x += 1) {
        if (!inDungeon(x, y)) continue;
        const border = x === rect.x || y === rect.y || x === rect.x + rect.w - 1 || y === rect.y + rect.h - 1;
        dungeonState.data.cells[indexFor(x, y)] = border ? "wall" : "floor";
      }
    }
  }

  function applyCorridor(start, end) {
    cellsOnLine(start, end).forEach((cell) => {
      if (!inDungeon(cell.x, cell.y)) return;
      paintDungeon({ x: cell.x, y: cell.y });
    });
  }

  function pushDungeonUndo() {
    dungeonState.undo.push(JSON.stringify(dungeonState.data));
    if (dungeonState.undo.length > 40) dungeonState.undo.shift();
  }

  function undoDungeon() {
    const snapshot = dungeonState.undo.pop();
    if (!snapshot) return;
    dungeonState.data = normalizeDungeon(JSON.parse(snapshot)) || createDungeon(30, 22);
    syncDungeonInputs();
    persistSoon();
    renderDungeon();
    renderLabelList();
  }

  function downloadDungeonJson() {
    const payload = JSON.stringify(dungeonState.data, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    downloadBlob(blob, "danubia-masmorra.json");
  }

  function loadDungeonJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const normalized = normalizeDungeon(parsed);
        if (!normalized) throw new Error("Formato invalido");
        pushDungeonUndo();
        dungeonState.data = normalized;
        syncDungeonInputs();
        fitDungeon();
        persistSoon();
        renderLabelList();
      } catch (error) {
        alert("Nao foi possivel abrir este JSON de masmorra.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  function effectiveDungeonExportCell() {
    const requested = clamp(Number(dungeonState.exportCellSize) || 70, DUNGEON_EXPORT_MIN_CELL, DUNGEON_EXPORT_MAX_CELL);
    const maxDimension = Math.max(1, dungeonState.data.width, dungeonState.data.height);
    const fitted = clamp(Math.floor(DUNGEON_EXPORT_MAX_SIDE / maxDimension), DUNGEON_EXPORT_MIN_CELL, DUNGEON_EXPORT_MAX_CELL);
    return Math.min(requested, fitted);
  }

  function downloadDungeonPng(gmView) {
    const requestedCell = clamp(dungeonState.exportCellSize, DUNGEON_EXPORT_MIN_CELL, DUNGEON_EXPORT_MAX_CELL);
    const cell = effectiveDungeonExportCell();
    const offscreen = document.createElement("canvas");
    offscreen.width = dungeonState.data.width * cell;
    offscreen.height = dungeonState.data.height * cell;
    const ctx = offscreen.getContext("2d");
    ctx.fillStyle = "#121110";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    drawDungeonToContext(ctx, {
      x: 0,
      y: 0,
      cell,
      grid: dungeonState.showGrid,
      labels: dungeonState.showLabels,
      gm: gmView,
      screen: false,
    });
    downloadCanvas(offscreen, gmView ? "danubia-masmorra-mestre.png" : "danubia-masmorra-jogadores.png");
    if (cell < requestedCell) {
      alert(`PNG exportado com ${cell}px por quadrado para manter o arquivo em ate ${DUNGEON_EXPORT_MAX_SIDE}px no maior lado.`);
    }
  }

  function renderLabelList() {
    const labels = dungeonState.data.labels;
    $("#labelList").innerHTML = labels.map((label) => `
      <div class="label-item">
        <div>
          <div class="label-name">${escapeHtml(label.text)}</div>
          <div class="label-position">x${label.x + 1}, y${label.y + 1}</div>
        </div>
        <button type="button" data-delete-label="${escapeHtml(label.id)}">X</button>
      </div>
    `).join("") || `<div class="empty-state">Nenhuma etiqueta.</div>`;
  }

  function updateDungeonReadouts() {
    $("#dungeonSizeReadout").textContent = `${dungeonState.data.width} x ${dungeonState.data.height}`;
    $("#dungeonModeReadout").textContent = modeLabel(dungeonState.mode);
    $("#dungeonTileReadout").textContent = tileById[dungeonState.tile]?.label || "Piso";
    const exportCell = effectiveDungeonExportCell();
    const suffix = exportCell < dungeonState.exportCellSize ? ` (${exportCell}px/quad.)` : "";
    $("#dungeonExportReadout").textContent = `${dungeonState.data.width * exportCell} x ${dungeonState.data.height * exportCell}${suffix}`;
  }

  function generateCity() {
    generateIllustratedCity();
    return;
    const rng = createRng(cityState.settings.seed);
    const areaM2 = cityState.settings.areaKm2 * 1000000;
    const aspect = 1.62;
    const widthM = Math.sqrt(areaM2 * aspect);
    const heightM = areaM2 / widthM;
    const center = { x: widthM * 0.54, y: heightM * 0.50 };
    const wall = { x: center.x, y: center.y, rx: widthM * 0.36, ry: heightM * 0.36 };

    const districts = buildCityDistricts(widthM, heightM);
    const roads = buildCityRoads(widthM, heightM, center, rng);
    const river = buildCityRiver(widthM, heightM);
    const fields = buildCityFields(widthM, heightM, rng);
    const buildings = buildCityBuildings(widthM, heightM, wall, roads, districts, rng);
    const markers = buildCityMarkers(widthM, heightM, center);

    cityState.data = {
      name: cityState.settings.name,
      population: cityState.settings.population,
      areaKm2: cityState.settings.areaKm2,
      widthM,
      heightM,
      wall,
      river,
      fields,
      districts,
      roads,
      buildings,
      markers,
      manual: createEmptyCityManual(),
    };
    fitCity();
    renderCityLists();
    updateCityReadouts();
  }

  function buildCityDistricts(width, height) {
    return [
      { id: "castle", name: "Cidadela Real", color: "#b9b0a1", x: width * 0.40, y: height * 0.08, w: width * 0.28, h: height * 0.18 },
      { id: "center", name: "Centro Antigo", color: "#c69f73", x: width * 0.38, y: height * 0.34, w: width * 0.28, h: height * 0.26 },
      { id: "port", name: "Porto e Docas", color: "#9b7654", x: width * 0.14, y: height * 0.43, w: width * 0.28, h: height * 0.34 },
      { id: "market", name: "Mercado Grande", color: "#c9a25d", x: width * 0.48, y: height * 0.56, w: width * 0.22, h: height * 0.18 },
      { id: "noble", name: "Bairro Nobre", color: "#bfae86", x: width * 0.64, y: height * 0.25, w: width * 0.22, h: height * 0.24 },
      { id: "temple", name: "Distrito dos Templos", color: "#d0c6a4", x: width * 0.62, y: height * 0.52, w: width * 0.20, h: height * 0.18 },
      { id: "craft", name: "Oficinas e Forjas", color: "#a87b55", x: width * 0.32, y: height * 0.62, w: width * 0.26, h: height * 0.22 },
      { id: "garden", name: "Jardins Murados", color: "#7fa66a", x: width * 0.18, y: height * 0.18, w: width * 0.22, h: height * 0.20 },
      { id: "outer", name: "Bairros Externos", color: "#b98967", x: width * 0.65, y: height * 0.68, w: width * 0.24, h: height * 0.18 },
    ];
  }

  function buildCityRoads(width, height, center, rng) {
    const roads = [];
    const xRoads = [];
    const yRoads = [];
    for (let x = width * 0.16; x < width * 0.88; x += 210 + rng() * 70) xRoads.push(x);
    for (let y = height * 0.13; y < height * 0.86; y += 180 + rng() * 60) yRoads.push(y);

    xRoads.forEach((x, index) => {
      roads.push({ type: index % 5 === 0 ? "major" : "street", points: [{ x, y: height * 0.10 }, { x: x + jitter(rng, 45), y: height * 0.88 }] });
    });
    yRoads.forEach((y, index) => {
      roads.push({ type: index % 4 === 0 ? "major" : "street", points: [{ x: width * 0.12, y }, { x: width * 0.90, y: y + jitter(rng, 35) }] });
    });

    const gates = [
      { x: width * 0.54, y: height * 0.06 },
      { x: width * 0.90, y: height * 0.48 },
      { x: width * 0.55, y: height * 0.90 },
      { x: width * 0.12, y: height * 0.58 },
    ];
    gates.forEach((gate) => roads.push({ type: "avenue", points: [gate, center] }));
    roads.push({ type: "avenue", points: [{ x: width * 0.24, y: height * 0.70 }, { x: width * 0.42, y: height * 0.58 }, { x: center.x, y: center.y }] });
    roads.push({ type: "avenue", points: [{ x: width * 0.49, y: height * 0.18 }, { x: center.x, y: center.y }, { x: width * 0.68, y: height * 0.70 }] });
    return roads;
  }

  function buildCityRiver(width, height) {
    return [
      { x: width * -0.04, y: height * 0.34 },
      { x: width * 0.10, y: height * 0.36 },
      { x: width * 0.20, y: height * 0.44 },
      { x: width * 0.22, y: height * 0.60 },
      { x: width * 0.18, y: height * 0.82 },
      { x: width * 0.23, y: height * 1.04 },
    ];
  }

  function buildCityFields(width, height, rng) {
    const fields = [];
    for (let i = 0; i < 70; i += 1) {
      const leftSide = rng() < 0.48;
      const x = leftSide ? rng() * width * 0.28 : width * (0.72 + rng() * 0.24);
      const y = rng() * height;
      fields.push({
        x,
        y,
        w: 80 + rng() * 260,
        h: 70 + rng() * 220,
        color: rng() < 0.5 ? "#7f8f50" : "#9b8450",
      });
    }
    return fields;
  }

  function buildCityBuildings(width, height, wall, roads, districts, rng) {
    const buildings = [];
    const xCuts = makeCuts(width * 0.14, width * 0.88, 170, rng);
    const yCuts = makeCuts(height * 0.12, height * 0.86, 150, rng);
    for (let xi = 0; xi < xCuts.length - 1; xi += 1) {
      for (let yi = 0; yi < yCuts.length - 1; yi += 1) {
        const x1 = xCuts[xi];
        const x2 = xCuts[xi + 1];
        const y1 = yCuts[yi];
        const y2 = yCuts[yi + 1];
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;
        if (!insideEllipse(cx, cy, wall.x, wall.y, wall.rx * 1.08, wall.ry * 1.06)) continue;
        if (isNearRiver(cx, cy, width, height) && rng() < 0.55) continue;
        const district = districtAt(districts, cx, cy);
        const density = district?.id === "garden" ? 0.25 : district?.id === "noble" ? 0.45 : district?.id === "castle" ? 0.34 : 0.72;
        if (rng() > density) continue;
        const cols = clamp(Math.floor((x2 - x1) / (38 + rng() * 18)), 1, 5);
        const rows = clamp(Math.floor((y2 - y1) / (32 + rng() * 16)), 1, 5);
        const pad = 12;
        for (let col = 0; col < cols; col += 1) {
          for (let row = 0; row < rows; row += 1) {
            if (rng() < 0.24) continue;
            const bw = (x2 - x1 - pad * 2) / cols * (0.55 + rng() * 0.28);
            const bh = (y2 - y1 - pad * 2) / rows * (0.55 + rng() * 0.30);
            const bx = x1 + pad + col * ((x2 - x1 - pad * 2) / cols) + jitter(rng, 7);
            const by = y1 + pad + row * ((y2 - y1 - pad * 2) / rows) + jitter(rng, 7);
            buildings.push({
              x: bx,
              y: by,
              w: Math.max(14, bw),
              h: Math.max(12, bh),
              color: buildingColor(district, rng),
            });
          }
        }
      }
    }
    return buildings.slice(0, 6200);
  }

  function buildCityMarkers(width, height, center) {
    return [
      { name: "Castelo de Thais", type: "Poder", x: width * 0.54, y: height * 0.15 },
      { name: "Grande Orvalho", type: "Praca", x: center.x, y: center.y },
      { name: "Docas Reais", type: "Porto", x: width * 0.24, y: height * 0.68 },
      { name: "Mercado das Especiarias", type: "Mercado", x: width * 0.59, y: height * 0.63 },
      { name: "Templo das Marés", type: "Templo", x: width * 0.72, y: height * 0.58 },
      { name: "Quartel da Porta Leste", type: "Guarda", x: width * 0.86, y: height * 0.48 },
      { name: "Universidade Real", type: "Arcano", x: width * 0.70, y: height * 0.32 },
      { name: "Arena Baixa", type: "Lazer", x: width * 0.39, y: height * 0.73 },
      { name: "Catacumbas Antigas", type: "Masmorra", x: width * 0.34, y: height * 0.50 },
      { name: "Porta Norte", type: "Portao", x: width * 0.54, y: height * 0.08 },
      { name: "Porta Sul", type: "Portao", x: width * 0.55, y: height * 0.89 },
      { name: "Farol do Ancoradouro", type: "Marco", x: width * 0.18, y: height * 0.78 },
    ];
  }

  function renderCity() {
    renderIllustratedCity();
    return;
    const size = resizeCanvas(cityCanvas, cityCtx);
    cityCtx.clearRect(0, 0, size.width, size.height);
    cityCtx.fillStyle = "#3f5038";
    cityCtx.fillRect(0, 0, size.width, size.height);
    if (!cityState.data) {
      drawCenteredText(cityCtx, size.width, size.height, "Gere uma cidade.");
      return;
    }
    drawCityToContext(cityCtx, cityState.view.x, cityState.view.y, cityState.view.scale, true);
    updateCityReadouts();
  }

  function drawCityToContext(ctx, offsetX, offsetY, scale, screen) {
    drawIllustratedCityToContext(ctx, offsetX, offsetY, scale, screen);
    return;
    const data = cityState.data;
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    drawCityTerrain(ctx, data);
    if (cityState.settings.showFields) drawCityFields(ctx, data);
    drawCityDistricts(ctx, data);
    drawCityRiver(ctx, data);
    drawCityManualTerrain(ctx, data);
    drawCityRoads(ctx, data);
    drawCityManualRoads(ctx, data);
    if (cityState.settings.showWalls) drawCityWalls(ctx, data);
    if (cityState.settings.showBuildings) drawCityBuildings(ctx, data);
    if (cityState.settings.showBuildings) drawCityManualBuildings(ctx, data);
    if (cityState.settings.showGrid) drawCityGrid(ctx, data, scale, screen);
    if (cityState.settings.showMarkers) drawCityMarkers(ctx, data, scale, screen);
    if (cityState.settings.showDistrictLabels) drawCityDistrictLabels(ctx, data, scale, screen);
    ctx.restore();
    if (screen) drawCityScaleBar(ctx);
  }

  function drawCityTerrain(ctx, data) {
    ctx.fillStyle = "#526947";
    ctx.fillRect(0, 0, data.widthM, data.heightM);
    ctx.fillStyle = "rgba(34, 55, 31, 0.13)";
    for (let i = 0; i < 54; i += 1) {
      const x = (i * 379) % data.widthM;
      const y = (i * 241) % data.heightM;
      ctx.beginPath();
      ctx.ellipse(x, y, 160 + (i % 7) * 35, 90 + (i % 5) * 25, i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCityFields(ctx, data) {
    data.fields.forEach((field) => {
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = field.color;
      ctx.fillRect(field.x, field.y, field.w, field.h);
      ctx.strokeStyle = "rgba(45, 35, 20, 0.12)";
      ctx.lineWidth = 2;
      ctx.strokeRect(field.x, field.y, field.w, field.h);
      ctx.restore();
    });
  }

  function drawCityDistricts(ctx, data) {
    data.districts.forEach((district) => {
      ctx.fillStyle = district.color;
      ctx.globalAlpha = 0.16;
      roundedRect(ctx, district.x, district.y, district.w, district.h, 45);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  function drawCityRiver(ctx, data) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#28394a";
    ctx.lineWidth = 250;
    drawPolyline(ctx, data.river);
    ctx.stroke();
    ctx.strokeStyle = "#4f7891";
    ctx.lineWidth = 206;
    drawPolyline(ctx, data.river);
    ctx.stroke();
    ctx.strokeStyle = "rgba(221, 238, 225, 0.26)";
    ctx.lineWidth = 5;
    drawPolyline(ctx, data.river);
    ctx.stroke();
    ctx.restore();
  }

  function drawCityRoads(ctx, data) {
    data.roads.forEach((road) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = road.type === "avenue" ? "#cab88f" : road.type === "major" ? "#a99674" : "#756a56";
      ctx.globalAlpha = road.type === "avenue" ? 0.78 : road.type === "major" ? 0.58 : 0.34;
      ctx.lineWidth = road.type === "avenue" ? 22 : road.type === "major" ? 15 : 7;
      drawPolyline(ctx, road.points);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawCityManualTerrain(ctx, data) {
    ensureCityManual(data);
    data.manual.terrain.forEach((stroke) => drawCityStroke(ctx, stroke, terrainStyle(stroke.kind)));
    if (cityState.currentStroke?.type === "terrain") {
      drawCityStroke(ctx, cityState.currentStroke, terrainStyle(cityState.currentStroke.kind));
    }
  }

  function drawCityManualRoads(ctx, data) {
    ensureCityManual(data);
    data.manual.roads.forEach((stroke) => drawCityStroke(ctx, stroke, {
      color: stroke.kind === "trail" ? "#806f4f" : "#c9b587",
      alpha: 1,
      width: stroke.widthM,
    }));
    if (cityState.currentStroke?.type === "road") {
      drawCityStroke(ctx, cityState.currentStroke, {
        color: "#c9b587",
        alpha: 1,
        width: cityState.currentStroke.widthM,
      });
    }
  }

  function drawCityStroke(ctx, stroke, style) {
    if (!stroke.points?.length) return;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = style.color;
    ctx.globalAlpha = style.alpha ?? 1;
    ctx.lineWidth = style.width || stroke.sizeM || 40;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    if (stroke.points.length === 1) {
      ctx.lineTo(stroke.points[0].x + 0.1, stroke.points[0].y + 0.1);
    } else {
      for (let i = 1; i < stroke.points.length; i += 1) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCityWalls(ctx, data) {
    const { wall } = data;
    ctx.save();
    ctx.strokeStyle = "rgba(80, 73, 65, 0.62)";
    ctx.lineWidth = 34;
    ctx.beginPath();
    ctx.ellipse(wall.x, wall.y, wall.rx, wall.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(216, 200, 166, 0.64)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(wall.x, wall.y, wall.rx, wall.ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    const gates = [
      { x: data.widthM * 0.54, y: data.heightM * 0.08 },
      { x: data.widthM * 0.86, y: data.heightM * 0.48 },
      { x: data.widthM * 0.55, y: data.heightM * 0.89 },
      { x: data.widthM * 0.17, y: data.heightM * 0.58 },
    ];
    gates.forEach((gate) => {
      ctx.fillStyle = "#5a3322";
      ctx.beginPath();
      ctx.arc(gate.x, gate.y, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#cbb37c";
      ctx.fillRect(gate.x - 22, gate.y - 22, 44, 44);
    });
    ctx.restore();
  }

  function drawCityBuildings(ctx, data) {
    data.buildings.forEach((building) => {
      ctx.save();
      ctx.globalAlpha = 0.70;
      ctx.fillStyle = building.color;
      ctx.fillRect(building.x, building.y, building.w, building.h);
      ctx.strokeStyle = "rgba(40, 26, 16, 0.16)";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(building.x, building.y, building.w, building.h);
      if (building.w > 34 && building.h > 26) {
        ctx.fillStyle = "rgba(255, 234, 166, 0.11)";
        ctx.fillRect(building.x + building.w * 0.35, building.y + building.h * 0.35, building.w * 0.18, building.h * 0.18);
      }
      ctx.restore();
    });
  }

  function drawCityManualBuildings(ctx, data) {
    ensureCityManual(data);
    data.manual.buildings.forEach((building) => drawCityBuilding(ctx, building, true));
  }

  function drawCityBuilding(ctx, building, manual, theme = cityTheme()) {
    ctx.save();
    ctx.translate(building.x, building.y);
    ctx.rotate(building.rotation || 0);
    ctx.fillStyle = building.color || buildingColor({ id: "default" }, () => 0.5);
    ctx.fillRect(-building.w / 2, -building.h / 2, building.w, building.h);
    ctx.strokeStyle = manual ? theme.markerStroke : "rgba(37, 32, 25, 0.72)";
    ctx.lineWidth = manual ? 2.6 : 1.8;
    ctx.strokeRect(-building.w / 2, -building.h / 2, building.w, building.h);
    if (building.kind === "house" || building.generated) {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-building.w * 0.34, 0);
      ctx.lineTo(building.w * 0.34, 0);
      ctx.stroke();
    }
    if (building.kind === "noble" || building.kind === "temple") {
      ctx.fillStyle = "rgba(255, 244, 205, 0.38)";
      ctx.fillRect(-building.w * 0.18, -building.h * 0.18, building.w * 0.36, building.h * 0.36);
    }
    if (building.kind === "tower") {
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(building.w, building.h) * 0.35, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (building.kind === "ruin") {
      ctx.strokeStyle = "rgba(46, 33, 24, 0.72)";
      ctx.beginPath();
      ctx.moveTo(-building.w / 2, -building.h / 2);
      ctx.lineTo(building.w / 2, building.h / 2);
      ctx.moveTo(building.w / 2, -building.h / 2);
      ctx.lineTo(-building.w / 2, building.h / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCityGrid(ctx, data, scale, screen) {
    const step = cityState.settings.gridMeters;
    ctx.save();
    ctx.strokeStyle = "rgba(255, 224, 161, 0.08)";
    ctx.lineWidth = screen ? 1 / Math.max(scale, 0.001) : 2;
    ctx.setLineDash([10, 18]);
    for (let x = 0; x <= data.widthM; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, data.heightM);
      ctx.stroke();
    }
    for (let y = 0; y <= data.heightM; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(data.widthM, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCityMarkers(ctx, data, scale, screen) {
    ensureCityManual(data);
    [...data.markers, ...data.manual.markers].forEach((marker) => {
      ctx.save();
      ctx.fillStyle = marker.type === "Masmorra" ? "#7d2e2a" : marker.type === "Porto" ? "#426f8d" : "#9f332c";
      ctx.strokeStyle = "#f7dfa5";
      ctx.lineWidth = screen ? 1.5 / Math.max(scale, 0.001) : 5;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, screen ? 5 / Math.max(scale, 0.001) : 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (cityState.settings.showMarkerLabels || !screen) {
        const fontSize = screen ? 11 / Math.max(scale, 0.001) : 28;
        ctx.font = `700 ${fontSize}px Georgia`;
        const labelWidth = ctx.measureText(marker.name).width + fontSize;
        roundedRect(ctx, marker.x + fontSize * 0.8, marker.y - fontSize * 1.05, labelWidth, fontSize * 1.55, fontSize * 0.3);
        ctx.fillStyle = "rgba(28, 21, 15, 0.76)";
        ctx.fill();
        ctx.fillStyle = "#f4e5c3";
        ctx.fillText(marker.name, marker.x + fontSize * 1.25, marker.y - fontSize * 0.04);
      }
      ctx.restore();
    });
  }

  function drawCityDistrictLabels(ctx, data, scale, screen) {
    data.districts.forEach((district) => {
      ctx.save();
      const fontSize = screen ? 12 / Math.max(scale, 0.001) : 30;
      ctx.font = `700 ${fontSize}px Georgia`;
      ctx.fillStyle = "rgba(28, 21, 15, 0.48)";
      ctx.fillText(district.name, district.x + district.w * 0.08, district.y + district.h * 0.18);
      ctx.restore();
    });
  }

  function drawCityScaleBar(ctx) {
    const size = canvasSize(cityCanvas);
    const meters = 1000;
    const width = meters * cityState.view.scale;
    const x = 24;
    const y = size.height - 32;
    ctx.save();
    ctx.strokeStyle = "#201812";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.strokeStyle = "#f0d48b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.fillStyle = "#f0d48b";
    ctx.font = "700 13px Georgia";
    ctx.fillText("1 km", x, y - 10);
    ctx.restore();
  }

  function generateIllustratedCity() {
    const settings = cityState.settings;
    const rng = createRng(`${settings.seed}:${settings.visualStyle}:${settings.densityMode}:${settings.buildingMode}`);
    const areaM2 = settings.areaKm2 * 1000000;
    const aspect = 1.42;
    const widthM = Math.sqrt(areaM2 * aspect);
    const heightM = areaM2 / widthM;
    const center = { x: widthM * 0.53, y: heightM * 0.50 };
    const wall = buildIllustratedWall(widthM, heightM, center, rng);
    const river = settings.showWater ? buildIllustratedRiver(widthM, heightM, rng) : [];
    const districts = buildIllustratedDistricts(widthM, heightM, wall, rng);
    const roads = buildIllustratedRoads(widthM, heightM, wall, districts, rng);
    const fields = buildIllustratedFields(widthM, heightM, wall, rng);
    const trees = buildIllustratedTrees(widthM, heightM, wall, districts, river, rng);
    const blocks = buildIllustratedBlocks(widthM, heightM, wall, districts, rng);
    const buildings = buildIllustratedBuildings(blocks, districts, roads, rng);
    const markers = buildIllustratedMarkers(widthM, heightM, wall, center);

    cityState.data = {
      mapVersion: 3,
      name: settings.name,
      population: settings.population,
      areaKm2: settings.areaKm2,
      widthM,
      heightM,
      center,
      wall,
      river,
      waterWidth: Math.max(150, Math.min(widthM, heightM) * 0.042),
      fields,
      trees,
      districts,
      roads,
      blocks,
      buildings,
      markers,
      manual: createEmptyCityManual(),
    };
    fitCity();
    renderCityLists();
    updateCityReadouts();
  }

  function buildIllustratedWall(width, height, center, rng) {
    const rx = width * 0.34;
    const ry = height * 0.34;
    const points = [];
    const count = 38;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
      const westPull = Math.cos(angle) < -0.72 ? 0.90 : 1;
      const southPush = Math.sin(angle) > 0.55 ? 1.08 : 1;
      const jitterScale = 0.92 + rng() * 0.18;
      points.push({
        x: center.x + Math.cos(angle) * rx * jitterScale * westPull + Math.sin(angle * 2.7) * width * 0.018,
        y: center.y + Math.sin(angle) * ry * jitterScale * southPush + Math.cos(angle * 2.2) * height * 0.014,
      });
    }
    const gates = [
      { id: "north", name: "Porta Norte", angle: -Math.PI / 2, type: "Portao" },
      { id: "east", name: "Porta Leste", angle: 0, type: "Portao" },
      { id: "south", name: "Porta Sul", angle: Math.PI / 2, type: "Portao" },
      { id: "west", name: "Porta das Docas", angle: Math.PI, type: "Portao" },
    ].map((gate) => ({
      ...gate,
      x: center.x + Math.cos(gate.angle) * rx * (gate.id === "west" ? 0.88 : 0.98),
      y: center.y + Math.sin(gate.angle) * ry * (gate.id === "south" ? 1.06 : 0.98),
    }));
    return { center, rx, ry, points, gates };
  }

  function buildIllustratedDistricts(width, height, wall, rng) {
    const c = wall.center;
    return [
      makeIllustratedDistrict("castle", "Cidadela Real", c.x - width * 0.02, c.y - height * 0.31, width * 0.15, height * 0.095, -0.04, "#b9b3a4", 0.28, 3, rng),
      makeIllustratedDistrict("old", "Centro Antigo", c.x - width * 0.04, c.y - height * 0.06, width * 0.19, height * 0.15, 0.10, "#c7b18b", 0.92, 3, rng),
      makeIllustratedDistrict("market", "Mercado Grande", c.x + width * 0.08, c.y + height * 0.14, width * 0.17, height * 0.11, -0.08, "#d1bc84", 0.78, 3, rng),
      makeIllustratedDistrict("port", "Porto e Docas", c.x - width * 0.27, c.y + height * 0.10, width * 0.15, height * 0.20, 0.55, "#b49676", 0.82, 2, rng),
      makeIllustratedDistrict("craft", "Oficinas e Forjas", c.x - width * 0.16, c.y + height * 0.23, width * 0.16, height * 0.12, -0.08, "#aa8165", 0.86, 2, rng),
      makeIllustratedDistrict("noble", "Bairro Nobre", c.x + width * 0.20, c.y - height * 0.15, width * 0.16, height * 0.13, -0.16, "#c9b99b", 0.46, 2, rng),
      makeIllustratedDistrict("temple", "Distrito dos Templos", c.x + width * 0.23, c.y + height * 0.04, width * 0.14, height * 0.11, 0.08, "#d6ceb5", 0.40, 2, rng),
      makeIllustratedDistrict("garden", "Jardins Murados", c.x - width * 0.25, c.y - height * 0.18, width * 0.14, height * 0.13, -0.18, "#9fb084", 0.26, 1, rng),
      makeIllustratedDistrict("outer", "Bairros Externos", c.x + width * 0.21, c.y + height * 0.30, width * 0.17, height * 0.11, -0.14, "#b98967", 0.70, 1, rng, true),
    ];
  }

  function makeIllustratedDistrict(id, name, cx, cy, rx, ry, angle, color, density, importance, rng, outside = false) {
    return {
      id,
      name,
      cx,
      cy,
      rx,
      ry,
      angle,
      color,
      density,
      importance,
      outside,
      polygon: makeBlobPolygon(cx, cy, rx, ry, 18, rng, angle, 0.16),
    };
  }

  function buildIllustratedRoads(width, height, wall, districts, rng) {
    const roads = [];
    const c = wall.center;
    wall.gates.forEach((gate) => {
      const bend = { x: (gate.x + c.x) / 2 + jitter(rng, width * 0.035), y: (gate.y + c.y) / 2 + jitter(rng, height * 0.035) };
      roads.push({ type: "avenue", name: gate.name, points: [gate, bend, c] });
    });
    roads.push({ type: "avenue", name: "Eixo Real", points: [{ x: c.x - width * 0.06, y: c.y - height * 0.34 }, { x: c.x - width * 0.02, y: c.y - height * 0.10 }, c, { x: c.x + width * 0.06, y: c.y + height * 0.25 }] });
    roads.push({ type: "major", name: "Rua das Docas", points: [{ x: c.x - width * 0.32, y: c.y + height * 0.14 }, { x: c.x - width * 0.13, y: c.y + height * 0.10 }, c, { x: c.x + width * 0.24, y: c.y + height * 0.07 }] });
    roads.push({ type: "major", name: "Estrada dos Mercadores", points: [{ x: c.x - width * 0.20, y: c.y + height * 0.26 }, { x: c.x + width * 0.06, y: c.y + height * 0.16 }, { x: c.x + width * 0.33, y: c.y + height * 0.22 }] });
    districts.forEach((district) => {
      const localCount = district.importance + (cityState.settings.densityMode === "high" ? 3 : cityState.settings.densityMode === "medium" ? 2 : 1);
      for (let i = -localCount; i <= localCount; i += 1) {
        const t = i / Math.max(1, localCount + 1);
        const span = district.rx * (0.78 + rng() * 0.12);
        const offset = t * district.ry * 0.86;
        const a = localToWorld(district.cx, district.cy, district.angle, -span, offset + jitter(rng, 18));
        const b = localToWorld(district.cx, district.cy, district.angle, span, offset + jitter(rng, 18));
        if (pointInPolygon(a, district.polygon) && pointInPolygon(b, district.polygon)) {
          roads.push({ type: "street", name: district.name, points: [a, b] });
        }
      }
      for (let i = -Math.floor(localCount / 2); i <= Math.floor(localCount / 2); i += 1) {
        const t = i / Math.max(1, localCount);
        const span = district.ry * 0.66;
        const offset = t * district.rx * 0.72;
        const a = localToWorld(district.cx, district.cy, district.angle, offset + jitter(rng, 14), -span);
        const b = localToWorld(district.cx, district.cy, district.angle, offset + jitter(rng, 14), span);
        if (pointInPolygon(a, district.polygon) && pointInPolygon(b, district.polygon)) {
          roads.push({ type: "lane", name: district.name, points: [a, b] });
        }
      }
    });
    return roads;
  }

  function buildIllustratedRiver(width, height, rng) {
    return [
      { x: width * -0.04, y: height * 0.30 },
      { x: width * 0.09, y: height * 0.32 + jitter(rng, 30) },
      { x: width * 0.18, y: height * 0.41 + jitter(rng, 40) },
      { x: width * 0.18, y: height * 0.58 + jitter(rng, 40) },
      { x: width * 0.14, y: height * 0.78 + jitter(rng, 30) },
      { x: width * 0.19, y: height * 1.04 },
    ];
  }

  function buildIllustratedFields(width, height, wall, rng) {
    const fields = [];
    const count = cityState.settings.densityMode === "low" ? 42 : 64;
    for (let i = 0; i < count; i += 1) {
      const side = rng();
      const x = side < 0.34 ? rng() * width * 0.26 : side < 0.68 ? width * (0.74 + rng() * 0.22) : width * (0.25 + rng() * 0.55);
      const y = side < 0.68 ? rng() * height : height * (0.72 + rng() * 0.22);
      if (pointInCityWall({ x, y }, wall)) continue;
      fields.push({
        x,
        y,
        w: 130 + rng() * 360,
        h: 90 + rng() * 260,
        angle: jitter(rng, 0.22),
        color: rng() < 0.5 ? "#a99b67" : "#8f9f70",
      });
    }
    return fields;
  }

  function buildIllustratedTrees(width, height, wall, districts, river, rng) {
    const trees = [];
    const garden = districts.find((district) => district.id === "garden");
    const count = cityState.settings.densityMode === "high" ? 430 : cityState.settings.densityMode === "medium" ? 340 : 260;
    for (let i = 0; i < count; i += 1) {
      let x;
      let y;
      if (garden && rng() < 0.34) {
        const p = randomPointInDistrict(garden, rng);
        x = p.x;
        y = p.y;
      } else {
        x = rng() * width;
        y = rng() * height;
        if (pointInCityWall({ x, y }, wall) && rng() < 0.76) continue;
      }
      if (river.length && distanceToPolyline({ x, y }, river) < 130) continue;
      trees.push({ x, y, r: 13 + rng() * 16, color: rng() < 0.5 ? "#496c55" : "#5f795f" });
    }
    return trees;
  }

  function buildIllustratedBlocks(width, height, wall, districts, rng) {
    const blocks = [];
    districts.forEach((district) => {
      const baseW = district.id === "old" ? 145 : district.id === "market" ? 165 : district.id === "noble" ? 215 : 185;
      const baseH = district.id === "old" ? 105 : district.id === "port" ? 130 : 125;
      for (let u = -district.rx * 0.78; u < district.rx * 0.78; u += baseW + rng() * 42) {
        for (let v = -district.ry * 0.76; v < district.ry * 0.76; v += baseH + rng() * 36) {
          const w = baseW * (0.72 + rng() * 0.45);
          const h = baseH * (0.72 + rng() * 0.42);
          const local = { x: u + w / 2 + jitter(rng, 18), y: v + h / 2 + jitter(rng, 18) };
          const p = localToWorld(district.cx, district.cy, district.angle, local.x, local.y);
          if (!pointInPolygon(p, district.polygon)) continue;
          if (!district.outside && !pointInCityWall(p, wall)) continue;
          const plaza = (district.id === "market" && rng() < 0.20) || (district.id === "temple" && rng() < 0.16) || rng() < 0.035;
          blocks.push({
            districtId: district.id,
            x: p.x,
            y: p.y,
            w,
            h,
            angle: district.angle + jitter(rng, 0.035),
            plaza,
            color: plaza ? "#d8c9a5" : district.color,
          });
        }
      }
    });
    return blocks;
  }

  function buildIllustratedBuildings(blocks, districts, roads, rng) {
    if (cityState.settings.buildingMode === "hidden") return [];
    const buildings = [];
    const density = cityDensityFactor();
    const blockMode = cityState.settings.buildingMode === "blocks";
    blocks.forEach((block) => {
      if (block.plaza) return;
      const district = districts.find((item) => item.id === block.districtId) || districts[0];
      const lotW = blockMode ? 78 : district.id === "old" ? 34 : 44;
      const lotH = blockMode ? 54 : district.id === "old" ? 27 : 34;
      const cols = clamp(Math.floor(block.w / lotW), 1, blockMode ? 3 : 8);
      const rows = clamp(Math.floor(block.h / lotH), 1, blockMode ? 3 : 6);
      const chance = clamp(district.density * density, 0.15, 0.96);
      for (let cx = 0; cx < cols; cx += 1) {
        for (let cy = 0; cy < rows; cy += 1) {
          if (rng() > chance) continue;
          const lx = -block.w / 2 + (cx + 0.5) * (block.w / cols) + jitter(rng, block.w / cols * 0.12);
          const ly = -block.h / 2 + (cy + 0.5) * (block.h / rows) + jitter(rng, block.h / rows * 0.12);
          const p = localToWorld(block.x, block.y, block.angle, lx, ly);
          if (roads.some((road) => distanceToPolyline(p, road.points) < roadWidth(road) * 1.6)) continue;
          buildings.push({
            id: `house-${buildings.length}`,
            kind: district.id === "temple" && rng() < 0.08 ? "temple" : district.id === "noble" && rng() < 0.18 ? "noble" : "house",
            x: p.x,
            y: p.y,
            w: Math.max(16, block.w / cols * (blockMode ? 0.70 : 0.48 + rng() * 0.22)),
            h: Math.max(13, block.h / rows * (blockMode ? 0.70 : 0.48 + rng() * 0.22)),
            rotation: block.angle + jitter(rng, 0.08),
            color: illustratedBuildingColor(district, rng),
            generated: true,
          });
        }
      }
    });
    const cap = cityState.settings.densityMode === "high" ? 5200 : cityState.settings.densityMode === "medium" ? 3600 : 2200;
    return buildings.slice(0, cap);
  }

  function buildIllustratedMarkers(width, height, wall, center) {
    const gate = (id) => wall.gates.find((item) => item.id === id) || center;
    return [
      { name: "Castelo de Thais", type: "Poder", x: center.x - width * 0.02, y: center.y - height * 0.31, importance: 3 },
      { name: "Grande Orvalho", type: "Praca", x: center.x, y: center.y, importance: 3 },
      { name: "Docas Reais", type: "Porto", x: center.x - width * 0.30, y: center.y + height * 0.15, importance: 2 },
      { name: "Mercado das Especiarias", type: "Mercado", x: center.x + width * 0.09, y: center.y + height * 0.15, importance: 2 },
      { name: "Templo das Mares", type: "Templo", x: center.x + width * 0.23, y: center.y + height * 0.04, importance: 2 },
      { name: "Quartel da Porta Leste", type: "Guarda", x: gate("east").x - width * 0.03, y: gate("east").y, importance: 1 },
      { name: "Catacumbas Antigas", type: "Masmorra", x: center.x - width * 0.18, y: center.y + height * 0.02, importance: 2 },
      { name: "Porta Norte", type: "Portao", x: gate("north").x, y: gate("north").y, importance: 1 },
      { name: "Porta Sul", type: "Portao", x: gate("south").x, y: gate("south").y, importance: 1 },
    ];
  }

  function renderIllustratedCity() {
    const size = resizeCanvas(cityCanvas, cityCtx);
    cityCtx.clearRect(0, 0, size.width, size.height);
    const theme = cityTheme();
    cityCtx.fillStyle = theme.outside;
    cityCtx.fillRect(0, 0, size.width, size.height);
    if (!cityState.data) {
      drawCenteredText(cityCtx, size.width, size.height, "Gere uma cidade.");
      return;
    }
    drawIllustratedCityToContext(cityCtx, cityState.view.x, cityState.view.y, cityState.view.scale, true);
    updateCityReadouts();
  }

  function drawIllustratedCityToContext(ctx, offsetX, offsetY, scale, screen) {
    const data = cityState.data;
    const theme = cityTheme();
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    drawIllustratedTerrain(ctx, data, theme);
    if (cityState.settings.showFields) drawIllustratedFields(ctx, data, theme);
    if (cityState.settings.showWater && data.river?.length) drawIllustratedRiver(ctx, data, theme);
    drawIllustratedTrees(ctx, data, theme, false);
    drawIllustratedDistricts(ctx, data, theme);
    drawIllustratedBlocks(ctx, data, theme);
    drawCityManualTerrain(ctx, data);
    drawIllustratedRoads(ctx, data, theme);
    drawCityManualRoads(ctx, data);
    if (cityState.settings.showWalls) drawIllustratedWalls(ctx, data, theme);
    if (cityState.settings.showBuildings && cityState.settings.buildingMode !== "hidden") drawIllustratedBuildings(ctx, data, theme);
    if (cityState.settings.showBuildings) drawCityManualBuildings(ctx, data);
    drawIllustratedTrees(ctx, data, theme, true);
    if (cityState.settings.showGrid) drawCityGrid(ctx, data, scale, screen);
    drawIllustratedTitle(ctx, data, theme);
    if (cityState.settings.showDistrictLabels) drawIllustratedDistrictLabels(ctx, data, scale, screen, theme);
    if (cityState.settings.showMarkers) drawIllustratedMarkers(ctx, data, scale, screen, theme);
    ctx.restore();
    if (screen) drawIllustratedCityScaleBar(ctx, theme);
  }

  function drawIllustratedTerrain(ctx, data, theme) {
    ctx.fillStyle = theme.land;
    ctx.fillRect(0, 0, data.widthM, data.heightM);
    ctx.save();
    ctx.strokeStyle = theme.contour;
    ctx.lineWidth = 3;
    for (let i = 0; i < 34; i += 1) {
      const y = (i / 33) * data.heightM;
      ctx.beginPath();
      for (let x = -60; x <= data.widthM + 60; x += 170) {
        const py = y + Math.sin(x * 0.002 + i * 0.72) * 34;
        if (x <= -60) ctx.moveTo(x, py);
        else ctx.lineTo(x, py);
      }
      ctx.stroke();
    }
    if (theme.paperGrain) {
      ctx.fillStyle = "rgba(76, 56, 32, 0.035)";
      for (let i = 0; i < 120; i += 1) {
        ctx.fillRect((i * 431) % data.widthM, (i * 277) % data.heightM, 18 + (i % 5) * 8, 2);
      }
    }
    ctx.restore();
  }

  function drawIllustratedFields(ctx, data, theme) {
    data.fields?.forEach((field) => {
      ctx.save();
      ctx.translate(field.x, field.y);
      ctx.rotate(field.angle || 0);
      ctx.fillStyle = field.color;
      ctx.globalAlpha = 0.72;
      ctx.fillRect(-field.w / 2, -field.h / 2, field.w, field.h);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = theme.fieldLine;
      ctx.lineWidth = 2;
      ctx.strokeRect(-field.w / 2, -field.h / 2, field.w, field.h);
      for (let x = -field.w / 2 + 14; x < field.w / 2; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, -field.h / 2 + 7);
        ctx.lineTo(x + field.h * 0.30, field.h / 2 - 7);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawIllustratedRiver(ctx, data, theme) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = theme.waterEdgeDark;
    ctx.lineWidth = data.waterWidth + 46;
    drawPolyline(ctx, data.river);
    ctx.stroke();
    ctx.strokeStyle = theme.waterEdge;
    ctx.lineWidth = data.waterWidth + 24;
    drawPolyline(ctx, data.river);
    ctx.stroke();
    ctx.strokeStyle = theme.water;
    ctx.lineWidth = data.waterWidth;
    drawPolyline(ctx, data.river);
    ctx.stroke();
    ctx.strokeStyle = theme.waterLine;
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i += 1) {
      ctx.setLineDash([80, 38]);
      ctx.lineDashOffset = i * 36;
      drawPolyline(ctx, data.river.map((point) => ({ x: point.x + i * 13 - 18, y: point.y + i * 8 - 12 })));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawIllustratedDistricts(ctx, data, theme) {
    data.districts?.forEach((district) => {
      ctx.save();
      ctx.fillStyle = district.color;
      ctx.globalAlpha = 0.12;
      drawClosedPolygon(ctx, district.polygon);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = theme.districtLine;
      ctx.lineWidth = 2;
      ctx.setLineDash([18, 14]);
      drawClosedPolygon(ctx, district.polygon);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawIllustratedBlocks(ctx, data, theme) {
    data.blocks?.forEach((block) => {
      ctx.save();
      ctx.translate(block.x, block.y);
      ctx.rotate(block.angle || 0);
      ctx.fillStyle = block.plaza ? theme.plaza : theme.blockFill;
      ctx.strokeStyle = block.plaza ? theme.plazaLine : theme.blockLine;
      ctx.globalAlpha = block.plaza ? 0.92 : 0.34;
      roundedRect(ctx, -block.w / 2, -block.h / 2, block.w, block.h, Math.min(18, block.w * 0.08));
      ctx.fill();
      ctx.globalAlpha = block.plaza ? 0.92 : 0.46;
      ctx.lineWidth = block.plaza ? 3 : 1.2;
      ctx.stroke();
      if (block.plaza) {
        ctx.beginPath();
        ctx.arc(0, 0, Math.min(block.w, block.h) * 0.20, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function drawIllustratedRoads(ctx, data, theme) {
    data.roads?.forEach((road) => {
      const width = roadWidth(road);
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = theme.roadBorder;
      ctx.lineWidth = width + 7;
      drawPolyline(ctx, road.points);
      ctx.stroke();
      ctx.strokeStyle = road.type === "avenue" ? theme.avenue : road.type === "major" ? theme.road : theme.lane;
      ctx.lineWidth = width;
      drawPolyline(ctx, road.points);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawIllustratedWalls(ctx, data, theme) {
    const wall = data.wall;
    if (!wall?.points?.length) return;
    ctx.save();
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = theme.wallOuter;
    ctx.lineWidth = 30;
    drawClosedPolygon(ctx, wall.points);
    ctx.stroke();
    ctx.strokeStyle = theme.wallInner;
    ctx.lineWidth = 17;
    drawClosedPolygon(ctx, wall.points);
    ctx.stroke();
    ctx.strokeStyle = theme.wallInk;
    ctx.lineWidth = 3;
    drawClosedPolygon(ctx, wall.points);
    ctx.stroke();
    wall.points.forEach((point, index) => {
      if (index % 4 !== 0) return;
      drawWallTower(ctx, point.x, point.y, 30, theme);
    });
    wall.gates.forEach((gate) => drawWallGate(ctx, gate, theme));
    ctx.restore();
  }

  function drawIllustratedBuildings(ctx, data, theme) {
    data.buildings?.forEach((building) => drawCityBuilding(ctx, building, false, theme));
  }

  function drawIllustratedTrees(ctx, data, theme, foreground) {
    data.trees?.forEach((tree, index) => {
      const inside = pointInCityWall(tree, data.wall);
      if (foreground !== inside) return;
      if (!foreground && index % 2 === 0 && cityState.settings.visualStyle === "gray") return;
      ctx.save();
      ctx.strokeStyle = theme.treeInk;
      ctx.fillStyle = tree.color || theme.tree;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y + tree.r * 0.75);
      ctx.lineTo(tree.x, tree.y + tree.r * 1.35);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawIllustratedTitle(ctx, data, theme) {
    ctx.save();
    ctx.fillStyle = theme.ink;
    ctx.strokeStyle = theme.titleStroke;
    ctx.lineWidth = 8;
    ctx.font = `900 ${Math.max(130, data.heightM * 0.07)}px Cinzel, Georgia`;
    ctx.textBaseline = "top";
    ctx.strokeText(data.name, data.widthM * 0.045, data.heightM * 0.035);
    ctx.fillText(data.name, data.widthM * 0.045, data.heightM * 0.035);
    ctx.font = `700 ${Math.max(45, data.heightM * 0.023)}px Georgia`;
    ctx.fillText(`Pop. ${data.population.toLocaleString("pt-BR")}`, data.widthM * 0.05, data.heightM * 0.115);
    ctx.restore();
  }

  function drawIllustratedDistrictLabels(ctx, data, scale, screen, theme) {
    const mode = cityState.settings.labelMode;
    data.districts?.forEach((district) => {
      if (mode === "clean" && district.importance < 2) return;
      ctx.save();
      ctx.translate(district.cx, district.cy);
      ctx.rotate(district.angle);
      const fontSize = screen ? clamp(15 / Math.max(scale, 0.001), 38, 95) : 58;
      ctx.font = `800 ${fontSize}px Cinzel, Georgia`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = theme.labelHalo;
      ctx.lineWidth = fontSize * 0.18;
      ctx.fillStyle = theme.label;
      ctx.strokeText(district.name.toUpperCase(), 0, 0);
      ctx.fillText(district.name.toUpperCase(), 0, 0);
      ctx.restore();
    });
  }

  function drawIllustratedMarkers(ctx, data, scale, screen, theme) {
    ensureCityManual(data);
    const allMarkers = [...data.markers, ...data.manual.markers];
    const mode = cityState.settings.labelMode;
    allMarkers.forEach((marker) => {
      const important = marker.importance >= 2 || marker.manual;
      ctx.save();
      ctx.fillStyle = marker.type === "Masmorra" ? "#8f3a33" : marker.type === "Porto" ? theme.waterEdgeDark : "#9a4636";
      ctx.strokeStyle = theme.markerStroke;
      ctx.lineWidth = screen ? 1.6 / Math.max(scale, 0.001) : 5;
      ctx.beginPath();
      ctx.arc(marker.x, marker.y, screen ? 5.5 / Math.max(scale, 0.001) : 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (cityState.settings.showMarkerLabels || mode === "gm" || (!screen && important) || (mode === "full" && important)) {
        const fontSize = screen ? clamp(12 / Math.max(scale, 0.001), 32, 76) : 42;
        ctx.font = `700 ${fontSize}px Georgia`;
        ctx.textBaseline = "middle";
        ctx.strokeStyle = theme.labelHalo;
        ctx.lineWidth = fontSize * 0.22;
        ctx.fillStyle = theme.label;
        ctx.strokeText(marker.name, marker.x + fontSize * 0.70, marker.y - fontSize * 0.15);
        ctx.fillText(marker.name, marker.x + fontSize * 0.70, marker.y - fontSize * 0.15);
      }
      ctx.restore();
    });
  }

  function drawIllustratedCityScaleBar(ctx, theme) {
    const size = canvasSize(cityCanvas);
    const meters = 1000;
    const width = meters * cityState.view.scale;
    const x = 24;
    const y = size.height - 34;
    ctx.save();
    ctx.strokeStyle = theme.scaleInk;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.strokeStyle = theme.scaleLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.fillStyle = theme.scaleInk;
    ctx.font = "700 13px Georgia";
    ctx.fillText("1 km", x, y - 10);
    ctx.restore();
  }

  function cityTheme() {
    const themes = {
      parchment: {
        outside: "#d8c8a8", land: "#d6c6a6", ink: "#252019", label: "#2e2920", labelHalo: "rgba(226, 212, 177, 0.92)", titleStroke: "rgba(232, 219, 188, 0.9)",
        contour: "rgba(80, 72, 58, 0.12)", districtLine: "rgba(63, 54, 40, 0.22)", blockFill: "#c9b99b", blockLine: "rgba(49, 42, 32, 0.25)", plaza: "#dccdaa", plazaLine: "#6d5d42",
        roadBorder: "#51483c", avenue: "#efe5ca", road: "#e2d4b7", lane: "#d4c5a6", water: "#91b5b9", waterEdge: "#d9d2bb", waterEdgeDark: "#6d7d7c", waterLine: "rgba(240, 250, 246, 0.42)",
        fieldLine: "rgba(55, 46, 30, 0.28)", tree: "#6f866f", treeInk: "#344330", wallOuter: "#473f35", wallInner: "#b8aa91", wallInk: "#2a241d", markerStroke: "#efe1b8",
        scaleInk: "#2a241d", scaleLight: "#efe1b8", paperGrain: true,
      },
      gray: {
        outside: "#b9b6aa", land: "#c6c1b5", ink: "#242424", label: "#2d2d2d", labelHalo: "rgba(218, 215, 204, 0.90)", titleStroke: "rgba(225, 222, 211, 0.86)",
        contour: "rgba(45, 45, 45, 0.10)", districtLine: "rgba(34, 34, 34, 0.20)", blockFill: "#bbb7aa", blockLine: "rgba(34, 34, 34, 0.24)", plaza: "#d2ccbd", plazaLine: "#55524b",
        roadBorder: "#4d4b46", avenue: "#efebe0", road: "#dfd9ca", lane: "#cbc5b8", water: "#8aa7b0", waterEdge: "#d9d6ca", waterEdgeDark: "#657a82", waterLine: "rgba(245, 247, 240, 0.36)",
        fieldLine: "rgba(50, 50, 45, 0.25)", tree: "#72806f", treeInk: "#3d453a", wallOuter: "#2f302f", wallInner: "#a8a59c", wallInk: "#1e1e1e", markerStroke: "#f1ead5",
        scaleInk: "#252525", scaleLight: "#f1ead5", paperGrain: false,
      },
      satellite: {
        outside: "#596b52", land: "#6f8465", ink: "#221f18", label: "#262119", labelHalo: "rgba(210, 221, 196, 0.70)", titleStroke: "rgba(215, 224, 196, 0.70)",
        contour: "rgba(233, 238, 211, 0.10)", districtLine: "rgba(38, 52, 32, 0.24)", blockFill: "#87966f", blockLine: "rgba(34, 42, 28, 0.28)", plaza: "#bdb080", plazaLine: "#534a32",
        roadBorder: "#393a2f", avenue: "#d5cfaa", road: "#bdb68f", lane: "#9f9a79", water: "#547e8f", waterEdge: "#6e8e8c", waterEdgeDark: "#2e4c57", waterLine: "rgba(204, 230, 228, 0.32)",
        fieldLine: "rgba(38, 48, 30, 0.32)", tree: "#3f614a", treeInk: "#1f3527", wallOuter: "#2c2d28", wallInner: "#8c8670", wallInk: "#191815", markerStroke: "#ead99f",
        scaleInk: "#211e17", scaleLight: "#ead99f", paperGrain: false,
      },
      green: {
        outside: "#a8b89a", land: "#a3b894", ink: "#25231f", label: "#2c2821", labelHalo: "rgba(206, 217, 189, 0.86)", titleStroke: "rgba(218, 226, 199, 0.88)",
        contour: "rgba(245, 249, 231, 0.17)", districtLine: "rgba(43, 50, 35, 0.20)", blockFill: "#b8b29b", blockLine: "rgba(45, 42, 34, 0.22)", plaza: "#d0c7a7", plazaLine: "#655a3f",
        roadBorder: "#4b4a3e", avenue: "#eee8d0", road: "#ddd4ba", lane: "#cbc2aa", water: "#78b7c7", waterEdge: "#d7dfc6", waterEdgeDark: "#527986", waterLine: "rgba(239, 250, 247, 0.38)",
        fieldLine: "rgba(47, 58, 37, 0.30)", tree: "#597a69", treeInk: "#2f4c3d", wallOuter: "#282a27", wallInner: "#aaa58d", wallInk: "#1c1c1a", markerStroke: "#f1dfaa",
        scaleInk: "#222018", scaleLight: "#f1dfaa", paperGrain: false,
      },
    };
    return themes[cityState.settings.visualStyle] || themes.green;
  }

  function cityDensityFactor() {
    return { low: 0.58, medium: 0.78, high: 1.0 }[cityState.settings.densityMode] || 0.78;
  }

  function roadWidth(road) {
    return road.type === "avenue" ? 34 : road.type === "major" ? 23 : road.type === "street" ? 13 : 8;
  }

  function makeBlobPolygon(cx, cy, rx, ry, count, rng, rotation = 0, variance = 0.14) {
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1 - variance + rng() * variance * 2;
      const localX = Math.cos(angle) * rx * radius;
      const localY = Math.sin(angle) * ry * radius;
      points.push(localToWorld(cx, cy, rotation, localX, localY));
    }
    return points;
  }

  function localToWorld(cx, cy, angle, x, y) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: cx + x * cos - y * sin,
      y: cy + x * sin + y * cos,
    };
  }

  function pointInCityWall(point, wall) {
    return wall?.points?.length ? pointInPolygon(point, wall.points) : insideEllipse(point.x, point.y, wall.x, wall.y, wall.rx, wall.ry);
  }

  function pointInPolygon(point, polygon) {
    if (!polygon?.length) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
      const a = polygon[i];
      const b = polygon[j];
      const intersects = (a.y > point.y) !== (b.y > point.y) && point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 0.0001) + a.x;
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function randomPointInDistrict(district, rng) {
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const p = localToWorld(district.cx, district.cy, district.angle, jitter(rng, district.rx), jitter(rng, district.ry));
      if (pointInPolygon(p, district.polygon)) return p;
    }
    return { x: district.cx, y: district.cy };
  }

  function illustratedBuildingColor(district, rng) {
    const palettes = {
      castle: ["#d6d0bf", "#bdb6a7", "#aaa292"],
      old: ["#bba88d", "#c9b99b", "#a99578"],
      market: ["#c9b47c", "#d1bd89", "#b99c63"],
      port: ["#9f8468", "#8f7358", "#b29472"],
      craft: ["#9a745c", "#856755", "#ad8263"],
      noble: ["#cfc3a8", "#bcae91", "#d8c8a8"],
      temple: ["#ddd4bd", "#cfc7b1", "#bfb7a4"],
      garden: ["#9fa583", "#b0ad86", "#888f6e"],
      outer: ["#b58a6b", "#c09b78", "#a8795d"],
    };
    const list = palettes[district?.id] || ["#b99a76", "#c0aa86", "#a88868"];
    return list[Math.floor(rng() * list.length)];
  }

  function drawClosedPolygon(ctx, points) {
    if (!points?.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }

  function drawWallTower(ctx, x, y, size, theme) {
    ctx.save();
    ctx.fillStyle = theme.wallInner;
    ctx.strokeStyle = theme.wallInk;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, size * 0.48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawWallGate(ctx, gate, theme) {
    ctx.save();
    ctx.translate(gate.x, gate.y);
    ctx.rotate(gate.angle + Math.PI / 2);
    ctx.fillStyle = theme.road;
    ctx.strokeStyle = theme.wallInk;
    ctx.lineWidth = 4;
    ctx.fillRect(-42, -24, 84, 48);
    ctx.strokeRect(-42, -24, 84, 48);
    ctx.fillStyle = theme.wallOuter;
    ctx.fillRect(-52, -35, 28, 70);
    ctx.fillRect(24, -35, 28, 70);
    ctx.strokeRect(-52, -35, 28, 70);
    ctx.strokeRect(24, -35, 28, 70);
    ctx.restore();
  }

  function fitCity() {
    if (!cityState.data) return;
    const size = canvasSize(cityCanvas);
    cityState.view.scale = Math.min(size.width / cityState.data.widthM, size.height / cityState.data.heightM) * 0.94;
    cityState.view.x = (size.width - cityState.data.widthM * cityState.view.scale) / 2;
    cityState.view.y = (size.height - cityState.data.heightM * cityState.view.scale) / 2;
    renderCity();
  }

  function handleCityWheel(event) {
    event.preventDefault();
    if (!cityState.data) return;
    const point = getCanvasPoint(cityCanvas, event);
    const before = screenToCity(point);
    const factor = event.deltaY < 0 ? 1.14 : 0.88;
    cityState.view.scale = clamp(cityState.view.scale * factor, 0.03, 6);
    cityState.view.x = point.x - before.x * cityState.view.scale;
    cityState.view.y = point.y - before.y * cityState.view.scale;
    renderCity();
  }

  function handleCityPointerDown(event) {
    cityCanvas.setPointerCapture(event.pointerId);
    const world = screenToCity(getCanvasPoint(cityCanvas, event));
    if (!cityState.data) return;
    if (cityState.settings.tool === "terrain") {
      startCityStroke("terrain", world);
      return;
    }
    if (cityState.settings.tool === "road") {
      startCityStroke("road", world);
      return;
    }
    if (cityState.settings.tool === "building") {
      stampCityBuilding(world);
      cityState.drawing = true;
      cityState.lastStamp = world;
      return;
    }
    if (cityState.settings.tool === "marker") {
      addCityMarker(world);
      return;
    }
    if (cityState.settings.tool === "erase") {
      eraseCityAt(world);
      cityState.drawing = true;
      cityState.lastStamp = world;
      return;
    }
    cityState.dragging = true;
    cityState.dragStart = { point: getCanvasPoint(cityCanvas, event), view: { ...cityState.view } };
  }

  function handleCityPointerMove(event) {
    const world = screenToCity(getCanvasPoint(cityCanvas, event));
    if (cityState.drawing && (cityState.settings.tool === "terrain" || cityState.settings.tool === "road")) {
      continueCityStroke(world);
      return;
    }
    if (cityState.drawing && cityState.settings.tool === "building") {
      const distance = distanceMeters(world, cityState.lastStamp);
      if (distance > cityBuildingSpec(cityState.settings.buildingKind).spacing) {
        stampCityBuilding(world);
        cityState.lastStamp = world;
      }
      return;
    }
    if (cityState.drawing && cityState.settings.tool === "erase") {
      const distance = distanceMeters(world, cityState.lastStamp);
      if (distance > cityState.settings.brushMeters * 0.35) {
        eraseCityAt(world);
        cityState.lastStamp = world;
      }
      return;
    }
    if (!cityState.dragging || !cityState.dragStart) return;
    const point = getCanvasPoint(cityCanvas, event);
    cityState.view.x = cityState.dragStart.view.x + point.x - cityState.dragStart.point.x;
    cityState.view.y = cityState.dragStart.view.y + point.y - cityState.dragStart.point.y;
    renderCity();
  }

  function handleCityPointerUp(event) {
    if (cityCanvas.hasPointerCapture(event.pointerId)) cityCanvas.releasePointerCapture(event.pointerId);
    finishCityDrawing();
    cityState.dragging = false;
    cityState.dragStart = null;
  }

  function startCityStroke(type, point) {
    cityState.drawing = true;
    cityState.currentStroke = {
      id: `city-${type}-${Date.now()}`,
      type,
      kind: type === "terrain" ? cityState.settings.terrainKind : "road",
      sizeM: cityState.settings.brushMeters,
      widthM: cityState.settings.roadWidth,
      points: [clampCityPoint(point)],
    };
    renderCity();
  }

  function continueCityStroke(point) {
    if (!cityState.currentStroke) return;
    const next = clampCityPoint(point);
    const last = cityState.currentStroke.points[cityState.currentStroke.points.length - 1];
    const minDistance = Math.max(4, (cityState.currentStroke.type === "road" ? cityState.currentStroke.widthM : cityState.currentStroke.sizeM) * 0.18);
    if (distanceMeters(next, last) < minDistance) return;
    cityState.currentStroke.points.push(next);
    renderCity();
  }

  function finishCityDrawing() {
    if (cityState.currentStroke && cityState.data) {
      ensureCityManual(cityState.data);
      const stroke = cityState.currentStroke;
      const collection = stroke.type === "road" ? cityState.data.manual.roads : cityState.data.manual.terrain;
      collection.push(stroke);
      pushCityAction({ action: "add", type: stroke.type === "road" ? "roads" : "terrain", item: stroke });
      cityState.currentStroke = null;
      renderCityLists();
      persistSoon();
    }
    cityState.drawing = false;
    cityState.lastStamp = null;
  }

  function screenToCity(point) {
    return {
      x: (point.x - cityState.view.x) / cityState.view.scale,
      y: (point.y - cityState.view.y) / cityState.view.scale,
    };
  }

  function stampCityBuilding(point) {
    if (!cityState.data) return;
    ensureCityManual(cityState.data);
    const spec = cityBuildingSpec(cityState.settings.buildingKind);
    const building = {
      id: `city-building-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: cityState.settings.buildingKind,
      x: clamp(point.x, 0, cityState.data.widthM),
      y: clamp(point.y, 0, cityState.data.heightM),
      w: spec.w,
      h: spec.h,
      color: spec.color,
      rotation: spec.rotation,
    };
    cityState.data.manual.buildings.push(building);
    pushCityAction({ action: "add", type: "buildings", item: building });
    renderCity();
    renderCityLists();
    persistSoon();
  }

  function addCityMarker(point) {
    if (!cityState.data) return;
    ensureCityManual(cityState.data);
    const marker = {
      id: `city-marker-${Date.now()}`,
      name: cityState.settings.markerName,
      type: cityState.settings.markerType,
      x: clamp(point.x, 0, cityState.data.widthM),
      y: clamp(point.y, 0, cityState.data.heightM),
      manual: true,
    };
    cityState.data.manual.markers.push(marker);
    pushCityAction({ action: "add", type: "markers", item: marker });
    renderCity();
    renderCityLists();
    persistSoon();
  }

  function eraseCityAt(point) {
    if (!cityState.data) return;
    ensureCityManual(cityState.data);
    const radius = cityState.settings.brushMeters;
    const removed = [];
    for (const type of ["buildings", "markers", "roads", "terrain"]) {
      const collection = cityState.data.manual[type];
      for (let i = collection.length - 1; i >= 0; i -= 1) {
        if (cityItemNear(collection[i], type, point, radius)) {
          const [item] = collection.splice(i, 1);
          removed.push({ type, item });
        }
      }
    }
    if (removed.length) {
      pushCityAction({ action: "remove", items: removed });
      renderCity();
      renderCityLists();
      persistSoon();
    }
  }

  function pushCityAction(action) {
    cityState.undo.push(action);
    cityState.redo = [];
    if (cityState.undo.length > 80) cityState.undo.shift();
  }

  function undoCityEdit() {
    const action = cityState.undo.pop();
    if (!action || !cityState.data) return;
    applyCityAction(action, true);
    cityState.redo.push(action);
    renderCity();
    renderCityLists();
    persistSoon();
  }

  function redoCityEdit() {
    const action = cityState.redo.pop();
    if (!action || !cityState.data) return;
    applyCityAction(action, false);
    cityState.undo.push(action);
    renderCity();
    renderCityLists();
    persistSoon();
  }

  function applyCityAction(action, reverse) {
    ensureCityManual(cityState.data);
    if (action.action === "add") {
      if (reverse) removeCityManualItem(action.type, action.item.id);
      else cityState.data.manual[action.type].push(action.item);
    }
    if (action.action === "remove") {
      action.items.forEach(({ type, item }) => {
        if (reverse) cityState.data.manual[type].push(item);
        else removeCityManualItem(type, item.id);
      });
    }
  }

  function removeCityManualItem(type, id) {
    const collection = cityState.data.manual[type];
    const index = collection.findIndex((item) => item.id === id);
    if (index >= 0) collection.splice(index, 1);
  }

  function cityItemNear(item, type, point, radius) {
    if (type === "buildings") {
      return Math.abs(item.x - point.x) <= item.w / 2 + radius && Math.abs(item.y - point.y) <= item.h / 2 + radius;
    }
    if (type === "markers") return distanceMeters(item, point) <= radius;
    return distanceToPolyline(point, item.points || []) <= radius + (item.sizeM || item.widthM || 0) / 2;
  }

  function clampCityPoint(point) {
    if (!cityState.data) return point;
    return {
      x: Math.round(clamp(point.x, 0, cityState.data.widthM) * 10) / 10,
      y: Math.round(clamp(point.y, 0, cityState.data.heightM) * 10) / 10,
    };
  }

  function downloadCityPng() {
    if (!cityState.data) return;
    const width = cityState.settings.exportWidth;
    const height = Math.round(width * cityState.data.heightM / cityState.data.widthM);
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext("2d");
    drawCityToContext(ctx, 0, 0, width / cityState.data.widthM, false);
    downloadCanvas(offscreen, `${slugify(cityState.settings.name)}-mapa-urbano.png`);
  }

  function renderCityLists() {
    const data = cityState.data;
    if (!data) return;
    ensureCityManual(data);
    $("#cityDistrictList").innerHTML = data.districts.map((district) => `
      <div class="label-item">
        <div>
          <div class="label-name">${escapeHtml(district.name)}</div>
          <div class="label-position">${Math.round(district.w)} x ${Math.round(district.h)} m</div>
        </div>
      </div>
    `).join("");
    const allMarkers = [...data.markers, ...data.manual.markers];
    $("#cityMarkerList").innerHTML = allMarkers.map((marker) => `
      <div class="label-item">
        <div>
          <div class="label-name">${escapeHtml(marker.name)}</div>
          <div class="label-position">${escapeHtml(marker.type)} - ${Math.round(marker.x)}, ${Math.round(marker.y)} m${marker.manual ? " - manual" : ""}</div>
        </div>
      </div>
    `).join("");
  }

  function updateCityReadouts() {
    const data = cityState.data;
    if (!data) return;
    ensureCityManual(data);
    $("#cityAreaReadout").textContent = `${data.areaKm2.toFixed(data.areaKm2 < 10 ? 1 : 0)} km²`;
    $("#cityDimensionReadout").textContent = `${(data.widthM / 1000).toFixed(1)} x ${(data.heightM / 1000).toFixed(1)} km`;
    $("#cityPopulationReadout").textContent = data.population.toLocaleString("pt-BR");
    $("#cityDensityReadout").textContent = `${Math.round(data.population / data.areaKm2).toLocaleString("pt-BR")} hab/km²`;
    $("#cityManualTerrainReadout").textContent = data.manual.terrain.length.toLocaleString("pt-BR");
    $("#cityManualBuildingsReadout").textContent = data.manual.buildings.length.toLocaleString("pt-BR");
    $("#cityManualRoadsReadout").textContent = data.manual.roads.length.toLocaleString("pt-BR");
    $("#cityManualMarkersReadout").textContent = data.manual.markers.length.toLocaleString("pt-BR");
  }

  function makeCuts(start, end, step, rng) {
    const cuts = [start];
    for (let value = start + step; value < end; value += step + jitter(rng, step * 0.22)) {
      cuts.push(value);
    }
    cuts.push(end);
    return cuts.sort((a, b) => a - b);
  }

  function createEmptyCityManual() {
    return { terrain: [], roads: [], buildings: [], markers: [] };
  }

  function ensureCityManual(data) {
    if (!data.manual) data.manual = createEmptyCityManual();
    for (const key of ["terrain", "roads", "buildings", "markers"]) {
      if (!Array.isArray(data.manual[key])) data.manual[key] = [];
    }
    return data.manual;
  }

  function terrainStyle(kind) {
    return {
      grass: { color: "#4f7d42", alpha: 0.86 },
      forest: { color: "#244c2c", alpha: 0.88 },
      field: { color: "#9d8b4f", alpha: 0.86 },
      water: { color: "#416d8b", alpha: 0.88 },
      sand: { color: "#c9b071", alpha: 0.82 },
      stone: { color: "#77766c", alpha: 0.84 },
      plaza: { color: "#c3b08d", alpha: 0.82 },
    }[kind] || { color: "#4f7d42", alpha: 0.86 };
  }

  function cityBuildingSpec(kind) {
    const specs = {
      house: { w: 26, h: 18, spacing: 34, color: "#b97950", rotation: 0 },
      noble: { w: 58, h: 42, spacing: 72, color: "#c4a46b", rotation: 0 },
      warehouse: { w: 78, h: 42, spacing: 88, color: "#8f6546", rotation: 0 },
      temple: { w: 64, h: 64, spacing: 86, color: "#d0c6a4", rotation: 0 },
      tower: { w: 42, h: 42, spacing: 60, color: "#aaa398", rotation: 0 },
      ruin: { w: 60, h: 40, spacing: 72, color: "#74695e", rotation: 0 },
    };
    return specs[kind] || specs.house;
  }

  function distanceMeters(a, b) {
    if (!a || !b) return Infinity;
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function distanceToPolyline(point, points) {
    if (!points.length) return Infinity;
    if (points.length === 1) return distanceMeters(point, points[0]);
    let best = Infinity;
    for (let i = 1; i < points.length; i += 1) {
      best = Math.min(best, distanceToSegment(point, points[i - 1], points[i]));
    }
    return best;
  }

  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) return distanceMeters(point, a);
    const t = clamp(((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy), 0, 1);
    return distanceMeters(point, { x: a.x + t * dx, y: a.y + t * dy });
  }

  function districtAt(districts, x, y) {
    return districts.find((district) => x >= district.x && y >= district.y && x <= district.x + district.w && y <= district.y + district.h) || null;
  }

  function buildingColor(district, rng) {
    const palettes = {
      castle: ["#c7c0ae", "#aaa292", "#928a7d"],
      noble: ["#b59a6f", "#c2ac82", "#a98062"],
      port: ["#7b6049", "#8a6a4f", "#675442"],
      craft: ["#7c5a43", "#8d6045", "#625448"],
      garden: ["#8d8a62", "#9d9469", "#737757"],
      center: ["#a87958", "#ad835f", "#936d53"],
      default: ["#9a7458", "#a98260", "#806b57", "#ab8d68"],
    };
    const list = palettes[district?.id] || palettes.default;
    return list[Math.floor(rng() * list.length)];
  }

  function insideEllipse(x, y, cx, cy, rx, ry) {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return dx * dx + dy * dy <= 1;
  }

  function isNearRiver(x, y, width, height) {
    return x < width * 0.26 && y > height * 0.32;
  }

  function drawPolyline(ctx, points) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i].x, points[i].y);
    }
  }

  function jitter(rng, amount) {
    return (rng() - 0.5) * amount * 2;
  }

  function createRng(seedText) {
    let seed = 2166136261;
    for (const char of String(seedText)) {
      seed ^= char.charCodeAt(0);
      seed = Math.imul(seed, 16777619);
    }
    return () => {
      seed += 0x6D2B79F5;
      let t = seed;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function slugify(text) {
    return String(text)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cidade";
  }

  function handleKeyboard(event) {
    const key = event.key.toLowerCase();
    if (activeMode === "map" && event.ctrlKey && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redoMapEdit();
      else undoMapEdit();
      return;
    }
    if (activeMode === "map" && event.ctrlKey && key === "y") {
      event.preventDefault();
      redoMapEdit();
      return;
    }
    if (activeMode === "dungeon" && event.ctrlKey && event.key.toLowerCase() === "z") {
      event.preventDefault();
      undoDungeon();
      return;
    }
    if (activeMode === "city" && event.ctrlKey && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redoCityEdit();
      else undoCityEdit();
      return;
    }
    if (activeMode === "city" && event.ctrlKey && key === "y") {
      event.preventDefault();
      redoCityEdit();
    }
  }

  function createDungeon(width, height) {
    return {
      width,
      height,
      cells: Array(width * height).fill("empty"),
      labels: [],
    };
  }

  function normalizeDungeon(data) {
    if (!data || !Number.isFinite(data.width) || !Number.isFinite(data.height)) return null;
    const width = clamp(Math.floor(data.width), 5, DUNGEON_MAX_SIZE);
    const height = clamp(Math.floor(data.height), 5, DUNGEON_MAX_SIZE);
    const cells = Array(width * height).fill("empty");
    if (Array.isArray(data.cells)) {
      for (let i = 0; i < cells.length; i += 1) {
        const tile = data.cells[i];
        cells[i] = tileById[tile] ? tile : "empty";
      }
    }
    const labels = Array.isArray(data.labels)
      ? data.labels
          .filter((label) => Number.isFinite(label.x) && Number.isFinite(label.y) && label.text)
          .map((label) => ({
            id: String(label.id || `label-${Math.random().toString(36).slice(2)}`),
            x: clamp(Math.floor(label.x), 0, width - 1),
            y: clamp(Math.floor(label.y), 0, height - 1),
            text: String(label.text).slice(0, 26),
            secret: Boolean(label.secret),
          }))
      : [];
    return { width, height, cells, labels };
  }

  function indexFor(x, y) {
    return y * dungeonState.data.width + x;
  }

  function inDungeon(x, y) {
    return x >= 0 && y >= 0 && x < dungeonState.data.width && y < dungeonState.data.height;
  }

  function screenToDungeonCell(point) {
    return {
      x: Math.floor((point.x - dungeonState.view.x) / dungeonState.view.scale),
      y: Math.floor((point.y - dungeonState.view.y) / dungeonState.view.scale),
    };
  }

  function screenToDungeonCellFloat(point) {
    return {
      x: (point.x - dungeonState.view.x) / dungeonState.view.scale,
      y: (point.y - dungeonState.view.y) / dungeonState.view.scale,
    };
  }

  function cellRect(a, b) {
    const x1 = Math.min(a.x, b.x);
    const y1 = Math.min(a.y, b.y);
    const x2 = Math.max(a.x, b.x);
    const y2 = Math.max(a.y, b.y);
    return { x: x1, y: y1, w: x2 - x1 + 1, h: y2 - y1 + 1 };
  }

  function cellsOnLine(a, b) {
    const cells = [];
    let x0 = a.x;
    let y0 = a.y;
    const x1 = b.x;
    const y1 = b.y;
    const dx = Math.abs(x1 - x0);
    const sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0);
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    while (true) {
      cells.push({ x: x0, y: y0 });
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }
      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
    return cells;
  }

  function placePoint(place) {
    if (!place) return { x: 0, y: 0 };
    if (Number.isFinite(place.x) && Number.isFinite(place.y)) return { x: place.x, y: place.y };
    if (Number.isFinite(place.coordX) && Number.isFinite(place.coordY)) {
      return { x: place.coordX - tibiaMap.originX, y: place.coordY - tibiaMap.originY };
    }
    return { x: place.rx * mapImage.width, y: place.ry * mapImage.height };
  }

  function placeCoords(place) {
    if (Number.isFinite(place.coordX) && Number.isFinite(place.coordY)) {
      return { x: place.coordX, y: place.coordY };
    }
    const point = placePoint(place);
    return {
      x: Math.round(tibiaMap.originX + point.x),
      y: Math.round(tibiaMap.originY + point.y),
    };
  }

  function mapImageToScreen(point) {
    return {
      x: mapState.view.x + point.x * mapState.view.scale,
      y: mapState.view.y + point.y * mapState.view.scale,
    };
  }

  function screenToMapImage(point) {
    return {
      x: (point.x - mapState.view.x) / mapState.view.scale,
      y: (point.y - mapState.view.y) / mapState.view.scale,
    };
  }

  function isInsideMap(point) {
    return point.x >= 0 && point.y >= 0 && point.x <= mapImage.width && point.y <= mapImage.height;
  }

  function distanceKm(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const tiles = Math.sqrt(dx * dx + dy * dy);
    return tiles * mapState.settings.metersPerTile / 1000;
  }

  function hitTestMarker(screenPoint) {
    let best = null;
    let bestDistance = 14;
    getDrawablePlaces().forEach((place) => {
      const point = mapImageToScreen(placePoint(place));
      const dx = point.x - screenPoint.x;
      const dy = point.y - screenPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < bestDistance) {
        best = place;
        bestDistance = distance;
      }
    });
    return best;
  }

  function findPlace(id) {
    if (!id) return null;
    return getAllPlaces(true).find((place) => place.id === id) || null;
  }

  function getAllPlaces(includeTibiaMarkers = false) {
    const floor = mapState.floor;
    const base = builtInPlaces.filter((place) => place.floor === floor);
    const custom = mapState.customMarkers
      .filter((marker) => (marker.floor ?? 7) === floor)
      .map((marker) => ({ ...marker, custom: true }));
    const tibia = includeTibiaMarkers && mapState.settings.showTibiaMarkers
      ? mapState.tibiaMarkers.filter((marker) => marker.floor === floor)
      : [];
    return [...base, ...custom, ...tibia];
  }

  function getListPlaces(query) {
    const includeTibia = mapState.settings.showTibiaMarkers && query.length >= 2;
    return getAllPlaces(includeTibia);
  }

  function getDrawablePlaces() {
    const base = getAllPlaces(false);
    if (!mapState.settings.showTibiaMarkers || mapState.view.scale < 0.45) return base;
    const viewport = visibleImageRect();
    const visibleTibia = mapState.tibiaMarkers
      .filter((marker) => marker.floor === mapState.floor)
      .filter((marker) => {
        const point = placePoint(marker);
        return point.x >= viewport.x - 40 && point.y >= viewport.y - 40 && point.x <= viewport.x + viewport.w + 40 && point.y <= viewport.y + viewport.h + 40;
      })
      .slice(0, 450);
    return [...base, ...visibleTibia];
  }

  function getExportPlaces() {
    return getAllPlaces(false);
  }

  function normalizeMapStrokes(strokes) {
    if (!Array.isArray(strokes)) return [];
    return strokes
      .filter((stroke) => Array.isArray(stroke.points) && stroke.points.length > 0)
      .map((stroke, index) => ({
        id: String(stroke.id || `stroke-${index}`),
        floor: clamp(Math.floor(stroke.floor ?? 7), 0, 15),
        mode: stroke.mode === "erase" ? "erase" : "paint",
        color: /^#[0-9a-f]{6}$/i.test(stroke.color || "") ? stroke.color : "#3f6d3f",
        sizeTiles: clamp(Number(stroke.sizeTiles) || 8, 1, 96),
        opacity: clamp(Number(stroke.opacity) || 0.8, 0.05, 1),
        points: stroke.points
          .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
          .map((point) => ({
            x: Math.round(point.x * 10) / 10,
            y: Math.round(point.y * 10) / 10,
          })),
      }))
      .filter((stroke) => stroke.points.length > 0)
      .slice(-800);
  }

  function visibleImageRect() {
    const size = canvasSize(mapCanvas);
    const topLeft = screenToMapImage({ x: 0, y: 0 });
    const bottomRight = screenToMapImage({ x: size.width, y: size.height });
    return {
      x: Math.max(0, topLeft.x),
      y: Math.max(0, topLeft.y),
      w: Math.min(mapImage.width, bottomRight.x) - Math.max(0, topLeft.x),
      h: Math.min(mapImage.height, bottomRight.y) - Math.max(0, topLeft.y),
    };
  }

  async function loadTibiaMarkers() {
    mapState.loadingMarkers = true;
    try {
      const response = await fetch(assets.markers);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const markers = await response.json();
      mapState.tibiaMarkers = markers
        .filter((marker) => Number.isFinite(marker.x) && Number.isFinite(marker.y) && Number.isFinite(marker.z))
        .map((marker, index) => ({
          id: `tibiamaps-${index}`,
          source: "tibiamaps",
          name: marker.description?.trim() || marker.icon || "Marcador",
          type: marker.icon || "TibiaMaps",
          note: marker.description?.trim() || "Marcador importado do TibiaMaps.",
          coordX: marker.x,
          coordY: marker.y,
          floor: marker.z,
        }));
    } catch (error) {
      mapState.tibiaMarkers = [];
      console.warn("Nao foi possivel carregar marcadores TibiaMaps.", error);
    } finally {
      mapState.loadingMarkers = false;
      renderMarkerList();
      renderMap();
    }
  }

  function mapUrlForFloor(floor) {
    return `${assets.mapBase}/floor-${String(floor).padStart(2, "0")}-map.png`;
  }

  function cityScaleInfo() {
    const population = Number(mapState.settings.cityPopulation);
    const density = Number(mapState.settings.cityDensity);
    const override = Number(mapState.settings.cityAreaOverride);
    const metersPerTile = Math.max(0.1, Number(mapState.settings.metersPerTile) || 1.5);
    if (!Number.isFinite(population) || !Number.isFinite(density) || population <= 0 || density <= 0) return null;
    const densityAreaKm2 = population / density;
    const displayAreaKm2 = Number.isFinite(override) && override > 0 ? override : densityAreaKm2;
    const sideKm = Math.sqrt(displayAreaKm2);
    const sideTiles = sideKm * 1000 / metersPerTile;
    const mapWidthKm = mapState.ready ? mapImage.width * metersPerTile / 1000 : 0;
    const mapHeightKm = mapState.ready ? mapImage.height * metersPerTile / 1000 : 0;
    return {
      population,
      density,
      densityAreaKm2,
      displayAreaKm2,
      sideKm,
      sideTiles,
      mapWidthKm,
      mapHeightKm,
      fitsMap: sideTiles <= mapImage.width && sideTiles <= mapImage.height,
    };
  }

  function formatDistance(km) {
    if (!Number.isFinite(km)) return "--";
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(2)} km`;
    return `${Math.round(km)} km`;
  }

  function loadPersistedState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  let persistTimer = null;
  function persistSoon() {
    clearTimeout(persistTimer);
    persistTimer = setTimeout(persistNow, 120);
  }

  function persistNow() {
    const payload = {
      map: {
        floor: mapState.floor,
        crop: mapState.crop,
        customMarkers: mapState.customMarkers,
        editStrokes: mapState.editStrokes.slice(-800),
        settings: mapState.settings,
      },
      dungeon: {
        data: dungeonState.data,
        showGrid: dungeonState.showGrid,
        showLabels: dungeonState.showLabels,
        showSecrets: dungeonState.showSecrets,
        exportCellSize: dungeonState.exportCellSize,
      },
      city: {
        settings: cityState.settings,
        data: cityState.data,
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const now = new Date();
    $("#saveStatus").textContent = `Salvo ${now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  function drawCenteredText(ctx, width, height, text) {
    ctx.save();
    ctx.fillStyle = "#d2ad55";
    ctx.font = "700 18px Georgia";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, width / 2, height / 2);
    ctx.restore();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function downloadCanvas(canvas, filename) {
    canvas.toBlob((blob) => {
      if (!blob) return;
      downloadBlob(blob, filename);
    }, "image/png");
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function modeLabel(mode) {
    return {
      paint: "Pincel",
      room: "Sala",
      corridor: "Corredor",
      label: "Texto",
      pan: "Mover",
    }[mode] || mode;
  }
})();
