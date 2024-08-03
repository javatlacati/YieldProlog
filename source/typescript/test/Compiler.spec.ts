import {StringWriter, Variable, YP} from "../src";
import {convertFunctionJavascript} from "../src/Compiler";
import {expect} from "chai";

describe('Compiler tests', () => {
  describe('convertFunctionJavascript', () => {
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
})