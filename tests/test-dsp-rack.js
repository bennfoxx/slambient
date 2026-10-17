// Unit tests for js/audio/dsp-rack.js
const assert = require("assert");
const fs = require("fs");

console.log("--> Testing js/audio/dsp-rack.js...");

// Mock Web Audio API environment
class MockAudioParam {
  constructor(val = 0) {
    this.value = val;
  }
  setValueAtTime(v) { this.value = v; }
  linearRampToValueAtTime(v) { this.value = v; }
  setTargetAtTime(v) { this.value = v; }
  cancelScheduledValues() {}
}

class MockAudioNode {
  constructor() {
    this.connections = [];
  }
  connect(dest) {
    this.connections.push(dest);
    return dest;
  }
  disconnect(dest) {
    if (dest) {
      this.connections = this.connections.filter(c => c !== dest);
    } else {
      this.connections = [];
    }
  }
}

class MockGainNode extends MockAudioNode {
  constructor() {
    super();
    this.gain = new MockAudioParam(1.0);
  }
}

class MockDelayNode extends MockAudioNode {
  constructor() {
    super();
    this.delayTime = new MockAudioParam(0.3);
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = new MockAudioParam(1000);
    this.Q = new MockAudioParam(1);
    this.gain = new MockAudioParam(0);
    this.type = "lowpass";
  }
}

class MockWaveShaperNode extends MockAudioNode {
  constructor() {
    super();
    this.curve = null;
    this.oversample = "none";
  }
}

class MockOscillatorNode extends MockAudioNode {
  constructor() {
    super();
    this.frequency = new MockAudioParam(1);
    this.type = "sine";
  }
  start() {}
  stop() {}
}

class MockAudioContext {
  constructor() {
    this.currentTime = 10.0;
  }
  createGain() { return new MockGainNode(); }
  createDelay(max = 1) { return new MockDelayNode(); }
  createBiquadFilter() { return new MockBiquadFilterNode(); }
  createWaveShaper() { return new MockWaveShaperNode(); }
  createOscillator() { return new MockOscillatorNode(); }
  createChannelSplitter(n) { return new MockAudioNode(); }
  createChannelMerger(n) { return new MockAudioNode(); }
}

global.AudioContext = MockAudioContext;
const {
  SlambientDigitalDelay,
  SlambientSpaceDelay,
  SlambientTapeEcho,
  SlambientOpticalTremolo,
  SlambientPhaser,
  SlambientFlanger,
  SlambientTubeDrive,
  SlambientFxRackManager,
  makeTubeCurve
} = require("../js/audio/dsp-rack.js");

// 1. Test Tube Curve Generator
const tubeCurve = makeTubeCurve(2.5, 512);
assert.strictEqual(tubeCurve.length, 512, "Curve length must match requested samples");
for (let i = 0; i < tubeCurve.length; i++) {
  assert(!isNaN(tubeCurve[i]), "Curve must not contain NaN");
  assert(Number.isFinite(tubeCurve[i]), "Curve values must be finite");
  assert(tubeCurve[i] >= -2.0 && tubeCurve[i] <= 2.0, "Curve must sit within bounds");
}
console.log("✔ makeTubeCurve verified");

// 2. Test Engine Instantiations
const ctx = new MockAudioContext();
const digitalDelay = new SlambientDigitalDelay(ctx, { timeSec: 0.5, feedback: 0.5 });
assert(digitalDelay.input && digitalDelay.output, "Digital delay must expose input/output nodes");

const spaceDelay = new SlambientSpaceDelay(ctx, { timeSec: 0.4 });
assert(spaceDelay.input && spaceDelay.output, "Space delay must expose input/output nodes");

const tapeEcho = new SlambientTapeEcho(ctx, { baseTime: 0.3 });
assert(tapeEcho.input && tapeEcho.output, "Tape echo must expose input/output nodes");

const tremolo = new SlambientOpticalTremolo(ctx, { rate: 4.0, depth: 0.7 });
assert(tremolo.input && tremolo.output, "Tremolo must expose input/output nodes");

const phaser = new SlambientPhaser(ctx, { stages: 8 });
assert(phaser.input && phaser.output, "Phaser must expose input/output nodes");

const flanger = new SlambientFlanger(ctx, { rate: 0.25 });
assert(flanger.input && flanger.output, "Flanger must expose input/output nodes");

const tubeDrive = new SlambientTubeDrive(ctx, { drive: 3.0 });
assert(tubeDrive.input && tubeDrive.output, "Tube drive must expose input/output nodes");

console.log("✔ All 7 DSP engine classes instantiated cleanly with mock Web Audio graph");

// 3. Test SlambientFxRackManager
const busPre = ctx.createGain();
const busPost = ctx.createGain();
const manager = new SlambientFxRackManager(ctx, busPre, busPost);

manager.registerModule("DIGITAL_DELAY", digitalDelay);
manager.registerModule("SPACE_DELAY", spaceDelay);
manager.registerModule("TAPE_ECHO", tapeEcho);
manager.registerModule("TREMOLO", tremolo);
manager.registerModule("PHASER", phaser);
manager.registerModule("FLANGER", flanger);
manager.registerModule("TUBE_DRIVE", tubeDrive);

manager.setChainOrder(["TUBE_DRIVE", "PHASER", "TREMOLO", "FLANGER", "DIGITAL_DELAY"], true);
assert.deepStrictEqual(manager.chain, ["TUBE_DRIVE", "PHASER", "TREMOLO", "FLANGER", "DIGITAL_DELAY"]);

const randomized = manager.randomizeChain("SAFE");
assert.strictEqual(randomized.length, 5, "Randomized chain must retain all active slots");
assert.strictEqual(new Set(randomized).size, 5, "Randomized chain must not duplicate slots");

// In SAFE mode, TUBE_DRIVE and PHASER must precede DIGITAL_DELAY
const driveIdx = randomized.indexOf("TUBE_DRIVE");
const delayIdx = randomized.indexOf("DIGITAL_DELAY");
assert(driveIdx < delayIdx, "SAFE randomizer must keep pre-gain/modulation ahead of time-based delays");

// Test reorderChain
manager.setChainOrder(["TUBE_DRIVE", "PHASER", "TREMOLO"], true);
manager.reorderChain("TREMOLO", "TUBE_DRIVE");
assert.deepStrictEqual(manager.chain, ["TREMOLO", "TUBE_DRIVE", "PHASER"], "reorderChain must insert source before target");

// Test shiftModule
manager.shiftModule("TREMOLO", 1);
assert.deepStrictEqual(manager.chain, ["TUBE_DRIVE", "TREMOLO", "PHASER"], "shiftModule must move item by delta");

console.log("✔ SlambientFxRackManager reorderChain and shiftModule verified");
console.log("✔ SlambientFxRackManager routing and safe intelligent randomizer passed");
console.log("ALL DSP RACK UNIT TESTS PASSED CLEANLY!");
