// Radwaste haul: canisters stacked beside the reactor core go to the hopper on the incinerator's
// side. The suit's thick gloves cannot hold them properly, so the carrier keeps re-gripping.
export const WASTE_RACK={x:8.05,y:0,z:-25.3,stand:{x:7.1,z:-25.3}};
export const WASTE_HOPPER={x:20.0,y:0,z:-14.95,rot:Math.PI/2,stand:{x:20.0,z:-14.0}};
export const WASTE={batch:3,refill:75,carrySpeed:.65,temp:-3,reach:1.5,pickReach:1.4};
export const nearWaste=(p,w)=>Math.abs(p.y??0)<.8&&Math.hypot(p.x-w.stand.x,p.z-w.stand.z)<=WASTE.reach;

// The grip, run on the carrier's client. Holding squeezes, but a hand held shut cramps; the glove
// slips in jolts (more often while walking) and only a fresh squeeze right after a jolt wins it back.
export const GRIP={start:70,hold:12,cramp:2.6,crampLoss:14,sag:3,
 jolt:{walking:[1.0,1.7],still:[2.2,3.2],loss:[22,36]},resqueeze:.5,resqueezeGain:30,squeezeGain:4,fumbleGap:.5,fumble:6};

export function createGrip(rand=Math.random){
 const g={value:GRIP.start,held:false,heldFor:0,nextJolt:1.5,sinceJolt:9,sincePress:9,flash:0,fumbled:0};
 // A squeeze right after a slip wins the canister back; squeezing again too soon just shifts it.
 g.press=()=>{if(g.held)return 0;g.held=true;g.heldFor=0;
  const gain=g.sinceJolt<GRIP.resqueeze?GRIP.resqueezeGain:g.sincePress<GRIP.fumbleGap?-GRIP.fumble:GRIP.squeezeGain;g.sincePress=0;
  g.value=Math.min(100,g.value+gain);if(gain===GRIP.resqueezeGain){g.sinceJolt=9;g.flash=.3;}if(gain<0)g.fumbled=.3;return gain;};
 g.release=()=>{g.held=false;};
 // Returns 'jolt' when the canister slips this frame, 'drop' when it is gone.
 g.update=(dt,walking)=>{
  let event=null;g.flash=Math.max(0,g.flash-dt);g.fumbled=Math.max(0,g.fumbled-dt);g.sinceJolt+=dt;g.sincePress+=dt;
  if(g.held){g.heldFor+=dt;g.value+=g.heldFor<GRIP.cramp?GRIP.hold*dt:-GRIP.crampLoss*dt;}else g.value-=GRIP.sag*dt;
  g.nextJolt-=dt;
  if(g.nextJolt<=0){const [a,b]=walking?GRIP.jolt.walking:GRIP.jolt.still;g.nextJolt=a+rand()*(b-a);const [l,h]=GRIP.jolt.loss;g.value-=l+rand()*(h-l);g.sinceJolt=0;event='jolt';}
  g.value=Math.min(100,g.value);if(g.value<=0){g.value=0;event='drop';}
  return event;
 };
 return g;
}
