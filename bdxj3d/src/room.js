import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const std = (color, roughness = 0.82, metalness = 0.0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(w, h, d, mat, x, y, z, cast = true, receive = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = receive;
  return m;
}

function cityTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  const sky = g.createLinearGradient(0, 0, 0, 512);
  sky.addColorStop(0, '#0a1526');
  sky.addColorStop(0.55, '#17263d');
  sky.addColorStop(1, '#0c1420');
  g.fillStyle = sky;
  g.fillRect(0, 0, 512, 512);

  g.fillStyle = '#f4e7c4';
  g.beginPath(); g.arc(398, 92, 30, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(244,231,196,.12)';
  g.beginPath(); g.arc(398, 92, 62, 0, Math.PI * 2); g.fill();

  let x = -20;
  while (x < 540) {
    const w = 34 + Math.random() * 52;
    const h = 150 + Math.random() * 260;
    const top = 512 - h;
    g.fillStyle = ['#0b1220', '#0d1626', '#091120'][Math.floor(Math.random() * 3)];
    g.fillRect(x, top, w, h);
    for (let wy = top + 14; wy < 500; wy += 18) {
      for (let wx = x + 7; wx < x + w - 8; wx += 14) {
        if (Math.random() > 0.45) {
          g.fillStyle = Math.random() > 0.82 ? '#ffd08a' : '#7fa6c9';
          g.globalAlpha = 0.35 + Math.random() * 0.5;
          g.fillRect(wx, wy, 5, 7);
        }
      }
    }
    g.globalAlpha = 1;
    x += w + 8;
  }

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function posterTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 640;
  const g = c.getContext('2d');
  g.fillStyle = '#1b1720';
  g.fillRect(0, 0, 512, 640);
  g.strokeStyle = '#4a4056';
  g.lineWidth = 10;
  g.strokeRect(16, 16, 480, 608);
  g.fillStyle = '#9d8fa8';
  g.font = '600 34px "Microsoft YaHei", sans-serif';
  g.textAlign = 'center';
  g.fillText('年 度 优 秀 员 工', 256, 86);
  g.fillStyle = '#2b2434';
  g.beginPath(); g.arc(256, 240, 82, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#5b4f68';
  g.beginPath(); g.arc(256, 220, 34, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(256, 306, 58, 36, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#6b5f78';
  g.font = '500 40px "Microsoft YaHei", sans-serif';
  g.fillText('小 江', 256, 440);
  g.fillStyle = '#4a4056';
  g.font = '400 26px "Microsoft YaHei", sans-serif';
  g.fillText('2026 · 最佳挨打奖', 256, 512);
  g.strokeStyle = '#7d3b3b';
  g.lineWidth = 6;
  g.beginPath(); g.arc(400, 540, 46, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#7d3b3b';
  g.font = '500 22px "Microsoft YaHei", sans-serif';
  g.fillText('特 批', 400, 548);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function screenTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 288;
  const g = c.getContext('2d');
  g.fillStyle = '#101820';
  g.fillRect(0, 0, 512, 288);
  g.fillStyle = '#16222c';
  g.fillRect(0, 0, 512, 34);
  g.fillStyle = '#5d7f96';
  g.font = '16px monospace';
  g.fillText('● ● ●', 16, 23);
  const colors = ['#3f7d6b', '#6a5d9c', '#8a6a3c', '#3c6c8a'];
  for (let i = 0; i < 13; i++) {
    const y = 56 + i * 16;
    g.fillStyle = '#2c3a44';
    g.fillRect(24, y, 40 + (i % 4) * 12, 5);
    g.fillStyle = colors[i % 4];
    g.fillRect(80, y, 90 + Math.random() * 150, 5);
    if (i % 3 === 0) { g.fillStyle = '#455a68'; g.fillRect(250, y, 80, 5); }
  }
  g.fillStyle = '#2b6b52';
  g.fillRect(400, 210, 84, 54);
  g.fillStyle = '#8fd3b4';
  g.font = '600 18px sans-serif';
  g.fillText('DEMO', 420, 244);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function woodTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#4a3426'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    const y = i * 64;
    g.fillStyle = i % 2 ? '#523a2b' : '#463022';
    g.fillRect(0, y, 512, 62);
    g.strokeStyle = '#241810'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, y + 62); g.lineTo(512, y + 62); g.stroke();
    for (let k = 0; k < 26; k++) {
      g.strokeStyle = 'rgba(96,64,44,' + (0.08 + Math.random() * 0.18) + ')';
      g.lineWidth = 1;
      const gy = y + 4 + Math.random() * 54;
      g.beginPath();
      g.moveTo(Math.random() * 512, gy);
      g.lineTo(Math.random() * 512, gy + (Math.random() * 2 - 1) * 3);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function buildRoom(scene, world) {
  const wood = std(0x3a2a20, 0.85);
  const darkWood = std(0x2a1d17, 0.9);
  const metal = std(0x5a5f6a, 0.35, 0.7);
  const wallMat = std(0x191420, 0.96);
  const fabric = std(0x3d2320, 0.98);

  const floorMat = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: .86 });
  const floor = box(13, 0.2, 8, floorMat, 0, -0.1, -0.4, false, true);
  scene.add(floor);

  const floorBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(6.5, 0.1, 4)) });
  floorBody.position.set(0, -0.1, -0.4);
  world.addBody(floorBody);

  const rug = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.4), fabric);
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(-0.9, 0.003, 0.25);
  rug.receiveShadow = true;
  scene.add(rug);

  const rugEdge = new THREE.Mesh(new THREE.RingGeometry(2.62, 2.78, 48), std(0x5a332a, 0.95));
  rugEdge.rotation.x = -Math.PI / 2;
  rugEdge.scale.set(1.36, 0.62, 1);
  rugEdge.position.set(-0.9, 0.006, 0.25);
  scene.add(rugEdge);

  const wall = box(13, 4.8, 0.2, wallMat, 0, 2.3, -3.9, false, true);
  scene.add(wall);
  const wallBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(6.5, 2.4, 0.1)) });
  wallBody.position.set(0, 2.3, -3.9);
  world.addBody(wallBody);

  const sideL = box(0.2, 4.8, 8, wallMat, -6.6, 2.3, -0.4, false, true);
  const sideR = box(0.2, 4.8, 8, wallMat, 6.6, 2.3, -0.4, false, true);
  scene.add(sideL, sideR);
  [-6.6, 6.6].forEach(x => {
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(0.1, 2.4, 4)) });
    b.position.set(x, 2.3, -0.4);
    world.addBody(b);
  });

  const pane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.9, 1.9),
    new THREE.MeshBasicMaterial({ map: cityTexture() })
  );
  pane.position.set(-3.15, 2.35, -3.78);
  scene.add(pane);

  const frameMat = std(0x2a2334, 0.7);
  scene.add(box(3.1, 0.1, 0.12, frameMat, -3.15, 3.32, -3.72));
  scene.add(box(3.1, 0.1, 0.12, frameMat, -3.15, 1.38, -3.72));
  scene.add(box(0.1, 2.04, 0.12, frameMat, -4.7, 2.35, -3.72));
  scene.add(box(0.1, 2.04, 0.12, frameMat, -1.6, 2.35, -3.72));
  scene.add(box(0.06, 2.04, 0.1, frameMat, -3.15, 2.35, -3.72));

  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(1.35, 1.68),
    new THREE.MeshStandardMaterial({ map: posterTexture(), roughness: 0.95 })
  );
  poster.position.set(2.1, 2.45, -3.78);
  scene.add(poster);

  const deskTop = box(3.6, 0.1, 1.25, wood, 2.55, 0.96, -1.55);
  scene.add(deskTop);
  scene.add(box(0.1, 0.95, 0.1, darkWood, 0.9, 0.48, -2.1));
  scene.add(box(0.1, 0.95, 0.1, darkWood, 4.2, 0.48, -2.1));
  scene.add(box(0.1, 0.95, 0.1, darkWood, 0.9, 0.48, -1.0));
  scene.add(box(0.1, 0.95, 0.1, darkWood, 4.2, 0.48, -1.0));
  scene.add(box(3.4, 0.5, 0.06, darkWood, 2.55, 0.55, -2.14));

  const deskBody = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(1.8, 0.05, 0.63)) });
  deskBody.position.set(2.55, 0.96, -1.55);
  world.addBody(deskBody);

  const monitor = new THREE.Group();
  const screenMat = new THREE.MeshBasicMaterial({ map: screenTexture() });
  const screen = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.6, 0.055), screenMat);
  screen.position.y = 1.62;
  screen.castShadow = true;
  monitor.add(screen);
  monitor.add(box(1.13, 0.68, 0.07, metal, 0, 1.62, -0.03));
  monitor.add(box(0.1, 0.28, 0.1, metal, 0, 1.2, 0));
  monitor.add(box(0.5, 0.04, 0.26, metal, 0, 1.06, 0.02));
  monitor.position.set(2.3, 0, -1.65);
  scene.add(monitor);

  const keyboard = box(0.8, 0.035, 0.26, std(0x1d1a24, 0.9), 2.3, 1.03, -0.95);
  scene.add(keyboard);
  scene.add(box(0.86, 0.02, 0.3, std(0x2f2b38, 0.8), 2.3, 1.008, -0.95));

  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.17, 20), std(0x7a4c42, 0.7));
  mug.position.set(3.55, 1.095, -1.1);
  mug.castShadow = true;
  scene.add(mug);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 16), std(0x7a4c42, 0.7));
  handle.position.set(3.65, 1.1, -1.1);
  handle.rotation.y = Math.PI / 2;
  scene.add(handle);

  const papers = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), std(0xd7cdbe, 0.95));
    p.rotation.x = -Math.PI / 2;
    p.rotation.z = Math.random() * Math.PI;
    p.position.set(3.2 + Math.random() * 0.4, 1.015, -0.85 + Math.random() * 0.15);
    papers.add(p);
  }
  scene.add(papers);

  const lamp = new THREE.Group();
  lamp.add(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.06, 20), metal));
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.75, 10), metal);
  arm.position.set(0, 0.38, 0);
  arm.rotation.z = -0.35;
  lamp.add(arm);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.26, 24, 1, true), std(0x3c3446, 0.5, 0.4));
  shade.position.set(-0.14, 0.76, 0);
  shade.rotation.z = 0.5;
  lamp.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffd9a0 }));
  bulb.position.set(-0.18, 0.68, 0);
  lamp.add(bulb);
  lamp.position.set(4.15, 1.0, -1.7);
  scene.add(lamp);

  const plant = new THREE.Group();
  plant.add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.17, 0.32, 16), std(0x5a3f34, 0.85)));
  const leafMat = std(0x2f5c42, 0.8);
  for (let i = 0; i < 6; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), leafMat);
    leaf.position.set(Math.cos(i * 1.1) * 0.18, 0.35 + Math.random() * 0.28, Math.sin(i * 1.1) * 0.18);
    leaf.scale.set(0.7, 1.4, 0.7);
    leaf.castShadow = true;
    plant.add(leaf);
  }
  plant.position.set(-5.7, 0.16, -2.5);
  scene.add(plant);

  scene.add(new THREE.HemisphereLight(0x849cbe, 0x1e151a, 1.05));

  const keyLight = new THREE.DirectionalLight(0xa9c3e8, 1.8);
  keyLight.position.set(-4, 6.5, 4.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -7;
  keyLight.shadow.camera.right = 7;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -2;
  keyLight.shadow.bias = -0.0015;
  scene.add(keyLight);

  const warm = new THREE.SpotLight(0xffb066, 55, 10, 0.62, 0.65, 1.4);
  warm.position.set(4.0, 2.9, -1.5);
  warm.target.position.set(-0.45, 1.0, 0);
  warm.castShadow = true;
  warm.shadow.mapSize.set(1024, 1024);
  scene.add(warm, warm.target);

  const winLight = new THREE.PointLight(0x6f9bd1, 13, 10, 2);
  winLight.position.set(-3.0, 2.3, -2.8);
  scene.add(winLight);

  const fill = new THREE.PointLight(0xffe0bd, 16, 12, 2);
  fill.position.set(1.4, 2.3, 4.4);
  scene.add(fill);

  const floorFill = new THREE.PointLight(0xffd2a0, 22, 12, 2);
  floorFill.position.set(-2.6, 2.0, 3.6);
  scene.add(floorFill);

  const floorKey = new THREE.DirectionalLight(0xffd9b8, .6);
  floorKey.position.set(0, 3.2, 5.5);
  floorKey.target.position.set(-0.5, 0, 0);
  scene.add(floorKey, floorKey.target);

  return { warm };
}
