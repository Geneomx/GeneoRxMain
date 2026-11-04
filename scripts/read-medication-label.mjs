import { createWorker } from 'tesseract.js';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Read only from stdin; never write label images or recognized text to disk/logs.
const chunks = [];
let bytes = 0;
for await (const chunk of process.stdin) {
  bytes += chunk.length;
  if (bytes > 6_000_000) process.exit(2);
  chunks.push(chunk);
}
const cachePath = resolve('storage/framework/ocr-models');
await mkdir(cachePath, { recursive: true });
let worker;
try {
  worker = await createWorker('eng', 1, { cachePath, logger: () => {}, errorHandler: () => {} });
  const { data } = await worker.recognize(Buffer.from(Buffer.concat(chunks).toString('utf8'), 'base64'));
  process.stdout.write(JSON.stringify({ text: data.text.slice(0, 10_000), confidence: data.confidence }));
} catch {
  process.exitCode = 1;
} finally {
  if (worker) await worker.terminate();
}
