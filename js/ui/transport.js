// =====================================================================
// SLAMBIENT MASTER TRANSPORT & GLOBAL SESSION ENGINE
// Play/Pause, Session Timer, App Fullscreen & Global Hotkeys
// =====================================================================

let sessionSeconds = 0;
let sessionTimerInterval = null;

function updateSessionTimerUI() {
  const mins = Math.floor(sessionSeconds / 60);
  const secs = sessionSeconds % 60;
  const str = String(mins).padStart(2, '0') + ":" + String(secs).padStart(2, '0');
  const el = document.getElementById("hudTimer");
  if (el) el.textContent = str;
}

function startSessionTimer() {
  if (sessionTimerInterval) return;
  sessionTimerInterval = setInterval(() => {
    if (isPlaying) {
      sessionSeconds++;
      updateSessionTimerUI();
    }
  }, 1000);
}

function stopSessionTimer() {
  if (sessionTimerInterval) {
    clearInterval(sessionTimerInterval);
    sessionTimerInterval = null;
  }
}

function togglePlay() {
  ensureAudioReady();

  isPlaying = !isPlaying;
  const btn = document.getElementById("btnPlay");
  const label = document.getElementById("btnPlayLabel");
  const status = document.getElementById("footerStatus");

  if (isPlaying) {
    btn.classList.add("active"); label.textContent = "Pause";
    status.textContent = "Engine: Running (" + bpm + " BPM)";
    stopLiveArp();
    let usedWorklet = false;
    if (workletClockReady) {
      usedWorklet = startWorkletClock();
    }
    if (!usedWorklet) {
      const ms = (60000 / bpm) / 4;
      clockInterval = setInterval(clockTick, ms);
      scheduleAudioClockFallback();
    }
    triggerCurrentChord();
    startSessionTimer();
    midiSubSync();
    requestWakeLock();

    // Anti-click soft attack envelope on Drone & Sub-Bass
    if (audioCtx) {
      const now = audioCtx.currentTime;
      const isDroneAudible = isChannelAudible('drone');
      if (droneGain) {
        droneGain.gain.cancelScheduledValues(now);
        droneGain.gain.setValueAtTime(0.0001, now);
        droneGain.gain.linearRampToValueAtTime(isDroneAudible ? droneVol * 0.12 : 0.0001, now + 0.035);
      }
      if (tanpuraBusGain) {
        tanpuraBusGain.gain.cancelScheduledValues(now);
        tanpuraBusGain.gain.setValueAtTime(0.0001, now);
        tanpuraBusGain.gain.linearRampToValueAtTime((isDroneAudible && tanpuraEnabled) ? tanpuraVol * 0.95 : 0.0001, now + 0.035);
      }
    }
  } else {
    btn.classList.remove("active"); label.textContent = "Start";
    status.textContent = "Engine: Paused";
    stopWorkletClock();
    if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
    stopAudioClockFallback();
    stopSessionTimer();
    midiAllNotesOff();
    releaseWakeLock();
    if (typeof roadsideObjects !== "undefined") roadsideObjects.length = 0;

    // Anti-click soft release envelope on Drone & Sub-Bass before full stop
    if (audioCtx) {
      const now = audioCtx.currentTime;
      if (droneGain) {
        droneGain.gain.cancelScheduledValues(now);
        droneGain.gain.setValueAtTime(droneGain.gain.value, now);
        droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.040);
      }
      if (tanpuraBusGain) {
        tanpuraBusGain.gain.cancelScheduledValues(now);
        tanpuraBusGain.gain.setValueAtTime(tanpuraBusGain.gain.value, now);
        tanpuraBusGain.gain.linearRampToValueAtTime(0.0001, now + 0.040);
      }
    }

    if (keyboardRoute === "ARP" && heldMidiNotes.size > 0) {
      const ms = (60000 / bpm) / 4;
      liveArpTimer = setInterval(triggerLiveArpStep, ms);
    }
  }
  // Recompute gains now so the drone (gated on isPlaying, unlike the
  // note-triggered instruments) actually starts/stops right away instead of
  // waiting for the next unrelated param change.
  updateAudioParams();
  syncMediaSessionPlaybackState();
}

