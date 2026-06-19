const DEFAULT_DAILY_USER_LIMIT = 300;
const DEFAULT_DAILY_TOTAL_LIMIT = 5000;
const STALE_COUNTER_RECOVERY_MAX = 20;

function readPositiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

export function dailyUserLimit() {
  return readPositiveInteger(process.env.LINE_AI_DAILY_USER_LIMIT, DEFAULT_DAILY_USER_LIMIT);
}

export function dailyTotalLimit() {
  return readPositiveInteger(process.env.LINE_AI_DAILY_TOTAL_LIMIT, DEFAULT_DAILY_TOTAL_LIMIT);
}

export function todayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function canReply(user, date = new Date()) {
  const today = todayKey(date);
  const count = user?.messageCountDate === today ? Number(user?.messageCountToday || 0) : 0;
  const limit = dailyUserLimit();
  return {
    ok: count < limit,
    count,
    limit,
    today
  };
}

export function canReplyWithConversation(user, conversation, date = new Date()) {
  const today = todayKey(date);
  const limit = dailyUserLimit();
  const storedCount = user?.messageCountDate === today ? Number(user?.messageCountToday || 0) : 0;
  const conversationCount = conversation?.dailyCountDate === today ? Number(conversation?.dailyCount || 0) : 0;
  const canRecoverStaleCounter = storedCount >= limit
    && conversationCount > 0
    && conversationCount < Math.min(limit, STALE_COUNTER_RECOVERY_MAX);
  const count = canRecoverStaleCounter ? conversationCount : storedCount;
  return {
    ok: count < limit,
    count,
    limit,
    today,
    storedCount,
    conversationCount,
    recoveredStaleCounter: canRecoverStaleCounter
  };
}

export function recordReply(user, date = new Date(), baseCount = null) {
  const today = todayKey(date);
  const sameDay = user?.messageCountDate === today;
  const hasBaseCount = baseCount !== null && baseCount !== undefined && Number.isFinite(Number(baseCount));
  const count = hasBaseCount
    ? Number(baseCount)
    : sameDay
      ? Number(user?.messageCountToday || 0)
      : 0;
  return {
    ...user,
    messageCountDate: today,
    messageCountToday: count + 1,
    lastMessageAt: new Date().toISOString()
  };
}

export function canReplyGlobally(conversation, date = new Date()) {
  const today = todayKey(date);
  const count = conversation?.dailyCountDate === today ? Number(conversation?.dailyCount || 0) : 0;
  const limit = dailyTotalLimit();
  return {
    ok: count < limit,
    count,
    limit,
    today
  };
}

export function recordGlobalReply(conversation, date = new Date()) {
  const today = todayKey(date);
  const sameDay = conversation?.dailyCountDate === today;
  return {
    ...conversation,
    dailyCountDate: today,
    dailyCount: sameDay ? Number(conversation?.dailyCount || 0) + 1 : 1
  };
}

export function buildRateLimitReply() {
  return "今日はここまでにしよう。ちゃんと話してくれてありがとう。また明日、続きから聞かせてね。";
}
