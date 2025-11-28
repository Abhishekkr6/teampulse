let socket: WebSocket | null = null;
const listeners: ((event: unknown) => void)[] = [];

export const connectWS = () => {
  if (socket) return socket;

  socket = new WebSocket("ws://localhost:4001");

  socket.onopen = () => console.log("[WS] Connected");
  socket.onclose = () => {
    console.log("[WS] Disconnected. Reconnecting...");
    setTimeout(() => {
      socket = null;
      connectWS();
    }, 2000);
  };

  socket.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      listeners.forEach((cb) => cb(data));
    } catch {}
  };

  return socket;
};

export const subscribeWS = (cb: (event: unknown) => void) => {
  listeners.push(cb);
};
