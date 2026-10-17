// Slambient — Mobile Macro Grid & Touch Telemetry Module
// Handles 2-column mobile macro tiles, fast bypass/power toggles, and live responsive audio meters

/* ==========================================================================
   MOBILE MACRO OVERVIEW GRID (PHASE 5: 2-COLUMN ~110PX SUMMARY TILES)
   ========================================================================== */
var MOBILE_MACRO_MODULES = [
  { id: "drone",         name: "1. SUB",            orbId: "drone",       color: "#00e5ff", rgb: [0, 229, 255],   type: "inst" },
  { id: "drum",          name: "2. DRUMS",          orbId: "drum",        color: "#ff3838", rgb: [255, 56, 56],   type: "inst" },
  { id: "chord",         name: "3. CHORDS",         orbId: "chord",       color: "#fed330", rgb: [254, 211, 48],  type: "inst" },
  { id: "arp",           name: "4. ARP",            orbId: "arp",         color: "#7d5fff", rgb: [125, 95, 255],  type: "inst" },
  { id: "noise",         name: "5. NOISE",          orbId: "noise",       color: "#1dd1a1", rgb: [29, 209, 161],  type: "inst" },
  { id: "field",         name: "6. FIELD",          orbId: "field",       color: "#2bcbba", rgb: [43, 203, 186],  type: "inst" },
  { id: "DRIVE_FILTER",  name: "7. DRIVE + FILTER", orbId: "drv_flt",     color: "#ff5252", rgb: [255, 82, 82],   type: "fx" },
  { id: "MOD_CLUSTER",   name: "8. MOD CLUSTER",    orbId: "mod_cluster", color: "#a55eea", rgb: [165, 94, 234], type: "fx" },
  { id: "ANALOG_DELAY",  name: "9. ANALOG DELAY",   orbId: "tape_dly",    color: "#feca57", rgb: [254, 202, 87],  type: "fx" },
  { id: "DIGITAL_DELAY", name: "10. DIGITAL DELAY", orbId: "dig_dly",     color: "#48dbfb", rgb: [72, 219, 251],  type: "fx" },
  { id: "SPACE_REVERB",  name: "11. SPACE REVERB",  orbId: "spc_rev",     color: "#ff5fc4", rgb: [255, 95, 196],  type: "fx" },
  { id: "space",         name: "12. OUT",           orbId: "space",       color: "#4b7bec", rgb: [75, 123, 236], type: "master" }
];
var MACRO_MODULES = MOBILE_MACRO_MODULES;

