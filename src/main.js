import {heldTool,TOOL_NAMES,TOOL_JOBS,withinToolReach} from '../shared/tool-system.js';
import {createToolWorld} from './tool-world.js';
import {createRelay} from '../shared/relay-task.js';
import {createRelayTask} from './relay-task.js';
import {lightSelector} from './static-batch.js';
import {alarmState} from '../shared/alarms.js';
import {buildAlarms} from './alarms.js';
import {createFacilityPanels} from './facility-panels.js';
import {createTubeTask} from './tube-task.js';
import {createTubes,TUBE_RACK} from '../shared/tubes.js';
import {CAMERA_PANEL,INCINERATOR,SERVICE_LADDER,nearStation,publicAccessPuzzle} from '../shared/facility.js';
import {createCoolantTask} from './coolant-task.js';
import {createCoolantState,atCoolantStation} from '../shared/coolant.js';
import {createChessSafe} from './chess-safe.js';
import {createFloorPlan} from './floor-plan.js';
import {moveWithCollisions,solidsForState} from '../shared/world.js';
import {safeAt} from '../shared/safes.js';
import {nearVent,nearSabotage,SCIF_DESK,REACTOR_SMASH,VENTS} from '../shared/stations.js';
import {LIFT_DOOR} from '../shared/wings.js';
import {SPECIMEN,HANG,TAPE} from '../shared/match.js';
import {PARTS} from '../shared/evolution.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone as cloneSkeleton} from 'three/addons/utils/SkeletonUtils.js';
import {ACTION_RANGE,CONSOLE_POSITION,MOVE_SPEED,SHIFT_SECONDS,START_TEMP} from '../shared/constants.js';
import {connectRoom,newCode,cleanCode} from './net.js';
import {buildBunker} from './bunker.js';
import {BunkerAudio} from './audio.js';
import {addProps} from './props.js';
import {createFirstPerson} from './first-person.js';
import {movementVector} from './movement.js';
import {autoPS1,createPS1Post} from './ps1.js';
import {createBeatBar} from './beatbar.js';
import {createSpecimenView} from './specimen-view.js';
import {createSweeper,createScope,createMutation,createVentMap,createScif} from './panels-extra.js';
import {setMode,getMode,setRole,renderLobby,renderBriefing,renderOver,bindCopy} from './screens.js';
import {renderObjectives,renderSpecimen} from './hud.js';
import {createTutorial} from './tutorial.js';
import {createDiegetic} from './diegetic.js';
import {createMachines} from './machines.js';
import {MACHINES,nearMachine,machineSeed,puzzle,sabPuzzle} from '../shared/machines.js';
import {SAB_COOLDOWN} from '../shared/stations.js';
import {COOLANT_STATION} from '../shared/coolant.js';

const $=id=>document.getElementById(id);
const canvas=$('c');
// ---------- renderer and world ----------
const renderer=new THREE.WebGLRenderer({canvas,antialias:false});
renderer.setPixelRatio(1);renderer.setSize(320,240,false);
autoPS1();
const ps1=createPS1Post(renderer,{snap:.8});
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x080d0a);
scene.fog=new THREE.Fog(0x080d0a,7,46);
const camera=new THREE.PerspectiveCamera(72,4/3,.1,80);
camera.rotation.order='YXZ';
scene.add(new THREE.AmbientLight(0x8f9478,.5));
scene.add(new THREE.HemisphereLight(0xb8a070,0x1a1f16,.35));
const lamp=new THREE.PointLight(0xffb64a,5,17);lamp.position.set(0,2.7,-10);scene.add(lamp);
const emergency=new THREE.PointLight(0xc0602a,.8,9);emergency.position.set(10,2.5,-10);scene.add(emergency);
const bunker=buildBunker(scene);
const alarmLights=buildAlarms(scene);
const selectLights=lightSelector(scene);
addProps(scene);
const firstPerson=createFirstPerson(scene);
const toolWorld=createToolWorld(scene);
const specimenView=createSpecimenView(scene);
function resizeView(){
 const aspect=Math.max(.2,canvas.clientWidth/Math.max(1,canvas.clientHeight));
 const height=aspect>=1?Math.round(384/aspect):384;
 renderer.setSize(Math.max(1,Math.round(height*aspect)),height,false);
 camera.aspect=aspect;camera.updateProjectionMatrix();firstPerson.resize(aspect);
 diegetic?.setSize(canvas.clientWidth,canvas.clientHeight);
}
let diegetic=null;
new ResizeObserver(()=>resizeView()).observe(canvas);resizeView();

// ---------- audio: starts on the first gesture ----------
const audio=new BunkerAudio();
let audioWanted=true;
const showAudio=on=>{$('sound').textContent=on?'AUDIO ON':'AUDIO OFF';$('sound').setAttribute('aria-pressed',String(on));};
const wake=()=>{if(audioWanted)audio.enable().then(showAudio);};
addEventListener('pointerdown',wake,{once:true});addEventListener('keydown',wake,{once:true});
$('sound').onclick=async()=>{const on=await audio.toggle();audioWanted=on;showAudio(on);};

// ---------- session state ----------
let sock=null,code='',myId=null,S=null,me={role:null,state:'ok'},joinSeq=0,autoStart=null,training=false;
let relayState=createRelay('idle'),coolantState=createCoolantState(),tubesState=createTubes('idle'),cameraOpened=false,cameraPuzzle=publicAccessPuzzle('idle');
let toolState={items:[],jobs:{}},toolPlayers=[],toolTarget=null,toolPending=null,toolSent=false,toolFeedbackUntil=0,lastToolSound=0;
let pulseUntil=0,radioUntil=0,noteUntil=0,lastOffer='',lastStepSound=0,shake=0;
const send=m=>{if(sock?.readyState===1)sock.send(JSON.stringify(m));};
const position=new THREE.Vector3(0,0,2);position.vy=0;position.fallStart=0;position.stun=0;
let yaw=0,pitch=0,sensitivity=1;
const note=t=>{$('note').textContent=t;noteUntil=performance.now()+2600;};
const tutorial=createTutorial({send,done:()=>leave()});
const has=id=>Object.values(me.mutations||{}).includes(id);
const SABOTAGE_LABELS={valve:'pump room valve',breaker:'substation breaker',doors:'tunnel blast doors','coax-core':'camera 01 cable','coax-coolant':'camera 02 cable','coax-filters':'camera 03 cable','coax-e-hall':'camera 04 cable','coax-w-hall':'camera 05 cable','coax-pumps':'camera 06 cable'};

