// Slambient — Interactive Keyboard & Multi-Touch Glissando Controller Module
// Handles on-screen 25-key / 88-key radar modes, touch glissando, active voice LEDs, and QWERTY input

// Track active pointer -> midi note mapping so touch glissando (sliding a
// finger across keys on mobile) smoothly releases the previous key and plays
// the newly entered key without leaving stuck notes.
const pointerActiveMidi = new Map();

function bindKeyEvents(el, midi) {
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    pointerActiveMidi.set(e.pointerId, midi);
    startNoteLive(midi, 90);
  });
  el.addEventListener("pointerup", (e) => {
    e.preventDefault();
    const activeMidi = pointerActiveMidi.get(e.pointerId);
    pointerActiveMidi.delete(e.pointerId);
    stopNoteLive(activeMidi !== undefined ? activeMidi : midi);
  });
  el.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "touch" && heldMidiNotes.has(midi)) {
      stopNoteLive(midi);
    }
  });
  el.addEventListener("pointercancel", (e) => {
    const activeMidi = pointerActiveMidi.get(e.pointerId);
    pointerActiveMidi.delete(e.pointerId);
    stopNoteLive(activeMidi !== undefined ? activeMidi : midi);
  });
  el.addEventListener("lostpointercapture", (e) => {
    const activeMidi = pointerActiveMidi.get(e.pointerId);
    if (activeMidi !== undefined) {
      pointerActiveMidi.delete(e.pointerId);
      stopNoteLive(activeMidi);
    }
  });
  el.addEventListener("pointerenter", (e) => {
    if (e.pointerType !== "touch" && e.buttons === 1 && !heldMidiNotes.has(midi)) {
      startNoteLive(midi, 90);
    }
  });
}

(function bindTouchKeyboardGlissando() {
  const container = document.getElementById("keyboardContainer");
  if (!container) return;
  container.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch" || !pointerActiveMidi.has(e.pointerId)) return;
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const keyEl = hit && hit.closest ? hit.closest(".black-key, .white-key") : null;
    const prevMidi = pointerActiveMidi.get(e.pointerId);
    if (!keyEl) {
      if (prevMidi !== undefined) {
        pointerActiveMidi.delete(e.pointerId);
        stopNoteLive(prevMidi);
      }
      return;
    }
    const nextMidi = parseInt(keyEl.dataset.midi, 10);
    if (!isNaN(nextMidi) && nextMidi !== prevMidi) {
      if (prevMidi !== undefined) stopNoteLive(prevMidi);
      pointerActiveMidi.set(e.pointerId, nextMidi);
      startNoteLive(nextMidi, 90);
    }
  }, { passive: true });
})();

let keyboardDisplayMode = "25";

function setKeyboardDisplayMode(mode) {
  keyboardDisplayMode = mode;
  const container = document.getElementById("keyboardContainer");
  const btnPlay = document.getElementById("btnKbPlay");
  const btnRadar = document.getElementById("btnKbRadar");
  const hintText = document.getElementById("keyboardHintText");
  const octControls = document.querySelector(".keyboard-panel .oct-controls");

  if (mode === "88") {
    if (container) container.classList.add("mode-radar");
    if (btnPlay) btnPlay.classList.remove("active");
    if (btnRadar) btnRadar.classList.add("active");
    if (hintText) hintText.innerHTML = `Full-Range Radar (A0 - C8) · Multi-Voice Harmonic Radar`;
    if (octControls) {
      octControls.style.visibility = "hidden";
      octControls.style.pointerEvents = "none";
    }
  } else {
    if (container) container.classList.remove("mode-radar");
    if (btnPlay) btnPlay.classList.add("active");
    if (btnRadar) btnRadar.classList.remove("active");
    if (hintText) hintText.innerHTML = `Keys A-K · <span id="valOctave">C${baseKeyboardOctave} - C${baseKeyboardOctave + 2}</span>`;
    if (octControls) {
      octControls.style.visibility = "";
      octControls.style.pointerEvents = "";
    }
  }
  buildKeyboard();
}

