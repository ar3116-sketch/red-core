import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// How engineers see Specimen-09: nothing when it is still, a smeared shadow when it moves,
// a Cherenkov-cyan outline when something reveals it. Cameras always catch it in cyan.
export function createSpecimenView(scene){
 const root=new THREE.Group();root.visible=false;scene.add(root);
 const ghost=new THREE.MeshBasicMaterial({color:0x050604,transparent:true,opacity:.1,depthWrite:false});
 const cyan=new THREE.MeshBasicMaterial({color:0x19e6ff,transparent:true,opacity:.85,depthWrite:false});
 const blob=new THREE.Mesh(new THREE.CircleGeometry(.75,12),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0,depthWrite:false}));
 blob.rotation.x=-Math.PI/2;scene.add(blob);
 const mist=[];
 {const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');for(let y=0;y<16;y++)for(let x=0;x<16;x++){g.fillStyle=`rgba(190,196,180,${Math.max(0,1-Math.hypot(x-7.5,y-7.5)/8)*.5})`;g.fillRect(x,y,1,1);}
  const map=new THREE.CanvasTexture(c);for(let i=0;i<14;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthWrite:false,opacity:0}));scene.add(s);mist.push(s);}}
 let model=null,meshes=[],originals=new Map(),mixer=null,idle=null,walk=null,walking=false,mode='hidden',lastPos=null;
 new GLTFLoader().load(new URL('../assets/specimen-v3.glb',import.meta.url).href,gltf=>{
  model=gltf.scene;root.add(model);
  model.traverse(o=>{if(o.isMesh){meshes.push(o);originals.set(o,o.material);o.frustumCulled=false;}});
  mixer=new THREE.AnimationMixer(model);
  idle=mixer.clipAction(gltf.animations.find(a=>a.name==='idle')||gltf.animations[0]);walk=gltf.animations.find(a=>a.name==='walk')?mixer.clipAction(gltf.animations.find(a=>a.name==='walk')):null;idle.play();
 });
 function paint(next){if(next===mode)return;mode=next;for(const m of meshes)m.material=next==='ghost'?ghost:next==='cyan'?cyan:originals.get(m);}
 function parts(mutations){const ids=Object.values(mutations||{});model?.traverse(o=>{if(o.name.startsWith('mutation_'))o.visible=ids.includes(o.name.slice(9).split('__')[0]);});}
 let state=null,self=false;
 return {
  // spec: server snapshot; self: the viewer is the specimen; surge: reactor steam outline.
  update(spec,{dt,now,self:isSelf,surge}){
   state=spec;self=isSelf;
   if(!spec||spec.inVent||isSelf){root.visible=false;blob.material.opacity=0;}
   else{
    root.visible=true;
    root.position.lerp(new THREE.Vector3(spec.x,spec.y,spec.z),lastPos?Math.min(1,dt*12):1);lastPos=true;
    root.rotation.y=spec.yaw+Math.PI;root.scale.setScalar(.85+.12*spec.stage);
    parts(spec.mutations);
    const moving=spec.still<700,veil=Object.values(spec.mutations||{}).includes('veil'),insulated=Object.values(spec.mutations||{}).includes('insulation');
    if(spec.reveal)paint('cyan'),cyan.opacity=.9;
    else if(surge&&!insulated)paint('cyan'),cyan.opacity=.55+.25*Math.sin(now*.02);
    else if(moving){paint('ghost');ghost.opacity=(.09+.07*spec.stage)*(veil?.5:1);root.scale.x*=1+Math.sin(now*.031)*.06;root.scale.z*=1+Math.cos(now*.027)*.06;}
    else paint('hidden');
    root.visible=mode!=='hidden';
    blob.position.set(spec.x,spec.y+.02,spec.z);blob.material.opacity=moving&&!spec.reveal?(veil?.25:.5):0;blob.scale.setScalar(.8+.15*spec.stage+Math.sin(now*.01)*.05);
    if(mixer&&walk&&moving!==walking){walking=moving;(walking?walk:idle).reset().fadeIn(.2).play();(walking?idle:walk).fadeOut(.2);}
    mixer?.update(dt);
   }
   return spec&&!spec.inVent?spec:null;
  },
  mist(m,now){for(let i=0;i<mist.length;i++){const s=mist[i];if(!m){s.material.opacity=0;continue;}const t=((now/1000)*.5+i/mist.length)%1,a=i*2.4;s.position.set(m.x+Math.cos(a)*(.4+t*2.4),.4+t*1.8,m.z+Math.sin(a)*(.4+t*2.4));s.scale.setScalar(2+t*3);s.material.opacity=.85*Math.sin(Math.PI*t);}},
  // CCTV sees through the cloak: cyan, unless mimetic skin keeps it still.
  beginFeed(){if(!state||state.inVent||self)return;const veil=Object.values(state.mutations||{}).includes('veil');if(veil&&state.still>1000)return;root.userData.feed=[root.visible,mode];root.visible=true;paint('cyan');cyan.opacity=.95;},
  endFeed(){if(!root.userData.feed)return;const [visible,previous]=root.userData.feed;root.userData.feed=null;root.visible=visible;mode='';paint(previous);},
 };
}
