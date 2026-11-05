// ════════════════════════════════════════
//  page-points.js … ポイント（points.html）だけで使う処理
//  ホームの「保有ポイント」から開く
//  ・総ポイント（保有ポイント）と、うち宿泊・体験ポイント／普通のポイント
//  ・獲得履歴（もらったポイント）と、使った履歴
// ════════════════════════════════════════
'use strict';
{
  const page = document.querySelector('.points-page');

  // 種類の名前（履歴のラベル）
  function getKindLabel(kind) {
    return kind === 'normal' ? NORMAL_POINT_NAME : POINT_NAME;
  }

  // 履歴の1行
  function createHistoryRow(h) {
    const row = el('div', 'account-point-row');
    const text = el('div', '');
    const top = el('div', 'points-row-top');
    top.append(el('span', h.kind === 'normal' ? 'points-kind is-normal' : 'points-kind', getKindLabel(h.kind)),
      el('span', 'notice-time', formatDateTime(h.at)));
    text.append(top, el('p', 'notice-title', h.label));
    row.append(text, el('span', h.amount < 0 ? 'account-point-amount is-minus' : 'account-point-amount',
      `${h.amount > 0 ? '+' : ''}${h.amount.toLocaleString()}pt`));
    return row;
  }

  function renderPoints() {
    page.replaceChildren();
    const normal = getNormalPoints();

    // ── 総ポイント ──
    const card = el('section', 'account-card points-card');
    const total = el('p', 'points-total');
    total.append(el('span', 'points-total-label', '保有ポイント（総ポイント）'), el('strong', '', pointData.balance.toLocaleString()), 'pt');
    const nums = el('div', 'account-nums');
    const limited = el('div', 'account-num');
    limited.append(el('span', 'account-num-label', `うち${POINT_NAME}（限定）`), el('strong', '', `${pointData.limited.toLocaleString()}pt`),
      el('span', 'account-num-sub', '宿泊・体験のお店でだけ使える'));
    const normalBox = el('div', 'account-num');
    normalBox.append(el('span', 'account-num-label', NORMAL_POINT_NAME), el('strong', '', `${normal.toLocaleString()}pt`),
      el('span', 'account-num-sub', 'どのお店でも使える'));
    nums.append(limited, normalBox);
    card.append(total, nums, el('p', 'points-card-note', '1pt＝1円として、桑都ペイでの支払いに使えます。'));

    // ── 獲得履歴 ──
    const earned = [...pointData.history].filter((h) => h.amount > 0).reverse();
    const earnSection = el('section', 'stamp-section');
    earnSection.append(el('h2', 'stamp-section-title', 'ポイントの獲得履歴'));
    const earnList = el('div', 'notice-list');
    if (earned.length === 0) earnList.append(el('p', 'notice-empty', 'まだポイントをもらっていません'));
    earned.forEach((h) => earnList.append(createHistoryRow(h)));
    earnSection.append(earnList);

    page.append(card, earnSection);

    // ── 使った履歴 ──
    const used = [...pointData.history].filter((h) => h.amount < 0).reverse();
    if (used.length > 0) {
      const usedSection = el('section', 'stamp-section');
      const details = el('details', 'points-used');
      details.append(el('summary', 'stamp-section-title', `使った履歴（${used.length}件）`));
      const usedList = el('div', 'notice-list');
      used.forEach((h) => usedList.append(createHistoryRow(h)));
      details.append(usedList);
      usedSection.append(details);
      page.append(usedSection);
    }
  }

  onRender(renderPoints);
  startApp();
}
