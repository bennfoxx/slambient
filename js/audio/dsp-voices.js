// =====================================================================
// SLAMBIENT CORE DSP VOICES (Phase 7 Stage 5 Decoupling)
// Sub/Drone, Tanpura, Chords (Sitar/Rhodes/Pad), and Shimmer Arp Engines
// =====================================================================

function midiToFreq(m) { return 440 * Math.pow(2, (m - 69) / 12); }

const DRONE_GLIDE_TC = 0.05, DRONE_STEP_TC = 0.03;
function currentDroneMidi() {
  let baseOctaveMidi = 48;
  if (droneOctaveChoice === "D1") baseOctaveMidi = 36;
  else if (droneOctaveChoice === "D0") baseOctaveMidi = 24;
  return Math.max(0, Math.min(127, Math.round(baseOctaveMidi + rootNote + currentChordDeg + droneWanderSemis)));
}

function updateDronePitches(glide = true) {
  if (!droneOsc1 || !audioCtx) return;
  const now = audioCtx.currentTime;
  let baseOctaveMidi = 48;
  if (droneOctaveChoice === "D1") baseOctaveMidi = 36;
  else if (droneOctaveChoice === "D0") baseOctaveMidi = 24;

  const droneMidi = baseOctaveMidi + rootNote + currentChordDeg + droneWanderSemis;
  if (isPlaying && isChannelAudible('drone') && droneVol > 0.01) {
    activeMidiNotes.set(droneMidi, { expiry: performance.now() + 600, source: "DRONE" });
  }
  midiSubSync();
  const target1 = Math.max(20, midiToFreq(droneMidi));
  const target2 = Math.max(10, midiToFreq(droneMidi - 12));

  // Anchor current frequency before setting target curve to eliminate phase jumps and clicks
  droneOsc1.frequency.cancelScheduledValues(now);
  droneOsc1.frequency.setValueAtTime(droneOsc1.frequency.value, now);
  droneOsc2.frequency.cancelScheduledValues(now);
  droneOsc2.frequency.setValueAtTime(droneOsc2.frequency.value, now);

  // New drone pitches arrive almost immediately: a 0.45s time constant meant a
  // ~1.5s audible swoop on every chord change and wander step. 0.05s is a
  // click-free step that still reads as a clean new note.
  const timeConstant = glide ? DRONE_GLIDE_TC : DRONE_STEP_TC;
  droneOsc1.frequency.setTargetAtTime(target1, now, timeConstant);
  droneOsc2.frequency.setTargetAtTime(target2, now, timeConstant);

  if (droneBuzzOsc1 && droneBuzzOsc2) {
    droneBuzzOsc1.frequency.cancelScheduledValues(now);
    droneBuzzOsc1.frequency.setValueAtTime(droneBuzzOsc1.frequency.value, now);
    droneBuzzOsc2.frequency.cancelScheduledValues(now);
    droneBuzzOsc2.frequency.setValueAtTime(droneBuzzOsc2.frequency.value, now);
    droneBuzzOsc1.frequency.setTargetAtTime(target1, now, timeConstant);
    droneBuzzOsc2.frequency.setTargetAtTime(target1, now, timeConstant);
  }
}

