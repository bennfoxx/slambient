const SCALES = {
  DORIAN:        [0, 2, 3, 5, 7, 9, 10],
  LYDIAN:        [0, 2, 4, 6, 7, 9, 11],
  AEOLIAN:       [0, 2, 3, 5, 7, 8, 10],
  MIXOLYDIAN:    [0, 2, 4, 5, 7, 9, 10],
  PENTATONIC:    [0, 3, 5, 7, 10],
  MAJOR9:        [0, 2, 4, 7, 9, 11],
  HIRAJOSHI:     [0, 2, 3, 7, 8],        // Traditional Japanese ambient pentatonic scale
  INSEN:         [0, 1, 5, 7, 10],       // Meditative Japanese shakuhachi / temple scale
  LYDIAN_DOM:    [0, 2, 4, 6, 7, 9, 10], // Space ambient / overtone scale
  PHRYGIAN:      [0, 1, 3, 5, 7, 8, 10], // Phrygian mode: dark meditative drone
  WHOLE_TONE:    [0, 2, 4, 6, 8, 10],    // Dreamlike floating impressionism (Whole tone)
  MAJ_PENTATONIC:[0, 2, 4, 7, 9],        // Pure pastoral bright peace
  BILAWAL:       [0, 2, 4, 5, 7, 9, 11], // Indian Classical Major Scale (Shuddha Swaras / Bilawal Thaat)
  BHAIRAV:       [0, 1, 4, 5, 7, 8, 11]  // Indian Classical morning raga (Maihar / Senia Gharana)
};

SCALES.PHRYGIAN_AMB = SCALES.PHRYGIAN;   // old key (same notes), kept so anything saved under it still resolves
const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const CIRCLE_OF_FIFTHS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

function degreeToSemitone(deg, scaleArr) {
  const len = scaleArr.length;
  const oct = Math.floor(deg / len);
  const idx = ((deg % len) + len) % len;
  return scaleArr[idx] + oct * 12;
}

const CHORD_LIBRARY = [
  { name: "WARM_9TH",       degrees: [0, 2, 4, 8],  mainLabel: "Warm 9th",       subLabel: "Velvet Voicing",     westernQuality: "9",        label: "Warm 9th (Velvet Voicing)" },
  { name: "DREAM_11TH",     degrees: [0, 4, 6, 9],  mainLabel: "Dream 11th",     subLabel: "Suspended Cloud",    westernQuality: "11",       label: "Dream 11th (Suspended Cloud)" },
  { name: "FLOATING_69",    degrees: [0, 2, 5, 8],  mainLabel: "Floating 6/9",   subLabel: "Pastoral Air",       westernQuality: "6/9",      label: "Floating 6/9 (Pastoral Air)" },
  { name: "SUS2_SPREAD",    degrees: [0, 1, 4, 7],  mainLabel: "Sus2 Spread",    subLabel: "Open Fifths",        westernQuality: "sus2",     label: "Sus2 Spread (Open Fifths)" },
  { name: "LYDIAN_ETHER",   degrees: [0, 4, 6, 8],  mainLabel: "Lydian Ether",   subLabel: "Raised #11",         westernQuality: "maj7#11",  label: "Lydian Ether (Raised #11)" },
  { name: "FIFTH_STACK",    degrees: [0, 4, 7, 11], mainLabel: "Fifth Stack",    subLabel: "Quintal Pillar",     westernQuality: "5",        label: "Fifth Stack (Quintal Pillar)" },
  { name: "QUARTAL_STACK",  degrees: [0, 3, 6, 9],  mainLabel: "Quartal Stack",  subLabel: "Modal Fourths",      westernQuality: "sus4",     label: "Quartal Stack (Modal Fourths)" },
  { name: "PRISM_MAJ9",     degrees: [0, 2, 4, 8],  mainLabel: "Prism Maj9",     subLabel: "Glass Voicing",      westernQuality: "maj9",     label: "Prism Maj9 (Glass Voicing)" },
  { name: "OCTAVE_BLOOM",   degrees: [0, 4, 7, 9],  mainLabel: "Octave Bloom",   subLabel: "Wide Overtone",      westernQuality: "add9",     label: "Octave Bloom (Wide Overtone)" },
  { name: "VELVET_ADD9",    degrees: [0, 2, 4, 9],  mainLabel: "Velvet Add9",    subLabel: "Warm Cluster",       westernQuality: "add9",     label: "Velvet Add9 (Warm Cluster)" },
  { name: "DEEP_MINOR11",   degrees: [0, 2, 4, 10], mainLabel: "Deep Minor 11",  subLabel: "Nocturnal",          westernQuality: "m11",      label: "Deep Minor 11 (Nocturnal)" },
  { name: "GHOST_DYAD",     degrees: [0, 4, 8],     mainLabel: "Ghost Dyad",     subLabel: "Hollow Fifth",       westernQuality: "5",        label: "Ghost Dyad (Hollow Fifth)" }
];

