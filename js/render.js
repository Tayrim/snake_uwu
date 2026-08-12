function rr(x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
}
const circle = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

function text(s, x, y, size, color, align) {
  ctx.font = 'bold ' + size + 'px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.fillText(s, x, y);
  ctx.shadowBlur = 0;
}

function emoji(e, x, y, size, align) {
  ctx.font = size + 'px serif';
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(e, x, y);
}

function drawBtn(r, label, size, sub) {
  const hover = inRect(mouse, r);
  ctx.fillStyle = hover ? C.btnHover : C.btn;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  rr(r.x, r.y, r.w, r.h, 8); ctx.fill();
  ctx.shadowBlur = 0;
  if (sub) {
    text(label, r.x + r.w / 2, r.y + 8, size || 16, C.text, 'center');
    text(sub, r.x + r.w / 2, r.y + r.h - 24, 14, C.gold, 'center');
  } else {
    const sz = size || 24;
    text(label, r.x + r.w / 2, r.y + (r.h - sz) / 2, sz, C.text, 'center');
  }
}

function drawTab(r, label, active, locked) {
  const hover = inRect(mouse, r);
  ctx.fillStyle = active ? C.btnHover : (hover ? C.btn : '#1e293b');
  if (locked) ctx.globalAlpha = 0.5;
  rr(r.x, r.y, r.w, r.h, 8); ctx.fill();
  if (active) { ctx.strokeStyle = C.gold; ctx.lineWidth = 2; rr(r.x, r.y, r.w, r.h, 8); ctx.stroke(); }
  text(label, r.x + r.w / 2, r.y + (r.h - 18) / 2, 18, active ? C.gold : C.text, 'center');
  ctx.globalAlpha = 1;
}

function drawModeBtn(r, label, icon, base, hoverCol, glow) {
  const hov = inRect(mouse, r);
  ctx.save();
  if (hov && !IS_TOUCH) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(1.06, 1.06);
    ctx.translate(-cx, -cy);
  }
  ctx.fillStyle = hov ? hoverCol : base;
  ctx.shadowColor = glow;
  ctx.shadowBlur = hov ? 20 : 8;
  rr(r.x, r.y, r.w, r.h, 12); ctx.fill();
  ctx.shadowBlur = 0;
  const fs = label.length > 7 ? 19 : 24;
  emoji(icon, r.x + 12, r.y + (r.h - 24) / 2, 24);
  text(label, r.x + 44 + (r.w - 44) / 2, r.y + (r.h - fs) / 2, fs, C.text, 'center');
  ctx.restore();
}

// Маленькая квадратная кнопка (колесо / достижения)
function drawIconBtn(r, icon, badge) {
  const hov = inRect(mouse, r);
  ctx.fillStyle = hov ? C.btnHover : C.btn;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 6;
  rr(r.x, r.y, r.w, r.h, 10); ctx.fill();
  ctx.shadowBlur = 0;
  emoji(icon, r.x + r.w / 2, r.y + (r.h - 26) / 2, 26, 'center');
  if (badge) {
    ctx.fillStyle = '#ef4444';
    circle(r.x + r.w - 8, r.y + 8, 7);
    text('!', r.x + r.w - 8, r.y + 2, 12, '#ffffff', 'center');
  }
}

function drawStatTile(r, icon, label, value) {
  const hov = inRect(mouse, r);
  ctx.save();
  if (hov && !IS_TOUCH) {
    const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
    ctx.translate(cx, cy);
    ctx.scale(1.04, 1.04);
    ctx.translate(-cx, -cy);
  }
  ctx.fillStyle = hov ? C.btnHover : '#28394d';
  rr(r.x, r.y, r.w, r.h, 10); ctx.fill();
  emoji(icon, r.x + 10, r.y + (r.h - 24) / 2, 24);
  text(label, r.x + 44, r.y + 8, 12, C.gray);
  text(value, r.x + 44, r.y + 26, 20, C.gold);
  ctx.restore();
}

function drawStatsCard() {
  const c = STAT_CARD;
  ctx.fillStyle = 'rgba(30,41,59,0.85)';
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 2;
  rr(c.x, c.y, c.w, c.h, 14); ctx.fill(); ctx.stroke();
  text('ТВОИ ДОСТИЖЕНИЯ', c.x + c.w / 2, c.y + 10, 14, C.gray, 'center');
  drawStatTile(STAT_WEEK, '🏆', 'За неделю', String(weekBest()));
  drawStatTile(STAT_REC, '🏅', 'Рекорд', String(high));
  drawStatTile(STAT_LEAD, '🥇', 'Топ-10', String(topScore()));
}

