
var express = require("express");
var app = express();
const { v4: uuidv4 } = require("uuid");

const server = require("http").createServer(app);
const io = require("socket.io")(server);
const port = 3000;
const users = {};

const createUserAvatar = () => {
  const ran1 = Math.round(Math.random() * 200 + 100);
  const ran2 = Math.round(Math.random() * 200 + 100);
  return `https://placeimg.com/${ran1}/${ran2}/any`;
};
const createUserOnline = () => {
  const values = Object.values(users);
  const usernameFilter = values.filter((u) => u.username !== undefined);
  return usernameFilter;
};

io.on("connection", (socket) => {
  users[socket.id] = { userId: uuidv4() };
  socket.on("disconnect", () => {
    delete users[socket.id];
    io.emit("action", { type: "online_List", data: createUserOnline() });
  });
  socket.on("action", (action) => {
    console.log(action, "action data");
    switch (action.type) {
      case "server/join":
        users[socket.id].username = action.data;
        users[socket.id].avatar = createUserAvatar();
        io.emit("action", { type: "online_List", data: createUserOnline() });
        socket.emit("action", { type: "self_user", data: users[socket.id] });
        break;
      case "server/private_message":
        const conversationId = action.data.conversationId;
        const from = users[socket.id].userId;
        const userValues = Object.values(users);
        const socketIds = Object.keys(users);
        for (let i = 0; i < userValues.length; i++) {
          if (userValues[i].userId === conversationId) {
            const socketId = socketIds[i];
            console.log(
              io.sockets.sockets[socketId],
              "io.sockets.sockets[socketId]"
            );
            io.to(socketId).emit("action", {
              type: "private_message",
              data: {
                ...action.data,
                conversationId: from,
              },
            });
            break;
          }
        }
        break;
    }
  });
});

app.get("/", function (req, res) {
  res.send("Hello World!");
});

app.listen(3000, function () {
  console.log(`Listening on ${port}`);
});
