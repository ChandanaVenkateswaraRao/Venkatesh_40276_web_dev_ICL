import { io } from 'socket.io-client';
import { BACKEND_URL } from '../api/config';

const SOCKET_URL = BACKEND_URL;

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  }
  return socket;
};

export default getSocket;
