/**
 * Slambient AudioWorklet Clock Processor
 * Delivers sample-accurate real-time audio thread tick pulses.
 * Eliminates timing drift, browser tab throttling, and UI thread jitter.
 */
class ClockProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bpm = 60;
    this.ticksPerBeat = 4;
    this.sampleCount = 0;
    this.running = false;

    this.port.onmessage = (e) => {
      const data = e.data;
      if (!data) return;
      if (data.action === "start") {
        this.running = true;
        this.sampleCount = 0;
        if (typeof data.bpm === "number") this.bpm = data.bpm;
        if (typeof data.ticksPerBeat === "number") this.ticksPerBeat = data.ticksPerBeat;
      } else if (data.action === "stop") {
        this.running = false;
        this.sampleCount = 0;
      } else if (data.action === "setBpm") {
        if (typeof data.bpm === "number") this.bpm = data.bpm;
      } else if (data.action === "setTimeSig") {
        if (typeof data.ticksPerBeat === "number") this.ticksPerBeat = data.ticksPerBeat;
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (!this.running) return true;
    const effectiveBpm = Math.max(30, Math.min(300, this.bpm));
    const samplesPerTick = (sampleRate * 60) / (effectiveBpm * this.ticksPerBeat);

    // AudioWorklet quantum is fixed at 128 samples per block
    this.sampleCount += 128;
    while (this.sampleCount >= samplesPerTick) {
      this.sampleCount -= samplesPerTick;
      this.port.postMessage({ type: "tick", time: currentTime });
    }
    return true;
  }
}

registerProcessor("slambient-clock-processor", ClockProcessor);
