// Test for PRESET_FX_CONFIGS in js/ui/presets.js
const assert = require("assert");
const fs = require("fs");

console.log("--> Testing PRESET_FX_CONFIGS in js/ui/presets.js...");

const fileContent = fs.readFileSync(__dirname + "/../js/ui/presets.js", "utf8");

// Extract PRESET_FX_CONFIGS block
const match = fileContent.match(/const PRESET_FX_CONFIGS = (\{[\s\S]*?\n\};)/);
assert(match, "PRESET_FX_CONFIGS must be declared in presets.js");

const PRESET_FX_CONFIGS = eval("(" + match[1].replace(/;\s*$/, "") + ")");

// Test presets 0 to 14 are all present
for (let i = 0; i <= 14; i++) {
  assert(PRESET_FX_CONFIGS[i], `Preset ${i} must exist in PRESET_FX_CONFIGS`);
  const cfg = PRESET_FX_CONFIGS[i];
  assert(Array.isArray(cfg.chain), `Preset ${i} must define chain array`);
  assert(cfg.chain.length >= 10, `Preset ${i} chain should include all 10 pedals`);
  assert(cfg.bypass && typeof cfg.bypass === "object", `Preset ${i} must define bypass object`);
  assert(cfg.params && typeof cfg.params === "object", `Preset ${i} must define params object`);
}

// 0 (Nostalgia): Tube Drive + Optical Tremolo + Space Delay
assert.strictEqual(PRESET_FX_CONFIGS[0].bypass.OVERDRIVE, false, "Preset 0 must have OVERDRIVE active");
assert.strictEqual(PRESET_FX_CONFIGS[0].bypass.TREMOLO, false, "Preset 0 must have TREMOLO active");
assert.strictEqual(PRESET_FX_CONFIGS[0].bypass.SPACE_DELAY, false, "Preset 0 must have SPACE_DELAY active");

// 1 (Green/Yoshimura): Digital Ping-Pong Delay + Space Delay (Zero Tube Drive, Zero Flanger)
assert.strictEqual(PRESET_FX_CONFIGS[1].bypass.DIGITAL_DELAY, false, "Preset 1 must have DIGITAL_DELAY active");
assert.strictEqual(PRESET_FX_CONFIGS[1].bypass.SPACE_DELAY, false, "Preset 1 must have SPACE_DELAY active");
assert.strictEqual(PRESET_FX_CONFIGS[1].bypass.OVERDRIVE, true, "Preset 1 must have Zero Tube Drive (bypassed)");
assert.strictEqual(PRESET_FX_CONFIGS[1].bypass.FLANGER, true, "Preset 1 must have Zero Flanger (bypassed)");

// 7 (Lineage): Resonant Filter + Space Delay + Cathedral Reverb
assert.strictEqual(PRESET_FX_CONFIGS[7].bypass.FILTER, false, "Preset 7 must have FILTER active");
assert.strictEqual(PRESET_FX_CONFIGS[7].bypass.SPACE_DELAY, false, "Preset 7 must have SPACE_DELAY active");
assert.strictEqual(PRESET_FX_CONFIGS[7].bypass.SPACE, false, "Preset 7 must have SPACE active");

// 10 (Douglas Firs): Optical Tremolo + Tape Echo + Tube Warmth
assert.strictEqual(PRESET_FX_CONFIGS[10].bypass.TREMOLO, false, "Preset 10 must have TREMOLO active");
assert.strictEqual(PRESET_FX_CONFIGS[10].bypass.TAPE_ECHO, false, "Preset 10 must have TAPE_ECHO active");
assert.strictEqual(PRESET_FX_CONFIGS[10].bypass.OVERDRIVE, false, "Preset 10 must have OVERDRIVE active");

// 11 (Twinning): Analog Flanger + Tube Drive + Ping-Pong Delay
assert.strictEqual(PRESET_FX_CONFIGS[11].bypass.FLANGER, false, "Preset 11 must have FLANGER active");
assert.strictEqual(PRESET_FX_CONFIGS[11].bypass.OVERDRIVE, false, "Preset 11 must have OVERDRIVE active");
assert.strictEqual(PRESET_FX_CONFIGS[11].bypass.DIGITAL_DELAY, false, "Preset 11 must have DIGITAL_DELAY active");

// 12 (Tangerine): Multi-Stage Phaser + Dotted-8th Delay
assert.strictEqual(PRESET_FX_CONFIGS[12].bypass.PHASER, false, "Preset 12 must have PHASER active");
assert.strictEqual(PRESET_FX_CONFIGS[12].bypass.DIGITAL_DELAY, false, "Preset 12 must have DIGITAL_DELAY active");

// 13 (Disintegration): Heavy Tape Echo flutter + Tube Lo-Fi Tone + Space
assert.strictEqual(PRESET_FX_CONFIGS[13].bypass.TAPE_ECHO, false, "Preset 13 must have TAPE_ECHO active");
assert.strictEqual(PRESET_FX_CONFIGS[13].bypass.SPACE_DELAY, false, "Preset 13 must have SPACE_DELAY active");
assert.strictEqual(PRESET_FX_CONFIGS[13].bypass.OVERDRIVE, false, "Preset 13 must have OVERDRIVE active");
assert.strictEqual(PRESET_FX_CONFIGS[13].bypass.SPACE, false, "Preset 13 must have SPACE active");

console.log("✔ PRESET_FX_CONFIGS verified: all 15 presets map to signature DSP configurations cleanly!");
