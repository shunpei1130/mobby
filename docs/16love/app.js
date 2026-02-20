async function submitLead(p) { try { const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "送信に失敗しました"); return d } catch (e) { console.error("[Love] Error:", e); throw e } }
async function submitDiagnosis(p) { try { const r = await fetch("/api/diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "保存に失敗しました"); return d } catch (e) { console.error("[Love] Error:", e); throw e } }

const AXES = {
    A: { key: "A", name: "恋愛メンヘラ度", left: "余裕女子", right: "一途暴走", leftCode: "あ", rightCode: "ゆ" },
    B: { key: "B", name: "恋の依存度", left: "マイペース", right: "彼氏ガチ勢", leftCode: "じ", rightCode: "つ" },
    C: { key: "C", name: "恋のアピール度", left: "隠す派", right: "匂わせ全開", leftCode: "す", rightCode: "も" },
    D: { key: "D", name: "失恋回復力", left: "即切り替え", right: "元カレ沼", leftCode: "ふ", rightCode: "ひ" }
};

const MENHERA_LEVELS = [
    { level: 1, name: "メンタル鉄壁", desc: "恋してもメンタルが崩れない最強勢。メンヘラ製造機の才能すらある。" },
    { level: 2, name: "余裕ぶっこき", desc: "好きな人ができても冷静。既読スルーも「まぁいっか」で流せる。" },
    { level: 3, name: "メンヘラの芽🌱", desc: "恋すると情緒がちょっと揺れ始める。メンヘラの芽が生えてきた段階。" },
    { level: 4, name: "情緒ゆらぎ期", desc: "好きな人のことは気になるし、既読は確認しちゃう。でもまだ日常は回せる。" },
    { level: 5, name: "メンヘラ発動中", desc: "恋愛脳が暴走開始。既読チェック、SNS監視、深夜テンションの長文LINE…。" },
    { level: 6, name: "情緒ジェットコースター", desc: "感情の浮き沈みが激しすぎて自分でも追いつけない。今日も情緒終わり。" },
    { level: 7, name: "恋愛ゾンビ", desc: "何度沈んでもゾンビのように這い上がる不死身のメンヘラ。生きてるだけで偉い。" }
];

const QUESTIONS = [
    { id: "A1", axis: "A", text: "好きな人からの返信が遅くても、自分の生活は普通に送れる。", reverse: false },
    { id: "A2", axis: "A", text: "彼氏や好きな人と喧嘩しても、しばらくすれば気持ちが落ち着く。", reverse: false },
    { id: "A3", axis: "A", text: "「嫌われたかも」と思っても、自分を責めすぎずに切り替えられる。", reverse: false },
    { id: "A4", axis: "A", text: "好きな人のSNSの更新を見ても、気分が大きくブレることは少ない。", reverse: false },
    { id: "A5", axis: "A", text: "恋愛で不安になっても、友達や趣味で気持ちを整理できる。", reverse: false },
    { id: "A6", axis: "A", text: "好きな人の何気ない一言で、一日中モヤモヤしてしまうことがある。", reverse: true },
    { id: "A7", axis: "A", text: "「もう連絡こないかも」と思うと、頭の中がそのことでいっぱいになる。", reverse: true },
    { id: "A8", axis: "A", text: "恋愛がうまくいかないと「自分に魅力がないからだ」と思ってしまう。", reverse: true },
    { id: "A9", axis: "A", text: "夜になると好きな人のことを考えすぎて、眠れなくなることがある。", reverse: true },
    { id: "A10", axis: "A", text: "些細なLINEの文面の変化で「冷められた？」と不安になりやすい。", reverse: true },
    { id: "B1", axis: "B", text: "好きな人と1日連絡を取らなくても、特に気にならない。", reverse: false },
    { id: "B2", axis: "B", text: "相手が友達と遊んでいても、焼きもちを焼かずにいられる。", reverse: false },
    { id: "B3", axis: "B", text: "既読スルーされても、追いLINEは基本しない。", reverse: false },
    { id: "B4", axis: "B", text: "好きな人の行動や交友関係を、細かく把握しなくても平気。", reverse: false },
    { id: "B5", axis: "B", text: "恋人がいなくても、自分の時間を充実させられる。", reverse: false },
    { id: "B6", axis: "B", text: "好きな人の既読がつかないと、何度もLINEを開いてしまう。", reverse: true },
    { id: "B7", axis: "B", text: "彼氏・好きな人と連絡が取れない時間が長いと、ソワソワする。", reverse: true },
    { id: "B8", axis: "B", text: "好きな人が他の異性と仲良くしていると、心がざわつく。", reverse: true },
    { id: "B9", axis: "B", text: "不安になると「今何してる？」と確認LINEを送りたくなる。", reverse: true },
    { id: "B10", axis: "B", text: "好きな人のリアクションひとつで、その日の気分が決まる。", reverse: true },
    { id: "C1", axis: "C", text: "恋愛のことは、SNSにはあまり書かないタイプ。", reverse: false },
    { id: "C2", axis: "C", text: "好きな人とのデートや出来事を、わざわざストーリーに上げない。", reverse: false },
    { id: "C3", axis: "C", text: "恋愛の悩みは、SNSより自分の中で整理する派。", reverse: false },
    { id: "C4", axis: "C", text: "恋愛で病んでも、意味深な投稿はしないようにしている。", reverse: false },
    { id: "C5", axis: "C", text: "「心配してほしい」「気づいてほしい」目的の投稿はしない。", reverse: false },
    { id: "C6", axis: "C", text: "恋愛で落ち込むと、気持ちをSNSに書きたくなる。", reverse: true },
    { id: "C7", axis: "C", text: "好きな人と会った日は、匂わせストーリーを上げたくなる。", reverse: true },
    { id: "C8", axis: "C", text: "意味深な歌詞や名言を引用して、今の気持ちを匂わせたくなる。", reverse: true },
    { id: "C9", axis: "C", text: "投稿にいいねやDMがくると、気持ちが満たされる。", reverse: true },
    { id: "C10", axis: "C", text: "恋愛のしんどさを誰かに知ってほしい気持ちがある。", reverse: true },
    { id: "D1", axis: "D", text: "失恋しても、一晩泣いたら次の日にはだいぶ回復できる。", reverse: false },
    { id: "D2", axis: "D", text: "振られた時の立ち直り方を、自分なりに持っている。", reverse: false },
    { id: "D3", axis: "D", text: "元カレのことは、時間が経てば自然と忘れられる方だ。", reverse: false },
    { id: "D4", axis: "D", text: "恋愛がうまくいかなくても、仕事や学校はちゃんとできる。", reverse: false },
    { id: "D5", axis: "D", text: "「次の恋に行こう」と切り替えるのは早い方だと思う。", reverse: false },
    { id: "D6", axis: "D", text: "失恋すると、何週間も引きずってしまう。", reverse: true },
    { id: "D7", axis: "D", text: "元カレとの思い出を何度も思い返して、なかなか前に進めない。", reverse: true },
    { id: "D8", axis: "D", text: "恋愛で落ち込むと、友達との約束もドタキャンしがち。", reverse: true },
    { id: "D9", axis: "D", text: "誰かに「大丈夫だよ」と言ってもらえないと、なかなか立ち直れない。", reverse: true },
    { id: "D10", axis: "D", text: "別れた後も、元カレのSNSをチェックしてしまう。", reverse: true }
];
