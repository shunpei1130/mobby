import { DIAGNOSIS_KNOWLEDGE, findTypeMatches, getDiagnosisTypes } from "./_diagnosis-knowledge.js";

function normalizeText(text) {
  return String(text || "").toLowerCase().replace(/\s+/g, "");
}

function typeLabel(type) {
  return type?.characterName || type?.displayName || type?.name || "";
}

function isSameType(a, b) {
  if (!a || !b) return false;
  return a === b || normalizeText(a) === normalizeText(b);
}

function findTypeInSource(source, { resultId, resultName } = {}) {
  const types = getDiagnosisTypes(source);
  const normalizedName = normalizeText(resultName);
  return types.find((type) => {
    const names = [type.name, type.displayName, type.characterName].filter(Boolean);
    return isSameType(resultId, type.code) || names.some((name) => normalizeText(name) === normalizedName);
  }) || null;
}

function findTypeAcrossSources({ resultId, resultName } = {}) {
  for (const source of Object.keys(DIAGNOSIS_KNOWLEDGE)) {
    const type = findTypeInSource(source, { resultId, resultName });
    if (type) return { source, diagnosis: DIAGNOSIS_KNOWLEDGE[source], type };
  }
  return null;
}

function diffCount(a, b) {
  const left = Array.from(String(a || ""));
  const right = Array.from(String(b || ""));
  const length = Math.max(left.length, right.length);
  if (!length) return 4;
  let diff = 0;
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) diff += 1;
  }
  return diff;
}

function scoreForDiff(diff, mode) {
  if (diff === 0) return mode === "similar" ? 95 : 70;
  if (diff === 1) return 92;
  if (diff === 2) return 88;
  if (diff === 3) return 78;
  return 72;
}

function reasonForDiff(diff, index, mode) {
  if (mode === "bad") {
    if (diff >= 4) return "違いが大きくて、テンポのズレが出やすいかも";
    if (diff === 3) return "近づき方や温度感の違いが出やすいかも";
    return "似ている分、同じ弱点が同時に出やすいかも";
  }
  if (mode === "similar") {
    if (diff === 0) return "かなり近い感覚で安心しやすい";
    if (diff === 1) return "近い感覚で会話のテンポが合いやすい";
    return "共通点がありつつ、違いも楽しみやすい";
  }
  if (diff === 1) return index === 0 ? "近い感覚で安心しやすい" : "会話のテンポが合いやすい";
  if (diff === 2) return "違いを補いやすい";
  if (diff === 3) return "違いが刺激になりやすい";
  if (diff >= 4) return "真逆寄りで、補完型として見やすい";
  return "似ている分、空気感をつかみやすい";
}

function modeFromMessage(message) {
  const text = String(message || "");
  if (/相性.*悪|相性悪|合わない|合わなそう|苦手|ぶつか|逆に.*(合わない|相性悪|苦手|ぶつか)/.test(text)) return "bad";
  if (/似てる|似ている|同じ|近い/.test(text)) return "similar";
  return "good";
}

export function isCompatibilityQuestion(message) {
  return /相性|合う|合いそう|合わない|似てる|似ている|補える|補いやすい|おすすめのモビー|私に合う|自分に合う/.test(String(message || ""));
}

export function findTypeReference({ user, message } = {}) {
  if (!isCompatibilityQuestion(message)) return null;

  const explicitMatch = findTypeMatches(message)[0];
  if (explicitMatch) {
    return {
      source: explicitMatch.source,
      diagnosis: explicitMatch.diagnosis,
      type: explicitMatch.type,
      from: "message"
    };
  }

  if (user?.personalResultLinked && user?.resultName) {
    const source = user.source;
    const type = findTypeInSource(source, {
      resultId: user.resultId,
      resultName: user.resultName
    });
    if (type && DIAGNOSIS_KNOWLEDGE[source]) {
      return {
        source,
        diagnosis: DIAGNOSIS_KNOWLEDGE[source],
        type,
        from: "user"
      };
    }

    const fallback = findTypeAcrossSources({
      resultId: user.resultId,
      resultName: user.resultName
    });
    if (fallback) return { ...fallback, from: "user" };
  }

  return null;
}

export function getCompatibleTypes({ source, resultId, resultName, mode = "good" } = {}) {
  const baseType = findTypeInSource(source, { resultId, resultName });
  if (!baseType) return [];

  const types = getDiagnosisTypes(source)
    .filter((type) => type !== baseType)
    .map((type) => {
      const diff = diffCount(baseType.code, type.code);
      return {
        type,
        diff,
        score: scoreForDiff(diff, mode)
      };
    });

  const ranked = types.sort((a, b) => {
    if (mode === "bad") {
      return b.diff - a.diff || b.score - a.score || typeLabel(a.type).localeCompare(typeLabel(b.type), "ja");
    }
    if (mode === "similar") {
      return a.diff - b.diff || b.score - a.score || typeLabel(a.type).localeCompare(typeLabel(b.type), "ja");
    }
    const rankA = a.diff === 1 ? 0 : a.diff === 2 ? 1 : a.diff === 3 ? 2 : a.diff === 4 ? 3 : 4;
    const rankB = b.diff === 1 ? 0 : b.diff === 2 ? 1 : b.diff === 3 ? 2 : b.diff === 4 ? 3 : 4;
    return rankA - rankB || b.score - a.score || typeLabel(a.type).localeCompare(typeLabel(b.type), "ja");
  });

  return ranked.slice(0, mode === "bad" ? 2 : 3);
}

function formatCandidate(candidate, index, mode) {
  const label = typeLabel(candidate.type);
  return `${index + 1}. 「${label}」: ${reasonForDiff(candidate.diff, index, mode)}`;
}

export function buildCompatibilityContext({ user, message } = {}) {
  if (!isCompatibilityQuestion(message)) return "";

  const mode = modeFromMessage(message);
  const reference = findTypeReference({ user, message });
  if (!reference) {
    return [
      "相性質問コンテキスト:",
      "- ユーザーは診断上の相性について聞いている",
      "- メッセージ内に基準タイプがなく、保存済み診断結果も未連携",
      "- 診断結果ページからLINE連携すると、ユーザーのタイプを基準に相性候補を出せると自然に案内する",
      "- 相性は診断上の遊びとして扱い、現実の関係を断定しない"
    ].join("\n");
  }

  const candidates = getCompatibleTypes({
    source: reference.source,
    resultId: reference.type.code,
    resultName: typeLabel(reference.type),
    mode
  });
  if (!candidates.length) {
    return [
      "相性質問コンテキスト:",
      "- ユーザーは診断上の相性について聞いている",
      "- 基準タイプは特定できたが、相性候補を算出できなかった",
      "- 診断結果ページからLINE連携すると、ユーザーのタイプを基準により自然に話せると案内する",
      "- 相性は診断上の遊びとして扱い、現実の関係を断定しない"
    ].join("\n");
  }

  const baseLabel = typeLabel(reference.type);
  const sourceLabel = reference.diagnosis?.label || "モビー診断";
  const lines = candidates.map((candidate, index) => formatCandidate(candidate, index, mode));

  return [
    "相性質問コンテキスト:",
    `- 診断: ${sourceLabel}`,
    `- 基準タイプ: ${baseLabel}`,
    `- 質問モード: ${mode === "bad" ? "ぶつかりやすい相手" : mode === "similar" ? "似ている相手" : "合いやすい相手"}`,
    "- 相性候補:",
    ...lines,
    "- 回答では候補を1〜3件に絞って自然に紹介する",
    "- 相性は診断上の遊びとして扱い、現実の関係を断定しない"
  ].join("\n");
}
