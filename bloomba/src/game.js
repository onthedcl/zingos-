// Item pools, grouped by category, live in items.json so the voice script
// (scripts/make_voice.py) can read the same list. Each round picks one
// category and shows several items from it; the child finds one by name.
import CATEGORIES from './items.json';
import PHRASES from './phrases.json';

export { CATEGORIES };

// Difficulty mixes two dials: more choices on screen, and new categories unlocked.
export const LEVELS = [
  { choices: 2, categories: ['colors', 'animals'] },
  { choices: 3, categories: ['colors', 'animals', 'vehicles'] },
  { choices: 3, categories: ['colors', 'animals', 'vehicles', 'shapes'] },
  { choices: 4, categories: ['colors', 'animals', 'vehicles', 'shapes', 'food', 'critters'] },
];

export const MAX_DIFFICULTY = LEVELS.length - 1;
// Questions per round; difficulty goes up by one level after each finished round.
export const ROUND_LENGTH = 5;
// After this many right answers, the next round end is a dance break.
export const BREAK_AFTER = 40;
// How long the break lasts before a grown-up can tap "Keep playing".
export const BREAK_MIN_SECONDS = 60;

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Items that look too alike for a toddler (e.g. a tabby cat and a lion) list
// each other in `notWith`; they never appear together in one round.
function clashes(a, b) {
  return a.notWith?.includes(b.id) || b.notWith?.includes(a.id);
}

function pickChoices(pool, count) {
  const chosen = [];
  for (const item of shuffle(pool)) {
    if (chosen.length === count) break;
    if (!chosen.some((other) => clashes(item, other))) chosen.push(item);
  }
  return chosen;
}

// Build a round: a set of choices plus the one the child should find.
// Avoids repeating the previous target so the game doesn't feel stuck.
export function makeRound(difficulty, previousTarget) {
  const level = LEVELS[Math.min(difficulty, MAX_DIFFICULTY)];
  const category = pick(level.categories);
  const pool = CATEGORIES[category];
  const choices = pickChoices(pool, level.choices);
  const candidates = choices.filter((c) => c.id !== previousTarget?.id);
  const target = pick(candidates.length ? candidates : choices);
  return { id: Math.random(), choices, target };
}

// Every spoken line has a recorded clip in public/voice, made from these same
// texts by scripts/make_voice.py. A line is { clip, text }: the text is the
// fallback if the clip can't play.
export const lines = {
  welcome: { clip: 'welcome', text: PHRASES.welcome },
  roundDone: { clip: 'round-done', text: PHRASES.roundDone },
  takeBreak: { clip: 'take-break', text: PHRASES.takeBreak },
  find: (item) => ({ clip: `find-${item.id}`, text: `Can you find ${item.spoken}?` }),
  thatsThe: (item) => ({ clip: `thats-${item.id}`, text: `That's ${item.spoken}!` }),
  praise: () => {
    const index = Math.floor(Math.random() * PHRASES.praise.length);
    return { clip: `praise-${index}`, text: PHRASES.praise[index] };
  },
};
