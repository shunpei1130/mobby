import { list, put } from "@vercel/blob";
import { createHash } from "crypto";

const PROFILE_PREFIX = "diagnosis-profiles/";
const PROFILE_VERSION = 1;
const AXIS_KEYS = ["A", "B", "C", "D"];

const SOURCE_META = {
  "16school": { label: "学校モビー診断", shortLabel: "学校", accent: "#ff8a65" },
  "16mama": { label: "ママモビー診断", shortLabel: "ママ", accent: "#ffb74d" },
  "16love": { label: "メンヘラモビー診断", shortLabel: "メンヘラ", accent: "#ef5350" },
  "16stan": { label: "推し活モビー診断", shortLabel: "推し活", accent: "#66bb6a" },
  "16night": { label: "夜職モビー診断", shortLabel: "夜職", accent: "#42a5f5" },
  unknown: { label: "未分類", shortLabel: "未分類", accent: "#9e9e9e" }
};

const SOURCE_ALIASES = {
  "16school": "16school",
  school: "16school",
  school_mobby: "16school",
  "16school_mama": "16mama",
  "16mama": "16mama",
  mama: "16mama",
  "16love": "16love",
  love: "16love",
  menhera: "16love",
  "16stan": "16stan",
  stan: "16stan",
  oshi: "16stan",
  "16night": "16night",
  night: "16night"
};

function clamp(number, min, max) {
  return Math.min(max, Math.max(min, number));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim().slice(0, 80);
}

function maskEmail(email) {
  const normalized = normalizeEmail(email);
  const [local, domain] = normalized.split("@");
  if (!local || !domain) return "";
  if (local.length <= 2) {
    return `${local[0] || "*"}*@${domain}`;
  }
  return `${local[0]}${"*".repeat(Math.min(local.length - 2, 6))}${local[local.length - 1]}@${domain}`;
}

function hashEmail(email) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

function profilePathFromHash(hash) {
  return `${PROFILE_PREFIX}${hash}.json`;
}

async function resolveBlobByPath(pathname) {
  const page = await list({ prefix: pathname, limit: 10 });
  if (!Array.isArray(page.blobs) || page.blobs.length === 0) {
    return null;
  }
  return page.blobs.find((blob) => blob.pathname === pathname) || page.blobs[0];
}

function sanitizeAxes(axes) {
  const out = {};
  AXIS_KEYS.forEach((key) => {
    const value = Number(axes?.[key]);
    out[key] = Number.isFinite(value) ? clamp(Math.round(value), 0, 100) : 50;
  });
  return out;
}

function detectSourceFromTitle(payload) {
  const title = `${payload?.diagTitle || ""}${payload?.diagnosis_type || ""}`.toLowerCase();
  if (!title) return "unknown";
  if (title.includes("ママ")) return "16mama";
  if (title.includes("学校")) return "16school";
  if (title.includes("推し")) return "16stan";
  if (title.includes("夜")) return "16night";
  if (title.includes("メンヘラ") || title.includes("恋")) return "16love";
  return "unknown";
}

function normalizeSource(payload) {
  const sourceRaw = String(payload?.source || "").trim().toLowerCase();
  if (sourceRaw && SOURCE_ALIASES[sourceRaw]) {
    return SOURCE_ALIASES[sourceRaw];
  }
  return detectSourceFromTitle(payload);
}

function toIsoDate(input) {
  const date = new Date(input || Date.now());
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString();
  }
  return date.toISOString();
}

function countAnswers(answers) {
  if (!answers || typeof answers !== "object") return 0;
  return Object.keys(answers).length;
}

function createResultEntry(payload, source) {
  const createdAt = toIsoDate(payload?.createdAt);
  const axes = sanitizeAxes(payload?.axes);
  const diagnosisType = String(payload?.diagnosis_type || payload?.diagTitle || "").trim().slice(0, 120);
  const type = String(payload?.type || "").trim().slice(0, 32);
  const age = String(payload?.age || "").trim().slice(0, 32);
  const answeredCount = countAnswers(payload?.answers);

  return {
    source,
    sourceLabel: SOURCE_META[source]?.label || SOURCE_META.unknown.label,
    type,
    diagnosisType,
    axes,
    age,
    answeredCount,
    createdAt,
    updatedAt: new Date().toISOString()
  };
}

