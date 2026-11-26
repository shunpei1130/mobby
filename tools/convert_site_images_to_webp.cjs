const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '..');
const SOURCE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.avif', '.svg']);
const TEXT_EXTENSIONS = new Set([
  '.html', '.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.xml',
  '.md', '.txt', '.py', '.ps1', '.yml', '.yaml', '.toml', '.webmanifest',
  '.ybw', '.bme', '.ufr', '.5hy', '.mdt', '.zpv'
]);
const LOCAL_IMAGE_HOSTS = new Set([
  'mobby.online',
  'www.mobby.online',
  '127.0.0.1',
  'localhost',
  'haru516-web.github.io'
]);
const SCRIPT_RELATIVE_PATH = 'tools/convert_site_images_to_webp.cjs';

const normalizeRelativePath = (value) => value.replaceAll('\\', '/');
const isDependencyPath = (relativePath) => relativePath.split('/').includes('node_modules');
const replaceExtension = (value, extension) => {
  const currentExtension = path.extname(value);
  return `${value.slice(0, -currentExtension.length)}${extension}`;
};
const escapeRegularExpression = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const trackedFiles = () => execFileSync(
  'git',
  ['-c', 'core.quotePath=false', 'ls-files', '-z'],
  { cwd: ROOT }
).toString('utf8').split('\0').filter(Boolean).map(normalizeRelativePath);

const sourceImages = () => trackedFiles().filter((relativePath) => {
  if (!relativePath.startsWith('docs/')) return false;
  if (isDependencyPath(relativePath)) return false;
  return SOURCE_EXTENSIONS.has(path.extname(relativePath).toLowerCase()) &&
    fs.existsSync(path.join(ROOT, relativePath));
});

const targetFor = (sourceRelativePath) => replaceExtension(sourceRelativePath, '.webp');
const repositoryWebpImages = () => {
  const images = [];
  const visit = (absoluteDirectory, relativeDirectory) => {
    fs.readdirSync(absoluteDirectory, { withFileTypes: true }).forEach((entry) => {
      if (entry.name === '.git' || entry.name === '.codex-tmp' || entry.name === 'node_modules') return;
      const absolutePath = path.join(absoluteDirectory, entry.name);
      const relativePath = normalizeRelativePath(path.join(relativeDirectory, entry.name));
      if (entry.isDirectory()) {
        visit(absolutePath, relativePath);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === '.webp') {
        images.push(relativePath);
      }
    });
  };
  visit(ROOT, '');
  return images;
};
const isTrackedTextFile = (relativePath) => {
  if (isDependencyPath(relativePath)) return false;
  if (TEXT_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) return true;
  return false;
};

const hasForeignUrlAt = (content, offset) => {
  const before = content.slice(Math.max(0, offset - 500), offset);
  const tokenBoundary = Math.max(
    before.lastIndexOf('"'),
    before.lastIndexOf("'"),
    before.lastIndexOf('`'),
    before.lastIndexOf(' '),
    before.lastIndexOf('\n'),
    before.lastIndexOf('\r'),
    before.lastIndexOf('\t'),
    before.lastIndexOf('('),
    before.lastIndexOf('<')
  );
  const tokenStart = before.slice(tokenBoundary + 1);
  const protocolIndex = Math.max(tokenStart.lastIndexOf('https://'), tokenStart.lastIndexOf('http://'));
  if (protocolIndex < 0) return false;
  try {
    const partialUrl = tokenStart.slice(protocolIndex);
    const host = new URL(partialUrl).hostname.toLowerCase();
    return !LOCAL_IMAGE_HOSTS.has(host);
  } catch {
    return false;
  }
};

