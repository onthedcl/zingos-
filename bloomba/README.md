# Bloomba 🌸

A tap-to-find game for toddlers. Bloomba says "Can you find the Cat?", and each right answer grows a flower in the child's garden.

- **Wrong taps are never punished.** Bloomba names what was tapped and asks again.
- **Rounds of 5:** dots show progress. Each finished round ends on a "Round done!" screen where the new flowers pop into the garden, with "Play again" or "Done for now".
- **A drawn garden:** sky, sun, clouds and a flower bed. Each right answer plants a flower, and each round's flowers get their own colour and style.
- **Difficulty grows every round:** more choices on screen (2 → 3 → 4) and new categories (colors and animals, then vehicles, then shapes, then food and bugs).
- **Dance breaks:** after 40 right answers (8 rounds), a cartoon puppy dances to a little tune. After a minute, a grown-up can tap "Keep playing". Change `BREAK_AFTER` and `BREAK_MIN_SECONDS` in `src/game.js` to adjust.
- **Spoken prompts** are recorded voice clips (made with `scripts/make_voice.py`). Tap the 🔊 bubble to hear the question again.
- **Progress is saved** in the browser (localStorage).

## Run it

```sh
cd bloomba
npm install
npm run dev     # local dev server
npm run build   # production build in dist/
```

Item lists and level settings are in `src/game.js`.
