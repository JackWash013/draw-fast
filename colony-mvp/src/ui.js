import { formatTime } from './utils.js';

export function initUI(game) {
  game.ui = {
    woodCount: document.getElementById('woodCount'),
    foodCount: document.getElementById('foodCount'),
    weatherStatus: document.getElementById('weatherStatus'),
    dayNum: document.getElementById('dayNum'),
    timeOfDay: document.getElementById('timeOfDay'),
    selectedInfo: document.getElementById('selectedInfo'),
    winloss: document.getElementById('winloss'),
  };
  game.updateSelectedInfo();
}

export function updateTopbar(game) {
  const { day, timeStr } = formatTime(game.timeMinutes);
  game.ui.woodCount.textContent = Math.floor(game.stockpile.wood).toString();
  game.ui.foodCount.textContent = Math.floor(game.stockpile.food).toString();
  game.ui.weatherStatus.textContent = game.weather;
  game.ui.dayNum.textContent = day.toString();
  game.ui.timeOfDay.textContent = timeStr;
}

export function updateSelectedInfo(game) {
  const el = game.ui.selectedInfo;
  if (game.selected.length === 0) { el.textContent = 'None'; return; }
  const lines = game.selected.map(c => `${c.name} (${c.hp|0}hp) H:${c.needs.hunger|0} R:${c.needs.rest|0} M:${c.needs.mood|0} inv[W:${c.inventory.wood|0} F:${c.inventory.food|0}] job:${c.job.kind}`);
  el.textContent = lines.join('\n');
}

export function showWin(game) {
  game.ui.winloss.textContent = 'You built a Radio Beacon and signaled for rescue. You win!';
}

export function showLoss(game) {
  game.ui.winloss.textContent = 'All colonists are down. The colony has collapsed.';
}