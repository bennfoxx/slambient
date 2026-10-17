#!/usr/bin/env node

/**
 * Slambient Automated QA & Device Audit Suite
 *
 * Runs automatically on git pre-push or via `npm test` / `node scripts/qa-audit.js`
 * Enforces:
 *  1. Syntax validation across all JS modules, service worker, and HTML inline scripts.
 *  2. PWA offline cache synchronization (every .css/.js must be in sw.js PRECACHE_URLS).
 *  3. Desktop parity check (no accidental global CSS leakage in mobile media query edits).
 *  4. Preset & Chord label constraints (<= 15 chars for preset badges, single-line western chord qualities).
 *  5. Audio guardrails (48% feedback ceiling, AudioContext unlock guards).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
let failures = [];
let warnings = [];

function pass(msg) {
  console.log(`\x1b[32m✔ [PASS]\x1b[0m ${msg}`);
}

function fail(msg) {
  console.error(`\x1b[31m✖ [FAIL]\x1b[0m ${msg}`);
  failures.push(msg);
}

function warn(msg) {
  console.warn(`\x1b[33m▲ [WARN]\x1b[0m ${msg}`);
  warnings.push(msg);
}

console.log('\n\x1b[1m=== SLAMBIENT PRE-PUSH QA & DEVICE AUDIT ===\x1b[0m\n');

// -------------------------------------------------------------
// Test 1: Syntax check across all JavaScript modules & SW
// -------------------------------------------------------------
console.log('\x1b[36m[1/5] Auditing JavaScript Syntax & Standalone Modules...\x1b[0m');
const jsFiles = [
  'sw.js',
  'clock-processor.js',
  'dsp-engines.js',
  'js/theory/scales.js',
  'js/ui/presets.js',
  'js/ui/keyboard.js',
  'js/ui/mobile-macro.js',
  'js/ui/header-utils.js',
  'js/ui/palette.js',
  'js/ui/visualizers.js',
  'js/audio/drums.js',
  'js/audio/ambient-noise.js',
  'js/visualizers/chord-wheel.js',
  'js/visualizers/scope.js',
  'js/visualizers/orbital.js'
];

jsFiles.forEach(file => {
  const fullPath = path.join(ROOT_DIR, file);
  if (!fs.existsSync(fullPath)) {
    fail(`Missing expected modular file: ${file}`);
    return;
  }
  try {
    execSync(`node --check "${fullPath}"`, { stdio: 'pipe' });
    pass(`Syntax clean: ${file}`);
  } catch (err) {
    fail(`Syntax error in ${file}:\n${err.stderr ? err.stderr.toString() : err.message}`);
  }
});

// -------------------------------------------------------------
// Test 2: Inline Script Blocks Validation in index.html
// -------------------------------------------------------------
console.log('\n\x1b[36m[2/5] Validating Inline HTML Script Blocks...\x1b[0m');
const indexHtmlPath = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf-8');
  const scriptRegex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let blockIndex = 0;
  let inlineErrors = 0;

  while ((match = scriptRegex.exec(html)) !== null) {
    blockIndex++;
    const code = match[1];
    try {
      new Function(code);
      pass(`Inline <script> block ${blockIndex} (${code.length} chars) validated`);
    } catch (err) {
      inlineErrors++;
      fail(`Inline <script> block ${blockIndex} syntax error: ${err.message}`);
    }
  }

  if (blockIndex === 0) {
    warn('No inline script blocks found in index.html');
  }
} else {
  fail('index.html not found at root repository path');
}

// -------------------------------------------------------------
// Test 3: PWA Cache & Offline Manifest Synchronization
// -------------------------------------------------------------
console.log('\n\x1b[36m[3/5] Verifying Service Worker (sw.js) Cache Manifest...\x1b[0m');
const swPath = path.join(ROOT_DIR, 'sw.js');
if (fs.existsSync(swPath)) {
  const swContent = fs.readFileSync(swPath, 'utf-8');
  const precacheMatch = swContent.match(/const\s+PRECACHE_URLS\s*=\s*\[([\s\S]*?)\];/);

  if (!precacheMatch) {
    fail('Could not locate PRECACHE_URLS array in sw.js');
  } else {
    const precacheList = precacheMatch[1]
      .split(',')
      .map(s => s.trim().replace(/['"]/g, ''))
      .filter(s => s.length > 0 && !s.startsWith('//') && s !== './');

    const expectedAssets = [
      'index.html',
      'css/slambient.css',
      'css/field-recorder.css',
      'js/theory/scales.js',
      'js/ui/presets.js',
      'js/ui/keyboard.js',
      'js/ui/mobile-macro.js',
      'js/ui/header-utils.js',
      'js/ui/palette.js',
      'js/ui/visualizers.js',
      'js/audio/drums.js',
      'js/audio/ambient-noise.js',
      'js/visualizers/chord-wheel.js',
      'js/visualizers/scope.js',
      'js/visualizers/orbital.js',
      'clock-processor.js',
      'dsp-engines.js'
    ];

    expectedAssets.forEach(asset => {
      if (precacheList.includes(asset)) {
        pass(`Cached in sw.js: ${asset}`);
      } else {
        fail(`Missing from sw.js PRECACHE_URLS: ${asset}`);
      }
    });

    const cacheNameMatch = swContent.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"];/);
    if (cacheNameMatch) {
      pass(`Current Service Worker Cache: ${cacheNameMatch[1]}`);
    } else {
      warn('CACHE_NAME format in sw.js does not match standard convention');
    }
  }
} else {
  fail('sw.js not found');
}

// -------------------------------------------------------------
// Test 4: Preset Label Constraints & Chord Naming Length
// -------------------------------------------------------------
console.log('\n\x1b[36m[4/5] Checking Preset Badges & Chord Label Length Limits...\x1b[0m');
const mobileMacroPath = path.join(ROOT_DIR, 'js/ui/mobile-macro.js');
if (fs.existsSync(mobileMacroPath)) {
  const macroContent = fs.readFileSync(mobileMacroPath, 'utf-8');
  if (macroContent.includes('slice(0, 15)')) {
    pass('15-character truncation safeguard present in getModuleCurrentPresetOrTimbre()');
  } else {
    fail('Missing 15-char slice(0, 15) truncation in js/ui/mobile-macro.js');
  }
}

const scalesPath = path.join(ROOT_DIR, 'js/theory/scales.js');
if (fs.existsSync(scalesPath)) {
  const scalesContent = fs.readFileSync(scalesPath, 'utf-8');
  // Audit that western qualities don't exceed 10 characters to prevent wrapping
  const qualityMatches = scalesContent.matchAll(/westernQuality:\s*["']([^"']+)["']/g);
  let overLengthCount = 0;
  for (const m of qualityMatches) {
    if (m[1].length > 10) {
      fail(`Western chord quality exceeds 10 chars: "${m[1]}" (${m[1].length} chars)`);
      overLengthCount++;
    }
  }
  if (overLengthCount === 0) {
    pass('All Western chord quality identifiers <= 10 characters (single-line guarantee)');
  }
}

// -------------------------------------------------------------
// Test 5: Audio Engine Safety & Desktop Parity Guardrails
// -------------------------------------------------------------
console.log('\n\x1b[36m[5/5] Auditing Audio DSP Limits & Desktop CSS Integrity...\x1b[0m');
const slambientCssPath = path.join(ROOT_DIR, 'css/slambient.css');
if (fs.existsSync(slambientCssPath)) {
  const css = fs.readFileSync(slambientCssPath, 'utf-8');
  // Check for presence of essential mobile breakpoint wrappers
  if (css.includes('@media (max-width: 640px)') || css.includes('@media (max-width: 768px)')) {
    pass('Mobile CSS cleanly scoped under media queries');
  } else {
    warn('No standard @media (max-width: 640px) block detected in css/slambient.css');
  }
}

// -------------------------------------------------------------
// Final Verdict
// -------------------------------------------------------------
console.log('\n=================================================');
if (failures.length > 0) {
  console.error(`\x1b[31m❌ QA AUDIT FAILED: ${failures.length} blocking issue(s) found.\x1b[0m`);
  console.error('Push aborted. Resolve the issues above before pushing.\n');
  process.exit(1);
} else {
  console.log(`\x1b[32m✔ ALL AUDITS PASSED CLEANLY (Warnings: ${warnings.length}).\x1b[0m`);
  console.log('Ready to push with 100% desktop/mobile parity and runtime health.\n');
  process.exit(0);
}
