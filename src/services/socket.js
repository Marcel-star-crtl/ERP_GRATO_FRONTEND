import io from 'socket.io-client';

const setupSocket = (api) => {
  const socket = io(process.env.REACT_APP_API_URLL || 'http://localhost:5000', {
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: (cb) => {
      const token = localStorage.getItem('token');
      cb({ token });
    }
  });

  // Handle connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });

  // Re-authenticate if token changes
  const originalRequest = api.interceptors.request.handlers[0].fulfilled;
  api.interceptors.request.handlers[0].fulfilled = (config) => {
    const token = localStorage.getItem('token');
    if (token && socket.connected) {
      socket.auth = { token };
      socket.disconnect().connect();
    }
    return originalRequest(config);
  };

  return socket;
};

export { setupSocket };