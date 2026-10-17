/* ==========================================================================
   WORKSPACE & EDIT MODE ENGINE (Phase 8 Part A)
   - Studio Focus / Fullscreen Mode for modules and upper-deck visualizers
   - Workspace Edit Mode outlines and drag handles
   - Collapsible Workspace Module Dock & Hidden Module Restore Chips
   - Preserves 100% default visual parity when Edit Mode is OFF
   ========================================================================== */

(function initWorkspaceEngine() {
  const STORAGE_KEY_EDIT_MODE = "slambient_workspace_edit_mode";
  const STORAGE_KEY_HIDDEN_MODULES = "slambient_workspace_hidden_modules";

  // Module registry for dock titles, chip labels, and container selectors
  const MODULE_REGISTRY = [
    { id: "mod-scope", selector: "#scopePanel", label: "VISUALIZER", chip: "+ VIZ" },
    { id: "mod-chord", selector: "#chordInfoPanel", label: "CHORD WHEEL", chip: "+ CHORD" },
    { id: "mod-keys", selector: "#keyboardPanel", label: "KEYBOARD", chip: "+ KEYS" },
    { id: "mod-drone", selector: ".strip-channel.drone-ch", label: "SUB", chip: "+ SUB" },
    { id: "mod-drum", selector: ".strip-channel.drum-ch", label: "DRUMS", chip: "+ DRUMS" },
    { id: "mod-chords", selector: ".strip-channel.chord-ch", label: "CHORDS", chip: "+ CHORDS" },
    { id: "mod-arp", selector: ".strip-channel.arp-ch", label: "ARP", chip: "+ ARP" },
    { id: "mod-noise", selector: ".strip-channel.noise-ch", label: "NOISE", chip: "+ NOISE" },
    { id: "mod-field", selector: "#fieldModule", label: "FIELD", chip: "+ FIELD" },
    { id: "mod-pedals", selector: "#pedalChainModule", label: "DSP FX", chip: "+ DSP FX" }
  ];

  let hiddenModuleIds = new Set();
  let currentFullscreenEl = null;

  // Load persisted hidden modules
  try {
    const savedHidden = localStorage.getItem(STORAGE_KEY_HIDDEN_MODULES);
    if (savedHidden) {
      const arr = JSON.parse(savedHidden);
      if (Array.isArray(arr)) hiddenModuleIds = new Set(arr);
    }
  } catch (e) {
    console.warn("[Workspace] Failed to parse hidden modules:", e);
  }

  // --- 1. Window Chrome Injection ---
  function injectModuleChrome() {
    MODULE_REGISTRY.forEach(mod => {
      const el = document.querySelector(mod.selector);
      if (!el || el.dataset.workspaceInjected) return;
      el.dataset.workspaceInjected = "true";
      el.dataset.moduleId = mod.id;

      // Find or create header action slot
      let targetHeader = el.querySelector(".panel-header");
      if (!targetHeader && el.classList.contains("keyboard-panel")) {
        targetHeader = el.querySelector(".keyboard-panel-header") || el.querySelector(".keyboard-meta");
      }
      if (!targetHeader) return;

      let actionsContainer = targetHeader.querySelector(".panel-header-actions");
      if (!actionsContainer) {
        actionsContainer = document.createElement("div");
        actionsContainer.className = "panel-header-actions";
        targetHeader.appendChild(actionsContainer);
      }

      // Create window controls cluster
      const controlsWrap = document.createElement("div");
      controlsWrap.className = "module-window-controls";
      controlsWrap.setAttribute("role", "group");
      controlsWrap.setAttribute("aria-label", `${mod.label} Window Controls`);

      controlsWrap.innerHTML = `
        <span class="module-win-drag upper-drag-handle" title="Drag to reorder in Edit Mode" aria-label="Drag Handle">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/></svg>
        </span>
        <button type="button" class="btn-win-action btn-win-hide" title="Hide module into Workspace Dock" aria-label="Hide ${mod.label}">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button type="button" class="btn-win-action btn-win-focus" title="Expand to Fullscreen Focus (Esc to Exit)" aria-label="Focus ${mod.label}">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none">
            <path d="M1.5 5.5V1.5H5.5M10.5 1.5H14.5V5.5M14.5 10.5V14.5H10.5M5.5 14.5H1.5V10.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button type="button" class="btn-exit-focus" title="Exit Fullscreen Focus (Esc)" aria-label="Exit Focus">
          <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
            <path d="M5.5 1.5V5.5H1.5M14.5 5.5H10.5V1.5M10.5 14.5V10.5H14.5M1.5 10.5H5.5V14.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>✕ Exit Focus</span>
        </button>
      `;

      // Wire events
      const btnHide = controlsWrap.querySelector(".btn-win-hide");
      const btnFocus = controlsWrap.querySelector(".btn-win-focus");
      const btnExit = controlsWrap.querySelector(".btn-exit-focus");

      btnHide.addEventListener("click", (e) => {
        e.stopPropagation();
        hideModule(mod.id);
      });

      btnFocus.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleModuleFullscreen(mod.id);
      });

      btnExit.addEventListener("click", (e) => {
        e.stopPropagation();
        exitModuleFullscreen();
      });

      // Insert at the front of actionsContainer so it stays cohesive
      actionsContainer.insertBefore(controlsWrap, actionsContainer.firstChild);
    });
  }

  // --- 2. Workspace Dock Construction ---
  let dockBar = null;
  function ensureDockBar() {
    if (dockBar) return dockBar;
    dockBar = document.getElementById("workspaceModuleDock");
    if (!dockBar) {
      dockBar = document.createElement("div");
      dockBar.id = "workspaceModuleDock";
      dockBar.className = "workspace-module-dock";
      dockBar.setAttribute("role", "toolbar");
      dockBar.setAttribute("aria-label", "Workspace Module Dock");

      // Place it right above the upper-deck or main console area
      const upperDeck = document.querySelector(".upper-deck");
      if (upperDeck && upperDeck.parentElement) {
        upperDeck.parentElement.insertBefore(dockBar, upperDeck);
      } else {
        document.body.prepend(dockBar);
      }
    }
    return dockBar;
  }

  function updateDockUI() {
    const dock = ensureDockBar();
    if (!dock) return;

    if (hiddenModuleIds.size === 0) {
      dock.innerHTML = "";
      dock.classList.remove("has-hidden");
      dock.hidden = true;
      return;
    }

    dock.hidden = false;
    dock.classList.add("has-hidden");

    let chipsHtml = `
      <div class="workspace-dock-inner">
        <span class="workspace-dock-label">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <span>DOCK (${hiddenModuleIds.size}):</span>
        </span>
        <div class="workspace-dock-chips">
    `;

    MODULE_REGISTRY.forEach(mod => {
      if (hiddenModuleIds.has(mod.id)) {
        chipsHtml += `
          <button type="button" class="btn-dock-restore-chip" data-restore-id="${mod.id}" title="Restore ${mod.label} to Workspace">
            <span class="chip-plus">+</span>
            <span class="chip-title">${mod.label}</span>
          </button>
        `;
      }
    });

    chipsHtml += `
        </div>
        <button type="button" class="btn-dock-restore-all" title="Restore all hidden modules to rack">RESTORE ALL</button>
      </div>
    `;

    dock.innerHTML = chipsHtml;

    // Attach listeners
    dock.querySelectorAll(".btn-dock-restore-chip").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-restore-id");
        if (id) restoreModule(id);
      });
    });

    const btnRestoreAll = dock.querySelector(".btn-dock-restore-all");
    if (btnRestoreAll) {
      btnRestoreAll.addEventListener("click", () => restoreAllModules());
    }
  }

  // --- 3. Module Visibility (Hide / Restore) ---
  function hideModule(modId) {
    const mod = MODULE_REGISTRY.find(m => m.id === modId);
    if (!mod) return;
    const el = document.querySelector(mod.selector);
    if (el) {
      if (el.classList.contains("module-fullscreen-active")) {
        exitModuleFullscreen();
      }
      el.classList.add("module-hidden-in-dock");
    }
    hiddenModuleIds.add(modId);
    try {
      localStorage.setItem(STORAGE_KEY_HIDDEN_MODULES, JSON.stringify(Array.from(hiddenModuleIds)));
    } catch (e) {}
    updateDockUI();
    if (typeof refreshVisualizerCanvases === "function") refreshVisualizerCanvases();
  }

  function restoreModule(modId) {
    const mod = MODULE_REGISTRY.find(m => m.id === modId);
    if (!mod) return;
    const el = document.querySelector(mod.selector);
    if (el) {
      el.classList.remove("module-hidden-in-dock");
    }
    hiddenModuleIds.delete(modId);
    try {
      localStorage.setItem(STORAGE_KEY_HIDDEN_MODULES, JSON.stringify(Array.from(hiddenModuleIds)));
    } catch (e) {}
    updateDockUI();
    if (typeof refreshVisualizerCanvases === "function") refreshVisualizerCanvases();
  }

  function restoreAllModules() {
    MODULE_REGISTRY.forEach(mod => {
      const el = document.querySelector(mod.selector);
      if (el) el.classList.remove("module-hidden-in-dock");
    });
    hiddenModuleIds.clear();
    try {
      localStorage.removeItem(STORAGE_KEY_HIDDEN_MODULES);
    } catch (e) {}
    updateDockUI();
    if (typeof refreshVisualizerCanvases === "function") refreshVisualizerCanvases();
  }

  function applyInitialHiddenStates() {
    hiddenModuleIds.forEach(modId => {
      const mod = MODULE_REGISTRY.find(m => m.id === modId);
      if (mod) {
        const el = document.querySelector(mod.selector);
        if (el) el.classList.add("module-hidden-in-dock");
      }
    });
    updateDockUI();
  }

  // --- 4. Fullscreen Focus Modal ---
  function toggleModuleFullscreen(modId) {
    const mod = MODULE_REGISTRY.find(m => m.id === modId);
    if (!mod) return;
    const el = document.querySelector(mod.selector);
    if (!el) return;

    if (el.classList.contains("module-fullscreen-active")) {
      exitModuleFullscreen();
    } else {
      enterModuleFullscreen(el);
    }
  }

  function enterModuleFullscreen(el) {
    if (currentFullscreenEl && currentFullscreenEl !== el) {
      currentFullscreenEl.classList.remove("module-fullscreen-active");
    }
    currentFullscreenEl = el;
    el.classList.add("module-fullscreen-active");
    document.body.classList.add("module-focus-open");

    // Re-render visualizer canvases if needed
    requestAnimationFrame(() => {
      if (typeof refreshVisualizerCanvases === "function") refreshVisualizerCanvases();
      if (typeof orbitalNeedsResize !== "undefined") orbitalNeedsResize = true;
      if (typeof buildKeyboard === "function" && el.classList.contains("keyboard-panel")) buildKeyboard();
    });
  }

  function exitModuleFullscreen() {
    if (currentFullscreenEl) {
      currentFullscreenEl.classList.remove("module-fullscreen-active");
      currentFullscreenEl = null;
    }
    document.querySelectorAll(".module-fullscreen-active").forEach(el => {
      el.classList.remove("module-fullscreen-active");
    });
    document.body.classList.remove("module-focus-open");

    requestAnimationFrame(() => {
      if (typeof refreshVisualizerCanvases === "function") refreshVisualizerCanvases();
      if (typeof orbitalNeedsResize !== "undefined") orbitalNeedsResize = true;
      if (typeof buildKeyboard === "function") buildKeyboard();
    });
  }

  // --- 5. Studio Edit Mode Toggle ---
  function toggleWorkspaceEditMode(force) {
    const isActive = typeof force === "boolean"
      ? force
      : !document.body.classList.contains("workspace-edit-mode");

    document.body.classList.toggle("workspace-edit-mode", isActive);

    const btnEdit = document.getElementById("btnEditWorkspace");
    if (btnEdit) {
      btnEdit.classList.toggle("active", isActive);
      btnEdit.title = isActive
        ? "Studio Edit Mode ON: Drag handles & alignment outlines unlocked"
        : "Studio Edit Mode: Unlock rack reorganization & custom layout";
    }

    try {
      localStorage.setItem(STORAGE_KEY_EDIT_MODE, isActive ? "true" : "false");
    } catch (e) {}

    if (typeof setRecordStatus === "function") {
      setRecordStatus(isActive ? "Studio Edit Mode: ON (Layout Unlocked)" : "Studio Edit Mode: OFF (Layout Locked)");
    }
  }

  // Helper to re-render all visualizers upon container resize
  function refreshVisualizerCanvases() {
    try {
      if (typeof drawScope === "function") drawScope();
      if (typeof drawChordWheel === "function") drawChordWheel();
      const scopeCanv = document.getElementById("scopeCanvas");
      if (scopeCanv && typeof initScopeCanvas === "function") initScopeCanvas();
    } catch (e) {}
  }

  // --- 6. Global Event Bindings ---
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (document.body.classList.contains("module-focus-open")) {
        e.preventDefault();
        exitModuleFullscreen();
      }
    }
  });

  // Export to window for global access
  window.toggleModuleFullscreen = toggleModuleFullscreen;
  window.exitModuleFullscreen = exitModuleFullscreen;
  window.hideModule = hideModule;
  window.restoreModule = restoreModule;
  window.restoreAllModules = restoreAllModules;
  window.toggleWorkspaceEditMode = toggleWorkspaceEditMode;

  // Initialize on DOM ready
  function init() {
    injectModuleChrome();
    applyInitialHiddenStates();

    // Check if Edit Mode was enabled
    try {
      const savedEditMode = localStorage.getItem(STORAGE_KEY_EDIT_MODE);
      if (savedEditMode === "true") {
        toggleWorkspaceEditMode(true);
      }
    } catch (e) {}
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
