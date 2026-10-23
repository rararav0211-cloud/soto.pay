// ════════════════════════════════════════
//  page-shops.js … 加盟店一覧（shops.html）だけで使う処理
//  ・検索 / エリア / カテゴリの絞り込み
//  ・エリアごと or 現在地から近い順の並べ方
//  ・リスト / 地図（Leaflet）の切り替え
// ════════════════════════════════════════
'use strict';
{
  const merchantList = document.querySelector('.merchant-list');
  const searchInput = document.querySelector('.merchant-search');
  const areaChips = document.querySelector('.merchant-area-chips');
  const categoryChips = document.querySelector('.merchant-category-chips');
  const countText = document.querySelector('.merchant-count');
  const emptyText = document.querySelector('.merchant-empty');
  const locationStatus = document.querySelector('.location-status');
  const nearToggle = document.querySelector('.near-toggle input');
  const groupBar = document.querySelector('.group-bar');
  const mapView = document.querySelector('.map-view');
  const mapBox = document.querySelector('.merchant-map');
  const viewButtons = document.querySelectorAll('.view-switch button');

  const merchants = buildMerchants();
  let currentArea = 'all';
  let currentCategory = 'all';
  // 'area' … エリアごとに見出しをつけて並べる / 'near' … 現在地から近い順に並べる
  let currentGroup = 'area';
  let userPos = null; // 現在地 { lat, lng }

  // ════════════════════════════
  //  加盟店のカード
  // ════════════════════════════
  function createMerchantCard(m) {
    const card = el('div', 'shop-card');
    card.dataset.area = m.area;

    const head = el('div', 'shop-head');
    const titleBox = el('div', 'shop-title-box');
    const labels = el('div', 'coupon-labels');
    if (m.area === 'takao') labels.append(el('span', 'coupon-badge is-origin', '回遊の起点'));
    if (m.coupon) {
      labels.append(el('span', m.coupon.kind === 'tour' ? 'coupon-badge' : 'coupon-badge is-coupon',
        `${m.coupon.discount.toLocaleString()}円引き`));
    }
    if (m.shop) labels.append(el('span', 'coupon-badge is-reserve', '予約可'));
    if (isStampSpot(m)) labels.append(el('span', 'coupon-badge is-stamp', 'スタンプ'));
    labels.append(el('span', 'coupon-category', m.genre), el('span', 'coupon-category', AREAS[m.area]));
    titleBox.append(el('p', 'shop-name', m.name), labels);
    // 現在地からの距離（「近い順」のときだけ文字が入る）
    head.append(createIcon(m.icon), titleBox, el('span', 'shop-distance'));

    card.append(head, el('p', 'shop-desc', m.description));
    if (m.access) card.append(el('p', 'shop-access', m.access));

    card.addEventListener('click', () => openMerchant(m));
    return card;
  }

  // カードは最初に1回だけ作っておき、絞り込みのたびに並べ直す
  const cards = merchants.map((m) => createMerchantCard(m));
  const visible = merchants.map(() => true); // 絞り込みで表示するかどうか

  // ════════════════════════════
  //  現在地からの距離
  // ════════════════════════════
  // 2つの地点の距離（km）を緯度・経度から計算する（ハバーサインの公式）
  function getDistanceKm(a, b) {
    const R = 6371; // 地球の半径（km）
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function getMerchantDistance(m) {
    if (!userPos || m.lat === null) return null;
    return getDistanceKm(userPos, { lat: m.lat, lng: m.lng });
  }

  // 「約350m」「約1.2km」の形にする
  function formatDistance(km) {
    if (km < 1) return `約${Math.max(10, Math.round((km * 1000) / 10) * 10)}m`;
    return `約${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
  }

  // ════════════════════════════
  //  現在地の取得
  // ════════════════════════════
  const DEMO_POSITION = { lat: 35.6558, lng: 139.3389, label: 'JR八王子駅' }; // デモ用の現在地

  // 現在地が決まったら、一覧と地図に反映する
  function setUserPos(pos) {
    userPos = pos;
    renderList();
    updateMarkers(true);
  }

  function showLocationStatus(message, withDemoButton) {
    locationStatus.replaceChildren(el('span', '', message));
    if (withDemoButton) {
      const demoBtn = el('button', 'location-demo-btn', `${DEMO_POSITION.label}を現在地にする`);
      demoBtn.addEventListener('click', () => {
        showLocationStatus(`${DEMO_POSITION.label}を現在地にしています`, false);
        setUserPos({ lat: DEMO_POSITION.lat, lng: DEMO_POSITION.lng });
      });
      locationStatus.append(demoBtn);
    }
    locationStatus.hidden = false;
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      showLocationStatus('このブラウザでは現在地を使えません。', true);
      return;
    }
    showLocationStatus('現在地を取得しています…', false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        // 八王子から遠く離れているときは、デモ用の現在地も選べるようにする
        const farAway = getDistanceKm(here, DEMO_POSITION) > 30;
        showLocationStatus(farAway
          ? '現在地から近い順に並べています（八王子から離れた場所にいるようです）'
          : '現在地から近い順に並べています', farAway);
        setUserPos(here);
      },
      (err) => {
        const messages = {
          1: '位置情報の利用が許可されていません。ブラウザの設定から許可してください。',
          2: '現在地を取得できませんでした。',
          3: '現在地の取得に時間がかかっています。もう一度お試しください。',
        };
        showLocationStatus(messages[err.code] || '現在地を取得できませんでした。', true);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  }

  // ════════════════════════════
  //  一覧を並べる
  // ════════════════════════════
  // 見出し（「八王子駅周辺 3件」など）
  function appendGroupHead(label, count) {
    const head = el('h2', 'group-head');
    head.append(el('span', '', label), el('span', 'group-count', `${count}件`));
    merchantList.insertBefore(head, emptyText);
  }

  function renderList() {
    // カードと見出しをいったん外す（「該当なし」の文だけ残す）
    merchantList.querySelectorAll('.shop-card, .group-head').forEach((node) => node.remove());

    // 距離の表示を更新（近い順のときだけ）
    merchants.forEach((m, i) => {
      const d = currentGroup === 'near' ? getMerchantDistance(m) : null;
      cards[i].querySelector('.shop-distance').textContent = d === null ? '' : formatDistance(d);
    });

    const shownIndexes = merchants.map((m, i) => i).filter((i) => visible[i]);

    // 近い順：見出しを1つにして距離の近い順に並べる（位置がないお店は最後）
    if (currentGroup === 'near') {
      if (shownIndexes.length === 0) return;
      if (userPos) {
        shownIndexes.sort((a, b) => {
          const da = getMerchantDistance(merchants[a]);
          const db = getMerchantDistance(merchants[b]);
          if (da === null) return 1;
          if (db === null) return -1;
          return da - db;
        });
      }
      appendGroupHead(userPos ? '現在地から近い順' : '現在地を確認しています', shownIndexes.length);
      shownIndexes.forEach((i) => merchantList.insertBefore(cards[i], emptyText));
      return;
    }

    // 近い順がオフのとき：エリアごとに見出しをつけて並べる
    Object.entries(AREAS).forEach(([id, label]) => {
      const inArea = shownIndexes.filter((i) => merchants[i].area === id);
      if (inArea.length === 0) return; // 1件もない見出しは出さない
      appendGroupHead(label, inArea.length);
      inArea.forEach((i) => merchantList.insertBefore(cards[i], emptyText));
    });
  }

  // 「現在地から近い順」のオン・オフ
  function selectGroup(group) {
    nearToggle.checked = group === 'near';
    currentGroup = group;
    // ボトムナビの「近くのお店」を、近い順のときだけ選択中にする
    const nearNav = document.querySelector('.nav-item.nav-near');
    if (nearNav) nearNav.classList.toggle('active', group === 'near');
    if (group === 'near') {
      if (!userPos) requestLocation();
      else locationStatus.hidden = false;
    } else {
      locationStatus.hidden = true;
    }
    renderList();
  }

  nearToggle.addEventListener('change', () => {
    selectGroup(nearToggle.checked ? 'near' : 'area');
  });

  // ════════════════════════════
  //  地図
  //  Leaflet（無料の地図ライブラリ）と OpenStreetMap の地図を使う
  // ════════════════════════════
  let map = null;
  let userMarker = null;
  const markers = []; // merchants と同じ順番。位置がないお店は null

  // ピンの色：高尾山エリア＝緑、回遊クーポン＝オレンジ、それ以外＝グレー
  function getPinClass(m) {
    if (m.area === 'takao') return 'map-pin is-origin';
    if (m.coupon && m.coupon.kind === 'tour') return 'map-pin is-tour';
    return 'map-pin';
  }

  // ピンを押したときに出る吹き出し
  function createPopup(m) {
    const box = el('div', 'map-popup');
    box.append(el('p', 'map-popup-name', m.name), el('p', 'map-popup-genre', `${m.genre}・${AREAS[m.area]}`));
    if (m.coupon) box.append(el('p', 'map-popup-coupon', `${m.coupon.discount.toLocaleString()}円引きクーポンあり`));
    const btn = el('button', 'map-popup-btn', '詳細を見る');
    btn.addEventListener('click', () => openMerchant(m));
    box.append(btn);
    return box;
  }

  function initMap() {
    if (typeof L === 'undefined') {
      // ネットにつながっていないなどで Leaflet が読み込めなかったとき
      mapBox.replaceChildren(el('p', 'map-error', '地図を読み込めませんでした。通信環境を確認してください。'));
      return;
    }
    map = L.map(mapBox, { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    merchants.forEach((m) => {
      if (m.lat === null) {
        markers.push(null);
        return;
      }
      const icon = L.divIcon({ className: getPinClass(m), iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -12] });
      const marker = L.marker([m.lat, m.lng], { icon, title: m.name });
      marker.bindPopup(createPopup(m));
      markers.push(marker);
    });
    updateMarkers(true);
  }

  // 絞り込みに合わせてピンを出し入れする（fit が true なら全部入るように地図を動かす）
  function updateMarkers(fit) {
    if (!map) return;
    const visibleLatLngs = [];

    // 現在地のピン
    if (userPos) {
      if (!userMarker) {
        const icon = L.divIcon({ className: 'map-pin is-me', iconSize: [18, 18], iconAnchor: [9, 9] });
        userMarker = L.marker([userPos.lat, userPos.lng], { icon, title: '現在地', zIndexOffset: 1000 }).addTo(map);
      } else {
        userMarker.setLatLng([userPos.lat, userPos.lng]);
      }
      // 近い順のときは現在地も地図に入るようにする
      if (currentGroup === 'near') visibleLatLngs.push([userPos.lat, userPos.lng]);
    }

    merchants.forEach((m, i) => {
      const marker = markers[i];
      if (!marker) return;
      if (!visible[i]) {
        marker.remove();
      } else {
        marker.addTo(map);
        visibleLatLngs.push([m.lat, m.lng]);
      }
    });

    if (fit) {
      if (visibleLatLngs.length > 0) {
        map.fitBounds(visibleLatLngs, { padding: [30, 30], maxZoom: 16 });
      } else {
        map.setView([35.655, 139.32], 12); // 該当なしのときは八王子全体
      }
    }
  }

  // ── リスト / 地図の切り替え ──
  viewButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      viewButtons.forEach((b) => b.classList.toggle('active', b === btn));
      const showMap = btn.dataset.view === 'map';
      merchantList.hidden = showMap;
      groupBar.hidden = showMap; // 並べ方の切り替えはリストのときだけ
      mapView.hidden = !showMap;
      if (!showMap) return;
      if (!map) {
        initMap();
      } else {
        map.invalidateSize(); // 隠れていた地図を表示したときは大きさを計算し直す
        updateMarkers(true);
      }
    });
  });

  // ════════════════════════════
  //  絞り込み（エリア・カテゴリ・検索ワード）
  // ════════════════════════════
  function getMerchantCategoryLabel(id) {
    const found = MERCHANT_CATEGORIES.find((c) => c.id === id);
    return found ? found.label : 'その他';
  }

  function filterMerchants() {
    const word = searchInput.value.trim().toLowerCase();
    let shown = 0;
    merchants.forEach((m, i) => {
      const matchArea = currentArea === 'all' || m.area === currentArea;
      const matchCategory = currentCategory === 'all' || m.category === currentCategory;
      const text = `${m.name} ${m.genre} ${getMerchantCategoryLabel(m.category)} ${m.description} ${m.access}`.toLowerCase();
      const matchWord = word === '' || text.includes(word);
      visible[i] = matchArea && matchCategory && matchWord;
      if (visible[i]) shown++;
    });
    countText.textContent = `${shown}件の加盟店`;
    emptyText.hidden = shown > 0;
    renderList();
    updateMarkers(true);
  }

  // 絞り込みボタンを作る（先頭は「すべて」）
  function createChips(area, items, onSelect) {
    [['all', 'すべて'], ...items].forEach(([id, label]) => {
      const chip = el('button', id === 'all' ? 'category-chip active' : 'category-chip', label);
      chip.addEventListener('click', () => {
        area.querySelectorAll('.category-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        onSelect(id);
        filterMerchants();
      });
      area.append(chip);
    });
  }

  createChips(areaChips, Object.entries(AREAS), (id) => { currentArea = id; });
  createChips(categoryChips, MERCHANT_CATEGORIES.map((c) => [c.id, c.label]), (id) => { currentCategory = id; });
  searchInput.addEventListener('input', filterMerchants);
  filterMerchants();

  // ボトムナビの「近くのお店」（shops.html?sort=near）から来たときは、最初から近い順にする
  if (new URLSearchParams(location.search).get('sort') === 'near') {
    selectGroup('near');
  }

  startApp();
}
