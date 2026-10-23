// ════════════════════════════════════════
//  state.js … アプリの「状態」（保存しておくデータ）と、それを変える操作
//  ・お知らせ ・残高 ・ポイント ・クーポン（通常・回遊） ・予約 ・スタンプ ・支払い
//  画面の作り方はここには書かず、データの読み書きだけをまとめる
// ════════════════════════════════════════
'use strict';

// localStorage に保存するときの名前（ここを変えると今までの保存データが読めなくなるので注意）
const KEYS = {
  coupons:      'sotoPayCoupons',       // 通常クーポンの獲得済み id
  usedCoupons:  'sotoPayUsedCoupons',   // 通常クーポンの使用済み id
  tour:         'sotoPayTour',          // 回遊クーポンの解放状況
  notices:      'sotoPayNotices',       // お知らせ
  wallet:       'sotoPayWallet',        // 残高
  points:       'sotoPayPoints',        // ポイント
  reservations: 'sotoPayReservations',  // 予約
  stamps:       'sotoPayStamps',        // スタンプラリー
  payments:     'sotoPayPayments',      // 支払いの記録
  user:         'sotoPayUser',          // 利用者の番号（支払いコードに使う）
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
//  支払い・ポイント・チャージ・予約・特典のたびに1件ずつたまる
// ════════════════════════════
const NOTICE_TYPES = {
  payment: { label: '支払い',   icon: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>' },
  points:  { label: 'ポイント', icon: '<circle cx="12" cy="12" r="9"/><path d="M9.5 16V8h3.2a2.4 2.4 0 0 1 0 4.8H9.5"/>' },
  charge:  { label: 'チャージ', icon: '<path d="M12 19V5M5 12l7-7 7 7"/>' },
  reward:  { label: '特典',     icon: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>' },
  reserve: { label: '予約',     icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
};

// 残高が動いたお知らせの種類（取引履歴に出すもの）
const MONEY_NOTICE_TYPES = ['payment', 'charge', 'reward'];

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
const acquired = load(KEYS.coupons, []);        // 通常クーポンの獲得済み id
const usedCoupons = load(KEYS.usedCoupons, []); // 通常クーポンの使用済み id

// 回遊クーポンの状態
// {
//   origin     : 起点の場所
//   unlockedAt : 起点で支払った時刻
//   expiresAt  : 有効期限
//   acquired   : [{ id, at, usedAt }] 獲得したクーポンと時刻（＝送客の記録）。使ったら usedAt が入る
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
}

// クーポン1枚の状態
//  available … 獲得できる
//  acquired  … 獲得済み（支払いで使える）
//  used      … 支払いで使った
//  locked    … 回遊クーポンで、まだ高尾山で支払っていない
//  expired   … 回遊クーポンで、有効期限が切れた
function getStatus(coupon) {
  if (coupon.kind !== 'tour') {
    if (usedCoupons.includes(coupon.id)) return 'used';
    return acquired.includes(coupon.id) ? 'acquired' : 'available';
  }
  if (tour === null) return 'locked';
  if (isTourExpired()) return 'expired';
  const item = tour.acquired.find((a) => a.id === coupon.id);
  if (!item) return 'available';
  return item.usedAt ? 'used' : 'acquired';
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

// クーポンを使用済みにする
function markCouponUsed(coupon) {
  if (coupon.kind === 'tour') {
    const item = tour.acquired.find((a) => a.id === coupon.id);
    if (item) item.usedAt = Date.now();
    save(KEYS.tour, tour);
  } else {
    usedCoupons.push(coupon.id);
    save(KEYS.usedCoupons, usedCoupons);
  }
}

// この金額の支払いでクーポンが使えるか（使えるならそのクーポン、使えないなら null）
function getUsableCoupon(coupon, amount) {
  if (!coupon || getStatus(coupon) !== 'acquired') return null;
  return amount >= coupon.minSpend ? coupon : null;
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
//  スタンプは加盟店の key（ui-merchant.js の buildMerchants で作る）ごとに記録する
// ════════════════════════════
// { stamps: { 加盟店の key: 押した時刻 }, claimed: [受け取った特典の count] }
const stampData = load(KEYS.stamps, { stamps: {}, claimed: [] });

// STAMP_RALLY.spots の1件が、この加盟店のことかどうか
function isSameSpot(spot, m) {
  return Boolean((spot.shop && m.shop && m.shop.id === spot.shop) ||
    (spot.coupon && m.coupon && m.coupon.id === spot.coupon));
}

function isStampSpot(m) {
  return STAMP_RALLY.spots.some((spot) => isSameSpot(spot, m));
}

function hasStamp(m) {
  return Boolean(stampData.stamps[m.key]);
}

// 特典を受け取る（残高に足す）
function claimReward(reward) {
  if (stampData.claimed.includes(reward.count)) return;
  stampData.claimed.push(reward.count);
  save(KEYS.stamps, stampData);
  wallet.balance += reward.amount;
  save(KEYS.wallet, wallet);
  addNotice('reward', 'スタンプラリーの特典を受け取りました',
    `${reward.label}を受け取りました。残高：${wallet.balance.toLocaleString()}円`);
  render();
}

// ════════════════════════════
//  支払い
//  お店で桑都ペイを使ったときの処理は、すべてこの pay() を通る
//  1. 使えるクーポンがあれば自動で割引
//  2. 残高を減らす
//  3. スタンプラリーの対象店ならスタンプを押す
//  4. 高尾山エリアのお店なら回遊クーポンを解放
//  5. 支払いの記録とお知らせを残す
// ════════════════════════════
// [{ id, key, name, amount, discount, couponId, paid, at }]
const payments = load(KEYS.payments, []);

// 利用者の番号（初めて開いたときに1回だけ作る。本番ではログインした人の番号になる）
const user = load(KEYS.user, null) || { id: String(Math.floor(Math.random() * 1e8)).padStart(8, '0') };
save(KEYS.user, user);

// 支払う前の計算（画面の「お支払い額」の表示にも使う）
//  m … 加盟店（buildMerchants の1件） / amount … お会計の金額
function getPaymentPreview(m, amount) {
  const coupon = getUsableCoupon(m.coupon, amount);
  const discount = coupon ? Math.min(coupon.discount, amount) : 0;
  const paid = amount - discount;
  return { coupon, discount, paid, enough: paid <= wallet.balance, after: wallet.balance - paid };
}

// 支払う。結果を返す（失敗したら { ok: false, error }）
function pay(m, amount) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: '金額を入力してください' };
  }
  const preview = getPaymentPreview(m, amount);
  if (!preview.enough) {
    return { ok: false, error: '残高が足りません' };
  }

  // 1・2 クーポンを使って、残高を減らす
  if (preview.coupon) markCouponUsed(preview.coupon);
  wallet.balance -= preview.paid;
  save(KEYS.wallet, wallet);

  // 3 スタンプ
  const stamped = isStampSpot(m) && !hasStamp(m);
  if (stamped) {
    stampData.stamps[m.key] = Date.now();
    save(KEYS.stamps, stampData);
  }

  // 4 回遊クーポン（高尾山エリアで、まだ配信中でなければ）
  const unlocked = m.area === 'takao' && !isTourActive();
  if (unlocked) unlockTour();

  // 5 記録とお知らせ
  const payment = {
    id: `P${String(Date.now()).slice(-6)}`, // 取引番号（デモ用に時刻の下6けた）
    key: m.key,
    name: m.name,
    amount,
    discount: preview.discount,
    couponId: preview.coupon ? preview.coupon.id : null,
    paid: preview.paid,
    at: Date.now(),
  };
  payments.push(payment);
  save(KEYS.payments, payments);

  const extras = [];
  if (stamped) extras.push('スタンプが押されました。');
  if (unlocked) extras.push(`${TOUR_DESTINATION}の回遊クーポンが届きました。`);
  const couponText = payment.discount ? `（クーポン${payment.discount.toLocaleString()}円引き）` : '';
  addNotice('payment', '支払いが完了しました',
    `${m.name}で${payment.paid.toLocaleString()}円を支払いました${couponText}。残高：${wallet.balance.toLocaleString()}円${extras.length ? `\n${extras.join('')}` : ''}`);

  render();
  return { ok: true, payment, coupon: preview.coupon, stamped, unlocked };
}

// 残高・ポイント・未読の数は、どのページでも描き直す
onRender(updatePointDisplays);
onRender(updateWalletDisplays);
onRender(updateNoticeBadges);
