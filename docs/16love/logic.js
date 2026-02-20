const ANS_LABEL = { 1: "とても当てはまる", 2: "当てはまる", 3: "やや当てはまる", 4: "どちらでもない", 5: "やや当てはまらない", 6: "当てはまらない", 7: "全く当てはまらない" };
const STORAGE_KEY = "love_char_diag_v1";
const PAGE_SIZE = 5;
const state = { step: "intro", page: 0, answers: {}, questionOrder: null, profile: { name: "", email: "" }, sentToSheet: false };

function shuffleArray(a) { const s = [...a]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[s[i], s[j]] = [s[j], s[i]]; } return s; }
function getQuestionOrder() { if (state.questionOrder && state.questionOrder.length === QUESTIONS.length) return state.questionOrder; const idx = Array.from({ length: QUESTIONS.length }, (_, i) => i); state.questionOrder = shuffleArray(idx); saveState(); return state.questionOrder; }
function getShuffledQuestions() { return getQuestionOrder().map(i => QUESTIONS[i]); }
function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(state, JSON.parse(r)); } catch (e) { } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState() { state.step = "intro"; state.page = 0; state.answers = {}; state.questionOrder = null; state.profile = { name: "", email: "" }; state.sentToSheet = false; localStorage.removeItem(STORAGE_KEY); render(); }
function isRegistered() { return !!(state.profile && state.profile.name && state.profile.email); }
function isQuizCompleted() { return Object.keys(state.answers || {}).length >= QUESTIONS.length; }

function computeResult() {
    const raw = { A: 0, B: 0, C: 0, D: 0 }, cnt = { A: 0, B: 0, C: 0, D: 0 };
    for (const q of QUESTIONS) {
        const r = state.answers[q.id]; if (!r) continue;
        let t = 4 - r;
        if (q.reverse) t = -t;
        raw[q.axis] += t; cnt[q.axis]++;
    }
    const leftScore = {}, pos = {}, hard = {};
    ["A", "B", "C", "D"].forEach(k => {
        const maxT = cnt[k] * 3;
        const ls = maxT > 0 ? ((raw[k] + maxT) / (2 * maxT)) * 100 : 50;
        leftScore[k] = Math.round(Math.max(0, Math.min(100, ls)));
        pos[k] = 100 - leftScore[k];
        hard[k] = leftScore[k] >= 50 ? "L" : "R";
    });
    const menheraScore = 100 - leftScore.A;
    const level = 1 + Math.min(6, Math.floor(menheraScore / (100 / 7)));
    const menheraLevel = MENHERA_LEVELS[level - 1];
    const code = (hard.A === "L" ? AXES.A.leftCode : AXES.A.rightCode) + (hard.B === "L" ? AXES.B.leftCode : AXES.B.rightCode) + (hard.C === "L" ? AXES.C.leftCode : AXES.C.rightCode) + (hard.D === "L" ? AXES.D.leftCode : AXES.D.rightCode);
    const decisiveness = {};
    ["A", "B", "C", "D"].forEach(k => { decisiveness[k] = Math.abs(leftScore[k] - 50) / 50; });
    const confidenceLevel = {}, confidenceLabel = {};
    ["A", "B", "C", "D"].forEach(k => {
        const dv = decisiveness[k];
        if (dv >= 0.50) { confidenceLevel[k] = "strong"; confidenceLabel[k] = "はっきり"; }
        else if (dv >= 0.25) { confidenceLevel[k] = "moderate"; confidenceLabel[k] = "やや"; }
        else { confidenceLevel[k] = "mid"; confidenceLabel[k] = "場面による"; }
    });
    const midCount = Object.values(confidenceLevel).filter(v => v === "mid").length;
    const adjacentTypes = [];
    ["A", "B", "C", "D"].forEach(k => {
        if (confidenceLevel[k] === "mid") {
            const ah = { ...hard }; ah[k] = ah[k] === "L" ? "R" : "L";
            const ac = (ah.A === "L" ? AXES.A.leftCode : AXES.A.rightCode) + (ah.B === "L" ? AXES.B.leftCode : AXES.B.rightCode) + (ah.C === "L" ? AXES.C.leftCode : AXES.C.rightCode) + (ah.D === "L" ? AXES.D.leftCode : AXES.D.rightCode);
            if (CHARACTERS[ac] && ac !== code) adjacentTypes.push({ axis: k, code: ac, name: CHARACTERS[ac].name });
        }
    });
    return { hard, code, leftPct: leftScore, pos, menheraScore, level, menheraLevel, char: CHARACTERS[code], axes: AXES, decisiveness, confidenceLevel, confidenceLabel, midCount, adjacentTypes };
}

