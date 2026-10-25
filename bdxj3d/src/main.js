import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { buildRoom } from './room.js';
import { createCharacter } from './character.js';
import { ITEMS, buildItemMesh, createItemBody } from './items.js';
import { createCat, CAT_DEFS } from './cats.js';
import { VOICES } from './voice.js';

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];

const ICONS = {
  pencil: '<path d="M11 29 27 13l4 4L15 33Z"/><path d="M11 29l-3 7 7-3"/><path d="M25 15l4 4"/>',
  keyboard: '<rect x="6" y="13" width="28" height="15" rx="3"/><path d="M10 18h2M15 18h2M20 18h2M25 18h2M30 18h0M10 23h22"/>',
  stapler: '<path d="M8 27h18l6-8H14Z"/><path d="M14 19v-4h13v4"/><path d="M8 27v3h23"/>',
  folder: '<path d="M7 12h9l3 4h14v17H7Z"/><path d="M7 19h26"/>',
  mug: '<path d="M10 14h16v13a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z"/><path d="M26 17h3a4 4 0 0 1 0 8h-3"/><path d="M14 10q2 2 0 4M20 10q2 2 0 4"/>',
  printer: '<rect x="8" y="18" width="24" height="12" rx="2"/><path d="M13 18v-6h14v6"/><rect x="13" y="24" width="14" height="7" rx="1"/>',
  chair: '<path d="M13 35v-8M27 35v-8"/><path d="M12 13h16v11a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4Z"/><path d="M11 35h18"/>',
  monitor: '<rect x="6" y="9" width="28" height="18" rx="2"/><path d="M20 27v6M14 33h12"/>',
  slipper: '<path d="M10 23c0-8 4-11 10-11s10 3 10 11c0 6-4 9-10 9s-10-3-10-9Z"/><path d="M14 21c4 3 8 3 12 0"/>',
  pillow: '<rect x="9" y="9" width="22" height="22" rx="8"/><path d="M13 13l4 4M27 13l-4 4M13 27l4-4M27 27l-4-4"/>',
  pan: '<circle cx="16" cy="22" r="9"/><path d="M25 22h10"/>',
  durian: '<path d="M20 8l3 5 5-2-2 5 5 4-5 3 2 6-6-2-2 5-3-5-5 2 2-6-5-3 5-4-2-5 5 2Z"/>',
  hanger: '<path d="M20 12c0-4 6-4 6 0"/><path d="M20 12 7 27h26Z"/>',
  mop: '<path d="M27 6 16 24"/><path d="M11 23l9 7"/><path d="M9 27c6 8 15 7 19 3"/>',
  milktea: '<path d="M13 13h14l-2 19h-10Z"/><path d="M11 13h18"/><path d="M22 13 26 5"/><circle cx="17" cy="27" r="1.2"/><circle cx="22" cy="24" r="1.2"/>',
  cake: '<path d="M8 28h24v-8l-12-6-12 6Z"/><path d="M8 28v4h24v-4"/><path d="M20 14v-4"/>',
  egg: '<path d="M20 7c7 0 11 9 11 15a11 11 0 0 1-22 0c0-6 4-15 11-15Z"/>',
  watermelon: '<path d="M6 18h28a14 14 0 0 1-28 0Z"/><path d="M11 18a9 9 0 0 0 18 0"/>',
  noodle: '<path d="M11 14h18l-2 17H13Z"/><path d="M8 14h24"/><path d="M14 9q3-3 6 0t6 0"/>',
  remote: '<rect x="13" y="6" width="14" height="28" rx="5"/><circle cx="20" cy="12" r="2"/><path d="M20 19v9"/>',
  suona: '<path d="M7 27l10-4v-8L7 11Z"/><path d="M17 22h7v-4h-7"/><path d="M24 21l8-5v12l-8-5"/>',
  speaker: '<rect x="9" y="7" width="22" height="26" rx="3"/><circle cx="20" cy="15" r="4"/><circle cx="20" cy="26" r="4"/>',
  flag: '<path d="M12 7h16v21l-8-5-8 5Z"/><path d="M16 13h8M16 18h8"/>',
  cat: '<path d="M11 13l2 8a10 10 0 0 0 14 0l2-8-6 3h-6Z"/><path d="M16 22h.01M24 22h.01"/><path d="M20 26q-3 2-5 0M20 26q3 2 5 0"/>'
};

const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.38;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08070c);
scene.fog = new THREE.FogExp2(0x08070c, 0.016);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 120);
const camBase = new THREE.Vector3(0, 1.95, 6.6);
const camLook = new THREE.Vector3(-0.2, 1.05, 0);
function fitCamera() {
  const a = window.innerWidth / window.innerHeight;
  if (a < 0.8) {
    camera.fov = 52;
    camBase.set(0, 2.1, 9.8);
  } else {
    camera.fov = 40;
    camBase.set(0, 1.95, 7.6);
  }
  camera.aspect = a;
  camera.position.copy(camBase);
  camera.lookAt(camLook);
  camera.updateProjectionMatrix();
}
fitCamera();

const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.defaultContactMaterial.friction = 0.45;
world.defaultContactMaterial.restitution = 0.24;

buildRoom(scene, world);
const CH = createCharacter(scene, world);
CH.setExpression('smug');
CH.setDamageRatio(0);

const ROUND_TARGETS = [6000, 6500, 7000, 7000, 7500];
const ROUND_SHIELDS = [450, 500, 550, 600, 650];
const TOTAL_ROUNDS = 5;
const ROUND_NAMES = ['先热个身', '激光登场', '猫猫助阵', '黑洞时间', '最后三件'];
const ITEM_UNLOCK = [1, 1, 1, 1, 1, 2, 3, 3, 1, 1, 2, 4, 2, 3, 2, 2, 2, 3, 3, 1, 4, 4, 4, 4];
const SKILL_UNLOCK = { laser: 2, hole: 4, meteor: 4, lightning: 5, glove: 5, bowl: 5 };
const CAT_UNLOCK = { tiaotiao: 3, daidai: 3, tuantuan: 4, token: 4 };
const SKILL_NAMES = { laser: '激光波', hole: '黑洞', meteor: '陨石', lightning: '雷击', glove: '拳套', bowl: '保龄球' };

const G = {
  started: false, playing: false, round: 1, target: 6000, dmg: 0, phase: 1,
  shield: 0, shieldMax: 0, combo: 0, maxCombo: 0, hits: 0, selected: 0,
  startAt: 0, fightEndAt: 0, lastHit: 0, landedFx: false, lastBound: 0, lastEvent: 0, lastSay: '',
  items: [], fading: [], lasers: [], hole: null, cats: [], skills: [], skillCd: {}, knocked: false, mode: 'item', lastLaser: 0, recoverAt: 0, tween: null, expUntil: 0, shake: 0,
  thrownOnce: false
};

let hintTimer = null, unlockTimer = null, unlockDelayTimer = null;
function itemUnlockRound(i) { return ITEM_UNLOCK[i] || 1; }
function skillUnlockRound(id) { return SKILL_UNLOCK[id] || 1; }
function catUnlockRound(id) { return CAT_UNLOCK[id] || 1; }
function isItemUnlocked(i) { return G.round >= itemUnlockRound(i); }
function isSkillUnlocked(id) { return G.round >= skillUnlockRound(id); }
function isCatUnlocked(id) { return G.round >= catUnlockRound(id); }
function flashHint(text, dur) {
  hintEl.textContent = text;
  hintEl.classList.remove('hide');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => hintEl.classList.add('hide'), dur || 2300);
}
function unlockPartsFor(round) {
  const items = ITEMS.reduce((n, it, i) => n + (ITEM_UNLOCK[i] === round ? 1 : 0), 0);
  const skills = Object.keys(SKILL_UNLOCK).filter(k => SKILL_UNLOCK[k] === round)
    .map(k => SKILL_NAMES[k] || (SKILL_DEFS.find(d => d.id === k) || {}).name || k);
  const cats = Object.keys(CAT_UNLOCK).filter(k => CAT_UNLOCK[k] === round).map(k => CAT_DEFS[k].name);
  const parts = [];
  if (skills.length) parts.push(skills.join('、'));
  if (cats.length) parts.push(cats.join('、'));
  if (items) parts.push(items + ' 件新道具');
  return parts.join(' · ');
}
function showUnlockForRound(round) {
  let text;
  if (round === 1) text = '基础道具 8 件';
  else if (round <= TOTAL_ROUNDS) text = unlockPartsFor(round) ? '解锁 · ' + unlockPartsFor(round) : '';
  else text = '加时赛 · 全部解锁';
  if (!text) return;
  const el = $('#unlock');
  el.textContent = text;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(unlockTimer);
  unlockTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
function scheduleUnlock(round) {
  clearTimeout(unlockDelayTimer);
  unlockDelayTimer = setTimeout(() => showUnlockForRound(round), 1900);
}
function applyUnlockUI() {
  if (!slotsEl) return;
  const unlockedCount = ITEMS.reduce((n, it, i) => n + (isItemUnlocked(i) ? 1 : 0), 0);
  Array.from(slotsEl.children).forEach((c, i) => {
    const locked = !isItemUnlocked(i);
    const was = c.classList.contains('locked');
    c.classList.toggle('locked', locked);
    if (was && !locked) {
      c.classList.add('unlockPop');
      setTimeout(() => c.classList.remove('unlockPop'), 650);
    }
  });
  const laserLocked = !isSkillUnlocked('laser');
  const holeLocked = !isSkillUnlocked('hole');
  const laserWas = laserBtn.classList.contains('locked');
  const holeWas = holeBtn.classList.contains('locked');
  laserBtn.classList.toggle('locked', laserLocked);
  holeBtn.classList.toggle('locked', holeLocked);
  if (laserWas && !laserLocked) { laserBtn.classList.add('unlockPop'); setTimeout(() => laserBtn.classList.remove('unlockPop'), 650); }
  if (holeWas && !holeLocked) { holeBtn.classList.add('unlockPop'); setTimeout(() => holeBtn.classList.remove('unlockPop'), 650); }
  powerBtns.forEach((b, key) => {
    const parts = key.split(':');
    const kind = parts[0], id = parts[1];
    const r = kind === 'cat' ? catUnlockRound(id) : skillUnlockRound(id);
    const locked = G.round < r;
    const was = b.classList.contains('locked');
    b.classList.toggle('locked', locked);
    if (was && !locked) {
      b.classList.add('unlockPop');
      setTimeout(() => b.classList.remove('unlockPop'), 650);
    }
  });
  const sub = $('#traySub');
  if (sub) sub.textContent = '无冷却 · ' + unlockedCount + ' / 24 件 · 边打边解锁';
}
let chair = null;
let chairBroken = null;

/* ---------- sound ---------- */
let ac = null, master = null, comp = null, reverb = null, wet = null, noiseBuf = null, muted = false, ambienceStarted = false;
const voiceBuffers = {};
let lastVoiceAt = 0;

function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ac = new AC();

  comp = ac.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 20;
  comp.ratio.value = 5;
  comp.attack.value = 0.004;
  comp.release.value = 0.22;
  comp.connect(ac.destination);

  master = ac.createGain();
  master.gain.value = 0.6;
  master.connect(comp);

  reverb = ac.createConvolver();
  const irLen = Math.floor(ac.sampleRate * 1.8);
  const ir = ac.createBuffer(2, irLen, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < irLen; i++) {
      const t = i / irLen;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2.4) * (1 - Math.exp(-i / 400));
    }
  }
  reverb.buffer = ir;
  wet = ac.createGain();
  wet.gain.value = 0.26;
  reverb.connect(wet);
  wet.connect(master);

  const nLen = Math.floor(ac.sampleRate * 1.2);
  noiseBuf = ac.createBuffer(1, nLen, ac.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nLen; i++) nd[i] = Math.random() * 2 - 1;

  Object.entries(VOICES).forEach(([key, url]) => {
    const b64 = url.split(',')[1];
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    ac.decodeAudioData(bytes.buffer, buf => { voiceBuffers[key] = buf; }, () => {});
  });

  startAmbience();
}

function connectOut(node, pan = 0, wetAmt = 0) {
  let outNode = node;
  if (ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = clamp(pan, -1, 1);
    node.connect(p);
    outNode = p;
  }
  outNode.connect(master);
  if (wetAmt > 0 && reverb) {
    const send = ac.createGain();
    send.gain.value = wetAmt;
    outNode.connect(send);
    send.connect(reverb);
  }
}

