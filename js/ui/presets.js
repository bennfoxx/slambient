/* ==========================================================================
   PRESET SOUND DESIGN MATRIX (15 Distinct Acoustic Worlds)
   Couples each inspiration to its authentic modal scale, signature voicings,
   rhythmic meter (Tala), spatial staging, and 10-pedal DSP chain.
   ========================================================================== */
const PRESET_SOUND_DESIGN_MATRIX = {
  // 0. NOSTALGIA — Boards of Canada (The Campfire Headphase)
  0: {
    name: "Nostalgia",
    scale: "DORIAN",
    signatureVoicing: "DORIAN_SO_WHAT",
    timeSig: "4/4",
    bpm: 68,
    tanpura: false,
    synth: { preset: "WARM_ANALOG", vol: 82, sustain: 110, dynamics: 80, strum: 65, fxSend: 85 },
    arp: { pattern: "PENDULUM", timbre: "KALIMBA", gate: 340, rest: 35, vol: 72, fxSend: 75 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "TAPE_DUB", vol: 64, punch: 72, density: 40, fxSend: 45 },
    noise: { profile: "WHITE_TAPE", mode: "GUSTS", vol: 32, color: 38, drift: 65, fxSend: 60 },
    fxChain: {
      order: ["TUBE_DRIVE", "OPTICAL_TREMOLO", "SPACE_DELAY", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, ECHO: true, FILTER: false },
      params: {
        TUBE_DRIVE: { drive: 36, tone: 42, mix: 55 },
        OPTICAL_TREMOLO: { rate: 2.2, depth: 45, stereo: true },
        SPACE_DELAY: { time: 540, flutter: 52, diffusion: 65, mix: 44 },
        SPACE: { size: 68, damp: 45, mix: 42 }
      }
    }
  },

  // 1. ORGANIC — Four Tet (Rounds / Morning Evening)
  1: {
    name: "Organic",
    scale: "PENTATONIC",
    signatureVoicing: "OPEN_QUINTAL_PENT",
    timeSig: "7/4",
    bpm: 78,
    tanpura: false,
    synth: { preset: "VIBES_CELESTE", vol: 80, sustain: 95, dynamics: 90, strum: 45, fxSend: 70 },
    arp: { pattern: "SHIMMER", timbre: "WATER_DROPLET", gate: 240, rest: 20, vol: 84, fxSend: 80 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "FOUR_TET_GLITCH", vol: 76, punch: 85, density: 70, fxSend: 50 },
    noise: { profile: "BROOK", mode: "RHYTHMIC", vol: 24, color: 62, drift: 45, fxSend: 55 },
    fxChain: {
      order: ["TUBE_DRIVE", "ECHO", "OPTICAL_TREMOLO", "FILTER", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, SPACE_DELAY: true },
      params: {
        TUBE_DRIVE: { drive: 28, tone: 60, mix: 40 },
        ECHO: { time: 320, feedback: 42, mix: 38 },
        OPTICAL_TREMOLO: { rate: 4.8, depth: 35, stereo: true },
        FILTER: { cutoff: 3200, res: 2.2, topology: "SEM_12DB" }
      }
    }
  },

  // 2. SHIMMER — Brian Eno & Harold Budd (The Pearl)
  2: {
    name: "Shimmer",
    scale: "MAJOR9",
    signatureVoicing: "PRISM_MAJ9_WIDE",
    timeSig: "3/4",
    bpm: 58,
    tanpura: false,
    synth: { preset: "PURE_GLASS", vol: 86, sustain: 150, dynamics: 85, strum: 90, fxSend: 92 },
    arp: { pattern: "SHIMMER", timbre: "GLASS_FM", gate: 480, rest: 45, vol: 78, fxSend: 95 },
    drums: { enabled: false, kit: "MINIMAL_CLICK", groove: "ORGANIC", vol: 0, punch: 0, density: 0, fxSend: 0 },
    noise: { profile: "WIND", mode: "STORM_SWELL", vol: 20, color: 55, drift: 70, fxSend: 70 },
    fxChain: {
      order: ["DIGITAL_DELAY", "PHASER", "SPACE"],
      bypass: { TUBE_DRIVE: true, OPTICAL_TREMOLO: true, FLANGER: true, ECHO: true, SPACE_DELAY: true },
      params: {
        DIGITAL_DELAY: { time: "3/16", feedback: 55, mix: 48 },
        PHASER: { rate: 0.18, depth: 55, feedback: 30 },
        SPACE: { size: 92, damp: 25, mix: 65 }
      }
    }
  },

  // 3. HAUNTOLOGY — The Caretaker (An Empty Bliss Beyond This World)
  3: {
    name: "Hauntology",
    scale: "AEOLIAN",
    signatureVoicing: "NORDIC_SUS2_B6",
    timeSig: "3/4",
    bpm: 52,
    tanpura: false,
    synth: { preset: "CHAMBER_WOODS", vol: 78, sustain: 120, dynamics: 70, strum: 110, fxSend: 88 },
    arp: { pattern: "UP", timbre: "MUSIC_BOX", gate: 360, rest: 50, vol: 65, fxSend: 82 },
    drums: { enabled: false, kit: "ORGANIC_KIT", groove: "MINIMAL_CLICK", vol: 0, punch: 0, density: 0, fxSend: 0 },
    noise: { profile: "WHITE_TAPE", mode: "CONTINUOUS", vol: 38, color: 32, drift: 50, fxSend: 75 },
    fxChain: {
      order: ["TAPE_ECHO", "TUBE_DRIVE", "SPACE_DELAY", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, OPTICAL_TREMOLO: true },
      params: {
        TAPE_ECHO: { time: 480, feedback: 48, mix: 45 },
        TUBE_DRIVE: { drive: 42, tone: 32, mix: 60 },
        SPACE_DELAY: { time: 620, flutter: 75, diffusion: 70, mix: 40 }
      }
    }
  },

  // 4. VELVET — Pastoral Ambient (Windham Hill / Eno)
  4: {
    name: "Velvet",
    scale: "MAJ_PENTATONIC",
    signatureVoicing: "PASTORAL_69_SPREAD",
    timeSig: "4/4",
    bpm: 64,
    tanpura: false,
    synth: { preset: "WARM_ANALOG", vol: 84, sustain: 130, dynamics: 80, strum: 75, fxSend: 80 },
    arp: { pattern: "PENDULUM", timbre: "CONCERT_HARP", gate: 380, rest: 30, vol: 78, fxSend: 75 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "HEARTBEAT", vol: 48, punch: 60, density: 30, fxSend: 35 },
    noise: { profile: "BROOK", mode: "CONTINUOUS", vol: 20, color: 48, drift: 40, fxSend: 50 },
    fxChain: {
      order: ["PHASER", "TUBE_DRIVE", "SPACE_DELAY", "SPACE"],
      bypass: { FLANGER: true, DIGITAL_DELAY: true, OPTICAL_TREMOLO: true, ECHO: true },
      params: {
        PHASER: { rate: 0.25, depth: 65, feedback: 25 },
        TUBE_DRIVE: { drive: 22, tone: 52, mix: 35 },
        SPACE: { size: 75, damp: 40, mix: 45 }
      }
    }
  },

  // 5. PALE BLOOM — Arvo Pärt (Tintinnabuli)
  5: {
    name: "Pale Bloom",
    scale: "AEOLIAN",
    signatureVoicing: "DEEP_AEOLIAN_9TH",
    timeSig: "4/4",
    bpm: 48,
    tanpura: false,
    synth: { preset: "CELESTIAL_FLUTE", vol: 85, sustain: 160, dynamics: 90, strum: 120, fxSend: 95 },
    arp: { pattern: "UP", timbre: "SINE_CRYSTAL", gate: 600, rest: 60, vol: 70, fxSend: 90 },
    drums: { enabled: false, kit: "ORGANIC_KIT", groove: "ORGANIC", vol: 0, punch: 0, density: 0, fxSend: 0 },
    noise: { profile: "WIND", mode: "SPARSE", vol: 18, color: 40, drift: 60, fxSend: 60 },
    fxChain: {
      order: ["SPACE_DELAY", "SPACE"],
      bypass: { TUBE_DRIVE: true, OPTICAL_TREMOLO: true, PHASER: true, FLANGER: true, DIGITAL_DELAY: true, ECHO: true },
      params: {
        SPACE_DELAY: { time: 720, flutter: 15, diffusion: 80, mix: 50 },
        SPACE: { size: 96, damp: 20, mix: 70 }
      }
    }
  },

  // 6. GREEN — Hiroshi Yoshimura (Green / Surround — Kankyō Ongaku)
  6: {
    name: "Green",
    scale: "HIRAJOSHI",
    signatureVoicing: "HIRAJOSHI_QUINTAL",
    timeSig: "3/4",
    bpm: 62,
    tanpura: false,
    synth: { preset: "PURE_GLASS", vol: 82, sustain: 120, dynamics: 85, strum: 80, fxSend: 75 },
    arp: { pattern: "SHIMMER", timbre: "WATER_DROPLET", gate: 280, rest: 40, vol: 86, fxSend: 85 },
    drums: { enabled: false, kit: "MINIMAL_CLICK", groove: "ORGANIC", vol: 0, punch: 0, density: 0, fxSend: 0 },
    noise: { profile: "BROOK", mode: "CONTINUOUS", vol: 26, color: 65, drift: 50, fxSend: 60 },
    fxChain: {
      order: ["DIGITAL_DELAY", "SPACE_DELAY", "SPACE"],
      bypass: { TUBE_DRIVE: true, OPTICAL_TREMOLO: true, PHASER: true, FLANGER: true, ECHO: true, FILTER: true },
      params: {
        DIGITAL_DELAY: { time: "3/16", feedback: 42, mix: 38 },
        SPACE_DELAY: { time: 580, flutter: 12, diffusion: 70, mix: 45 },
        SPACE: { size: 78, damp: 35, mix: 48 }
      }
    }
  },

  // 7. LINEAGE — Ustad Allauddin Khan (Maihar Gharana Morning Raga)
  7: {
    name: "Lineage",
    scale: "BHAIRAV",
    signatureVoicing: "MAIHAR_RESONANCE",
    timeSig: "7/4", // Rupak Tala (3+2+2)
    bpm: 72,
    tanpura: true,
    tanpuraParams: { volume: 22, javari: 58 },
    synth: { preset: "SITAR_STRINGS", vol: 85, sustain: 110, dynamics: 85, strum: 85, fxSend: 82 },
    arp: { pattern: "PENDULUM", timbre: "BANSURI_FLUTE", gate: 420, rest: 25, vol: 82, fxSend: 80 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "TABLA_RUPAK", vol: 74, punch: 68, density: 65, fxSend: 45 },
    noise: { profile: "WIND", mode: "SPARSE", vol: 15, color: 42, drift: 35, fxSend: 40 },
    fxChain: {
      order: ["FILTER", "SPACE_DELAY", "SPACE"],
      bypass: { TUBE_DRIVE: true, OPTICAL_TREMOLO: true, PHASER: true, FLANGER: true, DIGITAL_DELAY: true, ECHO: true },
      params: {
        FILTER: { cutoff: 3800, res: 2.8, topology: "FORMANT_VOCAL" },
        SPACE_DELAY: { time: 440, flutter: 20, diffusion: 60, mix: 40 },
        SPACE: { size: 84, damp: 30, mix: 45 }
      }
    }
  },

  // 8. AFTER HOURS — Lofi / Late Night Tape
  8: {
    name: "After Hours",
    scale: "DORIAN",
    signatureVoicing: "WARM_9TH",
    timeSig: "4/4",
    bpm: 66,
    tanpura: false,
    synth: { preset: "WARM_ANALOG", vol: 84, sustain: 100, dynamics: 80, strum: 60, fxSend: 75 },
    arp: { pattern: "UP", timbre: "PIZZICATO_STRING", gate: 260, rest: 30, vol: 76, fxSend: 70 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "TAPE_DUB", vol: 78, punch: 80, density: 50, fxSend: 45 },
    noise: { profile: "WHITE_TAPE", mode: "CONTINUOUS", vol: 34, color: 36, drift: 45, fxSend: 50 },
    fxChain: {
      order: ["TUBE_DRIVE", "OPTICAL_TREMOLO", "ECHO", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, SPACE_DELAY: true },
      params: {
        TUBE_DRIVE: { drive: 30, tone: 46, mix: 45 },
        OPTICAL_TREMOLO: { rate: 3.2, depth: 38, stereo: true },
        ECHO: { time: 380, feedback: 40, mix: 35 }
      }
    }
  },

  // 9. AIRPORTS — Brian Eno (Ambient 1: Music for Airports)
  9: {
    name: "Airports",
    scale: "LYDIAN",
    signatureVoicing: "LYDIAN_ETHER",
    timeSig: "4/4",
    bpm: 54,
    tanpura: false,
    synth: { preset: "PURE_GLASS", vol: 88, sustain: 180, dynamics: 85, strum: 130, fxSend: 95 },
    arp: { pattern: "SHIMMER", timbre: "MUSIC_BOX", gate: 520, rest: 55, vol: 74, fxSend: 92 },
    drums: { enabled: false, kit: "ORGANIC_KIT", groove: "ORGANIC", vol: 0, punch: 0, density: 0, fxSend: 0 },
    noise: { profile: "WHITE_TAPE", mode: "CONTINUOUS", vol: 20, color: 45, drift: 60, fxSend: 70 },
    fxChain: {
      order: ["SPACE_DELAY", "SPACE"],
      bypass: { TUBE_DRIVE: true, OPTICAL_TREMOLO: true, PHASER: true, FLANGER: true, DIGITAL_DELAY: true, ECHO: true },
      params: {
        SPACE_DELAY: { time: 820, flutter: 25, diffusion: 85, mix: 55 },
        SPACE: { size: 98, damp: 18, mix: 75 }
      }
    }
  },

  // 10. DOUGLAS FIRS — Angelo Badalamenti (Twin Peaks / Julee Cruise)
  10: {
    name: "Douglas Firs",
    scale: "AEOLIAN",
    signatureVoicing: "DEEP_AEOLIAN_9TH",
    timeSig: "6/8", // Noir ballad
    bpm: 54,
    tanpura: false,
    synth: { preset: "VIBES_CELESTE", vol: 86, sustain: 160, dynamics: 75, strum: 75, fxSend: 82 },
    arp: { pattern: "PENDULUM", timbre: "GLASS_FM", gate: 520, rest: 45, vol: 68, fxSend: 75 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "HEARTBEAT", vol: 60, punch: 65, density: 35, fxSend: 40 },
    noise: { profile: "RAIN", mode: "GUSTS", vol: 28, color: 42, drift: 65, fxSend: 65 },
    fxChain: {
      order: ["OPTICAL_TREMOLO", "TUBE_DRIVE", "SPACE_DELAY", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, ECHO: true },
      params: {
        OPTICAL_TREMOLO: { rate: 2.8, depth: 65, stereo: true }, // Signature noir guitar tremolo
        TUBE_DRIVE: { drive: 24, tone: 40, mix: 40 },
        SPACE_DELAY: { time: 580, flutter: 42, diffusion: 65, mix: 44 }
      }
    }
  },

  // 11. TWINNING — Aphex Twin (Selected Ambient Works Vol II / Drukqs)
  11: {
    name: "Twinning",
    scale: "PHRYGIAN",
    signatureVoicing: "PHRYGIAN_DARK_HALO",
    timeSig: "5/8", // Asymmetric polyrhythmic braindance
    bpm: 86,
    tanpura: false,
    synth: { preset: "PURE_GLASS", vol: 80, sustain: 90, dynamics: 92, strum: 40, fxSend: 78 },
    arp: { pattern: "SHIMMER", timbre: "KALIMBA", gate: 220, rest: 20, vol: 85, fxSend: 85 },
    drums: { enabled: true, kit: "MINIMAL_CLICK", groove: "FOUR_TET_GLITCH", vol: 82, punch: 90, density: 75, fxSend: 55 },
    noise: { profile: "WHITE_TAPE", mode: "RHYTHMIC", vol: 24, color: 70, drift: 55, fxSend: 65 },
    fxChain: {
      order: ["FLANGER", "TUBE_DRIVE", "DIGITAL_DELAY", "PHASER"],
      bypass: { OPTICAL_TREMOLO: true, ECHO: true, SPACE_DELAY: true, SPACE: false },
      params: {
        FLANGER: { rate: 0.35, depth: 75, feedback: 60 },
        TUBE_DRIVE: { drive: 45, tone: 68, mix: 50 },
        DIGITAL_DELAY: { time: "3/16", feedback: 55, mix: 42 },
        PHASER: { rate: 0.8, depth: 60, feedback: 40 }
      }
    }
  },

  // 12. TANGERINE — Tangerine Dream (Phaedra / Rubycon — Berlin School)
  12: {
    name: "Tangerine",
    scale: "DORIAN",
    signatureVoicing: "QUARTAL_STACK",
    timeSig: "4/4",
    bpm: 114,
    tanpura: false,
    synth: { preset: "WARM_ANALOG", vol: 78, sustain: 140, dynamics: 75, strum: 60, fxSend: 85 },
    arp: { pattern: "UP", timbre: "GLASS_FM", gate: 240, rest: 10, vol: 90, fxSend: 88 },
    drums: { enabled: true, kit: "MINIMAL_CLICK", groove: "ORGANIC", vol: 65, punch: 75, density: 55, fxSend: 40 },
    noise: { profile: "WIND", mode: "GUSTS", vol: 22, color: 55, drift: 60, fxSend: 60 },
    fxChain: {
      order: ["PHASER", "DIGITAL_DELAY", "SPACE"],
      bypass: { TUBE_DRIVE: true, OPTICAL_TREMOLO: true, FLANGER: true, ECHO: true, SPACE_DELAY: true },
      params: {
        PHASER: { rate: 0.45, depth: 80, feedback: 50 }, // Iconic 12-pole Moog phaser sweep
        DIGITAL_DELAY: { time: "3/16", feedback: 52, mix: 48 }, // Dotted-8th Berlin school sequence
        SPACE: { size: 82, damp: 30, mix: 50 }
      }
    }
  },

  // 13. DISINTEGRATION — William Basinski (The Disintegration Loops)
  13: {
    name: "Disintegration",
    scale: "LYDIAN",
    signatureVoicing: "LYDIAN_ETHER",
    timeSig: "4/4",
    bpm: 50,
    tanpura: false,
    synth: { preset: "CHAMBER_WOODS", vol: 86, sustain: 160, dynamics: 70, strum: 110, fxSend: 92 },
    arp: { pattern: "PENDULUM", timbre: "WATER_DROPLET", gate: 480, rest: 40, vol: 65, fxSend: 80 },
    drums: { enabled: false, kit: "ORGANIC_KIT", groove: "ORGANIC", vol: 0, punch: 0, density: 0, fxSend: 0 },
    noise: { profile: "WHITE_TAPE", mode: "CONTINUOUS", vol: 36, color: 28, drift: 65, fxSend: 70 },
    fxChain: {
      order: ["TAPE_ECHO", "TUBE_DRIVE", "SPACE_DELAY", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, OPTICAL_TREMOLO: true },
      params: {
        TAPE_ECHO: { time: 640, feedback: 55, mix: 52 },
        TUBE_DRIVE: { drive: 38, tone: 34, mix: 55 },
        SPACE_DELAY: { time: 780, flutter: 85, diffusion: 75, mix: 45 }
      }
    }
  },

  // 14. CHILLHOP — Sunday Morning Vinyl Tape Beats
  14: {
    name: "Chillhop",
    scale: "MAJOR9",
    signatureVoicing: "PRISM_MAJ9_WIDE",
    timeSig: "4/4",
    bpm: 74,
    tanpura: false,
    synth: { preset: "VIBES_CELESTE", vol: 82, sustain: 100, dynamics: 80, strum: 50, fxSend: 75 },
    arp: { pattern: "UP", timbre: "CONCERT_HARP", gate: 300, rest: 30, vol: 75, fxSend: 72 },
    drums: { enabled: true, kit: "ORGANIC_KIT", groove: "TAPE_DUB", vol: 82, punch: 85, density: 60, fxSend: 45 },
    noise: { profile: "WHITE_TAPE", mode: "GUSTS", vol: 30, color: 40, drift: 50, fxSend: 50 },
    fxChain: {
      order: ["TUBE_DRIVE", "ECHO", "OPTICAL_TREMOLO", "SPACE"],
      bypass: { PHASER: true, FLANGER: true, DIGITAL_DELAY: true, SPACE_DELAY: true },
      params: {
        TUBE_DRIVE: { drive: 26, tone: 48, mix: 40 },
        ECHO: { time: 340, feedback: 38, mix: 32 },
        OPTICAL_TREMOLO: { rate: 3.6, depth: 30, stereo: true }
      }
    }
  }
};

