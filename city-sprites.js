(() => {
  "use strict";

  const TERRAIN_PALETTE = {
    STONE_LIGHT: "#c8b89a",
    STONE_DARK: "#9e8a70",
    COBBLE_A: "#b5a080",
    COBBLE_B: "#9a8868",
    ROAD_CENTER: "#c4a96e",
    ROAD_EDGE: "#b09458",
    DIRT: "#b8924a",
    GRASS_BRIGHT: "#6ab04c",
    GRASS_MID: "#4e8c38",
    GRASS_DARK: "#3a6e28",
    SAND: "#e0c882",
    WATER_LIGHT: "#4e92c8",
    WATER_DARK: "#2e6894",
    WATER_EDGE: "#3a7aa8",
    MUD: "#7a5c3a",
    SNOW: "#e8e8f0",
    LAVA_BRIGHT: "#f05020",
    LAVA_DARK: "#8a2010",
    WALL_STONE: "#888070",
    WALL_DARK: "#605850",
    ROOF_RED: "#c04030",
    ROOF_DARK: "#803020",
    ROOF_BLUE: "#3060a0",
    ROOF_GOLD: "#c89820",
    ROOF_BROWN: "#7a5030",
    WOOD_LIGHT: "#c8945a",
    WOOD_DARK: "#8a5c30",
    OUTLINE: "#1a1208",
    SHADOW: "rgba(0,0,0,0.28)",
  };

  const CITY_BIOMES = {
    thais: ["urban", "coast", "noble"],
    velmoor: ["urban", "plains", "trade"],
    drakenthal: ["volcanic", "mountain", "fortress"],
    ossebra: ["forest", "river", "trade"],
    mireth: ["swamp", "river", "wood"],
    halveth: ["snow", "mountain", "noble"],
    solavara: ["desert", "coast", "temple"],
  };

  const DISTRICT_DENSITY = {
    noble: 0.22,
    old: 0.76,
    market: 0.62,
    temple: 0.38,
    port: 0.48,
    outer: 0.42,
  };

  let selectedSpriteId = "house_small";

  function seededRandom(seed) {
    let h = 0x811c9dc5;
    const text = String(seed);
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
      h >>>= 0;
    }
    return function next() {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 0xffffffff;
    };
  }

  function px(ctx, tx, ty, tileSize, relX, relY, color, w = 1, h = 1) {
    const scale = tileSize / 32;
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.round(tx + relX * scale),
      Math.round(ty + relY * scale),
      Math.max(1, Math.round(w * scale)),
      Math.max(1, Math.round(h * scale))
    );
  }

  function outline(ctx, tx, ty, tileSize, relX, relY, relW, relH) {
    const scale = tileSize / 32;
    ctx.strokeStyle = TERRAIN_PALETTE.OUTLINE;
    ctx.lineWidth = Math.max(1, scale * 0.8);
    ctx.strokeRect(
      Math.round(tx + relX * scale) + 0.5,
      Math.round(ty + relY * scale) + 0.5,
      Math.round(relW * scale),
      Math.round(relH * scale)
    );
  }

  function dropShadow(ctx, tx, ty, tileSize, relX, relY, relW, relH) {
    const scale = tileSize / 32;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      Math.round(tx + (relX + 2) * scale),
      Math.round(ty + (relY + 2) * scale),
      Math.round(relW * scale),
      Math.round(relH * scale)
    );
    ctx.restore();
  }

  function prep(ctx) {
    ctx.imageSmoothingEnabled = false;
  }

  function drawTile_grass(ctx, x, y, size) {
    prep(ctx);
    const rng = seededRandom(`grass_${Math.round(x)}_${Math.round(y)}`);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.GRASS_MID, 32, 32);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.GRASS_BRIGHT, 16, 16);
    for (let i = 0; i < 10; i += 1) {
      px(ctx, x, y, size, Math.floor(rng() * 31), Math.floor(rng() * 31), TERRAIN_PALETTE.GRASS_DARK);
    }
  }

  function drawTile_cobble(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.COBBLE_A, 32, 32);
    ctx.strokeStyle = TERRAIN_PALETTE.COBBLE_B;
    ctx.lineWidth = Math.max(1, size / 32);
    for (let row = 0; row <= 32; row += 8) {
      line(ctx, x, y + row * size / 32, x + size, y + row * size / 32);
    }
    for (let col = 0; col <= 32; col += 10) {
      line(ctx, x + col * size / 32, y, x + col * size / 32, y + size);
    }
  }

  function drawTile_road(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.ROAD_EDGE, 32, 32);
    px(ctx, x, y, size, 3, 0, TERRAIN_PALETTE.ROAD_CENTER, 26, 32);
    const rng = seededRandom(`road_${x}_${y}`);
    for (let i = 0; i < 6; i += 1) {
      px(ctx, x, y, size, 5 + Math.floor(rng() * 22), Math.floor(rng() * 31), "#9f8148", 2, 1);
    }
  }

  function drawTile_water(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.WATER_DARK, 32, 32);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.WATER_EDGE, 32, 6);
    ctx.strokeStyle = TERRAIN_PALETTE.WATER_LIGHT;
    ctx.lineWidth = Math.max(1, size / 40);
    for (let yy = 8; yy < 30; yy += 8) {
      wave(ctx, x + 3 * size / 32, y + yy * size / 32, size * 0.82, size / 15);
    }
  }

  function drawTile_sand(ctx, x, y, size) {
    prep(ctx);
    const rng = seededRandom(`sand_${x}_${y}`);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.SAND, 32, 32);
    for (let i = 0; i < 12; i += 1) {
      px(ctx, x, y, size, Math.floor(rng() * 31), Math.floor(rng() * 31), "#c8ac68");
    }
  }

  function drawTile_dirt(ctx, x, y, size) {
    prep(ctx);
    const rng = seededRandom(`dirt_${x}_${y}`);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.DIRT, 32, 32);
    for (let i = 0; i < 14; i += 1) {
      px(ctx, x, y, size, Math.floor(rng() * 31), Math.floor(rng() * 31), "#76572f", 2, 2);
    }
  }

  function drawTile_snow(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.SNOW, 32, 32);
    px(ctx, x, y, size, 0, 20, "#d2d8df", 32, 4);
    px(ctx, x, y, size, 2, 3, "#ffffff", 10, 2);
  }

  function drawTile_lava(ctx, x, y, size) {
    prep(ctx);
    const rng = seededRandom(`lava_${x}_${y}`);
    px(ctx, x, y, size, 0, 0, TERRAIN_PALETTE.LAVA_DARK, 32, 32);
    for (let i = 0; i < 7; i += 1) {
      px(ctx, x, y, size, Math.floor(rng() * 26), Math.floor(rng() * 27), TERRAIN_PALETTE.LAVA_BRIGHT, 5, 3);
      px(ctx, x, y, size, Math.floor(rng() * 29), Math.floor(rng() * 29), "#ffd15a", 2, 1);
    }
  }

  function drawTile_swamp(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 0, 0, "#4a5f38", 32, 32);
    px(ctx, x, y, size, 0, 20, TERRAIN_PALETTE.MUD, 32, 12);
    px(ctx, x, y, size, 3, 8, "#6c8742", 9, 5);
    px(ctx, x, y, size, 18, 12, "#6c8742", 8, 4);
  }

  function drawSprite_house_small(ctx, x, y, size) {
    drawHouse(ctx, x, y, size, TERRAIN_PALETTE.ROOF_RED, TERRAIN_PALETTE.WALL_STONE, 3, 3, 26, 26);
  }

  function drawSprite_house_medium(ctx, x, y, size) {
    drawHouse(ctx, x, y, size, "#b74a34", "#a79b86", 2, 2, 28, 28);
    px(ctx, x, y, size, 7, 24, "#f1d889", 4, 3);
    px(ctx, x, y, size, 21, 24, "#f1d889", 4, 3);
  }

  function drawSprite_townhouse(ctx, x, y, size) {
    drawHouse(ctx, x, y, size, TERRAIN_PALETTE.ROOF_BLUE, "#aaa18f", 4, 2, 24, 29);
    px(ctx, x, y, size, 7, 8, "#e8d39a", 5, 4);
    px(ctx, x, y, size, 20, 8, "#e8d39a", 5, 4);
  }

  function drawSprite_mansion(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 2, 4, 60, 54);
    px(ctx, x, y, size, 2, 6, TERRAIN_PALETTE.ROOF_GOLD, 60, 36);
    px(ctx, x, y, size, 8, 42, "#b9ae9b", 48, 14);
    px(ctx, x, y, size, 27, 42, TERRAIN_PALETTE.WOOD_DARK, 8, 14);
    outline(ctx, x, y, size, 2, 6, 60, 50);
  }

  function drawSprite_ruin(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 4, 5, 24, 22);
    px(ctx, x, y, size, 4, 7, TERRAIN_PALETTE.WALL_DARK, 8, 19);
    px(ctx, x, y, size, 12, 18, TERRAIN_PALETTE.WALL_STONE, 14, 8);
    px(ctx, x, y, size, 21, 8, TERRAIN_PALETTE.WALL_DARK, 5, 15);
    outline(ctx, x, y, size, 4, 7, 22, 19);
  }

  function drawSprite_cabin(ctx, x, y, size) {
    drawHouse(ctx, x, y, size, TERRAIN_PALETTE.ROOF_BROWN, TERRAIN_PALETTE.WOOD_LIGHT, 4, 5, 24, 23);
    px(ctx, x, y, size, 4, 13, TERRAIN_PALETTE.WOOD_DARK, 24, 2);
  }

  function drawSprite_tavern(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 2, 2, 60, 28);
    px(ctx, x, y, size, 2, 2, TERRAIN_PALETTE.ROOF_BROWN, 60, 24);
    px(ctx, x, y, size, 2, 26, TERRAIN_PALETTE.WALL_STONE, 60, 4);
    px(ctx, x, y, size, 8, 22, TERRAIN_PALETTE.WOOD_DARK, 13, 5);
    px(ctx, x, y, size, 13, 23, TERRAIN_PALETTE.ROOF_GOLD, 2, 2);
    outline(ctx, x, y, size, 2, 2, 60, 28);
  }

  function drawSprite_temple(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 3, 3, 56, 56);
    px(ctx, x, y, size, 6, 10, "#d9cfb7", 52, 42);
    px(ctx, x, y, size, 2, 4, TERRAIN_PALETTE.ROOF_BLUE, 60, 10);
    for (let i = 0; i < 5; i += 1) px(ctx, x, y, size, 10 + i * 9, 16, TERRAIN_PALETTE.WALL_DARK, 3, 30);
    px(ctx, x, y, size, 28, 44, TERRAIN_PALETTE.WOOD_DARK, 8, 8);
    outline(ctx, x, y, size, 6, 10, 52, 42);
  }

  function drawSprite_forge(ctx, x, y, size) {
    drawHouse(ctx, x, y, size, "#5d5144", TERRAIN_PALETTE.WALL_STONE, 3, 5, 26, 24);
    px(ctx, x, y, size, 22, 2, TERRAIN_PALETTE.WALL_DARK, 5, 8);
    px(ctx, x, y, size, 23, 0, "#c0c0b0", 2, 2);
    px(ctx, x, y, size, 8, 21, TERRAIN_PALETTE.LAVA_BRIGHT, 7, 4);
  }

  function drawSprite_market(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 3, 8, "#d8c89a", 26, 18);
    for (let i = 0; i < 4; i += 1) px(ctx, x, y, size, 4 + i * 6, 8, i % 2 ? TERRAIN_PALETTE.ROOF_RED : "#f1e2a8", 6, 6);
    px(ctx, x, y, size, 5, 24, TERRAIN_PALETTE.WOOD_DARK, 22, 3);
    outline(ctx, x, y, size, 3, 8, 26, 18);
  }

  function drawSprite_guild(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 3, 4, 88, 55);
    px(ctx, x, y, size, 4, 8, TERRAIN_PALETTE.ROOF_GOLD, 88, 34);
    px(ctx, x, y, size, 10, 42, "#b7ad96", 76, 14);
    px(ctx, x, y, size, 43, 41, TERRAIN_PALETTE.ROOF_RED, 10, 15);
    outline(ctx, x, y, size, 4, 8, 88, 48);
  }

  function drawSprite_castle(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 2, 2, 124, 124);
    px(ctx, x, y, size, 10, 16, TERRAIN_PALETTE.WALL_STONE, 108, 92);
    px(ctx, x, y, size, 22, 28, TERRAIN_PALETTE.ROOF_RED, 84, 54);
    for (const p of [[8,12], [104,12], [8,94], [104,94]]) {
      px(ctx, x, y, size, p[0], p[1], TERRAIN_PALETTE.WALL_DARK, 16, 22);
      px(ctx, x, y, size, p[0] - 2, p[1] - 6, TERRAIN_PALETTE.ROOF_RED, 20, 8);
    }
    px(ctx, x, y, size, 56, 96, TERRAIN_PALETTE.WOOD_DARK, 16, 12);
    outline(ctx, x, y, size, 10, 16, 108, 92);
  }

  function drawSprite_tower(ctx, x, y, size) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 7, 4, 18, 25);
    px(ctx, x, y, size, 8, 7, TERRAIN_PALETTE.WALL_STONE, 16, 20);
    px(ctx, x, y, size, 6, 4, TERRAIN_PALETTE.ROOF_RED, 20, 6);
    outline(ctx, x, y, size, 8, 7, 16, 20);
  }

  function drawSprite_dock(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 9, 0, TERRAIN_PALETTE.WOOD_LIGHT, 14, 64);
    for (let yy = 5; yy < 62; yy += 10) px(ctx, x, y, size, 6, yy, TERRAIN_PALETTE.WOOD_DARK, 20, 2);
    outline(ctx, x, y, size, 9, 0, 14, 64);
  }

  function drawSprite_lighthouse(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 11, 5, "#f1ead6", 10, 21);
    px(ctx, x, y, size, 9, 2, TERRAIN_PALETTE.ROOF_RED, 14, 5);
    px(ctx, x, y, size, 10, 10, TERRAIN_PALETTE.ROOF_RED, 12, 3);
    px(ctx, x, y, size, 13, 3, "#ffe189", 6, 3);
    outline(ctx, x, y, size, 11, 5, 10, 21);
  }

  function drawSprite_library(ctx, x, y, size) {
    drawWideBuilding(ctx, x, y, size, TERRAIN_PALETTE.ROOF_BLUE, "#b9ad96");
    px(ctx, x, y, size, 12, 25, "#f0df9e", 6, 3);
    px(ctx, x, y, size, 44, 25, "#f0df9e", 6, 3);
  }

  function drawSprite_warehouse(ctx, x, y, size) {
    drawWideBuilding(ctx, x, y, size, TERRAIN_PALETTE.ROOF_BROWN, TERRAIN_PALETTE.WOOD_LIGHT);
    px(ctx, x, y, size, 27, 24, TERRAIN_PALETTE.WOOD_DARK, 9, 6);
  }

  function drawSprite_graveyard(ctx, x, y, size) {
    prep(ctx);
    drawTile_grass(ctx, x, y, size * 2);
    for (let col = 0; col < 4; col += 1) {
      for (let row = 0; row < 3; row += 1) {
        px(ctx, x, y, size, 9 + col * 12, 10 + row * 12, "#bdb8aa", 4, 7);
        outline(ctx, x, y, size, 9 + col * 12, 10 + row * 12, 4, 7);
      }
    }
  }

  function drawSprite_dungeon_entrance(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 5, 12, TERRAIN_PALETTE.WALL_DARK, 22, 13);
    px(ctx, x, y, size, 9, 16, "#111111", 14, 9);
    outline(ctx, x, y, size, 5, 12, 22, 13);
  }

  function drawSprite_arena(ctx, x, y, size) {
    prep(ctx);
    ctx.strokeStyle = TERRAIN_PALETTE.WALL_DARK;
    ctx.lineWidth = Math.max(3, size / 10);
    ctx.beginPath();
    ctx.ellipse(x + size * 2, y + size * 2, size * 1.75, size * 1.15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = TERRAIN_PALETTE.SAND;
    ctx.lineWidth = Math.max(2, size / 16);
    ctx.beginPath();
    ctx.ellipse(x + size * 2, y + size * 2, size * 1.4, size * 0.86, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawSprite_tree_small(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size * 0.5, y + size * 0.48, size * 0.34, TERRAIN_PALETTE.GRASS_DARK, true);
    circle(ctx, x + size * 0.42, y + size * 0.40, size * 0.18, TERRAIN_PALETTE.GRASS_BRIGHT, false);
    px(ctx, x, y, size, 14, 23, TERRAIN_PALETTE.WOOD_DARK, 4, 6);
  }

  function drawSprite_tree_large(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size * 0.5, y + size * 0.5, size * 0.44, "#274f25", true);
    circle(ctx, x + size * 0.38, y + size * 0.38, size * 0.22, TERRAIN_PALETTE.GRASS_MID, false);
    px(ctx, x, y, size, 13, 23, TERRAIN_PALETTE.WOOD_DARK, 6, 7);
  }

  function drawSprite_bush(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size * 0.35, y + size * 0.56, size * 0.19, TERRAIN_PALETTE.GRASS_DARK, true);
    circle(ctx, x + size * 0.56, y + size * 0.52, size * 0.22, TERRAIN_PALETTE.GRASS_MID, true);
  }

  function drawSprite_rock(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 7, 12, "#74736a", 18, 12);
    px(ctx, x, y, size, 10, 9, "#9b9a8f", 12, 7);
    outline(ctx, x, y, size, 7, 12, 18, 12);
  }

  function drawSprite_well(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size * 0.5, y + size * 0.56, size * 0.25, TERRAIN_PALETTE.WALL_STONE, true);
    circle(ctx, x + size * 0.5, y + size * 0.56, size * 0.15, "#1d3042", false);
    px(ctx, x, y, size, 9, 6, TERRAIN_PALETTE.WOOD_DARK, 3, 14);
    px(ctx, x, y, size, 20, 6, TERRAIN_PALETTE.WOOD_DARK, 3, 14);
    px(ctx, x, y, size, 8, 6, TERRAIN_PALETTE.WOOD_LIGHT, 16, 3);
  }

  function drawSprite_fountain(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size, y + size, size * 0.55, TERRAIN_PALETTE.WALL_STONE, true);
    circle(ctx, x + size, y + size, size * 0.38, TERRAIN_PALETTE.WATER_LIGHT, false);
    circle(ctx, x + size, y + size, size * 0.12, "#e4dfc8", true);
  }

  function drawSprite_wall_segment(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 0, 11, TERRAIN_PALETTE.WALL_DARK, 32, 10);
    for (let i = 0; i < 4; i += 1) px(ctx, x, y, size, i * 8 + 1, 9, TERRAIN_PALETTE.WALL_STONE, 5, 5);
    outline(ctx, x, y, size, 0, 11, 32, 10);
  }

  function drawSprite_gate(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 4, 8, TERRAIN_PALETTE.WALL_STONE, 56, 18);
    px(ctx, x, y, size, 24, 12, TERRAIN_PALETTE.WOOD_DARK, 16, 14);
    outline(ctx, x, y, size, 4, 8, 56, 18);
  }

  function drawSprite_boat_large(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 12, 10, TERRAIN_PALETTE.WOOD_DARK, 42, 14);
    px(ctx, x, y, size, 22, 4, "#efe4c4", 12, 20);
    px(ctx, x, y, size, 34, 7, "#d6c4a0", 10, 16);
    outline(ctx, x, y, size, 12, 10, 42, 14);
  }

  function drawSprite_boat_small(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 10, 6, TERRAIN_PALETTE.WOOD_DARK, 12, 22);
    px(ctx, x, y, size, 13, 8, "#efe4c4", 6, 14);
    outline(ctx, x, y, size, 10, 6, 12, 22);
  }

  function drawSprite_farm(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 2, 2, "#a78654", 28, 28);
    for (let yy = 5; yy < 29; yy += 5) px(ctx, x, y, size, 2, yy, "#6d5634", 28, 1);
    px(ctx, x, y, size, 5, 4, "#d8c866", 4, 24);
    px(ctx, x, y, size, 17, 4, "#d8c866", 4, 24);
  }

  function drawSprite_garden(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 3, 3, TERRAIN_PALETTE.GRASS_BRIGHT, 58, 58);
    for (let i = 0; i < 5; i += 1) {
      circle(ctx, x + size * (0.35 + i * 0.14), y + size * 0.8, size * 0.07, i % 2 ? TERRAIN_PALETTE.ROOF_RED : TERRAIN_PALETTE.ROOF_GOLD, false);
    }
    outline(ctx, x, y, size, 3, 3, 58, 58);
  }

  function drawMarker_pin(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size * 0.5, y + size * 0.38, size * 0.2, TERRAIN_PALETTE.ROOF_RED, true);
    px(ctx, x, y, size, 15, 17, TERRAIN_PALETTE.ROOF_RED, 3, 12);
  }

  function drawMarker_danger(ctx, x, y, size) {
    prep(ctx);
    polygon(ctx, [[16, 4], [29, 28], [3, 28]], x, y, size, TERRAIN_PALETTE.ROOF_GOLD, true);
    px(ctx, x, y, size, 15, 11, TERRAIN_PALETTE.OUTLINE, 2, 9);
    px(ctx, x, y, size, 15, 23, TERRAIN_PALETTE.OUTLINE, 2, 2);
  }

  function drawMarker_treasure(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 6, 13, TERRAIN_PALETTE.ROOF_GOLD, 20, 12);
    px(ctx, x, y, size, 6, 10, TERRAIN_PALETTE.WOOD_DARK, 20, 5);
    outline(ctx, x, y, size, 6, 10, 20, 15);
  }

  function drawMarker_monster(ctx, x, y, size) {
    prep(ctx);
    circle(ctx, x + size * 0.5, y + size * 0.45, size * 0.26, "#e7dcc3", true);
    px(ctx, x, y, size, 10, 13, "#111111", 4, 4);
    px(ctx, x, y, size, 18, 13, "#111111", 4, 4);
    px(ctx, x, y, size, 13, 21, "#111111", 7, 2);
  }

  function drawMarker_temple(ctx, x, y, size) {
    prep(ctx);
    px(ctx, x, y, size, 14, 4, TERRAIN_PALETTE.ROOF_GOLD, 4, 24);
    px(ctx, x, y, size, 7, 11, TERRAIN_PALETTE.ROOF_GOLD, 18, 4);
  }

  function drawHouse(ctx, x, y, size, roof, wall, rx, ry, rw, rh) {
    prep(ctx);
    dropShadow(ctx, x, y, size, rx, ry, rw, rh);
    px(ctx, x, y, size, rx, ry, roof, rw, Math.max(12, rh - 6));
    px(ctx, x, y, size, rx, ry + rh - 5, wall, rw, 5);
    px(ctx, x, y, size, rx + Math.floor(rw / 2) - 3, ry + rh - 5, TERRAIN_PALETTE.WOOD_DARK, 6, 5);
    px(ctx, x, y, size, rx, ry + Math.floor(rh / 2), "#d85a44", rw, 2);
    outline(ctx, x, y, size, rx, ry, rw, rh);
  }

  function drawWideBuilding(ctx, x, y, size, roof, wall) {
    prep(ctx);
    dropShadow(ctx, x, y, size, 2, 5, 60, 25);
    px(ctx, x, y, size, 2, 5, roof, 60, 19);
    px(ctx, x, y, size, 2, 24, wall, 60, 6);
    outline(ctx, x, y, size, 2, 5, 60, 25);
  }

  function generateDistrict(kind, bounds, seed = "danubia") {
    const rng = seededRandom(`${seed}:${kind}:${bounds.x}:${bounds.y}`);
    const density = DISTRICT_DENSITY[kind] || 0.45;
    const sprites = [];
    const cols = Math.max(1, Math.floor(bounds.w / 42));
    const rows = Math.max(1, Math.floor(bounds.h / 42));
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (rng() > density) continue;
        sprites.push({
          id: `${kind}-${x}-${y}`,
          sprite: kind === "noble" ? "mansion" : kind === "market" ? "market" : "house_small",
          x: bounds.x + (x + 0.5) * bounds.w / cols,
          y: bounds.y + (y + 0.5) * bounds.h / rows,
        });
      }
    }
    return sprites;
  }

  function paintSprite(ctx, sprite, x, y, size = 32) {
    const entry = SPRITES[sprite];
    if (!entry) return;
    entry.draw(ctx, x, y, size);
  }

  function paintCitySprites(ctx, data, options = {}) {
    if (!data?.buildings?.length) return;
    const buildings = data.buildings;
    const maxSprites = options.screen ? 900 : 2200;
    const step = Math.max(1, Math.ceil(buildings.length / maxSprites));
    buildings.forEach((building, index) => {
      if (index % step !== 0) return;
      const size = clamp(Math.min(building.w || 32, building.h || 32) * 1.25, 18, 42);
      const sprite = spriteForBuilding(building, index);
      const footprint = getSpriteFootprint(sprite);
      ctx.save();
      ctx.translate(building.x, building.y);
      ctx.rotate(building.rotation || 0);
      paintSprite(ctx, sprite, -size * footprint.w / 2, -size * footprint.h / 2, size);
      ctx.restore();
    });
  }

  function getSpriteFootprint(spriteId) {
    if (["castle", "arena"].includes(spriteId)) return { w: 4, h: 4 };
    if (spriteId === "guild") return { w: 3, h: 2 };
    if (["mansion", "temple", "graveyard", "fountain", "garden", "boat_large"].includes(spriteId)) return { w: 2, h: 2 };
    if (["tavern", "library", "warehouse", "gate"].includes(spriteId)) return { w: 2, h: 1 };
    if (["dock", "boat_small"].includes(spriteId)) return { w: 1, h: 2 };
    return { w: 1, h: 1 };
  }

  function spriteForBuilding(building, index) {
    if (building.kind === "temple") return "temple";
    if (building.kind === "tower") return "tower";
    if (building.kind === "warehouse") return "warehouse";
    if (building.kind === "ruin") return "ruin";
    if (building.kind === "noble") return "mansion";
    if (index % 41 === 0) return "tavern";
    if (index % 37 === 0) return "forge";
    if (index % 31 === 0) return "market";
    if (index % 7 === 0) return "house_medium";
    if (index % 11 === 0) return "townhouse";
    return "house_small";
  }

  function renderPalette() {
    const host = document.querySelector("#spritePalette");
    if (!host) return;
    host.innerHTML = "";
    Object.entries(SPRITES).forEach(([key, sprite]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.spriteId = key;
      button.title = sprite.label;
      button.classList.toggle("active", key === selectedSpriteId);
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      sprite.draw(ctx, 0, 0, 32);
      const span = document.createElement("span");
      span.textContent = sprite.short || sprite.label;
      button.append(canvas, span);
      button.addEventListener("click", () => {
        selectedSpriteId = key;
        $$(".sprite-palette button", host).forEach((item) => item.classList.toggle("active", item.dataset.spriteId === selectedSpriteId));
        const select = document.querySelector("#cityBuildingKind");
        const mapped = sprite.cityKind || "house";
        if (select && sprite.group !== "terrain" && sprite.group !== "marker" && [...select.options].some((option) => option.value === mapped)) {
          select.value = mapped;
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }
        document.dispatchEvent(new CustomEvent("danubia:sprite-selected", { detail: { spriteId: selectedSpriteId, sprite } }));
      });
      host.appendChild(button);
    });
  }

  function getSelectedSprite() {
    return selectedSpriteId;
  }

  function getSpriteMeta(spriteId) {
    return SPRITES[spriteId] || null;
  }

  function $$ (selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function line(ctx, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  function wave(ctx, x, y, width, amp) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + width * 0.25, y - amp, x + width * 0.5, y);
    ctx.quadraticCurveTo(x + width * 0.75, y + amp, x + width, y);
    ctx.stroke();
  }

  function circle(ctx, x, y, radius, color, stroke) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = TERRAIN_PALETTE.OUTLINE;
      ctx.lineWidth = Math.max(1, radius / 10);
      ctx.stroke();
    }
  }

  function polygon(ctx, points, x, y, size, color, stroke) {
    const scale = size / 32;
    ctx.beginPath();
    points.forEach(([pxValue, pyValue], index) => {
      const pxScreen = x + pxValue * scale;
      const pyScreen = y + pyValue * scale;
      if (index === 0) ctx.moveTo(pxScreen, pyScreen);
      else ctx.lineTo(pxScreen, pyScreen);
    });
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = TERRAIN_PALETTE.OUTLINE;
      ctx.lineWidth = Math.max(1, size / 32);
      ctx.stroke();
    }
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const SPRITES = {
    grass: { label: "Grama", short: "Grama", group: "terrain", draw: drawTile_grass, cityKind: "house" },
    cobble: { label: "Calcada", short: "Pedra", group: "terrain", draw: drawTile_cobble, cityKind: "house" },
    road: { label: "Estrada", short: "Rua", group: "terrain", draw: drawTile_road, cityKind: "house" },
    water: { label: "Agua", short: "Agua", group: "terrain", draw: drawTile_water, cityKind: "house" },
    sand: { label: "Areia", short: "Areia", group: "terrain", draw: drawTile_sand, cityKind: "house" },
    dirt: { label: "Terra", short: "Terra", group: "terrain", draw: drawTile_dirt, cityKind: "house" },
    snow: { label: "Neve", short: "Neve", group: "terrain", draw: drawTile_snow, cityKind: "house" },
    lava: { label: "Lava", short: "Lava", group: "terrain", draw: drawTile_lava, cityKind: "house" },
    swamp: { label: "Pantano", short: "Lama", group: "terrain", draw: drawTile_swamp, cityKind: "house" },
    house_small: { label: "Casa pequena", short: "Casa", group: "residential", draw: drawSprite_house_small, cityKind: "house" },
    house_medium: { label: "Casa media", short: "Casa+", group: "residential", draw: drawSprite_house_medium, cityKind: "house" },
    townhouse: { label: "Sobrado", short: "Sobrado", group: "residential", draw: drawSprite_townhouse, cityKind: "house" },
    mansion: { label: "Mansao", short: "Mansao", group: "residential", draw: drawSprite_mansion, cityKind: "noble" },
    ruin: { label: "Ruina", short: "Ruina", group: "residential", draw: drawSprite_ruin, cityKind: "ruin" },
    cabin: { label: "Cabana", short: "Cabana", group: "residential", draw: drawSprite_cabin, cityKind: "house" },
    tavern: { label: "Taverna", short: "Taverna", group: "poi", draw: drawSprite_tavern, cityKind: "house" },
    temple: { label: "Templo", short: "Templo", group: "poi", draw: drawSprite_temple, cityKind: "temple" },
    forge: { label: "Forja", short: "Forja", group: "poi", draw: drawSprite_forge, cityKind: "house" },
    market: { label: "Mercado", short: "Mercado", group: "poi", draw: drawSprite_market, cityKind: "house" },
    guild: { label: "Guilda", short: "Guilda", group: "poi", draw: drawSprite_guild, cityKind: "noble" },
    castle: { label: "Castelo", short: "Castelo", group: "poi", draw: drawSprite_castle, cityKind: "noble" },
    tower: { label: "Torre", short: "Torre", group: "poi", draw: drawSprite_tower, cityKind: "tower" },
    dock: { label: "Doca", short: "Doca", group: "poi", draw: drawSprite_dock, cityKind: "warehouse" },
    lighthouse: { label: "Farol", short: "Farol", group: "poi", draw: drawSprite_lighthouse, cityKind: "tower" },
    library: { label: "Biblioteca", short: "Livro", group: "poi", draw: drawSprite_library, cityKind: "temple" },
    warehouse: { label: "Armazem", short: "Armazem", group: "poi", draw: drawSprite_warehouse, cityKind: "warehouse" },
    graveyard: { label: "Cemiterio", short: "Cova", group: "poi", draw: drawSprite_graveyard, cityKind: "ruin" },
    dungeon_entrance: { label: "Entrada de masmorra", short: "Dungeon", group: "poi", draw: drawSprite_dungeon_entrance, cityKind: "ruin" },
    arena: { label: "Arena", short: "Arena", group: "poi", draw: drawSprite_arena, cityKind: "noble" },
    tree_small: { label: "Arvore pequena", short: "Arvore", group: "nature", draw: drawSprite_tree_small, cityKind: "house" },
    tree_large: { label: "Arvore grande", short: "Floresta", group: "nature", draw: drawSprite_tree_large, cityKind: "house" },
    bush: { label: "Arbusto", short: "Arbusto", group: "nature", draw: drawSprite_bush, cityKind: "house" },
    rock: { label: "Pedra", short: "Rocha", group: "nature", draw: drawSprite_rock, cityKind: "ruin" },
    well: { label: "Poco", short: "Poco", group: "nature", draw: drawSprite_well, cityKind: "house" },
    fountain: { label: "Fonte", short: "Fonte", group: "nature", draw: drawSprite_fountain, cityKind: "noble" },
    wall_segment: { label: "Muralha", short: "Muro", group: "nature", draw: drawSprite_wall_segment, cityKind: "tower" },
    gate: { label: "Portao", short: "Portao", group: "nature", draw: drawSprite_gate, cityKind: "tower" },
    boat_large: { label: "Barco grande", short: "Navio", group: "nature", draw: drawSprite_boat_large, cityKind: "warehouse" },
    boat_small: { label: "Barco pequeno", short: "Barco", group: "nature", draw: drawSprite_boat_small, cityKind: "warehouse" },
    farm: { label: "Lavoura", short: "Campo", group: "nature", draw: drawSprite_farm, cityKind: "house" },
    garden: { label: "Jardim", short: "Jardim", group: "nature", draw: drawSprite_garden, cityKind: "noble" },
    marker_pin: { label: "Pin", short: "Pin", group: "marker", draw: drawMarker_pin, cityKind: "house" },
    marker_danger: { label: "Perigo", short: "Perigo", group: "marker", draw: drawMarker_danger, cityKind: "ruin" },
    marker_treasure: { label: "Tesouro", short: "Tesouro", group: "marker", draw: drawMarker_treasure, cityKind: "house" },
    marker_monster: { label: "Monstro", short: "Monstro", group: "marker", draw: drawMarker_monster, cityKind: "ruin" },
    marker_temple: { label: "Templo", short: "Sagrado", group: "marker", draw: drawMarker_temple, cityKind: "temple" },
  };

  window.CitySprites = {
    TERRAIN_PALETTE,
    SPRITES,
    CITY_BIOMES,
    DISTRICT_DENSITY,
    seededRandom,
    px,
    outline,
    dropShadow,
    generateDistrict,
    renderPalette,
    paintSprite,
    paintCitySprites,
    getSelectedSprite,
    getSpriteMeta,
    getSpriteFootprint,
    drawTile_grass,
    drawTile_cobble,
    drawTile_road,
    drawTile_water,
    drawTile_sand,
    drawTile_dirt,
    drawTile_snow,
    drawTile_lava,
    drawTile_swamp,
    drawSprite_house_small,
    drawSprite_house_medium,
    drawSprite_townhouse,
    drawSprite_mansion,
    drawSprite_ruin,
    drawSprite_cabin,
    drawSprite_tavern,
    drawSprite_temple,
    drawSprite_forge,
    drawSprite_market,
    drawSprite_guild,
    drawSprite_castle,
    drawSprite_tower,
    drawSprite_dock,
    drawSprite_lighthouse,
    drawSprite_library,
    drawSprite_warehouse,
    drawSprite_graveyard,
    drawSprite_dungeon_entrance,
    drawSprite_arena,
    drawSprite_tree_small,
    drawSprite_tree_large,
    drawSprite_bush,
    drawSprite_rock,
    drawSprite_well,
    drawSprite_fountain,
    drawSprite_wall_segment,
    drawSprite_gate,
    drawSprite_boat_large,
    drawSprite_boat_small,
    drawSprite_farm,
    drawSprite_garden,
    drawMarker_pin,
    drawMarker_danger,
    drawMarker_treasure,
    drawMarker_monster,
    drawMarker_temple,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderPalette, { once: true });
  } else {
    renderPalette();
  }
})();
