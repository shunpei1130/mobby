const STORAGE_KEY = "mobby_mbti_shadow_diag_v2";
const PAGE_SIZE = 4;
const SOURCE = "mobby_mbti_shadow";
const AGE_OPTIONS = ["16歳未満", "16歳", "17歳", "18歳", "19歳", "20歳", "21歳", "22歳", "23歳", "24歳", "25歳", "26歳", "27歳", "28歳", "29歳以上"];
const DEFAULT_LIKERT_SCALE = [
  { value: 1, label: "まったく当てはまらない" },
  { value: 2, label: "ほとんど当てはまらない" },
  { value: 3, label: "あまり当てはまらない" },
  { value: 4, label: "どちらともいえない" },
  { value: 5, label: "少し当てはまる" },
  { value: 6, label: "かなり当てはまる" },
  { value: 7, label: "とても当てはまる" }
];

const BASE_QUESTIONS = window.MOBBY_QUESTIONS || [];
const QUESTIONS_BY_MBTI = window.MOBBY_QUESTIONS_BY_MBTI || {};
const LIKERT_SCALE = window.MOBBY_MBTI_LIKERT_SCALE || DEFAULT_LIKERT_SCALE;
const LIKERT_MAX = Math.max(...LIKERT_SCALE.map((item) => Number(item.value) || 0), 7);
const MBTI_TYPES = window.MOBBY_MBTI_TYPES || [];
const TYPE_LENS = window.MOBBY_TYPE_LENS || {};
const RESULT_COPY = window.MOBBY_RESULT_COPY || {};
const METER_COPY = window.MOBBY_METER_COPY || [];
const DRIVER_COPY = window.MOBBY_DRIVER_COPY || {};
const SCORING_KEYS = window.MOBBY_SCORING_KEYS || {};

const state = {
  step: "intro",
  mbti: "",
  page: 0,
  answers: {},
  missingQuestionId: "",
  questionOrder: null,
  profile: { name: "", email: "", age: "" },
  sentToSheet: false
};

const CONTRADICTION_PAIRS = [
  {
    id: "free_but_needs_reaction",
    clean: ["good_face", "claim_independent", "clean_claim"],
    shadow: ["approval_hunger", "reaction_sensitivity", "loneliness_avoidance"],
    copy: "自由で平気な顔をしていても、反応が薄いとちゃんと気にする。"
  },
  {
    id: "logical_but_suppressed",
    clean: ["claim_rational", "clean_claim", "impression_management"],
    shadow: ["emotional_suppression", "superiority_defense", "pride"],
    copy: "論理的に見せている時ほど、感情を出したら負けだと思っている。"
  },
  {
    id: "kind_but_disliked_fear",
    clean: ["claim_no_reward", "good_face", "people_pleasing"],
    shadow: ["approval_hunger", "abandonment_fear", "validation_need"],
    copy: "優しさの中に、嫌われる前に先回りしたい気持ちが混ざっている。"
  },
  {
    id: "planned_but_control",
    clean: ["claim_responsible", "clean_claim"],
    shadow: ["control_need", "rigidity", "confirmation_need"],
    copy: "計画的に見える裏で、予定外の不安を管理したがっている。"
  },
  {
    id: "flexible_but_avoidance",
    clean: ["good_face", "claim_independent"],
    shadow: ["responsibility_escape", "avoidance", "fear_of_intimacy"],
    copy: "柔軟に見せながら、責任が発生する前に逃げ道を残している。"
  },
  {
    id: "calm_but_anger_stack",
    clean: ["claim_no_anger", "impression_management"],
    shadow: ["anger_stack", "emotional_suppression"],
    copy: "落ち着いているようで、怒りをその場で出さずに保存している。"
  },
  {
    id: "not_jealous_but_compares",
    clean: ["claim_no_jealousy", "clean_claim"],
    shadow: ["jealousy", "trigger_comparison", "superiority_defense"],
    copy: "嫉妬していない顔で、比較された事実だけはきっちり保存している。"
  }
];

