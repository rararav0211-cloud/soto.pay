// ════════════════════════════════════════
//  page-faq.js … よくある質問（faq.html）だけで使う処理
//  スライド20「FAQ・チャットボットの導入」
//  ・分類ごとに質問を並べ、押すと答えが開く
//  ・検索欄に入れたことばで、質問と答えをしぼりこむ
//  ・faq.html#points のように分類の id を付けて開くと、その分類にしぼって答えも開く
//  戻るボタンは、開く前の画面に戻る（なければアカウントへ）
// ════════════════════════════════════════
'use strict';
{
  const list = document.querySelector('.faq-list');
  const chips = document.querySelector('.faq-chips');
  const input = document.querySelector('.faq-search-input');
  const empty = document.querySelector('.faq-empty');

  let current = 'all'; // 分類（all / FAQ_CATEGORIES の id）
  let query = '';

  // 開いた分類（#points など）
  const hashCategory = FAQ_CATEGORIES.some((c) => c.id === location.hash.slice(1)) ? location.hash.slice(1) : null;
  if (hashCategory) current = hashCategory;

  // ── 戻るボタン：同じアプリの画面から来たときは、その画面に戻る ──
  const back = document.querySelector('.back-btn');
  back.addEventListener('click', (e) => {
    let fromApp = false;
    try {
      fromApp = document.referrer !== '' && new URL(document.referrer).origin === location.origin;
    } catch (err) {}
    if (fromApp && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });

  // 質問1件（押すと答えが開く）
  function createItem(faq, open) {
    const item = el('details', 'faq-item');
    item.open = open;
    item.append(el('summary', 'faq-q', faq.q));
    const answer = el('div', 'faq-a');
    faq.a.forEach((text) => answer.append(el('p', '', text)));
    item.append(answer);
    return item;
  }

  // 検索：ことばを空白で区切り、すべてが質問か答えに入っているもの
  function matches(faq) {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return true;
    const text = `${faq.q} ${faq.a.join(' ')}`.toLowerCase();
    return words.every((w) => text.includes(w));
  }

  function renderChips() {
    chips.replaceChildren();
    [{ id: 'all', label: 'すべて' }, ...FAQ_CATEGORIES].forEach((c) => {
      const chip = el('button', c.id === current ? 'category-chip active' : 'category-chip', c.label);
      chip.type = 'button';
      chip.addEventListener('click', () => {
        current = c.id;
        renderChips();
        renderList();
      });
      chips.append(chip);
    });
    // 選んでいる分類のボタンが見えるように、横にスクロールしておく
    const active = chips.querySelector('.category-chip.active');
    if (active) chips.scrollLeft = Math.max(0, active.offsetLeft - chips.offsetLeft - 16);
  }

  function renderList() {
    list.replaceChildren();
    let shown = 0;
    FAQ_CATEGORIES.forEach((c) => {
      if (current !== 'all' && current !== c.id) return;
      const faqs = FAQS.filter((f) => f.category === c.id && matches(f));
      if (faqs.length === 0) return;
      const section = el('section', 'stamp-section faq-section');
      section.id = `faq-${c.id}`;
      section.append(el('h2', 'stamp-section-title', c.label));
      // 検索中・分類を指定して開いたときは、答えを開いておく
      const open = query.trim() !== '' || c.id === hashCategory;
      faqs.forEach((f) => section.append(createItem(f, open)));
      list.append(section);
      shown += faqs.length;
    });
    empty.hidden = shown > 0;
  }

  input.addEventListener('input', () => {
    query = input.value;
    renderList();
  });

  renderChips();
  renderList();
  startApp();
}
