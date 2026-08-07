let audioCtx = null;
let musicEnabled = true;
let musicVolume = 0.25;
let musicNodes = [];
let musicTimer = null;
let currentMusicMode = null;

function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, dur, type='sine', vol=0.06, when=0) {
  if (!audioCtx) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setValueAtTime(vol, audioCtx.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + when + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(audioCtx.currentTime + when);
    o.stop(audioCtx.currentTime + when + dur + 0.02);
  } catch(e) {}
}

const SFX = {
  click:   () => beep(700, 0.05, 'square', 0.04),
  hover:   () => beep(500, 0.03, 'sine', 0.02),
  eat:     () => { beep(900, 0.06, 'sine', 0.07); beep(1300, 0.08, 'sine', 0.06, 0.04); },
  bonus:   () => { beep(800, 0.07, 'triangle', 0.06); beep(1200, 0.07, 'triangle', 0.06, 0.05); beep(1600, 0.1, 'triangle', 0.06, 0.1); },
  die:     () => { beep(440, 0.1, 'sawtooth', 0.08); beep(220, 0.22, 'sawtooth', 0.08, 0.08); beep(110, 0.3, 'sawtooth', 0.07, 0.22); },
  levelUp: () => { beep(600, 0.09, 'sine', 0.07); beep(900, 0.09, 'sine', 0.07, 0.08); beep(1200, 0.14, 'sine', 0.07, 0.16); beep(1600, 0.18, 'sine', 0.07, 0.26); },
  buy:     () => { beep(1000, 0.07, 'triangle', 0.06); beep(1500, 0.08, 'triangle', 0.06, 0.06); beep(2000, 0.12, 'triangle', 0.06, 0.12); },
  unlock:  () => { beep(500, 0.1, 'sine', 0.06); beep(800, 0.1, 'sine', 0.06, 0.08); beep(1100, 0.1, 'sine', 0.06, 0.16); beep(1500, 0.15, 'sine', 0.07, 0.24); },
  start:   () => { beep(600, 0.08, 'square', 0.04); beep(800, 0.08, 'square', 0.04, 0.06); },
  error:   () => { beep(300, 0.12, 'sawtooth', 0.06); beep(180, 0.2, 'sawtooth', 0.06, 0.1); }
};

// ============================================
// ФОНОВАЯ МУЗЫКА (процедурная)
// ============================================
function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  musicNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e) {} });
  musicNodes = [];
  currentMusicMode = null;
}

function playMusicNote(freq, start, dur, type, vol) {
  if (!audioCtx || !musicEnabled) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setValueAtTime(vol * musicVolume, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(start);
    o.stop(start + dur + 0.05);
    o.onended = () => { const i = musicNodes.indexOf(o); if (i >= 0) musicNodes.splice(i, 1); };
    musicNodes.push(o);
  } catch(e) {}
}

// Мелодия для МЕНЮ (спокойная)
const MENU_CHORDS = [
  [261.63, 311.13, 392.00],
  [293.66, 349.23, 440.00],
  [329.63, 392.00, 493.88],
  [261.63, 311.13, 392.00]
];
const MENU_MELODY = [
  523.25, 0, 622.25, 587.33, 523.25, 0, 466.16, 523.25,
  587.33, 0, 622.25, 698.46, 622.25, 0, 523.25, 587.33,
  466.16, 0, 523.25, 587.33, 622.25, 0, 698.46, 622.25,
  523.25, 0, 466.16, 523.25, 587.33, 0, 523.25, 0
];

// Мелодия для ИГРЫ (динамичная)
const GAME_CHORDS = [
  [196.00, 246.94, 293.66],
  [220.00, 277.18, 329.63],
  [233.08, 293.66, 349.23],
  [196.00, 246.94, 293.66]
];
const GAME_MELODY = [
  392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 293.66, 329.63,
  392.00, 523.25, 587.33, 523.25, 440.00, 392.00, 440.00, 523.25,
  587.33, 659.25, 587.33, 523.25, 440.00, 392.00, 349.23, 392.00,
  440.00, 523.25, 587.33, 523.25, 440.00, 392.00, 329.63, 392.00
];

function startMusic(mode) {
  if (!audioCtx || currentMusicMode === mode) return;
  stopMusic();
  if (!musicEnabled) { currentMusicMode = mode; return; }

  const chords = mode === 'menu' ? MENU_CHORDS : GAME_CHORDS;
  const melody = mode === 'menu' ? MENU_MELODY : GAME_MELODY;
  const beatLen = mode === 'menu' ? 0.35 : 0.28;
  const chordVol = mode === 'menu' ? 0.15 : 0.18;
  const melodyVol = mode === 'menu' ? 0.25 : 0.32;
  const bassVol = 0.22;

  let step = 0;

  function scheduleBar() {
    if (!musicEnabled || !audioCtx) return;
    const chordIdx = Math.floor((step / 8) % chords.length);
    const chord = chords[chordIdx];

    // Аккорд (пад)
    chord.forEach(f => {
      playMusicNote(f, audioCtx.currentTime, beatLen * 8, 'sine', chordVol);
      playMusicNote(f * 2, audioCtx.currentTime, beatLen * 8, 'sine', chordVol * 0.3);
    });

    // Бас
    playMusicNote(chord[0] / 2, audioCtx.currentTime, beatLen * 8, 'triangle', bassVol);

    // Мелодия + ритм на 8 шагов
    for (let i = 0; i < 8; i++) {
      const noteIdx = (step + i) % melody.length;
      const freq = melody[noteIdx];
      if (freq > 0) {
        playMusicNote(freq, audioCtx.currentTime + i * beatLen, beatLen * 0.9, 'triangle', melodyVol);
      }
      if (i % 2 === 0) {
        playMusicNote(80, audioCtx.currentTime + i * beatLen, 0.08, 'sine', 0.3);
      }
    }

    step += 8;
  }

  scheduleBar();
  const barTime = beatLen * 8 * 1000;
  musicTimer = setInterval(() => {
    if (!musicEnabled) { stopMusic(); return; }
    scheduleBar();
  }, barTime);

  currentMusicMode = mode;
}

function toggleMusic() {
  musicEnabled = !musicEnabled;
  saveMusicState();
  const m = currentMusicMode || 'menu';
  stopMusic();
  if (musicEnabled) startMusic(m);
  SFX.click();
}

function loadMusicState() {
  try {
    const v = localStorage.getItem('snake_music');
    if (v !== null) musicEnabled = v === '1';
    const vol = localStorage.getItem('snake_volume');
    if (vol !== null) musicVolume = parseFloat(vol);
  } catch(e) {}
}

function saveMusicState() {
  try {
    localStorage.setItem('snake_music', musicEnabled ? '1' : '0');
    localStorage.setItem('snake_volume', String(musicVolume));
  } catch(e) {}
}