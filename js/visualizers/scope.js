// Slambient — Scope & Vector Oscilloscope Visualizer Module
// Handles CRT oscilloscope rings, flight grid, waterfall spectrogram, 3D roadside objects, fractal engine, and arcade mode

var scopeCanvas = typeof document !== "undefined" ? document.getElementById("scopeCanvas") : null;
var scopeCtx = scopeCanvas ? scopeCanvas.getContext("2d") : null;

let scopeAngle = 0;

// Slow group rotation for the stacked oscillator wheels, tied to tempo so
// faster music visibly spins faster. One full revolution takes a fixed
// number of beats, so the angular speed itself scales with bpm.
let scopeRotationAngle = 0;
let lastScopeFrameTs = null;
let lastScopeDomThrottleTs = 0;

let cachedScopeW = 0, cachedScopeH = 0, scopeNeedsResize = true;
let scopeCanvasVisible = true;
if (typeof IntersectionObserver !== "undefined" && scopeCanvas) {
  try {
    new IntersectionObserver((entries) => {
      if (entries[0]) scopeCanvasVisible = entries[0].isIntersecting;
    }, { threshold: 0.01 }).observe(scopeCanvas);
  } catch (err) {}
}
window.addEventListener("resize", () => {
  scopeNeedsResize = true;
  updateCanvasDimensions();
});
window.addEventListener("orientationchange", () => {
  scopeNeedsResize = true;
  updateCanvasDimensions();
});

function updateCanvasDimensions() {
  if (!scopeCanvas && typeof document !== "undefined") {
    scopeCanvas = document.getElementById("scopeCanvas");
    if (scopeCanvas) scopeCtx = scopeCanvas.getContext("2d");
  }
  if (!scopeCanvas || !scopeCtx) return { w: 460, h: 290, cx: 230, cy: 145 };

  // Cap DPR to 1.5 in fullscreen and on mobile phones so high-DPI mobile GPUs
  // aren't forced to fill 3x/9x pixel buffers with shadowBlur every frame.
  const rawDpr = window.devicePixelRatio || 1;
  const isPhone = typeof PHONE_LAYOUT_MQ !== "undefined" && PHONE_LAYOUT_MQ.matches;
  const isFullscreen = (typeof scopeFullscreen !== "undefined" && scopeFullscreen) ||
    (typeof document !== "undefined" && !!document.getElementById("scopePanel") && document.getElementById("scopePanel").classList.contains("module-fullscreen-active"));
  const dpr = (isFullscreen || isPhone) ? Math.min(1.5, rawDpr) : Math.min(2, rawDpr);
  const parent = scopeCanvas.parentElement;
  if (scopeNeedsResize || !cachedScopeW || !cachedScopeH) {
    const w = Math.round((parent && parent.clientWidth) || 460);
    const h = Math.round((parent && parent.clientHeight) || 290);
    if (Math.abs(w - cachedScopeW) > 1 || Math.abs(h - cachedScopeH) > 1 || scopeCanvas.width !== Math.round(w * dpr)) {
      cachedScopeW = w;
      cachedScopeH = h;
      scopeCanvas.width = Math.round(w * dpr);
      scopeCanvas.height = Math.round(h * dpr);
    }
    scopeNeedsResize = false;
  }
  scopeCtx.resetTransform();
  scopeCtx.scale(dpr, dpr);
  return { w: cachedScopeW, h: cachedScopeH, cx: cachedScopeW / 2, cy: cachedScopeH / 2 };
}

function resizeScopeCanvas() {
  scopeNeedsResize = true;
  return updateCanvasDimensions();
}
if (typeof window !== "undefined") {
  window.resizeScopeCanvas = resizeScopeCanvas;
  window.updateCanvasDimensions = updateCanvasDimensions;
}

const RING_CONFIGS = [
  { id: "drone", name: "SUB-DRONE", color: "#00e5ff", baseRadius: 46, baseLineWidth: 1.5, baseAlpha: 0.32, activeAlpha: 0.78, maxDisp: 8.5, smoothing: 0.78, fLow: 1, fHigh: 14, getAnalyser: () => droneAnalyser },
  { id: "drum", name: "DRUMS", color: "#ff3838", baseRadius: 70, baseLineWidth: 1.8, baseAlpha: 0.36, activeAlpha: 0.88, maxDisp: 16.5, smoothing: 0.58, fLow: 6, fHigh: 36, getAnalyser: () => drumAnalyser },
  { id: "chord", name: "CHORDS/LEAD", color: "#fed330", baseRadius: 96, baseLineWidth: 2.1, baseAlpha: 0.38, activeAlpha: 0.90, maxDisp: 19.5, smoothing: 0.64, fLow: 18, fHigh: 72, getAnalyser: () => chordAnalyser },
  { id: "arp_main", name: "SHIMMER ARP FUNDAMENTAL", color: "#8c6eff", baseRadius: 120, baseLineWidth: 2.5, baseAlpha: 0.42, activeAlpha: 0.92, maxDisp: 23.5, smoothing: 0.50, fLow: 38, fHigh: 110, getAnalyser: () => arpAnalyser },
  { id: "arp_shimmer", name: "SHIMMER ARP CRYSTALLINE", color: "#f5d0fe", baseRadius: 138, baseLineWidth: 1.9, baseAlpha: 0.38, activeAlpha: 0.90, maxDisp: 27.5, smoothing: 0.46, fLow: 70, fHigh: 160, getAnalyser: () => arpAnalyser }
];

const HALF_POINTS = 48;
const ringDynamics = {
  drone:       { offsets: new Float32Array(HALF_POINTS + 1), energy: 0, impulse: 0 },
  drum:        { offsets: new Float32Array(HALF_POINTS + 1), energy: 0, impulse: 0 },
  chord:       { offsets: new Float32Array(HALF_POINTS + 1), energy: 0, impulse: 0 },
  arp_main:    { offsets: new Float32Array(HALF_POINTS + 1), energy: 0, impulse: 0 },
  arp_shimmer: { offsets: new Float32Array(HALF_POINTS + 1), energy: 0, impulse: 0 }
};

const MATRIX_ROWS = 36;
const COLS_PER_TRACK = 4;
let matrixHistory = [];
let matrixLastSampleTime = 0;
let matrixTickCounter = 0;
let waterfallEnabled = true;

const chBufs = {
  drone: new Uint8Array(64),
  drum:  new Uint8Array(64),
  chord: new Uint8Array(64),
  arp:   new Uint8Array(64)
};

const WATERFALL_TRACKS = [
  { id: "drone", name: "SUB-DRONE",   color: "#00e5ff", rgb: [0, 229, 255], getAnalyser: () => droneAnalyser },
  { id: "drum",  name: "DRUMS",       color: "#ff3838", rgb: [255, 56, 56],  getAnalyser: () => drumAnalyser  },
  { id: "chord", name: "CHORDS/LEAD", color: "#fed330", rgb: [254, 211, 48], getAnalyser: () => chordAnalyser },
  { id: "arp",   name: "SHIMMER ARP", color: "#7d5fff", rgb: [125, 95, 255], getAnalyser: () => arpAnalyser   }
];

function toggleWaterfall() {
  waterfallEnabled = !waterfallEnabled;
  const btn = document.getElementById('btnToggleWaterfall');
  if (btn) btn.classList.toggle('active', waterfallEnabled);
}

function updateWaterfallSpectrogram() {
  if (!waterfallEnabled) return;
  const now = performance.now();
  const sampleInterval = isPlaying ? 45 : 150;
  if (now - matrixLastSampleTime < sampleInterval) return;
  matrixLastSampleTime = now;
  matrixTickCounter++;

  const rowSlice = [];

  WATERFALL_TRACKS.forEach((track, tIdx) => {
    const analyser = isPlaying ? track.getAnalyser() : null;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0;

    if (analyser) {
      const raw = chBufs[track.id];
      analyser.getByteFrequencyData(raw);

      b0 = (raw[1] + raw[2]) / (2 * 255);
      b1 = (raw[3] + raw[4] + raw[5]) / (3 * 255);
      b2 = (raw[7] + raw[8] + raw[9]) / (3 * 255);
      b3 = (raw[12] + raw[13] + raw[14]) / (3 * 255);

      let boost = 1.0;
      if (track.id === "drone") boost = 1.15;
      if (track.id === "drum")  boost = 1.45;
      if (track.id === "chord") boost = 1.35;
      if (track.id === "arp")   boost = 1.55;

      b0 = Math.min(1.0, b0 * boost);
      b1 = Math.min(1.0, b1 * boost);
      b2 = Math.min(1.0, b2 * boost);
      b3 = Math.min(1.0, b3 * boost);
    }

    const bins = [b0, b1, b2, b3];

    for (let c = 0; c < COLS_PER_TRACK; c++) {
      const audioVal = bins[c];
      const glyphHash = Math.sin(matrixTickCounter * 0.73 + tIdx * 17.1 + c * 31.7) * 43758.5453;
      const seedR = glyphHash - Math.floor(glyphHash);

      let activity = audioVal;
      let isLeader = false;

      if (audioVal > 0.08) {
        activity = Math.min(1.0, audioVal * 1.35);
        if (audioVal > 0.55 && seedR > 0.50) isLeader = true;
      } else if (isPlaying) {
        activity = (seedR > 0.62) ? (0.08 + (seedR - 0.62) * 0.35) : 0;
      } else {
        activity = (seedR > 0.80) ? (0.03 + (seedR - 0.80) * 0.12) : 0;
      }

      const segLength = (activity > 0.5) ? (2 + Math.floor(seedR * 2.5)) : (1 + (seedR > 0.75 ? 1 : 0));

      rowSlice.push({
        trackIdx: tIdx,
        colInTrack: c,
        activity: activity,
        isLeader: isLeader,
        lengthMult: segLength,
        active: activity > 0.02
      });
    }
  });

  matrixHistory.unshift(rowSlice);
  if (matrixHistory.length > MATRIX_ROWS) {
    matrixHistory.pop();
  }
}

