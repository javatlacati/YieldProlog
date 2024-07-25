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
import {Functor2} from "./Functor2";
import {PrologException} from "./PrologException";
import {ListPair} from "./ListPair";
import {Variable} from "./Variable";
import {Functor} from "./Functor";
import {Functor1} from "./Functor1";
import {Functor3} from "./Functor3";
import {StringWriter} from "./StringWriter";
import {ClauseHeadAndBody} from "./ClauseHeadAndBody";
import {FindallAnswers} from "./FindallAnswers";
import {CompilerState} from "./CompilerState";

export class Compiler {

  constructor() {
  }

// Use makeFunctionPseudoCode, convertFunctionJavascript and compileAnonymousFunction
// to return an anonymous YP.IClause for the Head and Body of a rule clause.
// Head is a prolog term such as new Functor2("test1", X, Y).
// Note that the name of the head is ignored.
// Body is a prolog term such as
// new Functor2(",", new Functor1(Atom.a("test2", Atom.a("")), X),
//              new Functor2("=", Y, X)).
// This may not be null.  (For a head-only clause, set the Body to Atom.a("true").
// (This has no declaringClass because it is assumed that predicates with default module Atom.a("")
//  are in the global scope.)
// Returns a new object on which you can call match(args) where
// args length is the arity of the Head.
  static compileAnonymousClause(Head, Body: Atom,declaringClass?) {
    let args = YP.getFunctorArgs(Head);
    // compileAnonymousFunction wants "function".
    let Rule = new Functor2(Atom.RULE, Functor.make("function", args), Body);
    let RuleList = ListPair.make(new Functor2(Atom.F, Rule, Atom.NIL));

    let functionCode = new StringWriter();
    let SaveOutputStream = new Variable();
    for (let l1 in YP.current_output(SaveOutputStream)) {
      try {
        YP.tell(functionCode);
        let PseudoCode = new Variable();
        for (let l2 of makeFunctionPseudoCode(RuleList, PseudoCode)) {
          if (YP.termEqual(PseudoCode, Atom.a("getDeclaringClass")))
            // Ignore getDeclaringClass since we have access to the one passed in.
            continue;

          convertFunctionJavascript(PseudoCode);
        }
        YP.told();
      }
      finally {
        // Restore after calling tell.
        YP.tell(SaveOutputStream.getValue());
      }
    }

    return Compiler.compileAnonymousFunction(functionCode.toString(), args.length);
  }

// Use eval to compile the functionCode and return a YP.ClauseHeadAndBody object which implements
//   match(args) which is called with an array of the arguments to match the clause.
// functionCode is the code for the iterator, such as
// "function() { yield false; }"
// nArgs is the number of args in the function.
  static compileAnonymousFunction(functionCode: string, nArgs) {
    let matchCode = new StringWriter();
    matchCode.write("(function(args) { return this._function(");
    if (nArgs >= 1)
      matchCode.write("args[0]");
    for (let i = 1; i < nArgs; ++i)
      matchCode.write(", args[" + i + "]");
    matchCode.write("); })");

    let clause = new ClauseHeadAndBody();
    // Put inside parentheses to make a syntactically valid expression.
    //clause._function =
      eval("(" + functionCode + ")");
    clause.match = eval(matchCode.toString());
    return clause;
  }

// If the functor with name and args can be called directly as determined by
//   functorCallFunctionName, then call it and return its iterator.  If the predicate is
//   dynamic and undefined, or if static and the method cannot be found, return
//   the result of YP.unknownPredicate.
// declaringClass is used to resolve references to the default
// module Atom.a(""). If a declaringClass is needed to resolve the reference but it is
//   null, this looks in the global scope.  If not found, this throws a
//   PrologException for existence_error.
// This returns null if the functor has a special form than needs to be compiled
//   (including ,/2 and ;/2).
  static getSimpleIterator(name, args, declaringClass) {
    let state = new CompilerState();
    let FunctionName = new Variable();
    for (let l1 in functorCallFunctionName(state, name, args.length, FunctionName)) {
      let functionNameAtom = FunctionName.getValue();
      if (functionNameAtom == Atom.NIL)
        // name is for a dynamic predicate.
        return YP.matchDynamic(name, args);

      let methodName = functionNameAtom._name;
      // Set the default for the method to call.
      let methodClass = declaringClass;

      let checkMode = false;
      if (methodName.substr(0,2) == "YP.") {
        // Assume we only check mode in calls to standard Prolog predicates in YP.
        checkMode = true;

        // Use the method in class YP.
        methodName = methodName.substr(3);
        methodClass = YP;
      }
      if (methodName.indexOf(".") >= 0)
        // We don't support calling inner classes, etc.
        return null;

      let func = null;
      try {
        if (methodClass == null)
          // Look in the global scope.
          func = eval(methodName);
        else
          func = methodClass[methodName];

        if (func === undefined || typeof(func) != "function")
          func = null;
      } catch (e) {
        func = null;
      }

      if (func == null)
        throw new PrologException
        (new Functor2
          (Atom.a("existence_error"), Atom.a("procedure"),
            new Functor2(Atom.a("/"), name, args.length)),
          "Cannot find predicate function " + methodName + " for " + name + "/" + args.length +
          " in " + (methodClass == null ? "the global scope" : methodClass.toString()));

      if (checkMode) {
        assertYPPred(state);
        let functor = Functor.make(name, args);
        if (CompilerState.isDetNoneOut(state, functor)) {
          func.apply(null, args);
          return YP.succeed();
        }
        if (CompilerState.isSemidetNoneOut(state, functor)) {
          if (func.apply(null, args))
            return YP.succeed();
          else
            return YP.fail();
        }
      }
      return func.apply(null, args) as Iterator<any>;
    }

    return null;
  }

// Return true if there is a dynamic or static predicate with name and arity.
// This returns false for built-in predicates.
// declaringClass: used to resolve references to the default
// module Atom.a(""). If a declaringClass is needed to resolve the reference but it is
//   null, return false.
  static isCurrentPredicate(name, arity, declaringClass) {
    let state = new CompilerState();
    let FunctionName = new Variable();
    for (let l1 in functorCallFunctionName(state, name, arity, FunctionName)) {
      let functionNameAtom = FunctionName.getValue();
      if (functionNameAtom == Atom.NIL)
        // name is for a dynamic predicate.
        return YP.isDynamicCurrentPredicate(name, arity);

      let methodName = functionNameAtom._name;

      if (methodName.substr(0,2) == "YP.")
        // current_predicate/1 should fail for built-ins.
        return false;
      if (methodName.indexOf(".") >= 0)
        // We don't support calling inner classes, etc.
        return false;

      try {
        // Look in the global scope.
        let func = eval(methodName);
        // Note that Javascript doesn't let us check the arity, but make sure it's a function.
        return typeof(func) == "function";
      } catch (e) {
        // eval didn't find it.
        return false;
      }
    }

    return false;
  }

}

// Compiler output follows.

function getDeclaringClass() { return null; }

function repeatWrite(arg1, N) {
  {
    let _Value = arg1;
    if (YP.termEqual(N, 0)) {
      return;
    }
  }
  {
    let Value = arg1;
    let NextN = new Variable();
    YP.write(Value);
    for (let l2 of YP.unify(NextN, YP.subtract(N, 1))) {
      repeatWrite(Value, NextN);
      return;
    }
  }
}

export function sameVariable(Variable1, Variable2: any) {
  {
    if (YP.var(Variable1)) {
      if (YP.var(Variable2)) {
        if (YP.termEqual(Variable1, Variable2)) {
          return true;
        }
      }
    }
  }
  return false;
}

function *makeFunctionPseudoCode(RuleList, FunctionCode) {
  {
    let State = new Variable();
    for (let l2 of CompilerState.make(State)) {
      assertYPPred(State);
      processCompilerDirectives(RuleList, State);
      for (let l3 of YP.unify(FunctionCode, Atom.a("getDeclaringClass"))) {
        yield false;
      }
      for (let l3 of makeFunctionPseudoCode3(RuleList, State, FunctionCode)) {
        yield false;
      }
    }
  }
}

