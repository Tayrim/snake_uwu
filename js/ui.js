// ============================================
// МАГАЗИН (с ползунком скролла и большими отступами)
// ============================================
function drawShop() {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBtn(BTN_BACK, 'Назад', 18);
  text('МАГАЗИН', WIDTH / 2, 35, 40, C.accent, 'center');
  text('Монеты: ' + coins, WIDTH / 2, 88, 22, C.gold, 'center');

  drawTab(TAB_SHOP_SKINS, 'Скины', shopTab === 'skins');
  drawTab(TAB_SHOP_BG, 'Фоны', shopTab === 'bg');
  drawTab(TAB_SHOP_FRAMES, 'Рамки', shopTab === 'frames');

  const viewY = 170, viewH = 380;
  let items, rowH = 64, step = 74;
  if (shopTab === 'skins') items = SKINS;
  else if (shopTab === 'bg') items = THEMES;
  else items = FRAMES.filter(f => f.level > 0);

  const contentH = items.length * step;
  shopMaxScroll = Math.max(0, contentH - viewH);
  shopScroll = clamp(shopScroll, 0, shopMaxScroll);

  SHOP_ROWS = [];
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, viewY, WIDTH, viewH);
  ctx.clip();

  let y = viewY - shopScroll;
  for (const item of items) {
    const rect = { x: 100, y: y, w: 470, h: rowH };
    SHOP_ROWS.push({ rect: rect, item: item });

    if (y + rowH > viewY && y < viewY + viewH) {
      if (shopTab === 'frames') {
        const unlocked = item.level <= maxLevel;
        ctx.fillStyle = unlocked ? '#1e293b' : '#0f172a';
        ctx.globalAlpha = unlocked ? 1 : 0.45;
        rr(rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();

        const px = rect.x + 28, py = rect.y + rowH / 2;
        drawAvatarFrame(px, py, 16, item, performance.now());
        ctx.fillStyle = '#0f172a';
        circle(px, py, 13);

        text(item.name, rect.x + 56, rect.y + 14, 20, C.text);
        text('Разблок. на уровне ' + item.level, rect.x + 56, rect.y + 38, 13, unlocked ? C.ok : C.gray);

        if (unlocked) {
          text('✓ получена', rect.x + rect.w - 14, rect.y + 22, 16, C.ok, 'right');
        } else {
          text('🔒', rect.x + rect.w - 14, rect.y + 22, 18, C.gray, 'right');
        }
        ctx.globalAlpha = 1;
      } else {
        const owned = (shopTab === 'skins' ? ownedSkins : ownedThemes).includes(item.id);
        const sel = (shopTab === 'skins' ? skinId : themeId) === item.id;
        const afford = coins >= item.price;

        ctx.fillStyle = sel ? '#334155' : '#1e293b';
        rr(rect.x, rect.y, rect.w, rect.h, 10); ctx.fill();
        if (sel) { ctx.strokeStyle = C.gold; ctx.lineWidth = 2; rr(rect.x, rect.y, rect.w, rect.h, 10); ctx.stroke(); }

        if (shopTab === 'skins') {
          ctx.fillStyle = item.rainbow
            ? 'hsl(' + Math.floor((performance.now() / 10) % 360) + ',85%,55%)'
            : item.body;
          rr(rect.x + 14, rect.y + 18, 28, 28, 6); ctx.fill();
        } else {
          ctx.fillStyle = item.bg;
          rr(rect.x + 14, rect.y + 18, 28, 28, 4); ctx.fill();
          ctx.strokeStyle = item.grid; ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(rect.x + 14, rect.y + 27); ctx.lineTo(rect.x + 42, rect.y + 27);
          ctx.moveTo(rect.x + 14, rect.y + 37); ctx.lineTo(rect.x + 42, rect.y + 37);
          ctx.moveTo(rect.x + 23, rect.y + 18); ctx.lineTo(rect.x + 23, rect.y + 46);
          ctx.moveTo(rect.x + 33, rect.y + 18); ctx.lineTo(rect.x + 33, rect.y + 46);
          ctx.stroke();
        }

        text(item.name, rect.x + 56, rect.y + 21, 20, C.text);

        if (sel) text('Выбрано', rect.x + rect.w - 14, rect.y + 22, 16, C.ok, 'right');
        else if (owned) text('Выбрать', rect.x + rect.w - 14, rect.y + 22, 16, C.text, 'right');
        else text(item.price + ' монет', rect.x + rect.w - 14, rect.y + 22, 16, afford ? C.gold : C.gray, 'right');
      }
    }
    y += step;
  }
  ctx.restore();

  // Ползунок скролла
  if (shopMaxScroll > 0) {
    const trackX = 586, trackW = 6, trackY = viewY, trackH = viewH;
    ctx.fillStyle = '#1e293b';
    rr(trackX, trackY, trackW, trackH, 3); ctx.fill();
    const thumbH = Math.max(40, trackH * (viewH / contentH));
    const thumbY = trackY + (shopScroll / shopMaxScroll) * (trackH - thumbH);
    ctx.fillStyle = C.btnHover;
    rr(trackX, thumbY, trackW, thumbH, 3); ctx.fill();
  }
  text('Монеты начисляются за очки', WIDTH / 2, 565, 15, C.gray, 'center');
}

