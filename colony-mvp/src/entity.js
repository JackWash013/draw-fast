import { COLONIST_COUNT, FACTION, MAX_HP, DEFAULT_SPEED } from './constants.js';
import { randInt, choice } from './utils.js';

let nextEntityId = 1;

export class Entity {
  constructor(type, faction, x, y) {
    this.id = nextEntityId++;
    this.type = type; // 'pawn'
    this.faction = faction;
    this.x = x;
    this.y = y;
    this.hp = MAX_HP;
    this.maxHp = MAX_HP;
    this.speed = DEFAULT_SPEED; // tiles per second
  }
}

const NAMES = ['Ari', 'Bea', 'Caro', 'Dax', 'Eli', 'Faye', 'Gio', 'Hana', 'Ivan', 'Jae', 'Kira', 'Leo'];
const TRAITS = ['Optimist', 'Hard Worker', 'Nimble', 'Gourmand', 'Neurotic', 'Kind', 'Tough', 'Greedy'];
const BACKSTORIES = ['Farmer', 'Engineer', 'Medic', 'Hunter', 'Artist', 'Scout', 'Chef', 'Miner'];

export class Pawn extends Entity {
  constructor(faction, x, y) {
    super('pawn', faction, x, y);
    this.name = choice(NAMES) + ' ' + randInt(1, 99);
    this.traits = [choice(TRAITS)];
    this.backstory = choice(BACKSTORIES);

    this.inventory = { wood: 0, food: 0 };

    this.needs = {
      hunger: 100,
      rest: 100,
      mood: 60,
      breakdownUntil: 0,
    };

    this.job = { kind: 'idle' };
    this.path = null; // array of {x,y}
    this.target = null; // {x,y} or entity id
  }
}

export function spawnColonists(spawnArea) {
  const colonists = [];
  for (let i = 0; i < COLONIST_COUNT; i++) {
    const x = spawnArea.x + randInt(0, spawnArea.w - 1);
    const y = spawnArea.y + randInt(0, spawnArea.h - 1);
    colonists.push(new Pawn(FACTION.COLONIST, x, y));
  }
  return colonists;
}

export function spawnAnimals(num, area) {
  const animals = [];
  for (let i = 0; i < num; i++) {
    const x = area.x + randInt(0, area.w - 1);
    const y = area.y + randInt(0, area.h - 1);
    const p = new Pawn(FACTION.ANIMAL, x, y);
    p.name = 'Deer ' + randInt(1, 99);
    p.needs.mood = 50;
    p.inventory.food = randInt(1, 3);
    p.speed = 2.5;
    animals.push(p);
  }
  return animals;
}

export function spawnRaiders(num, edge, mapWidth, mapHeight) {
  const raiders = [];
  for (let i = 0; i < num; i++) {
    let x = 0, y = 0;
    if (edge === 'left') { x = 0; y = randInt(0, mapHeight - 1); }
    if (edge === 'right') { x = mapWidth - 1; y = randInt(0, mapHeight - 1); }
    if (edge === 'top') { y = 0; x = randInt(0, mapWidth - 1); }
    if (edge === 'bottom') { y = mapHeight - 1; x = randInt(0, mapWidth - 1); }
    const r = new Pawn(FACTION.RAIDER, x, y);
    r.name = 'Raider ' + randInt(100, 999);
    r.speed = 2.8;
    raiders.push(r);
  }
  return raiders;
}