function createEmptyProfile(email, name) {
  const now = new Date().toISOString();
  const normalizedEmail = normalizeEmail(email);
  return {
    version: PROFILE_VERSION,
    emailHash: hashEmail(normalizedEmail),
    emailHint: maskEmail(normalizedEmail),
    primaryName: normalizeName(name),
    createdAt: now,
    updatedAt: now,
    results: {},
    history: []
  };
}

export async function loadDiagnosisProfileByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const path = profilePathFromHash(hashEmail(normalizedEmail));
  let blob = null;
  try {
    blob = await resolveBlobByPath(path);
  } catch (_) {
    return null;
  }
  if (!blob?.url) return null;

  try {
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  }
}

export async function upsertDiagnosisProfile(payload) {
  const email = normalizeEmail(payload?.email);
  if (!email) {
    return { ok: false, reason: "email_missing" };
  }

  const source = normalizeSource(payload);
  const name = normalizeName(payload?.name);
  const path = profilePathFromHash(hashEmail(email));
  const existing = await loadDiagnosisProfileByEmail(email);
  const profile = existing && typeof existing === "object" ? existing : createEmptyProfile(email, name);
  const entry = createResultEntry(payload, source);

  if (name) {
    profile.primaryName = name;
  }

  profile.version = PROFILE_VERSION;
  profile.updatedAt = new Date().toISOString();
  profile.emailHash = hashEmail(email);
  profile.emailHint = maskEmail(email);
  profile.results = profile.results && typeof profile.results === "object" ? profile.results : {};
  profile.history = Array.isArray(profile.history) ? profile.history : [];

  if (source !== "unknown") {
    profile.results[source] = entry;
  }

  profile.history.unshift({
    source: entry.source,
    type: entry.type,
    diagnosisType: entry.diagnosisType,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  });
  profile.history = profile.history.slice(0, 60);

  await put(path, JSON.stringify(profile), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json; charset=utf-8"
  });

  return { ok: true, profile, source };
}

export function toDiagnosticsList(profile) {
  const results = profile?.results;
  if (!results || typeof results !== "object") return [];

  return Object.values(results)
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const normalizedSource = SOURCE_ALIASES[String(entry.source || "").toLowerCase()] || entry.source || "unknown";
      return {
        source: normalizedSource,
        sourceLabel: SOURCE_META[normalizedSource]?.label || SOURCE_META.unknown.label,
        sourceShortLabel: SOURCE_META[normalizedSource]?.shortLabel || SOURCE_META.unknown.shortLabel,
        accent: SOURCE_META[normalizedSource]?.accent || SOURCE_META.unknown.accent,
        type: String(entry.type || "").trim(),
        diagnosisType: String(entry.diagnosisType || "").trim(),
        axes: sanitizeAxes(entry.axes),
        answeredCount: Number(entry.answeredCount || 0),
        createdAt: toIsoDate(entry.createdAt || entry.updatedAt)
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function scoreAxesCompatibility(axesA, axesB) {
  const left = sanitizeAxes(axesA);
  const right = sanitizeAxes(axesB);
  const totalDiff = AXIS_KEYS.reduce((acc, key) => acc + Math.abs(left[key] - right[key]), 0);
  return clamp(Math.round(100 - totalDiff / AXIS_KEYS.length), 0, 100);
}

export function buildPairCompatibility(diagnostics) {
  const pairs = [];
  for (let i = 0; i < diagnostics.length; i += 1) {
    for (let j = i + 1; j < diagnostics.length; j += 1) {
      const a = diagnostics[i];
      const b = diagnostics[j];
      pairs.push({
        leftSource: a.source,
        rightSource: b.source,
        leftLabel: a.sourceShortLabel,
        rightLabel: b.sourceShortLabel,
        score: scoreAxesCompatibility(a.axes, b.axes)
      });
    }
  }
  return pairs.sort((a, b) => b.score - a.score);
}

export function compatibilityRank(score) {
  if (score >= 86) return "神シンクロ";
  if (score >= 72) return "かなり相性◎";
  if (score >= 58) return "良いバランス";
  if (score >= 44) return "凸凹コンビ";
  return "真逆が武器";
}
