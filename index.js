const express = require('express');
const path = require('path');
const app = express(exports);
const line = require('@line/bot-sdk');
const Obniz = require("obniz");

const PORT = process.env.PORT || 5000;
const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const OBNIZ_ID = process.env.OBNIZ_ID;
const OBNIZ_TOKEN = process.env.OBNIZ_TOKEN;
const BASEURL = process.env.BASEURL;

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

//ビーコン検出でのテンプレートメニュー表示
function handleEventMenu(event) {
    let echo = {
        type: 'template',
        altText: 'ボタンだよ',
        template: {
            type: 'buttons',
            text: 'クラッピーがいるよ',
            thumbnailImageUrl: BASEURL+'/clapper_button.png',
            actions: [
                {
                    type: 'postback',
                    data: 'Clap',
                    label: '押してね'
                }
            ]
        }
    };
    console.log(echo);
    return client.replyMessage(event.replyToken, echo);
}

function handleEventEmu(event) {
    let echo = { type: 'text',  text: "８８８８" };
    console.log(echo);
    return client.replyMessage(event.replyToken, echo);
}

function handleEventClap(event) {
    //パチパチさせる
    clap(event.source.userId);
    let echo = { type: 'text',  text: '８８８８８８' };
    console.log(echo);
    return client.replyMessage(event.replyToken, echo);
}

function handleEvent(event) {
// async function handleEvent(event) {
    let echo;
    console.log(event);
    if (event.type === 'message' && event.message.type === 'text') {
        if (event.message.text === 'Clap') {
            handleEventEmu(event);
        } else if (event.message.text === 'Menu') {
            handleEventMenu(event);
        } else if (event.message.text === 'Time') {
            echo = { type: 'text', text: 'start' };
            setTimeout(() => {
                console.log('timeout');
                client.pushMessage(event.source.userId, {
                   type: 'text', text: 'timeout',
                });
            }, 5000);
            console.log(echo);
            return client.replyMessage(event.replyToken, echo);
        } else if (event.message.text === 'Change') {
            echo = { type: 'text', text: 'start' };
            setInterval(() => {
                console.log('interval');
                // client.pushMessage(event.source.userId, {
                //    type: 'text', text: 'interval',
                // });
            }, 5000);
            console.log(echo);
            return client.replyMessage(event.replyToken, echo);
        } else {
            //オウム返し
        }
    }else if(event.type === 'beacon' && event.beacon){
        handleEventMenu(event);
    }else if(event.type === 'postback' && event.postback.data === 'Clap') {
        handleEventClap(event);
    }
    return Promise.resolve(null);
}

async function clap(userId) {
    let obniz = new Obniz(OBNIZ_ID, { access_token: OBNIZ_TOKEN })
    let connected = await obniz.connectWait({timeout:5})
    if(!connected){
        console.log("Obniz is not connected.");
        return false;
    }
    servo = obniz.wired("ServoMotor", {signal:3,vcc:4, gnd:5});
    servo.on();
    servo.angle(55);
    await obniz.wait(200);
    for (let i=0; i<3; i++) {
        servo.angle(15);
        await obniz.wait(200);
        servo.angle(55);
        await obniz.wait(200);
    }
    // コネクションを切断する
    obniz.close();
    return true;
}

app.use(express.static(path.join(__dirname, 'public')));
app.set('port', PORT);
app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
