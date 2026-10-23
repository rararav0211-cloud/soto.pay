// ════════════════════════════════════════
//  page-shop-qr.js … お店のQRコード一覧（shop-qr.html）だけで使う処理
//  発表・テスト用。別のスマホでこのQRを読み取ると、そのお店への支払い画面が開く
//  （本番では、お店のレジや入口にこのQRコードを置く想定）
// ════════════════════════════════════════
'use strict';
{
  const list = document.querySelector('.shop-qr-list');

  Object.entries(AREAS).forEach(([areaId, areaLabel]) => {
    const inArea = buildMerchants().filter((m) => m.area === areaId);
    if (inArea.length === 0) return;
    const head = el('h2', 'group-head');
    head.append(el('span', '', areaLabel), el('span', 'group-count', `${inArea.length}件`));
    list.append(head);

    inArea.forEach((m) => {
      const card = el('div', 'shop-qr-card');
      const qr = el('div', 'shop-qr-code');
      renderQr(qr, getShopQrText(m));
      const info = el('div', 'shop-qr-info');
      info.append(el('p', 'shop-name', m.name), el('p', 'shop-access', m.genre));
      card.append(qr, info);
      list.append(card);
    });
  });

  startApp();
}
