# Slambient — Hybrid Generative Ambient Workstation

> *"An evolving, self-generative soundscape machine for meditative focus, cosmic drift, and acoustic-electronic fusion."*

Slambient is a dependency-free, zero-latency browser workstation and Progressive Web App (PWA) inspired by Brian Eno's coprime loop ecosystems, Boards of Canada's warm tape imperfections, Hiroshi Yoshimura's environmental minimalism, Four Tet's organic percussion, and the classical Maihar gharana raga tradition.

It pairs a 10-module Web Audio synthesizer and physical modeling engine with a 4-layer vector CRT visualizer, real-time AudioWorklet sample-accurate clock, playable MIDI keyboard with scale quantization, drag-and-drop DSP pedalboard, and multi-track stem recording.

---

## Project Layout (decoupled, still zero-build)

`index.html` used to hold everything (about 24,000 lines). It now holds only the semantic HTML DOM markup and minimal glue code (about 4,200 lines, >82% reduction), with all functional domains cleanly decoupled into native browser ES scripts. The decoupling was done by Gemini agents in Antigravity, completing Phase 7 from `MASTER_BLUEPRINT.md`. There is no bundler, npm or build step; edit a file, reload, done.

| Folder / file | What lives there |
|---|---|
| `css/slambient.css`, `css/field-recorder.css`, `css/mobile-app.css` | All styling (Eurorack themes, mobile app layout, module cards) |
| `js/audio/` | DSP voices (drone, tanpura, chords, arp), clock sequencer, drums, noise, FX rack, recorders |
| `js/midi/` | Web MIDI input/output, 4-channel DAW output, MIDI file recorder |
| `js/theory/scales.js` | Scales and the 43 modal chord voicings |
| `js/ui/` | Presets, keyboard, pedalboard, randomizer, transport, touch-mobile, macro grid, workspace |
| `js/visualizers/` | CRT scope and Invaders, orbital orbs, chord wheel |
| `clock-processor.js`, `dsp-engines.js` | Sample-accurate clock worklet and multi-delay/filter DSP engines |
| `sw.js`, `manifest.*` | Offline PWA (bump the cache version in `sw.js` when assets change) |
| `scripts/qa-audit.js`, `scripts/device-audit.js` | Automated QA syntax, unit test suite, and headless Chrome device lab |

Docs: `GEMINI_SYNC.md` (dated change log and handoff notes, newest at the bottom), `MASTER_BLUEPRINT.md` (design, roadmap and phase status), `BRAND_GUIDELINES.md` (visual rules).

## Status

* Roadmap Phases 1–10 are largely completed (core engine, console rack, 12-node orbital view, presets, field recorder, decoupled mobile architecture, Phase 8 modular studio workspace with drag-and-drop layout, edit mode, desktop split view, and 10-pedal studio FX rack).
* Modules are named SUB, DRUMS, CHORDS, ARP, NOISE, FIELD (instruments), plus consolidated FX units (Drive & Filter, Mod Cluster, Analog Delay, Digital Delay, Space Reverb) and OUT (master output stage).
* Phase 11 visualizers and optimization: Tanpura string resonance, interactive chord wheel, CRT Invaders arcade deck, and fractal visualizer CPU/memory optimization shipped in `slambient-v40`.
* Still open / roadmap items: Tap tempo EMA recalibration, 4-channel MIDI Logic verification, real-device audio session testing on iOS, and Phase 11 client-side video synthesis recording.

---

## Quick Start

### Play Online / Local
You can run Slambient directly in any modern desktop or mobile browser supporting Web Audio and Web MIDI:

```bash
cd ~/Documents/Development/slambient_dev
python3 -m http.server 8000
```
Open **`http://localhost:8000`** in Chrome, Safari, or Edge.

### Install as an App (PWA)
Slambient is a full Progressive Web App:
- **Desktop (Chrome/Edge):** Click the **Install** button in the top header (or the install icon in the address bar) to launch full-screen without browser chrome.
- **iOS (Safari):** Tap **Share** ➔ **Add to Home Screen** for a full-bleed native experience with Dynamic Island and notch safe-area handling.
- **Android (Chrome):** Tap menu ➔ **Install app**.
- **Offline Capable:** Core assets, sample-accurate clock worklets, and web fonts are cached automatically via Service Worker (`sw.js`).
- **Screen Wake Lock:** Keeps your screen awake and prevents mobile audio thread throttling during generative sessions.

---

## Core Architecture & Engine Concepts

