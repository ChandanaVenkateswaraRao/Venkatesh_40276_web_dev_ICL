/**
 * Real-Time In-Memory Seat Locking Engine and Socket Telemetry
 */
const seatLocks = new Map();

function getActiveLocksForShowtime(showtimeId) {
  if (!seatLocks.has(showtimeId)) return {};
  const locksMap = seatLocks.get(showtimeId);
  const now = Date.now();
  const active = {};
  for (const [seatId, info] of locksMap.entries()) {
    // 8 minute lock TTL
    if (now - info.lockedAt < 8 * 60 * 1000) {
      active[seatId] = {
        socketId: info.socketId,
        userId: info.userId,
        userLabel: info.userLabel || 'Buyer',
        lockedAt: info.lockedAt
      };
    } else {
      locksMap.delete(seatId);
    }
  }
  return active;
}

function getTotalActiveLocksCount() {
  let count = 0;
  const now = Date.now();
  for (const [, locksMap] of seatLocks.entries()) {
    for (const [, info] of locksMap.entries()) {
      if (now - info.lockedAt < 8 * 60 * 1000) count++;
    }
  }
  return count;
}

function initSocketEngine(io, app) {
  app.set('seatLocks', seatLocks);
  app.set('getTotalActiveLocksCount', getTotalActiveLocksCount);

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

  io.on('connection', (socket) => {
    // 1. Customer joins a showtime screen
    socket.on('join_showtime', ({ showtimeId, userId }) => {
      socket.showtimeId = showtimeId;
      socket.userId = userId;
      const room = `showtime_${showtimeId}`;
      socket.join(room);

      // Send active seat locks in this auditorium
      socket.emit('initial_locks', getActiveLocksForShowtime(showtimeId));

      // Send viewer count in this auditorium
      const numViewers = io.sockets.adapter.rooms.get(room)?.size || 1;
      io.to(room).emit('viewers_count', numViewers);

      broadcastAuditEvent('CONNECT', `Client ${socket.id.substring(0, 6)} entered showtime room (${numViewers} active viewers)`, { showtimeId });
    });

    // 2. Customer selects / locks a seat
    socket.on('lock_seat', ({ showtimeId, seatId, userId, userLabel }) => {
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

      const label = userLabel || `User ${socket.id.substring(0, 4)}`;
      locksMap.set(seatId, {
        socketId: socket.id,
        userId,
        userLabel: label,
        lockedAt: Date.now()
      });

      // Broadcast to other users in this showtime that this seat is now held
      socket.to(`showtime_${showtimeId}`).emit('seat_locked_by_other', {
        seatId,
        socketId: socket.id,
        userId,
        userLabel: label
      });

      broadcastAuditEvent('LOCK', `Seat ${seatId} held by ${label} (8m TTL)`, { showtimeId, seatId });
    });

    // 3. Customer deselects / unlocks a seat
    socket.on('unlock_seat', ({ showtimeId, seatId }) => {
      if (seatLocks.has(showtimeId)) {
        seatLocks.get(showtimeId).delete(seatId);
      }
      io.to(`showtime_${showtimeId}`).emit('seat_unlocked', { seatId });
      broadcastAuditEvent('UNLOCK', `Seat ${seatId} unlocked by client ${socket.id.substring(0, 6)}`, { showtimeId, seatId });
    });

    // 3b. Partner / Admin Force Unlock (Manager Override)
    socket.on('force_unlock_seat', ({ showtimeId, seatId, partnerName }) => {
      if (seatLocks.has(showtimeId)) {
        seatLocks.get(showtimeId).delete(seatId);
      }
      io.to(`showtime_${showtimeId}`).emit('seat_unlocked', { seatId });
      broadcastAuditEvent('RELEASE', `[Cinema Manager Override] Seat ${seatId} was force-released by ${partnerName || 'Staff'}`, { showtimeId, seatId });
    });

    // 4. Admin / Theater Partner joins live feed
    socket.on('join_admin_feed', () => {
      socket.join('admin_feed');
      broadcastAuditEvent('CONNECT', `Administrator connected to live telemetry stream`, {});
    });

    // 5. User disconnects / leaves page -> auto-release temporary locks held by this user
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
}

module.exports = {
  seatLocks,
  getActiveLocksForShowtime,
  getTotalActiveLocksCount,
  initSocketEngine
};
