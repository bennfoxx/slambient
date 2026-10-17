// Slambient — Environmental Soundscape & Noise Instrument Engine
// Handles stochastic ambient beds, rain, thunder, brook, crickets, cassette tape flutter, and wind gusts

// Phase 4: Environmental Soundscape & Noise Instrument Engine
function updateNoiseEngineParams() {
  if (!audioCtx || !noiseBedFilter1 || !noiseBedFilter2 || !noiseBedGain) return;
  const now = audioCtx.currentTime;
  const audible = isPlaying && isChannelAudible("noise") && noiseMode !== "OFF" && noiseVol > 0.005;

  // Profile-specific filter topologies and modulation depths
  let f1Type = "bandpass", f2Type = "lowpass";
  let f1Freq = 900, f1Q = 1.2, f2Freq = 2400, f2Q = 0.9;
  let bedLevel = 0.28;
  let gustRate = 0.14, sweepRate = 0.09, sweepSpan = 450;

  const col = noiseColorVal; // 0..1
  const rate = noiseRateVal; // 0..1
  const drift = noiseDriftVal; // 0..1

  if (noiseProfile === "RAIN") {
    f1Type = "bandpass";
    f1Freq = 650 + col * 2400;
    f1Q = 0.75;
    f2Type = "lowpass";
    f2Freq = 1800 + col * 4200;
    f2Q = 0.7;
    bedLevel = 0.34;
    gustRate = 0.08 + rate * 0.45;
    sweepSpan = 350 + drift * 950;
  } else if (noiseProfile === "THUNDER") {
    f1Type = "lowpass";
    f1Freq = 85 + col * 260;
    f1Q = 2.4;
    f2Type = "lowpass";
    f2Freq = 180 + col * 420;
    f2Q = 1.6;
    bedLevel = 0.46;
    gustRate = 0.05 + rate * 0.28;
    sweepSpan = 60 + drift * 220;
  } else if (noiseProfile === "WHITE_TAPE") {
    f1Type = "bandpass";
    f1Freq = 1100 + col * 3200;
    f1Q = 0.65;
    f2Type = "highpass";
    f2Freq = 320 + col * 1200;
    f2Q = 0.7;
    bedLevel = 0.22;
    gustRate = 0.12 + rate * 0.6;
    sweepSpan = 280 + drift * 800;
  } else if (noiseProfile === "BROOK") {
    f1Type = "bandpass";
    f1Freq = 480 + col * 1450;
    f1Q = 3.8;
    f2Type = "bandpass";
    f2Freq = 920 + col * 2100;
    f2Q = 2.9;
    bedLevel = 0.36;
    gustRate = 1.4 + rate * 4.5;
    sweepRate = 0.8 + rate * 3.2;
    sweepSpan = 380 + drift * 1100;
  } else if (noiseProfile === "CRICKETS") {
    f1Type = "bandpass";
    f1Freq = 3600 + col * 2200;
    f1Q = 9.5;
    f2Type = "bandpass";
    f2Freq = 3800 + col * 2400;
    f2Q = 7.5;
    bedLevel = 0.16;
    gustRate = 2.5 + rate * 6.0;
    sweepSpan = 180 + drift * 420;
  } else if (noiseProfile === "WIND") {
    f1Type = "bandpass";
    f1Freq = 220 + col * 980;
    f1Q = 4.6;
    f2Type = "lowpass";
    f2Freq = 540 + col * 1600;
    f2Q = 2.2;
    bedLevel = 0.42;
    gustRate = 0.06 + rate * 0.38;
    sweepRate = 0.05 + rate * 0.32;
    sweepSpan = 260 + drift * 1100;
  }

  // Trigger mode scales continuous bed vs discrete stochastic bursts
  let modeBedMult = 1.0;
  if (noiseMode === "CONTINUOUS") modeBedMult = 1.15;
  else if (noiseMode === "GUSTS") modeBedMult = 0.85;
  else if (noiseMode === "SPARSE") modeBedMult = 0.38;
  else if (noiseMode === "RHYTHMIC") modeBedMult = 0.45;
  else if (noiseMode === "STORM_SWELL") modeBedMult = 0.95;

  noiseBedFilter1.type = f1Type;
  noiseBedFilter2.type = f2Type;
  noiseBedFilter1.frequency.setTargetAtTime(f1Freq, now, 0.08);
  noiseBedFilter1.Q.setTargetAtTime(f1Q, now, 0.08);
  noiseBedFilter2.frequency.setTargetAtTime(f2Freq, now, 0.08);
  noiseBedFilter2.Q.setTargetAtTime(f2Q, now, 0.08);

  if (noiseGustLFO && noiseGustLFOGain) {
    noiseGustLFO.frequency.setTargetAtTime(gustRate, now, 0.12);
    const gustDepth = audible ? (bedLevel * modeBedMult * (0.18 + drift * 0.45)) : 0;
    noiseGustLFOGain.gain.setTargetAtTime(gustDepth, now, 0.12);
  }
  if (noiseSweepLFO && noiseSweepLFOGain) {
    noiseSweepLFO.frequency.setTargetAtTime(sweepRate, now, 0.12);
    noiseSweepLFOGain.gain.setTargetAtTime(sweepSpan, now, 0.12);
  }
  if (noisePanLFO && noisePanLFOGain) {
    noisePanLFO.frequency.setTargetAtTime(0.05 + rate * 0.25, now, 0.15);
    noisePanLFOGain.gain.setTargetAtTime(0.15 + drift * 0.65, now, 0.15);
  }

  const targetBedGain = audible ? (bedLevel * modeBedMult) : 0.0001;
  noiseBedGain.gain.cancelScheduledValues(now);
  noiseBedGain.gain.setValueAtTime(noiseBedGain.gain.value, now);
  noiseBedGain.gain.linearRampToValueAtTime(targetBedGain, now + 0.045);
}

