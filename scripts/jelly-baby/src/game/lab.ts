import * as THREE from 'three/webgpu';
import { PHYS } from '../physics/constants.js';
import type { SoftBody } from '../physics/soft-body.js';
import { DeliveryRound, type Mode } from './lab-rules.ts';

export class JellyLab {
  private mode:Mode='free';
  private round=new DeliveryRound();
  private ring:THREE.Mesh;
  private halo:THREE.Mesh;
  private panel:HTMLElement;
  private timer=0;private uiTime=0;private cooldown=0;
  private moonPeak=0;private restHeight=0;private validJump=false;private wasGrounded=true;
  private best=0;private moonBest=0;private storage=true;
  private abort=new AbortController();
  private body:SoftBody;
  private resetBody:()=>void;
  constructor(scene:THREE.Scene,body:SoftBody,resetBody:()=>void){
    this.body=body;this.resetBody=resetBody;
    try {this.best=Number(localStorage.getItem('rhino-jelly-delivery'))||0;this.moonBest=Number(localStorage.getItem('rhino-jelly-moon'))||0;}catch{this.storage=false;}
    this.ring=new THREE.Mesh(new THREE.RingGeometry(.027,.032,64),new THREE.MeshBasicMaterial({color:'#ff732f',side:THREE.DoubleSide,transparent:true,opacity:.95,depthWrite:false}));
    this.ring.renderOrder=3;this.ring.rotation.x=-Math.PI/2;this.ring.position.y=.0006;this.ring.visible=false;scene.add(this.ring);
    this.halo=new THREE.Mesh(new THREE.CircleGeometry(.026,48),new THREE.MeshBasicMaterial({color:'#edb94d',transparent:true,opacity:.2,depthWrite:false}));
    this.halo.renderOrder=3;this.halo.rotation.x=-Math.PI/2;this.halo.position.y=.0005;this.halo.visible=false;scene.add(this.halo);
    this.panel=document.createElement('section');this.panel.className='lab-panel';this.panel.setAttribute('aria-label','互动玩法');
    this.panel.innerHTML=`<div class="lab-tabs" role="group" aria-label="选择玩法"><button data-mode="free" aria-pressed="true">随便捏捏</button><button data-mode="delivery" aria-pressed="false">果冻快递</button><button data-mode="moon" aria-pressed="false">月球蹦蹦</button></div><div class="lab-body"><div class="lab-kicker" id="lab-kicker">NO PRESSURE, JUST JELLY</div><h2 id="lab-title">今天，允许自己软一点。</h2><p id="lab-description">捏住宝宝拉一拉、甩一甩。拖动桌面换个角度，也可以送它一阵风。</p><div class="lab-readout"><strong id="lab-value">自由玩耍</strong><span id="lab-best">没有任务，也不用赢。</span></div><div class="lab-buttons"><button id="lab-start" hidden>开始 45 秒挑战</button><button id="lab-wind">吹一阵风 ↗</button></div><p id="lab-feedback" role="status" aria-live="polite">所有揉捏，都会慢慢回弹。</p><div class="lab-meter" aria-hidden="true"><i></i></div></div>`;
    document.querySelector('#app')!.appendChild(this.panel);
    const signal=this.abort.signal;
    this.panel.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',()=>{this.choose(b.dataset.mode as Mode);b.blur();},{signal}));
    this.panel.querySelector('#lab-start')!.addEventListener('click',event=>{this.resetBody();this.round.start(body.center.x,body.center.z);this.feedback('出发！用方向键走进橙色光圈，停稳即可签收。');(event.currentTarget as HTMLButtonElement).blur();},{signal});
    this.panel.querySelector('#lab-wind')!.addEventListener('click',event=>{if(this.cooldown>0)return;body.nudge();this.cooldown=2;this.feedback(this.mode==='moon'?'月球来风了，看看它能飘多远。':'风会过去，你也会重新站稳。');(event.currentTarget as HTMLButtonElement).blur();},{signal});
  }
  private text(id:string,value:string){this.panel.querySelector('#'+id)!.textContent=value;}
  private feedback(value:string){this.text('lab-feedback',value);}
  reset(){this.round.active=false;this.round.dwell=0;this.moonPeak=0;this.validJump=false;this.wasGrounded=true;this.restHeight=0;this.feedback('重新站好，随时出发。');}
  private choose(mode:Mode){
    this.mode=mode;PHYS.gravity=mode==='moon'?.85:2.4;this.resetBody();
    this.panel.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String((b as HTMLElement).dataset.mode===mode)));
    const delivery=mode==='delivery',moon=mode==='moon';
    (this.panel.querySelector('#lab-start') as HTMLButtonElement).hidden=!delivery;
    (this.panel.querySelector('#lab-wind') as HTMLButtonElement).hidden=delivery;
    this.text('lab-kicker',delivery?'45 SECONDS · SOFT DELIVERY':moon?'LOW GRAVITY · HIGH SPIRITS':'NO PRESSURE, JUST JELLY');
    this.text('lab-title',delivery?'一小团，也有使命。':moon?'把烦恼，跳出引力。':'今天，允许自己软一点。');
    this.text('lab-description',delivery?'45 秒内走进橙色光圈，松手并停稳 0.35 秒完成签收。每单之后出现新地址。':moon?'重力降至约三分之一。按空格跳跃，试试吹风辅助起跳；捏起宝宝不计入跳高纪录。':'捏住宝宝拉一拉、甩一甩。拖动桌面换个角度，也可以送它一阵风。');
    this.feedback(delivery?'准备好了就出发。切换玩法或重置会结束本轮。':moon?'落地后再跳，纪录保存在当前浏览器。':'所有揉捏，都会慢慢回弹。');
  }
  update(dt:number){
    this.timer+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
    const b=this.body;
    if(this.mode==='delivery'){
      const active=this.round.active;
      if(this.round.update(dt,b.center.x,b.center.z,b.grounded,!!b.grab))this.feedback(`第 ${this.round.score} 单已签收！下一个光圈已经亮起。`);
      if(active&&!this.round.active){this.best=Math.max(this.best,this.round.score);this.save('rhino-jelly-delivery',this.best);this.feedback(`本轮送达 ${this.round.score} 单。${this.round.score>=5?'金牌软萌快递员！':'再来一次，试试更短的路线。'}`);}
    }
    this.ring.visible=this.halo.visible=this.mode==='delivery'&&this.round.active;
    if(this.ring.visible){this.ring.position.set(this.round.target.x,.0006,this.round.target.z);this.halo.position.set(this.round.target.x,.0005,this.round.target.z);this.halo.scale.setScalar(.9+.1*Math.sin(this.timer*4));}
    if(this.mode==='moon'){
      if(b.grab)this.validJump=false;
      if(b.grounded&&!b.grab){this.restHeight=b.center.y;this.wasGrounded=true;}
      else if(this.wasGrounded&&!b.grab&&this.restHeight){this.validJump=true;this.wasGrounded=false;}
      if(b.grab)this.wasGrounded=false;
      if(this.validJump&&!b.grab){this.moonPeak=Math.max(this.moonPeak,Math.max(0,b.center.y-this.restHeight)*100);if(this.moonPeak>this.moonBest){this.moonBest=this.moonPeak;}}
      if(b.grounded&&this.validJump){this.validJump=false;this.save('rhino-jelly-moon',this.moonBest);}
    }
    this.uiTime+=dt;if(this.uiTime<.1)return;this.uiTime=0;
    const wind=this.panel.querySelector('#lab-wind') as HTMLButtonElement;wind.disabled=this.cooldown>0;wind.textContent=this.cooldown>0?'风正在歇一会儿…':'吹一阵风 ↗';
    this.text('lab-value',this.mode==='delivery'?`${this.round.score} 单 · ${Math.ceil(this.round.remaining)} 秒`:this.mode==='moon'?`${this.moonPeak.toFixed(1)} cm`:'自由玩耍');
    this.text('lab-best',this.mode==='delivery'?`最佳 ${this.best} 单${this.storage?' · 本机纪录':' · 本次会话'}`:this.mode==='moon'?`最高 ${this.moonBest.toFixed(1)} cm${this.storage?' · 本机纪录':' · 本次会话'}`:'没有任务，也不用赢。');
    this.text('lab-start',this.round.active?'重新开始':'开始 45 秒挑战');
    (this.panel.querySelector('.lab-meter i') as HTMLElement).style.width=(this.mode==='delivery'?this.round.dwell/.35*100:this.mode==='moon'?Math.min(100,this.moonPeak*5):50+Math.sin(this.timer*.8)*45)+'%';
  }
  private save(key:string,value:number){try{localStorage.setItem(key,String(value));}catch{this.storage=false;}}
  dispose(){PHYS.gravity=2.4;this.abort.abort();this.panel.remove();for(const mesh of [this.ring,this.halo]){mesh.removeFromParent();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}}
}
