console.log('Load Recv: Version 1.0');

var wsHost = process.env.WS_HOST || 'ws://localhost:6050/';
var wsClients = process.env.WS_CLIENTS || 5;

var WebSocket = require('ws');
var os = require('os-utils');

console.log(new Date(), 'load_recv', 'WebSocket Host:', wsHost);

var recvByteCount = 0;
var recvByteCountPer10Seconds = 0;
var cpuUsage = 0;
var clients = {};

var timerShowRecvData = 0;

os.cpuUsage(function (v) {
  cpuUsage = v;
});

// connect to the stream
function connect(index) {
  let streamSocket = new WebSocket(wsHost);
  streamSocket.index = index;
  streamSocket.onopen = function (event) {
    clients[this.index] = this;
    //console.log(new Date(), 'load_recv', this.index, 'onopen: websocket connected!');
  };
  streamSocket.onmessage = function (event) {
    //console.log(new Date(), 'load_recv', this.index, 'data', event.data.length);
    if (event.data.length != null &&
      event.data.length != undefined &&
      !Number.isNaN(event.data.length)) {
      recvByteCount += Number(event.data.length);
    }
    if (timerShowRecvData < Date.now()) {
      timerShowRecvData = Date.now() + 5000;
      let bufView = new Uint8Array(event.data);
      const length = 10;
      if (bufView.length > length) {
        let data = [];
        for (let i = 0; i < length; ++i) {
          data.push(bufView[i]);
        }
        console.log(new Date(), 'load_recv', 'onmessage: length=', formatBytes(bufView.length), 'data=', data);
      }
    }
  };
  streamSocket.onclose = function (event) {
    delete clients[this.index];
    //console.log(new Date(), 'load_recv', this.index, 'onclose: websocket disconnected!');
    setTimeout(function () {
      connect(index);
    }, 3000);
  };
  streamSocket.onerror = function (error) {
    //console.log(new Date(), 'load_recv', this.index, 'onerror: websocket error! ', error);
  };
}

// ref: https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
function formatBytes(a, b = 2) { if (0 === a) return "0 Bytes"; const c = 0 > b ? 0 : b, d = Math.floor(Math.log(a) / Math.log(1024)); return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][d] }

simulateUsers = function () {
  console.log(new Date(), 'load_recv', 'Generating', wsClients, 'clients...');

  for (let index = 0; index < wsClients; ++index) {
    connect(index);
  }

  setInterval(function () {
    let clientCount = Object.keys(clients).length;
    console.log(new Date(), 'load_recv', 'clients', clientCount, 'recv bytes', formatBytes(recvByteCount), 'CPU Usage (%):', Math.floor(1000 * cpuUsage) / 10.0);
    recvByteCountPer10Seconds += recvByteCount;
    recvByteCount = 0;
  }, 1000);

  setInterval(function () {
    let clientCount = Object.keys(clients).length;
    console.log(new Date(), 'load_recv', 'clients', clientCount, 'recv bytes (10 seconds)', formatBytes(recvByteCountPer10Seconds), 'CPU Usage (%):', Math.floor(1000 * cpuUsage) / 10.0);
    recvByteCountPer10Seconds = 0;
    logData = true;
  }, 10000);
};

simulateUsers();
