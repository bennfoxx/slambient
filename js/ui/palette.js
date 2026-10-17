/* ==========================================================================
   COLOR PALETTE PICKER (Phase 7)
   One theme = 9 colors, one per module (drone, drum, chord, arp, noise,
   filter, delay, reverb, space). applyColorTheme() pushes them everywhere:
     - CSS: --color-<module> and --rgb-<module> on :root. Every stylesheet
       use of a module color reads those variables (the old hardcoded
       rgba(0, 229, 255, ...) etc. were converted), and --accent follows the
       chord color, so panels, header, dropdowns and glows all follow.
     - Canvas: the oscilloscope rings, waterfall, orbital orbs, chord wheel,
       scope core, fractal palette and Invaders read their colors from the
       active theme (themeHex / themeRgb / themeRgbArr) or are updated in place.
     - Floating shapes keep their hand-picked blue/green/pink-weighted mix on
       the Slambient theme; other themes draw shapes from their own 9 colors.
   The choice (including a randomized palette) is remembered per browser via
   localStorage, which is optional: the page works the same without it.
   The Bio-Scan CRT pod's border-color cycling is separate and still works on top.
   ========================================================================== */
var THEME_KEYS = ["drone", "drum", "chord", "arp", "noise", "field", "filter", "delay", "reverb", "space"];
var COLOR_THEMES = [
  { id: "slambient", name: "Slambient",     desc: "The original phosphor set",
    colors: ["#00e5ff", "#ff3838", "#fed330", "#7d5fff", "#1dd1a1", "#2bcbba", "#2ed573", "#ff793f", "#ff5fc4", "#4b7bec"],
    uiColor: "SLAM · Y" },
  { id: "kankyo",    name: "Kankyō Pastel", desc: "Soft 80s Japanese ambient",
    colors: ["#7fc8d6", "#e07a5f", "#f2cc8f", "#a99bd8", "#8fc0a9", "#7ec2aa", "#a8d672", "#e9a06b", "#eaa1c0", "#7b9fd9"],
    uiColor: "SLAM · P" },
  { id: "aurora",    name: "Aurora",        desc: "Electric greens, violets and magentas",
    colors: ["#3cf2c2", "#ff4f8b", "#c6f35a", "#9d7bff", "#5ee6ff", "#38ef7d", "#54f08a", "#ffb347", "#f572ff", "#5a8cff"],
    uiColor: "SLAM · G" },
  { id: "sodium",    name: "Sodium Tape",   desc: "Warm amber CRT and worn tape",
    colors: ["#ffb000", "#ff4a1c", "#ffd56b", "#ff7f6e", "#e9c46a", "#f4a261", "#cddc6b", "#ff8c42", "#ff6f91", "#f4a261"],
    uiColor: "SLAM · Y" },
  { id: "glacier",   name: "Glacier",       desc: "Cold blues with a pink pulse",
    colors: ["#9be7ff", "#ff6b8b", "#e3f4ff", "#8ab4ff", "#7fe7d4", "#5eead4", "#6ee7b7", "#a5b4fc", "#d0b5fd", "#60a5fa"],
    uiColor: "SLAM · W" }
];
var THEME_STORAGE_KEY = "slambient.colorTheme";
var DEFAULT_ROADSIDE_COLORS = ROADSIDE_COLORS.map(([rgb, w]) => [rgb.slice(), w]);
var FALLBACK_THEME_HEX = {
  drone: "#00e5ff", drum: "#ff3838", chord: "#fed330", arp: "#7d5fff", noise: "#1dd1a1",
  field: "#2bcbba", filter: "#2ed573", delay: "#ff793f", reverb: "#ff5fc4", space: "#4b7bec"
};
var FALLBACK_THEME_RGB = {
  drone: [0, 229, 255], drum: [255, 56, 56], chord: [254, 211, 48], arp: [125, 95, 255], noise: [29, 209, 161],
  field: [43, 203, 186], filter: [46, 213, 115], delay: [255, 121, 63], reverb: [255, 95, 196], space: [75, 123, 236]
};
var activeTheme = { id: "slambient", name: "Slambient", hex: Object.assign({}, FALLBACK_THEME_HEX), rgb: Object.assign({}, FALLBACK_THEME_RGB), uiColor: "SLAM · Y" };

function hexToRgbArr(hex) {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbArrToHex(rgb) {
  return "#" + rgb.map(v => Math.round(v).toString(16).padStart(2, "0")).join("");
}
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbArrToHex([f(0) * 255, f(8) * 255, f(4) * 255]);
}
function mixRgb(a, b, t) { return a.map((v, i) => v + (b[i] - v) * t); }

