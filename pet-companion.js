(() => {
  'use strict';
  const pet = document.getElementById('rhinoPet');
  const btn = document.getElementById('rhinoPetBtn');
  const bubble = document.getElementById('rhinoBubble');
  const comboBadge = document.getElementById('rhinoCombo');
  if (!pet || !btn || !bubble) return;
  const petImage = btn.querySelector('.rhino-sapling');
  const petSprites = {
    idle: '/assets/capybara-companion.png',
    work: '/assets/capybara-work.png',
    sleep: '/assets/capybara-sleep.png',
    celebrate: '/assets/capybara-celebrate.png',
    walk: '/assets/capybara-walk.png',
    think: '/assets/capybara-think.png',
    heart: '/assets/capybara-heart.png',
    coffee: '/assets/capybara-coffee.png'
  };
  Object.values(petSprites).forEach(src => { const image = new Image(); image.src = src; });
  const poseOrder = ['celebrate', 'work', 'think', 'heart', 'coffee', 'walk', 'sleep', 'idle'];
  let poseIndex = -1;
  let poseTimer = 0;
  function setPose(pose, duration = 2600) {
    if (petImage && petSprites[pose]) petImage.src = petSprites[pose];
    pet.dataset.pose = pose;
    window.clearTimeout(poseTimer);
    if (pose !== 'idle' && duration > 0) poseTimer = window.setTimeout(() => setPose('idle', 0), duration);
  }
  setPose('idle', 0);

  const lines = [
    '小目标完成，卡皮给你鼓掌！',
    '进入专注状态，陪你把想法做出来。',
    '嗯……让我想一想。',
    '送你一颗小心心。',
    '来一杯咖啡，继续加油。',
    '卡皮出发巡游一圈。',
    '卡皮开始休息啦。',
    '卡皮在这里陪你。'
  ];
  const holdLines = ['卡皮开始休息啦。', '慢一点也没关系～', '休息一下，再继续。'];
  const comboLines = ['连击成功，能量上涨。', '手速不错。', '今天的灵感很旺。'];
  let lineIndex = -1;
  let drag = null;
  let holdTimer = 0;
  let bubbleTimer = 0;
  let comboTimer = 0;
  let clickTimer = 0;
  let combo = 0;
  let longPressed = false;
  let suppressClick = false;
  let userMovedPet = false;
  let avoidFrame = 0;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const safeInset = (name) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return Number.parseFloat(value) || 0;
  };

  function setPetPosition(x, y) {
    const rect = pet.getBoundingClientRect();
    const viewport = window.visualViewport;
    const leftEdge = viewport ? viewport.offsetLeft : 0;
    const topEdge = viewport ? viewport.offsetTop : 0;
    const rightEdge = viewport ? viewport.offsetLeft + viewport.width : window.innerWidth;
    const bottomEdge = viewport ? viewport.offsetTop + viewport.height : window.innerHeight;
    const margin = 12;
    const leftMin = leftEdge + Math.max(margin, safeInset('--pet-safe-left'));
    const topMin = topEdge + 76;
    const leftMax = Math.max(leftMin, rightEdge - rect.width - Math.max(margin, safeInset('--pet-safe-right')));
    const topMax = Math.max(topMin, bottomEdge - rect.height - Math.max(margin, safeInset('--pet-safe-bottom')));
    pet.style.left = clamp(x, leftMin, leftMax) + 'px';
    pet.style.top = clamp(y, topMin, topMax) + 'px';
    pet.style.right = 'auto';
    pet.style.bottom = 'auto';
  }

  function showBubble(message, duration = 2500) {
    window.clearTimeout(bubbleTimer);
    bubble.textContent = message;
    bubble.classList.add('show');
    scheduleCollisionCheck();
    bubbleTimer = window.setTimeout(() => bubble.classList.remove('show'), duration);
  }

  function pulse(className, duration = 700) {
    pet.classList.remove(className);
    void pet.offsetWidth;
    pet.classList.add(className);
    window.setTimeout(() => pet.classList.remove(className), duration);
  }

  function spark(count = 7) {
    const rect = btn.getBoundingClientRect();
    const colors = ['var(--accent)', 'var(--accent-2)', 'var(--gold)', 'var(--electric)'];
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'rhino-spark' + (i % 3 === 0 ? ' star' : '');
      dot.style.left = (rect.width * (.3 + Math.random() * .4)) + 'px';
      dot.style.top = (rect.height * (.32 + Math.random() * .34)) + 'px';
      dot.style.setProperty('--spark-x', (Math.random() * 64 - 32) + 'px');
      dot.style.setProperty('--spark-y', (-20 - Math.random() * 48) + 'px');
      dot.style.setProperty('--spark-r', (Math.random() * 160 - 80) + 'deg');
      dot.style.setProperty('--spark-color', colors[i % colors.length]);
      btn.appendChild(dot);
      window.setTimeout(() => dot.remove(), 950);
    }
  }

  function scorePlacement(box, obstacles) {
    let score = 0;
    for (const obstacle of obstacles) {
      const left = Math.max(box.left, obstacle.left);
      const right = Math.min(box.right, obstacle.right);
      const top = Math.max(box.top, obstacle.top);
      const bottom = Math.min(box.bottom, obstacle.bottom);
      if (right > left && bottom > top) score += (right - left) * (bottom - top);
    }
    return score;
  }

  function avoidReadingControls() {
    avoidFrame = 0;
    if (window.innerWidth > 700 || userMovedPet || drag) return;
    const rect = pet.getBoundingClientRect();
    const margin = 12;
    const topMin = 76;
    const bottomLimit = window.visualViewport ? window.visualViewport.offsetTop + window.visualViewport.height : window.innerHeight;
    const rightLimit = window.visualViewport ? window.visualViewport.offsetLeft + window.visualViewport.width : window.innerWidth;
    const leftLimit = window.visualViewport ? window.visualViewport.offsetLeft : 0;
    const bottom = bottomLimit - rect.height - Math.max(margin, safeInset('--pet-safe-bottom'));
    const right = rightLimit - rect.width - Math.max(margin, safeInset('--pet-safe-right'));
    const left = leftLimit + Math.max(margin, safeInset('--pet-safe-left'));
    const candidates = [
      { left: right, top: bottom },
      { left, top: bottom },
      { left: right, top: topMin },
      { left, top: topMin }
    ].map(box => ({ ...box, right: box.left + rect.width, bottom: box.top + rect.height }));
    const selectors = 'main p, main h1, main h2, main h3, main a.btn, main button:not(#rhinoPetBtn):not(.back-to-top), .project-card, .pick-card, .profile-cell, .contact-card';
    const obstacles = [...document.querySelectorAll(selectors)].filter(el => {
      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || Number.parseFloat(style.opacity) < .1) return false;
      const box = el.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && box.bottom > topMin && box.top < bottomLimit;
    }).map(el => el.getBoundingClientRect().toJSON());
    const current = { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    const currentScore = scorePlacement(current, obstacles);
    if (currentScore < 900) return;
    candidates.sort((a, b) => scorePlacement(a, obstacles) - scorePlacement(b, obstacles));
    const best = candidates[0];
    if (scorePlacement(best, obstacles) + 900 < currentScore) setPetPosition(best.left, best.top);
  }

  function scheduleCollisionCheck() {
    if (avoidFrame) return;
    avoidFrame = window.requestAnimationFrame(avoidReadingControls);
  }


  function scheduleFidget() {
    window.setTimeout(() => {
      if (!drag && pet.dataset.pose === 'idle' && document.visibilityState === 'visible' &&
          !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        pet.classList.add('fidget');
        window.setTimeout(() => pet.classList.remove('fidget'), 760);
      }
      scheduleFidget();
    }, 8500 + Math.random() * 5500);
  }
  scheduleFidget();

  function resetCombo() {
    combo = 0;
    pet.classList.remove('combo');
    if (comboBadge) comboBadge.textContent = 'x1';
  }

  function doClick() {
    pulse('excited', 620);
    poseIndex = (poseIndex + 1) % poseOrder.length;
    setPose(poseOrder[poseIndex]);
    spark(7);
    combo += 1;
    if (comboBadge) comboBadge.textContent = 'x' + combo;
    if (combo > 1) pet.classList.add('combo');
    lineIndex = (lineIndex + 1) % lines.length;
    if (combo >= 4) showBubble(comboLines[Math.floor(Math.random() * comboLines.length)]);
    else showBubble(lines[lineIndex]);
    window.clearTimeout(comboTimer);
    comboTimer = window.setTimeout(resetCombo, 1900);
  }

  btn.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    longPressed = false;
    drag = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: pet.getBoundingClientRect().left,
      top: pet.getBoundingClientRect().top,
      moved: false
    };
    window.clearTimeout(holdTimer);
    holdTimer = window.setTimeout(() => {
      if (!drag || drag.moved) return;
      longPressed = true;
      pulse('squish', 700);
      setPose('sleep', 4200);
      spark(9);
      showBubble(holdLines[Math.floor(Math.random() * holdLines.length)]);
    }, 680);
  });

  window.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) > 7) {
      drag.moved = true;
      userMovedPet = true;
      window.clearTimeout(holdTimer);
      pet.classList.add('dragging');
      setPose('idle', 0);
      showBubble('放在你顺手的位置。', 1800);
    }
    if (drag.moved) {
      if (event.cancelable) event.preventDefault();
      setPetPosition(drag.left + dx, drag.top + dy);
    }
  }, { passive: false });

  function finishPointer(event) {
    if (!drag || (event && event.pointerId !== undefined && event.pointerId !== drag.pointerId)) return;
    window.clearTimeout(holdTimer);
    const moved = drag.moved;
    if (moved) longPressed = false;
    drag = null;
    pet.classList.remove('dragging');
    if (moved) {
      suppressClick = true;
      window.clearTimeout(clickTimer);
      window.setTimeout(() => { suppressClick = false; }, 420);
      spark(5);
      showBubble('新位置，继续巡游。', 1600);
    }
  }
  window.addEventListener('pointerup', finishPointer);
  window.addEventListener('pointercancel', finishPointer);
  window.addEventListener('blur', () => finishPointer());

  btn.addEventListener('click', event => {
    if (suppressClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (longPressed) {
      longPressed = false;
      return;
    }
    window.clearTimeout(clickTimer);
    if (event.detail > 1) {
      pulse('twirl', 760);
      spark(12);
      showBubble('转一圈，继续出发。');
      return;
    }
    clickTimer = window.setTimeout(doClick, 140);
  });

  window.addEventListener('resize', () => {
    if (pet.style.left && pet.style.top) {
      setPetPosition(Number.parseFloat(pet.style.left), Number.parseFloat(pet.style.top));
    } else scheduleCollisionCheck();
  }, { passive: true });
  window.visualViewport?.addEventListener('resize', () => {
    if (pet.style.left && pet.style.top) {
      setPetPosition(Number.parseFloat(pet.style.left), Number.parseFloat(pet.style.top));
    } else scheduleCollisionCheck();
  }, { passive: true });
  window.addEventListener('scroll', scheduleCollisionCheck, { passive: true });
  window.addEventListener('orientationchange', scheduleCollisionCheck, { passive: true });
  if (window.matchMedia('(max-width: 700px)').matches) scheduleCollisionCheck();
})();