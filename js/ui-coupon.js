// ════════════════════════════════════════
//  ui-coupon.js … クーポンまわりの画面部品（複数のページで使う）
//  ・クーポンカード（ホーム・クーポン一覧）
//  ・クーポン詳細のパネル
//  ・回遊クーポンの案内バナーと残り時間
//  ・「ここは回遊クーポンの起点です」の枠
// ════════════════════════════════════════
'use strict';

const BUTTON_TEXT = {
  available: '獲得する',
  acquired: '獲得済み',
  used: '使用済み',
  locked: '未解放',
  expired: '期限切れ',
};

// 利用条件の文章（minSpend が 0 や未設定なら「条件なし」）
function getConditionText(coupon) {
  return coupon.minSpend > 0
    ? `${coupon.minSpend.toLocaleString()}円以上で利用可`
    : '利用条件なし';
}

// 有効期限の文章
function getExpiryText(coupon, status) {
  if (coupon.kind !== 'tour') return 'なし';
  if (status === 'locked') return `${TOUR_ORIGIN}で支払った日の23:59まで`;
  if (status === 'expired') return '期限切れ';
  if (status === 'used') return '使用済み';
  return `本日${formatTime(tour.expiresAt)}まで`;
}

// 「300円引き」の大きい数字つき表示
function createDiscount(className, coupon) {
  const node = el('p', className);
  node.append(el('span', '', coupon.discount.toLocaleString()), '円引き');
  return node;
}

// ════════════════════════════
//  クーポンカードを1枚作る
//  isRow が true なら一覧ページ用の横長カード
// ════════════════════════════
function createCouponCard(coupon, isRow) {
  const status = getStatus(coupon);

  const card = el('div', isRow ? 'coupon-card coupon-row' : 'coupon-card');
  card.dataset.category = coupon.category;
  card.dataset.status = status;
  if (coupon.kind === 'tour') card.classList.add('is-tour');
  if (status === 'locked' || status === 'expired' || status === 'used') card.classList.add('is-inactive');

  const name = el('p', 'coupon-name', coupon.name);
  const discount = createDiscount('coupon-discount', coupon);
  const condition = el('p', 'coupon-condition', getConditionText(coupon));

  const btn = el('button', 'coupon-btn', BUTTON_TEXT[status]);
  if (status === 'available') {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // カードの「詳細を開く」が一緒に動かないようにする
      acquireCoupon(coupon);
    });
  } else {
    btn.disabled = true;
    btn.classList.add('coupon-btn-clicked');
  }

  // 回遊クーポンだけに付ける「回遊」バッジと期限の表示
  let badge = null;
  let note = null;
  if (coupon.kind === 'tour') {
    badge = el('span', 'coupon-badge', '回遊');
    if (status === 'locked') {
      note = el('p', 'coupon-note', `${TOUR_ORIGIN}で支払うと解放`);
    } else if (status === 'expired') {
      note = el('p', 'coupon-note', '有効期限が切れました');
    } else if (status === 'used') {
      note = el('p', 'coupon-note', '使用済みです');
    } else {
      note = el('p', 'coupon-note is-active', `本日${formatTime(tour.expiresAt)}まで`);
    }
  }

  if (isRow) {
    // 一覧：割引額 → （ラベル・店名・期限） → ボタン
    const info = el('div', 'coupon-info');
    const labels = el('div', 'coupon-labels');
    if (badge) labels.append(badge);
    labels.append(el('span', 'coupon-category', getCategoryLabel(coupon.category)));
    info.append(labels, name, condition);
    if (note) info.append(note);
    card.append(discount, info, btn);
  } else {
    // ホーム：（バッジ）店名 → 割引額 → 期限 → ボタン
    if (badge) card.append(badge);
    card.append(name, discount, condition);
    if (note) card.append(note);
    card.append(btn);
  }

  // カードを押すと詳細を開く
  card.addEventListener('click', () => openDetail(coupon));
  return card;
}

