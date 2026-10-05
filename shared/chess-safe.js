// Curated one-move tactics. These positions have no castling or en-passant
// rights and no promotion moves. Test every legal defensive reply, not just kings.
export const SAFE_POSITION={x:10,z:-13.7};
export const SAFE_RANGE=2.0;
export const CHESS_PUZZLES=[
 {id:'smothered-knight',pieces:{c1:'K',a8:'R',d6:'N',b2:'P',c2:'P',f2:'P',h8:'k',f8:'r',e7:'N',g6:'n',g7:'p',h7:'p'},hint:'A pinned defender cannot leave its king exposed. Look for a knight check.'},
 {id:'diagonal-battery',pieces:{g1:'K',h6:'Q',b2:'B',a1:'R',f3:'N',e2:'P',f2:'P',g2:'P',h8:'k',f8:'r',c8:'b',d7:'n',a7:'p',b7:'p',e6:'p',g7:'p',h7:'p'},hint:'Trace the long diagonal from your bishop. It can protect a queen beside the king.'},
 {id:'sealed-back-rank',pieces:{g1:'K',e1:'R',d3:'B',f3:'N',g2:'P',h2:'P',a2:'P',d4:'P',g8:'k',a8:'r',b8:'n',c8:'b',f7:'p',g7:'p',h7:'p'},hint:'The king has no air behind its own pawns. Which open file reaches the back rank?'},
 {id:'double-check',pieces:{g1:'K',e1:'R',e2:'B',f2:'P',g2:'P',h2:'P',e8:'k',d8:'q',f8:'b',b8:'n',a7:'p',b7:'p',c7:'p',f7:'p'},hint:'Move the piece blocking your rook so both pieces give check at once.'},
 {id:'pinned-pawn',pieces:{c1:'K',g1:'R',e4:'N',c4:'B',a2:'P',b2:'P',c2:'P',g8:'k',f8:'r',h8:'r',f7:'p',g7:'p',h7:'p',b7:'p'},hint:'A pawn pinned to its king cannot capture your checking piece. Find the knight route.'},
];
const xy=s=>[s.charCodeAt(0)-97,Number(s[1])-1];
const square=(x,y)=>String.fromCharCode(97+x)+(y+1);
const white=p=>p===p.toUpperCase();
function attacks(board,from,to) {
 const p=board[from];if(!p||from===to)return false;
 const [x,y]=xy(from),[tx,ty]=xy(to),dx=tx-x,dy=ty-y;
 if(p.toLowerCase()==='k')return Math.max(Math.abs(dx),Math.abs(dy))===1;
 if(p.toLowerCase()==='n')return Math.abs(dx)*Math.abs(dy)===2;
 if(p.toLowerCase()==='p')return Math.abs(dx)===1&&dy===(white(p)?1:-1);
 const straight=dx===0||dy===0,diagonal=Math.abs(dx)===Math.abs(dy);
 if(p.toLowerCase()==='r'&&!straight)return false;
 if(p.toLowerCase()==='b'&&!diagonal)return false;
 if(p.toLowerCase()==='q'&&!straight&&!diagonal)return false;
 if(!['q','r','b'].includes(p.toLowerCase()))return false;
 for(let a=x+Math.sign(dx),b=y+Math.sign(dy);a!==tx||b!==ty;a+=Math.sign(dx),b+=Math.sign(dy))if(board[square(a,b)])return false;
 return true;
}
export function inCheck(board,side) {
 const king=Object.keys(board).find(s=>board[s]===(side?'K':'k'));
 return !king||Object.keys(board).some(s=>white(board[s])!==side&&attacks(board,s,king));
}
export function playMove(board,from,to,side=true) {
 if(!/^[a-h][1-8]$/.test(from)||!/^[a-h][1-8]$/.test(to))return null;
 const piece=board[from],target=board[to];
 if(!piece||white(piece)!==side||(target&&(white(target)===side||target.toLowerCase()==='k')))return null;
 if(piece.toLowerCase()==='p'){
  const [x,y]=xy(from),[tx,ty]=xy(to),direction=side?1:-1,dy=ty-y;
  const forward=x===tx&&!target&&(dy===direction||(y===(side?1:6)&&dy===2*direction&&!board[square(x,y+direction)]));
  if(!forward&&!(target&&attacks(board,from,to)))return null;
  // Promotion is intentionally absent from the curated positions.
  if(ty===0||ty===7)return null;
 }else if(!attacks(board,from,to))return null;
 const result={...board};delete result[from];result[to]=piece;
 return inCheck(result,side)?null:result;
}
export function legalMoves(board,side=true) {
 const result=[];
 for(const from of Object.keys(board))if(white(board[from])===side)for(let x=0;x<8;x++)for(let y=0;y<8;y++){const to=square(x,y);if(playMove(board,from,to,side))result.push({from,to});}
 return result;
}
export function tryMate(puzzleId,from,to) {
 const puzzle=CHESS_PUZZLES.find(p=>p.id===puzzleId);
 if(!puzzle)return {ok:false,reason:'Unknown puzzle.'};
 const board=playMove(puzzle.pieces,from,to,true);
 if(!board)return {ok:false,reason:'That move is illegal. Keep your king safe and follow the piece movement.'};
 if(!inCheck(board,false))return {ok:false,reason:'That does not check the black king. Try a direct threat.'};
 const reply=legalMoves(board,false)[0];
 if(reply)return {ok:false,reason:`Black can reply ${reply.from.toUpperCase()} to ${reply.to.toUpperCase()}. Account for that defense.`};
 return {ok:true,board};
}
export function puzzleForRoom(id) {let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return CHESS_PUZZLES[h%CHESS_PUZZLES.length].id;}
