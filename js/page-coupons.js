// ════════════════════════════════════════
//  page-coupons.js … クーポン一覧（coupons.html）だけで使う処理
//  ・すべてのクーポンを縦に並べる
//  ・カテゴリ × 獲得状況 で絞り込む
//  ・coupons.html?kind=tour のときは回遊クーポンだけにする（ホームの「スタンプラリー」から開く）
// ════════════════════════════════════════
'use strict';
{
  const list = document.querySelector('.coupon-list');
  const emptyText = list.querySelector('.coupon-empty');
  const chipArea = document.querySelector('.category-chips');
  const tabs = document.querySelectorAll('.coupon-tab');
  let currentFilter = 'all';    // all / available / acquired
  let currentCategory = 'all';  // all / CATEGORIES の id

  // 回遊クーポンだけのページか
  const tourOnly = new URLSearchParams(location.search).get('kind') === 'tour';
  if (tourOnly) {
    document.title = '回遊クーポン｜桑都ペイ';
    document.querySelector('.page-title').textContent = '回遊クーポン';
    document.querySelector('.tour-page-link').hidden = false;
    // 回遊クーポンは「獲得する」ではなく、支払いで解放されるので、タブの名前を合わせる
    tabs.forEach((tab) => {
      if (tab.dataset.filter === 'available') tab.textContent = '未解放';
      if (tab.dataset.filter === 'acquired') tab.textContent = '解放済み';
    });
  }
  const shownCoupons = tourOnly ? COUPONS.filter((coupon) => coupon.kind === 'tour') : COUPONS;

  // ── クーポンを並べる ──
  function renderList() {
    list.querySelectorAll('.coupon-card').forEach((card) => card.remove());
    shownCoupons.forEach((coupon) => list.insertBefore(createCouponCard(coupon, true), emptyText));
    applyFilter();
  }

  // ── 絞り込み ──
  function applyFilter() {
    let shown = 0;
    list.querySelectorAll('.coupon-card').forEach((card) => {
      const status = card.dataset.status;
      const matchStatus =
        currentFilter === 'all' ||
        (currentFilter === 'available' && (status === 'available' || status === 'locked')) ||
        (currentFilter === 'acquired' && (status === 'acquired' || status === 'used'));
      const matchCategory =
        currentCategory === 'all' || card.dataset.category === currentCategory;
      const visible = matchStatus && matchCategory;
      card.hidden = !visible;
      if (visible) shown++;
    });
    emptyText.hidden = shown > 0;
  }

  // カテゴリのボタン（先頭は「すべて」）
  // 回遊クーポンのページでは、回遊クーポンがあるカテゴリだけ出す
  const categories = CATEGORIES.filter((category) => shownCoupons.some((coupon) => coupon.category === category.id));
  [{ id: 'all', label: 'すべて' }, ...categories].forEach((category) => {
    const chip = el('button', category.id === 'all' ? 'category-chip active' : 'category-chip', category.label);
    chip.addEventListener('click', () => {
      chipArea.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = category.id;
      applyFilter();
    });
    chipArea.append(chip);
  });

  // 獲得状況のタブ
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter;
      applyFilter();
    });
  });

  onRender(renderList);
  startApp();
}
