const COMPOSITING_TEMPLATES = [
  {
    id: "mobby-inthebeach",
    name: "inthebeach",
    description: "new template",
    src: "compositing/template/mobby_inthebeach.webp"
  },
  {
    id: "intherain-yami",
    name: "intherainyami",
    description: "new template",
    src: "compositing/template/intherainyami.webp"
  },
  {
    id: "intherain-black",
    name: "intherainblack",
    description: "new template",
    src: "compositing/template/intherainblack.webp"
  },
  {
    id: "mobby-inthespaceship",
    name: "inthespaceship",
    description: "new template",
    src: "compositing/template/mobby_inthespaceship.webp"
  },
  {
    id: "mobby-onthebuilding",
    name: "onthebuilding",
    description: "new template",
    src: "compositing/template/mobby_onthebuilding.webp"
  },
  {
    id: "onthepinkbuilding",
    name: "onthepinkbuilding",
    description: "new template",
    src: "compositing/template/onthepinkbuilding.webp"
  }
];

const compositingState = {
  templateId: COMPOSITING_TEMPLATES[0]?.id || "",
  templateImage: null,
  subjectCanvas: null,
  splashIndex: 0,
  splashShown: false,
  dragPointerId: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  subject: {
    x: 0.72,
    y: 0.74,
    scale: 0.3,
    rotation: 0
  }
};

function getCompositingSplashSteps() {
  const mainTemplate = COMPOSITING_TEMPLATES[0];
  const secondTemplate = COMPOSITING_TEMPLATES[1] || mainTemplate;
  const thirdTemplate = COMPOSITING_TEMPLATES[2] || mainTemplate;
  const splashPosterSrc = "compositing/reference/flier_mobby.webp";
  return [
    {
      title: "テンプレートを選ぼう",
      text: "まずは好きなポスターテンプレートを選択。<br>雰囲気に合うデザインから始められます。",
      visual: `
        <div class="compositing-splash__mock">
          <div class="compositing-splash__mock-title">テンプレート <span>⌄</span></div>
          <div class="compositing-splash__template">
            <span class="compositing-splash__template-thumb"><img src="${mainTemplate.src}" alt=""></span>
            <span><strong>${mainTemplate.name}</strong><span>${mainTemplate.description}</span></span>
          </div>
          <div class="compositing-splash__template">
            <span class="compositing-splash__template-thumb"><img src="${secondTemplate.src}" alt=""></span>
            <span><strong>${secondTemplate.name}</strong><span>${secondTemplate.description}</span></span>
          </div>
          <div class="compositing-splash__template">
            <span class="compositing-splash__template-thumb"><img src="${thirdTemplate.src}" alt=""></span>
            <span><strong>${thirdTemplate.name}</strong><span>${thirdTemplate.description}</span></span>
          </div>
        </div>`
    },
    {
      title: "画像をアップロード",
      text: "合成したい画像を選んでアップロード。<br>背景を抜いて使うか、そのまま使うかも選べます。",
      visual: `
        <div class="compositing-splash__mock">
          <div class="compositing-splash__upload">
            <strong>画像をアップロード</strong>
            <div class="compositing-splash__upload-box"><span class="compositing-splash__image-icon"></span><span>タップして画像を選ぶ</span></div>
            <div class="compositing-splash__down">⌄</div>
            <div class="compositing-splash__choice"><span class="compositing-splash__cut-icon"></span>背景を抜いて使う</div>
            <div class="compositing-splash__plain-choice"><span class="compositing-splash__small-image-icon"></span>画像をそのまま使う</div>
          </div>
        </div>`
    },
    {
      title: "画像を調整しよう",
      text: "合成した画像の位置や見え方を調整。<br>人物サイズや角度を整えて、自然な仕上がりにできます。",
      visual: `
        <div class="compositing-splash__poster"><img src="${splashPosterSrc}" alt=""></div>
        <div class="compositing-splash__sliders">
          <div class="compositing-splash__slider-label">人物サイズ</div>
          <div class="compositing-splash__slider"></div>
          <div class="compositing-splash__slider-label">角度調整</div>
          <div class="compositing-splash__slider"></div>
        </div>`
    },
    {
      title: "保存して完了",
      text: "仕上がりを確認したら画像を保存。<br>あなただけのMobbyポスターが完成です。",
      visual: `<div class="compositing-splash__poster compositing-splash__poster--complete"><img src="${splashPosterSrc}" alt=""><span class="compositing-splash__save-pill">画像を保存</span></div>`
    }
  ];
}

