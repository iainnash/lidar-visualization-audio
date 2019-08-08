const sounds = [
  {
    origin: [0, 0],
    size: 20,
    color: "green",
    file: "./samples/clap-room-29.mp3"
  },
  {
    origin: [100, 100],
    size: 20,
    color: "blue",
    file: "./samples/sinkfaucet.mp3"
  }
];
const soundPlayers = {};

window.addEventListener("DOMContentLoaded", () => {
  paper.setup(document.getElementById("paper"));

  let player = new Tone.Player({
    url: "./samples/sinkfaucet.mp3",
    loop: true
  }).toDestination();
  // set 0 0 as centre
  paper.view.transform(
    new paper.Matrix(1, 0, 0, -1, paper.view.center.x, paper.view.center.y)
  );
  const lidarLines = new paper.Group();
  const intersectionPoints = new paper.Group();
  const clearLines = () => {
    lidarLines.removeChildren();
  };
  const start = new paper.Point(0, 0);
  const addLine = (angle, distance) => {
    const path = new paper.Path({
      parent: lidarLines
    });
    path.moveTo(start);
    path.lineTo(start.add([0, distance / 10]));
    path.rotate(angle, start);
    path.strokeColor = "black";
  };

  const soundBoxes = sounds.map((sound, indx) => {
    soundPlayers[indx] = new Tone.Player({
      url: sound.file,
      loop: true
    }).toDestination();

    const pathBox = new paper.Path.Rectangle(
      new paper.Rectangle(
        new paper.Point(0, 0),
        new paper.Point(sound.size, sound.size)
      )
    );
    pathBox.setPosition(sound.origin[0], sound.origin[1]);
    pathBox.fillColor = sound.color;
    pathBox.strokeColor = "black";
    pathBox.strokeWidth = 2;
    pathBox.selected = true;
    pathBox.onMouseDrag = event => {
      pathBox.setPosition(
        pathBox.position.x + event.delta.x,
        pathBox.position.y + event.delta.y
      );
      updateIntersections();
    };
    return pathBox;
  });

  const updateIntersections = () => {
    intersectionPoints.removeChildren();
    soundBoxes.forEach((soundBox, indx) => {
      let hasIntersection = false;
      lidarLines.getItems().forEach(line => {
        soundBox.getIntersections(line).forEach(intersection => {
          hasIntersection = true;
          new paper.Path.Circle({
            center: intersection.point,
            radius: 2,
            fillColor: "red",
            parent: intersectionPoints
          });
        });
      });
      updatePlayer(hasIntersection, indx);
      soundBox.strokeColor = hasIntersection ? "black" : "orange";
    });
  };

  function updatePlayer(hasIntersection, indx) {
    const player = soundPlayers[indx];
    if (!player) {
      return;
    }
    if (!hasIntersection && player.state !== "started") {
      player.start();
    }
    if (hasIntersection && player.state === "started") {
      player.stop();
    }
  }

  window.player = player;

  paper.view.draw();

  const writeLog = text => {
    const logEl = document.createElement("p");
    logEl.innerText = text;
    document.getElementById("logInner").appendChild(logEl);
  };

  function updateScan(scan) {
    // [ [index, angle, distance], ...]
    clearLines();
    scan.map(el => {
      const [index, angle, distance] = el;
      addLine(angle, distance);
    });
    updateIntersections();
  }

  const ws = new WebSocket(`ws://${location.hostname}:9999`);
  ws.onerror = () => {
    writeLog("websocket err");
    console.log("websocket err");
  };
  ws.onopen = () => {
    writeLog("has ws conn");
    console.log("has ws connection");
  };
  ws.onclose = () => {
    writeLog("ws conn closed");
    console.log("ws connection closed");
  };
  ws.onmessage = msg => {
    const data = JSON.parse(msg.data);
    if (data.scan) {
      updateScan(data.scan);
    }
  };

  const startTone = () => {
    if (Tone.getContext().state !== "running") {
      Tone.getContext().resume();
    }
  };
  document.documentElement.addEventListener("mousedown", () => {
    startTone();
  });

  document.getElementById("sound").addEventListener("click", evt => {
    evt.preventDefault();
    startTone();
  });

  document.getElementById("start").addEventListener("click", evt => {
    evt.preventDefault();
    if (ws) {
      ws.send("start");
    }
  });

  document.getElementById("stop").addEventListener("click", evt => {
    evt.preventDefault();
    if (ws) {
      ws.send("stop");
    }
  });
});
