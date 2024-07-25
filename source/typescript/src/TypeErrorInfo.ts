import {Atom} from "./Atom";

export class TypeErrorInfo {
  private _Type: Atom;
  private _Culprit: any;
  private _Message: any;

  constructor(Type: Atom, Culprit, Message) {
    this._Type = Type;
    this._Culprit = Culprit;
    this._Message = Message;
  }
}