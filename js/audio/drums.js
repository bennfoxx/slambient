// Slambient — Polyrhythmic Drum & Percussion Synthesis Engine
// Handles synthesized kick, snare, hats, woodblocks, Hindustani Tabla (Dayan/Bayan), and generative groove fills

function getDrumKitModifiers() {
  if (drumKit === "ANALOG_CRUNCH") return { pitchMult: 0.92, decayMult: 0.85, noiseCutoff: 0.72, drive: 1.35 };
  if (drumKit === "TAPE_DUST")     return { pitchMult: 0.86, decayMult: 1.15, noiseCutoff: 0.52, drive: 0.92 };
  if (drumKit === "ACOUSTIC_CHAMBER") return { pitchMult: 1.08, decayMult: 1.30, noiseCutoff: 1.25, drive: 1.05 };
  return { pitchMult: 1.0, decayMult: 1.0, noiseCutoff: 1.0, drive: 1.0 };
}

function playKick(drive = 1.0) {
  if (!audioCtx || drumVol <= 0.01) return;
  midiDrumHit("KICK", 100);
  activeMidiNotes.set(36, { expiry: performance.now() + 180, source: "DRUM" });
  const now = audioCtx.currentTime;
  const kit = getDrumKitModifiers();
  const effDrive = drive * kit.drive;

  const clickOsc = audioCtx.createOscillator(); const clickGain = audioCtx.createGain();
  clickOsc.type = "triangle"; clickOsc.frequency.setValueAtTime(340 * kit.pitchMult, now);
  clickOsc.frequency.exponentialRampToValueAtTime(42 * kit.pitchMult, now + 0.02);
  clickGain.gain.setValueAtTime(0.60 * drumVol * effDrive, now);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035 * kit.decayMult);
  clickOsc.connect(clickGain); clickGain.connect(drumBusGain);
  disconnectOnEnded(clickOsc, clickGain);
  clickOsc.start(now); clickOsc.stop(now + 0.04 * kit.decayMult);

  const subOsc = audioCtx.createOscillator(); const subGain = audioCtx.createGain();
  subOsc.type = "sine"; subOsc.frequency.setValueAtTime(165 * kit.pitchMult, now);
  subOsc.frequency.exponentialRampToValueAtTime(36 * kit.pitchMult, now + 0.11);

  const vol = (0.90 + drumPunch * 0.60) * drumVol * effDrive;
  subGain.gain.setValueAtTime(vol, now);
  subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 * kit.decayMult);
  subOsc.connect(subGain); subGain.connect(drumBusGain);
  disconnectOnEnded(subOsc, subGain);
  subOsc.start(now); subOsc.stop(now + 0.38 * kit.decayMult);

  if (ringDynamics.drum) {
    ringDynamics.drum.impulse = Math.min(2.5, ringDynamics.drum.impulse + 1.6 * drive);
  }
  if (drive >= 0.85) triggerMusical3DObject("drum");

  if (isPlaying && !isDrumFillActive && isChannelAudible('drone') && droneGain && drumPunch > 0.1) {
    const origDrone = droneVol * 0.16;
    droneGain.gain.cancelScheduledValues(now);
    droneGain.gain.setValueAtTime(droneGain.gain.value, now);
    droneGain.gain.linearRampToValueAtTime(origDrone * (1.0 - drumPunch * 0.72), now + 0.015);
    droneGain.gain.setTargetAtTime(origDrone, now + 0.07, 0.12);
  }
}

let noiseBufferCache = null;
function getNoiseBuffer() {
  if (!noiseBufferCache || noiseBufferCache.sampleRate !== audioCtx.sampleRate) {
    const len = Math.floor(audioCtx.sampleRate * 1.0);
    noiseBufferCache = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = noiseBufferCache.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  }
  return noiseBufferCache;
}

let pinkNoiseBufferCache = null;
function getPinkNoiseBuffer() {
  if (!pinkNoiseBufferCache || pinkNoiseBufferCache.sampleRate !== audioCtx.sampleRate) {
    const len = Math.floor(audioCtx.sampleRate * 2.0);
    pinkNoiseBufferCache = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
    const d = pinkNoiseBufferCache.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  }
  return pinkNoiseBufferCache;
}