function noiseBurst(o) {
  if (!ac || muted) return;
  const dur = o.dur == null ? .12 : o.dur;
  const t = ac.currentTime + (o.delay || 0);
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  src.playbackRate.value = o.rate == null ? rand(0.92, 1.08) : o.rate;
  const f = ac.createBiquadFilter();
  f.type = o.type || 'bandpass';
  f.frequency.setValueAtTime(o.freq || 1200, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(40, o.to), t + dur);
  f.Q.value = o.q == null ? .8 : o.q;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain == null ? .12 : o.gain, t + (o.attack || .004));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g);
  connectOut(g, o.pan || 0, o.wet || 0);
  src.start(t); src.stop(t + dur + .05);
}

function toneBurst(o) {
  if (!ac || muted) return;
  const dur = o.dur == null ? .2 : o.dur;
  const t = ac.currentTime + (o.delay || 0);
  const osc = ac.createOscillator();
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(Math.max(20, o.f1 || 440), t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.f2), t + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain == null ? .08 : o.gain, t + (o.attack || .006));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  connectOut(g, o.pan || 0, o.wet || 0);
  osc.start(t); osc.stop(t + dur + .03);
}

function startAmbience() {
  if (ambienceStarted || !ac) return;
  ambienceStarted = true;
  const t = ac.currentTime;
  const room = ac.createBufferSource();
  room.buffer = noiseBuf; room.loop = true;
  const rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 170; rf.Q.value = .4;
  const rg = ac.createGain(); rg.gain.value = .012;
  room.connect(rf); rf.connect(rg); rg.connect(master); room.start(t);

  const hum = ac.createOscillator(); hum.type = 'sine'; hum.frequency.value = 54;
  const hg = ac.createGain(); hg.gain.value = .005;
  hum.connect(hg); hg.connect(master); hum.start(t);

  const city = ac.createBufferSource();
  city.buffer = noiseBuf; city.loop = true;
  const cf = ac.createBiquadFilter(); cf.type = 'bandpass'; cf.frequency.value = 430; cf.Q.value = .55;
  const cg = ac.createGain(); cg.gain.value = .004;
  city.connect(cf); cf.connect(cg); cg.connect(master); city.start(t);
}

const METAL = new Set(['stapler', 'mug', 'chair', 'monitor', 'pan', 'durian', 'hanger', 'suona', 'speaker', 'printer']);
const SPLASH = new Set(['milktea', 'cake', 'egg', 'watermelon', 'noodle']);
const PAPERY = new Set(['flag', 'folder', 'pencil', 'keyboard', 'remote']);
const WOOD = new Set(['chair', 'monitor', 'printer', 'mop']);

function playImpact(item, speed, pan) {
  if (!ac || muted) return;
  const mass = clamp(item.mass / 2.5, .18, 1.25);
  const hit = clamp(speed / 10, .55, 1.6);
  toneBurst({ f1: 132, f2: 42, dur: .16 + .18 * mass, gain: (.06 + .16 * mass) * hit, type: 'sine', pan, wet: .12 });
  noiseBurst({ dur: .08, freq: 900, q: .9, gain: (.05 + .08 * mass) * hit, pan, wet: .08 });

  if (METAL.has(item.id)) {
    noiseBurst({ dur: .12, freq: 2700, q: 1.1, gain: .09 + .05 * mass, type: 'highpass', pan, wet: .2 });
    [1, 1.61, 2.42].forEach((m, i) => toneBurst({
      f1: 540 * m * rand(.98, 1.02), f2: 505 * m,
      dur: .3 - i * .05, gain: .05 - i * .008,
      type: i ? 'triangle' : 'sine', pan, wet: .32, delay: .005 * i
    }));
  } else if (SPLASH.has(item.id)) {
    noiseBurst({ dur: .26, freq: 1900, to: 340, q: .7, gain: .11, pan, wet: .16 });
    for (let i = 0; i < 3; i++) toneBurst({
      f1: rand(420, 860), f2: rand(240, 420), dur: .12, gain: .03,
      type: 'sine', pan, wet: .2, delay: .03 * i
    });
  } else if (item.id === 'pillow' || item.id === 'slipper' || item.id === 'cat') {
    noiseBurst({ dur: .12, freq: 420, q: .6, gain: .11, type: 'lowpass', pan, wet: .06 });
    toneBurst({ f1: 175, f2: 78, dur: .14, gain: .09, pan, wet: .05 });
    if (item.id === 'cat') {
      toneBurst({ f1: 720, f2: 1150, dur: .18, gain: .06, type: 'triangle', pan, wet: .2 });
      toneBurst({ f1: 1150, f2: 680, dur: .16, gain: .04, type: 'triangle', pan, wet: .2, delay: .12 });
    }
  } else if (PAPERY.has(item.id)) {
    for (let i = 0; i < 3; i++) noiseBurst({
      dur: .04, freq: rand(2400, 3900), q: 1.4, gain: .045,
      type: 'bandpass', pan, wet: .08, delay: .02 * i
    });
  } else {
    noiseBurst({ dur: .14, freq: 640, q: .7, gain: .09, type: 'bandpass', pan, wet: .1 });
  }

  if (item.id === 'suona' || item.id === 'speaker') {
    toneBurst({ f1: 440, f2: 660, dur: .26, gain: .05, type: 'sawtooth', pan, wet: .35 });
    toneBurst({ f1: 660, f2: 880, dur: .22, gain: .035, type: 'sawtooth', pan, wet: .35, delay: .05 });
  }

  for (let i = 0; i < 3; i++) noiseBurst({
    dur: .03, freq: rand(1800, 3600), q: 1.2, gain: .022,
    type: 'highpass', pan, wet: .1, delay: .035 + Math.random() * .09
  });
}

function throwWhoosh(item, pan, dist) {
  if (!ac || muted) return;
  const d = clamp(dist || 2, .5, 7);
  noiseBurst({ dur: .2 + Math.min(.16, d * .03), freq: 300, to: 1750, q: .8, gain: .05 + Math.min(.05, item.mass * .014), type: 'bandpass', pan, wet: .08 });
  toneBurst({ f1: 190, f2: 90, dur: .18, gain: .025, pan, wet: .05 });
}

function laserSound(pan) {
  if (!ac || muted) return;
  noiseBurst({ dur: .18, freq: 1200, to: 3300, q: 1, gain: .05, type: 'highpass', pan, wet: .12 });
  toneBurst({ f1: 220, f2: 980, dur: .16, gain: .045, type: 'sawtooth', pan, wet: .2 });
  noiseBurst({ dur: .3, freq: 3200, q: .8, gain: .16, type: 'highpass', pan, wet: .3, delay: .12 });
  toneBurst({ f1: 1500, f2: 160, dur: .32, gain: .11, type: 'sawtooth', pan, wet: .35, delay: .12 });
  toneBurst({ f1: 100, f2: 38, dur: .4, gain: .2, type: 'sine', pan, wet: .2, delay: .12 });
  toneBurst({ f1: 2400, f2: 600, dur: .45, gain: .03, type: 'sine', pan, wet: .65, delay: .2 });
}

function chairImpact(pan) {
  noiseBurst({ dur: .1, freq: 520, q: .7, gain: .1, type: 'bandpass', pan, wet: .1 });
  toneBurst({ f1: 190, f2: 90, dur: .12, gain: .08, pan, wet: .05 });
}

function chairBreakSound(pan) {
  noiseBurst({ dur: .42, freq: 900, q: .5, gain: .2, type: 'lowpass', pan, wet: .15 });
  noiseBurst({ dur: .08, freq: 2400, q: 1, gain: .12, type: 'highpass', pan, wet: .2 });
  toneBurst({ f1: 130, f2: 38, dur: .46, gain: .2, pan, wet: .2 });
  toneBurst({ f1: 240, f2: 70, dur: .35, gain: .05, type: 'sawtooth', pan, wet: .1, delay: .04 });
}

function landThud(power, pan) {
  noiseBurst({ dur: .14, freq: 300, q: .6, gain: .07 * power, type: 'lowpass', pan, wet: .08 });
  toneBurst({ f1: 90, f2: 36, dur: .2, gain: .08 * power, pan, wet: .08 });
}

function typeTick() {
  toneBurst({ f1: rand(1500, 2200), f2: 1200, dur: .018, gain: .012, type: 'square', pan: rand(-.15, .15), wet: .02 });
}

function uiClick() {
  toneBurst({ f1: 900, f2: 650, dur: .04, gain: .03, type: 'triangle', wet: .03 });
}

function charVoice(power) {
  if (!ac || muted) return;
  const now = performance.now();
  if (now - lastVoiceAt < 420) return;
  lastVoiceAt = now;
  let keys;
  if (G.phase === 3 && Math.random() < .2) keys = ['cuo', 'bie', 'aiyo'];
  else if (power >= 55) keys = ['aolong', 'ah', 'aiyo'];
  else if (power >= 28) keys = ['aiyo', 'teng', 'bie', 'ah'];
  else keys = ['ah', 'aiyo'];
  const buf = voiceBuffers[pick(keys)] || voiceBuffers.ah;
  if (!buf) return;
  const src = ac.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rand(.94, 1.08);
  const g = ac.createGain();
  g.gain.value = clamp(.24 + (power || 30) / 260, .24, .46);
  const s = worldToScreen(new THREE.Vector3(CH.body.position.x, CH.body.position.y + .55, CH.body.position.z));
  connectOut(g, s.ok ? clamp((s.x / window.innerWidth - .5) * 1.4, -1, 1) : 0, .12);
  src.connect(g);
  src.start();
}

function chime() {
  if (!ac || muted) return;
  [523, 659, 784, 1046, 1318].forEach((f, i) => toneBurst({
    f1: f, f2: f, dur: .5, gain: .045, type: 'sine', wet: .55, delay: i * .12
  }));
  toneBurst({ f1: 261, f2: 261, dur: 1.2, gain: .035, type: 'sine', wet: .4 });
}

const SKILL_DEFS = [
  { id: 'meteor', name: '陨石', color: '#F0A93B', icon: '<circle cx="14" cy="9" r="4.5"/><path d="M3 21 10 14M2 13l5-3M8 22l3-5"/>' },
  { id: 'lightning', name: '雷击', color: '#8FE3FF', icon: '<path d="M13 2 5 13h6l-1 9 9-12h-6Z"/>' },
  { id: 'glove', name: '拳套', color: '#FF7A6A', icon: '<path d="M7 10V7a2 2 0 0 1 4 0v3M11 10V6a2 2 0 0 1 4 0v4M15 10V7a2 2 0 0 1 4 0v7a6 6 0 0 1-6 6h-1a7 7 0 0 1-7-7v-2a2 2 0 0 1 4 0v1"/>' },
  { id: 'bowl', name: '保龄球', color: '#C4B5FD', icon: '<circle cx="12" cy="12" r="8"/><circle cx="10" cy="9" r="1"/><circle cx="14" cy="8" r="1"/><circle cx="12" cy="12" r="1"/>' }
];
const CAT_ORDER = ['tiaotiao', 'daidai', 'tuantuan', 'token'];
const powerbar = $('#powerbar');
const powerBtns = new Map();

