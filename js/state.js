// ════════════════════════════════════════
//  state.js … アプリの「状態」（保存しておくデータ）と、それを変える操作
//  ・お知らせ ・残高 ・ポイント ・クーポン（通常・回遊） ・予約 ・スタンプ
//  画面の作り方はここには書かず、データの読み書きだけをまとめる
// ════════════════════════════════════════
'use strict';

// localStorage に保存するときの名前（ここを変えると今までの保存データが読めなくなるので注意）
const KEYS = {
  coupons:      'sotoPayCoupons',       // 通常クーポンの獲得済み id
  tour:         'sotoPayTour',          // 回遊クーポンの解放状況
  notices:      'sotoPayNotices',       // お知らせ
  wallet:       'sotoPayWallet',        // 残高
  points:       'sotoPayPoints',        // ポイント
  reservations: 'sotoPayReservations',  // 予約
  stamps:       'sotoPayStamps',        // スタンプラリー
  demoSeeded:   'sotoPayDemoSeeded',    // デモ用の履歴を入れたかどうか
};

// ════════════════════════════
//  データの読み取り（data.js の中身を探す）
// ════════════════════════════
function getCategoryLabel(id) {
  const found = CATEGORIES.find((category) => category.id === id);
  return found ? found.label : '';
}

// 予約できるお店で使える回遊クーポン（なければ null）
function getShopCoupon(shop) {
  return shop.couponId ? COUPONS.find((c) => c.id === shop.couponId) : null;
}

