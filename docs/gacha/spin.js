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
  const sheetSlider = document.getElementById("sheetSlider");
  const sheetSlidePrev = document.getElementById("sheetSlidePrev");
  const sheetSlideNext = document.getElementById("sheetSlideNext");
  const sheetSlideCount = document.getElementById("sheetSlideCount");
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

  const CHECKOUT_STATUS_ENDPOINT = "/api/gacha-checkout-status";
  const params = new URLSearchParams(window.location.search);
  const isPaidMode = params.get("mode") === "paid";
  const checkoutSessionId = params.get("session_id") || "";
  let paidSpinAvailable = !isPaidMode;
  let hasUsedPaidSpin = false;
  let pullCount = Math.max(1, Math.min(10, Number(params.get("pulls")) || 1));

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
  let revealFinalResults = [];
  let revealIndex = 0;
  let currentDownloadUrl = "";
  let sheetSlides = [];
  let activeSheetSlideIndex = 0;
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
    const platform = navigator.platform || "";
    const maxTouchPoints = Number(navigator.maxTouchPoints || 0);
    const isAndroid = /Android/i.test(userAgent);
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isIPadDesktopMode = /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
    const isDesktopPlatform = /Win|Linux x86_64|MacIntel/i.test(platform) && !isIPadDesktopMode;
    if (isDesktopPlatform) return false;
    return isAndroid || isIOS || isIPadDesktopMode;
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
    const paidSpinConsumed = isPaidMode && hasUsedPaidSpin;
    spinButton.disabled = busy || !paidSpinAvailable || paidSpinConsumed;
    handleButton.disabled = busy || !paidSpinAvailable || paidSpinConsumed;
    const readyLabel = pullCount === 10 ? "60連" : "6連";
    spinButton.textContent = busy ? "まわしています..." : paidSpinConsumed ? "購入してもう一度" : readyLabel;
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
    const sheetCount = Math.max(1, Math.ceil(selectedResults.length / sheetSlots.length));
    canvas.width = sheetImage.naturalWidth;
    canvas.height = sheetImage.naturalHeight * sheetCount;

    const context = canvas.getContext("2d");
    for (let index = 0; index < sheetCount; index += 1) {
      context.drawImage(sheetImage, 0, sheetImage.naturalHeight * index);
    }
    stickerImages.forEach((image, index) => {
      const slot = sheetSlots[index % sheetSlots.length];
      const pageIndex = Math.floor(index / sheetSlots.length);
      drawCoverImage(context, image, {
        ...slot,
        y: slot.y + sheetImage.naturalHeight * pageIndex
      });
    });

    const dataUrl = canvas.toDataURL("image/png");
    return {
      dataUrl,
      blob: await canvasToBlob(canvas) || await dataUrlToBlob(dataUrl)
    };
  }

  async function composeSheetSlides(selectedResults) {
    const chunks = [];
    for (let index = 0; index < selectedResults.length; index += sheetSlots.length) {
      chunks.push(selectedResults.slice(index, index + sheetSlots.length));
    }
    return Promise.all(chunks.map((chunk) => composeSheet(chunk)));
  }

  function updateSheetSlide(index) {
    if (!sheetSlides.length) return;
    activeSheetSlideIndex = Math.max(0, Math.min(sheetSlides.length - 1, index));
    const slide = sheetSlides[activeSheetSlideIndex];

    currentResult = {
      title: `${activeSheetSlideIndex + 1}枚目のシール台紙`,
      rarity: `${activeSheetSlideIndex + 1} / ${sheetSlides.length}`,
      src: slide.dataUrl,
      blob: slide.blob
    };

    resultImage.src = slide.dataUrl;
    resultImage.alt = `ガチャで出たシール台紙 ${activeSheetSlideIndex + 1}枚目`;
    resultImage.hidden = false;
    if (sheetSlideCount) sheetSlideCount.textContent = `${activeSheetSlideIndex + 1} / ${sheetSlides.length}`;
    if (sheetSlidePrev) sheetSlidePrev.disabled = activeSheetSlideIndex === 0;
    if (sheetSlideNext) sheetSlideNext.disabled = activeSheetSlideIndex === sheetSlides.length - 1;
    refreshDownloadLink();
  }

  async function showResult(selectedResults) {
    const isMultiSheet = selectedResults.length > sheetSlots.length;
    if (isMultiSheet) {
      sheetSlides = await composeSheetSlides(selectedResults);
      activeSheetSlideIndex = 0;
      resultTitle.textContent = `${sheetSlides.length}枚のシール台紙をゲット！`;
      resultText.textContent = "左右のボタンで台紙をスライドして確認できます。";
      if (stickerResults) {
        stickerResults.textContent = "";
        stickerResults.hidden = true;
      }
      if (sheetSlider) sheetSlider.hidden = sheetSlides.length <= 1;
      updateSheetSlide(0);
      if (againButton && isPaidMode) againButton.textContent = "もう一度購入する";
      resultSheet.hidden = false;
      return;
    }

    sheetSlides = [];
    activeSheetSlideIndex = 0;
    if (sheetSlider) sheetSlider.hidden = true;
    if (stickerResults) stickerResults.hidden = false;

    const sheetImage = await composeSheet(selectedResults);
    const raritySummary = selectedResults.map((result) => result.rarity).join(" / ");

    currentResult = {
      title: `${selectedResults.length}枚シールシート`,
      rarity: raritySummary,
      src: sheetImage.dataUrl,
      blob: sheetImage.blob
    };
    resultImage.src = sheetImage.dataUrl;
    resultImage.alt = `ガチャで出た${selectedResults.length}枚のシールシート`;
    resultImage.hidden = false;
    resultTitle.textContent = `${selectedResults.length}枚のシールをゲット！`;
    resultText.textContent = `出たシール: ${raritySummary}`;
    renderStickerResults(selectedResults);
    refreshDownloadLink();
    if (againButton && isPaidMode) againButton.textContent = "もう一度購入する";
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
    revealFinalResults = selectedResults;
    revealIndex = 0;
    showReveal(0);
  }

  function startRevealThenShow(highlightResults, finalResults) {
    if (!highlightResults.length) {
      showResult(finalResults)
        .catch(() => {
          if (spinLead) spinLead.textContent = "画像の生成に失敗しました。もう一度試してください。";
        })
        .finally(() => {
          coins = 1;
          if (coinCount) coinCount.textContent = String(coins);
          setBusy(false);
        });
      return;
    }

    revealResults = highlightResults;
    revealFinalResults = finalResults;
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
    showResult(revealFinalResults.length ? revealFinalResults : revealResults)
      .catch(() => {
        if (spinLead) spinLead.textContent = "画像の生成に失敗しました。もう一度試してください。";
      })
      .finally(() => {
        revealResults = [];
        revealFinalResults = [];
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

    if (shouldUseMobileShareSheet()) {
      saveSheetButton.href = "#";
      saveSheetButton.removeAttribute("download");
      return;
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
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadDataUrl(dataUrl, fileName) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
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

  async function shareSheetImage(blob, fileName) {
    if (!navigator.share) return false;

    const file = new File([blob], fileName, { type: blob.type || "image/png" });
    const payload = {
      files: [file],
      title: "Mobbyシールガチャ",
      text: "シールガチャの結果をシェア"
    };

    if (navigator.canShare && !navigator.canShare({ files: payload.files })) {
      return false;
    }

    await navigator.share(payload);
    return true;
  }

  async function saveSheetImage(event) {
    if (!currentResult?.src || !saveSheetButton) return;

    if (
      !shouldUseMobileShareSheet() &&
      saveSheetButton.tagName === "A" &&
      saveSheetButton.getAttribute("href") !== "#"
    ) {
      return;
    }

    event?.preventDefault();

    const originalLabel = saveSheetButton.textContent;
    saveSheetButton.disabled = true;
    saveSheetButton.setAttribute("aria-disabled", "true");
    saveSheetButton.textContent = "保存中...";

    try {
      const fileName = buildSheetFileName();
      const blob = currentResult.blob || await dataUrlToBlob(currentResult.src);

      if (shouldUseMobileShareSheet() && await shareSheetImage(blob, fileName)) {
        saveSheetButton.textContent = "共有しました";
        window.setTimeout(() => {
          if (saveSheetButton) saveSheetButton.textContent = originalLabel;
        }, 1400);
        return;
      }

      if (blob) {
        downloadBlob(blob, fileName);
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
    if (isPaidMode && (!paidSpinAvailable || hasUsedPaidSpin)) {
      window.location.href = "index.html";
      return;
    }

    resultSheet.hidden = true;
    if (stickerResults) stickerResults.textContent = "";
    if (stickerReveal) stickerReveal.hidden = true;
    setBusy(true);
    if (isPaidMode) hasUsedPaidSpin = true;
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
      const selectedResults = pickResults(pullCount * 6);
      machineWrap.classList.remove("is-spinning", "is-dropping");
      if (spinLead) spinLead.textContent = "出たシールを確認しよう！";
      if (selectedResults.length > 12) {
        startRevealThenShow(selectedResults.filter((result) => result.rarity !== "R"), selectedResults);
        return;
      }
      startReveal(selectedResults);
    }, 1900);
  }

  async function verifyPaidSession() {
    if (!isPaidMode) {
      setBusy(false);
      return;
    }

    paidSpinAvailable = false;
    setBusy(false);
    if (spinLead) spinLead.textContent = "決済を確認しています...";

    if (!checkoutSessionId.startsWith("cs_")) {
      if (spinLead) spinLead.textContent = "決済確認ができませんでした。有料ガチャから購入してください。";
      return;
    }

    try {
      const response = await fetch(CHECKOUT_STATUS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: checkoutSessionId })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.paid) {
        throw new Error(data?.message || data?.error || "決済が完了していません。");
      }
      pullCount = Math.max(1, Math.min(10, Number(data.pulls) || pullCount));
      paidSpinAvailable = true;
      if (spinLead) {
        spinLead.textContent = pullCount === 10
          ? "60連ガチャをまわせます。"
          : "6連ガチャをまわせます。";
      }
    } catch (error) {
      paidSpinAvailable = false;
      if (spinLead) spinLead.textContent = error?.message || "決済確認に失敗しました。";
    } finally {
      setBusy(false);
    }
  }

  spinButton.addEventListener("click", spin);
  handleButton.addEventListener("click", spin);
  againButton?.addEventListener("click", () => {
    if (isPaidMode) {
      window.location.href = "index.html";
      return;
    }
    spin();
  });
  saveSheetButton?.addEventListener("click", saveSheetImage);
  sheetSlidePrev?.addEventListener("click", () => updateSheetSlide(activeSheetSlideIndex - 1));
  sheetSlideNext?.addEventListener("click", () => updateSheetSlide(activeSheetSlideIndex + 1));
  stickerRevealNext?.addEventListener("click", showNextReveal);
  openResultPreview?.addEventListener("click", openPreview);
  closePreviewButton?.addEventListener("click", closePreview);
  closePreviewBackdrop?.addEventListener("click", closePreview);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && imagePreviewModal && !imagePreviewModal.hidden) {
      closePreview();
    }
  });
  verifyPaidSession();
})();
