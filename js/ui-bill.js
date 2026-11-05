// ════════════════════════════════════════
//  ui-bill.js … 公共料金・税金の引き落とし（支払う画面・アカウントから開く）
//  ・引き落とし予定（日付・金額）と、残高が足りないときの案内
//  ・登録できる公共料金 → 登録の確認 → 登録完了
//  ・引き落とし済み
//  引き落としそのものは state.js の processDueBills() が、引き落とし日に自動で行う
//  ※ 公共料金・税金には、クーポンとポイントは使えない
// ════════════════════════════════════════
'use strict';

// 種類のアイコン（固定の SVG だけなので innerHTML を使っている）
function createBillIcon(bill) {
  const icon = el('div', `bill-icon is-${bill.type}`);
  icon.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${BILL_TYPES[bill.type].icon}</svg>`;
  return icon;
}

// 公共料金1件（一覧の1行）。sub は3行目の文、right は右に出す部品
function createBillRow(bill, sub, right) {
  const row = el('div', isBillDebited(bill) ? 'bill-row is-paid' : 'bill-row');
  const info = el('div', 'bill-row-info');
  info.append(
    el('p', 'bill-row-issuer', `${BILL_TYPES[bill.type].label}・${bill.issuer}`),
    el('p', 'bill-row-title', bill.title)
  );
  if (sub) info.append(sub);
  row.append(createBillIcon(bill), info);
  if (right) row.append(right);
  return row;
}

function openBills() {
  // いま出している画面（描き直しても同じ画面のままにするため）
  let view = { name: 'list', bill: null };

  function show(name, bill = null) {
    view = { name, bill };
    sheet.scrollTop = 0;
    fill();
  }

  function fill() {
    if (view.name === 'confirm') fillConfirm(view.bill);
    else if (view.name === 'done') fillDone(view.bill);
    else fillList();
  }

  // ════════════════════════════
  //  一覧（引き落とし予定・登録できる公共料金・引き落とし済み）
  // ════════════════════════════
  function fillList() {
    resetSheet('公共料金の引き落とし');
    const upcoming = getUpcomingBills();
    const available = DEMO_BILLS.filter((bill) => !isBillRegistered(bill));
    const debited = DEMO_BILLS.filter(isBillDebited);

    sheet.append(...sheetTop(), el('h2', 'sheet-title', '公共料金の引き落とし'),
      el('p', 'sheet-desc', '登録しておくと、水道・電気・ガスの料金や市の税金が、引き落とし日に桑都ペイの残高から自動で支払われます。払込票を持って出かける必要はありません。'));

    // ── 残高が足りないときの案内 ──
    const total = getUpcomingTotal();
    if (upcoming.length > 0 && total > wallet.balance) {
      const short = total - wallet.balance;
      const warn = el('div', 'pay-error');
      const chargeBtn = el('button', 'tour-box-btn pay-charge-btn', 'チャージする');
      chargeBtn.type = 'button';
      chargeBtn.addEventListener('click', () => openCharge(() => openBills(), short));
      warn.append(el('p', 'form-error', `引き落とし予定の合計 ${total.toLocaleString()}円に対して、残高が${short.toLocaleString()}円足りません。引き落とし日までにチャージしてください。`), chargeBtn);
      sheet.append(warn);
    }

    // ── 引き落とし予定 ──
    if (upcoming.length > 0) {
      sheet.append(el('p', 'bill-section-title', `引き落とし予定（合計 ${total.toLocaleString()}円）`));
      const list = el('div', 'bill-list');
      upcoming.forEach((bill) => {
        const sub = el('div', 'bill-row-sub');
        const failed = billData.failed[bill.id];
        sub.append(el('p', failed ? 'bill-row-due is-failed' : 'bill-row-due', failed
          ? '残高不足で引き落とせませんでした。チャージすると引き落とします'
          : `${formatDate(billData.due[bill.id])}に引き落とし`));
        const actions = el('div', 'bill-row-actions');
        const cancel = el('button', 'tour-box-link bill-cancel-link', '登録を解除');
        cancel.addEventListener('click', () => unregisterBill(bill));
        actions.append(cancel);
        sub.append(actions);
        list.append(createBillRow(bill, sub, el('p', 'bill-row-amount', `${bill.amount.toLocaleString()}円`)));
      });
      sheet.append(list);
    }

    // ── 登録できる公共料金 ──
    if (available.length > 0) {
      sheet.append(el('p', 'bill-section-title', '登録できる公共料金・税金'));
      const list = el('div', 'bill-list');
      available.forEach((bill) => {
        const btn = el('button', 'bill-register-btn', '登録する');
        btn.addEventListener('click', () => show('confirm', bill));
        list.append(createBillRow(bill, el('p', 'bill-row-due', `次の請求 ${bill.amount.toLocaleString()}円`), btn));
      });
      sheet.append(list);
    }

    // ── 引き落とし済み ──
    if (debited.length > 0) {
      const done = el('details', 'bill-paid');
      done.append(el('summary', '', `引き落とし済み（${debited.length}件）`));
      const list = el('div', 'bill-list');
      debited.forEach((bill) => {
        const record = billData.debited[bill.id];
        list.append(createBillRow(bill,
          el('p', 'bill-row-due', `${formatDateTime(record.at)}・受付番号 ${record.receipt}`),
          el('p', 'bill-row-amount', `${bill.amount.toLocaleString()}円`)));
      });
      done.append(list);
      sheet.append(done);
    }

    sheet.append(el('p', 'pay-note bill-note', '公共料金・税金の支払いには、クーポンとポイントは使えません。'));
  }

  // ════════════════════════════
  //  登録の確認
  // ════════════════════════════
  function fillConfirm(bill) {
    resetSheet('引き落としの登録');
    const head = el('div', 'pay-head');
    const headInfo = el('div', 'pay-shop-info');
    headInfo.append(el('p', 'pay-head-label', `請求元（${BILL_TYPES[bill.type].label}）`), el('p', 'pay-shop-name', bill.issuer));
    head.append(createBillIcon(bill), headInfo);

    const due = new Date();
    due.setDate(due.getDate() + bill.dueInDays);
    const info = el('dl', 'sheet-info pay-summary');
    info.append(
      el('dt', '', '内容'), el('dd', '', bill.title),
      el('dt', '', '次の請求'), el('dd', '', `${bill.amount.toLocaleString()}円`),
      el('dt', '', '引き落とし日'), el('dd', '', formatDate(toDateString(due))),
      el('dt', '', '引き落とし先'), el('dd', '', '桑都ペイの残高')
    );

    const howto = el('div', 'sheet-howto');
    howto.append(el('p', 'sheet-howto-title', '登録すると'));
    const steps = el('ol', '');
    steps.append(
      el('li', '', '請求があるたびに、引き落とし日に残高から自動で支払われます'),
      el('li', '', '引き落とし日までに、残高が足りるようにチャージしておいてください'),
      el('li', '', '引き落とすとお知らせが届き、取引履歴に残ります')
    );
    howto.append(steps);

    const ok = el('button', 'sheet-btn', 'この内容で登録する');
    ok.addEventListener('click', () => {
      registerBill(bill);
      show('done', bill);
    });
    const back = el('button', 'sheet-link account-back', 'もどる');
    back.addEventListener('click', () => show('list'));

    sheet.append(...sheetTop(), el('h2', 'sheet-title', '引き落としを登録しますか？'), head, info, howto, ok, back);
  }

  // ════════════════════════════
  //  登録完了
  // ════════════════════════════
  function fillDone(bill) {
    resetSheet('引き落としの登録完了');
    const info = el('dl', 'sheet-info');
    info.append(
      el('dt', '', '内容'), el('dd', '', `${bill.issuer}　${bill.title}`),
      el('dt', '', '引き落とし日'), el('dd', '', formatDate(billData.due[bill.id])),
      el('dt', '', '金額'), el('dd', '', `${bill.amount.toLocaleString()}円`),
      el('dt', '', '今の残高'), el('dd', '', `${wallet.balance.toLocaleString()}円`)
    );
    const listBtn = el('button', 'sheet-btn', '引き落としの一覧へ');
    listBtn.addEventListener('click', () => show('list'));
    sheet.append(...sheetTop(), el('div', 'reserve-check', '✓'),
      el('h2', 'sheet-title reserve-done-title', '引き落としを登録しました'), info, listBtn);
  }

  openSheet(fill, true); // 引き落とし・チャージで描き直す
}
