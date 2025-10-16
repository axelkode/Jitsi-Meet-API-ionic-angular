const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Almacenar salas y usuarios
const rooms = new Map();
const users = new Map();

io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);

  // Unirse a una sala
  socket.on('join-room', (data) => {
    const { roomId, userId, userName } = data;
    
    socket.join(roomId);
    socket.userId = userId;
    socket.userName = userName;
    socket.roomId = roomId;

    // Guardar información del usuario
    users.set(socket.id, {
      id: userId,
      name: userName,
      roomId: roomId,
      socketId: socket.id
    });

    // Obtener usuarios existentes en la sala
    const roomUsers = Array.from(users.values()).filter(user => user.roomId === roomId);
    
    // Notificar a otros usuarios en la sala
    socket.to(roomId).emit('user-joined', {
      userId: userId,
      userName: userName,
      socketId: socket.id
    });

    // Enviar lista de usuarios existentes al nuevo usuario
    socket.emit('room-users', roomUsers);

    console.log(`Usuario ${userName} (${userId}) se unió a la sala ${roomId}`);
  });

  // Enviar oferta WebRTC
  socket.on('offer', (data) => {
    const { targetUserId, offer } = data;
    const targetUser = Array.from(users.values()).find(user => user.id === targetUserId);
    
    if (targetUser) {
      io.to(targetUser.socketId).emit('offer', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        offer: offer
      });
      console.log(`Oferta enviada de ${socket.userName} a ${targetUser.name}`);
    }
  });

  // Enviar respuesta WebRTC
  socket.on('answer', (data) => {
    const { targetUserId, answer } = data;
    const targetUser = Array.from(users.values()).find(user => user.id === targetUserId);
    
    if (targetUser) {
      io.to(targetUser.socketId).emit('answer', {
        fromUserId: socket.userId,
        fromUserName: socket.userName,
        answer: answer
      });
      console.log(`Respuesta enviada de ${socket.userName} a ${targetUser.name}`);
    }
  });

  // Enviar ICE candidate
  socket.on('ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    const targetUser = Array.from(users.values()).find(user => user.id === targetUserId);
    
    if (targetUser) {
      io.to(targetUser.socketId).emit('ice-candidate', {
        fromUserId: socket.userId,
        candidate: candidate
      });
    }
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      // Notificar a otros usuarios en la sala
      socket.to(user.roomId).emit('user-left', {
        userId: user.id,
        userName: user.name
      });
      
      users.delete(socket.id);
      console.log(`Usuario ${user.name} desconectado de la sala ${user.roomId}`);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Servidor de signaling corriendo en puerto ${PORT}`);
  console.log(`📡 WebSocket disponible en ws://localhost:${PORT}`);
});
