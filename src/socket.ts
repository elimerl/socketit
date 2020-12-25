import WebSocket from "ws";
import { Duplex } from "stream";
/**
 * A socketit socket.
 * @class
 */
class Socket {
  private socket: WebSocket;
  private requestHandlers: Map<string, (requestBody?: unknown) => unknown>;
  private streams: Map<string, Duplex>;
  /**
   * A socketit socket.
   * @constructor
   * @param socket The socket to extend.
   * ```js
   * const {Socket, WebSocket} = require('socketit')
   * const ws = new WebSocket("ws://someurl.com")
   * const socket = new Socket(ws)
   * ```
   */
  constructor(socket: WebSocket) {
    this.socket = socket;

    this.requestHandlers = new Map();
    this.streams = new Map();
  }
  /**
   * Send a request and await the results.
   * @param resId
   * @param requestData
   * @returns A promise that resolves with the response.
   */
  request(resId: string, requestData?: unknown): Promise<unknown> {
    return new Promise((resolve) => {
      if (!requestData) {
        requestData = "";
      }
      this.socket.send(`req-${resId}#${JSON.stringify(requestData)}`);
      const listener = (data) => {
        const msg = data.toString();
        if (
          msg.split("-").shift() === "res" &&
          msg.split("#").shift().split("-").pop() === resId
        ) {
          const json =
            msg.split("#").pop() !== ""
              ? JSON.parse(msg.split("#").pop())
              : null;
          resolve(json);
        }
      };
      this.socket.on("message", listener);
    });
  }
  /**
   * Handle a request.
   * @param reqId The request ID to handle.
   * @param handler The function to be called when the request is called.
   */
  handle(reqId: string, handler: (req: unknown) => unknown): void {
    if (!this.requestHandlers.has(reqId)) {
      this.socket.on("message", (data) => {
        const msg = data.toString();
        if (
          msg.split("-").shift() === "req" &&
          msg.split("#").shift().split("-").pop() === reqId
        ) {
          const json =
            msg.split("#").pop() !== ""
              ? JSON.parse(msg.split("#").pop())
              : null;
          const res = handler(json);
          this.socket.send(`res-${reqId}#${JSON.stringify(res)}`);
        }
      });
      this.requestHandlers.set(reqId, handler);
    }
  }
  /**
   * Get a duplex stream with an ID.
   * @param id The id of the stream.
   * @returns A Duplex stream that is piped over WebSockets to the other party.
   */
  stream(id: string): Duplex {
    if (this.streams.has(id)) {
      return this.streams.get(id);
    }
    const stream = new Duplex({
      read() {
        return;
      },
      write: (data, encoding, done) => {
        this.socket.send(`stream-${id}#${JSON.stringify(data)}`);
        done(null);
      },
      objectMode: true,
    });
    this.socket.on("message", (msg) => {
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
