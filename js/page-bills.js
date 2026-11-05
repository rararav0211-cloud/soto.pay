// ════════════════════════════════════════
//  page-bills.js … 公共料金の引き落とし（bills.html）だけで使う処理
//  アカウントの「公共料金の引き落とし」から開く
//  中身の部品は js/ui-bill.js、引き落としそのものは state.js の processDueBills()
// ════════════════════════════════════════
'use strict';
{
  const box = document.querySelector('.bills-page');
  onRender(() => renderBills(box));
  startApp();
}
