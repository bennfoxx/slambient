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
// A pause longer than 2.6s starts a fresh count. Clamped to the tempo slider range.
const tapTimes = [];
let tapSmoothedInterval = null;
function tapTempo() {
  const now = performance.now();
  if (tapTimes.length && now - tapTimes[tapTimes.length - 1] > 2600) {
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
    <div class="shortcuts-panel" role="dialog" aria-label="Meander Engine Field Manual and Keyboard Shortcuts">
      <div class="manual-header">
        <div class="manual-title">
          <span>Meander Engine Field Manual</span>
          <span class="pill">v2.0</span>
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
        ${row("Undo Patch / Randomize", ["Ctrl/⌘", "Z"])}
        ${row("Toggle Field Manual", ["?"])}
        ${row("Close Modal / Exit Fullscreen", ["Esc"])}
        ${row("Deck Switcher", ["1: Inst", "2: FX", "3: Split"])}
        ${row("Workspace Edit Mode", ["E"])}
        ${row("Cycle Phosphor Palette", ["P"])}

        <h4>Play Notes (Keyboard)</h4>
        ${row("White Keys (C3–C5)", ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'"])}
        ${row("Black Keys", ["W", "E", "T", "Y", "U", "O", "P"])}
        ${row("Octave Shift", ["Click OCT - / OCT +"])}
        ${row("Display Modes", ["25 PLAY", "61 RADAR"])}

        <h4>CRT Visualizers & Oscilloscope</h4>
        ${row("Fullscreen CRT Focus", ["Double-click Card"])}
        ${row("Toggle Scenery Layers", ["Waterfall", "Flight", "Roadside", "Fractal", "Rings"])}
        ${row("View Switcher", ["Console Rack", "12-Orb Orbital Constellation"])}

        <h4>Void Raiders (Dedicated Arcade CRT)</h4>
        ${row("Launch Arcade Module", ["Arcade Button / Header"])}
        ${row("Steer Defender", ["←", "→", "Touch Slide"])}
        ${row("Fire Laser / Start", ["Space", "Touch FIRE"])}
        ${row("Fullscreen Arcade", ["Double-click", "⛶ Button"])}
        ${row("Close / Hide Arcade", ["Esc", "✕ Button"])}

        <h4>App & Installation</h4>
        ${row("Install PWA App", ["Header [Install] or Browser Menu"])}
        ${row("Screen Wake Lock", ["Automatic during playback"])}
      </div>

      <!-- PANE 2: FIELD GUIDE -->
      <div class="manual-pane" id="manualPane_guide">
        <div class="guide-card">
          <div class="guide-card-title">🌀 The Brian Eno Coprime Loop Engine</div>
          <div class="guide-card-body">
            Meander Engine creates evolving music without fixed 4-bar repetition. Each sound generator runs on an independent prime-length step cycle:
            <strong>Drums (7)</strong>, <strong>Shimmer Arp (11)</strong>, <strong>Chords (13)</strong>, <strong>Sub-Drone (17)</strong>, and <strong>Weather & Atmosphere (19 & 23)</strong>. Because prime numbers share no common factors, their interlocking rhythms evolve endlessly without ever looping identically over human timescales.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎹 LIVE vs. AUTO Keyboard Takeover</div>
          <div class="guide-card-body">
            In <strong>AUTO</strong> mode, the generative algorithm composes ambient movements. Touching any keyboard key instantly triggers <strong>LIVE</strong> takeover. Releasing all keys hands seamless control back to the engine on the next downbeat, smoothly continuing harmonies from your played root and chord quality.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎼 Complete 14 Scales, Modes & Ragas</div>
          <div class="guide-card-body">
            Select modal, pentatonic, or classical Indian raga tunings from the header clock capsule:<br>
            • <code>Dorian</code>: Modal minor with raised 6th; quintessential ambient jazz & impressionism.<br>
            • <code>Lydian</code>: Dreamy raised 4th; weightless floating cinematic soundscape.<br>
            • <code>Aeolian</code>: Pure natural minor; emotional depth and nocturnal space.<br>
            • <code>Mixolydian</code>: Warm dominant 7th character; organic warmth and grounded folk tones.<br>
            • <code>Minor Pentatonic</code>: Timeless 5-tone blues and meditative serenity.<br>
            • <code>Major 9</code>: Lush, optimistic neo-soul harmony with rich extensions.<br>
            • <code>Hirajoshi</code>: Traditional Japanese koto pentatonic; delicate tension and beauty.<br>
            • <code>Insen</code>: Japanese folk tuning with poignant flat 2nd intervals.<br>
            • <code>Lydian Dominant</code>: Acoustic overtone scale with raised 4th and flat 7th.<br>
            • <code>Phrygian Ambience</code>: Andalusian flamenco mystery with dark minor second colors.<br>
            • <code>Whole Tone</code>: Symmetrical six-tone Debussy dreamscapes without tonal gravity.<br>
            • <code>Maj Pentatonic</code>: Crisp, open folk brightness and pristine clarity.<br>
            • <code>Raga Bilawal</code>: North Indian morning thaat; majestic pristine major scale.<br>
            • <code>Raga Bhairav</code>: Sacred dawn raga featuring flattened 2nd and flattened 6th with devotional microtonal resonance.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🔀 Split View & Three-Deck Workflow</div>
          <div class="guide-card-body">
            Use the lower deck switcher buttons (or shortcuts <code>1</code>, <code>2</code>, <code>3</code>) to toggle between:<br>
            • <strong>Instruments (1):</strong> Focused channel strips for all 6 generative synth voices.<br>
            • <strong>Studio FX (2):</strong> Dedicated Eurorack pedalboard chassis with full parameter arrays.<br>
            • <strong>Split View (3):</strong> Desktop dual-rail cockpit featuring generative instruments on the left and miniaturized live studio effects on the right for simultaneous real-time sculpting!
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🪐 12-Orb Orbital View vs. Console Rack</div>
          <div class="guide-card-body">
            Toggle the top view switcher to enter <strong>Orbital View</strong>: a celestial solar system of 12 dedicated orbs representing all 6 instruments and 5 consolidated effects units plus Terminal OUT. Experience real-time gravitational bounce physics, pointer velocity flinging, collision glow, and interactive mini-inspectors on click.
          </div>
        </div>
      </div>

      <!-- PANE 3: SOUND MODULES -->
      <div class="manual-pane" id="manualPane_modules">
        <h4>Synthesizers & Acoustic Models (Modules 1–6)</h4>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-drone);">Mod 1 — SUB & Tanpura Drone</div>
          <div class="guide-card-body">
            Ultra-low sinusoidal sub oscillator (D0–D2) or 24-harmonic <strong>Didgeridoo</strong> formant synthesis. Toggle <strong>Tanpura</strong> for an authentic 4-string acoustic drone with Pa/Ma/Ni sruti tuning, subtle pitch detune drift, and cotton-thread <em>jawari</em> bridge buzz.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-drum);">Mod 2 — Organic DRUMS & Tabla</div>
          <div class="guide-card-body">
            9 groove styles ranging from Four Tet organic woodblocks and minimal clicks to <strong>Classical Indian Tabla</strong> (with physically modeled <em>Ge, Na, Tin, Ti, Re, Ki, Dha</em> strokes and palm-modulated Bayan pitch scoops).
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-chord);">Mod 3 — CHORDS & Maihar Sitar</div>
          <div class="guide-card-body">
            11 instruments including Electric Rhodes, Solina Strings, and an acoustic physical model of a <strong>Maihar Sitar</strong> featuring a parabolic jawari waveshaper, dual gourd acoustic formants (920 & 2750 Hz), <em>meend</em> pitch bends, and 3-string sympathetic <em>taraf</em> ringing.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-arp);">Mod 4 — Shimmer ARP</div>
          <div class="guide-card-body">
            6 patterns including breathy <strong>Raga Taan</strong> phrases, FM glass chimes, Bansuri bamboo flute modeling, and an additive live arpeggiator that smoothly evolves held chord notes.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: var(--color-noise);">Mod 5 — NOISE & Atmosphere</div>
          <div class="guide-card-body">
            Analog noise sculptors including rain, distant thunder, tape hiss, mountain brook, and wind gusts. Uses prime coprime step intervals (19 & 23) for natural, non-repeating meteorological waves.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #2bcbba;">Mod 6 — FIELD Sampler & Live Mic</div>
          <div class="guide-card-body">
            Pocket field recording studio integrated into the rack. Hold <strong>[🎙 MIC]</strong> to capture real-time acoustic samples from your microphone, or <strong>[📼 DROP]</strong> an external WAV/MP3 audio file to weave into the soundscape with granular pitch and filter control.
          </div>
        </div>

        <h4>Consolidated Studio Effects (Units 1–5 & Master)</h4>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #ff5252;">Unit 1 — DRIVE & FILTER</div>
          <div class="guide-card-body">
            Combines warm asymmetric tube overdrive saturation with a resonant 4-pole ladder filter (Lowpass, Bandpass, Highpass, 60 Hz–16 kHz, Q 0.5–8.0) and dedicated LFO modulation.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #a55eea;">Unit 2 — MOD CLUSTER (Tremolo, Phaser, Flanger)</div>
          <div class="guide-card-body">
            Consolidated modulation powerhouse: optical sine/square stereo Tremolo, 6-stage analog allpass Phaser with resonant feedback, and jet-sweep bucket-brigade Flanger with quadrature stereo width.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #feca57;">Unit 3 — ANALOG DELAY (Tape Echo & BBD)</div>
          <div class="guide-card-body">
            Warm bucket-brigade and magnetic tape delay with capstan wow & flutter tape drift, feedback saturation ceiling, high-frequency tape loss damping, and tempo-synchronized delay divisions.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #48dbfb;">Unit 4 — DIGITAL DELAY (Digital & Space Delay)</div>
          <div class="guide-card-body">
            Pristine 24-bit stereo digital delay featuring ping-pong stereo panning, cross-feedback repeats, and diffuse spatial reflections for crystalline rhythmic echoes.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #ff5fc4;">Unit 5 — SPACE REVERB</div>
          <div class="guide-card-body">
            Multi-tap algorithmic diffusion network with pitch-shifted shimmer trails, high-frequency damping, and cavernous infinite decay for expansive ambient atmospheres.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title" style="color: #4b7bec;">Terminal — MASTER OUT</div>
          <div class="guide-card-body">
            Final stage mastering bus featuring transparent soft-knee limiting, multi-bus stem tap isolation, and calibrated output level metering.
          </div>
        </div>
      </div>

      <!-- PANE 4: PATCHES & MIDI -->
      <div class="manual-pane" id="manualPane_patches">
        <div class="guide-card">
          <div class="guide-card-title">💾 User Patch Banks (U1–U9) & Factory Presets</div>
          <div class="guide-card-body">
            Switch between <strong>FACTORY</strong> (15 curated soundscapes) and <strong>USER</strong> tabs in the top preset bar:<br>
            • <strong>Click empty slot:</strong> Name and save current engine state into browser storage.<br>
            • <strong>Click filled slot:</strong> Recall soundscape patch immediately.<br>
            • <strong>Shift + Click:</strong> Instantly overwrite slot with current settings.<br>
            • <strong>Right-Click / Long-Press:</strong> Open context menu to Rename, Overwrite, or Clear.<br>
            • Complete <strong>JSON Export & Import</strong> in header utilities allows backing up and sharing your patches.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎹 Web MIDI Hardware Controls</div>
          <div class="guide-card-body">
            Plug in any USB, Bluetooth, or TRS MIDI controller and click <strong>MIDI</strong> in the header. Supported Continuous Controllers (CC):<br>
            • <strong>CC 74:</strong> Master Filter Cutoff (60 Hz – 16 kHz)<br>
            • <strong>CC 71:</strong> Master Filter Resonance (Q 0.5 – 8.0)<br>
            • <strong>CC 1:</strong> Mod Wheel / Diffusion Space & Weather (0 – 100%)<br>
            • <strong>CC 7:</strong> Master Output Volume<br>
            • <strong>CC 64:</strong> Sustain Pedal (holds notes in scale)<br>
            • <strong>Pitch Bend:</strong> Continuous live glide (±2 semitones)
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🎙️ Audio Recording & Multi-Track Stems</div>
          <div class="guide-card-body">
            Select your recording format next to the Record button in the transport row:<br>
            • <strong>MP3:</strong> 320 kbps constant-bitrate audio for quick sharing and listening.<br>
            • <strong>WAV:</strong> Lossless uncompressed 16-bit PCM audio master.<br>
            • <strong>STEMS (.ZIP):</strong> Records 5 isolated stereo buses (Master, Drone, Drums, Chords, Arp) bundled with <code>patch.json</code> and session metadata in a single archive ready for your DAW!
          </div>
        </div>
      </div>

      <!-- PANE 5: SECRETS -->
      <div class="manual-pane" id="manualPane_secrets">
        <div class="guide-card">
          <div class="guide-card-title">👾 Void Raiders (Dedicated Arcade CRT)</div>
          <div class="guide-card-body">
            Click <strong>[🕹️ ARCADE]</strong> in the visualizer header or dock to open the dedicated retro CRT video game module! You can play Void Raiders in its own window while the audio oscilloscope and waterfall visualizers dance simultaneously. Steer with <code>←</code> / <code>→</code> (or touch slider) and fire scale-quantized laser blasts with <code>Space</code>.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">👤 MU-TH-UR 6000 Eno Head</div>
          <div class="guide-card-body">
            Click or drag the spinning 3D wireframe Brian Eno head in the top right to cycle CRT phosphor themes across the entire workstation (Yellow, Amber, Green, Pink, Ice Blue). Hover over Eno's head to engage the custom circular 3D rotation reticle cursor!
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">📐 Modular Workspace & Show/Hide Dock</div>
          <div class="guide-card-body">
            Press <code>E</code> or click <strong>[EDIT]</strong> in the header to enter Workspace Edit Mode. Drag and reorder header modules, upper deck widgets, and console channels freely. Hide any modules you don't need, and restore them anytime from the floating bottom dock!
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">🪐 Momentum Orb Flinging</div>
          <div class="guide-card-body">
            In Orbital View, grab any module orb and fling it with quick pointer velocity. It will drift through space, bounce off walls, and glow upon colliding with other modules.
          </div>
        </div>

        <div class="guide-card">
          <div class="guide-card-title">⏪ Instant Patch Undo</div>
          <div class="guide-card-body">
            Accidentally hit Randomize All or switched away from an evolving patch? Press <code>Ctrl/⌘ + Z</code> or click <strong>Undo</strong> in the header to jump right back!
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

