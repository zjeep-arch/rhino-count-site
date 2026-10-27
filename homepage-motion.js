/* One-shot, viewport-aware reveals; content is visible by default if JS is unavailable. */
(function(){
  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(reduce.matches || !('IntersectionObserver' in window)) return;
  const selectors=['.reading-heading','.reading-card','.editorial-daily > div','.manifesto-container','.editorial-index a'];
  const elements=Array.from(document.querySelectorAll(selectors.join(',')));
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('is-revealed');observer.unobserve(entry.target);}
  }),{threshold:.08,rootMargin:'0px 0px -24px 0px'});
  elements.forEach((el,i)=>{
    el.classList.add('motion-reveal');
    el.style.setProperty('--reveal-delay',`${Math.min(i%3*55,110)}ms`);
    observer.observe(el);
  });
  document.documentElement.classList.add('motion-ready');
  reduce.addEventListener('change',e=>{if(e.matches){observer.disconnect();document.documentElement.classList.remove('motion-ready');}});
})();