// ============================================
// РЕКОРДЫ
// ============================================
function drawRecords() {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBtn(BTN_BACK, 'Назад', 18);
  text('РЕКОРДЫ', WIDTH / 2, 35, 40, C.accent, 'center');

  drawTab(TAB_WEEK, 'За неделю', recTab === 'week');
  drawTab(TAB_REC, 'Рекорд', recTab === 'record');
  drawTab(TAB_LEAD, 'Лидеры', recTab === 'leaders');

  if (recTab === 'week') {
    const wb = weekBest();
    text('Лучший за неделю:', WIDTH / 2, 220, 26, C.text, 'center');
    text(String(wb), WIDTH / 2, 260, 56, C.gold, 'center');
    const ws = new Date(weekStartMs());
    const we = new Date(weekStartMs() + 6 * 86400000);
    const fmt = d => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    text('Неделя: ' + fmt(ws) + ' — ' + fmt(we), WIDTH / 2, 340, 16, C.gray, 'center');
  } else if (recTab === 'record') {
    text('Рекорд за всё время:', WIDTH / 2, 220, 26, C.text, 'center');
    text(String(high), WIDTH / 2, 260, 56, C.gold, 'center');
    text('Пройдено уровней: ' + maxLevel, WIDTH / 2, 340, 18, C.gray, 'center');
  } else {
    const list = getScores().slice(0, 10);
    if (!list.length) {
      text('Пока нет результатов', WIDTH / 2, 240, 22, C.gray, 'center');
    } else {
      let y = 165;
      for (let i = 0; i < list.length; i++) {
        const e = list[i];
        const date = new Date(e.d || 0).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
        const av = AVATARS.find(a => a.id === e.av) || AVATARS[0];
        const fr = FRAMES.find(f => f.id === e.fr) || FRAMES[0];
        drawAvatar(WIDTH / 2 - 150, y - 4, 28, av, fr, performance.now());
        text((i + 1) + '. ' + (e.n || 'Игрок') + ' — ' + e.s + ' (' + modeLabel(e.m) + ', ' + date + ')', WIDTH / 2 - 110, y + 2, 16, i === 0 ? C.gold : C.text);
        y += 38;
      }
    }
  }
}

