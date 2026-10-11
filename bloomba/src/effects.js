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
  // iOS reports 'interrupted' after a phone call or switching apps.
  if (audioContext.state !== 'running') audioContext.resume().catch(() => {});
  return audioContext;
}

// Browsers only allow sound after the child has tapped something, so call this
// from every tap handler. On iPhone, the "playback" session makes the game
// audible even when the ring/silent switch is on silent.
export function unlockAudio() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch {}
  // iPhones can leave the audio frozen ("interrupted" or "suspended") after
  // switching apps, a call or the screen dimming, and resume() doesn't always
  // bring it back. A tap is allowed to start fresh audio, so swap in a new
  // context. Decoded clips are kept: they work with any context.
  if (audioContext && audioContext.state !== 'running') {
    const stale = audioContext;
    audioContext = null;
    stale.close?.().catch(() => {});
  }
  const ctx = getAudio();
  if (!ctx) return;
  // A one-sample silent buffer started inside the tap unlocks iOS Safari.
  const source = ctx.createBufferSource();
  source.buffer = ctx.createBuffer(1, 1, 22050);
  source.connect(ctx.destination);
  source.start(0);
}

// Coming back to the page: try to wake the audio straight away. If the phone
// refuses, the next tap starts fresh audio (see unlockAudio).
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && audioContext && audioContext.state !== 'running') {
      audioContext.resume().catch(() => {});
    }
  });
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

// ---------- Voice ----------
// Spoken lines are recorded clips in public/voice. If a clip can't load or
// decode, fall back to the browser's own text-to-speech for that line.

const clipCache = new Map();
let currentSource = null;
let playToken = 0;

function loadClip(name) {
  if (!clipCache.has(name)) {
    const ctx = getAudio();
    const promise = fetch(`${import.meta.env.BASE_URL}voice/${name}.mp3`)
      .then((res) => {
        if (!res.ok) throw new Error(`clip ${name}: ${res.status}`);
        return res.arrayBuffer();
      })
      // Callback form: older Safari doesn't return a promise from decodeAudioData.
      .then((data) => new Promise((resolve, reject) => ctx.decodeAudioData(data, resolve, reject)));
    promise.catch(() => clipCache.delete(name));
    clipCache.set(name, promise);
  }
  return clipCache.get(name);
}

export function preloadLines(lines) {
  if (!getAudio()) return;
  lines.forEach((line) => loadClip(line.clip).catch(() => {}));
}

function playBuffer(ctx, buffer) {
  return new Promise((resolve) => {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = resolve;
    // If the audio freezes mid-clip, onended never fires; don't let the
    // rest of the line wait forever.
    setTimeout(resolve, buffer.duration * 1000 + 500);
    currentSource = source;
    source.start();
  });
}

function speakFallback(text) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.onend = resolve;
    utterance.onerror = resolve;
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  playToken++;
  try {
    currentSource?.stop();
  } catch {}
  currentSource = null;
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

// Say one or more lines in order, interrupting anything already being said.
export async function say(...lines) {
  stopSpeaking();
  const token = playToken;
  const ctx = getAudio();
  for (const line of lines) {
    if (token !== playToken) return;
    let buffer = null;
    if (ctx) buffer = await loadClip(line.clip).catch(() => null);
    if (token !== playToken) return;
    if (buffer) await playBuffer(ctx, buffer);
    else await speakFallback(line.text);
  }
}
