// ════════════════════════════════════════
//  page-account.js … アカウント（account.html）だけで使う処理
//  ・会員情報（会員番号・残高・ポイント）
//  ・これからの予約とキャンセル（カードとキャンセルの画面は ui-reservation.js）
//  ・予約履歴の画面への入口
//  ・見やすさ（文字を大きくする）
//  ・公共料金（引き落としのページへの入口）
//  ・履歴・特典（取引履歴・ポイント（points.html）・お知らせ・クーポン・回遊クーポン）
//  ・デモをはじめからにする（発表・テスト用）
// ════════════════════════════════════════
'use strict';
{
  const card = document.querySelector('.account-card');
  const reservationBox = document.querySelector('.account-reservations');
  const menu = document.querySelector('.account-menu');
  const billsBox = document.querySelector('.account-bills');
  const settingsBox = document.querySelector('.account-settings');
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
    who.append(el('p', 'account-name', USER_NAME), el('p', 'account-id', `会員番号 ${user.id.replace(/(\d{4})(?=\d)/g, '$1 ')}`));
    head.append(avatar, who);

    const nums = el('div', 'account-nums');
    const money = el('div', 'account-num');
    money.append(el('span', 'account-num-label', '使用可能金額'), el('strong', '', `${wallet.balance.toLocaleString()}円`));
    // 保有ポイント：押すとポイントの詳細（points.html）へ
    const points = el('a', 'account-num account-num-link');
    points.href = 'points.html?from=account';
    points.setAttribute('aria-label', `保有ポイント ${pointData.balance.toLocaleString()}pt。押すとポイントの詳細を見る`);
    const pointsHead = el('span', 'account-num-label account-num-head');
    pointsHead.append('保有ポイント', el('span', 'account-num-arrow', '›'));
    points.append(pointsHead, el('strong', '', `${pointData.balance.toLocaleString()}pt`),
      el('span', 'account-num-sub', `うち${POINT_NAME} ${pointData.limited.toLocaleString()}pt`));
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

  function renderMenu() {
    menu.replaceChildren(
      createMenuRow('取引履歴', '支払い・公共料金・チャージ・特典', () => openNotices('取引履歴', MONEY_NOTICE_TYPES)),
      createMenuRow('ポイント', `保有 ${pointData.balance.toLocaleString()}pt（うち${POINT_NAME} ${pointData.limited.toLocaleString()}pt）`, 'points.html?from=account'),
      createMenuRow('お知らせ', `未読 ${notices.filter((n) => !n.read).length}件`, () => openNotices()),
      createMenuRow('クーポン', `使えるクーポン ${getUsableCoupons().length}枚`, 'coupons.html'),
      createMenuRow('回遊クーポン', getUnlockedToday().length > 0 ? `今日解放 ${getUnlockedToday().length}枚` : '高尾山で使うとクーポンが開く', 'stamp.html')
    );
  }

  // ════════════════════════════
  //  見やすさ：文字を大きくする（スライド24）
  //  オンにすると、すべての画面の文字とボタンが大きくなる。設定は次に開いたときも残る
  // ════════════════════════════
  function renderSettings() {
    const row = el('label', 'near-toggle account-setting');
    const text = el('span', 'account-setting-text');
    text.append(el('span', 'near-toggle-text', '文字を大きくする'),
      el('span', 'account-setting-sub', 'すべての画面の文字とボタンを大きく表示します'));
    const check = el('input');
    check.type = 'checkbox';
    check.setAttribute('role', 'switch');
    check.checked = Boolean(settings.largeText);
    check.addEventListener('change', () => setLargeText(check.checked));
    const knob = el('span', 'near-toggle-switch');
    knob.setAttribute('aria-hidden', 'true');
    row.append(text, check, knob);
    settingsBox.replaceChildren(row);
  }

  // ════════════════════════════
  //  公共料金（履歴・特典とは分けて、別のまとまりにする）
  // ════════════════════════════
  function renderBills() {
    billsBox.replaceChildren(
      createMenuRow('公共料金の引き落とし', getUpcomingBills().length > 0
        ? `引き落とし予定 ${getUpcomingBills().length}件・${getUpcomingTotal().toLocaleString()}円`
        : '水道・電気・ガス・市の税金を残高から自動で', 'bills.html')
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
          el('p', 'sheet-desc', '残高・ポイント・クーポン・予約・回遊クーポン・スタンプ・お知らせを、最初の状態に戻します。'), ok, back);
      }, false);
    });
    demoBox.append(btn, el('p', 'pay-note', '発表・テスト用です'));
  }

  onRender(renderCard);
  onRender(renderReservations);
  onRender(renderBills);
  renderSettings();
  onRender(renderMenu);
  renderDemo();
  startApp();
}
