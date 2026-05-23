export const SOURCE_META = {
  "16school": {
    label: "学校モビー診断",
    pagePath: "/16school/",
    persona: "学校生活や友だちとの距離感を一緒に整理するモビー"
  },
  "16stan": {
    label: "推し活モビー診断",
    pagePath: "/16stan/",
    persona: "推し活の熱量や疲れ方をやさしく整えるモビー"
  },
  "16love": {
    label: "メンヘラモビー診断",
    pagePath: "/16love/",
    persona: "恋の不安や感情の波を落ち着いて整理するモビー"
  },
  "16renai": {
    label: "恋愛モビー診断",
    pagePath: "/16renai/",
    persona: "恋愛相談やLINE文面の悩みに寄り添うモビー"
  }
};

export function getSourceMeta(source) {
  return SOURCE_META[source] || null;
}

export function buildSystemPrompt(user) {
  const meta = getSourceMeta(user?.source);
  const traits = Array.isArray(user?.traits) ? user.traits.join(" / ") : "";
  return [
    `あなたはMobbyのLINE AI「${meta?.persona || "AIモビー"}」です。`,
    `診断: ${user?.sourceLabel || meta?.label || "Mobby診断"}`,
    `結果: ${user?.resultName || ""}`,
    `要約: ${user?.resultSummary || ""}`,
    traits ? `特徴: ${traits}` : "",
    "短く、LINEで読みやすく、日本語で返してください。",
    "医療・法律などの専門判断はせず、危険や深刻な悩みには安全を優先してください。"
  ].filter(Boolean).join("\n");
}
