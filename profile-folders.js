/* Independently implemented folder and disk interactions. Content stays in data.js. */
(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const colors = ['#39766e','#486581','#79704d','#66577c','#3d787b','#70516b','#526b61','#547492'];
  const identityKeys = ['主理人','学历','勋章','履历','关注','能力','坐标','频道'];
  const identities = data => identityKeys.map(k => data.profile.cells.find(c => c.k === k)).filter(Boolean);
  function profile(data) {
    const items = identities(data);
    return `<div class="pf-stage" aria-label="Profile · 犀牛伯爵的八个侧面">
      <div class="pf-horizon" aria-hidden="true"></div><div class="pf-floor" aria-hidden="true"></div>
      <svg class="pf-traces" viewBox="0 0 1440 560" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke-width="1.3"><path stroke="#72b7ad" d="M718 0V160L520 260V360L270 560M690 0V200L250 290V410L90 560M744 0V200L1070 290V410L1290 560"/><path stroke="#8b80b3" d="M708 0V240L430 330V430L350 560M734 0V180L900 290V430L1080 560"/></g><g fill="#a6ded3"><circle cx="520" cy="330" r="3"/><circle cx="250" cy="380" r="2"/><circle cx="1070" cy="370" r="3"/></g></svg>
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
