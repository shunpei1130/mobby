const ANS_LABEL = { 1: "매우 그렇다", 2: "그렇다", 3: "약간 그렇다", 4: "보통이다", 5: "약간 아니다", 6: "아니다", 7: "전혀 아니다" };
const STORAGE_KEY = "love_char_diag_korea_v1";
const PAGE_SIZE = 5;
const state = { step: "intro", page: 0, answers: {}, questionOrder: null, profile: { name: "", email: "" }, sentToSheet: false };
const GAS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzu8ZWwvtKHWIwqnjqlKkdbPTWN1o7oSxpsBZ-Crdv6zlmCbSeWFlMDZ3sjU9SgCsFOgQ/exec";

function buildStripeSheetPayload(res, extraPayload = {}) {
    const questionAnswers = {};
    QUESTIONS.forEach(q => { if (state.answers[q.id]) questionAnswers[q.id] = state.answers[q.id]; });
    let storageRaw = "";
    try { storageRaw = localStorage.getItem(STORAGE_KEY) || ""; } catch (_) { }
    let stateSnapshot = null;
    try { stateSnapshot = JSON.parse(JSON.stringify(state)); } catch (_) { stateSnapshot = state; }
    return {
        event: "stripe_click",
        source: "korea",
        createdAt: new Date().toISOString(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        name: state.profile?.name || "",
        email: state.profile?.email || "",
        type: res?.code || "",
        diagnosisName: res?.char?.name || "",
        menheraScore: res?.menheraScore ?? "",
        menheraLevel: res?.level ?? "",
        axes: res?.leftPct || {},
        answers: questionAnswers,
        storageKey: STORAGE_KEY,
        storageRaw,
        stateSnapshot,
        ...extraPayload
    };
}

function sendToGoogleSheet(payload) {
    if (!GAS_WEBAPP_URL) return;
    try {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
            const blob = new Blob([body], { type: "text/plain" });
            navigator.sendBeacon(GAS_WEBAPP_URL, blob);
            return;
        }
        fetch(GAS_WEBAPP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "text/plain" },
            body,
            keepalive: true
        }).catch(() => { });
    } catch (_) { }
}

