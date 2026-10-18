// =====================================================================
// SLAMBIENT PARAMETER CONTROLS & RANDOMIZER ENGINE
// Channel Audibility, Mute/Solo, BPM & Per-Module Randomizers
// =====================================================================

let lastAppliedMasterDriveVal = null;

function updateBpm(sourceEl) {
  const el = sourceEl || document.getElementById("knobBpmHeader") || document.getElementById("knobBpm");
  if (!el) return;
  const val = parseInt(el.value, 10);
  if (isNaN(val)) return;
  bpm = val;

  const knob = document.getElementById("knobBpm");
  const lbl = document.getElementById("lblBpm");
  const headerKnob = document.getElementById("knobBpmHeader");
  const headerLbl = document.getElementById("lblBpmHeader");

  if (knob && knob !== el) knob.value = bpm;
  if (headerKnob && headerKnob !== el) headerKnob.value = bpm;
  if (lbl) lbl.textContent = bpm + " BPM";
  if (headerLbl) headerLbl.textContent = bpm + " BPM";

  updateWorkletClockBpm();
  if (isPlaying) {
    if (!workletClockReady) {
      clearInterval(clockInterval);
      const ms = (60000 / bpm) / 4;
      clockInterval = setInterval(clockTick, ms);
      scheduleAudioClockFallback();
    }
    document.getElementById("footerStatus").textContent = "Engine: Running (" + bpm + " BPM)";
  } else if (liveArpTimer) {
    clearInterval(liveArpTimer);
    const ms = (60000 / bpm) / 4;
    liveArpTimer = setInterval(triggerLiveArpStep, ms);
  }
  updateMediaSessionMetadata();
  // Keep a tempo-synced delay time locked to the new tempo immediately,
  // not just the next time some other control is touched.
  if (delayTempoSyncEnabled) updateAudioParams();
}

// Shows the Tanpura-specific controls (Sruti Tuning, Drone Resonance, Javari
// Buzz) only while the Tanpura Drone toggle is on -- those knobs do nothing
// otherwise, so hiding them keeps the Sub & Drone panel at the same baseline
// length as the other modules and lets it expand only when relevant.
function updateDroneControlVisibility() {
  const extras = document.getElementById("tanpuraExtraControls");
  const chk = document.getElementById("chkTanpuraEnabled");
  if (extras && chk) extras.style.display = chk.checked ? "" : "none";
}

