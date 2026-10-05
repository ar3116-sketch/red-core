import {relayBlueprint} from '../shared/relay-task.js';
export function createRelayTask(onAction,onClose){
 const panel=document.getElementById('relay-panel'),board=document.getElementById('relay-board'),status=document.getElementById('relay-status');
 let state,signature='',selected=-1,fromDrag=-1,suppressClick=false;
 const sources=[],loads=[],breakers=[],paths=[];
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 400 180');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('patch-leads');svg.setAttribute('aria-hidden','true');board.append(svg);
 function connect(load){if(selected<0)return;onAction({kind:'wire',source:selected,load});selected=-1;paint();}
 for(let i=0;i<3;i++){
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('class','lead lead-'+i);svg.append(path);paths.push(path);
  const source=document.createElement('button');source.className='patch-port source port-'+i;source.style.gridRow=i+1;
  source.onclick=()=>{if(suppressClick){suppressClick=false;return;}selected=i;paint();};
  source.onpointerdown=e=>{if(source.disabled)return;suppressClick=false;fromDrag=i;source.setPointerCapture(e.pointerId);};
  source.onpointerup=e=>{if(fromDrag<0)return;const load=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-load]');if(load){suppressClick=true;selected=fromDrag;connect(Number(load.dataset.load));e.preventDefault();}fromDrag=-1;};
  source.onpointercancel=()=>{fromDrag=-1;};
  const load=document.createElement('button');load.dataset.load=i;load.className='patch-port load';load.style.gridRow=i+1;load.onclick=()=>connect(i);
  board.append(source,load);sources.push(source);loads.push(load);
  const breaker=document.createElement('button');breaker.className='relay-breaker';breaker.onclick=()=>onAction({kind:'breaker',load:i});document.getElementById('relay-breakers').append(breaker);breakers.push(breaker);
 }
 function paint(){if(!state)return;const b=relayBlueprint(state.seed,state.cycle);const sig=state.seed+'/'+state.cycle;
  if(sig!==signature){signature=sig;selected=-1;document.getElementById('relay-card').textContent=b.loads.map(l=>`${l.name} = ${l.volts}V`).join('   /   ');document.getElementById('relay-order').textContent=`${b.loads[b.order[1]].name} before ${b.loads[b.order[2]].name}. ${b.loads[b.order[0]].name} before ${b.loads[b.order[1]].name}.`;}
  for(let i=0;i<3;i++){
   const target=state.wires[i];sources[i].textContent=`${i+1} / ${b.sources[i]}V`;sources[i].setAttribute('aria-label',`Feed ${i+1}, ${b.sources[i]} volts`);sources[i].setAttribute('aria-pressed',selected===i);sources[i].disabled=state.stage!=='wire';
   loads[i].textContent=b.loads[i].name;loads[i].setAttribute('aria-label',`Socket ${b.loads[i].name}`);loads[i].disabled=state.stage!=='wire';
   paths[i].setAttribute('d',target<0?'':`M 103 ${i*60+30} C 170 ${i*60+30},230 ${target*60+30},297 ${target*60+30}`);
   const on=b.order.slice(0,state.started).includes(i);breakers[i].textContent=b.loads[i].name+' / '+(on?'ON':'OFF');breakers[i].setAttribute('aria-pressed',on);breakers[i].disabled=state.stage!=='start'||on;
  }
  document.getElementById('relay-help').textContent=state.stage==='wire'?'Match feeds to the service card. Drag between sockets, or click both.':state.stage==='start'?'Use the two interlock clues to work out which breaker starts first, second and last.':'Service complete. You can leave the panel.';board.hidden=state.stage!=='wire';document.getElementById('relay-breakers').hidden=state.stage==='wire';document.getElementById('relay-test').hidden=state.stage!=='wire';document.getElementById('relay-test').disabled=state.stage!=='wire';document.getElementById('relay-stage').textContent=state.stage==='wire'?'01 / PATCH CIRCUITS':state.stage==='start'?'02 / ENGAGE BREAKERS':'03 / RUNNING';
  status.textContent=state.stage==='done'?`${state.message} NEXT CHECK IN ${Math.max(0,Math.ceil((state.readyAt-Date.now())/1000))}S`:state.message;
 }
 const api={get isOpen(){return !panel.hidden;},open(s){state=s;panel.hidden=false;paint();document.getElementById('relay-title').focus({preventScroll:true});panel.scrollTop=0;},close(){panel.hidden=true;selected=-1;onClose();},update(s){state=s;if(!panel.hidden)paint();}};
 document.getElementById('relay-test').onclick=()=>onAction({kind:'test'});document.getElementById('relay-close').onclick=()=>api.close();return api;
}