function playTanpuraPluck(stringIdx) {
  if (!audioCtx || !tanpuraBusGain || tanpuraVol <= 0.005 || !tanpuraEnabled) return;
  if (!isChannelAudible('drone')) return;

  const now = audioCtx.currentTime;
  const baseSa = 48 + rootNote; // Middle Sa (e.g. D3 = 50 when root is D)
  let midi = baseSa;
  let detuneCents = 0;

  if (stringIdx === 0) {
    // String 1: Pancham (Pa / 5th), Shuddha Madhyam (Ma / 4th), or Shuddha Nishad (Ni / 7th)
    if (tanpuraTuning === "MA") {
      midi = baseSa - 7; // Shuddha Ma (4th)
    } else if (tanpuraTuning === "NI") {
      midi = baseSa - 1; // Shuddha Ni (7th)
    } else {
      midi = baseSa - 5; // Pancham Pa (5th)
    }
  } else if (stringIdx === 1) {
    // String 2: Middle Sa (Jodi 1) -- symmetric +/- chorus detune around true pitch center
    midi = baseSa;
    detuneCents = -4;
  } else if (stringIdx === 2) {
    // String 3: Middle Sa (Jodi 2) with acoustic chorusing detune
    midi = baseSa;
    detuneCents = +4;
  } else {
    // String 4: Kharaj Sa (Lower Octave Tonic)
    midi = baseSa - 12;
    detuneCents = 0;
  }

  const freq = midiToFreq(midi);
  activeMidiNotes.set(midi, { expiry: performance.now() + 1800, source: "DRONE" });
  const ringDuration = 9.5; // Expansive resonant ring (all 4 strings overlap into golden bed)

  // Pluck Voice Gain Envelope: rich golden acoustic resonance
  const voiceGain = audioCtx.createGain();
  const stringWeight = stringIdx === 3 ? 1.45 : (stringIdx === 0 ? 1.15 : 1.0);
  const peakGain = 0.50 * stringWeight * (0.6 + tanpuraVol * 0.8); // tamed: sits behind the sub drone

  voiceGain.gain.setValueAtTime(0.0001, now);
  voiceGain.gain.linearRampToValueAtTime(peakGain, now + 0.09); // Soft thumb-pad pick, no hard transient
  voiceGain.gain.exponentialRampToValueAtTime(peakGain * 0.72, now + 1.1); // Sustained golden resonance
  voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + ringDuration); // Evolving acoustic decay

  // 1. Warm Wooden Gourd Fundamental (Triangle/Sine acoustic blend)
  const oscBody = audioCtx.createOscillator();
  oscBody.type = "triangle";
  oscBody.frequency.setValueAtTime(freq, now);
  oscBody.detune.setValueAtTime(detuneCents, now);

  const oscSubBody = audioCtx.createOscillator();
  oscSubBody.type = "sine";
  oscSubBody.frequency.setValueAtTime(freq, now);
  oscSubBody.detune.setValueAtTime(detuneCents, now);

  // 2. Harmonic Overtone Generator (Sawtooth with rich partial cascade)
  const oscHarmonics = audioCtx.createOscillator();
  oscHarmonics.type = "sawtooth";
  oscHarmonics.frequency.setValueAtTime(freq, now);
  oscHarmonics.detune.setValueAtTime(detuneCents + (Math.random() * 3 - 1.5), now);

  // 3. Golden Jawari Bridge Resonator (Silk/Cotton thread non-linear buzzing cascade)
  const jawariFilter = audioCtx.createBiquadFilter();
  jawariFilter.type = "bandpass";
  const formantCenter = 1100 + javariVal * 1100; // 1.1 - 2.2 kHz formant: a soft buzz, not a whistle
  jawariFilter.frequency.setValueAtTime(formantCenter, now);
  jawariFilter.Q.setValueAtTime(2.2 + javariVal * 2.0, now); // wide band, so it blends instead of ringing at one pitch

  // Micro-flutter on bridge contact (subtle acoustic undulation)
  const flutter = audioCtx.createOscillator();
  const flutterGain = audioCtx.createGain();
  flutter.frequency.setValueAtTime(4.4 + Math.random() * 1.6, now);
  flutterGain.gain.setValueAtTime(formantCenter * 0.15 * javariVal, now);
  flutter.connect(flutterGain);
  flutterGain.connect(jawariFilter.frequency);

  const buzzGain = audioCtx.createGain();
  const buzzAmt = Math.min(1.0, 0.40 + javariVal * 0.90);
  buzzGain.gain.setValueAtTime(0.0001, now);
  buzzGain.gain.linearRampToValueAtTime(0.34 * buzzAmt, now + 0.05);
  buzzGain.gain.linearRampToValueAtTime(0.44 * buzzAmt, now + 0.32); // Swell into golden bloom
  buzzGain.gain.exponentialRampToValueAtTime(0.0001, now + ringDuration * 0.9);

  // 4. Warm Gourd Body Resonator (cavity formant filter)
  const bodyFilter = audioCtx.createBiquadFilter();
  bodyFilter.type = "bandpass";
  bodyFilter.frequency.setValueAtTime(stringIdx === 3 ? 180 : 340, now);
  bodyFilter.Q.setValueAtTime(2.8, now);

  const bodyMixGain = audioCtx.createGain();
  bodyMixGain.gain.setValueAtTime(0.85, now);

  // Graph wiring
  oscHarmonics.connect(jawariFilter);
  jawariFilter.connect(buzzGain);
  buzzGain.connect(voiceGain);

  oscBody.connect(bodyFilter);
  bodyFilter.connect(bodyMixGain);
  bodyMixGain.connect(voiceGain);
  oscSubBody.connect(voiceGain);

  // Rounds off the top so the strings sit behind the other voices.
  const voiceLP = audioCtx.createBiquadFilter();
  voiceLP.type = "lowpass";
  voiceLP.frequency.setValueAtTime(1500, now); // softer pick: opens up as the string blooms
  voiceLP.frequency.linearRampToValueAtTime(2300, now + 0.6);
  voiceLP.Q.setValueAtTime(0.5, now);
  voiceGain.connect(voiceLP);
  voiceLP.connect(tanpuraBusGain);

  // Start & Stop
  oscBody.start(now);
  oscSubBody.start(now);
  oscHarmonics.start(now);
  flutter.start(now);

  oscBody.stop(now + ringDuration + 0.1);
  oscSubBody.stop(now + ringDuration + 0.1);
  oscHarmonics.stop(now + ringDuration + 0.1);
  flutter.stop(now + ringDuration + 0.1);

  setTimeout(() => {
    try {
      oscBody.disconnect();
      oscSubBody.disconnect();
      oscHarmonics.disconnect();
      jawariFilter.disconnect();
      flutter.disconnect();
      flutterGain.disconnect();
      buzzGain.disconnect();
      bodyFilter.disconnect();
      bodyMixGain.disconnect();
      voiceGain.disconnect();
      voiceLP.disconnect();
    } catch (e) {}
  }, (ringDuration + 0.2) * 1000);
}

function maybeWanderDrone() {
  if (droneWanderActive) {
    droneWanderActive = false;
    droneWanderSemis = 0;
    return;
  }
  if (droneWanderVal > 0 && randFloat() < droneWanderVal * 0.4) {
    const scale = SCALES[activeScaleKey];
    const wanderSteps = [1, 2, -1, 3];
    const step = wanderSteps[randRange(0, wanderSteps.length - 1)];
    droneWanderSemis = degreeToSemitone(step, scale) - degreeToSemitone(0, scale);
    droneWanderActive = true;
    triggerMusical3DObject("drone");
  }
}

function triggerFilterEnvelope(vel = 85) {
  if (!audioCtx || !masterFilter1 || !masterFilter2) return;
  if (typeof pedalBypassState !== "undefined" && pedalBypassState.FILTER) return;
  const now = audioCtx.currentTime;
  const attSec = Math.max(0.015, filterAttackMs / 1000);
  const decSec = Math.max(0.05, filterDecayMs / 1000);
  const safeBase = Math.max(50, Math.min(15000, masterBaseCutoff));

  let peakFreq;
  if (filterEnvDepth >= 0) {
    const octaves = 2.8 * filterEnvDepth * (vel / 127);
    peakFreq = Math.min(15000, safeBase * Math.pow(2, octaves));
  } else {
    const octaves = 2.4 * Math.abs(filterEnvDepth) * (vel / 127);
    peakFreq = Math.max(50, safeBase / Math.pow(2, octaves));
  }

  [masterFilter1, masterFilter2].forEach(f => {
    const currentFreq = Math.max(50, Math.min(15000, f.frequency.value || safeBase));
    f.frequency.cancelScheduledValues(now);
    f.frequency.setValueAtTime(currentFreq, now);
    f.frequency.linearRampToValueAtTime(Math.max(50, peakFreq), now + attSec);
    f.frequency.exponentialRampToValueAtTime(safeBase, now + attSec + decSec);
  });
}