function updateAudioParams() {
  weatherVal = parseInt(document.getElementById("knobWeather").value) / 100;
  mutationVal = parseInt(document.getElementById("knobMutation").value) / 100;
  if (document.getElementById("chkAutoEvolveArpPattern")) {
    autoEvolveArpPattern = document.getElementById("chkAutoEvolveArpPattern").checked;
  }
  if (document.getElementById("chkAutoEvolveArpTimbre")) {
    autoEvolveArpTimbre = document.getElementById("chkAutoEvolveArpTimbre").checked;
  }
  if (document.getElementById("knobArpEvolveChance")) {
    autoEvolveArpChance = parseInt(document.getElementById("knobArpEvolveChance").value) / 100;
    document.getElementById("lblArpEvolveChance").textContent = Math.round(autoEvolveArpChance * 100) + "%";
  }
  if (document.getElementById("chkAutoEvolveDrums")) {
    autoEvolveDrumGroove = document.getElementById("chkAutoEvolveDrums").checked;
  }
  if (document.getElementById("knobDrumEvolveChance")) {
    autoEvolveDrumChance = parseInt(document.getElementById("knobDrumEvolveChance").value) / 100;
    document.getElementById("lblDrumEvolveChance").textContent = Math.round(autoEvolveDrumChance * 100) + "%";
  }
  drumVol = parseInt(document.getElementById("knobDrumVol").value) / 100;
  drumPunch = parseInt(document.getElementById("knobDrumPunch").value) / 100;
  drumDensity = parseInt(document.getElementById("knobDrumDensity").value) / 100;
  drumStyle = document.getElementById("selDrumStyle").value;
  if (document.getElementById("selDrumKit")) {
    drumKit = document.getElementById("selDrumKit").value;
  }
  strumMs = parseInt(document.getElementById("knobStrum").value);
  droneVol = parseInt(document.getElementById("knobDrone").value) / 100;

  if (document.getElementById("selChordTimbre")) chordTimbre = document.getElementById("selChordTimbre").value;
  if (document.getElementById("selChordVoicing")) chordVoicingMode = document.getElementById("selChordVoicing").value;

  // 5. Atmosphere & Noise Instrument Parameters
  if (document.getElementById("selNoiseProfile")) noiseProfile = document.getElementById("selNoiseProfile").value;
  if (document.getElementById("selNoiseMode")) noiseMode = document.getElementById("selNoiseMode").value;
  if (document.getElementById("chkAutoEvolveNoise")) autoEvolveNoise = document.getElementById("chkAutoEvolveNoise").checked;
  if (document.getElementById("knobNoiseColor")) {
    noiseColorVal = parseInt(document.getElementById("knobNoiseColor").value) / 100;
    document.getElementById("lblNoiseColor").textContent = Math.round(noiseColorVal * 100) + "%";
  }
  if (document.getElementById("knobNoiseRate")) {
    noiseRateVal = parseInt(document.getElementById("knobNoiseRate").value) / 100;
    document.getElementById("lblNoiseRate").textContent = Math.round(noiseRateVal * 100) + "%";
  }
  if (document.getElementById("knobNoiseDrift")) {
    noiseDriftVal = parseInt(document.getElementById("knobNoiseDrift").value) / 100;
    document.getElementById("lblNoiseDrift").textContent = Math.round(noiseDriftVal * 100) + "%";
  }
  if (document.getElementById("knobNoiseFx")) {
    noiseFxSend = parseInt(document.getElementById("knobNoiseFx").value) / 100;
    document.getElementById("lblNoiseFx").textContent = Math.round(noiseFxSend * 100) + "%";
  }
  if (document.getElementById("knobNoiseVol")) {
    noiseVol = parseInt(document.getElementById("knobNoiseVol").value) / 100;
    document.getElementById("lblNoiseVol").textContent = Math.round(noiseVol * 100) + "%";
  }
  if (document.getElementById("knobFieldFx")) {
    fieldFxSend = parseInt(document.getElementById("knobFieldFx").value) / 100;
    const lbl = document.getElementById("lblFieldFx");
    if (lbl) lbl.textContent = Math.round(fieldFxSend * 100) + "%";
  }

  if (document.getElementById("knobDroneFx")) {
    droneFxSend = parseInt(document.getElementById("knobDroneFx").value) / 100;
    document.getElementById("lblDroneFx").textContent = Math.round(droneFxSend * 100) + "%";
  }
  if (document.getElementById("knobDrumFx")) {
    drumFxSend = parseInt(document.getElementById("knobDrumFx").value) / 100;
    document.getElementById("lblDrumFx").textContent = Math.round(drumFxSend * 100) + "%";
  }
  if (document.getElementById("knobChordFx")) {
    chordFxSend = parseInt(document.getElementById("knobChordFx").value) / 100;
    document.getElementById("lblChordFx").textContent = Math.round(chordFxSend * 100) + "%";
  }
  if (document.getElementById("knobChordVol")) {
    chordVol = parseInt(document.getElementById("knobChordVol").value) / 100;
    document.getElementById("lblChordVol").textContent = Math.round(chordVol * 100) + "%";
  }
  if (document.getElementById("knobChordSustain")) {
    chordSustainMult = parseInt(document.getElementById("knobChordSustain").value) / 100;
    document.getElementById("lblChordSustain").textContent = Math.round(chordSustainMult * 100) + "%";
  }
  if (document.getElementById("knobChordDynamics")) {
    chordDynamicsMult = parseInt(document.getElementById("knobChordDynamics").value) / 100;
    document.getElementById("lblChordDynamics").textContent = Math.round(chordDynamicsMult * 100) + "%";
  }
  if (document.getElementById("knobArpFx")) {
    arpFxSend = parseInt(document.getElementById("knobArpFx").value) / 100;
    document.getElementById("lblArpFx").textContent = Math.round(arpFxSend * 100) + "%";
  }

  if (document.getElementById("chkTanpuraEnabled")) {
    tanpuraEnabled = document.getElementById("chkTanpuraEnabled").checked;
  }
  updateDroneControlVisibility();
  if (document.getElementById("knobTanpura")) {
    tanpuraVol = parseInt(document.getElementById("knobTanpura").value) / 100;
    document.getElementById("lblTanpura").textContent = Math.round(tanpuraVol * 100) + "%";
  }
  if (document.getElementById("knobJavari")) {
    javariVal = parseInt(document.getElementById("knobJavari").value) / 100;
    document.getElementById("lblJavari").textContent = Math.round(javariVal * 100) + "%";
  }
  if (document.getElementById("selTanpuraTuning")) {
    tanpuraTuning = document.getElementById("selTanpuraTuning").value;
  }

  if (document.getElementById("knobDroneFilter")) {
    droneFilterHz = parseInt(document.getElementById("knobDroneFilter").value);
    document.getElementById("lblDroneFilter").textContent = droneFilterHz + " Hz";
  }
  if (document.getElementById("knobDroneDetune")) {
    droneDetuneCents = parseFloat(document.getElementById("knobDroneDetune").value);
    document.getElementById("lblDroneDetune").textContent = droneDetuneCents + " cents";
  }
  if (document.getElementById("knobDroneWander")) {
    droneWanderVal = parseInt(document.getElementById("knobDroneWander").value) / 100;
    document.getElementById("lblDroneWander").textContent = Math.round(droneWanderVal * 100) + "%";
  }
  if (document.getElementById("selDroneOctave")) {
    droneOctaveChoice = document.getElementById("selDroneOctave").value;
    updateDronePitches();
  }
  if (document.getElementById("selDroneTimbre")) {
    droneTimbre = document.getElementById("selDroneTimbre").value;
    const isDidgeridoo = (droneTimbre === "DIDGERIDOO");
    if (audioCtx && droneFormantGain) {
      const formantTarget = isDidgeridoo ? 0.85 : 0;
      droneFormantGain.gain.setTargetAtTime(formantTarget, audioCtx.currentTime, 0.3);
    }
    if (audioCtx && droneBreathLFOGain) {
      const breathDepth = isDidgeridoo ? 0.85 * 0.25 : 0;
      droneBreathLFOGain.gain.setTargetAtTime(breathDepth, audioCtx.currentTime, 0.3);
    }
  }

  arpPattern = document.getElementById("selArpPattern").value;
  arpTimbre = document.getElementById("selArpTimbre").value;
  arpGateMs = parseInt(document.getElementById("knobArpGate").value);
  arpVol = parseInt(document.getElementById("knobArpVol").value) / 100;
  if (document.getElementById("knobArpRest")) {
    arpRestProb = parseInt(document.getElementById("knobArpRest").value) / 100;
    document.getElementById("lblArpRest").textContent = Math.round(arpRestProb * 100) + "%";
  }
  if (document.getElementById("knobArpOctaves")) {
    arpOctaves = parseInt(document.getElementById("knobArpOctaves").value);
    document.getElementById("lblArpOctaves").textContent = arpOctaves + " oct";
  }

  if (document.getElementById("knobMasterCutoff")) {
    masterBaseCutoff = Math.round(hzFromCutoffPos(parseFloat(document.getElementById("knobMasterCutoff").value)));
    document.getElementById("lblMasterCutoff").textContent = masterBaseCutoff + " Hz";
  }
  if (document.getElementById("knobMasterRes")) {
    masterResonance = parseFloat(document.getElementById("knobMasterRes").value);
    document.getElementById("lblMasterRes").textContent = masterResonance.toFixed(1);
  }
  if (document.getElementById("knobFilterAttack")) {
    filterAttackMs = parseInt(document.getElementById("knobFilterAttack").value);
    filterDecayMs = parseInt(document.getElementById("knobFilterDecay").value);
    document.getElementById("lblFilterEnvTimes").textContent = filterAttackMs + " ms / " + filterDecayMs + " ms";
  }
  if (document.getElementById("knobFilterEnvDepth")) {
    filterEnvDepth = parseInt(document.getElementById("knobFilterEnvDepth").value) / 100;
    document.getElementById("lblFilterEnvDepth").textContent = Math.round(filterEnvDepth * 100) + "%";
  }
  if (document.getElementById("knobFilterLfoRate")) {
    filterLfoRateHz = parseFloat(document.getElementById("knobFilterLfoRate").value);
  }
  if (document.getElementById("knobFilterLfoDepth")) {
    filterLfoDepth = parseInt(document.getElementById("knobFilterLfoDepth").value) / 100;
  }
  if (document.getElementById("lblFilterLfoValues")) {
    document.getElementById("lblFilterLfoValues").textContent = filterLfoRateHz.toFixed(2) + " Hz / " + Math.round(filterLfoDepth * 100) + "%";
  }

  const knobDelayTimeEl = document.getElementById("knobDelayTime");
  const chkDelaySyncEl = document.getElementById("chkDelayTempoSync");
  const selDelayDivEl = document.getElementById("selDelayNoteDivision");
  if (chkDelaySyncEl) delayTempoSyncEnabled = chkDelaySyncEl.checked;
  if (selDelayDivEl) delayNoteDivisionMult = parseFloat(selDelayDivEl.value);
  if (selDelayDivEl) selDelayDivEl.disabled = !delayTempoSyncEnabled;

  if (knobDelayTimeEl) {
    if (delayTempoSyncEnabled) {
      delayTimeSec = computeSyncedDelaySec();
      knobDelayTimeEl.value = Math.round(delayTimeSec * 1000);
      knobDelayTimeEl.disabled = true;
      const divName = selDelayDivEl ? selDelayDivEl.options[selDelayDivEl.selectedIndex].text : "";
      document.getElementById("lblDelayTime").textContent = Math.round(delayTimeSec * 1000) + " ms (" + divName + ")";
    } else {
      knobDelayTimeEl.disabled = false;
      delayTimeSec = parseInt(knobDelayTimeEl.value) / 1000;
      document.getElementById("lblDelayTime").textContent = Math.round(delayTimeSec * 1000) + " ms";
    }
  }
  if (document.getElementById("knobDelayFeedback")) {
    const rawFb = parseInt(document.getElementById("knobDelayFeedback").value);
    const clampedFb = Math.min(48, Math.max(0, rawFb));
    delayFeedbackVal = clampedFb / 100;
    document.getElementById("lblDelayFeedback").textContent = clampedFb + "%";
  }
  if (document.getElementById("knobDelayTone")) {
    delayToneHz = parseInt(document.getElementById("knobDelayTone").value);
    document.getElementById("lblDelayTone").textContent = delayToneHz + " Hz";
  }
  if (document.getElementById("knobDelayFlutter")) {
    delayFlutterVal = parseInt(document.getElementById("knobDelayFlutter").value);
    delayMixVal = parseInt(document.getElementById("knobDelayMix").value) / 100;
    document.getElementById("lblDelayMix").textContent = delayFlutterVal + "% flt / " + Math.round(delayMixVal * 100) + "% mix";
  }

  if (document.getElementById("selReverbMode")) {
    reverbMode = document.getElementById("selReverbMode").value;
    applyReverbMode(reverbMode);
  }
  if (document.getElementById("knobReverbMix")) {
    reverbMixVal = parseInt(document.getElementById("knobReverbMix").value) / 100;
  }
  if (document.getElementById("knobReverbTone")) {
    reverbToneHz = parseInt(document.getElementById("knobReverbTone").value);
  }
  if (document.getElementById("lblReverbMix")) {
    document.getElementById("lblReverbMix").textContent = Math.round(reverbMixVal * 100) + "% / " + reverbToneHz + " Hz";
  }
  if (document.getElementById("selChorusMode")) {
    chorusMode = document.getElementById("selChorusMode").value;
  }
  if (document.getElementById("knobChorusRate")) {
    chorusRateHz = parseFloat(document.getElementById("knobChorusRate").value);
    document.getElementById("lblChorusRate").textContent = chorusRateHz.toFixed(2) + " Hz";
  }
  if (document.getElementById("knobChorusDepth")) {
    chorusDepthVal = parseInt(document.getElementById("knobChorusDepth").value) / 100;
    chorusMixVal = parseInt(document.getElementById("knobChorusMix").value) / 100;
    document.getElementById("lblChorusDepth").textContent = Math.round(chorusDepthVal * 100) + "% / " + Math.round(chorusMixVal * 100) + "%";
  }
  applyChorusModeParams();

  document.getElementById("lblWeather").textContent = Math.round(weatherVal * 100) + "%";
  document.getElementById("lblMutation").textContent = Math.round(mutationVal * 100) + "%";
  document.getElementById("lblDrumVol").textContent = Math.round(drumVol * 100) + "%";
  document.getElementById("lblDrumPunch").textContent = Math.round(drumPunch * 100) + "%";
  document.getElementById("lblDrumDensity").textContent = Math.round(drumDensity * 100) + "%";
  document.getElementById("lblStrum").textContent = strumMs + " ms";
  document.getElementById("lblDrone").textContent = Math.round(droneVol * 100) + "%";
  document.getElementById("lblArpGate").textContent = arpGateMs + " ms";
  document.getElementById("lblArpVol").textContent = Math.round(arpVol * 100) + "%";

  // Read Master EQ & Tape Saturation UI values before checking audioCtx so
  // moving these sliders while stopped still updates their DOM readout labels.
  if (document.getElementById("knobEqLow")) {
    masterEqLowVal = parseFloat(document.getElementById("knobEqLow").value);
    document.getElementById("lblEqLow").textContent = (masterEqLowVal > 0 ? "+" : "") + masterEqLowVal.toFixed(1) + " dB";
  }
  if (document.getElementById("knobEqMid")) {
    masterEqMidVal = parseFloat(document.getElementById("knobEqMid").value);
    document.getElementById("lblEqMid").textContent = (masterEqMidVal > 0 ? "+" : "") + masterEqMidVal.toFixed(1) + " dB";
  }
  if (document.getElementById("knobEqHigh")) {
    masterEqHighVal = parseFloat(document.getElementById("knobEqHigh").value);
    document.getElementById("lblEqHigh").textContent = (masterEqHighVal > 0 ? "+" : "") + masterEqHighVal.toFixed(1) + " dB";
  }
  if (document.getElementById("knobMasterDrive")) {
    masterDriveVal = parseFloat(document.getElementById("knobMasterDrive").value);
    document.getElementById("lblMasterDrive").textContent = Math.round(masterDriveVal) + "%";
  }
  if (typeof syncAllSmartDropdowns === 'function') {
    syncAllSmartDropdowns();
  }
  if (typeof renderMobileMacroGrid === 'function') {
    renderMobileMacroGrid();
  }

  if (!audioCtx) return;

  if (drumBusGain) drumBusGain.gain.setTargetAtTime(isChannelAudible('drum') ? drumVol * 0.78 : 0, audioCtx.currentTime, 0.05);
  if (arpBusGain) arpBusGain.gain.setTargetAtTime(isChannelAudible('arp') ? arpVol * 0.90 : 0, audioCtx.currentTime, 0.05);
  if (chordBusGain) chordBusGain.gain.setTargetAtTime(isChannelAudible('chord') ? chordVol : 0, audioCtx.currentTime, 0.05);
  if (noiseBusGain) noiseBusGain.gain.setTargetAtTime(isChannelAudible('noise') ? noiseVol * 0.85 : 0, audioCtx.currentTime, 0.05);
  if (typeof fieldRecorderSync === "function") fieldRecorderSync();
  if (droneFilter) droneFilter.frequency.setTargetAtTime(droneFilterHz, audioCtx.currentTime, 0.08);
  if (droneOsc1) droneOsc1.detune.setTargetAtTime(-droneDetuneCents, audioCtx.currentTime, 0.08);
  if (droneOsc2) droneOsc2.detune.setTargetAtTime(+droneDetuneCents, audioCtx.currentTime, 0.08);

  if (droneGain) {
    const targetDrone = (isPlaying && isChannelAudible('drone')) ? droneVol * 0.16 : 0.0001;
    droneGain.gain.cancelScheduledValues(audioCtx.currentTime);
    droneGain.gain.setValueAtTime(droneGain.gain.value, audioCtx.currentTime);
    droneGain.gain.linearRampToValueAtTime(targetDrone, audioCtx.currentTime + 0.035);
  }
  if (tanpuraBusGain) {
    const targetTanpura = (isPlaying && isChannelAudible('drone') && tanpuraEnabled) ? tanpuraVol * 0.95 : 0.0001;
    tanpuraBusGain.gain.cancelScheduledValues(audioCtx.currentTime);
    tanpuraBusGain.gain.setValueAtTime(tanpuraBusGain.gain.value, audioCtx.currentTime);
    tanpuraBusGain.gain.linearRampToValueAtTime(targetTanpura, audioCtx.currentTime + 0.035);
  }
  updateNoiseEngineParams();

  // Aux routing toggles (AUX buttons in bottom-right of each instrument module)
  const effDroneFx = (channelAux.drone !== false) ? droneFxSend : 0;
  const effDrumFx  = (channelAux.drum  !== false) ? drumFxSend  : 0;
  const effChordFx = (channelAux.chord !== false) ? chordFxSend : 0;
  const effArpFx   = (channelAux.arp   !== false) ? arpFxSend   : 0;
  const effNoiseFx = (channelAux.noise !== false) ? noiseFxSend : 0;
  const effFieldFx = (channelAux.field !== false) ? fieldFxSend : 0;

  if (droneFxSendGain && droneDryGain) {
    droneFxSendGain.gain.setTargetAtTime(effDroneFx, audioCtx.currentTime, 0.05);
    droneDryGain.gain.setTargetAtTime(1.0 - (effDroneFx * 0.5), audioCtx.currentTime, 0.05);
  }
  if (drumFxSendGain && drumDryGain) {
    drumFxSendGain.gain.setTargetAtTime(effDrumFx, audioCtx.currentTime, 0.05);
    drumDryGain.gain.setTargetAtTime(1.0 - (effDrumFx * 0.5), audioCtx.currentTime, 0.05);
  }
  if (chordFxSendGain && chordDryGain) {
    chordFxSendGain.gain.setTargetAtTime(effChordFx, audioCtx.currentTime, 0.05);
    chordDryGain.gain.setTargetAtTime(1.0 - (effChordFx * 0.5), audioCtx.currentTime, 0.05);
  }
  if (arpFxSendGain && arpDryGain) {
    arpFxSendGain.gain.setTargetAtTime(effArpFx, audioCtx.currentTime, 0.05);
    arpDryGain.gain.setTargetAtTime(1.0 - (effArpFx * 0.5), audioCtx.currentTime, 0.05);
  }
  if (noiseFxSendGain && noiseDryGain) {
    noiseFxSendGain.gain.setTargetAtTime(effNoiseFx, audioCtx.currentTime, 0.05);
    noiseDryGain.gain.setTargetAtTime(1.0 - (effNoiseFx * 0.5), audioCtx.currentTime, 0.05);
  }
  if (fieldFxSendGain && fieldDryGain) {
    fieldFxSendGain.gain.setTargetAtTime(effFieldFx, audioCtx.currentTime, 0.05);
    fieldDryGain.gain.setTargetAtTime(1.0 - (effFieldFx * 0.5), audioCtx.currentTime, 0.05);
  }

  // Phase 4: Cascaded 24dB/oct Filter Fine-Tuning (respecting FILTER pedal bypass state)
  const filterBypassed = typeof pedalBypassState !== "undefined" && pedalBypassState.FILTER;
  if (masterFilter1 && masterFilter2) {
    const effCutoff = filterBypassed ? 20000 : masterBaseCutoff;
    const effRes1 = filterBypassed ? 0.5 : masterResonance;
    const effRes2 = filterBypassed ? 0.5 : Math.max(0.5, masterResonance * 0.72);
    masterFilter1.frequency.setTargetAtTime(effCutoff, audioCtx.currentTime, 0.04);
    masterFilter2.frequency.setTargetAtTime(effCutoff, audioCtx.currentTime, 0.04);
    masterFilter1.Q.setTargetAtTime(effRes1, audioCtx.currentTime, 0.04);
    masterFilter2.Q.setTargetAtTime(effRes2, audioCtx.currentTime, 0.04);
    if (masterFilterCompGain) {
      const resExcess = filterBypassed ? 0 : Math.max(0, masterResonance - 1.5);
      const compGain = 1.0 / (1.0 + resExcess * 0.058);
      masterFilterCompGain.gain.setTargetAtTime(compGain, audioCtx.currentTime, 0.05);
    }
  }
  if (filterLFO) filterLFO.frequency.setTargetAtTime(filterLfoRateHz, audioCtx.currentTime, 0.1);
  if (filterLFODepthGain) {
    const safeLfoExcursion = filterBypassed ? 0 : Math.min(masterBaseCutoff * 0.78, masterBaseCutoff * filterLfoDepth * 0.55);
    filterLFODepthGain.gain.setTargetAtTime(safeLfoExcursion, audioCtx.currentTime, 0.1);
  }

  if (analogDelayNode) {
    const curDelay = analogDelayNode.delayTime.value;
    if (Math.abs(curDelay - delayTimeSec) > 0.03) {
      analogDelayNode.delayTime.cancelScheduledValues(audioCtx.currentTime);
      analogDelayNode.delayTime.setValueAtTime(curDelay, audioCtx.currentTime);
      analogDelayNode.delayTime.linearRampToValueAtTime(delayTimeSec, audioCtx.currentTime + 0.35);
    } else {
      analogDelayNode.delayTime.setTargetAtTime(delayTimeSec, audioCtx.currentTime, 0.12);
    }
  }
  if (delayFeedbackGain) delayFeedbackGain.gain.setTargetAtTime(delayLoopGain(), audioCtx.currentTime, 0.12);
  if (delayDampingFilter) delayDampingFilter.frequency.setTargetAtTime(delayToneHz, audioCtx.currentTime, 0.08);
  if (delayLFOGain) delayLFOGain.gain.setTargetAtTime(0.0035 * (delayFlutterVal / 100), audioCtx.currentTime, 0.08);
  const delayBypassed = typeof pedalBypassState !== "undefined" && pedalBypassState.DELAY;
  if (delayDryGain && delayWetGain) {
    delayDryGain.gain.setTargetAtTime(delayBypassed ? 1.0 : 1.0 - (delayMixVal * 0.45), audioCtx.currentTime, 0.08);
    delayWetGain.gain.setTargetAtTime(delayBypassed ? 0 : delayMixVal * 0.85, audioCtx.currentTime, 0.08);
  }
  const spaceBypassed = typeof pedalBypassState !== "undefined" && pedalBypassState.SPACE;
  if (reverbSend) reverbSend.gain.setTargetAtTime(spaceBypassed ? 0 : weatherVal * reverbMixVal, audioCtx.currentTime, 0.1);
  if (reverbToneFilter) reverbToneFilter.frequency.setTargetAtTime(reverbToneHz, audioCtx.currentTime, 0.08);
  if (chorusWetGain) chorusWetGain.gain.setTargetAtTime(spaceBypassed ? 0 : chorusMixVal, audioCtx.currentTime, 0.08);

  // Apply Master EQ & Tape Saturation Curve (only regenerating the 1024-sample Float32Array when drive changes)
  if (masterEqLow) masterEqLow.gain.setTargetAtTime(masterEqLowVal, audioCtx.currentTime, 0.05);
  if (masterEqMid) masterEqMid.gain.setTargetAtTime(masterEqMidVal, audioCtx.currentTime, 0.05);
  if (masterEqHigh) masterEqHigh.gain.setTargetAtTime(masterEqHighVal, audioCtx.currentTime, 0.05);
  if (masterDriveNode && lastAppliedMasterDriveVal !== masterDriveVal) {
    lastAppliedMasterDriveVal = masterDriveVal;
    masterDriveNode.curve = makeAnalogTapeCurve(masterDriveVal, 1024);
  }
}

