// にゃん恋診断：診断ロジックと画面（既存 16love / 16renai のスコア計算・構成を踏襲）
const STORAGE_KEY = "nyanKoi16.v1";
const PAGE_SIZE = 5;
const SITE_URL = "https://www.mobby.online/16nyako";
const state = { step: "intro", page: 0, answers: {}, questionOrder: null, profile: null, sentToSheet: false };
// 結果の前の登録（ほかの診断と同じ項目と送信先）
const AGE_OPTIONS = ["16歳未満", "16歳", "17歳", "18歳", "19歳", "20歳", "21歳", "22歳", "23歳", "24歳", "25歳", "26歳", "27歳", "28歳", "29歳以上"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ui = { compatYou: "", compatPartner: "", fortuneType: "" };
const app = document.getElementById("app");

function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(state, JSON.parse(r)); } catch (e) { } }
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { } }
function resetState() { state.step = "intro"; state.page = 0; state.answers = {}; state.questionOrder = null; state.profile = null; state.sentToSheet = false; try { localStorage.removeItem(STORAGE_KEY); } catch (e) { } render(); }
function isDone() { return Object.keys(state.answers).length >= QUESTIONS.length; }
function isRegistered() { const p = state.profile; return !!(p && p.name && p.email && p.age); }

function shuffle(a) { const s = [...a]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; } return s; }
function questionOrder() {
    if (state.questionOrder && state.questionOrder.length === QUESTIONS.length) return state.questionOrder;
    state.questionOrder = shuffle(Array.from({ length: QUESTIONS.length }, (_, i) => i));
    saveState();
    return state.questionOrder;
}
function shuffledQuestions() { return questionOrder().map(i => QUESTIONS[i]); }
function codeFrom(hard) { return ["A", "B", "C", "D"].map(k => hard[k] === "L" ? AXES[k].leftCode : AXES[k].rightCode).join(""); }

function computeResult() {
    const raw = { A: 0, B: 0, C: 0, D: 0 }, cnt = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of QUESTIONS) {
        const r = state.answers[q.id]; if (!r) continue;
        let t = 4 - r; // 1(そう思う)=+3 … 7(そう思わない)=-3
        if (q.reverse) t = -t;
        raw[q.axis] += t; cnt[q.axis]++;
    }
    const leftPct = {}, hard = {}, confidence = {};
    ["A", "B", "C", "D"].forEach(k => {
        const maxT = cnt[k] * 3;
        const ls = maxT > 0 ? ((raw[k] + maxT) / (2 * maxT)) * 100 : 50;
        leftPct[k] = Math.round(Math.max(0, Math.min(100, ls)));
        hard[k] = leftPct[k] >= 50 ? "L" : "R";
        const dv = Math.abs(leftPct[k] - 50) / 50;
        confidence[k] = dv >= 0.5 ? "はっきり" : dv >= 0.25 ? "やや" : "場面による";
    });
    const code = codeFrom(hard);
    const adjacent = [];
    ["A", "B", "C", "D"].forEach(k => {
        if (confidence[k] === "場面による") {
            const h = { ...hard }; h[k] = h[k] === "L" ? "R" : "L";
            const c = codeFrom(h);
            if (CHARACTERS[c] && c !== code) adjacent.push({ axis: k, code: c });
        }
    });
    return { code, hard, leftPct, confidence, adjacent, char: CHARACTERS[code], nyan: nyanLevel(leftPct) };
}
function myCode() { return isDone() && isRegistered() ? computeResult().code : ""; } // 登録前は相性・占いにも結果を出さない

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
function list(items) { return `<ul>${items.map(i => `<li>${esc(i)}</li>`).join("")}</ul>`; }
function selectHtml(id, value) { return `<select id="${id}">${Object.keys(CHARACTERS).map(c => `<option value="${c}"${c === value ? " selected" : ""}>${esc(CHARACTERS[c].name)}</option>`).join("")}</select>`; }

