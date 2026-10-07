
"use strict";

/* ================= 可配置区 =================
   anniversary：在一起的纪念日，格式 "年-月-日"，例如 "2024-03-14"。
   填了以后，信的结尾会显示「这是我们在一起的第 N 天」。 */
const CONFIG = {
  anniversary: null
};
/* ============================================ */

// ---------- 画布 ----------
const bg = document.getElementById("bg");
const fx = document.getElementById("fx");
const bctx = bg.getContext("2d");
const fctx = fx.getContext("2d");
const DPR = Math.min(window.devicePixelRatio || 1, 2);
let W = 0, H = 0;

function resize() {
  W = window.innerWidth; H = window.innerHeight;
  [bg, fx].forEach(c => {
    c.width = W * DPR; c.height = H * DPR;
    c.getContext("2d").setTransform(DPR, 0, 0, DPR, 0, 0);
  });
}
window.addEventListener("resize", resize);
resize();

// ---------- 贴图预渲染 ----------
function makePetalSprite(c1, c2) {
  const s = document.createElement("canvas");
  s.width = s.height = 96;
  const x = s.getContext("2d");
  x.translate(48, 48);
  const g = x.createLinearGradient(0, -40, 0, 40);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  x.beginPath();
  x.moveTo(0, -36);
  x.bezierCurveTo(24, -34, 34, -8, 20, 22);
  x.bezierCurveTo(12, 36, -12, 36, -20, 22);
  x.bezierCurveTo(-34, -8, -24, -34, 0, -36);
  x.closePath();
  x.fillStyle = g;
  x.fill();
  x.beginPath();
  x.moveTo(0, -30); x.quadraticCurveTo(3, 0, 0, 28);
  x.strokeStyle = "rgba(255,255,255,.4)";
  x.lineWidth = 2;
  x.stroke();
  return s;
}
function makeGlowSprite() {
  const s = document.createElement("canvas");
  s.width = s.height = 64;
  const x = s.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,235,242,.9)");
  g.addColorStop(0.4, "rgba(255,200,220,.35)");
  g.addColorStop(1, "rgba(255,200,220,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return s;
}
const petalSprites = [
  makePetalSprite("#ffd9e6", "#ffb3cc"),
  makePetalSprite("#ffe9f0", "#ffc9da"),
  makePetalSprite("#fff2f6", "#ffd6e4")
];
const glowSprite = makeGlowSprite();

// ---------- 樱花雨 + 光尘 ----------
let petalTarget = 50;
const petals = [];
const dusts = [];
function newPetal(fromTop) {
  return {
    x: Math.random() * W,
    y: fromTop ? -40 - Math.random() * 60 : Math.random() * H,
    size: 13 + Math.random() * 20,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.02,
    vy: 0.45 + Math.random() * 0.75,
    swayAmp: 0.6 + Math.random() * 1.4,
    swaySpeed: 0.008 + Math.random() * 0.012,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.5 + Math.random() * 0.45,
    img: petalSprites[Math.floor(Math.random() * petalSprites.length)]
  };
}
for (let i = 0; i < petalTarget; i++) petals.push(newPetal(false));
for (let i = 0; i < 26; i++) {
  dusts.push({
    x: Math.random() * W, y: Math.random() * H,
    r: 1.5 + Math.random() * 3.5,
    vx: (Math.random() - 0.5) * 0.15, vy: -0.08 - Math.random() * 0.15,
    tw: Math.random() * Math.PI * 2, twSpeed: 0.01 + Math.random() * 0.02
  });
}

// ---------- 樱花爆 ----------
const bursts = [];
function spawnBurst(px, py) {
  const n = 20 + Math.floor(Math.random() * 10);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 1.5 + Math.random() * 4.5;
    bursts.push({
      x: px, y: py,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2,
      size: 7 + Math.random() * 13,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.25,
      life: 1,
      decay: 0.012 + Math.random() * 0.012,
      img: petalSprites[Math.floor(Math.random() * petalSprites.length)]
    });
  }
}