function themeHex(key) {
  return (activeTheme && activeTheme.hex && activeTheme.hex[key]) || (FALLBACK_THEME_HEX && FALLBACK_THEME_HEX[key]) || "#ffffff";
}
function themeRgbArr(key) {
  return ((activeTheme && activeTheme.rgb && activeTheme.rgb[key]) || (FALLBACK_THEME_RGB && FALLBACK_THEME_RGB[key]) || [255, 255, 255]).slice();
}
function themeRgb(key) { return themeRgbArr(key).join(", "); }

// Random palette: 9 hues spread evenly round the wheel from a random start,
// shuffled across modules, with jitter so it never looks mechanical. Kept
// bright enough to read on the dark panels; chords (also the UI accent)
// stay lightest because they color a lot of text. Also randomizes the SLAM UI color.
function makeRandomTheme() {
  const start = Math.random() * 360;
  const hues = THEME_KEYS.map((_, i) => (start + i * 40 + (Math.random() - 0.5) * 18 + 360) % 360);
  for (let i = hues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [hues[i], hues[j]] = [hues[j], hues[i]];
  }
  const colors = THEME_KEYS.map((k, i) => hslToHex(
    hues[i],
    68 + Math.random() * 27,
    k === "chord" ? 66 + Math.random() * 8 : 56 + Math.random() * 12
  ));
  const randomPhos = ENO_PHOSPHORS[Math.floor(Math.random() * ENO_PHOSPHORS.length)];
  return { id: "random", name: "Random", desc: "Randomized palette", colors, uiColor: randomPhos.name };
}

function applyColorTheme(theme, persist = true) {
  const hex = {}, rgb = {};
  THEME_KEYS.forEach((k, i) => { hex[k] = theme.colors[i]; rgb[k] = hexToRgbArr(theme.colors[i]); });
  activeTheme = { id: theme.id, name: theme.name, colors: theme.colors.slice(), hex, rgb, uiColor: theme.uiColor };

  // Set paired SLAM UI color if specified
  if (theme.uiColor && typeof setEnoPhosphor === "function") {
    setEnoPhosphor(theme.uiColor);
  }

  // CSS variables
  const root = document.documentElement.style;
  THEME_KEYS.forEach(k => {
    root.setProperty(`--color-${k}`, hex[k]);
    root.setProperty(`--rgb-${k}`, rgb[k].join(", "));
  });

  // Canvas color tables, updated in place
  RING_CONFIGS.forEach(cfg => {
    if (hex[cfg.id]) cfg.color = hex[cfg.id];
    else if (cfg.id === "arp_main") cfg.color = rgbArrToHex(mixRgb(rgb.arp, [255, 255, 255], 0.12));
    else if (cfg.id === "arp_shimmer") cfg.color = rgbArrToHex(mixRgb(rgb.arp, [255, 255, 255], 0.7));
  });
  WATERFALL_TRACKS.forEach(t => { if (hex[t.id]) { t.color = hex[t.id]; t.rgb = rgb[t.id].slice(); } });
  ORBITAL_MODULES.forEach(o => { if (hex[o.id]) { o.color = hex[o.id]; o.rgb = rgb[o.id].slice(); } });
  Object.keys(ARCADE_TYPES).forEach(k => { if (rgb[k]) ARCADE_TYPES[k].rgb = rgb[k].slice(); });
  rgb.reverb.forEach((v, i) => { ARCADE_UFO_RGB[i] = v; });
  FRACTAL_PALETTE = buildFractalPalette();

  // Floating shapes: curated mix on the home theme, the theme's own colors otherwise.
  ROADSIDE_COLORS.length = 0;
  if (theme.id === "slambient") DEFAULT_ROADSIDE_COLORS.forEach(([c, w]) => ROADSIDE_COLORS.push([c.slice(), w]));
  else THEME_KEYS.forEach(k => ROADSIDE_COLORS.push([rgb[k].slice(), 1]));
  ROADSIDE_COLOR_WEIGHT_TOTAL = ROADSIDE_COLORS.reduce((a, c) => a + c[1], 0);
  lastRoadsideColorIdx = -1;

  // An open orbital side panel keeps the accent it was opened with; refresh it.
  if (typeof expandedOrbId !== "undefined" && expandedOrbId) {
    const orb = ORBITAL_MODULES.find(o => o.id === expandedOrbId);
    const panel = document.getElementById("orbitalSidePanel");
    const title = document.getElementById("orbitalModalTitle");
    if (orb && panel) {
      const activeColor = (typeof themeHex === "function" ? themeHex(expandedOrbId) : null) || orb.color;
      const activeRgb = (typeof themeRgb === "function" ? themeRgb(expandedOrbId) : null) || (Array.isArray(orb.rgb) ? orb.rgb.join(", ") : "0, 229, 255");
      panel.style.setProperty("--modal-accent-color", activeColor);
      panel.style.setProperty("--modal-accent-glow", `rgba(${activeRgb}, 0.45)`);
      panel.style.setProperty("--modal-accent-rgb", activeRgb);
      if (title) title.style.color = activeColor;
    }
    if (typeof renderSignalRibbon === "function") {
      renderSignalRibbon(expandedOrbId);
    }
  }

  if (typeof renderMobileMacroGrid === "function") {
    renderMobileMacroGrid();
  }

  if (persist) {
    try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ id: theme.id, name: theme.name, colors: theme.colors, uiColor: theme.uiColor })); } catch (err) {}
  }
  renderPaletteMenu();
}

