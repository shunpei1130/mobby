import { FilesetResolver, ImageSegmenter } from "../node_modules/@mediapipe/tasks-vision/vision_bundle.mjs";

function getScriptBaseUrl() {
  const currentScript = document.currentScript;
  if (currentScript && currentScript.src) {
    return new URL(".", currentScript.src);
  }
  return new URL("./", window.location.href);
}

const SCRIPT_BASE_URL = getScriptBaseUrl();
const WASM_ROOT = new URL("../node_modules/@mediapipe/tasks-vision/wasm", SCRIPT_BASE_URL).href;
const MODEL_ASSET_PATH = new URL("./models/deeplabv3.tflite", SCRIPT_BASE_URL).href;

let segmenterPromise = null;

function ensureImageBitmapSource(input) {
  if (
    input instanceof HTMLImageElement ||
    input instanceof HTMLCanvasElement ||
    input instanceof HTMLVideoElement ||
    input instanceof ImageBitmap ||
    (typeof OffscreenCanvas !== "undefined" && input instanceof OffscreenCanvas)
  ) {
    return input;
  }
  throw new Error("Unsupported input type for person segmentation.");
}

export async function getImageSegmenter() {
  if (segmenterPromise) return segmenterPromise;
  segmenterPromise = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(WASM_ROOT);
    return ImageSegmenter.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: MODEL_ASSET_PATH
      },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false
    });
  })().catch((error) => {
    segmenterPromise = null;
    throw error;
  });
  return segmenterPromise;
}

function featherAlphaMask(maskCanvas, width, height) {
  const blurredCanvas = document.createElement("canvas");
  blurredCanvas.width = width;
  blurredCanvas.height = height;
  const blurredCtx = blurredCanvas.getContext("2d");
  blurredCtx.clearRect(0, 0, width, height);
  blurredCtx.filter = "blur(1.2px)";
  blurredCtx.drawImage(maskCanvas, 0, 0);
  blurredCtx.filter = "none";
  return blurredCanvas;
}

function findCropBounds(imageData, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = imageData.data[(y * width + x) * 4 + 3];
      if (alpha < 16) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) {
    return { minX: 0, minY: 0, maxX: width - 1, maxY: height - 1 };
  }
  const pad = 8;
  return {
    minX: Math.max(0, minX - pad),
    minY: Math.max(0, minY - pad),
    maxX: Math.min(width - 1, maxX + pad),
    maxY: Math.min(height - 1, maxY + pad)
  };
}

function resolvePersonCategoryIndex(segmenter) {
  const labels = typeof segmenter.getLabels === "function" ? segmenter.getLabels() : [];
  const personIndex = labels.findIndex((label) => String(label || "").toLowerCase() === "person");
  if (personIndex >= 0) return personIndex;
  return 15;
}

function runSegmentation(segmenter, source) {
  const directResult = segmenter.segment(source);
  if (directResult && typeof directResult.then === "function") {
    return directResult;
  }
  if (directResult) {
    return Promise.resolve(directResult);
  }
  return new Promise((resolve, reject) => {
    try {
      segmenter.segment(source, (result) => {
        if (!result) {
          reject(new Error("Image segmentation returned no result."));
          return;
        }
        resolve(result);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function segmentPerson(input) {
  const source = ensureImageBitmapSource(input);
  const width = source.naturalWidth || source.videoWidth || source.width;
  const height = source.naturalHeight || source.videoHeight || source.height;
  if (!width || !height) {
    throw new Error("Failed to read image dimensions for segmentation.");
  }

  const segmenter = await getImageSegmenter();
  const result = await runSegmentation(segmenter, source);
  const categoryMask = result?.categoryMask;
  if (!categoryMask) {
    throw new Error("Image segmentation did not return a category mask.");
  }
  const categoryValues = categoryMask.getAsUint8Array();
  if (!categoryValues?.length) {
    throw new Error("Category mask is empty.");
  }
  const personCategoryIndex = resolvePersonCategoryIndex(segmenter);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = width;
  sourceCanvas.height = height;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  sourceCtx.drawImage(source, 0, 0, width, height);

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const maskImage = maskCtx.createImageData(width, height);

  for (let i = 0; i < width * height; i += 1) {
    const offset = i * 4;
    const alpha = categoryValues[i] === personCategoryIndex ? 255 : 0;
    maskImage.data[offset] = 255;
    maskImage.data[offset + 1] = 255;
    maskImage.data[offset + 2] = 255;
    maskImage.data[offset + 3] = alpha;
  }
  maskCtx.putImageData(maskImage, 0, 0);

  const featheredMask = featherAlphaMask(maskCanvas, width, height);

  const compositedCanvas = document.createElement("canvas");
  compositedCanvas.width = width;
  compositedCanvas.height = height;
  const compositedCtx = compositedCanvas.getContext("2d", { willReadFrequently: true });
  compositedCtx.clearRect(0, 0, width, height);
  compositedCtx.drawImage(sourceCanvas, 0, 0);
  compositedCtx.globalCompositeOperation = "destination-in";
  compositedCtx.drawImage(featheredMask, 0, 0);
  compositedCtx.globalCompositeOperation = "source-over";

  const compositedData = compositedCtx.getImageData(0, 0, width, height);
  const bounds = findCropBounds(compositedData, width, height);
  const cropWidth = Math.max(1, bounds.maxX - bounds.minX + 1);
  const cropHeight = Math.max(1, bounds.maxY - bounds.minY + 1);

  const subjectCanvas = document.createElement("canvas");
  subjectCanvas.width = cropWidth;
  subjectCanvas.height = cropHeight;
  const subjectCtx = subjectCanvas.getContext("2d");
  subjectCtx.drawImage(
    compositedCanvas,
    bounds.minX,
    bounds.minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return subjectCanvas;
}

window.MobbyBackgroundRemoval = {
  getImageSegmenter,
  segmentPerson
};
