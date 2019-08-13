'use strict';

const { SimpleResponse, BasicCard } = require('actions-on-google');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const axios = require('axios');
const request = require('request');

process.env.DEBUG = 'dialogflow:debug';

var from;
var to;
var pretty;
var speak;
var pretty;


exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  function getDest(agent) {
    to = agent.parameters.destination;
    console.log(agent.parameters.destination.value);
    console.log('to: ' + to);
    agent.add('Okay, Where are you leaving from?');

  }

  function appendHours(time) {
    var hours;
    var minutes;
    if (time >= 60) {
      hours = Math.floor(time / 60);
      minutes = time % 60;
      if (minutes === 0) {
        if (hours == 1) {
          pretty = pretty + hours + ' Hour.';
          speak = speak + hours + ' Hour.';
        }
        else {
          pretty = pretty + hours + ' Hours.';
          speak = speak + hours + ' Hours.';
        }
      }
      else {
        if (hours == 1) {
          pretty = pretty + hours + ' Hour ' + minutes + ' minutes. ';
          speak = speak + hours + ' Hour ' + minutes + ' minutes. ';
        }
        else {
          pretty = pretty + hours + ' Hours' + minutes + ' minutes. ';
          speak = speak + hours + ' Hours' + minutes + ' minutes. ';
        }
      }
    }
    else {
      pretty = pretty + time + ' minutes. ';
      speak = speak + time + ' minutes. ';
    }

  }

  function sameToFrom() {
    var samein = [
      'Enter ' + from + ' station, leave ' + to + ' station. Congrats, you just wasted 10 Rupees!',
      'Enter the station at ' + from + ', do a 180, leave the station. Welcome back to ' + to + '!',
      'You want to go from ' + from + ' to ' + to + '? Weird flex but ok..'
    ];
    var pick = Math.round(Math.random() * samein.length);
    return samein[pick];
  }

  function outputHandler(res) {
    if (res.line1[0] == '1.2km Skywalk')
          speak = 'Walk 1.2km on the Skywalk at ' + from + ' to ';
        else
          speak = 'Take the ' + res.line1[0] + ' line at ' + from + ' to ';
      pretty = '**' + from + '** → _' + res.line1[0] + '_ →';
      for (var i = 0; i < res.interchange.length; i++) {
        pretty = pretty + res.interchange[i] + '  \n';
        pretty = pretty + res.interchange[i] + ' → _' + res.line2[i] + '_ → ';
        if (res.line2[i] == '1.2km Skywalk')
            speak = speak + res.interchange[i] + '. Then, walk 1.2 kilometers on the skywalk and go to ';
          else
            speak = speak + res.interchange[i] + '. Then, change to the ' + res.line2[i] + ' line and go to ';
          console.log(res.interchange[i] + res.line2[i]);
        }
        speak = speak + to;
        speak = speak + '\n  \n  \n. , Estimated Travel time is :';
        pretty = pretty + '**' + to + '**';
        pretty = pretty + '  \n  \n**Travel Time:** ';
        var time = Math.round(res.time);
        appendHours(time);
        console.log(pretty);
  }

  function metroManners() {
    var possibleResponse = [
      'Kindly let people exit the train before entering it.',
      'Do not enter the coach reserved for ladies if you are male.',
      'Do not sit on seats reserved for ladies, the elderly, or the disabled.',
      'Use headphones if listening to music on the Delhi Metro.',
      'Eating and drinking are not allowed inside the metro train.',
      'Please keep towards the center of the doors while deboarding the train.',
      'Please stand towards the sides of the doors while waiting for passengers to deboard.',
      'Please do not hang bags on your back inside Metro Trains.',
      'Kindly stand behind the yellow line while waiting for a train on the platform.'
    ];
    var pick = Math.round(Math.random() * possibleResponse.length);
    return possibleResponse[pick];
  }

  function getSource(agent) {
    let conv = agent.conv();
    console.log("Inside Source");
    var info;
    from = agent.parameters.source;
    if (from == to) {
      conv.close(sameToFrom());
      agent.add(conv);
    }
    else {
      console.log('from: ' + from);
      var url = "https://us-central1-delhimetroapi.cloudfunctions.net/route/?to=" + to + "&from=" + from;
      return callApi(url).then(response => {
        console.log('Inside Response');
        let res = response.data;
        outputHandler(res);
        let stext = metroManners();
        conv.ask(new SimpleResponse({
          speech: speak,
          text: stext
        }));
        conv.close(new BasicCard({
          text: pretty,
          subtitle: 'Enjoy your journey!',
          title: 'Route from ' + from + ' to ' + to,
          display: 'CROPPED'
        }));
        agent.add(conv);
        console.log('Done');
      }).catch(error => {
        if (error.response) {
          console.log('Response Data: ' + error.response.data);
          console.log('response Status: ' + error.response.status);
          console.log('Response Headers: ' + error.response.headers);
        } else if (error.request) {
          console.log('Error request: ' + error.request);
        } else {
          console.log('Error', error.message);
        }
        console.log('Error Config: ' + error.config);
        agent.add('Error, sorry');
      });
    }
  }

  function callApi(url) {
    console.log(url);
    console.log(axios.get(url));
    return axios.get(url);
  }

  let intentMap = new Map();
  intentMap.set('Destination', getDest);
  intentMap.set('Source', getSource);
  agent.handleRequest(intentMap);
});
