import * as THREE from 'three';

const M = (color, roughness = .82) => new THREE.MeshStandardMaterial({ color, roughness });

export const CAT_DEFS = {
  tiaotiao: {
    id: 'tiaotiao', name: '跳跳', color: '#94A7B8', eye: '#D9A441', muzzle: '#F5F0E6',
    whitePaws: true, whiteChest: true, tabby: null, fat: 0.96, collar: null,
    dmg: 26, force: 13, leaps: 3, leapDur: .34, leapH: .72, speed: 3.5, recover: .2, idle: 4.2
  },
  daidai: {
    id: 'daidai', name: '呆呆', color: '#8FA1B1', eye: '#D9A441', muzzle: '#9EAEBC',
    whitePaws: false, whiteChest: false, tabby: null, fat: 1.2, collar: null,
    dmg: 62, force: 25, leaps: 1, leapDur: .52, leapH: .55, speed: 1.7, recover: .45, idle: 4.6, derp: true
  },
  tuantuan: {
    id: 'tuantuan', name: '团团', color: '#2B2731', eye: '#8FBF7A', muzzle: '#4B4653',
    whitePaws: false, whiteChest: false, tabby: '#3E3947', fat: 1.12, collar: null,
    dmg: 34, force: 13, leaps: 3, leapDur: .28, leapH: .78, speed: 3.9, recover: .14, idle: 3.8
  },
  token: {
    id: 'token', name: 'token', color: '#E0913F', eye: '#E8B24A', muzzle: '#F7EBDD',
    whitePaws: true, whiteChest: true, tabby: '#C46E2B', fat: 1.28, collar: '#C94A4A',
    dmg: 76, force: 29, leaps: 2, leapDur: .55, leapH: 1.05, speed: 2.3, recover: .5, idle: 4.8
  }
};