// ============================================
// ВЫБОР УРОВНЕЙ
// ============================================
function drawLevels() {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBtn(BTN_BACK, 'Назад', 18);
  text('УРОВНИ', WIDTH / 2, 35, 40, C.accent, 'center');

  for (let i = 0; i < LEVEL_DIFFS.length; i++) {
    const d = LEVEL_DIFFS[i];
    const unlocked = diffUnlocked(d.id);
    drawTab(DIFF_TABS[i], (unlocked ? '' : '🔒 ') + d.name, lvlDiff === d.id, !unlocked);
  }

  text('Пройдено: ' + levelProgress[lvlDiff] + ' / ' + LEVELS_PER_DIFF, WIDTH / 2, 152, 16, C.gray, 'center');

  for (const cell of LEVEL_CELLS) {
    const unlocked = levelUnlocked(lvlDiff, cell.idx);
    const done = cell.idx <= levelProgress[lvlDiff];
    const best = levelTimes[levelKey(lvlDiff, cell.idx)];
    const hov = inRect(mouse, cell);

    ctx.globalAlpha = unlocked ? 1 : 0.45;
    ctx.fillStyle = hov && unlocked ? C.btnHover : (done ? '#14532d' : C.btn);
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    rr(cell.x, cell.y, cell.w, cell.h, 10); ctx.fill();
    ctx.shadowBlur = 0;
    if (done) { ctx.strokeStyle = C.ok; ctx.lineWidth = 2; rr(cell.x, cell.y, cell.w, cell.h, 10); ctx.stroke(); }

    text(String(cell.idx), cell.x + cell.w / 2, cell.y + 10, 26, unlocked ? C.text : C.gray, 'center');
    if (!unlocked) {
      emoji('🔒', cell.x + cell.w / 2, cell.y + 48, 18, 'center');
    } else if (best != null) {
      text(fmtTime(best), cell.x + cell.w / 2, cell.y + 52, 12, C.gold, 'center');
    } else {
      text('новый', cell.x + cell.w / 2, cell.y + 52, 11, C.gray, 'center');
    }
    ctx.globalAlpha = 1;
  }

  text('Собери яблоки → откроется дверь 🚪 → пройди уровень!', WIDTH / 2, 415, 15, C.gray, 'center');
  text('❤️ ×3 — стены ломаются, но отнимают жизнь', WIDTH / 2, 440, 14, C.gray, 'center');
}

