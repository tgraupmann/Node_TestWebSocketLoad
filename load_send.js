console.log('Load Send: Version 1.0');

var wsHost = process.env.WS_HOST || 'ws://localhost:6050/';
var wsClients = process.env.WS_CLIENTS || 5;

var WebSocket = require('ws');
var os = require('os-utils');

console.log(new Date(), 'load_send', 'WebSocket Host:', wsHost);

var sendByteCount = 0;
var sendByteCountPer10Seconds = 0;
var cpuUsage = 0;
var clients = {};

os.cpuUsage(function (v) {
  cpuUsage = v;
});

// ref: https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(a, b = 2) { if (0 === a) return "0 Bytes"; const c = 0 > b ? 0 : b, d = Math.floor(Math.log(a) / Math.log(1024)); return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d] }

var sendData = new Uint8Array(56000);
for (let i = 0; i < sendData.length; ++i) {
  sendData[i] = i;
}

function connect(index) {

  // create a socket
  const ws = new WebSocket(wsHost);

  // assign an index
  ws.index = index;

  console.log(new Date(), 'load_send', 'WebSocket: Connecting', index);

  ws.on('open', function open() {

    clients[this.index] = this;

    var refWebSocket = ws;
    var interval = setInterval(function () {
      if (interval && refWebSocket && refWebSocket.readyState == WebSocket.OPEN) {
        sendByteCount += sendData.length;
        refWebSocket.send(sendData);
      } else {
        console.error(new Date(), 'load_send', 'WebSocket closed.');
        clearInterval(interval);
      }
    }, 1000);

  });

  ws.on('error', error => {
    console.log(new Date(), 'load_send', 'WebSocket: error', error);
    if (this.readyState == WebSocket.OPEN) {
      this.close();
    }
  });

  ws.on('close', function () {
    console.log(new Date(), 'load_send', 'WebSocket: closed', this.index);
    delete clients[this.index];
    setTimeout(function () {
      connect(index);
    }, 3000);
  });
}

simulateUsers = function () {
  console.log(new Date(), 'load_send', 'Generating', wsClients, 'clients...');

  for (let index = 0; index < wsClients; ++index) {
    connect(index);
  }

  setInterval(function () {
    let clientCount = Object.keys(clients).length;
    console.log(new Date(), 'load_send', 'clients', clientCount, 'send bytes', formatBytes(sendByteCount), 'CPU Usage (%):', Math.floor(1000 * cpuUsage) / 10.0);
    sendByteCountPer10Seconds += sendByteCount;
    sendByteCount = 0;
  }, 1000);

  setInterval(function () {
    let clientCount = Object.keys(clients).length;
    console.log(new Date(), 'load_send', 'clients', clientCount, 'send bytes (10 seconds)', formatBytes(sendByteCountPer10Seconds), 'CPU Usage (%):', Math.floor(1000 * cpuUsage) / 10.0);
    sendByteCountPer10Seconds = 0;
  }, 10000);
};

simulateUsers();