const app = document.getElementById("app");
document.getElementById("btnReset").onclick = () => { if (confirm("最初からやり直しますか？")) resetState(); };
document.getElementById("btnTypeGuide").onclick = () => { showTypeGuideModal(); };

function showTypeGuideModal() {
    const modalHtml = `<div class="char-modal-overlay" id="typeGuideOverlay"><div class="char-modal" style="max-width:700px;"><button class="char-modal-close" id="typeGuideClose">×</button><div style="text-align:center;margin-bottom:24px;"><p class="kicker">TYPE CODE GUIDE</p><h2 class="big" style="font-size:22px;margin-bottom:8px;">タイプコード解説</h2><p class="text-body" style="font-size:13px;">4文字のひらがなコードは、恋愛スタイルの4つの軸の傾向を表しています💜</p></div><div id="guideContent">${renderTypeGuideContent()}</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const overlay = document.getElementById('typeGuideOverlay');
    document.getElementById('typeGuideClose').onclick = () => { overlay.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => overlay.remove(), 200); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => overlay.remove(), 200); } };
}

function renderTypeGuideContent() {
    const axisData = [
        { key: "A", name: "恋愛メンヘラ度", l: "あ", lName: "余裕女子", lDesc: "恋しても崩れない", r: "ゆ", rName: "一途暴走", rDesc: "好きになると止まらない" },
        { key: "B", name: "恋の依存度", l: "じ", lName: "マイペース", lDesc: "一人でも平気", r: "つ", rName: "彼氏ガチ勢", rDesc: "彼の反応が命" },
        { key: "C", name: "恋のアピール度", l: "す", lName: "隠す派", lDesc: "恋は秘密主義", r: "も", rName: "匂わせ全開", rDesc: "ストーリーで匂わせ" },
        { key: "D", name: "失恋回復力", l: "ふ", lName: "即切り替え", lDesc: "次の恋にGO", r: "ひ", rName: "元カレ沼", rDesc: "ずっと引きずる" }
    ];
    return `<div style="display:grid;gap:16px;">${axisData.map(a => `<div class="info-card" style="margin:0;"><h3 style="color:var(--accent);margin-bottom:12px;">軸${a.key}：${a.name}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div style="background:var(--surface);padding:12px;border-radius:12px;border-left:4px solid #a78bfa;"><div style="font-size:24px;font-weight:700;color:#a78bfa;">${a.l}</div><div style="font-size:13px;font-weight:600;margin:4px 0;">${a.lName}</div><div style="font-size:11px;color:var(--text-sub);">${a.lDesc}</div></div><div style="background:var(--surface);padding:12px;border-radius:12px;border-left:4px solid #f472b6;"><div style="font-size:24px;font-weight:700;color:#f472b6;">${a.r}</div><div style="font-size:13px;font-weight:600;margin:4px 0;">${a.rName}</div><div style="font-size:11px;color:var(--text-sub);">${a.rDesc}</div></div></div></div>`).join("")}<div style="background:var(--surface);padding:16px;border-radius:12px;margin-top:8px;border:1px solid var(--line);"><div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--accent);">💡 コードの読み方</div><div style="font-size:12px;color:var(--text-sub);line-height:1.6;">例：<span style="font-family:monospace;background:var(--surface2);padding:2px 8px;border-radius:6px;font-weight:600;">ゆつもひ</span><br>→ 一途暴走(ゆ) + 彼氏ガチ勢(つ) + 匂わせ全開(も) + 元カレ沼(ひ)<br>→ 恋の悩み無限ループモビー</div></div></div>`;
}

