# Slambient Brand Guidelines & Design System Master Specification

**Version:** 1.0.0 (Unified Edition)  
**Status:** Canonical Reference Document  
**Canonical App Location:** `/Users/benfox/Documents/Development/slambient_dev/index.html`  
**Master Blueprint:** `/Users/benfox/Documents/Development/slambient_dev/MASTER_BLUEPRINT.md`  

---

## 1. Brand Core & Aesthetic Philosophy

### 1.1 Brand Identity & Purpose
**Slambient** is a boutique hybrid generative ambient audio workstation and hardware instrument platform (SLOOP / Felucca FM-1). It merges the infinite harmonic generative algorithms of Brian Eno with the tactile, industrial utility of Dieter Rams / Teenage Engineering hardware and the nostalgic analog decay of Boards of Canada, Hiroshi Yoshimura (*Kankyo Ongaku*), and the Maihar Indian classical tradition.

### 1.2 Core Product Pillars
1. **Zero Clutter & Strict Visual Symmetry:** Interfaces must feel balanced, calm, and intentional. An orphaned button, asymmetric margin, or uneven column split degrades user immersion.
2. **Modular Completeness:** Every component (pedal chassis, strip channel, toolbar section, telemetry pill) is designed as a self-contained, complete modular unit. No element should look half-finished, clipped, or ambiguously docked.
3. **Typography Integrity & Zero Text Overwrapping:** Text strings must **never** wrap into ugly multi-line orphans, collide with adjacent icons, or get truncated by ellipses unless explicitly designated as a scrolling label or compact telemetry chip.
4. **Tactile Hardware Metaphor:** Digital controls mirror physical Eurorack modules, machined cold-rolled steel rails, knurled dials, and calibrated LED indicators.

---

## 2. Strict UI Layout Principles & Anti-Patterns

### 2.1 The Symmetry Law
* **Balanced Split Ratios:** In landscape and multi-column views, components must align to disciplined geometric divisions ($50/50$, $60/40$, $33/33/33$, or $25/25/25/25$).
* **Matched Element Heights:** Interactive siblings within the same horizontal row (e.g. `START`, `RECORD`, `MIDI`, format selectors) must share identical vertical heights (e.g. 40px in mobile portrait, 30px in mobile landscape, 34px in desktop header).
* **Balanced Anchor Points:** Popup sheets and modal dialogs must balance left and right actions symmetrically around a mathematically centered title and navigation core (`margin: 0 auto; justify-self: center;`).

### 2.2 Text Wrapping & Truncation Guardrails
> [!IMPORTANT]
> **Zero Text Overwrapping Rule:** Under no viewport width or screen density may button text, badge tags, or labels wrap into unexpected multi-line fragments or collide with borders.

* **Fixed Height + Multi-Line Prevention:** Action buttons (`.btn-main-play`, `.btn-record`, `.btn-telemetry-action`, `.badge-tag`) must enforce `white-space: nowrap !important;` and `text-overflow: clip;`.
* **Dynamic Sizing Allocation:** If an element needs to display dynamic data (e.g., recorded sample length, waveform canvas, BPM readout), its container must use flexible grid spans (e.g. `grid-column: 1 / -1; width: 100%;`) rather than crowding adjacent fixed-width buttons.
* **Text Wrap Balance:** For unavoidable multi-word headings (such as rack section titles), always specify `text-wrap: balance;` to eliminate trailing single-word orphans.

### 2.3 Modular Element Completeness
* **Self-Contained Enclosures:** Every card or module must feature complete border definitions, subtle inset drop shadows, and consistent corner radii (2px for hardware badges/dropdowns; 4px for buttons; 6px–8px for Eurorack chassis).
* **Integrated States:** Every interactive modular element must declare complete states: **Default**, **Hover / Pointer Focus**, **Active / Pressed**, and **Muted / Bypassed**.

---

## 3. Color Architecture & Design Tokens

### 3.1 Chassis & Background Palette (Dark Ambient Canvas)

