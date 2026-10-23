// ════════════════════════════════════════
//  page-home.js … ホーム（index.html）だけで使う処理
//  ・おすすめクーポン
//  ・取引履歴ボタン
//  ・チャージボタン（チャージの画面は ui-common.js）
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
  //  取引履歴：残高が動いたお知らせ（支払い・チャージ・特典）だけの一覧
  // ════════════════════════════
  document.querySelectorAll('.history-btn').forEach((btn) => {
    btn.addEventListener('click', () => openNotices('取引履歴', MONEY_NOTICE_TYPES));
  });

  document.querySelectorAll('.charge-btn').forEach((btn) => btn.addEventListener('click', () => openCharge()));

  startApp();
}