function setTabs() {
    const map = { intro: "navDiagnosis", quiz: "navDiagnosis", gate: "navDiagnosis", result: "navDiagnosis", types: "navTypes", compat: "navCompat", fortune: "navFortune" };
    ["navDiagnosis", "navTypes", "navCompat", "navGuide", "navFortune"].forEach(id => document.getElementById(id).classList.toggle("active", map[state.step] === id));
}
function render() {
    window.scrollTo(0, 0);
    setTabs();
    ({ intro: renderIntro, quiz: renderQuiz, gate: renderGate, types: renderTypes, compat: renderCompat, fortune: renderFortune }[state.step] || renderResult)();
}

function renderIntro() {
    const answered = Object.keys(state.answers).length;
    const heroes = ["ragdoll", "mike-neko", "russian-blue", "bengal"].map(n => `<img src="img/${n}.webp" alt="" loading="lazy">`).join("");
    app.innerHTML = `<div class="card fade-in">
        <p class="hearts">♥ ♥ ♥</p>
        <p class="kicker">あなたが猫なら、恋でどの猫かも？</p>
        <h2 class="title">にゃん<em>恋</em>モビー診断</h2>
        <p class="subcopy">にゃっコレ by mobby</p>
        <div class="hero-row">${heroes}</div>
        <div class="divider">♥</div>
        <p class="lead">好きな人・恋人への接し方や付き合い方を、40問・4つの軸で診断。<br>16種類の実在の猫種の「にゃこモビー」から、あなたに近いタイプが見つかります。</p>
        <p class="note">所要時間は約5分。診断後は、相性チェックや今日のごよみも楽しめます。</p>
        <div class="center"><button class="btn primary full" id="btnStart">♡　${answered > 0 && !isDone() ? "つづきから診断する" : isDone() ? "結果を見る" : "診断をはじめる"}　›</button></div>
        ${answered > 0 && !isDone() ? `<p class="note">${answered}/${QUESTIONS.length}問 回答済み</p>` : ""}
        ${appPromo()}
    </div>`;
    document.getElementById("btnStart").onclick = () => {
        if (isDone()) state.step = "result";
        else {
            state.step = "quiz";
            const sq = shuffledQuestions();
            const idx = sq.findIndex(q => !state.answers[q.id]);
            state.page = idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0;
        }
        saveState(); render();
    };
}

// 3の倍数の質問に答えると、結果に出ない猫種のにゃこモビーがカードの端からちらっとのぞく
// 画像は「いないいないばあ」の8コマ（横4×縦2）。Q3、Q6…の順に1匹ずつ使う
const PEEK_CATS = ["chatora", "hachiware", "siamese-seal-point", "shiro-neko", "american-shorthair", "kuro-neko", "abyssinian", "japanese-bobtail", "kijitora", "birman", "exotic-shorthair", "saba-tora", "american-curl"];
function peekImage(no) { const img = new Image(); img.src = `img/peek/${PEEK_CATS[(no / 3 - 1) % PEEK_CATS.length]}.webp`; return img; }
function showPeek(card, no) {
    const img = peekImage(no);
    img.decode().then(() => {
        if (!card.isConnected) return;
        card.querySelector(".peek")?.remove();
        const layer = document.createElement("div"), cat = document.createElement("i");
        layer.className = `peek ${Math.random() < 0.5 ? "left" : "right"}`;
        layer.setAttribute("aria-hidden", "true");
        layer.style.height = `${card.querySelector(".likert-row").offsetTop}px`; // 回答の丸にはかぶせない
        cat.style.backgroundImage = `url("${img.src}")`;
        cat.onanimationend = e => { if (e.animationName !== "peek-face") layer.remove(); };
        layer.appendChild(cat); card.appendChild(layer);
    }).catch(() => { });
}

