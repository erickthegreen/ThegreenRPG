(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const STORAGE_KEY = "danubia-mesa-tools-v1";
  const APP_MODES = ["map", "city", "dungeon", "mesa"];
  const DUNGEON_MAX_SIZE = 500;
  const DUNGEON_EXPORT_MIN_CELL = 8;
  const DUNGEON_EXPORT_MAX_CELL = 180;
  const DUNGEON_EXPORT_MAX_SIDE = 8192;
  const FANTASY_CITY_TARGET_DENSITY = 20000;
  const FANTASY_CITY_MIN_KM2 = 10;
  const APP_PARAMS = new URLSearchParams(location.search);
  const IS_PLAYER_VIEW = APP_PARAMS.get("role") === "player" || APP_PARAMS.get("view") === "player";

  const DANUBIA_WORLD_WIDTH = 4096;
  const DANUBIA_WORLD_HEIGHT = 2560;
  const DANUBIA_WORLD_SEED = 20260518;
  const DANUBIA_WORLD_MAP_VERSION = 10;
  const DANUBIA_CITY_MAP_VERSION = 9;

  const builtInPlaces = [
    { id: "thais", name: "Thais", type: "Capital portuaria", rx: 0.492, ry: 0.705, rank: 1, population: 273110, areaKm2: 420, note: "Capital humana e porto real; muralha dupla, guildas, catacumbas, baia protegida e controle de artefatos." },
    { id: "drakenthal", name: "Drakenthal", type: "Cidade fortaleza", rx: 0.600, ry: 0.340, rank: 2, population: 90000, areaKm2: 380, note: "Anfiteatro vulcanico, basalto negro, tuneis, forjas e fumaca permanente no horizonte." },
    { id: "ossebra", name: "Ossebra", type: "Cidade elfica fluvial", rx: 0.485, ry: 0.405, rank: 3, population: 80000, areaKm2: 510, note: "Plataformas em arvores milenares; Rio Ebra corta a cidade e os arquivos guardam mapas antigos." },
    { id: "velmoor", name: "Velmoor", type: "Mercado de estepe", rx: 0.540, ry: 0.565, rank: 4, population: 75000, areaKm2: 350, note: "Cidade horizontal, ruas largas para caravanas e maior mercado aberto de Danubia." },
    { id: "halveth", name: "Halveth", type: "Cidade da tundra", rx: 0.300, ry: 0.170, rank: 5, population: 68000, areaKm2: 290, note: "Circulos concentricos de pedra no norte frio, torres de granito e expedicoes glaciais." },
    { id: "solavar", name: "Solavar", type: "Cidade do deserto", rx: 0.300, ry: 0.700, rank: 6, population: 64000, areaKm2: 300, note: "Muralha circular de arenito, aqueduto subterraneo e controle politico da agua." },
    { id: "porto-cinzento", name: "Porto Cinzento", type: "Porto nebuloso", rx: 0.240, ry: 0.465, rank: 7, population: 60000, areaKm2: 260, note: "Costa ocidental com nevoa permanente, ruelas medievais e cartografos de moral duvidosa." },
    { id: "ironvale", name: "Ironvale", type: "Vale industrial", rx: 0.365, ry: 0.420, rank: 8, population: 58000, areaKm2: 270, note: "Vale fechado entre serras, fundicoes ativas, rio industrial e muralha reforcada com metal." },
    { id: "mireth", name: "Mireth", type: "Cidade lacustre", rx: 0.440, ry: 0.655, rank: 9, population: 55000, areaKm2: 340, note: "Palafitas sobre lago pantanoso, ilhas artificiais, pontes de madeira e alquimia forte." },
    { id: "caern-do-sul", name: "Caern do Sul", type: "Porto tropical", rx: 0.385, ry: 0.860, rank: 10, population: 53000, areaKm2: 310, note: "Porto quente de muralha branca, frota militar e acesso a ruinas tropicais." },
    { id: "tundram", name: "Tundram", type: "Cidade subterranea", rx: 0.455, ry: 0.245, rank: 11, population: 50000, areaKm2: 260, note: "Segunda cidade ana, 70% subterranea, galerias minerais e portas de granito." },
    { id: "faelcross", name: "Faelcross", type: "Cruzamento florestal", rx: 0.382, ry: 0.555, rank: 12, population: 48000, areaKm2: 290, note: "Cidade semi-aberta rente as arvores, quatro rotas florestais e rangers de elite." },
    { id: "selvorn", name: "Selvorn", type: "Clareira de selva", rx: 0.470, ry: 0.835, rank: 13, population: 46000, areaKm2: 420, note: "Clareira tropical mantida a forca, muralha de troncos reforcada e selva agressiva." },
    { id: "narath", name: "Narath", type: "Costa rochosa", rx: 0.765, ry: 0.520, rank: 14, population: 44000, areaKm2: 230, note: "Cidade em degraus nos penhascos, porto pequeno e mergulho de recuperacao." },
    { id: "duskholm", name: "Duskholm", type: "Fronteira brumosa", rx: 0.675, ry: 0.590, rank: 15, population: 42000, areaKm2: 280, note: "Planicie de fronteira, muralha dupla, zona neutra e portal de ruina documentado." },
    { id: "variel", name: "Variel", type: "Floresta sagrada", rx: 0.585, ry: 0.475, rank: 16, population: 38000, areaKm2: 350, note: "Cidade elfica oculta por ilusoes permanentes, arquitetura organica e rituais antigos." },
    { id: "cravenspire", name: "Cravenspire", type: "Pico sombrio", rx: 0.720, ry: 0.350, rank: 17, population: 36000, areaKm2: 240, note: "Base de pico inacessivel, sombra permanente, ruas estreitas e magia proibida." },
    { id: "eldenmoor", name: "Eldenmoor", type: "Pantano academico", rx: 0.610, ry: 0.690, rank: 18, population: 34000, areaKm2: 310, note: "Ilhas de pedra cinza, ossadas antigas, bruma e estudos arcanos de civilizacoes extintas." },
    { id: "bhalrock", name: "Bhalrock", type: "Forja vulcanica", rx: 0.655, ry: 0.285, rank: 19, population: 32000, areaKm2: 190, note: "Sope de vulcao ativo, galerias quentes, metal lendario e evacuacoes frequentes." },
    { id: "serathis", name: "Serathis", type: "Porto artico", rx: 0.825, ry: 0.185, rank: 20, population: 29000, areaKm2: 200, note: "Porto de gelo semipermanente e arquivos sobre civilizacoes glaciais." },

    { id: "pedra-funda", name: "Pedra Funda", type: "Vilarejo mineiro", rx: 0.392, ry: 0.365, village: true, population: 3500, note: "Entrada de mina profunda e parada antes das ruinas das montanhas." },
    { id: "riacho-das-cinzas", name: "Riacho das Cinzas", type: "Vilarejo ribeirinho", rx: 0.630, ry: 0.318, village: true, population: 3200, note: "Rio acinzentado por minerais, pesca e coleta de minerios leves." },
    { id: "aldeia-do-sal", name: "Aldeia do Sal", type: "Vilarejo costeiro", rx: 0.420, ry: 0.585, village: true, population: 3000, note: "Salinas artesanais e abastecimento costeiro." },
    { id: "colina-dos-corvos", name: "Colina dos Corvos", type: "Vilarejo de mensageiros", rx: 0.345, ry: 0.505, village: true, population: 2800, note: "Corvos domesticados usados como mensageiros entre guildas." },
    { id: "margem-seca", name: "Margem Seca", type: "Vilarejo arido", rx: 0.270, ry: 0.655, village: true, population: 2600, note: "Leito de rio seco e comercio de agua tratada." },
    { id: "encosta-verde", name: "Encosta Verde", type: "Vilarejo herbalista", rx: 0.520, ry: 0.465, village: true, population: 2500, note: "Herboristas, curandeiros e pocoes basicas para aventureiros." },
    { id: "vau-da-nevoa", name: "Vau da Nevoa", type: "Vilarejo pantanoso", rx: 0.590, ry: 0.655, village: true, population: 2400, note: "Halflings escondidos por nevoa permanente e rotas discretas." },
    { id: "lastro", name: "Lastro", type: "Vilarejo de caravanas", rx: 0.505, ry: 0.600, village: true, population: 2300, note: "Armazens e estabulos para jornadas longas." },
    { id: "palha-e-po", name: "Palha e Po", type: "Vilarejo agricola", rx: 0.338, ry: 0.742, village: true, population: 2100, note: "Agricultura resistente em solo pobre." },
    { id: "torrao-velho", name: "Torrao Velho", type: "Vilarejo defensivo", rx: 0.425, ry: 0.372, village: true, population: 2000, note: "Pedregulhos antigos e defesa pequena mas seria." },
    { id: "capim-branco", name: "Capim Branco", type: "Vilarejo de pastagem", rx: 0.575, ry: 0.610, village: true, population: 1900, note: "Cavalos resistentes vendidos a aventureiros." },
    { id: "muro-torto", name: "Muro Torto", type: "Vilarejo de fronteira", rx: 0.710, ry: 0.620, village: true, population: 1800, note: "Muro irregular e disputas entre reinos limitrofes." },
    { id: "fosso-raso", name: "Fosso Raso", type: "Vilarejo armadilheiro", rx: 0.570, ry: 0.710, village: true, population: 1700, note: "Fosso natural, tradicao de armadilheiros e cacadores." },
    { id: "cruzeiro-do-norte", name: "Cruzeiro do Norte", type: "Entroncamento", rx: 0.350, ry: 0.300, village: true, population: 1600, note: "Centro logistico para grupos que vao ao norte." },
    { id: "tres-lagos", name: "Aldeia Tres Lagos", type: "Vilarejo lacustre", rx: 0.468, ry: 0.702, village: true, population: 1500, note: "Tres lagos, pesca, barcos e tradicao oral rica." },
    { id: "barreira-fria", name: "Barreira Fria", type: "Passagem nevada", rx: 0.330, ry: 0.220, village: true, population: 1400, note: "Rota para o norte e pedagio em nevascas." },
    { id: "lombo-do-anao", name: "Lombo do Anao", type: "Forja familiar", rx: 0.480, ry: 0.282, village: true, population: 1200, note: "Vilarejo anao de gemas e pequena forja familiar." },
    { id: "refugio-do-tronco", name: "Refugio do Tronco", type: "Refugio florestal", rx: 0.548, ry: 0.428, village: true, population: 1100, note: "Arvores gigantes e descanso para cacadores." },
    { id: "po-e-ouro", name: "Po e Ouro", type: "Vilarejo de ruinas", rx: 0.326, ry: 0.780, village: true, population: 1100, note: "Alta rotatividade de aventureiros perto de ruinas deserticas." },
    { id: "aldeia-sem-nome", name: "Aldeia sem Nome", type: "Vilarejo isolado", rx: 0.706, ry: 0.665, village: true, population: 950, note: "Habitantes desconfiados e segredos antigos." },
    { id: "carvalho-negro", name: "Carvalho Negro", type: "Vilarejo sagrado", rx: 0.560, ry: 0.500, village: true, population: 900, note: "Carvalho milenar de tronco negro, protegido como sagrado." },
    { id: "remanso", name: "Remanso", type: "Vilarejo ribeirinho", rx: 0.430, ry: 0.615, village: true, population: 850, note: "Beira de rio calmo, afastado de conflitos e ruinas." },
    { id: "viela-da-serra", name: "Viela da Serra", type: "Passagem rochosa", rx: 0.665, ry: 0.385, village: true, population: 800, note: "Apoio para escaladores e mineradores." },
    { id: "passagem-dos-elfos", name: "Passagem dos Elfos", type: "Portao elfico", rx: 0.610, ry: 0.505, village: true, population: 750, note: "Acesso a territorios elficos profundos controlado por sentinelas." },
    { id: "cascalho", name: "Cascalho", type: "Garimpo ribeirinho", rx: 0.452, ry: 0.455, village: true, population: 700, note: "Garimpo de pedras preciosas no leito do rio." },
    { id: "poco-fundo", name: "Poco Fundo", type: "Vilarejo de poco", rx: 0.285, ry: 0.735, village: true, population: 650, note: "Poco artesiano profundo e essencial em regiao seca." },
    { id: "fim-da-estrada", name: "Fim da Estrada", type: "Fronteira selvagem", rx: 0.735, ry: 0.680, village: true, population: 600, note: "Ultimo vilarejo antes das terras selvagens." },
    { id: "beira-do-abismo", name: "Beira do Abismo", type: "Vilarejo no precipicio", rx: 0.692, ry: 0.405, village: true, population: 550, note: "Borda de abismo de 300 m e rota para ruinas abaixo." },
    { id: "clareira-dos-tres", name: "Clareira dos Tres", type: "Vilarejo tri-racial", rx: 0.505, ry: 0.495, village: true, population: 500, note: "Humanos, elfos e halflings em coexistencia estavel." },
    { id: "ultimo-marco", name: "Ultimo Marco", type: "Marco de fronteira", rx: 0.755, ry: 0.715, village: true, population: 400, note: "Marco de pedra milenar antes de territorios nao mapeados." },
  ].map((place) => ({ floor: 7, source: "compendio", ...place }));

  const routeSets = [
    ["porto-cinzento", "ironvale", "faelcross", "thais", "velmoor", "duskholm", "narath"],
    ["halveth", "tundram", "drakenthal", "bhalrock", "cravenspire", "serathis"],
    ["thais", "mireth", "solavar", "po-e-ouro", "poco-fundo"],
    ["ossebra", "variel", "selvorn", "caern-do-sul"],
    ["pedra-funda", "drakenthal", "riacho-das-cinzas", "bhalrock"],
    ["aldeia-do-sal", "thais", "lastro", "velmoor", "capim-branco"],
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
    { id: "danubia-auto", label: "Automatico Danubia" },
    { id: "danubia-dungeon", label: "Masmorra por cores" },
    { id: "danubia-world", label: "Mapa mundi por cores" },
    { id: "danubia-city", label: "Cidade por cores" },
    { id: "generic", label: "Imagem generica" },
  ];
  const THAIS_ILLUSTRATED_SRC = "thais.png";
  const THAIS_ILLUSTRATED_ASPECT = 1536 / 1024;
  const TERRAIN_SPRITE_KIND = {
    grass: "grass",
    cobble: "stone",
    water: "water",
    sand: "sand",
    dirt: "dirt",
    snow: "snow",
    lava: "lava",
    swamp: "swamp",
  };
  const MARKER_SPRITE_TYPE = {
    marker_pin: "Ponto",
    marker_danger: "Perigo",
    marker_treasure: "Tesouro",
    marker_monster: "Perigo",
    marker_temple: "Templo",
  };
  let thaisIllustratedImage = null;

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
    "danubia-auto": {
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
    "danubia-dungeon": {
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
    "danubia-world": {
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
    "danubia-city": {
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
  const fantasyMapCanvas = document.createElement("canvas");
  const fantasyMapCtx = fantasyMapCanvas.getContext("2d");
  let fantasyMapCacheKey = "";

  let activeMode = "map";
  let persisted = loadPersistedState();
  let spacePanActive = false;

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
    fantasyMap: normalizeFantasyMap(persisted.map?.fantasyMap),
    settings: {
      gridPx: persisted.map?.settings?.gridPx || 64,
      metersPerTile: persisted.map?.settings?.metersPerTile || 250,
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
      showTibiaMarkers: persisted.map?.settings?.showTibiaMarkers ?? false,
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
      styleVersion: DANUBIA_CITY_MAP_VERSION,
      cityId: persisted.city?.settings?.cityId || "thais",
      name: persisted.city?.settings?.name || "Thais",
      population: persisted.city?.settings?.population || 273110,
      areaKm2: persisted.city?.settings?.areaKm2 || 35,
      seed: persisted.city?.settings?.seed || "thais-273110",
      visualStyle: (persisted.city?.settings?.styleVersion || 0) >= DANUBIA_CITY_MAP_VERSION ? persisted.city?.settings?.visualStyle || "parchment" : "parchment",
      densityMode: persisted.city?.settings?.densityMode || "high",
      labelMode: persisted.city?.settings?.labelMode || "clean",
      buildingMode: persisted.city?.settings?.buildingMode || "symbols",
      referenceMode: persisted.city?.settings?.referenceMode || "generated",
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
    populateCityTemplateSelect();
    renderTilePalette();
    renderTileLegend();
    syncMapInputs();
    syncDungeonInputs();
    syncCityInputs();
    renderMarkerList();
    renderLabelList();
    if (!cityState.data || cityState.data.mapVersion !== DANUBIA_CITY_MAP_VERSION) generateCity();
    else {
      ensureCityManual(cityState.data);
      if (cityState.settings.referenceMode === "thais") applyThaisIllustratedDimensions();
      renderCityLists();
    }

    mapImage.onload = () => {
      mapState.ready = true;
      mapEditCacheDirty = true;
      ensureDanubiaWorldMap();
      fitMap();
      renderMap();
      updateMapCropReadout();
    };
    mapImage.onerror = () => {
      mapState.ready = false;
      renderMap();
    };
    mapImage.crossOrigin = "anonymous";
    mapImage.src = mapUrlForFloor(mapState.floor);

    resizeAll();
    window.addEventListener("resize", resizeAll);
    window.addEventListener("keydown", handleKeyboard);
    window.addEventListener("keyup", handleKeyboardUp);
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
    return APP_MODES.includes(mode) ? mode : "map";
  }

  function setActiveMode(mode, updateHash) {
    activeMode = APP_MODES.includes(mode) ? mode : "map";
    document.body.dataset.activeMode = activeMode;
    $$(".mode-tab").forEach((item) => item.classList.toggle("active", item.dataset.mode === activeMode));
    APP_MODES.forEach((panel) => {
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
    $("#generateFantasyMapBtn").addEventListener("click", generateFantasyWorldMap);
    $("#clearFantasyMapBtn").addEventListener("click", clearFantasyWorldMap);
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
    $("#sendDungeonMesaBtn").addEventListener("click", sendDungeonToMesa);
    $("#generateRandomDungeonBtn").addEventListener("click", generateStructuredDungeon);

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
    $("#cityTemplateSelect").addEventListener("change", (event) => {
      applyCityTemplate(event.target.value);
      cityState.settings.referenceMode = "generated";
      generateCity();
      syncCityInputs();
      persistSoon();
    });

    $("#generateCityBtn").addEventListener("click", () => {
      readCitySettings();
      cityState.settings.referenceMode = "generated";
      generateCity();
      persistSoon();
    });
    $("#randomCitySeedBtn").addEventListener("click", () => {
      $("#cityMapSeed").value = `${$("#cityMapName").value.trim() || "cidade"}-${Date.now().toString(36)}`;
      readCitySettings();
      cityState.settings.referenceMode = "generated";
      generateCity();
      persistSoon();
    });
    $("#loadThaisIllustratedBtn").addEventListener("click", loadThaisIllustratedCity);
    $("#useGeneratedCityBtn").addEventListener("click", () => {
      readCitySettings();
      cityState.settings.referenceMode = "generated";
      generateCity();
      syncCityInputs();
      fitCity();
      persistSoon();
    });
    $("#fitCityBtn").addEventListener("click", fitCity);
    $("#downloadCityBtn").addEventListener("click", downloadCityPng);
    $("#cityUndoBtn").addEventListener("click", undoCityEdit);
    $("#cityRedoBtn").addEventListener("click", redoCityEdit);

    $$("[data-city-tool]").forEach((button) => {
      button.addEventListener("click", () => {
        setCityTool(button.dataset.cityTool);
      });
    });
    document.addEventListener("danubia:sprite-selected", handleCitySpriteSelected);

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
        if (selector === "#cityTerrainKind") setCityTool("terrain", { render: false, persist: false });
        if (selector === "#cityBuildingKind") setCityTool("building", { render: false, persist: false });
        if (selector === "#cityMarkerType") setCityTool("marker", { render: false, persist: false });
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
    cityCanvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  function populateCityTemplateSelect() {
    const select = $("#cityTemplateSelect");
    if (!select) return;
    const current = cityState.settings.cityId || "thais";
    select.innerHTML = mainCityPlaces().map((place) => `<option value="${escapeHtml(place.id)}">${escapeHtml(place.name)} - ${escapeHtml(place.type)}</option>`).join("");
    select.value = current;
  }

  function mainCityPlaces() {
    return builtInPlaces.filter((place) => !place.village).sort((a, b) => (a.rank || 99) - (b.rank || 99));
  }

  function applyCityTemplate(cityId) {
    const profile = cityProfile(cityId);
    cityState.settings.cityId = profile.id;
    cityState.settings.name = profile.name;
    cityState.settings.population = profile.population;
    cityState.settings.areaKm2 = profile.areaKm2;
    cityState.settings.seed = `${slugify(profile.name)}-${profile.population}`;
    cityState.settings.visualStyle = profile.style || cityState.settings.visualStyle || "parchment";
    cityState.settings.densityMode = profile.density || cityState.settings.densityMode || "high";
    cityState.settings.labelMode = "clean";
  }

  function cityProfile(cityIdOrName) {
    const key = slugify(cityIdOrName || cityState.settings.cityId || cityState.settings.name || "thais");
    const place = mainCityPlaces().find((item) => item.id === key || slugify(item.name) === key) || findPlace(key) || findPlace("thais");
    const overrides = {
      thais: { population: 273110, areaKm2: 35, water: "sea-port", style: "parchment", density: "high", wall: "royal", portSide: "south" },
      "porto-cinzento": { areaKm2: 18, water: "sea-port", style: "gray", density: "high", wall: "harbor", portSide: "west" },
      "caern-do-sul": { areaKm2: 16, water: "sea-port", style: "green", density: "medium", wall: "white", portSide: "south" },
      narath: { areaKm2: 14, water: "cliff-port", style: "gray", density: "medium", wall: "cliff", portSide: "east" },
      serathis: { areaKm2: 12, water: "ice-port", style: "gray", density: "medium", wall: "stone", portSide: "north" },
      ossebra: { areaKm2: 26, water: "river", style: "green", density: "medium", wall: "organic" },
      mireth: { areaKm2: 20, water: "lake-swamp", style: "green", density: "medium", wall: "timber" },
      solavar: { areaKm2: 18, water: "oasis", style: "parchment", density: "medium", wall: "sandstone" },
      drakenthal: { areaKm2: 24, water: "none", style: "gray", density: "high", wall: "basalt" },
      bhalrock: { areaKm2: 11, water: "none", style: "gray", density: "medium", wall: "basalt" },
      halveth: { areaKm2: 15, water: "frozen-river", style: "gray", density: "medium", wall: "granite" },
      tundram: { areaKm2: 13, water: "none", style: "gray", density: "medium", wall: "granite" },
      velmoor: { areaKm2: 22, water: "canal", style: "green", density: "medium", wall: "market" },
      faelcross: { areaKm2: 16, water: "stream", style: "green", density: "medium", wall: "light" },
      selvorn: { areaKm2: 19, water: "river", style: "green", density: "medium", wall: "timber" },
      variel: { areaKm2: 18, water: "forest-lake", style: "green", density: "low", wall: "organic" },
      cravenspire: { areaKm2: 12, water: "none", style: "gray", density: "low", wall: "spire" },
      duskholm: { areaKm2: 16, water: "marsh", style: "gray", density: "medium", wall: "double" },
      eldenmoor: { areaKm2: 15, water: "lake-swamp", style: "green", density: "medium", wall: "stone" },
      ironvale: { areaKm2: 17, water: "industrial-river", style: "gray", density: "high", wall: "iron" },
    };
    const override = overrides[place?.id] || {};
    const population = override.population || place?.population || cityState.settings.population || 20000;
    const suggestedArea = Math.max(10, Math.round((population / 7800) * 10) / 10);
    return {
      id: place?.id || key,
      name: place?.name || cityState.settings.name || "Thais",
      type: place?.type || "Cidade",
      population,
      areaKm2: override.areaKm2 || suggestedArea,
      water: override.water || "river",
      style: override.style,
      density: override.density,
      wall: override.wall || "stone",
      portSide: override.portSide || "south",
    };
  }

  function setCityTool(tool, options = {}) {
    const allowed = ["pan", "terrain", "building", "road", "marker", "erase"];
    finishCityDrawing();
    cityState.settings.tool = allowed.includes(tool) ? tool : "pan";
    updateCityToolButtons();
    updateCityManualControls();
    if (options.render !== false) renderCity();
    if (options.persist !== false) persistSoon();
  }

  function updateCityToolButtons() {
    $$("[data-city-tool]").forEach((button) => {
      button.classList.toggle("active", button.dataset.cityTool === cityState.settings.tool);
    });
  }

  function updateCityManualControls() {
    const tool = cityState.settings.tool;
    const terrain = $("#cityTerrainKind");
    const building = $("#cityBuildingKind");
    const brush = $("#cityBrushMeters");
    const road = $("#cityRoadWidth");
    const markerName = $("#cityMarkerName");
    const markerType = $("#cityMarkerType");
    if (terrain) terrain.disabled = false;
    if (building) building.disabled = false;
    if (brush) brush.disabled = false;
    if (road) road.disabled = false;
    if (markerName) markerName.disabled = false;
    if (markerType) markerType.disabled = false;
    if (cityCanvas) {
      if (spacePanActive) {
        cityCanvas.style.cursor = "grab";
        return;
      }
      cityCanvas.style.cursor = {
        pan: "grab",
        terrain: "crosshair",
        road: "crosshair",
        building: "copy",
        marker: "copy",
        erase: "not-allowed",
      }[tool] || "crosshair";
    }
  }

  function handleCitySpriteSelected(event) {
    const { spriteId, sprite } = event.detail || {};
    if (!spriteId || !sprite) return;

    if (spriteId === "road") {
      setCityTool("road", { render: false, persist: false });
      renderCity();
      persistSoon();
      return;
    }

    if (sprite.group === "terrain") {
      const terrainKind = TERRAIN_SPRITE_KIND[spriteId] || "grass";
      const terrainSelect = $("#cityTerrainKind");
      if (terrainSelect && [...terrainSelect.options].some((option) => option.value === terrainKind)) {
        terrainSelect.value = terrainKind;
      }
      cityState.settings.terrainKind = terrainKind;
      setCityTool("terrain", { render: false, persist: false });
      renderCity();
      persistSoon();
      return;
    }

    if (sprite.group === "marker") {
      const type = MARKER_SPRITE_TYPE[spriteId] || "Ponto";
      $("#cityMarkerType").value = type;
      cityState.settings.markerType = type;
      setCityTool("marker", { render: false, persist: false });
      renderCity();
      persistSoon();
      return;
    }

    const mapped = sprite.cityKind || "house";
    const buildingSelect = $("#cityBuildingKind");
    if (buildingSelect && [...buildingSelect.options].some((option) => option.value === mapped)) {
      buildingSelect.value = mapped;
    }
    cityState.settings.buildingKind = mapped;
    setCityTool("building", { render: false, persist: false });
    renderCity();
    persistSoon();
  }

  function syncCityInputs() {
    populateCityTemplateSelect();
    $("#cityTemplateSelect").value = cityState.settings.cityId || "thais";
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
    updateCityToolButtons();
    updateCityManualControls();
    $("#showCityGrid").checked = cityState.settings.showGrid;
    $("#showCityWalls").checked = cityState.settings.showWalls;
    $("#showCityBuildings").checked = cityState.settings.showBuildings;
    $("#showCityWater").checked = cityState.settings.showWater;
    $("#showCityMarkers").checked = cityState.settings.showMarkers;
    $("#showCityMarkerLabels").checked = cityState.settings.showMarkerLabels;
    $("#showCityDistrictLabels").checked = cityState.settings.showDistrictLabels;
    $("#showCityFields").checked = cityState.settings.showFields;
    $("#loadThaisIllustratedBtn").classList.toggle("active", cityState.settings.referenceMode === "thais");
    $("#useGeneratedCityBtn").classList.toggle("active", cityState.settings.referenceMode !== "thais");
  }

  function readCitySettings() {
    cityState.settings.cityId = $("#cityTemplateSelect")?.value || cityState.settings.cityId || slugify($("#cityMapName").value);
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
    } else if (activeMode === "city") {
      resizeCanvas(cityCanvas, cityCtx);
      renderCity();
    } else if (window.MesaCombate?.render) {
      window.MesaCombate.render();
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
    if (mapState.fantasyMap) {
      fitMapToBounds(mapState.fantasyMap.bounds);
      return;
    }
    const size = canvasSize(mapCanvas);
    const scale = Math.min(size.width / mapImage.width, size.height / mapImage.height) * 0.94;
    mapState.view.scale = scale;
    mapState.view.x = (size.width - mapImage.width * scale) / 2;
    mapState.view.y = (size.height - mapImage.height * scale) / 2;
    persistSoon();
    renderMap();
  }

  function fitMapToBounds(bounds) {
    if (!bounds || bounds.w <= 0 || bounds.h <= 0) return;
    const size = canvasSize(mapCanvas);
    const coverWorld = mapState.fantasyMap?.fullWorld && bounds === mapState.fantasyMap.bounds;
    const scale = (coverWorld ? Math.max(size.width / bounds.w, size.height / bounds.h) * 0.98 : Math.min(size.width / bounds.w, size.height / bounds.h) * 0.90);
    mapState.view.scale = clamp(scale, 0.06, 5);
    mapState.view.x = size.width / 2 - (bounds.x + bounds.w / 2) * mapState.view.scale;
    mapState.view.y = size.height / 2 - (bounds.y + bounds.h / 2) * mapState.view.scale;
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
    mapCtx.fillStyle = mapState.fantasyMap?.fullWorld ? "#c7b58d" : "#171513";
    mapCtx.fillRect(0, 0, size.width, size.height);

    if (!mapState.ready) {
      drawCenteredText(mapCtx, size.width, size.height, "Carregando mapa...");
      return;
    }

    const view = mapState.view;
    mapCtx.imageSmoothingEnabled = mapState.view.scale < 1;
    if (!mapState.fantasyMap?.fullWorld) {
      mapCtx.drawImage(mapImage, view.x, view.y, mapImage.width * view.scale, mapImage.height * view.scale);
    }
    drawFantasyWorldMapScreen(mapCtx);
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
    const bounds = mapDrawingBounds();
    const topLeft = mapImageToScreen({ x: bounds.x, y: bounds.y });
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      mapEditCache,
      topLeft.x,
      topLeft.y,
      bounds.w * mapState.view.scale,
      bounds.h * mapState.view.scale
    );
    ctx.restore();
  }

  function drawCityFootprintScreen(ctx) {
    if (mapState.fantasyMap?.fullWorld && mapState.view.scale < 0.28) return;
    const bounds = cityFootprintBounds();
    if (!bounds) return;
    const topLeft = mapImageToScreen({ x: bounds.x, y: bounds.y });
    const size = bounds.w * mapState.view.scale;

    ctx.save();
    ctx.fillStyle = "rgba(210, 173, 85, 0.10)";
    ctx.strokeStyle = "rgba(255, 224, 161, 0.90)";
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 7]);
    ctx.fillRect(topLeft.x, topLeft.y, size, size);
    ctx.strokeRect(topLeft.x, topLeft.y, size, size);
    ctx.setLineDash([]);
    ctx.font = "700 14px Georgia";
    const label = `${bounds.areaKm2.toFixed(bounds.areaKm2 < 100 ? 1 : 0)} km²`;
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

  function cityFootprintBounds() {
    const info = cityScaleInfo();
    if (!info || !Number.isFinite(info.sideTiles)) return null;
    const centerPlace = findPlace(mapState.selectedId) || findPlace("thais") || builtInPlaces.find((place) => place.floor === mapState.floor);
    if (!centerPlace) return null;
    const center = placePoint(centerPlace);
    const side = info.sideTiles;
    return {
      x: center.x - side / 2,
      y: center.y - side / 2,
      w: side,
      h: side,
      cx: center.x,
      cy: center.y,
      floor: mapState.floor,
      areaKm2: info.displayAreaKm2,
      sideKm: info.sideKm,
    };
  }

  function drawFantasyWorldMapScreen(ctx) {
    if (!mapState.fantasyMap || mapState.fantasyMap.floor !== mapState.floor) return;
    rebuildFantasyMapCanvasIfNeeded();
    if (!fantasyMapCanvas.width || !fantasyMapCanvas.height) return;
    const bounds = mapState.fantasyMap.bounds;
    const topLeft = mapImageToScreen({ x: bounds.x, y: bounds.y });
    ctx.save();
    ctx.imageSmoothingEnabled = Boolean(mapState.fantasyMap.fullWorld);
    ctx.drawImage(fantasyMapCanvas, topLeft.x, topLeft.y, bounds.w * mapState.view.scale, bounds.h * mapState.view.scale);
    ctx.strokeStyle = "rgba(255, 224, 161, 0.48)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(topLeft.x, topLeft.y, bounds.w * mapState.view.scale, bounds.h * mapState.view.scale);
    ctx.restore();
  }

  function drawFantasyWorldMapNatural(ctx, sourceRect, outputWidth, outputHeight) {
    if (!mapState.fantasyMap || mapState.fantasyMap.floor !== mapState.floor) return;
    rebuildFantasyMapCanvasIfNeeded();
    if (!fantasyMapCanvas.width || !fantasyMapCanvas.height) return;
    const bounds = mapState.fantasyMap.bounds;
    const scaleX = outputWidth / sourceRect.w;
    const scaleY = outputHeight / sourceRect.h;
    ctx.save();
    ctx.imageSmoothingEnabled = Boolean(mapState.fantasyMap.fullWorld);
    ctx.drawImage(
      fantasyMapCanvas,
      0,
      0,
      fantasyMapCanvas.width,
      fantasyMapCanvas.height,
      (bounds.x - sourceRect.x) * scaleX,
      (bounds.y - sourceRect.y) * scaleY,
      bounds.w * scaleX,
      bounds.h * scaleY
    );
    ctx.restore();
  }

  function rebuildMapEditCacheIfNeeded() {
    if (!mapState.ready) return;
    const bounds = mapDrawingBounds();
    if (mapEditCache.width !== bounds.w || mapEditCache.height !== bounds.h) {
      mapEditCache.width = bounds.w;
      mapEditCache.height = bounds.h;
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

  function generateFantasyWorldMap() {
    if (IS_PLAYER_VIEW) return;
    if (!mapState.ready) return;
    if (mapState.settings.metersPerTile < 50) mapState.settings.metersPerTile = 250;
    mapState.fantasyMap = createDanubiaWorldMap(Math.floor(Date.now() % 2147483647));
    syncMapInputs();
    fantasyMapCacheKey = "";
    fitMapToBounds(mapState.fantasyMap.bounds);
    persistSoon();
    renderMap();
  }

  function ensureDanubiaWorldMap() {
    if (mapState.fantasyMap?.fullWorld && mapState.fantasyMap.version >= DANUBIA_WORLD_MAP_VERSION && mapState.fantasyMap.floor === 7) {
      if (mapState.settings.metersPerTile < 50) {
        mapState.settings.metersPerTile = 250;
        syncMapInputs();
      }
      return;
    }
    if (mapState.settings.metersPerTile < 50) mapState.settings.metersPerTile = 250;
    mapState.fantasyMap = createDanubiaWorldMap(DANUBIA_WORLD_SEED);
    syncMapInputs();
    fantasyMapCacheKey = "";
    persistSoon();
  }

  function createDanubiaWorldMap(seed) {
    return {
      version: DANUBIA_WORLD_MAP_VERSION,
      fullWorld: true,
      floor: 7,
      seed: Math.abs(Math.floor(seed || DANUBIA_WORLD_SEED)),
      resolution: 1920,
      resolutionW: 1920,
      resolutionH: 1200,
      bounds: { x: 0, y: 0, w: DANUBIA_WORLD_WIDTH, h: DANUBIA_WORLD_HEIGHT },
      areaKm2: Math.round((DANUBIA_WORLD_WIDTH * mapState.settings.metersPerTile / 1000) * (DANUBIA_WORLD_HEIGHT * mapState.settings.metersPerTile / 1000)),
      population: builtInPlaces.reduce((sum, place) => sum + (place.population || 0), 0),
      continents: 12,
    };
  }

  function clearFantasyWorldMap() {
    if (IS_PLAYER_VIEW) return;
    mapState.fantasyMap = null;
    fantasyMapCanvas.width = 0;
    fantasyMapCanvas.height = 0;
    fantasyMapCacheKey = "";
    persistSoon();
    renderMap();
  }

  function rebuildFantasyMapCanvasIfNeeded() {
    const map = mapState.fantasyMap;
    if (!map) return;
    const key = `${map.version}:${map.fullWorld ? 1 : 0}:${map.floor}:${map.seed}:${map.resolution}:${map.resolutionW || 0}:${map.resolutionH || 0}:${map.bounds.x}:${map.bounds.y}:${map.bounds.w}:${map.bounds.h}:${map.urbanKm2 || 0}:${map.population || 0}`;
    if (fantasyMapCacheKey === key && fantasyMapCanvas.width === (map.resolutionW || map.resolution)) return;
    renderFantasyMapRaster(map);
    fantasyMapCacheKey = key;
  }

  function renderFantasyMapRaster(map) {
    if (map.fullWorld) {
      renderDanubiaWorldRaster(map);
      return;
    }
    const size = clamp(Math.round(map.resolution || 1200), 512, 1600);
    fantasyMapCanvas.width = size;
    fantasyMapCanvas.height = size;
    fantasyMapCtx.imageSmoothingEnabled = false;
    const image = fantasyMapCtx.createImageData(size, size);
    const data = image.data;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const terrain = fantasyTerrainAt(x / size, y / size, map.seed);
        const offset = (y * size + x) * 4;
        data[offset] = terrain[0];
        data[offset + 1] = terrain[1];
        data[offset + 2] = terrain[2];
        data[offset + 3] = 255;
      }
    }
    fantasyMapCtx.putImageData(image, 0, 0);
    const cities = fantasyCityLayout(map.seed, size, map);
    drawFantasyFarms(fantasyMapCtx, size, map.seed, cities);
    drawFantasyRivers(fantasyMapCtx, size, map.seed, cities);
    drawFantasyRoads(fantasyMapCtx, size, cities);
    cities.forEach((city) => drawFantasyCity(fantasyMapCtx, size, city, map.seed));
    drawFantasyOutposts(fantasyMapCtx, size, map.seed);
  }

  function renderDanubiaWorldRaster(map) {
    const width = clamp(Math.round(map.resolutionW || 1536), 768, 2048);
    const height = clamp(Math.round(map.resolutionH || 1152), 576, 1536);
    fantasyMapCanvas.width = width;
    fantasyMapCanvas.height = height;
    fantasyMapCtx.imageSmoothingEnabled = true;
    const image = fantasyMapCtx.createImageData(width, height);
    const data = image.data;
    const continents = danubiaContinents();

    for (let y = 0; y < height; y += 1) {
      const ny = y / height;
      for (let x = 0; x < width; x += 1) {
        const nx = x / width;
        const terrain = danubiaTerrainAt(nx, ny, map.seed, continents);
        const offset = (y * width + x) * 4;
        data[offset] = terrain[0];
        data[offset + 1] = terrain[1];
        data[offset + 2] = terrain[2];
        data[offset + 3] = 255;
      }
    }

    fantasyMapCtx.putImageData(image, 0, 0);
    drawDanubiaParchmentWash(fantasyMapCtx, width, height, map.seed);
    drawDanubiaCoastlines(fantasyMapCtx, width, height, map.seed, continents);
    drawDanubiaSeaDetail(fantasyMapCtx, width, height, map.seed);
    drawDanubiaRivers(fantasyMapCtx, width, height);
    drawDanubiaTerrainSymbols(fantasyMapCtx, width, height, map.seed, continents);
    drawDanubiaFields(fantasyMapCtx, width, height, map.seed);
    drawDanubiaThaisBay(fantasyMapCtx, width, height);
    drawDanubiaRoads(fantasyMapCtx, width, height);
    drawDanubiaSettlements(fantasyMapCtx, width, height, map.seed);
    drawDanubiaRegionLabels(fantasyMapCtx, width, height);
    drawDanubiaMapFrame(fantasyMapCtx, width, height);
  }

  function danubiaContinents() {
    return [
      { id: "coroa-norte", cx: 0.315, cy: 0.155, rx: 0.155, ry: 0.105, biome: "snow" },
      { id: "cinzas", cx: 0.625, cy: 0.285, rx: 0.150, ry: 0.115, biome: "volcano" },
      { id: "danubia-central", cx: 0.455, cy: 0.525, rx: 0.245, ry: 0.210, biome: "green" },
      { id: "sul-tropical", cx: 0.430, cy: 0.805, rx: 0.180, ry: 0.130, biome: "jungle" },
      { id: "solavar", cx: 0.255, cy: 0.660, rx: 0.155, ry: 0.120, biome: "desert" },
      { id: "brejos-leste", cx: 0.655, cy: 0.665, rx: 0.155, ry: 0.135, biome: "swamp" },
      { id: "costa-rochosa", cx: 0.795, cy: 0.500, rx: 0.145, ry: 0.165, biome: "rock" },
      { id: "arquipelago-artico", cx: 0.835, cy: 0.150, rx: 0.110, ry: 0.085, biome: "ice" },
      { id: "ilhas-ocidentais", cx: 0.105, cy: 0.450, rx: 0.105, ry: 0.150, biome: "green", minor: true },
      { id: "alcinor", cx: 0.135, cy: 0.845, rx: 0.145, ry: 0.105, biome: "jungle", minor: true },
      { id: "fiordes-do-leste", cx: 0.920, cy: 0.360, rx: 0.075, ry: 0.185, biome: "rock", minor: true },
      { id: "arquipelago-sul", cx: 0.745, cy: 0.875, rx: 0.120, ry: 0.070, biome: "swamp", minor: true },
      { id: "costa-dourada", cx: 0.215, cy: 0.310, rx: 0.105, ry: 0.085, biome: "desert", minor: true },
      { id: "ilhas-negras", cx: 0.905, cy: 0.760, rx: 0.085, ry: 0.090, biome: "volcano", minor: true },
    ];
  }

  function danubiaTerrainAt(nx, ny, seed, continents) {
    let best = null;
    let bestScore = -99;
    for (const continent of continents) {
      const warpX = fbm(nx * 7.3 + 10, ny * 7.3 - 4, seed + continent.cx * 10000, 3) - 0.5;
      const warpY = fbm(nx * 6.2 - 5, ny * 6.2 + 9, seed + continent.cy * 10000, 3) - 0.5;
      const dx = (nx - continent.cx + warpX * 0.055) / continent.rx;
      const dy = (ny - continent.cy + warpY * 0.055) / continent.ry;
      const edge = Math.sqrt(dx * dx + dy * dy);
      const score = 1 - edge + fbm(nx * 18.0, ny * 18.0, seed + 91, 2) * 0.17;
      if (score > bestScore) {
        bestScore = score;
        best = continent;
      }
    }

    const wave = fbm(nx * 30, ny * 30, seed + 123, 2);
    if (bestScore < 0.012) return shadeRgb(wave > 0.62 ? [103, 151, 169] : [86, 134, 159], wave, 11);
    if (bestScore < 0.078) return shadeRgb([211, 190, 130], wave, 10);

    const detail = fbm(nx * 36, ny * 36, seed + 303, 3);
    const rough = fbm(nx * 11, ny * 11, seed + 707, 4);
    if (best.biome === "snow" || best.biome === "ice") {
      if (rough > 0.68) return shadeRgb([138, 139, 129], detail, 9);
      if (detail > 0.52) return shadeRgb([225, 226, 211], rough, 7);
      return shadeRgb([190, 202, 197], detail, 8);
    }
    if (best.biome === "volcano") {
      if (rough > 0.73) return shadeRgb([86, 82, 73], detail, 8);
      if (detail > 0.84) return [174, 84, 48];
      if (rough > 0.54) return shadeRgb([126, 113, 89], detail, 8);
      return shadeRgb([103, 94, 72], rough, 7);
    }
    if (best.biome === "desert") {
      if (rough > 0.70) return shadeRgb([151, 128, 85], detail, 9);
      if (detail < 0.24) return shadeRgb([221, 190, 126], rough, 7);
      return shadeRgb([202, 165, 97], detail, 8);
    }
    if (best.biome === "swamp") {
      if (detail > 0.68) return shadeRgb([70, 103, 73], rough, 8);
      if (rough < 0.28) return shadeRgb([98, 126, 87], detail, 8);
      return shadeRgb([118, 111, 72], rough, 7);
    }
    if (best.biome === "rock") {
      if (rough > 0.58) return shadeRgb([122, 121, 107], detail, 9);
      if (detail > 0.66) return shadeRgb([76, 103, 73], rough, 8);
      return shadeRgb([148, 137, 102], detail, 7);
    }
    if (best.biome === "jungle") {
      if (detail > 0.56) return shadeRgb([45, 98, 58], rough, 8);
      if (rough > 0.62) return shadeRgb([63, 115, 65], detail, 8);
      return shadeRgb([91, 143, 76], rough, 8);
    }
    if (detail > 0.70) return shadeRgb([65, 113, 60], rough, 8);
    if (rough > 0.64) return shadeRgb([126, 132, 100], detail, 8);
    if (detail < 0.20) return shadeRgb([145, 172, 105], rough, 7);
    return shadeRgb([124, 156, 91], detail, 8);
  }

  function shadeRgb(rgb, noise, amount) {
    const delta = Math.round((noise - 0.5) * amount * 2);
    return rgb.map((channel) => clamp(channel + delta, 0, 255));
  }

  function drawDanubiaParchmentWash(ctx, width, height, seed) {
    const rng = mulberry32(seed + 8113);
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(228, 206, 155, 0.20)";
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgba(65, 48, 29, 0.035)";
    for (let i = 0; i < 520; i += 1) {
      ctx.fillRect(rng() * width, rng() * height, 1 + rng() * 2, 1 + rng() * 2);
    }
    ctx.restore();
  }

  function drawDanubiaCoastlines(ctx, width, height, seed, continents) {
    ctx.save();
    continents.forEach((continent, index) => {
      const points = [];
      const count = 94;
      for (let i = 0; i <= count; i += 1) {
        const angle = (i / count) * Math.PI * 2;
        const wobble = 1 + (fbm(Math.cos(angle) * 2.7 + index, Math.sin(angle) * 2.7 - index, seed + index * 499, 3) - 0.5) * 0.14;
        points.push({
          x: (continent.cx + Math.cos(angle) * continent.rx * wobble) * width,
          y: (continent.cy + Math.sin(angle) * continent.ry * wobble) * height,
        });
      }
      ctx.strokeStyle = "rgba(42, 35, 24, 0.30)";
      ctx.lineWidth = Math.max(2, width * 0.0015);
      drawPolyline(ctx, points);
      ctx.stroke();
      ctx.strokeStyle = "rgba(240, 224, 170, 0.55)";
      ctx.lineWidth = Math.max(1, width * 0.0008);
      drawPolyline(ctx, points);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawDanubiaSeaDetail(ctx, width, height, seed) {
    const rng = mulberry32(seed + 6001);
    ctx.save();
    ctx.strokeStyle = "rgba(226, 238, 223, 0.20)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 280; i += 1) {
      const x = rng() * width;
      const y = rng() * height;
      const len = 10 + rng() * 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.bezierCurveTo(x + len * 0.25, y - 3, x + len * 0.62, y + 3, x + len, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDanubiaRivers(ctx, width, height) {
    const rivers = [
      [[0.42, 0.22], [0.46, 0.36], [0.43, 0.49], [0.36, 0.60]],
      [[0.60, 0.33], [0.54, 0.42], [0.50, 0.53], [0.45, 0.63]],
      [[0.66, 0.55], [0.62, 0.62], [0.60, 0.72], [0.66, 0.80]],
      [[0.34, 0.78], [0.39, 0.76], [0.44, 0.83], [0.39, 0.93]],
    ];
    ctx.save();
    ctx.lineCap = "round";
    rivers.forEach((river) => {
      ctx.strokeStyle = "#315f82";
      ctx.lineWidth = Math.max(5, width * 0.004);
      drawBezierPath(ctx, river, width, height);
      ctx.stroke();
      ctx.strokeStyle = "#75aabd";
      ctx.lineWidth = Math.max(1, width * 0.0012);
      drawBezierPath(ctx, river, width, height);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawDanubiaTerrainSymbols(ctx, width, height, seed, continents) {
    const rng = mulberry32(seed + 9321);
    ctx.save();
    continents.forEach((continent, index) => {
      const dense = continent.biome === "jungle" || continent.biome === "green" || continent.biome === "swamp";
      const rocky = continent.biome === "rock" || continent.biome === "volcano" || continent.biome === "snow" || continent.biome === "ice";
      const arid = continent.biome === "desert";
      const count = dense ? 190 : rocky ? 110 : arid ? 70 : 100;
      for (let i = 0; i < count; i += 1) {
        const angle = rng() * Math.PI * 2;
        const radius = Math.sqrt(rng()) * (0.72 + rng() * 0.22);
        const x = (continent.cx + Math.cos(angle) * continent.rx * radius) * width;
        const y = (continent.cy + Math.sin(angle) * continent.ry * radius) * height;
        if (x < 20 || y < 20 || x > width - 20 || y > height - 20) continue;
        const scale = Math.max(0.55, width / 1536) * (0.74 + rng() * 0.55);
        if (dense) drawAtlasTree(ctx, x, y, scale, rng, continent.biome);
        else if (rocky) drawAtlasMountain(ctx, x, y, scale, rng, continent.biome);
        else if (arid) drawAtlasDune(ctx, x, y, scale, rng);
        else if (rng() > 0.44) drawAtlasTree(ctx, x, y, scale * 0.86, rng, continent.biome);
      }
    });
    ctx.restore();
  }

  function drawAtlasTree(ctx, x, y, scale, rng, biome) {
    ctx.save();
    ctx.translate(x, y);
    const dark = biome === "jungle" ? "#274c34" : "#36583b";
    const light = biome === "swamp" ? "#657245" : "#5f7a4c";
    ctx.strokeStyle = "rgba(31, 38, 27, 0.55)";
    ctx.fillStyle = rng() > 0.5 ? dark : light;
    ctx.lineWidth = Math.max(0.8, scale * 0.9);
    ctx.beginPath();
    ctx.moveTo(0, -7 * scale);
    ctx.lineTo(5 * scale, 4 * scale);
    ctx.lineTo(-5 * scale, 4 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(46, 38, 23, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, 3 * scale);
    ctx.lineTo(0, 8 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawAtlasMountain(ctx, x, y, scale, rng, biome) {
    ctx.save();
    ctx.translate(x, y);
    const snowy = biome === "snow" || biome === "ice";
    ctx.fillStyle = snowy ? "rgba(226, 226, 211, 0.58)" : "rgba(112, 105, 86, 0.60)";
    ctx.strokeStyle = "rgba(42, 36, 27, 0.50)";
    ctx.lineWidth = Math.max(0.9, scale);
    ctx.beginPath();
    ctx.moveTo(-7 * scale, 6 * scale);
    ctx.lineTo(-1 * scale, -7 * scale);
    ctx.lineTo(3 * scale, 1 * scale);
    ctx.lineTo(8 * scale, 6 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (rng() > 0.45) {
      ctx.beginPath();
      ctx.moveTo(-1 * scale, -7 * scale);
      ctx.lineTo(0, 3 * scale);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawAtlasDune(ctx, x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(94, 70, 35, 0.34)";
    ctx.lineWidth = Math.max(0.8, scale * 0.8);
    ctx.beginPath();
    ctx.moveTo(-8 * scale, 2 * scale);
    ctx.quadraticCurveTo(0, -5 * scale, 9 * scale, 2 * scale);
    ctx.stroke();
    ctx.restore();
  }

  function drawBezierPath(ctx, points, width, height) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0][0] * width, points[0][1] * height);
    for (let i = 1; i < points.length - 1; i += 1) {
      const midX = (points[i][0] + points[i + 1][0]) * 0.5 * width;
      const midY = (points[i][1] + points[i + 1][1]) * 0.5 * height;
      ctx.quadraticCurveTo(points[i][0] * width, points[i][1] * height, midX, midY);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last[0] * width, last[1] * height);
  }

  function drawDanubiaFields(ctx, width, height, seed) {
    const rng = mulberry32(seed + 4127);
    const anchors = builtInPlaces.filter((place) => !place.village && place.rank <= 13);
    ctx.save();
    anchors.forEach((place) => {
      const p = worldCanvasPoint(place, width, height);
      for (let i = 0; i < 7; i += 1) {
        const angle = rng() * Math.PI * 2;
        const dist = 20 + rng() * 45;
        const x = p.x + Math.cos(angle) * dist;
        const y = p.y + Math.sin(angle) * dist;
        const w = 16 + rng() * 32;
        const h = 8 + rng() * 20;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((rng() - 0.5) * 0.7);
        ctx.fillStyle = rng() > 0.45 ? "#9a8c55" : "#768b4c";
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = "rgba(42, 33, 18, 0.45)";
        ctx.strokeRect(-w / 2, -h / 2, w, h);
        ctx.strokeStyle = "rgba(235, 221, 160, 0.34)";
        for (let stripe = -h / 2 + 3; stripe < h / 2; stripe += 5) {
          ctx.beginPath();
          ctx.moveTo(-w / 2 + 2, stripe);
          ctx.lineTo(w / 2 - 2, stripe);
          ctx.stroke();
        }
        ctx.restore();
      }
    });
    ctx.restore();
  }

  function drawDanubiaThaisBay(ctx, width, height) {
    const coast = [
      [0.405, 0.748],
      [0.445, 0.727],
      [0.492, 0.738],
      [0.535, 0.728],
      [0.585, 0.748],
      [0.638, 0.735],
    ];
    const waterPolygon = [
      ...coast,
      [0.665, 0.860],
      [0.625, 1.040],
      [0.395, 1.040],
      [0.365, 0.860],
    ].map(([x, y]) => ({ x: x * width, y: y * height }));
    const coastPoints = coast.map(([x, y]) => ({ x: x * width, y: y * height }));
    ctx.save();
    drawClosedPolygon(ctx, waterPolygon);
    ctx.fillStyle = "#6e9fba";
    ctx.fill();
    ctx.strokeStyle = "rgba(48, 73, 77, 0.78)";
    ctx.lineWidth = Math.max(6, width * 0.005);
    drawPolyline(ctx, coastPoints);
    ctx.stroke();
    ctx.strokeStyle = "rgba(226, 214, 163, 0.90)";
    ctx.lineWidth = Math.max(3, width * 0.0024);
    drawPolyline(ctx, coastPoints);
    ctx.stroke();

    ctx.globalAlpha = 0.32;
    ctx.strokeStyle = "rgba(231, 246, 238, 0.72)";
    ctx.lineWidth = Math.max(1.2, width * 0.0011);
    for (let i = 0; i < 5; i += 1) {
      const y = height * (0.780 + i * 0.035);
      ctx.beginPath();
      ctx.moveTo(width * 0.405, y);
      ctx.bezierCurveTo(width * 0.475, y + height * 0.010, width * 0.545, y - height * 0.012, width * 0.625, y + height * 0.005);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = "rgba(75, 48, 27, 0.70)";
    ctx.fillStyle = "#9b7650";
    for (let i = 0; i < 6; i += 1) {
      const x = width * (0.448 + i * 0.030);
      const y = height * (0.746 + (i % 2) * 0.010);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((i - 3) * 0.018);
      roundedRect(ctx, -width * 0.0032, 0, width * 0.0064, height * 0.060, Math.max(2, width * 0.0012));
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    ctx.font = `700 ${clamp(width * 0.011, 13, 22)}px Georgia`;
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(35, 50, 57, 0.62)";
    ctx.fillText("Baia de Thais", width * 0.515, height * 0.825);
    ctx.restore();
  }

  function drawDanubiaRoads(ctx, width, height) {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    routeSets.forEach((route) => {
      const points = route.map((id) => findPlace(id)).filter(Boolean).map((place) => worldCanvasPoint(place, width, height));
      if (points.length < 2) return;
      ctx.strokeStyle = "rgba(62, 47, 29, 0.58)";
      ctx.lineWidth = Math.max(2.5, width * 0.0022);
      drawPolyline(ctx, points);
      ctx.stroke();
      ctx.strokeStyle = "rgba(236, 213, 148, 0.82)";
      ctx.lineWidth = Math.max(1, width * 0.0009);
      drawPolyline(ctx, points);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawDanubiaSettlements(ctx, width, height, seed) {
    ctx.save();
    builtInPlaces.forEach((place, index) => {
      const rng = mulberry32(seed + index * 1091 + (place.village ? 71 : 17));
      const p = worldCanvasPoint(place, width, height);
      if (place.village) drawDanubiaVillageIcon(ctx, p.x, p.y, rng);
      else drawDanubiaCityIcon(ctx, p.x, p.y, place, rng);
    });
    ctx.restore();
  }

  function drawDanubiaRegionLabels(ctx, width, height) {
    const labels = [
      ["Coroa Norte", 0.28, 0.105, -0.06],
      ["Cinzas de Bhalrock", 0.63, 0.205, 0.05],
      ["Danubia Central", 0.45, 0.500, -0.03],
      ["Selvas do Sul", 0.43, 0.765, 0.05],
      ["Solavar", 0.285, 0.620, -0.20],
      ["Brejos Leste", 0.655, 0.640, 0.10],
      ["Costa Rochosa", 0.785, 0.470, 0.16],
      ["Arquipelago Artico", 0.825, 0.115, 0.08],
      ["Ilhas Ocidentais", 0.108, 0.410, -0.20],
      ["Alcinor", 0.138, 0.808, 0.08],
      ["Fiordes do Leste", 0.912, 0.330, 0.38],
      ["Arquipelago Sul", 0.744, 0.838, -0.05],
    ];
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    labels.forEach(([name, x, y, rotation]) => {
      const size = clamp(width * 0.016, 18, 34);
      ctx.save();
      ctx.translate(x * width, y * height);
      ctx.rotate(rotation);
      ctx.font = `900 ${size}px Cinzel, Georgia`;
      ctx.letterSpacing = "0px";
      ctx.strokeStyle = "rgba(236, 224, 184, 0.58)";
      ctx.lineWidth = size * 0.22;
      ctx.fillStyle = "rgba(45, 35, 23, 0.44)";
      ctx.strokeText(name.toUpperCase(), 0, 0);
      ctx.fillText(name.toUpperCase(), 0, 0);
      ctx.restore();
    });
    ctx.restore();
  }

  function drawDanubiaCityIcon(ctx, x, y, place, rng) {
    const base = clamp(Math.sqrt(place.areaKm2 || 220) * 0.75, 12, 34);
    const rx = base * (place.id === "thais" ? 1.55 : 1.0);
    const ry = base * (place.id === "thais" ? 1.25 : 0.86);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(95, 91, 72, 0.95)";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    if (place.rank <= 8) {
      ctx.strokeStyle = place.id === "drakenthal" || place.id === "bhalrock" ? "#3b3730" : "#d74724";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.04, ry * 1.04, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "#c6a867";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i += 1) {
      const angle = (i / 5) * Math.PI * 2 + rng() * 0.18;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * rx * 0.95, Math.sin(angle) * ry * 0.95);
      ctx.stroke();
    }
    const count = place.id === "thais" ? 180 : clamp(125 - (place.rank || 20) * 4, 42, 120);
    for (let i = 0; i < count; i += 1) {
      const a = rng() * Math.PI * 2;
      const d = Math.sqrt(rng()) * 0.88;
      const bx = Math.cos(a) * rx * d;
      const by = Math.sin(a) * ry * d;
      if (Math.abs(Math.sin(a * 5) * d) < 0.055) continue;
      const bw = 2 + rng() * (place.id === "thais" ? 5 : 4);
      const bh = 2 + rng() * 4;
      ctx.fillStyle = rng() > 0.33 ? "#cf6d38" : "#b8452b";
      ctx.fillRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
      ctx.strokeStyle = "rgba(41, 29, 20, 0.55)";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(Math.round(bx), Math.round(by), Math.round(bw), Math.round(bh));
    }
    if (place.rank <= 3) {
      ctx.fillStyle = "#8d8876";
      ctx.fillRect(-6, -ry * 0.46, 12, 10);
      ctx.strokeStyle = "#2a2119";
      ctx.strokeRect(-6, -ry * 0.46, 12, 10);
    }
    ctx.restore();
  }

  function drawDanubiaVillageIcon(ctx, x, y, rng) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(112, 98, 67, 0.70)";
    ctx.fillRect(-7, -5, 14, 10);
    const count = 5 + Math.floor(rng() * 6);
    for (let i = 0; i < count; i += 1) {
      const bx = -9 + rng() * 18;
      const by = -7 + rng() * 14;
      ctx.fillStyle = rng() > 0.45 ? "#c89555" : "#94603b";
      ctx.fillRect(Math.round(bx), Math.round(by), 3 + Math.floor(rng() * 3), 2 + Math.floor(rng() * 3));
    }
    ctx.strokeStyle = "#2f2419";
    ctx.strokeRect(-7, -5, 14, 10);
    ctx.restore();
  }

  function drawDanubiaMapFrame(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(37, 28, 18, 0.74)";
    ctx.lineWidth = 12;
    ctx.strokeRect(7, 7, width - 14, height - 14);
    ctx.strokeStyle = "rgba(239, 218, 159, 0.82)";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 10]);
    ctx.strokeRect(24, 24, width - 48, height - 48);
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(30, 24, 16, 0.76)";
    roundedRect(ctx, 34, 34, 270, 58, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(239, 218, 159, 0.58)";
    ctx.stroke();
    ctx.fillStyle = "#f0d48b";
    ctx.font = "900 30px Cinzel, Georgia";
    ctx.fillText("DANUBIA", 52, 68);
    ctx.font = "700 13px Georgia";
    ctx.fillText("Atlas original de campanha", 185, 69);
    drawDanubiaCompass(ctx, width - 105, height - 104, Math.max(34, width * 0.034));
    ctx.restore();
  }

  function drawDanubiaCompass(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "rgba(45, 34, 20, 0.72)";
    ctx.fillStyle = "rgba(239, 218, 159, 0.70)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - 0.16) * r * 0.28, Math.sin(a - 0.16) * r * 0.28);
      ctx.lineTo(Math.cos(a) * r * (i % 2 === 0 ? 0.90 : 0.58), Math.sin(a) * r * (i % 2 === 0 ? 0.90 : 0.58));
      ctx.lineTo(Math.cos(a + 0.16) * r * 0.28, Math.sin(a + 0.16) * r * 0.28);
      ctx.closePath();
      ctx.fillStyle = i === 0 ? "rgba(129, 47, 37, 0.92)" : "rgba(239, 218, 159, 0.70)";
      ctx.fill();
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(45, 34, 20, 0.82)";
    ctx.font = `900 ${Math.round(r * 0.34)}px Cinzel, Georgia`;
    ctx.textAlign = "center";
    ctx.fillText("N", 0, -r - 8);
    ctx.restore();
  }

  function worldCanvasPoint(place, width, height) {
    return {
      x: clamp((place.rx || 0.5) * width, 0, width),
      y: clamp((place.ry || 0.5) * height, 0, height),
    };
  }

  function fantasyTerrainAt(nx, ny, seed) {
    const dx = (nx - 0.52) * 1.72;
    const dy = (ny - 0.50) * 1.48;
    const edge = Math.sqrt(dx * dx + dy * dy);
    const height = 0.78 - edge + fbm(nx * 3.2 + 8, ny * 3.2 - 4, seed, 5) * 0.54;
    const rough = fbm(nx * 14.5, ny * 14.5, seed + 41, 3);
    const forest = fbm(nx * 26, ny * 26, seed + 97, 3);
    const biome = fbm(nx * 5.3 - 2, ny * 5.3 + 9, seed + 231, 3);

    if (height < 0.13) return rough > 0.58 ? [62, 111, 141] : [70, 120, 151];
    if (height < 0.18) return [238, 194, 132];
    if (height > 0.61 && rough > 0.48) return rough > 0.68 ? [92, 96, 88] : [118, 121, 108];
    if (biome > 0.69 && height < 0.42) return [186, 143, 82];
    if (forest > 0.61 && height > 0.25) return forest > 0.73 ? [0, 98, 18] : [0, 129, 19];
    if (forest > 0.53 && height > 0.22) return [13, 154, 24];
    if (rough < 0.25 && height > 0.25) return [43, 185, 42];
    return [22, 200, 26];
  }

  function drawFantasyFarms(ctx, size, seed, cities) {
    const rng = mulberry32(seed + 1773);
    const capital = cities[0];
    ctx.save();
    for (let i = 0; i < 80; i += 1) {
      const angle = rng() * Math.PI * 2;
      const distance = capital.r * (1.18 + rng() * 1.05);
      const x = Math.round(capital.x + Math.cos(angle) * distance);
      const y = Math.round(capital.y + Math.sin(angle) * distance);
      if (x < 20 || y < 20 || x > size - 20 || y > size - 20) continue;
      const w = Math.round(size * (0.018 + rng() * 0.035));
      const h = Math.round(size * (0.014 + rng() * 0.030));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((rng() - 0.5) * 0.7);
      ctx.fillStyle = rng() > 0.35 ? "#9d8a52" : "#6f8c47";
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = "rgba(52, 42, 22, 0.52)";
      ctx.lineWidth = 1;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = "rgba(230, 207, 138, 0.36)";
      for (let stripe = -h / 2 + 4; stripe < h / 2; stripe += 6) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 2, stripe);
        ctx.lineTo(w / 2 - 2, stripe);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawFantasyRivers(ctx, size, seed, cities) {
    const rng = mulberry32(seed + 1129);
    const capital = cities?.[0] || { x: size * 0.5, y: size * 0.5, r: size * 0.28 };
    ctx.save();
    ctx.lineCap = "square";
    ctx.strokeStyle = "#376f92";
    ctx.lineWidth = Math.max(16, Math.round(size * 0.024));
    ctx.beginPath();
    ctx.moveTo(-30, Math.round(capital.y - capital.r * 0.55));
    ctx.bezierCurveTo(
      Math.round(size * 0.16),
      Math.round(capital.y - capital.r * 0.35),
      Math.round(size * 0.22),
      Math.round(capital.y + capital.r * 0.72),
      Math.round(capital.x - capital.r * 0.94),
      Math.round(capital.y + capital.r * 0.56)
    );
    ctx.bezierCurveTo(
      Math.round(size * 0.42),
      Math.round(size * 0.78),
      Math.round(size * 0.68),
      Math.round(size * 0.72),
      size + 30,
      Math.round(size * (0.70 + rng() * 0.10))
    );
    ctx.stroke();
    ctx.strokeStyle = "#5a93ad";
    ctx.lineWidth = Math.max(3, Math.round(size * 0.004));
    ctx.stroke();

    for (let i = 0; i < 2; i += 1) {
      ctx.strokeStyle = "#3e7696";
      ctx.lineWidth = Math.max(4, Math.round(size * (0.008 + rng() * 0.004)));
      ctx.beginPath();
      ctx.moveTo(Math.round(size * (0.68 + rng() * 0.16)), -20);
      ctx.bezierCurveTo(size * (0.54 + rng() * 0.12), size * 0.28, size * (0.66 + rng() * 0.10), size * 0.55, size * (0.72 + rng() * 0.16), size + 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  function fantasyCityLayout(seed, size, map) {
    const rng = mulberry32(seed + 503);
    const totalKm2 = Math.max(FANTASY_CITY_MIN_KM2, Number(map.areaKm2) || 35);
    const urbanKm2 = clamp(Number(map.urbanKm2) || FANTASY_CITY_MIN_KM2, FANTASY_CITY_MIN_KM2, totalKm2 * 0.72);
    const capitalRadius = clamp(Math.sqrt((urbanKm2 / totalKm2) / Math.PI), 0.24, 0.36);
    const base = [
      { x: 0.50, y: 0.50, r: capitalRadius, capital: true, urbanKm2 },
      { x: 0.17, y: 0.26, r: 0.055 },
      { x: 0.83, y: 0.25, r: 0.060 },
      { x: 0.18, y: 0.78, r: 0.056 },
      { x: 0.82, y: 0.76, r: 0.058 },
      { x: 0.50, y: 0.12, r: 0.048 },
      { x: 0.52, y: 0.90, r: 0.046 },
      { x: 0.08, y: 0.52, r: 0.040 },
      { x: 0.92, y: 0.52, r: 0.042 },
    ];
    return base.map((city, index) => ({
      ...city,
      x: Math.round(size * clamp(city.x + (rng() - 0.5) * (city.capital ? 0.018 : 0.050), city.capital ? 0.40 : 0.06, city.capital ? 0.60 : 0.94)),
      y: Math.round(size * clamp(city.y + (rng() - 0.5) * (city.capital ? 0.018 : 0.050), city.capital ? 0.40 : 0.06, city.capital ? 0.60 : 0.94)),
      r: Math.round(size * city.r),
      index,
    }));
  }

  function drawFantasyRoads(ctx, size, cities) {
    const capital = cities[0];
    ctx.save();
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    cities.slice(1).forEach((city) => {
      ctx.strokeStyle = "#705c3a";
      ctx.lineWidth = Math.max(4, Math.round(size * 0.009));
      ctx.beginPath();
      ctx.moveTo(capital.x, capital.y);
      ctx.lineTo(Math.round((capital.x + city.x) / 2 + (city.y - capital.y) * 0.04), Math.round((capital.y + city.y) / 2 + (capital.x - city.x) * 0.04));
      ctx.lineTo(city.x, city.y);
      ctx.stroke();
      ctx.strokeStyle = "#c7ad68";
      ctx.lineWidth = Math.max(2, Math.round(size * 0.0035));
      ctx.stroke();
    });
    ctx.strokeStyle = "#bfa466";
    ctx.lineWidth = Math.max(2, Math.round(size * 0.003));
    for (let i = 0; i < 12; i += 1) {
      const angle = i / 12 * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(capital.x, capital.y);
      ctx.lineTo(Math.round(capital.x + Math.cos(angle) * capital.r * 1.18), Math.round(capital.y + Math.sin(angle) * capital.r * 1.02));
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFantasyCity(ctx, size, city, seed) {
    const rng = mulberry32(seed + city.index * 991);
    const r = city.r;
    const x = city.x;
    const y = city.y;
    if (!city.capital) {
      drawFantasySatelliteTown(ctx, city, rng);
      return;
    }

    const rx = r * 1.08;
    const ry = r * 0.86;
    ctx.save();
    ctx.fillStyle = "#6f7469";
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    drawCityDistrictGround(ctx, x, y, rx, ry, rng);
    drawCityRoadNetwork(ctx, x, y, rx, ry, r);
    drawDenseBuildings(ctx, x, y, rx, ry, r, rng);
    drawFantasyHarbor(ctx, x - rx * 0.95, y + ry * 0.35, r, rng);
    drawFantasyCastle(ctx, x, y - ry * 0.52, r, rng);
    drawFantasyCityWalls(ctx, x, y, rx, ry, r);
    ctx.restore();
  }

  function drawFantasySatelliteTown(ctx, city, rng) {
    const r = city.r;
    const x = city.x;
    const y = city.y;
    ctx.save();
    ctx.fillStyle = "#756f5d";
    ctx.fillRect(Math.round(x - r * 0.90), Math.round(y - r * 0.70), Math.round(r * 1.80), Math.round(r * 1.40));
    ctx.strokeStyle = "#d64c24";
    ctx.lineWidth = Math.max(2, Math.round(r * 0.06));
    ctx.strokeRect(Math.round(x - r * 0.86), Math.round(y - r * 0.66), Math.round(r * 1.72), Math.round(r * 1.32));
    ctx.strokeStyle = "#c4a463";
    ctx.lineWidth = Math.max(1, Math.round(r * 0.035));
    ctx.beginPath();
    ctx.moveTo(x - r * 0.74, y);
    ctx.lineTo(x + r * 0.74, y);
    ctx.moveTo(x, y - r * 0.56);
    ctx.lineTo(x, y + r * 0.56);
    ctx.stroke();
    for (let i = 0; i < 90; i += 1) {
      const bx = Math.round(x - r * 0.72 + rng() * r * 1.44);
      const by = Math.round(y - r * 0.52 + rng() * r * 1.04);
      const bw = Math.max(3, Math.round(r * (0.07 + rng() * 0.08)));
      const bh = Math.max(3, Math.round(r * (0.055 + rng() * 0.07)));
      drawFantasyHouse(ctx, bx, by, bw, bh, rng);
    }
    drawFantasyTower(ctx, x - r * 0.84, y - r * 0.64, r * 0.12);
    drawFantasyTower(ctx, x + r * 0.84, y - r * 0.64, r * 0.12);
    drawFantasyTower(ctx, x - r * 0.84, y + r * 0.64, r * 0.12);
    drawFantasyTower(ctx, x + r * 0.84, y + r * 0.64, r * 0.12);
    ctx.restore();
  }

  function drawCityDistrictGround(ctx, x, y, rx, ry, rng) {
    const colors = ["#77786d", "#817d67", "#6d7967", "#88785d", "#686f63"];
    for (let i = 0; i < 18; i += 1) {
      const angle = rng() * Math.PI * 2;
      const distance = Math.sqrt(rng()) * 0.72;
      const cx = x + Math.cos(angle) * rx * distance;
      const cy = y + Math.sin(angle) * ry * distance;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx * (0.20 + rng() * 0.22), ry * (0.13 + rng() * 0.20), rng() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCityRoadNetwork(ctx, x, y, rx, ry, r) {
    ctx.save();
    ctx.strokeStyle = "#bca064";
    ctx.lineWidth = Math.max(3, Math.round(r * 0.018));
    for (const ring of [0.27, 0.48, 0.68, 0.84]) {
      ctx.beginPath();
      ctx.ellipse(x, y, rx * ring, ry * ring, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = Math.max(4, Math.round(r * 0.024));
    for (let i = 0; i < 16; i += 1) {
      const angle = i / 16 * Math.PI * 2;
      const cx = Math.cos(angle);
      const sy = Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(x + cx * rx * 0.13, y + sy * ry * 0.13);
      ctx.lineTo(x + cx * rx * 0.94, y + sy * ry * 0.94);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawDenseBuildings(ctx, x, y, rx, ry, r, rng) {
    const buildingCount = Math.round(clamp(r * r * 0.008, 1200, 3400));
    for (let i = 0; i < buildingCount; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = Math.sqrt(rng()) * 0.90;
      const nx = Math.cos(angle) * radius;
      const ny = Math.sin(angle) * radius;
      const roadBand = Math.abs((radius * 100) % 19 - 9.5);
      if (roadBand < 1.4 || Math.abs(Math.sin(angle * 8)) < 0.035) continue;
      const bx = Math.round(x + nx * rx);
      const by = Math.round(y + ny * ry);
      const bw = Math.max(3, Math.round(r * (0.012 + rng() * 0.021)));
      const bh = Math.max(3, Math.round(r * (0.010 + rng() * 0.018)));
      drawFantasyHouse(ctx, bx, by, bw, bh, rng);
    }

    for (let i = 0; i < 180; i += 1) {
      const angle = rng() * Math.PI * 2;
      const radius = 0.96 + rng() * 0.34;
      const bx = Math.round(x + Math.cos(angle) * rx * radius);
      const by = Math.round(y + Math.sin(angle) * ry * radius);
      const bw = Math.max(3, Math.round(r * (0.010 + rng() * 0.016)));
      const bh = Math.max(3, Math.round(r * (0.009 + rng() * 0.014)));
      drawFantasyHouse(ctx, bx, by, bw, bh, rng, true);
    }
  }

  function drawFantasyHouse(ctx, x, y, w, h, rng, outskirts = false) {
    const palette = outskirts
      ? ["#8a5b34", "#9a6739", "#c09058", "#d6b678"]
      : ["#a85e33", "#be6f39", "#d18a45", "#e2c188", "#b85b2f"];
    ctx.save();
    if (rng() > 0.62) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate((rng() - 0.5) * 0.55);
      x = -w / 2;
      y = -h / 2;
    }
    ctx.fillStyle = "#554c3f";
    ctx.fillRect(Math.round(x + 1), Math.round(y + 1), Math.round(w), Math.round(h));
    ctx.fillStyle = palette[Math.floor(rng() * palette.length)];
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.strokeStyle = "#ff5424";
    ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (w > 7 && h > 5) {
      ctx.fillStyle = "rgba(255, 218, 124, 0.45)";
      ctx.fillRect(Math.round(x + w * 0.18), Math.round(y + h * 0.18), Math.max(1, Math.round(w * 0.18)), 1);
    }
    ctx.restore();
  }

  function drawFantasyCastle(ctx, x, y, r, rng) {
    const w = Math.round(r * 0.58);
    const h = Math.round(r * 0.34);
    ctx.save();
    ctx.fillStyle = "#878372";
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
    ctx.strokeStyle = "#f04b23";
    ctx.lineWidth = Math.max(3, Math.round(r * 0.025));
    ctx.strokeRect(Math.round(x - w / 2), Math.round(y - h / 2), w, h);
    drawFantasyTower(ctx, x - w / 2, y - h / 2, r * 0.08);
    drawFantasyTower(ctx, x + w / 2, y - h / 2, r * 0.08);
    drawFantasyTower(ctx, x - w / 2, y + h / 2, r * 0.08);
    drawFantasyTower(ctx, x + w / 2, y + h / 2, r * 0.08);
    for (let i = 0; i < 36; i += 1) {
      const bx = Math.round(x - w * 0.40 + rng() * w * 0.80);
      const by = Math.round(y - h * 0.28 + rng() * h * 0.56);
      drawFantasyHouse(ctx, bx, by, Math.max(4, r * 0.025), Math.max(4, r * 0.020), rng);
    }
    ctx.restore();
  }

  function drawFantasyHarbor(ctx, x, y, r, rng) {
    ctx.save();
    ctx.fillStyle = "#80653c";
    for (let i = 0; i < 8; i += 1) {
      const px = Math.round(x + i * r * 0.10);
      const py = Math.round(y + (i % 2) * r * 0.05);
      ctx.fillRect(px, py, Math.round(r * 0.06), Math.round(r * 0.34));
      ctx.strokeStyle = "#3d2814";
      ctx.strokeRect(px, py, Math.round(r * 0.06), Math.round(r * 0.34));
    }
    for (let i = 0; i < 18; i += 1) {
      drawFantasyHouse(ctx, x + r * 0.12 + rng() * r * 0.42, y - r * 0.20 + rng() * r * 0.44, r * 0.035, r * 0.026, rng);
    }
    ctx.restore();
  }

  function drawFantasyCityWalls(ctx, x, y, rx, ry, r) {
    ctx.save();
    ctx.strokeStyle = "#ff4b1f";
    ctx.lineWidth = Math.max(5, Math.round(r * 0.035));
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#b13923";
    ctx.lineWidth = Math.max(2, Math.round(r * 0.012));
    ctx.stroke();
    for (let i = 0; i < 28; i += 1) {
      const angle = i / 28 * Math.PI * 2;
      drawFantasyTower(ctx, x + Math.cos(angle) * rx, y + Math.sin(angle) * ry, r * 0.045);
    }
    for (const angle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
      const gx = x + Math.cos(angle) * rx;
      const gy = y + Math.sin(angle) * ry;
      ctx.fillStyle = "#bca064";
      ctx.fillRect(Math.round(gx - r * 0.055), Math.round(gy - r * 0.035), Math.round(r * 0.11), Math.round(r * 0.07));
      ctx.strokeStyle = "#4a2c16";
      ctx.lineWidth = 1;
      ctx.strokeRect(Math.round(gx - r * 0.055), Math.round(gy - r * 0.035), Math.round(r * 0.11), Math.round(r * 0.07));
    }
    ctx.restore();
  }

  function drawFantasyTower(ctx, x, y, s) {
    const size = Math.max(4, Math.round(s));
    ctx.save();
    ctx.fillStyle = "#837a64";
    ctx.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.strokeStyle = "#ff5424";
    ctx.lineWidth = Math.max(1, Math.round(size * 0.16));
    ctx.strokeRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    ctx.fillStyle = "#d9b06a";
    ctx.fillRect(Math.round(x - size * 0.20), Math.round(y - size * 0.20), Math.max(1, Math.round(size * 0.40)), Math.max(1, Math.round(size * 0.40)));
    ctx.restore();
  }

  function drawFantasyOutposts(ctx, size, seed) {
    const rng = mulberry32(seed + 8081);
    ctx.save();
    for (let i = 0; i < 24; i += 1) {
      const x = Math.round(size * (0.05 + rng() * 0.90));
      const y = Math.round(size * (0.05 + rng() * 0.90));
      const s = Math.max(5, Math.round(size * (0.008 + rng() * 0.006)));
      ctx.fillStyle = rng() > 0.35 ? "#7d765b" : "#b6793a";
      ctx.fillRect(x, y, s, s);
      ctx.strokeStyle = "#ff4b1f";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, s, s);
    }
    ctx.restore();
  }

  function fbm(x, y, seed, octaves) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let total = 0;
    for (let i = 0; i < octaves; i += 1) {
      value += valueNoise(x * frequency, y * frequency, seed + i * 1013) * amplitude;
      total += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value / Math.max(0.0001, total);
  }

  function valueNoise(x, y, seed) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = x - x0;
    const ty = y - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const a = hashNoise(x0, y0, seed);
    const b = hashNoise(x0 + 1, y0, seed);
    const c = hashNoise(x0, y0 + 1, seed);
    const d = hashNoise(x0 + 1, y0 + 1, seed);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  }

  function hashNoise(x, y, seed) {
    let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function mulberry32(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6d2b79f5;
      let x = t;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function drawMapGridScreen(ctx) {
    const step = clamp(mapState.settings.gridPx, 16, 512);
    const view = mapState.view;
    const bounds = mapVisibleDrawBounds();
    ctx.save();
    ctx.strokeStyle = "rgba(30, 24, 16, 0.40)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const startX = Math.floor(bounds.x / step) * step;
    const endX = Math.ceil((bounds.x + bounds.w) / step) * step;
    const startY = Math.floor(bounds.y / step) * step;
    const endY = Math.ceil((bounds.y + bounds.h) / step) * step;
    for (let x = startX; x <= endX; x += step) {
      const sx = view.x + x * view.scale;
      ctx.beginPath();
      ctx.moveTo(sx, view.y + bounds.y * view.scale);
      ctx.lineTo(sx, view.y + (bounds.y + bounds.h) * view.scale);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += step) {
      const sy = view.y + y * view.scale;
      ctx.beginPath();
      ctx.moveTo(view.x + bounds.x * view.scale, sy);
      ctx.lineTo(view.x + (bounds.x + bounds.w) * view.scale, sy);
      ctx.stroke();
    }
    ctx.restore();
  }

  function mapVisibleDrawBounds() {
    if (mapState.fantasyMap?.fullWorld && mapState.fantasyMap.floor === mapState.floor) {
      return { ...mapState.fantasyMap.bounds };
    }
    let x1 = 0;
    let y1 = 0;
    let x2 = mapImage.width;
    let y2 = mapImage.height;
    if (mapState.fantasyMap?.bounds && mapState.fantasyMap.floor === mapState.floor) {
      const bounds = mapState.fantasyMap.bounds;
      x1 = Math.min(x1, bounds.x);
      y1 = Math.min(y1, bounds.y);
      x2 = Math.max(x2, bounds.x + bounds.w);
      y2 = Math.max(y2, bounds.y + bounds.h);
    }
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  function mapDrawingBounds() {
    if (mapState.fantasyMap?.fullWorld && mapState.fantasyMap.floor === mapState.floor) {
      return { ...mapState.fantasyMap.bounds };
    }
    return { x: 0, y: 0, w: mapImage.width, h: mapImage.height };
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
      const isVillage = place.village === true;
      const radius = isTibia ? (isSelected ? 6 : 4) : isVillage ? (isSelected ? 7 : 4.5) : (isSelected ? 9 : 7);
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

      if (mapState.settings.showLabels && shouldDrawMapLabel(place, isSelected, isTibia)) {
        drawMarkerLabel(ctx, place, point, isSelected);
      }
    });
  }

  function shouldDrawMapLabel(place, isSelected, isTibia) {
    if (isSelected) return true;
    if (isTibia) return mapState.view.scale > 1.6;
    if (place.custom) return mapState.view.scale > 0.32;
    if (place.village) return mapState.view.scale > 0.55;
    if ((place.rank || 99) <= 7) return mapState.view.scale > 0.10;
    if ((place.rank || 99) <= 14) return mapState.view.scale > 0.22;
    return mapState.view.scale > 0.34;
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

    if (spacePanActive || event.button === 1) {
      startMapPan(screenPoint);
      return;
    }

    if (hit && mapState.tool !== "marker" && mapState.tool !== "paint" && mapState.tool !== "crop") {
      selectMarker(hit.id, false);
      return;
    }

    if (IS_PLAYER_VIEW) {
      startMapPan(screenPoint);
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

    startMapPan(screenPoint);
  }

  function startMapPan(screenPoint) {
    mapState.dragging = true;
    mapState.dragStart = {
      point: screenPoint,
      view: { ...mapState.view },
    };
  }

  function handleMapPointerMove(event) {
    if (!mapState.ready) return;
    const screenPoint = getCanvasPoint(mapCanvas, event);
    if (mapState.dragging && mapState.dragStart) {
      const dx = screenPoint.x - mapState.dragStart.point.x;
      const dy = screenPoint.y - mapState.dragStart.point.y;
      mapState.view.x = mapState.dragStart.view.x + dx;
      mapState.view.y = mapState.dragStart.view.y + dy;
      renderMap();
      return;
    }
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
    const bounds = mapVisibleDrawBounds();
    return {
      x: Math.round(clamp(point.x, bounds.x, bounds.x + bounds.w)),
      y: Math.round(clamp(point.y, bounds.y, bounds.y + bounds.h)),
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
    const bounds = mapVisibleDrawBounds();
    const x1 = clamp(Math.min(crop.start.x, crop.end.x), bounds.x, bounds.x + bounds.w);
    const y1 = clamp(Math.min(crop.start.y, crop.end.y), bounds.y, bounds.y + bounds.h);
    const x2 = clamp(Math.max(crop.start.x, crop.end.x), bounds.x, bounds.x + bounds.w);
    const y2 = clamp(Math.max(crop.start.y, crop.end.y), bounds.y, bounds.y + bounds.h);
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
      <span>Recorte: <strong>${crop.w} x ${crop.h}</strong> pixels do mapa</span>
      <span>Masmorra: <strong>${size.width} x ${size.height}</strong> quadrados</span>
      <span>Plano: <strong>Danubia</strong></span>
    `;
    renderMapImportPreview();
  }

  function sendMapCropToDungeon() {
    if (IS_PLAYER_VIEW) return;
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
      text: `${conversion.profileLabel} - Danubia`,
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
    drawImageIntoCrop(ctx, mapImage, crop, size.width, size.height, { x: 0, y: 0, w: mapImage.width, h: mapImage.height });
    drawFantasyWorldMapNatural(ctx, crop, size.width, size.height);
    if (mapState.settings.importUseMapPaint) {
      rebuildMapEditCacheIfNeeded();
      drawImageIntoCrop(ctx, mapEditCache, crop, size.width, size.height, { x: 0, y: 0, w: mapEditCache.width, h: mapEditCache.height });
    }
    return { canvas, ctx };
  }

  function drawImageIntoCrop(ctx, image, crop, outputWidth, outputHeight, imageBounds) {
    if (!image || !imageBounds?.w || !imageBounds?.h) return;
    const x1 = Math.max(crop.x, imageBounds.x);
    const y1 = Math.max(crop.y, imageBounds.y);
    const x2 = Math.min(crop.x + crop.w, imageBounds.x + imageBounds.w);
    const y2 = Math.min(crop.y + crop.h, imageBounds.y + imageBounds.h);
    const sw = x2 - x1;
    const sh = y2 - y1;
    if (sw <= 0 || sh <= 0) return;
    const dx = (x1 - crop.x) / crop.w * outputWidth;
    const dy = (y1 - crop.y) / crop.h * outputHeight;
    const dw = sw / crop.w * outputWidth;
    const dh = sh / crop.h * outputHeight;
    ctx.drawImage(image, x1 - imageBounds.x, y1 - imageBounds.y, sw, sh, dx, dy, dw, dh);
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
      if (profile === "danubia-auto" && rules.orange === "lava") normalized.orange = defaults.orange;
      if (rules.darkGreen === "rough" && defaults.darkGreen === "forest") normalized.darkGreen = "forest";
      if (!Object.prototype.hasOwnProperty.call(rules, "green") && defaults.green) normalized.green = defaults.green;
    }
    return normalized;
  }

  function normalizeImportProfileId(profile, rules) {
    const aliases = {
      "tibia-auto": "danubia-auto",
      "tibia-dungeon": "danubia-dungeon",
      "tibia-world": "danubia-world",
      "tibia-city": "danubia-city",
    };
    const normalized = aliases[profile] || profile;
    if (!normalized) return "danubia-auto";
    if (normalized === "danubia-dungeon" && rules && !Object.prototype.hasOwnProperty.call(rules, "green")) return "danubia-auto";
    return importProfileDefaults[normalized] ? normalized : "danubia-auto";
  }

  function defaultImportRules(profile) {
    const normalized = normalizeImportProfileId(profile);
    return { ...(importProfileDefaults[normalized] || importProfileDefaults["danubia-auto"]) };
  }

  function importRulesForProfile(profile) {
    if (profile === mapState.settings.importProfile) {
      return normalizeImportRules(mapState.settings.importRules, profile);
    }
    return defaultImportRules(profile);
  }

  function resolveImportProfile(crop, size, ruleCounts) {
    const selectedProfile = normalizeImportProfileId(mapState.settings.importProfile);
    if (selectedProfile !== "danubia-auto") return selectedProfile;
    const total = Math.max(1, size.width * size.height);
    const ratio = (ruleId) => (ruleCounts[ruleId] || 0) / total;
    const greenRatio = ratio("green") + ratio("darkGreen") + ratio("lightGreen");
    const urbanRatio = ratio("orange") + ratio("red") + ratio("stone") + ratio("sand");

    if (crop.floor >= 6 && crop.floor <= 8 && ratio("orange") > 0.035 && urbanRatio > 0.38 && greenRatio > 0.035) {
      return "danubia-city";
    }
    if (ratio("orange") > 0.075 && greenRatio < 0.06) return "danubia-dungeon";
    if (crop.floor >= 6 && crop.floor <= 8) return "danubia-world";
    return "danubia-dungeon";
  }

  function importProfileLabel(profile = mapState.settings.importProfile) {
    const normalized = normalizeImportProfileId(profile);
    return importProfileDefs.find((item) => item.id === normalized)?.label || "Automatico Danubia";
  }

  function resolvedImportProfileLabel(profile) {
    const selectedProfile = normalizeImportProfileId(mapState.settings.importProfile);
    if (selectedProfile === "danubia-auto" && profile !== "danubia-auto") {
      return `${importProfileLabel("danubia-auto")} -> ${importProfileLabel(profile)}`;
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
    if (IS_PLAYER_VIEW) return;
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
    if (IS_PLAYER_VIEW) return;
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
          <div class="marker-type">${escapeHtml(place.type)}</div>
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
      <div class="coords">Mapa ${coords.x}, ${coords.y} | Grid ${gridX}, ${gridY}</div>
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
      <span>${info.fitsMap ? "Cabe no mapa atual." : "Nao cabe inteiro no mapa atual nessa escala."}</span>
    `;
  }

  function downloadMapPng() {
    if (!mapState.ready) return;
    if (mapState.fantasyMap && mapState.fantasyMap.floor === mapState.floor) {
      downloadFantasyWorldMapPng();
      return;
    }
    const scale = 2;
    const offscreen = document.createElement("canvas");
    offscreen.width = mapImage.width * scale;
    offscreen.height = mapImage.height * scale;
    const ctx = offscreen.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(mapImage, 0, 0);
    drawFantasyWorldMapNatural(ctx, { x: 0, y: 0, w: mapImage.width, h: mapImage.height }, mapImage.width, mapImage.height);
    rebuildMapEditCacheIfNeeded();
    ctx.drawImage(mapEditCache, 0, 0);
    if (mapState.settings.showCityFootprint) drawCityFootprintNatural(ctx);
    if (mapState.settings.showGrid) drawMapGridNatural(ctx);
    if (mapState.settings.showRoutes) drawRoutesNatural(ctx);
    if (mapState.settings.showMarkers) drawMarkersNatural(ctx);
    drawMapExportScale(ctx);
    downloadCanvas(offscreen, "danubia-mapa-campanha.png");
  }

  function downloadFantasyWorldMapPng() {
    const bounds = mapState.fantasyMap?.bounds;
    if (!bounds) return;
    const scale = Math.min(2, DUNGEON_EXPORT_MAX_SIDE / Math.max(bounds.w, bounds.h));
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.max(1, Math.round(bounds.w * scale));
    offscreen.height = Math.max(1, Math.round(bounds.h * scale));
    const ctx = offscreen.getContext("2d");
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#171513";
    ctx.fillRect(0, 0, bounds.w, bounds.h);
    drawFantasyWorldMapNatural(ctx, bounds, bounds.w, bounds.h);
    drawMapGridForBoundsNatural(ctx, bounds);
    drawFantasyExportScale(ctx, bounds);
    downloadCanvas(offscreen, "danubia-mapa-gerado-35km2.png");
  }

  function drawMapGridForBoundsNatural(ctx, bounds) {
    const step = clamp(mapState.settings.gridPx, 16, 512);
    ctx.save();
    ctx.translate(-bounds.x, -bounds.y);
    ctx.strokeStyle = "rgba(30, 24, 16, 0.34)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    const startX = Math.floor(bounds.x / step) * step;
    const endX = Math.ceil((bounds.x + bounds.w) / step) * step;
    const startY = Math.floor(bounds.y / step) * step;
    const endY = Math.ceil((bounds.y + bounds.h) / step) * step;
    for (let x = startX; x <= endX; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, bounds.y);
      ctx.lineTo(x, bounds.y + bounds.h);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.beginPath();
      ctx.moveTo(bounds.x, y);
      ctx.lineTo(bounds.x + bounds.w, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFantasyExportScale(ctx, bounds) {
    const metersPerTile = Math.max(0.1, Number(mapState.settings.metersPerTile) || 1.5);
    const km = bounds.w * metersPerTile / 1000;
    const scaleKm = km >= 10 ? 5 : 1;
    const width = scaleKm * 1000 / metersPerTile;
    const x = 34;
    const y = bounds.h - 38;
    ctx.save();
    ctx.fillStyle = "rgba(17, 14, 10, 0.78)";
    ctx.fillRect(x - 10, y - 26, width + 20, 42);
    ctx.strokeStyle = "#ffe0a1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.fillStyle = "#ffe0a1";
    ctx.font = "700 18px Georgia";
    ctx.fillText(`${scaleKm} km`, x, y - 9);
    ctx.restore();
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
    if (IS_PLAYER_VIEW || spacePanActive || event.button === 1) {
      dungeonState.drawing = true;
      dungeonState.panStart = { point, view: { ...dungeonState.view } };
      return;
    }
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
    if (dungeonState.panStart) {
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
    if (IS_PLAYER_VIEW) return;
    const radius = Math.floor((dungeonState.brushSize - 1) / 2);
    for (let y = cell.y - radius; y <= cell.y + radius; y += 1) {
      for (let x = cell.x - radius; x <= cell.x + radius; x += 1) {
        if (inDungeon(x, y)) dungeonState.data.cells[indexFor(x, y)] = dungeonState.tile;
      }
    }
  }

  function applyRoom(start, end) {
    if (IS_PLAYER_VIEW) return;
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
    if (IS_PLAYER_VIEW) return;
    cellsOnLine(start, end).forEach((cell) => {
      if (!inDungeon(cell.x, cell.y)) return;
      paintDungeon({ x: cell.x, y: cell.y });
    });
  }

  function pushDungeonUndo() {
    if (IS_PLAYER_VIEW) return;
    dungeonState.undo.push(JSON.stringify(dungeonState.data));
    if (dungeonState.undo.length > 40) dungeonState.undo.shift();
  }

  function undoDungeon() {
    if (IS_PLAYER_VIEW) return;
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
    if (IS_PLAYER_VIEW) return;
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

  function sendDungeonToMesa() {
    if (!window.MesaCombate?.importDungeonMap) {
      alert("O Grid de batalha ainda nao carregou. Recarregue a pagina e tente novamente.");
      return;
    }
    const { width, height } = dungeonState.data;
    const maxDim = Math.max(width, height, 1);
    const displayCell = clamp(parseInt(dungeonState.exportCellSize, 10) || 64, 32, 96);
    let sourceCell = clamp(Math.floor(8192 / maxDim), 2, 48);
    let imageDataUrl = "";
    while (sourceCell >= 2) {
      const offscreen = document.createElement("canvas");
      offscreen.width = width * sourceCell;
      offscreen.height = height * sourceCell;
      const ctx = offscreen.getContext("2d");
      ctx.fillStyle = "#121110";
      ctx.fillRect(0, 0, offscreen.width, offscreen.height);
      drawDungeonToContext(ctx, {
        x: 0,
        y: 0,
        cell: sourceCell,
        grid: false,
        labels: dungeonState.showLabels,
        gm: dungeonState.showSecrets,
        screen: false,
      });
      imageDataUrl = offscreen.toDataURL("image/png");
      if (imageDataUrl.length < 2600000 || sourceCell <= 2) break;
      sourceCell = Math.max(2, Math.floor(sourceCell * 0.72));
    }
    const ok = window.MesaCombate.importDungeonMap({
      name: `Masmorra ${width} x ${height}`,
      imageDataUrl,
      cols: width,
      rows: height,
      cellPx: displayCell,
    });
    if (!ok) {
      alert("Nao foi possivel enviar esta masmorra para o Grid de batalha.");
      return;
    }
    setActiveMode("mesa", true);
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

  function loadThaisIllustratedCity() {
    cityState.settings.cityId = "thais";
    cityState.settings.name = "Thais";
    cityState.settings.population = 273110;
    cityState.settings.areaKm2 = 35;
    cityState.settings.seed = cityState.settings.seed || "thais-273110";
    cityState.settings.referenceMode = "thais";
    if (!cityState.data || cityState.data.name !== "Thais") generateIllustratedCity();
    applyThaisIllustratedDimensions();
    getThaisIllustratedImage();
    syncCityInputs();
    renderCityLists();
    fitCity();
    persistSoon();
  }

  function applyThaisIllustratedDimensions() {
    if (!cityState.data) return;
    const areaM2 = cityState.settings.areaKm2 * 1000000;
    const widthM = Math.sqrt(areaM2 * THAIS_ILLUSTRATED_ASPECT);
    const heightM = areaM2 / widthM;
    cityState.data.name = "Thais";
    cityState.data.population = cityState.settings.population;
    cityState.data.areaKm2 = cityState.settings.areaKm2;
    cityState.data.widthM = widthM;
    cityState.data.heightM = heightM;
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
    if (manual && building.spriteId && window.CitySprites?.paintSprite) {
      const size = citySpriteStampSize(building);
      const footprint = window.CitySprites.getSpriteFootprint?.(building.spriteId) || { w: 1, h: 1 };
      window.CitySprites.paintSprite(ctx, building.spriteId, -size * footprint.w / 2, -size * footprint.h / 2, size);
      ctx.restore();
      return;
    }
    if (!manual) {
      ctx.fillStyle = "rgba(45, 37, 28, 0.18)";
      ctx.fillRect(-building.w / 2 + building.w * 0.08, -building.h / 2 + building.h * 0.10, building.w, building.h);
    }
    ctx.fillStyle = building.color || buildingColor({ id: "default" }, () => 0.5);
    ctx.fillRect(-building.w / 2, -building.h / 2, building.w, building.h);
    ctx.strokeStyle = manual ? theme.markerStroke : "rgba(37, 32, 25, 0.72)";
    ctx.lineWidth = manual ? 2.6 : 1.8;
    ctx.strokeRect(-building.w / 2, -building.h / 2, building.w, building.h);
    if (building.kind === "house" || building.generated) {
      ctx.fillStyle = "rgba(255, 242, 198, 0.18)";
      ctx.fillRect(-building.w * 0.36, -building.h * 0.38, building.w * 0.72, building.h * 0.16);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
      ctx.lineWidth = Math.max(1, Math.min(building.w, building.h) * 0.04);
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

  function citySpriteStampSize(building) {
    const footprint = window.CitySprites?.getSpriteFootprint?.(building.spriteId) || { w: 1, h: 1 };
    const cellFromWidth = building.w / Math.max(1, footprint.w);
    const cellFromHeight = building.h / Math.max(1, footprint.h);
    return clamp(Math.max(18, Math.min(cellFromWidth, cellFromHeight) * 1.35), 18, 54);
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
    const profile = cityProfile(settings.cityId || settings.name);
    const rng = createRng(`${settings.seed}:${settings.visualStyle}:${settings.densityMode}:${settings.buildingMode}`);
    const areaM2 = settings.areaKm2 * 1000000;
    const aspect = 1.42;
    const widthM = Math.sqrt(areaM2 * aspect);
    const heightM = areaM2 / widthM;
    const coastal = profile.water === "sea-port" || profile.water === "cliff-port" || profile.water === "ice-port";
    const center = { x: widthM * 0.52, y: heightM * (coastal ? 0.42 : 0.50) };
    const wall = buildIllustratedWall(widthM, heightM, center, rng);
    const water = settings.showWater ? buildIllustratedWater(widthM, heightM, rng, profile) : null;
    const river = water?.path || [];
    const districts = buildIllustratedDistricts(widthM, heightM, wall, rng, profile);
    const roads = buildIllustratedRoads(widthM, heightM, wall, districts, rng, profile);
    const fields = buildIllustratedFields(widthM, heightM, wall, rng);
    const trees = buildIllustratedTrees(widthM, heightM, wall, districts, water, rng);
    const blocks = buildIllustratedBlocks(widthM, heightM, wall, districts, rng);
    const buildings = buildIllustratedBuildings(blocks, districts, roads, rng, water);
    const markers = buildIllustratedMarkers(widthM, heightM, wall, center, profile);

    cityState.data = {
      mapVersion: DANUBIA_CITY_MAP_VERSION,
      name: settings.name,
      population: settings.population,
      areaKm2: settings.areaKm2,
      widthM,
      heightM,
      center,
      wall,
      profile,
      water,
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
    const rx = width * 0.455;
    const ry = height * 0.435;
    const points = [];
    const count = 58;
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
      const westPull = Math.cos(angle) < -0.72 ? 0.88 : 1;
      const northRise = Math.sin(angle) < -0.62 ? 0.95 : 1;
      const southPush = Math.sin(angle) > 0.50 ? 1.08 : 1;
      const eastBend = Math.cos(angle) > 0.72 ? 1.03 : 1;
      const jitterScale = 0.96 + rng() * 0.08;
      points.push({
        x: center.x + Math.cos(angle) * rx * jitterScale * westPull * eastBend + Math.sin(angle * 2.7) * width * 0.010,
        y: center.y + Math.sin(angle) * ry * jitterScale * southPush * northRise + Math.cos(angle * 2.2) * height * 0.008,
      });
    }
    const gates = [
      { id: "north", name: "Porta Norte", angle: -Math.PI / 2, type: "Portao" },
      { id: "east", name: "Porta Leste", angle: 0, type: "Portao" },
      { id: "south", name: "Porta Sul", angle: Math.PI / 2, type: "Portao" },
      { id: "west", name: "Porta das Docas", angle: Math.PI, type: "Portao" },
    ].map((gate) => ({
      ...gate,
      x: center.x + Math.cos(gate.angle) * rx * (gate.id === "west" ? 0.83 : 0.98),
      y: center.y + Math.sin(gate.angle) * ry * (gate.id === "south" ? 1.09 : 0.98),
    }));
    return { center, rx, ry, points, gates };
  }

  function buildIllustratedDistricts(width, height, wall, rng, profile = cityProfile()) {
    const c = wall.center;
    if (profile.water === "sea-port" || profile.water === "cliff-port" || profile.water === "ice-port") {
      return [
        makeIllustratedDistrict("castle", "Cidadela Real", c.x - width * 0.01, c.y - height * 0.28, width * 0.25, height * 0.13, -0.02, "#c6beb0", 0.30, 3, rng),
        makeIllustratedDistrict("old", "Centro Antigo", c.x - width * 0.03, c.y - height * 0.02, width * 0.32, height * 0.20, 0.05, "#cdbb98", 0.98, 3, rng),
        makeIllustratedDistrict("market", "Grande Orvalho", c.x + width * 0.02, c.y + height * 0.18, width * 0.25, height * 0.14, -0.04, "#d4c08e", 0.84, 3, rng),
        makeIllustratedDistrict("port", "Porto Real", c.x - width * 0.02, c.y + height * 0.31, width * 0.31, height * 0.12, 0.02, "#b99c7d", 0.78, 3, rng),
        makeIllustratedDistrict("craft", "Oficinas e Docas", c.x - width * 0.23, c.y + height * 0.20, width * 0.23, height * 0.16, -0.10, "#b48b6d", 0.86, 2, rng),
        makeIllustratedDistrict("noble", "Bairro Nobre", c.x + width * 0.24, c.y - height * 0.07, width * 0.24, height * 0.17, -0.12, "#cec3aa", 0.48, 2, rng),
        makeIllustratedDistrict("temple", "Distrito dos Templos", c.x + width * 0.25, c.y + height * 0.15, width * 0.20, height * 0.15, 0.08, "#ddd3ba", 0.42, 2, rng),
        makeIllustratedDistrict("garden", "Jardins Murados", c.x - width * 0.30, c.y - height * 0.12, width * 0.20, height * 0.18, -0.18, "#a8b58f", 0.24, 1, rng),
        makeIllustratedDistrict("outer", "Bairros Externos", c.x + width * 0.19, c.y + height * 0.35, width * 0.31, height * 0.13, -0.08, "#bd9678", 0.72, 1, rng, true),
        makeIllustratedDistrict("south", "Cais Baixo", c.x - width * 0.18, c.y + height * 0.37, width * 0.24, height * 0.08, 0.04, "#c09b7c", 0.56, 1, rng, true),
      ];
    }
    return [
      makeIllustratedDistrict("castle", "Cidadela Real", c.x - width * 0.02, c.y - height * 0.35, width * 0.25, height * 0.13, -0.02, "#c6beb0", 0.30, 3, rng),
      makeIllustratedDistrict("old", "Centro Antigo", c.x - width * 0.05, c.y - height * 0.07, width * 0.30, height * 0.21, 0.08, "#cdbb98", 0.98, 3, rng),
      makeIllustratedDistrict("market", "Mercado Grande", c.x + width * 0.09, c.y + height * 0.15, width * 0.25, height * 0.15, -0.05, "#d4c08e", 0.86, 3, rng),
      makeIllustratedDistrict("port", "Porto e Docas", c.x - width * 0.36, c.y + height * 0.12, width * 0.23, height * 0.25, 0.38, "#b99c7d", 0.86, 2, rng),
      makeIllustratedDistrict("craft", "Oficinas e Forjas", c.x - width * 0.19, c.y + height * 0.28, width * 0.24, height * 0.16, -0.07, "#b48b6d", 0.90, 2, rng),
      makeIllustratedDistrict("noble", "Bairro Nobre", c.x + width * 0.25, c.y - height * 0.18, width * 0.24, height * 0.17, -0.12, "#cec3aa", 0.48, 2, rng),
      makeIllustratedDistrict("temple", "Distrito dos Templos", c.x + width * 0.29, c.y + height * 0.04, width * 0.20, height * 0.15, 0.08, "#ddd3ba", 0.42, 2, rng),
      makeIllustratedDistrict("garden", "Jardins Murados", c.x - width * 0.32, c.y - height * 0.21, width * 0.20, height * 0.18, -0.18, "#a8b58f", 0.24, 1, rng),
      makeIllustratedDistrict("outer", "Bairros Externos", c.x + width * 0.20, c.y + height * 0.36, width * 0.33, height * 0.16, -0.10, "#bd9678", 0.82, 1, rng, true),
      makeIllustratedDistrict("south", "Arrabalde Sul", c.x - width * 0.07, c.y + height * 0.44, width * 0.27, height * 0.12, 0.04, "#c09b7c", 0.74, 1, rng, true),
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

  function buildIllustratedRoads(width, height, wall, districts, rng, profile = cityProfile()) {
    const roads = [];
    const c = wall.center;
    wall.gates.forEach((gate) => {
      const bend = { x: (gate.x + c.x) / 2 + jitter(rng, width * 0.026), y: (gate.y + c.y) / 2 + jitter(rng, height * 0.026) };
      const plaza = { x: c.x + jitter(rng, width * 0.012), y: c.y + jitter(rng, height * 0.012) };
      roads.push({ type: "avenue", name: gate.name, points: [gate, bend, plaza] });
    });
    roads.push({ type: "avenue", name: "Eixo Real", points: [{ x: c.x - width * 0.055, y: c.y - height * 0.36 }, { x: c.x - width * 0.015, y: c.y - height * 0.13 }, c, { x: c.x + width * 0.055, y: c.y + height * 0.28 }] });
    roads.push({ type: "major", name: "Rua das Docas", points: [{ x: c.x - width * 0.36, y: c.y + height * 0.12 }, { x: c.x - width * 0.18, y: c.y + height * 0.10 }, c, { x: c.x + width * 0.27, y: c.y + height * 0.06 }] });
    roads.push({ type: "major", name: "Estrada dos Mercadores", points: [{ x: c.x - width * 0.22, y: c.y + height * 0.28 }, { x: c.x + width * 0.05, y: c.y + height * 0.17 }, { x: c.x + width * 0.35, y: c.y + height * 0.23 }] });
    roads.push({ type: "major", name: "Anel Alto", points: makeRoadArc(c, width * 0.30, height * 0.23, -2.78, 0.12, 26) });
    roads.push({ type: "major", name: "Anel Baixo", points: makeRoadArc(c, width * 0.33, height * 0.27, 0.03, 2.85, 28) });
    districts.forEach((district) => {
      const densityBonus = cityState.settings.densityMode === "high" ? 1 : cityState.settings.densityMode === "medium" ? 1 : 0;
      const localCount = Math.max(2, district.importance + densityBonus + Math.round(district.density * (profile.water === "sea-port" ? 2.2 : 3)));
      for (let i = 0; i < localCount; i += 1) {
        const offset = ((i + 0.5) / localCount - 0.5) * district.ry * 1.42;
        const span = district.rx * (0.62 + rng() * 0.24);
        const a = localToWorld(district.cx, district.cy, district.angle, -span, offset + jitter(rng, district.ry * 0.10));
        const mid = localToWorld(district.cx, district.cy, district.angle, jitter(rng, district.rx * 0.18), offset + jitter(rng, district.ry * 0.16));
        const b = localToWorld(district.cx, district.cy, district.angle, span, offset + jitter(rng, district.ry * 0.10));
        if (pointInPolygon(a, district.polygon) && pointInPolygon(b, district.polygon)) {
          roads.push({ type: district.importance >= 2 && i % 3 === 0 ? "street" : "lane", name: district.name, points: [a, mid, b] });
        }
      }
      const connectors = district.importance >= 2 ? 3 : 2;
      for (let i = 0; i < connectors; i += 1) {
        const angle = (i / connectors) * Math.PI * 2 + district.angle + rng() * 0.55;
        const edge = localToWorld(district.cx, district.cy, district.angle, Math.cos(angle) * district.rx * 0.70, Math.sin(angle) * district.ry * 0.70);
        const mid = { x: (edge.x + c.x) / 2 + jitter(rng, width * 0.018), y: (edge.y + c.y) / 2 + jitter(rng, height * 0.018) };
        if (pointInPolygon(edge, district.polygon)) roads.push({ type: "street", name: district.name, points: [edge, mid, { x: district.cx, y: district.cy }] });
      }
    });
    return roads;
  }

  function makeRoadArc(center, rx, ry, start, end, count) {
    const points = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const angle = start + (end - start) * t;
      points.push({
        x: center.x + Math.cos(angle) * rx,
        y: center.y + Math.sin(angle) * ry,
      });
    }
    return points;
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

  function buildIllustratedWater(width, height, rng, profile) {
    const seaTypes = new Set(["sea-port", "cliff-port", "ice-port"]);
    if (seaTypes.has(profile.water)) {
      const south = profile.portSide !== "west" && profile.portSide !== "east" && profile.portSide !== "north";
      const west = profile.portSide === "west";
      const north = profile.portSide === "north";
      const coast = [];
      if (south) {
        coast.push(
          { x: -width * 0.04, y: height * 0.80 },
          { x: width * 0.14, y: height * 0.78 + jitter(rng, height * 0.012) },
          { x: width * 0.30, y: height * 0.82 + jitter(rng, height * 0.014) },
          { x: width * 0.48, y: height * 0.79 + jitter(rng, height * 0.012) },
          { x: width * 0.66, y: height * 0.82 + jitter(rng, height * 0.014) },
          { x: width * 1.04, y: height * 0.79 },
        );
        return {
          type: "sea",
          side: "south",
          coast,
          polygon: [...coast, { x: width * 1.04, y: height * 1.06 }, { x: -width * 0.04, y: height * 1.06 }],
          docks: makeHarborDocks(width, height, "south", rng),
        };
      }
      if (west) {
        coast.push(
          { x: width * 0.18, y: -height * 0.04 },
          { x: width * 0.13, y: height * 0.22 + jitter(rng, height * 0.014) },
          { x: width * 0.18, y: height * 0.44 + jitter(rng, height * 0.014) },
          { x: width * 0.14, y: height * 0.68 + jitter(rng, height * 0.014) },
          { x: width * 0.19, y: height * 1.04 },
        );
        return {
          type: "sea",
          side: "west",
          coast,
          polygon: [{ x: -width * 0.04, y: -height * 0.04 }, ...coast, { x: -width * 0.04, y: height * 1.06 }],
          docks: makeHarborDocks(width, height, "west", rng),
        };
      }
      if (north) {
        coast.push(
          { x: -width * 0.04, y: height * 0.25 },
          { x: width * 0.22, y: height * 0.20 + jitter(rng, height * 0.014) },
          { x: width * 0.50, y: height * 0.24 + jitter(rng, height * 0.014) },
          { x: width * 0.78, y: height * 0.19 + jitter(rng, height * 0.014) },
          { x: width * 1.04, y: height * 0.24 },
        );
        return {
          type: "sea",
          side: "north",
          coast,
          polygon: [{ x: -width * 0.04, y: -height * 0.04 }, { x: width * 1.04, y: -height * 0.04 }, ...coast.slice().reverse()],
          docks: makeHarborDocks(width, height, "north", rng),
        };
      }
    }
    if (["lake-swamp", "forest-lake", "oasis"].includes(profile.water)) {
      const cx = profile.water === "oasis" ? width * 0.22 : width * 0.18;
      const cy = profile.water === "oasis" ? height * 0.70 : height * 0.62;
      return { type: "lake", cx, cy, rx: width * 0.085, ry: height * 0.075, path: [] };
    }
    if (profile.water === "none") return null;
    return { type: "river", path: buildIllustratedRiver(width, height, rng) };
  }

  function makeHarborDocks(width, height, side, rng) {
    const docks = [];
    const count = side === "south" ? 8 : 6;
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count;
      if (side === "south") {
        docks.push({ x: width * (0.30 + t * 0.36) + jitter(rng, width * 0.01), y: height * (0.800 + rng() * 0.018), length: height * (0.08 + rng() * 0.045), angle: Math.PI / 2 + jitter(rng, 0.08) });
      } else if (side === "west") {
        docks.push({ x: width * (0.145 + rng() * 0.025), y: height * (0.30 + t * 0.38), length: width * (0.08 + rng() * 0.05), angle: Math.PI + jitter(rng, 0.08) });
      } else {
        docks.push({ x: width * (0.30 + t * 0.36) + jitter(rng, width * 0.01), y: height * (0.215 + rng() * 0.02), length: height * (0.08 + rng() * 0.05), angle: -Math.PI / 2 + jitter(rng, 0.08) });
      }
    }
    return docks;
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

  function buildIllustratedTrees(width, height, wall, districts, water, rng) {
    const trees = [];
    const garden = districts.find((district) => district.id === "garden");
    const river = water?.path || [];
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
      if (pointInIllustratedWater({ x, y }, water)) continue;
      trees.push({ x, y, r: 13 + rng() * 16, color: rng() < 0.5 ? "#496c55" : "#5f795f" });
    }
    return trees;
  }

  function buildIllustratedBlocks(width, height, wall, districts, rng) {
    const blocks = [];
    districts.forEach((district) => {
      const baseW = district.id === "old" ? 185 : district.id === "market" ? 210 : district.id === "noble" ? 260 : 225;
      const baseH = district.id === "old" ? 130 : district.id === "port" ? 165 : 150;
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

  function buildIllustratedBuildings(blocks, districts, roads, rng, water) {
    if (cityState.settings.buildingMode === "hidden") return [];
    const buildings = [];
    const density = cityDensityFactor();
    const blockMode = cityState.settings.buildingMode === "blocks";
    blocks.forEach((block) => {
      if (block.plaza) return;
      const district = districts.find((item) => item.id === block.districtId) || districts[0];
      const lotW = blockMode ? 96 : district.id === "old" ? 44 : 56;
      const lotH = blockMode ? 68 : district.id === "old" ? 34 : 42;
      const cols = clamp(Math.floor(block.w / lotW), 1, blockMode ? 3 : 8);
      const rows = clamp(Math.floor(block.h / lotH), 1, blockMode ? 3 : 6);
      const chance = clamp(district.density * density, 0.15, 0.96);
      for (let cx = 0; cx < cols; cx += 1) {
        for (let cy = 0; cy < rows; cy += 1) {
          if (rng() > chance) continue;
          const lx = -block.w / 2 + (cx + 0.5) * (block.w / cols) + jitter(rng, block.w / cols * 0.12);
          const ly = -block.h / 2 + (cy + 0.5) * (block.h / rows) + jitter(rng, block.h / rows * 0.12);
          const p = localToWorld(block.x, block.y, block.angle, lx, ly);
          if (pointInIllustratedWater(p, water)) continue;
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
    const cap = cityState.settings.densityMode === "high" ? 6800 : cityState.settings.densityMode === "medium" ? 4600 : 2800;
    return buildings.slice(0, cap);
  }

  function pointInIllustratedWater(point, water) {
    if (!point || !water) return false;
    if (water.type === "sea" && water.polygon?.length) return pointInPolygon(point, water.polygon);
    if (water.type === "lake") {
      const dx = (point.x - water.cx) / Math.max(1, water.rx);
      const dy = (point.y - water.cy) / Math.max(1, water.ry);
      return dx * dx + dy * dy <= 1;
    }
    if (water.type === "river" && water.path?.length) return distanceToPolyline(point, water.path) < 115;
    return false;
  }

  function buildIllustratedMarkers(width, height, wall, center, profile = cityProfile()) {
    const gate = (id) => wall.gates.find((item) => item.id === id) || center;
    const coastal = profile.water === "sea-port" || profile.water === "cliff-port" || profile.water === "ice-port";
    return [
      { name: profile.id === "thais" ? "Castelo de Thais" : "Cidadela Principal", type: "Poder", x: center.x - width * 0.02, y: center.y - height * 0.31, importance: 3 },
      { name: "Grande Orvalho", type: "Praca", x: center.x, y: center.y, importance: 3 },
      { name: "Docas Reais", type: "Porto", x: coastal ? center.x - width * 0.03 : center.x - width * 0.30, y: coastal ? center.y + height * 0.31 : center.y + height * 0.15, importance: 2 },
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
    if (isThaisIllustratedMode()) {
      applyThaisIllustratedDimensions();
      drawThaisIllustratedCityToContext(cityCtx, cityState.view.x, cityState.view.y, cityState.view.scale, true);
      updateCityReadouts();
      return;
    }
    drawIllustratedCityToContext(cityCtx, cityState.view.x, cityState.view.y, cityState.view.scale, true);
    updateCityReadouts();
  }

  function isThaisIllustratedMode() {
    return cityState.settings.referenceMode === "thais";
  }

  function getThaisIllustratedImage() {
    if (thaisIllustratedImage) return thaisIllustratedImage;
    thaisIllustratedImage = new Image();
    thaisIllustratedImage.onload = () => {
      if (activeMode === "city" && isThaisIllustratedMode()) renderCity();
    };
    thaisIllustratedImage.onerror = () => {
      if (activeMode === "city" && isThaisIllustratedMode()) {
        drawCenteredText(cityCtx, cityCanvas.width, cityCanvas.height, "Nao encontrei thais.jpg na pasta Danubia.");
      }
    };
    thaisIllustratedImage.src = THAIS_ILLUSTRATED_SRC;
    return thaisIllustratedImage;
  }

  function drawThaisIllustratedCityToContext(ctx, offsetX, offsetY, scale, screen) {
    const data = cityState.data;
    const theme = cityTheme();
    const image = getThaisIllustratedImage();
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    ctx.fillStyle = theme.land;
    ctx.fillRect(0, 0, data.widthM, data.heightM);
    if (image.complete && image.naturalWidth > 0) {
      const imageAspect = image.naturalWidth / image.naturalHeight;
      let drawW = data.widthM;
      let drawH = drawW / imageAspect;
      if (drawH > data.heightM) {
        drawH = data.heightM;
        drawW = drawH * imageAspect;
      }
      const drawX = (data.widthM - drawW) / 2;
      const drawY = (data.heightM - drawH) / 2;
      ctx.drawImage(image, drawX, drawY, drawW, drawH);
      ctx.strokeStyle = "rgba(34, 30, 24, 0.72)";
      ctx.lineWidth = 12 / Math.max(scale, 0.1);
      ctx.strokeRect(drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = "rgba(38, 34, 28, 0.16)";
      ctx.fillRect(0, 0, data.widthM, data.heightM);
    }
    drawCityManualTerrain(ctx, data);
    drawCityManualRoads(ctx, data);
    if (cityState.settings.showBuildings) drawCityManualBuildings(ctx, data);
    if (cityState.settings.showMarkers) drawIllustratedMarkers(ctx, { ...data, markers: [] }, scale, screen, theme);
    if (cityState.settings.showGrid) drawCityGrid(ctx, data, scale, screen);
    ctx.restore();
    if (screen) {
      if (!(image.complete && image.naturalWidth > 0)) drawCenteredText(ctx, cityCanvas.width, cityCanvas.height, "Carregando Thais ilustrada...");
      drawIllustratedCityScaleBar(ctx, theme);
    }
  }

  function drawIllustratedCityToContext(ctx, offsetX, offsetY, scale, screen) {
    const data = cityState.data;
    const theme = cityTheme();
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    drawIllustratedTerrain(ctx, data, theme);
    if (cityState.settings.showFields) drawIllustratedFields(ctx, data, theme);
    if (cityState.settings.showWater && (data.water || data.river?.length)) drawIllustratedWater(ctx, data, theme);
    drawIllustratedTrees(ctx, data, theme, false);
    drawIllustratedDistricts(ctx, data, theme);
    drawIllustratedBlocks(ctx, data, theme);
    drawCityManualTerrain(ctx, data);
    drawIllustratedRoads(ctx, data, theme);
    drawCityManualRoads(ctx, data);
    if (cityState.settings.showWalls) drawIllustratedWalls(ctx, data, theme);
    if (cityState.settings.showBuildings && cityState.settings.buildingMode !== "hidden") drawIllustratedBuildings(ctx, data, theme);
    if (cityState.settings.showBuildings && cityState.settings.buildingMode === "symbols" && window.CitySprites?.paintCitySprites) {
      window.CitySprites.paintCitySprites(ctx, data, { screen, scale, seed: cityState.settings.seed });
    }
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
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 22; i += 1) {
      const y = (i / 21) * data.heightM;
      ctx.beginPath();
      for (let x = -60; x <= data.widthM + 60; x += 230) {
        const py = y + Math.sin(x * 0.0014 + i * 0.72) * 28;
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

  function drawIllustratedWater(ctx, data, theme) {
    if (data.water?.type === "sea") {
      ctx.save();
      drawClosedPolygon(ctx, data.water.polygon);
      ctx.fillStyle = theme.water;
      ctx.fill();
      ctx.strokeStyle = theme.waterEdgeDark;
      ctx.lineWidth = 18;
      drawPolyline(ctx, data.water.coast);
      ctx.stroke();
      ctx.strokeStyle = theme.waterEdge;
      ctx.lineWidth = 9;
      drawPolyline(ctx, data.water.coast);
      ctx.stroke();
      ctx.strokeStyle = theme.waterLine;
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i += 1) {
        const offset = (i + 1) * 34;
        const shifted = data.water.coast.map((point) => ({
          x: point.x,
          y: data.water.side === "north" ? point.y - offset : point.y + offset,
        }));
        ctx.globalAlpha = 0.24;
        drawPolyline(ctx, shifted);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      data.water.docks?.forEach((dock) => drawHarborDock(ctx, dock, theme));
      ctx.restore();
      return;
    }
    if (data.water?.type === "lake") {
      ctx.save();
      ctx.fillStyle = theme.water;
      ctx.strokeStyle = theme.waterEdgeDark;
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.ellipse(data.water.cx, data.water.cy, data.water.rx, data.water.ry, -0.12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = theme.waterLine;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(data.water.cx, data.water.cy, data.water.rx * 0.70, data.water.ry * 0.62, -0.12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }
    if (data.river?.length) drawIllustratedRiver(ctx, data, theme);
  }

  function drawHarborDock(ctx, dock, theme) {
    ctx.save();
    ctx.translate(dock.x, dock.y);
    ctx.rotate(dock.angle);
    ctx.fillStyle = "#9c7650";
    ctx.strokeStyle = theme.wallInk;
    ctx.lineWidth = 3;
    roundedRect(ctx, -10, -dock.length * 0.08, 20, dock.length, 4);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(61, 43, 26, 0.42)";
    ctx.lineWidth = 1.4;
    for (let y = 8; y < dock.length - 8; y += 20) {
      ctx.beginPath();
      ctx.moveTo(-8, y);
      ctx.lineTo(8, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawIllustratedDistricts(ctx, data, theme) {
    data.districts?.forEach((district) => {
      ctx.save();
      ctx.fillStyle = district.color;
      ctx.globalAlpha = 0.11;
      drawClosedPolygon(ctx, district.polygon);
      ctx.fill();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = theme.districtLine;
      ctx.lineWidth = 1;
      drawClosedPolygon(ctx, district.polygon);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawIllustratedBlocks(ctx, data, theme) {
    data.blocks?.forEach((block) => {
      if (pointInIllustratedWater(block, data.water)) return;
      ctx.save();
      ctx.translate(block.x, block.y);
      ctx.rotate(block.angle || 0);
      ctx.fillStyle = block.plaza ? theme.plaza : theme.blockFill;
      ctx.strokeStyle = block.plaza ? theme.plazaLine : theme.blockLine;
      ctx.globalAlpha = block.plaza ? 0.92 : 0.22;
      roundedRect(ctx, -block.w / 2, -block.h / 2, block.w, block.h, Math.min(18, block.w * 0.08));
      ctx.fill();
      ctx.globalAlpha = block.plaza ? 0.92 : 0.28;
      ctx.lineWidth = block.plaza ? 2.4 : 0.9;
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
    ctx.save();
    if (data.wall?.points?.length) {
      drawClosedPolygon(ctx, data.wall.points);
      ctx.clip();
    }
    data.roads?.forEach((road) => {
      const width = roadWidth(road);
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = road.type === "lane" ? 0.32 : road.type === "street" ? 0.58 : 0.92;
      ctx.strokeStyle = theme.roadBorder;
      ctx.lineWidth = width + 5;
      drawPolyline(ctx, road.points);
      ctx.stroke();
      ctx.strokeStyle = road.type === "avenue" ? theme.avenue : road.type === "major" ? theme.road : theme.lane;
      ctx.lineWidth = width;
      drawPolyline(ctx, road.points);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
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
    const titleSize = Math.max(120, data.heightM * 0.062);
    const subtitleSize = Math.max(38, data.heightM * 0.019);
    const x = data.widthM * 0.045;
    const y = data.heightM * 0.035;
    ctx.globalAlpha = 0.78;
    ctx.fillStyle = "rgba(232, 219, 188, 0.58)";
    roundedRect(ctx, x - data.widthM * 0.016, y - data.heightM * 0.010, data.widthM * 0.245, data.heightM * 0.115, data.heightM * 0.012);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(74, 60, 41, 0.44)";
    ctx.lineWidth = Math.max(3, data.heightM * 0.0013);
    roundedRect(ctx, x - data.widthM * 0.016, y - data.heightM * 0.010, data.widthM * 0.245, data.heightM * 0.115, data.heightM * 0.012);
    ctx.stroke();
    ctx.fillStyle = theme.ink;
    ctx.strokeStyle = theme.titleStroke;
    ctx.lineWidth = 7;
    ctx.font = `900 ${titleSize}px Cinzel, Georgia`;
    ctx.textBaseline = "top";
    ctx.strokeText(data.name, x, y);
    ctx.fillText(data.name, x, y);
    ctx.font = `700 ${subtitleSize}px Georgia`;
    ctx.fillText(`Pop. ${data.population.toLocaleString("pt-BR")} | ${data.areaKm2} km2`, x + data.widthM * 0.005, y + titleSize * 0.86);
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
        outside: "#d6c7a6", land: "#d8c9a9", ink: "#252019", label: "#2e2920", labelHalo: "rgba(230, 218, 187, 0.92)", titleStroke: "rgba(234, 223, 194, 0.9)",
        contour: "rgba(80, 72, 58, 0.085)", districtLine: "rgba(63, 54, 40, 0.16)", blockFill: "#cbbb9d", blockLine: "rgba(49, 42, 32, 0.18)", plaza: "#dfd0ae", plazaLine: "#6d5d42",
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
        outside: "#aebc9e", land: "#acbc9d", ink: "#25231f", label: "#2c2821", labelHalo: "rgba(214, 222, 199, 0.88)", titleStroke: "rgba(222, 230, 204, 0.88)",
        contour: "rgba(245, 249, 231, 0.10)", districtLine: "rgba(43, 50, 35, 0.15)", blockFill: "#bdb59f", blockLine: "rgba(45, 42, 34, 0.17)", plaza: "#d4c9a8", plazaLine: "#655a3f",
        roadBorder: "#4b4a3e", avenue: "#f1ecd8", road: "#e2d8bd", lane: "#cec5ad", water: "#7fb3bf", waterEdge: "#d9dec8", waterEdgeDark: "#527986", waterLine: "rgba(239, 250, 247, 0.34)",
        fieldLine: "rgba(47, 58, 37, 0.24)", tree: "#5d7667", treeInk: "#314b3d", wallOuter: "#282a27", wallInner: "#aaa58d", wallInk: "#1c1c1a", markerStroke: "#f1dfaa",
        scaleInk: "#222018", scaleLight: "#f1dfaa", paperGrain: false,
      },
    };
    return themes[cityState.settings.visualStyle] || themes.green;
  }

  function cityDensityFactor() {
    return { low: 0.58, medium: 0.78, high: 1.0 }[cityState.settings.densityMode] || 0.78;
  }

  function roadWidth(road) {
    return road.type === "avenue" ? 34 : road.type === "major" ? 22 : road.type === "street" ? 11 : 5;
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
    if (IS_PLAYER_VIEW || spacePanActive || event.button === 1) {
      startCityPan(event);
      return;
    }
    if (event.button !== 0 || event.shiftKey || cityState.settings.tool === "pan") {
      startCityPan(event);
      return;
    }
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
    startCityPan(event);
  }

  function startCityPan(event) {
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
    if (IS_PLAYER_VIEW) return;
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
    if (IS_PLAYER_VIEW) {
      cityState.drawing = false;
      cityState.currentStroke = null;
      cityState.lastStamp = null;
      return;
    }
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
    if (IS_PLAYER_VIEW) return;
    if (!cityState.data) return;
    ensureCityManual(cityState.data);
    const spec = cityBuildingSpec(cityState.settings.buildingKind);
    const selectedSpriteId = window.CitySprites?.getSelectedSprite?.();
    const selectedSprite = window.CitySprites?.getSpriteMeta?.(selectedSpriteId);
    const building = {
      id: `city-building-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      kind: cityState.settings.buildingKind,
      x: clamp(point.x, 0, cityState.data.widthM),
      y: clamp(point.y, 0, cityState.data.heightM),
      w: spec.w,
      h: spec.h,
      color: spec.color,
      rotation: spec.rotation,
      spriteId: selectedSprite && selectedSprite.group !== "terrain" ? selectedSpriteId : null,
    };
    cityState.data.manual.buildings.push(building);
    pushCityAction({ action: "add", type: "buildings", item: building });
    renderCity();
    renderCityLists();
    persistSoon();
  }

  function addCityMarker(point) {
    if (IS_PLAYER_VIEW) return;
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
    if (IS_PLAYER_VIEW) return;
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
    if (IS_PLAYER_VIEW) return;
    cityState.undo.push(action);
    cityState.redo = [];
    if (cityState.undo.length > 80) cityState.undo.shift();
  }

  function undoCityEdit() {
    if (IS_PLAYER_VIEW) return;
    const action = cityState.undo.pop();
    if (!action || !cityState.data) return;
    applyCityAction(action, true);
    cityState.redo.push(action);
    renderCity();
    renderCityLists();
    persistSoon();
  }

  function redoCityEdit() {
    if (IS_PLAYER_VIEW) return;
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
    if (isThaisIllustratedMode()) {
      const image = getThaisIllustratedImage();
      if (!(image.complete && image.naturalWidth > 0)) {
        alert("A imagem thais.jpg ainda esta carregando. Tente baixar de novo em alguns segundos.");
        return;
      }
      drawThaisIllustratedCityToContext(ctx, 0, 0, width / cityState.data.widthM, false);
    } else {
      drawIllustratedCityToContext(ctx, 0, 0, width / cityState.data.widthM, false);
    }
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
          <div class="label-position">${formatDistrictSize(district)}</div>
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

  function formatDistrictSize(district) {
    const width = Number.isFinite(district.w) ? district.w : Number.isFinite(district.rx) ? district.rx * 2 : 0;
    const height = Number.isFinite(district.h) ? district.h : Number.isFinite(district.ry) ? district.ry * 2 : 0;
    return `${Math.round(width)} x ${Math.round(height)} m`;
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
      dirt: { color: "#8d6842", alpha: 0.86 },
      swamp: { color: "#54683f", alpha: 0.88 },
      snow: { color: "#dfe5e8", alpha: 0.86 },
      lava: { color: "#bb3d1f", alpha: 0.9 },
      acid: { color: "#83bd48", alpha: 0.88 },
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

  function isTypingTarget(target) {
    const tag = target?.tagName?.toLowerCase();
    return tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable;
  }

  function handleKeyboard(event) {
    if (IS_PLAYER_VIEW) return;
    if (event.code === "Space" && !isTypingTarget(event.target)) {
      if (!spacePanActive) {
        spacePanActive = true;
        document.body.classList.add("space-pan-active");
        updateCityManualControls();
      }
      event.preventDefault();
      return;
    }
    if (isTypingTarget(event.target)) return;
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

  function handleKeyboardUp(event) {
    if (event.code !== "Space") return;
    spacePanActive = false;
    document.body.classList.remove("space-pan-active");
    updateCityManualControls();
  }

  function generateStructuredDungeon() {
    const width = clamp(parseInt($("#dungeonWidth").value, 10) || dungeonState.data.width || 40, 5, DUNGEON_MAX_SIZE);
    const height = clamp(parseInt($("#dungeonHeight").value, 10) || dungeonState.data.height || 30, 5, DUNGEON_MAX_SIZE);
    const options = {
      layout: $("#dungeonLayout")?.value || "classic",
      density: $("#dungeonRoomDensity")?.value || "normal",
      corridor: $("#dungeonCorridorStyle")?.value || "errant",
      doors: $("#dungeonAddDoors")?.checked ?? true,
      secrets: $("#dungeonAddSecrets")?.checked ?? true,
      stairs: $("#dungeonAddStairs")?.checked ?? true,
    };
    pushDungeonUndo();
    dungeonState.data = buildStructuredDungeon(width, height, options);
    dungeonState.mode = "pan";
    $$("[data-dungeon-mode]").forEach((item) => item.classList.toggle("active", item.dataset.dungeonMode === "pan"));
    syncDungeonInputs();
    fitDungeon();
    persistSoon();
    renderDungeon();
    renderLabelList();
  }

  function buildStructuredDungeon(width, height, options) {
    const rng = createRng(`${cityState.settings.seed}:${Date.now()}:${width}x${height}:${options.layout}:${options.density}:${options.corridor}`);
    const dungeon = createDungeon(width, height);
    dungeon.cells.fill("wall");
    const idx = (x, y) => y * width + x;
    const set = (x, y, tile) => {
      if (x >= 1 && y >= 1 && x < width - 1 && y < height - 1) dungeon.cells[idx(x, y)] = tile;
    };
    const get = (x, y) => (x >= 0 && y >= 0 && x < width && y < height ? dungeon.cells[idx(x, y)] : "wall");
    const rooms = [];
    const area = width * height;
    const densityFactor = { sparse: 0.72, normal: 1, dense: 1.34 }[options.density] || 1;
    const targetRooms = clamp(Math.round(Math.sqrt(area) * densityFactor * (options.layout === "compact" ? 0.82 : options.layout === "sprawl" ? 1.18 : 1)), 5, 90);
    const maxAttempts = targetRooms * 20;
    for (let attempt = 0; attempt < maxAttempts && rooms.length < targetRooms; attempt += 1) {
      const roomW = clamp(Math.floor(4 + rng() * (options.layout === "compact" ? 8 : 13)), 4, Math.max(4, Math.floor(width * 0.18)));
      const roomH = clamp(Math.floor(4 + rng() * (options.layout === "compact" ? 7 : 11)), 4, Math.max(4, Math.floor(height * 0.18)));
      const x = 2 + Math.floor(rng() * Math.max(1, width - roomW - 4));
      const y = 2 + Math.floor(rng() * Math.max(1, height - roomH - 4));
      const room = { x, y, w: roomW, h: roomH, cx: Math.floor(x + roomW / 2), cy: Math.floor(y + roomH / 2) };
      if (rooms.some((other) => rectsOverlap(room, other, options.layout === "compact" ? 2 : 4))) continue;
      carveRoom(dungeon, room, set);
      rooms.push(room);
    }
    if (!rooms.length) {
      const room = { x: 2, y: 2, w: Math.max(3, width - 4), h: Math.max(3, height - 4), cx: Math.floor(width / 2), cy: Math.floor(height / 2) };
      carveRoom(dungeon, room, set);
      rooms.push(room);
    }

    rooms.sort((a, b) => a.cx - b.cx || a.cy - b.cy);
    const connected = [rooms[0]];
    const remaining = rooms.slice(1);
    while (remaining.length) {
      let best = { score: Infinity, from: connected[0], index: 0 };
      remaining.forEach((room, index) => {
        connected.forEach((from) => {
          const score = Math.abs(room.cx - from.cx) + Math.abs(room.cy - from.cy) + rng() * (options.layout === "sprawl" ? 12 : 5);
          if (score < best.score) best = { score, from, index };
        });
      });
      const room = remaining.splice(best.index, 1)[0];
      carveCorridor(dungeon, best.from, room, set, options, rng);
      connected.push(room);
    }

    const extraLinks = options.layout === "sprawl" ? Math.floor(rooms.length * 0.42) : options.layout === "compact" ? Math.floor(rooms.length * 0.18) : Math.floor(rooms.length * 0.28);
    for (let i = 0; i < extraLinks; i += 1) {
      const a = rooms[Math.floor(rng() * rooms.length)];
      const b = rooms[Math.floor(rng() * rooms.length)];
      if (a && b && a !== b) carveCorridor(dungeon, a, b, set, options, rng);
    }

    if (options.layout === "cavern") roughenDungeonCaves(dungeon, set, get, rng);
    if (options.doors) addStructuredDoors(dungeon, rooms, set, get, rng);
    if (options.secrets) addStructuredSecretsAndTreasure(dungeon, rooms, set, get, rng);
    if (options.stairs) addStructuredStairs(dungeon, rooms, set);
    dungeon.labels = buildStructuredDungeonLabels(rooms, options);
    return dungeon;
  }

  function rectsOverlap(a, b, pad = 1) {
    return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
  }

  function carveRoom(dungeon, room, set) {
    for (let y = room.y; y < room.y + room.h; y += 1) {
      for (let x = room.x; x < room.x + room.w; x += 1) set(x, y, "floor");
    }
  }

  function carveCorridor(dungeon, a, b, set, options, rng) {
    let x = a.cx;
    let y = a.cy;
    const turnFirst = options.corridor === "straight" ? rng() < 0.5 : rng() < 0.68;
    const wander = options.corridor === "labyrinth" ? 0.30 : options.corridor === "errant" ? 0.16 : 0.04;
    const stepX = () => {
      if (x === b.cx) return;
      x += x < b.cx ? 1 : -1;
      set(x, y, "floor");
      if (rng() < wander) set(x, y + (rng() < 0.5 ? 1 : -1), "floor");
    };
    const stepY = () => {
      if (y === b.cy) return;
      y += y < b.cy ? 1 : -1;
      set(x, y, "floor");
      if (rng() < wander) set(x + (rng() < 0.5 ? 1 : -1), y, "floor");
    };
    const safety = dungeon.width + dungeon.height + 20;
    for (let i = 0; i < safety && (x !== b.cx || y !== b.cy); i += 1) {
      if (turnFirst) {
        if (x !== b.cx) stepX();
        else stepY();
      } else if (y !== b.cy) stepY();
      else stepX();
      if (options.corridor === "labyrinth" && rng() < 0.10) {
        for (let n = 0; n < 2 + Math.floor(rng() * 5); n += 1) (rng() < 0.5 ? stepX : stepY)();
      }
    }
  }

  function roughenDungeonCaves(dungeon, set, get, rng) {
    for (let y = 2; y < dungeon.height - 2; y += 1) {
      for (let x = 2; x < dungeon.width - 2; x += 1) {
        if (get(x, y) !== "floor") continue;
        if (rng() < 0.22) set(x + (rng() < 0.5 ? 1 : -1), y + (rng() < 0.5 ? 1 : -1), "floor");
        if (rng() < 0.08) set(x, y, "rough");
      }
    }
  }

  function addStructuredDoors(dungeon, rooms, set, get, rng) {
    rooms.forEach((room) => {
      const candidates = [];
      for (let x = room.x; x < room.x + room.w; x += 1) {
        [{ x, y: room.y - 1 }, { x, y: room.y + room.h }].forEach((p) => {
          if (get(p.x, p.y) === "floor") candidates.push({ x, y: p.y === room.y - 1 ? room.y : room.y + room.h - 1 });
        });
      }
      for (let y = room.y; y < room.y + room.h; y += 1) {
        [{ x: room.x - 1, y }, { x: room.x + room.w, y }].forEach((p) => {
          if (get(p.x, p.y) === "floor") candidates.push({ x: p.x === room.x - 1 ? room.x : room.x + room.w - 1, y });
        });
      }
      candidates.sort(() => rng() - 0.5).slice(0, 2).forEach((p) => set(p.x, p.y, "door"));
    });
  }

  function addStructuredSecretsAndTreasure(dungeon, rooms, set, get, rng) {
    rooms.forEach((room, index) => {
      if (index > 0 && rng() < 0.15) set(room.x + Math.floor(rng() * room.w), room.y + Math.floor(rng() * room.h), "chest");
      if (rng() < 0.10) set(room.x + Math.floor(rng() * room.w), room.y + Math.floor(rng() * room.h), "trap");
      if (rng() < 0.10) {
        const side = Math.floor(rng() * 4);
        const x = side < 2 ? room.x + Math.floor(rng() * room.w) : side === 2 ? room.x : room.x + room.w - 1;
        const y = side >= 2 ? room.y + Math.floor(rng() * room.h) : side === 0 ? room.y : room.y + room.h - 1;
        set(x, y, "secret");
      }
    });
  }

  function addStructuredStairs(dungeon, rooms, set) {
    const first = rooms[0];
    const last = rooms[rooms.length - 1] || first;
    set(first.cx, first.cy, "stairs");
    set(last.cx, last.cy, "stairs");
  }

  function buildStructuredDungeonLabels(rooms, options) {
    const important = rooms
      .map((room, index) => ({ room, area: room.w * room.h, index }))
      .sort((a, b) => b.area - a.area)
      .slice(0, 8);
    const names = options.layout === "cavern"
      ? ["Entrada Natural", "Galeria Umida", "Fosso Antigo", "Ninho", "Lago Subterraneo", "Veio Mineral", "Camara Ecoante", "Saida Baixa"]
      : ["Entrada", "Sala de Guarda", "Salao Principal", "Deposito", "Santuario", "Tesouraria", "Cela", "Escada Inferior"];
    return important.map((item, index) => ({
      id: `label-${Date.now()}-${index}`,
      x: item.room.cx,
      y: item.room.cy,
      text: names[index] || `Sala ${index + 1}`,
      secret: index > 4,
    }));
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
    if (Number.isFinite(place.coordX) && Number.isFinite(place.coordY)) return { x: place.coordX, y: place.coordY };
    const bounds = mapDrawingBounds();
    return { x: bounds.x + place.rx * bounds.w, y: bounds.y + place.ry * bounds.h };
  }

  function placeCoords(place) {
    if (Number.isFinite(place.coordX) && Number.isFinite(place.coordY)) {
      return { x: place.coordX, y: place.coordY };
    }
    const point = placePoint(place);
    return {
      x: Math.round(point.x),
      y: Math.round(point.y),
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
    const bounds = mapVisibleDrawBounds();
    return point.x >= bounds.x && point.y >= bounds.y && point.x <= bounds.x + bounds.w && point.y <= bounds.y + bounds.h;
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

  function getAllPlaces() {
    const floor = mapState.floor;
    const base = builtInPlaces.filter((place) => place.floor === floor);
    const custom = mapState.customMarkers
      .filter((marker) => (marker.floor ?? 7) === floor)
      .map((marker) => ({ ...marker, custom: true }));
    return [...base, ...custom];
  }

  function getListPlaces(query) {
    return getAllPlaces();
  }

  function getDrawablePlaces() {
    return getAllPlaces();
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

  function normalizeFantasyMap(map) {
    if (!map || typeof map !== "object" || !map.bounds) return null;
    const bounds = map.bounds;
    const w = Number(bounds.w);
    const h = Number(bounds.h);
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 10 || h <= 10) return null;
    const fullWorld = Boolean(map.fullWorld);
    return {
      version: fullWorld ? Math.max(4, Math.floor(Number(map.version) || 4)) : 1,
      fullWorld,
      floor: clamp(Math.floor(map.floor ?? 7), 0, 15),
      seed: Math.abs(Math.floor(Number(map.seed) || 1)),
      resolution: clamp(Math.round(Number(map.resolution) || 1200), 512, 1600),
      resolutionW: fullWorld ? clamp(Math.round(Number(map.resolutionW) || 1792), 768, 2048) : undefined,
      resolutionH: fullWorld ? clamp(Math.round(Number(map.resolutionH) || 1344), 576, 1536) : undefined,
      areaKm2: Number.isFinite(Number(map.areaKm2)) ? Number(map.areaKm2) : 0,
      urbanKm2: Number.isFinite(Number(map.urbanKm2)) ? Number(map.urbanKm2) : FANTASY_CITY_MIN_KM2,
      population: Math.max(1, Math.round(Number(map.population) || 200000)),
      continents: fullWorld ? 8 : undefined,
      bounds: {
        x: Math.round(Number(bounds.x || 0) * 10) / 10,
        y: Math.round(Number(bounds.y || 0) * 10) / 10,
        w: Math.round(w * 10) / 10,
        h: Math.round(h * 10) / 10,
      },
    };
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
    mapState.loadingMarkers = false;
    mapState.tibiaMarkers = [];
    renderMarkerList();
    renderMap();
  }

  function mapUrlForFloor(floor) {
    return blankDanubiaWorldUrl();
  }

  function blankDanubiaWorldUrl() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${DANUBIA_WORLD_WIDTH}" height="${DANUBIA_WORLD_HEIGHT}" viewBox="0 0 ${DANUBIA_WORLD_WIDTH} ${DANUBIA_WORLD_HEIGHT}"><rect width="100%" height="100%" fill="#3f708e"/></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
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
    const previousPayload = loadPersistedState();
    const mesaPayload = window.MesaCombate?.getPersistPayload?.();
    const payload = {
      map: {
        floor: mapState.floor,
        crop: mapState.crop,
        customMarkers: mapState.customMarkers,
        editStrokes: mapState.editStrokes.slice(-800),
        fantasyMap: mapState.fantasyMap,
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
      permissions: previousPayload.permissions || { playerTabs: ["mesa"] },
      mesa: mesaPayload?.mesa ?? previousPayload.mesa,
      sheets: mesaPayload?.sheets ?? previousPayload.sheets,
      monsters_cache: mesaPayload?.monsters_cache ?? previousPayload.monsters_cache,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      if (!payload.mesa?.scene) throw error;
      payload.mesa = { ...payload.mesa, scene: null };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      alert("A cena do Grid de batalha ficou grande demais para salvar no navegador. Ela esta visivel agora, mas pode sumir ao recarregar.");
    }
    window.dispatchEvent(new CustomEvent("danubia:state-saved", { detail: payload }));
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
