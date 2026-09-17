import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync, gunzipSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { HalfFloatType, DataUtils } from 'three/webgpu';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { measureWindow } from '../src/graphics/environment.ts';
import { shapeStudioLight } from '../src/graphics/studio-light.ts';

const out='src/assets/optimized';mkdirSync(out,{recursive:true});
for(const [name,size,format] of [['wood_base',1024,'jpg'],['wood_normal',512,'png'],['wood_roughness',512,'jpg']]){
  execFileSync('sips',['-Z',String(size),`src/assets/wood_texture/${name}.${format}`,'--out',`${out}/${name}.${format}`],{stdio:'ignore'});
}
const input=readFileSync('src/assets/bg_room.exr');
const exr=new EXRLoader().setDataType(HalfFloatType).parse(input.buffer.slice(input.byteOffset,input.byteOffset+input.byteLength));
const studio=shapeStudioLight(exr,measureWindow(exr).incoming.negate()),lighting=measureWindow(studio);
const width=512,height=256,data=new Uint16Array(width*height*4);
// Area-average in linear HDR, retaining highlights while eliminating client-side relighting.
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const x0=Math.floor(x*studio.width/width),x1=Math.max(x0+1,Math.floor((x+1)*studio.width/width));
  const y0=Math.floor(y*studio.height/height),y1=Math.max(y0+1,Math.floor((y+1)*studio.height/height));
  for(let c=0;c<3;c++){
    let sum=0;for(let sy=y0;sy<y1;sy++)for(let sx=x0;sx<x1;sx++)sum+=DataUtils.fromHalfFloat(studio.data[(sy*studio.width+sx)*4+c]);
    data[(y*width+x)*4+c]=DataUtils.toHalfFloat(sum/((x1-x0)*(y1-y0)));
  }
  data[(y*width+x)*4+3]=DataUtils.toHalfFloat(1);
}
writeFileSync(`${out}/studio.bin.gz`,gzipSync(new Uint8Array(data.buffer),{level:9}));
writeFileSync(`${out}/studio.json`,JSON.stringify({width,height,incoming:lighting.incoming.toArray(),color:[lighting.color.r,lighting.color.g,lighting.color.b],windowFraction:lighting.windowFraction,irradiance:lighting.irradiance}));
const model=readFileSync('src/assets/model/jelly-baby.bin'),packed=gzipSync(model,{level:9});
assert.deepEqual(gunzipSync(packed),model,'lossless model transport');
writeFileSync(`${out}/jelly-baby.bin.gz`,packed);
for(const name of ['wood_base.jpg','wood_normal.png','wood_roughness.jpg','studio.bin.gz','jelly-baby.bin.gz'])console.log(name,statSync(`${out}/${name}`).size);
