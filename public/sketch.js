/* eslint no-undef: 0 */
var controls = {
  right: false,
  left: false,
  up: false,
  down: false,
  delta: 0,
  id: 0
};
var blobs = [];
var players = {};
var screenwidth = 100;
var screenheight = 100;
var blob;
var gameData;
var loctext;
var interpolated = true;
var previous;
var delta;
var images = {};
var tm;
var added = 0;
var onfor = 0;
var me = {
  goal: {
    x: undefined,
    y: undefined
  }
};
var ghost = true;

socket.on("disconnect", function(reason) {
  if (reason === "io server disconnect") {
    // the disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
  textstuff.innerHTML += "<br>DISCONNECTED";
  // else the socket will automatically try to reconnect
});

function arrowKeys() {
  var n = 200;
  var rn = controls;
    if (rn.right) {
      me.goal.x = n;
      me.goal.y = undefined;
      return;
    }

    if (rn.left) {
      me.goal.x = -n;
      me.goal.y = undefined;
      return;
    }

    if (rn.up) {
      me.goal.x = undefined;
      me.goal.y = -n;
      return;
    }

    if (rn.down) {
      me.goal.x = undefined;
      me.goal.y = n;
      return;
    }

    me.goal.x = undefined;
    me.goal.y = undefined;
}

function move(d) {
  if (me.goal.x) me.x += me.goal.x * d;
  if (me.goal.y) me.y += me.goal.y * d;
}

function wallCollision() { 
    var playerrn = me;
    var x = playerrn.x + 35;
    var y = playerrn.y + 35;

    if (x - 70 <= 0) me.x = 35;
    if (x >= 1000) me.x = 965;

    if (y - 70 <= 0) me.y = 35;
    if (y >= 700) me.y = 665;
  };

function Blob(x, y) {
  this.pos = createVector(x, y);
  this.size = 70;
  this.colors = [
    Math.random() * 255,
    Math.random() * 255,
    Math.random() * 255,
    this.pos.x,
    this.pos.y
  ];
  this.color = color(this.colors[0], this.colors[1], this.colors[2]);

  this.myColor = function() {
    return this.colors;
  };

  this.update = function() {
    if (controls.state) {
      let pos = [this.pos.x, this.pos.y];
      this.pos.x = pos[0] + controls.loc[0];
      this.pos.y = pos[1] + controls.loc[1];
    }
    socket.emit("currentPosition", [this.pos.x, this.pos.y]);
  };

  this.show = function() {
    // Define color 'c'
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    fill(1);
    text("O w O", this.pos.x - 12, this.pos.y);
    fill(255);
    text(
      "a blob",
      this.pos.x - this.size / 2 + 10,
      this.pos.y + this.size / 2 + 13
    );
  };

  this.setLoc = function(loc) {
    this.loc = loc;
  };
}

function subBlob(x, y, c) {
  this.pos = createVector(x, y);
  if (c) {
    this.color = color(c[0], c[1], c[2]);
  } else {
    this.color = 255;
  }
  this.size = 70;
  this.loc = "a blob";

  this.update = function(newx, newy, mycolor) {
    if (mycolor) {
      this.color = color(mycolor[0], mycolor[1], mycolor[2]);
    } else {
      this.color = 255;
    }
    this.pos.x = newx;
    this.pos.y = newy;
  };

  this.setLoc = function(loc) {
    this.loc = loc;
  };

  this.show = function() {
    fill(this.color);
    ellipse(this.pos.x, this.pos.y, this.size, this.size);
    fill(1);
    text("O w O", this.pos.x - 12, this.pos.y);
    fill(255);
    text(
      this.loc,
      this.pos.x - this.size / 2 + 10,
      this.pos.y + this.size / 2 + 13
    );
  };

  this.ghost = function(ax, ay) {
    fill(0, 0, 0, 20);
    ellipse(ax, ay, this.size, this.size);
  };
}

function lerp(start, end, delta) {
  return (end - start) * delta + start;
}

var bg;

function setup() {
  var canv = createCanvas(1000, 700);
  canv.parent("canv");
  bg = loadImage(
    "https://cdn.glitch.com/eef80390-2b2d-4a5d-af5b-49a5d652a0c3%2Fspace%20orion.jpg?1538927392512"
  );
  images["island"] = loadImage("https://i.imgur.com/nbCsttz.png");
  stroke(255);
  frameRate(60); // Set line drawing color to white
  screenwidth = width;
  screenheight = height;
  var nowx = Math.random() * screenwidth;
  var nowy = Math.random() * screenheight;
  var nowc = [Math.random() * 255, Math.random() * 255, Math.random() * 255];
  me.x = nowx;
  me.y = nowy;
  me.color = nowc;
  socket.emit("readyman", {
    color: nowc,
    x: nowx,
    y: nowy
  });
  me["blob"] = new subBlob(nowx, nowy, nowc)
  previous = Date.now();
  tm = previous;
  function loop() {
    window.requestAnimationFrame(loop);

    document.body.scrollTop = document.body.scrollHeight;
    background(bg);
    image(images["island"], 30, height / 2);
      var now = Date.now();
      delta = (now - previous) / 1000;
      onfor = (now - tm) / 1000;
      added += delta;

      previous = now;
    for (var i in gameData) {
      if (i == socket.id) continue;
      var data = gameData[i];
      loctext = document.getElementById("loc");
      if (!data.color || !data.x || !data.y) continue;
      if (players[i]) {
        var x = players[i].pos.x;
        var y = players[i].pos.y;
        var newX = data.x;
        var newY = data.y;
        var loc = [x, y]
        if (interpolated) {
          FPS = Math.round(1/delta)
          x = lerp(newX, x,0.5) //(delta * 10)
          y = lerp(newY, y,0.5)
          var it = Math.round(FPS / players[i].FPS)
          var abs = ""
          if (String.prototype.repeat) abs += '/2'.repeat(it)
          else abs = "/2 /2 /2"
          var max = eval('8'+abs)
          if (Math.abs(x - newX) < max) x = newX;
          if (Math.abs(y - newY) < max) y = newY;
        } else {
          x = newX;
          y = newY;
        }
        players[i].update(x, y, data.color);
        if (ghost) players[i].ghost(newX, newY);
        //if (i == socket.id) loctext.innerHTML = "x: " + x + ", y: " + y;
        players[i].setLoc("x: " + x + ", y: " + y);
        players[i].show();
      } else {
        var blob = new subBlob(data.x || 50, data.y || 50, data.color);
        blob.show();
        players[i] = blob;
      }
    }
    /*if (controls.isPressingSomething) {*/

    /*}*/
    console.log("onfor: " + onfor + " added: " + added);
    controls.delta = delta;
    controls.id++;
    arrowKeys();
    move(delta || 0);
    wallCollision();
    me['blob'].update(me.x, me.y, me.color)
    me['blob'].show()
    /*if (JSON.stringify)controls = JSON.stringify(controls)*/
    /*if (controls.isPressingSomething)*/ socket.emit("data", controls);
  }

  loop();
}

function draw() {}

socket.on("newData", function(datas, me) {
  gameData = datas;
});

document.onkeydown = function(e) {
  event = e || window.event;
  controls.isPressingSomething = true;
  //event = e || window.event;
  if (event.keyCode == "39") {
    //right
    controls.right = true;
    console.log("right down");
    //socket.emit("rightMvmt", { state: true });
  } else if (event.keyCode == "37") {
    //left
    controls.left = true;
    //socket.emit("leftMvmt", { state: true });
  } else if (event.keyCode == "40") {
    //down
    controls.down = true;
    //socket.emit("downMvmt", { state: true });
  } else if (event.keyCode == "38") {
    //up
    controls.up = true;
    //socket.emit("upMvmt", { state: true });
  }
};
document.onkeyup = function(e) {
  event = e || window.event;
controls.isPressingSomething = false;
  //event = e || window.event;
  if (event.keyCode == "39") {
    //right
    controls.right = false;
    console.log("right up");
    //socket.emit("rightMvmt", { state: false });
  } else if (event.keyCode == "37") {
    //left
    controls.left = false;
    console.log("left up");
    //socket.emit("leftMvmt", { state: false });
  } else if (event.keyCode == "40") {
    //down
    controls.down = false;
    console.log("down up");
    //socket.emit("downMvmt", { state: false });
  } else if (event.keyCode == "38") {
    //up
    controls.up = false;
    console.log("up up");
    //socket.emit("upMvmt", { state: false });
  }
};