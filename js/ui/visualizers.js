// Slambient — 3D Wireframe Eno Head & Auxiliary Canvas Visualizer Engine
// Handles 3D spline geometry, rotating wireframe projection, audio-reactive amplitude modulation,
// CRT phosphor switching, and Eno pod layout synchronization.

(function (root) {
  'use strict';

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;

  function makeSpline(pts) {
    const n = pts.length, m = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      m[i] = (b[1] - a[1]) / ((b[0] - a[0]) || 1e-9);
    }
    return function (x) {
      if (x >= pts[0][0]) return pts[0][1];
      if (x <= pts[n - 1][0]) return pts[n - 1][1];
      let i = 0;
      while (x < pts[i + 1][0]) i++;
      const x0 = pts[i][0], x1 = pts[i + 1][0], h = x1 - x0;
      const t = (x - x0) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h * m[i] +
             (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h * m[i + 1];
    };
  }

  const Y_TOP = 1.00, Y_DOME = 0.36, Y_CHIN = -1.0, NECK_START = -1.26, NECK_END = -1.52;

  const PROFILE = [
    [ 0.36,  0.76,  0.88,  0.68,  2.3],
    [ 0.24,  0.80,  0.91,  0.71,  2.3],
    [ 0.10,  0.82,  0.93,  0.69,  2.4],
    [-0.10,  0.80,  0.90,  0.62,  2.4],
    [-0.30,  0.77,  0.85,  0.57,  2.5],
    [-0.50,  0.77,  0.76,  0.51,  2.5],
    [-0.70,  0.73,  0.62,  0.43,  2.4],
    [-0.85,  0.69,  0.50,  0.35,  2.3],
    [-0.97,  0.58,  0.46,  0.30,  2.2],
    [-1.06,  0.40,  0.44,  0.27,  2.1],
    [-1.14,  0.30,  0.42,  0.26,  2.0],
    [-1.70,  0.30,  0.46,  0.26,  2.0]
  ];
  const sXf = makeSpline(PROFILE.map(p => [p[0], p[1]]));
  const sXb = makeSpline(PROFILE.map(p => [p[0], p[2]]));
  const sB  = makeSpline(PROFILE.map(p => [p[0], p[3]]));
  const sN  = makeSpline(PROFILE.map(p => [p[0], p[4]]));

  function profileAt(y) {
    let k = 1;
    if (y > Y_DOME) {
      const t = clamp((y - Y_DOME) / (Y_TOP - Y_DOME), 0, 1);
      k = Math.pow(Math.max(0, 1 - Math.pow(t, 2.25)), 1 / 2.25);
    }
    const yy = Math.min(y, Y_DOME);
    let neck = 1;
    if (y < NECK_START) {
      const t = clamp((NECK_START - y) / (NECK_START - NECK_END), 0, 1);
      neck = Math.sqrt(Math.max(0, 1 - t * t));
    }
    const s = k * neck;
    return { xf: sXf(yy) * s, xb: sXb(yy) * s, b: sB(yy) * s, n: sN(yy) };
  }

  function blob(y, z, y0, z0, sy, sz, A, pz) {
    const dy = (y - y0) / sy, dz = Math.abs((z - z0) / sz);
    return A * Math.exp(-dy * dy - Math.pow(dz, pz || 2));
  }
  const sym = (y, z, y0, z0, sy, sz, A, pz) =>
    blob(y, z, y0, z0, sy, sz, A, pz) + blob(y, z, y0, -z0, sy, sz, A, pz);

  const noseA = makeSpline([[0.13, 0.0], [0.07, 0.012], [0.02, 0.045], [-0.08, 0.090], [-0.18, 0.135], [-0.28, 0.185],
                            [-0.36, 0.222], [-0.41, 0.240], [-0.45, 0.205], [-0.49, 0.120], [-0.53, 0.045], [-0.575, 0.0]]);
  const noseW = makeSpline([[0.13, 0.050], [0.02, 0.054], [-0.15, 0.066], [-0.30, 0.088],
                            [-0.40, 0.112], [-0.47, 0.135], [-0.58, 0.135]]);

  function faceDx(y, z, P) {
    let d = 0;
    d += blob(y, z, 0.115, 0, 0.05, 0.52, 0.050 * P.brow, 4);
    d += blob(y, z, 0.02, 0, 0.07, 0.07, -0.030);
    d += sym(y, z, 0.0, 0.27, 0.10, 0.14, -0.060);
    d += sym(y, z, 0.075, 0.27, 0.035, 0.13, 0.016);
    d += sym(y, z, 0.10, 0.60, 0.15, 0.08, -0.03);
    d += sym(y, z, -0.18, 0.50, 0.12, 0.13, 0.040);
    d += sym(y, z, -0.52, 0.36, 0.13, 0.13, -0.030);
    if (y < 0.13 && y > -0.58) d += noseA(y) * P.nose * Math.exp(-Math.pow(z / noseW(y), 2));
    d += sym(y, z, -0.435, 0.118, 0.046, 0.040, 0.058 * P.nose);
    d += sym(y, z, -0.335, 0.135, 0.07, 0.028, -0.022 * P.nose);
    d += sym(y, z, -0.505, 0.062, 0.024, 0.032, -0.045 * P.nose);
    d += sym(y, z, -0.58, 0.22, 0.14, 0.035, -0.022);
    d += blob(y, z, -0.570, 0, 0.055, 0.028, -0.014);
    d += sym(y, z, -0.570, 0.045, 0.05, 0.02, 0.012);
    d += blob(y, z, -0.622, 0, 0.032, 0.150, 0.050 * P.lips, 2);
    d += blob(y, z, -0.748, 0, 0.040, 0.140, 0.056 * P.lips, 2);
    d += blob(y, z, -0.687, 0, 0.013, 0.190, -0.040 * P.lips, 3);
    d += sym(y, z, -0.687, 0.185, 0.04, 0.03, -0.018);
    d += blob(y, z, -0.832, 0, 0.028, 0.150, -0.042, 2);
    d += blob(y, z, -0.945, 0, 0.075, 0.150, 0.075 * P.chin, 2);
    d += sym(y, z, -0.80, 0.30, 0.10, 0.07, -0.02);
    return d;
  }

  const DEFAULTS = { cols: 104, rowStep: 0.046, domeRows: 20, detail: 1, brow: 1, nose: 1, lips: 1, chin: 1 };

  function headPoint(y, theta, P) {
    const p = profileAt(y);
    const c = Math.cos(theta), s = Math.sin(theta), n = p.n;
    const r = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n);
    let x = (c >= 0 ? p.xf : p.xb) * c * r;
    const z = p.b * s * r;
    if (y < Y_DOME && c > 0 && p.xf > 0.05) x += faceDx(y, z, P) * smooth(0.0, 0.5, c) * smooth(1.45, 1.1, -y);
    return [x, y, z];
  }
  function frontPoint(y, z, P) {
    const p = profileAt(y), q = clamp(Math.abs(z) / p.b, 0, 0.999);
    return [p.xf * Math.pow(1 - Math.pow(q, p.n), 1 / p.n) + faceDx(y, z, P), y, z];
  }
  function baseFront(y, z) {
    const p = profileAt(y), q = clamp(Math.abs(z) / p.b, 0, 0.999);
    let x = p.xf * Math.pow(1 - Math.pow(q, p.n), 1 / p.n);
    if (y < 0.13 && y > -0.58) x += noseA(y) * Math.exp(-Math.pow(z / noseW(y), 2));
    return x;
  }
  function sideZ(x, y) {
    const p = profileAt(y), a = x >= 0 ? p.xf : p.xb;
    const q = clamp(Math.abs(x) / a, 0, 0.999);
    return p.b * Math.pow(1 - Math.pow(q, p.n), 1 / p.n);
  }

  function buildMesh(userOpts) {
    const P = Object.assign({}, DEFAULTS, userOpts || {});
    const V = [], faces = [], edges = [];
    const vtx = (x, y, z) => { V.push(x, y, z); return V.length / 3 - 1; };

    function addGrid(R, C, periodic, get, dbl, skipRowEdges) {
      const base = faces.length, idx = [];
      const W = periodic ? C : C + 1;
      for (let r = 0; r <= R; r++) { idx.push([]); for (let c = 0; c < W; c++) { const p = get(r, c); idx[r].push(vtx(p[0], p[1], p[2])); } }
      const faceId = (r, c) => {
        if (r < 0 || r >= R) return -1;
        if (periodic) c = ((c % C) + C) % C; else if (c < 0 || c >= C) return -1;
        return base + r * C + c;
      };
      for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
        const c1 = periodic ? (c + 1) % C : c + 1;
        faces.push([idx[r][c], idx[r][c1], idx[r + 1][c1], idx[r + 1][c], dbl ? 1 : 0]);
      }
      for (let r = 0; r <= R; r++) {
        if (skipRowEdges && skipRowEdges(r)) continue;
        for (let c = 0; c < C; c++) {
          const c1 = periodic ? (c + 1) % C : c + 1;
          edges.push([idx[r][c], idx[r][c1], faceId(r - 1, c), faceId(r, c), 0]);
        }
      }
      for (let r = 0; r < R; r++) for (let c = 0; c < W; c++)
        edges.push([idx[r][c], idx[r + 1][c], faceId(r, c - 1), faceId(r, c), 0]);
    }
    const addLine = (pts) => {
      const ids = pts.map(p => vtx(p[0], p[1], p[2]));
      for (let i = 0; i < ids.length - 1; i++) edges.push([ids[i], ids[i + 1], -1, -1, 1]);
    };
    const addLoop = (pts) => addLine(pts.concat([pts[0]]));

    const rows = [];
    for (let i = 0; i <= P.domeRows; i++) { const a = (i / P.domeRows) * Math.PI / 2; rows.push(Y_DOME + (Y_TOP - Y_DOME) * Math.cos(a)); }
    const g = (y, y0, w) => Math.exp(-Math.pow((y - y0) / w, 2));
    const dens = (y) => 1 + P.detail * (1.35 * g(y, -0.70, 0.17) + 0.55 * g(y, 0.02, 0.15) + 0.50 * g(y, -0.40, 0.11) + 0.50 * g(y, -0.93, 0.07));
    const NS = 600, cum = [0];
    for (let i = 1; i <= NS; i++) { const y = Y_DOME - (Y_DOME - Y_CHIN) * (i - 0.5) / NS; cum.push(cum[i - 1] + dens(y) * (Y_DOME - Y_CHIN) / NS / P.rowStep); }
    const nFace = Math.round(cum[NS]);
    for (let k = 1; k <= nFace; k++) {
      const target = cum[NS] * k / nFace;
      let i = 1; while (i < NS && cum[i] < target) i++;
      const t = (target - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      rows.push(Y_DOME - (Y_DOME - Y_CHIN) * ((i - 1) + t) / NS);
    }
    for (let i = 1; i <= 3; i++) rows.push(Y_CHIN + (NECK_START - Y_CHIN) * i / 3);
    for (let i = 1; i <= 4; i++) rows.push(NECK_START - (NECK_START - NECK_END) * Math.sin((i / 4) * Math.PI / 2));
    const Rn = rows.length - 1, C = P.cols;
    const thetaOf = (i) => { const v = (i / C) * Math.PI * 2; return v - 0.50 * Math.sin(v); };
    addGrid(Rn, C, true, (r, c) => headPoint(rows[r], thetaOf(c), P), false, (r) => r === 0 || r === Rn);
    const headFaceCount = faces.length;

    const earH = makeSpline([[1.0, 0.085], [0.92, 0.075], [0.78, 0.045], [0.60, 0.068], [0.45, 0.046], [0.25, 0.020], [0.0, 0.012]]);
    function addEar(side) {
      const cx = -0.095, cy = -0.15, tilt = 0.22, Rr = 9, Cc = 30;
      addGrid(Rr, Cc, true, (r, c) => {
        const rho = r / Rr, psi = (c / Cc) * Math.PI * 2;
        const sn = Math.sin(psi), cs = Math.cos(psi);
        const wTop = 1 + 0.16 * smooth(0, 1, sn), wLobe = 1 - 0.30 * smooth(0.1, 1, -sn);
        const ou = cs * 0.150 * wTop * wLobe, ov = sn * (sn > 0 ? 0.285 : 0.340);
        const c0u = 0.030, c0v = -0.045;
        const u = c0u + rho * (ou - c0u), v = c0v + rho * (ov - c0v);
        const uu = u * Math.cos(tilt) - v * Math.sin(tilt), vv = u * Math.sin(tilt) + v * Math.cos(tilt);
        const x = cx + uu, y = cy + vv;
        const back = 0.5 - 0.5 * cs;
        let h = earH(clamp(rho, 0, 1)) * (0.30 + 0.85 * back);
        h += 0.022 * Math.exp(-Math.pow((rho - 0.52) / 0.10, 2)) * smooth(-0.3, 0.6, sn);
        if (sn < -0.55) h *= 0.55;
        return [x, y, side * (sideZ(x, y) + h + 0.003)];
      }, true, (r) => r === 0);
    }
    addEar(+1); addEar(-1);

    const lift = 0.006;
    const off = (arr) => arr.map(p => [p[0] + lift, p[1], p[2]]);
    for (const sg of [1, -1]) {
      const ez = 0.27 * sg, ey = 0.0, up = [], dn = [], br = [], ir = [];
      for (let i = 0; i <= 12; i++) {
        const a = lerp(-1, 1, i / 12);
        up.push(frontPoint(ey + 0.050 * (1 - a * a) + 0.004, ez + a * 0.115, P));
        dn.push(frontPoint(ey - 0.030 * (1 - a * a), ez + a * 0.115, P));
        br.push(frontPoint(0.155 + 0.03 * (1 - a * a), ez + a * 0.17, P));
      }
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ir.push(frontPoint(ey + Math.sin(a) * 0.034, ez + Math.cos(a) * 0.034, P)); }
      addLine(off(up)); addLine(off(dn)); addLoop(off(ir)); addLine(off(br));
    }

    const OFF = 0.078, D = 0.040;
    const gp = (y, zAbs, sg, dx) => [baseFront(y, zAbs) + OFF + (dx || 0), y, sg * zAbs];
    function rrect(cz, cy, w, h, r, n) {
      const pts = [];
      const corners = [[cz + w / 2 - r, cy + h / 2 - r, 0], [cz - w / 2 + r, cy + h / 2 - r, 90],
                       [cz - w / 2 + r, cy - h / 2 + r, 180], [cz + w / 2 - r, cy - h / 2 + r, 270]];
      for (const [px, py, a0] of corners) for (let i = 0; i <= n; i++) { const a = (a0 + 90 * i / n) * Math.PI / 180; pts.push([px + Math.cos(a) * r, py + Math.sin(a) * r]); }
      return pts;
    }
    const dense = (pts) => { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; for (let k = 0; k < 3; k++) out.push([lerp(a[0], b[0], k / 3), lerp(a[1], b[1], k / 3)]); } return out; };
    const FZ = 0.30, FY = 0.012, FW = 0.45, FH = 0.30;
    for (const sg of [1, -1]) {
      const O = dense(rrect(FZ, FY, FW, FH, 0.07, 4)), I = dense(rrect(FZ, FY, FW - 0.075, FH - 0.075, 0.05, 4));
      addLoop(O.map(p => gp(p[1], p[0], sg, 0)));
      addLoop(O.map(p => gp(p[1], p[0], sg, -D)));
      addLoop(I.map(p => gp(p[1], p[0], sg, 0)));
      addLoop(I.map(p => gp(p[1], p[0], sg, -D * 0.6)));
      for (let i = 0; i < O.length; i += 6) addLine([gp(O[i][1], O[i][0], sg, 0), gp(O[i][1], O[i][0], sg, -D)]);
      for (let i = 0; i < I.length; i += 6) addLine([gp(I[i][1], I[i][0], sg, 0), gp(I[i][1], I[i][0], sg, -D * 0.6)]);
      const hz = FZ + FW / 2, hy = FY + FH / 2 - 0.045, x0 = baseFront(hy, hz) + OFF - D;
      const arm = [], armLo = [], n = 18;
      for (let i = 0; i <= n; i++) {
        const t = i / n, x = lerp(x0, -0.17, t), y = hy + 0.012 * t;
        const z = sideZ(x, y) + 0.026 + 0.014 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * (1 - t);
        arm.push([x, y, sg * z]); armLo.push([x, y - 0.034, sg * z]);
      }
      const hook = [], hookLo = [];
      for (let i = 1; i <= 6; i++) {
        const t = i / 6, x = -0.17 - 0.085 * t, y = hy + 0.012 - 0.20 * t, z = sideZ(x, y) + 0.022;
        hook.push([x, y, sg * z]); hookLo.push([x, y - 0.030, sg * z]);
      }
      addLine(arm.concat(hook)); addLine(armLo.concat(hookLo));
      for (let i = 0; i <= n; i += 6) addLine([arm[i], armLo[i]]);
    }
    for (const dy of [0.0, -0.032]) {
      const br = [];
      for (let i = 0; i <= 10; i++) {
        const z = lerp(-0.075, 0.075, i / 10), y = 0.112 + dy - 0.012 * (1 - Math.pow(z / 0.075, 2));
        br.push([baseFront(y, z) + OFF - 0.006, y, z]);
      }
      addLine(br);
    }
    for (const sg of [1, -1]) {
      const pad = [];
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, yy = -0.07 + Math.sin(a) * 0.04, zz = 0.088 + Math.cos(a) * 0.014; pad.push([baseFront(yy, zz) + 0.024, yy, sg * zz]); }
      addLoop(pad);
    }

    return { V: Float32Array.from(V), faces, edges, headFaceCount, opts: P };
  }

  function createRenderer(mesh, opts) {
    const o = Object.assign({ size: 340, fov: 3.4, scale: 0, depthScale: 0.5, yOffset: 0 }, opts || {});
    const nV = mesh.V.length / 3;
    const X = new Float32Array(nV), Y = new Float32Array(nV), Z = new Float32Array(nV);
    const SX = new Float32Array(nV), SY = new Float32Array(nV);
    const faces = mesh.faces, nF = faces.length, facing = new Uint8Array(nF);

    let windSign = 1;
    {
      const V = mesh.V;
      for (let f = 0; f < mesh.headFaceCount; f++) {
        const fc = faces[f];
        const cy = (V[fc[0] * 3 + 1] + V[fc[2] * 3 + 1]) / 2, cx = (V[fc[0] * 3] + V[fc[2] * 3]) / 2;
        if (Math.abs(cy) < 0.05 && cx > 0.6) {
          const ay = V[fc[1] * 3 + 1] - V[fc[0] * 3 + 1], az = V[fc[1] * 3 + 2] - V[fc[0] * 3 + 2];
          const by = V[fc[3] * 3 + 1] - V[fc[0] * 3 + 1], bz = V[fc[3] * 3 + 2] - V[fc[0] * 3 + 2];
          windSign = (ay * bz - az * by) > 0 ? 1 : -1; break;
        }
      }
    }

    let DW = 0, depth = null;
    function ensureDepth() {
      const w = Math.ceil(o.size * o.depthScale);
      if (w !== DW) { DW = w; depth = new Float32Array(DW * DW); }
    }

    function tri(ax, ay, az, bx, by, bz, cx, cy, cz) {
      const ds = o.depthScale;
      ax *= ds; ay *= ds; bx *= ds; by *= ds; cx *= ds; cy *= ds;
      const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (Math.abs(area) < 1e-7) return;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(DW - 1, Math.ceil(Math.max(ax, bx, cx)));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(DW - 1, Math.ceil(Math.max(ay, by, cy)));
      const inv = 1 / area, eps = -0.02;
      for (let y = y0; y <= y1; y++) {
        const py = y + 0.5;
        for (let x = x0; x <= x1; x++) {
          const px = x + 0.5;
          const w0 = ((bx - px) * (cy - py) - (by - py) * (cx - px)) * inv;
          const w1 = ((cx - px) * (ay - py) - (cy - py) * (ax - px)) * inv;
          const w2 = 1 - w0 - w1;
          if (w0 < eps || w1 < eps || w2 < eps) continue;
          const z = w0 * az + w1 * bz + w2 * cz, i = y * DW + x;
          if (z < depth[i]) depth[i] = z;
        }
      }
    }

    function draw(st) {
      ensureDepth();
      const size = o.size, ds = o.depthScale, fov = o.fov, V = mesh.V;
      const cosY = Math.cos(st.rotY), sinY = Math.sin(st.rotY), cosX = Math.cos(st.rotX), sinX = Math.sin(st.rotX);
      const sc = (o.scale || size * 0.40) * (1 + 0.04 * (st.pulse || 0));
      const cx = size / 2 + (o.xOffset || 0) * size, cy = size / 2 + o.yOffset * size;

      for (let i = 0; i < nV; i++) {
        const x = V[i * 3], y = V[i * 3 + 1], z = V[i * 3 + 2];
        const x1 = x * cosY + z * sinY, z1 = -x * sinY + z * cosY;
        const y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
        X[i] = x1; Y[i] = y2; Z[i] = z2;
        const ps = fov / Math.max(0.2, z2 + fov);
        SX[i] = cx + x1 * sc * ps; SY[i] = cy - y2 * sc * ps;
      }
      for (let f = 0; f < nF; f++) {
        const fc = faces[f];
        if (fc[4]) { facing[f] = 1; continue; }
        const a = fc[0], b = fc[1], d = fc[3];
        const ax = X[b] - X[a], ay = Y[b] - Y[a], az = Z[b] - Z[a];
        const bx = X[d] - X[a], by = Y[d] - Y[a], bz = Z[d] - Z[a];
        const nx = (ay * bz - az * by) * windSign, ny = (az * bx - ax * bz) * windSign, nz = (ax * by - ay * bx) * windSign;
        facing[f] = (nx * X[a] + ny * Y[a] + nz * (Z[a] + fov)) < 0 ? 1 : 0;
      }
      depth.fill(1e9);
      for (let f = 0; f < nF; f++) {
        if (!facing[f]) continue;
        const fc = faces[f], a = fc[0], b = fc[1], c = fc[2], d = fc[3];
        tri(SX[a], SY[a], Z[a], SX[b], SY[b], Z[b], SX[c], SY[c], Z[c]);
        tri(SX[a], SY[a], Z[a], SX[b], SY[b], Z[b], SX[d], SY[d], Z[d]);
      }
      const visible = [], rim = [], edges = mesh.edges, bias = 0.045;
      for (let e = 0; e < edges.length; e++) {
        const ed = edges[e], a = ed[0], b = ed[1], fa = ed[2], fb = ed[3], kind = ed[4];
        const dx = SX[a] - SX[b], dy = SY[a] - SY[b];
        if (dx * dx + dy * dy < 0.04) continue;
        let isRim = false;
        if (kind === 0) {
          const A = fa >= 0 && facing[fa], B = fb >= 0 && facing[fb];
          if (!A && !B) continue;
          if (A !== B && !(fa >= 0 && fb >= 0 && faces[fa][4])) isRim = true;
        }
        const mx = (SX[a] + SX[b]) * 0.5, my = (SY[a] + SY[b]) * 0.5, mz = (Z[a] + Z[b]) * 0.5;
        const px = Math.floor(mx * ds), py = Math.floor(my * ds);
        if (px < 0 || py < 0 || px >= DW || py >= DW) continue;
        let dm = depth[py * DW + px];
        if (px + 1 < DW) dm = Math.min(dm, depth[py * DW + px + 1]);
        if (py + 1 < DW) dm = Math.min(dm, depth[(py + 1) * DW + px]);
        if (mz > dm + (kind === 1 ? bias * 0.6 : bias)) continue;
        (isRim ? rim : visible).push(e);
      }
      return { visible, rim, SX, SY, edges };
    }
    return { draw, o, nV };
  }

  root.EnoHeadCore = { buildMesh, createRenderer, DEFAULTS };
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
  function hexToRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }

  function mount(canvas, userOpts) {
    const opt = Object.assign({ size: 0, color: '#33ff33', speed: 0.22, quality: 'auto' }, userOpts || {});
    const ctx = canvas.getContext('2d');
    let cssSize = canvas.clientWidth || opt.size || 128;
    const q = opt.quality === 'auto' ? (cssSize < 220 ? 'low' : 'high') : opt.quality;
    const meshOpts = q === 'low' ? { cols: 56, rowStep: 0.085, domeRows: 11, detail: 0.6 } : { cols: 66, rowStep: 0.072, domeRows: 13, detail: 0.9 };
    const mesh = root.EnoHeadCore.buildMesh(meshOpts);
    const rend = root.EnoHeadCore.createRenderer(mesh, { size: 100, yOffset: -0.075, scale: 34 });

    let rotY = 0.95, rotX = 0.05, speed = opt.speed, rgb = hexToRgb(opt.color);
    let energy = 0, pulse = 0, kick = 0, dragging = false, lx = 0, ly = 0, analyser = null, buf = null, avgLow = 0, lastBeat = 0, raf = 0, last = performance.now();
    let needsResize = true, cachedDpr = Math.min(2, root.devicePixelRatio || 1), isVisible = true;

    if (typeof IntersectionObserver !== 'undefined') {
      try {
        new IntersectionObserver((entries) => {
          if (entries[0]) isVisible = entries[0].isIntersecting;
        }, { threshold: 0.01 }).observe(canvas);
      } catch (err) {}
    }
    root.addEventListener && root.addEventListener('resize', () => { needsResize = true; });
    root.addEventListener && root.addEventListener('orientationchange', () => { needsResize = true; });

    function resize() {
      if (!needsResize && canvas.width > 0) return cachedDpr;
      cssSize = canvas.clientWidth || opt.size || cssSize || 128;
      cachedDpr = Math.min(2, root.devicePixelRatio || 1);
      const px = Math.round(cssSize * cachedDpr);
      if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
      rend.o.size = cssSize; rend.o.scale = cssSize * 0.34;
      needsResize = false;
      return cachedDpr;
    }

    canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointerup', () => { dragging = false; });
    canvas.addEventListener('pointercancel', () => { dragging = false; });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      rotY += (e.clientX - lx) * 0.01; rotX = Math.max(-0.6, Math.min(0.6, rotX + (e.clientY - ly) * 0.006)); lx = e.clientX; ly = e.clientY;
    });

    function pollAnalyser(now) {
      if (!analyser || (typeof isPlaying !== 'undefined' && !isPlaying)) {
        energy *= 0.85;
        return;
      }
      if (!buf || buf.length !== analyser.frequencyBinCount) buf = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(buf);
      let low = 0, all = 0; const nLow = Math.max(3, Math.floor(buf.length * 0.06));
      for (let i = 0; i < buf.length; i++) { all += buf[i]; if (i < nLow) low += buf[i]; }
      low /= nLow * 255; all /= buf.length * 255;
      energy = energy * 0.85 + Math.min(1, all * 3.2) * 0.15;
      if (low > avgLow * 1.35 + 0.05 && now - lastBeat > 140) { beat(Math.min(1, low * 1.4)); lastBeat = now; }
      avgLow = avgLow * 0.93 + low * 0.07;
    }

    function beat(s) { pulse = Math.max(pulse, s == null ? 1 : s); kick += 0.05 * (s == null ? 1 : s); }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !isVisible) { last = now; return; }
      if (!dragging && (now - last) < 31) return; // Smooth ~30fps cap for 3D software z-buffer
      const dt = Math.min(0.06, (now - last) / 1000); last = now;
      pollAnalyser(now);
      const dpr = resize();
      if (!dragging) { rotY += (speed * (0.6 + energy * 2.2) + kick * 6) * dt * 2.2; }
      kick *= Math.pow(0.02, dt); pulse *= Math.pow(0.002, dt);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(2,4,2,' + (0.55 - 0.15 * pulse).toFixed(3) + ')';
      ctx.fillRect(0, 0, cssSize, cssSize);

      const res = rend.draw({ rotY, rotX: rotX + Math.sin(now / 2600) * 0.03, pulse });
      const col = (a) => 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
      const trace = (list) => { ctx.beginPath(); for (let i = 0; i < list.length; i++) { const e = res.edges[list[i]]; ctx.moveTo(res.SX[e[0]], res.SY[e[0]]); ctx.lineTo(res.SX[e[1]], res.SY[e[1]]); } ctx.stroke(); };
      const lw = cssSize / 340, flare = 0.55 + 0.25 * energy + 0.35 * pulse;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = col(0.035 + 0.04 * flare); ctx.lineWidth = 2.6 * lw; trace(res.visible);
      ctx.strokeStyle = col(0.10 + 0.10 * flare); ctx.lineWidth = 4.2 * lw; trace(res.rim);
      ctx.strokeStyle = col(Math.min(1, 0.38 * flare + 0.22)); ctx.lineWidth = 0.7 * lw; trace(res.visible);
      ctx.strokeStyle = col(0.95); ctx.lineWidth = 1.3 * lw; trace(res.rim);
      ctx.globalCompositeOperation = 'source-over';
    }
    raf = requestAnimationFrame(frame);

    return {
      setEnergy(e) { energy = Math.max(0, Math.min(1, e)); },
      beat,
      attachAnalyser(node) { analyser = node; },
      setColor(c) { opt.color = c; rgb = hexToRgb(c); },
      setSpeed(s) { speed = s; },
      requestResize() { needsResize = true; },
      destroy() { cancelAnimationFrame(raf); }
    };
  }
  root.EnoHead = { mount };
})(typeof window !== 'undefined' ? window : globalThis);