// ════════════════════════════
//  お知らせ（ヘッダーのベルマーク）
//  支払い・ポイント・チャージ・予約のたびに1件ずつたまる
// ════════════════════════════
const NOTICE_TYPES = {
  payment: { label: '支払い',   icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
  points:  { label: 'ポイント', icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 16V8h3.2a2.4 2.4 0 0 1 0 4.8H9.5"/>' },
  charge:  { label: 'チャージ', icon: '<path d="M12 19V5M5 12l7-7 7 7"/>' },
  reserve: { label: '予約',     icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
};

// [{ type, title, body, at, read }]（新しいものが先頭）
const notices = load(KEYS.notices, []);

function addNotice(type, title, body) {
  notices.unshift({ type, title, body, at: Date.now(), read: false });
  save(KEYS.notices, notices);
  updateNoticeBadges();
}

// 指定した種類のお知らせを既読にする
function markNoticesRead(types) {
  notices.forEach((n) => {
    if (types.includes(n.type)) n.read = true;
  });
  save(KEYS.notices, notices);
  updateNoticeBadges();
}

// ベルマークの右上に未読の数を出す
function updateNoticeBadges() {
  const unread = notices.filter((n) => !n.read).length;
  document.querySelectorAll('.notification-btn').forEach((btn) => {
    let badge = btn.querySelector('.notice-badge');
    if (!badge) {
      badge = el('span', 'notice-badge');
      btn.append(badge);
    }
    badge.textContent = unread > 9 ? '9+' : String(unread);
    badge.hidden = unread === 0;
    btn.setAttribute('aria-label', unread > 0 ? `お知らせ（未読${unread}件）` : 'お知らせ');
  });
}

// ════════════════════════════
//  残高
// ════════════════════════════
const INITIAL_BALANCE = 4000; // 最初の残高
const wallet = load(KEYS.wallet, { balance: INITIAL_BALANCE });

function chargeWallet(amount) {
  wallet.balance += amount;
  save(KEYS.wallet, wallet);
  updateWalletDisplays();
  addNotice('charge', 'チャージが完了しました', `${amount.toLocaleString()}円をチャージしました。残高：${wallet.balance.toLocaleString()}円`);
}

// 画面にある残高の数字をすべて書きかえる
function updateWalletDisplays() {
  document.querySelectorAll('.amount-value').forEach((node) => {
    node.textContent = wallet.balance.toLocaleString();
  });
}

// ════════════════════════════
//  ポイント
// ════════════════════════════
// { balance: 保有ポイント, history: [{ label, amount, at }] }
const pointData = load(KEYS.points, { balance: 0, history: [] });

function addPoints(amount, label) {
  if (amount <= 0) return;
  pointData.balance += amount;
  pointData.history.push({ label, amount, at: Date.now() });
  save(KEYS.points, pointData);
  updatePointDisplays();
  addNotice('points', `${amount.toLocaleString()}ptを獲得しました`, `${label}でポイントが付与されました。保有ポイント：${pointData.balance.toLocaleString()}pt`);
}

// 画面にある「保有ポイント」の数字をすべて書きかえる
function updatePointDisplays() {
  document.querySelectorAll('.points-value').forEach((node) => {
    node.textContent = pointData.balance.toLocaleString();
  });
}

// 予約でもらえるポイント（nights：泊数、people：人数）
function getReservePoints(shop, nights, people) {
  const rule = RESERVE_POINTS[shop.type];
  if (!rule) return 0;
  return rule.amount * (rule.per === 'night' ? nights : people);
}

// 「1泊につき500pt」のような説明
function getPointRuleText(shop) {
  const rule = RESERVE_POINTS[shop.type];
  if (!rule) return '';
  return `${rule.per === 'night' ? '1泊' : '1名'}につき${rule.amount.toLocaleString()}pt`;
}

// ════════════════════════════
//  クーポン
// ════════════════════════════
const acquired = load(KEYS.coupons, []); // 通常クーポンの獲得済み id

// 回遊クーポンの状態
// {
//   origin     : 起点の場所
//   unlockedAt : 起点で支払った時刻
//   expiresAt  : 有効期限
//   acquired   : [{ id, at }] 獲得したクーポンと時刻（＝送客の記録）
// }
let tour = load(KEYS.tour, null);

// 回遊クーポンの有効期限：解放した日の 23:59 まで
function getTourExpiry(unlockedAt) {
  const d = new Date(unlockedAt);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function isTourActive() {
  return tour !== null && Date.now() < tour.expiresAt;
}

function isTourExpired() {
  return tour !== null && Date.now() >= tour.expiresAt;
}

// 起点（高尾山）で支払ったときに呼ぶ
function unlockTour() {
  const now = Date.now();
  tour = {
    origin: TOUR_ORIGIN,
    unlockedAt: now,
    expiresAt: getTourExpiry(now),
    acquired: [],
  };
  save(KEYS.tour, tour);
  render();
}

// クーポン1枚の状態
//  available … 獲得できる
//  acquired  … 獲得済み
//  locked    … 回遊クーポンで、まだ高尾山で支払っていない
//  expired   … 回遊クーポンで、有効期限が切れた
function getStatus(coupon) {
  if (coupon.kind !== 'tour') {
    return acquired.includes(coupon.id) ? 'acquired' : 'available';
  }
  if (tour === null) return 'locked';
  if (isTourExpired()) return 'expired';
  const got = tour.acquired.some((item) => item.id === coupon.id);
  return got ? 'acquired' : 'available';
}

function acquireCoupon(coupon) {
  if (coupon.kind === 'tour') {
    tour.acquired.push({ id: coupon.id, at: Date.now() });
    save(KEYS.tour, tour);
  } else {
    acquired.push(coupon.id);
    save(KEYS.coupons, acquired);
  }
  render();
}

// ════════════════════════════
//  予約
// ════════════════════════════
const reservations = load(KEYS.reservations, []);

// 予約を保存して、お知らせとポイントを出す
function addReservation(shop, reservation) {
  reservations.push(reservation);
  save(KEYS.reservations, reservations);
  const when = shop.type === 'stay'
    ? `${formatDate(reservation.date)}から${reservation.nights}泊`
    : `${formatDate(reservation.date)} ${reservation.time}`;
  addNotice('reserve', '予約が完了しました', `${shop.name}　${when}・${reservation.people}名（予約番号 ${reservation.id}）`);
  addPoints(reservation.points, `${shop.name}の予約`);
}

// ════════════════════════════
//  スタンプラリー
//  スタンプは加盟店の key（merchants.js の buildMerchants で作る）ごとに記録する
// ════════════════════════════
// { stamps: { 加盟店の key: 押した時刻 }, claimed: [受け取った特典の count] }
const stampData = load(KEYS.stamps, { stamps: {}, claimed: [] });

// お店で桑都ペイを使ったとき（デモではボタン）にスタンプを押す
//  m … 加盟店（buildMerchants の1件）
function addStamp(m) {
  if (stampData.stamps[m.key]) return;
  stampData.stamps[m.key] = Date.now();
  save(KEYS.stamps, stampData);

  // 高尾山エリアのお店での支払いは、回遊クーポンの起点にもなる
  const unlocks = m.area === 'takao' && !isTourActive();
  addNotice('payment', '支払いが完了しました', unlocks
    ? `${m.name}で桑都ペイを使いました。スタンプと回遊クーポンが届きました。`
    : `${m.name}で桑都ペイを使いました。スタンプが押されました。`);
  if (unlocks) {
    unlockTour(); // この中で render() も呼ばれる
  } else {
    render();
  }
}

function claimReward(reward) {
  if (stampData.claimed.includes(reward.count)) return;
  stampData.claimed.push(reward.count);
  save(KEYS.stamps, stampData);
  render();
}

// 残高・ポイント・未読の数は、どのページでも描き直す
onRender(updatePointDisplays);
onRender(updateWalletDisplays);
onRender(updateNoticeBadges);
