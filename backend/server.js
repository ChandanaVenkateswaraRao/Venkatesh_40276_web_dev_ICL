require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movies');
const paymentRoutes = require('./routes/payment');
const adminRoutes = require('./routes/admin');
const theaterRoutes = require('./routes/theaters');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io to express app so routes can access it via req.app.get('io')
app.set('io', io);

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/theaters', theaterRoutes);

// ==========================================
// REAL-TIME IN-MEMORY SEAT LOCKING ENGINE
// ==========================================
// Map: showtimeId -> Map(seatId -> { socketId, userId, lockedAt })
const seatLocks = new Map();

function getActiveLocksForShowtime(showtimeId) {
  if (!seatLocks.has(showtimeId)) return {};
  const locksMap = seatLocks.get(showtimeId);
  const now = Date.now();
  const active = {};
  for (const [seatId, info] of locksMap.entries()) {
    // 8 minute lock TTL
    if (now - info.lockedAt < 8 * 60 * 1000) {
      active[seatId] = { socketId: info.socketId, userId: info.userId };
    } else {
      locksMap.delete(seatId);
    }
  }
  return active;
}

io.on('connection', (socket) => {
  function broadcastAuditEvent(type, message, meta = {}) {
    const auditPayload = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type, // 'LOCK' | 'UNLOCK' | 'RELEASE' | 'BOOK' | 'CONNECT' | 'SIMULATE'
      message,
      meta
    };
    io.to('admin_feed').emit('admin_audit_event', auditPayload);
  }
  app.set('broadcastAuditEvent', broadcastAuditEvent);

  // 1. Customer joins a showtime screen
  socket.on('join_showtime', ({ showtimeId, userId }) => {
    socket.showtimeId = showtimeId;
    socket.userId = userId;
    const room = `showtime_${showtimeId}`;
    socket.join(room);

    // Send active seat locks in this auditorium to the joining user
    socket.emit('initial_locks', getActiveLocksForShowtime(showtimeId));

    // Send viewer count in this auditorium
    const numViewers = io.sockets.adapter.rooms.get(room)?.size || 1;
    io.to(room).emit('viewers_count', numViewers);

    // Telemetry audit log
    broadcastAuditEvent('CONNECT', `Client ${socket.id.substring(0, 6)} entered showtime room (${numViewers} active viewers)`, { showtimeId });
  });

  // 2. Customer selects / locks a seat
  socket.on('lock_seat', ({ showtimeId, seatId, userId }) => {
    if (!seatLocks.has(showtimeId)) {
      seatLocks.set(showtimeId, new Map());
    }
    const locksMap = seatLocks.get(showtimeId);
    const existing = locksMap.get(seatId);

    // If already locked by someone else within 8 minutes
    if (existing && existing.socketId !== socket.id && (Date.now() - existing.lockedAt < 8 * 60 * 1000)) {
      socket.emit('seat_lock_failed', { seatId, msg: 'Seat was just reserved by another user' });
      broadcastAuditEvent('LOCK', `Lock collision rejected for seat ${seatId}`, { showtimeId, seatId });
      return;
    }

    locksMap.set(seatId, {
      socketId: socket.id,
      userId,
      lockedAt: Date.now()
    });

    // Broadcast to other users in this showtime that this seat is now held
    socket.to(`showtime_${showtimeId}`).emit('seat_locked_by_other', {
      seatId,
      socketId: socket.id,
      userId
    });

    broadcastAuditEvent('LOCK', `Seat ${seatId} held by client ${socket.id.substring(0, 6)} (8m TTL)`, { showtimeId, seatId });
  });

  // 3. Customer deselects / unlocks a seat
  socket.on('unlock_seat', ({ showtimeId, seatId }) => {
    if (seatLocks.has(showtimeId)) {
      seatLocks.get(showtimeId).delete(seatId);
    }
    // Broadcast to everyone that the seat is free again
    io.to(`showtime_${showtimeId}`).emit('seat_unlocked', { seatId });
    broadcastAuditEvent('UNLOCK', `Seat ${seatId} unlocked by client ${socket.id.substring(0, 6)}`, { showtimeId, seatId });
  });

  // 4. Admin / Theater Partner joins live feed
  socket.on('join_admin_feed', () => {
    socket.join('admin_feed');
    broadcastAuditEvent('CONNECT', `Administrator connected to live telemetry stream`, {});
  });

  // 5. User disconnects / leaves page -> release temporary locks held by this user
  socket.on('disconnect', () => {
    if (socket.showtimeId && seatLocks.has(socket.showtimeId)) {
      const locksMap = seatLocks.get(socket.showtimeId);
      const releasedSeats = [];
      for (const [seatId, info] of locksMap.entries()) {
        if (info.socketId === socket.id) {
          locksMap.delete(seatId);
          releasedSeats.push(seatId);
        }
      }

      if (releasedSeats.length > 0) {
        io.to(`showtime_${socket.showtimeId}`).emit('seats_released', {
          seats: releasedSeats
        });
        broadcastAuditEvent('RELEASE', `Client disconnected: Auto-released ${releasedSeats.length} held seat(s) [${releasedSeats.join(', ')}]`, { seats: releasedSeats });
      }

      const room = `showtime_${socket.showtimeId}`;
      const numViewers = io.sockets.adapter.rooms.get(room)?.size || 0;
      io.to(room).emit('viewers_count', numViewers);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Real-Time Socket Server running on port ${PORT}`));
