// ============================================
// YANDEX GAMES SDK
// ============================================
let ysdk = null;
let ysdkReady = false;
let gameLanguage = 'ru'; // Язык игры (по умолчанию русский)

const YSDK_DEV_FALLBACK = true;

function initYandexSDK() {
  let attempts = 0;
  const maxAttempts = 100;

  function tryInit() {
    if (typeof YaGames !== 'undefined') {
      YaGames.init()
        .then(sdk => {
          ysdk = sdk;
          ysdkReady = true;
          console.log('Yandex SDK initialized');

          // АВТООПРЕДЕЛЕНИЕ ЯЗЫКА (требование 2.14)
          if (ysdk.environment && ysdk.environment.i18n) {
            gameLanguage = ysdk.environment.i18n.lang || 'ru';
            console.log('Game language detected:', gameLanguage);
          }

          // ОБРАБОТКА ПАУЗЫ ОТ ЯНДЕКСА (требование 1.19.4)
          ysdk.on('game_api_pause', () => {
            if (state === 'play' && !quickPaused) {
              quickPaused = true;
              pauseStart = performance.now();
              stopMusic();
              if (audioCtx) audioCtx.suspend();
            }
          });

          ysdk.on('game_api_resume', () => {
            if (quickPaused) {
              pausedAccum += performance.now() - pauseStart;
              quickPaused = false;
              lastStep = performance.now();
            }
            if (audioCtx) audioCtx.resume();
            if (musicVolume > 0.01) startMusic(isMenuLikeState() ? 'menu' : 'game');
          });
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
      gameLanguage = 'ru'; // Фолбэк на русский
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

// ============================================
// GAMEPLAY API (требование 1.19.3)
// ============================================
function gameplayStart() {
  if (ysdkReady && ysdk && ysdk.features && ysdk.features.GameplayAPI) {
    ysdk.features.GameplayAPI.start();
  }
}

function gameplayStop() {
  if (ysdkReady && ysdk && ysdk.features && ysdk.features.GameplayAPI) {
    ysdk.features.GameplayAPI.stop();
  }
}

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
const LB_NAME = 'snakePixelScore';

function submitScoreToYandex(score, extra) {
  if (!ysdkReady || !ysdk || score <= 0) return;
  Promise.resolve(ysdk.isAvailableMethod('leaderboards.setScore'))
    .then(ok => {
      if (!ok) return;
      return ysdk.leaderboards.setScore(LB_NAME, Math.floor(score), extra || '');
    })
    .catch(err => console.warn('LB setScore error', err));
}

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
// ============================================
// ДОПОЛНИТЕЛЬНЫЕ СПИНЫ КОЛЕСА ЗА РЕКЛАМУ
// ============================================
function requestAdSpin() {
  if (!canAdSpinWheel()) return;
  SFX.click();
  showRewardedAd({
    onReward: () => {
      wheelExtraUsed++;
      saveWheelExtraUsed();
      startWheelSpin();
    }
  });
}