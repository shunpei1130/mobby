// にゃん恋診断：甘えんぼ度レベル・相性・今日のにゃん恋ごよみ

// ---- 甘えんぼ度（距離感＋愛情表現の左寄り度で決まる）----
const NYAN_LEVELS = [
    { level: 1, name: "孤高のノラ猫", desc: "恋しても自分の世界を崩さない。甘えるより、そっと見守る派。" },
    { level: 2, name: "ツンツン警戒猫", desc: "好きでもすぐには近づかない。心を開くまでの道のりが長い。" },
    { level: 3, name: "気まぐれ猫", desc: "甘えたい日と放っておいてほしい日が交互に来る、読めない人。" },
    { level: 4, name: "ほどよい距離の猫", desc: "べったりでも放任でもない、ちょうどいい距離感の持ち主。" },
    { level: 5, name: "甘え上手な猫", desc: "必要なときにちゃんと甘えられる、愛され上手。" },
    { level: 6, name: "ごろにゃん猫", desc: "好きな人のそばでごろごろ。素直な甘えが日常になっている。" },
    { level: 7, name: "ゴロゴロ全開の甘えんぼ猫", desc: "好きな人には全力で甘える。ひざの上が定位置。" }
];
function nyanLevel(leftPct) {
    const score = (leftPct.A + leftPct.B) / 2;
    const level = 1 + Math.min(6, Math.floor(score / (100 / 7)));
    return { score: Math.round(score), ...NYAN_LEVELS[level - 1] };
}

// ---- 相性 ----
// 軸ごとの組み合わせ：pts(1〜3)、よいところ・注意・コツ
const COMPAT_AXIS = {
    A: {
        LL: { pts: 3, good: "ふたりとも寄り添いたい派。会う頻度も連絡のペースもぴったり合う。", caution: "べったりしすぎて、ふたりだけの世界になりがち。", tip: "たまには別々の予定も入れて、会ったときの話題を増やそう。" },
        RR: { pts: 2, good: "お互いのひとり時間を尊重できる、ゆるやかな関係。", caution: "連絡が途切れて、気づけば疎遠になることも。", tip: "月に1回は「会う日」を先に決めておこう。" },
        LR: { pts: 1, good: "寄り添いたい側と、自由な側。お互いにないものを持っている。", caution: "「もっと一緒にいたい」と「少し一人になりたい」がすれ違いやすい。", tip: "会えない日の連絡ルールを、先に話し合っておこう。" }
    },
    B: {
        LL: { pts: 3, good: "好きの気持ちを素直に伝え合える。言葉で安心できる関係。", caution: "素直すぎて、感情のぶつけ合いになることも。", tip: "怒ったときこそ、一呼吸おいてから伝えよう。" },
        LR: { pts: 3, good: "素直な側の「好き」が、ツン側の本音を引き出す。ギャップに惹かれ合う。", caution: "ツンの照れ隠しを、素直な側が本気に受け取って傷つくことも。", tip: "ツン側は時々ストレートな「ありがとう」を。素直側は照れ隠しを深追いしない。" },
        RR: { pts: 1, good: "照れ屋同士、言葉にしなくても通じ合える瞬間がある。", caution: "どちらも本音を言えず、気持ちがすれ違いやすい。", tip: "メッセージやメモで、「好き」を文字にして届けてみよう。" }
    },
    C: {
        LL: { pts: 2, good: "ゆっくり信頼を積み上げる、安定した関係。", caution: "どちらも動き出しが遅くて、進展に時間がかかる。", tip: "どちらかが「今度、行こう」と具体的に誘ってみよう。" },
        RR: { pts: 2, good: "勢いと楽しさで盛り上がる、にぎやかな関係。", caution: "盛り上がりすぎて、熱が冷めるのも早いかも。", tip: "ときめきだけでなく、日常の穏やかな時間も大切に。" },
        LR: { pts: 3, good: "直感派が引っ張り、慎重派が支える。ちょうどいいバランス。", caution: "ペースの違いで、「急かされてる」「遅い」と感じることも。", tip: "進むスピードは、慎重派に合わせて少し緩めよう。" }
    },
    D: {
        LL: { pts: 3, good: "どっしり構えた安心感のある関係。ケンカも長引かない。", caution: "穏やかすぎて、刺激が少ないと感じることも。", tip: "たまにはサプライズや、いつもと違うデートを。" },
        LR: { pts: 3, good: "やきもち側の不安を、おおらか側がやさしく受け止められる。", caution: "おおらか側の「気にしすぎ」の一言が、やきもち側を傷つけやすい。", tip: "やきもちを言われたら、まず「そうだったんだね」と受け止めよう。" },
        RR: { pts: 1, good: "お互いを特別に想う気持ちが強い。", caution: "やきもち同士で、不安をあおり合いやすい。", tip: "不安になったら、問い詰める前に「会いたい」を伝えよう。" }
    }
};
const COMPAT_LABELS = {
    5: { stars: 5, label: "ゴロゴロ運命相性", desc: "一緒にいるだけで、自然と心がほぐれる最高の組み合わせ。" },
    4: { stars: 4, label: "ぴったり相性", desc: "お互いの良さを引き出しやすい、居心地のいい関係。" },
    3: { stars: 3, label: "じわじわ育つ相性", desc: "最初は少しズレても、時間をかけるほど深まる関係。" },
    2: { stars: 2, label: "ちょっと遠回りな相性", desc: "違いが多いぶん、気づきも多い。コツをつかめば仲良し。" },
    1: { stars: 1, label: "試練の相性", desc: "ぶつかりやすいけれど、乗り越えたら誰より強い絆に。" }
};
function sideOf(code, axisKey) {
    const idx = "ABCD".indexOf(axisKey);
    return code[idx] === AXES[axisKey].leftCode ? "L" : "R";
}
function compat(codeA, codeB) {
    const axes = ["A", "B", "C", "D"].map(k => {
        const a = sideOf(codeA, k), b = sideOf(codeB, k);
        const key = a === b ? a + b : "LR";
        return { key: k, ...COMPAT_AXIS[k][key] };
    });
    const total = axes.reduce((s, a) => s + a.pts, 0); // 5〜12
    const stars = total >= 11 ? 5 : total >= 10 ? 4 : total >= 8 ? 3 : total >= 6 ? 2 : 1;
    // 同点の並びは組み合わせごとにずらして、特定の軸の文に偏らないようにする（左右を入れ替えても同じ結果）
    const shift = Math.floor(hashSeed([codeA, codeB].sort().join(":"))() * axes.length);
    const order = axes.map((_, i) => axes[(i + shift) % axes.length]);
    // 惹かれ合うところ：2点以上の軸から高い順に2つまで
    const bests = order.filter(a => a.pts >= 2).sort((x, y) => y.pts - x.pts).slice(0, 2);
    // すれ違いやすいところ：残りの軸のうち、いちばん低い点のものをすべて
    const rest = order.filter(a => !bests.includes(a));
    const low = Math.min(...rest.map(a => a.pts));
    const cautions = rest.filter(a => a.pts === low);
    return { total, ...COMPAT_LABELS[stars], axes, bests, cautions };
}
function compatRanking(code) {
    return Object.keys(CHARACTERS).map(c => ({ code: c, ...compat(code, c) }))
        .sort((a, b) => b.total - a.total || (a.code === code ? -1 : 0));
}
function starsText(n) { return "★".repeat(n) + "☆".repeat(5 - n); }

