const SAFETY_PATTERNS = {
  selfHarm: [
    /死にたい/i,
    /消えたい/i,
    /自殺/i,
    /自傷/i,
    /リスカ/i,
    /ODしたい/i,
    /overdose/i,
    /kill myself/i,
    /suicide/i
  ],
  violence: [
    /殺したい/i,
    /殴りたい/i,
    /刺したい/i,
    /暴力/i,
    /脅す/i,
    /hurt someone/i,
    /kill (him|her|them)/i
  ],
  stalking: [
    /監視/i,
    /位置情報/i,
    /居場所を調べ/i,
    /尾行/i,
    /つけ回/i,
    /パスワード/i,
    /ログイン/i,
    /SNS.*監視/i,
    /stalk/i,
    /tracking/i
  ],
  crisis: [
    /助けて/i,
    /限界/i,
    /もう無理/i,
    /今すぐ.*危ない/i,
    /緊急/i
  ]
};

export function detectSafetyRisk(text) {
  const value = String(text || "");
  const risks = Object.entries(SAFETY_PATTERNS)
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(value)))
    .map(([key]) => key);

  return {
    hasRisk: risks.length > 0,
    risks,
    selfHarm: risks.includes("selfHarm"),
    violence: risks.includes("violence"),
    stalking: risks.includes("stalking"),
    crisis: risks.includes("crisis")
  };
}

export function buildSafetyReply(risk) {
  if (risk?.selfHarm || risk?.crisis) {
    return "今かなり危ないところまでしんどいかも。ひとりで抱えず、近くの人や地域の相談窓口に今すぐつながってね。自分を傷つけそうなら119や緊急窓口へ。ここではあなたを責めないよ。";
  }
  if (risk?.violence) {
    return "その衝動が強い時は、まず相手から離れて安全な場所に移ろう。今すぐ行動せず、近くの人や相談窓口に間に入ってもらってね。";
  }
  if (risk?.stalking) {
    return "相手の居場所やSNSを追い続ける方向は、あなたも相手もしんどくなりやすいよ。今は確認を止めて、自分の安全な場所と時間を先に作ろう。";
  }
  return "今は安全をいちばん優先しよう。ひとりで抱えず、近くの人や相談窓口につながってね。";
}
