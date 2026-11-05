// ════════════════════════════════════════
//  page-coupons.js … クーポン一覧（coupons.html）だけで使う処理
//  ・すべてのクーポンを縦に並べる
//  ・カテゴリ × 獲得状況 で絞り込む
//  ・回遊クーポンは、解放されたもの（今日解放した・今日使った）だけを出す
//  ・coupons.html?kind=tour のときは回遊クーポンだけにする（ホームの「スタンプラリー」から開く。未解放もふくめて全部）
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
    // ホームの「スタンプラリー」から開くページなので、下のナビは「ホーム」を選択中にする
    document.querySelector('.bottom-nav .nav-coupon').classList.remove('active');
    document.querySelector('.bottom-nav a[href="index.html"]').classList.add('active');
    // 回遊クーポンは「獲得する」ではなく、支払いで解放されるので、タブの名前を合わせる
    tabs.forEach((tab) => {
      if (tab.dataset.filter === 'available') tab.textContent = '未解放';
      if (tab.dataset.filter === 'acquired') tab.textContent = '解放済み';
    });
  }
  const tourCoupons = COUPONS.filter((coupon) => coupon.kind === 'tour');

  // 並べるクーポン
  //  回遊クーポンだけのページ … 回遊クーポンを全部（未解放もふくめて見渡せるように）
  //  ふつうのクーポン一覧   … 通常クーポンと、解放された回遊クーポン（今日解放した・今日使った）だけ
  //  解放の状態は支払いで変わるので、並べるたびに選び直す
  function getShownCoupons() {
    if (tourOnly) return tourCoupons;
    return COUPONS.filter((coupon) => coupon.kind !== 'tour' || getStatus(coupon) !== 'locked');
  }

  // ── クーポンを並べる ──
  function renderList() {
    list.querySelectorAll('.coupon-card').forEach((card) => card.remove());
    getShownCoupons().forEach((coupon) => list.insertBefore(createCouponCard(coupon, true), emptyText));
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
  const categories = tourOnly
    ? CATEGORIES.filter((category) => tourCoupons.some((coupon) => coupon.category === category.id))
    : CATEGORIES;
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
