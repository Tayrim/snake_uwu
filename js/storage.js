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

function loadMaxLevel() {
  try { return parseInt(localStorage.getItem('snake_maxlvl') || '0', 10) || 0; }
  catch (e) { return 0; }
}
function saveMaxLevel() { try { localStorage.setItem('snake_maxlvl', String(maxLevel)); } catch (e) {} }

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
  maxLevel = loadMaxLevel();
  high = loadHigh();
  nick = loadNick();
  boostCooldown = randInt(7000, 15000);
  loadMusicState();
}