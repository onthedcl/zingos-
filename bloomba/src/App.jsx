import React, { useState, useEffect, useRef } from 'react';
import { makeRound, lines, MAX_DIFFICULTY, ROUND_LENGTH, BREAK_AFTER } from './game.js';
import BreakScreen from './BreakScreen.jsx';
import Garden from './Garden.jsx';
import { Picture, Credits, hasCredits, preloadPhotos } from './Picture.jsx';
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
  const [showCredits, setShowCredits] = useState(false);
  // Right answers since the last dance break (resets when the page is reopened).
  const [sinceBreak, setSinceBreak] = useState(0);

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
    preloadPhotos();
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
              <div className="setup-garden">
                <Garden flowers={flowers} />
              </div>
              <span>Your garden has {flowers} flower{flowers === 1 ? '' : 's'}</span>
              <button type="button" className="reset-button" onClick={handleReset}>
                Start a new garden
              </button>
            </div>
          )}
          {hasCredits() && (
            <button type="button" className="credits-link" onClick={() => setShowCredits(true)}>
              Photo credits
            </button>
          )}
        </form>
        {showCredits && <Credits onClose={() => setShowCredits(false)} />}
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
      sinceBreak={sinceBreak}
      setSinceBreak={setSinceBreak}
      onExit={() => setGameStarted(false)}
    />
  );
}

function GameScreen({ childName, flowers, setFlowers, difficulty, setDifficulty, sinceBreak, setSinceBreak, onExit }) {
  const [question, setQuestion] = useState(() => makeRound(difficulty));
  const [answered, setAnswered] = useState(0); // right answers so far this round
  const [roundStart, setRoundStart] = useState(flowers); // garden size when the round began
  const [roundDone, setRoundDone] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
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

  // Ask the question whenever a new one appears (with a hello the first time).
  useEffect(() => {
    preloadLines([...question.choices.map(lines.thatsThe), lines.roundDone]);
    if (welcomed.current) {
      say(lines.find(question.target));
    } else {
      welcomed.current = true;
      say(lines.welcome, lines.find(question.target));
    }
  }, [question]);

  const handleChoice = (choice) => {
    if (celebrating) return;
    unlockAudio(); // re-wake audio if the phone suspended it

    if (choice.id !== question.target.id) {
      // No penalty: name what they tapped, then ask again.
      playSound('oops');
      setWrongId(choice.id);
      say(lines.thatsThe(choice), lines.find(question.target));
      later(() => setWrongId(null), 600);
      return;
    }

    const newAnswered = answered + 1;
    const newSinceBreak = sinceBreak + 1;
    setFlowers(flowers + 1);
    setSinceBreak(newSinceBreak);
    setAnswered(newAnswered);
    setCelebrating(true);
    triggerConfetti();
    playSound('success');
    say(lines.praise());

    if (newAnswered < ROUND_LENGTH) {
      later(() => {
        setCelebrating(false);
        setQuestion(makeRound(difficulty, question.target));
      }, 1800);
      return;
    }

    // Last question of the round: a dance break if it's been a while,
    // otherwise the garden celebration.
    later(() => {
      setCelebrating(false);
      if (difficulty < MAX_DIFFICULTY) setDifficulty(difficulty + 1);
      if (newSinceBreak >= BREAK_AFTER) {
        setOnBreak(true);
        return;
      }
      setRoundDone(true);
      triggerConfetti();
      playSound('levelup');
      say(lines.roundDone);
    }, 1500);
  };

  const playAgain = () => {
    unlockAudio();
    setAnswered(0);
    setRoundStart(flowers);
    setRoundDone(false);
    setQuestion(makeRound(difficulty));
  };

  if (onBreak) {
    return (
      <BreakScreen
        childName={childName}
        onKeepPlaying={() => {
          setSinceBreak(0);
          setOnBreak(false);
          playAgain();
        }}
        onDone={() => {
          setSinceBreak(0);
          onExit();
        }}
      />
    );
  }

  if (roundDone) {
    return (
      <div className="round-done">
        <h2 className="round-title">Round done!</h2>
        <p className="round-sub">
          {childName}'s garden has {flowers} flower{flowers === 1 ? '' : 's'}
        </p>
        <div className="round-garden">
          <Garden flowers={flowers} newFrom={roundStart} />
        </div>
        <div className="round-actions">
          <button className="start-button" onClick={playAgain}>
            Play again 🌼
          </button>
          <button className="done-button" onClick={onExit}>
            Done for now
          </button>
        </div>
      </div>
    );
  }

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
          say(lines.find(question.target));
        }}
        aria-label="Hear the question again"
      >
        <span className="prompt-speaker" aria-hidden="true">🔊</span>
        <span>
          Find {question.target.spoken.slice(0, -question.target.label.length)}
          {question.target.kind === 'color' ? (
            // Colour words are shown in their own colour ("Blue" in blue).
            <strong className="color-word" style={{ color: question.target.color }}>
              {question.target.label}
            </strong>
          ) : (
            <strong>{question.target.label}</strong>
          )}
          !
        </span>
      </button>

      <div className="round-progress" aria-label={`${answered} of ${ROUND_LENGTH} found this round`}>
        {Array.from({ length: ROUND_LENGTH }).map((_, i) => (
          <span key={i} className={`progress-dot${i < answered ? ' done' : ''}`} />
        ))}
      </div>

      <div className="choices" key={question.id}>
        {question.choices.map((choice) => (
          <ChoiceButton
            key={choice.id}
            choice={choice}
            wrong={wrongId === choice.id}
            correct={celebrating && choice.id === question.target.id}
            dimmed={celebrating && choice.id !== question.target.id}
            onPress={() => handleChoice(choice)}
          />
        ))}
      </div>

      <section className="garden">
        <Garden flowers={flowers} newFrom={roundStart} compact />
      </section>
    </div>
  );
}

function ChoiceButton({ choice, onPress, wrong, correct, dimmed }) {
  const className = ['choice', choice.photo && 'has-photo', wrong && 'wiggle', correct && 'bounce', dimmed && 'dimmed']
    .filter(Boolean)
    .join(' ');
  return (
    <button
      className={className}
      style={{ background: choice.color }}
      onClick={onPress}
      aria-label={choice.label}
    >
      <Picture item={choice} />
      <span className={`choice-label${choice.label.length > 10 ? ' long' : ''}`}>{choice.label}</span>
    </button>
  );
}
