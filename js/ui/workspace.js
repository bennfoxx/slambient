/* ==========================================================================
   WORKSPACE & CUSTOM LAYOUT ENGINE (Phase 8 Part B)
   - WorkspaceManager managing state persisted under localStorage["slambient_workspace_v1"]
   - Header Slot Reordering ([data-header-slot])
   - Upper Deck Widget Reordering ([data-upper-widget] / .upper-deck-card)
   - Rack Module Reordering ([data-module-id] / .strip-channel)
   - Show/Hide Module Dock with Restore Chips & One-Click Fullscreen Focus
   - Curated Workspace Templates:
     * Full Studio (Default — all modules visible)
     * Minimal Drone (Sub, Noise, Space Reverb, and Circle of Fifths only)
     * Live Keys (Keyboard, Chords, Arp, and Scope prioritized)
     * Reset Layout (Factory default restore)
   ========================================================================== */

(function initWorkspaceEngine() {
  const STORAGE_KEY_V1 = "slambient_workspace_v1";

  // Default Factory Blueprint
  const DEFAULT_STATE = {
    editMode: false,
    activeTemplate: "FULL_STUDIO",
    headerOrder: ["brand", "presets", "transport", "harmony", "readout", "utilities", "generative"],
    upperDeckOrder: ["chordWheel", "scope", "keyboard"],
    rackOrder: ["drone", "chords", "noise", "drums", "arp", "field", "fxChain"],
    hiddenModules: [],
    fullscreenModule: null
  };

  // Canonical mapping for upper deck widget IDs
  const UPPER_KEY_TO_SELECTOR = {
    scope: "#scopePanel",
    chordWheel: "#chordInfoPanel",
    chord: "#chordInfoPanel",
    keyboard: "#keyboardPanel",
    keys: "#keyboardPanel"
  };

  // Canonical mapping for rack module IDs
  const RACK_KEY_TO_SELECTOR = {
    drone: ".strip-channel.drone-ch",
    drums: ".strip-channel.drum-ch",
    chords: ".strip-channel.chord-ch",
    arp: ".strip-channel.arp-ch",
    noise: ".strip-channel.noise-ch",
    field: "#fieldModule",
    fxChain: "#pedalChainModule"
  };

  // Complete registry for dock chips and window chrome labels
  const MODULE_REGISTRY = [
    { id: "scope", selector: "#scopePanel", label: "VISUALIZER", type: "upper" },
    { id: "chordWheel", selector: "#chordInfoPanel", label: "CHORD WHEEL", type: "upper" },
    { id: "keyboard", selector: "#keyboardPanel", label: "KEYBOARD", type: "upper" },
    { id: "drone", selector: ".strip-channel.drone-ch", label: "SUB", type: "rack" },
    { id: "drums", selector: ".strip-channel.drum-ch", label: "DRUMS", type: "rack" },
    { id: "chords", selector: ".strip-channel.chord-ch", label: "CHORDS", type: "rack" },
    { id: "arp", selector: ".strip-channel.arp-ch", label: "ARP", type: "rack" },
    { id: "noise", selector: ".strip-channel.noise-ch", label: "NOISE", type: "rack" },
    { id: "field", selector: "#fieldModule", label: "FIELD", type: "rack" },
    { id: "fxChain", selector: "#pedalChainModule", label: "DSP FX", type: "rack" }
  ];

  // Curated templates configuration
  const TEMPLATES = {
    FULL_STUDIO: {
      name: "Full Studio",
      upperDeckOrder: ["chordWheel", "scope", "keyboard"],
      rackOrder: ["drone", "chords", "noise", "drums", "arp", "field", "fxChain"],
      hiddenModules: []
    },
    MINIMAL_DRONE: {
      name: "Minimal Drone",
      upperDeckOrder: ["chordWheel", "scope"],
      rackOrder: ["drone", "noise", "fxChain"],
      hiddenModules: ["keyboard", "drums", "chords", "arp", "field"]
    },
    LIVE_KEYS: {
      name: "Live Keys",
      upperDeckOrder: ["keyboard", "scope", "chordWheel"],
      rackOrder: ["chords", "arp", "drone", "drums", "noise", "field", "fxChain"],
      hiddenModules: []
    }
  };

  class WorkspaceManager {
    constructor() {
      this.state = this.loadState();
      this.draggedElement = null;
      this.draggedType = null; // 'header', 'upper', 'rack'
    }

    loadState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_V1);
        if (raw) {
          const parsed = JSON.parse(raw);
          return {
            editMode: !!parsed.editMode,
            activeTemplate: parsed.activeTemplate || "FULL_STUDIO",
            headerOrder: Array.isArray(parsed.headerOrder) && parsed.headerOrder.length ? parsed.headerOrder : [...DEFAULT_STATE.headerOrder],
            upperDeckOrder: Array.isArray(parsed.upperDeckOrder) && parsed.upperDeckOrder.length ? parsed.upperDeckOrder : [...DEFAULT_STATE.upperDeckOrder],
            rackOrder: Array.isArray(parsed.rackOrder) && parsed.rackOrder.length ? parsed.rackOrder : [...DEFAULT_STATE.rackOrder],
            hiddenModules: Array.isArray(parsed.hiddenModules) ? parsed.hiddenModules : [],
            fullscreenModule: null // Always start without fullscreen latch
          };
        }
      } catch (e) {
        console.warn("[Workspace] Failed to read localStorage:", e);
      }
      return JSON.parse(JSON.stringify(DEFAULT_STATE));
    }

    saveState() {
      try {
        const snapshot = {
          editMode: this.state.editMode,
          activeTemplate: this.state.activeTemplate,
          headerOrder: this.state.headerOrder,
          upperDeckOrder: this.state.upperDeckOrder,
          rackOrder: this.state.rackOrder,
          hiddenModules: this.state.hiddenModules,
          fullscreenModule: this.state.fullscreenModule
        };
        localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(snapshot));
      } catch (e) {
        console.warn("[Workspace] Failed to write localStorage:", e);
      }
    }

    init() {
      this.stampDOMAttributes();
      this.injectModuleChrome();
      this.ensureWorkspaceDock();
      this.applyLayoutOrder();
      this.applyVisibility();
      this.bindEditButton();
      this.bindDragAndDrop();
      this.bindGlobalKeys();

      if (this.state.editMode) {
        document.body.classList.add("workspace-edit-mode");
      }
      this.updateDockUI();
    }

    // 1. Stamp necessary data attributes onto DOM elements
    stampDOMAttributes() {
      // Header slots
      const headerBindings = [
        { slot: "brand", selector: ".brand-group" },
        { slot: "presets", selector: ".preset-group" },
        { slot: "transport", selector: ".header-sec-transport" },
        { slot: "harmony", selector: ".header-sec-harmony" },
        { slot: "readout", selector: ".sys-readout" },
        { slot: "utilities", selector: ".header-sec-utils" },
        { slot: "generative", selector: ".header-sec-gen" }
      ];

      headerBindings.forEach(({ slot, selector }) => {
        const el = document.querySelector(selector);
        if (el) {
          el.setAttribute("data-header-slot", slot);
        }
      });

      // Upper deck cards
      const upperCards = [
        { id: "scope", selector: "#scopePanel" },
        { id: "chordWheel", selector: "#chordInfoPanel" },
        { id: "keyboard", selector: "#keyboardPanel" }
      ];
      upperCards.forEach(({ id, selector }) => {
        const el = document.querySelector(selector);
        if (el) {
          el.setAttribute("data-module-id", id);
          el.setAttribute("data-upper-widget", id === "chordWheel" ? "chord" : (id === "keyboard" ? "keys" : "scope"));
        }
      });

      // Rack modules
      const rackModules = [
        { id: "drone", selector: ".strip-channel.drone-ch" },
        { id: "drums", selector: ".strip-channel.drum-ch" },
        { id: "chords", selector: ".strip-channel.chord-ch" },
        { id: "arp", selector: ".strip-channel.arp-ch" },
        { id: "noise", selector: ".strip-channel.noise-ch" },
        { id: "field", selector: "#fieldModule" },
        { id: "fxChain", selector: "#pedalChainModule" }
      ];
      rackModules.forEach(({ id, selector }) => {
        const el = document.querySelector(selector);
        if (el) {
          el.setAttribute("data-module-id", id);
        }
      });
    }

    // 2. Inject window control chrome ([ 👁 Hide ], [ ☰ Drag ], [ ⛶ Focus ])
    injectModuleChrome() {
      MODULE_REGISTRY.forEach(mod => {
        const el = document.querySelector(mod.selector);
        if (!el || el.dataset.workspaceInjected) return;
        el.dataset.workspaceInjected = "true";
        el.dataset.moduleId = mod.id;

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

        // Avoid duplicate controls wrap
        if (actionsContainer.querySelector(".module-window-controls")) return;

        const controlsWrap = document.createElement("div");
        controlsWrap.className = "module-window-controls";
        controlsWrap.setAttribute("role", "group");
        controlsWrap.setAttribute("aria-label", `${mod.label} Window Controls`);

        controlsWrap.innerHTML = `
          <span class="module-win-drag upper-drag-handle" title="Drag to reorder module" aria-label="Drag Handle">
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

        const btnHide = controlsWrap.querySelector(".btn-win-hide");
        const btnFocus = controlsWrap.querySelector(".btn-win-focus");
        const btnExit = controlsWrap.querySelector(".btn-exit-focus");

        btnHide.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleModuleVisibility(mod.id);
        });

        btnFocus.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleModuleFullscreen(mod.id);
        });

        btnExit.addEventListener("click", (e) => {
          e.stopPropagation();
          this.toggleModuleFullscreen(mod.id);
        });

        actionsContainer.insertBefore(controlsWrap, actionsContainer.firstChild);
      });
    }

    // 3. Ensure the Workspace Dock exists in the DOM
    ensureWorkspaceDock() {
      let dock = document.getElementById("workspaceModuleDock");
      if (!dock) {
        dock = document.createElement("div");
        dock.id = "workspaceModuleDock";
        dock.className = "workspace-module-dock";
        dock.setAttribute("role", "toolbar");
        dock.setAttribute("aria-label", "Workspace Module Dock");

        const upperDeck = document.querySelector(".upper-deck");
        if (upperDeck && upperDeck.parentElement) {
          upperDeck.parentElement.insertBefore(dock, upperDeck);
        } else {
          document.body.prepend(dock);
        }
      }
      return dock;
    }

    // 4. Update the Workspace Dock UI (Templates + Restore Chips)
    updateDockUI() {
      const dock = this.ensureWorkspaceDock();
      if (!dock) return;

      const hiddenList = this.state.hiddenModules || [];
      const isEdit = this.state.editMode;

      // Always show dock when in edit mode or when there are hidden modules
      const shouldShow = isEdit || hiddenList.length > 0;
      dock.hidden = !shouldShow;
      dock.classList.toggle("has-hidden", shouldShow);

      if (!shouldShow) {
        dock.innerHTML = "";
        return;
      }

      let html = `<div class="workspace-dock-inner">`;

      // Preset Template Pills
      html += `
        <div class="workspace-template-pills" style="display:inline-flex;align-items:center;gap:4px;margin-right:8px;">
          <span style="font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:800;color:var(--text-tertiary);letter-spacing:0.5px;">LAYOUT:</span>
          <button type="button" class="btn-dock-restore-chip ${this.state.activeTemplate === 'FULL_STUDIO' ? 'active' : ''}" data-template-key="FULL_STUDIO" style="${this.state.activeTemplate === 'FULL_STUDIO' ? 'border-color:var(--color-chord);color:#fff;background:rgba(254,211,48,0.15);' : ''}">Full Studio</button>
          <button type="button" class="btn-dock-restore-chip ${this.state.activeTemplate === 'MINIMAL_DRONE' ? 'active' : ''}" data-template-key="MINIMAL_DRONE" style="${this.state.activeTemplate === 'MINIMAL_DRONE' ? 'border-color:var(--color-drone);color:#fff;background:rgba(0,229,255,0.15);' : ''}">Minimal Drone</button>
          <button type="button" class="btn-dock-restore-chip ${this.state.activeTemplate === 'LIVE_KEYS' ? 'active' : ''}" data-template-key="LIVE_KEYS" style="${this.state.activeTemplate === 'LIVE_KEYS' ? 'border-color:var(--color-arp);color:#fff;background:rgba(125,95,255,0.15);' : ''}">Live Keys</button>
          <button type="button" class="btn-dock-restore-chip" data-template-key="RESET" style="color:var(--text-tertiary);border-style:dashed;">Reset</button>
        </div>
      `;

      // Restore chips section for hidden modules
      if (hiddenList.length > 0) {
        html += `
          <div class="workspace-dock-chips" style="display:inline-flex;align-items:center;gap:4px;flex-wrap:wrap;">
            <span class="workspace-dock-label" style="font-size:10px;margin-right:2px;">HIDDEN (${hiddenList.length}):</span>
        `;
        hiddenList.forEach(modId => {
          const mod = MODULE_REGISTRY.find(m => m.id === modId);
          const label = mod ? mod.label : modId.toUpperCase();
          html += `
            <button type="button" class="btn-dock-restore-chip" data-restore-id="${modId}" title="Restore ${label} module">
              <span class="chip-plus">+</span>
              <span class="chip-title">${label}</span>
            </button>
          `;
        });
        html += `
            <button type="button" class="btn-dock-restore-all" data-action="restore-all" title="Restore all hidden modules">RESTORE ALL</button>
          </div>
        `;
      }

      html += `</div>`;
      dock.innerHTML = html;

      // Bind Template Clicks
      dock.querySelectorAll("[data-template-key]").forEach(btn => {
        btn.addEventListener("click", () => {
          const key = btn.getAttribute("data-template-key");
          if (key === "RESET") {
            this.resetLayout();
          } else if (TEMPLATES[key]) {
            this.applyTemplate(key);
          }
        });
      });

      // Bind Restore Chips
      dock.querySelectorAll("[data-restore-id]").forEach(btn => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-restore-id");
          if (id) this.toggleModuleVisibility(id);
        });
      });

      const btnRestoreAll = dock.querySelector('[data-action="restore-all"]');
      if (btnRestoreAll) {
        btnRestoreAll.addEventListener("click", () => {
          this.restoreAllModules();
        });
      }
    }

    // 5. Apply layout DOM orders
    applyLayoutOrder() {
      // Upper deck cards
      const upperDeck = document.querySelector(".upper-deck");
      if (upperDeck && Array.isArray(this.state.upperDeckOrder)) {
        this.state.upperDeckOrder.forEach(key => {
          const sel = UPPER_KEY_TO_SELECTOR[key];
          const el = sel ? upperDeck.querySelector(sel) : null;
          if (el) upperDeck.appendChild(el);
        });
      }

      // Rack modules
      const lowerDeck = document.querySelector(".lower-deck");
      if (lowerDeck && Array.isArray(this.state.rackOrder)) {
        this.state.rackOrder.forEach(key => {
          const sel = RACK_KEY_TO_SELECTOR[key];
          const el = sel ? lowerDeck.querySelector(sel) : null;
          if (el) lowerDeck.appendChild(el);
        });
      }

      // Header pods ordering within their row containers
      const headerRows = document.querySelectorAll(".top-bar-row");
      if (headerRows.length && Array.isArray(this.state.headerOrder)) {
        // Group slots into their respective rows and reorder
        headerRows.forEach(row => {
          const slotsInRow = Array.from(row.querySelectorAll("[data-header-slot]"));
          if (slotsInRow.length > 1) {
            slotsInRow.sort((a, b) => {
              const aKey = a.getAttribute("data-header-slot");
              const bKey = b.getAttribute("data-header-slot");
              return this.state.headerOrder.indexOf(aKey) - this.state.headerOrder.indexOf(bKey);
            });
            slotsInRow.forEach(slotEl => row.appendChild(slotEl));
          }
        });
      }
    }

    // 6. Apply hidden module states to DOM
    applyVisibility() {
      const hiddenSet = new Set(this.state.hiddenModules || []);
      MODULE_REGISTRY.forEach(mod => {
        const el = document.querySelector(mod.selector);
        if (el) {
          el.classList.toggle("module-hidden-in-dock", hiddenSet.has(mod.id));
        }
      });
      this.updateDockUI();
      this.triggerCanvasResizes();
    }

    // 7. Toggle Module Visibility
    toggleModuleVisibility(moduleId) {
      if (!moduleId) return;
      const idx = this.state.hiddenModules.indexOf(moduleId);
      if (idx === -1) {
        // Hide it
        this.state.hiddenModules.push(moduleId);
        if (this.state.fullscreenModule === moduleId) {
          this.toggleModuleFullscreen(moduleId);
        }
      } else {
        // Restore it
        this.state.hiddenModules.splice(idx, 1);
      }
      this.saveState();
      this.applyVisibility();
    }

    restoreAllModules() {
      this.state.hiddenModules = [];
      this.saveState();
      this.applyVisibility();
    }

    // 8. Fullscreen / Focus API
    toggleModuleFullscreen(moduleId) {
      const mod = MODULE_REGISTRY.find(m => m.id === moduleId);
      const el = mod ? document.querySelector(mod.selector) : document.querySelector(`[data-module-id="${moduleId}"]`);
      if (!el) return;

      const isCurrent = el.classList.contains("module-fullscreen-active");

      document.querySelectorAll(".module-fullscreen-active").forEach(item => {
        item.classList.remove("module-fullscreen-active");
      });

      if (isCurrent) {
        this.state.fullscreenModule = null;
        document.body.classList.remove("module-focus-open");
      } else {
        this.state.fullscreenModule = moduleId;
        el.classList.add("module-fullscreen-active");
        document.body.classList.add("module-focus-open");
      }

      this.saveState();
      this.triggerCanvasResizes();
    }

    exitFullscreen() {
      if (!document.body.classList.contains("module-focus-open")) return;
      document.querySelectorAll(".module-fullscreen-active").forEach(item => {
        item.classList.remove("module-fullscreen-active");
      });
      document.body.classList.remove("module-focus-open");
      this.state.fullscreenModule = null;
      this.saveState();
      this.triggerCanvasResizes();
    }

    // 9. Template Management
    applyTemplate(templateKey) {
      const tpl = TEMPLATES[templateKey];
      if (!tpl) return;

      this.state.activeTemplate = templateKey;
      this.state.upperDeckOrder = [...tpl.upperDeckOrder];
      this.state.rackOrder = [...tpl.rackOrder];
      this.state.hiddenModules = [...tpl.hiddenModules];
      this.state.fullscreenModule = null;

      this.saveState();
      this.applyLayoutOrder();
      this.applyVisibility();
      if (typeof setRecordStatus === "function") {
        setRecordStatus(`Workspace Template: ${tpl.name}`);
      }
    }

    resetLayout() {
      this.state.activeTemplate = "FULL_STUDIO";
      this.state.headerOrder = [...DEFAULT_STATE.headerOrder];
      this.state.upperDeckOrder = [...DEFAULT_STATE.upperDeckOrder];
      this.state.rackOrder = [...DEFAULT_STATE.rackOrder];
      this.state.hiddenModules = [];
      this.state.fullscreenModule = null;

      this.saveState();
      this.applyLayoutOrder();
      this.applyVisibility();
      if (typeof setRecordStatus === "function") {
        setRecordStatus("Workspace Layout: Reset to Factory Default");
      }
    }

    // 10. Edit Mode Toggle
    toggleEditMode(force) {
      const now = performance.now();
      if (this._lastToggleTs && now - this._lastToggleTs < 150) return;
      this._lastToggleTs = now;

      const active = typeof force === "boolean" ? force : !this.state.editMode;
      this.state.editMode = active;
      document.body.classList.toggle("workspace-edit-mode", active);

      const btnEdit = document.getElementById("btnEditWorkspace");
      if (btnEdit) {
        btnEdit.classList.toggle("active", active);
        btnEdit.title = active
          ? "🔓 Edit UI: Drag pods and modules to reorder"
          : "🔒 Layout Locked: Click to edit layout";
        const label = btnEdit.querySelector("span");
        if (label) label.textContent = active ? "🔓 Edit UI" : "🔒 Layout";
      }

      this.saveState();
      this.updateDockUI();

      if (typeof setRecordStatus === "function") {
        setRecordStatus(active ? "Workspace: Edit Mode Active (Drag to Reorder)" : "Workspace: Layout Locked");
      }
    }

    bindEditButton() {
      const btn = document.getElementById("btnEditWorkspace");
      if (btn) {
        btn.classList.toggle("active", this.state.editMode);
        const label = btn.querySelector("span");
        if (label) label.textContent = this.state.editMode ? "🔓 Edit UI" : "🔒 Layout";
        btn.addEventListener("click", () => {
          this.toggleEditMode();
        });
      }
    }

    // 11. HTML5 and Pointer Drag & Drop Reordering
    bindDragAndDrop() {
      // A. Header Slots Reordering
      const headerSlots = document.querySelectorAll("[data-header-slot]");
      headerSlots.forEach(slot => {
        slot.setAttribute("draggable", "true");
        slot.addEventListener("dragstart", (e) => {
          if (!this.state.editMode) {
            e.preventDefault();
            return;
          }
          this.draggedElement = slot;
          this.draggedType = "header";
          slot.classList.add("dragging");
          if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", slot.getAttribute("data-header-slot"));
          }
        });

        slot.addEventListener("dragover", (e) => {
          if (!this.state.editMode || this.draggedType !== "header") return;
          e.preventDefault();
          if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
          slot.classList.add("drag-over");
        });

        slot.addEventListener("dragleave", () => {
          slot.classList.remove("drag-over");
        });

        slot.addEventListener("drop", (e) => {
          if (!this.state.editMode || this.draggedType !== "header") return;
          e.preventDefault();
          slot.classList.remove("drag-over");
          if (!this.draggedElement || this.draggedElement === slot) return;

          // Swap DOM order if in same parent container
          if (this.draggedElement.parentElement === slot.parentElement) {
            const parent = slot.parentElement;
            const children = Array.from(parent.children);
            const fromIdx = children.indexOf(this.draggedElement);
            const toIdx = children.indexOf(slot);
            if (fromIdx < toIdx) {
              parent.insertBefore(this.draggedElement, slot.nextSibling);
            } else {
              parent.insertBefore(this.draggedElement, slot);
            }

            // Sync order in state
            const newOrder = Array.from(document.querySelectorAll("[data-header-slot]"))
              .map(el => el.getAttribute("data-header-slot"))
              .filter(Boolean);
            this.state.headerOrder = newOrder;
            this.saveState();
          }
        });

        slot.addEventListener("dragend", () => {
          slot.classList.remove("dragging");
          headerSlots.forEach(s => s.classList.remove("drag-over"));
          this.draggedElement = null;
          this.draggedType = null;
        });
      });

      // B. Upper Deck & Rack Module Reordering
      const setupModuleDrag = (containerSelector, itemSelector, stateKey) => {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const items = container.querySelectorAll(itemSelector);
        items.forEach(card => {
          card.setAttribute("draggable", "true");

          card.addEventListener("dragstart", (e) => {
            if (!this.state.editMode) {
              // Allow default upper-deck drag if already enabled, else require edit mode
              if (!card.classList.contains("upper-deck-card")) {
                e.preventDefault();
                return;
              }
            }
            this.draggedElement = card;
            this.draggedType = stateKey;
            card.classList.add("dragging");
            document.body.classList.add("workspace-dragging");
            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", card.getAttribute("data-module-id") || "");
            }
          });

          card.addEventListener("dragover", (e) => {
            if (this.draggedType !== stateKey) return;
            e.preventDefault();
            if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
            card.classList.add("drag-over");
          });

          card.addEventListener("dragleave", () => {
            card.classList.remove("drag-over");
          });

          card.addEventListener("drop", (e) => {
            if (this.draggedType !== stateKey) return;
            e.preventDefault();
            card.classList.remove("drag-over");
            if (!this.draggedElement || this.draggedElement === card) return;

            const children = Array.from(container.children).filter(c => c.matches(itemSelector));
            const fromIdx = children.indexOf(this.draggedElement);
            const toIdx = children.indexOf(card);

            if (fromIdx !== -1 && toIdx !== -1) {
              if (fromIdx < toIdx) {
                container.insertBefore(this.draggedElement, card.nextSibling);
              } else {
                container.insertBefore(this.draggedElement, card);
              }

              // Update state order
              const updatedOrder = Array.from(container.querySelectorAll(itemSelector))
                .map(el => el.getAttribute("data-module-id"))
                .filter(Boolean);

              this.state[stateKey] = updatedOrder;
              this.saveState();
              this.triggerCanvasResizes();
            }
          });

          card.addEventListener("dragend", () => {
            card.classList.remove("dragging");
            document.body.classList.remove("workspace-dragging");
            items.forEach(c => c.classList.remove("drag-over"));
            this.draggedElement = null;
            this.draggedType = null;
          });
        });
      };

      setupModuleDrag(".upper-deck", ".upper-deck-card", "upperDeckOrder");
      setupModuleDrag(".lower-deck", ".strip-channel", "rackOrder");
    }

    // 12. Trigger Canvas and Layout Resizes
    triggerCanvasResizes() {
      requestAnimationFrame(() => {
        if (typeof scopeNeedsResize !== "undefined") scopeNeedsResize = true;
        if (typeof orbitalNeedsResize !== "undefined") orbitalNeedsResize = true;
        if (typeof lastChordWheelSignature !== "undefined") lastChordWheelSignature = "";

        if (typeof updateCanvasDimensions === "function") updateCanvasDimensions();
        if (typeof drawChordWheelCard === "function") drawChordWheelCard();
        if (typeof drawScope === "function") drawScope();
        if (typeof buildKeyboard === "function") buildKeyboard();

        window.dispatchEvent(new Event("resize"));
      });
    }

    bindGlobalKeys() {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          if (document.body.classList.contains("module-focus-open")) {
            e.preventDefault();
            this.exitFullscreen();
          }
        }
      });
    }
  }

  // Instantiate and export singleton
  const manager = new WorkspaceManager();
  window.workspaceManager = manager;
  window.WorkspaceManager = WorkspaceManager;

  // Global helper functions
  window.toggleModuleVisibility = (modId) => manager.toggleModuleVisibility(modId);
  window.toggleModuleFullscreen = (modId) => manager.toggleModuleFullscreen(modId);
  window.toggleWorkspaceEditMode = (force) => manager.toggleEditMode(force);
  window.exitModuleFullscreen = () => manager.exitFullscreen();
  window.applyWorkspaceTemplate = (key) => manager.applyTemplate(key);
  window.resetWorkspaceLayout = () => manager.resetLayout();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => manager.init());
  } else {
    manager.init();
  }
})();
