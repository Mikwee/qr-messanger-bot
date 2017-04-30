const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const server = app.listen(process.env.PORT || 80, () => {
    console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

const PAGE_ACCESS_TOKEN = "EAADCTVrZAbjIBANyvZCnBwGXvzzmjSlzB99oaZA4JiNeu7LcZBfUCRDVZA1qRrzFFkv58hbgZAoJyZBpchPFkKOYSYJoeMQeVG7YIHQFsCHyAn0M35sZA93tg1qiN5apV9Ddq1wFr06EMtOskfbl1BY4GgQe8L9s4J9VJci9qZBsXdQZDZD";

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
                if (event.message && event.message.text) {
                    sendMessage1(event);
                }
            });
        });
        res.status(200).end();
    }
});

function sendMessage(event) {
    let sender = event.sender.id;
    let text = event.message.text;

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
                text: text
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

function sendMessage1(event) {
    let sender = event.sender.id;
    let text = event.message.text;

    request({
        url: 'http://gpa.madbob.org/query.php?stop=' + text,
        method: 'GET',
    }, function (error, response) {

        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        } else {
            //parse response and create message
            var message = "Passaggi nella fermata: " + text + " \n ";
            var preMessage = message;
            var responseJson = JSON.parse(response.body);

            for (var i = 0; i < responseJson.length; i++) {
                var el = responseJson[i];
                var elFormatted = el.line + " direzione " + el.direction + " alle ore " + el.hour + " \n ";
                message += elFormatted;
                console.log(message.length);
                if (message.length <= 640) {
                    preMessage = message;
                    console.log("add");
                } else {
                    console.log("send");
                    sendPart(sender, preMessage);
                    message = elFormatted;
                    preMessage = "";
                }

            }
            sendPart(sender, message);

        }

    });

}

function sendPart(sender, message) {

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
