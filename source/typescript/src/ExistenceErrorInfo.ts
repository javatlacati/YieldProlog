import {Functor2} from "./Functor2";
import {Atom} from "./Atom";

export class ExistenceErrorInfo{
  private _Type: Atom;
  private _Culprit: any;
  private _Message: any;

  constructor(Type: Atom, Culprit, Message) {
    this._Type = Type;
    this._Culprit = Culprit;
    this._Message = Message;
  }

// If _Type is procedure and _Culprit is name/artity, return the name.  Otherwise return null.
  getProcedureName() {
    if (!(this._Type.name == "procedure" &&
      this._Culprit instanceof Functor2 && this._Culprit.name == Atom.SLASH))
      return null;
    return this._Culprit.arg1;
  }

// If _Type is procedure and _Culprit is name/arity and arity is an integer, return the arity.
// Otherwise return -1.
  getProcedureArity(): number {
    if (!(this._Type.name == "procedure" &&
      this._Culprit instanceof Functor2 && this._Culprit.name == Atom.SLASH))
      return -1;
    if (typeof(this._Culprit.arg2) != "number")
      return -1;
    return this._Culprit.arg2;
  }
}