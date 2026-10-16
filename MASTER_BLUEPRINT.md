# Slambient Master Blueprint: Hybrid Generative Ambient Workstation (Unified Edition)

**Canonical Repository:** `/Users/benfox/Documents/Development/slambient_dev/index.html`  
**Secondary Thread Worktree:** `/Users/benfox/Documents/Development/slambient_dev-thread2`  
**Target Hardware Platform:** SLOOP / Felucca FM-1 (JieLi AC791N Dual-Core DSP, Package ID FM-1_900)  
**Cloud & Edge Delivery:** Cloudflare Pages (with HTTP/3, custom edge headers, and standalone PWA caching)  
**Live Production / Google Doc Mirror:** `https://docs.google.com/document/d/1YtjC-aq-wDhkcYdGXLQA8YYMRIkuQgU6j5Lx2NS1C1k`

---

## Architecture Overview

This master architecture document serves as the authoritative single-source-of-truth across web, mobile, desktop, and embedded hardware targets:

* **Part I (Sections 1–5):** Embedded FM-1 Hardware & Firmware Architecture (4-layer coprime generative engine, 12-voice polyphony budget, DSP memory limits, 27-key live performance hand-off, 2-sector flash journaling, and 8-step hardware integration roadmap).
* **Part II (Sections 6–12):** Canonical Web Workstation Architecture (`slambient_dev/index.html`): the 9-module audio engine (five instrument strips, a live-reorderable three-pedal insert chain, and the Master EQ & Out strip), the 4-layer CRT visualizer with fullscreen and roadside scenery, the drag-reorderable upper deck with playable MIDI keyboard and additive arpeggiator, the orbital constellation view, 15 presets with JSON patch save/load, implementation roadmap status, and architectural guardrails.
* **Part III (Sections 13–15):** App Development, PWA Shell & Cross-Platform Packaging: standalone PWA wrapper (`manifest.json`, icon suite), offline-first service worker (`sw.js`), mobile viewport adaptation (safe-area insets, touch physics), Screen Wake Lock integration, WebKit/Safari Web Audio memory leak hardening, stereo binaural spatial drift engine, and native container deployment paths (Capacitor for iOS/Android, Tauri/Electron for Desktop).
* **Part IV (Sections 16–19):** FM-1 Hardware Conversion Planning & Physical Control Mapping Specification: complete physical surface translation (27 silicone keys, continuous rotary encoders, 24 FPS SPI display), dual-mode parameter dispatch (Macro vs. Module Page), AUTO-to-LIVE downbeat hand-off state machine, and comprehensive 8-phase embedded engineering roadmap.
* **Part V (Sections 20–23):** Commercialization, Monetization Strategy & Native Release Roadmap: market landscape, competitive moats, Step 1 (iOS/iPadOS App Store via Capacitor), Step 2 (Desktop Studio & Royalty-Free Stem Generator via Tauri), distribution storefronts, 3-week execution schedule, and revenue financial models.
* **Part VI (Sections 24–27):** Hardware-Inspired Pedal Board & Eurorack UI Architecture: standardized 32 HP / 64 HP grid system, Pedals Mode dashboard with bezier patch cables, edge-to-edge orbital swipe navigation, multi-topology filter intensity scale, modular multi-delay engine (Tape/BBD/Digital/Ping-Pong), and 3-phase implementation roadmap.
* **Brand Guidelines & Design System:** Refer to the authoritative companion standard in [`BRAND_GUIDELINES.md`](file:///Users/benfox/Documents/Development/slambient_dev/BRAND_GUIDELINES.md) for strict visual symmetry laws, zero text-overwrapping rules, modular element completeness, color token specs, and typography standards.

---

### Part I: Embedded FM-1 Hardware & Firmware Architecture

#### 1. Aesthetic, Sonic Goals & Maestro Inspirations

* **Core Sonic Identity:** Warm, nostalgic, consonant ambient textures inspired by Boards of Canada, Brian Eno, Hiroshi Yoshimura (Kankyo Ongaku), Four Tet, and the Maihar Indian classical tradition—prioritizing smooth low-mid warmth, pure harmonic FM ratios (1.5x, 2.0x, 3.0x), organic drift, and zero digital clipping.
* **Analog Imperfections & Per-Voice Warmth Filtering:** Built-in tape wow/flutter modulation across the master bus paired with per-voice lowpass warmth filtering (`voiceFilter` and `arpWarmthFilter`) and upper-register octave folding (chord roots ≤ A3 / MIDI 57, pad extensions ≤ C5 / MIDI 72, leads ≤ A4 / MIDI 69, arpeggio notes ≤ D5 / MIDI 74) plus velocity damping above C4 so saw, square, and FM voices never cut in harshly.
* **Dynamic Breathing & Ducking:** Velvet-smooth attacks, natural rest probabilities (Ma), and automatic dynamic ducking (-3 dB to -6 dB) on the sub-drone and shimmer arpeggio during active lead phrases.
* **Brian Eno Coprime Clock Ecosystem:**
  * **Base Master Clock Unit:** 16th-note master tick (250 ms at 60 BPM).
  * **Prime Step Loops:** Layer 1 (Drums) runs on a 7-step loop; Layer 3 (Shimmer Arp) runs on an 11-step loop; Layer 2 (Chords/Lead) runs on a 13-step loop; Layer 4 (Sub-Drone) runs on a 17-step loop; macro rhythm rotations and Weather mutations operate on 19-step and 23-step cycles.
  * **Weighted Consonance & Controlled Tension:** Progression and voicing transitions bias 82% toward warm, open consonant voicings and primary scale anchors (I, IV, V, vi), automatically widening 1-semitone minor-2nd clashes to 2-semitone whole steps in non-cluster voicings while bounding passing tension to a 10% statistical target.
* **Hiroshi Yoshimura & Four Tet Fluidity:** Variable-speed thermal portamento pitch glides, acoustic-to-pad hybrid plucks (kalimba, concert harp, vibraphone, water droplet marimba), and spatial diffusion scaling with drone weight.
* **Maihar Gharana & Formant Extensions:** Authentic 4-string cycling Tanpura (Pa-Sa-Sa-Sa, Ma-Sa-Sa-Sa, Ni-Sa-Sa-Sa) with cotton-thread jawari bridge buzz, Maihar Sitar solo phrasing with meend pitch bends, Tabla (Bayan rubbery palm-modulated Ghe swoops + Dayan tuned Na/Tin/Tun strokes), Bansuri bamboo flute Raga Taan phrasing, and Didgeridoo 24-harmonic formant drone synthesis.

#### 2. Three-Subsystem Firmware Architecture (slambient-fm1)

* **Subsystem 1 — Generative Brain (`slambient.h`, `slambient.c`):** Manages 6-prime clock dividers (7, 11, 13, 17, 19, 23), 32-bit xorshift32 seeded PRNG, scale quantization, weighted random walk, mood presets, and lock-free 32-entry drop-on-full UI FIFO queuing.
* **Subsystem 2 — Synth & Sequencer Engine (`audio.c`, `seq.c`, `voice.c`):** Handles track routing, note event execution, 8-synth / 4-drum voice allocation, amplitude envelopes, dynamic Voice 3 borrowing, and live 27-key silicone keyboard pass-through.
* **Subsystem 3 — Optional Audio DSP, UI & Flash (`slambient_fx.c`, `ui_studio.c`, `presets.c`):** Manages master bus tape wow/flutter, diffusion reverb, tanh soft-saturation, -0.5 dBFS lookahead peak limiting, 24 FPS strip-rendered SPI display updates, and 2-sector flash journaling.

#### 3. Polyphony Budget (12 Managed Voices: 8 Synth + 4 Drum) & Memory Constraints

* **Generative Co-Processor Model:** Slambient triggers notes, CCs, and envelopes into the stock SLOOP/Felucca synthesis and drum pipelines (Tracks 1–4) rather than synthesizing raw PCM inside the audio ISR. All modulation math uses 32-bit fixed-point arithmetic referencing `SINE_LUT[1024]`.
* **Authoritative Voice Allocation (8 Synth Voices + 4 Drum Voices):**
  * **Voice 0 (Track 1):** Sub-Drone continuous mono bed (LOWEST preemption priority).
  * **Voices 1–2 (Track 2):** Chord Pad Root and 5th foundation.
  * **Voice 3 (Track 2):** Shared Pad/Lead voice (borrowed by Lead during phrases; returns to Pad triad/9th extension during breathing pauses).
  * **Voice 4 (Track 3):** Shimmer Arpeggio mono cascade.
  * **Voices 5–7 (Track 2):** Reserved Live Performance Headroom (3 voices at `PRIORITY_CRITICAL` for real-time play on the 27 silicone keys).
  * **Track 4 (Isolated Drum Engine):** 4 dedicated one-shot drum voices (kick, snare/rim, woodblock/tabla, hi-hat/shaker).
* **Click-Free Voice Stealing & Downbeat Transitions:** Preempted voices execute a 10 ms cosine amplitude ramp-down; chord and preset changes use 50–100 ms exponential releases and wait for the next natural downbeat rather than cutting off active reverb/delay tails.
* **RAM & DSP Heap Budget:** Static `.data` + `.bss` RAM has a ~98 KB ceiling (~5.5 KB headroom). DSP buffers (~20.75 KB total: 4.4 KB wow/flutter delay line, 350 B 2 ms lookahead limiter, 16.0 KB half-rate diffusion reverb) and the 4–8 KB DMA display strip buffer are allocated once at boot from the 344 KB audio heap.

#### 4. Hardware Integration, Live Performance & Flash Persistence

* **27-Key Live Takeover & Auto-Latch:** White keys 1–16 act as musical keys with OCT-/OCT+ transposition while SEQ, EDIT, FX, GLO, and HOME retain menu navigation. Playing keys switches the engine from AUTO to LIVE takeover; releasing all keys hands control back at the next bar downbeat, anchoring generation to the last played root and chord quality.
* **Deterministic 32-Bit World Seeds:** Entire generative session states are represented as a compact 32-bit xorshift PRNG seed combined with macro parameter settings. The full 32-bit seed is formatted as an 8-character hex code (e.g., `#A3F2-B8D4`). An all-zero seed is strictly forbidden and automatically remapped to `0x534C414D`. A 4-character truncated shorthand (e.g., `#D7A4`) is used purely for display-only compact UI views and is never used for preset recall.
* **Two-Sector Flash Journaling:** Ping-pong rotation across Sector A and Sector B (4 KB each) using 24-byte records (sequence number, world seed, macro state, CRC32), pre-erasing the alternate sector during transport STOP for instant low-battery saves.
* **Hardware I/O & BLE Disable:** Bluetooth BLE is disabled to prevent DAC RF interference and interrupt latency. MIDI runs over USB-C MIDI and 3.5mm TRS MIDI IN; 3.5mm analog jack is stereo output (auto-muting internal speaker).

#### 5. Prioritized 8-Step Hardware Engineering Roadmap

* **Step 1 (Baseline & Recovery):** Pin SLOOP v2.4/v2.5 (`isod89/sloop-fm1`), JieLi toolchain `jieli-linux-toolchains-20260730.1`, and `fw-AC79_AIoT_SDK`; verify `build/felucca.fwsc` (FM-1_900) and WebMIDI recovery at `fm1.designburgapps.com` with stock V15 backups.
* **Step 2 (Source & Hook Audit):** Audit `audio.c`, `fx.c`, `seq.c`, and `voice.c` for post-mix tap points, sub-block event offsets, cross-track voice allocation vs. per-track fallback, and stock FX reuse.
* **Step 3 (macOS CLI Simulator):** Compile `generator.c` and `sequencer.c` natively on macOS with RtMidi for 1,000,000-step golden-seed and voice-accounting verification.
* **Step 4 (Single-Layer Integration):** Integrate Subsystem 1 driving Layer 2 (Chords/Lead) and verify 27-key live pass-through.
* **Step 5 (Multi-Layer & 12-Voice Stress Test):** Enable all 4 layers, Voice 3 borrowing, and live keyboard preemption.
* **Step 6 (Master DSP Insertion):** Insert Subsystem 3 filter, delay, reverb/chorus, and limiter within the 20.75 KB heap budget.
* **Step 7 (24 FPS Strip UI & Flash Journaling):** Connect the 32-entry drop-on-full UI FIFO to the DMA strip renderer and enable 2-sector flash persistence.
* **Step 8 (24-Hour Hardware Soak Test):** Benchmark SPI DMA frame times, thermal stability, 60s battery auto-dimmer (30% brightness), and zero audio underruns.

---

### Part II: Canonical Web Workstation Architecture (`slambient_dev/index.html`)

#### 6. Global Workspace, Header & Transport Bar

* **Canonical File & Git Workflow:** All web development lives in Git tracking `master` and dedicated worktrees (`slambient_dev-thread2` on `feature-thread2`) alongside `GEMINI_SYNC.md`, the running hand-off log. Archived builds live in `_archive/old_snapshots/`.
* **Default 75% Viewport Scale (`zoom: 0.75`):** The root `html` element applies `zoom: 0.75` with `min-height: calc(100vh / 0.75)` on `body` so the entire workstation fits cleanly into a standard Safari/Chrome window at 100% browser zoom. Canvas dimensions (`scopeCanvas`, `orbitalCanvas`) read unscaled `clientWidth`/`clientHeight` and normalize pointer coordinates against `getBoundingClientRect()` for crisp rendering and 1:1 orb click/drag accuracy.
* **Sticky Frosted Header:** The header bar is sticky with a frosted blur backdrop (`.header-bar-wrapper` at `z-index: 3000` with overflow visible, so dropdown menus float over the upper deck).
* **Branding, Factory Presets & User Patch Bank (U1–U6):** The SLAMBIENT wordmark sits above a "MEANDER ENGINE" pill subtitle in a 260px brand block. The preset bank features segmented bank tabs (`FACTORY` / `USER [U1–U6]`):
  * **Factory Bank:** 15 curated preset chips (Section 10).
  * **User Patch Bank (U1–U6):** 6 persistent user slots saved to `localStorage["slambient_user_patches_v1"]`. Single-click loads a patch, click empty slot prompts for a name to save current state, Shift-click instantly overwrites, and right-click/contextmenu allows renaming, overwriting, or clearing. Includes a `+ STORE` quick-save button.
  * **BANK Group:** SAVE and LOAD buttons for full patch JSON serialization.
* **AudioWorklet Sample-Accurate Clock Engine (`clock-processor.js`):** The primary master clock runs in the dedicated Web Audio render thread via an `AudioWorkletNode` (`clock-processor`), counting exact audio buffer samples rather than relying on UI-thread timers (`setInterval` / `setTimeout`). This eliminates timing jitter, drift, and note skips during heavy canvas rendering, garbage collection pauses, or background tab throttling, with automatic fallback to buffer scheduling in sandboxed environments.
* **Top Header & Global Transport Controls:**
  * **Start / Stop Engine (`btnPlay`):** Starts/stops the master clock and gates continuous drone busses (`droneGain` and `tanpuraBusGain`) via `updateAudioParams()` so drones silence cleanly on Stop and fade back in on Start. Engages the Screen Wake Lock API.
  * **Multi-Format Recording Engine (`btnRecord`, `#selRecordFormat`):** Captures live audio in three selectable formats:
    * **MP3 (320 kbps):** Dynamic constant-bitrate MP3 encoding via client-side `lamejs`.
    * **WAV (Lossless 16-bit PCM):** Uncompressed full-fidelity studio WAV file.
    * **STEMS (Multi-Track ZIP Archive):** Simultaneously records 5 isolated stereo buses (`01_master_mix.wav`, `02_sub_drone.wav`, `03_drums.wav`, `04_chords_lead.wav`, `05_shimmer_arp.wav`) plus serialized `patch.json` and session metadata `session_info.txt`, bundling them into a downloadable `.zip` archive via a zero-dependency in-memory ZIP builder (`buildZip`) with CRC-32 checksums.
    * Hard safety cap at 45 minutes to prevent out-of-memory crashes on mobile devices.
  * **Randomize All (⟲ ALL):** Generates a warm, consonant patch across all modules using curated sweet-spot ranges (`RANDOM_SWEET_SPOTS`), shuffles the pedal insert order, and schedules entry on the next downbeat. Includes an Undo button (`#btnUndoPatch`, Ctrl/⌘+Z).
  * **Web MIDI Hardware Integration & CC Controls (`#btnHeaderMidi`):** Header MIDI utility button with status indicator dot (`#midiStatusDot`) and device name tooltip (`toggleMidiConnectionPrompt()`). Incoming MIDI messages flash an activity LED. Full continuous controller mappings:
    * **CC 74:** Master Filter Cutoff (`knobMasterCutoff`, 60 Hz – 16 kHz)
    * **CC 71:** Master Filter Resonance (`knobMasterRes`, 0.5–8.0)
    * **CC 1:** Diffusion Master Space / Weather (`knobWeather`, 0–100%)
    * **CC 7:** Master Output Volume (`knobMasterVolume`, 0–100%)
    * **CC 64:** Sustain Pedal (sustains active notes in `midiSustainedNotes`)
    * **Pitch Bend:** 14-bit pitch bend mapped to ±200 cents (±2 semitones) across live synth voices.
  * **Root & 14 Scale Modes (`topRootKey`, `topScaleMode`):** Chromatic roots C–B and 14 scales: DORIAN, LYDIAN, AEOLIAN, MIXOLYDIAN, PENTATONIC, MAJOR9, HIRAJOSHI, INSEN, LYDIAN_DOM, PHRYGIAN_AMB, WHOLE_TONE, MAJ_PENTATONIC, BILAWAL (Indian Classical Major), and BHAIRAV (Maihar Morning Raga).
  * **8 Time Signatures (`selTimeSig`):** 4/4, 7/4, 5/8, 7/8, 5/4, 9/8, 11/8, and 3/4. The quick-cycle meter button is an icon-only SVG refresh glyph.
  * **Telemetry Pills:** TIME, METER (with live beat position, e.g. 7/4 [1/7]), ROOT / SCALE, and SEED (`#534C-414D` format).
  * **Header Tempo Slider (`knobBpmHeader`):** Synced bidirectionally (45–115 BPM) with the Master EQ & Out tempo knob and tempo-synced delay and visualizers.
  * **Master Volume & Mute:** A vertical master volume slider and mute button (M) left of the Eno pod. It is the last gain stage before output.
  * **3D Eno CRT Pod:** The 60 FPS MU-TH-UR 6000 wireframe Brian Eno head cycles the global border/glow phosphor color across all modules on click (ENO · Y / G / P / W). Enforced square geometry by `syncEnoPodSquare()`.
* **Smart Dropdowns (`initSmartDropdowns`):** Native selects upgraded to custom dropdowns with 2px radius, 1px borders, and monospace typography. Hovered rows highlight in module accent color with ▸ marker.
* **Circular Drag Cursors:** Drag handles use `--cursor-grab` reticle (cyan dashed orbit, yellow center pip) and `--cursor-grabbing` while dragging.

#### 7. Upper Deck: Visualizer, Chord Analysis & Playable MIDI Keyboard

* **Unified Upper-Deck Header Alignment:** All three upper-deck panels share an identical 28px header height, 6px bottom padding, 1px bottom border, and 12px bold uppercase monospace titles (`VISUALIZER`, `CHORD ANALYSIS`, `PLAYABLE MIDI KEYBOARD`).
* **Drag-Reorderable Panels (`renderUpperDeckOrder`):** The three panels reorder via ⠿ DRAG handles. Visualizer flex 1.15 (min 320px), Chord Analysis fixed at 270px, Keyboard flex 1.15 (min 360px).
* **Panel 1 — Visualizer (`scopePanel`):**
  * **Channel Legend:** DRONE (Cyan), DRUMS (Red), CHORDS (Yellow), and ARP (Violet).
  * **Layer 1 — Phosphor Waterfall Sky (`btnToggleWaterfall`):** 36-row cascading 4-lane spectral history matrix.
  * **Layer 2 — Vector Flight Terrain Grid (`btnToggleFlightGrid`):** Tempo-scrolling perspective horizon and ground grid.
  * **Layer 3 — Roadside Scenery (`btnToggleRoadside`):** Audio-reactive ground cacti/trees and bobbing 3D geometric shapes (pyramids, spheres, cubes). Shapes are audio-gated to disappear cleanly when transport stops.
  * **Layer 4 — Concentric Oscilloscope Rings (`btnToggleRings`):** 5 frequency-band waveform rings rotating at tempo-synced speed, pre-allocated `Uint8Array` buffers for zero GC overhead.
  * **Fullscreen Mode (`btnToggleScopeFullscreen` / Double-Click / Esc):** Expands `.scope-panel.is-fullscreen` across viewport with locked 60 FPS.
  * **Easter Egg Minigame:** Audio-reactive playable Space Invaders minigame canvas overlay triggered via key sequence.
* **Panel 2 — Chord Analysis (`chord-info-panel`):** Displays active Root (`cardChordRoot`), Voicing (`cardChordVoicing`), 12-node Circle-of-Fifths constellation wheel (`chordWheelCanvas`), TONES, INTERVALS, METER, and 4 channel activity meters.
* **Panel 3 — Playable MIDI Keyboard (`keyboard-panel`):**
  * Keys A–K (C3–C5), AUTO / LIVE takeover badge, octave shift (OCT - / OCT + spanning C1–C7).
  * Routing selector (`TARGET`: CHD / ARP).
  * LED mode toggle (`LEDS`: Last Played Notes vs. Active Scale Notes).
  * Seam-centered black keys and aligned baseline labels.
  * Additive Live Arpeggiator (`triggerLiveArpStep`, `lastLiveArpMidi`) preserving pattern continuity when adding/releasing keys.

#### 8. Dual Module Workspace: Orbital View & Modular Rack View

* **Two-Way View Switcher:** Orbital View (`btnViewOrbital`) and Rack View (`btnViewConsole`).
* **Orbital Constellation View (`orbitalArenaWrapper`):**
  * 9 audio-buoyant planetary orbs over drifting background starfield with collision physics and boundary dampening.
  * Click-and-drag with momentum fling; debounced stationary click (< 5px movement) opens the slide-out Modular Inspector Panel (`orbitalSidePanel`).
  * Live signal chain lines (`getOrbitalConnectionChain`) reflecting real-time DSP insert order.
  * Orbital Feel sliders (Float Speed 0–250%, Orb Size 50–200%, ⟲ RE-SEED, and PANIC).
* **Modular Rack View (`lower-deck`):** Symmetrical 6-column layout across desktop (6 columns wide desktop, 3 columns medium desktop / landscape phone, 2 columns tablet, 1 column portrait phone) housing Five instrument channel strips (Modules 1–5: SUB, DRUMS, CHORDS, ARP, NOISE) plus Module 6: Live DSP FX Chain.
* **Birds-Eye FX Chain Module (`pedalChainModule`):** Entire DSP insert chain condensed into an instrument-sized `.strip-channel` module. Contains a hardware signal flow bar (`BUS PRE ➔ LIVE INSERT MATRIX ➔ OUT`) and 4 compact rectangular cards (Filter, Delay, Space, and Master Out) displaying slot assignment, power/bypass status (`ON` / `BYP`), live chain reordering (`▲` / `▼`), and an inspect trigger (`EDIT ↗`).
* **Universal Modular Inspector Overlay (`orbitalSidePanel` + `orbitalModalBackdrop`):** A fixed slide-over modal drawer with blurred backdrop. Inspecting any module or pedal from Rack View opens its complete controls directly over Rack View without switching to Orbital View; closing the inspector seamlessly restores Rack View.
* **Shared Controls Across Views:** The console rack, birds-eye pedal chain, and inspector panel borrow and restore identical DOM elements, guaranteeing perfect two-way parameter coherence.

#### 9. Complete 9-Module Audio Engine Specification

* **Master Signal Chain:** BUS PRE ➔ Pedal 1 ➔ Pedal 2 ➔ Pedal 3 ➔ Master EQ (Low ➔ Mid ➔ High) ➔ Master Drive ➔ Saturation ➔ Limiter ➔ Master Volume ➔ Destination. `rewireDspChain(dspChainOrder)` performs live AudioNode disconnect/connect routing.
* **Click-Free Audio & Safety Ceilings:** 35 ms attack / 40 ms release envelopes on drone and Tanpura gains. Delay feedback hard-capped at 48% across UI, parameter parser, and DSP ramp clamps.
* **Module 1 — Sub & Drone (#00e5ff Cyan):**
  * Drone Timbre (`selDroneTimbre`): Sub Oscillator (Classic) or Didgeridoo (24-harmonic PeriodicWave, dual 9-cent detuned buzz oscillators, 150/440/1100 Hz formant filters, breath noise, and 3-layer LFO drift).
  * Fundamental Pitch: D0 (18.3 Hz), D1 (36.7 Hz), D2 (73.4 Hz).
  * Tanpura Drone (`chkTanpuraEnabled`): 4-string cycling Tanpura (Pa/Ma/Ni Sruti tuning, resonance, cotton-thread Javari bridge buzz).
* **Module 2 — Drums (#ff3838 Crimson):**
  * 9 Groove Algorithms (`selDrumStyle`): Four Tet Organic, Classical Indian Tabla, Industrial 909, Fat Breakbeat, Four-on-the-Floor, Sub Heartbeat, Polyrhythmic Tape Dub, Vinyl Clicks & Dust, and Muted.
  * 4 Kits (`selDrumKit`): Organic Wood & Brush, Analog 808/909, Lo-Fi Tape & Vinyl, Chamber Percussion.
  * Tabla Articulation Engine: Modeled Ge, Na, Tin, Ti, Re, Ki, and Dha strokes with pitch-scooped Bayan.
* **Module 3 — Chords & Voicing (#fed330 Yellow):**
  * 11 Timbres (`selChordTimbre`): Warm Analog Pad, Maihar Sitar Strings (Jawari parabolic waveshaper, 920/2750 Hz dual gourd resonance, 3-string taraf sympathetic resonance), Pure Mineral Glass, Chamber Woods, Celestial Flute, Vibraphone, Rhodes, DX7, Lofi Keys, Solina Strings, Juno Saw.
  * 12 Voicings (`selChordVoicing`): Auto-Meander, WARM_9TH, DREAM_11TH, FLOATING_69, SUS2_SPREAD, LYDIAN_ETHER, FIFTH_STACK, QUARTAL_STACK, PRISM_MAJ9, OCTAVE_BLOOM, VELVET_ADD9, DEEP_MINOR11, GHOST_DYAD.
* **Module 4 — Shimmer Arp (#7d5fff Violet):**
  * 6 Patterns (`selArpPattern`): Granular Shimmer, Ascending Run, Pendulum, Raga Taan, 11-Step Coprime, Disabled.
  * 9 Timbres (`selArpTimbre`): Glass FM Chime, Bansuri Flute, Sine Crystal, Nostalgic Music Box, Concert Harp, Water Droplet, Pizzicato String, Kalimba, Warm Analog Pulse.
* **Module 5 — Atmosphere & Noise (#1dd1a1 Teal):**
  * 6 Profiles (`selNoiseProfile`): Rain, Thunder, Tape Noise (WHITE_TAPE), Bubbling Brook, Crickets, Alpine Wind.
  * 5 Trigger Modes (`selNoiseMode`): Organic Gusts, Continuous Bed, Sparse Events, Rhythmic Pulse, Storm Swell.
  * Field Sampler / Mic Integration: Press-and-hold microphone capture (`[ 🎙 REC / 📼 DROP ]`) with auto-trimming and normalization.
* **Modules 6–8 — Reorderable DSP Pedal Chain:**
  * **Filter & Env Pedal (#2ed573 Green):** 4-pole cascaded lowpass filter (`masterFilter1` + `masterFilter2`) with staggered Q and resonance gain compensation. Log cutoff (60–7500 Hz), Resonance Q (0.5–12.0), Attack/Decay envelope, and LFO modulation.
  * **Analog Delay Pedal (#ff793f Orange):** 60–1100 ms time with tempo-sync toggle (9 musical divisions), BBD dark damping tone (400–4800 Hz), tape flutter, and hard-capped 48% feedback.
  * **Reverb & Chorus Pedal (#ff5fc4 Pink):** Plate, Hall, and Cathedral reverb algorithms (600–12000 Hz tone damping); 3-voice modulated chorus network (Classic, Ensemble, Vibrato).
* **Module 9 — Master EQ & Out (#4b7bec Blue):**
  * Master 3-Band EQ: Low shelf 100 Hz, mid bell 1 kHz, high shelf 4.5 kHz (±12 dB).
  * Master Drive: 2x-oversampled asymmetric analog tape saturation.
  * Hardware MIDI Output selector, Master Tempo (45–115 BPM), and Weather Diffusion macro.

#### 10. Complete 15-Preset Reference

* **Preset 0 — Nostalgic Drift:** 7/4, 72 BPM, Dorian; Organic drums (Evolve ON); Warm Analog Pad; Shimmer / Music Box arp; Sub drone (D2); Hall reverb (40%) + Classic chorus (25%).
* **Preset 1 — Four Tet Organic:** 5/8, 88 BPM, Dorian; Organic drums (Evolve ON); Lofi Keys; Pendulum / Kalimba arp; Sub drone (D2); 240 ms delay; Plate reverb (25%) + Classic chorus (18%).
* **Preset 2 — Shimmer Cascade:** 7/8, 62 BPM, Lydian; Heartbeat drums (Evolve ON); Solina Digital Strings; Up / Glass FM arp; Sub drone (D2); 480 ms delay; Cathedral reverb (52%) + Ensemble chorus (40%).
* **Preset 3 — Hauntological Tape:** 5/4, 64 BPM, Aeolian; Dub Tape drums (Evolve ON); Chamber Woods; Shimmer / Concert Harp arp; Sub drone (D2); 520 ms delay; Hall reverb (45%) + Vibrato chorus (45%).
* **Preset 4 — Velvet Horizon:** 4/4, 56 BPM, Major 9; Muted drums; Celestial Flute Organ; Chord Burst / Water Droplet arp; Sub drone (D2); Hall reverb (50%) + Ensemble chorus (35%).
* **Preset 5 — Pale Bloom:** 3/4, 68 BPM, Major Pentatonic; Minimal Click drums (Evolve ON); Vibraphone & Celesta; Up / Pizzicato String arp; Sub drone (D2); Cathedral reverb (48%) + Classic chorus (22%).
* **Preset 6 — Green / Yoshimura:** 4/4, 60 BPM, Hirajoshi; Minimal Click drums (Evolve OFF); Pure Mineral Glass; Pendulum / Sine Crystal arp; Sub drone (D1); Plate reverb (30%) + Classic chorus (15%).
* **Preset 7 — Khan Lineage:** 7/4 (Rupak Taal), 68 BPM, Raga Bilawal; Classical Indian Tabla; Maihar Sitar Strings; Raga Taan / Bansuri Flute arp; Sub drone (D2) + Tanpura ON; Cathedral reverb (42%) + Classic chorus (10%).
* **Preset 8 — After Hours Deep:** 4/4, 112 BPM, Dorian; Four-on-the-Floor drums; Rhodes Electric Piano; Pendulum / Water Droplet arp; Sub drone (D1); Tempo-Synced Delay (1/8 Dotted); Plate reverb (22%) + Classic chorus (20%).
* **Preset 9 — Airports (Eno, Ambient 1):** 4/4, 58 BPM, Lydian; Muted drums; Pure Mineral Glass; Pendulum / Sine Crystal arp; Sub drone (D2); 720 ms delay; Cathedral reverb (50%) + Ensemble chorus (28%).
* **Preset 10 — Twin Peaks (Badalamenti):** 4/4, 56 BPM, Aeolian; Heartbeat drums; Vibraphone & Celesta; Pendulum / Glass FM arp; Sub drone (D1); 580 ms delay; Cathedral reverb (55%) + Ensemble chorus (35%).
* **Preset 11 — Aphex Twin:** 7/8, 104 BPM, Hirajoshi; Fat Breakbeat Pocket drums; Pure Mineral Glass; Shimmer / Glass FM arp; Sub drone (D1); Tape Noise; Delay ➔ Filter ➔ Reverb chain; Tempo-Synced Delay (1/8 Dotted); Cathedral reverb (48%) + Vibrato chorus (26%).
* **Preset 12 — Tangerine Dream:** 4/4, 96 BPM, Phrygian; Heartbeat drums; Solina Digital Strings; Up / Warm Analog Pulse arp; Sub drone (D1); Filter ➔ Delay ➔ Reverb chain; Tempo-Synced Delay (1/8 Dotted); Cathedral reverb (58%) + Ensemble chorus (34%).
* **Preset 13 — William Basinski:** 3/4, 52 BPM, Lydian; Muted drums; Chamber Woods; Pendulum / Sine Crystal arp; Sub drone (D1); Tape Noise; Reverb ➔ Delay ➔ Filter chain; 680 ms delay into dark ~620 Hz filter; Cathedral reverb (62%) + Vibrato chorus (36%).
* **Preset 14 — Lo-Fi Chillhop:** 4/4, 76 BPM, Dorian; Fat Breakbeat Pocket drums; Rhodes Electric Piano; Pendulum / Kalimba arp; Sub drone (D1); Rain; Filter ➔ Delay ➔ Reverb chain; Tempo-Synced Delay (1/4); Plate reverb (26%) + Classic chorus (28%).

#### 11. Implementation Roadmap & Phase Status

* **Phase 1 — Audio Core, Safety Ceilings & Dynamic DSP Graph (Done):** Click-free envelopes, drone portamento, 48% feedback ceiling, and `rewireDspChain()` dynamic graph manager.
* **Phase 2 — Console & Pedals Architecture (Done):** Two-way Orbital / Console view switcher, pedal insert chain with drag-and-drop reordering, live 6 / 7 / 8 numbering synced to orbs, and pedal-order shuffling in Randomize All.
* **Phase 3 — Header, Branding & Instrument Standardization (Done):** Sticky frosted header, branding block, transport cluster refinements, square Eno pod, upper-deck drag reordering, unified channel strip anatomy, and smart dropdowns.
* **Phase 4 — Voice Expansions & Environmental Noise (Done):** Drum fill generator, tabla articulation engine, sitar physical modeling, Atmosphere & Noise module, and filter/output saturation.
* **Phase 5 — Preset Serialization & Signature Sound Profiles (Done):** JSON patch save/load and the four routing-specific signature presets (Aphex Twin, Tangerine Dream, William Basinski, Lo-Fi Chillhop).
* **Phase 6 — Visualizers, Easter Eggs & Interaction Polish (Done):** Audio-gated floating 3D shapes (no idle spheres when stopped), Fractal Julia/Mandelbrot visualizer mode, playable audio-reactive Space Invaders minigame canvas overlay, and 250 ms orb click debouncing.
* **Phase 7 — Global Shortcuts, Custom Theming & Final Polish (Done):** Global keyboard shortcuts (Spacebar/Enter for Play/Pause), modular palette customization, and CSS theme tokens.
* **Phase 8 — Mobile UX, Touch Physics & Landscape Polish (Done):** Touch isolation with `touch-action: none !important` and 34px–44px hit targets so finger parameter adjustment never triggers page scroll; locked viewport geometry on mobile landscape.
* **Phase 9 — Maihar Gharana & "Lineage" Sonic Refinements (Done):** Tanpura 2-bar cycle, Tabla Bayan/Dayan fingerings, Maihar Sitar wire mizrab attack click & meend pitch bends, Raga Taan phrases with natural breathing rests (Ma).
* **Phase 10 — "Pocket Field Recorder" Live Mic & Found Sound Engine (Done):** Desktop header & mobile transport `[ 🎙 REC / 📼 DROP ]`, browser `getUserMedia()` live sampling, dynamic level normalization, and Module 5 hauntological playback modes.
* **Phase 11 — Blueprint Visualizers & Interaction Polish (Done):** Roadside 3D shapes density scaling, Space Invaders audio coupling, and DAW-style transport shortcuts.
* **UI Fixes & Visual Polish (TOP PRIORITY / ACTIVE):**
  * **Orbital Modal Opacity Bleed During Module Switching:** In Orbital View popup module sheets (`#orbitalSidePanel`), swiping (`.swiping-left` / `.swiping-right`) or switching modules currently applies `opacity: 0.55` to the entire side panel, causing the top UI header, borders, and backdrop to turn transparent and bleed background starfield elements through. Scope opacity transitions exclusively to the body content container (`#orbitalModalBody`), keeping `.orbital-modal-header` and outer panel chassis opaque (`opacity: 1 !important`, solid backdrop fill).
  * **Center-Justified Title & Module Selection Navigation:** Center-justify the orbital popup module title (`#orbitalModalTitle`) and adjacent cycle arrows (`#btnOrbitalPrev`, `#btnOrbitalNext`) across both desktop and mobile viewports. On mobile, wrap `#btnOrbitalPrev`, `#orbitalModalTitle`, and `#btnOrbitalNext` into a unified centered cluster (`.orbital-nav-group` with `margin: 0 auto; justify-self: center;`) with balanced left (`[PEDALS]`) and right (`[ACTIONS] [✕]`) header anchor slots.
* **Phase 13 — Mobile Microphone & Pocket Field Recorder Resiliency Engine (PRIORITY 1 / ACTIVE):**
  * **Pointer Capture & Touch Physics:** Call `e.target.closest("[data-field-hold]").setPointerCapture(e.pointerId)` on `pointerdown` and bind dedicated touch event fallbacks to prevent iOS Safari `pointercancel` micro-jitter aborts.
  * **AudioContext Synchronous Gesture Pre-Warm:** Pre-warm and resume `captureCtx` synchronously within user touch dispatch before entering asynchronous `getUserMedia()` queries to prevent WebKit gesture token expiration.
  * **MediaRecorder Modernization & ScriptProcessor Fallback:** Wrap capture in native `MediaRecorder` (`audio/webm` or `audio/mp4` / AAC/Opus) with `AudioContext.decodeAudioData`, completely bypassing iOS 17+ `createScriptProcessor` silent thread throttling while retaining `Float32Array` fallbacks for older browsers.
  * **AudioSession Type Guarding:** Soften `navigator.audioSession.type = "play-and-record"` toggling with automated output restore to prevent mobile Safari background audio muting.
  * **High-Visibility Status & Denied Feedback:** Explicit visual state machine on `[data-field-hold]` (`HOLD TO REC`, `REC 0.0s`, `TAP TO STOP`, `MIC PERMISSION BLOCKED`) with user-friendly toast guidance.
* **Phase 14 — Mobile CPU, GPU & RAM Optimization Engine (Planned / Active):** Strict DPR clamping on high-density displays (`Math.min(1.25, DPR)` on mobile), rAF loop throttling (30 FPS active, 15 FPS / sleep when paused or off-screen), Web Audio voice node pooling and explicit disconnect sweeps, Convolver impulse response scaling on mobile profiles, and zero-reflow DOM highlight decoupling—ensuring 100% preservation of all existing desktop audio routing, tuning, and functionality.

#### 12. Implementation Guardrails & Known Issues

* **Guard Every DOM Lookup:** A single unguarded `getElementById(...).textContent` write to a removed label id crashes the entire top-level script on load. Always guard DOM element access before writing.
* **Downbeat Entry:** Preset changes, ⟲ ALL, and new seeds never force an immediate chord hit; new material enters on the next natural downbeat so it does not clash with outgoing delay and reverb tails.
* **WebKit / Safari Web Audio Graph Teardown (CRITICAL):** In Safari / WebKit, dynamic `AudioNode` instances (oscillators, gain nodes, biquad filters) are **not** garbage-collected when allowed to go out of JavaScript scope if they remain connected to any running upstream or downstream node in the audio context graph. Voice playback functions (`playSynthVoice`, `playArpNote`, `playDayan`, `playBayan`, `playSnare`, `playHiHat`, `triggerSympatheticStrings`) must use variadic `disconnectOnEnded(...)` to disconnect every oscillator, modulator, filter, and gain node upon voice envelope completion. Audio clock fallback oscillators (`scheduleAudioClockFallback`) must explicitly call `.disconnect()` when stopped. Dynamic aux sends in Module 5 sampler (`route()`) must be tracked and disconnected before creating replacement routing.
* **Live Field Recorder Memory Safety Cap:** Continuous live mic recording must enforce a hard 45-minute safety cap (~238 MB Float32Array mono at 44.1 kHz) to prevent unbounded memory allocation and mobile browser tab crashes.
* **Zero-Regression Mobile Performance Guardrail (CRITICAL):** Mobile RAM, CPU, and GPU optimizations must strictly operate as non-intrusive progressive enhancements. Desktop browsers must retain full 60 FPS rendering, full DPR resolution, full-length 4.8s convolution tails, and unthrottled visualizer rings. No optimization may alter the mathematical tuning of scales, coprime clock step counts, MIDI CC responsiveness, preset serialization schemas, or audio bus topologies.
* **Known Issue Resolution — Tangerine Dream Scale:** Resolved by validating that `activeScaleKey` maps cleanly to valid `SCALES` entries (falling back cleanly to `PHRYGIAN_AMB`).
* **Known Issue Resolution — Airports Drums:** Resolved by mapping drums-off state to `"MUTED"` mode so the drum selector accurately reflects engine status.

---

### Part III: App Development, PWA Shell & Cross-Platform Packaging

#### 13. Mobile & Desktop App Shell Architecture (PWA & Native Containers)

##### 13.1 Progressive Web App (PWA) Standalone Wrapper
* **Manifest Specification (`manifest.json` and `manifest.webmanifest`):**
  * `display: standalone` for full-bleed immersion, removing browser URL bars, navigation buttons, and tab chrome.
  * `theme_color: #07090e` and `background_color: #07090e` matching the workstation's CRT dark chassis.
  * Multi-density vector and raster icon suite:
    * Vector SVG: `icon.svg` (high-contrast ambient waveform and CRT glow).
    * Raster PWA: `icon-192.png` (192×192) and `icon-512.png` (512×512) with `"purpose": "any maskable"` declarations.
    * Apple Touch Icon: `apple-touch-icon.png` (180×180) for iOS home screen bookmarks.
* **Custom In-App Install Promotion UX (`#btnInstallApp`):**
  * Captures the browser's `beforeinstallprompt` event and reveals a high-visibility install pill in the header transport cluster.
  * Automatically hides once the app is installed or running inside standalone mode (`display-mode: standalone` media query or `window.navigator.standalone`).

##### 13.2 Viewport Physics & Mobile Device Adaptation
* **Dynamic Safe Area Insets:**
  * Uses CSS `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)` on the root `#app-shell`, sticky header, and floating transport bars.
  * Prevents UI clipping behind the iPhone Dynamic Island, camera notches, and home indicator gesture bars.
* **Overscroll & Gesture Lockdown:**
  * `overscroll-behavior-y: none` on `html` and `body` to prevent pull-to-refresh rubber-banding from interrupting active slider adjustments on iOS Safari and mobile Chrome.
  * `-webkit-tap-highlight-color: transparent` to eliminate grey tap rectangles during rapid keyboard or pad playing.
  * Mobile parameter controls use `touch-action: none !important` with 34px–44px touch targets to isolate slider drags from page scrolling.

##### 13.3 Offline-First Service Worker Engine (`sw.js`)
* **Dual-Tier Cache Strategy:**
  1. **Precached App Shell (`slambient-shell-v1`):** Pre-caches the core application bundle (`index.html`, `manifest.json`, `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).
  2. **Network-First Document Strategy:** Requests to `index.html` attempt network fetch first to immediately deliver fresh updates, falling back to cached shell instantly when offline, on airplanes, or in low-connectivity spaces.
  3. **Cache-First Static Asset & Font Strategy:** Google Fonts (`fonts.googleapis.com` stylesheets and `fonts.gstatic.com` woff2 binaries) are cached permanently once loaded for zero-latency offline font rendering.
* **Lifecycle & Cache Eviction:**
  * Uses `self.skipWaiting()` on install and `clients.claim()` on activate to ensure newly deployed versions take over without requiring zombie browser tabs to close.
  * Automatically iterates cache keys on activation and prunes outdated legacy caches (`caches.delete(key)`).

##### 13.4 Screen Wake Lock API & Transport Continuity
* **Transport-Linked Wake Lock:**
  * Integrates `navigator.wakeLock.request('screen')` directly into `btnPlay` / `startAudioEngine()`.
  * Keeps the device screen illuminated and prevents mobile OS aggressively suspending audio clock threads during generative listening sessions.
  * Releases wake lock cleanly upon STOP / PAUSE (`releaseWakeLock()`).
* **Foreground Re-Acquisition:**
  * Listens for `document.visibilitychange`. If the app returns to the foreground and audio transport is active, the wake lock is re-acquired automatically.

##### 13.5 Native Wrapper & App Store Packaging Targets
* **iOS (Apple App Store) & Android (Google Play) via Capacitor:**
  * Wrap `slambient_dev` using `@capacitor/core` and `@capacitor/ios` / `@capacitor/android`.
  * Configure `capacitor.config.json` with `webDir: "."` and `bundledWebRuntime: false`.
  * iOS WKWebView configuration: enable `allowsInlineMediaPlayback: true` and declare `UIBackgroundModes: ["audio"]` in `Info.plist` to preserve ambient generative audio in background/lockscreen.
* **Desktop (macOS / Windows / Linux) via Tauri:**
  * Lightweight Rust container (~10 MB binary vs Electron's 150 MB) wrapping the local web workstation.
  * Provides native OS menu bar items, global keyboard shortcuts, offline preset file dialogs, and low-latency Web Audio buffer configurations.

#### 14. Web Audio Runtime Hardening & Memory Management

##### 14.1 Memory Leak Hardening in Ambient Sessions
* **WebKit AudioNode Lifecycle Vulnerability:**
  * Modern WebKit / Safari retains dynamic `AudioNode` graphs in memory if any node in the voice chain remains connected to the context destination or an active bus, even after the voice JavaScript object is discarded.
* **Variadic Graph Disconnect Protocol:**
  * Upgraded `disconnectOnEnded(sourceNode, ...auxNodes)` to variadic signature.
  * Automatically binds `ended` event handlers to disconnect primary voice oscillators, modulators, waveshapers, filters, and envelope gain stages simultaneously.
  * Applied across all dynamic voice generators: `playSynthVoice`, `playArpNote`, `playDayan`, `playBayan`, `playSnare`, `playHiHat`, `triggerSympatheticStrings`.
* **Clock Fallback & Sampler Aux Teardown:**
  * Audio clock fallback oscillator (`scheduleAudioClockFallback`) disconnects and nulls its oscillator upon clock stop.
  * Module 5 field sampler (`route()`) disconnects existing aux send nodes before creating replacement connections, preventing node accumulation across audio evolutions.
* **Live Mic 45-Minute Safety Ceiling:**
  * `toggleRecord()` tracks recording duration and automatically halts and exports audio at 45 minutes, capping RAM buffer allocation to ~238 MB mono Float32Array to protect mobile devices from out-of-memory crashes.

##### 14.2 Cloudflare Pages Edge Deployment & Production Headers
* **Edge Delivery:** Global HTTP/3 and 0-RTT edge delivery via Cloudflare Pages.
* **Production `_headers` Configuration:**
  ```http
  /*
    X-Content-Type-Options: nosniff
    X-Frame-Options: SAMEORIGIN
    Referrer-Policy: strict-origin-when-cross-origin
    Permissions-Policy: microphone=(self), screen-wake-lock=(self)

  /sw.js
    Cache-Control: public, max-age=0, must-revalidate

  /index.html
    Cache-Control: public, max-age=0, must-revalidate

  /manifest.json
    Cache-Control: public, max-age=0, must-revalidate
  ```
* **Permissions Policy:** Specifically allows `microphone=(self)` for the pocket field recorder and `screen-wake-lock=(self)` for uninterrupted generative ambient performance while denying camera and geolocation.

##### 14.3 Mobile RAM, CPU & Thermal Management Specification (Non-Breaking Architecture)

###### 14.3.1 Problem Statement & Thermal/Memory Constraints on Mobile
On modern mobile platforms (iOS Safari / WebKit and Android Chrome / Blink), running real-time generative audio synthesis alongside multiple high-frame-rate HTML5 Canvas visualizers presents severe thermal and memory constraints:
1. **Retina Canvas Overdraw (3x DPR Multiplier):** Mobile devices feature 3x pixel density (`window.devicePixelRatio = 3.0`). Rendering a full-bleed canvas creates a $9\times$ pixel fill-rate load, allocating up to 30–40 MB per canvas backbuffer and causing immediate GPU thermal throttling and battery drain.
2. **High-Refresh Display Churn (90 Hz / 120 Hz ProMotion):** `requestAnimationFrame` defaults to display refresh frequency, firing unthrottled visualizer and physics loops at 120 FPS—even when audio playback is stopped or idle.
3. **Voice Allocation GC Pauses (Audio Crackles):** Continuous creation and abandonment of transient audio nodes (`createOscillator`, `createGain`, `createBiquadFilter`) generates heap churn, triggering JavaScript Garbage Collection (GC) sweeps on the main thread that cause micro-stutters and audio buffer underruns.
4. **Main-Thread Audio Processing:** Legacy `createScriptProcessor` nodes in audio capture pipelines force sample-by-sample processing onto the UI thread, competing directly with user touch events and UI rendering.
5. **WebKit Jetsam Memory Watchdog:** iOS terminates browser tabs that exceed dynamic memory thresholds during extended ambient listening sessions (especially when recording stems or buffering multi-channel audio).

###### 14.3.2 Canvas & Visualizer GPU/CPU Throttling Protocol
* **Strict Mobile DPR Clamping:**
  * Desktop environments retain full native display scaling (`Math.min(2.0, window.devicePixelRatio)`).
  * Mobile viewports enforce an explicit clamp: `Math.min(1.25, window.devicePixelRatio)`. On a 390×844 iPhone display, this drops backbuffer pixel allocation from ~3 million pixels down to ~500,000 pixels (an 83% reduction in GPU fill-rate).
* **Adaptive Frame-Rate Regulation:**
  * **Active Playback on Mobile:** Clamped to a rock-solid 30 FPS (`if (now - lastFrame < 32.5) return;`), reducing mobile CPU and GPU processing cycles by 50% on 60 Hz devices and 75% on 120 Hz ProMotion displays.
  * **Paused / Idle State:** When transport is paused (`!isPlaying`), visualizer rendering drops to a minimal 15 FPS sleep cadence or pauses completely until user interaction.
  * **Off-Screen Visibility Culling:** Both `scopeCanvas` and `orbitalCanvas` register `IntersectionObserver` instances with `0.01` threshold. When scrolled out of the viewport or covered by a modal/drawer, canvas clearing and drawing routines are completely bypassed.
  * **View-Mode Loop Sleep:** Switching to Console View completely halts orbital starfield and physics calculations; switching to Orbital View halts CRT visualizer canvas redraws.
* **Filter & Composite Optimization:**
  * Expensive `shadowBlur` and multi-pass additive blends (`globalCompositeOperation = 'lighter'`) are dynamically disabled or replaced with single-pass vector strokes on mobile profiles.

###### 14.3.3 Web Audio Voice Node Pooling & Main-Thread Offloading
* **Percussive Voice Node Pooling:**
  * Short-lived transient voices (tabla bols, woodblocks, kicks, snares, and fast shimmer notes) utilize a pre-warmed pool of reusable oscillator/gain pairs.
  * Nodes are muted via exponential gain fade and recycled rather than dereferenced and garbage collected.
* **AudioWorklet Capture Modernization:**
  * Replace `createScriptProcessor(4096, 1, 1)` in the Pocket Field Recorder with a dedicated `AudioWorkletProcessor` (`field-capture-processor.js`) running in the high-priority audio rendering thread.
  * Offloads audio RMS metering and circular ring-buffer capture completely off the JavaScript main execution thread.
* **Explicit Graph Disconnect Sweep:**
  * Expand `disconnectOnEnded()` to all transient generative generators, ensuring no lingering sub-nodes or feedback gains prevent WebKit memory reclamation.

###### 14.3.4 Convolver Impulse Response & Analyser Optimization
* **Adaptive Reverb Buffer Length:**
  * Desktop maintains full 4.8-second high-density stereo impulse responses (over 210,000 samples per channel).
  * Mobile profiles utilize a 1.6-second truncated impulse response tailored for mobile speakers and headphones, reducing real-time time-domain convolution math by 66% while preserving warm spatial decay.
* **Scaled FFT Resolution:**
  * Mobile visualizer ring analyzers switch from $1024$ or $2048$ down to $256$ or $512$ FFT bins, cutting per-frame frequency-analysis calculation overhead by 75%.

###### 14.3.5 DOM Churn Elimination in Animation Loops
* **Decoupled Keyboard LED & State Rendering:**
  * Remove `renderKeyboardHighlights()` DOM mutation sweeps from the per-frame `drawScope` loop.
  * Key classes (`.in-scale`, `.active-chord`, `.active-arp`, `.active-live`, `.active-drone`) are updated strictly on clock ticks and MIDI note state transitions (`startNoteLive`, `stopNoteLive`, `triggerCurrentChord`).
* **Cached Transport & Meter HUD Writes:**
  * Debounce `textContent` updates for `hudMeter` and `telemMeter` to downbeats and beat changes, eliminating repetitive DOM layout calculations.

###### 14.3.6 Mobile Low-Power / Battery Saver Profile Matrix

| Feature Parameter | Standard Desktop Profile | Mobile / Low-Power Profile | Impact / Savings |
| :--- | :--- | :--- | :--- |
| **Canvas DPR Cap** | `Math.min(2.0, DPR)` | `Math.min(1.25, DPR)` | ~83% GPU memory & fill reduction |
| **Visualizer Frame Rate** | 60 FPS (Native) | 30 FPS (15 FPS paused) | 50%–75% CPU/GPU cycles saved |
| **Canvas Shadow Glow** | Full `shadowBlur` multi-pass | Zero blur / crisp stroke | Eliminates expensive raster blur filters |
| **Reverb Impulse Duration**| 4.8 seconds (210k samples) | 1.6 seconds (70k samples) | 66% reduction in convolution math |
| **Visualizer Analyser FFT** | 1024 / 2048 bins | 256 / 512 bins | 75% reduction in FFT calculations |
| **Orbital Star Count** | 180 particles + 3D Eno | 40 particles / 2D Eno fallback| Significant 2D canvas draw savings |
| **Keyboard LED Updates** | Every rAF frame (~60–120 Hz) | Event-driven (clock/MIDI only)| Eliminates per-frame DOM layout reflows|
| **Capture Processor** | AudioWorklet / ScriptProc | AudioWorklet (Worker thread)| 0% audio math on UI thread |

###### 14.3.7 Zero-Regression Preservation Protocol
To satisfy the strict architectural requirement that no change impact existing code or functionality:
1. **Dynamic Environment Detection:** The mobile profile activates only when detecting mobile viewport dimensions (`window.matchMedia("(max-width: 900px)").matches`), touch capability (`navigator.maxTouchPoints > 0`), or an explicit user toggle (`#btnBatterySaver`).
2. **Desktop Transparency:** Desktop sessions run the unaltered full-fidelity engine: 60 FPS, 2.0 DPR, 4.8s convolution tails, and full particle counts.
3. **Audio Invariance:** All coprime clock math, prime-step loop lengths (7, 11, 13, 17, 19, 23), scale quantization, frequency tuning, MIDI CC mappings, and preset JSON serialization remain 100% bit-for-bit identical across all targets.

#### 15. Stereo Binaural Panning & Spatial Drift Engine

##### 15.1 Psychoacoustic Philosophy & Dual-Axis Drift
* **Aesthetic Goal:** Avoid static left/right channel pinning in ambient generative music. Sound sources behave as suspended acoustic objects orbiting organically around the listener's head.
* **Low-Frequency Anchor:** Sub-drone fundamentals and kick percussion remain locked dead center (`pan = 0.0`) for mono punch and zero phase cancellation on small speakers.
* **Coprime Slow Orbital Sweeps:** Mid and high frequencies orbit on non-repeating prime cycles:
  * **Sub-Drone & Kick:** Anchored dead center (`pan = 0.0`).
  * **Tanpura Acoustic Drone:** Subtle micro-spread (`±0.25` spread at 0.017 Hz / ~58s period).
  * **Chords & Sitar:** Breathing figure-8 sweep (`±0.45` spread at 0.043 Hz / ~23s period).
  * **Shimmer Arp & Bansuri:** Floating orbital swirl (`±0.75` spread at 0.071 Hz / ~14s period).
  * **Atmosphere & Noise:** Wide atmospheric envelopment (`±0.85` spread at 0.031 Hz / ~32s period).

##### 15.2 Psychoacoustic Model: ITD & Head-Shadow ILD
* **Interaural Time Difference (ITD / Haas Phase Delay):**
  * Human ears are ~17.5 cm apart, producing arrival time differences up to 0.65 ms (650 microseconds).
  * As sounds move toward one ear, the opposite ear receives a variable micro-delay (`0.0 to 0.65ms`), generating an unmistakable sense of external three-dimensional acoustic space in headphones.
* **Interaural Level Difference (ILD) & Head-Shadow Filtering:**
  * Cranial shadow attenuates high frequencies on the opposite ear.
  * A gentle 6dB/oct `highshelf` filter at 3500 Hz rolls off up to -4.5 dB on the far ear, simulating acoustic cranial absorption while leaving fundamental pitches completely untouched.
* **Mono-Safe Correlation:**
  * Positive-gain equal-power summing with sub-millisecond ITD micro-delays guarantees 100% phase coherence when summed to mono (phone speakers).

##### 15.3 Macro-Weather Modulation & Hardware Parity
* **Weather Macro Integration:** `knobWeather` dynamically scales drift velocity and stereo breadth (`0.5 + weatherVal`), allowing denser atmospheric settings to produce wider orbital motion.
* **Continuous Foreground & Background Drift:** Driven by `requestAnimationFrame` at 60 FPS when active, and maintained via `clockTick()` when backgrounded or locked.
* **Embedded Hardware Parity:** On the embedded FM-1 hardware, full audio-rate biquad filtering per channel is substituted with slow sinusoidal LFO modulators sending pan CC modulations using fixed-point math (`SINE_LUT`).

##### 15.4 Full-Range Keyboard Register Architecture & Anti-Piercing Acoustic Damping
* **Panoramic Register Liberation:** Accommodating the 88-Key Panoramic Harmonic Radar mode (A0 MIDI 21 to C8 MIDI 108), instruments roam freely across wide registers instead of being forced into the center two octaves (C3–C5).
* **Extended Voicing Ceilings & Bass Anchors:**
  * **Chords & Voicings:** Voicing ceiling lifted from MIDI 72 (C5) to MIDI 84 (C6), allowing 7th, 9th, and 11th intervals to breathe. Polyphonic chords add an acoustic bass anchor at `rootMidi - 12` (C2–B2, MIDI 36–47) for deep, non-muddy grounding. Sitar phrases roam between Mandra (G2–C3, MIDI 43–48) and Taar (A5, MIDI 81) saptaks.
  * **Arpeggiator Engine:** Note range unlocked from MIDI 36 (C2) to MIDI 96 (C7), allowing multi-octave arps (`arpOctaves = 2, 3, 4`) to traverse across 5 octaves. Extreme upper keys (C#7–C8, MIDI 97–108) are reserved to keep the soundstage crystalline and uncrowded.
  * **Melodic Lead:** Roams between G2 (MIDI 43, warm cello range) and A5 (MIDI 81, soaring horn range).
* **Psychoacoustic Anti-Piercing Damping & Tone Softening:**
  * **Dynamic Voice Filter Cutoff:** Voice filter low-pass cutoffs reduce from `5.4x` to `3.0x` fundamental for notes above MIDI 72 (capped at 3000 Hz), eliminating harsh upper harmonics.
  * **Velocity Tapering:** `highNoteDamp = Math.max(0.38, 1.0 - Math.max(0, midi - 56) * 0.018)` smoothly softens velocities above G#3.
  * **FM Index & Harmonic Scaling:** High-register FM indices on `GLASS_EP`, `RHODES`, and `GLASS_FM` taper inversely with frequency to eliminate digital sideband aliasing. Metallic tines on `KALIMBA`, chimes on `MUSIC_BOX`, and pulse levels on `ANALOG_PULSE` are progressively softened above MIDI 72.

---

### Part IV: FM-1 Hardware Conversion Planning & Physical Control Mapping Specification

#### 16. FM-1 Physical Architecture & Hardware Surface Topology

##### 16.1 Target Embedded Platform (JieLi AC791N / Package ID FM-1_900)
* **Processor Architecture:** Dual-Core 32-bit RISC DSP clocked at up to 320 MHz.
  * **Core 0 (System, UI & Flash):** Handles physical button debouncing, rotary encoder interrupts, SPI display DMA strip rendering, flash journaling, and USB-MIDI/UART event queues.
  * **Core 1 (Real-Time Audio ISR & Generative Brain):** Dedicated sample-accurate audio interrupt service routine, 12-voice polyphonic synthesis pipeline, 4-track coprime clock step sequencers, and master DSP insert chain.
* **Memory Budget & Headroom Enforcement:**
  * **Static RAM (`.data` + `.bss`):** Strict 98 KB ceiling with a verified 5.5 KB safety margin.
  * **Audio Heap:** 344 KB total dynamic allocation pool.
  * **Fixed-Allocation DSP Heap:** Strictly capped at **20.75 KB** (Tape wow/flutter delay line: 4.4 KB; lookahead peak limiter: 350 B; half-rate diffusion reverb: 16.0 KB). No dynamic `malloc()` or `free()` calls are permitted inside the audio ISR.
* **Physical I/O & Peripheral Interfaces:**
  * **USB-C Interface:** USB 2.0 Full-Speed bidirectional USB-MIDI class-compliant device and 5V DC power/charging.
  * **3.5mm TRS MIDI IN:** Hardware MIDI input (Type A standard) running opto-isolated 31,250 baud serial communication.
  * **3.5mm Stereo Audio Output:** Low-noise 24-bit stereo DAC line/headphone output with an integrated mechanical switch that automatically mutes the internal speaker upon jack insertion.
  * **Internal Monitor Speaker:** Class-D amplified mono speaker for portable acoustic listening.
  * **Onboard Microphone & 3.5mm Line In:** Audio sampling input for pocket field recordings.
  * **Bluetooth BLE Disablement:** Bluetooth radio hardware is explicitly disabled in firmware at boot to eliminate RF noise coupling into the sensitive analog DAC stage and prevent high-priority BLE interrupts from stalling real-time audio buffers.

##### 16.2 Surface Hardware Topology: Silicone Keys, Encoders & SPI Screen
The physical surface of the Felucca FM-1 hardware features a unified tactile layout designed for rapid live improvisation and deep menu navigation without a mouse or computer:

```
+-----------------------------------------------------------------------------------+
|  [ HOME ]  [ SEQ ]  [ EDIT ]  [ FX ]  [ GLO ]      [ E1 ]   [ E2 ]   [ E3 ]   [ E4 ]  |
|                                                    (Push)   (Push)   (Push)   (Push)  |
|  +---------------------------+  [ OCT - ] [ OCT + ]                               |
|  | SPI COLOR LCD / OLED      |                                                    |
|  | 24 FPS DMA STRIP DISPLAY  |  [ REC ]   [ PLAY ]   [ SHIFT ]   [ TRACK ]        |
|  +---------------------------+                                                    |
|                                                                                   |
|   [ 01 ] [ 02 ] [ 03 ] [ 04 ] [ 05 ] [ 06 ] [ 07 ] [ 08 ]                         |
|   [ 09 ] [ 10 ] [ 11 ] [ 12 ] [ 13 ] [ 14 ] [ 15 ] [ 16 ]                         |
|      <------------ 16 PERFORMANCE STEP / SILICONE KEYS ------------>               |
+-----------------------------------------------------------------------------------+
```

* **27 Silicone Keys Breakdown:**
  * **16 Performance Step Keys (Bottom Matrix, Keys 01–16):** Backlit silicone keys functioning as 16 musical keyboard notes (quantized to active scale or chromatic with OCT-/OCT+ transposition), 16-step sequencer pattern triggers, or 16-slot preset recall buttons.
  * **11 Navigation & Function Keys (Top & Center Matrix):**
    1. `HOME`: Instant return to the high-level Master CRT Telemetry view.
    2. `SEQ`: Toggle 16-step coprime loop view, mute mask, and step gate editor.
    3. `EDIT`: Cycle active instrument module pages (Sub/Drone ➔ Drums ➔ Chords ➔ Arp ➔ Field).
    4. `FX`: Cycle and inspect the 3-pedal DSP insert chain (Delay ➔ Reverb ➔ Chorus ➔ Master EQ).
    5. `GLO`: Global system configuration (Root key, Scale mode, 32-bit World Seed, MIDI channels).
    6. `OCT -`: Shift musical octave down one octave (range C1–C7).
    7. `OCT +`: Shift musical octave up one octave (range C1–C7).
    8. `REC`: Tap/hold to trigger sample recording, or `SHIFT + REC` to store patch to flash.
    9. `PLAY / STOP`: Master transport start and stop with smooth bus gain ramping.
    10. `SHIFT`: Latching/momentary secondary modifier button unlocking deeper hardware functions.
    11. `TRACK`: Quick track select and mute matrix (Drone, Drums, Chords, Arp).
* **Continuous Push-Rotary Encoders (E1–E4 Primary, E5–E6 Auxiliary if equipped):**
  * High-resolution 24-detent continuous optical/magnetic rotary encoders with integrated momentary push switches.
  * Because encoders are continuous, switching modes never creates parameter jumps (eliminating the need for catch-up or jump modes inherent in analog potentiometers).

---

#### 17. Physical UI State Machine, Encoder Modes & Button Relationships

##### 17.1 Dual-Mode Rotary Encoder Dispatch
The physical rotary encoders operate in two distinct software modes, determined by the active navigation context:

###### Mode A: GLOBAL / MACRO MODE (Default Performance View)
Engaged whenever the device is in `HOME` view. Encoders map directly to the primary master performance controls of the web application:
* **Encoder 1 (Master Filter Cutoff):**
  * *Rotate:* Adjusts master lowpass filter cutoff frequency (`knobMasterCutoff`, 60 Hz – 16 kHz with logarithmic response curve).
  * *Push Switch:* Cycles master filter slope (12 dB/oct ➔ 24 dB/oct) or bypass.
* **Encoder 2 (Master Resonance):**
  * *Rotate:* Adjusts master filter resonance (`knobMasterRes`, Q = 0.5 – 8.0).
  * *Push Switch:* Instantly resets resonance to neutral Butterworth Q (0.707).
* **Encoder 3 (Space / Diffusion Weather):**
  * *Rotate:* Controls master diffusion space and weather atmosphere (`knobWeather`, 0–100%). Dynamically scales reverb decay, chorus depth, and binaural drift spread.
  * *Push Switch:* Toggles "Space Freeze" (infinite reverb sustain with input cut).
* **Encoder 4 (Master Tempo / BPM):**
  * *Rotate:* Sets master coprime tempo (`knobBpmHeader`, 45–115 BPM in 1 BPM increments).
  * *Push Switch:* Tap tempo (calculates running average over 3 consecutive presses).
* **Encoder 5 / 6 (When equipped or via SHIFT + E1 / E2):**
  * *E5 Rotate (Drive & Flutter):* Master analog tape saturation (`knobMasterDrive`, 0–100%) and wow/flutter depth.
  * *E6 Rotate (Master Volume):* Master DAC output gain (`knobMasterVolume`, 0–100%). Push switch toggles instant master mute.

###### Mode B: CONTEXTUAL MODULE / EDIT PAGE MODE
Engaged when pressing `EDIT` or selecting a specific module. The four encoders adapt to the active module displayed on the SPI screen:

| Active Context | Encoder 1 (E1) | Encoder 2 (E2) | Encoder 3 (E3) | Encoder 4 (E4) |
| :--- | :--- | :--- | :--- | :--- |
| **Module 1: Sub & Drone** | Drone Level (`knobDrone`) | Sub Cutoff (`knobDroneFilter`) | Wander Speed (`knobDroneWander`) | Tanpura Level / Buzz (`knobTanpura` / `knobJavari`) |
| **Module 2: Drums** | Drum Level (`knobDrumVol`) | Punch / Attack (`knobDrumPunch`) | Density / Rest % (`knobDrumDensity`) | Groove Algorithm (`selDrumStyle`) |
| **Module 3: Chords / Lead** | Chord Level (`knobChordVol`) | Sustain / Decay (`knobChordSustain`) | Dynamics / Velocity (`knobChordDynamics`) | Strum Spread (`knobStrum`, ms) |
| **Module 4: Shimmer Arp** | Arp Level (`knobArpVol`) | Gate Length (`knobArpGate`, ms) | Rest Probability (`knobArpRest`, Ma %) | Pattern Selector (`selArpPattern`) |
| **Module 5: Field Recorder** | Noise/Field Level (`knobNoiseVol`) | Filter Color (`knobNoiseColor`) | Spatial Drift (`knobNoiseDrift`) | Weave Mode (`ALL`/`GHOST`/`CHOIR`/`OFF`) |
| **FX Page: Tape Delay** | Delay Time (`knobDelayTime`, ms/div) | Feedback (`knobDelayFeedback`, max 48%) | Tone / Dampening (`knobDelayTone`) | Wet / Dry Mix (`knobDelayMix`) |
| **FX Page: Reverb** | Decay Time (`knobReverbDecay`, s) | Damping / Air (`knobReverbTone`) | Pre-Delay (`knobReverbPre`, ms) | Wet / Dry Mix (`knobReverbMix`) |
| **FX Page: Master EQ** | Low Shelf Gain (100 Hz, ±12 dB) | Mid Bell Gain (1 kHz, ±12 dB) | High Shelf Gain (4.5 kHz, ±12 dB) | Master Saturation (`knobMasterDrive`) |

##### 17.2 Complete Button Matrix & Dual-Function (SHIFT) Relationships

| Button | Primary Direct Action (Tap) | Secondary Action (`SHIFT + Tap`) | Hold Action (> 600 ms) |
| :--- | :--- | :--- | :--- |
| **`HOME`** | Return to Master CRT Telemetry view | Toggle Screen Color Theme (Y / G / P / W) | Calibrate Encoders / Center Zero |
| **`SEQ`** | Open Coprime Step Sequencer matrix | Randomize Loop Lengths (7, 11, 13, 17) | Clear Active Pattern Mute Mask |
| **`EDIT`** | Cycle forward to next Instrument Module | Cycle backward to previous Instrument Module | Jump directly to Module 1 (Drone) |
| **`FX`** | Cycle forward through DSP insert pedals | Reorder DSP pedals (DLY➔REV ➔ REV➔DLY) | Bypass entire DSP insert chain |
| **`GLO`** | Open Global Settings (Scale, Root, Seed) | Generate New 32-Bit World Seed (⟲ RE-SEED) | Show Firmware Build & Battery Health |
| **`OCT -`** | Transpose live silicone keys down 1 octave | Transpose Root Key down 1 semitone | Reset live octave to C3 |
| **`OCT +`** | Transpose live silicone keys up 1 octave | Transpose Root Key up 1 semitone | Reset live octave to C3 |
| **`REC`** | Tap: Arm/Disarm Field Mic Recorder | `SHIFT + REC`: Store Patch to Active Flash Slot | Instant Record & Loop (Hold to record) |
| **`PLAY`** | Master Transport Play / Pause | `SHIFT + PLAY`: PANIC (All Notes & Tails Off) | Restart Clock to Step 1 Downbeat |
| **`SHIFT`** | Momentary modifier for secondary functions | Double-tap locks SHIFT mode (LED solid) | Clear modifier latch |
| **`TRACK`** | Open Track Mute / Solo HUD | `SHIFT + TRACK`: Open Track Pan & Drift Menu | Solo active track |
| **`KEYS 01–16`** | Trigger musical note / Edit sequencer step | Instant recall Presets 01–15 / Slot 16 Init | Save current patch into Preset slot 01–16 |

##### 17.3 Generative AUTO-to-LIVE Takeover & Downbeat Hand-off State Machine
To deliver effortless live performance over generative ambient landscapes, the FM-1 firmware implements a seamless, click-free three-state transition engine:

```
                  +--------------------------------+
                  |                                |
                  |       STATE_AUTO_GEN           |
                  |  (Generative Coprime Brain)    |
                  |                                |
                  +---------------+----------------+
                                  |
               Key Pressed (Any of Keys 01-16)
               Instant Preemption (Voices 5-7 or Voice 3)
               Latency = 0 ms
                                  |
                                  v
                  +--------------------------------+
                  |                                |
                  |      STATE_LIVE_TAKEOVER       |
                  |  (Real-Time Silicone Playing)  |
                  |                                |
                  +---------------+----------------+
                                  |
               All Silicone Keys Released
               Anchor Root = Last Played Pitch
               Set Latch Timer = Next Bar Downbeat
                                  |
                                  v
                  +--------------------------------+
                  |                                |
                  |    STATE_DOWNBEAT_HANDOFF      |
                  |   (50ms Cosine Fade Release)   |
                  |                                |
                  +---------------+----------------+
                                  |
               Clock Hits Next Downbeat Tick
               Re-align Coprime Cycles to New Anchor
                                  |
                                  +--------> (Return to STATE_AUTO_GEN)
```

1. **`STATE_AUTO_GEN` (Autonomous Generative Generation):**
   * The 4-layer coprime engine runs independently on Core 1, generating chord voicings, arpeggio cascades, tabla rhythms, and sub-drone evolutions.
   * Visualizer indicates `AUTO` badge in green phosphor on the SPI display.
2. **`STATE_LIVE_TAKEOVER` (Physical Performance Preemption):**
   * The moment the user touches any of the 16 silicone keys, Core 1 instantly routes the note events to `PRIORITY_CRITICAL` voices (Voices 5–7 for chords/leads, or dynamically borrows Voice 3).
   * Generative lead phrasing is immediately suppressed without cutting off active reverb or delay tails.
   * Telemetry badge instantly flips to `LIVE` in amber phosphor.
3. **`STATE_DOWNBEAT_HANDOFF` (Smooth Harmonic Re-engagement):**
   * When the musician releases the last held silicone key, the engine does **not** instantly slam back into generative mode.
   * The generative brain extracts the root pitch and scale degree of the player's final chord, sets it as the new harmonic tonal center, and schedules generative re-entry on the **next musical downbeat** (bar boundary).
   * Active live voices execute a smooth 50–100 ms cosine decay, preventing audible pops or abrupt harmonic clashes.

---

#### 18. SPI Display Telemetry, CRT Miniatures & Visual Feedback Layouts

##### 18.1 24 FPS DMA Strip-Buffered Display Architecture
* **Display Specifications:** 160×80 (or 240×135) full-color SPI TFT/OLED driven over high-speed 4-wire SPI at 32 MHz.
* **Zero Audio Jitter via Core Separation:**
  * Core 0 renders graphical primitives and text into a 4 KB DMA strip buffer (e.g. 160×16 pixels per strip).
  * Transmission is handled asynchronously by hardware SPI DMA interrupts, requiring less than 2% of Core 0 CPU time and leaving Core 1 100% uninterrupted for audio DSP.
* **Palette Architecture:** Single-channel 8-bit CRT phosphor palette (Green `#42ff78`, Amber `#ffb830`, Cyan `#00e5ff`, White `#f0f4f8`), dynamically matching the web app's Eno phosphor themes.

##### 18.2 Primary Display Page Layouts

###### Page 1: `DISP_HOME_CRT` (Master Ambient Telemetry Screen)
```
+-------------------------------------------------------------+
| SLAMBIENT FM-1     [AUTO]  M:7/4  108 BPM   SEED:#534C-414D |
| [~~~ W A V E F O R M ~~~]  ROOT: D  MODE: DORIAN            |
|  /\_/\__/\___/\_/\_/\_/\_  CHORD: Dm9 [D F A C E]           |
|                                                             |
| T1:DRN [####....]  T3:ARP [######..]   REV: 42%   DLY: 38%  |
| T2:CHD [######..]  T4:DRM [###.....]   CUT: 1.2k  RES: 2.4  |
+-------------------------------------------------------------+
```
* **Top Status Banner:** Station ID, Takeover Mode (`[AUTO]` / `[LIVE]`), Time Signature, Current BPM, and full 32-bit World Seed (`#534C-414D`).
* **Miniature CRT Oscilloscope:** Real-time 64-pixel audio waveform window displaying output bus activity.
* **Harmonic Telemetry:** Active Root, Scale Mode, Chord Name, and voiced pitch intervals.
* **Track Activity Pips:** 4 four-segment activity meters for Drone, Chords, Arp, and Drums.
* **Macro HUD:** Numerical feedback for Master Cutoff, Resonance, Reverb, and Delay.

###### Page 2: `DISP_EDIT_MODULE` (Contextual Module Parameter Screen)
```
+-------------------------------------------------------------+
| EDIT: MODULE 3 (CHORDS / LEAD)            PG 1/2  [TRACK 2] |
|                                                             |
|   (E1) LEVEL        (E2) SUSTAIN      (E3) DYNAM    (E4) STRUM |
|     84%               160%              75%           75 ms  |
|    [=====---]        [========]        [====----]    [==------]|
|                                                             |
| VOICING: OPEN 9THS   TIMBRE: MAIHAR SITAR     VOICES: 3/8   |
+-------------------------------------------------------------+
```
* Clear visual representation of all 4 rotary encoders with graphical progress bars and precise numerical values.
* Secondary parameters (Voicing, Timbre, Voice allocation status) displayed on lower line.

###### Page 3: `DISP_FX_CHAIN` (DSP Pedal Insert Routing Screen)
```
+-------------------------------------------------------------+
| FX CHAIN ROUTING                           [ CHAIN ACTIVE ] |
|                                                             |
|   +---------+     +---------+     +---------+     +-----+   |
|   | 1:DELAY | --> | 2:REVERB| --> | 3:CHORUS| --> |4:EQ |   |
|   | 38% /44%|     | 42% /3.4|     | 25% ENS |     |WARM |   |
|   +---------+     +---------+     +---------+     +-----+   |
| (SHIFT+FX TO REORDER)                           CLIP: [ OK ]|
+-------------------------------------------------------------+
```
* Visual block diagram showing active pedal sequence.
* Real-time soft-clip LED indicator (`CLIP: [ OK ]` turns into `[ SAT ]` when tape soft-saturation engages).

---

#### 19. Phased Hardware Conversion Roadmap (Phases HW-1 to HW-8)

To systematically port the complete Slambient Web Workstation to the FM-1 embedded hardware with zero audio underruns and flawless stability, development is structured into 8 discrete hardware engineering phases:

##### Phase HW-1: SLOOP Co-Processor Hooking & Voice Allocation Architecture
* **Objective:** Establish the low-level co-processor interface between the Slambient generative brain and the stock SLOOP/Felucca firmware (`fw-AC79_AIoT_SDK`).
* **Deliverables:**
  * Fork and pin SLOOP v2.4/v2.5 codebase under `slambient-fm1/`.
  * Establish Track 1–4 event dispatchers in `seq.c` and `audio.c`.
  * Implement the strict 12-voice polyphonic budget (Voice 0: Drone, Voices 1–2: Pad, Voice 3: Shared Pad/Lead, Voice 4: Arp, Voices 5–7: Live Headroom, Track 4: 4 Drum voices).
  * Implement dynamic Voice 3 borrowing state machine with 10 ms cosine anti-click ramp-down on preemption.
* **Verification Gate:** Zero voice allocation collisions during simultaneous 4-track playback verified via UART log telemetry.

##### Phase HW-2: Fixed-Point DSP & Deterministic Generative Math Port
* **Objective:** Port all floating-point math, LFO modulators, and scale algorithms to 32-bit fixed-point (Q16.16) arithmetic for maximum execution speed.
* **Deliverables:**
  * Implement 1024-entry sine lookup table `SINE_LUT[1024]` with linear interpolation.
  * Port 32-bit xorshift32 PRNG engine (`slambient_prng_next()`) guaranteeing 1:1 mathematical determinism with the web app for identical `#534C-414D` seeds.
  * Implement scale quantization table covering all 14 Slambient scales, including Indian Classical Ragas (Bilawal, Bhairav) and Maihar 22-shruti microtonal offsets.
  * Port 6-prime clock divider engine (periods 7, 11, 13, 17, 19, 23 ticks).
* **Verification Gate:** 1,000,000-step PRNG regression test matching macOS CLI simulator against web app output buffer byte-for-byte.

##### Phase HW-3: Physical UI State Machine, Encoder Matrix & Key Takeover Driver
* **Objective:** Implement real-time interrupt drivers for the 27 silicone keys and continuous rotary encoders.
* **Deliverables:**
  * Non-blocking 5 ms debounce matrix scanner on Core 0 for 27 silicone keys.
  * Quadrature decoding ISR for 4 (or 6) continuous optical rotary encoders with dynamic velocity acceleration (slow rotation = fine 1-unit adjustments; rapid flick = wide sweeps).
  * Dual-mode encoder dispatcher (Global/Macro Mode vs. Contextual Module Mode).
  * AUTO-to-LIVE takeover and downbeat hand-off state machine connecting physical silicone keys 01–16 to Voices 5–7.
* **Verification Gate:** Sub-1ms key-to-audio trigger latency measured via oscilloscope on DAC output.

##### Phase HW-4: Memory-Capped Audio DSP & FX Pipeline Port (20.75 KB Budget)
* **Objective:** Port the 3-pedal DSP insert chain and Master EQ/Limiter within the strict 20.75 KB static audio heap allocation.
* **Deliverables:**
  * **Tape Wow/Flutter Delay (4.4 KB):** 16-bit mono circular delay line (max 1100 ms at downsampled 22.05 kHz) with 0.15 Hz sinusoidal tape wow modulation and 48% feedback ceiling.
  * **Diffusion Reverb (16.0 KB):** Half-rate (24 kHz) Schroeder-Moorer 4-comb / 2-allpass diffusion matrix with high-frequency absorption damping.
  * **Lookahead Peak Limiter (350 B):** 2 ms lookahead ring buffer (48 samples at 24 kHz) providing brickwall limiting at -0.5 dBFS with zero audible distortion.
  * **Master Saturation & Warmth Filter:** Fixed-point polynomial approximation of `tanh(x)` soft saturation and 2-pole resonant lowpass filter.
* **Verification Gate:** Total DSP memory footprint validated ≤ 21,248 bytes; zero buffer overruns under maximum polyphony.

##### Phase HW-5: SPI DMA Strip UI, Telemetry & Compact CRT Visualizer
* **Objective:** Build the 24 FPS hardware graphical user interface on the SPI LCD/OLED display.
* **Deliverables:**
  * Core 0 4 KB DMA strip-buffer rendering engine pushing updates asynchronously over 32 MHz SPI.
  * Lock-free 32-entry drop-on-full ring buffer bridging Core 1 audio telemetry to Core 0 UI renderer.
  * Render Page 1 (`DISP_HOME_CRT`) featuring mini-oscilloscope, 4-track activity meters, active chord name, and seed display.
  * Render Page 2 (`DISP_EDIT_MODULE`) and Page 3 (`DISP_FX_CHAIN`).
  * Phosphor palette switching (Yellow, Green, Pink, White) on `HOME` triple-tap.
* **Verification Gate:** Stable 24 FPS display refresh rate measured with zero frame drops and zero CPU interference with Core 1 audio ISR.

##### Phase HW-6: Flash Journaling, System Health & Low-Power Battery Management
* **Objective:** Implement non-volatile state persistence across battery cycles and low-power hardware management.
* **Deliverables:**
  * Two-sector ping-pong flash journaling across Sector A and Sector B (4 KB each) using 24-byte atomic state records protected by CRC32 checksums.
  * Background sector pre-erasing during transport STOP for zero-latency flash writes upon power-down.
  * Auto-dimmer power management: screen brightness steps down to 30% PWM after 60 seconds of hardware inactivity.
  * Low-battery interrupt handler: triggers atomic flash save and parks audio codecs before battery cutoff.
* **Verification Gate:** 1,000 consecutive power-cycle recovery tests with 100% state restoration accuracy.

##### Phase HW-7: Live Performance & Field Recording / Audio Ingestion Port
* **Objective:** Port Module 5 live pocket field recorder and mic ingestion to physical hardware.
* **Deliverables:**
  * ADC input driver capturing built-in microphone and 3.5mm line-in audio at 22.05 kHz 12-bit mono.
  * Direct flash streaming ring buffer capturing up to 45 seconds of live audio into dedicated sample flash sectors.
  * Granular tape-playback engine with forward, reverse, and ghost-weave playback modes.
  * Physical `REC` key integration: single-tap arms recorder; hold records; release loops.
* **Verification Gate:** Clean audio capture with automatic gain normalization and click-free tape looping.

##### Phase HW-8: 24-Hour Soak Testing, Thermal Verification & Production Firmware Signing
* **Objective:** Rigorous stress-testing and production release packaging.
* **Deliverables:**
  * Continuous 24-hour hardware burn-in test running complex coprime patterns across all 4 tracks.
  * Thermal profiling ensuring JieLi AC791N die temperature remains < 52°C under sustained load.
  * Audio buffer underrun telemetry monitor confirming 0 buffer dropouts over 1,000,000 generated bars.
  * Firmware binary packaging (`build/felucca.fwsc`) signed for WebMIDI browser flasher (`fm1.designburgapps.com`).
* **Verification Gate:** Unconditional pass across all 24-hour soak tests; official release tagged `slambient-fm1-v1.0.0`.

---

### Part V: Commercialization, Monetization Strategy & Native Release Roadmap

#### 20. Market Landscape, Monetization Pathways & Competitive Moats

##### 20.1 Market Landscape & Precedents
The global market for ambient sound, focus audio, lo-fi beatmaking, and boutique hardware instruments has grown into a multi-million-dollar sector. Consumer demand is bifurcated into two high-spending segments:
1. **Focus, Wellness & Ambient Listeners:** Consumers seeking escape from digital clutter, infinite notifications, and algorithmic music fatigue. Precedents:
   * **Brian Eno's Generative Suite (*Bloom*, *Scape*, *Trope*):** Multi-million-dollar gross lifetime revenue at $3.99–$4.99 paid upfront with zero recurring server costs.
   * **Endel:** High eight-figure valuation and multi-million-dollar ARR charging $9.99–$14.99/month for algorithmic sound environments.
   * **Dark Noise / Portal / Brain.fm:** Proven subscriber bases for atmospheric utility audio.
2. **Lo-Fi, Beatmaking & Ambient Hardware Enthusiasts:** Electronic musicians seeking tactile, DAWless standalone boxes with retro visual aesthetics. Precedents:
   * **Sonicware LIVEN Ambient Ø:** Sold out production runs at $239 USD, confirming intense appetite for dedicated drone/ambient hardware.
   * **Chompi Club:** Raised $1.1M+ on Kickstarter for an atmospheric retro-tape lo-fi sampler.
   * **Teenage Engineering (EP-133 K.O. II, OP-1, OP-Z):** Demonstrated that nostalgic calculator/industrial aesthetics command high margins and viral organic social reach.
   * **Splice, Gumroad & Loopmasters:** Musicians routinely spend $20–$50 per ambient stem/sample pack.

##### 20.2 The Slambient Competitive Moat
* **Mathematical Harmonic Intelligence:** Unlike static noise players or repetitive 4-bar synth loops, Slambient's coprime generative clock (7, 11, 13, 17, 19, 23 steps) and modal scale quantization ensure soundscapes never repeat while maintaining strict 82% consonance.
* **Boutique Audiophile Aesthetic:** Authentic BoC tape wow/flutter, Maihar jawari buzzing formants, 24-harmonic didgeridoo drones, and psychoacoustic Haas binaural spatial drift provide character impossible to achieve with generic stock synths.
* **Cohesive Cross-Platform Identity:** Seamless bridge between zero-friction web PWA, native mobile/desktop apps, and tactile physical silicone-key DSP hardware (Felucca FM-1).

##### 20.3 Three-Tier Commercial Structure
```
+-------------------------------------------------------------------------------+
|  TIER 1: MOBILE APP STORE (iOS / iPadOS)                                      |
|  "The Pocket Generative Ambient Machine"                                      |
|  $4.99 – $7.99 Paid Upfront · Zero Subscriptions · Zero Ads · 100% Offline   |
+-------------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|  TIER 2: DESKTOP STUDIO & STEM GENERATOR (macOS / Windows)                    |
|  "Infinite Ambient Stems & Multi-Track MIDI Engine"                           |
|  $29.00 – $39.00 One-Time License · 100% Royalty-Free Commercial Usage        |
+-------------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------------+
|  TIER 3: FELUCCA FM-1 STANDALONE PHYSICAL HARDWARE                            |
|  "Tactile Silicone-Key Ambient Synthesizer & Looper"                          |
|  $179.00 – $249.00 Retail · Batch Manufacturing / Kickstarter Pre-Orders      |
+-------------------------------------------------------------------------------+
```

---

#### 21. Step 1 Implementation Plan — iOS & iPadOS App Store Launch

##### 21.1 Native Mobile Container Architecture (Capacitor)
* **Framework Selection:** `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` wrapping the production web build.
* **Audio Background Modes & Lifecycle Configuration (`Info.plist`):**
  * `UIBackgroundModes: ["audio"]` enabled to guarantee continuous Web Audio synthesis when the device is locked, placed in a pocket, or when running alongside writing and note-taking apps.
  * Audio session configured via native bridge: `AVAudioSessionCategoryPlayback` with `AVAudioSessionCategoryOptionMixWithOthers` allowing users to blend generative soundscapes with rain sounds, podcasts, or ambient room audio.
  * Screen Wake Lock API mapped to native iOS idle timer toggling (`isIdleTimerDisabled`).
* **Tactile Haptic Feedback Engine:**
  * `@capacitor/haptics` integration:
    * Rotary encoder drag: `ImpactStyle.Light` on each 5% detent step.
    * Silicone key strike: `ImpactStyle.Medium` with low-latency trigger.
    * Preset / Mood shift: `NotificationType.Success` vibration pulse.

##### 21.2 Lock Screen & Control Center Integration (`navigator.mediaSession`)
* **Live Session Metadata:** Dynamically updates iOS Lock Screen and Dynamic Island:
  * Title: Active Preset Name (e.g. *"Khan Lineage"* / *"Douglas Firs"* / *"Hiroshi Drift"*).
  * Artist: *"Slambient Generative Engine"*.
  * Album: Current Root & Scale Mode (e.g. *"D Dorian · 7/4 · Seed #534C-414D"*).
  * Dynamic Artwork: High-contrast CRT phosphor visualizer snapshot rendered to canvas and exported as data URI.
* **Hardware Lock Screen Controls:**
  * `play` / `pause`: Toggles master coprime transport.
  * `nexttrack`: Cycles forward through the 15-preset bank.
  * `previoustrack`: Cycles backward through the preset bank.

##### 21.3 App Store Packaging & Merchandising
* **Pricing Strategy:** **$4.99 – $7.99** one-time purchase. Anti-subscription branding: *"Buy once, own forever. No accounts. No tracking. No ads. Infinite music."*
* **Primary App Store Categories:** Music, Health & Fitness / Meditation, Productivity.
* **Keyword Optimization:** Ambient generator, generative music, Brian Eno, modular synth, sleep soundscape, binaural beats, focus audio, tape loop, lo-fi generator, sound bath.
* **Storefront Screenshot Suite (5 Assets):**
  1. *The CRT Visualizer*: "Endless, non-repeating ambient soundscapes powered by coprime mathematics."
  2. *Stereo Binaural Drift*: "Psychoacoustic 3D spatial orbit engineered for headphones."
  3. *Acoustic & Lo-Fi Timbre*: "Maihar sitar, cycling tanpura, warm analog tape wow and flutter."
  4. *Pocket Field Recorder*: "Sample live room acoustics and weave them into infinite tape loops."
  5. *Tactile Keyboard & Presets*: "15 curated ambient worlds or play live with scale quantization."

---

#### 22. Step 2 Implementation Plan — Desktop Studio & Royalty-Free Stem Generator

##### 22.1 Native Desktop Container Architecture (Tauri)
* **Framework Selection:** Tauri 2.0 (Rust backend wrapping WebKit on macOS and WebView2 on Windows).
* **Performance Advantages over Electron:**
  * Application binary size: **~10 MB** (vs. Electron's ~150 MB).
  * Idle RAM usage: **< 35 MB** (vs. Electron's 200–400 MB).
  * Native OS window chrome with custom CRT titlebar, dark mode border accents, and zero audio clock throttling.
* **OS Desktop Integrations:**
  * **Global Hotkeys:** Space (Play/Pause), ⌘+R / Ctrl+R (Randomize All), ⌘+Z / Ctrl+Z (Undo), ⌘+S / Ctrl+S (Quick Save Patch).
  * **Native File Dialogs:** Standard macOS Finder and Windows Explorer save/load dialogs for patch `.json` archives.
  * **Drag-and-Drop Sample Loading:** Direct dragging of `.wav`, `.mp3`, or `.aif` files from Finder/Explorer onto Module 5 for instant lo-fi tape resynthesis.

##### 22.2 The Producer Stem & MIDI Engine
Slambient Desktop Studio is positioned as an indispensable creative companion for music producers, beatmakers, game composers, and media sound designers:
* **Multi-Track Stems In-Memory Exporter:**
  * Simultaneously records 5 discrete stereo channels in 24-bit 44.1 kHz lossless PCM:
    1. `01_master_mix.wav` (Full mastered output).
    2. `02_sub_drone.wav` (Sub-drone and tanpura bed).
    3. `03_drums.wav` (Tabla and lo-fi percussion groove).
    4. `04_chords_lead.wav` (Sitar, Rhodes, or analog pad voicings).
    5. `05_shimmer_arp.wav` (Bansuri, celesta, or glass arpeggio cascades).
* **Lightweight MIDI File Generation (`.mid`):**
  * Bundles standard Type 0 / Type 1 `.mid` files inside the stem ZIP archive:
    * `chords_progression.mid`: Generative chord root, voicing intervals, and note durations.
    * `arpeggio_pattern.mid`: Melody cascades with velocity and gate lengths.
  * Generated client-side using a zero-dependency in-memory MIDI builder (`buildMidiFile`), allowing beatmakers to drag generative chord progressions straight onto Serum, Omnisphere, or Kontakt in Ableton, Logic, or FL Studio.
* **Batch "Ambient Stem Pack Generator" Mode (`#btnBatchExport`):**
  * A single button: `[ ⚡ GENERATE 10 AMBIENT STEM PACKS ]`.
  * The engine systematically rotates through 10 distinct consonant seeds, renders 16 or 32 bars of each, tags the filenames with key and BPM (e.g. `Slambient_Dorian_D_60BPM_Chords.wav`), and bundles them into an organized producer sample library.
* **Commercial Licensing:**
  * Every copy includes an explicit, royalty-free commercial license granting 100% clearance for commercial music releases, video game soundtracks, film scoring, and streaming backgrounds.

##### 22.3 Direct-to-Consumer Distribution & Creator Funnel
* **Storefront Channels:** Gumroad, Lemon Squeezy, and itch.io at **$29.00 – $39.00**.
* **Zero Merchant Headaches:** Lemon Squeezy and Gumroad act as Merchant-of-Record (handling global VAT, sales tax, and automated license key delivery).
* **Viral Short-Form Content Playbook (TikTok / YouTube Shorts / IG Reels):**
  * Hook: *"Stop using the same 4-bar ambient samples as everyone else."*
  * Demo: Show Slambient generating a haunting Boards of Canada chord progression, hit `[ EXPORT STEMS ]`, drag the 5 WAVs straight into Ableton, drop a drum loop on top, and show the finished track in under 30 seconds.
  * Call to Action: Link in bio to Gumroad storefront ($29).

---

#### 23. Cross-Target Release Timeline & Financial Model

##### 23.1 3-Week Rapid Execution Schedule

```
WEEK 1: iOS & Mobile Polish (Capacitor)
├── Initialize Capacitor project structure and configure iOS target
├── Enable AVAudioSession background audio and Screen Wake Lock bridge
├── Bind @capacitor/haptics to rotary encoders and silicone keys
├── Hook up navigator.mediaSession lock screen controls & dynamic CRT art
└── Generate 1024x1024 icon suite and submit first build to Apple TestFlight

WEEK 2: Desktop Wrapper (Tauri) & Stem Production Engine
├── Initialize Tauri container for macOS (.dmg) and Windows (.msi)
├── Integrate zero-dependency in-memory MIDI file generator (.mid)
├── Build batch "10 Stem Pack Generator" automation workflow
├── Add native drag-and-drop sample import for Module 5
└── Configure native file system Save/Load dialogs for JSON patch banks

WEEK 3: Merchandising, Storefronts & Launch Campaign
├── Configure Lemon Squeezy / Gumroad storefront ($29 desktop license)
├── Author commercial royalty-free license agreement documentation
├── Capture App Store screenshot suite across iPhone, iPad, and macOS
├── Submit iOS App to Apple App Store review ($4.99 – $7.99)
└── Publish launch demo videos across TikTok, YouTube, and synth communities
```

##### 23.2 Unit Economics & Margin Structure
* **Step 1 (iOS App Store at $4.99):**
  * Apple Developer Program: $99/year.
  * Apple App Store Commission: 15% (under Small Business Program).
  * **Net Margin per Sale:** **$4.24 (85% net)**. Server cost: $0.00 (100% client-side synthesis).
* **Step 2 (Desktop Studio at $29.00):**
  * Lemon Squeezy / Gumroad Fee: ~5% + $0.50 per transaction.
  * **Net Margin per Sale:** **$27.05 (93% net)**. Server cost: $0.00 (static delivery via Cloudflare Pages).
* **Step 3 (FM-1 Hardware at $199.00):**
  * Hardware BOM & Assembly: ~$45.00 – $60.00 per unit in 250-unit batches.
  * Packaging & Logistics: ~$12.00 per unit.
  * **Gross Margin per Unit:** **$127.00 – $142.00 (64%–71% gross margin)**.

##### 23.3 Projected Revenue Milestones
* **Conservative Scenario:**
  * iOS: 1,200 units/yr × $4.99 = $5,988 gross ($5,090 net).
  * Desktop Studio: 450 units/yr × $29.00 = $13,050 gross ($12,136 net).
  * Total Year 1 Software Net: **~$17,226 USD**.
* **Moderate Growth Scenario (Viral Short-Form Traction):**
  * iOS: 5,000 units/yr × $6.99 = $34,950 gross ($29,707 net).
  * Desktop Studio: 2,500 units/yr × $39.00 = $97,500 gross ($90,675 net).
  * Total Year 1 Software Net: **~$120,382 USD**.
* **Hardware Expansion (FM-1 Batch Run of 500 units):**
  * 500 units × $199.00 = $99,500 gross revenue (~$65,000 gross profit).

---

### Part VI: Hardware-Inspired Pedal Board & Eurorack UI Architecture

#### 24. Executive Summary & Aesthetic Paradigm
This design and engineering architecture overhauls Slambient’s user interface and signal-chain management by replacing legacy console views with a hardware-inspired **Pedals Mode**. Driven by Eurorack proportions, modular HP sizing, and authentic tactile analog metaphors (braided patch cables, metallic jacks, textured faceplates, corner mounting screws), the redesign unifies macro rack navigation, fluid edge-to-edge orbital swiping, granular multi-delay algorithms, and responsive multi-topology filter controls into a cohesive, tactile ambient sound-design environment.

#### 25. Core Architectural Components

##### 25.1 The Eurorack-Inspired HP Sizing Grid
Modules snap strictly to a standardized horizontal grid using physical HP (Horizontal Pitch, where $1\text{ HP} = 5.08\text{ mm}$ / standardized CSS layout unit) to maintain authentic hardware proportions across mobile, tablet, and desktop viewports:
* **Grid Case Framework:**
  * **Mobile:** Case layouts lock to a fixed **32 HP** rack width per row, rendering as an ultra-clean 2-column structural grid without cramped horizontal squishing.
  * **Desktop / Large Screens:** Case layouts lock to a unified **64 HP** rack width per row.
* **Module Width Classifications:**
  * **Utility / LFOs:** **8 HP** width (compact utility strips, CV modulators, routing utilities).
  * **Standard Modules (Filter, Chorus, Master EQ):** **16 HP** width (primary controls, macro dials, metering).
  * **Complex Modules (Multi-Delay, Diffusion Reverb, Field Sampler):** **24 HP** width (deep multi-parameter algorithms, secondary drawers).
* **Surface Materials & Tactile Aesthetics:**
  * Faceplates: Anodized dark slate brushed metal (`#2B2D31`) with matte texture and subtle vertical grain.
  * Studio Chassis / Base: Deep low-resonance enclosure (`#1A1C23`).
  * Structural Rails: Machined cold-rolled steel rails (`#3F4248`) running horizontally above and below each rack row.
  * Hardware Accents: Hexagonal corner mounting screws (`#111215` with metallic chamfer highlights) positioned at standard Eurorack mounting ear intervals.

##### 25.2 Pedals Mode (Replacing Legacy Mobile Console View)
A macro-level physical rack dashboard giving the performer an immediate, zero-clutter overview of their active signal chain:
* **Visual Faceplate Elements:**
  * Each module renders as a physical Eurorack panel displaying an uppercase silkscreened module name in crisp monospace typography.
  * Dedicated HP badge (e.g. `[16 HP]`, `[24 HP]`) in subtle etched dark zinc.
  * Hardware bypass toggle switch (`[Byp]`) with an active colored LED status bezel.
  * Micro-jack anchor points (6px metallic circular rings with dark interior bore) positioned for audio inputs, audio outputs, and CV inputs.
* **Braided Bezier Patch Lines:**
  * Thin, semi-transparent neon teal (`#00E5FF`, `rgba(0, 229, 255, 0.65)`) dynamic SVG cubic bezier curves simulate weighted physical patch cables hanging with natural gravitational slack.
  * Real-time audio routing dynamically drawn from module output jacks to the downstream module's input jacks.
  * Secondary amber (`#FFB000`) and violet (`#A855F7`) patch lines map active CV/LFO modulation assignments and sidechain ducking triggers.
  * Dynamic visual feedback: Patch lines pulse and glow subtly in real-time correlation with audio bus amplitudes and LFO rate cycles.
* **Direct Tactile Interactions:**
  * **Tap to Focus:** Tapping any module card triggers a fluid spring animation zooming directly into its deep **Orbital View**.
  * **Long-Press & Drag Reordering:** Long-pressing a module lifts its chassis off the mounting rails with an elevated drop-shadow; dragging left/right slides adjacent modules smoothly along the Eurorack rails, instantly executing `rewireDspChain()` live without audio dropouts or clicks.

##### 25.3 Orbital View & Edge-to-Edge Gesture Navigation
When focused on a single module, the interface smoothly expands its full faceplate controls while preserving continuous workflow continuity:
* **Horizontal Edge-to-Edge Swiping:**
  * Swiping left or right edge-to-edge across the screen instantly slides the current module out of frame and brings the adjacent module in the DSP signal chain into focus.
  * Eliminates tedious menu diving, allowing the musician to dial in Delay, swipe to Reverb, swipe to Filter, and swipe to Master EQ in one continuous gestural sweep.
* **Fluid Exit Transitions:**
  * A pinch-in gesture or tapping the header back arrow (`← RACK`) smoothly collapses the single-module view back out to the macro Pedals Mode overview.

---

#### 26. Deep-Dive Audio Parameter Modules

##### 26.1 The Filter Module & Intensity Scale
Engineered specifically to eliminate flat, sterile filter sweeps in generative ambient landscapes:
* **Switchable Analog-Emulated Topologies:**
  1. *Ladder 24dB:* Classic transistor ladder lowpass with rich saturated warmth and steep cutoff slope.
  2. *State-Variable 12dB (SEM):* Organic 2-pole multi-mode filter with smooth, singing resonance.
  3. *Formant / Vocal:* Dual-peak vowel cavity filter creating acoustic bansuri and vocal throat textures.
  4. *Comb Filter:* Resonant short-delay feedback comb creating physical string and resonator halos.
* **Primary Faceplate Controls:**
  * Chunky knurled rotary knobs for **Cutoff** ($20\text{ Hz} – 20\text{ kHz}$ with logarithmic response) and **Resonance** (with calibrated self-oscillation headroom and automatic soft-limiting).
* **Filter Intensity Scale:**
  * A prominent horizontal slider positioned across the main faceplate acting as a master macro-scaling control for overall effect depth and modulation extremity.
  * **Bipolar Polarity Toggle:** Switches between normal sweeps (positive modulation) and inverted sweeps (negative modulation envelope dipping).
  * **Automatic Low-End Makeup Gain:** Dynamic psychoacoustic compensation circuit that boosts the fundamental low-end as resonance increases, preventing the classic volume drop-out inherent in resonant ladders.
* **Collapsible Parameter Drawers:**
  * Expandable accordion drawer housing secondary controls: Envelope Follower Sensitivity (Attack/Release times), Envelope-to-Cutoff depth, and internal modulation LFO (Rate, Depth, Triangle/Sine/Random S&H Shape).

##### 26.2 Modular Multi-Delay Engine Architecture
A multi-engine ambient delay processor offering four distinct sonic character profiles:
* **Engine Selector:**
  * Instant pill-bar selector toggling between four discrete DSP engines:
    1. **Tape:** Analog tape saturation, wow/flutter capstan drift, and high-frequency tape head loss.
    2. **BBD (Bucket Brigade Device):** Dark compander saturation, warm clock noise, and analog bucket-loss grit.
    3. **Digital:** Pristine, crystal-clear 32-bit floating-point high-fidelity repeats with zero coloration.
    4. **Ping-Pong:** Stereo alternating spatial bounces with psychoacoustic binaural Haas micro-delays.
* **Primary Faceplate Controls:**
  * Oversized macro rotary knobs for **Time** (tempo-synced divisions $1/16$ to $2/1$ or free $20\text{ ms} – 2000\text{ ms}$) and **Feedback** (calibrated up to 48% safety ceiling or continuous dub hold).
* **Engine-Specific Dynamic Drawers:**
  * Expanding accordion sub-drawers dynamically adapt parameters based on the active engine:
    * *Tape Mode:* Exposes Tape Age, Head Saturation Drive, and Motor Inertia / Flutter Speed.
    * *BBD Mode:* Exposes Clock Noise floor, Color Darkness, and Bucket Stage count ($1024 / 4096$).
    * *Digital Mode:* Exposes Bitcrush Resolution ($8\text{-bit} – 24\text{-bit}$) and Sample-Rate Reducer.
    * *Ping-Pong Mode:* Exposes Stereo Width ($0\% – 200\%$) and Cross-Feedback Diffusion.
  * Includes internal LFO delay modulation and dynamic input ducking (automatically ducks delay repeats during active lead phrases).

---

#### 27. Implementation Phasing & Roadmap

##### UI Fixes & Visual Polish (COMPLETED)
* [x] **Orbital Modal Opacity Bleed Fix:** Prevent top UI header, borders, and backdrop from going transparent when swiping or switching between modules in Orbital Mode by scoping opacity transitions (`.swiping-left`, `.swiping-right`) to `#orbitalModalBody` rather than `#orbitalSidePanel`.
* [x] **Center-Justify Orbital Module Title & Nav Arrows:** Center-justify `#orbitalModalTitle` and navigation cycle arrows (`#btnOrbitalPrev`, `#btnOrbitalNext`) across desktop and mobile, ensuring balanced layout between `[PEDALS]` back button and `[ACTIONS] [✕]` controls.
* [x] **Desktop Header Bar Eurorack Symmetry & Unified Bank Module:** Restructure the desktop top bar into a balanced 2-row Eurorack chassis layout. Row 1 houses Transport & Audio on the left and Harmony & Master Clock on the right; Row 2 houses the Telemetry HUD on the left and Workspace Utilities & Generative Engine on the right. Nest the Patch Bank I/O inside `.preset-group` as a unified module immediately adjacent to the preset grid with `SAVE` and `LOAD` stacked vertically, eliminating blank gaps, disassociated line-wrapping, and text collisions.
* [x] **Mobile Transport 2-Row Layout & Auto-Fill Elements:** Symmetrically align mobile Section 1 into two 12-column rows: Row 1 splits START (cols 1–6) and RECORD + Format (cols 7–12); Row 2 splits SAMPLE (cols 1–9) and MIDI (cols 10–12). Apply `flex: 1 1 0` to `MIC` and `DROP` buttons to auto-fill the sample block with zero dead space, auto-contracting when a sample is loaded to give prominence to the waveform display.
* [x] **View Switcher 'Rack View' Re-labeling:** Rename the view mode toggle button to `Rack View` (`Modular Rack & Signal Chain View`) across UI buttons and telemetry.
* [x] **Sample Button Sizing & Format Dropdown Centering:** Standardized `MIC` and `DROP` button heights and SVG icons to 15px matching transport standards, centered record format dropdown trigger and menu options with zero text clipping.
* [x] **Birds-Eye FX Chain Module (Module 6 in Rack View):** Condensed the DSP insert chain into a single `.strip-channel` module matching instrument widths, displaying compact rectangular cards for Filter, Delay, Space, and Master Out with slot labels, power/bypass toggles (`ON` / `BYP`), live reordering (`▲` / `▼`), and modular inspector launch triggers (`EDIT ↗`).
* [x] **Universal Modular Inspector Overlay:** Decoupled `#orbitalSidePanel` and `#orbitalModalBackdrop` from `#orbitalArenaWrapper` into a fixed top-level overlay with blurred backdrop. Inspecting any module or pedal from Rack View opens its controls directly over Rack View without switching to Orbital View; closing returns the user directly to Rack View.
* [x] **Dedicated Field Recorder Module & 2-Row Lower Deck Grid:** Extracted Pocket Field Recorder from `NOISE` into independent 6th instrument channel strip (`6. FIELD`, `--color-field: #2bcbba`) with live waveform canvas, 4-button action bar, Weave Mode selector, dedicated FX send slider (`knobFieldFx`), master volume, and independent mute/solo/power toggles. Organized lower deck into a 2-row grid (`SUB / CHORDS / NOISE` atop `DRUMS / ARP / FIELD`) with full-height studio DSP FX chain on the right, unifying all instrument widths and heights. Added `field` orb (#6) to Orbital View and renumbered subsequent DSP nodes (Filter: 7, Delay: 8, Space: 9, Out: 10).

##### Phase 0: Mobile Microphone & Pocket Field Recorder Resiliency (COMPLETED)
* [x] **Pointer Capture & Touch Physics:** Implement `setPointerCapture(e.pointerId)` on `pointerdown` for all `[data-field-hold]` elements, combined with dedicated `touchstart`/`touchend` hooks to prevent iOS Safari `pointercancel` micro-jitter aborts.
* [x] **AudioContext Synchronous Gesture Pre-Warm:** Pre-warm and resume `captureCtx` synchronously within user touch dispatch before entering asynchronous `getUserMedia()` queries to prevent WebKit gesture token expiration.
* [x] **MediaRecorder Modernization & ScriptProcessor Fallback:** Wrap capture in native `MediaRecorder` (`audio/webm` or `audio/mp4` / AAC/Opus) with `AudioContext.decodeAudioData`, completely bypassing iOS 17+ `createScriptProcessor` silent thread throttling while retaining `Float32Array` fallbacks for older browsers.
* [x] **AudioSession Type Guarding:** Soften `navigator.audioSession.type = "play-and-record"` toggling with automated output restore to prevent mobile Safari background audio muting.
* [x] **High-Visibility Status & Denied Feedback:** Explicit visual state machine on `[data-field-hold]` (`HOLD TO REC`, `REC 0.0s`, `TAP TO STOP`, `MIC PERMISSION BLOCKED`) with user-friendly toast guidance.

##### Phase 1: Grid Foundation & Modular Rack Layout (COMPLETED)
* [x] Implement symmetrical 6-column grid across desktop (6 cols), tablet (2 cols), and landscape mobile (3 cols) with 1-column portrait mobile fallback.
* [x] Build the Birds-Eye FX Chain module to replace unwieldy pedal decks with an instrument-sized rack card.
* [ ] Code the metallic jack anchor points and dynamic bezier-curve SVG "patch cables" for audio and CV routing.

##### Phase 2: Orbital View & Gesture Navigation (COMPLETED)
* [x] Implement the tap-to-focus transition from macro overview to single-module Orbital View.
* [x] Program horizontal edge-to-edge swipe gesture listeners to cycle adjacent modules seamlessly.
* [x] Build the accordion drawer component for collapsible sub-parameters.

##### Phase 3: DSP & Parameter Integration (Filter & Multi-Delay)
* [x] **Multi-Topology Filter DSP Engine (`SlambientFilterEngine` in `dsp-engines.js`):** 4 switchable topologies (Ladder 24dB with saturation, State-Variable 12dB SEM, Formant vowel cavity, Comb resonator), Filter Intensity Scale macro scaling, Bipolar Polarity (+1/-1), and dynamic low-end makeup gain.
* [x] **Modular Multi-Delay DSP Engine (`SlambientMultiDelayEngine` in `dsp-engines.js`):** 4 discrete delay algorithms (Tape with capstan wow/flutter drift, BBD with clock noise grit, Digital 32-bit pristine with bitcrush, Ping-Pong stereo alternating spatial Haas bounce), dynamic lead voice ducking, and musical tempo sync.
* [ ] Connect internal modulation sources (LFOs/Envelope Followers) to drive real-time parameter changes with pulsing visual feedback on patch lines.




