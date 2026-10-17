// Slambient — Web MIDI Hardware Integration & CC Map
// Handles MIDI input device listening, note triggers, sustain pedal, pitch bend, and hardware CC mappings

let midiAccess = null;
let midiSustainActive = false;
const midiSustainedNotes = new Set();
let midiPitchBendCents = 0;
let midiActivityTimer = null;

function flashMidiActivityIndicator() {
  const btn = document.getElementById("btnHeaderMidi");
  if (!btn) return;
  btn.classList.add("activity");
  clearTimeout(midiActivityTimer);
  midiActivityTimer = setTimeout(() => {
    btn.classList.remove("activity");
  }, 100);
}

function updateMidiStatusUI() {
  const btn = document.getElementById("btnHeaderMidi");
  const lbl = document.getElementById("midiHeaderLabel");
  const hasAccess = !!midiAccess;
  const numInputs = midiAccess ? midiAccess.inputs.size : 0;
  const numOutputs = midiAccess ? midiAccess.outputs.size : 0;
  const isConnected = hasAccess && (numInputs > 0 || numOutputs > 0);

  if (btn) {
    btn.classList.toggle("connected", isConnected);
    btn.title = isConnected
      ? `Web MIDI Active — ${numInputs} In / ${numOutputs} Out (Click for options)`
      : `Web MIDI Offline (Click to connect MIDI keyboard / controller)`;
  }
  if (lbl) {
    if (isConnected) {
      let firstInName = "";
      for (const input of midiAccess.inputs.values()) {
        firstInName = input.name || "";
        break;
      }
      lbl.textContent = firstInName ? firstInName.slice(0, 8).toUpperCase() : "MIDI ON";
    } else {
      lbl.textContent = "MIDI";
    }
  }
}

function toggleMidiConnectionPrompt() {
  if (!navigator.requestMIDIAccess) {
    alert("Web MIDI API is not supported in this browser. Please use Chrome, Edge, or a browser with Web MIDI support.");
    return;
  }
  if (!midiAccess) {
    connectMidi();
  } else {
    const inNames = Array.from(midiAccess.inputs.values()).map(i => i.name).join(", ") || "None";
    const outNames = Array.from(midiAccess.outputs.values()).map(o => o.name).join(", ") || "None";
    const msg = `Web MIDI Status:\n• Inputs: ${inNames}\n• Outputs: ${outNames}\n\nRe-scan devices?`;
    if (window.confirm(msg)) {
      connectMidi();
    }
  }
}

function attachMidiInputs(access) {
  for (let input of access.inputs.values()) {
    input.onmidimessage = (event) => {
      if (!event.data || event.data.length < 2) return;
      const status = event.data[0];
      const cmd = status >> 4;
      const note = event.data[1];
      const vel = event.data.length > 2 ? event.data[2] : 90;

      flashMidiActivityIndicator();

      if (cmd === 9) { // Note On
        if (vel > 0) {
          if (midiSustainedNotes.has(note)) midiSustainedNotes.delete(note);
          startNoteLive(note, vel);
        } else {
          if (midiSustainActive) {
            midiSustainedNotes.add(note);
          } else {
            stopNoteLive(note);
          }
        }
      } else if (cmd === 8) { // Note Off
        if (midiSustainActive) {
          midiSustainedNotes.add(note);
        } else {
          stopNoteLive(note);
        }
      } else if (cmd === 11) { // CC (Control Change)
        const cc = event.data[1];
        const val = event.data.length > 2 ? event.data[2] : 0;
        // CC 64: Sustain Pedal
        if (cc === 64) {
          if (val >= 64) {
            midiSustainActive = true;
          } else {
            midiSustainActive = false;
            for (const n of midiSustainedNotes) {
              stopNoteLive(n);
            }
            midiSustainedNotes.clear();
          }
        }
        // CC 74: Master Filter Cutoff
        else if (cc === 74) {
          const k = document.getElementById("knobMasterCutoff");
          if (k) {
            k.value = ((val / 127) * 100).toFixed(1);
            updateAudioParams();
          }
        }
        // CC 71: Master Filter Resonance
        else if (cc === 71) {
          const k = document.getElementById("knobMasterRes");
          if (k) {
            k.value = (0.5 + (val / 127) * 7.5).toFixed(1);
            updateAudioParams();
          }
        }
        // CC 1: Reverb / Weather Space
        else if (cc === 1) {
          const k = document.getElementById("knobWeather");
          if (k) {
            k.value = Math.round((val / 127) * 100);
            updateAudioParams();
          }
        }
        // CC 7: Master Volume
        else if (cc === 7) {
          const k = document.getElementById("knobMasterVolume");
          if (k) {
            k.value = Math.round((val / 127) * 100);
            updateMasterVolume(k.value);
          }
        }
      } else if (cmd === 14) { // Pitch Bend (0xE0)
        const lsb = event.data[1];
        const msb = event.data.length > 2 ? event.data[2] : 64;
        const raw = ((msb << 7) | lsb) - 8192;
        midiPitchBendCents = (raw / 8192) * 200; // +/- 200 cents
        if (audioCtx) {
          const now = audioCtx.currentTime;
          for (const voice of activeLiveVoices.values()) {
            if (voice.osc1 && voice.osc1.detune) voice.osc1.detune.setValueAtTime(midiPitchBendCents, now);
            if (voice.osc2 && voice.osc2.detune) {
              const baseD = chordTimbre === "SAW_SYNTH" ? 7 : (chordTimbre === "DIGITAL_STRINGS" ? 6.5 : 0);
              voice.osc2.detune.setValueAtTime(baseD + midiPitchBendCents, now);
            }
          }
        }
      }
    };
  }
}

function populateMidiSelect(select, keepId) {
  if (!select) select = document.getElementById("selMidiOut");
  if (!select || !midiAccess) return;
  select.innerHTML = '<option value="">' + (midiAccess.outputs.size ? 'No Output Selected' : 'No Hardware Device Connected') + '</option>';
  for (let output of midiAccess.outputs.values()) {
    const opt = document.createElement("option");
    opt.value = output.id; opt.text = output.name;
    select.appendChild(opt);
  }
  select.value = (keepId && midiAccess.outputs.has(keepId)) ? keepId : "";
  midiOutput = select.value ? midiAccess.outputs.get(select.value) : null;
}

function connectMidi(select) {
  if (!select) select = document.getElementById("selMidiOut");
  if (!navigator.requestMIDIAccess) {
    if (select) select.value = "";
    updateMidiStatusUI();
    return;
  }
  navigator.requestMIDIAccess().then((access) => {
    midiAccess = access;
    if (select) {
      populateMidiSelect(select, null);
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    attachMidiInputs(access);
    updateMidiStatusUI();
    access.onstatechange = () => {
      attachMidiInputs(access);
      if (select) {
        populateMidiSelect(select, midiOutput && midiOutput.id);
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      updateMidiStatusUI();
    };
  }).catch(() => {
    if (select) {
      select.value = "";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    updateMidiStatusUI();
  });
}

(function setupMidiSelect() {
  const select = document.getElementById("selMidiOut");
  if (!select) return;
  if (!navigator.requestMIDIAccess) {
    // e.g. iOS Safari has no Web MIDI: drop the offer instead of a dead option.
    const o = select.querySelector('option[value="__connect"]');
    if (o) o.remove();
    return;
  }
  select.addEventListener("change", () => {
    if (select.value === "__connect") { connectMidi(select); return; }
    if (midiAccess) {
      midiAllNotesOff();
      midiOutput = select.value ? midiAccess.outputs.get(select.value) : null;
      midiSubSync();
    }
  });
})();