function drawWaterfallSpectrogram(w, h) {
  if (!waterfallEnabled || matrixHistory.length === 0) return;

  scopeCtx.save();

  if (flightGridEnabled) {
    const horizonY = h * 0.58;
    scopeCtx.beginPath();
    scopeCtx.rect(0, 0, w, horizonY);
    scopeCtx.clip();
  }

  const rowStep = h / MATRIX_ROWS;
  const numTracks = WATERFALL_TRACKS.length;
  const totalCols = numTracks * COLS_PER_TRACK;
  const colWidth = w / totalCols;
  const laneW = w / numTracks;

  scopeCtx.strokeStyle = "rgba(255, 255, 255, 0.025)";
  scopeCtx.lineWidth = 0.5;
  scopeCtx.beginPath();
  for (let c = 1; c < totalCols; c++) {
    const lx = c * colWidth;
    scopeCtx.moveTo(lx, 0);
    scopeCtx.lineTo(lx, h);
  }
  scopeCtx.stroke();

  scopeCtx.strokeStyle = "rgba(255, 255, 255, 0.06)";
  scopeCtx.lineWidth = 0.75;
  scopeCtx.beginPath();
  for (let t = 1; t < numTracks; t++) {
    const tx = t * laneW;
    scopeCtx.moveTo(tx, 0);
    scopeCtx.lineTo(tx, h);
  }
  scopeCtx.stroke();

  scopeCtx.shadowBlur = 0;
  const idleDim = isPlaying ? 1.0 : 0.5;

  for (let r = 0; r < matrixHistory.length; r++) {
    const rowSlice = matrixHistory[r];
    const ageNorm = r / MATRIX_ROWS;
    const y = r * rowStep;

    const decayAlpha = Math.pow(1.0 - ageNorm, 1.25) * idleDim;
    if (decayAlpha < 0.01) continue;

    for (let i = 0; i < rowSlice.length; i++) {
      const cell = rowSlice[i];
      if (!cell.active) continue;

      const track = WATERFALL_TRACKS[cell.trackIdx];
      const rgb = track.rgb;
      const x = i * colWidth;

      const lineWidth = (cell.activity > 0.6) ? 3.0 : 2.0;
      const lineHeight = Math.max(2.5, rowStep * 0.72 * cell.lengthMult);

      const drawX = Math.round(x + (colWidth - lineWidth) * 0.5);
      const drawY = Math.round(y + (rowStep - lineHeight) * 0.5);

      if (cell.isLeader) {
        scopeCtx.fillStyle = `rgba(255, 255, 255, ${(decayAlpha * 0.95).toFixed(3)})`;
        scopeCtx.fillRect(drawX - 0.5, drawY, lineWidth + 1.0, 3.5);

        const bodyAlpha = decayAlpha * Math.min(1.0, 0.55 + cell.activity * 0.45);
        scopeCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${bodyAlpha.toFixed(3)})`;
        scopeCtx.fillRect(drawX, drawY + 3.5, lineWidth, Math.max(1, lineHeight - 3.5));
      } else {
        const alpha = decayAlpha * Math.min(1.0, 0.28 + cell.activity * 0.72);
        scopeCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
        scopeCtx.fillRect(drawX, drawY, lineWidth, lineHeight);
      }
    }
  }

  scopeCtx.restore();
}

let flightGridEnabled = true;
let oscilloscopeRingsEnabled = true;
let scopeFullscreen = false;
let flightGridScroll = 0;
let roadsideEnabled = true;

function toggleFlightGrid() {
  flightGridEnabled = !flightGridEnabled;
  const btn = document.getElementById('btnToggleFlightGrid');
  if (btn) btn.classList.toggle('active', flightGridEnabled);
}

function toggleOscilloscopeRings() {
  oscilloscopeRingsEnabled = !oscilloscopeRingsEnabled;
  const btn = document.getElementById('btnToggleRings');
  if (btn) btn.classList.toggle('active', oscilloscopeRingsEnabled);
}

function toggleRoadsideObjects() {
  roadsideEnabled = !roadsideEnabled;
  const btn = document.getElementById('btnToggleRoadside');
  if (btn) btn.classList.toggle('active', roadsideEnabled);
  if (!roadsideEnabled) roadsideObjects.length = 0;
}

/* ==========================================================================
   FRACTAL MODE (Phase 6)
   An endless Mandelbrot zoom that takes over the scope's background in place
   of the waterfall / flight grid / floating shapes (the oscilloscope rings
   still draw on top when enabled).
     - The camera dives continuously toward a point on the set's boundary,
       one decade of magnification every FRACTAL_BEATS_PER_DECADE beats, so
       the dive speed follows the tempo (a slow drift when stopped)
     - Plain 64-bit floats run out of precision around 1e-13, so each dive
       goes FRACTAL_DIVE_DECADES deep, then crossfades into a fresh dive from
       the top on the next target in FRACTAL_ZOOM_TARGETS. Every target is a
       boundary point checked to keep detail all the way down (no dead black
       interior or flat exterior at depth)
     - Iterations grow with depth (deeper = more needed to resolve detail),
       and the buffer resolution adapts to keep the frame cost bounded
     - Audio: drone energy and drum hits push the dive faster (a surge, not a
       pulse back and forth), chord energy rotates the palette, arp energy
       brightens the fine edges. Palette also cycles with depth, the classic
       zoom-video look
   ========================================================================== */
let fractalModeEnabled = false;
const FRACTAL_BEATS_PER_DECADE = 24;
const FRACTAL_DIVE_DECADES = 7.5;
const FRACTAL_START_SPAN = 3.2;
const FRACTAL_CROSSFADE_SEC = 2.2;
const FRACTAL_ZOOM_TARGETS = [
  [-0.7436438870371587, 0.131825904205312],   // Seahorse Valley Triple Spiral Hub (infinite swirling tendrils)
  [-0.7746806106269039, -0.1374168856037867], // Seahorse Valley Quad Cascade
  [0.3602404434376143, -0.6413130610648032],  // Elephant Valley Trunk Cascade
  [-0.10109636384562, 0.95628651080914],       // Scepter Valley Towers
  [-1.7497591451303665, 0.0]                   // Western Antenna Satellite Minibrot
];
const FRACTAL_MIN_BUFFER_W = 180;
const FRACTAL_MAX_BUFFER_W = 400;
const FRACTAL_FRAME_BUDGET_MS = 10;
const fractalBuf = document.createElement("canvas");
const fractalBufCtx = fractalBuf.getContext("2d");
const fractalFadeBuf = document.createElement("canvas");
const fractalFadeCtx = fractalFadeBuf.getContext("2d");
let fractalImage = null;
let fractalPixels = null;
let fractalBufferW = 280;
let fractalDepth = 0;          // decades of magnification into the current dive
let fractalTargetIdx = 0;
let fractalFade = 0;           // 1 -> 0 while the previous dive's last frame fades out
let fractalRot = 0;
let fractalFloorIter = 0;      // lowest escape count seen last frame (see lum below)
let fractalLastTs = null;
const fractalEnergy = { drone: 0, drum: 0, chord: 0, arp: 0, surge: 0 };
const fractalAnalyserBuf = new Uint8Array(32);

// 512-step high-definition cyclic palette with smooth Hermite interpolation,
// deep cosmic nebula undertones, and glowing instrument voice highlights.
const FRACTAL_PALETTE_SIZE = 512;
function buildFractalPalette() {
  const c = (k) => themeRgbArr(k);
  const darkCosmic = [10, 12, 20];
  const stops = [
    darkCosmic,
    c("drone"),
    [16, 26, 44],
    c("filter"),
    [32, 18, 50],
    c("chord"),
    [240, 246, 255], // Starlight highlight
    c("arp"),
    c("reverb"),
    [14, 16, 26],
    c("drum"),
    darkCosmic
  ];
  const lut = new Array(FRACTAL_PALETTE_SIZE);
  for (let i = 0; i < FRACTAL_PALETTE_SIZE; i++) {
    const t = (i / FRACTAL_PALETTE_SIZE) * (stops.length - 1);
    const k = Math.floor(t), f = t - k;
    const s = f * f * (3 - 2 * f); // Hermite smoothstep
    const a = stops[k], b = stops[Math.min(stops.length - 1, k + 1)];
    lut[i] = [
      Math.round(a[0] + (b[0] - a[0]) * s),
      Math.round(a[1] + (b[1] - a[1]) * s),
      Math.round(a[2] + (b[2] - a[2]) * s)
    ];
  }
  return lut;
}
let FRACTAL_PALETTE = null;

function toggleFractalMode() {
  fractalModeEnabled = !fractalModeEnabled;
  const btn = document.getElementById('btnToggleFractal');
  if (btn) btn.classList.toggle('active', fractalModeEnabled);
}

function readFractalBandEnergy(analyser) {
  if (!analyser || !isPlaying) return 0;
  const sampled = typeof sampleAnalyserForFrame === "function" ? sampleAnalyserForFrame(analyser) : null;
  const buf = sampled ? sampled.freq : null;
  if (!buf) {
    analyser.getByteFrequencyData(fractalAnalyserBuf);
    let sum = 0;
    for (let i = 1; i < 24; i++) sum += fractalAnalyserBuf[i];
    return Math.min(1, (sum / 23) / 160);
  }
  let sum = 0;
  const limit = Math.min(24, buf.length);
  for (let i = 1; i < limit; i++) sum += buf[i];
  return Math.min(1, (sum / Math.max(1, limit - 1)) / 160);
}

function updateFractalEnergy(dtSec) {
  const targets = {
    drone: readFractalBandEnergy(typeof droneAnalyser !== "undefined" ? droneAnalyser : null),
    drum:  readFractalBandEnergy(typeof drumAnalyser  !== "undefined" ? drumAnalyser  : null),
    chord: readFractalBandEnergy(typeof chordAnalyser !== "undefined" ? chordAnalyser : null),
    arp:   readFractalBandEnergy(typeof arpAnalyser   !== "undefined" ? arpAnalyser   : null)
  };
  const smooth = (key, rate) => {
    fractalEnergy[key] += (targets[key] - fractalEnergy[key]) * Math.min(1, dtSec * rate);
  };
  // A drum level jump well above its running average reads as a hit.
  if (targets.drum > fractalEnergy.drum + 0.18) {
    fractalEnergy.surge = Math.min(1, fractalEnergy.surge + 0.5);
  }
  smooth("drone", 2.5);
  smooth("drum", 9);
  smooth("chord", 3);
  smooth("arp", 6);
  fractalEnergy.surge *= Math.exp(-dtSec * 3);
}

function drawFractalVisualizer(w, h, ts) {
  if (fractalLastTs === null) fractalLastTs = ts;
  const dtSec = Math.max(0, Math.min(0.1, (ts - fractalLastTs) / 1000));
  fractalLastTs = ts;
  updateFractalEnergy(dtSec);
  const e = fractalEnergy;

  // Dive speed: tempo-locked, pushed forward by drone level and drum surges.
  const beatsPerSec = (typeof bpm !== "undefined" ? bpm : 72) / 60;
  const drive = isPlaying ? (0.75 + e.drone * 0.5 + e.surge * 1.4) : 0.15;
  fractalDepth += dtSec * beatsPerSec / FRACTAL_BEATS_PER_DECADE * drive;
  fractalRot += dtSec * beatsPerSec * 0.004 * (isPlaying ? 1 : 0.2);

  // Buffer size follows the canvas, capped by the adaptive frame budget.
  const bw = Math.max(FRACTAL_MIN_BUFFER_W, Math.min(fractalBufferW, Math.round(w / 2)));
  const bh = Math.max(70, Math.round(bw * h / w));

  // Infinite unbroken flow: seamlessly capture the dive horizon and recycle magnification
  if (fractalDepth >= FRACTAL_DIVE_DECADES) {
    if (fractalBuf.width > 0) {
      fractalFadeBuf.width = fractalBuf.width;
      fractalFadeBuf.height = fractalBuf.height;
      fractalFadeCtx.drawImage(fractalBuf, 0, 0);
      fractalFade = 1.0;
    }
    fractalDepth = 0.35; // Seamless loop entry point
    fractalTargetIdx = (fractalTargetIdx + 1) % FRACTAL_ZOOM_TARGETS.length;
  }

  if (fractalBuf.width !== bw || fractalBuf.height !== bh) {
    fractalBuf.width = bw;
    fractalBuf.height = bh;
    fractalImage = fractalBufCtx.createImageData(bw, bh);
    fractalPixels = new Uint32Array(fractalImage.data.buffer);
  }

  // Smooth Hermite coordinate trajectory towards next target as depth nears handoff
  const currTarget = FRACTAL_ZOOM_TARGETS[fractalTargetIdx];
  const nextTarget = FRACTAL_ZOOM_TARGETS[(fractalTargetIdx + 1) % FRACTAL_ZOOM_TARGETS.length];
  const blendWindow = 1.8;
  const blendStart = FRACTAL_DIVE_DECADES - blendWindow;
  let tx = currTarget[0], ty = currTarget[1];
  if (fractalDepth > blendStart) {
    const rawT = (fractalDepth - blendStart) / blendWindow;
    const s = rawT * rawT * (3 - 2 * rawT); // Hermite smoothstep
    tx = currTarget[0] * (1 - s) + nextTarget[0] * s;
    ty = currTarget[1] * (1 - s) + nextTarget[1] * s;
  }
  const spanY = FRACTAL_START_SPAN * Math.pow(10, -fractalDepth);
  const spanX = spanY * (bw / bh);
  const cosR = Math.cos(fractalRot), sinR = Math.sin(fractalRot);
  const maxIter = Math.round(135 + fractalDepth * 52);
  const hueShift = fractalDepth * 52 + e.chord * 110;
  const gain = (isPlaying ? 0.85 : 0.65) + e.arp * 0.45;
  const LOG2 = Math.log(2);
  if (!FRACTAL_PALETTE) FRACTAL_PALETTE = buildFractalPalette();
  const palMask = FRACTAL_PALETTE_SIZE - 1;
  const t0 = performance.now();
  const floorIter = fractalFloorIter;
  let frameMinIter = Infinity;

  for (let py = 0; py < bh; py++) {
    const v = (py / bh - 0.5) * spanY;
    for (let px = 0; px < bw; px++) {
      const u = (px / bw - 0.5) * spanX;
      const cr = tx + u * cosR - v * sinR;
      const ci = ty + u * sinR + v * cosR;

      let i = 0, zr = 0, zi = 0, zr2 = 0, zi2 = 0;

      // Fast-skip main cardioid and period-2 bulb at shallow depth
      if (fractalDepth < 1.4) {
        const q = (cr - 0.25) * (cr - 0.25) + ci * ci;
        if (q * (q + (cr - 0.25)) < 0.25 * ci * ci || (cr + 1) * (cr + 1) + ci * ci < 0.0625) {
          i = maxIter;
        }
      }

      if (i < maxIter) {
        while (zr2 + zi2 < 64 && i < maxIter) {
          zi = 2 * zr * zi + ci;
          zr = zr2 - zi2 + cr;
          zr2 = zr * zr;
          zi2 = zi * zi;
          i++;
        }
      }

      let r, g, b;
      if (i >= maxIter) {
        // Deep breathing iridescent core inside the set, pulsed by drone & drum
        const coreBreath = Math.sin(fractalDepth * 1.8 + (ts || 0) * 0.0016) * 0.5 + 0.5;
        r = Math.min(255, Math.round(8 + coreBreath * 10 + e.drum * 18));
        g = Math.min(255, Math.round(10 + coreBreath * 14 + e.drone * 24));
        b = Math.min(255, Math.round(18 + coreBreath * 28 + e.chord * 28));
      } else {
        // Continuous smooth normalized iteration count
        const smoothIter = i + 1 - Math.log(Math.log(zr2 + zi2) / 2 / LOG2) / LOG2;
        if (smoothIter < frameMinIter) frameMinIter = smoothIter;

        // Multi-frequency harmonic color indexing
        const palIdx = Math.floor(smoothIter * 11 + hueShift) & palMask;
        const col = FRACTAL_PALETTE[palIdx];

        // Micro-filament edge waves: reveals razor-sharp dendritic filaments
        const filament = 0.5 + 0.5 * Math.sin(smoothIter * 0.75 + hueShift * 0.03);
        const shimmer = Math.pow(Math.max(0, Math.sin(smoothIter * 2.8 + (e.drum * 2.0))), 3) * (0.15 + e.arp * 0.7);

        // Adaptive luminosity with smooth outer-space nebula floor
        const iterDiff = Math.max(0, smoothIter - floorIter);
        const boundaryGlow = Math.min(1.0, Math.pow(iterDiff / 32, 0.65));
        const lum = (0.28 + 0.72 * boundaryGlow) * gain;

        r = Math.min(255, Math.round((col[0] * lum * (0.85 + filament * 0.25)) + shimmer * 180));
        g = Math.min(255, Math.round((col[1] * lum * (0.85 + filament * 0.25)) + shimmer * 210));
        b = Math.min(255, Math.round((col[2] * lum * (0.85 + filament * 0.25)) + shimmer * 255));
      }

      fractalPixels[py * bw + px] = (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255);
    }
  }
  fractalBufCtx.putImageData(fractalImage, 0, 0);

  // Ease toward the new floor so a crossfade or surge doesn't flicker.
  if (frameMinIter !== Infinity) fractalFloorIter += (frameMinIter - fractalFloorIter) * (fractalDepth < 0.05 ? 1 : 0.2);

  // Adapt resolution to the frame budget (deeper = more iterations).
  const cost = performance.now() - t0;
  if (cost > FRACTAL_FRAME_BUDGET_MS) fractalBufferW = Math.max(FRACTAL_MIN_BUFFER_W, Math.round(fractalBufferW * 0.88));
  else if (cost < FRACTAL_FRAME_BUDGET_MS * 0.55 && fractalBufferW < FRACTAL_MAX_BUFFER_W) fractalBufferW = Math.min(FRACTAL_MAX_BUFFER_W, fractalBufferW + 6);

  scopeCtx.save();
  scopeCtx.imageSmoothingEnabled = true;
  scopeCtx.imageSmoothingQuality = "high";
  scopeCtx.drawImage(fractalBuf, 0, 0, w, h);
  if (fractalFade > 0) {
    // The old dive's last frame keeps zooming as it fades, so the handoff
    // reads as one continuous plunge rather than a cut.
    const grow = 1 + (1 - fractalFade) * 1.5;
    scopeCtx.globalAlpha = fractalFade;
    scopeCtx.drawImage(fractalFadeBuf, w / 2 - (w * grow) / 2, h / 2 - (h * grow) / 2, w * grow, h * grow);
    fractalFade = Math.max(0, fractalFade - dtSec / FRACTAL_CROSSFADE_SEC);
  }
  scopeCtx.restore();
}

/* ==========================================================================
   ARCADE: VOID RAIDERS (Phase 6 easter egg, reworked Phase 7)
   Arcade shooter played inside the visualizer canvas while the music keeps
   going. Launched from the arcade button in the visualizer toolbar.
   Every wave is different:
     - A new formation shape each wave (block, chevron, diamond, checker,
       twin towers, staggered, ring), widening/deepening as waves climb
     - Enemy types are mixed through the formation instead of one type per
       row. Each type is one instrument and behaves like it:
         drone (cyan)   armored, takes 2 hits, slow heavy shots
         drum  (red)    divers: break formation and swoop at you, then
                        loop back to their slot (drum hits trigger dives)
         chord (amber)  fire a 3-way spread
         arp   (violet) fire fast shots aimed at you
     - A mothership (pink saucer) crosses the top now and then for bonus
       points and plays a little arpeggio when hit
     - The formation sways and marches one step per beat (8ths once half are
       gone, 16ths near the end), glows with each instrument's live energy
       (shared with Fractal Mode via updateFractalEnergy()), and a louder
       instrument's invaders fire and dive more
     - Hits play scale-locked blips in that instrument's register, routed
       into masterBusPre so they pick up the pedal chain's delay/reverb
   Controls: ← / → move, Space fire/start, Esc quit (Enter stays the global
   play/pause key, see bindGlobalTransportKeys). Touch or mouse: press on the
   canvas to steer toward the pointer and fire. Only the game's own keys are
   captured; QWERTY note keys still play the keyboard.
   ========================================================================== */
let arcadeActive = false;
let arcade = null;

const ARCADE_TYPES = {
  drone: { rgb: [0, 229, 255],  octave: 3, points: 30, sprite: 2, hp: 2, weight: 2 },
  drum:  { rgb: [255, 56, 56],  octave: 4, points: 25, sprite: 1, hp: 1, weight: 3 },
  chord: { rgb: [254, 211, 48], octave: 5, points: 20, sprite: 3, hp: 1, weight: 3 },
  arp:   { rgb: [125, 95, 255], octave: 6, points: 20, sprite: 0, hp: 1, weight: 3 }
};
const ARCADE_TYPE_KEYS = Object.keys(ARCADE_TYPES);
const ARCADE_UFO_RGB = [255, 95, 196];

// Formation patterns: given rows x cols, return true where a slot is filled.
const ARCADE_FORMATIONS = [
  { name: "BLOCK",   rows: 4, cols: 8,  fill: () => true },
  { name: "CHEVRON", rows: 5, cols: 9,  fill: (r, c, R, C) => Math.abs(c - (C - 1) / 2) >= (R - 1 - r) * 0.9 - 0.1 && Math.abs(c - (C - 1) / 2) <= (R - 1 - r) * 0.9 + 1.6 },
  { name: "DIAMOND", rows: 5, cols: 9,  fill: (r, c, R, C) => Math.abs(c - (C - 1) / 2) + Math.abs(r - (R - 1) / 2) * 1.8 <= 4.2 },
  { name: "CHECKER", rows: 5, cols: 10, fill: (r, c) => (r + c) % 2 === 0 },
  { name: "TOWERS",  rows: 5, cols: 10, fill: (r, c) => c <= 2 || c >= 7 || (r === 0 && c % 2 === 1) },
  { name: "STAGGER", rows: 4, cols: 10, fill: (r, c) => r % 2 === 0 ? c % 2 === 0 : c % 2 === 1 || c === 9 },
  { name: "RING",    rows: 5, cols: 9,  fill: (r, c, R, C) => { const d = Math.hypot((c - (C - 1) / 2) / 1.6, r - (R - 1) / 2); return d > 1.15 && d < 2.9; } }
];

// 11x8 sprites, two animation frames each ("1" = lit pixel).
const ARCADE_SPRITES = [
  [["00001100000", "00011110000", "00111111000", "01101101100", "01111111100", "00010010000", "00101101000", "01010010100"],
   ["00001100000", "00011110000", "00111111000", "01101101100", "01111111100", "00101101000", "01000000100", "00100001000"]],
  [["00100000100", "00010001000", "00111111100", "01101110110", "11111111111", "10111111101", "10100000101", "00011011000"],
   ["00100000100", "10010001001", "10111111101", "11101110111", "11111111111", "01111111110", "00100000100", "01000000010"]],
  [["00011111000", "01111111110", "11111111111", "11100100111", "11111111111", "00110001100", "01101110110", "11000000011"],
   ["00011111000", "01111111110", "11111111111", "11100100111", "11111111111", "00111011100", "01100000110", "00110001100"]],
  [["00000100000", "00001110000", "00011111000", "00110101100", "01111111110", "00101110100", "01000100010", "00100000100"],
   ["00000100000", "00001110000", "00011111000", "00110101100", "01111111110", "00101110100", "00100100100", "01000000010"]]
];
const ARCADE_UFO_SPRITE = ["0000111110000", "0011111111100", "0111111111110", "1101101101101", "1111111111111", "0011100011100", "0001000001000"];
const ARCADE_PLAYER_SPRITE = ["00000100000", "00001110000", "00001110000", "01111111110", "11111111111", "11111111111", "11111111111"];

var arcadeCanvas = document.getElementById("arcadeCanvas");
var arcadeCtx = arcadeCanvas ? arcadeCanvas.getContext("2d") : null;
let arcadeRafId = null;

function updateArcadeCanvasDimensions() {
  if (!arcadeCanvas) {
    arcadeCanvas = document.getElementById("arcadeCanvas");
    if (arcadeCanvas) arcadeCtx = arcadeCanvas.getContext("2d");
  }
  if (!arcadeCanvas || !arcadeCtx) return { w: 460, h: 290 };
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = arcadeCanvas.getBoundingClientRect();
  const w = Math.max(260, Math.floor(rect.width || 420));
  const h = Math.max(160, Math.floor(rect.height || (w * 0.62)));
  const targetW = Math.floor(w * dpr);
  const targetH = Math.floor(h * dpr);
  if (arcadeCanvas.width !== targetW || arcadeCanvas.height !== targetH) {
    arcadeCanvas.width = targetW;
    arcadeCanvas.height = targetH;
  }
  arcadeCtx.resetTransform();
  arcadeCtx.scale(dpr, dpr);
  return { w, h };
}

function updateArcadeHeaderHUD() {
  if (!arcade) return;
  const scoreEl = document.getElementById("arcadeHeaderScore");
  if (scoreEl) {
    scoreEl.textContent = `SCORE ${String(arcade.score).padStart(5, "0")} · W${arcade.wave} · ${"▲".repeat(Math.max(0, arcade.lives))}`;
  }
}

function runArcadeLoop(ts) {
  if (!arcadeActive) {
    arcadeRafId = null;
    return;
  }
  const { w, h } = updateArcadeCanvasDimensions();
  if (arcadeCtx) {
    drawArcadeGame(w, h, ts || performance.now(), arcadeCtx);
    syncArcadePad();
    updateArcadeHeaderHUD();
  }
  arcadeRafId = requestAnimationFrame(runArcadeLoop);
}

function toggleArcadeGame(forceState) {
  arcadeActive = (typeof forceState === "boolean") ? forceState : !arcadeActive;
  if (arcadeActive) ensureAudioReady();
  const btn = document.getElementById("btnToggleArcade");
  if (btn) {
    btn.classList.toggle("active", arcadeActive);
    btn.blur();
  }
  const panel = document.getElementById("arcadePanel");
  if (panel) {
    panel.classList.toggle("hidden-module", !arcadeActive);
    panel.classList.toggle("module-hidden-in-dock", !arcadeActive);
    panel.style.display = arcadeActive ? "" : "none";
  }
  arcade = arcadeActive ? (arcade || newArcadeState()) : null;
  if (arcadeActive) {
    if (!arcadeRafId) arcadeRafId = requestAnimationFrame(runArcadeLoop);
  } else {
    if (arcadeRafId) { cancelAnimationFrame(arcadeRafId); arcadeRafId = null; }
  }
}

function toggleArcadePanel(show) {
  toggleArcadeGame(show);
}

function resetArcadeGame() {
  ensureAudioReady();
  const hi = arcade ? Math.max(arcade.hiScore, arcade.score) : 0;
  arcade = Object.assign(newArcadeState(), { hiScore: hi, phase: "playing" });
  arcadeSpawnWave(arcade, performance.now());
  if (!arcadeActive) toggleArcadeGame(true);
}

function toggleArcadeFullscreen() {
  const panel = document.getElementById("arcadePanel");
  if (!panel) return;
  const isFs = panel.classList.toggle("module-fullscreen-active");
  document.body.classList.toggle("module-focus-open", isFs);
  if (typeof triggerCanvasResizes === "function") triggerCanvasResizes();
}

function newArcadeState() {
  return {
    phase: "title",           // title | playing | dying | gameover | cleared
    score: 0,
    hiScore: arcade ? arcade.hiScore : 0,
    lives: 3,
    wave: 1,
    keys: { left: false, right: false },
    pointerX: null,
    playerX: 0.5,              // 0..1 across the canvas
    invaders: [],
    formation: null,
    lastFormationIdx: -1,
    cols: 8,
    formX: 0, formY: 0, dir: 1,
    lastStepTs: 0,
    frame: 0,
    shot: null,                // player's bullet (one at a time, classic rules)
    enemyShots: [],
    sparks: [],
    ufo: null,
    nextUfoTs: 0,
    invulnUntil: 0,
    phaseUntil: 0,
    bannerUntil: 0,
    lastTs: null
  };
}

function arcadePickType() {
  const total = ARCADE_TYPE_KEYS.reduce((n, k) => n + ARCADE_TYPES[k].weight, 0);
  let r = Math.random() * total;
  for (const k of ARCADE_TYPE_KEYS) { r -= ARCADE_TYPES[k].weight; if (r < 0) return k; }
  return "arp";
}

function arcadeSpawnWave(g, ts) {
  // Wave 1 is always the classic block; after that, a random formation that
  // isn't a repeat of the last one.
  let idx = 0;
  if (g.wave > 1) {
    do { idx = 1 + Math.floor(Math.random() * (ARCADE_FORMATIONS.length - 1)); } while (idx === g.lastFormationIdx);
  }
  g.lastFormationIdx = idx;
  const f = ARCADE_FORMATIONS[idx];
  g.formation = f.name;
  g.cols = f.cols;
  g.invaders = [];
  for (let r = 0; r < f.rows; r++) {
    for (let c = 0; c < f.cols; c++) {
      if (!f.fill(r, c, f.rows, f.cols)) continue;
      const type = arcadePickType();
      g.invaders.push({ r, c, type, hp: ARCADE_TYPES[type].hp, alive: true, hitFlash: 0, dive: null, phase: Math.random() * Math.PI * 2 });
    }
  }
  g.formX = 0;
  g.formY = Math.min(3, Math.floor((g.wave - 1) / 2)); // later waves start lower, in row-drop units
  g.dir = Math.random() < 0.5 ? 1 : -1;
  g.shot = null;
  g.enemyShots = [];
  g.ufo = null;
  g.nextUfoTs = (ts || performance.now()) + 9000 + Math.random() * 12000;
  g.bannerUntil = (ts || performance.now()) + 1600;
}

function arcadeBlip(midi, type, dur, peak) {
  if (!audioCtx || !masterBusPre) return;
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(440 * Math.pow(2, (midi - 69) / 12), t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g); g.connect(masterBusPre);
  osc.start(t); osc.stop(t + dur + 0.02);
}

function arcadeScaleMidi(octave, degree) {
  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  const len = scale.length;
  return 12 * (octave + 1) + rootNote + scale[((degree % len) + len) % len] + 12 * Math.floor(degree / len);
}

function arcadeLayout(w, h, cols) {
  const px = Math.max(2, Math.floor(Math.min(w / 165, h / 100)));
  const cellW = 15 * px, cellH = 11 * px;
  const gridW = (cols || 8) * cellW;
  const left = (w - gridW) / 2;
  const top = 34 + px * 6;
  return { px, cellW, cellH, gridW, left, top, rowDrop: cellH * 0.5, playerY: h - 14 * px, stepPx: px * 2 };
}

function arcadeDrawSprite(rows, x, y, px, rgb, alpha, targetCtx) {
  const ctx = targetCtx || arcadeCtx || scopeCtx;
  if (!ctx) return;
  ctx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha.toFixed(3)})`;
  for (let j = 0; j < rows.length; j++) {
    const line = rows[j];
    for (let i = 0; i < line.length; i++) {
      if (line.charCodeAt(i) === 49) ctx.fillRect(x + i * px, y + j * px, px, px);
    }
  }
}

// Where an invader's slot in the formation is right now (with sway).
function arcadeSlotPos(g, inv, L, ts) {
  const sway = Math.sin(ts / 900 + inv.c * 0.55) * L.px * 1.5;
  return {
    x: L.left + g.formX + inv.c * L.cellW + 2 * L.px,
    y: L.top + g.formY * L.rowDrop + inv.r * L.cellH + sway
  };
}

// Actual on-screen position: the slot, or its dive path if diving.
function arcadeInvaderPos(g, inv, L, ts) {
  const slot = arcadeSlotPos(g, inv, L, ts);
  if (!inv.dive) return slot;
  return { x: inv.dive.x, y: inv.dive.y };
}

function arcadeHandleFire(g) {
  if (g.phase === "title" || g.phase === "gameover") {
    const hi = Math.max(g.hiScore, g.score);
    Object.assign(g, newArcadeState(), { hiScore: hi, phase: "playing" });
    arcadeSpawnWave(g, performance.now());
    return;
  }
  if (g.phase === "playing" && !g.shot) {
    g.shot = { x: g.playerX, y: null };
    arcadeBlip(arcadeScaleMidi(5, 4), "triangle", 0.09, 0.05);
  }
}

window.addEventListener("keydown", (e) => {
  if (!arcadeActive || !arcade) return;
  const tag = e.target.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  let handled = true;
  if (e.key === "ArrowLeft") arcade.keys.left = true;
  else if (e.key === "ArrowRight") arcade.keys.right = true;
  else if (e.code === "Space") { if (!e.repeat) arcadeHandleFire(arcade); }
  else if (e.key === "Escape") toggleArcadeGame(false);
  else handled = false;
  if (handled) { e.preventDefault(); e.stopImmediatePropagation(); }
}, { capture: true });

window.addEventListener("keyup", (e) => {
  if (!arcadeActive || !arcade) return;
  if (e.key === "ArrowLeft") arcade.keys.left = false;
  else if (e.key === "ArrowRight") arcade.keys.right = false;
  else if (e.code !== "Space") return;
  e.preventDefault(); e.stopImmediatePropagation();
}, { capture: true });

(function bindArcadePointer() {
  const toX = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
  };
  function attachCanvas(cvs) {
    if (!cvs) return;
    cvs.addEventListener("pointerdown", (e) => {
      if (!arcadeActive || !arcade) return;
      arcade.pointerX = toX(e, cvs);
      try { cvs.setPointerCapture(e.pointerId); } catch (err) {}
      arcadeHandleFire(arcade);
      e.preventDefault();
    });
    cvs.addEventListener("pointermove", (e) => {
      if (arcadeActive && arcade && arcade.pointerX !== null) arcade.pointerX = toX(e, cvs);
    });
    const release = () => { if (arcade) arcade.pointerX = null; };
    cvs.addEventListener("pointerup", release);
    cvs.addEventListener("pointercancel", release);
  }
  if (scopeCanvas) attachCanvas(scopeCanvas);
  const aCanvas = document.getElementById("arcadeCanvas");
  if (aCanvas) attachCanvas(aCanvas);
  else document.addEventListener("DOMContentLoaded", () => {
    attachCanvas(document.getElementById("arcadeCanvas"));
  });
})();

// Touch pad under the playfield (phones / touch devices): drag the slider to
// move the ship (relative, so it never jumps to the finger), hold either FIRE
// button to shoot repeatedly. The thumb mirrors the ship every frame, so
// keyboard / canvas steering and the slider always agree.
function syncArcadePad() {
  const track = document.getElementById("arcadePadTrack");
  const thumb = document.getElementById("arcadePadThumb");
  if (!track || !thumb || !arcade) return;
  const travel = Math.max(0, track.clientWidth - 2 - thumb.offsetWidth);
  thumb.style.transform = `translateX(${(arcade.playerX * travel).toFixed(1)}px)`;
}
(function bindArcadePad() {
  const track = document.getElementById("arcadePadTrack");
  const thumb = document.getElementById("arcadePadThumb");
  if (!track || !thumb) return;
  let pid = null, startX = 0, startPlayerX = 0;
  const travel = () => Math.max(1, track.clientWidth - 2 - thumb.offsetWidth);
  track.addEventListener("pointerdown", (e) => {
    if (!arcadeActive || !arcade || pid !== null) return;
    pid = e.pointerId; startX = e.clientX; startPlayerX = arcade.playerX;
    arcade.pointerX = null;
    ensureAudioReady();
    try { track.setPointerCapture(pid); } catch (err) {}
    e.preventDefault();
  });
  track.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pid || !arcade) return;
    arcade.playerX = Math.max(0, Math.min(1, startPlayerX + (e.clientX - startX) / travel()));
    syncArcadePad();
  });
  const end = (e) => { if (e.pointerId === pid) pid = null; };
  track.addEventListener("pointerup", end);
  track.addEventListener("pointercancel", end);
  track.addEventListener("lostpointercapture", end);

  document.querySelectorAll("[data-arcade-fire]").forEach((btn) => {
    let fid = null, timer = 0;
    const stop = () => { fid = null; clearInterval(timer); timer = 0; btn.classList.remove("is-down"); };
    btn.addEventListener("pointerdown", (e) => {
      if (!arcadeActive || !arcade || fid !== null) return;
      fid = e.pointerId;
      btn.classList.add("is-down");
      try { btn.setPointerCapture(fid); } catch (err) {}
      ensureAudioReady();
      arcadeHandleFire(arcade);
      timer = setInterval(() => {
        if (!arcadeActive || !arcade) { stop(); return; }
        if (arcade.phase === "playing") arcadeHandleFire(arcade);
      }, 140);
      e.preventDefault();
    });
    const up = (e) => { if (e.pointerId === fid) stop(); };
    btn.addEventListener("pointerup", up);
    btn.addEventListener("pointercancel", up);
    btn.addEventListener("lostpointercapture", up);
    btn.addEventListener("contextmenu", (e) => e.preventDefault());
  });
})();

