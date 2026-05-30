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

  function renderInitial(element) {
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">モビーと話そう！</h3>
        <p class="line-ai-mobby-cta__copy">
          LINEで追加したら、そのまま話せます。
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

  async function prepareLineAdd(element) {
    const button = element.querySelector("[data-line-ai-mobby-issue]");
    if (button) {
      button.disabled = true;
      button.textContent = "準備中...";
    }
    setStatus(element, "LINEを開きます。", false);

    try {
      const response = await fetch(API_ENDPOINT, { method: "GET" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) {
        throw new Error(data.error || data.message || "LINEを開けませんでした。");
      }
      renderResult(element, data);
      if (data.lineAddUrl) {
        window.location.href = data.lineAddUrl;
      }
    } catch (error) {
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