function renderCompositingSplash() {
  const content = document.getElementById("compositingSplashContent");
  const count = document.getElementById("compositingSplashCount");
  const dots = document.getElementById("compositingSplashDots");
  const next = document.getElementById("compositingSplashNext");
  if (!content || !count || !dots || !next) return;

  const steps = getCompositingSplashSteps();
  const index = Math.min(Math.max(compositingState.splashIndex, 0), steps.length - 1);
  const step = steps[index];
  content.className = `compositing-splash__content compositing-splash__content--step${index + 1}`;
  content.innerHTML = `
    <div class="compositing-splash__badge">STEP ${index + 1}</div>
    <h3 class="compositing-splash__title">${step.title}</h3>
    <p class="compositing-splash__text">${step.text}</p>
    ${step.visual}
  `;
  count.textContent = `${index + 1} / ${steps.length}`;
  dots.innerHTML = steps.map((_, dotIndex) => `<span class="compositing-splash__dot ${dotIndex === index ? "is-active" : ""}"></span>`).join("");
  next.textContent = index === steps.length - 1 ? "はじめる" : "次へ";
}

function hideCompositingSplash() {
  const splash = document.getElementById("compositingSplash");
  if (splash) splash.hidden = true;
}

function showCompositingSplash() {
  const splash = document.getElementById("compositingSplash");
  if (!splash) return;
  compositingState.splashIndex = 0;
  compositingState.splashShown = true;
  renderCompositingSplash();
  splash.hidden = false;
}

window.showCompositingSplash = showCompositingSplash;