document.getElementById("navDiagnosis").onclick = e => { e.preventDefault(); if (isQuizCompleted()) { state.step = "result"; render(); } else { state.step = "intro"; render(); } };
document.getElementById("navCharacters").onclick = e => { e.preventDefault(); state.step = "characters"; render(); };
function updateNavActive() { const isD = ["intro", "quiz", "gate", "result"].includes(state.step); document.getElementById("navDiagnosis").classList.toggle("active", isD); document.getElementById("navCharacters").classList.toggle("active", state.step === "characters"); }
function render() { window.scrollTo(0, 0); updateNavActive(); if (state.step === "intro") renderIntro(); else if (state.step === "quiz") renderQuiz(); else if (state.step === "gate") renderGate(); else if (state.step === "characters") renderCharacters(); else renderResult(); }

function renderIntro() {
    const c = Object.keys(state.answers).length;
    app.innerHTML = `<div class="panel fade-in" style="text-align:center;padding:60px 20px;"><p class="kicker">恋愛メンヘラ度診断</p><h2 class="big">あなたの恋愛メンヘラタイプを<br>診断しよう😈💜</h2><p class="text-body" style="max-width:400px;margin:0 auto 16px;">好きな人への既読チェック、匂わせストーリー、失恋後の元カレSNSチェック…40問の恋愛シーンから、あなたの恋愛メンヘラ度とタイプを16種類で診断！</p><div style="max-width:400px;margin:0 auto 30px;padding:12px 18px;background:rgba(244,114,182,0.12);border:2px solid #f472b6;border-radius:12px;"><p style="margin:0;font-size:13px;font-weight:700;color:#f472b6;">⚠️ メンヘラ以外は診断しないでください</p></div><button class="primary" id="btnStart" style="padding:16px 32px;font-size:16px;">${c > 0 ? "診断を再開する" : "診断をはじめる"}</button>${c > 0 ? `<p style="font-size:12px;color:var(--text-sub);margin-top:16px;">${c}/40問 回答済み</p>` : ""}</div>`;
    document.getElementById("btnStart").onclick = () => { state.step = "quiz"; getQuestionOrder(); if (c > 0) { const sq = getShuffledQuestions(); const idx = sq.findIndex(q => !state.answers[q.id]); state.page = idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0; } render(); };
}

function renderQuiz() {
    const sq = getShuffledQuestions(), start = state.page * PAGE_SIZE, cqs = sq.slice(start, start + PAGE_SIZE), tp = Math.ceil(sq.length / PAGE_SIZE), prog = Math.round((Object.keys(state.answers).length / sq.length) * 100);
    const qh = cqs.map((q, i) => { const v = state.answers[q.id]; return `<div class="qCard fade-in" style="animation-delay:${i * 0.05}s"><div class="kicker" style="color:var(--text-sub);margin-bottom:4px;">Q${start + i + 1}</div><p class="qText">${q.text}</p><div class="likert7"><div class="likert-labels"><span class="left">とても当てはまる</span><span class="right">全く当てはまらない</span></div><div class="likert-buttons">${[1, 2, 3, 4, 5, 6, 7].map(n => { const s = n <= 3 ? "left" : (n === 4 ? "mid" : "right"); const sel = v === n ? "selected" : ""; return `<button type="button" class="likert-btn ${s} ${sel}" data-i="${n}" data-qid="${q.id}" data-val="${n}"></button>`; }).join("")}</div></div></div>`; }).join("");
    app.innerHTML = `<div class="panel"><div class="progress-wrap"><div class="progress-meta"><span>進行状況</span><span>${prog}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${prog}%"></div></div></div><div style="margin-top:30px;">${qh}</div><div style="display:flex;justify-content:space-between;margin-top:30px;"><button id="btnPrev" ${state.page === 0 ? "disabled" : ""}>戻る</button><button class="primary" id="btnNext">${state.page === tp - 1 ? "結果を見る" : "次へ"}</button></div></div>`;
    cqs.forEach(q => { document.querySelectorAll(`button.likert-btn[data-qid="${q.id}"]`).forEach(btn => { btn.onclick = () => { state.answers[q.id] = parseInt(btn.dataset.val); document.querySelectorAll(`button.likert-btn[data-qid="${q.id}"]`).forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); saveState(); const p = Math.round((Object.keys(state.answers).length / sq.length) * 100); document.querySelector(".progress-fill").style.width = p + "%"; document.querySelector(".progress-meta span:last-child").innerText = p + "%"; }; }); });
    document.getElementById("btnPrev").onclick = () => { state.page--; render(); };
    document.getElementById("btnNext").onclick = () => { const m = cqs.find(q => !state.answers[q.id]); if (m) { alert("まだ回答していない項目があります"); return; } if (state.page < tp - 1) { state.page++; render(); } else { if (isRegistered()) { state.step = "result"; } else { state.step = "gate"; } render(); } };
}

