// Slambient — Pocket Field Recorder Module
// Handles live mic sampling, drag-and-drop audio import, transient slicing, pitch tracking, and noise integration

/* ===== Phase 10: Pocket Field Recorder =====
   Live mic ("press & hold") or imported audio is trimmed, level-matched and
   analysed once, then woven into the NOISE module as: Ghost Phrases (whole
   phrase through delay + cathedral wash on bar turnarounds), a Scale Choir
   (a voiced chunk looped, retuned to the live chord tones) and Percussive
   Ghost Hits (consonant / click slices inside the drum groove). The mic is
   never routed to the speakers (no feedback): it only feeds a muted capture
   node and a level meter. */
(function () {
  'use strict';

  const MAX_REC_SEC = 8, TAP_REC_SEC = 5, MAX_IMPORT_SEC = 24;

  // <<ANALYSIS>>
  function fieldDetectPitch(x, rate) {
    const minLag = Math.floor(rate / 500);
    const maxLag = Math.min(Math.floor(rate / 70), x.length - 256);
    if (maxLag <= minLag + 4) return null;
    const N = x.length - maxLag;
    const r = new Float32Array(maxLag + 2);
    let best = 0;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0, sa = 0, sb = 0;
      for (let i = 0; i < N; i++) { const a = x[i], b = x[i + lag]; s += a * b; sa += a * a; sb += b * b; }
      const v = s / Math.sqrt(sa * sb + 1e-12);
      r[lag] = v;
      if (v > best) best = v;
    }
    if (best < 0.5) return null;
    // smallest lag that is a local maximum within 10% of the best (avoids octave-down picks)
    let pick = 0;
    for (let lag = minLag + 1; lag < maxLag; lag++) {
      if (r[lag] >= best * 0.9 && r[lag] >= r[lag - 1] && r[lag] >= r[lag + 1]) { pick = lag; break; }
    }
    if (!pick) return null;
    const a = r[pick - 1], b = r[pick], c = r[pick + 1];
    const denom = (a - 2 * b + c);
    const shift = Math.abs(denom) > 1e-9 ? 0.5 * (a - c) / denom : 0;
    return { freq: rate / (pick + shift), clarity: best };
  }

  function fieldAnalyze(mono, rate, name, maxSec) {
    const n = mono.length;
    if (n < rate * 0.20) return { error: "TOO SHORT" };
    const w = Math.max(8, Math.round(rate * 0.005));
    const nw = Math.floor(n / w);
    const env = new Float32Array(nw);
    let peakE = 0;
    for (let i = 0; i < nw; i++) {
      let s = 0; const o = i * w;
      for (let k = 0; k < w; k++) s += mono[o + k] * mono[o + k];
      env[i] = Math.sqrt(s / w);
      if (env[i] > peakE) peakE = env[i];
    }
    if (peakE < 0.0008) return { error: "TOO QUIET" };
    // 1. trim lead-in / trailing silence (if trimmed segment is short, gracefully use full take)
    const thr = Math.max(0.0008, peakE * 0.06);
    let s0 = 0; while (s0 < nw && env[s0] < thr) s0++;
    let e0 = nw - 1; while (e0 > s0 && env[e0] < thr) e0--;
    let a = Math.max(0, (s0 - 3) * w);
    let b = Math.min(n, (e0 + 1 + 20) * w);
    if (b - a < rate * 0.20) { a = 0; b = Math.min(n, Math.floor(maxSec * rate)); }
    let seg = Float32Array.from(mono.subarray(a, Math.min(b, a + Math.floor(maxSec * rate))));
    // 2. remove DC / rumble (one-pole high-pass ~40 Hz)
    const hpA = Math.exp(-2 * Math.PI * 40 / rate);
    let px = 0, py = 0;
    for (let i = 0; i < seg.length; i++) { const x = seg[i]; py = hpA * (py + x - px); px = x; seg[i] = py; }
    // 3. dynamic level-matching toward a fixed RMS, soft-limited
    let ss = 0, cnt = 0;
    for (let i = 0; i < seg.length; i++) { const v = seg[i]; if (Math.abs(v) > thr * 0.5) { ss += v * v; cnt++; } }
    const rms = Math.sqrt(ss / Math.max(1, cnt));
    const gain = Math.min(12, Math.max(0.2, 0.14 / Math.max(rms, 1e-4)));
    for (let i = 0; i < seg.length; i++) seg[i] = Math.tanh(seg[i] * gain * 1.1) * 0.9;
    const fin = Math.min(Math.round(rate * 0.006), seg.length >> 1);
    const fout = Math.min(Math.round(rate * 0.08), seg.length >> 1);
    for (let i = 0; i < fin; i++) seg[i] *= i / fin;
    for (let i = 0; i < fout; i++) seg[seg.length - 1 - i] *= i / fout;

    // 4. waveform thumbnail
    const bins = 160, peaks = new Float32Array(bins), per = seg.length / bins;
    for (let i = 0; i < bins; i++) {
      let m = 0; const st = Math.floor(i * per), en = Math.min(seg.length, Math.floor((i + 1) * per));
      for (let k = st; k < en; k++) { const v = Math.abs(seg[k]); if (v > m) m = v; }
      peaks[i] = m;
    }

    // 5. percussive slices (consonants, clicks, plosives)
    const hw = Math.max(8, Math.round(rate * 0.0015));
    const nh = Math.floor(seg.length / hw);
    const en = new Float32Array(nh);
    let maxE = 0;
    for (let i = 0; i < nh; i++) {
      let s = 0; const o = i * hw;
      for (let k = 0; k < hw; k++) s += seg[o + k] * seg[o + k];
      en[i] = s / hw; if (en[i] > maxE) maxE = en[i];
    }
    const minGap = rate * 0.09;
    let onsets = [], last = -1e9;
    for (let i = 6; i < nh; i++) {
      let mean = 0; for (let k = 1; k <= 6; k++) mean += en[i - k]; mean /= 6;
      if (en[i] > maxE * 0.12 && en[i] > mean * 3.2 + 1e-6 && (i - last) * hw > minGap) { onsets.push(i); last = i; }
    }
    if (onsets.length < 3) {
      const order = Array.from({ length: nh }, (_, i) => i).sort((p, q) => en[q] - en[p]);
      onsets = [];
      for (const i of order) {
        if (onsets.length >= 8) break;
        if (onsets.every(o => Math.abs(o - i) * hw > minGap)) onsets.push(i);
      }
    }
    const slices = [];
    const sliceLen = Math.round(rate * 0.075);
    onsets.slice(0, 12).forEach(i => {
      const st = Math.max(0, i * hw - Math.round(rate * 0.002));
      const sl = Float32Array.from(seg.subarray(st, Math.min(seg.length, st + sliceLen)));
      if (sl.length < rate * 0.02) return;
      let pk = 0; for (let k = 0; k < sl.length; k++) pk = Math.max(pk, Math.abs(sl[k]));
      const g = pk > 1e-4 ? 0.9 / pk : 1;
      const fo = Math.min(Math.round(rate * 0.025), sl.length >> 1);
      for (let k = 0; k < sl.length; k++) sl[k] *= g;
      for (let k = 0; k < fo; k++) sl[sl.length - 1 - k] *= k / fo;
      slices.push(sl);
    });

    // 6. choir loop: loudest voiced window, equal-power cross-faded into a seamless loop
    let L = Math.min(seg.length, Math.round(rate * 0.42));
    let bestSt = 0, bestScore = -1;
    const hop = Math.max(1, Math.round(rate * 0.05));
    for (let st = 0; st + L <= seg.length; st += hop) {
      let s = 0, zc = 0, prev = seg[st];
      for (let k = 0; k < L; k++) { const v = seg[st + k]; s += v * v; if ((v >= 0) !== (prev >= 0)) zc++; prev = v; }
      const zcPerSec = zc / (L / rate);
      const score = Math.sqrt(s / L) * (zcPerSec < 2800 ? 1 : 0.35);
      if (score > bestScore) { bestScore = score; bestSt = st; }
    }
    const chunk = seg.subarray(bestSt, bestSt + L);
    const xf = Math.round(L * 0.35), loopLen = L - xf;
    const loop = new Float32Array(loopLen);
    for (let i = 0; i < loopLen; i++) loop[i] = chunk[i];
    for (let i = 0; i < xf; i++) {
      const t = i / xf;
      loop[i] = chunk[i] * Math.sin(t * Math.PI / 2) + chunk[L - xf + i] * Math.cos(t * Math.PI / 2);
    }
    const sz = Math.min(chunk.length, rate > 60000 ? 4096 : 2048);
    const mid = Math.floor(chunk.length / 2);
    const pStart = Math.max(0, mid - (sz >> 1));
    const pitch = fieldDetectPitch(chunk.subarray(pStart, pStart + sz), rate);
    const refMidi = pitch ? 69 + 12 * Math.log2(pitch.freq / 440) : 55;

    return {
      phrase: seg, rate, name, dur: seg.length / rate, peaks, slices,
      loop, refMidi: Math.min(84, Math.max(36, refMidi)), pitched: !!pitch
    };
  }
  // <</ANALYSIS>>

  const S = {
    sample: null, mode: "ALL", level: 0.7,
    rec: null, holding: false,
    graph: null, graphCtx: null, bufs: null, bufsCtx: null,
    ghostUntil: 0, choirUntil: 0, fullUntil: 0, tmpCtx: null, statusTimer: 0
  };
  const $ = (id) => document.getElementById(id);
  const all = (sel) => Array.from(document.querySelectorAll(sel));
  const modeHas = (m) => S.mode === "ALL" || S.mode === m;
  const AC = window.AudioContext || window.webkitAudioContext;

  /* ---------- UI & Guidance ---------- */
  function showMicPermissionToast() {
    let t = document.getElementById("fieldMicToast");
    if (!t) {
      t = document.createElement("div");
      t.id = "fieldMicToast";
      t.className = "field-toast-notice";
      document.body.appendChild(t);
    }
    t.innerHTML = '<strong style="color:var(--color-drum, #ff6b6b); letter-spacing:0.8px;">MIC ACCESS BLOCKED</strong><div style="font-size:11px; margin-top:5px; opacity:0.9;">Please allow microphone permissions in your browser or device settings to sample audio into the workstation.</div>';
    t.classList.add("show");
    setTimeout(() => { if (t) t.classList.remove("show"); }, 5000);
  }

  function updateHoldButtonsState(statusText, isTapMode, isBlocked) {
    all("[data-field-hold]").forEach(btn => {
      const span = btn.querySelector("span");
      if (!span) return;
      if (!btn.dataset.defaultLabel) {
        btn.dataset.defaultLabel = span.textContent.trim();
      }
      if (isBlocked) {
        span.textContent = "BLOCKED";
        return;
      }
      if (!statusText) {
        span.textContent = btn.dataset.defaultLabel;
        return;
      }
      if (isTapMode) {
        const def = btn.dataset.defaultLabel.toUpperCase();
        span.textContent = (def === "SAMPLE" || def === "MIC" || def === "REC") ? "STOP" : "TAP TO STOP";
      } else {
        const def = btn.dataset.defaultLabel.toUpperCase();
        span.textContent = (def === "SAMPLE" || def === "MIC") ? "REC" : statusText;
      }
    });
  }

  function setStatus(txt) { all("[data-field-status]").forEach(el => { el.textContent = txt; }); }
  function flashStatus(txt) {
    setStatus(txt);
    clearTimeout(S.statusTimer);
    S.statusTimer = setTimeout(updateUI, 2600);
  }
  function drawWaves(live) {
    const color = (getComputedStyle(document.documentElement).getPropertyValue("--color-field") || "#2bcbba").trim();
    all("canvas[data-field-wave]").forEach(cv => {
      const c = cv.getContext("2d");
      if (!c) return;
      c.clearRect(0, 0, cv.width, cv.height);
      const src = live || (S.sample && S.sample.peaks);
      if (!src || !src.length) return;
      const barW = Math.max(2, Math.round(cv.width / 80));
      const nBars = Math.floor(cv.width / barW);
      c.fillStyle = color;
      for (let i = 0; i < nBars; i++) {
        const idx = live ? Math.max(0, src.length - nBars + i) : Math.floor(i * src.length / nBars);
        const v = Math.min(1, (src[idx] || 0) * 1.1);
        const h = Math.max(1, v * (cv.height - 4));
        c.globalAlpha = live ? 0.9 : 0.8;
        c.fillRect(i * barW, (cv.height - h) / 2, barW - 1, h);
      }
      c.globalAlpha = 1;
    });
  }
  function updateUI() {
    const has = !!S.sample, rec = !!(S.rec && S.rec.active);
    all("[data-field-hold]").forEach(el => el.classList.toggle("recording", rec));
    all(".field-badge").forEach(el => el.classList.toggle("is-recording", rec));
    all(".field-badge, .field-panel").forEach(el => el.classList.toggle("has-sample", has));
    all("[data-field-eject]").forEach(el => { el.disabled = !has; });
    drawWaves();
    if (!rec) {
      updateHoldButtonsState(null, false, false);
      setStatus(S.rec ? "MIC…" : has ? ("READY " + S.sample.dur.toFixed(1) + "s" + (S.sample.pitched ? "" : " · UNPITCHED")) : "EMPTY");
    }
  }

  /* ---------- Capture (press & hold / tap) ---------- */
  let captureCtx = null;
  function getCaptureContext() {
    if (!captureCtx || captureCtx.state === "closed") {
      captureCtx = new AC();
    }
    if (captureCtx.state === "suspended") {
      try { captureCtx.resume().catch(() => {}); } catch (_) {}
    }
    return captureCtx;
  }

  function teardownRec(rec) {
    if (!rec) return;
    try {
      if (rec.mediaRecorder && rec.mediaRecorder.state !== "inactive") {
        rec.mediaRecorder.ondataavailable = null;
        rec.mediaRecorder.onstop = null;
        rec.mediaRecorder.stop();
      }
    } catch (e) {}
    try { if (rec.proc) { rec.proc.onaudioprocess = null; rec.proc.disconnect(); } } catch (e) {}
    try { if (rec.src) rec.src.disconnect(); } catch (e) {}
    try { if (rec.mute) rec.mute.disconnect(); } catch (e) {}
    try { if (rec.analyser) rec.analyser.disconnect(); } catch (e) {}
    try { if (rec.stream) rec.stream.getTracks().forEach(t => t.stop()); } catch (e) {}
    try {
      if (navigator.audioSession) {
        navigator.audioSession.type = S.prevSession || "playback";
      }
    } catch (e) {}
    // Guard against iOS WebKit background audio muting after play-and-record release
    if (typeof audioCtx !== "undefined" && audioCtx && audioCtx.state === "suspended" && isPlaying) {
      try { audioCtx.resume().catch(() => {}); } catch (_) {}
    }
    clearTimeout(rec.tapTimer);
  }
  function setVU(v) { all(".field-badge, .field-panel, .mini-transport").forEach(el => el.style.setProperty("--field-vu", v.toFixed(3))); }

  function meterLoop() {
    const rec = S.rec;
    if (!rec || !rec.active) { setVU(0); return; }
    const buf = rec.meterBuf || (rec.meterBuf = new Float32Array(rec.analyser.fftSize));
    rec.analyser.getFloatTimeDomainData(buf);
    let pk = 0, s = 0;
    for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i]); if (v > pk) pk = v; s += v * v; }
    const lvl = Math.min(1, Math.sqrt(s / buf.length) * 5);
    rec.vu = Math.max(lvl, (rec.vu || 0) * 0.85);
    setVU(rec.vu);
    rec.live.push(Math.min(1, pk * 1.6));
    if (rec.live.length > 400) rec.live.shift();
    drawWaves(rec.live);
    const el = (performance.now() - rec.t0) / 1000;
    const txt = "REC " + el.toFixed(1) + "s";
    setStatus(txt);
    updateHoldButtonsState(txt, !!rec.tapTimer, false);
    requestAnimationFrame(meterLoop);
  }

  async function beginCapture() {
    if (S.rec) return;
    const rec = {
      active: false,
      chunks: [],
      mediaRecorder: null,
      recordedBlobs: [],
      len: 0,
      live: [],
      tapRequested: false,
      rate: 44100
    };
    S.rec = rec;
    updateUI();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !AC) {
      S.rec = null;
      updateUI();
      flashStatus("NO MIC (needs https)");
      return;
    }
    try {
      try {
        if (navigator.audioSession) {
          if (!S.prevSession) S.prevSession = navigator.audioSession.type || "playback";
          navigator.audioSession.type = "play-and-record";
        }
      } catch (e) {}

      // Synchronously pre-warm capture AudioContext
      const ctx = getCaptureContext();
      rec.ctx = ctx;
      if (ctx.state === "suspended") {
        await ctx.resume().catch(() => {});
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
        });
      } catch (e) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      if (S.rec !== rec) {
        stream.getTracks().forEach(t => t.stop());
        teardownRec(rec);
        return;
      }

      rec.stream = stream;
      rec.rate = ctx.sampleRate;
      rec.src = ctx.createMediaStreamSource(stream);
      rec.analyser = ctx.createAnalyser();
      rec.analyser.fftSize = 1024;
      rec.src.connect(rec.analyser);

      // Attempt modern MediaRecorder capture first (bypasses iOS 17+ ScriptProcessor thread throttling)
      let useMediaRecorder = false;
      if (typeof MediaRecorder !== "undefined") {
        try {
          let mimeType = "";
          const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/aac',
            'audio/ogg'
          ];
          for (const t of types) {
            if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
              mimeType = t;
              break;
            }
          }
          const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
          rec.mediaRecorder = mr;
          rec.recordedBlobs = [];
          mr.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) rec.recordedBlobs.push(e.data);
          };
          mr.start(100);
          useMediaRecorder = true;
        } catch (mrErr) {
          console.warn("[FieldRecorder] MediaRecorder init failed, falling back to ScriptProcessor:", mrErr);
          useMediaRecorder = false;
        }
      }

      if (!useMediaRecorder) {
        // Fallback pipeline: ScriptProcessorNode
        rec.proc = ctx.createScriptProcessor(4096, 1, 1);
        rec.mute = ctx.createGain();
        rec.mute.gain.setValueAtTime(0, ctx.currentTime);
        rec.mute.gain.value = 0; // keeps processor active without output

        rec.src.connect(rec.proc);
        rec.proc.connect(rec.mute);
        rec.mute.connect(ctx.destination);

        rec.proc.onaudioprocess = (ev) => {
          const out = ev.outputBuffer.getChannelData(0);
          out.fill(0);
          if (!rec.active) return;
          const d = ev.inputBuffer.getChannelData(0);
          rec.chunks.push(new Float32Array(d));
          rec.len += d.length;
          if (rec.len >= MAX_REC_SEC * rec.rate) finishCapture();
        };
      }

      rec.active = true;
      rec.t0 = performance.now();
      if (!S.holding || rec.tapRequested) enterTapMode(rec);
      updateUI();
      requestAnimationFrame(meterLoop);
    } catch (err) {
      teardownRec(rec);
      if (S.rec === rec) S.rec = null;
      updateUI();
      if (err && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        flashStatus("MIC PERMISSION BLOCKED");
        updateHoldButtonsState("BLOCKED", false, true);
        showMicPermissionToast();
      } else {
        flashStatus("NO MIC");
      }
    }
  }
  function enterTapMode(rec) {
    if (rec.tapTimer) return;
    const left = Math.max(300, TAP_REC_SEC * 1000 - (performance.now() - rec.t0));
    rec.tapTimer = setTimeout(finishCapture, left);
  }
  function finishCapture() {
    const rec = S.rec;
    if (!rec || !rec.active) return;
    rec.active = false;
    updateUI();

    const stamp = new Date();
    const sampleName = "MIC " + stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    if (rec.mediaRecorder && rec.mediaRecorder.state !== "inactive") {
      rec.mediaRecorder.onstop = async () => {
        try {
          const mime = rec.mediaRecorder.mimeType || 'audio/webm';
          const blob = new Blob(rec.recordedBlobs, { type: mime });
          const ab = await blob.arrayBuffer();
          const decodeCtx = rec.ctx || getCaptureContext();
          const audioBuf = await new Promise((res, rej) => {
            const p = decodeCtx.decodeAudioData(ab, res, rej);
            if (p && p.then) p.then(res, rej);
          });
          const nCh = audioBuf.numberOfChannels, len = audioBuf.length;
          const mono = new Float32Array(len);
          for (let c = 0; c < nCh; c++) {
            const d = audioBuf.getChannelData(c);
            for (let i = 0; i < len; i++) mono[i] += d[i] / nCh;
          }
          teardownRec(rec);
          if (S.rec === rec) { S.rec = null; setVU(0); updateUI(); }
          storeSample(fieldAnalyze(mono, audioBuf.sampleRate, sampleName, MAX_REC_SEC));
        } catch (decErr) {
          console.warn("[FieldRecorder] MediaRecorder decode failed, attempting PCM fallback:", decErr);
          teardownRec(rec);
          if (S.rec === rec) { S.rec = null; setVU(0); updateUI(); }
          if (rec.chunks && rec.chunks.length) {
            const data = new Float32Array(rec.len);
            let o = 0; rec.chunks.forEach(c => { data.set(c, o); o += c.length; });
            storeSample(fieldAnalyze(data, rec.rate, sampleName, MAX_REC_SEC));
          } else {
            flashStatus("RECORDING FAILED");
          }
        }
      };
      try {
        rec.mediaRecorder.stop();
      } catch (_) {}
    } else {
      const data = new Float32Array(rec.len);
      let o = 0; rec.chunks.forEach(c => { data.set(c, o); o += c.length; });
      const rate = rec.rate;
      teardownRec(rec);
      if (S.rec === rec) { S.rec = null; setVU(0); updateUI(); }
      storeSample(fieldAnalyze(data, rate, sampleName, MAX_REC_SEC));
    }
  }
  function cancelCapture() {
    const rec = S.rec; if (!rec) return;
    rec.active = false; teardownRec(rec); S.rec = null; setVU(0); updateUI();
  }

  function holdStart() {
    if (S.rec && S.rec.active) {
      finishCapture();
      return;
    }
    if (S.holding) return;
    S.holding = true;
    if (S.rec) return;
    getCaptureContext(); // Synchronous pre-warming inside user gesture event
    beginCapture();
  }
  function holdEnd() {
    if (!S.holding) return;
    S.holding = false;
    const rec = S.rec;
    if (!rec) return;
    if (!rec.active) { rec.tapRequested = true; return; }
    if (performance.now() - rec.t0 < 600) enterTapMode(rec); // quick tap: record a 5 s snippet
    else finishCapture();
  }

  /* ---------- Import / store / eject ---------- */
  function storeSample(res) {
    if (!res || res.error) { flashStatus(res && res.error ? res.error : "FAILED"); return; }
    S.sample = res; S.bufs = null;
    updateUI();
    if (typeof updateAudioParams === "function") { try { updateAudioParams(); } catch (e) {} }
    sync();
  }
  async function importFile(file) {
    if (!file) return;
    setStatus("LOADING…");
    try {
      const ab = await file.arrayBuffer();
      const ctx = ((typeof audioCtx !== "undefined" && audioCtx) || S.tmpCtx || (S.tmpCtx = new AC()));
      const buf = await new Promise((res, rej) => {
        const p = ctx.decodeAudioData(ab, res, rej);
        if (p && p.then) p.then(res, rej);
      });
      const nCh = buf.numberOfChannels, len = buf.length;
      const mono = new Float32Array(len);
      for (let c = 0; c < nCh; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) mono[i] += d[i] / nCh; }
      storeSample(fieldAnalyze(mono, buf.sampleRate, (file.name || "SAMPLE").replace(/\.[^.]+$/, "").slice(0, 18).toUpperCase(), MAX_IMPORT_SEC));
    } catch (e) {
      flashStatus("CAN'T DECODE");
    }
  }
  function eject() {
    if (S.rec) cancelCapture();
    S.sample = null; S.bufs = null;
    updateUI(); sync();
  }
  const isAudioFile = (f) => f && (/^audio\//.test(f.type) || /\.(wav|m4a|mp3|aac|ogg|oga|opus|flac|caf|aif|aiff|mp4)$/i.test(f.name || ""));

  /* ---------- Audio graph & voices ---------- */
  function makeIR(ctx, sec) {
    const len = Math.floor(ctx.sampleRate * sec);
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c); let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp += ((Math.random() * 2 - 1) - lp) * (0.55 - 0.4 * t); // darkens as it decays
        d[i] = lp * Math.pow(1 - t, 3.2);
      }
    }
    return ir;
  }
  function ensureGraph() {
    if (typeof audioCtx === "undefined" || !audioCtx) return null;
    if (S.graph && S.graphCtx === audioCtx) return S.graph;
    const c = audioCtx, g = {};
    g.bus = c.createGain(); g.bus.gain.value = 0.0001;
    if (typeof fieldAnalyser !== "undefined" && fieldAnalyser) {
      g.bus.connect(fieldAnalyser);
    } else if (typeof noiseAnalyser !== "undefined" && noiseAnalyser) {
      g.bus.connect(noiseAnalyser);
    }
    g.washIn = c.createGain();
    g.delay = c.createDelay(2.5); g.delay.delayTime.value = 0.45;
    g.fb = c.createGain(); g.fb.gain.value = 0.46;
    g.fbLP = c.createBiquadFilter(); g.fbLP.type = "lowpass"; g.fbLP.frequency.value = 2200;
    g.washOut = c.createGain(); g.washOut.gain.value = 0.6;
    g.washIn.connect(g.delay); g.delay.connect(g.fbLP); g.fbLP.connect(g.fb); g.fb.connect(g.delay);
    g.fbLP.connect(g.washOut); g.washOut.connect(g.bus);
    g.verbIn = c.createGain();
    g.conv = c.createConvolver(); g.conv.buffer = makeIR(c, 4.8);
    g.verbOut = c.createGain(); g.verbOut.gain.value = 0.7;
    g.verbIn.connect(g.conv); g.conv.connect(g.verbOut); g.verbOut.connect(g.bus);
    S.graph = g; S.graphCtx = c;
    return g;
  }
  function getBufs() {
    if (!S.sample || typeof audioCtx === "undefined" || !audioCtx) return null;
    if (S.bufs && S.bufsCtx === audioCtx) return S.bufs;
    const smp = S.sample, c = audioCtx;
    const mk = (data) => { const b = c.createBuffer(1, data.length, smp.rate); b.copyToChannel(data, 0); return b; };
    const rev = Float32Array.from(smp.phrase).reverse();
    S.bufs = { phrase: mk(smp.phrase), reversed: mk(rev), loop: mk(smp.loop), slices: smp.slices.map(mk) };
    S.bufsCtx = c;
    return S.bufs;
  }
  function route(node, g, o) {
    const c = audioCtx;
    const pan = c.createStereoPanner(); pan.pan.value = o.pan || 0; node.connect(pan);
    const sends = [];
    const send = (amt, dest) => {
      if (amt > 0) {
        const x = c.createGain(); x.gain.value = amt;
        pan.connect(x); x.connect(dest);
        sends.push(x);
      }
    };
    send(o.dry, g.bus); send(o.wash, g.washIn); send(o.verb, g.verbIn);
    return { pan, sends };
  }
  function cleanupLater(src, nodes) {
    src.onended = () => setTimeout(() => {
      try { src.disconnect(); } catch (e) {}
      const list = [];
      const collect = (item) => {
        if (!item) return;
        if (Array.isArray(item)) item.forEach(collect);
        else if (item.pan && item.sends) { collect(item.pan); collect(item.sends); }
        else if (typeof item.disconnect === "function" && !list.includes(item)) list.push(item);
      };
      collect(nodes);
      list.forEach(n => { try { n.disconnect(); } catch (e) {} });
    }, 300);
  }
  function sync() {
    const g = ensureGraph(); if (!g) return;
    const on = !!S.sample && S.mode !== "OFF" && isPlaying && isChannelAudible("field");
    g.bus.gain.setTargetAtTime(on ? S.level * 0.9 : 0.0001, audioCtx.currentTime, on ? 0.05 : 0.35);
  }

  function playGhost() {
    const g = ensureGraph(), b = getBufs(); if (!g || !b) return;
    const c = audioCtx, now = c.currentTime + 0.05;
    g.delay.delayTime.setTargetAtTime(Math.min(2.4, 60 / Math.max(40, bpm) * 0.75), now, 0.1);
    const rev = randFloat() < 0.2;
    const src = c.createBufferSource(); src.buffer = rev ? b.reversed : b.phrase;
    const rate = 0.86 + randFloat() * 0.12; src.playbackRate.value = rate;
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 120; hp.Q.value = 0.7;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3400; lp.Q.value = 0.7;
    const vg = c.createGain();
    const dur = src.buffer.duration / rate, peak = 0.42;
    vg.gain.setValueAtTime(0.0001, now);
    vg.gain.linearRampToValueAtTime(peak, now + Math.min(0.12, dur / 3));
    vg.gain.setValueAtTime(peak, now + Math.max(0.15, dur - 0.3));
    vg.gain.linearRampToValueAtTime(0.0001, now + dur);
    src.connect(hp); hp.connect(lp); lp.connect(vg);
    const r = route(vg, g, { dry: 0.35, wash: 0.85, verb: 0.9, pan: (randFloat() - 0.5) * 0.8 });
    cleanupLater(src, [hp, lp, vg, r]);
    S.ghostUntil = performance.now() + (dur + 4) * 1000;
    src.start(now);
  }

  function playFullSample(opts) {
    const g = ensureGraph(), b = getBufs(); if (!g || !b || !b.phrase) return;
    const c = audioCtx, now = c.currentTime + 0.04;

    // Tempo-synced delay timing for the effects wash
    const delayDiv = (randFloat() < 0.5) ? 0.75 : 0.5; // dotted-eighth or quarter note
    const delayTime = Math.min(2.4, (60 / Math.max(40, bpm)) * delayDiv);
    g.delay.delayTime.setTargetAtTime(delayTime, now, 0.08);

    const src = c.createBufferSource();
    src.buffer = b.phrase;

    // Natural playback rate (mostly 1.0 original speed; occasional subtle organic tape drift)
    const isSlow = randFloat() < 0.18;
    const drift = (opts && opts.force) ? 1.0 : (isSlow ? 0.94 : (randFloat() < 0.20 ? 1.03 : 1.0));
    const rate = (opts && typeof opts.rate === "number") ? opts.rate : drift;
    src.playbackRate.value = rate;

    // Studio conditioning: clean sub-rumble (<55Hz) and smooth highs (<13.5kHz) for warm tape fidelity
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 55; hp.Q.value = 0.7;
    const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 13500; lp.Q.value = 0.7;

    // Acoustic presence lift
    const presence = c.createBiquadFilter();
    presence.type = "peaking";
    presence.frequency.value = 2800;
    presence.Q.value = 1.0;
    presence.gain.value = 1.8;

    const vg = c.createGain();
    const dur = src.buffer.duration / rate;
    const peak = (opts && typeof opts.gain === "number") ? opts.gain : 0.54;

    // Full sample envelope: clean attack, sustained natural body, smooth tail
    vg.gain.setValueAtTime(0.0001, now);
    vg.gain.linearRampToValueAtTime(peak, now + 0.03);
    vg.gain.setValueAtTime(peak, now + Math.max(0.04, dur - 0.07));
    vg.gain.linearRampToValueAtTime(0.0001, now + dur);

    src.connect(hp); hp.connect(presence); presence.connect(lp); lp.connect(vg);

    // Dynamic spatial routing: clear direct presence with lush ambient delay wash & convolution reverb
    const panVal = (opts && typeof opts.pan === "number") ? opts.pan : (randFloat() - 0.5) * 0.5;
    const r = route(vg, g, {
      dry: 0.85,
      wash: 0.48,
      verb: 0.52,
      pan: panVal
    });

    cleanupLater(src, [hp, presence, lp, vg, r]);

    const durMs = dur * 1000;
    S.fullUntil = performance.now() + durMs + 1800;
    // Keep ghost phrase from colliding over the top of the full sample
    S.ghostUntil = Math.max(S.ghostUntil, performance.now() + durMs * 0.8);

    src.start(now);

    if (!S.rec) {
      flashStatus("FULL SAMPLE · FX");
    }
  }

  function choirNotes(ref) {
    let pcs = [];
    try { pcs = Array.from(recentChordNotes).map(m => ((m % 12) + 12) % 12); } catch (e) {}
    pcs = Array.from(new Set(pcs)).slice(0, 3);
    if (pcs.length < 2) { const r = ((rootNote % 12) + 12) % 12; pcs = [r, (r + 7) % 12, (r + 4) % 12]; }
    return pcs.map(pc => pc + 12 * Math.round((ref - pc) / 12));
  }
  function playChoir() {
    const g = ensureGraph(), b = getBufs(); if (!g || !b) return;
    const c = audioCtx, smp = S.sample, base = c.currentTime + 0.05;
    const dur = 7 + randFloat() * 3, rel = 3.2;
    choirNotes(smp.refMidi).forEach((target, i) => {
      const rate = Math.pow(2, (target - smp.refMidi) / 12);
      const t0 = base + i * 0.35;
      [-7, 7].forEach(cents => {
        const src = c.createBufferSource(); src.buffer = b.loop; src.loop = true;
        src.playbackRate.value = rate; src.detune.value = cents;
        const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 90;
        const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 2600; lp.Q.value = 0.5;
        const vg = c.createGain(), peak = 0.16 * (1 - i * 0.1);
        vg.gain.setValueAtTime(0.0001, t0);
        vg.gain.linearRampToValueAtTime(peak, t0 + 2.4);
        vg.gain.setValueAtTime(peak, t0 + dur);
        vg.gain.linearRampToValueAtTime(0.0001, t0 + dur + rel);
        src.connect(hp); hp.connect(lp); lp.connect(vg);
        const r = route(vg, g, { dry: 0.55, wash: 0.5, verb: 0.8, pan: (i - 1) * 0.45 + (cents > 0 ? 0.15 : -0.15) });
        cleanupLater(src, [hp, lp, vg, r]);
        src.start(t0); src.stop(t0 + dur + rel + 0.1);
      });
    });
    S.choirUntil = performance.now() + (dur + 3) * 1000;
  }

  function playTransient() {
    const g = ensureGraph(), b = getBufs(); if (!g || !b || !b.slices.length) return;
    const c = audioCtx, now = c.currentTime + 0.01;
    const src = c.createBufferSource(); src.buffer = b.slices[randRange(0, b.slices.length - 1)];
    src.playbackRate.value = 0.85 + randFloat() * 0.6;
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 350;
    const vg = c.createGain(); vg.gain.value = 0.22 + randFloat() * 0.14;
    src.connect(hp); hp.connect(vg);
    const r = route(vg, g, { dry: 1, wash: 0.25, verb: 0.2, pan: (randFloat() - 0.5) * 1.0 });
    cleanupLater(src, [hp, vg, r]);
    src.start(now);
  }

  window.fieldRecorderTick = function (measureTick, isDownbeat, ts) {
    if (!S.sample || S.mode === "OFF" || !isPlaying || !audioCtx) return;
    if (!isChannelAudible("field")) return;
    const tpb = (ts && ts.ticksPerBeat) || 4, nowMs = performance.now();
    const rate = (typeof noiseRateVal === "number") ? noiseRateVal : 0.45;
    if (isDownbeat) {
      // Chance for the ENTIRE sample to play back with effects added
      // in addition to being cut up and randomized
      const canPlayFull = (modeHas("ALL") || modeHas("GHOST")) &&
                          nowMs > (S.fullUntil || 0) &&
                          nowMs > S.ghostUntil;
      if (canPlayFull && (barCount % 4 === 0)) {
        const fullProb = 0.28 + rate * 0.35;
        if (randFloat() < fullProb) {
          playFullSample();
        }
      }

      if (modeHas("GHOST") && barCount % 4 === 3 && nowMs > S.ghostUntil && nowMs > (S.fullUntil || 0) && randFloat() < 0.22 + rate * 0.40) playGhost();
      if (modeHas("CHOIR") && barCount % 4 === 1 && nowMs > S.choirUntil && randFloat() < 0.35 + rate * 0.35) playChoir();
    }
    if (modeHas("TRANS") && typeof drumVol === "number" && drumVol > 0.02 && isChannelAudible("drum")) {
      const sub = measureTick % tpb;
      if (sub !== 0) {
        const p = (0.10 + drumDensity * 0.20) * (sub === 2 ? 1 : 0.4);
        if (randFloat() < p) playTransient();
      }
    }
  };
  window.fieldRecorderSync = sync;
  window.fieldModeChanged = function () {
    const el = $("selFieldMode"); if (el) S.mode = el.value;
    sync();
  };
  window.fieldLevelChanged = function () {
    const el = $("knobFieldVol"); if (!el) return;
    S.level = parseInt(el.value, 10) / 100;
    const lbl = $("lblFieldVol"); if (lbl) lbl.textContent = Math.round(S.level * 100) + "%";
    sync();
  };
  window.fieldPreview = function () {
    if (!S.sample) { flashStatus("RECORD OR DROP A SOUND"); return; }
    if (typeof audioCtx === "undefined" || !audioCtx) { flashStatus("PRESS START FIRST"); return; }
    const g = ensureGraph(); if (!g) return;
    g.bus.gain.setTargetAtTime(S.level * 0.9, audioCtx.currentTime, 0.02);
    playFullSample({ force: true });
  };
  window.fieldPlayFullSample = playFullSample;

  /* ---------- Wiring (delegated, covers phone floating bar, header, and module panels) ---------- */
  let activePointerId = null;
  let activeHoldBtn = null;

  document.addEventListener("pointerdown", (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    const btn = t.closest("[data-field-hold]");
    if (btn) {
      e.preventDefault();
      activeHoldBtn = btn;
      activePointerId = e.pointerId;
      try {
        if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
      } catch (_) {}
      holdStart();
    }
  }, true);

  const releasePointerHoldCapture = () => {
    if (activeHoldBtn && activePointerId !== null) {
      try {
        if (activeHoldBtn.releasePointerCapture) activeHoldBtn.releasePointerCapture(activePointerId);
      } catch (_) {}
      activeHoldBtn = null;
      activePointerId = null;
    }
  };

  document.addEventListener("pointerup", (e) => {
    releasePointerHoldCapture();
    holdEnd();
  }, true);

  document.addEventListener("pointercancel", (e) => {
    releasePointerHoldCapture();
    // Allow graceful transition to tap mode or finish without abrupt dropouts
    holdEnd();
  }, true);

  // Dedicated touch listeners with touch-action: none to guard iOS WebKit gesture jitter
  document.addEventListener("touchstart", (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest("[data-field-hold]")) {
      e.preventDefault();
      holdStart();
    }
  }, { passive: false });

  document.addEventListener("touchend", (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest("[data-field-hold]")) {
      e.preventDefault();
      holdEnd();
    }
  }, { passive: false });

  document.addEventListener("contextmenu", (e) => { if (e.target.closest && e.target.closest("[data-field-hold]")) e.preventDefault(); });
  document.addEventListener("click", (e) => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    if (t.closest("[data-field-hold]")) {
      if (e.detail === 0) { // Keyboard activation (Enter/Space)
        if (S.rec && S.rec.active) { finishCapture(); }
        else { S.holding = false; beginCapture(); }
      }
      return;
    }
    if (t.closest("[data-field-load]")) { const inp = $("inputFieldAudio"); if (inp) inp.click(); return; }
    if (t.closest("[data-field-eject]")) { eject(); return; }
  });
  document.addEventListener("change", (e) => {
    if (e.target && e.target.id === "inputFieldAudio") {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (f) importFile(f);
    }
  });
  // drag & drop an audio file anywhere on the page
  let dragDepth = 0;
  const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf("Files") !== -1;
  const setDrop = (on) => all(".field-badge, .field-panel").forEach(el => el.classList.toggle("drop-active", on));
  window.addEventListener("dragenter", (e) => { if (hasFiles(e)) { dragDepth++; setDrop(true); } });
  window.addEventListener("dragover", (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener("dragleave", (e) => { if (hasFiles(e) && --dragDepth <= 0) { dragDepth = 0; setDrop(false); } });
  window.addEventListener("drop", (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault(); dragDepth = 0; setDrop(false);
    const f = Array.from(e.dataTransfer.files || []).find(isAudioFile);
    if (f) importFile(f); else flashStatus("NOT AN AUDIO FILE");
  });
  window.addEventListener("blur", () => { if (S.holding) holdEnd(); });

  const fm = $("selFieldMode"); if (fm) S.mode = fm.value;
  const fv = $("knobFieldVol"); if (fv) S.level = parseInt(fv.value, 10) / 100;
  updateUI();
})();
