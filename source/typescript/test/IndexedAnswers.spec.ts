import {IndexedAnswers, Variable} from "../src";
import {expect} from "chai";

describe('Elementos centrales', function () {
  describe('La clase IndexedAnswers', function () {
    it('debe de poder decirnos que datos puede o no almacenar', function () {
      expect(IndexedAnswers.getIndexValue("Hillary")).to.equal("Hillary");
      // expect(IndexedAnswers.getIndexValue(new Variable())).to.be.undefined; //debidoa typescript este método ya no tiene caso porque no acepta otro tipo de valores
    })
    it('debe poder comparar correctamente arreglos', function () {
      expect(IndexedAnswers.arrayEquals([1, 2, 3], [1, 2, 3])).to.be.true;
      expect(IndexedAnswers.arrayEquals([1, 2], [1, 2, 3])).to.be.false;
      expect(IndexedAnswers.arrayEquals([1, 2, 3], [1, 2, 4])).to.be.false;
    })
    it('debe de poder almacer y recuperar respuestas', function () {
      let ia = new IndexedAnswers(2);
      ia.addAnswer(["happy", "Tony"]);
      let matches: any[] = [];
      for (let match of ia.match(["happy", "Tony"])) {
        matches.push(match);
      }
      expect(matches.length).to.equal(1);
    })
  })
})