| Token Name | CSS Variable | Hex Code | Purpose |
| :--- | :--- | :--- | :--- |
| **Chassis Pitch** | `--bg-darker` | `#040507` | Deepest chassis base, starfield void |
| **Workstation Base** | `--bg` | `#07080c` | Primary canvas background with subtle grid |
| **Module Panel** | `--panel` | `#0d0f17` | Eurorack module faceplate background |
| **Eurorack Dark Slate** | `--chassis-slate` | `#2B2D31` | Physical hardware pedal faceplates |
| **Mounting Rails** | `--rail-steel` | `#3F4248` | Cold-rolled machined Eurorack mounting rails |
| **Chassis Border (Low)** | `--border` | `#1a1e2b` | Structural card borders and container divisions |
| **Chassis Border (Mid)** | `--border-light` | `#282e42` | Interactive component outlines and dividers |
| **Chassis Border (High)**| `--border-bright`| `#3b4460` | Hover states, active focus highlights |

### 3.2 Neutral Typography Stack

| Token Name | CSS Variable | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Text Primary** | `--text-primary` | `#e6ebf5` | Active titles, parameter readouts, key labels |
| **Text Secondary** | `--text-secondary` | `#8e9bb5` | Control sublabels, inactive buttons, HUD tags |
| **Text Tertiary** | `--text-tertiary` | `#525c74` | Hardware hints, inactive telemetry, micro-stamps |

### 3.3 Functional Module Color Spectrum
Each of the 10 generative modules and signal stages is bound to an immutable semantic neon accent:

| Module # | Name | Semantic Role | Hex Accent | RGB Values |
| :--- | :--- | :--- | :--- | :--- |
| **Mod 1** | **Sub / Drone** | Fundamental anchor, Tanpura | `#00e5ff` (Cyan) | `0, 229, 255` |
| **Mod 2** | **Organic Drums** | Tabla, heartbeat, rhythm | `#ff3838` (Crimson) | `255, 56, 56` |
| **Mod 3** | **Chords & Voicing**| Harmonic pad, sitar, keys | `#fed330` (Yellow) | `254, 211, 48` |
| **Mod 4** | **Shimmer Arp** | High-register cascade, Bansuri | `#7d5fff` (Indigo) | `125, 95, 255` |
| **Mod 5** | **Noise / Atmosphere**| Tape hiss, vinyl, environmental | `#1dd1a1` (Mint) | `29, 209, 161` |
| **Mod 6** | **Field Recorder** | Live mic capture, sample playback | `#2bcbba` (Turquoise) | `43, 203, 186` |
| **Mod 7** | **Master Filter** | 24dB ladder, formant shaping | `#2ed573` (Emerald) | `46, 213, 115` |
| **Mod 8** | **Analog Delay** | Tape, BBD, tempo-sync repeats | `#ff793f` (Tangerine) | `255, 121, 63` |
| **Mod 9** | **Reverb & Chorus** | Cathedral wash, 3-phase chorus | `#ff5fc4` (Hot Pink) | `255, 95, 196` |
| **Mod 10** | **Master Space & Out**| Bus limiter, tape drive, output | `#4b7bec` (Blue) | `75, 123, 236` |

* **Global UI Accent (`--accent`):** Defaults to `--color-chord` (`#fed330`) with `--accent-dim` (`rgba(254, 211, 48, 0.14)`).

---

## 4. Typography System

### 4.1 Typeface Families
To ensure identical visual metrics across macOS, iOS, Windows, Linux, and Android without falling back to misaligned system defaults, two webfonts are loaded via Google Fonts:

1. **Monospace Telemetry & Hardware Face:**
   * **Family:** `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
   * **Weights:** `400` (regular readouts), `600` (parameter labels), `700`/`800` (silkscreened titles, button tags).
   * **Usage:** **All** UI buttons, knobs, telemetry values, chord wheels, presets, and Eurorack faceplates.
2. **Modern Sans Interface Face:**
   * **Family:** `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
   * **Weights:** `400` (regular body), `500` (subtitles), `600` (headings).
   * **Usage:** Descriptive help tooltips, modal explanatory paragraphs, legal notices.

### 4.2 Typographic Hierarchy & Scale

```
SLAMBIENT               -> 22px / Weight 900 / Letter-Spacing 4px / Upper (Brand Wordmark)
MEANDER ENGINE          -> 8.5px / Weight 700 / Letter-Spacing 1.2px / Upper (Sub-badge)
1. SUB DRONE            -> 12.5px / Weight 800 / Letter-Spacing 1.2px / Upper (Module Title)
CUTOFF FREQUENCY        -> 10.5px / Weight 600 / Letter-Spacing 0.6px / Upper (Control Label)
2400 HZ / 64%           -> 11px / Weight 700 / Letter-Spacing 0px / Monospace (Parameter Value)
TIME: 00:42             -> 9.5px / Weight 600 / Letter-Spacing 0.8px / Upper (Telemetry Chip)
```

