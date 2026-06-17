(function () {
  const machineWrap = document.getElementById("machineWrap");
  const spinButton = document.getElementById("spinButton");
  const handleButton = document.getElementById("handleButton");
  const againButton = document.getElementById("againButton");
  const saveSheetButton = document.getElementById("saveSheetButton");
  const saveCurrentSheetButton = document.getElementById("saveCurrentSheetButton");
  const emailGate = document.getElementById("emailGate");
  const gachaEmailInput = document.getElementById("gachaEmailInput");
  const emailGateError = document.getElementById("emailGateError");
  const emailGateHp = document.getElementById("emailGateHp");
  const emailSendStatus = document.getElementById("emailSendStatus");
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
  const secretCornerCast = document.getElementById("secretCornerCast");
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
  const SEND_STICKER_EMAIL_ENDPOINT = "/api/gacha-send-sticker-email";
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

  const secretStickers = [
    { title: "もびち", variant: "full", fileName: "もびち-full.png" },
    { title: "もびやん", variant: "full", fileName: "もびやん-full.png" },
    { title: "もびりん", variant: "full", fileName: "もびりん-full.png" },
    { title: "病みモビー", variant: "full", fileName: "病みモビー-full.png" },
    { title: "もびち", variant: "half", fileName: "もびち-half.png" },
    { title: "もびやん", variant: "half", fileName: "もびやん-half.png" },
    { title: "もびりん", variant: "half", fileName: "もびりん-half.png" },
    { title: "病みモビー", variant: "half", fileName: "病みモビー-half.png" }
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

  const secretResults = secretStickers.map((sticker) => ({
    rarity: "SECRET",
    title: sticker.title,
    variant: sticker.variant,
    src: `../gacha-new/assets/main4/${sticker.variant}/${encodeURIComponent(sticker.fileName)}`
  }));

  let isSpinning = false;
  let coins = 1;
  let currentResult = null;
  let currentSaveResult = null;
  let revealResults = [];
  let revealFinalResults = [];
  let revealIndex = 0;
  let revealIntroPending = false;
  let revealOutroPending = false;
  let revealCastPending = false;
  let revealIntroTargetIndex = 0;
  let currentDownloadUrl = "";
  let sheetSlides = [];
  let sheetResultChunks = [];
  let activeSheetSlideIndex = 0;
  let recipientEmail = "";
  const revealRarityClasses = ["rarity-r", "rarity-sr", "rarity-ur", "rarity-pri", "rarity-secret"];
  const SECRET_SHEET_RATE = 1 / 500;

  const sheetSrc = "../gacha-new/assets/gacha/gachasheet.png";
  const secretSheetSrc = "../gacha-new/assets/gacha/gacha-sheet-mobby-4.png";
  const sheetSlots = [
    { x: 102, y: 102, width: 386, height: 386 },
    { x: 537, y: 102, width: 386, height: 386 },
    { x: 102, y: 539, width: 386, height: 386 },
    { x: 537, y: 539, width: 386, height: 386 },
    { x: 102, y: 975, width: 386, height: 386 },
    { x: 537, y: 975, width: 386, height: 386 }
  ];
  const secretSheetSlots = [
    { x: 102, y: 320, width: 386, height: 386 },
    { x: 537, y: 320, width: 386, height: 386 },
    { x: 102, y: 757, width: 386, height: 386 },
    { x: 537, y: 757, width: 386, height: 386 }
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
  if (isPaidMode && emailGate) emailGate.hidden = true;

  function normalizeEmail(value) {
    return String(value || "").trim();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setEmailGateError(message) {
    if (emailGateError) emailGateError.textContent = message;
  }

  function validateEmailGate() {
    const email = normalizeEmail(gachaEmailInput?.value);
    if (!email) {
      setEmailGateError("メールアドレスを入力してください。");
      gachaEmailInput?.focus();
      return false;
    }
    if (!isValidEmail(email)) {
      setEmailGateError("正しいメールアドレスを入力してください。");
      gachaEmailInput?.focus();
      return false;
    }
    setEmailGateError("");
    recipientEmail = email;
    return true;
  }

  function setEmailSendStatus(message, state = "") {
    if (!emailSendStatus) return;
    emailSendStatus.textContent = message;
    emailSendStatus.dataset.state = state;
  }

  function dataUrlToAttachment(dataUrl, fileName) {
    const match = String(dataUrl || "").match(/^data:(image\/png);base64,(.+)$/);
    if (!match) return null;
    return {
      fileName,
      contentType: match[1],
      content: match[2]
    };
  }

  async function sendStickerEmailForCurrentResult() {
    if (!recipientEmail) return;

    const stamp = buildSheetStamp();
    const attachments = sheetSlides.length > 1
      ? sheetSlides.map((slide, index) => dataUrlToAttachment(slide.dataUrl, buildSheetFileName(index, sheetSlides.length, stamp))).filter(Boolean)
      : [dataUrlToAttachment((currentSaveResult || currentResult)?.src, buildSheetFileName(null, null, stamp))].filter(Boolean);

    if (!attachments.length) return;

    setEmailSendStatus("メール送信中...", "pending");
    try {
      const response = await fetch(SEND_STICKER_EMAIL_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipientEmail,
          hp: emailGateHp?.value || "",
          pullCount,
          attachments
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Failed to send email");
      }
      setEmailSendStatus("結果画像をメールで送信しました。", "success");
    } catch (error) {
      console.error("Failed to send sticker result email", error);
      setEmailSendStatus("メール送信に失敗しました。画像はこの画面から保存できます。", "error");
    }
  }

  function setBusy(busy) {
    isSpinning = busy;
    const paidSpinConsumed = isPaidMode && hasUsedPaidSpin;
    spinButton.disabled = busy || !paidSpinAvailable || paidSpinConsumed;
    handleButton.disabled = busy || !paidSpinAvailable || paidSpinConsumed;
    if (gachaEmailInput) gachaEmailInput.disabled = busy;
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

  function appendSecretSheet(selectedResults, variant) {
    const secretSheet = secretResults.filter((result) => result.variant === variant);
    selectedResults.push(...secretSheet);
    while (selectedResults.length % sheetSlots.length !== 0) {
      selectedResults.push({ rarity: "SECRET", title: "SECRET", isSpacer: true });
    }
  }

  function pickResults(count) {
    const sheetCount = Math.max(1, Math.ceil(count / sheetSlots.length));
    const selectedResults = [];
    const guaranteedVariant = Math.random() < 0.5 ? "full" : "half";
    for (let sheetIndex = 0; sheetIndex < sheetCount; sheetIndex += 1) {
      const remaining = count - selectedResults.length;
      const sheetLength = Math.min(sheetSlots.length, Math.max(0, remaining));
      const shouldUseSecretSheet = Math.random() < SECRET_SHEET_RATE;
      if (shouldUseSecretSheet) {
        appendSecretSheet(selectedResults, guaranteedVariant);
      } else {
        for (let index = 0; index < sheetLength; index += 1) {
          selectedResults.push(pickResult());
        }
      }
    }
    return selectedResults;
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

  function drawContainImage(context, image, slot) {
    const scale = Math.min(slot.width / image.naturalWidth, slot.height / image.naturalHeight, 1);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    const x = slot.x + (slot.width - width) / 2;
    const y = slot.y + (slot.height - height) / 2;

    context.save();
    context.drawImage(image, x, y, width, height);
    context.restore();
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    });
  }

  async function composeSheet(selectedResults) {
    const drawableResults = selectedResults.filter((result) => !result.isSpacer);
    const isSecretOnlySheet = drawableResults.length > 0 && drawableResults.every((result) => result.rarity === "SECRET");
    const [sheetImage, ...stickerImages] = await Promise.all([
      loadImage(isSecretOnlySheet ? secretSheetSrc : sheetSrc),
      ...drawableResults.map((result) => loadImage(result.src))
    ]);

    const canvas = document.createElement("canvas");
    const sheetCount = Math.max(1, Math.ceil(selectedResults.length / sheetSlots.length));
    canvas.width = sheetImage.naturalWidth;
    canvas.height = sheetImage.naturalHeight * sheetCount;

    const context = canvas.getContext("2d");
    for (let index = 0; index < sheetCount; index += 1) {
      context.drawImage(sheetImage, 0, sheetImage.naturalHeight * index);
    }
    let imageIndex = 0;
    selectedResults.forEach((result, index) => {
      if (result.isSpacer) return;
      const image = stickerImages[imageIndex];
      imageIndex += 1;
      const slot = isSecretOnlySheet ? secretSheetSlots[(imageIndex - 1) % secretSheetSlots.length] : sheetSlots[index % sheetSlots.length];
      const pageIndex = Math.floor(index / sheetSlots.length);
      const targetSlot = {
        ...slot,
        y: slot.y + sheetImage.naturalHeight * pageIndex
      };
      if (isSecretOnlySheet) {
        drawContainImage(context, image, targetSlot);
      } else {
        drawCoverImage(context, image, targetSlot);
      }
    });

    const dataUrl = canvas.toDataURL("image/png");
    return {
      dataUrl,
      blob: await canvasToBlob(canvas) || await dataUrlToBlob(dataUrl)
    };
  }

  function chunkSheetResults(selectedResults) {
    const chunks = [];
    for (let index = 0; index < selectedResults.length; index += sheetSlots.length) {
      chunks.push(selectedResults.slice(index, index + sheetSlots.length));
    }
    return chunks;
  }

  async function composeSheetSlides(selectedResults) {
    const chunks = chunkSheetResults(selectedResults);
    return Promise.all(chunks.map((chunk) => composeSheet(chunk)));
  }

  function updateSheetSlide(index) {
    if (!sheetSlides.length) return;
    activeSheetSlideIndex = Math.max(0, Math.min(sheetSlides.length - 1, index));
    const slide = sheetSlides[activeSheetSlideIndex];
    const activeChunk = sheetResultChunks[activeSheetSlideIndex] || [];
    const isSecretSlide = activeChunk.some((result) => result.rarity === "SECRET");
    resultSheet.classList.toggle("is-secret-slide", isSecretSlide);

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
    if (sheetResultChunks.length) {
      renderStickerResults(activeChunk);
    }
    refreshDownloadLink();
  }

  async function showResult(selectedResults) {
    const visibleResultsForState = selectedResults.filter((result) => !result.isSpacer);
    const isSecretResult = visibleResultsForState.length > 0 && visibleResultsForState.every((result) => result.rarity === "SECRET");
    resultSheet.classList.toggle("is-secret-result", isSecretResult);
    const isMultiSheet = selectedResults.length > sheetSlots.length;
    if (isMultiSheet) {
      sheetSlides = await composeSheetSlides(selectedResults);
      sheetResultChunks = chunkSheetResults(selectedResults);
      currentSaveResult = null;
      activeSheetSlideIndex = 0;
      resultTitle.textContent = isSecretResult ? "シークレットシートをゲット！" : `${sheetSlides.length}枚のシール台紙をゲット！`;
      resultText.textContent = isSecretResult ? "fullまたはhalfの4枚セットがまとまって出ました。" : "左右のボタンで台紙をスライドして確認できます。";
      if (stickerResults) {
        stickerResults.hidden = false;
      }
      if (sheetSlider) sheetSlider.hidden = sheetSlides.length <= 1;
      updateSheetSlide(0);
      if (againButton && isPaidMode) againButton.textContent = "もう一度購入する";
      resultSheet.hidden = false;
      sendStickerEmailForCurrentResult();
      return;
    }

    sheetSlides = [];
    sheetResultChunks = [];
    activeSheetSlideIndex = 0;
    currentSaveResult = null;
    if (sheetSlider) sheetSlider.hidden = true;
    if (stickerResults) stickerResults.hidden = false;

    const sheetImage = await composeSheet(selectedResults);
    const visibleResults = visibleResultsForState;
    const raritySummary = visibleResults.map((result) => result.rarity).join(" / ");

    currentResult = {
      title: `${visibleResults.length}枚シールシート`,
      rarity: raritySummary,
      src: sheetImage.dataUrl,
      blob: sheetImage.blob
    };
    currentSaveResult = currentResult;
    resultImage.src = sheetImage.dataUrl;
    resultImage.alt = `ガチャで出た${visibleResults.length}枚のシールシート`;
    resultImage.hidden = false;
    resultTitle.textContent = isSecretResult ? "シークレットシートをゲット！" : `${visibleResults.length}枚のシールをゲット！`;
    resultText.textContent = isSecretResult ? "fullまたはhalfの4枚セットがまとまって出ました。" : `出たシール: ${raritySummary}`;
    renderStickerResults(visibleResults);
    refreshDownloadLink();
    if (againButton && isPaidMode) againButton.textContent = "もう一度購入する";
    resultSheet.hidden = false;
    sendStickerEmailForCurrentResult();
  }

  function showReveal(index) {
    const result = revealResults[index];
    if (!result || !stickerReveal || !stickerRevealImage || !stickerRevealNext) return;

    const isFirstSecretInSheet = result.rarity === "SECRET" && (index === 0 || revealResults[index - 1]?.rarity !== "SECRET");
    if (isFirstSecretInSheet && !result.secretIntroShown) {
      result.secretIntroShown = true;
      revealIntroTargetIndex = index;
      showSecretCornerCast();
      return;
    }

    revealIntroPending = false;
    revealOutroPending = false;
    revealCastPending = false;
    revealIndex = index;
    stickerReveal.classList.remove(...revealRarityClasses, "is-animating", "is-secret-intro", "is-secret-outro", "is-secret-cast");
    const rarityClass = result.rarity === "プリ" ? "rarity-pri" : `rarity-${result.rarity.toLowerCase()}`;
    stickerReveal.classList.add(rarityClass);
    if (stickerRevealCount) stickerRevealCount.textContent = `${index + 1} / ${revealResults.length}`;
    stickerRevealImage.src = result.src;
    stickerRevealImage.alt = `${result.title} ${result.rarity}`;
    if (stickerRevealTitle) stickerRevealTitle.textContent = result.title;
    if (stickerRevealRarity) stickerRevealRarity.textContent = result.rarity;
    stickerRevealNext.textContent = index === revealResults.length - 1 ? "結果を見る" : "次へ";
    stickerReveal.hidden = false;

    const delay = result.rarity === "UR" ? 520 : (result.rarity === "プリ" || result.rarity === "SECRET") ? 860 : 0;
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

  function showSecretCornerCast() {
    if (!stickerReveal || !secretCornerCast) {
      showSecretSheetIntro();
      return;
    }

    revealCastPending = true;
    stickerReveal.classList.remove(...revealRarityClasses, "is-animating", "is-charging", "is-secret-intro", "is-secret-outro");
    stickerReveal.classList.add("rarity-secret", "is-secret-cast");
    if (stickerRevealCount) stickerRevealCount.textContent = "SECRET";
    if (stickerRevealTitle) stickerRevealTitle.textContent = "";
    if (stickerRevealRarity) stickerRevealRarity.textContent = "";
    if (stickerRevealImage) {
      stickerRevealImage.hidden = true;
      stickerRevealImage.removeAttribute("src");
      stickerRevealImage.alt = "";
    }
    if (stickerRevealNext) {
      stickerRevealNext.hidden = true;
      stickerRevealNext.disabled = true;
    }
    stickerReveal.hidden = false;
    void stickerReveal.offsetWidth;
    stickerReveal.classList.add("is-animating");
    window.setTimeout(() => {
      if (!revealCastPending) return;
      revealCastPending = false;
      showSecretSheetIntro();
    }, 3300);
  }

  function showSecretSheetIntro() {
    if (!stickerReveal || !stickerRevealImage || !stickerRevealNext) return;

    revealIntroPending = true;
    revealOutroPending = false;
    revealCastPending = false;
    revealIndex = -1;
    stickerReveal.classList.remove(...revealRarityClasses, "is-animating", "is-charging", "is-secret-outro");
    stickerReveal.classList.add("rarity-secret", "is-secret-intro", "is-secret-cast");
    if (stickerRevealCount) stickerRevealCount.textContent = "SECRET SHEET";
    stickerRevealImage.hidden = true;
    stickerRevealImage.removeAttribute("src");
    stickerRevealImage.alt = "";
    if (stickerRevealTitle) stickerRevealTitle.textContent = "シークレットシート確定";
    if (stickerRevealRarity) stickerRevealRarity.textContent = "";
    stickerRevealNext.textContent = "シールを見る";
    stickerRevealNext.hidden = false;
    stickerRevealNext.disabled = false;
    stickerReveal.hidden = false;
    void stickerReveal.offsetWidth;
    stickerReveal.classList.add("is-animating");
    stickerRevealNext.focus();
  }

  function showSecretSheetOutro() {
    if (!stickerReveal || !stickerRevealImage || !stickerRevealNext) return;

    revealIntroPending = false;
    revealOutroPending = true;
    revealCastPending = false;
    stickerReveal.classList.remove(...revealRarityClasses, "is-animating", "is-charging", "is-secret-intro", "is-secret-cast");
    stickerReveal.classList.add("rarity-secret", "is-secret-outro");
    if (stickerRevealCount) stickerRevealCount.textContent = "SECRET COMPLETE";
    stickerRevealImage.hidden = true;
    stickerRevealImage.removeAttribute("src");
    stickerRevealImage.alt = "";
    if (stickerRevealTitle) stickerRevealTitle.textContent = "あなたは500回に一回の確立をひきました！！！";
    if (stickerRevealRarity) stickerRevealRarity.textContent = "シークレットシートを公開します";
    stickerRevealNext.textContent = "シートを見る";
    stickerRevealNext.hidden = false;
    stickerRevealNext.disabled = false;
    stickerReveal.hidden = false;
    void stickerReveal.offsetWidth;
    stickerReveal.classList.add("is-animating");
    stickerRevealNext.focus();
  }

  function showSheetLoading() {
    if (!stickerReveal || !stickerRevealNext) return;
    stickerReveal.classList.remove(...revealRarityClasses, "is-animating", "is-charging", "is-secret-intro", "is-secret-outro", "is-secret-cast");
    stickerReveal.classList.add("is-sheet-loading");
    if (stickerRevealCount) stickerRevealCount.textContent = "LOADING";
    if (stickerRevealImage) {
      stickerRevealImage.hidden = true;
      stickerRevealImage.removeAttribute("src");
      stickerRevealImage.alt = "";
    }
    if (stickerRevealTitle) stickerRevealTitle.textContent = "シート完成まで少し待っててね";
    if (stickerRevealRarity) stickerRevealRarity.textContent = "台紙を準備中...";
    stickerRevealNext.hidden = true;
    stickerRevealNext.disabled = true;
    stickerReveal.hidden = false;
  }

  function finishRevealWithResult(finalResults) {
    showSheetLoading();
    showResult(finalResults)
      .catch(() => {
        if (spinLead) spinLead.textContent = "画像の生成に失敗しました。もう一度試してください。";
      })
      .finally(() => {
        if (stickerReveal) {
          stickerReveal.classList.remove("is-sheet-loading");
          stickerReveal.hidden = true;
        }
        if (stickerRevealNext) {
          stickerRevealNext.hidden = false;
          stickerRevealNext.disabled = false;
        }
        revealResults = [];
        revealFinalResults = [];
        revealIntroPending = false;
        revealOutroPending = false;
        revealCastPending = false;
        revealIntroTargetIndex = 0;
        coins = 1;
        if (coinCount) coinCount.textContent = String(coins);
        setBusy(false);
      });
  }

  function startReveal(selectedResults) {
    revealResults = selectedResults;
    revealFinalResults = selectedResults;
    revealIndex = 0;
    revealIntroTargetIndex = 0;
    if (selectedResults.some((result) => result.rarity === "SECRET")) {
      showReveal(0);
      return;
    }
    showReveal(0);
  }

  function startRevealThenShow(highlightResults, finalResults) {
    if (!highlightResults.length) {
      finishRevealWithResult(finalResults);
      return;
    }

    revealResults = highlightResults;
    revealFinalResults = finalResults;
    revealIndex = 0;
    revealIntroTargetIndex = 0;
    if (highlightResults.some((result) => result.rarity === "SECRET")) {
      showReveal(0);
      return;
    }
    showReveal(0);
  }

  function showNextReveal() {
    if (!revealResults.length) return;
    if (revealIntroPending) {
      showReveal(revealIntroTargetIndex);
      return;
    }
    if (revealOutroPending) {
      revealOutroPending = false;
      finishRevealWithResult(revealFinalResults.length ? revealFinalResults : revealResults);
      return;
    }
    if (revealIndex < revealResults.length - 1) {
      showReveal(revealIndex + 1);
      return;
    }

    const finalResults = revealFinalResults.length ? revealFinalResults : revealResults;
    if (finalResults.some((result) => result.rarity === "SECRET")) {
      showSecretSheetOutro();
      return;
    }

    if (stickerReveal) stickerReveal.hidden = true;
    finishRevealWithResult(finalResults);
  }

  function renderStickerResults(selectedResults) {
    if (!stickerResults) return;
    stickerResults.textContent = "";
    selectedResults.filter((result) => !result.isSpacer).forEach((result, index) => {
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

  function buildSheetStamp() {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
      String(now.getHours()).padStart(2, "0"),
      String(now.getMinutes()).padStart(2, "0")
    ].join("");
  }

  function buildSheetFileName(sheetIndex = null, sheetTotal = null, stamp = buildSheetStamp()) {
    if (sheetIndex !== null && sheetTotal !== null) {
      const indexText = String(sheetIndex + 1).padStart(2, "0");
      const totalText = String(sheetTotal).padStart(2, "0");
      return `mobby-sticker-sheet-${indexText}of${totalText}-${stamp}.png`;
    }
    return `mobby-sticker-sheet-${stamp}.png`;
  }

  function refreshDownloadLink() {
    if (!saveSheetButton || saveSheetButton.tagName !== "A") return;
    const isMultiSheet = sheetSlides.length > 1;
    if (saveCurrentSheetButton) {
      saveCurrentSheetButton.hidden = !isMultiSheet;
    }
    saveSheetButton.textContent = isMultiSheet ? "まとめて保存" : "保存する";

    if (currentDownloadUrl) {
      URL.revokeObjectURL(currentDownloadUrl);
      currentDownloadUrl = "";
    }

    if (isMultiSheet) {
      saveSheetButton.href = "#";
      saveSheetButton.removeAttribute("download");
      return;
    }

    if (shouldUseMobileShareSheet()) {
      saveSheetButton.href = "#";
      saveSheetButton.removeAttribute("download");
      return;
    }

    const saveResult = currentSaveResult || currentResult;
    if (saveResult?.blob) {
      currentDownloadUrl = URL.createObjectURL(saveResult.blob);
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

  async function shareSheetImages(slides, stamp) {
    if (!navigator.share || !slides.length) return false;

    const files = slides.map((slide, index) => {
      const fileName = buildSheetFileName(index, slides.length, stamp);
      return new File([slide.blob], fileName, { type: slide.blob?.type || "image/png" });
    });
    const payload = {
      files,
      title: "Mobbyシールガチャ",
      text: "シールガチャの台紙をまとめてシェア"
    };

    if (navigator.canShare && !navigator.canShare({ files: payload.files })) {
      return false;
    }

    await navigator.share(payload);
    return true;
  }

  function setSaveButtonPending(button, pending, label = "") {
    if (!button) return;
    if (pending) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      if (label) button.textContent = label;
      return;
    }
    button.disabled = false;
    button.removeAttribute("aria-disabled");
  }

  async function saveCurrentSheetImage(event) {
    if (!currentResult?.src || !saveCurrentSheetButton) return;

    event?.preventDefault();

    const originalLabel = saveCurrentSheetButton.textContent;
    setSaveButtonPending(saveCurrentSheetButton, true, "保存中...");

    try {
      const fileName = buildSheetFileName(activeSheetSlideIndex, sheetSlides.length || 1);
      const blob = currentResult.blob || await dataUrlToBlob(currentResult.src);

      if (shouldUseMobileShareSheet() && await shareSheetImage(blob, fileName)) {
        saveCurrentSheetButton.textContent = "共有しました";
      } else if (blob) {
        downloadBlob(blob, fileName);
        saveCurrentSheetButton.textContent = "保存しました";
      } else {
        downloadDataUrl(currentResult.src, fileName);
        saveCurrentSheetButton.textContent = "保存しました";
      }

      window.setTimeout(() => {
        if (saveCurrentSheetButton) saveCurrentSheetButton.textContent = originalLabel;
      }, 1400);
    } catch (error) {
      console.error("Failed to save current sticker sheet image", error);
      saveCurrentSheetButton.textContent = "もう一度保存";
    } finally {
      window.setTimeout(() => setSaveButtonPending(saveCurrentSheetButton, false), 300);
    }
  }

  async function saveSheetImage(event) {
    const saveResult = currentSaveResult || currentResult;
    if ((!saveResult?.src && !sheetSlides.length) || !saveSheetButton) return;
    const isMultiSheet = sheetSlides.length > 1;

    if (
      !isMultiSheet &&
      !shouldUseMobileShareSheet() &&
      saveSheetButton.tagName === "A" &&
      saveSheetButton.getAttribute("href") !== "#"
    ) {
      return;
    }

    event?.preventDefault();

    const originalLabel = saveSheetButton.textContent;
    setSaveButtonPending(saveSheetButton, true, "保存中...");
    if (saveCurrentSheetButton && !saveCurrentSheetButton.hidden) {
      setSaveButtonPending(saveCurrentSheetButton, true);
    }

    try {
      if (isMultiSheet) {
        const stamp = buildSheetStamp();
        if (shouldUseMobileShareSheet() && await shareSheetImages(sheetSlides, stamp)) {
          saveSheetButton.textContent = "共有しました";
        } else {
          sheetSlides.forEach((slide, index) => {
            const fileName = buildSheetFileName(index, sheetSlides.length, stamp);
            if (slide.blob) {
              downloadBlob(slide.blob, fileName);
            } else {
              downloadDataUrl(slide.dataUrl, fileName);
            }
          });
          saveSheetButton.textContent = "保存しました";
        }
        window.setTimeout(() => {
          if (saveSheetButton) saveSheetButton.textContent = originalLabel;
        }, 1400);
        return;
      }

      const fileName = buildSheetFileName();
      const blob = saveResult.blob || await dataUrlToBlob(saveResult.src);

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
        downloadDataUrl(saveResult.src, fileName);
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
        setSaveButtonPending(saveSheetButton, false);
        if (saveCurrentSheetButton && !saveCurrentSheetButton.hidden) {
          setSaveButtonPending(saveCurrentSheetButton, false);
        }
      }, 300);
    }
  }
  function spin() {
    if (isSpinning) return;
    if (!isPaidMode && !validateEmailGate()) return;
    if (isPaidMode && (!paidSpinAvailable || hasUsedPaidSpin)) {
      window.location.href = "index.html";
      return;
    }

    resultSheet.hidden = true;
    setEmailSendStatus("");
    if (stickerResults) stickerResults.textContent = "";
    currentSaveResult = null;
    sheetResultChunks = [];
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
      const revealableResults = selectedResults.filter((result) => !result.isSpacer);
      machineWrap.classList.remove("is-spinning", "is-dropping");
      if (spinLead) spinLead.textContent = "出たシールを確認しよう！";
      if (revealableResults.length > 12) {
        startRevealThenShow(revealableResults.filter((result) => result.rarity !== "R"), selectedResults);
        return;
      }
      startRevealThenShow(revealableResults, selectedResults);
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
      paidSpinAvailable = false;
      hasUsedPaidSpin = true;
      if (spinLead) {
        spinLead.textContent = data.resultEmailSent
          ? "決済を確認しました。ガチャ結果をメールで送信しました。"
          : "決済を確認しました。ガチャ結果メールを送信中です。";
      }
      if (emailGate) emailGate.hidden = true;
    } catch (error) {
      paidSpinAvailable = false;
      if (spinLead) spinLead.textContent = error?.message || "決済確認に失敗しました。";
    } finally {
      setBusy(false);
    }
  }

  spinButton.addEventListener("click", spin);
  handleButton.addEventListener("click", spin);
  emailGate?.addEventListener("submit", (event) => {
    event.preventDefault();
    spin();
  });
  gachaEmailInput?.addEventListener("input", () => {
    if (emailGateError?.textContent) setEmailGateError("");
  });
  againButton?.addEventListener("click", () => {
    if (isPaidMode) {
      window.location.href = "index.html";
      return;
    }
    spin();
  });
  saveSheetButton?.addEventListener("click", saveSheetImage);
  saveCurrentSheetButton?.addEventListener("click", saveCurrentSheetImage);
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
