(() => {
  const promoSelector = "[data-diagnosis-poster-promo]";
  let frameId = 0;

  function createPromo() {
    const promo = document.createElement("aside");
    promo.className = "diagnosis-poster-promo";
    promo.setAttribute("data-diagnosis-poster-promo", "");
    promo.setAttribute("aria-label", "モビーポスターの案内");
    promo.innerHTML = `
      <div class="diagnosis-poster-promo__copy">
        <p class="diagnosis-poster-promo__text">自分の写真を入れるだけ、モビーと映画のフライヤーみたいな一枚を作ろう</p>
        <a class="diagnosis-poster-promo__button" href="../compositing.html">ポスターを作る&nbsp; ↗</a>
      </div>
      <div class="diagnosis-poster-promo__posters" aria-hidden="true">
        <img class="diagnosis-poster-promo__poster diagnosis-poster-promo__poster--one" src="../assets/diagnosis-poster-2.webp" alt="" loading="lazy" decoding="async">
        <img class="diagnosis-poster-promo__poster diagnosis-poster-promo__poster--two" src="../assets/diagnosis-poster-1.webp" alt="" loading="lazy" decoding="async">
        <span class="diagnosis-poster-promo__sparkle">✦</span>
      </div>
    `;
    return promo;
  }

  function findAxisAnchor() {
    const loveAxisGroup = document.querySelector(".love-diagnosis--result .love-axis-bars");
    if (loveAxisGroup) return loveAxisGroup;

    const axisRows = Array.from(document.querySelectorAll(".axis-row"))
      .filter((row) => row.querySelector(".axis-track"));
    if (axisRows.length < 4) return null;
    return axisRows[axisRows.length - 1];
  }

  function mountPromo() {
    frameId = 0;
    if (document.querySelector(promoSelector)) return;
    const anchor = findAxisAnchor();
    if (!anchor) return;
    anchor.insertAdjacentElement("afterend", createPromo());
  }

  function scheduleMount() {
    if (frameId) return;
    frameId = window.requestAnimationFrame(mountPromo);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleMount, { once: true });
  } else {
    scheduleMount();
  }

  const observer = new MutationObserver(scheduleMount);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
