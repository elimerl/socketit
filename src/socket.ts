import WebSocket = require("ws");
import { EventEmitter } from "events";
import { Duplex } from "stream";

class Socket {
  private __socket: WebSocket;
  requestHandlers: Map<string, Function>;
  streams: Map<string, Duplex>;
  constructor(socket: WebSocket) {
    this.__socket = socket;

    this.requestHandlers = new Map();
    this.streams = new Map();
  }
  /**
   * Send a request and await the results.
   * @param resId
   * @param requestData
   */
  request(resId: string, requestData?: any) {
    return new Promise((resolve) => {
      if (!requestData) requestData = "";
      this.__socket.send(`req-${resId}#${JSON.stringify(requestData)}`);
      const listener = (data) => {
        const msg = data.toString();
        if (
          msg.split("-").shift() === "res" &&
          msg.split("#").shift().split("-").pop() === resId
        ) {
          const json = JSON.parse(msg.split("#").pop());
          resolve(json);
        }
      };
      this.__socket.on("message", listener);
    });
  }
  /**
   * Handle a request.
   * @param reqId The request ID to handle.
   * @param handler The function to be called when the request is called.
   */
  handle(reqId: string, handler: (req: any) => any) {
    if (!this.requestHandlers.has(reqId)) {
      this.__socket.on("message", (data) => {
        const msg = data.toString();
        if (
          msg.split("-").shift() === "req" &&
          msg.split("#").shift().split("-").pop() === reqId
        ) {
          const json = JSON.parse(msg.split("#").pop());
          const res = handler(json);
          this.__socket.send(`res-${reqId}#${JSON.stringify(res)}`);
        }
      });
      this.requestHandlers.set(reqId, handler);
    }
  }
  /**
   * Get a duplex stream with an ID.
   */
  stream(id: string) {
    if (this.streams.has(id)) {
      return this.streams.get(id);
    }
    const that = this;
    const stream = new Duplex({
      read() {},
      write(data, encoding, done) {
        that.__socket.send(`stream-${id}#${JSON.stringify(data)}`);
        done(null);
      },
      objectMode: true,
    });
    this.__socket.on("message", (msg) => {
      const message = msg.toString();
      if (
        message.split("-").shift() === "stream" &&
        message.split("#").shift().split("-").pop() === id
      ) {
        stream.push(JSON.parse(message.split("#").pop()));
      } else {
        return;
      }
    });
    this.streams.set(id, stream);
    return stream;
  }
}
export default Socket;