// Sweet-spot bounds for randomizers so automatic randomization prioritizes
// warm, pleasing, balanced sound while manual slider tweaking retains the full
// extreme range for getting darker, louder, or weirder.
const RANDOM_SWEET_SPOTS = {
  knobDelayFeedback: [15, 48],
  knobMasterCutoff:  [38, 68],   // ~850 Hz to ~2300 Hz warm filter ceiling
  knobMasterRes:     [0.8, 3.2], // Musical resonance without piercing self-oscillation
  knobFilterEnvDepth:[-20, 55],
  knobFilterLfoRate: [0.03, 0.35],
  knobFilterLfoDepth:[8, 35],
  knobArpOctaves:    [1, 2],     // Avoid 3-4 octave piercing whistle register by default
  knobArpVol:        [45, 78],
  knobArpRest:       [15, 45],   // Give arps breathing room
  knobArpGate:       [180, 480],
  knobChordDynamics: [70, 105],  // Gentle, expressive strike velocity
  knobChordSustain:  [85, 160],
  knobChordVol:      [65, 85],
  knobDrumVol:       [45, 82],
  knobDrumPunch:     [30, 75],
  knobDrone:         [50, 82],
  knobDroneFilter:   [110, 220],
  knobDroneDetune:   [1.5, 5.5],
  knobNoiseColor:    [25, 72],
  knobNoiseRate:     [20, 68],
  knobNoiseDrift:    [25, 75],
  knobNoiseVol:      [18, 45],
  knobNoiseFx:       [35, 80],
  knobDelayTone:     [1200, 2600],
  knobDelayFlutter:  [12, 45],
  knobDelayMix:      [25, 50],
  knobReverbMix:     [25, 55],
  knobReverbTone:    [2800, 5600],
  knobChorusRate:    [0.15, 0.85],
  knobChorusDepth:   [15, 50],
  knobChorusMix:     [12, 38],
  knobBpm:           [56, 92],
  knobEqLow:         [-3.0, 4.0],
  knobEqMid:         [-2.5, 3.0],
  knobEqHigh:        [-3.0, 4.0],
  masterDriveVal:    [5, 30]
};