function arcadeBurst(g, x, y, rgb, n, speed, life) {
  for (let k = 0; k < n; k++) {
    const a = Math.random() * Math.PI * 2, sp = speed * (0.3 + Math.random());
    g.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, rgb });
  }
}

function arcadeEnemyFire(g, inv, pos, L, w, playerPx) {
  const t = ARCADE_TYPES[inv.type];
  const x = pos.x + 5.5 * L.px, y = pos.y + 8 * L.px;
  const base = 0.42 + g.wave * 0.04; // fraction of canvas height per second
  if (inv.type === "chord") {
    [-0.22, 0, 0.22].forEach(vx => g.enemyShots.push({ x, y, vx, vy: base * 0.9, rgb: t.rgb, kind: "spread" }));
  } else if (inv.type === "arp") {
    const dx = playerPx - x;
    g.enemyShots.push({ x, y, vx: Math.max(-0.5, Math.min(0.5, dx / w)), vy: base * 1.35, rgb: t.rgb, kind: "aimed" });
  } else if (inv.type === "drone") {
    g.enemyShots.push({ x, y, vx: 0, vy: base * 0.75, rgb: t.rgb, kind: "heavy" });
  } else {
    g.enemyShots.push({ x, y, vx: 0, vy: base, rgb: t.rgb, kind: "zig" });
  }
}

