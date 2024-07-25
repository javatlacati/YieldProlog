import {Functor2} from "./Functor2";
import {Atom} from "./Atom";
import {YP} from "./YP";

/**CodeListReader has a method to read the next code from
 the CodeList which is a Prolog list of integer character codes.*/
export class CodeListReader {
  private _CodeList: Functor2 | Atom;

  constructor(CodeList) {
    this._CodeList = YP.getValue(CodeList);
  }

  /**If the head of _CodeList is an integer, return it and advance the list.  Otherwise,
   return -1 for end of file.*/
  read(): number {
    if (!(this._CodeList instanceof Functor2 && this._CodeList.name == Atom.DOT &&
      YP.integer(this._CodeList.arg1))) {
      this._CodeList = Atom.NIL;
      return -1;
    }

    var code = YP.convertNumber(this._CodeList.arg1);
    // Advance.
    this._CodeList = YP.getValue(this._CodeList.arg2);
    return code;
  }

  close() {
  }

}
