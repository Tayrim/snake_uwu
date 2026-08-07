function resize() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const isLandscapeTouch = IS_TOUCH && window.innerWidth > window.innerHeight;
  
  let size;
  if (isLandscapeTouch) {
    // В landscape кнопки слева и справа от canvas
    const leftEl = document.getElementById('ctrl-left');
    const rightEl = document.getElementById('ctrl-right');
    const leftW = leftEl ? leftEl.offsetWidth : 60;
    const rightW = rightEl ? rightEl.offsetWidth : 60;
    const gap = 24;
    const availW = window.innerWidth - 20 - leftW - rightW - gap;
    const availH = window.innerHeight - 16;
    size = Math.floor(Math.min(availW, availH));
    size = Math.max(180, size);
  } else {
    // Портрет или десктоп
    const gap = IS_TOUCH ? 15 : 0;
    const controlsH = IS_TOUCH ? controlsEl.offsetHeight : 0;
    const availW = window.innerWidth - 20;
    const availH = window.innerHeight - 20 - (IS_TOUCH ? controlsH + gap : 0);
    size = Math.floor(Math.min(availW, availH));
    if (!IS_TOUCH) size = Math.min(size, 600);
    size = Math.max(200, size);
  }
  
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  viewScale = canvas.width / WIDTH;
}

let resizeTimer = null;
function debouncedResize() {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 80);
}

window.addEventListener('resize', debouncedResize);
window.addEventListener('orientationchange', () => {
  setTimeout(resize, 50);
  setTimeout(resize, 200);
  setTimeout(resize, 500);
  setTimeout(resize, 1000);
});

function loop(now) {
  let dt = now - lastFrame;
  lastFrame = now;
  if (dt > 100) dt = 100;
  update(now, dt);
  draw(now);
  requestAnimationFrame(loop);
}

// --- ИНИЦИАЛИЗАЦИЯ ---
let lastFrame = performance.now();

initStorage();

requestAnimationFrame(() => {
  resize();
  drawStaticBackground();
  initMenuParts();
  setupInput();
  requestAnimationFrame(loop);
});

// Музыка стартует после первого взаимодействия (требование браузеров)
function tryStartMusic() {
  ensureAudio();
  if (!currentMusicMode) {
    startMusic(state === 'menu' ? 'menu' : 'game');
  }
  document.removeEventListener('click', tryStartMusic);
  document.removeEventListener('touchstart', tryStartMusic);
  document.removeEventListener('keydown', tryStartMusic);
}
document.addEventListener('click', tryStartMusic);
document.addEventListener('touchstart', tryStartMusic);
document.addEventListener('keydown', tryStartMusic);