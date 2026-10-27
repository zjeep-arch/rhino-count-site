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
  const manifesto=document.getElementById('manifesto');
  if(manifesto && !reduce.matches){
    let frame=0;
    manifesto.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const rect=manifesto.getBoundingClientRect();
      const x=event.clientX-rect.left, y=event.clientY-rect.top;
      if(frame)cancelAnimationFrame(frame);
      frame=requestAnimationFrame(()=>{
        manifesto.style.setProperty('--spot-x',`${x}px`);
        manifesto.style.setProperty('--spot-y',`${y}px`);
        manifesto.classList.add('pointer-active');
      });
    },{passive:true});
    manifesto.addEventListener('pointerleave',()=>manifesto.classList.remove('pointer-active'),{passive:true});
  }
  document.documentElement.classList.add('motion-ready');
  reduce.addEventListener('change',e=>{if(e.matches){observer.disconnect();document.documentElement.classList.remove('motion-ready');}});
})();
