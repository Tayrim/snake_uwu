// ============================================
// ГЕНЕРАЦИЯ СТЕН ДЛЯ УРОВНЕЙ
// ============================================
function buildLevelWalls(diffId, idx) {
  const di = diffIndex(diffId);
  const rnd = mulberry32(di * 1000 + idx * 77 + 5);
  const occ = new Set();
  const cells = [];
  const add = (x, y) => {
    if (x < 1 || y < 1 || x >= COLS - 1 || y >= ROWS - 1) return;
    if (Math.abs(x - 15) < 3 && Math.abs(y - 15) < 3) return;
    const k = x + ',' + y;
    if (occ.has(k)) return;
    occ.add(k);
    cells.push({ x: x * GRID, y: y * GRID });
  };

  const structs = 2 + Math.floor(idx / 4) + di * 2;
  for (let s = 0; s < structs; s++) {
    const type = Math.floor(rnd() * 4);
    const cx = 3 + Math.floor(rnd() * (COLS - 6));
    const cy = 3 + Math.floor(rnd() * (ROWS - 6));
    const len = 3 + Math.floor(rnd() * (3 + di * 2 + Math.floor(idx / 5)));
    if (type === 0) { for (let i = 0; i < len; i++) add(cx + i, cy); }
    else if (type === 1) { for (let i = 0; i < len; i++) add(cx, cy + i); }
    else if (type === 2) {
      const sz = 2 + (di > 0 && rnd() < 0.5 ? 1 : 0);
      for (let x = 0; x < sz; x++) for (let y = 0; y < sz; y++) add(cx + x, cy + y);
    } else {
      add(cx, cy); add(cx + 1, cy); add(cx, cy + 1); add(cx - 1, cy); add(cx, cy - 1);
    }
  }
  if (di === 2) {
    const n = 4 + idx;
    for (let i = 0; i < n; i++) add(2 + Math.floor(rnd() * (COLS - 4)), 2 + Math.floor(rnd() * (ROWS - 4)));
  }
  return cells;
}

function randomFreeCell() {
  for (let i = 0; i < 200; i++) {
    const p = { x: randInt(0, COLS - 1) * GRID, y: randInt(0, ROWS - 1) * GRID };
    if (!snake.some(s => s.x === p.x && s.y === p.y) &&
        !(p.x === food.x && p.y === food.y) &&
        !wallsSet.has(wallKey(p.x, p.y)) &&
        !(door && p.x === door.x && p.y === door.y) &&
        !(banana && p.x === banana.x && p.y === banana.y) &&
        !(poison && p.x === poison.x && p.y === poison.y)) return p;
  }
  return null;
}

function spawnFood() {
  while (true) {
    const p = { x: randInt(0, COLS - 1) * GRID, y: randInt(0, ROWS - 1) * GRID };
    if (!snake.some(s => s.x === p.x && s.y === p.y) && !wallsSet.has(wallKey(p.x, p.y))) { food = p; return; }
  }
}

function commitScore(withCoins = true) {
  if (score > high) { high = score; saveHigh(high); }
  logScore(score, mode);
  if (withCoins) addCoins(coinsFromScore(score));
}

// ============================================
// СТАРТ РЕЖИМОВ
// ============================================
function startGame(m) {
  ensureAudio();
  SFX.start();
  mode = m;
  gameSpeed = m === 'hard' ? SPEED_HARD : SPEED_CLASSIC;
  snake = [{ x: WIDTH / 2, y: HEIGHT / 2 }];
  dir = { x: 0, y: -GRID };
  dirQueue = [];
  growPending = false;
  walls = []; wallsSet = new Set();
  door = null;
  spawnFood();
  boost = null; boostCooldown = randInt(7000, 15000);
  banana = null; bananaCooldown = randInt(9000, 16000);
  poison = null; poisonCooldown = randInt(6000, 12000);
  invertedUntil = 0;
  yellowUntil = 0;
  score = 0; quickPaused = false; pausedAccum = 0;
  particles = [];
  state = 'countdown';
  countdownStart = performance.now();
  calcBtns();
  startMusic('game');
}

function startLevel(diffId, idx) {
  ensureAudio();
  SFX.start();
  mode = 'level';
  lvlDiff = diffId;
  lvlIndex = idx;
  const d = LEVEL_DIFFS[diffIndex(diffId)];
  gameSpeed = d.baseSpeed;
  applesNeed = d.apples(idx);
  applesEaten = 0;
  lives = 3;
  door = null;
  snake = [{ x: Math.floor(COLS / 2) * GRID, y: Math.floor(ROWS / 2) * GRID }];
  dir = { x: 0, y: -GRID };
  dirQueue = [];
  growPending = false;
  walls = buildLevelWalls(diffId, idx);
  wallsSet = new Set(walls.map(c => wallKey(c.x, c.y)));
  spawnFood();
  boost = null; boostCooldown = randInt(7000, 15000);
  banana = null; bananaCooldown = randInt(9000, 16000);
  poison = null; poisonCooldown = randInt(6000, 12000);
  invertedUntil = 0;
  yellowUntil = 0;
  score = 0; quickPaused = false; pausedAccum = 0;
  particles = [];
  state = 'countdown';
  countdownStart = performance.now();
  calcBtns();
  startMusic('game');
}

