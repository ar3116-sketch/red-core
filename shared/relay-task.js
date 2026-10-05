// A small, seeded wiring deduction followed by a physical start-up sequence.
export function relayBlueprint(seed,cycle=0){
 let h=2166136261;for(const c of `${seed}/${cycle}`)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;
 const random=()=>((h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296);
 const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 const names=shuffle(['PUMP','SENSOR','DAMPER','FAN','RELAY','VALVE']).slice(0,3);
 const volts=shuffle([12,24,48]);
 const loads=names.map((name,i)=>({name,volts:volts[i]}));
 return {sources:shuffle([12,24,48]),loads,order:shuffle([0,1,2])};
}
export function createRelay(seed='solo'){return {seed,cycle:0,wires:[-1,-1,-1],stage:'wire',started:0,readyAt:0,blockedUntil:0,message:'MATCH THE FEEDS TO THE SERVICE CARD.'};}
export function refreshRelay(s,now){
 if(s.stage==='done'&&now>=s.readyAt){s.cycle++;s.wires=[-1,-1,-1];s.stage='wire';s.started=0;s.message='NEW SERVICE CARD / PATCH THE NEXT CIRCUIT.';}
}
export function relayAction(s,a,now){
 refreshRelay(s,now);
 if(!a||a.cycle!==s.cycle||now<s.blockedUntil||s.stage==='done')return {ok:false,completed:false};
 const b=relayBlueprint(s.seed,s.cycle),valid=i=>Number.isInteger(i)&&i>=0&&i<3;
 if(a.kind==='wire'&&s.stage==='wire'&&valid(a.source)&&valid(a.load)){
  s.wires=s.wires.map((v,i)=>i!==a.source&&v===a.load?-1:v);s.wires[a.source]=a.load;s.message='PATCH CONNECTED / RUN CONTINUITY TEST.';return {ok:true,completed:false};
 }
 if(a.kind==='test'&&s.stage==='wire'){
  const bad=s.wires.findIndex((load,i)=>load<0||b.loads[load].volts!==b.sources[i]);
  if(bad>=0){s.wires[bad]=-1;s.blockedUntil=now+800;s.message=`FEED ${bad+1} FAULT / CHECK ITS VOLTAGE. OTHER PATCHES KEPT.`;return {ok:false,completed:false};}
  s.stage='start';s.message='CONTINUITY GOOD / START BREAKERS IN SERVICE-CARD ORDER.';return {ok:true,completed:false};
 }
 if(a.kind==='breaker'&&s.stage==='start'&&valid(a.load)){
  if(a.load!==b.order[s.started]){s.blockedUntil=now+800;s.message='INTERLOCK / READ THE START-UP INTERLOCKS. PROGRESS KEPT.';return {ok:false,completed:false};}
  s.started++;
  if(s.started===3){s.stage='done';s.readyAt=now+25000;s.message='CIRCUIT RUNNING / SERVICE COMPLETE.';return {ok:true,completed:true};}
  s.message=`BREAKER ${s.started}/3 ENGAGED / NEXT CIRCUIT.`;return {ok:true,completed:false};
 }
 return {ok:false,completed:false};
}
