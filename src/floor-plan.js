import {ROOMS,WALLS,roomAt} from '../shared/world.js';
import {DECKS,RAMPS} from '../shared/sewer.js';
import {WING_SPACES,SHAFTS} from '../shared/wings.js';
export function createFloorPlan(canOpen=()=>true) {
 const panel=document.getElementById('floor-plan'),button=document.getElementById('map-toggle');
 const canvas=document.getElementById('map-canvas'),ctx=canvas.getContext('2d');
 function toggle(){panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));}
 button.onclick=toggle;document.getElementById('map-close').onclick=()=>{panel.hidden=true;button.setAttribute('aria-expanded','false');};
 addEventListener('keydown',event=>{if(event.code==='Tab'&&!(event.target instanceof HTMLInputElement)&&canOpen()){event.preventDefault();if(!event.repeat)toggle();}});
 let previous=0;
 return {
  get isOpen(){return !panel.hidden;},close(){panel.hidden=true;},
  update(position,yaw,now){
  const level=position.z>5&&Math.abs(position.x)<18?(position.y< -3?' / LOWER':position.y<-.1?' / STAIRS':' / UPPER'):'';
  document.getElementById('location').textContent=(roomAt(position.x,position.z)?.name||'PASSAGE')+level;
  if(panel.hidden||now-previous<100)return;previous=now;
  const scale=5.8,x=v=>12+(v+42)*scale,z=v=>16+(v+30)*scale;
  ctx.fillStyle='#10190f';ctx.fillRect(0,0,560,512);
  ctx.font='8px Object86, monospace';ctx.textAlign='center';
  const rect=(s,color)=>{ctx.fillStyle=color;ctx.fillRect(x(s.minX),z(s.minZ),(s.maxX-s.minX)*scale,(s.maxZ-s.minZ)*scale);};
  const label=(text,cx,cz)=>{ctx.fillStyle='#c3cba4';text.split(' ').forEach((line,i)=>ctx.fillText(line,x(cx),z(cz)-4+i*10));};
  for(const room of ROOMS){ctx.globalAlpha=.3;rect({minX:room.x-5,maxX:room.x+5,minZ:room.z-5,maxZ:room.z+5},'#'+room.color.toString(16).padStart(6,'0'));ctx.globalAlpha=1;label(room.name,room.x,room.z);}
  for(const s of WING_SPACES){ctx.globalAlpha=s.kind==='room'?.3:.18;rect(s,'#'+s.color.toString(16).padStart(6,'0'));ctx.globalAlpha=1;if(s.kind!=='tunnel')label(s.name,(s.minX+s.maxX)/2-(s.kind==='hall'?(s.minX>0?1.4:-1.4):0),(s.minZ+s.maxZ)/2);}
  for(const s of SHAFTS)rect(s,'#040604');
  rect({minX:-8,maxX:8,minZ:-29,maxZ:-15},'#304347');ctx.strokeStyle='#78a6b0';ctx.beginPath();ctx.arc(x(0),z(-22),4.1*scale,0,Math.PI*2);ctx.stroke();label('CORE',0,-22);
  rect({minX:-23,maxX:-15,minZ:-5,maxZ:3},'#394739');rect({minX:15,maxX:23,minZ:-15,maxZ:-5},'#5b4530');label('CAMERAS',-19,-1);label('BURN',19,-9);
  rect({minX:-18,maxX:18,minZ:5,maxZ:37},'#22392f');
  for(const d of DECKS)rect(d,'#64684a');
  for(const r of RAMPS)rect(r,'#ad8e46');
  for(const c of [-8,8])rect({minX:c-1.55,maxX:c+1.55,minZ:37,maxZ:46},'#304e40');
  label('SEWER',0,20);
  ctx.fillStyle='#acb48e';for(const w of WALLS)ctx.fillRect(x(w.x-w.w/2),z(w.z-w.d/2),Math.max(1,w.w*scale),Math.max(1,w.d*scale));
  ctx.save();ctx.translate(x(position.x),z(position.z));ctx.rotate(-yaw);ctx.fillStyle='#fff1b4';ctx.strokeStyle='#0b100b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(-5,5);ctx.lineTo(5,5);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.fillStyle='#afba91';ctx.textAlign='left';ctx.fillText('BLACK: OPEN SHAFT  /  GOLD: STAIRS  /  GREEN: SEWER BASIN',12,500);
 }};
}
