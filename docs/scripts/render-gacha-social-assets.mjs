import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assetDir = path.resolve("gacha/assets/social");
const files = (await readdir(assetDir)).filter((file) => file.endsWith(".webp"));

for (const file of files) {
  const inputPath = path.join(assetDir, file);
  const metadata = await sharp(inputPath).metadata();
  if (metadata.format !== "webp") {
    throw new Error(`${file} is not a valid WebP image`);
  }
  console.log(`validated ${path.basename(inputPath)}`);
}