// ---------- panels ----------
const keys=new Set();
let dragging=false,lastPointerX=0,lastPointerY=0,holding=null;
function freeMouse(){document.exitPointerLock?.();keys.clear();dragging=false;}
const chess=createChessSafe((puzzle,from,to)=>send({t:'safeSolve',safe:'chess',from,to}),()=>keys.clear());
const sweeper=createSweeper(cells=>send({t:'safeSolve',safe:'sweeper',cells}),()=>keys.clear());
const scope=createScope(guess=>send({t:'safeSolve',safe:'scope',guess}),()=>keys.clear());
const mutation=createMutation(id=>send({t:'mutate',id}),()=>keys.clear());
const ventMap=createVentMap(id=>send({t:'ventExit',id}));
const scif=createScif((line,text)=>send({t:'radio',line,text}),()=>keys.clear());
const coolant=createCoolantTask((key,value)=>{audio.cue('turn');send({t:'coolantSet',...{intake:coolantState.intake,bypass:coolantState.bypass,[key]:value}});},()=>keys.clear());
const facilityPanels=createFacilityPanels(pin=>send({t:'cameraPin',pin}),()=>send({t:'feedFilter'}),()=>keys.clear());
const tubes=createTubeTask((index,value)=>{audio.cue('turn');send({t:'tubeTurn',index,value});},()=>keys.clear());
const relay=createRelayTask(action=>send({t:'relayAction',action:{...action,cycle:relayState.cycle}}),()=>keys.clear());
const blockers=()=>[relay,chess,coolant,facilityPanels,tubes,sweeper,scope,mutation,ventMap,scif].filter(p=>p.isOpen);
const panelOpen=()=>blockers().length>0||!$('pause').hidden||!!machines?.active;
const beat=createBeatBar();
const floorPlan=createFloorPlan(()=>getMode()==='shift'&&!panelOpen());
// Machine panels sit on the machines themselves.
diegetic=createDiegetic();diegetic.setSize(canvas.clientWidth,canvas.clientHeight);
// Tactile machines and sabotage rigs, worked in 3D.
const lastFoley={};
function taskSound(kind,v=1){
 if(kind==='static'||kind==='radio-clear'){audio.loop('static',kind==='static'?v*.1:0);audio.loop('carrier',kind==='radio-clear'?.04:0);return;}
 if(kind==='whine'){audio.loop('whine',v);return;}
 const now=performance.now(),gap={turn:90,tick:45,squeal:240,spark:160}[kind]??60;if(now-(lastFoley[kind]||0)<gap)return;lastFoley[kind]=now;
 audio.cue(kind==='turn'?'creak':kind);
}
const machines=createMachines(scene,{camera,canvas,
 onAnswer:a=>{const m=machines.active;if(m)send({t:'machine',id:m.id,answer:a});},
 onSabAnswer:a=>{const m=machines.active;if(m)send({t:'sabDone',id:m.id,answer:a});},
 onSound:taskSound,onExit:()=>{keys.clear();audio.stopLoops?.();}});
for(const [id,a,w] of [['relay-panel',{x:0,y:1.2,z:-7.5},.95],['coolant-panel',{x:COOLANT_STATION.x,y:COOLANT_STATION.y+1.25,z:COOLANT_STATION.z},.9],['access-panel',{x:-14.75,y:1.45,z:-3.3},.85],['burn-panel',{x:21,y:1.35,z:-7.75},.85],['tube-panel',{x:-20.85,y:1.25,z:-1},.85],['chess-panel',{x:10,y:1.15,z:-13.3},.8],['sweeper-panel',{x:-35,y:1.2,z:-15.7},.8],['scope-panel',{x:40.1,y:1.2,z:-10},.85],['scif-panel',{x:-20.9,y:1.6,z:-1},.95]])diegetic.add(id,()=>a,w);

