import { MAP_WIDTH, MAP_HEIGHT } from './constants.js';

export function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function inBounds(x, y) {
  return x >= 0 && y >= 0 && x < MAP_WIDTH && y < MAP_HEIGHT;
}

export function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function neighbors4(x, y) {
  return [
    [x + 1, y],
    [x - 1, y],
    [x, y + 1],
    [x, y - 1],
  ];
}

export function bfsPath(start, goal, isWalkable) {
  // Returns array of points from start to goal inclusive, or null
  const key = (x, y) => `${x},${y}`;
  const queue = [start];
  const cameFrom = new Map();
  cameFrom.set(key(start.x, start.y), null);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.x === goal.x && cur.y === goal.y) {
      // reconstruct path
      const path = [];
      let k = key(cur.x, cur.y);
      while (k) {
        const [sx, sy] = k.split(',').map(Number);
        path.push({ x: sx, y: sy });
        k = cameFrom.get(k);
      }
      return path.reverse();
    }
    for (const [nx, ny] of neighbors4(cur.x, cur.y)) {
      if (!inBounds(nx, ny)) continue;
      const nk = key(nx, ny);
      if (cameFrom.has(nk)) continue;
      if (!isWalkable(nx, ny)) continue;
      cameFrom.set(nk, key(cur.x, cur.y));
      queue.push({ x: nx, y: ny });
    }
  }
  return null;
}

export function formatTime(totalMinutes) {
  const day = Math.floor(totalMinutes / (24 * 60)) + 1;
  const minutesToday = Math.floor(totalMinutes % (24 * 60));
  const hours = Math.floor(minutesToday / 60);
  const mins = minutesToday % 60;
  return { day, timeStr: `${hours}:${mins.toString().padStart(2, '0')}` };
}