function renderQuiz() {
    const sq = shuffledQuestions(), start = state.page * PAGE_SIZE, qs = sq.slice(start, start + PAGE_SIZE);
    const totalPages = Math.ceil(sq.length / PAGE_SIZE), prog = Math.round(Object.keys(state.answers).length / sq.length * 100);
    const cards = qs.map((q, i) => {
        const v = state.answers[q.id];
        const btns = [1, 2, 3, 4, 5, 6, 7].map(n => `<button type="button" class="likert l${n}${v === n ? " selected" : ""}" data-qid="${q.id}" data-val="${n}" aria-label="${n}"></button>`).join("");
        return `<div class="qCard fade-in" style="animation-delay:${i * 0.05}s"><p class="kicker">Q${start + i + 1}</p><p class="qtext">${esc(q.text)}</p>
            <div class="likert-row">${btns}</div><div class="likert-cap"><span>そう思う</span><span>そう思わない</span></div></div>`;
    }).join("");
    const last = state.page >= totalPages - 1;
    app.innerHTML = `<div class="card"><div class="progress"><div class="progress-meta"><span>進行状況</span><span>${prog}%</span></div><div class="track"><div class="fill" style="width:${prog}%"></div></div></div>
        ${cards}
        <div class="nav-row"><button class="btn" id="btnPrev" ${state.page === 0 ? "disabled" : ""}>‹ 戻る</button><button class="btn primary" id="btnNext">${last ? "結果を見る ›" : "次へ ›"}</button></div></div>`;
    qs.forEach((q, i) => {
        const no = start + i + 1, peeks = no % 3 === 0;
        if (peeks && !state.answers[q.id]) peekImage(no); // 先読み
        document.querySelectorAll(`button.likert[data-qid="${q.id}"]`).forEach(b => {
            b.onclick = () => {
                const first = !state.answers[q.id];
                state.answers[q.id] = parseInt(b.dataset.val, 10); saveState();
                document.querySelectorAll(`button.likert[data-qid="${q.id}"]`).forEach(x => x.classList.remove("selected"));
                b.classList.add("selected");
                if (peeks && first) showPeek(b.closest(".qCard"), no);
            };
        });
    });
    document.getElementById("btnPrev").onclick = () => { state.page--; saveState(); render(); };
    document.getElementById("btnNext").onclick = () => {
        if (qs.some(q => !state.answers[q.id])) { alert("まだ回答していない項目があります"); return; }
        if (!last) { state.page++; saveState(); render(); }
        else { state.step = "result"; saveState(); render(); }
    };
}

function renderGate() {
    if (!isDone()) { state.step = "intro"; render(); return; }
    if (isRegistered()) { state.step = "result"; saveState(); render(); return; }
    const p = state.profile || {};
    const ages = ["", ...AGE_OPTIONS].map(a => `<option value="${a}"${a === (p.age || "") ? " selected" : ""}>${a || "選択してください。"}</option>`).join("");
    app.innerHTML = `<div class="card fade-in"><p class="kicker">あと少しで結果が見れます！</p><h2 class="title small">結果の閲覧には登録が必要です</h2>
        <p class="note">入力後すぐに、あなたの恋のにゃこモビーを表示します。</p>
        <form class="gate" id="gateForm" novalidate>
          <label for="regName">ニックネーム</label><input id="regName" type="text" autocomplete="nickname" maxlength="80" placeholder="例）るな" value="${esc(p.name || "")}">
          <label for="regEmail">メールアドレス</label><input id="regEmail" type="email" autocomplete="email" inputmode="email" placeholder="example@gmail.com" value="${esc(p.email || "")}">
          <label for="regAge">年齢</label><select id="regAge">${ages}</select>
          <label class="gate-consent"><input id="regConsent" type="checkbox"><span>入力した情報を連絡・改善のために保存することに同意します。</span></label>
          <p class="gate-error" id="regErr" role="alert" hidden></p>
          <div class="nav-row"><button type="button" class="btn" id="btnGateBack">‹ 戻る</button><button type="submit" class="btn primary">結果を見る ›</button></div>
          <p class="note">送信される内容：ニックネーム、年齢、メール、診断結果と回答</p>
        </form></div>`;
    document.getElementById("btnGateBack").onclick = () => { state.step = "quiz"; saveState(); render(); };
    document.getElementById("gateForm").onsubmit = e => {
        e.preventDefault();
        const value = id => document.getElementById(id).value.trim();
        const name = value("regName"), email = value("regEmail"), age = value("regAge");
        const message = !name ? "ニックネームを入力してください" : !email ? "メールアドレスを入力してください" : !EMAIL_PATTERN.test(email) ? "メールアドレスを正しく入力してください"
            : !age ? "年齢を選択してください" : !document.getElementById("regConsent").checked ? "同意にチェックしてください" : "";
        const error = document.getElementById("regErr");
        error.textContent = message; error.hidden = !message;
        if (message) return;
        state.profile = { name, email, age }; state.step = "result"; saveState(); render();
    };
}

