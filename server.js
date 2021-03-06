const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
const axios = require("axios");

const phoneNumber = "90**********" //if you want use , command below statement

const chatId = phoneNumber + "@c.us";
const d = new Date();

// Path where the session data will be stored
const SESSION_FILE_PATH = "./session.json";
let sessionData;

if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionData = require(SESSION_FILE_PATH);
}

// Use the saved values
const client = new Client({
  session: sessionData,
});
// Save session values to the file upon successful auth
client.on("authenticated", (session) => {
  sessionData = session;
  fs.writeFile(SESSION_FILE_PATH, JSON.stringify(session), (err) => {
    if (err) {
      console.error(err);
    }
  });
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("qr", (qr) => {
  console.log("QR RECEIVED", qr);
});

client.on("ready", () => {
  console.log("Client is ready!");
});

///////////////////////////////// S T A R T ////////////////////////////////////////
let maxPrice, minPrice, dif, maxPriceEl, minPriceEl;
let send = false;
let count = 0;

//for dif up or down
let firstPrice, lastPrice, direction;

const maxPrices = [];
const minPrices = [];

client.on("ready", () => {
  initializeMaxMin();
  interval = setInterval(() => {
    axios
      .get("https://api.binance.com/api/v3/ticker/24hr?symbol=SHIBTRY")
      .then((res) => {
        console.log(`
        maxPrice = ${maxPrice}
        minPrice = ${minPrice}
        dif = ${dif}
        count = ${count}
        `);
        compareMaxCurrent(res.data.lastPrice);
        //Periyot  60 = 5min, 12 = 1min, 360=30min
        if (count === 360) {
          evaluateDif();
          directionDecision();

          if (send) {
            message = messageCreate();
            client.sendMessage(chatId, message);
          }
          //resetting
          count = 0;
          maxPrices.length = 0;
          minPrices.length = 0;
          send = false;
          initializeMaxMin();
        } else {
          watchAndSave();
          count++;
        }

        /*
        askPrice => buy position
        bidPrice => sell position
        spread = ask - bid  
        */
      });
  }, 5000);
});

async function initializeMaxMin() {
  await axios
    .get("https://api.binance.com/api/v3/ticker/24hr?symbol=SHIBTRY")
    .then((res) => {
      const lastPrice = +res.data.lastPrice;
      maxPrice = lastPrice;
      minPrice = lastPrice;
    });
  firstPrice = maxPrice; // for use to later compare dif + or -
  console.log(`max = ${maxPrice} \nmin = ${minPrice}`);
}
function compareMaxCurrent(currentP) {
  currentP = +currentP;
  if (maxPrice <= currentP) maxPrice = currentP;
  else minPrice = currentP;

  lastPrice = currentP; // for use to later compare dif + or -
}
function watchAndSave() {
  maxPrices.push(maxPrice);
  minPrices.push(minPrice);
}
function evaluateDif() {
  maxPriceEl = Math.max(...maxPrices);
  minPriceEl = Math.min(...minPrices);
  console.log(maxPriceEl, minPriceEl, dif);
  dif = maxPriceEl.toFixed(8) - minPriceEl.toFixed(8);
  dif = dif.toFixed(8);
  
  if(dif>0.00000500) send=true 
  else send = false;
}
function directionDecision() {
  if (firstPrice > lastPrice) direction = "D????????";
  else if (firstPrice == lastPrice) direction = "Sabit";
  else direction = "Art????";
}
function messageCreate() {
  return `
??lk:\t   ${firstPrice.toFixed(8)}
Son:\t${lastPrice.toFixed(8)}
-----------------------------
Max:\t${maxPriceEl.toFixed(8)}
Min:\t${minPriceEl.toFixed(8)}
Dif:\t${dif}
Y??n:\t${direction}
Periyot:\t30min
`;
}
//////////////////////////////// E N D //////////////////////////////////////

client.initialize();
