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
//                'tour'   … 回遊クーポン（高尾山エリアや前のお店で支払うと解放、当日限り。下の TOUR_FROM_TAKAO・TOUR_COURSES を参照）
//  recommended : true にするとホームの「おトクなクーポン」に表示
//  ※ 回遊クーポンの割引額・条件はデモ用の仮のものです
// ════════════════════════════
const COUPONS = [
  // ── 回遊クーポンのお店（高尾山エリア） ──
  { id: 'takao-ropeway',  name: '高尾山ケーブルカー・リフト',       discount: 100, minSpend: 500,  category: 'transport', kind: 'normal', recommended: true },
  { id: 'yakuoin',        name: '高尾山薬王院 授与所',               discount: 100, minSpend: 500,  category: 'leisure',   kind: 'tour',   recommended: false },
  { id: 'saruen',         name: '高尾山さる園・野草園',             discount: 100, minSpend: 500,  category: 'leisure',   kind: 'tour',   recommended: false },
  { id: 'juichi-chaya',   name: '高尾山 十一丁目茶屋',               discount: 100, minSpend: 500,  category: 'food',      kind: 'tour',   recommended: false },
  { id: 'takahashiya',    name: '高尾山 髙橋家',                     discount: 100, minSpend: 1000, category: 'food',      kind: 'tour',   recommended: false },
  { id: 'fumotoya',       name: '高尾山Fumotoya',                    discount: 200, minSpend: 1500, category: 'food',      kind: 'tour',   recommended: false },
  { id: 'takao599',       name: '高尾599ミュージアム',               discount: 100, minSpend: 1000, category: 'leisure',   kind: 'tour',   recommended: false },
  { id: 'takao-coffee',   name: 'TAKAO COFFEE',                      discount: 100, minSpend: 800,  category: 'food',      kind: 'tour',   recommended: false },
  { id: 'kiyotaki',       name: '清滝駅前商店街',                    discount: 100, minSpend: 500,  category: 'shopping',  kind: 'tour',   recommended: false },
  { id: 'gokurakuyu',     name: '京王高尾山温泉 極楽湯',            discount: 150, minSpend: 1000, category: 'leisure',   kind: 'tour',   recommended: false },

  // ── 回遊クーポンのお店（八王子駅周辺。高尾山エリアで支払うと解放：TOUR_FROM_TAKAO） ──
  { id: 'celeo-hachioji', name: 'セレオ八王子',                     discount: 300, minSpend: 3000, category: 'shopping',  kind: 'tour',   recommended: true },
  { id: 'tokyu-square',   name: '八王子東急スクエア',               discount: 300, minSpend: 3000, category: 'shopping',  kind: 'tour',   recommended: false },
  { id: 'mainichi-sauna', name: '毎日サウナ',                       discount: 200, minSpend: 1000, category: 'leisure',   kind: 'tour',   recommended: true },
  { id: 'yume-museum',    name: '八王子市夢美術館',                 discount: 100, minSpend: 0,    category: 'leisure',   kind: 'tour',   recommended: false },
  { id: 'takenoya',       name: '竹の家',                           discount: 100, minSpend: 800,  category: 'food',      kind: 'tour',   recommended: false },
  { id: 'den',            name: '純喫茶 田園',                      discount: 100, minSpend: 500,  category: 'food',      kind: 'tour',   recommended: false },
  { id: 'aina-cafe',      name: 'AINA CAFE',                         discount: 100, minSpend: 1000, category: 'food',      kind: 'tour',   recommended: false },
  { id: 'dia-coffee',     name: 'Dia.Coffee',                        discount: 100, minSpend: 700,  category: 'food',      kind: 'tour',   recommended: false },
  { id: 'cafe-66',        name: 'カフェ 66',                         discount: 200, minSpend: 2000, category: 'food',      kind: 'tour',   recommended: false },
  { id: 'soto-terrace',   name: '桑都テラス',                        discount: 100, minSpend: 1000, category: 'shopping',  kind: 'tour',   recommended: false },

  // ── 回遊クーポンのお店（八王子市内） ──
  { id: 'ukai-toriyama',  name: 'うかい鳥山',                        discount: 500, minSpend: 5000, category: 'food',      kind: 'tour',   recommended: false },
  { id: 'ecotown',        name: 'エコタウン八王子大和田店',          discount: 300, minSpend: 3000, category: 'shopping',  kind: 'tour',   recommended: false },
  { id: 'outlet-minami',  name: '三井アウトレットパーク多摩南大沢', discount: 500, minSpend: 5000, category: 'shopping',  kind: 'normal', recommended: true },
  { id: 'isonuma',        name: '磯沼ミルクファーム',                discount: 100, minSpend: 500,  category: 'leisure',   kind: 'tour',   recommended: false },
  { id: 'nippon-isshu',   name: 'にっぽん一周',                      discount: 300, minSpend: 3000, category: 'food',      kind: 'tour',   recommended: false },
  { id: 'ryusenji',       name: '竜泉寺の湯 八王子みなみ野店',       discount: 100, minSpend: 1000, category: 'leisure',   kind: 'tour',   recommended: false },

  // ── 通常クーポン（いつでも獲得できる） ──
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
  'takao-ropeway':  { area: 'takao',   description: '清滝駅から高尾山の中腹まで上がれるケーブルカーとリフト。山頂を目指す前の一歩をおトクに。', lat: 35.6316, lng: 139.2681 },
  'yakuoin':        { area: 'takao',   description: '高尾山の中腹にある真言宗のお寺。お守りや御朱印の授与所で使えます。', lat: 35.6253, lng: 139.2509 },
  'saruen':         { area: 'takao',   description: 'ケーブルカー高尾山駅の近くにある、サルの施設と山野草の園。', lat: 35.6278, lng: 139.2560 },
  'juichi-chaya':   { area: 'takao',   description: 'ケーブルカー高尾山駅そばの茶屋。団子やそばで山歩きのひと休みに。', lat: 35.6284, lng: 139.2578 },
  'fumotoya':       { area: 'takao',   description: '高尾山口のレストラン。石窯ピザやパスタが食べられ、利用客は足湯にも入れます。', lat: 35.6318, lng: 139.2672 },
  'takao599':       { area: 'takao',   description: '高尾山の自然を紹介するミュージアム（入館無料）。併設の「599 CAFE」での軽食やショップのお土産に使えます。', lat: 35.6322, lng: 139.2700 },
  'takao-coffee':   { area: 'takao',   description: '高尾山口駅近くのカフェ。下山後のコーヒー休憩に。', lat: 35.6320, lng: 139.2694 },
  'kiyotaki':       { area: 'takao',   description: 'ケーブルカー清滝駅前の商店街。食べ歩きやお土産選びに。春は高尾梅郷の梅まつりへの寄り道も。', lat: 35.6315, lng: 139.2676 },
  'gokurakuyu':     { area: 'takao',   description: '高尾山口駅すぐの日帰り温泉。登山のあとの疲れをいやせます。', lat: 35.6327, lng: 139.2697 },
  'celeo-hachioji': { area: 'station', description: 'JR八王子駅の駅ビル。ファッションや雑貨、食料品までそろいます。', lat: 35.6556, lng: 139.3388 },
  'aina-cafe':      { area: 'station', description: '八王子駅周辺の写真映えするカフェ。' },
  'dia-coffee':     { area: 'station', description: '八王子駅周辺のコーヒー店。スイーツ休憩に。' },
  'cafe-66':        { area: 'station', description: '八王子駅周辺のおしゃれなカフェ。夜はお酒も楽しめます。' },
  'soto-terrace':   { area: 'station', description: '八王子の買い物・休憩スポット。旅の終わりのお土産選びに。' },
  'ukai-toriyama':  { area: 'other',   description: '山あいにたたずむ炭火焼の料亭。高尾駅から無料の送迎バスがあります。', lat: 35.6447, lng: 139.2640 },
  'ecotown':        { area: 'other',   description: 'ハードオフ・ホビーオフ・ブックオフなどの系列店がそろう大型店。古着やレトログッズ、おもちゃまで、半日楽しめます。', lat: 35.6620, lng: 139.3560 },
  'isonuma':        { area: 'other',   description: '京王線山田駅から徒歩約5分の牧場。カフェのスイーツや乳しぼり体験が楽しめます。', lat: 35.6403, lng: 139.3172 },
  'nippon-isshu':   { area: 'other',   description: '南大沢駅周辺の飲食店。旅の締めくくりの夕食に。' },
  'ryusenji':       { area: 'other',   description: '八王子みなみ野駅近くの日帰り温泉。温泉と岩盤浴で一日の疲れをいやせます。', lat: 35.6283, lng: 139.3360 },
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

// アカウント画面に出す利用者の名前（デモ用）
const USER_NAME = '中大たかお';

// ホームに表示するおすすめクーポンの最大数
const HOME_COUPON_LIMIT = 5;


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
//  couponId  : このお店で使えるクーポンの id（COUPONS の id）
//  lat, lng  : 地図に出す位置（おおよその位置）。couponId のあるお店は COUPON_DETAILS の位置を使う
const SHOPS = [
  // ── 食べる ──
  { id: 'takahashiya', type: 'food', area: 'takao', name: '高尾山 髙橋家', genre: 'そば',
    access: '京王線 高尾山口駅から徒歩3分', lat: 35.6318, lng: 139.2688,
    description: '高尾山口の老舗そば店。高尾山名物のとろろそばを。',
    times: ['11:00', '11:30', '12:00', '12:30', '13:00', '14:00'], couponId: 'takahashiya' },
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
//  回遊クーポンとおすすめルート
//  メンバーが考えた周回プランを、1つずつ「おすすめルート」にしたもの
//  ・高尾山エリアのお店で支払うと、八王子駅周辺の回遊クーポン（TOUR_FROM_TAKAO）が解放される
//  ・さらに、ルートの並び（spots）から回遊クーポンの「つながり」を作る（state.js の TOUR_NEXT）
//    前のお店で支払うと、次のお店の回遊クーポンが解放される
//  ・解放したクーポンは、その日の23:59まで
//  ・お店で桑都ペイを使うとスタンプが押され、ルートのスタンプが半分・全部たまると特典（TOUR_REWARDS）
//
//  TOUR_RALLY : 全体のタイトル・期間（特典を受け取れる期間）
//  TOUR_COURSES の1件：
//   id      : ルートごとに重ならない英数字（特典の保存に使う）
//   title   : ルート名 / target : どんな人向けか / season : 時期の注意（なければ書かない）
//   catch   : ひとことの説明 / budget : 1人あたりの予算の目安
//   plan    : 行程（スタンプのない立ち寄り先も含めて、プランのとおりに書く）
//   spots   : 回る順のお店。クーポンのお店は { coupon: COUPONS の id }、予約できるお店は { shop: SHOPS の id }
//   idea    : プランを考えた人の、地域通貨を使った工夫のアイデア
//  ※ 期間・特典・クーポンはデモ用の仮のものです
// ════════════════════════════
const TOUR_RALLY = {
  title: '桑都めぐり 回遊クーポン',
  description: '高尾山からはじめて、お店で桑都ペイを使うたびに次のお店のクーポンが解放されます。',
  period: '2026年11月1日〜2027年1月31日',
};

// 高尾山エリアのお店で支払うと解放される、八王子駅周辺の回遊クーポン（COUPONS の id）
const TOUR_FROM_TAKAO = ['celeo-hachioji', 'tokyu-square', 'mainichi-sauna', 'yume-museum', 'takenoya', 'den'];

// 特典：スタンプが半分たまったら（half）と、全部たまったら（complete）残高に入る金額
const TOUR_REWARDS = { half: 200, complete: 500 };

const TOUR_COURSES = [
  {
    id: 'takao-fumoto',
    title: '高尾山ふもと満喫コース',
    target: '徒歩だけで回りたい人',
    catch: 'ケーブルカー以外は全部歩いて回れる、高尾山のふもとを1日楽しむコース。',
    budget: '6,080〜7,780円',
    plan: [
      { time: '午前', text: '高尾山ケーブルカーで山へ（往復980円）' },
      { time: '午前', text: '下山しながら薬王院に参拝、杉並木を散歩' },
      { time: '昼',   text: 'ふもとのそば屋でランチ（1,500〜2,000円）' },
      { time: '午後', text: '高尾599ミュージアムでお土産（1,500〜2,000円）' },
      { time: '午後', text: 'TAKAO COFFEEでカフェ（1,000〜1,500円）' },
      { time: '夕方', text: '温泉（入湯料1,100〜1,300円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'yakuoin' }, { shop: 'takahashiya' }, { coupon: 'takao599' }, { coupon: 'takao-coffee' }, { coupon: 'gokurakuyu' }],
    idea: '地域通貨でしか買えないお土産や体験を作る。そば屋めぐりのスタンプラリーで、また来てもらう。',
  },
  {
    id: 'ukai-otona',
    title: '高尾山とうかい鳥山 大人の日帰りコース',
    target: '大人・シニア',
    catch: '高尾山と歩きやすい武蔵陵墓地を散策して、夜は山あいの料亭でディナー。',
    budget: '約15,900円',
    plan: [
      { time: '午前', text: '高尾山へ。途中で高尾山さる園に寄る（ケーブルカー往復1,020円・さる園500円）' },
      { time: '昼',   text: '下山して高尾599ミュージアムの「599 CAFE」で軽食ランチ（約1,500円）' },
      { time: '午後', text: '高尾駅からバスで武蔵陵墓地へ。平らで歩きやすい参道を散策（移動 約780円）' },
      { time: '午後', text: '高尾駅近くのカフェで休憩（約1,000円）' },
      { time: '夕方', text: '高尾駅から無料の送迎バスで「うかい鳥山」のディナー（約10,000円）' },
      { time: '夜',   text: '京王高尾山温泉 極楽湯で湯に入って直帰（1,100円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'saruen' }, { coupon: 'takao599' }, { coupon: 'ukai-toriyama' }, { coupon: 'gokurakuyu' }],
    idea: '高尾山までの道や美術館・博物館に看板を立て、いろいろな場所に寄るほど地域通貨がたまるようにする。',
  },
  {
    id: 'ecotown',
    title: '高尾山とエコタウンお買い物コース',
    target: '若者・大人・ファミリー',
    catch: '午前は高尾山、午後は古着・レトログッズ・おもちゃまでそろう大型店で宝探し。',
    budget: '約13,000円',
    plan: [
      { time: '午前', text: '高尾山に登る（リフト500円・食事1,500円）' },
      { time: '午後', text: 'エコタウン八王子大和田店でたくさん買い物（5,000円）' },
      { time: '夜',   text: '八王子駅周辺で買い物と夕食（食事1,500円・買い物5,000円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'ecotown' }, { coupon: 'celeo-hachioji' }],
    idea: '八王子駅から徒歩25分・バス15分で行けて、半日楽しめる。若者は古着、大人はお酒やパソコン、ファミリーはおもちゃや自転車。',
  },
  {
    id: 'outlet-cafe',
    title: '高尾山とアウトレット おしゃれカフェコース',
    target: '若者',
    catch: '山でのんびり団子とそば、午後はアウトレットで服を買って、夜は駅のおしゃれなカフェへ。',
    budget: '約11,530円',
    plan: [
      { time: '午前', text: '高尾山へ（ケーブルカー往復980円）' },
      { time: '昼',   text: '休憩所でのんびり。団子（550円）とそば（1,000円）' },
      { time: '午後', text: '三井アウトレットパーク多摩南大沢で服を買う（5,000円〜）' },
      { time: '夜',   text: '八王子駅周辺のおしゃれなカフェ「66」で一杯（4,000円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'juichi-chaya' }, { coupon: 'outlet-minami' }, { coupon: 'cafe-66' }],
  },
  {
    id: 'farm-minamiosawa',
    title: '高尾山と牧場・南大沢コース',
    target: 'ファミリー',
    catch: '高尾山の1号路を歩いたあと、牧場でスイーツと乳しぼり体験。夜は南大沢で買い物と夕食。',
    budget: '約9,300〜12,800円（交通費1,300円をふくむ）',
    plan: [
      { time: '午前', text: '高尾山口駅に集合。ケーブルカーで1号路（表参道コース）へ（往復950円）' },
      { time: '午前', text: '高尾山さる園・野草園（500円）、薬王院に参拝（お守りなど500〜1,000円）。ケーブルカーで下山' },
      { time: '昼',   text: '高尾山Fumotoyaで石窯ピザやパスタ。利用客は足湯が無料（1,500〜2,500円）' },
      { time: '午後', text: '京王線で山田駅へ（160円）。磯沼ミルクファームでスイーツと乳しぼり体験（1,500〜2,000円）' },
      { time: '夕方', text: '南大沢駅へ（190円）。アウトレットなどで買い物' },
      { time: '夜',   text: '「にっぽん一周」で夕食（4,000〜5,500円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'saruen' }, { coupon: 'yakuoin' }, { coupon: 'fumotoya' }, { coupon: 'isonuma' }, { coupon: 'outlet-minami' }, { coupon: 'nippon-isshu' }],
  },
  {
    id: 'satoyama',
    title: '高尾山のあとは“都会の里山”癒しツアー',
    target: '平日に出かけられる人',
    season: '平日限定',
    catch: '高尾山のあとは、牧場カフェと桑都テラスでのんびり。お財布にやさしい平日の日帰りプラン。',
    budget: '約5,500〜7,000円',
    plan: [
      { time: '9:00',  text: '高尾山に登って薬王院に参拝、山頂で昼食（ケーブルカー往復 約1,000円・昼食 約1,500円）' },
      { time: '13:00', text: '高尾599ミュージアムを見学（無料）' },
      { time: '14:30', text: 'TOKYO FARM VILLAGE・磯沼ミルクファームでカフェ休憩（800〜1,200円）' },
      { time: '16:20', text: '桑都テラスで買い物・休憩（お土産1,000〜2,000円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'yakuoin' }, { coupon: 'takao599' }, { coupon: 'isonuma' }, { coupon: 'soto-terrace' }],
    idea: '地域清掃ウォーク：指定エリアでごみを拾うと、回収所で地域通貨のポイントがもらえる。',
  },
  {
    id: 'kiyotaki-onsen',
    title: '高尾山ふもとの食べ歩き＆温泉コース',
    target: 'シニア・移動を少なくしたい人',
    season: '春は高尾梅郷の梅まつりにも寄れます',
    catch: '移動が短く、高尾エリアだけで半日〜1日楽しめる。食べ歩きのあとは温泉とマッサージで。',
    budget: '約4,600〜8,100円（交通費なし）',
    plan: [
      { time: '午前', text: '高尾山（登山・観光）' },
      { time: '昼',   text: 'ケーブルカー清滝駅周辺の商店街で食べ歩き・お土産（500〜2,000円）' },
      { time: '午後', text: '徒歩約14分で京王高尾山温泉 極楽湯へ。温泉（1,100円）・食事（1,000〜3,000円）・マッサージ（20分 約2,000円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { coupon: 'kiyotaki' }, { coupon: 'gokurakuyu' }],
  },
  {
    id: 'photo-hachioji',
    title: '高尾山から八王子駅 写真映えコース',
    target: '若者',
    catch: '高尾山の山頂から駅前のカフェ・商店街まで、写真映えするスポットをめぐって温泉で締める。',
    budget: '約8,700〜9,700円',
    plan: [
      { time: '9:00',  text: '高尾山に登る（ケーブルカー往復980円）' },
      { time: '11:30', text: '高尾山でとろろそばの昼食（1,500円）' },
      { time: '12:30', text: '八王子駅へ移動（約450円）' },
      { time: '13:00', text: 'AINA CAFEで写真を撮る（1,000〜2,000円）' },
      { time: '14:00', text: 'セレオ八王子・八王子OPA・ユーロードなどで買い物（3,000円）' },
      { time: '15:30', text: 'Dia.Coffeeでスイーツ（700円）' },
      { time: '17:00', text: '竜泉寺の湯 八王子みなみ野店で温泉・岩盤浴（1,100円）' },
    ],
    spots: [{ coupon: 'takao-ropeway' }, { shop: 'takahashiya' }, { coupon: 'aina-cafe' }, { coupon: 'celeo-hachioji' }, { coupon: 'dia-coffee' }, { coupon: 'ryusenji' }],
    idea: '高尾山の山頂・商店街・ユーロード・カフェで写真を撮るフォトラリー。クリアすると八王子市内だけで使える地域通貨を配る。',
  },
];

// ════════════════════════════
//  公共料金・税金の引き落とし
//  登録しておくと、引き落とし日に桑都ペイの残高から自動で引き落とされる
//  BILL_TYPES : 種類（アイコンと名前）
//  DEMO_BILLS : 登録できる公共料金と、次の請求（デモ用）
//   id      : 重ならない英数字（登録・引き落としの保存に使う）
//   type    : BILL_TYPES の id / issuer : 請求元 / title : 内容
//   amount  : 次の請求の金額（円） / dueInDays : 登録した日から何日後に引き落とすか
//  ※ 請求元・金額はデモ用の架空のものです
// ════════════════════════════
const BILL_TYPES = {
  water:    { label: '水道',   icon: '<path d="M12 2.7S6 9.4 6 14a6 6 0 0 0 12 0c0-4.6-6-11.3-6-11.3z"/>' },
  electric: { label: '電気',   icon: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>' },
  gas:      { label: 'ガス',   icon: '<path d="M12 22c4 0 7-3 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-3 3-5 5-5 8 0 4 3 7 7 7z"/>' },
  tax:      { label: '税金',   icon: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>' },
};

const DEMO_BILLS = [
  { id: 'water-2610',  type: 'water',    issuer: '水道局',   title: '水道・下水道料金（9・10月分）',     amount: 5280,  dueInDays: 12 },
  { id: 'tax-jumin-3', type: 'tax',      issuer: '八王子市', title: '市・都民税（普通徴収） 第3期',     amount: 12400, dueInDays: 25 },
  { id: 'tax-nhi-6',   type: 'tax',      issuer: '八王子市', title: '国民健康保険税 第6期',            amount: 8600,  dueInDays: 25 },
  { id: 'elec-2610',   type: 'electric', issuer: '電力会社', title: '電気料金（10月分）',              amount: 6730,  dueInDays: 18 },
  { id: 'gas-2610',    type: 'gas',      issuer: 'ガス会社', title: 'ガス料金（10月分）',              amount: 4120,  dueInDays: 20 },
];

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
  { daysAgo: 6, time: '11:40', type: 'payment', shop: '高尾山ケーブルカー・リフト', amount: 950 },
  { daysAgo: 6, time: '12:35', type: 'payment', shop: '高尾山 髙橋家', amount: 1300 },
  { daysAgo: 6, time: '16:05', type: 'payment', shop: '竹の家', amount: 850, discount: 100 },
  { daysAgo: 5, time: '20:15', type: 'reserve', shop: '京王プラザホテル八王子', stayIn: 3, nights: 1, people: 2, points: 500 },
  { daysAgo: 4, time: '09:30', type: 'charge',  amount: 3000 },
  { daysAgo: 4, time: '13:20', type: 'payment', shop: '純喫茶 田園', amount: 980, discount: 100 },
  { daysAgo: 3, time: '19:02', type: 'reserve', shop: '多摩織 手織り体験', stayIn: 9, time2: '10:00', people: 2, points: 600 },
  { daysAgo: 1, time: '18:45', type: 'payment', shop: 'セレオ八王子', amount: 3400, discount: 300 },
  { daysAgo: 0, time: '08:50', type: 'charge',  amount: 3000 },
];