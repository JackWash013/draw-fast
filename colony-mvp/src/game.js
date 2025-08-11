import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, TILE, TILE_COLORS, FACTION, COMBAT } from './constants.js';
import { generateMap, getTile, setTile, isWalkable } from './map.js';
import { spawnColonists, spawnAnimals } from './entity.js';
import { updateColonistAI, updateRaiderAI, updateAnimalAI } from './ai.js';
import { updateNeeds } from './needs.js';
import { initEvents, updateEvents } from './events.js';
import { initInput } from './input.js';
import { initUI, updateTopbar, updateSelectedInfo, showWin, showLoss } from './ui.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = TILE_SIZE;
    this.mapWidth = MAP_WIDTH;
    this.mapHeight = MAP_HEIGHT;

    const { tiles, resources } = generateMap();
    this.tiles = tiles;
    this.resources = resources;

    // Spawn area in center
    const spawnArea = { x: Math.floor(this.mapWidth / 2) - 2, y: Math.floor(this.mapHeight / 2) - 2, w: 4, h: 4 };

    this.colonists = spawnColonists(spawnArea);
    this.animals = spawnAnimals(6, { x: 2, y: 2, w: this.mapWidth - 4, h: this.mapHeight - 4 });
    this.raiders = [];

    this.stockpile = { wood: 0, food: 0 };
    this.selected = [];

    this.inputMode = 'select';
    this.playerOrders = [];

    this.timeMinutes = 0;
    this.weather = 'Clear';
    this.beaconBuilt = false;
    this.winTriggered = false;
    this.lossTriggered = false;

    this.messages = [];

    initEvents(this);
    initInput(this);
    initUI(this);

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  log(msg) {
    console.log('[Event]', msg);
  }

  resizeCanvas() {
    // Keep fixed internal resolution, canvas is already sized in index.html
  }

  enqueueOrder(order) {
    // For MVP, push one order per selected pawn (simple fan-out)
    for (let i = 0; i < this.selected.length; i++) this.playerOrders.push(order);
  }

  update(dtSeconds) {
    // Advance time
    this.timeMinutes += dtSeconds; // 1 second = 1 minute for faster pace

    // Update events
    updateEvents(this, dtSeconds);

    // Colonists: needs and AI
    for (const c of this.colonists) {
      if (c.hp <= 0) continue;
      updateNeeds(c, dtSeconds, this.weather);
      updateColonistAI(this, c, dtSeconds);
    }

    // Raiders AI and cleanup
    for (const r of this.raiders) {
      if (r.hp <= 0) continue;
      updateRaiderAI(this, r, dtSeconds);
    }
    this.raiders = this.raiders.filter(r => r.hp > -50); // keep corpses briefly if needed

    // Animals
    for (const a of this.animals) {
      if (a.hp <= 0) continue;
      updateAnimalAI(this, a, dtSeconds);
    }

    // Auto-haul from pawn inventories into stockpile when idle and near center
    for (const c of this.colonists) {
      if (c.hp <= 0) continue;
      if (c.job.kind === 'idle' && Math.abs(c.x - this.mapWidth / 2) < 4 && Math.abs(c.y - this.mapHeight / 2) < 4) {
        if (c.inventory.wood > 0) { this.stockpile.wood += c.inventory.wood; c.inventory.wood = 0; }
        if (c.inventory.food > 0) { this.stockpile.food += c.inventory.food; c.inventory.food = 0; }
      }
    }

    // Combat cleanup: if colonists and raiders collide within melee, auto fight
    for (const r of this.raiders) {
      if (r.hp <= 0) continue;
      for (const c of this.colonists) {
        if (c.hp <= 0) continue;
        const d = Math.abs(c.x - r.x) + Math.abs(c.y - r.y);
        if (d <= COMBAT.MELEE_RANGE) {
          r.hp -= 8 * dtSeconds;
          c.hp -= 8 * dtSeconds;
        }
      }
    }

    // Win/loss check
    if (!this.winTriggered && this.beaconBuilt) {
      this.winTriggered = true;
      showWin(this);
    }
    if (!this.lossTriggered && this.colonists.every(c => c.hp <= 0)) {
      this.lossTriggered = true;
      showLoss(this);
    }

    updateTopbar(this);
    updateSelectedInfo(this);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw tiles
    for (let y = 0; y < this.mapHeight; y++) {
      for (let x = 0; x < this.mapWidth; x++) {
        const t = getTile(this.tiles, x, y);
        ctx.fillStyle = TILE_COLORS[t];
        ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    // Draw resources amounts as small dots
    ctx.fillStyle = '#000';
    ctx.font = '10px monospace';
    for (const [key, meta] of this.resources.entries()) {
      const [x, y] = key.split(',').map(Number);
      ctx.fillText(meta.amount.toFixed(0), x * this.tileSize + 2, y * this.tileSize + 10);
    }

    // Draw entities
    const drawPawn = (p, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(p.x * this.tileSize + 3, p.y * this.tileSize + 3, this.tileSize - 6, this.tileSize - 6);
    };

    for (const a of this.animals) if (a.hp > 0) drawPawn(a, '#ddd');
    for (const r of this.raiders) if (r.hp > 0) drawPawn(r, '#c44');
    for (const c of this.colonists) if (c.hp > 0) drawPawn(c, '#f7e15a');

    // Selection highlight
    ctx.strokeStyle = '#7cf';
    ctx.lineWidth = 2;
    for (const s of this.selected) {
      ctx.strokeRect(s.x * this.tileSize + 1, s.y * this.tileSize + 1, this.tileSize - 2, this.tileSize - 2);
    }
  }
}