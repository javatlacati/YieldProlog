export class StringReader {
  private _inputReadIndex: number;
  private _inputString: string;

  constructor(inputString) {
    this._inputString = inputString;
    this._inputReadIndex = 0;
  }

// Return the character code of the next character in the inputString or -1 if past the end.
  read() {
    if (this._inputReadIndex >= this._inputString.length)
      return -1;
    return this._inputString.charCodeAt(this._inputReadIndex++);
  }

  close() {
  }

}