function renderGate() {
    if (isRegistered()) { state.step = "result"; saveState(); render(); return; }
    const res = computeResult();
    app.innerHTML = `<div class="panel fade-in"><p class="kicker">あと少しで結果が見れます！</p><h2 class="big">結果の閲覧には登録が必要です</h2><p class="text-body" style="margin-top:-6px;">入力後すぐにあなたの恋愛メンヘラタイプを表示します💜</p><div style="margin-top:22px;display:grid;gap:12px;max-width:520px;"><div><div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">ニックネーム</div><input id="regName" type="text" placeholder="例）るな" style="width:100%;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:14px;"></div><div><div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">メールアドレス</div><input id="regEmail" type="email" placeholder="example@gmail.com" style="width:100%;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:14px;"></div><label style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:var(--text-sub);"><input id="regConsent" type="checkbox" style="margin-top:3px;"><span>入力した情報を連絡・改善のために保存することに同意します。</span></label><div id="regErr" style="display:none;color:var(--danger);font-size:12px;"></div><div style="display:flex;gap:10px;margin-top:8px;"><button id="btnGateBack" style="background:transparent;color:var(--text-sub);">戻る</button><button class="primary" id="btnGateGo" style="flex:1;padding:14px 18px;">結果を見る</button></div><div style="margin-top:10px;font-size:11px;color:var(--text-sub);">送信される内容：ニックネーム、メール、診断TYPE（${res.code}）</div></div></div>`;
    const nameEl = document.getElementById("regName"), emailEl = document.getElementById("regEmail");
    nameEl.value = state.profile?.name || ""; emailEl.value = state.profile?.email || "";
    document.getElementById("btnGateBack").onclick = () => { state.step = "quiz"; saveState(); render(); };
    document.getElementById("btnGateGo").onclick = () => {
        const errEl = document.getElementById("regErr"); errEl.style.display = "none";
        const name = (nameEl.value || "").trim(), email = (emailEl.value || "").trim(), consent = document.getElementById("regConsent").checked;
        if (!name) { errEl.textContent = "ニックネームを入力してください"; errEl.style.display = "block"; return; }
        if (!email) { errEl.textContent = "メールアドレスを入力してください"; errEl.style.display = "block"; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "メールアドレスを正しく入力してください"; errEl.style.display = "block"; return; }
        if (!consent) { errEl.textContent = "同意にチェックしてください"; errEl.style.display = "block"; return; }
        state.profile = { name, email }; state.step = "result"; saveState(); render();
    };
}