// Scale-Tied Modal Signature Voicings: Authentic harmonic morphologies tailored to each mode's character
const SCALE_SIGNATURE_VOICINGS = {
  LYDIAN: [
    { name: "LYDIAN_QUARTAL_11",   degrees: [0, 4, 6, 10], mainLabel: "Lydian Quartal",   subLabel: "#11 Cloud",                westernQuality: "maj7#11", label: "Lydian Quartal (#11)", allowTritone: true },
    { name: "LYDIAN_MAJ7_SHARP11", degrees: [0, 4, 6, 10], mainLabel: "Lydian Maj7",      subLabel: "Bright Cinematic #11",     westernQuality: "maj9#11", label: "Lydian Maj7 (#11)", allowTritone: true },
    { name: "ETHER_DROP2",         degrees: [0, 3, 6, 8],  mainLabel: "Ether Drop-2",     subLabel: "#11 / 9 Open Spread",      westernQuality: "maj7#11", label: "Ether Drop-2 (#11/9)", allowTritone: true }
  ],
  LYDIAN_DOM: [
    { name: "OVERTONE_ACOUSTIC",   degrees: [0, 2, 3, 6, 8], mainLabel: "Overtone Acoustic", subLabel: "#11 / b7 Acoustic Scale", westernQuality: "9#11",    label: "Overtone Acoustic (#11/b7)", allowTritone: true },
    { name: "LYDIAN_DOM_SPREAD",   degrees: [0, 4, 6, 10],   mainLabel: "Lydian Dominant",   subLabel: "Dominant 9(#11) Spread", westernQuality: "7#11",    label: "Lydian Dominant 9(#11)", allowTritone: true }
  ],
  DORIAN: [
    { name: "SO_WHAT_MODAL",       degrees: [0, 3, 6, 9, 11], mainLabel: "So What Modal", subLabel: "Bill Evans Fourths",      westernQuality: "m11",     label: "So What Modal Fourths" },
    { name: "DORIAN_NAT6_NINTH",   degrees: [0, 2, 5, 8],     mainLabel: "Dorian 6/9",    subLabel: "Natural 6th Drop-2",       westernQuality: "m6/9",    label: "Dorian 6/9 Drop-2" },
    { name: "DEEP_DORIAN_11",      degrees: [0, 2, 4, 10],    mainLabel: "Deep Dorian",   subLabel: "Nocturnal 11th",           westernQuality: "m11",     label: "Deep Dorian 11th" }
  ],
  PHRYGIAN: [
    { name: "PHRYGIAN_DARK_HALO",   degrees: [0, 4, 7, 8],  mainLabel: "Phrygian Halo",   subLabel: "b2 / b6 Dark Drone",       westernQuality: "m(b9)",   label: "Phrygian Dark Halo", allowFlatTwo: true },
    { name: "PHRYGIAN_SUS_CLUSTER", degrees: [0, 4, 8, 10], mainLabel: "Phrygian Sus",    subLabel: "Mystic Modal Cluster",     westernQuality: "sus4b9",  label: "Phrygian Sus b2/b6", allowFlatTwo: true },
    { name: "MYSTIC_FIFTH_B9",      degrees: [0, 4, 7, 8],  mainLabel: "Mystic 5th",      subLabel: "b9 Drone Hover",           westernQuality: "5b9",     label: "Mystic 5th (b9 Hover)", allowFlatTwo: true }
  ],
  MIXOLYDIAN: [
    { name: "MIXO_SUS4_SPREAD",    degrees: [0, 3, 6, 8], mainLabel: "Mixolydian Sus4", subLabel: "Pastoral Unresolved 4th",   westernQuality: "7sus4",   label: "Mixolydian Sus4 (Dominant)" },
    { name: "FLOATING_DOM9",       degrees: [0, 2, 4, 6, 8], mainLabel: "Floating 9th", subLabel: "Modal 7th Solina",          westernQuality: "9",       label: "Floating 9th (Modal 7th)" }
  ],
  AEOLIAN: [
    { name: "DEEP_AEOLIAN_9TH",    degrees: [0, 2, 4, 8], mainLabel: "Deep Aeolian",   subLabel: "Nordic Melancholy",        westernQuality: "m9",      label: "Deep Aeolian 9th" },
    { name: "NORDIC_SUS2_B6",      degrees: [0, 1, 4, 5], mainLabel: "Nordic Sus2",    subLabel: "b6 Cloud Ambient",         westernQuality: "sus2b6",  label: "Nordic Sus2 (b6 Cloud)" }
  ],
  MAJOR9: [
    { name: "PRISM_MAJ9_WIDE",     degrees: [0, 2, 4, 5], mainLabel: "Prism Maj9",     subLabel: "Crystalline Spread",       westernQuality: "maj9",    label: "Prism Maj9 Spread" },
    { name: "LYRIC_OCTAVE_ADD9",   degrees: [0, 2, 4, 7], mainLabel: "Lyric Octave",   subLabel: "Add9 Overtone Bloom",      westernQuality: "add9",    label: "Lyric Octave Add9" }
  ],
  PENTATONIC: [
    { name: "OPEN_QUINTAL_PENT",   degrees: [0, 2, 3, 5], mainLabel: "Open Quintal",   subLabel: "Deep Space Pentatonic",    westernQuality: "m7sus4",  label: "Open Quintal Pentatonic" },
    { name: "SUS_PENTATONIC_ARK",  degrees: [0, 1, 3, 6], mainLabel: "Suspended Ark",  subLabel: "Open Fifth Space",         westernQuality: "sus4",    label: "Suspended Pentatonic Ark" }
  ],
  MAJ_PENTATONIC: [
    { name: "PASTORAL_69_SPREAD",  degrees: [0, 2, 4, 6], mainLabel: "Pastoral 6/9",   subLabel: "Sunbreak Spread",          westernQuality: "6/9",     label: "Pastoral 6/9 Spread" },
    { name: "GOLDEN_FIFTH_STACK",  degrees: [0, 2, 4, 7], mainLabel: "Golden 5th",     subLabel: "Quintal Stack",            westernQuality: "5",       label: "Golden Fifth Stack" }
  ],
  HIRAJOSHI: [
    { name: "HIRAJOSHI_QUINTAL",   degrees: [0, 3, 5, 8], mainLabel: "Hirajoshi",      subLabel: "Japanese Kankyō Quintal",  westernQuality: "mb6",     label: "Hirajoshi Quintal Stack" },
    { name: "KOTO_REFLECTION",     degrees: [0, 2, 4, 7], mainLabel: "Koto Sakura",    subLabel: "Cherry Blossom Reflection", westernQuality: "m(add4)", label: "Koto Reflection (Cherry Blossom)" }
  ],
  INSEN: [
    { name: "INSEN_TEMPLE_BELL",   degrees: [0, 2, 4, 7], mainLabel: "Insen Bell",     subLabel: "Shakuhachi Temple Tone",   westernQuality: "sus4b9",  label: "Insen Temple Bell (Shakuhachi)" },
    { name: "ZEN_QUARTAL",         degrees: [0, 2, 5, 8], mainLabel: "Zen Quartal",    subLabel: "Floating Stone Fourths",   westernQuality: "sus4",    label: "Zen Quartal (Floating Stone)" }
  ],
  WHOLE_TONE: [
    { name: "IMPRESSIONIST_AUG",   degrees: [0, 2, 4, 7], mainLabel: "Impressionist",  subLabel: "Debussy Augmented Prism",  westernQuality: "aug",     label: "Impressionist Augmented Prism", allowTritone: true },
    { name: "FLOATING_MYSTIC_STACK", degrees: [0, 3, 5, 8], mainLabel: "Mystic Stack", subLabel: "Floating Whole-Tone",     westernQuality: "7b5",     label: "Floating Mystic Stack", allowTritone: true }
  ],
  BHAIRAV: [
    { name: "MAIHAR_RESONANCE",    degrees: [0, 3, 5, 8], mainLabel: "Maihar Raga",    subLabel: "Morning Raga Resonance",   westernQuality: "5(b2)",   label: "Maihar Morning Resonance", allowFlatTwo: true },
    { name: "SENIA_RAGA_PILLAR",   degrees: [0, 4, 7, 8], mainLabel: "Senia Gharana",  subLabel: "Classical Maihar Pillar",  westernQuality: "5(b2)",   label: "Senia Raga Pillar", allowFlatTwo: true }
  ],
  BILAWAL: [
    { name: "BILAWAL_SHUDDHA",     degrees: [0, 2, 4, 7], mainLabel: "Bilawal Thaat",  subLabel: "Shuddha Swara Harmony",    westernQuality: "maj",     label: "Bilawal Shuddha Swaras" },
    { name: "HINDUSTANI_PRISM",    degrees: [0, 3, 5, 8], mainLabel: "Hindustani",     subLabel: "Classical Consonant Prism", westernQuality: "maj7",    label: "Hindustani Consonant Prism" }
  ]
};

