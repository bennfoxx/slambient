/**
 * Slambient Web MIDI Constants & Specifications
 * Channels (0-based for raw bytes, corresponding to MIDI Channels 1-4)
 */

export const MIDI_CH = {
  SUB: 0,      // Channel 1: Deep bass drone & Tanpura
  CHORD: 1,    // Channel 2: Ambient harmonic voicings
  ARP: 2,      // Channel 3: Shimmer arpeggio patterns
  DRUMS: 3,    // Channel 4: Polyrhythmic percussion & Tabla
  MANUAL: 4    // Channel 5: Live user playable keyboard / lead
};

/**
 * General MIDI Drum Mapping (Channel 10 in standard GM, mapped to Channel 4 for DAW stem isolation)
 */
export const MIDI_DRUM_NOTE = {
  KICK: 36,          // Bass Drum 1
  SNARE: 38,         // Acoustic Snare
  HAT: 42,           // Closed Hi-Hat
  HAT_ACCENT: 46,    // Open Hi-Hat
  WOODBLOCK: 76,     // High Wood Block
  DAYAN_OPEN: 63,    // Open Conga / High Tabla Dayan
  DAYAN_MUTE: 62,    // Mute Conga / Slap Dayan
  BAYAN: 64          // Low Conga / Bass Tabla Bayan
};

/**
 * Continuous Controller (CC) Mappings
 */
export const MIDI_CC = {
  MOD_WHEEL: 1,        // Diffusion Master Space / Reverb Depth
  VOLUME: 7,           // Master Bus Volume
  PAN: 10,             // Stereo Panning
  EXPRESSION: 11,      // Voice Dynamics Expression
  SUSTAIN: 64,         // Sustain Damper Pedal (>= 64 is down)
  FILTER_RES: 71,      // Master Filter Resonance (Q)
  FILTER_CUTOFF: 74,   // Master Filter Cutoff Frequency
  ALL_SOUND_OFF: 120,  // Panic Mute
  ALL_NOTES_OFF: 123   // Global Note Off
};

/**
 * Standard MIDI File (SMF) Formatting Constants
 */
export const SMF_DEFAULTS = {
  TICKS_PER_BEAT: 480, // High-resolution PPQ (Pulses Per Quarter note)
  FORMAT_MULTITRACK: 1 // Type 1: synchronous multi-track file
};

// Global fallback for non-module script tag contexts
if (typeof window !== "undefined") {
  window.SlambientMIDIConstants = {
    MIDI_CH,
    MIDI_DRUM_NOTE,
    MIDI_CC,
    SMF_DEFAULTS
  };
  window.MIDI_CH = MIDI_CH;
  window.MIDI_DRUM_NOTE = MIDI_DRUM_NOTE;
  window.MIDI_CC = MIDI_CC;
  window.SMF_DEFAULTS = SMF_DEFAULTS;
}
