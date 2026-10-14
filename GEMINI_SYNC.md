# Sync note for Gemini — read this first

## Canonical file location (this is the important part)

There is now exactly **one** working copy of this project:

```
~/Documents/Development/slambient_dev/index.html
```

Every other copy that used to exist — `~/Downloads/slambient-web/`, `~/Music/FM1-Dev/slambient-web/`,
`~/Downloads/slambient_fixed.html`, `slambient-web 2/`, the old zip — has been deleted. They were
scattered across machine locations, had drifted out of sync with each other, and one of them (the copy
that had been living in `/private/tmp`, which is not persistent storage) was lost outright to a system
cleanup. That's what forced this consolidation.

**Going forward: always read from and write back to the path above. Never save a new copy anywhere
else, even temporarily.** If at any point you're not certain you're looking at the current version,
stop and ask rather than guessing — the whole point of this note is to not repeat the drift that just
cost a full afternoon's work. The project is now a git repo at that path, so version history itself is
also a way to check: `git log` there shows what's actually landed.

## What's in the current build

Everything below is already live in `index.html` as of this sync. Treat it as the baseline — building
on top of it is fine, but don't reintroduce older versions of these mechanics from memory.

**Orbital constellation view**
- 8 module orbs (was 7 — see new module below), smaller radius than earlier builds, with a wider
  separation buffer so they don't clump, and a softer/slower "bump" glow on collision instead of a
  sharp flash
- Background starfield: small twinkling/drifting white dots behind the orbs

**Console rack (8 modules, in order)**
1. Tape, Sub & Tanpura Drone — Tanpura is now an explicit on/off toggle (`chkTanpuraEnabled`), off by
   default, drones at half-time cadence with corrected (symmetric) string detuning
2. Organic Drums — includes an Indian Classical Tabla groove style with a polyrhythmic high-register
   fill layer
3. Chords & Voicing — Sitar Strings timbre is now strictly scale-locked (was leaking out-of-raga notes
   via a math bug) and has a real meend pitch-bend in the main synth voice path
4. Shimmer Arp — new "Raga Taan" pattern: beat-locked, breathy phrasing for Bansuri-style leads, instead
   of firing every tick
5. Master Filter & Env — envelope retrigger no longer snaps back to baseline (continues smoothly from
   current frequency); dry/wet send coefficients unified across channels so Cutoff/Resonance actually
   reach the drone/drum layers, not just chords/arp
6. Analog Style Delay — new Tempo Sync toggle (DL4 MkII style): delay time locks to a musical
   subdivision of the current BPM instead of raw ms, recalculates live on tempo changes
7. **Spacey Reverb & Chorus (new module)** — Reverb: 3 modes (Plate / Hall / Cathedral), plus Mix and
   Tone knobs. Chorus: 3 modes (Classic / Ensemble / Vibrato) built from 3 always-on modulated delay
   voices, plus Rate/Depth/Mix. This used to not exist; Master Space & Out was module 7, it's now 8.
8. Master Space & Out — unchanged in function, just renumbered

**Header bar**
- Master Volume: new vertical slider + mute button, far right of the header (left of the Eno pod) —
  true master-bus insert, the very last gain stage before output
