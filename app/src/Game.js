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

module.exports = (dao) => {

  return {
    startGame() {
      const allCounties = dao.getAllDefinedCountries();
      return allCounties.then(countries => {
        const freshSession = { countries: countries, askForIndex: 0, score: 0 };
        return  {
          session: freshSession,
          data: { askFor: countryToAsk(freshSession)}
        }
      });
    },
    skip(sessionData) {
      const currentCountry = countryToAsk(sessionData);

      return dao.getCapitalsOf(currentCountry).then(_.head).then(capital => {
        const newSession = increaseQuestionIndex(sessionData);
        return {
          session: newSession,
          data: { county: currentCountry, capital: capital, askFor: countryToAsk(newSession) }
        }
      });
    },
    answer(guess, sessionData) {
      const currentCountry = countryToAsk(sessionData);

      const isAnswerCorrect = dao.getCapitalsOf(currentCountry).then(capitals => _.includes(_.lowerCase(guess))(capitals));

      return isAnswerCorrect.then(answerCorrect => {
        let newSession = sessionData;
        let success = false;
        if (answerCorrect) {
          newSession = _.flow(increaseQuestionIndex, increaseScore)(sessionData);
          success = true;
        }
        return {
          session: newSession,
          data: { askFor: countryToAsk(newSession), success: success }
        }
      });
    },

    finish(sessionData) {
      return Promise.resolve({
        data: { validAnswers: sessionData.score, questions: sessionData.askForIndex }
      });
    }

  };
};