if (typeof window !== "undefined") {
  window.PRESET_SOUND_DESIGN_MATRIX = PRESET_SOUND_DESIGN_MATRIX;
}
if (typeof global !== "undefined") {
  global.PRESET_SOUND_DESIGN_MATRIX = PRESET_SOUND_DESIGN_MATRIX;
}

/* ==========================================================================
   DYNAMIC SIGNATURE FX CHAINS FOR FACTORY PRESETS (0 - 14)
   ========================================================================== */
const PRESET_FX_CONFIGS = {
  // 0: Nostalgia (Warm tape pads, music box arp, drifting sub)
  // Signature FX: Tube Drive + Optical Tremolo + Space Delay
  0: {
    chain: ["OVERDRIVE", "TREMOLO", "SPACE_DELAY", "FILTER", "SPACE", "DELAY", "DIGITAL_DELAY", "TAPE_ECHO", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: false,
      FILTER: true,
      TREMOLO: false,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: false,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      OVERDRIVE: { drive: 1.8, tone: 3200, mix: 42 },
      TREMOLO: { rate: 1.8, depth: 55, pan: 60 },
      SPACE_DELAY: { time: 0.48, flutter: 38, mix: 45 },
      SPACE: { decay: 68, chorus: 30, mix: 48 }
    }
  },

  // 1: Green / Yoshimura & Organic (Hiroshi Yoshimura acoustic naturalism, crystal drops, temple stones)
  // Signature FX: Digital Ping-Pong Delay + Space Delay (Zero Tube Drive, Zero Flanger)
  1: {
    chain: ["DIGITAL_DELAY", "SPACE_DELAY", "SPACE", "FILTER", "DELAY", "TAPE_ECHO", "TREMOLO", "PHASER", "FLANGER", "OVERDRIVE"],
    bypass: {
      OVERDRIVE: true, // Zero Tube Drive
      FILTER: true,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,   // Zero Flanger
      DELAY: true,
      DIGITAL_DELAY: false, // Active Ping-Pong Delay
      SPACE_DELAY: false,   // Active Space Delay
      TAPE_ECHO: true,
      SPACE: false          // Active Ambient Space
    },
    params: {
      OVERDRIVE: { drive: 0.2, tone: 5000, mix: 0 },
      FLANGER: { rate: 0.1, depth: 0, feedback: 0 },
      DIGITAL_DELAY: { time: 0.375, feedback: 46, mix: 42 },
      SPACE_DELAY: { time: 0.52, flutter: 16, mix: 45 },
      SPACE: { decay: 78, chorus: 24, mix: 46 }
    }
  },

  // 2: Shimmer Cascade (7/8 Lydian string swells, glass FM chimes, cathedral wash)
  // Signature FX: Multi-Stage Phaser + Digital Delay + Space Reverb
  2: {
    chain: ["PHASER", "DIGITAL_DELAY", "SPACE", "SPACE_DELAY", "FILTER", "DELAY", "TREMOLO", "TAPE_ECHO", "OVERDRIVE", "FLANGER"],
    bypass: {
      OVERDRIVE: true,
      FILTER: true,
      TREMOLO: true,
      PHASER: false,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: false,
      SPACE_DELAY: true,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      PHASER: { rate: 0.18, depth: 55, feedback: 45 },
      DIGITAL_DELAY: { time: 0.44, feedback: 55, mix: 45 },
      SPACE: { decay: 85, chorus: 45, mix: 65 }
    }
  },

  // 3: Hauntological Tape (5/4 Aeolian dub echo, tape flutter, chamber woods)
  // Signature FX: Tube Drive + Tape Echo + Space Reverb
  3: {
    chain: ["OVERDRIVE", "TAPE_ECHO", "SPACE_DELAY", "SPACE", "FILTER", "DELAY", "DIGITAL_DELAY", "TREMOLO", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: false,
      FILTER: true,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: false,
      TAPE_ECHO: false,
      SPACE: false
    },
    params: {
      OVERDRIVE: { drive: 2.6, tone: 2400, mix: 50 },
      TAPE_ECHO: { speed: 0.85, inertia: 0.22, mix: 52 },
      SPACE_DELAY: { time: 0.55, flutter: 50, mix: 40 },
      SPACE: { decay: 72, chorus: 35, mix: 50 }
    }
  },

  // 4: Velvet Horizon (4/4 Major 9 celestial organ, water droplet arp, deep sub)
  // Signature FX: Resonant Filter + Optical Tremolo + Space Delay + Space Reverb
  4: {
    chain: ["FILTER", "TREMOLO", "SPACE_DELAY", "SPACE", "DELAY", "DIGITAL_DELAY", "TAPE_ECHO", "OVERDRIVE", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: true,
      FILTER: false,
      TREMOLO: false,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: false,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      FILTER: { cutoff: 3200, res: 1.8, lfo: 25 },
      TREMOLO: { rate: 2.2, depth: 45, pan: 55 },
      SPACE_DELAY: { time: 0.58, flutter: 32, mix: 44 },
      SPACE: { decay: 80, chorus: 40, mix: 60 }
    }
  },

  // 5: Pale Bloom (3/4 Major Pentatonic minimal clicks, celesta, pizzicato strings)
  // Signature FX: Digital Delay + Space Delay + Space Reverb (delicate acoustic diffusion)
  5: {
    chain: ["DIGITAL_DELAY", "SPACE_DELAY", "SPACE", "FILTER", "DELAY", "TAPE_ECHO", "TREMOLO", "PHASER", "FLANGER", "OVERDRIVE"],
    bypass: {
      OVERDRIVE: true,
      FILTER: true,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: false,
      SPACE_DELAY: false,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      DIGITAL_DELAY: { time: 0.28, feedback: 38, mix: 35 },
      SPACE_DELAY: { time: 0.45, flutter: 15, mix: 40 },
      SPACE: { decay: 72, chorus: 28, mix: 52 }
    }
  },

  // 6: Kankyō Green (Hiroshi Yoshimura & Midori Takada environmental acoustics, crystal drops, temple chimes & binaural mist)
  // Signature FX: Digital Ping-Pong Delay + Space Delay (Zero Tube Drive, Zero Flanger)
  6: {
    chain: ["DIGITAL_DELAY", "SPACE_DELAY", "SPACE", "FILTER", "DELAY", "TAPE_ECHO", "TREMOLO", "PHASER", "FLANGER", "OVERDRIVE"],
    bypass: {
      OVERDRIVE: true, // Zero Tube Drive
      FILTER: true,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,   // Zero Flanger
      DELAY: true,
      DIGITAL_DELAY: false, // Active Ping-Pong Delay
      SPACE_DELAY: false,   // Active Space Delay
      TAPE_ECHO: true,
      SPACE: false          // Active Ambient Space
    },
    params: {
      OVERDRIVE: { drive: 0.2, tone: 5000, mix: 0 },
      FLANGER: { rate: 0.1, depth: 0, feedback: 0 },
      DIGITAL_DELAY: { time: 0.48, feedback: 42, mix: 44 },
      SPACE_DELAY: { time: 0.62, flutter: 12, mix: 46 },
      SPACE: { decay: 82, chorus: 35, mix: 55 }
    }
  },

  // 7: Classical Lineage (Indian Classical Raga / Maihar Tradition)
  // Signature FX: Resonant Filter + Space Delay + Cathedral Reverb
  7: {
    chain: ["FILTER", "SPACE_DELAY", "SPACE", "TAPE_ECHO", "DELAY", "DIGITAL_DELAY", "TREMOLO", "PHASER", "FLANGER", "OVERDRIVE"],
    bypass: {
      OVERDRIVE: true,
      FILTER: false,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: false,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      FILTER: { cutoff: 2600, res: 3.2, lfo: 30 },
      SPACE_DELAY: { time: 0.54, flutter: 24, mix: 48 },
      SPACE: { decay: 88, chorus: 42, mix: 58 }
    }
  },

  // 8: After Hours Deep (Super Chill Deep House)
  // Signature FX: Tube Drive + Filter + Tape Delay + Digital Delay + Space Reverb
  8: {
    chain: ["OVERDRIVE", "FILTER", "DELAY", "DIGITAL_DELAY", "SPACE", "SPACE_DELAY", "TAPE_ECHO", "TREMOLO", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: false,
      FILTER: false,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: false,
      DIGITAL_DELAY: true,
      SPACE_DELAY: true,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      OVERDRIVE: { drive: 1.5, tone: 4200, mix: 35 },
      FILTER: { cutoff: 1800, res: 2.2, lfo: 20 },
      DELAY: { time: 0.375, feedback: 38, mix: 42 },
      SPACE: { decay: 60, chorus: 30, mix: 45 }
    }
  },

  // 9: Airports (Generative Tape Loops & Glass Diffusion)
  // Signature FX: Space Delay + Tape Echo + Space Reverb
  9: {
    chain: ["SPACE_DELAY", "TAPE_ECHO", "SPACE", "FILTER", "DELAY", "DIGITAL_DELAY", "TREMOLO", "PHASER", "FLANGER", "OVERDRIVE"],
    bypass: {
      OVERDRIVE: true,
      FILTER: true,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: false,
      TAPE_ECHO: false,
      SPACE: false
    },
    params: {
      SPACE_DELAY: { time: 0.72, flutter: 35, mix: 52 },
      TAPE_ECHO: { speed: 0.9, inertia: 0.25, mix: 48 },
      SPACE: { decay: 92, chorus: 50, mix: 65 }
    }
  },

  // 10: Douglas Firs (Noir Vibraphone Ballad & Rain Mist)
  // Signature FX: Optical Tremolo + Tape Echo + Tube Warmth
  10: {
    chain: ["TREMOLO", "TAPE_ECHO", "OVERDRIVE", "SPACE", "FILTER", "DELAY", "DIGITAL_DELAY", "SPACE_DELAY", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: false, // Tube Warmth
      FILTER: true,
      TREMOLO: false,   // Optical Tremolo
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: true,
      TAPE_ECHO: false, // Tape Echo
      SPACE: false
    },
    params: {
      TREMOLO: { rate: 3.2, depth: 65, pan: 70 },
      TAPE_ECHO: { speed: 0.95, inertia: 0.16, mix: 48 },
      OVERDRIVE: { drive: 1.6, tone: 2800, mix: 40 },
      SPACE: { decay: 78, chorus: 38, mix: 55 }
    }
  },

  // 11: Twinning (Braindance Micro-Poly & IDM Breakbeat Pocket)
  // Signature FX: Analog Flanger + Tube Drive + Ping-Pong Delay
  11: {
    chain: ["FLANGER", "OVERDRIVE", "DIGITAL_DELAY", "FILTER", "SPACE", "DELAY", "SPACE_DELAY", "TAPE_ECHO", "TREMOLO", "PHASER"],
    bypass: {
      OVERDRIVE: false,     // Tube Drive
      FILTER: false,
      TREMOLO: true,
      PHASER: true,
      FLANGER: false,       // Analog Flanger
      DELAY: true,
      DIGITAL_DELAY: false, // Ping-Pong Delay
      SPACE_DELAY: true,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      FLANGER: { rate: 0.22, depth: 75, feedback: 55 },
      OVERDRIVE: { drive: 3.2, tone: 4800, mix: 45 },
      DIGITAL_DELAY: { time: 0.26, feedback: 48, mix: 45 },
      FILTER: { cutoff: 3600, res: 2.8, lfo: 40 },
      SPACE: { decay: 62, chorus: 30, mix: 42 }
    }
  },

  // 12: Tangerine (Berlin School Analog Sequencer)
  // Signature FX: Multi-Stage Phaser + Dotted-8th Delay
  12: {
    chain: ["PHASER", "DIGITAL_DELAY", "FILTER", "SPACE", "DELAY", "SPACE_DELAY", "TAPE_ECHO", "OVERDRIVE", "TREMOLO", "FLANGER"],
    bypass: {
      OVERDRIVE: true,
      FILTER: false,
      TREMOLO: true,
      PHASER: false,        // Multi-Stage Phaser
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: false, // Dotted-8th Delay
      SPACE_DELAY: true,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      PHASER: { rate: 0.42, depth: 78, feedback: 65 },
      DIGITAL_DELAY: { time: 0.375, feedback: 52, mix: 50 },
      FILTER: { cutoff: 4200, res: 3.5, lfo: 45 },
      SPACE: { decay: 70, chorus: 35, mix: 50 }
    }
  },

  // 13: Disintegration (Degraded Tape Loops & Muffled Repeats)
  // Signature FX: Heavy Tape Echo flutter + Tube Lo-Fi Tone + Space
  13: {
    chain: ["TAPE_ECHO", "SPACE_DELAY", "OVERDRIVE", "SPACE", "FILTER", "DELAY", "DIGITAL_DELAY", "TREMOLO", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: false,   // Tube Lo-Fi Tone
      FILTER: true,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: true,
      DIGITAL_DELAY: true,
      SPACE_DELAY: false, // Heavy flutter diffusion
      TAPE_ECHO: false,   // Heavy Tape Echo
      SPACE: false
    },
    params: {
      TAPE_ECHO: { speed: 0.72, inertia: 0.35, mix: 58 },
      SPACE_DELAY: { time: 0.65, flutter: 75, mix: 52 },
      OVERDRIVE: { drive: 3.8, tone: 2100, mix: 55 },
      SPACE: { decay: 88, chorus: 45, mix: 62 }
    }
  },

  // 14: Lo-Fi Chillhop (Boom-Bap Swing, Rhodes Chords, Rain/Vinyl Texture)
  // Signature FX: Tube Drive + Filter + Tape Delay + Space Reverb
  14: {
    chain: ["OVERDRIVE", "FILTER", "DELAY", "SPACE", "DIGITAL_DELAY", "SPACE_DELAY", "TAPE_ECHO", "TREMOLO", "PHASER", "FLANGER"],
    bypass: {
      OVERDRIVE: false, // Warm tube saturation
      FILTER: false,
      TREMOLO: true,
      PHASER: true,
      FLANGER: true,
      DELAY: false,     // Tape Delay
      DIGITAL_DELAY: true,
      SPACE_DELAY: true,
      TAPE_ECHO: true,
      SPACE: false
    },
    params: {
      OVERDRIVE: { drive: 2.4, tone: 2800, mix: 48 },
      FILTER: { cutoff: 1950, res: 1.8, lfo: 18 },
      DELAY: { time: 0.32, feedback: 32, mix: 35 },
      SPACE: { decay: 55, chorus: 25, mix: 40 }
    }
  }
};

