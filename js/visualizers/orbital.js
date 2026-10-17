// Slambient — Orbital Constellation Visualizer Module
// Handles floating audio-reactive module orbs, interactive physics, gesture navigation, and modal expansion

let activeModuleView = "orbital";
let orbitalCanvas, orbitalCtx;
let expandedOrbId = null;
let orbitalPanelActive = false;
const ORB_CLICK_DEBOUNCE_MS = 250;
let lastOrbClickTs = 0;
// Pending deferred restoreStripsToRack() from closeOrbitalModal(); cleared
// by expandModuleOrb() so a quick close-then-open doesn't pull the newly
// opened module back out of the panel when the old timer fires.
let orbitalRestoreTimer = null;

// Click-and-drag state for the orbital orbs. A press only counts as a drag
// (and suppresses the click-to-expand behavior) once the pointer has moved
// past DRAG_MOVE_THRESHOLD px in canvas space -- below that it's still a
// plain click/tap, same as before dragging existed.
const DRAG_MOVE_THRESHOLD = 5;
let draggedOrbId = null;
let dragPointerId = null;
let dragMoved = false;
let lastDragX = 0, lastDragY = 0, lastDragTs = 0;

// Float Speed / Orb Size sliders (orbital-deck-header) -- global multipliers
// on top of each orb's own design speed/radius, not per-module values.
let orbFloatSpeedMult = 1.0;
let orbBaseSizeMult = 1.0;

function updateOrbitalFeelParams() {
  const speedEl = document.getElementById("knobOrbFloatSpeed");
  const sizeEl = document.getElementById("knobOrbBaseSize");
  if (speedEl) {
    orbFloatSpeedMult = parseInt(speedEl.value) / 100;
    document.getElementById("lblOrbFloatSpeed").textContent = speedEl.value + "%";
  }
  if (sizeEl) {
    orbBaseSizeMult = parseInt(sizeEl.value) / 100;
    document.getElementById("lblOrbBaseSize").textContent = sizeEl.value + "%";
  }
}

// Orb Size defaults to 65% on phones (100% elsewhere) until the person moves
// the slider themselves; follows rotation / resize across the phone breakpoint.
let orbSizeUserSet = false;
function applyDefaultOrbSize() {
  const sizeEl = document.getElementById("knobOrbBaseSize");
  if (!sizeEl || orbSizeUserSet) return;
  const want = PHONE_ORB_MQ.matches ? "65" : "100";
  if (sizeEl.value !== want) { sizeEl.value = want; updateOrbitalFeelParams(); }
}
(function initDefaultOrbSize() {
  const start = () => {
    const sizeEl = document.getElementById("knobOrbBaseSize");
    if (sizeEl) sizeEl.addEventListener("input", (e) => { if (e.isTrusted) orbSizeUserSet = true; });
    applyDefaultOrbSize();
    try { PHONE_ORB_MQ.addEventListener("change", applyDefaultOrbSize); }
    catch (e) { try { PHONE_ORB_MQ.addListener(applyDefaultOrbSize); } catch (e2) {} }
  };
  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", start);
  else start();
})();