function arcadeStartDive(g, inv, L, w, ts) {
  const p = arcadeSlotPos(g, inv, L, ts);
  inv.dive = {
    x: p.x, y: p.y,
    t: 0,
    startX: p.x, startY: p.y,
    targetX: g.playerX * w + (Math.random() - 0.5) * L.cellW * 3,
    swing: (Math.random() < 0.5 ? -1 : 1) * L.cellW * (1.5 + Math.random() * 2),
    returning: false,
    fired: false
  };
}

function arcadeUpdate(g, w, h, L, ts, dtSec) {
  const e = fractalEnergy;
  if (g.phase === "dying" && ts > g.phaseUntil) g.phase = g.lives > 0 ? "playing" : "gameover";
  if (g.phase === "cleared" && ts > g.phaseUntil) { g.wave++; arcadeSpawnWave(g, ts); g.phase = "playing"; }

  // Sparks animate in every phase.
  for (let i = g.sparks.length - 1; i >= 0; i--) {
    const s = g.sparks[i];
    s.x += s.vx * dtSec; s.y += s.vy * dtSec; s.life -= dtSec * 1.8;
    if (s.life <= 0) g.sparks.splice(i, 1);
  }
  g.invaders.forEach(v => { if (v.hitFlash > 0) v.hitFlash = Math.max(0, v.hitFlash - dtSec * 4); });
  if (g.phase !== "playing") return;

  // Player movement (keys, or steer toward the pointer).
  const speed = 0.55 * dtSec;
  if (g.pointerX !== null) {
    const d = g.pointerX - g.playerX;
    g.playerX += Math.sign(d) * Math.min(Math.abs(d), speed * 1.4);
  } else {
    if (g.keys.left) g.playerX -= speed;
    if (g.keys.right) g.playerX += speed;
  }
  const margin = (6 * L.px) / w;
  g.playerX = Math.max(margin, Math.min(1 - margin, g.playerX));
  const playerPx = g.playerX * w;

  const alive = g.invaders.filter(v => v.alive);
  const inFormation = alive.filter(v => !v.dive);
  const frac = alive.length / Math.max(1, g.invaders.length);

  // Formation march, locked to the beat.
  const beatMs = 60000 / Math.max(30, bpm);
  const stepMs = beatMs / (frac < 0.15 ? 4 : frac < 0.5 ? 2 : 1);
  if (ts - g.lastStepTs >= stepMs) {
    g.lastStepTs = ts;
    g.frame ^= 1;
    let minX = Infinity, maxX = -Infinity;
    inFormation.forEach(v => {
      const p = arcadeSlotPos(g, v, L, ts);
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x + 11 * L.px);
    });
    if (inFormation.length && ((g.dir > 0 && maxX + L.stepPx > w - 6) || (g.dir < 0 && minX - L.stepPx < 6))) {
      g.dir = -g.dir;
      g.formY += 1;
    } else {
      g.formX += g.dir * L.stepPx;
    }

    // Enemy fire: louder instruments' invaders fire more often.
    const maxShots = 3 + Math.min(5, g.wave);
    if (g.enemyShots.length < maxShots && inFormation.length) {
      const cols = {};
      inFormation.forEach(v => { if (!cols[v.c] || cols[v.c].r < v.r) cols[v.c] = v; });
      const shooters = Object.values(cols);
      const v = shooters[Math.floor(Math.random() * shooters.length)];
      const energy = e[v.type] || 0;
      if (Math.random() < 0.2 + energy * 0.55 + g.wave * 0.03) {
        arcadeEnemyFire(g, v, arcadeSlotPos(g, v, L, ts), L, w, playerPx);
      }
    }

    // Dives: drum-type invaders peel off, more often on loud drums.
    const divers = alive.filter(v => v.dive);
    const maxDivers = 1 + Math.min(3, Math.floor(g.wave / 2));
    if (divers.length < maxDivers && Math.random() < 0.12 + e.drum * 0.35 + e.surge * 0.3) {
      const candidates = inFormation.filter(v => v.type === "drum");
      if (candidates.length) arcadeStartDive(g, candidates[Math.floor(Math.random() * candidates.length)], L, w, ts);
    }
  }

  // Diving invaders: swoop down toward where the player was, then loop off
  // the bottom and drop back into their slot from the top.
  alive.forEach(v => {
    if (!v.dive) return;
    const d = v.dive;
    if (!d.returning) {
      d.t += dtSec * (0.45 + g.wave * 0.03);
      const t = Math.min(1, d.t);
      d.x = d.startX + (d.targetX - d.startX) * t + Math.sin(t * Math.PI) * d.swing;
      d.y = d.startY + (h + 20 - d.startY) * (t * t * 0.6 + t * 0.4);
      if (!d.fired && t > 0.35) {
        d.fired = true;
        arcadeEnemyFire(g, v, { x: d.x, y: d.y }, L, w, playerPx);
      }
      if (t >= 1) { d.returning = true; d.y = -12 * L.px; }
    } else {
      const slot = arcadeSlotPos(g, v, L, ts);
      d.x += (slot.x - d.x) * Math.min(1, dtSec * 3);
      d.y += Math.max(40, (slot.y - d.y) * 2.5) * dtSec;
      if (d.y >= slot.y) v.dive = null;
    }
  });

  // Mothership.
  if (!g.ufo && ts > g.nextUfoTs) {
    const fromLeft = Math.random() < 0.5;
    g.ufo = { x: fromLeft ? -16 * L.px : w + 3 * L.px, dir: fromLeft ? 1 : -1, y: 26 };
  }
  if (g.ufo) {
    g.ufo.x += g.ufo.dir * w * 0.16 * dtSec;
    if (g.ufo.x < -20 * L.px || g.ufo.x > w + 20 * L.px) {
      g.ufo = null;
      g.nextUfoTs = ts + 14000 + Math.random() * 16000;
    }
  }

  // Player bullet.
  if (g.shot) {
    if (g.shot.y === null) g.shot.y = L.playerY;
    g.shot.y -= h * 1.25 * dtSec;
    if (g.shot.y < 0) g.shot = null;
  }
  if (g.shot && g.ufo) {
    const sx = g.shot.x * w;
    if (sx >= g.ufo.x && sx <= g.ufo.x + 13 * L.px && g.shot.y >= g.ufo.y && g.shot.y <= g.ufo.y + 7 * L.px) {
      const bonus = [100, 150, 200, 300][Math.floor(Math.random() * 4)] * g.wave;
      g.score += bonus;
      arcadeBurst(g, g.ufo.x + 6.5 * L.px, g.ufo.y + 3.5 * L.px, ARCADE_UFO_RGB, 26, 110, 1.4);
      g.sparks.push({ x: g.ufo.x, y: g.ufo.y + 8 * L.px, vx: 0, vy: -12, life: 2.4, rgb: ARCADE_UFO_RGB, text: `+${bonus}` });
      [0, 2, 4, 7, 9].forEach((deg, k) => setTimeout(() => arcadeBlip(arcadeScaleMidi(6, deg), "triangle", 0.35, 0.045), k * 70));
      g.ufo = null;
      g.shot = null;
      g.nextUfoTs = ts + 14000 + Math.random() * 16000;
    }
  }
  if (g.shot) {
    const sx = g.shot.x * w;
    for (const v of alive) {
      const p = arcadeInvaderPos(g, v, L, ts);
      if (sx >= p.x && sx <= p.x + 11 * L.px && g.shot.y >= p.y && g.shot.y <= p.y + 8 * L.px) {
        g.shot = null;
        const t = ARCADE_TYPES[v.type];
        v.hp--;
        if (v.hp > 0) {
          // Armored: flash and clank, but survive.
          v.hitFlash = 1;
          arcadeBlip(arcadeScaleMidi(t.octave, 0), "square", 0.08, 0.03);
          arcadeBurst(g, p.x + 5.5 * L.px, p.y + 4 * L.px, [230, 236, 255], 5, 50, 0.6);
          break;
        }
        v.alive = false;
        const diveBonus = v.dive ? 2 : 1;
        g.score += t.points * g.wave * diveBonus;
        arcadeBlip(arcadeScaleMidi(t.octave, v.c), v.type === "drone" ? "sine" : "triangle", 0.35, 0.07);
        arcadeBurst(g, p.x + 5.5 * L.px, p.y + 4 * L.px, t.rgb, 10, 90, 1);
        if (alive.length === 1) {
          g.phase = "cleared";
          g.phaseUntil = ts + 1800;
          [0, 2, 4, 7].forEach((deg, k) => setTimeout(() => arcadeBlip(arcadeScaleMidi(5, deg), "triangle", 0.4, 0.05), k * 110));
        }
        break;
      }
    }
  }

  // Enemy bullets.
  for (let i = g.enemyShots.length - 1; i >= 0; i--) {
    const s = g.enemyShots[i];
    s.x += s.vx * w * dtSec;
    s.y += s.vy * h * dtSec;
    if (s.y > h || s.x < -10 || s.x > w + 10) { g.enemyShots.splice(i, 1); continue; }
    const hitR = s.kind === "heavy" ? 7 * L.px : 5.5 * L.px;
    if (ts > g.invulnUntil && s.y >= L.playerY && s.y <= L.playerY + 7 * L.px && Math.abs(s.x - playerPx) <= hitR) {
      g.enemyShots.splice(i, 1);
      arcadeLoseLife(g, L, w, ts);
      // arcadeLoseLife() empties g.enemyShots, so stop here: carrying on
      // with the old index read undefined shots, threw, and froze the
      // visualizer whenever other shots were still on screen.
      break;
    }
  }

  // A diver ramming the player costs a life (and the diver).
  if (g.phase === "playing" && ts > g.invulnUntil) {
    for (const v of alive) {
      if (!v.dive || v.dive.returning) continue;
      if (Math.abs(v.dive.x + 5.5 * L.px - playerPx) < 9 * L.px && Math.abs(v.dive.y + 4 * L.px - (L.playerY + 3 * L.px)) < 6 * L.px) {
        v.alive = false;
        arcadeBurst(g, v.dive.x, v.dive.y, ARCADE_TYPES[v.type].rgb, 10, 90, 1);
        arcadeLoseLife(g, L, w, ts);
        break;
      }
    }
  }

  // Invaders reaching the player's line ends the game outright.
  if (g.phase === "playing" && inFormation.some(v => arcadeSlotPos(g, v, L, ts).y + 8 * L.px >= L.playerY)) {
    g.lives = 1;
    arcadeLoseLife(g, L, w, ts);
  }
}

