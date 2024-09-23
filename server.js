// server.js
const WebSocket = require('ws');
const express = require('express');

const app = express();
const port = process.env.PORT || 3001;

const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// WebSocket server setup
const wss = new WebSocket.Server({ server });

let players = {};

wss.on('connection', (ws) => {
  console.log('New player connected');

  // Assign a player ID
  const playerId = Math.random().toString(36).substr(2, 9);
  players[playerId] = { health: 150, id: playerId };
  
  ws.send(JSON.stringify({ type: 'connected', playerId, players }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    // Handle game logic (i.e., shooting, updating health)
    if (data.type === 'shoot') {
      const { targetPlayerId, gunDamage } = data;
      if (players[targetPlayerId]) {
        players[targetPlayerId].health -= gunDamage;
        if (players[targetPlayerId].health <= 0) {
          delete players[targetPlayerId];
        }
        // Broadcast updated player data to all players
        wss.clients.forEach((client) => {
          client.send(JSON.stringify({ type: 'updatePlayers', players }));
        });
      }
    }
  });

  ws.on('close', () => {
    console.log('Player disconnected');
    delete players[playerId];
    // Notify all players about the disconnection
    wss.clients.forEach((client) => {
      client.send(JSON.stringify({ type: 'updatePlayers', players }));
    });
  });
});
