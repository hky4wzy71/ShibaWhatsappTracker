const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
const axios = require("axios");


const number = "**********"; // Phone number to target 
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
client.on("ready", () => {
  interval = setInterval(() => {
    axios
      .get("https://api.binance.com/api/v3/ticker/24hr?symbol=SHIBTRY")
      .then((res) => {

        const message = messageCreate(res);

        /*Kar durumunu hesaplayan  fonk Eklenecek*/
        /*Kar istenen seviyede ise mesajla uyarı verilecek*/
        /*Ayrıca pandas ile polinominal regresyon(tahmin için) eklemeyi düşünüyorum. */

        client.sendMessage(chatId, message);
      });
  }, 5000);
});


function messageCreate(res) {
  return `Fiyat: ${res.data.lastPrice}
Değişim: ${res.data.priceChange}
Yüzdelik Değişim: ${res.data.priceChangePercent}
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