function loadExternalScript(src) {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === "true") return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(existing), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve(script);
    }, { once: true });
    script.addEventListener("error", () => reject(new Error(`Failed to load script: ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

async function getSegmentPerson() {
  let api = window.MobbyBackgroundRemoval;
  if (!api || typeof api.segmentPerson !== "function") {
    await (window.__mobbyBackgroundRemovalPromise ||= loadExternalScript("compositing/background-removal.js").catch((error) => {
      window.__mobbyBackgroundRemovalPromise = null;
      throw error;
    }));
    await new Promise((resolve) => {
      let attempts = 0;
      const timer = setInterval(() => {
        attempts += 1;
        api = window.MobbyBackgroundRemoval;
        if ((api && typeof api.segmentPerson === "function") || attempts >= 100) {
          clearInterval(timer);
          resolve();
        }
      }, 50);
    });
    api = window.MobbyBackgroundRemoval;
  }
  if (!api || typeof api.segmentPerson !== "function") {
    throw new Error("Background removal module is not loaded.");
  }
  return api.segmentPerson;
}

function setCompositingStatus(message) {
  const status = document.getElementById("compositingStatus");
  if (status) status.textContent = message;
}

function setCompositingLoading(isLoading) {
  const overlay = document.getElementById("compositingLoadingOverlay");
  if (overlay) overlay.hidden = !isLoading;
}

function setCompositingSection(sectionId, open) {
  document.querySelectorAll("[data-compositing-section]").forEach((section) => {
    const isTarget = section.getAttribute("data-compositing-section") === sectionId;
    const nextOpen = Boolean(open) && isTarget;
    section.classList.toggle("is-open", nextOpen);
    const toggle = section.querySelector("[data-compositing-toggle]");
    const body = section.querySelector("[data-compositing-body]");
    if (toggle) toggle.setAttribute("aria-expanded", nextOpen ? "true" : "false");
    if (body) body.hidden = !nextOpen;
  });
}

function setCompositingFlow(templateConfirmed, subjectReady = false) {
  const templateSection = document.querySelector('[data-compositing-section="template"]');
  const uploadSection = document.querySelector('[data-compositing-section="upload"]');
  const uploadBody = document.querySelector('[data-compositing-body="upload"]');
  const uploadBlock = document.getElementById("compositingUploadBlock");
  const scaleBlock = document.getElementById("compositingScaleBlock");
  const rotationBlock = document.getElementById("compositingRotationBlock");
  const actions = document.getElementById("compositingActions");
  const lead = document.getElementById("compositingLead");

  if (!templateConfirmed) {
    if (templateSection) templateSection.hidden = false;
    if (uploadSection) uploadSection.hidden = true;
    if (uploadBody) uploadBody.hidden = true;
    if (uploadBlock) {
      uploadBlock.hidden = false;
      uploadBlock.style.display = "";
    }
    if (scaleBlock) scaleBlock.hidden = true;
    if (rotationBlock) rotationBlock.hidden = true;
    if (actions) actions.hidden = true;
    if (lead) lead.hidden = true;
    setCompositingSection("template", true);
    return;
  }

  if (templateSection) templateSection.hidden = true;
  if (uploadSection) uploadSection.hidden = false;
  if (uploadBody) uploadBody.hidden = false;
  if (uploadBlock) {
    uploadBlock.hidden = subjectReady;
    uploadBlock.style.display = subjectReady ? "none" : "";
  }
  if (scaleBlock) scaleBlock.hidden = !subjectReady;
  if (rotationBlock) rotationBlock.hidden = !subjectReady;
  if (actions) actions.hidden = !subjectReady;
  if (lead) lead.hidden = false;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCompositingCanvas() {
  return document.getElementById("compositingCanvas");
}

function getCompositingContext() {
  return getCompositingCanvas()?.getContext("2d");
}

function drawCompositingSubtitle(ctx, canvas) {
  const subtitle = String(compositingState.subtitle || "").trim();
  if (!subtitle) return;

  const fontSize = Math.max(28, Math.round(canvas.width * 0.035));
  const maxWidth = canvas.width * 0.7;
  const centerX = canvas.width * 0.5;
  const topY = canvas.height * 0.155;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px "Arial", sans-serif`;
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.96)";
  ctx.lineWidth = Math.max(8, Math.round(fontSize * 0.34));
  ctx.fillStyle = "#5b4a3f";

  let output = subtitle;
  while (ctx.measureText(output).width > maxWidth && output.length > 1) {
    output = output.slice(0, -1);
  }
  if (output.length < subtitle.length) {
    output = `${output.slice(0, Math.max(0, output.length - 1))}…`;
  }

  ctx.strokeText(output, centerX, topY, maxWidth);
  ctx.fillText(output, centerX, topY, maxWidth);
  ctx.restore();
}

function getSubjectPixelRect(canvas) {
  const subjectCanvas = compositingState.subjectCanvas;
  if (!subjectCanvas) return null;
  const width = canvas.width * compositingState.subject.scale;
  const height = width * (subjectCanvas.height / Math.max(subjectCanvas.width, 1));
  return {
    x: compositingState.subject.x * canvas.width,
    y: compositingState.subject.y * canvas.height,
    width,
    height
  };
}

function renderCompositingPreview() {
  const canvas = getCompositingCanvas();
  const ctx = getCompositingContext();
  if (!canvas || !ctx) return;

  if (compositingState.templateImage) {
    const templateWidth = compositingState.templateImage.naturalWidth || compositingState.templateImage.width || canvas.width;
    const templateHeight = compositingState.templateImage.naturalHeight || compositingState.templateImage.height || canvas.height;
    if (canvas.width !== templateWidth || canvas.height !== templateHeight) {
      canvas.width = templateWidth;
      canvas.height = templateHeight;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#f6eee4";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (compositingState.templateImage) {
    ctx.drawImage(compositingState.templateImage, 0, 0);
  }

  const rect = getSubjectPixelRect(canvas);
  if (compositingState.subjectCanvas && rect) {
    ctx.save();
    ctx.translate(rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.rotate((compositingState.subject.rotation || 0) * Math.PI / 180);
    ctx.drawImage(compositingState.subjectCanvas, -rect.width / 2, -rect.height / 2, rect.width, rect.height);
    ctx.restore();
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function createImageCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width || 1;
  canvas.height = image.naturalHeight || image.height || 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context unavailable.");
  ctx.drawImage(image, 0, 0);
  return canvas;
}

async function setActiveCompositingTemplate(templateId) {
  const template = COMPOSITING_TEMPLATES.find((item) => item.id === templateId) || COMPOSITING_TEMPLATES[0];
  if (!template) return;
  compositingState.templateId = template.id;
  compositingState.templateImage = await loadImage(template.src);
  document.querySelectorAll(".compositing-template-btn").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.templateId === template.id);
  });
  renderCompositingPreview();
}

function renderCompositingTemplates() {
  const grid = document.getElementById("compositingTemplateGrid");
  if (!grid) return;
  grid.innerHTML = COMPOSITING_TEMPLATES.map((template) => `
    <button type="button" class="compositing-template-btn ${template.id === compositingState.templateId ? "is-active" : ""}" data-template-id="${template.id}">
      <span class="compositing-template-thumb"><img src="${template.src}" alt="${template.name}" loading="lazy"></span>
      <span class="compositing-template-meta">
        <strong>${template.name}</strong>
        <span>${template.description}</span>
      </span>
    </button>
  `).join("");
  grid.querySelectorAll(".compositing-template-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const templateId = button.dataset.templateId;
      if (!templateId) return;
      await setActiveCompositingTemplate(templateId);
    });
  });
}

