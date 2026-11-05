// ════════════════════════════════════════
//  ui-bill.js … 公共料金・税金の引き落としの部品（bills.html で使う。アカウントから開く）
//  ・一覧：引き落とし予定（日付・金額）と残高が足りないときの案内／登録できる公共料金／引き落とし済み
//  ・登録：内容と「登録するとどうなるか」を見せ、デモアプリのため先に進めないことを説明する（下から出るパネル）
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

// ════════════════════════════
//  一覧（引き落とし予定・登録できる公共料金・引き落とし済み）
//  box … 一覧を入れる場所（bills.html の main）
// ════════════════════════════
function renderBills(box) {
  box.replaceChildren();
  const upcoming = getUpcomingBills();
  const available = DEMO_BILLS.filter((bill) => !isBillRegistered(bill));
  const debited = DEMO_BILLS.filter(isBillDebited);

  box.append(el('p', 'reserve-lead', '登録しておくと、水道・電気・ガスの料金や市の税金が、引き落とし日に桑都ペイの残高から自動で支払われます。払込票を持って出かける必要はありません。'));

  // ── 残高が足りないときの案内 ──
  const total = getUpcomingTotal();
  if (upcoming.length > 0 && total > wallet.balance) {
    const short = total - wallet.balance;
    const warn = el('div', 'pay-error bill-warn');
    const chargeBtn = el('button', 'tour-box-btn pay-charge-btn', 'チャージする');
    chargeBtn.type = 'button';
    chargeBtn.addEventListener('click', () => openCharge(null, short));
    warn.append(el('p', 'form-error', `引き落とし予定の合計 ${total.toLocaleString()}円に対して、残高が${short.toLocaleString()}円足りません。引き落とし日までにチャージしてください。`), chargeBtn);
    box.append(warn);
  }

  // ── 引き落とし予定 ──
  const upcomingSection = el('section', 'stamp-section');
  upcomingSection.append(el('h2', 'stamp-section-title', upcoming.length > 0 ? `引き落とし予定（合計 ${total.toLocaleString()}円）` : '引き落とし予定'));
  const upcomingList = el('div', 'bill-list');
  if (upcoming.length === 0) upcomingList.append(el('p', 'notice-empty', '登録している公共料金はありません'));
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
    upcomingList.append(createBillRow(bill, sub, el('p', 'bill-row-amount', `${bill.amount.toLocaleString()}円`)));
  });
  upcomingSection.append(upcomingList);
  box.append(upcomingSection);

  // ── 登録できる公共料金 ──
  if (available.length > 0) {
    const section = el('section', 'stamp-section');
    section.append(el('h2', 'stamp-section-title', '登録できる公共料金・税金'));
    const list = el('div', 'bill-list');
    available.forEach((bill) => {
      const btn = el('button', 'bill-register-btn', '登録する');
      btn.addEventListener('click', () => openBillRegister(bill));
      list.append(createBillRow(bill, el('p', 'bill-row-due', `次の請求 ${bill.amount.toLocaleString()}円`), btn));
    });
    section.append(list);
    box.append(section);
  }

  // ── 引き落とし済み ──
  if (debited.length > 0) {
    const section = el('section', 'stamp-section');
    section.append(el('h2', 'stamp-section-title', `引き落とし済み（${debited.length}件）`));
    const list = el('div', 'bill-list');
    debited.forEach((bill) => {
      const record = billData.debited[bill.id];
      list.append(createBillRow(bill,
        el('p', 'bill-row-due', `${formatDateTime(record.at)}・受付番号 ${record.receipt}`),
        el('p', 'bill-row-amount', `${bill.amount.toLocaleString()}円`)));
    });
    section.append(list);
    box.append(section);
  }

  box.append(el('p', 'pay-note bill-note', '公共料金・税金の支払いには、クーポンとポイントは使えません。'));
}

// ════════════════════════════
//  登録（デモアプリのため、ここから先には進めない）
//  登録しようとしている公共料金の内容と、登録するとどうなるかを見せて、
//  実際の登録はできないことを説明する
// ════════════════════════════
function openBillRegister(bill) {
  function fill() {
    resetSheet('引き落としの登録');
    const head = el('div', 'pay-head');
    const headInfo = el('div', 'pay-shop-info');
    headInfo.append(el('p', 'pay-head-label', `請求元（${BILL_TYPES[bill.type].label}）`), el('p', 'pay-shop-name', bill.issuer));
    head.append(createBillIcon(bill), headInfo);

    const info = el('dl', 'sheet-info pay-summary');
    info.append(
      el('dt', '', '内容'), el('dd', '', bill.title),
      el('dt', '', '次の請求'), el('dd', '', `${bill.amount.toLocaleString()}円`),
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

    // デモアプリのため、ここから先には進めないことの説明
    const notice = el('div', 'point-box is-warning bill-demo-notice');
    notice.append(
      el('p', 'bill-demo-title', 'デモアプリのため、ここから先には進めません'),
      el('p', 'point-box-text', '実際のサービスでは、このあと請求元のお客さま番号を入力し、請求元での確認が終わると引き落としが始まります。このデモアプリでは、実際の登録はできません。')
    );

    const closeBtn = el('button', 'sheet-btn', '閉じる');
    closeBtn.addEventListener('click', closeSheet);

    sheet.append(...sheetTop(), el('h2', 'sheet-title', '公共料金の引き落としを登録する'), head, info, howto, notice, closeBtn);
  }

  openSheet(fill, false);
}