function arcadeLoseLife(g, L, w, ts) {
  g.lives--;
  g.phase = "dying";
  g.phaseUntil = ts + 1400;
  g.invulnUntil = ts + 1400 + 1500;
  g.enemyShots = [];
  g.shot = null;
  // Divers abort and go home so a respawn isn't instantly rammed.
  g.invaders.forEach(v => {
    if (v.dive) { v.dive.returning = true; v.dive.y = -12 * L.px; }
  });
  arcadeBlip(arcadeScaleMidi(2, 0), "sawtooth", 0.6, 0.06);
  arcadeBurst(g, g.playerX * w, L.playerY + 3 * L.px, themeRgbArr("filter"), 24, 140, 1.3);
  if (g.lives <= 0) g.hiScore = Math.max(g.hiScore, g.score);
}

function drawArcadeGame(w, h, ts, targetCtx) {
  const ctx = targetCtx || arcadeCtx || scopeCtx;
  if (!ctx) return;
  const g = arcade;
  if (!g) return;
  if (g.lastTs === null) g.lastTs = ts;
  const dtSec = Math.max(0, Math.min(0.05, (ts - g.lastTs) / 1000));
  g.lastTs = ts;
  updateFractalEnergy(dtSec);
  const L = arcadeLayout(w, h, g.cols);
  arcadeUpdate(g, w, h, L, ts, dtSec);

  ctx.save();
  ctx.shadowBlur = 0;

  // Clear background
  ctx.fillStyle = "#0c0d11";
  ctx.fillRect(0, 0, w, h);

  // Faint CRT scanlines.
  ctx.fillStyle = "rgba(255, 255, 255, 0.025)";
  for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

  // Invaders, glowing with their instrument's live energy.
  if (g.phase !== "title") {
    g.invaders.forEach(v => {
      if (!v.alive) return;
      const t = ARCADE_TYPES[v.type];
      const en = fractalEnergy[v.type] || 0;
      const p = arcadeInvaderPos(g, v, L, ts);
      // Armored drones that have taken a hit render dimmer/cracked.
      const damaged = v.type === "drone" && v.hp < t.hp;
      const rgb = v.hitFlash > 0 ? [255, 255, 255] : t.rgb;
      ctx.shadowColor = `rgb(${t.rgb.join(",")})`;
      ctx.shadowBlur = 2 + en * 14 + (v.dive ? 6 : 0);
      const frame = v.type === "arp" ? (Math.floor(ts / 160 + v.phase) % 2) : g.frame;
      arcadeDrawSprite(ARCADE_SPRITES[t.sprite][frame], p.x, p.y, L.px, rgb, (damaged ? 0.45 : 0.6) + en * 0.4, ctx);
    });
    ctx.shadowBlur = 0;
  }

  if (g.ufo) {
    ctx.shadowColor = `rgb(${ARCADE_UFO_RGB.join(",")})`;
    ctx.shadowBlur = 10;
    const blink = Math.floor(ts / 140) % 2;
    arcadeDrawSprite(ARCADE_UFO_SPRITE, g.ufo.x, g.ufo.y, L.px, blink ? ARCADE_UFO_RGB : [255, 160, 220], 0.95, ctx);
    ctx.shadowBlur = 0;
  }

  // Player (blinks while invulnerable, hidden while exploding).
  const blink = ts < g.invulnUntil && Math.floor(ts / 120) % 2 === 0;
  if ((g.phase === "playing" || g.phase === "cleared") && !blink) {
    arcadeDrawSprite(ARCADE_PLAYER_SPRITE, g.playerX * w - 5.5 * L.px, L.playerY, L.px, themeRgbArr("filter"), 0.95, ctx);
  }

  if (g.shot && g.shot.y !== null) {
    ctx.fillStyle = themeHex("chord");
    ctx.fillRect(g.shot.x * w - L.px / 2, g.shot.y, L.px, 4 * L.px);
  }
  g.enemyShots.forEach(s => {
    ctx.fillStyle = `rgb(${s.rgb.join(",")})`;
    if (s.kind === "heavy") {
      ctx.fillRect(s.x - L.px, s.y, 2 * L.px, 4 * L.px);
    } else if (s.kind === "aimed") {
      ctx.fillRect(s.x - L.px / 2, s.y, L.px, 2 * L.px);
      ctx.fillRect(s.x - L.px / 2 - s.vx * 4 * L.px, s.y - 2 * L.px, L.px, L.px);
    } else if (s.kind === "spread") {
      ctx.fillRect(s.x - L.px / 2, s.y, L.px, L.px * 2);
    } else {
      const zig = (Math.floor(s.y / (2 * L.px)) % 2) * L.px;
      ctx.fillRect(s.x - L.px + zig, s.y, L.px, 3 * L.px);
    }
  });
  g.sparks.forEach(s => {
    const a = Math.max(0, Math.min(1, s.life)).toFixed(3);
    if (s.text) {
      ctx.font = `700 ${Math.max(10, L.px * 4)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillStyle = `rgba(${s.rgb.join(",")}, ${a})`;
      ctx.fillText(s.text, s.x, s.y);
    } else {
      ctx.fillStyle = `rgba(${s.rgb.join(",")}, ${a})`;
      ctx.fillRect(s.x, s.y, L.px, L.px);
    }
  });

  // Ground line.
  ctx.fillStyle = `rgba(${themeRgb("filter")}, 0.45)`;
  ctx.fillRect(8, L.playerY + 9 * L.px, w - 16, 1);

  // HUD.
  const fs = Math.max(10, Math.round(L.px * 4.5));
  ctx.font = `600 ${fs}px "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(230, 236, 255, 0.85)";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE ${String(g.score).padStart(5, "0")}`, 10, 8);
  ctx.textAlign = "center";
  ctx.fillText(`HI ${String(Math.max(g.hiScore, g.score)).padStart(5, "0")}  ·  WAVE ${g.wave}`, w / 2, 8);
  ctx.textAlign = "right";
  ctx.fillText(`${"▲".repeat(Math.max(0, g.lives))}`, w - 10, 8);

  const centerMsg = (lines) => {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    lines.forEach((ln, i) => {
      ctx.font = `${i === 0 ? 800 : 500} ${i === 0 ? fs * 1.6 : fs}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.fillStyle = i === 0 ? themeHex("filter") : "rgba(230, 236, 255, 0.8)";
      ctx.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * fs * 2);
    });
  };
  const touchUi = PHONE_LAYOUT_MQ.matches || TOUCH_POINTER_MQ.matches;
  if (g.phase === "title") centerMsg(touchUi ? ["VOID RAIDERS", "TAP TO START", "SLIDE TO MOVE · FIRE TO SHOOT", "TAP ✕ TO CLOSE"] : ["VOID RAIDERS", "SPACE / TAP TO START", "← → MOVE · SPACE FIRE · ESC QUIT"]);
  else if (g.phase === "gameover") centerMsg(["GAME OVER", `SCORE ${g.score}`, touchUi ? "TAP TO PLAY AGAIN" : "SPACE / TAP TO PLAY AGAIN"]);
  else if (g.phase === "cleared") centerMsg([`WAVE ${g.wave} CLEAR`]);
  else if (g.phase === "playing" && ts < g.bannerUntil) centerMsg([`WAVE ${g.wave}`, g.formation]);

  ctx.restore();
}

