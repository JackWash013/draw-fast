import { JOB, TILE, COMBAT, FACTION } from './constants.js';
import { bfsPath, manhattan } from './utils.js';
import { getTile, isWalkable, setTile } from './map.js';
import { tryConsumeFood, isBreakingDown, restRecovery } from './needs.js';

function assignMove(pawn, target, game) {
  const path = bfsPath({ x: pawn.x, y: pawn.y }, target, (x, y) => isWalkable(game.tiles, x, y));
  if (path && path.length > 1) {
    pawn.job = { kind: JOB.MOVE, target, path, pathIndex: 1 };
  } else {
    pawn.job = { kind: JOB.IDLE };
  }
}

function stepAlongPath(pawn, dtSeconds) {
  if (!pawn.job.path || pawn.job.pathIndex >= pawn.job.path.length) return true;
  const nextNode = pawn.job.path[pawn.job.pathIndex];
  // Move at speed tiles/sec; for simplicity, step whole tiles when enough time passed
  pawn._moveProgress = (pawn._moveProgress || 0) + pawn.speed * dtSeconds;
  if (pawn._moveProgress >= 1) {
    pawn._moveProgress -= 1;
    pawn.x = nextNode.x;
    pawn.y = nextNode.y;
    pawn.job.pathIndex++;
    if (pawn.job.pathIndex >= pawn.job.path.length) return true;
  }
  return false;
}

function findNearestResource(game, pawn, type) {
  let best = null;
  let bestDist = Infinity;
  for (const [key, meta] of game.resources.entries()) {
    if (meta.type !== type || meta.amount <= 0) continue;
    const [x, y] = key.split(',').map(Number);
    const dist = Math.abs(x - pawn.x) + Math.abs(y - pawn.y);
    if (dist < bestDist) { bestDist = dist; best = { x, y, key }; }
  }
  return best;
}

function withinRange(a, b, range) {
  return manhattan(a, b) <= range;
}

function attackTarget(attacker, target, dtSeconds) {
  target.hp -= COMBAT.MELEE_DPS * dtSeconds;
}

