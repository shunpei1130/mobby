(function () {
  const machineWrap = document.getElementById("machineWrap");
  const spinButton = document.getElementById("spinButton");
  const handleButton = document.getElementById("handleButton");
  const againButton = document.getElementById("againButton");
  const saveSheetButton = document.getElementById("saveSheetButton");
  const resultSheet = document.getElementById("resultSheet");
  const openResultPreview = document.getElementById("openResultPreview");
  const resultImage = document.getElementById("resultImage");
  const resultTitle = document.getElementById("resultTitle");
  const resultText = document.getElementById("resultText");
  const stickerResults = document.getElementById("stickerResults");
  const stickerReveal = document.getElementById("stickerReveal");
  const stickerRevealCount = document.getElementById("stickerRevealCount");
  const stickerRevealImage = document.getElementById("stickerRevealImage");
  const stickerRevealTitle = document.getElementById("stickerRevealTitle");
  const stickerRevealRarity = document.getElementById("stickerRevealRarity");
  const stickerRevealNext = document.getElementById("stickerRevealNext");
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

  const galNames = [
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
    "静かな灯り",
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
    })),
    ...galNames.map((name) => ({
      rarity: "プリ",
      title: name,
      src: `../gacha-new/assets/gal/${encodeURIComponent(name)}-gal.png`
    }))
  ];

  let isSpinning = false;
  let coins = 1;
  let currentResult = null;
  let revealResults = [];
  let revealIndex = 0;
  let currentDownloadUrl = "";
  const revealRarityClasses = ["rarity-r", "rarity-sr", "rarity-ur", "rarity-pri"];

  const sheetSrc = "../gacha-new/assets/gacha/gachasheet.png";
  const sheetSlots = [
    { x: 102, y: 102, width: 386, height: 386 },
    { x: 537, y: 102, width: 386, height: 386 },
    { x: 102, y: 539, width: 386, height: 386 },
    { x: 537, y: 539, width: 386, height: 386 },
    { x: 102, y: 975, width: 386, height: 386 },
    { x: 537, y: 975, width: 386, height: 386 }
  ];

  function isMobileShareDevice() {
    const userAgent = navigator.userAgent || "";
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(userAgent);
    const isMobileWidth = window.matchMedia?.("(max-width: 767px)").matches === true;
    const isTouchPointer = window.matchMedia?.("(pointer: coarse)").matches === true;
    return isMobileDevice && isMobileWidth && isTouchPointer;
  }

  function disableDesktopNativeShare() {
    if (isMobileShareDevice()) return;
    try {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        configurable: true
      });
    } catch {
      navigator.share = undefined;
    }
  }

  disableDesktopNativeShare();

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
    const rarity = roll < 0.7 ? "R" : roll < 0.9 ? "SR" : roll < 0.98 ? "UR" : "プリ";
    const pool = results.filter((result) => result.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pickResults(count) {
    return Array.from({ length: count }, () => pickResult());
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      image.src = src;
    });
  }

  function drawCoverImage(context, image, slot) {
    const scale = Math.max(slot.width / image.naturalWidth, slot.height / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = slot.x + (slot.width - width) / 2;
    const y = slot.y + (slot.height - height) / 2;

    context.save();
    context.beginPath();
    context.rect(slot.x, slot.y, slot.width, slot.height);
    context.clip();
    context.drawImage(image, x, y, width, height);
    context.restore();
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function composeSheet(selectedResults) {
    const [sheetImage, ...stickerImages] = await Promise.all([
      loadImage(sheetSrc),
      ...selectedResults.map((result) => loadImage(result.src))
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = sheetImage.naturalWidth;
    canvas.height = sheetImage.naturalHeight;

    const context = canvas.getContext("2d");
    context.drawImage(sheetImage, 0, 0);
    stickerImages.forEach((image, index) => {
      drawCoverImage(context, image, sheetSlots[index]);
    });

    const dataUrl = canvas.toDataURL("image/png");
    return {
      dataUrl,
      blob: await canvasToBlob(canvas) || await dataUrlToBlob(dataUrl)
    };
  }

  async function showResult(selectedResults) {
    const sheetImage = await composeSheet(selectedResults);
    const raritySummary = selectedResults.map((result) => result.rarity).join(" / ");

    currentResult = {
      title: "6枚シールシート",
      rarity: raritySummary,
      src: sheetImage.dataUrl,
      blob: sheetImage.blob
    };
    resultImage.src = sheetImage.dataUrl;
    resultImage.alt = "ガチャで出た6枚のシールシート";
    resultImage.hidden = false;
    resultTitle.textContent = "6枚のシールをゲット！";
    resultText.textContent = `出たシール: ${raritySummary}`;
    renderStickerResults(selectedResults);
    refreshDownloadLink();
    resultSheet.hidden = false;
  }

  function showReveal(index) {
    const result = revealResults[index];
    if (!result || !stickerReveal || !stickerRevealImage || !stickerRevealNext) return;

    revealIndex = index;
    stickerReveal.classList.remove(...revealRarityClasses, "is-animating");
    const rarityClass = result.rarity === "プリ" ? "rarity-pri" : `rarity-${result.rarity.toLowerCase()}`;
    stickerReveal.classList.add(rarityClass);
    if (stickerRevealCount) stickerRevealCount.textContent = `${index + 1} / ${revealResults.length}`;
    stickerRevealImage.src = result.src;
    stickerRevealImage.alt = `${result.title} ${result.rarity}`;
    if (stickerRevealTitle) stickerRevealTitle.textContent = result.title;
    if (stickerRevealRarity) stickerRevealRarity.textContent = result.rarity;
    stickerRevealNext.textContent = index === revealResults.length - 1 ? "結果を見る" : "次へ";
    stickerReveal.hidden = false;

    const delay = result.rarity === "UR" ? 520 : result.rarity === "プリ" ? 860 : 0;
    stickerReveal.classList.toggle("is-charging", delay > 0);
    stickerRevealImage.hidden = delay > 0;
    stickerRevealNext.disabled = delay > 0;

    window.setTimeout(() => {
      stickerReveal.classList.remove("is-charging");
      stickerRevealImage.hidden = false;
      stickerRevealNext.disabled = false;
      void stickerReveal.offsetWidth;
      stickerReveal.classList.add("is-animating");
      stickerRevealNext.focus();
    }, delay);
  }

  function startReveal(selectedResults) {
    revealResults = selectedResults;
    revealIndex = 0;
    showReveal(0);
  }

  function showNextReveal() {
    if (!revealResults.length) return;
    if (revealIndex < revealResults.length - 1) {
      showReveal(revealIndex + 1);
      return;
    }

    if (stickerReveal) stickerReveal.hidden = true;
    showResult(revealResults)
      .catch(() => {
        if (spinLead) spinLead.textContent = "画像の生成に失敗しました。もう一度試してください。";
      })
      .finally(() => {
        revealResults = [];
        coins = 1;
        if (coinCount) coinCount.textContent = String(coins);
        setBusy(false);
      });
  }

  function renderStickerResults(selectedResults) {
    if (!stickerResults) return;
    stickerResults.textContent = "";
    selectedResults.forEach((result, index) => {
      const button = document.createElement("button");
      button.className = "sticker-result-button";
      button.type = "button";
      button.setAttribute("aria-label", `${index + 1}枚目 ${result.title} ${result.rarity} を拡大表示`);

      const image = document.createElement("img");
      image.src = result.src;
      image.alt = `${result.title} ${result.rarity}`;

      const badge = document.createElement("span");
      badge.textContent = result.rarity;

      button.append(image, badge);
      button.addEventListener("click", () => openImagePreview(result.src, `${result.title} ${result.rarity}`));
      stickerResults.appendChild(button);
    });
  }

  function openImagePreview(src, alt) {
    if (!imagePreviewModal || !previewImage) return;
    previewImage.src = src;
    previewImage.alt = alt;
    imagePreviewModal.hidden = false;
    closePreviewButton?.focus();
  }

  function openPreview() {
    if (!currentResult || !imagePreviewModal || !previewImage) return;
    openImagePreview(currentResult.src, `${currentResult.title} ${currentResult.rarity}`);
  }

  function closePreview() {
    if (!imagePreviewModal) return;
    imagePreviewModal.hidden = true;
  }

  async function dataUrlToBlob(dataUrl) {
    const response = await fetch(dataUrl);
    return response.blob();
  }

  function buildSheetFileName() {
    const now = new Date();
    const stamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0")
    ].join("");
    return `mobby-sticker-sheet-${stamp}.png`;
  }

  function refreshDownloadLink() {
    if (!saveSheetButton || saveSheetButton.tagName !== "A") return;

    if (currentDownloadUrl) {
      URL.revokeObjectURL(currentDownloadUrl);
      currentDownloadUrl = "";
    }

    if (currentResult?.blob) {
      currentDownloadUrl = URL.createObjectURL(currentResult.blob);
      saveSheetButton.href = currentDownloadUrl;
      saveSheetButton.download = buildSheetFileName();
      return;
    }

    saveSheetButton.href = "#";
    saveSheetButton.removeAttribute("download");
  }

  function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadDataUrl(dataUrl, fileName) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      view: window
    }));
    link.remove();
  }

  async function saveBlobWithFilePicker(blob, fileName) {
    if (!window.showSaveFilePicker) return false;

    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [{
        description: "PNG image",
        accept: { "image/png": [".png"] }
      }]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  }

  function shouldUseMobileShareSheet() {
    return isMobileShareDevice();
  }

  async function saveSheetImage(event) {
    if (!currentResult?.src || !saveSheetButton) return;

    if (saveSheetButton.tagName === "A" && saveSheetButton.getAttribute("href") !== "#") {
      return;
    }

    event?.preventDefault();

    const originalLabel = saveSheetButton.textContent;
    saveSheetButton.disabled = true;
    saveSheetButton.setAttribute("aria-disabled", "true");
    saveSheetButton.textContent = "保存中...";

    try {
      const fileName = buildSheetFileName();

      if (currentResult.blob) {
        if (window.showSaveFilePicker) {
          await saveBlobWithFilePicker(currentResult.blob, fileName);
        } else {
          downloadBlob(currentResult.blob, fileName);
        }
      } else {
        downloadDataUrl(currentResult.src, fileName);
      }

      saveSheetButton.textContent = "保存しました";
      window.setTimeout(() => {
        if (saveSheetButton) saveSheetButton.textContent = originalLabel;
      }, 1400);
    } catch (error) {
      console.error("Failed to save sticker sheet image", error);
      saveSheetButton.textContent = "もう一度保存";
    } finally {
      window.setTimeout(() => {
        if (saveSheetButton) {
          saveSheetButton.disabled = false;
          saveSheetButton.removeAttribute("aria-disabled");
        }
      }, 300);
    }
  }

  function spin() {
    if (isSpinning) return;

    resultSheet.hidden = true;
    if (stickerResults) stickerResults.textContent = "";
    if (stickerReveal) stickerReveal.hidden = true;
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
      const selectedResults = pickResults(6);
      machineWrap.classList.remove("is-spinning", "is-dropping");
      if (spinLead) spinLead.textContent = "出たシールを確認しよう！";
      startReveal(selectedResults);
    }, 1900);
  }

  spinButton.addEventListener("click", spin);
  handleButton.addEventListener("click", spin);
  againButton?.addEventListener("click", spin);
  saveSheetButton?.addEventListener("click", saveSheetImage);
  stickerRevealNext?.addEventListener("click", showNextReveal);
  openResultPreview?.addEventListener("click", openPreview);
  closePreviewButton?.addEventListener("click", closePreview);
  closePreviewBackdrop?.addEventListener("click", closePreview);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && imagePreviewModal && !imagePreviewModal.hidden) {
      closePreview();
    }
  });
})();