function getActiveVoicingObject(voicingId, scaleKey) {
  const sk = scaleKey || activeScaleKey;
  if (typeof voicingId === "string" && voicingId.startsWith("SIG_")) {
    const sigList = SCALE_SIGNATURE_VOICINGS[sk] || [];
    const idx = parseInt(voicingId.replace("SIG_", ""), 10);
    if (!isNaN(idx) && sigList[idx]) return sigList[idx];
  }
  const numIdx = typeof voicingId === "number" ? voicingId : parseInt(voicingId, 10);
  if (!isNaN(numIdx) && numIdx >= 0 && numIdx < CHORD_LIBRARY.length) {
    return CHORD_LIBRARY[numIdx];
  }
  return CHORD_LIBRARY[0];
}

function getVoicingDisplayName(voicing) {
  if (!voicing) return "Warm 9th (Velvet Voicing)";
  if (voicing.label) return voicing.label;
  return voicing.name.replace(/_/g, " ");
}

// Derives a concise, standard Western music chord quality suffix (max ~7 chars, e.g.
// "m7", "maj7", "dim9", "maj7#11", "m9", "6/9", "7sus4", "5") from semitone intervals
// so Root + Quality always fits on a single non-wrapping primary line.
function getWesternChordQuality(intervals) {
  if (!intervals || intervals.length === 0) return "";
  const pcs = new Set(intervals.map(iv => ((iv % 12) + 12) % 12));
  if (pcs.size <= 1) return "";

  const b2 = pcs.has(1);
  const M2 = pcs.has(2);
  const m3 = pcs.has(3);
  const M3 = pcs.has(4);
  const P4 = pcs.has(5);
  const tt = pcs.has(6);
  const P5 = pcs.has(7);
  const m6 = pcs.has(8);
  const M6 = pcs.has(9);
  const m7 = pcs.has(10);
  const M7 = pcs.has(11);

  if (pcs.size === 2) {
    if (P5) return "5";
    if (M3) return "maj";
    if (m3) return "m";
    if (P4) return "sus4";
    if (M2) return "sus2";
    if (tt) return "dim5";
    if (m6) return "b6";
    if (M6) return "6";
    if (m7) return "7";
    if (M7) return "maj7";
    if (b2) return "b9";
  }

  if (M3) {
    if (m6 && !P5) {
      if (M7) return "augMaj7";
      if (m7) return M2 ? "9#5" : "7#5";
      if (M2) return "aug9";
      return "aug";
    }
    if (M7) {
      if (tt) return M2 ? "maj9#11" : "maj7#11";
      if (M6) return "maj13";
      if (M2) return "maj9";
      return "maj7";
    }
    if (m7) {
      if (tt) return M2 ? "9#11" : "7#11";
      if (b2) return "7b9";
      if (M6) return "13";
      if (M2) return "9";
      return "7";
    }
    if (M6) return M2 ? "6/9" : "6";
    if (tt) return "add#11";
    if (P4) return "add11";
    if (M2) return "add9";
    return "maj";
  }

  if (m3) {
    if (tt && !P5) {
      if (M6) return M2 ? "dim9" : "dim7";
      if (m7) return M2 ? "m9b5" : "m7b5";
      if (M2) return "dim9";
      return "dim";
    }
    if (M7) return M2 ? "mMaj9" : "mMaj7";
    if (m7) {
      if (P4) return "m11";
      if (M2) return "m9";
      if (M6) return "m13";
      return "m7";
    }
    if (M6) return M2 ? "m6/9" : "m6";
    if (m6) return M2 ? "m9b6" : "mb6";
    if (P4) return "m11";
    if (M2) return "madd9";
    return "m";
  }

  // Suspended, quartal, quintal, and modal shells without 3rd
  if (M7) {
    if (tt) return M2 ? "maj9#11" : "maj7#11";
    if (M2) return "maj9";
    return "maj7";
  }
  if (m7) {
    if (tt) return M2 ? "9#11" : "7#11";
    if (P4 && M2) return "9sus4";
    if (P4) return "7sus4";
    if (M2) return "7sus2";
    return "7sus";
  }
  if (M6) {
    if (M2 && P4) return "6/9sus";
    if (M2) return "6/9";
    if (P4) return "6sus4";
    return "6";
  }
  if (b2) {
    if (P4) return "sus4b9";
    if (P5) return "5b9";
    return "b9";
  }
  if (P4) {
    if (m6) return "sus4b6";
    if (M2) return "sus2/4";
    return "sus4";
  }
  if (M2) {
    if (m6) return "sus2b6";
    return "sus2";
  }
  if (tt) return "sus#4";
  if (P5) return "5";
  return "sus";
}

