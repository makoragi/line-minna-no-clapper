const express = require('express');
const path = require('path');
const app = express(exports);
const line = require('@line/bot-sdk');
const Obniz = require("obniz");

const PORT = process.env.PORT || 5000;
const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const OBNIZ_ID = process.env.OBNIZ_ID;

// express()
//   .use(express.static(path.join(__dirname, 'public')))
//   .set('views', path.join(__dirname, 'views'))
//   .set('view engine', 'ejs')
//   .get('/', (req, res) => res.render('pages/index'))
//   .listen(PORT, () => console.log(`Listening on ${ PORT }`))

const config = {
  channelAccessToken: LINE_CHANNEL_TOKEN,
  channelSecret: LINE_CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

app.post('/webhook',  line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
          console.error("ERROR");
          console.error(err.message);
          res.status(500).end();
        });
});

function handleEvent(event) {
// async function handleEvent(event) {
    var echo;
    console.log(event);
    if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === 'Clap') {
            //パチパチさせる
            clap(event.source.userId);
            //待ってとだけ返す
            echo = { type: 'text',  text: 'Please Wait...' };
        } else if (event.message.text === 'Menu') {
            echo = { type: 'template', altText: 'button templete',
                template: {
                    type: 'buttons', text: 'ボタン',
                    actions: [
                        { type: 'postback', data: 'ppp', label: 'ラベル' }
                    ]
                }
            };
        } else {
            //オウム返し
            echo = { type: 'text',  text: event.message.text };
        }
        console.log(echo);
        return client.replyMessage(event.replyToken, echo);
    }else if(event.type === 'beacon' && event.beacon){
        const message = { type: 'text',
            text: `近くにクラッピーがいるよ。${event.beacon.hwid}` };
        console.log(message);
        return client.replyMessage(event.replyToken, message);
    }else if(event.type === 'postback') {
        echo = { type: 'text',  text: event.postback.data };
        console.log(echo);
        return client.replyMessage(event.replyToken, echo);
    }
    return Promise.resolve(null);
}

async function clap(userId) {
    let obniz = new Obniz(OBNIZ_ID);
    let connected = await obniz.connectWait({timeout:5});
    if(!connected){ return false; }
    var leds = obniz.wired("WS2812", {gnd:2, vcc: 0, din: 1});
    servo = obniz.wired("ServoMotor", {signal:3,vcc:4, gnd:5});
    servo.on();
    obniz.display.clear();
    obniz.display.print("Hello obniz!");
    for (let i=0; i<3; i++) {
        servo.angle(15);
        leds.rgb(0, 0, 0); // off
        await obniz.wait(1000);
        servo.angle(55);
        leds.rgb(255, 0, 0); // red
        await obniz.wait(1000);
    }
    await client.pushMessage(userId, {
       type: 'text',
       text: '８８８８８',
    });
    // コネクションを切断する
    obniz.close();
    return true;
}

app.set('port', PORT);
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
