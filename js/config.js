// --- КОНФИГУРАЦИЯ ---
const WIDTH = 600, HEIGHT = 600, GRID = 20;
const SPEED_CLASSIC = 10;
const SPEED_HARD = 18;
const COLS = WIDTH / GRID;
const ROWS = HEIGHT / GRID;
const APPLES_PER_LEVEL = 5;
const COIN_RATE = 0.7;
const SWIPE_THRESHOLD = 24;

const C = {
  bg: '#0f172a', grid: '#1e293b',
  text: '#f8fafc', btn: '#334155', btnHover: '#475569',
  accent: '#eab308', gold: '#facc15', dim: 'rgba(0,0,0,0.6)', gray: '#94a3b8',
  apple: '#ef4444', boost: '#facc15', ok: '#4ade80', wall: '#64748b',
  heart: '#ef4444', door: '#a855f7', banana: '#facc15', poison: '#a855f7'
};

const NICK_BASE = ['Удав','Питон','Кобра','Гадюка','Полоз','Мамба','Тайпан','Анаконда','Уж','Змей'];

const STAR = [[10,1],[13,7],[19,7],[14,11],[16,18],[10,14],[4,18],[6,11],[1,7],[7,7]];

// --- ЕЖЕДНЕВНЫЕ НАГРАДЫ ---
const DAILY_REWARDS = [70, 140, 210, 280, 350, 420, 700];

// --- РЕЖИМ УРОВНЕЙ ---
const LEVELS_PER_DIFF = 14;
const LEVEL_REWARD = 150;
const LEVEL_DIFFS = [
  { id: 'easy',   name: 'Лёгкий',  baseSpeed: 8,  speedUp: 0.25, apples: l => 5 + Math.floor((l - 1) / 4) },
  { id: 'medium', name: 'Средний', baseSpeed: 10, speedUp: 0.45, apples: l => 6 + Math.floor((l - 1) / 4) },
  { id: 'hard',   name: 'Тяжёлый', baseSpeed: 12, speedUp: 0.65, apples: l => 7 + Math.floor((l - 1) / 4) }
];

// --- БАНАН ---
const BANANA_POINTS = 5;
const BANANA_YELLOW_MS = 3000;
const BANANA_LIFE = 6000;

// --- ОТРАВЛЕННОЕ ЯБЛОКО ---
const POISON_INVERT_MS = 5000;
const POISON_LIFE = 6000;

// --- КОЛЕСО ФОРТУНЫ ---
const WHEEL_PRIZES = [
  { t: 'coins', v: 50,  c: '#334155' },
  { t: 'coins', v: 100, c: '#166534' },
  { t: 'buff',  v: 2,   c: '#9d174d' },
  { t: 'coins', v: 150, c: '#854d0e' },
  { t: 'coins', v: 75,  c: '#1e40af' },
  { t: 'coins', v: 200, c: '#14532d' },
  { t: 'buff',  v: 2,   c: '#6b21a8' },
  { t: 'coins', v: 500, c: '#b45309' }
];