function startNoteLive(midi, vel = 90) {
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const wasAlreadyHeld = heldMidiNotes.has(midi);
  heldMidiNotes.add(midi);

  if (keyboardRoute === "ARP") {
    if (heldMidiNotes.size === 1 && !wasAlreadyHeld) recentChordNotes.clear();
    recentChordNotes.add(midi);
    lastArpVelocity = vel;
    handleLiveKeyInput();
    if (!liveArpActive) {
      startLiveArp();
    }
    return;
  }

  if (activeLiveVoices.has(midi)) {
    stopNoteLive(midi, true);
  }

  triggerFilterEnvelope(vel);

  if (heldMidiNotes.size === 1) {
    recentChordNotes.clear();
    for (const [m, info] of Array.from(activeMidiNotes.entries())) {
      if (info.source === "CHORD" && !heldMidiNotes.has(m)) activeMidiNotes.delete(m);
    }
  }
  recentChordNotes.add(midi);

  const now = audioCtx.currentTime;
  if (ringDynamics.chord) ringDynamics.chord.impulse = Math.min(2.5, ringDynamics.chord.impulse + 1.2);
  activeMidiNotes.set(midi, { expiry: Infinity, source: "CHORD" });
  triggerMusical3DObject("chord");

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const voiceFilter = audioCtx.createBiquadFilter();
  voiceFilter.type = "lowpass";
  const baseFreq = midiToFreq(midi);
  const filterMult = (midi > 72) ? 3.0 : 5.4;
  voiceFilter.frequency.setValueAtTime(Math.min(3000, Math.max(480, baseFreq * filterMult)), now);
  voiceFilter.Q.setValueAtTime(0.7, now);
  const gain = audioCtx.createGain();
  let tremOsc = null, tremGain = null;

  const targetBus = masterGain;
  let attackTime = 0.03;
  const highNoteDamp = Math.max(0.38, 1.0 - Math.max(0, midi - 56) * 0.018);
  let sustainVol = (vel / 127) * 0.28 * highNoteDamp;
  let releaseSec = 0.40;

  if (chordTimbre === "SAW_SYNTH") {
    osc1.type = "sawtooth"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq, now);
    osc2.detune.setValueAtTime(7, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2200, baseFreq * (midi > 72 ? 2.5 : 4.5)), now);
    attackTime = 0.045; sustainVol *= 0.78; releaseSec = 0.45;
  } else if (chordTimbre === "DIGITAL_STRINGS") {
    osc1.type = "sawtooth"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq, now);
    osc2.detune.setValueAtTime(6.5, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2400, baseFreq * (midi > 72 ? 2.8 : 5.0)), now);
    attackTime = 0.09; sustainVol *= 0.80; releaseSec = 0.55;
  } else if (chordTimbre === "GLASS_EP") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
    const fmGain = audioCtx.createGain();
    const epIndex = (midi > 72) ? (0.38 / (1.0 + (midi - 72) * 0.03)) : 0.75;
    fmGain.gain.setValueAtTime(baseFreq * epIndex, now);
    fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(fmGain); fmGain.connect(osc1.frequency);
    attackTime = 0.012; sustainVol *= 0.86; releaseSec = 0.45;
  } else if (chordTimbre === "RHODES") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
    const fmGain = audioCtx.createGain();
    const rhodesIndex = (midi > 72) ? (0.35 / (1.0 + (midi - 72) * 0.03)) : 0.65;
    fmGain.gain.setValueAtTime(baseFreq * rhodesIndex, now);
    fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc2.connect(fmGain); fmGain.connect(osc1.frequency);
    attackTime = 0.014; sustainVol *= 0.90; releaseSec = 0.45;

    tremOsc = audioCtx.createOscillator(); tremOsc.type = "sine";
    tremOsc.frequency.setValueAtTime(4.8, now);
    const tremDepth = audioCtx.createGain(); tremDepth.gain.value = 0.14;
    tremGain = audioCtx.createGain(); tremGain.gain.value = 0.92;
    tremOsc.connect(tremDepth); tremDepth.connect(tremGain.gain);
  } else if (chordTimbre === "LOFI_KEYS") {
    osc1.type = "sine"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq, now);
    osc2.detune.setValueAtTime(9, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2000, baseFreq * 4.2), now);
    attackTime = 0.045; sustainVol *= 0.92; releaseSec = 0.48;
  } else if (chordTimbre === "PURE_SINE_GLASS") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
    osc2.detune.setValueAtTime(3, now);
    attackTime = 0.065; sustainVol *= 0.86; releaseSec = 0.58;
  } else if (chordTimbre === "CHAMBER_WOODS") {
    osc1.type = "triangle"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
    osc2.detune.setValueAtTime(4.5, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2400, baseFreq * 4.8), now);
    attackTime = 0.05; sustainVol *= 0.88; releaseSec = 0.50;
  } else if (chordTimbre === "CELESTIAL_ORGAN") {
    osc1.type = "sine"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
    osc2.detune.setValueAtTime(3, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2600, baseFreq * 5.0), now);
    attackTime = 0.06; sustainVol *= 0.84; releaseSec = 0.65;
  } else if (chordTimbre === "VIBES_CELESTE") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq * 3.0, now);
    const fmGain = audioCtx.createGain();
    fmGain.gain.setValueAtTime(baseFreq * 0.55, now);
    fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc2.connect(fmGain); fmGain.connect(osc1.frequency);
    attackTime = 0.010; sustainVol *= 0.86; releaseSec = 0.52;
  } else if (chordTimbre === "SITAR_STRINGS") {
    osc1.type = "sawtooth"; osc2.type = "triangle";
    const meendOffset = (randFloat() < 0.75) ? 0.94 : 0.98;
    osc1.frequency.setValueAtTime(baseFreq * meendOffset, now);
    osc1.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.065);
    osc2.frequency.setValueAtTime(baseFreq * 2.0, now);
    osc2.detune.setValueAtTime(12, now);
    voiceFilter.frequency.setValueAtTime(Math.min(3100, baseFreq * 5.8), now);
    voiceFilter.Q.setValueAtTime(2.2, now);
    attackTime = 0.014; sustainVol *= 0.84; releaseSec = 0.75;
    if (typeof triggerSympatheticStrings === "function") {
      triggerSympatheticStrings(midi, now, vel, targetBus);
    }
  } else if (chordTimbre === "WARM_PAD") {
    osc1.type = "triangle"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq, now);
    osc2.detune.setValueAtTime(6.5, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2400, baseFreq * 4.8), now);
    attackTime = 0.09; sustainVol *= 0.95; releaseSec = 0.65;
  } else {
    osc1.type = "triangle"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc2.frequency.setValueAtTime(baseFreq, now);
    osc2.detune.setValueAtTime(5, now);
    attackTime = 0.05; sustainVol *= 0.90; releaseSec = 0.45;
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(sustainVol, now + attackTime);

  if (chordTimbre === "SITAR_STRINGS") {
    const jawariShaper = audioCtx.createWaveShaper();
    jawariShaper.curve = getJawariCurve(0.65);
    const formantHi = audioCtx.createBiquadFilter();
    formantHi.type = "peaking";
    formantHi.frequency.setValueAtTime(2650, now);
    formantHi.Q.setValueAtTime(3.2, now);
    formantHi.gain.setValueAtTime(5.5, now);
    osc1.connect(jawariShaper);
    osc2.connect(jawariShaper);
    jawariShaper.connect(formantHi);
    formantHi.connect(voiceFilter);
    voiceFilter.connect(gain);
  } else {
    osc1.connect(voiceFilter);
    if (chordTimbre !== "GLASS_EP" && chordTimbre !== "RHODES" && chordTimbre !== "VIBES_CELESTE") {
      osc2.connect(voiceFilter);
    }
    voiceFilter.connect(gain);
  }

  if (tremGain) {
    gain.connect(tremGain);
    tremGain.connect(targetBus);
    tremOsc.start(now);
  } else {
    gain.connect(targetBus);
  }

  if (typeof midiPitchBendCents === "number" && midiPitchBendCents !== 0) {
    if (osc1.detune) osc1.detune.setValueAtTime(midiPitchBendCents, now);
    if (osc2.detune) {
      const curDetune = osc2.detune.value || 0;
      osc2.detune.setValueAtTime(curDetune + midiPitchBendCents, now);
    }
  }

  osc1.start(now);
  osc2.start(now);

  activeLiveVoices.set(midi, {
    osc1, osc2, gain, tremOsc, tremGain,
    route: "CHORD",
    sustainVol,
    releaseSec
  });

  midiNoteOn(MIDI_CH.MANUAL !== undefined ? MIDI_CH.MANUAL : MIDI_CH.CHORD, midi, vel);

  handleLiveKeyInput();
}

