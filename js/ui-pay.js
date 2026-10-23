// ════════════════════════════════════════
//  ui-pay.js … 支払いの画面（どのページからも開ける）
//  1. お店を選ぶ（お店のQRコードを読み取ったときは飛ばす）
//  2. 金額を入れる（使えるクーポンは自動で割引）
//  3. 支払い完了（スタンプ・回遊クーポンのお知らせ）
//  支払いの計算と記録は state.js の pay() が行う
// ════════════════════════════════════════
'use strict';

const PAY_PRESETS = [500, 1000, 3000, 5000]; // 金額をすぐ入れられるボタン
const PAY_MAX = 100000;                      // 1回に払える上限（デモ用）

// options.merchant … 最初からこのお店で払う（加盟店詳細・QRの読み取りから開いたとき）
// options.area     … このエリアのお店だけを選べるようにする（回遊バナーから開いたとき）
function openPay(options = {}) {
  let merchant = options.merchant || null;
  let amountText = '';
  let query = '';

  // ════════════════════════════
  //  1. お店を選ぶ
  // ════════════════════════════
  function fillSelect() {
    resetSheet('お店を選ぶ');

    const lead = el('p', 'sheet-desc', 'お店に置いてあるQRコードを読み取る代わりに、支払うお店を選んでください（デモ）。');

    const search = el('div', 'search-box pay-search');
    const input = el('input', 'merchant-search');
    input.type = 'search';
    input.placeholder = '店名・ジャンルで探す';
    input.setAttribute('aria-label', 'お店を検索');
    input.value = query;
    search.append(input);

    const list = el('div', 'pay-shop-list');
    function renderShops() {
      list.replaceChildren();
      const word = query.trim().toLowerCase();
      const shops = buildMerchants().filter((m) =>
        (!options.area || m.area === options.area) &&
        (word === '' || `${m.name} ${m.genre}`.toLowerCase().includes(word)));
      if (shops.length === 0) {
        list.append(el('p', 'notice-empty', '該当するお店はありません'));
        return;
      }
      shops.forEach((m) => list.append(createShopRow(m)));
    }
    input.addEventListener('input', () => {
      query = input.value;
      renderShops(); // 入力欄はそのまま、一覧だけ描き直す
    });
    renderShops();

    const title = options.area ? `${AREAS[options.area]}のお店で支払う` : '支払うお店を選ぶ';
    sheet.append(...sheetTop(), el('h2', 'sheet-title', title), lead, search, list);
  }

  // お店の1行（クーポン・スタンプの目印つき）
  function createShopRow(m) {
    const row = el('button', 'pay-shop');
    const info = el('div', 'pay-shop-info');
    info.append(el('p', 'pay-shop-name', m.name), el('p', 'pay-shop-genre', `${m.genre}・${AREAS[m.area]}`));

    const tags = el('div', 'pay-shop-tags');
    if (m.coupon && getStatus(m.coupon) === 'acquired') {
      tags.append(el('span', 'coupon-badge is-coupon', `${m.coupon.discount.toLocaleString()}円引き`));
    }
    if (isStampSpot(m) && !hasStamp(m)) tags.append(el('span', 'coupon-badge is-stamp', 'スタンプ'));
    if (m.area === 'takao' && !isTourActive()) tags.append(el('span', 'coupon-badge', '回遊'));

    row.append(createIcon(m.icon), info, tags);
    row.addEventListener('click', () => {
      merchant = m;
      amountText = '';
      fillAmount();
    });
    return row;
  }

  // ════════════════════════════
  //  2. 金額を入れる
  // ════════════════════════════
  function fillAmount() {
    resetSheet(`${merchant.name}で支払う`);
    const m = merchant;

    // お店（選び直しボタンつき）
    const shopHead = el('div', 'pay-head');
    const shopInfo = el('div', 'pay-shop-info');
    shopInfo.append(el('p', 'pay-head-label', '支払い先'), el('p', 'pay-shop-name', m.name));
    shopHead.append(createIcon(m.icon), shopInfo);
    if (!options.merchant) {
      const change = el('button', 'tour-box-link', '変更');
      change.addEventListener('click', fillSelect);
      shopHead.append(change);
    }

    // 金額の入力
    const amountBox = el('label', 'pay-amount');
    const input = el('input', 'pay-amount-input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.autocomplete = 'off';
    input.placeholder = '0';
    input.value = amountText;
    input.setAttribute('aria-label', 'お会計の金額（円）');
    amountBox.append(el('span', 'pay-amount-label', 'お会計'), input, el('span', 'pay-amount-unit', '円'));

    const presets = el('div', 'pay-presets');
    PAY_PRESETS.forEach((value) => {
      const btn = el('button', 'pay-preset', `${value.toLocaleString()}円`);
      btn.type = 'button';
      btn.addEventListener('click', () => {
        amountText = String(value);
        input.value = amountText;
        update();
      });
      presets.append(btn);
    });

    // 金額を入れるたびに書きかわる部分
    const couponArea = el('div', 'pay-coupon-area');
    const summary = el('dl', 'sheet-info pay-summary');
    const error = el('div', 'pay-error');
    const submit = el('button', 'sheet-btn', '支払う');

    function getAmount() {
      return Number(amountText || 0);
    }

    function update() {
      const amount = getAmount();
      const preview = getPaymentPreview(m, amount);

      // クーポンの案内
      couponArea.replaceChildren();
      const couponBox = createPayCouponBox(m, amount, update);
      if (couponBox) couponArea.append(couponBox);

      // 内訳
      summary.replaceChildren(
        el('dt', '', 'お会計'), el('dd', '', `${amount.toLocaleString()}円`),
        el('dt', '', 'クーポン'), el('dd', preview.discount ? 'pay-discount' : '', preview.discount ? `−${preview.discount.toLocaleString()}円` : 'なし'),
        el('dt', '', 'お支払い'), el('dd', 'pay-total', `${preview.paid.toLocaleString()}円`),
        el('dt', '', '支払い後の残高'), el('dd', preview.enough ? '' : 'pay-short', `${preview.after.toLocaleString()}円`)
      );

      // 残高が足りないとき
      error.replaceChildren();
      error.hidden = true;
      if (amount > PAY_MAX) {
        error.append(el('p', 'form-error', `1回に支払えるのは${PAY_MAX.toLocaleString()}円までです`));
        error.hidden = false;
      } else if (amount > 0 && !preview.enough) {
        const short = preview.paid - wallet.balance;
        error.append(el('p', 'form-error', `残高が${short.toLocaleString()}円足りません`));
        const chargeBtn = el('button', 'tour-box-btn pay-charge-btn', 'チャージする');
        chargeBtn.type = 'button';
        chargeBtn.addEventListener('click', () => openCharge(() => openSheet(fillAmount, false), short));
        error.append(chargeBtn);
        error.hidden = false;
      }

      const ok = amount > 0 && amount <= PAY_MAX && preview.enough;
      submit.disabled = !ok;
      submit.textContent = ok ? `${preview.paid.toLocaleString()}円を支払う` : '支払う';
    }

    // 数字以外は入らないようにする（全角数字は半角に直す）
    input.addEventListener('input', () => {
      const digits = input.value
        .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
        .replace(/[^0-9]/g, '')
        .replace(/^0+/, '')
        .slice(0, 7);
      amountText = digits;
      input.value = digits;
      update();
    });

    submit.addEventListener('click', () => {
      const result = pay(m, getAmount());
      if (result.ok) fillDone(result);
    });

    update();
    sheet.append(...sheetTop(), el('h2', 'sheet-title', '支払う'), shopHead, amountBox, presets, couponArea, summary, error, submit);
    if (!amountText) input.focus();
  }

  // ════════════════════════════
  //  3. 支払い完了
  // ════════════════════════════
  function fillDone(result) {
    resetSheet('支払い完了');
    sheet.scrollTop = 0;
    const { payment } = result;

    const total = el('p', 'pay-done-amount');
    total.append(el('span', '', payment.paid.toLocaleString()), '円');

    const info = el('dl', 'sheet-info');
    info.append(
      el('dt', '', 'お店'), el('dd', '', payment.name),
      el('dt', '', 'お会計'), el('dd', '', `${payment.amount.toLocaleString()}円`),
      el('dt', '', 'クーポン'), el('dd', '', result.coupon ? `${result.coupon.discount.toLocaleString()}円引き` : 'なし'),
      el('dt', '', '残高'), el('dd', '', `${wallet.balance.toLocaleString()}円`),
      el('dt', '', '日時'), el('dd', '', formatDateTime(payment.at)),
      el('dt', '', '取引番号'), el('dd', '', payment.id)
    );

    sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
      el('h2', 'sheet-title reserve-done-title', '支払いが完了しました'), total, info);

    // スタンプが押されたとき
    if (result.stamped) {
      const box = el('div', 'stamp-box');
      const head = el('div', 'tour-box-head');
      head.append(el('span', 'coupon-badge is-stamp', 'スタンプ'), el('p', 'tour-box-title', 'スタンプが押されました'));
      const link = el('a', 'tour-box-link', `スタンプカードを見る（${getStampCount()} / ${getStampSpots().length}）`);
      link.href = 'stamp.html';
      box.append(head, link);
      sheet.append(box);
    }

    // 回遊クーポンが届いたとき
    if (result.unlocked) {
      const box = el('div', 'tour-box');
      const head = el('div', 'tour-box-head');
      head.append(el('span', 'coupon-badge', '回遊'), el('p', 'tour-box-title', `${TOUR_DESTINATION}の回遊クーポンが届きました`));
      const link = el('a', 'tour-box-link', 'クーポンを見る');
      link.href = 'coupons.html';
      box.append(head, el('p', 'tour-box-text', `本日${formatTime(tour.expiresAt)}まで使えます。`), link);
      sheet.append(box);
    }

    const closeBtn = el('button', 'sheet-btn', '閉じる');
    closeBtn.addEventListener('click', closeSheet);
    sheet.append(closeBtn);
  }

  if (merchant) {
    openSheet(fillAmount, false);
  } else {
    openSheet(fillSelect, false);
  }
}

