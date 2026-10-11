# Bloomba 🌸

A tap-to-find game for toddlers. Bloomba says "Can you find the Cat?", and each right answer grows a flower in the child's garden.

- **Wrong taps are never punished.** Bloomba names what was tapped and asks again.
- **Difficulty grows every 5 flowers:** more choices on screen (2 → 3 → 4) and new categories (colors and animals, then shapes, then food and bugs, then vehicles).
- **Spoken prompts** use the browser's built-in text-to-speech. Tap the 🔊 bubble to hear the question again.
- **Progress is saved** in the browser (localStorage).

## Run it

```sh
cd bloomba
npm install
npm run dev     # local dev server
npm run build   # production build in dist/
```

Item lists and level settings are in `src/game.js`.