function randomizeRange(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const spot = RANDOM_SWEET_SPOTS[id];
  const min = spot ? spot[0] : parseFloat(el.min);
  const max = spot ? spot[1] : parseFloat(el.max);
  const step = parseFloat(el.step) || 1;
  const steps = Math.max(0, Math.round((max - min) / step));
  const val = min + randRange(0, steps) * step;
  el.value = Math.min(max, Math.round(val * 1000) / 1000);
}
function randomizeSelect(id) {
  const el = document.getElementById(id);
  if (!el || !el.options.length) return;
  if (id === "selChordTimbre") {
    const pleasantChords = ["WARM_PAD", "PURE_SINE_GLASS", "CHAMBER_WOODS", "CELESTIAL_ORGAN", "RHODES", "LOFI_KEYS", "VIBES_CELESTE", "GLASS_EP", "DIGITAL_STRINGS", "SITAR_STRINGS"];
    el.value = pleasantChords[randRange(0, pleasantChords.length - 1)];
    return;
  }
  if (id === "selArpTimbre") {
    const pleasantArps = ["SINE_CRYSTAL", "CONCERT_HARP", "WATER_DROPLET", "MUSIC_BOX", "KALIMBA", "PIZZICATO_STRING", "GLASS_FM", "BANSURI_FLUTE"];
    el.value = pleasantArps[randRange(0, pleasantArps.length - 1)];
    return;
  }
  if (id === "selDrumStyle") {
    const pleasantDrums = ["ORGANIC", "HEARTBEAT", "DUB_TAPE", "MINIMAL_CLICK", "TABLA_GROOVE", "FOUR_ON_FLOOR"];
    el.value = pleasantDrums[randRange(0, pleasantDrums.length - 1)];
    return;
  }
  if (id === "selNoiseMode") {
    const activeModes = ["GUSTS", "CONTINUOUS", "SPARSE", "RHYTHMIC", "STORM_SWELL"];
    el.value = activeModes[randRange(0, activeModes.length - 1)];
    return;
  }
  el.value = el.options[randRange(0, el.options.length - 1)].value;
}
function randomizeCheckbox(id) {
  const el = document.getElementById(id);
  if (el) el.checked = randFloat() < 0.5;
}

