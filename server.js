const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
const axios = require("axios");

const number = "905534178921"; // Phone number to target
const chatId = number + "@c.us";
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
let maxPrice, minPrice, dif;
let send = false;
let count = 0;

//for dif up or down
let firstPrice, direction;

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
        //60 = 5minutes,
        if (count === 3) {
          evaluateDif();
          directionDecision();

          if (send) {
            message = messageCreate(dif);
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

        // message = messageCreate(res);
        // client.sendMessage(chatId, message);
      });
  }, 5000);
});

async function initializeMaxMin() {
  await axios
    .get("https://api.binance.com/api/v3/ticker/24hr?symbol=SHIBTRY")
    .then((res) => {
      const prevClosePrice = +res.data.prevClosePrice;
      const lastPrice = +res.data.lastPrice;
      if (prevClosePrice > lastPrice) {
        maxPrice = prevClosePrice;
        minPrice = lastPrice;
      } else if (prevClosePrice < lastPrice) {
        maxPrice = lastPrice;
        minPrice = prevClosePrice;
      } else {
        maxPrice = prevClosePrice;
        minPrice = prevClosePrice;
      }
    });
  firstPrice = maxPrice; // for use to later compare dif + or -
  console.log(`max = ${maxPrice} \nmin = ${minPrice}`);
}
function compareMaxCurrent(currentP) {
  currentP = +currentP;
  if (maxPrice <= currentP) maxPrice = currentP;
  else minPrice = currentP;
}
function watchAndSave() {
  maxPrices.push(maxPrice);
  minPrices.push(minPrice);
}
function evaluateDif() {
  let maxPriceEl = Math.max(...maxPrices);
  let minPriceEl = Math.min(...minPrices);
  console.log(maxPriceEl, minPriceEl, dif);
  dif = maxPriceEl - minPriceEl;
  dif = dif.toFixed(8);
  /*if(dif>0.xxxx) send true */
  send = true;
}
function directionDecision() {
  if (firstPrice > maxPrice) direction = "Artis";
  else if (firstPrice > maxPrice) direction = "Sabit";
  else direction = "Dusus";
}
function messageCreate(dif) {
  return `Max: ${maxPrice}
Min: ${minPrice}
Değişim: ${dif}
Yön: ${direction}
  `;
}
//////////////////////////////// E N D //////////////////////////////////////

client.initialize();

/*{"symbol":"SHIBTRY",
"priceChange":"0.00000945",
"priceChangePercent":"3.342",
"weightedAvgPrice":"0.00028925",
"prevClosePrice":"0.00028273",
"lastPrice":"0.00029220",
"lastQty":"27309157.00",
"bidPrice":"0.00029206",
"bidQty":"8092472.00",
"askPrice":"0.00029223",
"askQty":"15000000.00",
"openPrice":"0.00028275",
"highPrice":"0.00029500",
"lowPrice":"0.00028180",
"volume":"621432087719.00",
"quoteVolume":"179748569.24176604",
"openTime":1643637242711,
"closeTime":1643723642711,
"firstId":30323603,
"lastId":30362303,
"count":38701}
*/
