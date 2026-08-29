const { io } = require('socket.io-client');

console.log('[TEST] Starting direct Socket.io connectivity test to http://localhost:3001...');

const socket = io('http://localhost:3001', {
  path: '/socket.io/',
  transports: ['polling', 'websocket'],
  timeout: 5000,
});

socket.on('connect', () => {
  console.log('SOCKET_TEST_CONNECTED');
  console.log('socket.id =', socket.id);
  console.log('[SOCKET DIAGNOSTIC]');
  console.log('URL=http://localhost:3001');
  console.log('PATH=/socket.io/');
  console.log('TRANSPORT=' + socket.io.engine.transport.name);
  console.log('CONNECTED=true');
  console.log('ID=' + socket.id);

  setTimeout(() => {
    console.log('[TEST] Disconnecting test socket...');
    socket.disconnect();
    setTimeout(() => {
      process.exit(0);
    }, 500);
  }, 1000);
});

socket.on('connect_error', (err) => {
  console.error('SOCKET_TEST_FAILED:', err.message);
  process.exit(1);
});
