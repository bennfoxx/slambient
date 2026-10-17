/**
 * Slambient Standard MIDI File (SMF Type 1) Binary Writer
 * Pure vanilla JavaScript with zero external dependencies.
 * Exports synchronized multi-track .mid files and stem tracks.
 */

import { SMF_DEFAULTS } from './constants.js';

/**
 * Encodes an unsigned integer into a Variable-Length Quantity (VLQ) byte array.
 * @param {number} value
 * @returns {number[]}
 */
export function encodeVLQ(value) {
  let val = Math.max(0, Math.floor(value));
  const buffer = [val & 0x7F];
  while ((val >>= 7) > 0) {
    buffer.unshift((val & 0x7F) | 0x80);
  }
  return buffer;
}

/**
 * Converts a string into an ASCII byte array.
 * @param {string} str
 * @returns {number[]}
 */
export function stringToBytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    bytes.push(str.charCodeAt(i) & 0xFF);
  }
  return bytes;
}

/**
 * Converts a 16-bit integer to two big-endian bytes.
 * @param {number} val
 * @returns {number[]}
 */
export function toUint16Bytes(val) {
  return [(val >> 8) & 0xFF, val & 0xFF];
}

/**
 * Converts a 32-bit integer to four big-endian bytes.
 * @param {number} val
 * @returns {number[]}
 */
export function toUint32Bytes(val) {
  return [
    (val >> 24) & 0xFF,
    (val >> 16) & 0xFF,
    (val >> 8) & 0xFF,
    val & 0xFF
  ];
}

/**
 * Builds a binary MTrk chunk from a sorted list of timed MIDI events.
 * Events must have: { deltaTicks, status, data: number[] } or meta properties.
 * @param {Array<Object>} events - Chronologically sorted events
 * @param {string} [trackName] - Optional track name
 * @returns {Uint8Array}
 */
export function buildTrackChunk(events, trackName = "") {
  const trackBytes = [];

  // Track Name Meta Event
  if (trackName) {
    const nameBytes = stringToBytes(trackName);
    trackBytes.push(0x00); // delta 0
    trackBytes.push(0xFF, 0x03); // Meta Track Name
    trackBytes.push(...encodeVLQ(nameBytes.length));
    trackBytes.push(...nameBytes);
  }

  // Iterate events and encode delta-time + payload
  let lastStatus = 0;
  for (const ev of events) {
    const delta = encodeVLQ(ev.deltaTicks || 0);
    trackBytes.push(...delta);

    if (ev.isMeta) {
      trackBytes.push(0xFF, ev.metaType);
      trackBytes.push(...encodeVLQ(ev.metaData.length));
      trackBytes.push(...ev.metaData);
      lastStatus = 0; // Meta events cancel running status
    } else {
      // Channel event: status + data bytes
      trackBytes.push(ev.status);
      if (ev.data && ev.data.length > 0) {
        trackBytes.push(...ev.data);
      }
      lastStatus = ev.status;
    }
  }

  // End of Track Meta Event (FF 2F 00)
  trackBytes.push(0x00); // delta 0
  trackBytes.push(0xFF, 0x2F, 0x00);

  // Package into MTrk chunk: 'MTrk' (4 bytes) + Length (4 bytes) + trackBytes
  const header = [0x4D, 0x54, 0x72, 0x6B]; // 'MTrk'
  const lengthBytes = toUint32Bytes(trackBytes.length);

  const fullTrack = new Uint8Array(8 + trackBytes.length);
  fullTrack.set(header, 0);
  fullTrack.set(lengthBytes, 4);
  fullTrack.set(trackBytes, 8);

  return fullTrack;
}

/**
 * Builds a complete Standard MIDI File (SMF Type 1 multi-track or Type 0 single-track).
 * @param {Array<{ name: string, events: Array<Object> }>} tracks
 * @param {number} [ticksPerBeat=480]
 * @returns {Uint8Array}
 */
export function createStandardMidiFile(tracks, ticksPerBeat = SMF_DEFAULTS.TICKS_PER_BEAT) {
  if (!tracks || tracks.length === 0) {
    throw new Error("Cannot create MIDI file with 0 tracks.");
  }

  const format = tracks.length === 1 ? 0 : SMF_DEFAULTS.FORMAT_MULTITRACK;
  const numTracks = tracks.length;

  // Header Chunk 'MThd' (14 bytes total)
  const headerBytes = [
    0x4D, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // Chunk length (6 bytes)
    ...toUint16Bytes(format),
    ...toUint16Bytes(numTracks),
    ...toUint16Bytes(ticksPerBeat)
  ];

  const trackChunks = tracks.map(t => buildTrackChunk(t.events, t.name));
  const totalTrackBytes = trackChunks.reduce((acc, chunk) => acc + chunk.length, 0);

  const midiFileBuffer = new Uint8Array(headerBytes.length + totalTrackBytes);
  midiFileBuffer.set(headerBytes, 0);

  let offset = headerBytes.length;
  for (const chunk of trackChunks) {
    midiFileBuffer.set(chunk, offset);
    offset += chunk.length;
  }

  return midiFileBuffer;
}

/**
 * Creates a Blob representation ready for in-browser download or storage.
 * @param {Uint8Array} midiBytes
 * @returns {Blob}
 */
export function createMidiBlob(midiBytes) {
  return new Blob([midiBytes], { type: "audio/midi" });
}

// Global fallback for script tag contexts
if (typeof window !== "undefined") {
  window.SlambientMidiFileWriter = {
    encodeVLQ,
    stringToBytes,
    buildTrackChunk,
    createStandardMidiFile,
    createMidiBlob
  };
}