// ---------- peers ----------
const peerMaterial=new THREE.MeshLambertMaterial({color:0x6d7551});
const tapeMaterial=new THREE.MeshLambertMaterial({color:0x8c8f86});
const thermal=new THREE.MeshBasicMaterial({color:0xe0703a});
const peers=new Map();let peerPrototype=null,peerClips=[];
function preparePeer(mesh){
 const tape=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.5,8,1,true),tapeMaterial);tape.position.y=1.1;tape.visible=false;mesh.add(tape);mesh.userData.tape=tape;
 mesh.traverse(o=>{if(o.isMesh)o.userData.base=o.material;});
 if(!peerClips.length)return mesh;
 const mixer=new THREE.AnimationMixer(mesh),actions=peerClips.map(c=>mixer.clipAction(c));
 const idle=actions.find(a=>/idle/i.test(a.getClip().name))||actions[0],walk=actions.find(a=>/walk/i.test(a.getClip().name));idle?.play();
 mesh.userData.motion={mixer,idle,walk,movingUntil:0,walking:false};
 return mesh;
}
new GLTFLoader().load(new URL('../assets/ozk-v3.glb',import.meta.url).href,gltf=>{
 firstPerson.setModel(gltf);peerClips=gltf.animations;peerPrototype=gltf.scene;
 for(const [id,old] of peers){scene.remove(old);peers.delete(id);}
});
const tmp=new THREE.Vector3();
function updatePeers(players,dt,now){
 const seen=new Set();
 for(const p of players||[]){
  if(p.id===myId||p.state==='dead')continue;seen.add(p.id);
  let mesh=peers.get(p.id);
  if(!mesh){mesh=preparePeer(peerPrototype?cloneSkeleton(peerPrototype):new THREE.Mesh(new THREE.CapsuleGeometry(.35,1,2,6),peerMaterial));scene.add(mesh);peers.set(p.id,mesh);mesh.position.set(p.x,p.y,p.z);}
  let tx=p.x,ty=p.y,tz=p.z,face=p.yaw+Math.PI;
  if(p.hang){tx+=p.hang.dirX*.35;tz+=p.hang.dirZ*.35;ty-=1.3;face=Math.atan2(-p.hang.dirX,-p.hang.dirZ);}
  const dx=tx-mesh.position.x,dz=tz-mesh.position.z,moving=Math.hypot(dx,dz)>.01;
  mesh.position.lerp(tmp.set(tx,ty,tz),Math.min(1,dt*14));
  mesh.rotation.y=moving&&!p.hang?Math.atan2(dx,dz):face;
  const m=mesh.userData.motion;if(m){if(moving)m.movingUntil=now+180;const walking=now<m.movingUntil;if(walking!==m.walking&&m.walk){(walking?m.walk:m.idle).reset().fadeIn(.15).play();(walking?m.idle:m.walk).fadeOut(.15);m.walking=walking;}m.mixer.update(dt);}
  mesh.userData.tape.visible=p.state==='taped';
  // Thermal pits light warm bodies within 10 m.
  const hot=me.role==='specimen'&&has('thermal')&&Math.hypot(p.x-position.x,p.z-position.z)<10;
  if(mesh.userData.hot!==hot){mesh.userData.hot=hot;mesh.traverse(o=>{if(o.isMesh&&o.userData.base)o.material=hot?thermal:o.userData.base;});}
 }
 for(const [id,mesh] of peers)if(!seen.has(id)){scene.remove(mesh);peers.delete(id);}
}
// Specimen senses that reach through walls: vibration comb, echo pulse, scent trail.
const pingTex=(()=>{const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');g.fillStyle='#e0703a';g.fillRect(6,0,4,16);g.fillRect(0,6,16,4);return new THREE.CanvasTexture(c);})();
const pings=Array.from({length:10},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:pingTex,depthTest:false,transparent:true}));s.scale.setScalar(.5);s.visible=false;scene.add(s);return s;});
const trail=Array.from({length:26},()=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({color:0x9a5a2a,transparent:true,opacity:.7}));s.scale.setScalar(.18);s.visible=false;scene.add(s);return s;});
const tracks=new Map();
function updateSenses(players,now){
 for(const s of pings)s.visible=false;for(const s of trail)s.visible=false;
 if(me.role!=='specimen')return;
 let n=0;
 for(const p of players||[]){
  if(p.state==='dead')continue;
  const h=tracks.get(p.id)||[];const lastPoint=h[h.length-1];const moving=lastPoint&&Math.hypot(p.x-lastPoint.x,p.z-lastPoint.z)>.05;
  if(!lastPoint||now-lastPoint.t>400){h.push({x:p.x,z:p.z,y:p.y,t:now});while(h.length&&now-h[0].t>10000)h.shift();tracks.set(p.id,h);}
  const d=Math.hypot(p.x-position.x,p.z-position.z);
  if(n<pings.length&&((has('antennae')&&moving&&d<20)||(now<pulseUntil&&d<16))){pings[n].position.set(p.x,p.y+1.2,p.z);pings[n].visible=true;n++;}
 }
 if(has('scent')){
  const nearest=(players||[]).filter(p=>p.state!=='dead').sort((a,b)=>Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z))[0];
  (tracks.get(nearest?.id)||[]).forEach((q,i)=>{if(trail[i]){trail[i].position.set(q.x,q.y+.1,q.z);trail[i].visible=true;}});
 }
}

// ---------- input ----------
addEventListener('keydown',event=>{
 if(event.target instanceof HTMLInputElement||event.target instanceof HTMLSelectElement)return;
 if(event.code==='Escape'){event.preventDefault();if(machines.active){machines.close();return;}if(blockers().length){for(const p of blockers())p.close();return;}if(getMode()==='shift')setPause($('pause').hidden);else if(getMode()==='howto')showHome();return;}
 if(getMode()!=='shift'||panelOpen())return;
 if(event.code==='Space'){event.preventDefault();if(!event.repeat)beatPress();if(me.state!=='dead')return;}
 if(event.code==='Tab')return;
 if(!event.repeat){
  if(event.code==='KeyG'){event.preventDefault();toolDrop();}
  if(event.code==='KeyF')primary();
  if(event.code==='KeyE'){event.preventDefault();startInteract('KeyE');}
  if(event.code==='KeyT')startInteract('KeyT');
  if(me.role==='specimen'){if(event.code==='KeyQ')send({t:'pulse'});if(event.code==='KeyR')send({t:'mist'});if(event.code==='ShiftLeft'||event.code==='ShiftRight')send({t:'sprint'});}
 }
 keys.add(event.code);
});
addEventListener('keyup',event=>{keys.delete(event.code);if(holding&&holding.key===event.code)stopInteract();});
addEventListener('blur',()=>{keys.clear();stopInteract();});
canvas.addEventListener('pointerdown',event=>{
 if(event.pointerType!=='mouse'||getMode()!=='shift'||panelOpen())return;
 if(document.pointerLockElement===canvas){if(event.button===0)primary();return;}
 try{const r=canvas.requestPointerLock?.();r?.catch?.(()=>{});}catch{}
 dragging=true;lastPointerX=event.clientX;lastPointerY=event.clientY;canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointerup',()=>{dragging=false;});canvas.addEventListener('pointercancel',()=>{dragging=false;});
canvas.addEventListener('pointermove',event=>{
 if(!dragging||document.pointerLockElement===canvas||event.pointerType!=='mouse')return;
 yaw-=(event.clientX-lastPointerX)*.004*sensitivity;pitch=THREE.MathUtils.clamp(pitch-(event.clientY-lastPointerY)*.004*sensitivity,-1.48,1.25);
 lastPointerX=event.clientX;lastPointerY=event.clientY;
});
addEventListener('mousemove',event=>{if(document.pointerLockElement!==canvas)return;yaw-=event.movementX*.0022*sensitivity;pitch=THREE.MathUtils.clamp(pitch-event.movementY*.0022*sensitivity,-1.48,1.25);});
$('sens').oninput=()=>{sensitivity=Number($('sens').value)/5;};
// Touch pads.
let padStrafe=0,padForward=0,touchBreath=false;
const movePad=$('move-pad'),moveThumb=$('move-thumb');
function updateMovePad(event){const b=movePad.getBoundingClientRect();const dx=(event.clientX-(b.left+b.width/2))/(b.width*.38),dy=(event.clientY-(b.top+b.height/2))/(b.height*.38),l=Math.max(1,Math.hypot(dx,dy));padStrafe=dx/l;padForward=-dy/l;moveThumb.style.transform=`translate(${padStrafe*31}px,${-padForward*31}px)`;}
movePad.addEventListener('pointerdown',e=>{e.preventDefault();movePad.setPointerCapture(e.pointerId);updateMovePad(e);});
movePad.addEventListener('pointermove',e=>{if(movePad.hasPointerCapture(e.pointerId))updateMovePad(e);});
const clearMovePad=()=>{padStrafe=padForward=0;moveThumb.style.transform='';};movePad.addEventListener('pointerup',clearMovePad);movePad.addEventListener('pointercancel',clearMovePad);
const lookPad=$('look-pad'),lookThumb=$('look-thumb');let lookX=0,lookY=0;
lookPad.addEventListener('pointerdown',e=>{e.preventDefault();lookPad.setPointerCapture(e.pointerId);lookX=e.clientX;lookY=e.clientY;});
lookPad.addEventListener('pointermove',e=>{if(!lookPad.hasPointerCapture(e.pointerId))return;yaw-=(e.clientX-lookX)*.006*sensitivity;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-lookY)*.006*sensitivity,-1.48,1.25);lookX=e.clientX;lookY=e.clientY;const b=lookPad.getBoundingClientRect();lookThumb.style.transform=`translate(${THREE.MathUtils.clamp(e.clientX-b.left-b.width/2,-31,31)}px,${THREE.MathUtils.clamp(e.clientY-b.top-b.height/2,-31,31)}px)`;});
lookPad.addEventListener('pointerup',()=>{lookThumb.style.transform='';});
$('breath').addEventListener('pointerdown',e=>{e.preventDefault();touchBreath=true;});$('breath').addEventListener('pointerup',()=>{touchBreath=false;});
const act=$('act');
act.addEventListener('pointerdown',e=>{e.preventDefault();if(beat.mode){beatPress();return;}startInteract('touch');});
act.addEventListener('pointerup',()=>{if(holding?.key==='touch')stopInteract();});
$('shove-btn').addEventListener('pointerdown',e=>{e.preventDefault();primary();});

