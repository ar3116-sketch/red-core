import {createToolState,heldTool,TOOL_NAMES,pickTool,dropTool,beginToolJob,finishToolJob,ropeDestination,withinToolReach,TOOL_JOBS} from '../shared/tool-system.js';
import {createToolWorld} from './tool-world.js';
import {createRelay,refreshRelay,relayAction} from '../shared/relay-task.js';
import {createRelayTask} from './relay-task.js';
import {lightSelector} from './static-batch.js';
import {alarmState} from '../shared/alarms.js';
import {buildAlarms} from './alarms.js';
import {createFacilityPanels} from './facility-panels.js';
import {createTubeTask} from './tube-task.js';
import {createTubes,turnTube,TUBE_RACK} from '../shared/tubes.js';
import {CAMERA_PANEL,INCINERATOR,SERVICE_LADDER,nearStation,accessPuzzle,publicAccessPuzzle,feedFilter} from '../shared/facility.js';
import {createCoolantTask} from './coolant-task.js';
import {createCoolantState,atCoolantStation,setCoolant,updateCoolant} from '../shared/coolant.js';
import { CHESS_PUZZLES, SAFE_POSITION, SAFE_RANGE, tryMate } from '../shared/chess-safe.js';
import { createChessSafe } from './chess-safe.js';
import { createFloorPlan } from './floor-plan.js';
import { moveWithCollisions,solidsForState } from '../shared/world.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import {
  ACTION_RANGE, CONSOLE_POSITION, DRIFT_PER_SEC, MOVE_SPEED,
  SHIFT_SECONDS, START_TEMP
} from '../shared/constants.js';
import { connectRoom } from './net.js';
import { buildBunker } from './bunker.js';
import { BunkerAudio } from './audio.js';
import { addProps } from './props.js';
import { createFirstPerson } from './first-person.js';
import { movementVector } from './movement.js';

const canvas = document.getElementById('c');
const floorPlan = createFloorPlan();
let menuOpen = false;
function setMenu(open) {
 menuOpen = open;
 document.getElementById('join').hidden = !open;
 document.getElementById('menu-toggle').setAttribute('aria-expanded', String(open));
 if(open) { document.exitPointerLock?.(); keys.clear(); }
}
document.getElementById('menu-toggle').onclick = () => setMenu(!menuOpen);
document.getElementById('menu-close').onclick = () => setMenu(false);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(1);
renderer.setSize(320, 240, false);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080d0a);
scene.fog = new THREE.Fog(0x080d0a, 7, 46);
const camera = new THREE.PerspectiveCamera(72, 4 / 3, 0.1, 80);
camera.rotation.order = 'YXZ';
scene.add(new THREE.AmbientLight(0x819478, .32));
const lamp = new THREE.PointLight(0xffb64a, 5, 17);
lamp.position.set(0, 2.7, -10);
scene.add(lamp);
const emergency = new THREE.PointLight(0x19d4db, 0.8, 9);
emergency.position.set(10, 2.5, -10);
scene.add(emergency);

const { update: updateBunker,renderFeeds } = buildBunker(scene);
const alarmLights=buildAlarms(scene);
const selectLights=lightSelector(scene);
addProps(scene);
const firstPerson = createFirstPerson(scene);
const toolWorld=createToolWorld(scene);
function resizeView(){
 const aspect=Math.max(.2,canvas.clientWidth/Math.max(1,canvas.clientHeight));
 const height=aspect>=1?Math.round(384/aspect):384;
 renderer.setSize(Math.max(1,Math.round(height*aspect)),height,false);
 camera.aspect=aspect;camera.updateProjectionMatrix();firstPerson.resize(aspect);
}
new ResizeObserver(resizeView).observe(canvas);resizeView();
const audio = new BunkerAudio();
const soundButton = document.getElementById('sound');
soundButton.addEventListener('click', async () => {
  const enabled = await audio.toggle();
  soundButton.textContent = enabled ? 'AUDIO ON' : 'AUDIO OFF';
  soundButton.setAttribute('aria-pressed', String(enabled));
});

