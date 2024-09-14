// server.js
const WebSocket = require('ws');

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Store players' health
let players = {};

// Broadcast a message to all connected players
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Handle incoming connections
wss.on('connection', (ws) => {
    console.log('New player connected.');

    // Assign initial health to the new player
    const playerID = Math.random().toString(36).substring(7);  // Generate a random ID
    players[playerID] = { health: 150 };
    
    // Notify the client of their ID and starting health
    ws.send(JSON.stringify({ type: 'welcome', playerID, health: players[playerID].health }));

    // Broadcast the new player list to everyone
    broadcast({ type: 'players', players });

    // Handle incoming messages from players
    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'attack') {
            const { targetID, damage } = data;

            if (players[targetID]) {
                players[targetID].health -= damage;
                if (players[targetID].health <= 0) {
                    players[targetID].health = 0;
                    broadcast({ type: 'eliminate', targetID });
                }

                broadcast({
                    type: 'updateHealth',
                    playerID: targetID,
                    health: players[targetID].health,
                });
            }
        }
    });

    // Handle player disconnection
    ws.on('close', () => {
        console.log('Player disconnected:', playerID);
        delete players[playerID];
        broadcast({ type: 'players', players });
    });
});
