
let sounds = [
  {
    origin: [0, 0],
    size: 10,
    note: 'DOp',
    
  }
  /*
  {
    origin: [0, 0],
    size: 20,
    color: "green",
    note: 'D1',
    // file: "./samples/D-02-Pouring Water.wav"
  },
  {
    origin: [100, 100],
    size: 15,
    color: "green",
    note: 'D2',
    // file: "./samples/D-03-Drinking Water.wav"
  },
  {
    origin: [-10, -100],
    size: 15,
    color: "green",
    note: 'D3',
    // file: "./samples/D-03-Drinking Water.wav"
  },
  {
    origin: [-10, -100],
    size: 15,
    color: "green",
    note: 'D4',
    // file: "./samples/D-03-Drinking Water.wav"
  },
  {
    note: 'E3',
    size: 15,
    color: 'red',
    origin: [-20, -100],
  },
  {
    origin: [40, 40],
    size: 15,
    color: "red",
    note: 'E2',
    // file: "./samples/E-02-open the door.wav"
  },
  {
    origin: [30, 0],
    size: 15,
    color: 'blue',
    note: 'C1',
  },
  {
    origin: [10, 20],
    size: 15,
    color: 'blue',
    note: 'C2',
  },
  {
    origin: [40, 0],
    size: 15,
    color: 'blue',
    note: 'C3',
  },
  {
    origin: [-30, 10],
    size: 15,
    color: 'yellow',
    note: 'A1',
  },
  {
    origin: [-50, 30],
    size: 15,
    color: 'yellow',
    note: 'A2',
  },
  {
    origin: [-70, 0],
    size: 15,
    color: 'yellow',
    note: 'A3',
  },
  */
];

function readLocations(){ 
  const soundLocations = localStorage.getItem('soundLocations');
  if (soundLocations) {
    const sounds = JSON.parse(soundLocations);
    return sounds;
  }
  return null;
}

function writeLocation(sound) {
  let soundLocations = localStorage.getItem('soundLocations');
  if (!soundLocations) {
    soundLocations = {};
  } else {
    soundLocations = JSON.parse(soundLocations);
  }
  soundLocations[sound.note] = sound.origin;
  localStorage.setItem('soundLocations', JSON.stringify(soundLocations));
}
const soundsLocations = readLocations();
if (soundsLocations) {
  sounds = sounds.map((sound) => {
    if (soundsLocations[sound.note]) {
      sound.origin = soundsLocations[sound.note];
    }
    return sound;
  })
}

const soundPlayers = {};

window.addEventListener("DOMContentLoaded", () => {
  const osc = new OSC();
  osc.open();

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
    const label = new paper.PointText({
      point: [sound.origin[0] + 20, sound.origin[1] + 30],
      content: sound.note,
      fillColor: 'black',
      fontSize: 16,
    });
    label.scale(1, -1);
    
    pathBox.insertChild(label);
    const onDrag = event => {
      sounds[indx].origin[0] = pathBox.position.x + event.delta.x
      sounds[indx].origin[1] = pathBox.position.y + event.delta.y
      pathBox.setPosition(
        sounds[indx].origin[0],
        sounds[indx].origin[1],
      );
      label.setPosition(
        sounds[indx].origin[0] + 20,
        sounds[indx].origin[1] + 30,
      );
      writeLocation(sound);
      updateIntersections();
    };
    // label.onMouseDrag = onDrag;
    pathBox.onMouseDrag = onDrag;
    return pathBox;
  });

  const updateIntersections = () => {
    intersectionPoints.removeChildren();
    soundBoxes.forEach((soundBox, indx) => {
      let hasIntersection = false;
      lidarLines.getItems().forEach(line => {
        const intersectionPoint = line.getLastSegment().point;
        if (soundBox.contains(intersectionPoint)) {
          hasIntersection = true;
          new paper.Path.Circle({
            center: intersectionPoint,
            radius: 2,
            fillColor: "red",
            parent: intersectionPoints
          });
        }
        /*
        soundBox.getIntersections(intersectionPoint).forEach(intersection => {
          hasIntersection = true;
          new paper.Path.Circle({
            center: intersection.point,
            radius: 2,
            fillColor: "red",
            parent: intersectionPoints
          });
        });
        */
      });
      updatePlayer(hasIntersection, indx);
      soundBox.strokeColor = hasIntersection ? "black" : "orange";
    });
  };

  const isDown = [];
  function updatePlayer(hasIntersection, indx) {
    if (!isDown[indx] && hasIntersection) {
      // note on
      console.log('note on', sounds[indx].note);
      // soundHandler.output.playNote(sounds[indx].note);
      const message = new OSC.Message('/'+sounds[indx].note, 1);
      osc.send(message);
    }
    if (isDown[indx] && !hasIntersection) {
      console.log('note off', sounds[indx].note);
      // note off
      // soundHandler.output.stopNote(35 + indx);
      const message = new OSC.Message('/'+sounds[indx].note, 0);
      osc.send(message);
    }
    isDown[indx] = hasIntersection;
    /*
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
    */
  }

  window.player = player;

  paper.view.draw();

  const writeLog = text => {
    const logEl = document.createElement("p");
    logEl.innerText = text;
    document.getElementById("logInner").appendChild(logEl);
  };

  let currentScan = null;
  function renderCurrentScan() {
    // [ [index, angle, distance], ...]
    clearLines();
    currentScan.map(el => {
      const [index, angle, distance] = el;
      addLine(angle, distance);
    });
    updateIntersections();
  }
    
  let updateId = 0;
  function updateScan(scan) {
    currentScan = scan;
    updateId++;
    requestAnimationFrame(renderCurrentScan);
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
