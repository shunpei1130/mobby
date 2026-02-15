// scripts/dump-reservations.mjs
// node scripts\dump-reservations.mjs reservations/
import fs from 'node:fs/promises';
import dotenv from 'dotenv';
import { list } from '@vercel/blob';

dotenv.config({ path: '.env.local' });

const prefix = process.argv[2] ?? 'reservations/';
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 10);

async function listAllBlobs(prefix) {
  const all = [];
  let cursor = undefined;

  while (true) {
    const res = await list({ prefix, limit: 1000, cursor });
    all.push(...res.blobs);
    if (!res.hasMore) break;
    cursor = res.cursor;
  }
  return all;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      results[idx] = await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

function toCsv(rows) {
  const keys = new Set();
  for (const r of rows) Object.keys(r).forEach((k) => keys.add(k));
  const header = Array.from(keys);

  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    const needsQuote = /[",\n]/.test(s);
    const escaped = s.replaceAll('"', '""');
    return needsQuote ? `"${escaped}"` : escaped;
  };

  const lines = [];
  lines.push(header.map(esc).join(','));
  for (const r of rows) lines.push(header.map((k) => esc(r[k])).join(','));
  return lines.join('\r\n');

}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN が見つかりません。.env.local に入っているか、プロジェクトルートで実行しているか確認してください。'
    );
  }

  const blobs = await listAllBlobs(prefix);
  blobs.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());

  const rows = await mapLimit(blobs, CONCURRENCY, async (b) => {
    const r = await fetch(b.url);
    const text = await r.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { _raw: text };
    }

    return {
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
      url: b.url,
      ...json,
    };
  });

  await fs.mkdir('out', { recursive: true });
  await fs.writeFile('out/reservations_dump.json', JSON.stringify(rows, null, 2), 'utf8');
  await fs.writeFile('out/reservations_dump.csv', '\ufeff' + toCsv(rows), 'utf8');


  console.log(`prefix: ${prefix}`);
  console.log(`count : ${rows.length}`);
  console.log('latest 10:');
  console.table(rows.slice(-10).map((r) => ({ uploadedAt: r.uploadedAt, pathname: r.pathname })));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
