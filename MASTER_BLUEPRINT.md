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
* **Part III (Sections 13–14):** App Development, PWA Shell & Cross-Platform Packaging: standalone PWA wrapper (`manifest.json`, icon suite), offline-first service worker (`sw.js`), mobile viewport adaptation (safe-area insets, touch physics), Screen Wake Lock integration, WebKit/Safari Web Audio memory leak hardening, and native container deployment paths (Capacitor for iOS/Android, Tauri/Electron for Desktop).

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

#### 8. Dual Module Workspace: Orbital View & Console Rack

* **Two-Way View Switcher:** Orbital View (`btnViewOrbital`) and Console Rack (`btnViewConsole`).
* **Orbital Constellation View (`orbitalArenaWrapper`):**
  * 9 audio-buoyant planetary orbs over drifting background starfield with collision physics and boundary dampening.
  * Click-and-drag with momentum fling; debounced stationary click (< 5px movement) opens the slide-out Orbital Side Panel (`orbitalSidePanel`).
  * Live signal chain lines (`getOrbitalConnectionChain`) reflecting real-time DSP insert order.
  * Orbital Feel sliders (Float Speed 0–250%, Orb Size 50–200%, ⟲ RE-SEED, and PANIC).
* **Console Rack:** Five instrument channel strips (Modules 1–5), three reorderable pedals (Modules 6–8), and Master EQ & Out (Module 9).
* **Shared Controls Across Views:** The console and the orbital side panel reuse the same DOM elements, guaranteeing perfect two-way parameter coherence.

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
* **Phase 12 — Production Hosting, PWA, Audio Stability & Privacy (Done):** PWA standalone manifest (`manifest.json` / `manifest.webmanifest`), offline service worker (`sw.js`), Screen Wake Lock API integration, Cloudflare Pages edge delivery with security headers, and complete Safari Web Audio memory leak graph teardown.

#### 12. Implementation Guardrails & Known Issues

* **Guard Every DOM Lookup:** A single unguarded `getElementById(...).textContent` write to a removed label id crashes the entire top-level script on load. Always guard DOM element access before writing.
* **Downbeat Entry:** Preset changes, ⟲ ALL, and new seeds never force an immediate chord hit; new material enters on the next natural downbeat so it does not clash with outgoing delay and reverb tails.
* **WebKit / Safari Web Audio Graph Teardown (CRITICAL):** In Safari / WebKit, dynamic `AudioNode` instances (oscillators, gain nodes, biquad filters) are **not** garbage-collected when allowed to go out of JavaScript scope if they remain connected to any running upstream or downstream node in the audio context graph. Voice playback functions (`playSynthVoice`, `playArpNote`, `playDayan`, `playBayan`, `playSnare`, `playHiHat`, `triggerSympatheticStrings`) must use variadic `disconnectOnEnded(...)` to disconnect every oscillator, modulator, filter, and gain node upon voice envelope completion. Audio clock fallback oscillators (`scheduleAudioClockFallback`) must explicitly call `.disconnect()` when stopped. Dynamic aux sends in Module 5 sampler (`route()`) must be tracked and disconnected before creating replacement routing.
* **Live Field Recorder Memory Safety Cap:** Continuous live mic recording must enforce a hard 45-minute safety cap (~238 MB Float32Array mono at 44.1 kHz) to prevent unbounded memory allocation and mobile browser tab crashes.
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