// F / click: engineers shove, the specimen lunges.
function primary(){
 if(getMode()!=='shift'||me.state!=='ok'||panelOpen())return;
 const v=movementVector(yaw,1,0);
 if(me.role==='specimen'){if((me.lunge||0)<=0){send({t:'lunge',dx:v.x,dz:v.z});audio.cue('lunge');}else note(`LUNGE IN ${Math.ceil(me.lunge)}S`);}
 else{send({t:'shove',dx:v.x,dz:v.z});firstPerson.interact();}
}
function beatPress(){
 const hit=beat.press();if(hit===null)return;
 if(beat.mode==='hang'){send({t:'beat',hit});tutorial.beat(hit);}else send({t:'break',hit});
 audio.cue(hit?'turn':'reject');
}

// ---------- interactions ----------
// What pressing E (or T) would do right now, from most to least specific.
function interaction(){
 if(me.state!=='ok'||!S||S.phase!=='shift')return null;
 const p=position,players=S.players||[];
 const close=(r,f)=>players.filter(q=>q.id!==myId&&f(q)&&Math.abs(q.y-p.y)<.9&&Math.hypot(q.x-p.x,q.z-p.z)<r).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
 if(me.role==='specimen'){
  const safe=safeAt(p);
  if(safe&&!me.solved?.includes(safe.id))return {key:'KeyE',label:`E / ${safe.name}`,press:()=>openSafe(safe.id)};
  if(Math.abs(p.y)<.9&&Math.hypot(p.x-LIFT_DOOR.x,p.z-LIFT_DOOR.z)<3.2)return me.stage>=3?{key:'KeyE',label:'HOLD E / PRY THE LIFT DOOR',hold:{kind:'escape'}}:{key:'KeyE',label:'LIFT DOOR / OPEN ALL THREE SAFES FIRST',press:()=>note('THE DOOR WILL NOT MOVE YET')};
  if(Math.hypot(p.x-REACTOR_SMASH.x,p.z-REACTOR_SMASH.z)<1.8)return {key:'KeyE',label:(me.smash||0)>0?`BYPASS TORN / ${Math.ceil(me.smash)}S`:'HOLD E / TEAR THE COOLANT BYPASS (CORE -12)',hold:(me.smash||0)>0?null:{kind:'smash'}};
  if(has('crusher')&&((!S.cameraOpened&&nearStation(p,CAMERA_PANEL,2.2))||(S.sealed&&(Math.hypot(p.x-15.4,p.z+2.5)<2.2||Math.hypot(p.x+15.4,p.z+10.5)<2.2))))return {key:'KeyE',label:'HOLD E / PRY THE DOOR',hold:{kind:'pry'}};
  const v=nearVent(p);if(v)return {key:'KeyE',label:me.canVent?'HOLD E / SLIP INTO THE VENT':'TOO BIG FOR THE VENT',hold:me.canVent?{kind:'vent'}:null};
  return null;
 }
 const hanging=close(1.9,q=>q.state==='hanging');if(hanging)return {key:'KeyE',label:'HOLD E / PULL THEM UP',hold:{kind:'help',target:hanging.id}};
 const taped=close(TAPE.range,q=>q.state==='taped');if(taped)return {key:'KeyE',label:'HOLD E / CUT THE TAPE',hold:{kind:'cut',target:taped.id}};
 if(toolTarget){const t=toolTarget,held=heldTool(toolState,myId);
  if(t.type==='pickup')return {key:'KeyE',label:`E / TAKE ${t.label}`,press:()=>{firstPerson.interact();send({t:'toolPick',id:t.id});}};
  if(t.type==='climb')return {key:'KeyE',label:'E / CLIMB ROPE',press:()=>send({t:'ropeClimb',id:t.id})};
  if(held?.kind===t.tool)return {key:'KeyE',label:`HOLD E / ${t.label}`,tool:t};
  return {key:'KeyE',label:`${t.label} / NEEDS ${TOOL_NAMES[t.tool]}`,press:()=>note('NEEDS '+TOOL_NAMES[t.tool])};
 }
 const sab=nearSabotage(p);
 if(sab){
  const armed=S.armed?.find(a=>a.id===sab.id);
  if(armed)return {key:'KeyE',label:`HOLD E / STOP IT! ${sab.label} (${Math.ceil(armed.left)}S)`,hold:{kind:'defuse',target:sab.id}};
  const broken=sab.id==='valve'?S.valve:sab.id==='breaker'?S.blackout:sab.id==='doors'?S.sealed:S.cut?.includes(sab.camera);
  if(broken&&sab.fixHold)return {key:'KeyE',label:`HOLD E / REPAIR ${sab.label}`,hold:{kind:'fix',target:sab.id}};
  if(me.role==='saboteur'&&!broken)return {key:'KeyE',label:(me.sabotage||0)>0?`${sab.label} / HANDS SHAKING ${Math.ceil(me.sabotage)}S`:`E / SABOTAGE ${sab.label}`,press:(me.sabotage||0)>0?()=>note('NOT YET'):()=>{freeMouse();send({t:'sabStart',id:sab.id});machines.open('rig',sab.id,sabPuzzle(sab.id,S.seed));}};
 }
 const mach=nearMachine(p);
 if(mach){const st=S.machines?.[mach.id];if(st&&st.wait>0)return {key:'KeyE',label:`${mach.label} / SERVICED, READY IN ${Math.ceil(st.wait)}S`,press:()=>note('ALREADY SERVICED')};
  if(st)return {key:'KeyE',label:`E / WORK THE ${mach.label}`,press:()=>{freeMouse();machines.open('machine',mach.id,puzzle(mach.kind,machineSeed(S.seed,mach.id,st.cycle)));}};}
 if(cameraOpened&&nearStation(p,SCIF_DESK,1.6))return {key:'KeyE',label:'E / SCIF CONSOLE',press:()=>{freeMouse();scif.open();}};
 if(p.y< -1&&nearStation(p,SERVICE_LADDER,1.6))return {key:'KeyE',label:'E / CLIMB LADDER',press:()=>send({t:'climb'})};
 if(nearStation(p,CAMERA_PANEL))return {key:'KeyE',label:'E / ACCESS PANEL',press:()=>{freeMouse();facilityPanels.openAccess(cameraPuzzle,cameraOpened);}};
 if(nearStation(p,INCINERATOR))return {key:'KeyE',label:'E / PURGE FILTERS',press:()=>{freeMouse();facilityPanels.openBurn();}};
 if(cameraOpened&&nearStation(p,TUBE_RACK))return {key:'KeyE',label:'E / SEAT VACUUM TUBES',press:()=>{freeMouse();tubes.open();}};
 if(atCoolantStation(p))return {key:'KeyE',label:'E / BALANCE COOLANT',press:()=>{freeMouse();coolant.open();}};
 if(Math.abs(p.y)<.8&&Math.hypot(p.x-CONSOLE_POSITION.x,p.z-CONSOLE_POSITION.z)<=ACTION_RANGE)return {key:'KeyE',label:'E / SERVICE REACTOR CIRCUITS',press:()=>{freeMouse();firstPerson.interact();relay.open(relayState);send({t:'relayOpen'});}};
 const suspect=close(TAPE.range,q=>q.state==='ok');
 if(suspect)return {key:'KeyT',label:'HOLD T / TAPE THEM TO A PIPE (NEEDS TWO)',hold:{kind:'tape',target:suspect.id}};
 return null;
}
let current=null;
function startInteract(key){
 const it=current;if(!it||(key!=='touch'&&it.key!==key))return;
 if(it.press){it.press();return;}
 if(it.tool){firstPerson.interact();send({t:'toolBegin',id:it.tool.id});holding={key,tool:true};return;}
 if(it.hold){send({t:'hold',...it.hold});holding={key,kind:it.hold.kind};}
}
function stopInteract(){if(!holding)return;if(holding.tool){send({t:'toolCancel'});toolPending=null;toolSent=false;}else send({t:'release'});holding=null;}
function openSafe(id){freeMouse();if(id==='chess')chess.open(me.safePuzzle,false);else if(id==='sweeper')sweeper.open(me.sweeper);else scope.open(S.seed);}
function toolDrop(){stopInteract();send({t:'toolDrop'});}
function toolMessage(r){toolFeedbackUntil=performance.now()+3000;$('tool-feedback').textContent=r.message||'';audio.cue(r.ok?'turn':'reject');}
$('tool-drop').onclick=toolDrop;