const DARK_SWITCHES = [
  { tag: "rejection", scoreKey: "trigger_rejection", fallbackKeys: ["abandonment_fear", "approval_hunger"], label: "後回し" },
  { tag: "disrespect", scoreKey: "trigger_disrespect", fallbackKeys: ["anger_stack", "pride"], label: "雑扱い" },
  { tag: "ignored_effort", scoreKey: "approval_hunger", fallbackKeys: ["anger_stack", "validation_need"], label: "努力の当然扱い" },
  { tag: "control_loss", scoreKey: "trigger_control_loss", fallbackKeys: ["control_need", "rigidity"], label: "主導権喪失" },
  { tag: "intimacy", scoreKey: "trigger_intimacy", fallbackKeys: ["fear_of_intimacy", "avoidance"], label: "踏み込み" },
  { tag: "comparison", scoreKey: "trigger_comparison", fallbackKeys: ["jealousy", "superiority_defense"], label: "比較" },
  { tag: "ambiguity", scoreKey: "confirmation_need", fallbackKeys: ["reaction_sensitivity", "self_deception"], label: "曖昧な態度" },
  { tag: "silence", scoreKey: "reaction_sensitivity", fallbackKeys: ["abandonment_fear", "loneliness_avoidance"], label: "沈黙" }
];

const app = document.getElementById("app");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function avg(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  if (!filtered.length) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
}

function normalizeProfile(profile) {
  return {
    name: String(profile?.name || ""),
    email: String(profile?.email || ""),
    age: AGE_OPTIONS.includes(profile?.age) ? profile.age : ""
  };
}

function normalizeAnswerValue(value) {
  const num = Number(value);
  return Number.isInteger(num) && num >= 1 && num <= LIKERT_MAX ? num : 0;
}

function isAnsweredValue(value) {
  return normalizeAnswerValue(value) > 0;
}