// ============================================
// ГЛАВНЫЙ DRAW
// ============================================
function draw(now) {
  ctx.setTransform(viewScale, 0, 0, viewScale, 0, 0);
  calcBtns();

  if (state === 'menu') {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawMenuParts();

    const p = BTN_PROFILE;
    const hovP = inRect(mouse, p);
    ctx.fillStyle = hovP ? C.btnHover : C.btn;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 6;
    rr(p.x, p.y, p.w, p.h, 10); ctx.fill();
    ctx.shadowBlur = 0;
    drawAvatar(p.x + 6, p.y + 5, 40, currentAvatar(), currentFrame(), now);
    text(nick, p.x + 56, p.y + 8, 18, C.text);
    text('Ур. ' + maxLevel + ' | ' + coins + ' м', p.x + 56, p.y + 30, 12, C.gray);

    text('SNAKE PIXEL', WIDTH / 2, 78, 44, C.accent, 'center');
    text('ВЫБЕРИТЕ РЕЖИМ', WIDTH / 2, 130, 26, C.text, 'center');
    text('Классика, хардкор или уровни — выбери свой путь!', WIDTH / 2, 165, 16, C.gray, 'center');

    // Левая колонка: подарок, магазин, настройки
    drawModeBtn(BTN_GIFT, 'Подарки', '🎁', '#9d174d', '#be185d', '#ec4899');
    if (dailyInfo().canClaim) {
      ctx.fillStyle = '#ef4444';
      circle(BTN_GIFT.x + BTN_GIFT.w - 10, BTN_GIFT.y + 10, 9);
      text('!', BTN_GIFT.x + BTN_GIFT.w - 10, BTN_GIFT.y + 3, 14, '#ffffff', 'center');
    }
    drawModeBtn(BTN_SHOP, 'Магазин', '🛒', '#4c1d95', '#5b21b6', '#a855f7');
    drawModeBtn(BTN_SETTINGS, 'Настройки', '⚙️', '#334155', '#475569', '#94a3b8');

    // Режимы в центре
    drawModeBtn(BTN_MENU_1, 'Classic', '🐍', '#166534', '#15803d', '#22c55e');
    drawModeBtn(BTN_MENU_2, 'Hard', '🔥', '#991b1b', '#b91c1c', '#ef4444');
    drawModeBtn(BTN_MENU_3, 'Level', '🧱', '#854d0e', '#a16207', '#facc15');

    drawStatsCard();

    const hint = IS_TOUCH ? 'Свайпы или кнопки — управление | II — пауза'
                          : 'ESC — меню паузы | P / Space — пауза';
    text(hint, WIDTH / 2, 540, 16, C.gray, 'center');

    let hovId = '';
    if (!IS_TOUCH) {
      if (inRect(mouse, BTN_MENU_1)) hovId = 'm1';
      else if (inRect(mouse, BTN_MENU_2)) hovId = 'm2';
      else if (inRect(mouse, BTN_MENU_3)) hovId = 'm3';
      else if (inRect(mouse, BTN_SHOP)) hovId = 'shop';
      else if (inRect(mouse, BTN_GIFT)) hovId = 'gift';
      else if (inRect(mouse, BTN_SETTINGS)) hovId = 'set';
      else if (inRect(mouse, BTN_PROFILE)) hovId = 'prof';
      else if (inRect(mouse, STAT_WEEK)) hovId = 'sw';
      else if (inRect(mouse, STAT_REC)) hovId = 'sr';
      else if (inRect(mouse, STAT_LEAD)) hovId = 'sl';
    }
    if (hovId && hovId !== lastHoverId) SFX.hover();
    lastHoverId = hovId;
  } else if (state === 'shop') {
    drawShop();
  } else if (state === 'records') {
    drawRecords();
  } else if (state === 'levels') {
    drawLevels();
  } else {
    drawField();
    drawHUD(now);
    if (state === 'countdown') {
      const idx = Math.min(3, Math.floor((now - countdownStart) / 600));
      ctx.fillStyle = C.dim; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      text(['3', '2', '1', 'ГОУ!'][idx], WIDTH / 2, HEIGHT / 2 - 60, 100, C.accent, 'center');
    } else if (state === 'play' && quickPaused) {
      ctx.fillStyle = C.dim; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      text('ПАУЗА', WIDTH / 2, HEIGHT / 2 - 80, 72, C.accent, 'center');
      text(IS_TOUCH ? 'Тап — продолжить' : 'P / Space — продолжить', WIDTH / 2, HEIGHT / 2 + 10, 24, C.text, 'center');
    } else if (state === 'pausemenu') {
      ctx.fillStyle = C.dim; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      text('ПАУЗА', WIDTH / 2, 120, 72, C.accent, 'center');
      drawBtn(BTN_CONT, 'Продолжить');
      drawBtn(BTN_RESTART, 'Заново');
      drawBtn(BTN_MENU_BTN, mode === 'level' ? 'К уровням' : 'Меню');
    } else if (state === 'levelwin') {
      ctx.fillStyle = C.dim; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      text('УРОВЕНЬ ' + lvlIndex + ' ПРОЙДЕН!', WIDTH / 2, 130, 46, C.accent, 'center');
      const r = lastLevelResult || { time: 0, reward: 0, newBest: false };
      text('Время: ' + fmtTime(r.time), WIDTH / 2, 205, 26, C.text, 'center');
      if (r.newBest) text('🏆 Новый рекорд времени!', WIDTH / 2, 240, 18, C.gold, 'center');
      text(r.reward > 0 ? '+' + r.reward + ' монет' : 'Награда: пройди быстрее своего времени', WIDTH / 2, 268, 16, r.reward > 0 ? C.gold : C.gray, 'center');
      drawBtn(BTN_LW_NEXT, lvlIndex < LEVELS_PER_DIFF ? 'Следующий' : 'Все уровни пройдены!', 20);
      drawBtn(BTN_LW_RETRY, 'Заново', 20);
      drawBtn(BTN_LW_LIST, 'К уровням', 20);
    } else if (state === 'gameover') {
      ctx.fillStyle = C.dim; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      text('ИГРА ОКОНЧЕНА', WIDTH / 2, 140, 56, C.accent, 'center');
      text('Очки: ' + score, WIDTH / 2, 230, 28, C.text, 'center');
      text('Рекорд: ' + high, WIDTH / 2, 270, 22, C.gold, 'center');
      const extra = mode === 'level' ? 'Уровень ' + lvlIndex + ' | ' : '';
      if (mode === 'level') {
        text(extra + '❤️ не хватило', WIDTH / 2, 300, 16, C.gray, 'center');
      } else {
        text(extra + '+' + coinsFromScore(score) + ' монет', WIDTH / 2, 300, 16, C.gray, 'center');
      }
      drawBtn(BTN_GO_RESTART, 'Заново');
      drawBtn(BTN_GO_MENU, mode === 'level' ? 'К уровням' : 'Меню');
    }
  }

  let hover = false;
  if (!IS_TOUCH) {
    if (state === 'menu') {
      hover = inRect(mouse, BTN_MENU_1) || inRect(mouse, BTN_MENU_2) || inRect(mouse, BTN_MENU_3) ||
              inRect(mouse, BTN_SHOP) || inRect(mouse, BTN_GIFT) || inRect(mouse, BTN_SETTINGS) ||
              inRect(mouse, BTN_PROFILE) ||
              inRect(mouse, STAT_WEEK) || inRect(mouse, STAT_REC) || inRect(mouse, STAT_LEAD);
    } else if (state === 'shop') {
      hover = inRect(mouse, BTN_BACK) || inRect(mouse, TAB_SHOP_SKINS) || inRect(mouse, TAB_SHOP_BG) || inRect(mouse, TAB_SHOP_FRAMES) ||
              SHOP_ROWS.some(r => inRect(mouse, r.rect));
    } else if (state === 'records') {
      hover = inRect(mouse, BTN_BACK) || inRect(mouse, TAB_WEEK) || inRect(mouse, TAB_REC) || inRect(mouse, TAB_LEAD);
    } else if (state === 'levels') {
      hover = inRect(mouse, BTN_BACK) || DIFF_TABS.some(r => inRect(mouse, r)) ||
              LEVEL_CELLS.some(c => inRect(mouse, c) && levelUnlocked(lvlDiff, c.idx));
    } else if (state === 'pausemenu') {
      hover = inRect(mouse, BTN_CONT) || inRect(mouse, BTN_RESTART) || inRect(mouse, BTN_MENU_BTN);
    } else if (state === 'levelwin') {
      hover = inRect(mouse, BTN_LW_NEXT) || inRect(mouse, BTN_LW_RETRY) || inRect(mouse, BTN_LW_LIST);
    } else if (state === 'gameover') {
      hover = inRect(mouse, BTN_GO_RESTART) || inRect(mouse, BTN_GO_MENU);
    }
  }
  canvas.style.cursor = hover ? 'pointer' : 'default';
}

