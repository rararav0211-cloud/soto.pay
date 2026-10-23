// ════════════════════════════════════════
//  core.js … どのページでも使う「土台」
//  ・保存と読み込み（localStorage）
//  ・小さな関数（要素づくり・日付や時刻の書き方）
//  ・アイコン
//  ・下から出てくるパネル
//  ・画面を描き直すしくみ（render）
// ════════════════════════════════════════
'use strict';

// ════════════════════════════
//  保存・読み込み
// ════════════════════════════
function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch (e) {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // 保存できなくても画面の表示はそのまま
  }
}

// ════════════════════════════
//  要素を作る
// ════════════════════════════
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// ════════════════════════════
//  日付・時刻の書き方
// ════════════════════════════
const WEEKDAYS = '日月火水木金土';

// 「9:05」
function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 「10/22 9:05」
function formatDateTime(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${formatTime(ts)}`;
}

// 残り時間を「3時間12分」の形にする
function formatRemaining(ms) {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return 'まもなく終了';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

// Date を「2026-10-22」の形にする（日付入力で使う形）
function toDateString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// 今日の日付を「2026-10-22」の形で
function todayString() {
  return toDateString(new Date());
}

// 「2026-10-22」を Date にする
function toDate(value) {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// 「2026-10-22」を「10月22日(木)」にする
function formatDate(value) {
  const d = toDate(value);
  return `${d.getMonth() + 1}月${d.getDate()}日(${WEEKDAYS[d.getDay()]})`;
}

// ════════════════════════════
//  アイコン（お店の種類・カテゴリごと）
// ════════════════════════════
const TYPE_ICONS = {
  // 予約の種類
  food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  stay: '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/>',
  experience: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  // クーポンのカテゴリ
  shopping: '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  leisure: '<path d="M8 3l4 8 5-5 5 15H2L8 3z"/>',
  transport: '<rect x="4" y="3" width="16" height="15" rx="2"/><line x1="4" y1="11" x2="20" y2="11"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/><path d="M7 18v3M17 18v3"/>',
};

function createIcon(type) {
  const box = el('div', 'shop-icon');
  // アイコンの中身は上で決めた固定の SVG だけなので innerHTML を使っている
  box.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TYPE_ICONS[type]}</svg>`;
  return box;
}

// ════════════════════════════
//  下から出てくるパネル（クーポン詳細・予約・お知らせなどで共通）
// ════════════════════════════
// パネルの入れ物は1回だけ作って、ページの最後に足しておく
const overlay = el('div', 'sheet-overlay');
overlay.hidden = true;
const sheet = el('div', 'sheet');
sheet.setAttribute('role', 'dialog');
sheet.setAttribute('aria-modal', 'true');
overlay.append(sheet);
document.body.append(overlay);

let sheetOpen = false;
let sheetRefresh = null; // 状態が変わったときにパネルを描き直す関数

// パネルを開く。fill はパネルの中身を作る関数
// refreshOnChange が true なら、render() のたびに fill をもう一度呼んで中身を新しくする
function openSheet(fill, refreshOnChange) {
  sheetOpen = true;
  sheetRefresh = refreshOnChange ? fill : null;
  fill();
  sheet.scrollTop = 0;
  overlay.hidden = false;
  document.body.style.overflow = 'hidden'; // 後ろの画面がスクロールしないように
  // 表示されてから class を付けると、下からスッと出てくる
  requestAnimationFrame(() => overlay.classList.add('is-open'));
}

function closeSheet() {
  sheetOpen = false;
  sheetRefresh = null;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
  setTimeout(() => {
    if (!sheetOpen) overlay.hidden = true;
  }, 250);
}

// パネルの外（暗い部分）を押したら閉じる
overlay.addEventListener('click', (e) => {
  if (e.target === overlay) closeSheet();
});

// Esc キーでも閉じる
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheetOpen) closeSheet();
});

// パネルを書き直す前に呼ぶ（中身を空にして見出し用の名前を付ける）
function resetSheet(label) {
  sheet.replaceChildren();
  sheet.setAttribute('aria-label', label);
  sheet.classList.remove('is-tour');
}

// パネル共通の「つまみ」と「×」ボタン
function sheetTop() {
  const closeBtn = el('button', 'sheet-close', '×');
  closeBtn.setAttribute('aria-label', '閉じる');
  closeBtn.addEventListener('click', closeSheet);
  return [el('div', 'sheet-handle'), closeBtn];
}

// ════════════════════════════
//  画面を描き直すしくみ
//  各ファイルが onRender(関数) で「描き直すときに呼んでほしい関数」を登録しておき、
//  状態が変わったら render() を呼ぶと、登録した関数が順番に呼ばれる
// ════════════════════════════
const renderers = [];
const minuteTasks = [];

function onRender(fn) {
  renderers.push(fn);
}

// 1分ごとに呼んでほしい関数を登録する（残り時間の表示など）
function onEveryMinute(fn) {
  minuteTasks.push(fn);
}

function render() {
  renderers.forEach((fn) => fn());
  if (sheetRefresh) sheetRefresh(); // パネルを開いていたら中身も更新
}

// 各ページのファイルの最後で1回だけ呼ぶ
function startApp() {
  render();
  setInterval(() => minuteTasks.forEach((fn) => fn()), 60 * 1000);
}
