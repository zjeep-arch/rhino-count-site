/* Independently implemented folder and disk interactions. Content stays in data.js. */
(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const colors = ['#4b7466','#66776f','#a98754','#9b5f4c','#647d76','#866d5a','#737665','#aa7055'];
  const identityKeys = ['主理人','学历','勋章','履历','关注','能力','坐标','频道'];
  const identities = data => identityKeys.map(k => data.profile.cells.find(c => c.k === k)).filter(Boolean);
  function backdrop() {
    const paths = [
      ['#a9d6ca','M690 245V354L595 402H230L155 460H70'],
      ['#c6a66d','M708 245V388L650 443H244L170 530H42'],
      ['#c96d52','M730 245V402L830 457H1165L1245 520H1400'],
      ['#8fa0ad','M748 245V342L845 385H1200L1260 438H1370'],
      ['#91b8a8','M695 420V540L565 610L495 780'],
      ['#c6a66d','M720 450V566L650 630L625 780'],
      ['#bd765f','M748 420V548L855 624L900 780'],
      ['#a9d6ca','M770 450V565L965 690L1000 780']
    ];
    const rays = Array.from({length:35},(_,i)=>{const x=-800+i*90;return `<path d="M${720+(x-720)*.22} 230L${x} 780"/>`;}).join('');
    const rows = [240,253,269,290,317,351,395,450,520,608,718,778].map(y=>`<path d="M0 ${y}H1440"/>`).join('');
    return `<div class="pf-world" aria-hidden="true"><div class="pf-horizon"></div>
      <svg class="pf-board" viewBox="0 0 1440 780" preserveAspectRatio="none"><defs><radialGradient id="pf-board-fade"><stop offset="20%" stop-color="white"/><stop offset="75%" stop-color="#aaa"/><stop offset="100%" stop-color="black"/></radialGradient><mask id="pf-board-mask"><rect width="1440" height="780" fill="url(#pf-board-fade)"/></mask></defs>
      <g mask="url(#pf-board-mask)"><g class="pf-grid-lines" fill="none" stroke="#7d9384" stroke-width="1">${rays}${rows}</g>
      <g fill="none" stroke-width="1.7">${paths.map(([color,d],i)=>`<path stroke="${color}" opacity=".4" d="${d}"/><path class="pf-current" pathLength="100" stroke="${color}" d="${d}" style="--delay:-${i*1.7}s;--duration:${8+i%3*2}s"/>`).join('')}</g>
      <g class="pf-chips" stroke="#60776a" fill="#101714"><path d="M156 355H312L263 460H84Z"/><path d="M1180 370H1300L1384 480H1240Z"/><path d="M174 375H281L253 433H135Z"/><path d="M1208 391H1287L1329 452H1251Z"/></g>
      <g fill="#d2b987" opacity=".42">${[[320,510],[354,520],[390,510],[1080,555],[1110,555],[1060,575],[520,350],[895,365]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="3" ry="1.5"/>`).join('')}</g></g></svg><div class="pf-ambient"></div></div>`;
  }
  function profile(data) {
    const items = identities(data);
    return `<div class="pf-stage" aria-label="Profile · 犀牛伯爵的八个侧面">
      ${backdrop()}
      <div class="pf-files" id="identity-files" inert>
      ${items.map((c,i)=>{
        const href=c.href;
        const tag=href?'a':'button';
        return `<${tag} class="pf-file" ${href?`href="${esc(href)}"`:'type="button" aria-expanded="false"'} data-profile-file="${i}" style="--col:${i%4};--row:${Math.floor(i/4)};--mobile-col:${i%2};--mobile-row:${Math.floor(i/2)};--i:${i};--tone:${colors[i]};--angle:${[-3,2,-2,3,2,-3,3,-2][i]}deg" aria-label="${esc(c.k)}：${esc(c.v)}"><span class="pf-back"></span><span class="pf-paper" aria-hidden="true"><span class="pf-number">${String(i+1).padStart(2,'0')}</span><span class="pf-paper-rule"></span><span class="pf-stamp">RHINO COUNT</span></span><span class="pf-front"><b>${esc(c.k)}</b><span>${esc(c.v)}${c.k==='频道'?' ↗':''}</span></span></${tag}>`;
      }).join('')}
      </div>
      <div class="pf-root">
        <span class="pf-root-back" aria-hidden="true"><span>profile</span></span>
        <span class="pf-root-paper pf-root-paper-one" aria-hidden="true"><b>犀牛伯爵</b><span>THINK · BUILD · SHARE</span></span>
        <span class="pf-root-paper pf-root-paper-two" aria-hidden="true"></span>
        <button class="pf-root-front" type="button" aria-expanded="false" aria-controls="identity-files"><b>Profile</b><span>犀牛伯爵 · 8 个侧面</span></button>
      </div>
      <p class="pf-instruction" aria-live="polite">点击，或向上抽开文件夹</p>
    </div>`;
  }
  function init(data) {
    const profileEl = document.getElementById('profile');
    profileEl.innerHTML = profile(data);
    const scene = profileEl.querySelector('.pf-stage');
    const master = profileEl.querySelector('.pf-root-front');
    const rootFolder = profileEl.querySelector('.pf-root');
    const files = profileEl.querySelector('.pf-files');
    // CSS animations stop outside the viewport; no continuous JavaScript render loop.
    const visibility = new IntersectionObserver(([entry]) => scene.classList.toggle('is-visible', entry.isIntersecting));
    visibility.observe(scene);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    scene.addEventListener('pointermove', e => {
      if (motion.matches || e.pointerType !== 'mouse') return;
      const r = scene.getBoundingClientRect();
      scene.style.setProperty('--look-x', ((e.clientX-r.left)/r.width-.5)*10+'px');
      scene.style.setProperty('--look-y', ((e.clientY-r.top)/r.height-.5)*5+'px');
    });
    scene.addEventListener('pointerleave', () => {scene.style.setProperty('--look-x','0px');scene.style.setProperty('--look-y','0px');});
    let opened = false;
    function setOpen(value) {
      opened=value;
      master.setAttribute('aria-expanded',String(opened));
      scene.classList.toggle('is-open',opened);
      files.inert=!opened;
      profileEl.querySelector('.pf-instruction').textContent=opened?'八个侧面，一起构成犀牛伯爵 · 点击主文件夹收起':'点击，或向上抽开文件夹';
      if(!opened) files.querySelectorAll('.is-extracted').forEach(el=>{el.classList.remove('is-extracted');el.setAttribute('aria-expanded','false');});
    }
    let startY=null,dragY=0,ignoreClick=false;
    master.addEventListener('pointerdown',e=>{if(e.button!==0)return;startY=e.clientY;dragY=0;master.setPointerCapture(e.pointerId);});
    master.addEventListener('pointermove',e=>{if(startY===null)return;dragY=e.clientY-startY;rootFolder.style.setProperty('--pull',Math.max(-48,Math.min(30,dragY))+'px');});
    master.addEventListener('pointerup',()=>{if(startY===null)return;if(Math.abs(dragY)>20){setOpen(dragY<0);ignoreClick=true;}startY=null;rootFolder.style.removeProperty('--pull');});
    master.addEventListener('pointercancel',()=>{startY=null;rootFolder.style.removeProperty('--pull');});
    master.addEventListener('click',()=>{if(ignoreClick){ignoreClick=false;return;}setOpen(!opened);});
    files.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{const selected=button.classList.toggle('is-extracted');button.setAttribute('aria-expanded',String(selected));}));
    scene.addEventListener('keydown',e=>{if(e.key==='Escape'&&opened){setOpen(false);master.focus();}});
  }
  root.RhinoProfile={profile,init};
})(typeof window!=='undefined'?window:globalThis);