// ════════════════════════════
//  クーポン詳細
// ════════════════════════════
function openDetail(coupon) {
  openSheet(() => fillDetail(coupon), true); // 獲得したら描き直す
}

function fillDetail(coupon) {
  const status = getStatus(coupon);
  const detail = COUPON_DETAILS[coupon.id] || {};
  resetSheet('クーポン詳細');
  sheet.classList.toggle('is-tour', coupon.kind === 'tour');

  // ラベル（回遊・カテゴリ・エリア）
  const labels = el('div', 'coupon-labels');
  if (coupon.kind === 'tour') labels.append(el('span', 'coupon-badge', '回遊'));
  labels.append(el('span', 'coupon-category', getCategoryLabel(coupon.category)));
  if (detail.area) labels.append(el('span', 'coupon-category', AREAS[detail.area]));

  const title = el('h2', 'sheet-title', coupon.name);
  const discount = createDiscount('sheet-discount', coupon);
  const desc = el('p', 'sheet-desc', detail.description || '');

  // 条件などの一覧
  const info = el('dl', 'sheet-info');
  const expiry = el('dd', '', getExpiryText(coupon, status));
  // 回遊クーポン配信中なら残り時間も出す
  if (coupon.kind === 'tour' && isTourActive()) {
    expiry.append('（残り ', el('span', 'tour-countdown', formatRemaining(tour.expiresAt - Date.now())), '）');
  }
  info.append(
    el('dt', '', '割引'), el('dd', '', `${coupon.discount.toLocaleString()}円引き`),
    el('dt', '', '利用条件'), el('dd', '', getConditionText(coupon)),
    el('dt', '', '有効期限'), expiry,
    el('dt', '', '対象エリア'), el('dd', '', AREAS[detail.area] || '—')
  );

  // 使い方
  const howto = el('div', 'sheet-howto');
  howto.append(el('p', 'sheet-howto-title', '使い方'));
  const steps = el('ol', '');
  if (coupon.kind === 'tour') {
    steps.append(el('li', '', `${TOUR_ORIGIN}で桑都ペイを使うとクーポンが解放されます`));
  }
  steps.append(
    el('li', '', '「獲得する」を押してクーポンを受け取ります'),
    el('li', '', 'お店で桑都ペイで支払うと、自動で割引されます'),
    el('li', '', 'または「このクーポンを使う」を押して、スタッフに画面を見せます')
  );
  howto.append(steps);

  // 獲得ボタン（獲得済みなら「このクーポンを使う」）
  const btn = el('button', 'sheet-btn', status === 'locked'
    ? `${TOUR_ORIGIN}で支払うと解放`
    : status === 'acquired' ? 'このクーポンを使う' : BUTTON_TEXT[status]);
  if (status === 'available') {
    btn.addEventListener('click', () => acquireCoupon(coupon));
  } else if (status === 'acquired') {
    btn.addEventListener('click', () => openCouponUse(coupon));
  } else {
    btn.disabled = true;
  }

  sheet.append(...sheetTop(), labels, title, discount, desc, info, howto, btn);

  // 予約できるお店なら「このお店を予約する」を出す
  const shop = SHOPS.find((s) => s.couponId === coupon.id);
  if (shop) {
    const link = el('a', 'sheet-link', 'このお店を予約する');
    link.href = `reserve.html?type=${shop.type}&shop=${shop.id}`;
    sheet.append(link);
  }
}

