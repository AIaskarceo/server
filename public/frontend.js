// public/frontend.js

const socket = io();
const qustiondisp = document.getElementById("question-display")
// Arrays of questions for each gun (difficulty level)
const easyQuestions = [
    "What is the output of 2+2 in JavaScript?",
    "What is the purpose of the 'let' keyword in JS?",
    "What is the correct syntax to print 'Hello World' in JavaScript?"
];

const moderateQuestions = [
    "Write a function to reverse a string in JavaScript.",
    "What is a closure in JavaScript?",
    "How do you create a promise in JavaScript?"
];

const toughQuestions = [
    "Explain the event loop in JavaScript.",
    "What is the difference between '==', '===' in JavaScript?",
    "Write a JavaScript function to find the largest number in an array."
];

// Function to get a random question from the question array
function getRandomQuestion(questions) {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

// Function to display the question
function displayQuestion(gunType) {
    let questionText = '';

    if (gunType === 'easy') {
        questionText = getRandomQuestion(easyQuestions);
        qustiondisp.textContent=questionText;
    } else if (gunType === 'moderate') {
        questionText = getRandomQuestion(moderateQuestions);
    } else if (gunType === 'tough') {
        questionText = getRandomQuestion(toughQuestions);
    }

    // Update the question display
    document.getElementById('question-display').innerText = questionText;
}

// Function to handle shooting
function onPlayerShoot(gunType) {
    // Update the question based on the gun type
    displayQuestion(gunType);

    // Handle other logic for the shot (health reduction, etc.)
}

// Listen for shot events from the server
socket.on('shotFired', (data) => {
    // Assume data contains information about which gun was used
    onPlayerShoot(data.gunType);
});

// Update the players list and target dropdown in real-time
socket.on('updatePlayers', (players) => {
    const playersList = document.getElementById('players-list');
    const targetSelect = document.getElementById('target-select');

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
document.querySelectorAll('.gun-btn').forEach(btn => {
    btn.addEventListener('click', (event) => {
        selectedGunType = event.target.getAttribute('data-gun');
        // Highlight the selected gun
        document.querySelectorAll('.gun-btn').forEach(button => button.classList.remove('selected-gun'));
        event.target.classList.add('selected-gun');
    });
});

// Handle target selection
document.getElementById('target-select').addEventListener('change', (event) => {
    selectedTargetId = event.target.value;
});

// Handle submit button click
document.getElementById('submit').addEventListener('click', () => {
    const solution = document.getElementById('solution').value.trim();

    if (!selectedTargetId) {
        alert('Please select a target.');
        return;
    }

    if (solution === '') {
        alert('Please enter a solution.');
        return;
    }

    // Emit 'shoot' event to the server
    socket.emit('shoot', { solution, gunType: selectedGunType, targetId: selectedTargetId });

    // Clear the solution input field
    document.getElementById('solution').value = '';
});