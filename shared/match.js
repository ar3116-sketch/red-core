// Match rules shared by the room server and the client.
export const CALLSIGNS=['VIKTOR','ELENA','PAVEL','IRINA','OLEG','NADIA','YURI','ZOYA'];
export const MAX_PLAYERS=8,BRIEFING_SECONDS=7;
// Roles scale with the room so a pair of judges still meets the monster.
export function roleCounts(n){
 if(n<=1)return {crew:1,saboteur:0,specimen:0,aiSpecimen:true};
 if(n<=3)return {crew:n-1,saboteur:0,specimen:1,aiSpecimen:false};
 return {crew:n-2,saboteur:1,specimen:1,aiSpecimen:false};
}
export function assignRoles(ids,random=Math.random){
 const order=[...ids];for(let i=order.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const c=roleCounts(ids.length),roles={};
 order.forEach((id,i)=>{roles[id]=i<c.specimen?'specimen':i<c.specimen+c.saboteur?'saboteur':'crew';});
 return roles;
}
export const ROLE_TEXT={
 crew:{title:'ENGINEER',goal:'Keep the core below 100% until the lockdown clock hits zero.',how:['Service the reactor console, flush coolant, seal leaks.','Something is loose in the vents. Stay near people. Watch the shafts.','One of you may be a saboteur. Same suit, same mask. Watch hands, not faces.']},
 saboteur:{title:'SABOTEUR',goal:'Drive the core to 100% before lockdown. Nobody can know.',how:['Your reactor services ADD heat. Do them where no one is watching.','Reverse valves, cut breakers and cameras. Each takes time and leaves marks.','A shove near a broken rail solves problems. Blame someone else.']},
 specimen:{title:'SPECIMEN-09',goal:'Crack three mutagen safes, evolve, then escape up the surface lift.',how:['You are invisible standing still. Moving, they see a shadow.','Lunge to throw people. Shafts and broken rails do the rest.','If the core melts down you die with them. Sometimes you must save it.']},
};
// Specimen-09.
export const SPECIMEN={speed:3.35,lungeRange:1.9,lungeCooldown:16,lungeKnock:3.2,lungeStun:1.4,revealOnLunge:1.6,stillToVanish:1,smashCooldown:40,smashHold:2500,escapeHold:6000,ventEnterHold:900};
export const MUTATION_ORDER=['senses','movement','hide'];
// Hanging from a lip: a beat bar in time with the heartbeat keeps your grip.
export const HANG={beatMs:[620,480],window:[.17,.12],drain:[6,10],hit:[13,9],miss:9,helpHold:2000,shovePenalty:35,lungePenalty:50};
// Duct tape: two people channel together on one target.
export const TAPE={hold:4000,range:1.5,breakHits:8,autoFree:60,adrenaline:9,adrenalineSpeed:2.1,cutHold:2000};
export const RADIO_DELAY=10000;
export const CALLOUTS=['SPECIMEN SEEN','SABOTEUR AT WORK','GET OUT NOW','HOLD POSITION','COME HELP','ALL CLEAR'];
export const outcomeText={
 meltdown:{title:'CORE MELTDOWN',line:'Object-86 is gone. The saboteur wins.'},
 lockdown:{title:'QUARANTINE LOCKDOWN',line:'The bunker seals with the core stable. Crew wins. The specimen stays buried.'},
 escape:{title:'SPECIMEN ESCAPED',line:'Something rode the lift into the Siberian night. The specimen wins.'},
 massacre:{title:'NO SURVIVORS',line:'The last engineer went over the rail. The specimen wins.'},
 slain:{title:'SPECIMEN DESTROYED',line:'Somebody built the gun. Crew wins.'},
};
export function winners(kind,players){
 const ids=Object.entries(players);
 const by=role=>ids.filter(([,p])=>p.role===role).map(([id])=>id);
 if(kind==='meltdown')return by('saboteur');
 if(kind==='escape'||kind==='massacre')return by('specimen');
 return by('crew');
}
