import { MAP_WIDTH, MAP_HEIGHT, TILE } from './constants.js';
import { randInt } from './utils.js';

export function generateMap() {
  const tiles = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
  const resources = new Map(); // key -> {type, amount}

  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      let t = TILE.GRASS;
      const r = Math.random();
      if (r < 0.08) t = TILE.WATER;
      else if (r < 0.14) t = TILE.ROCK;
      tiles[y * MAP_WIDTH + x] = t;
    }
  }

  // Scatter trees and berry bushes on grass
  let trees = randInt(150, 220);
  let berries = randInt(70, 110);

  while (trees > 0) {
    const x = randInt(0, MAP_WIDTH - 1);
    const y = randInt(0, MAP_HEIGHT - 1);
    const i = y * MAP_WIDTH + x;
    if (tiles[i] === TILE.GRASS) {
      tiles[i] = TILE.TREE;
      resources.set(`${x},${y}`, { type: 'wood', amount: randInt(10, 30) });
      trees--;
    }
  }

  while (berries > 0) {
    const x = randInt(0, MAP_WIDTH - 1);
    const y = randInt(0, MAP_HEIGHT - 1);
    const i = y * MAP_WIDTH + x;
    if (tiles[i] === TILE.GRASS) {
      tiles[i] = TILE.BERRY;
      resources.set(`${x},${y}`, { type: 'food', amount: randInt(5, 15) });
      berries--;
    }
  }

  return { tiles, resources };
}

export function getTile(tiles, x, y) {
  return tiles[y * MAP_WIDTH + x];
}

export function setTile(tiles, x, y, t) {
  tiles[y * MAP_WIDTH + x] = t;
}

export function isWalkable(tiles, x, y) {
  const t = getTile(tiles, x, y);
  return t !== TILE.WATER && t !== TILE.ROCK && t !== TILE.WALL && t !== TILE.BEACON; // beacon blocks
}

export function isBuildable(tiles, x, y) {
  const t = getTile(tiles, x, y);
  return t === TILE.GRASS || t === TILE.TREE || t === TILE.BERRY;
}