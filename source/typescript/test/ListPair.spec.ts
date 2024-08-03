import {expect} from "chai";
import {Atom, ListPair, PrologException, Variable, YP} from "../src";

describe('Elementos básicos', function () {
  describe('Listas', function () {
    it('Deben representarse apropiadamente como cadena', function () {
      var list1 = new ListPair("a", Atom.NIL);
      var list2 = new ListPair("b", list1);
      var list3 = new ListPair("c", list2);
      expect(list1.toString()).to.equal("[a]")
      expect(list2.toString()).to.equal("[b, a]")
      expect(list3.toString()).to.equal("[c, b, a]")
    });
    it('Deben construirse adecuadamente cono la fábrica estática make', function () {
      var empty_list = ListPair.make(Atom.NIL);
      var list1 = ListPair.make("a", Atom.NIL);
      var list2 = ListPair.make("a", "b", "c");
      var list3 = ListPair.make("a", ListPair.make("b", "c"));
      var list4 = ListPair.make(Atom.a("a"), Atom.NIL);
      var list5 = ListPair.make([Atom.a("a"), Atom.a("b"), Atom.a("c"), "d"], "e", "f");
      expect(empty_list.toString()).to.equal("[[]]")
      expect(list1.toString()).to.equal("[a, []]")
      expect(list2.toString()).to.equal("[a, b, c]")
      expect(list3.toString()).to.equal("[a, [b, c]]")
      expect(list4.toString()).to.equal("[a, []]")
      expect(list5.toString()).to.equal("[a,b,c,d, e, f]")
    });
    it('Deben construirse adecuadamente cono la fábrica estática makeWithoutRepeatedTerms', function () {
      var empty_list = ListPair.makeWithoutRepeatedTerms([Atom.NIL]);
      var list1 = ListPair.makeWithoutRepeatedTerms([Atom.a("a"), Atom.NIL]);
      var list2 = ListPair.makeWithoutRepeatedTerms([Atom.a("a"), Atom.a("b"), Atom.a("a")]);
      var list3 = ListPair.makeWithoutRepeatedTerms([Atom.NIL, Atom.a("b"), Atom.NIL]);
      // var list4 = ListPair.makeWithoutRepeatedTerms("a", ListPair.make("b", "c"));
      expect(empty_list.toString()).to.equal("[[]]")
      expect(list1.toString()).to.equal("[a, []]")
      expect(list2.toString()).to.equal("[a, b, a]")
      expect(list3.toString()).to.equal("[[], b, []]")
      // expect(list4.toString()).to.equal("[a, [b, c]]")
    });
    it('La conversión a arreglo debe funcionar adecuadamente', function () {
      var empty_list = ListPair.make(Atom.NIL);
      var list1 = ListPair.make("a", Atom.NIL);
      var list3 = ListPair.make("a", ListPair.make("b", "c"));
      expect(ListPair.toArray(empty_list)).to.deep.equal([Atom.NIL])
      expect(ListPair.toArray(list1)).to.deep.equal(["a", Atom.NIL])
      expect(ListPair.toArray(list3)).to.deep.equal(["a", ListPair.make("b", "c")])
      var atomNil = Atom.NIL;
      let actualArray = ListPair.toArray(atomNil);
      expect(actualArray).to.deep.equal([]);
    });
    it('Debe lanzar prologexception si tiene solamente una variable', function () {
      var aVariable = new Variable();
      expect(() => ListPair.toArray(aVariable)).to.throw(PrologException);
    })
    xit('Debe lanzar prologexception si tiene variables', function () {
      var list2 = ListPair.make("a", new Variable());
      expect(ListPair.toArray(list2)).to.throw(PrologException);
    })
  });
});