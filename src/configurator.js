/*
 * Kozijnsamensteller AK Kozijntechniek.
 * Stappen (type, maten, kleur, overzicht) met een 3D-voorbeeld en een
 * aanvraaglijst die via WhatsApp wordt verstuurd.
 * Bron voor assets/configurator.js (gebundeld met esbuild, zie README).
 */
import * as THREE from 'three';

const PHONE = '31639282968';

const TYPES = {
  raam: { name: 'Raam', sub: 'Vast of draai-kiep, 1 tot 3 vakken', w: [400, 3000, 1200], h: [400, 2400, 1400], modes: ['dicht', 'kiep', 'open'] },
  deuren: { name: 'Tuindeuren', sub: 'Dubbel openslaand', w: [1200, 2400, 1600], h: [1900, 2500, 2150], modes: ['dicht', 'open'] },
  voordeur: { name: 'Voor- of achterdeur', sub: 'Enkele deur met glasstrook', w: [800, 1100, 950], h: [1900, 2400, 2150], modes: ['dicht', 'open'] },
  schuifpui: { name: 'Schuifpui', sub: 'Eén vast deel, één schuivend', w: [1800, 5000, 3000], h: [1900, 2500, 2200], modes: ['dicht', 'open'] }
};
const COLORS = [
  { id: 'antraciet', name: 'Antracietgrijs', code: 'RAL 7016', hex: '#383E42' },
  { id: 'zwart', name: 'Gitzwart', code: 'RAL 9005', hex: '#0E0E10' },
  { id: 'kwarts', name: 'Kwartsgrijs', code: 'RAL 7039', hex: '#6C6960' },
  { id: 'creme', name: 'Crèmewit', code: 'RAL 9001', hex: '#E9E0D2' },
  { id: 'wit', name: 'Verkeerswit', code: 'RAL 9016', hex: '#F4F6F4' },
  { id: 'eiken', name: 'Eiken houtnerf', code: 'houtlook', hex: '#8A5E3C' }
];
const INSIDE = [{ id: 'wit', name: 'Wit' }, { id: 'gelijk', name: 'Gelijk aan buiten' }];
const GLASS = [{ id: 'hr', name: 'HR++ glas' }, { id: 'triple', name: 'Triple glas' }];
const WALLS = [{ id: 'baksteen', name: 'Baksteen' }, { id: 'stuc', name: 'Wit stucwerk' }, { id: 'donker', name: 'Donkere gevel' }];
const MODE_NAMES = { dicht: 'Dicht', kiep: 'Kiepstand', open: 'Open' };
const VAK_NAMES = { vast: 'Vast glas', dk: 'Draai-kiep' };
const STEPS = ['Type', 'Maten', 'Kleur', 'Overzicht'];

const byId = (list, id) => list.find((x) => x.id === id) || list[0];
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const state = {
  step: 0, type: 'raam', w: 1200, h: 1400, vakken: ['vast', 'dk'], qty: 1,
  out: 'antraciet', inn: 'wit', glas: 'hr', wall: 'baksteen',
  mode: 'dicht', view: 'buiten', items: [], touched: true
};

/* ------------------------------------------------------------------ */
/* Omschrijvingen                                                      */
/* ------------------------------------------------------------------ */

function describe(it) {
  const t = TYPES[it.type];
  const col = byId(COLORS, it.out);
  let s = `${t.name} ${it.w} × ${it.h} mm`;
  if (it.type === 'raam') {
    s += it.vakken.length === 1 ? `, 1 vak (${VAK_NAMES[it.vakken[0]].toLowerCase()})`
      : `, ${it.vakken.length} vakken (${it.vakken.map((v) => VAK_NAMES[v].toLowerCase()).join(' + ')})`;
  }
  s += `, buiten ${col.name} (${col.code})`;
  s += it.inn === 'wit' ? ', binnen wit' : ', binnen gelijk aan buiten';
  s += `, ${byId(GLASS, it.glas).name}`;
  return s;
}

