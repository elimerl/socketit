import test from "ava";
import getPort = require("get-port");
import WebSocket, { Server } from "ws";
import Socket from "../";
test.cb("stream message to client from server", (t) => {
  getPort().then((port) => {
    const server = new Server({ port });
    const client = new WebSocket(`ws://localhost:${port}`);
    // server code
    server.on("connection", (sock) => {
      const socket = new Socket(sock);
      socket.stream("chat").write("Test");
    });
    const socket = new Socket(client);
    socket.stream("chat").on("data", (data) => {
      t.is(data, "Test");
      t.end();
    });
  });
});