function playSnare(hard = false) {
  if (!audioCtx || drumVol <= 0.01) return;
  midiDrumHit("SNARE", hard ? 115 : 90);
  activeMidiNotes.set(38, { expiry: performance.now() + 160, source: "DRUM" });
  const now = audioCtx.currentTime;
  const kit = getDrumKitModifiers();

  const bodyOsc = audioCtx.createOscillator(); const bodyGain = audioCtx.createGain();
  bodyOsc.type = "triangle"; bodyOsc.frequency.setValueAtTime((hard ? 220 : 185) * kit.pitchMult, now);
  bodyOsc.frequency.exponentialRampToValueAtTime(75 * kit.pitchMult, now + 0.08);
  bodyGain.gain.setValueAtTime((hard ? 0.68 : 0.45) * drumVol * kit.drive, now);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12 * kit.decayMult);
  bodyOsc.connect(bodyGain); bodyGain.connect(drumBusGain);
  disconnectOnEnded(bodyOsc, bodyGain);
  bodyOsc.start(now); bodyOsc.stop(now + 0.14 * kit.decayMult);

  const whiteNoise = audioCtx.createBufferSource(); whiteNoise.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass"; filter.frequency.value = (hard ? 2400 : 1700) * kit.noiseCutoff; filter.Q.value = 1.4;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.setValueAtTime((hard ? 0.65 : 0.44) * drumVol * kit.drive, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + (hard ? 0.22 : 0.16) * kit.decayMult);

  whiteNoise.connect(filter); filter.connect(noiseGain); noiseGain.connect(drumBusGain);
  disconnectOnEnded(whiteNoise, filter, noiseGain);
  whiteNoise.start(now, Math.random() * 0.7); whiteNoise.stop(now + 0.25 * kit.decayMult);

  if (ringDynamics.drum) {
    ringDynamics.drum.impulse = Math.min(2.2, ringDynamics.drum.impulse + (hard ? 1.4 : 1.0));
  }
}

function playWoodblock(pitchMult = 1.0) {
  if (!audioCtx || drumVol <= 0.01) return;
  midiDrumHit("WOODBLOCK", 85);
  activeMidiNotes.set(40, { expiry: performance.now() + 120, source: "DRUM" });
  const now = audioCtx.currentTime;
  const kit = getDrumKitModifiers();

  const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
  osc.type = "triangle"; osc.frequency.setValueAtTime(760 * pitchMult * kit.pitchMult, now);
  osc.frequency.exponentialRampToValueAtTime(410 * pitchMult * kit.pitchMult, now + 0.035);
  gain.gain.setValueAtTime(0.50 * drumVol * kit.drive, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065 * kit.decayMult);
  osc.connect(gain); gain.connect(drumBusGain);
  disconnectOnEnded(osc, gain);
  osc.start(now); osc.stop(now + 0.075 * kit.decayMult);

  if (ringDynamics.drum) {
    ringDynamics.drum.impulse = Math.min(1.8, ringDynamics.drum.impulse + 0.8);
  }
}

function playHiHat(accent = false) {
  if (!audioCtx || drumVol <= 0.01) return;
  midiDrumHit(accent ? "HAT_ACCENT" : "HAT", accent ? 105 : 70);
  activeMidiNotes.set(42, { expiry: performance.now() + 100, source: "DRUM" });
  const now = audioCtx.currentTime;
  const kit = getDrumKitModifiers();

  const source = audioCtx.createBufferSource(); source.buffer = getNoiseBuffer();
  const filter = audioCtx.createBiquadFilter();
  filter.type = "highpass"; filter.frequency.value = Math.max(2400, 6500 * kit.noiseCutoff);

  const gain = audioCtx.createGain();
  const hatVol = (accent ? 0.32 : 0.16) * drumVol * kit.drive;
  gain.gain.setValueAtTime(hatVol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (accent ? 0.06 : 0.04) * kit.decayMult);

  source.connect(filter); filter.connect(gain); gain.connect(drumBusGain);
  disconnectOnEnded(source, filter, gain);
  source.start(now, Math.random() * 0.7); source.stop(now + 0.07 * kit.decayMult);
}

