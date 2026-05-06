const STORAGE_KEY = "mobby_16ml_love_diag_v1";
const PAGE_SIZE = 3;
const LISTEN_LINKS = {
    instagram: "https://www.instagram.com/",
    tiktok: "https://www.tiktok.com/"
};

const ANSWER_LABELS = {
    1: "とても当てはまる",
    2: "当てはまる",
    3: "どちらでもない",
    4: "あまり当てはまらない",
    5: "全く当てはまらない"
};

const TYPES = {
    omamori: {
        name: "本命お守りモビー",
        image: "本命お守りモビー.jpg",
        catch: "ちゃんと大事にされる恋を、見守ってるよ",
        role: "自信回復",
        message: "あなたの恋は、急がなくても大丈夫。相手に合わせすぎるより、自分のペースを守るほど、ちゃんと向き合いたい人としての魅力が戻ってきます。",
        word: "追いかけすぎなくて大丈夫。大事にされる恋は、あなたが自分を大事にするところから始まるよ。",
        next: "返信を待つ時間を、少しだけ自分のために使ってみて。温かい飲み物を入れる、短い日記を書く、それだけでも恋に飲まれにくくなります。",
        music: "静かに自信を戻してくれるカバー",
        musicCopy: "このモビーが見守るあなたに、今聴いてほしい一曲。"
    },
    yoin: {
        name: "沼らせ余韻モビー",
        image: "沼らせ余韻モビ―.jpg",
        catch: "気づいたら思い出される恋、してるかも",
        role: "余韻",
        message: "あなたは、言葉より余韻で残るタイプ。全部を説明しなくても、ふとした表情や沈黙の温度が、相手の記憶に残っているかもしれません。",
        word: "無理に明るく振る舞わなくてもいい。静かなまま残る魅力も、ちゃんとあります。",
        next: "伝えたいことを全部送る前に、一番素直な一文だけを残してみて。余白が、あなたらしさになることがあります。",
        music: "余韻が残る切ないカバー",
        musicCopy: "眠る前、言葉にならない気持ちをそのまま置いておきたい夜に。"
    },
    kidoku: {
        name: "既読待ちそわそわモビー",
        image: "既読待ちそわそわモビー.jpg",
        catch: "返信ひとつで揺れる夜も、そばにいるよ",
        role: "冷静さ",
        message: "返事が遅いだけで、あなたの価値が下がるわけじゃない。待っている時間に不安が膨らみやすいだけで、あなたの恋が間違っているわけでもありません。",
        word: "スマホを見る回数を少し減らして、今夜は自分の気持ちを守ってあげて。",
        next: "10分だけ通知から離れてみて。まだ苦しかったら、送らないメモに気持ちを書いてから考え直せば大丈夫です。",
        music: "夜に心を落ち着けるカバー",
        musicCopy: "返信を待つ夜に、心の音量を少し下げてくれる一曲。"
    },
    yuuki: {
        name: "一歩だけ勇気モビー",
        image: "一歩だけ勇気モビー.jpg",
        catch: "送るなら、重くなく、あなたらしく",
        role: "背中押し",
        message: "今のあなたに必要なのは、大きな告白ではなく小さな一歩。完璧な言葉を探しすぎなくても、自然な一言で距離が少しやわらぐことがあります。",
        word: "送ってみてもいい。重くしなくていい。あなたらしい短い言葉で大丈夫。",
        next: "「この前の話、ちょっと気になってた」くらいの軽い一文を下書きして、深呼吸してから送るか決めてみて。",
        music: "背中を押す明るめのカバー",
        musicCopy: "送る前の手の震えを、少しだけ勇気に変えてくれる一曲。"
    },
    sukibare: {
        name: "好きバレ寸前モビー",
        image: "好きバレ寸前モビー.jpg",
        catch: "隠してるつもりでも、ちょっと出てるかも",
        role: "素直さ",
        message: "あなたは、隠しているつもりでも恋の空気が少し漏れるタイプ。でもそれは悪いことではなく、相手に意識してもらうきっかけにもなります。",
        word: "気持ちが少し出てしまう日があっても、それはちゃんと好きでいられる証拠かもしれない。",
        next: "隠しきろうとするより、笑顔や短いリアクションだけは素直に出してみて。全部を言わなくても、温度は伝わります。",
        music: "気づいてほしい気持ちに合うカバー",
        musicCopy: "好きと言えないまま、少しだけ気づいてほしい夜に。"
    },
    mypace: {
        name: "追わせるマイペースモビー",
        image: "追わせるマイペースモビー.jpg",
        catch: "恋してても、自分の時間をなくさないで",
        role: "冷静さ",
        message: "あなたは、追いかけすぎない方が魅力が出るタイプ。自分の予定や楽しみを大事にしている時ほど、相手から見ても気になる存在になれます。",
        word: "恋していても、あなたの生活はあなたのもの。相手中心になりすぎなくていい。",
        next: "今日は相手の予定より、自分の予定をひとつ先に決めてみて。小さな余裕が、恋の呼吸を整えてくれます。",
        music: "自分を取り戻すカバー",
        musicCopy: "恋に飲まれそうな時、自分の輪郭をそっと戻してくれる一曲。"
    },
    namida: {
        name: "強がり涙モビー",
        image: "強がり涙モビー.jpg",
        catch: "大丈夫って言えた日ほど、ちゃんと休んでね",
        role: "慰め",
        message: "あなたは、つらい時ほど明るく振る舞ってしまうタイプ。本当は疲れているのに、周りには平気な顔を見せてしまうことがあるのかもしれません。",
        word: "泣いたから弱いわけじゃない。今日はちゃんと落ち込んでいい日。",
        next: "誰かに話せなくても、今夜だけは自分にまで強がらないで。短い音楽を一曲聴いて、眠れる準備をしてみて。",
        music: "泣いていいと思えるカバー",
        musicCopy: "言葉にできない疲れを、静かに受け止めてくれる一曲。"
    },
    restart: {
        name: "再スタート花束モビー",
        image: "再スタート花束モビー.jpg",
        catch: "終わった恋も、ちゃんとあなたの魅力になるよ",
        role: "慰め",
        message: "うまくいかなかった恋は、あなたの価値を下げるものではありません。ちゃんと好きになれたことも、傷ついたことも、次のあなたを少し優しくします。",
        word: "無理に次へ進まなくてもいい。まだ残っている気持ちを、今夜はそのまま置いておいて大丈夫。",
        next: "思い出を消そうとする前に、今の自分を責める言葉だけ減らしてみて。再スタートは、急がなくても始まります。",
        music: "前に進むためのカバー",
        musicCopy: "終わった恋を、少しだけやわらかい記憶に変えていく一曲。"
    }
};