function toggleScopeFullscreen(forceState) {
  scopeFullscreen = (typeof forceState === 'boolean') ? forceState : !scopeFullscreen;
  const panel = document.getElementById('scopePanel');
  const btn = document.getElementById('btnToggleScopeFullscreen');
  const svg = document.getElementById('svgScopeFullscreen');
  if (panel) panel.classList.toggle('is-fullscreen', scopeFullscreen);
  document.body.classList.toggle('scope-fullscreen-open', scopeFullscreen);
  if (btn) btn.classList.toggle('active', scopeFullscreen);
  if (svg) {
    svg.innerHTML = scopeFullscreen
      ? '<path d="M5 1.5V5H1.5M11 1.5V5H14.5M14.5 9H11V12.5M1.5 9H5V12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path d="M1.5 5V1.5H5M11 1.5H14.5V5M14.5 9V12.5H11M5 12.5H1.5V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  cachedScopeW = 0;
  cachedScopeH = 0;
  setTimeout(() => {
    cachedScopeW = 0;
    cachedScopeH = 0;
    if (typeof updateCanvasDimensions === "function") updateCanvasDimensions();
  }, 150);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && scopeFullscreen) {
    toggleScopeFullscreen(false);
  }
});

function drawFlightTerrainGrid(w, h) {
  if (!flightGridEnabled) return;

  scopeCtx.save();
  // This function never sets its own shadowBlur, so without an explicit
  // reset it inherits whatever the ring glow passes left behind -- cheap
  // insurance against ~33 stroke() calls picking up an expensive blur.
  scopeCtx.shadowBlur = 0;

  const horizonY = h * 0.58;
  const bottomY = h;
  const gridH = bottomY - horizonY;
  const vanishX = w * 0.5;

  scopeCtx.beginPath();
  scopeCtx.rect(0, horizonY - 2, w, gridH + 4);
  scopeCtx.clip();

  if (isPlaying) {
    const tempoRate = (typeof bpm !== "undefined" ? bpm : 72) / 60;
    flightGridScroll = (flightGridScroll + 0.012 * tempoRate) % 1.0;
  }

  const bassImpulse = (ringDynamics.drone ? ringDynamics.drone.energy * 1.8 : 0) +
                      (ringDynamics.drum ? ringDynamics.drum.impulse * 2.2 : 0);
  const chordMod = (ringDynamics.chord ? ringDynamics.chord.energy * 0.8 : 0);

  const enoCol = (typeof ENO_PHOSPHORS !== "undefined" && ENO_PHOSPHORS[enoPhosIndex]) ? ENO_PHOSPHORS[enoPhosIndex].color : "#fed330";
  let fR = 254, fG = 211, fB = 48;
  if (enoCol.startsWith("#") && enoCol.length === 7) {
    fR = parseInt(enoCol.slice(1, 3), 16);
    fG = parseInt(enoCol.slice(3, 5), 16);
    fB = parseInt(enoCol.slice(5, 7), 16);
  }

  scopeCtx.strokeStyle = `rgba(${fR}, ${fG}, ${fB}, 0.55)`;
  scopeCtx.lineWidth = 1.0;
  scopeCtx.beginPath();
  scopeCtx.moveTo(0, horizonY);
  scopeCtx.lineTo(w, horizonY);
  scopeCtx.stroke();

  scopeCtx.strokeStyle = `rgba(${fR}, ${fG}, ${fB}, 0.35)`;
  scopeCtx.beginPath();
  for (let offset = -80; offset <= 80; offset += 40) {
    if (offset === 0) continue;
    scopeCtx.moveTo(vanishX + offset, horizonY - 4);
    scopeCtx.lineTo(vanishX + offset, horizonY + 4);
  }
  scopeCtx.stroke();

  const numTransverse = 14;
  for (let i = 0; i < numTransverse; i++) {
    const rawProgress = (i + flightGridScroll) / numTransverse;
    const p = Math.pow(rawProgress, 2.3);
    const y = horizonY + p * gridH;
    if (y < horizonY || y > bottomY) continue;

    const lineAlpha = (0.08 + p * 0.52) * (1.0 + Math.min(0.5, bassImpulse * 0.3));
    scopeCtx.strokeStyle = `rgba(${fR}, ${fG}, ${fB}, ${lineAlpha.toFixed(3)})`;
    scopeCtx.lineWidth = 0.8 + p * 0.9;

    scopeCtx.beginPath();
    const segs = 32;
    for (let s = 0; s <= segs; s++) {
      const sx = (s / segs) * w;
      const distFromCenter = Math.abs(sx - vanishX) / (w * 0.5);
      const elevation = Math.sin(s * 0.65 + flightGridScroll * 6.28) * (bassImpulse * 7.5 * p) * distFromCenter +
                        Math.cos(s * 1.2) * (chordMod * 3.5 * p);
      const sy = y - elevation;
      if (s === 0) scopeCtx.moveTo(sx, sy);
      else scopeCtx.lineTo(sx, sy);
    }
    scopeCtx.stroke();
  }

  const numRays = 18;
  for (let r = 0; r <= numRays; r++) {
    const groundX = (r / numRays) * (w * 1.6) - (w * 0.3);
    const rayAlpha = 0.12 + Math.abs(groundX - vanishX) / w * 0.38;
    scopeCtx.strokeStyle = `rgba(${fR}, ${fG}, ${fB}, ${rayAlpha.toFixed(3)})`;
    scopeCtx.lineWidth = 0.8;

    scopeCtx.beginPath();
    scopeCtx.moveTo(vanishX, horizonY);
    scopeCtx.lineTo(groundX, bottomY);
    scopeCtx.stroke();
  }

  scopeCtx.restore();
}

// "Roadside" layer: shapes that appear small near the horizon and grow as
// they pass, like trees/markers alongside the flight-grid's implied road,
// then fade out past the bottom edge. Each one is colored to whichever
// instrument's energy spawned it, reusing the waterfall's own per-track
// frequency snapshots (chBufs) rather than polling a fresh analyser here
// too. Deliberately sparse (ROADSIDE_MAX_OBJECTS, low spawn odds, fade
// in/out) so it reads as a light accent layer, not a parallax wall of
// shapes -- meant to work whether every other layer is on or off.
// Two families: "rooted" shapes (tree, cactus) sit on the ground plane and
// grow straight out of the horizon, like roadside vegetation. "floating"
// shapes (pyramid, sphere, square) drift above the ground at a height
// proportional to their own size, with a slow bob -- these never touch
// the floor.
/* ==========================================================================
   FLOATING 3D VECTOR OBJECTS (SPHERES, CUBES, PYRAMIDS, DIAMONDS)
   Luminous 3D wireframe geometric elements rendered in vintage CRT vector
   lines matching the S.L.A.M. 6000 CRT vector aesthetic.
   Objects float above the flight-grid landscape. The music nudges them
   (each layer's notes can spawn one, leaning toward that layer's shape:
   drone -> sphere, drums -> cube, chords -> pyramid, arp -> diamond), but
   they're deliberately loose rather than a strict readout:
     - About two thirds of spawns pick a random shape instead of the layer's own
     - Every shape gets a random color from ROADSIDE_COLORS (blues, greens and
       pinks weighted up), never the same color twice in a row. Colors used
       to be fixed per layer, and since the drone only spawns via the Tanpura
       (off by default), cyan spheres almost never appeared
     - A free-running random spawner adds shapes on its own while playing,
       independent of any note
   ========================================================================== */
// Shapes are strictly audio-gated: nothing spawns while stopped (the old idle
// fallback left a lone cyan sphere drifting over a silent scope), and any
// shapes still on screen at Stop just finish their pass and fade out.
// Density scales with how many layers are actually sounding: the base cap of
// 6 grows by 60% (one layer active) up to 95% (all four active), and the
// per-layer spawn debounce shortens by the same factor.
const ROADSIDE_BASE_MAX_OBJECTS = 6;
const ROADSIDE_BASE_DEBOUNCE_MS = 1350;
const ROADSIDE_ACTIVITY_WINDOW_MS = 4000;
let roadsideObjects = [];
let lastMusical3DSpawnTimes = { drone: 0, drum: 0, chord: 0, arp: 0, ambient: 0 };
let lastMusical3DTriggerTimes = { drone: 0, drum: 0, chord: 0, arp: 0 };

function getRoadsideDensityScale() {
  const now = performance.now();
  const active = Object.values(lastMusical3DTriggerTimes)
    .filter(t => t && now - t < ROADSIDE_ACTIVITY_WINDOW_MS).length;
  if (active === 0) return 1;
  return 1.60 + (active - 1) / 3 * 0.35;
}

const MUSICAL_3D_TYPES = {
  drone:   { shape: "sphere"  },
  drum:    { shape: "cube"    },
  chord:   { shape: "pyramid" },
  arp:     { shape: "diamond" },
  ambient: { shape: null      }   // free-running random spawner
};
const ROADSIDE_SHAPES = ["sphere", "cube", "pyramid", "diamond"];
// [rgb, weight]: blues, greens and pinks weighted up.
const ROADSIDE_COLORS = [
  [[0, 229, 255], 3],    // electric cyan
  [[75, 123, 236], 3],   // royal blue
  [[47, 128, 255], 2],   // bright blue
  [[46, 213, 115], 3],   // phosphor green
  [[29, 209, 161], 2],   // mint
  [[255, 95, 196], 3],   // hot pink
  [[255, 77, 141], 2],   // rose
  [[125, 95, 255], 1],   // violet
  [[254, 211, 48], 1],   // amber
  [[255, 56, 56], 1]     // crimson
];
let ROADSIDE_COLOR_WEIGHT_TOTAL = ROADSIDE_COLORS.reduce((a, c) => a + c[1], 0);
let lastRoadsideColorIdx = -1;

function pickRoadsideColor() {
  let idx;
  do {
    let r = Math.random() * ROADSIDE_COLOR_WEIGHT_TOTAL;
    idx = 0;
    while (r >= ROADSIDE_COLORS[idx][1]) { r -= ROADSIDE_COLORS[idx][1]; idx++; }
  } while (idx === lastRoadsideColorIdx);
  lastRoadsideColorIdx = idx;
  return ROADSIDE_COLORS[idx][0];
}

