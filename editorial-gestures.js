(() => {
  'use strict';
  const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  const selector = '#picks .pick-card, #notes .reading-card, #builds .lab-card';
  let activeCard = null;
  let frame = 0;
  let point = null;

  function clearCard(card) {
    if (!card) return;
    card.classList.remove('pointer-lit');
    card.style.removeProperty('--spot-x');
    card.style.removeProperty('--spot-y');
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  }

  function applyPoint() {
    frame = 0;
    if (!activeCard || !point) return;
    const rect = activeCard.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (point.x - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (point.y - rect.top) / rect.height));
    activeCard.style.setProperty('--spot-x', (x * 100).toFixed(1) + '%');
    activeCard.style.setProperty('--spot-y', (y * 100).toFixed(1) + '%');
    activeCard.style.setProperty('--tilt-x', ((.5 - y) * 2.4).toFixed(2) + 'deg');
    activeCard.style.setProperty('--tilt-y', ((x - .5) * 2.8).toFixed(2) + 'deg');
  }

  document.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !(event.target instanceof Element)) return;
    const card = event.target.closest(selector);
    if (!card) return;
    if (card !== activeCard) {
      clearCard(activeCard);
      activeCard = card;
      activeCard.classList.add('pointer-lit');
    }
    point = { x: event.clientX, y: event.clientY };
    if (!frame) frame = window.requestAnimationFrame(applyPoint);
  }, { passive: true });

  document.addEventListener('pointerout', event => {
    if (!activeCard || !event.target || !activeCard.contains(event.target)) return;
    if (event.relatedTarget && activeCard.contains(event.relatedTarget)) return;
    clearCard(activeCard);
    activeCard = null;
    point = null;
  }, { passive: true });
})();