function randomizeDrone() {
  randomizeSelect("selDroneTimbre");
  randomizeSelect("selDroneOctave");
  randomizeSelect("selTanpuraTuning");
  randomizeRange("knobTanpura");
  randomizeRange("knobJavari");
  randomizeRange("knobDroneFilter");
  randomizeRange("knobDroneDetune");
  randomizeRange("knobDroneWander");
  randomizeRange("knobDrone");
  randomizeRange("knobDroneFx");
  updateAudioParams();
  updateDronePitches(true);
}

function randomizeDrums() {
  randomizeSelect("selDrumStyle");
  randomizeSelect("selDrumKit");
  randomizeCheckbox("chkAutoEvolveDrums");
  randomizeRange("knobDrumEvolveChance");
  randomizeRange("knobDrumPunch");
  randomizeRange("knobDrumDensity");
  randomizeRange("knobDrumVol");
  randomizeRange("knobDrumFx");
  updateAudioParams();
}

function randomizeChords(triggerSound = true) {
  randomizeSelect("selChordTimbre");
  randomizeSelect("selChordVoicing");
  randomizeRange("knobStrum");
  randomizeRange("knobMutation");
  randomizeRange("knobChordSustain");
  randomizeRange("knobChordDynamics");
  randomizeRange("knobChordVol");
  randomizeRange("knobChordFx");

  // Genuinely randomize the active chord voicing & progression step
  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  const selVoicingEl = document.getElementById("selChordVoicing");
  if (selVoicingEl && selVoicingEl.value !== "AUTO") {
    currentChordVoicing = selVoicingEl.value;
  } else {
    currentChordVoicing = pickNextVoicingIdx(-1, activeScaleKey);
  }
  currentChordStepIdx = randRange(0, CHORD_STEP_POOL.length - 1);
  currentChordRootStep = CHORD_STEP_POOL[currentChordStepIdx];
  currentChordDeg = degreeToSemitone(currentChordRootStep, scale);

  updateChordHud();
  updateDronePitches(true);
  updateAudioParams();
  if (isPlaying && triggerSound) {
    setTimeout(() => { if (isPlaying) triggerCurrentChord(); }, 40);
  }
}