function triggerMusical3DObject(type) {
  if (!roadsideEnabled || !isPlaying || document.hidden || !scopeCanvasVisible) return;
  const cfg = MUSICAL_3D_TYPES[type];
  if (!cfg) return;

  const now = performance.now();
  if (type !== "ambient") lastMusical3DTriggerTimes[type] = now;
  const density = getRoadsideDensityScale();
  // Per-channel debounce so fast successive triggers don't clutter the horizon
  if (now - (lastMusical3DSpawnTimes[type] || 0) < ROADSIDE_BASE_DEBOUNCE_MS / density) return;
  lastMusical3DSpawnTimes[type] = now;

  const maxObjects = Math.round(ROADSIDE_BASE_MAX_OBJECTS * density);
  while (roadsideObjects.length >= maxObjects * 2) {
    roadsideObjects.shift();
  }
  if (roadsideObjects.length >= maxObjects) {
    // Gracefully speed up the oldest object to exit cleanly
    roadsideObjects[0].progress = Math.max(roadsideObjects[0].progress, 0.90);
  }

  const shape = (cfg.shape && Math.random() < 0.35)
    ? cfg.shape
    : ROADSIDE_SHAPES[Math.floor(Math.random() * ROADSIDE_SHAPES.length)];

  roadsideObjects.push({
    type,
    shape,
    rgb: pickRoadsideColor(),
    side: Math.random() < 0.5 ? -1 : 1,
    lateral: 0.14 + Math.random() * 0.36,
    progress: 0,
    sizeMult: 0.7 + Math.random() * 0.75,
    floatAlt: 0.65 + Math.random() * 0.70,
    bobSeed: Math.random() * Math.PI * 2,
    bobSpeed: 0.0012 + Math.random() * 0.0009,
    rotX: Math.random() * Math.PI * 2,
    rotY: Math.random() * Math.PI * 2,
    rotZ: Math.random() * Math.PI * 2,
    spinX: (Math.random() - 0.5) * 0.024,
    spinY: 0.016 + Math.random() * 0.024,
    spinZ: (Math.random() - 0.5) * 0.018
  });
}

// Fast 3D Point Projection onto 2D canvas with Euler rotation
function project3D(px, py, pz, rx, ry, rz, scale, cx, cy) {
  // Rotate Y
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = px * cosY + pz * sinY;
  const z1 = -px * sinY + pz * cosY;
  // Rotate X
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const y2 = py * cosX - z1 * sinX;
  const z2 = py * sinX + z1 * cosX;
  // Rotate Z
  const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
  const x3 = x1 * cosZ - y2 * sinZ;
  const y3 = x1 * sinZ + y2 * cosZ;
  return { x: cx + x3 * scale, y: cy + y3 * scale, z: z2 };
}