const peerMaterial = new THREE.MeshLambertMaterial({ color: 0x6d7551 });
const peers = new Map();
let peerPrototype = null;
let peerClips = [];
function preparePeer(mesh) {
  if (!peerClips.length) return mesh;
  const mixer = new THREE.AnimationMixer(mesh);
  const actions = peerClips.map(clip => mixer.clipAction(clip));
  const idle = actions.find(a => /idle/i.test(a.getClip().name)) || actions[0];
  const walk = actions.find(a => /walk/i.test(a.getClip().name));
  idle?.play();
  mesh.userData.motion = { mixer, idle, walk, movingUntil: 0, walking: false };
  return mesh;
}
new GLTFLoader().load(new URL('../assets/ozk-v3.glb', import.meta.url).href, gltf => {
  firstPerson.setModel(gltf);
  peerClips = gltf.animations;
  peerPrototype = gltf.scene;
  for (const [id, oldMesh] of peers) {
    const replacement = preparePeer(cloneSkeleton(peerPrototype));
    replacement.position.copy(oldMesh.position);
    replacement.position.y -= 1;
    scene.remove(oldMesh);
    scene.add(replacement);
    peers.set(id, replacement);
  }
});
function updatePeers(players) {
  const seen = new Set();
  for (const p of players || []) {
    if (p.id === myId) {
      if (Math.hypot(p.x - position.x, (p.y??0)-position.y, p.z - position.z) > 0.8) {position.set(p.x, p.y??0, p.z);position.vy=p.vy??0;position.stun=p.stun??0;position.fallStart=position.y;}
      continue;
    }
    seen.add(p.id);
    let mesh = peers.get(p.id);
    if (!mesh) {
      mesh = peerPrototype ? preparePeer(cloneSkeleton(peerPrototype)) : new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 1, 2, 6), peerMaterial);
      scene.add(mesh);
      peers.set(p.id, mesh);
    }
    const dx = p.x - mesh.position.x, dz = p.z - mesh.position.z;
    if (Math.hypot(dx,dz) > .015 && mesh.userData.motion) {
      mesh.rotation.y = Math.atan2(dx,dz);
      mesh.userData.motion.movingUntil = performance.now() + 180;
    }
    mesh.position.set(p.x, (p.y??0)+(peerPrototype ? 0 : 1), p.z);
  }
  for (const [id, mesh] of peers) if (!seen.has(id)) { scene.remove(mesh); peers.delete(id); }
}

const position = new THREE.Vector3(0, 0, 2);
let yaw = 0, pitch = 0;
const keys = new Set();
addEventListener('keydown', event => {
  if(relay.isOpen){if(event.code==='Escape'){event.preventDefault();relay.close();}return;}
  if(facilityPanels.isOpen||tubes.isOpen){if(event.code==='Escape'){event.preventDefault();facilityPanels.close();tubes.close();}return;}
  if(coolant.isOpen&&event.code==='Escape'){event.preventDefault();coolant.close();return;}
  if(event.target instanceof HTMLInputElement) return;
  if(coolant.isOpen){if(event.code==='Escape'){event.preventDefault();coolant.close();}return;}
  if(chess.isOpen){if(event.code==='Escape'){event.preventDefault();chess.close();}return;}
  if(event.code === 'KeyM' || event.code === 'Escape') { if(!event.repeat) setMenu(!menuOpen); return; }
  if(menuOpen) return;
  if(event.code==='KeyG'&&!event.repeat){event.preventDefault();toolDrop();return;}
  if(event.code==='KeyF'&&!event.repeat&&sock?.readyState===1){const v=movementVector(yaw,1,0);sock.send(JSON.stringify({t:'shove',dx:v.x,dz:v.z}));}
  keys.add(event.code);
  if (event.code === 'KeyE' && !event.repeat){event.preventDefault();act();}
});
addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());
let dragging = false, lastPointerX = 0, lastPointerY = 0;
canvas.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'mouse') return;
  dragging = true;
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener('pointerup', () => { dragging = false; });
canvas.addEventListener('pointercancel', () => { dragging = false; });
canvas.addEventListener('dblclick', () => { canvas.requestPointerLock?.(); });
canvas.addEventListener('pointermove', event => {
  if (!dragging || document.pointerLockElement === canvas || event.pointerType !== 'mouse') return;
  yaw -= (event.clientX - lastPointerX) * .004;
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lastPointerY) * .004, -1.48, 1.25);
  lastPointerX = event.clientX;
  lastPointerY = event.clientY;
});
addEventListener('mousemove', event => {
  if (document.pointerLockElement !== canvas) return;
  yaw -= event.movementX * 0.0025;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0025, -1.48, 1.25);
});
let padStrafe = 0, padForward = 0;
const movePad = document.getElementById('move-pad');
const moveThumb = document.getElementById('move-thumb');
function updateMovePad(event) {
  const bounds = movePad.getBoundingClientRect();
  const dx = (event.clientX - (bounds.left + bounds.width / 2)) / (bounds.width * .38);
  const dy = (event.clientY - (bounds.top + bounds.height / 2)) / (bounds.height * .38);
  const length = Math.max(1, Math.hypot(dx, dy));
  padStrafe = dx / length;
  padForward = -dy / length;
  moveThumb.style.transform = `translate(${padStrafe * 31}px, ${-padForward * 31}px)`;
}
movePad.addEventListener('pointerdown', event => { event.preventDefault(); movePad.setPointerCapture(event.pointerId); updateMovePad(event); });
movePad.addEventListener('pointermove', event => { if (movePad.hasPointerCapture(event.pointerId)) updateMovePad(event); });
function clearMovePad() { padStrafe = padForward = 0; moveThumb.style.transform = ''; }
movePad.addEventListener('pointerup', clearMovePad);
movePad.addEventListener('pointercancel', clearMovePad);
const lookPad = document.getElementById('look-pad');
const lookThumb = document.getElementById('look-thumb');
const breathButton = document.getElementById('breath');
let touchBreath = false;
breathButton.addEventListener('pointerdown', event => { event.preventDefault(); breathButton.setPointerCapture(event.pointerId); touchBreath = true; });
breathButton.addEventListener('pointerup', () => { touchBreath = false; });
breathButton.addEventListener('pointercancel', () => { touchBreath = false; });
let lookX = 0, lookY = 0;
lookPad.addEventListener('pointerdown', event => { event.preventDefault(); lookPad.setPointerCapture(event.pointerId); lookX = event.clientX; lookY = event.clientY; });
lookPad.addEventListener('pointermove', event => {
  if (!lookPad.hasPointerCapture(event.pointerId)) return;
  yaw -= (event.clientX - lookX) * .006;
  pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lookY) * .006, -1.48, 1.25);
  lookX = event.clientX; lookY = event.clientY;
  const bounds = lookPad.getBoundingClientRect();
  lookThumb.style.transform = `translate(${THREE.MathUtils.clamp(event.clientX - bounds.left - bounds.width / 2, -31, 31)}px, ${THREE.MathUtils.clamp(event.clientY - bounds.top - bounds.height / 2, -31, 31)}px)`;
});
lookPad.addEventListener('pointerup', () => { lookThumb.style.transform = ''; });
lookPad.addEventListener('pointercancel', () => { lookThumb.style.transform = ''; });

