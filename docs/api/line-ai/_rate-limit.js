const DAILY_USER_LIMIT = 50;
const DAILY_TOTAL_LIMIT = 500;

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function canReply(user) {
  const today = todayKey();
  const count = user?.messageCountDate === today ? Number(user?.messageCountToday || 0) : 0;
  return {
    ok: count < DAILY_USER_LIMIT,
    count,
    limit: DAILY_USER_LIMIT,
    today
  };
}

export function recordReply(user) {
  const today = todayKey();
  const sameDay = user?.messageCountDate === today;
  return {
    ...user,
    messageCountDate: today,
    messageCountToday: sameDay ? Number(user?.messageCountToday || 0) + 1 : 1,
    lastMessageAt: new Date().toISOString()
  };
}

export function canReplyGlobally(conversation) {
  const today = todayKey();
  const count = conversation?.dailyCountDate === today ? Number(conversation?.dailyCount || 0) : 0;
  return {
    ok: count < DAILY_TOTAL_LIMIT,
    count,
    limit: DAILY_TOTAL_LIMIT,
    today
  };
}

export function recordGlobalReply(conversation) {
  const today = todayKey();
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
