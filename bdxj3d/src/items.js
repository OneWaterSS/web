import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const M = (color, rough = 0.72, metal = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });

function add(group, geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  group.add(m);
  return m;
}

function keyTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#23202b'; g.fillRect(0, 0, 256, 96);
  g.fillStyle = '#3a3648';
  for (let y = 8; y < 88; y += 16) {
    for (let x = 8; x < 248; x += 16) {
      g.fillRect(x, y, 12, 11);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function flagTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 180;
  const g = c.getContext('2d');
  g.fillStyle = '#b8322f'; g.fillRect(0, 0, 256, 180);
  g.strokeStyle = '#f0c46a'; g.lineWidth = 6; g.strokeRect(8, 8, 240, 164);
  g.fillStyle = '#f7e6c8';
  g.font = '600 34px "Microsoft YaHei", sans-serif';
  g.textAlign = 'center';
  g.fillText('最佳男友', 128, 78);
  g.font = '400 20px "Microsoft YaHei", sans-serif';
  g.fillText('小 江 同 志', 128, 122);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const keyMat = new THREE.MeshStandardMaterial({ map: keyTexture(), roughness: 0.8 });
const flagMat = new THREE.MeshStandardMaterial({ map: flagTexture(), roughness: 0.8 });

function buildPencil() {
  const g = new THREE.Group();
  const body = add(g, new THREE.CylinderGeometry(0.019, 0.019, 0.46, 10), M(0xe8c15a, 0.55));
  body.rotation.z = Math.PI / 2;
  const wood = add(g, new THREE.ConeGeometry(0.019, 0.09, 10), M(0xd8b48a, 0.8));
  wood.rotation.z = -Math.PI / 2;
  wood.position.x = 0.275;
  const tip = add(g, new THREE.ConeGeometry(0.008, 0.035, 10), M(0x2b2532, 0.6));
  tip.rotation.z = -Math.PI / 2;
  tip.position.x = 0.327;
  return g;
}

function buildKeyboard() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.52, 0.035, 0.18), M(0x25222e, 0.85));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.155), keyMat);
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.019;
  g.add(top);
  return g;
}

function buildStapler() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.34, 0.05, 0.1), M(0x35313f, 0.6, 0.2), 0, -0.02, 0);
  const top = add(g, new THREE.BoxGeometry(0.3, 0.075, 0.085), M(0x8d95a3, 0.4, 0.55), -0.02, 0.045, 0);
  top.rotation.z = -0.1;
  add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), M(0x5a5f6a, 0.4, 0.6), 0.13, 0.03, 0);
  return g;
}

function buildFolder() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.36, 0.02, 0.28), M(0xd9a84e, 0.9));
  add(g, new THREE.BoxGeometry(0.09, 0.022, 0.07), M(0xc7953f, 0.9), -0.1, 0.002, -0.16);
  add(g, new THREE.BoxGeometry(0.3, 0.006, 0.22), M(0xf2e6cc, 0.95), 0, 0.014, 0);
  return g;
}

function buildMug() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.085, 0.075, 0.17, 18), M(0x8a574c, 0.7));
  const h = add(g, new THREE.TorusGeometry(0.055, 0.013, 8, 16), M(0x8a574c, 0.7), 0.1, 0, 0);
  h.rotation.y = Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.072, 0.072, 0.012, 18), M(0x3a2118, 0.4), 0, 0.085, 0);
  return g;
}

function buildPrinter() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.44, 0.2, 0.3), M(0xb9b4c4, 0.7));
  add(g, new THREE.BoxGeometry(0.38, 0.03, 0.22), M(0x2a2633, 0.8), 0, 0.115, 0);
  add(g, new THREE.BoxGeometry(0.26, 0.005, 0.18), M(0xf4eddd, 0.95), 0, 0.133, 0);
  add(g, new THREE.BoxGeometry(0.05, 0.02, 0.01), M(0x6fbf8b, 0.4), 0.15, 0.06, 0.152);
  return g;
}