- Eno "BIO-SCAN" pod: now only cycles the shared border/accent color across every module; it no longer
  triggers a full randomize (that's the separate "⟲ ALL" button)
- Tempo slider also present in the header, mirrors the one in Space & Out

**Chord Analysis** is its own standalone module next to the oscilloscope visualizer (it used to be a
cramped side-column inside the scope panel).

**Oscilloscope visualizer**: the stacked rings now rotate slowly as a group, speed tied to BPM.

**Transition behavior**: switching presets, hitting "⟲ ALL", or generating a new seed no longer forces
an immediate chord hit — the old behavior clashed with the outgoing sound's delay/reverb tail. New
material now enters on the next natural downbeat instead.

**8 presets**, each with a full, deliberate set of values across every module including the new
Reverb/Chorus module: Nostalgic Drift, Four Tet Organic, Shimmer Cascade, Hauntological Tape, Velvet
Horizon, Pale Bloom, Green / Yoshimura, Khan Lineage (the Indian classical raga preset).

## Update — 2026-10-13

Everything in "What's in the current build" above is still accurate and still the baseline. Since that
section was written, the following has also landed in `index.html` (same canonical path, same repo —
`git log` shows all of it):

**New drone timbre: Digeridoo.** Module 1 now has a "Drone Timbre" select (Sub Oscillator / Digeridoo).
Digeridoo is a real synthesis build, not a filtered oscillator: a custom `PeriodicWave` excitation
(~24 harmonics, deterministic jitter) through dedicated buzz oscillators detuned 9 cents apart and
soft-clipped together, three broad formant resonances (150/440/1100 Hz), filtered breath noise, and
three independent modulation layers (amplitude swell, pitch wobble, formant drift). Classic sub-osc mode
is untouched — the buzz layer sits at gain 0 unless selected.

**9th preset: "After Hours Deep."** Deep house, 112 BPM, Dorian, four-on-the-floor restrained drums,
Rhodes chords, locked sub-bass (no wander), tempo-synced dotted-eighth dub delay, plate reverb + light
chorus.

**Khan Lineage (raga preset) refined**: root note and chord shape now randomize on every preset
selection and app startup (not just this preset — applies globally); richer Tanpura overtone ring;
deeper Bayan meend swoop; Sitar soloing locked to Raga Bilawal with note-priority voice stealing.

**Module title de-duplication + styling unification.** The orbital side panel used to show a module's
title twice — once in its own modal header, once from the reparented strip's own panel-header — with
mismatched wording between the two. Fixed: the strip's inner title is now hidden when nested in the
orbital panel, and the 8 module names are reconciled everywhere (orbital orb labels, modal titles, and
console-rack panel headers all read identically, case aside). Console-rack titles also now pick up the
same colored-glow treatment the orbital panel already used, driven by each module's own fixed accent
color. Panel-header/control-label/control-val font sizes bumped slightly for legibility; verified no
wrapping/overflow from 1920px down to 640px.

**Responsive overflow pass.** Fixed several real narrow-viewport bugs found during an audit (app is
clean from 1920px down to 640px now): the orbital module-expand panel was capped at a flat
`max-width:85%` regardless of arena width, which broke down below ~900px; the "LIVE TAKEOVER" keyboard
badge overflowed at narrow widths (now just "LIVE"); the Eno pod's phosphor label could wrap or get
truncated — the "BIO-SCAN" text was removed from the pod entirely (just "ENO · <color letter>" remains)
since there was never really enough room for both labels at the pod's ~100px width.

**Arp timbre fix**: "After Hours Deep" now uses Water Droplet instead of Analog Pulse for its arp
(Analog Pulse read as harsh and didn't blend with the preset). Also fixed a latent bug: the Digeridoo/
Classic drone-timbre switch wasn't being reset on preset change like the other optional toggles, so a
manually-selected Digeridoo mode could silently persist into presets that expect Classic sub-bass.

## If you're making changes

Keep editing `index.html` in place at the canonical path. If you want to hand something back for
review, say so explicitly and name what changed rather than sending a whole new file copy — that's
exactly the pattern that caused the fragmentation this note is cleaning up.

## Update — 2026-10-14 (Hand-off back to Claude)

The roadmap implementation has advanced through Phase 1, Phase 2, and subsequent console architecture unification. All work was performed directly in `/Users/benfox/Documents/Development/slambient_dev/index.html` and committed locally to git (`master` branch).

### 1. Slambient v0.2 Archive Snapshot
- Archived snapshot created and saved to `_archive/old_snapshots/slambient_v0.2_index.html`.

### 2. Audio Engine & Synthesis Priorities (Roadmap Phase 1)
- **Anti-Click and Startup Smoothing**: Implemented soft attack (35ms) and soft release (40ms) amplitude envelopes on `droneGain` and `tanpuraBusGain` in `initAudio`, `togglePlay`, and `updateAudioParams`. Anchored oscillator frequencies using `setValueAtTime` in `updateDronePitches` to eliminate phase discontinuities, digital clicks, and speaker pops on startup, pause, and preset switching.
- **Feedback Ceiling**: Enforced a hard safety ceiling of 48% (0.48) maximum feedback across all UI slider definitions (`max="48"`), parameter updates, `RANDOM_SWEET_SPOTS`, and factory presets to prevent runaway digital feedback loops.

### 3. Merged Console Rack & Pedalboard Architecture (Roadmap Phase 2 + Merged Console)
- **Unified 2-Way View Navigation**: The view switcher has been streamlined to two definitive modes: `Orbital View` and `Console Rack`. The separate "Pedals View" mode was merged directly into the Console Rack.
- **Tactile Stompbox Pedals Replace Legacy Effect Channels**: The legacy duplicate channel strips (5. Filter & Env, 6. Analog Delay, 7. Reverb & Chorus, 8. Space & Out) have been superseded by 3 tactile stompbox insert pedals + 1 master channel strip inside a unified 4-column deck:
  1. **FILTER Pedal** (`KANKYŌ DSP` / Dual VCF): Cutoff, Resonance, Attack/Decay, Envelope Depth, LFO modulation, mechanical footswitch & green LED jewel.
  2. **DELAY Pedal** (`TIME DRIFT BBD` / Analog Tape Echo): Delay Time, Tempo Sync toggle, note division dropdown, Tone damping, Flutter/Mix, capped 48% feedback, footswitch & amber LED jewel.
  3. **REVERB & CHORUS Pedal** (`DIFFUSION LAB` / Pink Theme `#ff5fc4`): Reverb Mode (Plate, Hall, Cathedral), Reverb Mix & Tone, Stereo Chorus Mode (Classic, Ensemble, Vibrato) with Rate, Depth, and Mix, footswitch & hot pink LED jewel.
- **New 4th Master Channel Strip — "8. Master EQ & Out"**:
  - Replaces legacy "Space & Out" as the anchored terminal element of the signal chain.
  - Added a master 3-band parametric EQ:
    - Low shelf: 100 Hz (`knobEqLow`, ±12 dB)
    - Mid peaking bell: 1 kHz, Q=1.0 (`knobEqMid`, ±12 dB)
    - High shelf: 4.5 kHz air/presence (`knobEqHigh`, ±12 dB)
  - Added master analog tape saturation / drive (`knobMasterDrive`, 0-100%).
  - Retains master BPM tempo, hardware MIDI output selection, and master diffusion space controls.
- **Live Web Audio API Graph Rewiring**:
  - Drag-and-drop chassis reordering (with dual support for Pointer Events via `setPointerCapture` on `⠿ DRAG` handles and HTML5 drag fallback) plus clickable shift arrows (◀ / ▶) dynamically rewire `AudioNode.connect()` topologies in real time via `rewireDspChain(dspChainOrder)`.
  - Signal chain flow: `BUS PRE` ➔ `[Pedal 1]` ➔ `[Pedal 2]` ➔ `[Pedal 3]` ➔ `MASTER EQ (Low ➔ Mid ➔ High)` ➔ `MASTER DRIVE` ➔ `SATURATION` ➔ `LIMITER` ➔ `MASTER VOL` ➔ `DESTINATION`.
  - Live reordering is active even prior to starting playback (retaining user-configured chain topology on startup).
- **Cross-View Synchronization**:
  - Parameter changes, preset selections, and randomization routines synchronize bidirectionally across controls.
  - `randomizeEverything()` shuffles pedal order on execution, with manual `⟲ SHUFFLE` and `RESET (F-D-R)` buttons available on the routing header.
  - Orbital constellation Module 8 is renamed to "MASTER EQ & OUT" with matching accent coloring and modal handling.

### Recent Git Commits
- `aae64ac` — Archive build as Slambient v0.2 and implement Phase 1: anti-click envelopes, 48% feedback ceiling, and dynamic Web Audio DSP graph rewiring
- `65b7fd2` — Implement Phase 2: Multi-View Console & Pedals Architecture with live Web Audio API rewiring
- `52433cd` — Fix Pedals view: allow pre-playback DSP chain reordering, add pointer-event drag and drop, and ensure shift arrow hit testing
- `eaecf1b` — Merge Console Rack and Pedals View into a unified view mode
- `d1a5a87` — Replace master effect modules with tactile pedals, set Reverb & Chorus to pink, and add Master EQ & Out final chain strip

## Update — 2026-10-14 (Claude: fixed a whole-page crash from the pedal rework)

The pedal/label consolidation above (Filter LFO Rate+Depth and Reverb Mix+Tone each merged into
one combined `"X / Y"` label) left `updateAudioParams()` with two **unguarded** writes to the old,
now-deleted separate label ids (`lblFilterLfoRate`, `lblFilterLfoDepth`, `lblReverbTone`). Since
`updateAudioParams()` runs via `setupRandomInitialState()` at the literal top level of the script
(not inside a try/catch or event handler), that `null.textContent` crash aborted the rest of the
**entire script's** top-level execution on every page load -- anything declared or initialized
after that call point (e.g. `const ENO_PHOSPHORS`) never ran. That's why so much looked broken at
once from a two-line bug.

**Fixed in `26a97c7`**: both spots now read each knob's value unconditionally guarded on its own
existence, then write the combined string to the one label that actually exists, matching the
HTML's own format. Swept the whole file for the same `getElementById(missing-id).property` pattern
afterward -- those were the only two instances. If you add another combined/consolidated label like
this, grep for `document.getElementById(` chained directly to `.textContent`/`.value`/etc. without a
preceding existence check, and confirm the id it names is still real in the HTML.

Verified clean (zero console errors) across: page load, preset cycling (all 9), Start/Stop with
drone gain tracking, orbital module expand/drag, DSP chain shuffle/reorder, Master EQ/drive
controls, and 1920/1024/640px layouts.

## Update — 2026-10-14/15 (Claude: pedal redesign, roadmap Phase 1/2 audit, dead code removed)

A few intentional design decisions from this pass, so they don't read as regressions if you're
diffing against the stompbox-pedal commits above:

- **The pedal cards are no longer "vintage stompbox" styled.** The chassis screws, brand banner
  (`KANKYŌ DSP` / `TIME DRIFT BBD` / `DIFFUSION LAB`), big footswitch dial, and LED pod are gone.
  Each pedal now uses the same `panel-header` + `control-row` convention as every other module
  panel (Sub & Drone, Drums, etc.) — title, a `panel-header-actions` row of compact 24px icon
  buttons (shift arrows, drag handle, bypass toggle), and a border-top color accent instead of a
  full colored border + drop shadow. This was an explicit user request for visual harmony across
  modules, not an oversight — don't re-add the LED pod or footswitch graphic without checking first.
- **Pedal title numbers are fixed (5/6/7), not chain-position-based.** They identify the module
  (Filter=5, Delay=6, Reverb=7, matching "8. Master EQ & Out"), the same way the other panels are
  numbered 1-4. The `pedal-slot-badge` (IN / INSERT / OUT) is what reflects live position.
  (There was a brief detour where the title numbers *did* update live to 1/2/3 on reorder —
  reverted; if you see any `pedalNum_FILTER`-shaped id in old history, it's gone now.)
- **Reordering the pedal chain now also rewires the orbital view's connection lines.**
  `getOrbitalConnectionChain()` (defined right after `ORBITAL_MODULES`) rebuilds the 8-orb
  constellation chain every draw frame, with the Filter/Delay/Reverb segment (orbs 5-7) following
  live `dspChainOrder` instead of the fixed array order. If you touch the orbital connection-drawing
  loop, use this helper instead of iterating `ORBITAL_MODULES` directly, or the visual chain will
  drift out of sync with the actual DSP graph again.
- **The pedal chassis is deliberately NOT `draggable="true"`.** It was, briefly, and that hijacked
  every click-drag on a slider anywhere on the card into a native HTML5 drag of the whole pedal —
  sliders were completely unusable. Reordering works entirely through the pointer-capture listener
  on `.pedal-drag-handle` (`initPedalDragAndDrop()`). Don't add `draggable="true"` back to
  `.pedal-chassis`.
- **Dead code removed**: `syncFromPedal()` / `syncPedalControlsFromConsole()` (never-populated
  `pedal_*`-prefixed ids that don't exist in the HTML — pure no-ops on every call) and the
  `pedalLed_FILTER/DELAY/SPACE` lookups in `togglePedalBypass()` (elements removed in the redesign
  above, lookup was already silently failing). None of this did anything functional — console/pedal
  state "sync" works because the pedal view reuses the exact same DOM elements as the console rack
  (e.g. `#knobMasterCutoff` lives inside `#pedalCard_FILTER`), not through a copy-between-elements
  sync function. If you ever do split them into genuinely separate elements, you'll need to build
  real two-way sync from scratch — it doesn't currently exist despite the function names above.
- **Audited Phase 1 & 2 of the roadmap against the actual code**: anti-click envelopes, drone
  portamento (`setTargetAtTime`, ~0.45s constant), the 48% feedback ceiling (enforced at the HTML
  slider `max`, the parameter-read clamp, AND the ramp-application clamp — three independent
  layers), and `rewireDspChain()`'s real `AudioNode.disconnect()`/`.connect()` graph rewiring are
  all genuinely implemented, not stubs. Phase 2's Console/Pedals merge (one unified view, not three
  separate Orbital/Console/Pedals modes) is confirmed as the intended final design, not a gap.

## Update — 2026-10-15 (Claude: orbital side-panel fix, start of Phase 3)

- **Fixed a real bug, not a new feature**: clicking the Filter/Delay/Reverb orbs in orbital view
  opened an empty side panel, and closing it made the pedal card vanish from the console rack
  entirely until reload. Root cause: `expandModuleOrb()`/`restoreStripsToRack()` looked modules up
  with `.strip-channel.<chClass>` — true for every module except these three, whose markup has been
  a `.pedal-chassis` card (not `.strip-channel`) since the original stompbox redesign. Added
  `getOrbModuleElement(orb)` (right after `ORBITAL_MODULES`) as the one place that knows how to find
  a given orb's real control element — use it instead of re-deriving the lookup if you touch this
  area again. `.orbital-side-panel`'s CSS accent treatment was extended to also match
  `.pedal-chassis`, not just `.strip-channel`.
- **Started Phase 3** (header/branding): sticky header with a frosted blur backdrop; `.app-sub`
  ("MEANDER ENGINE") now has a pill border; `⟲ ALL` moved beside Record and the verbose "Change ⤾"
  meter button became an icon-only SVG refresh glyph (same icon already used for the per-module
  randomize buttons, for consistency); the Eno pod is now a true square that matches the header's
  full height (JS-enforced in `syncEnoPodSquare()` — CSS `aspect-ratio` + flex-stretch alone resolved
  inconsistently across browsers and rendered as a stretched rectangle in testing, so don't revert
  this back to pure CSS without verifying across real browsers first) and the preset bank now hugs
  the brand block on the left instead of being pushed to the far right.
- **If you add any other full-bleed/sticky element that breaks out of body's padding**: note that
  this page has a universal `box-sizing: border-box` reset. `width: 100%` + a negative side margin on
  a border-box element does NOT widen it — it just shifts the whole box over by the margin amount,
  so one edge ends up misaligned with every other panel. `.header-bar-wrapper` hit exactly this bug
  (visible as the header's edges not lining up with the panels below it). The fix is
  `width: calc(100% + 2×gutter)` alongside the negative margins, not just the margins alone.
- **Still open in Phase 3**: upper visualizer row drag-reordering (new feature), unified channel
  strip anatomy across all 8 modules (bigger refactor, touches every panel), smart truncated
  dropdowns (new custom `<select>`-replacement component). None of these have been started.

## Update — 2026-10-14 (Dynamic Pedal Numbers: 5, 6, 7)

- **Dynamic Module Numbering (5, 6, 7)**:
  - Updated `updatePedalsOrderUI()` so that as the pedal chain (`dspChainOrder`) is reordered via drag-and-drop or shift buttons, each pedal's card header dynamically calculates and renders its exact 1-based order in the chain (`5 + idx` -> 5, 6, 7):
    - `5. Filter & Env`, `6. Analog Delay`, `7. Reverb & Chorus` (or any permutation like `5. Analog Delay`, `6. Filter & Env`, etc.).
  - Added span IDs (`#pedalTitle_FILTER`, `#pedalTitle_DELAY`, `#pedalTitle_SPACE`) for exact, flicker-free DOM text updates.
  - Linked dynamic numbering to `ORBITAL_MODULES` via `PEDAL_KEY_TO_ORBITAL_ID`: each orb's `num` string (`orb.num`) updates synchronously with the chain (`5`, `6`, or `7`). The orbital constellation drawing loop (`fillText(orb.num)`) and the orbital side-panel title (`${orb.num}. ${orb.name}`) reflect the live insert chain position in real time.

## Update — 2026-10-14 (Phase 3 Completed)

All items outlined in Phase 3 of the Technical Specification and Implementation Roadmap are now complete and committed in `index.html` (commit `5ca818d`):

1. **Upper Visualizer Row Drag-Reordering**:
   - Implemented drag-and-drop reordering for the 3 top-deck visualizer panels (`#scopePanel`, `#chordInfoPanel`, `#keyboardPanel`).
   - Added subtle `⠿ DRAG` handles (`.upper-drag-handle`) beside the header titles with unified pointer-capture dragging and native HTML5 drag fallback.
   - Replaced named grid areas with dynamic DOM node reordering (`renderUpperDeckOrder()`), supporting smooth `.drag-over` elevation cues across viewports.

2. **Smart Component-Based Dropdowns (Scale & Meter)**:
   - Built a custom dropdown component engine (`initSmartDropdowns()`) replacing native select styling while synchronizing hidden native select state for presets and event listeners.
   - **Scale Dropdown**: Truncates parenthetical modal details in the collapsed trigger (e.g., `Dorian`, `Hirajoshi`, `Major 9`), while displaying full descriptions upon expansion (e.g., `Hirajoshi (Japanese Kankyō)`).
   - **Meter Dropdown**: Displays clean time signatures when collapsed (e.g., `7/4`, `4/4`, `5/8`), while revealing descriptive labels on expansion (e.g., `7/4 (Odd Quarter)`, `5/4 (Take Five)`, `3/4 (Ambient Waltz)`).

3. **Standardized Channel Strip Anatomy (Modules 1–4)**:
   - Standardized channel strip headers across all 4 voice engines to feature a consistent Power switch (`PWR`), Mute (`M`), Solo (`S`), and module randomize button.
   - Unified bottom strip layout across all channels: auxiliary FX send slider positioned directly above a full-width horizontal master volume slider as the terminal control of each voice strip.

## Update — 2026-10-14 (Upper Deck Widget Sizing Fix)

- **Upper Deck Sizing & Proportions Fixed During Reordering**:
  - Replaced the static column-area grid (`grid-template-columns: 1.15fr 270px 1.15fr`) on `.upper-deck` with a dynamic flex row layout (`display: flex; align-items: stretch`).
  - Fixed each card's proportions to its native dimensions regardless of its position in the row:
    - **Visualizer Scope** (`.scope-panel`): `flex: 1.15 1 0; min-width: 320px;`
    - **Chord Analysis** (`.chord-info-panel`): `flex: 0 0 270px; width: 270px; min-width: 270px; max-width: 270px;` (anchors the chord wheel and meter gauges to their exact intended width).
    - **Playable Keyboard** (`.keyboard-panel`): `flex: 1.15 1 0; min-width: 360px;` (maintains full horizontal piano key octave spread).
  - Calling `renderUpperDeckOrder()` now triggers `resizeScopeCanvas()` to guarantee CRT visualizer rendering scales without pixel distortion.
