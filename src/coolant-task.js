import {rotaryControl} from './rotary-control.js';
import {readings,coolantTarget} from '../shared/coolant.js';
export function createCoolantTask(onAdjust,onClose){
 const panel=document.getElementById('coolant-panel'),status=document.getElementById('coolant-status');
 let state;const controls={};
 for(const key of ['intake','bypass']){const input=document.getElementById('coolant-'+key);const control=rotaryControl({label:key+' valve',step:5,onChange:value=>{if(state)onAdjust(key,value);}});input.replaceWith(control.root);controls[key]=control;}
 const api={get isOpen(){return !panel.hidden;},open(){panel.hidden=false;document.getElementById('coolant-close').focus();},close(){panel.hidden=true;onClose();},update(s){
  state=s;if(panel.hidden)return;
  const value=readings(s.intake,s.bypass),target=coolantTarget(s);
  for(const key of ['intake','bypass']){controls[key].update(s[key],s.cooldown>0);document.getElementById('coolant-'+key+'-value').textContent=s[key]+'%';}
  for(const key of ['flow','pressure']){document.getElementById('coolant-'+key+'-reading').textContent=`${value[key]} / TARGET ${target[key]}`;document.getElementById('coolant-'+key+'-meter').style.width=Math.max(0,value[key])+'%';document.getElementById('coolant-'+key+'-target').style.left=target[key]+'%';}
  document.getElementById('coolant-hold').style.width=s.progress/3*100+'%';
  status.textContent=s.cooldown>0?`FLUSH COMPLETE / CORE -8 / READY IN ${Math.ceil(s.cooldown)}S`:!s.filterReady?'FILTER BANK BLOCKED / PROCESS 3 FILTERS AT INCINERATOR':s.progress>0?`STABLE / HOLD ${s.progress.toFixed(1)} OF 3S`:'ALIGN BOTH GAUGES WITH THE AMBER MARKS.';
 }};document.getElementById('coolant-close').onclick=()=>api.close();return api;
}