// ---------- screens and connection ----------
function setPause(open){$('pause').hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));if(open)freeMouse();}
$('menu-toggle').onclick=()=>setPause($('pause').hidden);$('resume').onclick=()=>setPause(false);
$('quit').onclick=()=>{setPause(false);leave();};
$('howto-open').onclick=()=>setMode('howto');$('howto-close').onclick=()=>{if(S)setMode(S.phase==='shift'?'shift':'lobby');else showHome();};$('howto-pause').onclick=()=>{setPause(false);setMode('howto');};
function showHome(){setMode('home');setRole(null);}
const setUrl=u=>window.history.replaceState(null,'',u);
function leave(){
 joinSeq++;sock?.close();sock=null;S=null;me={role:null,state:'ok'};training=false;autoStart=null;lastPhase='';
 tutorial.stop();beat.hide();for(const p of blockers())p.close();tracks.clear();for(const [,m] of peers)scene.remove(m);peers.clear();
 const u=new URL(location.href);u.searchParams.delete('room');setUrl(u);showHome();
}
function join(roomCode,{start=null}={}){
 code=cleanCode(roomCode);if(!code){$('st').textContent='ENTER A ROOM CODE';return;}
 const seq=++joinSeq;sock?.close();autoStart=start;S=null;myId=null;lastPhase='';
 $('st').textContent='CONNECTING TO '+code+'...';
 sock=connectRoom(code,m=>{if(seq===joinSeq)onMessage(m);},status=>{if(seq===joinSeq)$('st').textContent=status;});
 if(!start){const u=new URL(location.href);u.searchParams.set('room',code);setUrl(u);}
}
$('host').onclick=()=>join(newCode());
$('join-form').onsubmit=e=>{e.preventDefault();join($('room').value);};
$('solo').onclick=()=>join('SOLO-'+newCode(),{start:{}});
$('training').onclick=()=>{training=true;join('TRAIN-'+newCode(),{start:{tutorial:true}});};
$('ready').onclick=()=>send({t:'ready'});$('start').onclick=()=>send({t:'start'});$('leave-lobby').onclick=leave;
$('again').onclick=()=>send({t:'again'});$('over-home').onclick=leave;
bindCopy(()=>code);
const params=new URLSearchParams(location.search);
if(params.get('room')){$('room').value=cleanCode(params.get('room'));$('st').textContent='INVITED TO ROOM '+$('room').value+' / PRESS JOIN';}

