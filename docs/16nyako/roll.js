// 結果画面と詳細の小窓のにゃこモビーのごろごろ（にゃっコレアプリの素材。横4×縦2の8コマ）
// 立ち姿の絵に大きさと位置を合わせる値：[拡大率, 横のずらし%, 縦のずらし%]
const ROLL_FIT = {
    "ragdoll": [1.15, -0.09, -1.42],
    "persian": [1.13, -0.14, -0.82],
    "maine-coon": [1.12, -0.06, -0.44],
    "mike-neko": [1.11, -0.08, -0.2],
    "scottish-fold": [1.26, -0.15, -5.78],
    "russian-blue": [1.11, -0.19, -0.09],
    "munchkin": [1.12, -0.09, -0.51],
    "bombay": [1.12, -0.14, -0.38],
    "norwegian-forest": [1.12, -0.14, -0.38],
    "turkish-angora": [1.11, -0.09, -0.03],
    "pixie-bob": [1.03, 0.01, 2.83],
    "somali": [1.12, -0.17, -0.32],
    "siberian": [1.13, -0.13, -0.82],
    "nebelung": [1.08, 0.03, 1.35],
    "turkish-van": [1.12, -0.15, -0.38],
    "bengal": [1.12, -0.25, -0.38]
};
// アプリと同じく 0→7→1 と往復する14コマで1回
const ROLL_CYCLE = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
const ROLL_STEP_MS = 300, ROLL_DELAY_MS = 1000;

// 表示の1秒後に1回再生し、そのあとはタップするたびに最初から再生する
function setupRoll(stage) {
    const sheet = stage.querySelector(".cat-roll"), img = new Image();
    img.src = sheet.dataset.src;
    const ready = img.decode();
    let timer = 0, auto = 0;
    const stop = () => { clearInterval(timer); stage.classList.remove("rolling"); };
    const play = () => {
        clearTimeout(auto);
        ready.then(() => {
            if (!stage.isConnected) return;
            let i = 0;
            const show = () => { const p = ROLL_CYCLE[i]; sheet.style.backgroundPosition = `${(p % 4) / 3 * 100}% ${Math.floor(p / 4) * 100}%`; };
            clearInterval(timer);
            show();
            stage.classList.add("rolling");
            timer = setInterval(() => { if (!stage.isConnected || ++i >= ROLL_CYCLE.length) stop(); else show(); }, ROLL_STEP_MS);
        }).catch(() => { });
    };
    auto = setTimeout(play, ROLL_DELAY_MS);
    stage.onclick = play;
    stage.nextElementSibling.onclick = play; // 吹き出し
}

// cls：結果画面は丸い枠つきの "cat-stage"、詳細の小窓は枠なしの "modal-cat"
function rollStage(c, cls = "cat-stage") {
    const id = c.img.split("/").pop().replace(".webp", ""), [s, x, y] = ROLL_FIT[id], src = `img/roll/${id}.webp`;
    return `<div class="roll-wrap"><button type="button" class="${cls}" aria-label="${c.breed}。タップするとごろごろします"><span class="cat-pose"><img src="${c.img}" alt="">
        <i class="cat-roll" data-src="${src}" style="background-image:url('${src}');transform:translate(${x}%,${y}%) scale(${s})"></i></span></button><span class="tap-hint" aria-hidden="true">タップして<br>みてね</span></div>`;
}
