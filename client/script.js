const socket = new WebSocket('ws://localhost:3000');
let playerHealth = 200;
let enemyHealth = 200;
let isConnected = false;

// Elements
const problemDescription = document.getElementById('problem-description');
const problemAnswer = document.getElementById('problem-answer');
const playerHealthElem = document.getElementById('player-health');
const specialEffects = document.getElementById('special-effects');
const playerListElem = document.getElementById('player-list'); // Element to display player list
const gameMessages = document.getElementById('game-messages'); // Element to display messages

// Open WebSocket connection
socket.onopen = () => {
    isConnected = true;
    console.log('WebSocket connection opened');
};

// Error handling
socket.onerror = (error) => {
    console.error('WebSocket error:', error);
};

// Set the player name and join the game
document.getElementById('join-game').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value;
    if (isConnected && playerName) {
        socket.send(JSON.stringify({ type: 'setName', name: playerName }));
    } else {
        alert("WebSocket connection is not open or player name is missing.");
    }
});

// Handle gun selection and problem activation
document.getElementById('gun1').addEventListener('click', () => {
    if (isConnected) {
        socket.send(JSON.stringify({ type: 'selectGun', gun: 'gun1' }));
    }
});

document.getElementById('gun2').addEventListener('click', () => {
    if (isConnected) {
        socket.send(JSON.stringify({ type: 'selectGun', gun: 'gun2' }));
    }
});

document.getElementById('gun3').addEventListener('click', () => {
    if (isConnected) {
        socket.send(JSON.stringify({ type: 'selectGun', gun: 'gun3' }));
    }
});

// Handle problem submission
document.getElementById('submit-answer').addEventListener('click', () => {
    const userAnswer = problemAnswer.value;
    if (isConnected && userAnswer) {
        socket.send(JSON.stringify({ type: 'submitAnswer', answer: userAnswer }));
    } else {
        alert("WebSocket connection is not open or answer is missing.");
    }
});

// Update health display
function updateHealth() {
    playerHealthElem.innerText = `Your Health: ${playerHealth}%`;
}

// Apply visual effects based on damage
function applySpecialEffects(damage) {
    specialEffects.classList.add('active');
    setTimeout(() => {
        specialEffects.classList.remove('active');
    }, 500);
}

// Function to update the player list on the screen
function updatePlayerList(players) {
    playerListElem.innerHTML = ''; // Clear the previous list
    players.forEach(player => {
        const playerItem = document.createElement('li');
        playerItem.innerText = `${player.name} - Health: ${player.health}%`;
        playerListElem.appendChild(playerItem);
    });
}

// Function to add a message to the game messages
function addGameMessage(message) {
    const messageElem = document.createElement('div');
    messageElem.innerText = message;
    gameMessages.appendChild(messageElem);
}

// Handle server messages
socket.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'question') {
        problemDescription.innerText = data.question;
    }

    if (data.type === 'playerUpdate') {
        updatePlayerList(data.players); // Update the player list on the screen
    }

    if (data.type === 'playerEliminated') {
        addGameMessage(`Player ${data.playerId} has been eliminated!`); // Show eliminated message
    }

    if (data.type === 'answerResult') {
        if (data.correct) {
            addGameMessage('Correct answer!'); // Display message for correct answer
        } else {
            addGameMessage('Wrong answer.'); // Display message for incorrect answer
        }
    }
};
