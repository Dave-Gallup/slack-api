const express = require('express');
const request = require('request');
const { writeMessage } = require('../repositories/event-repository');
const { analyzeSentimentAndSaveScore } = require('../src/sentiment');

const router = express.Router();

router.get('/auth/redirect', (req, res) => {
  const options = {
    uri: `https://slack.com/api/oauth.access?code=${
      req.query.code
    }&client_id=${process.env.SLACK_CLIENT_ID
    }&client_secret=${process.env.SLACK_CLIENT_SECRET
    }&redirect_uri=${process.env.REDIRECT_URI}`,
    method: 'GET',
  };

  request(options, (error, response, body) => {
    const JSONresponse = JSON.parse(body);
    if (!JSONresponse.ok) {
      res.send(`Error encountered: \n${JSON.stringify(JSONresponse)}`).status(200).end();
    } else {
      res.send('Authenticating with Slack...');
    }
  });
});

router.get('/auth', (req, res) => {
  res.sendFile('/app/assets/html/add_to_slack.html');
});

function setEvents(io) {
  router.post('/events', (req, res) => {

    switch(req.body.event.type){

      case 'message':
        // message edited
        if(req.body.event.previous_message){
          console.log('Message edited', req.body.event);
          break;
        }
        // message deleted
        if (req.body.event.subtype
          && req.body.event.subtype === 'message_deleted'){
          console.log('Message deleted', req.body.event);
          break;
        }
        // message posted
        console.log('Message posted', req.body.event);
        break;

      case 'reaction_added':
        console.log('Reaction added');
        break;

      case 'reaction_removed':
        console.log('Reaction removed');
        break;

      //
      case 'team_join':
        console.log('User joined the team');
        break;

      case 'user_change':
        console.log('User info changed');
        break;

      case 'tokens_revoked':
        console.log('Token(s) revoked');
        break;
    }
    res.sendStatus(200);
    // handleNewMessageEvent(io)
    // .then((req,res) => {
    //   res.sendStatus(200);
    // })
    // .catch(err => err);
  });
}

function handleNewMessageEvent(io, req){
  return writeMessage(
    req.body.event.user,
    req.body.event.text,
    req.body.event.ts,
    req.body.event.channel,
  )
  .then((message) => {
    const channelId = message[0].channel_map_id;
    const messageId = message[0].id;

    const newMessage = {};
    newMessage[channelId] = {}; // Slack's channel ID as key
    newMessage[channelId][messageId] = {}; // Our message ID as key

    newMessage[channelId][messageId].avatarImage = '';
    newMessage[channelId][messageId].userId = message[0].user_map_id;
    newMessage[channelId][messageId].name = req.body.event.user;// To be changed after MVP
    newMessage[channelId][messageId].text = message[0].message;
    newMessage[channelId][messageId].timestamp = message[0].message_timestamp;
    newMessage[channelId][messageId].channelId = message[0].channel_map_id;


    io.sockets.emit('messages', newMessage);


    analyzeSentimentAndSaveScore(io, message[0].channel_map_id);
  });
}


module.exports = { router, setEvents };
