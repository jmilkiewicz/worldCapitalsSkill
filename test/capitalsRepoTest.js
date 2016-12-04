'use strict';

const Code = require('code');
const Lab = require('lab');
const sut = require('../app/src/capitalsRepo');
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('get Capitals of Country', () => {

  it('returns Warsaw as capital of Poland', () => {
    return sut.getCapitalsOf('Poland').then((result) => {
      expect(result).to.be.array();
      expect(result).to.be.equal['warsaw'];
    });
  });

  it('returns Warsaw as capital of Poland', () => {
    return sut.getCapitalsOf('South Africa').then((result) => {
      expect(result).to.be.array();
      expect(result).to.only.include(['pretoria','cape town', "bloemfontein"]);
    });
  });

  it('returns empty array if country not found', () => {
    return sut.getCapitalsOf('Szuflandia').then((result) => {
      expect(result).to.be.array();
      expect(result).to.be.empty()
    });
  });

  it('returns all countries', () => {
    return sut.getAllDefinedCountries().then((result) => {
      expect(result).to.be.array();
      expect(result).to.include(['Poland','Togo','Sri Lanka']);
      expect(result).to.not.include(['Mardid','Victoria','Budapest']);
    });
  });
});