function renderResult() {
    const res = computeResult(), ch = res.char;
    if (!state.sentToSheet && state.profile && state.profile.name) {
        state.sentToSheet = true; saveState();
        try {
            const questionAnswers = {}; QUESTIONS.forEach(q => { if (state.answers[q.id]) questionAnswers[q.id] = state.answers[q.id]; });
            const payload = { name: state.profile.name, email: state.profile.email, type: res.code, axes: res.leftPct, answers: questionAnswers, source: "16love", menheraScore: res.menheraScore, menheraLevel: res.level, createdAt: new Date().toISOString() };
            submitLead(payload).catch(e => console.error("[Love] Lead failed:", e));
            submitDiagnosis({ ...payload, diagnosis_type: ch ? ch.name : res.code }).catch(e => console.error("[Love] Diag failed:", e));
        } catch (e) { console.error("[Love] API error:", e); }
    }
    const gaugeColor = res.menheraScore <= 30 ? "#4ade80" : res.menheraScore <= 60 ? "#facc15" : "#f472b6";
    const axisHtml = ["A", "B", "C", "D"].map(k => {
        const ax = AXES[k], left = res.leftPct[k], right = 100 - left, conf = res.confidenceLabel[k], confLev = res.confidenceLevel[k];
        const confColor = confLev === "strong" ? "#a78bfa" : confLev === "moderate" ? "#f0a020" : "#f472b6";
        const winSide = res.hard[k] === "L" ? ax.left : ax.right;
        return `<div class="axis-row"><span class="axis-name">${ax.name}</span><div class="axis-labels"><span>${ax.left}</span><span>${ax.right}</span></div><div class="axis-track"><div class="axis-center"></div><div class="axis-dot" style="left:${res.pos[k]}%"></div></div><div class="axis-meta"><span>${ax.left} ${left}%</span><span style="color:${confColor};font-weight:600;">${conf === "場面による" ? "⚖️ 場面による" : conf === "やや" ? `→ やや${winSide}寄り` : `✓ ${winSide}寄り`}</span><span>${ax.right} ${right}%</span></div></div>`;
    }).join("");
    const adjHtml = res.adjacentTypes.length > 0 ? `<div style="margin-top:24px;padding:16px;background:var(--surface2);border-radius:14px;border-left:4px solid #f472b6;"><p style="font-size:13px;font-weight:600;color:#f472b6;margin:0 0 8px;">⚖️ 場面によっては…</p><p style="font-size:13px;margin:0;line-height:1.6;">${res.adjacentTypes.map(t => `<span style="background:var(--surface);padding:2px 8px;border-radius:6px;margin-right:4px;">『${t.name}』</span>`).join("")}の傾向が出ることもあります。</p></div>` : "";
    const toughHtml = ch.tough ? ch.tough.map(t => `<li>${t}</li>`).join("") : "";
    const strengthsHtml = ch.strengths ? ch.strengths.map(s => `<li>${s}</li>`).join("") : "";
    const cautionsHtml = ch.cautions ? ch.cautions.map(c => `<li>${c}</li>`).join("") : "";
    const adviceHtml = ch.advice ? ch.advice.map((a, i) => `<li>${a}</li>`).join("") : "";
    const shareText = encodeURIComponent(`恋愛メンヘラモビー診断の結果は「${ch.name}」でした！😈💜\n恋愛メンヘラ度：Lv${res.level}（${res.menheraLevel.name}）\n${ch.catch}\n\n好きな人への重さ、あなたも診断してみて👇`);
    const shareUrl = encodeURIComponent(window.location.href.split("?")[0]);
    app.innerHTML = `<div class="panel fade-in"><div class="result-hero"><p class="kicker">診断結果</p><h2 class="big" style="font-size:28px;">${ch.name}</h2><p class="text-body" style="color:var(--text-main);font-weight:600;font-size:16px;margin-bottom:16px;">${ch.catch}</p><div class="char-image-placeholder"><img src="img/${res.code}.jpg" alt="${ch.name}" onerror="this.parentElement.textContent='画像準備中'"></div><div style="display:inline-block;background:var(--surface2);padding:6px 16px;border-radius:20px;font-size:12px;font-family:monospace;color:var(--text-sub);">TYPE: ${res.code}</div></div>
  <div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(244,114,182,0.15));border-radius:16px;border:1px solid var(--accent);text-align:center;"><p style="font-size:11px;font-weight:700;color:var(--accent);margin:0 0 8px;">😈💜 恋愛メンヘラ度</p><p style="font-size:36px;font-weight:700;margin:0 0 4px;color:${gaugeColor};">Lv.${res.level}</p><p style="font-size:18px;font-weight:600;margin:0 0 12px;color:var(--text-main);">${res.menheraLevel.name}</p><p style="font-size:13px;color:var(--text-sub);margin:0 0 16px;">${res.menheraLevel.desc}</p><div class="menhera-gauge-bar"><div class="menhera-gauge-fill" style="width:${res.menheraScore}%;background:linear-gradient(90deg,#4ade80,#facc15,#f472b6);"></div></div><div class="menhera-gauge-labels"><span>メンタル鉄壁</span><span>恋愛ゾンビ</span></div></div>
  <div style="margin-top:40px;"><p class="kicker" style="margin-bottom:16px;">4つの軸の傾向</p>${axisHtml}</div>${adjHtml}</div>
  <div class="panel fade-in" style="margin-top:24px;"><p class="kicker" style="margin-bottom:16px;">🎭 あなたのタイプ</p><p class="text-body" style="font-size:15px;line-height:1.9;margin:0;color:var(--text-main);">${ch.hook}</p></div>
  ${toughHtml ? `<div class="panel fade-in" style="margin-top:24px;background:linear-gradient(135deg,#1f1520,var(--surface));border-left:4px solid #ff5a5a;"><p class="kicker" style="margin-bottom:16px;color:#ff5a5a;">😣 しんどい時</p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8;">${toughHtml}</ul></div>` : ""}
  ${ch.seen ? `<div class="panel fade-in" style="margin-top:24px;background:linear-gradient(135deg,#151a25,var(--surface));border-left:4px solid #4dabf7;"><p class="kicker" style="margin-bottom:16px;color:#4dabf7;">👀 周りからの見え方</p><p class="text-body" style="font-size:15px;line-height:1.8;margin:0;color:var(--text-main);">${ch.seen}</p></div>` : ""}
  <div class="card-grid"><div class="info-card"><h3>✨ 長所</h3><ul>${strengthsHtml}</ul></div><div class="info-card"><h3>⚡ 注意点</h3><ul>${cautionsHtml}</ul></div></div>
  ${adviceHtml ? `<div class="panel fade-in" style="margin-top:24px;background:linear-gradient(135deg,#151f1a,var(--surface));border-left:4px solid #4ade80;"><p class="kicker" style="margin-bottom:16px;color:#4ade80;">💡 アドバイス</p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8;">${adviceHtml}</ul></div>` : ""}
  <div class="panel fade-in" style="margin-top:40px;text-align:center;"><p class="kicker" style="margin-bottom:12px;">📱 結果をシェアして話題にしよう！</p><div class="share-buttons"><a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener" style="text-decoration:none;"><button class="share-btn share-x">𝕏 でシェア</button></a><a href="https://social-plugins.line.me/lineit/share?url=${shareUrl}&text=${shareText}" target="_blank" rel="noopener" style="text-decoration:none;"><button class="share-btn share-line">LINEで送る</button></a></div></div>`;
}

