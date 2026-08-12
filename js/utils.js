const randInt = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const inRect = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const wallKey = (x, y) => x + ',' + y;

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

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
  const sel = FRAMES.find(f => f.id === frameId);
  if (sel && sel.level <= maxLevel) return sel;
  let best = FRAMES[0];
  for (const f of FRAMES) {
    if (f.level <= maxLevel && f.level >= best.level) best = f;
  }
  return best;
}

function currentSkinMult() { return currentSkin().mult || 1; }

// Начисление монет: множитель скина × бафф ×2
function addCoins(n) {
  const v = Math.round(n * currentSkinMult() * coinBuff);
  coins += v;
  saveCoins();
  return v;
}

// Очки + прогресс квеста «набери очков»
function addScore(n) {
  score += n;
  questAdd('score', n);
}

function segColor(sk, i, now) {
  if (yellowUntil > now) return C.banana;
  if (sk.striped) return i % 2 ? sk.stripe : sk.body;
  if (sk.rainbow) return 'hsl(' + Math.floor((i * 12 + now / 10) % 360) + ',85%,55%)';
  return sk.body;
}
function headColorOf(sk, now) {
  if (yellowUntil > now) return '#eab308';
  if (sk.rainbow) return 'hsl(' + Math.floor((now / 10) % 360) + ',85%,60%)';
  return sk.head;
}

// --- УРОВНИ ---
function diffIndex(id) { return LEVEL_DIFFS.findIndex(d => d.id === id); }
function diffUnlocked(id) {
  if (id === 'easy') return true;
  if (id === 'medium') return levelProgress.easy >= LEVELS_PER_DIFF;
  return levelProgress.medium >= LEVELS_PER_DIFF;
}
function levelUnlocked(diffId, idx) {
  if (!diffUnlocked(diffId)) return false;
  return idx <= levelProgress[diffId] + 1;
}
function levelKey(diffId, idx) { return diffId + '-' + idx; }
function fmtTime(sec) {
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');
  return mm + ':' + ss;
}

// --- ДАТЫ ---
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function yesterdayStr() {
  const d = new Date(Date.now() - 86400000);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function dailyInfo() {
  const d = loadDaily();
  if (d.last === todayStr()) return { d: d, next: 0, canClaim: false };
  const next = (d.last === yesterdayStr()) ? (d.day % 7) + 1 : 1;
  return { d: d, next: next, canClaim: true };
}

// --- ЗАДАНИЯ ДНЯ ---
function dateSeed() {
  const t = todayStr();
  let s = 0;
  for (let i = 0; i < t.length; i++) s = (s * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(s);
}
function todayQuests() {
  const s = dateSeed();
  const applesNeed = 20 + (s % 3) * 5;
  const levelsNeed = 1 + (s % 2);
  const scoreNeed = 200 + (s % 4) * 100;
  return [
    { id: 'apples', icon: '🍎', text: 'Съешь ' + applesNeed + ' яблок', need: applesNeed, reward: 100 },
    { id: 'levels', icon: '🧱', text: 'Пройди ' + levelsNeed + ' уровня', need: levelsNeed, reward: 150 },
    { id: 'score',  icon: '⭐', text: 'Набери ' + scoreNeed + ' очков', need: scoreNeed, reward: 200 }
  ];
}
function questAdd(id, n) {
  if (!quests || quests.date !== todayStr()) quests = loadQuests();
  if (quests.p[id] == null) quests.p[id] = 0;
  quests.p[id] += n;
  saveQuests(quests);
}
function questsClaimableCount() {
  if (!quests || quests.date !== todayStr()) return 0;
  const list = todayQuests();
  let c = 0;
  for (let i = 0; i < list.length; i++) {
    if (!quests.claimed[i] && (quests.p[list[i].id] || 0) >= list[i].need) c++;
  }
  return c;
}

// --- СТАТИСТИКА / ДОСТИЖЕНИЯ ---
function statAdd(key, n) {
  stats[key] = (stats[key] || 0) + n;
  saveStats(stats);
}
function achClaimableCount() {
  let c = 0;
  for (const a of ACHIEVEMENTS) {
    if (!achClaimed.includes(a.id) && a.check(stats)) c++;
  }
  return c;
}

// --- КОЛЕСО ---
function canSpinWheel() {
  return wheelLastDate !== todayStr() && !wheelSpin && !wheelResult;
}

function calcBtns() {
  const w = 300, h = 50;
  const cx = WIDTH / 2 - w / 2;
  BTN_MENU_1 = { x: 205, y: 205, w: 190, h: 56 };
  BTN_MENU_2 = { x: 205, y: 280, w: 190, h: 56 };
  BTN_MENU_3 = { x: 205, y: 355, w: 190, h: 56 };
  BTN_GIFT = { x: 25, y: 182, w: 160, h: 60 };
  BTN_QUESTS = { x: 25, y: 252, w: 160, h: 60 };
  BTN_SHOP = { x: 25, y: 322, w: 160, h: 60 };
  BTN_SETTINGS = { x: 25, y: 392, w: 160, h: 60 };
  BTN_ACH = { x: WIDTH - 140, y: 15, w: 60, h: 50 };
  BTN_WHEEL = { x: WIDTH - 70, y: 15, w: 60, h: 50 };
  BTN_SPIN = { x: WIDTH / 2 - 70, y: HEIGHT - 95, w: 140, h: 50 };
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
  BTN_LW_NEXT = { x: cx, y: 300, w, h };
  BTN_LW_RETRY = { x: cx, y: 370, w, h };
  BTN_LW_LIST = { x: cx, y: 440, w, h };

  DIFF_TABS = [
    { x: 60,  y: 100, w: 150, h: 44 },
    { x: 225, y: 100, w: 150, h: 44 },
    { x: 390, y: 100, w: 150, h: 44 }
  ];
  LEVEL_CELLS = [];
  for (let i = 0; i < LEVELS_PER_DIFF; i++) {
    const col = i % 7, row = Math.floor(i / 7);
    LEVEL_CELLS.push({ x: 30 + col * 78, y: 180 + row * 110, w: 70, h: 90, idx: i + 1 });
  }
}

function elapsedSec(now) {
  const extra = quickPaused ? now - pauseStart : 0;
  return Math.max(0, Math.floor((now - gameStart - pausedAccum - extra) / 1000));
}