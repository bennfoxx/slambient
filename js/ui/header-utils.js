/* ==========================================================================
   HEADER UTILITIES (Phase 7): UNDO, TAP TEMPO, SHORTCUTS PANEL
   ========================================================================== */

// UNDO: snapshot the whole patch (serializeCurrentPatch, same format as the
// BANK save) right before anything that rewrites it wholesale -- presets,
// ⟲ ALL, new seed, and each module's own randomize button -- and restore it
// with applyPatchData. Wrapping the globals (rather than editing each body)
// also catches inline onclick calls; the depth counter means one click is one
// undo step even when e.g. randomizeEverything calls the per-module
// randomizers internally. Master volume is deliberately not undone.
const UNDO_LIMIT = 30;
const undoStack = [];
let undoWrapDepth = 0;

function refreshUndoButton() {
  const btn = document.getElementById("btnUndoPatch");
  if (!btn) return;
  btn.disabled = undoStack.length === 0;
  btn.title = undoStack.length
    ? `Undo the last randomize / preset / new seed (Ctrl/⌘+Z), ${undoStack.length} step${undoStack.length === 1 ? "" : "s"} available`
    : "Nothing to undo yet";
}

function pushUndoSnapshot() {
  try {
    undoStack.push(serializeCurrentPatch());
    if (undoStack.length > UNDO_LIMIT) undoStack.shift();
  } catch (err) {
    console.error("Undo snapshot failed:", err);
  }
  refreshUndoButton();
}

function undoPatchChange() {
  const snap = undoStack.pop();
  refreshUndoButton();
  if (!snap) return;
  try {
    applyPatchData(snap, ["knobMasterVolume"]);
    setRecordStatus(`Undo: restored ${snap.presetName || "previous patch"}`);
  } catch (err) {
    console.error("Undo failed:", err);
  }
}

[
  "applyPreset", "randomizeEverything", "newSeed", "randomizeDspChain",
  "randomizeDrone", "randomizeDrums", "randomizeChords", "randomizeNoise",
  "randomizeField", "randomizeKeyScale", "randomizeArp", "randomizeFilter",
  "randomizeDelay", "randomizeReverbChorus", "randomizeSpace", "randomizeMeter"
].forEach(name => {
  const orig = window[name];
  if (typeof orig !== "function") return;
  window[name] = function (...args) {
    if (undoWrapDepth === 0) pushUndoSnapshot();
    undoWrapDepth++;
    try { return orig.apply(this, args); } finally { undoWrapDepth--; }
  };
});
refreshUndoButton();

// TAP TEMPO: robust jitter-resistant algorithm with outlier rejection and
// Exponential Moving Average (EMA) across a sliding window of the last 4-8 taps.
// A pause longer than 2.2s starts a fresh count. Clamped to the tempo slider range.
const tapTimes = [];
let tapSmoothedInterval = null;
function tapTempo() {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2200) {
    tapTimes.length = 0;
    tapSmoothedInterval = null;
  }
  tapTimes.push(now);
  if (tapTimes.length > 8) tapTimes.shift();

  const btn = document.getElementById("btnTapTempo");
  if (btn) {
    btn.classList.add("tapped");
    setTimeout(() => btn.classList.remove("tapped"), 90);
  }
  if (tapTimes.length < 3) {
    setRecordStatus(`Tap tempo: keep tapping (${tapTimes.length})`);
    return;
  }

  // Calculate raw delta intervals between successive taps
  const intervals = [];
  for (let i = 1; i < tapTimes.length; i++) {
    intervals.push(tapTimes[i] - tapTimes[i - 1]);
  }

  // Outlier rejection: if 4 or more intervals exist, compute median and filter
  // out taps that diverge more than 40% from the median pace (e.g. accidental double-clicks or delayed taps)
  const sorted = intervals.slice().sort((a, b) => a - b);
  const medianInterval = sorted[Math.floor(sorted.length / 2)];
  const validIntervals = intervals.filter(iv => Math.abs(iv - medianInterval) < medianInterval * 0.40);
  const activeIntervals = validIntervals.length >= 2 ? validIntervals : intervals;

  // Compute weighted average of valid intervals (recent intervals get higher weight)
  let weightedSum = 0;
  let weightTotal = 0;
  activeIntervals.forEach((iv, idx) => {
    const w = 1 + idx * 0.35;
    weightedSum += iv * w;
    weightTotal += w;
  });
  const currentIntervalAvg = weightedSum / weightTotal;

  // Apply Exponential Moving Average (EMA) if previous smoothed interval exists
  if (tapSmoothedInterval === null) {
    tapSmoothedInterval = currentIntervalAvg;
  } else {
    const alpha = 0.42; // Fast convergence without jumpiness
    tapSmoothedInterval = alpha * currentIntervalAvg + (1 - alpha) * tapSmoothedInterval;
  }

  const knob = document.getElementById("knobBpmHeader");
  const lo = knob ? +knob.min : 45, hi = knob ? +knob.max : 115;
  const tapped = Math.round(60000 / tapSmoothedInterval);
  const next = Math.max(lo, Math.min(hi, tapped));
  if (knob) knob.value = next;
  updateBpm(knob);
  setRecordStatus(tapped === next ? `Tap tempo: ${next} BPM` : `Tap tempo: ${tapped} BPM is out of range, set to ${next}`);
}