const SCALE_BADGE_LABELS = {
  DORIAN: "DORIAN",
  LYDIAN: "LYDIAN",
  AEOLIAN: "AEOLIAN",
  MIXOLYDIAN: "MIXOLYDIAN",
  PENTATONIC: "MIN PENT",
  MAJOR9: "MAJOR 9",
  HIRAJOSHI: "HIRAJOSHI",
  INSEN: "INSEN",
  LYDIAN_DOM: "LYD DOM",
  PHRYGIAN: "PHRYGIAN",
  PHRYGIAN_AMB: "PHRYGIAN",
  WHOLE_TONE: "WHOLE TONE",
  MAJ_PENTATONIC: "MAJ PENT",
  BILAWAL: "BILAWAL",
  BHAIRAV: "BHAIRAV"
};

function getScaleDisplayBadge(scaleKey, isLive) {
  if (isLive) return "LIVE KEYS";
  return SCALE_BADGE_LABELS[scaleKey] || String(scaleKey || "MODAL");
}

function formatChordVoicingSubtitleHTML(voicingOrName) {
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  if (voicingOrName && typeof voicingOrName === "object" && voicingOrName.mainLabel) {
    const main = esc(voicingOrName.mainLabel);
    const sub = esc(voicingOrName.subLabel || "");
    if (sub) {
      return `<span class="voicing-main">${main}</span><span class="voicing-sep">·</span><span class="voicing-sub">${sub}</span>`;
    }
    return `<span class="voicing-main">${main}</span>`;
  }

  const clean = String(voicingOrName || "Warm 9th").trim();
  const parenMatch = clean.match(/^(.+?)\s*\((.+?)\)\s*$/);
  let mainPart = clean;
  let subPart = "";
  if (parenMatch) {
    mainPart = parenMatch[1].trim();
    subPart = parenMatch[2].trim();
  } else {
    const prefixes = [
      "So What", "Senia Raga", "Deep Dorian", "Dorian 6/9", "Deep Aeolian",
      "Open Quintal", "Prism Maj9", "Lyric Octave", "Phrygian Sus",
      "Hirajoshi", "Maihar", "Bilawal", "Hindustani", "Impressionist",
      "Pastoral", "Golden", "Suspended", "Phrygian", "Floating"
    ];
    for (const p of prefixes) {
      if (clean.toLowerCase().startsWith(p.toLowerCase() + " ")) {
        mainPart = clean.slice(0, p.length).trim();
        subPart = clean.slice(p.length).trim();
        break;
      }
    }
  }
  if (subPart) {
    return `<span class="voicing-main">${esc(mainPart)}</span><span class="voicing-sep">·</span><span class="voicing-sub">${esc(subPart)}</span>`;
  }
  return `<span class="voicing-main">${esc(mainPart)}</span>`;
}

