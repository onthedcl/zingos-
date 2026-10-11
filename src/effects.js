// Confetti, sounds and speech. All of these are best-effort: if the browser
// doesn't support something, the game keeps working silently.

const CONFETTI = ['✨', '🌸', '🌼', '⭐', '💖'];

export function triggerConfetti() {
  for (let i = 0; i < 24; i++) {
    const piece = document.createElement('div');
    piece.textContent = CONFETTI[Math.floor(Math.random() * CONFETTI.length)];
    piece.className = 'confetti';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.fontSize = Math.random() * 20 + 20 + 'px';
    document.body.appendChild(piece);
    const duration = (Math.random() * 1.5 + 1) * 1000;
    const drift = (Math.random() - 0.5) * 200;
    const animation = piece.animate(
      [
        { transform: 'translate(0, -40px) rotate(0deg)', opacity: 1 },
        { transform: `translate(${drift}px, 100vh) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration, easing: 'ease-in' }
    );
    animation.onfinish = () => piece.remove();
  }
}

let audioContext;

function getAudio() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function tone(ctx, frequency, start, length, volume = 0.15) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(volume, ctx.currentTime + start);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + length);
  oscillator.start(ctx.currentTime + start);
  oscillator.stop(ctx.currentTime + start + length);
}

export function playSound(type) {
  const ctx = getAudio();
  if (!ctx) return;
  if (type === 'success') {
    // C-E-G arpeggio
    tone(ctx, 523.25, 0, 0.15);
    tone(ctx, 659.25, 0.1, 0.15);
    tone(ctx, 783.99, 0.2, 0.3);
  } else if (type === 'levelup') {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(ctx, f, i * 0.12, 0.25));
  } else if (type === 'oops') {
    tone(ctx, 330, 0, 0.2, 0.08);
  }
}

export function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  utterance.pitch = 1.3;
  window.speechSynthesis.speak(utterance);
}
