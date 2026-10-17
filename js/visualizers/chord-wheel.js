// Slambient — Circle of Fifths & Chord Analysis Visualizer Module
// Handles active pitch-class wheel geometry, compass rim rendering, and instrument telemetry

var FALLBACK_THEME_HEX = typeof FALLBACK_THEME_HEX !== "undefined" ? FALLBACK_THEME_HEX : {
  drone: "#00e5ff", drum: "#ff3838", chord: "#fed330", arp: "#7d5fff", noise: "#1dd1a1",
  field: "#2bcbba", filter: "#2ed573", delay: "#ff793f", reverb: "#ff5fc4", space: "#4b7bec"
};
var FALLBACK_THEME_RGB = typeof FALLBACK_THEME_RGB !== "undefined" ? FALLBACK_THEME_RGB : {
  drone: [0, 229, 255], drum: [255, 56, 56], chord: [254, 211, 48], arp: [125, 95, 255], noise: [29, 209, 161],
  field: [43, 203, 186], filter: [46, 213, 115], delay: [255, 121, 63], reverb: [255, 95, 196], space: [75, 123, 236]
};
function themeHex(key) {
  return (typeof activeTheme !== "undefined" && activeTheme && activeTheme.hex && activeTheme.hex[key]) || (FALLBACK_THEME_HEX && FALLBACK_THEME_HEX[key]) || "#ffffff";
}
function themeRgbArr(key) {
  return ((typeof activeTheme !== "undefined" && activeTheme && activeTheme.rgb && activeTheme.rgb[key]) || (FALLBACK_THEME_RGB && FALLBACK_THEME_RGB[key]) || [255, 255, 255]).slice();
}
function themeRgb(key) { return themeRgbArr(key).join(", "); }

var chordWheelCanvas = typeof document !== "undefined" ? document.getElementById("chordWheelCanvas") : null;
var chordWheelCtx = chordWheelCanvas ? chordWheelCanvas.getContext("2d") : null;