const QUESTIONS = [
    {
        id: "Q1",
        text: "返信が少し遅いだけで、夜になると何度もスマホを見てしまう。",
        weights: { kidoku: 2.5, omamori: 0.8 },
        reverseWeights: { mypace: 1.4 }
    },
    {
        id: "Q2",
        text: "好きな人に合わせすぎて、自分の予定や気持ちを後回しにすることがある。",
        weights: { omamori: 2.1, kidoku: 0.7 },
        reverseWeights: { mypace: 2.1, omamori: 0.6 }
    },
    {
        id: "Q3",
        text: "本当は、軽く扱われる恋ではなく、ちゃんと大事にされたいと思っている。",
        weights: { omamori: 2.4, mypace: 0.8 },
        reverseWeights: { yoin: 0.6 }
    },
    {
        id: "Q4",
        text: "好きな気持ちは隠しているつもりでも、表情や選曲に出てしまう。",
        weights: { sukibare: 2.4, yoin: 0.7 },
        reverseWeights: { yoin: 1.4 }
    },
    {
        id: "Q5",
        text: "自分から強く押すより、ふとした余韻で思い出される恋のほうが自分らしい。",
        weights: { yoin: 2.4, mypace: 0.8 },
        reverseWeights: { yuuki: 1.0, sukibare: 0.6 }
    },
    {
        id: "Q6",
        text: "LINEやDMを送りたいのに、重いと思われそうで止まってしまう。",
        weights: { yuuki: 2.2, kidoku: 1.4, omamori: 0.6 },
        reverseWeights: { sukibare: 0.8, mypace: 0.7 }
    },
    {
        id: "Q7",
        text: "恋がうまくいかない時ほど、平気なふりをしてしまう。",
        weights: { namida: 2.6, restart: 0.7 },
        reverseWeights: { yuuki: 0.7 }
    },
    {
        id: "Q8",
        text: "終わった恋やうまくいかなかった恋を、まだ心のどこかで整理しきれていない。",
        weights: { restart: 2.7, namida: 1.0 },
        reverseWeights: { omamori: 0.7, mypace: 0.6 }
    },
    {
        id: "Q9",
        text: "恋していても、自分の時間や生活のリズムはなくしたくない。",
        weights: { mypace: 2.5, omamori: 1.0 },
        reverseWeights: { omamori: 1.2, kidoku: 0.8 }
    },
    {
        id: "Q10",
        text: "好きな人の前では、いつもの自分と少し違う態度になってしまう。",
        weights: { sukibare: 2.2, yoin: 0.7 },
        reverseWeights: { mypace: 0.8 }
    },
    {
        id: "Q11",
        text: "大きな告白より、自然な一言で少しだけ近づきたい。",
        weights: { yuuki: 2.4, yoin: 0.7 },
        reverseWeights: { sukibare: 0.7 }
    },
    {
        id: "Q12",
        text: "今は無理に明るくするより、静かに気持ちを置いておける音楽がほしい。",
        weights: { yoin: 1.4, namida: 1.4, restart: 1.4 },
        reverseWeights: { yuuki: 0.8, mypace: 0.6 }
    }
];

