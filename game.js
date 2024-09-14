const ws = new WebSocket('ws://https://legendary-tribble-x59rrqqjjqj4cpxr6-8080.app.github.dev/'); // Connect to WebSocket server

let playerID = null;
let playerHealth = 150;
let currentGun = 0;
let players = {};

// Choose a weapon and display the question
function chooseWeapon(gun) {
    currentGun = gun;
    switch (gun) {
        case 1:
            document.getElementById('problem').textContent = "Solve: x = 1 + 1";
            break;
        case 2:
            document.getElementById('problem').textContent = "Solve: for loop in JavaScript";
            break;
        case 3:
            document.getElementById('problem').textContent = "Solve: Sorting algorithm pseudocode";
            break;
    }
}

// Submit answer to solve the problem
function submitAnswer() {
    const answer = document.getElementById('answer').value;
    if (checkAnswer(currentGun, answer)) {
        const targetID = getRandomOpponent();  // Get a random opponent
        if (targetID) {
            fireWeapon(currentGun, targetID);
        }
    } else {
        alert('Incorrect answer!');
    }
}

// Check if the answer is correct
function checkAnswer(gun, answer) {
    if (gun === 1 && answer === '2') return true;
    if (gun === 2 && answer.includes('for')) return true;
    if (gun === 3 && answer.includes('sort')) return true;
    return false;
}

// Fire weapon at opponent
function fireWeapon(gun, targetID) {
    let damage = 0;
    if (gun === 1) damage = 5;
    if (gun === 2) damage = 15;
    if (gun === 3) damage = 35;

    ws.send(JSON.stringify({ type: 'attack', targetID, damage }));
}

// Get a random opponent's ID
function getRandomOpponent() {
    const opponentIDs = Object.keys(players).filter(id => id !== playerID);
    if (opponentIDs.length > 0) {
        return opponentIDs[Math.floor(Math.random() * opponentIDs.length)];
    } else {
        alert('No opponents available.');
        return null;
    }
}

// Handle incoming WebSocket messages
ws.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.type === 'welcome') {
        playerID = data.playerID;
        playerHealth = data.health;
        updatePlayerStats();
    }

    if (data.type === 'players') {
        players = data.players;
        updatePlayerStats();
    }

    if (data.type === 'updateHealth') {
        if (data.playerID === playerID) {
            playerHealth = data.health;
            updatePlayerStats();
            if (playerHealth <= 0) {
                alert('You have been eliminated!');
            }
        }
    }

    if (data.type === 'eliminate') {
        alert(`Player ${data.targetID} has been eliminated.`);
        delete players[data.targetID];
        updatePlayerStats();
    }
};

// Update player stats display
function updatePlayerStats() {
    const statsDiv = document.getElementById('player-stats');
    statsDiv.innerHTML = `Your Health: ${playerHealth}%<br>Players in Lobby: ${Object.keys(players).length}`;
}
