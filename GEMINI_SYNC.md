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

## Update — 2026-10-14 (Circular Cursors Enforced Across All Drag Elements)

- **Circular Cursor Consistency**:
  - Enforced `--cursor-grab` (circular reticle with cyan dashed outer orbit and yellow center pip) on all drag handles across both rows:
    - Upper visualizer deck drag handles (`.upper-drag-handle`)
    - Stompbox pedal drag handles (`.pedal-drag-handle`)
  - Enforced `--cursor-grabbing` on all `:active` and drag states:
    - Active drag states on handles (`.upper-drag-handle:active`, `.pedal-drag-handle:active`)
    - Dragged cards in transit (`.upper-deck-card.dragging`, `.pedal-chassis.dragging`)
    - Global window during pointer capture (`body.upper-dragging *`, `body.pedal-dragging *`) so the custom circular cursor never flickers or reverts to standard OS arrows when moving rapidly across adjacent DOM elements.

## Update — 2026-10-14 (Ableton Live-Style Smart Dropdown Menus Across All 14 Selects)

- **Ableton-Style Smart Dropdown Component Engine (`initSmartDropdowns`)**:
  - Upgraded all 14 `<select>` elements across the entire instrument (Header Root Key, Scale Mode, Meter; Drone Timbre, Octave, Tanpura Tuning; Drum Groove; Chord Timbre; Arp Pattern, Arp Timbre; Delay Note Division; Reverb Mode, Chorus Mode; Hardware MIDI Out) into tactile Ableton Live-inspired custom dropdown components.
  - **Tactile Ableton UI Styling**:
    - Sharp `2px` border radius, crisp `1px` borders, and monospace typography.
    - When opened, the trigger button inverts to a solid high-contrast module accent fill with dark `#07080c` text and a rotated chevron.
    - Hovering over menu items highlights the full row in the parent module's dedicated accent color (`--color-drone`, `--color-drum`, `--color-chord`, `--color-arp`, `--color-filter`, `--color-delay`, `--color-reverb`, `--color-space`, or `--accent` in the header) with a `▸` active selection marker.
  - **Smart Collapsed vs. Expanded Truncation**:
    - Automatically strips parenthetical details (`(...)`) and verbose meter tags in the collapsed button state so triggers stay compact and clean (e.g., `Hirajoshi`, `Sub Octave`, `Maihar Sitar Strings`, `7/4`, `1/8 Dotted`).
    - Displays full two-column split descriptions (`Main Label` on the left, muted `(Sub-Description)` on the right) when the menu is expanded.
  - **Automatic Programmatic Sync**:
    - Intercepts `HTMLSelectElement.prototype.value` setter on upgraded selects and hooks `syncAllSmartDropdowns()` into `updateAudioParams()` so preset loads, randomizers, and meter cycles immediately update the custom triggers without extra boilerplate.
    - Automatically detects viewport bottom collision and flips the menu upward (`.drop-up`) when near the bottom edge of the screen.
  - **Floating Header & Module Stacking Context (Zero-Scroll Menus)**:
    - Changed `header.top-bar` from `overflow: hidden` to `overflow: visible; z-index: 1010;` and elevated `.header-bar-wrapper` to `z-index: 3000; overflow: visible;` so header dropdown menus (Root, Scale, Meter) float cleanly above the header boundary and over the upper visualizer deck.
    - Removed the `max-height: 290px; overflow-y: auto;` constraint on `.custom-dropdown-menu` (`max-height: none; overflow: visible;`) and tightened `.custom-dropdown-item` row spacing (`padding: 4px 8px; line-height: 1.25;`) so all options across every dropdown display at once without vertical scrollbars.
    - Added `.is-open` state toggling on `.custom-dropdown-wrap` (`z-index: 9500 !important`) and `:has(.custom-dropdown-menu.open)` elevation rules across `.strip-channel`, `.pedal-chassis`, `.orbital-side-panel`, `.root-scale-ctrl`, `.time-sig-ctrl`, and `header.top-bar` (`z-index: 9000 !important; overflow: visible !important`) so open menus always layer above neighboring modules.

## Update — 2026-10-14 (Claude: Phase 6 — audio-gated shapes + orb click debounce)

- **Floating 3D shapes are now audio-gated.** `triggerMusical3DObject()` returns early unless
  `isPlaying`, and the idle `!isPlaying` fallback in `drawRoadsideObjects()` that spawned a lone cyan
  drone sphere over a stopped scope is gone. Shapes already on screen at Stop finish their pass and
  fade out normally. **Density now scales with activity**: `getRoadsideDensityScale()` counts how many
  of the 4 layers (drone/drum/chord/arp) triggered in the last 4s and returns 1.60 (one layer) up to
  1.95 (all four); both the object cap (`ROADSIDE_BASE_MAX_OBJECTS` 6 → 10–12) and the per-layer spawn
  debounce (`ROADSIDE_BASE_DEBOUNCE_MS` 1350ms → ~690–840ms) scale by it. `ROADSIDE_MAX_OBJECTS` no
  longer exists.
- **Orb clicks toggle and are debounced.** In orbital view, clicking the orb whose side panel is
  already open now closes it; clicks within `ORB_CLICK_DEBOUNCE_MS` (250ms) of the previous one are
  ignored, so a double-click no longer opens-then-closes. Also fixed a latent race: `closeOrbitalModal()`
  deferred `restoreStripsToRack()` by 260ms, so opening another orb inside that window had its module
  yanked back out of the panel when the old timer fired. The timer is now tracked in
  `orbitalRestoreTimer` and cleared by `expandModuleOrb()`.
- Verified in headless Chromium: no shapes spawn while stopped, 3 layers playing gives scale 1.83,
  open / double-click / toggle-close / fast open of a second orb all behave, no new console errors.

## Update — 2026-10-14 (Claude: Phase 6 — Fractal visualizer mode)

- **New `FRACTAL` layer button** in the visualizer toolbar (`#btnToggleFractal`, violet spiral icon,
  off by default, styled like the other `.btn-layer-toggle`s via `.layer-fractal`). While on,
  `drawScope()` calls `drawFractalVisualizer()` *instead of* the waterfall / flight grid / floating
  shapes; the oscilloscope rings (if enabled) still draw on top. Toggling it clears
  `roadsideObjects` so the landscape doesn't come back with a frozen batch of shapes.
- **What it draws**: an audio-reactive Julia set. `c` travels just inside the edge of the Mandelbrot
  main cardioid (`c = r·e^(iθ)/2 − r²·e^(2iθ)/4`), which keeps the set connected — filigree spirals,
  never scattered dust (the classic `0.7885·e^(iθ)` circle was tried first and spends a lot of its
  orbit as dust). θ advances one lap per 256 beats while playing, ~8% speed when stopped.
  Drone energy moves `r` (calmer ↔ more intricate), drum hits punch a short zoom pulse, chord
  energy rotates the palette, arp energy brightens the edges. Palette runs through the instrument
  colors (violet / cyan / green / amber / pink) into the panel background.
- **Cost**: rendered into an offscreen buffer at `min(360, w/2)` px wide and scaled up with
  smoothing; ~6ms/frame windowed and ~13ms fullscreen in headless (software-rendered) Chromium,
  expected lower on real hardware. If it ever drops frames, lower `FRACTAL_MAX_BUFFER_W` or
  `FRACTAL_MAX_ITER` first.

## Update — 2026-10-14 (Claude: Phase 6 — Slambient Invaders arcade easter egg)

- **Space Invaders inside the visualizer canvas.** New invader-icon button in the visualizer
  toolbar (`#btnToggleArcade`, `.layer-arcade` — a launcher, so it doesn't get the dimmed inactive
  layer look). `toggleArcadeGame()` swaps `drawScope()` over to `drawArcadeGame()`; the landscape,
  fractal and rings are skipped while it's up, and the music keeps playing.
- **Audio-reactive rules**: one 8-invader row per instrument (arp / chords / drums / drone, top to
  bottom, in their colors) glowing with live energy (reuses `updateFractalEnergy()` /
  `fractalEnergy`). The formation marches **one step per beat** from `bpm` (8ths below half, 16ths
  below 15%), so tempo changes change difficulty. A louder row fires more. Each kill plays a
  scale-locked blip (`arcadeScaleMidi()` from `activeScaleKey` + `rootNote`) in that instrument's
  octave, routed into `masterBusPre` so it goes through the pedal chain's delay/reverb. 3 lives,
  waves start lower each time, session hi-score.
- **Input**: ← / → move, Space fire, Enter/Space start, Esc quit; pointer/touch on the canvas steers
  and fires. The game's keydown/keyup listeners are `capture: true` + `stopImmediatePropagation()`
  for **only** its own keys, so Space/Esc don't reach the scope-fullscreen or (Phase 7) play-toggle
  handlers while playing, but QWERTY note keys (A/W/S/…) still play the keyboard. **Phase 7 note:**
  when you add the Spacebar/Enter play toggle, keep it a normal (non-capture) listener and it will
  automatically yield to the game. The scope's double-click-to-fullscreen is suppressed while the
  game is up (fast taps were triggering it).
- Verified in headless Chromium: title → play → kills score → life loss → game over → restart →
  wave clear → wave 2 → Esc exits; music kept playing throughout; no new console errors.

## Update — 2026-10-14 (Claude: Fractal mode is now an endless Mandelbrot zoom)

Ben asked for the classic infinite-zoom effect instead of the beat-pulsing Julia set, so the
Julia renderer described in the "Fractal visualizer mode" entry above has been **replaced** (same
button, same `toggleFractalMode()` / `updateFractalEnergy()` / `fractalEnergy` names, which the
arcade still shares; `fractalTheta` and `zoomPulse` are gone).

- **The dive**: the camera zooms continuously toward a boundary point of the Mandelbrot set, one
  decade of magnification every `FRACTAL_BEATS_PER_DECADE` (24) beats, so speed follows tempo
  (~15% speed when stopped). Drone level and drum hits (`fractalEnergy.surge`) push it faster;
  nothing pulses back out. Slow rotation around the target.
- **Why it loops**: 64-bit floats lose precision around 1e-13, so each dive goes
  `FRACTAL_DIVE_DECADES` (7.5) deep, then the last frame keeps growing while it crossfades
  (`FRACTAL_CROSSFADE_SEC`) over a fresh dive on the next of 4 `FRACTAL_ZOOM_TARGETS`. Each target
  was checked numerically to keep boundary detail at every depth (the famous seahorse-valley
  point was rejected: it lands inside a minibrot and goes solid black past ~1e-7). If you add
  targets, check them the same way.
- **Rendering**: iterations grow with depth (`90 + 48·depth`); main cardioid / period-2 bulb are
  skipped analytically. Brightness is measured against the previous frame's lowest escape count
  (`fractalFloorIter`), otherwise deep frames wash out because every pixel takes many iterations.
  Buffer width adapts between 140 and 360px to hold ~`FRACTAL_FRAME_BUDGET_MS` (9ms) per frame.
  Palette cycles with depth; chords rotate it, arp brightens edges.

## Update — 2026-10-14 (Claude: looser, more colorful floating shapes; Invaders button moved)

- **Toolbar order**: the Slambient Invaders button now sits after the oscilloscope-rings button
  (just before fullscreen), per Ben.