if (typeof window !== "undefined") {
  window.PRESET_FX_CONFIGS = PRESET_FX_CONFIGS;
}

function applyPresetFxConfig(idx) {
  const config = PRESET_FX_CONFIGS[idx];
  if (!config) return;

  const fxMgr = (typeof slambientFxRackManager !== "undefined" && slambientFxRackManager) ||
                (typeof window !== "undefined" && (window.slambientFxRackManager || window.fxRackManager));

  if (fxMgr && typeof fxMgr.loadChainPreset === "function") {
    fxMgr.loadChainPreset(config);
  } else {
    if (Array.isArray(config.chain) && config.chain.length > 0) {
      if (typeof dspChainOrder !== "undefined" && Array.isArray(dspChainOrder)) {
        dspChainOrder.length = 0;
        dspChainOrder.push(...config.chain);
      }
    }
    if (config.bypass && typeof config.bypass === "object" && typeof pedalBypassState !== "undefined") {
      Object.keys(config.bypass).forEach(k => {
        pedalBypassState[k] = !!config.bypass[k];
        if (typeof document !== "undefined") {
          const card = document.getElementById("pedalCard_" + k);
          const btn = document.getElementById("stompBtn_" + k);
          if (card) card.classList.toggle("bypassed", pedalBypassState[k]);
          if (btn) btn.classList.toggle("active", !pedalBypassState[k]);
        }
      });
    }
    if (config.params && typeof config.params === "object") {
      Object.keys(config.params).forEach(k => {
        if (typeof fxParamsState !== "undefined") {
          if (!fxParamsState[k]) fxParamsState[k] = {};
          Object.assign(fxParamsState[k], config.params[k]);
        }
        if (typeof document !== "undefined") {
          Object.keys(config.params[k]).forEach(pId => {
            const val = config.params[k][pId];
            const slider = document.getElementById(`slider_${k}_${pId}`);
            if (slider) slider.value = val;
            const lbl = document.getElementById(`lbl_${k}_${pId}`);
            if (lbl && typeof formatFxParamValue === "function" && typeof PEDAL_REGISTRY !== "undefined") {
              const reg = PEDAL_REGISTRY[k];
              const pMeta = reg && reg.params && reg.params.find(p => p.id === pId);
              lbl.textContent = formatFxParamValue(pMeta, val);
            }
          });
        }
      });
    }
    if (typeof rewireDspChain === "function" && typeof dspChainOrder !== "undefined") {
      rewireDspChain(dspChainOrder, false);
    }
    if (typeof updatePedalsOrderUI === "function") {
      updatePedalsOrderUI();
    }
  }
}