function drawAvatarFrame(cx, cy, radius, frame, now) {
  if (frame.type === 'none') return;
  ctx.save();
  ctx.lineWidth = 3;
  if (frame.type === 'solid') {
    const g = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    g.addColorStop(0, frame.c1);
    g.addColorStop(1, frame.c2);
    ctx.strokeStyle = g;
    ctx.shadowColor = frame.c1;
    ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  } else if (frame.type === 'gradient') {
    const g = ctx.createLinearGradient(cx - radius, cy, cx + radius, cy);
    g.addColorStop(0, frame.c1);
    g.addColorStop(1, frame.c2);
    ctx.strokeStyle = g;
    ctx.lineWidth = 4;
    ctx.shadowColor = frame.c1;
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();
  } else if (frame.type === 'rainbow') {
    const hue = Math.floor((now / 20) % 360);
    ctx.lineWidth = 4;
    for (let a = 0; a < 360; a += 10) {
      const h = (hue + a) % 360;
      const rad = a * Math.PI / 180;
      const x1 = cx + Math.cos(rad) * radius;
      const y1 = cy + Math.sin(rad) * radius;
      const rad2 = (a + 12) * Math.PI / 180;
      const x2 = cx + Math.cos(rad2) * radius;
      const y2 = cy + Math.sin(rad2) * radius;
      ctx.strokeStyle = 'hsl(' + h + ',90%,60%)';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    }
    ctx.shadowColor = 'hsl(' + hue + ',90%,60%)';
    ctx.shadowBlur = 15;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

function drawAvatar(x, y, size, av, frame, now) {
  ctx.fillStyle = '#0f172a';
  circle(x + size/2, y + size/2, size/2);
  drawAvatarFrame(x + size/2, y + size/2, size/2 - 1, frame, now);
  emoji(av.emoji, x + size/2, y + size * 0.15, size * 0.7, 'center');
}

function drawHead(p, isEating, headColor) {
  ctx.save();
  ctx.translate(p.x + GRID / 2, p.y + GRID / 2);
  
  let ang = 0;
  if (dir.y === GRID) ang = Math.PI;
  else if (dir.x === -GRID) ang = -Math.PI / 2;
  else if (dir.x === GRID) ang = Math.PI / 2;
  
  ctx.rotate(ang);

  ctx.shadowColor = headColor;
  ctx.shadowBlur = 10;
  ctx.fillStyle = headColor;
  rr(-GRID / 2, -GRID / 2, GRID, GRID, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  if (isEating) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(GRID / 2 - 2, 0); ctx.lineTo(GRID / 2 + 10, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(GRID / 2 + 10, 0); ctx.lineTo(GRID / 2 + 13, -3);
    ctx.moveTo(GRID / 2 + 10, 0); ctx.lineTo(GRID / 2 + 13, 3); ctx.stroke();
  }

  const eyeX = 3;
  const eyeYOffset = 6;
  const pupilRadius = 1.8;
  const pupilOffset = 1.2;

  ctx.fillStyle = '#fff';
  circle(eyeX, -eyeYOffset, 3.5);
  circle(eyeX, eyeYOffset, 3.5);
  
  ctx.fillStyle = '#000';
  circle(eyeX + pupilOffset, -eyeYOffset, pupilRadius);
  circle(eyeX + pupilOffset, eyeYOffset, pupilRadius);
  
  ctx.fillStyle = '#fff';
  circle(eyeX + pupilOffset + 0.5, -eyeYOffset + 1, 1);
  circle(eyeX + pupilOffset + 0.5, eyeYOffset + 1, 1);

  ctx.restore();
}

function drawApple(p) {
  const pulse = 1 + Math.sin(performance.now() / 200) * 0.1;
  ctx.save();
  ctx.translate(p.x + 10, p.y + 10);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = C.apple;
  ctx.shadowBlur = 10;
  ctx.fillStyle = C.apple; circle(0, 1, 8);
  ctx.fillStyle = '#fca5a5'; circle(-3, -2, 2);
  ctx.strokeStyle = '#783504'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -9); ctx.stroke();
  ctx.strokeStyle = '#22c55e';
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(4, -9); ctx.stroke();
  ctx.restore();
}

function drawBanana(p) {
  const pulse = 1 + Math.sin(performance.now() / 180) * 0.1;
  ctx.save();
  ctx.translate(p.x + GRID / 2, p.y + GRID / 2);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = C.banana;
  ctx.shadowBlur = 12;
  emoji('🍌', 0, -9, 18, 'center');
  ctx.restore();
  ctx.fillStyle = C.banana;
  ctx.fillRect(p.x, p.y - 4, GRID * (bananaTimer / BANANA_LIFE), 2);
}

function drawPoison(p) {
  const pulse = 1 + Math.sin(performance.now() / 150) * 0.12;
  ctx.save();
  ctx.translate(p.x + 10, p.y + 10);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = C.poison;
  ctx.shadowBlur = 12;
  ctx.fillStyle = C.poison; circle(0, 1, 8);
  ctx.fillStyle = '#d8b4fe'; circle(-3, -2, 2);
  ctx.strokeStyle = '#4c1d95'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -9); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = C.poison;
  ctx.fillRect(p.x, p.y - 4, GRID * (poisonTimer / POISON_LIFE), 2);
}

function drawDoor(p) {
  const pulse = 1 + Math.sin(performance.now() / 250) * 0.08;
  ctx.save();
  ctx.translate(p.x + GRID / 2, p.y + GRID / 2);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = C.door;
  ctx.shadowBlur = 15;
  emoji('🚪', 0, -11, 20, 'center');
  ctx.restore();
}

function drawBoost(p) {
  const pulse = 1 + Math.sin(performance.now() / 100) * 0.15;
  ctx.save();
  ctx.translate(p.x + 10, p.y + 10);
  ctx.scale(pulse, pulse);
  ctx.shadowColor = C.boost;
  ctx.shadowBlur = 15;
  ctx.fillStyle = C.accent;
  ctx.beginPath();
  STAR.forEach((pt, i) => i ? ctx.lineTo(pt[0]-10, pt[1]-10) : ctx.moveTo(pt[0]-10, pt[1]-10));
  ctx.closePath(); ctx.fill();
  ctx.restore();
  
  ctx.fillStyle = C.accent;
  ctx.fillRect(p.x, p.y - 4, GRID * (boostTimer / 6000), 2);
}

function drawWalls() {
  ctx.fillStyle = C.wall;
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 4;
  for (const w of walls) {
    rr(w.x + 1, w.y + 1, GRID - 2, GRID - 2, 3);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

function drawMenuParts() {
  for (const p of menuParts) {
    const a = 0.12 + 0.12 * Math.sin(p.tw);
    ctx.globalAlpha = Math.max(0.05, a);
    ctx.fillStyle = p.c;
    circle(p.x, p.y, p.r);
  }
  ctx.globalAlpha = 1;
}

function drawParticles() {
  for (let p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
}

function drawField() {
  const sk = currentSkin();
  const now = performance.now();
  const yellow = yellowUntil > now;
  ctx.drawImage(bgCanvas, 0, 0);
  
  if (walls.length) drawWalls();
  drawApple(food);
  if (boost) drawBoost(boost);
  if (banana) drawBanana(banana);
  if (poison) drawPoison(poison);
  if (door) drawDoor(door);
  
  for (let i = snake.length - 1; i >= 1; i--) {
    const col = segColor(sk, i, now);
    ctx.shadowColor = col;
    ctx.shadowBlur = yellow ? 12 : 5;
    ctx.fillStyle = col; 
    rr(snake[i].x + 0.5, snake[i].y + 0.5, GRID - 1, GRID - 1, 4); 
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  if (snake.length > 0) {
    drawHead(snake[0], growPending, headColorOf(sk, now));
  }

  if (snake.length > 1) {
    const tail = snake[snake.length - 1];
    const prev = snake[snake.length - 2];
    let angle = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const wiggle = Math.sin(now / 100) * 0.3;
    angle += wiggle;

    ctx.save();
    ctx.translate(tail.x + GRID/2, tail.y + GRID/2);
    ctx.rotate(angle);
    
    const tailCol = segColor(sk, snake.length - 1, now);
    ctx.shadowColor = tailCol;
    ctx.shadowBlur = yellow ? 12 : 5;
    ctx.fillStyle = tailCol;
    
    ctx.beginPath();
    ctx.arc(-GRID/4, 0, GRID/2 - 1, Math.PI/2, 3*Math.PI/2, true);
    ctx.lineTo(GRID/2, 0);
    ctx.lineTo(-GRID/4, 0);
    ctx.fill();
    
    ctx.restore();
  }

  drawParticles();
}

function drawHUD(now) {
  const sec = state === 'gameover' || state === 'levelwin' ? frozenSec : elapsedSec(now);
  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');

  if (mode === 'level') {
    text('Очки: ' + score, 20, 15, 24, C.text);
    for (let i = 0; i < 3; i++) {
      emoji(i < lives ? '❤️' : '🖤', 22 + i * 26, 48, 20);
    }
    if (invertedUntil > now) {
      text('☠️ Управление перепутано!', WIDTH / 2, 78, 20, C.poison, 'center');
    }
    text('Ур. ' + lvlIndex + ' | 🍎 ' + applesEaten + '/' + applesNeed, WIDTH - 20, 15, 18, C.gold, 'right');
    text('Время: ' + mm + ':' + ss, 20, HEIGHT - 40, 24, C.text);
    if (door) text('Дверь открыта! 🚪', WIDTH - 20, HEIGHT - 35, 18, C.door, 'right');
    else text('Собери яблоки!', WIDTH - 20, HEIGHT - 35, 16, C.gray, 'right');
  } else {
    text('Очки: ' + score, 20, 15, 24, C.text);
    text('Рекорд: ' + Math.max(high, score), WIDTH - 20, 15, 24, C.gold, 'right');
    if (coinBuff > 1) text('×2 МОНЕТЫ!', WIDTH / 2, 15, 20, C.gold, 'center');
    text('Время: ' + mm + ':' + ss, 20, HEIGHT - 40, 24, C.text);
    text('Множитель: ' + multText(sec), WIDTH - 20, HEIGHT - 35, 18, C.gold, 'right');
  }
}

function drawStaticBackground() {
  const th = currentTheme();
  bgCtx.fillStyle = th.bg;
  bgCtx.fillRect(0, 0, WIDTH, HEIGHT);
  bgCtx.strokeStyle = th.grid;
  bgCtx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += GRID) { bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, HEIGHT); bgCtx.stroke(); }
  for (let y = 0; y <= HEIGHT; y += GRID) { bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(WIDTH, y); bgCtx.stroke(); }
}

// ============================================
// КОЛЕСО ФОРТУНЫ
// ============================================
function drawWheel() {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawBtn(BTN_BACK, 'Назад', 18);
  text('КОЛЕСО ФОРТУНЫ', WIDTH / 2, 30, 36, C.accent, 'center');
  text(wheelLastDate === todayStr() && !wheelSpin && !wheelResult
    ? 'Сегодня уже крутил — возвращайся завтра!'
    : 'Один бесплатный спин в день!', WIDTH / 2, 76, 15, C.gray, 'center');

  const cx = WIDTH / 2, cy = 300, R = 165;

  for (let i = 0; i < WHEEL_PRIZES.length; i++) {
    const a0 = (wheelAngle + i * 45) * Math.PI / 180;
    const a1 = a0 + Math.PI / 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, a0, a1);
    ctx.closePath();
    ctx.fillStyle = WHEEL_PRIZES[i].c;
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.stroke();

    const mid = (a0 + a1) / 2;
    const lx = cx + Math.cos(mid) * R * 0.68;
    const ly = cy + Math.sin(mid) * R * 0.68;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(mid);
    ctx.font = 'bold 17px Arial';
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 3;
    ctx.fillText(WHEEL_PRIZES[i].t === 'buff' ? '×2' : String(WHEEL_PRIZES[i].v), 0, 0);
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Обод
  ctx.beginPath(); ctx.arc(cx, cy, R + 6, 0, Math.PI * 2);
  ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();

  // Указатель сверху
  ctx.beginPath();
  ctx.moveTo(cx, cy - R - 12);
  ctx.lineTo(cx - 11, cy - R - 30);
  ctx.lineTo(cx + 11, cy - R - 30);
  ctx.closePath();
  ctx.fillStyle = C.accent; ctx.fill();

  // Центр
  ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fillStyle = C.gold; ctx.fill();

  if (wheelSpin) {
    text('Крутится...', WIDTH / 2, HEIGHT - 45, 22, C.gold, 'center');
  } else if (wheelResult) {
    const p = wheelResult;
    text(p.t === 'buff' ? '🎉 Приз: ×2 на следующую игру!' : '🎉 Приз: ' + p.v + ' монет!', WIDTH / 2, HEIGHT - 92, 22, C.gold, 'center');
    drawBtn(BTN_SPIN, 'Готово', 20);
  } else if (canSpinWheel()) {
    drawBtn(BTN_SPIN, 'КРУТИТЬ!', 22);
  } else {
    text('Приходи завтра!', WIDTH / 2, HEIGHT - 55, 18, C.gray, 'center');
  }
}