// 結果を1回だけ送る。失敗しても結果は表示する
function sendResult(r) {
    if (state.sentToSheet) return;
    state.sentToSheet = true; saveState();
    const payload = { ...state.profile, type: r.code, axes: r.leftPct, answers: state.answers, source: "16nyako", createdAt: new Date().toISOString() };
    const post = (url, body) => fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        .then(res => { if (!res.ok) throw new Error(`${url} ${res.status}`); }).catch(e => console.error("[Nyako] 送信に失敗しました:", e.message));
    post("/api/lead", payload);
    post("/api/diagnosis", { ...payload, diagnosis_type: r.char.name });
}

function axisBar(k, r) {
    const a = AXES[k], left = r.leftPct[k], right = 100 - left;
    const lead = left >= 50 ? a.left : a.right, pct = Math.max(left, right);
    return `<div class="axis-row"><div class="axis-head"><span>${a.name}</span><b>${esc(lead)} ${pct}%（${r.confidence[k]}）</b></div>
        <div class="axis-bar"><span class="side">${a.left}</span><div class="axis-track"><i style="left:${left >= 50 ? 100 - left : 50}%;width:${Math.abs(left - 50)}%;"></i><em style="left:${100 - left}%"></em></div><span class="side">${a.right}</span></div></div>`;
}
function miniCard(code, extra) {
    const t = CHARACTERS[code];
    return `<button class="mini" data-code="${code}"><img src="${t.img}" alt=""><span><b>${esc(t.name)}</b>${extra || esc(t.catch)}</span></button>`;
}
const APP_URL = "https://apps.apple.com/jp/app/%E3%81%AB%E3%82%83%E3%81%A3%E3%82%B3%E3%83%AC/id6828308044";
function appPromo() {
    const cats = ["ragdoll", "mike-neko", "bengal", "pixie-bob"].map(n => `<img src="img/${n}.webp" alt="" loading="lazy">`).join("");
    return `<aside class="app-promo"><p class="app-promo__eyebrow">診断のにゃこモビーに、アプリで会える</p>
        <div class="app-promo__head"><img class="app-promo__icon" src="img/nyakkore-icon.webp" alt="にゃっコレのアプリアイコン">
          <div><p class="app-promo__name">にゃっコレ</p><p class="app-promo__sub">にゃこモビーを集める猫図鑑</p><p class="app-promo__meta">iPhoneアプリ ／ 無料 ／ 広告なし</p></div></div>
        <div class="app-promo__cats" aria-hidden="true">${cats}</div>
        <p class="app-promo__text">歩いた数、電池の残り、今日の天気、季節や時間帯。いつもの一日に合わせて、その日だけの猫と出会えます。</p>
        <ul class="app-promo__points"><li><b>毎晩20時</b>に、条件がそろった猫が候補に届く</li><li><b>出会った猫</b>はコレクションに記録</li><li><b>猫と一緒に</b>カメラで写真も撮れる</li></ul>
        <a class="app-promo__badge" href="${APP_URL}" target="_blank" rel="noopener"><img src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/ja-jp?size=250x83" alt="App Storeでダウンロード" width="200" height="67"></a></aside>`;
}
function shareText(c) { return `私はにゃん恋モビー診断で「${c.name}（${c.breed}）」でした🐱\n#にゃん恋モビー診断 #にゃっコレ`; }

