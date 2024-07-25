/*
 * Copyright (C) 2007-2008, Jeff Thompson
 * 
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 *     * Redistributions of source code must retain the above copyright 
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright 
 *       notice, this list of conditions and the following disclaimer in the 
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the copyright holder nor the names of its contributors 
 *       may be used to endorse or promote products derived from this software 
 *       without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
 * LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
 * NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {Atom} from "./Atom";
import {YP} from "./YP";
import {Variable} from "./Variable";

export class Functor3{
  private _name: Atom;
  private _arg1: any;
  private _arg2: any;
  private _arg3: any;
  constructor(name: Atom|string, arg1:any, arg2:any, arg3:any) {
    if (name instanceof Atom)
      this._name = name;
    else
      // Assume name is a string.
      this._name = Atom.a(name);
    this._arg1 = arg1;
    this._arg2 = arg2;
    this._arg3 = arg3;
  }

// If arg is another Functor3, then succeed (yield once) if this and arg have the
// same name and all functor args unify, otherwise fail (don't yield).
// If arg is a Variable, then call its unify to unify with this.
// Otherwise fail (don't yield).
  *unify(arg: Variable | Functor3) {
    arg = YP.getValue(arg);
    if (arg instanceof Functor3)
    {
      if (this._name.equals(arg._name)) {
        for (var l1 in YP.unify(this._arg1, arg._arg1)) {
          for (var l1 in YP.unify(this._arg2, arg._arg2)) {
            for (var l1 in YP.unify(this._arg3, arg._arg3))
            yield false;
          }
        }
      }
    }
    else if (arg instanceof Variable) {
      for (var l1 in arg.unify(this))
      yield false;
    }
  }

  toString = function() {
    return this._name + "(" + YP.getValue(this._arg1) + ", " + YP.getValue(this._arg2) + ", " +
      YP.getValue(this._arg3) + ")";
  }

  termEqual = function(term) {
    term = YP.getValue(term);
    if (term instanceof Functor3)
      return this._name.equals(term._name) && YP.termEqual(this._arg1, term._arg1) &&
        YP.termEqual(this._arg2, term._arg2) && YP.termEqual(this._arg3, term._arg3);
    return false;
  }

  lessThan = function(functor) {
    // Do the equal check first since it is faster.
    if (!this._name.equals(functor._name))
      return this._name.lessThan(functor._name);

    if (!YP.termEqual(this._arg1, functor._arg1))
      return YP.termLessThan(this._arg1, functor._arg1);

    if (!YP.termEqual(this._arg2, functor._arg2))
      return YP.termLessThan(this._arg2, functor._arg2);

    return YP.termLessThan(this._arg3, functor._arg3);
  }


  ground = function() {
    return YP.ground(this._arg1) && YP.ground(this._arg2) && YP.ground(this._arg3);
  }

  addUniqueVariables = function(variableSet) {
    YP.addUniqueVariables(this._arg1, variableSet);
    YP.addUniqueVariables(this._arg2, variableSet);
    YP.addUniqueVariables(this._arg3, variableSet);
  }

  makeCopy = function(copyStore) {
    return new Functor3(this._name, YP.makeCopy(this._arg1, copyStore),
      YP.makeCopy(this._arg2, copyStore), YP.makeCopy(this._arg3, copyStore));
  }


  get name(): Atom {
    return this._name;
  }

  set name(value: Atom) {
    this._name = value;
  }

  get arg1(): any {
    return this._arg1;
  }

  set arg1(value: any) {
    this._arg1 = value;
  }

  get arg2(): any {
    return this._arg2;
  }

  set arg2(value: any) {
    this._arg2 = value;
  }

  get arg3(): any {
    return this._arg3;
  }

  set arg3(value: any) {
    this._arg3 = value;
  }
}