// ════════════════════════════
//  スライドして決める部品（まちがえて押さないように、ボタンではなくスライドにする）
//  label      … スライドの中に出す文字（\n のところで改行する）
//  onComplete … 右はしまでスライドしたときに呼ぶ
// ════════════════════════════
function createSlider(label, onComplete) {
  const track = el('div', 'slide-track');
  const fill = el('div', 'slide-fill');
  const text = el('span', 'slide-text', label);
  const knob = el('button', 'slide-knob');
  knob.type = 'button';
  knob.setAttribute('aria-label', `${label.replace('\n', '')}（右にスライド）`);
  // 矢印のアイコン（固定の SVG だけなので innerHTML を使っている）
  knob.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 6 15 12 9 18"/></svg>';
  track.append(fill, text, knob);

  const GAP = 4;    // つまみとふちのすき間（CSS の top / left と同じ）
  let x = 0;        // つまみの位置
  let startX = 0;   // ドラッグを始めたときの、指の位置とつまみの位置の差
  let dragging = false;
  let done = false;

  // つまみが動ける一番右の位置
  function getMax() {
    return track.clientWidth - knob.offsetWidth - GAP * 2;
  }

  function moveTo(value) {
    const max = getMax();
    x = Math.max(0, Math.min(value, max));
    knob.style.transform = `translateX(${x}px)`;
    fill.style.width = `${x + knob.offsetWidth + GAP}px`;
    text.style.opacity = String(1 - (x / max) * 0.9); // 右へ行くほど文字を薄く
  }

  function finish() {
    if (x >= getMax() * 0.9) {
      // 右はしまで来たら決定
      done = true;
      moveTo(getMax());
      track.classList.add('is-done');
      if (navigator.vibrate) navigator.vibrate(60);
      setTimeout(onComplete, 250); // 右はしに着いたのが見えてから次へ
    } else {
      moveTo(0); // 途中で離したら左に戻る
    }
  }

  knob.addEventListener('pointerdown', (e) => {
    if (done) return;
    dragging = true;
    startX = e.clientX - x;
    knob.setPointerCapture(e.pointerId);
    track.classList.add('is-dragging');
  });
  knob.addEventListener('pointermove', (e) => {
    if (dragging) moveTo(e.clientX - startX);
  });
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    track.classList.remove('is-dragging');
    finish();
  }
  knob.addEventListener('pointerup', endDrag);
  knob.addEventListener('pointercancel', endDrag);

  // キーボードでも操作できるようにする（→キーで少しずつ、End で右はし）
  knob.addEventListener('keydown', (e) => {
    if (done) return;
    if (e.key === 'ArrowRight') moveTo(x + getMax() / 5);
    else if (e.key === 'ArrowLeft') moveTo(x - getMax() / 5);
    else if (e.key === 'End') moveTo(getMax());
    else return;
    e.preventDefault();
    if (x >= getMax()) finish();
  });

  return track;
}

// ════════════════════════════
//  クーポン使用画面
//  お客様はこの画面をスタッフに見せ、使用のスライドはスタッフが動かす
//  1. 使用画面（スライドで使用） → 2. 使用済み
// ════════════════════════════
function openCouponUse(coupon) {
  // クーポンの中身（2つの画面で共通）
  function createTicket() {
    const ticket = el('div', coupon.kind === 'tour' ? 'use-ticket is-tour' : 'use-ticket');
    const labels = el('div', 'coupon-labels');
    if (coupon.kind === 'tour') labels.append(el('span', 'coupon-badge', '回遊'));
    labels.append(el('span', 'coupon-category', getCategoryLabel(coupon.category)));
    ticket.append(
      labels,
      el('p', 'use-ticket-shop', coupon.name),
      createDiscount('use-ticket-discount', coupon),
      el('p', 'use-ticket-condition', getConditionText(coupon))
    );
    if (coupon.kind === 'tour' && isTourActive()) {
      ticket.append(el('p', 'coupon-note is-active', `本日${formatTime(tour.expiresAt)}まで`));
    }
    return ticket;
  }

  // 1. 使用画面
  function fillUse() {
    resetSheet('クーポン使用画面');
    sheet.classList.toggle('is-tour', coupon.kind === 'tour');

    const notice = el('div', 'use-staff-notice');
    notice.append(
      el('p', 'use-staff-title', 'この画面をスタッフに見せてください'),
      el('p', 'use-staff-text', '下のスライドはスタッフが操作します。お客様が動かすと、クーポンが使えなくなります。')
    );

    const slider = createSlider('スタッフが操作しますので\n触れないでください。', () => {
      if (useCoupon(coupon)) fillDone(Date.now());
    });
    const staffNote = el('p', 'use-slide-note', 'スタッフの方へ：右にスライドすると使用済みになります。\n使用済みにすると取り消せません。');

    sheet.append(...sheetTop(), el('h2', 'sheet-title', 'クーポン使用画面'), createTicket(), notice, slider, staffNote);
  }

  // 2. 使用済み
  function fillDone(usedAt) {
    resetSheet('クーポン使用済み');
    const ticket = createTicket();
    ticket.classList.add('is-used');
    ticket.append(el('span', 'use-stamp', '使用済み'));

    const info = el('dl', 'sheet-info');
    info.append(el('dt', '', '使用日時'), el('dd', '', formatDateTime(usedAt)));

    const closeBtn = el('button', 'sheet-btn', '閉じる');
    closeBtn.addEventListener('click', closeSheet);
    sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
      el('h2', 'sheet-title reserve-done-title', 'クーポンを使用しました'), ticket, info,
      el('p', 'sheet-desc', 'スタッフがこの画面を確認したら、閉じてください。'), closeBtn);
  }

  openSheet(fillUse, false);
}

