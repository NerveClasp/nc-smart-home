const lampName = 'margosha';

const admin = require('firebase-admin');
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort(
  '/dev/cu.usbmodem1421', // armbian serialport connection
  // "/dev/ttyACM0", // MacOS serailport connection
  {
    baudRate: 9600,
  },
  err => {
    if (err) {
      console.log(err);
    } else {
      console.log('port open successfully');
    }
  },
);
const parser = port.pipe(new Readline({ delimiter: '\r\n' }));

/**
 * Rename 0_secret.firebase.json and use data from your firebase project inside that file
 */
const serviceAccount = require('./secret.firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://led-is-love.firebaseio.com', // use your url here
});

let config = {
  brightness: 120,
  color: '255:144:0',
  mode: 'rbw'
}

let message = '';

const db = admin.database();
const ref = db.ref(`controls/${lampName}`);
const brightness = db.ref(`controls/${lampName}/brightness`);
const color = db.ref(`controls/${lampName}/color`);
const mode = db.ref(`controls/${lampName}/mode`);

// TODO: init stage
ref.once('value', snap => {
  const { brightness, color, mode } = snap.val();
  //  console.log(color);
  config = { brightness, color, mode };
});

brightness.on('value', snap => {
  message = 'b:' + snap.val();
  send(message);
})

color.on('value', snap => {
  message = 'c:' + snap.val();
  send(message);
})

mode.on('value', snap => {
  message = 'm:' + snap.val();
  send(message);
})

port.on('error', err => {
  console.log(`Ooopsie! ${err.message}`);
});

parser.on('data', data => {
  if (data != message) {
    send(message);
  }
});

const send = message => {
  port.write(Buffer.from(message));
};
