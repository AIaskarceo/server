// public/frontend.js

const socket = io();

// Variables to store selected gun type and target ID
let selectedGunType = 'easy'; // Default gun type
let selectedTargetId = ''; // No target selected by default

// Reference to DOM elements
const playersList = document.getElementById('players-list');
const targetSelect = document.getElementById('target-select');
const gunButtons = document.querySelectorAll('.gun-btn');
const submitButton = document.getElementById('submit');
const solutionInput = document.getElementById('solution');

// Update the players list and target dropdown in real-time
socket.on('updatePlayers', (players) => {
    // Clear current players list and target dropdown
    playersList.innerHTML = '';
    targetSelect.innerHTML = '<option value="" disabled selected>Select a target</option>';

    players.forEach(player => {
        if (player.id !== socket.id) { // Exclude self from target selection
            // Add player to the players list UI
            playersList.innerHTML += `
                <div class="player" id="${player.id}">
                    <h3>Player ${player.id.slice(0, 4)}</h3>
                    <p>Health: ${player.health}</p>
                </div>
            `;
            // Add player to the target selection dropdown
            targetSelect.innerHTML += `<option value="${player.id}">Player ${player.id.slice(0, 4)}</option>`;
        }
    });
});

// Handle gun selection
gunButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
        selectedGunType = event.target.getAttribute('data-gun');
        // Highlight the selected gun
        gunButtons.forEach(button => button.classList.remove('selected-gun'));
        event.target.classList.add('selected-gun');
    });
});

// Handle target selection
targetSelect.addEventListener('change', (event) => {
    selectedTargetId = event.target.value;
});

// Handle shoot button click
submitButton.addEventListener('click', () => {
    const solution = solutionInput.value.trim();

    if (!selectedTargetId) {
        alert('Please select a target.');
        return;
    }

    if (solution === '') {
        alert('Please enter a solution.');
        return;
    }

    // Emit 'shoot' event to the server
    socket.emit('shoot', { solution, targetId: selectedTargetId, gunType: selectedGunType });

    // Clear the solution input field
    solutionInput.value = '';
});

// Update health of a player when it changes
socket.on('healthUpdate', (player) => {
    const playerElement = document.getElementById(player.id);
    if (playerElement) {
        playerElement.querySelector('p').textContent = `Health: ${player.health}`;
    }
});

// Handle player elimination
socket.on('playerEliminated', (player) => {
    const playerElement = document.getElementById(player.id);
    if (playerElement) {
        playerElement.style.opacity = 0.5; // Visually indicate elimination
        playerElement.querySelector('p').textContent = 'Eliminated';
    }
});