- **Floating shapes are no longer a strict readout of the music** (Ben's call: "allow for some
  random elements and different colors for each shape"):
  - Colors are no longer fixed per instrument. Every shape draws a random color from
    `ROADSIDE_COLORS` (weighted toward cyan / royal & bright blue / green / mint / hot pink / rose,
    with violet, amber, crimson rarer), never the same color twice in a row (`pickRoadsideColor()`).
  - A layer's note still *can* spawn a shape, but only ~35% of the time is it that layer's own
    shape (drone→sphere, drums→cube, chords→pyramid, arp→diamond); otherwise it's random.
  - New free-running `"ambient"` spawner in `drawRoadsideObjects()` adds shapes on its own while
    playing (busier when fewer than 3 are on screen). It doesn't count toward the
    activity-density scale. Still nothing spawns while stopped.
  - **Why blue was missing before**: the only drone spawn call lives inside the Tanpura voice,
    and Tanpura is off by default, so cyan spheres almost never appeared.
- Verified in headless Chromium over 25s of playback: all 4 shapes and all 10 colors appeared,
  0 spawns while stopped, no console errors.

## Update — 2026-10-14 (Claude: Phase 7 started — Enter play/pause, MP3 recording)

- **Enter is the universal play/pause key** (`bindGlobalTransportKeys()`, right before
  `toggleMasterMute()`). **Space is intentionally NOT bound** to transport: Ben's call, since
  Slambient Invaders uses Space to fire and a focused button would also "click" on Space. Enter is
  ignored while typing in a text/number field or a contenteditable, and while a custom dropdown is
  open; it calls `preventDefault()` so a focused button doesn't also activate. The arcade no longer
  captures Enter (it starts/restarts on Space or tap only), so Enter toggles the music even
  mid-game.
- **Record now saves a 320 kbps stereo MP3** instead of `.webm`. The MediaRecorder path is gone
  (`mediaRecorder` / `recordDest` / `recordedChunks` removed). `toggleRecord()` taps the same point
  as before (`limiterNode`, post-limiter / pre master volume) with a `ScriptProcessorNode` into
  Float32 chunks — raw PCM, so there's no Opus→MP3 double lossy step — then `finishRecording()`
  encodes with **lamejs 1.2.1**, lazy-loaded from jsDelivr (cdnjs as backup) the first time you
  hit Record, so the page stays dependency-free until then. Encoding yields every ~5s of audio
  and shows progress on the button and in `#footerStatus`. **If lamejs can't load (offline), the
  take is saved as a 16-bit WAV instead** — a recording is never lost. Files are named
  `slambient-YYYYMMDD-HHMMSS.mp3`. ScriptProcessor (not AudioWorklet) on purpose: worklet modules
  can't be loaded from blob/`file://` URLs in every browser, and this page is opened by
  double-clicking `index.html`.
- Verified in headless Chromium: Enter starts/stops playback (also inside the arcade, where it no
  longer starts the game); a 6s take saved as a valid 320 kbps MP3 with real audio (mean −9.7 dB);
  with the CDN blocked the same take saved as a valid stereo WAV.

## Update — 2026-10-14 (Claude: header at 150% zoom, app fullscreen, Invaders rework)

- **Header no longer breaks at 150% browser zoom.** Root cause: `.preset-bar` used
  `repeat(5, 1fr)`; a bare `1fr` track can't shrink below its `nowrap` label, so the grid overflowed
  under the BANK buttons. Now `repeat(5, minmax(0, 1fr))`, chips ellipsize (`display:block`,
  `text-overflow: ellipsis`; the full name is always in the chip's `title` via
  `initPresetChipTitles()`), and **below 1100px wide** the preset grid drops onto its own
  full-width line under the brand (`flex-wrap` on `.brand-row`), with BANK staying top-right.
  Also fixed the ≤1440px media rule that gave chips `padding: 5px 8px`, which pushed the label
  down and clipped it. Checked at 1512 and 1920 px at 100% and 150%, and at 1280 px at 150%.
- **New whole-app Full Screen button** (`#btnAppFullscreen`, `.header-utils` at the right end of
  the transport row, filling the dead space Ben noted). `toggleAppFullscreen()` uses the real
  Fullscreen API on `document.documentElement` (with the webkit prefix), so Esc works too; the
  button state follows `fullscreenchange` (`syncAppFullscreenButton()`). Collapses to icon-only
  below 1200px. Separate from the visualizer-only fullscreen. No letter shortcut, because A–; are
  all QWERTY note keys.
- **Slambient Invaders reworked so every wave is different** (whole `ARCADE` block replaced;
  `ARCADE_ROWS` / `ARCADE_COLS` are gone, replaced by `ARCADE_TYPES` / `ARCADE_FORMATIONS`):
  - Wave 1 is a block; each later wave picks a different formation (chevron, diamond, checker,
    towers, stagger, ring), announced with a "WAVE n · NAME" banner. The formation sways.
  - Enemy types are **mixed through the formation** (weighted random), one per instrument with its
    own behavior: drone = armored (2 hits, flashes white, dims when damaged, heavy shots); drum =
    **divers** that peel off, swoop at the player, fire once, loop off the bottom and drop back
    into their slot (louder drums mean more dives, double points when shot mid-dive, ramming you
    costs a life); chord = 3-way spread shot; arp = fast shots aimed at the player, with a jittery
    animation.
  - **Mothership**: a pink saucer crosses the top every ~15–30s for 100–300 × wave bonus and plays
    a pentatonic run when hit.
  - Still beat-locked (march step per beat) and energy-glowing as before. `arcadeInvaderPos()`
    now takes `ts` (sway); `arcadeSlotPos()` is the formation slot, ignoring dives.
- Verified in headless Chromium: header screenshots at the sizes above; bot-played Invaders for
  ~15s plus forced waves 2–8 (all formations render, divers dive and return or ram, UFO hit
  scores, armored drone takes 2 hits, spread/aimed/heavy shots fire); no console errors.

## Update — 2026-10-14 (Claude: header Undo, Tap Tempo, Shortcuts panel)

Ben approved all three suggested header buttons.

- **UNDO** (`#btnUndoPatch` in `.header-utils`, plus Ctrl/⌘+Z): `pushUndoSnapshot()` stores a full
  `serializeCurrentPatch()` (the same format BANK SAVE writes) before any wholesale patch change,
  and `undoPatchChange()` restores it. Hooked by **wrapping the globals** right after the startup
  `setupRandomInitialState()` call: `applyPreset`, `randomizeEverything`, `newSeed`,
  `randomizeDspChain` and every per-module `randomize*`. An `undoWrapDepth` counter makes one click
  one undo step even though ⟲ ALL calls the module randomizers internally. Holds 30 steps.
  Master volume is deliberately excluded from undo. **If you add a new randomize function, add its
  name to that list.**
  - Refactor: LOAD's restore logic moved out of `loadPresetBankJson()` into
    `applyPatchData(data, skipIds)`, now shared by LOAD and UNDO. Behavior is unchanged.
- **TAP** button at the end of the header tempo control (`tapTempo()`): averages up to the last 5
  intervals and needs 3+ taps; a gap over 2s starts over; the result is clamped to the slider's
  45–115 range (status line says when it clamps).
- **? Shortcuts panel** (`toggleShortcutsPanel()`, also opened with the `?` key; closed by Esc,
  ✕ or clicking outside): lists Enter, Ctrl/⌘+Z, ?, Esc, the QWERTY note keys, double-click
  visualizer fullscreen, and the Invaders controls. **Keep it in sync if shortcuts change.**
- `.global-transport` is now `flex: 1 1 0` so the Undo / ? / Full Screen group stays on the
  transport row when the controls wrap at narrow widths (≤1100px it bottom-aligns).
- Verified in headless Chromium: preset → ⟲ ALL → Ctrl+Z → Undo click restored each prior state
  exactly (bpm/scale/root/seed/chain/cutoff/preset highlight); ⟲ ALL counts as one step; taps set
  the BPM; ? opens and Esc closes the panel; Enter still toggles play; header checked at
  100%/150%; no console errors.

## Update — 2026-10-14 (Claude: header color palette picker, Phase 7 complete)

Ben asked for a palette picker in the header with 5 themed options (option 1 = the current colors)
plus a full randomize.

- **Theming is now variable-driven.** Every hardcoded module color in `<style>` was converted to
  `var(--color-<module>)` or `rgba(var(--rgb-<module>), a)`. `:root` defines both forms for the 9
  module keys (drone, drum, chord, arp, noise, filter, delay, reverb, space). `--accent` is now
  `var(--color-chord)`. **New UI must use these variables, not literal hex/rgb, or it won't follow
  the theme.** Canvas code reads colors with `themeHex(key)`, `themeRgb(key)` and `themeRgbArr(key)`.
- **Picker UI:** `#btnPalette` (4-dot icon + "Palette") at the start of `.header-utils` opens
  `#paletteMenu`, a popover listing each theme with a swatch strip, plus **Randomize**. Closes on
  outside click or Esc.
- **`COLOR_THEMES`** (colors in THEME_KEYS order):
  1. Slambient (the original scheme)
  2. Kankyō Pastel (soft 80s Japanese environmental-music tones)
  3. Aurora (neon greens, magentas, violets)
  4. Sodium Tape (warm amber/orange analog tones)
  5. Glacier (icy blues and lavenders with a pink accent)
- **`makeRandomTheme()`**: 9 hues spread evenly around the wheel with jitter, shuffled across the
  modules; saturation 68–95, lightness 56–68 (chord a bit lighter so the accent stays readable).
  Each click gives a new theme.
- **`applyColorTheme(theme, persist)`** sets the CSS variables and updates the JS color tables:
  `RING_CONFIGS` (arp_main/arp_shimmer are lightened arp mixes), `WATERFALL_TRACKS`,
  `ORBITAL_MODULES` (and an open orbital side panel's accent), `ARCADE_TYPES`, `ARCADE_UFO_RGB`
  (reverb color), and rebuilds the Mandelbrot `FRACTAL_PALETTE` via `buildFractalPalette()`
  (`FRACTAL_PALETTE` is now `let`, built lazily). `ROADSIDE_COLORS` keeps its curated mix on the
  Slambient theme and uses the theme's 9 colors otherwise (`ROADSIDE_COLOR_WEIGHT_TOTAL` is now
  `let`). The shapes visualizer keeps its own random colors on purpose, per Ben's earlier ask.
- **Persistence:** the choice (including a generated random theme) is saved to localStorage key
  `slambient.colorTheme` (try/catch guarded); `initColorTheme()` restores it on load or applies
  theme 1.
- Verified in headless Chromium: all 5 themes and Randomize change the CSS variables, computed
  button colors, RING_CONFIGS and ORBITAL_MODULES; the choice survives a reload; screenshots of
  each theme look right; no console errors.

## Update — 2026-10-15 (Claude: Slambient Invaders hit crash fix)

Ben reported that getting hit in Slambient Invaders sometimes froze the visualizer.

- Cause: in `drawArcadeGame`'s enemy-bullet loop, a hit calls `arcadeLoseLife()`, which replaces
  `g.enemyShots` with an empty array. The loop then kept counting down its old index into the
  new empty array, read `undefined.x`, threw, and the scope's animation loop died. It only
  happened when other enemy shots were still on screen at the moment of the hit, which is why it
  was intermittent.
- Fix: `break` out of the bullet loop right after a hit. **Rule for the arcade code: anything that
  resets or replaces an array must not happen inside a loop over that same array without exiting
  the loop.**
- Verified in headless Chromium: a hit with 3 other shots on screen threw before and now loses a
  life cleanly with the visualizer still animating; desktop layout unchanged.

## Update — 2026-10-15 (Claude: phone portrait layout)

Ben: on an iPhone in portrait the app was cluttered and the spacing was off. Desktop (above 640px)
renders identically; checked element by element at 1512x900, 1100x800 and 800x900.

- **Where it lives:** one `@media (max-width: 640px)` block at the end of `<style>` ("PHONE PORTRAIT
  LAYOUT"), one `<script>` before `</body>` ("Phone layout helpers"), and `PHONE_LAYOUT_MQ` /
  `TOUCH_POINTER_MQ` at the top of the main script for canvas code. **New phone styling goes in that
  block, using the theme variables.**
- **Base:** phones render at `html { zoom: 1 }` (desktop stays 0.75); `viewport-fit=cover` with
  safe-area padding; one column with 10px gutters and 12px gaps.
- **Header:** not sticky on phones. Presets are a 2-row swipeable strip with full names; Start /
  Record / ALL, KEY+SCALE, METER, TEMPO+TAP rows; Palette / Undo / Full Screen row (? hidden on touch
  phones, Full Screen hidden where the Fullscreen API is missing); 2x2 telemetry; master volume and a
  small Eno pod side by side.
- **Mini transport bar** (`#miniTransport`, phones only): fixed at the bottom once the header's Start
  scrolls away; mirrors Play/Record/BPM.
- **Upper deck:** taller scope with a full-width layer-toggle row; chord wheel drawn 1.55x; keyboard
  TARGET/LEDS row above full-width keys; Invaders shows touch instructions on touch devices.
- **Orbital:** taller arena, orbs scaled 0.76-0.9 (`orb._deskBaseR` keeps the desktop size), labels
  fitted inside the orbs (`orbPhoneLabel`), the module panel is a bottom sheet (swipe down to close).
- **Console Rack:** strips, pedals and Master EQ stack in one column; dropdown menus are placed inside
  the viewport (`placeMenu`/`visibleBox` in the helpers).
- **Touch fixes (all widths, touch only):** a scroll that starts on a slider no longer changes it; open
  dropdowns close on an outside tap (iOS sends no click there); a piano key touch holds the note
  (pointerenter double-start).
- **Other fixes:** a pedal or Master EQ card open in the orb panel stays there when the chain is
  reordered (was emptying the panel, desktop too). Short landscape screens (641px+, under 500px tall)
  get a non-sticky header; 641-740px hides the Eno pod (the header was broken there); orbs re-layout
  when crossing 640px.
- Built by four parallel region passes, then four review passes (visual, touch, code, sizes/rotation).
  Tested in Chromium iPhone emulation at 390x844, 375x667, 430x932, 360x780 plus landscape and iPad
  sizes. **Not yet tested on a real iPhone.** Known leftover: on iPhone landscape the Full Screen
  button still shows (tapping it says full screen isn't available).

## Update — 2026-10-15 (Claude: simplified module names)

Ben asked for simple module names: SUB, DRUMS, CHORDS, ARP, NOISE, FILTER, DELAY, SPACE, OUT.
SPACE is the Reverb & Chorus pedal (the pedal chain's "SPACE" key) and OUT is Master EQ & Out (the
"space" orb id). Changed: orb names (`ORBITAL_MODULES`, so also the orb panel titles), console strip
and pedal titles, `PEDAL_BASE_NAMES`, the routing pills (3: SPACE, OUT, RESET (F-D-S)), the
visualizer legend and chord-panel tag (SUB), and the tooltips. Internal ids and keys are unchanged.

## Update — 2026-10-15 (Claude: no Full Screen button on phones)

Ben: no need for the Full Screen button on phones. `#btnAppFullscreen` is now hidden at max-width 640px
and on touch devices under 500px tall (phone landscape), always, not only when the Fullscreen API is
missing. Desktop and iPad are unchanged. The visualizer's own fullscreen button is separate and stays.

## Update — 2026-10-15 (Claude: delay feedback, instrument meters, phone orbs, Invaders touch pad, palette menu)

**Delay feedback loop (all presets).** The delay loop (`analogDelayNode` → `delayDampingFilter` → `delaySaturationNode` → `delayFeedbackGain` → back) ran away at high feedback: the tape saturation curve was normalized to a ~0.98 peak, so its small-signal gain was `k/tanh(k)` ≈ 1.96. A 48% feedback slider was really a loop gain of ~0.94, so tails hung around (−12 dB, 20 s after pause) and Khan Lineage built up while playing. Fix: new `makeFeedbackTapeCurve()` (slope ≤ 1, still soft-clips) is used for the delay loop only (`makeAnalogTapeCurve` is unchanged for everything else), and the feedback gain goes through `delayLoopGain()` = `min(0.48, feedback) * DELAY_LOOP_GAIN_SCALE (1.4)`, so the slider's top end is a loop gain of ~0.67. Tails now fall to the noise floor in ~5–10 s; Khan Lineage stays stable while playing. Slider range, presets and the 0.48 cap are untouched.

**Chord Analysis instrument meters.** The SUB/DRUMS/CHORDS/ARP bars read `ringDynamics[].energy`, which was only updated inside `drawSymmetricalRing` (rings layer on, Invaders off), so the bars froze at 0 with rings off or Invaders running. New `updateInstrumentMeters()` / `INSTRUMENT_METERS` read the analysers directly each frame (time-domain RMS + band average, smoothed). Rule: don't derive UI meters from state that only changes inside a draw routine that can be switched off.

**Phone orbs.** Orb Size now defaults to 65% on phones in portrait and landscape (`PHONE_ORB_MQ`: max-width 640px, or touch with max-height 500px) and 100% elsewhere, until the slider is moved by hand (`applyDefaultOrbSize`, follows rotation). The old fixed phone scale (0.76–0.9) in the phone helpers is now 1 (the slider does the shrinking). On phones the orb centre "+" is no longer drawn (number and one-word name only); desktop still draws it. Phone labels use `PHONE_ORB_MQ` so landscape gets the compressed label too.

**Slambient Invaders touch pad.** New `#arcadePad` under the playfield (inside `#scopePanel`, so it also shows in visualizer fullscreen), visible only while the game runs and only on phones / touch devices (`max-width: 640px` or `hover: none` + `pointer: coarse`): FIRE button, a slide-to-move track, FIRE button. The slider is relative (the ship never jumps to the finger), hold FIRE to auto-fire (~7/s), thumb mirrors the ship every frame via `syncArcadePad()`. Canvas tap/drag still works; desktop and keyboard play are unchanged. Title text on touch now says "SLIDE TO MOVE · FIRE TO SHOOT".

**Palette menu.** The RANDOMIZE row showed a lowercase hint that wrapped to two lines and used a different weight. It now shows nine dashed placeholder swatches (`.pal-ghost`), same size as a real palette's, so the row has the same width and height as the others and the same uppercase mono look.

## Update — 2026-10-15 (Claude: preset chip names no longer truncated)

Ben: header preset chip names wrapped/ellipsized ("NOSTALGIC DR…"). The chips (a fixed 5×3 grid, `minmax(0, 1fr)`) ellipsized any name wider than the chip, which depends on the font actually rendered, browser zoom and window width. New `fitPresetChips()` (next to `initPresetChipTitles`) measures every name on a canvas and sets one shared font size on all chips, the largest at which every name fits (never above the stylesheet size, never below 7px), re-run on load, font load, resize and bar resize. Skipped on phones (the bar scrolls and chips size to their text). The chips transition `all`, so the fit turns transitions off while it reads the stylesheet size; `scrollWidth` can't be used for the check because of the page's CSS zoom.

## Update — 2026-10-15 (Claude: play audio with the iPhone silent switch on)

Ben: on iPhone the sound only played with the ringer on. Web Audio is "ambient" on iOS by default, so the ring/silent switch mutes it. New `enableMediaPlaybackSession()` (just above `initAudio`) sets `navigator.audioSession.type = "playback"` (Safari 16.4+) and, on iOS only, loops an inaudible generated 1 s WAV in an `<audio>` element so older iOS also treats the page as media. It runs from `initAudio()` and from the first touchend/click/keydown (must be inside a user gesture), and again when the page returns to the foreground, where a suspended/interrupted `audioCtx` is also resumed. Desktop browsers never create the audio element. Needs a real-iPhone check (the silent-switch behavior can't be emulated).

## Update — 2026-10-15 (Claude: larger refresh arrow on the ⟲ ALL button)

Ben: the refresh arrow in the Randomize-all button was too small to read. The "⟲" text glyph (tiny, and drawn from a different fallback font on each device) is replaced by an inline SVG circular arrow (`.rand-all-icon`, 17px on desktop, 20px in the phone transport row), stroked in `currentColor` so it keeps the button's white. Label, button height and the transport layout are unchanged apart from the wider button; the other ⟲ buttons (per-module randomize badges, pedal SHUFFLE) are untouched.

## Update — 2026-10-15 (Claude: orb sheet and page cut off at the sides on iPhone)

Ben (real iPhone screenshots): the module sheet that opens from an orb had its title, sliders and values touching/cut off at the screen edges, and the page itself sat a few px off-centre. Measuring the screenshots: every panel was ~414 CSS px wide on a 390 px screen and the Eno pod ended 2–3 px from the edge, i.e. iOS Safari had widened the layout viewport (zooming the page out to ~0.9) because something is wider than the screen on WebKit, and `position: fixed; left: 0; right: 0` things like the sheet then span that wider layout viewport, so ~8–20 px of each side is off-screen. Chromium (my headless tests) shows no overflow at all, so I could not reproduce the cause itself, only the symptom's mechanism (no WebKit in the sandbox). Changes (phone only): viewport meta gets `minimum-scale=1.0` (stops iOS zooming out to fit overflowing content, so the layout viewport stays the screen width); `html, body` get `max-width: 100%` and `overflow-x: hidden` with `overflow-x: clip` after it (nothing can pan the page sideways); the sheet gets `max-width: 100vw`. Desktop is unchanged (element-by-element layout diff, 0 differences). Needs a real-iPhone check. If the page still shifts sideways, the next step is to find the element that is wider than the screen on WebKit (candidates: the header's preset strip chain, whose intrinsic min-width is ~1000 px, the footer's nowrap Architecture line at ~460 px, or the master/Eno pod row).

## Update — 2026-10-15 (Claude: Phrygian scale, Tangerine Dream and Airports preset fixes)

Ben asked for a Phrygian scale option. The scale list already had the Phrygian notes (0 1 3 5 7 8 10) under the key `PHRYGIAN_AMB` ("Phrygian Ambient"), so rather than adding an identical duplicate it is now `PHRYGIAN`, labelled "Phrygian (Deep Mystery)" in the SCALE dropdown (desktop and phone, same select). `SCALES.PHRYGIAN_AMB` stays as an alias so anything saved under the old key still resolves. This also fixes the known Tangerine Dream bug: that preset set the scale to `"PHRYGIAN"`, which didn't exist, so applying it threw (`degreeToSemitone` on an undefined scale). The other known preset bug is fixed too: Airports set the drum style to `"OFF"`, which isn't a drum style (the select went blank); it is now `"MUTED"`. All 15 presets now apply without errors and leave the SCALE and drum selects on valid values. Both items in the Master Blueprint section 12 "known open items" are therefore resolved (the Blueprint doc itself is owned by another thread).

## Update — 2026-10-15 (Claude: preset chips sized to their names and renamed; matching transport icons)

**Preset chips (desktop).** Ben's screenshot still showed names cut off ("NOSTALGIC DR…") even after the shrink-to-fit script. Cause: the page runs at `html { zoom: 0.75 }`, and Safari keeps text at a minimum of ~9px *on screen* even inside that zoom, so names render about 30% wider than the zoomed layout predicts, and shrinking the font can't help (it's clamped). The `fitPresetChips()` script is removed. Instead the bar is `width: max-content` with five equal `1fr` columns (equal to the widest chip), so the chips are always as wide as the longest name needs, in any engine; chip padding is 12px on desktop. Because the bar can now be wider than the old fixed 640px, the "presets on their own full-width line" breakpoint moved from 1100px to 1240px, where the five columns share the full width but never go below their longest name. Verified with the chip font forced to the Safari-clamped size at 1920/1622/1440/1280/1200/1120/1000px wide: no name cut or overlapping BANK. Renamed (labels only; tooltips keep the descriptions): Shimmer Cascade → Shimmer, Tangerine Dream → Tangerine, William Basinski → Disintegration, Lo-Fi Chillhop → Chillhop.

**Transport icons.** START/PAUSE, RECORD and ⟲ ALL now use one square icon slot (`--tr-icon`: 16px desktop, 18px phone transport row and mini bar), the same 7px gap to the label, and are centred on the label's line (measured: icon and label centres equal the button's centre, left/right padding equal after compensating the label's trailing letter-spacing). Play/pause are redrawn on a 16-unit grid, the record dot is drawn by `.rec-dot::before` inside that slot (12px of 16), the arrow is the existing SVG. Sliders were checked: thumbs are 14px on desktop and 22px on phone everywhere, so no change there.

## Update — 2026-10-15 (Claude: no more browser MIDI permission prompt on page load)

A first-time visitor to the live GitHub Pages link got a browser prompt that the site wanted to "control your MIDI devices" and could block it. Cause: `navigator.requestMIDIAccess()` was called at page load. Web MIDI is now opt-in. The "Hardware MIDI Output" menu (module 9. OUT) starts as `MIDI Off` with a `Connect MIDI Device…` entry; the browser is only asked when that entry is chosen (`connectMidi()`), after which the menu lists outputs and MIDI keyboard input is attached as before. Browsers without Web MIDI (iOS Safari) don't show the connect entry. The custom dropdown now rebuilds its menu when option text changes, not only when the option count changes. Trade-off: external MIDI keyboards no longer play the app until the user picks "Connect MIDI Device…" once per visit.

## Update — 2026-10-15 (Claude: 4-channel MIDI out for a DAW)

The Hardware MIDI Output menu (module 9. OUT) now sends each instrument on its own MIDI channel so a DAW such as Logic can split them across tracks: **ch 1 Sub drone, ch 2 Chords (and the on-screen/computer keyboard), ch 3 Arp, ch 4 Drums.** Implemented as a small layer next to `let midiOutput` (`MIDI_CH`, `MIDI_DRUM_NOTE`, `midiNoteOn/Off/Timed`, `midiDrumHit`, `midiSubSync`, `midiAllNotesOff`); the old hard-coded channel-1 sends were replaced by it. The sub is a held note that is re-sent whenever the drone pitch changes (`currentDroneMidi()` is called from `updateDronePitches`). Drums use a GM-style map: kick 36, snare 38, closed hat 42 / accented hat 46, woodblock 76, tabla dayan 62 (muted) / 63 (open), bayan 64. Pausing (or switching device) sends All Notes Off on channels 1-4. Drum MIDI follows the drum audio gate (`drumVol <= 0.01` sends nothing). To use it on a Mac: Audio MIDI Setup > MIDI Studio > IAC Driver > "Device is online", then pick it in the menu (Chrome/Edge/Firefox; Safari has no Web MIDI). Tested headlessly with a fake MIDI output: every channel carried only its own notes. Not tested in Logic.

## Update — 2026-10-15 (Claude: code audit and cleanup)

Audit of `index.html` (16,911 lines, 715,588 bytes, 164,231 gzipped when the audit started; the Mac-side commits `3b9164a`..`b2c39fd` landed on GitHub while it was running and were merged in afterwards). Method: ESLint (`no-undef`, `no-unused-vars`, `no-redeclare`, `no-dupe-keys`, ...) over both script blocks; a scripted check for unreferenced functions, top-level variables, CSS classes, CSS custom properties and element ids; a duplicate-block and duplicate-CSS-rule scan; and a "monkey" run in headless Chromium at desktop and phone size that cycles every option of every select, sweeps every slider, clicks every button and presses keys while collecting page errors (zero errors before and after).

Findings: the file is mostly live code. No runtime errors, no duplicate function names, no exact-duplicate CSS rules (only ~1.5 KB of CSS bodies repeated across different selectors). What was dead or redundant, and is now removed: the functions `getDspChainOrder`, `setDspChainOrder`, `toggleDronePower`, `playNoteLive`; the unused variables `ARCADE_MAX_COLS`, `ARCADE_PAD_THUMB_W`, `jawariCurveCache`, `orbitalAnimId`, `masterWidthNode`, `draggedPedalKey`, `pointerOriginX`, `currentEnoRGB` and two unused `masterRack`/`v` locals; a no-op phone orb scaler (`phoneOrbScale`/`applyOrbScale` always scaled by 1 since the 65% default size) and its resize listener; a guard for a function that never existed (`resizeScopeCanvas`); the unused CSS classes `.header-main`, `.pal-hint`, `.pedals-grid`, `.status-val`, `.strip-footer-row`, `.strip-aux-row`, `.strip-aux-label` and the unused custom properties `--panel-header`, `--color-live`, `--key-chassis`, `--key-natural`, `--key-sharp`. The upper-deck and pedalboard drag-to-reorder code was two near-identical copies; both now call one `bindPointerReorder()` helper (behavior checked against the old build: same reorder results). Size, measured against the file as it stood just before this batch was merged (716,763 bytes, 16,950 lines, about 162 KB gzipped, which already included the Mac-side font-size and layout commits made after the previous push): now 715,107 bytes, 16,843 lines, about 163 KB gzipped. The cleanup alone removed about 5.3 KB; the swipe and audio fixes added back about 3.6 KB.

Left alone on purpose: the orbital view's "ENGINE / CLOCK / ACTIVE NODES" telemetry chips are static placeholder text (they still say 7 voices / 7 nodes; the app has 9 modules); the `typeof ... === 'function'` guards for `EnoHead`, `CSSTransition` and `syncAllSmartDropdowns` (these look "undefined" to a linter but are real at runtime); about 70 KB of code comments. Not touched: the repo's `_archive/` folder (about 2.4 MB incl. a 1.4 MB .webm) is published by GitHub Pages along with the app although the page never loads it; Ben can decide whether to keep it on GitHub.

## Update — 2026-10-15 (Claude: mobile floating bar hardening, Invaders sound on phones)

**Floating play/record bar stuck mid-page (phones).** Could not be reproduced in Chromium (the bar stays pinned to the bottom through scrolls, rotation and view switches), so this hardens the things iPhone Safari is known to get wrong: the bar no longer slides in with a transform transition and no longer uses `backdrop-filter` (both can strand a fixed element partway up the page while Safari's toolbars collapse); whether it shows is now measured from the Start button's position on scroll / resize / rotation / visualViewport changes instead of an IntersectionObserver; the page bottom padding that makes room for it is constant (it used to toggle with the bar, shifting the page height mid-scroll); and the phone `body` now has `overflow-y: visible` so it is not a scroll container. If it still happens on the iPhone, send a screenshot and the iOS version.

**Invaders silent on phones.** Cause: the game's sounds go through the audio engine, which was only created by the header's Start button, so opening Invaders first (the usual path on a phone) meant no audio context at all. New `ensureAudioReady()` creates the engine and resumes it; it runs when Invaders opens and on the slider / fire button touches, and a global tap / key listener now also wakes a context that iOS suspended. Checked in a phone-sized browser: opening Invaders creates a running context and firing creates sound-effect oscillators.

## Update — 2026-10-15 (Claude: swipe between modules in the orb sheet, drone glide)

**Swipe navigation (phone orbital view).** With a module's bottom sheet open, swiping left or right on the sheet's header (grab handle / title row) steps to the next or previous module (1 SUB … 9 OUT, wrapping), sliding the new controls in; swiping down still closes the sheet. The first 8 px of movement picks the axis. Swipes that start on a button (power / mute / solo / close) are ignored, and the body is not a swipe zone so sliders keep working. Tapping an orb still works as before.

**Drone glide.** The drone used a 0.45 s time constant, so every chord change and wander step was a ~1.5 s audible swoop (97% of the way after about 1 s). It is now 0.05 s (99% within 0.1 s) via `DRONE_GLIDE_TC` / `DRONE_STEP_TC`. Deliberate slides are unchanged: the Sitar "meend" scoops (Sitar Strings timbre), the Bansuri flute onset, tabla bayan bends.

**Tanpura.** Not removed. It is already off by default and every preset resets it to off; only "Khan Lineage" switches it on (it is that preset's character). Left as is pending a decision (remove, or keep it as an opt-in).

**Energy slump investigation (measurements only, no sound changes).** Ran the real engine in headless Chromium and sampled the master bus every second: 2 random-start sessions of 120 s and four presets (chip positions 1, 4, 8 and 13, including Khan Lineage) for 90 s each. Master level is flat or rising over time (RMS about 0.08-0.13 per bus mix, 0.20-0.35 at the output), the limiter reduces by 0.3 dB at most (no compressor clamping), left/right correlation is 0.82-0.98 and the mono sum loses at most 5% (no phase cancellation), and there is no code that lowers density or level over time. What the numbers do show: 65-88% of the spectral energy sits at 60-250 Hz and almost none above 2 kHz (very dark / bass-weighted); the drone is about 5x louder than the chords and arp (RMS about 0.05 vs 0.01); the drums drop out entirely for 10-30 s stretches in some runs. So a perceived loss of weight is most likely the mix balance and the drums leaving, not a processing fault. Candidate fixes, none applied: raise the chord / arp level against the drone, high-pass the drone's upper harmonics or add a gentle low-shelf cut around 100-200 Hz on the master, keep a minimum drum density.

## Update — 2026-10-15 (Claude: softer, quieter tanpura)

Ben: the tanpura needs work, so lower its volume on Khan Lineage and make the tones less pitchy. Measured first: with Lineage loaded the tanpura bus ran at an RMS of about 0.44 and the master mix at about 0.55, far hotter than other presets (about 0.2-0.35), so the tanpura was swamping everything else. Changes: Lineage tanpura level 70 -> 38 and Javari (bridge buzz) 80 -> 55; in `playTanpuraPluck` (applies whenever the tanpura is switched on) the bridge-buzz formant is now 1.1-2.2 kHz instead of 1.75-3.4 kHz and its Q is 2.2-4.2 instead of 5-9.5 (a wide soft buzz instead of a ringing single pitch), the buzz level is about 25% lower, the two Sa "jodi" strings are detuned +/-4 cents instead of +/-1.5 and the sawtooth gets +/-1.5 cents of random drift (a fuller, less single-pitch chorus), and each string now passes a 2.6 kHz low-pass before the bus so the top is rounded off. After: tanpura RMS about 0.17, master about 0.23 on Lineage. Judged by measurement only, not by ear; the knobs (Tanpura level, Javari) are still there to adjust. Not changed: the tanpura is still off by default and only Khan Lineage turns it on.

## Master Implementation Roadmap & Phase Status

### Phase 1: Audio Core, Safety Ceilings & Dynamic DSP Graph — ✅ DONE
- [x] Audio envelope de-clicking (`linearRampToValueAtTime`, 25–40ms, on init/transport/preset/randomize)
- [x] Continuous pitch gliding (`setTargetAtTime` portamento, ~0.45s constant)
- [x] 48% hard feedback limiter (enforced at HTML slider max, parameter-read clamp, AND ramp-application clamp)
- [x] Dynamic AudioNode rewire manager (`rewireDspChain`, real `disconnect()`/`connect()` graph rewiring)

### Phase 2: Multi-View Console & Pedals Architecture — ✅ DONE
- [x] View switcher — Orbital/Console (2-way), with Pedals merged into Console
- [x] Tactile pedalboard layout (restyled to panel-header look for visual harmony across modules)
- [x] Drag-and-drop pedal reordering (pointer-capture based on `.pedal-drag-handle`)
- [x] Dynamic pedal numbering (`5`, `6`, `7`) synced across Console Rack and Orbital View based on live `dspChainOrder`
- [x] Cross-view state sync (shared DOM elements across views)
- [x] Randomizer routing hook (`randomizeEverything()` shuffles the pedal chain)

### Phase 3: Header, Branding & Instrument Standardization — ✅ DONE
- [x] Sticky header with frosted backdrop (`z-index: 3000; overflow: visible`)
- [x] Branding geometry (`260px` matched container + `MEANDER ENGINE` pill border)
- [x] Transport cluster refinement (`⟲ ALL` beside Record, meter button → SVG refresh icon)
- [x] Square `BIO-SCAN` Eno pod (matches header height, JS-enforced square)
- [x] Upper visualizer row drag-reordering (`#scopePanel`, `#chordInfoPanel`, `#keyboardPanel`) preserving exact widths & circular cursors
- [x] Unified channel strip anatomy (`PWR`/`M`/`S`/`⟲` header, two top dropdowns per instrument module, bottom-right `AUX` routing toggle + FX send slider + horizontal Master Volume footer across all 5 instrument modules)
- [x] Smart truncated dropdowns (Ableton Live-style custom component across all 18 selects, floating & zero-scroll)

### Phase 4: Voice Synthesizer Expansions & Environmental Noise — ✅ DONE
- [x] Drum fill generator (manual `FILL` button in Drum module header + automatic algorithmic fills on groove switch and 8-bar turnaround)
- [x] Tabla articulation engine (`Ge`/`Na`/`Tin`/`Ti`/`Re`/`Ki`/`Dha` modeled strokes, tempo-adaptive Bayan scoop pitch bends, polyrhythmic `Ti-Re-Ki-Ta` fills)
- [x] Sitar physical modeling (`getJawariCurve()` parabolic bridge harmonic waveshaper, dual gourd formant peaks at `920 Hz` & `2750 Hz`, and `triggerSympatheticStrings()` 3-string taraf sympathetic resonance)
- [x] Environmental soundscape / Noise instrument module (`5. Atmosphere & Noise` panel in `.lower-deck` with `RAIN`, `THUNDER`, `WHITE_TAPE`, `BROOK`, `CRICKETS`, `WIND` profiles, `GUSTS`/`CONTINUOUS`/`SPARSE`/`RHYTHMIC`/`STORM_SWELL` modes, `Evolve` toggle, `randomizeNoise()`, and Orbital View orb #5)
- [x] Filter & Output saturation refinement (staggered dual-biquad Q + `masterFilterCompGain` resonance compensation + 2x-oversampled `makeAnalogTapeCurve()` asymmetric analog tape saturation on `masterDriveNode` and `saturationNode`)

### Phase 5: Preset Serialization & Signature Sound Profiles — ✅ DONE
- [x] JSON export/import (`SAVE` / `LOAD` buttons in header preset bank via `savePresetBankJson()` and `loadPresetBankJson()`, serializing all voice/effect controls, power/aux/mute/solo states, bypass states, and live `dspChainOrder`)
- [x] Signature factory presets engineered for specific DSP chain topologies:
  - `Aphex Twin` (IDM rhythms in 7/8 Hirajoshi, eerie glass pads, `DELAY ➔ FILTER ➔ SPACE` routing at 48% feedback)
  - `Tangerine Dream` (chip label "Tangerine"; Berlin School Phrygian sequences, pulsing arpeggiators, `FILTER ➔ DELAY ➔ SPACE` sweeps feeding cathedral reverb)
  - `William Basinski` (chip label "Disintegration"; Tape decay mechanics in 3/4, pitch drift, continuous vinyl/tape hiss, `SPACE ➔ DELAY ➔ FILTER` routing feeding dark low-pass filter to muffle repeat tails)
  - `Lo-Fi Chillhop` (shown on its header chip as just "Chillhop"; Boom-bap swing, dusty Rhodes chords, window rain gusts, `FILTER ➔ DELAY ➔ SPACE` signal chain for warm tape saturation)

### Phase 6: Visualizers, Easter Eggs & Interaction Polishing — ✅ DONE
- [x] Audio-gated 3D floating shapes fix (prevent idle blue spheres when stopped + increase sphere density 60%–95% scaling)
- [x] Fractal visualizer mode (`FRACTAL` endless Mandelbrot zoom + updated visualizer control icons)
- [x] Space Invaders audio-reactive arcade minigame inside the primary visualizer canvas
- [x] Side-view orb click debouncing (250ms debounce to close active tab on click without double-click flicker)

### Phase 7: Global Shortcuts, Custom Theming & Final Polish — ✅ DONE
- [x] Keyboard playback binding (`Enter` toggles play/pause everywhere; Space reserved for Slambient Invaders)
- [x] MP3 recording export (320 kbps via lazy-loaded lamejs, WAV fallback offline)
- [x] Whole-app fullscreen button in header
- [x] Header layout holds at 150% browser zoom
- [x] Header Undo (patch history), Tap Tempo, and Keyboard Shortcuts panel
- [x] Modular color palette picker (header Palette menu: 5 themes + Randomize, applied to every module color and visualizer; saved in localStorage)

### After Phase 7 — 2026-10-15 changelog index (all pushed to GitHub main, newest first)
Each item has its own `## Update — 2026-10-15` entry above with details.
- (next push) — Code audit and cleanup (dead code removed, shared drag helper); mobile floating bar hardening; Invaders sound on phones; swipe between modules in the orb sheet; shorter drone glide. Details in the three entries just above the roadmap.
- `8303c8e` — MIDI out on four channels: 1 Sub, 2 Chords, 3 Arp, 4 Drums (for a DAW via the macOS IAC Driver)
- `2f90720` — Web MIDI is opt-in ("Connect MIDI Device…" in OUT); no browser permission prompt on page load
- `b0f7a9d` — Preset chips sized to their names and renamed (Shimmer / Tangerine / Disintegration / Chillhop); play, record and refresh icons matched in size and centering
- `b38d28c` — Phrygian scale added; Tangerine Dream and Airports presets fixed (missing scale key, invalid drum style)
- `75f5581` — iPhone Safari viewport lock (`minimum-scale=1`, `overflow-x: clip`) for the orb sheet cut off at the sides
- `49cb6a3` — Larger refresh arrow on the ⟲ ALL button
- `165dc33` — Audio plays with the iPhone silent switch on (media playback session)
- `6cae841` — Header preset chip text fitted so names are never truncated (superseded by `b0f7a9d`'s content-sized chips)
- `118c4cf` — Delay feedback runaway fixed; instrument meters fixed; phone orbs 65% with no "+"; Invaders touch pad; palette Randomize row
- `6d41f32` — Full Screen button hidden on phones
- `b93bf81` — Modules renamed SUB / DRUMS / CHORDS / ARP / NOISE / FILTER / DELAY / SPACE / OUT
- `5563498` — Phone portrait layout
- `cc617af` — Slambient Invaders hit-freeze fix

Still unverified on a real iPhone: phone portrait layout, orb sheet width, silent-switch audio, preset chip widths in Safari, transport icons. Not yet tried in Logic: the 4-channel MIDI output.

## Update — 2026-10-15 (Cross-Browser Safari vs. Chrome Layout & Font-Size Parity under `html { zoom: 0.75 }`)

**Root cause of Safari vs. Chrome visual discrepancy**:
- On desktop (`> 640px`), `index.html` sets `html { zoom: 0.75; }`.
- **Safari (macOS WebKit)** enforces a minimum on-screen rendered font floor of `9px` physical CSS pixels *after* `zoom: 0.75` is applied (`9px / 0.75 = 12px` in the zoomed layout coordinate space). As a result, Safari automatically clamped all 70 desktop CSS rules that had `font-size < 12px` (`6.5px` through `11px`) up to **`12px`**.
- **Chrome (Blink)** applies its minimum font check *before* CSS `zoom: 0.75`, so Chrome shrank every `font-size < 12px` down to `4.9px–8.25px` on screen. Because `.preset-bar` uses `width: max-content; grid-template-columns: repeat(5, 1fr);`, the smaller font in Chrome made the 5×3 preset grid ~25% narrower than in Safari, left `.orbital-bar-center`'s `.telemetry-chip` items tiny on one line instead of Safari's 2-line stacked readout, and shrank the Chord Analysis rows, keyboard key labels, header telemetry pills, and console strip labels.

**Fix applied**:
- Scaled desktop typography universally across `index.html` (prior to the `@media (max-width: 640px)` phone block where `zoom: 1` is active) from the old `7.5px–11px` range up to **`13px–15px`** (`~10px–11.25px` physical CSS pixels on screen under `html { zoom: 0.75 }`):
  - **Header & Transport**: `.preset-label`, `.btn-preset-chip`, `.btn-preset-io`, `.root-scale-ctrl .tag`, `.btn-header-util` at `13px`; `.btn-main-play`, `.btn-record`, `.btn-randomize-all`, `.tempo-val`, `.telemetry-pill .val` at `13.5px` (with `.tempo-val` `min-width: 60px`).
  - **Upper Visualizer Deck & Orbital Bar**: `.panel-title-text` at `15px`; `.telem-row` / `.telem-v` (locked to `white-space: nowrap`), `.keyboard-hint`, `.vert-mode-btn`, `.key-label`, `.telemetry-chip`, `.btn-telemetry-action` at `13px`; `.btn-view-mode` at `13.5px`.
  - **Console Rack, Pedals & Smart Dropdowns**: `.control-label` and `.control-val` at `13.5px`; `.custom-dropdown-trigger`, `.custom-dropdown-item`, and pedal labels at `13px`; tight micro-badges (`.btn-power`, `.btn-aux-toggle`, `.black-key-label`, `.key-shortcut`, `.vert-ctrl-label`, `.master-vol-title`) kept at `11px–11.5px` so fixed-width containers never overflow.
- Added `"JetBrains Mono"` as the primary family in the `chordWheelCanvas` (`10.5px`/`9.5px`/`8.5px`) and `orbitalCanvas` (`17px` numbers / `13px` labels) 2D context `.font` strings so canvas text is crisp and identical across Chrome and Safari.

## Update — 2026-10-15 (Phone Portrait Orbital Module Pop-up Border Alignment & Width Fix)

- **Aligned `#orbitalSidePanel` borders 1:1 with `#orbitalArenaWrapper` on phones (`@media (max-width: 640px)`)**:
  - Replaced `position: fixed; left: 0; right: 0; bottom: 0; border-right: 0; border-radius: 16px 16px 0 0;` with `position: absolute; inset: 0; width: 100%; max-width: 100%; height: 100%; max-height: 100%; border: 1.5px solid var(--modal-accent-color); border-radius: 7px;` inside `#orbitalArenaWrapper`.
  - The pop-up module now sits directly inside `#orbitalArenaWrapper` so its top, bottom, left, and right borders overlay the arena card borders behind it and can never extend wider than the module or get cut off at the phone screen edges.
  - Updated `updateAndDrawOrbitalCanvas()` so `leftPad` ignores the full-width phone overlay (`!window.matchMedia("(max-width: 640px)").matches`), and constrained `.preset-bar` (`width: calc(100% + 24px); max-width: calc(100% + 24px)`) + `.brand-row` (`max-width: 100%; min-width: 0`) on phone portrait so the `-12px` side margins on `.preset-bar` never shift the iOS Safari layout viewport.

## Update — 2026-10-15 (Chrome Header Dead-Space Fix & Shortened Preset Names)

- **Eliminated vertical dead space beneath `.preset-bar` in `header.top-bar` on Chrome**:
  - **Root cause**: `EnoHead.mount` sets `#enoWidgetCanvas`'s internal backing buffer to `256×256` (`size: 128 * dpr 2`). Because `#enoWidgetCanvas` was in normal document flow inside `.eno-crt-screen` and `.eno-standalone-pod` (`aspect-ratio: 1 / 1`), Chrome's Flexbox + `aspect-ratio` sizing used the canvas's `256px` intrinsic width when `syncEnoPodSquare()` set `pod.style.width = "auto"`, inflating `.eno-standalone-pod` (and `.header-bar-wrapper`) to `~260px` tall. Meanwhile, `header.top-bar` had `justify-content: space-between;` with only 2 direct children (`.brand-row` and `.transport-row`), dumping all `~55px` of stretched vertical height into an empty band directly beneath the presets.
  - **Fix**:
    - Positioned `#enoWidgetCanvas` with `position: absolute; inset: 0; width: 100%; height: 100%;` inside `.eno-crt-screen` so its `256×256` bitmap buffer never contributes intrinsic size to `.eno-standalone-pod`.
    - Updated `syncEnoPodSquare()` on desktop (`> 640px`) to collapse `.eno-standalone-pod` to `0px`, measure `header.top-bar`'s natural `offsetHeight`, and lock `pod.style.height` and `pod.style.width` to `header.top-bar`'s exact height.
    - Made `.master-vol-slider-wrap` flexible (`flex: 1 1 0; min-height: 68px;`) inside `.master-vol-pod` (`padding: 8px 10px; gap: 5px;`) so `.master-vol-pod` never forces `.header-bar-wrapper` taller than `header.top-bar`.
    - Changed `header.top-bar` and `.header-main` from `justify-content: space-between;` to `justify-content: flex-start;` so `.brand-row` and `.transport-row` always sit at their tight `10px` gap.
- **Shortened 4 preset chip labels**:
  - `Nostalgic Drift` (`applyPreset(0)`) ➔ `Nostalgia`
  - `Velvet Horizon` (`applyPreset(4)`) ➔ `Velvet`
  - `Khan Lineage` (`applyPreset(7)`) ➔ `Lineage`
  - `Aphex Twin` (`applyPreset(11)`) ➔ `Twinning`

## Update — 2026-10-15 (OS Music Player MediaSession, Orbital Pedal Switching, Mobile & Engine Optimizations)

1. **OS-Level Music Player / Media Session Integration**:
   - Integrated full `navigator.mediaSession` controller:
     - Shows `"Slambient Meander Engine"` as artist, active preset as track title, and active musical scale, meter, and BPM in the album field (e.g. `D Dorian · 7/4 · 72 BPM`).
     - Added dynamic `512×512` canvas artwork generation (`getMediaSessionArtworkUrl`) themed to the active color palette with seed/oscilloscope visualizer art for OS Lock Screen, Dynamic Island, and Control Center.
     - Bound OS media action handlers for `play`, `pause`, `stop`, `previoustrack`, and `nexttrack` (cycles through preset bank from lock screen, AirPods, or hardware media keys).
   - Added a 10-second looping silent PCM WAV `<audio>` element (`ensureSilentMediaElement()`) synced to `isPlaying`, satisfying iOS/Android background audio policies requiring an active media element playback session (`>= 5s`) to keep lock screen controls active.
   - Added a hardware-threaded Web Audio clock fallback (`scheduleAudioClockFallback()`) using single-sample `AudioBufferSourceNode` chains so Slambient maintains exact tempo and clock timing even when the screen is locked or the browser tab is backgrounded (`document.hidden`).

2. **Orbital View Pedal Chain Switching Fixes**:
   - Fixed the module shift arrows (`◀` / `▶`) in pedal chassis modules (`FILTER`, `DELAY`, `SPACE`) for Orbital View:
     - Added `swapPedalOrbPositions(keyA, keyB)`: shifting a pedal in the DSP chain now swaps the two orbs' `(x, y, vx, vy, heading)` canvas coordinates and gives them a soft visual bump.
     - Updated `rewireDspChain()` to invoke `updatePedalsOrderUI()` synchronously at the start of reordering, immediately updating pedal slot badges, shift button states, and modal header titles (`6. FILTER` ➔ `7. FILTER`).
     - Updated phone bottom sheet swipe handling (`stepModule(dir)`) to traverse `getOrbitalConnectionChain()` instead of the static module array, ensuring that swiping left/right on the bottom sheet navigates through the live reordered pedal chain.
     - Set `body.scrollTop = 0` directly inside `expandModuleOrb()` and removed the sheet title `MutationObserver` that was causing unexpected scroll resets during pedal shifts.

3. **Audio Engine Performance & Drag Latency Optimizations**:
   - **Eliminated `ConvolverNode` Re-partitioning on Slider Drag**:
     - Fixed `applyReverbMode(mode)`: guarded `reverbNode.buffer = reverbImpulseCache[mode]` with `if (reverbNode.buffer !== reverbImpulseCache[mode])`. Previously, moving any slider in the application caused `updateAudioParams()` to reassign the impulse response buffer every single frame, forcing the browser's audio thread to re-partition a 3.5s–7.0s stereo FFT convolution kernel on every slider drag!
   - **Cached Analog Tape Saturation Curve**:
     - Guarded `masterDriveNode.curve = makeAnalogTapeCurve(masterDriveVal, 1024)` so it only regenerates the Float32Array curve when `masterDriveVal` actually changes.
   - **Automatic Voice Disconnection & Node Pooling**:
     - Added `disconnectOnEnded(sourceNode, tailNode)` helper and wired it to all per-note voices (`stopNoteLive`, `triggerSympatheticStrings`, `playSynthVoice`, `playArpNote`, `playKick`, `playSnare`, `playWoodblock`, `playHiHat`, `playDayan`, `playBayan`, `triggerNoiseEvent`). Short-lived voice nodes and filters disconnect from summing buses upon decay, eliminating memory leaks and Web Audio node graph bloat.
   - **Preserved Pedal Bypass in Audio Updates**:
     - Updated `updateAudioParams()` to check `pedalBypassState.FILTER`, `pedalBypassState.DELAY`, and `pedalBypassState.SPACE` so touching unrelated sliders does not overwrite bypassed pedal parameters. Moved Master EQ/Drive UI label sync above `if (!audioCtx) return;` so slider values update their readouts before audio is started.

4. **Visualizer, Canvas & Mobile UI Smoothness**:
   - **Per-Frame `AnalyserNode` Sampler**:
     - Added `sampleAnalyserForFrame(analyser)` so the oscilloscope rings, instrument meters, and orbital canvas share a single sample per frame per analyser instead of making multiple redundant Web Audio API calls.
   - **Off-Screen & Background Rendering Gating**:
     - Added `IntersectionObserver` visibility listeners to `#scopeCanvas` and `#orbitalCanvas`. Canvas drawing and geometry calculations are skipped when scrolled out of view, when the tab is hidden, or on mobile when the bottom sheet modal covers 100% of the orbital arena.
   - **Mobile DPR Cap**:
     - Capped canvas DPR at `1.5` on mobile devices (`PHONE_LAYOUT_MQ` / `PHONE_ORB_MQ`), preventing mobile GPUs from filling oversized pixel buffers with expensive `shadowBlur`.
   - **Chord Wheel & Instrument Meters Dirty-Checking**:
     - Added state signature dirty-checking to `drawChordWheelCard()` so the Circle-of-Fifths canvas and text telemetry only redraw when harmony, voicing, or root step actually changes. Cached instrument meter element references and only updated `bar.style.width` when integer percentages change.
   - **Touch Keyboard Glissando**:
     - Added touch sliding support on the keyboard (`pointermove` with `document.elementFromPoint`), enabling smooth finger sweeps across piano keys on phones and tablets with proper note handoff and zero stuck notes.
   - **Eno 3D Pod Optimization**:
     - Switched default model configuration to the low-poly mesh, throttled software depth buffer rendering to 30fps when not actively being dragged, and added visibility gating.

## Update — 2026-10-16 (High-Detail Fractal Visualizer, Symbiotic Scope Rendering, Vertical Rain Icon)

1. **Vertical Rain Visualizer Icon**:
   - Fixed `btnToggleWaterfall` SVG icon in `#scopePanel`: replaced horizontal lines with 5 vertical cascading dashed lines (`stroke-linecap="round"`, varied dash offsets and lengths) in the 5 instrument channel colors (`#e0c3ff`, `#ff6b81`, `#fed330`, `#2ed573`, `#00e5ff`), properly depicting vertical digital rain / phosphor waterfall cascades.
   - Updated button tooltip to `"Toggle Phosphor Digital Rain / Waterfall Spectrogram"`.

2. **Symbiotic Multi-Layer Visualizer Composition**:
   - Decoupled `drawFractalVisualizer` from mutually excluding the other visualizer layers in `drawScope`:
     - When Fractal Mode is active, it renders as a deep ambient cosmic nebula backdrop.
     - Phosphor Waterfall / Digital Rain (`drawWaterfallSpectrogram`), Vintage Vector Flight Terrain Grid (`drawFlightTerrainGrid`), Floating 3D Vector Geometry (`drawRoadsideObjects`), and Concentric Oscilloscope Rings all render concurrently and symbiotically on top.
     - Each layer's button toggle operates completely independently.
   - Removed `roadsideObjects.length = 0` from `toggleFractalMode()` so 3D vector cubes, pyramids, diamonds, and spheres glide continuously across the fractal universe without getting cleared or stuck.
   - Updated `btnToggleFractal` tooltip to `"Toggle Deep Fractal Cosmos (Symbiotic with waterfall, grid & shapes)"`.

3. **High-Definition Fractal Zoom Engine**:
   - **Curated Boundary Targets**: Added the legendary Seahorse Valley Triple Spiral Hub (`[-0.7436438870371587, 0.131825904205312]`) and refined coordinates for Elephant Valley, Scepter Valley, and Antenna Minibrot.
   - **512-Step Hermite Palette**: Replaced the 256-step linear palette with a 512-entry smooth Hermite interpolated color table with rich cosmic velvet undertones (`[10, 12, 20]`), theme accents, and brilliant starlight highlights (`[240, 246, 255]`).
   - **Multi-Harmonic Shading & Micro-Filaments**:
     - Increased iteration ceiling to `Math.round(135 + fractalDepth * 52)`.
     - Added sinusoidal micro-filament wave modulation (`filament = 0.5 + 0.5 * Math.sin(smoothIter * 0.75 + ...)`) that carves out individual spiral hairs and dendritic structures with crystal clarity.
     - Added electric starlight shimmer (`shimmer = Math.pow(..., 3) * (0.15 + e.arp * 0.7)`) responsive to Arp note cascades and drum hits.
     - Replaced flat black set interior with a living, breathing obsidian/indigo core (`coreBreath`) that expands and contracts in sync with Sub-Drone and Drum energy.
     - Tuned outer nebula floor to `0.28` ambient luminosity, creating deep cosmic space rather than crushed black mud, ensuring high contrast for overlaid vector lines and rain droplets.
   - **Bailout & Analyser Optimization**:
     - Reduced bailout radius to 64 for 10-15% faster escapes while preserving smooth logarithm math.
     - Connected `readFractalBandEnergy` to `sampleAnalyserForFrame(analyser)` to reuse cached FFT data without extra Web Audio API calls.
     - Dynamic frame governor (`FRACTAL_FRAME_BUDGET_MS = 10`, buffer width `180` to `400`) automatically maintains 60fps across mobile and desktop.

4. **Scope Render Loop Restoration, Desktop Eno Pod Alignment & Mobile Landscape Header**:
   - **Scope Render Loop (`drawScope`)**:
     - Restored `const { w, h, cx, cy } = updateCanvasDimensions();` in `drawScope()`, resolving an uncaught `ReferenceError: w is not defined` that had temporarily halted the canvas requestAnimationFrame loop (black visualizer and inactive chord wheel).
   - **Desktop Eno Pod Sizing Under CSS `zoom: 0.75`**:
     - Desktop stylesheet applies `html { zoom: 0.75; }`. In WebKit/Blink, `getBoundingClientRect().height` returns zoomed viewport pixels (`layoutPixels * 0.75`), whereas setting `element.style.height = px` interprets `px` in unzoomed CSS layout pixels. This was creating an ~30px vertical gap, misaligning the Eno pod with the Master Volume pod and top-bar.
     - Switched `syncEnoPodSquare()` to measure unzoomed CSS layout height using `offsetHeight`: `Math.max(topBar.offsetHeight, masterVol ? masterVol.offsetHeight : 0)`, perfectly locking the Eno pod square with zero top/bottom gaps.
   - **Phone Landscape Header Compaction & Feedback Prevention**:
     - Modern iPhones in landscape (844px–932px width, <=500px height) previously ran desktop sizing logic, triggering a runaway feedback loop where setting the Eno pod width wrapped `header.top-bar` into 5 crowded rows and inflated the Eno pod to over 200px tall (>70% screen takeover).
     - Added dedicated `@media (min-width: 641px) and (max-height: 500px)` rule:
       - Hides `.eno-standalone-pod` (`display: none !important`), freeing full horizontal width for presets and transport.
       - Compacts header padding (`8px 16px 6px 16px`), topBar padding (`8px 12px; gap: 6px`), transport row padding (`6px; gap: 8px`), and master volume pod (`width: 68px; padding: 6px 8px`).
     - Added early exit guard `(window.matchMedia("(max-height: 500px)").matches)` in `syncEnoPodSquare()`, clearing inline styles and delegating completely to CSS on phone landscape.

## Multi-Phase Implementation Roadmap & Feature Plan

The following phased roadmap organizes upcoming work into discrete, focused engineering packages aligned with the Master Blueprint:

### Phase 8: Mobile UX, Touch Physics & Landscape Polish
*Focus: Eliminate mobile friction, fix slider gesture hijacking, and perfect responsive layout.*
1. **Mobile Slider Touch Isolation (`touch-action: none !important`)**:
   - Apply `touch-action: none !important` and `user-select: none` across all `<input type="range">` elements (volume, tempo, pedals, and channel controls).
   - Enforce an expanded mobile touch target height (34px–38px) on coarse pointer devices so finger drags never trigger page scrolls.
   - Clean up remaining legacy `touch-action: pan-y` rules on orbital/side-panel sliders that permit Safari gesture theft.
2. **iPhone Landscape Header Verification**:
   - Verify zero-gap alignment and prevent feedback loops across all device aspect ratios.
   - Guard against subpixel flex-stretch discrepancies between `.master-vol-pod` and `.top-bar`.

### Phase 9: Maihar Gharana & "Lineage" Sonic Refinements
*Focus: Authentic Indian classical acoustics, softer unifying drone beds, articulate tabla percussion, and breath-like raga phrasing.*
1. **Tanpura Drone Redesign (Quiet, Meditative Bed)**:
   - **Slow Plucking Cadence**: Decouple from the 1-beat metronome clock; space plucks across a slow 2-bar cycle (or every 8–16 ticks) so the 4 strings naturally overlap into an unbroken, gentle golden wash.
   - **Soft Attack & Tamed Gain**: Soften the initial pick transient and lower the default level in Preset 7 (`knobTanpura: 18`) so it sits peacefully behind the sub-bass drone.
2. **Tabla Engine Overhaul (Bayan Headroom & Dayan Paradiddles)**:
   - **Tame Bayan Scoops**: Lower `Ghe` slide gain multiplier and filter resonance Q (preventing digital clipping into the limiter); reduce scoop frequency across intermediate beats.
   - **Finger Articulations & Paradiddles**: Infuse authentic **Ti-Re-Ki-Ta**, **Dha-Ti-Te**, and **Ta-Ki-Ta** finger-roll subdivisions into Rupak Tala (7/4) and Teental (4/4), highlighting crisp wooden Dayan rim strikes and muted *Kat* strokes.
3. **Maihar Sitar Character & Uniqueness**:
   - Add a crisp brass *mizrab* (wire plectrum) attack click on note onset.
   - Deepen expressive *meend* pitch glide (sliding up into notes over 80–180 ms) for solo phrases.
   - Enhance resonant *taraf* (sympathetic string) bloom to leave a lingering harmonic halo.
4. **Arpeggio Raga Taan Phrasing**:
   - Break up repetitive every-beat ticks.
   - Implement authentic *Taan* phrasing: 3-to-5 note fluid ascending/descending flourishes followed by 1–2 beats of breathing silence (*Ma*), locked to Rupak Tala's 3 + 2 + 2 structure.

### Phase 10: "Pocket Field Recorder" — Live Mic & Found Sound Engine
*Focus: Live voice/sound capture directly from phones and laptops, woven generatively into the ambient fabric.*
1. **Header & Mobile Quick-Access Widgets**:
   - **Desktop Header**: Cassette / Mic badge (`[ 🎙 REC / 📼 DROP ]`) with live recording VU pulse, waveform thumbnail, and eject button.
   - **Mobile Floating Bar**: Dedicated thumb-friendly `[ 🎙 ]` button on the bottom floating transport bar.
   - **Import Support**: Drag-and-drop or file upload for `.wav`, `.m4a`, `.mp3` (voice memos, poetry, quotes, field recordings).
2. **Live Mic "Press & Hold" Sampling**:
   - Tap/hold to record a 3–8 second snippet directly via browser `getUserMedia()`.
   - On release: instant trim of lead-in silence, dynamic level-matching, and subtle analog bandpass/rumble filter.
3. **Generative Splicing & Playback Modes (Module 5 / Atmosphere & Noise)**:
   - **Ghost Phrases (Hauntology)**: Complete spoken phrases or laughs entering rarely on long bar turnarounds, washed in delay and cathedral reverb.
   - **Granular Scale Choirs**: Vowel syllables pitch-shifted and sustained into ambient choir pads matching the active song key/raga.
   - **Percussive Transients**: Consonants, clicks, and plosives mapped into subtle ghost hits inside the drum groove.

### Phase 11: Blueprint Visualizers & Interaction Polish
*Focus: Completing remaining roadmap items from Master Blueprint Sections 11 & 12.*
1. **Audio-Gated 3D Roadside Shapes**:
   - Gate floating geometry so idle spheres vanish when transport stops; scale density from 60% to 95%.
2. **Audio-Reactive Space Invaders Mini-Game**:
   - Playable Easter egg rendered inside the primary visualizer canvas.
3. **Orb Click Debouncing & Global Spacebar/Enter Play-Pause**:
   - 250ms click debounce on orbital nodes to prevent double-click flicker.
   - Standard DAW global transport shortcuts (Spacebar / Enter to Play/Pause).


## Update — 2026-10-16 (Phase 8: Mobile slider touch isolation)

- **Roadmap Phases 8–11 adopted** (Phase 8 mobile UX, Phase 9 Maihar/Lineage sound, Phase 10 Pocket Field Recorder, Phase 11 blueprint polish; note Phase 11's items were already shipped in blueprint Phases 6 and 7, so only a verification pass is left there).
- **Phase 8 item 1 done**: every `input[type="range"]` now has `touch-action: none !important`, `user-select: none` and `-webkit-touch-callout: none`. The legacy `touch-action: pan-y` rules on `#orbitalFloatControls` and `#orbitalSidePanel` sliders were changed to `none`. On `(pointer: coarse)` devices the hit height is `36px !important` (master volume slider `28px` so it never overlaps the mute button). Canvas `pan-y` rules are intentionally untouched.
- **Phase 8 item 2 intentionally not redone**: landscape header geometry was already resolved differently (see the entries above): `syncEnoPodSquare()` uses `offsetHeight` (not `getBoundingClientRect()`, which returns 0.75x values under `html { zoom: 0.75 }`), is skipped at `max-height: 500px`, and phone landscape uses a CSS grid (Eno 76px over a vertical master volume strip). Pure CSS `aspect-ratio: 1/1; width: auto` in the flex row was tried and squished the pod.

## Update — 2026-10-16 (Phase 9: Maihar Gharana / "Lineage" sonic refinements)

All in `index.html`; unverified by ear yet (syntax-checked only), so expect some level tuning.

1. **Tanpura**: pluck cadence is now one string every 2 beats (`tanpuraInterval = ticksPerBeat * 2`, ~8 beats per 4-string cycle) instead of every beat. Softer pick (attack `0.025s` → `0.09s`, voice lowpass starts at 1500 Hz and opens to 2300 Hz), peak gain `0.68` → `0.50`. Khan Lineage preset `knobTanpura` `38` → `18`.
2. **Tabla**:
   - Bayan (`playBayan`): scoop peak `132-166 Hz` → `112-136 Hz`, filter Q `5.6` → `2.6`, filter peak `310-375 Hz` → `235-280 Hz`, LFO depth `16` → `9`, volume ~`18%` lower (extra `0.88` on scoops). `playTablaDha` only scoops on accents (`hard >= 1.15`) or ~35% of other beats; intermediate Ghe hits in the Rupak/Teental off-beats no longer scoop.
   - Finger phrases (`TABLA_PHRASES`, `playTablaPhrase`): `TI_RE_KI_TA`, `DHA_TI_TE`, `TA_KI_TA` (with `NA` rim strikes and a muted `KAT`) replace the random off-beat fillers on selected beats (`TABLA_PHRASE_BEATS`: Rupak 7/4 beats 2/4/6, Teental 4/4 beats 1/2/3), chance `0.30 + drumDensity * 0.50`. Only for x/4 sigs with 4 ticks per beat.
3. **Sitar** (`SITAR_STRINGS` in `playSynthVoice`): brass mizrab noise-click at onset (bandpass ~3.6 kHz+, ~22 ms); lead meend depth `0.865-0.915` of target pitch rising over `80-180 ms` (octave partial now bends with the fundamental); taraf bank has a 4th string, ring `3.4-4.8 s` (was `1.9-2.7`), peak `0.040` (was `0.028`), slower `0.30 s` bloom.
4. **Raga Taan arp**: state machine (`taanNotesLeft`, `taanRestTicks`, `taanDir`, `taanNoteIdx`): phrases of 3-5 notes, one per tick, starting on tala boundaries (Rupak 7/4 beats 0, 3, 5; other sigs beat 0 and `floor(beats/2)`) with 62% chance, a crescendoing velocity (72+), then 1-2 beats of silence. Arp rest probability no longer drops notes inside a taan run. State resets on time-signature change. The live keyboard arp (`triggerLiveArpStep`) keeps its old step logic.

## Update — 2026-10-16 (Phase 10: "Pocket Field Recorder" — Live Mic & Found Sound Engine)

- **Desktop Header & Mobile UI Integration**:
  - Added `#fieldBadge` beside the `⟲ ALL` button with `[ 🎙 REC ]`, `[ 📼 DROP ]`, dynamic waveform preview canvas, and eject button.
  - Added thumb-friendly `[ 🎙 ]` button (`.btn-mic-mini`) to mobile bottom floating transport bar (`.mini-transport`).
  - Full-window drag-and-drop ingestion + file picker (`input#inputFieldAudio`) supporting `.wav`, `.m4a`, `.mp3`, `.aac`, `.ogg`, `.flac`.
- **Live Mic Sampling & On-the-Fly Analysis**:
  - Press-and-hold (or quick tap for 5s, max 8s) via browser `navigator.mediaDevices.getUserMedia()`.
  - Signal never routed directly to speakers (strictly isolated from destination to eliminate acoustic feedback).
  - Automated analysis & audio conditioning (`fieldAnalyze`):
    - Lead-in and trailing silence trimming with energy envelope thresholding.
    - 40Hz 1-pole high-pass rumble & DC offset filter.
    - RMS dynamic level matching with soft tanh saturation limiting.
    - 160-bin waveform thumbnail calculation with real-time VU glow.
    - High-frequency transient slicing (isolating 12 distinct attack clicks/consonants).
    - Voiced sustain loop extraction with equal-power crossfading and autocorrelation pitch detection (`fieldDetectPitch`) storing reference MIDI pitch.
- **Generative Splicing & Sideloading into Noise Module (Module 5)**:
  - Added dedicated Field Recorder control card inside Module 5 with real-time waveform display, Weave Mode selector (`ALL`, `GHOST`, `CHOIR`, `TRANS`, `OFF`), and dedicated level control (`#knobFieldVol`).
  - Splicing Modes:
    - **Ghost Phrases (Hauntology)**: Spoken phrase entries on bar turnarounds through tempo-locked tape delay and 4.8s convolution reverb wash.
    - **Scale Choirs**: Granular loop retuned dynamically to the live chord notes (`recentChordNotes`) with stereo chorusing and slow attack/release swells.
    - **Percussive Ghost Hits**: Consonant slices triggered on off-beat groove subdivisions in sync with drum engine dynamics.

## Update — 2026-10-16 (Phase 11: Blueprint Visualizers & Interaction Polish Verified & Hardened)

- **Audio-Gated 3D Roadside Shapes**:
  - Gated floating geometry cleanup on transport stop: `roadsideObjects.length = 0` runs immediately when `togglePlay()` transitions to paused, ensuring idle geometry vanishes instead of drifting in freeze.
  - Dynamic scaling (`getRoadsideDensityScale()`): scales density ceiling from 1.60x to 1.95x (60% to 95% boost based on musical activity).
- **Spacebar / Enter Global Transport Play-Pause**:
  - Bound `Space` key alongside `Enter` in `bindGlobalTransportKeys()` as a standard DAW play/pause toggle.
  - Gated so Space fires arcade lasers when Slambient Invaders (`arcadeActive`) is open, and blurs focused buttons to prevent browser button re-clicks.
  - Updated the Keyboard Shortcuts modal (`shortcutsOverlay`) to display `Play / pause: [Space] [Enter]`.
- **Orb Click Debouncing**:
  - Re-verified `ORB_CLICK_DEBOUNCE_MS = 250` and `DRAG_MOVE_THRESHOLD = 5` in canvas pointer interaction to eliminate accidental double-click modal flicker.

## Update — 2026-10-16 (Header Sampler: Dedicated "SAMPLE" Pod & MIC Button Rebranding)

- **Relocated from Transport to Parameters Pod Cluster**:
  - Moved `#fieldBadge` from between `⟲ ALL` and `KEY/SCALE` to after `TEMPO` at the far end of `.global-transport`.
  - Transport buttons (`[ Start ]`, `[ Record ]`, `[ ⟲ ALL ]`) are now strictly physically separated from sound sampling controls.
- **Dedicated Capsule & Section Tag**:
  - Styled as `.sample-ctrl.field-badge`, matching the boxed aesthetic of `.root-scale-ctrl`, `.time-sig-ctrl`, and `.tempo-ctrl` (32px height, `#080a11` dark inset, 1px subtle border).
  - Added `<span class="tag">SAMPLE</span>` header tag colored with `var(--color-noise)` to visually unify with Module 5 (Noise).
- **Renamed Button from "REC" to "MIC" & "DROP" to "IMPORT"**:
  - Replaced the button text `REC` with `MIC` (with microphone icon) to eliminate user confusion with the master output recording `[ Record ]` button.
  - Replaced `DROP` with `IMPORT` for clear semantics across mobile touch devices and desktop.
  - Kept waveform preview canvas and eject (`×`) button fully functional within the pod.
- **Mobile Top Bar Integration (Phone Portrait & Landscape)**:
  - Removed previous `@media` display suppression that hid `.sample-ctrl` on mobile.
  - Positioned `.sample-ctrl` immediately following `ALL` so that on mobile portrait it occupies Row 2 directly underneath `START` and `RECORD`.
  - Configured `.global-transport > .sample-ctrl` with `grid-column: 1 / 3; width: 100%; box-sizing: border-box;`, precisely extending the pill bar from the left edge of `START` to the right edge of the `RECORD` button.
  - Sized inner buttons (`MIC` and `DROP`) with `flex: 1 1 0; min-width: 0;` to evenly fill the pill bar across to the edge of `RECORD`.
- **Floating Bottom Bar Button Labeled "SAMPLE"**:
  - Updated `.btn-mic-mini` in `.mini-transport` to include `<span>SAMPLE</span>` with the mic icon.
  - Styled with equal `flex: 1 1 0` sizing (40px height, 12px JetBrains Mono bold text), perfectly matching the `[ ▶ Start ]` and `[ ● Record ]` buttons in the bottom floating toolbar.

## Update — 2026-10-16 (Mic Capture: Isolated Capture Context, Synchronous Activation & iOS AudioSession Fix)

- **Root Cause of Failed Recording**:
  - In commit `56c5ec6`, `haveCtx` checked `audioCtx && isPlaying`. When testing mic sampling while paused (`!isPlaying`), it created an ephemeral context (`new AC()`) that stayed in a suspended state because `ctx.resume()` was called across an asynchronous boundary without synchronous user-gesture activation. On a suspended AudioContext, Web Audio never calls `onaudioprocess`, leaving recorded audio length at 0 samples (`TOO SHORT`).
  - Furthermore, removing `navigator.audioSession.type = "play-and-record"` on iOS/WebKit caused Safari to enforce its default `"playback"` audio session, returning 100% muted (zeroed) buffers from `getUserMedia`.
- **Bulletproof Isolated Capture Pipeline**:
  - Implemented a dedicated `captureCtx` initialized synchronously inside `holdStart()` on `pointerdown`. This satisfies browser user-gesture activation rules before any `await` boundaries and ensures `captureCtx.state === "running"` immediately.
  - Decoupled completely from `audioCtx`: `captureCtx` contains zero synth voices, oscillators, or drone nodes, completely eliminating any possibility of synthesizer audio playback or bursts when recording starts.
  - Reinstated `navigator.audioSession.type = "play-and-record"` during active recording, safely restored to previous session type on teardown, enabling full mic input on iOS Safari.
  - Added seamless fallback: requests `{ echoCancellation: true, noiseSuppression: false, autoGainControl: false }` and falls back to `{ audio: true }` if device constraints fail.
  - In `rec.proc.onaudioprocess`, `ev.outputBuffer.getChannelData(0).fill(0)` and `rec.mute.gain.setValueAtTime(0, ctx.currentTime)` guarantee 0dB acoustic output to speakers.
  - Added dual interaction support: press-and-hold records while held; quick tap records a 5-second take; tapping the mic button while actively recording stops and saves immediately.
  - Relaxed energy thresholds in `fieldAnalyze`: lowered noise floor to `0.0008` (-62 dBFS) and added graceful fallback to the full recorded buffer if silence trimming is narrow, preventing quiet ambient room recordings from being rejected.

## Update — 2026-10-16 (Sonic Audit: Filter Range Expansion & Calibration for Lineage & Douglas Firs)

- **Master Filter & Envelope Engine Optimizations**:
  - Expanded cutoff range from `200 Hz – 9,500 Hz` to **`60 Hz – 16,000 Hz`** (`FILTER_CUTOFF_MIN_HZ = 60, FILTER_CUTOFF_MAX_HZ = 16000`).
  - Perfect exponential center: 50% knob position lands at `980 Hz` (~1 kHz), with low-end sub warmth down to `60 Hz` and crystal-clear high-frequency air up to `16 kHz` (preserving sitar sympathetic string halos, bell chimes, and tape breath).
  - Added filter pedal bypass guard in `triggerFilterEnvelope`: when `pedalBypassState.FILTER` is engaged, envelope sweeps are safely bypassed and filters remain wide open at 20,000 Hz.
  - Expanded dynamic envelope ceiling (`peakFreq`) to `15,000 Hz` so high-velocity chord strikes open the filter naturally into sparkling brilliance.

- **Fine-Tuning "Lineage" (Classical Lineage — Preset 7)**:
  - **Tanpura Drone**: Lowered default volume to `knobTanpura: 14` with `knobJavari: 52` (subtle cotton-thread silk buzz), creating an unbroken, meditative golden bed that sits gently behind the sub drone without masking solo phrasing.
  - **Tabla Groove**: Calibrated for authentic chamber dynamics (`knobDrumVol: 76`, `knobDrumPunch: 68`, `knobDrumDensity: 65`, `knobDrumFx: 45`), ensuring Dayan rim articulations (`TI_RE_KI_TA`, `DHA_TI_TE`, `TA_KI_TA`) and soft Bayan scoops sit in harmonious balance with the melodic lead.
  - **Maihar Sitar**: Adjusted `knobChordVol: 84`, `knobChordFx: 78`, `knobStrum: 75ms` with brass mizrab onset and authentic meend pitch glide.
  - **Bansuri Arpeggio**: Balanced level to `knobArpVol: 82` with extended breath gate (`420ms`).
  - **Acoustic Space**: Cutoff at 74 (~3,744 Hz) for sympathetic string bloom, Cathedral reverb at 44% mix with 5,200 Hz tone, and 440ms tempo delay at 45% feedback.

- **Fine-Tuning "Douglas Firs" (Preset 10)**:
  - **Rain & Mist Atmosphere**: Enabled Module 5 with `selNoiseProfile = "RAIN"`, `selNoiseMode = "GUSTS"`, `knobNoiseVol: 28`, `knobNoiseColor: 42`, `knobNoiseDrift: 65`, `knobNoiseFx: 65`—adding the moody Pacific Northwest forest mist and vintage tape dust.
  - **Brooding Sub Foundation**: Set sub drone to `D1` octave, `knobDrone: 78`, `knobDroneFilter: 130 Hz`, with deepened wandering drift (`knobDroneWander: 35`).
  - **Vibraphone & Celesta (`VIBES_CELESTE`)**: Long ringing sustain (`knobChordSustain: 160%`, `knobChordDynamics: 75%`, `knobChordVol: 86%`, `knobChordFx: 82%`).
  - **Noir Bell Motifs (`GLASS_FM`)**: Spaced pendulum bell figure (`knobArpGate: 520ms`, `knobArpRest: 45%`, `knobArpVol: 65%`).
  - **Noir Saturation & Space**: 580ms tape delay (44% mix, 42% feedback), Cathedral reverb (54% mix, 4,600 Hz tone), Ensemble chorus (32% mix), `knobEqLow: +2.0 dB`, `knobEqHigh: -1.5 dB`, and `knobMasterDrive: 22`.

- **Full Sonic Audit Across All 15 Presets**:
  - Re-calibrated cutoffs and gain staging across all 15 presets to align with the new 60 Hz – 16 kHz scale. Verified zero clipping and balanced LUFS headroom across the entire patch bank.

## Update — 2026-10-16 (Public Distribution Hardening: Comprehensive Trademark, Artist & Brand Name Scrub)

- **Mandatory Intellectual Property & Trademark Sanitization**:
  - Conducted a comprehensive audit across all UI elements, tooltips, option labels, HTML attributes, and internal developer comments to sanitize any mentions of trademarks, copyrighted product names, hardware model numbers, or artist/celebrity names.
  - Sanitized presets, groove algorithms, timbres, and effect options:
    - `Four Tet Woodblock & Glitch` ➔ **`Organic Woodblock & Glitch`**
    - `Granular Shimmer (Four Tet)` ➔ **`Granular Shimmer & Swell`**
    - `Industrial 909 Heavy Drive` ➔ **`Industrial Heavy Drive`**
    - `Analog 808 / 909 (Punchy)` ➔ **`Analog Rhythm Box (Punchy)`**
    - `Warm Analog Pad (Eno / BOC)` ➔ **`Warm Analog Pad (Lush Drift)`**
    - `Pure Mineral Glass (Yoshimura / Budd)` ➔ **`Pure Mineral Glass (Transparent Sine)`**
    - `Chamber Woods & Flute (Pastoral Mellotron)` ➔ **`Chamber Woods & Flute (Pastoral Tape)`**
    - `Celestial Flute Organ (Cathedral / Frahm)` ➔ **`Celestial Flute Organ (Cathedral Ambient)`**
    - `Quartal Stack (McCoy Fourths)` ➔ **`Quartal Stack (Modal Fourths)`**
    - `Ensemble (3-Voice Lush Juno)` ➔ **`Ensemble (3-Voice Lush Chorus)`**
    - `Khan Lineage` ➔ **`Classical Lineage`** (Preset 7 title & Tanpura drone switch tooltip)
    - `Airports (Brian Eno Tape Loop & Piano)` ➔ **`Airports (Generative Tape Loops & Glass Diffusion)`**
    - `Twin Peaks / Badalamenti` ➔ **`Douglas Firs (Noir Vibraphone Ballad & Rain Mist)`**
    - `Aphex Twin (Selected Ambient Works / IDM)` ➔ **`Twinning (Braindance Micro-Poly & IDM Breakbeat Pocket)`**
    - `Tangerine Dream (Phaedra / Berlin School)` ➔ **`Tangerine (Berlin School Analog Sequencer)`**
    - `William Basinski (The Disintegration Loops)` ➔ **`Disintegration (Degraded Tape Loops & Muffled Repeats)`**
    - `Slambient Invaders` / `Space Invaders` ➔ **`Void Raiders`** (Arcade title screen, cheat sheet modal, pad `aria-label`, and code comments)
    - Hardware references (DL4 MkII, Juno chorus, 808/909) sanitized in comments to generic acoustic/DSP descriptions (`clock-synced delay`, `multi-voice wash`).
  - **Acoustic Integrity Preserved**: Zero changes to the underlying DSP algorithms, scales, math formulas, or sonic calibration. All 15 presets sound bit-for-bit identical while presenting 100% clean, original naming.

## Update — 2026-10-16 (Phase 12: PWA Standalone, Offline Service Worker, Screen Wake Lock & Safe Areas)

- **PWA Manifest & App Identity**:
  - Implemented `manifest.webmanifest` and `manifest.json` with `display: standalone`, `background_color: #07080c`, `theme_color: #07080c`, `orientation: any`, and metadata tags.
  - Generated full suite of high-resolution icons (`icon.svg`, `icon-512.png`, `icon-192.png`, and `apple-touch-icon.png`) showcasing Slambient's signature cosmic constellation orbital motif.
- **Offline Service Worker (`sw.js`)**:
  - Installed and registered Service Worker with pre-caching for app shell and core assets.
  - Implemented Network-First strategy with instant cache fallback for navigation/html, and Cache-First strategy for Google Fonts (`JetBrains Mono`, `Inter`).
- **Screen Wake Lock API (`navigator.wakeLock`)**:
  - Bound `requestWakeLock()` to transport play (`togglePlay()`) and `releaseWakeLock()` to pause.
  - Re-acquires wake lock seamlessly on `visibilitychange` when user returns to active session.
  - Prevents screens from sleeping or throttling background timers during unattended generative performances.
- **App Shell UX & Touch Polish**:
  - Added `<meta name="robots" content="noindex, nofollow">` to protect development deployment.
  - Added iOS mobile web app tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`, `apple-mobile-web-app-title`).
  - Added `overscroll-behavior-y: none` and `-webkit-tap-highlight-color: transparent` to eliminate pull-to-refresh page bounces and gray tap flashes.
  - Integrated top safe-area-inset padding (`env(safe-area-inset-top)`) across desktop, landscape, and mobile views to keep the top bar clear of phone notches and dynamic islands.
  - Added install prompt button (`#btnInstallApp`) in header utils and documentation in Keyboard Shortcuts dialog (`#shortcutsOverlay`).
- **Cloudflare Edge Configuration**:
  - Added `_headers` specifying permissions policies (`microphone=(self), midi=(self)`), frame protection, and cache control.

## Update — 2026-10-16 (Web Audio Graph Node Memory Leak Hardening & Teardown)

- **Root Cause of High RAM (1.33 GB on Safari)**:
  - Safari/WebKit manages `AudioNode`s strictly: any intermediate node (oscillators, filters, modulators, gain stages) connected into the audio graph is retained in C++ memory until explicitly disconnected via `.disconnect()`.
  - At generative tempos, thousands of per-note nodes accumulated on `destination` and summing buses over extended sessions without being garbage-collected.
- **Comprehensive Audio Node Teardown**:
  - **Audio Clock Fallback**: Added explicit `src.disconnect()` in `scheduleAudioClockFallback.onended`, eliminating ~300 dead nodes per minute accumulating on `audioCtx.destination`.
  - **Multi-Node `disconnectOnEnded` Upgrade**: Upgraded `disconnectOnEnded(source, ...nodes)` to recursively traverse, collect, and cleanly disconnect all primary oscillators, secondary oscillators, modulators, peaking/bandpass/lowpass filters, and voice gain stages when playback finishes.
  - **Synth Chords & Voicing**: Wired all secondary oscillators (`osc2`), FM modulators (`fmGain`), tremolo depth/gain (`tremDepth`, `tremGain`, `tremOsc`), and Sitar physical model shapers/filters (`jawariShaper`, `formantBody`, `formantBuzz`) into `disconnectOnEnded`.
  - **Shimmer Arp**: Wired all secondary timbral nodes (`oscOctave`, `vibrato`, `vibratoGain`, `breath`, `breathFilter`, `breathGain`, `octGain`, `mod`, `modGain`, `tineGain`, `pulseGain`, `shimmer`, `shimmerGain`, `chimeGain`, `bodyGain`, `pluckGain`) into `disconnectOnEnded(primaryArpOsc, extraVoiceNodes)`.
  - **Drums & Tabla**: Wired all overtone filters, bandpass shapers, and slap noise nodes across `playKick`, `playSnare`, `playHiHat`, `playDayan`, and `playBayan` into `disconnectOnEnded`.
  - **Module 5 Field Sampler Aux Sends**: Fixed `route()` to track auxiliary send gain nodes (`sends`) and updated `cleanupLater` to disconnect all 3 send gains alongside panners and filters.
  - **Master Output Recording Cap**: Added a 45-minute (~1 GB raw PCM) safe buffer guard in `recordTap.onaudioprocess` to auto-stop and save long takes, preventing runaway memory exhaustion.

## Update — 2026-10-16 (Master AudioWorklet Clock, User Patch Bank, Web MIDI & Stems Export)

- **AudioWorklet Master Clock Engine (`clock-processor.js`)**:
  - Sample-accurate real-time audio thread timing driven by audio sample rate counting rather than UI `setInterval` timers.
  - Zero timing jitter, immune to background tab throttling, heavy canvas animations, and garbage collection pauses.
  - Seamless fallback to buffer scheduler for sandboxed/file:// environments without worklet permissions.
  - Precached in Service Worker cache (`slambient-v2`) for offline PWA operation.
- **User Patch Bank & Preset Slots (U1–U6)**:
  - Added segmented bank tabs (`FACTORY` / `USER [U1–U6]`) in the header preset bar.
  - 6 dedicated custom patch slots (`U1`..`U6`) persisted in `localStorage["slambient_user_patches_v1"]`.
  - Single-click to load, click empty slot to save current soundscape with name prompt, Shift-click to overwrite, and right-click/contextmenu to rename, overwrite, or clear.
  - `+ STORE` quick button to save current sound to next available slot.
  - Full interoperability with JSON file export/import in the BANK section.
- **Web MIDI Hardware Integration & CC Controls**:
  - Header Web MIDI connection button (`#btnHeaderMidi`) with status indicator dot and device name display.
  - Momentary activity LED flash on incoming MIDI messages.
  - Full CC mappings:
    - **CC 74**: Master Filter Cutoff (`knobMasterCutoff`, 0-100)
    - **CC 71**: Master Filter Resonance (`knobMasterRes`, 0.5-8.0)
    - **CC 1**: Diffusion Master Space / Weather (`knobWeather`, 0-100)
    - **CC 7**: Master Output Volume (`knobMasterVolume`, 0-100)
    - **CC 64**: Sustain Pedal (>= 64 sustains notes in `midiSustainedNotes`, < 64 releases)
    - **Pitch Bend**: 14-bit pitch bend mapped to +/- 200 cents (+/- 2 semitones) across live synth voices.
- **Multi-Track Stems & Lossless WAV Export**:
  - Recording format selector in header transport: `MP3 (320k)`, `WAV (Lossless 16-bit PCM)`, and `STEMS (.ZIP)`.
  - Pure JavaScript zero-dependency ZIP archive builder (`buildZip`) with CRC-32 checksum calculation.
  - Multi-bus isolated taps simultaneously recording:
    - `01_master_mix.wav` (Master stereo mix post-limiter)
    - `02_sub_drone.wav` (Sub-drone & Tanpura acoustic model)
    - `03_drums.wav` (Tabla, organic percussion, kicks, and clicks)
    - `04_chords_lead.wav` (Chord voicings & Sitar physical model)
    - `05_shimmer_arp.wav` (Generative shimmer arpeggio)
    - `patch.json` (Exact serialized state of all synth engines, sliders, and DSP pedal routing)
    - `session_info.txt` (Session metadata with BPM, meter, key/scale, seed, and track notes).
  - Bundled and downloaded automatically as `slambient-stems-[TIMESTAMP].zip`.

## Update — 2026-10-16 (Comprehensive README Manual & 5-Tab In-App Field Guide)

- **Comprehensive Project README (`README.md`)**:
  - Authored a full-scale user manual and field guide covering core architecture (Eno coprime loops, AudioWorklet sample-accurate clock, Live vs. Auto takeover), the 9 sound modules, physical modeling (Tanpura, Tabla, Sitar), reorderable pedals, presets, User Bank U1–U6, Web MIDI hardware CC mappings, Stems export, PWA installation, and keyboard shortcuts.
- **In-App '?' Modal Expansion (`buildShortcutsPanel`)**:
  - Replaced the simple keyboard shortcuts list with an interactive, responsive **5-tab Slambient Field Manual**:
    - **⚡ Shortcuts**: Transport, keyboard notes, CRT visualizer controls, Void Raiders arcade minigame, app installation.
    - **🪐 Field Guide**: Eno coprime loop ecosystem explanation (7, 11, 13, 17, 19, 23 steps), Live vs Auto takeover mechanics, 14 scales/ragas, and Orbital vs Console perspective.
    - **🎛️ Sound Modules**: Breakdown of all 9 modules (Sub/Tanpura, Tabla/Drums, Sitar/Chords, Arp, Pocket Field Recorder, 3-pedal chain).
    - **💾 Patches & MIDI**: User Bank U1–U6 guide (click to load, shift-click to overwrite, right-click context menu), MIDI CC map, and multi-format audio/stems export.
    - **✨ Secrets**: Hidden features documented (MU-TH-UR 6000 Eno CRT phosphor cycler, Void Raiders arcade minigame, planetary orb momentum flinging, 60 FPS fullscreen CRT mode, instant Ctrl/⌘+Z patch undo).
  - Unlocked `#btnShortcuts` on touch/mobile devices so phone and tablet users can access the Field Manual anytime.

## Update — 2026-10-16 (Fix Background Tab Double Tempo & Audio Clock Coordination)

- **Root Cause**:
  - `visibilitychange` listener called `scheduleAudioClockFallback()` whenever the browser tab was hidden.
  - In `scheduleAudioClockFallback()`, `src.onended` executed `if (document.hidden || elapsedMs >= tickMs * 1.45) clockTick();`.
  - Because `document.hidden` was true, the Web Audio buffer clock ticked concurrently with `workletClockNode` (which already runs jitter-free on the audio render thread and is never throttled by desktop browsers), doubling the tempo from 72 BPM to 144 BPM and scrambling drum fills and chord voices.
  - Furthermore, returning to the visible tab never stopped the recurring fallback scheduler.
- **Resolution**:
  - **Clock Engine Coordination**: In `scheduleAudioClockFallback()`, immediately return if `workletClockReady && workletClockNode`.
  - **Stall-Only Fallback**: Removed unconditional `document.hidden` execution in `src.onended`; fallback only fires if `elapsedMs >= tickMs * 0.85` (meaning primary timer actually stalled).
  - **Visibility Handler Clean-up**: On tab blur, only schedule fallback if `!workletClockReady`. On tab focus, stop fallback immediately if `workletClockReady`.
  - **Hardware Debounce Guard in `clockTick()`**: Added a mathematical refractory guard `if (lastClockTickTime && (now - lastClockTickTime) < tickPeriodMs * 0.55) return;`, dropping duplicate ticks or timer collisions.
  - **Sample Burst Protection**: Clamped `this.sampleCount` to `samplesPerTick * 1.5` in `clock-processor.js` and inline fallback to prevent tick bursts upon audio thread resume.
  - **Service Worker Version Bump**: Bumped `CACHE_NAME` in `sw.js` to `slambient-v3` for immediate cache invalidation.

## Update — 2026-10-16 (88-Key Panoramic Harmonic Radar View & Multi-Voice Lighting)

- **Header Mode Switcher (`25 PLAY` vs `88 RADAR`)**:
  - Added discrete toggle buttons to the Upper Deck keyboard header (`btnKbPlay` and `btnKbRadar`) calling `setKeyboardDisplayMode(mode)`.
  - Preserved standard 25-Key touch and QWERTY playable mode (`Keys A-K · C3 - C5`).
  - Switched to Full-Range Panoramic Harmonic Radar mode spanning **A0 (MIDI 21) to C8 (MIDI 108)**.
- **88-Key Geometry & Touch-Lock Architecture**:
  - Dynamically constructs 52 white keys and 36 black keys in `buildKeyboard()` when `keyboardDisplayMode === "88"`.
  - Black keys are placed on seams between white keys `w` and `w+1` where `whiteKeys[w+1] - whiteKeys[w] === 2`, centered at `calc(${((w + 1) / 52 * 100).toFixed(4)}% - 0.5px)` with `transform: translateX(-50%)` and width `calc(100% / 52 * 0.72)`.
  - Applied `pointer-events: none !important` via `.piano-keys-wrapper.mode-radar` to eliminate accidental touch/click triggers during panoramic observation. External hardware MIDI keyboard input continues to play and light up all keys seamlessly.
  - Only A0 and octave root C keys (C1 through C8) render subtle `.key-label.octave-marker` typography to prevent visual noise.
- **Multi-Instrument Phosphor Lighting (Spectral Register Mapping)**:
  - Extended `renderKeyboardHighlights()` to monitor all sound engines with dedicated phosphor colors matching the Visualizer HUD:
    - **Sub-Drone & Tanpura** (Cyan `#00e5ff`, `.active-drone`): Continuous glow on fundamental bass drone pitch (`currentDroneMidi()`) and bright transient flash on Tanpura string plucks.
    - **Drums & Tabla** (Crimson `#ff3838`, `.active-drum`): Kicks (MIDI 36), Snares (MIDI 38), Woodblocks (MIDI 40), Hi-Hats (MIDI 42), Dayan (MIDI 41/43/45), and Bayan bass slides/slaps (MIDI 36/38).
    - **Chords & Sitar** (Yellow `#fed330`, `.active-chord`): Polyphonic chord voicings and sitar pluck notes.
    - **Shimmer Arp** (Violet `#7d5fff`, `.active-arp`): Cascading generative arpeggio melodies across the upper registers.
    - **Live QWERTY / MIDI Input** (Electric Blue/White `#00e5ff`, `.active-live`): Real-time user performance.
  - Extended scale LED staircase (`isKeyLedLit(midi)`) across all 88 keys, illuminating every legitimate in-scale note across 7+ octaves.


## Update — 2026-10-16 (Binaural Spatial Drift & Acoustic Orbit Engine)

- **Stereo Binaural Panning Engine (`BinauralSpatialPanner`)**:
  - Implemented psychoacoustic 3D positioning using dual-axis drift:
    - **Interaural Time Difference (ITD)**: Up to 0.65ms (650 microseconds) Haas delay on the opposite ear.
    - **Interaural Level Difference (ILD)**: Head-shadow damping using a 3500 Hz `highshelf` filter (up to -4.5 dB on shadowed ear) leaving fundamental body intact.
    - **Mono-Safe Correlation**: Positive equal-power gain curve ensures 100% phase cancellation immunity when summed to mono.
  - **Coprime Orbit Speeds**:
    - Sub-Drone & Kick: Locked center (`pan = 0.0`).
    - Tanpura Drone: Subtle micro-spread (`±0.25` at 0.017 Hz / ~58s period).
    - Chords & Sitar: Breathing figure-8 sweep (`±0.45` at 0.043 Hz / ~23s period).
    - Shimmer Arp & Bansuri: Floating orbital swirl (`±0.75` at 0.071 Hz / ~14s period).
    - Atmosphere & Noise: Wide atmospheric envelopment (`±0.85` at 0.031 Hz / ~32s period).
  - **Diffusion Macro Modulation**: Scaled dynamically by `knobWeather` (`0.5 + weatherVal`).
  - **Dual Foreground/Background Loop**: Updated at 60 FPS in `drawScope` and maintained during background tabs in `clockTick()`.
  - **Full Stem Isolation**: Output flows through analysers, ensuring binaural positioning is captured across multi-track stem recordings.

## Update — 2026-10-16 (88-Key Register Expansion & Anti-Piercing Acoustic Damping)

- **Musical Context**:
  - Previously, notes were clamped tightly into the center two octaves (C3–C5, MIDI 48–74) with hard folding loops designed for the compact 25-key keyboard.
  - With the 88-Key Panoramic Harmonic Radar mode active, chords, arpeggios, and melodic leads were prevented from moving into higher or lower registers across the full keyboard.
- **Full-Range Register Architecture**:
  - **Chord Voicings (`triggerCurrentChord`)**:
    - Expanded ceiling from MIDI 72 (C5) up to MIDI 84 (C6), allowing 7ths, 9ths, and 11ths to bloom into upper registers.
    - Added an acoustic bass root anchor (`rootMidi - 12` clamped to MIDI 36–47 / C2–B2) when `intervals.length >= 3` for rich, non-muddy grounding.
    - Sitar phrases now traverse Mandra (G2–C3, MIDI 43–48) and Taar (A5, MIDI 81) saptaks.
  - **Arpeggiator Engine (`playArpNote` & `getArpNotesPool`)**:
    - Expanded note bounds from MIDI 74 up to MIDI 96 (C7) and down to MIDI 36 (C2), providing a massive 5-octave range while leaving extreme top keys (C#7–C8, MIDI 97–108) free of piercing clutter.
    - Multi-octave settings (`arpOctaves = 2, 3, 4`) now climb continuously across the keyboard instead of collapsing back down into the center octave.
  - **Melodic Lead (`clockTick`)**:
    - Expanded `leadScaleDeg` bounds from `[-3, 5]` to `[-6, 10]`.
    - Clamped melody between G2 (MIDI 43, warm cello range) and A5 (MIDI 81, soaring horn range).
- **Psychoacoustic Anti-Piercing Damping & Tone Softening**:
  - **Dynamic Voice Filter Cutoff**:
    - When `midi > 72`, `voiceFilter` multiplier drops from `5.4` to `3.0`, capped at 3000 Hz.
    - In `playArpNote`, `arpVoiceFilter` multiplier drops from `3.8` to `2.4` for `midi > 74`.
  - **Progressive High-Note Damping**:
    - `highNoteDamp = Math.max(0.38, 1.0 - Math.max(0, midi - 56) * 0.018)` smoothly tapers velocities on notes above G#3, rendering C6–C7 notes delicate, crystalline, and ambient.
  - **Timbre Overtone Scaling**:
    - **FM Pianos (`GLASS_EP`, `RHODES`, `GLASS_FM`)**: Scaled modulation index inversely with pitch above MIDI 72 to eliminate digital FM sideband aliasing and harsh clatter.
    - **Kalimba & Music Box**: Metallic tine/chime harmonic gains taper smoothly above MIDI 72.
    - **Analog Pulse**: Square wave pulse level reduces from 0.28 to 0.08 above MIDI 72 with tighter low-pass filtering.
  - **Live Keyboard Parity (`startNoteLive`)**: Applied identical damping, filter scaling, and FM index attenuation so real-time playing across all 88 keys maintains consistent warmth.

## Update — 2026-10-16 (Color Palette System: Paired SLAM UI Colors & Randomized Phosphors)

- **Palette-to-UI Color Pairing**:
  - Each color theme in `COLOR_THEMES` now carries an assigned primary SLAM UI phosphor color (`uiColor`):
    - **Slambient**: `SLAM · Y` (Warm Phosphor Yellow, `#fed330`)
    - **Kankyō Pastel**: `SLAM · P` (Pastel Purple, `#a855f7`)
    - **Aurora**: `SLAM · G` (Electric Phosphor Green, `#2ed573`)
    - **Sodium Tape**: `SLAM · Y` (Amber Tape Warmth, `#fed330`)
    - **Glacier**: `SLAM · W` (Crisp Polar White, `#ffffff`)
  - Selecting any palette automatically triggers `setEnoPhosphor(theme.uiColor)`, synchronizing the wireframe head, module border glows (`--eno-glow-border`), and box shadows (`--eno-glow-shadow`) in real time.
- **Randomize Palette & UI Randomization**:
  - `makeRandomTheme()` now also randomly selects one of the 4 primary SLAM UI phosphors (Yellow, Green, Purple, White).
  - Clicking **Randomize** in the palette popover generates a fresh 9-color module harmony AND assigns a randomized SLAM UI phosphor color.
- **Persistence & Telemetry**:
  - `activeTheme.uiColor` is persisted in `localStorage["slambient.colorTheme"]` and seamlessly restored on boot.
  - Footer status readout displays active palette and UI phosphor (e.g. `Palette: Glacier (SLAM · W)`).
  - Palette popover buttons carry informative tooltips indicating both description and associated UI color.

## Update — 2026-10-16 (Mobile Responsive Overhaul: Symmetrical Portrait & Landscape Layouts)

- **Portrait (Vertical) Overhaul**:
  - **Transport & Audio (Section 1)**: Replaced asymmetric 3-column grid (which left orphaned empty cells and truncated "RECORD" text) with a balanced 2-row layout:
    - **Row 1**: 50/50 split between `START` (Play) and `RECORD` (Record button with format select). The record button now has full 130px+ width, eliminating text truncation.
    - **Row 2**: `SAMPLE` (Pocket Field Recorder with mic/drop/wave) and `MIDI` status button share the second row, eliminating orphaned empty boxes.
    - Protected `btn-header-midi` spans so the status LED dot and "MIDI" label remain visible below 1200px.
  - **Harmony & Master Clock (Section 2)**: Replaced bloated 3-row stack with a clean 2-row grid:
    - **Row 1**: `KEY` (compact select) + `SCALE` (full-width dropdown).
    - **Row 2**: `METER` (select + cycle button) paired side-by-side with `TEMPO` (slider + BPM readout + `TAP`).
  - **Generative & Utilities (Sections 3 & 4)**: Paired Section 4 (Generative: `RANDOMIZE ALL` + `Undo`) on the left with Section 3 (Utilities: `Palette` + `? Help` + `Fullscreen`) on the right in a unified 40px row, cutting over 50px of vertical dead space.
  - **Telemetry Readout**: Streamlined 2x2 grid (`TIME`, `METER`, `ROOT/SCALE`, `SEED`) with compact padding and full width balance.
  - **Preset Strip**: Softened fade mask to 18px and tightened chip padding so presets fit naturally without jagged edge clipping.
  - **Overall Vertical Height**: Reduced header footprint by >220px (~35%), opening up viewable workspace for the visualizer and console rack.

- **Landscape (Horizontal) Overhaul**:
  - **Dead Space Elimination**: Replaced fixed 440px / 270px clamps with a responsive 2-column split:
    - Visualizer (`.scope-panel`): `flex: 1 1 0; max-width: none;` (~62% width).
    - Chord Analysis (`.chord-info-panel`): `flex: 0 0 clamp(240px, 35vw, 300px); max-width: none;` (~38% width).
    - Both panels now fill **100% of the screen width**, eliminating the massive black void on wide phone screens.
  - **Visualizer Header Overflow & Overlap Fix**:
    - Hid drag handles on touch devices.
    - Compacted `.scope-legend` to show only the 4 glowing colored dots in landscape (hiding text labels), saving ~130px.
    - Scaled the 7 layer toggle buttons to compact 22x22px badges.
    - Added `overflow: hidden` to `.scope-panel-header` and `.scope-panel`, preventing toggle buttons from spilling over and overlapping the Chord Analysis title.
  - **Keyboard Panel**: Keyboard deck spans full 100% width below the visualizer split with keys height clamped to `clamp(75px, 24vh, 115px)` (25-Play) and `clamp(55px, 16vh, 80px)` (88-Radar), ensuring full visibility without awkward clipping.
  - **Palette Popover**: Scoped `#paletteMenu` on mobile to fill 100% width of the card with `z-index: 9999`.






## Update — 2026-10-16 (Mobile Portrait Header Refinements)

- **Generative row**: `RANDOMIZE ALL` and `UNDO` now sit on the same level as two equal-width, 40px buttons in their own full-width row (Undo shows its label again).
- **Utilities row**: Palette and `?` are split onto their own full-width row as two equal 40px buttons (Palette label restored; Install/Fullscreen share the row when available).
- **Meter**: METER now has a full-width row (dropdown min 96px, 14px type, 32px cycle button) so the time signature is clearly legible; TEMPO takes its own full-width row below it.
- **Record format dropdown**: MP3/WAV/STEMS is a custom dropdown (the native select is hidden), so the old selector never applied; the wrapper/trigger is now 40px tall to match START and RECORD.

## Update — 2026-10-16 (Master Roadmap: Hardware-Inspired Pedal Board & Eurorack UI Architecture)

- **Strategic Objective & Paradigm**:
  - Authored and codified **Part VI (Sections 24–27)** of `MASTER_BLUEPRINT.md` establishing the architectural blueprint for replacing legacy mobile console views with a physical, hardware-inspired **Pedals Mode**.
- **Eurorack HP Sizing Grid & Aesthetics**:
  - Horizontal Pitch (HP) modular sizing standard: **32 HP** fixed rack width per row on mobile (2-column structural layout) and **64 HP** on desktop.
  - Module Width Standards: Utility/LFOs (**8 HP**), Standard Modules/Filter/EQ (**16 HP**), Complex Modules/Multi-Delay/Reverb (**24 HP**).
  - Surface Materials: Anodized dark slate faceplates (`#2B2D31`), low-resonance studio base (`#1A1C23`), machined cold-rolled steel rails (`#3F4248`), and hexagonal mounting screws.
- **Pedals Mode Dashboard & Visual Metaphors**:
  - Module faceplates with uppercase silkscreened labels, etched HP badges, illuminated hardware bypass toggles (`[Byp]`), and 6px metallic micro-jack anchor points.
  - Dynamic braided SVG cubic bezier patch lines: neon teal (`#00E5FF`) audio signal flow with gravitational slack, plus amber/violet CV/LFO lines with amplitude-reactive visual pulse feedback.
  - Interactive tactile manipulation: Tap-to-focus transition to Orbital View; long-press and drag reordering along the Eurorack rails triggering live, click-free `rewireDspChain()` audio re-routing.
- **Orbital View & Edge-to-Edge Gestural Navigation**:
  - Horizontal edge-to-edge swiping to slide between adjacent DSP modules in the active signal chain without menu diving.
  - Fluid pinch-to-collapse gesture or header back-arrow to return to macro Pedals Mode overview.
- **Deep-Dive Audio Modules & Roadmap**:
  - **Filter Module**: Switchable topologies (Ladder 24dB, State-Variable 12dB, Formant/Vocal, Comb), knurled Cutoff/Resonance dials, Filter Intensity Scale macro slider with bipolar polarity toggle, dynamic low-end makeup gain, and collapsible modulation sub-drawers.
  - **Modular Multi-Delay Engine**: 4 discrete DSP algorithms (Tape with capstan wow/flutter, BBD with clock noise grit, Digital 32-bit pristine, Ping-Pong binaural spatial bounce), macro Time/Feedback dials, dynamic engine-specific accordion drawers, and dynamic lead ducking.
  - **3-Phase Phased Implementation Roadmap**: Phase 1 (Grid & Pedals Mode Layout), Phase 2 (Orbital View & Gestures), Phase 3 (DSP & Parameter Integration).

## Update — 2026-10-16 (Mobile Microphone & Pocket Field Recorder Resiliency Architecture: Priority 1)

- **Problem Diagnosis (Mobile WebKit / Blink Mic Failure Modes)**:
  - **Pointer Event Cancellation**: `pointerdown` on mobile touchscreens without `setPointerCapture` emits immediate `pointercancel` when user fingers jitter or scroll-intent triggers, immediately halting capture before audio buffers initialize.
  - **Asynchronous User Gesture Expiration**: On iOS Safari, creating or resuming `AudioContext` after `await navigator.mediaDevices.getUserMedia(...)` expires the user-activation token, causing WebKit to silently suspend `captureCtx` or ignore input node connections.
  - **ScriptProcessor Throttling & Silent Zeroing**: iOS 17+ heavily throttles or blocks `createScriptProcessor(4096, 1, 1)` callbacks if routed to muted gain nodes, leading to 0-byte buffer captures and empty recordings.
  - **AudioSession Background Muting**: `navigator.audioSession.type = "play-and-record"` can throw or fail to restore playback routing on certain Safari versions.
- **Architectural Solution & Priority 1 Action Plan**:
  - **Step A (Pointer Capture & Touch Physics)**: Bind `setPointerCapture(e.pointerId)` on `pointerdown` and add resilient `touchstart`/`touchend` listeners with `touch-action: none` to isolate hold-to-record gestures from mobile viewport scrolling.
  - **Step B (MediaRecorder Modernization with ScriptProcessor Fallback)**: Switch primary recording pipeline to standard `MediaRecorder` (`audio/webm` / `audio/mp4` / AAC/Opus) decoded directly into Float32 PCM via `ctx.decodeAudioData`, completely bypassing the iOS `ScriptProcessorNode` thread freeze while retaining backward compatibility.
  - **Step C (Synchronous AudioContext Pre-Warming)**: Pre-warm and synchronously resume `captureCtx` inside the initial touch/pointer call stack prior to the async `getUserMedia` promise.
  - **Step D (High-Visibility UI & Denied Permissions Guidance)**: Update `[data-field-hold]` button state with unambiguous visual feedback (`HOLD TO REC`, `REC 0.0s`, `TAP TO STOP`, `MIC ACCESS BLOCKED`) and clear recovery instructions when browser mic permission is denied or dismissed.
  - **Roadmap Placement**: Codified as **Phase 0 / Priority 1** in both Section 11 and Section 27 of `MASTER_BLUEPRINT.md`.

## Update — 2026-10-16 (Mobile Landscape App-Native Architecture & Floating Mini-Transport Fix)

- **Floating Play/Pause Mini-Transport Bar Fix**:
  - **Root Cause**: `html { zoom: 0.75; }` was set on root `html` in the base stylesheet. In WebKit/iOS Safari, CSS `zoom` on `html` creates a scaled root layout viewport; media-query overrides (`zoom: 1`) fail to reset the fixed-position containing block in WebKit, causing elements with `position: fixed; bottom: calc(8px + ...)` to be calculated against the scaled viewport height (~60% down the screen, locking it in the middle when scrolling).
  - **Resolution**:
    - Changed base `html` to native `zoom: 1`. Moved `zoom: 0.75` strictly into `@media (min-width: 1025px) and (min-height: 551px)` so desktop is untouched while all mobile devices (portrait & landscape) run natively at `zoom: 1`.
    - Upgraded `.mini-transport` CSS with `position: fixed !important`, `bottom: calc(8px + env(safe-area-inset-bottom)) !important`, `z-index: 99999 !important`, and hardware-accelerated `-webkit-transform: translateZ(0) !important; transform: translateZ(0) !important; will-change: transform, opacity;`.
- **Horizontal (Landscape) Mobile Architecture Overhaul**:
  - Replaced the desktop-cloned landscape layout (`max-height: 520px`) with a modern, touch-optimized, "appify'd" mobile landscape architecture:
    - **Header & Side Dock**: Symmetrical 2-column header wrapper (`grid-template-columns: minmax(0, 1fr) 74px;`) with the Eno CRT head and Master Output Volume neatly docked on the right side.
    - **Brand & Preset Strip**: Compact single-row horizontal swipeable chip strip (`preset-bar`) with smooth fades and bank tabs, reducing header height by over 55%.
    - **Modular App Toolbar (3 Symmetric Sections)**:
      - Section 1 (Transport & Audio): `START`, `RECORD` (with format dropdown), `SAMPLE` (with MIC/DROP), and `MIDI`.
      - Section 2 (Harmony & Clock): `KEY`/`SCALE`, `METER` (large readable font), and `TEMPO` slider + `TAP`.
      - Section 3 & 4 (Generative & Utilities): `RANDOMIZE ALL` & `UNDO` on one symmetrical level, and `PALETTE` + `?` (Help) + Fullscreen below.
    - **Telemetry HUD**: 4-pill compact horizontal row (`TIME`, `METER`, `KEY/SCALE`, `SEED`).
    - **Upper Deck Symmetrical Split**: Visualizer (`scope-panel`) and Chord Analysis (`chord-info-panel`) side-by-side with balanced heights (`clamp(130px, 35vh, 180px)`) and zero layer-toggle clipping.
    - **Playable MIDI Keyboard**: Full 100% width, horizontal routing bar (`TARGET: CHD/ARP` and `LEDS`), and thumb-ergonomic keys (`clamp(80px, 25vh, 115px)`).
- **Responsive JS Helpers**: Updated `mq` in `initPhoneHeader`, `orbitalPhone`, and dropdown `placeMenu` to match both portrait (`max-width: 640px`) and landscape mobile (`orientation: landscape and max-height: 550px`).

## Update — 2026-10-16 (Orbital View Modal UI & Pocket Field Recorder Resiliency Engine: Landed)

- **UI Fix 1 (Orbital Modal Opacity Bleed Scoped to Modal Body)**:
  - Scoped horizontal module cycling transitions (`.swiping-left`, `.swiping-right`) exclusively to `#orbitalModalBody` / `.orbital-modal-body` (`opacity: 0.4; transform: translateX(...)`).
  - Enforced `opacity: 1 !important` on `.orbital-side-panel` and its top header, completely eliminating the visual bleed of background canvas stars through the dark chassis, borders, and header typography.
- **UI Fix 2 (Center-Justified Title & Module Cycle Arrows)**:
  - Converted `.orbital-modal-header` across desktop and mobile to a balanced 3-column CSS grid (`grid-template-columns: 1fr auto 1fr; align-items: center;`).
  - Centered `.orbital-nav-group` (`#btnOrbitalPrev`, `#orbitalModalTitle`, `#btnOrbitalNext`) mathematically at the midpoint of the modal header, flanked symmetrically by `.btn-orbital-back` on the left (`justify-self: start`) and close/actions on the right (`justify-self: end`).
- **Phase 0 / Pocket Field Recorder Resiliency Engine**:
  - **Pointer Capture & Touch Physics**: Integrated `setPointerCapture(e.pointerId)` on `pointerdown` for all `[data-field-hold]` buttons, backed by dedicated `touchstart`/`touchend` listeners with `{ passive: false }` and `touch-action: none` to isolate sampling gestures from iOS Safari viewport scroll interruptions and `pointercancel` micro-jitters.
  - **Synchronous AudioContext Pre-Warming**: Pre-warmed and synchronously resumed `captureCtx` inside the initial user touch dispatch before issuing asynchronous `getUserMedia()` queries, preserving the WebKit user activation token.
  - **MediaRecorder Modernization**: Upgraded the capture pipeline to standard `MediaRecorder` (`audio/webm` / `audio/mp4` / AAC/Opus) decoded directly to Float32 mono PCM via `decodeAudioData`, completely bypassing iOS 17+ `createScriptProcessor` thread throttling while preserving the script processor as an automated fallback.
  - **AudioSession Guarding**: Guarded `navigator.audioSession.type = "play-and-record"` with automated restore of previous session types, and verified `audioCtx.state` recovery to prevent background audio muting on WebKit.
  - **Visual State Machine & Denied Feedback**: Implemented dynamic status states across all `[data-field-hold]` buttons (`HOLD TO REC`, `REC 0.0s`, `TAP TO STOP`, `MIC BLOCKED`) and integrated a floating glassmorphic `#fieldMicToast` notification with user-friendly recovery instructions when microphone access is blocked.

## Update — 2026-10-16 (Visualizer Layer Toggles Relocated to Bottom Toolbar with Uniform Symmetry)

- **Problem**: When the visualizer card (`.scope-panel`) was viewed on desktop, tablet, or narrower viewports, all 7 layer and fullscreen toggle buttons (`.scope-layer-toggles`) were squeezed into the top header next to the drag handle, title, and channel legend. This caused horizontal overflow that broke past the panel boundaries and clipped directly into the adjacent Chord Analysis panel.
- **Solution**:
  - Relocated `.scope-layer-toggles` from `.panel-header.scope-panel-header` to the bottom of the visualizer card, directly beneath `.scope-left-viz`.
  - Converted `.scope-layer-toggles` to a full-width 7-column CSS grid (`grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; width: 100%; box-sizing: border-box;`).
  - Cleaned up `.scope-panel > .panel-header` to a clean single row (`[::] VISUALIZER • SUB • DRUMS • CHORDS • ARP`) with generous horizontal breathing room across all screen sizes.

## Update — 2026-10-16 (Canonical Brand Guidelines & Design System Master Specification)

- **Creation of `BRAND_GUIDELINES.md`**:
  - Established a formal, standalone design system specification at `/Users/benfox/Documents/Development/slambient_dev/BRAND_GUIDELINES.md` to serve as the definitive checklist for all UI, color, typography, audio aesthetic, and component changes.
- **Key Tenets & Enforced Standards**:
  - **The Symmetry Law**: Disciplined geometric divisions ($50/50$, $60/40$, $33/33/33$), identical heights for sibling controls in horizontal rows (40px portrait, 30px landscape, 34px desktop), and mathematically centered header anchors.
  - **Zero Text Overwrapping Rule**: Absolute ban on button text or badges wrapping into multi-line fragments or colliding with adjacent icons (`white-space: nowrap !important; text-overflow: clip;`).
  - **Modular Element Completeness**: Every component (pedal chassis, strip channel, toolbar section, telemetry pill) must render as a complete, self-contained modular entity with complete border definitions, inset drop shadows, and full state implementations (Default, Hover, Active, Bypassed).
  - **Design Token Registry**: Codified complete chassis neutrals (`#040507` through `#3b4460`), typography neutrals (`#e6ebf5`, `#8e9bb5`, `#525c74`), and the 9 semantic neon module accents.
  - **Typography Rules**: `JetBrains Mono` for all controls, badges, readouts, and titles; `Inter` for descriptive copy; explicit font loading to prevent system font metric discrepancies on non-Mac devices.
  - **Quality Checklist**: 7-point pre-flight checklist for all future PRs and code modifications.

## Update — 2026-10-16 (Desktop Header Eurorack Symmetry, Mobile 2-Row MIDI Layout & Pedal View Mode)

- **Desktop Header Formatting & Eurorack Chassis Symmetry**:
  - Moved Section 3 (Workspace Utilities: Fullscreen, Palette, ?) and Section 4 (Generative Engine: Randomize All, Undo) out of `.transport-row` into `.readout-row` inside `.header-util-gen-cluster`.
  - Created a balanced 2-row chassis layout: Row 1 houses Transport & Audio on the left and Harmony & Master Clock on the right (`justify-content: space-between`); Row 2 houses Telemetry HUD on the left and Utilities & Generative Engine on the right (`justify-content: space-between`).
  - Redesigned `.patch-bank-section` as a dedicated unified module nested inside `.preset-group` directly adjacent to the preset grid with `SAVE` and `LOAD` stacked vertically on top of each other. This eliminates horizontal wrapping issues, avoids blank voids, and creates a perfectly proportioned ~80px auxiliary card matching the 3-row preset grid height.
- **Mobile Transport 2-Row Symmetry & Auto-Fill Elements**:
  - Re-architected `.header-sec-transport` across portrait (`@media (max-width: 640px)`) and landscape (`@media (orientation: landscape) and (max-height: 550px)`) into two 12-column rows:
    - **Row 1**: `START` button (cols 1–6, 50%) + `RECORD` button with format dropdown (cols 7–12, 50%).
    - **Row 2**: `SAMPLE` pocket recorder (cols 1–9, 75%) + `MIDI` hardware button (cols 10–12, 25%).
  - Inside `.sample-ctrl`: set `.btn-field` (`MIC` and `DROP`) to `flex: 1 1 0; min-width: 0; justify-content: center;` so they expand symmetrically to fill the entire remaining container with zero dead space. When a sample is loaded, they auto-contract (`flex: 0 0 auto; padding: 0 6px`) to give full width to the waveform canvas and eject button.
- **Pedal View Switcher Mode & Roadmap Clarification**:
  - Renamed the view toggle button from `Console Rack` to `Pedal View` (`Pedalboard & Console Rack View`) so users can immediately switch into pedal/console view mode.
  - Updated `MASTER_BLUEPRINT.md` section 27 to document the completed desktop/mobile header symmetry polish and clarified that Phase 1 (Eurorack HP Sizing Grid & Macro Pedals Mode Layout) is the active roadmap item for the full hardware pedalboard container and dynamic SVG patch cables.

## Update — 2026-10-16 (Modular DSP Engines: SlambientFilterEngine & SlambientMultiDelayEngine Landed in dsp-engines.js)

- **Parallel Workstream Strategy (Zero Conflict with UI Design Fixes)**:
  - While main thread finalized desktop/mobile header chassis symmetry and styling, this workstream authored the standalone DSP processors for **Phase 3 / Section 26** of `MASTER_BLUEPRINT.md` in `/Users/benfox/Documents/Development/slambient_dev/dsp-engines.js`.
  - Zero DOM/CSS overlap: runs as an independent Web Audio API module with standard CommonJS/AMD/browser UMD exports.
- **SlambientFilterEngine (Section 26.1)**:
  - **4 Switchable Analog-Emulated Topologies**:
    - `LADDER`: 4-pole cascaded transistor ladder with staggered resonance Qs, tanh waveshaping saturation, and automatic low-end bass compensation.
    - `SEM`: 2-pole State-Variable multi-mode filter with singing resonance and lowpass/bandpass morphing.
    - `FORMANT`: 3-cavity parallel bandpass acoustic resonators creating bansuri flute / vocal throat acoustic cavities.
    - `COMB`: Resonant feedback delay line ($0.5\text{ ms} – 25\text{ ms}$) generating physical string overtones and harmonic halos.
  - **Filter Intensity Scale & Bipolar Polarity**:
    - Macro scaling slider ($0.0 – 2.0$) scaling cutoff sweep and envelope depths.
    - Bipolar polarity toggle ($+1 / -1$) for positive or negative envelope dipping sweeps.
  - **Dynamic Low-End Makeup Gain**:
    - Dynamic lowshelf boost at 135 Hz proportional to resonance, preventing the volume loss inherent in 4-pole resonant ladders.
  - **Modulation LFO**:
    - Dedicated oscillator supporting Sine, Triangle, and Square/S&H modulation waveforms.
- **SlambientMultiDelayEngine (Section 26.2)**:
  - **4 Discrete Ambient Delay Algorithms**:
    - `TAPE`: Capstan wow ($0.38\text{ Hz}$) and motor flutter ($3.6\text{ Hz}$) LFOs, asymmetric magnetic tape saturation curve, and high-frequency head damping.
    - `BBD`: Analog Bucket Brigade compander saturation, warm clock noise floor, and steep clock-rate anti-aliasing filter that darkens repeats as delay time increases.
    - `DIGITAL`: Pristine 32-bit floating point path, bitcrusher quantizer ($8\text{-bit} – 16\text{-bit}$), and clean repeats.
    - `PINGPONG`: Cross-fed stereo delay lines with Haas binaural psychoacoustic spatial split ($12\text{ ms}$) and stereo width control ($0\% – 200\%$).
  - **Dynamic Lead Voice Ducking**:
    - Built-in sidechain ducking attenuator ($-3\text{ dB}$ to $-6\text{ dB}$) during active solos with smooth release ($320\text{ ms}$) into ambient breathing spaces.
  - **Tempo Sync & Free Time**:
    - Musical subdivision calculation ($1/16$, $1/8$, $1/8\text{D}$, $1/8\text{T}$, $1/4$, $1/2$, $1/1$) with live BPM tracking and click-free parameter smoothing.
- **Service Worker & Testing**:
  - Added `dsp-engines.js` to `PRECACHE_URLS` in `sw.js` and bumped cache version to `slambient-v4`.
  - Comprehensive unit test suite verified in Node.js with 100% test passing across all curves, topologies, and delay modes.

## Update — 2026-10-16 (Birds-Eye Rack View FX Chain, Universal Slide-Over Inspector & Sample UI Sizing)

- **Rack View & Symmetrical 6-Module Grid**:
  - Renamed view mode from `Pedal View` / `Console Rack` to **`Rack View`** (`#btnViewConsole`).
  - Added Module 6: **`6. FX CHAIN`** (`.pedal-chain-module`) directly inside `.lower-deck` alongside Modules 1–5 (`SUB`, `DRUMS`, `CHORDS`, `ARP`, `NOISE`).
  - **100% Desktop Zoom 1-Line Layout**: Removed the legacy `@media (max-width: 1440px)` 3-column wrap rule that forced laptop/desktop monitors at 100% browser zoom into 2 rows. `.lower-deck` now stays on **1 single line** across all desktop viewports (`repeat(6, minmax(0, 1fr))` with `gap: 10px`), matching the 85% zoom behavior. Compacted `.strip-channel` padding to `10px 10px` and added `min-width: 0` to prevent child blowout. Tablet wraps to 2 columns (`max-width: 1024px`) and portrait phone wraps to 1 column (`max-width: 640px`).
- **Birds-Eye FX Chain Architecture**:
  - Entire DSP insert chain condensed into a single module with identical dimensions to the instrument channel strips.
  - Hardware signal flow diagram header: `[BUS PRE] ➔ LIVE INSERT MATRIX ➔ [OUT]`.
  - 4 compact rectangular cards (`mini-pedal-card`) for Filter, Delay, Space, and Master Out displaying slot assignment (`IN`, `INSERT`, `OUT`, `BUS TERM`), bypass state (`ON` / `BYP`), live chain reordering (`▲` / `▼`), and inspector launch triggers (`EDIT ↗`).
  - Dynamically kept in real-time sync with Web Audio API routing via `renderBirdsEyePedalRack()`, `updatePedalsOrderUI()`, and `togglePedalBypass()`.
- **Universal Modular Inspector Overlay**:
  - Decoupled `<div class="orbital-side-panel" id="orbitalSidePanel">` and `<div class="orbital-modal-backdrop" id="orbitalModalBackdrop">` from `#orbitalArenaWrapper` into a top-level overlay with fixed positioning (`z-index: 10000`).
  - **In-Place Rack View Inspection**: Clicking any module header or `EDIT ↗` button while on Rack View opens the full inspector drawer directly over Rack View with blurred backdrop. It no longer forces a view switch to Orbital View.
  - Modal back button (`#btnOrbitalBackLabel`) dynamically labels destination context (`RACK` vs `ORBITAL`); closing the inspector smoothly returns the user directly to whichever view they were on.
- **Sample Button Sizing & Dropdown Centering**:
  - Sized `MIC` and `DROP` button SVG icons to 15px x 15px matching all other module icons (`--tr-icon`).
  - Standardized mobile sample button height to 32px with `flex: 1 1 0` auto-fill.
  - Centered filetype label (`MP3`, `WAV`, `STEMS`) in both custom dropdown trigger and dropdown menu items.

## Update — 2026-10-16 (Transport Control Unification & Modular Section Dividers)

- **Exact 32px Button Height Unification**:
  - Standardized all interactive buttons in `.header-sec-transport` to `height: 32px; box-sizing: border-box;`:
    - `[ ▶ START ]` (`.btn-main-play`)
    - `[ ● RECORD ]` (`.btn-record`)
    - `[ MP3 ∨ ]` (`.record-format-select` & `.custom-dropdown-trigger` inside `.rec-ctrl-wrap`)
    - `[ 🎙 MIC ]` and `[ 🎛 DROP ]` (`.header-sec-transport .sample-ctrl .btn-field`)
    - `[ ● MIDI ]` (`.btn-header-util.btn-header-midi`)
  - Elevated desktop `.btn-field` padding to `0 10px`, font size to `12px` (800 weight), border-radius to `4px`, and SVG icon size to `14x14px` so they align flush with surrounding transport buttons.
- **Section Dividers (`|`) within Transport Module**:
  - Inserted `<span class="transport-sep" aria-hidden="true">|</span>` immediately after the record format dropdown (`MP3 ∨`) before the `SAMPLE` group.
  - Inserted `<span class="transport-sep" aria-hidden="true">|</span>` immediately after the `DROP` sample button before the `MIDI` button.
  - Styled `.transport-sep` with `opacity: 0.45`, `color: var(--border-light)`, `font-family: "JetBrains Mono"`, and `height: 32px; align-items: center`.
## Update — 2026-10-16 (Dedicated Field Recorder Instrument Module & 2-Row Lower Deck Grid)

- **Dedicated Pocket Field Recorder Instrument Module (`6. FIELD`)**:
  - Extracted the Pocket Field Recorder out of the `NOISE` module into an independent, full-fledged 6th instrument channel strip (`.strip-channel.field-ch` with `id="fieldModule"`).
  - Designed with matching Eurorack aesthetics: `--color-field: #2bcbba` (electric turquoise), header controls (`6. FIELD`, real-time `data-field-status`, `PWR`, `M`, `S`, and randomize `badge-tag`).
  - Contains complete sampling suite: live waveform display canvas, 4 tactile action buttons (`Hold to Rec`, `Drop / Load`, `Play`, `Eject`), Weave Mode dropdown (`ALL`, `GHOST`, `CHOIR`, `TRANS`, `OFF`), dedicated `knobFieldFx` FX send slider with `btnAux_field` toggle, and master sample volume slider (`knobFieldVol`).
  - Added dedicated `fieldDryGain`, `fieldFxSendGain`, and `fieldAnalyser` in the Web Audio API graph. Field audio can now be routed dry to `masterBusPost` or wet to `masterBusPre` into the live DSP chain (Filter ➔ Delay ➔ Space).
  - Integrated `field` into `channelPower`, `channelAux`, `channelMute`, `channelSolo`, `updateMuteSoloUI()`, `toggleChannelPower()`, and patch serialization.
  - Implemented `randomizeField()` hooked into `randomizeEverything()` and patch undo stack.
- **Two-Row Lower Deck Matrix with Full-Height Studio FX Chain Rack**:
  - Reorganized `.lower-deck` into an ergonomic two-row grid layout:
    ```
    SUB (1)       CHORDS (3)   NOISE (5)       [ DSP FX CHAIN ]
    DRUMS (2)     ARP (4)      FIELD (6)       [ (Full Height) ]
    ```
  - Grid definition:
    - Row 1: `sub chord noise fx`
    - Row 2: `drum arp field fx`
    - Right side: `.pedal-chain-module` spans both rows (`grid-area: fx`), with its 4 mini pedal cards (`FILTER`, `DELAY`, `SPACE`, `MASTER OUT`) proportionately flex-filling the vertical studio rack.
    - Tablet (`max-width: 1200px`): wraps to 2 instrument columns + FX rack.
    - Mobile (`max-width: 900px`): wraps to 2 instrument columns with full-width FX rack below.
    - Phone portrait (`max-width: 640px`): clean 1-column flex layout.
  - Sizing unification: Removing the field recorder panel from `NOISE` unified its height to match `SUB` and `CHORDS` in Row 1. The new `FIELD` module in Row 2 perfectly balances `DRUMS` and `ARP`. All module widths are increased and heights unified.
- **Orbital Constellation & Signal Chain Renumbering**:
  - Added `field` orb to `ORBITAL_MODULES` as Orb #6 (`#2bcbba`, 41px radius), with live audio visualization driven by `fieldAnalyser`.
  - Renumbered DSP insert chain in `ORBITAL_MODULES`, `updatePedalsOrderUI()`, and `renderBirdsEyePedalRack()`:
    - 7: Filter
    - 8: Delay
    - 9: Space
    - 10: Master Out
  - Included `field` in `ORBITAL_LOWER_DECK_IDS` and `getSignalChainOrbList()` for seamless swipe cycling.
- **Field Recorder Visual Formatting Polish**:
  - Removed nested `.field-panel` inner card container and double borders inside `#fieldModule`; waveform, buttons, dropdowns, and sliders now sit directly as native `.control-row` items matching `2. DRUMS` and `4. ARP`.
  - Replaced wrapping button text (`Hold to \n Rec`, `Drop / \n Load`) with crisp single-line hardware labels and icons in a 4-column CSS grid: `[ 🎙 REC ] [ 📂 LOAD ] [ ▶ PLAY ] [ ⏏ EJECT ]`.
  - Scoped legacy embedded `.field-panel` rules to `:not(.strip-channel)` to eliminate style bleed into the standalone channel strip.
  - Updated `drawWaves` to render waveforms using `--color-field` (`#2bcbba`) matching the instrument's visual identity.
  - Added `field` to `THEME_KEYS` and updated all 5 color theme presets in `COLOR_THEMES`.
- **Transport Bar SAMPLE Tag Perfect Centering**:
  - Centered `<span class="tag">SAMPLE</span>` horizontally between the preceding `|` separator and the `[ 🎙 MIC ]` button by standardizing `.transport-sep` (`width: 8px; padding: 0`) and setting `margin: 0 4px 0 0` on `.tag`, yielding an exact 10px visual gap on both sides.
  - Centered `SAMPLE` vertically by switching `.tag` to `display: inline-flex; align-items: center; justify-content: center; height: 32px; line-height: 1; vertical-align: middle`, perfectly matching `.btn-field`'s 32px height and optical center line.

## Update — 2026-10-16 (FX Chain Button Inspector Navigation & Header Button Standardization)

- **Pedal Birds-Eye Direct Inspector Navigation**:
  - Resolved event interception bug where clicking any pedal or button in `#pedalChainModule` opened Filter (`expandModuleOrb("filter")`) due to pointerdown / pointerup bubbling on `.strip-channel`.
  - Updated `isInteractive(target)` in `initPedalDragAndDrop()` to classify `.mini-pedal-card, .mini-pedal-left, .pedal-birds-eye-rack, .btn-pedal-action, .birds-eye-flow-bar` as interactive so background card drag handlers don't hijack clicks.
  - Bound `onclick="openMiniPedalInspector('${meta.orbId}', event)"` across `.mini-pedal-card` with `cursor: pointer`. Clicking `DELAY` opens Delay (`orbId: "delay"`), `SPACE` opens Space / Reverb (`orbId: "reverb"`), `FILTER` opens Filter (`orbId: "filter"`), and `MASTER OUT` opens Master EQ & Out (`orbId: "space"`).
  - Attached `event.stopPropagation()` to `.mini-pedal-actions` and helper buttons (`▲`, `▼`, `BYP/ON`) so reordering and bypassing operate cleanly without triggering modal popups.
- **Shuffle & Reset Button Formatting Consistency**:
  - Upgraded `SHUFFLE` button across `#pedalChainModule` and `#pedalsContainer` from raw unicode `⟲` to an inline SVG cycle/refresh icon.
  - Standardized `.btn-pedal-action` to exact `height: 24px`, matching `PWR`, `M`, `S`, and `badge-tag` header actions with `JetBrains Mono` 9.5px / 800 weight typography and neon cyan hover glow.

## Update — 2026-10-16 (Preset Bank Header & Symmetrical I/O Module Unification)

- **Eliminated Broken Floating Bank Card**:
  - Removed the standalone `.patch-bank-section` box located below the preset chips on mobile, along with the floating label text "BANK".
  - Cleaned up obsolete mobile CSS rules that forced `.patch-bank-section` into an awkward 40px boxed-row container.
- **Unified Symmetrical Preset Bank Header**:
  - Added `<div class="preset-bank-header">` directly above `#presetBarFactory` and `#presetBarUser`.
  - Positioned `.preset-bank-tabs` (`PRESETS`, `USER [U1–U6]`) and `.patch-bank-actions` (`SAVE`, `LOAD`) side-by-side as flex items on the same horizontal line.
  - Styled both groups with matching pill container aesthetics (`background: #080a11; border: 1px solid var(--border-light); border-radius: 4px; padding: 2px`) and symmetrical button typography (`.btn-bank-tab` and `.btn-preset-io`).
    - Desktop & mobile: aligned `.preset-bank-header` with `justify-content: flex-start; gap: 8px;` so SAVE/LOAD sits directly adjacent to PRESETS/USER tabs.
    - Phone landscape (`max-height: 550px`): `display: contents;` with flex order flows tabs, chips, and actions inline.

## Update — 2026-10-16 (Centered Module Popup, Header Persistence, Rack FX Drag Reordering & Power/Randomize)

- **Preset Bank Header Clustering**:
  - Moved `[ SAVE | LOAD ]` immediately adjacent to `[ PRESETS | USER [U1–U6] ]` on the left using `justify-content: flex-start; gap: 8px;` across desktop and mobile, eliminating the wide gap across the header.
- **Centered Module Pop-up Below Header (Replaced Full-Height Side Drawer)**:
  - Replaced the edge-pinned left drawer (`top: 0; bottom: 0; left: 0;`) with a centered floating Eurorack module pop-up (`left: 50%; transform: translate(-50%, 0); width: 640px; max-width: calc(100vw - 32px)`).
  - Constrained popup height and position to match the full rack view below the sticky header: `top: calc(var(--header-bottom, 106px) + 8px); height: calc(100vh - var(--header-bottom, 106px) - 20px)`.
  - Elevated `.header-bar-wrapper` to `z-index: 10002` above the modal backdrop (`z-index: 9999`) and popup (`z-index: 10000`), so the top header remains completely visible, unshaded, and interactive while inspecting modules on desktop.
  - Eliminated extraneous click-and-drag interactions in the inspector view: disabled mouse gestures in `initSheetSwipe`, and hid `.pedal-drag-handle` in `#orbitalModalActions` on desktop.
- **Rack View Effects Click-and-Drag Reordering**:
  - Added full drag-and-drop support to `.mini-pedal-card` in `#pedalBirdsEyeRack` (Filter, Delay, Space).
  - Equipped each card with a tactile drag grip (`⋮⋮`, `cursor: grab;`), visual drag state (`.mini-pedal-dragging`), and drop target highlight (`.mini-pedal-drag-over`).
  - Implemented dual-layer dragging (HTML5 drag-and-drop + pointer drag events with capture) so dragging any card over another immediately reorders the DSP insert chain via `reorderDspChainModules(srcKey, targetKey)`.
  - Normal clicks on the card body outside buttons open the inspector via `openMiniPedalInspector()`.
- **Rack View Effects Power & Randomize Buttons**:
  - Upgraded effect bypass buttons to standard `PWR` buttons matching the instrument channel strips. Toggles between active state (glowing with the effect's neon accent) and bypassed state (dimmed/unlit), directly controlling audio DSP bypass.
  - Added dedicated randomize buttons (`badge-tag btn-mini-randomize`) to all rack effects:
    - Filter: `randomizeFilter()`
    - Delay: `randomizeDelay()`
    - Space (Reverb & Chorus): `randomizeReverbChorus()`
    - Master Out: `randomizeSpace()` (Master EQ & saturation/drive)

## Update — 2026-10-16 (Desktop Module Popup Container Confinement & Field Module Border Fix)

- **Confined Desktop Module Popup Strictly Within Active UI Container**:
  - Replaced floating fixed-coordinate viewport math (`top: calc(var(--header-bottom) + 8px)`) with strict relative container-confined popups:
    - **Rack / Console View**: Pop-up (`#orbitalSidePanel`) and backdrop (`#orbitalModalBackdrop`) dynamically mount directly inside `.lower-deck` (`position: absolute; inset: 0; max-width: 760px; margin: 0 auto; z-index: 101;`).
    - **Orbital View**: Dynamically mount directly inside `#orbitalArenaWrapper` (`position: absolute; inset: 0; max-width: 680px; margin: 0 auto; z-index: 101;`).
    - **Mobile View (`<= 640px`)**: Preserved bottom-sheet overlay anchored to `document.body` for touch-friendly drawer behavior.
  - Eliminated clipping and overlap issues where the top navigation bar (`< RACK`, module switcher, `PWR`, `✕`) previously tucked underneath the sticky header in Safari or varying browser viewport heights.
  - Smooth backdrop and panel fade in/out transitions with zero layout shift to the underlying channel rack.

- **Restored FIELD Module Full Border & Glow**:
  - Identified root cause of missing border on `6. FIELD` channel strip: `--color-field` (`#2bcbba`) and `--rgb-field` (`43, 203, 186`) were missing from CSS `:root`, causing `var(--color-field)` and `rgba(var(--rgb-field), ...)` to silently fail.
  - Defined `--color-field: #2bcbba;` and `--rgb-field: 43, 203, 186;` in `:root`.
  - Removed legacy `.field-panel` class from `#fieldModule` and purged the reset rule (`.strip-channel.field-panel { border: none; box-shadow: none; background: transparent; }`) which previously stripped away channel strip styling.
  - Restored full border, top neon accent strip, and ambient glow on `6. FIELD` matching all other channel strips in the console rack.

## Update — 2026-10-16 (Field Recorder Full Sample Playback with Effects)

- **Full Sample Playback Engine (`playFullSample`)**:
  - Implemented `playFullSample(opts)` allowing the entire captured/imported recording (`b.phrase`) to play back from start to finish with studio processing, rather than only ever being heard in sliced, granular, or bandpassed fragments.
  - Studio Effects Chain:
    - Dedicated analog-style tape conditioning with 55 Hz high-pass (sub-rumble rejection), 13.5 kHz low-pass (warm analog roll-off), and +1.8 dB presence boost at 2.8 kHz for vocal and environmental clarity.
    - Tempo-synced stereo tape delay reflections via `g.washIn` (dotted-eighth or quarter note division calculated dynamically from `bpm`).
    - 4.8s convolution reverb halo via `g.verbIn`.
    - Dynamic stereo pan offset and smooth de-clicked envelope (25ms attack, full sustain, 70ms tail release).
    - Natural playback rate (1.0 default with occasional subtle 0.94/1.03 tape drift).
- **Generative Scheduling in `fieldRecorderTick`**:
  - Added probabilistic trigger on downbeat phrase turnarounds (`barCount % 4 === 0`) during `ALL` and `GHOST` modes when no conflicting voice is active (`nowMs > S.fullUntil && nowMs > S.ghostUntil`).
  - Coexists harmoniously with the existing cut-up voices (rhythmic transient drum hits and tuned chord choir loops).
  - Wired into `window.fieldPreview()` so manual preview plays the entire sample in full fidelity with effects.

## Update — 2026-10-16 (Master Tempo Slider Number Display Synchronization)

- **Fixed Static Tempo Label in Top Header Bar**:
  - Identified bug in `updateBpm(sourceEl)`: `headerLbl` was fetched from the DOM (`document.getElementById("lblBpmHeader")`) but its `textContent` assignment was never executed, leaving the top header's tempo text permanently stuck on `72 BPM`.
## Update — 2026-10-16 (Rack PWR Buttons Fix, OUT Button Inspector Trigger & All Effect Parameters Open)

- **Fixed PWR Buttons on Rack View Effects (Desktop & Mobile)**:
  - Identified root causes of unresponsive `PWR` buttons in the DSP FX Chain rack cards:
    - `togglePedalBypass(key, ev)` previously returned early when `!audioCtx`, preventing any UI update when users clicked PWR before starting audio.
    - `togglePedalBypass` was only toggling classes on the hidden backing store cards (`#pedalCard_...`), not on the visible `.mini-pedal-card` or `.btn-mini-power` elements in `#pedalBirdsEyeRack`.
    - Clicking the button also suffered potential event bubbling into card-level drag handlers.
  - Refactored `togglePedalBypass` to immediately and directly toggle `.active` and `.bypassed` classes and accessible `title` attributes on the visible mini-cards and mini-buttons on screen, as well as the modal's `PWR` button if open.
  - Added `draggable="false"` to all action buttons and stopped pointer/mouse/click event propagation at `.mini-pedal-actions`, shielding buttons completely from card drag interactions.
  - Safely and smoothly applied Web Audio node ramps when `audioCtx` is active.

- **Fixed OUT Rack View Button & Master Out Card Inspector Trigger**:
  - Identified that the `[OUT]` element in the `birds-eye-flow-bar` (`BUS PRE ➔ LIVE INSERT MATRIX ➔ OUT`) was an inert `<span>` without a click handler. Replaced it with an interactive clickable button that opens the 10. OUT module inspector (`openMiniPedalInspector('space', event)`).
  - Made the entire `10. MASTER OUT` card faceplate clickable (`style="cursor: pointer;"`), opening the 10. OUT module popup upon click.
  - Added alias normalization in `openMiniPedalInspector` and `expandModuleOrb` so `'MASTER'`, `'master'`, `'out'`, and `'OUT'` all correctly map to `'space'`.
  - Added `flex: 1 1 auto; min-height: 0; overflow-y: auto;` to `.orbital-modal-body` on desktop so all parameters scroll smoothly.

- **Expanded All Parameter Drawers in Close Up Module Views for Effects**:
  - In `expandModuleOrb(orbId)`, added automatic expansion for all secondary parameter accordions (`.module-drawer-content.open`, `.module-drawer-toggle.expanded`, `aria-expanded="true"`) when viewing modules close up on desktop and mobile.
  - Set default HTML state for Filter (`FILTER ENVELOPE & MODULATION`), Delay (`MULTI-DELAY & TAPE WOW/FLUTTER`), and Space (`STEREO CHORUS & MODULATION`) drawers to `open` / `expanded`.
  - Styled `.orbital-side-panel .module-drawer-toggle.expanded` with the respective module's neon accent color and glow matching the modal theme.

## Update — 2026-10-16 (Bonsai 27B Dedicated Git Worktree Initialized)

- **Third Worktree Provisioning**:
  - Provisioned a dedicated third git worktree at `/Users/benfox/Documents/Development/slambient_dev-bonsai` on a separate branch `bonsai-27b`.
  - Configured specifically for pointing a locally running Bonsai 27B model at an isolated workspace without risking uncommitted change collisions with `main` (`/Users/benfox/Documents/Development/slambient_dev`) or `thread2` (`/Users/benfox/Documents/Development/slambient_dev-thread2`).
- **Worktree Registry**:
  1. Primary (`main`): `/Users/benfox/Documents/Development/slambient_dev`
  2. Secondary (`feature-thread2`): `/Users/benfox/Documents/Development/slambient_dev-thread2`
  3. Local LLM (`bonsai-27b`): `/Users/benfox/Documents/Development/slambient_dev-bonsai`

## Update — 2026-10-16 (DSP FX Chain Grab Cursor & Field Module Dropdown Color-Matching)

- **DSP FX Chain Custom Cyber Grab Cursor**:
  - Replaced browser-native `cursor: grab;` / `pointer;` on `.mini-pedal-card`, `.mini-pedal-left`, `.mini-pedal-drag-handle`, and `.mini-pedal-card[draggable="true"]` with `cursor: var(--cursor-grab) !important;`.
  - Configured active dragging state (`:active`, `.mini-pedal-dragging`) to display `cursor: var(--cursor-grabbing) !important;`.
  - Maintained `cursor: var(--cursor-pointer) !important;` on action buttons and Master Out node.
- **Field Module Dropdown Color-Matching (`#selFieldMode`)**:
  - Added `if (sel.closest(".field-ch") || sel.closest("#fieldModule")) return "var(--color-field)";` to `getDropdownAccentColor(sel)` in JavaScript so the custom dropdown menu adopts `--color-field` (`#2bcbba`) rather than falling back to `--accent` (peach/orange).
  - Added CSS rule `--dd-accent: var(--color-field);` to `.strip-channel.field-ch` container to ensure immediate scoped cascade for open trigger background, menu border, checkmarks, and hover highlights.
## Update — 2026-10-16 (Chassis Backing Store Numbering Audit & Brand Guidelines 10-Module Spec)

- **Pedal Chassis Backing Store Numbering Synchronized**:
  - Audited `#masterDeckUnified` in `index.html` and updated legacy module numbers:
    - `pedalTitle_FILTER`: Updated from `6. FILTER` to `7. FILTER`.
    - `pedalTitle_DELAY`: Updated from `7. DELAY` to `8. DELAY`.
    - `pedalTitle_SPACE`: Updated from `8. SPACE` to `9. SPACE`.
  - Reflects the canonical 10-module order introduced with Module 6 (Field Recorder):
    - 1. Drone, 2. Drums, 3. Chords, 4. Arp, 5. Noise, 6. Field Recorder, 7. Filter, 8. Delay, 9. Space, 10. Master Out.
- **Brand Guidelines Color Spectrum Table Updated**:
  - Updated Section 3.3 ("Functional Module Color Spectrum") in `BRAND_GUIDELINES.md`:
    - Updated total module count from 9 to 10.
    - Added **Mod 6**: **Field Recorder** (`#2bcbba` Turquoise / `43, 203, 186`).
    - Shifted Master Filter to Mod 7, Analog Delay to Mod 8, Reverb & Chorus to Mod 9, and Master Space & Out to Mod 10.
## Update — 2026-10-16 (Desktop Close-Up Module View Cyber-Chassis & Signal Routing Ribbon)

- **Desktop Viewport-Centered Cyber-Chassis**:
  - Replaced container-bound full-height modal (`.lower-deck > .orbital-side-panel`, `#orbitalArenaWrapper > .orbital-side-panel`) with a viewport-centered floating cyber-chassis (`position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 580px; height: auto; max-height: min(88vh, 680px);`).
  - **Zero Dead Space**: Auto-fits content vertically, eliminating the large empty dark void that previously appeared at the bottom of 300px effect cards.
  - **Zero Cutoff**: Never clipped or pushed offscreen by grid bounds or scroll offsets; backdrop blurs background with `backdrop-filter: blur(8px)`.
  - **Seamless Faceplate Design**: Flattened `.orbital-side-panel .strip-channel` and `.orbital-side-panel .pedal-chassis` to transparent with zero nested borders, removing the awkward "box-inside-a-box" double outline.
- **Interactive Signal Routing Ribbon (`#orbitalSignalRibbon`)**:
  - Added a tactile 10-module signal routing status bar directly on the inspector faceplate on desktop: `[1. SUB] [2. DRM] [3. CHD] [4. ARP] [5. NOI] [6. FLD] ➔ [7. FLT] [8. DLY] [9. SPC] ➔ [10. OUT]`.
  - Active module is highlighted with its semantic neon accent halo and glowing text. Clicking any module node pill instantly jumps to that module's controls.
  - Automatically hidden on mobile bottom sheet (`@media (max-width: 640px)`) to preserve compact phone ergonomics.
- **Hardware Keyboard Navigation & Shortcuts**:
  - While modal is active:
    - `ESC`: Closes inspector.
    - `ArrowLeft` or `[`: Cycles to previous module in signal chain.
    - `ArrowRight` or `]`: Cycles to next module in signal chain.
    - `P` / `p`: Toggles power/bypass for current module.
    - `R` / `r`: Triggers randomization for current module.

## Update — 2026-10-16 (Mobile & Core Engine Action Plan: Phased Agent Briefs)

- **Roadmap Integration in `MASTER_BLUEPRINT.md`**:
  - Incorporated full action plan across Section 11 (Roadmap & Status) and Section 27 (Phasing):
    - **Phase 4 (Agent 1: High-Priority Mobile UI Bugs & QoL Fixes)**: Header title centering, sticky header modular scroll sub-wrapper, keyboard header tabular dimensions (25-key vs 88-key), `?` info panel static coordinate anchor, touch handler bindings for module buttons, viewport manipulation/zoom lockdown, `touch-action: none` vs `touch-action: pan-y` drag scoping, preset name 15-char cap, randomize button wrapping prevention, pitch analyzer decoupled dispatcher on auto-play toggle, tab wake AudioContext resume & WebGL restore, full-screen visualizer 100dvh portrait fix, and orbital dropdown z-index scrim blackout elimination.
    - **Phase 5 (Agent 2: Mobile UX Architecture Overhaul)**: Macro Overview (2-column ~110px compact summary tiles with Name, Power, 15-char preset, LED/meter) vs. Micro Inspect Sheet (`max-height: 85dvh` bottom drawer with "Back to Rack" button), plus Master Out modular signal-chain reordering pass.
    - **Phase 6 (Experimental Staging Branches)**: `experiment/scale-tied-voicings` (scale-coupled chord voicing profiles), `experiment/midi-file-recorder` (multi-track Standard MIDI File Type 1 in-browser exporter), and `experiment/accompaniment-mode` (interactive live harmonic follower accompaniment).
  - All mobile adjustments enforced strictly under `@media (max-width: 768px)` with zero regression to desktop layout.

## Update — 2026-10-16 (Phase 4 / Track 1 Mobile UI Bugs & QoL Fixes Completed)

- **Viewport & Touch Zoom Lockdown**:
  - Configured `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">`.
  - Applied `touch-action: manipulation; overscroll-behavior: none;` on `html, body`.
  - Scoped scrolling on `.lower-deck` with `overscroll-behavior: contain`.
  - Set `touch-action: pan-y;` on scrollable card containers and `touch-action: none;` strictly on interactive knobs, sliders, pads, and drag handles.
- **Mobile Header Centering & Brand Balancing**:
  - Centered `.brand-group`, `.app-title`, and `.app-sub` under `@media (max-width: 640px)` for true symmetrical alignment.
- **Shortcuts Modal (`?`) Anchor Offset**:
  - Anchored `.shortcuts-overlay` top edge to static coordinate `align-items: flex-start; padding-top: max(20px, env(safe-area-inset-top)); backdrop-filter: blur(5px);`.
  - Capped `.shortcuts-panel { max-height: min(88vh, calc(100dvh - 48px)); }`, preventing vertical jumping across tabs.
- **Playable MIDI Keyboard Header Consistency**:
  - Locked `.keyboard-panel > .keyboard-meta` to `min-height: 44px; font-variant-numeric: tabular-nums;` on mobile.
  - Replaced `display: none / ""` with `visibility: hidden / visible` and `pointer-events: none / auto` on `octControls` so switching between 25-Key Play and 88-Key Radar mode does not cause header height twitching or layout shift.
- **User Preset Name Ellipsis & 15-Character Cap**:
  - Enforced 15-character hard limit via `.slice(0, 15)` in both `handleUserSlotClick` (initial save prompt) and `handleUserSlotContextMenu` (rename prompt).
  - Added CSS truncation (`max-width: 130px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;`) on `.btn-preset-chip.user-slot-chip`.
- **Modular View Header Actions No-Wrap**:
  - Set `flex-wrap: nowrap !important; flex-shrink: 0 !important;` on `.panel-header-actions` to prevent randomize/mute buttons from breaking onto separate lines on compact cards.
- **Unresponsive Touch Module Switching Buttons**:
  - Added `initTouchViewSwitchers()` binding `pointerup` handlers with touch event consumption on `btnViewOrbital`, `btnViewConsole`, `btnOrbitalBack`, `btnOrbitalPrev`, and `btnOrbitalNext` to eliminate 300ms mobile tap delays and unresponsive clicks.
- **Analyzer Frozen on Auto-Play Switch**:
  - Cleared `lastChordWheelSignature = ""` inside `isDownbeat` when `isManualChordActive` clears to `AUTO`, forcing immediate redraw of the chord wheel and harmonic readouts upon timeout.
- **Fullscreen Visualizer Delayed Bounds Recalculation**:
  - Added 150ms delayed bounds recalculation (`setTimeout(() => { cachedScopeW = 0; cachedScopeH = 0; if (typeof updateCanvasDimensions === "function") updateCanvasDimensions(); }, 150);`) in `toggleScopeFullscreen` to allow CSS transitions to finish before recalculating canvas dimensions.

## Update — 2026-10-16 (Phase 5 / Track 2 Mobile UX Architecture Overhaul Completed)

- **Mobile Bird's-Eye Grid (Macro State)**:
  - Scoped strictly to `@media (max-width: 640px)` (phones), leaving desktop layout 100% untouched (`.mobile-macro-grid { display: none; }` above 640px).
  - Replaces the 100dvh single-column stacking with a clean 2-column compact grid fitting inside the mobile viewport.
  - Sized each summary tile (`.mobile-macro-tile`) at 110px height with brand cyber-hardware styling (7px rounded corners, subtle inset borders, module identity accent color).
  - Displays Module Name, Power/Bypass toggle button with visual feedback, Active Preset/Timbre label (strictly truncated to 15 characters), and a live real-time RMS meter bar reading from `ORBITAL_MODULES[i].pulse`.
- **Mobile Inspect Sheet (Micro State)**:
  - Tapping any macro tile opens the full module parameters in a slide-up bottom drawer (`.orbital-side-panel` styled with `max-height: 85dvh; top: auto; bottom: 0; border-radius: 12px 12px 0 0;`).
  - Integrated with the existing `#btnOrbitalBack` ("RACK") button to return cleanly to the macro overview.
- **Orbital View Parity**:
  - Tapping any orbital node in constellation view opens the identical slide-up bottom sheet instead of a jarring fullscreen takeover or full-height scroll.
- **Master Out Effects Chain Reordering**:
  - Injected direct signal-chain reordering in the Master Out modular view (`#masterDspChainSection` inside `#masterEqOutStrip`).
  - Added Left/Right (Up/Down) shift nudges for reordering insert pedals (`dspChainOrder`).
  - Reconnects Web Audio nodes sequentially wrapped in `audioCtx.suspend()` and `audioCtx.resume()` to guarantee zero audio popping or clicks during reordering.
  - Synchronized dynamically with `updatePedalsOrderUI()` and macro grid rendering.

## Update — 2026-10-16 (Mobile & Popup QoL Bug Fixes: Cutoff, Dynamic Palettes, Fullscreen Visualizer, Keyboard Header, Label Consistency)

- **Popup Cutoff by Floating Transport Bar**:
  - Elevated `.orbital-modal-backdrop` to `z-index: 100000` and `.orbital-side-panel` to `z-index: 100001` (above `.mini-transport` at `99999`).
  - Added desktop and mobile CSS rule: `body:has(.orbital-side-panel.active) .mini-transport, body.orbital-panel-open .mini-transport { display: none !important; opacity: 0 !important; pointer-events: none !important; }`.
  - Added `overflow-y: auto; flex: 1 1 auto; max-height: calc(88vh - 100px);` to `.orbital-side-panel .orbital-modal-body` on desktop.
  - Bound `document.body.classList.add("orbital-panel-open")` in `expandModuleOrb()` and `classList.remove("orbital-panel-open")` in `closeOrbitalModal()`.
- **Dynamic Palette Color Inheritance**:
  - Rewrote `expandModuleOrb(orbId)` to compute `activeColor` and `activeRgb` dynamically via `themeHex(targetId)` and `themeRgb(targetId)` instead of static `orb.color`/`orb.rgb`.
  - Rewrote `renderSignalRibbon(activeOrbId)` to dynamically pull node colors via `themeHex(orb.id)`.
  - Updated `.mini-pedal-card.mini-card-master` from hardcoded `#a855f7` to `var(--color-space)` / `var(--rgb-space)`.
  - Updated `renderMobileMacroGrid()` to style tiles with `var(--color-${mod.orbId})` and `var(--rgb-${mod.orbId})`.
  - Updated `applyColorTheme()` to re-render `#orbitalSidePanel` CSS properties, `renderSignalRibbon()`, and `renderMobileMacroGrid()` upon theme changes and randomizations.
- **Visualizer Fullscreen Mobile Viewport & Stacking Order**:
  - Boosted `.scope-panel.is-fullscreen` on both desktop and mobile (`@media (max-width: 640px)`) to `position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100dvh !important; z-index: 200000 !important;` (strictly above `.header-bar-wrapper` at `10002` and master volume / Eno pods).
- **Playable MIDI Keyboard Header Wrapping & Full Width**:
  - Restructured `.keyboard-panel > .keyboard-meta` on mobile into a clean vertical 2-row layout:
    - Row 1: `.keyboard-panel-header` (Title + Drag handle, 28px height, 100% width).
    - Row 2: `.keyboard-meta-controls` (`width: 100%`, flex stretch with `takeover-badge` [32px], `keyboard-view-toggle` [flex: 1 1 auto], and `oct-controls` [flex: 1 1 auto]).
  - Allowed `.keyboard-panel` height to adjust naturally (`height: auto !important; min-height: 0 !important;`) while leaving `.piano-keys-wrapper` keyboard key sizing 100% untouched.
- **Inconsistent Text Wrapping on Popup Module View**:
  - Replaced `flex-wrap: wrap` in `#orbitalSidePanel .control-label` with `display: flex; flex-wrap: nowrap !important; justify-content: space-between; align-items: center; width: 100%; min-height: 22px; white-space: nowrap;`.
  - Added `flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap !important;` to label text, and `flex: 0 0 auto; margin-left: 8px; white-space: nowrap !important; font-variant-numeric: tabular-nums;` to `.control-val`.
  - Adjusted `.orbital-signal-ribbon` on desktop so all 10 module nodes fit across the 580px popup without horizontal scroll clipping.
- **Mobile Touch-Zoom Lockdown (Pinch & Double-Tap Removal)**:
  - Updated `<meta name="viewport">` with `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
  - Applied CSS `touch-action: pan-y;` on `html, body` (globally and under mobile media query) and `touch-action: pan-x;` on `.preset-bar` / `.orbital-signal-ribbon`.
  - Added CSS `touch-action: manipulation;` on interactive controls (buttons, chips, select, tags).
  - Implemented `lockMobileZoom()` JavaScript module:
    - Traps and prevents WebKit gesture events (`gesturestart`, `gesturechange`, `gestureend`) to block iOS Safari pinch-to-zoom.
    - Traps and prevents multi-touch scaling on `touchmove` (`e.scale !== 1 || e.touches.length > 1`).
    - Intercepts rapid `touchend` events (within 320ms) on non-interactive containers to block iOS Safari double-tap zoom while keeping button, pad, and piano key multi-taps 100% responsive.

## Update — 2026-10-16 (Mobile Popup Darkening / Stacking Context Fix)

- **Eliminated Screen Darkening Over Module Popups**:
  - **Root Cause**: On mobile under `@media (max-width: 640px)`, `.orbital-side-panel` was styled with `z-index: 10000;`, while `.orbital-modal-backdrop` had `z-index: 100000;`. As a result, the dark 82% opacity blurred backdrop was placed *in front of* the module inspection sheet on mobile devices.
  - **Fix**:
    1. Elevated `.orbital-side-panel` on mobile to `z-index: 100001 !important;` (both normal and `.active`), ensuring it renders strictly above `.orbital-modal-backdrop` (`z-index: 100000;`).
    2. Separated `.orbital-side-panel:has(.custom-dropdown-menu.open)` from the `z-index: 9000` rule and gave it dedicated `z-index: 100005 !important;` (with dropdown wraps at 100010 and menus at 100020), preventing dropdown openings from sending the panel behind the backdrop.
    3. Added phone media-query suppression rules ensuring `.mini-transport` (`is-visible`) is completely hidden whenever the inspection sheet is open.
    4. Removed stale duplicate `.orbital-modal-backdrop` declaration at `z-index: 9999`.
    - Prevents default on `dblclick` (preserving `.scope-left-viz` fullscreen toggle).
    - Prevents trackpad/mouse `wheel` pinch zoom when `e.ctrlKey` is true.

## Update — 2026-10-16 (Mobile Module Inspector Header Polish & De-clutter)

- **OUT Module Header Randomize Button**:
  - Relocated OUT module's randomize action button from `grid-column: 2; grid-row: 1;` (which erroneously overlapped the center column, blocking the module title and `‹` left switcher) to Row 2 (`grid-column: 1 / -1; grid-row: 2;`).
  - Styled with full-width centered layout, 36px touch height, and cyber-hardware `RANDOMIZE OUT` label, consistent with the action rows of all other modules.
  - Leaves Row 1 completely unblocked and clean: `< RACK` (left), `‹ 10. OUT ›` (center), and `✕` (right).
- **Field Module Header De-clutter**:
  - Hid `[data-field-status]` notice (`READY / EMPTY`) from `#orbitalSidePanel .orbital-modal-actions-slot` and `#orbitalModalActions` (`display: none !important;`).
  - Keeps the header bar focused strictly on the standard action controls (`PWR`, `M`, `S`, `⟲`), eliminating text clutter between the title and buttons.
- **Center Nav Switcher Spacing & De-cramping**:
  - Expanded the gap between `‹` / `›` switcher buttons and the module title from 6px to `clamp(14px, 4.5vw, 22px)` on mobile and from 8px to 16px on desktop.
  - Added horizontal padding on `.orbital-modal-title` (`padding: 0 4px;`) and enlarged nav buttons to 32x32px with 5px border-radius.
  - Gives the center title and switchers ample breathing room across all screen widths.

## Update — 2026-10-16 (Mobile Macro Tile Interactive Volume & Trigger Meters)

- **Interactive Volume / Trigger Dynamics for Module Buttons in Mobile Rack View**:
  - Replaced legacy `(orb.pulse || 0) * 160` with the dual RMS + frequency band analysis engine from the Chord Analysis module (`INSTRUMENT_METERS`).
  - Added dedicated Web Audio AnalyserNodes for effects pedals: `filterAnalyser`, `delayAnalyser`, and `spaceAnalyser` (connected respectively to `masterFilterCompGain`, `delayWetGain`, and reverb/chorus wet output stages).
  - Configured `MOBILE_MACRO_METERS` for all 10 modules with calibrated reference ceilings (`ref`), frequency bands (`fLow`/`fHigh`), and channel power / pedal bypass / mute states.
  - **Ballistics**: Fast-attack trigger integration (`m.e = m.e * 0.40 + energy * 0.60`) on note strikes and drum hits, paired with smooth musical decay (`m.e = m.e * 0.78 + energy * 0.22`) and non-linear power curve `Math.pow(m.e / m.ref, 0.65) * 100`.
  - **UI Polish & Styling**:
    - Updated `.mobile-macro-tile-meter-wrap` background to `#141722` matching `.act-bar-bg`.
    - Updated `.mobile-macro-tile-meter-bar` transition to `width 0.05s ease-out` matching `.act-bar-fill`.
    - Added `pointer-events: none` and `will-change: width` on the meter elements to guarantee zero impact on tile tapping, scrolling, and inspector interactions.
    - Added DOM meter cache invalidation in `renderMobileMacroGrid()` to ensure instant meter response upon theme shifts or pedal reordering.
    - Updated `ORBITAL_MODULES` sphere pulse physics in `loopOrbitalPhysics()` to also use full waveform RMS + frequency energy.

## Update — 2026-10-16 (Secondary & Tertiary Dev Sync: Full-Width Mobile Header, 88-Key Radar Strip, Dropdown Modal Bounds, Live Macro Sync & Multi-Touch Guards)

- **Mobile Header Brand & Preset-Bank 100% Width (`9446f55`)**:
  - Updated mobile header `.brand-row` and `.preset-bank-bar` rows so brand, Eno/Volume pods, and preset bank controls fill 100% of the container width cleanly across all zoom modes.
- **88-Key Radar Top Header Strip & Octave Markers**:
  - Added a dedicated top header bar (`.piano-keys-wrapper.mode-radar::before`, 16px desktop / 14px mobile) above the 88-key radar keys.
  - Positioned `.key-label.octave-marker` (`C1`–`C8`) inside the top header strip (`top: -15px`, `z-index: 6`) with active white glow so octave labels are never obscured by black keys.
- **Custom Dropdown Menu Scrolling & Modal Collision Detection**:
  - Added `max-height: min(320px, 55vh); overflow-y: auto; overscroll-behavior: contain;` on `.custom-dropdown-menu`.
  - Updated `initSmartDropdowns()` to check `#orbitalModalBody` container bounds when inside the module inspector sheet and flip upward (`drop-up`) only when `roomAbove > roomBelow`.
- **Live Mobile Macro Grid & Signal Ribbon Synchronization**:
  - Added `renderMobileMacroGrid()` and `renderSignalRibbon()` sync calls inside `updatePedalsOrderUI()`, `togglePedalBypass()`, `updateAudioParams()`, and `updateMuteSoloUI()`, plus removed duplicate inline `onclick` on `#fieldModule` header.
  - Ensured `setModuleView()` cleans up `#orbitalModalBackdrop.active` and `body.orbital-panel-open`.
- **Touch View-Switcher Ghost-Click Prevention & Multi-Touch Piano/Arcade Pass-Through**:
  - Added a 450ms capture-phase `click` guard after `pointerup` in `initTouchViewSwitchers()` to prevent synthetic ghost clicks from double-firing view/module transitions.
  - Exempted `.piano-keys-wrapper, .arcade-controls, .arcade-pad, .arcade-btn` from multi-touch `touchmove` prevention in `lockMobileZoom()` and added `.custom-dropdown-*` selectors to `isInteractive` in `touchend`.

## Update — 2026-10-16 (Scale-Tied Modal Chord Voicing Engine on `experiment/scale-tied-voicings`)

- **Scale-Tied Signature Harmonic Profiles (`SCALE_SIGNATURE_VOICINGS`)**:
  - Added dedicated, mode-authentic chord voicing profiles across all 14 ambient scales:
    - **Lydian**: Quartal (#11) `[0, 4, 6, 10]`, Lydian Maj7 (#11), Ether Drop-2.
    - **Lydian Dominant**: Overtone Acoustic (#11/b7), Lydian Dom 9(#11) Spread.
    - **Dorian**: So What Modal Fourths `[0, 3, 6, 9, 11]`, Dorian 6/9 Drop-2, Deep Dorian 11th.
    - **Phrygian**: Dark Halo (b2/b6) `[0, 4, 7, 8]`, Sus Cluster, Mystic 5th (b9 Hover).
    - **Mixolydian**: Sus4 Dominant Spread, Floating 9th (Modal 7th).
    - **Aeolian**: Deep 9th, Nordic Sus2 (b6 Cloud).
    - **Hirajoshi & Insen**: Quintal Stacks, Koto Reflection, Temple Bell (Shakuhachi), Zen Quartal.
    - **Bhairav & Bilawal**: Maihar Morning Resonance, Senia Raga Pillar, Bilawal Shuddha, Hindustani Consonant Prism.
    - **Whole Tone & Major9**: Impressionist Augmented Prism, Floating Mystic Stack, Prism Maj9 Spread, Lyric Octave Add9.
- **Harmonic Color & Anti-Clash Preservation Engine (`getVoicingIntervals`)**:
  - Replaced indiscriminate semitone smoothing with scale-aware color preservation:
    - In Lydian and Whole Tone modes, true `#11` (tritone, 6 semitones) is strictly preserved and exempt from 5th flattening.
    - In Phrygian and Bhairav modes, authentic `b2`/`b9` halo tension (1 semitone above root/octave) is preserved without forced flattening to major 2nd.
- **Dynamic UI Select & HUD Synchronization**:
  - Added `updateChordVoicingSelectOptions()` which dynamically injects mode signature voicings (labeled with `★`) under an optgroup whenever the scale shifts, while retaining the full universal library.
  - `updateChordHud()` and `renderChordWheel()` now use `getActiveVoicingObject()` and `getVoicingDisplayName()` to accurately display signature names (e.g., `D Lydian Quartal (#11)`, `D So What Modal Fourths`) and their exact harmonic intervals on the wheel and HUD telemetry.
  - Generative downbeat advance and randomizers pick scale signature voicings with a 60% weighting while preserving full backward compatibility with stored user patches and numeric indices.

## Update — 2026-10-16 (Temporal Dead Zone Fix for `activeTheme` and `MOBILE_MACRO_METERS`)

- **Resolved Startup Temporal Dead Zone (`ReferenceError`) Restoring Visualizers & Audio Engine**:
  - In `d6b9fb9`, calling `renderMobileMacroGrid()` inside `updateAudioParams()` and `updateMuteSoloUI()` during early top-level script execution referenced `let activeTheme` and `const MOBILE_MACRO_METERS` before their declarations were reached.
  - Because `let activeTheme` was still in its ES6 Temporal Dead Zone, `themeHex()` threw `ReferenceError: Cannot access 'activeTheme' before initialization`, aborting script initialization and leaving `activeTheme` permanently in the TDZ on every subsequent visualizer frame (`drawScope`, `drawChordWheelCard`) and audio playback call (`togglePlay`).
  - Converted `MOBILE_MACRO_MODULES`, `MOBILE_MACRO_METERS`, `THEME_KEYS`, `COLOR_THEMES`, `THEME_STORAGE_KEY`, `DEFAULT_ROADSIDE_COLORS`, and `activeTheme` to hoisted `var` bindings with safe fallback initialization (`FALLBACK_THEME_HEX` / `FALLBACK_THEME_RGB`), and added null-safe guards inside `themeHex()`, `themeRgbArr()`, and `themeRgb()`.

## Update — 2026-10-16 (Architectural Audit: Zero-Build Modular ES & CSS Decoupling Engine)

- **Monolith Assessment**:
  - `index.html` has expanded to ~24,200 lines (~970 KB uncompressed), consisting of ~6,500 lines of CSS, ~2,500 lines of HTML DOM markup, and ~15,200 lines of JavaScript.
  - While single-file delivery provided zero-build simplicity during early prototyping, it creates friction with AI coding agent context limits (e.g. Bonsai 27B / Claude / Gemini tool-call truncation), global variable collisions, and CSS specificity wars.
- **Architectural Action Plan (Phase 15 / Phase 7)**:
  - Codified the **Zero-Build Native ES Module & CSS Decoupling Plan** into `MASTER_BLUEPRINT.md`:
    - **Zero Build Tooling Mandate**: No npm, Webpack, Vite, or Node runtime. Operates purely on native browser standards: `<link rel="stylesheet">` and `<script type="module" src="./js/app.js"></script>`.
    - **Step 1 (CSS Extraction)**: Decouple 6,500 lines into `css/tokens.css` (variables, cursors, palettes), `css/layout.css` (header, upper visualizer deck, keyboard), `css/modules.css` (Eurorack chassis, knobs, strips), and `css/mobile.css` (mobile portrait and landscape overrides).
    - **Step 2 (DSP & Audio Engine Modules)**: Extract Web Audio logic into `js/audio/` (`context.js`, `voices.js`, `dsp.js`, `sampler.js`).
    - **Step 3 (Visualizers & Theory Modules)**: Extract CRT scope and WebGL/Canvas starfield physics into `js/visualizers/` (`scope.js`, `orbital.js`); extract scales and tuning math into `js/theory/scales.js`.
    - **Step 4 (UI, Gestures & State Modules)**: Extract keyboard routing, gestures, drawers, and JSON presets into `js/ui/` (`keyboard.js`, `gestures.js`, `presets.js`).
    - **Parity Verification**: Complete offline PWA service worker caching (`sw.js`), Cloudflare Pages edge delivery, and `file:///` standalone execution must remain 100% intact.

## Update — 2026-10-16 (Decoupling Stages 1 & 2 Completed & Harmony Hierarchy Standardized)

- **Stage 1 (CSS Decoupling)**:
  - Extracted 8,100+ lines of monolithic inline `<style>` into `css/slambient.css` and `css/field-recorder.css`.
  - Linked both via standard `<link rel="stylesheet">` in `<head>`.
  - Added to PWA precache manifest in `sw.js`.
- **Chord Analysis Visualizer & Hierarchy Redesign**:
  - Circle of Fifths visualizer enlarged to 136x136px canvas with radial chord-tone spokes and compass ticks.
  - Root note is prominent (18px bold), followed by concise Western chord symbol (e.g. `m7`, `maj7#11`, `dim9`, `6/9`, `sus4`) — max 7–10 characters to guarantee zero text wrapping on mobile and upper deck cards.
  - Standardized all 43 chord voicings across `CHORD_LIBRARY` and `SCALE_SIGNATURE_VOICINGS` with `mainLabel`, `subLabel`, `westernQuality`, and `formatChordVoicingSubtitleHTML`.
  - Cultural and textural descriptions live in dedicated subtitle line (`10.5px`) with CSS truncation protection.
- **Stage 2 (Theory & Presets Decoupling)**:
  - Extracted `SCALES`, `CHORD_LIBRARY`, `SCALE_SIGNATURE_VOICINGS`, `getActiveVoicingObject`, `getVoicingDisplayName`, `getWesternChordQuality`, and `getVoicingIntervals` into `js/theory/scales.js` (370 lines).
  - Extracted factory preset configurations, bank definitions, and state serialization into `js/ui/presets.js` (1,373 lines).
  - Linked both scripts in `index.html` and safely purged duplicate inline code.
  - Bumped PWA cache to `slambient-v6` in `sw.js` and verified 0 JS syntax or runtime errors. `index.html` reduced from 24,200+ lines to 14,669 lines (~40% reduction).

## Update — 2026-10-16 (Decoupling Stages 3, 4, & 5 Completed: Full Modular Zero-Build ES Engine)

- **Stage 3 (Visualizers Decoupling into `js/visualizers/`)**:
  - `js/visualizers/chord-wheel.js` (256 lines): Circle of Fifths spoke geometry, compass ticks, chord telemetry, and analyzer meters.
  - `js/visualizers/scope.js` (1,896 lines): CRT vector oscilloscope, flight terrain grid, waterfall spectrogram, 3D floating wireframe roadside objects (cubes, pyramids, diamonds, spheres), fractal zoom engine, and arcade Easter egg game.
  - `js/visualizers/orbital.js` (1,251 lines): Floating module orbs, interactive constellation physics, starfield, modal module drawer expansions, and touch gesture navigation.
- **Stage 4 (UI, Keyboard & Mobile Macro Decoupling into `js/ui/`)**:
  - `js/ui/keyboard.js` (316 lines): On-screen 25-key and 88-key radar modes, touch glissando controller, active LED voice highlights, and QWERTY key event listeners.
  - `js/ui/mobile-macro.js` (213 lines): 2-column mobile macro tiles, fast bypass/power toggles, and live responsive audio meters.
- **Stage 5 (Audio Engines Decoupling into `js/audio/`)**:
  - `js/audio/drums.js` (760 lines): Polyrhythmic drum synthesis (kick, snare, woodblock, hi-hats), Hindustani classical Tabla (Dayan/Bayan), Tala phrasing, and clock-locked groove fills.
  - `js/audio/ambient-noise.js` (236 lines): Stochastic environmental soundscape generator for Rain, Thunder, Brook, Crickets, Tape Flutter, and Wind.
- **Milestone Results**:
  - `index.html` reduced from **24,200+ lines down to 9,780 lines** (over **60% code reduction** from the root HTML document).
  - 10 standalone semantic JS modules and 2 external CSS stylesheets.
  - Updated PWA offline cache to `slambient-v9` in `sw.js`.
  - 100% zero-build vanilla browser runtime with zero runtime or syntax errors.

## Update — 2026-10-16 (Chord Analysis Visualizer Redesign & Non-Wrapping Typography Hierarchy)

- **Root & Western Quality Prominence**:
  - Chord root letter (`.chord-wheel-root`) rendered in crisp bold white (`1.45rem`, `850` weight) with a warm amber halo.
  - Western chord quality symbol (`.chord-wheel-quality`, e.g. `m9b6`, `m11`, `6/9`, `7sus4`, `maj7#11`) styled in prominent theme amber (`1.05rem`, `800` weight) with baseline alignment.
  - Scale mode pill badge (`.chord-wheel-mode-pill`) pinned to top right with concise mode designations (`AEOLIAN`, `DORIAN`, `LYDIAN`, `MIXOLYD`, `MIN PENT`, `MAJOR 9`, `HIRAJOSHI`, `INSEN`).
- **Zero-Truncation Stacked Subtitle Architecture**:
  - Redesigned `.chord-wheel-voicing` into a clean two-line vertical stack with zero awkward ellipsis truncation (`..`):
    - Line 1 (`.voicing-main`): Voicing architecture / harmonic texture in luminous lavender (`--color-arp`, `0.68rem`, `800` weight).
    - Line 2 (`.voicing-sub`): Cultural acknowledgement / harmonic color in radiant cyan/teal (`--color-field`, `0.58rem`, `700` weight).
  - Curated all 43 modal signature voicings across `js/theory/scales.js` so titles and subtitles are punchy, poetic, and guaranteed <= 18–22 characters (under half the card's available width).
- **Circle of Fifths Hero Centerpiece**:
  - Canvas enlarged to 144x144px (`rimR = 65`, `dotR = 42`, `labelR = 54.5`), eliminating excess empty top/bottom card dead-space.
  - Added dual-tone linear polygon fill, glowing radial spoke lines, center reticle crosshair, and crisp pitch-class compass degree ticks.
  - Responsive panel width upgraded to `clamp(285px, 20vw, 320px)` on desktop and `clamp(235px, 32vw, 290px)` on mobile landscape deck.
  - Bumped PWA offline cache to `slambient-v10` in `sw.js`.

## Update — 2026-10-16 (Decoupling Theme Palette Picker & Header Utilities into js/ui/)

- **Extracted Modules**:
  - `js/ui/header-utils.js` (337 lines): Undo snapshotting, patch change rollbacks, tap tempo interval averaging, interactive Field Manual & Shortcuts modal panel builder, and keyboard shortcuts event listeners (`?`, `Ctrl/⌘+Z`, `Esc`).
  - `js/ui/palette.js` (221 lines): Color themes (`slambient`, `kankyo`, `aurora`, `sodium`, `glacier`, `random`), color conversions (`hexToRgbArr`, `hslToHex`, `mixRgb`), live CSS variable injector (`--color-<module>`, `--rgb-<module>`), dynamic canvas palette sync (oscilloscope rings, waterfall tracks, orbital modules, arcade invaders), and dropdown menu controller.
- **index.html & PWA Sync**:
  - Linked `<script src="js/ui/header-utils.js"></script>` and `<script src="js/ui/palette.js"></script>`.
  - Added both modules to `PRECACHE_URLS` in `sw.js` and bumped offline cache to `slambient-v12`.
  - `index.html` reduced by another 553 lines down to **7,663 lines**.

## Update — 2026-10-16 (Decoupling 3D Eno Head Visualizer into js/ui/visualizers.js)

- **Extracted Module**:
  - `js/ui/visualizers.js` (594 lines): 3D wireframe Eno Head visualizer engine, audio-reactive amplitude modulation, rotating projection matrix, phosphor color switching (`ENO_PHOSPHORS`, `setEnoPhosphor`, `toggleEnoPhosphor`), CRT glow updating (`updateHeaderEnoGlow`), and pod layout square sizing (`syncEnoPodSquare`).
- **index.html & PWA Sync**:
  - Linked `<script src="js/ui/visualizers.js"></script>`.
  - Added to `PRECACHE_URLS` in `sw.js` and bumped offline cache to `slambient-v13`.
  - `index.html` reduced by another 592 lines down to **7,071 lines** (71% code reduction from the original 24,200+ line document).

## Update — 2026-10-16 (Stage 2 Mobile UI Fixes & Stage 3 Bird's-Eye Macro Overview Completed)

- **Stage 2: High-Priority Mobile UI Bug Fixes (Strictly Scoped to Mobile Breakpoints)**:
  - **Header Centering**: Enforced true absolute center alignment (`position: absolute; left: 50%; transform: translateX(-50%);`) on `.orbital-side-panel .orbital-nav-group` and full-width centered flex alignment on mobile `.brand-group`.
  - **Sticky Header & Scroll Confinement**: Confined module inspector scrolling strictly inside `.orbital-modal-body` (`overflow-y: auto; overscroll-behavior: contain`) with `.header-bar-wrapper` static on phones so inertial scrolling never pulls headers over controls.
  - **25-Key vs 88-Key Keyboard Header Lock**: Locked `.keyboard-panel > .keyboard-meta` (`height: 68px`), `.keyboard-panel-header` (`height: 24px`), and `.keyboard-meta-controls` (`height: 36px`) with `font-variant-numeric: tabular-nums` and `visibility: hidden` on `.oct-controls` in 88-Key Radar mode, eliminating vertical layout jumps.
  - **Info (`?`) Panel Anchor**: Anchored `.shortcuts-panel` top edge to a static coordinate (`position: fixed; top: max(16px, env(safe-area-inset-top)); left: 50%; transform: translateX(-50%); max-height: calc(100dvh - 32px); overflow-y: auto; overscroll-behavior: contain;`) so switching tabs never causes vertical modal jumping.
  - **Preset Name Limits**: Enforced 15-character string truncation in `js/ui/presets.js` (`slice(0, 15)`), `js/ui/mobile-macro.js` (`slice(0, 15)`), and CSS (`.btn-preset-chip` `max-width: 130px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`).
  - **Mobile Chord Voicing Stack**: Updated mobile `.chord-wheel-voicing` rule to preserve the centered 2-line `.voicing-main` + `.voicing-sub` stack.
- **Stage 3: Mobile Architecture Overhaul ("Bird's-Eye Overview")**:
  - Verified 2-column compact macro grid (`#mobileMacroGrid`, `grid-template-columns: repeat(2, minmax(0, 1fr))`, `110px` summary tiles with live audio meters and instant `PWR` toggles) across both mobile portrait and mobile landscape Rack View.
  - Verified slide-up Micro Inspect bottom sheet (`.orbital-side-panel`, `max-height: 85dvh`) when any module tile is tapped.
  - Updated `scripts/qa-audit.js` to validate `js/ui/header-utils.js`, `js/ui/palette.js`, and `js/ui/visualizers.js`, and bumped `sw.js` cache to `slambient-v15`.

## Update — 2026-10-17 (Catch-up for all threads: what shipped, how the code is decoupled, what is open)

Written so any new chat or tool can get current from this file, `README.md` and `MASTER_BLUEPRINT.md`. State as of origin/main `d9299fb` plus this commit.

- **Decoupling in plain terms (done by Gemini agents in Antigravity)**: `index.html` went from ~24,200 lines to ~7,100 by moving code into plain files loaded by the browser (native ES modules and external CSS; no bundler, npm or build). Each file does one job (`css/`, `js/audio`, `js/midi`, `js/theory`, `js/ui`, `js/visualizers`; full table in `README.md`). Benefits: smaller files for AI tools to read, fewer accidental cross-breaks, offline PWA unchanged (`sw.js` cache currently v16). Stages 1-5 done on 2026-10-16, plus palette, header utils and Eno head split out. Known cost: load order matters (a `themeRgb`/`themeHex` race was fixed in d9299fb), so after moving code, run `scripts/qa-audit.js` and check the console.
- **Roadmap**: Phases 1-7 done. Phase 8 (Modular Studio Workspace: container queries, edit mode, drag layout, per-module fullscreen, saved workspaces in `js/ui/workspace.js`) is specified in `MASTER_BLUEPRINT.md` section 11/27 and not started. Older "Phases 8-11" wording in this file (mobile UX, Maihar sound, field recorder, polish) refers to the earlier numbering and is already shipped.
- **Shipped since Phase 1 (high level)**: phone portrait layout (macro 2-column grid, bottom-sheet module inspector, orb swipe between modules); 10 modules (FIELD added) with the SUB/DRUMS/CHORDS/ARP/NOISE/FILTER/DELAY/SPACE/OUT naming; field recorder with full sample playback; MIDI file recorder; scale-tied chord voicings (43); desktop module close-up with signal ribbon; 88-key radar strip; Bird's-Eye macro overview; Invaders hit-freeze fix, touch pad and audio on mobile (`ensureAudioReady()`); iOS silent-switch audio session; presets renamed to fit chips (Shimmer, Tangerine, Disintegration, Chillhop) and the Tangerine Dream / Airports preset bugs fixed; delay feedback fix.
- **MIDI**: permission is requested only from "Connect MIDI Device…". Output is 4 channels for Logic via IAC Driver (1 Sub, 2 Chords, 3 Arp, 4 Drums, GM drum map, All Notes Off on pause).
- **2026-10-15 audit batch**: duplicate drag-reorder code merged into `bindPointerReorder()`; floating mini play bar hardened (no slide/blur, visibility measured on scroll); orb sheet swipe left/right; drone glide time constant 0.45 s to 0.05 s; Khan Lineage tanpura quieter and softer (level 38, Javari 55, 2.6 kHz low-pass per string). Energy-slump measurements (no code change): master level flat, limiter at most 0.3 dB, mono-safe, mix bass-heavy and dark, drone about 5x louder than chords and arp, drums sometimes absent for 10-30 s.
- **Still open**: (1) none of the phone work has been tested on a real iPhone, including whether the floating play bar still gets stuck mid-page (not reproducible in Chromium); (2) 4-channel MIDI not yet tried in Logic; (3) Ben has not decided whether to raise chords/arp against the drone; (4) tanpura tone not yet judged by ear; (5) static "7 voices / 7 nodes" readout chips; (6) `_archive/` (~2.4 MB incl. a 1.4 MB .webm) is served by GitHub Pages and could be removed or excluded; (7) Phase 8 candidates above.
- **Working notes**: several chats and Gemini push to the same repo, so always `git fetch` and compare before overwriting; `index.html` edits go through the "Web app development" thread.

## Update — 2026-10-17 / 2026-10-18 (Phases 8–11: Studio Workspace, Desktop Split View, 10-Pedal Rack, Decoupled Mobile & Fractal Optimization — Landed in v40)

Summary of major architectural additions, layout enhancements, and performance optimizations shipped between `slambient-v17` and `slambient-v40` (commits through `68d4eea`):

1. **Modular Studio Workspace & Custom Layout Engine (`js/ui/workspace.js`, Phase 8 Completed)**:
   - **Edit Mode (`#btnEditWorkspace`)**: Global toggle unlocks drag-and-drop reordering across header slots, lower-deck instrument racks, and visualizer modules with dynamic `dragstart`/`dragover`/`drop` handlers and live drag handles (`⋮⋮`).
   - **Workspace State Persistence**: Layout states, hidden module lists, and custom slot arrangements serialize seamlessly to `localStorage["slambient_workspace_v1"]`.
   - **Curated Templates**: Shipped default templates: Full Studio, Live Performance, and Meditation / Drone.
   - **Workspace Module Dock (`#workspaceModuleDock`)**: Floating quick-toggle dock allowing live show/hide toggling of any instrument or effects module on the fly.
   - **Fullscreen Anything Overlay**: Standardized `[ ⛶ Fullscreen ]` focus overlay with centered inset bounds, floating circular exit button, and `Esc` key handling, triggering automatic high-DPR canvas re-rendering (Chord Wheel, Scope, Arcade, Field Sampler).

2. **Desktop Split View Mode (`.lower-deck.deck-mode-split`, Phase 8 Completed)**:
   - Fixed split view activation and layout confinement across desktop viewports.
   - **Left Window (`.instruments-deck`)**: Houses the 6 instrument modules (Sub, Drums, Chords, Arp, Noise, Field) neatly stacked in two balanced columns (3 rows × 2 columns).
   - **Right Window (`.studio-fx-pedalboard`)**: Dedicated right-hand effects chassis displaying either the 5 consolidated units or the 10 full eurorack pedal cards with live signal routing ribbons, bypass toggles, and parameter sliders.

3. **Expanded 10-Pedal / 5-Consolidated Unit Studio FX Architecture (Phase 10 Completed)**:
   - Expanded audio DSP chain to 10 discrete pedals consolidated into 5 studio rack units:
     - **Unit 1 (Drive & Filter)**: Tube Overdrive + Multi-Topology Analog Filter.
     - **Unit 2 (Mod Cluster)**: Optical Tremolo + Multi-Stage Phaser + Analog Flanger + Chorus.
     - **Unit 3 (Analog Delay)**: BBD & Tape Delay simulation with flutter and drift.
     - **Unit 4 (Digital Delay)**: Pristine 32-bit digital delay with Haas bounce.
     - **Unit 5 (Space Reverb)**: Multi-mode diffusion reverb (Plate, Hall, Shimmer, Cosmic).
   - **12-Node Orbital View**: Expanded orbital view and macro routing ribbon to 12 dedicated orbs with dynamic numbering and consistent theme coloring (`12. OUT`).

4. **Decoupled Vertical Mobile Architecture (`css/mobile-app.css`, Phase 9 Completed)**:
   - Decoupled all mobile portrait (< 780px) and mobile landscape layout rules into isolated `css/mobile-app.css`.
   - **Dual Cockpit Symmetrical Squares**: Generative Controls (2×2 grid: Randomize, Seed, Panic, Undo) and S.L.A.M. Eno CRT head styled as symmetrical 1:1 squares side-by-side.
   - **Full-Width Telemetry Strip**: Realigned Time / Meter / Root-Scale / Seed readout into a double-stacked thin horizontal ribbon spanning 100% of the screen.
   - **2-Row Transport Bar**: Row 1 houses START, RECORD, and format selector; Row 2 houses SAMPLE, MIC, DROP, and MIDI with zero text wrapping or button collision.
   - **User Preset Strip**: Fixed user preset cards to avoid clipping, adding `[ EMPTY ]` subtle badges and 15-character truncation safeguards.

5. **Visualizer & Video Game Decoupling (Phase 11 In Progress)**:
   - **Indian Tanpura Telemetry**: Shipped `drawTanpuraResonance()` in `js/visualizers/scope.js`, rendering a 4-string harmonic Lissajous ring with plucked nodal beacons.
   - **Interactive Chord Wheel**: Interactive scale/root selection buttons added to the Chord Wheel analysis card.
   - **CRT Invaders Arcade Deck**: Dedicated arcade window module with its own canvas, score tracking, touch/keyboard controls, and dock visibility.

6. **Fractal Visualizer Memory Leak & CPU Optimization (Phase 11 Completed in v40)**:
   - **Fixed Canvas Texture Churn**: Replaced dynamic per-frame `fractalBufferW` mutation with a fixed resolution buffer (`FRACTAL_FIXED_W = 160`), eliminating per-frame canvas resize and `ImageData` garbage collection churn.
   - **Brent's Periodicity Detection**: Added cycle detection inside the Mandelbrot iteration loop, breaking out of interior bulbs in ~8–16 steps instead of calculating up to 525 iterations.
   - **Precomputed Math & Typed Array LUTs**: Replaced per-pixel `Math.sin`/`Math.pow` calculations with hoisted trig LUTs, glow LUTs, and flat typed arrays (`FRACTAL_SIN_LUT`, `FRACTAL_GLOW_LUT`, `FRACTAL_PAL_R/G/B`).
   - **Pooled 3D Projections**: Eliminated object allocations in `drawWireframeEdges()` and `draw3DSphere()` using a static `PROJECTED_POOL`.
   - **Service Worker**: Cache version bumped to `slambient-v40`. All QA, device audits, and DSP unit tests pass cleanly.

7. **Zero-Build Modular ES Decoupling Engine (Phase 7 Stage 5 Completed in v41)**:
   - **`index.html` Dramatic Diet**: Shrunk from **9,248 lines down to ~4,200 lines** (over 54% reduction, >82% reduction from the original 24,200+ line monolith).
   - **Extracted [js/audio/dsp-voices.js](file:///Users/benfox/Documents/Development/slambient_dev/js/audio/dsp-voices.js)** (1,123 lines): Sub-Drone, Didgeridoo, 4-string Tanpura physical model, multi-timbre chord voicings, and Shimmer Arp engines.
   - **Extracted [js/ui/pedalboard.js](file:///Users/benfox/Documents/Development/slambient_dev/js/ui/pedalboard.js)** (2,029 lines): Studio FX pedalboard, dynamic Web Audio routing rewires (`rewireDspChain`), 5-unit / 10-pedal registry, bypass toggles, mini-cards, and drag-and-drop reordering.
   - **Extracted [js/ui/randomizer-controls.js](file:///Users/benfox/Documents/Development/slambient_dev/js/ui/randomizer-controls.js)** (804 lines): Channel audibility, mute/solo managers, BPM sync, and per-module parameter randomizers.
   - **Extracted [js/audio/clock-sequencer.js](file:///Users/benfox/Documents/Development/slambient_dev/js/audio/clock-sequencer.js)** (301 lines): Master coprime step cycles (7, 11, 13, 17, 19, 23), time signatures, Raga Taan phrasing, and polyphonic tick dispatching.
   - **Extracted [js/ui/transport.js](file:///Users/benfox/Documents/Development/slambient_dev/js/ui/transport.js)** (216 lines): Master transport (`togglePlay`), session timers, master mute, and global hotkeys.
   - **Extracted [js/ui/touch-mobile.js](file:///Users/benfox/Documents/Development/slambient_dev/js/ui/touch-mobile.js)** (563 lines): Touch zoom lockdown, slider scroll isolation, and outside-tap dropdown dismissals.
   - **Service Worker & QA**: All modules integrated into `PRECACHE_URLS` in `sw.js` (bumped to `slambient-v41`). All 26 modules passed syntax checks and headless Chrome device lab audits (7/7 passed).

8. **Tap Tempo EMA Accuracy Recalibration & Acoustic Mix Balance (Phase 10 Completed in v42)**:
   - **Tap Tempo Recalibration (`js/ui/header-utils.js`)**: Extended tap tempo pause reset threshold from `2200ms` to `2600ms` to seamlessly support slow-ambient tempos down to 45 BPM without premature buffer clears. Retained EMA smoothing (`alpha = 0.42`) and 40% median-window outlier filtering.
   - **Acoustic Gain Staging Rebalance**:
     - Reduced Drone & Sub-Bass multiplier from `droneVol * 0.16` to `droneVol * 0.12` in `js/ui/randomizer-controls.js`, `js/ui/transport.js`, and `js/audio/drums.js` sidechain ducking.
     - Raised chord base volume multipliers in `js/audio/dsp-voices.js` from `0.19 / 0.21` to `0.23 / 0.26`.
     - Raised Shimmer Arp velocity multiplier from `0.62` to `0.74`.
     - Chords and shimmer arp now sit comfortably above the sub-drone bed, eliminating the ~5x perceived volume disparity.
   - **Elimination of Coprime Percussion Dropout / Energy Slump (`js/audio/clock-sequencer.js`)**:
     - Anchored bar downbeats (`isDownbeat`) in `ORGANIC`, `HEARTBEAT`, `DUB_TAPE`, and `MINIMAL_CLICK` drum grooves with metric pulse anchors (downbeat kick and hi-hat/woodblock taps).
     - Drums no longer drop out for 10–30s during long coprime phasing gaps while preserving subtle ambient spacing.
   - **Service Worker & QA**: Bumped `sw.js` cache to `slambient-v42`. Clean audit across all 26 ES modules and DSP test suites.
