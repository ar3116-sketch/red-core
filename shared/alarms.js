export function alarmState(temp,pressure,blackout,filterReady=false,containmentNotice=false){
 if(temp>=85)return {id:'reactor',label:temp>=95?'REACTOR / MELTDOWN IMMINENT':'REACTOR / HIGH TEMPERATURE',color:0xcd492e};
 if(blackout)return {id:'power',label:'POWER / BREAKER TRIPPED',color:0xc89742};
 if(pressure>=65||(!filterReady&&temp>=65))return {id:'coolant',label:'COOLANT / FLOW RESTRICTED',color:0xc88c32};
 if(containmentNotice)return {id:'containment',label:'CONTAINMENT / SAMPLE SAFE OPENED',color:0xbca266};
 return {id:'normal',label:'',color:0x2c3a27};
}