function randomizeNoise() {
  randomizeSelect("selNoiseProfile");
  randomizeSelect("selNoiseMode");
  randomizeCheckbox("chkAutoEvolveNoise");
  randomizeRange("knobNoiseColor");
  randomizeRange("knobNoiseRate");
  randomizeRange("knobNoiseDrift");
  randomizeRange("knobNoiseVol");
  randomizeRange("knobNoiseFx");
  updateAudioParams();
  if (isPlaying && isChannelAudible("noise")) {
    triggerNoiseEvent(0.85);
  }
}

function randomizeField() {
  randomizeSelect("selFieldMode");
  randomizeRange("knobFieldVol");
  randomizeRange("knobFieldFx");
  if (typeof fieldModeChanged === "function") fieldModeChanged();
  if (typeof fieldLevelChanged === "function") fieldLevelChanged();
  updateAudioParams();
}

const PLEASANT_SCALES = ["DORIAN", "LYDIAN", "MAJOR9", "MAJ_PENTATONIC", "MIXOLYDIAN", "BILAWAL", "AEOLIAN", "PENTATONIC", "HIRAJOSHI"];

function randomizeKeyScale(triggerSound = false) {
  rootNote = randRange(0, 11);
  activeScaleKey = PLEASANT_SCALES[randRange(0, PLEASANT_SCALES.length - 1)];

  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  currentChordDeg = degreeToSemitone(currentChordRootStep, scale);

  const rootEl = document.getElementById("topRootKey");
  if (rootEl) rootEl.value = String(rootNote);
  const scaleEl = document.getElementById("topScaleMode");
  if (scaleEl) scaleEl.value = activeScaleKey;
  const hudScaleEl = document.getElementById("hudScale");
  if (hudScaleEl) hudScaleEl.textContent = `${NOTE_NAMES[rootNote]} ${activeScaleKey}`;

  buildKeyboard();
  updateChordHud();
  updateDronePitches(true);
  if (typeof updateMediaSessionMetadata === "function") updateMediaSessionMetadata();
  if (isPlaying && triggerSound) {
    setTimeout(() => { if (isPlaying) triggerCurrentChord(); }, 40);
  }
}

