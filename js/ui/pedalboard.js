// =====================================================================
// SLAMBIENT STUDIO FX PEDALBOARD & SIGNAL CHAIN MANAGER
// Consolidated 5-Unit & 10-Pedal Rack, Mini-Cards, Ribbon & Reordering
// =====================================================================

// Dynamic Web Audio API live node rewire manager for PEDALS & routing matrix
function rewireDspChain(newOrder, immediate = false) {
  if (newOrder && Array.isArray(newOrder) && newOrder.length > 0) {
    dspChainOrder = [...newOrder];
  }
  if (typeof updatePedalsOrderUI === 'function') updatePedalsOrderUI();
  if (window.fxRackManager) {
    window.fxRackManager.setChainOrder(dspChainOrder, immediate);
    return;
  }
  if (!audioCtx || !masterBusPre || !masterBusPost) {
    return;
  }

  const performConnect = () => {
    try {
      masterBusPre.disconnect();
      if (filterModuleOutput) filterModuleOutput.disconnect();
      if (delayModuleOutput) delayModuleOutput.disconnect();
      if (spaceModuleOutput) spaceModuleOutput.disconnect();

      const modules = {
        DRIVE_FILTER: { in: filterModuleInput, out: filterModuleOutput },
        MOD_CLUSTER:  { in: filterModuleInput, out: filterModuleOutput },
        ANALOG_DELAY: { in: delayModuleInput,  out: delayModuleOutput },
        DIGITAL_DELAY:{ in: delayModuleInput,  out: delayModuleOutput },
        SPACE_REVERB: { in: spaceModuleInput,  out: spaceModuleOutput },
        OVERDRIVE:    { in: filterModuleInput, out: filterModuleOutput },
        FILTER:       { in: filterModuleInput, out: filterModuleOutput },
        TREMOLO:      { in: filterModuleInput, out: filterModuleOutput },
        PHASER:       { in: filterModuleInput, out: filterModuleOutput },
        FLANGER:      { in: filterModuleInput, out: filterModuleOutput },
        DELAY:        { in: delayModuleInput,  out: delayModuleOutput },
        TAPE_ECHO:    { in: delayModuleInput,  out: delayModuleOutput },
        SPACE_DELAY:  { in: delayModuleInput,  out: delayModuleOutput },
        SPACE:        { in: spaceModuleInput,  out: spaceModuleOutput },
        REVERB:       { in: spaceModuleInput,  out: spaceModuleOutput }
      };

      let prevNode = masterBusPre;
      const connectedInNodes = new Set();
      for (let i = 0; i < dspChainOrder.length; i++) {
        const key = dspChainOrder[i];
        const m = modules[key];
        if (m && m.in && m.out && !connectedInNodes.has(m.in)) {
          connectedInNodes.add(m.in);
          prevNode.connect(m.in);
          prevNode = m.out;
        }
      }
      prevNode.connect(masterBusPost);

      if (!immediate && audioCtx) {
        const resumeNow = audioCtx.currentTime;
        masterBusPre.gain.cancelScheduledValues(resumeNow);
        masterBusPre.gain.setValueAtTime(0.001, resumeNow);
        masterBusPre.gain.linearRampToValueAtTime(1.0, resumeNow + 0.015);
      }
      if (typeof updatePedalsOrderUI === 'function') updatePedalsOrderUI();
    } catch (e) {
      console.error('DSP chain rewire error:', e);
    }
  };

  if (immediate) {
    performConnect();
  } else {
    const now = audioCtx.currentTime;
    masterBusPre.gain.cancelScheduledValues(now);
    masterBusPre.gain.setValueAtTime(masterBusPre.gain.value, now);
    masterBusPre.gain.linearRampToValueAtTime(0.001, now + 0.010);
    setTimeout(performConnect, 12);
  }
}

/* ==========================================================================
   EXPANDED PEDALBOARD LOGIC, DSP REGISTRY & MODULAR SIGNAL CHAIN
   ========================================================================== */
const pedalBypassState = {
  OVERDRIVE: true,
  FILTER: false,
  TREMOLO: true,
  PHASER: true,
  FLANGER: true,
  DELAY: false,
  DIGITAL_DELAY: true,
  SPACE_DELAY: true,
  TAPE_ECHO: true,
  SPACE: false
};

const PEDAL_BASE_NAMES = {
  DRIVE_FILTER: "DRIVE + FILTER",
  MOD_CLUSTER: "MOD CLUSTER",
  ANALOG_DELAY: "ANALOG DELAY",
  DIGITAL_DELAY: "DIGITAL DELAY",
  SPACE_REVERB: "SPACE REVERB",
  OVERDRIVE: "TUBE DRIVE",
  FILTER: "FILTER",
  TREMOLO: "OPTO TREMOLO",
  PHASER: "12-POLE PHASER",
  FLANGER: "ANALOG FLANGER",
  DELAY: "TAPE DELAY",
  SPACE_DELAY: "SPACE DELAY",
  TAPE_ECHO: "TAPE ECHO",
  SPACE: "SPACE REVERB"
};

const PEDAL_REGISTRY = {
  DRIVE_FILTER: {
    key: "DRIVE_FILTER",
    name: "DRIVE + FILTER",
    shortName: "DRV/FLT",
    orbId: "filter",
    class: "mini-card-drive-filter",
    color: "#ff5252",
    desc: "Tube Saturation & SVF Filter",
    subPedals: ["OVERDRIVE", "FILTER"],
    params: [
      { id: "drive", label: "DRIVE", min: 0.2, max: 8.0, step: 0.1, default: 2.0, unit: "x" },
      { id: "cutoff", label: "CUTOFF", min: 60, max: 12000, step: 20, default: 2400, unit: "Hz" },
      { id: "res", label: "RES", min: 0.1, max: 12.0, step: 0.1, default: 2.4, unit: "Q" }
    ]
  },
  MOD_CLUSTER: {
    key: "MOD_CLUSTER",
    name: "MOD CLUSTER",
    shortName: "MOD",
    orbId: "filter",
    class: "mini-card-mod-cluster",
    color: "#a55eea",
    desc: "Optical Tremolo, 12-Pole Phaser & Flanger",
    subPedals: ["TREMOLO", "PHASER", "FLANGER"],
    params: [
      { id: "rate", label: "RATE", min: 0.05, max: 8.0, step: 0.05, default: 0.35, unit: "Hz" },
      { id: "depth", label: "DEPTH", min: 0, max: 100, step: 1, default: 65, unit: "%" },
      { id: "feedback", label: "FDBK", min: 0, max: 90, step: 1, default: 45, unit: "%" }
    ]
  },
  ANALOG_DELAY: {
    key: "ANALOG_DELAY",
    name: "ANALOG DELAY",
    shortName: "A-DLY",
    orbId: "delay",
    class: "mini-card-analog-delay",
    color: "#feca57",
    desc: "Warm Tape Saturation & 3-Head Multi-Tap",
    subPedals: ["DELAY", "TAPE_ECHO"],
    params: [
      { id: "time", label: "TIME", min: 0.05, max: 1.5, step: 0.025, default: 0.38, unit: "s" },
      { id: "flutter", label: "FLUTTER", min: 0, max: 100, step: 1, default: 35, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 42, unit: "%" }
    ]
  },
  DIGITAL_DELAY: {
    key: "DIGITAL_DELAY",
    name: "DIGITAL DELAY",
    shortName: "D-DLY",
    orbId: "delay",
    class: "mini-card-digital-delay",
    color: "#48dbfb",
    desc: "Pristine Stereo Ping-Pong & Space Diffusion",
    subPedals: ["DIGITAL_DELAY", "SPACE_DELAY"],
    params: [
      { id: "time", label: "TIME", min: 0.05, max: 2.0, step: 0.025, default: 0.375, unit: "s" },
      { id: "feedback", label: "FDBK", min: 0, max: 85, step: 1, default: 45, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 40, unit: "%" }
    ]
  },
  SPACE_REVERB: {
    key: "SPACE_REVERB",
    name: "SPACE REVERB",
    shortName: "SPACE",
    orbId: "reverb",
    class: "mini-card-space-reverb",
    color: "#ff5fc4",
    desc: "Cathedral Acoustics & Shimmer Reverb",
    subPedals: ["SPACE"],
    params: [
      { id: "weather", label: "SIZE", min: 0, max: 100, step: 1, default: 65, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 48, unit: "%" },
      { id: "shimmer", label: "SHIMMER", min: 0, max: 100, step: 1, default: 35, unit: "%" }
    ]
  },
  OVERDRIVE: {
    key: "OVERDRIVE",
    name: "TUBE DRIVE",
    shortName: "DRIVE",
    orbId: "filter",
    class: "mini-card-drive",
    color: "#ff5252",
    desc: "Tube Saturation & Warmth",
    params: [
      { id: "drive", label: "DRIVE", min: 0.2, max: 8.0, step: 0.1, default: 2.0, unit: "x" },
      { id: "tone", label: "TONE", min: 400, max: 10000, step: 100, default: 3200, unit: "Hz" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 50, unit: "%" }
    ]
  },
  FILTER: {
    key: "FILTER",
    name: "FILTER",
    shortName: "SVF",
    orbId: "filter",
    class: "mini-card-filter",
    color: "#2ed573",
    desc: "SVF Filter & Envelope",
    params: [
      { id: "cutoff", label: "CUTOFF", min: 60, max: 12000, step: 20, default: 2200, unit: "Hz" },
      { id: "res", label: "RES", min: 0.1, max: 12.0, step: 0.1, default: 2.4, unit: "Q" },
      { id: "lfo", label: "LFO", min: 0, max: 100, step: 1, default: 35, unit: "%" }
    ]
  },
  TREMOLO: {
    key: "TREMOLO",
    name: "OPTO TREMOLO",
    shortName: "TREM",
    orbId: "filter",
    class: "mini-card-tremolo",
    color: "#00d2d3",
    desc: "Optical Tremolo & Pan",
    params: [
      { id: "rate", label: "RATE", min: 0.2, max: 12.0, step: 0.1, default: 3.5, unit: "Hz" },
      { id: "depth", label: "DEPTH", min: 0, max: 100, step: 1, default: 60, unit: "%" },
      { id: "pan", label: "PAN", min: 0, max: 100, step: 1, default: 40, unit: "%" }
    ]
  },
  PHASER: {
    key: "PHASER",
    name: "12-POLE PHASER",
    shortName: "PHASE",
    orbId: "filter",
    class: "mini-card-phaser",
    color: "#e056fd",
    desc: "12-Pole All-Pass Sweep",
    params: [
      { id: "rate", label: "RATE", min: 0.05, max: 6.0, step: 0.05, default: 0.35, unit: "Hz" },
      { id: "depth", label: "DEPTH", min: 0, max: 100, step: 1, default: 65, unit: "%" },
      { id: "feedback", label: "FDBK", min: 0, max: 90, step: 1, default: 45, unit: "%" }
    ]
  },
  FLANGER: {
    key: "FLANGER",
    name: "ANALOG FLANGER",
    shortName: "FLANGE",
    orbId: "filter",
    class: "mini-card-flanger",
    color: "#54a0ff",
    desc: "Comb-Filter Micro-Delay",
    params: [
      { id: "rate", label: "RATE", min: 0.05, max: 5.0, step: 0.05, default: 0.25, unit: "Hz" },
      { id: "depth", label: "DEPTH", min: 0, max: 100, step: 1, default: 70, unit: "%" },
      { id: "feedback", label: "FDBK", min: -85, max: 85, step: 1, default: 50, unit: "%" }
    ]
  },
  DELAY: {
    key: "DELAY",
    name: "TAPE DELAY",
    shortName: "DELAY",
    orbId: "delay",
    class: "mini-card-delay",
    color: "#ff793f",
    desc: "Analog Tape Delay",
    params: [
      { id: "time", label: "TIME", min: 0.05, max: 1.5, step: 0.025, default: 0.38, unit: "s" },
      { id: "feedback", label: "FDBK", min: 0, max: 48, step: 1, default: 28, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 42, unit: "%" }
    ]
  },
  DIGITAL_DELAY: {
    key: "DIGITAL_DELAY",
    name: "DIGITAL DELAY",
    shortName: "D-DLY",
    orbId: "delay",
    class: "mini-card-digital-delay",
    color: "#48dbfb",
    desc: "Ping-Pong Delay",
    params: [
      { id: "time", label: "TIME", min: 0.05, max: 2.0, step: 0.025, default: 0.375, unit: "s" },
      { id: "feedback", label: "FDBK", min: 0, max: 85, step: 1, default: 45, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 40, unit: "%" }
    ]
  },
  SPACE_DELAY: {
    key: "SPACE_DELAY",
    name: "SPACE DELAY",
    shortName: "S-DLY",
    orbId: "delay",
    class: "mini-card-space-delay",
    color: "#ff9f43",
    desc: "Flutter Delay Diffusion",
    params: [
      { id: "time", label: "TIME", min: 0.1, max: 2.5, step: 0.025, default: 0.52, unit: "s" },
      { id: "flutter", label: "FLUTTER", min: 0, max: 100, step: 1, default: 40, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 45, unit: "%" }
    ]
  },
  TAPE_ECHO: {
    key: "TAPE_ECHO",
    name: "TAPE ECHO",
    shortName: "ECHO",
    orbId: "delay",
    class: "mini-card-tape-echo",
    color: "#feca57",
    desc: "3-Head Multi-Tap Inertia",
    params: [
      { id: "speed", label: "SPEED", min: 0.2, max: 2.5, step: 0.05, default: 1.0, unit: "x" },
      { id: "inertia", label: "INERTIA", min: 0.01, max: 0.5, step: 0.01, default: 0.12, unit: "s" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 45, unit: "%" }
    ]
  },
  SPACE: {
    key: "SPACE",
    name: "SPACE REVERB",
    shortName: "SPACE",
    orbId: "reverb",
    class: "mini-card-space",
    color: "#ff5fc4",
    desc: "Shimmer Reverb & Chorus",
    params: [
      { id: "decay", label: "DECAY", min: 0, max: 100, step: 1, default: 72, unit: "%" },
      { id: "chorus", label: "CHORUS", min: 0, max: 100, step: 1, default: 35, unit: "%" },
      { id: "mix", label: "MIX", min: 0, max: 100, step: 1, default: 55, unit: "%" }
    ]
  }
};