---

## 5. Component Anatomy & Symmetry Guidelines

```
+-------------------------------------------------------------------------+
| [START] (50%)                       | [RECORD] (40%)      [FMT v] (10%) |
+-------------------------------------------------------------------------+
| [MIC]  [DROP]  [~~~ LIVE WAVEFORM EXPANSION AREA ~~~]  [EJECT] (100%)    |
+-------------------------------------------------------------------------+
| [KEY: D]  [SCALE: DORIAN AMBIENT                              v] (100%) |
+-------------------------------------------------------------------------+
| [METER: 7/4  CYCLE] (50%)           | [TEMPO: 72 BPM  =====*===  TAP] (50%)|
+-------------------------------------------------------------------------+
| [RANDOMIZE ALL] (50%)               | [UNDO] (50%)                      |
+-------------------------------------------------------------------------+
| [PALETTE] (50%)                     | [? HELP] (25%)  [FULLSCREEN] (25%)|
+-------------------------------------------------------------------------+
```

### 5.1 Symmetrical Control Pairing Matrix
* **Primary Transport Row:** `START` is matched side-by-side with `RECORD` and its format dropdown.
* **Sampling Full-Width Row:** The field sampler occupies a dedicated full-width strip so audio waveforms expand fluidly without altering neighboring column widths.
* **Generative & Utility Pairing:** `RANDOMIZE ALL` and `UNDO` pair on an identical 50/50 horizontal axis. `PALETTE` pairs with `? HELP` and `FULLSCREEN`.
* **Telemetry Readouts:** Always render in a balanced $2\times2$ grid or a single contiguous 4-chip horizontal strip (`TIME`, `METER`, `ROOT/SCALE`, `SEED`).

### 5.2 Rotary Knobs & Sliders
* **Track Height:** 4px uniform height across all range inputs.
* **Thumb Geometry:** 14px knurled circle with a high-contrast center indicator line and active glow on drag.
* **Touch-Action Isolation:** All sliders and rotary dials must enforce `touch-action: none !important;` to completely prevent page rubber-banding during touch gestures.

### 5.3 Hardware Cursors
Desktop sessions utilize custom SVG sci-fi reticle cursors that elevate the instrument aesthetic:
* **Default Canvas:** Precision reticle dot with dashed circular guidance lines (`--cursor-default`).
* **Interactive Elements:** Framing corner crosshairs with yellow center focal pip (`--cursor-pointer`).
* **Node Dragging:** Expanding cyan target ring with amber core (`--cursor-grab` and `--cursor-grabbing`).

---

## 6. Eurorack Modular Grid System (Part VI Standards)

* **Horizontal Pitch (HP) Standards:**
  * Fixed Rack Width: **32 HP** per row on mobile (2-column layout); **64 HP** on desktop.
  * Utility / LFO Modules: **8 HP** width.
  * Standard Processing Modules (Filter, EQ, Saturation): **16 HP** width.
  * Complex Generators / Effects (Multi-Delay, Reverb): **24 HP** width.
* **Surface Styling:** Anodized dark slate faceplates (`#2B2D31`), cold-rolled steel rails (`#3F4248`), corner hex-screw accents, and 6px metallic patch jacks.
* **Patch Cables:** Curving SVG cubic beziers with natural gravity slack (Neon teal `#00E5FF` for audio routing; Amber `#FFB000` / Violet `#A855F7` for CV/modulation).

---

## 7. Quality Checklist for Future PRs & Reviews

Before landing any UI change, verify against this definitive brand checklist:

- [ ] **Symmetry:** Are siblings in this row mathematically equal in height and proportion?
- [ ] **Zero Overwrapping:** Do button titles remain strictly single-line on small screens (e.g. iPhone SE / 375px width)?
- [ ] **No Ellipsis Collisions:** Does dynamic text leave adequate breathing room before badges or icons?
- [ ] **Color Semantic Compliance:** Does this module strictly use its assigned accent color and RGB token?
- [ ] **Font Purity:** Are buttons and readouts rendering in `JetBrains Mono` without falling back to generic system sans?
- [ ] **Touch Isolation:** Does sliding this parameter prevent mobile screen scroll (`touch-action: none`)?
- [ ] **Modular Completeness:** Does the module chassis feel visually finished with borders, inset shading, and header actions?