### 1. The Brian Eno Coprime Clock Ecosystem
Unlike conventional loopers or DAWs that loop on 4, 8, or 16 bars, Slambient runs multiple generative layers on coprime prime-number cycle lengths:
* **Layer 1 (Percussion & Drums):** 7-step loop
* **Layer 3 (Shimmer Arp):** 11-step loop
* **Layer 2 (Chords & Lead Phrasing):** 13-step loop
* **Layer 4 (Sub & Tanpura Drone):** 17-step loop
* **Macro Rotations & Weather Mutations:** 19-step and 23-step cycles

Because these step counts share no common divisors, their musical phasing continuously evolves over hours without ever repeating identically. Progression transitions bias 82% toward consonant scale anchors with passing tension constrained to 10%.

### 2. AudioWorklet Sample-Accurate Timing (`clock-processor.js`)
The master clock is driven directly by an `AudioWorkletNode` in the browser's high-priority audio rendering thread. It counts raw sample frames rather than using JavaScript UI-thread timers (`setInterval`), ensuring zero tempo jitter even when tabs are backgrounded or rendering heavy 60 FPS CRT animations.

### 3. LIVE vs. AUTO Keyboard Takeover
* **AUTO:** Slambient autonomously meanders through chord voicings, arpeggios, and rhythmic variations based on the current Seed and Scale.
* **LIVE Takeover:** Touch or play keys on the onscreen MIDI keyboard, computer QWERTY keyboard, or an external Web MIDI controller. Slambient immediately hands over control to your live playing.
* **Seamless Downbeat Hand-off:** When you release all keys, Slambient automatically resumes generative playback on the next measure downbeat, anchoring subsequent harmonies to your last played root and chord quality.

---

## The 9 Sound Modules

Slambient's sound architecture is divided into five instrument channel strips, three reorderable DSP insert pedals, and a master output stage:

```
[1: Sub & Drone] ──┐
[2: Drums]       ──┼──➔ BUS PRE ──➔ [6: Pedal 1] ──➔ [7: Pedal 2] ──➔ [8: Pedal 3] ──➔ [9: Master EQ & Out] ──➔ Out
[3: Chords]      ──┤                  (Filter)         (Delay)          (Reverb)
[4: Shimmer Arp] ──┤
[5: Atmosphere]  ──┘
```

### Module 1 — Sub & Tanpura Drone (`#00e5ff` Cyan)
* **Sub Oscillator:** Pure analog sinusoidal sub-bass with octave selection (D0 18.3 Hz, D1 36.7 Hz, D2 73.4 Hz), warmth cutoff filtering, and gentle pitch wander.
* **Didgeridoo Formant Synthesis:** 24-harmonic periodic wave excitation coupled with dual detuned buzz oscillators, 3 formant biquad filters (150 Hz, 440 Hz, 1100 Hz), and breath noise.
* **4-String Acoustic Tanpura:** Physical simulation of an Indian tanpura with Pa-Sa-Sa-Sa, Ma-Sa-Sa-Sa, or Ni-Sa-Sa-Sa sruti tuning, sympathetic resonance, and authentic cotton-thread *jawari* bridge buzzing harmonics.

### Module 2 — Organic Drums & Tabla (`#ff3838` Crimson)
* **9 Groove Styles:** Four Tet Woodblock & Glitch, Classical Indian Tabla, Industrial 909, Fat Breakbeat Pocket, Four-on-the-Floor Club Drive, Sub Heartbeat & Rim, Polyrhythmic Tape Dub (7/11), Vinyl Clicks & Dust, and Muted.
* **Tabla Articulation Engine:** Synthesizes classical *bols* (Ge, Na, Tin, Ti, Re, Ki, Dha) with palm-modulated *Bayan* bass pitch scoops and high-register *Dayan* paradiddle fills.
* **Controls:** Evolution Chance, Kick Punch & Ducking, Woodblock Density, FX Send, and Fill trigger.

### Module 3 — Chords & Voicings (`#fed330` Yellow)
* **11 Instrument Timbres:** Warm Analog Pad, Maihar Sitar Strings, Pure Mineral Glass, Chamber Woods & Flute, Celestial Flute Organ, Vibraphone & Celesta, Rhodes Electric Piano, DX7 FM Keys, Lofi Wobbly Tape Keys, Solina Digital Strings, and Juno Saw Synth.
* **Maihar Sitar Physical Modeling:** Parabolic jawari waveshaping curve, dual gourd acoustic body resonances (920 Hz and 2750 Hz), 3-string *taraf* sympathetic ringing, and authentic *meend* pitch bends.
* **12 Voicing Modes:** Auto-Meander drift plus fixed chord voicings: `WARM_9TH`, `DREAM_11TH`, `FLOATING_69`, `SUS2_SPREAD`, `LYDIAN_ETHER`, `FIFTH_STACK`, `QUARTAL_STACK`, `PRISM_MAJ9`, `OCTAVE_BLOOM`, `VELVET_ADD9`, `DEEP_MINOR11`, and `GHOST_DYAD`.

