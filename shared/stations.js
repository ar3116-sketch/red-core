// Fixed interaction points added for the full match: vents, cameras, sabotage, lift.
// Every stand point is checked walkable by tools/check-stations.mjs.
export const VENTS=[
 {id:'workshop',x:-6.6,z:4.5},{id:'pumps',x:-14.4,z:-14.4},{id:'reactor',x:-4.4,z:-14.4},{id:'containment',x:14.4,z:-5.6},
 {id:'extraction',x:12,z:4.5},{id:'control',x:4.4,z:-4.5},{id:'core',x:-7.4,z:-28.4},{id:'cameras',x:-22.4,z:-4.4},
 {id:'incinerator',x:22.5,z:-9.6},{id:'sewer',x:-17.4,z:6},{id:'gallery',x:17.4,z:36},
 {id:'e-hall',x:25.6,z:11.4},{id:'substation',x:31.6,z:-5.6},{id:'barracks',x:40.4,z:3.6},{id:'lift',x:41.6,z:4.4},
 {id:'w-hall',x:-25.6,z:-25.4},{id:'storage',x:-31.6,z:3.4},{id:'archive',x:-31.6,z:-25.4},
];
export const VENT_SPEED=7;
export const ventTravel=(a,b)=>1+Math.hypot(a.x-b.x,a.z-b.z)/VENT_SPEED;
export const nearVent=(p,r=1.3)=>Math.abs(p.y??0)<.8?VENTS.find(v=>Math.hypot(p.x-v.x,p.z-v.z)<=r):null;
// Physical cameras. Feeds render in the camera room; the boxes beside them can be cut.
export const CAMERAS=[
 {id:'core',label:'01 / REACTOR CORE',mount:[-6,6.5,-17],target:[0,-2,-22],box:{x:-3.2,z:-15.3}},
 {id:'coolant',label:'02 / COOLANT BASIN',mount:[-16,3.1,8],target:[5,-2,27],box:{x:-12.6,z:6.6}},
 {id:'filters',label:'03 / INCINERATOR',mount:[17,2.8,-6],target:[21,1,-8],box:{x:16,z:-6}},
 {id:'e-hall',label:'04 / EAST HALL',mount:[25.4,2.9,-13.6],target:[28,0,2],box:{x:25.6,z:-12}},
 {id:'w-hall',label:'05 / WEST HALL',mount:[-25.4,2.9,3.6],target:[-28,0,-14],box:{x:-25.6,z:2.2}},
 {id:'pumps',label:'06 / PUMP ROOM',mount:[-5.4,3.1,-14.6],target:[-12,0,-9],box:{x:-6.2,z:-14.2}},
];
// Saboteur work. Each takes time, changes something visible and can be undone by the crew.
export const SABOTAGE=[
 {id:'valve',label:'COOLANT VALVE',x:-11.4,z:-14,hold:5000,fixHold:4000,lasts:60,room:'pumps'},
 {id:'breaker',label:'MAIN BREAKER',x:36,z:-12.6,hold:4000,fixHold:5000,lasts:35,room:'substation'},
 {id:'doors',label:'TUNNEL BLAST DOORS',x:-4.3,z:4.3,hold:2500,fixHold:0,lasts:22,room:'control'},
 ...CAMERAS.map(c=>({id:'coax-'+c.id,camera:c.id,label:'CAMERA CABLE '+c.label.slice(0,2),x:c.box.x,z:c.box.z,hold:2500,fixHold:3000,lasts:0})),
];
export const SAB_COOLDOWN=25;
export const nearSabotage=(p,r=1.5)=>Math.abs(p.y??0)<.8?SABOTAGE.find(s=>Math.hypot(p.x-s.x,p.z-s.z)<=r):null;
export const TUNNEL_DOORS=[{id:'east-door',minX:15.25,maxX:15.65,minZ:-4,maxZ:-1,minY:0,maxY:2.8},{id:'west-door',minX:-15.65,maxX:-15.25,minZ:-12,maxZ:-9,minY:0,maxY:2.8}];
export const SCIF_DESK={x:-20.4,y:0,z:-1};
export const REACTOR_SMASH={x:0,z:-6.9};
// Waypoint graph for the solo stalker. Edges are straight, unobstructed walks.
export const NAV={
 control:[0,0],workshop:[-10,0],extraction:[10,0],pumps:[-10,-10],reactor:[-2.2,-10],containment:[10,-10],
 dW:[-5,0],dE:[5,0],dPR:[-5,-10],dRC:[5,-10],dWP:[-10,-5],dCR:[0,-5],dEC:[10,-5],
 coreGate:[0,-16.5],coreW:[-5.8,-22],coreE:[5.8,-22],coreS:[0,-27.6],
 burnGate:[15,-10.6],burn:[19,-8.5],
 eMouth:[13.5,-2.3],eTun:[20,-2.2],eHallS:[27,-2.3],eHallSub:[27,-9.5],sub:[35,-9.5],eHallBar:[27,7.5],bar:[35,7.5],ePass:[27,-.5],passE:[36,-.5],lift:[45,-.5],
 wMouth:[-14,-11],wTun:[-20,-11],wHallN:[-27,-11],wHallArc:[-27,-20.5],arc:[-35,-20.5],wHallSto:[-27,-.5],sto:[-35,-.5],
};
export const NAV_EDGES=[
 ['control','dW'],['dW','workshop'],['control','dE'],['dE','extraction'],['control','dCR'],['dCR','reactor'],['workshop','dWP'],['dWP','pumps'],['extraction','dEC'],['dEC','containment'],
 ['pumps','dPR'],['dPR','reactor'],['reactor','dRC'],['dRC','containment'],['reactor','coreGate'],['coreGate','coreW'],['coreGate','coreE'],['coreW','coreS'],['coreE','coreS'],
 ['containment','burnGate'],['burnGate','burn'],
 ['extraction','eMouth'],['eMouth','eTun'],['eTun','eHallS'],['eHallS','eHallSub'],['eHallSub','sub'],['eHallS','ePass'],['ePass','eHallBar'],['eHallBar','bar'],['ePass','passE'],['passE','lift'],
 ['pumps','wMouth'],['wMouth','wTun'],['wTun','wHallN'],['wHallN','wHallArc'],['wHallArc','arc'],['wHallN','wHallSto'],['wHallSto','sto'],
];
export function navPath(from,to){
 const near=p=>Object.entries(NAV).reduce((b,[k,[x,z]])=>{const d=Math.hypot(p.x-x,p.z-z);return d<b.d?{k,d}:b;},{k:null,d:Infinity}).k;
 const start=near(from),goal=near(to),adj={};
 for(const [a,b] of NAV_EDGES){(adj[a]??=[]).push(b);(adj[b]??=[]).push(a);}
 const dist={[start]:0},prev={},open=new Set([start]);
 while(open.size){
  let u=null;for(const k of open)if(u===null||dist[k]<dist[u])u=k;open.delete(u);if(u===goal)break;
  for(const v of adj[u]||[]){const d=dist[u]+Math.hypot(NAV[u][0]-NAV[v][0],NAV[u][1]-NAV[v][1]);if(d<(dist[v]??Infinity)){dist[v]=d;prev[v]=u;open.add(v);}}
 }
 const path=[];for(let k=goal;k;k=prev[k])path.unshift({x:NAV[k][0],z:NAV[k][1],id:k});
 return path;
}