function buildChair() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.46, 0.07, 0.42), M(0x6b4a34, 0.85), 0, 0, 0);
  add(g, new THREE.BoxGeometry(0.46, 0.5, 0.07), M(0x7a563d, 0.85), 0, 0.28, -0.18);
  add(g, new THREE.BoxGeometry(0.4, 0.04, 0.05), M(0x5a3d2a, 0.85), 0, 0.12, -0.18);
  add(g, new THREE.CylinderGeometry(0.035, 0.035, 0.18, 10), M(0x4a4f5a, 0.4, 0.6), 0, -0.12, 0);
  add(g, new THREE.CylinderGeometry(0.22, 0.24, 0.04, 16), M(0x3a3f4a, 0.5, 0.4), 0, -0.21, 0);
  return g;
}

function buildMonitor() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.54, 0.32, 0.045), M(0x191520, 0.5));
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.49, 0.27),
    new THREE.MeshStandardMaterial({ color: 0x243a4a, emissive: 0x7fb6d8, emissiveIntensity: 0.55 })
  );
  screen.position.z = 0.024;
  g.add(screen);
  add(g, new THREE.BoxGeometry(0.08, 0.16, 0.08), M(0x3a3644, 0.5, 0.3), 0, -0.23, 0);
  add(g, new THREE.BoxGeometry(0.3, 0.03, 0.18), M(0x3a3644, 0.5, 0.3), 0, -0.31, 0.02);
  return g;
}

function buildSlipper() {
  const g = new THREE.Group();
  const sole = add(g, new THREE.BoxGeometry(0.3, 0.06, 0.14), M(0xd96c4a, 0.8));
  sole.geometry.translate(0, 0, 0);
  const strap = add(g, new THREE.TorusGeometry(0.075, 0.018, 8, 16, Math.PI), M(0xf0b09a, 0.7), 0, 0.04, 0);
  strap.rotation.x = Math.PI / 2;
  return g;
}

function buildPillow() {
  const g = new THREE.Group();
  const p = add(g, new THREE.SphereGeometry(0.22, 18, 14), M(0xd69ab4, 0.95));
  p.scale.set(1, 0.8, 0.35);
  return g;
}

function buildPan() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.18, 0.17, 0.035, 24), M(0x8f939e, 0.35, 0.7));
  add(g, new THREE.CylinderGeometry(0.15, 0.15, 0.01, 24), M(0x3a3640, 0.7), 0, 0.023, 0);
  const handle = add(g, new THREE.CylinderGeometry(0.022, 0.026, 0.34, 10), M(0x3a2b26, 0.8), 0.34, 0.01, 0);
  handle.rotation.z = Math.PI / 2;
  return g;
}

function buildDurian() {
  const g = new THREE.Group();
  const core = add(g, new THREE.IcosahedronGeometry(0.19, 1), new THREE.MeshStandardMaterial({ color: 0x9a8a3e, roughness: 0.95, flatShading: true }));
  core.scale.set(1, 1.15, 1);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const c = add(g, new THREE.ConeGeometry(0.035, 0.09, 5), M(0x7f7132, 0.95));
    c.position.set(Math.cos(a) * 0.17, Math.sin(i * 1.7) * 0.12, Math.sin(a) * 0.17);
    c.rotation.z = -Math.cos(a) * 0.6;
    c.rotation.x = Math.sin(a) * 0.6;
  }
  return g;
}

function buildHanger() {
  const g = new THREE.Group();
  const mat = M(0xc9a0b8, 0.5, 0.2);
  const barL = add(g, new THREE.BoxGeometry(0.4, 0.018, 0.018), mat, 0, -0.1, 0);
  barL.rotation.z = 0.45;
  const barR = add(g, new THREE.BoxGeometry(0.4, 0.018, 0.018), mat, 0, -0.1, 0);
  barR.rotation.z = -0.45;
  const hook = add(g, new THREE.TorusGeometry(0.055, 0.012, 6, 12, Math.PI), mat, 0, 0.19, 0);
  hook.rotation.z = Math.PI;
  return g;
}

