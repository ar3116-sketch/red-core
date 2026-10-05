export const COOLANT_STATION={x:-6,y:-3.2,z:28.5};
export const COOLANT_RANGE=2.2;
const settings=[[65,35],[55,45],[75,25],[60,60]];
export const readings=(intake,bypass)=>({flow:Math.round(intake-bypass*.4),pressure:Math.round(intake*.65+bypass*.35)});
export function createCoolantState(seed='solo'){
 let hash=0;for(const c of seed)hash=(hash*31+c.charCodeAt(0))>>>0;
 return {intake:25,bypass:75,cycle:hash%settings.length,progress:0,cooldown:0,completions:0,filterReady:false,filterProgress:0,lastFeed:0};
}
export const coolantTarget=s=>readings(...settings[s.cycle%settings.length]);
export const atCoolantStation=p=>Math.hypot(p.x-COOLANT_STATION.x,(p.y??0)-COOLANT_STATION.y,p.z-COOLANT_STATION.z)<=COOLANT_RANGE;
export function setCoolant(s,intake,bypass){
 if(s.cooldown>0||![intake,bypass].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100&&v%5===0))return false;
 s.intake=intake;s.bypass=bypass;return true;
}
export function updateCoolant(s,dt,operatorPresent){
 if(s.cooldown>0){s.cooldown=Math.max(0,s.cooldown-dt);if(s.cooldown===0){s.cycle++;s.intake=25;s.bypass=75;}return false;}
 if(!s.filterReady){s.progress=0;return false;}
 const value=readings(s.intake,s.bypass),target=coolantTarget(s);
 const aligned=Math.abs(value.flow-target.flow)<=2&&Math.abs(value.pressure-target.pressure)<=2;
 s.progress=operatorPresent&&aligned?Math.min(3,s.progress+dt):0;
 if(s.progress<3)return false;
 s.progress=0;s.cooldown=45;s.completions++;s.filterReady=false;s.filterProgress=0;return true;
}