// Phase 4: Expanded Tabla Articulations (Ge / Na / Tin / Ti / Re / Ki / Dha)
// Models the wooden Dayan (right-hand treble drum tuned to the active tonic)
// and metal/clay Bayan (left-hand bass drum with palm-heel pressure meend).
function playDayan(stroke = "TUN", hard = 1.0) {
  if (!audioCtx || drumVol <= 0.01) return;
  midiDrumHit((stroke === "TUN" || stroke === "TIN" || stroke === "NA" || stroke === "TA") ? "DAYAN_OPEN" : "DAYAN_MUTE", 60 + 60 * Math.min(1, hard));
  const dayanMidi = (stroke === "TUN" || stroke === "TIN") ? 43 : ((stroke === "NA" || stroke === "TA") ? 45 : 41);
  activeMidiNotes.set(dayanMidi, { expiry: performance.now() + 160, source: "DRUM" });
  const now = audioCtx.currentTime;
  const kit = getDrumKitModifiers();
  const baseFreq = midiToFreq(48 + rootNote) * kit.pitchMult;
  const tonicFreq = baseFreq < 180 ? baseFreq * 2 : baseFreq;

  const osc1 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const isTin = (stroke === "TUN" || stroke === "TIN");
  const isNa = (stroke === "NA" || stroke === "TA");
  const isTiRe = (stroke === "TI" || stroke === "RE" || stroke === "KI");

  if (isTin) {
    // Open resonant bell-like tone on the sur/maidan (between siyahi and kinar)
    // Tuned to fundamental + harmonic overtones (1.0x, 2.01x, 2.98x)
    const osc2 = audioCtx.createOscillator();
    const osc3 = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    osc1.type = "sine";
    osc2.type = "triangle";
    osc3.type = "sine";
    osc1.frequency.setValueAtTime(tonicFreq * 1.015, now);
    osc1.frequency.exponentialRampToValueAtTime(tonicFreq, now + 0.025);
    osc2.frequency.setValueAtTime(tonicFreq * 2.01, now);
    osc3.frequency.setValueAtTime(tonicFreq * 2.98, now);

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(tonicFreq * 1.65, now);
    filter.Q.setValueAtTime(3.6, now);

    const decay = (stroke === "TUN" ? 0.38 : 0.30) * kit.decayMult;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.58 * drumVol * hard * kit.drive, now + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    const g3 = audioCtx.createGain();
    g3.gain.value = 0.28;
    osc1.connect(filter); osc2.connect(filter);
    osc3.connect(g3); g3.connect(filter);
    filter.connect(gain); gain.connect(drumBusGain);

    disconnectOnEnded(osc1, osc2, osc3, g3, filter, gain);
    osc1.start(now); osc2.start(now); osc3.start(now);
    osc1.stop(now + decay + 0.05); osc2.stop(now + decay + 0.05); osc3.stop(now + decay + 0.05);
  } else if (isNa) {
    // Crisp metallic edge rim strike (kinar) with ring finger damping fundamental
    osc1.type = "triangle";
    const osc2 = audioCtx.createOscillator();
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(tonicFreq * 1.04, now);
    osc1.frequency.exponentialRampToValueAtTime(tonicFreq, now + 0.022);
    osc2.frequency.setValueAtTime(tonicFreq * 3.02, now);

    const noise = audioCtx.createBufferSource();
    noise.buffer = getNoiseBuffer();
    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(3950 * kit.noiseCutoff, now);
    noiseFilter.Q.setValueAtTime(3.2, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.52 * drumVol * hard * kit.drive, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);

    noise.connect(noiseFilter); noiseFilter.connect(noiseGain);
    noiseGain.connect(drumBusGain);
    disconnectOnEnded(noise, noiseFilter, noiseGain);
    noise.start(now, Math.random() * 0.5); noise.stop(now + 0.06);

    const decay = 0.21 * kit.decayMult;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.46 * drumVol * hard * kit.drive, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    const g2 = audioCtx.createGain();
    g2.gain.value = 0.35;
    osc1.connect(gain); osc2.connect(g2); g2.connect(gain);
    gain.connect(drumBusGain);
    disconnectOnEnded(osc1, osc2, g2, gain);
    osc1.start(now); osc2.start(now);
    osc1.stop(now + decay + 0.04); osc2.stop(now + decay + 0.04);
  } else if (isTiRe) {
    // Crisp closed siyahi finger strokes (Ti-Re-Ki-Ta) optimized for high-speed subdivisions
    const pitchOffset = stroke === "RE" ? 0.94 : (stroke === "KI" ? 0.78 : 0.88);
    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(tonicFreq * pitchOffset * 1.12, now);
    osc1.frequency.exponentialRampToValueAtTime(tonicFreq * pitchOffset * 0.72, now + 0.028);
    const decay = 0.042 * kit.decayMult;
    gain.gain.setValueAtTime(0.38 * drumVol * hard * kit.drive, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    // Subtle skin slap transient
    const slap = audioCtx.createBufferSource();
    slap.buffer = getNoiseBuffer();
    const slapF = audioCtx.createBiquadFilter();
    slapF.type = "bandpass";
    slapF.frequency.value = 2100 * kit.noiseCutoff;
    slapF.Q.value = 1.8;
    const slapG = audioCtx.createGain();
    slapG.gain.setValueAtTime(0.24 * drumVol * hard, now);
    slapG.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
    slap.connect(slapF); slapF.connect(slapG); slapG.connect(drumBusGain);
    disconnectOnEnded(slap, slapF, slapG);
    slap.start(now, Math.random() * 0.5); slap.stop(now + 0.03);

    osc1.connect(gain); gain.connect(drumBusGain);
    disconnectOnEnded(osc1, gain);
    osc1.start(now); osc1.stop(now + decay + 0.015);
  }

  if (ringDynamics.drum) ringDynamics.drum.impulse = Math.min(2.0, ringDynamics.drum.impulse + 0.9 * hard);
}

function playBayan(stroke = "GHE", slide = true, hard = 1.0) {
  if (!audioCtx || drumVol <= 0.01) return;
  midiDrumHit("BAYAN", 60 + 60 * Math.min(1, hard));
  const bayanMidi = (stroke === "KAT" || stroke === "KE") ? 38 : 36;
  activeMidiNotes.set(bayanMidi, { expiry: performance.now() + 220, source: "DRUM" });
  const now = audioCtx.currentTime;
  const kit = getDrumKitModifiers();

  if (stroke === "KAT" || stroke === "KE") {
    // Dry damped slap with flat palm
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(132 * kit.pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(48 * kit.pitchMult, now + 0.038);
    gain.gain.setValueAtTime(0.52 * drumVol * hard * kit.drive, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.052);
    osc.connect(gain); gain.connect(drumBusGain);
    disconnectOnEnded(osc, gain);
    osc.start(now); osc.stop(now + 0.06);
    return;
  }

  // Open "Ge/Ghe": Deep undulating bass tone with tempo-adaptive palm meend
  // Scales envelope duration cleanly with BPM so rapid drut-laya passages stay articulate
  const tempoScale = Math.max(0.48, Math.min(1.15, 76 / Math.max(40, bpm)));
  const oscMain = audioCtx.createOscillator();
  const oscSub = audioCtx.createOscillator();
  const resonantFilter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  const baseFreq = 58 * kit.pitchMult;
  oscMain.type = "sine";
  oscSub.type = "sine";

  oscMain.frequency.setValueAtTime(baseFreq, now);
  oscSub.frequency.setValueAtTime(baseFreq * 0.5, now);

  let oscMeendLFO = null, lfoGain = null;
  if (slide) {
    oscMeendLFO = audioCtx.createOscillator();
    lfoGain = audioCtx.createGain();
    const peakFreq = (112 + randFloat() * 24) * kit.pitchMult; // gentler scoop (was 132-166 Hz)
    oscMain.frequency.exponentialRampToValueAtTime(baseFreq * 0.84, now + 0.018 * tempoScale);
    oscMain.frequency.exponentialRampToValueAtTime(peakFreq, now + 0.125 * tempoScale);
    oscMain.frequency.exponentialRampToValueAtTime(baseFreq * 1.38, now + 0.32 * tempoScale);
    oscMain.frequency.exponentialRampToValueAtTime(baseFreq, now + 0.65 * tempoScale);

    oscSub.frequency.setValueAtTime(baseFreq * 0.5, now);
    oscSub.frequency.exponentialRampToValueAtTime(peakFreq * 0.5, now + 0.125 * tempoScale);
    oscSub.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.60 * tempoScale);

    oscMeendLFO.frequency.setValueAtTime(5.8, now);
    lfoGain.gain.setValueAtTime(0.001, now);
    lfoGain.gain.linearRampToValueAtTime(9.0, now + 0.18 * tempoScale);
    lfoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65 * tempoScale);
    oscMeendLFO.connect(lfoGain);
    lfoGain.connect(oscMain.frequency);
    oscMeendLFO.start(now);
    oscMeendLFO.stop(now + 0.70 * tempoScale);
  }

  resonantFilter.type = "lowpass";
  resonantFilter.Q.setValueAtTime(2.6, now); // was 5.6: resonant peak was clipping into the limiter
  const filterStart = 115;
  const filterPeak = slide ? (235 + randFloat() * 45) : 145;
  resonantFilter.frequency.setValueAtTime(filterStart, now);
  resonantFilter.frequency.exponentialRampToValueAtTime(filterPeak, now + 0.125 * tempoScale);
  resonantFilter.frequency.exponentialRampToValueAtTime(95, now + 0.62 * tempoScale);

  const vol = (0.84 + drumPunch * 0.52) * drumVol * hard * kit.drive * (slide ? 0.88 : 1.0);
  const decay = 0.68 * tempoScale * kit.decayMult;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(vol, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(vol * 0.58, now + 0.16 * tempoScale);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

  oscMain.connect(resonantFilter);
  oscSub.connect(resonantFilter);
  resonantFilter.connect(gain);
  gain.connect(drumBusGain);

  disconnectOnEnded(oscMain, oscSub, resonantFilter, gain, oscMeendLFO, lfoGain);
  oscMain.start(now);
  oscSub.start(now);
  oscMain.stop(now + decay + 0.04);
  oscSub.stop(now + decay + 0.04);

  if (ringDynamics.drum) ringDynamics.drum.impulse = Math.min(2.5, ringDynamics.drum.impulse + 1.8 * hard);
  if (slide || hard > 0.8) triggerMusical3DObject("drum");

  if (isPlaying && !isDrumFillActive && isChannelAudible('drone') && droneGain && drumPunch > 0.1) {
    const origDrone = droneVol * 0.16;
    droneGain.gain.cancelScheduledValues(now);
    droneGain.gain.setValueAtTime(droneGain.gain.value, now);
    droneGain.gain.linearRampToValueAtTime(origDrone * (1.0 - drumPunch * 0.4), now + 0.015);
    droneGain.gain.setTargetAtTime(origDrone, now + 0.07, 0.14);
  }
}

// Combined "Dha" / "Dhin" stroke: simultaneous Bayan Ge + Dayan Na/Tin with slight micro-humanization
function playTablaDha(open = true, slide = true, hard = 1.0) {
  // Scoops (palm-heel meend) only on strong accents or the odd intermediate beat
  const doSlide = slide && (hard >= 1.15 || randFloat() < 0.35);
  playBayan("GHE", doSlide, hard);
  const microOffsetMs = 3 + Math.random() * 6;
  setTimeout(() => {
    playDayan(open ? "NA" : "TUN", hard * 0.96);
  }, microOffsetMs);
}

// Finger-roll subdivisions layered on a beat's main stroke (which plays on tick 0).
// Each entry is [offset in ticks from the beat start, stroke, hardness]; "NA" is the
// crisp wooden dayan rim strike and "KAT" the muted flat-palm bayan slap.
const TABLA_PHRASES = {
  TI_RE_KI_TA: [[2, "TI", 0.60], [2.5, "RE", 0.50], [3, "KI", 0.56], [3.5, "NA", 0.85]],
  DHA_TI_TE:   [[1, "KAT", 0.55], [2, "TI", 0.62], [3, "RE", 0.56]],
  TA_KI_TA:    [[1, "NA", 0.80], [2, "KI", 0.55], [3, "NA", 0.78]]
};
// Which beat of the tala gets which phrase (Rupak 3+2+2 cadences, Teental bars)
const TABLA_PHRASE_BEATS = {
  "7/4": { 2: "TA_KI_TA", 4: "DHA_TI_TE", 6: "TI_RE_KI_TA" },
  "4/4": { 1: "DHA_TI_TE", 2: "TA_KI_TA", 3: "TI_RE_KI_TA" }
};
let tablaPhraseActive = false;

function playTablaPhrase(name, tpb) {
  const phrase = TABLA_PHRASES[name];
  if (!phrase) return;
  const tickMs = 60000 / Math.max(40, bpm) / tpb;
  phrase.forEach(([off, stroke, hard]) => {
    setTimeout(() => {
      if (!isPlaying) return;
      if (stroke === "KAT") playBayan("KAT", false, hard);
      else playDayan(stroke, hard);
    }, off * tickMs);
  });
}

function playTablaGroove(measureTick, isDownbeat, ts) {
  const tpb = ts.ticksPerBeat || 4;
  const currentBeat = Math.floor(measureTick / tpb);
  const subTick = measureTick % tpb;

  // Decide once per beat (on its first tick) whether a finger-roll phrase replaces
  // the random off-beat fillers for that beat.
  if (subTick === 0) {
    const phraseName = tpb === 4 && TABLA_PHRASE_BEATS[currentTimeSig] ? TABLA_PHRASE_BEATS[currentTimeSig][currentBeat] : null;
    tablaPhraseActive = !!phraseName && randFloat() < (0.30 + drumDensity * 0.50);
    if (tablaPhraseActive) playTablaPhrase(phraseName, tpb);
  }

  if (currentTimeSig === "7/4") {
    // Rupak Tala cycle: 7 beats (3 + 2 + 2)
    // Beats 1-3 (Khali wave): Tin - Tin - Na
    // Beats 4-5 (Tali): Dhin - Na
    // Beats 6-7 (Tali): Dhin - Dha
    if (subTick === 0) {
      if (currentBeat === 0) {
        playDayan("TUN", 1.2);
      } else if (currentBeat === 1) {
        playDayan("TUN", 0.95);
      } else if (currentBeat === 2) {
        playDayan("NA", 1.0);
      } else if (currentBeat === 3) {
        playTablaDha(false, true, 1.12);
      } else if (currentBeat === 4) {
        playDayan("NA", 0.95);
      } else if (currentBeat === 5) {
        playTablaDha(false, true, 1.08);
      } else if (currentBeat === 6) {
        playTablaDha(true, true, 1.2);
      }
    } else if (subTick === 2 && !tablaPhraseActive && randFloat() < (0.45 + drumDensity * 0.45)) {
      if (currentBeat === 6) {
        playTablaDha(true, true, 0.82);
      } else if (currentBeat === 3 || currentBeat === 5) {
        playBayan("GHE", false, 0.75);
        playDayan("TUN", 0.70);
      } else if (currentBeat === 2 || currentBeat === 4) {
        playDayan("TI", 0.65);
      } else {
        playDayan("TUN", 0.65);
      }
    }
  } else if (currentTimeSig === "4/4") {
    // Classical Teental 16-matra cycle
    const stepInCycle = (barCount % 2) * 16 + measureTick;
    const isKhali = (stepInCycle >= 16 && stepInCycle < 24);

    if (subTick === 0) {
      if (currentBeat === 0) {
        playTablaDha(true, true, 1.22);
      } else if (currentBeat === 1 || currentBeat === 2) {
        if (isKhali) {
          playDayan("TUN", 1.05);
        } else {
          playTablaDha(false, true, 1.0);
        }
      } else if (currentBeat === 3) {
        if (isKhali) {
          playDayan("NA", 1.05);
        } else {
          playTablaDha(true, true, 1.12);
        }
      }
    } else if (subTick === 2 && !tablaPhraseActive && randFloat() < (0.45 + drumDensity * 0.45)) {
      if (currentBeat === 0 || currentBeat === 2) {
        playBayan("GHE", false, 0.80);
        playDayan("TUN", 0.75);
      } else {
        playDayan("TI", 0.65);
      }
    }
  } else {
    // Adaptive tala for 5/8, 7/8, 5/4, etc.
    if (isDownbeat) {
      playTablaDha(true, true, 1.2);
    } else if (subTick === 0) {
      if (currentBeat % 2 === 1) {
        playTablaDha(false, true, 0.95);
      } else {
        playDayan("TUN", 0.9);
      }
    } else if (subTick === 2 && !tablaPhraseActive && randFloat() < drumDensity) {
      playDayan("TI", 0.6);
    }
  }

  // Rapid Ti-Re-Ki-Ta polyrhythmic embellishments & cross-rhythm bols
  if (!isDownbeat && subTick !== 0 && !tablaPhraseActive) {
    const polyPhase = (stepEuclid * 3) % 7;
    if (polyPhase < 2 && randFloat() < (0.20 + drumDensity * 0.36)) {
      const fillStrokes = ["TUN", "NA", "TI", "RE", "KI"];
      const stroke = fillStrokes[randRange(0, fillStrokes.length - 1)];
      playDayan(stroke, 0.48 + randFloat() * 0.35);
      if (drumDensity > 0.55 && randFloat() < 0.42) {
        const subMs = Math.max(42, ((60000 / bpm) / 8));
        setTimeout(() => playDayan(stroke === "TI" ? "RE" : "KI", 0.42), subMs);
      }
    }
  }
}

// Phase 4: Clock-Locked & Beat-Synchronized Drum Fill Generator
// Replaces the underlying drum groove for the duration of the fill (never plays over top of it),
// acts as a rhythmic bridge between the old groove and the new groove on switches/auto-evolve,
// and locks to the live clock grid when pressed manually.
let isDrumFillActive = false;
let lastFillArchetype = -1;
let activeFillQueue = [];
let pendingDrumStyleAfterFill = null;
let previewFillTimers = [];

function clearPreviewFillTimers() {
  while (previewFillTimers.length > 0) {
    clearTimeout(previewFillTimers.pop());
  }
}

function scheduleSubTick(fn, delayMs) {
  const id = setTimeout(fn, delayMs);
  previewFillTimers.push(id);
}

function buildDrumFillStepQueue(numTicks, styleContext) {
  let archetype = randRange(0, 4);
  if (archetype === lastFillArchetype) archetype = (archetype + 1 + randRange(0, 3)) % 5;
  lastFillArchetype = archetype;

  const isTabla = (styleContext === "TABLA_GROOVE");
  const startPitch = 1.18 + randFloat() * 0.42;
  const endPitch = 0.68 + randFloat() * 0.24;
  const steps = [];

  for (let i = 0; i < numTicks; i++) {
    const progress = numTicks > 1 ? i / (numTicks - 1) : 1;
    const isLastTick = (i === numTicks - 1);

    if (isTabla) {
      const vel = Math.min(1.32, (0.72 + progress * 0.45) * (0.88 + randFloat() * 0.24));
      steps.push((tickMs) => {
        if (isLastTick) {
          // Turnaround cadence pickup leading directly into the next beat/bar Sam
          playBayan("KAT", false, vel * 0.95);
          playDayan("NA", vel * 1.05);
          scheduleSubTick(() => playTablaDha(true, true, 1.18), tickMs * 0.5);
        } else if (archetype === 0) {
          // Rapid Ti-Re-Ki-Ta-Tak 32nd-note subdivision flurry locked to tickMs
          const bolA = (i % 2 === 0) ? "TI" : "KI";
          const bolB = (i % 2 === 0) ? "RE" : "NA";
          playDayan(bolA, vel);
          if (randFloat() < 0.35) playBayan("GHE", true, vel * 0.78);
          scheduleSubTick(() => playDayan(bolB, vel * 0.88), tickMs * 0.5);
        } else if (archetype === 1) {
          // Tihai 3-part rhythmic cadence across clock ticks
          const m = i % 3;
          if (m === 0) {
            playDayan("TI", vel * 0.92);
            scheduleSubTick(() => playDayan("RE", vel * 0.85), tickMs * 0.5);
          } else if (m === 1) {
            playDayan("NA", vel);
          } else {
            playTablaDha(true, true, vel * 1.12);
          }
        } else if (archetype === 2) {
          // Expressive Bayan meend bass-dialogue (Ghe-Tin-Ghe-Na)
          if (i % 2 === 0) {
            playBayan("GHE", true, vel * 1.05);
            if (randFloat() < 0.45) scheduleSubTick(() => playDayan("TI", vel * 0.75), tickMs * 0.5);
          } else {
            playDayan(randFloat() < 0.5 ? "TUN" : "NA", vel);
          }
        } else if (archetype === 3) {
          // Triplet / double-time Kinar & Sur rim-bell roll
          playDayan(i % 2 === 0 ? "TUN" : "NA", vel);
          if (randFloat() < 0.65) {
            scheduleSubTick(() => playDayan("TI", vel * 0.78), tickMs * 0.34);
            scheduleSubTick(() => playDayan("RE", vel * 0.82), tickMs * 0.67);
          }
        } else {
          // Full Paran cascade mixing Dha, dry Kat, and Ti-Re
          const r = randFloat();
          if (r < 0.36) playTablaDha(randFloat() < 0.5, true, vel);
          else if (r < 0.62) {
            playBayan("KAT", false, vel);
            scheduleSubTick(() => playDayan("NA", vel * 0.88), tickMs * 0.5);
          } else {
            playDayan("TI", vel);
            scheduleSubTick(() => playDayan("RE", vel * 0.86), tickMs * 0.5);
          }
        }
      });
    } else {
      steps.push((tickMs) => {
        const pMult = Math.max(0.55, startPitch + (endPitch - startPitch) * progress + (randFloat() - 0.5) * 0.12);
        if (isLastTick) {
          // Final pickup tick leading cleanly into the next downbeat/beat of the groove
          const endRoll = randFloat();
          if (endRoll < 0.45) {
            playSnare(true);
            scheduleSubTick(() => { playKick(1.12); playHiHat(true); }, tickMs * 0.5);
          } else if (endRoll < 0.78) {
            playKick(1.08);
            playWoodblock(endPitch);
            scheduleSubTick(() => playSnare(true), tickMs * 0.5);
          } else {
            playSnare(false);
            scheduleSubTick(() => playSnare(true), tickMs * 0.34);
            scheduleSubTick(() => { playKick(1.15); playHiHat(true); }, tickMs * 0.67);
          }
        } else if (archetype === 0) {
          // Archetype 0: Pitched Woodblock / Tom cascade locked to 16th/32nd grid
          playWoodblock(pMult);
          if (randFloat() < 0.42) {
            scheduleSubTick(() => playSnare(false), tickMs * 0.5);
          } else if (randFloat() < 0.30) {
            scheduleSubTick(() => playWoodblock(Math.max(0.55, pMult * 0.88)), tickMs * 0.5);
          }
        } else if (archetype === 1) {
          // Archetype 1: Syncopated Breakbeat / Amen-style snare & kick pocket bridge
          if (i % 2 === 0) {
            playKick(0.95 + progress * 0.25);
            if (randFloat() < 0.55) scheduleSubTick(() => playSnare(false), tickMs * 0.5);
          } else {
            playSnare(progress > 0.45);
            if (randFloat() < 0.48) scheduleSubTick(() => playSnare(false), tickMs * 0.5);
          }
        } else if (archetype === 2) {
          // Archetype 2: Stuttered IDM micro-hat & rim triplet/32nd bridge
          if (randFloat() < 0.55) {
            playHiHat(true);
            scheduleSubTick(() => playHiHat(false), tickMs * 0.34);
            scheduleSubTick(() => playWoodblock(pMult), tickMs * 0.67);
          } else {
            playWoodblock(pMult);
            if (randFloat() < 0.5) scheduleSubTick(() => playKick(0.95), tickMs * 0.5);
          }
        } else if (archetype === 3) {
          // Archetype 3: Linear Funk / Dub Pocket turnaround (Kick -> Ghost Snare -> Woodblock -> Hat)
          const slot = i % 4;
          if (slot === 0) playKick(1.05);
          else if (slot === 1) {
            playSnare(false);
            if (randFloat() < 0.5) scheduleSubTick(() => playWoodblock(pMult), tickMs * 0.5);
          } else if (slot === 2) playWoodblock(pMult);
          else {
            playHiHat(true);
            scheduleSubTick(() => playSnare(true), tickMs * 0.5);
          }
        } else {
          // Archetype 4: Crescendo Snare & Tom Roll building into the next beat
          const hard = progress > 0.5;
          playSnare(hard);
          if (randFloat() < 0.65) {
            scheduleSubTick(() => playSnare(false), tickMs * 0.5);
          }
          if (i % 2 === 1) playWoodblock(pMult);
        }
      });
    }
  }
  return steps;
}

function triggerDrumFill(manual = true, nextStyleAfterFill = null, forcedTickCount = null) {
  if (!audioCtx) initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (drumVol <= 0.01 || !isChannelAudible("drum")) return;

  const btn = document.getElementById("btnDrumFill");
  const ts = TIME_SIGNATURES[currentTimeSig] || TIME_SIGNATURES["7/4"];
  const tpb = ts.ticksPerBeat || 4;
  const tickMs = (60000 / Math.max(45, bpm)) / 4;

  // Clear any prior pending sub-tick timers so rapid clicks never stack over each other
  clearPreviewFillTimers();

  const styleForFill = nextStyleAfterFill || drumStyle;

  if (isPlaying) {
    if (nextStyleAfterFill) {
      pendingDrumStyleAfterFill = nextStyleAfterFill;
    }
    // Quantize fill length to land squarely on a beat or bar boundary so the groove
    // resumes in perfect phase right when the fill finishes.
    const remInBeat = tpb - (measureTick % tpb);
    let fillTicks = forcedTickCount;
    if (!fillTicks) {
      fillTicks = (remInBeat < 3) ? (remInBeat + tpb) : (randFloat() < 0.55 ? remInBeat : remInBeat + tpb);
    }
    fillTicks = Math.max(3, Math.min(12, fillTicks));

    activeFillQueue = buildDrumFillStepQueue(fillTicks, styleForFill);
    isDrumFillActive = true;
    if (btn) btn.classList.add("filling");

    // If the user manually clicked FILL partway between two clock ticks, fire an immediate
    // pickup step right on the press so the button feels responsive while activeFillQueue
    // replaces the underlying drum groove on the remaining clock ticks.
    const sinceLastTick = performance.now() - lastClockTickTime;
    if (manual && sinceLastTick > tickMs * 0.22 && sinceLastTick < tickMs * 0.82 && activeFillQueue.length > 1) {
      const pickupStep = activeFillQueue.shift();
      if (pickupStep) pickupStep(tickMs);
    }
  } else {
    // Transport is paused: play a clean, tempo-locked 1-bar preview fill at current BPM
    const previewTicks = Math.max(4, Math.min(8, tpb * 2));
    const previewSteps = buildDrumFillStepQueue(previewTicks, styleForFill);
    isDrumFillActive = true;
    if (btn) btn.classList.add("filling");

    previewSteps.forEach((stepFn, idx) => {
      scheduleSubTick(() => stepFn(tickMs), idx * tickMs);
    });
    const totalPreviewMs = previewTicks * tickMs + 80;
    scheduleSubTick(() => {
      isDrumFillActive = false;
      if (btn) btn.classList.remove("filling");
    }, totalPreviewMs);
  }
}

function onDrumStyleChange() {
  const prevStyle = drumStyle;
  const selEl = document.getElementById("selDrumStyle");
  const nextStyle = selEl ? selEl.value : drumStyle;

  if (isPlaying && prevStyle !== nextStyle && nextStyle !== "MUTED" && prevStyle !== "MUTED") {
    // Bridge from the old groove into the new groove with a clock-locked connecting fill,
    // then hand off to nextStyle on the beat boundary when the fill finishes.
    updateAudioParams();
    triggerDrumFill(false, nextStyle);
  } else {
    activeFillQueue = [];
    pendingDrumStyleAfterFill = null;
    updateAudioParams();
  }
}
