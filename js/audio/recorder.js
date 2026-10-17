// Slambient — Master Audio Recorder & Multi-Track Stems Exporter
// Handles 320 kbps MP3 encoding (via dynamic lamejs), lossless WAV, and 5-track Stems ZIP packaging

/* ==========================================================================
   RECORDING -> MP3 (Phase 7)
   Records the master output (post-limiter, pre master volume -- same tap
   point the old MediaRecorder/.webm path used) as raw PCM, then encodes a
   320 kbps stereo MP3 when you stop. Capturing PCM directly instead of
   transcoding MediaRecorder's Opus/WebM avoids stacking two lossy codecs.
   The encoder (lamejs, ~150 KB) is fetched from a CDN the first time you hit
   Record, so the page stays a single dependency-free file until then. If it
   can't load (offline), the take is saved as a lossless .wav instead, so a
   recording is never lost.
   ========================================================================== */
const LAMEJS_URLS = [
  "https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js"
];
const MP3_KBPS = 320;
let lameLoadPromise = null;
let recordTap = null;
let recordSilentOut = null;
let recordChunksL = [];
let recordChunksR = [];
let recordEncoding = false;

function loadLameJs() {
  if (window.lamejs) return Promise.resolve(window.lamejs);
  if (lameLoadPromise) return lameLoadPromise;
  lameLoadPromise = LAMEJS_URLS.reduce((prev, url) => prev.catch(() => new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = url;
    s.async = true;
    s.onload = () => window.lamejs ? resolve(window.lamejs) : reject(new Error("lamejs missing"));
    s.onerror = () => { s.remove(); reject(new Error("load failed: " + url)); };
    document.head.appendChild(s);
  })), Promise.reject(new Error("start")));
  // Let a later Record press retry if every CDN failed this time.
  lameLoadPromise.catch(() => { lameLoadPromise = null; });
  return lameLoadPromise;
}

function setRecordStatus(text) {
  const el = document.getElementById("footerStatus");
  if (el) el.textContent = text;
}

function recordingFileName(ext) {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `slambient-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}.${ext}`;
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none"; a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

function mergeChunks(chunks) {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Float32Array(total);
  let off = 0;
  chunks.forEach(c => { out.set(c, off); off += c.length; });
  return out;
}

function floatToInt16(src, start, end) {
  const out = new Int16Array(end - start);
  for (let i = start; i < end; i++) {
    const s = Math.max(-1, Math.min(1, src[i]));
    out[i - start] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

async function encodeMp3(left, right, sampleRate, onProgress) {
  const lame = await loadLameJs();
  const enc = new lame.Mp3Encoder(2, sampleRate, MP3_KBPS);
  const parts = [];
  const BLOCK = 1152;
  for (let i = 0; i < left.length; i += BLOCK) {
    const end = Math.min(left.length, i + BLOCK);
    const buf = enc.encodeBuffer(floatToInt16(left, i, end), floatToInt16(right, i, end));
    if (buf.length) parts.push(new Uint8Array(buf));
    // Yield every ~200 frames (~5s of audio) so the UI and the music keep
    // running while a long take encodes.
    if ((i / BLOCK) % 200 === 199) {
      onProgress(i / left.length);
      await new Promise(r => setTimeout(r, 0));
    }
  }
  const tail = enc.flush();
  if (tail.length) parts.push(new Uint8Array(tail));
  return new Blob(parts, { type: "audio/mpeg" });
}

function encodeWavBuffer(left, right, sampleRate) {
  const n = left ? left.length : 0;
  const buf = new ArrayBuffer(44 + n * 4);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + n * 4, true); str(8, "WAVE");
  str(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 4, true);
  v.setUint16(32, 4, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, n * 4, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    const l = Math.max(-1, Math.min(1, left[i])), r = Math.max(-1, Math.min(1, right ? right[i] : left[i]));
    v.setInt16(o, l < 0 ? l * 0x8000 : l * 0x7fff, true); o += 2;
    v.setInt16(o, r < 0 ? r * 0x8000 : r * 0x7fff, true); o += 2;
  }
  return buf;
}

function encodeWav(left, right, sampleRate) {
  return new Blob([encodeWavBuffer(left, right, sampleRate)], { type: "audio/wav" });
}

function buildZip(files) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    crcTable[n] = c >>> 0;
  }
  function calcCrc32(bytes) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < bytes.length; i++) crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
    return (crc ^ (-1)) >>> 0;
  }
  const entries = [];
  let offset = 0;
  const encoder = new TextEncoder();
  for (const file of files) {
    const nameBytes = encoder.encode(file.name);
    const dataBytes = file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
    const crc = calcCrc32(dataBytes);
    const size = dataBytes.length;
    const header = new Uint8Array(30 + nameBytes.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, 0x04034b50, true);
    hv.setUint16(4, 20, true);
    hv.setUint16(6, 0, true);
    hv.setUint16(8, 0, true);
    hv.setUint16(10, 0, true);
    hv.setUint16(12, 0, true);
    hv.setUint32(14, crc, true);
    hv.setUint32(18, size, true);
    hv.setUint32(22, size, true);
    hv.setUint16(26, nameBytes.length, true);
    hv.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    entries.push({ nameBytes, dataBytes, header, crc, size, offset });
    offset += header.length + dataBytes.length;
  }
  const cdStart = offset;
  let cdSize = 0;
  const cdEntries = [];
  for (const entry of entries) {
    const cdh = new Uint8Array(46 + entry.nameBytes.length);
    const cv = new DataView(cdh.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, entry.crc, true);
    cv.setUint32(20, entry.size, true);
    cv.setUint32(24, entry.size, true);
    cv.setUint16(28, entry.nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, entry.offset, true);
    cdh.set(entry.nameBytes, 46);
    cdEntries.push(cdh);
    cdSize += cdh.length;
  }
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdStart, true);
  ev.setUint16(20, 0, true);
  const totalLength = offset + cdSize + 22;
  const result = new Uint8Array(totalLength);
  let p = 0;
  for (const entry of entries) {
    result.set(entry.header, p);
    p += entry.header.length;
    result.set(entry.dataBytes, p);
    p += entry.dataBytes.length;
  }
  for (const cdh of cdEntries) {
    result.set(cdh, p);
    p += cdh.length;
  }
  result.set(eocd, p);
  return result;
}