### Module 4 — Shimmer Arpeggio (`#7d5fff` Violet)
* **6 Patterns:** Granular Shimmer, Ascending Run, Pendulum, Raga Taan (phrased raga runs with natural breathing pauses), 11-Step Coprime Burst, and Disabled.
* **9 Timbres:** Glass FM Chime, Bansuri Flute, Sine Crystal, Music Box, Concert Harp, Water Droplet, Pizzicato String, Kalimba, and Warm Analog Pulse.
* **Additive Live Arpeggiator:** When holding live notes, adding or releasing keys adapts the arpeggio pool dynamically without restarting the sequence timer.

### Module 5 — Atmosphere, Noise & Field Recorder (`#1dd1a1` Teal)
* **6 Environmental Profiles:** Rain, Thunder, Tape Noise (White Tape), Bubbling Brook, Crickets, and Alpine Wind across 5 trigger modes (Organic Gusts, Continuous Bed, Sparse Events, Rhythmic Pulse, Storm Swell).
* **Pocket Field Recorder (`[ 🎙 MIC / 📼 DROP ]`):**
  * **Hold MIC:** Capture live soundscapes directly from your computer or phone microphone via `getUserMedia()`. Tapping records a quick 5-second take; holding records continuously.
  * **DROP:** Drag and drop any `.wav`, `.mp3`, or audio file directly onto the header badge.
  * Auto-normalizes, bands-passes, and weaves your recording into Module 5's ambient playback engine.

---

## Reorderable DSP Pedalboard (Modules 6–8)

The effects chain sits between instrument summing and the master output. **Drag any pedal handle (`⠿`) or use the `◀` / `▶` arrows to reorder them live:**

1. **Filter & Envelope Pedal (`#2ed573` Green):** 4-pole cascaded lowpass filter (`60 Hz – 16 kHz` exponential cutoff) with resonance Q compensation, click-free dynamic envelope follower, and slow LFO sweep.
2. **Analog Delay Pedal (`#ff793f` Orange):** BBD bucket-brigade style dark delay with tempo sync (1/16 through dotted whole notes), tape wow/flutter, and a safety-capped 48% feedback ceiling.
3. **Reverb & Chorus Pedal (`#ff5fc4` Pink):** Plate, Hall, and Cathedral reverb algorithms paired with a 3-voice modulated chorus network (Classic 2-voice, Ensemble 3-voice, and Pure Vibrato).

---

## Dual Workspaces: Orbital Constellation vs. Console Rack

Toggle between two distinct workflow perspectives with the view switcher:

* **🪐 Orbital View (`ORBITAL`):**
  * 9 floating planetary orbs representing each engine module, drifting through a twinkling starfield.
  * True collision physics and soft bounce glows.
  * Click and fling orbs across the screen with momentum.
  * Click any stationary orb (< 5px drag) to open the slide-out **Module Inspector Drawer**.
* **🎛️ Console Rack (`CONSOLE`):**
  * Complete studio channel strip layout with tactile sliders, rotary controls, mute/solo buttons, and direct pedalboard reordering.
  * Live parameter synchronization between Orbital and Console views.

---

## Presets & User Banks (U1–U6)

### 15 Signature Factory Presets
* **Preset 0 — Nostalgic Drift:** Boards of Canada inspired warm analog pad with music box arp and subtle tape wow.
* **Preset 1 — Four Tet Organic:** Complex polyrhythmic woodblocks, kalimba arp, and lofi keys.
* **Preset 2 — Shimmer Cascade:** Solina digital strings, high-register glass FM chime, and cathedral reverb.
* **Preset 3 — Hauntological Tape:** Dark Basinski-style tape decay, chamber woods, and fluttering analog delay.
* **Preset 4 — Velvet Horizon:** Deep ambient major 9th pads and celestial flute organ.
* **Preset 5 — Pale Bloom:** Minimalist Japanese environmental soundscape in Major Pentatonic.
* **Preset 6 — Green / Yoshimura:** Hirajoshi scale, mineral glass bells, and gentle water droplets.
* **Preset 7 — Khan Lineage:** Classical Indian 7/4 Rupak Tala, Maihar sitar with meend, cycling Tanpura drone, and Bansuri flute.
* **Preset 8 — After Hours Deep:** 112 BPM Four-on-the-Floor kick, Rhodes piano, and tempo-synced delay.
* **Preset 9 — Airports (Eno):** Generative Lydian glass pads and long cathedral reverb tails.
* **Preset 10 — Twin Peaks:** Badalamenti style brooding sub, slow vibraphone, and dark tremolo.
* **Preset 11 — Aphex Twin:** 7/8 Hirajoshi breakbeat glitch pocket, resonant filter sweeps, and FM bells.
* **Preset 12 — Tangerine Dream:** 96 BPM Berlin-school analog pulse sequences in Phrygian scale.
* **Preset 13 — William Basinski:** 3/4 Lydian tape loop decay with saturated lowpass damping.
* **Preset 14 — Lo-Fi Chillhop:** Relaxed 76 BPM swing drums, Rhodes piano, and rain gusts.

