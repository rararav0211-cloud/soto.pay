// ════════════════════════════════════════
//  ui-common.js … どのページにもある部品
//  ・ヘッダーのベルマーク（お知らせの一覧）
//  ・チャージの画面（ホームのチャージボタン・支払いで残高が足りないとき）
//  ※ 支払いの画面は ui-pay.js
// ════════════════════════════════════════
'use strict';

// ════════════════════════════
//  お知らせの一覧
//  ベルマーク：すべての種類 / 取引履歴：支払いとチャージだけ
//  title : パネルの見出し / types : 表示する種類
// ════════════════════════════
function openNotices(title = 'お知らせ', types = Object.keys(NOTICE_TYPES)) {
  let filter = 'all';

  function createNoticeItem(n) {
    const item = el('div', n.read ? `notice-item is-${n.type}` : `notice-item is-${n.type} is-unread`);
    const icon = el('div', 'notice-icon');
    // アイコンは state.js で決めた固定の SVG だけなので innerHTML を使っている
    icon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${NOTICE_TYPES[n.type].icon}</svg>`;
    const body = el('div', 'notice-body');
    const top = el('div', 'notice-top');
    top.append(el('span', 'notice-type', NOTICE_TYPES[n.type].label), el('span', 'notice-time', formatDateTime(n.at)));
    body.append(top, el('p', 'notice-title', n.title), el('p', 'notice-text', n.body));
    item.append(icon, body);
    return item;
  }

  function fill() {
    resetSheet(title);

    // 種類で絞り込むボタン（表示する種類だけ）
    const chips = el('div', 'notice-chips');
    [['all', 'すべて'], ...types.map((id) => [id, NOTICE_TYPES[id].label])].forEach(([id, label]) => {
      const chip = el('button', id === filter ? 'category-chip active' : 'category-chip', label);
      chip.addEventListener('click', () => {
        filter = id;
        fill();
      });
      chips.append(chip);
    });

    const list = el('div', 'notice-list');
    const shown = notices.filter((n) => types.includes(n.type) && (filter === 'all' || n.type === filter));
    if (shown.length === 0) {
      list.append(el('p', 'notice-empty', `${title}はまだありません`));
    }
    shown.forEach((n) => list.append(createNoticeItem(n)));

    sheet.append(...sheetTop(), el('h2', 'sheet-title', title), chips, list);
  }

  openSheet(fill, false);

  // 開いたら、表示した種類のお知らせを既読にする（一覧の「未読」の色は開いている間は残す）
  markNoticesRead(types);
}

// ベルマーク：支払い・ポイント・チャージ・予約のすべて
document.querySelectorAll('.notification-btn').forEach((btn) => {
  btn.addEventListener('click', () => openNotices());
});

// ════════════════════════════
//  チャージ
//  onDone … 渡されたら、完了画面のボタンが「支払いに戻る」になり、押すと onDone を呼ぶ
//  needed … 渡されたら、その金額以上になる一番小さい額を最初から選んでおく
// ════════════════════════════
const CHARGE_AMOUNTS = [1000, 3000, 5000, 10000];

function openCharge(onDone, needed = 0) {
  let selected = CHARGE_AMOUNTS.find((amount) => amount >= needed) || CHARGE_AMOUNTS[CHARGE_AMOUNTS.length - 1];

  function fillForm() {
    resetSheet('チャージ');

    const now = el('p', 'sheet-desc');
    now.append('現在の残高：', el('strong', '', `${wallet.balance.toLocaleString()}円`));

    const grid = el('div', 'charge-grid');
    CHARGE_AMOUNTS.forEach((amount) => {
      const btn = el('button', amount === selected ? 'charge-option active' : 'charge-option', `${amount.toLocaleString()}円`);
      btn.addEventListener('click', () => {
        selected = amount;
        fillForm();
      });
      grid.append(btn);
    });

    const after = el('p', 'charge-after', `チャージ後の残高：${(wallet.balance + selected).toLocaleString()}円`);

    const submit = el('button', 'sheet-btn', `${selected.toLocaleString()}円をチャージする`);
    submit.addEventListener('click', () => {
      chargeWallet(selected);
      fillDone();
    });

    sheet.append(...sheetTop(), el('h2', 'sheet-title', 'チャージ'), now, grid, after, submit);
  }

  function fillDone() {
    resetSheet('チャージ完了');
    const info = el('dl', 'sheet-info');
    info.append(el('dt', '', 'チャージ額'), el('dd', '', `${selected.toLocaleString()}円`),
      el('dt', '', '残高'), el('dd', '', `${wallet.balance.toLocaleString()}円`));
    const nextBtn = el('button', 'sheet-btn', onDone ? '支払いに戻る' : '閉じる');
    nextBtn.addEventListener('click', onDone || closeSheet);
    sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
      el('h2', 'sheet-title reserve-done-title', 'チャージが完了しました'), info, nextBtn);
  }

  openSheet(fillForm, false);
}
