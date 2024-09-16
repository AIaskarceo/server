const http = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('wss');

// Create an HTTP server
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
        });
    } else if (req.url === '/styles.css') {
        fs.readFile(path.join(__dirname, 'styles.css'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading styles.css');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        });
    } else if (req.url === '/game.js') {
        fs.readFile(path.join(__dirname, 'game.js'), 'utf8', (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading game.js');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/javascript' });
            res.end(data);
        });
    } else {
        res.writeHead(404);
        res.end();
    }
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

let players = [];
let fights = [];

const problems = {
    gun1: [
        { question: "What is 2 + 2?", answer: "4" },
        { question: "What is 3 + 5?", answer: "8" }
    ],
    gun2: [
        { question: "What is 12 * 8?", answer: "96" },
        { question: "What is 15 * 7?", answer: "105" }
    ],
    gun3: [
        { question: "What is 144 / 12?", answer: "12" },
        { question: "What is 81 / 9?", answer: "9" }
    ]
};

wss.on('connection', (ws) => {
    if (players.length >= 20) {
        ws.send(JSON.stringify({ type: 'error', message: 'Game is full' }));
        ws.close();
        return;
    }

    const player = {
        id: Date.now(),
        ws,
        name: `Player${players.length + 1}`,
        health: 200
    };
    players.push(player);

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'setName':
                player.name = data.name;
                broadcast({ type: 'playerUpdate', players });
                break;

            case 'selectGun':
                player.gun = data.gun;
                const problemList = problems[data.gun];
                const randomProblem = problemList[Math.floor(Math.random() * problemList.length)];
                player.currentProblem = randomProblem;
                player.ws.send(JSON.stringify({ type: 'question', question: randomProblem.question }));
                break;

            case 'submitAnswer':
                if (data.answer === player.currentProblem.answer) {
                    player.ws.send(JSON.stringify({ type: 'answerResult', correct: true }));
                    player.currentProblem = null;
                    broadcast({ type: 'playerUpdate', players });
                } else {
                    player.ws.send(JSON.stringify({ type: 'answerResult', correct: false }));
                }
                break;

            case 'shoot':
                if (player.health <= 0) {
                    player.ws.send(JSON.stringify({ type: 'error', message: 'You are eliminated and cannot shoot.' }));
                } else {
                    handleShoot(player, data.targetId);
                }
                break;

            case 'requestPlayers':
                player.ws.send(JSON.stringify({ type: 'playerList', players }));
                break;
        }
    });

    ws.on('close', () => {
        players = players.filter(p => p.id !== player.id);
        broadcast({ type: 'playerUpdate', players });
    });
});

// Function to handle shooting between players
function handleShoot(attacker, targetId) {
    const target = players.find(p => p.id === targetId);
    if (target) {
        let damage = 0;
        if (attacker.gun === 'gun1') damage = 5;
        else if (attacker.gun === 'gun2') damage = 15;
        else if (attacker.gun === 'gun3') damage = 35;

        target.health -= damage;
        if (target.health <= 0) {
            target.health = 0;
            broadcast({ type: 'playerEliminated', playerId: target.id });
            players = players.filter(p => p.id !== target.id);
        }

        attacker.ws.send(JSON.stringify({ type: 'shootResult', targetId: target.id, damage }));
        target.ws.send(JSON.stringify({ type: 'takeDamage', damage }));
        broadcast({ type: 'playerUpdate', players });
    }
}

// Broadcast message to all clients
function broadcast(message) {
    players.forEach(player => player.ws.send(JSON.stringify(message)));
}

// Start server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
