import {ROOMS,WALLS,roomAt} from '../shared/world.js';
import {DECKS,RAMPS} from '../shared/sewer.js';
export function createFloorPlan() {
 const panel=document.getElementById('floor-plan'),button=document.getElementById('map-toggle');
 const canvas=document.getElementById('map-canvas'),ctx=canvas.getContext('2d');
 function toggle(){panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));}
 button.onclick=toggle;document.getElementById('map-close').onclick=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');};
 addEventListener('keydown',event=>{if(event.code==='Tab'&&!(event.target instanceof HTMLInputElement)&&document.getElementById('join').hidden&&document.getElementById('chess-panel').hidden&&document.getElementById('coolant-panel').hidden&&document.getElementById('access-panel').hidden&&document.getElementById('burn-panel').hidden&&document.getElementById('tube-panel').hidden){event.preventDefault();if(!event.repeat)toggle();}});
 let previous=0;
 return {update(position,yaw,now){
  const level=position.z>5?(position.y< -3?' / LOWER':position.y<-.1?' / RAMP':' / UPPER'):'';
  document.getElementById('location').textContent=(roomAt(position.x,position.z)?.name||'PASSAGE')+level;
  if(panel.hidden||now-previous<100)return;previous=now;
  const scale=6,x=v=>26+(v+23)*scale,z=v=>20+(v+29)*scale;
  ctx.fillStyle='#10190f';ctx.fillRect(0,0,328,512);
  ctx.font='8px Object86, monospace';ctx.textAlign='center';
  for(const room of ROOMS){
   ctx.fillStyle='#'+room.color.toString(16).padStart(6,'0');ctx.globalAlpha=.25;ctx.fillRect(x(room.x-5),z(room.z-5),60,60);ctx.globalAlpha=1;
   ctx.fillStyle='#c3cba4';room.name.split(' ').forEach((line,i)=>ctx.fillText(line,x(room.x),z(room.z)-8+i*12));
  }
  const rect=(s,color)=>{ctx.fillStyle=color;ctx.fillRect(x(s.minX),z(s.minZ),(s.maxX-s.minX)*scale,(s.maxZ-s.minZ)*scale);};
  rect({minX:-8,maxX:8,minZ:-29,maxZ:-15},'#304347');ctx.strokeStyle='#78a6b0';ctx.beginPath();ctx.arc(x(0),z(-22),4.1*scale,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#c3cba4';ctx.fillText('CORE',x(0),z(-22));
  rect({minX:-23,maxX:-15,minZ:-5,maxZ:3},'#394739');rect({minX:15,maxX:23,minZ:-15,maxZ:-5},'#5b4530');ctx.fillStyle='#c3cba4';ctx.fillText('CAMERAS',x(-19),z(-1));ctx.fillText('BURN',x(19),z(-8));
  rect({minX:-18,maxX:18,minZ:5,maxZ:37},'#22392f');
  for(const d of DECKS)rect(d,'#64684a');
  for(const r of RAMPS){rect(r,'#ad8e46');ctx.fillStyle='#192315';ctx.fillText(r.startY===0?'v':'^',x((r.minX+r.maxX)/2),z((r.minZ+r.maxZ)/2));}
  for(const center of [-8,8])rect({minX:center-1.55,maxX:center+1.55,minZ:37,maxZ:46},'#304e40');
  rect({minX:3,maxX:9,minZ:24,maxZ:31},'#53857b');ctx.fillStyle='#d9c487';ctx.fillRect(x(-6)-3,z(28.5)-3,6,6);ctx.fillStyle='#c3cba4';ctx.fillText('FLOW',x(-6),z(30));
  ctx.fillStyle='#b7c7a1';ctx.fillText('LOWER',x(-5.5),z(20));ctx.fillText('BASIN',x(5.5),z(20));ctx.fillText('GALLERY',x(0),z(35));ctx.fillText('DRAIN 01',x(-8),z(44));ctx.fillText('DRAIN 02',x(8),z(44));
  ctx.fillStyle='#acb48e';for(const w of WALLS)ctx.fillRect(x(w.x-w.w/2),z(w.z-w.d/2),Math.max(1,w.w*scale),Math.max(1,w.d*scale));
  ctx.fillStyle='#ecc276';ctx.fillRect(x(0)-6,z(-22)-6,12,12);
  ctx.save();ctx.translate(x(position.x),z(position.z));ctx.rotate(-yaw);ctx.fillStyle='#fff1b4';ctx.strokeStyle='#0b100b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.fillStyle='#afba91';ctx.textAlign='left';ctx.fillText('GOLD: STAIRS  /  OLIVE: UPPER DECK',20,492);ctx.fillText('GREEN: LOWER BASIN + DRAINS',20,505);
 }};
}
