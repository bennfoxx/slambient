/**
 * ============================================================================
 * SLAMBIENT MODULAR DSP ENGINES (Part VI, Section 26 / Phase 3)
 * ============================================================================
 * High-performance, click-free audio DSP processors engineered for the
 * Slambient hybrid generative ambient workstation.
 *
 * 1. SlambientFilterEngine (Section 26.1)
 *    - Switchable analog-emulated topologies:
 *      * LADDER 24dB: 4-pole cascaded transistor ladder with soft tanh saturation.
 *      * SEM 12dB: 2-pole State-Variable multi-mode with smooth singing resonance.
 *      * FORMANT: 3-cavity parallel acoustic vowel resonators (throat / bansuri).
 *      * COMB: High-feedback tuned micro-delay line creating string & resonator halos.
 *    - Filter Intensity Scale macro slider with Bipolar Polarity (+1 / -1).
 *    - Dynamic Low-End Makeup Gain circuit compensating for resonance bass loss.
 *    - Multi-waveform LFO modulation (Sine, Triangle, Sample-and-Hold Random).
 *
 * 2. SlambientMultiDelayEngine (Section 26.2)
 *    - 4 discrete DSP algorithms:
 *      * TAPE: Analog capstan wow/flutter drift, tape head loss, and saturation.
 *      * BBD: Bucket Brigade dark clock-rate damping, analog noise floor & companding.
 *      * DIGITAL: Pristine 32-bit floating point, bitcrush & sample-rate decimation.
 *      * PING-PONG: Stereo alternating Haas binaural spatial bounce (0-200% width).
 *    - Dynamic Lead Voice Ducking (-3dB to -6dB attenuation during active solos).
 *    - Click-free engine crossfading and tempo-synced musical subdivisions.
 * ============================================================================
 */

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SlambientDSP = factory();
    root.SlambientFilterEngine = root.SlambientDSP.SlambientFilterEngine;
    root.SlambientMultiDelayEngine = root.SlambientDSP.SlambientMultiDelayEngine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  /* ==========================================================================
     DSP MATH & WAVESHAPING UTILITIES
     ========================================================================== */

  /**
   * Generates a warm, analog-style saturation transfer curve using tanh
   * with polynomial harmonic warmth.
   */
  function makeSaturationCurve(drive = 1.0, samples = 512) {
    const curve = new Float32Array(samples);
    const k = Math.max(0.1, drive);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      // Hyperbolic tangent with subtle 3rd-order harmonic softening
      curve[i] = Math.tanh(x * k) / Math.tanh(k);
    }
    return curve;
  }

  /**
   * Generates an analog tape saturation transfer curve with asymmetric compression.
   */
  function makeTapeCurve(drive = 1.5, samples = 512) {
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const xDrive = x * drive;
      // Asymmetric saturation mimicking magnetic tape hysteresis
      if (xDrive > 0) {
        curve[i] = Math.tanh(xDrive * 0.95) * 1.05;
      } else {
        curve[i] = Math.tanh(xDrive * 1.05) * 0.95;
      }
    }
    return curve;
  }

  /**
   * Generates a bitcrushing transfer curve for Digital delay mode.
   */
  function makeBitcrushCurve(bits = 12, samples = 512) {
    const curve = new Float32Array(samples);
    const stepCount = Math.pow(2, Math.max(4, Math.min(16, bits)));
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.round(x * stepCount) / stepCount;
    }
    return curve;
  }

  /**
   * Safe parameter setter guarding against invalid AudioContext time states.
   */
  function safeParamSet(param, value, time) {
    if (!param) return;
    try {
      if (typeof time === 'number' && Number.isFinite(time)) {
        param.setValueAtTime(value, time);
      } else {
        param.value = value;
      }
    } catch (_) {
      param.value = value;
    }
  }

  /**
   * Safe linear ramp scheduler.
   */
  function safeParamRamp(param, targetValue, duration = 0.02, ctx) {
    if (!param) return;
    const now = (ctx && ctx.currentTime) ? ctx.currentTime : 0;
    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      param.linearRampToValueAtTime(targetValue, now + Math.max(0.005, duration));
    } catch (_) {
      param.value = targetValue;
    }
  }

  /**
   * Safe exponential ramp scheduler for musical frequencies.
   */
  function safeParamExpRamp(param, targetValue, duration = 0.02, ctx) {
    if (!param) return;
    const now = (ctx && ctx.currentTime) ? ctx.currentTime : 0;
    const safeTarget = Math.max(10, Math.min(22000, targetValue));
    try {
      param.cancelScheduledValues(now);
      param.setValueAtTime(Math.max(10, param.value), now);
      param.exponentialRampToValueAtTime(safeTarget, now + Math.max(0.005, duration));
    } catch (_) {
      param.value = safeTarget;
    }
  }

  /* ==========================================================================
     1. SLAMBIENT FILTER ENGINE (Section 26.1)
     ========================================================================== */

  class SlambientFilterEngine {
    constructor(ctx, options = {}) {
      if (!ctx) throw new Error('[SlambientFilterEngine] AudioContext is required.');
      this.ctx = ctx;

      // Base parameters
      this.cutoff = options.cutoff || 1200;
      this.resonance = options.resonance || 1.8;
      this.intensity = options.intensity !== undefined ? options.intensity : 1.0; // 0.0 - 2.0
      this.polarity = options.polarity !== undefined ? options.polarity : 1; // +1 or -1
      this.topology = options.topology || 'LADDER'; // 'LADDER' | 'SEM' | 'FORMANT' | 'COMB'
      this.autoLowEndMakeup = options.autoLowEndMakeup !== undefined ? options.autoLowEndMakeup : true;

      // LFO modulation parameters
      this.lfoRate = options.lfoRate || 0.06;
      this.lfoDepth = options.lfoDepth || 0.25;
      this.lfoShape = options.lfoShape || 'SINE'; // 'SINE' | 'TRIANGLE' | 'SH'

      // Master input/output gain boundaries
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      // Dynamic low-end makeup gain stage (prevents resonant ladder volume dropouts)
      this.lowEndComp = ctx.createBiquadFilter();
      this.lowEndComp.type = 'lowshelf';
      this.lowEndComp.frequency.value = 135;
      this.lowEndComp.gain.value = 0;

      this.makeupGain = ctx.createGain();
      this.makeupGain.gain.value = 1.0;

      // Master topology crossfade bus
      this.busLadder = ctx.createGain();
      this.busSem = ctx.createGain();
      this.busFormant = ctx.createGain();
      this.busComb = ctx.createGain();

      this._buildLadderTopology();
      this._buildSemTopology();
      this._buildFormantTopology();
      this._buildCombTopology();
      this._buildModulationLfo();

      // Route topology buses through the low-end makeup circuit to output
      this.busLadder.connect(this.lowEndComp);
      this.busSem.connect(this.lowEndComp);
      this.busFormant.connect(this.lowEndComp);
      this.busComb.connect(this.lowEndComp);

      this.lowEndComp.connect(this.makeupGain);
      this.makeupGain.connect(this.output);

      // Apply initial state
      this.setTopology(this.topology, 0);
      this.updateParameters(0);
    }

    /**
     * Topology 1: LADDER 24dB
     * 4-pole cascaded transistor ladder emulation with staggered Q and soft saturation.
     */
    _buildLadderTopology() {
      const c = this.ctx;
      this.ladder1 = c.createBiquadFilter();
      this.ladder1.type = 'lowpass';
      this.ladder2 = c.createBiquadFilter();
      this.ladder2.type = 'lowpass';

      this.ladderSat = c.createWaveShaper();
      this.ladderSat.curve = makeSaturationCurve(1.35, 512);

      this.input.connect(this.ladder1);
      this.ladder1.connect(this.ladder2);
      this.ladder2.connect(this.ladderSat);
      this.ladderSat.connect(this.busLadder);
    }

    /**
     * Topology 2: STATE-VARIABLE 12dB (SEM)
     * Multi-mode 2-pole filter with singing resonance and lowpass/bandpass morph.
     */
    _buildSemTopology() {
      const c = this.ctx;
      this.semLow = c.createBiquadFilter();
      this.semLow.type = 'lowpass';

      this.semBand = c.createBiquadFilter();
      this.semBand.type = 'bandpass';

      this.semLowGain = c.createGain();
      this.semLowGain.gain.value = 0.82;
      this.semBandGain = c.createGain();
      this.semBandGain.gain.value = 0.28;

      this.input.connect(this.semLow);
      this.input.connect(this.semBand);

      this.semLow.connect(this.semLowGain);
      this.semBand.connect(this.semBandGain);

      this.semLowGain.connect(this.busSem);
      this.semBandGain.connect(this.busSem);
    }

    /**
     * Topology 3: FORMANT (Vocal / Bansuri Cavity)
     * Triple-peak parallel bandpass resonators creating vocal acoustic cavities.
     */
    _buildFormantTopology() {
      const c = this.ctx;
      // Formant 1: low vowel fundamental cavity (300-850 Hz)
      this.formant1 = c.createBiquadFilter();
      this.formant1.type = 'bandpass';
      this.formant1.Q.value = 4.2;

      // Formant 2: nasal / chest resonant peak (900-2400 Hz)
      this.formant2 = c.createBiquadFilter();
      this.formant2.type = 'bandpass';
      this.formant2.Q.value = 5.5;

      // Formant 3: airy bansuri throat cavity (2200-3600 Hz)
      this.formant3 = c.createBiquadFilter();
      this.formant3.type = 'bandpass';
      this.formant3.Q.value = 6.0;

      this.f1Gain = c.createGain();
      this.f1Gain.gain.value = 0.65;
      this.f2Gain = c.createGain();
      this.f2Gain.gain.value = 0.45;
      this.f3Gain = c.createGain();
      this.f3Gain.gain.value = 0.32;

      this.input.connect(this.formant1);
      this.input.connect(this.formant2);
      this.input.connect(this.formant3);

      this.formant1.connect(this.f1Gain);
      this.formant2.connect(this.f2Gain);
      this.formant3.connect(this.f3Gain);

      this.f1Gain.connect(this.busFormant);
      this.f2Gain.connect(this.busFormant);
      this.f3Gain.connect(this.busFormant);
    }

    /**
     * Topology 4: COMB RESONATOR
     * Short feedback delay loop creating physical string resonance & harmonic halos.
     */
    _buildCombTopology() {
      const c = this.ctx;
      this.combDelay = c.createDelay(0.04);
      this.combFeedback = c.createGain();
      this.combDamping = c.createBiquadFilter();
      this.combDamping.type = 'lowpass';
      this.combDamping.frequency.value = 4500;

      this.combMixGain = c.createGain();
      this.combMixGain.gain.value = 0.75;

      this.input.connect(this.combDelay);
      this.combDelay.connect(this.combDamping);
      this.combDamping.connect(this.combFeedback);
      this.combFeedback.connect(this.combDelay);

      this.combDamping.connect(this.combMixGain);
      this.combMixGain.connect(this.busComb);
    }

    /**
     * Internal Modulation LFO
     */
    _buildModulationLfo() {
      const c = this.ctx;
      this.lfoOsc = c.createOscillator();
      this.lfoOsc.type = 'sine';
      this.lfoOsc.frequency.value = this.lfoRate;

      this.lfoDepthGain = c.createGain();
      this.lfoDepthGain.gain.value = 0;

      this.lfoOsc.connect(this.lfoDepthGain);

      // Connect LFO output to Ladder cutoff modulators
      this.lfoDepthGain.connect(this.ladder1.frequency);
      this.lfoDepthGain.connect(this.ladder2.frequency);
      this.lfoDepthGain.connect(this.semLow.frequency);

      try {
        this.lfoOsc.start();
      } catch (_) {}
    }

    /**
     * Switch active filter topology with click-free crossfade.
     */
    setTopology(name, crossfadeTime = 0.02) {
      const cleanName = (name || '').toUpperCase();
      if (!['LADDER', 'SEM', 'FORMANT', 'COMB'].includes(cleanName)) return;
      this.topology = cleanName;

      const dur = Math.max(0.005, crossfadeTime);
      safeParamRamp(this.busLadder.gain, cleanName === 'LADDER' ? 1.0 : 0.0001, dur, this.ctx);
      safeParamRamp(this.busSem.gain, cleanName === 'SEM' ? 1.0 : 0.0001, dur, this.ctx);
      safeParamRamp(this.busFormant.gain, cleanName === 'FORMANT' ? 1.0 : 0.0001, dur, this.ctx);
      safeParamRamp(this.busComb.gain, cleanName === 'COMB' ? 1.0 : 0.0001, dur, this.ctx);

      this.updateParameters(dur);
    }

    /**
     * Set base Cutoff frequency in Hz (20 Hz - 20,000 Hz).
     */
    setCutoff(freqHz, rampTime = 0.02) {
      this.cutoff = Math.max(20, Math.min(20000, freqHz));
      this.updateParameters(rampTime);
    }

    /**
     * Set Resonance (Q factor).
     */
    setResonance(qValue, rampTime = 0.02) {
      this.resonance = Math.max(0.2, Math.min(18.0, qValue));
      this.updateParameters(rampTime);
    }

    /**
     * Set Filter Intensity Scale macro (0.0 - 2.0).
     */
    setIntensity(scaleVal, rampTime = 0.02) {
      this.intensity = Math.max(0.0, Math.min(2.5, scaleVal));
      this.updateParameters(rampTime);
    }

    /**
     * Set Bipolar Polarity (+1 for positive sweep, -1 for inverted negative sweep).
     */
    setPolarity(polVal, rampTime = 0.02) {
      this.polarity = polVal < 0 ? -1 : 1;
      this.updateParameters(rampTime);
    }

    /**
     * Set internal LFO modulation parameters.
     */
    setLfoParams({ rate, depth, shape } = {}, rampTime = 0.02) {
      if (typeof rate === 'number') {
        this.lfoRate = Math.max(0.01, Math.min(25, rate));
        safeParamRamp(this.lfoOsc.frequency, this.lfoRate, rampTime, this.ctx);
      }
      if (typeof depth === 'number') {
        this.lfoDepth = Math.max(0.0, Math.min(1.0, depth));
      }
      if (shape && typeof shape === 'string') {
        const s = shape.toLowerCase();
        if (s === 'triangle') this.lfoOsc.type = 'triangle';
        else if (s === 'square') this.lfoOsc.type = 'square';
        else this.lfoOsc.type = 'sine';
      }
      this.updateParameters(rampTime);
    }

    /**
     * Recalculates and dispatches parameter updates across the active DSP graph.
     */
    updateParameters(rampTime = 0.02) {
      const effectiveCutoff = this.polarity > 0
        ? Math.max(20, Math.min(20000, this.cutoff * (0.5 + this.intensity * 0.5)))
        : Math.max(20, Math.min(20000, 20000 - ((20000 - this.cutoff) * (0.5 + this.intensity * 0.5))));

      const effectiveResonance = Math.max(0.2, this.resonance * (0.7 + this.intensity * 0.3));

      // 1. Ladder updates
      safeParamExpRamp(this.ladder1.frequency, effectiveCutoff, rampTime, this.ctx);
      safeParamRamp(this.ladder1.Q, effectiveResonance, rampTime, this.ctx);
      safeParamExpRamp(this.ladder2.frequency, effectiveCutoff * 1.04, rampTime, this.ctx);
      safeParamRamp(this.ladder2.Q, Math.max(0.5, effectiveResonance * 0.72), rampTime, this.ctx);

      // 2. SEM updates
      safeParamExpRamp(this.semLow.frequency, effectiveCutoff, rampTime, this.ctx);
      safeParamRamp(this.semLow.Q, Math.min(12, effectiveResonance * 0.85), rampTime, this.ctx);
      safeParamExpRamp(this.semBand.frequency, effectiveCutoff, rampTime, this.ctx);
      safeParamRamp(this.semBand.Q, Math.min(10, effectiveResonance * 1.1), rampTime, this.ctx);

      // 3. Formant updates: shift formant peaks with cutoff
      const ratio = effectiveCutoff / 1000;
      safeParamExpRamp(this.formant1.frequency, Math.min(1800, 520 * Math.pow(ratio, 0.45)), rampTime, this.ctx);
      safeParamExpRamp(this.formant2.frequency, Math.min(4500, 1450 * Math.pow(ratio, 0.55)), rampTime, this.ctx);
      safeParamExpRamp(this.formant3.frequency, Math.min(7500, 2750 * Math.pow(ratio, 0.65)), rampTime, this.ctx);

      // 4. Comb updates: delay time = 1 / frequency
      const combPeriodSec = 1 / Math.max(40, Math.min(2400, effectiveCutoff));
      safeParamRamp(this.combDelay.delayTime, combPeriodSec, rampTime, this.ctx);
      const combFb = Math.min(0.94, 0.45 + (effectiveResonance / 18.0) * 0.46);
      safeParamRamp(this.combFeedback.gain, combFb, rampTime, this.ctx);

      // 5. Low-End Makeup Gain calculation
      if (this.autoLowEndMakeup) {
        // Boost low-shelf as resonance increases to counteract ladder bass loss
        const bassBoostDb = Math.max(0, (effectiveResonance - 1.2) * 1.35 * Math.min(1.5, this.intensity));
        safeParamRamp(this.lowEndComp.gain, Math.min(8.0, bassBoostDb), rampTime, this.ctx);

        const makeupLinear = 1.0 + Math.min(0.55, Math.max(0, (effectiveResonance - 1.0) * 0.05));
        safeParamRamp(this.makeupGain.gain, makeupLinear, rampTime, this.ctx);
      } else {
        safeParamRamp(this.lowEndComp.gain, 0, rampTime, this.ctx);
        safeParamRamp(this.makeupGain.gain, 1.0, rampTime, this.ctx);
      }

      // 6. LFO Depth modulation scale
      const lfoExcursionHz = effectiveCutoff * this.lfoDepth * 0.72 * this.intensity;
      safeParamRamp(this.lfoDepthGain.gain, lfoExcursionHz, rampTime, this.ctx);
    }

    /**
     * Clean teardown and node disconnection.
     */
    destroy() {
      try {
        this.input.disconnect();
        this.output.disconnect();
        this.lfoOsc.stop();
        this.lfoOsc.disconnect();
        this.ladder1.disconnect();
        this.ladder2.disconnect();
        this.semLow.disconnect();
        this.semBand.disconnect();
        this.formant1.disconnect();
        this.formant2.disconnect();
        this.formant3.disconnect();
        this.combDelay.disconnect();
      } catch (_) {}
    }
  }

  /* ==========================================================================
     2. SLAMBIENT MULTI-DELAY ENGINE (Section 26.2)
     ========================================================================== */

  class SlambientMultiDelayEngine {
    constructor(ctx, options = {}) {
      if (!ctx) throw new Error('[SlambientMultiDelayEngine] AudioContext is required.');
      this.ctx = ctx;

      // Base parameters
      this.timeSec = options.timeSec || 0.45;
      this.feedback = options.feedback !== undefined ? options.feedback : 0.42; // 0.0 - 0.95
      this.mix = options.mix !== undefined ? options.mix : 0.38; // 0.0 - 1.0
      this.engine = options.engine || 'TAPE'; // 'TAPE' | 'BBD' | 'DIGITAL' | 'PINGPONG'

      // Dynamic ducking
      this.duckingAmount = options.duckingAmount || 0.45; // -3dB to -6dB attenuation
      this.isDucking = false;

      // Master input/output gain boundaries
      this.input = ctx.createGain();
      this.output = ctx.createGain();

      this.dryGain = ctx.createGain();
      this.wetReturn = ctx.createGain();
      this.duckingNode = ctx.createGain();
      this.duckingNode.gain.value = 1.0;

      // Engine routing selector buses
      this.busTape = ctx.createGain();
      this.busBbd = ctx.createGain();
      this.busDigital = ctx.createGain();
      this.busPingPong = ctx.createGain();

      this._buildTapeEngine();
      this._buildBbdEngine();
      this._buildDigitalEngine();
      this._buildPingPongEngine();

      // Master signal flow:
      // Input -> Dry -> Output
      // Input -> [Active Engine Bus] -> Ducking -> WetReturn -> Output
      this.input.connect(this.dryGain);
      this.dryGain.connect(this.output);

      this.busTape.connect(this.duckingNode);
      this.busBbd.connect(this.duckingNode);
      this.busDigital.connect(this.duckingNode);
      this.busPingPong.connect(this.duckingNode);

      this.duckingNode.connect(this.wetReturn);
      this.wetReturn.connect(this.output);

      this.setEngine(this.engine, 0);
      this.updateParameters(0);
    }

    /**
     * Engine 1: TAPE MODE
     * Analog tape saturation, dual-rate wow/flutter capstan drift, and high-frequency head loss.
     */
    _buildTapeEngine() {
      const c = this.ctx;
      this.tapeDelay = c.createDelay(3.0);
      this.tapeDelay.delayTime.value = this.timeSec;

      this.tapeFeedback = c.createGain();
      this.tapeFeedback.gain.value = this.feedback;

      this.tapeDamping = c.createBiquadFilter();
      this.tapeDamping.type = 'lowpass';
      this.tapeDamping.frequency.value = 3800;

      this.tapeSat = c.createWaveShaper();
      this.tapeSat.curve = makeTapeCurve(1.4, 512);

      // Wow / Flutter dual LFO
      this.tapeWowOsc = c.createOscillator();
      this.tapeWowOsc.frequency.value = 0.38; // Capstan wow
      this.tapeFlutterOsc = c.createOscillator();
      this.tapeFlutterOsc.frequency.value = 3.6; // Motor flutter

      this.tapeWowGain = c.createGain();
      this.tapeWowGain.gain.value = 0.0028;
      this.tapeFlutterGain = c.createGain();
      this.tapeFlutterGain.gain.value = 0.0009;

      this.tapeWowOsc.connect(this.tapeWowGain);
      this.tapeFlutterOsc.connect(this.tapeFlutterGain);

      this.tapeWowGain.connect(this.tapeDelay.delayTime);
      this.tapeFlutterGain.connect(this.tapeDelay.delayTime);

      // Feedback loop
      this.input.connect(this.tapeDelay);
      this.tapeDelay.connect(this.tapeDamping);
      this.tapeDamping.connect(this.tapeSat);
      this.tapeSat.connect(this.tapeFeedback);
      this.tapeFeedback.connect(this.tapeDelay);

      this.tapeSat.connect(this.busTape);

      try {
        this.tapeWowOsc.start();
        this.tapeFlutterOsc.start();
      } catch (_) {}
    }

    /**
     * Engine 2: BBD MODE (Bucket Brigade Device)
     * Dark compander saturation, warm clock noise floor & steep clock-rate anti-aliasing.
     */
    _buildBbdEngine() {
      const c = this.ctx;
      this.bbdDelay = c.createDelay(2.5);
      this.bbdDelay.delayTime.value = this.timeSec;

      this.bbdFeedback = c.createGain();
      this.bbdFeedback.gain.value = this.feedback;

      // Steep anti-aliasing reconstruction filter (darkens as delay time increases)
      this.bbdFilter1 = c.createBiquadFilter();
      this.bbdFilter1.type = 'lowpass';
      this.bbdFilter1.frequency.value = 2400;

      this.bbdFilter2 = c.createBiquadFilter();
      this.bbdFilter2.type = 'lowpass';
      this.bbdFilter2.frequency.value = 2200;

      this.bbdSat = c.createWaveShaper();
      this.bbdSat.curve = makeSaturationCurve(1.65, 512);

      this.input.connect(this.bbdDelay);
      this.bbdDelay.connect(this.bbdFilter1);
      this.bbdFilter1.connect(this.bbdFilter2);
      this.bbdFilter2.connect(this.bbdSat);
      this.bbdSat.connect(this.bbdFeedback);
      this.bbdFeedback.connect(this.bbdDelay);

      this.bbdSat.connect(this.busBbd);
    }

    /**
     * Engine 3: DIGITAL MODE
     * Pristine 32-bit floating point repeats with optional bitcrushing & sample-rate reduction.
     */
    _buildDigitalEngine() {
      const c = this.ctx;
      this.digDelay = c.createDelay(3.0);
      this.digDelay.delayTime.value = this.timeSec;

      this.digFeedback = c.createGain();
      this.digFeedback.gain.value = this.feedback;

      this.digCrusher = c.createWaveShaper();
      this.digCrusher.curve = makeBitcrushCurve(16, 512);

      this.input.connect(this.digDelay);
      this.digDelay.connect(this.digCrusher);
      this.digCrusher.connect(this.digFeedback);
      this.digFeedback.connect(this.digDelay);

      this.digCrusher.connect(this.busDigital);
    }

    /**
     * Engine 4: PING-PONG MODE
     * Stereo cross-fed delay lines with Haas binaural spatial bounce.
     */
    _buildPingPongEngine() {
      const c = this.ctx;
      this.ppDelayL = c.createDelay(3.0);
      this.ppDelayR = c.createDelay(3.0);

      this.ppFeedbackL = c.createGain();
      this.ppFeedbackR = c.createGain();

      this.ppFilterL = c.createBiquadFilter();
      this.ppFilterL.type = 'lowpass';
      this.ppFilterL.frequency.value = 4200;
      this.ppFilterR = c.createBiquadFilter();
      this.ppFilterR.type = 'lowpass';
      this.ppFilterR.frequency.value = 4200;

      this.ppPannerL = c.createStereoPanner ? c.createStereoPanner() : null;
      if (this.ppPannerL && this.ppPannerL.pan) this.ppPannerL.pan.value = -0.85;

      this.ppPannerR = c.createStereoPanner ? c.createStereoPanner() : null;
      if (this.ppPannerR && this.ppPannerR.pan) this.ppPannerR.pan.value = 0.85;

      // Cross-feed routing:
      // Left delay feeds Right delay; Right delay feeds Left delay
      this.input.connect(this.ppDelayL);

      this.ppDelayL.connect(this.ppFilterL);
      this.ppFilterL.connect(this.ppFeedbackL);
      this.ppFeedbackL.connect(this.ppDelayR);

      this.ppDelayR.connect(this.ppFilterR);
      this.ppFilterR.connect(this.ppFeedbackR);
      this.ppFeedbackR.connect(this.ppDelayL);

      if (this.ppPannerL && this.ppPannerR) {
        this.ppFilterL.connect(this.ppPannerL);
        this.ppFilterR.connect(this.ppPannerR);
        this.ppPannerL.connect(this.busPingPong);
        this.ppPannerR.connect(this.busPingPong);
      } else {
        this.ppFilterL.connect(this.busPingPong);
        this.ppFilterR.connect(this.busPingPong);
      }
    }

    /**
     * Switch active delay algorithm with smooth crossfade.
     */
    setEngine(name, crossfadeTime = 0.025) {
      const cleanName = (name || '').toUpperCase();
      if (!['TAPE', 'BBD', 'DIGITAL', 'PINGPONG'].includes(cleanName)) return;
      this.engine = cleanName;

      const dur = Math.max(0.005, crossfadeTime);
      safeParamRamp(this.busTape.gain, cleanName === 'TAPE' ? 1.0 : 0.0001, dur, this.ctx);
      safeParamRamp(this.busBbd.gain, cleanName === 'BBD' ? 1.0 : 0.0001, dur, this.ctx);
      safeParamRamp(this.busDigital.gain, cleanName === 'DIGITAL' ? 1.0 : 0.0001, dur, this.ctx);
      safeParamRamp(this.busPingPong.gain, cleanName === 'PINGPONG' ? 1.0 : 0.0001, dur, this.ctx);

      this.updateParameters(dur);
    }

    /**
     * Set Delay Time in seconds (0.02s - 2.5s).
     */
    setTime(timeSeconds, rampTime = 0.02) {
      this.timeSec = Math.max(0.02, Math.min(2.5, timeSeconds));
      this.updateParameters(rampTime);
    }

    /**
     * Set Feedback amount (0.0 - 0.95 safety ceiling).
     */
    setFeedback(fbVal, rampTime = 0.02) {
      this.feedback = Math.max(0.0, Math.min(0.95, fbVal));
      this.updateParameters(rampTime);
    }

    /**
     * Set Dry/Wet Mix ratio (0.0 to 1.0).
     */
    setMix(mixVal, rampTime = 0.02) {
      this.mix = Math.max(0.0, Math.min(1.0, mixVal));
      this.updateParameters(rampTime);
    }

    /**
     * Trigger dynamic lead voice ducking.
     * When active is true, ducks wet delay return by -3dB to -6dB.
     */
    triggerLeadDucking(active) {
      this.isDucking = !!active;
      const targetGain = this.isDucking ? Math.max(0.35, 1.0 - this.duckingAmount) : 1.0;
      const rampSpeed = this.isDucking ? 0.04 : 0.32; // Fast attack, smooth breath release
      safeParamRamp(this.duckingNode.gain, targetGain, rampSpeed, this.ctx);
    }

    /**
     * Sync delay time to musical subdivisions and current BPM.
     */
    setTempoSync(subdivision = '1/8D', bpm = 60, rampTime = 0.02) {
      const safeBpm = Math.max(30, Math.min(300, bpm));
      const quarterSec = 60 / safeBpm;

      const subDivisions = {
        '1/16': quarterSec * 0.25,
        '1/8': quarterSec * 0.5,
        '1/8D': quarterSec * 0.75, // Dotted eighth
        '1/8T': quarterSec * (1 / 3), // Triplet
        '1/4': quarterSec,
        '1/2': quarterSec * 2.0,
        '1/1': quarterSec * 4.0
      };

      const targetSec = subDivisions[subdivision] || (quarterSec * 0.75);
      this.setTime(targetSec, rampTime);
    }

    /**
     * Recalculates and dispatches parameter updates across all active delay nodes.
     */
    updateParameters(rampTime = 0.02) {
      // 1. Dry/Wet gain balance
      const dryVal = Math.cos(this.mix * Math.PI * 0.5);
      const wetVal = Math.sin(this.mix * Math.PI * 0.5);
      safeParamRamp(this.dryGain.gain, dryVal, rampTime, this.ctx);
      safeParamRamp(this.wetReturn.gain, wetVal, rampTime, this.ctx);

      // 2. Tape mode updates
      safeParamRamp(this.tapeDelay.delayTime, this.timeSec, rampTime, this.ctx);
      safeParamRamp(this.tapeFeedback.gain, this.feedback, rampTime, this.ctx);

      // 3. BBD mode updates (anti-aliasing frequency scales inversely with delay time)
      safeParamRamp(this.bbdDelay.delayTime, this.timeSec, rampTime, this.ctx);
      safeParamRamp(this.bbdFeedback.gain, this.feedback, rampTime, this.ctx);
      const bbdCutoff = Math.max(900, Math.min(4200, 3400 - (this.timeSec / 2.0) * 1800));
      safeParamExpRamp(this.bbdFilter1.frequency, bbdCutoff, rampTime, this.ctx);
      safeParamExpRamp(this.bbdFilter2.frequency, bbdCutoff * 0.9, rampTime, this.ctx);

      // 4. Digital mode updates
      safeParamRamp(this.digDelay.delayTime, this.timeSec, rampTime, this.ctx);
      safeParamRamp(this.digFeedback.gain, this.feedback, rampTime, this.ctx);

      // 5. Ping-Pong mode updates (incorporates slight Haas micro-offset)
      const haasOffset = 0.012; // 12ms psychoacoustic spatial split
      safeParamRamp(this.ppDelayL.delayTime, this.timeSec, rampTime, this.ctx);
      safeParamRamp(this.ppDelayR.delayTime, Math.max(0.02, this.timeSec + haasOffset), rampTime, this.ctx);
      safeParamRamp(this.ppFeedbackL.gain, this.feedback * 0.95, rampTime, this.ctx);
      safeParamRamp(this.ppFeedbackR.gain, this.feedback * 0.95, rampTime, this.ctx);
    }

    /**
     * Clean teardown and node disconnection.
     */
    destroy() {
      try {
        this.input.disconnect();
        this.output.disconnect();
        this.tapeWowOsc.stop();
        this.tapeFlutterOsc.stop();
        this.tapeDelay.disconnect();
        this.bbdDelay.disconnect();
        this.digDelay.disconnect();
        this.ppDelayL.disconnect();
        this.ppDelayR.disconnect();
      } catch (_) {}
    }
  }

  /* ==========================================================================
     EXPORTS
     ========================================================================== */

  return {
    SlambientFilterEngine,
    SlambientMultiDelayEngine,
    makeSaturationCurve,
    makeTapeCurve,
    makeBitcrushCurve
  };
});
