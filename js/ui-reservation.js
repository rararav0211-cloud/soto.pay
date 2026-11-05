// ════════════════════════════════════════
//  ui-reservation.js … 予約の画面部品（アカウント・予約履歴で使う）
//  ・予約1件のカード
//  ・予約のキャンセル（確認 → 完了）
// ════════════════════════════════════════
'use strict';

// 予約したお店の種類（food / stay / experience）
function getReservationShopType(r) {
  const shop = SHOPS.find((s) => s.id === r.shopId);
  return shop ? shop.type : 'food';
}

// 予約1件のカード
function createReservationCard(r) {
  const upcoming = isUpcomingReservation(r);
  const item = el('div', upcoming ? 'account-reservation' : 'account-reservation is-past');

  const head = el('div', 'account-reservation-head');
  const info = el('div', 'account-reservation-info');
  const labels = el('div', 'coupon-labels');
  labels.append(el('span', 'coupon-category', RESERVE_TYPES[getReservationShopType(r)].title));
  if (r.canceledAt) labels.append(el('span', 'coupon-badge is-canceled', 'キャンセル済み'));
  else if (!upcoming) labels.append(el('span', 'coupon-badge is-reserve', '来店日を過ぎました'));
  info.append(labels, el('p', 'pay-shop-name', r.shopName), el('p', 'account-reservation-when', getReservationWhen(r)));
  head.append(createIcon(getReservationShopType(r)), info);

  const detail = el('p', 'account-reservation-detail', `${r.people}名・予約番号 ${r.id}${r.points ? `・${r.points.toLocaleString()}pt` : ''}`);
  item.append(head, detail);

  if (upcoming) {
    const cancel = el('button', 'tour-box-link account-cancel', '予約をキャンセルする');
    cancel.addEventListener('click', () => openReservationCancel(r));
    item.append(cancel);
  }
  return item;
}


// キャンセルの確認 → 完了
function openReservationCancel(r) {
  function fillConfirm() {
    resetSheet('予約のキャンセル');
    const info = el('dl', 'sheet-info');
    info.append(
      el('dt', '', 'お店'), el('dd', '', r.shopName),
      el('dt', '', r.nights ? 'チェックイン' : '日時'), el('dd', '', getReservationWhen(r)),
      el('dt', '', '人数'), el('dd', '', `${r.people}名`),
      el('dt', '', '予約番号'), el('dd', '', r.id)
    );
    sheet.append(...sheetTop(), el('h2', 'sheet-title', 'この予約をキャンセルしますか？'), info);

    const charge = getCancelCharge(r);
    if (charge.points > 0 || charge.yen > 0) {
      const warn = el('div', 'point-box is-warning');
      warn.append(el('p', 'point-box-text', `この予約でもらった ${r.points.toLocaleString()}pt は差し引かれます。`));
      if (charge.yen > 0) {
        warn.append(el('p', 'point-box-text',
          `保有ポイントが${charge.yen.toLocaleString()}pt足りないため、その分の${charge.yen.toLocaleString()}円を残高から差し引きます。`));
      }
      sheet.append(warn);
    }

    const ok = el('button', 'sheet-btn account-cancel-btn', 'キャンセルする');
    ok.addEventListener('click', () => {
      if (cancelReservation(r.id)) fillDone(charge);
    });
    if (!charge.enough) {
      // 残高も足りないときは、先にチャージしてもらう
      ok.disabled = true;
      const short = charge.yen - wallet.balance;
      const error = el('div', 'pay-error');
      const chargeBtn = el('button', 'tour-box-btn pay-charge-btn', 'チャージする');
      chargeBtn.type = 'button';
      chargeBtn.addEventListener('click', () => openCharge(() => openSheet(fillConfirm, false), short));
      error.append(el('p', 'form-error', `キャンセルするには残高が${short.toLocaleString()}円足りません`), chargeBtn);
      sheet.append(error);
    }
    const back = el('button', 'sheet-link account-back', 'もどる');
    back.addEventListener('click', closeSheet);
    sheet.append(ok, back);
  }

  function fillDone(charge) {
    resetSheet('キャンセル完了');
    const closeBtn = el('button', 'sheet-btn', '閉じる');
    closeBtn.addEventListener('click', closeSheet);
    const minusText = [
      r.points ? `${r.points.toLocaleString()}ptを差し引きました。` : '',
      charge.yen > 0 ? `（保有ポイントが足りない${charge.yen.toLocaleString()}pt分は、残高から${charge.yen.toLocaleString()}円を差し引きました）` : '',
    ].join('');
    sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
      el('h2', 'sheet-title reserve-done-title', '予約をキャンセルしました'),
      el('p', 'sheet-desc', `${r.shopName}（${getReservationWhen(r)}）の予約をキャンセルしました。${minusText}`),
      closeBtn);
  }

  openSheet(fillConfirm, false);
}
