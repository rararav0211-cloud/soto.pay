// ════════════════════════════════════════
//  page-reserve.js … お店の予約（reserve.html）だけで使う処理
//  ・食べる / 泊まる / 体験する の切り替え（URL の ?type=）
//  ・お店のカード
//  ・予約の入力画面と完了画面
//  ・予約画面に出す回遊クーポンの案内
// ════════════════════════════════════════
'use strict';
{
  // ════════════════════════════
  //  入力チェック・入力欄づくり
  // ════════════════════════════

  // その日に予約できない理由を返す（予約できるなら空の文字）
  function getDateError(shop, value) {
    const d = toDate(value);
    if (shop.closedDays && shop.closedDays.includes(d.getDay())) {
      const names = shop.closedDays.map((n) => WEEKDAYS[n]).join('・');
      return `${names}曜日は定休日です。別の日を選んでください`;
    }
    if (shop.onlyFourthSaturday) {
      const isFourthSaturday = d.getDay() === 6 && d.getDate() >= 22 && d.getDate() <= 28;
      if (!isFourthSaturday) return '毎月第4土曜だけ開催しています。第4土曜を選んでください';
    }
    return '';
  }

  // 選択肢つきの入力欄を作る
  function createSelect(name, options) {
    const select = el('select', 'form-input');
    select.name = name;
    options.forEach(([value, label]) => {
      const option = el('option', '', label);
      option.value = value;
      select.append(option);
    });
    return select;
  }

  function createField(label, input) {
    const field = el('label', 'form-field');
    field.append(el('span', 'form-label', label), input);
    return field;
  }

  // ════════════════════════════
  //  予約画面に出す「回遊クーポン」の案内
  //  dateValue … 予約しようとしている日（回遊クーポンは当日限りなので比べる）
  //  onChange  … クーポンを獲得したときに呼ぶ（案内を描き直す）
  // ════════════════════════════
  function createTourBox(shop, dateValue, onChange) {
    // 高尾山エリアのお店：回遊の起点になることを伝える
    if (shop.area === 'takao') return createOriginBox();

    const coupon = getShopCoupon(shop);
    if (!coupon) return null;

    const status = getStatus(coupon);
    const box = el('div', 'tour-box');

    const head = el('div', 'tour-box-head');
    head.append(el('span', 'coupon-badge', '回遊'), el('p', 'tour-box-title', 'このお店で回遊クーポンが使えます'));

    const amount = el('p', 'tour-box-amount');
    amount.append(el('strong', '', `${coupon.discount.toLocaleString()}円引き`), `（${getConditionText(coupon)}）`);

    box.append(head, amount);

    // まだ解放されていない・期限切れ
    if (status === 'locked' || status === 'expired') {
      box.append(el('p', 'tour-box-text', status === 'locked'
        ? `${TOUR_ORIGIN}で桑都ペイを使うと解放されます。高尾山に寄ってから来店するとおトクです。`
        : `前回の回遊クーポンは期限切れです。当日に${TOUR_ORIGIN}で桑都ペイを使うと、また届きます。`));
      return box;
    }

    // 配信中
    const expiry = formatTime(tour.expiresAt);
    if (status === 'acquired') {
      box.append(el('p', 'tour-box-text', `お会計を桑都ペイで支払うと自動で割引されます（本日${expiry}まで）。`));
      // 獲得済みは、押せないボタンで「獲得済み」と表示する
      const done = el('button', 'tour-box-btn is-done', '✓ 獲得済み');
      done.type = 'button';
      done.disabled = true;
      box.append(done);
    } else {
      box.append(el('p', 'tour-box-text', `配信中です。本日${expiry}まで使えます。`));
      const btn = el('button', 'tour-box-btn', 'クーポンを獲得する');
      btn.type = 'button'; // フォームの「予約を確定する」として扱われないようにする
      btn.addEventListener('click', () => {
        acquireCoupon(coupon);
        onChange();
      });
      box.append(btn);
    }

    // 回遊クーポンは当日限り。別の日の予約なら注意を出す
    if (dateValue !== todayString()) {
      box.append(el('p', 'tour-box-warn', `※ 回遊クーポンは本日限りです。${formatDate(dateValue)}の来店には使えません。`));
    }
    return box;
  }

  // 回遊クーポンの案内を入れる場所を作る（獲得したら自分で描き直す）
  //  getDate … 今の予約日を返す関数
  function createTourArea(shop, getDate) {
    const area = el('div', 'tour-area');
    function update() {
      area.replaceChildren();
      const box = createTourBox(shop, getDate(), update);
      if (box) area.append(box);
    }
    update();
    area.update = update;
    return area;
  }

  // ════════════════════════════
  //  お店のカード
  // ════════════════════════════
  function createShopCard(shop) {
    const card = el('div', 'shop-card');

    const head = el('div', 'shop-head');
    const titleBox = el('div', 'shop-title-box');
    const labels = el('div', 'coupon-labels');
    if (shop.area === 'takao') labels.append(el('span', 'coupon-badge is-origin', '回遊の起点'));
    if (getShopCoupon(shop)) labels.append(el('span', 'coupon-badge', '回遊クーポン対象'));
    if (RESERVE_POINTS[shop.type]) labels.append(el('span', 'coupon-badge is-point', getPointRuleText(shop)));
    labels.append(el('span', 'coupon-category', shop.genre), el('span', 'coupon-category', AREAS[shop.area]));
    titleBox.append(el('p', 'shop-name', shop.name), labels);
    head.append(createIcon(shop.type), titleBox);

    const desc = el('p', 'shop-desc', shop.description);

    const foot = el('div', 'shop-foot');
    const btn = el('button', 'shop-btn', '予約する');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openReserve(shop);
    });
    foot.append(el('p', 'shop-access', shop.access), btn);

    card.append(head, desc, foot);
    card.addEventListener('click', () => openReserve(shop));
    return card;
  }

  // ════════════════════════════
  //  予約の入力画面
  // ════════════════════════════
  function openReserve(shop) {
    openSheet(() => fillReserveForm(shop), false);
  }

  function fillReserveForm(shop) {
    resetSheet(`${shop.name}の予約`);
    const isStay = shop.type === 'stay';

    const labels = el('div', 'coupon-labels');
    labels.append(el('span', 'coupon-category', shop.genre), el('span', 'coupon-category', AREAS[shop.area]));

    const title = el('h2', 'sheet-title', shop.name);
    const desc = el('p', 'sheet-desc', shop.description);

    const info = el('dl', 'sheet-info');
    info.append(el('dt', '', 'アクセス'), el('dd', '', shop.access));
    if (shop.price) info.append(el('dt', '', '料金'), el('dd', '', shop.price));

    // ── 入力欄 ──
    const form = el('form', 'reserve-form');

    const dateInput = el('input', 'form-input');
    dateInput.type = 'date';
    dateInput.name = 'date';
    dateInput.min = todayString();
    dateInput.value = todayString();
    dateInput.required = true;
    form.append(createField(isStay ? 'チェックイン日' : '日付', dateInput));

    if (isStay) {
      form.append(createField('泊数', createSelect('nights', [[1, '1泊'], [2, '2泊'], [3, '3泊']])));
    } else {
      form.append(createField('時間', createSelect('time', shop.times.map((t) => [t, t]))));
    }

    const peopleOptions = [];
    for (let i = 1; i <= 8; i++) peopleOptions.push([i, `${i}名`]);
    form.append(createField('人数', createSelect('people', peopleOptions)));

    // ── もらえるポイントの案内（泊数・人数を変えたら計算し直す） ──
    const pointBox = el('div', 'point-box');
    function updatePointBox() {
      const nights = isStay ? Number(form.elements.nights.value) : 1;
      const people = Number(form.elements.people.value);
      const points = getReservePoints(shop, nights, people);
      pointBox.replaceChildren();
      pointBox.hidden = points === 0;
      if (points === 0) return;
      const amount = el('p', 'point-box-amount');
      amount.append('この予約で ', el('strong', '', `${points.toLocaleString()}pt`), ' もらえます');
      pointBox.append(amount, el('p', 'point-box-text', `${getPointRuleText(shop)}。予約が完了するとポイントが付与されます。`));
    }
    form.addEventListener('change', updatePointBox);

    // ── 回遊クーポンの案内（日付を変えたら描き直す） ──
    const tourArea = createTourArea(shop, () => dateInput.value || todayString());
    dateInput.addEventListener('change', tourArea.update);

    // ── エラーと確定ボタン ──
    const error = el('p', 'form-error');
    error.hidden = true;
    const submit = el('button', 'sheet-btn', '予約を確定する');
    submit.type = 'submit';

    // 入力欄のあと：ポイント → 回遊クーポン → エラー → 確定ボタン
    form.append(pointBox, tourArea, error, submit);
    updatePointBox();

    form.addEventListener('submit', (e) => {
      e.preventDefault(); // ページが再読み込みされないようにする
      const data = new FormData(form);
      const date = data.get('date');

      function showError(message) {
        error.textContent = message;
        error.hidden = false;
      }

      if (!date || date < todayString()) return showError('今日以降の日付を選んでください');

      const dateError = getDateError(shop, date);
      if (dateError) return showError(dateError);

      // 今日の予約で、もう過ぎた時間を選んでいないか
      if (!isStay && date === todayString()) {
        const [h, m] = data.get('time').split(':').map(Number);
        const now = new Date();
        if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) {
          return showError('その時間はすでに過ぎています。別の時間か日付を選んでください');
        }
      }

      const nights = isStay ? Number(data.get('nights')) : null;
      const people = Number(data.get('people'));
      const reservation = {
        id: `R${String(Date.now()).slice(-6)}`, // 予約番号（デモ用に時刻の下6けた）
        shopId: shop.id,
        shopName: shop.name,
        date,
        time: isStay ? null : data.get('time'),
        nights,
        people,
        points: getReservePoints(shop, nights || 1, people), // 宿泊・体験の予約はポイントを付与する
        createdAt: Date.now(),
      };
      addReservation(shop, reservation);
      fillReserveDone(shop, reservation);
    });

    sheet.append(...sheetTop(), labels, title, desc, info, form);
  }

  // ════════════════════════════
  //  予約完了の画面
  // ════════════════════════════
  function fillReserveDone(shop, reservation) {
    resetSheet('予約完了');
    sheet.scrollTop = 0;

    const check = el('div', 'reserve-check', '✓');
    const title = el('h2', 'sheet-title reserve-done-title', '予約が完了しました');

    const info = el('dl', 'sheet-info');
    const isStay = shop.type === 'stay';
    info.append(
      el('dt', '', 'お店'), el('dd', '', shop.name),
      el('dt', '', isStay ? 'チェックイン' : '日時'),
      el('dd', '', isStay
        ? `${formatDate(reservation.date)}から${reservation.nights}泊`
        : `${formatDate(reservation.date)} ${reservation.time}`),
      el('dt', '', '人数'), el('dd', '', `${reservation.people}名`),
      el('dt', '', '予約番号'), el('dd', '', reservation.id)
    );

    sheet.append(...sheetTop(), check, title, info);

    // ポイントを付与したときは表示する
    if (reservation.points > 0) {
      const pointDone = el('div', 'point-box is-done');
      const amount = el('p', 'point-box-amount');
      amount.append(el('strong', '', `+${reservation.points.toLocaleString()}pt`), ' 獲得しました');
      const total = el('p', 'point-box-text');
      total.append('保有ポイント：', el('span', 'points-value', pointData.balance.toLocaleString()), 'pt');
      pointDone.append(amount, total);
      sheet.append(pointDone);
    }

    // 完了画面にも回遊クーポンの案内を出す
    const tourArea = createTourArea(shop, () => reservation.date);
    const note = el('p', 'sheet-desc', '当日はお店で予約番号をお伝えください。お支払いは桑都ペイが使えます。');
    const closeBtn = el('button', 'sheet-btn', '閉じる');
    closeBtn.addEventListener('click', closeSheet);

    sheet.append(tourArea, note, closeBtn);
  }

  // ════════════════════════════
  //  ページの表示
  // ════════════════════════════
  const shopList = document.querySelector('.shop-list');
  const params = new URLSearchParams(location.search);
  const type = RESERVE_TYPES[params.get('type')] ? params.get('type') : 'food';

  document.title = `${RESERVE_TYPES[type].title}｜桑都ペイ`;
  document.querySelector('.page-title').textContent = RESERVE_TYPES[type].title;
  document.querySelector('.reserve-lead').textContent = RESERVE_TYPES[type].lead;

  // 上の「食べる・泊まる・体験する」切り替え
  document.querySelectorAll('.reserve-switch a').forEach((link) => {
    link.classList.toggle('active', link.dataset.type === type);
  });

  SHOPS
    .filter((shop) => shop.type === type)
    .forEach((shop) => shopList.append(createShopCard(shop)));

  startApp();

  // クーポン詳細や加盟店一覧の「このお店を予約する」から来たときは、そのお店の予約画面をすぐ開く
  const target = SHOPS.find((shop) => shop.id === params.get('shop') && shop.type === type);
  if (target) openReserve(target);
}