// FIELD MANUAL & SHORTCUTS PANEL
function switchManualTab(tabName) {
  const ov = document.getElementById("shortcutsOverlay");
  if (!ov) return;
  ov.querySelectorAll(".manual-nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === tabName);
  });
  ov.querySelectorAll(".manual-pane").forEach(p => {
    p.classList.toggle("active", p.id === "manualPane_" + tabName);
  });
}

function buildShortcutsPanel() {
  const ov = document.createElement("div");
  ov.className = "shortcuts-overlay";
  ov.id = "shortcutsOverlay";
  const row = (label, keys) => `<div class="sc-row"><span>${label}</span><span>${keys.map(k => `<kbd>${k}</kbd>`).join("")}</span></div>`;
  ov.innerHTML = `
    <div class="shortcuts-panel" role="dialog" aria-label="Slambient Field Manual and Keyboard Shortcuts">
      <div class="manual-header">
        <div class="manual-title">
          <span>Slambient Field Manual</span>
          <span class="pill">v1.2</span>
        </div>
        <button class="shortcuts-close" onclick="toggleShortcutsPanel(false)" title="Close (Esc)" aria-label="Close Field Manual">✕</button>
      </div>

      <div class="manual-nav" role="tablist">
        <button class="manual-nav-btn active" data-tab="shortcuts" onclick="switchManualTab('shortcuts')">⚡ Shortcuts</button>
        <button class="manual-nav-btn" data-tab="guide" onclick="switchManualTab('guide')">🪐 Field Guide</button>
        <button class="manual-nav-btn" data-tab="modules" onclick="switchManualTab('modules')">🎛️ Sound Modules</button>
        <button class="manual-nav-btn" data-tab="patches" onclick="switchManualTab('patches')">💾 Patches & MIDI</button>
        <button class="manual-nav-btn" data-tab="secrets" onclick="switchManualTab('secrets')">✨ Secrets</button>
      </div>

      <!-- PANE 1: SHORTCUTS -->
      <div class="manual-pane active" id="manualPane_shortcuts">
        <h4>Transport & Session</h4>
        ${row("Play / Pause Engine", ["Space", "Enter"])}
        ${row("Undo Randomize / Preset", ["Ctrl/⌘", "Z"])}
        ${row("Toggle Field Manual", ["?"])}
        ${row("Close Modal / Exit Fullscreen", ["Esc"])}

        <h4>Play Notes (Keyboard)</h4>
        ${row("White Keys (C3–C5)", ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"])}
        ${row("Black Keys", ["W", "E", "T", "Y", "U", "O", "P"])}
        ${row("Octave Shift", ["Click OCT - / OCT +"])}

        <h4>CRT Visualizer</h4>
        ${row("Fullscreen CRT Mode", ["Double-click"])}
        ${row("Toggle Scenery / Rings", ["Visualizer Header Buttons"])}

        <h4>Void Raiders (Arcade Minigame)</h4>
        ${row("Steer Defender", ["←", "→"])}
        ${row("Fire Laser / Start", ["Space"])}
        ${row("Quit Game", ["Esc"])}

        <h4>App & Installation</h4>
        ${row("Install PWA App", ["Header [Install] or Browser Menu"])}
        ${row("Screen Wake Lock", ["Automatic during playback"])}
      </div>

      <!-- PANE 2: FIELD GUIDE -->
      <div class="manual-pane" id="manualPane_guide">
        <div class="guide-card">
          <div class="guide-card-title">🌀 The Brian Eno Coprime Loop Engine</div>
          <div class="guide-card-body">
            Slambient generates music without traditional 4-bar repetition. Each layer runs on a prime number of steps:
            <strong>Drums (7)</strong>, <strong>Shimmer Arp (11)</strong>, <strong>Chords (13)</strong>, <strong>Sub-Drone (17)</strong>, and <strong>Weather (19 & 23)</strong>. Because prime numbers share no common factors, their interlocking rhythms evolve endlessly without ever looping identically.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎹 LIVE vs. AUTO Keyboard Takeover</div>
          <div class="guide-card-body">
            In <strong>AUTO</strong>, the engine composes generative passages. Touching any key switches immediately to <strong>LIVE</strong> takeover. Releasing all keys hands control back to the generative engine on the next downbeat, smoothly continuing harmonies from your played root and chord quality.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎼 14 Scales & Ragas</div>
          <div class="guide-card-body">
            Select modal, pentatonic, or classical Indian raga tunings from the header: <code>Dorian</code>, <code>Lydian</code>, <code>Aeolian</code>, <code>Mixolydian</code>, <code>Pentatonic</code>, <code>Major 9</code>, <code>Hirajoshi</code>, <code>Insen</code>, <code>Lydian Dom</code>, <code>Phrygian Amb</code>, <code>Whole Tone</code>, <code>Maj Pentatonic</code>, <code>Bilawal</code> (Indian Classical Major), and <code>Bhairav</code> (Morning Raga).
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🪐 Orbital View vs. Console Rack</div>
          <div class="guide-card-body">
            Use the top view switch to toggle between <strong>Orbital View</strong> (floating planetary orbs with gravitational bounce physics and momentum flinging) and <strong>Console Rack</strong> (channel strips with tactile rotary faders and drag-and-drop pedalboards).
          </div>
        </div>
      </div>

      <!-- PANE 3: SOUND MODULES -->
      <div class="manual-pane" id="manualPane_modules">
        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-drone);">Mod 1 — Sub & Tanpura Drone</div>
          <div class="guide-card-body">
            Sinusoidal sub oscillator (D0–D2) or 24-harmonic <strong>Didgeridoo</strong> formant synthesis. Toggle <strong>Tanpura</strong> for an authentic 4-string acoustic drone with Pa/Ma/Ni sruti tuning and cotton-thread <em>jawari</em> bridge buzz.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-drum);">Mod 2 — Organic Drums & Tabla</div>
          <div class="guide-card-body">
            9 groove styles from Four Tet organic woodblocks to <strong>Classical Indian Tabla</strong> (with modeled <em>Ge, Na, Tin, Ti, Re, Ki, Dha</em> strokes and palm-modulated Bayan pitch scoops).
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-chord);">Mod 3 — Chords & Maihar Sitar</div>
          <div class="guide-card-body">
            11 instruments including Rhodes, Solina Strings, and a physical model of a <strong>Maihar Sitar</strong> featuring a parabolic jawari waveshaper, dual gourd acoustic formants (920/2750 Hz), <em>meend</em> pitch bends, and 3-string sympathetic <em>taraf</em> ringing.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-arp);">Mod 4 — Shimmer Arpeggio</div>
          <div class="guide-card-body">
            6 patterns including breathy <strong>Raga Taan</strong> phrases, FM glass chimes, Bansuri flutes, and an additive live arpeggiator that smoothly evolves held chord notes.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-noise);">Mod 5 — Atmosphere & Field Recorder</div>
          <div class="guide-card-body">
            Rain, thunder, tape noise, brook, and wind. Includes the <strong>Pocket Field Recorder</strong> in the header: <strong>Hold [🎙 MIC]</strong> to record real-world audio, or <strong>[📼 DROP]</strong> an audio file to weave into the soundscape.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-filter);">Modules 6–8 — Reorderable Pedalboard</div>
          <div class="guide-card-body">
            Cascaded <strong>4-Pole Filter</strong> (60 Hz–16 kHz), Tempo-Synced <strong>Analog Delay</strong> (48% feedback ceiling), and 3-Mode <strong>Reverb & Chorus</strong>. Drag the <code>⠿</code> handle or use arrow buttons to reorder pedals live!
          </div>
        </div>
      </div>

      <!-- PANE 4: PATCHES & MIDI -->
      <div class="manual-pane" id="manualPane_patches">
        <div class="guide-card">
          <div class="guide-card-title">💾 User Patch Bank (U1–U6)</div>
          <div class="guide-card-body">
            Switch between <strong>FACTORY</strong> (15 curated presets) and <strong>USER</strong> tabs in the preset bar:<br>
            • <strong>Click empty slot:</strong> Name and save current sound.<br>
            • <strong>Click filled slot:</strong> Recall patch immediately.<br>
            • <strong>Shift + Click:</strong> Instantly overwrite slot.<br>
            • <strong>Right-Click / Long-Press:</strong> Rename, Overwrite, or Clear.<br>
            • Persisted locally in your browser with full JSON export/import.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎹 Web MIDI Hardware Controls</div>
          <div class="guide-card-body">
            Plug in any USB/TRS MIDI controller and click <strong>MIDI</strong> in the header. Supported Continuous Controllers (CC):<br>
            • <strong>CC 74:</strong> Master Filter Cutoff (60 Hz – 16 kHz)<br>
            • <strong>CC 71:</strong> Master Filter Resonance (Q 0.5 – 8.0)<br>
            • <strong>CC 1:</strong> Diffusion Space / Weather (0 – 100%)<br>
            • <strong>CC 7:</strong> Master Output Volume<br>
            • <strong>CC 64:</strong> Sustain Pedal (holds notes in scale)<br>
            • <strong>Pitch Bend:</strong> Continuous live glide (±2 semitones)
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎙️ Audio Recording & Multi-Track Stems</div>
          <div class="guide-card-body">
            Pick your output format next to the Record button:<br>
            • <strong>MP3:</strong> 320 kbps constant-bitrate audio for quick sharing.<br>
            • <strong>WAV:</strong> Lossless uncompressed 16-bit PCM audio.<br>
            • <strong>STEMS (.ZIP):</strong> Records 5 isolated stereo buses (Master, Drone, Drums, Chords, Arp) plus <code>patch.json</code> and session notes in a clean downloadable archive!
          </div>
        </div>
      </div>

      <!-- PANE 5: SECRETS -->
      <div class="manual-pane" id="manualPane_secrets">
        <div class="guide-card">
          <div class="guide-card-title">👾 Void Raiders (Arcade Minigame)</div>
          <div class="guide-card-body">
            Click inside the CRT visualizer canvas or press <strong>Space</strong> when transport is stopped to launch the built-in retro arcade shooter! Steer with <code>←</code> / <code>→</code> and fire lasers with <code>Space</code>.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">👤 MU-TH-UR 6000 Eno Head</div>
          <div class="guide-card-body">
            Click the spinning 3D wireframe Brian Eno head in the top right to cycle CRT phosphor themes across the entire workstation (Yellow, Amber, Green, Pink, Ice Blue).
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🪐 Momentum Orb Flinging</div>
          <div class="guide-card-body">
            In Orbital View, grab any module orb and fling it with quick pointer velocity. It will drift through space, bounce off walls, and glow upon colliding with other modules.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">⛶ Immersive Fullscreen CRT</div>
          <div class="guide-card-body">
            Double-click the CRT oscilloscope canvas to expand into full-bleed CRT projection mode running at 60 FPS. Press <code>Esc</code> to return.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">⏪ Instant Patch Undo</div>
          <div class="guide-card-body">
            Accidentally hit Randomize All or switched away from an evolving patch? Press <code>Ctrl/⌘ + Z</code> or click <strong>Undo</strong> in the header to jump back!
          </div>
        </div>
      </div>
    </div>`;
  ov.addEventListener("pointerdown", (e) => { if (e.target === ov) toggleShortcutsPanel(false); });
  document.body.appendChild(ov);
  return ov;
}

function toggleShortcutsPanel(force) {
  const ov = document.getElementById("shortcutsOverlay") || buildShortcutsPanel();
  const open = typeof force === "boolean" ? force : !ov.classList.contains("open");
  ov.classList.toggle("open", open);
  const btn = document.getElementById("btnShortcuts");
  if (btn) { btn.classList.toggle("active", open); btn.blur(); }
}

window.addEventListener("keydown", (e) => {
  const t = e.target;
  const typing = t && (t.isContentEditable || t.tagName === "TEXTAREA" ||
    (t.tagName === "INPUT" && !["range", "checkbox", "radio", "button"].includes(t.type)));
  const ov = document.getElementById("shortcutsOverlay");
  if (e.key === "Escape" && ov && ov.classList.contains("open")) {
    toggleShortcutsPanel(false);
    return;
  }
  if (typing) return;
  if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    toggleShortcutsPanel();
  } else if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.code === "KeyZ") {
    e.preventDefault();
    undoPatchChange();
  }
});

