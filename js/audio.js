let audioCtx = null;
let musicVolume = 0.5;   // 0..1 (ползунок «Музыка»)
let sfxVolume = 1;       // 0..1 (ползунок «Звуки»)
let musicNodes = [];
let musicTimer = null;
let currentMusicMode = null;
let currentTrackIdx = -1;

function ensureAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch(e) { audioCtx = null; }
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function beep(freq, dur, type='sine', vol=0.06, when=0) {
  if (!audioCtx || sfxVolume <= 0.01) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setValueAtTime(vol * sfxVolume, audioCtx.currentTime + when);
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
  banana:  () => { beep(700, 0.06, 'triangle', 0.07); beep(1000, 0.08, 'triangle', 0.07, 0.05); },
  hit:     () => { beep(150, 0.12, 'sawtooth', 0.09); beep(90, 0.18, 'sawtooth', 0.08, 0.06); },
  die:     () => { beep(440, 0.1, 'sawtooth', 0.08); beep(220, 0.22, 'sawtooth', 0.08, 0.08); beep(110, 0.3, 'sawtooth', 0.07, 0.22); },
  levelUp: () => { beep(600, 0.09, 'sine', 0.07); beep(900, 0.09, 'sine', 0.07, 0.08); beep(1200, 0.14, 'sine', 0.07, 0.16); beep(1600, 0.18, 'sine', 0.07, 0.26); },
  buy:     () => { beep(1000, 0.07, 'triangle', 0.06); beep(1500, 0.08, 'triangle', 0.06, 0.06); beep(2000, 0.12, 'triangle', 0.06, 0.12); },
  unlock:  () => { beep(500, 0.1, 'sine', 0.06); beep(800, 0.1, 'sine', 0.06, 0.08); beep(1100, 0.1, 'sine', 0.06, 0.16); beep(1500, 0.15, 'sine', 0.07, 0.24); },
  start:   () => { beep(600, 0.08, 'square', 0.04); beep(800, 0.08, 'square', 0.04, 0.06); },
  error:   () => { beep(300, 0.12, 'sawtooth', 0.06); beep(180, 0.2, 'sawtooth', 0.06, 0.1); }
};

// ============================================
// 7 ФОНОВЫХ МЕЛОДИЙ
// ============================================
const TRACKS = [
  { // 0 — меню: спокойная
    beat: 0.35,
    chords: [[220,261.63,329.63],[174.61,220,261.63],[196,246.94,293.66],[220,261.63,329.63]],
    melody: [440,0,523.25,493.88,440,0,392,440, 493.88,0,523.25,587.33,523.25,0,440,493.88,
             392,0,440,493.88,523.25,0,587.33,523.25, 440,0,392,440,493.88,0,440,0]
  },
  { // 1 — меню: мечтательная
    beat: 0.33,
    chords: [[261.63,329.63,392],[220,261.63,329.63],[246.94,293.66,349.23],[196,246.94,293.66]],
    melody: [523.25,587.33,659.25,587.33,523.25,0,659.25,698.46, 659.25,587.33,523.25,0,493.88,523.25,587.33,523.25,
             493.88,440,493.88,523.25,587.33,0,523.25,493.88, 440,0,493.88,523.25,587.33,0,523.25,0]
  },
  { // 2 — меню: загадочная
    beat: 0.36,
    chords: [[146.83,174.61,220],[164.81,196,246.94],[138.59,164.81,207.65],[146.83,174.61,220]],
    melody: [293.66,0,349.23,329.63,293.66,0,261.63,293.66, 349.23,0,392,440,392,0,349.23,329.63,
             293.66,0,261.63,293.66,329.63,0,349.23,329.63, 293.66,0,261.63,220,261.63,0,293.66,0]
  },
  { // 3 — игра: энергичная
    beat: 0.28,
    chords: [[196,246.94,293.66],[220,277.18,329.63],[233.08,293.66,349.23],[196,246.94,293.66]],
    melody: [392,440,523.25,440,392,329.63,293.66,329.63, 392,523.25,587.33,523.25,440,392,440,523.25,
             587.33,659.25,587.33,523.25,440,392,349.23,392, 440,523.25,587.33,523.25,440,392,329.63,392]
  },
  { // 4 — игра: быстрая
    beat: 0.24,
    chords: [[164.81,196,246.94],[196,246.94,293.66],[207.65,246.94,311.13],[164.81,196,246.94]],
    melody: [329.63,392,493.88,392,329.63,0,493.88,587.33, 493.88,392,329.63,0,293.66,329.63,392,329.63,
             293.66,246.94,293.66,329.63,392,0,493.88,392, 329.63,0,293.66,329.63,392,0,329.63,0]
  },
  { // 5 — игра: синтвейв
    beat: 0.26,
    chords: [[220,261.63,329.63],[246.94,293.66,349.23],[261.63,329.63,392],[220,261.63,329.63]],
    melody: [440,440,523.25,440,587.33,523.25,493.88,440, 493.88,523.25,587.33,659.25,587.33,523.25,493.88,523.25,
             440,440,523.25,440,587.33,523.25,493.88,493.88, 523.25,0,493.88,440,392,0,440,0]
  },
  { // 6 — игра: напряжённая
    beat: 0.27,
    chords: [[146.83,174.61,220],[164.81,196,246.94],[174.61,220,261.63],[146.83,174.61,220]],
    melody: [293.66,349.23,392,349.23,293.66,261.63,246.94,261.63, 293.66,392,440,392,349.23,293.66,349.23,392,
             440,493.88,440,392,349.23,293.66,261.63,293.66, 349.23,392,349.23,293.66,261.63,246.94,261.63,293.66]
  }
];