function renderCharacters() {
    const keys = Object.keys(CHARACTERS).sort();
    const html = keys.map(code => { const ch = CHARACTERS[code]; return `<div class="char-card fade-in"><div class="char-card-image"><img src="img/${code}.jpg" alt="${ch.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';"></div><div class="char-card-type">TYPE: ${code}</div><h3 class="char-card-name">${ch.name}</h3><p class="char-card-desc">${ch.catch}</p><button class="primary" style="width:100%;font-size:12px;margin-top:auto;" data-code="${code}">詳細</button></div>`; }).join("");
    app.innerHTML = `<div class="panel fade-in"><p class="kicker">全16タイプ</p><h2 class="big">キャラクター一覧</h2><p class="text-body" style="margin-bottom:20px;">4つの恋愛軸の組み合わせで生まれる、16種類の恋愛メンヘラタイプ💜</p></div><div class="char-grid">${html}</div>`;
    document.querySelectorAll('button[data-code]').forEach(btn => { btn.onclick = () => showCharDetail(btn.dataset.code); });
}

function showCharDetail(code) {
    const ch = CHARACTERS[code];
    const toughHtml = ch.tough ? ch.tough.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join("") : "";
    const strengthsHtml = ch.strengths ? ch.strengths.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join("") : "";
    const cautionsHtml = ch.cautions ? ch.cautions.map(c => `<li style="margin-bottom:4px;">${c}</li>`).join("") : "";
    const adviceHtml = ch.advice ? ch.advice.map(a => `<li style="margin-bottom:4px;">${a}</li>`).join("") : "";
    const m = `<div class="char-modal-overlay" id="cmo"><div class="char-modal"><button class="char-modal-close" id="cmc">×</button><div style="text-align:center;margin-bottom:20px;"><div style="width:200px;height:200px;border-radius:16px;overflow:hidden;margin:0 auto 24px;background:var(--surface2);"><img src="img/${code}.jpg" alt="${ch.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';"></div><div style="display:inline-block;background:var(--surface2);padding:6px 16px;border-radius:12px;font-size:12px;font-family:monospace;color:var(--text-sub);margin-bottom:16px;">TYPE: ${code}</div><h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">${ch.name}</h2><p style="font-size:14px;font-weight:600;margin:0;">${ch.catch}</p></div>
  ${ch.hook ? `<div style="margin-bottom:20px;"><h3 style="font-size:14px;font-weight:700;color:var(--accent);margin:0 0 8px;">🎭 タイプの特徴</h3><p style="font-size:13px;line-height:1.8;margin:0;">${ch.hook}</p></div>` : ""}
  ${toughHtml ? `<div style="margin-bottom:20px;padding:12px;background:rgba(255,90,90,0.05);border-radius:12px;border-left:3px solid #ff5a5a;"><h3 style="font-size:14px;font-weight:700;color:#ff5a5a;margin:0 0 8px;">😣 しんどい時</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;">${toughHtml}</ul></div>` : ""}
  ${ch.seen ? `<div style="margin-bottom:20px;padding:12px;background:rgba(77,171,247,0.05);border-radius:12px;border-left:3px solid #4dabf7;"><h3 style="font-size:14px;font-weight:700;color:#4dabf7;margin:0 0 8px;">👀 周りからの見え方</h3><p style="font-size:13px;line-height:1.8;margin:0;">${ch.seen}</p></div>` : ""}
  <div style="display:grid;gap:12px;margin-top:20px;"><div style="padding:12px;background:var(--surface2);border-radius:12px;"><h3 style="font-size:13px;font-weight:700;margin:0 0 6px;">✨ 長所</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">${strengthsHtml}</ul></div><div style="padding:12px;background:var(--surface2);border-radius:12px;"><h3 style="font-size:13px;font-weight:700;margin:0 0 6px;">⚡ 注意点</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">${cautionsHtml}</ul></div></div>
  ${adviceHtml ? `<div style="margin-top:20px;padding:12px;background:rgba(74,222,128,0.05);border-radius:12px;border-left:3px solid #4ade80;"><h3 style="font-size:14px;font-weight:700;color:#4ade80;margin:0 0 8px;">💡 アドバイス</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;">${adviceHtml}</ul></div>` : ""}</div></div>`;
    document.body.insertAdjacentHTML("beforeend", m);
    const ov = document.getElementById("cmo");
    document.getElementById("cmc").onclick = () => { ov.style.animation = "fadeOut 0.2s ease forwards"; setTimeout(() => ov.remove(), 200); };
    ov.onclick = e => { if (e.target === ov) { ov.style.animation = "fadeOut 0.2s ease forwards"; setTimeout(() => ov.remove(), 200); } };
}

loadState(); render();
