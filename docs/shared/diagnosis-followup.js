(() => {
  const characters = [
    { id: "mobirin", name: "もびりん", image: "mobby_fact_man_toka.webp" },
    { id: "mobichi", name: "もびち", image: "mobby_gal_toka.webp" },
    { id: "yami", name: "病みモビー", image: "mobby_yami_toka.webp" },
    { id: "mobiyan", name: "もびやん", image: "mobby_yanki_toak.webp" },
    { id: "babu", name: "ばぶもび", image: "assets/mobby-guide/characters/babu-moby.webp" },
    { id: "pote", name: "ぽてもび", image: "assets/mobby-guide/characters/pote-moby.webp" },
    { id: "yura", name: "もびゆら", image: "assets/mobby-guide/characters/yura-moby.webp" },
    { id: "reo", name: "れおもび", image: "assets/mobby-guide/characters/reo-moby.webp" },
    { id: "mobibou", name: "モビ坊", image: "assets/mobby-guide/characters/mobibou-moby.webp" }
  ];
  const base = new URL("../", document.currentScript.src);
  const imageUrl = file => new URL(file.includes("/") ? file : `carousel/after/${file}`, base).href;
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
      <h2 class="mobby-followup__title" id="mobbyFollowupTitle">モビーたちを見てみよう</h2>
      <p class="mobby-followup__lead">診断に登場するモビーたちをご紹介します。</p>
      <div class="mobby-followup__characters" role="list" aria-label="モビーキャラクター">
        ${characters.map(c => `<div class="mobby-followup__character" role="listitem"><img src="${imageUrl(c.image)}" alt="${c.name}" loading="lazy"><span>${c.name}</span></div>`).join("")}
      </div>
      <div class="mobby-followup__actions">
        <a class="mobby-followup__action" href="${pageUrl("manga-flow.html")}">4コマ漫画を見てみる</a>
        <a class="mobby-followup__action mobby-followup__action--secondary" href="${pageUrl("compositing.html")}">ポスターを作ってみる</a>
        ${location.pathname.includes("/16renai/") ? `<a class="mobby-followup__action mobby-followup__action--gacha" href="${pageUrl("gacha/index.html")}">恋愛モビー診断のシールガチャを引く</a>` : ""}
      </div>`;
    app.appendChild(card);
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
