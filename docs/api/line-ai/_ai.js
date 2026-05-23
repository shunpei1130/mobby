import { getSourceMeta } from "./_prompts.js";

function compact(text, max = 48) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function loveGuardrail(message, user) {
  if (/追いLINE|監視|既読|位置|SNS|不安|依存|束縛/.test(message)) {
    return `「${user?.resultName || "あなたの結果"}」のモビーとしては、不安が強い時ほど確認を増やすより一度呼吸を置こう。責めない短文か、今日は送らない選択が安全だよ。`;
  }
  return "";
}

export async function generateReply({ user, message }) {
  const provider = String(process.env.AI_PROVIDER || "mock").toLowerCase();
  if (provider !== "mock") {
    console.warn("[LINE AI] MVP-0 uses mock provider only. External AI call skipped.", { provider });
  }
  return generateMockReply({ user, message });
}

export function generateMockReply({ user, message }) {
  const meta = getSourceMeta(user?.source);
  const sourceLabel = user?.sourceLabel || meta?.label || "Mobby診断";
  const resultName = user?.resultName || "あなたの結果";
  const userMessage = compact(message);

  if (user?.source === "16love") {
    const guarded = loveGuardrail(String(message || ""), user);
    if (guarded) return guarded;
  }

  if (user?.source === "16school") {
    return `${sourceLabel}の「${resultName}」っぽく見ると、「${userMessage}」は一人で決めなくて大丈夫。まず味方になりそうな人を1人だけ思い浮かべてみよ。`;
  }
  if (user?.source === "16stan") {
    return `${sourceLabel}の「${resultName}」なら、その熱量は大事にしてOK。「${userMessage}」は、推し活を続ける体力も一緒に守る形で考えよ。`;
  }
  if (user?.source === "16renai") {
    return `${sourceLabel}の「${resultName}」としては、「${userMessage}」は急いで答えを出さなくていいかも。相手の反応より、自分の安心を先に整えよ。`;
  }

  return `${sourceLabel}の「${resultName}」の視点で言うと、「${userMessage}」はちゃんと大事なサイン。小さく整理して、一歩ずつで大丈夫。`;
}
