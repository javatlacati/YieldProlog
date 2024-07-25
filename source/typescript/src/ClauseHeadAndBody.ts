import {YP} from "./YP";
import {CopyStore} from "./CopyStore";
import {Functor2} from "./Functor2";
import {Atom} from "./Atom";
import {Clause} from "./Clause";

/**A ClauseHeadAndBody is used in Compiler.compileAnonymousFunction as a base class
 in order to implement YP.IClause.  After creating the object, you must call setHeadAndBody.*/
export class ClauseHeadAndBody implements Clause{
  private _Head: null;
  private _Body: null;

  constructor() {
    this._Head = null;
    this._Body = null;
  }

  setHeadAndBody(Head, Body) {
    this._Head = Head;
    this._Body = Body;
  }

  clause(Head, Body) {
    if (this._Head == null || this._Body == null)
      return YP.fail();

    // First, check if we have a match without the cost of makeCopy.
    var gotMatch = false;
    for (var l1 in YP.unify(Head, this._Head))
    {
      gotMatch = true;
      break;
    }

    if (gotMatch) {
      // We have to return a copy of _Body where the variables from _Head are bound properly.
      var copyStore = new CopyStore();
      var RuleCopy = YP.makeCopy(new Functor2(Atom.RULE, this._Head, this._Body), copyStore);

      return YP.unify(new Functor2(Atom.RULE, Head, Body), RuleCopy);
    } else
      return YP.fail();
  }

  match(args: any[]) {
  }
}