function panicMute() {
  if (isPlaying) togglePlay();
  stopAudioClockFallback();
  stopLiveArp();
  for (const [m] of Array.from(activeLiveVoices.entries())) {
    stopNoteLive(m, true);
  }
  heldMidiNotes.clear();
  activeLiveVoices.clear();
  activeMidiNotes.clear();
  recentChordNotes.clear();
  if (typeof pointerActiveMidi !== "undefined") pointerActiveMidi.clear();
  if (audioCtx) audioCtx.suspend();
  syncMediaSessionPlaybackState();
  document.getElementById("footerStatus").textContent = "Engine: Muted";
}

function applyMasterVolumeToAudio() {
  if (!masterVolumeGain || !audioCtx) return;
  const target = masterMuted ? 0 : masterVolumeVal;
  masterVolumeGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.05);
}

function updateMasterVolume(val) {
  masterVolumeVal = parseInt(val) / 100;
  document.getElementById("lblMasterVolume").textContent = Math.round(masterVolumeVal * 100) + "%";
  applyMasterVolumeToAudio();
}

// Whole-app fullscreen (Phase 7). Separate from the visualizer's own
// fullscreen (toggleScopeFullscreen), which only blows up the scope panel.
// No letter shortcut on purpose: A-; are all QWERTY note keys.
// Uses the real Fullscreen API on the document, so Esc/browser chrome exit
// it too; the button state follows fullscreenchange rather than assuming.
function toggleAppFullscreen() {
  const doc = document;
  const el = doc.documentElement;
  const isFs = doc.fullscreenElement || doc.webkitFullscreenElement;
  try {
    if (isFs) (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc);
    else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
  } catch (err) {
    setRecordStatus("Full screen isn't available in this browser");
  }
  const btn = document.getElementById("btnAppFullscreen");
  if (btn) btn.blur();
}

function syncAppFullscreenButton() {
  const btn = document.getElementById("btnAppFullscreen");
  if (!btn) return;
  const on = !!(document.fullscreenElement || document.webkitFullscreenElement);
  btn.classList.toggle("active", on);
  btn.title = on ? "Exit full screen (Esc)" : "Full screen";
  const lbl = btn.querySelector("span");
  if (lbl) lbl.textContent = on ? "Exit Full" : "Full Screen";
  setTimeout(() => {
    window.dispatchEvent(new Event("resize"));
    if (typeof scopeNeedsResize !== "undefined") scopeNeedsResize = true;
    if (typeof orbitalNeedsResize !== "undefined") orbitalNeedsResize = true;
  }, 60);
}
document.addEventListener("fullscreenchange", syncAppFullscreenButton);
document.addEventListener("webkitfullscreenchange", syncAppFullscreenButton);

// Preset chips ellipsize when the header is narrow (e.g. 150% browser zoom),
// so make sure every chip carries its full name as a tooltip.
(function initPresetChipTitles() {
  document.querySelectorAll(".preset-bar .btn-preset-chip").forEach(chip => {
    const name = chip.textContent.trim();
    if (!chip.title) chip.title = name;
    else if (!chip.title.startsWith(name)) chip.title = `${name}: ${chip.title}`;
  });
})();


// Space / Enter global transport keys (Phase 11). Space toggles play/pause when
// Void Raiders arcade is not active; Enter toggles play/pause universally.
// Skipped while typing in a text field or while a custom dropdown is open.
(function bindGlobalTransportKeys() {
  window.addEventListener("keydown", (e) => {
    const isEnter = (e.key === "Enter");
    const isSpace = (e.code === "Space" && (typeof arcadeActive === "undefined" || !arcadeActive));
    if ((!isEnter && !isSpace) || e.repeat || e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
    const t = e.target;
    if (t && t.isContentEditable) return;
    if (t && t.tagName === "TEXTAREA") return;
    if (t && t.tagName === "INPUT" && !["range", "checkbox", "radio", "button"].includes(t.type)) return;
    if (document.querySelector(".custom-dropdown-menu.open")) return;
    if (isSpace && t && t.tagName === "BUTTON") {
      t.blur();
    }
    e.preventDefault();
    togglePlay();
  });
})();

function toggleMasterMute() {
  masterMuted = !masterMuted;
  const btn = document.getElementById("btnMasterMute");
  if (btn) btn.classList.toggle("active", masterMuted);
  applyMasterVolumeToAudio();
}