const state = {
    step: "intro",
    page: 0,
    answers: {}
};

const app = document.getElementById("app");
const navDiagnosis = document.getElementById("navDiagnosis");
const btnReset = document.getElementById("btnReset");

function answerToValue(answer) {
    return 3 - answer;
}

function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) Object.assign(state, JSON.parse(raw));
    } catch (_) { }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
    state.step = "intro";
    state.page = 0;
    state.answers = {};
    localStorage.removeItem(STORAGE_KEY);
    render();
}

function answeredCount() {
    return QUESTIONS.filter(q => state.answers[q.id]).length;
}

function isCompleted() {
    return answeredCount() === QUESTIONS.length;
}

function addWeighted(scores, weights, amount) {
    Object.entries(weights || {}).forEach(([key, weight]) => {
        scores[key] += amount * weight;
    });
}

function getAnswer(id) {
    return state.answers[id] ? answerToValue(state.answers[id]) : 0;
}

function scoreQuestions() {
    const scores = Object.fromEntries(Object.keys(TYPES).map(key => [key, 0]));
    QUESTIONS.forEach(q => {
        const answer = state.answers[q.id];
        if (!answer) return;
        const value = answerToValue(answer);
        if (value > 0) addWeighted(scores, q.weights, value);
        if (value < 0) addWeighted(scores, q.reverseWeights, Math.abs(value));
    });
    return scores;
}

function getTieBreakerScores() {
    const loss = Math.max(0, getAnswer("Q8")) * 2 + Math.max(0, getAnswer("Q7")) + Math.max(0, getAnswer("Q12"));
    const reply = Math.max(0, getAnswer("Q1")) * 2 + Math.max(0, getAnswer("Q6"));
    const action = Math.max(0, getAnswer("Q11")) * 2 + Math.max(0, getAnswer("Q6"));
    const pace = Math.max(0, getAnswer("Q9")) * 2 + Math.max(0, -getAnswer("Q2"));
    return { loss, reply, action, pace };
}

function chooseType(scores) {
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const topScore = entries[0][1];
    const tied = entries.filter(([, score]) => Math.abs(score - topScore) < 0.0001).map(([key]) => key);
    if (tied.length === 1) return tied[0];

    const tie = getTieBreakerScores();
    const prefer = [];
    if (tie.loss >= 4) prefer.push(getAnswer("Q8") >= getAnswer("Q7") ? "restart" : "namida");
    if (tie.reply >= 3) prefer.push("kidoku");
    if (tie.action >= 3) prefer.push("yuuki");
    if (tie.pace >= 3) prefer.push("mypace");
    prefer.push("yoin", "omamori", "sukibare", "namida", "restart");

    return prefer.find(key => tied.includes(key)) || tied[0];
}

