// eslint-disable-next-line @typescript-eslint/no-var-requires
import { Server, Socket } from "../../";
const server = new Server({ port: 8000 });
server.on("connection", (sock) => {
  const socket = new Socket(sock);
  socket.stream("meow").on("data", (data) => {
    console.log(data);
  });
});