function buildMop() {
  const g = new THREE.Group();
  const stick = add(g, new THREE.CylinderGeometry(0.022, 0.022, 0.62, 8), M(0xb08e60, 0.8));
  stick.rotation.z = 0.15;
  const head = add(g, new THREE.BoxGeometry(0.26, 0.16, 0.12), M(0xcfc4a8, 0.95), -0.06, -0.32, 0);
  head.rotation.z = 0.15;
  return g;
}

function buildMilktea() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.08, 0.065, 0.24, 18), M(0xd9c3a0, 0.4));
  add(g, new THREE.CylinderGeometry(0.083, 0.083, 0.02, 18), M(0xf0e7d8, 0.6), 0, 0.12, 0);
  const straw = add(g, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 8), M(0xd96c4a, 0.5), 0.03, 0.22, 0);
  straw.rotation.z = -0.18;
  for (let i = 0; i < 5; i++) {
    add(g, new THREE.SphereGeometry(0.015, 8, 6), M(0x3a2418, 0.6), Math.cos(i * 1.3) * 0.03, -0.06 + (i % 2) * 0.04, Math.sin(i * 1.3) * 0.03);
  }
  return g;
}

function buildCake() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.24, 0.14, 0.2), M(0xf0d9b8, 0.9));
  add(g, new THREE.BoxGeometry(0.25, 0.03, 0.21), M(0xe8a8b8, 0.85), 0, 0.08, 0);
  add(g, new THREE.BoxGeometry(0.25, 0.035, 0.21), M(0x8a5a3a, 0.9), 0, -0.005, 0);
  add(g, new THREE.SphereGeometry(0.03, 10, 8), M(0xc94a4a, 0.5), 0.05, 0.11, 0.04);
  return g;
}

function buildEgg() {
  const g = new THREE.Group();
  const e = add(g, new THREE.SphereGeometry(0.1, 16, 14), M(0xf2e6c8, 0.55));
  e.scale.set(1, 1.3, 1);
  return g;
}

function buildWatermelon() {
  const g = new THREE.Group();
  const w = add(g, new THREE.SphereGeometry(0.2, 20, 16), M(0x3f7a44, 0.6));
  w.scale.set(1, 0.85, 1);
  for (let i = 0; i < 5; i++) {
    const stripe = add(g, new THREE.TorusGeometry(0.19, 0.008, 6, 24, Math.PI), M(0x2a5a2f, 0.7));
    stripe.rotation.y = (i / 5) * Math.PI;
    stripe.rotation.z = Math.PI / 2;
    stripe.scale.set(1, 0.85, 1);
  }
  return g;
}

function buildNoodle() {
  const g = new THREE.Group();
  add(g, new THREE.CylinderGeometry(0.095, 0.075, 0.2, 18), M(0xe0a15c, 0.7));
  add(g, new THREE.CylinderGeometry(0.098, 0.098, 0.02, 18), M(0xf4eddd, 0.8), 0, 0.1, 0);
  const wave = add(g, new THREE.TorusGeometry(0.06, 0.012, 6, 16, Math.PI * 1.4), M(0xf0d9a8, 0.8), 0, 0.14, 0);
  wave.rotation.x = Math.PI / 2;
  return g;
}

function buildRemote() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.09, 0.025, 0.28), M(0x2a2633, 0.8));
  add(g, new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12), M(0xc94a4a, 0.5), 0, 0.017, 0.09);
  for (let i = 0; i < 6; i++) {
    add(g, new THREE.BoxGeometry(0.02, 0.008, 0.02), M(0x6a6474, 0.7), -0.02 + (i % 2) * 0.04, 0.017, -0.02 - Math.floor(i / 2) * 0.03);
  }
  return g;
}

