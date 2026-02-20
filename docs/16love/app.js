async function submitLead(p) { try { const r = await fetch("/api/lead", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "送信に失敗しました"); return d } catch (e) { console.error("[Love] Error:", e); throw e } }
async function submitDiagnosis(p) { try { const r = await fetch("/api/diagnosis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) }); const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(d?.error || "保存に失敗しました"); return d } catch (e) { console.error("[Love] Error:", e); throw e } }

const AXES = {
    A: { key: "A", name: "メンヘラ度", left: "超安定", right: "泣きがち", leftCode: "あ", rightCode: "ゆ" },
    B: { key: "B", name: "依存度", left: "自立", right: "つながり", leftCode: "じ", rightCode: "つ" },
    C: { key: "C", name: "自己演出度", left: "素", right: "盛る", leftCode: "す", rightCode: "も" },
    D: { key: "D", name: "回復力", left: "即復活", right: "引きずる", leftCode: "ふ", rightCode: "ひ" }
};

const MENHERA_LEVELS = [
    { level: 1, name: "超安定", desc: "波はあっても崩れにくい。自己否定が長引きにくい。" },
    { level: 2, name: "安定寄り", desc: "基本は落ち着いているが、疲れや状況で不安が増えることはある。" },
    { level: 3, name: "ゆらぎあり", desc: "刺激や対人で気分が揺れる。回復の仕方があると強い。" },
    { level: 4, name: "波ふつう", desc: "揺れる日もあるが、工夫すれば整えられる範囲。" },
    { level: 5, name: "波大きめ", desc: "一喜一憂が増えやすい。睡眠・連絡・SNSがトリガーになりやすい。" },
    { level: 6, name: "かなり揺れる", desc: "自己否定や不安が強まりやすい。休息と相談の優先度を上げたい。" },
    { level: 7, name: "泣きがち", desc: "しんどさが継続しやすい。抱え込みやすいので、支えを増やしたい状態。" }
];

const QUESTIONS = [
    { id: "A1", axis: "A", text: "気分の波があっても、大きく崩れずに過ごせる。", reverse: false },
    { id: "A2", axis: "A", text: "不安になっても、時間が経つと自然に薄れていくことが多い。", reverse: false },
    { id: "A3", axis: "A", text: "自分を責め始めても、途中で切り替えられる。", reverse: false },
    { id: "A4", axis: "A", text: "相手の反応が薄い日でも、自分の生活は保てる。", reverse: false },
    { id: "A5", axis: "A", text: "感情を言葉にすると、だいたい整理できる。", reverse: false },
    { id: "A6", axis: "A", text: "些細な一言や出来事で、気分が急に落ちることがある。", reverse: true },
    { id: "A7", axis: "A", text: "不安が強いと、頭の中がそのことでいっぱいになりやすい。", reverse: true },
    { id: "A8", axis: "A", text: "「自分が悪い」と結論づけてしまうことが多い。", reverse: true },
    { id: "A9", axis: "A", text: "夜になると考えが止まらず、気持ちが沈みやすい。", reverse: true },
    { id: "A10", axis: "A", text: "泣いたり落ち込んだりが、短期間に何度も起こりやすい。", reverse: true },
    { id: "B1", axis: "B", text: "連絡が少ない日があっても、あまり不安にならない。", reverse: false },
    { id: "B2", axis: "B", text: "相手の都合があると理解して、待てる方だ。", reverse: false },
    { id: "B3", axis: "B", text: "返信が遅くても、追い連絡は基本しない。", reverse: false },
    { id: "B4", axis: "B", text: "相手の行動を細かく把握しなくても落ち着いていられる。", reverse: false },
    { id: "B5", axis: "B", text: "会えない期間があっても、自分の予定や生活は回せる。", reverse: false },
    { id: "B6", axis: "B", text: "返事が来ないと、不安で何度もスマホを確認してしまう。", reverse: true },
    { id: "B7", axis: "B", text: "つながっていない時間が長いと、落ち着かなくなりやすい。", reverse: true },
    { id: "B8", axis: "B", text: "相手の気持ちが離れたかも、と思うと耐えづらい。", reverse: true },
    { id: "B9", axis: "B", text: "安心したくて、連絡の頻度を増やしたくなることがある。", reverse: true },
    { id: "B10", axis: "B", text: "相手の反応ひとつで、気分が大きく左右されやすい。", reverse: true },
    { id: "C1", axis: "C", text: "しんどい時ほど、SNSから距離を置くことが多い。", reverse: false },
    { id: "C2", axis: "C", text: "落ち込んでいることを、わざわざ外に出さなくてもいいと思う。", reverse: false },
    { id: "C3", axis: "C", text: "気持ちの整理は、投稿よりも自分の中で行うことが多い。", reverse: false },
    { id: "C4", axis: "C", text: "SNSでは、感情を強い言葉にして書かないようにしている。", reverse: false },
    { id: "C5", axis: "C", text: "「心配してほしい」目的で投稿することは、あまりない。", reverse: false },
    { id: "C6", axis: "C", text: "落ち込むと、SNSに気持ちを書きたくなる。", reverse: true },
    { id: "C7", axis: "C", text: "感情が強い時ほど、言葉も強め（重め）になりやすい。", reverse: true },
    { id: "C8", axis: "C", text: "意味深な投稿やストーリーで、状況を匂わせたくなることがある。", reverse: true },
    { id: "C9", axis: "C", text: "反応（既読感・いいね等）があると、気持ちが落ち着きやすい。", reverse: true },
    { id: "C10", axis: "C", text: "つらさを見える形にして共有する方が楽になる。", reverse: true },
    { id: "D1", axis: "D", text: "落ち込んでも、一晩寝るとかなり戻ることが多い。", reverse: false },
    { id: "D2", axis: "D", text: "気分が沈んだ時の戻し方をいくつか持っている。", reverse: false },
    { id: "D3", axis: "D", text: "励ましがなくても、時間が経てば回復できる方だ。", reverse: false },
    { id: "D4", axis: "D", text: "落ち込んでも、最低限の日常（仕事/学校/家事）は回せる。", reverse: false },
    { id: "D5", axis: "D", text: "切り替えは早い方だと思う。", reverse: false },
    { id: "D6", axis: "D", text: "一度落ちると、数日以上ずっと引きずりやすい。", reverse: true },
    { id: "D7", axis: "D", text: "同じことを何度も思い返して、気分が戻りにくい。", reverse: true },
    { id: "D8", axis: "D", text: "気分が沈むと、予定や連絡を止めてしまいやすい。", reverse: true },
    { id: "D9", axis: "D", text: "周りの反応が薄いと、回復が遅くなりやすい。", reverse: true },
    { id: "D10", axis: "D", text: "落ち込みの後、元の自分に戻るまで時間がかかる。", reverse: true }
];
