import {GRID,HOT,PHASES,lissajous,scopePuzzle} from '../shared/safes.js';
import {PARTS} from '../shared/evolution.js';
import {VENTS} from '../shared/stations.js';
import {CALLOUTS} from '../shared/match.js';
import {ROOMS} from '../shared/world.js';
import {WING_SPACES} from '../shared/wings.js';
const $=id=>document.getElementById(id);
const panelApi=(id,onClose)=>({get isOpen(){return !$(id).hidden;},close(){if($(id).hidden)return;$(id).hidden=true;onClose?.();}});

// SAFE 02: mark the four irradiated cells.
export function createSweeper(onSeal,onClose){
 const api={...panelApi('sweeper-panel',onClose)};let marked=new Set(),clues=null;
 function draw(){
  const grid=$('sweeper-grid');grid.replaceChildren();
  grid.append(Object.assign(document.createElement('span'),{className:'count'}));
  for(let c=0;c<GRID;c++)grid.append(Object.assign(document.createElement('span'),{className:'count',textContent:clues.cols[c]}));
  for(let r=0;r<GRID;r++){
   grid.append(Object.assign(document.createElement('span'),{className:'count',textContent:clues.rows[r]}));
   for(let c=0;c<GRID;c++){
    const i=r*GRID+c,b=document.createElement('button'),reading=clues.readings[i];
    if(reading!==undefined){b.className='reading';b.textContent=reading;b.setAttribute('aria-label',`Reading ${reading}`);}
    else{b.classList.toggle('marked',marked.has(i));b.setAttribute('aria-label',`Row ${r+1} column ${c+1}${marked.has(i)?' marked hot':''}`);b.onclick=()=>{marked.has(i)?marked.delete(i):marked.size<HOT&&marked.add(i);draw();};}
    grid.append(b);
   }
  }
  $('sweeper-seal').disabled=marked.size!==HOT;
 }
 api.open=c=>{clues=c;marked=new Set();$('sweeper-message').textContent=`MARKED 0 OF ${HOT}.`;$('sweeper-panel').hidden=false;draw();};
 api.result=(ok,reason)=>{$('sweeper-message').textContent=ok?'SEAL ACCEPTED / MUTAGEN RELEASED':reason;};
 $('sweeper-seal').onclick=()=>onSeal([...marked]);$('sweeper-clear').onclick=()=>{marked.clear();draw();};$('sweeper-close').onclick=()=>api.close();
 $('sweeper-grid').addEventListener('click',()=>{$('sweeper-message').textContent=`MARKED ${marked.size} OF ${HOT}.`;});
 return api;
}