const fxParamsState = {};
Object.keys(PEDAL_REGISTRY).forEach(k => {
  fxParamsState[k] = {};
  PEDAL_REGISTRY[k].params.forEach(p => {
    fxParamsState[k][p.id] = p.default;
  });
});

function formatFxParamValue(paramMeta, val) {
  if (!paramMeta) return String(val);
  if (paramMeta.unit === "Hz") {
    return val >= 1000 ? (val / 1000).toFixed(1) + "k" : Math.round(val) + "Hz";
  }
  if (paramMeta.unit === "s") {
    return val.toFixed(2) + "s";
  }
  if (paramMeta.unit === "x") {
    return val.toFixed(1) + "x";
  }
  if (paramMeta.unit === "%") {
    return Math.round(val) + "%";
  }
  if (paramMeta.unit === "Q") {
    return val.toFixed(1);
  }
  return String(val);
}

function updateFxParam(key, paramId, value, ev) {
  if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
  const val = parseFloat(value);
  if (!fxParamsState[key]) fxParamsState[key] = {};
  fxParamsState[key][paramId] = val;

  // Format label in UI
  const reg = PEDAL_REGISTRY[key];
  const pMeta = reg && reg.params.find(p => p.id === paramId);
  const lbl = document.getElementById(`lbl_${key}_${paramId}`);
  if (lbl && pMeta) {
    lbl.textContent = formatFxParamValue(pMeta, val);
  }

  // Audio dispatch
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  try {
    if (key === "DRIVE_FILTER") {
      if (paramId === "drive") updateFxParam("OVERDRIVE", "drive", val, ev);
      else if (paramId === "cutoff" || paramId === "res") updateFxParam("FILTER", paramId, val, ev);
      return;
    } else if (key === "MOD_CLUSTER") {
      if (paramId === "rate") {
        updateFxParam("TREMOLO", "rate", val, ev);
        updateFxParam("PHASER", "rate", val, ev);
        updateFxParam("FLANGER", "rate", val, ev);
      } else if (paramId === "depth") {
        updateFxParam("TREMOLO", "depth", val, ev);
        updateFxParam("PHASER", "depth", val, ev);
        updateFxParam("FLANGER", "depth", val, ev);
      } else if (paramId === "feedback") {
        updateFxParam("PHASER", "feedback", val, ev);
        updateFxParam("FLANGER", "feedback", val, ev);
      }
      return;
    } else if (key === "ANALOG_DELAY") {
      if (paramId === "time") updateFxParam("DELAY", "time", val, ev);
      else if (paramId === "flutter") {
        if (window.fxTapeEcho) {
          window.fxTapeEcho.setSpeed(Math.max(0.2, 2.5 - (val / 100) * 1.5));
          window.fxTapeEcho.setInertia((val / 100) * 0.4);
        }
      } else if (paramId === "mix" || paramId === "feedback") {
        updateFxParam("DELAY", paramId, val, ev);
      }
      return;
    } else if (key === "SPACE_REVERB") {
      if (paramId === "weather" || paramId === "decay") updateFxParam("SPACE", "decay", val, ev);
      else if (paramId === "mix") updateFxParam("SPACE", "mix", val, ev);
      else if (paramId === "shimmer" || paramId === "chorus") updateFxParam("SPACE", "chorus", val, ev);
      return;
    }

    if (key === "OVERDRIVE" && window.fxTubeDrive) {
      if (paramId === "drive") window.fxTubeDrive.setDrive(val);
      else if (paramId === "tone" && window.fxTubeDrive.toneFilter) window.fxTubeDrive.toneFilter.frequency.setTargetAtTime(val, now, 0.02);
      else if (paramId === "mix") window.fxTubeDrive.setMix(val / 100);
    } else if (key === "TREMOLO" && window.fxTremolo) {
      if (paramId === "rate" && window.fxTremolo.lfo) window.fxTremolo.lfo.frequency.setTargetAtTime(val, now, 0.02);
      else if (paramId === "depth" && window.fxTremolo.depthGain) window.fxTremolo.depthGain.gain.setTargetAtTime(val / 100, now, 0.02);
      else if (paramId === "pan" && window.fxTremolo.panDepthGain) window.fxTremolo.panDepthGain.gain.setTargetAtTime(val / 100, now, 0.02);
    } else if (key === "PHASER" && window.fxPhaser) {
      if (paramId === "rate" && window.fxPhaser.lfo) window.fxPhaser.lfo.frequency.setTargetAtTime(val, now, 0.02);
      else if (paramId === "depth" && window.fxPhaser.lfoGain) window.fxPhaser.lfoGain.gain.setTargetAtTime(val * 18, now, 0.02);
      else if (paramId === "feedback" && window.fxPhaser.feedbackGain) window.fxPhaser.feedbackGain.gain.setTargetAtTime(val / 100, now, 0.02);
    } else if (key === "FLANGER" && window.fxFlanger) {
      if (paramId === "rate" && window.fxFlanger.lfo) window.fxFlanger.lfo.frequency.setTargetAtTime(val, now, 0.02);
      else if (paramId === "depth" && window.fxFlanger.lfoGain) window.fxFlanger.lfoGain.gain.setTargetAtTime((val / 100) * 0.003, now, 0.02);
      else if (paramId === "feedback" && window.fxFlanger.feedbackGain) window.fxFlanger.feedbackGain.gain.setTargetAtTime(val / 100, now, 0.02);
    } else if (key === "DIGITAL_DELAY" && window.fxDigitalDelay) {
      if (paramId === "time") window.fxDigitalDelay.setTime(val);
      else if (paramId === "feedback") window.fxDigitalDelay.setFeedback(val / 100);
      else if (paramId === "mix") window.fxDigitalDelay.setMix(val / 100);
    } else if (key === "SPACE_DELAY" && window.fxSpaceDelay) {
      if (paramId === "time") window.fxSpaceDelay.setTime(val);
      else if (paramId === "flutter") window.fxSpaceDelay.setFlutter(val / 100);
      else if (paramId === "mix") window.fxSpaceDelay.setMix(val / 100);
    } else if (key === "TAPE_ECHO" && window.fxTapeEcho) {
      if (paramId === "speed") window.fxTapeEcho.setSpeed(val);
      else if (paramId === "inertia") window.fxTapeEcho.setInertia(val);
      else if (paramId === "mix") window.fxTapeEcho.setMix(val / 100);
    } else if (key === "FILTER") {
      if (paramId === "cutoff") {
        masterBaseCutoff = val;
        if (masterFilter1 && masterFilter2) {
          masterFilter1.frequency.setTargetAtTime(masterBaseCutoff, now, 0.02);
          masterFilter2.frequency.setTargetAtTime(masterBaseCutoff, now, 0.02);
        }
      } else if (paramId === "res") {
        masterResonance = val;
        if (masterFilter1 && masterFilter2) {
          masterFilter1.Q.setTargetAtTime(masterResonance, now, 0.02);
          masterFilter2.Q.setTargetAtTime(masterResonance, now, 0.02);
        }
      } else if (paramId === "lfo") {
        filterLfoDepth = val / 100;
        if (filterLFODepthGain) filterLFODepthGain.gain.setTargetAtTime(masterBaseCutoff * filterLfoDepth * 0.68, now, 0.02);
      }
    } else if (key === "DELAY") {
      if (paramId === "time") {
        delayTimeSec = val;
        if (analogDelayNode) analogDelayNode.delayTime.setTargetAtTime(delayTimeSec, now, 0.02);
      } else if (paramId === "feedback") {
        delayFeedbackVal = val / 100;
        if (delayFeedbackGain) delayFeedbackGain.gain.setTargetAtTime(delayLoopGain(), now, 0.02);
      } else if (paramId === "mix") {
        delayMixVal = val / 100;
        if (delayWetGain && delayDryGain) {
          delayWetGain.gain.setTargetAtTime(delayMixVal * 0.85, now, 0.02);
          delayDryGain.gain.setTargetAtTime(1.0 - (delayMixVal * 0.45), now, 0.02);
        }
      }
    } else if (key === "SPACE") {
      if (paramId === "decay") {
        weatherVal = val / 100;
        if (reverbSend) reverbSend.gain.setTargetAtTime(weatherVal * reverbMixVal, now, 0.02);
      } else if (paramId === "chorus") {
        chorusMixVal = val / 100;
        if (chorusWetGain) chorusWetGain.gain.setTargetAtTime(chorusMixVal, now, 0.02);
      } else if (paramId === "mix") {
        reverbMixVal = val / 100;
        if (reverbSend) reverbSend.gain.setTargetAtTime(weatherVal * reverbMixVal, now, 0.02);
      }
    }
  } catch (err) {
    console.error("updateFxParam error:", err);
  }
}

