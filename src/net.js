import PartySocket from 'partysocket';

export function connectRoom(code, onMessage, onStatus) {
  const room = String(code).trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 16);
  if (!room) { onStatus('Enter a room code'); return null; }
  try {
    const ws = new PartySocket({ host: 'localhost:1999', room, party: 'main' });
    ws.onmessage = (event) => {
      try { onMessage(JSON.parse(event.data)); } catch { /* Ignore malformed packets. */ }
    };
    ws.onopen = () => onStatus(`ROOM ${room} ONLINE`);
    ws.onclose = () => onStatus(`ROOM ${room} OFFLINE`);
    ws.onerror = () => onStatus(`ROOM ${room} OFFLINE`);
    return ws;
  } catch {
    onStatus(`ROOM ${room} OFFLINE`);
    return null;
  }
}
