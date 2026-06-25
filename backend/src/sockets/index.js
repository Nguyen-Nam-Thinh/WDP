const { Server } = require('socket.io');

let io = null;

// raceId → { data: race:started payload, startedAt: Date.now() }
const activeRaces = new Map();

function initSocket(httpServer, clientUrl) {
  const origins = clientUrl
    ? [...clientUrl.split(',').map(u => u.trim()), 'http://localhost:5173', 'http://localhost:3000']
    : '*';

  io = new Server(httpServer, {
    cors: { origin: origins, credentials: true },
  });

  io.on('connection', (socket) => {
    socket.on('join:race', (raceId) => {
      socket.join(`race:${raceId}`);

      // Late-join: replay race:started with elapsed time so client can catch up
      const active = activeRaces.get(String(raceId));
      if (active) {
        const elapsedMs = Date.now() - active.startedAt;
        if (elapsedMs < active.data.raceDurationMs) {
          socket.emit('race:started', { ...active.data, elapsedMs });
        }
      }
    });

    socket.on('leave:race', (raceId) => {
      socket.leave(`race:${raceId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

function setActiveRace(raceId, data) {
  activeRaces.set(String(raceId), { data, startedAt: Date.now() });
}

function clearActiveRace(raceId) {
  activeRaces.delete(String(raceId));
}

module.exports = { initSocket, getIO, setActiveRace, clearActiveRace };
