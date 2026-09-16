// ============================================
// YANDEX GAMES SDK
// ============================================
let ysdk = null;
let ysdkReady = false;

const YSDK_DEV_FALLBACK = true;

function initYandexSDK() {
  let attempts = 0;
  const maxAttempts = 100; // ~5 секунд ожидания загрузки sdk.js

  function tryInit() {
    if (typeof YaGames !== 'undefined') {
      YaGames.init()
        .then(sdk => {
          ysdk = sdk;
          ysdkReady = true;
          console.log('Yandex SDK initialized');
        })
        .catch(err => {
          console.warn('Yandex SDK init error', err);
        });
      return;
    }
    attempts++;
    if (attempts < maxAttempts) {
      setTimeout(tryInit, 50);
    } else {
      console.warn('Yandex SDK script not found — running outside Yandex Games');
    }
  }
  tryInit();
}
initYandexSDK();

function notifyGameReady() {
  if (ysdkReady && ysdk && ysdk.features && ysdk.features.LoadingAPI) {
    ysdk.features.LoadingAPI.ready();
  }
}

// --- Пауза игры на время показа рекламы ---
function pauseForAd() {
  stopMusic();
  if (audioCtx) audioCtx.suspend();
  if (state === 'play' && !quickPaused) {
    quickPaused = true;
    pauseStart = performance.now();
  }
}

function resumeAfterAd() {
  if (audioCtx) audioCtx.resume();
  if (quickPaused) {
    pausedAccum += performance.now() - pauseStart;
    quickPaused = false;
    lastStep = performance.now();
  }
  if (musicVolume > 0.01) startMusic(isMenuLikeState() ? 'menu' : 'game');
}

// ============================================
// REWARDED VIDEO
// ============================================
function showRewardedAd(callbacks = {}) {
  const { onReward, onClose, onUnavailable } = callbacks;

  if (!ysdkReady || !ysdk) {
    if (YSDK_DEV_FALLBACK) {
      console.warn('[dev] Yandex SDK недоступен — эмулирую просмотр рекламы');
      onReward && onReward();
      onClose && onClose(true);
    } else {
      onUnavailable && onUnavailable();
    }
    return;
  }

  ysdk.adv.showRewardedVideo({
    callbacks: {
      onOpen: () => pauseForAd(),
      onRewarded: () => { onReward && onReward(); },
      onClose: (wasShown) => {
        resumeAfterAd();
        onClose && onClose(wasShown);
      },
      onError: (err) => {
        console.warn('Rewarded ad error', err);
        resumeAfterAd();
        onClose && onClose(false);
      }
    }
  });
}

// ============================================
// INTERSTITIAL
// ============================================
let lastInterstitialTime = 0;
const INTERSTITIAL_COOLDOWN_MS = 120000;

function showInterstitialAd() {
  if (!ysdkReady || !ysdk) return;
  const now = Date.now();
  if (now - lastInterstitialTime < INTERSTITIAL_COOLDOWN_MS) return;
  lastInterstitialTime = now;
  ysdk.adv.showFullscreenAdv({
    callbacks: {
      onOpen: () => pauseForAd(),
      onClose: () => resumeAfterAd(),
      onError: (err) => {
        console.warn('Interstitial ad error', err);
        resumeAfterAd();
      }
    }
  });
}

// ============================================
// ЛИДЕРБОРДЫ
// ============================================
// Должно совпадать с «Техническим названием» в Консоли!
const LB_NAME = 'snakePixelScore';

// Отправка результата (только авторизованные игроки, лимит 1 раз/сек)
function submitScoreToYandex(score, extra) {
  if (!ysdkReady || !ysdk || score <= 0) return;
  Promise.resolve(ysdk.isAvailableMethod('leaderboards.setScore'))
    .then(ok => {
      if (!ok) return;
      return ysdk.leaderboards.setScore(LB_NAME, Math.floor(score), extra || '');
    })
    .catch(err => console.warn('LB setScore error', err));
}

// Топ игроков (кэш 60 сек — лимит Яндекса 20 запросов / 5 мин)
let yandexTop = [];
let yandexUserRank = 0;
let yandexTopTime = 0;
let yandexTopLoading = false;

function fetchYandexTop(force) {
  if (!ysdkReady || !ysdk) return;
  const now = Date.now();
  if (yandexTopLoading) return;
  if (!force && now - yandexTopTime < 60000) return;
  yandexTopLoading = true;
  ysdk.leaderboards.getEntries(LB_NAME, { quantityTop: 10, includeUser: true, quantityAround: 1 })
    .then(res => {
      const seen = {};
      const list = [];
      (res.entries || []).forEach(e => {
        if (!e || !e.player) return;
        if (seen[e.player.uniqueID]) return;
        seen[e.player.uniqueID] = true;
        list.push(e);
      });
      list.sort((a, b) => a.rank - b.rank);
      yandexTop = list.slice(0, 10);
      yandexUserRank = res.userRank || 0;
      yandexTopTime = Date.now();
      yandexTopLoading = false;
    })
    .catch(err => {
      console.warn('LB getEntries error', err);
      yandexTopTime = Date.now();
      yandexTopLoading = false;
    });
}