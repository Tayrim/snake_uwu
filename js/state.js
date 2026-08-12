// --- DOM ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const controlsEl = document.getElementById('controls');

const IS_TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (IS_TOUCH) document.body.classList.add('touch');

let viewScale = 1;

// --- СОСТОЯНИЕ ---
let state = 'menu';
let mode = 'classic';
let gameSpeed = SPEED_CLASSIC;
let recTab = 'week';
let shopTab = 'skins';
let shopScroll = 0;
let shopMaxScroll = 0;
let lastHoverId = '';

let snake = [];
let dir = { x: 0, y: -GRID };
let dirQueue = [];
let growPending = false;

// --- РЕЖИМ УРОВНЕЙ ---
let lvlDiff = 'easy';
let lvlIndex = 1;
let levelProgress = { easy: 0, medium: 0, hard: 0 };
let levelTimes = {};
let lives = 3;
let applesEaten = 0;
let applesNeed = 0;
let door = null;
let lastLevelResult = null;
let maxLevel = 0;
let frameId = 'none';

let walls = [];
let wallsSet = new Set();

let food = { x: 0, y: 0 };
let boost = null;
let boostTimer = 0;
let boostCooldown = 0;
let banana = null;
let bananaTimer = 0;
let bananaCooldown = 0;
let yellowUntil = 0;
let poison = null;
let poisonTimer = 0;
let poisonCooldown = 0;
let invertedUntil = 0;

let score = 0;
let high = 0;
let coins = 0;
let frozenSec = 0;

let ownedSkins = [];
let skinId = 'green';
let ownedThemes = [];
let themeId = 'classic';
let ownedAvatars = [];
let avatarId = 'snake';
let nick = 'Удав';

let scoresCache = null;

// --- КВЕСТЫ / ДОСТИЖЕНИЯ / КОЛЕСО / СТАТИСТИКА ---
let stats = { apples: 0, games: 0, levels: 0, bananas: 0, skinsBought: 0 };
let quests = null;
let achClaimed = [];
let wheelLastDate = '';
let pendingBuff = false;
let coinBuff = 1;
let wheelAngle = 0;
let wheelSpin = null;
let wheelResult = null;

let questsOpen = false;
let achOpen = false;

let quickPaused = false;
let gameStart = 0;
let pausedAccum = 0;
let pauseStart = 0;
let lastStep = 0;
let countdownStart = 0;
let mouse = { x: -1, y: -1 };

// --- ДИАЛОГИ ---
let profileOpen = false;
let confirmOpen = false;
let pendingPurchase = null;
let fundsOpen = false;
let settingsOpen = false;
let dailyOpen = false;

const profileDialogEl = document.getElementById('profileDialog');
const nickInputEl = document.getElementById('nickInput');
const avatarGridEl = document.getElementById('avatarGrid');
const confirmDialogEl = document.getElementById('confirmDialog');
const confirmTextEl = document.getElementById('confirmText');
const fundsDialogEl = document.getElementById('fundsDialog');
const fundsTextEl = document.getElementById('fundsText');
const settingsDialogEl = document.getElementById('settingsDialog');
const musicVolEl = document.getElementById('musicVol');
const musicVolValEl = document.getElementById('musicVolVal');
const sfxVolEl = document.getElementById('sfxVol');
const sfxVolValEl = document.getElementById('sfxVolVal');
const dailyDialogEl = document.getElementById('dailyDialog');
const dailyGridEl = document.getElementById('dailyGrid');
const questsDialogEl = document.getElementById('questsDialog');
const questsListEl = document.getElementById('questsList');
const achDialogEl = document.getElementById('achDialog');
const achListEl = document.getElementById('achList');

// --- КНОПКИ ---
let BTN_MENU_1 = {}, BTN_MENU_2 = {}, BTN_MENU_3 = {};
let BTN_SHOP = {}, BTN_GIFT = {}, BTN_SETTINGS = {}, BTN_QUESTS = {};
let BTN_WHEEL = {}, BTN_ACH = {}, BTN_SPIN = {};
let BTN_BACK = {};
let BTN_PROFILE = {};
let STAT_CARD = {}, STAT_WEEK = {}, STAT_REC = {}, STAT_LEAD = {};
let TAB_WEEK = {}, TAB_REC = {}, TAB_LEAD = {};
let TAB_SHOP_SKINS = {}, TAB_SHOP_BG = {}, TAB_SHOP_FRAMES = {};
let BTN_CONT = {}, BTN_RESTART = {}, BTN_MENU_BTN = {};
let BTN_GO_RESTART = {}, BTN_GO_MENU = {};
let BTN_LW_NEXT = {}, BTN_LW_RETRY = {}, BTN_LW_LIST = {};
let DIFF_TABS = [];
let LEVEL_CELLS = [];
let SHOP_ROWS = [];

// --- ФОНОВЫЙ CANVAS ---
let bgCanvas = document.createElement('canvas');
bgCanvas.width = WIDTH;
bgCanvas.height = HEIGHT;
let bgCtx = bgCanvas.getContext('2d');

// --- ЧАСТИЦЫ ---
let menuParts = [];
let particles = [];

// --- TOUCH ---
let touchStart = null;
let touchMoved = false;
let touchTime = 0;