function queueDir(d) {
  const last = dirQueue.length ? dirQueue[dirQueue.length - 1] : dir;
  if (d.x === last.x && d.y === last.y) return;
  if (d.x === -last.x && d.y === -last.y) return;
  if (dirQueue.length < 3) dirQueue.push(d);
}

function openPauseMenu() {
  if (!quickPaused) { quickPaused = true; pauseStart = performance.now(); }
  state = 'pausemenu';
  SFX.click();
}

function resumeGame() {
  if (quickPaused) { pausedAccum += performance.now() - pauseStart; quickPaused = false; }
  lastStep = performance.now();
  state = 'play';
  SFX.click();
}

// ============================================
// ЖИЗНИ / ДВЕРЬ / ПОБЕДА
// ============================================
function failLevel(now) {
  lives = 0;
  commitScore(false);
  frozenSec = elapsedSec(now);
  state = 'gameover';
  SFX.die();
  startMusic('menu');
}

function loseLife(now, resetSnake) {
  lives--;
  SFX.hit();
  if (lives <= 0) {
    failLevel(now);
    return;
  }
  if (resetSnake) {
    snake = [{ x: Math.floor(COLS / 2) * GRID, y: Math.floor(ROWS / 2) * GRID }];
    dir = { x: 0, y: -GRID };
    dirQueue = [];
    growPending = false;
  }
}

function completeLevel(now) {
  const sec = elapsedSec(now);
  const key = levelKey(lvlDiff, lvlIndex);
  const prevBest = levelTimes[key] || null;
  const first = lvlIndex === levelProgress[lvlDiff] + 1;

  let base = 0;
  let granted = null;

  if (first) {
    levelProgress[lvlDiff] = lvlIndex;
    saveLevelProgress();
    maxLevel = levelProgress.easy + levelProgress.medium + levelProgress.hard;
    base = LEVEL_REWARD + score; // 150 + собранные очки
    // Полосатый скин за полное прохождение сложности
    if (lvlIndex === LEVELS_PER_DIFF) {
      const sk = SKINS.find(s => s.reward === lvlDiff);
      if (sk && !ownedSkins.includes(sk.id)) {
        ownedSkins.push(sk.id);
        saveOwnedSkins();
        granted = sk.name;
        setTimeout(() => SFX.unlock(), 600);
      }
    }
  } else if (prevBest === null || sec < prevBest) {
    base = LEVEL_REWARD + score;
  }

  let newBest = false;
  if (prevBest === null || sec < prevBest) {
    levelTimes[key] = sec;
    saveLevelTimes();
    newBest = true;
  }

  const reward = base > 0 ? addCoins(base) : 0;
  lastLevelResult = { time: sec, reward: reward, base: base, newBest: newBest, first: first, granted: granted };
  frozenSec = sec;
  state = 'levelwin';
  SFX.levelUp();
  startMusic('menu');
}

// ============================================
// ШАГ ЗМЕЙКИ (с учётом отравления)
// ============================================
function stepSnake(now) {
  if (dirQueue.length) {
    let d = dirQueue.shift();
    if (invertedUntil > performance.now()) d = { x: -d.x, y: -d.y }; // перепутанное управление
    dir = d;
  }
  const h = snake[0];
  const nx = (h.x + dir.x + WIDTH) % WIDTH;
  const ny = (h.y + dir.y + HEIGHT) % HEIGHT;

  if (mode === 'level') {
    if (wallsSet.has(wallKey(nx, ny))) {
      wallsSet.delete(wallKey(nx, ny));
      walls = walls.filter(w => !(w.x === nx && w.y === ny));
      spawnParticles(nx, ny, C.wall, 12);
      loseLife(now, false);
      return true;
    }
    const body = growPending ? snake.slice(1) : snake.slice(1, -1);
    if (body.some(p => p.x === nx && p.y === ny)) {
      loseLife(now, true);
      return true;
    }
    snake.unshift({ x: nx, y: ny });
    if (!growPending) snake.pop(); else growPending = false;
    if (door && nx === door.x && ny === door.y) {
      completeLevel(now);
    }
    return true;
  }

  if (wallsSet.has(wallKey(nx, ny))) return false;
  const body2 = growPending ? snake.slice(1) : snake.slice(1, -1);
  if (body2.some(p => p.x === nx && p.y === ny)) return false;
  snake.unshift({ x: nx, y: ny });
  if (!growPending) snake.pop(); else growPending = false;
  return true;
}