let tLeft = SHIFT_SECONDS, temp = START_TEMP, pressure = 20, role = 'crew', myId = null, sock = null, serverLive = false, soloStarted = false, outcome = null;
let joinSequence = 0;
const statusEl = document.getElementById('st');
const roleEl = document.getElementById('role');
const promptEl = document.getElementById('prompt');
const resultEl = document.getElementById('result');
const actionButton = document.getElementById('act');
const eventEl = document.getElementById('event');
const pressureEl = document.getElementById('pressure');
let blackout = false;
let containmentUntil=0,lastSafeAlarm=false;
let safeOpened=false, safePuzzle=CHESS_PUZZLES[0].id;
const chess=createChessSafe((puzzle,from,to)=>{
 if(sock?.readyState===1){sock.send(JSON.stringify({t:'safeSolve',puzzle,from,to}));}
 else if(tryMate(puzzle,from,to).ok){safeOpened=true;chess.accept();eventEl.textContent='CONTAINMENT: MUTAGEN SAFE OPEN';}
},()=>keys.clear());
let coolantState=createCoolantState();
const coolant=createCoolantTask((key,value)=>{
 audio.cue('turn');
 const next={intake:coolantState.intake,bypass:coolantState.bypass,[key]:value};
 if(sock?.readyState===1)sock.send(JSON.stringify({t:'coolantSet',...next}));
 else setCoolant(coolantState,next.intake,next.bypass);
},()=>keys.clear());
let facilitySeed=String(Date.now()),cameraOpened=false,cameraPuzzle=publicAccessPuzzle(facilitySeed),tubesState=createTubes(facilitySeed),lastPinAttempt=0;
const facilityPanels=createFacilityPanels(pin=>{
 if(sock?.readyState===1){sock.send(JSON.stringify({t:'cameraPin',pin}));return;}
 if(Date.now()-lastPinAttempt<1500){facilityPanels.result('WAIT FOR KEYPAD RESET');return;}
 lastPinAttempt=Date.now();cameraOpened=pin===accessPuzzle(facilitySeed).pin||cameraOpened;
 audio.cue(cameraOpened?'success':'reject');
 facilityPanels.result(cameraOpened?'ACCESS GRANTED / DOOR RELEASED':'WRONG ORDER / CHECK THE CLUES');
},()=>{
 if(sock?.readyState===1){sock.send(JSON.stringify({t:'feedFilter'}));return;}
 const result=feedFilter(coolantState,Date.now());audio.cue(result.ok?'success':'reject');facilityPanels.burnResult(result.reason);
},()=>keys.clear());
const tubes=createTubeTask((index,value)=>{
 audio.cue('turn');
 if(sock?.readyState===1)sock.send(JSON.stringify({t:'tubeTurn',index,value}));
 else turnTube(tubesState,index,value);
},()=>keys.clear());
function resetFacility(){cancelToolUse();toolState=createToolState();toolPlayers=[];toolTarget=null;relay.close();relayState=createRelay(String(Date.now()));facilityPanels.close();tubes.close();facilitySeed=String(Date.now());cameraOpened=false;cameraPuzzle=publicAccessPuzzle(facilitySeed);tubesState=createTubes(facilitySeed);position.vy=0;position.stun=0;position.fallStart=0;}
let relayState=createRelay(String(Date.now())),relayPollAt=0;
const relay=createRelayTask(action=>{
 const packet={...action,cycle:relayState.cycle};
 if(sock?.readyState===1){sock.send(JSON.stringify({t:'relayAction',action:packet}));return;}
 const result=relayAction(relayState,packet,Date.now());audio.cue(result.ok?'success':'reject');
 if(result.completed){temp=Math.max(0,Math.min(100,temp+(role==='saboteur'?5:-6)));eventEl.textContent=role==='saboteur'?'REACTOR LOAD INCREASED / CORE +5':'REACTOR CIRCUIT SERVICED / CORE -6';}
 relay.update(relayState);
},()=>keys.clear());
let toolState=createToolState(),toolTarget=null,toolPending=null,toolPlayers=[],touchUse=false,toolSent=false,toolClick=false,lastToolSound=0,toolFeedbackUntil=0;
const toolIdentity=()=>serverLive?myId:'local';
function cancelToolUse(){if(toolPending&&sock?.readyState===1)sock.send(JSON.stringify({t:'toolCancel'}));toolPending=null;toolSent=false;}
function toolMessage(result){toolFeedbackUntil=performance.now()+3000;document.getElementById('tool-feedback').textContent=result.message||'';audio.cue(result.ok?'turn':'reject');}
function toolDrop(){cancelToolUse();if(sock?.readyState===1)sock.send(JSON.stringify({t:'toolDrop'}));else toolMessage(dropTool(toolState,toolIdentity(),position,cameraOpened));}
function toolAct(){
 if(!toolTarget||outcome)return false;const target=toolTarget;firstPerson.interact();
 if(sock?.readyState===1){sock.send(JSON.stringify({t:target.type==='pickup'?'toolPick':target.type==='climb'?'ropeClimb':'toolBegin',id:target.id}));return true;}
 if(target.type==='pickup')toolMessage(pickTool(toolState,toolIdentity(),position,target.id,Date.now(),cameraOpened));
 else if(target.type==='climb'){const dest=ropeDestination(toolState,position,target.id);if(dest){position.set(dest.x,dest.y,dest.z);position.vy=0;position.stun=0;position.fallStart=dest.y;audio.cue('turn');}}
 else{const result=beginToolJob(toolState,toolIdentity(),position,target.id,Date.now(),cameraOpened);toolMessage(result);if(result.ok){toolPending=result;toolSent=false;}}
 return true;
}
function act() {
  if(menuOpen||relay.isOpen||chess.isOpen||coolant.isOpen||facilityPanels.isOpen||tubes.isOpen)return;
  if(toolAct())return;
  if(!outcome&&nearStation(position,SERVICE_LADDER,1.6)&&position.y< -1){
    if(sock?.readyState===1)sock.send(JSON.stringify({t:'climb'}));else{position.set(17.9,0,-11.6);position.vy=0;position.fallStart=0;}return;
  }
  if(!outcome&&(nearStation(position,CAMERA_PANEL)||nearStation(position,INCINERATOR)||nearStation(position,TUBE_RACK))){
    document.exitPointerLock?.();keys.clear();dragging=false;
    if(nearStation(position,CAMERA_PANEL))facilityPanels.openAccess(cameraPuzzle,cameraOpened);
    else if(nearStation(position,INCINERATOR))facilityPanels.openBurn();
    else if(cameraOpened)tubes.open();return;
  }
  if(!outcome&&atCoolantStation(position)){document.exitPointerLock?.();keys.clear();dragging=false;coolant.open();return;}
  if(!outcome && Math.hypot(position.x-SAFE_POSITION.x,position.z-SAFE_POSITION.z)<=SAFE_RANGE) {
    if(safeOpened){eventEl.textContent='SAFE ALREADY UNLOCKED';return;}
    document.exitPointerLock?.();keys.clear();dragging=false;
    chess.open(safePuzzle,false);return;
  }
  if(outcome||Math.abs(position.y)>.8||Math.hypot(position.x-CONSOLE_POSITION.x,position.z-CONSOLE_POSITION.z)>ACTION_RANGE)return;
  document.exitPointerLock?.();keys.clear();dragging=false;firstPerson.interact();
  if(!serverLive)refreshRelay(relayState,Date.now());relay.open(relayState);
  if(sock?.readyState===1)sock.send(JSON.stringify({t:'relayOpen'}));
}
actionButton.addEventListener('pointerdown',e=>{if(toolTarget){toolClick=true;touchUse=true;actionButton.setPointerCapture(e.pointerId);act();}});
actionButton.addEventListener('pointerup',()=>{touchUse=false;});actionButton.addEventListener('pointercancel',()=>{touchUse=false;toolClick=false;});
actionButton.addEventListener('click',()=>{if(toolClick){toolClick=false;return;}act();});
document.getElementById('tool-drop').onclick=toolDrop;
document.getElementById('solo').addEventListener('click', () => {
  setMenu(false);resetFacility();
  chess.close();coolant.close();coolantState=createCoolantState(String(Date.now()));safeOpened=false;safePuzzle=CHESS_PUZZLES[Math.floor(Math.random()*CHESS_PUZZLES.length)].id;
  joinSequence++;
  sock?.close();
  sock = null;
  serverLive = false;
  soloStarted = true;
  myId = null;
  tLeft = SHIFT_SECONDS;
  temp = START_TEMP;
  pressure = 20;
  outcome = null;
  blackout = false;
  role = 'crew';
  roleEl.textContent = 'ENGINEER';
  statusEl.textContent = 'SOLO SHIFT ACTIVE';
  eventEl.textContent = '';
  position.set(0, 0, 2);
  for (const mesh of peers.values()) scene.remove(mesh);
  peers.clear();
});
function startPractice(x,y,z,nextYaw,label){
  setMenu(false);resetFacility();chess.close();coolant.close();coolantState=createCoolantState(String(Date.now()));joinSequence++;sock?.close();sock=null;serverLive=false;soloStarted=false;myId=null;
  tLeft=SHIFT_SECONDS;temp=START_TEMP;pressure=20;outcome=null;blackout=false;role='crew';roleEl.textContent='ENGINEER';
  statusEl.textContent=label;eventEl.textContent=label+' / TIMER OFF';
  position.set(x,y,z);yaw=nextYaw;pitch=-.15;keys.clear();
  for(const mesh of peers.values())scene.remove(mesh);peers.clear();
}
document.getElementById('practice-tools').onclick=()=>{startPractice(-10.5,0,1.25,Math.PI,'WORKSHOP TOOL PRACTICE');pitch=-.43;};
document.getElementById('practice-relay').onclick=()=>{startPractice(0,0,-6.3,0,'REACTOR TASK PRACTICE');relay.open(relayState);};
document.getElementById('practice-tubes').onclick=()=>{startPractice(-20,0,.7,0,'TUBE RACK PRACTICE');cameraOpened=true;tubes.open();};
document.getElementById('practice-coolant').onclick=()=>{startPractice(-6,-3.2,27,Math.PI,'COOLANT PRACTICE');coolantState.filterReady=true;coolant.open();};
document.getElementById('explore-reactor').addEventListener('click',()=>{startPractice(0,0,-17.45,0,'REACTOR HALL TOUR');pitch=-.5;});
document.getElementById('explore-sewer').addEventListener('click',()=>startPractice(0,0,7.2,Math.PI,'EXPLORE SEWER'));
document.getElementById('practice-cameras').addEventListener('click',()=>startPractice(-13.5,0,-3.3,Math.PI/2,'CAMERA ROOM PRACTICE'));
document.getElementById('practice-incinerator').addEventListener('click',()=>startPractice(21,0,-9.5,Math.PI,'INCINERATOR PRACTICE'));
document.getElementById('practice-safe').addEventListener('click',()=>{
  setMenu(false);resetFacility();chess.close();coolant.close();coolantState=createCoolantState(String(Date.now()));joinSequence++;sock?.close();sock=null;serverLive=false;soloStarted=false;myId=null;
  safeOpened=false;safePuzzle=CHESS_PUZZLES[Math.floor(Math.random()*CHESS_PUZZLES.length)].id;
  tLeft=SHIFT_SECONDS;temp=START_TEMP;pressure=20;outcome=null;blackout=false;role='crew';roleEl.textContent='ENGINEER';
  statusEl.textContent='SAFE PRACTICE';eventEl.textContent='SAFE PRACTICE / TIMER OFF';
  position.set(SAFE_POSITION.x,0,SAFE_POSITION.z+1.8);yaw=0;pitch=-.28;keys.clear();
  for(const mesh of peers.values())scene.remove(mesh);peers.clear();
  document.exitPointerLock?.();chess.open(safePuzzle,false);
});
document.getElementById('go').addEventListener('click', () => {
  setMenu(false);resetFacility();
  chess.close();coolant.close();coolantState=createCoolantState(String(Date.now()));safeOpened=false;
  const joinId = ++joinSequence;
  sock?.close();
  serverLive = false;
  soloStarted = false;
  myId = null;
  outcome = null;
  for (const mesh of peers.values()) scene.remove(mesh);
  peers.clear();
  const code = document.getElementById('room').value;
  sock = connectRoom(code, message => {
    if (joinId !== joinSequence) return;
    if(message.t==='safeResult'){if(message.ok){safeOpened=true;chess.accept();}else chess.reject(message.reason);}
    if (message.t === 'hello') {
      myId = message.id;
      role = message.role;
      roleEl.textContent = role === 'saboteur' ? 'SABOTEUR' : 'ENGINEER';
    }
    if(message.t==='toolResult'){toolMessage(message);if(message.pending){toolPending=message.pending;toolSent=false;}else if(message.finished){toolPending=null;toolSent=false;}}
    if(message.relay){relayState=message.relay;relay.update(relayState);if(message.t==='relayResult')audio.cue(message.ok?'success':'reject');}
    if(message.t==='cameraResult'){audio.cue(message.reason.includes('GRANTED')?'success':'reject');facilityPanels.result(message.reason);}
    if(message.t==='burnResult'){audio.cue(message.reason.includes('PROCESSED')||message.reason.includes('CLEARED')?'success':'reject');facilityPanels.burnResult(message.reason);}
    if (message.t === 'state' || message.t === 'hello') {
      serverLive = true;
      if(message.tools)toolState=message.tools;toolPlayers=message.players||[];
      if(message.coolant)coolantState=message.coolant;
      cameraOpened=!!message.cameraOpened;if(message.cameraPuzzle)cameraPuzzle=message.cameraPuzzle;if(message.tubes)tubesState=message.tubes;
      safeOpened=!!message.safeOpened;safePuzzle=message.safePuzzle||safePuzzle;
      tLeft = message.tLeft;
      temp = message.temp;
      pressure = message.pressure;
      blackout = message.blackout;
      eventEl.textContent = message.event || '';
      outcome = message.outcome;
      updatePeers(message.players);
    }
  }, status => { if (joinId === joinSequence) statusEl.textContent = status; });
});

