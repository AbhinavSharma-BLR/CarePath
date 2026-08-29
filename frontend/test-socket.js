const { io } = require('socket.io-client');

const consultationId = 'test-consult-123';

console.log('Connecting Patient socket to http://localhost:3001...');
const patientSocket = io('http://localhost:3001', {
  transports: ['polling', 'websocket'],
  timeout: 5000,
});

patientSocket.on('connect', () => {
  console.log('[TEST] Patient connected successfully! socketId =', patientSocket.id);
  patientSocket.emit('consultation:join', { consultationId, role: 'PATIENT' });
});

patientSocket.on('consultation:joined', (data) => {
  console.log('[TEST] Patient joined room:', data);
  
  // Now connect Doctor
  connectDoctor();
});

patientSocket.on('chat:message', (msg) => {
  console.log('[TEST PATIENT RECEIVED CHAT]:', msg);
});

patientSocket.on('signal:answer', (data) => {
  console.log('[TEST PATIENT RECEIVED SIGNAL ANSWER]:', data.answer);
  console.log('=== TEST COMPLETED SUCCESSFULLY ===');
  process.exit(0);
});

patientSocket.on('connect_error', (err) => {
  console.error('[TEST ERROR PATIENT]:', err.message);
  process.exit(1);
});

function connectDoctor() {
  console.log('Connecting Doctor socket to http://localhost:3001...');
  const doctorSocket = io('http://localhost:3001', {
    transports: ['polling', 'websocket'],
    timeout: 5000,
  });

  doctorSocket.on('connect', () => {
    console.log('[TEST] Doctor connected successfully! socketId =', doctorSocket.id);
    doctorSocket.emit('consultation:join', { consultationId, role: 'DOCTOR' });
  });

  doctorSocket.on('consultation:joined', (data) => {
    console.log('[TEST] Doctor joined room:', data);

    // Patient sends offer
    console.log('[TEST] Patient emitting signal:offer...');
    patientSocket.emit('signal:offer', {
      consultationId,
      offer: { type: 'offer', sdp: 'fake-sdp-offer' },
      role: 'PATIENT',
    });

    // Patient sends chat
    console.log('[TEST] Patient emitting chat:send...');
    patientSocket.emit('chat:send', {
      consultationId,
      message: { id: 'msg-1', senderName: 'Patient', senderRole: 'PATIENT', content: 'Hello Doctor' },
    });
  });

  doctorSocket.on('chat:message', (msg) => {
    console.log('[TEST DOCTOR RECEIVED CHAT]:', msg);
  });

  doctorSocket.on('signal:offer', (data) => {
    console.log('[TEST DOCTOR RECEIVED SIGNAL OFFER]:', data.offer);
    
    // Doctor sends answer
    console.log('[TEST] Doctor emitting signal:answer...');
    doctorSocket.emit('signal:answer', {
      consultationId,
      answer: { type: 'answer', sdp: 'fake-sdp-answer' },
      role: 'DOCTOR',
    });
  });

  doctorSocket.on('connect_error', (err) => {
    console.error('[TEST ERROR DOCTOR]:', err.message);
    process.exit(1);
  });
}
