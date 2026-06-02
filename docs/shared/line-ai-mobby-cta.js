(function initMobbyLineAiCTA() {
  const LINE_ADD_ENDPOINT = "/api/line-ai/issue-link-token";
  const LINK_SESSION_ENDPOINT = "/api/line-ai/link-sessions";
  const LINKABLE_SOURCES = new Set(["16school", "16stan", "16love", "16renai"]);
  const TIKTOK_BROWSER_PATTERN = /(TikTok|musical_ly|Bytedance|ByteLocale|ByteFullLocale|Aweme|Toutiao|TTWebView|trill)/i;
  const renderedNodes = new WeakSet();
  const openTargetCache = new WeakMap();

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
    const tiktok = isTikTokInAppBrowser();
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">モビーと話そう！</h3>
        <p class="line-ai-mobby-cta__copy">
          ${tiktok
            ? "TikTok内ではLINE連携が完了しにくいため、外部ブラウザで開いてから連携してください。"
            : diagnosis
              ? "LINEで追加すると、診断結果をふまえてモビーと話せます。"
              : "LINEで追加したら、そのまま話せます。"}
        </p>
        <div class="line-ai-mobby-cta__actions">
          <a class="line-ai-mobby-cta__button" href="#" data-line-ai-mobby-issue data-line-ai-mobby-ready="false">
            ${tiktok ? "外部ブラウザで開く手順を見る" : "LINEでモビーを追加する"}
          </a>
        </div>
        <p class="line-ai-mobby-cta__status" data-line-ai-mobby-status></p>
      </section>
    `;
  }

  function renderResult(element, data, options) {
    const openUrl = escapeHtml(data.openUrl || data.liffUrl || data.lineAddUrl || "#");
    const hasDiagnosisLink = Boolean(data.openUrl || data.liffUrl) && data.usedDiagnosis !== false;
    const instruction = escapeHtml(options?.instruction || (
      hasDiagnosisLink
        ? "LINEアプリを開いて、診断結果の連携を続けてね。"
        : "LINEを開いて友だち追加したら、そのまま話しかけてね。"
    ));
    const buttonLabel = escapeHtml(options?.buttonLabel || (
      hasDiagnosisLink ? "LINEアプリで連携を続ける" : "LINEを開く"
    ));
    const fallbackUrl = data.fallbackOpenUrl && data.fallbackOpenUrl !== data.openUrl
      ? escapeHtml(data.fallbackOpenUrl)
      : "";
    const fallbackLink = fallbackUrl
      ? `<a class="line-ai-mobby-cta__fallback-link" href="${fallbackUrl}">開かない場合はこちら</a>`
      : "";
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">モビーと話そう！</h3>
        <div class="line-ai-mobby-cta__result">
          <p class="line-ai-mobby-cta__instruction">${instruction}</p>
          <a class="line-ai-mobby-cta__line-button" href="${openUrl}" data-line-ai-mobby-issue data-line-ai-mobby-ready="true">
            ${buttonLabel}
          </a>
          ${fallbackLink}
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

  function userAgent() {
    return navigator.userAgent || "";
  }

  function isIosSafari() {
    const ua = userAgent();
    const isIos = /iP(hone|ad|od)/.test(ua) || (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);
    const isSafari = /Safari/.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS|Line)\//.test(ua);
    return isIos && isSafari;
  }

  function isTikTokInAppBrowser() {
    return TIKTOK_BROWSER_PATTERN.test(userAgent());
  }

  function shouldUseLineAppHandoff() {
    return isIosSafari();
  }

  function shouldWaitForTapToOpen() {
    return shouldUseLineAppHandoff();
  }

  function setTriggerLoading(element, isLoading) {
    const trigger = element.querySelector("[data-line-ai-mobby-issue]");
    if (!trigger) return;
    if (isLoading) {
      trigger.setAttribute("aria-busy", "true");
      trigger.setAttribute("aria-disabled", "true");
      trigger.textContent = "準備中...";
    } else {
      trigger.removeAttribute("aria-busy");
      trigger.removeAttribute("aria-disabled");
      trigger.textContent = "LINEでモビーを追加する";
    }
  }

  function applyPreparedOpenTarget(element, data) {
    const trigger = element.querySelector("[data-line-ai-mobby-issue]");
    const openUrl = data?.openUrl || data?.liffUrl || data?.lineAddUrl;
    if (!trigger || !openUrl) return;
    trigger.href = openUrl;
    trigger.dataset.lineAiMobbyReady = "true";
    trigger.removeAttribute("aria-busy");
    trigger.removeAttribute("aria-disabled");
    trigger.textContent = data.usedDiagnosis === false ? "LINEでモビーを追加する" : "LINEで診断結果を連携する";
  }

  function buildLineAppUrl(liffUrl) {
    try {
      const url = new URL(liffUrl);
      if (url.protocol !== "https:" || url.hostname !== "liff.line.me") return "";
      const liffPath = url.pathname.replace(/^\/+|\/+$/g, "");
      if (!liffPath) return "";
      return `line://app/${liffPath}${url.search}${url.hash}`;
    } catch {
      return "";
    }
  }

  function enhanceOpenTarget(data) {
    const liffUrl = String(data?.liffUrl || "");
    const enhanced = { ...data };
    if (liffUrl) {
      enhanced.lineAppUrl = buildLineAppUrl(liffUrl);
    }
    if (isTikTokInAppBrowser() && liffUrl) {
      enhanced.openUrl = liffUrl;
      enhanced.fallbackOpenUrl = enhanced.lineAddUrl || "";
      return enhanced;
    }
    if (isIosSafari() && liffUrl) {
      enhanced.openUrl = liffUrl;
      enhanced.fallbackOpenUrl = enhanced.lineAppUrl || "";
      return enhanced;
    }
    enhanced.openUrl = enhanced.openUrl || liffUrl || enhanced.lineAddUrl;
    return enhanced;
  }

  async function fetchLineAddInfo() {
    const response = await fetch(LINE_ADD_ENDPOINT, { method: "GET" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok !== true) {
      throw new Error(data.error || data.message || "LINEを開けませんでした。");
    }
    return enhanceOpenTarget({
      ...data,
      openUrl: data.lineAddUrl,
      usedDiagnosis: false
    });
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

  async function createOpenTarget(element, options) {
    const diagnosis = parseDiagnosis(element);
    if (diagnosis) {
      try {
        const data = await createLinkSession(diagnosis);
        return enhanceOpenTarget({
          ...data,
          openUrl: data.liffUrl,
          usedDiagnosis: true
        });
      } catch (error) {
        if (!options?.allowDiagnosisFallback) throw error;
        const data = await fetchLineAddInfo();
        return enhanceOpenTarget({
          ...data,
          diagnosisFallback: true,
          sourceError: error
        });
      }
    }
    return fetchLineAddInfo();
  }

  function cacheOpenTarget(element, promise) {
    const entry = { promise };
    openTargetCache.set(element, entry);
    entry.promise = promise
      .then((data) => {
        entry.data = data;
        applyPreparedOpenTarget(element, data);
        return data;
      })
      .catch((error) => {
        if (openTargetCache.get(element) === entry) {
          openTargetCache.delete(element);
        }
        throw error;
      });
    return entry.promise;
  }

  function primeOpenTarget(element) {
    if (isTikTokInAppBrowser()) return;
    if (openTargetCache.has(element)) return;
    cacheOpenTarget(element, createOpenTarget(element, { allowDiagnosisFallback: false })).catch(() => {});
  }

  async function getOpenTarget(element, options) {
    const cached = openTargetCache.get(element);
    if (cached) {
      try {
        return await cached.promise;
      } catch (error) {
        if (!options?.allowDiagnosisFallback) throw error;
      }
    }
    return cacheOpenTarget(element, createOpenTarget(element, options));
  }

  function renderTapToOpenResult(element, data) {
    const safari = isIosSafari();
    renderResult(element, data, {
      instruction: data.diagnosisFallback
        ? "診断結果なしでもLINEでモビーと話せます。次のボタンをタップしてLINEアプリを開いてね。"
        : safari
          ? "Safariでは次のボタンをタップして、LINEアプリで診断結果の連携を続けてね。"
          : "次のボタンをタップすると、LINEアプリで診断結果の連携を続けられます。",
      buttonLabel: data.usedDiagnosis === false ? "LINEアプリを開く" : "LINEアプリで連携する"
    });
    setStatus(
      element,
      data.diagnosisFallback
        ? "今だけ診断結果を連携できませんでした。診断結果なしでもLINEで話せます。"
        : shouldUseLineAppHandoff()
          ? "開かない場合は補助リンクも試してください。"
          : "LINEアプリを開いています。",
      Boolean(data.diagnosisFallback)
    );
  }

  function renderTikTokExternalBrowserGuide(element) {
    element.innerHTML = `
      <section class="line-ai-mobby-cta" aria-label="LINE AI Mobby">
        <h3 class="line-ai-mobby-cta__headline">外部ブラウザで開いてね</h3>
        <div class="line-ai-mobby-cta__result">
          <p class="line-ai-mobby-cta__instruction">
            TikTok内ブラウザではLINE連携が失敗しやすいため、この診断結果ページをSafariまたはChromeで開いてからもう一度タップしてください。
          </p>
          <p class="line-ai-mobby-cta__instruction">
            右上の「...」から「ブラウザで開く」を選ぶと、連携を続けられます。
          </p>
        </div>
        <p class="line-ai-mobby-cta__status" data-line-ai-mobby-status></p>
      </section>
    `;
  }

  function shouldRenderPreparedResult(issueButton) {
    return shouldWaitForTapToOpen() && !issueButton.closest(".line-ai-mobby-cta__result");
  }

  async function prepareLineAdd(element) {
    if (isTikTokInAppBrowser()) {
      renderTikTokExternalBrowserGuide(element);
      setStatus(element, "TikTokの右上メニューから外部ブラウザで開いてください。", false);
      return;
    }

    const diagnosis = parseDiagnosis(element);
    setTriggerLoading(element, true);
    setStatus(element, diagnosis ? "診断結果の連携を準備しています。" : "LINEを開きます。", false);

    try {
      const data = await getOpenTarget(element, { allowDiagnosisFallback: true });
      const openUrl = data.openUrl || data.liffUrl || data.lineAddUrl;
      if (!openUrl) {
        throw new Error("LINE URL is missing");
      }

      applyPreparedOpenTarget(element, data);
      if (shouldWaitForTapToOpen()) {
        renderTapToOpenResult(element, data);
        if (data.sourceError) {
          console.warn("[LINE AI Mobby CTA] Falling back to LINE add URL.", data.sourceError);
        }
        return;
      }

      renderResult(element, data);
      if (data.diagnosisFallback) {
        setStatus(element, "今だけ診断結果を連携できませんでした。診断結果なしでもLINEで話せます。", true);
        console.warn("[LINE AI Mobby CTA] Falling back to LINE add URL.", data.sourceError);
      }
      window.location.href = openUrl;
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
    primeOpenTarget(element);
    element.addEventListener("click", (event) => {
      const issueButton = event.target.closest("[data-line-ai-mobby-issue]");
      if (issueButton) {
        if (isTikTokInAppBrowser()) {
          event.preventDefault();
          renderTikTokExternalBrowserGuide(element);
          setStatus(element, "TikTokの右上メニューから外部ブラウザで開いてください。", false);
          return;
        }
        if (issueButton.dataset.lineAiMobbyReady === "true" && issueButton.getAttribute("href") !== "#") {
          if (shouldRenderPreparedResult(issueButton)) {
            const cached = openTargetCache.get(element);
            if (cached?.data) {
              event.preventDefault();
              renderTapToOpenResult(element, cached.data);
              return;
            }
          }
          setStatus(
            element,
            shouldUseLineAppHandoff()
              ? "確認が出たらLINEで開いてください。"
              : "LINEアプリを開いています。",
            false
          );
          return;
        }
        event.preventDefault();
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