function swapPedalOrbPositions(keyA, keyB) {
  if (typeof PEDAL_KEY_TO_ORBITAL_ID === "undefined" || typeof ORBITAL_MODULES === "undefined") return;
  const orbAId = PEDAL_KEY_TO_ORBITAL_ID[keyA];
  const orbBId = PEDAL_KEY_TO_ORBITAL_ID[keyB];
  if (!orbAId || !orbBId || orbAId === orbBId) return;
  const orbA = ORBITAL_MODULES.find(o => o.id === orbAId);
  const orbB = ORBITAL_MODULES.find(o => o.id === orbBId);
  if (!orbA || !orbB) return;
  const tx = orbA.x, ty = orbA.y, tvx = orbA.vx, tvy = orbA.vy, th = orbA.heading;
  orbA.x = orbB.x; orbA.y = orbB.y; orbA.vx = orbB.vx; orbA.vy = orbB.vy; orbA.heading = orbB.heading;
  orbB.x = tx; orbB.y = ty; orbB.vx = tvx; orbB.vy = tvy; orbB.heading = th;
  orbA.bump = Math.min(0.8, (orbA.bump || 0) + 0.25);
  orbB.bump = Math.min(0.8, (orbB.bump || 0) + 0.25);
}

const DEFAULT_10_PEDAL_ORDER = [
  "OVERDRIVE", "FILTER", "TREMOLO", "PHASER", "FLANGER",
  "DELAY", "TAPE_ECHO", "DIGITAL_DELAY", "SPACE_DELAY", "SPACE"
];

function getExpandedPedalOrder(rawOrder) {
  const source = Array.isArray(rawOrder) && rawOrder.length ? rawOrder : DEFAULT_10_PEDAL_ORDER;
  const expanded = [];
  const seen = new Set();

  source.forEach(key => {
    const meta = PEDAL_REGISTRY[key];
    const subKeys = (meta && Array.isArray(meta.subPedals) && meta.subPedals.length) ? meta.subPedals : [key];
    subKeys.forEach(sk => {
      if (DEFAULT_10_PEDAL_ORDER.includes(sk) && !seen.has(sk)) {
        seen.add(sk);
        expanded.push(sk);
      }
    });
  });

  DEFAULT_10_PEDAL_ORDER.forEach(sk => {
    if (!seen.has(sk)) {
      seen.add(sk);
      expanded.push(sk);
    }
  });

  return expanded;
}

function updatePedalsOrderUI() {
  const container = document.getElementById("studioFxGrid") || document.getElementById("masterDeckUnified");
  const expandedOrder = getExpandedPedalOrder(dspChainOrder);

  // Synchronize all 10 pedal cards and slot badges in the pedalboard grid
  if (container) {
    expandedOrder.forEach((subKey, idx) => {
      const el = document.getElementById("pedalCard_" + subKey);
      if (el && !el.closest("#orbitalModalBody")) {
        container.appendChild(el);
      }

      const chainNum = idx + 1;
      const formattedSlot = "#" + (chainNum < 10 ? "0" + chainNum : chainNum);
      const slotIndexEl = document.getElementById("slotIndex_" + subKey);
      if (slotIndexEl) slotIndexEl.textContent = formattedSlot;

      const titleEl = document.getElementById("pedalTitle_" + subKey) || (el ? el.querySelector(".panel-header .pedal-card-title, .panel-header > span:first-child") : null);
      if (titleEl) {
        const subMeta = PEDAL_REGISTRY[subKey];
        titleEl.textContent = `${chainNum}. ${subMeta ? subMeta.name : (PEDAL_BASE_NAMES[subKey] || subKey)}`;
      }

      const slotBadge = document.getElementById("slotBadge_" + subKey);
      if (slotBadge) {
        if (idx === 0) slotBadge.textContent = "IN";
        else if (idx === expandedOrder.length - 1) slotBadge.textContent = "OUT";
        else slotBadge.textContent = "INSERT";
      }

      const shiftL = document.getElementById("shiftLeft_" + subKey);
      const shiftR = document.getElementById("shiftRight_" + subKey);
      if (shiftL) shiftL.disabled = (idx === 0);
      if (shiftR) shiftR.disabled = (idx === expandedOrder.length - 1);
    });

    dspChainOrder.forEach((key, idx) => {
      if (typeof PEDAL_KEY_TO_ORBITAL_ID !== "undefined" && typeof ORBITAL_MODULES !== "undefined") {
        const orbId = PEDAL_KEY_TO_ORBITAL_ID[key];
        const orb = orbId ? ORBITAL_MODULES.find(o => o.id === orbId) : null;
        if (orb) {
          orb.num = String(idx + 1);
          if (typeof expandedOrbId !== "undefined" && expandedOrbId === orbId) {
            const modalTitle = document.getElementById("orbitalModalTitle");
            if (modalTitle) modalTitle.textContent = `${orb.num}. ${orb.name}`;
          }
        }
      }

      const routeBadge = document.getElementById("routeBadge" + (idx + 1));
      if (routeBadge) {
        routeBadge.textContent = (idx + 1) + ": " + key;
      }
    });
  }

  const eqStrip = document.getElementById("masterEqOutStrip");
  const masterSec = document.getElementById("pedalboardMasterSection") || container;
  if (eqStrip && masterSec && !eqStrip.closest("#orbitalModalBody") && !eqStrip.parentElement) {
    masterSec.appendChild(eqStrip);
  }
  if (eqStrip) {
    const outHeader = eqStrip.querySelector(".panel-header > span:first-child");
    if (outHeader) {
      outHeader.textContent = `${expandedOrder.length + 1}. OUT`;
    }
  }

  renderPedalboardRoutingRibbon();

  if (typeof renderBirdsEyePedalRack === "function") {
    renderBirdsEyePedalRack();
  }
  if (typeof renderMasterDspChainList === "function") {
    renderMasterDspChainList();
  }
  if (typeof renderSplitFxSidebar === "function") {
    renderSplitFxSidebar();
  }
  if (typeof renderMobileMacroGrid === "function") {
    renderMobileMacroGrid();
  }
  if (typeof expandedOrbId !== "undefined" && expandedOrbId && typeof renderSignalRibbon === "function") {
    renderSignalRibbon(expandedOrbId);
  }
}

function renderPedalboardRoutingRibbon() {
  const container = document.getElementById("pedalboardRoutingStream");
  if (!container) return;

  const order = getExpandedPedalOrder(dspChainOrder);
  let html = "";

  order.forEach((key, idx) => {
    const meta = PEDAL_REGISTRY[key];
    if (!meta) return;
    const isBypassed = !!(typeof pedalBypassState !== "undefined" && pedalBypassState[key]);
    const num = idx + 1;

    html += `
      <div class="routing-pill-node ${isBypassed ? 'bypassed' : 'active'}" style="--node-color: ${meta.color};" onclick="focusOrInspectPedal('${key}', event)" title="Slot #${num}: ${meta.name} • Click to focus">
        <span class="node-idx">${num}</span>
        <span class="node-name">${meta.shortName || meta.name}</span>
      </div>
      ${idx < order.length - 1 ? '<span class="routing-arrow">➔</span>' : ''}
    `;
  });

  container.innerHTML = html;

  const countEl = document.getElementById("deckStreamActiveCount");
  if (countEl) {
    const activeCount = order.filter(k => !(typeof pedalBypassState !== "undefined" && pedalBypassState[k])).length;
    countEl.textContent = `${activeCount} / ${order.length} ACTIVE FX + OUT`;
  }
}

function focusOrInspectPedal(key, ev) {
  if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
  if (currentLowerDeckMode === "split") {
    const miniEl = document.getElementById("miniCard_" + key);
    if (miniEl) {
      miniEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
      miniEl.classList.add("pedal-highlight-flash");
      setTimeout(() => miniEl.classList.remove("pedal-highlight-flash"), 1200);
      return;
    }
  }
  if (currentLowerDeckMode === "instruments") {
    setLowerDeckMode("fx");
  }
  const el = document.getElementById("pedalCard_" + key);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    el.classList.add("pedal-highlight-flash");
    setTimeout(() => el.classList.remove("pedal-highlight-flash"), 1200);
  }
}

function togglePedalFullscreen(key, ev) {
  if (ev) {
    if (typeof ev.stopPropagation === "function") ev.stopPropagation();
    if (typeof ev.preventDefault === "function") ev.preventDefault();
  }
  const el = document.getElementById("pedalCard_" + key);
  if (!el) return;

  const isCurrent = el.classList.contains("module-fullscreen-active");
  document.querySelectorAll(".module-fullscreen-active").forEach(item => {
    item.classList.remove("module-fullscreen-active");
  });

  if (isCurrent) {
    document.body.classList.remove("module-focus-open");
    if (window.workspaceManager) {
      window.workspaceManager.state.fullscreenModule = null;
      window.workspaceManager.saveState();
    }
  } else {
    el.classList.add("module-fullscreen-active");
    document.body.classList.add("module-focus-open");
    if (window.workspaceManager) {
      window.workspaceManager.state.fullscreenModule = key;
      window.workspaceManager.saveState();
    }
  }

  if (typeof lastChordWheelSignature !== "undefined") lastChordWheelSignature = "";
  if (typeof drawChordWheelCard === "function") drawChordWheelCard();
  if (typeof triggerCanvasResizes === "function") {
    triggerCanvasResizes();
  } else if (window.workspaceManager && typeof window.workspaceManager.triggerCanvasResizes === "function") {
    window.workspaceManager.triggerCanvasResizes();
  }
}

let currentLowerDeckMode = "instruments";

function setLowerDeckMode(mode) {
  currentLowerDeckMode = mode;
  try {
    localStorage.setItem("slambient_lower_deck_mode", mode);
  } catch (e) {}

  const lowerDeck = document.querySelector(".lower-deck") || document.getElementById("lowerDeck");
  if (lowerDeck) {
    lowerDeck.classList.remove("deck-mode-instruments", "deck-mode-fx", "deck-mode-split");
    lowerDeck.classList.add("deck-mode-" + mode);
  }

  if (document.body) {
    document.body.classList.toggle("split-view-active", mode === "split");
  }

  const btnInst = document.getElementById("btnDeckModeInstruments");
  const btnFx = document.getElementById("btnDeckModeFx");
  const btnSplit = document.getElementById("btnDeckModeSplit");

  if (btnInst) {
    btnInst.classList.toggle("active", mode === "instruments");
    btnInst.setAttribute("aria-selected", mode === "instruments" ? "true" : "false");
  }
  if (btnFx) {
    btnFx.classList.toggle("active", mode === "fx");
    btnFx.setAttribute("aria-selected", mode === "fx" ? "true" : "false");
  }
  if (btnSplit) {
    btnSplit.classList.toggle("active", mode === "split");
    btnSplit.setAttribute("aria-selected", mode === "split" ? "true" : "false");
  }

  if (mode === "fx" || mode === "split") {
    if (typeof updatePedalsOrderUI === "function") updatePedalsOrderUI();
    if (mode === "split" && typeof renderSplitFxSidebar === "function") renderSplitFxSidebar();
  }

  window.dispatchEvent(new Event("resize"));
}