let currentRecordFormat = "MP3";
let stemProcessors = [];
let stemChunks = {
  masterL: [], masterR: [],
  droneL: [], droneR: [],
  drumL: [], drumR: [],
  chordL: [], chordR: [],
  arpL: [], arpR: []
};

async function finishStemsRecording(sampleRate) {
  const btn = document.getElementById("btnRecord");
  const lbl = document.getElementById("btnRecordLabel");
  recordEncoding = true;
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = "Packing ZIP…";

  try {
    const masterL = mergeChunks(stemChunks.masterL), masterR = mergeChunks(stemChunks.masterR);
    if (!masterL.length) { setRecordStatus("Recording was empty -- nothing saved"); return; }
    const droneL = mergeChunks(stemChunks.droneL), droneR = mergeChunks(stemChunks.droneR);
    const drumL = mergeChunks(stemChunks.drumL), drumR = mergeChunks(stemChunks.drumR);
    const chordL = mergeChunks(stemChunks.chordL), chordR = mergeChunks(stemChunks.chordR);
    const arpL = mergeChunks(stemChunks.arpL), arpR = mergeChunks(stemChunks.arpR);
    stemChunks = { masterL: [], masterR: [], droneL: [], droneR: [], drumL: [], drumR: [], chordL: [], chordR: [], arpL: [], arpR: [] };

    setRecordStatus("Encoding 5 stems to 16-bit PCM WAV…");
    const wavMaster = encodeWavBuffer(masterL, masterR, sampleRate);
    const wavDrone  = encodeWavBuffer(droneL, droneR, sampleRate);
    const wavDrum   = encodeWavBuffer(drumL, drumR, sampleRate);
    const wavChord  = encodeWavBuffer(chordL, chordR, sampleRate);
    const wavArp    = encodeWavBuffer(arpL, arpR, sampleRate);

    const patchJson = JSON.stringify(serializeCurrentPatch(), null, 2);
    const hex = "#" + seed.toString(16).toUpperCase().padStart(8, '0').slice(0, 4) + "-" + seed.toString(16).toUpperCase().padStart(8, '0').slice(4);
    const metaTxt = `Slambient Meander Engine -- Multi-Track Stems Take\n`
      + `Date: ${new Date().toISOString()}\n`
      + `BPM: ${bpm}\n`
      + `Time Signature: ${currentTimeSig}\n`
      + `Root Key / Scale: ${document.getElementById("hudScale") ? document.getElementById("hudScale").textContent : ""}\n`
      + `Seed: ${hex}\n\n`
      + `Tracks:\n`
      + `01_master_mix.wav  - Full stereo master output (limiter / post-DSP)\n`
      + `02_sub_drone.wav    - Sub drone & Tanpura acoustic model\n`
      + `03_drums.wav        - Percussion, tabla, clicks & kicks\n`
      + `04_chords_lead.wav  - Harmonic chord voicings & sitar acoustic model\n`
      + `05_shimmer_arp.wav  - Pentatonic generative shimmer arpeggio\n`
      + `patch.json          - Exact recallable synth patch & DSP chain parameters\n`;

    const encoder = new TextEncoder();
    const zipFiles = [
      { name: "01_master_mix.wav", data: new Uint8Array(wavMaster) },
      { name: "02_sub_drone.wav", data: new Uint8Array(wavDrone) },
      { name: "03_drums.wav", data: new Uint8Array(wavDrum) },
      { name: "04_chords_lead.wav", data: new Uint8Array(wavChord) },
      { name: "05_shimmer_arp.wav", data: new Uint8Array(wavArp) },
      { name: "patch.json", data: encoder.encode(patchJson) },
      { name: "session_info.txt", data: encoder.encode(metaTxt) }
    ];

    setRecordStatus("Compressing stems archive…");
    const zipBytes = buildZip(zipFiles);
    const zipBlob = new Blob([zipBytes], { type: "application/zip" });
    const fileName = `slambient-stems-${Date.now()}.zip`;
    downloadBlob(zipBlob, fileName);
    setRecordStatus(`Saved ${fileName} (${(zipBlob.size / 1048576).toFixed(1)} MB, 5 tracks + patch)`);
  } catch (err) {
    console.error("Failed to build stems zip:", err);
    setRecordStatus("Error building stems archive: " + err.message);
  } finally {
    recordEncoding = false;
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = "Record";
  }
}

