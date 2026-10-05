// The grip bar: a cursor sweeps once per heartbeat; press when it crosses the bright zone.
// Used for hanging from a lip and for tearing free of duct tape.
export function createBeatBar(){
 const $=id=>document.getElementById(id);
 const panel=$('beat'),cursor=$('beat-cursor'),zone=$('beat-zone'),track=$('beat-track'),score=$('beat-score');
 let mode=null,start=0,interval=600,window=.17,pressed=-1,lastCycle=-1,flashUntil=0;
 const api={
  get mode(){return mode;},
  show(next,{interval:i,window:w}){if(mode!==next){mode=next;start=performance.now();pressed=-1;lastCycle=-1;}interval=i;window=w;panel.hidden=false;},
  hide(){mode=null;panel.hidden=true;},
  // Returns true/false for a hit/miss, or null if this beat was already used.
  press(now=performance.now()){
   if(!mode)return null;
   const t=(now-start)/interval,cycle=Math.floor(t),phase=t-cycle;
   if(cycle===pressed)return null;pressed=cycle;
   const hit=Math.abs(phase-.5)<=window/2;
   track.classList.remove('hit','miss');void track.offsetWidth;track.classList.add(hit?'hit':'miss');flashUntil=now+180;
   return hit;
  },
  // Returns true once per beat as the cursor reaches the centre, for the heartbeat thump.
  update(now,{title,hands,value,help}){
   if(!mode)return false;
   const t=(now-start)/interval,cycle=Math.floor(t),phase=t-cycle;
   cursor.style.left=`calc(${phase*100}% - 2px)`;zone.style.left=(50-window*50)+'%';zone.style.width=(window*100)+'%';
   score.style.width=Math.max(0,Math.min(100,value))+'%';
   $('beat-title').textContent=title;$('beat-hands').textContent=hands;$('beat-help').textContent=help;
   if(now>flashUntil)track.classList.remove('hit','miss');
   const beat=phase>=.5&&cycle!==lastCycle;if(beat)lastCycle=cycle;return beat;
  },
 };
 return api;
}
