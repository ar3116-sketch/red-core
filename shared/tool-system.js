import {isWalkable,solidsForState,WALLS} from './world.js';
import {HANGAR_LEAK} from './hangar.js';
export const TOOL_NAMES={wrench:'PIPE WRENCH',rope:'RESCUE ROPE'};
export const TOOL_STARTS=[
 {id:'wrench-shop',kind:'wrench',x:-10.7,y:1.12,z:2.26,floor:0},
 {id:'rope-shop',kind:'rope',x:-9.15,y:1.13,z:2.35,floor:0},
 {id:'wrench-pumps',kind:'wrench',x:-13.3,y:1.72,z:-5.75,floor:0},
 {id:'rope-exit',kind:'rope',x:12.6,y:1.52,z:-3.75,floor:0},
 {id:'wrench-basin',kind:'wrench',x:-12.8,y:-1.58,z:28.3,floor:-3.2},
];
export const TOOL_JOBS=[
 {id:'pump-leak',kind:'leak',tool:'wrench',x:-7.3,y:1.1,z:-11.6,floor:0,label:'LEAKING PUMP FLANGE'},
 {id:'core-leak',kind:'leak',tool:'wrench',x:5.7,y:1.1,z:-19,floor:0,label:'CORE RETURN LEAK'},
 {id:'basin-leak',kind:'leak',tool:'wrench',x:-4.1,y:-2.15,z:21.6,floor:-3.2,label:'SUMP PIPE LEAK'},
 HANGAR_LEAK,
 {id:'rescue-west',kind:'anchor',tool:'rope',x:-14.15,y:.9,z:18.5,floor:0,label:'WEST GALLERY ROPE ANCHOR',top:{x:-14.8,y:0,z:18.5},bottom:{x:-13.2,y:-3.2,z:18.5}},
 {id:'rescue-pit',kind:'anchor',tool:'rope',x:18.2,y:.8,z:-12,floor:0,label:'SERVICE PIT ROPE ANCHOR',top:{x:17.7,y:0,z:-12},bottom:{x:19.3,y:-2.4,z:-12}},
];
export function createToolState(){return {items:TOOL_STARTS.map(p=>({...p,holder:null,equippedAt:0,spent:false})),jobs:Object.fromEntries(TOOL_JOBS.map(j=>[j.id,0]))};}
export const heldTool=(s,id)=>s.items.find(t=>t.holder===id&&!t.spent);
export function withinToolReach(p,t,cameraOpen=false){
 if(Math.abs(p.y-t.floor)>.8||Math.hypot(p.x-t.x,p.z-t.z)>2.15)return false;
 // Doors and walls must not allow a pickup through them.
 const blockers=cameraOpen?WALLS:[...WALLS,{x:-15,z:-1.5,w:.3,d:2.4}];
 for(let i=1;i<10;i++){const x=p.x+(t.x-p.x)*i/10,z=p.z+(t.z-p.z)*i/10;if(blockers.some(w=>x>w.x-w.w/2&&x<w.x+w.w/2&&z>w.z-w.d/2&&z<w.z+w.d/2))return false;}
 return true;
}
export function pickTool(s,id,p,itemId,now,cameraOpen=false){
 const t=s.items.find(t=>t.id===itemId);
 if(heldTool(s,id))return {ok:false,message:'HANDS FULL / G TO SET DOWN YOUR TOOL'};
 if(!t||t.holder||t.spent||!withinToolReach(p,t,cameraOpen))return {ok:false,message:'TOOL OUT OF REACH'};
 t.holder=id;t.equippedAt=now+650;return {ok:true,message:'EQUIPPING '+TOOL_NAMES[t.kind]};
}
export function dropTool(s,id,p,cameraOpen=false){
 const t=heldTool(s,id);if(!t)return {ok:false,message:'HANDS EMPTY'};
 const solids=solidsForState(cameraOpen);
 const point=[[.6,0],[-.6,0],[0,.6],[0,-.6],[0,0]].map(([dx,dz])=>({x:p.x+dx,z:p.z+dz,y:p.y})).find(q=>isWalkable(q.x,q.z,solids,.13,q.y));
 if(!point)return {ok:false,message:'NO SAFE PLACE TO SET IT DOWN'};
 Object.assign(t,{holder:null,x:point.x,y:point.y+.14,z:point.z,floor:point.y,equippedAt:0});return {ok:true,message:TOOL_NAMES[t.kind]+' SET DOWN'};
}
export function beginToolJob(s,id,p,jobId,now,cameraOpen=false){
 const job=TOOL_JOBS.find(j=>j.id===jobId),t=heldTool(s,id);
 if(!job||!withinToolReach(p,job,cameraOpen))return {ok:false,message:'MOVE CLOSER TO THE FITTING'};
 if(s.jobs[jobId]>=3)return {ok:false,message:job.kind==='leak'?'FLANGE SEALED':'ROPE ALREADY SECURED'};
 if(!t||t.kind!==job.tool)return {ok:false,message:'REQUIRES '+TOOL_NAMES[job.tool]};
 if(now<t.equippedAt)return {ok:false,message:'FINISH EQUIPPING FIRST'};
 return {ok:true,job:jobId,item:t.id,started:now,duration:job.kind==='leak'?750:1800,message:job.kind==='leak'?'HOLD E / TURN THE WRENCH':'HOLD E / SECURE THE ROPE'};
}
export function finishToolJob(s,id,p,pending,now,cameraOpen=false){
 if(!pending||now-pending.started<pending.duration)return {ok:false,message:'KEEP HOLDING TO FINISH'};
 const check=beginToolJob(s,id,p,pending.job,now,cameraOpen);if(!check.ok||check.item!==pending.item)return {ok:false,message:'WORK INTERRUPTED'};
 const job=TOOL_JOBS.find(j=>j.id===pending.job);
 s.jobs[job.id]=job.kind==='leak'?s.jobs[job.id]+1:3;
 const completed=s.jobs[job.id]>=3;
 if(job.kind==='anchor'){const t=heldTool(s,id);t.spent=true;t.holder=null;}
 return {ok:true,completed,kind:job.kind,message:job.kind==='anchor'?'ROPE SECURED / BOTH LEVELS CAN CLIMB':completed?'FLANGE SEALED / PRESSURE -4':`BOLT ${s.jobs[job.id]}/3 SEATED / RELEASE AND TURN AGAIN`};
}
export function ropeDestination(s,p,jobId){
 const j=TOOL_JOBS.find(j=>j.id===jobId&&j.kind==='anchor');if(!j||s.jobs[j.id]<3)return null;
 const near=q=>Math.abs(q.y-p.y)<.7&&Math.hypot(q.x-p.x,q.z-p.z)<1.8;
 return near(j.top)?j.bottom:near(j.bottom)?j.top:null;
}
