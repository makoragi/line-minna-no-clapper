const express = require('express');
const path = require('path');
const app = express(exports);
const line = require('@line/bot-sdk');

const PORT = process.env.PORT || 5000;
const LINE_CHANNEL_TOKEN = process.env.LINE_CHANNEL_TOKEN;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;

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
        console.log(event);
        if (event.type === 'message' && event.message.type === 'text') {
                const echo = { type: 'text',  text: event.message.text };
                console.log(echo);
                return client.replyMessage(event.replyToken, echo);
        }else if(event.type === 'beacon' && event.beacon){
                const message = { type: 'text', text: 'beacon device(${event.beacon.hwid})から${event.beacon.dm}が届いたよ' };
                console.log(message);
                return client.replyMessage(event.replyToken, message);
        }
        return Promise.resolve(null);
}

app.set('port', PORT);

app.listen(PORT, () => console.log(`Listening on ${ PORT }`))