function onMessage(m){
 if(m.t==='hello'){myId=m.id;relayState=m.relay||relayState;return;}
 if(m.t==='full'){leave();$('st').textContent='THAT ROOM IS FULL';return;}
 if(m.t==='state'){applyState(m);return;}
 if(m.t==='cue'){audio.cue(m.kind);if(m.kind==='vent'){const v=VENTS.reduce((b,v)=>Math.hypot(v.x-m.x,v.z-m.z)<Math.hypot(b.x-m.x,b.z-m.z)?v:b);bunker.stations.rattle(v.id);}if(m.kind==='hit'||m.kind==='shoved')shake=.4;if(m.kind==='pulse')note('A WET CLICKING FILLS THE AIR');return;}
 if(m.t==='note'){note(m.text);return;}
 if(m.t==='radio'){$('radio').hidden=false;$('radio-text').textContent=m.text;radioUntil=performance.now()+9000;audio.cue('radio');return;}
 if(m.t==='pulse'){pulseUntil=performance.now()+2000;return;}
 if(m.t==='ventOpen'){freeMouse();ventMap.open(m.from);return;}
 if(m.t==='safeResult'){
  audio.cue(m.ok?'success':'reject');
  if(m.safe==='chess'){if(m.ok)chess.accept();else chess.reject(m.reason);}
  if(m.safe==='sweeper')sweeper.result(m.ok,m.reason);
  if(m.safe==='scope')scope.result(m.ok,m.reason);
  if(m.ok)setTimeout(()=>{chess.close();sweeper.close();scope.close();},1200);
  return;
 }
 if(m.t==='machineResult'){if(m.ok){audio.cue(m.id==='phone'?'ring':'steam');audio.cue('success');setTimeout(()=>machines.close(),m.id==='phone'?1600:900);}else{audio.cue(m.id==='phone'?'busy':'reject');machines.fail(m.reason);setTimeout(()=>{const a=machines.active;if(a&&S){const st=S.machines?.[a.id];const def=MACHINES.find(d=>d.id===a.id);if(def&&st)machines.open('machine',a.id,puzzle(def.kind,machineSeed(S.seed,a.id,st.cycle)));}},900);}return;}
 if(m.t==='sabResult'){if(m.ok){audio.cue('success');setTimeout(()=>machines.close(),700);}else{machines.fail(m.reason);}return;}
 if(m.t==='toolResult'){toolMessage(m);if(m.pending){toolPending=m.pending;toolSent=false;}else if(m.finished){toolPending=null;toolSent=false;}return;}
 if(m.relay){relayState=m.relay;relay.update(relayState);if(m.t==='relayResult')audio.cue(m.ok?'success':'reject');return;}
 if(m.t==='cameraResult'){audio.cue(m.reason.includes('GRANTED')?'success':'reject');facilityPanels.result(m.reason);return;}
 if(m.t==='burnResult'){audio.cue(m.reason.includes('PROCESSED')||m.reason.includes('CLEARED')?'success':'reject');facilityPanels.burnResult(m.reason);}
}
let lastPhase='';
function applyState(m){
 S=m;const prevState=me.state;me=m.me;myId=me.id;
 toolState=m.tools||toolState;toolPlayers=m.players||[];coolantState=m.coolant||coolantState;cameraOpened=!!m.cameraOpened;cameraPuzzle=m.cameraPuzzle||cameraPuzzle;tubesState=m.tubes||tubesState;
 if(m.phase==='lobby'){
  if(autoStart&&m.host===myId){send({t:'start',...autoStart});autoStart=null;}
  else if(!autoStart&&!training&&!code.startsWith('SOLO')){if(getMode()!=='lobby'&&getMode()!=='howto')setMode('lobby');renderLobby(m,me,code);}
 }
 if(m.phase==='briefing'){if(lastPhase!=='briefing'){setMode('briefing');setRole(me.role);freeMouse();}renderBriefing(me,m.phaseLeft);}
 if(m.phase==='shift'){
  if(lastPhase!=='shift'){setMode('shift');setRole(me.role);position.set(me.x,me.y,me.z);yaw=me.role==='specimen'?Math.PI:0;pitch=0;if(training)tutorial.start();}
  // Server authority: snap when far off or when our state changed underneath us.
  const off=Math.hypot(me.x-position.x,me.y-position.y,me.z-position.z);
  if(me.state!=='dead'&&(off>(me.role==='specimen'?1.2:.8)||me.state!=='ok'||me.inVent||(prevState!=='ok'&&me.state==='ok'))){position.set(me.x,me.y,me.z);position.vy=me.vy||0;position.fallStart=position.y;}
  position.stun=me.stun||0;
  if(me.state==='dead'&&prevState!=='dead'){note('YOU FELL. YOU CAN STILL WATCH.');beat.hide();position.y=Math.max(position.y,0);}
  if(me.offer){const k=me.offer.slot+me.offer.ids.join();if(k!==lastOffer){lastOffer=k;freeMouse();mutation.open(me.offer);}}
  if(me.scif)scif.update(me.scif);else if(scif.isOpen)scif.close();
 }
 if(m.phase==='over'){if(lastPhase!=='over'){setMode('over');freeMouse();beat.hide();tutorial.stop();for(const p of blockers())p.close();}renderOver(m,me);}
 lastPhase=m.phase;
}

// ---------- home-screen flythrough ----------
const tour=new THREE.CatmullRomCurve3([[0,1.7,3],[-8,1.8,-2],[-10,1.6,-10],[-2,1.7,-12],[0,3.5,-17],[5,2.4,-23],[0,1.8,-12],[9,1.7,-8],[13,1.7,-2.5],[20,1.6,-2.5],[27,1.8,-6],[27,1.7,6],[12,1.7,0],[0,1.7,3]].map(v=>new THREE.Vector3(...v)),true);

