const { Server } = require('socket.io');

let io = null;

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

module.exports = { initSocket, getIO };
