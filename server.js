// Importing necessary modules
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Create an Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files (for the front-end UI)
app.use(express.static(path.join(__dirname, 'public')));

// Game state
let players = [];
let gameStarted = false;
const MAX_PLAYERS = 20;
const TOP_PLAYERS = 6;

// Gun damage percentages
const GUN_DAMAGE = {
    simple: 5,    // Gun 1: Simple problem
    moderate: 15, // Gun 2: Moderate problem
    tough: 35     // Gun 3: Tough problem
};

// WebSocket connection handling
wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'join' && !gameStarted && players.length < MAX_PLAYERS) {
            // Add player to the game
            const newPlayer = {
                id: ws,
                name: data.name,
                health: 100,
                isInFight: false
            };
            players.push(newPlayer);
            broadcastGameState();
        }

        if (data.type === 'gunFire' && gameStarted) {
            // Handle gunfire event (problem solved, player shoots)
            const attacker = players.find(p => p.id === ws);
            const target = players.find(p => p.name === data.target);

            if (attacker && target && attacker.isInFight && target.isInFight) {
                target.health -= GUN_DAMAGE[data.gun];
                if (target.health <= 0) {
                    target.health = 0;
                    handlePlayerElimination(target);
                }
                broadcastGameState();
            }
        }
    });

    ws.on('close', () => {
        // Handle player disconnects
        players = players.filter(p => p.id !== ws);
        broadcastGameState();
    });
});

// Broadcast the game state to all players
function broadcastGameState() {
    const gameState = players.map(player => ({
        name: player.name,
        health: player.health,
        isInFight: player.isInFight
    }));

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'gameState', players: gameState }));
        }
    });
}

// Handle player elimination and determine winners
function handlePlayerElimination(player) {
    player.isInFight = false;
    players = players.filter(p => p !== player);
    if (players.length === TOP_PLAYERS) {
        endGame();
    }
}

// Start the game (server-side team triggers it)
app.post('/startGame', (req, res) => {
    if (!gameStarted) {
        gameStarted = true;
        startRandomFights();
        res.send('Game started');
        // Broadcast game started status to all WebSocket clients
        broadcastGameStartedStatus();
    }
});

// Broadcast game started status to all WebSocket clients
function broadcastGameStartedStatus() {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'gameStatus', status: 'started' }));
        }
    });
}

// Start random fights between players
function startRandomFights() {
    while (players.length > 1) {
        const [p1, p2] = selectRandomPlayers();
        p1.isInFight = true;
        p2.isInFight = true;
    }
}

// Select two random players for a fight
function selectRandomPlayers() {
    let randomIndex1 = Math.floor(Math.random() * players.length);
    let randomIndex2;
    do {
        randomIndex2 = Math.floor(Math.random() * players.length);
    } while (randomIndex1 === randomIndex2);

    return [players[randomIndex1], players[randomIndex2]];
}

// End the game and display top players
function endGame() {
    const topPlayers = players.slice(0, TOP_PLAYERS);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'endGame', topPlayers }));
        }
    });
}

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
