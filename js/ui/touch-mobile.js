// =====================================================================
// SLAMBIENT TOUCH, GESTURE & MOBILE INTERACTION HANDLERS
// Touch zoom locks, pointer isolation, dropdown menus & swipe physics
// =====================================================================

/* ==========================================================================
   Mobile & Touch Zoom Lockdown
   Completely removes manual touch-zoom capability (pinch-to-zoom and double-tap zoom)
   on mobile devices and touch screens.
   ========================================================================== */
(function lockMobileZoom() {
  // 1. WebKit gesture events (Safari iOS pinch zoom prevention)
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
    document.addEventListener(eventName, (e) => {
      e.preventDefault();
    }, { passive: false });
  });

  // 2. Multi-touch touchmove pinch zoom prevention (preserves multi-touch piano chords & arcade controls)
  document.addEventListener('touchmove', (e) => {
    if (e.target && e.target.closest && e.target.closest('.piano-keys-wrapper, .arcade-controls, .arcade-pad, .arcade-btn')) {
      return;
    }
    if ((e.scale !== undefined && e.scale !== 1) || (e.touches && e.touches.length > 1)) {
      e.preventDefault();
    }
  }, { passive: false });

  // 3. Prevent double-tap to zoom while preserving responsive clicks on buttons, keys, and controls
  let lastTouchEndTime = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEndTime <= 320) {
      const isInteractive = e.target && e.target.closest && e.target.closest(
        'button, [role="button"], input, select, a, .piano-key, .black-key, .white-key, .mobile-macro-tile, .custom-dropdown-trigger, .custom-dropdown-item, .custom-dropdown-wrap, .btn-preset-chip, .btn-oct, .btn-kb-view, .vert-mode-btn, .arcade-btn, .arcade-pad-thumb, .master-vol-mute, .toggle-switch, .badge-tag'
      );
      if (!isInteractive) {
        e.preventDefault();
      }
    }
    lastTouchEndTime = now;
  }, { passive: false });

  // 4. Double-click prevention (preserves scope fullscreen toggle)
  document.addEventListener('dblclick', (e) => {
    if (e.target && e.target.closest && e.target.closest('.scope-left-viz')) {
      return;
    }
    e.preventDefault();
  }, { passive: false });

  // 5. Trackpad / mouse ctrl-wheel pinch zoom prevention
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  }, { passive: false });
})();

