import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { readFile } from "fs/promises";
import {
  buildPairCompatibility,
  compatibilityRank,
  loadDiagnosisProfileByEmail,
  toDiagnosticsList
} from "./_diagnosis-profiles.js";

const LOCAL_SOURCE_META = {
  "16school": { label: "学校モビー診断", shortLabel: "学校", accent: "#ff8a65" },
  "16mama": { label: "ママモビー診断", shortLabel: "ママ", accent: "#ffb74d" },
  "16love": { label: "メンヘラモビー診断", shortLabel: "メンヘラ", accent: "#ef5350" },
  "16stan": { label: "推し活モビー診断", shortLabel: "推し活", accent: "#66bb6a" },
  "16night": { label: "夜職モビー診断", shortLabel: "夜職", accent: "#42a5f5" }
};

const AXIS_KEYS = ["A", "B", "C", "D"];

function resolveOrigin(req) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  if (!host) return "https://www.mobby.online";
  return `${proto}://${host}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeName(name) {
  return String(name || "").trim().slice(0, 80);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function safeJson(data) {
  return JSON.stringify(data || {}).replaceAll("<", "\\u003c");
}

function applyTemplate(template, map) {
  let output = template;
  Object.entries(map).forEach(([key, value]) => {
    output = output.replaceAll(`{{${key}}}`, value ?? "");
  });
  return output;
}

function toIsoDate(input) {
  const date = new Date(input || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function sanitizeAxes(axes) {
  const out = {};
  AXIS_KEYS.forEach((key) => {
    const value = Number(axes?.[key]);
    out[key] = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 50;
  });
  return out;
}

function sanitizeSource(source) {
  const raw = String(source || "").trim().toLowerCase();
  if (raw === "16school") return "16school";
  if (raw === "16mama" || raw === "16school_mama" || raw === "mama") return "16mama";
  if (raw === "16love") return "16love";
  if (raw === "16stan") return "16stan";
  if (raw === "16night") return "16night";
  return "";
}

function sanitizeLocalDiagnostics(localDiagnostics) {
  if (!Array.isArray(localDiagnostics)) return [];

  const uniqueBySource = new Map();
  for (const item of localDiagnostics) {
    const source = sanitizeSource(item?.source);
    if (!source) continue;
    if (uniqueBySource.has(source)) continue;
    const meta = LOCAL_SOURCE_META[source];
    uniqueBySource.set(source, {
      source,
      sourceLabel: meta.label,
      sourceShortLabel: meta.shortLabel,
      accent: meta.accent,
      type: String(item?.type || "").trim().slice(0, 32),
      diagnosisType: String(item?.diagnosisType || item?.diagTitle || "").trim().slice(0, 120),
      axes: sanitizeAxes(item?.axes),
      answeredCount: Number(item?.answeredCount || 0),
      createdAt: toIsoDate(item?.createdAt)
    });
  }

  return [...uniqueBySource.values()];
}

function buildSummary(userName, diagnostics, pairCompatibility) {
  const count = diagnostics.length;
  const first = diagnostics[0];
  const topPair = pairCompatibility[0];

  if (!first) {
    return `${userName}さんの診断プロフィール`;
  }

  if (!topPair) {
    return `${count}診断の結果をまとめました。今のあなたの主役タイプは「${first.diagnosisType || first.sourceLabel}」。`;
  }

  return `${count}診断を束ねた自己紹介ページ。特に「${topPair.leftLabel} × ${topPair.rightLabel}」の整合スコアは ${topPair.score}。`;
}

function renderRegisterPageHtml() {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>モビーマイページ登録</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --ink: #0f172a;
      --sub: #475569;
      --line: rgba(15, 23, 42, 0.15);
      --card: rgba(255, 255, 255, 0.88);
      --accent: #0284c7;
      --accent2: #f97316;
      --ok: #16a34a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      color: var(--ink);
      font-family: "Noto Sans JP", sans-serif;
      background:
        radial-gradient(circle at 8% 10%, rgba(2,132,199,0.2), transparent 44%),
        radial-gradient(circle at 92% 90%, rgba(249,115,22,0.22), transparent 48%),
        linear-gradient(140deg, #f0f9ff, #fff7ed 58%, #f0fdf4);
    }
    .wrap {
      width: min(920px, 100% - 26px);
      margin: 24px auto 54px;
      display: grid;
      gap: 12px;
    }
    .card {
      background: var(--card);
      border: 1px solid rgba(255,255,255,0.75);
      border-radius: 24px;
      padding: 22px;
      box-shadow: 0 20px 50px rgba(2, 132, 199, 0.14);
      backdrop-filter: blur(10px);
    }
    h1 {
      margin: 0;
      font-family: "Bricolage Grotesque", sans-serif;
      font-size: clamp(28px, 4.8vw, 44px);
      line-height: 1.06;
    }
    .lead {
      margin: 8px 0 0;
      color: var(--sub);
      line-height: 1.8;
      font-size: 14px;
    }
    .chips {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 8px;
    }
    .chip {
      border-radius: 12px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.86);
      padding: 9px 8px;
      text-align: center;
      font-size: 12px;
      line-height: 1.3;
    }
    .chip strong { display: block; font-size: 13px; margin-bottom: 2px; }
    .chip.ok {
      border-color: rgba(22,163,74,0.4);
      background: rgba(220,252,231,0.9);
    }
    .form {
      margin-top: 10px;
      display: grid;
      gap: 10px;
    }
    .field { display: grid; gap: 4px; }
    .field label { font-size: 12px; color: var(--sub); }
    .field input {
      width: 100%;
      border-radius: 12px;
      border: 1px solid var(--line);
      padding: 12px;
      font-size: 14px;
      background: #fff;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 2px;
    }
    button, .btn {
      border: none;
      border-radius: 999px;
      padding: 11px 16px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .primary {
      color: #fff;
      background: linear-gradient(135deg, var(--accent), #0369a1);
      box-shadow: 0 14px 30px rgba(2,132,199,0.25);
    }
    .ghost {
      color: var(--ink);
      background: rgba(255,255,255,0.86);
      border: 1px solid var(--line);
    }
    .result {
      margin-top: 10px;
      padding: 12px;
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(255,255,255,0.9);
      display: none;
      line-height: 1.8;
      font-size: 13px;
    }
    .error {
      margin-top: 8px;
      color: #b91c1c;
      font-size: 12px;
      display: none;
    }
    @media (max-width: 860px) {
      .chips { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <h1>複数診断を1ページに<br>まとめて公開しよう</h1>
      <p class="lead">
        学校・メンヘラ・推し活・夜職・ママ診断を横断して、あなた専用の自己紹介ページを生成します。<br>
        相性突合・SNS共有・画像保存までまとめて使えます。
      </p>
      <div class="chips" id="diagnosisChips"></div>
    </section>

    <section class="card">
      <h2 style="margin:0;font-size:22px;font-family:'Bricolage Grotesque',sans-serif;">マイページ登録</h2>
      <p class="lead" style="margin-top:6px;">診断で使ったメールを入力すると、過去結果を自動で集約します。</p>
      <div class="form">
        <div class="field">
          <label for="nameInput">表示名（任意）</label>
          <input id="nameInput" type="text" placeholder="例: はるか">
        </div>
        <div class="field">
          <label for="emailInput">メールアドレス（必須）</label>
          <input id="emailInput" type="email" placeholder="example@gmail.com">
        </div>
      </div>
      <div class="actions">
        <button id="createBtn" class="primary" type="button">マイページを生成</button>
        <a class="btn ghost" href="/index.html">トップに戻る</a>
      </div>
      <p id="errorText" class="error"></p>
      <div id="resultBox" class="result"></div>
    </section>
  </main>

  <script>
    (() => {
      const STORAGE_TARGETS = [
        { key: "school_char_diag_v1", label: "学校", source: "16school" },
        { key: "love_char_diag_v1", label: "メンヘラ", source: "16love" },
        { key: "stan_char_diag_v1", label: "推し活", source: "16stan" },
        { key: "night_char_diag_v1", label: "夜職", source: "16night" },
        { key: "mamaMobbyState", label: "ママ", source: "16mama" }
      ];

      function parseStorage(key) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          return JSON.parse(raw);
        } catch (_) {
          return null;
        }
      }

      function readProgress() {
        const rows = [];
        let seedName = "";
        let seedEmail = "";

        STORAGE_TARGETS.forEach((target) => {
          const data = parseStorage(target.key);
          const answers = data && data.answers && typeof data.answers === "object"
            ? Object.keys(data.answers).length
            : 0;
          const name = data?.profile?.name || "";
          const email = data?.profile?.email || "";
          const type = data?.type || "";
          const diagnosisType = data?.diagnosisName || data?.diagTitle || "";
          const axes = data?.axes || data?.leftPct || {};
          const createdAt = data?.createdAt || data?.updatedAt || "";

          if (!seedName && name) seedName = name;
          if (!seedEmail && email) seedEmail = email;

          rows.push({
            label: target.label,
            source: target.source,
            answeredCount: answers,
            done: answers > 0,
            type,
            diagnosisType,
            axes,
            createdAt
          });
        });

        return { rows, seedName, seedEmail };
      }

      const chipsEl = document.getElementById("diagnosisChips");
      const nameInput = document.getElementById("nameInput");
      const emailInput = document.getElementById("emailInput");
      const createBtn = document.getElementById("createBtn");
      const errorText = document.getElementById("errorText");
      const resultBox = document.getElementById("resultBox");

      const progress = readProgress();
      chipsEl.innerHTML = progress.rows.map((row) => {
        const klass = row.done ? "chip ok" : "chip";
        const status = row.done ? "診断済み" : "未診断";
        return "<div class=\"" + klass + "\"><strong>" + row.label + "</strong>" + status + "</div>";
      }).join("");

      if (progress.seedName) nameInput.value = progress.seedName;
      if (progress.seedEmail) emailInput.value = progress.seedEmail;

      function showError(message) {
        errorText.textContent = message;
        errorText.style.display = "block";
      }

      function clearError() {
        errorText.style.display = "none";
      }

      function showResult(html) {
        resultBox.innerHTML = html;
        resultBox.style.display = "block";
      }

      createBtn.addEventListener("click", async () => {
        clearError();
        resultBox.style.display = "none";

        const name = String(nameInput.value || "").trim();
        const email = String(emailInput.value || "").trim();
        if (!email || !email.includes("@")) {
          showError("メールアドレスを入力してください。");
          return;
        }

        createBtn.disabled = true;
        createBtn.textContent = "生成中...";

        try {
          const response = await fetch("/api/mypage-register", {
            method: "POST",
            body: JSON.stringify({
              name,
              email,
              localDiagnostics: progress.rows.filter((row) => row.done)
            })
          });
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data?.ok) {
            throw new Error(data?.error || "ページ生成に失敗しました");
          }

          showResult(
            "生成が完了しました。<br>" +
            "<a class=\"btn primary\" href=\"" + data.viewerUrl + "\" target=\"_blank\" rel=\"noopener\">マイページを開く</a> " +
            "<button id=\"copyGeneratedLink\" class=\"btn ghost\" type=\"button\">URLをコピー</button>"
          );

          const copyBtn = document.getElementById("copyGeneratedLink");
          if (copyBtn) {
            copyBtn.addEventListener("click", async () => {
              try {
                await navigator.clipboard.writeText(data.viewerUrl);
                copyBtn.textContent = "コピーしました";
              } catch (_) {
                window.prompt("URLをコピーしてください", data.viewerUrl);
              }
            });
          }
        } catch (error) {
          const rawMessage = error?.message || "";
          if (isLocal && /Failed to fetch|NetworkError|Load failed/i.test(rawMessage)) {
            showError("ローカル実行では通信がブロックされる場合があります。https://www.mobby.online/mypage-register.html で実行するか、vercel dev で同一オリジン起動してください。");
          } else {
            showError(rawMessage || "エラーが発生しました");
          }
        } finally {
          createBtn.disabled = false;
          createBtn.textContent = "マイページを生成";
        }
      });
    })();
  </script>
</body>
</html>`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    try {
      const staticPageUrl = new URL("../mypage-register.html", import.meta.url);
      const staticPageHtml = await readFile(staticPageUrl, "utf8");
      return res.status(200).send(staticPageHtml);
    } catch (_) {
      return res.status(200).send(renderRegisterPageHtml());
    }
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      body = JSON.parse(body);
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({ ok: false, error: "Body must be object" });
    }

    const email = normalizeEmail(body.email);
    const name = normalizeName(body.name);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ ok: false, error: "email is invalid" });
    }

    let profile = null;
    try {
      profile = await loadDiagnosisProfileByEmail(email);
    } catch (loadError) {
      console.warn("[MYPAGE REGISTER] profile load skipped:", loadError?.message || loadError);
    }
    let diagnostics = toDiagnosticsList(profile);

    if (diagnostics.length === 0) {
      diagnostics = sanitizeLocalDiagnostics(body.localDiagnostics);
    }

    if (diagnostics.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "診断データが見つかりません。診断結果画面を開いた後に再度お試しください。"
      });
    }

    const normalizedDiagnostics = diagnostics
      .slice(0, 6)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const pairCompatibility = buildPairCompatibility(normalizedDiagnostics)
      .map((pair) => ({
        ...pair,
        rank: compatibilityRank(pair.score)
      }))
      .slice(0, 10);

    const userName = name || normalizeName(profile?.primaryName) || "あなた";
    const summary = buildSummary(userName, normalizedDiagnostics, pairCompatibility);
    const pageId = randomUUID().replaceAll("-", "").slice(0, 16);

    const pagePayload = {
      version: 1,
      profileId: pageId,
      userName,
      summary,
      generatedAt: new Date().toISOString(),
      diagnostics: normalizedDiagnostics,
      pairCompatibility
    };

    const pageTitle = `${userName}のモビー自己紹介ページ`;
    const ogDescription = `${normalizedDiagnostics.length}種類の診断結果をまとめたプロフィールページ`;
    const templateUrl = new URL("../mypage/profile-template.html", import.meta.url);
    const template = await readFile(templateUrl, "utf8");
    const html = applyTemplate(template, {
      PAGE_TITLE: escapeHtml(pageTitle),
      OG_DESCRIPTION: escapeHtml(ogDescription),
      PROFILE_JSON: safeJson(pagePayload)
    });

    const blob = await put(`mypage/profile-${pageId}.html`, html, {
      access: "public",
      addRandomSuffix: false,
      contentType: "text/html; charset=utf-8"
    });

    const origin = resolveOrigin(req);
    const viewerUrl = `${origin}/api/mypage?u=${encodeURIComponent(blob.url)}&id=${encodeURIComponent(pageId)}`;

    return res.status(200).json({
      ok: true,
      pageId,
      viewerUrl,
      diagnosticsCount: normalizedDiagnostics.length,
      generatedAt: pagePayload.generatedAt
    });
  } catch (error) {
    console.error("[MYPAGE REGISTER] Error:", error);
    return res.status(500).json({ ok: false, error: error?.message || "Internal Error" });
  }
}