function initLowerDeckView() {
  let saved = null;
  try {
    saved = localStorage.getItem("slambient_lower_deck_mode");
  } catch (e) {}

  let targetMode = (saved === "instruments" || saved === "fx" || saved === "split") ? saved : "split";
  setLowerDeckMode(targetMode);

  if (typeof initStudioFxDragAndDrop === "function") {
    initStudioFxDragAndDrop();
  }
  if (typeof syncAllMiniFxCards === "function") {
    syncAllMiniFxCards();
  }
}

// =========================================================================
// ALL 10 STUDIO FX MODULES + MASTER OUT SPLIT-VIEW ENGINE
// =========================================================================

function formatMiniReadout(numVal, unit) {
  if (unit === "Hz") {
    if (numVal >= 1000) return (numVal / 1000).toFixed(1) + "k";
    return (numVal < 10 ? numVal.toFixed(2) : Math.round(numVal)) + "Hz";
  }
  if (unit === "s") {
    return Math.round(numVal * 1000) + "ms";
  }
  if (unit === "x") {
    return numVal.toFixed(1) + "x";
  }
  if (unit === "Q") {
    return numVal.toFixed(1);
  }
  return Math.round(numVal) + (unit || "");
}

function syncMiniParam(pedalKey, paramId, value, lblId, unit) {
  const numVal = parseFloat(value);
  if (typeof updateFxParam === "function") {
    updateFxParam(pedalKey, paramId, numVal);
  }
  const lbl = document.getElementById(lblId);
  if (lbl) {
    lbl.textContent = formatMiniReadout(numVal, unit);
  }

  const fullSlider = document.getElementById(`slider_${pedalKey}_${paramId}`) ||
                     (pedalKey === "FILTER" && paramId === "cutoff" ? document.getElementById("knobMasterCutoff") : null) ||
                     (pedalKey === "FILTER" && paramId === "res" ? document.getElementById("knobMasterRes") : null) ||
                     (pedalKey === "DELAY" && paramId === "time" ? document.getElementById("knobDelayTime") : null) ||
                     (pedalKey === "DELAY" && paramId === "mix" ? document.getElementById("knobDelayMix") : null) ||
                     (pedalKey === "SPACE" && (paramId === "weather" || paramId === "decay") ? document.getElementById("knobWeather") : null) ||
                     (pedalKey === "SPACE" && paramId === "mix" ? document.getElementById("knobReverbMix") : null);
  if (fullSlider) {
    fullSlider.value = numVal;
  }
}

function syncMiniMasterParam(paramId, value, lblId) {
  const numVal = parseFloat(value);
  const lbl = document.getElementById(lblId);
  if (lbl) {
    lbl.textContent = Math.round(numVal) + "%";
  }
  if (paramId === "weather") {
    const kWeather = document.getElementById("knobWeather");
    if (kWeather) kWeather.value = numVal;
    const lWeather = document.getElementById("lblWeather");
    if (lWeather) lWeather.textContent = Math.round(numVal) + "%";
    if (typeof updateAudioParams === "function") updateAudioParams();
  } else if (paramId === "drive") {
    const kDrive = document.getElementById("knobMasterDrive");
    if (kDrive) kDrive.value = numVal;
    const lDrive = document.getElementById("lblMasterDrive");
    if (lDrive) lDrive.textContent = Math.round(numVal) + "%";
    if (typeof updateAudioParams === "function") updateAudioParams();
  }
}

function syncMiniModParam(paramType, value, lblId, unit) {
  const numVal = parseFloat(value);
  ["TREMOLO", "PHASER", "FLANGER"].forEach(key => {
    if (typeof updateFxParam === "function") {
      updateFxParam(key, paramType, numVal);
    }
    const fullSlider = document.getElementById(`slider_${key}_${paramType}`);
    if (fullSlider) fullSlider.value = numVal;
  });
  const lbl = document.getElementById(lblId);
  if (lbl) {
    if (unit === "Hz") lbl.textContent = numVal.toFixed(2) + "Hz";
    else lbl.textContent = Math.round(numVal) + "%";
  }
}

function toggleMiniCardDrawer(unitKey, event) {
  if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }
  const card = document.getElementById("miniCard_" + unitKey);
  if (!card) return;
  const isExpanded = card.classList.toggle("expanded");
  const expandBtn = card.querySelector(".btn-card-expand");
  if (expandBtn) expandBtn.textContent = isExpanded ? "LESS" : "MORE";
}

function toggleSubPedalBypass(spKey, event) {
  if (event) {
    if (typeof event.stopPropagation === "function") event.stopPropagation();
    if (typeof event.preventDefault === "function") event.preventDefault();
  }
  togglePedalBypass(spKey, event);
  const btn = document.getElementById("sub_pwr_" + spKey);
  const isEngaged = !(typeof pedalBypassState !== "undefined" && pedalBypassState[spKey]);
  if (btn) btn.classList.toggle("active", isEngaged);
}

function renderSplitFxSidebar() {
  const sidebar = document.getElementById("splitRailCards") || document.getElementById("splitFxSidebar");
  if (!sidebar) return;

  const order = getExpandedPedalOrder(dspChainOrder);

  order.forEach((key, idx) => {
    const card = document.getElementById("miniCard_" + key);
    if (card) {
      sidebar.appendChild(card);
      const num = idx + 1;
      const idxEl = document.getElementById("mini_slot_" + key) || card.querySelector(".mini-fx-slot, .mini-fx-idx");
      if (idxEl) {
        idxEl.textContent = "#" + (num < 10 ? "0" + num : num);
      }
      const upBtn = document.getElementById("mini_up_" + key);
      const dnBtn = document.getElementById("mini_dn_" + key);
      if (upBtn) upBtn.disabled = (idx === 0);
      if (dnBtn) dnBtn.disabled = (idx === order.length - 1);
    }
  });

  const masterCard = document.getElementById("miniCard_MASTER");
  if (masterCard) {
    sidebar.appendChild(masterCard);
    const mSlot = document.getElementById("mini_slot_MASTER");
    if (mSlot) mSlot.textContent = "OUT";
  }

  if (typeof syncAllMiniFxCards === "function") {
    syncAllMiniFxCards();
  }

  // Stop pointer propagation on all range sliders and rows inside split rail
  sidebar.querySelectorAll('input[type="range"], .mini-fx-range, .mini-fx-sliders, .mini-fx-slider-row').forEach(el => {
    el.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive: true });
    el.addEventListener("mousedown", (e) => e.stopPropagation(), { passive: true });
  });
}

function toggleUnitBypass(unitKey, event) {
  if (event) event.stopPropagation();
  if (PEDAL_REGISTRY[unitKey] && !PEDAL_REGISTRY[unitKey].subPedals) {
    togglePedalBypass(unitKey, event);
    return;
  }
  const unitMap = {
    unit1: ["OVERDRIVE", "FILTER"],
    unit2: ["TREMOLO", "PHASER", "FLANGER"],
    unit3: ["DELAY", "TAPE_ECHO"],
    unit4: ["DIGITAL_DELAY", "SPACE_DELAY"],
    unit5: ["SPACE"]
  };
  const keys = unitMap[unitKey] || [];
  if (!keys.length) return;

  const firstKey = keys[0];
  const currentlyBypassed = !!(typeof pedalBypassState !== "undefined" && pedalBypassState[firstKey]);
  const newBypass = !currentlyBypassed;

  keys.forEach(k => {
    if (typeof pedalBypassState !== "undefined") {
      pedalBypassState[k] = newBypass;
    }
    if (window.fxRackManager && typeof window.fxRackManager.setBypass === "function") {
      window.fxRackManager.setBypass(k, newBypass);
    }
    const card = document.getElementById("pedalCard_" + k);
    const btn = document.getElementById("stompBtn_" + k);
    if (card) card.classList.toggle("bypassed", newBypass);
    if (btn) btn.classList.toggle("active", !newBypass);
  });

  updateUnitBypassUI(unitKey);
  if (typeof syncAllMiniFxCards === "function") syncAllMiniFxCards();
  if (typeof renderPedalboardRoutingRibbon === "function") renderPedalboardRoutingRibbon();
}

function updateUnitBypassUI(unitKey) {
  if (DEFAULT_10_PEDAL_ORDER.includes(unitKey)) {
    const isBypassed = !!(typeof pedalBypassState !== "undefined" && pedalBypassState[unitKey]);
    const miniCard = document.getElementById("miniCard_" + unitKey);
    const pwrBtn = document.getElementById("mini_pwr_" + unitKey);
    if (miniCard) miniCard.classList.toggle("bypassed", isBypassed);
    if (pwrBtn) {
      pwrBtn.classList.toggle("active", !isBypassed);
      pwrBtn.title = isBypassed ? `Turn ON ${unitKey}` : `Turn OFF ${unitKey}`;
    }
    return;
  }
  const unitMap = {
    unit1: ["OVERDRIVE", "FILTER"],
    unit2: ["TREMOLO", "PHASER", "FLANGER"],
    unit3: ["DELAY", "TAPE_ECHO"],
    unit4: ["DIGITAL_DELAY", "SPACE_DELAY"],
    unit5: ["SPACE"]
  };
  const keys = unitMap[unitKey] || [];
  if (!keys.length) return;
  const isEngaged = keys.some(k => !(typeof pedalBypassState !== "undefined" && pedalBypassState[k]));
  const miniCard = document.getElementById("miniCard_" + unitKey);
  const pwrBtn = document.getElementById("mini_pwr_" + unitKey);
  const led = document.getElementById("mini_led_" + unitKey);
  if (miniCard) miniCard.classList.toggle("bypassed", !isEngaged);
  if (pwrBtn) {
    pwrBtn.classList.toggle("active", isEngaged);
    pwrBtn.title = isEngaged ? "Turn OFF Unit" : "Turn ON Unit";
  }
  if (led) {
    led.classList.toggle("lit", isEngaged);
  }
}

function inspectConsolidatedUnit(unitKey, event) {
  if (event) event.stopPropagation();
  setLowerDeckMode("fx");
  let targetEl = null;
  if (unitKey === "MASTER") {
    targetEl = document.getElementById("masterEqOutStrip") || document.getElementById("pedalboardMasterSection");
  } else if (unitKey === "unit1") {
    targetEl = document.getElementById("pedalCard_FILTER") || document.getElementById("pedalCard_OVERDRIVE");
  } else if (unitKey === "unit2") {
    targetEl = document.getElementById("pedalCard_TREMOLO");
  } else if (unitKey === "unit3") {
    targetEl = document.getElementById("pedalCard_DELAY");
  } else if (unitKey === "unit4") {
    targetEl = document.getElementById("pedalCard_DIGITAL_DELAY");
  } else if (unitKey === "unit5") {
    targetEl = document.getElementById("pedalCard_SPACE");
  } else {
    targetEl = document.getElementById("pedalCard_" + unitKey) || document.getElementById(unitKey);
  }
  if (targetEl) {
    targetEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
    targetEl.classList.add("unit-target-highlight");
    setTimeout(() => targetEl.classList.remove("unit-target-highlight"), 1200);
  }
}

