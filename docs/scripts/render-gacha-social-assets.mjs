import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const assetDir = path.resolve("gacha/assets/social");
const files = (await readdir(assetDir)).filter((file) => file.endsWith(".svg"));

for (const file of files) {
  const inputPath = path.join(assetDir, file);
  const outputPath = path.join(assetDir, file.replace(/\.svg$/u, ".png"));
  await sharp(inputPath).png().toFile(outputPath);
  console.log(`rendered ${path.basename(outputPath)}`);
}