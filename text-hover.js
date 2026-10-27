/* Gentle per-character response on headings and navigation; no mutation on touch/reduced-motion devices. */
(function(){
  'use strict';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const pointer=matchMedia('(hover: hover) and (pointer: fine)');
  if(reduce.matches || !pointer.matches || !('Intl' in window)) return;
  const split = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined,{granularity:'grapheme'}) : null;
  const segments = text => split ? Array.from(split.segment(text),x=>x.segment) : Array.from(text);
  const targets=document.querySelectorAll('.editorial-intro h1,.section-head h2,.now-head h2,.reading-heading h2,.editorial-daily h2,.reading-card h3,.pick-card h3,.lab-card h3,#navLinks a');
  targets.forEach(target=>{
    const label=target.innerText.trim().replace(/\s+/g,' ');
    if(!label || target.dataset.rhText) return;
    target.dataset.rhText='true';
    target.setAttribute('aria-label',label);
    const walker=document.createTreeWalker(target,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    const chars=[];
    nodes.forEach(node=>{
      const frag=document.createDocumentFragment();
      segments(node.nodeValue).forEach(ch=>{
        if(/\s/.test(ch)){frag.appendChild(document.createTextNode(ch));return;}
        const span=document.createElement('span');
        span.className='rh-char';span.setAttribute('aria-hidden','true');span.textContent=ch;
        frag.appendChild(span);chars.push(span);
      });
      node.replaceWith(frag);
    });
    let timers=new WeakMap();
    function glow(el,ms){if(!el)return;clearTimeout(timers.get(el));el.classList.add('rh-lit');timers.set(el,setTimeout(()=>el.classList.remove('rh-lit'),ms));}
    chars.forEach((el,i)=>el.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='mouse'||reduce.matches)return;
      glow(chars[i],520);glow(chars[i-1],300);glow(chars[i+1],300);
    }));
    if(target.matches('a'))target.addEventListener('focus',()=>chars.forEach((el,i)=>setTimeout(()=>{if(!reduce.matches&&target.matches(':focus'))glow(el,450)},i*28)));
  });
})();
