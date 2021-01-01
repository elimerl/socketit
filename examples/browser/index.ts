// Create WebSocket connection.
import { BrowserSocket } from "../../";

const ws = new WebSocket("ws://localhost:8000");

ws.addEventListener("open", () => {
  const socket = new BrowserSocket(ws);
  ws.onmessage = (ev) => console.log(ev.data);
  setInterval(() => {
    socket.stream("meow").write("meow " + Math.random());
  }, 100);
});
