import { INPUT_MODE, TILE, STRUCTURE_COST } from './constants.js';
import { isBuildable } from './map.js';

export function initInput(game) {
  const canvas = game.canvas;
  const rect = () => canvas.getBoundingClientRect();

  let dragStart = null;

  function toTile(ev) {
    const r = rect();
    const scaleX = canvas.width / r.width;
    const scaleY = canvas.height / r.height;
    const x = Math.floor(((ev.clientX - r.left) * scaleX) / game.tileSize);
    const y = Math.floor(((ev.clientY - r.top) * scaleY) / game.tileSize);
    return { x, y };
  }

  canvas.addEventListener('mousedown', (ev) => {
    if (ev.button === 0) {
      dragStart = toTile(ev);
    }
  });

  canvas.addEventListener('mouseup', (ev) => {
    const t = toTile(ev);
    if (ev.button === 0) {
      if (dragStart && (dragStart.x !== t.x || dragStart.y !== t.y)) {
        // box select
        const minX = Math.min(dragStart.x, t.x);
        const maxX = Math.max(dragStart.x, t.x);
        const minY = Math.min(dragStart.y, t.y);
        const maxY = Math.max(dragStart.y, t.y);
        game.selected = game.colonists.filter(c => c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY && c.hp > 0);
      } else {
        // single select: pick topmost colonist first, else any entity
        const c = game.colonists.find(c => c.x === t.x && c.y === t.y && c.hp > 0);
        if (c) game.selected = [c];
        else game.selected = [];
      }
      dragStart = null;
      game.updateSelectedInfo();
    } else if (ev.button === 2) {
      // Right-click: context action
      issueOrder(game, t.x, t.y);
    }
  });

  canvas.addEventListener('contextmenu', (ev) => ev.preventDefault());

  // Tool buttons
  const modeButtons = {
    [INPUT_MODE.SELECT]: document.getElementById('selectTool'),
    [INPUT_MODE.MOVE]: document.getElementById('moveTool'),
    [INPUT_MODE.GATHER]: document.getElementById('gatherTool'),
    [INPUT_MODE.HUNT]: document.getElementById('huntTool'),
    [INPUT_MODE.FIGHT]: document.getElementById('fightTool'),
  };
  const buildButtons = {
    [INPUT_MODE.BUILD_WALL]: document.getElementById('buildWall'),
    [INPUT_MODE.BUILD_SHELTER]: document.getElementById('buildShelter'),
    [INPUT_MODE.BUILD_BEACON]: document.getElementById('buildBeacon'),
  };

  function setMode(mode) {
    game.inputMode = mode;
    for (const b of Object.values(modeButtons)) b.classList.remove('active');
    for (const b of Object.values(buildButtons)) b.classList.remove('active');
    const btn = modeButtons[mode] || buildButtons[mode];
    if (btn) btn.classList.add('active');
  }

  for (const [mode, btn] of Object.entries(modeButtons)) {
    btn.addEventListener('click', () => setMode(mode));
  }
  for (const [mode, btn] of Object.entries(buildButtons)) {
    btn.addEventListener('click', () => setMode(mode));
  }

  setMode(INPUT_MODE.SELECT);
}

function issueOrder(game, x, y) {
  if (game.selected.length === 0) return;
  switch (game.inputMode) {
    case INPUT_MODE.SELECT:
    case INPUT_MODE.MOVE: {
      game.enqueueOrder({ kind: 'move', x, y });
      break;
    }
    case INPUT_MODE.GATHER: {
      game.enqueueOrder({ kind: 'gather', x, y });
      break;
    }
    case INPUT_MODE.HUNT: {
      // find animal at tile
      const target = game.animals.find(a => a.x === x && a.y === y && a.hp > 0);
      if (target) game.enqueueOrder({ kind: 'hunt', entity: target });
      break;
    }
    case INPUT_MODE.FIGHT: {
      const target = game.raiders.find(r => r.x === x && r.y === y && r.hp > 0);
      if (target) game.enqueueOrder({ kind: 'attack', entity: target });
      break;
    }
    case INPUT_MODE.BUILD_WALL:
    case INPUT_MODE.BUILD_SHELTER:
    case INPUT_MODE.BUILD_BEACON: {
      const mapping = {
        [INPUT_MODE.BUILD_WALL]: TILE.WALL,
        [INPUT_MODE.BUILD_SHELTER]: TILE.SHELTER,
        [INPUT_MODE.BUILD_BEACON]: TILE.BEACON,
      };
      const tile = mapping[game.inputMode];
      const cost = STRUCTURE_COST[tile];
      if (isBuildable(game.tiles, x, y)) {
        game.enqueueOrder({ kind: 'build', x, y, tile, cost });
      } else {
        game.log('Cannot build here.');
      }
      break;
    }
  }
}