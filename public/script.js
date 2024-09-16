const ws = new WebSocket('ws://localhost:3000');

ws.addEventListener('open', () => {
    console.log('Connected to server');
});

ws.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'gameState') {
        updatePlayerList(data.players);
    }

    if (data.type === 'endGame') {
        displayWinners(data.topPlayers);
    }
});

function updatePlayerList(players) {
    const playersDiv = document.getElementById('players');
    playersDiv.innerHTML = '';
    players.forEach(player => {
        const playerElement = document.createElement('div');
        playerElement.textContent = `${player.name} - Health: ${player.health}`;
        playersDiv.appendChild(playerElement);
    });
}

function displayWinners(topPlayers) {
    const statusDiv = document.getElementById('status');
    statusDiv.innerHTML = 'Game Over! Top Players:<br>';
    topPlayers.forEach(player => {
        statusDiv.innerHTML += `${player.name} - Health: ${player.health}<br>`;
    });
}

// Enable the start button only if you are the server
document.getElementById('startButton').addEventListener('click', () => {
    fetch('/startGame', {
        method: 'POST',
    }).then(response => response.text())
      .then(data => {
          console.log(data);
      });
});
