import * as THREE from 'three';
import {SABOTAGE,CAMERAS} from '../shared/stations.js';
import {LIFT_DOOR} from '../shared/wings.js';

// Crisis pointers, like the arrows Among Us shows during a sabotage: every live emergency gets a cyan
// marker over the spot, or an arrow pinned to the screen edge when it is off-screen, with the distance.
const MARGIN=56;
export function createArrows(){
 const root=document.createElement('div');root.id='crisis';document.body.appendChild(root);
 const pool=[],v=new THREE.Vector3();
 const mark=i=>{if(!pool[i]){const el=document.createElement('div');el.className='crisis-mark';el.innerHTML='<i></i><span></span>';root.appendChild(el);pool[i]={el,arrow:el.firstChild,text:el.lastChild};}return pool[i];};
 function targets(me,s){
  const out=[],sab=id=>SABOTAGE.find(x=>x.id===id);
  for(const a of s.armed||[]){const t=sab(a.id);if(t)out.push({x:t.x,y:0,z:t.z,label:`STOP / ${t.label} ${Math.ceil(a.left)}S`,hot:true});}
  if(s.valve&&!s.armed?.some(a=>a.id==='valve')){const t=sab('valve');out.push({x:t.x,y:0,z:t.z,label:'COOLANT VALVE REVERSED'});}
  if(s.blackout&&!s.armed?.some(a=>a.id==='breaker')){const t=sab('breaker');out.push({x:t.x,y:0,z:t.z,label:'RESET MAIN BREAKER'});}
  for(const id of s.cut||[]){const c=CAMERAS.find(c=>c.id===id);if(c)out.push({x:c.box.x,y:0,z:c.box.z,label:`SPLICE CAM ${c.label.slice(0,2)}`});}
  if(s.specimen?.hold==='escape')out.push({x:LIFT_DOOR.x,y:0,z:LIFT_DOOR.z,label:'STOP IT / SURFACE LIFT',hot:true});
  for(const p of s.players||[])if(p.id!==me.id&&p.state==='hanging')out.push({x:p.x,y:p.y,z:p.z,label:'MAN OVER THE EDGE',hot:true});
  return out;
 }
 return {update(camera,me,s,pos){
  const show=s&&me&&s.phase==='shift'&&(me.role==='crew'||me.role==='saboteur')&&me.state!=='dead'&&me.state!=='spectator';
  if(show&&window.__crisis)s={...s,...window.__crisis};
  const list=show?targets(me,s):[],W=innerWidth,H=innerHeight;
  list.forEach((t,i)=>{const m=mark(i);m.el.hidden=false;
   v.set(t.x,t.y+1.3,t.z);const cam=v.clone().applyMatrix4(camera.matrixWorldInverse);v.project(camera);
   const d=Math.round(Math.hypot(t.x-pos.x,t.z-pos.z)),dy=t.y-(pos.y||0);
   m.text.textContent=`${t.label} ${d}M${dy>2.5?' ▲':dy< -2.5?' ▼':''}`;
   const onScreen=cam.z<0&&Math.abs(v.x)<.92&&Math.abs(v.y)<.88;
   let x,y,angle;
   if(onScreen){x=(v.x+1)/2*W;y=(1-v.y)/2*H;angle=Math.PI/2;m.el.classList.remove('edge');}
   else{let dx=cam.x,dyS=-cam.y;if(cam.z>0&&Math.hypot(dx,dyS)<.3)dyS=1;const l=Math.hypot(dx,dyS)||1;dx/=l;dyS/=l;
    const k=Math.min((W/2-MARGIN)/Math.max(1e-3,Math.abs(dx)),(H/2-MARGIN)/Math.max(1e-3,Math.abs(dyS)));x=W/2+dx*k;y=H/2+dyS*k;angle=Math.atan2(dyS,dx);m.el.classList.add('edge');}
   m.el.style.transform=`translate(${x.toFixed(0)}px,${y.toFixed(0)}px)`;m.arrow.style.transform=`rotate(${angle}rad)`;m.el.classList.toggle('hot',!!t.hot);
  });
  for(let i=list.length;i<pool.length;i++)pool[i].el.hidden=true;
 }};
}
