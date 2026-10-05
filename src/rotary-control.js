// Mouse, touch and keyboard all turn the same physical control.
export function rotaryControl({label,step=1,onChange,glass=false}){
 const root=document.createElement('div');root.className='rotary-control';
 const dial=document.createElement('div');dial.className='machine-dial'+(glass?' tube-dial':'');dial.tabIndex=0;dial.setAttribute('role','slider');dial.setAttribute('aria-label',label);dial.setAttribute('aria-valuemin','0');dial.setAttribute('aria-valuemax','100');
 const rotor=document.createElement('i');rotor.className='dial-rotor';rotor.setAttribute('aria-hidden','true');dial.append(rotor);
 const valueLabel=document.createElement('span');valueLabel.className='dial-value';
 const minus=document.createElement('button'),plus=document.createElement('button');minus.textContent='−';plus.textContent='+';minus.setAttribute('aria-label',label+' decrease');plus.setAttribute('aria-label',label+' increase');
 const controls=document.createElement('div');controls.className='dial-buttons';controls.append(minus,valueLabel,plus);root.append(dial,controls);
 let value=0,disabled=false,startY=0,startValue=0,dragging=false;
 const set=v=>{if(disabled)return;const next=Math.max(0,Math.min(100,Math.round(v/step)*step));if(next===value)return;value=next;paint();onChange(next);};
 function paint(){rotor.style.transform=`rotate(${-135+value*2.7}deg)`;valueLabel.textContent=value+'%';dial.setAttribute('aria-valuenow',value);dial.setAttribute('aria-valuetext',value+' percent');}
 dial.onpointerdown=e=>{if(disabled)return;e.preventDefault();dial.focus();dial.setPointerCapture(e.pointerId);startY=e.clientY;startValue=value;dragging=true;};
 dial.onpointermove=e=>{if(dragging)set(startValue+(startY-e.clientY)*.55);};
 dial.onpointerup=dial.onpointercancel=()=>{dragging=false;};
 dial.onkeydown=e=>{const d={ArrowUp:step,ArrowRight:step,ArrowDown:-step,ArrowLeft:-step}[e.key];if(d!==undefined){e.preventDefault();set(value+d);}if(e.key==='Home'||e.key==='End'){e.preventDefault();set(e.key==='Home'?0:100);}};
 dial.onwheel=e=>{e.preventDefault();set(value+(e.deltaY<0?step:-step));};minus.onclick=()=>set(value-step);plus.onclick=()=>set(value+step);
 return {root,dial,update(v,locked=false){disabled=locked;minus.disabled=plus.disabled=locked;dial.setAttribute('aria-disabled',locked);dial.classList.toggle('locked',locked);if(!dragging||locked){value=v;paint();}}};
}
