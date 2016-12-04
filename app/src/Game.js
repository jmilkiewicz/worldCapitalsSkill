'use strict';

const _ = require('lodash/fp');

//DUPLICATION: askFor added for each request

//TODO this is really lame
const increaseProperty = _.curry((propertyName, sessionData) => {
  const copy = _.defaults(sessionData)({});
  copy[propertyName] = sessionData[propertyName] + 1;
  return copy;
});

const increaseScore = increaseProperty('score');
const increaseQuestionIndex = increaseProperty('askForIndex');

const countryToAsk = sessionData => sessionData.countries[sessionData.askForIndex];

const isEndOfGame = sessionData => sessionData.countries.length <= sessionData.askForIndex;

const summary = (sessionData) => ({
  questions: sessionData.askForIndex,
  validAnswers: sessionData.score
});

const endOfGameReply = _.flow(summary, _.extend({ endGame: true }));

function progressData(sessionData) {
  let extras;
  if (isEndOfGame(sessionData)) {
    extras = endOfGameReply(sessionData)
  } else {
    extras = { askFor: countryToAsk(sessionData) }
  }
  return extras;
}
module.exports = (dao) => {

  return {
    startGame() {
      const allCounties = dao.getAllDefinedCountries();

      return allCounties.then(countries => {
        const freshSession = { countries: _.shuffle(countries), askForIndex: 0, score: 0 };
        return  {
          session: freshSession,
          data: { askFor: countryToAsk(freshSession)}
        }
      });
    },
    skip(sessionData) {
      const currentCountry = countryToAsk(sessionData);

      return dao.getCapitalsOf(currentCountry).then(_.head).then(capital => {
        const answer = { county: currentCountry, capital: capital };
        const newSession = increaseQuestionIndex(sessionData);
        return {
          session: newSession,
          data: _.extend(answer, progressData(newSession))
        }
      });
    },
    answer(guess, sessionData) {
      const currentCountry = countryToAsk(sessionData);

      const isAnswerCorrect = dao.getCapitalsOf(currentCountry).then(_.includes(_.lowerCase(guess)));

      return isAnswerCorrect.then(answerCorrect => {
        let newSession = sessionData;
        let success = false;
        if (answerCorrect) {
          newSession = _.flow(increaseQuestionIndex, increaseScore)(sessionData);
          success = true;
        }
        return {
          session: newSession,
          data: _.extend({ success: success }, progressData(newSession))
        }
      });
    },

    repeat(sessionData) {
      return Promise.resolve({
        session: sessionData,
        data: { askFor: countryToAsk(sessionData)}
      });
    },
    finish(sessionData) {
      return Promise.resolve({
        data: summary(sessionData)
      });
    }

  };
};
