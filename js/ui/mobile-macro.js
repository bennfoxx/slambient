// Slambient — Mobile Macro Grid & Touch Telemetry Module
// Handles 2-column mobile macro tiles, fast bypass/power toggles, and live responsive audio meters

/* ==========================================================================
   MOBILE MACRO OVERVIEW GRID (PHASE 5: 2-COLUMN ~110PX SUMMARY TILES)
   ========================================================================== */
var MOBILE_MACRO_MODULES = [
  { id: "drone",  name: "1. SUB",    orbId: "drone",  color: "#00e5ff", rgb: [0, 229, 255],   type: "inst" },
  { id: "drum",   name: "2. DRUMS",  orbId: "drum",   color: "#ff3838", rgb: [255, 56, 56],   type: "inst" },
  { id: "chord",  name: "3. CHORDS", orbId: "chord",  color: "#fed330", rgb: [254, 211, 48],  type: "inst" },
  { id: "arp",    name: "4. ARP",    orbId: "arp",    color: "#7d5fff", rgb: [125, 95, 255],  type: "inst" },
  { id: "noise",  name: "5. NOISE",  orbId: "noise",  color: "#1dd1a1", rgb: [29, 209, 161],  type: "inst" },
  { id: "field",  name: "6. FIELD",  orbId: "field",  color: "#2bcbba", rgb: [43, 203, 186],  type: "inst" },
  { id: "FILTER", name: "7. FILTER", orbId: "filter", color: "#2ed573", rgb: [46, 213, 115],  type: "fx" },
  { id: "DELAY",  name: "8. DELAY",  orbId: "delay",  color: "#ff793f", rgb: [255, 121, 63],  type: "fx" },
  { id: "SPACE",  name: "9. SPACE",  orbId: "reverb", color: "#ff5fc4", rgb: [255, 95, 196],  type: "fx" },
  { id: "space",  name: "10. OUT",   orbId: "space",  color: "#4b7bec", rgb: [75, 123, 236], type: "master" }
];

var MOBILE_MACRO_METERS = [
  { id: "drone",  orbId: "drone",  type: "inst", ref: 0.26, fLow: 1,  fHigh: 20,  e: 0, lastPct: -1, getAnalyser: () => droneAnalyser },
  { id: "drum",   orbId: "drum",   type: "inst", ref: 0.26, fLow: 4,  fHigh: 45,  e: 0, lastPct: -1, getAnalyser: () => drumAnalyser },
  { id: "chord",  orbId: "chord",  type: "inst", ref: 0.075, fLow: 12, fHigh: 85,  e: 0, lastPct: -1, getAnalyser: () => chordAnalyser },
  { id: "arp",    orbId: "arp",    type: "inst", ref: 0.038, fLow: 28, fHigh: 125, e: 0, lastPct: -1, getAnalyser: () => arpAnalyser },
  { id: "noise",  orbId: "noise",  type: "inst", ref: 0.055, fLow: 10, fHigh: 110, e: 0, lastPct: -1, getAnalyser: () => noiseAnalyser },
  { id: "field",  orbId: "field",  type: "inst", ref: 0.07,  fLow: 8,  fHigh: 120, e: 0, lastPct: -1, getAnalyser: () => (typeof fieldAnalyser !== "undefined" ? fieldAnalyser : noiseAnalyser) },
  { id: "FILTER", orbId: "filter", type: "fx",   ref: 0.11,  fLow: 10, fHigh: 80,  e: 0, lastPct: -1, getAnalyser: () => (typeof filterAnalyser !== "undefined" ? filterAnalyser : masterAnalyser) },
  { id: "DELAY",  orbId: "delay",  type: "fx",   ref: 0.09,  fLow: 18, fHigh: 95,  e: 0, lastPct: -1, getAnalyser: () => (typeof delayAnalyser !== "undefined" ? delayAnalyser : masterAnalyser) },
  { id: "SPACE",  orbId: "reverb", type: "fx",   ref: 0.085, fLow: 25, fHigh: 130, e: 0, lastPct: -1, getAnalyser: () => (typeof spaceAnalyser !== "undefined" ? spaceAnalyser : masterAnalyser) },
  { id: "space",  orbId: "space",  type: "master", ref: 0.20, fLow: 1, fHigh: 140, e: 0, lastPct: -1, getAnalyser: () => masterAnalyser }
];

