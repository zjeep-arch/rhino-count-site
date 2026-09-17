import { assetResponse, assetComplete } from '../game/assets.ts';
import * as THREE from 'three/webgpu';
import { texture, positionWorld, float, vec2, vec3, normalMap } from 'three/tsl';
import type { RefractiveLightField } from './refractive-light.js';

export async function loadTableTextures() {
  const loader=new THREE.TextureLoader();
  const urls=[new URL('../assets/optimized/wood_base.jpg',import.meta.url),
    new URL('../assets/optimized/wood_normal.png',import.meta.url),
    new URL('../assets/optimized/wood_roughness.jpg',import.meta.url)];
  return Promise.all(urls.map(async url=>{
    const blob=await (await assetResponse(url)).blob(),objectURL=URL.createObjectURL(blob);
    try{const texture=await loader.loadAsync(objectURL);assetComplete();return texture;}finally{URL.revokeObjectURL(objectURL);}
  }));
}

export async function makeTable(optics:RefractiveLightField,light:{color:THREE.Color;windowFraction:number;irradiance:number},textures:THREE.Texture[]) {
  const [base,normal,roughness]=textures;
  base.colorSpace=THREE.SRGBColorSpace;
  for(const t of [base,normal,roughness]) {t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;}
  const uv=positionWorld.xz.div(2.5).add(.5);
  const opticalUV=positionWorld.xz.sub(optics.originNode).div(optics.spanNode);
  const inside=float(opticalUV.x.greaterThan(0).and(opticalUV.x.lessThan(1)).and(opticalUV.y.greaterThan(0)).and(opticalUV.y.lessThan(1)));
  const shadowUV=positionWorld.xz.sub(optics.shadowOriginNode).div(optics.shadowSpanNode);
  const shadowInside=float(shadowUV.x.greaterThan(0).and(shadowUV.x.lessThan(1)).and(shadowUV.y.greaterThan(0)).and(shadowUV.y.lessThan(1)));
  const shadow=texture(optics.shadowTexture,shadowUV).r.mul(shadowInside);
  const contactUV=positionWorld.xz.sub(optics.contactOriginNode).div(optics.shadowSpanNode);
  const contactInside=float(contactUV.x.greaterThan(0).and(contactUV.x.lessThan(1)).and(contactUV.y.greaterThan(0)).and(contactUV.y.lessThan(1)));
  const contact=texture(optics.shadowTexture,contactUV).g.mul(contactInside);
  const albedo=texture(base,uv).rgb;
  const material=new THREE.MeshPhysicalNodeMaterial({metalness:0,roughness:.26,clearcoat:.38,clearcoatRoughness:.23});
  material.colorNode=albedo.mul(float(1).sub(shadow.mul(light.windowFraction))).mul(float(1).sub(contact.mul(.40)));
  // Plane UV-v points toward -Z; the metre-scaled world UV points toward +Z.
  material.normalNode=normalMap(texture(normal,uv),vec2(.27,-.27));
  material.roughnessNode=texture(roughness,uv).r.mul(.30).add(.12);
  material.emissiveNode=albedo.mul(texture(optics.lightTexture,opticalUV).rgb).mul(light.irradiance/Math.PI).mul(vec3(light.color.r,light.color.g,light.color.b)).mul(inside);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(200,200),material);
  mesh.rotation.x=-Math.PI/2;mesh.position.y=-.00005;
  return {mesh,dispose:()=>{mesh.geometry.dispose();material.dispose();[base,normal,roughness].forEach(t=>t.dispose());}};
}