// --- ДОСТИЖЕНИЯ ---
const ACHIEVEMENTS = [
  { id: 'apples100',  icon: '🍎', name: 'Съешь 100 яблок',        reward: 100,  check: st => st.apples >= 100,   prog: st => [st.apples, 100] },
  { id: 'apples500',  icon: '🍎', name: 'Съешь 500 яблок',        reward: 300,  check: st => st.apples >= 500,   prog: st => [st.apples, 500] },
  { id: 'apples1500', icon: '🍎', name: 'Съешь 1500 яблок',       reward: 600,  check: st => st.apples >= 1500,  prog: st => [st.apples, 1500] },
  { id: 'games10',    icon: '🎮', name: 'Сыграй 10 игр',          reward: 100,  check: st => st.games >= 10,     prog: st => [st.games, 10] },
  { id: 'games50',    icon: '🎮', name: 'Сыграй 50 игр',          reward: 300,  check: st => st.games >= 50,     prog: st => [st.games, 50] },
  { id: 'levels14',   icon: '🧱', name: 'Пройди лёгкую сложность',reward: 200,  check: st => st.levels >= 14,    prog: st => [st.levels, 14] },
  { id: 'levels42',   icon: '🏆', name: 'Пройди все 42 уровня',   reward: 1000, check: st => st.levels >= 42,    prog: st => [st.levels, 42] },
  { id: 'bananas10',  icon: '🍌', name: 'Съешь 10 бананов',       reward: 150,  check: st => st.bananas >= 10,   prog: st => [st.bananas, 10] },
  { id: 'skins3',     icon: '🎨', name: 'Купи 3 скина',           reward: 150,  check: st => st.skinsBought >= 3,prog: st => [st.skinsBought, 3] },
  { id: 'rich5000',   icon: '💰', name: 'Накопи 5000 монет',      reward: 300,  check: () => coins >= 5000,      prog: () => [coins, 5000] }
];

// --- СКИНЫ ---
const SKINS = [
  { id: 'green',   name: 'Классический', price: 0,    body: '#22c55e', head: '#16a34a' },
  { id: 'blue',    name: 'Океан',        price: 1350, body: '#3b82f6', head: '#2563eb' },
  { id: 'red',     name: 'Кримсон',      price: 1600, body: '#ef4444', head: '#dc2626' },
  { id: 'orange',  name: 'Апельсин',     price: 1900, body: '#f97316', head: '#ea580c' },
  { id: 'purple',  name: 'Фиолет',       price: 2200, body: '#a855f7', head: '#9333ea' },
  { id: 'pink',    name: 'Розовый',      price: 2500, body: '#ec4899', head: '#db2777' },
  { id: 'cyan',    name: 'Циан',         price: 2800, body: '#06b6d4', head: '#0891b2' },
  { id: 'white',   name: 'Белый',        price: 3100, body: '#e2e8f0', head: '#94a3b8' },
  { id: 'steel',   name: 'Стальной',     price: 3400, body: '#94a3b8', head: '#64748b' },
  { id: 'brown',   name: 'Коричневый',   price: 3800, body: '#b45309', head: '#92400e' },
  { id: 'lime',    name: 'Лайм',         price: 4200, body: '#84cc16', head: '#65a30d' },
  { id: 'teal',    name: 'Бирюза',       price: 4700, body: '#14b8a6', head: '#0d9488' },
  { id: 'gold',    name: 'Золотой',      price: 5300, body: '#facc15', head: '#eab308' },
  { id: 'neon',    name: 'Неон',         price: 6200, body: '#39ff14', head: '#1fbf0f' },
  { id: 'rainbow', name: 'Радуга',       price: 7990, body: '#ffffff', head: '#ffffff', rainbow: true },
  { id: 'stripes_easy', name: 'Полосатик', price: 0, body: '#22c55e', stripe: '#facc15', head: '#16a34a', striped: true, mult: 1.2, reward: 'easy' },
  { id: 'stripes_med',  name: 'Тигр',      price: 0, body: '#f97316', stripe: '#1e293b', head: '#ea580c', striped: true, mult: 1.5, reward: 'medium' },
  { id: 'stripes_hard', name: 'Плазма',    price: 0, body: '#39ff14', stripe: '#a855f7', head: '#1fbf0f', striped: true, mult: 2,   reward: 'hard' }
];