function getVoicingIntervals(voicing, scaleArr, rootStep, options = {}) {
  const rootSemi = degreeToSemitone(rootStep, scaleArr);
  const raw = voicing.degrees.map(d => degreeToSemitone(rootStep + d, scaleArr) - rootSemi);
  
  // Scale-aware harmonic color preservation:
  // Lydian & Whole Tone retain pure #11 (tritone / 6 semitones).
  // Phrygian & Bhairav retain authentic b2/b9 color (1 semitone above octaves).
  const allowTritone = !!voicing.allowTritone || !!options.allowTritone || (activeScaleKey === "LYDIAN" || activeScaleKey === "LYDIAN_DOM" || activeScaleKey === "WHOLE_TONE");
  const allowFlatTwo = !!voicing.allowFlatTwo || !!options.allowFlatTwo || (activeScaleKey === "PHRYGIAN" || activeScaleKey === "BHAIRAV");

  const smoothed = [];
  for (let i = 0; i < raw.length; i++) {
    let iv = raw[i];
    // Preserve intentional modal b9/b2 in high halos; soften against raw root only in non-Phrygian/non-Bhairav modes
    if (iv > 0 && (iv % 12 === 1) && !allowFlatTwo) iv += 1;
    // Preserve authentic Lydian #11 / whole tone augmentations; soften bare tritone only when not permitted
    if (iv > 0 && (iv % 12 === 6) && !allowTritone) iv += 1;
    for (let j = 0; j < smoothed.length; j++) {
      const diff = Math.abs(iv - smoothed[j]);
      if (diff === 1 && !allowFlatTwo) iv += 12; // Spread 1-semitone adjacent rubs up an octave
    }
    smoothed.push(iv);
  }
  return smoothed.sort((a, b) => a - b);
}

