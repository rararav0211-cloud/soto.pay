// ════════════════════════════════════════
//  page-pay.js … 支払いページ（pay.html）だけで使う処理
//  ・コードを見せる：自分の支払いコード（QR）を出して、お店に読み取ってもらう
//  ・QRを読み取る ：カメラでお店のQRコードを読み、そのお店への支払い画面を開く
//  pay.html?mode=scan で開くと、最初から「QRを読み取る」になる
// ════════════════════════════════════════
'use strict';
{
  const tabs = document.querySelectorAll('.pay-tabs .coupon-tab');
  const showPanel = document.querySelector('.pay-show');
  const scanPanel = document.querySelector('.pay-scan');

  // ════════════════════════════
  //  コードを見せる
  //  コードは5分ごとに作り直す（画面を撮られて使い回されないようにするため。デモでは見た目だけ）
  // ════════════════════════════
  const CODE_LIFETIME = 5 * 60 * 1000;
  const qrBox = document.querySelector('.pay-qr');
  const codeNumber = document.querySelector('.pay-code-number');
  const codeTimer = document.querySelector('.pay-code-timer');
  let codeExpiresAt = 0;

  // 「1234 5678 9012」のように4けたずつ区切った12けたの番号
  function createPayCode() {
    const random = String(Math.floor(Math.random() * 1e4)).padStart(4, '0');
    return `${user.id}${random}`;
  }

  function renewCode() {
    const code = createPayCode();
    codeExpiresAt = Date.now() + CODE_LIFETIME;
    renderQr(qrBox, `SOTOPAY:USER:${code}`);
    codeNumber.textContent = code.replace(/(\d{4})(?=\d)/g, '$1 ');
    updateCodeTimer();
  }

  function updateCodeTimer() {
    const rest = Math.max(0, codeExpiresAt - Date.now());
    if (rest === 0) {
      renewCode();
      return;
    }
    const m = Math.floor(rest / 60000);
    const s = String(Math.floor((rest % 60000) / 1000)).padStart(2, '0');
    codeTimer.textContent = `あと${m}:${s}で更新`;
  }

  document.querySelector('.pay-code-renew').addEventListener('click', renewCode);

  // デモ：お店がコードを読み取った、という想定で、お店と金額を選ぶ画面を開く
  document.querySelector('.pay-demo-store').addEventListener('click', () => openPay());

  // ════════════════════════════
  //  QRを読み取る
  //  読み取りは、ブラウザに BarcodeDetector があればそれを使い、
  //  なければ jsQR（pay.html で読み込んでいるライブラリ）を使う
  // ════════════════════════════
  const video = document.querySelector('.scan-video');
  const scanMessage = document.querySelector('.scan-message');
  const canvas = document.createElement('canvas');
  let stream = null;   // カメラの映像
  let scanTimer = null;
  let detector = null;          // BarcodeDetector（使えないブラウザでは null のまま）
  let detectorChecked = false;  // BarcodeDetector が使えるか、もう調べたか

  function showScanMessage(text, withRetry) {
    scanMessage.replaceChildren(el('p', '', text));
    if (withRetry) {
      const retry = el('button', 'tour-box-btn scan-retry', 'もう一度読み取る');
      retry.addEventListener('click', startScan);
      scanMessage.append(retry);
    }
    scanMessage.hidden = false;
  }

  async function createDetector() {
    if ('BarcodeDetector' in window) {
      try {
        const formats = await BarcodeDetector.getSupportedFormats();
        if (formats.includes('qr_code')) return new BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        // 使えなければ jsQR にまかせる
      }
    }
    return null;
  }

  // 映像の今のコマから QR を探す（見つかったら中身の文字、なければ null）
  async function readFrame() {
    if (video.readyState < 2) return null;
    if (detector) {
      const codes = await detector.detect(video);
      return codes.length > 0 ? codes[0].rawValue : null;
    }
    if (typeof jsQR === 'undefined') return null;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
    return result ? result.data : null;
  }

  async function startScan() {
    stopScan();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showScanMessage('このブラウザではカメラを使えません。下の「お店を選んで支払う」をお使いください。', false);
      return;
    }
    if (!detectorChecked) {
      detector = await createDetector();
      detectorChecked = true;
    }
    if (!detector && typeof jsQR === 'undefined') {
      showScanMessage('QRコードを読み取る準備ができませんでした。通信環境を確認してください。', true);
      return;
    }

    showScanMessage('カメラを準備しています…', false);
    try {
      // 外側のカメラ（スマホの背面カメラ）を優先して使う
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    } catch (e) {
      showScanMessage(e.name === 'NotAllowedError'
        ? 'カメラの利用が許可されていません。ブラウザの設定から許可してください。'
        : 'カメラを起動できませんでした。', true);
      return;
    }
    video.srcObject = stream;
    await video.play().catch(() => {});
    scanMessage.hidden = true;

    // 0.3秒ごとに映像を調べる
    scanTimer = setInterval(async () => {
      let text = null;
      try {
        text = await readFrame();
      } catch (e) {
        return; // 1コマ読めなくても続ける
      }
      if (text === null || stream === null) return;
      onScanned(text);
    }, 300);
  }

  function stopScan() {
    clearInterval(scanTimer);
    scanTimer = null;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
  }

  // QR を読み取れたとき
  function onScanned(text) {
    stopScan();
    if (navigator.vibrate) navigator.vibrate(80);
    const m = findMerchantByQr(text);
    if (!m) {
      showScanMessage('桑都ペイのお店のQRコードではありません。', true);
      return;
    }
    showScanMessage(`${m.name}のQRコードを読み取りました`, true);
    openPay({ merchant: m });
  }

  document.querySelector('.pay-demo-select').addEventListener('click', () => {
    stopScan();
    showScanMessage('お店を選んで支払っています', true);
    openPay();
  });

  // ════════════════════════════
  //  タブの切り替え
  // ════════════════════════════
  let mode = 'show';

  function selectMode(next) {
    mode = next;
    tabs.forEach((tab) => {
      const active = tab.dataset.mode === mode;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    showPanel.hidden = mode !== 'show';
    scanPanel.hidden = mode !== 'scan';
    if (mode === 'scan') {
      startScan();
    } else {
      stopScan();
      renewCode(); // 見せるたびに新しいコードにする
    }
  }

  tabs.forEach((tab) => tab.addEventListener('click', () => selectMode(tab.dataset.mode)));

  // 1秒ごとに残り時間を書きかえる
  setInterval(() => {
    if (mode === 'show') updateCodeTimer();
  }, 1000);

  // 別のアプリやタブに移ったらカメラを止め、戻ってきたら読み取りを再開する
  document.addEventListener('visibilitychange', () => {
    if (mode !== 'scan') return;
    if (document.hidden) {
      stopScan();
    } else if (!sheetOpen) {
      startScan();
    }
  });

  startApp();
  selectMode(new URLSearchParams(location.search).get('mode') === 'scan' ? 'scan' : 'show');
}
