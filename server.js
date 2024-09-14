const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
const MAX_PLAYERS = 20;

function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

function getQuestionForGun(gun) {
  if (gun === 'gun1') return 'What is 2 + 2?';         // Easy gun question
  if (gun === 'gun2') return 'What is 5 * 6?';         // Moderate gun question
  if (gun === 'gun3') return 'What is the factorial of 5?'; // Difficult gun question
  return '';
}

function logPlayers() {
  console.log('Current players:');
  Object.values(players).forEach(player => {
    console.log(`Player ID: ${player.id}, Name: ${player.name}, Health: ${player.health}, Engaged: ${player.engaged}`);
  });
}

wss.on('connection', (ws) => {
  let playerId = null;

  console.log('A new client connected.');

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'setName':
        if (Object.keys(players).length >= MAX_PLAYERS) {
          ws.send(JSON.stringify({ type: 'error', message: 'Max players reached' }));
          return;
        }

        playerId = Date.now();
        players[playerId] = { id: playerId, name: data.name, health: 200, engaged: false };
        console.log(`Player joined: ID = ${playerId}, Name = ${data.name}`);
        logPlayers();
        broadcast({ type: 'playerUpdate', players: Object.values(players) });
        break;

      case 'selectGun':
        const question = getQuestionForGun(data.gun);
        ws.send(JSON.stringify({ type: 'question', question }));
        break;

      case 'submitAnswer':
        ws.send(JSON.stringify({ type: 'answerResult', correct: true }));
        break;

      case 'shoot':
        const target = players[data.targetId];
        if (target) {
          let damage = 0;
          if (data.gun === 'gun1') damage = 5;
          if (data.gun === 'gun2') damage = 15;
          if (data.gun === 'gun3') damage = 35;

          target.health = Math.max(0, target.health - damage);

          if (target.health === 0) {
            target.engaged = false;
            console.log(`Player eliminated: ID = ${target.id}`);
            logPlayers();
            broadcast({ type: 'playerEliminated', playerId: target.id });
          }

          broadcast({ type: 'playerUpdate', players: Object.values(players) });
        }
        break;

      default:
        break;
    }
  });

  ws.on('close', () => {
    if (playerId) {
      console.log(`Player disconnected: ID = ${playerId}`);
      delete players[playerId];
      logPlayers();
      broadcast({ type: 'playerUpdate', players: Object.values(players) });
    }
  });
});

// Serve static files from React app
app.use(express.static(path.join(__dirname, '../client/build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

server.listen(3000, () => {
  console.log('Server is listening on port 5000');
});