function renderResult() {
    if (!isDone()) { state.step = "intro"; render(); return; }
    if (!isRegistered()) { state.step = "gate"; saveState(); render(); return; }
    const r = computeResult(), c = r.char, x = EXTRAS[r.code];
    sendResult(r);
    const rank = compatRanking(r.code).filter(t => t.code !== r.code);
    const best = rank.slice(0, 3), worst = rank[rank.length - 1];
    const rc = RESULT_COMPAT[r.code];
    const bestWhy = rc.best === best[0].code ? rc.why : best[0].bests[0].good;
    const worstTip = rc.worst === worst.code ? rc.tip : worst.cautions[0].tip;
    const meter = Array.from({ length: 7 }, (_, i) => `<i class="${i < r.nyan.level ? "on" : ""}"></i>`).join("");
    const adj = r.adjacent.map(a => miniCard(a.code, `<span>${AXES[a.axis].name}が「${r.hard[a.axis] === "L" ? AXES[a.axis].right : AXES[a.axis].left}」寄りなら、こちらも</span>`)).join("");
    app.innerHTML = `<div class="card fade-in"><div class="love-result-hero">
        <p class="kicker">あなたの恋のにゃこモビーは…</p>
        ${rollStage(c)}
        <h2 class="rname">${esc(c.name)}</h2>
        <p class="rbreed">${esc(c.breed)}</p>
        <span class="code-chip">タイプ ${r.code}</span>
        <p class="rcatch">「${esc(c.catch)}」</p></div>
        <p>${esc(c.hook)}</p>
        <div class="voice">${esc(x.nyaa)}</div>

        <div class="sec"><h3>🐾 甘えんぼ度</h3>
          <div class="level"><b>Lv.${r.nyan.level}</b><span><b style="font-size:1rem;font-family:inherit;color:var(--ink-strong)">${esc(r.nyan.name)}</b></span></div>
          <div class="level-meter">${meter}</div><p class="sub">${esc(r.nyan.desc)}</p></div>

        <div class="sec"><h3>📊 4つの軸</h3>${["A", "B", "C", "D"].map(k => axisBar(k, r)).join("")}</div>
        ${appPromo()}

        <div class="sec"><h3>💗 恋のスタイル</h3><p>${esc(c.style)}</p><p class="sub">${esc(c.seen)}</p></div>

        <div class="sec"><h3>🎬 シーン別のあなた</h3><div class="scene">
          <div><b>LINE・連絡</b>${esc(x.line)}</div><div><b>デート</b>${esc(x.date)}</div>
          <div><b>ケンカ・すれ違い</b>${esc(x.fight)}</div><div><b>告白・アプローチ</b>${esc(x.confess)}</div>
          <div><b>好きな人にだけ見せる脈ありサイン</b>${esc(x.sign)}</div></div></div>

        <div class="sec"><h3>✨ いいところ</h3>${list(c.strengths)}</div>
        <div class="sec"><h3>🙀 気をつけたいところ</h3>${list(c.cautions)}</div>
        <div class="sec"><h3>💡 恋のアドバイス</h3>${list(c.advice)}</div>
        <div class="sec"><h3>🧶 あなたに接するコツ</h3><p class="sub">好きな人や友達に、こっそり教えてあげてね。</p><p>${esc(x.howTo)}</p></div>

        <div class="sec"><h3>💞 相性のいい猫ベスト3</h3>
          ${best.map((t, i) => miniCard(t.code, `<span class="stars">${starsText(t.stars)}</span> <span>${esc(t.label)}</span>`)).join("")}
          <p class="sub" style="margin-top:10px">いちばん合う理由：${esc(bestWhy)}</p>
          <h3 style="margin-top:14px">⚠️ すれ違いやすい猫</h3>
          ${miniCard(worst.code, `<span class="stars">${starsText(worst.stars)}</span> <span>${esc(worst.label)}</span>`)}
          <p class="sub" style="margin-top:10px">コツ：${esc(worstTip)}</p>
          <div class="center"><button class="btn" id="btnGoCompat">もっと相性を見る ›</button></div></div>

        ${adj ? `<div class="sec"><h3>🔀 迷ったら、こちらも</h3><p class="sub">「場面による」の軸があるので、隣のタイプにもなりえます。</p>${adj}</div>` : ""}

        <div class="sec"><h3>🔮 今日のにゃん恋ごよみ</h3><p class="sub">診断結果のタイプで、今日の恋の運勢をチェック。</p>
          <div class="center" style="margin-top:8px"><button class="btn primary" id="btnGoFortune">今日の占いを見る ›</button></div></div>

        <div class="share"><a class="btn x" id="shareX" target="_blank" rel="noopener">Xでシェア</a><a class="btn line" id="shareLine" target="_blank" rel="noopener">LINEで送る</a><button class="btn" id="shareNative">シェアする</button></div>
        <div class="nav-row"><button class="btn" id="btnAll">16タイプを見る</button><button class="btn" id="btnRetry">もう一度診断する</button></div></div>`;
    setupRoll(app.querySelector(".cat-stage"));
    const text = shareText(c);
    document.getElementById("shareX").href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(SITE_URL)}`;
    document.getElementById("shareLine").href = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(text)}`;
    const nat = document.getElementById("shareNative");
    if (navigator.share) nat.onclick = () => navigator.share({ text, url: SITE_URL }).catch(() => { }); else nat.style.display = "none";
    document.getElementById("btnAll").onclick = () => { state.step = "types"; render(); };
    document.getElementById("btnRetry").onclick = () => { if (confirm("最初からやり直しますか？")) resetState(); };
    document.getElementById("btnGoCompat").onclick = () => { ui.compatYou = r.code; ui.compatPartner = best[0].code; state.step = "compat"; render(); };
    document.getElementById("btnGoFortune").onclick = () => { ui.fortuneType = r.code; state.step = "fortune"; render(); };
    document.querySelectorAll(".mini").forEach(b => b.onclick = () => showModal(b.dataset.code));
}