function stopNoteLive(midi, instant = false) {
  heldMidiNotes.delete(midi);

  if (keyboardRoute === "ARP") {
    if (heldMidiNotes.size === 0) {
      stopLiveArp();
    } else {
      handleLiveKeyInput();
    }
    return;
  }

  if (activeLiveVoices.has(midi)) {
    const voice = activeLiveVoices.get(midi);
    activeLiveVoices.delete(midi);

    if (audioCtx) {
      const now = audioCtx.currentTime;
      const relSec = instant ? 0.02 : voice.releaseSec;
      const currentGain = Math.max(0.0001, voice.gain.gain.value);

      voice.gain.gain.cancelScheduledValues(now);
      voice.gain.gain.setValueAtTime(currentGain, now);
      voice.gain.gain.setTargetAtTime(0.0001, now, relSec * 0.35);

      const stopTime = now + relSec + 0.15;
      disconnectOnEnded(voice.osc1, voice.tremGain || voice.gain);
      voice.osc1.stop(stopTime);
      if (voice.osc2) voice.osc2.stop(stopTime);
      if (voice.tremOsc) voice.tremOsc.stop(stopTime);
    }

    activeMidiNotes.set(midi, {
      expiry: performance.now() + Math.min(350, voice.releaseSec * 450),
      source: "CHORD"
    });
  }

  midiNoteOff(MIDI_CH.MANUAL !== undefined ? MIDI_CH.MANUAL : MIDI_CH.CHORD, midi);
}

// Sympathetic string resonance bank (Taraf strings) for Maihar Sitar physical model
function triggerSympatheticStrings(pluckedMidi, startTime, vel, targetBus) {
  if (!audioCtx || !targetBus) return;
  const scale = SCALES[activeScaleKey] || SCALES.BILAWAL || SCALES.DORIAN;
  const rootBase = 60 + (rootNote % 12); // C4-B4 taraf resonance register
  // Four taraf strings (tonic, fifth, a random scale tone, high tonic) bloom into a
  // lingering harmonic halo behind each plucked note.
  const degOffsets = [0, Math.min(4, scale.length - 1), randRange(1, scale.length - 1), 0];
  degOffsets.forEach((deg, idx) => {
    const semi = scale[deg % scale.length] + (idx >= 2 ? 12 : 0);
    const sympMidi = rootBase + semi;
    const sympFreq = midiToFreq(sympMidi);
    const delaySec = 0.035 + idx * 0.055 + randFloat() * 0.02;
    const t0 = startTime + delaySec;
    const ringDur = 3.4 + randFloat() * 1.4;

    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(sympFreq, t0);
    osc.detune.setValueAtTime((idx - 1) * 3.5, t0);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(sympFreq * 2.0, t0);
    filter.Q.setValueAtTime(6.5, t0);

    const peak = (vel / 127) * 0.040 * (1 - idx * 0.14);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + 0.30);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + ringDur);

    osc.connect(filter);
    filter.connect(g);
    g.connect(targetBus);

    disconnectOnEnded(osc, filter, g);
    osc.start(t0);
    osc.stop(t0 + ringDur + 0.05);
  });
}