function likertLabel(value) {
  const normalized = normalizeAnswerValue(value);
  return LIKERT_SCALE.find((item) => Number(item.value) === normalized)?.label || "";
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (_) {
    // Ignore corrupt localStorage and start fresh.
  }
  state.profile = normalizeProfile(state.profile);
  state.answers = state.answers && typeof state.answers === "object" ? state.answers : {};
  state.answers = Object.fromEntries(Object.entries(state.answers)
    .map(([id, value]) => [id, normalizeAnswerValue(value)])
    .filter(([, value]) => value > 0));
  state.missingQuestionId = "";
  if (!getQuestionsForMbti(state.mbti).length) state.mbti = "";
  if (!["intro", "mbti", "quiz", "gate", "result"].includes(state.step)) state.step = "intro";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resetState() {
  state.step = "intro";
  state.mbti = "";
  state.page = 0;
  state.answers = {};
  state.missingQuestionId = "";
  state.questionOrder = null;
  state.profile = { name: "", email: "", age: "" };
  state.sentToSheet = false;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function getQuestionsForMbti(mbti) {
  return QUESTIONS_BY_MBTI[mbti] || BASE_QUESTIONS || [];
}

function getQuestions() {
  return getQuestionsForMbti(state.mbti);
}

function answeredCount() {
  const ids = new Set(getQuestions().map((question) => question.id));
  return Object.keys(state.answers || {}).filter((id) => ids.has(id) && isAnsweredValue(state.answers[id])).length;
}

function isRegistered() {
  return Boolean(state.profile?.name && state.profile?.email && state.profile?.age);
}

function isQuizCompleted() {
  const questions = getQuestions();
  return questions.length > 0 && questions.every((question) => isAnsweredValue(state.answers[question.id]));
}

function trimForCard(value, length = 28) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function getMeterCopy(meter, value) {
  const numeric = Number(value);
  return METER_COPY.find((item) => {
    if (item.meter !== meter) return false;
    const match = String(item.range || "").match(/^(\d+)-(\d+)$/);
    if (!match) return false;
    return numeric >= Number(match[1]) && numeric <= Number(match[2]);
  }) || null;
}

function getDarkSwitchCopy(tag) {
  return METER_COPY.find((item) => item.meter === "dark_switch" && item.range === tag) || null;
}

function meterColor(value) {
  if (value < 40) return "#4ade80";
  if (value < 70) return "#facc15";
  if (value < 90) return "#f472b6";
  return "#ff5a5a";
}

function meterLabel(value) {
  if (value < 40) return "まだ素直";
  if (value < 70) return "少し整えてる";
  if (value < 90) return "かなり隠してる";
  return "ほぼ演出";
}

function addWeights(target, weights) {
  Object.entries(weights || {}).forEach(([key, value]) => {
    const num = Number(value);
    if (Number.isFinite(num)) target[key] = (target[key] || 0) + num;
  });
}

function addScaledWeights(target, weights, ratio) {
  Object.entries(weights || {}).forEach(([key, value]) => {
    const num = Number(value);
    if (Number.isFinite(num)) target[key] = (target[key] || 0) + (num * ratio);
  });
}

function positiveWeightTotal(weights) {
  return Object.values(weights || {}).reduce((sum, value) => {
    const num = Number(value);
    return Number.isFinite(num) ? sum + Math.max(0, num) : sum;
  }, 0);
}

function answerRatio(value) {
  const normalized = normalizeAnswerValue(value);
  if (!normalized) return 0;
  return (normalized - 1) / Math.max(1, LIKERT_MAX - 1);
}

function scoreQuestions(questions) {
  const raw = {};
  const tagRaw = {};
  questions.forEach((question) => {
    const selected = normalizeAnswerValue(state.answers[question.id]);
    if (!selected) return;
    const agreement = answerRatio(selected);
    const shadowRatio = question.reverse ? 1 - agreement : agreement;
    addScaledWeights(raw, question.weights, shadowRatio);
    addScaledWeights(raw, question.protectiveWeights, agreement);
    if (question.darkSwitchTag && question.darkSwitchTag !== "max") {
      const optionTotal = positiveWeightTotal(question.weights) * shadowRatio;
      tagRaw[question.darkSwitchTag] = (tagRaw[question.darkSwitchTag] || 0) + optionTotal;
    }
  });
  return { raw, tagRaw };
}

function buildMaxScores(questions) {
  const maxScores = {};
  const maxTagScores = {};
  questions.forEach((question) => {
    addWeights(maxScores, question.weights);
    addWeights(maxScores, question.protectiveWeights);
    if (question.darkSwitchTag && question.darkSwitchTag !== "max") {
      maxTagScores[question.darkSwitchTag] = (maxTagScores[question.darkSwitchTag] || 0) + positiveWeightTotal(question.weights);
    }
  });
  return { maxScores, maxTagScores };
}

function buildFinalScores(questions, mbti) {
  const { raw, tagRaw } = scoreQuestions(questions);
  const { maxScores, maxTagScores } = buildMaxScores(questions);
  const lens = TYPE_LENS[mbti] || {};
  const bias = lens.bias || {};
  const keys = new Set([
    ...Object.keys(SCORING_KEYS),
    ...Object.keys(maxScores),
    ...Object.keys(raw),
    ...Object.keys(bias)
  ]);
  const answerScores = {};
  const biasScores = {};
  const finalScores = {};

  keys.forEach((key) => {
    const max = maxScores[key] || 0;
    const answer = max > 0 ? clamp(Math.round(((raw[key] || 0) / max) * 100)) : 0;
    const biasScore = clamp(Math.round((Number(bias[key]) || 0) * 50));
    answerScores[key] = answer;
    biasScores[key] = biasScore;
    finalScores[key] = biasScore > 0 ? clamp(Math.round(answer * 0.8 + biasScore * 0.2)) : answer;
  });

  const tagScores = {};
  Object.keys(maxTagScores).forEach((tag) => {
    tagScores[tag] = maxTagScores[tag] > 0
      ? clamp(Math.round(((tagRaw[tag] || 0) / maxTagScores[tag]) * 100))
      : 0;
  });

  return { raw, answerScores, biasScores, scores: finalScores, tagScores };
}

function averageScore(keys, scores) {
  return avg(keys.map((key) => scores[key] || 0));
}

function computeContradictions(scores) {
  return CONTRADICTION_PAIRS.map((pair) => {
    const cleanAvg = averageScore(pair.clean, scores);
    const shadowAvg = averageScore(pair.shadow, scores);
    return {
      ...pair,
      value: clamp(Math.round(Math.sqrt(cleanAvg * shadowAvg)))
    };
  }).sort((a, b) => b.value - a.value);
}

function computeDarkSwitch(scores, tagScores) {
  const candidates = DARK_SWITCHES.map((item) => {
    const fallback = averageScore(item.fallbackKeys || [], scores);
    const value = Math.max(scores[item.scoreKey] || 0, tagScores[item.tag] || 0, fallback);
    const copy = getDarkSwitchCopy(item.tag);
    return {
      ...item,
      value: clamp(Math.round(value)),
      label: copy?.displayLabel?.replace(/^闇スイッチ：/, "") || item.label,
      copy: copy?.copy || "ここを押されると、整えて見せていた自分より先に、隠していた反応が出ます。"
    };
  });
  return candidates.sort((a, b) => b.value - a.value)[0] || candidates[0];
}

function computeMainDriver(scores) {
  const protectiveKeys = new Set(["self_awareness", "directness", "stability"]);
  const candidates = Object.keys(DRIVER_COPY).map((key) => ({
    key,
    value: scores[key] || 0,
    ...DRIVER_COPY[key]
  })).filter((item) => !protectiveKeys.has(item.key));
  return candidates.sort((a, b) => b.value - a.value)[0] || null;
}

function computeResult() {
  const questions = getQuestions();
  const scored = buildFinalScores(questions, state.mbti);
  const scores = scored.scores;
  const contradictions = computeContradictions(scores);
  const contradictionScore = clamp(Math.round(avg(contradictions.slice(0, 3).map((item) => item.value))));
  const recoveryScore = averageScore(["self_awareness", "directness", "stability"], scores);
  const goodFaceMeter = clamp(Math.round(
    0.30 * (scores.good_face || 0) +
    0.25 * (scores.impression_management || 0) +
    0.20 * (scores.clean_claim || 0) +
    0.25 * contradictionScore -
    0.10 * recoveryScore
  ));
  const hiddenTruthMeter = clamp(Math.round(
    0.35 * (scores.hidden_truth || 0) +
    0.25 * (scores.self_deception || 0) +
    0.25 * contradictionScore +
    0.15 * Math.max(scores.avoidance || 0, scores.emotional_suppression || 0, scores.people_pleasing || 0) -
    0.08 * recoveryScore
  ));
  const darkSwitch = computeDarkSwitch(scores, scored.tagScores);
  const copy = RESULT_COPY[state.mbti] || {};
  const lens = TYPE_LENS[state.mbti] || {};
  const driver = computeMainDriver(scores);
  return {
    ...scored,
    mbti: state.mbti,
    resultName: `${state.mbti}の皮をかぶったモビー`,
    copy,
    lens,
    contradictions,
    contradictionScore,
    recoveryScore: clamp(Math.round(recoveryScore)),
    goodFaceMeter,
    hiddenTruthMeter,
    darkSwitch,
    driver
  };
}

function isIOSLikeDevice() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isLineAppShareTarget() {
  return /Android/i.test(navigator.userAgent || "") || isIOSLikeDevice();
}

function buildLineAppShareUrl(shareText, shareUrl = "") {
  const separator = shareText && shareUrl ? "\n" : "";
  return `https://line.me/R/share?text=${encodeURIComponent(`${shareText || ""}${separator}${shareUrl || ""}`)}`;
}

function buildLineWebShareUrl(shareText, shareUrl = "") {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl || window.location.href)}&text=${encodeURIComponent(shareText || "")}`;
}

function getPreferredLineShareUrl(shareText, shareUrl = "") {
  return isLineAppShareTarget() ? buildLineAppShareUrl(shareText, shareUrl) : buildLineWebShareUrl(shareText, shareUrl);
}

function render() {
  if (state.step === "intro") renderIntro();
  else if (state.step === "mbti") renderMbtiSelect();
  else if (state.step === "quiz") renderQuiz();
  else if (state.step === "gate") renderGate();
  else renderResult();
}

function renderIntro() {
  const count = answeredCount();
  const canResume = Boolean(state.mbti && count > 0);
  app.innerHTML = `
    <section class="panel center">
      <p class="kicker">モビー診断</p>
      <h2 class="big">MBTIの裏モビー診断</h2>
      <div class="intro-copy">
        <p>MBTIで説明してきた「自分らしさ」の裏側を、モビーが少し辛口に見ます。</p>
        <p>28問の7段階回答で、よく見せている自己像・隠しがちな本音・反応が出やすい場面を出します。</p>
      </div>
      <button class="primary" id="btnStart" type="button">${canResume ? "診断を再開する" : "診断をはじめる"}</button>
      ${canResume ? `<p class="text-body" style="margin-top:14px;">${escapeHtml(state.mbti)} / ${count}問 回答済み</p>` : ""}
    </section>
  `;
  document.getElementById("btnStart").onclick = () => {
    state.step = canResume ? "quiz" : "mbti";
    if (!canResume) {
      state.mbti = "";
      state.page = 0;
      state.answers = {};
      state.missingQuestionId = "";
      state.sentToSheet = false;
    }
    saveState();
    render();
  };
}

function renderMbtiSelect() {
  const cards = MBTI_TYPES.map((item) => {
    const selected = state.mbti === item.code ? "selected" : "";
    return `
      <button class="mbti-card ${selected}" type="button" data-mbti="${escapeHtml(item.code)}" aria-pressed="${selected ? "true" : "false"}">
        <strong>${escapeHtml(item.code)}</strong>
        <span>${escapeHtml(trimForCard(item.label, 30))}</span>
      </button>
    `;
  }).join("");

  app.innerHTML = `
    <section class="panel">
      <p class="kicker">MBTIを選択</p>
      <h2 class="big" style="font-size:28px;">最初にあなたのMBTIを選んでください</h2>
      <p class="text-body">MBTIは補正として使います。質問は全タイプ共通の28問です。</p>
      <div class="mbti-grid">${cards}</div>
      <div class="actions">
        <button id="btnBackIntro" type="button">戻る</button>
        <button class="primary" id="btnGoQuiz" type="button" ${state.mbti ? "" : "disabled"}>質問へ進む</button>
      </div>
    </section>
  `;

  document.querySelectorAll(".mbti-card[data-mbti]").forEach((button) => {
    button.onclick = () => {
      const nextMbti = button.dataset.mbti || "";
      if (state.mbti !== nextMbti) {
        state.answers = {};
        state.page = 0;
        state.missingQuestionId = "";
        state.sentToSheet = false;
      }
      state.mbti = nextMbti;
      saveState();
      renderMbtiSelect();
    };
  });
  document.getElementById("btnBackIntro").onclick = () => {
    state.step = "intro";
    saveState();
    render();
  };
  document.getElementById("btnGoQuiz").onclick = () => {
    if (!state.mbti) return;
    state.step = "quiz";
    state.missingQuestionId = "";
    saveState();
    render();
  };
}

function likertTone(value) {
  if (value < 4) return "low";
  if (value > 4) return "high";
  return "neutral";
}

function renderLikertButtons(question, selected) {
  return LIKERT_SCALE.map((item) => {
    const value = Number(item.value);
    const isSelected = selected === value;
    return `
      <button
        class="likert-btn likert-${likertTone(value)} ${isSelected ? "selected" : ""}"
        type="button"
        data-qid="${escapeHtml(question.id)}"
        data-value="${value}"
        aria-label="${value}: ${escapeHtml(item.label)}"
        aria-pressed="${isSelected ? "true" : "false"}">
        <span>${value}</span>
      </button>
    `;
  }).join("");
}

function renderQuiz() {
  if (!state.mbti) {
    state.step = "mbti";
    saveState();
    render();
    return;
  }
  const questions = getQuestions();
  if (!questions.length) {
    app.innerHTML = `<section class="panel"><p class="error" style="display:block;">質問データを読み込めませんでした。</p></section>`;
    return;
  }

  state.page = clamp(state.page || 0, 0, Math.ceil(questions.length / PAGE_SIZE) - 1);
  const start = state.page * PAGE_SIZE;
  const pageQuestions = questions.slice(start, start + PAGE_SIZE);
  const totalPages = Math.ceil(questions.length / PAGE_SIZE);
  const count = answeredCount();
  const progress = Math.round((count / questions.length) * 100);
  const questionHtml = pageQuestions.map((question, index) => {
    const selected = normalizeAnswerValue(state.answers[question.id]);
    const hasError = state.missingQuestionId === question.id;
    return `
      <article class="q-card ${hasError ? "has-error" : ""}">
        <div class="q-meta"><span>Q${start + index + 1} / ${questions.length}</span><span>${escapeHtml(question.phase)}</span></div>
        <p class="q-text">${escapeHtml(question.text)}</p>
        <div class="likert7" role="radiogroup" aria-label="${escapeHtml(question.text)}">
          <div class="likert-labels" aria-hidden="true">
            <span>当てはまらない</span>
            <span>当てはまる</span>
          </div>
          <div class="likert-buttons">${renderLikertButtons(question, selected)}</div>
          <div class="likert-current">${selected ? `${selected}：${escapeHtml(likertLabel(selected))}` : "未回答"}</div>
        </div>
        ${hasError ? `<p class="q-error">この項目を選ぶと次へ進めます。</p>` : ""}
      </article>
    `;
  }).join("");

  app.innerHTML = `
    <section class="panel">
      <div class="progress-wrap">
        <div class="progress-meta"><span>${escapeHtml(state.mbti)} / 7段階回答</span><span>${count} / ${questions.length}</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
      </div>
      ${questionHtml}
      <div class="pager">
        <button id="btnPrev" type="button" ${state.page === 0 ? "disabled" : ""}>戻る</button>
        <button class="primary" id="btnNext" type="button">${state.page === totalPages - 1 ? "結果を見る" : "次へ"}</button>
      </div>
    </section>
  `;

  document.querySelectorAll(".likert-btn[data-qid][data-value]").forEach((button) => {
    button.onclick = () => {
      state.answers[button.dataset.qid] = normalizeAnswerValue(button.dataset.value);
      if (state.missingQuestionId === button.dataset.qid) state.missingQuestionId = "";
      state.sentToSheet = false;
      saveState();
      renderQuiz();
    };
  });
  document.getElementById("btnPrev").onclick = () => {
    state.page = Math.max(0, state.page - 1);
    saveState();
    render();
  };
  document.getElementById("btnNext").onclick = () => {
    const missing = pageQuestions.find((question) => !isAnsweredValue(state.answers[question.id]));
    if (missing) {
      state.missingQuestionId = missing.id;
      saveState();
      renderQuiz();
      return;
    }
    state.missingQuestionId = "";
    if (state.page < totalPages - 1) {
      state.page += 1;
      saveState();
      render();
      return;
    }
    state.step = isRegistered() ? "result" : "gate";
    saveState();
    render();
  };
}

function renderGate() {
  if (!isQuizCompleted()) {
    state.step = "quiz";
    saveState();
    render();
    return;
  }
  if (isRegistered()) {
    state.step = "result";
    saveState();
    render();
    return;
  }
  const ageOptions = AGE_OPTIONS.map((age) => `<option value="${escapeHtml(age)}">${escapeHtml(age)}</option>`).join("");
  app.innerHTML = `
    <section class="panel">
      <p class="kicker">あと少しで結果を見られます</p>
      <h2 class="big" style="font-size:28px;">結果の閲覧には登録が必要です</h2>
      <p class="text-body">入力後すぐに、よく見せている自己像と隠しがちな反応を表示します。</p>
      <div class="form-grid" style="margin-top:22px;">
        <div class="field">
          <label for="regName">ニックネーム</label>
          <input id="regName" type="text" autocomplete="nickname" placeholder="例）るな">
        </div>
        <div class="field">
          <label for="regEmail">メールアドレス</label>
          <input id="regEmail" type="email" autocomplete="email" placeholder="example@gmail.com">
        </div>
        <div class="field">
          <label for="regAge">年齢</label>
          <select id="regAge">
            <option value="">選択してください</option>
            ${ageOptions}
          </select>
        </div>
        <label class="consent">
          <input id="regConsent" type="checkbox">
          <span>入力した情報を連絡・改善のために保存することに同意します。</span>
        </label>
        <p class="error" id="regErr"></p>
        <div class="actions">
          <button id="btnGateBack" type="button">戻る</button>
          <button class="primary" id="btnGateGo" type="button">結果を見る</button>
        </div>
        <p class="text-body" style="font-size:11px;">送信される内容：ニックネーム、年齢、メール、MBTI（${escapeHtml(state.mbti)}）</p>
      </div>
    </section>
  `;

  const nameEl = document.getElementById("regName");
  const emailEl = document.getElementById("regEmail");
  const ageEl = document.getElementById("regAge");
  const errEl = document.getElementById("regErr");
  nameEl.value = state.profile?.name || "";
  emailEl.value = state.profile?.email || "";
  ageEl.value = state.profile?.age || "";
  document.getElementById("btnGateBack").onclick = () => {
    state.step = "quiz";
    saveState();
    render();
  };
  document.getElementById("btnGateGo").onclick = () => {
    errEl.style.display = "none";
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const age = ageEl.value.trim();
    const consent = document.getElementById("regConsent").checked;
    if (!name) return showGateError("ニックネームを入力してください");
    if (!email) return showGateError("メールアドレスを入力してください");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showGateError("メールアドレスを正しく入力してください");
    if (!age) return showGateError("年齢を選択してください");
    if (!consent) return showGateError("同意にチェックしてください");
    state.profile = { name, email, age };
    state.step = "result";
    saveState();
    render();
  };

  function showGateError(message) {
    errEl.textContent = message;
    errEl.style.display = "block";
  }
}

function buildQuestionAnswers() {
  const out = {};
  getQuestions().forEach((question) => {
    const value = normalizeAnswerValue(state.answers[question.id]);
    if (value) out[question.id] = { value, label: likertLabel(value) };
  });
  return out;
}

function sendResultOnce(result) {
  if (state.sentToSheet || !state.profile?.name) return;
  state.sentToSheet = true;
  saveState();
  const payload = {
    name: state.profile.name,
    email: state.profile.email,
    age: state.profile.age,
    type: state.mbti,
    axes: {
      A: result.goodFaceMeter,
      B: result.hiddenTruthMeter,
      C: result.darkSwitch.value,
      D: result.contradictionScore
    },
    source: SOURCE,
    mbti: state.mbti,
    diagnosis_type: result.resultName,
    answerScale: "7段階",
    questionCount: getQuestions().length,
    goodFaceMeter: result.goodFaceMeter,
    hiddenTruthMeter: result.hiddenTruthMeter,
    darkSwitch: result.darkSwitch.label,
    recoveryScore: result.recoveryScore,
    scores: result.scores,
    contradictions: result.contradictions.slice(0, 3).map((item) => ({ id: item.id, value: item.value, copy: item.copy })),
    answers: buildQuestionAnswers(),
    createdAt: new Date().toISOString()
  };
  submitLead(payload).catch((error) => console.error("[Mobby MBTI] lead API failed:", error));
  submitDiagnosis(payload).catch((error) => console.error("[Mobby MBTI] diagnosis API failed:", error));
}

function renderMeterCard(title, value, copy) {
  const color = meterColor(value);
  return `
    <div class="meter-card">
      <p class="kicker">${escapeHtml(title)}</p>
      <div class="meter-value" style="color:${color};">${value}%</div>
      <strong>${escapeHtml(meterLabel(value))}</strong>
      <div class="meter-track" style="margin-top:12px;"><div class="meter-fill" style="width:${value}%;background:${color};"></div></div>
      <p class="meter-copy">${escapeHtml(copy || "")}</p>
    </div>
  `;
}

function renderResult() {
  if (!isQuizCompleted()) {
    state.step = "quiz";
    saveState();
    render();
    return;
  }
  if (!isRegistered()) {
    state.step = "gate";
    saveState();
    render();
    return;
  }

  const result = computeResult();
  sendResultOnce(result);

  const goodFaceCopy = getMeterCopy("good_face", result.goodFaceMeter);
  const hiddenTruthCopy = getMeterCopy("hidden_truth", result.hiddenTruthMeter);
  const copy = result.copy;
  const contradictions = result.contradictions.slice(0, 3);
  const contradictionHtml = contradictions.map((item) => `<li>${escapeHtml(item.copy)} <span style="color:var(--text-sub);">(${item.value}%)</span></li>`).join("");
  const driverHtml = result.driver ? `
    <div class="info-card">
      <h3>隠している本音</h3>
      <p>${escapeHtml(result.driver.snark || "")}</p>
      <p style="color:var(--text-sub);margin-top:10px;">${escapeHtml(result.driver.relief || "")}</p>
    </div>
  ` : "";

  const shareTextRaw = `モビー診断の結果は「${result.resultName}」でした。\nMBTIの裏モビー診断\nよく見せメーター：${result.goodFaceMeter}%\n不都合隠しメーター：${result.hiddenTruthMeter}%\n闇スイッチ：${result.darkSwitch.label}\n\n${copy.snark || copy.mobbyTranslation || ""}\n\nあなたも診断してみて`;
  const shareUrlRaw = window.location.href.split("?")[0];
  const lineShareHref = getPreferredLineShareUrl(shareTextRaw, shareUrlRaw);
  const lineShareTarget = isLineAppShareTarget() ? "_self" : "_blank";
  const lineAiDiagnosisPayload = {
    source: SOURCE,
    sourceLabel: "モビー診断",
    resultId: state.mbti,
    resultName: result.resultName,
    resultSummary: copy.mobbyTranslation || result.lens.translation || "",
    traits: [
      `MBTI: ${state.mbti}`,
      `よく見せメーター: ${result.goodFaceMeter}%`,
      `不都合隠しメーター: ${result.hiddenTruthMeter}%`,
      `闇スイッチ: ${result.darkSwitch.label}`,
      copy.snark
    ].filter(Boolean),
    detailSections: [
      { title: "MBTIで言われたであろうこと", body: copy.mbtiSays || result.lens.surface || "" },
      { title: "モビーの本質翻訳", body: copy.mobbyTranslation || result.lens.translation || "" },
      { title: "辛辣コメント", body: copy.snark || result.lens.snark || "" },
      { title: "矛盾", body: contradictions.map((item) => item.copy).join(" / ") }
    ].filter((section) => section.body),
    pagePath: "/mobby/",
    createdAt: new Date().toISOString()
  };

  app.innerHTML = `
    <section class="panel result-hero">
      <p class="kicker">診断結果</p>
      <h2 class="big">${escapeHtml(result.resultName)}</h2>
      <p class="text-body" style="color:var(--text-main);font-weight:700;">MBTIで説明してきた自分の裏側を、モビーが少し辛口に翻訳します。</p>
      <img class="mobby-image" src="../img/mobby/mobby_purple2.jpg" alt="モビー" loading="eager" decoding="async">
      <div id="line-ai-mobby-cta" data-line-ai-mobby-cta data-diagnosis="${encodeURIComponent(JSON.stringify(lineAiDiagnosisPayload))}"></div>
    </section>

    <section class="panel">
      <div class="meter-grid">
        ${renderMeterCard("よく見せメーター", result.goodFaceMeter, goodFaceCopy?.copy)}
        ${renderMeterCard("不都合隠しメーター", result.hiddenTruthMeter, hiddenTruthCopy?.copy)}
      </div>
      <div class="meter-card" style="margin-top:14px;border-color:${meterColor(result.darkSwitch.value)};">
        <p class="kicker">闇スイッチ</p>
        <div class="meter-value" style="color:${meterColor(result.darkSwitch.value)};">${escapeHtml(result.darkSwitch.label)}</div>
        <strong>${result.darkSwitch.value}%</strong>
        <div class="meter-track" style="margin-top:12px;"><div class="meter-fill" style="width:${result.darkSwitch.value}%;background:${meterColor(result.darkSwitch.value)};"></div></div>
        <p class="meter-copy">${escapeHtml(result.darkSwitch.copy)}</p>
      </div>
    </section>

    <section class="panel">
      <div class="result-sections">
        <div class="info-card">
          <h3>MBTIで言われたであろうこと</h3>
          <p>${escapeHtml(copy.mbtiSays || result.lens.surface || "")}</p>
        </div>
        <div class="info-card">
          <h3>モビーの本質翻訳</h3>
          <p>${escapeHtml(copy.mobbyTranslation || result.lens.translation || "")}</p>
        </div>
        <div class="info-card">
          <h3>辛辣コメント</h3>
          <p>${escapeHtml(copy.snark || result.lens.snark || "")}</p>
        </div>
        ${driverHtml}
        <div class="info-card">
          <h3>モビーが見つけた矛盾</h3>
          <ol class="contradiction-list">${contradictionHtml}</ol>
        </div>
        <div class="info-card">
          <h3>救いの一言</h3>
          <p>${escapeHtml(copy.relief || "面倒くささは欠陥ではなく、防衛反応です。ただし、気づかないままだと人間関係で同じ壊れ方をします。")}</p>
        </div>
      </div>
    </section>

    <section class="panel" style="text-align:center;">
      <p class="kicker">結果をシェア</p>
      <div class="share-buttons">
        <a class="share-x" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextRaw)}&url=${encodeURIComponent(shareUrlRaw)}" target="_blank" rel="noopener">Xでシェア</a>
        <a class="share-line" href="${escapeHtml(lineShareHref)}" target="${lineShareTarget}" rel="noopener">LINEで送る</a>
      </div>
      <div class="actions" style="justify-content:center;">
        <button id="btnRetry" type="button">もう一度診断する</button>
      </div>
      <p class="note">※この診断はエンタメコンテンツです。MBTI公式診断とは関係ありません。結果は自己理解や会話のきっかけとしてお楽しみください。</p>
    </section>
  `;

  if (window.MobbyLineAiCTA?.autoRender) {
    window.MobbyLineAiCTA.autoRender(app);
  }
  document.getElementById("btnRetry").onclick = () => {
    resetState();
  };
}

document.getElementById("btnReset").onclick = () => {
  if (confirm("最初からやり直しますか？")) resetState();
};

loadState();
render();