// --- ФОНЫ ---
const THEMES = [
  { id: 'classic', name: 'Классика',     price: 0,    bg: '#0f172a', grid: '#1e293b' },
  { id: 'grass',   name: 'Трава',        price: 800,  bg: '#14532d', grid: '#1e6b3c' },
  { id: 'retro',   name: 'Ретро (GB)',   price: 1200, bg: '#0f380f', grid: '#306230' },
  { id: 'synth',   name: 'Синтвейв',     price: 1800, bg: '#150a2e', grid: '#4c2a85' },
  { id: 'desert',  name: 'Пустыня',      price: 2400, bg: '#4d3f26', grid: '#63543a' },
  { id: 'ice',     name: 'Лёд',          price: 3000, bg: '#082f49', grid: '#0c4a6e' },
  { id: 'lava',    name: 'Лава',         price: 3600, bg: '#2a0a0a', grid: '#4a1414' }
];

// --- АВАТАРКИ ---
const AVATARS = [
  { id: 'snake',   name: 'Змейка',    price: 0,    emoji: '🐍' },
  { id: 'dragon',  name: 'Дракон',    price: 500,  emoji: '🐉' },
  { id: 'fox',     name: 'Лиса',      price: 800,  emoji: '🦊' },
  { id: 'lizard',  name: 'Ящерица',   price: 1100, emoji: '🦎' },
  { id: 'ghost',   name: 'Призрак',   price: 1400, emoji: '👻' },
  { id: 'robot',   name: 'Робот',     price: 1800, emoji: '🤖' },
  { id: 'alien',   name: 'Пришелец',  price: 2200, emoji: '👽' },
  { id: 'ninja',   name: 'Ниндзя',    price: 2700, emoji: '🥷' },
  { id: 'skull',   name: 'Череп',     price: 3200, emoji: '💀' },
  { id: 'crown',   name: 'Корона',    price: 4000, emoji: '👑' },
  { id: 'fire',    name: 'Огонь',     price: 4800, emoji: '🔥' },
  { id: 'diamond', name: 'Алмаз',     price: 6000, emoji: '💎' },
  { id: 'star',    name: 'Звезда',    price: 7500, emoji: '⭐' },
  { id: 'moon',    name: 'Луна',      price: 9000, emoji: '🌙' },
  { id: 'rainbow', name: 'Радуга',    price: 12000,emoji: '🌈' }
];

// --- РАМКИ ---
const FRAMES = [
  { id: 'none',    name: 'Нет',       level: 0,  type: 'none' },
  { id: 'bronze',  name: 'Бронза',    level: 2,  type: 'solid', c1: '#cd7f32', c2: '#8b5a2b' },
  { id: 'iron',    name: 'Железо',    level: 3,  type: 'solid', c1: '#a8a29e', c2: '#57534e' },
  { id: 'silver',  name: 'Серебро',   level: 4,  type: 'solid', c1: '#e5e4e2', c2: '#a8a8a8' },
  { id: 'gold',    name: 'Золото',    level: 5,  type: 'solid', c1: '#ffd700', c2: '#b8860b' },
  { id: 'emerald', name: 'Изумруд',   level: 6,  type: 'solid', c1: '#50c878', c2: '#046307' },
  { id: 'ruby',    name: 'Рубин',     level: 7,  type: 'solid', c1: '#e0115f', c2: '#9b111e' },
  { id: 'sapphire',name: 'Сапфир',    level: 8,  type: 'solid', c1: '#0f52ba', c2: '#082567' },
  { id: 'amethyst',name: 'Аметист',   level: 9,  type: 'solid', c1: '#9966cc', c2: '#5d3a8b' },
  { id: 'diamond', name: 'Алмаз',     level: 10, type: 'solid', c1: '#b9f2ff', c2: '#4fc3f7' },
  { id: 'platinum',name: 'Платина',   level: 11, type: 'solid', c1: '#e5e4e2', c2: '#c0c0c0' },
  { id: 'master',  name: 'Мастер',    level: 12, type: 'gradient', c1: '#fbbf24', c2: '#a855f7' },
  { id: 'legend',  name: 'Легенда',   level: 15, type: 'gradient', c1: '#ef4444', c2: '#facc15' },
  { id: 'eternal', name: 'Вечность',  level: 20, type: 'rainbow' }
];