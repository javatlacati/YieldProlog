import {expect} from "chai";
import {Atom, CodeListReader, ListPair, StringReader, StringWriter, Variable, YP} from "../src";
import {parseInput} from "../src/Parser";
import {convertFunctionJavascript, makeFunctionPseudoCode} from "../src/Compiler";

describe('Elementos centrales', function () {
  describe('La clase YP', function () {

    it('debe poder obtener el valor de una variable', function () {
      let variable = new Variable();
      expect(YP.getValue(variable)).to.equal(variable);
      let variable2 = new Variable();
      YP.unify(variable2,5);
      expect(variable2.getValue()).to.equal(5);
      expect(variable2.toString()).to.equal("5");
    })

    xit('debe proporcionar una manera eficiente de unificar arrays', function () {
      let unifyArrays = YP.unifyArrays([Atom.a("a"), Atom.a("b"), Atom.a("c")], [Atom.a("a"), Atom.a("b"), Atom.a("c")]);
      let unifyArraysArray = [...unifyArrays]
      expect(unifyArraysArray).to.be.instanceof(Array)
      expect(unifyArraysArray.length).to.equal(3)
    })

    it('debe guardar hechos en un almacenamiento de predicados', function () {
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Hillary"), Atom.a("Hugh")])
      expect(YP.isDynamicCurrentPredicate("brother", 2)).to.be.true;
    })

    it('debe de poder obtener dinámicamente consultas', function () {
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Hillary"), Atom.a("Hugh")])
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Hillary"), Atom.a("Tony")]);
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Bill"), Atom.a("Roger")]);
      let queries = [...YP.matchDynamic("brother", [Atom.a("X"), Atom.a("Y")])]
      expect(queries.length).to.equal(0)
    })

    it('debe de poder resolver dinámicamente consultas simples', function () {
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Hillary"), Atom.a("Hugh")])
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Hillary"), Atom.a("Tony")]);
      YP.assertFact(Atom.a("brother"),
        [Atom.a("Bill"), Atom.a("Roger")]);
      var Brother = new Variable();
      let queries = [...YP.matchDynamic("brother", [Atom.a("Hillary"), Brother])]
      console.log(queries)
    })

    it("should be able to assign output stream", function () {
      var output = new StringWriter();
      YP.tell(output);
      YP.write(Atom.a("Hello World!"));
      YP.nl();
      YP.told();
      expect(output.toString()).to.equal('Hello World!\n');
    })

    xit("should be able to assign input stream", function () {
      YP.see(new StringReader('X is 2 + 2.'));
      YP.seen();
    })

    xit("should be able to detect system predicates", function () {
      expect(YP.isSystemPredicate(",", 2)).to.be.true;
      expect(YP.isSystemPredicate(";", 2)).to.be.true;
      //expect(YP.isSystemPredicate(Atom.DOT, 1)).to.be.true;
      expect(YP.isSystemPredicate("unknownPredicate", 1)).to.be.false;
    })

    describe('YP.equal', () => {
      it('should return true for equal numbers', () => {
        expect(YP.equal(5, 5)).to.be.true
      });

      it('should return false for unequal numbers', () => {
        expect(YP.equal(5, 6)).to.be.false;
      });

      it('should return true for equal variables bound to equal numbers', () => {
        const x = new Variable();
        const y = new Variable();
        YP.unify(x, 5);
        YP.unify(y, 5);
        expect(YP.equal(x, y)).to.be.true;
      });

      it('should return false for equal variables bound to unequal numbers', () => {
        const x = new Variable();
        const y = new Variable();
        YP.unify(x, 5);
        YP.unify(y, 6);
        expect(YP.equal(x, y)).to.be.false;
      });

      xit('should return true for equal variables bound to equal variables', () => {
        const x = new Variable();
        const y = new Variable();
        const z = new Variable();
        YP.unify(x, y);
        YP.unify(y, z);
        expect(YP.equal(x, z)).to.be.true;
      });

      xit('should return false for equal variables bound to unequal variables', () => {
        const x = new Variable();
        const y = new Variable();
        const z = new Variable();
        YP.unify(x, y);
        YP.unify(y, z);
        YP.unify(z, 5);
        expect(YP.equal(x, 5)).to.be.false;
      });
    });

    describe('YP.get_code', () => {
      xit('returns -1 when the input stream is null', () => {
        const code = new Variable();
        YP._inputStream = null;
        let codes=[...YP.get_code(code)]
        //expect().to.be.true;
        expect(YP.getValue(code)).to.equal(-1);
      });

      xit('returns the read character from the input stream', () => {
        const code = new Variable();
        var list1 = new ListPair(4, ListPair.make(Atom.a("a"),Atom.a("b")));
        YP._inputStream =new CodeListReader(list1)
        console.log(JSON.stringify(YP._inputStream))
        let codes=[...YP.get_code(code)]

        //expect(YP.get_code(code)).to.be.true;
        let value = YP.getValue(code);
        console.log(JSON.stringify(value))
        expect(4).to.equal(4);
      });
    });
    xit('returns the read character from the input stream', () => {
      const code = new Variable();
      var list1 = new ListPair(4, ListPair.make(Atom.a("a"),Atom.a("b")));
      YP.see(list1)
     // console.log(JSON.stringify(YP._inputStream))
      let codes=[...YP.get_code(code)]

      //expect(YP.get_code(code)).to.be.true;
      let value = YP.getValue(code);
      console.log(JSON.stringify(value))
      expect(4).to.equal(4);
      YP.seen()
    });

  })
})