let cachedKeyElements = [];
function buildKeyboard() {
  const container = document.getElementById("keyboardContainer");
  if (!container) return;
  container.innerHTML = "";
  cachedKeyElements = [];

  const whiteKeysLayer = document.createElement("div"); whiteKeysLayer.className = "white-keys-layer";
  const blackKeysLayer = document.createElement("div"); blackKeysLayer.className = "black-keys-layer";

  if (keyboardDisplayMode === "88") {
    container.classList.add("mode-radar");
    const whiteKeys = [];
    for (let m = 21; m <= 108; m++) {
      if ([0, 2, 4, 5, 7, 9, 11].includes(m % 12)) {
        whiteKeys.push(m);
      }
    }

    for (let w = 0; w < whiteKeys.length; w++) {
      const midi = whiteKeys[w];
      const keyEl = document.createElement("div");
      keyEl.className = "white-key";
      keyEl.dataset.midi = midi;
      if (isKeyLedLit(midi)) keyEl.classList.add("in-scale");

      if (midi === 21 || midi % 12 === 0) {
        const label = document.createElement("span");
        label.className = "key-label octave-marker";
        label.textContent = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
        keyEl.appendChild(label);
      }

      whiteKeysLayer.appendChild(keyEl);
      cachedKeyElements.push({ el: keyEl, midi, lastClass: "" });
    }

    for (let w = 0; w < whiteKeys.length - 1; w++) {
      if (whiteKeys[w + 1] - whiteKeys[w] === 2) {
        const bMidi = whiteKeys[w] + 1;
        const bKeyEl = document.createElement("div");
        bKeyEl.className = "black-key";
        bKeyEl.dataset.midi = bMidi;
        const pct = ((w + 1) / 52) * 100;
        bKeyEl.style.left = `calc(${pct.toFixed(4)}% - 0.5px)`;
        bKeyEl.style.transform = "translateX(-50%)";
        bKeyEl.style.width = `calc(100% / 52 * 0.72)`;
        if (isKeyLedLit(bMidi)) bKeyEl.classList.add("in-scale");

        blackKeysLayer.appendChild(bKeyEl);
        cachedKeyElements.push({ el: bKeyEl, midi: bMidi, lastClass: "" });
      }
    }

    container.appendChild(whiteKeysLayer);
    container.appendChild(blackKeysLayer);
    return;
  }

  container.classList.remove("mode-radar");

  const whiteKeyOffsets = [0, 2, 4, 5, 7, 9, 11];
  const whiteShortcuts = ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"];

  const blackKeyOffsets = [
    { semi: 1, seam: 1, key: "W" }, { semi: 3, seam: 2, key: "E" },
    { semi: 6, seam: 4, key: "T" }, { semi: 8, seam: 5, key: "Y" },
    { semi: 10, seam: 6, key: "U" }
  ];
  const blackShortcutsOct2 = ["O", "P", "", "", ""];

  let whiteIdx = 0;

  for (let oct = 0; oct < 2; oct++) {
    for (let w = 0; w < 7; w++) {
      const midi = (baseKeyboardOctave + oct + 1) * 12 + whiteKeyOffsets[w];
      const keyEl = document.createElement("div");
      keyEl.className = "white-key"; keyEl.dataset.midi = midi;

      if (isKeyLedLit(midi)) keyEl.classList.add("in-scale");

      if (whiteIdx < whiteShortcuts.length) {
        const sc = document.createElement("span");
        sc.className = "key-shortcut";
        sc.textContent = `[${whiteShortcuts[whiteIdx]}]`;
        keyEl.appendChild(sc);
      }

      const label = document.createElement("span");
      label.className = "key-label";
      label.textContent = `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
      keyEl.appendChild(label);

      whiteIdx++;
      bindKeyEvents(keyEl, midi);
      whiteKeysLayer.appendChild(keyEl);
      cachedKeyElements.push({ el: keyEl, midi, lastClass: "" });
    }
  }

  const topMidi = (baseKeyboardOctave + 3) * 12;
  const topKey = document.createElement("div"); topKey.className = "white-key"; topKey.dataset.midi = topMidi;
  if (isKeyLedLit(topMidi)) topKey.classList.add("in-scale");
  if (whiteIdx < whiteShortcuts.length) {
    const topSc = document.createElement("span");
    topSc.className = "key-shortcut";
    topSc.textContent = `[${whiteShortcuts[whiteIdx]}]`;
    topKey.appendChild(topSc);
  }
  const topLabel = document.createElement("span"); topLabel.className = "key-label";
  topLabel.textContent = `C${Math.floor(topMidi / 12) - 1}`; topKey.appendChild(topLabel);
  bindKeyEvents(topKey, topMidi);
  whiteKeysLayer.appendChild(topKey);
  cachedKeyElements.push({ el: topKey, midi: topMidi, lastClass: "" });

  for (let oct = 0; oct < 2; oct++) {
    blackKeyOffsets.forEach((bk, bIdx) => {
      const midi = (baseKeyboardOctave + oct + 1) * 12 + bk.semi;
      const bKeyEl = document.createElement("div"); bKeyEl.className = "black-key"; bKeyEl.dataset.midi = midi;

      const seamIdx = oct * 7 + bk.seam;
      const pct = (seamIdx / 15) * 100;
      const gapOffsetPx = ((seamIdx - 7.5) / 15) * 3;
      bKeyEl.style.left = `calc(${pct.toFixed(4)}% + ${gapOffsetPx.toFixed(2)}px)`;

      if (isKeyLedLit(midi)) bKeyEl.classList.add("in-scale");

      const shortcutKey = oct === 0 ? bk.key : (blackShortcutsOct2[bIdx] || "");
      if (shortcutKey) {
        const bSc = document.createElement("span");
        bSc.className = "key-shortcut";
        bSc.textContent = `[${shortcutKey}]`;
        bKeyEl.appendChild(bSc);
      }

      const bLabel = document.createElement("span"); bLabel.className = "black-key-label";
      bLabel.textContent = `${NOTE_NAMES[midi % 12]}`; bKeyEl.appendChild(bLabel);

      bindKeyEvents(bKeyEl, midi);
      blackKeysLayer.appendChild(bKeyEl);
      cachedKeyElements.push({ el: bKeyEl, midi, lastClass: "" });
    });
  }

  container.appendChild(whiteKeysLayer); container.appendChild(blackKeysLayer);
}

function shiftOctave(delta) {
  baseKeyboardOctave = Math.max(1, Math.min(5, baseKeyboardOctave + delta));
  const valOctave = document.getElementById("valOctave");
  if (valOctave) valOctave.textContent = `C${baseKeyboardOctave} - C${baseKeyboardOctave + 2}`;
  buildKeyboard();
}

function renderKeyboardHighlights() {
  const now = performance.now();

  for (let i = 0; i < cachedKeyElements.length; i++) {
    const item = cachedKeyElements[i];
    const el = item.el;
    const midi = item.midi;
    const inScale = isKeyLedLit(midi);
    let activeClass = "";

    if (activeMidiNotes.has(midi)) {
      const info = activeMidiNotes.get(midi);
      if (now < info.expiry) {
        if (info.source === "CHORD") activeClass = "active-chord";
        else if (info.source === "ARP") activeClass = "active-arp";
        else if (info.source === "DRONE") activeClass = "active-drone";
        else if (info.source === "DRUM") activeClass = "active-drum";
        else activeClass = "active-live";
      } else {
        activeMidiNotes.delete(midi);
      }
    } else if (heldMidiNotes.has(midi)) {
      activeClass = keyboardRoute === "CHORD" ? "active-chord" : "active-live";
    } else if (typeof currentDroneMidi === "function" && isPlaying && isChannelAudible('drone') && droneVol > 0.01 && currentDroneMidi() === midi) {
      activeClass = "active-drone";
    }

    const sig = (inScale ? "1:" : "0:") + activeClass;
    if (item.lastClass !== sig) {
      item.lastClass = sig;
      el.classList.toggle("in-scale", inScale);
      el.classList.remove("active-chord", "active-arp", "active-live", "active-drone", "active-drum");
      if (activeClass) el.classList.add(activeClass);
    }
  }
}

const QWERTY_MAP = {
  'KeyA': 0, 'KeyW': 1, 'KeyS': 2, 'KeyE': 3, 'KeyD': 4, 'KeyF': 5,
  'KeyT': 6, 'KeyG': 7, 'KeyY': 8, 'KeyH': 9, 'KeyU': 10, 'KeyJ': 11,
  'KeyK': 12, 'KeyO': 13, 'KeyL': 14, 'KeyP': 15, 'Semicolon': 16, 'Quote': 17
};

window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (QWERTY_MAP[e.code] !== undefined) {
    const midi = (baseKeyboardOctave + 1) * 12 + QWERTY_MAP[e.code];
    startNoteLive(midi, 90);
  }
});

window.addEventListener('keyup', (e) => {
  const tag = e.target.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
  if (QWERTY_MAP[e.code] !== undefined) {
    const midi = (baseKeyboardOctave + 1) * 12 + QWERTY_MAP[e.code];
    stopNoteLive(midi);
  }
});

