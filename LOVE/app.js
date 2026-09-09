/* =========================================================
 * 给你的小游戏站 —— 纯静态，无依赖
 * 三个小游戏：翻翻乐 / 默契大考验 / 爱心捕手
 * 通关后解锁彩蛋
 * ========================================================= */
(function () {
  'use strict';

  /* ---------------- 存档 ---------------- */
  var SAVE_KEY = 'mini_game_save_v1';
  var defaultSave = {
    memory: { done: false, bestMoves: null, bestTime: null },
    quiz:   { done: false, bestScore: null },
    hearts: { done: false, bestScore: null },
    sound: true
  };

  function loadSave() {
    try {
      var s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (s && typeof s === 'object') {
        return {
          memory: Object.assign({}, defaultSave.memory, s.memory || {}),
          quiz:   Object.assign({}, defaultSave.quiz,   s.quiz   || {}),
          hearts: Object.assign({}, defaultSave.hearts, s.hearts || {}),
          sound:  typeof s.sound === 'boolean' ? s.sound : true
        };
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(defaultSave));
  }
  var save = loadSave();
  function persist() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {}
  }

  /* ---------------- 音效（WebAudio 合成，无音频文件） ---------------- */
  var audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { return; }
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }
  function tone(freq, dur, delay, type, vol) {
    if (!save.sound || !audioCtx) return;
    var t = audioCtx.currentTime + (delay || 0);
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.14, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  }
  var SFX = {
    click: function () { tone(460, 0.06, 0, 'sine', 0.08); },
    flip:  function () { tone(540, 0.09, 0, 'triangle', 0.12); },
    match: function () { tone(660, 0.1, 0, 'triangle', 0.14); tone(880, 0.14, 0.09, 'triangle', 0.14); },
    wrong: function () { tone(200, 0.2, 0, 'sawtooth', 0.07); },
    pop:   function () { tone(680 + Math.random() * 240, 0.07, 0, 'sine', 0.11); },
    gold:  function () { tone(880, 0.09, 0, 'sine', 0.15); tone(1175, 0.1, 0.07, 'sine', 0.15); tone(1568, 0.16, 0.14, 'sine', 0.15); },
    win:   function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.2, i * 0.12, 'triangle', 0.14); }); }
  };

  /* ---------------- 背景音乐（mysoul.mp3，循环播放，淡入淡出） ---------------- */
  var bgm = document.getElementById('bgm');
  var music = { playing: false };
  var fadeTimer = null;
  var MUSIC_VOL = 0.45;

  function fadeBgm(target, dur, done) {
    if (fadeTimer) clearInterval(fadeTimer);
    var from = bgm.volume;
    var t0 = Date.now();
    fadeTimer = setInterval(function () {
      var p = Math.min(1, (Date.now() - t0) / dur);
      bgm.volume = from + (target - from) * p;
      if (p >= 1) { clearInterval(fadeTimer); fadeTimer = null; if (done) done(); }
    }, 60);
  }

  function startMusic() {
    if (music.playing) return;
    music.playing = true;
    updateMusicBtn();
    try { bgm.currentTime = bgm.currentTime || 0; } catch (e) {}
    bgm.volume = 0;
    var p = bgm.play();
    if (p && p.then) {
      p.then(function () { fadeBgm(MUSIC_VOL, 1400); })
       .catch(function () {
         // 浏览器拦截自动播放时，保持"待播放"状态，等用户点按钮
         music.playing = false;
         updateMusicBtn();
       });
    } else {
      fadeBgm(MUSIC_VOL, 1400);
    }
  }

  function stopMusic() {
    if (!music.playing) { updateMusicBtn(); return; }
    music.playing = false;
    updateMusicBtn();
    fadeBgm(0, 500, function () {
      bgm.pause();
      try { bgm.currentTime = 0; } catch (e) {}
    });
  }

  function updateMusicBtn() {
    var b = document.getElementById('music-btn');
    if (b) {
      b.textContent = music.playing ? '⏸ 暂停音乐' : '🎵 播放音乐';
      b.classList.toggle('playing', music.playing);
    }
  }

  /* ---------------- 页面路由 ---------------- */
  var pages = ['home', 'game', 'secret'];
  var gameArea = document.getElementById('game-area');
  var cleanupFn = null;

  function showPage(name) {
    pages.forEach(function (p) {
      document.getElementById('page-' + p).classList.toggle('active', p === name);
    });
    window.scrollTo(0, 0);
  }

  function goHome() {
    stopMusic();
    if (cleanupFn) { try { cleanupFn(); } catch (e) {} cleanupFn = null; }
    document.getElementById('secret-bg').innerHTML = '';
    showPage('home');
    refreshHome();
  }

  function startGame(name) {
    if (cleanupFn) { try { cleanupFn(); } catch (e) {} cleanupFn = null; }
    gameArea.innerHTML = '';
    showPage('game');
    if (name === 'memory') renderMemory(gameArea);
    else if (name === 'quiz') renderQuiz(gameArea);
    else if (name === 'hearts') renderHearts(gameArea);
  }

  /* ---------------- 首页状态 ---------------- */
  function refreshHome() {
    var m = save.memory, q = save.quiz, h = save.hearts;
    setText('best-memory', m.done ? '最佳：' + m.bestMoves + '步 / ' + m.bestTime + '秒' : '还没玩过');
    setText('best-quiz',   q.done ? '最佳：' + q.bestScore + '/10 分' : '还没玩过');
    setText('best-hearts', h.done ? '最佳：' + h.bestScore + ' 分' : '还没玩过');

    var doneCount = (m.done ? 1 : 0) + (q.done ? 1 : 0) + (h.done ? 1 : 0);
    var unlocked = doneCount === 3;
    var btn = document.getElementById('secret-btn');
    btn.classList.toggle('locked', !unlocked);
    btn.disabled = !unlocked;
    setText('secret-text', unlocked ? '一个小彩蛋，点开 →' : '通关进度 ' + doneCount + '/3 🔒');
  }
  function setText(id, txt) {
    var el = document.getElementById(id);
    if (el) el.textContent = txt;
  }

  /* ---------------- 工具 ---------------- */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function rand(min, max) { return min + Math.random() * (max - min); }

  /* =========================================================
   * 游戏一：翻翻乐（8 对卡片，记步数与用时）
   * ========================================================= */
  var MEMO_EMOJIS = ['🐱', '🐶', '🦊', '🐼', '🐰', '🐻', '🦁', '🐨'];

  function renderMemory(root) {
    root.innerHTML =
      '<h2 class="game-title">翻翻乐 🃏</h2>' +
      '<p class="game-tip">找出全部 8 对相同的小动物<br>步数越少，越厉害</p>' +
      '<div class="memory-stats"><span>步数：<b id="mm-moves">0</b></span><span>用时：<b id="mm-time">0</b> 秒</span></div>' +
      '<div class="memory-board" id="mm-board"></div>' +
      '<div id="mm-result"></div>';

    var board = document.getElementById('mm-board');
    var cards = shuffle(MEMO_EMOJIS.concat(MEMO_EMOJIS));

    var first = null, locked = false;
    var moves = 0, matched = 0;
    var startTime = null, timerId = null;

    cards.forEach(function (emoji) {
      var card = document.createElement('button');
      card.className = 'mem-card';
      card.setAttribute('aria-label', '卡片');
      card.innerHTML =
        '<span class="mem-inner">' +
          '<span class="mem-face mem-back">?</span>' +
          '<span class="mem-face mem-front">' + emoji + '</span>' +
        '</span>';
      card.addEventListener('click', function () { onFlip(card, emoji); });
      board.appendChild(card);
    });

    cleanupFn = function () { if (timerId) clearInterval(timerId); };

    function onFlip(card, emoji) {
      if (locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
      ensureAudio(); SFX.flip();
      card.classList.add('flipped');

      if (!startTime) {
        startTime = Date.now();
        timerId = setInterval(function () {
          setText('mm-time', String(Math.floor((Date.now() - startTime) / 1000)));
        }, 250);
      }

      if (!first) { first = { card: card, emoji: emoji }; return; }

      moves++;
      setText('mm-moves', String(moves));

      if (first.emoji === emoji) {
        first.card.classList.add('matched');
        card.classList.add('matched');
        first = null; matched++;
        SFX.match();
        if (matched === MEMO_EMOJIS.length) win();
      } else {
        locked = true;
        var prev = first.card;
        first = null;
        setTimeout(function () {
          SFX.wrong();
          prev.classList.remove('flipped');
          card.classList.remove('flipped');
          locked = false;
        }, 680);
      }
    }

    function win() {
      clearInterval(timerId);
      var time = Math.floor((Date.now() - startTime) / 1000);
      SFX.win();

      var rec = save.memory;
      var isNew = !rec.done || moves < rec.bestMoves;
      rec.done = true;
      if (rec.bestMoves === null || moves < rec.bestMoves) rec.bestMoves = moves;
      if (rec.bestTime === null || time < rec.bestTime) rec.bestTime = time;
      persist();

      document.getElementById('mm-result').innerHTML =
        '<div class="result-box">🎉 全部找到啦！<br>' +
        moves + ' 步 · ' + time + ' 秒' +
        (isNew ? '<br><span class="new-best">新纪录！</span>' : '') +
        '</div>' +
        '<div class="result-actions">' +
          '<button class="primary-btn" id="mm-again">再来一局</button>' +
          '<button class="ghost-btn" id="mm-home">回首页</button>' +
        '</div>';

      document.getElementById('mm-again').addEventListener('click', function () { SFX.click(); renderMemory(root); });
      document.getElementById('mm-home').addEventListener('click', function () { SFX.click(); goHome(); });
    }
  }

  /* =========================================================
   * 游戏二：默契大考验（10 题，答完出评语）
   * ========================================================= */
  var QUIZ = [
    { q: '我平时主要玩什么游戏？',        opts: ['永劫无间', '王者荣耀', '原神', '英雄联盟'],        answer: '永劫无间' },
    { q: '我最期待的游戏是？',            opts: ['影之刃零', '黑神话：悟空', 'GTA6', '塞尔达新作'],  answer: '影之刃零' },
    { q: '我吃火锅喜欢什么锅底？',        opts: ['酸辣锅', '麻辣锅', '清汤锅', '番茄锅'],            answer: '酸辣锅' },
    { q: '我健身一般练多久？',            opts: ['1小时', '半小时', '2小时', '5分钟（主要去拍照）'], answer: '1小时' },
    { q: '我有多高？',                    opts: ['178cm', '175cm', '180cm', '185cm'],               answer: '178cm' },
    { q: '我有多重？',                    opts: ['115斤', '130斤', '140斤', '100斤'],               answer: '115斤' },
    { q: '我家小猫叫什么名字？',          opts: ['token', '糯米', '团子', '咪咪'],                  answer: 'token' },
    { q: '我们是哪一天认识的？',          opts: ['2026/8/26', '2026/8/20', '2026/9/1', '2026/8/14'],answer: '2026/8/26' },
    { q: '我最喜欢吃什么零食？',          opts: ['薯片', '巧克力', '辣条', '饼干'],                  answer: '薯片' },
    { q: '最后一题：你喜欢我吗？',        opts: ['喜欢', '很喜欢', '超级喜欢', '以上都对'],          answer: null }
  ];
  var RIGHT_SAY = ['没错！', '可以啊，这题都会！', '答对了，记你一功 ✨', '稳，很稳。'];
  var WRONG_SAY = '哈哈不对，正确答案是「{a}」，小本本记下了';
  var SPECIAL_SAY = '这题没有错误答案，满分直接收下 😌';

  function renderQuiz(root) {
    root.innerHTML =
      '<h2 class="game-title">默契大考验 💭</h2>' +
      '<p class="game-tip">10 道关于我的小题<br>答对了算你厉害，答错了……下次补考</p>' +
      '<div class="quiz-progress"><span id="qz-count">1/10</span><div class="quiz-bar"><i id="qz-bar"></i></div></div>' +
      '<div id="qz-body"></div>';

    var index = 0, score = 0;
    renderQuestion();

    function renderQuestion() {
      var item = QUIZ[index];
      var options = shuffle(item.opts);
      var body = document.getElementById('qz-body');

      setText('qz-count', (index + 1) + '/10');
      document.getElementById('qz-bar').style.width = (index / QUIZ.length * 100) + '%';

      body.innerHTML =
        '<h3 class="quiz-question">' + item.q + '</h3>' +
        '<div class="quiz-options" id="qz-opts"></div>' +
        '<div class="quiz-feedback" id="qz-feedback"></div>' +
        '<div class="quiz-next-wrap"><button class="primary-btn hidden" id="qz-next">下一题</button></div>';

      var optsBox = document.getElementById('qz-opts');
      options.forEach(function (opt) {
        var b = document.createElement('button');
        b.className = 'quiz-opt';
        b.textContent = opt;
        b.addEventListener('click', function () { onAnswer(b, opt, item); });
        optsBox.appendChild(b);
      });
    }

    function onAnswer(btn, opt, item) {
      ensureAudio();
      var allBtns = document.querySelectorAll('#qz-opts .quiz-opt');
      allBtns.forEach(function (b) { b.disabled = true; });

      var feedback = document.getElementById('qz-feedback');
      var nextBtn = document.getElementById('qz-next');

      // answer 为 null 表示任意答案都正确（最后一题）
      var correct = (item.answer === null) || (opt === item.answer);
      if (correct) {
        score++;
        btn.classList.add('right');
        feedback.textContent = item.answer === null ? SPECIAL_SAY : RIGHT_SAY[Math.floor(Math.random() * RIGHT_SAY.length)];
        SFX.match();
      } else {
        btn.classList.add('wrong');
        allBtns.forEach(function (b) { if (b.textContent === item.answer) b.classList.add('right'); });
        feedback.textContent = WRONG_SAY.replace('{a}', item.answer);
        SFX.wrong();
      }

      nextBtn.textContent = (index === QUIZ.length - 1) ? '看结果 →' : '下一题';
      nextBtn.classList.remove('hidden');
      nextBtn.onclick = function () {
        SFX.click();
        index++;
        if (index < QUIZ.length) renderQuestion();
        else showResult();
      };
    }

    function showResult() {
      document.getElementById('qz-bar').style.width = '100%';
      SFX.win();

      var rec = save.quiz;
      rec.done = true;
      if (rec.bestScore === null || score > rec.bestScore) rec.bestScore = score;
      persist();

      var comment;
      if (score === 10)      comment = '满分！说实话，你是不是偷偷翻我朋友圈了？';
      else if (score >= 8)   comment = '就差一丢丢满分，看来咱俩还得再多吃几顿饭';
      else if (score >= 5)   comment = '及格了，也就刚及格那种，继续努力啊同学';
      else                   comment = '行吧，我在你心里还是个谜。没关系，日子长着呢';

      document.getElementById('qz-body').innerHTML =
        '<div class="result-box">' +
          '<div class="quiz-score">' + score + '<small> / 10 分</small></div>' +
          '<div style="margin-top:10px;font-size:15px;font-weight:600;line-height:1.8;">' + comment + '</div>' +
        '</div>' +
        '<div class="result-actions">' +
          '<button class="primary-btn" id="qz-again">再测一次</button>' +
          '<button class="ghost-btn" id="qz-home">回首页</button>' +
        '</div>';

      document.getElementById('qz-again').addEventListener('click', function () { SFX.click(); renderQuiz(root); });
      document.getElementById('qz-home').addEventListener('click', function () { SFX.click(); goHome(); });
    }
  }

  /* =========================================================
   * 游戏三：爱心捕手（30 秒，紫心 +1 / 金心 +3，20 分通关）
   * ========================================================= */
  var HEART_GAME_SECONDS = 30;
  var HEART_TARGET = 20;
  var SPAWN_INTERVAL = 560;   // 每 560ms 生成一颗
  var GOLD_RATE = 0.22;       // 金心概率

  function renderHearts(root) {
    root.innerHTML =
      '<h2 class="game-title">爱心捕手 💜</h2>' +
      '<p class="game-tip">30 秒内拿到 ' + HEART_TARGET + ' 分就算赢<br>紫心 +1 分，金心 +3 分，手速说话</p>' +
      '<div class="hz-hud"><span class="pill">⏱ 剩余 <b id="hz-time">' + HEART_GAME_SECONDS + '</b>s</span>' +
      '<span class="pill">💜 得分 <b id="hz-score">0</b></span></div>' +
      '<div class="hz-arena" id="hz-arena">' +
        '<div class="hz-overlay" id="hz-overlay">' +
          '<div class="big">准备好了吗？</div>' +
          '<p>爱心会从下面飘上来，使劲点<br>紫心 +1，金心 +3，目标 ' + HEART_TARGET + ' 分</p>' +
          '<button class="primary-btn" id="hz-start">开始</button>' +
        '</div>' +
      '</div>';

    var arena = document.getElementById('hz-arena');
    var overlay = document.getElementById('hz-overlay');
    var score = 0, timeLeft = HEART_GAME_SECONDS;
    var spawnId = null, countdownId = null, playing = false;

    document.getElementById('hz-start').addEventListener('click', function () {
      ensureAudio(); SFX.click();
      overlay.classList.add('hidden');
      playing = true;

      countdownId = setInterval(function () {
        timeLeft--;
        var tEl = document.getElementById('hz-time');
        tEl.textContent = String(timeLeft);
        tEl.parentElement.classList.toggle('time-warn', timeLeft <= 5);
        if (timeLeft <= 0) endGame();
      }, 1000);

      spawnId = setInterval(spawnHeart, SPAWN_INTERVAL);
      spawnHeart();
    });

    cleanupFn = function () {
      playing = false;
      if (spawnId) clearInterval(spawnId);
      if (countdownId) clearInterval(countdownId);
    };

    function spawnHeart() {
      if (!playing) return;
      var isGold = Math.random() < GOLD_RATE;
      var h = document.createElement('div');
      h.className = 'heart' + (isGold ? ' gold' : '');
      h.textContent = isGold ? '💛' : '💜';
      var size = Math.round(rand(28, 44));
      h.style.fontSize = size + 'px';
      h.style.left = rand(4, 88) + '%';
      var dur = rand(2.6, 3.8);
      h.style.animationDuration = dur + 's';

      var value = isGold ? 3 : 1;
      h.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        if (!playing) return;
        popHeart(h, value, isGold);
      });

      arena.appendChild(h);
      // 飘出顶部后自动移除
      setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, dur * 1000 + 200);
    }

    function popHeart(h, value, isGold) {
      var rect = h.getBoundingClientRect();
      var arenaRect = arena.getBoundingClientRect();
      score += value;
      document.getElementById('hz-score').textContent = String(score);
      if (isGold) SFX.gold(); else SFX.pop();

      // +1 / +3 飘字
      var fs = document.createElement('div');
      fs.className = 'float-score' + (isGold ? ' gold' : '');
      fs.textContent = '+' + value;
      fs.style.left = (rect.left - arenaRect.left + rect.width / 2 - 10) + 'px';
      fs.style.top = (rect.top - arenaRect.top) + 'px';
      arena.appendChild(fs);
      setTimeout(function () { if (fs.parentNode) fs.parentNode.removeChild(fs); }, 700);

      if (h.parentNode) h.parentNode.removeChild(h);
    }

    function endGame() {
      playing = false;
      clearInterval(spawnId);
      clearInterval(countdownId);
      arena.querySelectorAll('.heart').forEach(function (h) { h.parentNode.removeChild(h); });

      var win = score >= HEART_TARGET;
      if (win) SFX.win(); else SFX.wrong();

      var rec = save.hearts;
      var isNew = win && (!rec.done || score > rec.bestScore);
      if (win) {
        rec.done = true;
        if (rec.bestScore === null || score > rec.bestScore) rec.bestScore = score;
        persist();
      }

      overlay.innerHTML =
        '<div class="big">' + (win ? '手速可以啊，通关！🖐️' : '时间到！') + '</div>' +
        '<p>本局得分：<b style="color:var(--purple-d);font-size:18px;">' + score + '</b> 分' +
          (win ? '' : '<br>差 ' + (HEART_TARGET - score) + ' 分就到目标了，再来一把？') +
          (isNew ? '<br><span class="new-best">新纪录！</span>' : '') +
        '</p>' +
        '<div>' +
          '<button class="primary-btn" id="hz-again">再来一次</button>' +
          '<button class="ghost-btn" id="hz-home">回首页</button>' +
        '</div>';
      overlay.classList.remove('hidden');

      document.getElementById('hz-again').addEventListener('click', function () { SFX.click(); renderHearts(root); });
      document.getElementById('hz-home').addEventListener('click', function () { SFX.click(); goHome(); });
    }
  }

  /* =========================================================
   * 彩蛋页：漂浮爱心背景
   * ========================================================= */
  function renderSecret() {
    // 漂浮的爱心与星星
    var bg = document.getElementById('secret-bg');
    bg.innerHTML = '';
    var icons = ['💜', '💜', '💜', '✨', '⭐', '🤍'];
    for (var i = 0; i < 26; i++) {
      var item = document.createElement('span');
      item.className = 'float-item';
      item.textContent = icons[Math.floor(Math.random() * icons.length)];
      item.style.left = rand(2, 96) + '%';
      item.style.fontSize = Math.round(rand(14, 30)) + 'px';
      item.style.animationDuration = rand(7, 14) + 's';
      item.style.animationDelay = '-' + rand(0, 12) + 's';
      bg.appendChild(item);
    }

    // 进入彩蛋自动播放八音盒音乐（本次点击属于用户手势，浏览器允许发声）
    startMusic();
  }

  /* ---------------- 事件绑定 ---------------- */
  document.querySelectorAll('.game-card').forEach(function (card) {
    card.addEventListener('click', function () {
      ensureAudio(); SFX.click();
      startGame(card.getAttribute('data-game'));
    });
  });

  document.getElementById('back-btn').addEventListener('click', function () { SFX.click(); goHome(); });
  document.getElementById('secret-back').addEventListener('click', function () { SFX.click(); goHome(); });
  document.getElementById('music-btn').addEventListener('click', function () {
    if (music.playing) stopMusic(); else startMusic();
  });

  document.getElementById('secret-btn').addEventListener('click', function () {
    if (this.disabled) return;
    ensureAudio(); SFX.win();
    showPage('secret');
    renderSecret();
  });

  function updateSoundIcon() {
    var icon = save.sound ? '🔊' : '🔇';
    document.getElementById('sound-btn').textContent = icon;
    document.getElementById('sound-home').textContent = icon;
  }
  function toggleSound() {
    save.sound = !save.sound;
    persist();
    if (save.sound) { ensureAudio(); SFX.click(); }
    updateSoundIcon();
  }
  document.getElementById('sound-btn').addEventListener('click', toggleSound);
  document.getElementById('sound-home').addEventListener('click', toggleSound);

  // 初始化
  updateSoundIcon();
  refreshHome();
})();