function snapshot() {
  return { type: state.type, w: state.w, h: state.h, vakken: state.vakken.slice(), qty: state.qty, out: state.out, inn: state.inn, glas: state.glas };
}

function requestItems() {
  return state.touched || !state.items.length ? state.items.concat([snapshot()]) : state.items;
}

function whatsappUrl() {
  const items = requestItems();
  const lines = ['Hallo AK Kozijntechniek, ik wil graag een offerte voor:'];
  items.forEach((it, i) => lines.push(`${i + 1}. ${it.qty}x ${describe(it)}`));
  return 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
}

/* ------------------------------------------------------------------ */
/* 3D-voorbeeld                                                        */
/* ------------------------------------------------------------------ */

function makeViewer(stage, canvas, dimW, dimH) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a94, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.5);
  sun.position.set(-3, 5, 6);
  scene.add(sun);
  const inLight = new THREE.DirectionalLight(0xffe2c0, 0.9);
  inLight.position.set(3, 4, -6);
  scene.add(inLight);

  /* texturen uit een canvas: geen losse afbeeldingen nodig */
  const tex = (w, h, draw, rx, ry) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (rx) t.repeat.set(rx, ry);
    t.anisotropy = 4;
    return t;
  };
  const brick = tex(256, 126, (g, w, h) => {
    g.fillStyle = '#B9B0A2'; g.fillRect(0, 0, w, h);
    const tones = ['#8E5140', '#874A3A', '#96584A', '#7F4636', '#8B4F3D'];
    for (let r = 0; r < 6; r++) {
      const off = r % 2 ? 32 : 0;
      for (let c = -1; c < 5; c++) {
        g.fillStyle = tones[(r * 3 + c + 7) % tones.length];
        g.fillRect(c * 64 + off + 2, r * 21 + 2, 60, 17);
      }
    }
  }, 1 / 0.88, 1 / 0.42);
  const boards = tex(128, 64, (g, w, h) => {
    g.fillStyle = '#2B2F33'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1B1E21'; g.fillRect(0, 0, 4, h);
    g.fillStyle = 'rgba(255,255,255,0.04)'; g.fillRect(40, 0, 1, h); g.fillRect(90, 0, 1, h);
  }, 1 / 0.19, 1);
  const glassTex = tex(256, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#DCEAF0'); gr.addColorStop(0.5, '#9DB9C6'); gr.addColorStop(1, '#C6D9E1');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.translate(w / 2, h / 2); g.rotate(-0.5);
    g.fillStyle = 'rgba(255,255,255,0.45)'; g.fillRect(-w * 0.32, -h, w * 0.16, h * 2);
    g.fillStyle = 'rgba(255,255,255,0.28)'; g.fillRect(-w * 0.08, -h, w * 0.05, h * 2);
    g.restore();
  });
  glassTex.wrapS = glassTex.wrapT = THREE.ClampToEdgeWrapping;
  const sky = tex(8, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#9CC3E4'); gr.addColorStop(0.55, '#DCEBF2'); gr.addColorStop(0.56, '#7FA06A'); gr.addColorStop(1, '#5E8250');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  sky.wrapS = sky.wrapT = THREE.ClampToEdgeWrapping;

  const mat = {
    out: new THREE.MeshStandardMaterial({ color: '#383E42', roughness: 0.55, metalness: 0.05 }),
    inn: new THREE.MeshStandardMaterial({ color: '#F4F6F4', roughness: 0.55, metalness: 0.05 }),
    glass: new THREE.MeshStandardMaterial({ map: glassTex, transparent: true, opacity: 0.42, roughness: 0.08, metalness: 0.1, side: THREE.DoubleSide, depthWrite: false }),
    handle: new THREE.MeshStandardMaterial({ color: '#C9CED2', roughness: 0.3, metalness: 0.8 }),
    wall: new THREE.MeshStandardMaterial({ map: brick, roughness: 0.95 }),
    inWall: new THREE.MeshStandardMaterial({ color: '#EFEDE8', roughness: 0.95, side: THREE.DoubleSide }),
    ground: new THREE.MeshStandardMaterial({ color: '#A9A9A2', roughness: 1 }),
    floor: new THREE.MeshStandardMaterial({ color: '#7A6046', roughness: 0.8 }),
    line: new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
  };
  const frameMats = [mat.out, mat.out, mat.out, mat.out, mat.out, mat.inn];

  const far = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), new THREE.MeshBasicMaterial({ map: sky }));
  far.position.set(0, 12, 40); far.rotation.y = Math.PI; scene.add(far);
  const room = new THREE.Mesh(new THREE.PlaneGeometry(240, 120), new THREE.MeshBasicMaterial({ color: '#4A4038' }));
  room.position.set(0, 0, -40); scene.add(room);

  let model = null;
  let parts = [];
  let size = { w: 1.2, h: 1.4 };
  const anim = { open: 0, kiep: 0, tOpen: 0, tKiep: 0 };
  const cam = { yaw: 0.55, pitch: 0.08, tYaw: 0.38, tPitch: 0.08, flip: 0, tFlip: 0 };
  let dirty = true;

  const box = (w, h, d, m, x, y, z, parent) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  /* rechthoekig kader van vier balken, gecentreerd op (cx, cy) */
  const rectFrame = (parent, cx, cy, w, h, face, depth, z, bottomFace) => {
    const bf = bottomFace || face;
    box(w, face, depth, frameMats, cx, cy + h / 2 - face / 2, z, parent);
    box(w, bf, depth, frameMats, cx, cy - h / 2 + bf / 2, z, parent);
    box(face, h - face - bf, depth, frameMats, cx - w / 2 + face / 2, cy + (bf - face) / 2, z, parent);
    box(face, h - face - bf, depth, frameMats, cx + w / 2 - face / 2, cy + (bf - face) / 2, z, parent);
  };
  const pane = (parent, cx, cy, w, h, z) => {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat.glass);
    g.position.set(cx, cy, z);
    parent.add(g);
  };
  const handle = (parent, x, y, z, long) => {
    box(0.028, long ? 0.5 : 0.13, 0.03, mat.handle, x, y, z, parent);
  };

  /* draaiend deel: scharniert om de verticale rand en kiept om de onderrand */
  const leaf = (parent, x0, x1, y0, y1, opts) => {
    const hingeLeft = opts.hinge === 'left';
    const gH = new THREE.Group();
    gH.position.set(hingeLeft ? x0 : x1, y0, opts.z || 0);
    const gT = new THREE.Group();
    gH.add(gT); parent.add(gH);
    const w = x1 - x0, h = y1 - y0;
    const cx = hingeLeft ? w / 2 : -w / 2;
    const face = opts.face || 0.062;
    const bottom = opts.bottom || face;
    if (opts.solid) {
      box(w, h, 0.07, frameMats, cx, h / 2, 0, gT);
      const gw = Math.min(0.2, w * 0.24);
      const gx = cx + (hingeLeft ? -1 : 1) * (w * 0.5 - 0.16 - gw / 2);
      box(gw + 0.03, h * 0.72 + 0.03, 0.074, frameMats, gx, h * 0.55, 0, gT);
      const g1 = new THREE.Mesh(new THREE.PlaneGeometry(gw, h * 0.72), mat.glass);
      g1.position.set(gx, h * 0.55, 0.0385); gT.add(g1);
      const g2 = g1.clone(); g2.position.z = -0.0385; gT.add(g2);
    } else {
      rectFrame(gT, cx, h / 2, w, h, face, 0.078, 0, bottom);
      pane(gT, cx, (h + bottom - face) / 2, w - 2 * face + 0.01, h - face - bottom + 0.01, 0);
    }
    const hx = cx + (hingeLeft ? 1 : -1) * (w / 2 - face / 2);
    const hy = opts.handleY != null ? opts.handleY : h / 2;
    if (opts.handleIn !== false) handle(gT, hx, hy, -0.058, false);
    if (opts.handleOut) handle(gT, hx, hy, 0.058, opts.solid);
    parts.push({ gH, gT, sign: hingeLeft ? 1 : -1, dir: opts.dir || 1, tilt: !!opts.tilt, max: opts.max || 1.15 });
  };

  function build(cfg) {
    if (model) {
      model.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      scene.remove(model);
    }
    parts = [];
    model = new THREE.Group();
    const W = cfg.w / 1000, H = cfg.h / 1000;
    size = { w: W, h: H };
    const door = cfg.type !== 'raam';
    const FR = 0.07, FD = 0.12, y0 = -H / 2;

    /* gevel met sparing; de UV's van de vorm lopen in meters */
    const shape = new THREE.Shape();
    shape.moveTo(-30, -30); shape.lineTo(30, -30); shape.lineTo(30, 30); shape.lineTo(-30, 30); shape.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-W / 2, y0); hole.lineTo(-W / 2, H / 2); hole.lineTo(W / 2, H / 2); hole.lineTo(W / 2, y0); hole.closePath();
    shape.holes.push(hole);
    const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false }), mat.wall);
    wall.position.z = -0.15;
    model.add(wall);
    const lining = new THREE.Mesh(new THREE.ShapeGeometry(shape), mat.inWall);
    lining.position.z = -0.152;
    model.add(lining);
    if (door) {
      const terrace = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat.ground);
      terrace.rotation.x = -Math.PI / 2; terrace.position.set(0, y0 - 0.02, 20.15); model.add(terrace);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat.floor);
      floor.rotation.x = -Math.PI / 2; floor.position.set(0, y0 - 0.02, -20.15); model.add(floor);
    } else {
      box(W + 0.08, 0.03, 0.2, frameMats, 0, y0 - 0.012, 0.13, model).rotation.x = 0.12;
      box(W + 0.1, 0.035, 0.22, mat.inWall, 0, y0 - 0.017, -0.2, model);
    }

    /* buitenkozijn */
    rectFrame(model, 0, 0, W, H, FR, FD, 0, door ? 0.03 : FR);
    const bot = door ? 0.03 : FR;
    const ix0 = -W / 2 + FR, ix1 = W / 2 - FR, iy0 = y0 + bot, iy1 = H / 2 - FR;

    if (cfg.type === 'raam') {
      const n = cfg.vakken.length, M = 0.07;
      const vw = (ix1 - ix0 - (n - 1) * M) / n;
      cfg.vakken.forEach((kind, i) => {
        const a = ix0 + i * (vw + M), b = a + vw;
        if (i > 0) box(M, iy1 - iy0, FD, frameMats, a - M / 2, (iy0 + iy1) / 2, 0, model);
        if (kind === 'dk') {
          leaf(model, a - 0.012, b + 0.012, iy0 - 0.012, iy1 + 0.012, { hinge: i === 0 && n > 1 ? 'left' : i === n - 1 ? 'right' : 'left', z: -0.03, tilt: true, dir: 1 });
        } else {
          rectFrame(model, (a + b) / 2, (iy0 + iy1) / 2, vw, iy1 - iy0, 0.022, 0.05, 0);
          pane(model, (a + b) / 2, (iy0 + iy1) / 2, vw - 0.03, iy1 - iy0 - 0.03, 0);
        }
      });
    } else if (cfg.type === 'deuren') {
      const mid = 0;
      leaf(model, ix0, mid, iy0, iy1, { hinge: 'left', face: 0.085, bottom: 0.16, dir: -1, handleOut: true, handleY: 1.05, max: 1.35 });
      leaf(model, mid, ix1, iy0, iy1, { hinge: 'right', face: 0.085, bottom: 0.16, dir: -1, handleOut: true, handleY: 1.05, max: 1.35 });
    } else if (cfg.type === 'voordeur') {
      leaf(model, ix0, ix1, iy0, iy1, { hinge: 'left', solid: true, dir: 1, handleOut: true, handleY: 1.05, max: 1.2 });
    } else {
      const half = (ix1 - ix0) / 2 + 0.04;
      const h = iy1 - iy0, cy = (iy0 + iy1) / 2;
      const fixed = new THREE.Group(); model.add(fixed);
      rectFrame(fixed, ix0 + half / 2, cy, half, h, 0.075, 0.05, 0.03, 0.09);
      pane(fixed, ix0 + half / 2, cy, half - 0.14, h - 0.16, 0.03);
      const slide = new THREE.Group(); model.add(slide);
      rectFrame(slide, ix1 - half / 2, cy, half, h, 0.075, 0.05, -0.03, 0.09);
      pane(slide, ix1 - half / 2, cy, half - 0.14, h - 0.16, -0.03);
      handle(slide, ix1 - half + 0.0375, y0 + 1.05, -0.07, true);
      handle(slide, ix1 - half + 0.0375, y0 + 1.05, 0.01, true);
      parts.push({ slide, dx: -(half - 0.16) });
    }

    /* maatlijnen */
    const lw = 0.012, off = 0.22;
    box(W, lw, lw, mat.line, 0, y0 - off, 0.2, model);
    box(lw, 0.09, lw, mat.line, -W / 2, y0 - off, 0.2, model);
    box(lw, 0.09, lw, mat.line, W / 2, y0 - off, 0.2, model);
    box(lw, H, lw, mat.line, -W / 2 - off, 0, 0.2, model);
    box(0.09, lw, lw, mat.line, -W / 2 - off, y0, 0.2, model);
    box(0.09, lw, lw, mat.line, -W / 2 - off, H / 2, 0.2, model);

    scene.add(model);
    applyPose();
    dirty = true;
  }

  function applyPose() {
    parts.forEach((p) => {
      if (p.slide) { p.slide.position.x = p.dx * anim.open; return; }
      p.gH.rotation.y = p.sign * p.dir * p.max * anim.open;
      p.gT.rotation.x = p.tilt ? -0.2 * anim.kiep : 0;
    });
  }

  function setColors(outHex, innHex, wallId) {
    mat.out.color.set(outHex);
    mat.inn.color.set(innHex);
    const light = new THREE.Color(outHex).getHSL({}).l > 0.6;
    mat.handle.color.set(light ? '#3A3F44' : '#C9CED2');
    mat.wall.map = wallId === 'baksteen' ? brick : wallId === 'donker' ? boards : null;
    mat.wall.color.set(wallId === 'stuc' ? '#ECEAE4' : '#FFFFFF');
    mat.wall.needsUpdate = true;
    mat.line.color.set(wallId === 'stuc' ? '#101315' : '#FFFFFF');
    dirty = true;
  }

  function setMode(mode) {
    anim.tOpen = mode === 'open' ? 1 : 0;
    anim.tKiep = mode === 'kiep' ? 1 : 0;
    dirty = true;
  }
  function setView(view) { cam.tFlip = view === 'binnen' ? 1 : 0; dirty = true; }

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dirty = true;
  }

  const v = new THREE.Vector3();
  function place(el, x, y, z) {
    v.set(x, y, z).project(camera);
    const w = stage.clientWidth, h = stage.clientHeight;
    el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2 * w).toFixed(1)}px, ${((1 - v.y) / 2 * h).toFixed(1)}px)`;
    el.style.visibility = v.z < 1 && cam.flip < 0.5 ? 'visible' : 'hidden';
  }

  function frame() {
    const ease = (cur, tgt, k) => (Math.abs(tgt - cur) < 0.001 ? tgt : cur + (tgt - cur) * k);
    const before = [anim.open, anim.kiep, cam.yaw, cam.pitch, cam.flip];
    /* eerst terug naar dicht voordat de andere beweging begint */
    anim.kiep = ease(anim.kiep, anim.open > 0.02 ? 0 : anim.tKiep, 0.14);
    anim.open = ease(anim.open, anim.kiep > 0.02 ? 0 : anim.tOpen, 0.1);
    cam.yaw = ease(cam.yaw, cam.tYaw, 0.18);
    cam.pitch = ease(cam.pitch, cam.tPitch, 0.18);
    cam.flip = ease(cam.flip, cam.tFlip, 0.09);
    const moving = before.some((b, i) => b !== [anim.open, anim.kiep, cam.yaw, cam.pitch, cam.flip][i]);
    if (moving || dirty) {
      dirty = false;
      applyPose();
      const hh = Math.max(size.h / 2 + 0.62, (size.w / 2 + 0.55) / camera.aspect);
      const dist = hh / Math.tan((camera.fov * Math.PI) / 360) + 0.4;
      const yaw = cam.yaw + cam.flip * Math.PI;
      camera.position.set(Math.sin(yaw) * Math.cos(cam.pitch) * dist, Math.sin(cam.pitch) * dist - 0.17, Math.cos(yaw) * Math.cos(cam.pitch) * dist);
      camera.lookAt(0, -0.17, 0);
      renderer.render(scene, camera);
      place(dimW, 0, -size.h / 2 - 0.22, 0.2);
      place(dimH, -size.w / 2 - 0.22, 0, 0.2);
    }
    requestAnimationFrame(frame);
  }

  /* slepen om te draaien; verticaal vegen blijft de pagina scrollen */
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: cam.tYaw, pitch: cam.tPitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    cam.tYaw = Math.max(-1.15, Math.min(1.15, drag.yaw - (e.clientX - drag.x) * 0.008));
    cam.tPitch = Math.max(-0.12, Math.min(0.32, drag.pitch + (e.clientY - drag.y) * 0.004));
  });
  const end = () => { drag = null; };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  new ResizeObserver(resize).observe(stage);
  resize();
  requestAnimationFrame(frame);
  return { build, setColors, setMode, setView };
}

/* ------------------------------------------------------------------ */
/* Bediening                                                           */
/* ------------------------------------------------------------------ */

export function init(root) {
  const stage = root.querySelector('[data-cfg-stage]');
  const side = root.querySelector('[data-cfg-side]');
  const modesEl = root.querySelector('[data-cfg-modes]');
  const viewEl = root.querySelector('[data-cfg-views]');
  const dimW = root.querySelector('[data-cfg-dimw]');
  const dimH = root.querySelector('[data-cfg-dimh]');
  const viewer = makeViewer(stage, root.querySelector('[data-cfg-canvas]'), dimW, dimH);
  if (!viewer) {
    stage.classList.add('cfg-no3d');
    root.querySelector('[data-cfg-fallback]').hidden = false;
  }
  root.classList.add('cfg-ready');

  const pill = (act, val, label, on, extra) =>
    `<button type="button" class="cfg-pill${on ? ' is-on' : ''}" data-act="${act}" data-val="${esc(val)}" aria-pressed="${on}"${extra || ''}>${esc(label)}</button>`;

  const slider = (key, label) => {
    const [min, max] = TYPES[state.type][key];
    return `<div class="cfg-field"><div class="cfg-row"><label for="cfg-${key}">${label}</label><output data-out="${key}">${state[key]} mm</output></div>
