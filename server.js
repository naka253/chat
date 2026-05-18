const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const fs = require("fs");
const path = require("path");

const app = express();

const server = http.createServer(app);

const io = new Server(server);

/* HTML公開 */
app.use(express.static(__dirname));

/* 履歴ファイル */
const HISTORY_FILE = path.join(__dirname, "messages.json");

/* 履歴読み込み */
let messages = [];

if(fs.existsSync(HISTORY_FILE)){

  try{
    const data = fs.readFileSync(HISTORY_FILE, "utf8");
    messages = JSON.parse(data);
  }catch(err){
    console.log("履歴読み込み失敗");
    messages = [];
  }
}

/* 履歴保存 */
function saveMessages(){

  fs.writeFileSync(
    HISTORY_FILE,
    JSON.stringify(messages, null, 2)
  );
}

/* Socket.IO */
io.on("connection", (socket) => {

  console.log("接続");

  /* 接続時に履歴送信 */
  socket.emit("chat history", messages);

  /* 入室 */
  socket.on("join", (username) => {

    socket.username = username;

    const systemMessage = {
      type: "system",
      text: `${username} さんが入室しました`
    };

    messages.push(systemMessage);

    saveMessages();

    io.emit("system message", systemMessage.text);
  });

  /* メッセージ */
  socket.on("chat message", (data) => {

    const messageData = {
      type: "chat",
      username: data.username,
      text: data.text
    };

    messages.push(messageData);

    /* 最大500件 */
    if(messages.length > 500){
      messages.shift();
    }

    saveMessages();

    io.emit("chat message", messageData);
  });

  /* 切断 */
  socket.on("disconnect", () => {

    if(socket.username){

      const systemMessage = {
        type: "system",
        text: `${socket.username} さんが退出しました`
      };

      messages.push(systemMessage);

      saveMessages();

      io.emit("system message", systemMessage.text);
    }

    console.log("切断");
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {

  console.log(`Server running on ${PORT}`);
});
