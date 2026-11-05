// ════════════════════════════════════════
//  page-reservation-history.js … 予約履歴（reservation-history.html）だけで使う処理
//  来店日を過ぎた予約と、キャンセルした予約を新しい順に並べる
//  （アカウント画面の「予約履歴」から開く）
// ════════════════════════════════════════
'use strict';
{
  const list = document.querySelector('.reservation-history');

  function renderHistory() {
    list.replaceChildren();
    const past = reservations
      .filter((r) => !isUpcomingReservation(r))
      .sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));

    if (past.length === 0) {
      list.append(el('p', 'notice-empty', '予約履歴はありません'));
      return;
    }
    past.forEach((r) => list.append(createReservationCard(r)));
  }

  onRender(renderHistory);
  startApp();
}