<input id="cfg-${key}" class="cfg-range" type="range" min="${min}" max="${max}" step="50" value="${state[key]}" data-range="${key}">
<div class="cfg-row cfg-minmax"><span>${min} mm</span><span>${max} mm</span></div></div>`;
  };

  function panel() {
    if (state.step === 0) {
      return `<p class="cfg-q">Wat wilt u laten plaatsen?</p><div class="cfg-types">` + Object.keys(TYPES).map((id) => {
        const t = TYPES[id], on = id === state.type;
        return `<button type="button" class="cfg-type${on ? ' is-on' : ''}" data-act="type" data-val="${id}" aria-pressed="${on}"><span class="cfg-type-name">${t.name}</span><span class="cfg-type-sub">${t.sub}</span></button>`;
      }).join('') + `</div>`;
    }
    if (state.step === 1) {
      let h = `<p class="cfg-q">Hoe groot ongeveer? Wij meten later exact in.</p>` + slider('w', 'Breedte') + slider('h', 'Hoogte');
      if (state.type === 'raam') {
        h += `<div class="cfg-field"><div class="cfg-label">Indeling</div><div class="cfg-pills">` +
          [1, 2, 3].map((n) => pill('vakken', n, n === 1 ? '1 vak' : n + ' vakken', state.vakken.length === n)).join('') + `</div>