// ════════════════════════════
//  支払い画面の「クーポン」の案内
//  onChange … クーポンを獲得したときに呼ぶ（画面を計算し直す）
// ════════════════════════════
function createPayCouponBox(m, amount, onChange) {
  const coupon = m.coupon;
  if (!coupon) return null;
  const status = getStatus(coupon);
  if (status === 'expired') return null;

  const box = el('div', coupon.kind === 'tour' ? 'tour-box' : 'tour-box is-normal');
  const head = el('div', 'tour-box-head');
  if (coupon.kind === 'tour') head.append(el('span', 'coupon-badge', '回遊'));
  head.append(el('p', 'tour-box-title', `${coupon.discount.toLocaleString()}円引きクーポン（${getConditionText(coupon)}）`));
  box.append(head);

  if (status === 'used') {
    box.append(el('p', 'tour-box-text', 'このクーポンは使用済みです。'));
  } else if (status === 'locked') {
    box.append(el('p', 'tour-box-text', `${TOUR_ORIGIN}で桑都ペイを使うと解放されます。`));
  } else if (status === 'available') {
    box.append(el('p', 'tour-box-text', '獲得すると、この支払いから割引されます。'));
    const btn = el('button', 'tour-box-btn', 'クーポンを獲得する');
    btn.type = 'button';
    btn.addEventListener('click', () => {
      acquireCoupon(coupon);
      onChange();
    });
    box.append(btn);
  } else if (amount >= coupon.minSpend) {
    box.append(el('p', 'tour-box-text pay-coupon-ok', '✓ この支払いで自動で割引されます'));
  } else {
    const rest = coupon.minSpend - amount;
    box.append(el('p', 'tour-box-text', `あと${rest.toLocaleString()}円以上の支払いで使えます。`));
  }
  return box;
}