function playSynthVoice(midi, duration, vel, isLead = false, delayOffsetSec = 0, sourceTag = "CHORD") {
  if (!audioCtx) return;
  // Sustain Length / Dynamics are global performance-feel controls for the
  // Chords & Voicing module -- every current caller of this function is a
  // chord-engine voice (pad, strum, or sitar/lead line), tagged "CHORD".
  duration *= chordSustainMult;
  vel = Math.min(127, vel * chordDynamicsMult);
  const now = audioCtx.currentTime + delayOffsetSec;

  setTimeout(() => {
    const highlightMs = Math.min(1100, duration * 420);
    activeMidiNotes.set(midi, {
      expiry: performance.now() + highlightMs,
      source: sourceTag
    });
  }, delayOffsetSec * 1000);

  if (ringDynamics.chord) {
    ringDynamics.chord.impulse = Math.min(2.5, ringDynamics.chord.impulse + 1.3);
  }

  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const voiceFilter = audioCtx.createBiquadFilter();
  voiceFilter.type = "lowpass";
  const freq = midiToFreq(midi);
  const filterMult = (midi > 72) ? 3.0 : 5.4;
  voiceFilter.frequency.setValueAtTime(Math.min(3000, Math.max(480, freq * filterMult)), now);
  voiceFilter.Q.setValueAtTime(0.7, now);
  const gain = audioCtx.createGain();
  let tremOsc = null, tremGain = null, tremDepth = null, fmGain = null;
  let jawariShaper = null, formantBody = null, formantBuzz = null;

  // Gentle high-note damping to keep chords warm, lush, and un-piercing in upper octaves
  const highNoteDamp = Math.max(0.38, 1.0 - Math.max(0, midi - 56) * 0.018);
  let attackTime = isLead ? 0.08 : (0.14 + (strumMs / 400));
  let baseVolume = (vel / 127) * (isLead ? 0.23 : 0.26) * highNoteDamp;

  if (chordTimbre === "SAW_SYNTH") {
    osc1.type = "sawtooth"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(isLead ? 5 : 8, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2100, freq * 4.2), now);
    attackTime = isLead ? 0.06 : 0.08;
    baseVolume *= 0.78;
  } else if (chordTimbre === "DIGITAL_STRINGS") {
    osc1.type = "sawtooth"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(isLead ? 4.5 : 7.5, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2400, freq * 4.8), now);
    attackTime = isLead ? 0.08 : 0.12;
    baseVolume *= 0.80;
  } else if (chordTimbre === "GLASS_EP") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    fmGain = audioCtx.createGain();
    const epIndex = (midi > 72) ? (0.35 / (1.0 + (midi - 72) * 0.03)) : 0.65;
    fmGain.gain.setValueAtTime(freq * epIndex, now);
    fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    osc2.connect(fmGain); fmGain.connect(osc1.frequency);
    attackTime = isLead ? 0.018 : 0.014;
    baseVolume *= 0.86;
  } else if (chordTimbre === "RHODES") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    fmGain = audioCtx.createGain();
    const rhodesIndex = (midi > 72) ? (0.32 / (1.0 + (midi - 72) * 0.03)) : 0.60;
    fmGain.gain.setValueAtTime(freq * rhodesIndex, now);
    fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc2.connect(fmGain); fmGain.connect(osc1.frequency);
    attackTime = isLead ? 0.016 : 0.014;
    baseVolume *= 0.88;

    tremOsc = audioCtx.createOscillator(); tremOsc.type = "sine";
    tremOsc.frequency.setValueAtTime(4.8, now);
    tremDepth = audioCtx.createGain(); tremDepth.gain.value = 0.14;
    tremGain = audioCtx.createGain(); tremGain.gain.value = 0.92;
    tremOsc.connect(tremDepth); tremDepth.connect(tremGain.gain);
  } else if (chordTimbre === "LOFI_KEYS") {
    osc1.type = "sine"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(isLead ? 6 : 11, now);
    voiceFilter.frequency.setValueAtTime(Math.min(1900, freq * 4.0), now);
    attackTime = isLead ? 0.05 : 0.08;
    baseVolume *= 0.90;
  } else if (chordTimbre === "PURE_SINE_GLASS") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    osc2.detune.setValueAtTime(isLead ? 2 : 3.5, now);
    attackTime = isLead ? 0.07 : (0.16 + strumMs / 380);
    baseVolume *= 0.85;
  } else if (chordTimbre === "CHAMBER_WOODS") {
    osc1.type = "triangle"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    osc2.detune.setValueAtTime(isLead ? 3 : 5, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2200, freq * 4.5), now);
    attackTime = isLead ? 0.06 : 0.10;
    baseVolume *= 0.88;
  } else if (chordTimbre === "CELESTIAL_ORGAN") {
    osc1.type = "sine"; osc2.type = "triangle";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 2.0, now);
    osc2.detune.setValueAtTime(isLead ? 2 : 3.5, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2400, freq * 4.8), now);
    attackTime = isLead ? 0.08 : 0.14;
    baseVolume *= 0.84;
  } else if (chordTimbre === "VIBES_CELESTE") {
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 3.0, now);
    fmGain = audioCtx.createGain();
    fmGain.gain.setValueAtTime(freq * 0.45, now);
    fmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.30);
    osc2.connect(fmGain); fmGain.connect(osc1.frequency);
    attackTime = isLead ? 0.015 : 0.012;
    baseVolume *= 0.84;
  } else if (chordTimbre === "WARM_PAD") {
    osc1.type = "triangle"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(isLead ? 4.5 : 8, now);
    voiceFilter.frequency.setValueAtTime(Math.min(2200, freq * 4.5), now);
    attackTime = isLead ? 0.08 : (0.18 + strumMs / 360);
    baseVolume *= 0.94;
  } else if (chordTimbre === "SITAR_STRINGS") {
    osc1.type = "sawtooth"; osc2.type = "triangle";
    // Deep expressive meend: the string is pulled flat and slides up into the note
    // over 80-180 ms on solo phrases (shallower and quicker on accompaniment notes).
    const bendDepth = isLead ? (0.865 + randFloat() * 0.05) : (0.95 + randFloat() * 0.03);
    const bendTime = isLead ? (0.08 + randFloat() * 0.10) : 0.07;
    osc1.frequency.setValueAtTime(freq * bendDepth, now);
    osc1.frequency.exponentialRampToValueAtTime(freq, now + bendTime);

    // The octave partial slides with the fundamental so the glide stays one string.
    osc2.frequency.setValueAtTime(freq * 2.0 * (isLead ? bendDepth : 1), now);
    if (isLead) osc2.frequency.exponentialRampToValueAtTime(freq * 2.0, now + bendTime);
    osc2.detune.setValueAtTime(isLead ? 12 : 9, now);
    voiceFilter.frequency.setValueAtTime(Math.min(3100, freq * 5.6), now);
    voiceFilter.Q.setValueAtTime(2.1, now);

    attackTime = 0.015;
    baseVolume *= 0.84;
  } else {
    osc1.type = "triangle";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(isLead ? 4 : 6.5, now);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(baseVolume, now + attackTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const busTarget = sourceTag === "LIVE" ? masterGain : chordBusGain;

  if (chordTimbre === "SITAR_STRINGS") {
    jawariShaper = audioCtx.createWaveShaper();
    jawariShaper.curve = getJawariCurve(isLead ? 0.75 : 0.55);
    formantBody = audioCtx.createBiquadFilter();
    formantBody.type = "peaking";
    formantBody.frequency.setValueAtTime(920, now);
    formantBody.Q.setValueAtTime(2.4, now);
    formantBody.gain.setValueAtTime(3.5, now);

    formantBuzz = audioCtx.createBiquadFilter();
    formantBuzz.type = "peaking";
    formantBuzz.frequency.setValueAtTime(2750, now);
    formantBuzz.Q.setValueAtTime(3.4, now);
    formantBuzz.gain.setValueAtTime(5.0, now);

    osc1.connect(jawariShaper);
    osc2.connect(jawariShaper);
    jawariShaper.connect(formantBody);
    formantBody.connect(formantBuzz);
    formantBuzz.connect(voiceFilter);
    voiceFilter.connect(gain);

    // Brass mizrab (wire plectrum) attack: a tiny bright click on note onset
    const clickSrc = audioCtx.createBufferSource();
    clickSrc.buffer = getNoiseBuffer();
    const clickBP = audioCtx.createBiquadFilter();
    clickBP.type = "bandpass";
    clickBP.frequency.setValueAtTime(Math.min(6500, 3600 + freq * 2.2), now);
    clickBP.Q.setValueAtTime(1.6, now);
    const clickGain = audioCtx.createGain();
    const clickPeak = (vel / 127) * (isLead ? 0.15 : 0.10);
    clickGain.gain.setValueAtTime(clickPeak, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
    clickSrc.connect(clickBP); clickBP.connect(clickGain); clickGain.connect(busTarget);
    disconnectOnEnded(clickSrc, clickBP, clickGain);
    clickSrc.start(now, Math.random() * 0.5); clickSrc.stop(now + 0.03);

    if (isLead || randFloat() < 0.55) {
      triggerSympatheticStrings(midi, now, vel, busTarget);
    }
  } else {
    osc1.connect(voiceFilter);
    if (chordTimbre !== "GLASS_EP" && chordTimbre !== "RHODES" && chordTimbre !== "VIBES_CELESTE") osc2.connect(voiceFilter);
    voiceFilter.connect(gain);
  }

  if (tremGain) { gain.connect(tremGain); tremGain.connect(busTarget); }
  else { gain.connect(busTarget); }

  disconnectOnEnded(osc1, osc2, voiceFilter, gain, tremGain, tremOsc, tremDepth, fmGain, jawariShaper, formantBody, formantBuzz);
  osc1.start(now); osc2.start(now);
  osc1.stop(now + duration + 0.1); osc2.stop(now + duration + 0.1);
  if (tremOsc) { tremOsc.start(now); tremOsc.stop(now + duration + 0.1); }

  midiNoteTimed(MIDI_CH.CHORD, midi, vel, duration, delayOffsetSec);
}

function updateChordVoicingSelectOptions() {
  const sel = document.getElementById("selChordVoicing");
  if (!sel) return;
  const currentVal = sel.value;
  sel.innerHTML = "";

  const autoOpt = document.createElement("option");
  autoOpt.value = "AUTO";
  autoOpt.textContent = "Auto-Meander (Scale-Tied Drift)";
  sel.appendChild(autoOpt);

  const sigList = SCALE_SIGNATURE_VOICINGS[activeScaleKey] || [];
  if (sigList.length > 0) {
    const optGroupSig = document.createElement("optgroup");
    optGroupSig.label = `── ${activeScaleKey} SIGNATURE ──`;
    sigList.forEach((v, idx) => {
      const opt = document.createElement("option");
      opt.value = `SIG_${idx}`;
      opt.textContent = `★ ${v.label || v.name}`;
      optGroupSig.appendChild(opt);
    });
    sel.appendChild(optGroupSig);
  }

  const optGroupStd = document.createElement("optgroup");
  optGroupStd.label = "── UNIVERSAL VOICINGS ──";
  const stdLabels = [
    "Warm 9th (I-III-V-IX)",
    "Dream 11th (Suspended Cloud)",
    "Floating 6/9 (Pastoral Pentatonic)",
    "Sus2 Spread (Open Fifths)",
    "Lydian Ether (Raised #11)",
    "Fifth Stack (Quintal Pillar)",
    "Quartal Stack (Modal Fourths)",
    "Prism Maj9 (Glass Voicing)",
    "Octave Bloom (Wide Overtone)",
    "Velvet Add9 (Warm Cluster)",
    "Deep Minor 11 (Nocturnal)",
    "Ghost Dyad (Hollow Fifth)"
  ];
  CHORD_LIBRARY.forEach((v, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = stdLabels[idx] || v.name.replace(/_/g, " ");
    optGroupStd.appendChild(opt);
  });
  sel.appendChild(optGroupStd);

  if ([...sel.options].some(o => o.value === currentVal)) {
    sel.value = currentVal;
  } else {
    sel.value = "AUTO";
  }

  // If custom dropdown wrapper is active, sync its options
  const menu = document.getElementById("menu_selChordVoicing");
  if (menu && typeof rebuildMenuOptions === "undefined") {
    // Dropdown will auto-refresh on next toggle via optSig
  }
}

function onChordVoicingSelectChange() {
  const sel = document.getElementById("selChordVoicing");
  if (!sel) return;
  chordVoicingMode = sel.value;
  if (chordVoicingMode !== "AUTO") {
    currentChordVoicing = chordVoicingMode;
    updateChordHud();
    if (isPlaying) triggerCurrentChord();
  }
  updateAudioParams();
}

function triggerCurrentChord() {
  if (chordVoicingMode !== "AUTO") {
    currentChordVoicing = chordVoicingMode;
  }
  const voicing = getActiveVoicingObject(currentChordVoicing, activeScaleKey);
  const scale = SCALES[activeScaleKey] || [0, 2, 4, 5, 7, 9, 11];
  const intervals = getVoicingIntervals(voicing, scale, currentChordRootStep);
  let rootMidi = 48 + rootNote + currentChordDeg;
  while (rootMidi > 57) rootMidi -= 12; // Keep chord fundamental in warm low-mid register (<= A3)

  // Clear previous chord highlights and replace recentChordNotes with the new chord
  recentChordNotes.clear();
  for (const [m, info] of Array.from(activeMidiNotes.entries())) {
    if (info.source === "CHORD" && !heldMidiNotes.has(m)) activeMidiNotes.delete(m);
  }

  if (chordTimbre === "SITAR_STRINGS") {
    const soloPool = (scale && scale.length > 0) ? scale : [0, 2, 4, 5, 7, 9, 11];
    const sitarTonicMidi = 48 + rootNote;
    const swaraIndex = (currentChordStepIdx * 2 + randRange(0, 2)) % soloPool.length;
    const baseSwara = soloPool[swaraIndex];
    let sitarMidi = sitarTonicMidi + baseSwara;
    // Allow authentic Indian classical saptak movement across Mandra (G2-C3) up to Taar (A5)
    if (randFloat() < 0.28) sitarMidi += 12;
    else if (randFloat() < 0.22) sitarMidi -= 12;
    while (sitarMidi > 81) sitarMidi -= 12;
    while (sitarMidi < 43) sitarMidi += 12;
    recentChordNotes.add(sitarMidi);

    const dur1 = 3.2 + (1.0 - mutationVal);
    playSynthVoice(sitarMidi, dur1, 76 + randRange(0, 12), true, 0, "CHORD");

    if (randFloat() < 0.60) {
      const nextSwaraIdx = (swaraIndex + (randFloat() < 0.5 ? 1 : -1) + soloPool.length) % soloPool.length;
      let nextMidi = sitarTonicMidi + soloPool[nextSwaraIdx] + (sitarMidi > sitarTonicMidi + 11 ? 12 : (sitarMidi < sitarTonicMidi ? -12 : 0));
      while (nextMidi > 81) nextMidi -= 12;
      while (nextMidi < 43) nextMidi += 12;
      recentChordNotes.add(nextMidi);
      const phraseDelay = 0.38 + (strumMs / 220);
      playSynthVoice(nextMidi, dur1 * 0.75, 68 + randRange(0, 12), true, phraseDelay, "CHORD");
    }

    if (randFloat() < 0.35) {
      setTimeout(() => {
        if (isPlaying) playSynthVoice(sitarTonicMidi + 12, 0.55, 48, false, 0, "CHORD");
      }, 220);
    }
  } else {
    // Warm acoustic bass root anchor in C2-B2 (MIDI 36-47) for deep, non-muddy grounding
    if (intervals.length >= 3) {
      let bassRoot = rootMidi - 12;
      while (bassRoot < 36) bassRoot += 12;
      while (bassRoot > 47) bassRoot -= 12;
      recentChordNotes.add(bassRoot);
      const bassDur = 4.2 + (1.0 - mutationVal);
      playSynthVoice(bassRoot, bassDur, 62 + randRange(0, 8), false, 0, "CHORD");
    }

    intervals.forEach((interval, idx) => {
      const offsetSec = (idx * strumMs) / 1000;
      let noteMidi = rootMidi + interval;
      while (noteMidi > 84) noteMidi -= 12; // Allow chord extensions to bloom up to C6
      while (noteMidi < 36) noteMidi += 12; // Maintain warm acoustic floor at C2
      recentChordNotes.add(noteMidi);
      const dur = 3.6 + (1.0 - mutationVal);
      playSynthVoice(noteMidi, dur, 68 + randRange(0, 14), false, offsetSec, "CHORD");
    });
  }

  triggerFilterEnvelope(76);
  updateChordHud();
  triggerMusical3DObject("chord");
}

function playArpNote(midi, vel = 85, isLive = false) {
  if (!audioCtx || (arpPattern === "OFF" && !isLive) || arpVol <= 0.01) return;
  const now = audioCtx.currentTime;

  // Allow arp to roam across C2 (MIDI 36) to C7 (MIDI 96) across the 88-key harmonic radar
  while (midi > 96) midi -= 12;
  while (midi < 36) midi += 12;

  activeMidiNotes.set(midi, { expiry: performance.now() + arpGateMs, source: "ARP" });

  if (ringDynamics.arp_main) ringDynamics.arp_main.impulse = 1.0;
  if (ringDynamics.arp_shimmer) ringDynamics.arp_shimmer.impulse = 1.4;
  if (arpStepCounter === 0 || (isLive && randFloat() < 0.35)) triggerMusical3DObject("arp");

  const durationSec = arpGateMs / 1000;
  const freq = midiToFreq(midi);
  const gain = audioCtx.createGain();
  const arpVoiceFilter = audioCtx.createBiquadFilter();
  arpVoiceFilter.type = "lowpass";
  const filterMult = (midi > 74) ? 2.4 : 3.8;
  arpVoiceFilter.frequency.setValueAtTime(Math.min(3200, Math.max(480, freq * filterMult)), now);
  arpVoiceFilter.Q.setValueAtTime(0.7, now);

  const pan = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
  if (pan) pan.pan.value = (Math.sin(tickCount * 0.45) * 0.65);

  const pitchDamp = Math.max(0.28, Math.min(1.0, 1.0 - Math.max(0, midi - 56) * 0.018));
  const v = (vel / 127) * (arpVol * 0.74) * pitchDamp;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(v, now + 0.022);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
  arpVoiceFilter.connect(gain);

  const extraVoiceNodes = [arpVoiceFilter, gain];
  if (pan) extraVoiceNodes.push(pan);

  let primaryArpOsc = null;
  if (arpTimbre === "BANSURI_FLUTE") {
    const osc = audioCtx.createOscillator(); osc.type = "sine";
    const oscOctave = audioCtx.createOscillator(); oscOctave.type = "sine";

    osc.frequency.setValueAtTime(freq * 0.982, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.038);
    oscOctave.frequency.setValueAtTime(freq * 2.0, now);

    const vibrato = audioCtx.createOscillator();
    const vibratoGain = audioCtx.createGain();
    vibrato.frequency.setValueAtTime(5.2, now);
    vibratoGain.gain.setValueAtTime(0.001, now);
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.010, now + 0.12);
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);

    const breath = audioCtx.createBufferSource();
    breath.buffer = getNoiseBuffer();
    const breathFilter = audioCtx.createBiquadFilter();
    breathFilter.type = "bandpass";
    breathFilter.frequency.setValueAtTime(Math.min(2800, freq * 2.6), now);
    breathFilter.Q.setValueAtTime(2.0, now);
    const breathGain = audioCtx.createGain();
    breathGain.gain.setValueAtTime(0.11, now);
    breathGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    breath.connect(breathFilter); breathFilter.connect(breathGain);
    breathGain.connect(arpVoiceFilter);

    const octGain = audioCtx.createGain();
    octGain.gain.setValueAtTime(0.16, now);
    octGain.gain.exponentialRampToValueAtTime(0.04, now + durationSec);
    oscOctave.connect(octGain); octGain.connect(arpVoiceFilter);

    osc.connect(arpVoiceFilter);
    osc.start(now); oscOctave.start(now); vibrato.start(now); breath.start(now, Math.random() * 0.5);
    osc.stop(now + durationSec + 0.05); oscOctave.stop(now + durationSec + 0.05);
    vibrato.stop(now + durationSec + 0.05); breath.stop(now + 0.09);
    extraVoiceNodes.push(oscOctave, vibrato, vibratoGain, breath, breathFilter, breathGain, octGain);
    primaryArpOsc = osc;
  } else if (arpTimbre === "GLASS_FM") {
    const carrier = audioCtx.createOscillator(); const mod = audioCtx.createOscillator();
    const modGain = audioCtx.createGain();
    carrier.frequency.setValueAtTime(freq, now); mod.frequency.setValueAtTime(freq * 2.0, now);
    const fmIndex = (midi > 72) ? (0.28 / (1 + (midi - 72) * 0.035)) : 0.55;
    modGain.gain.setValueAtTime(freq * fmIndex, now);
    modGain.gain.exponentialRampToValueAtTime(0.5, now + durationSec * 0.55);
    mod.connect(modGain); modGain.connect(carrier.frequency);
    carrier.connect(arpVoiceFilter); carrier.start(now); mod.start(now);
    carrier.stop(now + durationSec + 0.05); mod.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(mod, modGain);
    primaryArpOsc = carrier;
  } else if (arpTimbre === "KALIMBA") {
    const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator();
    const tineGain = audioCtx.createGain();
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 3.0, now);
    const tineLevel = (midi > 72) ? Math.max(0.03, 0.12 - (midi - 72) * 0.003) : 0.12;
    tineGain.gain.setValueAtTime(tineLevel, now);
    tineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
    osc1.connect(arpVoiceFilter); osc2.connect(tineGain); tineGain.connect(arpVoiceFilter);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + durationSec + 0.05); osc2.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(osc2, tineGain);
    primaryArpOsc = osc1;
  } else if (arpTimbre === "ANALOG_PULSE") {
    const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator();
    const pulseGain = audioCtx.createGain();
    osc1.type = "triangle"; osc2.type = "square";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq, now);
    osc2.detune.setValueAtTime(7, now);
    const pulseLevel = (midi > 72) ? Math.max(0.08, 0.28 - (midi - 72) * 0.007) : 0.28;
    pulseGain.gain.setValueAtTime(pulseLevel, now);
    arpVoiceFilter.frequency.setValueAtTime(Math.min(1800, freq * (midi > 72 ? 1.8 : 3.2)), now);
    osc1.connect(arpVoiceFilter); osc2.connect(pulseGain); pulseGain.connect(arpVoiceFilter);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + durationSec + 0.05); osc2.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(osc2, pulseGain);
    primaryArpOsc = osc1;
  } else if (arpTimbre === "SINE_CRYSTAL") {
    const osc = audioCtx.createOscillator(); osc.type = "sine";
    const shimmer = audioCtx.createOscillator(); shimmer.type = "sine";
    const shimmerGain = audioCtx.createGain();
    osc.frequency.setValueAtTime(freq, now);
    shimmer.frequency.setValueAtTime(freq * 2.0, now);
    shimmerGain.gain.setValueAtTime(0.14, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + Math.max(0.05, durationSec * 0.45));
    osc.connect(arpVoiceFilter); shimmer.connect(shimmerGain); shimmerGain.connect(arpVoiceFilter);
    osc.start(now); shimmer.start(now);
    osc.stop(now + durationSec + 0.05); shimmer.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(shimmer, shimmerGain);
    primaryArpOsc = osc;
  } else if (arpTimbre === "MUSIC_BOX") {
    const osc1 = audioCtx.createOscillator(); const osc2 = audioCtx.createOscillator();
    osc1.type = "sine"; osc2.type = "sine";
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 3.0, now);
    const chimeGain = audioCtx.createGain();
    const chimeLevel = (midi > 72) ? Math.max(0.03, 0.11 - (midi - 72) * 0.003) : 0.11;
    chimeGain.gain.setValueAtTime(chimeLevel, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(0.20, durationSec * 0.35));
    osc2.connect(chimeGain); chimeGain.connect(arpVoiceFilter);
    osc1.connect(arpVoiceFilter);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + durationSec + 0.05); osc2.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(osc2, chimeGain);
    primaryArpOsc = osc1;
  } else if (arpTimbre === "CONCERT_HARP") {
    const osc = audioCtx.createOscillator(); const body = audioCtx.createOscillator();
    osc.type = "triangle"; body.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    body.frequency.setValueAtTime(freq * 2.0, now);
    const bodyGain = audioCtx.createGain();
    bodyGain.gain.setValueAtTime(0.18, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.35);
    body.connect(bodyGain); bodyGain.connect(arpVoiceFilter);
    osc.connect(arpVoiceFilter);
    osc.start(now); body.start(now);
    osc.stop(now + durationSec + 0.05); body.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(body, bodyGain);
    primaryArpOsc = osc;
  } else if (arpTimbre === "WATER_DROPLET") {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.06, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.022);
    osc.connect(arpVoiceFilter);
    osc.start(now); osc.stop(now + durationSec + 0.05);
    primaryArpOsc = osc;
  } else if (arpTimbre === "PIZZICATO_STRING") {
    const osc = audioCtx.createOscillator(); const pluck = audioCtx.createOscillator();
    osc.type = "triangle"; pluck.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    pluck.frequency.setValueAtTime(freq * 2.0, now);
    const pluckGain = audioCtx.createGain();
    pluckGain.gain.setValueAtTime(0.12, now);
    pluckGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    pluck.connect(pluckGain); pluckGain.connect(arpVoiceFilter);
    osc.connect(arpVoiceFilter);
    osc.start(now); pluck.start(now);
    osc.stop(now + durationSec + 0.05); pluck.stop(now + durationSec + 0.05);
    extraVoiceNodes.push(pluck, pluckGain);
    primaryArpOsc = osc;
  } else {
    const osc = audioCtx.createOscillator(); osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(arpVoiceFilter); osc.start(now); osc.stop(now + durationSec + 0.05);
    primaryArpOsc = osc;
  }

  if (pan) { gain.connect(pan); pan.connect(arpBusGain); }
  else { gain.connect(arpBusGain); }
  disconnectOnEnded(primaryArpOsc, extraVoiceNodes);

  midiNoteTimed(MIDI_CH.ARP, midi, vel, durationSec);
}

