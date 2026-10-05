import assert from 'node:assert/strict';
import {CHESS_PUZZLES,legalMoves,inCheck,playMove,tryMate,puzzleForRoom} from '../shared/chess-safe.js';
for(const p of CHESS_PUZZLES){
 assert.ok(!inCheck(p.pieces,true)&&!inCheck(p.pieces,false));
 const solutions=legalMoves(p.pieces).filter(m=>tryMate(p.id,m.from,m.to).ok);
 assert.equal(solutions.length,1,p.id+' should have exactly one mate');
 const m=solutions[0],board=playMove(p.pieces,m.from,m.to);assert.ok(inCheck(board,false));assert.equal(legalMoves(board,false).length,0);
 console.log(p.id,`${m.from}-${m.to}#`);
}
assert.equal(playMove({a8:'k',c6:'K',b6:'Q'},'c6','b7'),null,'Kings cannot touch');
assert.equal(playMove({a8:'k',c6:'K',b6:'Q'},'b6','a8'),null,'Cannot capture king or make an invalid queen move');
assert.equal(playMove({a8:'k',c6:'K',b6:'Q'},'b6','c6'),null,'Cannot capture own piece');
assert.equal(tryMate('smothered-knight','a8','f8').ok,false,'A capture is not automatically mate');
assert.equal(tryMate('smothered-knight','d6','b5').ok,false,'Non-check is not mate');
assert.equal(tryMate('bad-id','a1','b1').ok,false);assert.equal(tryMate('smothered-knight','xx','b7').ok,false);
assert.equal(puzzleForRoom('OBJ-86'),puzzleForRoom('OBJ-86'));
console.log('Passed: five unique tactical mates, escape/capture replies, illegal moves, invalid inputs and deterministic room puzzle.');

assert.equal(playMove({a1:'K',h8:'k',e2:'P',e3:'p'},'e2','e4'),null,'Blocked double pawn push');
assert.equal(playMove({a1:'K',h8:'k',e2:'P'},'e2','f3'),null,'Pawns cannot move diagonally without a capture');
assert.ok(playMove({a1:'K',h8:'k',e2:'P',f3:'p'},'e2','f3'),'Pawn capture');
const pinned=CHESS_PUZZLES.find(p=>p.id==='pinned-pawn');
const mate=playMove(pinned.pieces,'e4','f6');assert.equal(playMove(mate,'g7','f6',false),null,'Pinned pawn cannot capture the checking knight');