// ════════════════════════════
//  QRコード
//  お店のQRコードの中身は「SOTOPAY:SHOP:加盟店の key」
//  （pay.html で読み取ると、そのお店への支払い画面が開く）
// ════════════════════════════
const SHOP_QR_PREFIX = 'SOTOPAY:SHOP:';

function getShopQrText(m) {
  return `${SHOP_QR_PREFIX}${m.key}`;
}

// 読み取った文字からお店を探す（桑都ペイのお店のQRでなければ null）
function findMerchantByQr(text) {
  if (!text || !text.startsWith(SHOP_QR_PREFIX)) return null;
  const key = text.slice(SHOP_QR_PREFIX.length);
  return buildMerchants().find((m) => m.key === key) || null;
}

// box の中に、text を表すQRコードを描く
//  QRコードを作るライブラリ（qrcode-generator）が読み込めなかったときは案内を出す
function renderQr(box, text) {
  if (typeof qrcode === 'undefined') {
    box.replaceChildren(el('p', 'map-error', 'QRコードを表示できませんでした。通信環境を確認してください。'));
    return;
  }
  const qr = qrcode(0, 'M'); // 0 … 大きさは自動 / 'M' … 少し汚れても読める強さ
  qr.addData(text);
  qr.make();
  // ライブラリが作る SVG（中身は QR の四角だけ）をそのまま入れている
  box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}
