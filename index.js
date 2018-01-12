const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const server = app.listen(process.env.PORT || 80, () => {
    console.log('STARTING MY QR DECODER ENDPOINT SERVER');
});

app.get('/', (req, res) => {

    res.status(200).send(" tuxedo ");

});

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
    if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'tuxedo_cat') {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).end();
    }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
    if (req.body.object === 'page') {
        req.body.entry.forEach((entry) => {
            entry.messaging.forEach((event) => {
                if (attachment = event.message.attachments) {

                    var attachment = event.message.attachments[0];
                    if (attachment.type == "image") {
                        //encode url
                        var url = encodeURIComponent(attachment.payload.url).replace(/'/g, "%27").replace(/"/g, "%22");
                        getImgContent(event.sender.id, url);
                    }

                } else {
                    console.log(event.message.text);
                }
            });
        });
        res.status(200).end();
    }
});

function getImgContent(sender, url) {
    request({
        url: 'http://api.qrserver.com/v1/read-qr-code/?fileurl=' + url,
        method: 'GET',
    }, function (error, response) {

        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {

            var responseJson = JSON.parse(response.body);
            var result = responseJson[0].symbol[0].data;
            if (result == null)
                result = responseJson[0].symbol[0].error;

            sendMessage(sender, result);
        }

    });

}

function sendMessage(sender, message) {

    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: {
            recipient: {
                id: sender
            },
            message: {
                text: message
            }
        }
    }, function (error, response) {

        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }

    });

}