// Draws 3D wireframe edges with vector CRT front/back depth shading
function drawWireframeEdges(edges, vertices, rx, ry, rz, scale, cx, cy, rgb, alpha) {
  const projected = vertices.map(v => project3D(v[0], v[1], v[2], rx, ry, rz, scale, cx, cy));

  edges.forEach(e => {
    const p1 = projected[e[0]];
    const p2 = projected[e[1]];
    const avgZ = (p1.z + p2.z) / 2;

    // Depth-based line weight and opacity (front-facing = luminous bright, back-facing = subtle ghost line)
    const isFront = avgZ >= -0.10;
    const edgeAlpha = alpha * (isFront ? 0.95 : 0.32);
    const edgeWidth = isFront ? Math.max(1.1, scale * 0.045) : Math.max(0.65, scale * 0.024);

    scopeCtx.beginPath();
    scopeCtx.moveTo(p1.x, p1.y);
    scopeCtx.lineTo(p2.x, p2.y);
    scopeCtx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${edgeAlpha.toFixed(3)})`;
    scopeCtx.lineWidth = edgeWidth;
    scopeCtx.stroke();
  });
}

// 1. 3D Wireframe Cube (Drums / Crimson #ff3838)
const CUBE_VERTS = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
];
const CUBE_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 0], // back face
  [4, 5], [5, 6], [6, 7], [7, 4], // front face
  [0, 4], [1, 5], [2, 6], [3, 7]  // connecting ribs
];
function draw3DCube(cx, cy, scale, rgb, alpha, rx, ry, rz) {
  drawWireframeEdges(CUBE_EDGES, CUBE_VERTS, rx, ry, rz, scale * 0.52, cx, cy, rgb, alpha);
}

// 2. 3D Wireframe Pyramid (Chords / Amber #fed330)
const PYRAMID_VERTS = [
  [0, -1.25, 0], // apex
  [-1, 0.85, -1], [1, 0.85, -1], [1, 0.85, 1], [-1, 0.85, 1] // square base
];
const PYRAMID_EDGES = [
  [1, 2], [2, 3], [3, 4], [4, 1], // base perimeter
  [0, 1], [0, 2], [0, 3], [0, 4]  // sides to apex
];
function draw3DPyramid(cx, cy, scale, rgb, alpha, rx, ry, rz) {
  drawWireframeEdges(PYRAMID_EDGES, PYRAMID_VERTS, rx, ry, rz, scale * 0.58, cx, cy, rgb, alpha);
}

// 3. 3D Wireframe Diamond / Octahedron (Arp / Violet #7d5fff)
const DIAMOND_VERTS = [
  [0, -1.35, 0], [0, 1.35, 0], // top & bottom apex
  [-1, 0, 0], [0, 0, -1], [1, 0, 0], [0, 0, 1] // equatorial ring
];
const DIAMOND_EDGES = [
  [2, 3], [3, 4], [4, 5], [5, 2], // equator
  [0, 2], [0, 3], [0, 4], [0, 5], // upper pyramid
  [1, 2], [1, 3], [1, 4], [1, 5]  // lower pyramid
];
function draw3DDiamond(cx, cy, scale, rgb, alpha, rx, ry, rz) {
  drawWireframeEdges(DIAMOND_EDGES, DIAMOND_VERTS, rx, ry, rz, scale * 0.56, cx, cy, rgb, alpha);
}

// 4. 3D Wireframe Sphere (Sub & Drone / Cyan #00e5ff)
const SPHERE_RING_PTS = 16;
const SPHERE_UNIT_RINGS = [
  // Equator (XZ plane)
  Array.from({ length: SPHERE_RING_PTS }, (_, i) => {
    const a = (i / SPHERE_RING_PTS) * Math.PI * 2;
    return [Math.cos(a), 0, Math.sin(a)];
  }),
  // Prime Meridian (YZ plane)
  Array.from({ length: SPHERE_RING_PTS }, (_, i) => {
    const a = (i / SPHERE_RING_PTS) * Math.PI * 2;
    return [0, Math.sin(a), Math.cos(a)];
  }),
  // Axial (XY plane)
  Array.from({ length: SPHERE_RING_PTS }, (_, i) => {
    const a = (i / SPHERE_RING_PTS) * Math.PI * 2;
    return [Math.cos(a), Math.sin(a), 0];
  })
];
function draw3DSphere(cx, cy, scale, rgb, alpha, rx, ry, rz) {
  const r = scale * 0.58;

  SPHERE_UNIT_RINGS.forEach(ring => {
    const projected = ring.map(p => project3D(p[0], p[1], p[2], rx, ry, rz, r, cx, cy));
    for (let i = 0; i < projected.length; i++) {
      const p1 = projected[i];
      const p2 = projected[(i + 1) % projected.length];
      const avgZ = (p1.z + p2.z) / 2;
      const isFront = avgZ >= -0.10;
      const edgeAlpha = alpha * (isFront ? 0.95 : 0.32);

      scopeCtx.beginPath();
      scopeCtx.moveTo(p1.x, p1.y);
      scopeCtx.lineTo(p2.x, p2.y);
      scopeCtx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${edgeAlpha.toFixed(3)})`;
      scopeCtx.lineWidth = isFront ? Math.max(1.1, scale * 0.04) : Math.max(0.65, scale * 0.022);
      scopeCtx.stroke();
    }
  });

  // Small luminous center origin node
  const centerNode = project3D(0, 0, 0, rx, ry, rz, r, cx, cy);
  scopeCtx.beginPath();
  scopeCtx.arc(centerNode.x, centerNode.y, Math.max(1.2, scale * 0.05), 0, Math.PI * 2);
  scopeCtx.fillStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(alpha * 0.85).toFixed(3)})`;
  scopeCtx.fill();
}

function drawRoadsideShape(obj, x, y, size, alpha) {
  const rgb = obj.rgb;
  scopeCtx.save();
  scopeCtx.lineCap = "round";
  scopeCtx.lineJoin = "round";

  if (obj.shape === "cube") {
    draw3DCube(x, y, size, rgb, alpha, obj.rotX, obj.rotY, obj.rotZ);
  } else if (obj.shape === "pyramid") {
    draw3DPyramid(x, y, size, rgb, alpha, obj.rotX, obj.rotY, obj.rotZ);
  } else if (obj.shape === "diamond") {
    draw3DDiamond(x, y, size, rgb, alpha, obj.rotX, obj.rotY, obj.rotZ);
  } else {
    draw3DSphere(x, y, size, rgb, alpha, obj.rotX, obj.rotY, obj.rotZ);
  }

  scopeCtx.restore();
}

function drawRoadsideObjects(w, h) {
  if (!roadsideEnabled) return;

  const horizonY = h * 0.58;
  const bottomY = h;
  const gridH = bottomY - horizonY;
  const vanishX = w * 0.5;

  // Free-running random spawner, independent of the notes (still nothing
  // while stopped -- see the audio-gating note above). Busier when the
  // scene is sparse so a quiet passage never leaves the road empty.
  if (isPlaying && Math.random() < (roadsideObjects.length < 3 ? 0.025 : 0.008)) {
    triggerMusical3DObject("ambient");
  }

  const tempoRate = (typeof bpm !== "undefined" ? bpm : 72) / 60;
  const speed = 0.0020 * tempoRate * (isPlaying ? 1 : 0.45);
  const nowMs = performance.now();

  scopeCtx.save();
  scopeCtx.beginPath();
  scopeCtx.rect(0, 0, w, h);
  scopeCtx.clip();

  for (let i = roadsideObjects.length - 1; i >= 0; i--) {
    const obj = roadsideObjects[i];
    obj.progress += speed;
    if (obj.progress >= 1) { roadsideObjects.splice(i, 1); continue; }

    // Rotate 3D geometry smoothly each frame
    obj.rotX += obj.spinX;
    obj.rotY += obj.spinY;
    obj.rotZ += obj.spinZ;

    const p = obj.progress;
    const eased = p * p;
    const groundY = horizonY + eased * gridH;
    const edgeX = vanishX + obj.side * (w * (0.24 + obj.lateral * 0.28));
    const x = vanishX + (edgeX - vanishX) * Math.pow(p, 1.35);
    const size = (6 + Math.pow(p, 1.6) * 72) * obj.sizeMult;

    // All objects float suspended above the vector ground plane
    const floatHeight = size * (0.8 + obj.floatAlt * 0.85);
    const bob = Math.sin(nowMs * obj.bobSpeed + obj.bobSeed) * (size * 0.12);
    const y = groundY - floatHeight + bob;

    let alpha = 0.85;
    if (p < 0.12) alpha = p / 0.12;
    else if (p > 0.86) alpha = (1 - p) / 0.14;
    alpha = Math.max(0, Math.min(0.88, alpha));

    drawRoadsideShape(obj, x, y, size, alpha);
  }

  scopeCtx.restore();
}

function drawReferenceTracks(cx, cy) {
  scopeCtx.save();
  RING_CONFIGS.forEach(cfg => {
    scopeCtx.beginPath(); scopeCtx.arc(cx, cy, cfg.baseRadius, 0, Math.PI * 2);
    scopeCtx.strokeStyle = "rgba(4, 6, 10, 0.75)";
    scopeCtx.lineWidth = 2.2; scopeCtx.stroke();

    scopeCtx.beginPath(); scopeCtx.arc(cx, cy, cfg.baseRadius, 0, Math.PI * 2);
    scopeCtx.strokeStyle = cfg.color;
    scopeCtx.globalAlpha = isPlaying ? 0.35 : 0.22;
    scopeCtx.lineWidth = 0.9; scopeCtx.stroke();
  });

  const outerR = 138;
  scopeCtx.strokeStyle = "rgba(255, 255, 255, 0.08)"; scopeCtx.lineWidth = 0.75;
  scopeCtx.beginPath();
  scopeCtx.moveTo(cx, cy - outerR - 4); scopeCtx.lineTo(cx, cy - outerR + 4);
  scopeCtx.moveTo(cx, cy + outerR - 4); scopeCtx.lineTo(cx, cy + outerR + 4);
  scopeCtx.moveTo(cx - outerR - 4, cy); scopeCtx.lineTo(cx - outerR + 4, cy);
  scopeCtx.moveTo(cx + outerR - 4, cy); scopeCtx.lineTo(cx + outerR + 4, cy);
  scopeCtx.stroke();
  scopeCtx.restore();
}

// Per-frame analyser sampler so rings, meters, and orbital view don't call
// getByteTimeDomainData / getByteFrequencyData multiple times per frame on the
// same AnalyserNode.
let currentAnalyserFrameId = 0;
const analyserFrameCache = new WeakMap();
function sampleAnalyserForFrame(analyser) {
  if (!analyser) return null;
  let entry = analyserFrameCache.get(analyser);
  const n = analyser.frequencyBinCount;
  if (!entry || entry.time.length !== n) {
    entry = { time: new Uint8Array(n), freq: new Uint8Array(n), frameId: -1 };
    analyserFrameCache.set(analyser, entry);
  }
  if (entry.frameId !== currentAnalyserFrameId) {
    analyser.getByteTimeDomainData(entry.time);
    analyser.getByteFrequencyData(entry.freq);
    entry.frameId = currentAnalyserFrameId;
  }
  return entry;
}

function drawSymmetricalRing(cfg, cx, cy) {
  const analyser = cfg.getAnalyser();
  const dyn = ringDynamics[cfg.id];
  if (!dyn) return;

  const sampled = isPlaying ? sampleAnalyserForFrame(analyser) : null;
  const bufLen = sampled ? sampled.time.length : 256;

  let combinedEnergy = 0;
  if (sampled) {
    const rawData = sampled.time, freqData = sampled.freq;
    let sumSquare = 0, freqEnergy = 0;
    for (let i = 0; i < bufLen; i++) {
      const diff = (rawData[i] - 128) / 128.0;
      sumSquare += diff * diff;
      if (i >= cfg.fLow && i <= cfg.fHigh) freqEnergy += freqData[i];
    }
    const instantRms = Math.sqrt(sumSquare / bufLen);
    const avgFreq = freqEnergy / ((cfg.fHigh - cfg.fLow + 1) * 255);
    combinedEnergy = (instantRms * 0.55 + avgFreq * 0.45);
  }
  dyn.energy = dyn.energy * 0.76 + combinedEnergy * 0.24;

  const M = HALF_POINTS;
  for (let i = 0; i <= M; i++) {
    let target = 0;
    if (sampled) {
      const rawData = sampled.time, freqData = sampled.freq;
      const fBin = Math.min(bufLen - 1, cfg.fLow + Math.floor((i / M) * (cfg.fHigh - cfg.fLow)));
      const fNorm = freqData[fBin] / 255.0;
      const centerIdx = Math.min(bufLen - 1, Math.floor((i / M) * (bufLen * 0.6)));
      const tNorm = (rawData[centerIdx] - 128) / 128.0;
      const acousticWave = (tNorm * 1.65 + fNorm * 1.85) * cfg.maxDisp;
      const impulseWave = Math.sin(scopeAngle * 6.8 + i * 0.4) * (dyn.impulse * cfg.maxDisp * 0.75);
      target = acousticWave + impulseWave;
    } else {
      target = Math.sin(scopeAngle * 2.0 + i * 0.25) * 0.65;
    }
    dyn.offsets[i] = dyn.offsets[i] * cfg.smoothing + target * (1.0 - cfg.smoothing);
  }

  dyn.impulse *= 0.88;

  const totalPts = M * 2;
  if (!dyn.points || dyn.points.length !== totalPts) {
    dyn.points = Array.from({ length: totalPts }, () => ({ x: 0, y: 0 }));
  }
  const points = dyn.points;
  let pIdx = 0;
  for (let i = 0; i <= M; i++) {
    const frac = i / M; const angle = -Math.PI / 2 + frac * Math.PI;
    const r = cfg.baseRadius + dyn.offsets[i];
    points[pIdx].x = cx + Math.cos(angle) * r;
    points[pIdx].y = cy + Math.sin(angle) * r;
    pIdx++;
  }
  for (let i = M - 1; i >= 1; i--) {
    const frac = i / M; const angle = -Math.PI / 2 - frac * Math.PI;
    const r = cfg.baseRadius + dyn.offsets[i];
    points[pIdx].x = cx + Math.cos(angle) * r;
    points[pIdx].y = cy + Math.sin(angle) * r;
    pIdx++;
  }

  const numPts = points.length;
  if (numPts < 3) return;

  const currentAlpha = isPlaying ? Math.min(cfg.activeAlpha, cfg.baseAlpha + dyn.energy * 3.2) : cfg.baseAlpha;

  function tracePath() {
    scopeCtx.beginPath();
    const firstMidX = (points[0].x + points[1].x) / 2;
    const firstMidY = (points[0].y + points[1].y) / 2;
    scopeCtx.moveTo(firstMidX, firstMidY);

    for (let i = 1; i < numPts; i++) {
      const nextPt = points[(i + 1) % numPts];
      const midX = (points[i].x + nextPt.x) / 2; const midY = (points[i].y + nextPt.y) / 2;
      scopeCtx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
    }
    scopeCtx.quadraticCurveTo(points[0].x, points[0].y, firstMidX, firstMidY);
  }

  scopeCtx.save();
  scopeCtx.strokeStyle = "rgba(8, 10, 14, 0.78)";
  scopeCtx.lineWidth = cfg.baseLineWidth + 1.8;
  scopeCtx.globalAlpha = Math.max(0.60, currentAlpha * 0.85);
  tracePath();
  scopeCtx.stroke();
  scopeCtx.restore();

  scopeCtx.save();
  scopeCtx.strokeStyle = cfg.color;
  scopeCtx.lineWidth = cfg.baseLineWidth;
  scopeCtx.globalAlpha = currentAlpha;
  scopeCtx.shadowColor = cfg.color;
  const isPhone = typeof PHONE_LAYOUT_MQ !== "undefined" && PHONE_LAYOUT_MQ.matches;
  const bloomRadius = (isPhone ? 5 : 8) + dyn.energy * (isPhone ? 9 : 14);
  scopeCtx.shadowBlur = bloomRadius;
  tracePath();
  scopeCtx.stroke();
  scopeCtx.restore();

  if (isPlaying && (dyn.energy > 0.06 || dyn.impulse > 0.08)) {
    scopeCtx.save();
    scopeCtx.strokeStyle = "rgba(255, 255, 255, 0.65)";
    scopeCtx.lineWidth = Math.max(0.7, cfg.baseLineWidth * 0.32);
    scopeCtx.globalAlpha = Math.min(0.75, dyn.energy * 1.8 + 0.15);
    tracePath();
    scopeCtx.stroke();
    scopeCtx.restore();
  }
}

function drawVisualizerCenterCore(cx, cy) {
  scopeCtx.save();
  const tick = 4;
  scopeCtx.beginPath();
  scopeCtx.moveTo(cx - tick, cy); scopeCtx.lineTo(cx + tick, cy);
  scopeCtx.moveTo(cx, cy - tick); scopeCtx.lineTo(cx, cy + tick);
  scopeCtx.strokeStyle = `rgba(${themeRgb("drone")}, 0.45)`; scopeCtx.lineWidth = 1.0;
  scopeCtx.stroke();

  const pulseR = 2.0 + Math.sin(scopeAngle * 3.0) * 0.7;
  scopeCtx.beginPath(); scopeCtx.arc(cx, cy, pulseR, 0, Math.PI * 2);
  scopeCtx.fillStyle = `rgba(${themeRgb("drone")}, 0.85)`; scopeCtx.fill();
  scopeCtx.restore();
}

function drawTanpuraResonance(cx, cy, fit) {
  if (typeof tanpuraEnabled === "undefined" || !tanpuraEnabled) return;
  if (!isPlaying && (typeof droneVol === "undefined" || droneVol <= 0.01)) return;

  const tVol = (typeof tanpuraVol !== "undefined" ? tanpuraVol : 0.45);
  const tStep = (typeof tanpuraStep !== "undefined" ? (tanpuraStep % 4) : 0);
  const baseR = 58; // Sits between Sub-Drone (46) and Drums (70)
  const pts = 64;

  scopeCtx.save();
  scopeCtx.beginPath();

  // Subtle pulsating 4-lobe harmonic Lissajous ring representing the 4 physical tanpura strings
  const pulse = Math.sin(scopeAngle * 4.5 + tStep * 1.57) * (3.5 * tVol);
  for (let i = 0; i <= pts; i++) {
    const theta = (i / pts) * Math.PI * 2;
    // 4-lobe harmonic overtone modulation
    const harmonicDisp = Math.cos(4 * theta + scopeAngle * 2.2) * (2.2 * tVol) + Math.sin(theta * 2 - scopeAngle) * 1.2;
    const r = baseR + harmonicDisp + pulse;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r;
    if (i === 0) scopeCtx.moveTo(x, y);
    else scopeCtx.lineTo(x, y);
  }
  scopeCtx.closePath();

  // Shimmering warm golden/amber glow
  scopeCtx.strokeStyle = "rgba(254, 211, 48, 0.65)";
  scopeCtx.lineWidth = 1.3;
  scopeCtx.shadowColor = "#fed330";
  scopeCtx.shadowBlur = 9 * tVol;
  scopeCtx.stroke();

  // 4 string harmonic nodal beacons
  for (let s = 0; s < 4; s++) {
    const sAngle = (s / 4) * Math.PI * 2 + scopeAngle * 0.8;
    const isPlucked = s === tStep;
    const sR = baseR + (isPlucked ? 4 : 0);
    const sx = cx + Math.cos(sAngle) * sR;
    const sy = cy + Math.sin(sAngle) * sR;
    scopeCtx.beginPath();
    scopeCtx.arc(sx, sy, isPlucked ? 3.5 : 1.8, 0, Math.PI * 2);
    scopeCtx.fillStyle = isPlucked ? "#ffffff" : "rgba(255, 121, 63, 0.85)";
    scopeCtx.shadowColor = isPlucked ? "#ffffff" : "#ff793f";
    scopeCtx.shadowBlur = isPlucked ? 12 : 5;
    scopeCtx.fill();
  }
  scopeCtx.restore();
}

// Video Blending & Synthesis Layer Hook
window.videoSynthesisCompositor = {
  activeEffect: "CRT_SUBTLE",
  applyPostProcessing(ctx, w, h) {
    if (this.activeEffect === "CRT_SUBTLE") {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.035)";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }
      ctx.restore();
    }
  }
};

function drawScope(ts) {
  currentAnalyserFrameId++;
  const now = performance.now();
  for (const [midi, info] of activeMidiNotes) {
    if (now > info.expiry) activeMidiNotes.delete(midi);
  }

  if (typeof updateSpatialDrift === "function") updateSpatialDrift(ts || now);

  if (document.hidden) {
    requestAnimationFrame(drawScope);
    return;
  }

  const isFsActive = (typeof scopeFullscreen !== "undefined" && scopeFullscreen) ||
    (typeof document !== "undefined" && !!document.getElementById("scopePanel") && document.getElementById("scopePanel").classList.contains("module-fullscreen-active"));
  if (scopeCanvasVisible || isFsActive) {
    updateWaterfallSpectrogram();
    const { w, h, cx, cy } = updateCanvasDimensions();
    if (fractalModeEnabled) {
      drawFractalVisualizer(w, h, ts || now);
    } else {
      scopeCtx.fillStyle = "#0c0d11"; scopeCtx.fillRect(0, 0, w, h);
    }
    drawWaterfallSpectrogram(w, h);
    drawFlightTerrainGrid(w, h);
    drawRoadsideObjects(w, h);
    if (window.videoSynthesisCompositor) {
      window.videoSynthesisCompositor.applyPostProcessing(scopeCtx, w, h);
    }

    // Tempo-synced rotation speed: a full revolution takes a fixed number of
    // beats, so the angular speed itself scales with bpm -- faster music spins
    // visibly faster. Keeps a faint drift (not a hard stop) while paused, to
    // match how the rest of the visualizer dims rather than freezes when idle.
    if (lastScopeFrameTs === null) lastScopeFrameTs = ts || now;
    const dtSec = Math.min(0.06, ((ts || now) - lastScopeFrameTs) / 1000);
    lastScopeFrameTs = ts || now;
    const beatsPerSec = bpm / 60;
    const revolutionBeats = 480; // one full 360 deg turn every 480 beats -- slow, "slight" rotation
    scopeRotationAngle += dtSec * beatsPerSec * (Math.PI * 2 / revolutionBeats) * (isPlaying ? 1 : 0.15);

    if (oscilloscopeRingsEnabled) {
      const fit = scopeFullscreen ? Math.min(2.3, Math.min(w, h) / 330) : Math.min(1, Math.min(w, h) / 360);
      scopeCtx.save();
      scopeCtx.translate(cx, cy); scopeCtx.scale(fit, fit); scopeCtx.rotate(scopeRotationAngle); scopeCtx.translate(-cx, -cy);
      drawReferenceTracks(cx, cy);
      RING_CONFIGS.forEach(cfg => { drawSymmetricalRing(cfg, cx, cy); });
      drawTanpuraResonance(cx, cy, fit);
      drawVisualizerCenterCore(cx, cy);
      scopeCtx.restore();
    }
    scopeAngle += dtSec * 0.48;
  } else {
    lastScopeFrameTs = ts || now;
  }

  if (typeof drawChordWheelCard === "function") drawChordWheelCard();

  if (now - lastScopeDomThrottleTs >= 32) {
    lastScopeDomThrottleTs = now;
    if (typeof updateInstrumentMeters === "function") updateInstrumentMeters();
    if (typeof renderKeyboardHighlights === "function") renderKeyboardHighlights();
  }

  requestAnimationFrame(drawScope);
}
requestAnimationFrame(drawScope);
