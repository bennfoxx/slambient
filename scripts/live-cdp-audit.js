const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ARTIFACT_DIR = "/Users/benfox/.gemini/antigravity/brain/68f938b6-a317-4cd1-b8a0-d8a082b60247";
const TARGET_URL = "https://slambient-dev.ben-fox202.workers.dev";
const CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on("error", reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message || JSON.stringify(data.error)));
          else resolve(data.result);
        }
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(fnOrStr) {
    let expr = typeof fnOrStr === "function" ? "(" + fnOrStr.toString() + ")()" : fnOrStr;
    if (!expr.trim().startsWith("(") && !expr.trim().startsWith("function")) {
      expr = "(() => { " + expr + " })()";
    }
    const res = await this.send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.text || JSON.stringify(res.exceptionDetails));
    }
    return res.result ? res.result.value : undefined;
  }

  async captureScreenshot(outputPath) {
    const res = await this.send("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(res.data, "base64");
    fs.writeFileSync(outputPath, buffer);
    console.log("Saved screenshot: " + path.basename(outputPath) + " (" + buffer.length + " bytes)");
  }

  async setViewport(width, height, isMobile = false, scale = 1) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: scale,
      mobile: isMobile
    });
  }
}

async function runAudit() {
  console.log("Launching Headless Chrome for Live Cloudflare Audit...");
  const chromeProcess = spawn(CHROME_PATH, [
    "--headless=new",
    "--remote-debugging-port=9222",
    "--user-data-dir=/tmp/chrome-cdp-test-profile-" + Date.now(),
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--autoplay-policy=no-user-gesture-required",
    "--window-size=1440,900"
  ], { stdio: "ignore" });

  let client = null;
  const auditResults = {};

  try {
    let version = null;
    for (let i = 0; i < 20; i++) {
      try {
        version = await fetchJson("http://127.0.0.1:9222/json/version");
        if (version) break;
      } catch (e) {
        await wait(250);
      }
    }

    if (!version) throw new Error("Could not connect to Chrome DevTools endpoint");
    console.log("Connected to Chrome:", version["Browser"]);

    const list = await fetchJson("http://127.0.0.1:9222/json/list");
    const page = list.find(t => t.type === "page");
    if (!page) throw new Error("No target page found");

    client = new CDPClient(page.webSocketDebuggerUrl);
    await client.connect();
    console.log("CDP WebSocket established. Navigating to:", TARGET_URL);

    await client.send("Page.enable");
    await client.send("Runtime.enable");
    await client.send("DOM.enable");

    await client.send("Page.navigate", { url: TARGET_URL });
    await wait(3500);

    const title = await client.evaluate(() => document.title);
    console.log("Page Title:", title);

    // ---------------------------------------------------------
    // 1. Studio Workspace & Edit Mode (Phase 8)
    // ---------------------------------------------------------
    console.log("\n--- 1. Workspace & Edit Mode Audit ---");
    await client.setViewport(1440, 900, false);
    await wait(500);
    const ssDesktop = path.join(ARTIFACT_DIR, "live_desktop_full_studio.png");
    await client.captureScreenshot(ssDesktop);

    // 1.1 Toggle Edit Mode
    const editToggled = await client.evaluate(() => {
      const btn = document.getElementById("btnEditWorkspace");
      if (!btn) return { error: "btnEditWorkspace not found" };
      // Test direct handler invocation
      if (typeof toggleWorkspaceEditMode === "function") {
        toggleWorkspaceEditMode(true);
      } else {
        btn.click();
      }
      return {
        active: document.body.classList.contains("workspace-edit-mode"),
        title: btn.title,
        buttonText: btn.textContent.trim()
      };
    });
    console.log("Edit Mode Toggle:", editToggled);
    auditResults.editModeToggle = editToggled.active;

    await wait(400);
    const ssEdit = path.join(ARTIFACT_DIR, "live_desktop_edit_mode.png");
    await client.captureScreenshot(ssEdit);

    // 1.2 Fullscreen Focus on Chord Wheel
    const focusResult = await client.evaluate(() => {
      const btnFocus = document.querySelector("#chordInfoPanel .btn-win-focus");
      if (!btnFocus) return { error: "btnFocus on chordInfoPanel not found" };
      btnFocus.click();
      const panel = document.getElementById("chordInfoPanel");
      return {
        isFocused: panel ? panel.classList.contains("module-fullscreen-active") : false,
        bodyLocked: document.body.classList.contains("module-focus-open")
      };
    });
    console.log("Fullscreen Focus Modal:", focusResult);
    auditResults.fullscreenFocus = focusResult.isFocused && focusResult.bodyLocked;

    await wait(400);
    const ssFocus = path.join(ARTIFACT_DIR, "live_desktop_focus_chord_wheel.png");
    await client.captureScreenshot(ssFocus);

    // Exit Focus
    await client.evaluate(() => {
      const btnExit = document.querySelector("#chordInfoPanel .btn-exit-focus");
      if (btnExit) btnExit.click();
    });
    await wait(200);

    // 1.3 Hide Module into Dock & Restore
    const dockResult = await client.evaluate(() => {
      const btnHide = document.querySelector(".strip-channel.drone-ch .btn-win-hide");
      if (!btnHide) return { error: "btnHide on drone not found" };
      btnHide.click();
      const isHidden = document.querySelector(".strip-channel.drone-ch").classList.contains("module-hidden-in-dock");
      const dock = document.getElementById("workspaceModuleDock");
      const chip = dock ? dock.querySelector('[data-restore-id="drone"]') : null;
      return {
        moduleHidden: isHidden,
        dockVisible: !dock.hidden,
        chipExists: !!chip
      };
    });
    console.log("Module Hide & Dock Chips:", dockResult);
    auditResults.moduleDock = dockResult.moduleHidden && dockResult.chipExists;

    await wait(300);
    const ssDock = path.join(ARTIFACT_DIR, "live_desktop_dock_chips.png");
    await client.captureScreenshot(ssDock);

    // Restore drone module
    await client.evaluate(() => {
      const chip = document.querySelector('[data-restore-id="drone"]');
      if (chip) chip.click();
    });

    // 1.4 Test LocalStorage Persistence
    const reorderPersistence = await client.evaluate(() => {
      const raw = localStorage.getItem("slambient_workspace_v1");
      const parsed = raw ? JSON.parse(raw) : null;
      return {
        hasLocalStorage: !!raw,
        parsedKeys: parsed ? Object.keys(parsed) : []
      };
    });
    console.log("LocalStorage Persistence Check:", reorderPersistence);
    auditResults.workspacePersistence = reorderPersistence.hasLocalStorage;

    // Reset layout & exit edit mode
    await client.evaluate(() => {
      const resetBtn = document.querySelector('[data-template-key="RESET"]');
      if (resetBtn) resetBtn.click();
      if (document.body.classList.contains("workspace-edit-mode")) {
        const btn = document.getElementById("btnEditWorkspace");
        if (btn) btn.click();
      }
    });

    // ---------------------------------------------------------
    // 2. Mobile Touch Keyboard & Audio Timing
    // ---------------------------------------------------------
    console.log("\n--- 2. Mobile Touch Keyboard & Audio Timing ---");
    await client.setViewport(390, 844, true, 2);
    await wait(600);

    const ssMobilePortrait = path.join(ARTIFACT_DIR, "live_mobile_portrait.png");
    await client.captureScreenshot(ssMobilePortrait);

    // Touch Glissando Simulation
    const touchKeyboardResult = await client.evaluate(() => {
      const keys = document.querySelectorAll(".piano-keys-wrapper .white-key, .piano-keys-wrapper .black-key");
      const keyCount = keys.length;
      let notesTriggered = 0;
      const sampleKeys = Array.from(keys).slice(0, 5);
      sampleKeys.forEach((keyEl, idx) => {
        const midi = parseInt(keyEl.dataset.midi, 10);
        const pDown = new PointerEvent("pointerdown", { pointerId: 1, pointerType: "touch", clientX: 20 + idx * 30, clientY: 700 });
        keyEl.dispatchEvent(pDown);
        if (typeof pointerActiveMidi !== "undefined" && pointerActiveMidi.get(1) === midi) {
          notesTriggered++;
        }
        const pUp = new PointerEvent("pointerup", { pointerId: 1, pointerType: "touch", clientX: 20 + idx * 30, clientY: 700 });
        keyEl.dispatchEvent(pUp);
      });
      return {
        keyCount,
        notesTriggered,
        glissandoResponsive: notesTriggered === 5
      };
    });
    console.log("Touch Glissando Audit:", touchKeyboardResult);
    auditResults.mobileTouchGlissando = touchKeyboardResult.glissandoResponsive;

    // Tap Tempo Recalibration
    const tapTempoResult = await client.evaluate(() => {
      if (typeof tapTempo !== "function") return { error: "tapTempo function not found" };
      tapTimes.length = 0;
      const baseTime = performance.now();
      for (let i = 0; i < 6; i++) {
        tapTimes.push(baseTime + i * 750); // 750ms = 80 BPM
      }
      tapTempo();
      const bpmHeader = document.getElementById("knobBpmHeader");
      const currentBpm = bpmHeader ? parseInt(bpmHeader.value, 10) : 0;
      return {
        currentBpm,
        isNearTarget: Math.abs(currentBpm - 80) <= 2
      };
    });
    console.log("Tap Tempo Recalibration:", tapTempoResult);
    auditResults.tapTempo = tapTempoResult.isNearTarget;

    // ---------------------------------------------------------
    // 3. Tanpura Telemetry & Video Export
    // ---------------------------------------------------------
    console.log("\n--- 3. Tanpura Telemetry & Video Export ---");
    await client.setViewport(1440, 900, false);
    await wait(400);

    // Turn on Tanpura drone
    const tanpuraResult = await client.evaluate(() => {
      const chkTanpura = document.getElementById("chkTanpuraEnabled");
      if (chkTanpura && !chkTanpura.checked) chkTanpura.click();
      return {
        tanpuraEnabled: typeof tanpuraEnabled !== "undefined" ? tanpuraEnabled : false,
        droneEnabled: typeof droneEnabled !== "undefined" ? droneEnabled : false
      };
    });
    console.log("Tanpura Drone Activation:", tanpuraResult);
    auditResults.tanpuraActive = tanpuraResult.tanpuraEnabled;

    // Video Recording Check
    const videoExportResult = await client.evaluate(() => {
      const selFormat = document.getElementById("selRecordFormat");
      if (selFormat) selFormat.value = "VIDEO";
      const canvas = document.getElementById("scopeCanvas");
      const hasCaptureStream = !!(canvas && canvas.captureStream);
      let mediaRecorderSupported = typeof MediaRecorder !== "undefined";
      let supportedMimes = [];
      if (mediaRecorderSupported) {
        ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4;codecs=avc1,mp4a", "video/webm"].forEach(m => {
          if (MediaRecorder.isTypeSupported(m)) supportedMimes.push(m);
        });
      }
      return {
        hasCaptureStream,
        mediaRecorderSupported,
        supportedMimes,
        readyForVideoExport: hasCaptureStream && supportedMimes.length > 0
      };
    });
    console.log("Video Export Capability:", videoExportResult);
    auditResults.videoExport = videoExportResult.readyForVideoExport;

    // ---------------------------------------------------------
    // 4. Active UI Backlog Checks
    // ---------------------------------------------------------
    console.log("\n--- 4. Active UI Backlog Checks ---");
    // Mobile Landscape Viewport (844x390)
    await client.setViewport(844, 390, true, 2);
    await wait(600);

    const ssMobileLandscape = path.join(ARTIFACT_DIR, "live_mobile_landscape.png");
    await client.captureScreenshot(ssMobileLandscape);

    const landscapeMetrics = await client.evaluate(() => {
      const upper = document.querySelector(".upper-deck");
      const scope = document.getElementById("scopePanel");
      const chord = document.getElementById("chordInfoPanel");
      const macroGrid = document.querySelector(".mobile-macro-grid");
      return {
        upperFlexDirection: upper ? getComputedStyle(upper).flexDirection : null,
        scopeWidth: scope ? scope.offsetWidth : 0,
        chordWidth: chord ? chord.offsetWidth : 0,
        macroGridColumns: macroGrid ? getComputedStyle(macroGrid).gridTemplateColumns.split(" ").length : 0
      };
    });
    console.log("Landscape Metrics:", landscapeMetrics);
    auditResults.landscapeLayout = landscapeMetrics.upperFlexDirection === "row" && landscapeMetrics.macroGridColumns === 3;

    // Desktop Fullscreen button
    await client.setViewport(1440, 900, false);
    const fsButtonCheck = await client.evaluate(() => {
      const btn = document.getElementById("btnAppFullscreen");
      return {
        buttonExists: !!btn,
        hasOnClick: typeof toggleAppFullscreen === "function"
      };
    });
    console.log("Desktop Fullscreen Button:", fsButtonCheck);
    auditResults.desktopFullscreenButton = fsButtonCheck.buttonExists && fsButtonCheck.hasOnClick;

    fs.writeFileSync(path.join(ARTIFACT_DIR, "live_audit_summary.json"), JSON.stringify(auditResults, null, 2));
    console.log("\n>>> LIVE CLOUDFLARE AUDIT COMPLETE: ALL CHECKS FINISHED <<<");

  } catch (err) {
    console.error("Audit failure:", err);
  } finally {
    if (client) {
      try { client.ws.close(); } catch (e) {}
    }
    chromeProcess.kill("SIGTERM");
  }
}

runAudit();
