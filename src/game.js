// Item pools, grouped by category. Each round picks one category and
// shows several items from it; the child is asked to find one by name.
export const CATEGORIES = {
  colors: [
    { emoji: '🔴', label: 'Red', color: '#FF6B6B' },
    { emoji: '🔵', label: 'Blue', color: '#4D96FF' },
    { emoji: '🟢', label: 'Green', color: '#6BCB77' },
    { emoji: '🟡', label: 'Yellow', color: '#F4C430' },
    { emoji: '🟣', label: 'Purple', color: '#C67BFF' },
    { emoji: '🟠', label: 'Orange', color: '#FF8C42' },
  ],
  animals: [
    { emoji: '🐶', label: 'Doggy', color: '#FFB84C' },
    { emoji: '🐱', label: 'Kitty', color: '#FF6B9D' },
    { emoji: '🐮', label: 'Cow', color: '#95E1D3' },
    { emoji: '🐷', label: 'Piggy', color: '#FF8FAB' },
    { emoji: '🐸', label: 'Froggy', color: '#6BCB77' },
    { emoji: '🦁', label: 'Lion', color: '#F4A259' },
  ],
  shapes: [
    { emoji: '⭐', label: 'Star', color: '#F4C430' },
    { emoji: '❤️', label: 'Heart', color: '#FF6B9D' },
    { emoji: '🌙', label: 'Moon', color: '#7B8CDE' },
    { emoji: '☀️', label: 'Sun', color: '#FF8C42' },
    { emoji: '🔺', label: 'Triangle', color: '#4ECDC4' },
  ],
  food: [
    { emoji: '🍎', label: 'Apple', color: '#FF6B6B' },
    { emoji: '🍌', label: 'Banana', color: '#F4C430' },
    { emoji: '🍓', label: 'Strawberry', color: '#FF6B9D' },
    { emoji: '🥕', label: 'Carrot', color: '#FF8C42' },
    { emoji: '🍪', label: 'Cookie', color: '#C08552' },
  ],
  critters: [
    { emoji: '🦋', label: 'Butterfly', color: '#FF8C42' },
    { emoji: '🐢', label: 'Turtle', color: '#4ECDC4' },
    { emoji: '🐝', label: 'Bee', color: '#F4C430' },
    { emoji: '🐞', label: 'Ladybug', color: '#FF6B6B' },
    { emoji: '🐌', label: 'Snail', color: '#C67BFF' },
  ],
  vehicles: [
    { emoji: '🚗', label: 'Car', color: '#FF6B6B' },
    { emoji: '🚌', label: 'Bus', color: '#F4C430' },
    { emoji: '✈️', label: 'Airplane', color: '#4D96FF' },
    { emoji: '🚂', label: 'Train', color: '#6BCB77' },
    { emoji: '⛵', label: 'Boat', color: '#4ECDC4' },
  ],
};

// Difficulty mixes two dials: more choices on screen, and new categories unlocked.
export const LEVELS = [
  { choices: 2, categories: ['colors', 'animals'] },
  { choices: 3, categories: ['colors', 'animals', 'shapes'] },
  { choices: 3, categories: ['colors', 'animals', 'shapes', 'food', 'critters'] },
  { choices: 4, categories: ['colors', 'animals', 'shapes', 'food', 'critters', 'vehicles'] },
];

export const MAX_DIFFICULTY = LEVELS.length - 1;
export const FLOWERS_PER_LEVEL = 5;

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

// Build a round: a set of choices plus the one the child should find.
// Avoids repeating the previous target so the game doesn't feel stuck.
export function makeRound(difficulty, previousTarget) {
  const level = LEVELS[Math.min(difficulty, MAX_DIFFICULTY)];
  const category = pick(level.categories);
  const pool = CATEGORIES[category];
  const choices = shuffle(pool).slice(0, level.choices);
  const candidates = choices.filter((c) => c.label !== previousTarget?.label);
  const target = pick(candidates.length ? candidates : choices);
  return { id: Math.random(), choices, target };
}

const PRAISE = ['Great job', 'You did it', 'Wonderful', 'Yay', 'Super', 'Amazing'];

export function praiseFor(name) {
  return `${pick(PRAISE)}, ${name}!`;
}

export function promptFor(target) {
  return `Can you find the ${target.label}?`;
}
