import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PARTS, SLOTS, createEvolution, unlockSafe, equip, effects, routeTrial } from '../shared/evolution.js';
const $=id=>document.getElementById(id);
const renderer=new THREE.WebGLRenderer({canvas:$('preview'),antialias:false});renderer.setPixelRatio(1);renderer.setSize(320,320,false);
const scene=new THREE.Scene();scene.background=new THREE.Color('#151d14');scene.add(new THREE.HemisphereLight(0xd8dbba,0x182218,2));
const light=new THREE.DirectionalLight(0xffdfaf,2.5);light.position.set(-3,5,4);scene.add(light);
const rim=new THREE.DirectionalLight(0x91a7a0,1.6);rim.position.set(2,3,-3);scene.add(rim);
const camera=new THREE.PerspectiveCamera(38,1,.1,40);camera.position.set(2,1.8,4.5);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.05,0);controls.minDistance=2.3;controls.maxDistance=7;controls.enablePan=false;controls.update();
const grid=new THREE.GridHelper(6,12,0x526047,0x253120);scene.add(grid);
let monster,crew,monsterMixer,crewMixer,monsterClips,crewClips,showCrew=false,walking=false;
let state=createEvolution('SHIFT-'+crypto.getRandomValues(new Uint32Array(1))[0]);
function setClips(mixer,clips){if(!mixer)return;mixer.stopAllAction();const clip=clips.find(c=>c.name===(walking?'walk':'idle'));if(clip)mixer.clipAction(clip).play();}
function applyModel(){
 if(monster){monster.visible=!showCrew;monster.traverse(o=>{if(o.name.startsWith('mutation_')){const id=o.name.slice(9).split('__')[0];o.visible=Object.values(state.equipped).includes(id);}});}
 if(crew)crew.visible=showCrew;
 $('model-title').textContent=showCrew?'ENGINEER / OZK':'SPECIMEN 09';
}
const loader=new GLTFLoader();
Promise.all([
 loader.loadAsync(new URL('../assets/specimen-v3.glb',import.meta.url).href).then(g=>{monster=g.scene;scene.add(monster);monsterMixer=new THREE.AnimationMixer(monster);monsterClips=g.animations;setClips(monsterMixer,monsterClips);}),
 loader.loadAsync(new URL('../assets/ozk-v3.glb',import.meta.url).href).then(g=>{crew=g.scene;scene.add(crew);crewMixer=new THREE.AnimationMixer(crew);crewClips=g.animations;setClips(crewMixer,crewClips);}),
]).then(applyModel).catch(error=>{$('summary').textContent='MODEL LOAD FAILED';console.error(error);});
let selectedRoute=null;
function render(){
 $('seed').textContent=state.seed;
 $('progress').textContent=`EVOLUTION ${state.stage}/3 / ${Object.keys(state.equipped).length} PARTS EQUIPPED`;
 $('unlock').disabled=state.stage===3;$('unlock').textContent=state.stage===3?'ALL SAFES OPEN':`SIMULATE SAFE ${state.stage+1} SOLVED`;
 $('offers').replaceChildren();
 for(const slot of ['senses','movement','hide']){
  const section=document.createElement('section'),h=document.createElement('h2');h.textContent=slot.toUpperCase()+(state.stage>['senses','movement','hide'].indexOf(slot)?' / AVAILABLE':' / SAFE LOCKED');section.append(h);
  for(const id of state.offers[slot]){
   const p=PARTS.find(p=>p.id===id),button=document.createElement('button');button.className='part';button.disabled=state.stage<=['senses','movement','hide'].indexOf(slot);button.setAttribute('aria-pressed',String(state.equipped[slot]===id));
   for(const [tag,text,cls] of [['strong',p.name,''],['span',p.gain,''],['span','TRADEOFF: '+p.cost,'cost'],['span','COUNTERPLAY: '+p.counter,'counter']]){const node=document.createElement(tag);node.textContent=text;node.className=cls;button.append(node);}
   button.onclick=()=>{state=equip(state,id);render();};section.append(button);
  }
  const absent=document.createElement('p');absent.className='unavailable';absent.textContent='Not in this match: '+PARTS.filter(p=>p.slot===slot&&!state.offers[slot].includes(p.id)).map(p=>p.name).join(' / ');section.append(absent);$('offers').append(section);
 }
 const fx=effects(state);$('summary').textContent=`SPEED ${Math.round(fx.speed*100)}% / NOISE ${Math.round(fx.noise*100)}%`;
 if(state.equipped.senses==='thermal'&&state.equipped.hide==='sacs')$('summary').textContent+=' / YOUR MIST ALSO BLOCKS THERMAL';
 $('routes').replaceChildren();
 for(const route of ['corridor','door','vent','rail','gap']){const r=routeTrial(state,route),b=document.createElement('button');b.className='route';b.textContent=r.label+(r.allowed?' +':' -');b.setAttribute('aria-pressed',String(route===selectedRoute));b.onclick=()=>{selectedRoute=route;render();};$('routes').append(b);}
 if(selectedRoute){const r=routeTrial(state,selectedRoute);$('trial-result').textContent=r.allowed?`${r.label}: ${r.seconds.toFixed(1)} seconds. ${r.detail}`:`${r.label}: unavailable with this body. Use the normal corridor or equip an offered movement part.`;}
 applyModel();
}
$('unlock').onclick=()=>{state=unlockSafe(state);render();};
$('new-round').onclick=()=>{const previous=JSON.stringify(Object.values(state.offers).map(a=>[...a].sort()));let next;do{next=createEvolution('SHIFT-'+crypto.getRandomValues(new Uint32Array(1))[0]);}while(JSON.stringify(Object.values(next.offers).map(a=>[...a].sort()))===previous);state=next;selectedRoute=null;$('trial-result').textContent='New supply drawn. Solve safes to evolve.';render();};
$('show-crew').onclick=()=>{showCrew=true;applyModel();};$('show-monster').onclick=()=>{showCrew=false;applyModel();};$('animate').onclick=()=>{walking=!walking;$('animate').setAttribute('aria-pressed',String(walking));setClips(monsterMixer,monsterClips);setClips(crewMixer,crewClips);};
const clock=new THREE.Clock();function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.1);monsterMixer?.update(dt);crewMixer?.update(dt);renderer.render(scene,camera);}render();loop();
