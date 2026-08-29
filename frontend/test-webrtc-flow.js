// Standalone WebRTC & Socket.io Signaling End-to-End Test Script
const { io } = require('socket.io-client');

console.log('[WEBRTC TEST] Initializing end-to-end WebRTC signaling test against http://localhost:3001...');

const SOCKET_URL = 'http://localhost:3001';
const ROOM_ID = 'test-webrtc-room-' + Date.now();

// 1. Connect Patient Socket
const patientSocket = io(SOCKET_URL, { path: '/socket.io/', transports: ['polling', 'websocket'] });
const doctorSocket = io(SOCKET_URL, { path: '/socket.io/', transports: ['polling', 'websocket'] });

let patientJoined = false;
let doctorJoined = false;
let offerRelayed = false;
let answerRelayed = false;
let iceCandidateRelayed = false;

patientSocket.on('connect', () => {
  console.log(`[PATIENT SOCKET] Connected: ${patientSocket.id}`);
  patientSocket.emit('consultation:join', { consultationId: ROOM_ID, role: 'PATIENT' });
});

patientSocket.on('consultation:joined', (data) => {
  console.log(`[PATIENT SOCKET] Joined room:`, data);
  patientJoined = true;

  // Patient creates offer
  const offerPayload = { type: 'offer', sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv\r\n' };
  console.log('[PATIENT WEBRTC] Emitting signal:offer...');
  patientSocket.emit('signal:offer', { consultationId: ROOM_ID, offer: offerPayload, role: 'PATIENT' });
});

patientSocket.on('signal:join', (data) => {
  console.log('[PATIENT WEBRTC] Doctor joined room notification received:', data);
  // Resend existing offer when doctor joins
  const offerPayload = { type: 'offer', sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv\r\n' };
  console.log('[PATIENT WEBRTC] Resending signal:offer to Doctor...');
  patientSocket.emit('signal:offer', { consultationId: ROOM_ID, offer: offerPayload, role: 'PATIENT' });
});

patientSocket.on('signal:answer', (data) => {
  console.log('[PATIENT WEBRTC] ANSWER RECEIVED FROM DOCTOR:', data);
  answerRelayed = true;
  verifyResults();
});

doctorSocket.on('connect', () => {
  console.log(`[DOCTOR SOCKET] Connected: ${doctorSocket.id}`);
  doctorSocket.emit('consultation:join', { consultationId: ROOM_ID, role: 'DOCTOR' });
});

doctorSocket.on('consultation:joined', (data) => {
  console.log(`[DOCTOR SOCKET] Joined room:`, data);
  doctorJoined = true;
});

doctorSocket.on('signal:offer', (data) => {
  console.log('[DOCTOR WEBRTC] OFFER RECEIVED FROM PATIENT:', data);
  offerRelayed = true;

  // Doctor creates answer
  const answerPayload = { type: 'answer', sdp: 'v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=sendrecv\r\n' };
  console.log('[DOCTOR WEBRTC] Emitting signal:answer...');
  doctorSocket.emit('signal:answer', { consultationId: ROOM_ID, answer: answerPayload, role: 'DOCTOR' });

  // Doctor sends ICE candidate
  doctorSocket.emit('signal:ice-candidate', {
    consultationId: ROOM_ID,
    candidate: { candidate: 'candidate:1 1 UDP 2013266431 127.0.0.1 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 },
    role: 'DOCTOR'
  });
});

patientSocket.on('signal:ice-candidate', (data) => {
  console.log('[PATIENT WEBRTC] ICE CANDIDATE RECEIVED FROM DOCTOR:', data);
  iceCandidateRelayed = true;
  verifyResults();
});

function verifyResults() {
  if (patientJoined && doctorJoined && offerRelayed && answerRelayed && iceCandidateRelayed) {
    console.log('\n========================================');
    console.log('WEBRTC SIGNALING FLOW TEST: PASS');
    console.log('========================================\n');
    setTimeout(() => {
      patientSocket.disconnect();
      doctorSocket.disconnect();
      process.exit(0);
    }, 500);
  }
}

setTimeout(() => {
  if (!answerRelayed || !offerRelayed) {
    console.error('[TEST FAILED] WebRTC signaling timeout.');
    process.exit(1);
  }
}, 10000);