/* ===== Phone layout helpers ===== */
/* --- Header (phone): fullscreen-API flag, preset strip fades, mini transport bar --- */
(function initPhoneHeader() {
  const mq = window.matchMedia("(max-width: 640px), (orientation: landscape) and (max-height: 550px)");
  const $ = (id) => document.getElementById(id);
  const onMqChange = (fn) => { try { mq.addEventListener("change", fn); } catch (e) { mq.addListener(fn); } };

  // iPhone Safari has no page Fullscreen API: flag it so the phone CSS can
  // hide the app Full Screen button (harmless on desktop, where it exists).
  try {
    const d = document;
    if (!(d.fullscreenEnabled || d.webkitFullscreenEnabled)) {
      d.documentElement.classList.add("no-fullscreen-api");
    }
  } catch (e) {}

  // Preset strip: show the left fade once scrolled, drop the right fade at
  // the end, and bring a newly active chip into view (horizontally only).
  try {
    const strip = document.querySelector(".preset-bar");
    if (strip) {
      const syncFades = () => {
        if (!mq.matches) { strip.classList.remove("is-scrolled", "at-end"); return; }
        const max = strip.scrollWidth - strip.clientWidth;
        strip.classList.toggle("is-scrolled", strip.scrollLeft > 2);
        strip.classList.toggle("at-end", max <= 2 || strip.scrollLeft >= max - 2);
      };
      strip.addEventListener("scroll", syncFades, { passive: true });
      window.addEventListener("resize", syncFades);
      onMqChange(syncFades);
      syncFades();

      // Only react to a chip that just gained .active -- never to the strip's
      // own fade classes, or the user's own scrolling would be undone.
      const revealChip = (chip) => {
        const pad = 12, sr = strip.getBoundingClientRect(), cr = chip.getBoundingClientRect();
        const left = cr.left - sr.left + strip.scrollLeft, right = left + cr.width;
        if (left < strip.scrollLeft + pad) strip.scrollTo({ left: left - pad, behavior: "smooth" });
        else if (right > strip.scrollLeft + strip.clientWidth - 40) strip.scrollTo({ left: right - strip.clientWidth + 40, behavior: "smooth" });
      };
      new MutationObserver((muts) => {
        if (!mq.matches) return;
        for (const m of muts) {
          const t = m.target;
          if (t !== strip && t.classList.contains("active") && !/(^|\s)active(\s|$)/.test(m.oldValue || "")) { revealChip(t); break; }
        }
      }).observe(strip, { subtree: true, attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    }
  } catch (e) {}

  // Mini transport bar: Play/Pause, Record and BPM, fixed to the bottom of
  // the screen while the header's Start button is scrolled out of view.
  // Mirrors #btnPlay / #btnRecord / #lblBpmHeader and calls the existing
  // togglePlay() / toggleRecord(). Built only once a phone width is seen.
  const btnPlay = $("btnPlay"), btnRec = $("btnRecord");
  if (!btnPlay || !btnRec) return;
  let bar = null, startVisible = true;

  function build() {
    bar = document.createElement("div");
    bar.className = "mini-transport";
    bar.id = "miniTransport";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Transport");
    bar.innerHTML =
      '<button type="button" class="btn-main-play" data-mt="play">' +
        '<span class="play-icon-wrap">' +
          '<svg class="icon-play" viewBox="0 0 16 16" fill="currentColor"><path d="M4.5 2.5L13 8L4.5 13.5V2.5Z"/></svg>' +
          '<svg class="icon-pause" viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3.2" height="11" rx="0.8"/><rect x="9.3" y="2.5" width="3.2" height="11" rx="0.8"/></svg>' +
        '</span><span data-mt="play-label">Start</span>' +
      '</button>' +
      '<button type="button" class="btn-record" data-mt="rec"><div class="rec-dot"></div><span data-mt="rec-label">Record</span></button>' +
      '<button type="button" class="btn-mic-mini" data-field-hold aria-label="Hold to sample from microphone" title="Hold to record from the microphone (a quick tap records 5 s)"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg><span>SAMPLE</span></button>' +
      '<div class="mt-bpm" aria-label="Tempo"><span class="mt-bpm-k">BPM</span><span class="mt-bpm-v" data-mt="bpm">--</span></div>';
    document.body.appendChild(bar);

    const mPlay = bar.querySelector('[data-mt="play"]');
    const mPlayLbl = bar.querySelector('[data-mt="play-label"]');
    const mRec = bar.querySelector('[data-mt="rec"]');
    const mRecLbl = bar.querySelector('[data-mt="rec-label"]');
    const mBpm = bar.querySelector('[data-mt="bpm"]');

    mPlay.addEventListener("click", () => { if (typeof togglePlay === "function") togglePlay(); mPlay.blur(); });
    mRec.addEventListener("click", () => { if (typeof toggleRecord === "function") toggleRecord(); mRec.blur(); });

    const syncPlay = () => {
      const lbl = $("btnPlayLabel");
      mPlay.classList.toggle("active", btnPlay.classList.contains("active"));
      if (lbl) mPlayLbl.textContent = lbl.textContent;
      mPlay.title = btnPlay.classList.contains("active") ? "Pause" : "Start";
    };
    const syncRec = () => {
      const lbl = $("btnRecordLabel");
      mRec.classList.toggle("recording", btnRec.classList.contains("recording"));
      mRec.disabled = !!btnRec.disabled;
      if (lbl) mRecLbl.textContent = lbl.textContent;
    };
    const syncBpm = () => {
      const lbl = $("lblBpmHeader");
      const n = lbl ? parseInt(lbl.textContent, 10) : NaN;
      mBpm.textContent = isNaN(n) ? "--" : String(n);
    };
    const watch = { attributes: true, attributeFilter: ["class", "disabled"], childList: true, characterData: true, subtree: true };
    new MutationObserver(syncPlay).observe(btnPlay, watch);
    new MutationObserver(syncRec).observe(btnRec, watch);
    const bpmLbl = $("lblBpmHeader");
    if (bpmLbl) new MutationObserver(syncBpm).observe(bpmLbl, { childList: true, characterData: true, subtree: true });
    syncPlay(); syncRec(); syncBpm();

    // Show the bar once the header's Start button has scrolled off the top.
    // Measured from the button's position on scroll / resize / rotation (not an
    // IntersectionObserver, whose callbacks iPhone Safari can delay or drop
    // while the toolbars collapse), so the bar always matches where the page is.
    let measureRaf = 0;
    const measure = () => {
      measureRaf = 0;
      startVisible = btnPlay.getBoundingClientRect().bottom > 0;
      update();
    };
    const queueMeasure = () => { if (!measureRaf) measureRaf = requestAnimationFrame(measure); };
    window.addEventListener("scroll", queueMeasure, { passive: true });
    window.addEventListener("resize", queueMeasure);
    window.addEventListener("orientationchange", queueMeasure);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", queueMeasure);
      window.visualViewport.addEventListener("scroll", queueMeasure);
    }
    measure();
  }

  function update() {
    if (!bar) return;
    const show = mq.matches && !startVisible;
    bar.hidden = !mq.matches;
    bar.classList.toggle("is-visible", show);
    bar.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function onMq() {
    if (mq.matches && !bar) build();
    update();
  }
  onMqChange(onMq);
  onMq();
})();

/* Upper deck (phone): one touch = one note on the piano keys.
   A touch contact fires pointerenter (with buttons === 1) just before
   pointerdown, so bindKeyEvents()'s pointerenter handler (meant for mouse
   glissando) starts the note, then pointerdown starts it again. The second
   start drops the note from heldMidiNotes while the finger is still down, so
   LIVE takeover and chord detection never fire from touch. Touch pointers
   are implicitly captured by the key they land on, so pointerenter has no
   other job for touch; stop it at the container before it reaches the key.
   Touch only (any width, so landscape phones and tablets too); mouse and pen
   glissando are unchanged. */
(function () {
  const keys = document.getElementById('keyboardContainer');
  if (!keys) return;
  keys.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'touch' && e.target !== keys) e.stopPropagation();
  }, true);
})();