<div class="cfg-vakken">` + state.vakken.map((v, i) =>
          `<button type="button" class="cfg-vak" data-act="vak" data-val="${i}"><span>Vak ${i + 1}</span><strong>${VAK_NAMES[v]}</strong><span class="cfg-vak-hint">tik om te wisselen</span></button>`).join('') + `</div></div>`;
      }
      h += `<div class="cfg-field"><div class="cfg-label">Aantal van dit kozijn</div><div class="cfg-stepper">
<button type="button" data-act="qty" data-val="-1" aria-label="Eén minder">−</button><output>${state.qty}</output><button type="button" data-act="qty" data-val="1" aria-label="Eén meer">+</button></div></div>`;
      return h;
    }
    if (state.step === 2) {
      const col = byId(COLORS, state.out);
      return `<div class="cfg-field"><div class="cfg-row"><span class="cfg-label">Kleur buiten</span><span><strong>${col.name}</strong> · ${col.code}</span></div><div class="cfg-swatches">` +
        COLORS.map((c) => `<button type="button" class="cfg-swatch${c.id === state.out ? ' is-on' : ''}" style="background:${c.hex}" data-act="out" data-val="${c.id}" aria-pressed="${c.id === state.out}" aria-label="${c.name}"></button>`).join('') + `</div></div>
