<h1 align="center">socketit</h1>
<p>
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <a href="https://github.com/elimerl/socketit/tree/master/docs/GUIDE.md" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://choosealicense.com/licenses/mit/" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg" />
  </a>
</p>

> A stream-based WebSocket library.

### 🏠 [Homepage](https://github.com/elimerl/socketit)

## Install

```sh
yarn add socketit
```

## Usage

Simple server:

```js
const socketit = require("socketit");
const server = new socketit.Server();
server.on("connection", (socket) => {
  socket.stream("pos").on("data", (data) => {
    console.log(`x: ${data.x} y: ${data.y}`);
  });
});
server.listen(8000);
```

Simple client:

```js
const socketit = require("socketit");
const socket = new socketit.Client("localhost:8000");
const pos = { x: 0, y: 10 };
setInterval(() => {
  socket.stream("pos").write(pos);
  pos.x += 10;
  pos.y -= 10;
}, 100);
```

More examples in [`examples/`](examples/).

## Run tests

```sh
yarn test
```

## Author

👤 **elimerl**

- Website: https://github.com/elimerl
- Github: [@elimerl](https://github.com/elimerl)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/elimerl/socketit/issues).

## Show your support

Give a ⭐️ if this project helped you!

## 📝 License

Copyright © 2020 [elimerl](https://github.com/elimerl).<br />
This project is [MIT](https://choosealicense.com/licenses/mit/) licensed.

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
