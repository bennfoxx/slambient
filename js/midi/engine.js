/**
 * Slambient Web MIDI Hardware & Software Engine
 * Handles bi-directional Web MIDI I/O and bridges to the Session Recorder.
 */

import { MIDI_CH, MIDI_DRUM_NOTE, MIDI_CC } from './constants.js';
import { midiRecorder } from './recorder.js';

export class MidiEngine {
  constructor() {
    this.midiAccess = null;
    this.midiOutput = null;
    this.midiSustainActive = false;
    this.midiSustainedNotes = new Set();
    this.midiPitchBendCents = 0;
    this.midiSubNote = null;
    this.activityTimer = null;

    // Callbacks for external app integration
    this.callbacks = {
      onNoteStart: null,     // (note, velocity) => {}
      onNoteStop: null,      // (note) => {}
      onFilterCutoff: null,  // (value0to100) => {}
      onFilterRes: null,     // (value0to10) => {}
      onReverbSpace: null,   // (value0to100) => {}
      onMasterVolume: null,  // (value0to100) => {}
      onActivity: null,      // () => {}
      onStatusChange: null   // (isConnected, inNames, outNames) => {}
    };
  }

  /**
   * Sets hooks for synthesizer voice and parameter updates.
   * @param {Object} cbs
   */
  setCallbacks(cbs) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  /**
   * Requests Web MIDI API access and attaches device listeners.
   * @returns {Promise<MIDIAccess|null>}
   */
  async requestAccess() {
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      console.warn("Web MIDI API is not supported in this environment.");
      return null;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.attachInputs();
      this.midiAccess.onstatechange = () => {
        this.attachInputs();
        this.notifyStatusChange();
      };
      this.notifyStatusChange();
      return this.midiAccess;
    } catch (err) {
      console.warn("Web MIDI access request was rejected or failed:", err);
      this.notifyStatusChange();
      return null;
    }
  }

  /**
   * Attaches event listeners to all connected MIDI input devices.
   */
  attachInputs() {
    if (!this.midiAccess) return;

    for (const input of this.midiAccess.inputs.values()) {
      input.onmidimessage = (event) => this.handleMidiMessage(event);
    }
  }

  /**
   * Dispatches incoming raw MIDI messages (Notes, CC, Pitch Bend).
   * @param {MIDIMessageEvent} event
   */
  handleMidiMessage(event) {
    if (!event.data || event.data.length < 2) return;
    const status = event.data[0];
    const cmd = status >> 4;
    const note = event.data[1];
    const vel = event.data.length > 2 ? event.data[2] : 90;

    this.flashActivity();

    // 1. Note On
    if (cmd === 9) {
      if (vel > 0) {
        if (this.midiSustainedNotes.has(note)) this.midiSustainedNotes.delete(note);
        if (this.callbacks.onNoteStart) this.callbacks.onNoteStart(note, vel);
        // Feed into session recorder
        if (midiRecorder.isRecording) midiRecorder.recordNoteOn('manual', note, vel);
      } else {
        this.handleNoteOff(note);
      }
    }
    // 2. Note Off
    else if (cmd === 8) {
      this.handleNoteOff(note);
    }
    // 3. Control Change (CC)
    else if (cmd === 11) {
      const cc = event.data[1];
      const val = event.data.length > 2 ? event.data[2] : 0;
      this.handleControlChange(cc, val);
    }
    // 4. Pitch Bend
    else if (cmd === 14) {
      const lsb = event.data[1];
      const msb = event.data.length > 2 ? event.data[2] : 64;
      const raw = ((msb << 7) | lsb) - 8192;
      this.midiPitchBendCents = (raw / 8192) * 200; // +/- 200 cents
      if (this.callbacks.onPitchBend) this.callbacks.onPitchBend(this.midiPitchBendCents);
    }
  }

  handleNoteOff(note) {
    if (this.midiSustainActive) {
      this.midiSustainedNotes.add(note);
    } else {
      if (this.callbacks.onNoteStop) this.callbacks.onNoteStop(note);
      if (midiRecorder.isRecording) midiRecorder.recordNoteOff('manual', note);
    }
  }

  handleControlChange(cc, val) {
    // Sustain pedal
    if (cc === MIDI_CC.SUSTAIN) {
      if (val >= 64) {
        this.midiSustainActive = true;
      } else {
        this.midiSustainActive = false;
        for (const n of this.midiSustainedNotes) {
          if (this.callbacks.onNoteStop) this.callbacks.onNoteStop(n);
          if (midiRecorder.isRecording) midiRecorder.recordNoteOff('manual', n);
        }
        this.midiSustainedNotes.clear();
      }
    }
    // Filter Cutoff (CC 74)
    else if (cc === MIDI_CC.FILTER_CUTOFF) {
      const pct = (val / 127) * 100;
      if (this.callbacks.onFilterCutoff) this.callbacks.onFilterCutoff(pct);
    }
    // Filter Resonance (CC 71)
    else if (cc === MIDI_CC.FILTER_RES) {
      const res = 0.5 + (val / 127) * 7.5;
      if (this.callbacks.onFilterRes) this.callbacks.onFilterRes(res);
    }
    // Reverb Diffusion Space (CC 1)
    else if (cc === MIDI_CC.MOD_WHEEL) {
      const pct = Math.round((val / 127) * 100);
      if (this.callbacks.onReverbSpace) this.callbacks.onReverbSpace(pct);
    }
    // Master Volume (CC 7)
    else if (cc === MIDI_CC.VOLUME) {
      const pct = Math.round((val / 127) * 100);
      if (this.callbacks.onMasterVolume) this.callbacks.onMasterVolume(pct);
    }
  }

  /**
   * Sets active hardware/software destination output.
   * @param {string} outputId
   */
  setOutput(outputId) {
    if (!this.midiAccess) return;
    this.allNotesOff();
    this.midiOutput = outputId ? this.midiAccess.outputs.get(outputId) : null;
  }

  /**
   * Sends Note On to the active output destination and logs to recorder.
   * @param {number} ch - 0-based MIDI channel
   * @param {number} note
   * @param {number} vel
   * @param {string} [trackKey]
   */
  noteOn(ch, note, vel = 90, trackKey = null) {
    if (this.midiOutput) {
      try {
        this.midiOutput.send([0x90 | (ch & 0x0F), note & 0x7F, Math.max(1, Math.min(127, Math.round(vel)))]);
      } catch (e) {}
    }
    if (trackKey && midiRecorder.isRecording) {
      midiRecorder.recordNoteOn(trackKey, note, vel, ch);
    }
  }

  /**
   * Sends Note Off to active output destination and logs to recorder.
   * @param {number} ch
   * @param {number} note
   * @param {string} [trackKey]
   */
  noteOff(ch, note, trackKey = null) {
    if (this.midiOutput) {
      try {
        this.midiOutput.send([0x80 | (ch & 0x0F), note & 0x7F, 0]);
      } catch (e) {}
    }
    if (trackKey && midiRecorder.isRecording) {
      midiRecorder.recordNoteOff(trackKey, note, ch);
    }
  }

  /**
   * Sends a note with specified duration and optional pre-delay.
   * @param {number} ch
   * @param {number} note
   * @param {number} vel
   * @param {number} durationSec
   * @param {number} [delaySec=0]
   * @param {string} [trackKey]
   */
  noteTimed(ch, note, vel, durationSec, delaySec = 0, trackKey = null) {
    if (this.midiOutput) {
      const out = this.midiOutput;
      setTimeout(() => {
        if (this.midiOutput !== out) return;
        this.noteOn(ch, note, vel);
        setTimeout(() => this.noteOff(ch, note), Math.max(20, durationSec * 1000));
      }, delaySec * 1000);
    }
    if (trackKey && midiRecorder.isRecording) {
      midiRecorder.recordNoteTimed(trackKey, note, vel, durationSec, delaySec);
    }
  }

  /**
   * Sends a drum hit on the drum channel (Ch 4) using the General MIDI map.
   * @param {string} key - e.g. 'KICK', 'SNARE', 'HAT', 'BAYAN'
   * @param {number} [vel=100]
   */
  drumHit(key, vel = 100) {
    const note = MIDI_DRUM_NOTE[key] || 36;
    this.noteTimed(MIDI_CH.DRUMS, note, vel, 0.1, 0, 'drums');
  }

  /**
   * Synchronizes the held Sub/Drone note on Channel 1.
   * @param {number} note
   */
  subSync(note) {
    if (note === this.midiSubNote) return;
    if (this.midiSubNote !== null) {
      this.noteOff(MIDI_CH.SUB, this.midiSubNote, 'sub');
    }
    this.midiSubNote = note;
    if (note !== null) {
      this.noteOn(MIDI_CH.SUB, note, 95, 'sub');
    }
  }

  /**
   * Transmits All Notes Off / Panic on all 16 MIDI channels.
   */
  allNotesOff() {
    this.midiSubNote = null;
    if (!this.midiOutput) return;
    for (let ch = 0; ch < 16; ch++) {
      try {
        this.midiOutput.send([0xB0 | ch, MIDI_CC.ALL_NOTES_OFF, 0]);
        this.midiOutput.send([0xB0 | ch, MIDI_CC.ALL_SOUND_OFF, 0]);
      } catch (e) {}
    }
  }

  flashActivity() {
    if (this.callbacks.onActivity) this.callbacks.onActivity();
  }

  notifyStatusChange() {
    if (!this.callbacks.onStatusChange) return;
    const hasAccess = !!this.midiAccess;
    const numInputs = this.midiAccess ? this.midiAccess.inputs.size : 0;
    const numOutputs = this.midiAccess ? this.midiAccess.outputs.size : 0;
    const inNames = this.midiAccess ? Array.from(this.midiAccess.inputs.values()).map(i => i.name) : [];
    const outNames = this.midiAccess ? Array.from(this.midiAccess.outputs.values()).map(o => o.name) : [];
    this.callbacks.onStatusChange(hasAccess && (numInputs > 0 || numOutputs > 0), inNames, outNames);
  }
}

// Global singleton instance
export const midiEngine = new MidiEngine();

// Global fallback for script tag contexts
if (typeof window !== "undefined") {
  window.SlambientMidiEngine = {
    MidiEngine,
    midiEngine
  };
  window.midiEngine = midiEngine;
}
