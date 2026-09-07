import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
  <main id="viewport" aria-label="Jelly baby playground"></main>
  <header class="masthead"><span class="eyebrow">RHINO COUNT · 互动实验 007</span><h1>果冻实验室<span>。</span></h1></header>
  <a class="home-link" href="/#builds">← 返回 BUILDS</a><nav class="actions" aria-label="Game controls">
    <button id="sound" class="icon-button" aria-label="Mute sound" aria-pressed="false" title="Sound">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path class="sound-waves" d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/><path class="sound-off" d="m15 9 6 6m0-6-6 6"/></svg>
    </button>
    <button id="reset" class="icon-button" aria-label="Reset jelly baby" title="Reset · R">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.5 8a8 8 0 1 1-.1 8M4 3v6h6"/></svg>
    </button>
  </nav>
  <footer class="desktop-hints" aria-label="Keyboard controls">
    <span><kbd>W</kbd><span class="key-row"><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></span></span><span class="hint-label">移动</span>
    <span class="separator"></span><kbd class="space-key">space</kbd><span class="hint-label">跳跃</span>
    <span class="separator"></span><svg class="mouse" viewBox="0 0 20 25" fill="none" stroke="currentColor"><rect x="3.5" y="1.5" width="13" height="21" rx="6.5"/><path d="M10 5v5"/></svg><span class="hint-label">拖桌面转视角 · 捏住宝宝拖动</span>
  </footer>
  <div class="specimen"><span></span> 基于 <a href="https://github.com/scottstts/Jelly-Baby" target="_blank" rel="noopener">scottstts / Jelly-Baby</a> · 犀牛伯爵玩法改编</div>
  <div class="touch-controls" aria-label="Touch controls">
    <div class="dpad"><button data-control="KeyW" aria-label="Walk forward">↑</button><button data-control="KeyA" aria-label="Walk left">←</button><button data-control="KeyS" aria-label="Walk backward">↓</button><button data-control="KeyD" aria-label="Walk right">→</button></div>
    <button class="jump" data-control="Space" aria-label="Jump"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 21V6m-6 6 6-6 6 6M6 24h16"/></svg><span>跳跃</span></button>
  </div>
  <section id="loading" role="status" aria-live="polite"><div class="loading-card"><div class="jelly-mark"></div><h2>一小团快乐。</h2><p id="load-message">正在准备果冻、光线和桌面…</p><details><summary>查看诊断信息</summary><pre id="fatal" hidden></pre></details><a class="loading-home" href="/#builds">← 返回创作矩阵</a><button id="retry" hidden>重新加载</button></div></section>
`;

let stage='Loading the game',failed=false,game:{stop:()=>void}|undefined;
function fail(reason:unknown) {
  if(failed)return;failed=true;game?.stop();
  const error=reason instanceof Error?reason:new Error(String(reason));
  document.querySelector('#loading')!.classList.remove('hidden');
  document.querySelector('#loading')!.classList.add('failed');
  document.querySelector('h2')!.textContent='这个世界暂时打不开。';
  document.querySelector('#load-message')!.textContent='需要支持 WebGPU 的浏览器及可用的 GPU。请尝试新版 Chrome / Edge，并开启硬件加速。';
  const fatal=document.querySelector<HTMLPreElement>('#fatal')!;fatal.hidden=false;
  fatal.textContent=`${stage}\n${error.message}\n\nViewport: ${innerWidth} × ${innerHeight} · DPR ${devicePixelRatio}\n${navigator.userAgent}`;
  document.querySelector<HTMLButtonElement>('#retry')!.hidden=false;
  console.error(`[Jelly Baby / ${stage}]`,error);
}
window.addEventListener('error',event=>fail(event.error||event.message));
window.addEventListener('unhandledrejection',event=>fail(event.reason));
document.querySelector('#retry')!.addEventListener('click',()=>location.reload());

// One observed chain covers imports, initialization, compilation, warmup and first render.
void import('./game/runtime.ts').then(({startGame})=>startGame(message=>{
  if(failed)throw new Error('Startup aborted after a GPU failure');
  stage=message;document.querySelector('#load-message')!.textContent='正在搭建软软的小世界，请稍候…';
},fail)).then(started=>{
  game=started;
  if(failed){game.stop();return;}
  stage='Playing';document.querySelector('#loading')!.classList.add('hidden');
}).catch(fail);
