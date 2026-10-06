import {addWorldDetail} from './world-detail.js';
import {industrialMetal,dressCeiling} from './ceiling.js';
import {buildReactor} from './reactor.js';
import * as THREE from 'three';
import {batchStatic} from './static-batch.js';
import {detailEquipment} from './equipment.js';
import {buildFacility} from './facility.js';
import {dressBunker} from './dressing.js';
import {lampVoltage} from './flicker.js';
import {buildSewer} from './sewer.js';
import {buildWings} from './wings.js';
import {buildStations} from './stations-view.js';
import {buildHangar} from './hangar.js';
import {decorate} from './decor.js';
import {buildFurniture} from './furnish.js';
import { ROOMS, WALLS, DOORS, FIXTURES } from '../shared/world.js';
import { CONSOLE_POSITION } from '../shared/constants.js';

// Small painted textures and modular bays keep the scene in the PS1 visual vocabulary.
// The seed makes wear and prop placement reproducible for a given room layout.
function seeded(seed) {
  let value = seed >>> 0;
  return () => ((value = (Math.imul(value, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function paintTexture(base, accent, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 64);
  const random = seeded(seed);
  for (let i = 0; i < 350; i++) {
    const x = Math.floor(random() * 64), y = Math.floor(random() * 64);
    ctx.fillStyle = random() > 0.5 ? 'rgba(9,12,7,.19)' : 'rgba(214,198,129,.12)';
    ctx.fillRect(x, y, 1 + Math.floor(random() * 3), 1 + Math.floor(random() * 2));
  }
  // Streaks and damp patches are painted into the low-resolution material.
  for(let i=0;i<12;i++){
    const x=Math.floor(random()*64),y=Math.floor(random()*64),w=2+Math.floor(random()*8);
    ctx.fillStyle=i%3?'rgba(13,23,15,.24)':'rgba(65,36,17,.30)';
    ctx.fillRect(x,y,w,7+Math.floor(random()*28));
    ctx.fillRect(x+1,y,w-1,3);
  }
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 64, 2);
  ctx.fillRect(0, 62, 64, 2);
  ctx.fillRect(0, 0, 2, 64);
  ctx.fillRect(62, 0, 2, 64);
  for (const x of [5, 57]) for (const y of [5, 57]) {
    ctx.fillStyle = '#191d17';
    ctx.fillRect(x, y, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function buildBunker(scene) {
  const roomLamps=[];
  const wall = new THREE.MeshLambertMaterial({ map: paintTexture('#494d41', '#24291f', 86) });
  const floor = new THREE.MeshLambertMaterial({ map: paintTexture('#3c4034', '#171b16', 1986) });
  const rust = new THREE.MeshLambertMaterial({ map: paintTexture('#6a4b2d','#473721',731) });
  const steel = new THREE.MeshLambertMaterial({ map: paintTexture('#596153','#333b30',711) });
  const dark = new THREE.MeshLambertMaterial({ color: 0x272e2c });
  const hazard = new THREE.MeshBasicMaterial({ color: 0xb38a35 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xb78a4c });
  const coolant = new THREE.MeshLambertMaterial({ color: 0x436b6c });
  const consolePaint = new THREE.MeshLambertMaterial({ map: paintTexture('#596153','#333b30',711) });

  function box(w, h, d, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    return mesh;
  }
  function pipe(radius, length, x, y, z, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 6), material);
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(x, y, z);
    scene.add(mesh);
  }

  const random = seeded(8604);
  function roomSign(text,x,y,z,angle=0,color='#c6d0a1') {
    const c=document.createElement('canvas');c.width=256;c.height=48;
    const g=c.getContext('2d');g.fillStyle='#121b14';g.fillRect(0,0,256,48);
    g.strokeStyle=color;g.lineWidth=3;g.strokeRect(2,2,252,44);
    g.fillStyle=color;g.font='bold 21px monospace';g.textAlign='center';g.fillText(text,128,31);
    const texture=new THREE.CanvasTexture(c);texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.colorSpace=THREE.SRGBColorSpace;
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.49),new THREE.MeshBasicMaterial({map:texture}));
    mesh.position.set(x,y,z);mesh.rotation.y=angle;if(text.startsWith('E /'))mesh.scale.setScalar(.55);scene.add(mesh);
  }
  for(const room of ROOMS) {
    const tint=new THREE.MeshLambertMaterial({map:wall.map,color:room.color});
    for(let x=-3.75;x<5;x+=2.5)for(let z=-3.75;z<5;z+=2.5)box(2.5,.12,2.5,room.x+x,-.06,room.z+z,floor);
    box(10,.2,10,room.x,3.5,room.z,industrialMetal(86+room.x,4));
    dressCeiling(scene,{box,steel,rust,dark},room.x,room.z);
    const bulbs=[];
    for(const z of [-2.8,2.8]){
      const bulb=glow.clone();bulbs.push(bulb);box(1.7,.09,.48,room.x,3.32,room.z+z,bulb);
      box(1.9,.12,.62,room.x,3.4,room.z+z,steel);
    }
    const light=new THREE.PointLight(0xd3a264,12,12,1.5);light.position.set(room.x,2.7,room.z);scene.add(light);roomLamps.push({light,bulbs,seed:roomLamps.length,damaged:room.id==='pumps'||room.id==='control'});
    // Overhead pipes remain above head height, leaving each doorway clear.
    for(const side of [-1,1])pipe(.10,9.5,room.x+side*3.6,3.02,room.z,side<0?coolant:rust);
    box(9.8,.10,.1,room.x,2.82,room.z-4.8,tint);
    roomSign(room.name,room.x,2.55,room.z-4.84,0);
  }
  for(const w of WALLS) {
    const bottom=w.minY??0,top=w.maxY??3.5;
    let paint=wall;
    if(w.minY!==undefined){paint=wall.clone();paint.map=wall.map.clone();paint.map.wrapS=paint.map.wrapT=THREE.RepeatWrapping;paint.map.repeat.set(Math.max(w.w,w.d)/2.5,(top-bottom)/2.5);}
    box(w.w,top-bottom,w.d,w.x,(top+bottom)/2,w.z,paint);
    box(w.w+.01,.16,w.d+.01,w.x,.08,w.z,dark);
  }
  for(const door of DOORS) {
    const across=door.axis==='x';
    for(const side of [-1,1])box(across?.34:.16,2.55,across?.16:.34,door.x+(across?0:side*1.19),1.275,door.z+(across?side*1.19:0),steel);
    box(across?.34:2.55,.22,across?2.55:.34,door.x,2.65,door.z,steel);
    box(across?.23:2.4,.025,across?2.4:.23,door.x,.016,door.z,hazard);
    // Each face labels the room on the far side of the opening.
    const a=ROOMS.find(r=>r.id===door.a),b=ROOMS.find(r=>r.id===door.b);
    if(across){roomSign(b.name,door.x-.18,2.97,door.z,-Math.PI/2);roomSign(a.name,door.x+.18,2.97,door.z,Math.PI/2);}
    else {roomSign(b.name,door.x,2.97,door.z+.18,0);roomSign(a.name,door.x,2.97,door.z-.18,Math.PI);}
  }
  for(const f of FIXTURES) {
    if(f.id!=='mutagen-safe')box(f.w,f.h,f.d,f.x,f.h/2,f.z,f.id==='containment-tank'?coolant:dark);
    if(f.id==='workbench') {
      box(f.w+.02,.10,f.d+.02,f.x,1.0,f.z,steel);
      for(let i=0;i<5;i++)box(.1,.045,.42,f.x-.8+i*.38,1.08,f.z,rust);
      roomSign('ASSEMBLY BENCH',f.x,1.8,f.z+.35,Math.PI);
    }
    if(f.id==='containment-tank') {
      box(1.25,1.5,.035,f.x,1.3,f.z+.815,new THREE.MeshBasicMaterial({color:0x355b58}));
      roomSign('ISOLATION 09',f.x,2.65,f.z+.83,0);
    }
  }
  roomSign('EXIT / SEALED',13.77,2.8,3,-Math.PI/2);
  const reactor=buildReactor(scene,{box,pipe,roomSign,wall,floor,steel,dark,rust,hazard,glow});
  // Recessed mutagen safe, with a door and visible sample after a correct mate.
  const safePaint=new THREE.MeshLambertMaterial({color:0x52675b});
  box(1.4,1.65,.3,10,.825,-13.88,dark);
  for(const side of [-1,1])box(.12,1.65,.65,10+side*.64,.825,-13.7,safePaint);
  box(1.4,.12,.65,10,1.59,-13.7,safePaint);box(1.4,.12,.65,10,.06,-13.7,safePaint);
  const safeDoor=new THREE.Group();safeDoor.userData.dynamic=true;safeDoor.position.set(9.42,0,-13.35);scene.add(safeDoor);
  function doorPart(w,h,d,x,y,z,material){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);safeDoor.add(mesh);return mesh;}
  doorPart(1.16,1.38,.10,.58,.825,0,safePaint);
  doorPart(.54,.42,.045,.54,1.05,.07,new THREE.MeshBasicMaterial({color:0x9cac85}));
  // A simple chess insignia reads at the game's low rendering resolution.
  doorPart(.08,.27,.03,.54,1.05,.10,dark);doorPart(.25,.07,.03,.54,1.13,.10,dark);doorPart(.28,.05,.03,.54,.90,.10,dark);
  doorPart(.06,.30,.08,.97,.69,.10,rust);
  const sample=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,.33,8),new THREE.MeshBasicMaterial({color:0x6ac9a3}));sample.position.set(10,.65,-13.6);scene.add(sample);
  roomSign('MATE IN ONE / SAFE 01',10,2.05,-13.30,0,'#a4cab1');
  let safeAngle=0;


  // The reactor controls remain at a fixed landmark, while the surrounding
  // modules can later be assembled into a seeded room graph.
  box(2.2, .04, 1.6, 0, .02, CONSOLE_POSITION.z, hazard);
  const consoleBody = box(1.7, 1.25, .85, 0, .68, CONSOLE_POSITION.z, consolePaint);
  box(1.8, .18, .95, 0, 1.28, CONSOLE_POSITION.z, dark);
  const crt = document.createElement('canvas');
  crt.width = 128; crt.height = 64;
  const crtCtx = crt.getContext('2d');
  const crtTexture = new THREE.CanvasTexture(crt);
  crtTexture.magFilter = THREE.NearestFilter;
  crtTexture.minFilter = THREE.NearestFilter;
  crtTexture.colorSpace = THREE.SRGBColorSpace;
  const screen = box(1.28, .56, .045, 0, 1.06, CONSOLE_POSITION.z + .46,
    new THREE.MeshBasicMaterial({ map: crtTexture }));
  for (let i = 0; i < 4; i++) {
    box(.11, .07, .05, -.5 + i * .28, .68, CONSOLE_POSITION.z + .45,
      i === 3 ? hazard : dark);
  }
  box(.35, .16, .2, .53, .64, CONSOLE_POSITION.z + .51, rust);

  const sign = document.createElement('canvas');
  sign.width = 128; sign.height = 32;
  const ctx = sign.getContext('2d');
  ctx.fillStyle = '#19241b'; ctx.fillRect(0, 0, 128, 32);
  ctx.strokeStyle = '#92a77d'; ctx.strokeRect(1, 1, 126, 30);
  ctx.fillStyle = '#d1dfba'; ctx.font = 'bold 13px monospace';
  ctx.fillText('ОБЪЕКТ-86', 13, 20);
  const signTexture = new THREE.CanvasTexture(sign);
  signTexture.magFilter = THREE.NearestFilter;
  signTexture.minFilter = THREE.NearestFilter;
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const placard = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .45), new THREE.MeshBasicMaterial({ map: signTexture }));
  placard.position.set(0, 2.4, CONSOLE_POSITION.z - .9);
  scene.add(placard);

  const plumeCanvas = document.createElement('canvas');
  plumeCanvas.width = plumeCanvas.height = 32;
  const plumeCtx = plumeCanvas.getContext('2d');
  const gradient = plumeCtx.createRadialGradient(16, 16, 1, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(230,237,215,.7)');
  gradient.addColorStop(.5, 'rgba(183,195,173,.28)');
  gradient.addColorStop(1, 'rgba(183,195,173,0)');
  plumeCtx.fillStyle = gradient;
  plumeCtx.fillRect(0, 0, 32, 32);
  const plumeTexture = new THREE.CanvasTexture(plumeCanvas);
  const particles = [];
  for (const [sourceX, sourceZ, smoke] of [[-12.8,-12.7,false],[-7.3,-12.7,false],[3,-22,false],[0,-22,true],[12.4,-12.2,true]]) {
    for (let i = 0; i < (smoke ? 6 : 9); i++) {
      const material = new THREE.SpriteMaterial({ map: plumeTexture, color: smoke ? 0x777d71 : 0xe3e9dc, transparent: true, opacity: .3, depthWrite: false });
      const sprite = new THREE.Sprite(material);
      const phase = random();
      sprite.position.set(sourceX, (smoke ? 2 : .8) + phase * 1.2, sourceZ);
      sprite.scale.set(.55, .55, 1);
      scene.add(sprite);
      particles.push({ sprite, sourceX, sourceZ, smoke, phase, drift: random() * 2 - 1 });
    }
  }

  dressBunker(scene,{box,pipe,steel,dark,rust,coolant,hazard});
  const equipment=detailEquipment(scene,{box,pipe,steel,dark,rust,coolant,roomSign});
  const facility=buildFacility(scene,{box,pipe,roomSign,wall,floor,steel,dark,rust,glow,hazard});
  const sewer=buildSewer(scene,{box,pipe,roomSign,wall,floor,rust,steel,dark,hazard,glow,coolant});
  const wings=buildWings(scene,{box,pipe,roomSign,wall,floor,steel,dark,rust,hazard,glow,coolant});
  let elapsed = 0, screenClock = 0;
  function update(dt, temp, pressure, blackout, safeOpened=false,cameraOpened=false,tubesPowered=false,coolantState={intake:25,bypass:75,cycle:0,filterReady:false,filterProgress:0,cooldown:0},extra={}) {
    safeAngle += ((safeOpened?-1.45:0)-safeAngle)*Math.min(1,dt*5);
    safeDoor.rotation.y=safeAngle;
    elapsed += dt;reactor.update(dt,elapsed,temp,pressure,blackout,coolantState);equipment.update(dt);sewer.update(elapsed,blackout);wings.update(elapsed,blackout,extra.liftOpen||0,extra.alarm||false);facility.update(dt,elapsed,cameraOpened,tubesPowered);
    for(const l of roomLamps){const voltage=blackout?.07:lampVoltage(elapsed,l.seed,l.damaged);l.light.intensity=12*voltage;for(const b of l.bulbs)b.color.copy(glow.color).multiplyScalar(voltage);}
    screenClock += dt;
    if (screenClock >= .12) {
      screenClock = 0;
      const danger = temp >= 80 || pressure >= 80;
      crtCtx.fillStyle = '#091b12'; crtCtx.fillRect(0, 0, 128, 64);
      crtCtx.strokeStyle = '#20452c';
      for (let x = 0; x < 128; x += 16) { crtCtx.beginPath(); crtCtx.moveTo(x, 0); crtCtx.lineTo(x, 64); crtCtx.stroke(); }
      for (let y = 0; y < 64; y += 8) { crtCtx.beginPath(); crtCtx.moveTo(0, y); crtCtx.lineTo(128, y); crtCtx.stroke(); }
      crtCtx.fillStyle = danger ? '#ff8060' : '#83e6a1';
      crtCtx.font = 'bold 8px monospace';
      crtCtx.fillText('REACTOR / 86', 4, 10);
      crtCtx.fillText(`TEMP ${temp.toFixed(1)}%`, 4, 22);
      crtCtx.fillText(`PRES ${pressure.toFixed(0)}%`, 4, 32);
      crtCtx.fillRect(4, 37, Math.min(119, Math.max(0, temp * 1.19)), 4);
      // The last completed service cycle stays on screen: a saboteur's cycle reads as a rise.
      if(extra.console){crtCtx.fillStyle=extra.console.delta>0?'#ff8060':'#83e6a1';crtCtx.fillText(`LAST CYCLE ${extra.console.delta>0?'+':''}${extra.console.delta}%`,64,22);}
      crtCtx.beginPath();
      for (let x = 3; x < 125; x++) {
        const y = 53 + Math.sin(x * .18 + elapsed * 3) * (2 + temp / 45);
        if (x === 3) crtCtx.moveTo(x, y); else crtCtx.lineTo(x, y);
      }
      crtCtx.strokeStyle = danger ? '#ff8060' : '#83e6a1';
      crtCtx.stroke();
      crtTexture.needsUpdate = true;
      consoleBody.material.color.setHex(danger ? 0x8a5547 : 0x697064);
    }
    for (const p of particles) {
      const rise = (elapsed * .28 + p.phase) % 1;
      p.sprite.position.set(p.sourceX + p.drift * rise * .5, (p.smoke ? 1.9 : .65) + rise * (p.smoke ? 1.1 : 1.7), p.sourceZ + Math.sin(elapsed + p.phase * 6) * .15);
      const size = (p.smoke ? .7 : .5) + rise * .85;
      p.sprite.scale.set(size, size, 1);
      p.sprite.material.opacity = (p.smoke ? .2 : blackout ? .48 : .38) * Math.sin(Math.PI * rise);
    }
  }

  buildHangar(scene,{box,roomSign,steel,dark,rust,hazard});
  decorate(scene);
  buildFurniture(scene,{steel,dark,rust});
  const stations=buildStations(scene);
  addWorldDetail(scene);
  batchStatic(scene);
  update(1, 50, 20, false);
  return { screen, update,renderFeeds:facility.renderFeeds,facility,stations,wings,consoleScreen:{crtCtx,crtTexture} };
}
