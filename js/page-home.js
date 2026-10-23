// ════════════════════════════════════════
//  page-home.js … ホーム（index.html）だけで使う処理
//  ・おすすめクーポン
//  ・取引履歴ボタン
//  ・チャージ
// ════════════════════════════════════════
'use strict';
{
  // ════════════════════════════
  //  おすすめクーポン（横にスクロールするカード）
  // ════════════════════════════
  const carousel = document.querySelector('.coupon-carousel');

  function renderCarousel() {
    carousel.replaceChildren();
    COUPONS
      .filter((coupon) => coupon.recommended)
      .slice(0, HOME_COUPON_LIMIT)
      .forEach((coupon) => carousel.append(createCouponCard(coupon, false)));
  }
  onRender(renderCarousel);

  // ════════════════════════════
  //  取引履歴：支払いとチャージだけのお知らせ一覧
  // ════════════════════════════
  document.querySelectorAll('.history-btn').forEach((btn) => {
    btn.addEventListener('click', () => openNotices('取引履歴', ['payment', 'charge']));
  });

  // ════════════════════════════
  //  チャージ
  // ════════════════════════════
  const CHARGE_AMOUNTS = [1000, 3000, 5000, 10000];

  function openCharge() {
    let selected = CHARGE_AMOUNTS[0];

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
      const closeBtn = el('button', 'sheet-btn', '閉じる');
      closeBtn.addEventListener('click', closeSheet);
      const info = el('dl', 'sheet-info');
      info.append(el('dt', '', 'チャージ額'), el('dd', '', `${selected.toLocaleString()}円`),
        el('dt', '', '残高'), el('dd', '', `${wallet.balance.toLocaleString()}円`));
      sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
        el('h2', 'sheet-title reserve-done-title', 'チャージが完了しました'), info, closeBtn);
    }

    openSheet(fillForm, false);
  }

  document.querySelectorAll('.charge-btn').forEach((btn) => btn.addEventListener('click', openCharge));

  startApp();
}