function getAxisData() {
    const q1 = getAnswer("Q1");
    const q2 = getAnswer("Q2");
    const q3 = getAnswer("Q3");
    const q6 = getAnswer("Q6");
    const q7 = getAnswer("Q7");
    const q8 = getAnswer("Q8");
    const q9 = getAnswer("Q9");
    const q11 = getAnswer("Q11");
    const q12 = getAnswer("Q12");
    const temperature = clamp(Math.round(52 + q3 * 8 + q11 * 6 - q8 * 10 - q7 * 5), 0, 100);
    const action = clamp(Math.round(50 + q11 * 12 + q6 * 6 - q1 * 4 + Math.max(0, -q6) * 7), 0, 100);
    const anxiety = clamp(Math.round(50 + q1 * 13 + q6 * 8 + q7 * 5 + q8 * 4 - q9 * 5), 0, 100);
    const support = clamp(Math.round(50 + q7 * 9 + q8 * 9 + q12 * 6 + q3 * 4), 0, 100);
    return [
        { name: "恋の温度", left: "整理中", right: "まだ希望", value: temperature },
        { name: "行動の向き", left: "待つ", right: "一歩進む", value: action },
        { name: "不安の出方", left: "静か", right: "揺れやすい", value: anxiety },
        { name: "今必要な支え", left: "冷静さ", right: "慰め", value: support }
    ];
}

function computeResult() {
    const scores = scoreQuestions();
    const typeKey = chooseType(scores);
    const maxScore = Math.max(...Object.values(scores), 1);
    const normalizedScores = Object.fromEntries(Object.entries(scores).map(([key, score]) => [key, Math.round((score / maxScore) * 100)]));
    return {
        typeKey,
        type: TYPES[typeKey],
        scores,
        normalizedScores,
        axes: getAxisData()
    };
}

function render() {
    window.scrollTo(0, 0);
    navDiagnosis.classList.toggle("active", state.step !== "result" || !isCompleted());
    if (state.step === "quiz") renderQuiz();
    else if (state.step === "result") renderResult();
    else renderIntro();
}

function renderIntro() {
    const count = answeredCount();
    app.innerHTML = `
        <section class="panel fade-in" style="text-align:center;padding-top:52px;padding-bottom:52px;">
            <p class="kicker">Elle Rishe x Mobby</p>
            <h2 class="big">恋してる診断</h2>
            <p class="text-body intro-copy">不安な恋も、うまくいかなかった恋も。今のあなたを見守ってくれるモビーと、背中を押す一曲がわかる。</p>
            <p class="text-body intro-copy">12問に直感で答えて、夜にそっと寄り添うような今の恋の味方を見つけてください。</p>
            <button class="primary" id="btnStart" type="button">${count > 0 ? "診断を再開する" : "診断をはじめる"}</button>
            ${count > 0 ? `<p class="text-body" style="font-size:12px;margin-top:14px;">${count}/12問 回答済み</p>` : ""}
        </section>`;
    document.getElementById("btnStart").onclick = () => {
        state.step = "quiz";
        const firstMissing = QUESTIONS.findIndex(q => !state.answers[q.id]);
        state.page = firstMissing >= 0 ? Math.floor(firstMissing / PAGE_SIZE) : 0;
        saveState();
        render();
    };
}

function renderQuiz() {
    const start = state.page * PAGE_SIZE;
    const currentQuestions = QUESTIONS.slice(start, start + PAGE_SIZE);
    const totalPages = Math.ceil(QUESTIONS.length / PAGE_SIZE);
    const progress = Math.round((answeredCount() / QUESTIONS.length) * 100);
    const questionHtml = currentQuestions.map((q, index) => {
        const selected = state.answers[q.id];
        return `
            <div class="qCard fade-in" style="animation-delay:${index * 0.04}s">
                <p class="kicker">Q${start + index + 1}</p>
                <p class="qText">${q.text}</p>
                <div class="likert5">
                    <div class="likert-labels"><span>当てはまる</span><span>当てはまらない</span></div>
                    <div class="likert-buttons">
                        ${[1, 2, 3, 4, 5].map(value => `<button type="button" class="likert-btn ${selected === value ? "selected" : ""}" data-qid="${q.id}" data-value="${value}">${ANSWER_LABELS[value]}</button>`).join("")}
                    </div>
                </div>
            </div>`;
    }).join("");

    app.innerHTML = `
        <section class="panel">
            <div class="progress-wrap">
                <div class="progress-meta"><span>${state.page + 1}/${totalPages}ページ</span><span>${progress}%</span></div>
                <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
            </div>
            ${questionHtml}
            <div style="display:flex;justify-content:space-between;gap:10px;margin-top:26px;">
                <button id="btnPrev" type="button" ${state.page === 0 ? "disabled" : ""}>戻る</button>
                <button class="primary" id="btnNext" type="button">${state.page === totalPages - 1 ? "結果を見る" : "次へ"}</button>
            </div>
        </section>`;

    document.querySelectorAll(".likert-btn[data-qid]").forEach(btn => {
        btn.onclick = () => {
            const qid = btn.dataset.qid;
            state.answers[qid] = Number(btn.dataset.value);
            document.querySelectorAll(`.likert-btn[data-qid="${qid}"]`).forEach(el => el.classList.remove("selected"));
            btn.classList.add("selected");
            saveState();
            const updatedProgress = Math.round((answeredCount() / QUESTIONS.length) * 100);
            document.querySelector(".progress-fill").style.width = `${updatedProgress}%`;
            document.querySelector(".progress-meta span:last-child").textContent = `${updatedProgress}%`;
        };
    });
    document.getElementById("btnPrev").onclick = () => {
        state.page = Math.max(0, state.page - 1);
        saveState();
        render();
    };
    document.getElementById("btnNext").onclick = () => {
        const missing = currentQuestions.find(q => !state.answers[q.id]);
        if (missing) {
            alert("まだ回答していない項目があります");
            return;
        }
        if (state.page < totalPages - 1) {
            state.page += 1;
            saveState();
            render();
            return;
        }
        state.step = "result";
        saveState();
        render();
    };
}

