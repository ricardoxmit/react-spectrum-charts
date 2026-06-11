/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
/**
 * Starts Storybook (S1), records a Playwright video of several Tic-Tac-Toe games,
 * then shuts down. The video shows the bar chart updating as each game completes.
 *
 * Usage:
 *   node scripts/ai/record-tictactoe.mjs [output-path]
 *
 *   output-path  Where to write the .webm. Defaults to tmp/ai/tictactoe.webm
 */
import { chromium } from 'playwright';
import { mkdirSync, readdirSync, statSync, renameSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const PORT = 6011;
const STORYBOOK_CONFIG_DIR = '.storybook';
const STORYBOOK_READY_POLL_MS = 800;
const STORYBOOK_READY_TIMEOUT_MS = 180_000;
const STORY_ID = 'rsc-games-tic-tac-toe--tic-tac-toe';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

const outputArg = process.argv[2];
const outputPath = outputArg
  ? resolve(process.cwd(), outputArg)
  : resolve(repoRoot, 'tmp/ai/tictactoe.webm');
const videoDir = resolve(repoRoot, 'tmp/ai/video-raw');

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(videoDir, { recursive: true });

// ── Start Storybook ───────────────────────────────────────────────────────────

async function waitForStorybook() {
  const start = Date.now();
  while (Date.now() - start < STORYBOOK_READY_TIMEOUT_MS) {
    try {
      const res = await fetch(`http://localhost:${PORT}`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, STORYBOOK_READY_POLL_MS));
  }
  throw new Error(`Storybook did not become ready on port ${PORT} within ${STORYBOOK_READY_TIMEOUT_MS / 1000}s`);
}

console.error(`Starting Storybook S1 on port ${PORT}…`);
const storybookProcess = spawn(
  'yarn',
  ['storybook', 'dev', '-p', String(PORT), '--config-dir', STORYBOOK_CONFIG_DIR, '--ci'],
  {
    cwd: repoRoot,
    env: { ...process.env, NODE_OPTIONS: '--openssl-legacy-provider' },
    stdio: ['ignore', 'ignore', 'pipe'],
  }
);

storybookProcess.stderr.on('data', (chunk) => {
  const line = chunk.toString();
  if (line.toLowerCase().includes('error')) process.stderr.write(`[storybook] ${line}`);
});

function shutdown() {
  if (!storybookProcess.killed) storybookProcess.kill('SIGTERM');
}
process.on('exit', shutdown);
process.on('SIGINT',  () => { shutdown(); process.exit(130); });
process.on('SIGTERM', () => { shutdown(); process.exit(143); });

try {
  await waitForStorybook();
} catch (e) {
  console.error(e.message);
  shutdown();
  process.exit(1);
}
console.error(`Storybook ready at http://localhost:${PORT}`);

// ── Launch browser with video recording ───────────────────────────────────────

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1100, height: 680 },
  recordVideo: { dir: videoDir, size: { width: 1100, height: 680 } },
});
const page = await context.newPage();

const url = `http://localhost:${PORT}/iframe.html?id=${STORY_ID}&viewMode=story`;
console.error(`Loading: ${url}`);
await page.goto(url, { waitUntil: 'load', timeout: 30_000 });

await page.waitForSelector('[role="button"]', { timeout: 15_000 });
await page.waitForSelector('svg.marks', { timeout: 15_000 });
await page.waitForTimeout(1000);

// ── Game helpers ──────────────────────────────────────────────────────────────

/** Click the first empty board cell (no text content). Returns true if a cell was clicked. */
async function clickFirstEmptyCell() {
  const cells = await page.$$('[role="button"]');
  for (const cell of cells) {
    const text = (await cell.textContent() ?? '').trim();
    if (text === '') {
      await cell.click();
      return true;
    }
  }
  return false;
}

/**
 * Click a specific board position (1-9, row-major).
 * Returns false if the cell is already occupied.
 */
async function clickCell(pos) {
  const cells = await page.$$('[role="button"]');
  const cell = cells[pos - 1];
  if (!cell) return false;
  const text = (await cell.textContent() ?? '').trim();
  if (text !== '') return false;
  await cell.click();
  return true;
}