async function finishSingleRecording(left, right, sampleRate, format) {
  const btn = document.getElementById("btnRecord");
  const lbl = document.getElementById("btnRecordLabel");
  recordEncoding = true;
  if (btn) btn.disabled = true;
  if (lbl) lbl.textContent = "Encoding…";
  const secs = (left.length / sampleRate).toFixed(1);
  try {
    if (!left.length) { setRecordStatus("Recording was empty -- nothing saved"); return; }
    
    if (format === "WAV") {
      setRecordStatus(`Encoding ${secs}s take to Lossless WAV…`);
      const blob = encodeWav(left, right, sampleRate);
      const name = recordingFileName("wav");
      downloadBlob(blob, name);
      setRecordStatus(`Saved ${name} (${(blob.size / 1048576).toFixed(1)} MB Lossless WAV)`);
      return;
    }

    setRecordStatus(`Encoding ${secs}s take to MP3…`);
    let blob, name;
    try {
      blob = await encodeMp3(left, right, sampleRate, p => {
        setRecordStatus(`Encoding ${secs}s take to MP3… ${Math.round(p * 100)}%`);
        if (lbl) lbl.textContent = `MP3 ${Math.round(p * 100)}%`;
      });
      name = recordingFileName("mp3");
    } catch (err) {
      blob = encodeWav(left, right, sampleRate);
      name = recordingFileName("wav");
      setRecordStatus("MP3 encoder couldn't load (offline?) -- saved as WAV instead");
    }
    downloadBlob(blob, name);
    if (name.endsWith(".mp3")) setRecordStatus(`Saved ${name} (${(blob.size / 1048576).toFixed(1)} MB)`);
  } finally {
    recordEncoding = false;
    if (btn) btn.disabled = false;
    if (lbl) lbl.textContent = "Record";
  }
}