// Stochastic & Clock-Driven Environmental Transients (Raindrops, Thunder Claps, Brook Bubbles, Cricket Chirps, Tape Crackle, Wind Gusts)
function triggerNoiseEvent(intensity = 1.0) {
  if (!audioCtx || !noiseBusGain || noiseMode === "OFF" || !isChannelAudible("noise") || noiseVol <= 0.01) return;
  const now = audioCtx.currentTime;
  const col = noiseColorVal;
  const drift = noiseDriftVal;

  if (noiseProfile === "CRICKETS") {
    // Authentic dual-carrier stridulation chirp train (4.2 kHz - 5.4 kHz)
    const pulses = 3 + randRange(0, 3);
    const baseFreq = 3950 + col * 1650 + (randFloat() - 0.5) * 280 * drift;
    const pulseSpacing = 0.026 + randFloat() * 0.012;
    for (let p = 0; p < pulses; p++) {
      const t0 = now + p * pulseSpacing;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const pan = audioCtx.createStereoPanner();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(baseFreq, t0);
      osc2.frequency.setValueAtTime(baseFreq * 1.018, t0);
      pan.pan.value = (randFloat() * 1.6 - 0.8) * Math.max(0.25, drift);
      const pk = 0.14 * intensity * (0.75 + 0.25 * Math.sin((p / pulses) * Math.PI));
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(pk, t0 + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.021);
      osc1.connect(g); osc2.connect(g); g.connect(pan); pan.connect(noiseBusGain);
      disconnectOnEnded(osc1, pan);
      osc1.start(t0); osc2.start(t0);
      osc1.stop(t0 + 0.024); osc2.stop(t0 + 0.024);
    }
  } else if (noiseProfile === "BROOK") {
    // Liquid resonant water droplet / bubble pop (upward pitch-chirped sine + filtered splash)
    const bubbles = 1 + (randFloat() < (0.35 + noiseRateVal * 0.45) ? 1 : 0);
    for (let b = 0; b < bubbles; b++) {
      const t0 = now + b * (0.04 + randFloat() * 0.06);
      const startF = 380 + col * 920 + randFloat() * 520;
      const endF = startF * (1.45 + randFloat() * 0.55);
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      const pan = audioCtx.createStereoPanner();
      osc.type = "sine";
      osc.frequency.setValueAtTime(startF, t0);
      osc.frequency.exponentialRampToValueAtTime(endF, t0 + 0.042);
      pan.pan.value = (randFloat() * 1.4 - 0.7) * Math.max(0.2, drift);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.22 * intensity, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.055);
      osc.connect(g); g.connect(pan); pan.connect(noiseBusGain);
      disconnectOnEnded(osc, pan);
      osc.start(t0); osc.stop(t0 + 0.062);
    }
  } else if (noiseProfile === "THUNDER") {
    // Distant rolling thunder swell (low-passed pink noise + sub rumble)
    const dur = 1.2 + randFloat() * 1.8 + drift * 1.2;
    const src = audioCtx.createBufferSource();
    src.buffer = getPinkNoiseBuffer();
    src.loop = true;
    const lp = audioCtx.createBiquadFilter();
    lp.type = "lowpass";
    const peakCut = 140 + col * 360 + randFloat() * 140;
    lp.frequency.setValueAtTime(peakCut, now);
    lp.frequency.exponentialRampToValueAtTime(55, now + dur);
    lp.Q.value = 2.8;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.55 * intensity, now + 0.08 + randFloat() * 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(lp); lp.connect(g); g.connect(noiseBusGain);
    disconnectOnEnded(src, g);
    src.start(now, randFloat() * 1.2);
    src.stop(now + dur + 0.05);
  } else if (noiseProfile === "RAIN" || noiseProfile === "WHITE_TAPE") {
    // Tactile raindrop / vinyl dust micro-crackle impulse
    const drops = noiseProfile === "RAIN" ? (1 + randRange(0, 2)) : 1;
    for (let d = 0; d < drops; d++) {
      const t0 = now + d * (0.015 + randFloat() * 0.04);
      const src = audioCtx.createBufferSource();
      src.buffer = getNoiseBuffer();
      const bp = audioCtx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = (noiseProfile === "RAIN" ? 1800 : 2800) + col * 3400 + (randFloat() - 0.5) * 900;
      bp.Q.value = noiseProfile === "RAIN" ? 3.2 : 5.0;
      const g = audioCtx.createGain();
      const pan = audioCtx.createStereoPanner();
      pan.pan.value = (randFloat() * 1.6 - 0.8) * Math.max(0.25, drift);
      const dur = noiseProfile === "RAIN" ? 0.028 : 0.012;
      g.gain.setValueAtTime(0.26 * intensity, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(bp); bp.connect(g); g.connect(pan); pan.connect(noiseBusGain);
      disconnectOnEnded(src, pan);
      src.start(t0, randFloat() * 0.8);
      src.stop(t0 + dur + 0.01);
    }
  } else if (noiseProfile === "WIND") {
    // Sweeping whistling wind gust
    const dur = 0.65 + randFloat() * 0.95 + drift * 0.8;
    const src = audioCtx.createBufferSource();
    src.buffer = getPinkNoiseBuffer();
    src.loop = true;
    const bp = audioCtx.createBiquadFilter();
    bp.type = "bandpass";
    const startF = 240 + col * 780 + randFloat() * 220;
    bp.frequency.setValueAtTime(startF, now);
    bp.frequency.exponentialRampToValueAtTime(startF * (1.35 + drift * 0.5), now + dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(startF * 0.78, now + dur);
    bp.Q.value = 5.2;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.32 * intensity, now + dur * 0.38);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    src.connect(bp); bp.connect(g); g.connect(noiseBusGain);
    disconnectOnEnded(src, g);
    src.start(now, randFloat() * 1.0);
    src.stop(now + dur + 0.05);
  }
}