// ============================================
// ПРОФИЛЬ
// ============================================
function buildAvatarGrid() {
  avatarGridEl.innerHTML = '';
  for (const av of AVATARS) {
    const owned = ownedAvatars.includes(av.id);
    const sel = avatarId === av.id;
    const afford = coins >= av.price;
    const div = document.createElement('div');
    div.className = 'avatarItem' + (sel ? ' sel' : '') + (!owned ? ' locked' : '');
    div.innerHTML = '<div class="em">' + av.emoji + '</div>' +
                    '<div style="font-size:10px">' + av.name + '</div>' +
                    (owned ? (sel ? '<div style="color:#4ade80;font-size:10px">✓</div>' : '<div style="font-size:10px">выбрать</div>')
                           : '<div class="pr">' + (afford ? av.price + ' м' : '🔒 ' + av.price + ' м') + '</div>');
    div.addEventListener('click', () => {
      ensureAudio();
      if (owned) {
        avatarId = av.id; saveAvatarId(); SFX.click();
        buildAvatarGrid();
      } else if (coins >= av.price) {
        openConfirm('avatar', av);
      } else {
        openFunds(av);
      }
    });
    avatarGridEl.appendChild(div);
  }
}

function openProfileDialog() {
  profileOpen = true;
  nickInputEl.value = nick;
  buildAvatarGrid();
  profileDialogEl.classList.add('open');
  setTimeout(() => nickInputEl.focus(), 50);
}

function closeProfileDialog(apply) {
  if (apply) {
    const v = sanitizeNick(nickInputEl.value);
    if (v) { nick = v; saveNick(); }
  }
  profileOpen = false;
  profileDialogEl.classList.remove('open');
  nickInputEl.blur();
  SFX.click();
}

// ============================================
// ПОДТВЕРЖДЕНИЕ ПОКУПКИ
// ============================================
function openConfirm(kind, item) {
  pendingPurchase = { kind: kind, item: item };
  confirmOpen = true;
  confirmTextEl.innerHTML =
    'Купить <b>' + item.name + '</b> за <span class="price">' + item.price + ' монет</span>?' +
    '<br><span class="bal">У тебя сейчас: ' + coins + ' монет</span>';
  confirmDialogEl.classList.add('open');
  SFX.click();
}

function closeConfirm() {
  confirmOpen = false;
  pendingPurchase = null;
  confirmDialogEl.classList.remove('open');
  SFX.click();
}

