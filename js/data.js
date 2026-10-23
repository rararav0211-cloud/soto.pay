// ════════════════════════════════════════
//  桑都ペイ データファイル
//  クーポン・お店・設定など「中身」はすべてここにまとめています。
//  加盟店やクーポンを差し替えるときは、このファイルだけを編集してください。
//  （画面を動かす処理は js/ のほかのファイルにあります）
//
//  ※ HTML ではいちばん最初に読み込む必要があります
// ════════════════════════════════════════
'use strict';

// ════════════════════════════
//  クーポンのデータ
//  ここに追加・編集すると、ホームと一覧ページの両方に反映されます
//  id          : クーポンごとに重ならない英数字（獲得済みの保存に使う）
//  name        : 店名・施設名
//  discount    : 割引額（円）
//  minSpend    : 利用条件の金額（円）。この金額以上の支払いで使える。条件なしなら 0
//  category    : 下の CATEGORIES の id のどれか
//  kind        : 'normal' … いつでも獲得できる通常クーポン
//                'tour'   … 回遊クーポン（高尾山で支払うと解放、当日限り）
//  recommended : true にするとホームの「おトクなクーポン」に表示
// ════════════════════════════
const COUPONS = [
  // ── 高尾山エリア（回遊の起点） ──
  { id: 'takao-ropeway',  name: '高尾山ロープウェイ',               discount: 100, minSpend: 500,  category: 'leisure',   kind: 'normal', recommended: true },
  { id: 'gokurakuyu',     name: '京王高尾山温泉 極楽湯',            discount: 150, minSpend: 1000, category: 'leisure',   kind: 'normal', recommended: false },

  // ── 八王子駅周辺（回遊クーポン：高尾山で支払うと解放） ──
  { id: 'celeo-hachioji', name: 'セレオ八王子',                     discount: 300, minSpend: 3000, category: 'shopping',  kind: 'tour',   recommended: true },
  { id: 'tokyu-square',   name: '八王子東急スクエア',               discount: 300, minSpend: 3000, category: 'shopping',  kind: 'tour',   recommended: false },
  { id: 'mainichi-sauna', name: '毎日サウナ',                       discount: 200, minSpend: 1000, category: 'leisure',   kind: 'tour',   recommended: true },
  { id: 'yume-museum',    name: '八王子市夢美術館',                 discount: 100, minSpend: 0,    category: 'leisure',   kind: 'tour',   recommended: false },
  { id: 'takenoya',       name: '竹の家',                           discount: 100, minSpend: 800,  category: 'food',      kind: 'tour',   recommended: false },
  { id: 'den',            name: '純喫茶 田園',                      discount: 100, minSpend: 500,  category: 'food',      kind: 'tour',   recommended: false },

  // ── その他の八王子エリア ──
  { id: 'outlet-minami',  name: '三井アウトレットパーク多摩南大沢', discount: 500, minSpend: 5000, category: 'shopping',  kind: 'normal', recommended: true },
  { id: 'iias-takao',     name: 'イーアス高尾',                     discount: 300, minSpend: 3000, category: 'shopping',  kind: 'normal', recommended: false },
  { id: 'yaen-jiro',      name: '野猿二郎',                         discount: 100, minSpend: 1000, category: 'food',      kind: 'normal', recommended: true },
  { id: 'fuji-museum',    name: '東京富士美術館',                   discount: 200, minSpend: 1000, category: 'leisure',   kind: 'normal', recommended: false },
  { id: 'bus-daypass',    name: '八王子バス一日パス',               discount: 100, minSpend: 0,    category: 'transport', kind: 'normal', recommended: false },
];