function renderResult() {
    if (!isCompleted()) {
        state.step = "quiz";
        saveState();
        render();
        return;
    }
    const result = computeResult();
    const type = result.type;
    const shareUrlRaw = window.location.href.split("?")[0];
    const shareTextRaw = `恋してる診断の結果は「${type.name}」でした。\n${type.catch}\n\n今の恋を見守るモビーを診断してみて`;
    const shareText = encodeURIComponent(shareTextRaw);
    const shareUrl = encodeURIComponent(shareUrlRaw);
    const axisHtml = result.axes.map(axis => `
        <div class="axis-row">
            <div class="axis-head"><span>${axis.name}</span><span>${axis.left} ${axis.value}% ${axis.right}</span></div>
            <div class="axis-track"><div class="axis-fill" style="width:${axis.value}%"></div></div>
        </div>`).join("");

    app.innerHTML = `
        <section class="panel fade-in">
            <div class="result-hero">
                <p class="kicker">診断結果</p>
                <h2 class="big">あなたの恋を見守るのは<br>${type.name}</h2>
                <p class="text-body" style="color:var(--text-main);font-weight:700;font-size:16px;">${type.catch}</p>
                <div class="char-image"><img src="img/${encodeURIComponent(type.image)}" alt="${type.name}" onerror="this.parentElement.textContent='画像準備中';"></div>
                <span class="result-tag">${type.role}</span>
            </div>
        </section>
        <section class="panel fade-in">
            <p class="kicker">今のあなたの恋</p>
            <p class="text-body" style="color:var(--text-main);font-size:15px;line-height:1.95;margin:0;">${type.message}</p>
        </section>
        <section class="result-grid">
            <div class="info-card fade-in">
                <h3>今のあなたへの一言</h3>
                <p>${type.word}</p>
            </div>
            <div class="info-card fade-in">
                <h3>次の一歩</h3>
                <p>${type.next}</p>
            </div>
        </section>
        <section class="panel fade-in" style="margin-top:22px;">
            <p class="kicker">4つの補助軸</p>
            ${axisHtml}
        </section>
        <section class="panel music-panel fade-in">
            <p class="kicker">Elle Rishe Cover</p>
            <h2 class="big" style="font-size:21px;margin-bottom:8px;">${type.music}</h2>
            <p class="text-body" style="color:var(--text-main);margin:0;">${type.musicCopy}</p>
            <div class="listen-buttons">
                <a href="${LISTEN_LINKS.instagram}" target="_blank" rel="noopener">Instagramで聴く</a>
                <a href="${LISTEN_LINKS.tiktok}" target="_blank" rel="noopener">TikTokで聴く</a>
            </div>
        </section>
        <section class="panel fade-in" style="text-align:center;">
            <p class="kicker">Share</p>
            <div class="share-buttons">
                <a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener"><button type="button">Xでシェア</button></a>
                <button id="btnRetry" type="button">もう一度診断する</button>
            </div>
        </section>`;

    document.getElementById("btnRetry").onclick = () => {
        if (confirm("最初からやり直しますか？")) resetState();
    };
}

navDiagnosis.onclick = e => {
    e.preventDefault();
    state.step = isCompleted() ? "result" : "intro";
    saveState();
    render();
};

btnReset.onclick = () => {
    if (confirm("最初からやり直しますか？")) resetState();
};

loadState();
render();
