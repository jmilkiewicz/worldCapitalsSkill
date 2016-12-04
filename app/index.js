'use strict';

const Alexa = require('alexa-sdk');
const dao = require('./src/capitalsRepo');
const game = require('./src/Game')(dao);

const APP_ID = 'amzn1.ask.skill.38899241-ff42-425b-984e-9f5993270e76';

const languageStrings = {
  'en-GB': {
    translation: {
      QUESTION: "Question number %d. What is a capital of %s ? ",
      ANSWER: "The capital of %s is  %s .",
      CHEERUP: "Don't give up, you are doing well .",
      SUMMARY: "Your final result is : %d correct answers of %d questions. Hoped you had a fun !",
      NO_MORE_QUESTIONS: "Unfortunately it was the last question. ",
      CORRECT_ANSWER: "That's right. Good one !",
      WRONG_ANSWER: "I am sorry, your answer is wrong. Let's try again .",
      GAME_NAME: 'Guess Capitals Game',
      HELP_MESSAGE: 'You will be asked for a capitals of particular country. You can stop any time saying stop, you can say repeat to have last question repeated',
      STOP_MESSAGE: 'Goodbye!',
      WELCOME_MESSAGE: "Welcome to %s . I will ask you for a capital name of countries. Try to get as many right as you can. Good Luck !"
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
      HELP_MESSAGE: 'You will be asked for a capitals of particular country. You can stop any time saying stop, you can say repeat to have last question repeated',
      STOP_MESSAGE: 'Goodbye!',
      WELCOME_MESSAGE: "Welcome to %s . I will ask you for a capital name of countries. Try to get as many right as you can. Good Luck !"
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
    let speechOutput = this.t('WELCOME_MESSAGE', this.t('GAME_NAME'));
    let repromptText = this.t('QUESTION', 1, reply.data.askFor);
    this.emit(':askWithCard', speechOutput + repromptText, repromptText, this.t("GAME_NAME"), repromptText);
  });
};


const basicIntents = {
  'AMAZON.HelpIntent': function () {
    const speechOutput = this.t('HELP_MESSAGE');
    const reprompt = this.t('HELP_MESSAGE');
    this.emit(':ask', speechOutput, reprompt);
  },
  'AMAZON.CancelIntent': function () {
    finishGame.call(this);
  },
  'AMAZON.StopIntent': function () {
    finishGame.call(this);
  },
  'SessionEndedRequest': function () {
    this.emit(':tell', this.t('STOP_MESSAGE'));
  },
  'NewSession': function () {
    startGame.call(this);
  },
  'LaunchRequest': function(){
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
  },
  'RepeatIntent': function () {
    game.repeat(this.attributes).then(reply =>{
      let repromptText = this.t('QUESTION', reply.session.askForIndex + 1, reply.data.askFor);
      this.emit(':askWithCard', repromptText, repromptText, this.t("GAME_NAME"), repromptText);
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
