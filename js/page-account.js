// ════════════════════════════════════════
//  page-account.js … アカウント（account.html）だけで使う処理
//  ・会員情報（会員番号・残高・ポイント）
//  ・これからの予約とキャンセル（カードとキャンセルの画面は ui-reservation.js）
//  ・予約履歴の画面への入口
//  ・履歴・特典（取引履歴・ポイント履歴・お知らせ・クーポン・スタンプラリー）
//  ・デモをはじめからにする（発表・テスト用）
// ════════════════════════════════════════
'use strict';
{
  const card = document.querySelector('.account-card');
  const reservationBox = document.querySelector('.account-reservations');
  const menu = document.querySelector('.account-menu');
  const demoBox = document.querySelector('.account-demo');

  // ════════════════════════════
  //  会員情報
  // ════════════════════════════
  function renderCard() {
    card.replaceChildren();

    const head = el('div', 'account-head');
    const avatar = el('div', 'account-avatar');
    // 人のアイコン（固定の SVG だけなので innerHTML を使っている）
    avatar.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    const who = el('div', '');
    who.append(el('p', 'account-name', '桑都ペイ会員'), el('p', 'account-id', `会員番号 ${user.id.replace(/(\d{4})(?=\d)/g, '$1 ')}`));
    head.append(avatar, who);

    const nums = el('div', 'account-nums');
    const money = el('div', 'account-num');
    money.append(el('span', 'account-num-label', '使用可能金額'), el('strong', '', `${wallet.balance.toLocaleString()}円`));
    const points = el('div', 'account-num');
    points.append(el('span', 'account-num-label', '保有ポイント'), el('strong', '', `${pointData.balance.toLocaleString()}pt`));
    nums.append(money, points);

    const actions = el('div', 'card-actions');
    const payLink = el('a', 'action-btn primary', '支払う');
    payLink.href = 'pay.html';
    const chargeBtn = el('button', 'action-btn secondary', 'チャージ');
    chargeBtn.addEventListener('click', () => openCharge());
    actions.append(payLink, chargeBtn);

    card.append(head, nums, actions);
  }

  // ════════════════════════════
  //  予約
  // ════════════════════════════
  function renderReservations() {
    reservationBox.replaceChildren();
    // これからの予約を日にちの近い順に
    const upcoming = reservations.filter(isUpcomingReservation)
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));

    if (upcoming.length === 0) {
      reservationBox.append(el('p', 'notice-empty', 'これからの予約はありません'));
    }
    upcoming.forEach((r) => reservationBox.append(createReservationCard(r)));

    const link = el('a', 'sheet-link', 'お店を予約する');
    link.href = 'reserve.html';
    // 来店日を過ぎた予約・キャンセルした予約は、予約履歴の画面で見る
    reservationBox.append(link, createMenuRow('予約履歴', '', 'reservation-history.html'));
  }

  // ════════════════════════════
  //  履歴・特典
  // ════════════════════════════
  // メニューの1行（押すと action を呼ぶ。href を渡すとリンクになる）
  function createMenuRow(label, sub, action) {
    const row = el(typeof action === 'string' ? 'a' : 'button', 'account-row');
    if (typeof action === 'string') row.href = action;
    else row.addEventListener('click', action);
    const text = el('div', 'account-row-text');
    text.append(el('span', 'account-row-label', label));
    if (sub) text.append(el('span', 'account-row-sub', sub));
    row.append(text, el('span', 'pay-coupon-arrow', '›'));
    return row;
  }

  // ポイント履歴
  function openPointHistory() {
    function fill() {
      resetSheet('ポイント履歴');
      const total = el('p', 'point-box-amount account-point-total');
      total.append('保有ポイント ', el('strong', '', `${pointData.balance.toLocaleString()}pt`));
      const list = el('div', 'notice-list');
      if (pointData.history.length === 0) list.append(el('p', 'notice-empty', 'ポイントの履歴はまだありません'));
      [...pointData.history].reverse().forEach((h) => {
        const row = el('div', 'account-point-row');
        const text = el('div', '');
        text.append(el('p', 'notice-title', h.label), el('p', 'notice-time', formatDateTime(h.at)));
        row.append(text, el('span', h.amount < 0 ? 'account-point-amount is-minus' : 'account-point-amount',
          `${h.amount > 0 ? '+' : ''}${h.amount.toLocaleString()}pt`));
        list.append(row);
      });
      sheet.append(...sheetTop(), el('h2', 'sheet-title', 'ポイント履歴'), total, list);
    }
    openSheet(fill, false);
  }

  function renderMenu() {
    menu.replaceChildren(
      createMenuRow('取引履歴', '支払い・チャージ・特典', () => openNotices('取引履歴', MONEY_NOTICE_TYPES)),
      createMenuRow('ポイント履歴', `保有 ${pointData.balance.toLocaleString()}pt`, openPointHistory),
      createMenuRow('お知らせ', `未読 ${notices.filter((n) => !n.read).length}件`, () => openNotices()),
      createMenuRow('クーポン', `使えるクーポン ${getUsableCoupons().length}枚`, 'coupons.html'),
      createMenuRow('スタンプラリー', `${getStampCount()} / ${getStampSpots().length} 個`, 'stamp.html')
    );
  }

  // ════════════════════════════
  //  デモをはじめからにする（demo.js があるときだけ出す）
  // ════════════════════════════
  function renderDemo() {
    demoBox.replaceChildren();
    if (!window.sotoPayDemo) return;
    const btn = el('button', 'tour-box-link account-reset', 'デモをはじめからにする');
    btn.addEventListener('click', () => {
      openSheet(() => {
        resetSheet('デモのリセット');
        const ok = el('button', 'sheet-btn account-cancel-btn', 'はじめからにする');
        ok.addEventListener('click', () => {
          window.sotoPayDemo.reset();
          location.reload(); // 開き直すと、デモ用の履歴がもう一度入る
        });
        const back = el('button', 'sheet-link account-back', 'もどる');
        back.addEventListener('click', closeSheet);
        sheet.append(...sheetTop(), el('h2', 'sheet-title', 'デモをはじめからにしますか？'),
          el('p', 'sheet-desc', '残高・ポイント・クーポン・予約・スタンプ・お知らせを、最初の状態に戻します。'), ok, back);
      }, false);
    });
    demoBox.append(btn, el('p', 'pay-note', '発表・テスト用です'));
  }

  onRender(renderCard);
  onRender(renderReservations);
  onRender(renderMenu);
  renderDemo();
  startApp();
}