function randomizeArp() {
  randomizeSelect("selArpPattern");
  randomizeCheckbox("chkAutoEvolveArpPattern");
  randomizeSelect("selArpTimbre");
  randomizeCheckbox("chkAutoEvolveArpTimbre");
  randomizeRange("knobArpEvolveChance");
  randomizeRange("knobArpGate");
  randomizeRange("knobArpRest");
  randomizeRange("knobArpOctaves");
  randomizeRange("knobArpVol");
  randomizeRange("knobArpFx");
  updateAudioParams();
}

function randomizeFilter() {
  randomizeRange("knobMasterCutoff");
  randomizeRange("knobMasterRes");
  randomizeRange("knobFilterAttack");
  randomizeRange("knobFilterDecay");
  randomizeRange("knobFilterEnvDepth");
  randomizeRange("knobFilterLfoRate");
  randomizeRange("knobFilterLfoDepth");
  updateAudioParams();
}

function randomizeDelay() {
  randomizeRange("knobDelayTime");
  randomizeSelect("selDelayNoteDivision");
  randomizeRange("knobDelayFeedback");
  const fbEl = document.getElementById("knobDelayFeedback");
  if (fbEl && parseFloat(fbEl.value) > 48) fbEl.value = 48;
  randomizeRange("knobDelayTone");
  randomizeRange("knobDelayFlutter");
  randomizeRange("knobDelayMix");
  updateAudioParams();
}

