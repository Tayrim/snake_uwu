// ============================================
// YANDEX GAMES SDK
// ============================================
// Если запущено не на платформе Яндекс Игр (локальная разработка,
// другой хостинг) — скрипт sdk.js просто не подключится, и вся игра
// должна продолжать работать как обычно, только без рекламы.

let ysdk = null;
let ysdkReady = false;

// Показывать ли рекламу на самом деле или подставлять "фейковую" мгновенную
// награду при разработке вне Яндекса. На проде (когда ysdk реально
// инициализирован) этот флаг ни на что не влияет.
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

// Вызывается один раз, когда игрок реально может начать играть
// (меню отрисовано, ввод настроен). Обязательное требование Яндекса.
function notifyGameReady() {
  if (ysdkReady && ysdk && ysdk.features && ysdk.features.LoadingAPI) {
    ysdk.features.LoadingAPI.ready();
  }
}

// --- Пауза игры на время показа рекламы (переиспользуем механизм quickPaused) ---
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
// callbacks: { onReward, onClose(wasShown), onUnavailable }
// onReward вызывается ТОЛЬКО если ролик реально досмотрен до конца —
// именно тут нужно начислять монеты/жизни/спины, не раньше.
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
// INTERSTITIAL (полноэкранная реклама между забегами)
// ============================================
let lastInterstitialTime = 0;
const INTERSTITIAL_COOLDOWN_MS = 120000; // не чаще раза в 2 минуты

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