function catIcon(def) {
  const c = def.color, m = def.muzzle || '#F5F0E6', e = def.eye;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="none">' +
    '<path d="M4 10 4.6 3.8 8.7 7Q12 5.8 15.3 7L19.4 3.8 20 10A7.6 7.6 0 0 1 20 17Q16 20 12 20Q8 20 4 17A7.6 7.6 0 0 1 4 10Z" fill="' + c + '" stroke="rgba(255,255,255,.22)" stroke-width=".9"/>' +
    '<ellipse cx="12" cy="14" rx="3.3" ry="2.3" fill="' + m + '" opacity=".92"/>' +
    '<circle cx="9" cy="11.2" r="1.35" fill="' + e + '"/><circle cx="15" cy="11.2" r="1.35" fill="' + e + '"/>' +
    '<circle cx="9" cy="11.2" r=".52" fill="#15121b"/><circle cx="15" cy="11.2" r=".52" fill="#15121b"/>' +
    '</svg>';
}
function buildPowerbar() {
  const label = text => {
    const e = document.createElement('span');
    e.className = 'pw-label'; e.textContent = text; powerbar.appendChild(e);
  };
  const button = (kind, id, name, color, icon) => {
    const b = document.createElement('button');
    b.className = 'pw';
    b.style.setProperty('--accent', color);
    b.dataset.kind = kind; b.dataset.id = id;
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg><span>' + name + '</span>';
    if (kind === 'cat') b.innerHTML = catIcon(CAT_DEFS[id]) + '<span>' + name + '</span>';
    b.addEventListener('click', () => selectPower(kind, id));
    powerbar.appendChild(b);
    powerBtns.set(kind + ':' + id, b);
  };
  label('技能');
  SKILL_DEFS.forEach(d => button('skill', d.id, d.name, d.color, d.icon));
  const sep = document.createElement('span'); sep.className = 'pw-sep'; powerbar.appendChild(sep);
  label('猫猫');
  CAT_ORDER.forEach(id => button('cat', id, CAT_DEFS[id].name, CAT_DEFS[id].color, ''));
}
function clearPowerSel() {
  powerBtns.forEach(b => b.classList.remove('on'));
}
function setCatActive(id, on) {
  const b = powerBtns.get('cat:' + id);
  if (b) b.classList.toggle('active', on);
}
function selectPower(kind, id) {
  const pName = kind === 'cat' ? CAT_DEFS[id].name : (SKILL_NAMES[id] || (SKILL_DEFS.find(d => d.id === id) || {}).name || '');
  const unlockRound = kind === 'cat' ? catUnlockRound(id) : skillUnlockRound(id);
  if (G.round < unlockRound) { flashHint('第 ' + unlockRound + ' 轮解锁 · ' + pName); return; }
  G.mode = kind;
  G.power = id;
  laserBtn.classList.remove('on');
  holeBtn.classList.remove('on');
  Array.from(slotsEl.children).forEach(c => c.classList.remove('on'));
  clearPowerSel();
  const b = powerBtns.get(kind + ':' + id);
  if (b) b.classList.add('on');
  const name = kind === 'cat' ? CAT_DEFS[id].name : (SKILL_NAMES[id] || (SKILL_DEFS.find(d => d.id === id) || {}).name || '');
  hintEl.textContent = name + (kind === 'cat' ? ' 已就绪 · 点空白处召唤' : ' 已就绪 · 点空白处释放');
  hintEl.classList.remove('hide');
  setTimeout(() => hintEl.classList.add('hide'), 5200);
  uiClick();
}

/* ---------- UI ---------- */
const slotsEl = $('#slots');
const dmgNowEl = $('#dmgNow');
const dmgMaxEl = $('#dmgMax');
const barFill = $('#barFill');
const roundChip = $('#roundChip');
const phaseLabel = $('#phaseLabel');
const shieldChip = $('#shieldChip');
const bannerEl = $('#banner');
const b1 = $('#b1');
const b2 = $('#b2');
const sayEl = $('#say');
const comboEl = $('#combo');
const fxEl = $('#fx');
const hintEl = $('#hint');
const laserBtn = $('#laserBtn');
const holeBtn = $('#holeBtn');

ITEMS.forEach((it, i) => {
  const b = document.createElement('button');
  b.className = 'slot' + (i === 0 ? ' on' : '');
  b.style.setProperty('--accent', it.color);
  b.dataset.i = i;
  b.title = it.name + ' · 伤害 ' + it.dmg;
  b.innerHTML = '<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[it.id] || '') + '</svg><span class="slot-name">' + it.name + '</span>';
  b.addEventListener('click', () => selectItem(i));
  slotsEl.appendChild(b);
});
function selectItem(i) {
  if (!isItemUnlocked(i)) { flashHint('第 ' + itemUnlockRound(i) + ' 轮解锁 · ' + ITEMS[i].name); return; }
  G.selected = i;
  G.mode = 'item';
  laserBtn.classList.remove('on');
  holeBtn.classList.remove('on');
  clearPowerSel();
  Array.from(slotsEl.children).forEach((c, n) => c.classList.toggle('on', n === i));
  hintEl.textContent = '选一件道具，然后点画面空白处 —— 它会自己飞过去';
}
function selectLaser() {
  if (!isSkillUnlocked('laser')) { flashHint('第 ' + skillUnlockRound('laser') + ' 轮解锁 · 激光波'); return; }
  G.mode = 'laser';
  clearPowerSel();
  holeBtn.classList.remove('on');
  Array.from(slotsEl.children).forEach(c => c.classList.remove('on'));
  laserBtn.classList.add('on');
  hintEl.textContent = '激光波已就绪 · 点画面空白处发射';
  hintEl.classList.remove('hide');
  setTimeout(() => hintEl.classList.add('hide'), 5200);
  uiClick();
}
function selectHole() {
  if (!isSkillUnlocked('hole')) { flashHint('第 ' + skillUnlockRound('hole') + ' 轮解锁 · 黑洞'); return; }
  G.mode = 'hole';
  clearPowerSel();
  laserBtn.classList.remove('on');
  Array.from(slotsEl.children).forEach(c => c.classList.remove('on'));
  holeBtn.classList.add('on');
  hintEl.textContent = '黑洞已就绪 · 点画面空白处生成';
  hintEl.classList.remove('hide');
  setTimeout(() => hintEl.classList.add('hide'), 5200);
  uiClick();
}
function fmt(n) { return String(Math.round(n)); }
function updateHud() {
  dmgNowEl.textContent = fmt(G.dmg);
  dmgMaxEl.textContent = fmt(G.target);
  barFill.style.width = (G.dmg / G.target * 100).toFixed(2) + '%';
  roundChip.textContent = G.round <= TOTAL_ROUNDS ? '第 ' + G.round + ' / ' + TOTAL_ROUNDS + ' 轮' : '加时赛';
  phaseLabel.textContent = G.phase === 1 ? '第一阶段 · 嘴硬' : G.phase === 2 ? '第二阶段 · 求饶' : '第三阶段 · 摆烂';
  if (G.shield > 0) {
    shieldChip.classList.add('on');
    shieldChip.textContent = '办公椅 ' + Math.ceil(G.shield);
  } else shieldChip.classList.remove('on');
}
function banner(k, v) {
  b1.textContent = k; b2.textContent = v;
  bannerEl.classList.remove('show');
  void bannerEl.offsetWidth;
  bannerEl.classList.add('show');
}
let sayHideAt = 0;
function say(text, dur = 2000) {
  if (!text || text === G.lastSay) return;
  G.lastSay = text;
  sayEl.textContent = text;
  sayEl.classList.add('on');
  sayHideAt = performance.now() + dur;
}
function setCombo(n) {
  if (n < 2) { comboEl.classList.remove('on'); return; }
  comboEl.querySelector('b').textContent = n;
  comboEl.classList.add('on');
}
function showScreen(id) {
  ['start', 'letter', 'end'].forEach(k => $('#' + k).classList.toggle('on', k === id));
}
function hideModals() {
  $('#choice').classList.remove('on');
}

/* ---------- world helpers ---------- */
function charChest() {
  return new THREE.Vector3(CH.body.position.x, CH.body.position.y + 0.15, CH.body.position.z);
}
function aimTarget() {
  if (chair && G.shield > 0) return new THREE.Vector3(chair.b.position.x, chair.b.position.y + 0.2, chair.b.position.z);
  return charChest();
}
function worldToScreen(v) {
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * window.innerWidth, y: (-p.y * 0.5 + 0.5) * window.innerHeight, ok: p.z < 1 };
}
function burst(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('i');
    el.className = 'spark';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = i % 3 === 0 ? '#fff2df' : color;
    const a = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 70;
    el.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'px');
    el.style.setProperty('--dy', (Math.sin(a) * dist - 20).toFixed(1) + 'px');
    fxEl.appendChild(el);
    setTimeout(() => el.remove(), 620);
  }
}
function floatNum(text, colorClass, crit, at, tint) {
  const s = worldToScreen(at);
  if (!s.ok) return;
  const d = document.createElement('div');
  d.className = 'num' + (crit ? ' crit' : '') + (colorClass ? ' ' + colorClass : '');
  d.textContent = text;
  d.style.left = s.x + 'px';
  d.style.top = s.y + 'px';
  if (tint) { d.style.color = tint; d.style.textShadow = '0 3px 0 rgba(0,0,0,.55),0 0 30px ' + tint + 'AA'; }
  fxEl.appendChild(d);
  const bc = tint || (colorClass === 'laser' ? '#8FF3FF' : colorClass === 'hole' ? '#C4B5FD' : colorClass === 'shield' ? '#9FD8FF' : '#FFD3A0');
  if (colorClass !== 'shield') burst(s.x, s.y, bc);
  setTimeout(() => d.remove(), 1120);
}
function clawFx(at, color) {
  const s = worldToScreen(at);
  if (!s.ok) return;
  for (let i = 0; i < 3; i++) {
    const d = document.createElement('i');
    d.className = 'claw';
    d.style.left = (s.x - 16 + i * 16) + 'px';
    d.style.top = (s.y - 6 + i * 6) + 'px';
    d.style.setProperty('--a', (-22 + i * 22) + 'deg');
    d.style.setProperty('--c', color);
    fxEl.appendChild(d);
    setTimeout(() => d.remove(), 380);
  }
}
function powFx(at, color) {
  const s = worldToScreen(at);
  if (!s.ok) return;
  const d = document.createElement('div');
  d.className = 'pow';
  d.textContent = 'POW!';
  d.style.left = s.x + 'px';
  d.style.top = s.y + 'px';
  d.style.color = color || '#FFD766';
  fxEl.appendChild(d);
  setTimeout(() => d.remove(), 520);
}
function shake(power) { G.shake = Math.max(G.shake, power); }

function flashScreen(op) {
  const f = $('#flash');
  f.animate([{ opacity: op }, { opacity: 0 }], { duration: 190, easing: 'ease-out' });
}

function clearLasers() {
  G.lasers.forEach(L => {
    scene.remove(L.group);
    scene.remove(L.ring);
    scene.remove(L.light);
    L.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    L.ring.geometry.dispose();
    L.ring.material.dispose();
  });
  G.lasers = [];
}

