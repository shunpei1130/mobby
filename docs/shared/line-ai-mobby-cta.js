(function initMobbyLineAiCTA() {
  const LINE_ADD_ENDPOINT = "/api/line-ai/issue-link-token";
  const LINK_SESSION_ENDPOINT = "/api/line-ai/link-sessions";
  const LINKABLE_SOURCES = new Set(["16school", "16stan", "16love", "16renai"]);
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

  function parseDiagnosis(element) {
    const raw = element?.getAttribute?.("data-diagnosis");
    if (!raw) return null;

    try {
      const decoded = decodeURIComponent(raw);
      const data = JSON.parse(decoded);
      if (!LINKABLE_SOURCES.has(String(data?.source || ""))) return null;
      return data;
    } catch {
      try {
        const data = JSON.parse(raw);
        if (!LINKABLE_SOURCES.has(String(data?.source || ""))) return null;
        return data;
      } catch {
        return null;
      }
    }
  }

  function renderInitial(element) {
    const diagnosis = parseDiagnosis(element);
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">モビーと話そう！</h3>
        <p class="line-ai-mobby-cta__copy">
          ${diagnosis ? "LINEで追加すると、診断結果をふまえてモビーと話せます。" : "LINEで追加したら、そのまま話せます。"}
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
    const lineAddUrl = escapeHtml(data.lineAddUrl || "#");
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">モビーと話そう！</h3>
        <div class="line-ai-mobby-cta__result">
          <p class="line-ai-mobby-cta__instruction">LINEを開いて友だち追加したら、そのまま話しかけてね。</p>
          <a class="line-ai-mobby-cta__line-button" href="${lineAddUrl}" target="_blank" rel="noopener">
            LINEを開く
          </a>
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

  async function openLineAddFallback(element, usedDiagnosis) {
    const response = await fetch(LINE_ADD_ENDPOINT, { method: "GET" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      throw new Error(data.error || data.message || "LINEを開けませんでした。");
    }
    renderResult(element, data);
    if (usedDiagnosis) {
      setStatus(element, "今だけ診断結果を連携できませんでした。診断結果なしでもLINEで話せます。", true);
    }
    if (data.lineAddUrl) {
      window.location.href = data.lineAddUrl;
    }
  }

  async function createLinkSession(diagnosis) {
    const response = await fetch(LINK_SESSION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(diagnosis)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true || !data.liffUrl) {
      throw new Error(data.error || data.message || "診断結果を連携できませんでした。");
    }
    return data;
  }

  async function prepareLineAdd(element) {
    const button = element.querySelector("[data-line-ai-mobby-issue]");
    if (button) {
      button.disabled = true;
      button.textContent = "準備中...";
    }
    const diagnosis = parseDiagnosis(element);
    setStatus(element, diagnosis ? "診断結果の連携を準備しています。" : "LINEを開きます。", false);

    try {
      if (diagnosis) {
        const data = await createLinkSession(diagnosis);
        window.location.href = data.liffUrl;
        return;
      }
      await openLineAddFallback(element, false);
    } catch (error) {
      if (diagnosis) {
        try {
          await openLineAddFallback(element, true);
          console.warn("[LINE AI Mobby CTA] Falling back to LINE add URL.", error);
          return;
        } catch (fallbackError) {
          console.warn("[LINE AI Mobby CTA] Failed to prepare fallback LINE add URL.", fallbackError);
        }
      }
      renderInitial(element);
      setStatus(element, "今だけLINEを開けませんでした。時間を置いてもう一度試してね。", true);
      console.warn("[LINE AI Mobby CTA] Failed to prepare LINE add URL.", error);
    }
  }

  function render(options) {
    const element = resolveMount(options?.mount);
    if (!element) return;

    renderedNodes.add(element);
    renderInitial(element);
    element.addEventListener("click", (event) => {
      const issueButton = event.target.closest("[data-line-ai-mobby-issue]");
      if (issueButton) {
        prepareLineAdd(element);
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
