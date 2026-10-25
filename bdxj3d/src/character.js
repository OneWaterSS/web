import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const M = (color, roughness = .72, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const SKIN = M(0xf0c7a2, .55);
const SKIN_DARK = M(0xe0b28d, .58);
const HAIR = M(0x2a2025, .52);
const SHIRT = M(0xece3d1, .88);
const SHIRT_DARK = M(0xd9cfbb, .9);
const PANTS = M(0x2e2a3a, .9);
const SHOE = M(0xf1ece2, .72);
const SOLE = M(0x34303c, .85);
const BELT = M(0x5a3b2c, .8);
const DARK = M(0x241c22, .6);
const MOUTH = M(0x8a3b42, .6);
const TEAR = new THREE.MeshStandardMaterial({ color: 0x9fd3e8, roughness: .25, transparent: true, opacity: .85 });

function mesh(geo, mat, cast = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

function badgeTexture() {
  const c = document.createElement('canvas');
  c.width = 192; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#f8f2e4'; g.fillRect(0, 0, 192, 128);
  g.strokeStyle = '#c9bda6'; g.lineWidth = 6; g.strokeRect(3, 3, 186, 122);
  g.fillStyle = '#6a6270'; g.font = '600 56px "Microsoft YaHei", sans-serif'; g.textAlign = 'center';
  g.fillText('小江', 96, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function stainTexture(color, alpha) {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 4, 64, 64, 60);
  grad.addColorStop(0, color); grad.addColorStop(.6, color); grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.globalAlpha = alpha; g.fillStyle = grad;
  g.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    const r = 34 + Math.random() * 24;
    const x = 64 + Math.cos(a) * r, y = 64 + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function makeJoint(node, base, limits, k = 140, c = 19) {
  return {
    node,
    base: { x: base.x || 0, y: base.y || 0, z: base.z || 0 },
    a: { x: base.x || 0, y: base.y || 0, z: base.z || 0 },
    v: { x: 0, y: 0, z: 0 },
    limits,
    k, c
  };
}
function applyJoint(j, dt) {
  ['x', 'y', 'z'].forEach(ax => {
    const t = j.target ? j.target[ax] : j.base[ax];
    const lim = j.limits[ax];
    j.v[ax] += ((t - j.a[ax]) * j.k - j.v[ax] * j.c) * dt;
    j.a[ax] += j.v[ax] * dt;
    j.a[ax] = clamp(j.a[ax], lim[0], lim[1]);
    j.node.rotation[ax] = j.a[ax];
  });
}

export function createCharacter(scene, world) {
  const root = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -0.92;
  root.add(inner);
  scene.add(root);

  const bodyGroup = new THREE.Group();
  inner.add(bodyGroup);

  const pelvis = new THREE.Group();
  pelvis.position.y = 0.68;
  bodyGroup.add(pelvis);

  const hips = mesh(new THREE.SphereGeometry(0.2, 24, 18), PANTS);
  hips.scale.set(1.06, 0.66, 0.9);
  pelvis.add(hips);
  const belt = mesh(new THREE.CylinderGeometry(0.205, 0.205, 0.055, 24), BELT);
  belt.position.y = 0.055;
  pelvis.add(belt);
  const buckle = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.02), M(0xd8b56a, .35, .55));
  buckle.position.set(0, 0.055, 0.19);
  pelvis.add(buckle);
  [-.12, 0, .12].forEach(x => {
    const loop = mesh(new THREE.BoxGeometry(0.022, 0.065, 0.012), BELT);
    loop.position.set(x, 0.055, 0.193);
    pelvis.add(loop);
  });

  const spine = new THREE.Group();
  spine.position.y = 0.02;
  pelvis.add(spine);

  const torso = mesh(new THREE.CylinderGeometry(0.225, 0.19, 0.5, 28), SHIRT);
  torso.position.y = 0.27;
  torso.scale.z = 0.88;
  spine.add(torso);
  const chest = mesh(new THREE.SphereGeometry(0.225, 28, 20), SHIRT);
  chest.position.y = 0.47;
  chest.scale.set(1, 0.72, 0.86);
  spine.add(chest);
  const hem = mesh(new THREE.TorusGeometry(0.195, 0.018, 8, 28), SHIRT_DARK);
  hem.position.y = 0.025;
  hem.rotation.x = Math.PI / 2;
  spine.add(hem);

  const collarL = mesh(new THREE.BoxGeometry(0.09, 0.035, 0.035), SHIRT_DARK);
  collarL.position.set(-0.055, 0.51, 0.13); collarL.rotation.z = 0.42;
  const collarR = collarL.clone(); collarR.position.x = 0.055; collarR.rotation.z = -0.42;
  spine.add(collarL, collarR);

  for (let i = 0; i < 3; i++) {
    const btn = mesh(new THREE.SphereGeometry(0.012, 8, 8), SHIRT_DARK);
    btn.position.set(0, 0.42 - i * 0.09, 0.178);
    spine.add(btn);
  }
  const pocket = mesh(new THREE.BoxGeometry(0.11, 0.09, 0.012), SHIRT_DARK);
  pocket.position.set(-0.1, 0.34, 0.168);
  spine.add(pocket);
  const placket = mesh(new THREE.BoxGeometry(0.016, 0.42, 0.012), SHIRT_DARK);
  placket.position.set(0, 0.28, 0.196);
  spine.add(placket);
  const pen = mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8), M(0x3e6f8a, .5));
  pen.position.set(-0.1, 0.385, 0.182);
  spine.add(pen);

  const lanyard = M(0x3a3340, .7);
  const strapL = mesh(new THREE.BoxGeometry(0.018, 0.19, 0.012), lanyard);
  strapL.position.set(-0.055, 0.42, 0.17); strapL.rotation.z = -0.18;
  const strapR = mesh(new THREE.BoxGeometry(0.018, 0.19, 0.012), lanyard);
  strapR.position.set(0.055, 0.42, 0.17); strapR.rotation.z = 0.18;
  spine.add(strapL, strapR);
  const badge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.107),
    new THREE.MeshStandardMaterial({ map: badgeTexture(), roughness: .8 })
  );
  badge.position.set(0.11, 0.3, 0.195);
  spine.add(badge);

  const neck = new THREE.Group();
  neck.position.y = 0.52;
  spine.add(neck);
  const neckMesh = mesh(new THREE.CylinderGeometry(0.07, 0.078, 0.14, 18), SKIN);
  neckMesh.position.y = 0.06;
  neck.add(neckMesh);

  const head = new THREE.Group();
  head.position.y = 0.42;
  neck.add(head);

  const skull = mesh(new THREE.SphereGeometry(0.29, 36, 28), SKIN);
  skull.scale.set(1, 0.98, 0.98);
  head.add(skull);

  [-1, 1].forEach(side => {
    const ear = mesh(new THREE.SphereGeometry(0.055, 14, 12), SKIN);
    ear.position.set(side * 0.285, 0.0, 0.0);
    ear.scale.set(0.55, 1, 0.8);
    head.add(ear);
    const earIn = mesh(new THREE.SphereGeometry(0.03, 10, 8), SKIN_DARK);
    earIn.position.set(side * 0.3, 0.0, 0.005);
    earIn.scale.set(0.35, 1, 0.7);
    head.add(earIn);
  });

  const hairCap = mesh(new THREE.SphereGeometry(0.298, 36, 28, 0, Math.PI * 2, 0, Math.PI * 0.39), HAIR);
  head.add(hairCap);
  const hairBack = mesh(new THREE.SphereGeometry(0.292, 28, 22), HAIR);
  hairBack.position.set(0, -0.015, -0.075);
  hairBack.scale.set(0.98, 1.04, 0.85);
  head.add(hairBack);

  const lock = (x, y, z, len, rz, mat) => {
    const l = mesh(new THREE.CapsuleGeometry(.035, len, 4, 10), mat || HAIR);
    l.position.set(x, y, z);
    l.rotation.z = rz;
    l.scale.set(1, 1, .72);
    head.add(l);
    return l;
  };
  lock(-.02, .2, .218, .16, -.95);
  lock(-.1, .185, .225, .17, -1.12);
  lock(-.17, .17, .21, .14, -1.26);
  lock(.075, .2, .22, .15, .62);
  lock(.16, .18, .205, .12, .86);
  const quiff = mesh(new THREE.ConeGeometry(.06, .24, 6), HAIR);
  quiff.position.set(.02, .29, .11);
  quiff.rotation.z = .95;
  quiff.rotation.x = -.35;
  head.add(quiff);
  const HL = M(0x3d3038, .5);
  const h1 = mesh(new THREE.CapsuleGeometry(.012, .12, 3, 6), HL);
  h1.position.set(-.07, .25, .14);
  h1.rotation.z = -1.1;
  head.add(h1);
  const h2 = mesh(new THREE.CapsuleGeometry(.01, .09, 3, 6), HL);
  h2.position.set(.11, .24, .13);
  h2.rotation.z = .8;
  head.add(h2);
  const sideburnL = mesh(new THREE.BoxGeometry(0.035, 0.1, 0.06), HAIR);
  sideburnL.position.set(-0.275, 0.02, 0.05);
  const sideburnR = sideburnL.clone(); sideburnR.position.x = 0.275;
  head.add(sideburnL, sideburnR);
  const cowlick = mesh(new THREE.ConeGeometry(0.04, 0.13, 8), HAIR);
  cowlick.position.set(0.03, 0.31, 0.0);
  cowlick.rotation.z = 0.5;
  head.add(cowlick);

  const nose = mesh(new THREE.SphereGeometry(0.023, 10, 8), SKIN_DARK);
  nose.position.set(0, -0.015, 0.288);
  head.add(nose);
  [-1, 1].forEach(side => {
    const blush = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 18),
      new THREE.MeshBasicMaterial({ color: 0xe89a8e, transparent: true, opacity: .28, depthWrite: false })
    );
    blush.position.set(side * 0.175, -0.035, 0.245);
    blush.rotation.y = side * 0.35;
    head.add(blush);
  });

  const IRIS = M(0x6b4a33, .28);
  const faceNormal = new THREE.Group();
  const eyeGroup = new THREE.Group();
  [-1, 1].forEach(side => {
    const white = mesh(new THREE.SphereGeometry(0.05, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfffbf2, roughness: .35 }));
    white.position.set(side * 0.095, 0.018, 0.252);
    white.scale.set(1, 1.15, 0.42);
    eyeGroup.add(white);
    const iris = mesh(new THREE.SphereGeometry(0.033, 14, 12), IRIS);
    iris.position.set(side * 0.095, 0.012, 0.276);
    iris.scale.set(1, 1.1, 0.4);
    eyeGroup.add(iris);
    const pupil = mesh(new THREE.SphereGeometry(0.017, 12, 10), DARK);
    pupil.position.set(side * 0.095, 0.008, 0.291);
    pupil.scale.set(1, 1.15, 0.35);
    eyeGroup.add(pupil);
    const shine = mesh(new THREE.SphereGeometry(0.008, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(side * 0.083, 0.028, 0.299);
    eyeGroup.add(shine);
    const lash = mesh(new THREE.BoxGeometry(0.08, 0.011, 0.014), DARK);
    lash.position.set(side * 0.095, 0.058, 0.283);
    lash.rotation.z = side * -0.12;
    faceNormal.add(lash);
    const brow = mesh(new THREE.BoxGeometry(0.085, 0.015, 0.018), HAIR);
    brow.position.set(side * 0.095, 0.08, 0.281);
    brow.rotation.z = side * -0.09;
    faceNormal.add(brow);
  });
  faceNormal.add(eyeGroup);
  const smile = mesh(new THREE.TorusGeometry(0.045, 0.0075, 6, 18, Math.PI), MOUTH);
  smile.position.set(0.012, -0.085, 0.276);
  smile.rotation.z = Math.PI;
  faceNormal.add(smile);
  head.add(faceNormal);

  const faceHurt = new THREE.Group();
  [-1, 1].forEach(side => {
    const white = mesh(new THREE.SphereGeometry(0.062, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfffbf2, roughness: .35 }));
    white.position.set(side * 0.095, 0.02, 0.248);
    white.scale.set(1, 1.12, 0.42);
    faceHurt.add(white);
    const pupil = mesh(new THREE.SphereGeometry(0.014, 10, 8), DARK);
    pupil.position.set(side * 0.095, 0.01, 0.292);
    faceHurt.add(pupil);
    const shine = mesh(new THREE.SphereGeometry(0.006, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(side * 0.088, 0.02, 0.299);
    faceHurt.add(shine);
    const brow = mesh(new THREE.BoxGeometry(0.08, 0.016, 0.018), HAIR);
    brow.position.set(side * 0.09, 0.138, 0.272);
    brow.rotation.z = side * 0.3;
    faceHurt.add(brow);
  });
  const hurtMouth = mesh(new THREE.SphereGeometry(0.058, 14, 12), MOUTH);
  hurtMouth.position.set(0, -0.1, 0.257);
  hurtMouth.scale.set(1.05, 1.2, 0.34);
  faceHurt.add(hurtMouth);
  const hurtTongue = mesh(new THREE.SphereGeometry(0.028, 10, 8), M(0xd98a8a, .5));
  hurtTongue.position.set(0, -0.135, 0.278);
  hurtTongue.scale.set(1.2, 0.45, 0.6);
  faceHurt.add(hurtTongue);
  const sweat = mesh(new THREE.SphereGeometry(0.02, 8, 8), TEAR);
  sweat.position.set(0.235, 0.09, 0.14);
  sweat.scale.set(.8, 1.5, .6);
  faceHurt.add(sweat);
  head.add(faceHurt);

  const faceBeg = new THREE.Group();
  [-1, 1].forEach(side => {
    const white = mesh(new THREE.SphereGeometry(0.058, 18, 14), new THREE.MeshStandardMaterial({ color: 0xfffbf2, roughness: .35 }));
    white.position.set(side * 0.095, 0.015, 0.248);
    white.scale.set(1, 1.1, 0.42);
    faceBeg.add(white);
    const iris = mesh(new THREE.SphereGeometry(0.038, 14, 12), IRIS);
    iris.position.set(side * 0.095, 0.005, 0.274);
    iris.scale.set(1, 1.15, 0.4);
    faceBeg.add(iris);
    const pupil = mesh(new THREE.SphereGeometry(0.018, 10, 8), DARK);
    pupil.position.set(side * 0.095, 0.0, 0.291);
    faceBeg.add(pupil);
    const shine = mesh(new THREE.SphereGeometry(0.008, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(side * 0.083, 0.018, 0.299);
    faceBeg.add(shine);
    const tear = mesh(new THREE.SphereGeometry(0.018, 8, 8), TEAR);
    tear.position.set(side * 0.135, -0.075, 0.27);
    tear.scale.set(0.7, 1.7, 0.5);
    faceBeg.add(tear);
    const brow = mesh(new THREE.BoxGeometry(0.08, 0.015, 0.018), HAIR);
    brow.position.set(side * 0.09, 0.105, 0.272);
    brow.rotation.z = side * 0.24;
    faceBeg.add(brow);
  });
  const begMouth = mesh(new THREE.TorusGeometry(0.038, 0.008, 6, 14, Math.PI), MOUTH);
  begMouth.position.set(0, -0.095, 0.27);
  faceBeg.add(begMouth);
  head.add(faceBeg);

  const faceDead = new THREE.Group();
  [-1, 1].forEach(side => {
    [-1, 1].forEach(dir => {
      const line = mesh(new THREE.BoxGeometry(0.11, 0.017, 0.017), DARK);
      line.position.set(side * 0.095, 0.02, 0.285);
      line.rotation.z = dir * 0.7;
      faceDead.add(line);
    });
  });
  const deadMouth = mesh(new THREE.BoxGeometry(0.095, 0.014, 0.018), MOUTH);
  deadMouth.position.set(0, -0.095, 0.27);
  faceDead.add(deadMouth);
  const deadTongue = mesh(new THREE.SphereGeometry(0.025, 10, 8), M(0xd98a8a, .5));
  deadTongue.position.set(0.02, -0.125, 0.278);
  deadTongue.scale.set(1.1, 0.45, 0.6);
  faceDead.add(deadTongue);
  head.add(faceDead);
  faceHurt.visible = false; faceBeg.visible = false; faceDead.visible = false;

  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? .035 : .075;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) starShape.moveTo(x, y); else starShape.lineTo(x, y);
  }
  starShape.closePath();
  const starGeo = new THREE.ExtrudeGeometry(starShape, { depth: .012, bevelEnabled: false });
  const starMat = new THREE.MeshBasicMaterial({ color: 0xffd766 });
  const starGroup = new THREE.Group();
  starGroup.position.set(0, .33, .0);
  for (let i = 0; i < 3; i++) {
    const st = new THREE.Mesh(starGeo, starMat);
    const a = i / 3 * Math.PI * 2;
    st.position.set(Math.cos(a) * .42, Math.sin(a * 2) * .05, Math.sin(a) * .3);
    st.rotation.z = a;
    st.scale.setScalar(.86);
    starGroup.add(st);
  }
  starGroup.visible = false;
  head.add(starGroup);

  const shoulders = [];
  [-1, 1].forEach(side => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.245, 0.46, 0.0);
    spine.add(shoulder);
    const sleeve = mesh(new THREE.CapsuleGeometry(0.082, 0.06, 6, 14), SHIRT);
    sleeve.position.y = -0.07;
    shoulder.add(sleeve);
    const cuff = mesh(new THREE.CylinderGeometry(0.086, 0.086, 0.028, 14), SHIRT_DARK);
    cuff.position.y = -0.115;
    shoulder.add(cuff);
    const arm = mesh(new THREE.CapsuleGeometry(0.062, 0.18, 8, 16), SKIN);
    arm.position.y = -0.19;
    shoulder.add(arm);
    const joint = mesh(new THREE.SphereGeometry(0.066, 14, 12), SKIN);
    joint.position.y = -0.34;
    shoulder.add(joint);

    const elbow = new THREE.Group();
    elbow.position.y = -0.34;
    shoulder.add(elbow);
    const forearm = mesh(new THREE.CapsuleGeometry(0.055, 0.16, 8, 16), SKIN);
    forearm.position.y = -0.15;
    elbow.add(forearm);
    if (side === -1) {
      const band = mesh(new THREE.TorusGeometry(0.06, 0.011, 6, 16), M(0x3a3340, .6));
      band.position.y = -0.27;
      band.rotation.x = Math.PI / 2;
      elbow.add(band);
      const watch = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.008, 12), M(0xd8b56a, .3, .6));
      watch.position.set(-0.062, -0.27, 0);
      watch.rotation.z = Math.PI / 2;
      elbow.add(watch);
    }

    const hand = new THREE.Group();
    hand.position.y = -0.31;
    elbow.add(hand);
    const palm = mesh(new THREE.SphereGeometry(0.07, 14, 12), SKIN);
    palm.scale.set(1, 1.15, 0.62);
    hand.add(palm);
    const thumb = mesh(new THREE.SphereGeometry(0.026, 8, 8), SKIN);
    thumb.position.set(side * -0.055, 0.015, 0.02);
    hand.add(thumb);
    const fingers = mesh(new THREE.SphereGeometry(0.06, 12, 10), SKIN);
    fingers.position.set(0, -0.052, 0.018);
    fingers.scale.set(1.15, .62, .82);
    hand.add(fingers);

    shoulders.push({ shoulder, elbow });
  });

  const hipsJoints = [];
  [-1, 1].forEach(side => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.115, 0.0, 0.0);
    pelvis.add(hip);
    const thigh = mesh(new THREE.CapsuleGeometry(0.092, 0.18, 8, 16), PANTS);
    thigh.position.y = -0.18;
    hip.add(thigh);
    const seam = mesh(new THREE.BoxGeometry(0.008, 0.3, 0.008), M(0x3d3848, .92));
    seam.position.set(side * 0.094, -0.2, 0.015);
    hip.add(seam);
    const knee = new THREE.Group();
    knee.position.y = -0.34;
    hip.add(knee);
    const kneecap = mesh(new THREE.SphereGeometry(0.082, 14, 12), PANTS);
    knee.add(kneecap);
    const shin = mesh(new THREE.CapsuleGeometry(0.073, 0.14, 8, 16), PANTS);
    shin.position.y = -0.145;
    knee.add(shin);
    const pantCuff = mesh(new THREE.CylinderGeometry(0.076, 0.076, 0.03, 12), M(0x3d3848, .92));
    pantCuff.position.y = -0.275;
    knee.add(pantCuff);
    const foot = new THREE.Group();
    foot.position.y = -0.29;
    knee.add(foot);
    const sock = mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.04, 12), M(0x3a3542, .9));
    sock.position.set(0, 0.045, 0.0);
    foot.add(sock);
    const shoe = mesh(new THREE.BoxGeometry(0.17, 0.09, 0.27), SHOE);
    shoe.position.set(0, -0.005, 0.045);
    foot.add(shoe);
    const accent = mesh(new THREE.BoxGeometry(0.006, 0.032, 0.21), M(0x5f7c9a, .55));
    accent.position.set(side * 0.087, 0.005, 0.05);
    foot.add(accent);
    const toe = mesh(new THREE.SphereGeometry(0.085, 14, 12), SHOE);
    toe.position.set(0, -0.005, 0.16);
    toe.scale.set(1, 0.55, 1);
    foot.add(toe);
    const sole = mesh(new THREE.BoxGeometry(0.18, 0.025, 0.29), SOLE);
    sole.position.set(0, -0.055, 0.05);
    foot.add(sole);
    for (let i = 0; i < 3; i++) {
      const lace = mesh(new THREE.BoxGeometry(0.1, 0.008, 0.014), SHIRT_DARK);
      lace.position.set(0, 0.043, 0.07 + i * 0.035);
      foot.add(lace);
    }
    hipsJoints.push({ hip, knee });
  });

  const bandaid = mesh(new THREE.BoxGeometry(0.13, 0.04, 0.012), M(0xe8c9a8, .8));
  bandaid.position.set(0.19, -0.075, 0.245);
  bandaid.rotation.z = 0.35;
  head.add(bandaid);
  bandaid.visible = false;

  const bruise = new THREE.Mesh(
    new THREE.CircleGeometry(0.07, 20),
    new THREE.MeshBasicMaterial({ map: stainTexture('#6d5fae', .55), transparent: true, depthWrite: false })
  );
  bruise.position.set(-0.115, 0.085, 0.27);
  head.add(bruise);
  bruise.visible = false;

  const stain = new THREE.Mesh(
    new THREE.CircleGeometry(0.13, 24),
    new THREE.MeshBasicMaterial({ map: stainTexture('#7a4a2c', .7), transparent: true, depthWrite: false })
  );
  stain.position.set(0.03, 0.28, 0.19);
  spine.add(stain);
  stain.visible = false;

  const egg = new THREE.Group();
  const yolk = mesh(new THREE.SphereGeometry(0.07, 14, 12), M(0xf2df9f, .5));
  yolk.scale.set(1, .55, 1);
  egg.add(yolk);
  const drip = mesh(new THREE.SphereGeometry(0.02, 8, 8), M(0xf2df9f, .5));
  drip.position.set(0.02, -0.035, 0.05);
  drip.scale.set(1, 2.4, 1);
  egg.add(drip);
  egg.position.set(0.08, 0.27, 0.03);
  head.add(egg);
  egg.visible = false;

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .35, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.006;
  shadow.scale.set(1.15, 1, 1);
  scene.add(shadow);

  const charMat = new CANNON.Material('char');
  const body = new CANNON.Body({ mass: 0, material: charMat });
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.23, 0.3, 0.18)), new CANNON.Vec3(0, 0.04, 0));
  body.addShape(new CANNON.Sphere(0.32), new CANNON.Vec3(0, 0.65, 0));
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.17, 0.25, 0.15)), new CANNON.Vec3(0, -0.59, 0));
  body.addShape(new CANNON.Box(new CANNON.Vec3(0.19, 0.07, 0.2)), new CANNON.Vec3(0, -0.86, 0.04));
  body.position.set(-0.5, 0.92, -0.15);
  body.type = CANNON.Body.STATIC;
  body.mass = 0;
  body.updateMassProperties();
  body.linearDamping = 0.08;
  body.angularDamping = 0.22;
  world.addBody(body);
  const stand = body.position.clone();

  const spineJ = makeJoint(spine, { x: 0.015, y: 0, z: 0 }, { x: [-.5, .5], y: [-.5, .5], z: [-.5, .5] }, 110, 15);
  const neckJ = makeJoint(neck, { x: 0.01, y: 0, z: 0 }, { x: [-.95, .95], y: [-1.4, 1.4], z: [-.95, .95] }, 52, 8);
  const shoulderJ = shoulders.map((s, i) => makeJoint(s.shoulder, { x: -0.04, y: 0, z: (i === 0 ? -1 : 1) * 0.14 }, { x: [-2.3, 2.3], y: [-.85, .85], z: [-1.55, 1.55] }, 95, 13));
  const elbowJ = shoulders.map(s => makeJoint(s.elbow, { x: -0.18, y: 0, z: 0 }, { x: [-2.45, .15], y: [-.5, .5], z: [-.7, .7] }, 110, 15));
  const hipJ = hipsJoints.map((h, i) => makeJoint(h.hip, { x: 0.02, y: 0, z: (i === 0 ? -1 : 1) * 0.035 }, { x: [-1.6, 1.6], y: [-.6, .6], z: [-.85, .85] }, 120, 15));
  const kneeJ = hipsJoints.map(h => makeJoint(h.knee, { x: 0.06, y: 0, z: 0 }, { x: [-.1, 2.45], y: [-.35, .35], z: [-.35, .35] }, 135, 17));

  const hp = { x: 0, z: 0 };
  let nextBlink = 2.4, blinkT = 0, squash = 0;

  function setExpression(name) {
    faceNormal.visible = name === 'smug';
    faceHurt.visible = name === 'hurt';
    faceBeg.visible = name === 'beg';
    faceDead.visible = name === 'dead';
  }

  function hit(dir, power) {
    const inv = body.quaternion.inverse();
    const local = new CANNON.Vec3();
    inv.vmult(new CANNON.Vec3(dir.x, dir.y, dir.z), local);
    const p = clamp(power / 40, .35, 2.2);
    hp.x = clamp(hp.x + local.x * p * .7, -1.3, 1.3);
    hp.z = clamp(hp.z + local.z * p * .7, -1.3, 1.3);
    neckJ.v.z += local.x * p * 13;
    neckJ.v.x -= local.z * p * 13;
    neckJ.v.y += (Math.random() - .5) * p * 12;
    shoulderJ.forEach((j, i) => {
      j.v.z += local.x * p * 11;
      j.v.x -= local.z * p * 9.5;
      j.v.y += (Math.random() - .5) * p * 6;
      elbowJ[i].v.x -= p * 8.5;
    });
    hipJ.forEach(j => { j.v.x += local.z * p * 5.5; });
    kneeJ.forEach(j => { j.v.x += p * 7.5; });
    spineJ.v.z += local.x * p * 7;
    spineJ.v.x -= local.z * p * 3.5;
    squash = .9;
  }

  function land(power) {
    const p = clamp(power, .3, 1.6);
    spineJ.v.x += p * 4.5;
    kneeJ.forEach(j => { j.v.x += p * 9.5; });
    hipJ.forEach(j => { j.v.x -= p * 3.2; });
    shoulderJ.forEach(j => { j.v.x += p * 4.2; });
    neckJ.v.x -= p * 3;
  }

  function update(dt, time, knocked) {
    const inv = body.quaternion.inverse();
    const lv = new CANNON.Vec3();
    inv.vmult(new CANNON.Vec3(body.velocity.x, body.velocity.y, body.velocity.z), lv);
    const lw = new CANNON.Vec3();
    inv.vmult(new CANNON.Vec3(body.angularVelocity.x, body.angularVelocity.y, body.angularVelocity.z), lw);
    const speed = Math.min(2.4, Math.hypot(body.velocity.x, body.velocity.y, body.velocity.z));
    const air = knocked ? 1 : 0;
    const flail = Math.sin(time * 15) * Math.min(1, speed * .5);
    hp.x *= Math.exp(-dt * 5.5);
    hp.z *= Math.exp(-dt * 5.5);

    spineJ.target = {
      x: .015 + lv.z * .1 + hp.z * .35 + air * Math.sin(time * 9) * .12,
      y: lw.y * .2 + air * Math.sin(time * 7) * .22,
      z: lv.x * .12 + hp.x * .4 + air * Math.sin(time * 8) * .16
    };
    neckJ.target = {
      x: .01 - lv.z * .18 - hp.z * .7 + air * Math.sin(time * 11) * .18,
      y: Math.sin(time * .55) * .06 + lw.y * .3 + air * Math.sin(time * 6) * .9,
      z: lv.x * .16 + hp.x * .8 + air * Math.cos(time * 7) * .3
    };
    shoulderJ.forEach((j, i) => {
      const side = i === 0 ? -1 : 1;
      j.target = {
        x: -.04 + lv.z * .25 + hp.z * .95 + air * (flail * .65 + Math.sin(time * 9 + i) * .22),
        y: air * Math.sin(time * 10 + i) * .25,
        z: side * .14 - lv.x * .2 + hp.x * .6 + air * (.28 + Math.sin(time * 8 + i) * .5)
      };
      elbowJ[i].target = {
        x: -.18 - air * (1.15 + speed * .35) - Math.abs(hp.z) * .5 + air * flail * .35,
        y: 0,
        z: air * Math.sin(time * 9 + i) * .18
      };
    });
    hipJ.forEach((j, i) => {
      const side = i === 0 ? -1 : 1;
      j.target = {
        x: .02 + lv.z * .18 + air * (.18 + flail * .35),
        y: 0,
        z: side * .035 - lv.x * .1 + air * Math.sin(time * 7 + i) * .22
      };
      kneeJ[i].target = {
        x: .06 + air * (.85 + speed * .3) + Math.abs(hp.z) * .2 + Math.abs(flail) * .3,
        y: 0, z: 0
      };
    });

    applyJoint(spineJ, dt);
    applyJoint(neckJ, dt);
    shoulderJ.forEach(j => applyJoint(j, dt));
    elbowJ.forEach(j => applyJoint(j, dt));
    hipJ.forEach(j => applyJoint(j, dt));
    kneeJ.forEach(j => applyJoint(j, dt));

    squash += (0 - squash) * Math.min(1, dt * 8);
    bodyGroup.scale.set(1 - squash * .07, 1 + squash * .12, 1 - squash * .07);
    starGroup.visible = !!knocked;
    if (knocked) {
      starGroup.rotation.y += dt * 4.5;
      starGroup.rotation.z = Math.sin(time * 4) * .16;
    }
    if (!knocked) {
      bodyGroup.position.y = Math.sin(time * 2.1) * .006;
      bodyGroup.rotation.z = Math.sin(time * 1.1) * .004;
    } else {
      bodyGroup.position.y = 0;
      bodyGroup.rotation.z = 0;
    }

    if (time > nextBlink) {
      blinkT = .11;
      nextBlink = time + 2.4 + Math.random() * 3.2;
    }
    if (blinkT > 0) {
      blinkT -= dt;
      eyeGroup.scale.y = .12;
    } else {
      eyeGroup.scale.y += (1 - eyeGroup.scale.y) * Math.min(1, dt * 18);
    }
  }

  return {
    root, inner, body, stand, shadow,
    setExpression,
    setDamageRatio(p) {
      bandaid.visible = p >= .1;
      bruise.visible = p >= .3;
      stain.visible = p >= .48;
      egg.visible = p >= .68;
    },
    update, hit, land
  };
}