// ════════════════════════════
//  「ここは回遊クーポンの起点です」の枠（高尾山エリアのお店で使う）
// ════════════════════════════
function createOriginBox() {
  const box = el('div', 'tour-box is-origin');
  box.append(
    el('p', 'tour-box-title', 'ここは回遊クーポンの起点です'),
    el('p', 'tour-box-text', `このお店で桑都ペイを使うと、${TOUR_DESTINATION}で使える回遊クーポンがその日限りで届きます。`)
  );
  return box;
}

// ════════════════════════════
//  回遊クーポンの案内バナー（ホーム・クーポン一覧の .tour-banner）
// ════════════════════════════
function renderBanners() {
  document.querySelectorAll('.tour-banner').forEach((banner) => {
    banner.replaceChildren();
    banner.classList.toggle('is-active', isTourActive());

    if (isTourActive()) {
      // 配信中：残り時間を出す
      banner.append(
        el('p', 'tour-title', `${TOUR_DESTINATION}の回遊クーポン配信中`),
        el('p', 'tour-text', `${TOUR_ORIGIN}でのご利用ありがとうございます。本日${formatTime(tour.expiresAt)}まで使えます。`)
      );
      const remain = el('p', 'tour-remaining');
      remain.append('残り ', el('strong', 'tour-countdown', formatRemaining(tour.expiresAt - Date.now())));
      banner.append(remain);
      return;
    }

    // 未解放 or 期限切れ：高尾山での利用をうながす
    banner.append(
      el('p', 'tour-title', `${TOUR_ORIGIN}で使うと、${TOUR_DESTINATION}のクーポンが届く`),
      el('p', 'tour-text', isTourExpired()
        ? '前回の回遊クーポンは期限が切れました。もう一度高尾山で使うと再配信されます。'
        : `${TOUR_ORIGIN}で桑都ペイを使うと、その日限りの「回遊」クーポンが解放されます。`)
    );
    // 高尾山エリアのお店だけを出した支払い画面を開く
    const demoBtn = el('button', 'tour-demo-btn', `${TOUR_ORIGIN}で支払う`);
    demoBtn.addEventListener('click', () => openPay({ area: 'takao' }));
    banner.append(demoBtn);
  });
}

// 残り時間だけを書きかえる（1分ごと）
function updateCountdown() {
  if (isTourExpired() && document.querySelector('.tour-banner.is-active')) {
    render(); // ちょうど期限が切れたら全体を描き直す
    return;
  }
  if (!isTourActive()) return;
  document.querySelectorAll('.tour-countdown').forEach((node) => {
    node.textContent = formatRemaining(tour.expiresAt - Date.now());
  });
}

onRender(renderBanners);
onEveryMinute(updateCountdown);
