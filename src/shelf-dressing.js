import * as THREE from 'three';
import {DETAIL_FIXTURES} from '../shared/detail-layout.js';
import {toolMaterials} from './tool-models.js';
// Stable per-rack seeds produce varied arrangements without moving collision or tools.
export function dressShelves(scene){
 const m=toolMaterials();
 const olive=m.dark.clone();olive.color.setHex(0x889c64);
 const ochre=m.paper.clone();ochre.color.setHex(0xb99a64);
 const blue=m.steel.clone();blue.color.setHex(0x6f9195);
 const palette=[m.red,olive,ochre,blue,m.dark];
 // One pixel-label atlas keeps the extra clutter in a small number of draw calls.
 const labels=new Map(),atlas=document.createElement('canvas');atlas.width=atlas.height=1024;const ctx=atlas.getContext('2d');
 const map=new THREE.CanvasTexture(atlas);map.magFilter=map.minFilter=THREE.NearestFilter;map.colorSpace=THREE.SRGBColorSpace;
 const labelPaint=new THREE.MeshLambertMaterial({map});
 function labelSlot(text){if(labels.has(text))return labels.get(text);const n=labels.size,x=(n%8)*128,y=Math.floor(n/8)*32;ctx.fillStyle='#b6b08d';ctx.fillRect(x,y,128,32);ctx.fillStyle='#3b3d2c';ctx.font='bold 13px monospace';ctx.fillText(text,x+5,y+20);for(let i=0;i<11;i++){ctx.fillStyle='#504e3030';ctx.fillRect(x+i*11,y+26,7,2);}const slot={u:x/1024,v:1-(y+32)/1024};labels.set(text,slot);map.needsUpdate=true;return slot;}
 for(const [rackIndex,f] of DETAIL_FIXTURES.entries()){
  let seed=86;for(const c of f.id)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
  const rnd=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
  const rack=new THREE.Group();rack.position.set(f.x,f.y,f.z);rack.rotation.y=(f.w<f.d?Math.PI/2:0)+(f.face===-1?Math.PI:0);scene.add(rack);
  const width=Math.max(f.w,f.d),depth=Math.min(f.w,f.d),height=f.h;
  const box=(parent,w,h,d,x,y,z,mat)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);parent.add(o);return o;};
  const cylinder=(parent,r,h,x,y,z,mat)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,8),mat);o.position.set(x,y,z);parent.add(o);return o;};
  const rod=(parent,a,b,r,mat)=>{const u=new THREE.Vector3(...a),v=new THREE.Vector3(...b),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,u.distanceTo(v),6),mat);o.position.copy(u).add(v).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.sub(u).normalize());parent.add(o);return o;};
  const tag=(parent,text,w,h,x,y,z)=>{const slot=labelSlot(text),geometry=new THREE.PlaneGeometry(w,h),uv=geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,slot.u+uv.getX(i)*128/1024,slot.v+uv.getY(i)*32/1024);const o=new THREE.Mesh(geometry,labelPaint);o.position.set(x,y,z);parent.add(o);};
  for(const x of [-width/2+.035,width/2-.035])for(const z of [-depth/2+.035,depth/2-.035]){
   box(rack,.06,height,.06,x,height/2,z,m.dark);box(rack,.12,.045,.12,x,.022,z,m.steel);
   for(let y=.16;y<height;y+=.20)box(rack,.022,.037,.004,x,y,z+.033,m.red);
  }
  rod(rack,[-width/2+.04,.14,-depth/2+.04],[width/2-.04,height-.1,-depth/2+.04],.014,m.steel);
  rod(rack,[width/2-.04,.14,-depth/2+.04],[-width/2+.04,height-.1,-depth/2+.04],.014,m.steel);
  const tiers=height>2?4:3,levels=Array.from({length:tiers},(_,i)=>.13+i*(height-.25)/(tiers-1));
  for(const [tier,y] of levels.entries()){
   box(rack,width,.045,depth,0,y,0,m.steel);box(rack,width,.07,.025,0,y-.012,depth/2-.01,olive);
   if(tier===tiers-1){tag(rack,f.kind.toUpperCase()+' / '+String(rackIndex+1).padStart(2,'0'),Math.min(width-.1,1.1),.12,0,y-.025,depth/2+.006);}
   // Original top surfaces keep pickup tools exposed. Tall banks hold boxed stock up top.
   if(tier===tiers-1&&rackIndex<11)continue;
   const available=tier===tiers-1?.27:levels[tier+1]-y-.07;
   let x=-width/2+.075;let count=0;
   while(x<width/2-.17&&count<8){
    const slot=Math.min(.25+rnd()*.18,width/2-.065-x);if(slot<.18)break;
    if(count>0&&rnd()<.16){x+=slot;count++;continue;}
    const prop=new THREE.Group();prop.position.set(x+slot/2,y+.025,(rnd()-.5)*depth*.17);prop.rotation.y=(rnd()-.5)*.25;rack.add(prop);
    const s=slot*.83,dh=Math.min(depth*.64,.34),h=Math.min(available*.85,.20+rnd()*.20),paint=palette[Math.floor(rnd()*palette.length)];
    const options={parts:['crate','gaskets','motor','tin','cable','toolbox'],archive:['binders','papers','crate','reel'],rescue:['case','cable','bottle','toolbox'],samples:['bottle','bottle','tray','papers','crate'],meters:['meter','meter','cable','tin','case'],filters:['filter','filter','tin','crate','bottle']};
    const list=options[f.kind],kind=list[Math.floor(rnd()*list.length)];
    if(kind==='crate'||kind==='case'||kind==='toolbox'){
     box(prop,s,h,dh,0,h/2,0,paint);box(prop,s+.014,.025,dh+.012,0,h,0,m.dark);
     for(const side of [-1,1]){box(prop,.025,h+.025,.015,side*s*.35,h/2,dh/2+.008,m.steel);box(prop,.025,.012,dh,side*s*.35,h+.017,0,m.steel);}
     tag(prop,'86 / '+(10+Math.floor(rnd()*80)),s*.65,.065,0,h*.48,dh/2+.017);
     if(kind==='toolbox'){box(prop,s*.45,.024,.035,0,h+.065,0,m.dark);for(const side of [-1,1])box(prop,.025,.055,.035,side*s*.2,h+.035,0,m.dark);}
    }else if(kind==='bottle'||kind==='tin'||kind==='filter'){
     const r=s*.35;cylinder(prop,r,h*.8,0,h*.4,0,paint);cylinder(prop,r*(kind==='bottle'?.45:1.06),h*.2,0,h*.9,0,m.dark);
     tag(prop,kind==='bottle'?'B-17':'86',r*1.4,.065,0,h*.42,r+.003);
     if(kind==='filter')for(let k=0;k<6;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(r+.002,.008,3,8),m.steel);ring.rotation.x=Math.PI/2;ring.position.y=.025+k*h*.12;prop.add(ring);}
    }else if(kind==='meter'){
     box(prop,s,h,dh,0,h/2,0,paint);box(prop,s*.7,h*.44,.015,0,h*.64,dh/2+.008,m.paper);
     box(prop,.007,h*.28,.008,0,h*.64,dh/2+.02,m.red).rotation.z=(rnd()-.5)*1.4;
     for(const side of [-1,1]){const knob=cylinder(prop,.022,.022,side*s*.25,h*.19,dh/2+.018,m.dark);knob.rotation.x=Math.PI/2;}
    }else if(kind==='binders'||kind==='papers'){
     const n=2+Math.floor(rnd()*3);
     for(let k=0;k<n;k++){if(kind==='binders'){const w=s/n*.87;box(prop,w,h,dh,-s/2+w/2+k*s/n,h/2,0,k%2?m.paper:paint);box(prop,w*.6,.035,.008,-s/2+w/2+k*s/n,h*.72,dh/2+.004,m.paper);}else{const paper=box(prop,s,.025,dh,(rnd()-.5)*.02,.013+k*.027,0,k%3?m.paper:paint);paper.rotation.y=(rnd()-.5)*.20;}}
    }else if(kind==='cable'||kind==='gaskets'||kind==='reel'){
     const n=kind==='cable'?5:3;for(let k=0;k<n;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(s*.31,.012,4,12),kind==='cable'?m.dark:m.steel);ring.rotation.x=Math.PI/2;ring.position.set(0,.02+k*.025,0);prop.add(ring);}
     box(prop,.045,.10,s*.7,0,.055,0,kind==='cable'?m.paper:paint);
    }else if(kind==='motor'){
     const motor=cylinder(prop,s*.35,dh,0,s*.35+.02,0,paint);motor.rotation.x=Math.PI/2;
     for(let k=0;k<4;k++)box(prop,s*.7,.014,dh,0,.08+k*.035,0,m.steel);
     box(prop,s*.6,.04,dh,0,.02,0,m.dark);
    }else{
     box(prop,s,.045,dh,0,.025,0,m.steel);for(let k=0;k<3;k++){cylinder(prop,.023,h*.75,-s*.3+k*s*.3,.05+h*.375,0,m.paper);cylinder(prop,.026,.025,-s*.3+k*s*.3,.05+h*.75,0,m.red);}
    }
    x+=slot+.015+rnd()*.025;count++;
   }
  }
  // A clipped job ticket and a cloth rag interrupt the otherwise regular rack silhouette.
  tag(rack,'CHECK / 86',.18,.20,width*.33,height*.59,depth/2+.009);
  const rag=box(rack,.18,.012,.21,-width*.31,levels[1]+.033,depth*.26,m.paper);rag.rotation.y=.28;
 }
}
