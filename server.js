// server.js
// where your node app starts

// init project
var express = require("express");
var app = express();
const http = require("http");
const serv = http.Server(app);
const io = require("socket.io")(serv, {});
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 280000);

function lerp(start, end, delta) {
  return (end - start) * delta + start;
}
// we've started you off with Express,
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));
app.get("/restart", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
  process.exit(1);
});
// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  console.log(`Pinged ${Date()}`);
  response.sendFile(__dirname + "/views/index.html");
});
app.use("/", express.static(__dirname + "/views"));

// listen for requests :)
let players = {};
let sockets = {};
io.on("connection", async function(socket) {
  let ip = socket.handshake.headers["x-forwarded-for"].split(/,/gi)[0];
  players[socket.id] = {
    id: socket.id
  };
  sockets[socket.id] = {
    id: socket.id,
    ip: ip,
    goal: {},
    movement: {
      interpolated: true,
      pressingLeft: false,
      pressingRight: false,
      pressingUp: false,
      pressingDown: false
    }
  };

  console.log(`${ip} or ${socket.id} has joined`);

  socket.on("disconnect", async () => {
    socket.emit("disconnected", {});
    console.log(`${ip} or ${socket.id} has left`);
    delete players[socket.id];
    delete sockets[socket.id];
  });
  let FPS = 10;


  socket.on("interpol", data => {
    FPS = 10;
    console.log("off");
  });

  socket.on("data", data => {
    if (!data.delta) {
      data.delta = 0;
      console.log("set timestamp");
      return;
    }

    let it = players[socket.id].onFor;
    let now = Date.now();
    let diff = (now - players[socket.id].joinedTimestamp)/1000;
    let newval = (data.delta + it);
    if (newval > diff) return console.log('hack')
    players[socket.id].onFor = (data.delta + it);
    let str = `delta: ${data.delta}, it: ${it} and newval: ${newval} or ${players[socket.id].onFor}, diff: ${diff} diff-it ${diff-it} diff-newval ${diff-newval}`

    //if (players[socket.id].onFor > diff) return console.log('hacc')
    //console.log('not hack')
    console.log(
      str
    );

    arrowKeys(data);
    movement(data.delta);
    wallCollision();
  });

  socket.on("readyman", function(data) {
    players[socket.id].color = data.color;
    players[socket.id].x = data.x;
    players[socket.id].y = data.y;
    players[socket.id].onFor = 0;
    players[socket.id].joinedTimestamp = Date.now()
    socket.emit("thisisyou", socket.id);
    console.log(players[socket.id]);
    if (Object.keys(players[socket.id]) < 3)
      return socket.emit("notready", "Not enough data");
    var previous = Date.now()
    let game = () => {
      setTimeout(game, 1000 / FPS);
      var now = Date.now();
      var delta = now - previous;
      previous = now;
      players[socket.id].delta = delta;
      if (players[socket.id] == undefined || players[socket.id] == null)
        return socket.emit("disconnected");
      if (Object.keys(players[socket.id]) < 3)
        return socket.emit("disconnected", "Not enough data");
      players[socket.id].FPS = Math.round(1000/delta);
      socket.emit("newData", players, socket.id);
    };
    game();
  });


  let movement = d => {
    if (sockets[socket.id].goal.x)
      players[socket.id].x += sockets[socket.id].goal.x * d;

    if (sockets[socket.id].goal.y)
      players[socket.id].y += sockets[socket.id].goal.y * d;
  };

  let arrowKeys = (dat) => {
    let me = sockets[socket.id];
    let rn = dat
    let goal = me.goal;
    let n = 200;
    if (rn.right) {
      goal.x = n;
      goal.y = undefined;
      return;
    }

    if (rn.left) {
      goal.x = -n;
      goal.y = undefined;
      return;
    }

    if (rn.up) {
      goal.x = undefined;
      goal.y = -n;
      return;
    }

    if (rn.down) {
      goal.x = undefined;
      goal.y = n;
      return;
    }

    goal.x = undefined;
    goal.y = undefined;
  };

  let wallCollision = () => {
    let playerrn = players[socket.id];
    let x = playerrn.x + 35;
    let y = playerrn.y + 35;

    if (x - 70 <= 0) players[socket.id].x = 35;
    if (x >= 1000) players[socket.id].x = 965;

    if (y - 70 <= 0) players[socket.id].y = 35;
    if (y >= 700) players[socket.id].y = 665;
  };
});

serv.listen(3000, function() {
  console.log("listening on *:3000");
});