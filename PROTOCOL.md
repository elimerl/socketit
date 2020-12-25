# Protocol

This document serves as documentation for the `socketit` protocol.

## Messages

The messages sent between server and client follow this format:

```
type-id#json
```

These are used in either streams or request-response.

## Request-Response

The request can be initated by either the client or the server.
To initiate a request, send

```
req-id#reqJSON
```

and wait for the message

```
res-id#resJSON
```

These can be used as so in socketit:

```js
const { Server } = require("socketit");
const server = new socketit.Server();
server.on("connection", (socket) => {
  socket.request("position", (pos) => {
    console.log(`x: ${pos.x} y: ${pos.y}`);
  });
});
```

## Streams

socketit also allows streams of data being sent between client and server. An example use case would be a game where you want to stream position data to the server.

These are sent like this:

```
stream-id#streamData
```

In socketit these are used like:

```js
const { Client } = require("socketit");
const socket = new Client("localhost:8000");
const pos = { x: 0, y: 10 };
socket.on("connect", () => {
  setInterval(() => {
    socket.stream("pos").write(pos);
    pos.x += 10;
    pos.y -= 10;
  }, 100);
});
```
