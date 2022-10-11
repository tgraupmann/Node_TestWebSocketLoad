console.log('Server: Version 1.0');

var wsPort = process.env.WS_PORT || 6050;

var WebSocket = require('ws');
var WebSocketServer = WebSocket.WebSocketServer;

var os = require('os-utils');

const wss = new WebSocketServer({ port: wsPort });

var recvByteCount = 0;
var recvByteCountPer10Seconds = 0;
var sentByteCount = 0;
var sentByteCountPer10Seconds = 0;

var cpuUsage = 0;
var clients = [];

os.cpuUsage(function (v) {
  cpuUsage = v;
});

// ref: https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(a, b = 2) { if (0 === a) return "0 Bytes"; const c = 0 > b ? 0 : b, d = Math.floor(Math.log(a) / Math.log(1024)); return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d] }

wss.on('connection', function connection(ws) {
  clients.push(ws);
  ws.on('message', function message(data) {
    recvByteCount += data.length;
    //console.log(new Date(), clients.length, 'received:', formatBytes(data.length));
    let i = 0;
    while (i < clients.length) {
      let ws = clients[i];
      if (ws && ws.readyState == WebSocket.OPEN) {
        ws.send(data);
        sentByteCount += data.length;
      }
      ++i;
    }
  });
});

setInterval(function () {
  //check for disconnects
  let i = 0;
  while (i < clients.length) {
    let ws = clients[i];
    if (!ws || ws.readyState != WebSocket.OPEN) {
      console.log('Disconnecting:', i, 'of', clients.length);
      clients.splice(i, 1);
      continue;
    }
    ++i;
  }

}, 1000);

setInterval(function () {
  let clientCount = Object.keys(clients).length;
  console.log(new Date(), 'clients', clientCount, 'recv bytes', formatBytes(recvByteCount), 'sent bytes', formatBytes(sentByteCount), 'CPU Usage (%):', Math.floor(1000 * cpuUsage) / 10.0);
  recvByteCountPer10Seconds += recvByteCount;
  recvByteCount = 0;
  sentByteCountPer10Seconds += sentByteCount;
  sentByteCount = 0;
}, 1000);

setInterval(function () {
  let clientCount = Object.keys(clients).length;
  console.log(new Date(), 'clients', clientCount, 'recv bytes (10 seconds)', formatBytes(recvByteCountPer10Seconds), 'sent bytes (10 seconds)', formatBytes(sentByteCountPer10Seconds), 'CPU Usage (%):', Math.floor(1000 * cpuUsage) / 10.0);
  recvByteCountPer10Seconds = 0;
  sentByteCountPer10Seconds = 0;
}, 10000);
