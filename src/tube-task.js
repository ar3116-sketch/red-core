import {tubeContact} from '../shared/tubes.js';
import {rotaryControl} from './rotary-control.js';
export function createTubeTask(onTurn,onClose){
 const panel=document.getElementById('tube-panel'),controls=[],glows=[],labels=[];
 for(let i=0;i<3;i++){
  const row=document.createElement('div');row.className='tube-instrument';
  const label=document.createElement('div');label.className='instrument-label';label.textContent='TUBE '+(i+1);
  const glow=document.createElement('div');glow.className='tube-glass';glow.setAttribute('aria-hidden','true');glows.push(glow);
  const control=rotaryControl({label:'Tube '+(i+1)+' tightening',glass:true,onChange:value=>onTurn(i,value)});controls.push(control);
  const feedback=document.createElement('div');feedback.className='contact-label';labels.push(feedback);
  row.append(label,glow,control.root,feedback);document.getElementById('tube-sockets').append(row);
 }
 const api={get isOpen(){return !panel.hidden;},open(){panel.hidden=false;document.getElementById('tube-close').focus();},close(){panel.hidden=true;onClose();},update(s){if(panel.hidden)return;for(let i=0;i<3;i++){const contact=tubeContact(s,i);controls[i].update(s.values[i],s.powered);glows[i].className='tube-glass '+contact;labels[i].textContent=contact==='lit'?'CONTACT OK':contact==='weak'?'WEAK CONTACT':'NO CONTACT';}document.getElementById('tube-status').textContent=s.powered?'ALL TUBES STABLE / CAMERAS ONLINE':'FIND THE GLOW, THEN BACK OFF IF IT FADES. ALL THREE MUST STAY LIT.';}};
 document.getElementById('tube-close').onclick=()=>api.close();return api;
}