/* ---- Orbital view on phones (orbs, touch, bottom sheet) ----
   All of this is a no-op unless the phone media query matches.
   Relies on the main script's globals: ORBITAL_MODULES, draggedOrbId,
   dragPointerId, dragMoved, closeOrbitalModal(). */
(function orbitalPhone() {
  const mq = window.matchMedia ? window.matchMedia("(max-width: 640px), (orientation: landscape) and (max-height: 550px)") : null;
  if (!mq) return;
  const onMqChange = (fn) => {
    try { mq.addEventListener("change", fn); } catch (e) { try { mq.addListener(fn); } catch (e2) {} }
  };

  // 1. Orb size on phones is handled by the ORB SIZE slider's 65% default
  //    (applyDefaultOrbSize), so no extra per-orb scaling is needed here.
  //    The first frame lays the orbs out on a circle sized to the arena's
  //    short side; in a tall phone arena that leaves empty bands above and
  //    below, so stretch that first layout vertically into an ellipse once.
  function stretchInitialLayout() {
    let tries = 0;
    const tick = () => {
      if (!mq.matches || typeof ORBITAL_MODULES === "undefined") return;
      const first = ORBITAL_MODULES[0];
      if (!first || !first.initialized) { if (++tries < 600) requestAnimationFrame(tick); return; }
      const w = (typeof cachedOrbitalW !== "undefined" && cachedOrbitalW) || 0;
      const h = (typeof cachedOrbitalH !== "undefined" && cachedOrbitalH) || 0;
      if (!w || !h || h <= w) return;
      const k = Math.min(1.3, (h * 0.36) / Math.min(w * 0.38, h * 0.36));
      const cy = h / 2;
      ORBITAL_MODULES.forEach((orb) => { orb.y = cy + (orb.y - cy) * k; });
    };
    requestAnimationFrame(tick);
  }

  // 2. Touch: the canvas uses touch-action: pan-y, so a vertical swipe that
  //    starts on an orb scrolls the page and the browser sends pointercancel.
  //    The orb handler treats a cancel without movement as a tap and would open
  //    the sheet mid-scroll; mark it as a drag first (window capture runs
  //    before the canvas listener) so it's a no-op release instead.
  window.addEventListener("pointercancel", (e) => {
    if (!mq.matches || e.pointerType === "mouse") return;
    try {
      if (typeof draggedOrbId !== "undefined" && draggedOrbId && e.pointerId === dragPointerId) dragMoved = true;
    } catch (err) {}
  }, true);

  // 3. Bottom sheet gestures on the header (grab handle / title row):
  //    drag down to close, swipe left / right to step to the next / previous
  //    module (wraps around). The first ~8px of movement picks the axis.
  let panel = null, header = null;
  let pid = null, startX = 0, startY = 0, dx = 0, dy = 0, t0 = 0, axis = null;
  function resetDrag() {
    pid = null; dx = 0; dy = 0; axis = null;
    if (panel) { panel.classList.remove("sheet-dragging"); panel.style.transform = ""; }
    const body = document.getElementById("orbitalModalBody");
    if (body) { body.style.transition = ""; body.style.transform = ""; body.style.opacity = ""; }
  }
  // Step to the neighbouring module in the live signal chain, sliding its controls in from the swipe side.
  function stepModule(dir) {
    if (typeof ORBITAL_MODULES === "undefined" || typeof expandModuleOrb !== "function") return;
    const chain = (typeof getOrbitalConnectionChain === "function") ? getOrbitalConnectionChain() : ORBITAL_MODULES;
    const idx = chain.findIndex((o) => o.id === expandedOrbId);
    if (idx < 0) return;
    const next = chain[(idx + dir + chain.length) % chain.length];
    expandModuleOrb(next.id);
    const body = document.getElementById("orbitalModalBody");
    if (body && body.animate) {
      body.animate(
        [{ transform: "translateX(" + (dir > 0 ? 36 : -36) + "px)", opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: 220, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
      );
    }
  }
  function initSheetSwipe() {
    panel = document.getElementById("orbitalSidePanel");
    header = panel ? panel.querySelector(".orbital-modal-header") : null;
    if (!panel || !header) return;
    header.addEventListener("pointerdown", (e) => {
      if (!mq.matches || pid !== null || !panel.classList.contains("active")) return;
      if (e.pointerType === "mouse") return;
      if (e.target.closest && e.target.closest("button, a, input, select, label, .custom-dropdown-wrap, .pedal-slot-badge")) return;
      pid = e.pointerId; startX = e.clientX; startY = e.clientY; dx = 0; dy = 0; axis = null; t0 = performance.now();
      try { header.setPointerCapture(pid); } catch (err) {}
    });
    header.addEventListener("pointermove", (e) => {
      if (e.pointerId !== pid) return;
      dx = e.clientX - startX;
      dy = e.clientY - startY;
      if (!axis && Math.max(Math.abs(dx), Math.abs(dy)) > 8) {
        axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        if (axis === "y") panel.classList.add("sheet-dragging");
      }
      if (axis === "y") {
        panel.style.transform = dy > 0 ? "translateY(" + dy + "px)" : "";
      } else if (axis === "x") {
        // The controls follow the finger a little as feedback.
        const body = document.getElementById("orbitalModalBody");
        if (body) { body.style.transform = "translateX(" + Math.max(-60, Math.min(60, dx * 0.35)) + "px)"; body.style.opacity = String(1 - Math.min(0.5, Math.abs(dx) / 240)); }
      }
    });
    const end = (e) => {
      if (e.pointerId !== pid) return;
      try { header.releasePointerCapture(e.pointerId); } catch (err) {}
      const elapsed = Math.max(1, performance.now() - t0);
      const up = e.type === "pointerup";
      const downDy = Math.max(0, dy);
      const shouldClose = up && axis === "y" &&
        (downDy > Math.min(120, panel.offsetHeight * 0.25) || (downDy > 32 && downDy / elapsed > 0.5));
      const stepDir = up && axis === "x" && (Math.abs(dx) > 48 || (Math.abs(dx) > 24 && Math.abs(dx) / elapsed > 0.4))
        ? (dx < 0 ? 1 : -1) : 0;
      resetDrag(); // same frame as the class change below, so it animates from the finger
      if (shouldClose && typeof closeOrbitalModal === "function") closeOrbitalModal();
      else if (stepDir) stepModule(stepDir);
    };
    header.addEventListener("pointerup", end);
    header.addEventListener("pointercancel", end);
  }

  // 4. Dropdown menus opened inside the sheet live in its scrolling body, so
  //    anything past the body's edges is clipped. On open, scroll the control
  //    up toward the top of the body before placeMenu() measures and sizes it.
  document.addEventListener("click", (e) => {
    if (!mq.matches || !e.target || !e.target.closest) return;
    const trigger = e.target.closest("#orbitalModalBody .custom-dropdown-trigger");
    const body = document.getElementById("orbitalModalBody");
    const menu = trigger && trigger.parentElement ? trigger.parentElement.querySelector(".custom-dropdown-menu") : null;
    if (!trigger || !body || !menu || menu.classList.contains("open")) return;
    const row = trigger.closest(".control-row") || trigger;
    const lift = row.getBoundingClientRect().top - body.getBoundingClientRect().top - 12;
    if (lift > 0) body.scrollTop += lift;
  }, true);

  function onMq() {
    if (!mq.matches) {
      resetDrag();
    }
  }

  try { initSheetSwipe(); } catch (e) {}
  onMqChange(onMq);
  onMq();
  if (mq.matches) stretchInitialLayout();
  // Crossing the breakpoint (rotation, resizing) changes the arena's shape a
  // lot; lay the orbs out again for it, like a fresh load.
  onMqChange(() => {
    if (typeof ORBITAL_MODULES === "undefined" || !ORBITAL_MODULES[0]) return;
    ORBITAL_MODULES[0].initialized = false;
    if (mq.matches) stretchInitialLayout();
  });
})();

/* Console region (phone only): keep custom dropdown menus and the palette
   popover inside the screen. Desktop: every handler returns early, and any
   inline style this sets is cleared when the phone query stops matching. */
(function () {
  const mq = window.matchMedia("(max-width: 640px), (orientation: landscape) and (max-height: 550px)");
  const EDGE = 10;   // min distance from the viewport edges
  const GAP = 2;     // trigger <-> menu gap (matches the desktop CSS)
  const PROPS = ["left", "top", "bottom", "maxHeight", "maxWidth"];

  function clearMenu(menu) {
    PROPS.forEach(p => { menu.style[p] = ""; });
  }

  // Park the menu at the left screen edge, at most viewport-wide, so that
  // opening it can never overflow the page sideways (on iOS / mobile
  // Chrome a transient overflow zooms the layout viewport out).
  function parkMenu(menu, wrapLeft, vw) {
    clearMenu(menu);
    menu.style.maxWidth = (vw - 2 * EDGE) + "px";
    menu.style.left = Math.round(EDGE - wrapLeft) + "px";
  }

  // Visible box for the menu: the viewport, narrowed by any ancestor that
  // clips its overflow (e.g. the orbital arena around the side panel).
  function visibleBox(el, vw, vh) {
    const box = { top: EDGE, bottom: vh - EDGE, left: EDGE, right: vw - EDGE };
    let inFixed = false;
    for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.position === "fixed") inFixed = true;
      if (cs.overflowX === "visible" && cs.overflowY === "visible") { if (inFixed) break; continue; }
      const r = n.getBoundingClientRect();
      if (cs.overflowY !== "visible") {
        box.top = Math.max(box.top, r.top + 4);
        box.bottom = Math.min(box.bottom, r.bottom - 4);
      }
      if (cs.overflowX !== "visible") {
        box.left = Math.max(box.left, r.left + 4);
        box.right = Math.min(box.right, r.right - 4);
      }
      if (inFixed) break; // a fixed box isn't clipped by anything above it
    }
    // Stay clear of the floating mini transport bar when it is showing
    // (the bottom sheet covers it, so menus in the sheet ignore it).
    const bar = document.getElementById("miniTransport");
    if (bar && !bar.hidden && !inFixed) {
      const r = bar.getBoundingClientRect();
      if (r.height && r.top < vh && r.top > box.top) box.bottom = Math.min(box.bottom, r.top - 6);
    }
    return box;
  }

  // Pick the side with room, cap the height to it, clamp horizontally.
  function placeMenu(menu) {
    if (!menu || !mq.matches || !menu.classList.contains("open")) return;
    const wrap = menu.parentElement;
    if (!wrap) return;
    const trigger = wrap.querySelector(".custom-dropdown-trigger") || wrap;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const w = wrap.getBoundingClientRect();
    const box = visibleBox(wrap, vw, vh);

    parkMenu(menu, w.left, vw);
    menu.style.maxWidth = Math.max(160, box.right - box.left) + "px";
    menu.style.maxHeight = "none";
    menu.style.top = "calc(100% + " + GAP + "px)";
    menu.style.bottom = "auto";

    // Horizontal: align with the trigger, slide left if it would overflow.
    const width = menu.offsetWidth;
    const x = Math.max(Math.min(box.left, w.left), Math.min(w.left, box.right - width));
    menu.style.left = Math.round(x - w.left) + "px";

    // Vertical: open towards the side with room, scroll inside if needed.
    const a = trigger.getBoundingClientRect();
    const natural = menu.offsetHeight;
    const below = Math.floor(box.bottom - a.bottom - GAP);
    const above = Math.floor(a.top - box.top - GAP);
    const cap = Math.max(240, Math.round(vh * 0.62));
    const goUp = natural > below && above > below;
    const room = Math.max(80, goUp ? above : below);
    if (goUp) {
      menu.style.top = "auto";
      menu.style.bottom = "calc(100% + " + GAP + "px)";
    }
    menu.style.maxHeight = Math.min(natural, room, cap) + "px";

    // Long lists open scrolled to the current choice.
    const cur = menu.querySelector(".custom-dropdown-item.selected");
    if (cur && menu.scrollHeight > menu.clientHeight) {
      menu.scrollTop = cur.offsetTop - (menu.clientHeight - cur.offsetHeight) / 2;
    }
  }

  function placeOpenMenus() {
    document.querySelectorAll(".custom-dropdown-menu.open").forEach(placeMenu);
  }

  // The palette card sits under the header utils row; bring it on screen.
  function revealPalette() {
    const menu = document.getElementById("paletteMenu");
    if (!menu || !mq.matches || !menu.classList.contains("open")) return;
    const r = menu.getBoundingClientRect();
    const vh = window.innerHeight;
    let dy = 0;
    if (r.bottom > vh - EDGE) dy = r.bottom - (vh - EDGE);
    if (r.top - dy < EDGE) dy = r.top - EDGE;
    if (Math.abs(dy) > 1) window.scrollBy({ top: dy, behavior: "smooth" });
  }

  // Capture phase: runs before the trigger's own handler (which stops
  // propagation); the rAF runs after it, before the next paint.
  document.addEventListener("click", (e) => {
    if (!mq.matches || !e.target || !e.target.closest) return;
    const trigger = e.target.closest(".custom-dropdown-trigger");
    if (trigger) {
      const wrap = trigger.parentElement;
      const menu = wrap && wrap.querySelector(".custom-dropdown-menu");
      if (!menu) return;
      if (!menu.classList.contains("open")) {
        parkMenu(menu, wrap.getBoundingClientRect().left, document.documentElement.clientWidth);
      }
      requestAnimationFrame(() => placeMenu(menu));
      return;
    }
    if (e.target.closest("#btnPalette")) requestAnimationFrame(revealPalette);
  }, true);

  window.addEventListener("resize", () => { if (mq.matches) placeOpenMenus(); });

  const onChange = () => {
    if (mq.matches) { placeOpenMenus(); return; }
    document.querySelectorAll(".custom-dropdown-menu").forEach(clearMenu);
  };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
})();