<div class="cfg-field"><div class="cfg-label">Kleur binnen</div><div class="cfg-pills">` + INSIDE.map((x) => pill('inn', x.id, x.name, x.id === state.inn)).join('') + `</div></div>
<div class="cfg-field"><div class="cfg-label">Glas</div><div class="cfg-pills">` + GLASS.map((x) => pill('glas', x.id, x.name, x.id === state.glas)).join('') + `</div></div>
<div class="cfg-field"><div class="cfg-label">Uw gevel (alleen voor het voorbeeld)</div><div class="cfg-pills">` + WALLS.map((x) => pill('wall', x.id, x.name, x.id === state.wall)).join('') + `</div></div>`;
    }
    const showCurrent = state.touched || !state.items.length;
    const total = requestItems().reduce((n, it) => n + it.qty, 0);
    const list = state.items.length
      ? `<div class="cfg-label">Al op mijn aanvraag</div><ul class="cfg-list">` + state.items.map((it, i) => `<li><span><strong>${it.qty}x</strong> ${esc(describe(it))}</span><button type="button" data-act="remove" data-val="${i}" aria-label="Verwijder regel ${i + 1}">×</button></li>`).join('') + `</ul>`
      : '';
    const current = showCurrent
      ? `<div class="cfg-current"><div class="cfg-label">Dit kozijn</div><p><strong>${state.qty}x</strong> ${esc(describe(snapshot()))}</p>