function doConfirmPurchase() {
  if (!pendingPurchase) { closeConfirm(); return; }
  const kind = pendingPurchase.kind;
  const item = pendingPurchase.item;

  if (kind === 'skin') {
    if (!ownedSkins.includes(item.id) && coins >= item.price) {
      coins -= item.price; saveCoins();
      ownedSkins.push(item.id); saveOwnedSkins();
      skinId = item.id; saveSkinId();
      SFX.buy();
    }
  } else if (kind === 'theme') {
    if (!ownedThemes.includes(item.id) && coins >= item.price) {
      coins -= item.price; saveCoins();
      ownedThemes.push(item.id); saveOwnedThemes();
      themeId = item.id; saveThemeId();
      drawStaticBackground();
      SFX.buy();
    }
  } else if (kind === 'avatar') {
    if (!ownedAvatars.includes(item.id) && coins >= item.price) {
      coins -= item.price; saveCoins();
      ownedAvatars.push(item.id); saveOwnedAvatars();
      avatarId = item.id; saveAvatarId();
      SFX.buy();
      buildAvatarGrid();
    }
  }
  closeConfirm();
}

// ============================================
// НЕДОСТАТОЧНО СРЕДСТВ
// ============================================
function openFunds(item) {
  fundsOpen = true;
  const lack = item.price - coins;
  fundsTextEl.innerHTML =
    'Для покупки <b>' + item.name + '</b> нужно <span class="price">' + item.price + ' монет</span>.<br>' +
    '<span class="bal">У тебя сейчас: ' + coins + ' монет</span><br>' +
    '<span class="lack">Не хватает: ' + lack + ' монет</span>';
  fundsDialogEl.classList.add('open');
  SFX.error();
}

function closeFunds() {
  fundsOpen = false;
  fundsDialogEl.classList.remove('open');
  SFX.click();
}

// ============================================
// НАСТРОЙКИ
// ============================================
function openSettings() {
  settingsOpen = true;
  musicVolEl.value = String(Math.round(musicVolume * 100));
  sfxVolEl.value = String(Math.round(sfxVolume * 100));
  musicVolValEl.textContent = musicVolEl.value;
  sfxVolValEl.textContent = sfxVolEl.value;
  settingsDialogEl.classList.add('open');
  SFX.click();
}

function closeSettings() {
  settingsOpen = false;
  settingsDialogEl.classList.remove('open');
  SFX.click();
}

// ============================================
// ЕЖЕДНЕВНЫЕ НАГРАДЫ
// ============================================
function openDaily() {
  dailyOpen = true;
  buildDailyGrid();
  dailyDialogEl.classList.add('open');
  SFX.click();
}

function closeDaily() {
  dailyOpen = false;
  dailyDialogEl.classList.remove('open');
  SFX.click();
}

function buildDailyGrid() {
  const info = dailyInfo();
  dailyGridEl.innerHTML = '';
  for (let i = 1; i <= 7; i++) {
    const div = document.createElement('div');
    let cls = 'dailyItem';
    if (info.canClaim) {
      if (i < info.next) cls += ' claimed';
      else if (i === info.next) cls += ' today';
      else cls += ' locked';
    } else {
      if (i <= info.d.day) cls += ' claimed';
      else cls += ' locked';
    }
    div.className = cls;
    const mark = cls.includes('claimed') ? '✓' : (cls.includes('today') ? '🎁' : '🔒');
    div.innerHTML = '<div class="d">День ' + i + '</div>' +
                    '<div class="c">' + DAILY_REWARDS[i - 1] + '</div>' +
                    '<div>' + mark + '</div>';
    dailyGridEl.appendChild(div);
  }
  const claimBtn = document.getElementById('dailyClaim');
  if (info.canClaim) {
    claimBtn.textContent = 'Забрать ' + DAILY_REWARDS[info.next - 1];
  } else {
    claimBtn.textContent = 'Уже получено сегодня';
  }
}

function claimDaily() {
  const info = dailyInfo();
  if (!info.canClaim) { SFX.click(); return; }
  coins += DAILY_REWARDS[info.next - 1];
  saveCoins();
  saveDaily({ last: todayStr(), day: info.next });
  SFX.buy();
  buildDailyGrid();
}