### User Patch Bank (`U1` to `U6`)
* **Store Patches:** Click any empty slot (`U1`–`U6`) or click **`+ STORE`** to name and save your current soundscape.
* **Quick Recall:** Click any filled slot to load immediately.
* **Overwrite:** `Shift + Click` to overwrite a slot with current settings.
* **Context Menu:** `Right-Click` (or long-press on mobile) to Rename, Overwrite, or Clear a user slot.
* **Persistence:** User patches are stored automatically in browser `localStorage`.
* **JSON Backup:** Use **SAVE / LOAD** in the BANK cluster to export/import patches as `.json` files.

---

## Web MIDI Hardware Control

Connect any USB or 3.5mm MIDI controller. Click the **`MIDI`** button in the header toolbar to scan and monitor connected gear.

### Continuous Controller (CC) Mappings
| MIDI CC | Destination | Description |
|---|---|---|
| **CC 74** | **Master Filter Cutoff** | Adjusts cutoff frequency (`60 Hz – 16 kHz`) |
| **CC 71** | **Master Filter Resonance** | Adjusts filter Q (`0.5 – 8.0`) |
| **CC 1** | **Weather / Diffusion** | Controls global diffusion, space, and room tone |
| **CC 7** | **Master Volume** | Master bus output level |
| **CC 64** | **Sustain Pedal** | Sustains held notes; releases on pedal up |
| **Pitch Bend** | **Synth Pitch Bend** | 14-bit continuous pitch glide (`±200 cents` / `±2 semitones`) |

### MIDI Output to a DAW (e.g. Logic)
Choose **Connect MIDI Device…** in the Hardware MIDI Output select (the browser only asks for MIDI permission then). Slambient sends four channels: **1 Sub, 2 Chords, 3 Arp, 4 Drums** (General MIDI drum map), with All Notes Off on pause. On a Mac, enable the IAC Driver in Audio MIDI Setup and create one track per channel in Logic.

Incoming MIDI notes play the Chords or Arp engine directly based on the Keyboard panel's `TARGET` setting.

---

## Audio Recording & Multi-Track Stems Export

The header transport cluster includes a dedicated format selector (`#selRecordFormat`):

1. **`MP3 (320 kbps)`:** Real-time client-side MP3 encoding via `lamejs`. Great for instant sharing.
2. **`WAV (Lossless 16-bit PCM)`:** Studio-grade uncompressed stereo audio file.
3. **`STEMS (.ZIP Archive)`:** Simultaneously records **5 isolated stereo tracks** via dedicated audio bus taps:
   * `01_master_mix.wav` (Master output)
   * `02_sub_drone.wav` (Sub-drone and acoustic Tanpura)
   * `03_drums.wav` (Tabla, organic percussion, kicks, and clicks)
   * `04_chords_lead.wav` (Chords, pads, and Sitar physical model)
   * `05_shimmer_arp.wav` (Generative shimmer arpeggio)
   * `patch.json` (Exact serialized engine parameter state)
   * `session_info.txt` (BPM, meter, scale, key, and seed notes)
   * All tracks are packaged client-side into a `.zip` file with zero third-party cloud dependencies.

---

## Keyboard Shortcuts & Quick Reference

Press **`?`** anywhere in the app to toggle the in-app Field Guide and Shortcuts modal:

| Action | Shortcut |
|---|---|
| **Play / Pause Engine** | `Space` or `Enter` |
| **Undo Last Preset / Randomize** | `Ctrl + Z` or `Cmd + Z` |
| **Field Manual & Shortcuts** | `?` |
| **Close Overlay / Exit Fullscreen** | `Esc` |
| **Play White Keys (C3–C5)** | `A`, `S`, `D`, `F`, `G`, `H`, `J`, `K`, `L`, `;`, `'` |
| **Play Black Keys** | `W`, `E`, `T`, `Y`, `U`, `O`, `P` |
| **CRT Visualizer Fullscreen** | Double-Click Visualizer Canvas |
| **Play "Void Raiders" Easter Egg** | Click Visualizer ➔ `Space` to start/fire, `←` / `→` to move |
| **Cycle Phosphor Color Themes** | Click the 3D Eno CRT Head in the header bar |

---

## License

Built with pure HTML5, CSS3, and standard Web Audio API / AudioWorklet primitives. No external build steps, frameworks, or dependencies required.