function mesh(geo, mat) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export function createCat(id) {
  const def = CAT_DEFS[id];
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  group.add(bodyRoot);

  const bodyMat = M(def.color, .86);
  const muzzleMat = M(def.muzzle, .8);
  const whiteMat = M(0xf5f0e6, .82);
  const stripeMat = def.tabby ? M(def.tabby, .88) : null;
  const eyeMat = M(def.eye, .35);
  const dark = M(0x1b1720, .5);
  const pink = M(0xd98a8a, .6);

  const body = mesh(new THREE.SphereGeometry(.18, 22, 16), bodyMat);
  body.position.set(0, .26, -.02);
  body.scale.set(1 * def.fat, .82, 1.5);
  bodyRoot.add(body);

  if (def.whiteChest) {
    const chest = mesh(new THREE.SphereGeometry(.11, 14, 12), whiteMat);
    chest.position.set(0, .22, .24);
    chest.scale.set(1.05, .9, .5);
    bodyRoot.add(chest);
  }

  if (stripeMat) {
    [.08, -.07, -.2].forEach((z, i) => {
      const stripe = mesh(new THREE.TorusGeometry(.175 * (i === 2 ? .9 : 1), .013, 6, 22), stripeMat);
      stripe.position.set(0, .27, z);
      stripe.scale.y = .82;
      bodyRoot.add(stripe);
    });
  }

  const head = new THREE.Group();
  head.position.set(0, .43, .3);
  bodyRoot.add(head);

  const skull = mesh(new THREE.SphereGeometry(.145, 24, 18), bodyMat);
  skull.scale.set(1, .95, .95);
  head.add(skull);

  const muzzle = mesh(new THREE.SphereGeometry(.075, 14, 12), muzzleMat);
  muzzle.position.set(0, -.035, .11);
  muzzle.scale.set(1.1, .75, .75);
  head.add(muzzle);

  const nose = mesh(new THREE.SphereGeometry(.018, 8, 8), pink);
  nose.position.set(0, -.005, .17);
  head.add(nose);

  const mouth = mesh(new THREE.TorusGeometry(.025, .005, 5, 12, Math.PI), dark);
  mouth.position.set(0, -.045, .16);
  mouth.rotation.z = Math.PI;
  head.add(mouth);

  const ears = [];
  [-1, 1].forEach(side => {
    const ear = mesh(new THREE.ConeGeometry(.055, .12, 4), bodyMat);
    ear.position.set(side * .085, .13, -.005);
    ear.rotation.z = side * .22;
    ear.rotation.y = .2;
    head.add(ear);
    const inner = mesh(new THREE.ConeGeometry(.028, .07, 4), pink);
    inner.position.set(side * .085, .12, .01);
    inner.rotation.z = side * .22;
    head.add(inner);
    ears.push(ear);
  });

  const eyeGroup = new THREE.Group();
  [-1, 1].forEach(side => {
    const white = mesh(new THREE.SphereGeometry(.035, 12, 10), whiteMat);
    white.position.set(side * .055, .02, .125);
    white.scale.set(1, 1.15, .35);
    eyeGroup.add(white);
    const pupil = mesh(new THREE.SphereGeometry(.02, 10, 8), eyeMat);
    const offX = def.derp ? (side === -1 ? -.006 : .008) : 0;
    const offY = def.derp && side === 1 ? .006 : 0;
    pupil.position.set(side * .055 + offX, .02 + offY, .145);
    pupil.scale.set(1, 1.25, .4);
    eyeGroup.add(pupil);
    const shine = mesh(new THREE.SphereGeometry(.005, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    shine.position.set(side * .05, .028, .157);
    eyeGroup.add(shine);
  });
  head.add(eyeGroup);

  if (stripeMat) {
    [-1, 0, 1].forEach((x, i) => {
      const s = mesh(new THREE.BoxGeometry(.012, .04, .012), stripeMat);
      s.position.set(x * .045, .11, .09);
      s.rotation.z = i === 0 ? 0 : x * .2;
      head.add(s);
    });
  }

  [-1, 1].forEach(side => {
    for (let i = 0; i < 2; i++) {
      const w = mesh(new THREE.BoxGeometry(.09, .004, .004), whiteMat);
      w.position.set(side * .11, -.02 - i * .015, .13);
      w.rotation.z = side * (i === 0 ? .12 : -.08);
      head.add(w);
    }
  });

  if (def.collar) {
    const collar = mesh(new THREE.TorusGeometry(.115, .016, 6, 20), M(def.collar, .6));
    collar.position.set(0, .35, .22);
    bodyRoot.add(collar);
    const bell = mesh(new THREE.SphereGeometry(.022, 10, 8), M(0xd8b56a, .3, .6));
    bell.position.set(0, .3, .33);
    bodyRoot.add(bell);
  }

  const legs = [];
  [-1, 1].forEach(side => {
    [-1, 1].forEach(front => {
      const pivot = new THREE.Group();
      pivot.position.set(side * .095, .21, front > 0 ? .18 : -.2);
      bodyRoot.add(pivot);
      const leg = mesh(new THREE.CapsuleGeometry(.032, .12, 5, 10), bodyMat);
      leg.position.y = -.08;
      pivot.add(leg);
      const paw = mesh(new THREE.SphereGeometry(.043, 10, 8), def.whitePaws ? whiteMat : bodyMat);
      paw.position.set(0, -.16, .01);
      paw.scale.set(1, .72, 1.25);
      pivot.add(paw);
      legs.push({ pivot, phase: (front > 0 ? 0 : Math.PI) + (side > 0 ? .3 : 0) });
    });
  });

  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, .29, -.28);
  bodyRoot.add(tailGroup);
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, .1, -.12),
    new THREE.Vector3(.02, .2, -.2),
    new THREE.Vector3(.04, .22, -.08)
  ]);
  const tailGeo = new THREE.TubeGeometry(curve, 16, stripeMat ? .032 : .026, 8, false);
  const tail = mesh(tailGeo, bodyMat);
  tailGroup.add(tail);
  if (stripeMat) {
    [0.35, 0.65].forEach(t => {
      const p = curve.getPoint(t);
      const ring = mesh(new THREE.TorusGeometry(.031, .007, 5, 12), stripeMat);
      ring.position.copy(p);
      ring.rotation.x = Math.PI / 2;
      tailGroup.add(ring);
    });
  }

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(.24, 20),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = .006;
  shadow.scale.set(1.2 * def.fat, .8, 1.2 * def.fat);

  let nextBlink = 2 + Math.random() * 3, blinkT = 0;

  function update(dt, time, state) {
    const run = state === 'run';
    const leap = state === 'leap';
    legs.forEach((l, i) => {
      if (leap) {
        l.pivot.rotation.x = i < 2 ? -1.15 : .85;
      } else if (run) {
        l.pivot.rotation.x = Math.sin(time * 17 + l.phase) * .72;
      } else {
        l.pivot.rotation.x += (0 - l.pivot.rotation.x) * Math.min(1, dt * 10);
      }
    });
    if (leap) {
      bodyRoot.rotation.x = -.18;
      bodyRoot.position.y = 0;
      tailGroup.rotation.x = -.55;
      tailGroup.rotation.z = Math.sin(time * 8) * .12;
      head.rotation.x = .12;
    } else if (run) {
      bodyRoot.rotation.x = 0;
      bodyRoot.position.y = .014 + Math.sin(time * 17) * .012;
      tailGroup.rotation.x = -.18;
      tailGroup.rotation.z = Math.sin(time * 6) * .28;
      head.rotation.x = 0;
    } else {
      bodyRoot.rotation.x = .06;
      bodyRoot.position.y += (-.02 - bodyRoot.position.y) * Math.min(1, dt * 6);
      tailGroup.rotation.x = -.05;
      tailGroup.rotation.z = Math.sin(time * 1.8) * .38;
      head.rotation.z = Math.sin(time * 1.2) * .05;
      head.rotation.x = 0;
    }
    ears.forEach((e, i) => {
      e.rotation.x = Math.sin(time * 1.7 + i * 1.4) * .04;
    });
    if (time > nextBlink) {
      blinkT = .1;
      nextBlink = time + 2.4 + Math.random() * 3.5;
    }
    if (blinkT > 0) {
      blinkT -= dt;
      eyeGroup.scale.y = .12;
    } else {
      eyeGroup.scale.y += (1 - eyeGroup.scale.y) * Math.min(1, dt * 16);
    }
  }

  return { group, shadow, def, update };
}
