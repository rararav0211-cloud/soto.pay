// ════════════════════════════════════════
//  ui-merchant.js … 加盟店まわり（加盟店一覧・スタンプラリーで使う）
//  ・COUPONS と SHOPS をまとめて「加盟店」の一覧にする
//  ・スタンプラリーの対象かどうか・スタンプの有無
//  ・加盟店の詳細パネル
// ════════════════════════════════════════
'use strict';

// ════════════════════════════
//  加盟店の一覧を作る
//  COUPONS（クーポンのあるお店）と SHOPS（予約できるお店）をまとめて1つにする
//  SHOPS の couponId が COUPONS の id と同じなら、同じお店として1件にまとめる
//
//  1件の形：
//  { key, name, area, genre, icon, category, description, access, shop, coupon, lat, lng }
// ════════════════════════════

// 地図に出す位置を取り出す（なければ null）
function getPosition(shop, coupon) {
  if (shop && shop.lat) return { lat: shop.lat, lng: shop.lng };
  const detail = coupon ? COUPON_DETAILS[coupon.id] : null;
  if (detail && detail.lat) return { lat: detail.lat, lng: detail.lng };
  return { lat: null, lng: null };
}

function buildMerchants() {
  const merchants = [];

  // 予約できるお店
  SHOPS.forEach((shop) => {
    const coupon = getShopCoupon(shop);
    merchants.push({
      key: `shop-${shop.id}`,
      name: shop.name,
      area: shop.area,
      genre: shop.genre,
      icon: shop.type,
      category: shop.type, // food / stay / experience
      description: shop.description,
      access: shop.access,
      shop,
      coupon,
      // 位置：お店に書いてあればそれを、なければクーポン詳細の位置を使う
      ...getPosition(shop, coupon),
    });
  });

  // クーポンだけのお店（予約できるお店とまだまとめていないもの）
  COUPONS.forEach((coupon) => {
    if (merchants.some((m) => m.coupon && m.coupon.id === coupon.id)) return;
    const detail = COUPON_DETAILS[coupon.id] || {};
    merchants.push({
      key: `coupon-${coupon.id}`,
      name: coupon.name,
      area: detail.area || 'other',
      genre: getCategoryLabel(coupon.category),
      icon: coupon.category,
      category: coupon.category, // shopping / food / leisure / transport
      description: detail.description || '',
      access: '',
      shop: null,
      coupon,
      ...getPosition(null, coupon),
    });
  });

  // エリアの順（AREAS に書いた順）に並べる
  const areaOrder = Object.keys(AREAS);
  merchants.sort((a, b) => areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area));
  return merchants;
}

// ════════════════════════════
//  スタンプラリー
// ════════════════════════════
// STAMP_RALLY.spots の1件が、この加盟店のことかどうか
function isSameSpot(spot, m) {
  return (spot.shop && m.shop && m.shop.id === spot.shop) ||
    (spot.coupon && m.coupon && m.coupon.id === spot.coupon);
}

// 対象のお店を、STAMP_RALLY.spots に書いた順で取り出す
function getStampSpots() {
  const merchants = buildMerchants();
  return STAMP_RALLY.spots
    .map((spot) => merchants.find((m) => isSameSpot(spot, m)))
    .filter(Boolean); // 見つからないもの（書き間違いなど）は外す
}

function isStampSpot(m) {
  return STAMP_RALLY.spots.some((spot) => isSameSpot(spot, m));
}

function hasStamp(m) {
  return Boolean(stampData.stamps[m.key]);
}

function getStampCount() {
  return getStampSpots().filter(hasStamp).length;
}