export function updateColonistAI(game, pawn, dtSeconds) {
  const minutesElapsed = dtSeconds * 60;
  const nowMin = game.timeMinutes;

  // Breakdown behavior
  if (isBreakingDown(pawn, nowMin)) {
    pawn.job = { kind: JOB.BREAKDOWN };
    // wander randomly
    if (!pawn._wanderCooldown || pawn._wanderCooldown <= 0) {
      const tx = Math.max(0, Math.min(game.mapWidth - 1, pawn.x + (Math.random() < 0.5 ? -3 : 3)));
      const ty = Math.max(0, Math.min(game.mapHeight - 1, pawn.y + (Math.random() < 0.5 ? -3 : 3)));
      assignMove(pawn, { x: tx, y: ty }, game);
      pawn._wanderCooldown = 2; // seconds
    } else {
      pawn._wanderCooldown -= dtSeconds;
    }
    return;
  }

  // If low hunger and has food: eat
  if (pawn.needs.hunger < 55 && tryConsumeFood(pawn)) {
    pawn.job = { kind: JOB.IDLE };
    return;
  }

  // Rest if very tired
  if (pawn.needs.rest < 30) {
    // Rest in place; check shelter bonus
    const t = getTile(game.tiles, pawn.x, pawn.y);
    const hasShelter = t === TILE.SHELTER;
    restRecovery(pawn, minutesElapsed, hasShelter);
    pawn.job = { kind: JOB.REST };
    return;
  }

  // Execute current job
  switch (pawn.job.kind) {
    case JOB.MOVE: {
      const arrived = stepAlongPath(pawn, dtSeconds);
      if (arrived) pawn.job = { kind: JOB.IDLE };
      return;
    }
    case JOB.GATHER: {
      // If not adjacent to target, move
      const target = pawn.job.target;
      if (!withinRange(pawn, target, 1)) {
        if (!pawn.job.path) assignMove(pawn, target, game);
        stepAlongPath(pawn, dtSeconds);
        return;
      }
      // At target: gather from tile resource
      const meta = game.resources.get(`${target.x},${target.y}`);
      if (meta && meta.amount > 0) {
        const rate = 6 * dtSeconds; // units per second
        const take = Math.min(meta.amount, rate);
        meta.amount -= take;
        if (meta.type === 'wood') pawn.inventory.wood += take;
        if (meta.type === 'food') pawn.inventory.food += take;
        if (meta.amount <= 0) {
          // revert tile to grass
          setTile(game.tiles, target.x, target.y, TILE.GRASS);
          game.resources.delete(`${target.x},${target.y}`);
        }
      } else {
        pawn.job = { kind: JOB.IDLE };
      }
      return;
    }
    case JOB.BUILD: {
      const target = pawn.job.target;
      // Check resources; if lack, try to gather
      const cost = pawn.job.cost;
      if ((pawn.inventory.wood < cost.wood) || (pawn.inventory.food < cost.food)) {
        // try to find nearest missing resource
        if (pawn.inventory.wood < cost.wood) {
          const res = findNearestResource(game, pawn, 'wood');
          if (res) {
            pawn.job = { kind: JOB.GATHER, target: { x: res.x, y: res.y } };
            return;
          }
        }
        if (pawn.inventory.food < cost.food) {
          const res = findNearestResource(game, pawn, 'food');
          if (res) {
            pawn.job = { kind: JOB.GATHER, target: { x: res.x, y: res.y } };
            return;
          }
        }
        // else idle if cannot find
        pawn.job = { kind: JOB.IDLE };
        return;
      }
      // Move to site
      if (!withinRange(pawn, target, 1)) {
        if (!pawn.job.path) assignMove(pawn, target, game);
        stepAlongPath(pawn, dtSeconds);
        return;
      }
      // Build progress
      pawn._buildProgress = (pawn._buildProgress || 0) + 1.5 * dtSeconds;
      if (pawn._buildProgress >= 1) {
        pawn._buildProgress = 0;
        // Spend and place
        pawn.inventory.wood -= cost.wood;
        pawn.inventory.food -= cost.food;
        setTile(game.tiles, target.x, target.y, pawn.job.tile);
        if (pawn.job.tile === TILE.BEACON) game.beaconBuilt = true;
        pawn.job = { kind: JOB.IDLE };
      }
      return;
    }
    case JOB.ATTACK:
    case JOB.HUNT: {
      const target = pawn.job.entity;
      if (!target || target.hp <= 0) { pawn.job = { kind: JOB.IDLE }; return; }
      if (!withinRange(pawn, target, COMBAT.MELEE_RANGE)) {
        if (!pawn.job.path || pawn.job._repathCooldown <= 0) {
          assignMove(pawn, { x: target.x, y: target.y }, game);
          pawn.job._repathCooldown = 0.7; // seconds
        }
        stepAlongPath(pawn, dtSeconds);
        pawn.job._repathCooldown -= dtSeconds;
      } else {
        attackTarget(pawn, target, dtSeconds);
        if (target.hp <= 0 && pawn.job.kind === JOB.HUNT) pawn.inventory.food += 3;
      }
      return;
    }
  }

  // No job: consider needs or pick up queued tasks from player
  if (game.playerOrders.length > 0) {
    const order = game.playerOrders.shift();
    if (order.kind === 'move') assignMove(pawn, { x: order.x, y: order.y }, game);
    if (order.kind === 'gather') pawn.job = { kind: JOB.GATHER, target: { x: order.x, y: order.y } };
    if (order.kind === 'build') pawn.job = { kind: JOB.BUILD, target: { x: order.x, y: order.y }, tile: order.tile, cost: order.cost };
    if (order.kind === 'attack') pawn.job = { kind: JOB.ATTACK, entity: order.entity };
    if (order.kind === 'hunt') pawn.job = { kind: JOB.HUNT, entity: order.entity };
    return;
  }

  // Opportunistic gathering if low food
  if (pawn.needs.hunger < 70 && pawn.inventory.food === 0) {
    const res = findNearestResource(game, pawn, 'food');
    if (res) { pawn.job = { kind: JOB.GATHER, target: { x: res.x, y: res.y } }; return; }
  }

  // Wander
  if (!pawn._wanderTimer || pawn._wanderTimer <= 0) {
    const tx = Math.max(0, Math.min(game.mapWidth - 1, pawn.x + (Math.random() < 0.5 ? -5 : 5)));
    const ty = Math.max(0, Math.min(game.mapHeight - 1, pawn.y + (Math.random() < 0.5 ? -5 : 5)));
    assignMove(pawn, { x: tx, y: ty }, game);
    pawn._wanderTimer = 4 + Math.random() * 4;
  } else {
    pawn._wanderTimer -= dtSeconds;
  }
}

export function updateRaiderAI(game, pawn, dtSeconds) {
  // Attack nearest colonist
  let target = null;
  let best = Infinity;
  for (const c of game.colonists) {
    if (c.hp <= 0) continue;
    const d = Math.abs(c.x - pawn.x) + Math.abs(c.y - pawn.y);
    if (d < best) { best = d; target = c; }
  }
  if (!target) return;
  if (best > COMBAT.MELEE_RANGE) {
    if (!pawn.job.path || pawn.job._repathCooldown <= 0) {
      const path = bfsPath({ x: pawn.x, y: pawn.y }, { x: target.x, y: target.y }, (x, y) => isWalkable(game.tiles, x, y));
      if (path && path.length > 1) pawn.job = { kind: JOB.MOVE, path, pathIndex: 1, _repathCooldown: 0.8 };
    }
    stepAlongPath(pawn, dtSeconds);
    if (pawn.job) pawn.job._repathCooldown -= dtSeconds;
  } else {
    attackTarget(pawn, target, dtSeconds);
  }
}

export function updateAnimalAI(game, pawn, dtSeconds) {
  // Mostly wander. If hunted (target set), flee or fight? For MVP, animals wander.
  if (!pawn._wanderTimer || pawn._wanderTimer <= 0) {
    const tx = Math.max(0, Math.min(game.mapWidth - 1, pawn.x + (Math.random() < 0.5 ? -3 : 3)));
    const ty = Math.max(0, Math.min(game.mapHeight - 1, pawn.y + (Math.random() < 0.5 ? -3 : 3)));
    const path = bfsPath({ x: pawn.x, y: pawn.y }, { x: tx, y: ty }, (x, y) => isWalkable(game.tiles, x, y));
    if (path && path.length > 1) pawn.job = { kind: JOB.MOVE, path, pathIndex: 1 };
    pawn._wanderTimer = 3 + Math.random() * 3;
  } else {
    pawn._wanderTimer -= dtSeconds;
    stepAlongPath(pawn, dtSeconds);
  }
}