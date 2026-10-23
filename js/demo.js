// ════════════════════════════════════════
//  demo.js … 発表・テスト用
//  ・初めて開いたときに、data.js の DEMO_HISTORY（架空の履歴）を入れる
//  ・ブラウザのコンソールから使う sotoPayDemo
//  本番では、このファイルを読み込まなければデモ用の動きはすべてなくなる
// ════════════════════════════════════════
'use strict';

// ════════════════════════════
//  デモ用の架空の履歴を入れる（まだ入れていないときに1回だけ）
//  前に試したお知らせ・残高・ポイントがあっても、デモの履歴に置きかえる
// ════════════════════════════
function seedDemoHistory() {
  if (typeof DEMO_HISTORY === 'undefined') return;
  try {
    if (localStorage.getItem(KEYS.demoSeeded) === '1') return; // もう入れてある
  } catch (e) {
    return; // 保存が使えない環境では入れない
  }

  // いまあるお知らせ・ポイントの履歴を空にしてから入れる
  notices.length = 0;
  pointData.history = [];

  let balance = DEMO_START.balance;
  let points = DEMO_START.points;
  const today = new Date();

  // 「今日から n 日後」を「2026-10-25」の形にする
  function dateAfter(days) {
    return toDateString(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days));
  }

  DEMO_HISTORY.forEach((h, index) => {
    const [hour, minute] = h.time.split(':').map(Number);
    const at = new Date(today.getFullYear(), today.getMonth(), today.getDate() - h.daysAgo, hour, minute).getTime();
    const read = index < DEMO_HISTORY.length - 2; // 最後の2件だけ未読にする

    if (h.type === 'charge') {
      balance += h.amount;
      notices.unshift({ type: 'charge', title: 'チャージが完了しました',
        body: `${h.amount.toLocaleString()}円をチャージしました。残高：${balance.toLocaleString()}円`, at, read });
    }

    if (h.type === 'payment') {
      const paid = h.amount - (h.discount || 0);
      balance -= paid;
      const coupon = h.discount ? `（クーポン${h.discount.toLocaleString()}円引き）` : '';
      notices.unshift({ type: 'payment', title: '支払いが完了しました',
        body: `${h.shop}で${paid.toLocaleString()}円を支払いました${coupon}。残高：${balance.toLocaleString()}円`, at, read });
    }

    if (h.type === 'reserve') {
      const date = dateAfter(h.stayIn);
      const when = h.nights ? `${formatDate(date)}から${h.nights}泊` : `${formatDate(date)} ${h.time2}`;
      notices.unshift({ type: 'reserve', title: '予約が完了しました',
        body: `${h.shop}　${when}・${h.people}名`, at, read });
      if (h.points) {
        points += h.points;
        pointData.history.push({ label: `${h.shop}の予約`, amount: h.points, at });
        notices.unshift({ type: 'points', title: `${h.points.toLocaleString()}ptを獲得しました`,
          body: `${h.shop}の予約でポイントが付与されました。保有ポイント：${points.toLocaleString()}pt`, at, read });
      }
    }
  });

  // 履歴の結果を、今の残高とポイントにする
  wallet.balance = balance;
  pointData.balance = points;
  save(KEYS.notices, notices);
  save(KEYS.wallet, wallet);
  save(KEYS.points, pointData);
  save(KEYS.demoSeeded, 1);
}

// 画面を描く前に入れておく
seedDemoHistory();

// ════════════════════════════
//  コンソールから使うコマンド
//  sotoPayDemo.expire()       … 回遊クーポンをすぐ期限切れにする
//  sotoPayDemo.reset()        … 獲得状況・回遊クーポン・予約・スタンプ・ポイント・お知らせ・残高をすべてリセット
//                               （ページを開き直すと、デモ用の架空の履歴がもう一度入る）
//  sotoPayDemo.log()          … 送客の記録（どのクーポンが何時に獲得されたか）を表示
//  sotoPayDemo.reservations() … 予約の一覧を表示
//  sotoPayDemo.points()       … ポイントの履歴を表示
// ════════════════════════════
window.sotoPayDemo = {
  expire() {
    if (tour === null) return;
    tour.expiresAt = Date.now() - 1;
    save(KEYS.tour, tour);
    render();
  },
  reset() {
    acquired.length = 0;
    reservations.length = 0;
    stampData.stamps = {};
    stampData.claimed = [];
    pointData.balance = 0;
    pointData.history = [];
    notices.length = 0;
    wallet.balance = INITIAL_BALANCE;
    tour = null;
    try {
      Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
    } catch (e) {}
    render();
  },
  reservations() {
    console.table(reservations);
  },
  points() {
    console.log(`保有ポイント：${pointData.balance}pt`);
    console.table(pointData.history.map((h) => ({ 内容: h.label, ポイント: h.amount, 日時: new Date(h.at).toLocaleString('ja-JP') })));
  },
  log() {
    if (tour === null) return console.log('回遊クーポンはまだ解放されていません');
    console.table(tour.acquired.map((item) => ({
      起点: tour.origin,
      クーポン: (COUPONS.find((c) => c.id === item.id) || {}).name,
      獲得時刻: new Date(item.at).toLocaleString('ja-JP'),
    })));
  },
};