function shuffleArray(a) { const s = [...a]; for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[s[i], s[j]] = [s[j], s[i]]; } return s; }
function getQuestionOrder() { if (state.questionOrder && state.questionOrder.length === QUESTIONS.length) return state.questionOrder; const idx = Array.from({ length: QUESTIONS.length }, (_, i) => i); state.questionOrder = shuffleArray(idx); saveState(); return state.questionOrder; }
function getShuffledQuestions() { return getQuestionOrder().map(i => QUESTIONS[i]); }
function loadState() { try { const r = localStorage.getItem(STORAGE_KEY); if (r) Object.assign(state, JSON.parse(r)); } catch (e) { } }
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function resetState() { state.step = "intro"; state.page = 0; state.answers = {}; state.questionOrder = null; state.profile = { name: "", email: "" }; state.sentToSheet = false; localStorage.removeItem(STORAGE_KEY); render(); }
function isRegistered() { return !!(state.profile && state.profile.name && state.profile.email); }
function isQuizCompleted() { return Object.keys(state.answers || {}).length >= QUESTIONS.length; }
const SNS_IMAGE_CODE_ALIAS = { "ゆつすひ": "ゆつふひ" };
const TYPE_CODE_KO_MAP = { "あ": "아", "ゆ": "유", "じ": "지", "つ": "츠", "す": "스", "も": "모", "ふ": "후", "ひ": "히" };
function toDisplayTypeCode(code) {
    return String(code || "").split("").map(ch => TYPE_CODE_KO_MAP[ch] || ch).join("");
}
function getSnsImagePathByCode(code) {
    if (!code) return "";
    const resolvedCode = SNS_IMAGE_CODE_ALIAS[code] || code;
    return `img/sns/${encodeURIComponent(resolvedCode)}.png`;
}
function sanitizeDownloadName(name) { return (name || "mobby-result").replace(/[\\/:*?"<>|]/g, "_"); }
function isIOSLikeDevice() { return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); }

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
        if (dv >= 0.50) { confidenceLevel[k] = "strong"; confidenceLabel[k] = "확실히"; }
        else if (dv >= 0.25) { confidenceLevel[k] = "moderate"; confidenceLabel[k] = "약간"; }
        else { confidenceLevel[k] = "mid"; confidenceLabel[k] = "상황에 따라"; }
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
document.getElementById("btnReset").onclick = () => { if (confirm("처음부터 다시 하시겠습니까?")) resetState(); };
document.getElementById("btnTypeGuide").onclick = () => { showTypeGuideModal(); };

function showTypeGuideModal() {
    const modalHtml = `<div class="char-modal-overlay" id="typeGuideOverlay"><div class="char-modal" style="max-width:700px;"><button class="char-modal-close" id="typeGuideClose">×</button><div style="text-align:center;margin-bottom:24px;"><p class="kicker">TYPE CODE GUIDE</p><h2 class="big" style="font-size:22px;margin-bottom:8px;">타입 코드 해설</h2><p class="text-body" style="font-size:13px;">4글자 타입 코드는 연애 스타일의 4가지 축 경향을 나타냅니다💜</p></div><div id="guideContent">${renderTypeGuideContent()}</div></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const overlay = document.getElementById('typeGuideOverlay');
    document.getElementById('typeGuideClose').onclick = () => { overlay.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => overlay.remove(), 200); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.style.animation = 'fadeOut 0.2s ease forwards'; setTimeout(() => overlay.remove(), 200); } };
}

function renderTypeGuideContent() {
    const axisData = [
        { key: "A", name: "연애 멘헤라도", l: toDisplayTypeCode("あ"), lName: "여유파", lDesc: "연애해도 무너지지 않아", r: toDisplayTypeCode("ゆ"), rName: "한결같은 폭주", rDesc: "좋아하면 멈출 수 없어" },
        { key: "B", name: "연애 의존도", l: toDisplayTypeCode("じ"), lName: "마이페이스", lDesc: "혼자여도 괜찮아", r: toDisplayTypeCode("つ"), rName: "남친 진심파", rDesc: "그의 반응이 생명" },
        { key: "C", name: "연애 어필도", l: toDisplayTypeCode("す"), lName: "숨기는 파", lDesc: "연애는 비밀주의", r: toDisplayTypeCode("も"), rName: "어필 전개", rDesc: "스토리로 은근히 어필" },
        { key: "D", name: "이별 회복력", l: toDisplayTypeCode("ふ"), lName: "즉시 전환", lDesc: "다음 연애로 GO", r: toDisplayTypeCode("ひ"), rName: "전남친 늪", rDesc: "계속 끌어안고 가" }
    ];
    return `<div style="display:grid;gap:16px;">${axisData.map(a => `<div class="info-card" style="margin:0;"><h3 style="color:var(--accent);margin-bottom:12px;">축${a.key}：${a.name}</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><div style="background:var(--surface);padding:12px;border-radius:12px;border-left:4px solid #a78bfa;"><div style="font-size:24px;font-weight:700;color:#a78bfa;">${a.l}</div><div style="font-size:13px;font-weight:600;margin:4px 0;">${a.lName}</div><div style="font-size:11px;color:var(--text-sub);">${a.lDesc}</div></div><div style="background:var(--surface);padding:12px;border-radius:12px;border-left:4px solid #f472b6;"><div style="font-size:24px;font-weight:700;color:#f472b6;">${a.r}</div><div style="font-size:13px;font-weight:600;margin:4px 0;">${a.rName}</div><div style="font-size:11px;color:var(--text-sub);">${a.rDesc}</div></div></div></div>`).join("")}<div style="background:var(--surface);padding:16px;border-radius:12px;margin-top:8px;border:1px solid var(--line);"><div style="font-size:13px;font-weight:600;margin-bottom:8px;color:var(--accent);">💡 코드 읽는 법</div><div style="font-size:12px;color:var(--text-sub);line-height:1.6;">예：<span style="font-family:monospace;background:var(--surface2);padding:2px 8px;border-radius:6px;font-weight:600;">${toDisplayTypeCode("ゆつもひ")}</span><br>→ 한결같은 폭주(유) + 남친 진심파(츠) + 어필 전개(모) + 전남친 늪(히)<br>→ 연애 고민 무한 루프 모비</div></div></div>`;
}

document.getElementById("navDiagnosis").onclick = e => { e.preventDefault(); if (isQuizCompleted()) { state.step = "result"; render(); } else { state.step = "intro"; render(); } };
document.getElementById("navCharacters").onclick = e => { e.preventDefault(); state.step = "characters"; render(); };
function updateNavActive() { const isD = ["intro", "quiz", "gate", "result"].includes(state.step); document.getElementById("navDiagnosis").classList.toggle("active", isD); document.getElementById("navCharacters").classList.toggle("active", state.step === "characters"); }
function render() { window.scrollTo(0, 0); updateNavActive(); if (state.step === "intro") renderIntro(); else if (state.step === "quiz") renderQuiz(); else if (state.step === "gate") renderGate(); else if (state.step === "characters") renderCharacters(); else renderResult(); }

function renderIntro() {
    const c = Object.keys(state.answers).length;
    app.innerHTML = `<div class="panel fade-in" style="text-align:center;padding:60px 20px;"><p class="kicker">연애 멘헤라도 진단</p><h2 class="big">당신의 연애 멘헤라 타입을<br>진단해보자😈💜</h2><p class="text-body" style="max-width:400px;margin:0 auto 16px;">좋아하는 사람에게 읽음 확인, 은근히 드러내는 스토리, 이별 후 전남친 SNS 확인…40문항의 연애 상황에서 당신의 연애 멘헤라도와 타입을 16가지로 진단!</p><div style="max-width:400px;margin:0 auto 30px;padding:12px 18px;background:rgba(244,114,182,0.12);border:2px solid #f472b6;border-radius:12px;"><p style="margin:0;font-size:13px;font-weight:700;color:#f472b6;">⚠️ 멘헤라가 아니면 진단하지 마세요</p></div><button class="primary" id="btnStart" style="padding:16px 32px;font-size:16px;">${c > 0 ? "진단 재개하기" : "진단 시작하기"}</button>${c > 0 ? `<p style="font-size:12px;color:var(--text-sub);margin-top:16px;">${c}/40문항 답변 완료</p>` : ""}</div>`;
    document.getElementById("btnStart").onclick = () => { state.step = "quiz"; getQuestionOrder(); if (c > 0) { const sq = getShuffledQuestions(); const idx = sq.findIndex(q => !state.answers[q.id]); state.page = idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0; } render(); };
}

function renderQuiz() {
    const sq = getShuffledQuestions(), start = state.page * PAGE_SIZE, cqs = sq.slice(start, start + PAGE_SIZE), tp = Math.ceil(sq.length / PAGE_SIZE), prog = Math.round((Object.keys(state.answers).length / sq.length) * 100);
    const qh = cqs.map((q, i) => { const v = state.answers[q.id]; return `<div class="qCard fade-in" style="animation-delay:${i * 0.05}s"><div class="kicker" style="color:var(--text-sub);margin-bottom:4px;">Q${start + i + 1}</div><p class="qText">${q.text}</p><div class="likert7"><div class="likert-labels"><span class="left">매우 그렇다</span><span class="right">전혀 아니다</span></div><div class="likert-buttons">${[1, 2, 3, 4, 5, 6, 7].map(n => { const s = n <= 3 ? "left" : (n === 4 ? "mid" : "right"); const sel = v === n ? "selected" : ""; return `<button type="button" class="likert-btn ${s} ${sel}" data-i="${n}" data-qid="${q.id}" data-val="${n}"></button>`; }).join("")}</div></div></div>`; }).join("");
    app.innerHTML = `<div class="panel"><div class="progress-wrap"><div class="progress-meta"><span>진행 상황</span><span>${prog}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${prog}%"></div></div></div><div style="margin-top:30px;">${qh}</div><div style="display:flex;justify-content:space-between;margin-top:30px;"><button id="btnPrev" ${state.page === 0 ? "disabled" : ""}>이전</button><button class="primary" id="btnNext">${state.page === tp - 1 ? "결과 보기" : "다음"}</button></div></div>`;
    cqs.forEach(q => { document.querySelectorAll(`button.likert-btn[data-qid="${q.id}"]`).forEach(btn => { btn.onclick = () => { state.answers[q.id] = parseInt(btn.dataset.val); document.querySelectorAll(`button.likert-btn[data-qid="${q.id}"]`).forEach(b => b.classList.remove("selected")); btn.classList.add("selected"); saveState(); const p = Math.round((Object.keys(state.answers).length / sq.length) * 100); document.querySelector(".progress-fill").style.width = p + "%"; document.querySelector(".progress-meta span:last-child").innerText = p + "%"; }; }); });
    document.getElementById("btnPrev").onclick = () => { state.page--; render(); };
    document.getElementById("btnNext").onclick = () => { const m = cqs.find(q => !state.answers[q.id]); if (m) { alert("아직 답변하지 않은 항목이 있습니다"); return; } if (state.page < tp - 1) { state.page++; render(); } else { if (isRegistered()) { state.step = "result"; } else { state.step = "gate"; } render(); } };
}

function renderGate() {
    if (isRegistered()) { state.step = "result"; saveState(); render(); return; }
    const res = computeResult();
    app.innerHTML = `<div class="panel fade-in"><p class="kicker">결과까지 조금만 더!</p><h2 class="big">결과를 보려면 등록이 필요합니다</h2><p class="text-body" style="margin-top:-6px;">입력 후 바로 당신의 연애 멘헤라 타입을 표시합니다💜</p><div style="margin-top:22px;display:grid;gap:12px;max-width:520px;"><div><div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">닉네임</div><input id="regName" type="text" placeholder="예) 루나" style="width:100%;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:14px;"></div><div><div style="font-size:12px;color:var(--text-sub);margin-bottom:6px;">이메일</div><input id="regEmail" type="email" placeholder="example@gmail.com" style="width:100%;padding:14px;border-radius:14px;border:1px solid var(--line);background:var(--surface2);color:var(--text-main);font-size:14px;"></div><label style="display:flex;gap:10px;align-items:flex-start;font-size:12px;color:var(--text-sub);"><input id="regConsent" type="checkbox" style="margin-top:3px;"><span>입력한 정보를 연락·개선을 위해 저장하는 것에 동의합니다.</span></label><div id="regErr" style="display:none;color:var(--danger);font-size:12px;"></div><div style="display:flex;gap:10px;margin-top:8px;"><button id="btnGateBack" style="background:transparent;color:var(--text-sub);">이전</button><button class="primary" id="btnGateGo" style="flex:1;padding:14px 18px;">결과 보기</button></div><div style="margin-top:10px;font-size:11px;color:var(--text-sub);">전송 내용: 닉네임, 이메일, 진단 TYPE（${toDisplayTypeCode(res.code)}）</div></div></div>`;
    const nameEl = document.getElementById("regName"), emailEl = document.getElementById("regEmail");
    nameEl.value = state.profile?.name || ""; emailEl.value = state.profile?.email || "";
    document.getElementById("btnGateBack").onclick = () => { state.step = "quiz"; saveState(); render(); };
    document.getElementById("btnGateGo").onclick = () => {
        const errEl = document.getElementById("regErr"); errEl.style.display = "none";
        const name = (nameEl.value || "").trim(), email = (emailEl.value || "").trim(), consent = document.getElementById("regConsent").checked;
        if (!name) { errEl.textContent = "닉네임을 입력해주세요"; errEl.style.display = "block"; return; }
        if (!email) { errEl.textContent = "이메일을 입력해주세요"; errEl.style.display = "block"; return; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "이메일을 올바르게 입력해주세요"; errEl.style.display = "block"; return; }
        if (!consent) { errEl.textContent = "동의에 체크해주세요"; errEl.style.display = "block"; return; }
        state.profile = { name, email }; state.step = "result"; saveState(); render();
    };
}

function renderResult() {
    const res = computeResult(), ch = res.char;
    const charImgName = ch.imgName || ch.name;
    if (!state.sentToSheet && state.profile && state.profile.name) {
        state.sentToSheet = true; saveState();
        try {
            const questionAnswers = {}; QUESTIONS.forEach(q => { if (state.answers[q.id]) questionAnswers[q.id] = state.answers[q.id]; });
            const payload = { name: state.profile.name, email: state.profile.email, type: res.code, axes: res.leftPct, answers: questionAnswers, source: "korea", menheraScore: res.menheraScore, menheraLevel: res.level, createdAt: new Date().toISOString() };
            submitLead(payload).catch(e => console.error("[Love] Lead failed:", e));
            submitDiagnosis({ ...payload, diagnosis_type: ch ? ch.name : res.code }).catch(e => console.error("[Love] Diag failed:", e));
        } catch (e) { console.error("[Love] API error:", e); }
    }
    const gaugeColor = res.menheraScore <= 30 ? "#4ade80" : res.menheraScore <= 60 ? "#facc15" : "#f472b6";
    const axisHtml = ["A", "B", "C", "D"].map(k => {
        const ax = AXES[k], left = res.leftPct[k], right = 100 - left, conf = res.confidenceLabel[k], confLev = res.confidenceLevel[k];
        const confColor = confLev === "strong" ? "#a78bfa" : confLev === "moderate" ? "#f0a020" : "#f472b6";
        const winSide = res.hard[k] === "L" ? ax.left : ax.right;
        return `<div class="axis-row"><span class="axis-name">${ax.name}</span><div class="axis-labels"><span>${ax.left}</span><span>${ax.right}</span></div><div class="axis-track"><div class="axis-center"></div><div class="axis-dot" style="left:${res.pos[k]}%"></div></div><div class="axis-meta"><span>${ax.left} ${left}%</span><span style="color:${confColor};font-weight:600;">${conf === "상황에 따라" ? "⚖️ 상황에 따라" : conf === "약간" ? `→ 약간 ${winSide} 쪽` : `✓ ${winSide} 쪽`}</span><span>${ax.right} ${right}%</span></div></div>`;
    }).join("");
    const adjHtml = res.adjacentTypes.length > 0 ? `<div style="margin-top:24px;padding:16px;background:var(--surface2);border-radius:14px;border-left:4px solid #f472b6;"><p style="font-size:13px;font-weight:600;color:#f472b6;margin:0 0 8px;">⚖️ 상황에 따라서는…</p><p style="font-size:13px;margin:0;line-height:1.6;">${res.adjacentTypes.map(t => `<span style="background:var(--surface);padding:2px 8px;border-radius:6px;margin-right:4px;">『${t.name}』</span>`).join("")}의 경향이 나타날 수도 있습니다.</p></div>` : "";
    const toughHtml = ch.tough ? ch.tough.map(t => `<li>${t}</li>`).join("") : "";
    const strengthsHtml = ch.strengths ? ch.strengths.map(s => `<li>${s}</li>`).join("") : "";
    const cautionsHtml = ch.cautions ? ch.cautions.map(c => `<li>${c}</li>`).join("") : "";
    const adviceHtml = ch.advice ? ch.advice.map(a => `<li>${a}</li>`).join("") : "";
    const shareText = encodeURIComponent(`연애 멘헤라 모비 진단 결과는 「${ch.name}」이었습니다!😈💜\n연애 멘헤라도：Lv${res.level}（${res.menheraLevel.name}）\n${ch.catch}\n\n좋아하는 사람에 대한 무거움, 당신도 진단해봐👇`);
    const shareUrl = encodeURIComponent(window.location.href.split("?")[0]);
    const keyImageWebpPath = `img/key/${charImgName}.webp`;
    const keyImagePngPath = `img/key/${charImgName}.png`;
    const keyImageBackPath = "img/key/ura.jpg";
    app.innerHTML = `<div class="panel fade-in"><div class="result-hero"><p class="kicker">진단 결과</p><h2 class="big" style="font-size:28px;">${ch.name}</h2><p class="text-body" style="color:var(--text-main);font-weight:600;font-size:16px;margin-bottom:16px;">${ch.catch}</p><div class="char-image-placeholder"><img src="img/${charImgName}.jpg" alt="${ch.name}" onerror="this.parentElement.textContent='이미지 준비 중'"></div><div style="display:inline-block;background:var(--surface2);padding:6px 16px;border-radius:20px;font-size:12px;font-family:monospace;color:var(--text-sub);">TYPE: ${toDisplayTypeCode(res.code)}</div></div>
  <div style="margin-top:24px;padding:20px;background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(244,114,182,0.15));border-radius:16px;border:1px solid var(--accent);text-align:center;"><p style="font-size:11px;font-weight:700;color:var(--accent);margin:0 0 8px;">😈💜 연애 멘헤라도</p><p style="font-size:36px;font-weight:700;margin:0 0 4px;color:${gaugeColor};">Lv.${res.level}</p><p style="font-size:18px;font-weight:600;margin:0 0 12px;color:var(--text-main);">${res.menheraLevel.name}</p><p style="font-size:13px;color:var(--text-sub);margin:0 0 16px;">${res.menheraLevel.desc}</p><div class="menhera-gauge-bar"><div class="menhera-gauge-fill" style="width:${res.menheraScore}%;background:linear-gradient(90deg,#4ade80,#facc15,#f472b6);"></div></div><div class="menhera-gauge-labels"><span>멘탈 철벽</span><span>연애 좀비</span></div></div>
  <div style="margin-top:40px;"><p class="kicker" style="margin-bottom:16px;">4가지 축의 경향</p>${axisHtml}</div>${adjHtml}</div>
  <div class="panel fade-in" style="margin-top:24px;"><p class="kicker" style="margin-bottom:16px;">🎭 당신의 타입</p><p class="text-body" style="font-size:15px;line-height:1.9;margin:0;color:var(--text-main);">${ch.hook}</p></div>
  ${toughHtml ? `<div class="panel fade-in" style="margin-top:24px;background:linear-gradient(135deg,#1f1520,var(--surface));border-left:4px solid #ff5a5a;"><p class="kicker" style="margin-bottom:16px;color:#ff5a5a;">😣 힘들 때</p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8;">${toughHtml}</ul></div>` : ""}
  ${ch.seen ? `<div class="panel fade-in" style="margin-top:24px;background:linear-gradient(135deg,#151a25,var(--surface));border-left:4px solid #4dabf7;"><p class="kicker" style="margin-bottom:16px;color:#4dabf7;">👀 주변에서 보는 모습</p><p class="text-body" style="font-size:15px;line-height:1.8;margin:0;color:var(--text-main);">${ch.seen}</p></div>` : ""}
  <div class="card-grid"><div class="info-card"><h3>✨ 장점</h3><ul>${strengthsHtml}</ul></div><div class="info-card"><h3>⚡ 주의점</h3><ul>${cautionsHtml}</ul></div></div>
  ${adviceHtml ? `<div class="panel fade-in" style="margin-top:24px;background:linear-gradient(135deg,#151f1a,var(--surface));border-left:4px solid #4ade80;"><p class="kicker" style="margin-bottom:16px;color:#4ade80;">💡 어드바이스</p><ul style="margin:0;padding-left:20px;font-size:13px;line-height:1.8;">${adviceHtml}</ul></div>` : ""}
  <div class="panel fade-in" style="margin-top:24px;animation-delay:0.12s;background:linear-gradient(145deg,#2a1c2e,#201725);border:2px solid rgba(244,114,182,0.25);overflow:hidden;position:relative;">
    <div style="position:absolute;top:18px;right:-44px;transform:rotate(20deg);background:linear-gradient(135deg,#ff7a18,#ffb347);color:#fff;font-size:11px;letter-spacing:0.18em;padding:6px 48px;text-transform:uppercase;">LIMITED</div>
    <p class="kicker" style="margin-bottom:12px;color:#f472b6;">🎀 한정 액세서리</p>
    <div class="result-product-tabs" role="tablist" aria-label="한정 키홀더">
      <button id="resultProductTabPlush" class="result-product-tab" type="button" role="tab" aria-selected="true" aria-controls="resultProductPanelPlush" data-result-product-tab="plush">봉제인형<br>키홀더</button>
      <button id="resultProductTabAcrylic" class="result-product-tab" type="button" role="tab" aria-selected="false" aria-controls="resultProductPanelAcrylic" data-result-product-tab="acrylic" tabindex="-1">아크릴<br>키홀더</button>
    </div>
    <section id="resultProductPanelPlush" class="result-product-content is-active" role="tabpanel" aria-labelledby="resultProductTabPlush" data-result-product-panel="plush">
      <h3 style="font-size:20px;margin:0 0 8px;color:var(--text-main);">폭신폭신 봉제인형 키홀더</h3>
      <p style="display:inline-block;font-size:12px;font-weight:700;color:#ffffff;background:#f472b6;padding:6px 12px;border-radius:999px;margin:0 0 12px;letter-spacing:0.03em;">선착순 100개 한정</p>
      <div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;margin-bottom:14px;"><span style="font-size:14px;color:rgba(232,230,240,0.7);text-decoration:line-through;text-decoration-thickness:2px;">정가 6,000엔</span><span style="font-size:17px;color:#ffd2ea;font-weight:700;letter-spacing:0.04em;background:rgba(244,114,182,0.14);border:1px solid rgba(244,114,182,0.3);padding:6px 12px;border-radius:999px;">특별가 4,800엔</span></div>
      <div style="margin-bottom:14px;background:linear-gradient(145deg,#312338,#241b2a);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.08);text-align:center;"><img src="../img/nui/nui.jpeg" alt="봉제인형 키홀더" style="width:min(100%,220px);max-height:180px;object-fit:contain;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.25);" onerror="this.style.display='none';"></div>
      <p class="text-body" style="font-size:14px;line-height:1.8;margin:0 0 14px;">가볍고 폭신한 촉감으로, 가방에 달기만 해도 기분이 좋아지는 한정 봉제인형 키홀더입니다.</p>
      <ul style="margin:0 0 18px;padding-left:18px;color:var(--text-sub);line-height:1.8;font-size:13px;"><li>사진이 잘 받는 페미닌한 배색</li><li>매일 사용하기 좋은 컴팩트 사이즈</li><li>기간·수량 모두 한정된 특별 사양</li></ul>
      <a id="stripeBuyButtonPlush" data-stripe-product-type="plush_keyholder" data-stripe-product-label="봉제인형 키홀더" href="https://buy.stripe.com/28EaEX30Vfqt6SybJJao80b" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;background:linear-gradient(135deg,#f472b6,#ec4899);color:#fff;box-shadow:0 14px 30px rgba(244,114,182,0.28);transition:transform 0.2s ease;">기간 한정 아이템 확인하기 →</a>
    </section>
    <section id="resultProductPanelAcrylic" class="result-product-content" role="tabpanel" aria-labelledby="resultProductTabAcrylic" data-result-product-panel="acrylic" hidden>
      <h3 style="font-size:20px;margin:0 0 8px;color:var(--text-main);">아크릴 키홀더</h3>
      <p style="display:inline-block;font-size:15px;font-weight:700;color:#f472b6;background:rgba(244,114,182,0.12);padding:6px 14px;border-radius:999px;margin:0 0 18px;letter-spacing:0.03em;">당신의 진단 결과를 가지고 다녀보세요</p>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:18px;background:linear-gradient(145deg,#312338,#241b2a);border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,0.08);">
        <div style="width:45%;max-width:140px;position:relative;overflow:hidden;"><picture><source srcset="${keyImageWebpPath}" type="image/webp"><img src="${keyImagePngPath}" alt="아크릴 키홀더 앞면" style="width:100%;border-radius:12px;object-fit:contain;box-shadow:0 4px 12px rgba(0,0,0,0.25);" onerror="this.style.display='none';"></picture></div>
        <div style="width:45%;max-width:140px;position:relative;overflow:hidden;"><img src="${keyImageBackPath}" alt="아크릴 키홀더 뒷면" style="width:100%;border-radius:12px;object-fit:contain;box-shadow:0 4px 12px rgba(0,0,0,0.25);" onerror="this.style.display='none'; this.parentElement.style.display='none';"></div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="font-size:20px;color:#ffd2ea;font-weight:700;letter-spacing:0.04em;">1,900엔</span></div>
      <p class="text-body" style="font-size:14px;line-height:1.8;margin:0 0 14px;"><strong>앞면은 ${ch.name}, 뒷면에는 언제든 진단을 볼 수 있는 QR코드.</strong> 투명감과 반짝임으로, 빛을 내 편으로 만드는 클리어 액세서리.</p>
      <ul style="margin:0 0 18px;padding-left:18px;color:var(--text-sub);line-height:1.8;font-size:13px;"><li>앞뒷면으로 다른 느낌을 즐길 수 있는 디자인</li><li>일상에서도 특별함이 남는 사이즈감</li></ul>
      <a id="stripeBuyButtonAcrylic" data-stripe-product-type="acrylic_keyholder" data-stripe-product-label="아크릴 키홀더" href="https://buy.stripe.com/bJe14n8lf7Y11yecNNao80a" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;background:linear-gradient(135deg,#f472b6,#ec4899);color:#fff;box-shadow:0 14px 30px rgba(244,114,182,0.28);transition:transform 0.2s ease;">한정 아이템 확인하기 →</a>
    </section>
  </div>
  <div class="panel fade-in" style="margin-top:40px;text-align:center;"><p class="kicker" style="margin-bottom:12px;">📱 결과를 공유해서 화제가 되자!</p><div class="sns-save-wrap"><button id="btnSaveSnsImage" class="sns-save-btn">📸 SNS 게시용 이미지 저장</button><div id="snsSaveBox" class="sns-save-box"><p id="snsSaveHint" class="sns-save-hint">이미지를 불러오는 중입니다...</p><div class="sns-save-preview-wrap"><img id="snsSavePreview" class="sns-save-preview" alt="SNS 게시용 이미지" loading="eager" decoding="async"></div><p id="snsSaveFallback" class="sns-save-fallback">이 타입의 SNS 이미지는 준비 중입니다. 결과 화면을 스크린샷해서 게시해주세요.</p></div></div><div class="share-buttons"><a href="https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}" target="_blank" rel="noopener" style="text-decoration:none;"><button class="share-btn share-x">𝕏 에 공유</button></a><a href="https://social-plugins.line.me/lineit/share?url=${shareUrl}&text=${shareText}" target="_blank" rel="noopener" style="text-decoration:none;"><button class="share-btn share-line">LINE으로 보내기</button></a></div></div>`;

    const resultProductTabButtons = Array.from(document.querySelectorAll(".result-product-tab[data-result-product-tab]"));
    const resultProductPanels = Array.from(document.querySelectorAll(".result-product-content[data-result-product-panel]"));
    function activateResultProductTab(tabKey) {
        if (!tabKey) return;
        resultProductTabButtons.forEach(button => {
            const isActive = button.dataset.resultProductTab === tabKey;
            button.setAttribute("aria-selected", isActive ? "true" : "false");
            button.tabIndex = isActive ? 0 : -1;
        });
        resultProductPanels.forEach(panel => {
            const isActive = panel.dataset.resultProductPanel === tabKey;
            panel.classList.toggle("is-active", isActive);
            panel.hidden = !isActive;
        });
    }
    resultProductTabButtons.forEach((button, index) => {
        button.addEventListener("click", () => {
            activateResultProductTab(button.dataset.resultProductTab || "");
        });
        button.addEventListener("keydown", (e) => {
            if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
            e.preventDefault();
            let nextIndex = index;
            if (e.key === "ArrowRight") nextIndex = (index + 1) % resultProductTabButtons.length;
            if (e.key === "ArrowLeft") nextIndex = (index - 1 + resultProductTabButtons.length) % resultProductTabButtons.length;
            if (e.key === "Home") nextIndex = 0;
            if (e.key === "End") nextIndex = resultProductTabButtons.length - 1;
            const nextButton = resultProductTabButtons[nextIndex];
            if (!nextButton) return;
            activateResultProductTab(nextButton.dataset.resultProductTab || "");
            nextButton.focus();
        });
    });
    if (resultProductTabButtons.length > 0) activateResultProductTab("plush");

    const snsImagePath = getSnsImagePathByCode(res.code);
    const snsSaveBtn = document.getElementById("btnSaveSnsImage");
    const snsSaveBox = document.getElementById("snsSaveBox");
    const snsSaveHint = document.getElementById("snsSaveHint");
    const snsSavePreview = document.getElementById("snsSavePreview");
    const snsSaveFallback = document.getElementById("snsSaveFallback");
    if (snsSaveBtn && snsSaveBox && snsSaveHint && snsSavePreview && snsSaveFallback) {
        snsSaveBtn.onclick = () => {
            snsSaveBox.style.display = "block";
            snsSavePreview.style.display = "none";
            snsSaveFallback.style.display = "none";
            if (!snsImagePath) {
                snsSaveHint.textContent = "이미지를 찾을 수 없습니다. 결과 화면을 스크린샷해서 저장해주세요.";
                snsSaveFallback.style.display = "block";
                return;
            }
            const iosLike = isIOSLikeDevice();
            if (!iosLike) {
                snsSaveHint.textContent = "저장을 시작했습니다. 잘 안 되면 결과 화면을 스크린샷해주세요.";
                const dl = document.createElement("a");
                dl.href = snsImagePath;
                dl.download = `${sanitizeDownloadName(ch.name)}-sns.png`;
                dl.rel = "noopener";
                document.body.appendChild(dl);
                dl.click();
                document.body.removeChild(dl);
                return;
            }
            snsSaveHint.textContent = "iPhone에서는 이미지를 길게 눌러 '사진에 저장'을 선택해주세요.";
            snsSavePreview.alt = `${ch.name} SNS 게시용 이미지`;
            if (snsSavePreview.src && decodeURIComponent(snsSavePreview.src).endsWith(decodeURIComponent(snsImagePath))) {
                snsSavePreview.style.display = "block";
                snsSaveFallback.style.display = "none";
                snsSaveBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
                return;
            }
            snsSavePreview.onload = () => {
                snsSavePreview.style.display = "block";
                snsSaveFallback.style.display = "none";
            };
            snsSavePreview.onerror = () => {
                snsSavePreview.style.display = "none";
                snsSaveFallback.style.display = "block";
                snsSaveHint.textContent = "이 타입의 SNS 이미지는 준비 중입니다. 결과 화면을 스크린샷해서 게시해주세요.";
            };
            snsSavePreview.src = snsImagePath;
            snsSaveBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
        };
    }

    const stripeButtons = Array.from(document.querySelectorAll("[data-stripe-product-type]"));
    stripeButtons.forEach(stripeBtn => {
        stripeBtn.addEventListener("click", () => {
            const payload = buildStripeSheetPayload(res, {
                clickedProductType: stripeBtn.dataset.stripeProductType || "",
                clickedProductLabel: stripeBtn.dataset.stripeProductLabel || "",
                clickedButtonId: stripeBtn.id || ""
            });
            sendToGoogleSheet(payload);
        });
    });
}

function renderCharacters() {
    const keys = Object.keys(CHARACTERS).sort();
    const html = keys.map(code => { const ch = CHARACTERS[code]; return `<div class="char-card fade-in"><div class="char-card-image"><img src="img/${ch.imgName || ch.name}.jpg" alt="${ch.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';"></div><div class="char-card-type">TYPE: ${toDisplayTypeCode(code)}</div><h3 class="char-card-name">${ch.name}</h3><p class="char-card-desc">${ch.catch}</p><button class="primary" style="width:100%;font-size:12px;margin-top:auto;" data-code="${code}">상세보기</button></div>`; }).join("");
    app.innerHTML = `<div class="panel fade-in"><p class="kicker">전 16타입</p><h2 class="big">캐릭터 목록</h2><p class="text-body" style="margin-bottom:20px;">4개의 연애 축 조합으로 탄생한, 16가지 연애 멘헤라 타입💜</p></div><div class="char-grid">${html}</div>`;
    document.querySelectorAll('button[data-code]').forEach(btn => { btn.onclick = () => showCharDetail(btn.dataset.code); });
}

function showCharDetail(code) {
    const ch = CHARACTERS[code];
    const toughHtml = ch.tough ? ch.tough.map(t => `<li style="margin-bottom:6px;">${t}</li>`).join("") : "";
    const strengthsHtml = ch.strengths ? ch.strengths.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join("") : "";
    const cautionsHtml = ch.cautions ? ch.cautions.map(c => `<li style="margin-bottom:4px;">${c}</li>`).join("") : "";
    const adviceHtml = ch.advice ? ch.advice.map(a => `<li style="margin-bottom:4px;">${a}</li>`).join("") : "";
    const m = `<div class="char-modal-overlay" id="cmo"><div class="char-modal"><button class="char-modal-close" id="cmc">×</button><div style="text-align:center;margin-bottom:20px;"><div style="width:200px;height:200px;border-radius:16px;overflow:hidden;margin:0 auto 24px;background:var(--surface2);"><img src="img/${ch.imgName || ch.name}.jpg" alt="${ch.name}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none';"></div><div style="display:inline-block;background:var(--surface2);padding:6px 16px;border-radius:12px;font-size:12px;font-family:monospace;color:var(--text-sub);margin-bottom:16px;">TYPE: ${toDisplayTypeCode(code)}</div><h2 style="font-size:24px;font-weight:700;margin:0 0 16px;">${ch.name}</h2><p style="font-size:14px;font-weight:600;margin:0;">${ch.catch}</p></div>
  ${ch.hook ? `<div style="margin-bottom:20px;"><h3 style="font-size:14px;font-weight:700;color:var(--accent);margin:0 0 8px;">🎭 타입의 특징</h3><p style="font-size:13px;line-height:1.8;margin:0;">${ch.hook}</p></div>` : ""}
  ${toughHtml ? `<div style="margin-bottom:20px;padding:12px;background:rgba(255,90,90,0.05);border-radius:12px;border-left:3px solid #ff5a5a;"><h3 style="font-size:14px;font-weight:700;color:#ff5a5a;margin:0 0 8px;">😣 힘들 때</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;">${toughHtml}</ul></div>` : ""}
  ${ch.seen ? `<div style="margin-bottom:20px;padding:12px;background:rgba(77,171,247,0.05);border-radius:12px;border-left:3px solid #4dabf7;"><h3 style="font-size:14px;font-weight:700;color:#4dabf7;margin:0 0 8px;">👀 주변에서 보는 모습</h3><p style="font-size:13px;line-height:1.8;margin:0;">${ch.seen}</p></div>` : ""}
  <div style="display:grid;gap:12px;margin-top:20px;"><div style="padding:12px;background:var(--surface2);border-radius:12px;"><h3 style="font-size:13px;font-weight:700;margin:0 0 6px;">✨ 장점</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">${strengthsHtml}</ul></div><div style="padding:12px;background:var(--surface2);border-radius:12px;"><h3 style="font-size:13px;font-weight:700;margin:0 0 6px;">⚡ 주의점</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;">${cautionsHtml}</ul></div></div>
  ${adviceHtml ? `<div style="margin-top:20px;padding:12px;background:rgba(74,222,128,0.05);border-radius:12px;border-left:3px solid #4ade80;"><h3 style="font-size:14px;font-weight:700;color:#4ade80;margin:0 0 8px;">💡 어드바이스</h3><ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.8;">${adviceHtml}</ul></div>` : ""}</div></div>`;
    document.body.insertAdjacentHTML("beforeend", m);
    const ov = document.getElementById("cmo");
    document.getElementById("cmc").onclick = () => { ov.style.animation = "fadeOut 0.2s ease forwards"; setTimeout(() => ov.remove(), 200); };
    ov.onclick = e => { if (e.target === ov) { ov.style.animation = "fadeOut 0.2s ease forwards"; setTimeout(() => ov.remove(), 200); } };
}

const ENABLE_MYPAGE_ENTRY = false;

function mountMyPageLauncher() {
    if (!ENABLE_MYPAGE_ENTRY) return;
    if (document.getElementById("mobbyMyPageLauncher")) return;
    const launcher = document.createElement("a");
    launcher.id = "mobbyMyPageLauncher";
    launcher.href = "/mypage-register.html";
    launcher.textContent = "진단 모아보기 페이지";
    launcher.style.position = "fixed";
    launcher.style.right = "12px";
    launcher.style.bottom = "12px";
    launcher.style.zIndex = "95";
    launcher.style.padding = "10px 14px";
    launcher.style.borderRadius = "999px";
    launcher.style.fontSize = "12px";
    launcher.style.fontWeight = "700";
    launcher.style.letterSpacing = "0.04em";
    launcher.style.textDecoration = "none";
    launcher.style.color = "#fff";
    launcher.style.background = "linear-gradient(135deg,#0ea5e9,#0284c7)";
    launcher.style.boxShadow = "0 12px 24px rgba(14,165,233,0.34)";
    document.body.appendChild(launcher);
}

loadState(); render();
mountMyPageLauncher();
