import {CAMERAS} from '../shared/stations.js';
import {SAFES} from '../shared/safes.js';
import {PARTS} from '../shared/evolution.js';
const $=id=>document.getElementById(id);
let last='';
// A short live checklist. It changes as the bunker breaks, so it never reads like a chore list.
export function renderObjectives(s,me,heldWrench){
 const items=[];
 if(me.role==='specimen'){
  for(const safe of SAFES)items.push({text:`${safe.name} / ${safe.id==='chess'?'CONTAINMENT':safe.id==='sweeper'?'ARCHIVE (WEST)':'SUBSTATION (EAST)'}`,done:me.solved?.includes(safe.id)});
  items.push({text:me.stage>=3?'ESCAPE: PRY THE SURFACE LIFT (FAR EAST)':'THEN: THE SURFACE LIFT (FAR EAST)',urgent:me.stage>=3});
  if(s.temp>=80)items.push({text:'CORE CRITICAL: TEAR THE BYPASS AT THE REACTOR CONSOLE OR DIE WITH THEM',urgent:true});
 }else if(me.role){
  if(me.role==='saboteur')items.push({text:me.sabotage>0?`SABOTAGE READY IN ${Math.ceil(me.sabotage)}S`:'SABOTAGE READY / VALVE, BREAKER, DOORS OR A CAMERA CABLE',urgent:me.sabotage<=0});
  items.push({text:me.role==='saboteur'?'SERVICE THE REACTOR (YOUR CYCLES ADD HEAT)':'SERVICE THE REACTOR CONSOLE / REACTOR HALL'});
  if(s.coolant){if(s.coolant.cooldown>0)items.push({text:'COOLANT FLUSH COMPLETE',done:true});else if(s.coolant.filterReady)items.push({text:'BALANCE COOLANT / LOWER BASIN'});else items.push({text:`PURGE FILTERS ${s.coolant.filterProgress}/3 / INCINERATOR`});}
  const leaks=Object.entries(s.tools?.jobs||{}).filter(([id])=>id.endsWith('leak'));const sealed=leaks.filter(([,v])=>v>=3).length;
  items.push({text:`SEAL LEAKS ${sealed}/${leaks.length}${heldWrench?'':' / NEEDS A WRENCH'}`,done:sealed===leaks.length});
  if(!s.cameraOpened)items.push({text:'OPEN THE CAMERA ROOM / ACCESS PANEL'});else if(!s.tubes?.powered)items.push({text:'POWER THE CAMERAS / SEAT 3 TUBES'});else items.push({text:'CAMERAS ONLINE / SCIF RADIO WORKS',done:true});
  if(s.valve)items.push({text:'COOLANT VALVE REVERSED / PUMP ROOM',urgent:true});
  if(s.blackout)items.push({text:'POWER OUT / RESET THE BREAKER IN THE SUBSTATION',urgent:true});
  for(const id of s.cut||[])items.push({text:`CAMERA ${CAMERAS.find(c=>c.id===id)?.label.slice(0,2)} CUT / SPLICE ITS CABLE BOX`,urgent:true});
  if(s.sealed)items.push({text:'TUNNEL BLAST DOORS SEALED',urgent:true});
 }
 const sig=JSON.stringify(items);if(sig===last)return;last=sig;
 $('objectives').replaceChildren(...items.map(i=>Object.assign(document.createElement('li'),{className:i.done?'done':i.urgent?'urgent':'',textContent:i.text})));
}
export function renderSpecimen(me,mutations){
 $('spec-stage').textContent=`SPECIMEN-09 / STAGE ${me.stage||0} OF 3`;
 $('lunge-bar').style.width=`${100*(1-(me.lunge||0)/(me.lungeMax||16))}%`;
 const has=id=>Object.values(mutations||{}).includes(id);
 const lines=[`CLICK / F: LUNGE${me.lunge>0?` ${Math.ceil(me.lunge)}S`:''}`,`E AT A GRATE: ${me.canVent?'VENTS':'TOO BIG FOR VENTS'}`];
 if(has('leaper'))lines.push(`SHIFT: SPRING${me.sprint>0?` ${Math.ceil(me.sprint)}S`:''}`);
 if(has('echo'))lines.push(`Q: ECHO PULSE${me.pulse>0?` ${Math.ceil(me.pulse)}S`:''}`);
 if(has('sacs'))lines.push(`R: MIST${me.mistCd>0?` ${Math.ceil(me.mistCd)}S`:''}`);
 for(const id of Object.values(mutations||{}))lines.push('+ '+PARTS.find(p=>p.id===id)?.name);
 $('spec-abilities').innerHTML=lines.join('<br>');
}
