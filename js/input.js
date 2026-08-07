function handleTap(p) {
  ensureAudio();

  // Кнопка музыки
  if (inRect(p, BTN_MUSIC)) {
    toggleMusic();
    return;
  }

  if (state === 'menu') {
    if (inRect(p, BTN_PROFILE)) { openProfileDialog(); SFX.click(); return; }
    if (inRect(p, BTN_MENU_1)) { startGame('classic'); return; }
    if (inRect(p, BTN_MENU_2)) { startGame('hard'); return; }
    if (inRect(p, BTN_MENU_3)) { startGame('level'); return; }
    if (inRect(p, BTN_SHOP)) { shopScroll = 0; state = 'shop'; SFX.click(); return; }
    if (inRect(p, STAT_WEEK)) { recTab = 'week'; state = 'records'; SFX.click(); return; }
    if (inRect(p, STAT_REC))  { recTab = 'record'; state = 'records'; SFX.click(); return; }
    if (inRect(p, STAT_LEAD)) { recTab = 'leaders'; state = 'records'; SFX.click(); return; }
  } else if (state === 'shop') {
    if (inRect(p, BTN_BACK)) { state = 'menu'; SFX.click(); return; }
    if (inRect(p, TAB_SHOP_SKINS)) { shopTab = 'skins'; shopScroll = 0; SFX.click(); return; }
    if (inRect(p, TAB_SHOP_BG)) { shopTab = 'bg'; shopScroll = 0; SFX.click(); return; }
    if (inRect(p, TAB_SHOP_FRAMES)) { shopTab = 'frames'; shopScroll = 0; SFX.click(); return; }
    if (p.y >= 170 && p.y <= 550) {
      for (const row of SHOP_ROWS) {
        if (inRect(p, row.rect)) {
          const it = row.item;
          if (shopTab === 'frames') {
            SFX.click();
            return;
          }
          if (shopTab === 'skins') {
            if (ownedSkins.includes(it.id)) { skinId = it.id; saveSkinId(); SFX.click(); }
            else if (coins >= it.price) openConfirm('skin', it);
            else openFunds(it);
          } else if (shopTab === 'bg') {
            if (ownedThemes.includes(it.id)) { themeId = it.id; saveThemeId(); drawStaticBackground(); SFX.click(); }
            else if (coins >= it.price) openConfirm('theme', it);
            else openFunds(it);
          }
          return;
        }
      }
    }
  } else if (state === 'records') {
    if (inRect(p, BTN_BACK)) { state = 'menu'; SFX.click(); return; }
    if (inRect(p, TAB_WEEK)) { recTab = 'week'; SFX.click(); }
    else if (inRect(p, TAB_REC)) { recTab = 'record'; SFX.click(); }
    else if (inRect(p, TAB_LEAD)) { recTab = 'leaders'; SFX.click(); }
  } else if (state === 'play') {
    if (quickPaused) resumeGame();
  } else if (state === 'pausemenu') {
    if (inRect(p, BTN_CONT)) resumeGame();
    else if (inRect(p, BTN_RESTART)) { commitScore(); startGame(mode); }
    else if (inRect(p, BTN_MENU_BTN)) { commitScore(); state = 'menu'; startMusic('menu'); SFX.click(); }
  } else if (state === 'gameover') {
    if (inRect(p, BTN_GO_RESTART)) startGame(mode);
    else if (inRect(p, BTN_GO_MENU)) { state = 'menu'; startMusic('menu'); SFX.click(); }
  }
}

