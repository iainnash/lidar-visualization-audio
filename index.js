const EventEmitter = require('events').EventEmitter;
const express = require('express');
const http = require('http');
const RPLidar = require('rplidar');
const sp = require('schemapack');
const WebSocket = require('ws');


const app = express();

app.use(express.static('public'));

const scanPacketSchema = sp.build({
  start: 'boolean',
  quality: 'uint8',   //uint6
  angle: 'float32',    //uint15
  distance: 'float32'
});

// let lidar = new RPLidar('/dev/tty.SLAB_USBtoUART');
const observEmitter = new EventEmitter();
// const dataEmitter = lidar.on('data', (data) => {
//   let spEncoded = scanPacketSchema.encode(data);
//   observEmitter.emit('data', spEncoded);
//   observEmitter.emit('data_raw', data);
// });

const commandEmitter = new EventEmitter();
commandEmitter.on('start', () => {
  lidar.scan();
});

commandEmitter.on('stop', () => {
  lidar.stop();
});

// init lidar
// lidar.init();

const server = http.createServer(app);
const wsServer = new WebSocket.Server({
  server
});

wsServer.on('connection', (ws) => {
  observEmitter.on('data_raw', (data) => {
    ws.emit(JSON.stringify({
      type: 'sensor_data', 
      data,
    }));
  });
  ws.on('message', (message) => {
    if (message === 'start') {
      commandEmitter.emit('start');
    }
    if (message === 'stop') {
      commandEmitter.emit('stop');
    }
  });
});

server.listen(8080, () => {
  console.log('listening on localhost:8080');
})