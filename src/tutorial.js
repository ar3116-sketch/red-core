import {roomAt} from '../shared/world.js';
// Training shift: a coach walks one player through the real game on a private server room.
// Each step names a place, an action, and a condition the server state can confirm.
export function createTutorial({send,done}){
 const coach=document.getElementById('coach');
 let i=-1,stepStart=0,turned=0,lastYaw=null,fired=false,hits=0;
 const room=p=>roomAt(p.x,p.z)?.id;
 const steps=[
  {title:'01 / LOOK',text:'Click the screen to capture the mouse, then look around. On a phone, drag the right pad.',done:c=>turned>2.4},
  {title:'02 / WALK',text:'W A S D to walk. Go north through the doorway into the REACTOR HALL. TAB opens the map.',done:c=>room(c.position)==='reactor'},
  {title:'03 / THE REACTOR',text:'Walk up to the cable harness beside the reactor console and press E. Drag the brass pegs until no cable crosses another. Crossed cables glow red.',done:c=>c.state.console||c.me.tasks>0},
  {title:'04 / TOOLS',text:'The core heats up all shift long. Your jobs push it back down. West through CONTROL is the WORKSHOP: look at a wrench on the bench and press E.',done:c=>c.held==='wrench'},
  {title:'05 / LEAKS',text:'South into the PUMP ROOM. Stand at the leaking flange (amber lamp) and HOLD E until all three bolts seat.',done:c=>(c.state.tools?.jobs?.['pump-leak']??0)>=3},
  {title:'06 / THE SHAFTS',text:'West through the WEST TUNNEL into the WEST HALL. The open shaft runs along the far side. Find the broken railing with the yellow plate and stand right next to it.',done:c=>c.position.x<-27.3&&c.position.x>-28.6&&c.position.z<-12.4&&c.position.z>-14.6,
   then:c=>{send({t:'tut',kind:'shove',dx:-1,dz:0});}},
  {title:'07 / HOLD ON',text:'You went over. Hit SPACE (or tap) when the cursor crosses the bright zone. Below 50% you lose a hand. At 0% you fall and die. Land 6 beats.',done:c=>hits>=6||c.me.state==='ok'&&Date.now()-stepStart>3000,
   then:c=>{send({t:'tut',kind:'rescue'});}},
  {title:'08 / THE NEIGHBOUR',text:'In a real shift another engineer holds E beside you to pull you up. Now watch the floor of this hall. Specimen-09 is invisible when still. When it moves you see only a shadow.',done:c=>Date.now()-stepStart>14000,
   start:()=>send({t:'tut',kind:'stalker'})},
  {title:'09 / TRUST NOBODY',text:'With 4 or more players, one engineer is a saboteur. Their reactor cycles ADD heat; the console screen shows the last cycle. F shoves. Two people holding T on the same person tape them to a pipe.',done:c=>Date.now()-stepStart>14000},
  {title:'10 / THE SCIF',text:'The CAMERA ROOM is west of the WORKSHOP. Its door keypad wants a 4-digit code: work out the clue note, or tune the shortwave radio in the BARRACKS. Inside, seat 3 vacuum tubes for power. Then the CCTV shows the specimen in cyan, and the SCIF radio sends a callout to one engineer, ten seconds late.',done:c=>Date.now()-stepStart>12000},
  {title:'TRAINING COMPLETE',text:'That is the shift. Host a room, send the code, and do not stand next to a broken rail.',done:c=>Date.now()-stepStart>7000,then:()=>done()},
 ];
 function show(){const s=steps[i];coach.hidden=false;coach.innerHTML=`<b>TRAINING ${s.title}</b>${s.text}`;}
 function next(c){if(i>=0)steps[i].then?.(c);i++;if(i>=steps.length){coach.hidden=true;return;}stepStart=Date.now();fired=false;steps[i].start?.(c);show();}
 return {
  start(){i=-1;turned=0;lastYaw=null;hits=0;next({});},
  stop(){i=steps.length;coach.hidden=true;},
  beat(hit){if(hit)hits++;},
  update(c){
   if(i<0||i>=steps.length)return;
   if(lastYaw!==null)turned+=Math.abs(c.yaw-lastYaw);lastYaw=c.yaw;
   if(!fired&&steps[i].done(c)){fired=true;next(c);}
  },
 };
}
