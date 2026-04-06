const COMPOSITING_TEMPLATES = [
  {
    id: "mobby-fact",
    name: "もびりん",
    description: "Fact template",
    src: "compositing/template/mobby_fact_compositing.jpg"
  },
  {
    id: "mobby-gal",
    name: "もびち",
    description: "Gal template",
    src: "compositing/template/mobby_gal_compositing.jpg"
  },
  {
    id: "mobby-yami",
    name: "病みモビー",
    description: "テンプレ右下に人物を重ねて配置",
    src: "compositing/template/mobby_yami_compositing.png"
  },
  {
    id: "mobby-yanki",
    name: "もびやん",
    description: "Yanki template",
    src: "compositing/template/mobby_yanki_compositing.jpg"
  }
];

const compositingState = {
  templateId: COMPOSITING_TEMPLATES[0]?.id || "",
  templateImage: null,
  subjectCanvas: null,
  subtitle: "",
  dragPointerId: null,
  dragOffsetX: 0,
  dragOffsetY: 0,
  subject: {
    x: 0.72,
    y: 0.74,
    scale: 0.3
  }
};

async function getSegmentPerson() {
  let api = window.MobbyBackgroundRemoval;
  if (!api || typeof api.segmentPerson !== "function") {
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

function setCompositingFlow(templateConfirmed) {
  const templateSection = document.querySelector('[data-compositing-section="template"]');
  const uploadSection = document.querySelector('[data-compositing-section="upload"]');
  const uploadBody = document.querySelector('[data-compositing-body="upload"]');
  const subtitleSection = document.querySelector('[data-compositing-section="subtitle"]');
  const subtitleBody = document.querySelector('[data-compositing-body="subtitle"]');
  const scaleBlock = document.getElementById("compositingScaleBlock");
  const actions = document.getElementById("compositingActions");
  if (!templateConfirmed) {
    if (templateSection) templateSection.hidden = false;
    if (uploadSection) uploadSection.hidden = true;
    if (uploadBody) uploadBody.hidden = true;
    if (subtitleSection) subtitleSection.hidden = true;
    if (subtitleBody) subtitleBody.hidden = true;
    setCompositingSection("template", true);
    if (scaleBlock) scaleBlock.hidden = true;
    if (actions) actions.hidden = true;
    return;
  }
  if (templateSection) templateSection.hidden = true;
  if (uploadSection) uploadSection.hidden = false;
  if (uploadBody) uploadBody.hidden = false;
  if (subtitleSection) subtitleSection.hidden = false;
  if (subtitleBody) subtitleBody.hidden = true;
  if (scaleBlock) scaleBlock.hidden = true;
  if (actions) actions.hidden = true;
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
  drawCompositingSubtitle(ctx, canvas);
  const rect = getSubjectPixelRect(canvas);
  if (compositingState.subjectCanvas && rect) {
    ctx.drawImage(compositingState.subjectCanvas, rect.x, rect.y, rect.width, rect.height);
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

async function handleCompositingUploadV2(file) {
  if (!file) return;
  setCompositingStatus("画像を処理しています...");
  setCompositingLoading(true);
  try {
    const image = await loadUserImage(file);
    const segmentPerson = await getSegmentPerson();
    compositingState.subjectCanvas = await segmentPerson(image);
    resetCompositingSubjectPosition();
    renderCompositingPreview();
    const subtitleSection = document.querySelector('[data-compositing-section="subtitle"]');
    const scaleBlock = document.getElementById("compositingScaleBlock");
    const actions = document.getElementById("compositingActions");
    if (subtitleSection) subtitleSection.hidden = false;
    if (scaleBlock) scaleBlock.hidden = false;
    if (actions) actions.hidden = false;
    setCompositingStatus("画像を配置しました。ドラッグで位置調整、スライダーでサイズ調整ができます。");
    setCompositingSection("subtitle", true);
  } catch (error) {
    console.error(error);
    compositingState.subjectCanvas = null;
    renderCompositingPreview();
    setCompositingStatus(`画像の処理に失敗しました: ${error?.message || "unknown error"}`);
  } finally {
    setCompositingLoading(false);
  }
}

async function handleCompositingUpload(file) {
  if (!file) return;
  setCompositingStatus("人物を抽出しています...");
  try {
    const image = await loadUserImage(file);
    const segmentPerson = await getSegmentPerson();
    compositingState.subjectCanvas = await segmentPerson(image);
    resetCompositingSubjectPosition();
    renderCompositingPreview();
    setCompositingStatus("人物を抽出しました。ドラッグで位置調整、スライダーでサイズ調整ができます。");
  } catch (error) {
    console.error(error);
    compositingState.subjectCanvas = null;
    renderCompositingPreview();
    setCompositingStatus(`人物抽出に失敗しました: ${error?.message || "unknown error"}`);
  }
}

function initCompositingTool() {
  const canvas = getCompositingCanvas();
  const scaleInput = document.getElementById("compositingScale");
  const subtitleInput = document.getElementById("compositingSubtitle");
  const uploadButton = document.getElementById("compositingUploadButton");
  const fileInput = document.getElementById("compositingFileInput");
  const downloadButton = document.getElementById("compositingDownloadButton");
  const templateConfirmButton = document.getElementById("compositingTemplateConfirmButton");
  if (!canvas || !scaleInput || !subtitleInput || !uploadButton || !fileInput || !downloadButton || !templateConfirmButton) return;

  setCompositingLoading(false);
  setCompositingFlow(false);
  renderCompositingTemplates();
  setActiveCompositingTemplate(compositingState.templateId).catch(console.error);

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
    setCompositingFlow(true);
  });

  scaleInput.addEventListener("input", () => {
    compositingState.subject.scale = Number(scaleInput.value || 30) / 100;
    renderCompositingPreview();
  });

  subtitleInput.addEventListener("input", () => {
    compositingState.subtitle = subtitleInput.value || "";
    renderCompositingPreview();
  });

  uploadButton.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    await handleCompositingUploadV2(file);
    fileInput.value = "";
  });

  downloadButton.addEventListener("click", () => {
    renderCompositingPreview();
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `mobby-compositing-${compositingState.templateId || "image"}.png`;
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
    if (px < subjectRect.x || py < subjectRect.y || px > subjectRect.x + subjectRect.width || py > subjectRect.y + subjectRect.height) return;
    compositingState.dragPointerId = event.pointerId;
    compositingState.dragOffsetX = px - subjectRect.x;
    compositingState.dragOffsetY = py - subjectRect.y;
    canvas.classList.add("is-dragging");
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}
  });

  canvas.addEventListener("pointermove", (event) => {
    if (compositingState.dragPointerId !== event.pointerId) return;
    updatePositionFromPointer(event.clientX, event.clientY);
  });

  const endDrag = (event) => {
    if (compositingState.dragPointerId !== event.pointerId) return;
    compositingState.dragPointerId = null;
    canvas.classList.remove("is-dragging");
    try { canvas.releasePointerCapture(event.pointerId); } catch (_) {}
  };

  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  renderCompositingPreview();
}

window.initCompositingTool = initCompositingTool;
window.dispatchEvent(new Event("compositing:ready"));