function spawnLaser(from, to) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const len = Math.max(.3, dir.length());
  const group = new THREE.Group();
  group.position.copy(from);
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());

  const beam = (radius, color, opacity) => {
    const geo = new THREE.CylinderGeometry(radius, radius * .72, len, 10, 1, true);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    const m = new THREE.Mesh(geo, mat);
    m.position.y = len / 2;
    m.userData.baseOpacity = opacity;
    group.add(m);
    return m;
  };
  beam(.03, 0xffffff, .95);
  beam(.11, 0x8ff3ff, .38);
  beam(.23, 0x2fa9c9, .13);

  const muzzle = new THREE.Mesh(
    new THREE.SphereGeometry(.16, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xcbfaff, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  muzzle.userData.baseOpacity = .85;
  group.add(muzzle);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(.15, 12, 12),
    new THREE.MeshBasicMaterial({ color: 0xe9ffff, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  orb.userData.baseOpacity = 1;
  orb.position.y = .1;
  group.add(orb);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.14, .19, 32),
    new THREE.MeshBasicMaterial({ color: 0x9ff3ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.position.copy(to);
  ring.lookAt(camera.position);
  scene.add(ring);

  const light = new THREE.PointLight(0x7fe9ff, 26, 7, 2);
  light.position.copy(to);
  scene.add(light);
  scene.add(group);
  G.lasers.push({ group, ring, light, orb, from: from.clone(), to: to.clone(), len, start: performance.now() });
}

function updateLasers(now) {
  for (let i = G.lasers.length - 1; i >= 0; i--) {
    const L = G.lasers[i];
    const p = (now - L.start) / 640;
    if (p >= 1) {
      scene.remove(L.group); scene.remove(L.ring); scene.remove(L.light);
      L.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
      L.ring.geometry.dispose(); L.ring.material.dispose();
      G.lasers.splice(i, 1);
      continue;
    }
    const fade = p < .4 ? 1 : 1 - (p - .4) / .6;
    L.group.children.forEach(m => { if (m.material && m.userData.baseOpacity != null) m.material.opacity = m.userData.baseOpacity * fade; });
    L.orb.position.y = Math.min(L.len, .1 + (L.len - .1) * Math.min(1, p / .32));
    L.orb.visible = p < .45;
    L.ring.scale.setScalar(1 + p * 3.6);
    L.ring.material.opacity = Math.max(0, .9 * (1 - p));
    L.light.intensity = Math.max(0, 26 * (1 - p * 1.7));
  }
}

function fireLaser(clientX, clientY) {
  if (!G.playing) return;
  const now = performance.now();
  if (now - G.lastLaser < 420) return;
  G.lastLaser = now;
  const from = spawnPointFrom(clientX, clientY);
  const to = aimTarget();
  spawnLaser(from, to);
  laserSound(clamp((clientX / window.innerWidth - .5) * 1.4, -1, 1));
  flashScreen(.18);
  shake(4.2);
  const at = to.clone();
  at.y += .15;
  if (chair && G.shield > 0) {
    damageChair(300, at);
  } else {
    G.combo++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.lastHit = now;
    G.hits++;
    const val = Math.round(240 * (1 + Math.min(G.combo, 40) * .02) * (G.phase === 3 ? 1.25 : 1));
    const dir = new THREE.Vector3().subVectors(CH.body.position, from);
    knockChar(dir, 84);
    damageBoss(val);
    CH.setExpression('hurt');
    G.expUntil = now + 340;
    floatNum(val, 'laser', true, at);
    setCombo(G.combo);
    if (Math.random() < .4) say(pick(LINES[G.phase]), 1700);
  }
}

function knockChar(dir, force) {
  const b = CH.body;
  if (b.type !== CANNON.Body.DYNAMIC) {
    b.type = CANNON.Body.DYNAMIC;
    b.mass = 8;
    b.updateMassProperties();
    b.wakeUp();
  }
  const d = dir.clone();
  d.y = 0;
  if (d.lengthSq() < 0.001) d.set(1, 0, 0);
  d.normalize();
  b.applyImpulse(new CANNON.Vec3(d.x * force, force * 0.85 + 1.5, d.z * force));
  b.angularVelocity.set(rand(-7, 7), rand(-5, 5), rand(-7, 7));
  CH.hit(d, force);
  G.knocked = true;
  G.landedFx = false;
  G.recoverAt = performance.now() + 3000;
  G.tween = null;
  G.expUntil = performance.now() + 320;
  CH.setExpression('hurt');
  charVoice(force);
}

function startGetUp() {
  const b = CH.body;
  b.type = CANNON.Body.KINEMATIC;
  b.mass = 0;
  b.updateMassProperties();
  b.velocity.setZero();
  b.angularVelocity.setZero();
  G.tween = {
    t: 0,
    p0: new CANNON.Vec3(b.position.x, b.position.y, b.position.z),
    q0: new CANNON.Quaternion(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w)
  };
}

/* ---------- chair shield ---------- */
function showChair() {
  if (chair) return;
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x6d4a32, roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4a3324, roughness: 0.9 });
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.12, 0.58), wood); seat.position.y = 0.55;
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.98, 1.05, 0.12), wood); back.position.set(0, 1.02, -0.23);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.82, 0.03), new THREE.MeshStandardMaterial({ color: 0x7a563b, roughness: 0.85 })); panel.position.set(0, 1.0, -0.16);
  const bar1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.05), dark); bar1.position.set(0, 1.42, -0.2);
  const bar2 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.07, 0.05), dark); bar2.position.set(0, 0.72, -0.2);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.06), dark); rail.position.set(0, 0.72, -0.2);
  g.add(seat, back, panel, bar1, bar2, rail);
  for (const x of [-0.42, 0.42]) {
    for (const z of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.08), dark);
      leg.position.set(x, 0.26, z);
      g.add(leg);
    }
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.position.set(CH.stand.x, 0, CH.stand.z + 0.64);
  scene.add(g);
  const b = new CANNON.Body({ mass: 0 });
  b.addShape(new CANNON.Box(new CANNON.Vec3(0.5, 0.75, 0.24)));
  b.position.set(CH.stand.x, 0.75, CH.stand.z + 0.64);
  b.isChair = true;
  world.addBody(b);
  chair = { g, b };
}
function damageChair(val, at) {
  if (!chair || G.shield <= 0) return;
  G.shield = Math.max(0, G.shield - val);
  updateHud();
  floatNum(val, 'shield', false, at);
  chair.g.rotation.z = rand(-0.06, 0.06);
  {
    const s = worldToScreen(at);
    chairImpact(clamp((s.x / window.innerWidth - .5) * 1.4, -1, 1));
  }
  shake(0.7);
  if (G.shield <= 0) breakChair();
}
function breakChair() {
  if (!chair) return;
  const { g, b } = chair;
  b.collisionResponse = false;
  setTimeout(() => { try { world.removeBody(b); } catch (e) {} }, 0);
  chair = null;
  G.shield = 0;
  G.shieldMax = 0;
  updateHud();
  g.userData.vel = new THREE.Vector3(rand(-2, 2), 3.2, 3.2);
  g.userData.spin = rand(-3, 3);
  chairBroken = { g, t: performance.now() };
  setTimeout(() => { if (chairBroken && chairBroken.g === g) { scene.remove(g); chairBroken = null; } }, 2400);
  say('椅子碎了！', 1400);
  {
    const s = worldToScreen(new THREE.Vector3(g.position.x, g.position.y + 1, g.position.z));
    chairBreakSound(clamp((s.x / window.innerWidth - .5) * 1.4, -1, 1));
  }
}
function clearChair() {
  if (chair) { world.removeBody(chair.b); scene.remove(chair.g); chair = null; }
  if (chairBroken) { scene.remove(chairBroken.g); chairBroken = null; }
  G.shield = 0; G.shieldMax = 0;
}

/* ---------- damage ---------- */
const LINES = {
  1: ['就这？', '你没吃饭吗？', '我可是你男朋友', '别打脸，我靠脸吃饭的', '轻点，这衬衫新买的', '你再打我可要还手了……不敢'],
  2: ['别打了别打了', '我请你喝奶茶', '两杯，两杯行不行', '椅子要碎了！', '我以后什么都跟你说', '手疼不疼？我给你吹吹'],
  3: ['你打吧，我不躲了', '手酸不酸，我给你倒杯水', '打完了……记得看信', '我这辈子就栽你手里了', '还有力气吗？没有我扶你']
};
const EVENTS = [
  '（掏出一杯奶茶）先喝一口？',
  '（举起白旗）我投降',
  '（往桌子底下钻）你打不到我',
  '（假装打电话）喂，110 吗……',
  '（掏出工资卡）都给你，别打了',
  '（开始唱）我错了，我真的错了'
];
const ROUND_LINES = {
  2: ['怎么又来？', '我不是刚被你打过吗', '行，这次我自己躺好'],
  3: ['你怎么还打', '我已经学会自己躺下了', '打吧，反正跑不掉']
};

function calcDamage(item, impact) {
  const speed = clamp(impact / 9, 0.7, 1.7);
  const combo = 1 + Math.min(G.combo, 40) * 0.025;
  const phase = G.phase === 3 ? 1.25 : 1;
  const crit = Math.random() < 0.1;
  return { val: Math.round(item.dmg * speed * combo * phase * (crit ? 2 : 1)), crit };
}
function damageBoss(val) {
  if (!G.playing) return;
  G.dmg = Math.min(G.target, G.dmg + val);
  if (G.phase === 1 && G.dmg >= G.target / 3) enterPhase(2);
  else if (G.phase === 2 && G.shield <= 0 && G.dmg >= G.target * 2 / 3) enterPhase(3);
  CH.setDamageRatio(G.dmg / G.target);
  updateHud();
  if (G.dmg >= G.target) finishRound();
}
function enterPhase(p) {
  G.phase = p;
  if (p === 2) {
    G.shieldMax = ROUND_SHIELDS[Math.min(G.round - 1, ROUND_SHIELDS.length - 1)];
    G.shield = G.shieldMax;
    if (G.shieldMax > 0) showChair();
    CH.setExpression('beg');
    banner('第二阶段', '求饶');
    say('别打了别打了，我举椅子了', 1900);
  } else {
    if (chair) breakChair();
    CH.setExpression('dead');
    banner('第三阶段', '摆烂');
    say('你打吧，我不躲了', 1900);
  }
  updateHud();
}
function finishRound() {
  if (!G.playing) return;
  G.playing = false;
  G.dmg = G.target;
  G.fightEndAt = Date.now();
  G.combo = 0;
  setCombo(0);
  CH.setExpression('dead');
  updateHud();
  say('……我认输。', 1600);
  shake(2.5);
  setTimeout(showChoice, 900);
}
function showChoice() {
  const line = G.round === 1
    ? '他趴在地上，抬起头：<br>「要不……你先看看我写的东西？」'
    : '他趴在地上摆摆手：<br>「还打啊……行，你开心就好。」';
  $('#choiceLine').innerHTML = line;
  const next = G.round + 1;
  let note;
  if (next <= TOTAL_ROUNDS) {
    const p = unlockPartsFor(next);
    note = '继续 → 第 ' + next + ' 轮' + (p ? ' · ' + p : '');
  } else note = '继续 → 加时赛 · 全部攻击已解锁';
  $('#choiceNote').textContent = note;
  $('#choice').classList.add('on');
}

function removeItem(obj, fade = true) {
  const idx = G.items.indexOf(obj);
  if (idx >= 0) G.items.splice(idx, 1);
  if (obj.body) world.removeBody(obj.body);
  if (fade) {
    G.fading.push({ mesh: obj.mesh, t: performance.now() });
  } else {
    scene.remove(obj.mesh);
  }
}
function clearItems() {
  G.items.forEach(o => { world.removeBody(o.body); scene.remove(o.mesh); });
  G.items = [];
  G.fading.forEach(f => scene.remove(f.mesh));
  G.fading = [];
}

/* ---------- throwing ---------- */
const raycaster = new THREE.Raycaster();
const spawnPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.95);
const tmpNdc = new THREE.Vector2();
function spawnPointFrom(clientX, clientY) {
  tmpNdc.set(clientX / window.innerWidth * 2 - 1, -(clientY / window.innerHeight * 2 - 1));
  raycaster.setFromCamera(tmpNdc, camera);
  const p = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(spawnPlane, p);
  if (!hit) p.set(0, 1.5, 0.95);
  p.x = clamp(p.x, -5.2, 5.2);
  p.y = clamp(p.y, 0.35, 3.5);
  p.z = 0.95;
  return p;
}
let lastThrowAt = 0;
function throwItem(index, clientX, clientY) {
  if (!G.playing || !G.started) return;
  const now = performance.now();
  if (now - lastThrowAt < 30) return;
  lastThrowAt = now;
  const flying = G.items.filter(o => !o.landed).length;
  if (flying >= 10) return;
  const item = ITEMS[index];
  const pos = spawnPointFrom(clientX, clientY);
  const mesh = buildItemMesh(item);
  mesh.position.copy(pos);
  mesh.rotation.set(rand(0, 6.28), rand(0, 6.28), rand(0, 6.28));
  scene.add(mesh);
  const body = createItemBody(item, pos);
  body.quaternion.setFromEuler(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z);
  world.addBody(body);
  const chest = aimTarget();
  const dir = chest.clone().sub(pos);
  dir.y += 0.2;
  dir.normalize();
  const speed = 11.5 + Math.random() * 1.5;
  body.velocity.set(dir.x * speed, dir.y * speed + 1.4, dir.z * speed);
  body.angularVelocity.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));

  const obj = { item, mesh, body, hit: false, hitChair: false, homing: true, born: now, landed: false, landedAt: 0 };
  body.addEventListener('collide', ev => {
    const other = ev.body;
    const impactSpeed = Math.abs(ev.contact ? ev.contact.getImpactVelocityAlongNormal() : 6) || 6;
    if (other === CH.body && !obj.hit && !obj.spent) {
      obj.hit = true;
      obj.homing = false;
      const { val, crit } = calcDamage(item, impactSpeed);
      G.combo++;
      G.maxCombo = Math.max(G.maxCombo, G.combo);
      G.lastHit = now;
      G.hits++;
      const dirImp = new THREE.Vector3().subVectors(CH.body.position, body.position);
      knockChar(dirImp, clamp(8 + item.mass * impactSpeed * 1.4, 8, 62));
      damageBoss(val);
      const at = new THREE.Vector3(CH.body.position.x, CH.body.position.y + 0.55, CH.body.position.z);
      const screen = worldToScreen(at);
      const pan = clamp((screen.x / window.innerWidth - .5) * 1.4, -1, 1);
      floatNum(val, '', crit, at);
      setCombo(G.combo);
      playImpact(item, impactSpeed, pan);
      shake(clamp(item.dmg / 22, .7, 2.6));
      if (Math.random() < 0.32) say(pick(LINES[G.phase]), 1700);
    } else if (chair && other === chair.b) {
      if (!obj.hitChair) {
        obj.hitChair = true;
        obj.spent = true;
        obj.homing = false;
        const { val } = calcDamage(item, impactSpeed);
        const at = new THREE.Vector3(chair.b.position.x, chair.b.position.y + 0.7, chair.b.position.z);
        damageChair(Math.round(val * 0.9), at);
      }
    } else if (impactSpeed > 3.2 && now - (obj.lastBounce || 0) > 140) {
      obj.lastBounce = now;
      const bp = worldToScreen(new THREE.Vector3(body.position.x, body.position.y, body.position.z));
      noiseBurst({ dur: .05, freq: 300, q: .7, gain: .035, type: 'lowpass', pan: clamp((bp.x / window.innerWidth - .5) * 1.2, -1, 1), wet: .04 });
    }
  });
  G.items.push(obj);
  G.thrownOnce = true;
  hintEl.classList.add('hide');
  throwWhoosh(item, clamp((clientX / window.innerWidth - .5) * 1.4, -1, 1), pos.distanceTo(aimTarget()));
  if (flying >= 12) {
    const old = G.items.find(o => o.landed);
    if (old) removeItem(old);
  }
}