function getModuleCurrentPresetOrTimbre(modId) {
  let text = "DEFAULT";
  if (modId === "drone") {
    const sel = document.getElementById("selDroneTimbre");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Sub Bass";
  } else if (modId === "drum") {
    const sel = document.getElementById("selDrumStyle");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Organic Kit";
  } else if (modId === "chord") {
    const sel = document.getElementById("selChordTimbre");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Warm Pad";
  } else if (modId === "arp") {
    const sel = document.getElementById("selArpTimbre");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Kalimba";
  } else if (modId === "noise") {
    const sel = document.getElementById("selNoiseProfile");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Rain Dust";
  } else if (modId === "field") {
    const sel = document.getElementById("selFieldMode");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Weave All";
  } else if (modId === "FILTER") {
    const sel = document.getElementById("selFilterTopology");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "24dB Ladder";
  } else if (modId === "DELAY") {
    const sel = document.getElementById("selDelayEngine");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Tape Delay";
  } else if (modId === "SPACE") {
    const sel = document.getElementById("selReverbMode");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Cathedral";
  } else if (modId === "space") {
    text = "Master Bus";
  }
  // Truncate to max 15 chars per architectural specification
  const clean = text.replace(/\(.*\)/, "").trim();
  return clean.length > 15 ? clean.slice(0, 15) : clean;
}

