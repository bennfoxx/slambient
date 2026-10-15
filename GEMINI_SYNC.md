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
  - `Tangerine Dream` (Berlin School Phrygian sequences, pulsing arpeggiators, `FILTER ➔ DELAY ➔ SPACE` sweeps feeding cathedral reverb)
  - `William Basinski` (Tape decay mechanics in 3/4, pitch drift, continuous vinyl/tape hiss, `SPACE ➔ DELAY ➔ FILTER` routing feeding dark low-pass filter to muffle repeat tails)
  - `Lo-Fi Chillhop` (Boom-bap swing, dusty Rhodes chords, window rain gusts, `FILTER ➔ DELAY ➔ SPACE` signal chain for warm tape saturation)

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

