import { Game } from './game.js';

const canvas = document.getElementById('game');
const game = new Game(canvas);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // cap 50ms
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Expose for debugging in console
window.game = game;