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
    this.socket.on("message", (data) => {
      const msg = data.toString();
      if (
        msg.split("-").shift() === "req" &&
        this.requestHandlers.has(msg.split("-")[1])
      ) {
        const json =
          msg.split("#").pop() !== "" ? JSON.parse(msg.split("#").pop()) : null;
        const res = this.requestHandlers.get(msg.split("-")[1])(json);
        this.socket.send(`res-${msg.split("-")[1]}#${JSON.stringify(res)}`);
      }
    });
  }
  /**
   * Send a request and await the results.
   * @param reqId The ID of the request.
   * @param requestData Optional data to be passed along with the request.
   * @returns A promise that resolves with the response.
   */
  request(reqId: string, requestData?: unknown): Promise<unknown> {
    return new Promise((resolve) => {
      if (!requestData) {
        requestData = "";
      }
      this.socket.send(`req-${reqId}#${JSON.stringify(requestData)}`);
      const listener = (data) => {
        const msg: string = data.toString();
        if (msg.split("-").shift() === "res" && msg.split("-")[1] === reqId) {
          const json =
            msg.substr(msg.indexOf("#") + 1) !== ""
              ? JSON.parse(msg.substr(msg.indexOf("#") + 1))
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
      this.requestHandlers.set(reqId, handler);
    } else {
      throw new Error("Already have a request handler set for that.");
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
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      read() {},
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
        message.split("-")[1].substr(0, id.length) === id
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