function setDelayDivision(divStr, event) {
  if (event) event.stopPropagation();
  document.querySelectorAll(".btn-division").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim() === divStr);
  });
  const currentBpm = (typeof bpm !== "undefined" && bpm > 0) ? bpm : 72;
  const beatSec = 60.0 / currentBpm;
  let factor = 1.0;
  if (divStr === "1/16") factor = 0.25;
  else if (divStr === "1/8") factor = 0.5;
  else if (divStr === "1/8d") factor = 0.75;
  else if (divStr === "1/4") factor = 1.0;
  else if (divStr === "1/2") factor = 2.0;

  const delaySec = Math.max(0.02, Math.min(2.0, beatSec * factor));
  const delayMs = Math.round(delaySec * 1000);

  if (typeof updateFxParam === "function") {
    updateFxParam("DIGITAL_DELAY", "time", delaySec);
  }
  const slider = document.getElementById("slider_DIGITAL_DELAY_time");
  if (slider) slider.value = delaySec;
  const readout = document.getElementById("digitalDelayMsReadout");
  if (readout) readout.textContent = `${delayMs}.0 ms [${divStr}]`;
  const miniSlider = document.getElementById("mini_slider_DIGITAL_DELAY_time") || document.getElementById("mini_slider_dig_time");
  if (miniSlider) miniSlider.value = delaySec;
  const miniLbl = document.getElementById("lbl_mini_DIGITAL_DELAY_time") || document.getElementById("lbl_mini_dig_time");
  if (miniLbl) miniLbl.textContent = `${delayMs}ms`;
}

function setReverbCathedralMode(modeStr, event) {
  if (event) event.stopPropagation();
  document.querySelectorAll(".btn-reverb-mode").forEach(btn => {
    btn.classList.toggle("active", btn.textContent.trim() === modeStr);
  });
  const sel = document.getElementById("selReverbMode");
  if (sel) {
    if (modeStr === "CATHEDRAL") sel.value = "CATHEDRAL";
    else if (modeStr === "PLATE") sel.value = "PLATE";
    else sel.value = "HALL";
  }
  let weatherTarget = 65;
  if (modeStr === "PLATE") weatherTarget = 45;
  else if (modeStr === "ROOM") weatherTarget = 30;
  else if (modeStr === "CATHEDRAL") weatherTarget = 80;
  else if (modeStr === "INFINITE") weatherTarget = 95;

  if (typeof updateFxParam === "function") {
    updateFxParam("SPACE", "weather", weatherTarget);
    updateFxParam("SPACE", "decay", weatherTarget);
  }
  const kWeather = document.getElementById("knobWeather");
  if (kWeather) kWeather.value = weatherTarget;
  const lWeather = document.getElementById("lblWeather");
  if (lWeather) lWeather.textContent = weatherTarget + "%";

  const miniS = document.getElementById("mini_slider_SPACE_decay") || document.getElementById("mini_slider_spc_size");
  if (miniS) miniS.value = weatherTarget;
  const miniL = document.getElementById("lbl_mini_SPACE_decay") || document.getElementById("lbl_mini_spc_size");
  if (miniL) miniL.textContent = weatherTarget + "%";
}

function selectModSubStage(stageKey, event) {
  if (event) event.stopPropagation();
  document.querySelectorAll(".mod-cluster-pills .mod-pill").forEach(pill => {
    pill.classList.toggle("active", pill.textContent.trim() === (stageKey === "TREMOLO" ? "OPTO" : (stageKey === "PHASER" ? "PHASE" : "FLANGE")));
  });
  const targetCard = document.getElementById("pedalCard_" + stageKey);
  if (targetCard) {
    targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    targetCard.classList.add("unit-target-highlight");
    setTimeout(() => targetCard.classList.remove("unit-target-highlight"), 1200);
  }
}

function syncAllMiniFxCards() {
  const miniSpecs = [
    { key: "OVERDRIVE", p1: { id: "drive", def: 2.0, unit: "x" }, p2: { id: "mix", def: 50, unit: "%" } },
    { key: "FILTER", p1: { id: "cutoff", def: 2200, unit: "Hz" }, p2: { id: "res", def: 2.4, unit: "Q" } },
    { key: "TREMOLO", p1: { id: "rate", def: 3.5, unit: "Hz" }, p2: { id: "depth", def: 60, unit: "%" } },
    { key: "PHASER", p1: { id: "rate", def: 0.35, unit: "Hz" }, p2: { id: "depth", def: 65, unit: "%" } },
    { key: "FLANGER", p1: { id: "rate", def: 0.25, unit: "Hz" }, p2: { id: "depth", def: 70, unit: "%" } },
    { key: "DELAY", p1: { id: "time", def: 0.38, unit: "s" }, p2: { id: "mix", def: 42, unit: "%" } },
    { key: "TAPE_ECHO", p1: { id: "speed", def: 1.0, unit: "x" }, p2: { id: "mix", def: 45, unit: "%" } },
    { key: "DIGITAL_DELAY", p1: { id: "time", def: 0.375, unit: "s" }, p2: { id: "feedback", def: 45, unit: "%" } },
    { key: "SPACE_DELAY", p1: { id: "time", def: 0.52, unit: "s" }, p2: { id: "flutter", def: 40, unit: "%" } },
    { key: "SPACE", p1: { id: "decay", def: 65, unit: "%" }, p2: { id: "mix", def: 48, unit: "%" } }
  ];

  miniSpecs.forEach(spec => {
    const k = spec.key;
    [spec.p1, spec.p2].forEach(p => {
      let val = (typeof fxParamsState !== "undefined" && fxParamsState[k] && fxParamsState[k][p.id] !== undefined)
        ? fxParamsState[k][p.id]
        : p.def;
      if (k === "SPACE" && p.id === "decay" && fxParamsState[k] && fxParamsState[k].weather !== undefined) {
        val = fxParamsState[k].weather;
      }
      const sEl = document.getElementById(`mini_slider_${k}_${p.id}`);
      const lEl = document.getElementById(`lbl_mini_${k}_${p.id}`);
      if (sEl) sEl.value = val;
      if (lEl) lEl.textContent = formatMiniReadout(parseFloat(val), p.unit);
    });

    updateUnitBypassUI(k);
  });

  // Sync Master Out card
  const kWeather = document.getElementById("knobWeather");
  const kDrive = document.getElementById("knobMasterDrive");
  const wVal = kWeather ? parseFloat(kWeather.value) : (typeof weatherVal === "number" ? Math.round(weatherVal * 100) : 45);
  const dVal = kDrive ? parseFloat(kDrive.value) : 10;
  const sMW = document.getElementById("mini_slider_MASTER_weather");
  const lMW = document.getElementById("lbl_mini_MASTER_weather");
  if (sMW) sMW.value = wVal;
  if (lMW) lMW.textContent = Math.round(wVal) + "%";
  const sMD = document.getElementById("mini_slider_MASTER_drive");
  const lMD = document.getElementById("lbl_mini_MASTER_drive");
  if (sMD) sMD.value = dVal;
  if (lMD) lMD.textContent = Math.round(dVal) + "%";
}

function renderBirdsEyePedalRack() {
  const rack = document.getElementById("pedalBirdsEyeRack");
  if (!rack) return;

  const order = getExpandedPedalOrder(dspChainOrder);
  let html = "";

  order.forEach((key, idx) => {
    const meta = PEDAL_REGISTRY[key];
    if (!meta) return;
    const isBypassed = !!(typeof pedalBypassState !== "undefined" && pedalBypassState[key]);
    const slotLabel = idx === 0 ? "IN" : (idx === order.length - 1 ? "OUT" : "INSERT");
    const num = 7 + idx;

    // Render micro parameter sliders
    let controlsHtml = "";
    if (Array.isArray(meta.params)) {
      meta.params.forEach(p => {
        const currentVal = (fxParamsState[key] && fxParamsState[key][p.id] !== undefined)
          ? fxParamsState[key][p.id]
          : p.default;
        const formatted = formatFxParamValue(p, currentVal);

        controlsHtml += `
          <div class="mini-pedal-param" title="${p.label}: ${formatted}">
            <div class="mini-pedal-param-label">
              <span>${p.label}</span>
              <span id="lbl_${key}_${p.id}">${formatted}</span>
            </div>
            <input type="range" class="mini-pedal-slider"
              id="slider_${key}_${p.id}"
              min="${p.min}" max="${p.max}" step="${p.step}" value="${currentVal}"
              oninput="updateFxParam('${key}', '${p.id}', this.value, event)"
              onchange="updateFxParam('${key}', '${p.id}', this.value, event)"
              onclick="event.stopPropagation()"
              onpointerdown="event.stopPropagation()"
              onmousedown="event.stopPropagation()"
            >
          </div>
        `;
      });
    }

    html += `
      <div class="mini-pedal-card ${meta.class} ${isBypassed ? 'bypassed' : 'active'}" data-pedal="${key}" draggable="true" title="Drag to reorder • Double-click or click EDIT to inspect">
        <div class="mini-pedal-left">
          <span class="mini-pedal-drag-handle" title="Click and drag to reorder effects in DSP chain">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>
          </span>
          <span class="mini-pedal-badge">${num}</span>
          <div class="mini-pedal-info">
            <span class="mini-pedal-name">${meta.shortName || meta.name}</span>
            <span class="mini-pedal-slot">${slotLabel}</span>
          </div>
        </div>
        <div class="mini-pedal-controls" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()">
          ${controlsHtml}
        </div>
        <div class="mini-pedal-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()">
          <button type="button" draggable="false" class="btn-mini-power btn-power ${isBypassed ? '' : 'active'}" onclick="togglePedalBypass('${key}', event)" title="${isBypassed ? 'Turn ON ' + meta.name : 'Turn OFF ' + meta.name}">
            PWR
          </button>
          <button type="button" draggable="false" class="badge-tag btn-mini-randomize" onclick="randomizePedalModule('${key}', event)" title="Randomize ${meta.name} parameters">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><polyline points="21 3 21 8 16 8"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><polyline points="3 21 3 16 8 16"/></svg>
          </button>
          <button type="button" draggable="false" class="btn-mini-inspect" onclick="openMiniPedalInspector('${meta.orbId || 'filter'}', event)" title="Inspect full controls">EDIT ↗</button>
        </div>
      </div>
    `;
  });

  // Terminal Master EQ & Out Node (Node OUT)
  html += `
    <div class="mini-pedal-card mini-card-master active" data-pedal="MASTER" onclick="if (!event.target.closest('button, input')) openMiniPedalInspector('space', event)" title="Terminal Master Node • Click to inspect">
      <div class="mini-pedal-left">
        <span class="mini-pedal-badge">OUT</span>
        <div class="mini-pedal-info">
          <span class="mini-pedal-name">MASTER OUT</span>
          <span class="mini-pedal-slot">BUS TERM</span>
        </div>
      </div>
      <div class="mini-pedal-actions" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onmousedown="event.stopPropagation()">
        <button type="button" draggable="false" class="badge-tag btn-mini-randomize" onclick="randomizePedalModule('MASTER', event)" title="Randomize Master EQ & Out parameters">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8"/><polyline points="21 3 21 8 16 8"/><path d="M21 12a9 9 0 0 1-15.5 6.3L3 16"/><polyline points="3 21 3 16 8 16"/></svg>
        </button>
        <button type="button" draggable="false" class="btn-mini-inspect" onclick="openMiniPedalInspector('space', event)" title="Inspect Master EQ & Out">EDIT ↗</button>
      </div>
    </div>
  `;

  rack.innerHTML = html;
  if (typeof initMiniPedalDragAndDrop === "function") {
    initMiniPedalDragAndDrop();
  }
}