function randomizeReverbChorus() {
  randomizeSelect("selReverbMode");
  randomizeRange("knobReverbMix");
  randomizeRange("knobReverbTone");
  randomizeSelect("selChorusMode");
  randomizeRange("knobChorusRate");
  randomizeRange("knobChorusDepth");
  randomizeRange("knobChorusMix");
  updateAudioParams();
}

function randomizeSpace() {
  randomizeRange("knobBpm");
  randomizeRange("knobWeather");
  if (document.getElementById("knobEqLow")) randomizeRange("knobEqLow");
  if (document.getElementById("knobEqMid")) randomizeRange("knobEqMid");
  if (document.getElementById("knobEqHigh")) randomizeRange("knobEqHigh");
  if (document.getElementById("knobMasterDrive")) randomizeRange("knobMasterDrive");
  updateBpm();
  updateAudioParams();
}

function randomizeMeter() {
  const sigKeys = Object.keys(TIME_SIGNATURES);
  document.getElementById("selTimeSig").value = sigKeys[randRange(0, sigKeys.length - 1)];
  updateTimeSignature();
}

function randomizeEverything() {
  randomizeMeter();
  randomizeKeyScale(false);

  // Fully randomize chord voicing, degree, and timbre
  randomizeSelect("selChordTimbre");
  randomizeSelect("selChordVoicing");
  randomizeRange("knobStrum");
  randomizeRange("knobMutation");
  randomizeRange("knobChordSustain");
  randomizeRange("knobChordDynamics");
  randomizeRange("knobChordVol");
  randomizeRange("knobChordFx");

  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  currentChordVoicing = pickNextVoicingIdx(-1, activeScaleKey);
  currentChordStepIdx = randRange(0, CHORD_STEP_POOL.length - 1);
  currentChordRootStep = CHORD_STEP_POOL[currentChordStepIdx];
  currentChordDeg = degreeToSemitone(currentChordRootStep, scale);

  randomizeDrone();
  randomizeDrums();
  randomizeArp();
  randomizeNoise();
  randomizeField();
  randomizeFilter();
  randomizeDelay();
  randomizeReverbChorus();
  randomizeSpace();

  // Dynamic DSP routing shuffle on full randomization across all active effects
  if (window.slambientFxRackManager && typeof window.slambientFxRackManager.randomizeChain === "function") {
    window.slambientFxRackManager.randomizeChain("SAFE");
  } else if (typeof rewireDspChain === "function") {
    const shuffledChain = ['FILTER', 'DELAY', 'SPACE'].sort(() => Math.random() - 0.5);
    rewireDspChain(shuffledChain, false);
  }

  document.querySelectorAll(".preset-bar button").forEach(b => b.classList.remove("active"));

  buildKeyboard();
  updateChordHud();
  updateDronePitches(true);
  updateAudioParams();
}

let droneEnabled = true;
let channelPower = { drone: true, drum: true, chord: true, arp: true, noise: true, field: true };
let channelAux   = { drone: true, drum: true, chord: true, arp: true, noise: true, field: true };
let channelMute  = { drone: false, drum: false, chord: false, arp: false, noise: false, field: false };
let channelSolo  = { drone: false, drum: false, chord: false, arp: false, noise: false, field: false };

function isChannelAudible(ch) {
  if (channelPower[ch] === false) return false;
  if (ch === 'drone' && !droneEnabled) return false;
  const anySolo = Object.values(channelSolo).some(v => v);
  if (anySolo) return channelSolo[ch] && !channelMute[ch];
  return !channelMute[ch];
}

function toggleChannelPower(ch) {
  channelPower[ch] = !channelPower[ch];
  if (ch === 'drone') droneEnabled = channelPower.drone;
  if (ch === 'field' && typeof fieldRecorderSync === "function") fieldRecorderSync();
  const pwrBtn = document.getElementById('btnPower_' + ch);
  if (pwrBtn) {
    pwrBtn.classList.toggle('active', channelPower[ch]);
  }
  updateAudioParams();
}

function toggleChannelAux(ch) {
  channelAux[ch] = !channelAux[ch];
  const auxBtn = document.getElementById('btnAux_' + ch);
  if (auxBtn) {
    auxBtn.classList.toggle('active', channelAux[ch]);
  }
  updateAudioParams();
}

function updateMuteSoloUI() {
  ["drone", "drum", "chord", "arp", "noise", "field"].forEach(ch => {
    const mBtn = document.getElementById("btnMute_" + ch);
    const sBtn = document.getElementById("btnSolo_" + ch);
    const pBtn = document.getElementById("btnPower_" + ch);
    const aBtn = document.getElementById("btnAux_" + ch);
    if (mBtn) mBtn.classList.toggle("active", channelMute[ch]);
    if (sBtn) sBtn.classList.toggle("active", channelSolo[ch]);
    if (pBtn) pBtn.classList.toggle("active", channelPower[ch] !== false);
    if (aBtn) aBtn.classList.toggle("active", channelAux[ch] !== false);
  });
  if (typeof renderMobileMacroGrid === "function") {
    renderMobileMacroGrid();
  }
}

function toggleMute(ch) {
  channelMute[ch] = !channelMute[ch];
  updateMuteSoloUI();
  updateAudioParams();
}

function toggleSolo(ch) {
  channelSolo[ch] = !channelSolo[ch];
  updateMuteSoloUI();
  updateAudioParams();
}

