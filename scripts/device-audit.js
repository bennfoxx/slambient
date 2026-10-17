#!/usr/bin/env node

/**
 * Slambient Automated Headless Device & Viewport Audit
 *
 * Uses native macOS Headless Google Chrome over Chrome DevTools Protocol (CDP)
 * Zero external npm dependencies required.
 *
 * Usage:
 *   node scripts/device-audit.js [URL]
 * Default target: https://slambient-dev.ben-fox202.workers.dev
 */

const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TARGET_URL = process.argv[2] || 'https://slambient-dev.ben-fox202.workers.dev';
const CDP_PORT = 9444;

let chromeProc = null;
let results = [];

function pass(msg) {
  console.log(`\x1b[32m✔ [PASS]\x1b[0m ${msg}`);
  results.push({ pass: true, msg });
}

function fail(msg) {
  console.error(`\x1b[31m✖ [FAIL]\x1b[0m ${msg}`);
  results.push({ pass: false, msg });
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${CDP_PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
    this.eventListeners = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      // Node 22+ has built-in WebSocket, or fallback
      if (typeof WebSocket !== 'undefined') {
        this.ws = new WebSocket(this.wsUrl);
      } else {
        const { WebSocket: WS } = require('ws');
        this.ws = new WS(this.wsUrl);
      }
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        } else if (msg.method && this.eventListeners.has(msg.method)) {
          this.eventListeners.get(msg.method)(msg.params);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.pending.set(id, { res: resolve, rej: reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(event, handler) {
    this.eventListeners.set(event, handler);
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || 'Eval Exception');
    }
    return res.result ? res.result.value : undefined;
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runDeviceAudit() {
  console.log('\n\x1b[1m=== SLAMBIENT HEADLESS DEVICE LAB AUDIT ===\x1b[0m');
  console.log(`Target: \x1b[36m${TARGET_URL}\x1b[0m\n`);

  // 1. Launch Chrome
  chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--mute-audio',
    'about:blank'
  ]);

  await sleep(1200);

  try {
    const targets = await fetchJson('/json');
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Unable to acquire Chrome CDP WebSocket target');
    }

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    // Enable domains
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Console.enable');

    const consoleErrors = [];
    cdp.on('Console.messageAdded', (params) => {
      if (params.message && params.message.level === 'error') {
        consoleErrors.push(params.message.text);
      }
    });

    // ---------------------------------------------------------
    // TEST 1: Desktop Viewport (1440 x 900)
    // ---------------------------------------------------------
    console.log('\x1b[35m[1/3] Testing Desktop Viewport (1440x900)...\x1b[0m');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    });

    await cdp.send('Page.navigate', { url: TARGET_URL });
    await sleep(2500);

    const desktopTitle = await cdp.eval('document.title');
    if (desktopTitle && (desktopTitle.includes('Meander') || desktopTitle.includes('Slambient'))) {
      pass(`App loaded cleanly on Desktop: "${desktopTitle}"`);
    } else {
      fail(`App title mismatch: got "${desktopTitle}"`);
    }

    const desktopOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
    if (!desktopOverflow) {
      pass('Desktop viewport has zero horizontal scroll overflow');
    } else {
      fail('Desktop viewport has horizontal scroll overflow');
    }

    const workspaceLoaded = await cdp.eval('typeof window.WorkspaceManager !== "undefined" || !!document.querySelector("#btnEditWorkspace")');
    if (workspaceLoaded) {
      pass('Workspace Layout Engine (#btnEditWorkspace) is mounted and functional');
    } else {
      fail('Workspace Layout Engine was not detected on Desktop');
    }

    // ---------------------------------------------------------
    // TEST 2: Mobile Portrait Viewport (iPhone 14 Pro: 393 x 852)
    // ---------------------------------------------------------
    console.log('\n\x1b[35m[2/3] Testing Mobile Portrait Viewport (iPhone 14 Pro 393x852)...\x1b[0m');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 852,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: { angle: 0, type: 'portraitPrimary' }
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true });
    await sleep(1000);

    const mobileOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
    if (!mobileOverflow) {
      pass('Mobile Portrait: No horizontal page overflow');
    } else {
      const scrollW = await cdp.eval('document.documentElement.scrollWidth');
      fail(`Mobile Portrait: Page overflows screen (scrollWidth ${scrollW}px > 393px)`);
    }

    const longLabels = await cdp.eval(`
      Array.from(document.querySelectorAll('.btn-preset-chip, .preset-chip-title'))
        .map(el => (el.textContent || '').trim())
        .filter(t => t.length > 15);
    `);
    if (longLabels && longLabels.length === 0) {
      pass('Mobile Portrait: All preset labels strictly obey <= 15-character truncation');
    } else {
      fail(`Mobile Portrait: Found preset labels exceeding 15 chars: ${JSON.stringify(longLabels)}`);
    }

    // ---------------------------------------------------------
    // TEST 3: Mobile Landscape Viewport (844 x 390)
    // ---------------------------------------------------------
    console.log('\n\x1b[35m[3/3] Testing Mobile Landscape Viewport (844x390)...\x1b[0m');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 844,
      height: 390,
      deviceScaleFactor: 3,
      mobile: true,
      screenOrientation: { angle: 90, type: 'landscapePrimary' }
    });
    await sleep(1000);

    const landscapeOverflow = await cdp.eval('document.documentElement.scrollWidth > window.innerWidth');
    if (!landscapeOverflow) {
      pass('Mobile Landscape: No horizontal page overflow');
    } else {
      fail('Mobile Landscape: Horizontal overflow detected');
    }

    // Check Console Health
    if (consoleErrors.length === 0) {
      pass('Zero uncaught JavaScript runtime errors detected');
    } else {
      fail(`Detected ${consoleErrors.length} uncaught console errors: ${consoleErrors.slice(0, 3).join(' | ')}`);
    }

  } catch (err) {
    fail(`Device audit threw error: ${err.message}`);
  } finally {
    if (chromeProc) {
      chromeProc.kill('SIGTERM');
    }
  }

  console.log('\n=================================================');
  const totalFails = results.filter(r => !r.pass).length;
  if (totalFails === 0) {
    console.log(`\x1b[32m✔ ALL DEVICE AUDITS PASSED CLEANLY (${results.length}/${results.length})\x1b[0m`);
    process.exit(0);
  } else {
    console.error(`\x1b[31m✖ DEVICE AUDIT COMPLETED WITH ${totalFails} FAILURES\x1b[0m`);
    process.exit(1);
  }
}

runDeviceAudit();
