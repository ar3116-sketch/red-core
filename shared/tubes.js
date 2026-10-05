export const TUBE_RACK={x:-20,y:0,z:-1};
export function createTubes(seed='solo'){
 let h=17;for(const c of seed)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;
 return {values:[0,0,0],targets:[0,1,2].map(i=>24+2*((h>>>(i*7))%29)),powered:false};
}
export const tubeContact=(s,i)=>Math.abs(s.values[i]-s.targets[i])<=3?'lit':Math.abs(s.values[i]-s.targets[i])<=12?'weak':'dark';
export function turnTube(s,index,value){
 if(s.powered||!Number.isInteger(index)||index<0||index>2||!Number.isFinite(value)||value<0||value>100)return false;
 s.values[index]=Math.round(value);s.powered=s.values.every((_,i)=>tubeContact(s,i)==='lit');return true;
}