// 加盟店の詳細パネルに出す「スタンプラリー」の枠
function createStampBox(m) {
  const box = el('div', 'stamp-box');
  const head = el('div', 'tour-box-head');
  head.append(el('span', 'coupon-badge is-stamp', 'スタンプ'), el('p', 'tour-box-title', `${STAMP_RALLY.title}の対象店`));
  box.append(head);

  if (hasStamp(m)) {
    box.append(el('p', 'tour-box-text', `スタンプ獲得済み（${formatDateTime(stampData.stamps[m.key])}）`));
  } else {
    box.append(el('p', 'tour-box-text', 'このお店で桑都ペイを使うと、スタンプが1つ押されます。'));
    if (m.area === 'takao') {
      box.append(el('p', 'tour-box-text', `${TOUR_ORIGIN}エリアでの支払いなので、回遊クーポンも届きます。`));
    }
    const btn = el('button', 'tour-box-btn stamp-btn', 'ここで支払う');
    btn.addEventListener('click', () => addStamp(m));
    box.append(btn);
  }

  const link = el('a', 'tour-box-link', `スタンプカードを見る（${getStampCount()} / ${getStampSpots().length}）`);
  link.href = 'stamp.html';
  box.append(link);
  return box;
}

// ════════════════════════════
//  加盟店の詳細（下から出るパネル）
// ════════════════════════════
function openMerchant(m) {
  openSheet(() => fillMerchant(m), true); // クーポンやスタンプを獲得したら描き直す
}

// 「このお店で使えるクーポン」の枠
function createMerchantCouponBox(coupon) {
  const status = getStatus(coupon);
  const box = el('div', coupon.kind === 'tour' ? 'tour-box' : 'tour-box is-normal');

  const head = el('div', 'tour-box-head');
  if (coupon.kind === 'tour') head.append(el('span', 'coupon-badge', '回遊'));
  head.append(el('p', 'tour-box-title', 'このお店で使えるクーポン'));

  const amount = el('p', 'tour-box-amount');
  amount.append(el('strong', '', `${coupon.discount.toLocaleString()}円引き`), `（${getConditionText(coupon)}）`);

  box.append(head, amount);

  if (status === 'locked') {
    box.append(el('p', 'tour-box-text', `${TOUR_ORIGIN}で桑都ペイを使うと解放されます。`));
  } else if (status === 'expired') {
    box.append(el('p', 'tour-box-text', '回遊クーポンの期限が切れました。'));
  }

  const actions = el('div', 'tour-box-actions');
  if (status === 'available') {
    const getBtn = el('button', 'tour-box-btn', 'クーポンを獲得する');
    getBtn.addEventListener('click', () => acquireCoupon(coupon)); // render() でこのパネルも描き直される
    actions.append(getBtn);
  } else if (status === 'acquired') {
    const done = el('button', 'tour-box-btn is-done', '✓ 獲得済み');
    done.disabled = true;
    actions.append(done);
  }
  const detailBtn = el('button', 'tour-box-link', 'クーポンの詳細を見る');
  detailBtn.addEventListener('click', () => openDetail(coupon));
  actions.append(detailBtn);
  box.append(actions);
  return box;
}

function fillMerchant(m) {
  resetSheet(`${m.name}の詳細`);

  const labels = el('div', 'coupon-labels');
  labels.append(el('span', 'coupon-category', m.genre), el('span', 'coupon-category', AREAS[m.area]));

  const title = el('h2', 'sheet-title', m.name);
  const desc = el('p', 'sheet-desc', m.description);

  const info = el('dl', 'sheet-info');
  info.append(el('dt', '', 'エリア'), el('dd', '', AREAS[m.area]));
  info.append(el('dt', '', 'ジャンル'), el('dd', '', m.genre));
  if (m.access) info.append(el('dt', '', 'アクセス'), el('dd', '', m.access));
  if (m.shop && m.shop.price) info.append(el('dt', '', '料金'), el('dd', '', m.shop.price));

  sheet.append(...sheetTop(), labels, title, desc, info);

  // 高尾山エリアのお店は回遊の起点であることを伝える
  if (m.area === 'takao') sheet.append(createOriginBox());

  // クーポンがあるお店
  if (m.coupon) sheet.append(createMerchantCouponBox(m.coupon));

  // スタンプラリーの対象のお店
  if (isStampSpot(m)) sheet.append(createStampBox(m));

  // 予約できるお店
  if (m.shop) {
    const link = el('a', 'sheet-btn sheet-btn-link', 'このお店を予約する');
    link.href = `reserve.html?type=${m.shop.type}&shop=${m.shop.id}`;
    sheet.append(link);
  }
}
