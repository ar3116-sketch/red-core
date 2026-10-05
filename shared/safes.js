// The three mutagen safes. Specimen-09 opens them to evolve; any order, each a different skill.
export const SAFES=[
 {id:'chess',name:'SAFE 01 / MATE IN ONE',x:10,z:-13.7,stand:{x:10,z:-12.2},range:2},
 {id:'sweeper',name:'SAFE 02 / HOT GRID',x:-35,z:-15.45,stand:{x:-35,z:-16.7},range:2},
 {id:'scope',name:'SAFE 03 / LISSAJOUS SYNC',x:40.55,z:-10,stand:{x:39.2,z:-10},range:2},
];
export const nearSafe=(p,id)=>{const s=SAFES.find(s=>s.id===id);return !!s&&Math.abs(p.y??0)<.8&&Math.hypot(p.x-s.stand.x,p.z-s.stand.z)<=s.range;};
export const safeAt=p=>SAFES.find(s=>nearSafe(p,s.id));
function rng(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return ()=>((h=(Math.imul(h,1664525)+1013904223)>>>0)/4294967296);}

// HOT GRID: 5x5 matrix with four irradiated cells. Row/column Geiger counts plus a few
// neighbour readings; the generator adds readings until exactly one layout fits.
export const GRID=5,HOT=4;
const neighbours=(i)=>{const x=i%GRID,y=Math.floor(i/GRID),out=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<GRID&&ny<GRID)out.push(ny*GRID+nx);}return out;};
function combos(n,k,start=0,acc=[],out=[]){if(acc.length===k){out.push([...acc]);return out;}for(let i=start;i<n;i++){acc.push(i);combos(n,k,i+1,acc,out);acc.pop();}return out;}
const ALL=combos(GRID*GRID,HOT);
function fits(layout,clues){
 const set=new Set(layout);
 for(let r=0;r<GRID;r++)if(layout.filter(i=>Math.floor(i/GRID)===r).length!==clues.rows[r])return false;
 for(let c=0;c<GRID;c++)if(layout.filter(i=>i%GRID===c).length!==clues.cols[c])return false;
 for(const [cell,count] of Object.entries(clues.readings)){if(set.has(+cell))return false;if(neighbours(+cell).filter(n=>set.has(n)).length!==count)return false;}
 return true;
}
export function sweeperPuzzle(seed){
 const rand=rng('grid/'+seed);
 const cells=[...Array(GRID*GRID).keys()];for(let i=cells.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]];}
 const hot=cells.slice(0,HOT).sort((a,b)=>a-b),hotSet=new Set(hot);
 const clues={rows:[...Array(GRID)].map((_,r)=>hot.filter(i=>Math.floor(i/GRID)===r).length),cols:[...Array(GRID)].map((_,c)=>hot.filter(i=>i%GRID===c).length),readings:{}};
 const safe=cells.filter(i=>!hotSet.has(i));
 for(const cell of safe){
  if(ALL.filter(l=>fits(l,clues)).length===1)break;
  clues.readings[cell]=neighbours(cell).filter(n=>hotSet.has(n)).length;
 }
 return {clues,answer:hot};
}
export const publicSweeper=seed=>sweeperPuzzle(seed).clues;
export function checkSweeper(seed,cells){
 const {answer}=sweeperPuzzle(seed);
 if(!Array.isArray(cells)||cells.length!==HOT)return {ok:false,reason:`MARK EXACTLY ${HOT} HOT CELLS.`};
 const marked=[...new Set(cells.map(Number))].sort((a,b)=>a-b);
 const right=marked.filter(c=>answer.includes(c)).length;
 return right===HOT?{ok:true}:{ok:false,reason:`GEIGER MISMATCH / ${right} OF ${HOT} CORRECT. RECHECK THE COUNTS.`};
}

// LISSAJOUS SYNC: match the reference trace by tuning X/Y frequency and phase.
export const PHASES=[0,30,45,60,90,120];
export function scopePuzzle(seed){
 const rand=rng('scope/'+seed),pairs=[[1,2],[2,3],[3,4],[1,3],[3,5],[2,5],[4,5],[3,2],[5,4]];
 const [a,b]=pairs[Math.floor(rand()*pairs.length)];
 return {a,b,phase:PHASES[1+Math.floor(rand()*(PHASES.length-1))]};
}
export const lissajous=(a,b,phase,t)=>({x:Math.sin(a*t+phase*Math.PI/180),y:Math.sin(b*t)});
export function checkScope(seed,g){
 const target=scopePuzzle(seed);
 if(!g||![g.a,g.b,g.phase].every(Number.isFinite))return {ok:false,reason:'NO SIGNAL.'};
 if(g.a===target.a&&g.b===target.b&&g.phase===target.phase)return {ok:true};
 const ratio=g.a===target.a&&g.b===target.b;
 return {ok:false,reason:ratio?'LOBES MATCH / PHASE STILL DRIFTING.':'LOBE COUNT WRONG / COUNT THE LOOPS ON EACH AXIS.'};
}
