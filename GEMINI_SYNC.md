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

## If you're making changes

Keep editing `index.html` in place at the canonical path. If you want to hand something back for
review, say so explicitly and name what changed rather than sending a whole new file copy — that's
exactly the pattern that caused the fragmentation this note is cleaning up.
