const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

async function runEndToEndPhase3Test() {
  console.log('=====================================================');
  console.log('CAREPATH PHASE 3 — SUPABASE REALTIME & WEBRTC E2E TEST');
  console.log('=====================================================');

  const consultationId = `test-phase3-${Date.now()}`;
  console.log(`[TEST SETUP] Consultation Room: consultation:${consultationId}`);

  // 1. Initialize Dual Supabase Clients (Patient & Doctor)
  const patientClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const doctorClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const patientChannel = patientClient.channel(`consultation:${consultationId}`, {
    config: { broadcast: { self: false } },
  });

  const doctorChannel = doctorClient.channel(`consultation:${consultationId}`, {
    config: { broadcast: { self: false } },
  });

  let patientSubscribed = false;
  let doctorSubscribed = false;
  let offerReceived = false;
  let answerReceived = false;
  let iceExchanged = false;
  let chatPatientToDoctor = false;
  let chatDoctorToPatient = false;
  let endEventReceived = false;

  // Set up Doctor Handlers
  doctorChannel
    .on('broadcast', { event: 'signal:offer' }, (payload) => {
      console.log('[DOCTOR SUPABASE] RECEIVED SDP OFFER:', payload.payload?.offer ? 'PASS (Valid SDP)' : 'FAIL');
      offerReceived = true;

      // Doctor creates and returns answer
      const dummyAnswer = { type: 'answer', sdp: 'v=0\r\no=- 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
      console.log('[DOCTOR SUPABASE] BROADCASTING SDP ANSWER...');
      doctorChannel.send({
        type: 'broadcast',
        event: 'signal:answer',
        payload: { consultationId, answer: dummyAnswer, role: 'DOCTOR' },
      });
    })
    .on('broadcast', { event: 'signal:ice-candidate' }, (payload) => {
      console.log('[DOCTOR SUPABASE] RECEIVED ICE CANDIDATE:', payload.payload?.candidate?.candidate ? 'PASS' : 'FAIL');
      iceExchanged = true;
    })
    .on('broadcast', { event: 'chat:message' }, (payload) => {
      console.log(`[DOCTOR SUPABASE] RECEIVED CHAT: "${payload.payload?.content}" from ${payload.payload?.senderRole}`);
      if (payload.payload?.content === 'Hello Doctor') {
        chatPatientToDoctor = true;
        // Doctor replies
        console.log('[DOCTOR SUPABASE] SENDING CHAT: "Hello Patient"...');
        doctorChannel.send({
          type: 'broadcast',
          event: 'chat:message',
          payload: {
            id: `msg-${Date.now()}`,
            consultationId,
            senderId: 'doc-1',
            senderName: 'Dr. Ananya Sharma',
            senderRole: 'DOCTOR',
            content: 'Hello Patient',
            timestamp: new Date().toISOString(),
          },
        });
      }
    });

  // Set up Patient Handlers
  patientChannel
    .on('broadcast', { event: 'signal:answer' }, (payload) => {
      console.log('[PATIENT SUPABASE] RECEIVED SDP ANSWER:', payload.payload?.answer ? 'PASS (Valid SDP)' : 'FAIL');
      answerReceived = true;

      // Patient sends ICE candidate
      console.log('[PATIENT SUPABASE] BROADCASTING ICE CANDIDATE...');
      patientChannel.send({
        type: 'broadcast',
        event: 'signal:ice-candidate',
        payload: {
          consultationId,
          candidate: { candidate: 'candidate:1 1 UDP 2013266431 127.0.0.1 54321 typ host', sdpMid: '0', sdpMLineIndex: 0 },
          role: 'PATIENT',
        },
      });

      // Patient sends Chat Message
      console.log('[PATIENT SUPABASE] SENDING CHAT: "Hello Doctor"...');
      patientChannel.send({
        type: 'broadcast',
        event: 'chat:message',
        payload: {
          id: `msg-${Date.now()}`,
          consultationId,
          senderId: 'patient-1',
          senderName: 'Abhinav Sharma',
          senderRole: 'PATIENT',
          content: 'Hello Doctor',
          timestamp: new Date().toISOString(),
        },
      });
    })
    .on('broadcast', { event: 'chat:message' }, (payload) => {
      console.log(`[PATIENT SUPABASE] RECEIVED CHAT: "${payload.payload?.content}" from ${payload.payload?.senderRole}`);
      if (payload.payload?.content === 'Hello Patient') {
        chatDoctorToPatient = true;

        // Trigger consultation end
        console.log('[DOCTOR SUPABASE] BROADCASTING CONSULTATION:ENDED...');
        doctorChannel.send({
          type: 'broadcast',
          event: 'consultation:ended',
          payload: { consultationId, endedBy: 'Doctor' },
        });
      }
    })
    .on('broadcast', { event: 'consultation:ended' }, (payload) => {
      console.log('[PATIENT SUPABASE] RECEIVED CONSULTATION:ENDED EVENT from', payload.payload?.endedBy);
      endEventReceived = true;
    });

  // Subscribe both channels
  patientChannel.subscribe((status) => {
    console.log(`[PATIENT] Supabase Channel Status: ${status}`);
    if (status === 'SUBSCRIBED') {
      patientSubscribed = true;
      checkBothSubscribed();
    }
  });

  doctorChannel.subscribe((status) => {
    console.log(`[DOCTOR] Supabase Channel Status: ${status}`);
    if (status === 'SUBSCRIBED') {
      doctorSubscribed = true;
      checkBothSubscribed();
    }
  });

  function checkBothSubscribed() {
    if (patientSubscribed && doctorSubscribed) {
      console.log('[TEST PROGRESS] Both peers SUBSCRIBED to Supabase Realtime channel!');
      console.log('[PATIENT SUPABASE] BROADCASTING SDP OFFER...');
      const dummyOffer = { type: 'offer', sdp: 'v=0\r\no=- 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' };
      patientChannel.send({
        type: 'broadcast',
        event: 'signal:offer',
        payload: { consultationId, offer: dummyOffer, role: 'PATIENT' },
      });
    }
  }

  // Wait for flow completion
  await new Promise((resolve) => setTimeout(resolve, 6000));

  console.log('\n=====================================================');
  console.log('PHASE 3 VERIFICATION RESULTS SUMMARY:');
  console.log('=====================================================');
  console.log('Supabase Channel Subscription:   ', patientSubscribed && doctorSubscribed ? 'PASS' : 'FAIL');
  console.log('SDP Offer over Supabase:         ', offerReceived ? 'PASS' : 'FAIL');
  console.log('SDP Answer over Supabase:        ', answerReceived ? 'PASS' : 'FAIL');
  console.log('ICE Exchange over Supabase:      ', iceExchanged ? 'PASS' : 'FAIL');
  console.log('Patient -> Doctor Live Chat:     ', chatPatientToDoctor ? 'PASS' : 'FAIL');
  console.log('Doctor -> Patient Live Chat:     ', chatDoctorToPatient ? 'PASS' : 'FAIL');
  console.log('Consultation End Event:          ', endEventReceived ? 'PASS' : 'FAIL');
  console.log('=====================================================\n');

  if (offerReceived && answerReceived && iceExchanged && chatPatientToDoctor && chatDoctorToPatient && endEventReceived) {
    console.log('FINAL RESULT: ALL PHASE 3 SUPABASE ARCHITECTURE STEPS PASSED!');
    process.exit(0);
  } else {
    console.error('FINAL RESULT: VERIFICATION FAILED');
    process.exit(1);
  }
}

runEndToEndPhase3Test().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