/** Wait for the game to end (Play Again button appears). */
async function waitForGameEnd(timeoutMs = 8000) {
  try {
    await page.waitForFunction(
      () => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.some((b) => /play again/i.test(b.textContent ?? ''));
      },
      { timeout: timeoutMs }
    );
    return true;
  } catch {
    return false;
  }
}

/** Click the Play Again / Reset button. */
async function resetGame() {
  const btn = page.getByRole('button', { name: /play again|reset game/i });
  await btn.first().waitFor({ timeout: 5000 });
  await btn.first().click();
  await page.waitForTimeout(600);
}

const MOVE_DELAY = 650; // ms between player moves

// ── Game 1: player attacks corners (X), computer defends center ──────────────
console.error('Game 1 — corners strategy…');
await page.waitForTimeout(400);
await clickCell(1); await page.waitForTimeout(MOVE_DELAY);  // top-left
await page.waitForTimeout(500);                              // computer responds
await clickCell(9); await page.waitForTimeout(MOVE_DELAY);  // bottom-right
await page.waitForTimeout(500);
await clickCell(3); await page.waitForTimeout(MOVE_DELAY);  // top-right
await page.waitForTimeout(500);
await clickCell(7); await page.waitForTimeout(MOVE_DELAY);  // bottom-left
await page.waitForTimeout(500);
// Fill remaining empty cells until game ends
for (let attempts = 0; attempts < 5; attempts++) {
  if (await waitForGameEnd(600)) break;
  await clickFirstEmptyCell();
  await page.waitForTimeout(700);
}
await waitForGameEnd(3000);
await page.waitForTimeout(1000);
await resetGame();

// ── Game 2: player takes center then spreads ──────────────────────────────────
console.error('Game 2 — center-first strategy…');
await clickCell(5); await page.waitForTimeout(MOVE_DELAY);  // center
await page.waitForTimeout(500);
await clickCell(2); await page.waitForTimeout(MOVE_DELAY);  // top-middle
await page.waitForTimeout(500);
await clickCell(8); await page.waitForTimeout(MOVE_DELAY);  // bottom-middle
await page.waitForTimeout(500);
await clickCell(4); await page.waitForTimeout(MOVE_DELAY);  // middle-left
await page.waitForTimeout(500);
for (let attempts = 0; attempts < 5; attempts++) {
  if (await waitForGameEnd(600)) break;
  await clickFirstEmptyCell();
  await page.waitForTimeout(700);
}
await waitForGameEnd(3000);
await page.waitForTimeout(1000);
await resetGame();

// ── Game 3: player plays quickly and lets computer dominate ───────────────────
console.error('Game 3 — quick play…');
await clickCell(2); await page.waitForTimeout(450);
await page.waitForTimeout(500);
await clickCell(6); await page.waitForTimeout(450);
await page.waitForTimeout(500);
await clickCell(8); await page.waitForTimeout(450);
await page.waitForTimeout(500);
for (let attempts = 0; attempts < 4; attempts++) {
  if (await waitForGameEnd(600)) break;
  await clickFirstEmptyCell();
  await page.waitForTimeout(600);
}
await waitForGameEnd(3000);
await page.waitForTimeout(1500);   // hold the final score on screen

// ── Close browser (finalises the .webm) ──────────────────────────────────────
console.error('Closing browser and finalising video…');
await context.close();
await browser.close();

// ── Move recorded video to desired output path ────────────────────────────────
const files = readdirSync(videoDir)
  .filter((f) => f.endsWith('.webm'))
  .sort((a, b) => statSync(resolve(videoDir, b)).mtimeMs - statSync(resolve(videoDir, a)).mtimeMs);

if (files.length === 0) {
  console.error('ERROR: no .webm file found in video directory');
  shutdown();
  process.exit(1);
}

renameSync(resolve(videoDir, files[0]), outputPath);
console.error(`Video saved: ${outputPath}`);
console.log(outputPath);

shutdown();