function applyPreset(idx) {
  document.querySelectorAll(".preset-bar button").forEach((b, i) => b.classList.toggle("active", i === idx));

  // Ensure randomization from the beginning on EVERY PRESET:
  // Each time a preset is selected it starts on a new root note and chord shape
  rootNote = randRange(0, 11);
  currentChordStepIdx = randRange(0, CHORD_STEP_POOL.length - 1);

  // Tanpura drone is an optional toggle, not a trait every preset carries --
  // default every preset to it OFF; only a preset built around it turns it
  // back on below, so switching presets doesn't drag the drone along.
  const chkTanpura = document.getElementById("chkTanpuraEnabled");
  if (chkTanpura) chkTanpura.checked = false;

  // Same reasoning for Delay Tempo Sync: each preset below sets its own
  // explicit delay-time character in milliseconds, so leaving a prior
  // preset's tempo-sync lock engaged would silently override that choice.
  const chkDelaySync = document.getElementById("chkDelayTempoSync");
  if (chkDelaySync) chkDelaySync.checked = false;

  const selDroneTimbre = document.getElementById("selDroneTimbre");
  if (selDroneTimbre) selDroneTimbre.value = "SUB";
  if (document.getElementById("selDroneOctave")) document.getElementById("selDroneOctave").value = "D2";
  if (document.getElementById("selDrumKit")) document.getElementById("selDrumKit").value = "ORGANIC_KIT";
  if (document.getElementById("selChordVoicing")) document.getElementById("selChordVoicing").value = "AUTO";
  if (document.getElementById("selNoiseProfile")) {
    const presetProfiles = ["RAIN", "WHITE_TAPE", "WIND", "BROOK", "CRICKETS", "THUNDER", "BROOK", "WIND", "WHITE_TAPE", "WHITE_TAPE", "RAIN", "WHITE_TAPE", "WIND", "WHITE_TAPE", "RAIN"];
    document.getElementById("selNoiseProfile").value = presetProfiles[idx] || "RAIN";
  }
  if (document.getElementById("selNoiseMode")) {
    const presetModes = ["GUSTS", "RHYTHMIC", "STORM_SWELL", "CONTINUOUS", "SPARSE", "STORM_SWELL", "CONTINUOUS", "SPARSE", "CONTINUOUS", "CONTINUOUS", "GUSTS", "RHYTHMIC", "GUSTS", "CONTINUOUS", "GUSTS"];
    document.getElementById("selNoiseMode").value = presetModes[idx] || "GUSTS";
  }
  if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 45;
  if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 38;
  if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 42;
  if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 24;
  if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 60;
  if (document.getElementById("knobChordDynamics")) document.getElementById("knobChordDynamics").value = 90;
  if (document.getElementById("knobChordSustain")) document.getElementById("knobChordSustain").value = 100;
  if (document.getElementById("knobChordVol")) document.getElementById("knobChordVol").value = 82;
  if (document.getElementById("knobDroneFx")) document.getElementById("knobDroneFx").value = 35;
  if (document.getElementById("knobDrumFx")) document.getElementById("knobDrumFx").value = 40;
  if (document.getElementById("knobChordFx")) document.getElementById("knobChordFx").value = 85;
  if (document.getElementById("knobArpFx")) document.getElementById("knobArpFx").value = 85;
  if (document.getElementById("knobEqLow")) document.getElementById("knobEqLow").value = 0;
  if (document.getElementById("knobEqMid")) document.getElementById("knobEqMid").value = 0;
  if (document.getElementById("knobEqHigh")) document.getElementById("knobEqHigh").value = 0;
  if (document.getElementById("knobMasterDrive")) document.getElementById("knobMasterDrive").value = 12;

  const p = typeof PRESET_SOUND_DESIGN_MATRIX !== "undefined" ? PRESET_SOUND_DESIGN_MATRIX[idx] : null;
  if (p) {
    // 1. Musical Scale & Authentic Signature Voicing Lock
    activeScaleKey = p.scale;
    if (document.getElementById("topScaleMode")) document.getElementById("topScaleMode").value = p.scale;
    if (document.getElementById("selScaleMode")) document.getElementById("selScaleMode").value = p.scale;
    if (p.signatureVoicing) currentChordVoicing = p.signatureVoicing;

    // 2. Rhythmic DNA: Meter & BPM
    if (document.getElementById("selTimeSig")) {
      const selTs = document.getElementById("selTimeSig");
      if ([...selTs.options].some(o => o.value === p.timeSig)) {
        selTs.value = p.timeSig;
      } else if (p.timeSig === "6/8" && [...selTs.options].some(o => o.value === "3/4")) {
        selTs.value = "3/4";
      }
      currentTimeSig = selTs.value;
      if (typeof updateTimeSignature === "function") updateTimeSignature();
    }
    if (document.getElementById("knobBpmHeader")) {
      document.getElementById("knobBpmHeader").value = p.bpm;
    }
    if (document.getElementById("knobBpm")) {
      document.getElementById("knobBpm").value = p.bpm;
    }
    bpm = p.bpm;
    if (typeof updateBpm === "function") updateBpm({ value: p.bpm });

    // 3. Tanpura Foundation
    const chkTanpura = document.getElementById("chkTanpuraEnabled");
    if (chkTanpura) {
      chkTanpura.checked = !!p.tanpura;
      if (p.tanpuraParams) {
        if (document.getElementById("knobTanpura")) document.getElementById("knobTanpura").value = p.tanpuraParams.volume;
        if (document.getElementById("knobJavari")) document.getElementById("knobJavari").value = p.tanpuraParams.javari;
      }
    }

    // 4. Instrument Timbres, Mutes & Balance
    if (p.synth) {
      if (document.getElementById("selSynthPreset")) document.getElementById("selSynthPreset").value = p.synth.preset;
      const chordTimbreMap = {
        WARM_ANALOG: "WARM_PAD",
        PURE_GLASS: "PURE_SINE_GLASS",
        CELESTIAL_FLUTE: "CELESTIAL_ORGAN"
      };
      const mappedTimbre = chordTimbreMap[p.synth.preset] || p.synth.preset;
      const selChord = document.getElementById("selChordTimbre");
      if (selChord) {
        if ([...selChord.options].some(o => o.value === mappedTimbre)) {
          selChord.value = mappedTimbre;
        } else if ([...selChord.options].some(o => o.value === p.synth.preset)) {
          selChord.value = p.synth.preset;
        }
      }
      if (document.getElementById("knobChordVol") && p.synth.vol !== undefined) document.getElementById("knobChordVol").value = p.synth.vol;
      if (document.getElementById("knobChordSustain") && p.synth.sustain !== undefined) document.getElementById("knobChordSustain").value = p.synth.sustain;
      if (document.getElementById("knobChordDynamics") && p.synth.dynamics !== undefined) document.getElementById("knobChordDynamics").value = p.synth.dynamics;
      if (document.getElementById("knobStrum") && p.synth.strum !== undefined) document.getElementById("knobStrum").value = p.synth.strum;
      if (document.getElementById("knobChordFx") && p.synth.fxSend !== undefined) document.getElementById("knobChordFx").value = p.synth.fxSend;
    }

    if (p.arp) {
      if (document.getElementById("selArpTimbre")) document.getElementById("selArpTimbre").value = p.arp.timbre;
      if (document.getElementById("selArpPattern")) document.getElementById("selArpPattern").value = p.arp.pattern;
      if (document.getElementById("knobArpGate") && p.arp.gate !== undefined) document.getElementById("knobArpGate").value = p.arp.gate;
      if (document.getElementById("knobArpRest") && p.arp.rest !== undefined) document.getElementById("knobArpRest").value = p.arp.rest;
      if (document.getElementById("knobArpVol") && p.arp.vol !== undefined) document.getElementById("knobArpVol").value = p.arp.vol;
      if (document.getElementById("knobArpFx") && p.arp.fxSend !== undefined) document.getElementById("knobArpFx").value = p.arp.fxSend;
    }

    if (p.drums) {
      if (document.getElementById("selDrumKit")) {
        const selDk = document.getElementById("selDrumKit");
        if ([...selDk.options].some(o => o.value === p.drums.kit)) {
          selDk.value = p.drums.kit;
        }
      }
      if (document.getElementById("selDrumGroove")) document.getElementById("selDrumGroove").value = p.drums.groove;
      const drumGrooveMap = {
        TAPE_DUB: "DUB_TAPE",
        FOUR_TET_GLITCH: "ORGANIC",
        TABLA_RUPAK: "TABLA_GROOVE"
      };
      const mappedGroove = drumGrooveMap[p.drums.groove] || p.drums.groove;
      const selDrumStyle = document.getElementById("selDrumStyle");
      if (selDrumStyle) {
        if ([...selDrumStyle.options].some(o => o.value === mappedGroove)) {
          selDrumStyle.value = mappedGroove;
        } else if ([...selDrumStyle.options].some(o => o.value === p.drums.groove)) {
          selDrumStyle.value = p.drums.groove;
        }
      }
      if (document.getElementById("knobDrumVol") && p.drums.vol !== undefined) document.getElementById("knobDrumVol").value = p.drums.vol;
      if (document.getElementById("knobDrumPunch") && p.drums.punch !== undefined) document.getElementById("knobDrumPunch").value = p.drums.punch;
      if (document.getElementById("knobDrumDensity") && p.drums.density !== undefined) document.getElementById("knobDrumDensity").value = p.drums.density;
      if (document.getElementById("knobDrumFx") && p.drums.fxSend !== undefined) document.getElementById("knobDrumFx").value = p.drums.fxSend;

      if (typeof channelPower !== "undefined" && typeof channelPower.drum !== "undefined") {
        channelPower.drum = p.drums.enabled;
      }
      const btnPwr = document.getElementById("btnPower_drum");
      if (btnPwr) btnPwr.classList.toggle("off", !p.drums.enabled);
    }

    if (p.noise) {
      if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = p.noise.profile;
      if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = p.noise.mode;
      if (document.getElementById("knobNoiseVol") && p.noise.vol !== undefined) document.getElementById("knobNoiseVol").value = p.noise.vol;
      if (document.getElementById("knobNoiseColor") && p.noise.color !== undefined) document.getElementById("knobNoiseColor").value = p.noise.color;
      if (document.getElementById("knobNoiseDrift") && p.noise.drift !== undefined) document.getElementById("knobNoiseDrift").value = p.noise.drift;
      if (document.getElementById("knobNoiseFx") && p.noise.fxSend !== undefined) document.getElementById("knobNoiseFx").value = p.noise.fxSend;
    }

    // 5. Automated 10-Pedal DSP Chain Wiring
    const fxMgr = window.slambientFxRackManager || window.fxRackManager;
    if (fxMgr && p.fxChain) {
      fxMgr.loadChainPreset(p.fxChain);
    } else {
      applyPresetFxConfig(idx);
    }
  }

  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  if (!p || !p.signatureVoicing) {
    currentChordVoicing = pickNextVoicingIdx(-1, activeScaleKey);
  } else {
    currentChordVoicing = p.signatureVoicing;
  }
  currentChordRootStep = CHORD_STEP_POOL[currentChordStepIdx];
  currentChordDeg = degreeToSemitone(currentChordRootStep, scale);

  const elRoot = document.getElementById("topRootKey");
  if (elRoot) elRoot.value = String(rootNote);

  const elScale = document.getElementById("topScaleMode");
  if (elScale) elScale.value = activeScaleKey;

  buildKeyboard();
  updateChordHud();
  updateDronePitches(true);
  updateTimeSignature();
  updateBpm();
  updateMusicalConfig(false);
  updateAudioParams();
  applyPresetFxConfig(idx);
  if (typeof renderMobileMacroGrid === "function") renderMobileMacroGrid();

  // Deliberately NOT forcing an immediate chord hit on preset switch: the
  // outgoing preset's delay/reverb tail is often still ringing, and firing
  // the new preset's chord right on top of it clashed with that tail. The
  // next natural downbeat (main sequencer clock) brings in the new material
  // once the old tail has had room to decay.
}