function getArpNotesPool() {
  if (customArpPool && customArpPool.length > 0) {
    let pool = [];
    for (let oct = 0; oct < arpOctaves; oct++) {
      customArpPool.forEach(note => {
        let n = (note - 24) + (oct * 12);
        while (n > 96) n -= 12;
        while (n < 36) n += 12;
        pool.push(n);
      });
    }
    return Array.from(new Set(pool)).sort((a,b) => a - b);
  }
  const voicing = getActiveVoicingObject(currentChordVoicing, activeScaleKey);
  const scale = SCALES[activeScaleKey] || [0, 2, 4, 5, 7, 9, 11];
  const intervals = getVoicingIntervals(voicing, scale, currentChordRootStep);
  let baseRoot = 36 + rootNote + currentChordDeg;
  while (baseRoot > 48) baseRoot -= 12;
  while (baseRoot < 36) baseRoot += 12;
  let baseNotes = intervals.map(semi => baseRoot + semi);
  let fullPool = [];
  for (let oct = 0; oct < arpOctaves; oct++) {
    baseNotes.forEach(note => {
      let n = note + (oct * 12);
      while (n > 96) n -= 12;
      while (n < 36) n += 12;
      fullPool.push(n);
    });
  }
  return Array.from(new Set(fullPool)).sort((a,b) => a - b);
}