function holeSound(pan) {
  toneBurst({ f1: 72, f2: 26, dur: .9, gain: .18, type: 'sine', pan, wet: .4 });
  noiseBurst({ dur: 1.2, freq: 160, q: .5, gain: .08, type: 'lowpass', pan, wet: .3 });
  toneBurst({ f1: 38, f2: 46, dur: 2.25, gain: .045, type: 'sawtooth', pan, wet: .25 });
  noiseBurst({ dur: 1.7, freq: 240, to: 950, q: .6, gain: .028, type: 'bandpass', pan, wet: .2, delay: .08 });
}
function holeEndSound(pan) {
  noiseBurst({ dur: .5, freq: 2200, q: .6, gain: .15, type: 'highpass', pan, wet: .35 });
  toneBurst({ f1: 92, f2: 22, dur: .8, gain: .22, pan, wet: .3 });
  toneBurst({ f1: 620, f2: 110, dur: .4, gain: .055, type: 'sawtooth', pan, wet: .4 });
}

function clearHole() {
  if (!G.hole) return;
  const h = G.hole;
  scene.remove(h.group);
  scene.remove(h.light);
  h.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  G.hole = null;
  holeBtn.classList.remove('busy');
}

function castHole(clientX, clientY) {
  if (!G.playing || G.hole) return;
  const now = performance.now();
  const from = spawnPointFrom(clientX, clientY);
  from.y = clamp(from.y, 0.8, 2.8);

  const group = new THREE.Group();
  group.position.copy(from);
  scene.add(group);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 32, 24),
    new THREE.MeshBasicMaterial({ color: 0x05030a })
  );
  group.add(core);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 28, 20),
    new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  group.add(glow);

  const ring1 = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.05, 10, 48),
    new THREE.MeshBasicMaterial({ color: 0xff9a5c, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring1.rotation.x = 1.1; ring1.rotation.z = 0.22;
  group.add(ring1);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(0.92, 0.016, 8, 56),
    new THREE.MeshBasicMaterial({ color: 0xc4b5fd, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  ring2.rotation.x = 1.35; ring2.rotation.z = -0.32;
  group.add(ring2);

  const N = 110;
  const positions = new Float32Array(N * 3);
  const pdata = [];
  for (let i = 0; i < N; i++) {
    pdata.push({ a: rand(0, Math.PI * 2), r: rand(0.45, 1.35), y: rand(-0.14, 0.32), sp: rand(0.9, 2.6) });
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pmat = new THREE.PointsMaterial({ color: 0xffb37a, size: 0.035, transparent: true, opacity: .92, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat);
  group.add(points);

  const light = new THREE.PointLight(0x8b5cf6, 22, 7, 2);
  light.position.copy(from);
  scene.add(light);

  G.hole = {
    group, light, ring1, ring2, points, pdata, posAttr: pgeo.attributes.position,
    start: now, life: 2600, from, grabbed: false, lastDmg: 0, chairBroke: false
  };
  holeBtn.classList.add('busy');
  hintEl.classList.add('hide');
  holeSound(clamp((clientX / window.innerWidth - .5) * 1.4, -1, 1));
  shake(2.4);
  flashScreen(.12);
  if (Math.random() < .6) say('别过来……', 1300);
}

function endHole(now) {
  const h = G.hole;
  if (!h) return;
  const b = CH.body;
  if (h.grabbed && b.type === CANNON.Body.DYNAMIC) {
    const dir = new THREE.Vector3(b.position.x - h.from.x, b.position.y - h.from.y, b.position.z - h.from.z);
    if (dir.lengthSq() < .0001) dir.set(0, 1, 0);
    dir.normalize();
    b.applyImpulse(new CANNON.Vec3(dir.x * 26, Math.abs(dir.y) * 10 + 15, dir.z * 26));
    b.angularVelocity.set(rand(-6, 6), rand(-6, 6), rand(-6, 6));
    G.knocked = true;
    G.landedFx = false;
    G.recoverAt = now + 2200;
    CH.hit(dir, 36);
    charVoice(55);
  }
  const s = worldToScreen(h.from);
  if (s.ok) burst(s.x, s.y, '#C4B5FD');
  flashScreen(.2);
  shake(3.2);
  holeEndSound(clamp((s.x / window.innerWidth - .5) * 1.4, -1, 1));
  scene.remove(h.group);
  scene.remove(h.light);
  h.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  G.hole = null;
  holeBtn.classList.remove('busy');
}

function updateHole(dt, now) {
  const h = G.hole;
  if (!h) return;
  const t = (now - h.start) / h.life;
  if (t >= 1) { endHole(now); return; }

  const scale = t < .1 ? t / .1 : t > .86 ? Math.max(.2, 1 - (t - .86) / .14) : 1;
  h.group.scale.setScalar(scale);
  h.ring1.rotation.z += dt * 2.4;
  h.ring2.rotation.z -= dt * 3.1;
  h.points.rotation.y += dt * 1.2;
  h.light.intensity = 20 + Math.sin(now / 80) * 4;

  for (let i = 0; i < h.pdata.length; i++) {
    const p = h.pdata[i];
    p.a += p.sp * dt;
    p.r -= dt * .38;
    if (p.r < .32) p.r = rand(1.0, 1.4);
    h.posAttr.array[i * 3] = Math.cos(p.a) * p.r;
    h.posAttr.array[i * 3 + 1] = p.y + Math.sin(now / 260 + i) * .03;
    h.posAttr.array[i * 3 + 2] = Math.sin(p.a) * p.r;
  }
  h.posAttr.needsUpdate = true;

  const charDist = Math.hypot(CH.body.position.x - h.from.x, CH.body.position.y - h.from.y, CH.body.position.z - h.from.z);
  if (charDist < 6.5) {
    const b = CH.body;
    if (b.type !== CANNON.Body.DYNAMIC) {
      b.type = CANNON.Body.DYNAMIC;
      b.mass = 8;
      b.updateMassProperties();
      b.wakeUp();
      G.knocked = true;
      G.tween = null;
      G.landedFx = false;
      G.recoverAt = now + 4200;
      G.expUntil = now + 320;
      CH.setExpression('hurt');
      charVoice(38);
    }
    h.grabbed = true;
  }

  const applyPull = (body, isChar) => {
    const dx = h.from.x - body.position.x;
    const dy = h.from.y - body.position.y;
    const dz = h.from.z - body.position.z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist > 9) return;
    const ux = dx / (dist || 1), uy = dy / (dist || 1), uz = dz / (dist || 1);
    const mass = Math.max(.2, body.mass);
    const f = clamp(155 * mass / (dist * dist + .8), 3, 165);
    const tx = -uz, tz = ux;
    const tl = Math.hypot(tx, tz) || 1;
    body.wakeUp();
    body.applyForce(new CANNON.Vec3(
      ux * f + (tx / tl) * f * .55,
      uy * f + f * .18,
      uz * f + (tz / tl) * f * .55
    ));
    if (isChar && dist < 0.95) {
      body.position.set(h.from.x - ux * .95, h.from.y - uy * .95, h.from.z - uz * .95);
      body.velocity.set((tx / tl) * 5.2 + ux * 1.1, .9, (tz / tl) * 5.2 + uz * 1.1);
      body.angularVelocity.set(0, 7.5, 0);
    }
  };

  applyPull(CH.body, true);

  for (let i = G.items.length - 1; i >= 0; i--) {
    const o = G.items[i];
    o.homing = false;
    applyPull(o.body, false);
    const ddx = h.from.x - o.body.position.x, ddy = h.from.y - o.body.position.y, ddz = h.from.z - o.body.position.z;
    const d = Math.hypot(ddx, ddy, ddz) || 1;
    if (d < 8.5) {
      const k = Math.min(1, dt * 6);
      o.body.velocity.x += (ddx / d * 12 - o.body.velocity.x) * k;
      o.body.velocity.y += (ddy / d * 8 + 2.4 - o.body.velocity.y) * k;
      o.body.velocity.z += (ddz / d * 12 - o.body.velocity.z) * k;
    }
    if (d < 1.3) o.mesh.scale.setScalar(clamp(d / 1.3, .06, 1));
    if (d < .8) {
      removeItem(o, false);
      const s = worldToScreen(h.from);
      if (s.ok) burst(s.x, s.y, '#C4B5FD');
      toneBurst({ f1: 330, f2: 80, dur: .16, gain: .05, pan: 0, wet: .2 });
    }
  }

  if (chair && G.shield > 0 && !h.chairBroke && now - h.start > 700) {
    h.chairBroke = true;
    breakChair();
  }

  if (charDist < 4.8 && now - h.lastDmg > 420 && G.playing && !(chair && G.shield > 0)) {
    h.lastDmg = now;
    G.combo++;
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    G.lastHit = now;
    G.hits++;
    const val = Math.round(48 * (G.phase === 3 ? 1.2 : 1));
    damageBoss(val);
    const at = new THREE.Vector3(CH.body.position.x + rand(-.35, .35), CH.body.position.y + .45 + rand(0, .35), CH.body.position.z);
    floatNum(val, 'hole', false, at);
    setCombo(G.combo);
    if (Math.random() < .35) charVoice(16);
  }
}

function catMeow(id, mode) {
  if (!ac || muted) return;
  const base = { tiaotiao: 900, daidai: 660, tuantuan: 760, token: 520 }[id] || 700;
  if (mode === 'summon') {
    toneBurst({ f1: 880, f2: 1320, dur: .1, gain: .035, type: 'triangle', wet: .4 });
    toneBurst({ f1: 1320, f2: 990, dur: .16, gain: .03, type: 'triangle', wet: .4, delay: .08 });
  }
  toneBurst({ f1: base * .72, f2: base * 1.35, dur: .13, gain: .05, type: 'sawtooth', wet: .2 });
  toneBurst({ f1: base * 1.35, f2: base * .72, dur: .2, gain: .04, type: 'sawtooth', wet: .2, delay: .12 });
  noiseBurst({ dur: .14, freq: 1400, q: 1.2, gain: .018, type: 'bandpass', wet: .1 });
  if (id === 'tuantuan') noiseBurst({ dur: .25, freq: 2600, q: .7, gain: .035, type: 'highpass', wet: .15, delay: .1 });
  if (id === 'daidai') toneBurst({ f1: 180, f2: 120, dur: .35, gain: .025, type: 'sine', wet: .15, delay: .1 });
}
function meteorSound() {
  toneBurst({ f1: 1500, f2: 160, dur: .6, gain: .07, type: 'sawtooth', wet: .3 });
  noiseBurst({ dur: .65, freq: 1200, to: 300, q: .7, gain: .06, type: 'bandpass', wet: .2 });
}
function meteorImpactSound() {
  noiseBurst({ dur: .6, freq: 500, q: .5, gain: .2, type: 'lowpass', wet: .3 });
  toneBurst({ f1: 70, f2: 24, dur: .75, gain: .24, type: 'sine', wet: .3 });
  noiseBurst({ dur: .2, freq: 3000, q: .7, gain: .08, type: 'highpass', wet: .2 });
}
function thunderSound() {
  noiseBurst({ dur: .18, freq: 3200, q: .6, gain: .2, type: 'highpass', wet: .2 });
  toneBurst({ f1: 120, f2: 40, dur: .8, gain: .16, type: 'sine', wet: .5, delay: .04 });
  noiseBurst({ dur: .7, freq: 800, to: 200, q: .5, gain: .08, type: 'lowpass', wet: .4, delay: .08 });
  toneBurst({ f1: 2200, f2: 400, dur: .25, gain: .03, type: 'sawtooth', wet: .4 });
}
function gloveSound() {
  toneBurst({ f1: 280, f2: 880, dur: .16, gain: .06, type: 'triangle', wet: .2 });
  toneBurst({ f1: 880, f2: 380, dur: .12, gain: .04, type: 'triangle', wet: .2, delay: .12 });
}
function gloveHitSound() {
  noiseBurst({ dur: .12, freq: 1400, q: .8, gain: .16, type: 'bandpass', wet: .1 });
  toneBurst({ f1: 160, f2: 55, dur: .22, gain: .2, wet: .1 });
}
function bowlSound() {
  noiseBurst({ dur: 1.1, freq: 180, q: .5, gain: .1, type: 'lowpass', wet: .2 });
  toneBurst({ f1: 70, f2: 58, dur: 1.1, gain: .06, type: 'sawtooth', wet: .15 });
}
function bowlHitSound() {
  noiseBurst({ dur: .2, freq: 900, q: .6, gain: .18, type: 'bandpass', wet: .2 });
  toneBurst({ f1: 130, f2: 40, dur: .3, gain: .2, wet: .15 });
}

function summonCat(id, clientX, clientY) {
  if (!G.playing || !id || !CAT_DEFS[id]) return;
  if (G.cats.some(c => c.id === id)) return;
  const def = CAT_DEFS[id];
  const p = spawnPointFrom(clientX, clientY);
  let x = clamp(p.x, -4.4, 4.4);
  let z = clamp(p.z, -1.8, 1.05);
  if (x > .3) z = clamp(z, -.8, 1.05);
  const model = createCat(id);
  model.group.position.set(x, .02, z);
  scene.add(model.group);
  scene.add(model.shadow);
  model.shadow.position.set(x, .006, z);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(.2, .28, 32),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(def.color), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, .015, z);
  scene.add(ring);
  G.cats.push({
    id, def, model, group: model.group, shadow: model.shadow, ring, ringT: 0,
    state: 'run', t: 0, runT: 0, leapsLeft: def.leaps
  });
  setCatActive(id, true);
  catMeow(id, 'summon');
  shake(1.1);
  flashScreen(.06);
  hintEl.classList.add('hide');
}

function startCatLeap(cat) {
  const b = CH.body;
  const to = new THREE.Vector3(b.position.x + rand(-.18, .18), .02, b.position.z + rand(-.18, .18));
  cat.from = cat.group.position.clone();
  cat.to = to;
  cat.t = 0;
  cat.state = 'leap';
  cat.group.rotation.y = Math.atan2(to.x - cat.from.x, to.z - cat.from.z);
}

function catHit(cat) {
  if (!G.playing) return;
  const def = cat.def;
  const at = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .55, CH.body.position.z);
  const dir = new THREE.Vector3(CH.body.position.x - cat.group.position.x, 0, CH.body.position.z - cat.group.position.z);
  const crit = Math.random() < .12;
  const val = Math.round(def.dmg * (1 + Math.min(G.combo, 40) * .02) * (G.phase === 3 ? 1.2 : 1) * (crit ? 1.5 : 1));
  G.combo++;
  G.maxCombo = Math.max(G.maxCombo, G.combo);
  G.lastHit = performance.now();
  G.hits++;
  knockChar(dir, def.force);
  damageBoss(val);
  floatNum(val, '', crit, at, def.color);
  clawFx(at, def.color);
  setCombo(G.combo);
  catMeow(cat.id, 'hit');
  shake(1.7);
}

function removeCat(cat) {
  scene.remove(cat.group);
  scene.remove(cat.shadow);
  if (cat.ring) { scene.remove(cat.ring); cat.ring.geometry.dispose(); cat.ring.material.dispose(); }
  cat.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  setCatActive(cat.id, false);
}

function clearCats() {
  G.cats.forEach(cat => removeCat(cat));
  G.cats = [];
}

function updateCats(dt, now) {
  for (let i = G.cats.length - 1; i >= 0; i--) {
    const cat = G.cats[i];
    const b = CH.body;
    cat.model.update(dt, now / 1000, cat.state);
    cat.shadow.position.set(cat.group.position.x, .006, cat.group.position.z);
    cat.shadow.material.opacity = clamp(.32 - Math.max(0, cat.group.position.y - .05) * .18, .06, .32);
    if (cat.ring) {
      cat.ringT += dt;
      const k = cat.ringT / .55;
      if (k >= 1) {
        scene.remove(cat.ring); cat.ring.geometry.dispose(); cat.ring.material.dispose(); cat.ring = null;
      } else {
        cat.ring.scale.setScalar(1 + k * 2.2);
        cat.ring.material.opacity = .9 * (1 - k);
      }
    }
    if (cat.state === 'run') {
      const dx = b.position.x - cat.group.position.x;
      const dz = b.position.z - cat.group.position.z;
      const dist = Math.hypot(dx, dz) || 1;
      const yaw = Math.atan2(dx, dz);
      const cur = cat.group.rotation.y;
      cat.group.rotation.y = cur + Math.atan2(Math.sin(yaw - cur), Math.cos(yaw - cur)) * Math.min(1, dt * 9);
      if (dist > 1.15) {
        cat.group.position.x += dx / dist * cat.def.speed * dt;
        cat.group.position.z += dz / dist * cat.def.speed * dt;
      }
      cat.runT += dt;
      if (dist < 1.35 || cat.runT > 2.6) startCatLeap(cat);
    } else if (cat.state === 'leap') {
      cat.t += dt / cat.def.leapDur;
      const e = clamp(cat.t, 0, 1);
      cat.group.position.x = cat.from.x + (cat.to.x - cat.from.x) * e;
      cat.group.position.z = cat.from.z + (cat.to.z - cat.from.z) * e;
      cat.group.position.y = .02 + Math.sin(e * Math.PI) * cat.def.leapH;
      cat.group.rotation.x = -Math.sin(e * Math.PI) * .38;
      if (e >= 1) {
        cat.group.position.set(cat.to.x, .02, cat.to.z);
        cat.group.rotation.x = 0;
        catHit(cat);
        cat.leapsLeft--;
        cat.state = 'recover';
        cat.t = 0;
      }
    } else if (cat.state === 'recover') {
      cat.t += dt;
      if (cat.t > cat.def.recover) {
        if (cat.leapsLeft > 0) startCatLeap(cat);
        else { cat.state = 'idle'; cat.t = 0; }
      }
    } else if (cat.state === 'idle') {
      cat.t += dt;
      if (cat.t > cat.def.idle) { cat.state = 'leave'; cat.t = 0; }
    } else if (cat.state === 'leave') {
      cat.t += dt / .45;
      const k = clamp(cat.t, 0, 1);
      cat.group.scale.setScalar(Math.max(.01, 1 - k));
      cat.shadow.material.opacity *= (1 - k);
      if (k >= 1) {
        removeCat(cat);
        G.cats.splice(i, 1);
      }
    }
  }
}

function skillDamage(base, force, at, tint) {
  if (!G.playing) return;
  const crit = Math.random() < .2;
  const val = Math.round(base * (1 + Math.min(G.combo, 40) * .015) * (G.phase === 3 ? 1.2 : 1) * (crit ? 1.4 : 1));
  G.combo++;
  G.maxCombo = Math.max(G.maxCombo, G.combo);
  G.lastHit = performance.now();
  G.hits++;
  const dir = new THREE.Vector3(CH.body.position.x - at.x, 0, CH.body.position.z - at.z);
  knockChar(dir, force);
  damageBoss(val);
  floatNum(val, '', crit, at, tint);
  setCombo(G.combo);
}

function shockRing(at, color) {
  const m = new THREE.Mesh(
    new THREE.RingGeometry(.26, .34, 40),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(at.x, .025, at.z);
  scene.add(m);
  const t0 = performance.now();
  const step = () => {
    const k = (performance.now() - t0) / 450;
    if (k >= 1) { scene.remove(m); m.geometry.dispose(); m.material.dispose(); return; }
    m.scale.setScalar(1 + k * 4.2);
    m.material.opacity = .85 * (1 - k);
    requestAnimationFrame(step);
  };
  step();
}

function removeSkill(s) {
  if (s.group) {
    scene.remove(s.group);
    s.group.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && !Array.isArray(o.material)) o.material.dispose(); });
  }
  if (s.ring) { scene.remove(s.ring); s.ring.geometry.dispose(); s.ring.material.dispose(); }
  if (s.shadow) { scene.remove(s.shadow); s.shadow.geometry.dispose(); s.shadow.material.dispose(); }
  if (s.light) scene.remove(s.light);
}