function renderTypes() {
    const cards = Object.keys(CHARACTERS).map(code => { const c = CHARACTERS[code]; return `<button class="tcard" data-code="${code}"><img src="${c.img}" alt="${esc(c.breed)}" loading="lazy"><span class="code">${code}</span><b>${esc(c.name)}</b><span>${esc(c.catch)}</span></button>`; }).join("");
    app.innerHTML = `<div class="card fade-in"><p class="kicker">全16タイプ</p><h2 class="title small">にゃん恋タイプ</h2><p class="note">タップして、くわしく見る</p><div class="tgrid">${cards}</div>
        <div class="center"><button class="btn primary" id="btnBack">診断にもどる</button></div></div>`;
    document.querySelectorAll(".tcard").forEach(b => b.onclick = () => showModal(b.dataset.code));
    document.getElementById("btnBack").onclick = () => { state.step = isDone() ? "result" : "intro"; render(); };
}

function renderCompat() {
    const mine = myCode();
    if (!ui.compatYou) ui.compatYou = mine || "ぴすしお";
    if (!ui.compatPartner) ui.compatPartner = "きすしお";
    const a = CHARACTERS[ui.compatYou], b = CHARACTERS[ui.compatPartner], cp = compat(ui.compatYou, ui.compatPartner), bx = EXTRAS[ui.compatPartner];
    const ranking = compatRanking(ui.compatYou);
    app.innerHTML = `<div class="card fade-in"><p class="kicker">COMPATIBILITY</p><h2 class="title small">相性を見る</h2>
        <p class="note">${mine ? "あなたのタイプが選ばれています。好きな人のタイプを選んでね。" : "診断前でも、タイプを選んで相性を見られます。"}</p>
        <div class="selrow"><div><label for="selYou">あなた</label>${selectHtml("selYou", ui.compatYou)}</div><div><label for="selPartner">あの人</label>${selectHtml("selPartner", ui.compatPartner)}</div></div>
        <div class="pair"><img src="${a.img}" alt=""><span>♥</span><img src="${b.img}" alt=""></div>
        <div class="bigstars">${starsText(cp.stars)}</div>
        <h3 class="title small" style="margin:4px 0">${esc(cp.label)}</h3><p class="lead">${esc(cp.desc)}</p>
        <div class="sec"><h3>💞 惹かれ合うところ</h3>${list(cp.bests.map(x => x.good))}</div>
        <div class="sec"><h3>⚠️ すれ違いやすいところ</h3>${list(cp.cautions.map(x => x.caution))}</div>
        <div class="sec"><h3>🧶 うまくいくコツ</h3>${list([...cp.cautions, ...cp.bests].map(x => x.tip).filter((v, i, s) => s.indexOf(v) === i))}</div>
        <div class="sec"><h3>🔑 ${esc(b.name)}への接し方</h3><p>${esc(bx.howTo)}</p><p class="sub">脈ありサイン：${esc(bx.sign)}</p></div>
        <div class="sec"><h3>📋 ${esc(a.name)}の相性ランキング</h3><p class="sub">タップすると、その猫との相性を表示します。</p>
          ${ranking.map(t => `<button class="mini" data-pick="${t.code}"><img src="${CHARACTERS[t.code].img}" alt=""><span><b>${esc(CHARACTERS[t.code].name)}</b><span class="stars">${starsText(t.stars)}</span> ${esc(t.label)}</span></button>`).join("")}</div></div>`;
    document.getElementById("selYou").onchange = e => { ui.compatYou = e.target.value; renderCompat(); };
    document.getElementById("selPartner").onchange = e => { ui.compatPartner = e.target.value; renderCompat(); };
    document.querySelectorAll("[data-pick]").forEach(btn => btn.onclick = () => { ui.compatPartner = btn.dataset.pick; renderCompat(); window.scrollTo(0, 0); });
}