const convertOne = async (sourceRelativePath) => {
  const sourceAbsolutePath = path.join(ROOT, sourceRelativePath);
  const targetRelativePath = targetFor(sourceRelativePath);
  const targetAbsolutePath = path.join(ROOT, targetRelativePath);
  if (fs.existsSync(targetAbsolutePath)) {
    const metadata = await sharp(targetAbsolutePath, { limitInputPixels: false }).metadata();
    if (metadata.format !== 'webp') {
      throw new Error(`Existing target is not WebP: ${targetRelativePath}`);
    }
    return { sourceRelativePath, targetRelativePath, status: 'reused' };
  }

  const sourceExtension = path.extname(sourceRelativePath).toLowerCase();
  const temporaryPath = `${targetAbsolutePath}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  const input = sharp(sourceAbsolutePath, {
    animated: false,
    limitInputPixels: false,
    density: sourceExtension === '.svg' ? 144 : 72
  }).rotate();
  const output = sourceExtension === '.png' || sourceExtension === '.svg'
    ? input.webp({ lossless: true, effort: 6 })
    : input.webp({ quality: 88, effort: 6, smartSubsample: true });

  try {
    await output.toFile(temporaryPath);
    const signature = Buffer.alloc(12);
    const descriptor = fs.openSync(temporaryPath, 'r');
    try {
      fs.readSync(descriptor, signature, 0, signature.length, 0);
    } finally {
      fs.closeSync(descriptor);
    }
    const isWebp = signature.subarray(0, 4).toString('ascii') === 'RIFF' &&
      signature.subarray(8, 12).toString('ascii') === 'WEBP';
    if (!isWebp) {
      throw new Error(`Invalid WebP output: ${targetRelativePath}`);
    }
    fs.renameSync(temporaryPath, targetAbsolutePath);
  } finally {
    if (fs.existsSync(temporaryPath)) {
      fs.rmSync(temporaryPath, { force: true, maxRetries: 8, retryDelay: 100 });
    }
  }
  return { sourceRelativePath, targetRelativePath, status: 'converted' };
};

const convertAll = async () => {
  const sources = sourceImages();
  const queue = sources.slice();
  const results = [];
  const worker = async () => {
    while (queue.length) {
      const sourceRelativePath = queue.shift();
      results.push(await convertOne(sourceRelativePath));
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  const converted = results.filter((result) => result.status === 'converted').length;
  const reused = results.filter((result) => result.status === 'reused').length;
  process.stdout.write(`${JSON.stringify({ sources: sources.length, converted, reused })}\n`);
};

const rewriteReferences = () => {
  const sources = sourceImages();
  const replacementByName = new Map();
  sources.forEach((sourceRelativePath) => {
    const originalName = path.basename(sourceRelativePath);
    replacementByName.set(originalName.toLowerCase(), path.basename(targetFor(sourceRelativePath)));
  });
  const namePattern = Array.from(replacementByName.keys())
    .sort((left, right) => right.length - left.length)
    .map(escapeRegularExpression)
    .join('|');
  const sourceNameExpression = new RegExp(namePattern, 'giu');
  const localAbsoluteUrlExpression = /(https?:\/\/(?:www\.)?mobby\.online\/[^\s"'`<>?#]+)\.(?:png|jpe?g|avif|svg)(?=([?#][^\s"'`<>]*)?|[\s"'`<>]|$)/giu;
  const quotedImagePathExpression = /(["'`])([^"'`\r\n]*\.(?:png|jpe?g|avif|svg)(?:[?#][^"'`\r\n]*)?)\1/giu;
  let updatedFiles = 0;
  let replacements = 0;

  trackedFiles().forEach((relativePath) => {
    if (relativePath === SCRIPT_RELATIVE_PATH) return;
    if (!isTrackedTextFile(relativePath)) return;
    const absolutePath = path.join(ROOT, relativePath);
    if (!fs.existsSync(absolutePath)) return;
    const original = fs.readFileSync(absolutePath, 'utf8').replace(/^\uFEFF/, '');
    let updated = original.replace(sourceNameExpression, (matched, offset) => {
      if (hasForeignUrlAt(original, offset)) return matched;
      replacements += 1;
      return replacementByName.get(matched.toLowerCase()) || matched;
    });
    updated = updated.replace(localAbsoluteUrlExpression, (matched, prefix) => {
      replacements += 1;
      return `${prefix}.webp`;
    });
    updated = updated.replace(quotedImagePathExpression, (matched, quote, value) => {
      if (/^https?:\/\//i.test(value)) {
        try {
          const host = new URL(value).hostname.toLowerCase();
          if (!LOCAL_IMAGE_HOSTS.has(host)) return matched;
        } catch {
          return matched;
        }
      }
      const replacement = value.replace(/\.(?:png|jpe?g|avif|svg)(?=([?#]|$))/giu, '.webp');
      if (replacement === value) return matched;
      replacements += 1;
      return `${quote}${replacement}${quote}`;
    });
    updated = updated.replace(/<link\b[^>]*>/giu, (tag) => {
      if (!/href=["'][^"']*\.webp(?:[?#][^"']*)?["']/iu.test(tag)) return tag;
      const replacement = tag.replace(/type=["']image\/(?:png|jpe?g|avif)["']/iu, 'type="image/webp"');
      if (replacement !== tag) replacements += 1;
      return replacement;
    });
    if (updated === original) return;

    const temporaryPath = `${absolutePath}.tmp-${process.pid}`;
    fs.writeFileSync(temporaryPath, updated, 'utf8');
    fs.renameSync(temporaryPath, absolutePath);
    updatedFiles += 1;
  });

  process.stdout.write(`${JSON.stringify({ updatedFiles, replacements })}\n`);
};

const verify = async () => {
  const sources = sourceImages();
  const missingTargets = [];
  const invalidTargets = [];
  for (const sourceRelativePath of sources) {
    const targetRelativePath = targetFor(sourceRelativePath);
    const targetAbsolutePath = path.join(ROOT, targetRelativePath);
    if (!fs.existsSync(targetAbsolutePath)) {
      missingTargets.push(targetRelativePath);
      continue;
    }
    try {
      const metadata = await sharp(targetAbsolutePath, { limitInputPixels: false }).metadata();
      if (metadata.format !== 'webp' || !metadata.width || !metadata.height) {
        invalidTargets.push(targetRelativePath);
      }
    } catch {
      invalidTargets.push(targetRelativePath);
    }
  }

  const sourceNames = Array.from(new Set(sources.map((relativePath) => path.basename(relativePath).toLowerCase())));
  const namePattern = sourceNames.sort((left, right) => right.length - left.length)
    .map(escapeRegularExpression)
    .join('|');
  const staleReferences = [];

  if (namePattern) {
    const sourceNameExpression = new RegExp(namePattern, 'giu');
    trackedFiles().forEach((relativePath) => {
      if (relativePath === SCRIPT_RELATIVE_PATH) return;
      if (!isTrackedTextFile(relativePath)) return;
      const absolutePath = path.join(ROOT, relativePath);
      if (!fs.existsSync(absolutePath)) return;
      const content = fs.readFileSync(absolutePath, 'utf8');
      for (const match of content.matchAll(sourceNameExpression)) {
        if (!hasForeignUrlAt(content, match.index)) {
          staleReferences.push(`${relativePath}:${match[0]}`);
        }
      }
    });
  }

  const report = {
    sources: sources.length,
    missingTargets: missingTargets.length,
    invalidTargets: invalidTargets.length,
    staleReferences: staleReferences.length
  };
  process.stdout.write(`${JSON.stringify(report)}\n`);
  if (missingTargets.length) process.stdout.write(`MISSING\n${missingTargets.slice(0, 100).join('\n')}\n`);
  if (invalidTargets.length) process.stdout.write(`INVALID\n${invalidTargets.slice(0, 100).join('\n')}\n`);
  if (staleReferences.length) process.stdout.write(`STALE\n${staleReferences.slice(0, 200).join('\n')}\n`);
  if (missingTargets.length || invalidTargets.length || staleReferences.length) process.exitCode = 1;
};

const verifyAllWebp = async () => {
  const images = repositoryWebpImages();
  const invalid = [];
  let cursor = 0;
  const worker = async () => {
    while (cursor < images.length) {
      const relativePath = images[cursor];
      cursor += 1;
      try {
        const metadata = await sharp(path.join(ROOT, relativePath), { limitInputPixels: false }).metadata();
        if (metadata.format !== 'webp' || !metadata.width || !metadata.height) invalid.push(relativePath);
      } catch {
        invalid.push(relativePath);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  process.stdout.write(`${JSON.stringify({ webpImages: images.length, invalidWebp: invalid.length })}\n`);
  if (invalid.length) {
    process.stdout.write(`INVALID\n${invalid.slice(0, 100).join('\n')}\n`);
    process.exitCode = 1;
  }
};

const deleteOriginals = async () => {
  const sources = sourceImages();
  const invalid = [];
  for (const sourceRelativePath of sources) {
    const targetRelativePath = targetFor(sourceRelativePath);
    const targetAbsolutePath = path.join(ROOT, targetRelativePath);
    try {
      const metadata = await sharp(targetAbsolutePath, { limitInputPixels: false }).metadata();
      if (metadata.format !== 'webp' || !metadata.width || !metadata.height) invalid.push(sourceRelativePath);
    } catch {
      invalid.push(sourceRelativePath);
    }
  }
  if (invalid.length) {
    throw new Error(`Refusing to delete ${invalid.length} originals without valid WebP targets.`);
  }
  sources.forEach((sourceRelativePath) => fs.unlinkSync(path.join(ROOT, sourceRelativePath)));
  process.stdout.write(`${JSON.stringify({ deletedOriginals: sources.length })}\n`);
};

const main = async () => {
  const mode = process.argv[2];
  if (mode === 'convert') return convertAll();
  if (mode === 'rewrite') return rewriteReferences();
  if (mode === 'verify') return verify();
  if (mode === 'verify-webp') return verifyAllWebp();
  if (mode === 'delete-originals') return deleteOriginals();
  throw new Error('Usage: node tools/convert_site_images_to_webp.cjs <convert|rewrite|verify|verify-webp|delete-originals>');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
