/**A YP.StringWriter has write and writeLine to append to a string buffer.
 To get the result, call toString.
 A YP.StringWriter object can be used in YP.tell.*/
export class StringWriter {
  private _stringArray: string[];

  constructor() {
    this._stringArray = [];
  }

  write(text) {
    this._stringArray.push(text);
  }

  writeLine(text) {
    if (text !== undefined)
      this._stringArray.push(text);
    this._stringArray.push("\n");
  }

  /**Convert the results so far to a string and return it.*/
  toString = function () {
    return this._stringArray.join("");
  }

  close = function () {
  }

}