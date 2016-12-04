'use strict';

const Alexa = require('alexa-sdk');
const dao = require('./src/capitalsRepo');
const game = require('./src/Game')(dao);

const APP_ID = 'amzn1.ask.skill.38899241-ff42-425b-984e-9f5993270e76';

const languageStrings = {
  'en-GB': {
    translation: {
      SKILL_NAME: 'Next free day',
      GET_FACT_MESSAGE: "Next free day is: ",
      HELP_MESSAGE: 'You can say tell me what is the next day i can stay in bed till noon... What can I help you with?',
      HELP_REPROMPT: 'What can I help you with?',
      DISPLAY_CARD_TITLE: "%s  - Next Free Day in %s.",
      COUNTRY_NOT_DEFINED: "I\'m sorry, I do not know in which country to look for.",
      CALENDAR_NOT_FOUND: "I can not find a calendar for %s.",
      "RECIPE_REPEAT_MESSAGE": "Try saying repeat.",
      "NOT_FOUND_REPROMPT": "What else can I help with?",
      STOP_MESSAGE: 'Goodbye!',
      WELCOME_MESSAGE: "Welcome to %s. You can ask a question like, what\'s the next free day in Poland? ... Now, what can I help you with.",
      WELCOME_REPROMT: "For instructions on what you can say, please say help me.",
    },
  },
  'en-US': {
    translation: {
      CHEERUP:"Do not give up, you are doing well.",
      CORRECT_ANSWER: "That's right. Good one !.",
      WRONG_ANSWER: "I am sorry, your answer is wrong.",
      GAME_NAME :'Guess Capitals Game',
      SKILL_NAME: 'Next free day',
      GET_FACT_MESSAGE: "Next free day is: ",
      HELP_MESSAGE: 'You will be asked for a capitals of particular country. You can stop any time saying ',
      HELP_REPROMPT: 'What can I help you with?',
      DISPLAY_CARD_TITLE: "%s  - Next Free Day in %s.",
      COUNTRY_NOT_DEFINED: "I\'m sorry, I do not know in which country to look for",
      CALENDAR_NOT_FOUND: "I can not find a calendar for %s.",
      "RECIPE_REPEAT_MESSAGE": "Try saying repeat.",
      "NOT_FOUND_REPROMPT": "What else can I help with?",
      STOP_MESSAGE: 'Goodbye!',
      WELCOME_MESSAGE: "Welcome to %s. You can ask a question like, what\'s the next free day in Poland? ... Now, what can I help you with.",
      WELCOME_REPROMT: "For instructions on what you can say, please say help me.",
    },
  }
};


const  questionText = function(questionNr, country) { return `Question number ${questionNr}. What is a capital of ${country} ? `};

const giveAnswer = function(country, capital) { `The capital of ${country} is  ${capital} .`};

const getSummary = (data) => `This is your result: you replied correctly for ${data.validAnswers} of ${data.questions} questions`;


const basicIntents = {
  'AMAZON.HelpIntent': function () {
    //TODO implement me
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    game.finish((reply)=>{
      let text = getSummary(reply.data) +  this.t('STOP_MESSAGE');
      this.emit(':tell', text);
    });

  },
  'AMAZON.StopIntent': function () {
    game.finish((reply)=>{
      let text = getSummary(reply.data) +  this.t('STOP_MESSAGE');
      this.emit(':tell', text);
    });
  },
  'SessionEndedRequest': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  'NewSession': function () {
    //TODO implement me
  },
  'LaunchRequest': function(){
    game.startGame().then(reply=>{
      Object.assign(this.attributes, reply.session);
      let speechOutput = `Welcome to ${GAME_NAME}. I will ask you for capital of countries. Try to get as many right as you can. Good Luck` ;
      let repromptText = questionText(1, reply.data.askFor);
      this.emit(':askWithCard', speechOutput + repromptText, repromptText, this.t("GAME_NAME"), repromptText);
    });
  },
  'DontKnowIntent': function () {
      game.skip(this.attributes).then(reply=>{
        Object.assign(this.attributes, reply.session);
        const replyData = reply.data;
        let speechOutput = this.t('CHEERUP') + `: ${giveAnswer(replyData.county, replyData.capital)}`;
        //TODO move question index to reply
        let repromptText = questionText(reply.session.askForIndex + 1, reply.data.askFor);
        this.emit(':askWithCard', speechOutput + repromptText, repromptText, this.t("GAME_NAME"), repromptText);
      });
  },
  'AnswerIntent': function () {

    const citySlot = this.event.request.intent.slots.City;
    const city = citySlot ? citySlot.value : undefined;

    game.answer(city, this.attributes).then(reply =>{
      Object.assign(this.attributes, reply.session);
      const replyData = reply.data;
      let speechOutput;
      if(replyData.success){
        speechOutput = this.t("CORRECT_ANSWER");
      }else{
        speechOutput = this.t("WRONG_ANSWER");
      }
      let repromptText = questionText(reply.session.askForIndex + 1, reply.data.askFor);
      this.emit(':askWithCard', speechOutput + repromptText, repromptText, this.t("GAME_NAME"), repromptText);
    });
  }
};


exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  // To enable string internationalization (i18n) features, set a resources object.
  alexa.resources = languageStrings;
  //alexa.registerHandlers(newSessionHandlers, startStateHandlers, triviaStateHandlers, helpStateHandlers);
  alexa.registerHandlers(basicIntents);
  alexa.execute();
};