/* ==========================================================================
   PHASE 5: PRESET SERIALIZATION (JSON EXPORT / IMPORT WITH DSP CHAIN ORDER)
   ========================================================================== */
function serializeCurrentPatch() {
  const controls = {};
  document.querySelectorAll("input[id], select[id]").forEach(el => {
    if (el.type === "file") return;
    if (el.type === "checkbox") {
      controls[el.id] = { type: "checkbox", checked: el.checked };
    } else {
      controls[el.id] = { type: el.tagName.toLowerCase(), value: el.value };
    }
  });

  const activePresetBtn = document.querySelector(".preset-bar .btn-preset-chip.active");
  return {
    app: "Slambient Meander Engine",
    version: "1.0",
    exportedAt: new Date().toISOString(),
    presetName: activePresetBtn ? activePresetBtn.textContent.trim() : "Custom Patch",
    seed,
    rootNote,
    activeScaleKey,
    currentTimeSig,
    bpm,
    currentChordVoicing,
    currentChordStepIdx,
    dspChainOrder: Array.isArray(dspChainOrder) ? [...dspChainOrder] : ["FILTER", "DELAY", "SPACE"],
    pedalBypass: typeof pedalBypassState !== "undefined" ? Object.assign({}, pedalBypassState) : { FILTER: false, DELAY: false, SPACE: false },
    fxParams: typeof fxParamsState !== "undefined" ? JSON.parse(JSON.stringify(fxParamsState)) : {},
    fxChain: {
      order: Array.isArray(dspChainOrder) ? [...dspChainOrder] : [],
      bypass: typeof pedalBypassState !== "undefined" ? Object.assign({}, pedalBypassState) : {},
      params: typeof fxParamsState !== "undefined" ? JSON.parse(JSON.stringify(fxParamsState)) : {}
    },
    channelPower: Object.assign({}, channelPower),
    channelAux: Object.assign({}, channelAux),
    channelMute: Object.assign({}, channelMute),
    channelSolo: Object.assign({}, channelSolo),
    controls
  };
}

