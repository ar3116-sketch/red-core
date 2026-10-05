import {makeTool} from './tool-models.js';
import * as THREE from 'three';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';

// Floating gloves are rendered separately so nearby scenery cannot clip them.
// This camera uses the same field of view and aspect as the world camera.
export function createFirstPerson(scene) {
  const view=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(72,4/3,.02,3);
  const ambient=new THREE.AmbientLight(0xa8b397,.65);
  const light=new THREE.DirectionalLight(0xddbc88,.8);
  light.position.set(-1,2,1);view.add(ambient,light);
  const gloves=new THREE.Group();view.add(gloves);
  const rubber=new THREE.MeshLambertMaterial({color:0x343c30,flatShading:true});
  const rubberSeam=new THREE.MeshLambertMaterial({color:0x45503d,flatShading:true});
  const hands=[];let carried=null,carriedKind=null;
  const fingerGeometry=new THREE.SphereGeometry(1,6,4);
  const axis=new THREE.Vector3(0,1,0);
  const rest=new THREE.Vector3(),target=new THREE.Vector3();
  let body,mixer,idle,walk,wasMoving=false,phase=0,reach=0,motion=0;

  function segment(a,b,r1,r2,material,group) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r2,r1,start.distanceTo(end),6),material);
    mesh.position.copy(start).add(end).multiplyScalar(.5);
    mesh.quaternion.setFromUnitVectors(axis,end.sub(start).normalize());group.add(mesh);return mesh;
  }
  for(const side of [-1,1]){
    const hand=new THREE.Group();hands.push(hand);gloves.add(hand);
    const palm=new THREE.Mesh(new THREE.SphereGeometry(1,8,6),rubber);
    palm.scale.set(.041,.050,.024);palm.position.y=-.006;hand.add(palm);
    segment([0,.073,0],[0,.024,0],.036,.034,rubber,hand);
    // Four separately jointed fingers with staggered lengths and a relaxed curl.
    const lengths=side===1?[.057,.065,.060,.046]:[.046,.060,.065,.057];
    for(let i=0;i<4;i++){
      const x=(i-1.5)*.020,length=lengths[i];
      const a=[x,-.041,-.003],b=[x*1.04,-.041-length*.48,-.001];
      const c=[x*1.07,-.041-length*.82,.012],d=[x*1.05,-.041-length,.027];
      segment(a,b,.010,.009,rubber,hand);segment(b,c,.009,.0085,rubber,hand);segment(c,d,.0085,.007,rubber,hand);
      const knuckle=new THREE.Mesh(fingerGeometry,rubberSeam);knuckle.scale.set(.009,.011,.009);knuckle.position.set(...a);hand.add(knuckle);
    }
    // Thumb emerges from the palm's side, rather than branching from the wrist.
    segment([-side*.032,.007,.003],[-side*.052,-.014,.016],.014,.012,rubber,hand);
    segment([-side*.052,-.014,.016],[-side*.045,-.041,.030],.012,.008,rubber,hand);
    segment([0,.073,0],[0,.058,0],.037,.037,rubberSeam,hand);
  }
  return {
    setHeld(kind){if(kind===carriedKind)return;if(carried)gloves.remove(carried);carriedKind=kind;carried=kind?makeTool(kind):null;if(carried){carried.scale.setScalar(kind==='rope'?.7:.7);gloves.add(carried);}},
    resize(aspect){camera.aspect=aspect;camera.updateProjectionMatrix();},
    setModel(gltf){
      if(body)scene.remove(body);body=cloneSkeleton(gltf.scene);
      body.traverse(o=>{
        if(!o.isMesh)return;
        if(o.isSkinnedMesh){const index=o.geometry.getAttribute('skinIndex')?.getX(0);const name=o.skeleton.bones[index]?.name||'';if(/Head|Neck|Chest|Spine|Arm|Hand/.test(name)||/Waist/.test(o.name))o.visible=false;}
      });
      scene.add(body);mixer=new THREE.AnimationMixer(body);
      idle=gltf.animations.find(c=>c.name==='idle');walk=gltf.animations.find(c=>c.name==='walk');
      if(idle)mixer.clipAction(idle).play();
    },
    interact(){reach=1;},
    update(dt,{position,yaw,pitch,moving,holdingBreath,blackout,menuOpen,toolUse=0,equipping=0}){
      motion=THREE.MathUtils.damp(motion,moving?1:0,10,dt);phase+=dt*(moving?7.2:1.6);
      if(body){
        body.position.copy(position);body.position.x+=Math.sin(yaw)*.35;body.position.z+=Math.cos(yaw)*.35;
        body.rotation.y=yaw+Math.PI;body.visible=pitch<-.25;
        if(moving!==wasMoving&&idle&&walk){mixer.clipAction(moving?walk:idle).reset().fadeIn(.15).play();mixer.clipAction(moving?idle:walk).fadeOut(.15);}mixer.update(dt);
      }
      wasMoving=moving;reach=Math.max(0,reach-dt*2);camera.rotation.x=pitch;gloves.rotation.copy(camera.rotation);
      hands.forEach((hand,i)=>{
        const side=i===0?-1:1,swing=Math.sin(phase+i*Math.PI)*motion;
        const extension=i===1?Math.sin(reach*Math.PI):0;
        const breath=holdingBreath?0:Math.sin(phase)*.0015;
        rest.set(side*(.23+Math.abs(swing)*.006),-.29+breath+Math.abs(swing)*.006,-.48+swing*.018);
        target.set(side*.16,-.13,-.61);
        hand.position.copy(rest).lerp(target,extension);
        hand.rotation.set(2.0-extension*.25,-side*.7*(1-extension),side*.15*(1-extension));
      });
      if(carried){const hand=hands[1];hand.position.set(.22,-.28+Math.sin(toolUse*Math.PI*4)*.025-equipping*.18,-.43);hand.rotation.set(.3,-.6,.1);carried.position.copy(hand.position).add(new THREE.Vector3(-.018,.02,-.035));carried.rotation.set(-.22,0,-.22+Math.sin(toolUse*Math.PI*4)*.25);}
      gloves.visible=!menuOpen;
      ambient.intensity=blackout?.16:.65;light.intensity=blackout?.12:.8;
    },
    render(renderer){const previous=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(view,camera);renderer.autoClear=previous;}
  };
}
