// ════════════════════════════════════════
//  page-stamp.js … 回遊クーポン（stamp.html）だけで使う処理
//  stamp.html … 今日の回遊クーポン・解放のつながり・おすすめルートの一覧
//  stamp.html?course=ルートの id … おすすめルートの詳細
//   ・上のカード（進み具合）
//   ・行程（プランのとおり。スタンプのない立ち寄り先も出す）
//   ・スタンプカード
//   ・特典（半分・全部）
//   ・このルートの回遊クーポン
//   ・プランを考えた人の工夫
// ════════════════════════════════════════
'use strict';
{
  const page = document.querySelector('.stamp-page');
  const courseId = new URLSearchParams(location.search).get('course');
  const course = TOUR_COURSES.find((c) => c.id === courseId) || null;

  // ページの上のタイトル
  if (course) {
    document.title = `${course.title}｜桑都ペイ`;
    // 戻るボタンはコースの一覧へ
    const back = document.querySelector('.back-btn');
    back.href = 'stamp.html';
    back.setAttribute('aria-label', '回遊クーポンに戻る');
  }

  // セクション（見出しつきの白い箱）
  function createSection(title, note) {
    const section = el('section', 'stamp-section');
    section.append(el('h2', 'stamp-section-title', title));
    if (note) section.append(el('p', 'stamp-section-note', note));
    return section;
  }

  // 進み具合のバー（特典がもらえる位置に目印）
  function createProgress(c, count) {
    const total = c.spots.length;
    const progress = el('div', 'stamp-progress');
    const bar = el('div', 'stamp-progress-bar');
    bar.style.width = `${total ? (count / total) * 100 : 0}%`;
    progress.append(bar);
    getCourseRewards(c).forEach((reward) => {
      const tick = el('span', count >= reward.count ? 'stamp-tick is-reached' : 'stamp-tick');
      tick.style.left = `${(reward.count / total) * 100}%`;
      progress.append(tick);
    });
    return progress;
  }

  // ルートのラベル（向いている人・時期）
  function createCourseLabels(c) {
    const labels = el('div', 'coupon-labels');
    labels.append(el('span', 'coupon-category', c.target));
    if (c.season) labels.append(el('span', 'coupon-category is-season', c.season));
    return labels;
  }

  // ════════════════════════════
  //  一覧（今日の回遊クーポン・つながり・おすすめルート）
  // ════════════════════════════
  // 解放のつながりの順番（はじまりのクーポンから、近い順）
  function getTourOrder() {
    const order = [...TOUR_STARTS];
    for (let i = 0; i < order.length; i++) {
      (TOUR_NEXT[order[i]] || []).forEach((id) => {
        if (!order.includes(id)) order.push(id);
      });
    }
    return order.map(findCoupon).filter(Boolean);
  }

  const STATUS_LABEL = { acquired: '使える', used: '使用済み', locked: '未解放' };

  function renderList() {
    page.replaceChildren();
    const unlocked = getUnlockedToday();
    const usable = COUPONS.filter((c) => c.kind === 'tour' && getStatus(c) === 'acquired');

    // ── 上のカード ──
    const hero = el('section', 'stamp-hero');
    const countText = el('p', 'stamp-count');
    countText.append(el('strong', '', usable.length), ' 枚 使えます');
    hero.append(
      el('p', 'stamp-hero-title', '今日の回遊クーポン'),
      el('p', 'stamp-hero-text', 'お店で桑都ペイを使うと、次のお店のクーポンが解放されます。そのお店で使うと、また次が開きます。'),
      countText
    );
    if (unlocked.length > 0) {
      const remain = el('p', 'stamp-hero-period');
      remain.append(`今日解放したクーポン ${unlocked.length}枚・本日23:59まで（残り `, el('span', 'tour-countdown', formatRemaining(getTourExpiry() - Date.now())), '）');
      hero.append(remain);
    } else {
      hero.append(el('p', 'stamp-hero-period', 'まずは高尾山（ケーブルカー・リフト）で使ってみましょう。'));
    }

    // ── いま使えるクーポン ──
    const usableSection = createSection('いま使えるクーポン', '押すとクーポンの詳細が開きます。');
    usableSection.append(createCouponChips(usable));

    // ── 解放のつながり ──
    const mapSection = createSection('解放のつながり', 'お店で支払うと、→ の先のお店のクーポンが解放されます。');
    mapSection.id = 'tour-map';
    const tree = el('div', 'tour-tree');
    getTourOrder().forEach((coupon) => {
      const status = getStatus(coupon);
      const row = el('div', `tour-node is-${status}`);
      const top = el('button', 'tour-node-head');
      top.type = 'button';
      top.append(el('span', 'tour-node-status', isStartCoupon(coupon) ? 'スタート' : STATUS_LABEL[status]),
        el('span', 'tour-node-name', coupon.name),
        el('span', 'tour-node-amount', `${coupon.discount.toLocaleString()}円引き`));
      top.addEventListener('click', () => openDetail(coupon));
      row.append(top);
      const next = getNextCoupons(coupon);
      if (next.length) row.append(el('p', 'tour-node-next', `→ ${next.map((c) => c.name).join('・')}`));
      tree.append(row);
    });
    mapSection.append(tree);

    // ── おすすめルート ──
    const section = createSection('おすすめルート',
      `メンバーが考えた周回プランです。半分回ると${TOUR_REWARDS.half.toLocaleString()}円分、全部回ると${TOUR_REWARDS.complete.toLocaleString()}円分の特典（期間：${TOUR_RALLY.period}）。`);
    const list = el('div', 'course-list');
    TOUR_COURSES.forEach((c) => {
      const count = getCourseCount(c);
      const card = el('a', count > 0 ? 'course-card is-joined' : 'course-card');
      card.href = getCourseUrl(c);

      const foot = el('div', 'course-card-foot');
      foot.append(el('span', 'course-card-budget', `予算 ${c.budget}`),
        el('span', 'course-card-count', `スタンプ ${count} / ${c.spots.length}`));

      card.append(createCourseLabels(c), el('p', 'course-card-title', c.title), el('p', 'course-card-catch', c.catch));
      if (count > 0) card.append(createProgress(c, count));
      card.append(foot);
      list.append(card);
    });
    section.append(list);

    page.append(hero, usableSection, mapSection, section);
  }

  // ════════════════════════════
  //  コースの詳細
  // ════════════════════════════
  function renderCourse(c) {
    page.replaceChildren();
    const spots = getCourseSpots(c);
    const count = spots.filter(hasStamp).length;

    // ── 上のカード ──
    const hero = el('section', 'stamp-hero');
    const countText = el('p', 'stamp-count');
    countText.append(el('strong', '', count), ` / ${spots.length} 個`);
    hero.append(
      createCourseLabels(c),
      el('p', 'stamp-hero-title', c.title),
      el('p', 'stamp-hero-text', c.catch),
      countText,
      createProgress(c, count),
      el('p', 'stamp-hero-period', `予算の目安（1人）：${c.budget}`)
    );

    const coupons = getCourseCoupons(c);

    // ── 行程 ──
    const planSection = createSection('行程', 'この順に回ると、前のお店で支払ったときに次のお店のクーポンが解放されます。スタンプはお店で桑都ペイを使うと押されます。');
    const plan = el('ol', 'course-plan');
    c.plan.forEach((step) => {
      const item = el('li', 'course-plan-step');
      item.append(el('span', 'course-plan-time', step.time), el('p', 'course-plan-text', step.text));
      plan.append(item);
    });
    planSection.append(plan);

    // ── スタンプカード ──
    const cardSection = createSection('スタンプカード', 'お店を押すと詳細が開きます。ここから支払いもできます。');
    const card = el('div', 'stamp-card');
    spots.forEach((m, i) => {
      const done = hasStamp(m);
      const cell = el('button', done ? 'stamp-cell is-done' : 'stamp-cell');
      cell.setAttribute('aria-label', `${m.name}${done ? '（スタンプ獲得済み）' : ''}`);
      cell.append(el('span', 'stamp-mark', done ? '済' : String(i + 1)), el('span', 'stamp-name', m.name));
      cell.addEventListener('click', () => openMerchant(m));
      card.append(cell);
    });
    cardSection.append(card);

    // ── 特典 ──
    const rewardSection = createSection('特典', `期間：${TOUR_RALLY.period}`);
    const rewardList = el('div', 'stamp-rewards');
    getCourseRewards(c).forEach((reward) => {
      const row = el('div', 'stamp-reward');
      const left = el('div', 'stamp-reward-info');
      left.append(el('p', 'stamp-reward-count', `${reward.count}個`), el('p', 'stamp-reward-label', reward.label));

      let btn;
      if (isRewardClaimed(c, reward)) {
        btn = el('button', 'stamp-reward-btn is-claimed', '受け取り済み');
        btn.disabled = true;
      } else if (count < reward.count) {
        btn = el('button', 'stamp-reward-btn is-locked', `あと${reward.count - count}個`);
        btn.disabled = true;
      } else {
        btn = el('button', 'stamp-reward-btn', '受け取る');
        btn.addEventListener('click', () => claimReward(c, reward));
      }
      row.append(left, btn);
      rewardList.append(row);
    });
    rewardSection.append(rewardList);

    // ── このコースの回遊クーポン ──
    const couponSection = createSection('このルートの回遊クーポン');
    const couponList = el('div', 'coupon-list course-coupons');
    coupons.forEach((coupon) => couponList.append(createCouponCard(coupon, true)));
    couponSection.append(couponList);

    page.append(hero, planSection, cardSection, rewardSection, couponSection);

    // ── プランを考えた人の工夫 ──
    if (c.idea) {
      const ideaSection = createSection('地域通貨を使った工夫のアイデア');
      ideaSection.append(el('p', 'course-idea', c.idea));
      page.append(ideaSection);
    }
  }

  onRender(() => (course ? renderCourse(course) : renderList()));
  startApp();
}
