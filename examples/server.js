const socketit = require("socketit");
const server = new socketit.Server();
server.on("connection", (socket) => {
  socket.stream("pos").on("data", (data) => {
    console.log(`x: ${data.x} y: ${data.y}`);
  });
});
server.listen(8000);