function renderFortune() {
    const mine = myCode();
    if (!ui.fortuneType) ui.fortuneType = mine || "ぴすしお";
    const code = ui.fortuneType, c = CHARACTERS[code], f = dailyFortune(code), k = CHARACTERS[f.keyperson];
    const d = new Date(), md = `${d.getMonth() + 1}月${d.getDate()}日`;
    app.innerHTML = `<div class="card fade-in"><p class="kicker">TODAY</p><h2 class="title small">今日のにゃん恋ごよみ</h2><p class="note">${md}　${mine ? "診断結果のタイプで占っています" : "診断前でも、タイプを選んで見られます"}</p>
        <div class="selrow" style="grid-template-columns:1fr"><div><label for="selFortune">タイプ</label>${selectHtml("selFortune", code)}</div></div>
        <div class="pair"><img src="${c.img}" alt="" style="width:45%"></div>
        <div class="bigstars" style="color:var(--pink-soft)">${hearts(f.overall)}</div><p class="note">今日の恋予報</p>
        <div class="fortune-score"><div>恋愛運<b>${hearts(f.love)}</b></div><div>LINE運<b>${hearts(f.line)}</b></div><div>おでかけ運<b>${hearts(f.outing)}</b></div></div>
        <div class="sec"><h3>📝 今日のひとこと</h3><p>${esc(f.message)}</p></div>
        <div class="sec"><h3>🎯 今日のミッション</h3><p>${esc(f.mission)}</p></div>
        <div class="sec"><h3>🍀 ラッキー</h3><dl class="kv"><dt>アイテム</dt><dd>${esc(f.item)}</dd><dt>カラー</dt><dd>${esc(f.color)}</dd><dt>スポット</dt><dd>${esc(f.spot)}</dd></dl></div>
        <div class="sec"><h3>🔑 今日のキーパーソン</h3><p class="sub">今日の流れを動かしてくれるかもしれない猫。</p>${miniCard(f.keyperson, `<span>${esc(k.catch)}</span>`)}</div>
        <div class="voice">${esc(EXTRAS[code].nyaa)}</div>
        <p class="note">ごよみは毎日変わります。明日もチェックしてね。</p>
        ${appPromo()}
        <div class="center"><button class="btn primary" id="btnFortuneBack">${mine ? "診断結果にもどる" : "診断をはじめる"}</button></div></div>`;
    document.getElementById("selFortune").onchange = e => { ui.fortuneType = e.target.value; renderFortune(); };
    document.querySelectorAll(".mini").forEach(b => b.onclick = () => showModal(b.dataset.code));
    document.getElementById("btnFortuneBack").onclick = () => { state.step = mine ? "result" : "intro"; render(); };
}

