const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

/* index.htmlを公開 */
app.use(express.static(__dirname));

/* 接続 */
io.on("connection", (socket) => {

  console.log("ユーザー接続");

  /* 入室 */
  socket.on("join", (username) => {

    socket.username = username;

    io.emit(
      "system message",
      `${username} さんが入室しました`
    );
  });

  /* メッセージ */
  socket.on("chat message", (data) => {

    io.emit("chat message", data);
  });

  /* 切断 */
  socket.on("disconnect", () => {

    if(socket.username){

      io.emit(
        "system message",
        `${socket.username} さんが退出しました`
      );
    }

    console.log("ユーザー切断");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(`Server running on ${PORT}`);
});
