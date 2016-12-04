'use strict';

const Code = require('code');
const Lab = require('lab');
const Sinon = require('sinon');
const SutFactory = require('../app/src/Game');
const _ = require('lodash/fp');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;
const beforeEach = lab.beforeEach;

describe('get Capitals of Country', () => {


  let game;
  let getCapitalsOfStub;
  let getAllDefinedCountriesStub;

  beforeEach((done) => {

    getCapitalsOfStub = Sinon.stub();
    getAllDefinedCountriesStub = Sinon.stub();

    game = SutFactory({
      getCapitalsOf: getCapitalsOfStub,
      getAllDefinedCountries: getAllDefinedCountriesStub
    });
    done();
  });

  it('returns initialState for game start', () => {
    const countries = ['Poland', 'Portugal', 'Belarus'];
    getAllDefinedCountriesStub.returns(Promise.resolve(countries));
    return game.startGame().then((result) => {

      expect(result.session).to.include({askForIndex: 0, score: 0 });
      expect(result.data).to.include({askFor: result.session.countries[0]});
      expect(result.session.countries).to.include(countries);
    });
  });

  describe('on skip', () => {

    beforeEach((done) => {
      getCapitalsOfStub.returns(Promise.resolve(['Warsaw']));
      done();
    });


    describe('when still countries to ask', () => {

      const sessionData = { countries: ["Poland", "Belgium"], askForIndex: 0, score: 0 };
      let skipResult;

      beforeEach(() => {
        skipResult = game.skip(sessionData);
        return skipResult.catch(_.noop);
      });


      it('progress to a new country', () => {

        const newIndex = sessionData.askForIndex + 1;
        const expectedSession = _.defaults(sessionData)({ askForIndex: newIndex });
        const expectedData = { county: "Poland", capital: "Warsaw", askFor: "Belgium" };

        return skipResult.then((result) => {
          expect(result).to.equal({ session: expectedSession, data: expectedData });
        });
      });

      it('ask for a capital of not answered country', (done) => {
        const previousCountry = sessionData.countries[sessionData.askForIndex];

        expect(getCapitalsOfStub.calledOnce).to.be.true;
        expect(getCapitalsOfStub.args[0]).to.be.equal([previousCountry]);
        done();
      });
    });

    //TODO what if not no more countrues
  });

  describe('on answer', () => {

    describe('when still countries to ask', () => {

      let sessionData;

      beforeEach((done) => {
        sessionData = { countries: ["Poland", "Belgium"], askForIndex: 0, score: 0 };
        getCapitalsOfStub.returns(Promise.resolve(['warsaw']));
        done();
      });

      it('progress and increase score when answer is ok', () => {


        const newIndex = sessionData.askForIndex + 1;
        const newScore = sessionData.score + 1;

        const expectedSession = _.defaults(sessionData)({ askForIndex: newIndex, score: newScore });
        const expectedData = { askFor: "Belgium", success: true };

        return game.answer('Warsaw', sessionData).then((result) => {
          expect(result).to.equal({ session: expectedSession, data: expectedData });
        });
      });

      it('do not progress and mark answer as invalid when answer is NOT ok', () => {
        const expectedData = { askFor: "Poland", success: false };

        return game.answer("Madrid", sessionData).then((result) => {
          expect(result).to.equal({ session: sessionData, data: expectedData });
        });
      });

      it('do not progress and mark answer as invalid when answer is undefined', () => {
        const expectedData = { askFor: "Poland", success: false };

        return game.answer(undefined, sessionData).then((result) => {
          expect(result).to.equal({ session: sessionData, data: expectedData });
        });
      });

      it('Calls for a capital of current country ', () => {

        const country = sessionData.countries[sessionData.askForIndex];

        return game.answer('Warsaw', sessionData).then(() => {
          expect(getCapitalsOfStub.calledOnce).to.be.true;
          expect(getCapitalsOfStub.args[0]).to.be.equal([country]);
        });
      });
    });

    //TODO what if not no more countrues
  });

  describe('on cancel/stop', () => {

    it('Returns summary', () => {

      const sessionData = { countries: ["Poland", "Belgium", "Switzerland"], askForIndex: 1, score: 0 };

      return game.finish(sessionData).then((result) => {
        expect(result).to.equal({ data: {validAnswers: 0, questions: 1} });
      });
    });
  });

});
