// =====================================================================
// SLAMBIENT COPRIME CLOCK & GENERATIVE SEQUENCER ENGINE
// Time Signatures, Coprime Step Cycles & Polyphonic Tick Dispatcher
// =====================================================================


let clockInterval = null;

function updateTimeSignature() {
  currentTimeSig = document.getElementById("selTimeSig").value;
  measureTick = 0; barCount = 0;
  taanNotesLeft = 0; taanRestTicks = 0;
  const ts = TIME_SIGNATURES[currentTimeSig] || TIME_SIGNATURES["7/4"];
  document.getElementById("hudMeter").textContent = `${currentTimeSig} [1/${ts.beats}]`;
  if (typeof updateWorkletClockTimeSig === "function") updateWorkletClockTimeSig();
  if (typeof updateMediaSessionMetadata === "function") updateMediaSessionMetadata();
}

function cycleTimeSignature() {
  const keys = Object.keys(TIME_SIGNATURES);
  const idx = (keys.indexOf(currentTimeSig) + 1) % keys.length;
  currentTimeSig = keys[idx];
  document.getElementById("selTimeSig").value = currentTimeSig;
  updateTimeSignature();
}

function clockTick() {
  const now = performance.now();
  const ts = TIME_SIGNATURES[currentTimeSig] || TIME_SIGNATURES["7/4"];
  const tpb = ts.ticksPerBeat || 4;
  const tickPeriodMs = (60000 / Math.max(30, bpm)) / tpb;
  // Refractory debounce guard: drops duplicate/overlapping ticks if called faster than 55% of the tempo period
  if (lastClockTickTime && (now - lastClockTickTime) < tickPeriodMs * 0.55) {
    return;
  }
  lastClockTickTime = now;
  // Update binaural spatial drift in background tabs when requestAnimationFrame is throttled/paused
  if (document.hidden && typeof updateSpatialDrift === "function") {
    updateSpatialDrift(now);
  }
  tickCount++;
  const totalMeasureTicks = ts.beats * tpb;
  measureTick = (measureTick + 1) % totalMeasureTicks;
  if (measureTick === 0) barCount++;

  const currentBeat = Math.floor(measureTick / tpb) + 1;
  document.getElementById("hudMeter").textContent = `${currentTimeSig} [${currentBeat}/${ts.beats}]`;
  if (document.getElementById("telemMeter")) {
    document.getElementById("telemMeter").textContent = `${currentTimeSig} [Beat ${currentBeat} of ${ts.beats}]`;
  }

  stepEuclid = (stepEuclid + 1) % 7;
  stepShim   = (stepShim + 1) % 11;
  stepLead   = (stepLead + 1) % 13;
  stepDrone  = (stepDrone + 1) % 17;

  const isDownbeat = (measureTick === 0);
  const tickMs = (60000 / Math.max(45, bpm)) / 4;

  // Automatic turnaround connecting fill on the final beat of a 2-bar phrase when Drum Evolve is active:
  // bridges from the old rhythm into a new groove right on the upcoming downbeat (measureTick === 0).
  if (drumStyle !== "MUTED" && activeFillQueue.length === 0 && autoEvolveDrumGroove && barCount > 0 && barCount % 2 === 1 && measureTick === totalMeasureTicks - tpb) {
    if (randFloat() < autoEvolveDrumChance) {
      const nextStyle = pickDifferentFrom(AUTO_EVOLVE_DRUM_STYLES, drumStyle);
      triggerDrumFill(false, nextStyle, tpb);
    } else if (barCount % 8 === 7 && randFloat() < 0.45) {
      triggerDrumFill(false, null, tpb);
    }
  }

  // If a drum fill is active, play the next clock-locked fill step INSTEAD of the underlying drum groove
  if (activeFillQueue.length > 0) {
    const fillStep = activeFillQueue.shift();
    if (fillStep && typeof fillStep === "function") {
      fillStep(tickMs);
    }
    if (activeFillQueue.length === 0) {
      isDrumFillActive = false;
      const btn = document.getElementById("btnDrumFill");
      if (btn) btn.classList.remove("filling");
      if (pendingDrumStyleAfterFill) {
        drumStyle = pendingDrumStyleAfterFill;
        pendingDrumStyleAfterFill = null;
        const selDrum = document.getElementById("selDrumStyle");
        if (selDrum) selDrum.value = drumStyle;
      }
    }
  } else if (drumStyle !== "MUTED") {
    if (drumStyle === "INDUSTRIAL_DRIVE") {
      if (isDownbeat || (currentTimeSig === "7/4" && measureTick === 12) || (currentTimeSig === "4/4" && measureTick === 8)) playKick(1.35);
      if (measureTick === 4 || measureTick === 16 || (currentTimeSig === "4/4" && measureTick === 12)) playSnare(true);
      if (measureTick % 2 === 0) playHiHat(measureTick % 4 === 0);
      if (measureTick % 4 === 2) playWoodblock(0.9);
    } else if (drumStyle === "BREAKBEAT_POCKET") {
      if (isDownbeat || measureTick === 6 || (currentTimeSig === "7/4" && measureTick === 18)) playKick(1.25);
      if (measureTick === 8 || measureTick === 20 || (currentTimeSig === "4/4" && measureTick === 12)) playSnare(true);
      if (measureTick === 7 || measureTick === 19) playSnare(false);
      if (measureTick % 2 === 0) playHiHat(measureTick % 4 === 2);
    } else if (drumStyle === "FOUR_ON_FLOOR") {
      if (measureTick % ts.ticksPerBeat === 0) playKick(1.3);
      if (measureTick % ts.ticksPerBeat === 2) playHiHat(true);
      if (measureTick % (ts.ticksPerBeat * 2) === ts.ticksPerBeat) playSnare(true);
    } else if (drumStyle === "ORGANIC") {
      if (isDownbeat) playKick(1.1);
      if (stepEuclid === 0 || stepEuclid === 4) playKick(1.0);
      if (stepEuclid === 2 || stepEuclid === 5) playWoodblock(1.15);
      if (stepEuclid === 3 && randFloat() < 0.75) playSnare(false);
      if (randFloat() < (0.45 + drumDensity * 0.45)) playHiHat(stepEuclid % 2 === 0);
    } else if (drumStyle === "HEARTBEAT") {
      if (isDownbeat || stepEuclid === 0) playKick(1.2);
      if (stepEuclid === 1 && randFloat() < 0.6) playKick(1.0);
      if (stepEuclid === 4) playSnare(false);
      if (stepEuclid === 2 || stepEuclid === 5) playWoodblock(0.95);
      playHiHat(false);
    } else if (drumStyle === "DUB_TAPE") {
      if (isDownbeat || (stepEuclid * 3) % 7 < 3) playKick(1.15);
      if (stepEuclid === 3 || stepEuclid === 6) playWoodblock(1.2);
      if (stepEuclid === 5) playSnare(true);
      playHiHat(stepEuclid % 2 === 0);
    } else if (drumStyle === "MINIMAL_CLICK") {
      if (isDownbeat) playKick(1.0);
      if (stepEuclid === 2 || stepEuclid === 4) playWoodblock(1.35);
      if (randFloat() < 0.8) playHiHat(true);
    } else if (drumStyle === "TABLA_GROOVE") {
      playTablaGroove(measureTick, isDownbeat, ts);
    }
  }

  // Phase 10: Pocket Field Recorder voices (ghost phrases / scale choir / ghost hits)
  if (typeof fieldRecorderTick === "function") fieldRecorderTick(measureTick, isDownbeat, ts);

  // Phase 4: Environmental & Noise Instrument Clock Triggers
  if (noiseMode !== "OFF" && isChannelAudible("noise") && noiseVol > 0.01) {
    let trigProb = 0;
    if (noiseMode === "RHYTHMIC") {
      trigProb = (measureTick % 2 === 0) ? (0.35 + noiseRateVal * 0.55) : (0.12 * noiseRateVal);
    } else if (noiseMode === "GUSTS") {
      trigProb = 0.14 + noiseRateVal * 0.42;
    } else if (noiseMode === "SPARSE") {
      trigProb = 0.06 + noiseRateVal * 0.22;
    } else if (noiseMode === "STORM_SWELL") {
      trigProb = isDownbeat ? (0.55 + noiseRateVal * 0.40) : (0.12 + noiseRateVal * 0.28);
    } else if (noiseMode === "CONTINUOUS") {
      trigProb = 0.10 + noiseRateVal * 0.30;
    }
    if (randFloat() < trigProb) {
      triggerNoiseEvent(0.70 + randFloat() * 0.45);
    }
  }

  if (isDownbeat) {
    if (isManualChordActive) {
      const barsElapsed = barCount - manualInputBar;
      if (barsElapsed >= 1 && heldMidiNotes.size === 0) {
        isManualChordActive = false;
        liveActiveChord = null;
        customArpPool = null;
        lastChordWheelSignature = "";
        const badge = document.getElementById("hudTakeover");
        if (badge) {
          badge.textContent = "AUTO";
          badge.classList.remove("active");
        }
      }
    }
  }

  if (isDownbeat && barCount % 2 === 0) {
    if (!isManualChordActive) {
      // Sitar/raga performances stay on one tonic throughout -- only the
      // ornamentation (meend, phrasing) moves, never the root chord -- so
      // skip the auto root/voicing drift entirely for this timbre.
      const rootIsLocked = (chordTimbre === "SITAR_STRINGS");
      if (!rootIsLocked && randFloat() < (0.25 + mutationVal * 0.65)) {
        const scale = SCALES[activeScaleKey];
        currentChordStepIdx = pickNextChordStepIdx(currentChordStepIdx);
        currentChordRootStep = CHORD_STEP_POOL[currentChordStepIdx];
        currentChordDeg = degreeToSemitone(currentChordRootStep, scale);
        if (chordVoicingMode === "AUTO") {
          currentChordVoicing = pickNextVoicingIdx(currentChordVoicing, activeScaleKey);
        } else {
          currentChordVoicing = chordVoicingMode;
        }
        updateDronePitches();
        maybeAutoEvolve();
      }
      triggerCurrentChord();
    }
  }

  if (stepLead === 0) {
    const scale = SCALES[activeScaleKey];
    const r = randRange(0, 100);
    if (r < 55) leadScaleDeg += (xorshift32() & 1) ? 1 : -1;
    else if (r < 80) leadScaleDeg += (xorshift32() & 1) ? 2 : -2;
    else leadScaleDeg = 0;

    leadScaleDeg = Math.max(-6, Math.min(10, leadScaleDeg));
    const octaveShift = Math.floor(leadScaleDeg / scale.length);
    const scaleIdx = ((leadScaleDeg % scale.length) + scale.length) % scale.length;
    let leadMidi = 48 + rootNote + currentChordDeg + scale[scaleIdx] + (octaveShift * 12);
    while (leadMidi > 81) leadMidi -= 12; // Allow soaring lead melodies up to A5 (MIDI 81)
    while (leadMidi < 43) leadMidi += 12; // Allow deep cello counterpoint down to G2 (MIDI 43)

    if (randFloat() < (0.48 + weatherVal * 0.28)) {
      playSynthVoice(leadMidi, 2.2 + weatherVal * 1.5, 62 + randRange(0, 14), true, 0, "CHORD");
    }
  }

  if (keyboardRoute === "ARP" && heldMidiNotes.size > 0) {
    triggerLiveArpStep();
  } else if (arpPattern !== "OFF") {
    const pool = getArpNotesPool();
    if (pool.length > 0) {
      let shouldTrigger = false;
      let targetMidi = pool[0];
      let taanVel = 0;

      if (arpPattern === "SHIMMER") {
        if (randFloat() < (0.42 + weatherVal * 0.45)) {
          shouldTrigger = true;
          targetMidi = pool[randRange(0, pool.length - 1)];
        }
      } else if (arpPattern === "UP") {
        shouldTrigger = true;
        arpStepCounter = (arpStepCounter + 1) % pool.length;
        targetMidi = pool[arpStepCounter];
      } else if (arpPattern === "PENDULUM") {
        shouldTrigger = true;
        arpStepCounter += arpDirection;
        if (arpStepCounter >= pool.length - 1) { arpDirection = -1; arpStepCounter = pool.length - 1; }
        else if (arpStepCounter <= 0) { arpDirection = 1; arpStepCounter = 0; }
        targetMidi = pool[arpStepCounter];
      } else if (arpPattern === "RAGA_TAAN") {
        // Authentic taan phrasing: a fluid 3-5 note run (one note per tick) that
        // starts on a tala division, followed by 1-2 beats of breathing silence (Ma).
        // Rupak (7/4) phrases start on its 3 + 2 + 2 vibhag boundaries.
        const tpb = ts.ticksPerBeat || 4;
        const subTick = measureTick % tpb;
        const beatIdx = Math.floor(measureTick / tpb);
        const starts = (currentTimeSig === "7/4") ? [0, 3, 5] : [0, Math.floor(ts.beats / 2)];
        let emit = false;
        if (taanRestTicks > 0) {
          taanRestTicks--;
        } else if (taanNotesLeft > 0) {
          emit = true;
        } else if (subTick === 0 && starts.indexOf(beatIdx) !== -1 && randFloat() < 0.62) {
          taanNotesLeft = randRange(3, 5);
          taanNoteIdx = 0;
          taanDir = (randFloat() < 0.5) ? 1 : -1;
          emit = true;
        }
        if (emit) {
          shouldTrigger = true;
          arpStepCounter = Math.min(Math.max(0, arpStepCounter), pool.length - 1);
          const stepAmt = (randFloat() < 0.8) ? 1 : 2;
          let nxt = arpStepCounter + taanDir * stepAmt;
          if (nxt >= pool.length) { taanDir = -1; nxt = Math.max(0, pool.length - 2); }
          else if (nxt < 0) { taanDir = 1; nxt = Math.min(pool.length - 1, 1); }
          arpStepCounter = nxt;
          targetMidi = pool[arpStepCounter];
          taanVel = 72 + taanNoteIdx * 6 + randRange(0, 8);
          taanNoteIdx++;
          taanNotesLeft--;
          if (taanNotesLeft === 0) taanRestTicks = tpb * randRange(1, 2);
        }
      } else if (arpPattern === "CHORD_BURST") {
        if (stepShim === 0) {
          for (let b = 0; b < Math.min(4, pool.length); b++) {
            const burstMidi = pool[(arpStepCounter + b) % pool.length];
            if (randFloat() >= arpRestProb) {
              setTimeout(() => playArpNote(burstMidi, 85 + randRange(0, 15)), b * 75);
            }
          }
          arpStepCounter = (arpStepCounter + 1) % pool.length;
        }
      }

      // Taan phrases keep their notes fluid: the random rest dice only apply to other patterns.
      if (shouldTrigger && arpPattern !== "CHORD_BURST" && (arpPattern === "RAGA_TAAN" || randFloat() >= arpRestProb)) {
        playArpNote(targetMidi, arpPattern === "RAGA_TAAN" ? taanVel : 85 + randRange(0, 20));
      }
    }
  }

  if (stepDrone === 0) {
    maybeWanderDrone();
    updateDronePitches(true);
  }

  // Authentic cyclical Tanpura plucking in classical sequence (Pa - Sa - Sa - Sa),
  // but on a slow cadence decoupled from the 1-beat metronome: one string every
  // 2 beats (8 ticks in x/4), so a full 4-string cycle spans ~8 beats. With the
  // 9.5s ring decay the strings still overlap into an unbroken, gentle golden wash.
  const tanpuraInterval = (ts.ticksPerBeat || 4) * 2;
  if (tanpuraEnabled && tickCount % tanpuraInterval === 0 && tanpuraVol > 0.01 && droneEnabled && !channelMute.drone) {
    playTanpuraPluck(tanpuraStep % 4);
    tanpuraStep++;
  }
}