function selectColorTheme(id) {
  const theme = id === "random" ? makeRandomTheme() : COLOR_THEMES.find(t => t.id === id);
  if (!theme) return;
  applyColorTheme(theme);
  const status = document.getElementById("footerStatus");
  if (status) status.textContent = `Palette: ${theme.name}${theme.uiColor ? ` (${theme.uiColor})` : ""}`;
}

function renderPaletteMenu() {
  const menu = document.getElementById("paletteMenu");
  if (!menu) return;
  const swatches = (colors, ghost) => `<span class="pal-swatches${ghost ? " pal-ghost" : ""}">${colors.map(c => `<i${ghost ? "" : ` style="background:${c}"`}></i>`).join("")}</span>`;
  const rows = COLOR_THEMES.map((t, i) => `
    <button class="pal-row${activeTheme.id === t.id ? " active" : ""}" onclick="selectColorTheme('${t.id}')" title="${t.desc} — UI: ${t.uiColor}">
      <span class="pal-num">${i + 1}</span>
      <span class="pal-name">${t.name}</span>
      ${swatches(t.colors)}
    </button>`).join("");
  const randomColors = activeTheme.id === "random" ? activeTheme.colors : null;
  menu.innerHTML = `
    <div class="pal-head">Color Palette</div>
    ${rows}
    <button class="pal-row pal-random${randomColors ? " active" : ""}" onclick="selectColorTheme('random')" title="Generate a new random palette & UI color (click again for another)">
      <span class="pal-num">⟲</span>
      <span class="pal-name">Randomize</span>
      ${swatches(randomColors || COLOR_THEMES[0].colors.map(() => ""), !randomColors)}
    </button>`;
  const btnDots = document.querySelectorAll("#btnPalette .pal-btn-dots i");
  ["drone", "drum", "chord", "arp"].forEach((k, i) => { if (btnDots[i]) btnDots[i].style.background = themeHex(k); });
}

function togglePaletteMenu(force) {
  const menu = document.getElementById("paletteMenu");
  const btn = document.getElementById("btnPalette");
  if (!menu) return;
  const open = typeof force === "boolean" ? force : !menu.classList.contains("open");
  menu.classList.toggle("open", open);
  if (btn) { btn.classList.toggle("active", open); btn.blur(); }
}

document.addEventListener("pointerdown", (e) => {
  const menu = document.getElementById("paletteMenu");
  if (!menu || !menu.classList.contains("open")) return;
  if (e.target.closest("#paletteMenu") || e.target.closest("#btnPalette")) return;
  togglePaletteMenu(false);
});
window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const menu = document.getElementById("paletteMenu");
  if (menu && menu.classList.contains("open")) togglePaletteMenu(false);
});

(function initColorTheme() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "null"); } catch (err) {}
  if (saved && Array.isArray(saved.colors) && saved.colors.length === 9) {
    saved.colors.splice(5, 0, "#2bcbba");
  }
  const valid = saved && Array.isArray(saved.colors) && saved.colors.length === THEME_KEYS.length &&
    saved.colors.every(c => /^#[0-9a-f]{6}$/i.test(c));
  if (valid && saved) {
    const matched = COLOR_THEMES.find(t => t.id === saved.id);
    if (!saved.uiColor && matched && matched.uiColor) saved.uiColor = matched.uiColor;
  }
  applyColorTheme(valid ? saved : COLOR_THEMES[0], false);
})();