// ════════════════════════════
//  クーポン詳細（カードを押したときに出る画面の内容）
//  キーは上の COUPONS の id
//  area        : 下の AREAS の id のどれか
//  description : クーポンの説明文
//  lat, lng    : 地図に出す位置（緯度・経度）。地図に出さないものは書かない
//                ※ 今の数字はおおよその位置です。加盟店が決まったら正確な位置に直してください
// ════════════════════════════
const COUPON_DETAILS = {
  'takao-ropeway':  { area: 'takao',   description: '高尾山の中腹まで上がれるロープウェイ。山頂を目指す前の一歩をおトクに。', lat: 35.6316, lng: 139.2681 },
  'gokurakuyu':     { area: 'takao',   description: '高尾山口駅すぐの日帰り温泉。登山のあとの疲れをいやせます。', lat: 35.6327, lng: 139.2697 },
  'celeo-hachioji': { area: 'station', description: 'JR八王子駅の駅ビル。ファッションや雑貨、食料品までそろいます。', lat: 35.6556, lng: 139.3388 },
  'tokyu-square':   { area: 'station', description: '八王子駅北口すぐの商業施設。帰りがけのお買い物に。', lat: 35.6566, lng: 139.3394 },
  'mainichi-sauna': { area: 'station', description: '駅周辺のサウナ施設。山歩きのあとに、ととのう時間を。', lat: 35.6551, lng: 139.3372 },
  'yume-museum':    { area: 'station', description: '八王子の中心市街地にある市立の美術館。企画展を気軽に楽しめます。', lat: 35.6608, lng: 139.3302 },
  'takenoya':       { area: 'station', description: '刻み玉ねぎがのった醤油味の「八王子ラーメン」が食べられるお店。JR八王子駅北口から徒歩数分。', lat: 35.6575, lng: 139.3355 },
  'den':            { area: 'station', description: '約60年続く昭和レトロな喫茶店。JR八王子駅北口から徒歩1分。山歩きのあとのひと休みに。', lat: 35.6566, lng: 139.3384 },
  'outlet-minami':  { area: 'other',   description: '南大沢駅すぐのアウトレットモール。人気ブランドをおトクに。', lat: 35.6143, lng: 139.3786 },
  'iias-takao':     { area: 'other',   description: '高尾駅近くの大型ショッピングモール。', lat: 35.6466, lng: 139.2855 },
  'yaen-jiro':      { area: 'other',   description: '野猿街道沿いのラーメン店。ボリュームたっぷりの一杯をおトクに。', lat: 35.6363, lng: 139.4019 },
  'fuji-museum':    { area: 'other',   description: '八王子市内にある美術館。国内外の幅広いコレクションを楽しめます。', lat: 35.6838, lng: 139.3441 },
  'bus-daypass':    { area: 'other',   description: '対象路線のバスが1日乗り放題。市内の移動に便利です。' },
};

// エリアの一覧
const AREAS = {
  takao:   '高尾山エリア',
  station: '八王子駅周辺',
  other:   '八王子市内',
};

// カテゴリの一覧（ここに書いた順に一覧ページのボタンが並ぶ）
const CATEGORIES = [
  { id: 'shopping',  label: '買い物' },
  { id: 'food',      label: '飲食店' },
  { id: 'leisure',   label: 'レジャー' },
  { id: 'transport', label: '交通' },
];

// 加盟店一覧のカテゴリ（ここに書いた順に並ぶ）
//  クーポンのお店は COUPONS の category、予約できるお店は SHOPS の type で分ける
const MERCHANT_CATEGORIES = [
  { id: 'food',       label: '飲食店' },
  { id: 'shopping',   label: '買い物' },
  { id: 'leisure',    label: 'レジャー' },
  { id: 'experience', label: '体験' },
  { id: 'stay',       label: '宿泊' },
  { id: 'transport',  label: '交通' },
];

// ホームに表示するおすすめクーポンの最大数
const HOME_COUPON_LIMIT = 5;

// 回遊クーポンの設定
const TOUR_ORIGIN = '高尾山';        // 起点になる場所
const TOUR_DESTINATION = '八王子駅周辺'; // 誘導したい場所