function showModal(code) {
    const c = CHARACTERS[code], x = EXTRAS[code]; if (!c) return;
    const old = document.getElementById("modal"); if (old) old.remove();
    const el = document.createElement("div"); el.id = "modal"; el.className = "modal";
    el.innerHTML = `<div class="modal-box"><button class="x-close" aria-label="閉じる">×</button>
        ${rollStage(c, "modal-cat")}<div class="love-result-hero"><h3 class="rname">${esc(c.name)}</h3><p class="rbreed">${esc(c.breed)}</p><span class="code-chip">タイプ ${code}</span><p class="rcatch">「${esc(c.catch)}」</p></div>
        <p>${esc(c.hook)}</p><div class="voice">${esc(x.nyaa)}</div>
        <div class="sec"><h3>💗 恋のスタイル</h3><p>${esc(c.style)}</p></div>
        <div class="sec"><h3>🎬 シーン別</h3><div class="scene"><div><b>LINE・連絡</b>${esc(x.line)}</div><div><b>デート</b>${esc(x.date)}</div><div><b>ケンカ</b>${esc(x.fight)}</div><div><b>告白</b>${esc(x.confess)}</div><div><b>脈ありサイン</b>${esc(x.sign)}</div></div></div>
        <div class="sec"><h3>✨ いいところ</h3>${list(c.strengths)}</div><div class="sec"><h3>🙀 気をつけたいところ</h3>${list(c.cautions)}</div>
        <div class="sec"><h3>🧶 このタイプへの接し方</h3><p>${esc(x.howTo)}</p></div></div>`;
    el.onclick = e => { if (e.target === el || e.target.classList.contains("x-close")) el.remove(); };
    document.body.appendChild(el);
    setupRoll(el.querySelector(".modal-cat"));
}

function showGuide() {
    const old = document.getElementById("modal"); if (old) old.remove();
    const el = document.createElement("div"); el.id = "modal"; el.className = "modal";
    const axes = ["A", "B", "C", "D"].map(k => { const a = AXES[k]; return `<div class="guide-row"><code>${a.leftCode}</code>${a.left}（${a.leftHint}）<span style="color:var(--sub)">／</span><code>${a.rightCode}</code>${a.right}（${a.rightHint}）</div>`; }).join("");
    const types = Object.keys(CHARACTERS).map(code => `<div class="guide-row"><code>${code}</code>${esc(CHARACTERS[code].name)}</div>`).join("");
    el.innerHTML = `<div class="modal-box"><button class="x-close" aria-label="閉じる">×</button><p class="kicker">TYPE GUIDE</p><h3 class="title small">タイプ解説</h3>
        <p class="note">4つの軸の左右の組み合わせで、16タイプが決まります。</p>
        <div class="sec"><h3>🧭 4つの軸</h3>${["A", "B", "C", "D"].map((k, i) => `<p class="sub" style="margin:8px 0 0">${i + 1}文字目：${AXES[k].name}</p>${axes.split("</div>")[i]}</div>`).join("")}</div>
        <div class="sec"><h3>🐾 16タイプ一覧</h3>${types}</div></div>`;
    el.onclick = e => { if (e.target === el || e.target.classList.contains("x-close")) el.remove(); };
    document.body.appendChild(el);
}

document.getElementById("btnReset").onclick = () => { if (confirm("最初からやり直しますか？")) resetState(); };
document.getElementById("navDiagnosis").onclick = () => { state.step = isDone() ? "result" : (Object.keys(state.answers).length ? "quiz" : "intro"); if (state.step === "quiz") { const sq = shuffledQuestions(); const idx = sq.findIndex(q => !state.answers[q.id]); state.page = idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0; } render(); };
document.getElementById("navTypes").onclick = () => { state.step = "types"; render(); };
document.getElementById("navCompat").onclick = () => { ui.compatYou = myCode() || ui.compatYou; state.step = "compat"; render(); };
document.getElementById("navFortune").onclick = () => { ui.fortuneType = myCode() || ui.fortuneType; state.step = "fortune"; render(); };
document.getElementById("navGuide").onclick = showGuide;
loadState();
if (["types", "compat", "fortune"].includes(state.step)) state.step = isDone() ? "result" : "intro";
render();
