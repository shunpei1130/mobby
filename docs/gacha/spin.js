(function () {
  const machineWrap = document.getElementById("machineWrap");
  const spinButton = document.getElementById("spinButton");
  const handleButton = document.getElementById("handleButton");
  const againButton = document.getElementById("againButton");
  const resultSheet = document.getElementById("resultSheet");
  const openResultPreview = document.getElementById("openResultPreview");
  const resultImage = document.getElementById("resultImage");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");
  const imagePreviewModal = document.getElementById("imagePreviewModal");
  const previewImage = document.getElementById("previewImage");
  const closePreviewButton = document.getElementById("closePreviewButton");
  const closePreviewBackdrop = document.getElementById("closePreviewBackdrop");
  const coinCount = document.getElementById("coinCount");
  const spinLead = document.getElementById("spinLead");

  if (!machineWrap || !spinButton || !handleButton || !resultSheet || !resultImage || !resultTitle || !resultText) return;

  const rNames = [
    "ひなたの愛され人",
    "余白を飾る演出家",
    "地図を広げる冒険家",
    "夜風のロマンチスト",
    "恋に旗を振る人",
    "晴れ間の本命",
    "月影のミューズ",
    "毛布を掛ける人",
    "秘密の星",
    "胸奥のロマン",
    "花束の主人公１",
    "陽だまりを分ける人",
    "雨宿りの待ち人",
    "静かな港の相棒",
    "静かな灯",
    "風まかせの小悪魔"
  ];

  const srNames = [
    "ひなたの愛され人",
    "余白を飾る演出家",
    "地図を広げる冒険家",
    "夜風のロマンチスト",
    "恋に旗を振る人",
    "晴れ間の本命",
    "月影のミューズ",
    "毛布を掛ける人",
    "秘密の星",
    "胸奥のロマン",
    "花束の主人公",
    "陽だまりを分ける人",
    "雨宿りの待ち人",
    "静かな港の相棒",
    "静かな灯",
    "風まかせの小悪魔"
  ];

  const urNames = [
    "ひなたの愛され人",
    "余白を飾る演出家",
    "地図を広げる冒険家",
    "夜風のロマンチスト",
    "恋に旗を振る人",
    "晴れ間の本命",
    "月影のミューズ",
    "毛布を掛ける人",
    "秘密の星",
    "胸奥のロマン",
    "花束の主人公",
    "陽だまりを分ける人",
    "雨宿りの待ち人",
    "静かな港の相棒",
    "静かな灯",
    "風まかせの小悪魔"
  ];

  const results = [
    ...rNames.map((name) => ({
      rarity: "R",
      title: name,
      src: `../gacha-new/assets/r/${encodeURIComponent(name)}.png`
    })),
    ...srNames.map((name) => ({
      rarity: "SR",
      title: name,
      src: `../gacha-new/assets/sr/${encodeURIComponent(name)}-sr.png`
    })),
    ...urNames.map((name) => ({
      rarity: "UR",
      title: name,
      src: `../gacha-new/assets/ur/${encodeURIComponent(name)}-ur.png`
    }))
  ];

  let isSpinning = false;
  let coins = 1;
  let currentResult = null;

  function setBusy(busy) {
    isSpinning = busy;
    spinButton.disabled = busy;
    handleButton.disabled = busy;
    spinButton.textContent = busy ? "まわしています..." : "1回まわす";
    if (!busy) {
      const capsule = document.createElement("span");
      capsule.className = "spin-button-capsule";
      capsule.setAttribute("aria-hidden", "true");
      spinButton.appendChild(capsule);
    }
  }

  function pickResult() {
    const roll = Math.random();
    const rarity = roll < 0.76 ? "R" : roll < 0.96 ? "SR" : "UR";
    const pool = results.filter((result) => result.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function showResult(result) {
    currentResult = result;
    resultImage.src = result.src;
    resultImage.alt = `${result.title} ${result.rarity}`;
    resultImage.hidden = false;
    resultTitle.textContent = result.title;
    resultText.textContent = `${result.rarity} シールが出ました。`;
    resultSheet.hidden = false;
  }

  function openPreview() {
    if (!currentResult || !imagePreviewModal || !previewImage) return;
    previewImage.src = currentResult.src;
    previewImage.alt = `${currentResult.title} ${currentResult.rarity}`;
    imagePreviewModal.hidden = false;
    closePreviewButton?.focus();
  }

  function closePreview() {
    if (!imagePreviewModal) return;
    imagePreviewModal.hidden = true;
  }

  function spin() {
    if (isSpinning) return;

    resultSheet.hidden = true;
    setBusy(true);
    coins = Math.max(0, coins - 1);
    if (coinCount) coinCount.textContent = String(coins);
    if (spinLead) spinLead.textContent = "ハンドルが回っています...";

    machineWrap.classList.remove("is-spinning", "is-dropping");
    void machineWrap.offsetWidth;
    machineWrap.classList.add("is-spinning");

    window.setTimeout(() => {
      machineWrap.classList.add("is-dropping");
    }, 820);

    window.setTimeout(() => {
      const result = pickResult();
      machineWrap.classList.remove("is-spinning", "is-dropping");
      if (spinLead) spinLead.textContent = "シールをゲットしました！";
      showResult(result);
      coins = 1;
      if (coinCount) coinCount.textContent = String(coins);
      setBusy(false);
    }, 1900);
  }

  spinButton.addEventListener("click", spin);
  handleButton.addEventListener("click", spin);
  againButton?.addEventListener("click", spin);
  openResultPreview?.addEventListener("click", openPreview);
  closePreviewButton?.addEventListener("click", closePreview);
  closePreviewBackdrop?.addEventListener("click", closePreview);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && imagePreviewModal && !imagePreviewModal.hidden) {
      closePreview();
    }
  });
})();