// 予約の種類（ホームの「食べる・泊まる・体験する」）
//  reserve.html?type=food のように、URL の type で切り替える
const RESERVE_TYPES = {
  food:       { title: '食べる',   lead: '高尾山の名物そばから駅前の喫茶店まで。席を予約して待ち時間なし。' },
  stay:       { title: '泊まる',   lead: '高尾山を朝から楽しむなら、八王子駅周辺での前泊がおすすめ。' },
  experience: { title: '体験する', lead: '「桑都」八王子ならではの体験を。日にちと時間を選んで予約できます。' },
};

// 予約でもらえるポイント（予約の種類ごと）
//  amount : もらえるポイント
//  per    : 'night' … 1泊ごと / 'person' … 1名ごと
//  ここに書いていない種類（食べる）はポイントなし
//  ※ ポイント数はデモ用の仮のものです
const RESERVE_POINTS = {
  stay:       { amount: 500, per: 'night' },
  experience: { amount: 300, per: 'person' },
};

// 予約できるお店
//  ※ 加盟店が決まるまでの仮のデータ。八王子に実在するお店・施設の名前を使っていますが、
//    桑都ペイでの予約や時間帯はデモ用です。
//  type      : RESERVE_TYPES の id
//  area      : AREAS の id（'takao' のお店は回遊の起点になる）
//  genre     : ジャンル
//  access    : 最寄り駅からのアクセス
//  price     : 料金（分かっているものだけ。なければ書かない）
//  times     : 予約できる時間（泊まるは不要）
//  closedDays: 定休日の曜日（0=日, 1=月 … 6=土）
//  onlyFourthSaturday : true なら毎月第4土曜だけ予約できる
//  couponId  : このお店で使える回遊クーポンの id（COUPONS の id）
//  lat, lng  : 地図に出す位置（おおよその位置）。couponId のあるお店は COUPON_DETAILS の位置を使う
const SHOPS = [
  // ── 食べる ──
  { id: 'takahashiya', type: 'food', area: 'takao', name: '高尾山 髙橋家', genre: 'そば',
    access: '京王線 高尾山口駅から徒歩3分', lat: 35.6318, lng: 139.2688,
    description: '高尾山口の老舗そば店。高尾山名物のとろろそばを。',
    times: ['11:00', '11:30', '12:00', '12:30', '13:00', '14:00'] },
  { id: 'takenoya', type: 'food', area: 'station', name: '竹の家', genre: 'ラーメン',
    access: 'JR八王子駅 北口から徒歩数分',
    description: '刻み玉ねぎがのった醤油味の「八王子ラーメン」が食べられるお店。',
    times: ['11:30', '12:00', '12:30', '18:00', '18:30', '19:00'], couponId: 'takenoya' },
  { id: 'den', type: 'food', area: 'station', name: '純喫茶 田園', genre: '喫茶店',
    access: 'JR八王子駅 北口から徒歩1分',
    description: '約60年続く昭和レトロな喫茶店。ナポリタンやビーフシチューが人気。',
    times: ['10:00', '11:00', '12:00', '13:00', '15:00', '17:00'], closedDays: [0], couponId: 'den' },

  // ── 泊まる ──
  { id: 'keio-plaza', type: 'stay', area: 'station', name: '京王プラザホテル八王子', genre: 'ホテル',
    access: '京王八王子駅から徒歩約3分', lat: 35.6577, lng: 139.3411,
    description: '京王八王子駅・JR八王子駅のどちらからも近いシティホテル。' },
  { id: 'the-b', type: 'stay', area: 'station', name: 'the b 八王子', genre: 'ホテル',
    access: '京王八王子駅から徒歩約1分', lat: 35.6587, lng: 139.3443,
    description: '京王八王子駅のすぐそば。高尾山口へも京王線で行きやすい立地。' },
  { id: 'yasuragi', type: 'stay', area: 'station', name: 'スパ＆ホテル 八王子温泉やすらぎの湯', genre: '温泉・ホテル',
    access: 'JR八王子駅 北口から徒歩約3分', lat: 35.6575, lng: 139.3375,
    description: '温泉つきのホテル。山歩きの疲れをとってから休めます。' },

  // ── 体験する ──
  { id: 'tamaori', type: 'experience', area: 'station', name: '多摩織 手織り体験', genre: 'ものづくり',
    access: '八王子繊維貿易館 3階（多摩織工芸館）', lat: 35.6627, lng: 139.3268,
    description: '八王子織物工業組合による手織り体験。絹織物のまち「桑都」の伝統にふれられます。',
    price: '材料費 2,000円', times: ['10:00', '13:30'] },
  { id: 'shakyo', type: 'experience', area: 'takao', name: '高尾山薬王院 月例写経会', genre: '寺院体験',
    access: '高尾山口駅近くの不動院', lat: 35.6330, lng: 139.2711,
    description: '毎月第4土曜の午後に開かれる写経会。道具は用意されています。',
    price: '1,500円', times: ['13:00'], onlyFourthSaturday: true },
];

