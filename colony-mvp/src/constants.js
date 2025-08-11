export const TILE_SIZE = 16; // pixels
export const MAP_WIDTH = 60;  // tiles
export const MAP_HEIGHT = 40; // tiles

export const TICKS_PER_SECOND = 30;
export const MS_PER_TICK = 1000 / TICKS_PER_SECOND;

export const TILE = {
  GRASS: 0,
  WATER: 1,
  ROCK: 2,
  TREE: 3,
  BERRY: 4,
  WALL: 5,
  SHELTER: 6,
  BEACON: 7,
};

export const TILE_COLORS = {
  [TILE.GRASS]: '#2b7d2b',
  [TILE.WATER]: '#205e9b',
  [TILE.ROCK]: '#6b6b6b',
  [TILE.TREE]: '#1f5a1f',
  [TILE.BERRY]: '#7a2b7d',
  [TILE.WALL]: '#7b4a2e',
  [TILE.SHELTER]: '#85684f',
  [TILE.BEACON]: '#c7b26b',
};

export const FACTION = {
  COLONIST: 'colonist',
  RAIDER: 'raider',
  ANIMAL: 'animal',
};

export const JOB = {
  IDLE: 'idle',
  MOVE: 'move',
  GATHER: 'gather',
  BUILD: 'build',
  ATTACK: 'attack',
  HUNT: 'hunt',
  REST: 'rest',
  WANDER: 'wander',
  BREAKDOWN: 'breakdown',
};

export const WEATHER = {
  CLEAR: 'Clear',
  RAIN: 'Rain',
  HEATWAVE: 'Heatwave',
};

export const INPUT_MODE = {
  SELECT: 'select',
  MOVE: 'move',
  GATHER: 'gather',
  HUNT: 'hunt',
  FIGHT: 'fight',
  BUILD_WALL: 'build_wall',
  BUILD_SHELTER: 'build_shelter',
  BUILD_BEACON: 'build_beacon',
};

export const STRUCTURE_COST = {
  [TILE.WALL]: { wood: 5, food: 0 },
  [TILE.SHELTER]: { wood: 15, food: 0 },
  [TILE.BEACON]: { wood: 50, food: 20 },
};

export const COLONIST_COUNT = 3;

export const MAX_HP = 100;
export const DEFAULT_SPEED = 3; // tiles per second

export const NEEDS = {
  HUNGER_DECAY_PER_MIN: 12, // points per minute
  REST_DECAY_PER_MIN: 10,
  MOOD_RECOVERY_PER_MIN: 8,
  HUNGER_EAT_AMOUNT: 30,
  REST_RECOVERY_RATE: 20, // per minute while resting
  MOOD_BREAKDOWN_THRESHOLD: 15,
};

export const COMBAT = {
  MELEE_RANGE: 1, // tiles (Manhattan)
  MELEE_DPS: 12, // hp per second
};