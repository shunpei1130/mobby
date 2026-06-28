import { readFile } from "node:fs/promises";
import vm from "node:vm";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function loadBrowserData() {
  const context = vm.createContext({ window: {} });
  for (const path of ["../mobby/questions.js", "../mobby/copy.js"]) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    vm.runInContext(source, context, { filename: path });
  }
  return context.window;
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
    if (Number.isFinite(num)) target[key] = (target[key] || 0) + num * ratio;
  });
}

function positiveWeightTotal(weights) {
  return Object.values(weights || {}).reduce((sum, value) => {
    const num = Number(value);
    return Number.isFinite(num) ? sum + Math.max(0, num) : sum;
  }, 0);
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  const filtered = values.filter((value) => Number.isFinite(value));
  return filtered.length ? filtered.reduce((sum, value) => sum + value, 0) / filtered.length : 0;
}

function scoreFor({ questions, answers, mbti, typeLens, scoringKeys }) {
  const raw = {};
  const tagRaw = {};
  const maxScores = {};
  const maxTagScores = {};

  questions.forEach((question) => {
    addWeights(maxScores, question.weights);
    addWeights(maxScores, question.protectiveWeights);
    if (question.darkSwitchTag) {
      maxTagScores[question.darkSwitchTag] = (maxTagScores[question.darkSwitchTag] || 0) + positiveWeightTotal(question.weights);
    }
  });

  questions.forEach((question) => {
    const value = Number(answers[question.id]);
    const agreement = (value - 1) / 6;
    const shadowRatio = question.reverse ? 1 - agreement : agreement;
    addScaledWeights(raw, question.weights, shadowRatio);
    addScaledWeights(raw, question.protectiveWeights, agreement);
    if (question.darkSwitchTag) {
      tagRaw[question.darkSwitchTag] = (tagRaw[question.darkSwitchTag] || 0) + positiveWeightTotal(question.weights) * shadowRatio;
    }
  });

  const bias = typeLens[mbti]?.bias || {};
  const keys = new Set([
    ...Object.keys(scoringKeys),
    ...Object.keys(maxScores),
    ...Object.keys(raw),
    ...Object.keys(bias)
  ]);
  const scores = {};
  keys.forEach((key) => {
    const max = maxScores[key] || 0;
    const answerScore = max > 0 ? clamp(Math.round(((raw[key] || 0) / max) * 100)) : 0;
    const biasScore = clamp(Math.round((Number(bias[key]) || 0) * 50));
    scores[key] = biasScore > 0 ? clamp(Math.round(answerScore * 0.8 + biasScore * 0.2)) : answerScore;
  });

  const tagScores = {};
  Object.entries(maxTagScores).forEach(([tag, max]) => {
    tagScores[tag] = max > 0 ? clamp(Math.round(((tagRaw[tag] || 0) / max) * 100)) : 0;
  });

  const contradictionScore = clamp(Math.round(average([
    Math.sqrt((scores.clean_claim || 0) * (scores.hidden_truth || 0)),
    Math.sqrt((scores.impression_management || 0) * (scores.emotional_suppression || 0)),
    Math.sqrt((scores.good_face || 0) * (scores.approval_hunger || 0))
  ])));
  const recoveryScore = average([scores.self_awareness || 0, scores.directness || 0, scores.stability || 0]);
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

  return { scores, tagScores, goodFaceMeter, hiddenTruthMeter };
}

const windowData = await loadBrowserData();
const types = windowData.MOBBY_MBTI_TYPES || [];
const scale = windowData.MOBBY_MBTI_LIKERT_SCALE || [];
const questions = windowData.MOBBY_QUESTIONS || [];
const questionsByMbti = windowData.MOBBY_QUESTIONS_BY_MBTI || {};
const typeLens = windowData.MOBBY_TYPE_LENS || {};
const meterCopy = windowData.MOBBY_METER_COPY || [];
const scoringKeys = windowData.MOBBY_SCORING_KEYS || {};

const allowedTags = new Set(["rejection", "disrespect", "ignored_effort", "control_loss", "intimacy", "comparison", "ambiguity", "silence"]);
const darkCopyTags = new Set(meterCopy.filter((item) => item.meter === "dark_switch").map((item) => item.range));

assert(types.length === 16, "MBTI types should contain 16 entries");
assert(questions.length === 28, "Mobby MBTI shadow diagnosis should contain 28 questions");
assert(scale.length === 7, "Likert scale should contain 7 choices");
assert(scale.every((item, index) => Number(item.value) === index + 1 && item.label), "Likert scale should be values 1-7 with labels");
assert(Object.keys(questionsByMbti).length === 16, "questionsByMbti should expose every MBTI type");

types.forEach((type) => {
  assert(Array.isArray(questionsByMbti[type.code]), `${type.code} should have questions`);
  assert(questionsByMbti[type.code].length === 28, `${type.code} should use 28 questions`);
  assert(typeLens[type.code]?.bias, `${type.code} should have MBTI bias`);
});

questions.forEach((question, index) => {
  const expectedId = `Q${String(index + 1).padStart(2, "0")}`;
  assert(question.id === expectedId, `${expectedId} should be in order`);
  assert(question.number === index + 1, `${expectedId} should have matching number`);
  assert(typeof question.text === "string" && question.text.length >= 18, `${expectedId} should have natural text`);
  assert(!Array.isArray(question.options), `${expectedId} should not use old 5-choice options`);
  assert(question.weights && typeof question.weights === "object", `${expectedId} should have weights`);
  assert(question.darkSwitchTag === undefined || allowedTags.has(question.darkSwitchTag), `${expectedId} has unknown dark switch tag`);
  if (question.darkSwitchTag) assert(darkCopyTags.has(question.darkSwitchTag), `${expectedId} dark switch tag should have copy`);

  [...Object.keys(question.weights || {}), ...Object.keys(question.protectiveWeights || {})].forEach((key) => {
    assert(scoringKeys[key], `${expectedId} uses undocumented scoring key: ${key}`);
  });
});

const answerSets = [
  Object.fromEntries(questions.map((question) => [question.id, 1])),
  Object.fromEntries(questions.map((question) => [question.id, 4])),
  Object.fromEntries(questions.map((question) => [question.id, 7])),
  Object.fromEntries(questions.map((question, index) => [question.id, (index % 7) + 1]))
];

types.forEach((type) => {
  answerSets.forEach((answers, index) => {
    const result = scoreFor({ questions, answers, mbti: type.code, typeLens, scoringKeys });
    assert(result.goodFaceMeter >= 0 && result.goodFaceMeter <= 100, `${type.code} answer set ${index} goodFaceMeter out of range`);
    assert(result.hiddenTruthMeter >= 0 && result.hiddenTruthMeter <= 100, `${type.code} answer set ${index} hiddenTruthMeter out of range`);
    Object.entries(result.scores).forEach(([key, value]) => {
      assert(value >= 0 && value <= 100, `${type.code} score ${key} out of range`);
    });
    Object.entries(result.tagScores).forEach(([tag, value]) => {
      assert(allowedTags.has(tag), `${type.code} has unknown tag score ${tag}`);
      assert(value >= 0 && value <= 100, `${type.code} tag ${tag} out of range`);
    });
  });
});

console.log(`Mobby MBTI shadow validation passed: ${types.length} MBTI types, ${questions.length} questions, ${scale.length}-point scale`);
