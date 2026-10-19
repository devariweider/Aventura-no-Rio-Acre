import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const port = Number(process.env.PORT || 8080);
const wss = new WebSocketServer({ port });
const rooms = new Map();
const MAX_PLAYERS = 4;
const send = (ws, data) => { if (ws.readyState === 1) ws.send(JSON.stringify(data)); };
const broadcast = (room, data) => { for (const p of room.players.values()) send(p.ws, data); };
const codeForRoom = () => {
  let code;
  do { code = randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(code));
  return code;
};
const snapshot = room => ({
  type: 'room', code: room.code, started: room.started,
  players: [...room.players.values()].map(({ id, name, craft, state }) => ({ id, name, craft, state }))
});
function leave(ws) {
  const room = rooms.get(ws.roomCode);
  if (!room) return;
  room.players.delete(ws.playerId);
  if (!room.players.size) rooms.delete(room.code);
  else {
    if (room.host === ws.playerId) room.host = room.players.keys().next().value;
    broadcast(room, snapshot(room));
  }
  ws.roomCode = null;
}
wss.on('connection', ws => {
  ws.on('message', raw => {
    if (raw.length > 4096) return send(ws, { type: 'error', message: 'Mensagem muito grande' });
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'create' || msg.type === 'join') {
      leave(ws);
      const code = msg.type === 'create' ? codeForRoom() : String(msg.code || '').trim().toUpperCase();
      const room = msg.type === 'create'
        ? { code, host: null, started: false, players: new Map() }
        : rooms.get(code);
      if (!room || room.started || room.players.size >= MAX_PLAYERS)
        return send(ws, { type: 'error', message: 'Sala indisponível, iniciada ou cheia' });
      if (msg.type === 'create') rooms.set(code, room);
      const id = randomBytes(8).toString('hex');
      ws.roomCode = code;
      ws.playerId = id;
      if (!room.host) room.host = id;
      room.players.set(id, {
        id, ws, name: String(msg.name || 'Jogador').slice(0, 24),
        craft: ['kayak', 'boat', 'tube'].includes(msg.craft) ? msg.craft : 'kayak',
        state: null
      });
      send(ws, { type: 'joined', id, code, host: room.host === id });
      broadcast(room, snapshot(room));
    } else {
      const room = rooms.get(ws.roomCode);
      if (!room || !room.players.has(ws.playerId)) return;
      if (msg.type === 'start' && room.host === ws.playerId && room.players.size >= 2) {
        room.started = true;
        broadcast(room, { type: 'start', timestamp: Date.now() + 1500 });
      }
      if (msg.type === 'state' && room.started && msg.state && typeof msg.state === 'object') {
        const { x, y, progress, stage, score } = msg.state;
        if (![x, y, progress, stage, score].every(Number.isFinite)) return;
        const state = {
          x: Math.max(-1000, Math.min(1000, x)), y: Math.max(-1000, Math.min(1000, y)),
          progress: Math.max(0, Math.min(100000, progress)),
          stage: Math.max(0, Math.min(3, Math.trunc(stage))),
          score: Math.max(0, Math.min(1e8, Math.trunc(score)))
        };
        room.players.get(ws.playerId).state = state;
        for (const p of room.players.values())
          if (p.id !== ws.playerId) send(p.ws, { type: 'state', id: ws.playerId, state });
      }
    }
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});
console.log('Current online lobby listening on port', port);
