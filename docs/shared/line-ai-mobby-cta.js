(function initMobbyLineAiCTA() {
  const API_ENDPOINT = "/api/line-ai/issue-link-token";
  const renderedNodes = new WeakSet();

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function resolveMount(mount) {
    if (!mount) return null;
    if (typeof mount === "string") return document.querySelector(mount);
    return mount instanceof Element ? mount : null;
  }

  function parseDiagnosisFromElement(element) {
    const encoded = element?.dataset?.diagnosis || "";
    if (!encoded) return null;
    try {
      return JSON.parse(decodeURIComponent(encoded));
    } catch (error) {
      console.warn("[LINE AI Mobby CTA] Failed to parse diagnosis payload.", error);
      return null;
    }
  }

  function normalizeDiagnosis(diagnosis) {
    if (!diagnosis || typeof diagnosis !== "object") return null;
    return {
      source: String(diagnosis.source || "").trim(),
      sourceLabel: String(diagnosis.sourceLabel || "").trim(),
      resultId: String(diagnosis.resultId || "").trim(),
      resultName: String(diagnosis.resultName || "").trim(),
      resultSummary: String(diagnosis.resultSummary || "").trim(),
      traits: Array.isArray(diagnosis.traits)
        ? diagnosis.traits.map((trait) => String(trait || "").trim()).filter(Boolean).slice(0, 8)
        : [],
      pagePath: String(diagnosis.pagePath || "").trim(),
      createdAt: String(diagnosis.createdAt || new Date().toISOString()).trim()
    };
  }

  function copyText(text) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(text);
    }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.left = "-9999px";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
      return Promise.resolve();
    } finally {
      area.remove();
    }
  }

  function renderInitial(element, diagnosis) {
    const resultName = diagnosis?.resultName ? `「${escapeHtml(diagnosis.resultName)}」の結果をもとに、LINEで短く返事します。` : "";
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">あなただけのモビーと話そう！</h3>
        <p class="line-ai-mobby-cta__copy">
          ${resultName || "この診断結果をもとに、あなた専用のモビーがLINEで返事します。"}
        </p>
        <div class="line-ai-mobby-cta__actions">
          <button class="line-ai-mobby-cta__button" type="button" data-line-ai-mobby-issue>
            LINEでモビーを追加する
          </button>
        </div>
        <p class="line-ai-mobby-cta__status" data-line-ai-mobby-status></p>
      </section>
    `;
  }

  function renderResult(element, data) {
    const token = escapeHtml(data.token);
    const firstMessageText = escapeHtml(data.firstMessageText || `モビー登録 ${data.token}`);
    const lineAddUrl = escapeHtml(data.lineAddUrl || "#");
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">あなただけのモビーと話そう！</h3>
        <div class="line-ai-mobby-cta__result">
          <p class="line-ai-mobby-cta__instruction">LINE追加後、最初にこの合言葉を送ってね。</p>
          <strong class="line-ai-mobby-cta__token">${token}</strong>
          <span class="line-ai-mobby-cta__first-message">${firstMessageText}</span>
          <div class="line-ai-mobby-cta__token-actions">
            <button class="line-ai-mobby-cta__copy-button" type="button" data-line-ai-mobby-copy="${firstMessageText}">
              合言葉をコピー
            </button>
            <a class="line-ai-mobby-cta__line-button" href="${lineAddUrl}" target="_blank" rel="noopener">
              LINEを開く
            </a>
          </div>
        </div>
        <p class="line-ai-mobby-cta__status" data-line-ai-mobby-status></p>
      </section>
    `;
  }

  function setStatus(element, message, isError) {
    const status = element.querySelector("[data-line-ai-mobby-status]");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", Boolean(isError));
  }

  async function issueToken(element, diagnosis) {
    const button = element.querySelector("[data-line-ai-mobby-issue]");
    if (button) {
      button.disabled = true;
      button.textContent = "準備中...";
    }
    setStatus(element, "LINE連携の合言葉を作っています。", false);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diagnosis })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || data.message || "LINE連携の準備に失敗しました。");
      }
      renderResult(element, data);
    } catch (error) {
      renderInitial(element, diagnosis);
      setStatus(element, "今だけLINE連携の準備に失敗しました。時間を置いてもう一度試してね。", true);
      console.warn("[LINE AI Mobby CTA] Failed to issue token.", error);
    }
  }

  function render(options) {
    const element = resolveMount(options?.mount);
    const diagnosis = normalizeDiagnosis(options?.diagnosis || parseDiagnosisFromElement(element));
    if (!element || !diagnosis) return;

    renderedNodes.add(element);
    renderInitial(element, diagnosis);
    element.addEventListener("click", (event) => {
      const issueButton = event.target.closest("[data-line-ai-mobby-issue]");
      if (issueButton) {
        issueToken(element, diagnosis);
        return;
      }

      const copyButton = event.target.closest("[data-line-ai-mobby-copy]");
      if (copyButton) {
        const text = copyButton.getAttribute("data-line-ai-mobby-copy") || "";
        copyButton.disabled = true;
        copyText(text)
          .then(() => setStatus(element, "合言葉をコピーしました。", false))
          .catch(() => setStatus(element, "コピーできませんでした。合言葉を長押ししてコピーしてね。", true))
          .finally(() => {
            copyButton.disabled = false;
          });
      }
    });
  }

  function autoRender(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("[data-line-ai-mobby-cta]").forEach((element) => {
      if (!renderedNodes.has(element)) {
        render({ mount: element });
      }
    });
  }

  window.MobbyLineAiCTA = { render, autoRender };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => autoRender(document));
  } else {
    autoRender(document);
  }

  new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.matches?.("[data-line-ai-mobby-cta]")) autoRender(node.parentElement || document);
        else autoRender(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