function buildSuona() {
  const g = new THREE.Group();
  const body = add(g, new THREE.CylinderGeometry(0.03, 0.045, 0.26, 10), M(0x7a4a2c, 0.6));
  body.rotation.z = Math.PI / 2;
  const bell = add(g, new THREE.ConeGeometry(0.11, 0.16, 14, 1, true), M(0xc9a24a, 0.35, 0.7), 0.2, 0, 0);
  bell.rotation.z = -Math.PI / 2;
  add(g, new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8), M(0xc9a24a, 0.4, 0.6), -0.2, 0, 0).rotation.z = Math.PI / 2;
  return g;
}

function buildSpeaker() {
  const g = new THREE.Group();
  add(g, new THREE.BoxGeometry(0.3, 0.4, 0.24), M(0x2b2833, 0.8));
  [0.09, -0.09].forEach(y => {
    add(g, new THREE.CylinderGeometry(0.075, 0.075, 0.025, 18), M(0x4a4754, 0.6), 0, y, 0.125).rotation.x = Math.PI / 2;
  });
  add(g, new THREE.BoxGeometry(0.22, 0.02, 0.02), M(0x6fbf8b, 0.5), 0, 0.18, 0.13);
  return g;
}

function buildFlag() {
  const g = new THREE.Group();
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.012), flagMat);
  cloth.castShadow = true;
  cloth.position.y = -0.02;
  g.add(cloth);
  const rod = add(g, new THREE.CylinderGeometry(0.014, 0.014, 0.62, 8), M(0xc9a24a, 0.4, 0.6), 0.27, 0.12, 0);
  rod.rotation.z = 0;
  return g;
}

function buildCat() {
  const g = new THREE.Group();
  const body = add(g, new THREE.SphereGeometry(0.15, 16, 14), M(0xd0a47c, 0.9));
  body.scale.set(1, 0.85, 1.2);
  const head = add(g, new THREE.SphereGeometry(0.13, 16, 14), M(0xd0a47c, 0.9), 0, 0.13, 0.13);
  [-1, 1].forEach(side => {
    const ear = add(g, new THREE.ConeGeometry(0.045, 0.09, 4), M(0xd0a47c, 0.9), side * 0.075, 0.23, 0.13);
    ear.rotation.z = side * 0.18;
    const eye = add(g, new THREE.SphereGeometry(0.018, 8, 8), M(0x2a2030, 0.4), side * 0.045, 0.14, 0.245);
  });
  const tail = add(g, new THREE.TorusGeometry(0.1, 0.018, 6, 16, Math.PI * 1.2), M(0xd0a47c, 0.9), 0, -0.02, -0.18);
  tail.rotation.y = Math.PI / 2;
  return g;
}