// ============================================
// ЧАСТИЦЫ / МЕНЮ
// ============================================
function initMenuParts() {
  menuParts = [];
  const cols = ['#facc15', '#4ade80', '#e2e8f0', '#38bdf8'];
  for (let i = 0; i < 26; i++) {
    menuParts.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.3,
      r: 1 + Math.random() * 2,
      tw: Math.random() * Math.PI * 2,
      c: cols[randInt(0, 3)]
    });
  }
}

function updateMenuParts(dt) {
  for (const p of menuParts) {
    p.x += p.vx * dt / 16;
    p.y += p.vy * dt / 16;
    p.tw += dt / 500;
    if (p.y < -5) { p.y = HEIGHT + 5; p.x = Math.random() * WIDTH; }
    if (p.x < -5) p.x = WIDTH + 5;
    if (p.x > WIDTH + 5) p.x = -5;
  }
}

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x: x + GRID/2, y: y + GRID/2,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1.0,
      color: color
    });
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= dt / 500;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ============================================
// ГЛАВНЫЙ UPDATE
// ============================================
function update(now, dt) {
  updateParticles(dt);
  if (state === 'menu') updateMenuParts(dt);

  if (state === 'countdown' && now - countdownStart >= 2400) {
    state = 'play';
    gameStart = now; lastStep = now;
  }

  if (state === 'play' && !quickPaused) {
    // Буст-звезда
    if (!boost) {
      boostCooldown -= dt;
      if (boostCooldown <= 0) {
        const p = randomFreeCell();
        if (p) { boost = p; boostTimer = 6000; }
      }
    } else {
      boostTimer -= dt;
      if (boostTimer <= 0) { boost = null; boostCooldown = randInt(7000, 15000); }
    }
    // Банан
    if (!banana) {
      bananaCooldown -= dt;
      if (bananaCooldown <= 0) {
        const p = randomFreeCell();
        if (p) { banana = p; bananaTimer = BANANA_LIFE; }
      }
    } else {
      bananaTimer -= dt;
      if (bananaTimer <= 0) { banana = null; bananaCooldown = randInt(9000, 16000); }
    }
    // Отравленное яблоко (только в уровнях)
    if (mode === 'level') {
      if (!poison) {
        poisonCooldown -= dt;
        if (poisonCooldown <= 0) {
          const p = randomFreeCell();
          if (p) { poison = p; poisonTimer = POISON_LIFE; }
        }
      } else {
        poisonTimer -= dt;
        if (poisonTimer <= 0) { poison = null; poisonCooldown = randInt(6000, 12000); }
      }
    }

    const interval = 1000 / gameSpeed;
    if (now - lastStep >= interval) {
      lastStep = now - ((now - lastStep) % interval);
      const alive = stepSnake(now);
      if (!alive) {
        commitScore(true);
        frozenSec = elapsedSec(now);
        state = 'gameover';
        SFX.die();
        startMusic('menu');
      } else if (state === 'play') {
        const h = snake[0];
        // Яблоко
        if (h.x === food.x && h.y === food.y) {
          if (mode === 'level') {
            applesEaten++;
            if (applesEaten > applesNeed) {
              // Съел лишнее яблоко — проигрыш
              failLevel(now);
              return;
            }
            score += 10;
            growPending = true;
            const d = LEVEL_DIFFS[diffIndex(lvlDiff)];
            gameSpeed = Math.min(gameSpeed + d.speedUp, d.baseSpeed + 6);
            spawnParticles(food.x, food.y, C.apple, 15);
            SFX.eat();
            spawnFood();
            if (applesEaten >= applesNeed && !door) {
              door = randomFreeCell();
              SFX.bonus();
            }
          } else {
            score += appleScore(elapsedSec(now));
            growPending = true;
            spawnParticles(food.x, food.y, C.apple, 15);
            spawnFood();
            SFX.eat();
          }
        }
        // Банан
        if (banana && h.x === banana.x && h.y === banana.y) {
          score += BANANA_POINTS;
          yellowUntil = now + BANANA_YELLOW_MS;
          spawnParticles(banana.x, banana.y, C.banana, 20);
          banana = null;
          bananaCooldown = randInt(9000, 16000);
          SFX.banana();
        }
        // Отравленное яблоко
        if (poison && h.x === poison.x && h.y === poison.y) {
          invertedUntil = now + POISON_INVERT_MS;
          spawnParticles(poison.x, poison.y, C.poison, 20);
          poison = null;
          poisonCooldown = randInt(6000, 12000);
          SFX.error();
        }
        // Звезда
        if (boost && h.x === boost.x && h.y === boost.y) {
          score += 3; growPending = true;
          spawnParticles(boost.x, boost.y, C.boost, 20);
          boost = null; boostCooldown = randInt(7000, 15000);
          SFX.bonus();
        }
      }
    }
  }
}