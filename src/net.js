import PartySocket from 'partysocket';

// Dev: the local PartyKit server on :1999. Deployed: PartyKit serves the page and the rooms from one host.
export const PARTY_HOST=import.meta.env.VITE_PARTY_HOST||(import.meta.env.DEV?`${location.hostname||'localhost'}:1999`:location.host);
export const cleanCode=code=>String(code).trim().toUpperCase().replace(/[^A-Z0-9-]/g,'').slice(0,16);
const LETTERS='ABCDEFGHJKLMNPQRSTUVWXYZ';
export const newCode=()=>Array.from(crypto.getRandomValues(new Uint32Array(4)),n=>LETTERS[n%LETTERS.length]).join('');

export function connectRoom(code, onMessage, onStatus) {
  const room = cleanCode(code);
  if (!room) { onStatus('ENTER A ROOM CODE'); return null; }
  try {
    const ws = new PartySocket({ host: PARTY_HOST, room, party: 'main' });
    ws.onmessage = (event) => {
      try { onMessage(JSON.parse(event.data)); } catch { /* Ignore malformed packets. */ }
    };
    ws.onopen = () => onStatus(`ROOM ${room} ONLINE`);
    ws.onclose = () => onStatus(`ROOM ${room} OFFLINE / RECONNECTING`);
    ws.onerror = () => onStatus(`ROOM ${room} OFFLINE`);
    return ws;
  } catch {
    onStatus(`ROOM ${room} OFFLINE`);
    return null;
  }
}