// ============================================
// МУЗЫКА
// ============================================
function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  musicNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e) {} });
  musicNodes = [];
  currentMusicMode = null;
}

function playMusicNote(freq, start, dur, vol) {
  if (!audioCtx || musicVolume <= 0.01) return;
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.value = 0;
    g.gain.setValueAtTime(vol * musicVolume * 0.6, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(start);
    o.stop(start + dur + 0.05);
    o.onended = () => { const i = musicNodes.indexOf(o); if (i >= 0) musicNodes.splice(i, 1); };
    musicNodes.push(o);
  } catch(e) {}
}

function startMusic(mode) {
  if (!audioCtx || currentMusicMode === mode) return;
  stopMusic();
  if (musicVolume <= 0.01) { currentMusicMode = mode; return; }

  const pool = mode === 'menu' ? [0, 1, 2] : [3, 4, 5, 6];
  let idx = pool[Math.floor(Math.random() * pool.length)];
  if (idx === currentTrackIdx && pool.length > 1) {
    idx = pool[(pool.indexOf(idx) + 1) % pool.length];
  }
  currentTrackIdx = idx;
  const track = TRACKS[idx];

  const beatLen = track.beat;
  const chordVol = 0.16;
  const melodyVol = 0.3;
  const bassVol = 0.22;

  let step = 0;

  function scheduleBar() {
    if (musicVolume <= 0.01 || !audioCtx) return;
    const chordIdx = Math.floor((step / 8) % track.chords.length);
    const chord = track.chords[chordIdx];

    chord.forEach(f => {
      playMusicNote(f, audioCtx.currentTime, beatLen * 8, chordVol);
      playMusicNote(f * 2, audioCtx.currentTime, beatLen * 8, chordVol * 0.3);
    });

    playMusicNote(chord[0] / 2, audioCtx.currentTime, beatLen * 8, bassVol);

    for (let i = 0; i < 8; i++) {
      const noteIdx = (step + i) % track.melody.length;
      const freq = track.melody[noteIdx];
      if (freq > 0) {
        playMusicNote(freq, audioCtx.currentTime + i * beatLen, beatLen * 0.9, melodyVol);
      }
      if (i % 2 === 0) {
        playMusicNote(80, audioCtx.currentTime + i * beatLen, 0.08, 0.3);
      }
    }

    step += 8;
  }

  scheduleBar();
  const barTime = beatLen * 8 * 1000;
  musicTimer = setInterval(() => {
    if (musicVolume <= 0.01) { stopMusic(); return; }
    scheduleBar();
  }, barTime);

  currentMusicMode = mode;
}

// ============================================
// ГРОМКОСТЬ
// ============================================
function loadVolumes() {
  try {
    const m = localStorage.getItem('snake_vol_m');
    if (m !== null) musicVolume = Math.max(0, Math.min(1, parseInt(m, 10) / 100));
    const s = localStorage.getItem('snake_vol_s');
    if (s !== null) sfxVolume = Math.max(0, Math.min(1, parseInt(s, 10) / 100));
  } catch(e) {}
}

function saveVolumes() {
  try {
    localStorage.setItem('snake_vol_m', String(Math.round(musicVolume * 100)));
    localStorage.setItem('snake_vol_s', String(Math.round(sfxVolume * 100)));
  } catch(e) {}
}