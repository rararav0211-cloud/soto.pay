// ════════════════════════════════════════
//  page-stamp.js … スタンプラリー（stamp.html）だけで使う処理
//  ・上のカード（進み具合）
//  ・スタンプカード
//  ・特典
//  ・対象のお店（エリアごと）
// ════════════════════════════════════════
'use strict';
{
  const page = document.querySelector('.stamp-page');
  const hero = page.querySelector('.stamp-hero');
  const card = page.querySelector('.stamp-card');
  const rewardList = page.querySelector('.stamp-rewards');
  const spotList = page.querySelector('.stamp-spots');

  // ── 上のカード：タイトル・進み具合 ──
  function renderHero(count, total) {
    hero.replaceChildren();
    const progress = el('div', 'stamp-progress');
    const bar = el('div', 'stamp-progress-bar');
    bar.style.width = `${total ? (count / total) * 100 : 0}%`;
    progress.append(bar);
    // 特典がもらえる位置に目印をつける
    STAMP_RALLY.rewards.forEach((reward) => {
      const tick = el('span', count >= reward.count ? 'stamp-tick is-reached' : 'stamp-tick');
      tick.style.left = `${(reward.count / total) * 100}%`;
      progress.append(tick);
    });
    const countText = el('p', 'stamp-count');
    countText.append(el('strong', '', count), ` / ${total} 個`);
    hero.append(
      el('p', 'stamp-hero-title', STAMP_RALLY.title),
      el('p', 'stamp-hero-text', STAMP_RALLY.description),
      countText,
      progress,
      el('p', 'stamp-hero-period', `期間：${STAMP_RALLY.period}`)
    );
  }

  // ── スタンプカード（丸いマスが並ぶ） ──
  function renderCard(spots) {
    card.replaceChildren();
    spots.forEach((m, i) => {
      const done = hasStamp(m);
      const cell = el('button', done ? 'stamp-cell is-done' : 'stamp-cell');
      cell.setAttribute('aria-label', `${m.name}${done ? '（スタンプ獲得済み）' : ''}`);
      cell.append(el('span', 'stamp-mark', done ? '済' : String(i + 1)), el('span', 'stamp-name', m.name));
      cell.addEventListener('click', () => openMerchant(m));
      card.append(cell);
    });
  }

  // ── 特典 ──
  function renderRewards(count) {
    rewardList.replaceChildren();
    STAMP_RALLY.rewards.forEach((reward) => {
      const row = el('div', 'stamp-reward');
      const left = el('div', 'stamp-reward-info');
      left.append(el('p', 'stamp-reward-count', `${reward.count}個`), el('p', 'stamp-reward-label', reward.label));

      let btn;
      if (stampData.claimed.includes(reward.count)) {
        btn = el('button', 'stamp-reward-btn is-claimed', '受け取り済み');
        btn.disabled = true;
      } else if (count >= reward.count) {
        btn = el('button', 'stamp-reward-btn', '受け取る');
        btn.addEventListener('click', () => claimReward(reward));
      } else {
        btn = el('button', 'stamp-reward-btn is-locked', `あと${reward.count - count}個`);
        btn.disabled = true;
      }
      row.append(left, btn);
      rewardList.append(row);
    });
  }

  // ── 対象のお店（エリアごと） ──
  function renderSpots(spots) {
    spotList.replaceChildren();
    Object.entries(AREAS).forEach(([areaId, areaLabel]) => {
      const inArea = spots.filter((m) => m.area === areaId);
      if (inArea.length === 0) return;
      const got = inArea.filter(hasStamp).length;
      const head = el('h2', 'group-head');
      head.append(el('span', '', areaLabel), el('span', 'group-count', `${got} / ${inArea.length}`));
      spotList.append(head);
      inArea.forEach((m) => {
        const row = el('button', hasStamp(m) ? 'stamp-spot is-done' : 'stamp-spot');
        const info = el('div', 'stamp-spot-info');
        info.append(el('p', 'stamp-spot-name', m.name), el('p', 'stamp-spot-genre', m.genre));
        row.append(createIcon(m.icon), info, el('span', 'stamp-spot-status', hasStamp(m) ? '✓ 獲得' : '未獲得'));
        row.addEventListener('click', () => openMerchant(m));
        spotList.append(row);
      });
    });
  }

  function renderStampPage() {
    const spots = getStampSpots();
    const count = spots.filter(hasStamp).length;
    renderHero(count, spots.length);
    renderCard(spots);
    renderRewards(count);
    renderSpots(spots);
  }

  onRender(renderStampPage);
  startApp();
}
