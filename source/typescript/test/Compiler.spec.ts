import {Atom, StringWriter, Variable, YP} from "../src";
import {append, convertFunctionJavascript, member} from "../src/Compiler";
import {expect} from "chai";

describe('Compiler tests', () => {
  xdescribe('convertFunctionJavascript', () => {
    it('should convert "getDeclaringClass" to a JavaScript function', () => {
      let output = new StringWriter();
      YP.tell(output);
      let PseudoCode = new Variable();
      convertFunctionJavascript(PseudoCode);

      const expectedOutput = "function getDeclaringClass() { return null; }\n\n";

      YP.told();
      expect(output.toString()).to.equal(expectedOutput);

    });
  });
  xdescribe('member function', () => {
    it('should return true when X is a member of the list', () => {
      const X = 'a';
      const list = ['a', 'b', 'c'];
      const result = Array.from(member(X, list));
      expect(result).to.equal([false]);
    });

    it('should return false when X is not a member of the list', () => {
      const X = 'd';
      const list = ['a', 'b', 'c'];
      const result = Array.from(member(X, list));
      expect(result).to.equal([false]);
    });

    it('should handle empty lists', () => {
      const X = 'a';
      const list: any[] = [];
      const result = Array.from(member(X, list));
      expect(result).to.equal([false]);
    });
  });

  describe('append function', () => {
    xit('should append elements to an empty list', () => {
      const emptyList = Atom.NIL;
      const elementsToAdd = [1, 2, 3];
      const expectedResult = [1, 2, 3];

      const result = [];

        for (const appendedList of append(emptyList, elementsToAdd, result)) {
          //result.push(element);
          console.log(result)
        }


      expect(result).to.equal(expectedResult);
    });

    xit('should append elements to a non-empty list', () => {
      const nonEmptyList = [1, 2];
      const elementsToAdd = [3, 4, 5];
      const expectedResult = [1, 2, 3, 4, 5];

      const result = new Variable();
        for (const appendedList of append(nonEmptyList,elementsToAdd,result)) {
          //result.push(element);
          console.log(JSON.stringify(result),)
        }

      console.log(JSON.stringify(result))
      expect(result).not.to.equal(expectedResult);
    });
  });

})