function clearSkills() {
  G.skills.forEach(s => removeSkill(s));
  G.skills = [];
}

function castSkill(id, clientX, clientY) {
  if (!G.playing || !id) return;
  const now = performance.now();
  if (now - (G.skillCd[id] || 0) < 650) return;
  G.skillCd[id] = now;
  const p = spawnPointFrom(clientX, clientY);
  hintEl.classList.add('hide');

  if (id === 'meteor') {
    const group = new THREE.Group();
    group.position.set(p.x, 3.6, p.z);
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(.4, 1), new THREE.MeshStandardMaterial({ color: 0x2a1a14, roughness: .88, emissive: 0xff5a1f, emissiveIntensity: .16, flatShading: true }));
    group.add(rock);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(.1 - i * .011, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff8a3c, transparent: true, opacity: .55 - i * .07, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.position.y = .45 + i * .18;
      group.add(m);
    }
    const light = new THREE.PointLight(0xff7a3c, 16, 8, 2);
    group.add(light);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.32, .4, 40), new THREE.MeshBasicMaterial({ color: 0xffb27a, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(p.x, .02, p.z);
    scene.add(group, ring);
    meteorSound();
    G.skills.push({ kind: 'meteor', group, light, ring, start: now, dur: 560, from: new THREE.Vector3(p.x, 3.6, p.z) });
  } else if (id === 'lightning') {
    const to = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .4, CH.body.position.z);
    const from = new THREE.Vector3(p.x, 3.45, p.z);
    const group = new THREE.Group();
    for (let k = 0; k < 3; k++) {
      const pts = [];
      for (let j = 0; j <= 11; j++) {
        const t = j / 11;
        pts.push(new THREE.Vector3(
          from.x + (to.x - from.x) * t + (k - 1) * .04 + rand(-.18, .18) * (1 - t) * .7,
          from.y + (to.y - from.y) * t,
          from.z + (to.z - from.z) * t + rand(-.18, .18) * (1 - t) * .7
        ));
      }
      for (let j = 0; j < pts.length - 1; j++) {
        const a = pts[j], b = pts[j + 1];
        const d = new THREE.Vector3().subVectors(b, a);
        const len = d.length();
        const radius = k === 1 ? .035 : .085;
        const seg = new THREE.Mesh(
          new THREE.CylinderGeometry(radius, radius, len, 6, 1, true),
          new THREE.MeshBasicMaterial({ color: k === 1 ? 0xffffff : 0x8fe3ff, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, side: THREE.DoubleSide })
        );
        seg.position.copy(a).add(b).multiplyScalar(.5);
        seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
        group.add(seg);
      }
    }
    const light = new THREE.PointLight(0x9fe8ff, 38, 9, 2);
    light.position.copy(to);
    scene.add(group, light);
    const ring = new THREE.Mesh(new THREE.RingGeometry(.28, .35, 36), new THREE.MeshBasicMaterial({ color: 0x8fe3ff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(to.x, .02, to.z);
    scene.add(ring);
    const at = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .45, CH.body.position.z);
    skillDamage(250, 48, at, '#8FE3FF');
    shockRing(at, '#8FE3FF');
    flashScreen(.16);
    shake(4);
    thunderSound();
    G.skills.push({ kind: 'bolt', group, light, ring, start: now, dur: 600 });
  } else if (id === 'glove') {
    const to = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .35, CH.body.position.z);
    const dir = new THREE.Vector3().subVectors(to, p);
    const len = Math.max(1, dir.length());
    const group = new THREE.Group();
    group.position.copy(p);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
    const spring = new THREE.Group();
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 8), new THREE.MeshStandardMaterial({ color: 0xa8a2b2, roughness: .4, metalness: .45 }));
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    shaft.rotation.x = Math.PI / 2;
    shaft.position.z = .5;
    spring.add(shaft);
    for (let i = 0; i < 8; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.11, .014, 6, 16), new THREE.MeshStandardMaterial({ color: 0xc9c3d2, roughness: .35, metalness: .5 }));
      ring.position.z = i / 7;
      spring.add(ring);
    }
    group.add(spring);
    const glove = new THREE.Group();
    const fist = new THREE.Mesh(new THREE.SphereGeometry(.22, 18, 14), new THREE.MeshStandardMaterial({ color: 0xd9433c, roughness: .55 }));
    fist.scale.set(1, .9, 1.1);
    glove.add(fist);
    const thumb = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshStandardMaterial({ color: 0xd9433c, roughness: .55 }));
    thumb.position.set(.16, -.02, .04);
    glove.add(thumb);
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(.14, .16, .12, 14), new THREE.MeshStandardMaterial({ color: 0xf1ece2, roughness: .8 }));
    cuff.rotation.x = Math.PI / 2;
    cuff.position.z = -.16;
    glove.add(cuff);
    group.add(glove);
    scene.add(group);
    gloveSound();
    G.skills.push({ kind: 'glove', group, spring, glove, start: now, dur: 620, len, hit: false, to, at: to.clone() });
  } else if (id === 'bowl') {
    const group = new THREE.Group();
    group.position.set(p.x, .4, p.z);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.4, 22, 16), new THREE.MeshStandardMaterial({ color: 0x201c2a, roughness: .28, metalness: .25 }));
    group.add(ball);
    for (let i = 0; i < 3; i++) {
      const hole = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0x05040a }));
      hole.position.set(-.11 + i * .11, .14, .36);
      group.add(hole);
    }
    const shine = new THREE.Mesh(new THREE.SphereGeometry(.07, 8, 8), new THREE.MeshBasicMaterial({ color: 0x8f86a8 }));
    shine.position.set(-.13, .2, .32);
    shine.scale.set(1, .6, .4);
    group.add(shine);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(.36, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(p.x, .006, p.z);
    scene.add(group, shadow);
    const dir = new THREE.Vector3(CH.body.position.x - p.x, 0, CH.body.position.z - p.z);
    dir.normalize();
    bowlSound();
    G.skills.push({ kind: 'bowl', group, ball, shadow, start: now, dir, speed: 9.5, hit: false });
  }
}