<button type="button" class="cfg-add" data-act="add">+ Nog een kozijn toevoegen aan deze aanvraag</button></div>`
      : `<button type="button" class="cfg-add" data-act="step" data-val="0">+ Nog een kozijn samenstellen</button>`;
    return `${current}${list}
<a class="cfg-send" href="${whatsappUrl()}" target="_blank" rel="noopener"><img src="assets/whatsapp/whatsapp-glyph-wit.svg" alt="" width="22" height="22">Verstuur aanvraag via WhatsApp (${total} ${total === 1 ? 'kozijn' : 'kozijnen'})</a>
<p class="cfg-note">WhatsApp opent met de volledige omschrijving. U tikt alleen nog op verzenden.</p>`;
  }

  function render(full) {
    const steps = `<ol class="cfg-steps">` + STEPS.map((s, i) =>
      `<li><button type="button" class="${i === state.step ? 'is-on' : i < state.step ? 'is-done' : ''}" data-act="step" data-val="${i}"${i === state.step ? ' aria-current="step"' : ''}><span>${i + 1}</span>${s}</button></li>`).join('') + `</ol>`;
    const nav = `<div class="cfg-nav">${state.step > 0 ? `<button type="button" class="cfg-prev" data-act="step" data-val="${state.step - 1}">Vorige</button>` : '<span></span>'}
