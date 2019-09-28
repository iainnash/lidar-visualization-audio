const express = require('express');
const OSC = require('osc-js');
const path = require('path');

const app = express()
app.use('/', express.static(path.join(__dirname, 'public')));
 
const config = { udpClient: { port: 9129 } };
const osc = new OSC({ plugin: new OSC.BridgePlugin(config) });
 
osc.open();

const server_port = 8000;

app.listen(server_port, () => console.log(`example app listening on port ${server_port}`));
