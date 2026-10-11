import React, { useState, useEffect, useRef } from 'react';
import { makeRound, lines, MAX_DIFFICULTY, FLOWERS_PER_LEVEL } from './game.js';
import { triggerConfetti, playSound, unlockAudio, say, preloadLines, stopSpeaking } from './effects.js';

const STORAGE_KEY = 'bloomba-state';

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export default function Bloomba() {
  const [saved] = useState(loadState);
  const [childName, setChildName] = useState(saved.childName || '');
  const [gameStarted, setGameStarted] = useState(false);
  const [flowers, setFlowers] = useState(saved.flowers || 0);
  const [difficulty, setDifficulty] = useState(saved.difficulty || 0);

  useEffect(() => {
    if (!gameStarted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ childName, flowers, difficulty }));
    } catch {
      // Storage unavailable (private mode etc.) — progress just won't persist.
    }
  }, [childName, flowers, difficulty, gameStarted]);

  const handleStartGame = (e) => {
    e.preventDefault();
    if (!childName.trim()) return;
    unlockAudio();
    setGameStarted(true);
  };

  const handleReset = () => {
    setFlowers(0);
    setDifficulty(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  if (!gameStarted) {
    return (
      <div className="setup">
        <form className="setup-content" onSubmit={handleStartGame}>
          <div className="logo" aria-hidden="true">🌸</div>
          <h1 className="title">Bloomba</h1>
          <p className="subtitle">What's your name?</p>
          <input
            className="name-input"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Type a name"
            maxLength={20}
            autoFocus
          />
          <button className="start-button" type="submit" disabled={!childName.trim()}>
            Let's play! 🌼
          </button>
          {flowers > 0 && (
            <div className="saved-garden">
              <span>Your garden has {flowers} 🌸</span>
              <button type="button" className="reset-button" onClick={handleReset}>
                Start a new garden
              </button>
            </div>
          )}
        </form>
      </div>
    );
  }

  return (
    <GameScreen
      childName={childName.trim()}
      flowers={flowers}
      setFlowers={setFlowers}
      difficulty={difficulty}
      setDifficulty={setDifficulty}
      onExit={() => setGameStarted(false)}
    />
  );
}

function GameScreen({ childName, flowers, setFlowers, difficulty, setDifficulty, onExit }) {
  const [round, setRound] = useState(() => makeRound(difficulty));
  const [wrongId, setWrongId] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const timers = useRef([]);
  const welcomed = useRef(false);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      stopSpeaking();
    },
    []
  );

  // Ask the question whenever a new round appears (with a hello the first time).
  useEffect(() => {
    preloadLines([...round.choices.map(lines.thatsThe), lines.levelup]);
    if (welcomed.current) {
      say(lines.find(round.target));
    } else {
      welcomed.current = true;
      say(lines.welcome, lines.find(round.target));
    }
  }, [round]);

  const handleChoice = (choice) => {
    if (celebrating) return;
    unlockAudio(); // re-wake audio if the phone suspended it

    if (choice.id !== round.target.id) {
      // No penalty: name what they tapped, then ask again.
      playSound('oops');
      setWrongId(choice.id);
      say(lines.thatsThe(choice), lines.find(round.target));
      later(() => setWrongId(null), 600);
      return;
    }

    const newFlowers = flowers + 1;
    const levelUp = newFlowers % FLOWERS_PER_LEVEL === 0 && difficulty < MAX_DIFFICULTY;
    const nextDifficulty = levelUp ? difficulty + 1 : difficulty;

    setFlowers(newFlowers);
    if (levelUp) setDifficulty(nextDifficulty);
    setCelebrating(true);
    triggerConfetti();
    playSound(levelUp ? 'levelup' : 'success');
    say(levelUp ? lines.levelup : lines.praise());

    later(() => {
      setCelebrating(false);
      setRound(makeRound(nextDifficulty, round.target));
    }, 1800);
  };

  return (
    <div className="game">
      <header className="header">
        <button className="icon-button" onClick={onExit} aria-label="Back to start">
          🏠
        </button>
        <h2 className="greeting">Hi {childName}! 👋</h2>
        <div className="flower-counter" aria-label={`${flowers} flowers`}>
          🌸 {flowers}
        </div>
      </header>

      <button
        className="prompt"
        onClick={() => {
          unlockAudio();
          say(lines.find(round.target));
        }}
        aria-label="Hear the question again"
      >
        <span className="prompt-speaker" aria-hidden="true">🔊</span>
        <span>
          Find {round.target.spoken.slice(0, -round.target.label.length)}
          <strong>{round.target.label}</strong>!
        </span>
      </button>

      <div className="choices" key={round.id}>
        {round.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            wrong={wrongId === choice.id}
            correct={celebrating && choice.id === round.target.id}
            dimmed={celebrating && choice.id !== round.target.id}
            onPress={() => handleChoice(choice)}
          />
        ))}
      </div>

      <section className="garden">
        <h3 className="garden-title">Your Garden 🌼</h3>
        <div className="flower-grid">
          {flowers === 0 && <span className="garden-empty">Find things to grow flowers!</span>}
          {Array.from({ length: flowers }).map((_, i) => (
            <span key={i} className="flower-bloom">
              {GARDEN_FLOWERS[i % GARDEN_FLOWERS.length]}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

const GARDEN_FLOWERS = ['🌸', '🌼', '🌷', '🌻', '🌺', '💐'];

function ChoiceButton({ choice, onPress, wrong, correct, dimmed }) {
  const className = ['choice', wrong && 'wiggle', correct && 'bounce', dimmed && 'dimmed']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      className={className}
      style={{ background: choice.color }}
      onClick={onPress}
      aria-label={choice.label}
    >
      <span className="choice-emoji">{choice.emoji}</span>
      <span className="choice-label">{choice.label}</span>
    </button>
  );
}