// ---- 今日のにゃん恋ごよみ ----
// type: そのタイプコードの文字を持つタイプにだけ出す ／ when: その日の運勢（1〜5）が合うときだけ出す
// 条件のない文を必ず残して、候補が空にならないようにする
const FORTUNE_MESSAGES = [
    { text: "今日は、いつもより少しだけ素直になれる日。思ったことを一言だけ口にしてみて。", type: "つ", when: f => f.overall >= 3 },
    { text: "返事を待つ時間は、自分を甘やかす時間に。好きなおやつを用意しよう。", when: f => f.line <= 3 },
    { text: "ふとした瞬間の「ありがとう」が、相手の心をやわらかくしそう。" },
    { text: "今日は直感を信じて。気になる人に、ひと声かけてみるといい流れが。", when: f => f.love >= 4 },
    { text: "がんばりすぎ注意。肩の力を抜くほど、魅力が増す日。", when: f => f.overall <= 3 },
    { text: "小さなやきもちは、かわいさのスパイス。重く考えすぎないで。", type: "や" },
    { text: "相手の話を最後まで聞くと、思わぬ本音が聞けるかも。" },
    { text: "ひとり時間がいい充電に。夜は好きな音楽でゆったりしよう。", when: f => f.outing <= 3 },
    { text: "ちょっとした変化に気づいてもらえる日。髪型や小物で遊んでみて。", when: f => f.love >= 3 },
    { text: "今日は「会いたい」を我慢しないで。軽く誘うくらいがちょうどいい。", when: f => f.love >= 3 },
    { text: "過去の失敗は、猫のしっぽのようにふわっと流して。", when: f => f.overall <= 3 },
    { text: "連絡のタイミングは夕方がチャンス。", when: f => f.line >= 4 },
    { text: "うまく言葉にならない気持ちは、スタンプや写真で伝えてみて。", when: f => f.line >= 3 },
    { text: "褒め言葉を素直に受け取ると、恋の流れがよくなる日。", when: f => f.love >= 3 },
    { text: "約束やルールは先に決めておくと、安心感が高まる。" },
    { text: "今日は、あえて追わない勇気が魅力になりそう。", when: f => f.love <= 3 },
    { text: "いつもと違う場所に行くと、新しい出会いや気づきが。", when: f => f.outing >= 4 },
    { text: "好きな人の好きなものを、ひとつ覚えて帰ろう。" },
    { text: "あなたの「ゴロゴロ」が、周りを自然と癒やす日。", when: f => f.overall >= 4 },
    { text: "ケンカしそうなときは、深呼吸と温かい飲み物を。", when: f => f.overall <= 3 },
    { text: "そばにいたい気持ちは、「少しだけ一緒にいたい」と言葉にすると伝わりやすい日。", type: "ぴ" },
    { text: "ひとりの時間も大切に。満たされたあとのひと言が、やさしく届きそう。", type: "き" },
    { text: "あなたの素直な「うれしい」が、いつも以上にまっすぐ届く日。", type: "す", when: f => f.overall >= 3 },
    { text: "急がなくて大丈夫。よく見てから動くあなたの慎重さが、味方になる日。", type: "し" },
    { text: "ひらめいたら、動く前にひと呼吸。そのひと手間で、直感がもっと冴えそう。", type: "ち" },
    { text: "どんと構えるあなたの安心感に、誰かがほっとする日。", type: "お" }
];
const fortuneFits = (m, code, f) => (!m.type || code.includes(m.type)) && (!m.when || m.when(f));
const FORTUNE_MISSIONS = [
    "好きな人に「おはよう」を送る", "好きな人のいいところをひとつ見つけて伝える", "スマホを置いて、10分だけ目の前の人に集中する",
    "「ありがとう」を、いつもより1回多く言う", "気になる人のSNSに、いいねを1つ", "今日あった小さな嬉しいことを、誰かに話す",
    "鏡の前で、にっこり笑う練習をする", "夜は早めに布団に入る", "いつもと違う道で帰ってみる",
    "好きな人の名前を、心の中でやさしく呼んでみる", "苦手なことを、ひとつだけ頑張らない", "手帳に今日の気持ちを一行だけ書く",
    "あたたかい飲み物を、ゆっくり飲む", "自分のいいところを、3つ思い浮かべる", "「会いたいな」と、素直に思ってみる", "連絡の返事は、一呼吸おいてから送る"
];
const FORTUNE_ITEMS = [
    "あたたかい飲み物", "ふわふわのタオル", "お気に入りのイヤホン", "肉球マークのもの", "小さな花", "手帳とペン", "リップクリーム", "ハンカチ",
    "ミニぬいぐるみ", "ハート型のもの", "ブランケット", "いつもと違う香り", "クッキー", "ヘアゴム", "鈴のアクセサリー", "お気に入りのマグカップ"
];
const FORTUNE_COLORS = ["さくらピンク", "クリームイエロー", "ミルクティーブラウン", "ミントグリーン", "ラベンダー", "スカイブルー", "コーラルオレンジ", "ミルクホワイト", "ベビーピンク", "レモンイエロー", "モカ", "ラベンダーグレー"];
const FORTUNE_SPOTS = ["近所のカフェ", "公園のベンチ", "本屋さん", "窓際の席", "駅前の広場", "帰り道の遠回り", "お気に入りの雑貨屋", "川沿いの散歩道", "おうちのソファ", "図書館"];

function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return () => { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
function dateKey(d = new Date()) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function dailyFortune(code, d = new Date()) {
    const key = dateKey(d), rnd = hashSeed(`${key}:${code}`);
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const score = () => 1 + Math.floor(rnd() * 5);
    const rank = compatRanking(code).filter(r => r.code !== code && r.stars >= 4);
    const keyperson = rank.length ? rank[Math.floor(rnd() * rank.length)].code : Object.keys(CHARACTERS)[0];
    const love = score(), line = score(), outing = score();
    const scores = { overall: Math.round((love + line + outing) / 3), love, line, outing };
    return {
        key, ...scores,
        message: pick(FORTUNE_MESSAGES.filter(m => fortuneFits(m, code, scores))).text, mission: pick(FORTUNE_MISSIONS),
        item: pick(FORTUNE_ITEMS), color: pick(FORTUNE_COLORS), spot: pick(FORTUNE_SPOTS), keyperson
    };
}
function hearts(n) { return "♥".repeat(n) + "♡".repeat(5 - n); }
