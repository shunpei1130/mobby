(() => {
  const characters = [
    { id: "mobirin", name: "もびりん", image: "mobby_fact_man_toka.webp" },
    { id: "mobichi", name: "もびち", image: "mobby_gal_toka.webp" },
    { id: "yami", name: "病みモビー", image: "mobby_yami_toka.webp" },
    { id: "mobiyan", name: "もびやん", image: "mobby_yanki_toak.webp" }
  ];
  const base = new URL("../", document.currentScript.src);
  const imageUrl = file => new URL(`carousel/after/${file}`, base).href;
  const pageUrl = (path, character) => {
    const url = new URL(path, base);
    if (character) url.searchParams.set("character", character);
    return url.href;
  };
  const isResultVisible = () => {
    const candidates = document.querySelectorAll(".result-hero,.love-result-hero,.type-no");
    return [...candidates].some(node => node.getClientRects().length && !node.closest("[hidden]"));
  };
  function mount() {
    if (document.querySelector(".mobby-followup") || !isResultVisible()) return;
    const app = document.querySelector("#app") || document.querySelector("main") || document.body;
    const card = document.createElement("section");
    card.className = "mobby-followup";
    card.setAttribute("aria-labelledby", "mobbyFollowupTitle");
    card.innerHTML = `
      <p class="mobby-followup__eyebrow">診断のつづきを楽しもう</p>
      <h2 class="mobby-followup__title" id="mobbyFollowupTitle">気になるモビーを選んでね</h2>
      <p class="mobby-followup__lead">考えすぎず、いま惹かれた子を直感でタップ！</p>
      <div class="mobby-followup__characters" role="group" aria-label="メインモビーを選択">
        ${characters.map(c => `<button class="mobby-followup__character" type="button" data-character="${c.id}" aria-pressed="false"><img src="${imageUrl(c.image)}" alt="${c.name}" loading="lazy"><span>${c.name}</span></button>`).join("")}
      </div>
      <p class="mobby-followup__status" aria-live="polite">まずはモビーを1人選んでね</p>
      <div class="mobby-followup__actions">
        <a class="mobby-followup__action" data-route="manga-flow.html" href="#" aria-disabled="true">4コマ漫画を見てみる</a>
        <a class="mobby-followup__action mobby-followup__action--secondary" data-route="compositing.html" href="#" aria-disabled="true">ポスターを作ってみる</a>
        ${location.pathname.includes("/16renai/") ? `<a class="mobby-followup__action mobby-followup__action--gacha" href="${pageUrl("gacha/index.html")}">恋愛モビー診断のシールガチャを引く</a>` : ""}
      </div>
      <p class="mobby-followup__hint">選んだモビーはいつでも変更できます</p>`;
    app.appendChild(card);
    const status = card.querySelector(".mobby-followup__status");
    card.querySelectorAll("[data-character]").forEach(button => button.addEventListener("click", () => {
      const selected = characters.find(c => c.id === button.dataset.character);
      card.querySelectorAll("[data-character]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      card.querySelectorAll("[data-route]").forEach(link => {
        link.href = pageUrl(link.dataset.route, selected.id);
        link.setAttribute("aria-disabled", "false");
      });
      status.textContent = `${selected.name}を選んだよ！次にやりたいことを選んでね`;
    }));
  }
  let queued = false;
  const observer = new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  });
  const start = () => { mount(); observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "hidden", "style"] }); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
