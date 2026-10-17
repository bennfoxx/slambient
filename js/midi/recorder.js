/**
 * Slambient In-Browser MIDI Session Recorder & Stem Exporter
 * Captures high-resolution generative and manual performance events
 * and exports Type 1 multi-track Standard MIDI Files (.mid) and stem tracks.
 */

import { MIDI_CH, MIDI_CC, SMF_DEFAULTS } from './constants.js';
import { createStandardMidiFile, createMidiBlob } from './file-writer.js';

export class MidiSessionRecorder {
  constructor(options = {}) {
    this.ticksPerBeat = options.ticksPerBeat || SMF_DEFAULTS.TICKS_PER_BEAT;
    this.isRecording = false;
    this.startTime = 0;
    this.currentBpm = 72;
    this.currentMeter = { num: 4, den: 4 };

    // Track event buffers
    this.tracks = {
      conductor: [],
      sub: [],
      chords: [],
      arp: [],
      drums: [],
      manual: []
    };

    // Active unclosed note-ons to ensure note-offs are guaranteed upon stop
    this.activeNotes = new Map();
  }

  /**
   * Starts a new recording session, initializing time baselines.
   * @param {Object} initialState - { bpm, meterNum, meterDen }
   */
  start(initialState = {}) {
    this.isRecording = true;
    this.startTime = performance.now();
    this.currentBpm = initialState.bpm || 72;
    this.currentMeter = {
      num: initialState.meterNum || 4,
      den: initialState.meterDen || 4
    };

    // Reset track buffers
    for (const key of Object.keys(this.tracks)) {
      this.tracks[key] = [];
    }
    this.activeNotes.clear();

    // Record initial conductor meta events at t = 0
    this.recordTempo(this.currentBpm, 0);
    this.recordTimeSignature(this.currentMeter.num, this.currentMeter.den, 0);
  }

  /**
   * Calculates absolute tick position from an event timestamp in milliseconds.
   * @param {number} timeMs - Timestamp relative to session start
   * @returns {number}
   */
  timeMsToTicks(timeMs) {
    // ticks = (timeMs / 1000) * (BPM / 60) * PPQ
    const beats = (timeMs / 1000) * (this.currentBpm / 60);
    return Math.max(0, Math.round(beats * this.ticksPerBeat));
  }

  /**
   * Records a tempo change event.
   * @param {number} bpm
   * @param {number} [timeMs]
   */
  recordTempo(bpm, timeMs = null) {
    if (!this.isRecording && timeMs === null) return;
    const t = timeMs !== null ? timeMs : (performance.now() - this.startTime);
    this.currentBpm = bpm;

    // Tempo meta event: FF 51 03 tt tt tt (microseconds per quarter note)
    const usPerBeat = Math.round(60000000 / Math.max(20, Math.min(300, bpm)));
    const b0 = (usPerBeat >> 16) & 0xFF;
    const b1 = (usPerBeat >> 8) & 0xFF;
    const b2 = usPerBeat & 0xFF;

    this.tracks.conductor.push({
      timeMs: t,
      isMeta: true,
      metaType: 0x51,
      metaData: [b0, b1, b2]
    });
  }

  /**
   * Records a time signature change event.
   * @param {number} num - Numerator (e.g. 7 in 7/4)
   * @param {number} den - Denominator (e.g. 4 in 7/4)
   * @param {number} [timeMs]
   */
  recordTimeSignature(num, den, timeMs = null) {
    if (!this.isRecording && timeMs === null) return;
    const t = timeMs !== null ? timeMs : (performance.now() - this.startTime);
    this.currentMeter = { num, den };

    // den power: 2 -> 1 (half), 4 -> 2 (quarter), 8 -> 3 (eighth)
    let denPower = Math.round(Math.log2(den));
    if (isNaN(denPower) || denPower < 0) denPower = 2;

    this.tracks.conductor.push({
      timeMs: t,
      isMeta: true,
      metaType: 0x58,
      metaData: [num & 0xFF, denPower & 0xFF, 24, 8]
    });
  }

