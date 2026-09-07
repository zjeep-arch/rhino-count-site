export type Mode='free'|'delivery'|'moon';
export class DeliveryRound {
  remaining=45; score=0; dwell=0; active=false; target={x:0,z:0};
  start(x:number,z:number){this.remaining=45;this.score=0;this.dwell=0;this.active=true;this.place(x,z);}
  place(x:number,z:number){const a=this.score*2.399+.65;this.target={x:x+Math.cos(a)*.065,z:z+Math.sin(a)*.065};}
  update(dt:number,x:number,z:number,grounded:boolean,grabbed:boolean){
    if(!this.active)return false;
    this.remaining=Math.max(0,this.remaining-dt);
    if(this.remaining===0){this.active=false;this.dwell=0;return false;}
    const inside=Math.hypot(x-this.target.x,z-this.target.z)<.027;
    this.dwell=inside&&grounded&&!grabbed?this.dwell+dt:0;
    if(this.dwell>=.35){this.score++;this.dwell=0;this.place(x,z);return true;}
    return false;
  }
}