// ---------- 主循环 ----------
let t0 = 0;
function loop(ts) {
  const dt = Math.min((ts - t0) / 16.7, 3) || 1;
  t0 = ts;
  bctx.clearRect(0, 0, W, H);

  dusts.forEach(d => {
    d.x += d.vx * dt; d.y += d.vy * dt; d.tw += d.twSpeed * dt;
    if (d.y < -10) { d.y = H + 10; d.x = Math.random() * W; }
    if (d.x < -10) d.x = W + 10;
    if (d.x > W + 10) d.x = -10;
    bctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(d.tw));
    bctx.drawImage(glowSprite, d.x - d.r * 4, d.y - d.r * 4, d.r * 8, d.r * 8);
  });

  if (petals.length < petalTarget && Math.random() < 0.1) petals.push(newPetal(true));

  petals.forEach(p => {
    p.phase += p.swaySpeed * dt;
    p.x += Math.sin(p.phase) * p.swayAmp * dt * 0.6;
    p.y += p.vy * dt;
    p.angle += p.spin * dt;
    if (p.y > H + 50) { Object.assign(p, newPetal(true)); }
    if (p.x < -60) p.x = W + 50;
    if (p.x > W + 60) p.x = -50;
    bctx.save();
    bctx.globalAlpha = p.opacity;
    bctx.translate(p.x, p.y);
    bctx.rotate(p.angle);
    bctx.drawImage(p.img, -p.size / 2, -p.size / 2, p.size, p.size);
    bctx.restore();
  });
  bctx.globalAlpha = 1;

  fctx.clearRect(0, 0, W, H);
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.vy += 0.05 * dt;
    b.vx *= Math.pow(0.985, dt); b.vy *= Math.pow(0.99, dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.angle += b.spin * dt;
    b.life -= b.decay * dt;
    if (b.life <= 0) { bursts.splice(i, 1); continue; }
    fctx.save();
    fctx.globalAlpha = Math.max(b.life, 0);
    fctx.translate(b.x, b.y);
    fctx.rotate(b.angle);
    const s = b.size * (0.5 + b.life * 0.5);
    fctx.drawImage(b.img, -s / 2, -s / 2, s, s);
    fctx.restore();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- 生成式钢琴曲 ----------
let actx = null, master = null, musicOn = true;
const CHORDS = [
  [261.63, 329.63, 392.00],
  [196.00, 246.94, 293.66],
  [220.00, 261.63, 329.63],
  [164.81, 196.00, 246.94],
  [174.61, 220.00, 261.63],
  [261.63, 329.63, 392.00],
  [174.61, 220.00, 261.63],
  [196.00, 246.94, 293.66]
];
const PATTERN = [0, 1, 2, 1, 0, 1, 2, 1];
const STEP = 0.42;
let chordIdx = 0, stepIdx = 0, nextTime = 0;

function note(t, freq, dur, vol) {
  const o = actx.createOscillator();
  const g = actx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}
function schedule() {
  if (!actx) return;
  while (nextTime < actx.currentTime + 0.15) {
    const chord = CHORDS[chordIdx];
    const tone = chord[PATTERN[stepIdx]];
    const t = nextTime + (Math.random() - 0.5) * 0.018;
    const octave = (stepIdx === 2 || stepIdx === 6) ? 2 : 1;
    note(t, tone * octave, 1.5, 0.055 + Math.random() * 0.02);
    if (stepIdx === 0) note(t, chord[0] / 2, 2.6, 0.04);
    nextTime += STEP;
    stepIdx++;
    if (stepIdx >= PATTERN.length) {
      stepIdx = 0;
      chordIdx = (chordIdx + 1) % CHORDS.length;
    }
  }
}
function startMusic() {
  try {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    master = actx.createGain();
    master.gain.value = 0.9;
    const delay = actx.createDelay(1);
    delay.delayTime.value = 0.34;
    const fb = actx.createGain(); fb.gain.value = 0.26;
    const wet = actx.createGain(); wet.gain.value = 0.16;
    master.connect(actx.destination);
    master.connect(delay); delay.connect(fb); fb.connect(delay);
    delay.connect(wet); wet.connect(actx.destination);
    nextTime = actx.currentTime + 0.1;
    setInterval(schedule, 40);
  } catch (e) { /* 不支持就安静播放 */ }
}
const musicBtn = document.getElementById("musicBtn");
musicBtn.addEventListener("click", function (e) {
  e.stopPropagation();
  if (!actx) return;
  musicOn = !musicOn;
  if (musicOn) { actx.resume(); } else { actx.suspend(); }
  musicBtn.classList.toggle("off", !musicOn);
});

// ---------- 第一关：集光 ----------
const gatherStage = document.getElementById("gather");
const gatherCount = document.getElementById("gatherCount");
let lit = 0;
document.querySelectorAll(".orb").forEach(function (orb) {
  orb.addEventListener("click", function () {
    if (orb.classList.contains("lit")) return;
    orb.classList.add("lit");
    const r = orb.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    spawnBurst(cx, cy);
    const rip = document.createElement("span");
    rip.className = "ripple";
    rip.style.left = cx + "px"; rip.style.top = cy + "px";
    document.body.appendChild(rip);
    setTimeout(function () { rip.remove(); }, 700);
    lit++;
    gatherCount.textContent = lit + " / 5";
    if (lit >= 5) {
      setTimeout(function () {
        gatherStage.classList.add("hidden");
        document.getElementById("envelopeStage").classList.remove("hidden");
      }, 700);
    }
  });
});

// ---------- 第二关：长按火漆拆信 ----------
const seal = document.getElementById("seal");
const envelope = document.getElementById("envelope");
const holdProg = document.getElementById("holdProg");
const RING_LEN = 251.3;
const HOLD_MS = 850;
let holding = false, holdStart = 0, holdRAF = 0, opened = false;

function holdTick() {
  const p = Math.min((performance.now() - holdStart) / HOLD_MS, 1);
  holdProg.style.strokeDashoffset = RING_LEN * (1 - p);
  if (p >= 1) { openEnvelope(); return; }
  if (holding) holdRAF = requestAnimationFrame(holdTick);
}
seal.addEventListener("pointerdown", function (e) {
  if (opened) return;
  e.preventDefault();
  holding = true;
  holdStart = performance.now();
  holdProg.style.transition = "none";
  holdRAF = requestAnimationFrame(holdTick);
});
function cancelHold() {
  if (opened || !holding) return;
  holding = false;
  cancelAnimationFrame(holdRAF);
  holdProg.style.transition = "stroke-dashoffset .3s ease";
  holdProg.style.strokeDashoffset = RING_LEN;
}
seal.addEventListener("pointerup", cancelHold);
seal.addEventListener("pointercancel", cancelHold);
seal.addEventListener("pointerleave", cancelHold);

function openEnvelope() {
  if (opened) return;
  opened = true;
  holding = false;
  cancelAnimationFrame(holdRAF);
  const r = seal.getBoundingClientRect();
  spawnBurst(r.left + r.width / 2, r.top + r.height / 2);
  seal.classList.add("crack");
  setTimeout(function () { envelope.classList.add("open"); }, 300);
  setTimeout(function () {
    document.getElementById("envelopeStage").classList.add("hidden");
    document.body.classList.remove("locked");
    document.getElementById("paper").classList.add("show");
    document.querySelector("#letter header").classList.add("visible");
    window.scrollTo(0, 0);
    letterOpen = true;
    beginAutoScroll();
    setTimeout(function () {
      window.addEventListener("pointerdown", onTapBurst);
    }, 800);
  }, 1900);
}

// ---------- 滚动显现 ----------
const io = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (en.isIntersecting) {
      en.target.classList.add("visible");
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

// ---------- 打字机 ----------
let finaleStarted = false;
function typeLine(el, text, speed, done) {
  el.classList.add("typing");
  let i = 0;
  const timer = setInterval(function () {
    el.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(timer);
      setTimeout(function () {
        el.classList.remove("typing");
        if (done) done();
      }, 380);
    }
  }, speed);
}
const finaleIO = new IntersectionObserver(function (entries) {
  entries.forEach(function (en) {
    if (en.isIntersecting && !finaleStarted) {
      finaleStarted = true;
      document.body.classList.add("finale");
      petalTarget = 95;
      const lines = document.querySelectorAll(".tw");
      let li = 0;
      (function nextLine() {
        if (li >= lines.length) {
          const cb = document.getElementById("counterBox");
          fillCounter(cb);
          cb.classList.add("visible");
          return;
        }
        const el = lines[li++];
        setTimeout(function () {
          typeLine(el, el.getAttribute("data-text"), 95, nextLine);
        }, li === 1 ? 500 : 200);
      })();
      finaleIO.disconnect();
    }
  });
}, { threshold: 0.4 });
finaleIO.observe(document.getElementById("finale"));

// ---------- 天数计数 ----------
function fillCounter(box) {
  if (!CONFIG.anniversary) {
    box.innerHTML = "日子还长，我们慢慢数。";
    return;
  }
  const start = new Date(CONFIG.anniversary + "T00:00:00");
  const days = Math.floor((Date.now() - start.getTime()) / 86400000) + 1;
  box.innerHTML = "这是我们在一起的<br><span class=\"days\">0</span>天";
  const el = box.querySelector(".days");
  const t0 = performance.now(), dur = 1600;
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(days * ease);
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}

// ---------- 点击放樱花（信打开后才生效） ----------
let letterOpen = false;
function onTapBurst(e) {
  if (!letterOpen) return;
  if (e.target.closest("#musicBtn")) return;
  spawnBurst(e.clientX, e.clientY);
}

// ---------- 自动缓缓下滑 ----------
let autoTimer = null;
function beginAutoScroll() {
  autoTimer = setInterval(function () {
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 12) {
      clearInterval(autoTimer); autoTimer = null; return;
    }
    window.scrollBy({ top: window.innerHeight * 0.55, behavior: "smooth" });
  }, 2100);
  const stop = function () {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchmove", stop);
  };
  window.addEventListener("wheel", stop);
  window.addEventListener("touchmove", stop);
}

// ---------- 开场 ----------
const startOverlay = document.getElementById("start");
let started = false;
startOverlay.addEventListener("click", function () {
  if (started) return;
  started = true;
  startOverlay.classList.add("hidden");
  startMusic();
  musicBtn.classList.add("show");
});
