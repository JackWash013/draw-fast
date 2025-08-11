import { WEATHER, FACTION } from './constants.js';
import { spawnRaiders } from './entity.js';

export function initEvents(game) {
  game.weather = WEATHER.CLEAR;
  game.nextEventInMinutes = 10 + Math.random() * 8; // first event window
}

export function updateEvents(game, dtSeconds) {
  const minutes = dtSeconds * 60;
  game.nextEventInMinutes -= minutes;
  if (game.nextEventInMinutes > 0) return;

  // Roll event
  const roll = Math.random();
  if (roll < 0.4) {
    // Raid
    const edges = ['left', 'right', 'top', 'bottom'];
    const edge = edges[Math.floor(Math.random() * edges.length)];
    const num = 1 + Math.floor(game.colonists.length / 2);
    const raiders = spawnRaiders(num, edge, game.mapWidth, game.mapHeight);
    game.raiders.push(...raiders);
    game.log(`Raiders spotted on the ${edge}!`);
  } else if (roll < 0.75) {
    // Weather shift
    if (game.weather === WEATHER.CLEAR) game.weather = Math.random() < 0.5 ? WEATHER.RAIN : WEATHER.HEATWAVE;
    else game.weather = WEATHER.CLEAR;
    game.log(`Weather changed to ${game.weather}.`);
  } else {
    // Animal goes mad: pick an animal and make it hostile raider-equivalent
    const candidates = game.animals.filter(a => a.hp > 0);
    if (candidates.length > 0) {
      const idx = Math.floor(Math.random() * candidates.length);
      const a = candidates[idx];
      a.faction = FACTION.RAIDER; // turns hostile for MVP
      game.log(`${a.name} has gone mad and is attacking!`);
    }
  }

  game.nextEventInMinutes = 8 + Math.random() * 12;
}