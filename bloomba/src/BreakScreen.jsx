import React, { useEffect, useState } from 'react';
import { BREAK_MIN_SECONDS, lines } from './game.js';
import { playTune, say, unlockAudio } from './effects.js';

// A drawn puppy that bounces, wags, flaps its ears and lifts its paws.
// All the movement is CSS (see "Break" in styles.css).
function DancingDog() {
  return (
    <svg className="dog" viewBox="0 0 200 230" role="img" aria-label="A puppy dancing">
      <ellipse className="dog-shadow" cx="100" cy="218" rx="52" ry="8" fill="rgba(0,0,0,0.15)" />
      <g className="dog-bounce">
        <g className="dog-tail">
          <path d="M138 150 C160 140 168 118 160 104" stroke="#C98A4B" strokeWidth="12" fill="none" strokeLinecap="round" />
        </g>
        <rect className="dog-leg back-left" x="70" y="170" width="18" height="38" rx="9" fill="#D99A5B" />
        <rect className="dog-leg back-right" x="112" y="170" width="18" height="38" rx="9" fill="#D99A5B" />
        <ellipse cx="100" cy="155" rx="44" ry="36" fill="#E8B57A" />
        <ellipse cx="100" cy="164" rx="26" ry="22" fill="#F7DDB7" />
        <g className="dog-paw left">
          <rect x="60" y="140" width="18" height="44" rx="9" fill="#E8B57A" />
          <ellipse cx="69" cy="183" rx="11" ry="7" fill="#F7DDB7" />
        </g>
        <g className="dog-paw right">
          <rect x="122" y="140" width="18" height="44" rx="9" fill="#E8B57A" />
          <ellipse cx="131" cy="183" rx="11" ry="7" fill="#F7DDB7" />
        </g>
        <rect x="74" y="116" width="52" height="10" rx="5" fill="#FF6B6B" />
        <circle cx="100" cy="130" r="6" fill="#FFD93D" />
        <g className="dog-head">
          <g className="dog-ear left">
            <ellipse cx="58" cy="78" rx="16" ry="30" fill="#A0663A" transform="rotate(20 58 78)" />
          </g>
          <g className="dog-ear right">
            <ellipse cx="142" cy="78" rx="16" ry="30" fill="#A0663A" transform="rotate(-20 142 78)" />
          </g>
          <circle cx="100" cy="80" r="44" fill="#E8B57A" />
          <ellipse cx="100" cy="98" rx="26" ry="20" fill="#F7DDB7" />
          <ellipse cx="118" cy="62" rx="12" ry="10" fill="#D99A5B" />
          <g className="dog-eyes">
            <circle cx="84" cy="72" r="7" fill="#2B1B10" />
            <circle cx="116" cy="72" r="7" fill="#2B1B10" />
            <circle cx="86" cy="69" r="2.4" fill="#fff" />
            <circle cx="118" cy="69" r="2.4" fill="#fff" />
          </g>
          <ellipse cx="100" cy="90" rx="9" ry="6.5" fill="#2B1B10" />
          <path d="M88 100 Q100 110 112 100" stroke="#2B1B10" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path className="dog-tongue" d="M95 104 Q100 120 105 104z" fill="#FF7A9C" />
          <circle cx="74" cy="94" r="6" fill="#FF9EB5" opacity="0.6" />
          <circle cx="126" cy="94" r="6" fill="#FF9EB5" opacity="0.6" />
        </g>
      </g>
    </svg>
  );
}

const NOTES = ['♪', '♫', '♪', '♬', '♫', '♪'];

export default function BreakScreen({ childName, onKeepPlaying, onDone }) {
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    say(lines.takeBreak);
    const stopTune = playTune();
    const timer = setTimeout(() => setCanContinue(true), BREAK_MIN_SECONDS * 1000);
    return () => {
      stopTune();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="break-screen">
      <h2 className="break-title">Time for a break!</h2>
      <p className="break-sub">Let's dance, {childName}!</p>
      <div className="dog-stage">
        {NOTES.map((note, i) => (
          <span key={i} className="music-note" style={{ left: `${8 + i * 16}%`, animationDelay: `${i * 0.7}s` }} aria-hidden="true">
            {note}
          </span>
        ))}
        <DancingDog />
      </div>
      {canContinue ? (
        <div className="round-actions">
          <button
            className="start-button"
            onClick={() => {
              unlockAudio();
              onKeepPlaying();
            }}
          >
            Keep playing 🌼
          </button>
          <button className="done-button" onClick={onDone}>
            Done for now
          </button>
        </div>
      ) : (
        <p className="break-wait">Stretch, wiggle and dance along!</p>
      )}
    </div>
  );
}