function savePresetBankJson() {
  try {
    const patch = serializeCurrentPatch();
    const jsonStr = JSON.stringify(patch, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const slug = (patch.presetName || "patch").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `slambient-${slug}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 250);
    const status = document.getElementById("footerStatus");
    if (status) status.textContent = `Saved Patch JSON (${patch.dspChainOrder.join(" ➔ ")})`;
  } catch (err) {
    console.error("Failed to export preset JSON:", err);
  }
}

// Restores a patch object (from serializeCurrentPatch) onto the console.
// Shared by LOAD (JSON file) and UNDO. skipIds lets a caller leave some
// controls alone (UNDO keeps your current master volume).
function applyPatchData(data, skipIds) {
  const skip = new Set(skipIds || []);
  if (data.controls && typeof data.controls === "object") {
    data = Object.assign({}, data, {
      controls: Object.fromEntries(Object.entries(data.controls).filter(([id]) => !skip.has(id)))
    });
  }

  // 1. Restore all DOM controls (<input>, <select>)
  if (data.controls && typeof data.controls === "object") {
    Object.entries(data.controls).forEach(([id, entry]) => {
      const el = document.getElementById(id);
      if (!el || !entry) return;
      if (entry.type === "checkbox" || el.type === "checkbox") {
        el.checked = !!entry.checked;
      } else if (entry.value !== undefined) {
        el.value = String(entry.value);
      }
    });
  }

  // 2. Restore core musical state
  if (typeof data.seed === "number") {
    seed = data.seed >>> 0;
    const hex = "#" + seed.toString(16).toUpperCase().padStart(8, "0").slice(0, 4) + "-" + seed.toString(16).toUpperCase().padStart(8, "0").slice(4);
    const hudSeedEl = document.getElementById("hudSeed");
    if (hudSeedEl) hudSeedEl.textContent = hex;
  }
  if (typeof data.rootNote === "number") rootNote = data.rootNote;
  if (typeof data.activeScaleKey === "string" && SCALES[data.activeScaleKey]) activeScaleKey = data.activeScaleKey;
  if (typeof data.currentTimeSig === "string" && TIME_SIGNATURES[data.currentTimeSig]) {
    currentTimeSig = data.currentTimeSig;
    const selTs = document.getElementById("selTimeSig");
    if (selTs) selTs.value = currentTimeSig;
  }
  if (typeof data.bpm === "number") {
    bpm = data.bpm;
    const kb = document.getElementById("knobBpm");
    if (kb) kb.value = bpm;
    const kbh = document.getElementById("knobBpmHeader");
    if (kbh) kbh.value = bpm;
    const lb = document.getElementById("lblBpm");
    if (lb) lb.textContent = bpm + " BPM";
    const lbh = document.getElementById("lblBpmHeader");
    if (lbh) lbh.textContent = bpm + " BPM";
  }
  if (typeof data.currentChordVoicing === "number" || typeof data.currentChordVoicing === "string") currentChordVoicing = data.currentChordVoicing;
  if (typeof data.currentChordStepIdx === "number") currentChordStepIdx = data.currentChordStepIdx;

  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  currentChordRootStep = CHORD_STEP_POOL[currentChordStepIdx] || 0;
  currentChordDeg = degreeToSemitone(currentChordRootStep, scale);

  const elRoot = document.getElementById("topRootKey");
  if (elRoot) elRoot.value = String(rootNote);
  const elScale = document.getElementById("topScaleMode");
  if (elScale) elScale.value = activeScaleKey;

  // 3. Restore channel power, aux, mute, solo
  if (data.channelPower && typeof data.channelPower === "object") Object.assign(channelPower, data.channelPower);
  if (data.channelAux && typeof data.channelAux === "object") Object.assign(channelAux, data.channelAux);
  if (data.channelMute && typeof data.channelMute === "object") Object.assign(channelMute, data.channelMute);
  if (data.channelSolo && typeof data.channelSolo === "object") Object.assign(channelSolo, data.channelSolo);
  droneEnabled = channelPower.drone !== false;
  updateMuteSoloUI();

  // 4. Restore pedalboard and modular DSP chain routing topology
  const fxConfig = {
    chain: (data.fxChain && data.fxChain.order) || data.dspChainOrder,
    bypass: (data.fxChain && data.fxChain.bypass) || data.pedalBypass,
    params: (data.fxChain && data.fxChain.params) || data.fxParams
  };

  const fxMgr = (typeof slambientFxRackManager !== "undefined" && slambientFxRackManager) ||
                (typeof window !== "undefined" && (window.slambientFxRackManager || window.fxRackManager));

  if (fxMgr && typeof fxMgr.loadChainPreset === "function") {
    fxMgr.loadChainPreset(fxConfig);
  } else {
    if (Array.isArray(fxConfig.chain) && fxConfig.chain.length > 0) {
      if (typeof dspChainOrder !== "undefined" && Array.isArray(dspChainOrder)) {
        dspChainOrder.length = 0;
        dspChainOrder.push(...fxConfig.chain);
      }
    }
    if (fxConfig.bypass && typeof fxConfig.bypass === "object" && typeof pedalBypassState !== "undefined") {
      Object.keys(fxConfig.bypass).forEach(k => {
        pedalBypassState[k] = !!fxConfig.bypass[k];
        if (typeof document !== "undefined") {
          const card = document.getElementById("pedalCard_" + k);
          const btn = document.getElementById("stompBtn_" + k);
          if (card) card.classList.toggle("bypassed", pedalBypassState[k]);
          if (btn) btn.classList.toggle("active", !pedalBypassState[k]);
        }
      });
    }
    if (fxConfig.params && typeof fxConfig.params === "object") {
      Object.keys(fxConfig.params).forEach(k => {
        if (typeof fxParamsState !== "undefined") {
          if (!fxParamsState[k]) fxParamsState[k] = {};
          Object.assign(fxParamsState[k], fxConfig.params[k]);
        }
        if (typeof document !== "undefined") {
          Object.keys(fxConfig.params[k]).forEach(pId => {
            const val = fxConfig.params[k][pId];
            const slider = document.getElementById(`slider_${k}_${pId}`);
            if (slider) slider.value = val;
            const lbl = document.getElementById(`lbl_${k}_${pId}`);
            if (lbl && typeof formatFxParamValue === "function" && typeof PEDAL_REGISTRY !== "undefined") {
              const reg = PEDAL_REGISTRY[k];
              const pMeta = reg && reg.params && reg.params.find(p => p.id === pId);
              lbl.textContent = formatFxParamValue(pMeta, val);
            }
          });
        }
      });
    }
    if (typeof rewireDspChain === "function" && typeof dspChainOrder !== "undefined") {
      rewireDspChain(dspChainOrder, false);
    }
    if (typeof updatePedalsOrderUI === "function") {
      updatePedalsOrderUI();
    }
  }

  // Highlight matching preset chip if presetName matches
  document.querySelectorAll(".preset-bar .btn-preset-chip").forEach(btn => {
    btn.classList.toggle("active", data.presetName && btn.textContent.trim().toLowerCase() === data.presetName.trim().toLowerCase());
  });

  buildKeyboard();
  updateChordHud();
  updateDronePitches(true);
  updateTimeSignature();
  updateBpm();
  updateMusicalConfig(false);
  updateAudioParams();
}

function triggerLoadPresetBankJson() {
  const fileInput = document.getElementById("inputPresetJson");
  if (fileInput) {
    fileInput.value = "";
    fileInput.click();
  }
}

function loadPresetBankJson(event) {
  const file = event && event.target && event.target.files ? event.target.files[0] : null;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || typeof data !== "object") throw new Error("Invalid JSON structure");
      applyPatchData(data);

      const status = document.getElementById("footerStatus");
      if (status) status.textContent = `Loaded Patch: ${data.presetName || file.name} (${dspChainOrder.join(" ➔ ")})`;
    } catch (err) {
      console.error("Failed to load preset JSON:", err);
      const status = document.getElementById("footerStatus");
      if (status) status.textContent = "Error: Invalid Preset JSON File";
    }
  };
  reader.readAsText(file);
}

/* ==========================================================================
   USER PATCH BANK & PRESET SLOTS (U1-U6)
   ========================================================================== */
const USER_PATCHES_KEY = "slambient_user_patches_v1";

function getUserPatches() {
  try {
    const raw = localStorage.getItem(USER_PATCHES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveUserPatches(patches) {
  try {
    localStorage.setItem(USER_PATCHES_KEY, JSON.stringify(patches));
  } catch (e) {
    console.error("Failed to persist user patches:", e);
  }
}

function switchPresetBank(bank) {
  const isUser = bank === "user";
  const tabF = document.getElementById("tabBankFactory");
  const tabU = document.getElementById("tabBankUser");
  const barF = document.getElementById("presetBarFactory");
  const barU = document.getElementById("presetBarUser");
  if (tabF) tabF.classList.toggle("active", !isUser);
  if (tabU) tabU.classList.toggle("active", isUser);
  if (barF) barF.style.display = isUser ? "none" : "";
  if (barU) barU.style.display = isUser ? "" : "none";
  if (isUser) renderUserPatchSlots();
}

let userSlotLongPressTimer = null;
let userSlotLongPressTriggered = false;

function bindUserSlotLongPress() {
  for (let i = 1; i <= 9; i++) {
    const btn = document.getElementById(`btnUserSlot${i}`);
    if (!btn || btn.dataset.longPressBound) continue;
    btn.dataset.longPressBound = "1";

    btn.addEventListener("touchstart", (e) => {
      userSlotLongPressTriggered = false;
      userSlotLongPressTimer = setTimeout(() => {
        userSlotLongPressTriggered = true;
        handleUserSlotContextMenu(e, i);
      }, 550);
    }, { passive: false });

    btn.addEventListener("touchend", (e) => {
      if (userSlotLongPressTimer) clearTimeout(userSlotLongPressTimer);
      if (userSlotLongPressTriggered) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    btn.addEventListener("touchcancel", () => {
      if (userSlotLongPressTimer) clearTimeout(userSlotLongPressTimer);
    });
  }
}

function renderUserPatchSlots() {
  const patches = getUserPatches();
  for (let i = 1; i <= 9; i++) {
    const btn = document.getElementById(`btnUserSlot${i}`);
    if (!btn) continue;
    const entry = patches[i];
    if (entry && entry.name) {
      btn.innerHTML = `<span class="user-slot-num">U${i}</span><span class="user-slot-name">${entry.name}</span>`;
      btn.title = `Slot U${i} (${entry.name}) — Click to load, Shift-click to overwrite`;
    } else {
      btn.innerHTML = `<span class="user-slot-num">U${i}</span><span class="user-slot-name empty">[ EMPTY ]</span>`;
      btn.title = `Slot U${i} (Empty) — Click to store current soundscape`;
    }
  }
  bindUserSlotLongPress();
}

function handleUserSlotClick(slotNum, event) {
  if (userSlotLongPressTriggered) {
    userSlotLongPressTriggered = false;
    return;
  }
  const patches = getUserPatches();
  const entry = patches[slotNum];
  const isShift = event && event.shiftKey;

  if (!entry || !entry.data || isShift) {
    const defName = (document.getElementById("hudScale") ? document.getElementById("hudScale").textContent : `Patch ${slotNum}`).trim();
    const name = window.prompt(`Save current soundscape to User Slot U${slotNum}:`, (entry && entry.name) || defName);
    if (name === null) return;
    const finalName = (name.trim() || `Patch ${slotNum}`).slice(0, 15);
    patches[slotNum] = {
      name: finalName,
      data: serializeCurrentPatch(),
      savedAt: Date.now()
    };
    saveUserPatches(patches);
    renderUserPatchSlots();
    highlightActiveUserSlot(slotNum);
    const status = document.getElementById("footerStatus");
    if (status) status.textContent = `Saved User Slot U${slotNum}: ${finalName}`;
  } else {
    applyPatchData(entry.data);
    highlightActiveUserSlot(slotNum);
    const status = document.getElementById("footerStatus");
    if (status) status.textContent = `Loaded User Slot U${slotNum}: ${entry.name}`;
  }
}

function handleUserSlotContextMenu(event, slotNum) {
  if (event) event.preventDefault();
  const patches = getUserPatches();
  const entry = patches[slotNum];
  if (!entry) {
    handleUserSlotClick(slotNum, event);
    return;
  }
  const action = window.prompt(`Slot U${slotNum}: "${entry.name}"\nType 1 to Rename, 2 to Overwrite with current sound, 3 to Clear slot:`, "1");
  if (action === "1") {
    const newName = window.prompt("New patch name (max 15 chars):", entry.name);
    if (newName && newName.trim()) {
      entry.name = newName.trim().slice(0, 15);
      saveUserPatches(patches);
      renderUserPatchSlots();
    }
  } else if (action === "2") {
    entry.data = serializeCurrentPatch();
    entry.savedAt = Date.now();
    saveUserPatches(patches);
    renderUserPatchSlots();
    highlightActiveUserSlot(slotNum);
    const status = document.getElementById("footerStatus");
    if (status) status.textContent = `Overwrote Slot U${slotNum}: ${entry.name}`;
  } else if (action === "3") {
    if (window.confirm(`Clear User Slot U${slotNum} (${entry.name})?`)) {
      delete patches[slotNum];
      saveUserPatches(patches);
      renderUserPatchSlots();
      highlightActiveUserSlot(null);
    }
  }
}

function storeToUserSlotPrompt() {
  const patches = getUserPatches();
  let suggested = 1;
  for (let i = 1; i <= 9; i++) {
    if (!patches[i]) { suggested = i; break; }
  }
  const input = window.prompt("Store current soundscape into User Slot (1-9):", String(suggested));
  if (!input) return;
  const slotNum = parseInt(input.trim(), 10);
  if (isNaN(slotNum) || slotNum < 1 || slotNum > 9) {
    alert("Please enter a valid slot number between 1 and 9.");
    return;
  }
  handleUserSlotClick(slotNum, { shiftKey: true });
}

function highlightActiveUserSlot(slotNum) {
  for (let i = 1; i <= 9; i++) {
    const btn = document.getElementById(`btnUserSlot${i}`);
    if (btn) btn.classList.toggle("active", i === slotNum);
  }
  if (slotNum !== null) {
    document.querySelectorAll("#presetBarFactory .btn-preset-chip").forEach(b => b.classList.remove("active"));
  }
}
