// eslint-disable-next-line @typescript-eslint/no-var-requires
const socketit = require("../");

const ws = new socketit.WebSocket("ws://localhost:8000");
const pos = { x: 0, y: 10 };
ws.on("open", () => {
  const socket = new socketit.Socket(ws);
  socket.handle("position", () => {
    console.log("request for pos");
    return pos;
  });
  setInterval(() => {
    socket.stream("pos").write(pos);
    pos.x += 10;
    pos.y -= 10;
  }, 100);
});
