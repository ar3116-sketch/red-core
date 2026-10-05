import qrcode from 'qrcode-generator';
import {ROLE_TEXT,roleCounts,outcomeText} from '../shared/match.js';
const $=id=>document.getElementById(id);
const MODES=['home','howto','lobby','briefing','shift','over'];

export function setMode(mode){for(const m of MODES)document.body.classList.toggle('mode-'+m,m===mode);document.body.dataset.mode=mode;}
export const getMode=()=>document.body.dataset.mode||'home';
export function setRole(role){for(const r of ['crew','saboteur','specimen'])document.body.classList.toggle('role-'+r,r===role);}

export function inviteLink(code){const u=new URL(location.href);u.search='';u.hash='';u.searchParams.set('room',code);return u.toString();}
let qrFor='';
function drawQr(code){
 if(qrFor===code)return;qrFor=code;
 const qr=qrcode(0,'M');qr.addData(inviteLink(code));qr.make();
 const n=qr.getModuleCount(),canvas=$('lobby-qr'),ctx=canvas.getContext('2d'),s=Math.floor(132/n),o=Math.floor((132-s*n)/2);
 ctx.fillStyle='#e8e0bd';ctx.fillRect(0,0,132,132);ctx.fillStyle='#10130d';
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(qr.isDark(y,x))ctx.fillRect(o+x*s,o+y*s,s,s);
}
export function renderLobby(state,me,code){
 $('lobby-code').textContent=code;drawQr(code);
 const host=state.host===me.id,list=state.lobby||[];
 $('lobby-list').replaceChildren(...list.map(p=>{const li=document.createElement('li');li.className=(p.ready?'ready ':'')+(p.line===me.line?'me':'');li.innerHTML=`<span>LINE ${p.line}${p.host?' ★':''}</span><i>${p.line===me.line?'YOU / ':''}${p.ready?'READY':'WAITING'}</i>`;return li;}));
 const n=list.length,c=roleCounts(n);
 $('lobby-roles').textContent=n<=1?'ALONE: YOU WORK THE SHIFT, THE STALKER HUNTS YOU. INVITE PEOPLE FOR THE REAL GAME.':`${n} PLAYERS: ${c.crew} ENGINEER${c.crew>1?'S':''} / ${c.saboteur?'1 SABOTEUR / ':''}1 SPECIMEN. ROLES ARE SECRET.${n<4?' A SABOTEUR JOINS AT 4 PLAYERS.':''}`;
 $('start').hidden=!host;$('start').disabled=!host;
 $('ready').textContent=list.find(p=>p.line===me.line)?.ready?'NOT READY':'READY';
 const ready=list.filter(p=>p.ready).length;
 $('lobby-wait').textContent=host?`${ready}/${n} READY. YOU ARE THE HOST: START WHEN EVERYONE IS IN.`:'WAITING FOR THE HOST TO START THE SHIFT.';
}
export function renderBriefing(me,left){
 const t=ROLE_TEXT[me.role]||ROLE_TEXT.crew;
 const card=document.querySelector('.briefing-card');card.className='briefing-card '+(me.role||'');
 $('brief-role').textContent=t.title;$('brief-goal').textContent=t.goal;
 if($('brief-how').dataset.role!==me.role){$('brief-how').dataset.role=me.role;$('brief-how').replaceChildren(...t.how.map(h=>Object.assign(document.createElement('li'),{textContent:h})));}
 $('brief-radio').textContent=me.role==='specimen'?'NO RADIO. YOU HEAR EVERYTHING ANYWAY.':`YOUR RADIO: LINE ${me.line} / ${me.callsign}. THE SCIF OPERATOR CAN REACH YOU, TEN SECONDS LATE.`;
 $('brief-time').textContent=Math.ceil(left);
}
export function renderOver(state,me){
 const o=state.outcome,text=outcomeText[o.kind]||{title:o.kind,line:''};
 $('over-title').textContent=text.title;$('over-line').textContent=text.line;
 const won=o.winners.includes(me.id);
 $('over-you').textContent=me.role?(won?'YOU WON.':'YOU LOST.'):'YOU WATCHED.';
 const roleName={crew:'ENGINEER',saboteur:'SABOTEUR',specimen:'SPECIMEN-09'};
 const status={ok:'ALIVE',hanging:'HANGING',taped:'TAPED',dead:'FELL',escaped:'ESCAPED',spectator:'WATCHING'};
 $('over-roster').tBodies[0].replaceChildren(...o.roster.map(p=>{const tr=document.createElement('tr');tr.className=(o.winners.includes(p.id)?'win ':'')+(p.id===me.id?'me':'');
  tr.innerHTML=`<td>${p.bot?'—':p.line}</td><td>${p.callsign}</td><td>${roleName[p.role]||'—'}</td><td>${status[p.state]||p.state}</td><td>${p.stats.tasks}</td><td>${p.stats.sabotage}</td><td>${p.stats.rescues}</td><td>${p.stats.shoves+p.stats.lunges}</td>`;return tr;}));
 const host=state.host===me.id;$('again').hidden=!host;$('over-wait').textContent=host?'':'THE HOST CAN START A NEW SHIFT.';
}
export function bindCopy(getCode){$('copy-link').onclick=async()=>{const link=inviteLink(getCode());try{await navigator.clipboard.writeText(link);$('copy-status').textContent='COPIED: '+link;}catch{$('copy-status').textContent=link;}};}