function updateSkills(dt, now) {
  for (let i = G.skills.length - 1; i >= 0; i--) {
    const s = G.skills[i];
    if (s.kind === 'meteor') {
      const t = (now - s.start) / s.dur;
      const to = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .45, CH.body.position.z);
      s.ring.position.set(to.x, .02, to.z);
      const e = clamp(t, 0, 1);
      s.group.position.lerpVectors(s.from, to, e * e);
      s.group.rotation.x += dt * 5;
      s.ring.scale.setScalar(1 + e * 1.8);
      s.ring.material.opacity = .8 * (1 - e * .55);
      s.light.intensity = 28 + Math.sin(now / 40) * 6;
      if (t >= 1) {
        const at = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .5, CH.body.position.z);
        skillDamage(360, 88, at, '#FFB27A');
        shockRing(at, '#FFB27A');
        flashScreen(.32);
        shake(5.2);
        burst(at.x, at.y, '#FFB27A');
        meteorImpactSound();
        removeSkill(s);
        G.skills.splice(i, 1);
      }
    } else if (s.kind === 'bolt') {
      const t = (now - s.start) / s.dur;
      s.group.children.forEach((l, k) => { l.material.opacity = Math.max(0, .95 - t * .9) * (0.7 + Math.random() * .3); });
      s.ring.scale.setScalar(1 + t * 2.5);
      s.ring.material.opacity = .8 * (1 - t);
      s.light.intensity = 30 * (1 - t);
      if (t >= 1) {
        removeSkill(s);
        G.skills.splice(i, 1);
      }
    } else if (s.kind === 'glove') {
      const t = (now - s.start) / s.dur;
      let ext;
      if (t < .3) ext = t / .3;
      else if (t < .55) ext = 1;
      else ext = Math.max(.01, 1 - (t - .55) / .45);
      s.spring.scale.z = Math.max(.01, s.len * ext);
      s.glove.position.z = s.len * ext;
      if (!s.hit && t >= .3) {
        s.hit = true;
        const at = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .4, CH.body.position.z);
        skillDamage(280, 68, at, '#FF7A6A');
        shockRing(at, '#FF7A6A');
        powFx(at, '#FFD766');
        gloveHitSound();
        flashScreen(.12);
        shake(4);
      }
      if (t >= 1) {
        removeSkill(s);
        G.skills.splice(i, 1);
      }
    } else if (s.kind === 'bowl') {
      const g = s.group;
      g.position.x += s.dir.x * s.speed * dt;
      g.position.z += s.dir.z * s.speed * dt;
      s.ball.rotation.x += dt * 7;
      s.ball.rotation.z += dt * 3;
      s.shadow.position.set(g.position.x, .006, g.position.z);
      const d = Math.hypot(CH.body.position.x - g.position.x, CH.body.position.z - g.position.z);
      if (!s.hit && d < .9) {
        s.hit = true;
        const at = new THREE.Vector3(CH.body.position.x, CH.body.position.y + .45, CH.body.position.z);
        skillDamage(240, 62, at, '#C4B5FD');
        shockRing(at, '#C4B5FD');
        burst(at.x, at.y, '#C4B5FD');
        bowlHitSound();
        flashScreen(.1);
        shake(3.6);
      }
      if (s.hit) s.speed = Math.max(0, s.speed - dt * 12);
      if (now - s.start > 2200) {
        removeSkill(s);
        G.skills.splice(i, 1);
      }
    }
  }
}

/* ---------- character sync / loop ---------- */
let lastComboReset = 0;
let prevT = performance.now();
function syncChar(dt, now) {
  const b = CH.body;
  CH.root.position.set(b.position.x, b.position.y, b.position.z);
  CH.root.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);

  if (G.knocked && !G.tween && now > G.recoverAt && !G.hole) startGetUp();
  if (G.tween) {
    const tw = G.tween;
    tw.t += dt / 0.62;
    const k = clamp(tw.t, 0, 1);
    const e = k * k * (3 - 2 * k);
    b.position.x = tw.p0.x + (CH.stand.x - tw.p0.x) * e;
    b.position.y = tw.p0.y + (CH.stand.y - tw.p0.y) * e;
    b.position.z = tw.p0.z + (CH.stand.z - tw.p0.z) * e;
    const q = new CANNON.Quaternion();
    tw.q0.slerp(new CANNON.Quaternion(0, 0, 0, 1), e, q);
    b.quaternion.copy(q);
    if (tw.t >= 1) {
      b.position.set(CH.stand.x, CH.stand.y, CH.stand.z);
      b.quaternion.set(0, 0, 0, 1);
      b.type = CANNON.Body.STATIC;
      b.mass = 0;
      b.updateMassProperties();
      G.tween = null;
      G.knocked = false;
      G.expUntil = 0;
      CH.setExpression(G.phase === 1 ? 'smug' : G.phase === 2 ? 'beg' : 'dead');
    }
  }

  if (G.knocked) {
    if (b.position.y > 1.25) G.landedFx = false;
    if (!G.landedFx && b.position.y < 0.82) {
      G.landedFx = true;
      const s = worldToScreen(new THREE.Vector3(b.position.x, 0.12, b.position.z));
      const pan = clamp((s.x / window.innerWidth - .5) * 1.4, -1, 1);
      const lp = clamp((1.1 - b.position.y) * 1.1, .5, 1.5);
      landThud(lp, pan);
      CH.land(lp);
      if (s.ok) burst(s.x, s.y, '#CBB79A');
      shake(.8);
    }
  } else {
    G.landedFx = false;
  }

  CH.shadow.position.x = b.position.x;
  CH.shadow.position.z = b.position.z;
  CH.shadow.material.opacity = clamp(0.36 - Math.max(0, b.position.y - 0.92) * 0.18, 0.05, 0.36);
  const sc = clamp(1.15 - Math.max(0, b.position.y - 0.92) * 0.25, 0.55, 1.15);
  CH.shadow.scale.set(sc, sc, 1);

  if (G.expUntil && now > G.expUntil) {
    G.expUntil = 0;
    CH.setExpression(G.knocked ? 'dead' : (G.phase === 1 ? 'smug' : G.phase === 2 ? 'beg' : 'dead'));
  }
  CH.update(dt, now / 1000, G.knocked);
}

function syncItems(dt, now) {
  let landedCount = 0;
  for (let i = G.items.length - 1; i >= 0; i--) {
    const o = G.items[i];
    const b = o.body;
    if (o.homing && !o.hit && now - o.born < 3500) {
      const chest = aimTarget();
      const dx = chest.x - b.position.x, dy = chest.y - b.position.y, dz = chest.z - b.position.z;
      const dist = Math.hypot(dx, dy, dz) || 1;
      const sp = 11 + Math.min(4, dist * 0.6);
      const k = Math.min(1, dt * 5.5);
      b.velocity.x += (dx / dist * sp - b.velocity.x) * k;
      b.velocity.y += (dy / dist * sp - b.velocity.y) * k + 9.82 * dt * 0.55;
      b.velocity.z += (dz / dist * sp - b.velocity.z) * k;
    } else {
      o.homing = false;
    }

    o.mesh.position.set(b.position.x, b.position.y, b.position.z);
    o.mesh.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);

    const speed = b.velocity.length();
    if (!o.landed && now - o.born > 700 && speed < 0.45) {
      o.landed = true;
      o.landedAt = now;
    }
    if (o.landed) landedCount++;
    if (o.landed && now - o.landedAt > 15000) removeItem(o);
    if (b.position.y < -2) removeItem(o, false);
  }
  if (landedCount > 12) {
    const old = G.items.filter(o => o.landed).sort((a, b) => a.landedAt - b.landedAt)[0];
    if (old) removeItem(old);
  }
}

function updateSay(now) {
  if (now > sayHideAt) sayEl.classList.remove('on');
  const head = new THREE.Vector3(CH.body.position.x, CH.body.position.y + (G.knocked ? 0.45 : 1.05), CH.body.position.z);
  const s = worldToScreen(head);
  if (!s.ok) { sayEl.classList.remove('on'); return; }
  sayEl.style.left = s.x + 'px';
  sayEl.style.top = clamp(s.y - 10, 90, window.innerHeight - 120) + 'px';
}

function keepOnPage(now) {
  const b = CH.body;
  if (b.type !== CANNON.Body.DYNAMIC) return;
  const pos = new THREE.Vector3(b.position.x, b.position.y, b.position.z);
  const ndc = pos.clone().project(camera);
  const dist = camera.position.distanceTo(pos);
  const halfH = Math.tan(camera.fov * Math.PI / 360) * Math.max(1.2, dist);
  const halfW = halfH * camera.aspect;
  let bounced = false;
  const xMax = .74, yMax = .52;
  if (ndc.x > xMax) { b.position.x -= (ndc.x - xMax) * halfW; b.velocity.x *= -.42; bounced = true; }
  else if (ndc.x < -xMax) { b.position.x -= (ndc.x + xMax) * halfW; b.velocity.x *= -.42; bounced = true; }
  if (ndc.y > yMax) { b.position.y -= (ndc.y - yMax) * halfH; if (b.velocity.y > 0) b.velocity.y *= -.32; bounced = true; }
  const zMin = b.position.x > 0.3 ? -0.9 : -2.35;
  if (b.position.z < zMin) { b.position.z = zMin; b.velocity.z *= -.45; bounced = true; }
  else if (b.position.z > 1.2) { b.position.z = 1.2; b.velocity.z *= -.45; bounced = true; }
  if (bounced && now - (G.lastBound || 0) > 220) {
    G.lastBound = now;
    shake(.5);
  }
}

