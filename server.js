const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let players = {};
const MAX_PLAYERS = 20;

// Function to broadcast a message to all clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// Function to get the question based on the gun type
function getQuestionForGun(gun) {
    if (gun === 'gun1') return 'What is 2 + 2?';         // Easy gun question
    if (gun === 'gun2') return 'What is 5 * 6?';         // Moderate gun question
    if (gun === 'gun3') return 'What is the factorial of 5?'; // Difficult gun question
    return '';
}

// Handle new WebSocket connections
wss.on('connection', (ws) => {
    let playerId = null;

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
                broadcast({ type: 'playerUpdate', players: Object.values(players) });
                break;

            case 'selectGun':
                const question = getQuestionForGun(data.gun);
                ws.send(JSON.stringify({ type: 'question', question }));
                break;

            case 'submitAnswer':
                // Placeholder logic for checking the answer
                const correct = true; // Assume the answer is correct for this example
                ws.send(JSON.stringify({ type: 'answerResult', correct }));
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
                        broadcast({ type: 'playerEliminated', playerId: target.id });
                        delete players[target.id]; // Remove the player from the game
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
            broadcast({ type: 'playerUpdate', players: Object.values(players) });
        }
    });
});

// Serve static files from the client build directory
app.use(express.static(path.join(__dirname, 'client')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
