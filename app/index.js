'use strict';

const Alexa = require('alexa-sdk');
const dao = require('./src/capitalsRepo');
const game = require('./src/Game')(dao);

const APP_ID = 'amzn1.ask.skill.38899241-ff42-425b-984e-9f5993270e76';

const languageStrings = {
  'en-GB': {
    translation: {
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
      QUESTION: "Question number %d. What is a capital of %s ? ",
      ANSWER: "The capital of %s is  %s .",
      CHEERUP:"Don't give up, you are doing well .",
      SUMMARY: "Your final result is : %d correct answers of %d questions. Hoped you had a fun !",
      NO_MORE_QUESTIONS: "Unfortunately it was the last question. ",
      CORRECT_ANSWER: "That's right. Good one !",
      WRONG_ANSWER: "I am sorry, your answer is wrong. Let's try again .",
      GAME_NAME :'Guess Capitals Game',
      SKILL_NAME: 'Next free day',
      GET_FACT_MESSAGE: "Next free day is: ",
      HELP_MESSAGE: 'You will be asked for a capitals of particular country. You can stop any time saying stop',
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

//TODO can we use defaults
const finishGame = function (extraText) {
  game.finish(this.attributes).then((reply) => {
    if (!extraText) {
      extraText = '';
    }
    let text = extraText + this.t('SUMMARY', reply.data.validAnswers, reply.data.questions) + this.t('STOP_MESSAGE');
    this.emit(':tell', text);
  });
};

const startGame = function () {
  game.startGame().then(reply => {
    Object.assign(this.attributes, reply.session);
    let speechOutput = `Welcome to ${this.t('GAME_NAME')}. I will ask you for capital of countries. Try to get as many right as you can. Good Luck !`;
    let repromptText = this.t('QUESTION', 1, reply.data.askFor);
    this.emit(':askWithCard', speechOutput + repromptText, repromptText, this.t("GAME_NAME"), repromptText);
  });
};


const basicIntents = {
  'AMAZON.HelpIntent': function () {
    //TODO implement me
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    console.log("CANCEL INTENT");
    finishGame.call(this);
  },
  'AMAZON.StopIntent': function () {
    console.log("STOP INTENT");
    finishGame.call(this);
  },
  'SessionEndedRequest': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  'NewSession': function () {
    console.log('NEW SESSSION');
    startGame.call(this);
  },
  'LaunchRequest': function(){
    console.log('LAUNCH REQUEST');
    startGame.call(this);
  },
  'DontKnowIntent': function () {
      game.skip(this.attributes).then(reply=>{
        Object.assign(this.attributes, reply.session);
        const replyData = reply.data;
        const answer = this.t('ANSWER', replyData.county, replyData.capital);

        if (replyData.endGame) {
          return finishGame.call(this, answer + this.t("NO_MORE_QUESTIONS"))
        }
        let speechOutput = this.t('CHEERUP') + answer;

        //TODO move question index to reply
        let repromptText = this.t('QUESTION', reply.session.askForIndex + 1, reply.data.askFor);
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
        if (replyData.endGame) {
          return finishGame.call(this, speechOutput + this.t("NO_MORE_QUESTIONS"))
        }
      }else{
        speechOutput = this.t("WRONG_ANSWER");
      }

      let repromptText = this.t('QUESTION', reply.session.askForIndex + 1, reply.data.askFor);
      this.emit(':askWithCard', speechOutput + repromptText, repromptText, this.t("GAME_NAME"), repromptText);
    });
  }
};


exports.handler = (event, context) => {
  const alexa = Alexa.handler(event, context);
  alexa.APP_ID = APP_ID;
  // To enable string internationalization (i18n) features, set a resources object.
  alexa.resources = languageStrings;
  alexa.registerHandlers(basicIntents);
  alexa.execute();
};