let lastChordWheelSignature = "";
function drawChordWheelCard() {
  if (!chordWheelCanvas && typeof document !== "undefined") {
    chordWheelCanvas = document.getElementById("chordWheelCanvas");
    if (chordWheelCanvas) chordWheelCtx = chordWheelCanvas.getContext("2d");
  }
  if (!chordWheelCanvas || !chordWheelCtx) return;

  updateInstrumentMeters();

  const isPhone = typeof PHONE_LAYOUT_MQ !== "undefined" && PHONE_LAYOUT_MQ.matches;
  const chordPanelEl = typeof document !== "undefined" ? document.getElementById("chordInfoPanel") : null;
  const isFullscreen = !!(chordPanelEl && chordPanelEl.classList.contains("module-fullscreen-active"));
  const manualSig = (isManualChordActive && liveActiveChord)
    ? `${liveActiveChord.rootMidi}:${liveActiveChord.chordQuality}:${liveActiveChord.sortedNotes.join(",")}`
    : "auto";
  const themeSig = (typeof activeTheme !== "undefined" && activeTheme) ? `${activeTheme.id}:${themeHex("chord")}:${themeHex("arp")}:${themeHex("drone")}:${themeHex("field")}` : "";
  const tanpuraSig = (typeof tanpuraEnabled !== "undefined" && tanpuraEnabled && typeof isPlaying !== "undefined" && isPlaying) ? `tanpura:${typeof tanpuraTuning !== "undefined" ? tanpuraTuning : "PA"}:${typeof tanpuraStep !== "undefined" ? (tanpuraStep % 4) : 0}` : "no-tanpura";

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let cssSize, wheelK;
  if (isFullscreen) {
    // In fullscreen focus modal, dynamically expand wheel canvas up to ~400px
    const availableSpace = typeof window !== "undefined" ? Math.min(window.innerWidth - 64, window.innerHeight - 300) : 400;
    cssSize = Math.min(400, Math.max(300, Math.round(availableSpace)));
    wheelK = cssSize / 144;
  } else {
    // Phones draw the wheel 1.44x (207px) so its note names and geometry are large and crisp.
    wheelK = isPhone ? 1.44 : 1;
    cssSize = Math.round(144 * wheelK);
  }
  const targetBuffer = Math.round(cssSize * dpr);

  const sig = `${rootNote}|${activeScaleKey}|${currentChordVoicing}|${currentChordRootStep}|${currentChordDeg}|${manualSig}|${themeSig}|${tanpuraSig}|${isPhone ? 1 : 0}|${isFullscreen ? 1 : 0}|${cssSize}`;
  if (sig === lastChordWheelSignature) return;
  lastChordWheelSignature = sig;

  if (chordWheelCanvas.width !== targetBuffer || chordWheelCanvas.height !== targetBuffer || chordWheelCanvas.style.width !== (cssSize + "px")) {
    chordWheelCanvas.width = targetBuffer;
    chordWheelCanvas.height = targetBuffer;
    chordWheelCanvas.style.width = cssSize + "px";
    chordWheelCanvas.style.height = cssSize + "px";
  }
  chordWheelCtx.resetTransform();
  chordWheelCtx.scale(dpr * wheelK, dpr * wheelK);

  const size = 144;
  const w = size; const h = size; const cx = w / 2; const cy = h / 2;
  chordWheelCtx.clearRect(0, 0, w, h);

  let activeIntervals, rawIntervals, chordRootName, chordWesternQuality, chordVoicingName, activePitchClasses = [], rootPitchClass = 0;
  const isLive = isManualChordActive && !!liveActiveChord;

  if (isLive) {
    rawIntervals = liveActiveChord.intervals;
    activeIntervals = liveActiveChord.intervals;
    chordRootName = liveActiveChord.rootName;
    chordWesternQuality = liveActiveChord.westernQuality !== undefined
      ? liveActiveChord.westernQuality
      : getWesternChordQuality(liveActiveChord.intervals);
    chordVoicingName = liveActiveChord.voicingLabel || `Live Keyboard (${liveActiveChord.chordQuality})`;
    rootPitchClass = liveActiveChord.rootMidi % 12;
    activePitchClasses = Array.from(new Set(liveActiveChord.sortedNotes.map(m => m % 12)));
  } else {
    const voicing = getActiveVoicingObject(currentChordVoicing, activeScaleKey);
    const scale = SCALES[activeScaleKey] || [0, 2, 4, 5, 7, 9, 11];
    const voicingIntervals = getVoicingIntervals(voicing, scale, currentChordRootStep);
    const activeRootMidi = (rootNote + currentChordDeg) % 12;
    rawIntervals = voicingIntervals;
    chordRootName = NOTE_NAMES[activeRootMidi];
    chordWesternQuality = getWesternChordQuality(voicingIntervals);
    chordVoicingName = getVoicingDisplayName(voicing);
    activeIntervals = voicingIntervals.map(semi => (semi % 12));
    rootPitchClass = activeRootMidi % 12;
    activePitchClasses = Array.from(new Set(voicingIntervals.map(iv => (rootPitchClass + iv) % 12)));
  }

  const rootCofIdx = (rootPitchClass * 7) % 12;
  const activeCofIndices = Array.from(new Set(activePitchClasses.map(pc => (pc * 7) % 12))).sort((a, b) => a - b);
  const activeCofSet = new Set(activeCofIndices);

  const rimR = 65;
  const dotR = 42;
  const labelR = 54.5;

  // Subtle ambient radial halo inside the Circle of Fifths
  const bgGrad = chordWheelCtx.createRadialGradient(cx, cy, 2, cx, cy, rimR);
  bgGrad.addColorStop(0, `rgba(${themeRgb("chord")}, 0.13)`);
  bgGrad.addColorStop(0.58, `rgba(${themeRgb("arp")}, 0.05)`);
  bgGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  chordWheelCtx.beginPath(); chordWheelCtx.arc(cx, cy, rimR, 0, Math.PI * 2);
  chordWheelCtx.fillStyle = bgGrad; chordWheelCtx.fill();

  // Outer compass ring
  chordWheelCtx.beginPath(); chordWheelCtx.arc(cx, cy, rimR, 0, Math.PI * 2);
  chordWheelCtx.strokeStyle = `rgba(${themeRgb("chord")}, 0.32)`; chordWheelCtx.lineWidth = 1.1; chordWheelCtx.stroke();

  // Inner harmonic orbit ring
  chordWheelCtx.beginPath(); chordWheelCtx.arc(cx, cy, dotR, 0, Math.PI * 2);
  chordWheelCtx.strokeStyle = `rgba(${themeRgb("drone")}, 0.16)`; chordWheelCtx.lineWidth = 0.85; chordWheelCtx.stroke();

  // Resonant Indian Tanpura drone aura & 4-string tuning nodes
  if (typeof tanpuraEnabled !== "undefined" && tanpuraEnabled && (typeof isPlaying !== "undefined" && isPlaying) && (typeof tanpuraVol !== "undefined" && tanpuraVol > 0.01)) {
    const tRad = dotR * 0.70;
    chordWheelCtx.save();
    chordWheelCtx.beginPath();
    chordWheelCtx.arc(cx, cy, tRad, 0, Math.PI * 2);
    chordWheelCtx.strokeStyle = "rgba(254, 211, 48, 0.45)";
    chordWheelCtx.lineWidth = 1.2;
    chordWheelCtx.setLineDash([2, 3]);
    chordWheelCtx.stroke();
    chordWheelCtx.setLineDash([]);

    // 4-String resonant tuning nodes (String 1: Pa/Ma/Ni, Strings 2 & 3: Sa, String 4: Kharaj Sa)
    const tIntervals = (typeof tanpuraTuning !== "undefined" && tanpuraTuning === "MA") ? [5, 12, 12, 0] : ((typeof tanpuraTuning !== "undefined" && tanpuraTuning === "NI") ? [11, 12, 12, 0] : [7, 12, 12, 0]);
    tIntervals.forEach((iv, sIdx) => {
      const pc = (rootPitchClass + iv) % 12;
      const cof = (pc * 7) % 12;
      const sAngle = -Math.PI / 2 + (cof / 12) * Math.PI * 2;
      const sx = cx + Math.cos(sAngle) * tRad;
      const sy = cy + Math.sin(sAngle) * tRad;
      const isCur = sIdx === (typeof tanpuraStep !== "undefined" ? (tanpuraStep % 4) : 0);
      chordWheelCtx.beginPath();
      chordWheelCtx.arc(sx, sy, isCur ? 3.6 : 2.0, 0, Math.PI * 2);
      chordWheelCtx.fillStyle = isCur ? "#fed330" : "rgba(255, 121, 63, 0.70)";
      chordWheelCtx.fill();
    });
    chordWheelCtx.restore();
  }

  // Center harmonic reticle
  chordWheelCtx.beginPath();
  chordWheelCtx.moveTo(cx - 4, cy); chordWheelCtx.lineTo(cx + 4, cy);
  chordWheelCtx.moveTo(cx, cy - 4); chordWheelCtx.lineTo(cx, cy + 4);
  chordWheelCtx.strokeStyle = `rgba(${themeRgb("drone")}, 0.32)`; chordWheelCtx.lineWidth = 0.8; chordWheelCtx.stroke();
  chordWheelCtx.beginPath(); chordWheelCtx.arc(cx, cy, 1.6, 0, Math.PI * 2);
  chordWheelCtx.fillStyle = `rgba(${themeRgb("drone")}, 0.65)`; chordWheelCtx.fill();

  // Radial spokes from center to active chord tones
  activeCofIndices.forEach((cofIdx) => {
    const angle = -Math.PI / 2 + (cofIdx / 12) * Math.PI * 2;
    const px = cx + Math.cos(angle) * dotR;
    const py = cy + Math.sin(angle) * dotR;
    const isRoot = cofIdx === rootCofIdx;
    chordWheelCtx.beginPath();
    chordWheelCtx.moveTo(cx, cy);
    chordWheelCtx.lineTo(px, py);
    chordWheelCtx.strokeStyle = isRoot ? `rgba(${themeRgb("chord")}, 0.38)` : `rgba(${themeRgb("arp")}, 0.22)`;
    chordWheelCtx.lineWidth = isRoot ? 1.15 : 0.8;
    chordWheelCtx.stroke();
  });

  if (activeCofIndices.length >= 2) {
    chordWheelCtx.beginPath();
    activeCofIndices.forEach((cofIdx, idx) => {
      const angle = -Math.PI / 2 + (cofIdx / 12) * Math.PI * 2;
      const px = cx + Math.cos(angle) * dotR;
      const py = cy + Math.sin(angle) * dotR;
      if (idx === 0) chordWheelCtx.moveTo(px, py);
      else chordWheelCtx.lineTo(px, py);
    });
    chordWheelCtx.closePath();
    const polyGrad = chordWheelCtx.createLinearGradient(cx - dotR, cy - dotR, cx + dotR, cy + dotR);
    polyGrad.addColorStop(0, `rgba(${themeRgb("chord")}, 0.24)`);
    polyGrad.addColorStop(1, `rgba(${themeRgb("arp")}, 0.15)`);
    chordWheelCtx.fillStyle = polyGrad; chordWheelCtx.fill();
    chordWheelCtx.strokeStyle = themeHex("chord"); chordWheelCtx.lineWidth = 1.6; chordWheelCtx.stroke();
  }

  chordWheelCtx.textAlign = "center";
  chordWheelCtx.textBaseline = "middle";

  for (let k = 0; k < 12; k++) {
    const angle = -Math.PI / 2 + (k / 12) * Math.PI * 2;
    const cosA = Math.cos(angle), sinA = Math.sin(angle);
    const px = cx + cosA * dotR;
    const py = cy + sinA * dotR;
    const lx = cx + cosA * labelR;
    const ly = cy + sinA * labelR;

    const isChordTone = activeCofSet.has(k);
    const isRootTone = (k === rootCofIdx);

    // Outer compass rim tick
    chordWheelCtx.beginPath();
    chordWheelCtx.moveTo(cx + cosA * (rimR - 2.5), cy + sinA * (rimR - 2.5));
    chordWheelCtx.lineTo(cx + cosA * rimR, cy + sinA * rimR);
    chordWheelCtx.strokeStyle = isRootTone ? "#ffffff" : (isChordTone ? `rgba(${themeRgb("chord")}, 0.60)` : "rgba(255, 255, 255, 0.13)");
    chordWheelCtx.lineWidth = isRootTone ? 1.4 : 0.8;
    chordWheelCtx.stroke();

    const tickIn = dotR - 2.5;
    const tickOut = dotR + (isRootTone ? 7.0 : (isChordTone ? 4.5 : 2.0));
    chordWheelCtx.beginPath();
    chordWheelCtx.moveTo(cx + cosA * tickIn, cy + sinA * tickIn);
    chordWheelCtx.lineTo(cx + cosA * tickOut, cy + sinA * tickOut);
    chordWheelCtx.strokeStyle = isRootTone ? "#ffffff" : (isChordTone ? themeHex("chord") : "rgba(255, 255, 255, 0.12)");
    chordWheelCtx.lineWidth = isRootTone ? 1.6 : (isChordTone ? 1.25 : 0.65);
    chordWheelCtx.stroke();

    chordWheelCtx.beginPath();
    if (isRootTone) {
      chordWheelCtx.arc(px, py, 6.5, 0, Math.PI * 2);
      chordWheelCtx.strokeStyle = `rgba(${themeRgb("chord")}, 0.75)`;
      chordWheelCtx.lineWidth = 1.35;
      chordWheelCtx.stroke();

      chordWheelCtx.beginPath();
      chordWheelCtx.arc(px, py, 3.6, 0, Math.PI * 2);
      chordWheelCtx.fillStyle = "#ffffff";
      chordWheelCtx.fill();
    } else if (isChordTone) {
      chordWheelCtx.arc(px, py, 4.5, 0, Math.PI * 2);
      chordWheelCtx.fillStyle = `rgba(${themeRgb("chord")}, 0.24)`;
      chordWheelCtx.fill();

      chordWheelCtx.beginPath();
      chordWheelCtx.arc(px, py, 2.6, 0, Math.PI * 2);
      chordWheelCtx.fillStyle = themeHex("chord");
      chordWheelCtx.fill();
    } else {
      chordWheelCtx.arc(px, py, 1.2, 0, Math.PI * 2);
      chordWheelCtx.fillStyle = "rgba(255, 255, 255, 0.18)";
      chordWheelCtx.fill();
    }

    const rootFontSize = isFullscreen ? 12.5 : 11.5;
    const chordFontSize = isFullscreen ? 10.8 : 10;
    const dimFontSize = isFullscreen ? 9.0 : 8.5;
    chordWheelCtx.font = isRootTone 
      ? `800 ${rootFontSize}px "JetBrains Mono", ui-monospace, monospace` 
      : (isChordTone ? `700 ${chordFontSize}px "JetBrains Mono", ui-monospace, monospace` : `500 ${dimFontSize}px "JetBrains Mono", ui-monospace, monospace`);
    chordWheelCtx.fillStyle = isRootTone ? "#ffffff" : (isChordTone ? themeHex("chord") : "rgba(255, 255, 255, 0.32)");
    chordWheelCtx.fillText(CIRCLE_OF_FIFTHS[k], lx, ly);
  }

  if (document.getElementById("cardChordRoot")) document.getElementById("cardChordRoot").textContent = chordRootName;
  if (document.getElementById("cardChordQuality")) document.getElementById("cardChordQuality").textContent = chordWesternQuality;
  if (document.getElementById("cardChordMode")) document.getElementById("cardChordMode").textContent = getScaleDisplayBadge(activeScaleKey, isLive);
  if (document.getElementById("cardChordVoicing")) {
    const vObj = !isLive ? getActiveVoicingObject(currentChordVoicing, activeScaleKey) : null;
    document.getElementById("cardChordVoicing").innerHTML = formatChordVoicingSubtitleHTML(vObj || chordVoicingName);
  }

  let toneHtml, intervalLabels;
  if (isLive) {
    toneHtml = liveActiveChord.sortedNotes.map((m, idx) => {
      const lbl = `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
      return idx === 0 ? `<span class="tone-root">${lbl}</span>` : lbl;
    }).join('<span class="tone-dot"> · </span>');
    intervalLabels = liveActiveChord.intervals.map(iv => getIntervalLabel(iv)).join(" · ");
  } else {
    const rootMidi = 48 + rootNote + currentChordDeg;
    toneHtml = rawIntervals.map((iv, idx) => {
      const m = rootMidi + iv; const oct = Math.floor(m / 12) - 1;
      const lbl = `${NOTE_NAMES[m % 12]}${oct}`;
      return idx === 0 ? `<span class="tone-root">${lbl}</span>` : lbl;
    }).join('<span class="tone-dot"> · </span>');
    intervalLabels = rawIntervals.map(iv => getIntervalLabel(iv)).join(" · ");
  }

  if (document.getElementById("telemTones")) document.getElementById("telemTones").innerHTML = toneHtml;
  if (document.getElementById("telemIntervals")) document.getElementById("telemIntervals").textContent = intervalLabels;
}

// Chord Analysis activity bars. Reuses the per-frame analyser sampler so
// droneAnalyser / drumAnalyser / chordAnalyser / arpAnalyser are only read
// once per frame even when both the oscilloscope rings and meters are active.
const INSTRUMENT_METERS = [
  { el: "lvlDrone", ring: "drone",    ref: 0.30, e: 0, barEl: null, lastPct: -1 },
  { el: "lvlDrum",  ring: "drum",     ref: 0.30, e: 0, barEl: null, lastPct: -1 },
  { el: "lvlChord", ring: "chord",    ref: 0.08, e: 0, barEl: null, lastPct: -1 },
  { el: "lvlArp",   ring: "arp_main", ref: 0.04, e: 0, barEl: null, lastPct: -1 }
];
function updateInstrumentMeters() {
  for (const m of INSTRUMENT_METERS) {
    if (!m.barEl) m.barEl = document.getElementById(m.el);
    const bar = m.barEl;
    if (!bar) continue;
    const cfg = RING_CONFIGS.find(c => c.id === m.ring);
    const analyser = isPlaying && cfg ? cfg.getAnalyser() : null;
    let energy = 0;
    const sampled = sampleAnalyserForFrame(analyser);
    if (sampled && cfg) {
      const timeBuf = sampled.time, freqBuf = sampled.freq;
      const n = timeBuf.length;
      let sumSq = 0, band = 0;
      for (let i = 0; i < n; i++) {
        const d = (timeBuf[i] - 128) / 128;
        sumSq += d * d;
        if (i >= cfg.fLow && i <= cfg.fHigh) band += freqBuf[i];
      }
      energy = Math.sqrt(sumSq / n) * 0.55 + (band / ((cfg.fHigh - cfg.fLow + 1) * 255)) * 0.45;
    }
    m.e = m.e * 0.76 + energy * 0.24;
    const pct = Math.min(100, Math.round(Math.pow(m.e / m.ref, 0.65) * 100));
    if (m.lastPct !== pct) {
      m.lastPct = pct;
      bar.style.width = pct + "%";
    }
  }
}

// Interactive Chord Analysis Scale Mode Picker Popover
const SCALE_PICKER_OPTIONS = [
  { key: "DORIAN", label: "Dorian", desc: "Soulful, nocturnal modal jazz" },
  { key: "LYDIAN", label: "Lydian", desc: "Ethereal raised 4th celestial" },
  { key: "AEOLIAN", label: "Aeolian", desc: "Natural minor, melancholic" },
  { key: "MIXOLYDIAN", label: "Mixolydian", desc: "Warm pastoral dominant" },
  { key: "PENTATONIC", label: "Pentatonic Minor", desc: "Universal blues / ambient" },
  { key: "MAJOR9", label: "Major 9th", desc: "Lush celestial dream pop" },
  { key: "HIRAJOSHI", label: "Hirajoshi", desc: "Traditional Japanese ambient" },
  { key: "INSEN", label: "Insen", desc: "Meditative shakuhachi temple" },
  { key: "LYDIAN_DOM", label: "Lydian Dominant", desc: "Overtone / acoustic space" },
  { key: "PHRYGIAN", label: "Phrygian", desc: "Dark meditative Eastern drone" },
  { key: "WHOLE_TONE", label: "Whole Tone", desc: "Impressionist floating clouds" },
  { key: "MAJ_PENTATONIC", label: "Maj Pentatonic", desc: "Pure pastoral bright peace" },
  { key: "BILAWAL", label: "Bilawal Thaat", desc: "Indian Classical Major Raga" },
  { key: "BHAIRAV", label: "Bhairav Raga", desc: "Sacred Indian morning raga" }
];

let scalePickerPopoverEl = null;

function toggleScalePicker(e) {
  if (e) { e.stopPropagation(); e.preventDefault(); }
  const modePill = document.getElementById("cardChordMode");
  if (!modePill) return;

  if (scalePickerPopoverEl) {
    scalePickerPopoverEl.remove();
    scalePickerPopoverEl = null;
    return;
  }

  const popover = document.createElement("div");
  popover.className = "chord-scale-popover";
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "Select Musical Scale Mode");

  SCALE_PICKER_OPTIONS.forEach(opt => {
    const item = document.createElement("div");
    item.className = "chord-scale-item" + (activeScaleKey === opt.key ? " active" : "");
    item.dataset.scale = opt.key;

    const name = document.createElement("div");
    name.className = "chord-scale-name";
    name.textContent = opt.label;

    const desc = document.createElement("div");
    desc.className = "chord-scale-desc";
    desc.textContent = opt.desc;

    item.appendChild(name);
    item.appendChild(desc);

    item.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      if (typeof syncScaleMode === "function") {
        syncScaleMode(opt.key);
      } else {
        activeScaleKey = opt.key;
        if (typeof updateMusicalConfig === "function") updateMusicalConfig(true);
      }
      lastChordWheelSignature = "";
      drawChordWheelCard();
      popover.remove();
      scalePickerPopoverEl = null;
    });

    popover.appendChild(item);
  });

  const parent = modePill.closest(".chord-wheel-header") || modePill.parentElement;
  if (parent) {
    parent.style.position = "relative";
    parent.appendChild(popover);
  }
  scalePickerPopoverEl = popover;

  const closeHandler = (ev) => {
    if (scalePickerPopoverEl && !scalePickerPopoverEl.contains(ev.target) && ev.target !== modePill) {
      scalePickerPopoverEl.remove();
      scalePickerPopoverEl = null;
      document.removeEventListener("pointerdown", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("pointerdown", closeHandler), 10);
}

// Bind click / tap to #cardChordMode
(function initChordWheelModeInteraction() {
  const init = () => {
    const modePill = document.getElementById("cardChordMode");
    if (modePill && !modePill.dataset.pickerBound) {
      modePill.dataset.pickerBound = "true";
      modePill.setAttribute("role", "button");
      modePill.setAttribute("tabindex", "0");
      modePill.setAttribute("title", "Click to choose musical scale / mode");
      modePill.addEventListener("click", toggleScalePicker);
      modePill.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleScalePicker(e);
        }
      });
    }
  };
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  }
})();
