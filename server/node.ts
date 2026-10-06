// Standalone host: serves the built game from dist/ and runs the same Room code as PartyKit,
// one Room per room code, over plain WebSockets at /parties/main/<ROOM>.
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,extname,normalize} from 'node:path';
import {WebSocketServer,type WebSocket} from 'ws';
import Room from './room.ts';

const PORT=Number(process.env.PORT||8080),DIST=join(process.cwd(),'dist');
const TYPES:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.json':'application/json','.svg':'image/svg+xml','.ico':'image/x-icon'};

interface Conn{id:string;socket:WebSocket;send(m:string):void;close():void}
class Party{
 conns=new Map<string,Conn>();server:any;
 constructor(public id:string){this.server=new Room(this as any);}
 env=process.env;
 broadcast(m:string){for(const c of this.conns.values())c.send(m);}
 getConnections(){return this.conns.values();}
 getConnection(id:string){return this.conns.get(id);}
}
const parties=new Map<string,Party>();

const http=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url||'/','http://x');let path=normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/,'');
  if(path==='/'||path==='')path='/index.html';
  let file=join(DIST,path);
  if(!file.startsWith(DIST)){res.writeHead(403).end();return;}
  try{if((await stat(file)).isDirectory())file=join(file,'index.html');}catch{file=join(DIST,'index.html');}
  const body=await readFile(file);
  res.writeHead(200,{'content-type':TYPES[extname(file)]||'application/octet-stream','cache-control':file.includes('/assets/')?'public, max-age=31536000, immutable':'no-cache'});
  res.end(body);
 }catch{res.writeHead(404).end('not found');}
});

const wss=new WebSocketServer({noServer:true});
http.on('upgrade',(req,socket,head)=>{
 const m=/^\/parties?\/main\/([^/?]+)/.exec(req.url||'');
 if(!m){socket.destroy();return;}
 const roomId=decodeURIComponent(m[1]);
 wss.handleUpgrade(req,socket,head,ws=>{
  let party=parties.get(roomId);if(!party){party=new Party(roomId);parties.set(roomId,party);}
  const conn:Conn={id:crypto.randomUUID(),socket:ws,send:msg=>{if(ws.readyState===1)ws.send(msg);},close:()=>ws.close()};
  party.conns.set(conn.id,conn);
  ws.on('message',data=>{try{party!.server.onMessage(String(data),conn);}catch(e){console.error(e);}});
  ws.on('close',()=>{party!.conns.delete(conn.id);try{party!.server.onClose(conn);}catch(e){console.error(e);}
   // Empty rooms are dropped after a minute so the server does not grow forever.
   if(!party!.conns.size)setTimeout(()=>{if(!party!.conns.size&&parties.get(roomId)===party){clearInterval(party!.server.timer);parties.delete(roomId);}},60000);});
  try{party!.server.onConnect(conn);}catch(e){console.error(e);}
 });
});
http.listen(PORT,()=>console.log(`RED CORE on :${PORT}`));