// Every orb's displayed/collision radius, in one place -- orb.baseR is the
// fixed per-module design size; orbBaseSizeMult is the global Orb Size
// slider; the (1 + excite*0.35) term is the existing audio-reactive pulse.
// An orb's name split over two lines at the middle word (desktop layout).
function orbNameLines(name) {
  const words = name.split(/[ /]/).filter(Boolean);
  if (words.length < 2) return [name];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

// Phones draw the orbs smaller (see the phone layout helpers), so the label
// block is compressed with the radius and the name shrunk (to no less than
// 9px) and split at the word that keeps it narrowest, so it stays inside the
// ring. Sized from the resting radius so labels don't wobble with the audio
// pulse, and cached per orb so text is only measured when the size changes.
function orbPhoneLabel(orb) {
  const restR = orb.baseR * orbBaseSizeMult;
  const c = orb._phoneLabel;
  if (c && c.r === restR && c.name === orb.name) return c;
  const k = Math.min(1, restR / 40);
  const fontAt = (px) => `700 ${px.toFixed(1)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  orbitalCtx.save();
  orbitalCtx.font = fontAt(Math.max(9, 11 * k));
  const widest = (ls) => Math.max(...ls.map(l => orbitalCtx.measureText(l).width));
  let lines = orbNameLines(orb.name);
  const words = orb.name.split(/[ /]/).filter(Boolean);
  for (let i = 1; i < words.length; i++) {
    const alt = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    if (widest(alt) < widest(lines)) lines = alt;
  }
  const lowest = (lines.length > 1 ? 24 : 12) * k + 4;
  const room = Math.min(restR * 1.72, 2 * Math.sqrt(Math.max(0, restR * restR - lowest * lowest)));
  const w = widest(lines);
  let px = Math.max(9, 11 * k);
  if (w > room) px = Math.max(9, px * room / w);
  orbitalCtx.restore();
  return (orb._phoneLabel = { r: restR, name: orb.name, k, lines, font: fontAt(px) });
}

function effectiveOrbRadius(orb) {
  return orb.baseR * orbBaseSizeMult * (1.0 + (orb.pulse + orb.bump) * 0.35);
}

// Background starfield for the orbital view: tiny white dots of varied size
// and brightness that twinkle and drift slowly, to read as "floating in
// space" behind the module orbs.
const STARS = [];
function initStars(w, h) {
  STARS.length = 0;
  const count = Math.round((w * h) / 4500); // density scales with canvas area
  for (let i = 0; i < count; i++) {
    STARS.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.4 + Math.random() * 1.4,
      baseAlpha: 0.2 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      twinkleSpeed: 0.008 + Math.random() * 0.03,
      vx: (Math.random() - 0.5) * 0.045,
      vy: (Math.random() - 0.5) * 0.045
    });
  }
}

function drawStars(w, h) {
  for (const s of STARS) {
    s.phase += s.twinkleSpeed;
    s.x += s.vx; s.y += s.vy;
    // Wrap around the edges so stars keep drifting indefinitely
    if (s.x < -2) s.x = w + 2; else if (s.x > w + 2) s.x = -2;
    if (s.y < -2) s.y = h + 2; else if (s.y > h + 2) s.y = -2;

    const twinkle = 0.5 + 0.5 * Math.sin(s.phase);
    const alpha = s.baseAlpha * (0.35 + 0.65 * twinkle);
    orbitalCtx.beginPath();
    orbitalCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    orbitalCtx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
    orbitalCtx.fill();
  }
}

const ORBITAL_MODULES = [
  { id: "drone",       name: "SUB",            num: "1",  color: "#00e5ff", rgb: [0, 229, 255],   baseR: 40, x: 0, y: 0, vx: 0.18,  vy: 0.14,  chClass: "drone-ch",        analyser: () => droneAnalyser,  pulse: 0, bump: 0 },
  { id: "drum",        name: "DRUMS",          num: "2",  color: "#ff3838", rgb: [255, 56, 56],   baseR: 44, x: 0, y: 0, vx: -0.20, vy: 0.16,  chClass: "drum-ch",         analyser: () => drumAnalyser,   pulse: 0, bump: 0 },
  { id: "chord",       name: "CHORDS",         num: "3",  color: "#fed330", rgb: [254, 211, 48],  baseR: 48, x: 0, y: 0, vx: 0.15,  vy: -0.19, chClass: "chord-ch",        analyser: () => chordAnalyser,  pulse: 0, bump: 0 },
  { id: "arp",         name: "ARP",            num: "4",  color: "#7d5fff", rgb: [125, 95, 255],  baseR: 42, x: 0, y: 0, vx: -0.16, vy: -0.14, chClass: "arp-ch",          analyser: () => arpAnalyser,    pulse: 0, bump: 0 },
  { id: "noise",       name: "NOISE",          num: "5",  color: "#1dd1a1", rgb: [29, 209, 161],  baseR: 40, x: 0, y: 0, vx: 0.16,  vy: -0.15, chClass: "noise-ch",        analyser: () => noiseAnalyser,  pulse: 0, bump: 0 },
  { id: "field",       name: "FIELD",          num: "6",  color: "#2bcbba", rgb: [43, 203, 186],  baseR: 41, x: 0, y: 0, vx: -0.15, vy: 0.16,  chClass: "field-ch",        analyser: () => (typeof fieldAnalyser !== "undefined" ? fieldAnalyser : noiseAnalyser), pulse: 0, bump: 0 },
  { id: "drv_flt",     name: "DRIVE + FILTER", num: "7",  color: "#ff5252", rgb: [255, 82, 82],   baseR: 38, x: 0, y: 0, vx: 0.14,  vy: 0.17,  chClass: "drv-flt-ch",      analyser: () => (typeof filterAnalyser !== "undefined" ? filterAnalyser : masterAnalyser), pulse: 0, bump: 0 },
  { id: "mod_cluster", name: "MOD CLUSTER",    num: "8",  color: "#a55eea", rgb: [165, 94, 234], baseR: 37, x: 0, y: 0, vx: -0.17, vy: -0.14, chClass: "mod-cluster-ch",  analyser: () => (typeof filterAnalyser !== "undefined" ? filterAnalyser : masterAnalyser), pulse: 0, bump: 0 },
  { id: "tape_dly",    name: "ANALOG DELAY",   num: "9",  color: "#feca57", rgb: [254, 202, 87],  baseR: 36, x: 0, y: 0, vx: -0.18, vy: 0.12,  chClass: "tape-dly-ch",     analyser: () => (typeof delayAnalyser !== "undefined" ? delayAnalyser : masterAnalyser),   pulse: 0, bump: 0 },
  { id: "dig_dly",     name: "DIGITAL DELAY",  num: "10", color: "#48dbfb", rgb: [72, 219, 251],  baseR: 36, x: 0, y: 0, vx: 0.13,  vy: -0.16, chClass: "dig-dly-ch",      analyser: () => (typeof delayAnalyser !== "undefined" ? delayAnalyser : masterAnalyser),   pulse: 0, bump: 0 },
  { id: "spc_rev",     name: "SPACE REVERB",   num: "11", color: "#ff5fc4", rgb: [255, 95, 196],  baseR: 38, x: 0, y: 0, vx: 0.17,  vy: 0.13,  chClass: "spc-rev-ch",      analyser: () => (typeof spaceAnalyser !== "undefined" ? spaceAnalyser : masterAnalyser),   pulse: 0, bump: 0 },
  { id: "space",       name: "OUT",            num: "12", color: "#4b7bec", rgb: [75, 123, 236], baseR: 37, x: 0, y: 0, vx: 0.12,  vy: -0.16, chClass: "space-ch",        analyser: () => masterAnalyser, pulse: 0, bump: 0 }
];

// Maps a dspChainOrder pedal key to the orbital orb it corresponds to --
const PEDAL_KEY_TO_ORBITAL_ID = {
  DRIVE_FILTER: "drv_flt",
  MOD_CLUSTER: "mod_cluster",
  ANALOG_DELAY: "tape_dly",
  DIGITAL_DELAY: "dig_dly",
  SPACE_REVERB: "spc_rev",
  FILTER: "drv_flt",
  OVERDRIVE: "drv_flt",
  TREMOLO: "mod_cluster",
  PHASER: "mod_cluster",
  FLANGER: "mod_cluster",
  DELAY: "tape_dly",
  TAPE_ECHO: "tape_dly",
  SPACE_DELAY: "dig_dly",
  SPACE: "spc_rev",
  REVERB: "spc_rev"
};

// The constellation chain always links all 12 orbs in active order.
// The FX segment follows the live DSP insert order (dspChainOrder),
// so dragging/shuffling the pedal chain visibly rewires the orbital connections.
// Dynamic numbering updates every frame so OUT is always the final module.
function getOrbitalConnectionChain() {
  const pedalOrbIds = ["drv_flt", "mod_cluster", "tape_dly", "dig_dly", "spc_rev", "filter", "delay", "reverb"];
  const leading = ORBITAL_MODULES.filter(o => !pedalOrbIds.includes(o.id) && o.id !== "space");
  const trailing = ORBITAL_MODULES.find(o => o.id === "space");
  if (typeof dspChainOrder === "undefined" || !Array.isArray(dspChainOrder)) {
    ORBITAL_MODULES.forEach((orb, idx) => { orb.num = String(idx + 1); });
    return ORBITAL_MODULES;
  }
  const pedalOrbs = [];
  const seen = new Set();
  dspChainOrder.forEach(key => {
    const orbId = PEDAL_KEY_TO_ORBITAL_ID[key];
    if (orbId && !seen.has(orbId)) {
      seen.add(orbId);
      const orb = ORBITAL_MODULES.find(o => o.id === orbId);
      if (orb) pedalOrbs.push(orb);
    }
  });
  // Ensure any FX orbs not in dspChainOrder are also included
  ORBITAL_MODULES.forEach(orb => {
    if (pedalOrbIds.includes(orb.id) && orb.id !== "space" && !seen.has(orb.id)) {
      seen.add(orb.id);
      pedalOrbs.push(orb);
    }
  });
  const fullChain = [...leading, ...pedalOrbs, trailing].filter(Boolean);
  fullChain.forEach((orb, idx) => {
    orb.num = String(idx + 1);
  });
  return fullChain;
}

const ORBITAL_ID_TO_PEDAL_KEY = {
  drv_flt: "FILTER",
  mod_cluster: "TREMOLO",
  tape_dly: "DELAY",
  dig_dly: "DIGITAL_DELAY",
  spc_rev: "SPACE",
  filter: "FILTER",
  delay: "DELAY",
  reverb: "SPACE"
};

// Maps an orb to its real DOM card in the rack/pedalboard.
function getOrbModuleElement(orb) {
  if (!orb) return null;
  if (orb.id === "drv_flt" || orb.id === "filter") {
    return document.getElementById("pedalCard_FILTER") || document.getElementById("pedalCard_OVERDRIVE");
  }
  if (orb.id === "mod_cluster") {
    return document.getElementById("pedalCard_TREMOLO");
  }
  if (orb.id === "tape_dly" || orb.id === "delay") {
    return document.getElementById("pedalCard_DELAY");
  }
  if (orb.id === "dig_dly") {
    return document.getElementById("pedalCard_DIGITAL_DELAY");
  }
  if (orb.id === "spc_rev" || orb.id === "reverb") {
    return document.getElementById("pedalCard_SPACE");
  }
  if (orb.id === "space") {
    return document.getElementById("masterEqOutStrip") || document.querySelector(".strip-channel.space-ch") || document.getElementById("pedalCard_SPACE");
  }
  const pedalKey = ORBITAL_ID_TO_PEDAL_KEY[orb.id];
  if (pedalKey) {
    const el = document.getElementById("pedalCard_" + pedalKey);
    if (el) return el;
  }
  return document.querySelector(`.strip-channel.${orb.chClass}`);
}

function initOrbitalConstellation() {
  orbitalCanvas = document.getElementById("orbitalCanvas");
  if (!orbitalCanvas) return;
  orbitalCtx = orbitalCanvas.getContext("2d");

  const parent = orbitalCanvas.parentElement;
  const rect = parent.getBoundingClientRect();
  const w = parent.clientWidth || rect.width || 800;
  const h = parent.clientHeight || rect.height || 380;
  const cx = w / 2;
  const cy = h / 2;
  const orbitR = Math.min(w * 0.38, h * 0.36);

  ORBITAL_MODULES.forEach((orb, i) => {
    const angle = (i / ORBITAL_MODULES.length) * Math.PI * 2 - Math.PI / 2;
    orb.x = cx + Math.cos(angle) * orbitR + (Math.random() - 0.5) * 30;
    orb.y = cy + Math.sin(angle) * orbitR + (Math.random() - 0.5) * 30;
    orb.pulse = 0;
    orb.bump = 0;
  });

  orbitalCanvas.addEventListener("pointerdown", handleOrbitalPointerDown);
  orbitalCanvas.addEventListener("pointermove", handleOrbitalPointerMove);
  orbitalCanvas.addEventListener("pointerup", handleOrbitalPointerUp);
  orbitalCanvas.addEventListener("pointercancel", handleOrbitalPointerUp);
  orbitalCanvas.addEventListener("pointerleave", () => {
    if (!draggedOrbId) orbitalCanvas.classList.remove("orb-hover");
  });

  window.addEventListener("keydown", (e) => {
    if (!expandedOrbId) return;
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.isContentEditable)) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeOrbitalModal();
    } else if (e.key === "ArrowLeft" || e.key === "[") {
      e.preventDefault();
      cycleOrbitalModule(-1);
    } else if (e.key === "ArrowRight" || e.key === "]") {
      e.preventDefault();
      cycleOrbitalModule(1);
    } else if (e.key === "p" || e.key === "P") {
      const pwrBtn = document.querySelector("#orbitalModalActions .btn-power, #orbitalModalActions .btn-mini-power");
      if (pwrBtn) {
        e.preventDefault();
        pwrBtn.click();
      }
    } else if (e.key === "r" || e.key === "R") {
      const rndBtn = document.querySelector("#orbitalModalActions button.badge-tag");
      if (rndBtn) {
        e.preventDefault();
        rndBtn.click();
      }
    }
  });

  if (typeof initPedalDragAndDrop === 'function') initPedalDragAndDrop();

/* ==========================================================================
   ABLETON-STYLE SMART COMPONENT DROPDOWNS (ALL SELECT MENUS)
   ========================================================================== */
const smartDropdownUpdaters = [];

function syncAllSmartDropdowns() {
  smartDropdownUpdaters.forEach(fn => fn());
}

function getDropdownAccentColor(sel) {
  if (sel.closest(".drone-ch")) return "var(--color-drone)";
  if (sel.closest(".drum-ch")) return "var(--color-drum)";
  if (sel.closest(".chord-ch")) return "var(--color-chord)";
  if (sel.closest(".arp-ch")) return "var(--color-arp)";
  if (sel.closest(".noise-ch")) return "var(--color-noise)";
  if (sel.closest(".field-ch") || sel.closest("#fieldModule")) return "var(--color-field)";
  if (sel.closest(".pedal-filter") || sel.closest(".filter-ch")) return "var(--color-filter)";
  if (sel.closest(".pedal-delay") || sel.closest(".delay-ch")) return "var(--color-delay)";
  if (sel.closest(".pedal-reverb") || sel.closest(".reverb-ch")) return "var(--color-reverb)";
  if (sel.closest(".space-ch")) return "var(--color-space)";
  return "var(--accent)";
}

function initSmartDropdowns() {
  const allSelects = document.querySelectorAll("select");

  allSelects.forEach((sel) => {
    if (!sel || sel.dataset.smartUpgraded) return;
    sel.dataset.smartUpgraded = "true";

    const id = sel.id || ("sel_" + Math.random().toString(36).slice(2, 7));
    const isMeter = (id === "selTimeSig");
    const isRootKey = (id === "topRootKey");

    // Create wrapper
    const wrap = document.createElement("div");
    wrap.className = "custom-dropdown-wrap";
    wrap.id = "wrap_" + id;
    wrap.style.setProperty("--dd-accent", getDropdownAccentColor(sel));

    // Trigger button
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-dropdown-trigger";
    trigger.id = "trigger_" + id;

    const labelSpan = document.createElement("span");
    labelSpan.className = "trigger-label";
    trigger.appendChild(labelSpan);

    const arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrowSvg.setAttribute("width", "9");
    arrowSvg.setAttribute("height", "6");
    arrowSvg.setAttribute("viewBox", "0 0 10 7");
    arrowSvg.setAttribute("fill", "none");
    arrowSvg.innerHTML = '<path d="M1.5 1.5L5 5L8.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/>';
    trigger.appendChild(arrowSvg);

    // Menu list
    const menu = document.createElement("div");
    menu.className = "custom-dropdown-menu";
    menu.id = "menu_" + id;

    // Smart truncation: hide parenthetical details or meter labels when collapsed, show full split details when expanded
    function formatLabel(optionText, isCollapsed) {
      const clean = (optionText || "").trim();
      if (isRootKey) {
        return { main: clean, sub: "" };
      }
      if (isMeter) {
        // e.g. "7/4 Odd Quarter" -> collapsed: "7/4", expanded: main "7/4", sub "Odd Quarter"
        const parts = clean.split(/\s+/);
        const main = parts[0] || clean;
        const sub = parts.slice(1).join(" ");
        return isCollapsed ? { main, sub: "" } : { main, sub };
      }
      // General parenthetical split: e.g. "Hirajoshi (Japanese Kankyō)" or "Sub Octave (D1 / 36.7 Hz)"
      const match = clean.match(/^([^(]+)(?:\s*\((.*)\))?$/);
      if (match) {
        const main = match[1].trim();
        const sub = match[2] ? `(${match[2].trim()})` : "";
        return isCollapsed ? { main, sub: "" } : { main, sub };
      }
      return { main: clean, sub: "" };
    }

    function rebuildMenuOptions() {
      menu.innerHTML = "";
      [...sel.options].forEach((opt, idx) => {
        const item = document.createElement("div");
        item.className = "custom-dropdown-item";
        item.dataset.value = opt.value;
        if (idx === sel.selectedIndex) item.classList.add("selected");

        const { main, sub } = formatLabel(opt.textContent, false);
        item.innerHTML = `<span class="item-main"><span class="item-check">▸</span><span>${main}</span></span>${sub ? `<span class="item-sub">${sub}</span>` : ""}`;

        item.addEventListener("click", (e) => {
          e.stopPropagation();
          sel.value = opt.value;
          sel.dispatchEvent(new Event("change", { bubbles: true }));
          if (typeof sel.onchange === "function") {
            sel.onchange.call(sel, new Event("change"));
          }
          syncUI();
          closeDropdown();
        });

        menu.appendChild(item);
      });
    }

    function syncUI() {
      const selectedOpt = sel.options[sel.selectedIndex] || sel.options[0];
      if (!selectedOpt) return;
      const { main } = formatLabel(selectedOpt.textContent, true);
      labelSpan.textContent = main;
      menu.querySelectorAll(".custom-dropdown-item").forEach(i => {
        i.classList.toggle("selected", i.dataset.value === sel.value);
      });
    }

    rebuildMenuOptions();

    // Intercept programmatic .value assignments on the <select> element so preset loads & randomizers auto-sync
    const proto = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    if (proto && proto.set && proto.get) {
      Object.defineProperty(sel, "value", {
        get() {
          return proto.get.call(this);
        },
        set(newVal) {
          proto.set.call(this, newVal);
          syncUI();
        },
        configurable: true
      });
    }

    function toggleDropdown(e) {
      e.stopPropagation();
      const isOpen = menu.classList.contains("open");
      document.querySelectorAll(".custom-dropdown-menu.open").forEach(m => m.classList.remove("open", "drop-up"));
      document.querySelectorAll(".custom-dropdown-trigger.open").forEach(t => t.classList.remove("open"));
      document.querySelectorAll(".custom-dropdown-wrap.is-open").forEach(w => w.classList.remove("is-open"));
      if (!isOpen) {
        // Re-build if dynamic options changed (like MIDI devices)
        const optSig = [...sel.options].map(o => o.value + "|" + o.textContent).join("\n");
        if (menu.children.length !== sel.options.length || menu.dataset.optSig !== optSig) {
          rebuildMenuOptions();
          menu.dataset.optSig = optSig;
        }
        syncUI();
        menu.classList.add("open");
        trigger.classList.add("open");
        wrap.classList.add("is-open");
        // Check viewport & modal body bottom collision to flip menu upward if needed
        const rect = menu.getBoundingClientRect();
        const modalBody = wrap.closest("#orbitalModalBody");
        const containerBottom = modalBody ? modalBody.getBoundingClientRect().bottom - 6 : window.innerHeight - 12;
        const containerTop = modalBody ? modalBody.getBoundingClientRect().top + 6 : 12;
        if (rect.bottom > containerBottom) {
          const triggerRect = trigger.getBoundingClientRect();
          const roomBelow = containerBottom - triggerRect.bottom;
          const roomAbove = triggerRect.top - containerTop;
          if (roomAbove > roomBelow) {
            menu.classList.add("drop-up");
          }
        }
      }
    }

    function closeDropdown() {
      menu.classList.remove("open", "drop-up");
      trigger.classList.remove("open");
      wrap.classList.remove("is-open");
    }

    trigger.addEventListener("click", toggleDropdown);
    sel.addEventListener("change", syncUI);

    // Replace native select in visual DOM while keeping native select hidden
    sel.style.display = "none";
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(trigger);
    wrap.appendChild(menu);
    wrap.appendChild(sel);

    syncUI();
    smartDropdownUpdaters.push(syncUI);
  });

  // Global click and Escape key close
  document.addEventListener("click", () => {
    document.querySelectorAll(".custom-dropdown-menu.open").forEach(m => m.classList.remove("open", "drop-up"));
    document.querySelectorAll(".custom-dropdown-trigger.open").forEach(t => t.classList.remove("open"));
    document.querySelectorAll(".custom-dropdown-wrap.is-open").forEach(w => w.classList.remove("is-open"));
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".custom-dropdown-menu.open").forEach(m => m.classList.remove("open", "drop-up"));
      document.querySelectorAll(".custom-dropdown-trigger.open").forEach(t => t.classList.remove("open"));
      document.querySelectorAll(".custom-dropdown-wrap.is-open").forEach(w => w.classList.remove("is-open"));
    }
  });
}

  if (typeof initUpperDeckDragAndDrop === 'function') initUpperDeckDragAndDrop();
  if (typeof initSmartDropdowns === 'function') initSmartDropdowns();
  if (typeof updatePedalsOrderUI === 'function') updatePedalsOrderUI();
  if (typeof initOrbitalGestures === 'function') initOrbitalGestures();
  setModuleView(activeModuleView);
  requestAnimationFrame(loopOrbitalPhysics);
}

function orbitalPointerToCanvas(e) {
  const rect = orbitalCanvas.getBoundingClientRect();
  const scaleX = (cachedOrbitalW || orbitalCanvas.clientWidth || rect.width) / (rect.width || 1);
  const scaleY = (cachedOrbitalH || orbitalCanvas.clientHeight || rect.height) / (rect.height || 1);
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

function findOrbAt(x, y) {
  for (let i = 0; i < ORBITAL_MODULES.length; i++) {
    const orb = ORBITAL_MODULES[i];
    const currentR = effectiveOrbRadius(orb);
    const dist = Math.hypot(x - orb.x, y - orb.y);
    if (dist <= currentR + 8) return orb;
  }
  return null;
}

function handleOrbitalPointerDown(e) {
  if (draggedOrbId) return;
  const { x, y } = orbitalPointerToCanvas(e);
  const orb = findOrbAt(x, y);
  if (!orb) {
    if (expandedOrbId) closeOrbitalModal();
    return;
  }
  draggedOrbId = orb.id;
  dragPointerId = e.pointerId;
  dragMoved = false;
  lastDragX = x; lastDragY = y; lastDragTs = performance.now();
  try { orbitalCanvas.setPointerCapture(e.pointerId); } catch (err) {}
  orbitalCanvas.classList.remove("orb-hover");
  orbitalCanvas.classList.add("orb-dragging");
  e.preventDefault();
}

function handleOrbitalPointerMove(e) {
  const { x, y } = orbitalPointerToCanvas(e);

  if (draggedOrbId && e.pointerId === dragPointerId) {
    const orb = ORBITAL_MODULES.find(o => o.id === draggedOrbId);
    if (orb) {
      if (!dragMoved && Math.hypot(x - lastDragX, y - lastDragY) > DRAG_MOVE_THRESHOLD) dragMoved = true;
      orb.x = x; orb.y = y;

      // Track instantaneous drag velocity so a release can "fling" the orb
      // onward instead of it just stopping dead where it was dropped.
      const now = performance.now();
      const dt = Math.max(1, now - lastDragTs);
      orb.vx = (x - lastDragX) / dt * 16;
      orb.vy = (y - lastDragY) / dt * 16;
      lastDragX = x; lastDragY = y; lastDragTs = now;
    }
    return;
  }

  // Not dragging -- just a hover cursor hint that an orb is grabbable.
  orbitalCanvas.classList.toggle("orb-hover", !!findOrbAt(x, y));
}

function handleOrbitalPointerUp(e) {
  if (!draggedOrbId || e.pointerId !== dragPointerId) return;
  const orb = ORBITAL_MODULES.find(o => o.id === draggedOrbId);
  const wasDrag = dragMoved;
  // releasePointerCapture throws if the id was never actually captured (can
  // happen in edge cases, not just synthetic events) -- that must never
  // skip clearing the drag state below, or every orb gets stuck refusing
  // further clicks/drags until a page reload.
  try { orbitalCanvas.releasePointerCapture(e.pointerId); } catch (err) {}
  draggedOrbId = null;
  dragPointerId = null;
  orbitalCanvas.classList.remove("orb-dragging");
  orbitalCanvas.classList.toggle("orb-hover", !!findOrbAt(orb.x, orb.y));

  if (orb) {
    if (wasDrag) {
      // Carry the release velocity onward (capped so a hard flick doesn't
      // send it rocketing off far faster than the ambient wander speed),
      // and resync heading so the next physics tick continues smoothly
      // from it instead of snapping to a stale pre-drag direction.
      const flungSpeed = Math.min(3.0, Math.hypot(orb.vx, orb.vy));
      const heading = Math.atan2(orb.vy, orb.vx);
      orb.heading = heading;
      orb.vx = Math.cos(heading) * flungSpeed;
      orb.vy = Math.sin(heading) * flungSpeed;
      orb.bump = Math.min(0.8, orb.bump + 0.1);
    } else {
      // Click toggles: clicking the orb whose panel is already open closes
      // it. Clicks inside ORB_CLICK_DEBOUNCE_MS of the last one are ignored,
      // so a double-click doesn't open-close (or close-reopen) and flicker.
      const now = performance.now();
      if (now - lastOrbClickTs < ORB_CLICK_DEBOUNCE_MS) return;
      lastOrbClickTs = now;
      if (orbitalPanelActive && expandedOrbId === orb.id) closeOrbitalModal();
      else expandModuleOrb(orb.id);
    }
  }
}

function setModuleView(mode) {
  activeModuleView = (mode === "orbital") ? "orbital" : "console";
  const btnOrb = document.getElementById("btnViewOrbital");
  const btnCon = document.getElementById("btnViewConsole");
  const arena = document.getElementById("orbitalArenaWrapper");
  const lowerRack = document.querySelector(".lower-deck");
  const masterRack = document.querySelector(".master-chain-deck");
  const pedalsRack = document.getElementById("pedalsContainer");
  const floatControls = document.getElementById("orbitalFloatControls");

  if (btnOrb) btnOrb.classList.toggle("active", activeModuleView === "orbital");
  if (btnCon) btnCon.classList.toggle("active", activeModuleView === "console");

  if (activeModuleView === "orbital") {
    if (arena) arena.style.display = "block";
    if (lowerRack) lowerRack.classList.add("view-grid-hidden");
    if (masterRack) masterRack.classList.add("view-grid-hidden");
    if (pedalsRack) pedalsRack.classList.add("view-grid-hidden");
    if (floatControls) floatControls.style.display = "flex";
  } else {
    // Unified Console & Pedalboard mode
    if (floatControls) floatControls.style.display = "none";
    if (arena) arena.style.display = "none";
    if (lowerRack) lowerRack.classList.remove("view-grid-hidden");
    if (masterRack) masterRack.classList.remove("view-grid-hidden");
    if (pedalsRack) pedalsRack.classList.remove("view-grid-hidden");
    const panel = document.getElementById("orbitalSidePanel");
    if (panel) panel.classList.remove("active");
    const backdrop = document.getElementById("orbitalModalBackdrop");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("orbital-panel-open");
    expandedOrbId = null;
    orbitalPanelActive = false;
    const hint = document.getElementById("orbitalHint");
    if (hint) hint.classList.remove("hidden-by-panel");
    restoreStripsToRack();
    updatePedalsOrderUI();
  }
}

function expandModuleOrb(orbId) {
  let targetId = (orbId === 'MASTER' || orbId === 'master' || orbId === 'out' || orbId === 'OUT') ? 'space' : orbId;
  const legacyOrbMap = {
    unit1: "drv_flt",
    filter: "drv_flt",
    FILTER: "drv_flt",
    OVERDRIVE: "drv_flt",
    DRIVE_FILTER: "drv_flt",
    unit2: "mod_cluster",
    TREMOLO: "mod_cluster",
    PHASER: "mod_cluster",
    FLANGER: "mod_cluster",
    MOD_CLUSTER: "mod_cluster",
    unit3: "tape_dly",
    delay: "tape_dly",
    DELAY: "tape_dly",
    TAPE_ECHO: "tape_dly",
    ANALOG_DELAY: "tape_dly",
    unit4: "dig_dly",
    DIGITAL_DELAY: "dig_dly",
    SPACE_DELAY: "dig_dly",
    unit5: "spc_rev",
    reverb: "spc_rev",
    SPACE: "spc_rev",
    SPACE_REVERB: "spc_rev"
  };
  if (legacyOrbMap[targetId]) targetId = legacyOrbMap[targetId];

  if (typeof getOrbitalConnectionChain === "function") getOrbitalConnectionChain();
  const orb = ORBITAL_MODULES.find(o => o.id === targetId);
  if (!orb) return;

  if (orbitalRestoreTimer) { clearTimeout(orbitalRestoreTimer); orbitalRestoreTimer = null; }
  restoreStripsToRack();

  expandedOrbId = targetId;
  orbitalPanelActive = true;
  const panel = document.getElementById("orbitalSidePanel");
  const title = document.getElementById("orbitalModalTitle");
  const body = document.getElementById("orbitalModalBody");

  const activeColor = (typeof themeHex === "function" && themeHex(targetId) !== "#ffffff" ? themeHex(targetId) : null) || orb.color;
  const activeRgb = (typeof themeRgb === "function" && themeHex(targetId) !== "#ffffff" ? themeRgb(targetId) : null) || (Array.isArray(orb.rgb) ? orb.rgb.join(", ") : "0, 229, 255");

  panel.style.setProperty("--modal-accent-color", activeColor);
  panel.style.setProperty("--modal-accent-glow", `rgba(${activeRgb}, 0.45)`);
  panel.style.setProperty("--modal-accent-rgb", activeRgb);
  title.textContent = `${orb.num}. ${orb.name}`;
  title.style.color = activeColor;

  body.innerHTML = "";
  body.scrollTop = 0;
  const sourceStrip = getOrbModuleElement(orb);
  if (sourceStrip) {
    body.appendChild(sourceStrip);
    sourceStrip.style.display = "flex";

    // In all close up module views for effects on desktop and mobile have all parameters open
    const drawers = sourceStrip.querySelectorAll(".module-drawer-content");
    drawers.forEach(d => d.classList.add("open"));
    const toggles = sourceStrip.querySelectorAll(".module-drawer-toggle");
    toggles.forEach(t => {
      t.classList.add("expanded");
      t.setAttribute("aria-expanded", "true");
    });

    // Borrow everything in the strip's own header except its title (that's
    // either a .panel-header-actions row of mute/solo/power/randomize
    // buttons, or -- for the master-chain modules, which have no per-channel
    // mute/solo -- just a lone randomize button) up into the modal's top
    // header, next to the close button, instead of leaving it sitting in
    // the strip's now-title-less (and otherwise empty) header.
    const header = sourceStrip.querySelector(".panel-header");
    const actionsSlot = document.getElementById("orbitalModalActions");
    if (header && actionsSlot) {
      const titleSpan = header.querySelector(":scope > span:first-child, :scope > .panel-header-left");
      [...header.children].forEach(child => {
        if (child !== titleSpan && !child.classList.contains("module-window-controls")) {
          actionsSlot.appendChild(child);
        }
      });
    }
  }

  const backdrop = document.getElementById("orbitalModalBackdrop");
  if (backdrop && backdrop.parentElement !== document.body) document.body.appendChild(backdrop);
  if (panel && panel.parentElement !== document.body) document.body.appendChild(panel);

  renderSignalRibbon(targetId);

  panel.classList.add("active");
  if (backdrop) backdrop.classList.add("active");
  document.body.classList.add("orbital-panel-open");

  const backLabel = document.getElementById("btnOrbitalBackLabel");
  if (backLabel) backLabel.textContent = (activeModuleView === "orbital" ? "ORBITAL" : "RACK");

  const hint = document.getElementById("orbitalHint");
  if (hint) hint.classList.add("hidden-by-panel");
}

function closeOrbitalModal() {
  const panel = document.getElementById("orbitalSidePanel");
  if (panel) panel.classList.remove("active");
  const backdrop = document.getElementById("orbitalModalBackdrop");
  if (backdrop) backdrop.classList.remove("active");
  document.body.classList.remove("orbital-panel-open");
  expandedOrbId = null;
  orbitalPanelActive = false;

  const hint = document.getElementById("orbitalHint");
  if (hint) hint.classList.remove("hidden-by-panel");

  if (orbitalRestoreTimer) clearTimeout(orbitalRestoreTimer);
  orbitalRestoreTimer = setTimeout(() => { orbitalRestoreTimer = null; restoreStripsToRack(); }, 120);
}

function collapseOrbitalToPedals() {
  closeOrbitalModal();
}

function getSignalChainOrbList() {
  const pedals = [];
  const seen = new Set();
  const order = (Array.isArray(dspChainOrder) && dspChainOrder.length)
    ? dspChainOrder
    : ["DRIVE_FILTER", "MOD_CLUSTER", "ANALOG_DELAY", "DIGITAL_DELAY", "SPACE_REVERB"];
  order.forEach(k => {
    const oid = (typeof PEDAL_KEY_TO_ORBITAL_ID !== "undefined" && PEDAL_KEY_TO_ORBITAL_ID[k])
      ? PEDAL_KEY_TO_ORBITAL_ID[k]
      : k.toLowerCase();
    if (oid && !seen.has(oid)) {
      seen.add(oid);
      pedals.push(oid);
    }
  });
  return ["drone", "drum", "chord", "arp", "noise", "field", ...pedals, "space"];
}

function renderSignalRibbon(activeOrbId) {
  const ribbon = document.getElementById("orbitalSignalRibbon");
  if (!ribbon) return;
  const chain = getSignalChainOrbList();
  ribbon.innerHTML = "";

  chain.forEach((orbId, idx) => {
    if (idx === 6 || idx === chain.length - 1) {
      const sep = document.createElement("span");
      sep.className = "orbital-signal-ribbon-arrow";
      sep.textContent = "➔";
      ribbon.appendChild(sep);
    }

    const orb = ORBITAL_MODULES.find(o => o.id === orbId);
    if (!orb) return;

    const orbColor = (typeof themeHex === "function" ? themeHex(orb.id) : null) || orb.color;
    const orbRgb = (typeof themeRgb === "function" ? themeRgb(orb.id) : null) || (Array.isArray(orb.rgb) ? orb.rgb.join(", ") : "0, 229, 255");

    const node = document.createElement("button");
    node.type = "button";
    node.className = "orbital-signal-ribbon-node" + (orb.id === activeOrbId ? " active" : "");
    node.textContent = `${orb.num}. ${orb.name}`;
    node.setAttribute("title", `Inspect ${orb.num}. ${orb.name}`);
    node.style.setProperty("--node-color", orbColor);
    if (orb.id === activeOrbId) {
      node.style.borderColor = orbColor;
      node.style.color = orbColor;
      node.style.boxShadow = `0 0 8px rgba(${orbRgb}, 0.45)`;
    }
    node.onclick = (e) => {
      e.stopPropagation();
      expandModuleOrb(orb.id);
    };
    ribbon.appendChild(node);
  });
}

function cycleOrbitalModule(dir) {
  if (!expandedOrbId) return;
  const chain = getSignalChainOrbList();
  const currIdx = chain.indexOf(expandedOrbId);
  if (currIdx === -1) return;
  let nextIdx = (currIdx + dir + chain.length) % chain.length;
  const nextOrbId = chain[nextIdx];
  const panel = document.getElementById("orbitalSidePanel");
  if (panel) {
    panel.classList.add(dir > 0 ? "swiping-left" : "swiping-right");
    setTimeout(() => {
      expandModuleOrb(nextOrbId);
      panel.classList.remove("swiping-left", "swiping-right");
    }, 110);
  } else {
    expandModuleOrb(nextOrbId);
  }
}

function initTouchViewSwitchers() {
  const switchers = [
    { id: "btnViewOrbital", action: () => setModuleView("orbital") },
    { id: "btnViewConsole", action: () => setModuleView("console") },
    { id: "btnOrbitalBack", action: () => collapseOrbitalToPedals() },
    { id: "btnOrbitalPrev", action: () => cycleOrbitalModule(-1) },
    { id: "btnOrbitalNext", action: () => cycleOrbitalModule(1) }
  ];
  switchers.forEach(({ id, action }) => {
    const el = document.getElementById(id);
    if (!el || el.dataset.touchFastBound) return;
    el.dataset.touchFastBound = "1";
    let lastTouchPointerUp = 0;
    el.addEventListener("pointerup", (e) => {
      if (e.pointerType === "touch") {
        e.preventDefault();
        lastTouchPointerUp = performance.now();
        action();
      }
    }, { passive: false });
    el.addEventListener("click", (e) => {
      if (performance.now() - lastTouchPointerUp < 450) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  });
}
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => {
    initTouchViewSwitchers();
    if (typeof renderMobileMacroGrid === "function") renderMobileMacroGrid();
    if (typeof renderMasterDspChainList === "function") renderMasterDspChainList();
  });
} else {
  initTouchViewSwitchers();
  if (typeof renderMobileMacroGrid === "function") renderMobileMacroGrid();
  if (typeof renderMasterDspChainList === "function") renderMasterDspChainList();
}
window.addEventListener("load", () => {
  initTouchViewSwitchers();
  if (typeof renderMobileMacroGrid === "function") renderMobileMacroGrid();
  if (typeof renderMasterDspChainList === "function") renderMasterDspChainList();
});

function toggleModuleDrawer(toggleEl) {
  if (!toggleEl) return;
  const content = toggleEl.nextElementSibling;
  if (!content || !content.classList.contains("module-drawer-content")) return;
  const isExpanded = content.classList.contains("open");
  content.classList.toggle("open", !isExpanded);
  toggleEl.setAttribute("aria-expanded", !isExpanded);
  toggleEl.classList.toggle("expanded", !isExpanded);
}


function initOrbitalGestures() {
  const targets = [document.getElementById("orbitalSidePanel"), document.getElementById("orbitalArenaWrapper")];

  targets.forEach(el => {
    if (!el) return;

    let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
    let pinchStartDist = 0;

    el.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        // 2-finger pinch
        pinchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      } else if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    }, { passive: true });

    el.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && pinchStartDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDist / pinchStartDist;
        // Pinch-In detected -> collapse to macro Pedals Mode overview!
        if (scale < 0.72) {
          pinchStartDist = 0;
          if (activeModuleView === "orbital") {
            collapseOrbitalToPedals();
          }
        }
      }
    }, { passive: true });

    el.addEventListener("touchend", (e) => {
      if (pinchStartDist > 0 && e.touches.length < 2) {
        pinchStartDist = 0;
      }
      if (e.changedTouches.length === 1 && activeModuleView === "orbital" && expandedOrbId) {
        // Don't swipe if user was dragging a slider/knob, dropdown, or toggle
        if (e.target.closest('input, select, .custom-dropdown-wrap, .custom-dropdown-trigger, .custom-dropdown-menu, label, button, .module-drawer-toggle')) {
          return;
        }
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const dt = performance.now() - touchStartTime;

        // Horizontal edge-to-edge swipe detection
        if (dt < 650 && Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.35) {
          if (dx < 0) {
            cycleOrbitalModule(1); // Swipe left -> next module in signal chain
          } else {
            cycleOrbitalModule(-1); // Swipe right -> prev module in signal chain
          }
        }
      }
    }, { passive: true });
  });
}

const ORBITAL_LOWER_DECK_IDS = ["drone", "drum", "chord", "arp", "noise", "field"];

function restoreStripsToRack() {
  const lowerRack = document.querySelector(".lower-deck");

  // Give any icon row borrowed into the modal header (see expandModuleOrb)
  // back to its home strip before that strip moves back into the rack --
  // otherwise it's orphaned in the modal header and the console view loses
  // its mute/solo/power/randomize (or, for a pedal, its slot badge/shift/
  // drag/bypass) controls for that module.
  const modalBody = document.getElementById("orbitalModalBody");
  const expandedStrip = modalBody ? modalBody.querySelector(".strip-channel, .pedal-chassis") : null;
  const actionsSlot = document.getElementById("orbitalModalActions");
  if (expandedStrip && actionsSlot && actionsSlot.children.length) {
    const homeHeader = expandedStrip.querySelector(".panel-header");
    if (homeHeader) {
      [...actionsSlot.children].forEach(child => homeHeader.appendChild(child));
    }
  }

  let movedAPedal = false;
  ORBITAL_MODULES.forEach(orb => {
    const strip = getOrbModuleElement(orb);
    if (!strip) return;
    if (ORBITAL_LOWER_DECK_IDS.includes(orb.id)) {
      const instDeck = document.getElementById("instrumentsDeck") || lowerRack;
      if (instDeck) instDeck.appendChild(strip);
    } else if (orb.id === "space") {
      const masterSec = document.getElementById("pedalboardMasterSection") || document.getElementById("studioFxGrid") || document.getElementById("masterDeckUnified");
      if (masterSec) masterSec.appendChild(strip);
    } else if (ORBITAL_ID_TO_PEDAL_KEY[orb.id]) {
      const fxGrid = document.getElementById("studioFxGrid") || document.getElementById("masterDeckUnified");
      if (fxGrid) fxGrid.appendChild(strip);
      movedAPedal = true;
    }
  });
  const pedalBoard = document.getElementById("studioFxPedalboard") || document.getElementById("pedalChainModule");
  const deckBody = document.getElementById("lowerDeckBody") || lowerRack;
  if (deckBody && pedalBoard && !pedalBoard.parentElement) {
    deckBody.appendChild(pedalBoard);
  }
  if (typeof updatePedalsOrderUI === "function") updatePedalsOrderUI();
  if (typeof renderMobileMacroGrid === "function") renderMobileMacroGrid();
}

let cachedOrbitalW = 0, cachedOrbitalH = 0, orbitalNeedsResize = true;
let orbitalCanvasVisible = true, orbitalVisibilityObserverBound = false;
window.addEventListener("resize", () => { orbitalNeedsResize = true; });
window.addEventListener("orientationchange", () => { orbitalNeedsResize = true; });

function loopOrbitalPhysics() {
  if (activeModuleView === "orbital" && orbitalCanvas && orbitalCtx && !document.hidden) {
    if (!orbitalVisibilityObserverBound && typeof IntersectionObserver !== "undefined") {
      orbitalVisibilityObserverBound = true;
      try {
        new IntersectionObserver((entries) => {
          if (entries[0]) orbitalCanvasVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(orbitalCanvas);
      } catch (err) {}
    }
    // Skip canvas redraw when scrolled off-screen or when the phone module sheet
    // covers 100% of the orbital arena (once initial orb positions are ready).
    const coveredByPhoneSheet = PHONE_ORB_MQ.matches && orbitalPanelActive && ORBITAL_MODULES[0] && ORBITAL_MODULES[0].initialized;
    if (orbitalCanvasVisible && !coveredByPhoneSheet) {
      updateAndDrawOrbitalCanvas();
    }
  }
  if (typeof updateMobileMacroMeterValues === "function") {
    updateMobileMacroMeterValues();
  }
  requestAnimationFrame(loopOrbitalPhysics);
}

function updateAndDrawOrbitalCanvas() {
  const onPhone = PHONE_ORB_MQ.matches;
  const rawDpr = window.devicePixelRatio || 1;
  const dpr = onPhone ? Math.min(1.5, rawDpr) : Math.min(2, rawDpr);
  const parent = orbitalCanvas.parentElement;

  if (orbitalNeedsResize || !cachedOrbitalW || !cachedOrbitalH) {
    const w = Math.round(parent.clientWidth || 800);
    const h = Math.round(parent.clientHeight || 380);
    if (Math.abs(w - cachedOrbitalW) > 1 || Math.abs(h - cachedOrbitalH) > 1 || orbitalCanvas.width !== Math.round(w * dpr)) {
      cachedOrbitalW = w;
      cachedOrbitalH = h;
      orbitalCanvas.width = Math.round(w * dpr);
      orbitalCanvas.height = Math.round(h * dpr);
      initStars(w, h);
    }
    orbitalNeedsResize = false;
  }
  const w = cachedOrbitalW;
  const h = cachedOrbitalH;

  orbitalCtx.resetTransform();
  orbitalCtx.scale(dpr, dpr);

  orbitalCtx.fillStyle = "#05060a";
  orbitalCtx.fillRect(0, 0, w, h);

  drawStars(w, h);

  const cx = w / 2;
  const cy = h / 2;
  orbitalCtx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  orbitalCtx.lineWidth = 1.0;
  orbitalCtx.beginPath();
  orbitalCtx.arc(cx, cy, Math.min(w, h) * 0.32, 0, Math.PI * 2);
  orbitalCtx.arc(cx, cy, Math.min(w, h) * 0.44, 0, Math.PI * 2);
  orbitalCtx.stroke();

  // Open constellation chain: 1 -> 2 -> 3 -> 4 -> [Filter/Delay/Reverb in
  // live DSP chain order] -> 8 (Orb 8 is disconnected from Orb 1). The
  // 5-7 segment follows dspChainOrder, so reordering the pedals visibly
  // rewires these connections too.
  const connectionChain = getOrbitalConnectionChain();
  for (let i = 0; i < connectionChain.length - 1; i++) {
    const a = connectionChain[i];
    const b = connectionChain[i + 1];
    const grad = orbitalCtx.createLinearGradient(a.x, a.y, b.x, b.y);
    const aExcite = a.pulse + a.bump, bExcite = b.pulse + b.bump;
    const alpha = (0.28 + (aExcite + bExcite) * 0.30).toFixed(3);
    grad.addColorStop(0, `rgba(${a.rgb[0]}, ${a.rgb[1]}, ${a.rgb[2]}, ${alpha})`);
    grad.addColorStop(1, `rgba(${b.rgb[0]}, ${b.rgb[1]}, ${b.rgb[2]}, ${alpha})`);
    orbitalCtx.strokeStyle = grad;
    orbitalCtx.lineWidth = 1.2 + (aExcite + bExcite) * 0.6;
    orbitalCtx.beginPath();
    orbitalCtx.moveTo(a.x, a.y);
    orbitalCtx.lineTo(b.x, b.y);
    orbitalCtx.stroke();
  }

  const padding = 20;

  let leftPad = padding;
  if (orbitalPanelActive && !onPhone) {
    const panelEl = document.getElementById("orbitalSidePanel");
    if (panelEl && getComputedStyle(panelEl).position !== "fixed") {
      leftPad = (panelEl.offsetWidth || 320) + 24;
    }
  }

  const now = performance.now();

  // Ensure orbs are properly laid out across the canvas area if dimensions were not ready at boot
  if (!ORBITAL_MODULES[0].initialized || isNaN(ORBITAL_MODULES[0].x) || ORBITAL_MODULES[0].x <= 0) {
    const orbitR = Math.min(w * 0.38, h * 0.36);
    const initialHeadings = [0.35, -0.75, 1.40, -1.90, 2.50, -2.85, 0.85, -1.15, 1.75, -2.10, 0.45, -0.95];
    ORBITAL_MODULES.forEach((orb, i) => {
      const angle = (i / ORBITAL_MODULES.length) * Math.PI * 2 - Math.PI / 2;
      orb.x = cx + Math.cos(angle) * orbitR;
      orb.y = cy + Math.sin(angle) * orbitR;
      orb.heading = initialHeadings[i] || (angle + Math.PI / 2);
      orb.pulse = 0;
      orb.bump = 0;
      orb.initialized = true;
    });
  }

  ORBITAL_MODULES.forEach((orb, i) => {
    let energy = 0;
    if (isPlaying) {
      const an = orb.analyser();
      const sampled = typeof sampleAnalyserForFrame === "function" ? sampleAnalyserForFrame(an) : null;
      if (sampled) {
        const timeBuf = sampled.time, freqBuf = sampled.freq;
        const n = timeBuf.length;
        let sumSq = 0, band = 0;
        const limit = Math.min(64, freqBuf.length);
        for (let k = 0; k < n; k++) {
          const d = (timeBuf[k] - 128) / 128;
          sumSq += d * d;
          if (k < limit) band += freqBuf[k];
        }
        energy = Math.sqrt(sumSq / n) * 0.55 + (band / (limit * 255.0)) * 0.45;
      }
    }
    orb.pulse = orb.pulse * 0.88 + energy * 0.22;
    orb.bump *= 0.965;

    if (orb.id !== draggedOrbId) {
      if (orb.heading === undefined) {
        orb.heading = Math.atan2(orb.vy || 0.15, orb.vx || 0.15);
      }
      const wanderFreq = 0.0007 + (i * 0.00025);
      orb.heading += Math.sin(now * wanderFreq + i * 1.9) * 0.007;

      const currentSpeed = (isPlaying
        ? (0.40 + energy * 0.55 + orb.pulse * 0.20)
        : 0.30) * orbFloatSpeedMult;

      orb.vx = Math.cos(orb.heading) * currentSpeed;
      orb.vy = Math.sin(orb.heading) * currentSpeed;

      orb.x += orb.vx;
      orb.y += orb.vy;

      if (isPlaying && energy > 0.03) {
        const wave = Math.sin(now * 0.0018 + orb.baseR) * energy * 0.16 * orbFloatSpeedMult;
        orb.x += -Math.sin(orb.heading) * wave;
        orb.y += Math.cos(orb.heading) * wave;
      }
    }

    // Smooth, cushioned boundary reflection
    const r = effectiveOrbRadius(orb);
    if (orb.x - r < leftPad) {
      orb.x = leftPad + r;
      orb.vx = Math.abs(orb.vx);
      orb.heading = Math.atan2(orb.vy, orb.vx);
      orb.bump = Math.min(0.8, orb.bump + (isPlaying ? 0.12 : 0.04));
    }
    if (orb.x + r > w - padding) {
      orb.x = w - padding - r;
      orb.vx = -Math.abs(orb.vx);
      orb.heading = Math.atan2(orb.vy, orb.vx);
      orb.bump = Math.min(0.8, orb.bump + (isPlaying ? 0.12 : 0.04));
    }
    if (orb.y - r < padding) {
      orb.y = padding + r;
      orb.vy = Math.abs(orb.vy);
      orb.heading = Math.atan2(orb.vy, orb.vx);
      orb.bump = Math.min(0.8, orb.bump + (isPlaying ? 0.12 : 0.04));
    }
    if (orb.y + r > h - padding) {
      orb.y = h - padding - r;
      orb.vy = -Math.abs(orb.vy);
      orb.heading = Math.atan2(orb.vy, orb.vx);
      orb.bump = Math.min(0.8, orb.bump + (isPlaying ? 0.12 : 0.04));
    }
  });

  for (let i = 0; i < ORBITAL_MODULES.length; i++) {
    for (let j = i + 1; j < ORBITAL_MODULES.length; j++) {
      const o1 = ORBITAL_MODULES[i];
      const o2 = ORBITAL_MODULES[j];
      const r1 = effectiveOrbRadius(o1);
      const r2 = effectiveOrbRadius(o2);
      const minDist = r1 + r2 + 22;

      const dx = o2.x - o1.x;
      const dy = o2.y - o1.y;
      const dist = Math.hypot(dx, dy);

      if (dist < minDist && dist > 0.001) {
        const nx = dx / dist;
        const ny = dy / dist;

        const overlap = (minDist - dist) * 0.38;
        o1.x -= nx * overlap;
        o1.y -= ny * overlap;
        o2.x += nx * overlap;
        o2.y += ny * overlap;

        const kx = o1.vx - o2.vx;
        const ky = o1.vy - o2.vy;
        const p = (nx * kx + ny * ky);

        o1.vx = (o1.vx - p * nx * 0.50);
        o1.vy = (o1.vy - p * ny * 0.50);
        o2.vx = (o2.vx + p * nx * 0.50);
        o2.vy = (o2.vy + p * ny * 0.50);

        o1.heading = Math.atan2(o1.vy, o1.vx);
        o2.heading = Math.atan2(o2.vy, o2.vx);

        const bumpAmt = isPlaying ? 0.16 : 0.05;
        o1.bump = Math.min(0.8, o1.bump + bumpAmt);
        o2.bump = Math.min(0.8, o2.bump + bumpAmt);
      }
    }
  }

  ORBITAL_MODULES.forEach((orb) => {
    const excite = orb.pulse + orb.bump;
    const curR = effectiveOrbRadius(orb);
    const rgb = orb.rgb;

    orbitalCtx.save();

    const glowGrad = orbitalCtx.createRadialGradient(orb.x, orb.y, curR * 0.5, orb.x, orb.y, curR * 1.5);
    glowGrad.addColorStop(0, `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(0.22 + excite * 0.3).toFixed(3)})`);
    glowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    orbitalCtx.fillStyle = glowGrad;
    orbitalCtx.beginPath();
    orbitalCtx.arc(orb.x, orb.y, curR * 1.5, 0, Math.PI * 2);
    orbitalCtx.fill();

    orbitalCtx.fillStyle = "#0a0d16";
    orbitalCtx.beginPath();
    orbitalCtx.arc(orb.x, orb.y, curR, 0, Math.PI * 2);
    orbitalCtx.fill();

    orbitalCtx.strokeStyle = orb.color;
    orbitalCtx.lineWidth = 1.6 + excite * 1.4;
    if (!onPhone) {
      orbitalCtx.shadowColor = orb.color;
      orbitalCtx.shadowBlur = 10 + excite * 16;
    }
    orbitalCtx.beginPath();
    orbitalCtx.arc(orb.x, orb.y, curR, 0, Math.PI * 2);
    orbitalCtx.stroke();
    orbitalCtx.shadowBlur = 0;

    // Outer halo ring strictly in the orb's own individual instrument color (no foreign UI outline)
    orbitalCtx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${(0.42 + excite * 0.38).toFixed(3)})`;
    orbitalCtx.lineWidth = 1.8;
    orbitalCtx.beginPath();
    orbitalCtx.arc(orb.x, orb.y, curR + 4, 0, Math.PI * 2);
    orbitalCtx.stroke();

    if (orb.id === expandedOrbId) {
      orbitalCtx.strokeStyle = orb.color;
      orbitalCtx.lineWidth = 2.4;
      if (!onPhone) {
        orbitalCtx.shadowColor = orb.color;
        orbitalCtx.shadowBlur = 12;
      }
      orbitalCtx.beginPath();
      orbitalCtx.arc(orb.x, orb.y, curR + 8, 0, Math.PI * 2);
      orbitalCtx.stroke();
      orbitalCtx.shadowBlur = 0;
    }

    orbitalCtx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.28)`;
    orbitalCtx.lineWidth = 0.8;
    orbitalCtx.beginPath();
    orbitalCtx.arc(orb.x, orb.y, curR * 0.65, 0, Math.PI * 2);
    orbitalCtx.stroke();

    if (!onPhone) {   // phones show just the number and name, no centre crosshair
      orbitalCtx.strokeStyle = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.45)`;
      orbitalCtx.beginPath();
      orbitalCtx.moveTo(orb.x - 4, orb.y); orbitalCtx.lineTo(orb.x + 4, orb.y);
      orbitalCtx.moveTo(orb.x, orb.y - 4); orbitalCtx.lineTo(orb.x, orb.y + 4);
      orbitalCtx.stroke();
    }

    const phoneLabel = onPhone ? orbPhoneLabel(orb) : null;
    const labelK = phoneLabel ? phoneLabel.k : 1;

    orbitalCtx.fillStyle = "#ffffff";
    orbitalCtx.font = "800 17px \"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, monospace";
    orbitalCtx.textAlign = "center";
    orbitalCtx.textBaseline = "middle";
    orbitalCtx.fillText(orb.num, orb.x, orb.y - 13 * labelK);

    orbitalCtx.fillStyle = orb.color;
    orbitalCtx.font = phoneLabel ? phoneLabel.font : "700 13px \"JetBrains Mono\", ui-monospace, SFMono-Regular, Menlo, monospace";
    const nameLines = phoneLabel ? phoneLabel.lines : orbNameLines(orb.name);
    if (nameLines.length > 1) {
      orbitalCtx.fillText(nameLines[0], orb.x, orb.y + 10 * labelK);
      orbitalCtx.fillText(nameLines[1], orb.x, orb.y + 24 * labelK);
    } else {
      orbitalCtx.fillText(orb.name, orb.x, orb.y + 12 * labelK);
    }

    orbitalCtx.restore();
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initOrbitalConstellation);
} else {
  setTimeout(initOrbitalConstellation, 100);
}
