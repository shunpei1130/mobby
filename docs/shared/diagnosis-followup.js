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
    const existing = document.querySelector(".mobby-followup");
    const resultVisible = isResultVisible();
    if (existing) {
      if (existing.hidden === resultVisible) existing.hidden = !resultVisible;
      return;
    }
    if (!resultVisible) return;
    const app = document.querySelector("#app") || document.querySelector("main") || document.body;
    const card = document.createElement("section");
    card.className = "mobby-followup";
    card.setAttribute("aria-labelledby", "mobbyFollowupTitle");
    card.innerHTML = `
      <p class="mobby-followup__eyebrow">モビーと、毎日をもっと。</p>
      <h2 class="mobby-followup__title" id="mobbyFollowupTitle">診断のあとは、<br>猫に会いにいこう。</h2>
      <p class="mobby-followup__lead">歩いた数や天気で、その日だけの猫に会える。<br>にゃこモビーを集めるiPhoneアプリ「にゃっコレ」。</p>
      <a class="mobby-followup__action mobby-followup__app" href="https://apps.apple.com/jp/app/%E3%81%AB%E3%82%83%E3%81%A3%E3%82%B3%E3%83%AC/id6828308044" target="_blank" rel="noopener">にゃっコレをみてみる →</a>
      <p class="mobby-followup__note">診断結果のキャラクターとアプリの登場モビーは異なります。</p>
      <div class="mobby-followup__characters" role="list" aria-label="モビーキャラクター">
        ${characters.map(c => `<div class="mobby-followup__character" role="listitem"><img src="${imageUrl(c.image)}" alt="${c.name}" loading="lazy"><span>${c.name}</span></div>`).join("")}
      </div>
      <div class="mobby-followup__actions">
        <a class="mobby-followup__action" href="${pageUrl("manga-flow.html")}">4コマ漫画を見てみる</a>
        <a class="mobby-followup__action mobby-followup__action--secondary" href="${pageUrl("compositing.html")}">ポスターを作ってみる</a>
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
