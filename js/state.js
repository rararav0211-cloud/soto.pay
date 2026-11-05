// ════════════════════════════════════════
//  state.js … アプリの「状態」（保存しておくデータ）と、それを変える操作
//  ・お知らせ ・残高 ・ポイント ・クーポン（通常・回遊） ・予約 ・回遊クーポンとスタンプ ・支払い
//  画面の作り方はここには書かず、データの読み書きだけをまとめる
// ════════════════════════════════════════
'use strict';

// localStorage に保存するときの名前（ここを変えると今までの保存データが読めなくなるので注意）
const KEYS = {
  coupons:      'sotoPayCoupons',       // 通常クーポンの獲得済み id
  usedCoupons:  'sotoPayUsedCoupons',   // 通常クーポンの使用済み id
  tour:         'sotoPayTour',          // 今日の回遊クーポン（解放・使用）
  courses:      'sotoPayCourses',       // おすすめルートの特典の受け取り
  notices:      'sotoPayNotices',       // お知らせ
  wallet:       'sotoPayWallet',        // 残高
  points:       'sotoPayPoints',        // ポイント
  reservations: 'sotoPayReservations',  // 予約
  stamps:       'sotoPayStamps',        // スタンプラリー
  payments:     'sotoPayPayments',      // 支払いの記録
  user:         'sotoPayUser',          // 利用者の番号（支払いコードに使う）
  bills:        'sotoPayBills',         // 公共料金・税金の支払い済み
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
  coupon:  { label: 'クーポン', icon: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>' },
  reward:  { label: '特典',     icon: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/>' },
  bill:    { label: '公共料金', icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>' },
  reserve: { label: '予約',     icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>' },
  deduct:  { label: '差し引き', icon: '<path d="M12 5v14M19 12l-7 7-7-7"/>' },
};

// 残高が動いたお知らせの種類（取引履歴に出すもの）
const MONEY_NOTICE_TYPES = ['payment', 'bill', 'charge', 'reward', 'deduct'];

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

// ポイントを使う（支払い・予約のキャンセルで差し引く）。お知らせは呼び出した側で出す
function usePointsFor(amount, label) {
  if (amount <= 0) return;
  pointData.balance -= amount;
  pointData.history.push({ label, amount: -amount, at: Date.now() });
  save(KEYS.points, pointData);
  updatePointDisplays();
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

// ════════════════════════════
//  回遊クーポン（つながりで解放）
//  ・高尾山エリアのお店で支払うと、八王子駅周辺の回遊クーポン（TOUR_FROM_TAKAO）が解放される
//  ・お店で支払うと、そのお店の「次のお店」の回遊クーポンが解放される
//    「次のお店」は、おすすめルート（TOUR_COURSES）の spots の並びから作る
//    例：ルートが ケーブルカー → 薬王院 → 髙橋家 なら、ケーブルカーで払うと薬王院、薬王院で払うと髙橋家が開く
//  ・ルートの最初のお店（高尾山）が回遊のはじまり
//  ・解放したクーポンは、その日の23:59まで（次の日は、また高尾山から）
// ════════════════════════════

// ルートの1か所（{ coupon } か { shop }）のクーポン
function getSpotCoupon(spot) {
  if (spot.coupon) return COUPONS.find((c) => c.id === spot.coupon) || null;
  const shop = SHOPS.find((s) => s.id === spot.shop);
  return shop ? getShopCoupon(shop) : null;
}

// つながり { クーポンの id: [次のクーポンの id, …] } と、はじまりのクーポンの id
const TOUR_NEXT = {};
const TOUR_STARTS = [];
TOUR_COURSES.forEach((course) => {
  const ids = course.spots.map(getSpotCoupon).filter(Boolean).map((c) => c.id);
  if (ids[0] && !TOUR_STARTS.includes(ids[0])) TOUR_STARTS.push(ids[0]);
  ids.forEach((id, i) => {
    const next = ids[i + 1];
    if (!next) return;
    TOUR_NEXT[id] = TOUR_NEXT[id] || [];
    if (!TOUR_NEXT[id].includes(next)) TOUR_NEXT[id].push(next);
  });
});

function findCoupon(id) {
  return COUPONS.find((c) => c.id === id);
}

// このクーポンのお店で払うと解放されるクーポン
function getNextCoupons(coupon) {
  return coupon ? (TOUR_NEXT[coupon.id] || []).map(findCoupon) : [];
}

// このクーポンを解放するお店（のクーポン）
function getPrevCoupons(coupon) {
  return Object.keys(TOUR_NEXT).filter((id) => TOUR_NEXT[id].includes(coupon.id)).map(findCoupon);
}

function isStartCoupon(coupon) {
  return TOUR_STARTS.includes(coupon.id);
}

// 高尾山エリアで支払うと解放されるクーポンか
function isFromTakao(coupon) {
  return TOUR_FROM_TAKAO.includes(coupon.id);
}

// 「〇〇・△△で支払うと解放」の〇〇・△△
function getUnlockFromText(coupon) {
  const names = getPrevCoupons(coupon).map((c) => c.name);
  if (isFromTakao(coupon)) names.unshift('高尾山エリアのお店');
  return names.join('・');
}

// 今日の回遊クーポン { day: '2026-11-05', unlocked: { id: 時刻 }, used: { id: 時刻 } }
// 日付が変わったら空にする
let tourDay = load(KEYS.tour, null);
function getTourDay() {
  if (!tourDay || tourDay.day !== todayString()) {
    tourDay = { day: todayString(), unlocked: {}, used: {} };
  }
  return tourDay;
}

// 今日の回遊クーポンの期限（今日の23:59）
function getTourExpiry() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

// 今日解放した回遊クーポン（はじまりのクーポンはふくまない）
function getUnlockedToday() {
  return Object.keys(getTourDay().unlocked).map(findCoupon).filter(Boolean);
}

// このお店（加盟店）で支払うと解放される回遊クーポン
function getUnlocksFor(m) {
  const next = getNextCoupons(m.coupon);
  if (m.area === 'takao') TOUR_FROM_TAKAO.map(findCoupon).forEach((c) => { if (!next.includes(c)) next.push(c); });
  return next.filter((c) => c && c.kind === 'tour' && !isStartCoupon(c));
}

// お店（加盟店）で支払ったときに呼ぶ。次のお店の回遊クーポンを解放して、新しく開いたものを返す
function unlockNext(m) {
  const day = getTourDay();
  const opened = getUnlocksFor(m).filter((c) => !day.unlocked[c.id]);
  opened.forEach((c) => { day.unlocked[c.id] = Date.now(); });
  if (opened.length > 0) save(KEYS.tour, day);
  return opened;
}

// クーポン1枚の状態
//  available … 獲得できる（通常クーポン）
//  acquired  … 獲得済み・解放済み（支払いで使える）
//  used      … 使った（回遊クーポンは今日使った）
//  locked    … 回遊クーポンで、まだ解放されていない
function getStatus(coupon) {
  if (coupon.kind === 'tour') {
    const day = getTourDay();
    if (day.used[coupon.id]) return 'used';
    return isStartCoupon(coupon) || day.unlocked[coupon.id] ? 'acquired' : 'locked';
  }
  if (usedCoupons.includes(coupon.id)) return 'used';
  return acquired.includes(coupon.id) ? 'acquired' : 'available';
}

// 通常クーポンを獲得する（回遊クーポンは支払いで解放される）
function acquireCoupon(coupon) {
  if (coupon.kind === 'tour' || acquired.includes(coupon.id)) return;
  acquired.push(coupon.id);
  save(KEYS.coupons, acquired);
  render();
}

// クーポンを使用済みにする
function markCouponUsed(coupon) {
  if (coupon.kind === 'tour') {
    const day = getTourDay();
    day.used[coupon.id] = Date.now();
    save(KEYS.tour, day);
    return;
  }
  if (usedCoupons.includes(coupon.id)) return;
  usedCoupons.push(coupon.id);
  save(KEYS.usedCoupons, usedCoupons);
}

// ════════════════════════════
//  おすすめルート（TOUR_COURSES）の特典
//  { claimed: { ルートの id: ['half' / 'complete'] } }
// ════════════════════════════
const courseData = load(KEYS.courses, { claimed: {} });
if (!courseData.claimed) courseData.claimed = {};

// ルートのお店で使える回遊クーポン
function getCourseCoupons(course) {
  return course.spots.map(getSpotCoupon).filter((coupon) => coupon && coupon.kind === 'tour');
}

// この回遊クーポンが入っているルート
function getCoursesForCoupon(coupon) {
  return TOUR_COURSES.filter((course) => getCourseCoupons(course).includes(coupon));
}

// お店の人がクーポン使用画面で「使用する」を押したとき
function useCoupon(coupon) {
  if (getStatus(coupon) !== 'acquired') return false;
  markCouponUsed(coupon);
  addNotice('coupon', 'クーポンを使用しました', `${coupon.name}の${coupon.discount.toLocaleString()}円引きクーポンを使用しました。`);
  render();
  return true;
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

// 予約の日時を「10月25日(土) 12:00」「10月25日(土)から1泊」の形にする
function getReservationWhen(r) {
  return r.nights ? `${formatDate(r.date)}から${r.nights}泊` : `${formatDate(r.date)} ${r.time}`;
}

// これからの予約か（キャンセルしておらず、来店の時刻をまだ過ぎていない）
// ・宿泊（時刻なし）… チェックインの日の終わりまで
// ・食べる・体験する … 予約した時刻まで
function isUpcomingReservation(r) {
  if (r.canceledAt) return false;
  const today = todayString();
  if (r.date !== today || !r.time) return r.date >= today;
  const [hour, minute] = r.time.split(':').map(Number);
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes() < hour * 60 + minute;
}

// 新しい予約番号を作る（いまある予約と重ならないように）
function createReservationId() {
  let id;
  do {
    id = `R${String(Math.floor(Math.random() * 1e6)).padStart(6, '0')}`;
  } while (reservations.some((r) => r.id === id));
  return id;
}

// 予約を保存して、お知らせとポイントを出す
function addReservation(shop, reservation) {
  reservations.push(reservation);
  save(KEYS.reservations, reservations);
  addNotice('reserve', '予約が完了しました', `${shop.name}　${getReservationWhen(reservation)}・${reservation.people}名（予約番号 ${reservation.id}）`);
  addPoints(reservation.points, `${shop.name}の予約`);
}

// 予約をキャンセルしたときに差し引くもの
//  予約でもらったポイントを差し引く。ポイントが足りないとき（支払いで使ったときなど）は、
//  足りない分を残高から1pt＝1円で差し引く
//  → { points: 差し引くポイント, yen: 残高から差し引く円, enough: 残高が足りるか }
function getCancelCharge(r) {
  const total = r.points || 0;
  const points = Math.min(total, pointData.balance);
  const yen = total - points;
  return { points, yen, enough: yen <= wallet.balance };
}

// 予約をキャンセルする（残高が足りず差し引けないときはキャンセルしない）
function cancelReservation(id) {
  const r = reservations.find((item) => item.id === id);
  if (!r || !isUpcomingReservation(r)) return false;
  const charge = getCancelCharge(r);
  if (!charge.enough) return false;

  r.canceledAt = Date.now();
  save(KEYS.reservations, reservations);

  usePointsFor(charge.points, `${r.shopName}の予約のキャンセル`);
  if (charge.yen > 0) {
    wallet.balance -= charge.yen;
    save(KEYS.wallet, wallet);
  }
  addNotice('reserve', '予約をキャンセルしました',
    `${r.shopName}　${getReservationWhen(r)}・${r.people}名（予約番号 ${r.id}）${r.points ? `\n予約でもらった${r.points.toLocaleString()}ptを差し引きました。` : ''}`);
  // 残高から差し引いたときは、取引履歴にも残す
  if (charge.yen > 0) {
    addNotice('deduct', '残高から差し引きました',
      `${r.shopName}の予約のキャンセルで、保有ポイントが足りない${charge.yen.toLocaleString()}pt分を${charge.yen.toLocaleString()}円差し引きました。残高：${wallet.balance.toLocaleString()}円`);
  }
  render();
  return true;
}

// ════════════════════════════
//  スタンプラリー
//  スタンプは加盟店の key（ui-merchant.js の buildMerchants で作る）ごとに記録する
// ════════════════════════════
// { stamps: { 加盟店の key: 押した時刻 } }
// スタンプはお店ごとに1つ。同じお店が入っているコースなら、どのコースでも押したことになる
const stampData = load(KEYS.stamps, { stamps: {} });

// TOUR_COURSES の spots の1件が、この加盟店のことかどうか
function isSameSpot(spot, m) {
  return Boolean((spot.shop && m.shop && m.shop.id === spot.shop) ||
    (spot.coupon && m.coupon && m.coupon.id === spot.coupon));
}

// この加盟店が入っているおすすめルート
function getCoursesFor(m) {
  return TOUR_COURSES.filter((course) => course.spots.some((spot) => isSameSpot(spot, m)));
}

// どれかのおすすめルートのお店か（スタンプが押せるか）
function isStampSpot(m) {
  return getCoursesFor(m).length > 0;
}

function hasStamp(m) {
  return Boolean(stampData.stamps[m.key]);
}

// コースの特典（半分たまったら・全部たまったら）
//  → [{ id: 'half' / 'complete', count: 必要なスタンプの数, amount: 円, label }]
function getCourseRewards(course) {
  const total = course.spots.length;
  const half = Math.ceil(total / 2);
  return [
    { id: 'half', count: half, amount: TOUR_REWARDS.half, label: `桑都ペイ ${TOUR_REWARDS.half.toLocaleString()}円分` },
    { id: 'complete', count: total, amount: TOUR_REWARDS.complete, label: `コース制覇！桑都ペイ ${TOUR_REWARDS.complete.toLocaleString()}円分` },
  ];
}

function isRewardClaimed(course, reward) {
  return (courseData.claimed[course.id] || []).includes(reward.id);
}

// おすすめルートの特典を受け取る（残高に足す）
function claimReward(course, reward) {
  if (isRewardClaimed(course, reward)) return;
  courseData.claimed[course.id] = [...(courseData.claimed[course.id] || []), reward.id];
  save(KEYS.courses, courseData);
  wallet.balance += reward.amount;
  save(KEYS.wallet, wallet);
  addNotice('reward', 'おすすめルートの特典を受け取りました',
    `「${course.title}」の${reward.label}を受け取りました。残高：${wallet.balance.toLocaleString()}円`);
  render();
}

// ════════════════════════════
//  支払い
//  お店で桑都ペイを使ったときの処理は、すべてこの pay() を通る
//  1. 使えるクーポンがあれば自動で割引
//  2. 残高を減らす
//  3. 回遊のお店ならスタンプを押す
//  4. 次のお店の回遊クーポンを解放
//  5. 支払いの記録とお知らせを残す
// ════════════════════════════
// [{ id, key, name, amount, discount, couponId, paid, at }]
const payments = load(KEYS.payments, []);

// 利用者の番号（初めて開いたときに1回だけ作る。本番ではログインした人の番号になる）
const user = load(KEYS.user, null) || { id: String(Math.floor(Math.random() * 1e8)).padStart(8, '0') };
save(KEYS.user, user);

// 支払う前の計算（画面の「お支払い額」の表示にも使う）
//  m … 加盟店（buildMerchants の1件） / amount … お会計の金額
//  points … 使いたいポイント（1pt＝1円。クーポンで割り引いたあとの金額から引く）
//            保有ポイントやお支払い額より多いときは、使える分だけ使う
function getPaymentPreview(m, amount, points = 0) {
  const coupon = getUsableCoupon(m.coupon, amount);
  const discount = coupon ? Math.min(coupon.discount, amount) : 0;
  const afterCoupon = amount - discount;
  const maxPoints = Math.min(pointData.balance, afterCoupon); // この支払いで使える最大のポイント
  const pointsUsed = Math.max(0, Math.min(Math.floor(points) || 0, maxPoints));
  const paid = afterCoupon - pointsUsed;
  return { coupon, discount, maxPoints, pointsUsed, paid, enough: paid <= wallet.balance, after: wallet.balance - paid };
}

// 支払う。結果を返す（失敗したら { ok: false, error }）
function pay(m, amount, points = 0) {
  if (!Number.isInteger(amount) || amount <= 0) {
    return { ok: false, error: '金額を入力してください' };
  }
  const preview = getPaymentPreview(m, amount, points);
  if (!preview.enough) {
    return { ok: false, error: '残高が足りません' };
  }

  // 1・2 クーポン・ポイントを使って、残高を減らす
  if (preview.coupon) markCouponUsed(preview.coupon);
  if (preview.pointsUsed > 0) usePointsFor(preview.pointsUsed, `${m.name}での支払い`);
  wallet.balance -= preview.paid;
  save(KEYS.wallet, wallet);

  // 3 スタンプ
  const stamped = isStampSpot(m) && !hasStamp(m);
  if (stamped) {
    stampData.stamps[m.key] = Date.now();
    save(KEYS.stamps, stampData);
  }

  // 4 次のお店の回遊クーポンを解放
  const unlocked = unlockNext(m);

  // 5 記録とお知らせ
  const payment = {
    id: `P${String(Date.now()).slice(-6)}`, // 取引番号（デモ用に時刻の下6けた）
    key: m.key,
    name: m.name,
    amount,
    discount: preview.discount,
    couponId: preview.coupon ? preview.coupon.id : null,
    pointsUsed: preview.pointsUsed,
    paid: preview.paid,
    at: Date.now(),
  };
  payments.push(payment);
  save(KEYS.payments, payments);

  const extras = [];
  if (stamped) extras.push('回遊のスタンプが押されました。');
  if (unlocked.length) extras.push(`次のお店の回遊クーポンが${unlocked.length}枚解放されました（本日23:59まで）。`);
  const used = [];
  if (payment.discount) used.push(`クーポン${payment.discount.toLocaleString()}円引き`);
  if (payment.pointsUsed) used.push(`${payment.pointsUsed.toLocaleString()}pt使用`);
  const couponText = used.length ? `（${used.join('・')}）` : '';
  // ポイントだけで払ったときは「0円を支払いました」にならないようにする
  const paidText = payment.paid === 0 && payment.pointsUsed
    ? `${m.name}で${payment.pointsUsed.toLocaleString()}ptを使って支払いました${payment.discount ? `（クーポン${payment.discount.toLocaleString()}円引き）` : ''}`
    : `${m.name}で${payment.paid.toLocaleString()}円を支払いました${couponText}`;
  addNotice('payment', '支払いが完了しました',
    `${paidText}。残高：${wallet.balance.toLocaleString()}円${extras.length ? `\n${extras.join('')}` : ''}`);

  render();
  return { ok: true, payment, coupon: preview.coupon, stamped, unlocked };
}

// ════════════════════════════
//  公共料金・税金の支払い
//  払込票のバーコードを読み取って、残高から払う
//  クーポン・ポイントは使えない（スタンプ・回遊クーポンの解放もなし）
// ════════════════════════════
// { paid: { 払込票の id: { at: 支払った時刻, receipt: 受付番号 } } }
const billData = load(KEYS.bills, { paid: {} });

function isBillPaid(bill) {
  return Boolean(billData.paid[bill.id]);
}

// 支払期限（「2026-11-17」の形）
function getBillDue(bill) {
  const d = new Date();
  d.setDate(d.getDate() + bill.dueInDays);
  return toDateString(d);
}

// 公共料金を払う。結果を返す（失敗したら { ok: false, error }）
function payBill(bill) {
  if (isBillPaid(bill)) return { ok: false, error: 'この払込票は支払い済みです' };
  if (bill.amount > wallet.balance) return { ok: false, error: '残高が足りません' };

  wallet.balance -= bill.amount;
  save(KEYS.wallet, wallet);
  const record = { at: Date.now(), receipt: `B${String(Date.now()).slice(-8)}` };
  billData.paid[bill.id] = record;
  save(KEYS.bills, billData);

  addNotice('bill', '公共料金の支払いが完了しました',
    `${bill.issuer}　${bill.title}　${bill.amount.toLocaleString()}円を支払いました（受付番号 ${record.receipt}）。残高：${wallet.balance.toLocaleString()}円`);
  render();
  return { ok: true, record };
}

// 残高・ポイント・未読の数は、どのページでも描き直す
onRender(updatePointDisplays);
onRender(updateWalletDisplays);
onRender(updateNoticeBadges);
