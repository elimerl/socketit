const socketit = require("../");
const server = new socketit.Server({ port: 8000 });
server.on("connection", (sock) => {
  const socket = new socketit.Socket(sock);
  socket.stream("pos").on("data", (data) => {
    console.log(`x: ${data.x} y: ${data.y}`);
  });
  setTimeout(() => {
    socket.request("position").then((pos) => {
      console.log(`requested position x: ${pos.x} y: ${pos.y}`);
    });
  }, 3000);
});