const ENO_PHOSPHORS = [
  { name: "SLAM · Y",  color: "#fed330" },
  { name: "SLAM · G",  color: "#2ed573" },
  { name: "SLAM · P",  color: "#a855f7" },
  { name: "SLAM · W",  color: "#ffffff" },
];
let enoPhosIndex = 0;
let enoHeadController = null;
{
  const enoCanvasEl = document.getElementById("enoWidgetCanvas");
  if (enoCanvasEl) {
    const enoEngine = (typeof EnoHead !== "undefined") ? EnoHead : (typeof window !== "undefined" && window.EnoHead ? window.EnoHead : null);
    if (enoEngine) enoHeadController = enoEngine.mount(enoCanvasEl, { size: 128, color: ENO_PHOSPHORS[0].color, speed: 0.22, quality: 'low' });
    updateHeaderEnoGlow(ENO_PHOSPHORS[enoPhosIndex].color);
    if (typeof masterAnalyser !== "undefined" && masterAnalyser) enoHeadController.attachAnalyser(masterAnalyser);
  }
}

function updateHeaderEnoGlow(colorHex) {
  const rootEl = document.documentElement;
  let r = 254, g = 211, b = 48;
  if (colorHex && colorHex.startsWith("#") && colorHex.length === 7) {
    r = parseInt(colorHex.slice(1, 3), 16);
    g = parseInt(colorHex.slice(3, 5), 16);
    b = parseInt(colorHex.slice(5, 7), 16);
  }
  rootEl.style.setProperty("--eno-glow-border", `rgba(${r}, ${g}, ${b}, 0.65)`);
  rootEl.style.setProperty("--eno-glow-shadow", `0 0 16px rgba(${r}, ${g}, ${b}, 0.25), inset 0 0 1px rgba(${r}, ${g}, ${b}, 0.20)`);
  rootEl.style.setProperty("--eno-glow-border-soft", `rgba(${r}, ${g}, ${b}, 0.40)`);
}