let last = performance.now(), fpsTime = 0, frames = 0, netTime = 0;
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  floorPlan.update(position,yaw,now);
  for (const mesh of peers.values()) {
    const m = mesh.userData.motion;
    if (!m) continue;
    const walking = now < m.movingUntil;
    if (walking !== m.walking && m.walk) {
      const next = walking ? m.walk : m.idle, previous = walking ? m.idle : m.walk;
      next?.reset().fadeIn(.15).play(); previous?.fadeOut(.15); m.walking = walking;
    }
    m.mixer.update(dt);
  }
  const forward = (menuOpen || relay.isOpen || chess.isOpen || coolant.isOpen || facilityPanels.isOpen || tubes.isOpen) ? 0 : Number(keys.has('KeyW')) - Number(keys.has('KeyS')) + padForward;
  const strafe = (menuOpen || relay.isOpen || chess.isOpen || coolant.isOpen || facilityPanels.isOpen || tubes.isOpen) ? 0 : Number(keys.has('KeyD')) - Number(keys.has('KeyA')) + padStrafe;
  const motion = movementVector(yaw, forward, strafe);
  const nextPosition = moveWithCollisions(position, motion.x * MOVE_SPEED * dt, motion.z * MOVE_SPEED * dt,solidsForState(cameraOpened),undefined,dt);
  const actuallyMoving=Math.hypot(nextPosition.x-position.x,nextPosition.z-position.z)>.001;
  if(nextPosition.stun>0&&!(position.stun>0))audio.cue('fall');
  position.x = nextPosition.x;
  position.y = nextPosition.y;position.vy=nextPosition.vy;position.fallStart=nextPosition.fallStart;position.stun=nextPosition.stun;
  position.z = nextPosition.z;
  camera.position.set(position.x, position.y+1.65, position.z);
  camera.rotation.set(pitch, yaw, 0);
  netTime += dt;
  if (sock?.readyState === 1 && netTime >= 0.1) {
    netTime = 0;
    sock.send(JSON.stringify({ t: 'pos', x: position.x, z: position.z }));
  }
  if (soloStarted && !outcome) {
    tLeft = Math.max(0, tLeft - dt);
    temp = Math.min(100, temp + DRIFT_PER_SEC * dt);
    if (tLeft <= 0) outcome = 'lockdown';
    if (temp >= 100) outcome = 'meltdown';
  }
  const near = Math.hypot(position.x - CONSOLE_POSITION.x, position.z - CONSOLE_POSITION.z) <= ACTION_RANGE;
  promptEl.textContent = near && !outcome ? 'E / SERVICE REACTOR CIRCUITS' : '';
  actionButton.hidden = !near || !!outcome;
  const nearSafe=Math.hypot(position.x-SAFE_POSITION.x,position.z-SAFE_POSITION.z)<=SAFE_RANGE;
  if(nearSafe&&!outcome){promptEl.textContent=safeOpened?'MUTAGEN SAFE OPEN':'E / MATE IN ONE';actionButton.hidden=safeOpened||chess.isOpen;actionButton.textContent='OPEN SAFE';}
  else actionButton.textContent='ACTION';
  if(chess.isOpen){promptEl.textContent='';actionButton.hidden=true;}
  if(!serverLive&&!outcome&&updateCoolant(coolantState,dt,atCoolantStation(position))){temp=Math.max(0,temp-8);pressure=Math.max(20,pressure-6);eventEl.textContent='COOLANT FLUSH / CORE -8';}
  coolant.update(coolantState);
  if(coolant.isOpen&&(outcome||!atCoolantStation(position)))coolant.close();
  if(atCoolantStation(position)&&!outcome){promptEl.textContent='E / BALANCE COOLANT';actionButton.hidden=coolant.isOpen;actionButton.textContent='COOLANT';}
  if(coolant.isOpen){promptEl.textContent='';actionButton.hidden=true;}
  if(facilityPanels.isOpen&&(outcome||!nearStation(position,facilityPanels.mode==='access'?CAMERA_PANEL:INCINERATOR)))facilityPanels.close();
  if(tubes.isOpen&&(outcome||!nearStation(position,TUBE_RACK)))tubes.close();
  facilityPanels.update(coolantState);tubes.update(tubesState);
  const special=nearStation(position,CAMERA_PANEL)?'ACCESS PIN':nearStation(position,INCINERATOR)?'PURGE FILTERS':cameraOpened&&nearStation(position,TUBE_RACK)?'SEAT TUBES':position.y< -1&&nearStation(position,SERVICE_LADDER,1.6)?'CLIMB LADDER':null;
  if(special&&!outcome){promptEl.textContent='E / '+special;actionButton.hidden=false;actionButton.textContent=special;}
  if(facilityPanels.isOpen||tubes.isOpen){promptEl.textContent='';actionButton.hidden=true;}
  if(!serverLive)refreshRelay(relayState,Date.now());
  else if(relay.isOpen&&relayState.stage==='done'&&Date.now()>=relayState.readyAt&&now>relayPollAt&&sock?.readyState===1){relayPollAt=now+1000;sock.send(JSON.stringify({t:'relayOpen'}));}
  relay.update(relayState);
  if(relay.isOpen&&(outcome||!near||Math.abs(position.y)>.8))relay.close();
  if(relay.isOpen){promptEl.textContent='';actionButton.hidden=true;}
  document.getElementById('objective').textContent=coolantState.cooldown>0?'COOLANT FLUSH ACTIVE / KEEP REACTOR STABLE':coolantState.filterReady?'BALANCE COOLANT / LOWER BASIN':'CLEAR 3 FILTERS / INCINERATOR';
  const toolBlocked=menuOpen||relay.isOpen||chess.isOpen||coolant.isOpen||facilityPanels.isOpen||tubes.isOpen||!!outcome;
  toolWorld.update(toolState,toolIdentity(),position,toolPlayers,now/1000,camera);
  toolTarget=toolBlocked?null:toolWorld.target(toolState,toolIdentity(),position,yaw,pitch,cameraOpened);
  if(toolBlocked)toolWorld.target(toolState,toolIdentity(),position,NaN,NaN,cameraOpened);
  const held=heldTool(toolState,toolIdentity()),equip=held?Math.max(0,(held.equippedAt-Date.now())/650):0;
  firstPerson.setHeld(held?.kind||null);
  if(now>toolFeedbackUntil)document.getElementById('tool-feedback').textContent='';
  document.getElementById('tool-name').textContent=held?(equip>0?'EQUIPPING / ':'')+TOOL_NAMES[held.kind]:'HANDS EMPTY';
  document.getElementById('tool-drop').hidden=!held||toolBlocked;
  let toolProgress=0;
  if(toolPending){
   const job=TOOL_JOBS.find(j=>j.id===toolPending.job);
   if(toolBlocked||(!keys.has('KeyE')&&!touchUse)||!job||!withinToolReach(position,job,cameraOpened))cancelToolUse();
   else{toolProgress=Math.min(1,(Date.now()-toolPending.started)/toolPending.duration);if(now-lastToolSound>250){audio.cue('turn');lastToolSound=now;}
    if(toolProgress>=1&&!toolSent){toolSent=true;if(sock?.readyState===1)sock.send(JSON.stringify({t:'toolFinish'}));else{const result=finishToolJob(toolState,toolIdentity(),position,toolPending,Date.now(),cameraOpened);toolMessage(result);if(result.completed&&result.kind==='leak'){pressure=Math.max(0,pressure-4);audio.cue('success');}toolPending=null;toolSent=false;}}
   }
  }
  document.getElementById('tool-progress').hidden=!toolPending;document.getElementById('tool-fill').style.width=toolProgress*100+'%';
  if(toolTarget){promptEl.textContent=toolTarget.type==='pickup'?`E / TAKE ${toolTarget.label}`:toolTarget.type==='climb'?'E / CLIMB ROPE':held?.kind===toolTarget.tool?`HOLD E / ${toolTarget.label}`:`${toolTarget.label} / NEED ${TOOL_NAMES[toolTarget.tool]}`;actionButton.hidden=false;actionButton.textContent=toolTarget.type==='job'?'HOLD / USE TOOL':toolTarget.type==='climb'?'CLIMB':'TAKE';}
  updateBunker(dt, temp, pressure, blackout,safeOpened,cameraOpened,tubesState.powered,coolantState);
  if(safeOpened&&!lastSafeAlarm)containmentUntil=now+7000;lastSafeAlarm=safeOpened;
  const alarm=alarmState(temp,pressure,blackout,coolantState.filterReady,now<containmentUntil);alarmLights.update(now/1000,alarm);document.getElementById('alarm-status').textContent=alarm.label;
  audio.update(dt, { moving: actuallyMoving, temp, pressure, position,alarm,holdingBreath: keys.has('KeyC') || touchBreath });
  lamp.intensity = blackout ? 0.2 : 5;
  emergency.intensity = blackout ? 1.7 : 0.8;
  const minutes = Math.floor(tLeft / 60), seconds = Math.floor(tLeft % 60);
  document.getElementById('clock').textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;
  document.getElementById('temp').textContent = `${temp.toFixed(0)}%`;
  document.getElementById('corebar').style.width = `${temp}%`;
  document.getElementById('psibar').style.width = `${pressure}%`;
  pressureEl.textContent = `${pressure.toFixed(0)}%`;
  resultEl.textContent = outcome === 'meltdown' ? 'CORE MELTDOWN — SABOTEUR WINS' : outcome === 'lockdown' ? 'QUARANTINE LOCKDOWN — CREW WINS' : '';
  frames++; fpsTime += dt;
  if (fpsTime > 0.5) { document.getElementById('fps').textContent = Math.round(frames / fpsTime); frames = 0; fpsTime = 0; }
  firstPerson.update(dt, {position,yaw,pitch,moving:actuallyMoving,
    toolUse:toolPending?toolProgress:0,equipping:equip,holdingBreath:keys.has('KeyC')||touchBreath,blackout,menuOpen:menuOpen||relay.isOpen||chess.isOpen||coolant.isOpen||facilityPanels.isOpen||tubes.isOpen});
  renderFeeds(renderer,now,tubesState.powered,position,selectLights);
  selectLights(camera.position);
  renderer.render(scene, camera);
  firstPerson.render(renderer);
}
requestAnimationFrame(loop);
