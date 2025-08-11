import { NEEDS } from './constants.js';

export function updateNeeds(pawn, minutesElapsed, weather) {
  const hungerDecay = NEEDS.HUNGER_DECAY_PER_MIN * minutesElapsed * (weather === 'Heatwave' ? 1.4 : 1);
  const restDecay = NEEDS.REST_DECAY_PER_MIN * minutesElapsed * (weather === 'Rain' ? 0.9 : 1);

  pawn.needs.hunger = Math.max(0, pawn.needs.hunger - hungerDecay);
  pawn.needs.rest = Math.max(0, pawn.needs.rest - restDecay);

  // Mood tweaks
  let moodDelta = NEEDS.MOOD_RECOVERY_PER_MIN * minutesElapsed;
  if (pawn.needs.hunger < 30) moodDelta -= 12 * minutesElapsed;
  if (pawn.needs.rest < 30) moodDelta -= 10 * minutesElapsed;
  if (weather === 'Rain') moodDelta -= 3 * minutesElapsed;

  pawn.needs.mood = Math.max(0, Math.min(100, pawn.needs.mood + moodDelta));
}

export function tryConsumeFood(pawn) {
  if (pawn.inventory.food > 0 && pawn.needs.hunger < 70) {
    pawn.inventory.food -= 1;
    pawn.needs.hunger = Math.min(100, pawn.needs.hunger + NEEDS.HUNGER_EAT_AMOUNT);
    pawn.needs.mood = Math.min(100, pawn.needs.mood + 3);
    return true;
  }
  return false;
}

export function isBreakingDown(pawn, nowMinutes) {
  if (pawn.needs.breakdownUntil > nowMinutes) return true;
  if (pawn.needs.mood <= NEEDS.MOOD_BREAKDOWN_THRESHOLD) {
    pawn.needs.breakdownUntil = nowMinutes + 4; // 4 minutes of breakdown
    return true;
  }
  return false;
}

export function restRecovery(pawn, minutesElapsed, hasShelter) {
  const rate = NEEDS.REST_RECOVERY_RATE * (hasShelter ? 1.6 : 1);
  pawn.needs.rest = Math.min(100, pawn.needs.rest + rate * minutesElapsed);
  pawn.needs.mood = Math.min(100, pawn.needs.mood + 2 * minutesElapsed);
}