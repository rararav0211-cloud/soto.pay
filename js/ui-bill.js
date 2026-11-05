// ════════════════════════════════════════
//  ui-bill.js … 公共料金・税金の支払い（支払う画面・アカウントから開く）
//  1. 払込票を読み取る（デモでは、見本の払込票を選ぶと読み取ったことにする）
//  2. 内容を確認する（請求元・内容・金額・支払期限・支払い後の残高）
//  3. 支払い完了（受付番号）
//  支払いの記録は state.js の payBill() が行う
//  ※ 公共料金・税金には、クーポンとポイントは使えない
// ════════════════════════════════════════
'use strict';

// 種類のアイコン（固定の SVG だけなので innerHTML を使っている）
function createBillIcon(bill) {
  const icon = el('div', `bill-icon is-${bill.type}`);
  icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${BILL_TYPES[bill.type].icon}</svg>`;
  return icon;
}

// 払込票1枚（一覧の1行）
function createBillRow(bill, onClick) {
  const paid = isBillPaid(bill);
  const row = el(onClick ? 'button' : 'div', paid ? 'bill-row is-paid' : 'bill-row');
  const info = el('div', 'bill-row-info');
  info.append(
    el('p', 'bill-row-issuer', `${BILL_TYPES[bill.type].label}・${bill.issuer}`),
    el('p', 'bill-row-title', bill.title),
    el('p', 'bill-row-due', paid
      ? `支払い済み（${formatDateTime(billData.paid[bill.id].at)}）`
      : `支払期限 ${formatDate(getBillDue(bill))}`)
  );
  row.append(createBillIcon(bill), info, el('p', 'bill-row-amount', `${bill.amount.toLocaleString()}円`));
  if (onClick) row.addEventListener('click', onClick);
  return row;
}

function openBills() {
  // ════════════════════════════
  //  1. 払込票を読み取る
  // ════════════════════════════
  function fillScan() {
    resetSheet('公共料金・税金を払う');
    const unpaid = DEMO_BILLS.filter((bill) => !isBillPaid(bill));
    const paid = DEMO_BILLS.filter(isBillPaid);

    // 使い方（はじめての人にもわかるように、手順を書いておく）
    const howto = el('div', 'sheet-howto');
    howto.append(el('p', 'sheet-howto-title', '払い方'));
    const steps = el('ol', '');
    steps.append(
      el('li', '', '水道・電気・ガスの料金や、市の税金の「払込票」（コンビニで払える用紙）を用意します'),
      el('li', '', '払込票のバーコードを読み取ります'),
      el('li', '', '内容と金額を確かめて「支払う」を押します')
    );
    howto.append(steps);

    // 見本の払込票（デモ）
    const list = el('div', 'bill-list');
    if (unpaid.length === 0) list.append(el('p', 'notice-empty', '見本の払込票はすべて支払い済みです'));
    unpaid.forEach((bill) => list.append(createBillRow(bill, () => fillScanning(bill))));

    sheet.append(...sheetTop(), el('h2', 'sheet-title', '公共料金・税金を払う'),
      el('p', 'sheet-desc', '払込票のバーコードを読み取ると、桑都ペイの残高から支払えます。'),
      howto,
      el('p', 'bill-section-title', 'バーコードを読み取る（デモ：見本の払込票を選んでください）'),
      list);

    if (paid.length > 0) {
      const done = el('details', 'bill-paid');
      done.append(el('summary', '', `支払い済み（${paid.length}件）`));
      const doneList = el('div', 'bill-list');
      paid.forEach((bill) => doneList.append(createBillRow(bill, null)));
      done.append(doneList);
      sheet.append(done);
    }
  }

  // 読み取っているところ（少しだけ見せてから確認へ）
  function fillScanning(bill) {
    resetSheet('払込票を読み取り中');
    const box = el('div', 'bill-scanning');
    box.append(el('div', 'bill-barcode'), el('p', 'bill-scanning-text', 'バーコードを読み取っています…'));
    sheet.append(...sheetTop(), el('h2', 'sheet-title', '払込票を読み取る'), box);
    setTimeout(() => {
      if (sheetOpen) fillConfirm(bill);
    }, 700);
  }

  // ════════════════════════════
  //  2. 内容を確認する
  // ════════════════════════════
  function fillConfirm(bill) {
    resetSheet('支払い内容の確認');
    sheet.scrollTop = 0;
    const enough = bill.amount <= wallet.balance;

    const head = el('div', 'pay-head');
    const headInfo = el('div', 'pay-shop-info');
    headInfo.append(el('p', 'pay-head-label', `請求元（${BILL_TYPES[bill.type].label}）`), el('p', 'pay-shop-name', bill.issuer));
    head.append(createBillIcon(bill), headInfo);

    const total = el('p', 'pay-done-amount');
    total.append(el('span', '', bill.amount.toLocaleString()), '円');

    const info = el('dl', 'sheet-info pay-summary');
    info.append(
      el('dt', '', '内容'), el('dd', '', bill.title),
      el('dt', '', '支払期限'), el('dd', '', formatDate(getBillDue(bill))),
      el('dt', '', '今の残高'), el('dd', '', `${wallet.balance.toLocaleString()}円`),
      el('dt', '', '支払い後の残高'), el('dd', enough ? '' : 'pay-short', `${(wallet.balance - bill.amount).toLocaleString()}円`)
    );

    const note = el('p', 'pay-note bill-note', '公共料金・税金の支払いには、クーポンとポイントは使えません。');

    const submit = el('button', 'sheet-btn', `${bill.amount.toLocaleString()}円を支払う`);
    submit.disabled = !enough;
    submit.addEventListener('click', () => {
      const result = payBill(bill);
      if (result.ok) fillDone(bill, result.record);
    });

    sheet.append(...sheetTop(), el('h2', 'sheet-title', 'この内容で支払いますか？'), head, total, info, note);

    // 残高が足りないとき：チャージしてから戻ってくる
    if (!enough) {
      const short = bill.amount - wallet.balance;
      const error = el('div', 'pay-error');
      const chargeBtn = el('button', 'tour-box-btn pay-charge-btn', 'チャージする');
      chargeBtn.type = 'button';
      chargeBtn.addEventListener('click', () => openCharge(() => openSheet(() => fillConfirm(bill), false), short));
      error.append(el('p', 'form-error', `残高が${short.toLocaleString()}円足りません`), chargeBtn);
      sheet.append(error);
    }

    const back = el('button', 'sheet-link account-back', '別の払込票を選ぶ');
    back.addEventListener('click', fillScan);
    sheet.append(submit, back);
  }

  // ════════════════════════════
  //  3. 支払い完了
  // ════════════════════════════
  function fillDone(bill, record) {
    resetSheet('公共料金の支払い完了');
    sheet.scrollTop = 0;

    const total = el('p', 'pay-done-amount');
    total.append(el('span', '', bill.amount.toLocaleString()), '円');

    const info = el('dl', 'sheet-info');
    info.append(
      el('dt', '', '請求元'), el('dd', '', bill.issuer),
      el('dt', '', '内容'), el('dd', '', bill.title),
      el('dt', '', '残高'), el('dd', '', `${wallet.balance.toLocaleString()}円`),
      el('dt', '', '日時'), el('dd', '', formatDateTime(record.at)),
      el('dt', '', '受付番号'), el('dd', '', record.receipt)
    );

    const note = el('div', 'point-box is-warning');
    note.append(el('p', 'point-box-text', '払込票の領収証書は出ません。この画面・お知らせ・取引履歴が支払いの記録になります。'));

    const again = el('button', 'sheet-link account-back', 'ほかの払込票を払う');
    again.addEventListener('click', fillScan);
    const closeBtn = el('button', 'sheet-btn', '閉じる');
    closeBtn.addEventListener('click', closeSheet);

    sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
      el('h2', 'sheet-title reserve-done-title', '支払いが完了しました'), total, info, note, closeBtn, again);
  }

  openSheet(fillScan, false);
}