// SAFE 03: tune a Lissajous trace onto the reference.
export function createScope(onSync,onClose){
 const api={...panelApi('scope-panel',onClose)};const g={a:1,b:1,phase:0};let target=null,raf=0;
 const ctx=$('scope-screen').getContext('2d');
 function trace(a,b,p,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();for(let i=0;i<=400;i++){const t=i/400*Math.PI*2,q=lissajous(a,b,p,t),x=120+q.x*100,y=90-q.y*76;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
 function draw(){
  ctx.fillStyle='#061109';ctx.fillRect(0,0,240,180);ctx.strokeStyle='#123321';ctx.lineWidth=1;
  for(let x=0;x<=240;x+=24){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,180);ctx.stroke();}for(let y=0;y<=180;y+=18){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(240,y);ctx.stroke();}
  if(target)trace(target.a,target.b,target.phase,'#2f6d45',5);
  const jitter=Math.sin(performance.now()*.004)*2;trace(g.a,g.b,g.phase+jitter,'#9ff0b0',1.5);
  $('scope-a').textContent=g.a;$('scope-b').textContent=g.b;$('scope-phase').textContent=g.phase+'°';
  if(!$('scope-panel').hidden)raf=requestAnimationFrame(draw);
 }
 for(const b of document.querySelectorAll('.scope-knobs button'))b.onclick=()=>{const k=b.dataset.k,d=Number(b.dataset.d);if(k==='phase'){const i=Math.max(0,Math.min(PHASES.length-1,PHASES.indexOf(g.phase)+d));g.phase=PHASES[i];}else g[k]=Math.max(1,Math.min(5,g[k]+d));};
 api.open=seed=>{target=scopePuzzle(seed);Object.assign(g,{a:1,b:1,phase:0});$('scope-message').textContent='REFERENCE TRACE LOADED.';$('scope-panel').hidden=false;cancelAnimationFrame(raf);draw();};
 api.result=(ok,reason)=>{$('scope-message').textContent=ok?'SIGNAL LOCKED / MUTAGEN RELEASED':reason;};
 $('scope-sync').onclick=()=>onSync({...g});$('scope-close').onclick=()=>api.close();
 return api;
}

// Pick one of two grafts for the newly unlocked slot.
export function createMutation(onPick,onClose){
 const api={...panelApi('mutate-panel',onClose)};let showing='';
 api.open=offer=>{
  const key=offer.slot+offer.ids.join();if(key===showing&&!$('mutate-panel').hidden)return;showing=key;
  $('mutate-title').textContent='GRAFT / '+offer.slot.toUpperCase();
  $('mutate-options').replaceChildren(...offer.ids.map(id=>{const p=PARTS.find(x=>x.id===id),b=document.createElement('button');b.innerHTML=`<b>${p.name}</b><p>${p.gain}</p><p class="cost">${p.cost}</p>`;b.onclick=()=>{onPick(id);api.close();};return b;}));
  $('mutate-panel').hidden=false;
 };
 return api;
}

// Inside the ducts: a schematic of every grate.
export function createVentMap(onExit){
 const api={...panelApi('vent-panel')};let from=null;
 const canvas=$('vent-map'),ctx=canvas.getContext('2d');
 const X=x=>(x+42)*5.2,Z=z=>(z+30)*3.6;
 function draw(){
  ctx.fillStyle='#090d08';ctx.fillRect(0,0,480,300);ctx.fillStyle='#1f2a1c';
  for(const r of ROOMS)ctx.fillRect(X(r.x-5),Z(r.z-5),10*5.2,10*3.6);
  for(const s of WING_SPACES)ctx.fillRect(X(s.minX),Z(s.minZ),(s.maxX-s.minX)*5.2,(s.maxZ-s.minZ)*3.6);
  ctx.fillRect(X(-8),Z(-29),16*5.2,14*3.6);ctx.fillRect(X(-18),Z(5),36*5.2,32*3.6);ctx.fillRect(X(-23),Z(-5),8*5.2,8*3.6);ctx.fillRect(X(15),Z(-15),8*5.2,10*3.6);
  ctx.font='8px monospace';
  for(const v of VENTS){const here=v.id===from;ctx.fillStyle=here?'#e2c27b':'#8fb48a';ctx.fillRect(X(v.x)-4,Z(v.z)-4,8,8);ctx.fillStyle='#b9c19a';ctx.fillText(v.id.toUpperCase(),X(v.x)+6,Z(v.z)+3);}
 }
 canvas.onclick=e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*480/r.width,y=(e.clientY-r.top)*300/r.height;const v=VENTS.reduce((b,v)=>Math.hypot(X(v.x)-x,Z(v.z)-y)<Math.hypot(X(b.x)-x,Z(b.z)-y)?v:b);if(Math.hypot(X(v.x)-x,Z(v.z)-y)<24&&v.id!==from){onExit(v.id);api.close();}};
 api.open=id=>{from=id;$('vent-list').replaceChildren(...VENTS.filter(v=>v.id!==id).map(v=>{const b=document.createElement('button');b.textContent=v.id.toUpperCase();b.onclick=()=>{onExit(v.id);api.close();};return b;}));$('vent-panel').hidden=false;draw();};
 return api;
}

// The SCIF: camera log and the one-line, ten-second-delayed radio.
export function createScif(onSend,onClose){
 const api={...panelApi('scif-panel',onClose)};let line=null;
 const rooms=['WORKSHOP','CONTROL','EXTRACTION','PUMP ROOM','REACTOR HALL','CONTAINMENT','REACTOR CORE','INCINERATOR','SEWER','EAST TUNNEL','EAST HALL','SUBSTATION','BARRACKS','SURFACE LIFT','WEST TUNNEL','WEST HALL','STORAGE','ARCHIVE','HANGAR'];
 $('scif-room').replaceChildren(...rooms.map(r=>Object.assign(document.createElement('option'),{value:r,textContent:r})));
 $('scif-callouts').replaceChildren(...CALLOUTS.map(c=>{const b=document.createElement('button');b.textContent=c;b.onclick=()=>send(`${c} / ${$('scif-room').value}`);return b;}));
 function send(text){if(line===null){$('scif-status').textContent='PATCH A LINE FIRST.';return;}onSend(line,text);}
 $('scif-form').onsubmit=e=>{e.preventDefault();const t=$('scif-text').value.trim();if(t){send(t);$('scif-text').value='';}};
 $('scif-close').onclick=()=>api.close();
 api.open=()=>{$('scif-panel').hidden=false;$('scif-status').textContent='';};
 api.update=scif=>{
  if($('scif-panel').hidden||!scif)return;
  const lines=scif.lines||[];if(line!==null&&!lines.includes(line))line=null;
  const sig=lines.join()+'/'+line;if($('scif-lines').dataset.sig!==sig){$('scif-lines').dataset.sig=sig;$('scif-lines').replaceChildren(...lines.map(n=>{const b=document.createElement('button');b.textContent='LINE '+n;b.setAttribute('aria-pressed',String(n===line));b.onclick=()=>{line=n;$('scif-lines').dataset.sig='';};return b;}));}
  const log=scif.log||[];const ls=log.map(l=>l.at+l.text).join();if($('scif-log').dataset.sig!==ls){$('scif-log').dataset.sig=ls;$('scif-log').replaceChildren(...(log.length?log:[{at:'--:--',text:'NO ACTIVITY RECORDED'}]).map(l=>Object.assign(document.createElement('li'),{textContent:`${l.at}  ${l.text}`})));}
  if(!scif.powered)$('scif-status').textContent='RELAY DEAD / SEAT THE VACUUM TUBES TO TRANSMIT';
 };
 api.status=t=>{$('scif-status').textContent=t;};
 return api;
}
