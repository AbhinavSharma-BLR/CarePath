import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

let io: SocketIOServer | null = null;

export function initSocketIO(server: HTTPServer) {
  if (io) return io;

  io = new SocketIOServer(server, {
    path: '/socket.io/',
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  console.log(`[CAREPATH SOCKET] SOCKET.IO INITIALIZED ON 3001`);

  io.on('connection', (socket) => {
    console.log(`[CAREPATH SOCKET] CLIENT CONNECTED ${socket.id}`);

    // Join Consultation Room
    socket.on('consultation:join', ({ consultationId, role }: { consultationId: string; role: string }) => {
      if (!consultationId) return;
      const room = `consultation:${consultationId}`;
      socket.join(room);
      
      const socketsInRoom = io?.sockets.adapter.rooms.get(room);
      const memberCount = socketsInRoom ? socketsInRoom.size : 1;
      
      console.log(`[SOCKET ROOM] ${role?.toUpperCase() || 'USER'} ${socket.id} joined ${room} (members=${memberCount})`);

      socket.emit('consultation:joined', {
        consultationId,
        room,
        role,
        members: memberCount,
      });

      if (memberCount >= 2) {
        console.log(`[SOCKET ROOM] BOTH PARTICIPANTS PRESENT in ${room}`);
      }

      // Relay join notification to other peers in the room
      socket.to(room).emit('signal:join', { role, socketId: socket.id, members: memberCount });
    });

    // Leave Consultation Room
    socket.on('consultation:leave', ({ consultationId, role }: { consultationId: string; role: string }) => {
      if (!consultationId) return;
      const room = `consultation:${consultationId}`;
      socket.leave(room);
      console.log(`[SOCKET ROOM] ${role?.toUpperCase() || 'USER'} ${socket.id} left ${room}`);
      socket.to(room).emit('consultation:peer_left', { role, socketId: socket.id });
    });

    // Send Chat Message Over Socket (Relay to OTHER peers in room to avoid double emit to sender)
    socket.on('chat:send', (data: { consultationId: string; message: any }) => {
      if (!data?.consultationId || !data?.message) return;
      const room = `consultation:${data.consultationId}`;
      const msgContent = data.message.content || JSON.stringify(data.message);
      console.log(`[CHAT SERVER] RECEIVED ${msgContent}`);
      console.log(`[CHAT SERVER] sender=${socket.id}`);
      console.log(`[CHAT SERVER] room=${room}`);
      console.log(`[CHAT SERVER] RELAYING TO PEERS`);
      
      // Relay strictly to OTHER sockets in the room (sender already updated local state)
      socket.to(room).emit('chat:message', data.message);
    });

    // WebRTC Signaling: Offer (Relayed strictly to opposite peer)
    socket.on('signal:offer', (data: { consultationId: string; offer: any; role?: string; from?: string }) => {
      if (!data?.consultationId || !data?.offer) return;
      const room = `consultation:${data.consultationId}`;
      console.log(`[WEBRTC SIGNAL] Offer relayed in ${room} from ${socket.id} (${data.role || 'unknown'})`);
      socket.to(room).emit('signal:offer', { ...data, from: socket.id });
    });

    // WebRTC Signaling: Answer (Relayed strictly to opposite peer)
    socket.on('signal:answer', (data: { consultationId: string; answer: any; role?: string; from?: string }) => {
      if (!data?.consultationId || !data?.answer) return;
      const room = `consultation:${data.consultationId}`;
      console.log(`[WEBRTC SIGNAL] Answer relayed in ${room} from ${socket.id} (${data.role || 'unknown'})`);
      socket.to(room).emit('signal:answer', { ...data, from: socket.id });
    });

    // WebRTC Signaling: ICE Candidate (Relayed strictly to opposite peer)
    socket.on('signal:ice-candidate', (data: { consultationId: string; candidate: any; role?: string; from?: string }) => {
      if (!data?.consultationId || !data?.candidate) return;
      const room = `consultation:${data.consultationId}`;
      socket.to(room).emit('signal:ice-candidate', { ...data, from: socket.id });
    });

    // Consultation End Event
    socket.on('consultation:end', (data: { consultationId: string; endedBy: string }) => {
      if (!data?.consultationId) return;
      const room = `consultation:${data.consultationId}`;
      console.log(`[SOCKET CONSULTATION END] Consultation ${data.consultationId} ended by ${data.endedBy}`);
      io?.to(room).emit('consultation:ended', {
        consultationId: data.consultationId,
        endedBy: data.endedBy || 'Doctor',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      });
    });

    // Legacy Room Joins
    socket.on('join:room', (room: string) => {
      socket.join(room);
      console.log(`[SOCKET ROOM] ${socket.id} joined room: ${room}`);
    });

    socket.on('join:doctor', (doctorId: string) => {
      const room = `doctor:${doctorId}`;
      socket.join(room);
      console.log(`[SOCKET ROOM] Joined doctor room: ${room}`);
    });

    socket.on('join:patient', (patientId: string) => {
      const room = `patient:${patientId}`;
      socket.join(room);
      console.log(`[SOCKET ROOM] Joined patient room: ${room}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`[CAREPATH SOCKET] CLIENT DISCONNECTED ${socket.id} reason=${reason}`);
    });
  });

  return io;
}

export function emitToRoom(room: string, event: string, payload: any) {
  if (io) {
    io.to(room).emit(event, payload);
    console.log(`📡 [CAREPATH BROADCAST] Room: ${room} | Event: ${event}`);
  }
}

export function broadcastAppointmentUpdate(appointment: any) {
  if (!io || !appointment) return;

  // Broadcast to Doctor room
  if (appointment.doctorId) {
    io.to(`doctor:${appointment.doctorId}`).emit('appointment:update', appointment);
    io.to(`doctor:${appointment.doctorId}`).emit('queue:update', appointment);
  }

  // Broadcast to Patient room
  if (appointment.patientId) {
    io.to(`patient:${appointment.patientId}`).emit('appointment:update', appointment);
  }

  // Broadcast to consultation room if appointmentId or id exists
  const aptId = appointment.appointmentId || appointment.id;
  if (aptId) {
    io.to(`consultation:${aptId}`).emit('appointment:update', appointment);
  }

  // Global broadcast for discovery/availability updates
  io.emit('availability:change', {
    doctorId: appointment.doctorId,
    date: appointment.date,
    timeSlot: appointment.timeSlot,
  });
}

export function broadcastDoctorStatus(doctorId: string, isOnline: boolean) {
  if (!io) return;
  io.emit('doctor:status', { doctorId, isOnline });
}