function resetCompositingSubjectPosition() {
  compositingState.subject.x = 0.66;
  compositingState.subject.y = 0.67;
  compositingState.subject.scale = Number(document.getElementById("compositingScale")?.value || 30) / 100;
  compositingState.subject.rotation = Number(document.getElementById("compositingRotation")?.value || 0);
}

async function loadUserImage(file) {
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return loadImage(src);
}

async function processCompositingFile(file, { removeBackground }) {
  if (!file) return;
  setCompositingStatus(removeBackground ? "画像の背景を処理しています..." : "画像を読み込んでいます...");
  setCompositingLoading(true);

  try {
    const image = await loadUserImage(file);
    compositingState.subjectCanvas = removeBackground
      ? await (await getSegmentPerson())(image)
      : createImageCanvas(image);
    resetCompositingSubjectPosition();
    renderCompositingPreview();

    setCompositingFlow(true, true);

    setCompositingStatus(removeBackground ? "背景を抜いて配置しました。ドラッグで位置調整できます。" : "画像をそのまま配置しました。ドラッグで位置調整できます。");
  } catch (error) {
    console.error(error);
    compositingState.subjectCanvas = null;
    setCompositingFlow(true, false);
    renderCompositingPreview();
    setCompositingStatus(`画像の処理に失敗しました: ${error?.message || "unknown error"}`);
  } finally {
    setCompositingLoading(false);
  }
}

