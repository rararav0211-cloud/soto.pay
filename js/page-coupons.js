// ════════════════════════════════════════
//  page-coupons.js … クーポン一覧（coupons.html）だけで使う処理
//  ・すべてのクーポンを縦に並べる
//  ・カテゴリ × 獲得状況 で絞り込む
// ════════════════════════════════════════
'use strict';
{
  const list = document.querySelector('.coupon-list');
  const emptyText = list.querySelector('.coupon-empty');
  const chipArea = document.querySelector('.category-chips');
  const tabs = document.querySelectorAll('.coupon-tab');
  let currentFilter = 'all';    // all / available / acquired
  let currentCategory = 'all';  // all / CATEGORIES の id

  // ── クーポンを並べる ──
  function renderList() {
    list.querySelectorAll('.coupon-card').forEach((card) => card.remove());
    COUPONS.forEach((coupon) => list.insertBefore(createCouponCard(coupon, true), emptyText));
    applyFilter();
  }

  // ── 絞り込み ──
  function applyFilter() {
    let shown = 0;
    list.querySelectorAll('.coupon-card').forEach((card) => {
      const status = card.dataset.status;
      const matchStatus =
        currentFilter === 'all' ||
        (currentFilter === 'available' && status === 'available') ||
        (currentFilter === 'acquired' && status === 'acquired');
      const matchCategory =
        currentCategory === 'all' || card.dataset.category === currentCategory;
      const visible = matchStatus && matchCategory;
      card.hidden = !visible;
      if (visible) shown++;
    });
    emptyText.hidden = shown > 0;
  }

  // カテゴリのボタン（先頭は「すべて」）
  [{ id: 'all', label: 'すべて' }, ...CATEGORIES].forEach((category) => {
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
