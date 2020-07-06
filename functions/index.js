'use strict';

const {
    SimpleResponse, 
    BasicCard, 
    Button, 
    Image,
    Suggestions} = require('actions-on-google');
const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const axios = require('axios');

const responses = require('./responses.json')

process.env.DEBUG = 'dialogflow:debug';

function firstUC(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {

    const agent = new WebhookClient({ request, response });
    
    var from;
    var to;
    var pretty;
    var speak

    function responseChooser(context) {
        var possibleResponse = responses[context]
        var pick = Math.round(Math.random() * possibleResponse.length);
        return possibleResponse[pick];
    }

    function welcome(agent) {
        let conv = agent.conv();
        var welcomeText = responseChooser('welcome')
        conv.ask(new SimpleResponse({
            speech: 'Welcome to Delhi Metro. How can I help you today?',
            text: 'Welcome to Delhi Metro. How can I help you today?'
        }));
        conv.ask(new Suggestions("Route Planner"))
        conv.ask(new Suggestions("Metro Map"))
        conv.ask(new Suggestions("Random Etiquette"))
        agent.add(conv);
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

    function sameToFrom(from) {
        var samein = [
            'Enter ' + from + ' station, leave ' + from + ' station. Congrats, you just wasted 10 Rupees!',
            'Enter the station at ' + from + ', do a 180, leave the station. Welcome back to ' + from + '!',
            'You want to go from ' + from + ' to ' + from + '? Weird flex but ok..'
        ];
        var pick = Math.round(Math.random() * samein.length);
        return samein[pick];
    }

    function branchRemover(line) {
        if (line == 'bluebranch')
            return 'blue'
        else if (line == 'greenbranch')
            return 'green'
        else if (line == 'pinkbranch')
            return 'pink'
        else
            return line;
    }

    function outputHandler(res) {
        var line2;
        var line1 = branchRemover(res.line1[0]);
        if (line1 == '1.2km Skywalk')
            speak = 'Walk 1.2km on the Skywalk at ' + from + ' to ';
        else if (line1 == '300m Walkway/Free e-Rickshaw')
            speak = 'Walk 300m on the walkway, or take a free e-Rickshaw at ' + from + ' to ';
        else
            speak = 'Take the ' + line1 + ' line at ' + from + ' to ';
        pretty = '**' + from + '** ⟹ _' + firstUC(line1) + '_ ';
        for (var i = 0; i < res.interchange.length; i++) {
            var line2 = branchRemover(res.line2[i])
            //lineEnds = 0 Handler 
            if (res.lineEnds[i] == 0)
                pretty = pretty + ' ⟹ ' + ' __' + res.interchange[i] + '__  \n  \n';
            else
                pretty = pretty + ' ⟹ ' + ' __' + res.interchange[i] + '__  \n(Towards ' + res.lineEnds[i] + ')  \n  \n';
            pretty = pretty + '__' + res.interchange[i] + '__ ⟹ _' + firstUC(line2) + '_ ';
            if (line2 == '1.2km Skywalk')
                speak = speak + res.interchange[i] + '. Then, walk 1.2 kilometers on the skywalk and go to ';
            else if (line2 == '300m Walkway/Free e-Rickshaw')
                speak = speak + res.interchange[i] + 'Then, walk 300m on the walkway, or take a free e-Rickshaw and go to';
            else
                speak = speak + res.interchange[i] + '. Then, change to the ' + line2 + ' line and go to ';
            console.log(res.interchange[i] + line2);
        }
        speak = speak + to;
        speak = speak + '\n  \n  \n. , Estimated Travel time is :';
        if (res.lineEnds[res.lineEnds.length - 1] == 0)
            pretty = pretty + ' ⟹ **' + to + '**';
        else
            pretty = pretty + ' ⟹ **' + to + '**' + '  \n(Towards ' + res.lineEnds[res.lineEnds.length - 1] + ')';
        pretty = pretty + '  \n  \n  \n**Travel Time:** ';
        var time = Math.round(res.time);
        appendHours(time);
        console.log(pretty);
    }


   function getManner(agent) {
       console.log("Inside Manners giver")
       let conv = agent.conv()
       var out = responseChooser('manners');
       conv.ask(new SimpleResponse({
           text: out,
           speech: out
       }))
       console.log("Manner:" + out)
       conv.ask(new SimpleResponse({
        speech: '<speak><break time="800ms"/>Is there anything else I can help you with?</speak>',
        text: 'Anything else I can help you with?'
    }));
       conv.ask(new Suggestions("Another Etiquette"))
       conv.ask(new Suggestions("Route Planner"))
       conv.ask(new Suggestions("Metro Map"))
       conv.ask(new Suggestions("Exit"))
       agent.add(conv)
   }

    function getRoute(agent) {
        console.log("Inside Router");
        let conv = agent.conv();
        from = agent.parameters.source[0].toUpperCase() + agent.parameters.source.slice(1);
        to = agent.parameters.destination[0].toUpperCase() + agent.parameters.destination.slice(1);
        console.log('destinationist: ' + to);
        console.log('sourcist: ' + from)
        if (from == to) {
            conv.close(sameToFrom(from));
            agent.add(conv);
        }
        else {
            console.log('from: ' + from);
            var url = "https://us-central1-delhimetroapi.cloudfunctions.net/route-get?to=" + to + "&from=" + from;
            return callApi(url).then(response => {
                console.log('Inside Response');
                let res = response.data;
                outputHandler(res);
                let stext = responseChooser('manners');
                conv.ask(new SimpleResponse({
                    speech: speak,
                    text: stext
                }));
                conv.ask(new BasicCard({
                    text: pretty,
                    subtitle: 'Enjoy your journey!',
                    title: 'Route from ' + from + ' to ' + to,
                    display: 'CROPPED'
                }));
                conv.ask(new SimpleResponse({
                    speech: '<speak><break time="300ms"/>Is there anything else I can help you with?</speak>',
                    text: 'Anything else I can help you with?'
                }));
                conv.ask(new Suggestions("Another Route"))
                conv.ask(new Suggestions("Metro Map"))
                conv.ask(new Suggestions("Random Etiquette"))
                conv.ask(new Suggestions("Exit"))
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

    function getMap(agent) {
        let conv = agent.conv();
        conv.ask(new SimpleResponse({
            speech: 'Here you go',
            text: "Here's the metro map"
        }));
        conv.ask(new BasicCard({
            title: 'Delhi Metro Map',
            buttons: new Button({
              title: 'View Full Size',
              url: 'https://firebasestorage.googleapis.com/v0/b/trymetro-37b25.appspot.com/o/bilingual-21062019.jpg?alt=media&token=eb92a30d-d5ac-467b-853a-c3435842ae86',
            }),
            image: new Image({
              url: 'https://firebasestorage.googleapis.com/v0/b/trymetro-37b25.appspot.com/o/bilingual-21062019.jpg?alt=media&token=eb92a30d-d5ac-467b-853a-c3435842ae86',
              alt: 'Delhi Metro Network Map',
            }),
            display: 'CROPPED',
          }));
          conv.ask(new SimpleResponse({
            speech: '<speak><break time="800ms"/>Is there anything else I can help you with?</speak>',
            text: 'Anything else I can help you with?'
        }));
        conv.ask(new Suggestions("Random Etiquette"))
        conv.ask(new Suggestions("Route Planner"))
        conv.ask(new Suggestions("Exit"))
          agent.add(conv);
    }
    
    function callApi(url) {
        console.log(url);
        console.log(axios.get(url));
        return axios.get(url);
    }

    function exiter(agent) {
        let conv = agent.conv();
        var out = responseChooser('manners');
        conv.close(new SimpleResponse({
            speech: out,
            text: out
        }));
        agent.add(conv)
    }

    let intentMap = new Map();
    intentMap.set('Router', getRoute);
    intentMap.set('Map', getMap);
    intentMap.set('Manners', getManner);
    intentMap.set('Default Welcome Intent', welcome);
    intentMap.set('Router - no', exiter)
    intentMap.set('Ender', exiter)
    intentMap.set('Manners - no', exiter)
    intentMap.set('Map - no', exiter);
    agent.handleRequest(intentMap);
});