  /**
   * Records a Note On event.
   * @param {string} trackKey - 'sub' | 'chords' | 'arp' | 'drums' | 'manual'
   * @param {number} note - MIDI note number (0-127)
   * @param {number} velocity - Velocity (1-127)
   * @param {number} [channel] - MIDI channel (0-15)
   */
  recordNoteOn(trackKey, note, velocity = 90, channel = null) {
    if (!this.isRecording || !this.tracks[trackKey]) return;
    const timeMs = performance.now() - this.startTime;
    const ch = channel !== null ? channel : (MIDI_CH[trackKey.toUpperCase()] ?? 0);
    const vel = Math.max(1, Math.min(127, Math.round(velocity)));

    this.tracks[trackKey].push({
      timeMs,
      isMeta: false,
      status: 0x90 | (ch & 0x0F),
      data: [note & 0x7F, vel]
    });

    const activeKey = `${trackKey}:${note}:${ch}`;
    this.activeNotes.set(activeKey, { trackKey, note, ch });
  }

  /**
   * Records a Note Off event.
   * @param {string} trackKey - 'sub' | 'chords' | 'arp' | 'drums' | 'manual'
   * @param {number} note - MIDI note number (0-127)
   * @param {number} [channel] - MIDI channel (0-15)
   */
  recordNoteOff(trackKey, note, channel = null) {
    if (!this.isRecording || !this.tracks[trackKey]) return;
    const timeMs = performance.now() - this.startTime;
    const ch = channel !== null ? channel : (MIDI_CH[trackKey.toUpperCase()] ?? 0);

    this.tracks[trackKey].push({
      timeMs,
      isMeta: false,
      status: 0x80 | (ch & 0x0F),
      data: [note & 0x7F, 0]
    });

    const activeKey = `${trackKey}:${note}:${ch}`;
    this.activeNotes.delete(activeKey);
  }

  /**
   * Records a timed note (both on and off automatically).
   * @param {string} trackKey
   * @param {number} note
   * @param {number} velocity
   * @param {number} durationSec
   * @param {number} [delaySec=0]
   */
  recordNoteTimed(trackKey, note, velocity, durationSec, delaySec = 0) {
    if (!this.isRecording) return;
    const now = performance.now() - this.startTime;
    const startMs = now + (delaySec * 1000);
    const endMs = startMs + (Math.max(0.02, durationSec) * 1000);
    const ch = MIDI_CH[trackKey.toUpperCase()] ?? 0;
    const vel = Math.max(1, Math.min(127, Math.round(velocity)));

    this.tracks[trackKey].push({
      timeMs: startMs,
      isMeta: false,
      status: 0x90 | (ch & 0x0F),
      data: [note & 0x7F, vel]
    });

    this.tracks[trackKey].push({
      timeMs: endMs,
      isMeta: false,
      status: 0x80 | (ch & 0x0F),
      data: [note & 0x7F, 0]
    });
  }

  /**
   * Stops the active session, resolving all pending notes with Note Off.
   */
  stop() {
    if (!this.isRecording) return;
    const timeMs = performance.now() - this.startTime;

    // Send Note-Off for any remaining held notes
    for (const [key, item] of this.activeNotes.entries()) {
      if (this.tracks[item.trackKey]) {
        this.tracks[item.trackKey].push({
          timeMs,
          isMeta: false,
          status: 0x80 | (item.ch & 0x0F),
          data: [item.note & 0x7F, 0]
        });
      }
    }
    this.activeNotes.clear();
    this.isRecording = false;
  }

