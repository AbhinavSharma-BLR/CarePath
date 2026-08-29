const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const API_URL = 'http://localhost:3001';
const JWT_SECRET = 'carepath_jwt_secret_32_bytes_long_key_123456';

function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

function signJwt(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 86400,
    })
  );
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function runStrictPhase3Verification() {
  console.log('================================================================');
  console.log('CAREPATH PHASE 3 — STRICT END-TO-END SYSTEM ACCEPTANCE TEST');
  console.log('================================================================\n');

  const appointmentId = `apt-phase3-${Date.now()}`;
  console.log(`[1. INITIALIZATION] Testing with Appointment/Consultation ID: ${appointmentId}`);

  // Create Patient and Doctor JWT tokens
  const patientToken = signJwt({
    id: 'pat-1',
    phone: '9999999999',
    name: 'Abhinav Sharma',
    role: 'PATIENT',
    patientId: 'patient-1',
  });

  const doctorToken = signJwt({
    id: 'doc-1',
    phone: '8888888888',
    name: 'Dr. Ananya Sharma',
    role: 'DOCTOR',
    doctorId: 'doc-1',
  });

  // 1. Test Queue Join (POST /api/queue/join with Patient Token)
  console.log('\n[2. QUEUE JOIN] Calling POST /api/queue/join...');
  const joinRes = await fetch(`${API_URL}/queue/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${patientToken}`,
    },
    body: JSON.stringify({
      appointmentId,
      patientId: 'patient-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Ananya Sharma',
      specialty: 'Dermatology',
    }),
  });
  const joinData = await joinRes.json();
  console.log('[2. QUEUE JOIN] Response:', joinData);
  const queueEntryCreated = joinData.success && joinData.queueEntry && joinData.queueEntry.position >= 1;
  console.log('[2. QUEUE JOIN] Status:', queueEntryCreated ? 'PASS' : 'FAIL');

  // 2. Test Queue Status (GET /api/queue/status with Patient Token)
  console.log('\n[3. QUEUE STATUS] Calling GET /api/queue/status...');
  const statusRes = await fetch(`${API_URL}/queue/status?appointmentId=${appointmentId}`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const statusData = await statusRes.json();
  console.log('[3. QUEUE STATUS] Response:', statusData);
  const queueStatusValid = statusData.success && statusData.queueEntry && statusData.queueEntry.status === 'WAITING';
  console.log('[3. QUEUE STATUS] Status:', queueStatusValid ? 'PASS' : 'FAIL');

  // 3. Test Doctor Call (POST /api/queue/call with Doctor Token)
  console.log('\n[4. DOCTOR CALL] Calling POST /api/queue/call...');
  const callRes = await fetch(`${API_URL}/queue/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({ appointmentId }),
  });
  const callData = await callRes.json();
  console.log('[4. DOCTOR CALL] Response:', callData);
  const doctorCallSucceeded = callData.success && callData.queueEntry && callData.queueEntry.status === 'CALLING';
  console.log('[4. DOCTOR CALL] Status:', doctorCallSucceeded ? 'PASS' : 'FAIL');

  // 4. Test Supabase Realtime Signaling & Chat
  console.log('\n[5. SUPABASE REALTIME WEBRTC SIGNALING & CHAT] Subscribing channels...');
  const patientClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const doctorClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const patientChannel = patientClient.channel(`consultation:${appointmentId}`, {
    config: { broadcast: { self: false } },
  });
  const doctorChannel = doctorClient.channel(`consultation:${appointmentId}`, {
    config: { broadcast: { self: false } },
  });

  let offerReceived = false;
  let answerReceived = false;
  let iceCandidateExchanged = false;
  let patientToDoctorChatReceived = false;
  let doctorToPatientChatReceived = false;
  let endEventReceived = false;

  doctorChannel
    .on('broadcast', { event: 'signal:offer' }, (p) => {
      console.log('[DOCTOR] Received signal:offer via Supabase:', p.payload?.offer?.type === 'offer');
      offerReceived = true;
      // Doctor creates and returns answer
      doctorChannel.send({
        type: 'broadcast',
        event: 'signal:answer',
        payload: {
          consultationId: appointmentId,
          answer: { type: 'answer', sdp: 'v=0\r\no=- 987654 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' },
          role: 'DOCTOR',
        },
      });
    })
    .on('broadcast', { event: 'signal:ice-candidate' }, (p) => {
      console.log('[DOCTOR] Received signal:ice-candidate via Supabase');
      iceCandidateExchanged = true;
    })
    .on('broadcast', { event: 'chat:message' }, (p) => {
      console.log(`[DOCTOR] Received live chat: "${p.payload?.content}" from ${p.payload?.senderRole}`);
      if (p.payload?.content === 'Hello Doctor') {
        patientToDoctorChatReceived = true;
        // Doctor replies
        doctorChannel.send({
          type: 'broadcast',
          event: 'chat:message',
          payload: {
            id: `msg-doc-${Date.now()}`,
            consultationId: appointmentId,
            senderId: 'doc-1',
            senderName: 'Dr. Ananya Sharma',
            senderRole: 'DOCTOR',
            content: 'Hello Patient',
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

  patientChannel
    .on('broadcast', { event: 'signal:answer' }, (p) => {
      console.log('[PATIENT] Received signal:answer via Supabase:', p.payload?.answer?.type === 'answer');
      answerReceived = true;
      // Patient sends ICE candidate
      patientChannel.send({
        type: 'broadcast',
        event: 'signal:ice-candidate',
        payload: {
          consultationId: appointmentId,
          candidate: { candidate: 'candidate:1 1 UDP 2013266431 127.0.0.1 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 },
          role: 'PATIENT',
        },
      });
      // Patient sends live chat
      patientChannel.send({
        type: 'broadcast',
        event: 'chat:message',
        payload: {
          id: `msg-pat-${Date.now()}`,
          consultationId: appointmentId,
          senderId: 'patient-1',
          senderName: 'Abhinav Sharma',
          senderRole: 'PATIENT',
          content: 'Hello Doctor',
          timestamp: new Date().toISOString(),
        },
      });
    })
    .on('broadcast', { event: 'chat:message' }, (p) => {
      console.log(`[PATIENT] Received live chat: "${p.payload?.content}" from ${p.payload?.senderRole}`);
      if (p.payload?.content === 'Hello Patient') {
        doctorToPatientChatReceived = true;
      }
    })
    .on('broadcast', { event: 'consultation:ended' }, (p) => {
      console.log('[PATIENT] Received consultation:ended event via Supabase');
      endEventReceived = true;
    });

  // Subscribe both
  let pSub = false;
  let dSub = false;

  await new Promise((resolve) => {
    patientChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        pSub = true;
        if (dSub) triggerSignaling();
      }
    });
    doctorChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        dSub = true;
        if (pSub) triggerSignaling();
      }
    });

    function triggerSignaling() {
      console.log('[SUPABASE CHANNELS] Both subscribed! Patient sending offer...');
      patientChannel.send({
        type: 'broadcast',
        event: 'signal:offer',
        payload: {
          consultationId: appointmentId,
          offer: { type: 'offer', sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' },
          role: 'PATIENT',
        },
      });
      setTimeout(resolve, 4000);
    }
  });

  // 5. Test End Consultation (POST /api/consultations/:id/end with Doctor Token)
  console.log('\n[6. END CONSULTATION] Calling POST /api/consultations/:id/end...');
  const endRes = await fetch(`${API_URL}/consultations/${appointmentId}/end`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${doctorToken}`,
    },
    body: JSON.stringify({ notes: 'Patient advised moisturizer.' }),
  });
  const endData = await endRes.json();
  console.log('[6. END CONSULTATION] Response:', endData);
  const endSucceeded = endData.success && (endData.status === 'COMPLETED' || endData.consultation?.status === 'COMPLETED');
  console.log('[6. END CONSULTATION] Status:', endSucceeded ? 'PASS' : 'FAIL');

  // Broadcast consultation:ended over Supabase
  doctorChannel.send({
    type: 'broadcast',
    event: 'consultation:ended',
    payload: { consultationId: appointmentId, endedBy: 'Doctor' },
  });

  await new Promise((r) => setTimeout(r, 1000));

  // 6. Test Persistence & Rejoin Prevention (GET /api/consultations/:id with Patient Token)
  console.log('\n[7. PERSISTENCE & REJOIN TEST] Calling GET /api/consultations/:id...');
  const getEndedRes = await fetch(`${API_URL}/consultations/${appointmentId}`, {
    headers: { Authorization: `Bearer ${patientToken}` },
  });
  const getEndedData = await getEndedRes.json();
  console.log('[7. PERSISTENCE & REJOIN TEST] Response:', getEndedData);
  const persistenceVerified = getEndedData.success && getEndedData.consultation && getEndedData.consultation.status === 'COMPLETED';
  console.log('[7. PERSISTENCE & REJOIN TEST] Status:', persistenceVerified ? 'PASS' : 'FAIL');

  console.log('\n================================================================');
  console.log('SUMMARY OF PHASE 3 ACCEPTANCE TEST RESULTS:');
  console.log('================================================================');
  console.log(`1. Queue Entry Creation:        ${queueEntryCreated ? 'PASS' : 'FAIL'}`);
  console.log(`2. Queue Status (Realtime):     ${queueStatusValid ? 'PASS' : 'FAIL'}`);
  console.log(`3. Doctor Call Execution:       ${doctorCallSucceeded ? 'PASS' : 'FAIL'}`);
  console.log(`4. Supabase SDP Offer Relay:    ${offerReceived ? 'PASS' : 'FAIL'}`);
  console.log(`5. Supabase SDP Answer Relay:   ${answerReceived ? 'PASS' : 'FAIL'}`);
  console.log(`6. Supabase ICE Exchange:       ${iceCandidateExchanged ? 'PASS' : 'FAIL'}`);
  console.log(`7. Patient -> Doctor Chat:      ${patientToDoctorChatReceived ? 'PASS' : 'FAIL'}`);
  console.log(`8. Doctor -> Patient Chat:      ${doctorToPatientChatReceived ? 'PASS' : 'FAIL'}`);
  console.log(`9. End Consultation:            ${endSucceeded ? 'PASS' : 'FAIL'}`);
  console.log(`10. Completed State Persisted:  ${persistenceVerified ? 'PASS' : 'FAIL'}`);
  console.log(`11. Consultation End Event:     ${endEventReceived ? 'PASS' : 'FAIL'}`);
  console.log('================================================================\n');

  const allPassed =
    queueEntryCreated &&
    queueStatusValid &&
    doctorCallSucceeded &&
    offerReceived &&
    answerReceived &&
    iceCandidateExchanged &&
    patientToDoctorChatReceived &&
    doctorToPatientChatReceived &&
    endSucceeded &&
    persistenceVerified &&
    endEventReceived;

  if (allPassed) {
    console.log('>>> VERDICT: ALL PHASE 3 ACCEPTANCE TESTS PASSED <<<');
    process.exit(0);
  } else {
    console.error('>>> VERDICT: ACCEPTANCE TESTS FAILED <<<');
    process.exit(1);
  }
}

runStrictPhase3Verification().catch((err) => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
