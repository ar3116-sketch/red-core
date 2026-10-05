import * as THREE from 'three';
import {CSS3DRenderer,CSS3DObject} from 'three/addons/renderers/CSS3DRenderer.js';

// Machine panels live on the machines. When one opens, the camera leans in to the machine
// and the panel sits on it in perspective, rather than floating over a dimmed screen.
export function createDiegetic(){
 const css=new CSS3DRenderer();css.domElement.id='world-panels';document.body.append(css.domElement);
 const scene=new THREE.Scene(),panels=[];
 let active=null,blend=0,from=null;
 const tmp=new THREE.Vector3(),look=new THREE.Matrix4(),goal=new THREE.Quaternion();
 const api={
  // anchor(): {x,y,z} of the machine face; the panel turns to face the player when opened.
  add(id,anchor,width=.9){
   const el=document.getElementById(id);el.classList.add('in-world');
   const obj=new CSS3DObject(el);scene.add(obj);
   panels.push({id,el,obj,anchor,width,facing:new THREE.Vector3(0,0,1)});
  },
  get active(){return active;},
  // Called each frame with the player's eye and look. Returns the camera to use.
  update(dt,camera,eye){
   const open=panels.find(p=>!p.el.hidden);
   if(open!==active){
    if(open){
     const a=open.anchor();const face=new THREE.Vector3(eye.x-a.x,0,eye.z-a.z);if(face.lengthSq()<1e-4)face.set(0,0,1);face.normalize();
     open.facing.copy(face);open.obj.position.set(a.x,a.y,a.z).addScaledVector(face,.06);
     open.obj.lookAt(open.obj.position.clone().add(face));
     const px=open.el.offsetWidth||480;open.obj.scale.setScalar(open.width/px);
     from={pos:camera.position.clone(),quat:camera.quaternion.clone()};blend=0;
    }
    active=open||null;if(!open)blend=0;document.body.classList.toggle('leaning',!!open);
   }
   if(!active)return false;
   // Lean in until the panel fills most of the view height.
   const px=active.el.offsetWidth||480,ph=active.el.offsetHeight||480,h=ph*(active.width/px),w=active.width;
   const fov=THREE.MathUtils.degToRad(camera.fov),fit=Math.max(h/2/Math.tan(fov/2),w/2/Math.tan(fov/2)/camera.aspect)/.72;
   tmp.copy(active.obj.position).addScaledVector(active.facing,fit);
   look.lookAt(tmp,active.obj.position,camera.up);goal.setFromRotationMatrix(look);
   blend=Math.min(1,blend+dt*4);const k=1-Math.pow(1-blend,3);
   camera.position.lerpVectors(from.pos,tmp,k);camera.quaternion.slerpQuaternions(from.quat,goal,k);
   return true;
  },
  setSize(w,h){css.setSize(w,h);},
  render(camera){css.render(scene,camera);},
 };
 return api;
}
