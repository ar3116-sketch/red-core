// Bot navigation: a walkability grid over every floor at height 0 (rooms, wings, halls,
// galleries, upper sewer decks), A* over it, then string-pulled into straight walkable legs.
import {isWalkable,solidsForState,groundHeight} from './world.js';
const CELL=.5,MINX=-41,MAXX=62,MINZ=-29,MAXZ=48,W=Math.ceil((MAXX-MINX)/CELL),H=Math.ceil((MAXZ-MINZ)/CELL);
const grids=new Map();
function grid(cameraOpen){
 const key=cameraOpen?1:0;if(grids.has(key))return grids.get(key);
 const solids=solidsForState(cameraOpen),g=new Uint8Array(W*H);
 for(let j=0;j<H;j++)for(let i=0;i<W;i++){const x=MINX+(i+.5)*CELL,z=MINZ+(j+.5)*CELL;if(groundHeight(x,z,0)===0&&isWalkable(x,z,solids,.34,0))g[j*W+i]=1;}
 grids.set(key,g);return g;
}
const cellOf=(x,z)=>[Math.floor((x-MINX)/CELL),Math.floor((z-MINZ)/CELL)];
const centre=(i,j)=>({x:MINX+(i+.5)*CELL,z:MINZ+(j+.5)*CELL});
function nearestOpen(g,i,j){if(g[j*W+i])return [i,j];for(let r=1;r<6;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++){const a=i+di,b=j+dj;if(a>=0&&b>=0&&a<W&&b<H&&g[b*W+a])return [a,b];}return null;}
// Straight walkable line on the grid (Bresenham-ish sampling).
// A shortcut must stay on open cells and keep real clearance from walls and door jambs.
function clear(g,a,b,solids){const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/(CELL*.5));for(let k=0;k<=n;k++){const x=a.x+(b.x-a.x)*k/n,z=a.z+(b.z-a.z)*k/n;const [i,j]=cellOf(x,z);if(i<0||j<0||i>=W||j>=H||!g[j*W+i]||!isWalkable(x,z,solids,.31,0))return false;}return true;}
export function reachable(p,cameraOpen=false){const g=grid(cameraOpen),[i,j]=cellOf(p.x,p.z);return i>=0&&j>=0&&i<W&&j<H&&!!g[j*W+i];}
export function findPath(from,to,cameraOpen=false){
 const g=grid(cameraOpen);let s=nearestOpen(g,...cellOf(from.x,from.z)),t=nearestOpen(g,...cellOf(to.x,to.z));if(!s||!t)return null;
 const S=s[1]*W+s[0],T=t[1]*W+t[0];if(S===T)return [{x:to.x,z:to.z}];
 const gs=new Float32Array(W*H).fill(Infinity),prev=new Int32Array(W*H).fill(-1),closed=new Uint8Array(W*H);
 // Binary heap keyed on f = g + octile distance.
 const heap=[],hv=k=>{const i=k%W,j=(k/W)|0,dx=Math.abs(i-t[0]),dz=Math.abs(j-t[1]);return Math.max(dx,dz)+.414*Math.min(dx,dz);};
 const push=(k,f)=>{heap.push([f,k]);let n=heap.length-1;while(n){const p=(n-1)>>1;if(heap[p][0]<=heap[n][0])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}};
 const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let n=0;for(;;){const l=2*n+1,r=l+1;let m=n;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
 gs[S]=0;push(S,hv(S));let found=false,steps=0;
 while(heap.length&&steps++<60000){const [,k]=pop();if(closed[k])continue;closed[k]=1;if(k===T){found=true;break;}
  const i=k%W,j=(k/W)|0;
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const a=i+di,b=j+dj;if(a<0||b<0||a>=W||b>=H)continue;const n=b*W+a;if(!g[n]||closed[n])continue;
   if(di&&dj&&(!g[j*W+a]||!g[b*W+i]))continue;const cost=gs[k]+(di&&dj?1.414:1);if(cost<gs[n]){gs[n]=cost;prev[n]=k;push(n,cost+hv(n));}}}
 if(!found)return null;
 const cells=[];for(let k=T;k!==-1;k=prev[k])cells.unshift(centre(k%W,(k/W)|0));
 cells.push({x:to.x,z:to.z});
 // String-pull: keep only the corners a straight walk cannot skip.
 const out=[];let anchor={x:from.x,z:from.z},idx=0;
 while(idx<cells.length-1){let far=idx;for(let k=cells.length-1;k>idx;k--){if(clear(g,anchor,cells[k],solidsForState(cameraOpen))){far=k;break;}}if(far===idx)far=idx+1;out.push(cells[far]);anchor=cells[far];idx=far;}
 return out;
}
