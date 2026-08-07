function loadJSON(key, def) {
  try { const v = JSON.parse(localStorage.getItem(key) || ''); return v == null ? def : v; }
  catch (e) { return def; }
}
function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }

function loadHigh() {
  try { return parseInt(localStorage.getItem('snake_high') || '0', 10) || 0; }
  catch (e) { return 0; }
}
function saveHigh(v) {
  try { localStorage.setItem('snake_high', String(v)); } catch (e) {}
}
function loadCoins() {
  try { return parseInt(localStorage.getItem('snake_coins') || '0', 10) || 0; }
  catch (e) { return 0; }
}
function saveCoins() { try { localStorage.setItem('snake_coins', String(coins)); } catch (e) {} }

function loadOwnedSkins() {
  const a = loadJSON('snake_skins', null);
  return Array.isArray(a) && a.length ? a : ['green'];
}
function saveOwnedSkins() { saveJSON('snake_skins', ownedSkins); }
function loadSkinId() {
  try { return localStorage.getItem('snake_skin') || 'green'; } catch (e) { return 'green'; }
}
function saveSkinId() { try { localStorage.setItem('snake_skin', skinId); } catch (e) {} }

function loadOwnedThemes() {
  const a = loadJSON('snake_themes', null);
  return Array.isArray(a) && a.length ? a : ['classic'];
}
function saveOwnedThemes() { saveJSON('snake_themes', ownedThemes); }
function loadThemeId() {
  try { return localStorage.getItem('snake_theme') || 'classic'; } catch (e) { return 'classic'; }
}
function saveThemeId() { try { localStorage.setItem('snake_theme', themeId); } catch (e) {} }

function loadOwnedAvatars() {
  const a = loadJSON('snake_avatars', null);
  return Array.isArray(a) && a.length ? a : ['snake'];
}
function saveOwnedAvatars() { saveJSON('snake_avatars', ownedAvatars); }
function loadAvatarId() {
  try { return localStorage.getItem('snake_avatar') || 'snake'; } catch (e) { return 'snake'; }
}
function saveAvatarId() { try { localStorage.setItem('snake_avatar', avatarId); } catch (e) {} }

// --- ПРОГРЕСС УРОВНЕЙ ---
function loadLevelProgress() {
  const p = loadJSON('snake_lvlprog', null);
  if (p && typeof p === 'object') {
    return {
      easy: parseInt(p.easy || 0, 10) || 0,
      medium: parseInt(p.medium || 0, 10) || 0,
      hard: parseInt(p.hard || 0, 10) || 0
    };
  }
  return { easy: 0, medium: 0, hard: 0 };
}
function saveLevelProgress() { saveJSON('snake_lvlprog', levelProgress); }

function loadLevelTimes() {
  const t = loadJSON('snake_lvltimes', null);
  return (t && typeof t === 'object') ? t : {};
}
function saveLevelTimes() { saveJSON('snake_lvltimes', levelTimes); }

// --- ЕЖЕДНЕВНЫЕ НАГРАДЫ ---
function loadDaily() {
  const d = loadJSON('snake_daily', null);
  if (d && typeof d === 'object') return { last: d.last || '', day: parseInt(d.day || 0, 10) || 0 };
  return { last: '', day: 0 };
}
function saveDaily(d) { saveJSON('snake_daily', d); }

// --- РЕКОРДЫ ---
function loadScores() {
  const a = loadJSON('snake_scores', []);
  if (!Array.isArray(a)) return [];
  a.sort((x, y) => (y.s || 0) - (x.s || 0));
  return a;
}
function getScores() { if (!scoresCache) scoresCache = loadScores(); return scoresCache; }
function saveScores(a) { saveJSON('snake_scores', a); scoresCache = a; }

function loadNick() {
  try {
    const v = localStorage.getItem('snake_nick');
    if (v) return v;
    const def = randomNick();
    localStorage.setItem('snake_nick', def);
    return def;
  } catch (e) { return 'Удав'; }
}
function saveNick() { try { localStorage.setItem('snake_nick', nick); } catch (e) {} }

function initStorage() {
  coins = loadCoins();
  ownedSkins = loadOwnedSkins();
  skinId = loadSkinId();
  if (!ownedSkins.includes(skinId)) skinId = 'green';
  ownedThemes = loadOwnedThemes();
  themeId = loadThemeId();
  if (!ownedThemes.includes(themeId)) themeId = 'classic';
  ownedAvatars = loadOwnedAvatars();
  avatarId = loadAvatarId();
  if (!ownedAvatars.includes(avatarId)) avatarId = 'snake';
  high = loadHigh();
  nick = loadNick();

  levelProgress = loadLevelProgress();
  levelTimes = loadLevelTimes();
  maxLevel = levelProgress.easy + levelProgress.medium + levelProgress.hard;

  boostCooldown = randInt(7000, 15000);
  bananaCooldown = randInt(9000, 16000);

  loadVolumes();
}