function setEnoPhosphor(target) {
  let idx = -1;
  if (typeof target === "number") {
    idx = (target % ENO_PHOSPHORS.length + ENO_PHOSPHORS.length) % ENO_PHOSPHORS.length;
  } else if (typeof target === "string") {
    const s = target.trim().toLowerCase();
    idx = ENO_PHOSPHORS.findIndex(p => 
      p.name.toLowerCase() === s ||
      p.color.toLowerCase() === s ||
      p.name.toLowerCase().endsWith(s) ||
      p.name.toLowerCase().endsWith("· " + s) ||
      p.name.toLowerCase().endsWith(" " + s)
    );
  }
  if (idx < 0) idx = 0;
  enoPhosIndex = idx;
  const p = ENO_PHOSPHORS[enoPhosIndex];
  const lbl = document.getElementById("lblEnoPhos");
  if (lbl) {
    lbl.textContent = p.name;
    lbl.style.color = p.color;
  }
  if (enoHeadController) enoHeadController.setColor(p.color);
  updateHeaderEnoGlow(p.color);
}

function toggleEnoPhosphor() {
  setEnoPhosphor((enoPhosIndex + 1) % ENO_PHOSPHORS.length);
}


let isSyncingEno = false;
function syncEnoPodSquare() {
  if (isSyncingEno) return;
  const pod = document.querySelector(".eno-standalone-pod");
  if (!pod) return;

  // Phone portrait (<= 640px) or phone landscape (<= 500px tall):
  // Let CSS rules handle the layout directly, do not apply square desktop dimensions.
  if (window.matchMedia && (window.matchMedia("(max-width: 640px)").matches || window.matchMedia("(max-height: 500px)").matches)) {
    pod.style.width = "";
    pod.style.height = "";
    pod.style.flex = "";
    return;
  }

  const topBar = document.querySelector("header.top-bar");
  const masterVol = document.querySelector(".master-vol-pod");
  if (!topBar) return;

  isSyncingEno = true;
  try {
    // Measure unzoomed CSS layout height via offsetHeight (NEVER getBoundingClientRect which is scaled by CSS zoom: 0.75)
    const h1 = topBar.offsetHeight || 0;
    const h2 = masterVol ? masterVol.offsetHeight : 0;
    const h = Math.max(h1, h2);

    if (h > 0) {
      pod.style.width = h + "px";
      pod.style.height = h + "px";
      pod.style.flex = "0 0 " + h + "px";
    }
  } finally {
    isSyncingEno = false;
  }
}
window.addEventListener("load", syncEnoPodSquare);
window.addEventListener("resize", syncEnoPodSquare);
if (typeof ResizeObserver !== "undefined") {
  const topBarEl = document.querySelector("header.top-bar");
  const masterVolEl = document.querySelector(".master-vol-pod");
  const ro = new ResizeObserver(() => syncEnoPodSquare());
  if (topBarEl) ro.observe(topBarEl);
  if (masterVolEl) ro.observe(masterVolEl);
}
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", syncEnoPodSquare);
} else {
  syncEnoPodSquare();
}