function toggleRecord() {
  if (recordEncoding) return;
  if (!audioCtx) initAudio();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  const btn = document.getElementById("btnRecord");
  const lbl = document.getElementById("btnRecordLabel");
  const selFmt = document.getElementById("selRecordFormat");
  currentRecordFormat = (selFmt ? selFmt.value : "MP3").toUpperCase();

  if (!isRecording) {
    if (currentRecordFormat === "MP3") loadLameJs().catch(() => {});
    
    recordChunksL = []; recordChunksR = [];
    stemChunks = {
      masterL: [], masterR: [],
      droneL: [], droneR: [],
      drumL: [], drumR: [],
      chordL: [], chordR: [],
      arpL: [], arpR: []
    };
    stemProcessors = [];

    recordSilentOut = audioCtx.createGain();
    recordSilentOut.gain.value = 0;
    recordSilentOut.connect(audioCtx.destination);

    if (currentRecordFormat === "STEMS") {
      const buses = [
        { node: limiterNode, l: stemChunks.masterL, r: stemChunks.masterR },
        { node: droneAnalyser, l: stemChunks.droneL, r: stemChunks.droneR },
        { node: drumAnalyser, l: stemChunks.drumL, r: stemChunks.drumR },
        { node: chordAnalyser, l: stemChunks.chordL, r: stemChunks.chordR },
        { node: arpAnalyser, l: stemChunks.arpL, r: stemChunks.arpR }
      ];

      buses.forEach(b => {
        if (!b.node) return;
        const proc = audioCtx.createScriptProcessor(4096, 2, 2);
        proc.channelCount = 2;
        proc.channelCountMode = "explicit";
        proc.onaudioprocess = (e) => {
          if (!isRecording) return;
          b.l.push(new Float32Array(e.inputBuffer.getChannelData(0)));
          b.r.push(new Float32Array(e.inputBuffer.getChannelData(1)));
          if (b.l.length >= 31600) {
            setRecordStatus("45-min recording limit reached — saving take…");
            setTimeout(() => { if (isRecording) toggleRecord(); }, 10);
          }
        };
        try {
          b.node.connect(proc);
          proc.connect(recordSilentOut);
          stemProcessors.push({ node: b.node, proc });
        } catch (e) {
          console.warn("Failed to tap bus for stems:", e);
        }
      });
    } else {
      recordTap = audioCtx.createScriptProcessor(4096, 2, 2);
      recordTap.channelCount = 2;
      recordTap.channelCountMode = "explicit";
      recordTap.onaudioprocess = (e) => {
        if (!isRecording) return;
        recordChunksL.push(new Float32Array(e.inputBuffer.getChannelData(0)));
        recordChunksR.push(new Float32Array(e.inputBuffer.getChannelData(1)));
        if (recordChunksL.length >= 31600) {
          setRecordStatus("45-min recording limit reached — saving take to protect memory…");
          setTimeout(() => { if (isRecording) toggleRecord(); }, 10);
        }
      };
      limiterNode.connect(recordTap);
      recordTap.connect(recordSilentOut);
    }

    isRecording = true;
    btn.classList.add("recording");
    lbl.textContent = "Stop & Save";
    setRecordStatus(`Recording (${currentRecordFormat})…`);
  } else {
    isRecording = false;
    btn.classList.remove("recording");

    if (stemProcessors.length) {
      stemProcessors.forEach(sp => {
        try { sp.node.disconnect(sp.proc); } catch (e) {}
        try { sp.proc.disconnect(); } catch (e) {}
      });
      stemProcessors = [];
    }
    if (recordTap) {
      try { limiterNode.disconnect(recordTap); } catch (e) {}
      try { recordTap.disconnect(); } catch (e) {}
      recordTap = null;
    }
    if (recordSilentOut) {
      try { recordSilentOut.disconnect(); } catch (e) {}
      recordSilentOut = null;
    }

    if (currentRecordFormat === "STEMS") {
      finishStemsRecording(audioCtx.sampleRate);
    } else {
      const left = mergeChunks(recordChunksL), right = mergeChunks(recordChunksR);
      recordChunksL = []; recordChunksR = [];
      finishSingleRecording(left, right, audioCtx.sampleRate, currentRecordFormat);
    }
  }
}