function assertYPPred(State) {
  {
    CompilerState.assertPred(State, Atom.a("nl"), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("write", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("put_code", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("see", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, Atom.a("seen"), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("tell", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, Atom.a("told"), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("throw", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("abolish", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("retractall", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, new Functor2("set_prolog_flag", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("det"));
    CompilerState.assertPred(State, new Functor1("var", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("nonvar", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("atom", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("integer", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("float", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("number", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("atomic", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("compound", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor1("ground", new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor2("==", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor2("\\==", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor2("@<", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor2("@=<", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor2("@>", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    CompilerState.assertPred(State, new Functor2("@>=", new Functor2("::", Atom.a("univ"), Atom.a("in")), new Functor2("::", Atom.a("univ"), Atom.a("in"))), Atom.a("semidet"));
    return;
  }
}

function processCompilerDirectives(arg1, arg2) {
  {
    let _State = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let State = arg2;
    let Pred = new Variable();
    let Determinism = new Variable();
    let x3 = new Variable();
    let RestRules = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", new Functor1(":-", new Functor1("pred", new Functor2("is", Pred, Determinism))), x3), RestRules))) {
      CompilerState.assertPred(State, Pred, Determinism);
      processCompilerDirectives(RestRules, State);
      return;
    }
  }
  {
    let State = arg2;
    let Module = new Variable();
    let PredicateList = new Variable();
    let x3 = new Variable();
    let RestRules = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", new Functor1(":-", new Functor2("import", Module, PredicateList)), x3), RestRules))) {
      for (let l3 in importPredicateList(State, Module, PredicateList)) {
        processCompilerDirectives(RestRules, State);
        return;
      }
    }
  }
  {
    let State = arg2;
    let x1 = new Variable();
    let x2 = new Variable();
    let RestRules = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", new Functor1(":-", x1), x2), RestRules))) {
      processCompilerDirectives(RestRules, State);
      return;
    }
  }
  {
    let State = arg2;
    let Head = new Variable();
    let _Body = new Variable();
    let x3 = new Variable();
    let RestRules = new Variable();
    let Name = new Variable();
    let Arity = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", new Functor2(":-", Head, _Body), x3), RestRules))) {
      for (let l3 in YP.functor(Head, Name, Arity)) {
        CompilerState.assertModuleForNameArity(State, Name, Arity, Atom.a(""));
        processCompilerDirectives(RestRules, State);
        return;
      }
    }
  }
  {
    let State = arg2;
    let Fact = new Variable();
    let x2 = new Variable();
    let RestRules = new Variable();
    let Name = new Variable();
    let Arity = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", Fact, x2), RestRules))) {
      for (let l3 in YP.functor(Fact, Name, Arity)) {
        CompilerState.assertModuleForNameArity(State, Name, Arity, Atom.a(""));
        processCompilerDirectives(RestRules, State);
        return;
      }
    }
  }
  {
    let State = arg2;
    let x1 = new Variable();
    let RestRules = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(x1, RestRules))) {
      processCompilerDirectives(RestRules, State);
      return;
    }
  }
}

function *importPredicateList(arg1, arg2, arg3) {
  {
    let _State = arg1;
    let _Module = arg2;
    for (let l2 of YP.unify(arg3, Atom.NIL)) {
      yield true;
      return;
    }
  }
  {
    let State = arg1;
    let Module = arg2;
    let Name = new Variable();
    let Arity = new Variable();
    let Rest = new Variable();
    for (let l2 of YP.unify(arg3, new ListPair(new Functor2("/", Name, Arity), Rest))) {
      CompilerState.assertModuleForNameArity(State, Name, Arity, Module);
      for (let l3 in importPredicateList(State, Module, Rest)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg1;
    let Module = arg2;
    let x3 = new Variable();
    let Rest = new Variable();
    for (let l2 of YP.unify(arg3, new ListPair(x3, Rest))) {
      for (let l3 in importPredicateList(State, Module, Rest)) {
        yield true;
        return;
      }
    }
  }
}

function *makeFunctionPseudoCode3(RuleList, State: Variable, FunctionCode) {
  {
    let SamePredicateRuleList = new Variable();
    let RestRules = new Variable();
    for (let l2 in samePredicateRuleList(RuleList, SamePredicateRuleList, RestRules)) {
      if (YP.termNotEqual(SamePredicateRuleList, Atom.NIL)) {
        for (let l4 in compileSamePredicateFunction(SamePredicateRuleList, State, FunctionCode)) {
          yield false;
        }
        for (let l4 in makeFunctionPseudoCode3(RestRules, State, FunctionCode)) {
          yield false;
        }
      }
    }
  }
}

function *compileSamePredicateFunction(SamePredicateRuleList: Variable, State, FunctionCode) {
  {
    let FirstRule = new Variable();
    let x5 = new Variable();
    let x6 = new Variable();
    let x7 = new Variable();
    let Head = new Variable();
    let x9 = new Variable();
    let ArgAssignments = new Variable();
    let Calls = new Variable();
    let Rule = new Variable();
    let VariableNameSuggestions = new Variable();
    let ClauseBag = new Variable();
    let Name = new Variable();
    let ArgsList = new Variable();
    let FunctionArgNames = new Variable();
    let MergedArgName = new Variable();
    let ArgName = new Variable();
    let MergedArgNames = new Variable();
    let FunctionArgs = new Variable();
    let BodyCode = new Variable();
    let ReturnType = new Variable();
    let BodyWithReturn = new Variable();
    for (let l2 of YP.unify(new ListPair(new Functor2("f", FirstRule, x5), x6), SamePredicateRuleList)) {
      cutIf1:
      {
        for (let l4 of YP.unify(FirstRule, new Functor1(":-", x7))) {
          break cutIf1;
        }
        cutIf2:
        {
          for (let l5 of YP.unify(new Functor2(":-", Head, x9), FirstRule)) {
            CompilerState.startFunction(State, Head);
            let findallAnswers3 = new FindallAnswers(new Functor2("f", ArgAssignments, Calls));
            for (let l6 in member(new Functor2("f", Rule, VariableNameSuggestions), SamePredicateRuleList)) {
              for (let l7 in compileBodyWithHeadBindings(Rule, VariableNameSuggestions, State, ArgAssignments, Calls)) {
                findallAnswers3.add();
              }
            }
            for (let l6 in findallAnswers3.result(ClauseBag)) {
              for (let l7 in YP.univ(Head, new ListPair(Name, ArgsList))) {
                for (let l8 in getFunctionArgNames(ArgsList, 1, FunctionArgNames)) {
                  let findallAnswers4 = new FindallAnswers(MergedArgName);
                  for (let l9 in member(ArgName, FunctionArgNames)) {
                    cutIf5:
                    {
                      for (let l11 in argAssignedAll(ArgName, ClauseBag, MergedArgName)) {
                        findallAnswers4.add();
                        break cutIf5;
                      }
                      for (let l11 of YP.unify(MergedArgName, ArgName)) {
                        findallAnswers4.add();
                      }
                    }
                  }
                  for (let l9 in findallAnswers4.result(MergedArgNames)) {
                    for (let l10 in maplist_arg(MergedArgNames, FunctionArgs)) {
                      for (let l11 in maplist_compileClause(ClauseBag, MergedArgNames, BodyCode)) {
                        cutIf6:
                        {
                          if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                            for (let l14 of YP.unify(ReturnType, Atom.a("void"))) {
                              cutIf7:
                              {
                                if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                                  for (let l17 in append(BodyCode, new ListPair(Atom.a("returnfalse"), Atom.NIL), BodyWithReturn)) {
                                    for (let l18 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                      yield false;
                                    }
                                  }
                                  break cutIf7;
                                }
                                cutIf8:
                                {
                                  if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                                    for (let l18 of YP.unify(BodyWithReturn, BodyCode)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                    break cutIf8;
                                  }
                                  cutIf9:
                                  {
                                    if (CompilerState.codeUsesYield(State)) {
                                      for (let l19 of YP.unify(BodyWithReturn, BodyCode)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf9;
                                    }
                                    for (let l18 in append(BodyCode, new ListPair(new Functor1("blockScope", new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.fail"), Atom.NIL), new ListPair(Atom.a("yieldfalse"), Atom.NIL)), Atom.NIL)), Atom.NIL), BodyWithReturn)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            break cutIf6;
                          }
                          cutIf10:
                          {
                            if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                              for (let l15 of YP.unify(ReturnType, Atom.a("bool"))) {
                                cutIf11:
                                {
                                  if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                                    for (let l18 in append(BodyCode, new ListPair(Atom.a("returnfalse"), Atom.NIL), BodyWithReturn)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                    break cutIf11;
                                  }
                                  cutIf12:
                                  {
                                    if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                                      for (let l19 of YP.unify(BodyWithReturn, BodyCode)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf12;
                                    }
                                    cutIf13:
                                    {
                                      if (CompilerState.codeUsesYield(State)) {
                                        for (let l20 of YP.unify(BodyWithReturn, BodyCode)) {
                                          for (let l21 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                            yield false;
                                          }
                                        }
                                        break cutIf13;
                                      }
                                      for (let l19 in append(BodyCode, new ListPair(new Functor1("blockScope", new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.fail"), Atom.NIL), new ListPair(Atom.a("yieldfalse"), Atom.NIL)), Atom.NIL)), Atom.NIL), BodyWithReturn)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              break cutIf10;
                            }
                            for (let l14 of YP.unify(ReturnType, Atom.a("IEnumerable<bool>"))) {
                              cutIf14:
                              {
                                if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                                  for (let l17 in append(BodyCode, new ListPair(Atom.a("returnfalse"), Atom.NIL), BodyWithReturn)) {
                                    for (let l18 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                      yield false;
                                    }
                                  }
                                  break cutIf14;
                                }
                                cutIf15:
                                {
                                  if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                                    for (let l18 of YP.unify(BodyWithReturn, BodyCode)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                    break cutIf15;
                                  }
                                  cutIf16:
                                  {
                                    if (CompilerState.codeUsesYield(State)) {
                                      for (let l19 of YP.unify(BodyWithReturn, BodyCode)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf16;
                                    }
                                    for (let l18 in append(BodyCode, new ListPair(new Functor1("blockScope", new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.fail"), Atom.NIL), new ListPair(Atom.a("yieldfalse"), Atom.NIL)), Atom.NIL)), Atom.NIL), BodyWithReturn)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            break cutIf2;
          }
          for (let l5 of YP.unify(Head, FirstRule)) {
            CompilerState.startFunction(State, Head);
            let findallAnswers17 = new FindallAnswers(new Functor2("f", ArgAssignments, Calls));
            for (let l6 in member(new Functor2("f", Rule, VariableNameSuggestions), SamePredicateRuleList)) {
              for (let l7 in compileBodyWithHeadBindings(Rule, VariableNameSuggestions, State, ArgAssignments, Calls)) {
                findallAnswers17.add();
              }
            }
            for (let l6 in findallAnswers17.result(ClauseBag)) {
              for (let l7 in YP.univ(Head, new ListPair(Name, ArgsList))) {
                for (let l8 in getFunctionArgNames(ArgsList, 1, FunctionArgNames)) {
                  let findallAnswers18 = new FindallAnswers(MergedArgName);
                  for (let l9 in member(ArgName, FunctionArgNames)) {
                    cutIf19:
                    {
                      for (let l11 in argAssignedAll(ArgName, ClauseBag, MergedArgName)) {
                        findallAnswers18.add();
                        break cutIf19;
                      }
                      for (let l11 of YP.unify(MergedArgName, ArgName)) {
                        findallAnswers18.add();
                      }
                    }
                  }
                  for (let l9 in findallAnswers18.result(MergedArgNames)) {
                    for (let l10 in maplist_arg(MergedArgNames, FunctionArgs)) {
                      for (let l11 in maplist_compileClause(ClauseBag, MergedArgNames, BodyCode)) {
                        cutIf20:
                        {
                          if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                            for (let l14 of YP.unify(ReturnType, Atom.a("void"))) {
                              cutIf21:
                              {
                                if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                                  for (let l17 in append(BodyCode, new ListPair(Atom.a("returnfalse"), Atom.NIL), BodyWithReturn)) {
                                    for (let l18 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                      yield false;
                                    }
                                  }
                                  break cutIf21;
                                }
                                cutIf22:
                                {
                                  if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                                    for (let l18 of YP.unify(BodyWithReturn, BodyCode)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                    break cutIf22;
                                  }
                                  cutIf23:
                                  {
                                    if (CompilerState.codeUsesYield(State)) {
                                      for (let l19 of YP.unify(BodyWithReturn, BodyCode)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf23;
                                    }
                                    for (let l18 in append(BodyCode, new ListPair(new Functor1("blockScope", new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.fail"), Atom.NIL), new ListPair(Atom.a("yieldfalse"), Atom.NIL)), Atom.NIL)), Atom.NIL), BodyWithReturn)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            break cutIf20;
                          }
                          cutIf24:
                          {
                            if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                              for (let l15 of YP.unify(ReturnType, Atom.a("bool"))) {
                                cutIf25:
                                {
                                  if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                                    for (let l18 in append(BodyCode, new ListPair(Atom.a("returnfalse"), Atom.NIL), BodyWithReturn)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                    break cutIf25;
                                  }
                                  cutIf26:
                                  {
                                    if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                                      for (let l19 of YP.unify(BodyWithReturn, BodyCode)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf26;
                                    }
                                    cutIf27:
                                    {
                                      if (CompilerState.codeUsesYield(State)) {
                                        for (let l20 of YP.unify(BodyWithReturn, BodyCode)) {
                                          for (let l21 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                            yield false;
                                          }
                                        }
                                        break cutIf27;
                                      }
                                      for (let l19 in append(BodyCode, new ListPair(new Functor1("blockScope", new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.fail"), Atom.NIL), new ListPair(Atom.a("yieldfalse"), Atom.NIL)), Atom.NIL)), Atom.NIL), BodyWithReturn)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                              break cutIf24;
                            }
                            for (let l14 of YP.unify(ReturnType, Atom.a("IEnumerable<bool>"))) {
                              cutIf28:
                              {
                                if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
                                  for (let l17 in append(BodyCode, new ListPair(Atom.a("returnfalse"), Atom.NIL), BodyWithReturn)) {
                                    for (let l18 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                      yield false;
                                    }
                                  }
                                  break cutIf28;
                                }
                                cutIf29:
                                {
                                  if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
                                    for (let l18 of YP.unify(BodyWithReturn, BodyCode)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                    break cutIf29;
                                  }
                                  cutIf30:
                                  {
                                    if (CompilerState.codeUsesYield(State)) {
                                      for (let l19 of YP.unify(BodyWithReturn, BodyCode)) {
                                        for (let l20 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf30;
                                    }
                                    for (let l18 in append(BodyCode, new ListPair(new Functor1("blockScope", new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.fail"), Atom.NIL), new ListPair(Atom.a("yieldfalse"), Atom.NIL)), Atom.NIL)), Atom.NIL), BodyWithReturn)) {
                                      for (let l19 of YP.unify(FunctionCode, new Functor("function", [ReturnType, Name, FunctionArgs, BodyWithReturn]))) {
                                        yield false;
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function *samePredicateRuleList(arg1, arg2, arg3) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        for (let l4 of YP.unify(arg3, Atom.NIL)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let First = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(First, Atom.NIL))) {
      for (let l3 of YP.unify(arg2, new ListPair(First, Atom.NIL))) {
        for (let l4 of YP.unify(arg3, Atom.NIL)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let SamePredicateRuleList = arg2;
    let RestRules = arg3;
    let First = new Variable();
    let Rest = new Variable();
    let FirstRule = new Variable();
    let x6 = new Variable();
    let SecondRule = new Variable();
    let x8 = new Variable();
    let x9 = new Variable();
    let FirstHead = new Variable();
    let x11 = new Variable();
    let SecondHead = new Variable();
    let x13 = new Variable();
    let Name = new Variable();
    let Arity = new Variable();
    let RestSamePredicates = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(First, Rest))) {
      for (let l3 of YP.unify(new Functor2("f", FirstRule, x6), First)) {
        for (let l4 of YP.unify(new ListPair(new Functor2("f", SecondRule, x8), x9), Rest)) {
          cutIf1:
          {
            for (let l6 of YP.unify(new Functor2(":-", FirstHead, x11), FirstRule)) {
              cutIf2:
              {
                for (let l8 of YP.unify(new Functor2(":-", SecondHead, x13), SecondRule)) {
                  for (let l9 in YP.functor(FirstHead, Name, Arity)) {
                    cutIf3:
                    {
                      for (let l11 in YP.functor(SecondHead, Name, Arity)) {
                        for (let l12 in samePredicateRuleList(Rest, RestSamePredicates, RestRules)) {
                          for (let l13 of YP.unify(SamePredicateRuleList, new ListPair(First, RestSamePredicates))) {
                            yield true;
                            return;
                          }
                        }
                        break cutIf3;
                      }
                      for (let l11 of YP.unify(SamePredicateRuleList, new ListPair(First, Atom.NIL))) {
                        for (let l12 of YP.unify(RestRules, Rest)) {
                          yield true;
                          return;
                        }
                      }
                    }
                  }
                  break cutIf2;
                }
                for (let l8 of YP.unify(SecondHead, SecondRule)) {
                  for (let l9 in YP.functor(FirstHead, Name, Arity)) {
                    cutIf4:
                    {
                      for (let l11 in YP.functor(SecondHead, Name, Arity)) {
                        for (let l12 in samePredicateRuleList(Rest, RestSamePredicates, RestRules)) {
                          for (let l13 of YP.unify(SamePredicateRuleList, new ListPair(First, RestSamePredicates))) {
                            yield true;
                            return;
                          }
                        }
                        break cutIf4;
                      }
                      for (let l11 of YP.unify(SamePredicateRuleList, new ListPair(First, Atom.NIL))) {
                        for (let l12 of YP.unify(RestRules, Rest)) {
                          yield true;
                          return;
                        }
                      }
                    }
                  }
                }
              }
              break cutIf1;
            }
            for (let l6 of YP.unify(FirstHead, FirstRule)) {
              cutIf5:
              {
                for (let l8 of YP.unify(new Functor2(":-", SecondHead, x13), SecondRule)) {
                  for (let l9 in YP.functor(FirstHead, Name, Arity)) {
                    cutIf6:
                    {
                      for (let l11 in YP.functor(SecondHead, Name, Arity)) {
                        for (let l12 in samePredicateRuleList(Rest, RestSamePredicates, RestRules)) {
                          for (let l13 of YP.unify(SamePredicateRuleList, new ListPair(First, RestSamePredicates))) {
                            yield true;
                            return;
                          }
                        }
                        break cutIf6;
                      }
                      for (let l11 of YP.unify(SamePredicateRuleList, new ListPair(First, Atom.NIL))) {
                        for (let l12 of YP.unify(RestRules, Rest)) {
                          yield true;
                          return;
                        }
                      }
                    }
                  }
                  break cutIf5;
                }
                for (let l8 of YP.unify(SecondHead, SecondRule)) {
                  for (let l9 in YP.functor(FirstHead, Name, Arity)) {
                    cutIf7:
                    {
                      for (let l11 in YP.functor(SecondHead, Name, Arity)) {
                        for (let l12 in samePredicateRuleList(Rest, RestSamePredicates, RestRules)) {
                          for (let l13 of YP.unify(SamePredicateRuleList, new ListPair(First, RestSamePredicates))) {
                            yield true;
                            return;
                          }
                        }
                        break cutIf7;
                      }
                      for (let l11 of YP.unify(SamePredicateRuleList, new ListPair(First, Atom.NIL))) {
                        for (let l12 of YP.unify(RestRules, Rest)) {
                          yield true;
                          return;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function *maplist_compileClause(arg1, arg2, arg3) {
  {
    let _MergedArgNames = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg3, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let MergedArgNames = arg2;
    let ArgAssignments = new Variable();
    let Calls = new Variable();
    let Rest = new Variable();
    let ClauseCode = new Variable();
    let RestResults = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", ArgAssignments, Calls), Rest))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor1("blockScope", ClauseCode), RestResults))) {
        for (let l4 in prependArgAssignments(ArgAssignments, Calls, MergedArgNames, ClauseCode)) {
          for (let l5 in maplist_compileClause(Rest, MergedArgNames, RestResults)) {
            yield true;
            return;
          }
        }
      }
    }
  }
}

function *prependArgAssignments(arg1, arg2, arg3, arg4) {
  {
    let _MergedArgNames = arg3;
    let In = new Variable();
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, In)) {
        for (let l4 of YP.unify(arg4, In)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let In = arg2;
    let MergedArgNames = arg3;
    let ClauseCode = arg4;
    let VariableName = new Variable();
    let ArgName = new Variable();
    let RestArgAssignments = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("f", VariableName, ArgName), RestArgAssignments))) {
      cutIf1:
      {
        for (let l4 in member(VariableName, MergedArgNames)) {
          for (let l5 in prependArgAssignments(RestArgAssignments, In, MergedArgNames, ClauseCode)) {
            yield true;
            return;
          }
          break cutIf1;
        }
        for (let l4 in prependArgAssignments(RestArgAssignments, new ListPair(new Functor3("declare", Atom.a("object"), VariableName, new Functor1("var", ArgName)), In), MergedArgNames, ClauseCode)) {
          yield true;
          return;
        }
      }
    }
  }
}

function *argAssignedAll(arg1, arg2, VariableName) {
  {
    let _ArgName = arg1;
    for (let l2 of YP.unify(arg2, Atom.NIL)) {
      if (YP.nonvar(VariableName)) {
        yield true;
        return;
      }
    }
  }
  {
    let ArgName = arg1;
    let ArgAssignments = new Variable();
    let _Calls = new Variable();
    let RestClauseBag = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(new Functor2("f", ArgAssignments, _Calls), RestClauseBag))) {
      for (let l3 in member(new Functor2("f", VariableName, ArgName), ArgAssignments)) {
        for (let l4 in argAssignedAll(ArgName, RestClauseBag, VariableName)) {
          yield false;
        }
      }
    }
  }
}

function *maplist_arg(arg1, arg2) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let First = new Variable();
    let Rest = new Variable();
    let RestResults = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(First, Rest))) {
      for (let l3 of YP.unify(arg2, new ListPair(new Functor1("arg", First), RestResults))) {
        for (let l4 in maplist_arg(Rest, RestResults)) {
          yield true;
          return;
        }
      }
    }
  }
}

function *getFunctionArgNames(arg1, arg2, arg3) {
  {
    let _StartArgNumber = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg3, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let StartArgNumber = arg2;
    let x1 = new Variable();
    let Rest = new Variable();
    let ArgName = new Variable();
    let RestFunctionArgs = new Variable();
    let NumberCodes = new Variable();
    let NumberAtom = new Variable();
    let NextArgNumber = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(x1, Rest))) {
      for (let l3 of YP.unify(arg3, new ListPair(ArgName, RestFunctionArgs))) {
        for (let l4 in YP.number_codes(StartArgNumber, NumberCodes)) {
          for (let l5 in YP.atom_codes(NumberAtom, NumberCodes)) {
            for (let l6 in YP.atom_concat(Atom.a("arg"), NumberAtom, ArgName)) {
              for (let l7 of YP.unify(NextArgNumber, YP.add(StartArgNumber, 1))) {
                for (let l8 in getFunctionArgNames(Rest, NextArgNumber, RestFunctionArgs)) {
                  yield true;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
}

function *compileBodyWithHeadBindings(Rule, VariableNameSuggestions, State, ArgAssignments, Calls) {
  {
    let Head = new Variable();
    let Body = new Variable();
    let x8 = new Variable();
    let HeadArgs = new Variable();
    let CompiledHeadArgs = new Variable();
    let BodyCode = new Variable();
    let VariableNamesList = new Variable();
    let ArgUnifications = new Variable();
    for (let l2 of YP.unify(new Functor2(":-", Head, Body), Rule)) {
      CompilerState.newVariableNames(State, Rule, VariableNameSuggestions);
      for (let l3 in YP.univ(Head, new ListPair(x8, HeadArgs))) {
        for (let l4 in maplist_compileTerm(HeadArgs, State, CompiledHeadArgs)) {
          for (let l5 in compileRuleBody(Body, State, BodyCode)) {
            for (let l6 in CompilerState.variableNamesList(State, VariableNamesList)) {
              for (let l7 in compileArgUnifications(HeadArgs, CompiledHeadArgs, 1, HeadArgs, BodyCode, ArgUnifications)) {
                for (let l8 in compileDeclarations(VariableNamesList, HeadArgs, Atom.NIL, ArgAssignments, ArgUnifications, Calls)) {
                  yield true;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
  {
    for (let l2 in compileBodyWithHeadBindings(new Functor2(":-", Rule, Atom.a("true")), VariableNameSuggestions, State, ArgAssignments, Calls)) {
      yield true;
      return;
    }
  }
}

function *compileArgUnifications(arg1, arg2, arg3, arg4, arg5, arg6) {
  {
    let x1 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let BodyCode = new Variable();
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg5, BodyCode)) {
        for (let l4 of YP.unify(arg6, BodyCode)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let Index = arg3;
    let AllHeadArgs = arg4;
    let BodyCode = arg5;
    let ArgUnifications = arg6;
    let HeadArg = new Variable();
    let RestHeadArgs = new Variable();
    let x3 = new Variable();
    let RestCompiledHeadArgs = new Variable();
    let _ArgIndex1 = new Variable();
    let NextIndex = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(HeadArg, RestHeadArgs))) {
      for (let l3 of YP.unify(arg2, new ListPair(x3, RestCompiledHeadArgs))) {
        for (let l4 in getVariableArgIndex1(HeadArg, AllHeadArgs, _ArgIndex1)) {
          for (let l5 of YP.unify(NextIndex, YP.add(Index, 1))) {
            for (let l6 in compileArgUnifications(RestHeadArgs, RestCompiledHeadArgs, NextIndex, AllHeadArgs, BodyCode, ArgUnifications)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    let Index = arg3;
    let AllHeadArgs = arg4;
    let BodyCode = arg5;
    let _HeadArg = new Variable();
    let RestHeadArgs = new Variable();
    let CompiledHeadArg = new Variable();
    let RestCompiledHeadArgs = new Variable();
    let ArgName = new Variable();
    let RestArgUnifications = new Variable();
    let NumberCodes = new Variable();
    let NumberAtom = new Variable();
    let NextIndex = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(_HeadArg, RestHeadArgs))) {
      for (let l3 of YP.unify(arg2, new ListPair(CompiledHeadArg, RestCompiledHeadArgs))) {
        for (let l4 of YP.unify(arg6, new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.unify"), new ListPair(new Functor1("var", ArgName), new ListPair(CompiledHeadArg, Atom.NIL))), RestArgUnifications), Atom.NIL))) {
          for (let l5 in YP.number_codes(Index, NumberCodes)) {
            for (let l6 in YP.atom_codes(NumberAtom, NumberCodes)) {
              for (let l7 in YP.atom_concat(Atom.a("arg"), NumberAtom, ArgName)) {
                for (let l8 of YP.unify(NextIndex, YP.add(Index, 1))) {
                  for (let l9 in compileArgUnifications(RestHeadArgs, RestCompiledHeadArgs, NextIndex, AllHeadArgs, BodyCode, RestArgUnifications)) {
                    yield true;
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function *compileDeclarations(arg1, arg2, arg3, arg4, arg5, arg6) {
  {
    let _HeadArgs = arg2;
    let ArgAssignmentsIn = new Variable();
    let DeclarationsIn = new Variable();
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg3, ArgAssignmentsIn)) {
        for (let l4 of YP.unify(arg4, ArgAssignmentsIn)) {
          for (let l5 of YP.unify(arg5, DeclarationsIn)) {
            for (let l6 of YP.unify(arg6, DeclarationsIn)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    let HeadArgs = arg2;
    let ArgAssignmentsIn = arg3;
    let ArgAssignmentsOut = arg4;
    let DeclarationsIn = arg5;
    let DeclarationsOut = arg6;
    let VariableName = new Variable();
    let Var = new Variable();
    let RestVariableNames = new Variable();
    let ArgIndex1 = new Variable();
    let NumberCodes = new Variable();
    let NumberAtom = new Variable();
    let ArgName = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("=", VariableName, Var), RestVariableNames))) {
      for (let l3 in getVariableArgIndex1(Var, HeadArgs, ArgIndex1)) {
        for (let l4 in YP.number_codes(ArgIndex1, NumberCodes)) {
          for (let l5 in YP.atom_codes(NumberAtom, NumberCodes)) {
            for (let l6 in YP.atom_concat(Atom.a("arg"), NumberAtom, ArgName)) {
              for (let l7 in compileDeclarations(RestVariableNames, HeadArgs, new ListPair(new Functor2("f", VariableName, ArgName), ArgAssignmentsIn), ArgAssignmentsOut, DeclarationsIn, DeclarationsOut)) {
                yield true;
                return;
              }
            }
          }
        }
      }
    }
  }
  {
    let HeadArgs = arg2;
    let ArgAssignmentsIn = arg3;
    let ArgAssignmentsOut = arg4;
    let DeclarationsIn = arg5;
    let VariableName = new Variable();
    let _Var = new Variable();
    let RestVariableNames = new Variable();
    let DeclarationsOut = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("=", VariableName, _Var), RestVariableNames))) {
      for (let l3 of YP.unify(arg6, new ListPair(new Functor3("declare", Atom.a("Variable"), VariableName, new Functor2("new", Atom.a("Variable"), Atom.NIL)), DeclarationsOut))) {
        for (let l4 in compileDeclarations(RestVariableNames, HeadArgs, ArgAssignmentsIn, ArgAssignmentsOut, DeclarationsIn, DeclarationsOut)) {
          yield true;
          return;
        }
      }
    }
  }
}

function *getVariableArgIndex1(Var, arg2, arg3) {
  {
    let FirstHeadArgs = new Variable();
    let RestHeadArgs = new Variable();
    let x4 = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(FirstHeadArgs, RestHeadArgs))) {
      for (let l3 of YP.unify(arg3, 1)) {
        if (sameVariable(Var, FirstHeadArgs)) {
          cutIf1:
          {
            for (let l6 in getVariableArgIndex1(Var, RestHeadArgs, x4)) {
              break cutIf1;
            }
            yield false;
          }
          return;
        }
      }
    }
  }
  {
    let Index = arg3;
    let x2 = new Variable();
    let RestHeadArgs = new Variable();
    let RestIndex = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(x2, RestHeadArgs))) {
      for (let l3 in getVariableArgIndex1(Var, RestHeadArgs, RestIndex)) {
        for (let l4 of YP.unify(Index, YP.add(1, RestIndex))) {
          yield true;
          return;
        }
      }
    }
  }
}

function *compileRuleBody(arg1, arg2, arg3) {
  {
    let A = arg1;
    let State = arg2;
    let PseudoCode = arg3;
    if (YP.var(A)) {
      for (let l3 of compileRuleBody(new Functor2(",", new Functor1("call", A), Atom.a("true")), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", A, B))) {
      if (YP.var(A)) {
        for (let l4 of compileRuleBody(new Functor2(",", new Functor1("call", A), B), State, PseudoCode)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    let ACode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", A, B))) {
      for (let l3 in compileFunctorCall(A, State, ACode)) {
        if (CompilerState.isDetNoneOut(State, A)) {
          for (let l5 in compileRuleBody(B, State, BCode)) {
            for (let l6 of YP.unify(PseudoCode, new ListPair(ACode, BCode))) {
              yield true;
              return;
            }
          }
        }
        if (CompilerState.isSemidetNoneOut(State, A)) {
          for (let l5 in compileRuleBody(B, State, BCode)) {
            for (let l6 of YP.unify(PseudoCode, new ListPair(new Functor2("if", ACode, BCode), Atom.NIL))) {
              yield true;
              return;
            }
          }
        }
        for (let l4 in compileRuleBody(B, State, BCode)) {
          for (let l5 of YP.unify(PseudoCode, new ListPair(new Functor2("foreach", ACode, BCode), Atom.NIL))) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let T = new Variable();
    let B = new Variable();
    let C = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor2(";", new Functor2("->", A, T), B), C))) {
      for (let l3 in compileRuleBody(new Functor2(";", new Functor2("->", A, new Functor2(",", T, C)), new Functor2(",", B, C)), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    let C = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor2(";", A, B), C))) {
      for (let l3 in compileRuleBody(new Functor2(";", new Functor2(",", A, C), new Functor2(",", B, C)), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let B = new Variable();
    let ACode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("\\+", A), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("if", new Functor1("not", ACode), BCode), Atom.NIL))) {
        if (CompilerState.isSemidetNoneOut(State, A)) {
          for (let l5 in compileFunctorCall(A, State, ACode)) {
            for (let l6 in compileRuleBody(B, State, BCode)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("\\+", A), B))) {
      for (let l3 in compileRuleBody(new Functor2(",", new Functor2(";", new Functor2("->", A, Atom.a("fail")), Atom.a("true")), B), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("once", A), B))) {
      for (let l3 in compileRuleBody(new Functor2(",", new Functor2(";", new Functor2("->", A, Atom.a("true")), Atom.a("fail")), B), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let T = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor2("->", A, T), B))) {
      for (let l3 in compileRuleBody(new Functor2(",", new Functor2(";", new Functor2("->", A, T), Atom.a("fail")), B), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    let C = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor2("\\=", A, B), C))) {
      for (let l3 in compileRuleBody(new Functor2(",", new Functor1("\\+", new Functor2("=", A, B)), C), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let ACode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", Atom.a("!"), A))) {
      for (let l3 in compileRuleBody(A, State, ACode)) {
        for (let l4 in append(ACode, new ListPair(Atom.a("yieldbreak"), Atom.NIL), PseudoCode)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let Name = new Variable();
    let A = new Variable();
    let ACode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("$CUTIF", Name), A))) {
      for (let l3 in compileRuleBody(A, State, ACode)) {
        for (let l4 in append(ACode, new ListPair(new Functor1("breakBlock", Name), Atom.NIL), PseudoCode)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let _State = arg2;
    let x1 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", Atom.a("fail"), x1))) {
      for (let l3 of YP.unify(arg3, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", Atom.a("true"), A))) {
      for (let l3 in compileRuleBody(A, State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let Term = new Variable();
    let B = new Variable();
    let ACode = new Variable();
    let TermCode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor2("is", A, Term), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.unify"), new ListPair(ACode, new ListPair(TermCode, Atom.NIL))), BCode), Atom.NIL))) {
        for (let l4 in compileTerm(A, State, ACode)) {
          for (let l5 in compileExpression(Term, State, TermCode)) {
            for (let l6 in compileRuleBody(B, State, BCode)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let ACode = new Variable();
    let B = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("$DET_NONE_OUT", ACode), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(ACode, BCode))) {
        for (let l4 in compileRuleBody(B, State, BCode)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let B = new Variable();
    let FunctionName = new Variable();
    let X1Code = new Variable();
    let X2Code = new Variable();
    let BCode = new Variable();
    let Name = new Variable();
    let X1 = new Variable();
    let X2 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", A, B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("if", new Functor2("call", FunctionName, new ListPair(X1Code, new ListPair(X2Code, Atom.NIL))), BCode), Atom.NIL))) {
        for (let l4 in YP.univ(A, ListPair.make([Name, X1, X2]))) {
          for (let l5 in binaryExpressionConditional(Name, FunctionName)) {
            for (let l6 in compileExpression(X1, State, X1Code)) {
              for (let l7 in compileExpression(X2, State, X2Code)) {
                for (let l8 in compileRuleBody(B, State, BCode)) {
                  yield true;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let Template = new Variable();
    let Goal = new Variable();
    let Bag = new Variable();
    let B = new Variable();
    let TemplateCode = new Variable();
    let FindallAnswers = new Variable();
    let GoalAndAddCode = new Variable();
    let BagCode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor3("findall", Template, Goal, Bag), B))) {
      for (let l3 in compileTerm(Template, State, TemplateCode)) {
        for (let l4 in CompilerState.gensym(State, Atom.a("findallAnswers"), FindallAnswers)) {
          for (let l5 in compileRuleBody(new Functor2(",", Goal, new Functor2(",", new Functor1("$DET_NONE_OUT", new Functor3("callMember", new Functor1("var", FindallAnswers), Atom.a("add"), Atom.NIL)), Atom.a("fail"))), State, GoalAndAddCode)) {
            for (let l6 in compileTerm(Bag, State, BagCode)) {
              for (let l7 in compileRuleBody(B, State, BCode)) {
                for (let l8 in append(new ListPair(new Functor3("declare", Atom.a("FindallAnswers"), FindallAnswers, new Functor2("new", Atom.a("FindallAnswers"), new ListPair(TemplateCode, Atom.NIL))), GoalAndAddCode), new ListPair(new Functor2("foreach", new Functor3("callMember", new Functor1("var", FindallAnswers), Atom.a("result"), new ListPair(BagCode, Atom.NIL)), BCode), Atom.NIL), PseudoCode)) {
                  yield true;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let Template = new Variable();
    let Goal = new Variable();
    let Bag = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor3("bagof", Template, Goal, Bag), B))) {
      for (let l3 in compileBagof(Atom.a("result"), Template, Goal, Bag, B, State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let Template = new Variable();
    let Goal = new Variable();
    let Bag = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor3("setof", Template, Goal, Bag), B))) {
      for (let l3 in compileBagof(Atom.a("resultSet"), Template, Goal, Bag, B, State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let B = new Variable();
    let ATermCode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("call", A), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.getIterator"), new ListPair(ATermCode, new ListPair(new Functor2("call", Atom.a("getDeclaringClass"), Atom.NIL), Atom.NIL))), BCode), Atom.NIL))) {
        for (let l4 in compileTerm(A, State, ATermCode)) {
          for (let l5 in compileRuleBody(B, State, BCode)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let B = new Variable();
    let ATermCode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("current_predicate", A), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("foreach", new Functor2("call", Atom.a("YP.current_predicate"), new ListPair(ATermCode, new ListPair(new Functor2("call", Atom.a("getDeclaringClass"), Atom.NIL), Atom.NIL))), BCode), Atom.NIL))) {
        for (let l4 in compileTerm(A, State, ATermCode)) {
          for (let l5 in compileRuleBody(B, State, BCode)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let B = new Variable();
    let ATermCode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("asserta", A), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("call", Atom.a("YP.asserta"), new ListPair(ATermCode, new ListPair(new Functor2("call", Atom.a("getDeclaringClass"), Atom.NIL), Atom.NIL))), BCode))) {
        for (let l4 in compileTerm(A, State, ATermCode)) {
          for (let l5 in compileRuleBody(B, State, BCode)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let B = new Variable();
    let ATermCode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("assertz", A), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("call", Atom.a("YP.assertz"), new ListPair(ATermCode, new ListPair(new Functor2("call", Atom.a("getDeclaringClass"), Atom.NIL), Atom.NIL))), BCode))) {
        for (let l4 in compileTerm(A, State, ATermCode)) {
          for (let l5 in compileRuleBody(B, State, BCode)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor1("assert", A), B))) {
      for (let l3 in compileRuleBody(new Functor2(",", new Functor1("assertz", A), B), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let Goal = new Variable();
    let Catcher = new Variable();
    let Handler = new Variable();
    let B = new Variable();
    let CatchGoal = new Variable();
    let GoalTermCode = new Variable();
    let BCode = new Variable();
    let CatcherTermCode = new Variable();
    let HandlerAndBCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor3("catch", Goal, Catcher, Handler), B))) {
      for (let l3 of YP.unify(arg3, ListPair.make([new Functor3("declare", Atom.a("Catch"), CatchGoal, new Functor2("new", Atom.a("Catch"), new ListPair(GoalTermCode, new ListPair(new Functor2("call", Atom.a("getDeclaringClass"), Atom.NIL), Atom.NIL)))), new Functor2("foreach", new Functor1("var", CatchGoal), BCode), new Functor2("foreach", new Functor3("callMember", new Functor1("var", CatchGoal), Atom.a("unifyExceptionOrThrow"), new ListPair(CatcherTermCode, Atom.NIL)), HandlerAndBCode)]))) {
        for (let l4 of CompilerState.gensym(State, Atom.a("catchGoal"), CatchGoal)) {
          for (let l5 of compileTerm(Goal, State, GoalTermCode)) {
            for (let l6 of compileTerm(Catcher, State, CatcherTermCode)) {
              for (let l7 of compileRuleBody(B, State, BCode)) {
                for (let l8 of compileRuleBody(new Functor2(",", Handler, B), State, HandlerAndBCode)) {
                  yield true;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    let C = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", new Functor2(",", A, B), C))) {
      for (let l3 in compileRuleBody(new Functor2(",", A, new Functor2(",", B, C)), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(";", A, B))) {
      if (YP.var(A)) {
        for (let l4 in compileRuleBody(new Functor2(";", new Functor1("call", A), B), State, PseudoCode)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    let A = new Variable();
    let T = new Variable();
    let B = new Variable();
    let CutIfLabel = new Variable();
    let Code = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(";", new Functor2("->", A, T), B))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("breakableBlock", CutIfLabel, Code), Atom.NIL))) {
        for (let l4 in CompilerState.gensym(State, Atom.a("cutIf"), CutIfLabel)) {
          for (let l5 in compileRuleBody(new Functor2(";", new Functor2(",", A, new Functor2(",", new Functor1("$CUTIF", CutIfLabel), T)), B), State, Code)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let _B = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(";", Atom.a("!"), _B))) {
      for (let l3 in compileRuleBody(Atom.a("!"), State, PseudoCode)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let PseudoCode = arg3;
    let A = new Variable();
    let B = new Variable();
    let ACode = new Variable();
    let BCode = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(";", A, B))) {
      for (let l3 in compileRuleBody(A, State, ACode)) {
        for (let l4 in compileRuleBody(B, State, BCode)) {
          for (let l5 in append(ACode, BCode, PseudoCode)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let State = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("!"))) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("return"), Atom.NIL))) {
        if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("!"))) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("returntrue"), Atom.NIL))) {
        if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("!"))) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("yieldtrue"), new ListPair(Atom.a("yieldbreak"), Atom.NIL)))) {
        CompilerState.setCodeUsesYield(State);
        yield true;
        return;
      }
    }
  }
  {
    let _State = arg2;
    let Name = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("$CUTIF", Name))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor1("breakBlock", Name), Atom.NIL))) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("true"))) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("return"), Atom.NIL))) {
        if (CompilerState.determinismEquals(State, Atom.a("detNoneOut"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("true"))) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("returntrue"), Atom.NIL))) {
        if (CompilerState.determinismEquals(State, Atom.a("semidetNoneOut"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("true"))) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("yieldfalse"), Atom.NIL))) {
        CompilerState.setCodeUsesYield(State);
        yield true;
        return;
      }
    }
  }
  {
    let A = arg1;
    let State = arg2;
    let PseudoCode = arg3;
    for (let l2 in compileRuleBody(new Functor2(",", A, Atom.a("true")), State, PseudoCode)) {
      yield true;
      return;
    }
  }
}

function *compileBagof(ResultMethod, Template, Goal, Bag, B, State, PseudoCode) {
  {
    let TemplateCode = new Variable();
    let GoalTermCode = new Variable();
    let UnqualifiedGoal = new Variable();
    let BagofAnswers = new Variable();
    let GoalAndAddCode = new Variable();
    let BagCode = new Variable();
    let BCode = new Variable();
    for (let l2 in compileTerm(Template, State, TemplateCode)) {
      for (let l3 in compileTerm(Goal, State, GoalTermCode)) {
        for (let l4 in unqualifiedGoal(Goal, UnqualifiedGoal)) {
          for (let l5 in CompilerState.gensym(State, Atom.a("bagofAnswers"), BagofAnswers)) {
            for (let l6 in compileRuleBody(new Functor2(",", UnqualifiedGoal, new Functor2(",", new Functor1("$DET_NONE_OUT", new Functor3("callMember", new Functor1("var", BagofAnswers), Atom.a("add"), Atom.NIL)), Atom.a("fail"))), State, GoalAndAddCode)) {
              for (let l7 in compileTerm(Bag, State, BagCode)) {
                for (let l8 in compileRuleBody(B, State, BCode)) {
                  for (let l9 in append(new ListPair(new Functor3("declare", Atom.a("BagofAnswers"), BagofAnswers, new Functor2("new", Atom.a("BagofAnswers"), new ListPair(TemplateCode, new ListPair(GoalTermCode, Atom.NIL)))), GoalAndAddCode), new ListPair(new Functor2("foreach", new Functor3("callMember", new Functor1("var", BagofAnswers), ResultMethod, new ListPair(BagCode, Atom.NIL)), BCode), Atom.NIL), PseudoCode)) {
                    yield true;
                    return;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function *unqualifiedGoal(arg1, arg2) {
  {
    let Goal = arg1;
    for (let l2 of YP.unify(arg2, new Functor1("call", Goal))) {
      if (YP.var(Goal)) {
        yield true;
        return;
      }
    }
  }
  {
    let UnqualifiedGoal = arg2;
    let x1 = new Variable();
    let Goal = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("^", x1, Goal))) {
      for (let l3 in unqualifiedGoal(Goal, UnqualifiedGoal)) {
        yield true;
        return;
      }
    }
  }
  {
    let UnqualifiedGoal = new Variable();
    for (let l2 of YP.unify(arg1, UnqualifiedGoal)) {
      for (let l3 of YP.unify(arg2, UnqualifiedGoal)) {
        yield true;
        return;
      }
    }
  }
}

function *binaryExpressionConditional(arg1, arg2) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("=:="))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.equal"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("=\\="))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.notEqual"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a(">"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.greaterThan"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("<"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.lessThan"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a(">="))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.greaterThanOrEqual"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("=<"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.lessThanOrEqual"))) {
        yield true;
        return;
      }
    }
  }
}

function *compileFunctorCall(Functor_1, State, PseudoCode) {
  {
    let FunctorName = new Variable();
    let FunctorArgs = new Variable();
    let x6 = new Variable();
    let Arity = new Variable();
    let FunctionName = new Variable();
    let CompiledArgs = new Variable();
    for (let l2 of YP.univ(Functor_1, new ListPair(FunctorName, FunctorArgs))) {
      for (let l3 of YP.functor(Functor_1, x6, Arity)) {
        for (let l4 of functorCallFunctionName(State, FunctorName, Arity, FunctionName)) {
          for (let l5 of maplist_compileTerm(FunctorArgs, State, CompiledArgs)) {
            cutIf1:
            {
              if (YP.termEqual(FunctionName, Atom.NIL)) {
                for (let l8 of YP.unify(PseudoCode, new Functor2("call", Atom.a("YP.matchDynamic"), new ListPair(new Functor2("call", Atom.a("Atom.a"), new ListPair(new Functor1("object", FunctorName), Atom.NIL)), new ListPair(new Functor1("objectArray", CompiledArgs), Atom.NIL))))) {
                  yield true;
                  return;
                }
                break cutIf1;
              }
              for (let l7 of YP.unify(PseudoCode, new Functor3("functorCall", FunctionName, FunctorArgs, CompiledArgs))) {
                yield true;
                return;
              }
            }
          }
        }
      }
    }
  }
}

function *functorCallFunctionName(arg1: CompilerState, arg2, arg3, arg4) {
  {
    let _State = arg1;
    let Name = arg2;
    let Arity = arg3;
    let x4 = arg4;
    if (functorCallIsSpecialForm(Name, Arity)) {
      return;
    }
  }
  {
    let x1 = arg1;
    let Name = arg2;
    let Arity = arg3;
    let FunctionName = arg4;
    for (let l2 in functorCallYPFunctionName(Name, Arity, FunctionName)) {
      yield true;
      return;
    }
  }
  {
    let State = arg1;
    let Arity = arg3;
    let Name = new Variable();
    for (let l2 of YP.unify(arg2, Name)) {
      for (let l3 of YP.unify(arg4, Name)) {
        if (CompilerState.nameArityHasModule(State, Name, Arity, Atom.a(""))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let _State = arg1;
    let _Arity = arg3;
    let Name = new Variable();
    for (let l2 of YP.unify(arg2, Name)) {
      for (let l3 of YP.unify(arg4, Name)) {
        for (let l4 in Atom.module(Name, Atom.a(""))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let _State = arg1;
    let Name = arg2;
    let _Arity = arg3;
    for (let l2 of YP.unify(arg4, Atom.NIL)) {
      for (let l3 in Atom.module(Name, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let _State = arg1;
    let Name = arg2;
    let Arity = arg3;
    let x4 = arg4;
    let Module = new Variable();
    let Message = new Variable();
    for (let l2 in Atom.module(Name, Module)) {
      for (let l3 in YP.atom_concat(Atom.a("Not supporting calls to external module: "), Module, Message)) {
        YP.throwException(new Functor2("error", new Functor2("type_error", Atom.a("callable"), new Functor2("/", Name, Arity)), Message));
        yield true;
        return;
      }
    }
  }
  {
    let _State = arg1;
    let Name = arg2;
    let _Arity = arg3;
    let x4 = arg4;
    YP.throwException(new Functor2("error", new Functor2("type_error", Atom.a("callable"), Name), Atom.a("Term is not callable")));
    yield true;
    return;
  }
}

function functorCallIsSpecialForm(Name, Arity) {
  {
    let x3 = new Variable();
    if (YP.termEqual(Arity, 0)) {
      if (YP.termEqual(Name, Atom.a("!"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("fail"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("true"))) {
        return true;
      }
    }
    if (YP.termEqual(Arity, 1)) {
      if (YP.termEqual(Name, Atom.a("\\+"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("once"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("$CUTIF"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("$DET_NONE_OUT"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("call"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("current_predicate"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("asserta"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("assertz"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("assert"))) {
        return true;
      }
    }
    if (YP.termEqual(Arity, 2)) {
      if (YP.termEqual(Name, Atom.a(";"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a(","))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("->"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("\\="))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("is"))) {
        return true;
      }
      for (let l3 in binaryExpressionConditional(Name, x3)) {
        return true;
      }
    }
    if (YP.termEqual(Arity, 3)) {
      if (YP.termEqual(Name, Atom.a("findall"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("bagof"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("setof"))) {
        return true;
      }
      if (YP.termEqual(Name, Atom.a("catch"))) {
        return true;
      }
    }
  }
  return false;
}

export function *functorCallYPFunctionName(arg1, arg2, arg3) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("="))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.unify"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("=.."))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.univ"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("var"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.var"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("nonvar"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.nonvar"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("arg"))) {
      for (let l3 of YP.unify(arg2, 3)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.arg"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("functor"))) {
      for (let l3 of YP.unify(arg2, 3)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.functor"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("repeat"))) {
      for (let l3 of YP.unify(arg2, 0)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.repeat"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("get_code"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.get_code"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("current_op"))) {
      for (let l3 of YP.unify(arg2, 3)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.current_op"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atom_length"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.atom_length"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atom_concat"))) {
      for (let l3 of YP.unify(arg2, 3)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.atom_concat"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("sub_atom"))) {
      for (let l3 of YP.unify(arg2, 5)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.sub_atom"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atom_chars"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.atom_chars"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atom_codes"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.atom_codes"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("char_code"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.char_code"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("number_chars"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.number_chars"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("number_codes"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.number_codes"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("copy_term"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.copy_term"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("sort"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.sort"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("nl"))) {
      for (let l3 of YP.unify(arg2, 0)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.nl"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("write"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.write"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("put_code"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.put_code"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("see"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.see"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("seen"))) {
      for (let l3 of YP.unify(arg2, 0)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.seen"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("tell"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.tell"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("told"))) {
      for (let l3 of YP.unify(arg2, 0)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.told"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("clause"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.clause"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("retract"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.retract"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("abolish"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.abolish"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("retractall"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.retractall"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atom"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.atom"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("integer"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.integer"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("float"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.isFloat"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("number"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.number"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atomic"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.atomic"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("compound"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.compound"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("ground"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.ground"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("=="))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.termEqual"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("\\=="))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.termNotEqual"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("@<"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.termLessThan"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("@=<"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.termLessThanOrEqual"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("@>"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.termGreaterThan"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("@>="))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.termGreaterThanOrEqual"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("throw"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.throwException"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("current_prolog_flag"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.current_prolog_flag"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("set_prolog_flag"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.set_prolog_flag"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("current_input"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.current_input"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("current_output"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("YP.current_output"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("read_term"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("Parser.read_term2"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("read_term"))) {
      for (let l3 of YP.unify(arg2, 3)) {
        for (let l4 of YP.unify(arg3, Atom.a("Parser.read_term3"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("read"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        for (let l4 of YP.unify(arg3, Atom.a("Parser.read1"))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("read"))) {
      for (let l3 of YP.unify(arg2, 2)) {
        for (let l4 of YP.unify(arg3, Atom.a("Parser.read2"))) {
          yield true;
          return;
        }
      }
    }
  }
}

function *compileTerm(arg1: Variable, arg2, arg3: Variable) {
  {
    let Term = arg1;
    let State = arg2;
    let VariableName = new Variable();
    for (let l2 of YP.unify(arg3, new Functor1("var", VariableName))) {
      if (YP.var(Term)) {
        for (let l4 of CompilerState.getVariableName(State, Term, VariableName)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let _State = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg3, new Functor1("var", Atom.a("Atom.NIL")))) {
        yield true;
        return;
      }
    }
  }
  {
    let Term = arg1;
    let State = arg2;
    let Code = arg3;
    let ModuleCode = new Variable();
    if (YP.atom(Term)) {
      cutIf1:
      {
        for (let l4 in compileAtomModule(Term, 0, State, ModuleCode)) {
          for (let l5 of YP.unify(Code, new Functor2("call", Atom.a("Atom.a"), new ListPair(new Functor1("object", Term), new ListPair(ModuleCode, Atom.NIL))))) {
            yield true;
            return;
          }
          break cutIf1;
        }
        for (let l4 of YP.unify(Code, new Functor2("call", Atom.a("Atom.a"), new ListPair(new Functor1("object", Term), Atom.NIL)))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let State = arg2;
    let First = new Variable();
    let Rest = new Variable();
    let CompiledList = new Variable();
    let x5 = new Variable();
    let Rest2 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(First, Rest))) {
      for (let l3 of YP.unify(arg3, new Functor2("call", Atom.a("ListPair.make"), new ListPair(new Functor1("objectArray", CompiledList), Atom.NIL)))) {
        if (YP.nonvar(Rest)) {
          for (let l5 of YP.unify(Rest, new ListPair(x5, Rest2))) {
            if (YP.termNotEqual(Rest2, Atom.NIL)) {
              for (let l7 in maplist_compileTerm(new ListPair(First, Rest), State, CompiledList)) {
                yield true;
                return;
              }
            }
          }
        }
      }
    }
  }
  {
    let State = arg2;
    let First = new Variable();
    let Rest = new Variable();
    let Arg1 = new Variable();
    let Arg2 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(First, Rest))) {
      for (let l3 of YP.unify(arg3, new Functor2("new", Atom.a("ListPair"), new ListPair(Arg1, new ListPair(Arg2, Atom.NIL))))) {
        for (let l4 in compileTerm(First, State, Arg1)) {
          for (let l5 in compileTerm(Rest, State, Arg2)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let Term = arg1;
    let State = arg2;
    let Result = arg3;
    let Name = new Variable();
    let TermArgs = new Variable();
    let x6 = new Variable();
    let Arity = new Variable();
    let ModuleCode = new Variable();
    let NameCode = new Variable();
    let X1 = new Variable();
    let Arg1 = new Variable();
    let X2 = new Variable();
    let Arg2 = new Variable();
    let X3 = new Variable();
    let Arg3 = new Variable();
    let Args = new Variable();
    for (let l2 in YP.univ(Term, new ListPair(Name, TermArgs))) {
      cutIf2:
      {
        if (YP.termEqual(TermArgs, Atom.NIL)) {
          for (let l5 of YP.unify(Result, new Functor1("object", Name))) {
            yield true;
            return;
          }
          break cutIf2;
        }
        for (let l4 in YP.functor(Term, x6, Arity)) {
          cutIf3:
          {
            for (let l6 in compileAtomModule(Name, Arity, State, ModuleCode)) {
              for (let l7 of YP.unify(NameCode, new Functor2("call", Atom.a("Atom.a"), new ListPair(new Functor1("object", Name), new ListPair(ModuleCode, Atom.NIL))))) {
                cutIf4:
                {
                  for (let l9 of YP.unify(TermArgs, new ListPair(X1, Atom.NIL))) {
                    for (let l10 in compileTerm(X1, State, Arg1)) {
                      for (let l11 of YP.unify(Result, new Functor2("new", Atom.a("Functor1"), new ListPair(NameCode, new ListPair(Arg1, Atom.NIL))))) {
                        yield true;
                        return;
                      }
                    }
                    break cutIf4;
                  }
                  cutIf5:
                  {
                    for (let l10 of YP.unify(TermArgs, new ListPair(X1, new ListPair(X2, Atom.NIL)))) {
                      for (let l11 in compileTerm(X1, State, Arg1)) {
                        for (let l12 in compileTerm(X2, State, Arg2)) {
                          for (let l13 of YP.unify(Result, new Functor2("new", Atom.a("Functor2"), ListPair.make([NameCode, Arg1, Arg2])))) {
                            yield true;
                            return;
                          }
                        }
                      }
                      break cutIf5;
                    }
                    for (let l10 of YP.unify(TermArgs, ListPair.make([X1, X2, X3]))) {
                      for (let l11 in compileTerm(X1, State, Arg1)) {
                        for (let l12 in compileTerm(X2, State, Arg2)) {
                          for (let l13 in compileTerm(X3, State, Arg3)) {
                            for (let l14 of YP.unify(Result, new Functor2("new", Atom.a("Functor3"), ListPair.make([NameCode, Arg1, Arg2, Arg3])))) {
                              yield true;
                              return;
                            }
                          }
                        }
                      }
                    }
                    for (let l10 in maplist_compileTerm(TermArgs, State, Args)) {
                      for (let l11 of YP.unify(Result, new Functor2("new", Atom.a("Functor"), new ListPair(NameCode, new ListPair(new Functor1("objectArray", Args), Atom.NIL))))) {
                        yield true;
                        return;
                      }
                    }
                  }
                }
              }
              break cutIf3;
            }
            for (let l6 of YP.unify(NameCode, new Functor1("object", Name))) {
              cutIf6:
              {
                for (let l8 of YP.unify(TermArgs, new ListPair(X1, Atom.NIL))) {
                  for (let l9 in compileTerm(X1, State, Arg1)) {
                    for (let l10 of YP.unify(Result, new Functor2("new", Atom.a("Functor1"), new ListPair(NameCode, new ListPair(Arg1, Atom.NIL))))) {
                      yield true;
                      return;
                    }
                  }
                  break cutIf6;
                }
                cutIf7:
                {
                  for (let l9 of YP.unify(TermArgs, new ListPair(X1, new ListPair(X2, Atom.NIL)))) {
                    for (let l10 in compileTerm(X1, State, Arg1)) {
                      for (let l11 in compileTerm(X2, State, Arg2)) {
                        for (let l12 of YP.unify(Result, new Functor2("new", Atom.a("Functor2"), ListPair.make([NameCode, Arg1, Arg2])))) {
                          yield true;
                          return;
                        }
                      }
                    }
                    break cutIf7;
                  }
                  for (let l9 of YP.unify(TermArgs, ListPair.make([X1, X2, X3]))) {
                    for (let l10 in compileTerm(X1, State, Arg1)) {
                      for (let l11 in compileTerm(X2, State, Arg2)) {
                        for (let l12 in compileTerm(X3, State, Arg3)) {
                          for (let l13 of YP.unify(Result, new Functor2("new", Atom.a("Functor3"), ListPair.make([NameCode, Arg1, Arg2, Arg3])))) {
                            yield true;
                            return;
                          }
                        }
                      }
                    }
                  }
                  for (let l9 in maplist_compileTerm(TermArgs, State, Args)) {
                    for (let l10 of YP.unify(Result, new Functor2("new", Atom.a("Functor"), new ListPair(NameCode, new ListPair(new Functor1("objectArray", Args), Atom.NIL))))) {
                      yield true;
                      return;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

function *compileAtomModule(Name, arg2:any, arg3, ModuleCode) {
  {
    let Arity = arg2;
    let State = arg3;
    if (CompilerState.nameArityHasModule(State, Name, Arity, Atom.a(""))) {
      for (let l3 of YP.unify(ModuleCode, new Functor2("call", Atom.a("Atom.a"), new ListPair(new Functor1("object", Atom.a("")), Atom.NIL)))) {
        yield true;
        return;
      }
    }
  }
  {
    let _Arity = arg2;
    let _State = arg3;
    let Module = new Variable();
    for (let l2 in Atom.module(Name, Module)) {
      if (YP.termNotEqual(Module, Atom.NIL)) {
        for (let l4 of YP.unify(ModuleCode, new Functor2("call", Atom.a("Atom.a"), new ListPair(new Functor1("object", Module), Atom.NIL)))) {
          yield true;
          return;
        }
      }
    }
  }
}

function *maplist_compileTerm(arg1: any, arg2, arg3) {
  {
    let _State = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg3, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let State = arg2;
    let First = new Variable();
    let Rest = new Variable();
    let FirstResult = new Variable();
    let RestResults = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(First, Rest))) {
      for (let l3 of YP.unify(arg3, new ListPair(FirstResult, RestResults))) {
        if (YP.nonvar(Rest)) {
          for (let l5 of compileTerm(First, State, FirstResult)) {
            for (let l6 of maplist_compileTerm(Rest, State, RestResults)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
}

function *compileExpression(Term, State, Result) {
  {
    let Name = new Variable();
    let TermArgs = new Variable();
    let X1 = new Variable();
    let FunctionName = new Variable();
    let Arg1 = new Variable();
    let x9 = new Variable();
    let X2 = new Variable();
    let Arg2 = new Variable();
    let x12 = new Variable();
    let Arity = new Variable();
    if (YP.nonvar(Term)) {
      for (let l3 in YP.univ(Term, new ListPair(Name, TermArgs))) {
        if (YP.atom(Name)) {
          cutIf1:
          {
            for (let l6 of YP.unify(TermArgs, new ListPair(X1, Atom.NIL))) {
              for (let l7 of unaryFunction(Name, FunctionName)) {
                for (let l8 of compileExpression(X1, State, Arg1)) {
                  for (let l9 of YP.unify(Result, new Functor2("call", FunctionName, new ListPair(Arg1, Atom.NIL)))) {
                    yield true;
                    return;
                  }
                }
                break cutIf1;
              }
            }
            cutIf2:
            {
              for (let l7 of YP.unify(Term, new ListPair(x9, Atom.NIL))) {
                for (let l8 in compileTerm(Term, State, Result)) {
                  yield true;
                  return;
                }
                break cutIf2;
              }
              cutIf3:
              {
                for (let l8 of YP.unify(TermArgs, new ListPair(X1, new ListPair(X2, Atom.NIL)))) {
                  for (let l9 in binaryFunction(Name, FunctionName)) {
                    for (let l10 in compileExpression(X1, State, Arg1)) {
                      for (let l11 in compileExpression(X2, State, Arg2)) {
                        for (let l12 of YP.unify(Result, new Functor2("call", FunctionName, new ListPair(Arg1, new ListPair(Arg2, Atom.NIL))))) {
                          yield true;
                          return;
                        }
                      }
                    }
                    break cutIf3;
                  }
                }
                for (let l8 in YP.functor(Term, x12, Arity)) {
                  YP.throwException(new Functor2("error", new Functor2("type_error", Atom.a("evaluable"), new Functor2("/", Name, Arity)), Atom.a("Not an expression function")));
                  yield false;
                }
              }
            }
          }
        }
      }
    }
  }
  {
    for (let l2 in compileTerm(Term, State, Result)) {
      yield true;
      return;
    }
  }
}

function *unaryFunction(arg1, arg2) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("-"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.negate"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("abs"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.abs"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("sign"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.sign"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("float"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.toFloat"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("floor"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.floor"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("truncate"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.truncate"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("round"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.round"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("ceiling"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.ceiling"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("sin"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.sin"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("cos"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.cos"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("atan"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.atan"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("exp"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.exp"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("log"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.log"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("sqrt"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.sqrt"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("\\"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.bitwiseComplement"))) {
        yield true;
        return;
      }
    }
  }
}

function *binaryFunction(arg1, arg2) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("+"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.add"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("-"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.subtract"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("*"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.multiply"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("/"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.divide"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("//"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.intDivide"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("mod"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.mod"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("**"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.pow"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a(">>"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.bitwiseShiftRight"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("<<"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.bitwiseShiftLeft"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("/\\"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.bitwiseAnd"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("\\/"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.bitwiseOr"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("min"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.min"))) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("max"))) {
      for (let l3 of YP.unify(arg2, Atom.a("YP.max"))) {
        yield true;
        return;
      }
    }
  }
}

function convertFunctionCSharp(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("getDeclaringClass"))) {
      YP.write(Atom.a("public class YPInnerClass {}"));
      YP.nl();
      YP.write(Atom.a("public static Type getDeclaringClass() { return typeof(YPInnerClass).DeclaringType; }"));
      YP.nl();
      YP.nl();
      return;
    }
  }
  {
    let ReturnType = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    let Body = new Variable();
    let Level = new Variable();
    for (let l2 of YP.unify(arg1, new Functor("function", [ReturnType, Name, ArgList, Body]))) {
      YP.write(Atom.a("public static "));
      YP.write(ReturnType);
      YP.write(Atom.a(" "));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a(") {"));
      YP.nl();
      for (let l3 of YP.unify(Level, 1)) {
        convertStatementListCSharp(Body, Level);
        YP.write(Atom.a("}"));
        YP.nl();
        YP.nl();
        return;
      }
    }
  }
}

function *convertStatementListCSharp1(arg1, x1, x2) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      yield true;
      return;
    }
  }
}

function convertStatementListCSharp(arg1, Level) {
  {
    let Name = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NewStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("breakableBlock", Name, Body), RestStatements))) {
      for (let l3 in append(Body, new ListPair(new Functor1("label", Name), RestStatements), NewStatements)) {
        convertStatementListCSharp(NewStatements, Level);
        return;
      }
    }
  }
  {
    let Type = new Variable();
    let Name = new Variable();
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("declare", Type, Name, Expression), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Type);
      YP.write(Atom.a(" "));
      YP.write(Name);
      YP.write(Atom.a(" = "));
      convertExpressionCSharp(Expression);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let Name = new Variable();
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("assign", Name, Expression), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Name);
      YP.write(Atom.a(" = "));
      convertExpressionCSharp(Expression);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldtrue"), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("yield return true;"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldfalse"), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("yield return false;"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldbreak"), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("yield break;"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("return"), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("return;"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("returntrue"), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("return true;"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("returnfalse"), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("return false;"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let Name = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("label", Name), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Name);
      YP.write(Atom.a(":"));
      YP.nl();
      cutIf1:
      {
        if (YP.termEqual(RestStatements, Atom.NIL)) {
          convertIndentationCSharp(Level);
          YP.write(Atom.a("{}"));
          YP.nl();
          convertStatementListCSharp(RestStatements, Level);
          return;
          break cutIf1;
        }
        convertStatementListCSharp(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Name = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("breakBlock", Name), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("goto "));
      YP.write(Name);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("call", Name, ArgList), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a(");"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let Name = new Variable();
    let _FunctorArgs = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("functorCall", Name, _FunctorArgs, ArgList), RestStatements))) {
      convertStatementListCSharp(new ListPair(new Functor2("call", Name, ArgList), RestStatements), Level);
      return;
    }
  }
  {
    let Obj = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("callMember", new Functor1("var", Obj), Name, ArgList), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Obj);
      YP.write(Atom.a("."));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a(");"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
  {
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("blockScope", Body), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("{"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListCSharp(Body, NextLevel);
        convertIndentationCSharp(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListCSharp(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Expression = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("if", Expression, Body), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("if ("));
      convertExpressionCSharp(Expression);
      YP.write(Atom.a(") {"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListCSharp(Body, NextLevel);
        convertIndentationCSharp(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListCSharp(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Expression = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("foreach", Expression, Body), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("foreach (bool l"));
      YP.write(Level);
      YP.write(Atom.a(" in "));
      convertExpressionCSharp(Expression);
      YP.write(Atom.a(") {"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListCSharp(Body, NextLevel);
        convertIndentationCSharp(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListCSharp(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("throw", Expression), RestStatements))) {
      convertIndentationCSharp(Level);
      YP.write(Atom.a("throw "));
      convertExpressionCSharp(Expression);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListCSharp(RestStatements, Level);
      return;
    }
  }
}

function convertIndentationCSharp(Level) {
  {
    let N = new Variable();
    for (let l2 of YP.unify(N, YP.multiply(Level, 2))) {
      repeatWrite(Atom.a(" "), N);
      return;
    }
  }
}

function convertArgListCSharp(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Head = new Variable();
    let Tail = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Head, Tail))) {
      convertExpressionCSharp(Head);
      cutIf1:
      {
        if (YP.termNotEqual(Tail, Atom.NIL)) {
          YP.write(Atom.a(", "));
          convertArgListCSharp(Tail);
          return;
          break cutIf1;
        }
        convertArgListCSharp(Tail);
        return;
      }
    }
  }
}

function convertExpressionCSharp(arg1) {
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("arg", X))) {
      YP.write(Atom.a("object "));
      YP.write(X);
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("call", Name, ArgList))) {
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    let _FunctorArgs = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("functorCall", Name, _FunctorArgs, ArgList))) {
      convertExpressionCSharp(new Functor2("call", Name, ArgList));
      return;
    }
  }
  {
    let Obj = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("callMember", new Functor1("var", Obj), Name, ArgList))) {
      YP.write(Obj);
      YP.write(Atom.a("."));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("new", Name, ArgList))) {
      YP.write(Atom.a("new "));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("var", Name))) {
      YP.write(Name);
      return;
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("null"))) {
      YP.write(Atom.a("null"));
      return;
    }
  }
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("not", X))) {
      YP.write(Atom.a("!("));
      convertExpressionCSharp(X);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let X = new Variable();
    let Y = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("and", X, Y))) {
      YP.write(Atom.a("("));
      convertExpressionCSharp(X);
      YP.write(Atom.a(") && ("));
      convertExpressionCSharp(Y);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("objectArray", ArgList))) {
      YP.write(Atom.a("new object[] {"));
      convertArgListCSharp(ArgList);
      YP.write(Atom.a("}"));
      return;
    }
  }
  {
    let X = new Variable();
    let Codes = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("object", X))) {
      if (YP.atom(X)) {
        YP.write(Atom.a("\""));
        for (let l4 in YP.atom_codes(X, Codes)) {
          convertStringCodesCSharp(Codes);
          YP.write(Atom.a("\""));
          return;
        }
      }
    }
  }
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("object", X))) {
      YP.write(X);
      return;
    }
  }
}

function convertStringCodesCSharp(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Code = new Variable();
    let RestCodes = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Code, RestCodes))) {
      for (let l3 in putCStringCode(Code)) {
        convertStringCodesCSharp(RestCodes);
        return;
      }
    }
  }
}

function convertFunctionJavascript(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("getDeclaringClass"))) {
      YP.write(Atom.a("function getDeclaringClass() { return null; }"));
      YP.nl();
      YP.nl();
      return;
    }
  }
  {
    let x1 = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    let Body = new Variable();
    for (let l2 of YP.unify(arg1, new Functor("function", [x1, Name, ArgList, Body]))) {
      YP.write(Atom.a("function "));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a(") {"));
      YP.nl();
      convertStatementListJavascript(Body, 1);
      YP.write(Atom.a("}"));
      YP.nl();
      YP.nl();
      return;
    }
  }
}

function convertStatementListJavascript(arg1, arg2) {
  {
    let x1 = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Level = arg2;
    let Name = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("breakableBlock", Name, Body), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Name);
      YP.write(Atom.a(":"));
      YP.nl();
      convertIndentationJavascript(Level);
      YP.write(Atom.a("{"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListJavascript(Body, NextLevel);
        convertIndentationJavascript(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListJavascript(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Level = arg2;
    let _Type = new Variable();
    let Name = new Variable();
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("declare", _Type, Name, Expression), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("let "));
      YP.write(Name);
      YP.write(Atom.a(" = "));
      convertExpressionJavascript(Expression);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let Name = new Variable();
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("assign", Name, Expression), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Name);
      YP.write(Atom.a(" = "));
      convertExpressionJavascript(Expression);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldtrue"), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("yield true;"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldfalse"), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("yield false;"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldbreak"), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("return;"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("return"), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("return;"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("returntrue"), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("return true;"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("returnfalse"), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("return false;"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let Name = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("breakBlock", Name), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("break "));
      YP.write(Name);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let Name = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("call", Name, ArgList), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a(");"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let Name = new Variable();
    let _FunctorArgs = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("functorCall", Name, _FunctorArgs, ArgList), RestStatements))) {
      convertStatementListJavascript(new ListPair(new Functor2("call", Name, ArgList), RestStatements), Level);
      return;
    }
  }
  {
    let Level = arg2;
    let Obj = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("callMember", new Functor1("var", Obj), Name, ArgList), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Obj);
      YP.write(Atom.a("."));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a(");"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
  {
    let Level = arg2;
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("blockScope", Body), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("{"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListJavascript(Body, NextLevel);
        convertIndentationJavascript(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListJavascript(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Level = arg2;
    let Expression = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("if", Expression, Body), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("if ("));
      convertExpressionJavascript(Expression);
      YP.write(Atom.a(") {"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListJavascript(Body, NextLevel);
        convertIndentationJavascript(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListJavascript(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Level = arg2;
    let Expression = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("foreach", Expression, Body), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("for (let l"));
      YP.write(Level);
      YP.write(Atom.a(" in "));
      convertExpressionJavascript(Expression);
      YP.write(Atom.a(") {"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        convertStatementListJavascript(Body, NextLevel);
        convertIndentationJavascript(Level);
        YP.write(Atom.a("}"));
        YP.nl();
        convertStatementListJavascript(RestStatements, Level);
        return;
      }
    }
  }
  {
    let Level = arg2;
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("throw", Expression), RestStatements))) {
      convertIndentationJavascript(Level);
      YP.write(Atom.a("throw "));
      convertExpressionJavascript(Expression);
      YP.write(Atom.a(";"));
      YP.nl();
      convertStatementListJavascript(RestStatements, Level);
      return;
    }
  }
}

function convertIndentationJavascript(Level) {
  {
    let N = new Variable();
    for (let l2 of YP.unify(N, YP.multiply(Level, 2))) {
      repeatWrite(Atom.a(" "), N);
      return;
    }
  }
}

function convertArgListJavascript(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Head = new Variable();
    let Tail = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Head, Tail))) {
      convertExpressionJavascript(Head);
      cutIf1:
      {
        if (YP.termNotEqual(Tail, Atom.NIL)) {
          YP.write(Atom.a(", "));
          convertArgListJavascript(Tail);
          return;
          break cutIf1;
        }
        convertArgListJavascript(Tail);
        return;
      }
    }
  }
}

function convertExpressionJavascript(arg1) {
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("arg", X))) {
      YP.write(X);
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("call", Name, ArgList))) {
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    let _FunctorArgs = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("functorCall", Name, _FunctorArgs, ArgList))) {
      convertExpressionJavascript(new Functor2("call", Name, ArgList));
      return;
    }
  }
  {
    let Obj = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("callMember", new Functor1("var", Obj), Name, ArgList))) {
      YP.write(Obj);
      YP.write(Atom.a("."));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("new", Name, ArgList))) {
      YP.write(Atom.a("new "));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("var", Name))) {
      YP.write(Name);
      return;
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("null"))) {
      YP.write(Atom.a("null"));
      return;
    }
  }
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("not", X))) {
      YP.write(Atom.a("!("));
      convertExpressionJavascript(X);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let X = new Variable();
    let Y = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("and", X, Y))) {
      YP.write(Atom.a("("));
      convertExpressionJavascript(X);
      YP.write(Atom.a(") && ("));
      convertExpressionJavascript(Y);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("objectArray", ArgList))) {
      YP.write(Atom.a("["));
      convertArgListJavascript(ArgList);
      YP.write(Atom.a("]"));
      return;
    }
  }
  {
    let X = new Variable();
    let Codes = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("object", X))) {
      if (YP.atom(X)) {
        YP.write(Atom.a("\""));
        for (let l4 in YP.atom_codes(X, Codes)) {
          convertStringCodesJavascript(Codes);
          YP.write(Atom.a("\""));
          return;
        }
      }
    }
  }
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("object", X))) {
      YP.write(X);
      return;
    }
  }
}

function convertStringCodesJavascript(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Code = new Variable();
    let RestCodes = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Code, RestCodes))) {
      for (let l3 in putCStringCode(Code)) {
        convertStringCodesJavascript(RestCodes);
        return;
      }
    }
  }
}

function convertFunctionPython(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.a("getDeclaringClass"))) {
      YP.write(Atom.a("def getDeclaringClass():"));
      YP.nl();
      YP.write(Atom.a("  return globals()"));
      YP.nl();
      YP.nl();
      return;
    }
  }
  {
    let x1 = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    let Body = new Variable();
    let Level = new Variable();
    let HasBreakableBlock = new Variable();
    for (let l2 of YP.unify(arg1, new Functor("function", [x1, Name, ArgList, Body]))) {
      YP.write(Atom.a("def "));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListPython(ArgList);
      YP.write(Atom.a("):"));
      YP.nl();
      for (let l3 of YP.unify(Level, 1)) {
        cutIf1:
        {
          if (hasBreakableBlockPython(Body)) {
            for (let l6 of YP.unify(HasBreakableBlock, 1)) {
              cutIf2:
              {
                if (YP.termEqual(HasBreakableBlock, 1)) {
                  convertIndentationPython(Level);
                  YP.write(Atom.a("doBreak = False"));
                  YP.nl();
                  for (let l9 in convertStatementListPython(Body, Level, HasBreakableBlock)) {
                    YP.nl();
                    return;
                  }
                  break cutIf2;
                }
                for (let l8 in convertStatementListPython(Body, Level, HasBreakableBlock)) {
                  YP.nl();
                  return;
                }
              }
            }
            break cutIf1;
          }
          for (let l5 of YP.unify(HasBreakableBlock, 0)) {
            cutIf3:
            {
              if (YP.termEqual(HasBreakableBlock, 1)) {
                convertIndentationPython(Level);
                YP.write(Atom.a("doBreak = False"));
                YP.nl();
                for (let l8 in convertStatementListPython(Body, Level, HasBreakableBlock)) {
                  YP.nl();
                  return;
                }
                break cutIf3;
              }
              for (let l7 in convertStatementListPython(Body, Level, HasBreakableBlock)) {
                YP.nl();
                return;
              }
            }
          }
        }
      }
    }
  }
}

function hasBreakableBlockPython(arg1) {
  {
    let _Name = new Variable();
    let _Body = new Variable();
    let _RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("breakableBlock", _Name, _Body), _RestStatements))) {
      return true;
    }
  }
  {
    let Body = new Variable();
    let _RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("blockScope", Body), _RestStatements))) {
      if (hasBreakableBlockPython(Body)) {
        return true;
      }
    }
  }
  {
    let _Expression = new Variable();
    let Body = new Variable();
    let _RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("if", _Expression, Body), _RestStatements))) {
      if (hasBreakableBlockPython(Body)) {
        return true;
      }
    }
  }
  {
    let _Expression = new Variable();
    let Body = new Variable();
    let _RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("foreach", _Expression, Body), _RestStatements))) {
      if (hasBreakableBlockPython(Body)) {
        return true;
      }
    }
  }
  {
    let x1 = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(x1, RestStatements))) {
      if (hasBreakableBlockPython(RestStatements)) {
        return true;
      }
    }
  }
  return false;
}

function *convertStatementListPython(arg1, arg2, arg3) {
  {
    let x1 = arg2;
    let x2 = arg3;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      yield true;
      return;
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Name = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("breakableBlock", Name, Body), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Name);
      YP.write(Atom.a(" = False"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        cutIf1:
        {
          if (YP.termEqual(Body, Atom.NIL)) {
            convertIndentationPython(Level);
            YP.write(Atom.a("if "));
            YP.write(Name);
            YP.write(Atom.a(":"));
            YP.nl();
            convertIndentationPython(NextLevel);
            YP.write(Atom.a("doBreak = False"));
            YP.nl();
            convertIndentationPython(Level);
            YP.write(Atom.a("if doBreak:"));
            YP.nl();
            convertIndentationPython(NextLevel);
            YP.write(Atom.a("break"));
            YP.nl();
            for (let l6 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
              yield true;
              return;
            }
            break cutIf1;
          }
          convertIndentationPython(Level);
          YP.write(Atom.a("for _ in [1]:"));
          YP.nl();
          for (let l5 in convertStatementListPython(Body, NextLevel, HasBreakableBlock)) {
            convertIndentationPython(Level);
            YP.write(Atom.a("if "));
            YP.write(Name);
            YP.write(Atom.a(":"));
            YP.nl();
            convertIndentationPython(NextLevel);
            YP.write(Atom.a("doBreak = False"));
            YP.nl();
            convertIndentationPython(Level);
            YP.write(Atom.a("if doBreak:"));
            YP.nl();
            convertIndentationPython(NextLevel);
            YP.write(Atom.a("break"));
            YP.nl();
            for (let l6 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let _Type = new Variable();
    let Name = new Variable();
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("declare", _Type, Name, Expression), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Name);
      YP.write(Atom.a(" = "));
      convertExpressionPython(Expression);
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Name = new Variable();
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("assign", Name, Expression), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Name);
      YP.write(Atom.a(" = "));
      convertExpressionPython(Expression);
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldtrue"), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("yield True"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldfalse"), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("yield False"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("yieldbreak"), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("return"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("return"), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("return"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("returntrue"), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("return True"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a("returnfalse"), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("return False"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Name = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("breakBlock", Name), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Name);
      YP.write(Atom.a(" = True"));
      YP.nl();
      convertIndentationPython(Level);
      YP.write(Atom.a("doBreak = True"));
      YP.nl();
      convertIndentationPython(Level);
      YP.write(Atom.a("break"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Name = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("call", Name, ArgList), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListPython(ArgList);
      YP.write(Atom.a(")"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Name = new Variable();
    let _FunctorArgs = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("functorCall", Name, _FunctorArgs, ArgList), RestStatements))) {
      for (let l3 in convertStatementListPython(new ListPair(new Functor2("call", Name, ArgList), RestStatements), Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Obj = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor3("callMember", new Functor1("var", Obj), Name, ArgList), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Obj);
      YP.write(Atom.a("."));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListPython(ArgList);
      YP.write(Atom.a(")"));
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("blockScope", Body), RestStatements))) {
      cutIf2:
      {
        if (YP.termEqual(HasBreakableBlock, 1)) {
          if (YP.termNotEqual(Body, Atom.NIL)) {
            convertIndentationPython(Level);
            YP.write(Atom.a("for _ in [1]:"));
            YP.nl();
            for (let l6 of YP.unify(NextLevel, YP.add(Level, 1))) {
              for (let l7 in convertStatementListPython(Body, NextLevel, HasBreakableBlock)) {
                cutIf3:
                {
                  if (YP.termEqual(HasBreakableBlock, 1)) {
                    cutIf4:
                    {
                      if (YP.greaterThan(Level, 1)) {
                        convertIndentationPython(Level);
                        YP.write(Atom.a("if doBreak:"));
                        YP.nl();
                        convertIndentationPython(NextLevel);
                        YP.write(Atom.a("break"));
                        YP.nl();
                        for (let l12 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                          yield true;
                          return;
                        }
                        break cutIf4;
                      }
                      for (let l11 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                        yield true;
                        return;
                      }
                    }
                    break cutIf3;
                  }
                  for (let l9 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                    yield true;
                    return;
                  }
                }
              }
            }
            break cutIf2;
          }
        }
        for (let l4 of YP.unify(NextLevel, Level)) {
          for (let l5 in convertStatementListPython(Body, NextLevel, HasBreakableBlock)) {
            cutIf5:
            {
              if (YP.termEqual(HasBreakableBlock, 1)) {
                cutIf6:
                {
                  if (YP.greaterThan(Level, 1)) {
                    convertIndentationPython(Level);
                    YP.write(Atom.a("if doBreak:"));
                    YP.nl();
                    convertIndentationPython(NextLevel);
                    YP.write(Atom.a("break"));
                    YP.nl();
                    for (let l10 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                      yield true;
                      return;
                    }
                    break cutIf6;
                  }
                  for (let l9 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                    yield true;
                    return;
                  }
                }
                break cutIf5;
              }
              for (let l7 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                yield true;
                return;
              }
            }
          }
        }
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Expression = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("if", Expression, Body), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("if "));
      convertExpressionPython(Expression);
      YP.write(Atom.a(":"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        cutIf7:
        {
          if (YP.termEqual(Body, Atom.NIL)) {
            convertIndentationPython(NextLevel);
            YP.write(Atom.a("pass"));
            YP.nl();
            for (let l6 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
              yield true;
              return;
            }
            break cutIf7;
          }
          for (let l5 in convertStatementListPython(Body, NextLevel, HasBreakableBlock)) {
            for (let l6 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Expression = new Variable();
    let Body = new Variable();
    let RestStatements = new Variable();
    let NextLevel = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("foreach", Expression, Body), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("for l"));
      YP.write(Level);
      YP.write(Atom.a(" in "));
      convertExpressionPython(Expression);
      YP.write(Atom.a(":"));
      YP.nl();
      for (let l3 of YP.unify(NextLevel, YP.add(Level, 1))) {
        for (let l4 of YP.unify(NextLevel, YP.add(Level, 1))) {
          cutIf8:
          {
            if (YP.termEqual(Body, Atom.NIL)) {
              convertIndentationPython(NextLevel);
              YP.write(Atom.a("pass"));
              YP.nl();
              cutIf9:
              {
                if (YP.termEqual(HasBreakableBlock, 1)) {
                  convertIndentationPython(Level);
                  YP.write(Atom.a("if doBreak:"));
                  YP.nl();
                  convertIndentationPython(NextLevel);
                  YP.write(Atom.a("break"));
                  YP.nl();
                  for (let l9 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                    yield true;
                    return;
                  }
                  break cutIf9;
                }
                for (let l8 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                  yield true;
                  return;
                }
              }
              break cutIf8;
            }
            for (let l6 in convertStatementListPython(Body, NextLevel, HasBreakableBlock)) {
              cutIf10:
              {
                if (YP.termEqual(HasBreakableBlock, 1)) {
                  convertIndentationPython(Level);
                  YP.write(Atom.a("if doBreak:"));
                  YP.nl();
                  convertIndentationPython(NextLevel);
                  YP.write(Atom.a("break"));
                  YP.nl();
                  for (let l9 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                    yield true;
                    return;
                  }
                  break cutIf10;
                }
                for (let l8 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
                  yield true;
                  return;
                }
              }
            }
          }
        }
      }
    }
  }
  {
    let Level = arg2;
    let HasBreakableBlock = arg3;
    let Expression = new Variable();
    let RestStatements = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor1("throw", Expression), RestStatements))) {
      convertIndentationPython(Level);
      YP.write(Atom.a("raise "));
      convertExpressionPython(Expression);
      YP.nl();
      for (let l3 in convertStatementListPython(RestStatements, Level, HasBreakableBlock)) {
        yield true;
        return;
      }
    }
  }
}

function convertIndentationPython(Level) {
  {
    let N = new Variable();
    for (let l2 of YP.unify(N, YP.multiply(Level, 2))) {
      repeatWrite(Atom.a(" "), N);
      return;
    }
  }
}

function convertArgListPython(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Head = new Variable();
    let Tail = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Head, Tail))) {
      convertExpressionPython(Head);
      cutIf1:
      {
        if (YP.termNotEqual(Tail, Atom.NIL)) {
          YP.write(Atom.a(", "));
          convertArgListPython(Tail);
          return;
          break cutIf1;
        }
        convertArgListPython(Tail);
        return;
      }
    }
  }
}

function convertExpressionPython(arg1) {
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("arg", X))) {
      YP.write(X);
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("call", Name, ArgList))) {
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListPython(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    let _FunctorArgs = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("functorCall", Name, _FunctorArgs, ArgList))) {
      convertExpressionPython(new Functor2("call", Name, ArgList));
      return;
    }
  }
  {
    let Obj = new Variable();
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("callMember", new Functor1("var", Obj), Name, ArgList))) {
      YP.write(Obj);
      YP.write(Atom.a("."));
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListPython(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("new", Name, ArgList))) {
      YP.write(Name);
      YP.write(Atom.a("("));
      convertArgListPython(ArgList);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let Name = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("var", Name))) {
      YP.write(Name);
      return;
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.a("null"))) {
      YP.write(Atom.a("None"));
      return;
    }
  }
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("not", X))) {
      YP.write(Atom.a("not ("));
      convertExpressionPython(X);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let X = new Variable();
    let Y = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("and", X, Y))) {
      YP.write(Atom.a("("));
      convertExpressionPython(X);
      YP.write(Atom.a(") and ("));
      convertExpressionPython(Y);
      YP.write(Atom.a(")"));
      return;
    }
  }
  {
    let ArgList = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("objectArray", ArgList))) {
      YP.write(Atom.a("["));
      convertArgListPython(ArgList);
      YP.write(Atom.a("]"));
      return;
    }
  }
  {
    let X = new Variable();
    let Codes = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("object", X))) {
      if (YP.atom(X)) {
        YP.write(Atom.a("\""));
        for (let l4 in YP.atom_codes(X, Codes)) {
          convertStringCodesPython(Codes);
          YP.write(Atom.a("\""));
          return;
        }
      }
    }
  }
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("object", X))) {
      YP.write(X);
      return;
    }
  }
}

function convertStringCodesPython(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      return;
    }
  }
  {
    let Code = new Variable();
    let RestCodes = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Code, RestCodes))) {
      for (let l3 in putCStringCode(Code)) {
        convertStringCodesPython(RestCodes);
        return;
      }
    }
  }
}

function *putCStringCode(Code) {
  {
    let HexDigit = new Variable();
    let HexChar = new Variable();
    if (YP.lessThanOrEqual(Code, 31)) {
      cutIf1:
      {
        if (YP.lessThanOrEqual(Code, 15)) {
          YP.write(Atom.a("\\x0"));
          for (let l5 of YP.unify(HexDigit, Code)) {
            cutIf2:
            {
              if (YP.lessThanOrEqual(HexDigit, 9)) {
                for (let l8 of YP.unify(HexChar, YP.add(HexDigit, 48))) {
                  YP.put_code(HexChar);
                  yield true;
                  return;
                }
                break cutIf2;
              }
              for (let l7 of YP.unify(HexChar, YP.add(HexDigit, 55))) {
                YP.put_code(HexChar);
                yield true;
                return;
              }
            }
          }
          break cutIf1;
        }
        YP.write(Atom.a("\\x1"));
        for (let l4 of YP.unify(HexDigit, YP.subtract(Code, 16))) {
          cutIf3:
          {
            if (YP.lessThanOrEqual(HexDigit, 9)) {
              for (let l7 of YP.unify(HexChar, YP.add(HexDigit, 48))) {
                YP.put_code(HexChar);
                yield true;
                return;
              }
              break cutIf3;
            }
            for (let l6 of YP.unify(HexChar, YP.add(HexDigit, 55))) {
              YP.put_code(HexChar);
              yield true;
              return;
            }
          }
        }
      }
    }
  }
  {
    if (YP.termEqual(Code, 34)) {
      YP.put_code(92);
      YP.put_code(34);
      yield true;
      return;
    }
  }
  {
    if (YP.termEqual(Code, 92)) {
      YP.put_code(92);
      YP.put_code(92);
      yield true;
      return;
    }
  }
  {
    YP.put_code(Code);
    yield true;
    return;
  }
}

function *member(X, arg2) {
  {
    let x2 = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(X, x2))) {
      yield false;
    }
  }
  {
    let x2 = new Variable();
    let Rest = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(x2, Rest))) {
      for (let l3 of member(X, Rest)) {
        yield false;
      }
    }
  }
}

function *append(arg1, arg2, arg3) {
  {
    let List = new Variable();
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, List)) {
        for (let l4 of YP.unify(arg3, List)) {
          yield false;
        }
      }
    }
  }
  {
    let List2 = arg2;
    let X = new Variable();
    let List1 = new Variable();
    let List12 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(X, List1))) {
      for (let l3 of YP.unify(arg3, new ListPair(X, List12))) {
        for (let l4 of append(List1, List2, List12)) {
          yield false;
        }
      }
    }
  }
}

