import {CHESS_PUZZLES,legalMoves,tryMate} from '../shared/chess-safe.js';
// Pixel silhouettes are authored here so piece art follows the game's bitmap UI.
const pixels={
 k:['0001000','0011100','0001000','0111110','0011100','0011100','0011100','0111110','1111111'],
 q:['1001001','1101011','0111110','0111110','0011100','0011100','0111110','1111111','1111111'],
 b:['0001000','0011100','0010100','0110110','0011100','0001000','0011100','0111110','1111111'],
 n:['0011100','0111110','1101110','1111110','0001110','0011100','0111100','0111110','1111111'],
 p:['0000000','0011100','0011100','0011100','0001000','0011100','0011100','0111110','1111111'],
 r:['1101011','1111111','0111110','0011100','0011100','0011100','0111110','1111111','1111111'],
};
function pieceIcon(piece) {
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','-1 -1 9 11');svg.setAttribute('aria-hidden','true');svg.style.fill=piece===piece.toUpperCase()?'#e6ddb2':'#16221b';
 pixels[piece.toLowerCase()].forEach((row,y)=>[...row].forEach((v,x)=>{if(v==='1'){const r=document.createElementNS(svg.namespaceURI,'rect');r.setAttribute('x',x);r.setAttribute('y',y);r.setAttribute('width',1);r.setAttribute('height',1);svg.append(r);}}));return svg;
}
export function createChessSafe(onSolve,onClose) {
 const panel=document.getElementById('chess-panel'),grid=document.getElementById('chess-board'),message=document.getElementById('chess-message');
 let puzzle=CHESS_PUZZLES[0],selected=null,solved=false,pending=false,solvedBoard=null;
 function draw(board=puzzle.pieces) {
  grid.replaceChildren();const moves=selected?legalMoves(board).filter(m=>m.from===selected).map(m=>m.to):[];
  for(let rank=8;rank>=1;rank--)for(let file=0;file<8;file++){
   const square=String.fromCharCode(97+file)+rank,piece=board[square],button=document.createElement('button');
   button.className='chess-square '+((rank+file)%2?'dark':'light');button.dataset.square=square;button.disabled=solved||pending;
   const name=piece?`${piece===piece.toUpperCase()?'white':'black'} ${{k:'king',q:'queen',r:'rook',b:'bishop',n:'knight',p:'pawn'}[piece.toLowerCase()]}`:'empty';button.setAttribute('aria-label',`${square.toUpperCase()}: ${name}`);button.setAttribute('aria-pressed',String(selected===square));
   if(moves.includes(square))button.classList.add('legal');if(piece)button.append(pieceIcon(piece));
   const label=document.createElement('small');label.textContent=square;button.append(label);
   button.onclick=()=>{
    if(piece&&piece===piece.toUpperCase()){selected=square;draw();message.textContent='Choose a marked destination.';return;}
    if(!selected){message.textContent='Select a white piece first.';return;}
    const result=tryMate(puzzle.id,selected,square);
    if(result.ok){solvedBoard=result.board;pending=true;draw(result.board);message.textContent='CHECKMATE / RELEASING LOCK...';onSolve(puzzle.id,selected,square);}
    else{message.textContent=result.reason;selected=null;draw();}
   };grid.append(button);
  }
 }
 const api={
  get isOpen(){return !panel.hidden;},
  open(id,alreadySolved=false){puzzle=CHESS_PUZZLES.find(p=>p.id===id)||CHESS_PUZZLES[0];selected=null;solvedBoard=null;solved=alreadySolved;pending=false;panel.hidden=false;message.textContent=solved?'SAFE OPEN / MUTAGEN ACCESS GRANTED':'WHITE TO MOVE. CHECKMATE IN ONE MOVE.';draw();document.getElementById('chess-close').focus();},
  close(){panel.hidden=true;onClose();},
  accept(){solved=true;pending=false;message.textContent='CHECKMATE / SAFE OPEN / MUTAGEN ACCESS GRANTED';draw(solvedBoard||puzzle.pieces);},
  reject(reason){pending=false;selected=null;message.textContent=reason;draw();},
 };
 document.getElementById('chess-close').onclick=()=>api.close();
 document.getElementById('chess-hint').onclick=()=>{message.textContent=puzzle.hint;};
 document.getElementById('chess-reset').onclick=()=>{if(solved||pending)return;selected=null;message.textContent='Position reset. White to move.';draw();};
 return api;
}