function shiftPedalLeft(key, ev) {
  shiftMasterDspChain(key, -1, ev);
}

function shiftPedalRight(key, ev) {
  shiftMasterDspChain(key, 1, ev);
}

function randomizeDspChain(ev) {
  if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
  if (window.fxRackManager) {
    dspChainOrder = window.fxRackManager.randomizeChain("SAFE");
  } else {
    const expanded = getExpandedPedalOrder(dspChainOrder);
    dspChainOrder = [...expanded].sort(() => Math.random() - 0.5);
  }
  rewireDspChain(dspChainOrder, false);
}

function resetDspChain(ev) {
  if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
  dspChainOrder = [...DEFAULT_10_PEDAL_ORDER];
  if (window.fxRackManager) {
    window.fxRackManager.setChainOrder(dspChainOrder, false);
  }
  rewireDspChain(dspChainOrder, false);
}

function renderMasterDspChainList() {
  const container = document.getElementById("masterDspChainList");
  if (!container) return;

  const order = getExpandedPedalOrder(dspChainOrder);
  let html = "";

  order.forEach((key, idx) => {
    const meta = PEDAL_REGISTRY[key];
    if (!meta) return;
    const isBypassed = !!(typeof pedalBypassState !== "undefined" && pedalBypassState[key]);
    const num = idx + 1;
    const isFirst = idx === 0;
    const isLast = idx === order.length - 1;

    html += `
      <div class="master-dsp-chain-item ${isBypassed ? 'bypassed' : ''}" style="--item-color: ${meta.color};" data-chain-pedal="${key}">
        <div class="master-dsp-item-left">
          <span class="master-dsp-item-badge">${num}</span>
          <span class="master-dsp-item-name">${meta.name}</span>
          <span class="master-dsp-item-role">${meta.desc}</span>
        </div>
        <div class="master-dsp-item-actions" onclick="event.stopPropagation()">
          <button type="button" class="btn-mini-power btn-power ${isBypassed ? '' : 'active'}" onclick="togglePedalBypass('${key}', event)" title="${isBypassed ? 'Enable ' + meta.name : 'Bypass ' + meta.name}">
            PWR
          </button>
          <button type="button" class="master-dsp-nudge-btn" onclick="shiftMasterDspChain('${key}', -1, event)" ${isFirst ? 'disabled' : ''} title="Nudge Up in Signal Chain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button type="button" class="master-dsp-nudge-btn" onclick="shiftMasterDspChain('${key}', 1, event)" ${isLast ? 'disabled' : ''} title="Nudge Down in Signal Chain">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

function shiftMasterDspChain(key, direction, ev) {
  if (ev && typeof ev.stopPropagation === "function") ev.stopPropagation();
  if (DEFAULT_10_PEDAL_ORDER.includes(key) && !dspChainOrder.includes(key)) {
    dspChainOrder = getExpandedPedalOrder(dspChainOrder);
  }
  if (window.fxRackManager && dspChainOrder.includes(key) && window.fxRackManager.chain.includes(key)) {
    dspChainOrder = window.fxRackManager.shiftModule(key, direction);
  } else {
    const idx = dspChainOrder.indexOf(key);
    if (idx !== -1) {
      const targetIdx = idx + direction;
      if (targetIdx >= 0 && targetIdx < dspChainOrder.length) {
        const item = dspChainOrder.splice(idx, 1)[0];
        dspChainOrder.splice(targetIdx, 0, item);
      }
    }
  }
  rewireDspChain(dspChainOrder, false);
}

function togglePedalBypass(key, ev) {
  if (ev) {
    if (typeof ev.stopPropagation === "function") ev.stopPropagation();
    if (typeof ev.preventDefault === "function") ev.preventDefault();
  }
  pedalBypassState[key] = !pedalBypassState[key];
  const isBypassed = !!pedalBypassState[key];

  if (window.fxRackManager) {
    window.fxRackManager.setBypass(key, isBypassed);
  }

  // 1. Update backing store elements
  const card = document.getElementById("pedalCard_" + key);
  const btn = document.getElementById("stompBtn_" + key);
  if (card) card.classList.toggle("bypassed", isBypassed);
  if (btn) btn.classList.toggle("active", !isBypassed);

  // 2. Update Split View mini-fx-card immediately
  updateUnitBypassUI(key);

  // 3. Directly update visible birds-eye rack cards & buttons immediately
  const miniCard = document.querySelector(`.mini-pedal-card[data-pedal="${key}"]`);
  if (miniCard) {
    miniCard.classList.toggle("bypassed", isBypassed);
    miniCard.classList.toggle("active", !isBypassed);
    const pwrBtn = miniCard.querySelector(".btn-mini-power");
    if (pwrBtn) {
      pwrBtn.classList.toggle("active", !isBypassed);
      pwrBtn.title = isBypassed ? ("Turn ON " + key) : ("Turn OFF " + key);
    }
  }

  // 4. Update master DSP chain item in Master panel
  const chainItem = document.querySelector(`.master-dsp-chain-item[data-chain-pedal="${key}"]`);
  if (chainItem) {
    chainItem.classList.toggle("bypassed", isBypassed);
    const itemPwr = chainItem.querySelector(".btn-mini-power");
    if (itemPwr) {
      itemPwr.classList.toggle("active", !isBypassed);
      itemPwr.title = isBypassed ? ("Enable " + key) : ("Bypass " + key);
    }
  }

  // 5. Update modal header PWR button if modal is currently open for this pedal
  const modalPwr = document.querySelector("#orbitalModalActions .btn-power");
  const currentOrbId = (typeof PEDAL_KEY_TO_ORBITAL_ID !== "undefined" && PEDAL_KEY_TO_ORBITAL_ID[key]) ? PEDAL_KEY_TO_ORBITAL_ID[key] : key.toLowerCase();
  if (modalPwr && expandedOrbId === currentOrbId) {
    modalPwr.classList.toggle("active", !isBypassed);
  }

  if (typeof renderPedalboardRoutingRibbon === "function") {
    renderPedalboardRoutingRibbon();
  }
  if (typeof renderMasterDspChainList === "function") {
    renderMasterDspChainList();
  }
  if (typeof renderMobileMacroGrid === "function") {
    renderMobileMacroGrid();
  }

  // 6. Update audio DSP if audioCtx exists
  if (audioCtx) {
    const now = audioCtx.currentTime;
    if (key === 'FILTER') {
      if (filterModuleInput && filterModuleOutput && masterFilter1 && masterFilter2) {
        masterFilter1.frequency.setTargetAtTime(isBypassed ? 20000 : masterBaseCutoff, now, 0.05);
        masterFilter2.frequency.setTargetAtTime(isBypassed ? 20000 : masterBaseCutoff, now, 0.05);
        masterFilter1.Q.setTargetAtTime(isBypassed ? 0.5 : masterResonance, now, 0.05);
        masterFilter2.Q.setTargetAtTime(isBypassed ? 0.5 : masterResonance, now, 0.05);
      }
    } else if (key === 'DELAY') {
      if (delayWetGain && delayDryGain) {
        delayWetGain.gain.setTargetAtTime(isBypassed ? 0.0001 : delayMixVal * 0.85, now, 0.05);
        delayDryGain.gain.setTargetAtTime(isBypassed ? 1.0 : (1.0 - (delayMixVal * 0.45)), now, 0.05);
      }
    } else if (key === 'SPACE') {
      if (spaceDryGain && reverbSend && chorusWetGain) {
        reverbSend.gain.setTargetAtTime(isBypassed ? 0.0001 : (weatherVal * reverbMixVal), now, 0.05);
        chorusWetGain.gain.setTargetAtTime(isBypassed ? 0.0001 : chorusMixVal, now, 0.05);
        spaceDryGain.gain.setTargetAtTime(isBypassed ? 1.0 : 0.88, now, 0.05);
      }
    }
  }
}

function randomizePedalModule(key, ev) {
  if (ev) {
    if (typeof ev.stopPropagation === "function") ev.stopPropagation();
    if (typeof ev.preventDefault === "function") ev.preventDefault();
  }
  if (key === 'FILTER') {
    if (typeof randomizeFilter === "function") randomizeFilter();
  } else if (key === 'DELAY') {
    if (typeof randomizeDelay === "function") randomizeDelay();
  } else if (key === 'SPACE') {
    if (typeof randomizeReverbChorus === "function") randomizeReverbChorus();
  } else if (key === 'MASTER') {
    if (typeof randomizeSpace === "function") randomizeSpace();
  } else if (PEDAL_REGISTRY[key]) {
    const meta = PEDAL_REGISTRY[key];
    if (Array.isArray(meta.params)) {
      meta.params.forEach(p => {
        let randVal = p.min + Math.random() * (p.max - p.min);
        if (p.step >= 1) randVal = Math.round(randVal);
        else if (p.step >= 0.1) randVal = parseFloat(randVal.toFixed(1));
        else randVal = parseFloat(randVal.toFixed(3));
        updateFxParam(key, p.id, randVal);
        const slider = document.getElementById(`slider_${key}_${p.id}`);
        if (slider) slider.value = randVal;
      });
    }
  }
}

function initStudioFxDragAndDrop() {
  const grid = document.getElementById("studioFxGrid");
  if (!grid) return;
  const cards = grid.querySelectorAll(".pedal-chassis[data-pedal]");
  let draggedKey = null;

  cards.forEach(card => {
    // Only allow HTML5 drag if initiated on .pedal-drag-handle or when in workspace-edit-mode
    const handle = card.querySelector(".pedal-drag-handle");
    if (handle) {
      handle.setAttribute("draggable", "true");
      handle.addEventListener("dragstart", (e) => {
        draggedKey = card.getAttribute("data-pedal");
        card.classList.add("pedal-dragging");
        document.body.classList.add("pedal-drag-in-progress");
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", draggedKey);
        }
      });
    }

    // Guard on card level against unwanted HTML5 drag
    card.addEventListener("dragstart", (e) => {
      const isEdit = document.body.classList.contains("workspace-edit-mode");
      const isFromHandle = !!e.target.closest(".pedal-drag-handle");
      if (e.target.closest("button, a, input, select, .custom-dropdown-wrap, .control-row, .pedal-controls-body") || (!isEdit && !isFromHandle)) {
        e.preventDefault();
        return;
      }
      draggedKey = card.getAttribute("data-pedal");
      card.classList.add("pedal-dragging");
      document.body.classList.add("pedal-drag-in-progress");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedKey);
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("pedal-dragging");
      document.body.classList.remove("pedal-drag-in-progress");
      cards.forEach(c => c.classList.remove("pedal-drag-over"));
      draggedKey = null;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const targetCard = e.currentTarget;
      if (targetCard && targetCard !== card) {
        targetCard.classList.add("pedal-drag-over");
      }
    });

    card.addEventListener("dragleave", (e) => {
      e.currentTarget.classList.remove("pedal-drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("pedal-drag-over");
      const targetKey = e.currentTarget.getAttribute("data-pedal");
      if (draggedKey && targetKey && draggedKey !== targetKey) {
        reorderDspChainModules(draggedKey, targetKey);
      }
    });

    if (handle) {
      handle.addEventListener("pointerdown", (e) => {
        const startX = e.clientX, startY = e.clientY;
        let isPointerDragging = false;
        const dragId = e.pointerId;
        const sourceKey = card.getAttribute("data-pedal");

        const onMove = (ev) => {
          if (ev.pointerId !== dragId) return;
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 6) {
            if (!isPointerDragging) {
              isPointerDragging = true;
              card.classList.add("pedal-dragging");
              document.body.classList.add("pedal-drag-in-progress");
              try { handle.setPointerCapture(dragId); } catch (_) {}
            }
            const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
            const overCard = elUnder ? elUnder.closest(".studio-fx-grid .pedal-chassis") : null;
            cards.forEach(c => c.classList.toggle("pedal-drag-over", c === overCard && c !== card));
          }
        };

        const onUp = (ev) => {
          if (ev.pointerId !== dragId) return;
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);

          if (isPointerDragging) {
            try { handle.releasePointerCapture(dragId); } catch (_) {}
            card.classList.remove("pedal-dragging");
            document.body.classList.remove("pedal-drag-in-progress");
            cards.forEach(c => c.classList.remove("pedal-drag-over"));
            const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
            const targetCard = elUnder ? elUnder.closest(".studio-fx-grid .pedal-chassis") : null;
            const targetKey = targetCard ? targetCard.getAttribute("data-pedal") : null;
            if (sourceKey && targetKey && sourceKey !== targetKey) {
              reorderDspChainModules(sourceKey, targetKey);
            }
          }
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      });
    }
  });

  // Stop pointer propagation from all range sliders and controls in studioFxGrid
  grid.querySelectorAll('input[type="range"], select, button, .custom-dropdown-wrap, .control-row').forEach(el => {
    el.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive: true });
    el.addEventListener("mousedown", (e) => e.stopPropagation(), { passive: true });
  });
}

function initMiniPedalDragAndDrop() {
  const rack = document.getElementById("pedalBirdsEyeRack");
  if (!rack) return;
  const cards = rack.querySelectorAll(".mini-pedal-card[data-pedal]:not([data-pedal='MASTER'])");
  let draggedKey = null;

  cards.forEach(card => {
    // 1. HTML5 Drag and Drop - only allow drag from handle or non-interactive areas
    card.addEventListener("dragstart", (e) => {
      if (e.target.closest("button, a, input, select, .mini-pedal-controls, .mini-pedal-param, .mini-pedal-slider, .mini-fx-sliders, .mini-fx-slider-row, .mini-fx-range")) {
        e.preventDefault();
        return;
      }
      draggedKey = card.getAttribute("data-pedal");
      card.classList.add("mini-pedal-dragging");
      document.body.classList.add("pedal-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedKey);
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("mini-pedal-dragging");
      document.body.classList.remove("pedal-dragging");
      cards.forEach(c => c.classList.remove("mini-pedal-drag-over"));
      draggedKey = null;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      const targetCard = e.currentTarget;
      if (targetCard && targetCard.getAttribute("data-pedal") !== "MASTER") {
        targetCard.classList.add("mini-pedal-drag-over");
      }
    });

    card.addEventListener("dragleave", (e) => {
      e.currentTarget.classList.remove("mini-pedal-drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      e.currentTarget.classList.remove("mini-pedal-drag-over");
      const targetKey = e.currentTarget.getAttribute("data-pedal");
      if (draggedKey && targetKey && targetKey !== "MASTER" && draggedKey !== targetKey) {
        reorderDspChainModules(draggedKey, targetKey);
      }
    });

    // 2. Tactile Pointer Drag & Tap
    let startX = 0, startY = 0, isDragging = false, dragPointerId = null;

    card.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button, a, input, select, .mini-pedal-controls, .mini-pedal-param, .mini-pedal-slider, .mini-fx-sliders, .mini-fx-slider-row, .mini-fx-range")) return;
      startX = e.clientX;
      startY = e.clientY;
      isDragging = false;
      dragPointerId = e.pointerId;

      const onPointerMove = (ev) => {
        if (ev.pointerId !== dragPointerId) return;
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (dist > 6) {
          if (!isDragging) {
            isDragging = true;
            draggedKey = card.getAttribute("data-pedal");
            card.classList.add("mini-pedal-dragging");
            document.body.classList.add("pedal-dragging");
            try { card.setPointerCapture(dragPointerId); } catch(err) {}
          }
          const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
          const overCard = elUnder ? elUnder.closest(".mini-pedal-card[data-pedal]:not([data-pedal='MASTER'])") : null;
          cards.forEach(c => c.classList.toggle("mini-pedal-drag-over", c === overCard && c !== card));
        }
      };

      const onPointerUp = (ev) => {
        if (ev.pointerId !== dragPointerId) return;
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);

        if (isDragging) {
          try { card.releasePointerCapture(ev.pointerId); } catch(err) {}
          card.classList.remove("mini-pedal-dragging");
          document.body.classList.remove("pedal-dragging");
          cards.forEach(c => c.classList.remove("mini-pedal-drag-over"));
          const elUnder = document.elementFromPoint(ev.clientX, ev.clientY);
          const targetCard = elUnder ? elUnder.closest(".mini-pedal-card[data-pedal]:not([data-pedal='MASTER'])") : null;
          const targetKey = targetCard ? targetCard.getAttribute("data-pedal") : null;
          if (draggedKey && targetKey && targetKey !== "MASTER" && draggedKey !== targetKey) {
            reorderDspChainModules(draggedKey, targetKey);
          }
          isDragging = false;
          draggedKey = null;
        } else {
          // Plain click on card body (outside buttons & controls) -> open inspector
          if (!e.target.closest("button, a, input, select, .mini-pedal-controls, .mini-pedal-param, .mini-pedal-slider, .mini-fx-sliders, .mini-fx-slider-row, .mini-fx-range")) {
            const pedalKey = card.getAttribute("data-pedal");
            const orbId = (typeof PEDAL_KEY_TO_ORBITAL_ID !== "undefined" && PEDAL_KEY_TO_ORBITAL_ID[pedalKey])
              ? PEDAL_KEY_TO_ORBITAL_ID[pedalKey] : pedalKey.toLowerCase();
            openMiniPedalInspector(orbId, ev);
          }
        }
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });
  });

  // Stop pointer propagation on all sliders in birds eye rack
  rack.querySelectorAll('input[type="range"], select, button, .mini-pedal-controls, .mini-pedal-slider').forEach(el => {
    el.addEventListener("pointerdown", (e) => e.stopPropagation(), { passive: true });
    el.addEventListener("mousedown", (e) => e.stopPropagation(), { passive: true });
  });
}

// Drag & drop handlers with unified Pointer Events + HTML5 drag fallback
// Pointer-event drag-to-reorder on drag handles (reliable on desktop and tablet).
// Shared by the upper-deck widgets and the pedalboard: dragging a handle and
// releasing over another card calls onDrop(sourceKey, targetKey).
function bindPointerReorder({ cards, handles, cardSelector, keyAttr, bodyClass, onDrop }) {
  const cardUnder = (ev) => [...cards].find(c => {
    const r = c.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  });
  handles.forEach(handle => {
    handle.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const activeCard = handle.closest(cardSelector);
      if (!activeCard) return;
      const activeKey = activeCard.getAttribute(keyAttr);
      activeCard.classList.add("dragging");
      document.body.classList.add(bodyClass);
      handle.setPointerCapture(e.pointerId);

      const onPointerMove = (ev) => {
        const over = cardUnder(ev);
        cards.forEach(c => c.classList.toggle("drag-over", c === over));
      };
      const onPointerUp = (ev) => {
        handle.releasePointerCapture(ev.pointerId);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        document.body.classList.remove(bodyClass);
        activeCard.classList.remove("dragging");
        cards.forEach(c => c.classList.remove("drag-over"));
        const target = cardUnder(ev);
        const targetKey = target && target.getAttribute(keyAttr);
        if (targetKey && targetKey !== activeKey) onDrop(activeKey, targetKey);
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });
  });
}

function reorderDspChainModules(sourceKey, targetKey) {
  if (!sourceKey || !targetKey || sourceKey === targetKey) return;
  if ((DEFAULT_10_PEDAL_ORDER.includes(sourceKey) || DEFAULT_10_PEDAL_ORDER.includes(targetKey)) &&
      (!dspChainOrder.includes(sourceKey) || !dspChainOrder.includes(targetKey))) {
    dspChainOrder = getExpandedPedalOrder(dspChainOrder);
  }
  if (window.fxRackManager && window.fxRackManager.chain.includes(sourceKey) && window.fxRackManager.chain.includes(targetKey)) {
    dspChainOrder = window.fxRackManager.reorderChain(sourceKey, targetKey);
  } else {
    const fromIdx = dspChainOrder.indexOf(sourceKey);
    const toIdx = dspChainOrder.indexOf(targetKey);
    if (fromIdx !== -1 && toIdx !== -1) {
      dspChainOrder.splice(fromIdx, 1);
      dspChainOrder.splice(toIdx, 0, sourceKey);
    }
  }
  swapPedalOrbPositions(sourceKey, targetKey);
  rewireDspChain(dspChainOrder, false);
}


/* ==========================================================================
   UPPER DECK VISUALIZER WIDGET DRAG & DROP REORDERING
   ========================================================================== */
let upperWidgetOrder = ["scope", "chord", "keys"];
const UPPER_WIDGET_IDS = {
  scope: "scopePanel",
  chord: "chordInfoPanel",
  keys:  "keyboardPanel"
};

function renderUpperDeckOrder() {
  const container = document.querySelector(".upper-deck");
  if (!container) return;
  upperWidgetOrder.forEach(key => {
    const elId = UPPER_WIDGET_IDS[key];
    const el = document.getElementById(elId);
    if (el) container.appendChild(el);
  });
}

function initUpperDeckDragAndDrop() {
  const container = document.querySelector(".upper-deck");
  if (!container) return;
  const cards = container.querySelectorAll(".upper-deck-card");
  const handles = container.querySelectorAll(".upper-drag-handle");
  let draggedWidgetKey = null;

  function reorderWidgets(srcKey, targetKey) {
    if (!srcKey || !targetKey || srcKey === targetKey) return;
    const fromIdx = upperWidgetOrder.indexOf(srcKey);
    const toIdx = upperWidgetOrder.indexOf(targetKey);
    if (fromIdx !== -1 && toIdx !== -1) {
      upperWidgetOrder.splice(fromIdx, 1);
      upperWidgetOrder.splice(toIdx, 0, srcKey);
      renderUpperDeckOrder();
    }
  }

  // HTML5 Drag & Drop
  cards.forEach(card => {
    card.addEventListener("dragstart", (e) => {
      draggedWidgetKey = card.getAttribute("data-upper-widget");
      card.classList.add("dragging");
      document.body.classList.add("upper-dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", draggedWidgetKey);
      }
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      document.body.classList.remove("upper-dragging");
      cards.forEach(c => c.classList.remove("drag-over"));
      draggedWidgetKey = null;
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const targetKey = card.getAttribute("data-upper-widget");
      reorderWidgets(draggedWidgetKey, targetKey);
    });
  });

  // Pointer Events on Drag Handle
  bindPointerReorder({
    cards, handles,
    cardSelector: ".upper-deck-card",
    keyAttr: "data-upper-widget",
    bodyClass: "upper-dragging",
    onDrop: reorderWidgets
  });
}

function openModuleInOrbital(moduleEl) {
  if (!moduleEl) return;
  let orbId = null;
  if (moduleEl.classList.contains("drone-ch")) orbId = "drone";
  else if (moduleEl.classList.contains("drum-ch")) orbId = "drum";
  else if (moduleEl.classList.contains("chord-ch")) orbId = "chord";
  else if (moduleEl.classList.contains("arp-ch")) orbId = "arp";
  else if (moduleEl.classList.contains("noise-ch")) orbId = "noise";
  else if (moduleEl.classList.contains("field-ch")) orbId = "field";
  else if (moduleEl.classList.contains("pedal-chain-module")) {
    const firstPedal = (Array.isArray(dspChainOrder) && dspChainOrder[0]) ? dspChainOrder[0] : "DRIVE_FILTER";
    orbId = (typeof PEDAL_KEY_TO_ORBITAL_ID !== "undefined" && PEDAL_KEY_TO_ORBITAL_ID[firstPedal]) ? PEDAL_KEY_TO_ORBITAL_ID[firstPedal] : "drv_flt";
  }
  else if (moduleEl.classList.contains("pedal-filter") || moduleEl.classList.contains("pedal-drive") || moduleEl.getAttribute("data-module") === "FILTER" || moduleEl.getAttribute("data-module") === "OVERDRIVE") orbId = "drv_flt";
  else if (moduleEl.classList.contains("pedal-tremolo") || moduleEl.classList.contains("pedal-phaser") || moduleEl.classList.contains("pedal-flanger") || moduleEl.getAttribute("data-module") === "TREMOLO" || moduleEl.getAttribute("data-module") === "PHASER" || moduleEl.getAttribute("data-module") === "FLANGER") orbId = "mod_cluster";
  else if (moduleEl.classList.contains("pedal-delay") || moduleEl.classList.contains("pedal-tape-echo") || moduleEl.getAttribute("data-module") === "DELAY" || moduleEl.getAttribute("data-module") === "TAPE_ECHO") orbId = "tape_dly";
  else if (moduleEl.classList.contains("pedal-digital-delay") || moduleEl.classList.contains("pedal-space-delay") || moduleEl.getAttribute("data-module") === "DIGITAL_DELAY" || moduleEl.getAttribute("data-module") === "SPACE_DELAY") orbId = "dig_dly";
  else if (moduleEl.classList.contains("pedal-space") || moduleEl.classList.contains("pedal-reverb") || moduleEl.getAttribute("data-module") === "SPACE") orbId = "spc_rev";
  else if (moduleEl.classList.contains("space-ch")) orbId = "space";

  if (orbId && typeof expandModuleOrb === "function") {
    expandModuleOrb(orbId);
  }
}

function openMiniPedalInspector(orbId, ev) {
  if (ev) {
    if (typeof ev.stopPropagation === "function") ev.stopPropagation();
    if (typeof ev.preventDefault === "function") ev.preventDefault();
  }
  const orbMap = {
    unit1: "drv_flt",
    drv_flt: "drv_flt",
    filter: "drv_flt",
    FILTER: "drv_flt",
    OVERDRIVE: "drv_flt",
    DRIVE_FILTER: "drv_flt",

    unit2: "mod_cluster",
    mod_cluster: "mod_cluster",
    TREMOLO: "mod_cluster",
    PHASER: "mod_cluster",
    FLANGER: "mod_cluster",
    MOD_CLUSTER: "mod_cluster",

    unit3: "tape_dly",
    tape_dly: "tape_dly",
    delay: "tape_dly",
    DELAY: "tape_dly",
    TAPE_ECHO: "tape_dly",
    ANALOG_DELAY: "tape_dly",

    unit4: "dig_dly",
    dig_dly: "dig_dly",
    DIGITAL_DELAY: "dig_dly",
    SPACE_DELAY: "dig_dly",

    unit5: "spc_rev",
    spc_rev: "spc_rev",
    reverb: "spc_rev",
    SPACE: "spc_rev",
    SPACE_REVERB: "spc_rev",

    master: "space",
    MASTER: "space",
    out: "space",
    OUT: "space",
    space: "space"
  };
  const id = orbMap[orbId] || (orbMap[String(orbId).toLowerCase()] || orbId);
  if (id && typeof expandModuleOrb === "function") {
    expandModuleOrb(id);
  }
}

function initPedalDragAndDrop() {
  const cards = document.querySelectorAll(".pedal-chassis");
  const handles = document.querySelectorAll(".pedal-drag-handle");
  const allModuleCards = document.querySelectorAll(".pedal-chassis, .strip-channel");

  // Reordering via dedicated drag handle (pointer events on handle)
  bindPointerReorder({
    cards, handles,
    cardSelector: ".pedal-chassis",
    keyAttr: "data-module",
    bodyClass: "pedal-dragging",
    onDrop: reorderDspChainModules
  });

  const cardUnder = (ev) => [...cards].find(c => {
    const r = c.getBoundingClientRect();
    return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
  });

  const isInteractive = (target) => {
    return !!target.closest('input, select, button, .custom-dropdown-wrap, .custom-dropdown-trigger, .custom-dropdown-menu, label, canvas, .pedal-drag-handle, .btn-pedal-shift, .btn-power, .btn-mute, .btn-solo, .badge-tag, .module-drawer-toggle, .btn-pedal-action, .birds-eye-flow-bar, .control-row, .pedal-controls-body, .mini-fx-sliders, .mini-fx-slider-row, .mini-pedal-controls, .mini-pedal-param');
  };

  allModuleCards.forEach(card => {
    let pressTimer = null;
    let startX = 0, startY = 0, startTime = 0;
    let isLongPressDrag = false;
    let movedFar = false;
    let activeKey = null;

    card.addEventListener("pointerdown", (e) => {
      // Don't intercept if inside orbital view modal or on an interactive control or pedal-chain-module
      if (card.closest("#orbitalSidePanel") || card.classList.contains("pedal-chain-module")) return;
      if (isInteractive(e.target)) return;

      startX = e.clientX;
      startY = e.clientY;
      startTime = performance.now();
      movedFar = false;
      isLongPressDrag = false;
      activeKey = card.getAttribute("data-module");

      const isPedal = card.classList.contains("pedal-chassis");

      // Long-press detection: press & hold pedal card for 420ms to unlock rack drag reordering
      if (isPedal && activeKey) {
        pressTimer = setTimeout(() => {
          if (!movedFar && activeKey) {
            isLongPressDrag = true;
            if (navigator.vibrate) try { navigator.vibrate(40); } catch(err) {}
            card.classList.add("unlocked-for-drag", "dragging");
            document.body.classList.add("pedal-dragging");
            try { card.setPointerCapture(e.pointerId); } catch(err) {}
          }
        }, 420);
      }

      const onPointerMove = (ev) => {
        const dist = Math.hypot(ev.clientX - startX, ev.clientY - startY);
        if (dist > 8) {
          movedFar = true;
          if (!isLongPressDrag && pressTimer) {
            clearTimeout(pressTimer);
            pressTimer = null;
          }
        }
        if (isLongPressDrag) {
          const over = cardUnder(ev);
          cards.forEach(c => c.classList.toggle("drag-over", c === over));
        }
      };

      const onPointerUp = (ev) => {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);

        if (isLongPressDrag) {
          try { card.releasePointerCapture(ev.pointerId); } catch(err) {}
          card.classList.remove("unlocked-for-drag", "dragging");
          document.body.classList.remove("pedal-dragging");
          cards.forEach(c => c.classList.remove("drag-over"));
          const target = cardUnder(ev);
          const targetKey = target && target.getAttribute("data-module");
          if (targetKey && targetKey !== activeKey) {
            reorderDspChainModules(activeKey, targetKey);
          }
          isLongPressDrag = false;
        } else if (!movedFar && (performance.now() - startTime < 400)) {
          // Direct Touch / Tap on module faceplate -> zoom into Orbital View!
          if (typeof activeModuleView !== "undefined" && activeModuleView === "console") {
            openModuleInOrbital(card);
          }
        }
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
    });
  });
}

// Bidirectional parameter synchronization
// Three reverb "modes" -- distinct pre-baked impulse responses rather than a
// knob that regenerates the IR on every drag (expensive / clicky). Switching
// modes just swaps the convolver's buffer, which is instant.
const REVERB_MODE_PARAMS = {
  PLATE:     { duration: 1.8, decayExp: 1.4 }, // bright, dense, fast-building
  HALL:      { duration: 3.5, decayExp: 2.3 }, // original default character
  CATHEDRAL: { duration: 7.0, decayExp: 3.0 }  // long, diffuse, "infinite space"
};
const reverbImpulseCache = {};
function generateReverbImpulseBuffer(durationSec, decayExp) {
  const rate = audioCtx.sampleRate; const length = Math.floor(rate * durationSec);
  const impulse = audioCtx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const ch = impulse.getChannelData(c);
    for (let i = 0; i < length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decayExp);
    }
  }
  return impulse;
}
function applyReverbMode(mode) {
  if (!audioCtx || !reverbNode) return;
  if (!reverbImpulseCache[mode]) {
    const p = REVERB_MODE_PARAMS[mode] || REVERB_MODE_PARAMS.HALL;
    reverbImpulseCache[mode] = generateReverbImpulseBuffer(p.duration, p.decayExp);
  }
  if (reverbNode.buffer !== reverbImpulseCache[mode]) {
    reverbNode.buffer = reverbImpulseCache[mode];
  }
}

// Chorus "modes" -- which of the 3 pre-built voices are active, their rate
// ratios (slightly different per voice so they drift in and out of phase
// organically), and modulation depth. Classic = 2-voice, Ensemble = all 3
// for a thicker multi-voice wash, Vibrato = 1 voice at deeper depth for a
// pure pitch-wobble with no doubling.
const CHORUS_MODE_PARAMS = {
  CLASSIC:  { gains: [1.0, 1.0, 0.0], rateMults: [1.0, 1.18, 1.0], depthMults: [1.0, 1.0, 1.0] },
  ENSEMBLE: { gains: [0.85, 0.85, 0.85], rateMults: [0.85, 1.15, 1.5], depthMults: [1.0, 1.0, 1.0] },
  VIBRATO:  { gains: [1.0, 0.0, 0.0], rateMults: [1.0, 1.0, 1.0], depthMults: [1.7, 1.0, 1.0] }
};
function applyChorusModeParams() {
  if (!audioCtx || !chorusVoices.length) return;
  const now = audioCtx.currentTime;
  const params = CHORUS_MODE_PARAMS[chorusMode] || CHORUS_MODE_PARAMS.CLASSIC;
  const baseDepthSec = chorusDepthVal * 0.006; // up to ~6ms swing at full depth
  chorusVoices.forEach((v, i) => {
    v.voiceGain.gain.setTargetAtTime(params.gains[i], now, 0.15);
    v.lfo.frequency.setTargetAtTime(chorusRateHz * params.rateMults[i], now, 0.1);
    v.lfoGain.gain.setTargetAtTime(baseDepthSec * params.depthMults[i], now, 0.1);
  });
}

