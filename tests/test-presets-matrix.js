// Test suite for PRESET_SOUND_DESIGN_MATRIX and applyPreset(idx) in js/ui/presets.js
const assert = require("assert");
const fs = require("fs");

console.log("--> Testing PRESET_SOUND_DESIGN_MATRIX in js/ui/presets.js...");

// Mock browser environment for unit testing
const mockElements = {};
function createMockElement(id, initialVal = "") {
  return {
    id,
    value: initialVal,
    checked: false,
    classList: {
      toggle: () => {},
      add: () => {},
      remove: () => {}
    },
    options: [
      { value: initialVal },
      { value: "4/4" }, { value: "7/4" }, { value: "5/8" }, { value: "7/8" }, { value: "5/4" }, { value: "9/8" }, { value: "11/8" }, { value: "3/4" },
      { value: "WARM_PAD" }, { value: "SITAR_STRINGS" }, { value: "PURE_SINE_GLASS" }, { value: "CHAMBER_WOODS" }, { value: "CELESTIAL_ORGAN" }, { value: "VIBES_CELESTE" }, { value: "RHODES" },
      { value: "GLASS_FM" }, { value: "BANSURI_FLUTE" }, { value: "SINE_CRYSTAL" }, { value: "MUSIC_BOX" }, { value: "CONCERT_HARP" }, { value: "WATER_DROPLET" }, { value: "PIZZICATO_STRING" }, { value: "KALIMBA" },
      { value: "ORGANIC_KIT" }, { value: "ANALOG_CRUNCH" }, { value: "TAPE_DUST" }, { value: "ACOUSTIC_CHAMBER" },
      { value: "ORGANIC" }, { value: "TABLA_GROOVE" }, { value: "DUB_TAPE" }, { value: "MINIMAL_CLICK" }, { value: "HEARTBEAT" },
      { value: "RAIN" }, { value: "THUNDER" }, { value: "WHITE_TAPE" }, { value: "BROOK" }, { value: "CRICKETS" }, { value: "WIND" },
      { value: "GUSTS" }, { value: "CONTINUOUS" }, { value: "SPARSE" }, { value: "RHYTHMIC" }, { value: "STORM_SWELL" },
      { value: "DORIAN" }, { value: "LYDIAN" }, { value: "AEOLIAN" }, { value: "MIXOLYDIAN" }, { value: "PENTATONIC" }, { value: "MAJOR9" }, { value: "HIRAJOSHI" }, { value: "INSEN" }, { value: "PHRYGIAN" }, { value: "MAJ_PENTATONIC" }, { value: "BHAIRAV" }
    ]
  };
}

global.document = {
  getElementById: (id) => {
    if (!mockElements[id]) {
      mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
  },
  querySelectorAll: () => []
};

global.window = {
  slambientFxRackManager: {
    loadChainPreset: () => {}
  }
};

global.randRange = (min, max) => min;
global.CHORD_STEP_POOL = [0, 2, 4];
global.degreeToSemitone = (deg) => deg;
global.pickNextVoicingIdx = () => 0;
global.buildKeyboard = () => {};
global.updateChordHud = () => {};
global.updateDronePitches = () => {};
global.updateTimeSignature = () => {};
global.updateBpm = () => {};
global.updateMusicalConfig = () => {};
global.updateAudioParams = () => {};
global.rootNote = 0;
global.currentChordStepIdx = 0;
global.currentChordVoicing = 0;
global.currentChordRootStep = 0;
global.currentChordDeg = 0;
global.activeScaleKey = "DORIAN";
global.bpm = 72;
global.currentTimeSig = "4/4";
global.channelPower = { drum: true };

const vm = require("vm");

// Load scales
const scalesCode = fs.readFileSync(__dirname + "/../js/theory/scales.js", "utf8");
vm.runInThisContext(scalesCode);

// Load presets
const presetsCode = fs.readFileSync(__dirname + "/../js/ui/presets.js", "utf8");
vm.runInThisContext(presetsCode);

assert(typeof PRESET_SOUND_DESIGN_MATRIX === "object", "PRESET_SOUND_DESIGN_MATRIX must be defined");

for (let i = 0; i <= 14; i++) {
  const p = PRESET_SOUND_DESIGN_MATRIX[i];
  assert(p, `Preset ${i} must exist in PRESET_SOUND_DESIGN_MATRIX`);
  assert(typeof p.name === "string" && p.name.length > 0, `Preset ${i} must have a name`);
  assert(SCALES[p.scale], `Preset ${i} scale '${p.scale}' must exist in SCALES`);
  assert(typeof p.bpm === "number" && p.bpm > 0, `Preset ${i} must have valid bpm`);
  assert(p.synth && p.arp && p.drums && p.noise && p.fxChain, `Preset ${i} must define synth, arp, drums, noise, and fxChain`);

  // Verify signature voicing resolution
  if (p.signatureVoicing) {
    const vObj = getActiveVoicingObject(p.signatureVoicing, p.scale);
    assert(vObj && (Array.isArray(vObj.degrees) || Array.isArray(vObj.offsets)), `Preset ${i} signature voicing '${p.signatureVoicing}' must resolve to chord voicing with degrees/offsets`);
  }

  // Test applyPreset
  applyPreset(i);
  assert.strictEqual(activeScaleKey, p.scale, `applyPreset(${i}) should set activeScaleKey to ${p.scale}`);
  if (p.signatureVoicing) {
    assert.strictEqual(currentChordVoicing, p.signatureVoicing, `applyPreset(${i}) should set currentChordVoicing to ${p.signatureVoicing}`);
  }
}

console.log("✔ PRESET_SOUND_DESIGN_MATRIX verified across all 15 presets!");
console.log("✔ Signature voicings resolve accurately to chord definitions with interval offsets!");
console.log("✔ applyPreset(idx) runs cleanly for all 15 presets without errors!");
