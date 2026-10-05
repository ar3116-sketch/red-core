export const CAMERA_PANEL={x:-14,y:0,z:-3.3};
export const INCINERATOR={x:21,y:0,z:-8};
export const SERVICE_LADDER={x:18.6,y:-2.4,z:-11.6};
export const nearStation=(p,s,r=2.1)=>Math.hypot(p.x-s.x,(p.y??0)-s.y,p.z-s.z)<=r;
export function accessPuzzle(seed='solo'){
 let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
 const rand=()=>((h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296);
 const names=['FLOW','DOSE','TEMP','LOAD'];
 const order=[...names];for(let i=3;i>0;i--){const j=Math.floor(rand()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 const digits=[1,2,3,4,5,6,7,8,9];for(let i=8;i>0;i--){const j=Math.floor(rand()*(i+1));[digits[i],digits[j]]=[digits[j],digits[i]];}
 const readings=Object.fromEntries(names.map((name,i)=>[name,(2+Math.floor(rand()*6))*10+digits[i]]));
 return {readings,clues:[`${order[2]} is immediately before ${order[3]}.`,`${order[0]} is first.`,`${order[1]} is immediately before ${order[2]}.`],pin:order.map(name=>readings[name]%10).join('')};
}
export function publicAccessPuzzle(seed){const {pin,...puzzle}=accessPuzzle(seed);return puzzle;}
export const incineratorHeat=now=>Math.round((1+Math.sin(now*.0007))*50);
export function feedFilter(s,now){
 if(s.filterReady)return {ok:false,reason:'FILTER BANK ALREADY CLEARED'};
 if(now-s.lastFeed<1200)return {ok:false,reason:'WAIT FOR THE FEED GATE'};
 s.lastFeed=now;const heat=incineratorHeat(now);
 if(heat<40||heat>70){s.filterProgress=Math.max(0,s.filterProgress-1);return {ok:false,reason:'BAD TEMPERATURE / ONE FILTER NEEDS REPROCESSING'};}
 s.filterProgress++;s.filterReady=s.filterProgress>=3;
 return {ok:true,reason:s.filterReady?'FILTER BANK CLEARED / BALANCE COOLANT IN LOWER BASIN':`FILTER ${s.filterProgress} OF 3 PROCESSED`};
}