/* Touch: a scroll that starts on a slider must not change it. Blink and
   WebKit jump a range thumb to the finger on touchstart and keep that value
   even when the gesture turns into a page or sheet scroll (pointercancel).
   On phones the full-width slider rows sit right in the scroll path, so put
   the old value back when the browser takes the gesture for scrolling. */
(function () {
  const mq = window.matchMedia('(max-width: 640px), (orientation: landscape) and (max-height: 550px)');
  let pending = null;
  document.addEventListener('pointerdown', (e) => {
    const el = e.target;
    pending = (mq.matches && e.pointerType === 'touch' && el && el.tagName === 'INPUT' && el.type === 'range')
      ? { el, value: el.value, id: e.pointerId } : null;
  }, true);
  document.addEventListener('pointercancel', (e) => {
    if (!pending || e.pointerId !== pending.id) return;
    const { el, value } = pending;
    pending = null;
    if (el.value !== value) { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }
  }, true);
  document.addEventListener('pointerup', (e) => { if (pending && e.pointerId === pending.id) pending = null; }, true);
})();

/* Touch: close open dropdown menus when tapping anywhere else. The menus'
   own outside-close listens for "click", which iOS Safari never fires for a
   tap on plain, non-interactive page areas. */
(function () {
  document.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || !e.target || !e.target.closest) return;
    if (e.target.closest('.custom-dropdown-wrap')) return;
    document.querySelectorAll('.custom-dropdown-menu.open').forEach((m) => m.classList.remove('open', 'drop-up'));
    document.querySelectorAll('.custom-dropdown-trigger.open').forEach((t) => t.classList.remove('open'));
    document.querySelectorAll('.custom-dropdown-wrap.is-open').forEach((w) => w.classList.remove('is-open'));
  }, true);
})();

/* Crossing the 640px breakpoint (rotation, resizing) changes dozens of button
   sizes, and their desktop "transition: all" animates that, so anything that
   measures the layout on resize (syncEnoPodSquare) sees a half-way state and
   the Eno pod locks to the wrong size. Finish those transitions at once, then
   measure again. */
(function () {
  const mq = window.matchMedia('(max-width: 640px), (orientation: landscape) and (max-height: 550px)');
  const onChange = () => {
    try {
      document.getAnimations().forEach((a) => {
        if (typeof CSSTransition !== 'undefined' && a instanceof CSSTransition) a.finish();
      });
    } catch (e) {}
    if (typeof syncEnoPodSquare === 'function') syncEnoPodSquare();
  };
  try { mq.addEventListener('change', onChange); } catch (e) { try { mq.addListener(onChange); } catch (e2) {} }
})();
