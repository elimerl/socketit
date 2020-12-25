const socketit = require("socketit");
const socket = new socketit.Client("localhost:8000");
const pos = { x: 0, y: 10 };
socket.on("connect", () => {
  socket.handle("position", () => {
    return pos;
  });
  setInterval(() => {
    socket.stream("pos").write(pos);
    pos.x += 10;
    pos.y -= 10;
  }, 100);
});
