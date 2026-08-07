const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wallKey = (x, y) => x + ',' + y;

function canvasPos(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  return { x: (clientX - r.left) * (WIDTH / r.width), y: (clientY - r.top) * (HEIGHT / r.height) };
}

function randomNick() { return NICK_BASE[randInt(0, NICK_BASE.length - 1)] + '_' + randInt(100, 999); }

function sanitizeNick(s) {
  s = (s || '').replace(/\s+/g, ' ').trim().replace(/[<>]/g, '');
  return s.length > 14 ? s.slice(0, 14) : s;
}

function weekStartMs() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d.getTime();
}
function weekBest() {
  const ws = weekStartMs();
  const a = getScores().filter(e => (e.d || 0) >= ws);
  return a.length ? a[0].s : 0;
}
function topScore() {
  const a = getScores();
  return a.length ? a[0].s : 0;
}
function modeLabel(m) { return m === 'hard' ? 'Hard' : m === 'level' ? 'Level' : 'Classic'; }
function logScore(sc, m) {
  if (sc <= 0) return;
  const a = getScores().slice();
  a.push({ s: sc, m: m, d: Date.now(), n: nick, av: avatarId, fr: currentFrame().id });
  a.sort((x, y) => y.s - x.s);
  saveScores(a.slice(0, 50));
}
function coinsFromScore(sc) { return Math.floor(sc * COIN_RATE); }

function appleScore(sec) {
  if (sec < 60) return 10;
  if (sec < 120) return 12;
  if (sec < 180) return 13;
  if (mode === 'hard' && sec >= 300) return 17;
  return 15;
}
function multText(sec) {
  const s = appleScore(sec);
  if (s === 10) return 'x1.0';
  if (s === 12) return 'x1.2';
  if (s === 13) return 'x1.3';
  if (s === 17) return 'x1.7';
  return 'x1.5';
}

function currentSkin() { return SKINS.find(s => s.id === skinId) || SKINS[0]; }
function currentTheme() { return THEMES.find(t => t.id === themeId) || THEMES[0]; }
function currentAvatar() { return AVATARS.find(a => a.id === avatarId) || AVATARS[0]; }
function currentFrame() {
  let best = FRAMES[0];
  for (const f of FRAMES) {
    if (f.level <= maxLevel && f.level >= best.level) best = f;
  }
  return best;
}

function segColor(sk, i, now) {
  if (sk.rainbow) return 'hsl(' + Math.floor((i * 12 + now / 10) % 360) + ',85%,55%)';
  return sk.body;
}
function headColorOf(sk, now) {
  if (sk.rainbow) return 'hsl(' + Math.floor((now / 10) % 360) + ',85%,60%)';
  return sk.head;
}

function calcBtns() {
  const w = 300, h = 50;
  const cx = WIDTH / 2 - w / 2;
  BTN_MENU_1 = { x: 205, y: 205, w: 190, h: 56 };
  BTN_MENU_2 = { x: 205, y: 280, w: 190, h: 56 };
  BTN_MENU_3 = { x: 205, y: 355, w: 190, h: 56 };
  BTN_SHOP = { x: 25, y: 282, w: 160, h: 60 };
  BTN_BACK = { x: 20, y: 20, w: 110, h: 40 };
  BTN_PROFILE = { x: 15, y: 15, w: 230, h: 50 };
  STAT_CARD = { x: 405, y: 196, w: 180, h: 240 };
  STAT_WEEK = { x: 413, y: 236, w: 164, h: 58 };
  STAT_REC  = { x: 413, y: 300, w: 164, h: 58 };
  STAT_LEAD = { x: 413, y: 364, w: 164, h: 58 };
  TAB_WEEK = { x: 45,  y: 100, w: 160, h: 44 };
  TAB_REC  = { x: 220, y: 100, w: 160, h: 44 };
  TAB_LEAD = { x: 395, y: 100, w: 160, h: 44 };
  TAB_SHOP_SKINS = { x: 60, y: 112, w: 155, h: 40 };
  TAB_SHOP_BG    = { x: 225, y: 112, w: 155, h: 40 };
  TAB_SHOP_FRAMES = { x: 390, y: 112, w: 155, h: 40 };
  BTN_CONT = { x: cx, y: 250, w, h };
  BTN_RESTART = { x: cx, y: 320, w, h };
  BTN_MENU_BTN = { x: cx, y: 390, w, h };
  BTN_GO_RESTART = { x: cx, y: 340, w, h };
  BTN_GO_MENU = { x: cx, y: 410, w, h };
}

// Кнопка музыки (правый верхний угол)
function updateMusicBtn() {
  BTN_MUSIC = {
    x: WIDTH - MUSIC_BTN_SIZE - MUSIC_BTN_MARGIN,
    y: MUSIC_BTN_MARGIN,
    w: MUSIC_BTN_SIZE,
    h: MUSIC_BTN_SIZE
  };
}

function elapsedSec(now) {
  const extra = quickPaused ? now - pauseStart : 0;
  return Math.max(0, Math.floor((now - gameStart - pausedAccum - extra) / 1000));
}