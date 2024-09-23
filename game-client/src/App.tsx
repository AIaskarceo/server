import { useState, useEffect } from 'react';
import './App.css';

// Define types for players and WebSocket message structure
interface Player {
  id: string;
  health: number;
}

interface Message {
  type: string;
  playerId?: string;
  players?: Record<string, Player>;
  targetPlayerId?: string;
  gunDamage?: number;
}

function App() {
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('wss://https://server-1-rk6g.onrender.com');

    ws.onopen = () => {
      setConnected(true);
      console.log('Connected to the server');
    };

    ws.onmessage = (event) => {
      const data: Message = JSON.parse(event.data);

      if (data.type === 'connected') {
        setPlayerId(data.playerId || null);
        setPlayers(data.players || {});
      }

      if (data.type === 'updatePlayers') {
        setPlayers(data.players || {});
      }
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('Disconnected from the server');
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleShoot = (targetPlayerId: string, gunDamage: number) => {
    if (connected) {
      const ws = new WebSocket('wss://https://server-1-rk6g.onrender.com');
      const message: Message = {
        type: 'shoot',
        targetPlayerId,
        gunDamage,
      };
      ws.send(JSON.stringify(message));
    }
  };

  return (
    <div className="App">
      <h1>Multiplayer Game</h1>
      {connected ? <p>Connected as Player {playerId}</p> : <p>Connecting...</p>}
      
      <h2>Players:</h2>
      <ul>
        {Object.values(players).map((player) => (
          <li key={player.id}>
            Player {player.id}: {player.health}%
            {player.id !== playerId && (
              <>
                <button onClick={() => handleShoot(player.id, 5)}>Shoot (5% Damage)</button>
                <button onClick={() => handleShoot(player.id, 15)}>Shoot (15% Damage)</button>
                <button onClick={() => handleShoot(player.id, 35)}>Shoot (35% Damage)</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
