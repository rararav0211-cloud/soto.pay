// ════════════════════════════════════════
//  ui-common.js … どのページにもある部品
//  ・ヘッダーのベルマーク（お知らせの一覧）
//  ※ これから作る「支払う」の画面もここに置く予定
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
