import { Duplex } from "stream";
const isBrowser =
  typeof window !== "undefined" && typeof window.document !== "undefined";
// Types taken from lib.dom.d.ts
/** Provides the API for creating and managing a WebSocket connection to a server, as well as for sending and receiving data on the connection. */
interface WebSocket extends EventTarget {
  /**
   * Returns a string that indicates how binary data from the WebSocket object is exposed to scripts:
   *
   * Can be set, to change how binary data is returned. The default is "blob".
   */
  binaryType: BinaryType;
  /**
   * Returns the number of bytes of application data (UTF-8 text and binary data) that have been queued using send() but not yet been transmitted to the network.
   *
   * If the WebSocket connection is closed, this attribute's value will only increase with each call to the send() method. (The number does not reset to zero once the connection closes.)
   */
  readonly bufferedAmount: number;
  /**
   * Returns the extensions selected by the server, if any.
   */
  readonly extensions: string;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null;
  onerror: ((this: WebSocket, ev: Event) => any) | null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null;
  onopen: ((this: WebSocket, ev: Event) => any) | null;
  /**
   * Returns the subprotocol selected by the server, if any. It can be used in conjunction with the array form of the constructor's second argument to perform subprotocol negotiation.
   */
  readonly protocol: string;
  /**
   * Returns the state of the WebSocket object's connection. It can have the values described below.
   */
  readonly readyState: number;
  /**
   * Returns the URL that was used to establish the WebSocket connection.
   */
  readonly url: string;
  /**
   * Closes the WebSocket connection, optionally using code as the the WebSocket connection close code and reason as the the WebSocket connection close reason.
   */
  close(code?: number, reason?: string): void;
  /**
   * Transmits data using the WebSocket connection. data can be a string, a Blob, an ArrayBuffer, or an ArrayBufferView.
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void;
  readonly CLOSED: number;
  readonly CLOSING: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
  addEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener<K extends keyof WebSocketEventMap>(
    type: K,
    listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any,
    options?: boolean | EventListenerOptions
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;
}

declare const WebSocket: {
  prototype: WebSocket;
  new (url: string, protocols?: string | string[]): WebSocket;
  readonly CLOSED: number;
  readonly CLOSING: number;
  readonly CONNECTING: number;
  readonly OPEN: number;
};
/**
 * A socketit socket, adapted for use in the browser.
 * @class
 */
class BrowserSocket {
  private socket: WebSocket;
  private requestHandlers: Map<string, (requestBody?: unknown) => unknown>;
  private streams: Map<string, Duplex>;
  /**
   * A socketit socket.
   * @constructor
   * @param socket The socket to extend.
   * ```js
   * const {Socket} = require('socketit')
   * const ws = new WebSocket("ws://someurl.com")
   * const socket = new Socket(ws)
   * ```
   */
  constructor(socket: WebSocket) {
    if (!isBrowser) {
      throw new Error(
        "BrowserSocket cannot be used outside the browser. Try Socket instead."
      );
    }
    this.socket = socket;
    this.requestHandlers = new Map();
    this.streams = new Map();
    this.socket.addEventListener("message", (ev) => {
      const msg = ev.data.toString();
      if (
        msg.split("-").shift() === "req" &&
        this.requestHandlers.has(msg.substr(0, msg.indexOf("#")).split("-")[1])
      ) {
        const json =
          msg.split("#").pop() !== "" ? JSON.parse(msg.split("#").pop()) : null;
        const res = this.requestHandlers.get(
          msg.substr(0, msg.indexOf("#")).split("-")[1]
        )(json);
        this.socket.send(
          `res-${
            msg.substr(0, msg.indexOf("#")).split("-")[1]
          }#${JSON.stringify(res)}`
        );
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
        const msg: string = data.data.toString();
        if (
          msg.split("-").shift() === "res" &&
          msg.substr(0, msg.indexOf("#")).split("-")[1] === reqId
        ) {
          const json =
            msg.substr(msg.indexOf("#") + 1) !== ""
              ? JSON.parse(msg.substr(msg.indexOf("#") + 1))
              : null;
          resolve(json);
        }
      };
      this.socket.addEventListener("message", listener);
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
    this.socket.addEventListener("message", (msg) => {
      const message = msg.data.toString();
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
export default BrowserSocket;
