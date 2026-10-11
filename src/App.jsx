import React, { useState, useEffect, useRef } from 'react';
import {
  makeRound,
  promptFor,
  praiseFor,
  MAX_DIFFICULTY,
  FLOWERS_PER_LEVEL,
} from './game.js';
import { triggerConfetti, playSound, speak } from './effects.js';

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
    if (childName.trim()) setGameStarted(true);
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
  const [wrongLabel, setWrongLabel] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const timers = useRef([]);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Ask the question whenever a new round appears.
  useEffect(() => {
    speak(promptFor(round.target));
  }, [round]);

  const handleChoice = (choice) => {
    if (celebrating) return;

    if (choice.label !== round.target.label) {
      // No penalty: name what they tapped, then ask again.
      playSound('oops');
      setWrongLabel(choice.label);
      speak(`That's the ${choice.label}. ${promptFor(round.target)}`);
      later(() => setWrongLabel(null), 600);
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
    speak(levelUp ? `${praiseFor(childName)} Your garden is growing!` : praiseFor(childName));

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
        onClick={() => speak(promptFor(round.target))}
        aria-label="Hear the question again"
      >
        <span className="prompt-speaker" aria-hidden="true">🔊</span>
        <span>
          Find the <strong>{round.target.label}</strong>!
        </span>
      </button>

      <div className="choices" key={round.id}>
        {round.choices.map((choice) => (
          <ChoiceButton
            key={choice.label}
            choice={choice}
            wrong={wrongLabel === choice.label}
            correct={celebrating && choice.label === round.target.label}
            dimmed={celebrating && choice.label !== round.target.label}
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
