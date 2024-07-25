import {Variable} from "./Variable";

/**A CopyStore is used by makeCopy to track which Variable objects have
 been copied.*/
export class CopyStore {
  _inVariableList: Variable[] = []
  _outVariableList: Variable[] = []

  /**If inVariable has already been copied, return its copy. Otherwise,
   return a fresh Variable associated with inVariable.*/
  getCopy(inVariable: Variable): Variable {
    var index = this._inVariableList.indexOf(inVariable);
    if (index >= 0)
      return this._outVariableList[index];
    else {
      var outVariable = new Variable();
      this._inVariableList.push(inVariable);
      this._outVariableList.push(outVariable);
      return outVariable;
    }
  }

  /**Return the number of unique variables that have been copied.*/
  getNUniqueVariables(): number {
    return this._inVariableList.length;
  }

}