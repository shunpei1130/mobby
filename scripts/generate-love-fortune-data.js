const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const referenceDir = path.join(root, "docs", "16renai", "reference");
const outputPath = path.join(root, "docs", "16renai", "assets", "loveMobbyFortuneData.js");

const TYPE_CODES = ["HLTO", "HLTC", "HLAO", "HLAC", "HFTO", "HFTC", "HFAO", "HFAC", "SLTO", "SLTC", "SLAO", "SLAC", "SFTO", "SFTC", "SFAO", "SFAC"];

const files = {
  daily: "love_mobby_daily_fortunes_31days_16types_new.md",
  weekly: "love_mobby_weekly_fortunes_8weeks_16types_new.md",
  monthly: "love_mobby_monthly_fortunes_15patterns_16types_new.md"
};

const read = (name) => fs.readFileSync(path.join(referenceDir, name), "utf8").replace(/\r\n/g, "\n");

const parseTypeLine = (line) => {
  const match = line.match(/^#\s+([A-Z]{4})：(.+)$/);
  return match ? { code: match[1], name: match[2].trim() } : null;
};

const parseKeyPerson = (value) => {
  const match = String(value || "").match(/^([A-Z]{4})：(.+)$/);
  return match ? { code: match[1], name: match[2].trim() } : { code: "", name: value || "" };
};

const ensureType = (target, code) => {
  if (!target[code]) target[code] = [];
  return target[code];
};

const parseDaily = (markdown) => {
  const data = {};
  let currentType = null;
  let current = null;
  const push = () => {
    if (!currentType || !current) return;
    ensureType(data, currentType.code)[current.dayIndex] = current;
    current = null;
  };

  markdown.split("\n").forEach((line) => {
    const type = parseTypeLine(line);
    if (type) {
      push();
      currentType = type;
      return;
    }

    const day = line.match(/^##\s+Day\s+(\d+)/);
    if (day) {
      push();
      current = {
        day: Number(day[1]),
        dayIndex: Number(day[1]) - 1,
        typeCode: currentType?.code || "",
        typeName: currentType?.name || ""
      };
      return;
    }

    if (!current) return;
    const item = line.match(/^-\s+([^:]+):\s*(.*)$/);
    if (!item) return;
    const key = item[1].trim();
    const value = item[2].trim();
    if (key === "今日の状態") current.mood = value;
    if (key === "恋予報スコア") current.score = Number(value.replace(/[^0-9]/g, ""));
    if (key === "今日のテーマ") current.theme = value;
    if (key === "メッセージ") current.message = value;
    if (key === "今日のミッション") current.mission = value;
    if (key === "今日のキーパーソン") current.keyPerson = parseKeyPerson(value);
    if (key === "キーパーソン文") {
      current.keyPerson = { ...(current.keyPerson || {}), text: value };
    }
    if (key === "ラッキーアイテム") current.luckyItem = value;
    if (key === "共有文") current.shareText = value;
  });
  push();
  return data;
};

const setSection = (entry, heading, body) => {
  const value = body.trim();
  if (!value) return;
  const map = {
    "今週のテーマ": "theme",
    "今週のあなたの状態": "state",
    "恋が進みやすいポイント": "progressPoint",
    "すれ違いやすいポイント": "misreadPoint",
    "片思いの人へ": "singleAdvice",
    "恋人がいる人へ": "partnerAdvice",
    "曖昧な関係の人へ": "ambiguousAdvice",
    "今週の小さなミッション": "mission",
    "今週のラッキー行動": "luckyAction",
    "今週のキーパーソン": "keyPerson",
    "今週の締めメッセージ": "closingMessage",
    "今月のテーマ": "theme",
    "今月のあなたの恋愛モード": "mode",
    "月初の流れ": "earlyFlow",
    "月中の流れ": "middleFlow",
    "月末の流れ": "lateFlow",
    "出会い運": "encounterLuck",
    "片思い運": "singleLuck",
    "恋人運": "partnerLuck",
    "曖昧な関係の進展運": "ambiguousLuck",
    "注意したいこと": "caution",
    "今月のチャンスアクション": "chanceAction",
    "今月相性が上がるタイプ": "compatibleType",
    "今月のラッキー行動": "luckyAction",
    "今月の締めメッセージ": "closingMessage"
  };
  const field = map[heading];
  if (!field) return;
  entry[field] = field === "keyPerson" || field === "compatibleType" ? parseKeyPerson(value) : value;
};

const parseHeadingBased = (markdown, options) => {
  const data = {};
  let currentType = null;
  let current = null;
  let currentHeading = "";
  let buffer = [];

  const flushSection = () => {
    if (!current || !currentHeading) return;
    setSection(current, currentHeading, buffer.join("\n"));
    currentHeading = "";
    buffer = [];
  };

  const push = () => {
    flushSection();
    if (!currentType || !current) return;
    ensureType(data, currentType.code)[current[options.indexField]] = current;
    current = null;
  };

  markdown.split("\n").forEach((line) => {
    const type = parseTypeLine(line);
    if (type) {
      push();
      currentType = type;
      return;
    }

    const block = line.match(options.blockPattern);
    if (block) {
      push();
      const number = Number(block[1]);
      current = {
        [options.numberField]: number,
        [options.indexField]: number - 1,
        typeCode: currentType?.code || "",
        typeName: currentType?.name || ""
      };
      return;
    }

    const heading = line.match(/^###\s+(.+)$/);
    if (heading) {
      flushSection();
      currentHeading = heading[1].trim();
      return;
    }

    if (!current || !currentHeading) return;
    if (line.trim() === "---") return;
    if (line.trim()) buffer.push(line.trim());
  });
  push();
  return data;
};

const validate = (label, data, expectedCount) => {
  const missing = [];
  TYPE_CODES.forEach((code) => {
    const list = data[code] || [];
    for (let index = 0; index < expectedCount; index += 1) {
      if (!list[index]) missing.push(`${code}:${index}`);
    }
  });
  if (missing.length) {
    throw new Error(`${label} data is incomplete: ${missing.slice(0, 20).join(", ")}`);
  }
};

const data = {
  daily: parseDaily(read(files.daily)),
  weekly: parseHeadingBased(read(files.weekly), {
    blockPattern: /^##\s+Week\s+(\d+)/,
    numberField: "week",
    indexField: "weekIndex"
  }),
  monthly: parseHeadingBased(read(files.monthly), {
    blockPattern: /^##\s+Month Pattern\s+(\d+)/,
    numberField: "monthPattern",
    indexField: "monthPatternIndex"
  })
};

validate("daily", data.daily, 31);
validate("weekly", data.weekly, 8);
validate("monthly", data.monthly, 15);

const output = `window.LOVE_MOBBY_FORTUNE_DATA_NEW = ${JSON.stringify(data)};\n`;
fs.writeFileSync(outputPath, output, "utf8");
console.log(`Generated ${path.relative(root, outputPath)}`);