function loop() {
  const now = performance.now();
  const dt = Math.min((now - prevT) / 1000, 0.05);
  prevT = now;

  if (G.playing && G.combo > 0 && now - G.lastHit > 2500) {
    G.combo = 0;
    setCombo(0);
  }
  if (G.playing && now - G.lastEvent > 20000) {
    G.lastEvent = now;
    say(pick(EVENTS), 2300);
  }

  updateHole(dt, now);
  try { world.step(1 / 60, dt, 3); } catch (err) { console.warn('physics step', err); }
  keepOnPage(now);
  syncChar(dt, now);
  syncItems(dt, now);
  updateLasers(now);
  updateCats(dt, now);
  updateSkills(dt, now);
  updateSay(now);
  for (let i = G.fading.length - 1; i >= 0; i--) {
    const f = G.fading[i];
    const k = (now - f.t) / 280;
    if (k >= 1) { scene.remove(f.mesh); G.fading.splice(i, 1); }
    else f.mesh.scale.setScalar(Math.max(0.02, 1 - k * 0.95));
  }

  if (G.shake > 0.01) {
    const sh = G.shake;
    camera.position.set(
      camBase.x + rand(-1, 1) * sh * 0.045,
      camBase.y + rand(-1, 1) * sh * 0.035,
      camBase.z + rand(-1, 1) * sh * 0.02
    );
    camera.lookAt(camLook.x + rand(-1, 1) * sh * 0.01, camLook.y + rand(-1, 1) * sh * 0.008, camLook.z);
    G.shake *= 0.86;
  } else {
    camera.position.copy(camBase);
    camera.lookAt(camLook);
  }

  if (chairBroken) {
    const g = chairBroken.g;
    const dt2 = Math.min(dt, 0.03);
    g.userData.vel.y -= 9.82 * dt2;
    g.position.addScaledVector(g.userData.vel, dt2);
    g.rotation.z += g.userData.spin * dt2;
    g.rotation.x += g.userData.spin * 0.6 * dt2;
    if (g.position.y < -1.5) { scene.remove(g); chairBroken = null; }
  }
  if (chair) chair.g.rotation.z *= 0.85;

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

/* ---------- game flow ---------- */
function resetChar() {
  const b = CH.body;
  b.type = CANNON.Body.STATIC;
  b.mass = 0;
  b.position.set(CH.stand.x, CH.stand.y, CH.stand.z);
  b.quaternion.set(0, 0, 0, 1);
  b.velocity.setZero();
  b.angularVelocity.setZero();
  b.updateMassProperties();
  G.knocked = false;
  G.tween = null;
  G.expUntil = 0;
  G.recoverAt = 0;
  CH.setExpression(G.phase === 1 ? 'smug' : G.phase === 2 ? 'beg' : 'dead');
  CH.setDamageRatio(0);
}
function resetGame() {
  G.round = 1;
  G.target = ROUND_TARGETS[0];
  G.dmg = 0;
  G.phase = 1;
  G.combo = 0;
  G.maxCombo = 0;
  G.hits = 0;
  G.shield = 0;
  G.shieldMax = 0;
  G.playing = false;
  G.startAt = 0;
  G.fightEndAt = 0;
  G.lastHit = 0;
  G.lastEvent = 0;
  G.lastSay = '';
  G.thrownOnce = false;
  G.mode = 'item';
  G.power = null;
  clearPowerSel();
  G.lastLaser = 0;
  laserBtn.classList.remove('on');
  holeBtn.classList.remove('on');
  clearHole();
  clearItems();
  clearChair();
  clearLasers();
  clearHole();
  clearCats();
  clearSkills();
  resetChar();
  updateHud();
  applyUnlockUI();
  setCombo(0);
  sayEl.classList.remove('on');
  hintEl.classList.remove('hide');
}
function startGame() {
  initAudio();
  resetGame();
  document.body.classList.add('ready');
  showScreen('');
  hideModals();
  $('#cascade').classList.remove('on');
  $('#final').classList.remove('on');
  G.started = true;
  G.playing = true;
  G.startAt = Date.now();
  G.lastEvent = performance.now();
  setTimeout(() => hintEl.classList.add('hide'), 14000);
  banner('第 1 轮', ROUND_NAMES[0]);
  applyUnlockUI();
  scheduleUnlock(1);
  updateHud();
  setTimeout(() => say('来吧，反正你也舍不得真打。', 2400), 1100);
}
function beginRound(first) {
  G.target = ROUND_TARGETS[Math.min(G.round - 1, ROUND_TARGETS.length - 1)];
  G.dmg = 0;
  G.phase = 1;
  G.shield = 0;
  G.shieldMax = 0;
  G.combo = 0;
  G.playing = false;
  clearItems();
  clearChair();
  clearLasers();
  clearHole();
  clearCats();
  clearSkills();
  resetChar();
  updateHud();
  setCombo(0);
  banner('第 ' + G.round + ' 轮', G.round <= TOTAL_ROUNDS ? ROUND_NAMES[G.round - 1] : '加时赛');
  applyUnlockUI();
  scheduleUnlock(G.round);
  setTimeout(() => {
    G.playing = true;
    G.lastEvent = performance.now();
    if (!first) {
      const arr = ROUND_LINES[Math.min(G.round, 3)] || ROUND_LINES[3];
      say(pick(arr), 1900);
    }
  }, 950);
}
function continueRound() {
  hideModals();
  G.round++;
  beginRound(false);
}
function forgive() {
  hideModals();
  setTimeout(startLetter, 450);
}
function goHome() {
  hideModals();
  clearTimeout(unlockDelayTimer);
  clearTimeout(unlockTimer);
  $('#unlock').classList.remove('show');
  resetGame();
  G.started = false;
  document.body.classList.remove('ready');
  showScreen('start');
  $('#cascade').classList.remove('on');
  $('#final').classList.remove('on');
}

/* ---------- letter ---------- */
const LETTER = [
  '宝宝，我知道错了，我不该骗你。',
  '恋爱里应该是坦诚相待的，什么事都该跟你说实话。对不起，让你伤心了。',
  '我知道你肯定很难受，也会想，我为什么要这样。我当时的想法是「不想让你生气」——可这不是理由。因为瞒着你，你知道真相后只会更生气。如果换成我被这样对待，我也会很生气。',
  '甜甜，我喜欢你是真的，爱你也是真的。想和你谈很久的恋爱，想和你走很远很远，想一直黏着你，也会记得给你留一点空间。',
  '你说不想天天和我连麦的时候，我其实有点伤心，但我能理解：你自己每天的时间本来就不多，我不能那么自私。另一方面我又挺开心的，因为你直接跟我说了。你真的很坦诚，真的很好，我很喜欢。以后我也会像你这样，什么都跟你说。',
  '我相信，以后我们回忆起这些事，是笑着说的。我们可以克服一切困难，走很远很远。',
  '我爱你，甜甜。',
  '不要生气了呗。'
];
const letterScroll = $('#letterScroll');
const letterNext = $('#btnLetterNext');
const paperTip = $('#paperTip');
let ps = [], pIdx = 0, cIdx = 0, typing = false, fastUntil = 0, caret = null, typeTimer = null, cascadeTimer = null;

function buildLetter() {
  LETTER.forEach(() => {
    const p = document.createElement('p');
    const s = document.createElement('span');
    s.className = 'txt';
    p.appendChild(s);
    letterScroll.appendChild(p);
  });
  ps = Array.from(letterScroll.querySelectorAll('p'));
}
function removeCaret() { if (caret) { caret.remove(); caret = null; } }
function attachCaret(p) {
  removeCaret();
  caret = document.createElement('span');
  caret.className = 'caret';
  p.appendChild(caret);
}
function startLetter() {
  clearTimeout(typeTimer);
  showScreen('letter');
  letterScroll.scrollTop = 0;
  ps.forEach(p => {
    p.querySelector('.txt').textContent = '';
    p.classList.remove('on');
  });
  const old = letterScroll.querySelector('.seal');
  if (old) old.remove();
  pIdx = 0; cIdx = 0; typing = true; fastUntil = 0;
  letterNext.classList.remove('on');
  paperTip.style.display = '';
  removeCaret();
  typeTimer = setTimeout(typeStep, 550);
}
function typeStep() {
  if (!typing) return;
  if (pIdx >= ps.length) { finishType(); return; }
  const p = ps[pIdx];
  p.classList.add('on');
  if (cIdx < LETTER[pIdx].length) {
    p.querySelector('.txt').textContent += LETTER[pIdx][cIdx++];
    if (cIdx === 1) attachCaret(p);
    if (cIdx % 4 === 0) typeTick();
    if (cIdx % 5 === 0) letterScroll.scrollTop = letterScroll.scrollHeight;
    typeTimer = setTimeout(typeStep, Date.now() < fastUntil ? 5 : 30);
  } else {
    removeCaret();
    pIdx++; cIdx = 0;
    typeTimer = setTimeout(typeStep, 340);
  }
}
function finishType() {
  typing = false;
  removeCaret();
  ps.forEach(p => p.classList.add('on'));
  if (!letterScroll.querySelector('.seal')) {
    const seal = document.createElement('div');
    seal.className = 'seal on';
    seal.textContent = '小江';
    letterScroll.appendChild(seal);
  }
  letterScroll.scrollTop = letterScroll.scrollHeight;
  letterNext.classList.add('on');
  paperTip.style.display = 'none';
}
function skipLetter() {
  clearTimeout(typeTimer);
  typing = false;
  removeCaret();
  ps.forEach((p, i) => { p.querySelector('.txt').textContent = LETTER[i]; p.classList.add('on'); });
  if (!letterScroll.querySelector('.seal')) {
    const seal = document.createElement('div');
    seal.className = 'seal on';
    seal.textContent = '小江';
    letterScroll.appendChild(seal);
  }
  letterScroll.scrollTop = letterScroll.scrollHeight;
  letterNext.classList.remove('on');
  clearTimeout(cascadeTimer);
  cascadeTimer = setTimeout(showCascade, 300);
}
function buildCascade() {
  const box = $('#cascadeLines');
  for (let i = 0; i < 20; i++) {
    const d = document.createElement('div');
    d.className = 'cl';
    d.textContent = '不要生气了呗';
    d.style.top = (2.5 + i * 4.65).toFixed(2) + '%';
    d.style.setProperty('--o', (0.22 + Math.random() * 0.62).toFixed(2));
    const mode = i % 3;
    d.style.textAlign = mode === 0 ? 'left' : mode === 1 ? 'center' : 'right';
    if (mode === 0) d.style.paddingLeft = (7 + Math.random() * 16).toFixed(1) + '%';
    if (mode === 2) d.style.paddingRight = (7 + Math.random() * 16).toFixed(1) + '%';
    box.appendChild(d);
  }
}
function showCascade() {
  letterNext.classList.remove('on');
  showScreen('');
  $('#cascade').classList.add('on');
  $('#cascade').classList.remove('dim');
  $('#final').classList.remove('on');
  const lines = Array.from(document.querySelectorAll('.cl'));
  lines.forEach(l => l.classList.remove('in'));
  requestAnimationFrame(() => lines.forEach((l, i) => setTimeout(() => l.classList.add('in'), i * 55)));
  const base = 1200 + lines.length * 55;
  setTimeout(() => $('#cascade').classList.add('dim'), base + 200);
  setTimeout(() => $('#final').classList.add('on'), base + 650);
}
function endScreen() {
  $('#cascade').classList.remove('on');
  $('#final').classList.remove('on');
  document.body.classList.remove('ready');
  showScreen('end');
  const secs = Math.max(1, Math.round(((G.fightEndAt || Date.now()) - G.startAt) / 1000));
  $('#stTime').textContent = String(Math.floor(secs / 60)).padStart(2, '0') + ':' + String(secs % 60).padStart(2, '0');
  $('#stHits').textContent = G.hits;
  $('#stRounds').textContent = G.round;
  $('#stCombo').textContent = G.maxCombo;
  chime();
}

/* ---------- input ---------- */
canvas.addEventListener('pointerdown', e => {
  if (!G.playing) return;
  if (G.mode === 'laser') fireLaser(e.clientX, e.clientY);
  else if (G.mode === 'hole') castHole(e.clientX, e.clientY);
  else if (G.mode === 'cat') summonCat(G.power, e.clientX, e.clientY);
  else if (G.mode === 'skill') castSkill(G.power, e.clientX, e.clientY);
  else throwItem(G.selected, e.clientX, e.clientY);
});
window.addEventListener('keydown', e => {
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 9) selectItem(n - 1);
  if (e.key === 'q' || e.key === 'Q') selectLaser();
  if (e.key === 'e' || e.key === 'E') selectHole();
});
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  fitCamera();
});
$('#btnStart').addEventListener('click', startGame);
$('#laserBtn').addEventListener('click', selectLaser);
$('#holeBtn').addEventListener('click', selectHole);
$('#btnForgive').addEventListener('click', forgive);
$('#btnContinue').addEventListener('click', continueRound);
$('#btnHug').addEventListener('click', endScreen);
$('#btnAgain').addEventListener('click', startGame);
$('#btnHome').addEventListener('click', goHome);
$('#skipLetter').addEventListener('click', skipLetter);
$('#btnLetterNext').addEventListener('click', () => { uiClick(); showCascade(); });
letterScroll.addEventListener('pointerdown', () => { fastUntil = Date.now() + 900; });
$('#mute').addEventListener('click', () => {
  muted = !muted;
  $('#mute').classList.toggle('muted', muted);
  if (master) master.gain.value = muted ? 0 : 0.6;
});

/* ---------- init ---------- */
buildPowerbar();
buildLetter();
buildCascade();
updateHud();
requestAnimationFrame(loop);

window.__BDXJ = { G, ITEMS, throwItem, damageBoss, finishRound, showChoice, startLetter, showCascade, endScreen, CH, voices: () => Object.keys(voiceBuffers) };