// Bare scale-degree numbers (no "nd"/"rd"/"th" ordinal suffixes) -- with a
// full extended chord, those suffixes made the INTERVALS telemetry line
// long enough to force the Chord Analysis panel to reflow.
const DEGREE_LABELS = { 0: "R", 1: "2", 2: "3", 3: "4", 4: "5", 5: "6", 6: "7", 7: "8", 8: "9", 9: "10", 10: "11", 11: "12", 12: "13" };
function degreeLabel(d) { return DEGREE_LABELS[d] || `+${d}`; }

const CHORD_STEP_POOL = [0, 2, 3, 4, 5];

function pickNextChordStepIdx(prevIdx) {
  const weights = CHORD_STEP_POOL.map((_, i) => {
    if (i === prevIdx) return 0.15;
    const dist = Math.abs(i - prevIdx);
    let w = 1 / (1 + dist * 0.55);
    if (i === 0) w *= 1.35;
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = randFloat() * total;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) return i; }
  return weights.length - 1;
}

function pickNextVoicingIdx(prevIdx, scaleKey) {
  const sk = scaleKey || activeScaleKey;
  const sigList = SCALE_SIGNATURE_VOICINGS[sk] || [];
  // 60% probability of selecting an authentic modal signature voicing for the active scale
  if (sigList.length > 0 && randFloat() < 0.60) {
    const sigIdx = randRange(0, sigList.length - 1);
    const sigId = `SIG_${sigIdx}`;
    if (sigId !== prevIdx) return sigId;
  }
  if (CHORD_LIBRARY.length <= 1) return 0;
  let next;
  do { next = randRange(0, CHORD_LIBRARY.length - 1); } while (next === prevIdx);
  return next;
}
