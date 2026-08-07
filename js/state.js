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

let level = 1;
let applesInLevel = 0;
let walls = [];
let wallsSet = new Set();
let lastLevelUp = 0;

let food = { x: 0, y: 0 };
let boost = null;
let boostTimer = 0;
let boostCooldown = 0;

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
let maxLevel = 0;
let nick = 'Удав';

let scoresCache = null;

let quickPaused = false;
let gameStart = 0;
let pausedAccum = 0;
let pauseStart = 0;
let lastStep = 0;
let countdownStart = 0;
let mouse = { x: -1, y: -1 };

let profileOpen = false;

// --- ПОДТВЕРЖДЕНИЕ ПОКУПОК ---
let confirmOpen = false;
let pendingPurchase = null;
const confirmDialogEl = document.getElementById('confirmDialog');
const confirmTextEl = document.getElementById('confirmText');

// --- НЕДОСТАТОЧНО СРЕДСТВ ---
let fundsOpen = false;
const fundsDialogEl = document.getElementById('fundsDialog');
const fundsTextEl = document.getElementById('fundsText');

// --- КНОПКИ ---
let BTN_MENU_1 = {}, BTN_MENU_2 = {}, BTN_MENU_3 = {};
let BTN_SHOP = {};
let BTN_BACK = {};
let BTN_PROFILE = {};
let BTN_MUSIC = {};
let STAT_CARD = {}, STAT_WEEK = {}, STAT_REC = {}, STAT_LEAD = {};
let TAB_WEEK = {}, TAB_REC = {}, TAB_LEAD = {};
let TAB_SHOP_SKINS = {}, TAB_SHOP_BG = {}, TAB_SHOP_FRAMES = {};
let BTN_CONT = {}, BTN_RESTART = {}, BTN_MENU_BTN = {};
let BTN_GO_RESTART = {}, BTN_GO_MENU = {};
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

// --- DOM ЭЛЕМЕНТЫ ПРОФИЛЯ ---
const profileDialogEl = document.getElementById('profileDialog');
const nickInputEl = document.getElementById('nickInput');
const avatarGridEl = document.getElementById('avatarGrid');