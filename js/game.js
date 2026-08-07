function buildWalls(lvl) {
  const cells = [];
  const add = (x, y) => cells.push({ x: x * GRID, y: y * GRID });
  const p = (lvl - 1) % 5;
  if (p === 1) {
    for (let x = 10; x <= 19; x++) { add(x, 14); add(x, 15); }
  } else if (p === 2) {
    for (let y = 6; y <= 23; y++) { add(8, y); add(21, y); }
  } else if (p === 3) {
    for (let x = 4; x <= 7; x++) for (let y = 4; y <= 7; y++) add(x, y);
    for (let x = 22; x <= 25; x++) for (let y = 4; y <= 7; y++) add(x, y);
    for (let x = 4; x <= 7; x++) for (let y = 22; y <= 25; y++) add(x, y);
    for (let x = 22; x <= 25; x++) for (let y = 22; y <= 25; y++) add(x, y);
  } else if (p === 4) {
    for (let x = 6; x <= 12; x++) { add(x, 8); add(x, 21); }
    for (let x = 17; x <= 23; x++) { add(x, 8); add(x, 21); }
  }
  return cells;
}

function rebuildWalls() {
  walls = buildWalls(level).filter(c => !snake.some(s => s.x === c.x && s.y === c.y));
  wallsSet = new Set(walls.map(c => wallKey(c.x, c.y)));
  if (wallsSet.has(wallKey(food.x, food.y))) spawnFood();
  if (boost && wallsSet.has(wallKey(boost.x, boost.y))) { boost = null; boostCooldown = randInt(7000, 15000); }
}

function spawnFood() {
  while (true) {
    const p = { x: randInt(0, COLS - 1) * GRID, y: randInt(0, ROWS - 1) * GRID };
    if (!snake.some(s => s.x === p.x && s.y === p.y) && !wallsSet.has(wallKey(p.x, p.y))) { food = p; return; }
  }
}

function commitScore() {
  if (score > high) { high = score; saveHigh(high); }
  logScore(score, mode);
  coins += coinsFromScore(score); saveCoins();
}

function startGame(m) {
  ensureAudio();
  SFX.start();
  mode = m;
  gameSpeed = m === 'hard' ? SPEED_HARD : SPEED_CLASSIC;
  snake = [{ x: WIDTH / 2, y: HEIGHT / 2 }];
  dir = { x: 0, y: -GRID };
  dirQueue = [];
  growPending = false;
  level = 1; applesInLevel = 0; lastLevelUp = 0;
  walls = []; wallsSet = new Set();
  spawnFood();
  boost = null; boostCooldown = randInt(7000, 15000);
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

function stepSnake() {
  if (dirQueue.length) dir = dirQueue.shift();
  const h = snake[0];
  const nx = (h.x + dir.x + WIDTH) % WIDTH;
  const ny = (h.y + dir.y + HEIGHT) % HEIGHT;
  if (wallsSet.has(wallKey(nx, ny))) return false;
  const body = growPending ? snake.slice(1) : snake.slice(1, -1);
  if (body.some(p => p.x === nx && p.y === ny)) return false;
  snake.unshift({ x: nx, y: ny });
  if (!growPending) snake.pop(); else growPending = false;
  return true;
}

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

function update(now, dt) {
  updateParticles(dt);
  if (state === 'menu') updateMenuParts(dt);

  if (state === 'countdown' && now - countdownStart >= 2400) {
    state = 'play';
    gameStart = now; lastStep = now;
  }

  if (state === 'play' && !quickPaused) {
    if (!boost) {
      boostCooldown -= dt;
      if (boostCooldown <= 0) {
        while (true) {
          const p = { x: randInt(0, COLS - 1) * GRID, y: randInt(0, ROWS - 1) * GRID };
          if (!snake.some(s => s.x === p.x && s.y === p.y) &&
              !(p.x === food.x && p.y === food.y) &&
              !wallsSet.has(wallKey(p.x, p.y))) { boost = p; break; }
        }
        boostTimer = 6000;
      }
    } else {
      boostTimer -= dt;
      if (boostTimer <= 0) { boost = null; boostCooldown = randInt(7000, 15000); }
    }

    const interval = 1000 / gameSpeed;
    if (now - lastStep >= interval) {
      lastStep = now - ((now - lastStep) % interval);
      if (!stepSnake()) {
        commitScore();
        frozenSec = elapsedSec(now);
        state = 'gameover';
        SFX.die();
        startMusic('menu');
        if (mode === 'level') {
          const achieved = level;
          if (achieved > maxLevel) {
            const oldFrame = FRAMES.filter(f => f.level <= maxLevel).reduce((a,b) => a.level > b.level ? a : b, FRAMES[0]);
            const newFrame = FRAMES.filter(f => f.level <= achieved).reduce((a,b) => a.level > b.level ? a : b, FRAMES[0]);
            if (newFrame.level > oldFrame.level) {
              setTimeout(() => SFX.unlock(), 500);
            }
            maxLevel = achieved;
            saveMaxLevel();
          }
        }
      } else {
        const h = snake[0];
        if (h.x === food.x && h.y === food.y) {
          score += appleScore(elapsedSec(now));
          growPending = true;
          spawnParticles(food.x, food.y, C.apple, 15);
          spawnFood();
          SFX.eat();
          if (mode === 'level') {
            applesInLevel++;
            if (applesInLevel >= APPLES_PER_LEVEL) {
              applesInLevel = 0;
              level++;
              gameSpeed = Math.min(10 + (level - 1) * 2, 20);
              rebuildWalls();
              lastLevelUp = now;
              SFX.levelUp();
            }
          }
        }
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