function setupInput() {
  window.addEventListener('keydown', (e) => {
    if (fundsOpen) {
      if (e.code === 'Escape' || e.code === 'Enter' || e.code === 'Space') closeFunds();
      return;
    }
    if (confirmOpen) {
      if (e.code === 'Escape') closeConfirm();
      return;
    }
    if (profileOpen) {
      if (e.code === 'Escape') closeProfileDialog(false);
      return;
    }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    const c = e.code;
    if (state === 'shop' || state === 'records') {
      if (c === 'Escape') { state = 'menu'; SFX.click(); }
      return;
    }
    if (state === 'play') {
      if (c === 'Escape') { openPauseMenu(); return; }
      if (c === 'KeyP' || c === 'Space') {
        if (quickPaused) resumeGame();
        else { quickPaused = true; pauseStart = performance.now(); SFX.click(); }
        return;
      }
      if (quickPaused) return;
      if (c === 'ArrowUp'    || c === 'KeyW') queueDir({ x: 0, y: -GRID });
      else if (c === 'ArrowDown'  || c === 'KeyS') queueDir({ x: 0, y: GRID });
      else if (c === 'ArrowLeft'  || c === 'KeyA') queueDir({ x: -GRID, y: 0 });
      else if (c === 'ArrowRight' || c === 'KeyD') queueDir({ x: GRID, y: 0 });
    } else if (state === 'pausemenu') {
      if (c === 'Escape' || c === 'KeyP' || c === 'Space') resumeGame();
    } else if (state === 'gameover') {
      if (c === 'Enter' || c === 'Space') startGame(mode);
    }
  });

  canvas.addEventListener('mousemove', (e) => { mouse = canvasPos(e.clientX, e.clientY); });
  canvas.addEventListener('click', (e) => {
    if (IS_TOUCH) return;
    handleTap(canvasPos(e.clientX, e.clientY));
  });
  canvas.addEventListener('wheel', (e) => {
    if (state === 'shop') {
      e.preventDefault();
      shopScroll = clamp(shopScroll + e.deltaY * 0.5, 0, shopMaxScroll);
    }
  }, { passive: false });

  let touchStart = null;
  let touchMoved = false;
  let touchTime = 0;

  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    touchMoved = false;
    touchTime = performance.now();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!touchStart) return;
    if (state === 'shop') {
      const t = e.touches[0];
      const dy = t.clientY - touchStart.y;
      const scale = WIDTH / canvas.getBoundingClientRect().width;
      shopScroll = clamp(shopScroll - dy * scale, 0, shopMaxScroll);
      touchStart = { x: t.clientX, y: t.clientY };
      touchMoved = true;
      return;
    }
    const t = e.touches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) return;
    touchMoved = true;
    if (state === 'play' && !quickPaused) {
      if (Math.abs(dx) > Math.abs(dy)) queueDir({ x: dx > 0 ? GRID : -GRID, y: 0 });
      else queueDir({ x: 0, y: dy > 0 ? GRID : -GRID });
    }
    touchStart = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  canvas.addEventListener('touchend', (e) => {
    if (touchStart && !touchMoved && performance.now() - touchTime < 600) {
      const t = e.changedTouches[0];
      handleTap(canvasPos(t.clientX, t.clientY));
    }
    touchStart = null;
  }, { passive: false });

  function bindDirButton(el, d) {
    const press = (e) => {
      e.preventDefault();
      ensureAudio();
      SFX.click();
      if (state === 'play' && !quickPaused) queueDir(d);
    };
    el.addEventListener('touchstart', press, { passive: false });
    el.addEventListener('mousedown', press);
  }
  bindDirButton(document.getElementById('btn-up'),    { x: 0, y: -GRID });
  bindDirButton(document.getElementById('btn-down'),  { x: 0, y: GRID });
  bindDirButton(document.getElementById('btn-left'),  { x: -GRID, y: 0 });
  bindDirButton(document.getElementById('btn-right'), { x: GRID, y: 0 });

  const btnPause = document.getElementById('btn-pause');
  function pausePress(e) {
    if (e) e.preventDefault();
    ensureAudio();
    if (state === 'play') openPauseMenu();
    else if (state === 'pausemenu') resumeGame();
  }
  btnPause.addEventListener('touchstart', pausePress, { passive: false });
  btnPause.addEventListener('mousedown', pausePress);

  window.addEventListener('contextmenu', (e) => { if (IS_TOUCH) e.preventDefault(); });

  // Профиль
  document.getElementById('nickOk').addEventListener('click', () => closeProfileDialog(true));
  document.getElementById('nickCancel').addEventListener('click', () => closeProfileDialog(false));
  document.getElementById('nickRand').addEventListener('click', () => {
    ensureAudio(); SFX.click();
    nickInputEl.value = randomNick();
  });
  nickInputEl.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') closeProfileDialog(true);
  });

  // Подтверждение покупки
  document.getElementById('confirmOk').addEventListener('click', () => {
    ensureAudio();
    doConfirmPurchase();
  });
  document.getElementById('confirmCancel').addEventListener('click', () => {
    closeConfirm();
  });

  // Недостаточно средств
  document.getElementById('fundsOk').addEventListener('click', () => closeFunds());
}