var MOBILE_MACRO_METERS = [
  { id: "drone",         orbId: "drone",       type: "inst",   ref: 0.26,  fLow: 1,  fHigh: 20,  e: 0, lastPct: -1, getAnalyser: () => droneAnalyser },
  { id: "drum",          orbId: "drum",        type: "inst",   ref: 0.26,  fLow: 4,  fHigh: 45,  e: 0, lastPct: -1, getAnalyser: () => drumAnalyser },
  { id: "chord",         orbId: "chord",       type: "inst",   ref: 0.075, fLow: 12, fHigh: 85,  e: 0, lastPct: -1, getAnalyser: () => chordAnalyser },
  { id: "arp",           orbId: "arp",         type: "inst",   ref: 0.038, fLow: 28, fHigh: 125, e: 0, lastPct: -1, getAnalyser: () => arpAnalyser },
  { id: "noise",         orbId: "noise",       type: "inst",   ref: 0.055, fLow: 10, fHigh: 110, e: 0, lastPct: -1, getAnalyser: () => noiseAnalyser },
  { id: "field",         orbId: "field",       type: "inst",   ref: 0.07,  fLow: 8,  fHigh: 120, e: 0, lastPct: -1, getAnalyser: () => (typeof fieldAnalyser !== "undefined" ? fieldAnalyser : noiseAnalyser) },
  { id: "DRIVE_FILTER",  orbId: "drv_flt",     type: "fx",     ref: 0.11,  fLow: 10, fHigh: 80,  e: 0, lastPct: -1, getAnalyser: () => (typeof filterAnalyser !== "undefined" ? filterAnalyser : masterAnalyser) },
  { id: "MOD_CLUSTER",   orbId: "mod_cluster", type: "fx",     ref: 0.10,  fLow: 12, fHigh: 90,  e: 0, lastPct: -1, getAnalyser: () => (typeof filterAnalyser !== "undefined" ? filterAnalyser : masterAnalyser) },
  { id: "ANALOG_DELAY",  orbId: "tape_dly",    type: "fx",     ref: 0.09,  fLow: 18, fHigh: 95,  e: 0, lastPct: -1, getAnalyser: () => (typeof delayAnalyser !== "undefined" ? delayAnalyser : masterAnalyser) },
  { id: "DIGITAL_DELAY", orbId: "dig_dly",     type: "fx",     ref: 0.09,  fLow: 20, fHigh: 100, e: 0, lastPct: -1, getAnalyser: () => (typeof delayAnalyser !== "undefined" ? delayAnalyser : masterAnalyser) },
  { id: "SPACE_REVERB",  orbId: "spc_rev",     type: "fx",     ref: 0.085, fLow: 25, fHigh: 130, e: 0, lastPct: -1, getAnalyser: () => (typeof spaceAnalyser !== "undefined" ? spaceAnalyser : masterAnalyser) },
  { id: "space",         orbId: "space",       type: "master", ref: 0.20,  fLow: 1,  fHigh: 140, e: 0, lastPct: -1, getAnalyser: () => masterAnalyser }
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
  } else if (modId === "DRIVE_FILTER" || modId === "FILTER" || modId === "drv_flt") {
    const sel = document.getElementById("selFilterTopology");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "24dB Ladder";
  } else if (modId === "MOD_CLUSTER" || modId === "mod_cluster") {
    text = "Phaser/Trem";
  } else if (modId === "ANALOG_DELAY" || modId === "DELAY" || modId === "tape_dly") {
    text = "Tape Echo";
  } else if (modId === "DIGITAL_DELAY" || modId === "dig_dly") {
    const sel = document.getElementById("selDelayEngine");
    text = sel ? sel.options[sel.selectedIndex]?.text || sel.value : "Digital Delay";
  } else if (modId === "SPACE_REVERB" || modId === "SPACE" || modId === "spc_rev") {
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
  const pedalsOrder = Array.isArray(dspChainOrder) && dspChainOrder.length
    ? dspChainOrder
    : ["DRIVE_FILTER", "MOD_CLUSTER", "ANALOG_DELAY", "DIGITAL_DELAY", "SPACE_REVERB"];

  const pedalMetaMap = {
    DRIVE_FILTER:  { name: "DRIVE + FILTER", orbId: "drv_flt",     color: "#ff5252", rgb: [255, 82, 82] },
    MOD_CLUSTER:   { name: "MOD CLUSTER",    orbId: "mod_cluster", color: "#a55eea", rgb: [165, 94, 234] },
    ANALOG_DELAY:  { name: "ANALOG DELAY",   orbId: "tape_dly",    color: "#feca57", rgb: [254, 202, 87] },
    DIGITAL_DELAY: { name: "DIGITAL DELAY",  orbId: "dig_dly",     color: "#48dbfb", rgb: [72, 219, 251] },
    SPACE_REVERB:  { name: "SPACE REVERB",   orbId: "spc_rev",     color: "#ff5fc4", rgb: [255, 95, 196] },
    // Backwards compatibility mappings
    FILTER:        { name: "DRIVE + FILTER", orbId: "drv_flt",     color: "#ff5252", rgb: [255, 82, 82] },
    DELAY:         { name: "ANALOG DELAY",   orbId: "tape_dly",    color: "#feca57", rgb: [254, 202, 87] },
    SPACE:         { name: "SPACE REVERB",   orbId: "spc_rev",     color: "#ff5fc4", rgb: [255, 95, 196] }
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
    const meta = pedalMetaMap[pkey] || { name: pkey, orbId: pkey.toLowerCase(), color: "#ff5252", rgb: [255, 82, 82] };
    const num = 7 + idx;
    dynamicModules.push({
      id: pkey,
      name: `${num}. ${meta.name}`,
      orbId: meta.orbId,
      color: meta.color,
      rgb: meta.rgb,
      type: "fx"
    });
  });

  const outNum = dynamicModules.length + 1;
  dynamicModules.push({ id: "space", name: `${outNum}. OUT`, orbId: "space", color: "#4b7bec", rgb: [75, 123, 236], type: "master" });

  let html = "";
  dynamicModules.forEach(mod => {
    let isPowered = true;
    if (mod.type === "inst") {
      isPowered = typeof channelPower !== "undefined" ? channelPower[mod.id] !== false : true;
    } else if (mod.type === "fx") {
      if (typeof pedalBypassState !== "undefined") {
        if (mod.id === "DRIVE_FILTER") {
          isPowered = !(pedalBypassState["OVERDRIVE"] && pedalBypassState["FILTER"]);
        } else if (mod.id === "MOD_CLUSTER") {
          isPowered = !(pedalBypassState["TREMOLO"] && pedalBypassState["PHASER"] && pedalBypassState["FLANGER"]);
        } else if (mod.id === "ANALOG_DELAY") {
          isPowered = !(pedalBypassState["DELAY"] && pedalBypassState["TAPE_ECHO"]);
        } else if (mod.id === "DIGITAL_DELAY") {
          isPowered = !(pedalBypassState["DIGITAL_DELAY"] && pedalBypassState["SPACE_DELAY"]);
        } else if (mod.id === "SPACE_REVERB") {
          isPowered = !pedalBypassState["SPACE"];
        } else {
          isPowered = !pedalBypassState[mod.id];
        }
      }
    }

    const presetName = getModuleCurrentPresetOrTimbre(mod.id);
    const tileColor = (typeof themeHex === "function" && themeHex(mod.orbId) !== "#ffffff" ? themeHex(mod.orbId) : null) || mod.color;
    const tileRgb = (typeof themeRgb === "function" && themeHex(mod.orbId) !== "#ffffff" ? themeRgb(mod.orbId) : null) || (Array.isArray(mod.rgb) ? mod.rgb.join(',') : "0, 229, 255");

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
    if (modId === "DRIVE_FILTER" && typeof toggleUnitBypass === "function") {
      toggleUnitBypass("unit1", ev);
    } else if (modId === "MOD_CLUSTER" && typeof toggleUnitBypass === "function") {
      toggleUnitBypass("unit2", ev);
    } else if (modId === "ANALOG_DELAY" && typeof toggleUnitBypass === "function") {
      toggleUnitBypass("unit3", ev);
    } else if (modId === "DIGITAL_DELAY" && typeof toggleUnitBypass === "function") {
      toggleUnitBypass("unit4", ev);
    } else if (modId === "SPACE_REVERB" && typeof toggleUnitBypass === "function") {
      toggleUnitBypass("unit5", ev);
    } else if (typeof togglePedalBypass === "function") {
      togglePedalBypass(modId, ev);
    }
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
      if (typeof pedalBypassState !== "undefined") {
        if (m.id === "DRIVE_FILTER") {
          isPowered = !(pedalBypassState["OVERDRIVE"] && pedalBypassState["FILTER"]);
        } else if (m.id === "MOD_CLUSTER") {
          isPowered = !(pedalBypassState["TREMOLO"] && pedalBypassState["PHASER"] && pedalBypassState["FLANGER"]);
        } else if (m.id === "ANALOG_DELAY") {
          isPowered = !(pedalBypassState["DELAY"] && pedalBypassState["TAPE_ECHO"]);
        } else if (m.id === "DIGITAL_DELAY") {
          isPowered = !(pedalBypassState["DIGITAL_DELAY"] && pedalBypassState["SPACE_DELAY"]);
        } else if (m.id === "SPACE_REVERB") {
          isPowered = !pedalBypassState["SPACE"];
        } else {
          isPowered = !pedalBypassState[m.id];
        }
      }
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
