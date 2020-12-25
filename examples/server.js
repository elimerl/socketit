// eslint-disable-next-line @typescript-eslint/no-var-requires
const socketit = require("../");
const server = new socketit.Server({ port: 8000 });
server.on("connection", (sock) => {
  const socket = new socketit.Socket(sock);
  socket.stream("pos").on("data", (data) => {
    console.log(data);
  });
});