${state.step < 3 ? `<button type="button" class="cfg-next" data-act="step" data-val="${state.step + 1}">Volgende: ${STEPS[state.step + 1].toLowerCase()}</button>` : ''}</div>`;
    side.innerHTML = steps + `<div class="cfg-body">` + panel() + `</div>` + nav;

    const modes = TYPES[state.type].modes.filter((m) => m !== 'kiep' || state.vakken.includes('dk'));
    const canOpen = state.type !== 'raam' || state.vakken.includes('dk');
    if (!canOpen || !modes.includes(state.mode)) state.mode = 'dicht';
    modesEl.innerHTML = canOpen ? modes.map((m) => pill('mode', m, MODE_NAMES[m], m === state.mode)).join('') : '';
    viewEl.innerHTML = pill('view', 'buiten', 'Buiten', state.view === 'buiten') + pill('view', 'binnen', 'Binnen', state.view === 'binnen');
    dimW.textContent = state.w + ' mm';
    dimH.textContent = state.h + ' mm';
    if (viewer) {
      if (full) viewer.build(snapshot());
      const out = byId(COLORS, state.out).hex;
      viewer.setColors(out, state.inn === 'wit' ? '#F4F6F4' : out, state.wall);
      viewer.setMode(state.mode);
      viewer.setView(state.view);
    }
  }

  function setType(id) {
    const t = TYPES[id];
    state.type = id; state.w = t.w[2]; state.h = t.h[2]; state.mode = 'dicht';
    state.vakken = ['vast', 'dk'];
  }

  root.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-act]');
    if (!b || !root.contains(b)) return;
    const act = b.getAttribute('data-act'), val = b.getAttribute('data-val');
    let full = false;
    if (['type', 'vakken', 'vak', 'qty', 'out', 'inn', 'glas'].includes(act)) state.touched = true;
    if (act === 'step') state.step = Math.max(0, Math.min(3, +val));
    else if (act === 'type') { setType(val); full = true; }
    else if (act === 'vakken') {
      const n = +val;
      state.vakken = n === 1 ? ['dk'] : n === 2 ? ['vast', 'dk'] : ['dk', 'vast', 'dk'];
      full = true;
    } else if (act === 'vak') { state.vakken[+val] = state.vakken[+val] === 'dk' ? 'vast' : 'dk'; full = true; }
    else if (act === 'qty') state.qty = Math.max(1, Math.min(30, state.qty + +val));
    else if (act === 'out' || act === 'inn' || act === 'glas' || act === 'wall' || act === 'mode' || act === 'view') state[act] = val;
    else if (act === 'add') { state.items.push(snapshot()); state.step = 0; state.qty = 1; state.mode = 'dicht'; state.touched = false; }
    else if (act === 'remove') state.items.splice(+val, 1);
    render(full);
    if (act === 'step' || act === 'add') side.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });

  let pending = null;
  root.addEventListener('input', (ev) => {
    const r = ev.target.closest('[data-range]');
    if (!r) return;
    const key = r.getAttribute('data-range');
    state[key] = +r.value;
    state.touched = true;
    root.querySelector(`[data-out="${key}"]`).textContent = r.value + ' mm';
    (key === 'w' ? dimW : dimH).textContent = r.value + ' mm';
    if (viewer && !pending) pending = requestAnimationFrame(() => { pending = null; viewer.build(snapshot()); });
  });

  render(true);
}
