const DAILY_USER_LIMIT = 100;
const DAILY_TOTAL_LIMIT = 1000;

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
  return {
    ok: count < DAILY_USER_LIMIT,
    count,
    limit: DAILY_USER_LIMIT,
    today
  };
}

export function recordReply(user, date = new Date()) {
  const today = todayKey(date);
  const sameDay = user?.messageCountDate === today;
  return {
    ...user,
    messageCountDate: today,
    messageCountToday: sameDay ? Number(user?.messageCountToday || 0) + 1 : 1,
    lastMessageAt: new Date().toISOString()
  };
}

export function canReplyGlobally(conversation, date = new Date()) {
  const today = todayKey(date);
  const count = conversation?.dailyCountDate === today ? Number(conversation?.dailyCount || 0) : 0;
  return {
    ok: count < DAILY_TOTAL_LIMIT,
    count,
    limit: DAILY_TOTAL_LIMIT,
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
