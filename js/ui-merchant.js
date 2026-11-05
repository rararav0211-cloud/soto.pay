// ════════════════════════════════════════
//  ui-merchant.js … 加盟店まわり（加盟店一覧・回遊クーポンで使う）
//  ・COUPONS と SHOPS をまとめて「加盟店」の一覧にする
//  ・おすすめルートのお店とスタンプの数
//  ・加盟店の詳細パネル（ここから支払い・予約へ進める）
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
//  おすすめルート
// ════════════════════════════
// コースのお店（加盟店）を、spots に書いた順で取り出す
function getCourseSpots(course) {
  const merchants = buildMerchants();
  return course.spots
    .map((spot) => merchants.find((m) => isSameSpot(spot, m)))
    .filter(Boolean); // 見つからないもの（書き間違いなど）は外す
}

// コースでたまったスタンプの数
function getCourseCount(course) {
  return getCourseSpots(course).filter(hasStamp).length;
}

// コースのページへのリンク先
function getCourseUrl(course) {
  return `stamp.html?course=${course.id}`;
}

// 回遊クーポンを小さく並べる（「次に開くクーポン」など）
function createCouponChips(coupons) {
  const list = el('div', 'tour-chips');
  coupons.forEach((coupon) => {
    const status = getStatus(coupon);
    const chip = el('button', `tour-chip is-${status}`);
    chip.type = 'button';
    chip.append(el('span', 'tour-chip-name', coupon.name), el('span', 'tour-chip-amount', `${coupon.discount.toLocaleString()}円引き`));
    chip.addEventListener('click', () => openDetail(coupon));
    list.append(chip);
  });
  return list;
}

// 加盟店の詳細・支払い完了に出す「回遊」の枠
//  ・スタンプ ・このお店で払うと解放されるクーポン ・このお店が入っているおすすめルート
function createCourseBox(m) {
  const box = el('div', 'stamp-box');
  const head = el('div', 'tour-box-head');
  head.append(el('span', 'coupon-badge is-stamp', '回遊'), el('p', 'tour-box-title', '回遊クーポンのお店です'));
  box.append(head);

  if (isStampSpot(m)) {
    box.append(el('p', 'tour-box-text', hasStamp(m)
      ? `スタンプ獲得済み（${formatDateTime(stampData.stamps[m.key])}）`
      : 'このお店で桑都ペイを使うと、スタンプが1つ押されます。'));
  }

  const next = getUnlocksFor(m);
  if (next.length > 0) {
    box.append(el('p', 'tour-box-sub', `ここで支払うと解放されるクーポン（${getTourExpiryText()}）`), createCouponChips(next));
  }

  const courses = getCoursesFor(m);
  if (courses.length > 0) {
    box.append(el('p', 'tour-box-sub', 'このお店が入っているおすすめルート'));
    const list = el('div', 'course-mini-list');
    courses.forEach((course) => {
      const link = el('a', 'course-mini');
      link.href = getCourseUrl(course);
      link.append(el('span', 'course-mini-name', course.title),
        el('span', 'course-mini-count', `${getCourseCount(course)} / ${course.spots.length}`));
      list.append(link);
    });
    box.append(list);
  }
  return box;
}

// ════════════════════════════
//  加盟店の詳細（下から出るパネル）
// ════════════════════════════
function openMerchant(m) {
  openSheet(() => fillMerchant(m), true); // クーポンを獲得したら描き直す
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
    box.append(el('p', 'tour-box-text', `${getUnlockFromText(coupon)}で桑都ペイを使うと解放されます（${getTourExpiryText()}）。`));
  } else if (status === 'acquired') {
    box.append(el('p', 'tour-box-text', `このお店で桑都ペイを使うと、自動で割引されます${coupon.kind === 'tour' ? `（${getTourExpiryText()}）` : ''}。`));
  }

  const actions = el('div', 'tour-box-actions');
  if (status === 'available') {
    const getBtn = el('button', 'tour-box-btn', 'クーポンを獲得する');
    getBtn.addEventListener('click', () => acquireCoupon(coupon)); // render() でこのパネルも描き直される
    actions.append(getBtn);
  } else if (status === 'acquired' || status === 'used') {
    const done = el('button', 'tour-box-btn is-done', status === 'used' ? '使用済み' : '✓ 獲得済み');
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

  // クーポンがあるお店
  if (m.coupon) sheet.append(createMerchantCouponBox(m.coupon));

  // 回遊クーポンのお店（スタンプ・次に開くクーポン・おすすめルート）
  if (isStampSpot(m) || getUnlocksFor(m).length > 0) sheet.append(createCourseBox(m));

  // このお店で支払う（支払い画面へ）
  const payBtn = el('button', 'sheet-btn', 'このお店で支払う');
  payBtn.addEventListener('click', () => openPay({ merchant: m }));
  sheet.append(payBtn);

  // 予約できるお店
  if (m.shop) {
    const link = el('a', 'sheet-link', 'このお店を予約する');
    link.href = `reserve.html?type=${m.shop.type}&shop=${m.shop.id}`;
    sheet.append(link);
  }
}
