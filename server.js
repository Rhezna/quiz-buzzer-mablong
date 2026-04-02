const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const playersList = [
  "Pia","Nairda","Nay","Idot","Nova",
  "Pranu","Ivan","Rzna","Ais","Nabin"
];

let players = {};
let buzzed = null;

// TIMER
let timer = 0;
let timerInterval = null;
let timerActive = false;

// INIT PLAYERS
playersList.forEach(name => {
  players[name] = { score: 0 };
});

io.on("connection", (socket) => {

  socket.on("join", (name) => {
    socket.name = name;
  });

  socket.on("get-data", () => {
    socket.emit("init", { players });
  });

  // BUZZ
  socket.on("buzz", () => {
    if (!timerActive) return;

    if (!buzzed) {
      buzzed = socket.name;
      io.emit("buzz-result", buzzed);
    }
  });

  // RESET BUZZ
  socket.on("reset-buzz", () => {
    buzzed = null;
    io.emit("reset");
  });

  // SCORE
  socket.on("score", ({ name, value }) => {
    players[name].score += value;

    io.emit("score-update", {
      players,
      highlight: { name, value }
    });
  });

  // RESET SCORE
  socket.on("reset-score", () => {
    Object.keys(players).forEach(p => players[p].score = 0);
    io.emit("score-update", { players });
  });

  // START TIMER
  socket.on("start-timer", () => {
    if (timerActive) return;

    buzzed = null;
    io.emit("reset");

    timer = 30;
    timerActive = true;

    io.emit("timer", timer);

    timerInterval = setInterval(() => {
      timer--;
      io.emit("timer", timer);

      if (timer <= 0) {
        clearInterval(timerInterval);
        timerActive = false;
        io.emit("timer-end");
      }
    }, 1000);
  });

  // STOP TIMER
  socket.on("stop-timer", () => {
    clearInterval(timerInterval);
    timerActive = false;
    io.emit("timer-end");
  });

});

server.listen(3000, () => {
  console.log("http://localhost:3000");
});
