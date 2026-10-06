import * as THREE from 'three';
import {CAMERAS} from '../shared/stations.js';
export function buildFacility(scene,{box,pipe,roomSign,wall,floor,steel,dark,rust,glow,hazard}){
 const feeds=[];
 for(const [a,b,c,d] of [[-23,-15,-5,3],[15,23,-15,-13],[15,23,-10.5,-5],[15,18.5,-13,-10.5],[21,23,-13,-10.5]])for(let x=a;x<b;x+=1)for(let z=c;z<d;z+=.5)box(1,.12,.5,x+.5,-.06,z+.25,floor);
 box(8,.2,8,-19,3.5,-1,dark);box(8,.2,10,19,3.5,-10,dark);
 box(2.5,.12,2.5,19.75,-2.46,-11.75,floor);
 for(const x of [18.5,21])box(.12,2.4,2.5,x,-1.2,-11.75,wall);
 for(const z of [-13,-10.5])box(2.5,2.4,.12,19.75,-1.2,z,wall);
 // An open inspection pit has a visible ladder back to the main floor.
 for(const z of [-12,-11.3])box(.065,2.9,.065,18.67,-.95,z,rust);
 for(let y=-2.2;y<.4;y+=.3)box(.065,.045,.7,18.67,y,-11.65,steel);
 for(const x of [18.4,21.1])for(let z=-12.9;z<-10.5;z+=.35)box(.12,.016,.18,x,.009,z,hazard);
 roomSign('SERVICE PIT / OPEN',19.75,2.6,-14.83,0);
 const door=box(.3,2.7,2.4,-15,1.35,-1.5,steel);door.userData.dynamic=true;
 roomSign('CAMERAS / LOCKED',-14.8,2.95,-1.5,Math.PI/2);
 box(.07,.55,.4,-14.8,1.4,-3.3,dark);
 for(let y=0;y<3;y++)for(let z=0;z<3;z++)box(.04,.07,.065,-14.75,1.55-y*.11,-3.4+z*.1,hazard);
 roomSign('E / ACCESS PANEL',-14.77,2,-3.3,Math.PI/2);
 roomSign('INCINERATOR',15.2,2.95,-10,Math.PI/2);
 roomSign('WORKSHOP',-15.2,2.95,-1.5,-Math.PI/2);
 // A grated furnace face, chimney, feed chute and nearby ash bin.
 box(2.1,1.3,.06,21,1.35,-7.83,dark);
 const fire=new THREE.MeshBasicMaterial({color:0xb87932});box(1.75,.9,.035,21,1.25,-7.88,fire);
 for(let x=20.2;x<22;x+=.22)box(.07,1,.065,x,1.25,-7.91,dark);
 const chimney=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.75,8),rust);chimney.position.set(21,3.1,-6.8);scene.add(chimney);box(1,.2,.6,21,.65,-8.1,steel);
 roomSign('E / FILTER PURGE',21,2.7,-7.85,Math.PI);
 const furnaceLight=new THREE.PointLight(0xca8437,12,10,1.7);furnaceLight.position.set(21,1.5,-8.4);scene.add(furnaceLight);
 const cameraLight=new THREE.PointLight(0xc09454,6,9,1.7);cameraLight.position.set(-19,2.7,-1);scene.add(cameraLight);
 box(1.3,.08,.4,-19,3.3,-1,glow);
 // Six CCTV feeds in two rows. Cut cables show static; a blackout kills them all.
 const noise=document.createElement('canvas');noise.width=64;noise.height=48;const noiseCtx=noise.getContext('2d');const noiseMap=new THREE.CanvasTexture(noise);noiseMap.magFilter=THREE.NearestFilter;
 CAMERAS.forEach((c,i)=>{
  const z=-3+(i%3)*2,y=i<3?1.3:2.15,target=new THREE.WebGLRenderTarget(128,96,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter});target.texture.colorSpace=THREE.SRGBColorSpace;
  const material=new THREE.MeshBasicMaterial({map:target.texture,color:0x000000});
  box(.6,.78,1.15,-21.55,y,z,dark);
  const screen=new THREE.Mesh(new THREE.PlaneGeometry(.95,.66),material);screen.position.set(-21.23,y,z);screen.rotation.y=Math.PI/2;scene.add(screen);
  const camera=new THREE.PerspectiveCamera(70,4/3,.1,70);camera.position.set(...c.mount);camera.lookAt(...c.target);feeds.push({id:c.id,camera,target,material});
  const lc=document.createElement('canvas');lc.width=128;lc.height=16;const lg=lc.getContext('2d');lg.fillStyle='#121b14';lg.fillRect(0,0,128,16);lg.fillStyle='#c6d0a1';lg.font='bold 11px monospace';lg.fillText(c.label,4,12);
  const lt=new THREE.CanvasTexture(lc);lt.magFilter=lt.minFilter=THREE.NearestFilter;const tag=new THREE.Mesh(new THREE.PlaneGeometry(.95,.12),new THREE.MeshBasicMaterial({map:lt}));tag.position.set(-21.22,y+.42,z);tag.rotation.y=Math.PI/2;scene.add(tag);
 });
 roomSign('E / SEAT VACUUM TUBES',-21.1,2.8,-1,Math.PI/2);
 const tubes=[];// the tube rack is the 3D machine in machines.js
 let doorHeight=1.35,lastFrame=0,index=0;
 let state={};
 return {setState(next){state=next;},update(dt,time,opened,powered){doorHeight+=((opened?4.2:1.35)-doorHeight)*Math.min(1,dt*6);door.position.y=doorHeight;furnaceLight.intensity=10+Math.sin(time*4)*1.5+Math.sin(time*7)*.6;fire.color.setHex(0xb87932).multiplyScalar(.85+Math.sin(time*5)*.15);for(const f of feeds){const dead=!powered||state.blackout;const cut=state.cut?.includes(f.id);f.material.map=cut&&!dead?noiseMap:f.target.texture;f.material.color.setHex(dead?0x000000:0x9dba94);}if(state.cut?.length){for(let i=0;i<300;i++){const v=Math.random()*200|0;noiseCtx.fillStyle=`rgb(${v},${v},${v})`;noiseCtx.fillRect(Math.random()*64|0,Math.random()*48|0,2,1);}noiseMap.needsUpdate=true;}for(const t of tubes)t.color.setHex(powered?0xd99b44:0x27372b);},renderFeeds(renderer,now,powered,position,selectLights,hooks){if(!powered||state.blackout||position.x>-15||now-lastFrame<120)return;lastFrame=now;const f=feeds[index++%feeds.length];if(state.cut?.includes(f.id))return;const previous=renderer.getRenderTarget();renderer.setRenderTarget(f.target);selectLights(f.camera.position);hooks?.before?.();renderer.render(scene,f.camera);hooks?.after?.();renderer.setRenderTarget(previous);}};
}