function renderMobileMacroGrid() {
  const grid = document.getElementById("mobileMacroGrid");
  if (!grid) return;

  // Sync pedal numbering and order from dspChainOrder
  const pedalsOrder = Array.isArray(dspChainOrder) ? dspChainOrder : ["FILTER", "DELAY", "SPACE"];
  const pedalMetaMap = {
    FILTER: { orbId: "filter", color: "#2ed573", rgb: [46, 213, 115] },
    DELAY:  { orbId: "delay",  color: "#ff793f", rgb: [255, 121, 63] },
    SPACE:  { orbId: "reverb", color: "#ff5fc4", rgb: [255, 95, 196] }
  };

  const dynamicModules = [
    { id: "drone",  name: "1. SUB",    orbId: "drone",  color: "#00e5ff", rgb: [0, 229, 255],   type: "inst" },
    { id: "drum",   name: "2. DRUMS",  orbId: "drum",   color: "#ff3838", rgb: [255, 56, 56],   type: "inst" },
    { id: "chord",  name: "3. CHORDS", orbId: "chord",  color: "#fed330", rgb: [254, 211, 48],  type: "inst" },
    { id: "arp",    name: "4. ARP",    orbId: "arp",    color: "#7d5fff", rgb: [125, 95, 255],  type: "inst" },
    { id: "noise",  name: "5. NOISE",  orbId: "noise",  color: "#1dd1a1", rgb: [29, 209, 161],  type: "inst" },
    { id: "field",  name: "6. FIELD",  orbId: "field",  color: "#2bcbba", rgb: [43, 203, 186],  type: "inst" }
  ];

  pedalsOrder.forEach((pkey, idx) => {
    const meta = pedalMetaMap[pkey] || { orbId: pkey.toLowerCase(), color: "#2ed573", rgb: [46, 213, 115] };
    const num = 7 + idx;
    dynamicModules.push({
      id: pkey,
      name: `${num}. ${pkey}`,
      orbId: meta.orbId,
      color: meta.color,
      rgb: meta.rgb,
      type: "fx"
    });
  });

  dynamicModules.push({ id: "space", name: "10. OUT", orbId: "space", color: "#4b7bec", rgb: [75, 123, 236], type: "master" });

  let html = "";
  dynamicModules.forEach(mod => {
    let isPowered = true;
    if (mod.type === "inst") {
      isPowered = channelPower[mod.id] !== false;
    } else if (mod.type === "fx") {
      isPowered = !(typeof pedalBypassState !== "undefined" && pedalBypassState[mod.id]);
    }

    const presetName = getModuleCurrentPresetOrTimbre(mod.id);
    const tileColor = (typeof themeHex === "function" ? themeHex(mod.orbId) : null) || mod.color;
    const tileRgb = (typeof themeRgb === "function" ? themeRgb(mod.orbId) : null) || (Array.isArray(mod.rgb) ? mod.rgb.join(',') : "0, 229, 255");

    html += `
      <div class="mobile-macro-tile" data-orb-id="${mod.orbId}" onclick="openMiniPedalInspector('${mod.orbId}', event)" style="--tile-color: var(--color-${mod.orbId}, ${tileColor}); --tile-rgb: var(--rgb-${mod.orbId}, ${tileRgb}); --tile-glow: rgba(var(--rgb-${mod.orbId}, ${tileRgb}), 0.35);">
        <div class="mobile-macro-tile-header">
          <span class="mobile-macro-tile-title">${mod.name}</span>
          ${mod.type !== 'master' ? `
            <button type="button" class="mobile-macro-tile-pwr ${isPowered ? 'active' : ''}" onclick="toggleMacroTilePower('${mod.id}', '${mod.type}', event)" title="Toggle Power">PWR</button>
          ` : `
            <span class="mobile-macro-tile-inspect-hint">TERM</span>
          `}
        </div>
        <div class="mobile-macro-tile-body">
          <span class="mobile-macro-tile-preset">${presetName}</span>
          <div class="mobile-macro-tile-footer">
            <div class="mobile-macro-tile-meter-wrap">
              <div class="mobile-macro-tile-meter-bar" id="macroMeter_${mod.orbId}"></div>
            </div>
            <span class="mobile-macro-tile-inspect-hint">EDIT ↗</span>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
  if (Array.isArray(MOBILE_MACRO_METERS)) {
    MOBILE_MACRO_METERS.forEach(m => { m.lastPct = -1; });
  }
}

function toggleMacroTilePower(modId, type, ev) {
  if (ev) {
    if (typeof ev.stopPropagation === "function") ev.stopPropagation();
    if (typeof ev.preventDefault === "function") ev.preventDefault();
  }
  if (type === "inst") {
    toggleChannelPower(modId);
  } else if (type === "fx") {
    togglePedalBypass(modId, ev);
  }
  renderMobileMacroGrid();
}

function updateMobileMacroMeterValues() {
  if (document.hidden || !PHONE_LAYOUT_MQ.matches) return;
  const grid = document.getElementById("mobileMacroGrid");
  if (!grid) return;

  const active = isPlaying && audioCtx && audioCtx.state === "running";

  for (let i = 0; i < MOBILE_MACRO_METERS.length; i++) {
    const m = MOBILE_MACRO_METERS[i];
    const bar = document.getElementById("macroMeter_" + m.orbId);
    if (!bar) continue;

    let isPowered = true;
    if (m.type === "inst") {
      isPowered = (typeof channelPower !== "undefined" && channelPower[m.id] !== false) && !(typeof channelMute !== "undefined" && channelMute[m.id]);
    } else if (m.type === "fx") {
      isPowered = !(typeof pedalBypassState !== "undefined" && pedalBypassState[m.id]);
    }

    let energy = 0;
    if (active && isPowered) {
      const an = m.getAnalyser ? m.getAnalyser() : null;
      const sampled = typeof sampleAnalyserForFrame === "function" ? sampleAnalyserForFrame(an) : null;
      if (sampled) {
        const timeBuf = sampled.time, freqBuf = sampled.freq;
        const n = timeBuf.length;
        let sumSq = 0, band = 0;
        for (let k = 0; k < n; k++) {
          const d = (timeBuf[k] - 128) / 128;
          sumSq += d * d;
          if (k >= m.fLow && k <= m.fHigh) band += freqBuf[k];
        }
        energy = Math.sqrt(sumSq / n) * 0.55 + (band / ((m.fHigh - m.fLow + 1) * 255)) * 0.45;
      }
    }

    // Snappy attack on note/drum strike for instant tactile response; smooth natural release
    if (energy > m.e) {
      m.e = m.e * 0.40 + energy * 0.60;
    } else {
      m.e = m.e * 0.78 + energy * 0.22;
    }

    const pct = active && isPowered
      ? Math.min(100, Math.round(Math.pow(Math.max(0, m.e) / m.ref, 0.65) * 100))
      : 0;

    if (m.lastPct !== pct) {
      m.lastPct = pct;
      bar.style.width = pct + "%";
    }
  }
}