function initCompositingTool() {
  const canvas = getCompositingCanvas();
  const scaleInput = document.getElementById("compositingScale");
  const rotationInput = document.getElementById("compositingRotation");
  const uploadButton = document.getElementById("compositingUploadButton");
  const uploadOriginalButton = document.getElementById("compositingUploadOriginalButton");
  const backButton = document.getElementById("compositingBackButton");
  const fileInput = document.getElementById("compositingFileInput");
  const downloadButton = document.getElementById("compositingDownloadButton");
  const templateConfirmButton = document.getElementById("compositingTemplateConfirmButton");

  if (!canvas || !scaleInput || !rotationInput || !uploadButton || !uploadOriginalButton || !backButton || !fileInput || !downloadButton || !templateConfirmButton) {
    return;
  }

  if (canvas.dataset.compositingInitialized === "true") {
    return;
  }
  canvas.dataset.compositingInitialized = "true";

  let pendingUploadMode = "remove";

  setCompositingLoading(false);
  setCompositingFlow(false);
  renderCompositingTemplates();
  setActiveCompositingTemplate(compositingState.templateId).catch(console.error);

  document.getElementById("compositingSplashNext")?.addEventListener("click", () => {
    const lastIndex = getCompositingSplashSteps().length - 1;
    if (compositingState.splashIndex >= lastIndex) {
      hideCompositingSplash();
      return;
    }
    compositingState.splashIndex += 1;
    renderCompositingSplash();
  });
  document.getElementById("compositingSplashSkip")?.addEventListener("click", hideCompositingSplash);
  document.getElementById("compositingSplashClose")?.addEventListener("click", hideCompositingSplash);

  document.querySelectorAll("[data-compositing-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const sectionId = button.getAttribute("data-compositing-toggle");
      if (!sectionId) return;
      const section = document.querySelector(`[data-compositing-section="${sectionId}"]`);
      const isOpen = section?.classList.contains("is-open");
      setCompositingSection(sectionId, !isOpen);
    });
  });

  templateConfirmButton.addEventListener("click", () => {
    setCompositingFlow(true, false);
  });

  backButton.addEventListener("click", () => {
    compositingState.subjectCanvas = null;
    setCompositingFlow(false);
    renderCompositingPreview();
    setCompositingStatus("テンプレートを選び直せます。");
  });

  scaleInput.addEventListener("input", () => {
    compositingState.subject.scale = Number(scaleInput.value || 30) / 100;
    renderCompositingPreview();
  });

  rotationInput.addEventListener("input", () => {
    compositingState.subject.rotation = Number(rotationInput.value || 0);
    renderCompositingPreview();
  });

  uploadButton.addEventListener("click", () => {
    pendingUploadMode = "remove";
    fileInput.click();
  });

  uploadOriginalButton.addEventListener("click", () => {
    pendingUploadMode = "keep";
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    await processCompositingFile(file, { removeBackground: pendingUploadMode !== "keep" });
    fileInput.value = "";
  });

  downloadButton.addEventListener("click", () => {
    renderCompositingPreview();
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `mobby-compositing-${compositingState.templateId || "image"}.webp`;
    link.click();
  });

  const updatePositionFromPointer = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const px = ((clientX - rect.left) / rect.width) * canvas.width;
    const py = ((clientY - rect.top) / rect.height) * canvas.height;
    compositingState.subject.x = clamp((px - compositingState.dragOffsetX) / canvas.width, -0.2, 1);
    compositingState.subject.y = clamp((py - compositingState.dragOffsetY) / canvas.height, -0.2, 1);
    renderCompositingPreview();
  };

  canvas.addEventListener("pointerdown", (event) => {
    const subjectRect = getSubjectPixelRect(canvas);
    if (!subjectRect) return;
    const rect = canvas.getBoundingClientRect();
    const px = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const py = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (px < subjectRect.x || py < subjectRect.y || px > subjectRect.x + subjectRect.width || py > subjectRect.y + subjectRect.height) {
      return;
    }
    event.preventDefault();
    compositingState.dragPointerId = event.pointerId;
    compositingState.dragOffsetX = px - subjectRect.x;
    compositingState.dragOffsetY = py - subjectRect.y;
    canvas.classList.add("is-dragging");
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (_) {}
  });

  canvas.addEventListener("pointermove", (event) => {
    if (compositingState.dragPointerId !== event.pointerId) return;
    event.preventDefault();
    updatePositionFromPointer(event.clientX, event.clientY);
  });

  const endDrag = (event) => {
    if (compositingState.dragPointerId !== event.pointerId) return;
    compositingState.dragPointerId = null;
    canvas.classList.remove("is-dragging");
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch (_) {}
  };

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("touchmove", (event) => {
    if (compositingState.dragPointerId !== null) {
      event.preventDefault();
    }
  }, { passive: false });
  renderCompositingPreview();
}

window.initCompositingTool = initCompositingTool;
window.dispatchEvent(new Event("compositing:ready"));
