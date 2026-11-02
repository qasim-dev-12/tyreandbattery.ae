import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

// JSON-file "database". Works locally and on a VPS/own server where the
// filesystem is persistent and writable. It does NOT work reliably on
// serverless hosts like Vercel, where the filesystem is read-only/ephemeral
// at request time — reads are fine there, writes are not. Only lib/leads.js
// and lib/orders.js call writeJson, so moving to a real database later only
// means touching those two files.

const DATA_DIR = path.join(process.cwd(), "data");

// One write queue per file so concurrent writes to the same file never race
// each other and corrupt it. Each file's queue is a promise chain — every
// new write waits for the previous write to that same file to finish.
const writeQueues = new Map();

function queueWrite(file, task) {
  const previous = writeQueues.get(file) ?? Promise.resolve();
  const next = previous.then(task, task);
  // Swallow errors here so one failed write doesn't permanently wedge the
  // queue for that file; the caller's awaited promise still rejects.
  writeQueues.set(file, next.catch(() => {}));
  return next;
}

export async function readJson(file, defaultValue = []) {
  const filePath = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === "ENOENT") {
      await writeJson(file, defaultValue);
      return defaultValue;
    }
    throw err;
  }
}

export async function writeJson(file, data) {
  const filePath = path.join(DATA_DIR, file);
  return queueWrite(file, async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmpPath = path.join(
      DATA_DIR,
      `.${path.basename(file)}.${crypto.randomUUID()}.tmp`
    );
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tmpPath, filePath);
    return data;
  });
}
