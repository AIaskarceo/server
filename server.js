const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 3000, host: "0.0.0.0" });

let players = [];
console.log("WebSocket server running on ws://YOUR_LOCAL_IP:3000");

// Questions database
const questionBank = {
  gun1: ["What is 2 + 2?", "What is 3 + 5?", "What is 6 - 2?"],
  gun2: ["What is 5 * 6?", "What is 12 / 2?", "What is 8 * 7?"],
  gun3: ["What is the factorial of 5?", "What is 2^5?", "What is 7! (7 factorial)?"]
};

// Copy of available questions (to prevent repetition)
let availableQuestions = {
  gun1: [...questionBank.gun1],
  gun2: [...questionBank.gun2],
  gun3: [...questionBank.gun3]
};

// Function to get a random question without repetition
function getQuestionForGun(gun) {
  if (availableQuestions[gun].length === 0) {
    availableQuestions[gun] = [...questionBank[gun]]; // Reset questions when all are used
  }

  const randomIndex = Math.floor(Math.random() * availableQuestions[gun].length);
  return availableQuestions[gun].splice(randomIndex, 1)[0]; // Remove and return question
}

// Correct answers database
const correctAnswers = {
  "What is 2 + 2?": "4",
  "What is 3 + 5?": "8",
  "What is 6 - 2?": "4",
  
  "What is 5 * 6?": "30",
  "What is 12 / 2?": "6",
  "What is 8 * 7?": "56",
  
  "What is the factorial of 5?": "120",
  "What is 2^5?": "32",
  "What is 7! (7 factorial)?": "5040"
};

// Handle new WebSocket connections
wss.on("connection", (ws) => {
  ws.id = Math.random().toString(36).substr(2, 9);
  players.push({ id: ws.id, name: `Player ${players.length + 1}`, health: 200, canShoot: false });

  // Send updated player list to all clients
  broadcast({ type: "playerUpdate", players });

  // Handle incoming messages
  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "setName") {
      const player = players.find((p) => p.id === ws.id);
      if (player) player.name = data.name;
      broadcast({ type: "playerUpdate", players });
    }

    if (data.type === "selectGun") {
      ws.selectedGun = data.gun;
      const question = getQuestionForGun(data.gun);
      ws.currentQuestion = question; // Store question to validate answer later
      ws.send(JSON.stringify({ type: "question", question }));
    }

    if (data.type === "submitAnswer") {
      const correct = correctAnswers[ws.currentQuestion] === data.answer;
      if (correct) {
        const player = players.find((p) => p.id === ws.id);
        if (player) player.canShoot = true;
      }
      ws.send(JSON.stringify({ type: "answerResult", correct }));
    }

    if (data.type === "shoot") {
      const shooter = players.find((p) => p.id === ws.id);
      const target = players.find((p) => p.id === data.targetId);

      if (!shooter || !target) return;

      if (!shooter.canShoot) {
        ws.send(JSON.stringify({ type: "error", message: "You must answer correctly before shooting!" }));
        return;
      }

      shooter.canShoot = false; // Reset after shooting
      let damage = data.gun === "gun1" ? 5 : data.gun === "gun2" ? 15 : 35;
      target.health -= damage;

      console.log(`Player ${shooter.id} shot ${target.id} (-${damage} HP)`);

      if (target.health <= 0) {
        console.log(`Player Eliminated: ${target.name}`);
        players = players.filter((p) => p.id !== target.id);
        broadcast({ type: "playerEliminated", playerId: target.id });
      }

      broadcast({ type: "playerUpdate", players });
    }
  });

  ws.on("close", () => {
    players = players.filter((p) => p.id !== ws.id);
    broadcast({ type: "playerUpdate", players });
  });
});

// Function to broadcast messages to all clients
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
