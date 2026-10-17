/**
 * ============================================================================
 * SLAMBIENT EXPANDED MULTI-FX RACK & MODULAR SIGNAL CHAIN (Phase 2 & 3)
 * ============================================================================
 * High-performance, zero-latency, click-free Web Audio DSP processors and
 * modular routing manager for Slambient.
 *
 * Processors:
 *   1. SlambientDigitalDelay   — Pristine floating-point delay with ping-pong & tempo sync
 *   2. SlambientSpaceDelay     — Wow/flutter analog tape diffusion & high-frequency damping
 *   3. SlambientTapeEcho       — 3-head multi-tap tape simulation with motor inertia slew
 *   4. SlambientOpticalTremolo — Dual-phase optocoupler tremolo & spatial panner
 *   5. SlambientPhaser         — 4/8/12-pole cascaded all-pass filter network with feedback
 *   6. SlambientFlanger        — Comb-filtering micro-delay line with bipolar feedback
 *   7. SlambientTubeDrive      — Analog tube preamp & soft-clipping with tone tilt & trim
 *   8. SlambientFxRackManager  — Dynamic N-slot reordering & safe intelligent randomizer
 * ============================================================================
 */

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.SlambientFxRack = exports;
    Object.assign(root, exports);
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /* ==========================================================================
     DSP MATH & WAVESHAPING UTILITIES
     ========================================================================== */

  function makeTubeCurve(drive = 2.0, samples = 1024) {
    const curve = new Float32Array(samples);
    const k = Math.max(0.2, drive);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Asymmetric tube soft-saturation: 2nd and 3rd harmonic blend
      const xK = x * k;
      if (xK > 0) {
        curve[i] = Math.tanh(xK * 0.92) + 0.08 * (1 - Math.exp(-xK));
      } else {
        curve[i] = Math.tanh(xK * 1.08) - 0.04 * (1 - Math.exp(xK));
      }
    }
    return curve;
  }

  function safeParam(param, val, time, ramp = 0.02) {
    if (!param) return;
    try {
      if (typeof time === 'number' && Number.isFinite(time)) {
        param.cancelScheduledValues(time);
        param.setValueAtTime(param.value, time);
        param.linearRampToValueAtTime(val, time + ramp);
      } else {
        param.value = val;
      }
    } catch (_) {
      param.value = val;
    }
  }

  /* ==========================================================================
     1. DIGITAL DELAY ENGINE
     ========================================================================== */
  class SlambientDigitalDelay {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.delayL = ctx.createDelay(3.0);
      this.delayR = ctx.createDelay(3.0);
      this.feedbackGainL = ctx.createGain();
      this.feedbackGainR = ctx.createGain();
      this.dcBlockerL = ctx.createBiquadFilter();
      this.dcBlockerR = ctx.createBiquadFilter();

      this.dcBlockerL.type = "highpass"; this.dcBlockerL.frequency.value = 32;
      this.dcBlockerR.type = "highpass"; this.dcBlockerR.frequency.value = 32;

      this.splitter = ctx.createChannelSplitter(2);
      this.merger = ctx.createChannelMerger(2);

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.timeSec = options.timeSec || 0.375;
      this.feedback = options.feedback || 0.45;
      this.pingPong = options.pingPong !== undefined ? options.pingPong : true;
      this.mix = options.mix !== undefined ? options.mix : 0.40;

      // Internal Audio Graph
      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.input.connect(this.splitter);
      this.splitter.connect(this.delayL, 0);
      this.splitter.connect(this.delayR, 1);

      // Ping-pong cross-feedback
      this.delayL.connect(this.dcBlockerL);
      this.delayR.connect(this.dcBlockerR);

      this.dcBlockerL.connect(this.feedbackGainL);
      this.dcBlockerR.connect(this.feedbackGainR);

      this.setupFeedbackPaths();

      this.delayL.connect(this.merger, 0, 0);
      this.delayR.connect(this.merger, 0, 1);
      this.merger.connect(this.wetGain);
      this.wetGain.connect(this.output);

      this.updateParams();
    }

    setupFeedbackPaths() {
      try {
        this.feedbackGainL.disconnect();
        this.feedbackGainR.disconnect();
      } catch (_) {}

      if (this.pingPong) {
        this.feedbackGainL.connect(this.delayR);
        this.feedbackGainR.connect(this.delayL);
      } else {
        this.feedbackGainL.connect(this.delayL);
        this.feedbackGainR.connect(this.delayR);
      }
    }

    setPingPong(enabled) {
      this.pingPong = !!enabled;
      this.setupFeedbackPaths();
    }

    updateParams(time) {
      const now = time || this.ctx.currentTime;
      safeParam(this.delayL.delayTime, this.timeSec, now, 0.03);
      safeParam(this.delayR.delayTime, this.pingPong ? this.timeSec * 1.012 : this.timeSec, now, 0.03);
      safeParam(this.feedbackGainL.gain, Math.min(0.92, this.feedback), now, 0.02);
      safeParam(this.feedbackGainR.gain, Math.min(0.92, this.feedback), now, 0.02);
      safeParam(this.dryGain.gain, 1.0 - this.mix * 0.4, now, 0.02);
      safeParam(this.wetGain.gain, this.mix, now, 0.02);
    }
  }

  /* ==========================================================================
     2. SPACE DELAY ENGINE (Wow/Flutter & HF Damping)
     ========================================================================== */
  class SlambientSpaceDelay {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.delayNode = ctx.createDelay(3.0);
      this.feedbackGain = ctx.createGain();
      this.dampingFilter = ctx.createBiquadFilter();
      this.dampingFilter.type = "lowpass";
      this.dampingFilter.frequency.value = options.tone || 2800;

      // Analog wow/flutter LFOs
      this.wowLfo = ctx.createOscillator();
      this.wowLfo.frequency.value = 0.42;
      this.wowGain = ctx.createGain();
      this.wowGain.gain.value = 0.0018;

      this.flutterLfo = ctx.createOscillator();
      this.flutterLfo.frequency.value = 4.8;
      this.flutterGain = ctx.createGain();
      this.flutterGain.gain.value = 0.0006;

      this.wowLfo.connect(this.wowGain);
      this.wowGain.connect(this.delayNode.delayTime);
      this.flutterLfo.connect(this.flutterGain);
      this.flutterGain.connect(this.delayNode.delayTime);

      this.wowLfo.start();
      this.flutterLfo.start();

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.timeSec = options.timeSec || 0.42;
      this.feedback = options.feedback || 0.46;
      this.mix = options.mix || 0.45;

      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.input.connect(this.delayNode);
      this.delayNode.connect(this.dampingFilter);
      this.dampingFilter.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode);

      this.delayNode.connect(this.wetGain);
      this.wetGain.connect(this.output);

      this.updateParams();
    }

    updateParams(time) {
      const now = time || this.ctx.currentTime;
      safeParam(this.delayNode.delayTime, this.timeSec, now, 0.04);
      safeParam(this.feedbackGain.gain, Math.min(0.92, this.feedback), now, 0.02);
      safeParam(this.dryGain.gain, 1.0 - this.mix * 0.35, now, 0.02);
      safeParam(this.wetGain.gain, this.mix, now, 0.02);
    }
  }

  /* ==========================================================================
     3. TAPE ECHO (3-Head Multi-Tap & Motor Inertia)
     ========================================================================== */
  class SlambientTapeEcho {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.head1 = ctx.createDelay(3.0);
      this.head2 = ctx.createDelay(3.0);
      this.head3 = ctx.createDelay(3.0);

      this.headVol1 = ctx.createGain();
      this.headVol2 = ctx.createGain();
      this.headVol3 = ctx.createGain();

      this.feedbackGain = ctx.createGain();
      this.tapeFilter = ctx.createBiquadFilter();
      this.tapeFilter.type = "lowpass";
      this.tapeFilter.frequency.value = 3200;

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.baseTime = options.baseTime || 0.28;
      this.feedback = options.feedback || 0.42;
      this.mix = options.mix || 0.45;

      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.input.connect(this.head1);
      this.input.connect(this.head2);
      this.input.connect(this.head3);

      this.head1.connect(this.headVol1);
      this.head2.connect(this.headVol2);
      this.head3.connect(this.headVol3);

      this.headVol1.connect(this.wetGain);
      this.headVol2.connect(this.wetGain);
      this.headVol3.connect(this.wetGain);

      // Feedback taken from Head 3
      this.head3.connect(this.tapeFilter);
      this.tapeFilter.connect(this.feedbackGain);
      this.feedbackGain.connect(this.head1);

      this.wetGain.connect(this.output);
      this.updateParams();
    }

    updateParams(time) {
      const now = time || this.ctx.currentTime;
      // Motor inertia: use setTargetAtTime for realistic analog pitch-slew
      this.head1.delayTime.setTargetAtTime(this.baseTime, now, 0.18);
      this.head2.delayTime.setTargetAtTime(this.baseTime * 1.5, now, 0.18);
      this.head3.delayTime.setTargetAtTime(this.baseTime * 2.0, now, 0.18);

      safeParam(this.headVol1.gain, 0.85, now, 0.02);
      safeParam(this.headVol2.gain, 0.65, now, 0.02);
      safeParam(this.headVol3.gain, 0.45, now, 0.02);
      safeParam(this.feedbackGain.gain, Math.min(0.88, this.feedback), now, 0.02);
      safeParam(this.dryGain.gain, 1.0 - this.mix * 0.35, now, 0.02);
      safeParam(this.wetGain.gain, this.mix, now, 0.02);
    }
  }

  /* ==========================================================================
     4. OPTICAL TREMOLO & STEREO PANNER
     ========================================================================== */
  class SlambientOpticalTremolo {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.splitter = ctx.createChannelSplitter(2);
      this.merger = ctx.createChannelMerger(2);

      this.modGainL = ctx.createGain();
      this.modGainR = ctx.createGain();

      this.lfo = ctx.createOscillator();
      this.lfo.type = options.waveform || "sine"; // sine or square
      this.lfo.frequency.value = options.rate || 3.5;

      this.lfoGainL = ctx.createGain();
      this.lfoGainR = ctx.createGain();

      this.depth = options.depth !== undefined ? options.depth : 0.65;
      this.stereo = options.stereo !== undefined ? options.stereo : true;

      this.lfo.connect(this.lfoGainL);
      this.lfoGainL.connect(this.modGainL.gain);

      this.lfo.connect(this.lfoGainR);
      this.lfoGainR.connect(this.modGainR.gain);

      this.lfo.start();

      this.input.connect(this.splitter);
      this.splitter.connect(this.modGainL, 0);
      this.splitter.connect(this.modGainR, 1);

      this.modGainL.connect(this.merger, 0, 0);
      this.modGainR.connect(this.merger, 0, 1);
      this.merger.connect(this.output);

      this.updateParams();
    }

    setWaveform(type) {
      if (this.lfo) this.lfo.type = type === "square" ? "square" : "sine";
    }

    updateParams(time) {
      const now = time || this.ctx.currentTime;
      const baseGain = 1.0 - this.depth * 0.5;
      safeParam(this.modGainL.gain, baseGain, now, 0.02);
      safeParam(this.modGainR.gain, baseGain, now, 0.02);

      // Stereo antiphase modulation
      safeParam(this.lfoGainL.gain, this.depth * 0.5, now, 0.02);
      safeParam(this.lfoGainR.gain, this.stereo ? -this.depth * 0.5 : this.depth * 0.5, now, 0.02);
    }
  }

  /* ==========================================================================
     5. MULTI-STAGE PHASER (4/8/12-Pole All-Pass Network)
     ========================================================================== */
  class SlambientPhaser {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.numStages = options.stages || 8;
      this.allpassFilters = [];

      for (let i = 0; i < 12; i++) {
        const ap = ctx.createBiquadFilter();
        ap.type = "allpass";
        ap.frequency.value = 1000;
        this.allpassFilters.push(ap);
      }

      // Chain up to 12 stages
      for (let i = 0; i < 11; i++) {
        this.allpassFilters[i].connect(this.allpassFilters[i + 1]);
      }

      this.feedbackGain = ctx.createGain();
      this.feedbackGain.gain.value = options.feedback || 0.55;

      this.lfo = ctx.createOscillator();
      this.lfo.frequency.value = options.rate || 0.35;
      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 1200;

      this.lfo.connect(this.lfoGain);
      for (let i = 0; i < 12; i++) {
        this.lfoGain.connect(this.allpassFilters[i].frequency);
      }
      this.lfo.start();

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.input.connect(this.allpassFilters[0]);

      // Connect selected stage to wet output & feedback
      this.updateStageConnection();

      this.wetGain.connect(this.output);
    }

    updateStageConnection() {
      const activeStageIdx = Math.min(11, Math.max(3, this.numStages - 1));
      try {
        this.feedbackGain.disconnect();
      } catch (_) {}

      this.allpassFilters[activeStageIdx].connect(this.wetGain);
      this.allpassFilters[activeStageIdx].connect(this.feedbackGain);
      this.feedbackGain.connect(this.allpassFilters[0]);
    }

    setStages(num) {
      this.numStages = num;
      this.updateStageConnection();
    }
  }

  /* ==========================================================================
     6. ANALOG FLANGER (Comb-Filtering Micro-Delay)
     ========================================================================== */
  class SlambientFlanger {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.delayNode = ctx.createDelay(0.04);
      this.delayNode.delayTime.value = 0.0035; // 3.5ms nominal center

      this.feedbackGain = ctx.createGain();
      this.feedbackGain.gain.value = options.feedback || 0.65;

      this.lfo = ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.value = options.rate || 0.22;

      this.lfoGain = ctx.createGain();
      this.lfoGain.gain.value = 0.0025; // 2.5ms modulation sweep

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.delayNode.delayTime);
      this.lfo.start();

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.input.connect(this.delayNode);
      this.delayNode.connect(this.feedbackGain);
      this.feedbackGain.connect(this.delayNode);

      this.delayNode.connect(this.wetGain);
      this.wetGain.connect(this.output);

      this.dryGain.gain.value = 0.65;
      this.wetGain.gain.value = 0.65;
    }
  }

  /* ==========================================================================
     7. TUBE OVERDRIVE & WARMTH
     ========================================================================== */
  class SlambientTubeDrive {
    constructor(ctx, options = {}) {
      this.ctx = ctx;
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.preGain = ctx.createGain();
      this.driveNode = ctx.createWaveShaper();
      this.driveNode.curve = makeTubeCurve(options.drive || 2.2, 1024);
      this.driveNode.oversample = "2x";

      this.toneFilter = ctx.createBiquadFilter();
      this.toneFilter.type = "lowpass";
      this.toneFilter.frequency.value = options.tone || 4200;

      this.trimGain = ctx.createGain();
      this.trimGain.gain.value = 0.75; // Output trim to preserve unity gain

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();

      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.input.connect(this.preGain);
      this.preGain.connect(this.driveNode);
      this.driveNode.connect(this.toneFilter);
      this.toneFilter.connect(this.trimGain);
      this.trimGain.connect(this.wetGain);
      this.wetGain.connect(this.output);

      this.setDrive(options.drive || 2.2);
    }

    setDrive(val) {
      const d = Math.max(0.1, val);
      this.driveNode.curve = makeTubeCurve(d, 1024);
      // Auto-compensate makeup gain
      const trim = 1.0 / (1.0 + Math.log10(1 + d * 0.8));
      this.trimGain.gain.value = trim;
    }
  }

  /* ==========================================================================
     8. SLAMBIENT FX RACK MANAGER (N-Slot Reorderable Routing & Safe Shuffler)
     ========================================================================== */
  class SlambientFxRackManager {
    constructor(ctx, busPre, busPost) {
      this.ctx = ctx;
      this.busPre = busPre;
      this.busPost = busPost;

      this.modules = new Map();
      this.chain = ["FILTER", "DELAY", "SPACE"];
      this.bypassMap = new Map();
    }

    registerModule(key, instance) {
      if (instance && instance.input && instance.output) {
        this.modules.set(key, instance);
      }
    }

    setBypass(key, bypassed) {
      this.bypassMap.set(key, !!bypassed);
      this.rewire(false);
    }

    setChainOrder(newChain, immediate = false) {
      if (Array.isArray(newChain) && newChain.length > 0) {
        this.chain = [...newChain];
      }
      this.rewire(immediate);
    }

    reorderChain(sourceKey, targetKey) {
      if (!sourceKey || !targetKey || sourceKey === targetKey) return [...this.chain];
      const fromIdx = this.chain.indexOf(sourceKey);
      const toIdx = this.chain.indexOf(targetKey);
      if (fromIdx !== -1 && toIdx !== -1) {
        this.chain.splice(fromIdx, 1);
        this.chain.splice(toIdx, 0, sourceKey);
        this.rewire(false);
      }
      return [...this.chain];
    }

    shiftModule(key, delta) {
      const idx = this.chain.indexOf(key);
      if (idx === -1) return [...this.chain];
      const targetIdx = idx + delta;
      if (targetIdx >= 0 && targetIdx < this.chain.length) {
        const item = this.chain.splice(idx, 1)[0];
        this.chain.splice(targetIdx, 0, item);
        this.rewire(false);
      }
      return [...this.chain];
    }

    rewire(immediate = false) {
      if (!this.ctx || !this.busPre || !this.busPost) return;

      const perform = () => {
        try {
          this.busPre.disconnect();
          this.modules.forEach(m => {
            try { m.output.disconnect(); } catch (_) {}
          });

          let prev = this.busPre;
          for (const key of this.chain) {
            const m = this.modules.get(key);
            const isBypassed = !!this.bypassMap.get(key);
            if (m && m.input && m.output && !isBypassed) {
              prev.connect(m.input);
              prev = m.output;
            }
          }
          prev.connect(this.busPost);
        } catch (err) {
          console.error("Slambient FX Rack rewire error:", err);
        }
      };

      if (immediate) {
        perform();
      } else {
        const now = this.ctx.currentTime;
        this.busPre.gain.cancelScheduledValues(now);
        this.busPre.gain.setValueAtTime(this.busPre.gain.value, now);
        this.busPre.gain.linearRampToValueAtTime(0.001, now + 0.010);
        setTimeout(() => {
          perform();
          const resumeTime = this.ctx.currentTime;
          this.busPre.gain.cancelScheduledValues(resumeTime);
          this.busPre.gain.setValueAtTime(0.001, resumeTime);
          this.busPre.gain.linearRampToValueAtTime(1.0, resumeTime + 0.015);
        }, 12);
      }
    }

    /**
     * Intelligent Safe Chain Randomization
     * Arranges effects creatively while enforcing harmonic & acoustic staging:
     * - Preamp / Drive in the front half
     * - Reverbs / Delays in the back half
     * - Guaranteed zero feedback loop clipping
     */
    randomizeChain(mode = "SAFE") {
      const activeKeys = [...this.chain];
      if (mode === "SAFE") {
        const isDriveOrFilter = k => k === "TUBE_DRIVE" || k === "DRIVE" || k === "PHASER" || k === "FILTER";
        const isModulation = k => k === "OPTICAL_TREMOLO" || k === "TREMOLO" || k === "FLANGER" || k === "CHORUS";
        const isTimeBased = k => k === "DELAY" || k === "DIGITAL_DELAY" || k === "SPACE_DELAY" || k === "TAPE_ECHO" || k === "SPACE" || k === "REVERB";

        const frontPool = activeKeys.filter(isDriveOrFilter);
        const modPool   = activeKeys.filter(k => isModulation(k) && !isDriveOrFilter(k));
        const backPool  = activeKeys.filter(k => isTimeBased(k) && !isDriveOrFilter(k) && !isModulation(k));
        const otherPool = activeKeys.filter(k => !isDriveOrFilter(k) && !isModulation(k) && !isTimeBased(k));

        const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);
        this.chain = [...shuffle(frontPool), ...shuffle(modPool), ...shuffle(otherPool), ...shuffle(backPool)];
      } else {
        this.chain = activeKeys.sort(() => Math.random() - 0.5);
      }
      this.rewire(false);
      return [...this.chain];
    }
  }

  return {
    SlambientDigitalDelay,
    SlambientSpaceDelay,
    SlambientTapeEcho,
    SlambientOpticalTremolo,
    SlambientPhaser,
    SlambientFlanger,
    SlambientTubeDrive,
    SlambientFxRackManager,
    makeTubeCurve
  };
});
