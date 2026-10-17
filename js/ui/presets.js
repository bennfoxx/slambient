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

  // Reset module controls and DSP pedal routing that only certain presets override
  // so switching presets or coming from Randomize All never leaks stale state.
  if (typeof rewireDspChain === "function") {
    rewireDspChain(['FILTER', 'DELAY', 'SPACE'], false);
  }
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

  if (idx === 0) {
    document.getElementById("selTimeSig").value = "7/4";
    activeScaleKey = "DORIAN";
    document.getElementById("knobBpm").value = 72;
    document.getElementById("knobWeather").value = 45;
    document.getElementById("knobMutation").value = 35;
    document.getElementById("selDrumStyle").value = "ORGANIC";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 25;
    document.getElementById("knobDrumVol").value = 85;
    document.getElementById("knobDrumPunch").value = 75;
    document.getElementById("knobDrumDensity").value = 65;
    document.getElementById("knobStrum").value = 55;
    document.getElementById("knobDrone").value = 70;
    document.getElementById("knobDroneFilter").value = 180;
    document.getElementById("knobDroneDetune").value = 3.5;
    document.getElementById("knobDroneWander").value = 20;
    if (document.getElementById("selTanpuraTuning")) document.getElementById("selTanpuraTuning").value = "PA";
    if (document.getElementById("knobTanpura")) document.getElementById("knobTanpura").value = 45;
    if (document.getElementById("knobJavari")) document.getElementById("knobJavari").value = 60;
    document.getElementById("selChordTimbre").value = "WARM_PAD";
    document.getElementById("selArpPattern").value = "SHIMMER";
    document.getElementById("chkAutoEvolveArpPattern").checked = true;
    document.getElementById("selArpTimbre").value = "MUSIC_BOX";
    document.getElementById("chkAutoEvolveArpTimbre").checked = true;
    document.getElementById("knobArpEvolveChance").value = 25;
    document.getElementById("knobArpGate").value = 320;
    document.getElementById("knobArpRest").value = 15;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 85;
    document.getElementById("knobMasterCutoff").value = 64.4;
    document.getElementById("knobMasterRes").value = 2.8;
    document.getElementById("knobFilterAttack").value = 45;
    document.getElementById("knobFilterDecay").value = 650;
    document.getElementById("knobFilterEnvDepth").value = 60;
    document.getElementById("knobFilterLfoRate").value = 0.08;
    document.getElementById("knobFilterLfoDepth").value = 20;
    document.getElementById("knobDelayTime").value = 360;
    document.getElementById("knobDelayFeedback").value = 48;
    document.getElementById("knobDelayTone").value = 1900;
    document.getElementById("knobDelayFlutter").value = 35;
    document.getElementById("knobDelayMix").value = 42;
    document.getElementById("selReverbMode").value = "HALL";
    document.getElementById("knobReverbMix").value = 40;
    document.getElementById("knobReverbTone").value = 4500;
    document.getElementById("selChorusMode").value = "CLASSIC";
    document.getElementById("knobChorusRate").value = 0.35;
    document.getElementById("knobChorusDepth").value = 35;
    document.getElementById("knobChorusMix").value = 25;
  } else if (idx === 1) {
    document.getElementById("selTimeSig").value = "5/8";
    activeScaleKey = "DORIAN";
    document.getElementById("knobBpm").value = 88;
    document.getElementById("knobWeather").value = 55;
    document.getElementById("knobMutation").value = 45;
    document.getElementById("selDrumStyle").value = "ORGANIC";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 20;
    document.getElementById("knobDrumVol").value = 95;
    document.getElementById("knobDrumPunch").value = 85;
    document.getElementById("knobDrumDensity").value = 80;
    document.getElementById("knobStrum").value = 40;
    document.getElementById("knobDrone").value = 65;
    document.getElementById("knobDroneFilter").value = 210;
    document.getElementById("knobDroneDetune").value = 4.0;
    document.getElementById("knobDroneWander").value = 15;
    if (document.getElementById("selTanpuraTuning")) document.getElementById("selTanpuraTuning").value = "MA";
    if (document.getElementById("knobTanpura")) document.getElementById("knobTanpura").value = 35;
    if (document.getElementById("knobJavari")) document.getElementById("knobJavari").value = 50;
    document.getElementById("selChordTimbre").value = "LOFI_KEYS";
    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("chkAutoEvolveArpPattern").checked = true;
    document.getElementById("selArpTimbre").value = "KALIMBA";
    document.getElementById("chkAutoEvolveArpTimbre").checked = true;
    document.getElementById("knobArpEvolveChance").value = 20;
    document.getElementById("knobArpGate").value = 180;
    document.getElementById("knobArpRest").value = 8;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 90;
    document.getElementById("knobMasterCutoff").value = 71.8;
    document.getElementById("knobMasterRes").value = 3.5;
    document.getElementById("knobFilterAttack").value = 25;
    document.getElementById("knobFilterDecay").value = 450;
    document.getElementById("knobFilterEnvDepth").value = 70;
    document.getElementById("knobFilterLfoRate").value = 0.15;
    document.getElementById("knobFilterLfoDepth").value = 15;
    document.getElementById("knobDelayTime").value = 240;
    document.getElementById("knobDelayFeedback").value = 42;
    document.getElementById("knobDelayTone").value = 2400;
    document.getElementById("knobDelayFlutter").value = 20;
    document.getElementById("knobDelayMix").value = 38;
    document.getElementById("selReverbMode").value = "PLATE";
    document.getElementById("knobReverbMix").value = 25;
    document.getElementById("knobReverbTone").value = 6000;
    document.getElementById("selChorusMode").value = "CLASSIC";
    document.getElementById("knobChorusRate").value = 0.5;
    document.getElementById("knobChorusDepth").value = 25;
    document.getElementById("knobChorusMix").value = 18;
  } else if (idx === 2) {
    document.getElementById("selTimeSig").value = "7/8";
    activeScaleKey = "LYDIAN";
    document.getElementById("knobBpm").value = 62;
    document.getElementById("knobWeather").value = 65;
    document.getElementById("knobMutation").value = 25;
    document.getElementById("selDrumStyle").value = "HEARTBEAT";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 15;
    document.getElementById("knobDrumVol").value = 70;
    document.getElementById("knobDrumPunch").value = 60;
    document.getElementById("knobDrumDensity").value = 40;
    document.getElementById("knobStrum").value = 80;
    document.getElementById("knobDrone").value = 75;
    document.getElementById("knobDroneFilter").value = 160;
    document.getElementById("knobDroneDetune").value = 2.5;
    document.getElementById("knobDroneWander").value = 10;
    if (document.getElementById("selTanpuraTuning")) document.getElementById("selTanpuraTuning").value = "PA";
    if (document.getElementById("knobTanpura")) document.getElementById("knobTanpura").value = 55;
    if (document.getElementById("knobJavari")) document.getElementById("knobJavari").value = 65;
    document.getElementById("selChordTimbre").value = "DIGITAL_STRINGS";
    document.getElementById("selArpPattern").value = "UP";
    document.getElementById("chkAutoEvolveArpPattern").checked = true;
    document.getElementById("selArpTimbre").value = "GLASS_FM";
    document.getElementById("chkAutoEvolveArpTimbre").checked = true;
    document.getElementById("knobArpEvolveChance").value = 15;
    document.getElementById("knobArpGate").value = 450;
    document.getElementById("knobArpRest").value = 18;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 72;
    document.getElementById("knobMasterCutoff").value = 78.0;
    document.getElementById("knobMasterRes").value = 1.8;
    document.getElementById("knobFilterAttack").value = 65;
    document.getElementById("knobFilterDecay").value = 850;
    document.getElementById("knobFilterEnvDepth").value = 42;
    document.getElementById("knobFilterLfoRate").value = 0.16;
    document.getElementById("knobFilterLfoDepth").value = 24;
    document.getElementById("knobDelayTime").value = 480;
    document.getElementById("knobDelayFeedback").value = 46;
    document.getElementById("knobDelayTone").value = 2800;
    document.getElementById("knobDelayFlutter").value = 35;
    document.getElementById("knobDelayMix").value = 48;
    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 52;
    document.getElementById("knobReverbTone").value = 6200;
    document.getElementById("selChorusMode").value = "ENSEMBLE";
    document.getElementById("knobChorusRate").value = 0.6;
    document.getElementById("knobChorusDepth").value = 55;
    document.getElementById("knobChorusMix").value = 40;
  } else if (idx === 3) {
    document.getElementById("selTimeSig").value = "5/4";
    activeScaleKey = "AEOLIAN";
    document.getElementById("knobBpm").value = 64;
    document.getElementById("knobWeather").value = 75;
    document.getElementById("knobMutation").value = 55;
    document.getElementById("selDrumStyle").value = "DUB_TAPE";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 35;
    document.getElementById("knobDrumVol").value = 90;
    document.getElementById("knobDrumPunch").value = 70;
    document.getElementById("knobDrumDensity").value = 70;
    document.getElementById("knobStrum").value = 45;
    document.getElementById("knobDrone").value = 60;
    document.getElementById("knobDroneFilter").value = 140;
    document.getElementById("knobDroneDetune").value = 5.0;
    document.getElementById("knobDroneWander").value = 40;
    document.getElementById("selChordTimbre").value = "CHAMBER_WOODS";
    document.getElementById("selArpPattern").value = "SHIMMER";
    document.getElementById("chkAutoEvolveArpPattern").checked = true;
    document.getElementById("selArpTimbre").value = "CONCERT_HARP";
    document.getElementById("chkAutoEvolveArpTimbre").checked = true;
    document.getElementById("knobArpEvolveChance").value = 35;
    document.getElementById("knobArpGate").value = 250;
    document.getElementById("knobArpRest").value = 25;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 80;
    document.getElementById("knobMasterCutoff").value = 53.9;
    document.getElementById("knobMasterRes").value = 4.2;
    document.getElementById("knobFilterAttack").value = 35;
    document.getElementById("knobFilterDecay").value = 900;
    document.getElementById("knobFilterEnvDepth").value = 75;
    document.getElementById("knobFilterLfoRate").value = 0.06;
    document.getElementById("knobFilterLfoDepth").value = 35;
    document.getElementById("knobDelayTime").value = 520;
    document.getElementById("knobDelayFeedback").value = 48;
    document.getElementById("knobDelayTone").value = 1200;
    document.getElementById("knobDelayFlutter").value = 70;
    document.getElementById("knobDelayMix").value = 50;
    document.getElementById("selReverbMode").value = "HALL";
    document.getElementById("knobReverbMix").value = 45;
    document.getElementById("knobReverbTone").value = 3200;
    document.getElementById("selChorusMode").value = "VIBRATO";
    document.getElementById("knobChorusRate").value = 0.8;
    document.getElementById("knobChorusDepth").value = 70;
    document.getElementById("knobChorusMix").value = 45;
  } else if (idx === 4) {
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "MAJOR9";
    document.getElementById("knobBpm").value = 56;
    document.getElementById("knobWeather").value = 60;
    document.getElementById("knobMutation").value = 15;
    document.getElementById("selDrumStyle").value = "MUTED";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumEvolveChance").value = 10;
    document.getElementById("knobDrumVol").value = 0;
    document.getElementById("knobDrumPunch").value = 30;
    document.getElementById("knobDrumDensity").value = 20;
    document.getElementById("knobStrum").value = 95;
    document.getElementById("knobDrone").value = 85;
    document.getElementById("knobDroneFilter").value = 140;
    document.getElementById("knobDroneDetune").value = 1.8;
    document.getElementById("knobDroneWander").value = 25;
    if (document.getElementById("selTanpuraTuning")) document.getElementById("selTanpuraTuning").value = "PA";
    if (document.getElementById("knobTanpura")) document.getElementById("knobTanpura").value = 50;
    if (document.getElementById("knobJavari")) document.getElementById("knobJavari").value = 75;
    document.getElementById("selChordTimbre").value = "CELESTIAL_ORGAN";
    document.getElementById("selArpPattern").value = "CHORD_BURST";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "WATER_DROPLET";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpEvolveChance").value = 15;
    document.getElementById("knobArpGate").value = 500;
    document.getElementById("knobArpRest").value = 35;
    document.getElementById("knobArpOctaves").value = 1;
    document.getElementById("knobArpVol").value = 55;
    document.getElementById("knobMasterCutoff").value = 56.9;
    document.getElementById("knobMasterRes").value = 1.2;
    document.getElementById("knobFilterAttack").value = 80;
    document.getElementById("knobFilterDecay").value = 1100;
    document.getElementById("knobFilterEnvDepth").value = 35;
    document.getElementById("knobFilterLfoRate").value = 0.05;
    document.getElementById("knobFilterLfoDepth").value = 20;
    document.getElementById("knobDelayTime").value = 420;
    document.getElementById("knobDelayFeedback").value = 38;
    document.getElementById("knobDelayTone").value = 1500;
    document.getElementById("knobDelayFlutter").value = 25;
    document.getElementById("knobDelayMix").value = 45;
    document.getElementById("selReverbMode").value = "HALL";
    document.getElementById("knobReverbMix").value = 50;
    document.getElementById("knobReverbTone").value = 5500;
    document.getElementById("selChorusMode").value = "ENSEMBLE";
    document.getElementById("knobChorusRate").value = 0.3;
    document.getElementById("knobChorusDepth").value = 45;
    document.getElementById("knobChorusMix").value = 35;
  } else if (idx === 5) {
    document.getElementById("selTimeSig").value = "3/4";
    activeScaleKey = "MAJ_PENTATONIC";
    document.getElementById("knobBpm").value = 68;
    document.getElementById("knobWeather").value = 45;
    document.getElementById("knobMutation").value = 20;
    document.getElementById("selDrumStyle").value = "MINIMAL_CLICK";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 15;
    document.getElementById("knobDrumVol").value = 40;
    document.getElementById("knobDrumPunch").value = 35;
    document.getElementById("knobDrumDensity").value = 20;
    document.getElementById("knobStrum").value = 75;
    document.getElementById("knobDrone").value = 65;
    document.getElementById("knobDroneFilter").value = 160;
    document.getElementById("knobDroneDetune").value = 2.4;
    document.getElementById("knobDroneWander").value = 20;
    document.getElementById("selChordTimbre").value = "VIBES_CELESTE";
    document.getElementById("selArpPattern").value = "UP";
    document.getElementById("chkAutoEvolveArpPattern").checked = true;
    document.getElementById("selArpTimbre").value = "PIZZICATO_STRING";
    document.getElementById("chkAutoEvolveArpTimbre").checked = true;
    document.getElementById("knobArpEvolveChance").value = 20;
    document.getElementById("knobArpGate").value = 380;
    document.getElementById("knobArpRest").value = 20;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 60;
    document.getElementById("knobMasterCutoff").value = 59.6;
    document.getElementById("knobMasterRes").value = 1.6;
    document.getElementById("knobFilterAttack").value = 55;
    document.getElementById("knobFilterDecay").value = 900;
    document.getElementById("knobFilterEnvDepth").value = 40;
    document.getElementById("knobFilterLfoRate").value = 0.1;
    document.getElementById("knobFilterLfoDepth").value = 18;
    document.getElementById("knobDelayTime").value = 390;
    document.getElementById("knobDelayFeedback").value = 35;
    document.getElementById("knobDelayTone").value = 1700;
    document.getElementById("knobDelayFlutter").value = 20;
    document.getElementById("knobDelayMix").value = 40;
    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 48;
    document.getElementById("knobReverbTone").value = 7000;
    document.getElementById("selChorusMode").value = "CLASSIC";
    document.getElementById("knobChorusRate").value = 0.4;
    document.getElementById("knobChorusDepth").value = 30;
    document.getElementById("knobChorusMix").value = 22;
  } else if (idx === 6) { // Kankyō Green (Hiroshi Yoshimura & Midori Takada Environmental Ambient)
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "HIRAJOSHI";
    document.getElementById("knobBpm").value = 58;
    document.getElementById("knobWeather").value = 32; // Pure, pristine transparent space
    document.getElementById("knobMutation").value = 12; // Serene, meditative harmonic stability
    
    // Traditional percussion silenced completely in favor of natural environmental textures
    document.getElementById("selDrumStyle").value = "MUTED";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumEvolveChance").value = 0;
    document.getElementById("knobDrumVol").value = 0;
    document.getElementById("knobDrumPunch").value = 0;
    document.getElementById("knobDrumDensity").value = 0;
    document.getElementById("knobDrumFx").value = 0;
    
    // Synthesized environmental textures (gentle water drops, breeze drift, resonant stone reflections)
    if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = "BROOK";
    if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = "SPARSE";
    if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 68; // Crystalline clarity
    if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 30;  // Gentle droplet intervals
    if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 78; // Wide stereo air drift
    if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 46;
    if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 65;

    // Weightless, subtle harmonic drone foundation
    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDrone").value = 38;
    document.getElementById("knobDroneFilter").value = 150;
    document.getElementById("knobDroneDetune").value = 1.2;
    document.getElementById("knobDroneWander").value = 22;
    document.getElementById("knobDroneFx").value = 28;

    // Crystalline chord glass
    document.getElementById("knobStrum").value = 92;
    document.getElementById("selChordTimbre").value = "PURE_SINE_GLASS";
    document.getElementById("knobChordVol").value = 76;
    document.getElementById("knobChordFx").value = 75;

    // Meditative, crystalline arpeggio resembling water ripples and raindrops
    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "SINE_CRYSTAL";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpEvolveChance").value = 0;
    document.getElementById("knobArpGate").value = 340;
    document.getElementById("knobArpRest").value = 44; // Intentional breathing room / Ma (間)
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 70;
    document.getElementById("knobArpFx").value = 85;

    // Natural acoustic envelope with gentle open cutoff and low resonance
    document.getElementById("knobMasterCutoff").value = 78; // Transparent, open acoustic field
    document.getElementById("knobMasterRes").value = 1.1; // Smooth, uncolored resonance
    document.getElementById("knobFilterAttack").value = 65;
    document.getElementById("knobFilterDecay").value = 1200;
    document.getElementById("knobFilterEnvDepth").value = 28;
    document.getElementById("knobFilterLfoRate").value = 0.035;
    document.getElementById("knobFilterLfoDepth").value = 10;

    // Prismatic spatial analog delay (echo chamber reflections)
    document.getElementById("knobDelayTime").value = 480;
    document.getElementById("knobDelayFeedback").value = 45;
    document.getElementById("knobDelayTone").value = 3200;
    document.getElementById("knobDelayFlutter").value = 14;
    document.getElementById("knobDelayMix").value = 42;

    // Crystalline shimmer space and slow binaural swells
    document.getElementById("selReverbMode").value = "SHIMMER";
    document.getElementById("knobReverbMix").value = 42;
    document.getElementById("knobReverbTone").value = 7200;
    document.getElementById("selChorusMode").value = "ENSEMBLE";
    document.getElementById("knobChorusRate").value = 0.08; // Ultra-slow binaural drift
    document.getElementById("knobChorusDepth").value = 38;
    document.getElementById("knobChorusMix").value = 26;
  } else if (idx === 7) { // Classical Lineage (Indian Classical Raga / Maihar Tradition)
    document.getElementById("selTimeSig").value = "7/4"; // Rupak Taal (7 matras: 3 + 2 + 2)
    activeScaleKey = "BILAWAL";
    document.getElementById("knobBpm").value = 68; // Meditative vilambit / madhya laya
    document.getElementById("knobWeather").value = 40;
    document.getElementById("knobMutation").value = 20;

    // Classical Indian Tabla theka - calibrated for chamber acoustics
    document.getElementById("selDrumStyle").value = "TABLA_GROOVE";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumEvolveChance").value = 10;
    document.getElementById("knobDrumVol").value = 76;
    document.getElementById("knobDrumPunch").value = 68;
    document.getElementById("knobDrumDensity").value = 65;
    document.getElementById("knobDrumFx").value = 45;

    // Maihar Sitar Strings with authentic jawari buzz and mizrab attack
    document.getElementById("knobStrum").value = 75;
    document.getElementById("selChordTimbre").value = "SITAR_STRINGS";
    document.getElementById("knobChordVol").value = 84;
    document.getElementById("knobChordFx").value = 78;

    // Resonant Indian Tanpura drone - quiet, meditative bed sitting peacefully behind sub
    document.getElementById("selDroneOctave").value = "D2";
    if (chkTanpura) chkTanpura.checked = true;
    if (document.getElementById("selTanpuraTuning")) document.getElementById("selTanpuraTuning").value = "PA";
    if (document.getElementById("knobTanpura")) document.getElementById("knobTanpura").value = 14;
    if (document.getElementById("knobJavari")) document.getElementById("knobJavari").value = 52;
    document.getElementById("knobDrone").value = 74;
    document.getElementById("knobDroneFilter").value = 210;
    document.getElementById("knobDroneDetune").value = 3.5;
    document.getElementById("knobDroneWander").value = 15;
    document.getElementById("knobDroneFx").value = 42;

    // Breathy Indian Bamboo Flute (Bansuri) arpeggios in Raga Taan phrasing
    document.getElementById("selArpPattern").value = "RAGA_TAAN";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "BANSURI_FLUTE";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpEvolveChance").value = 15;
    document.getElementById("knobArpGate").value = 420;
    document.getElementById("knobArpRest").value = 18;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 82;
    document.getElementById("knobArpFx").value = 78;

    // Warm temple resonance and spatial depth
    document.getElementById("knobMasterCutoff").value = 74.0;
    document.getElementById("knobMasterRes").value = 2.0;
    document.getElementById("knobFilterAttack").value = 50;
    document.getElementById("knobFilterDecay").value = 950;
    document.getElementById("knobFilterEnvDepth").value = 45;
    document.getElementById("knobFilterLfoRate").value = 0.06;
    document.getElementById("knobFilterLfoDepth").value = 18;

    document.getElementById("knobDelayTime").value = 440;
    document.getElementById("knobDelayFeedback").value = 45;
    document.getElementById("knobDelayTone").value = 2400;
    document.getElementById("knobDelayFlutter").value = 26;
    document.getElementById("knobDelayMix").value = 44;

    // Temple-like hall for the tanpura/sitar to breathe in, with light chorus
    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 44;
    document.getElementById("knobReverbTone").value = 5200;
    document.getElementById("selChorusMode").value = "CLASSIC";
    document.getElementById("knobChorusRate").value = 0.2;
    document.getElementById("knobChorusDepth").value = 15;
    document.getElementById("knobChorusMix").value = 10;
  } else if (idx === 8) { // After Hours Deep (Super Chill Deep House)
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "DORIAN";
    document.getElementById("knobBpm").value = 112; // laid-back, still a real house pulse
    document.getElementById("knobWeather").value = 35;
    document.getElementById("knobMutation").value = 20; // slow-evolving, not twitchy

    // Four-on-the-floor, kept well behind "full/hard" -- present but relaxed
    document.getElementById("selDrumStyle").value = "FOUR_ON_FLOOR";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumEvolveChance").value = 10;
    document.getElementById("knobDrumVol").value = 78;
    document.getElementById("knobDrumPunch").value = 55;
    document.getElementById("knobDrumDensity").value = 45;
    document.getElementById("knobDrumFx").value = 35;

    // Rhodes chords -- the quintessential deep house stab/pad instrument
    document.getElementById("knobStrum").value = 40;
    document.getElementById("selChordTimbre").value = "RHODES";
    document.getElementById("knobChordFx").value = 70;

    // Deep sub-bass drone, locked to the root rather than wandering --
    // house bass sits still, it doesn't noodle
    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDrone").value = 78;
    document.getElementById("knobDroneFilter").value = 140;
    document.getElementById("knobDroneDetune").value = 2;
    document.getElementById("knobDroneWander").value = 10;
    document.getElementById("knobDroneFx").value = 30;

    // Organic pluck arp, locked to a hypnotic up/down pattern rather
    // than evolving mid-groove
    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "WATER_DROPLET";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpEvolveChance").value = 10;
    document.getElementById("knobArpGate").value = 180;
    document.getElementById("knobArpRest").value = 20;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 75;
    document.getElementById("knobArpFx").value = 55;

    // Gentle filter breathing, not a dramatic sweep -- tasteful movement,
    // a little squelch, nothing acid
    document.getElementById("knobMasterCutoff").value = 68;
    document.getElementById("knobMasterRes").value = 3.2;
    document.getElementById("knobFilterAttack").value = 80;
    document.getElementById("knobFilterDecay").value = 900;
    document.getElementById("knobFilterEnvDepth").value = 35;
    document.getElementById("knobFilterLfoRate").value = 0.1;
    document.getElementById("knobFilterLfoDepth").value = 20;

    // Tempo-synced dotted-eighth dub delay -- classic deep house skip,
    // always lands in time with the 4/4 pulse regardless of tempo tweaks
    document.getElementById("chkDelayTempoSync").checked = true;
    document.getElementById("selDelayNoteDivision").value = "0.75";
    document.getElementById("knobDelayFeedback").value = 35;
    document.getElementById("knobDelayTone").value = 2200;
    document.getElementById("knobDelayFlutter").value = 15;
    document.getElementById("knobDelayMix").value = 28;

    // Tight plate reverb (keeps the groove from getting washy) plus a
    // touch of classic chorus for that Rhodes-through-a-chorus-pedal width
    document.getElementById("selReverbMode").value = "PLATE";
    document.getElementById("knobReverbMix").value = 22;
    document.getElementById("knobReverbTone").value = 6000;
    document.getElementById("selChorusMode").value = "CLASSIC";
    document.getElementById("knobChorusRate").value = 0.3;
    document.getElementById("knobChorusDepth").value = 35;
    document.getElementById("knobChorusMix").value = 20;
  } else if (idx === 9) { // Airports (Generative Tape Loops & Glass Diffusion)
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "LYDIAN";
    document.getElementById("knobBpm").value = 58;
    document.getElementById("knobWeather").value = 15;
    document.getElementById("knobMutation").value = 12;

    document.getElementById("selDrumStyle").value = "MUTED";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumVol").value = 0;

    document.getElementById("knobStrum").value = 85;
    // PURE_SINE_GLASS provides the treated, glassy tape-piano
    // timbre for this generative ambient preset.
    document.getElementById("selChordTimbre").value = "PURE_SINE_GLASS";
    document.getElementById("knobChordFx").value = 88;

    // "C2" isn't a real selDroneOctave option (only D0/D1/D2 exist).
    document.getElementById("selDroneOctave").value = "D2";
    document.getElementById("knobDrone").value = 55;
    document.getElementById("knobDroneFilter").value = 240;
    document.getElementById("knobDroneDetune").value = 3;
    document.getElementById("knobDroneWander").value = 20;
    document.getElementById("knobDroneFx").value = 40;

    // WANDER / GLASS_BELL aren't real options either -- PENDULUM (slow
    // up/down) with a high rest% approximates the random drifting piano
    // notes, and SINE_CRYSTAL is the closest glassy-bell timbre available.
    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("selArpTimbre").value = "SINE_CRYSTAL";
    document.getElementById("knobArpGate").value = 260;
    document.getElementById("knobArpRest").value = 50;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 60;
    document.getElementById("knobArpFx").value = 75;

    document.getElementById("knobMasterCutoff").value = 85;
    document.getElementById("knobMasterRes").value = 1.5;
    document.getElementById("knobFilterAttack").value = 140;
    document.getElementById("knobFilterDecay").value = 1600;
    document.getElementById("knobFilterEnvDepth").value = 25;
    document.getElementById("knobFilterLfoRate").value = 0.05;
    document.getElementById("knobFilterLfoDepth").value = 15;

    document.getElementById("chkDelayTempoSync").checked = false;
    document.getElementById("knobDelayTime").value = 720;
    document.getElementById("knobDelayFeedback").value = 48;
    document.getElementById("knobDelayTone").value = 1800;
    document.getElementById("knobDelayFlutter").value = 40;
    document.getElementById("knobDelayMix").value = 45;

    // SHIMMER / DIMENSION aren't real selReverbMode / selChorusMode
    // options -- CATHEDRAL gives the same vast, washed-out space, and
    // ENSEMBLE the same lush, wide chorus.
    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 50;
    document.getElementById("knobReverbTone").value = 5000;
    document.getElementById("selChorusMode").value = "ENSEMBLE";
    document.getElementById("knobChorusRate").value = 0.12;
    document.getElementById("knobChorusDepth").value = 40;
    document.getElementById("knobChorusMix").value = 28;
  } else if (idx === 10) { // Douglas Firs (Noir Vibraphone Ballad & Rain Mist)
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "AEOLIAN";
    document.getElementById("knobBpm").value = 56;
    document.getElementById("knobWeather").value = 70;
    document.getElementById("knobMutation").value = 15;

    // A slow sub kick + rim felt more than heard -- the uneasy pulse under
    // the score, not a groove. No auto-evolve: this one holds still.
    document.getElementById("selDrumStyle").value = "HEARTBEAT";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumEvolveChance").value = 10;
    document.getElementById("knobDrumVol").value = 35;
    document.getElementById("knobDrumPunch").value = 50;
    document.getElementById("knobDrumDensity").value = 25;

    document.getElementById("knobStrum").value = 90;
    document.getElementById("knobDrone").value = 78;
    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDroneFilter").value = 130;
    document.getElementById("knobDroneDetune").value = 4.5;
    document.getElementById("knobDroneWander").value = 35;
    document.getElementById("knobDroneFx").value = 32;
    document.getElementById("knobDrumFx").value = 25;

    // Vibraphone & celesta acoustic chime -- long sustain, soft
    // touch, heavily sent to the drenched delay/reverb below.
    document.getElementById("selChordTimbre").value = "VIBES_CELESTE";
    document.getElementById("knobChordDynamics").value = 75;
    document.getElementById("knobChordSustain").value = 160;
    document.getElementById("knobChordVol").value = 86;
    document.getElementById("knobChordFx").value = 82;

    // A slow rocking bell chime motif,
    // held static and spaced out rather than evolving or busy.
    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "GLASS_FM";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpEvolveChance").value = 10;
    document.getElementById("knobArpGate").value = 520;
    document.getElementById("knobArpRest").value = 45;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 65;
    document.getElementById("knobArpFx").value = 75;

    // Pacific Northwest rainy forest mist & vintage tape dust
    if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = "RAIN";
    if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = "GUSTS";
    if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 42;
    if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 32;
    if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 65;
    if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 28;
    if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 65;

    document.getElementById("knobMasterCutoff").value = 54;
    document.getElementById("knobMasterRes").value = 2.0;
    document.getElementById("knobFilterAttack").value = 180;
    document.getElementById("knobFilterDecay").value = 2000;
    document.getElementById("knobFilterEnvDepth").value = 28;
    document.getElementById("knobFilterLfoRate").value = 0.06;
    document.getElementById("knobFilterLfoDepth").value = 18;

    document.getElementById("chkDelayTempoSync").checked = false;
    document.getElementById("knobDelayTime").value = 580;
    document.getElementById("knobDelayFeedback").value = 42;
    document.getElementById("knobDelayTone").value = 2200;
    document.getElementById("knobDelayFlutter").value = 32;
    document.getElementById("knobDelayMix").value = 44;

    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 54;
    document.getElementById("knobReverbTone").value = 4600;
    document.getElementById("selChorusMode").value = "ENSEMBLE";
    document.getElementById("knobChorusRate").value = 0.28;
    document.getElementById("knobChorusDepth").value = 45;
    document.getElementById("knobChorusMix").value = 32;

    if (document.getElementById("knobEqLow")) document.getElementById("knobEqLow").value = 2.0;
    if (document.getElementById("knobEqHigh")) document.getElementById("knobEqHigh").value = -1.5;
    if (document.getElementById("knobMasterDrive")) document.getElementById("knobMasterDrive").value = 22;
  } else if (idx === 11) { // Twinning (Braindance Micro-Poly & IDM Breakbeat Pocket, DELAY -> FILTER -> SPACE at 48% feedback)
    rewireDspChain(['DELAY', 'FILTER', 'SPACE'], false);
    document.getElementById("selTimeSig").value = "7/8";
    activeScaleKey = "HIRAJOSHI";
    document.getElementById("knobBpm").value = 104;
    document.getElementById("knobWeather").value = 62;
    document.getElementById("knobMutation").value = 48;

    document.getElementById("selDrumStyle").value = "BREAKBEAT_POCKET";
    if (document.getElementById("selDrumKit")) document.getElementById("selDrumKit").value = "ANALOG_CRUNCH";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 38;
    document.getElementById("knobDrumVol").value = 84;
    document.getElementById("knobDrumPunch").value = 78;
    document.getElementById("knobDrumDensity").value = 82;
    document.getElementById("knobDrumFx").value = 52;

    document.getElementById("knobStrum").value = 35;
    document.getElementById("selChordTimbre").value = "PURE_SINE_GLASS";
    document.getElementById("knobChordDynamics").value = 78;
    document.getElementById("knobChordSustain").value = 145;
    document.getElementById("knobChordVol").value = 80;
    document.getElementById("knobChordFx").value = 92;

    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDrone").value = 68;
    document.getElementById("knobDroneFilter").value = 175;
    document.getElementById("knobDroneDetune").value = 5.5;
    document.getElementById("knobDroneWander").value = 35;
    document.getElementById("knobDroneFx").value = 45;

    document.getElementById("selArpPattern").value = "SHIMMER";
    document.getElementById("chkAutoEvolveArpPattern").checked = true;
    document.getElementById("selArpTimbre").value = "GLASS_FM";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpEvolveChance").value = 32;
    document.getElementById("knobArpGate").value = 190;
    document.getElementById("knobArpRest").value = 18;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 76;
    document.getElementById("knobArpFx").value = 90;

    if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = "WHITE_TAPE";
    if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = "RHYTHMIC";
    if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 64;
    if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 68;
    if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 55;
    if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 28;
    if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 75;

    // Delay feeds into resonant filter at 48% feedback ceiling
    document.getElementById("chkDelayTempoSync").checked = true;
    document.getElementById("selDelayNoteDivision").value = "0.75";
    document.getElementById("knobDelayFeedback").value = 48;
    document.getElementById("knobDelayTone").value = 2800;
    document.getElementById("knobDelayFlutter").value = 38;
    document.getElementById("knobDelayMix").value = 46;

    document.getElementById("knobMasterCutoff").value = 54;
    document.getElementById("knobMasterRes").value = 3.8;
    document.getElementById("knobFilterAttack").value = 35;
    document.getElementById("knobFilterDecay").value = 520;
    document.getElementById("knobFilterEnvDepth").value = 55;
    document.getElementById("knobFilterLfoRate").value = 0.22;
    document.getElementById("knobFilterLfoDepth").value = 32;

    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 48;
    document.getElementById("knobReverbTone").value = 4600;
    document.getElementById("selChorusMode").value = "VIBRATO";
    document.getElementById("knobChorusRate").value = 0.42;
    document.getElementById("knobChorusDepth").value = 36;
    document.getElementById("knobChorusMix").value = 26;
    if (document.getElementById("knobMasterDrive")) document.getElementById("knobMasterDrive").value = 22;
  } else if (idx === 12) { // Tangerine (Berlin School Analog Sequencer, FILTER -> DELAY -> SPACE)
    rewireDspChain(['FILTER', 'DELAY', 'SPACE'], false);
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "PHRYGIAN";
    document.getElementById("knobBpm").value = 96;
    document.getElementById("knobWeather").value = 68;
    document.getElementById("knobMutation").value = 32;

    document.getElementById("selDrumStyle").value = "HEARTBEAT";
    if (document.getElementById("selDrumKit")) document.getElementById("selDrumKit").value = "ANALOG_CRUNCH";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumVol").value = 58;
    document.getElementById("knobDrumPunch").value = 65;
    document.getElementById("knobDrumDensity").value = 40;
    document.getElementById("knobDrumFx").value = 45;

    document.getElementById("knobStrum").value = 25;
    document.getElementById("selChordTimbre").value = "DIGITAL_STRINGS";
    document.getElementById("knobChordDynamics").value = 88;
    document.getElementById("knobChordSustain").value = 155;
    document.getElementById("knobChordVol").value = 84;
    document.getElementById("knobChordFx").value = 90;

    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDrone").value = 82;
    document.getElementById("knobDroneFilter").value = 220;
    document.getElementById("knobDroneDetune").value = 4.2;
    document.getElementById("knobDroneWander").value = 15;
    document.getElementById("knobDroneFx").value = 50;

    // Hypnotic Berlin School sequenced arpeggiator
    document.getElementById("selArpPattern").value = "UP";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "ANALOG_PULSE";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpGate").value = 165;
    document.getElementById("knobArpRest").value = 5;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 88;
    document.getElementById("knobArpFx").value = 92;

    if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = "WIND";
    if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = "GUSTS";
    if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 48;
    if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 35;
    if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 68;
    if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 32;
    if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 85;

    // Sweeping resonant analog filter feeding dotted-eighth delay & cathedral space
    document.getElementById("knobMasterCutoff").value = 56;
    document.getElementById("knobMasterRes").value = 4.5;
    document.getElementById("knobFilterAttack").value = 40;
    document.getElementById("knobFilterDecay").value = 780;
    document.getElementById("knobFilterEnvDepth").value = 68;
    document.getElementById("knobFilterLfoRate").value = 0.14;
    document.getElementById("knobFilterLfoDepth").value = 38;

    document.getElementById("chkDelayTempoSync").checked = true;
    document.getElementById("selDelayNoteDivision").value = "0.75";
    document.getElementById("knobDelayFeedback").value = 46;
    document.getElementById("knobDelayTone").value = 2400;
    document.getElementById("knobDelayFlutter").value = 24;
    document.getElementById("knobDelayMix").value = 48;

    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 58;
    document.getElementById("knobReverbTone").value = 5200;
    document.getElementById("selChorusMode").value = "ENSEMBLE";
    document.getElementById("knobChorusRate").value = 0.28;
    document.getElementById("knobChorusDepth").value = 48;
    document.getElementById("knobChorusMix").value = 34;
    if (document.getElementById("knobMasterDrive")) document.getElementById("knobMasterDrive").value = 24;
  } else if (idx === 13) { // Disintegration (Degraded Tape Loops & Muffled Repeats, SPACE -> DELAY -> FILTER)
    rewireDspChain(['SPACE', 'DELAY', 'FILTER'], false);
    document.getElementById("selTimeSig").value = "3/4";
    activeScaleKey = "LYDIAN";
    document.getElementById("knobBpm").value = 52;
    document.getElementById("knobWeather").value = 78;
    document.getElementById("knobMutation").value = 10;

    document.getElementById("selDrumStyle").value = "MUTED";
    document.getElementById("chkAutoEvolveDrums").checked = false;
    document.getElementById("knobDrumVol").value = 0;

    document.getElementById("knobStrum").value = 115;
    document.getElementById("selChordTimbre").value = "CHAMBER_WOODS";
    document.getElementById("knobChordDynamics").value = 68;
    document.getElementById("knobChordSustain").value = 185;
    document.getElementById("knobChordVol").value = 86;
    document.getElementById("knobChordFx").value = 95;

    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDrone").value = 76;
    document.getElementById("knobDroneFilter").value = 125;
    document.getElementById("knobDroneDetune").value = 6.5;
    document.getElementById("knobDroneWander").value = 32;
    document.getElementById("knobDroneFx").value = 80;

    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "SINE_CRYSTAL";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpGate").value = 480;
    document.getElementById("knobArpRest").value = 55;
    document.getElementById("knobArpOctaves").value = 1;
    document.getElementById("knobArpVol").value = 52;
    document.getElementById("knobArpFx").value = 92;

    // Oxidized magnetic tape hiss & crackle
    if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = "WHITE_TAPE";
    if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = "CONTINUOUS";
    if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 28;
    if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 45;
    if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 75;
    if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 38;
    if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 88;

    // Reverb & worn tape delay feed INTO a dark low-pass filter to muffle repeat tails
    document.getElementById("selReverbMode").value = "CATHEDRAL";
    document.getElementById("knobReverbMix").value = 62;
    document.getElementById("knobReverbTone").value = 2600;
    document.getElementById("selChorusMode").value = "VIBRATO";
    document.getElementById("knobChorusRate").value = 0.18;
    document.getElementById("knobChorusDepth").value = 52;
    document.getElementById("knobChorusMix").value = 36;

    document.getElementById("chkDelayTempoSync").checked = false;
    document.getElementById("knobDelayTime").value = 680;
    document.getElementById("knobDelayFeedback").value = 48;
    document.getElementById("knobDelayTone").value = 1150;
    document.getElementById("knobDelayFlutter").value = 65;
    document.getElementById("knobDelayMix").value = 52;

    document.getElementById("knobMasterCutoff").value = 38; // ~620 Hz dark muffled tape ceiling
    document.getElementById("knobMasterRes").value = 1.8;
    document.getElementById("knobFilterAttack").value = 240;
    document.getElementById("knobFilterDecay").value = 2200;
    document.getElementById("knobFilterEnvDepth").value = 18;
    document.getElementById("knobFilterLfoRate").value = 0.04;
    document.getElementById("knobFilterLfoDepth").value = 22;

    if (document.getElementById("knobEqLow")) document.getElementById("knobEqLow").value = 3.0;
    if (document.getElementById("knobEqHigh")) document.getElementById("knobEqHigh").value = -4.5;
    if (document.getElementById("knobMasterDrive")) document.getElementById("knobMasterDrive").value = 42;
  } else if (idx === 14) { // Lo-Fi Chillhop (Boom-Bap Swing, Rhodes Chords, Rain/Vinyl Texture, FILTER -> DELAY -> SPACE)
    rewireDspChain(['FILTER', 'DELAY', 'SPACE'], false);
    document.getElementById("selTimeSig").value = "4/4";
    activeScaleKey = "DORIAN";
    document.getElementById("knobBpm").value = 76;
    document.getElementById("knobWeather").value = 42;
    document.getElementById("knobMutation").value = 28;

    document.getElementById("selDrumStyle").value = "BREAKBEAT_POCKET";
    if (document.getElementById("selDrumKit")) document.getElementById("selDrumKit").value = "TAPE_DUST";
    document.getElementById("chkAutoEvolveDrums").checked = true;
    document.getElementById("knobDrumEvolveChance").value = 22;
    document.getElementById("knobDrumVol").value = 82;
    document.getElementById("knobDrumPunch").value = 68;
    document.getElementById("knobDrumDensity").value = 55;
    document.getElementById("knobDrumFx").value = 32;

    document.getElementById("knobStrum").value = 65;
    document.getElementById("selChordTimbre").value = "RHODES";
    document.getElementById("knobChordDynamics").value = 76;
    document.getElementById("knobChordSustain").value = 115;
    document.getElementById("knobChordVol").value = 85;
    document.getElementById("knobChordFx").value = 74;

    document.getElementById("selDroneOctave").value = "D1";
    document.getElementById("knobDrone").value = 72;
    document.getElementById("knobDroneFilter").value = 135;
    document.getElementById("knobDroneDetune").value = 2.5;
    document.getElementById("knobDroneWander").value = 12;
    document.getElementById("knobDroneFx").value = 25;

    document.getElementById("selArpPattern").value = "PENDULUM";
    document.getElementById("chkAutoEvolveArpPattern").checked = false;
    document.getElementById("selArpTimbre").value = "KALIMBA";
    document.getElementById("chkAutoEvolveArpTimbre").checked = false;
    document.getElementById("knobArpGate").value = 220;
    document.getElementById("knobArpRest").value = 30;
    document.getElementById("knobArpOctaves").value = 2;
    document.getElementById("knobArpVol").value = 68;
    document.getElementById("knobArpFx").value = 65;

    // Cozy window rain + vinyl warmth
    if (document.getElementById("selNoiseProfile")) document.getElementById("selNoiseProfile").value = "RAIN";
    if (document.getElementById("selNoiseMode")) document.getElementById("selNoiseMode").value = "GUSTS";
    if (document.getElementById("knobNoiseColor")) document.getElementById("knobNoiseColor").value = 38;
    if (document.getElementById("knobNoiseRate")) document.getElementById("knobNoiseRate").value = 42;
    if (document.getElementById("knobNoiseDrift")) document.getElementById("knobNoiseDrift").value = 50;
    if (document.getElementById("knobNoiseVol")) document.getElementById("knobNoiseVol").value = 34;
    if (document.getElementById("knobNoiseFx")) document.getElementById("knobNoiseFx").value = 55;

    // Filter -> Delay -> Space for warm muffled tape saturation
    document.getElementById("knobMasterCutoff").value = 56;
    document.getElementById("knobMasterRes").value = 1.6;
    document.getElementById("knobFilterAttack").value = 55;
    document.getElementById("knobFilterDecay").value = 720;
    document.getElementById("knobFilterEnvDepth").value = 28;
    document.getElementById("knobFilterLfoRate").value = 0.08;
    document.getElementById("knobFilterLfoDepth").value = 16;

    document.getElementById("chkDelayTempoSync").checked = true;
    document.getElementById("selDelayNoteDivision").value = "1";
    document.getElementById("knobDelayFeedback").value = 36;
    document.getElementById("knobDelayTone").value = 1650;
    document.getElementById("knobDelayFlutter").value = 34;
    document.getElementById("knobDelayMix").value = 32;

    document.getElementById("selReverbMode").value = "PLATE";
    document.getElementById("knobReverbMix").value = 26;
    document.getElementById("knobReverbTone").value = 4200;
    document.getElementById("selChorusMode").value = "CLASSIC";
    document.getElementById("knobChorusRate").value = 0.26;
    document.getElementById("knobChorusDepth").value = 32;
    document.getElementById("knobChorusMix").value = 28;

    if (document.getElementById("knobEqLow")) document.getElementById("knobEqLow").value = 2.0;
    if (document.getElementById("knobEqHigh")) document.getElementById("knobEqHigh").value = -2.0;
    if (document.getElementById("knobMasterDrive")) document.getElementById("knobMasterDrive").value = 28;
  }

  const scale = SCALES[activeScaleKey] || SCALES.DORIAN;
  currentChordVoicing = pickNextVoicingIdx(-1, activeScaleKey);
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

  // 4. Restore pedal bypass states and DSP chain routing topology
  if (data.pedalBypass && typeof data.pedalBypass === "object" && typeof pedalBypassState !== "undefined") {
    ["FILTER", "DELAY", "SPACE"].forEach(k => {
      if (typeof data.pedalBypass[k] === "boolean") {
        pedalBypassState[k] = data.pedalBypass[k];
        const card = document.getElementById("pedalCard_" + k);
        const btn = document.getElementById("stompBtn_" + k);
        if (card) card.classList.toggle("bypassed", pedalBypassState[k]);
        if (btn) btn.classList.toggle("active", !pedalBypassState[k]);
      }
    });
  }
  if (Array.isArray(data.dspChainOrder) && data.dspChainOrder.length === 3) {
    rewireDspChain(data.dspChainOrder, false);
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
      btn.textContent = `U${i}: ${entry.name}`;
      btn.title = `Slot U${i} (${entry.name}) — Click to load, Shift-click to overwrite`;
    } else {
      btn.textContent = `U${i}: Empty`;
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
