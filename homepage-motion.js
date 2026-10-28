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

  /* One delegated pointer field also covers Picks after its filter re-renders. */
  if(!reduce.matches && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    let active=null;
    const targets='.reading-card,.pick-card,.lab-card,.daily-latest,.now-item';
    const clear=el=>{if(!el)return;el.classList.remove('pointer-lit');el.style.removeProperty('--scene-dx');el.style.removeProperty('--tilt-x');el.style.removeProperty('--tilt-y');};
    document.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const el=event.target.closest(targets);
      if(!el){if(active){clear(active);active=null}return;}
      if(active!==el){clear(active);active=el;el.classList.add('pointer-lit');}
      const r=el.getBoundingClientRect(),x=Math.max(0,Math.min(1,(event.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(event.clientY-r.top)/r.height));
      el.style.setProperty('--spot-x',`${x*100}%`);el.style.setProperty('--spot-y',`${y*100}%`);
      if(el.classList.contains('lab-card'))el.style.setProperty('--scene-dx',`${(x-.5)*12}px`);
      if(el.classList.contains('pick-card')||el.classList.contains('reading-card')){
        el.style.setProperty('--tilt-x',`${((.5-y)*1.7).toFixed(2)}deg`);
        el.style.setProperty('--tilt-y',`${((x-.5)*1.7).toFixed(2)}deg`);
      }
    },{passive:true});
    document.addEventListener('pointerout',event=>{
      if(!active||active.contains(event.relatedTarget))return;
      if(active===event.target||active.contains(event.target)){clear(active);active=null;}
    },{passive:true});
  }

  /* The hero light and the NOW waveform follow the pointer without moving copy. */
  if(!reduce.matches && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    const hero=document.getElementById('hero-section');
    hero?.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const r=hero.getBoundingClientRect();
      hero.style.setProperty('--hero-x',`${event.clientX-r.left}px`);
      hero.style.setProperty('--hero-y',`${event.clientY-r.top}px`);
    },{passive:true});
    const now=document.querySelector('#now .now-head');
    now?.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse')return;
      const r=now.getBoundingClientRect();
      now.style.setProperty('--wave-shift',`${((event.clientX-r.left)/r.width-.5)*12}px`);
    },{passive:true});
  }

  /* Three judgments enter in sequence once, then remain still for reading. */
  const now=document.getElementById('now');
  if(now && !reduce.matches && 'IntersectionObserver' in window){
    const items=now.querySelectorAll('.now-item');
    now.classList.add('signal-reveal-ready');
    const signalObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('signal-visible');signalObserver.unobserve(entry.target);}
    }),{threshold:.35});
    items.forEach(item=>signalObserver.observe(item));
    reduce.addEventListener('change',event=>{
      if(event.matches){signalObserver.disconnect();items.forEach(item=>item.classList.add('signal-visible'));now.classList.remove('signal-reveal-ready');}
    });
  }
  document.documentElement.classList.add('motion-ready');
  reduce.addEventListener('change',e=>{if(e.matches){observer.disconnect();document.documentElement.classList.remove('motion-ready');}});
})();
