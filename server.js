// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Store players in an array
let players = [];

// Handle new socket connections
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);
    
    // Add new player with full health
    const newPlayer = { id: socket.id, health: 150 };
    players.push(newPlayer);

    // Notify all clients about the updated players list
    io.emit('updatePlayers', players);

    // Handle 'shoot' event from a player
    socket.on('shoot', (data) => {
        const { solution, targetId, gunType } = data;

        // Determine damage based on gun type
        const damage = gunType === 'easy' ? 5 
                     : gunType === 'moderate' ? 15 
                     : gunType === 'tough' ? 35 
                     : 0;

        // Find the target player
        const targetPlayer = players.find(p => p.id === targetId);
        if (targetPlayer) {
            // Apply damage
            targetPlayer.health -= damage;

            // Ensure health doesn't drop below 0
            if (targetPlayer.health <= 0) {
                targetPlayer.health = 0;
                io.emit('playerEliminated', targetPlayer);
            }

            // Broadcast the updated health of the target player
            io.emit('healthUpdate', targetPlayer);
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log('A player disconnected:', socket.id);
        // Remove the player from the players array
        players = players.filter(p => p.id !== socket.id);
        // Notify all clients about the updated players list
        io.emit('updatePlayers', players);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