// ---------- main loop ----------
let last=performance.now(),netTime=0;
function loop(now){
 requestAnimationFrame(loop);
 const dt=Math.min(.1,(now-last)/1000);last=now;
 const mode=getMode(),inShift=mode==='shift'&&S?.phase==='shift';
 const blocked=panelOpen()||!inShift;
 const spec=me.role==='specimen';
 let moving=false;
 if(inShift){
  if(me.state==='ok'&&!me.inVent){
   const forward=blocked?0:Number(keys.has('KeyW'))-Number(keys.has('KeyS'))+padForward;
   const strafe=blocked?0:Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+padStrafe;
   const v=movementVector(yaw,forward,strafe);
   let speed=spec?SPECIMEN.speed:MOVE_SPEED*((me.adrenaline||0)>0?TAPE.adrenalineSpeed:1);
   if(spec)for(const id of Object.values(me.mutations||{}))speed*=PARTS.find(p=>p.id===id)?.speed??1;
   if(spec&&has('leaper')&&(me.sprint||0)>8)speed*=2;
   const next=moveWithCollisions(position,v.x*speed*dt,v.z*speed*dt,solidsForState(cameraOpened,S.sealed),undefined,dt,!spec);
   moving=Math.hypot(next.x-position.x,next.z-position.z)>.001;
   position.x=next.x;position.z=next.z;
   if(!next.ledge){position.y=next.y;position.vy=next.vy;position.fallStart=next.fallStart;position.stun=next.stun;}
  }else if(me.state==='dead'){
   // Ghosts drift freely through the bunker.
   const v=movementVector(yaw,Number(keys.has('KeyW'))-Number(keys.has('KeyS'))+padForward,Number(keys.has('KeyD'))-Number(keys.has('KeyA'))+padStrafe);
   position.x+=v.x*5*dt;position.z+=v.z*5*dt;if(keys.has('Space'))position.y+=3*dt;if(keys.has('ShiftLeft'))position.y-=3*dt;
  }
  netTime+=dt;if(netTime>=.1){netTime=0;send({t:'pos',x:position.x,y:position.y,z:position.z,yaw});}
  // Eye height: the specimen is low and wide; a hanging engineer peers over the lip.
  const eye=me.state==='hanging'?.35:spec?1.25+.1*(me.stage||0):1.65;
  shake=Math.max(0,shake-dt);
  camera.position.set(position.x+(Math.random()-.5)*shake*.15,position.y+eye+(Math.random()-.5)*shake*.15,position.z);
  camera.rotation.set(pitch,yaw,0);
  const fov=spec?84:72;if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix();}
  diegetic.update(dt,camera,camera.position);
  if(machines.active){const a=machines.active,def=MACHINES.find(d=>d.id===a.id);const far=def?nearMachine(position,1.9)?.id!==def.id:!nearSabotage(position,2);if((far&&!window.__noRange)||me.state!=='ok')machines.close();}
 }else{
  // Menus: a slow drift through the bunker behind the screen.
  const t=(now/1000*.006)%1,p=tour.getPointAt(t),q=tour.getPointAt((t+.01)%1);
  camera.position.copy(p);camera.lookAt(q.x,q.y-.15,q.z);position.set(p.x,0,p.z);
  if(camera.fov!==72){camera.fov=72;camera.updateProjectionMatrix();}
 }
 // Photo mode for screenshots: a fixed camera, nothing else on screen.
 if(window.__photo){const ph=window.__photo;camera.position.set(...ph.pos);camera.rotation.set(ph.pitch||0,ph.yaw||0,0);if(camera.fov!==(ph.fov||72)){camera.fov=ph.fov||72;camera.updateProjectionMatrix();}position.set(ph.pos[0],ph.pos[1]-1.65,ph.pos[2]);}
 // Interactions, prompt and hold ring.
 const toolBlocked=blocked||me.state!=='ok'||spec;
 toolWorld.update(toolState,myId,position,toolPlayers,now/1000,camera);
 toolTarget=toolBlocked?null:toolWorld.target(toolState,myId,position,yaw,pitch,cameraOpened);
 if(toolBlocked)toolWorld.target(toolState,myId,position,NaN,NaN,cameraOpened);
 current=inShift&&!blocked?interaction():null;
 if(holding&&!current)stopInteract();
 $('prompt').textContent=current?.label||'';
 act.hidden=!current&&!beat.mode;act.textContent=beat.mode?'TAP ON THE BEAT':current?(current.label.split('/').pop().trim().split(' ').slice(0,2).join(' ')):'ACTION';
 $('shove-btn').hidden=!inShift||me.state!=='ok';$('shove-btn').textContent=spec?'LUNGE':'SHOVE';
 const progress=me.hold?me.hold.progress:toolPending?Math.min(1,(Date.now()-toolPending.started)/toolPending.duration):null;
 $('hold-ring').hidden=progress===null||!inShift;if(progress!==null)$('hold-arc').style.strokeDashoffset=String(100.5*(1-progress));
 if(toolPending&&holding?.tool){
  const job=TOOL_JOBS.find(j=>j.id===toolPending.job);
  if((holding.key==='KeyE'&&!keys.has('KeyE'))||!job||!withinToolReach(position,job,cameraOpened))stopInteract();
  else{if(Date.now()-toolPending.started>=toolPending.duration&&!toolSent){toolSent=true;send({t:'toolFinish'});}if(now-lastToolSound>250){audio.cue('turn');lastToolSound=now;}}
 }
 const held=heldTool(toolState,myId),equip=held?Math.max(0,(held.equippedAt-Date.now())/650):0;
 firstPerson.setHeld(held?.kind||null);
 $('tool-name').textContent=held?(equip>0?'EQUIPPING / ':'')+TOOL_NAMES[held.kind]:'HANDS EMPTY';$('tool-drop').hidden=!held||toolBlocked;
 if(now>toolFeedbackUntil)$('tool-feedback').textContent='';
 // Grip bar: hanging from a lip, or tearing free of tape.
 if(inShift&&me.state==='hanging'&&me.hang){const h=me.hang.hands;beat.show('hang',{interval:HANG.beatMs[2-h],window:HANG.window[2-h]});if(beat.update(now,{title:'HOLD ON',hands:h===2?'TWO HANDS':'ONE HAND / SLIPPING',value:me.hang.score,help:'SPACE / TAP ON THE BEAT. SOMEONE CAN HOLD E TO PULL YOU UP.'}))audio.cue('beat');}
 else if(inShift&&me.state==='taped'&&me.taped){beat.show('tape',{interval:560,window:.16});if(beat.update(now,{title:'TAPED TO A PIPE',hands:`TEAR ${me.taped.hits}/${TAPE.breakHits} / FREE IN ${Math.ceil(me.taped.left)}S`,value:me.taped.hits/TAPE.breakHits*100,help:'SPACE ON THE BEAT TO TEAR THE SEAM. A MISS LOSES ONE.'}))audio.cue('beat');}
 else if(beat.mode)beat.hide();
 // World.
 const st=S||{temp:START_TEMP,pressure:20,blackout:false,cut:[],valve:false,sealed:false};
 const temp=st.temp,pressure=st.pressure,blackout=!!st.blackout;
 bunker.facility.setState(st);bunker.stations.update(now,st);
 if(inShift)machines.update(dt,now,st);
 const specimen=inShift||mode==='over'?st.specimen:null;
 specimenView.update(specimen,{dt,now,self:spec,surge:st.surge});specimenView.mist(st.mist,now);
 updatePeers(inShift||mode==='over'?st.players:[],dt,now);updateSenses(st.players,now);
 bunker.update(dt,temp,pressure,blackout,false,cameraOpened,tubesState.powered,coolantState,{console:st.console,liftOpen:st.outcome?.kind==='escape'?1:0,alarm:(specimen?.stage||0)>=3});
 const alarm=alarmState(temp,pressure,blackout,coolantState.filterReady,false);alarmLights.update(now/1000,alarm);$('alarm-status').textContent=alarm.label;
 // Danger: meltdown, or something moving close by. Cyan always means one of these.
 let near=0;
 if(specimen&&!specimen.inVent&&!spec){const d=Math.hypot(specimen.x-position.x,specimen.z-position.z);near=Math.max(0,1-d/9)*(specimen.still<700?1:.35);
  if(specimen.still<700&&d<16&&now-lastStepSound>480){lastStepSound=now;audio.thud(Math.max(0,1-d/16),THREE.MathUtils.clamp(Math.sin(Math.atan2(specimen.x-position.x,specimen.z-position.z)-yaw-Math.PI),-1,1));}}
 const danger=Math.max(0,(temp-80)/20,near*.8,st.surge?.5:0);
 audio.update(dt,{moving,temp,pressure,position:inShift?position:camera.position,alarm,near,holdingBreath:keys.has('KeyC')||touchBreath});
 $('vignette').style.opacity=String(Math.min(.85,(me.state==='hanging'?.6:0)+((me.adrenaline||0)>0?.5:0)+near*.3));
 lamp.intensity=blackout?.2:5;emergency.intensity=blackout?1.7:.8;
 // HUD.
 if(inShift){
  const tl=st.tLeft??SHIFT_SECONDS;$('clock').textContent=`${Math.floor(tl/60)}:${String(Math.floor(tl%60)).padStart(2,'0')}`;
  $('temp').textContent=`${temp.toFixed(0)}%`;$('corebar').style.width=`${temp}%`;$('psibar').style.width=`${pressure}%`;$('pressure').textContent=`${pressure.toFixed(0)}%`;
  $('role').textContent=me.state==='dead'?'GHOST':{crew:'ENGINEER',saboteur:'SABOTEUR',specimen:'SPECIMEN-09'}[me.role]||'';
  $('radio-line').textContent=me.role&&!spec?`LINE ${me.line} / ${me.callsign}`:'';
  $('event').textContent=st.event||'';
  const warns=(st.armed||[]);$('warning').hidden=!warns.length||spec;if(warns.length){const w=warns[0];const lab=(SABOTAGE_LABELS[w.id]||w.id).toUpperCase();$('warning').textContent=`⚠ SABOTAGE IN PROGRESS / ${lab} / ${Math.ceil(w.left)}S / GET THERE, HOLD E`;}
  renderObjectives(st,me,held?.kind==='wrench');
  $('spec-hud').hidden=!spec;if(spec)renderSpecimen(me,me.mutations);
  $('hint').textContent=spec?'WASD MOVE / MOUSE LOOK / CLICK OR F LUNGE / E SAFES, VENTS, LIFT / TAB MAP':me.state==='dead'?'GHOST / WASD DRIFT / SPACE UP / SHIFT DOWN':'WASD MOVE / CLICK + MOUSE LOOK / E USE / F SHOVE / T TAPE / TAB MAP / ESC MENU';
  floorPlan.update(position,yaw,now);
  canvas.style.filter=spec?(me.stage===0&&!has('thermal')?'blur(1.4px) saturate(.5)':me.stage<2?'blur(.6px)':''):me.state==='dead'?'grayscale(.8)':'';
  if(training)tutorial.update({position,yaw,state:st,me,held:held?.kind});
 }else canvas.style.filter='';
 if(now>radioUntil)$('radio').hidden=true;if(now>noteUntil)$('note').textContent='';
 coolant.update(coolantState);if(coolant.isOpen&&!atCoolantStation(position))coolant.close();
 facilityPanels.update(coolantState);tubes.update(tubesState);relay.update(relayState);
 if(relay.isOpen&&Math.hypot(position.x-CONSOLE_POSITION.x,position.z-CONSOLE_POSITION.z)>ACTION_RANGE)relay.close();
 if(facilityPanels.isOpen&&!nearStation(position,facilityPanels.mode==='access'?CAMERA_PANEL:INCINERATOR))facilityPanels.close();
 if(tubes.isOpen&&!nearStation(position,TUBE_RACK))tubes.close();
 firstPerson.update(dt,{position,yaw,pitch,moving,toolUse:toolPending?.5:0,equipping:equip,holdingBreath:keys.has('KeyC')||touchBreath,blackout,menuOpen:!inShift||panelOpen()||spec||me.state!=='ok'});
 bunker.renderFeeds(renderer,now,tubesState.powered,position,selectLights,{before:()=>specimenView.beginFeed(),after:()=>specimenView.endFeed()});
 selectLights(camera.position);
 ps1.render(scene,camera,{danger,blackout,time:now/1000},()=>{if(inShift&&!spec&&me.state==='ok')firstPerson.render(renderer);});
 diegetic.render(camera);
 // Dev screenshot capture: copy this frame, upscaled with hard pixels, to the dev server.
 if(window.__capture&&now>(window.__captureAfter||0)){const name=window.__capture;window.__capture=null;const up=document.createElement('canvas');up.width=canvas.width*3;up.height=canvas.height*3;const g=up.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(canvas,0,0,up.width,up.height);fetch('/__shot?name='+name,{method:'POST',body:up.toDataURL('image/png')}).then(()=>{window.__captured=name;});}
}
showHome();
requestAnimationFrame(loop);
// Debug handle for automated playtests.
window.__rc={camera,get machines(){return machines;},puzzle,sabPuzzle,machineSeed,position,get yaw(){return yaw;},set yaw(v){yaw=v;},get pitch(){return pitch;},set pitch(v){pitch=v;},get state(){return S;},get me(){return me;},join,send,setMode};