// ════════════════════════════
//  スタンプラリー
//  対象のお店で桑都ペイを使うとスタンプが1つたまる（今は「ここで支払う」ボタンで押す）
//  spots   : 対象のお店。予約できるお店は { shop: SHOPS の id }、クーポンのお店は { coupon: COUPONS の id }
//  rewards : count 個たまったらもらえる特典
//  ※ 期間と特典の内容はデモ用の仮のものです
// ════════════════════════════
const STAMP_RALLY = {
  title: '桑都めぐりスタンプラリー',
  description: '高尾山から八王子駅周辺まで、対象のお店で桑都ペイを使うとスタンプがたまります。',
  period: '2026年11月1日〜2027年1月31日',
  spots: [
    // 高尾山エリア
    { shop: 'takahashiya' },
    { coupon: 'takao-ropeway' },
    { coupon: 'gokurakuyu' },
    // 八王子駅周辺
    { shop: 'takenoya' },
    { shop: 'den' },
    { coupon: 'celeo-hachioji' },
    { shop: 'tamaori' },
    { coupon: 'yume-museum' },
  ],
  rewards: [
    { count: 3, label: '桑都ペイ 200円分' },
    { count: 5, label: '桑都ペイ 500円分' },
    { count: 8, label: '全制覇！桑都ペイ 1,000円分' },
  ],
};

// ════════════════════════════
//  デモ用の架空の履歴
//  初めて開いたとき（まだ何も保存されていないとき）に、お知らせ・残高・ポイントへ反映する
//  残高とポイントは、上から順に計算して最後の値が画面に出る
//  daysAgo : 何日前か / time : 時刻
//  type    : 'charge'（チャージ）/ 'payment'（支払い）/ 'reserve'（予約。points があればポイントも付与）
//  amount  : チャージ額・支払額（円）。discount はクーポンでの割引額
//  stayIn  : 予約した日が今日から何日後か
// ════════════════════════════
const DEMO_START = { balance: 0, points: 0 }; // 履歴が始まる前の残高とポイント

const DEMO_HISTORY = [
  { daysAgo: 6, time: '10:12', type: 'charge',  amount: 5000 },
  { daysAgo: 6, time: '11:40', type: 'payment', shop: '高尾山ロープウェイ', amount: 950 },
  { daysAgo: 6, time: '12:35', type: 'payment', shop: '高尾山 髙橋家', amount: 1300 },
  { daysAgo: 6, time: '16:05', type: 'payment', shop: '竹の家', amount: 850, discount: 100 },
  { daysAgo: 5, time: '20:15', type: 'reserve', shop: '京王プラザホテル八王子', stayIn: 3, nights: 1, people: 2, points: 500 },
  { daysAgo: 4, time: '09:30', type: 'charge',  amount: 3000 },
  { daysAgo: 4, time: '13:20', type: 'payment', shop: '純喫茶 田園', amount: 980, discount: 100 },
  { daysAgo: 3, time: '19:02', type: 'reserve', shop: '多摩織 手織り体験', stayIn: 9, time2: '10:00', people: 2, points: 600 },
  { daysAgo: 1, time: '18:45', type: 'payment', shop: 'セレオ八王子', amount: 3400, discount: 300 },
  { daysAgo: 0, time: '08:50', type: 'charge',  amount: 3000 },
];