  /**
   * Prepares a raw track array by sorting events chronologically and calculating delta ticks.
   * @param {Array<Object>} rawEvents
   * @returns {Array<Object>}
   */
  prepareTrackEvents(rawEvents) {
    // Sort strictly by timestamp; note-offs preferred over note-ons at exact same timestamp
    const sorted = [...rawEvents].sort((a, b) => {
      if (Math.abs(a.timeMs - b.timeMs) > 0.001) {
        return a.timeMs - b.timeMs;
      }
      // Note off (0x80) before note on (0x90) if same note
      const aType = a.isMeta ? 0 : (a.status & 0xF0);
      const bType = b.isMeta ? 0 : (b.status & 0xF0);
      return aType - bType;
    });

    let lastTick = 0;
    return sorted.map(ev => {
      const currentTick = this.timeMsToTicks(ev.timeMs);
      const deltaTicks = Math.max(0, currentTick - lastTick);
      lastTick = currentTick;
      return {
        ...ev,
        deltaTicks
      };
    });
  }

  /**
   * Generates raw Uint8Array of the Type 1 Standard MIDI File (.mid).
   * @returns {Uint8Array}
   */
  exportMultiTrackMidiBytes() {
    const trackConfigs = [
      { name: "Tempo & Conductor", events: this.prepareTrackEvents(this.tracks.conductor) },
      { name: "Sub Bass & Drone", events: this.prepareTrackEvents(this.tracks.sub) },
      { name: "Chords & Voicing", events: this.prepareTrackEvents(this.tracks.chords) },
      { name: "Shimmer Arp", events: this.prepareTrackEvents(this.tracks.arp) },
      { name: "Organic Drums", events: this.prepareTrackEvents(this.tracks.drums) }
    ];

    if (this.tracks.manual.length > 0) {
      trackConfigs.push({
        name: "Manual Lead & Keys",
        events: this.prepareTrackEvents(this.tracks.manual)
      });
    }

    return createStandardMidiFile(trackConfigs, this.ticksPerBeat);
  }

  /**
   * Generates a unified Type 1 Standard MIDI File (.mid) with all tracks synchronized as a Blob.
   * @returns {Blob}
   */
  exportMultiTrackMidi() {
    const smfBuffer = this.exportMultiTrackMidiBytes();
    return createMidiBlob(smfBuffer);
  }

  /**
   * Generates individual track stems as separate MIDI files.
   * @returns {Array<{ name: string, filename: string, bytes: Uint8Array, blob: Blob }>}
   */
  exportStems() {
    const stems = [];
    const conductorEvents = this.prepareTrackEvents(this.tracks.conductor);

    const instrumentKeys = [
      { key: "sub", label: "Sub Bass", filename: "slambient_sub.mid" },
      { key: "chords", label: "Chords", filename: "slambient_chords.mid" },
      { key: "arp", label: "Shimmer Arp", filename: "slambient_arp.mid" },
      { key: "drums", label: "Organic Drums", filename: "slambient_drums.mid" }
    ];

    if (this.tracks.manual.length > 0) {
      instrumentKeys.push({
        key: "manual",
        label: "Manual Lead",
        filename: "slambient_lead.mid"
      });
    }

    for (const inst of instrumentKeys) {
      const instEvents = this.prepareTrackEvents(this.tracks[inst.key]);
      const tracks = [
        { name: "Tempo", events: conductorEvents },
        { name: inst.label, events: instEvents }
      ];
      const bytes = createStandardMidiFile(tracks, this.ticksPerBeat);
      stems.push({
        name: inst.label,
        filename: inst.filename,
        bytes,
        blob: createMidiBlob(bytes)
      });
    }

    return stems;
  }

  /**
   * Helper utility to prompt browser download for a Blob.
   * @param {Blob} blob
   * @param {string} filename
   */
  static downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }
}

// Global singleton instance
export const midiRecorder = new MidiSessionRecorder();

// Global fallback for script tag contexts
if (typeof window !== "undefined") {
  window.SlambientMidiRecorder = {
    MidiSessionRecorder,
    midiRecorder
  };
  window.midiRecorder = midiRecorder;
  window.MidiSessionRecorder = MidiSessionRecorder;
}