export const ITEMS = [
  { id: 'pencil', name: '铅笔', dmg: 7, mass: 0.3, color: '#E8C15A', shape: ['box', 0.26, 0.03, 0.03], build: buildPencil },
  { id: 'keyboard', name: '键盘', dmg: 14, mass: 0.8, color: '#A9BCD0', shape: ['box', 0.27, 0.03, 0.1], build: buildKeyboard },
  { id: 'stapler', name: '订书机', dmg: 16, mass: 0.9, color: '#C3CBD8', shape: ['box', 0.18, 0.06, 0.06], build: buildStapler },
  { id: 'folder', name: '文件夹', dmg: 10, mass: 0.4, color: '#E0B45C', shape: ['box', 0.19, 0.02, 0.15], build: buildFolder },
  { id: 'mug', name: '马克杯', dmg: 20, mass: 0.7, color: '#C97B4A', shape: ['sphere', 0.1], build: buildMug },
  { id: 'printer', name: '打印机', dmg: 34, mass: 2.2, color: '#B9B4C4', shape: ['box', 0.22, 0.11, 0.16], build: buildPrinter },
  { id: 'chair', name: '办公椅', dmg: 55, mass: 5, color: '#A8764C', shape: ['box', 0.24, 0.28, 0.22], build: buildChair },
  { id: 'monitor', name: '显示器', dmg: 60, mass: 3, color: '#8FB3D6', shape: ['box', 0.27, 0.18, 0.06], build: buildMonitor },
  { id: 'slipper', name: '拖鞋', dmg: 18, mass: 0.5, color: '#D96C4A', shape: ['box', 0.16, 0.04, 0.08], build: buildSlipper },
  { id: 'pillow', name: '抱枕', dmg: 7, mass: 0.35, color: '#D69AB4', shape: ['box', 0.22, 0.16, 0.08], build: buildPillow },
  { id: 'pan', name: '平底锅', dmg: 46, mass: 1.8, color: '#9A9DA8', shape: ['box', 0.24, 0.05, 0.2], build: buildPan },
  { id: 'durian', name: '榴莲', dmg: 68, mass: 2.5, color: '#D0AE4E', shape: ['sphere', 0.21], build: buildDurian },
  { id: 'hanger', name: '衣架', dmg: 20, mass: 0.4, color: '#D0A4BC', shape: ['box', 0.2, 0.14, 0.03], build: buildHanger },
  { id: 'mop', name: '拖把', dmg: 32, mass: 1.4, color: '#B08E60', shape: ['box', 0.14, 0.3, 0.1], build: buildMop },
  { id: 'milktea', name: '奶茶', dmg: 16, mass: 0.6, color: '#C9A57A', shape: ['box', 0.09, 0.14, 0.09], build: buildMilktea },
  { id: 'cake', name: '蛋糕', dmg: 18, mass: 0.7, color: '#E8A8B8', shape: ['box', 0.13, 0.08, 0.11], build: buildCake },
  { id: 'egg', name: '鸡蛋', dmg: 10, mass: 0.3, color: '#E8D9B8', shape: ['sphere', 0.1], build: buildEgg },
  { id: 'watermelon', name: '西瓜', dmg: 40, mass: 2, color: '#D95B5B', shape: ['sphere', 0.19], build: buildWatermelon },
  { id: 'noodle', name: '泡面', dmg: 22, mass: 0.8, color: '#E0A15C', shape: ['box', 0.1, 0.1, 0.1], build: buildNoodle },
  { id: 'remote', name: '遥控器', dmg: 9, mass: 0.3, color: '#93A5BC', shape: ['box', 0.05, 0.02, 0.14], build: buildRemote },
  { id: 'suona', name: '唢呐', dmg: 50, mass: 1.2, color: '#D9A441', shape: ['box', 0.2, 0.08, 0.08], build: buildSuona },
  { id: 'speaker', name: '音响', dmg: 44, mass: 2, color: '#9A9FAA', shape: ['box', 0.15, 0.2, 0.12], build: buildSpeaker },
  { id: 'flag', name: '锦旗', dmg: 26, mass: 0.5, color: '#C94A4A', shape: ['box', 0.26, 0.2, 0.03], build: buildFlag },
  { id: 'cat', name: '猫', dmg: 30, mass: 1.2, color: '#D0A47C', shape: ['sphere', 0.19], build: buildCat }
];

export function buildItemMesh(item) {
  const g = item.build();
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export function createItemBody(item, position) {
  const mat = new CANNON.Material('item');
  const body = new CANNON.Body({
    mass: item.mass,
    material: mat,
    position: new CANNON.Vec3(position.x, position.y, position.z),
    linearDamping: 0.02,
    angularDamping: 0.12,
    allowSleep: true
  });
  const s = item.shape;
  if (s[0] === 'sphere') {
    body.addShape(new CANNON.Sphere(s[1]));
  } else {
    body.addShape(new CANNON.Box(new CANNON.Vec3(s[1], s[2], s[3])));
  }
  body.sleepSpeedLimit = 0.12;
  body.sleepTimeLimit = 0.6;
  return body;
}
