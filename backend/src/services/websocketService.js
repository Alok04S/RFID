import { WebSocketServer } from 'ws';

let wss = null;

export function initWebSocketServer(server) {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected. Total clients:', wss.clients.size);

    ws.send(JSON.stringify({
      type: 'CONNECTED',
      timestamp: new Date().toISOString()
    }));

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected.');
    });
  });

  return wss;
}

export function broadcast(eventType, payload) {
  if (!wss) return;
  const message = JSON.stringify({
    type: eventType,
    payload,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // OPEN
      client.send(message);
    }
  });
}
