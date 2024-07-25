import {IndexedAnswers} from "./IndexedAnswers";
import {Atom} from "./Atom";
import {Variable} from "./Variable";
import {YP} from "./YP";
import {Functor2} from "./Functor2";
import {PrologException} from "./PrologException";
import {ListPair} from "./ListPair";
import {sameVariable} from "./Compiler";

export class CompilerState {
  private _pred: IndexedAnswers;
  private _moduleForNameArity: Object;
  private _gensymCounter: number;
  private _useFinalCutCode: boolean;
  private _determinism: Atom;
  private _finalCutCode: Variable;
  private _codeUsesYield: boolean;
  private _variableNames: any[];

  constructor() {
    this._pred = new IndexedAnswers(4);
    this._moduleForNameArity = new Object();
  }


// Make these static functions that explicitly take the State so Prolog can call it.

// Make a new CompilerState and bind it to State.
  static make(State: Variable) {
    return YP.unify(State, new CompilerState());
  }

  static assertPred(State, Pred, Determinism) {
    State = YP.getValue(State);
    var functorName = YP.getFunctorName(Pred);
    var functorArgs = YP.getFunctorArgs(Pred);
    // Debug: Should check if it's already asserted and is the same.
    State._pred.addAnswer([functorName, functorArgs.length, Pred, YP.getValue(Determinism)]);
  }

  static assertModuleForNameArity(State, Name, Arity, Module: Atom) {
    State = YP.getValue(State);
    Name = YP.getValue(Name);
    Arity = YP.getValue(Arity);
    Module = YP.getValue(Module);
    // If the Module Atom comes from the parser, it always has null _declaringClass.
    if (Module instanceof Atom && Module.module == null && Name instanceof Atom && typeof(Arity) == "number")
      // Replace a previous entry if it exists.
      State._moduleForNameArity[Name + "/" + Arity] = Module;
  }

  static startFunction(State: Variable, Head) {
    let aCompilerState:CompilerState = (YP.getValue(State) as CompilerState);
    aCompilerState._gensymCounter = 0;
    aCompilerState._useFinalCutCode = false;
    aCompilerState._finalCutCode = new Variable();
    aCompilerState._codeUsesYield = false;
    if (CompilerState.isDetNoneOut(aCompilerState, Head))
      aCompilerState._determinism = Atom.a("detNoneOut");
    else if (CompilerState.isSemidetNoneOut(aCompilerState, Head))
      aCompilerState._determinism = Atom.a("semidetNoneOut");
    else
      aCompilerState._determinism = Atom.a("nondet");
  }

  static setCodeUsesYield = function(State) {
    State = YP.getValue(State);
    State._codeUsesYield = true;
  }

  static codeUsesYield = function(State) {
    State = YP.getValue(State);
    return State._codeUsesYield;
  }

  static determinismEquals(State: CompilerState, Term) {
    State = YP.getValue(State);
    return YP.termEqual(State._determinism, Term);
  }

// Set _variableNames to a new list of (Name = Variable) for each unique variable in rule.
// If the variable is in variableNameSuggestions, use it, otherwise use x1, x2, etc.
  static newVariableNames(State: CompilerState, Rule, VariableNameSuggestions) {
    State = YP.getValue(State);
    var variablesSet = [];
    YP.addUniqueVariables(Rule, variablesSet);

    State._variableNames = [];
    var xCounter = 0;
    for (var variable of variablesSet)
      State._variableNames.push
      (new Functor2(Atom.a("="), CompilerState.makeVariableName(variable, VariableNameSuggestions, ++xCounter),
        variable));
  }

  static makeVariableName = function(variable, variableNameSuggestions, xCounter: number) {
    // Debug: should require named variables to start with _ or capital. Should
    //   check for duplicates and clashes with keywords.
    for (var element = YP.getValue(variableNameSuggestions);
         element instanceof Functor2 && element.name == Atom.DOT;
         element = YP.getValue(element.arg2)) {
      var suggestionPair = YP.getValue(element.arg1);
      if (sameVariable(variable, suggestionPair.arg2)) {
        var suggestion = YP.getValue(suggestionPair.arg1);
        if (suggestion == Atom.a("Atom"))
          suggestion = Atom.a("Atom_1");
        if (suggestion == Atom.a("Variable"))
          suggestion = Atom.a("Variable_1");
        if (suggestion == Atom.a("Functor"))
          suggestion = Atom.a("Functor_1");
        return suggestion;
      }
    }

    return Atom.a("x" + xCounter);
  }

// Unify Result with the name assigned by CompilerState.newVariableNames in State._variableNames
//   for variable.
  static getVariableName(State:CompilerState, variable: Variable, Result: Variable) {
    State = YP.getValue(State);
    for (let variableInfo of State._variableNames) {
      if (variableInfo instanceof Functor2 && variableInfo.name == Atom.a("=")) {
        if (sameVariable(variable, variableInfo.arg2))
          return YP.unify(Result, variableInfo.arg1);
      }
    }

    // We set up names for all unique variables, so this should never happen.
    throw new PrologException(Atom.a("Can't find entry in _variableNames"));
  }

  static variableNamesList(State: CompilerState, VariableNamesList) {
    State = YP.getValue(State);
    return YP.unify(VariableNamesList, ListPair.make(State._variableNames));
  }

  static gensym(State, Base: Atom, Symbol) {
    State = YP.getValue(State);
    return YP.unify(Symbol, Atom.a(Base.toString() + ++State._gensymCounter));
  }

  static isDetNoneOut(State, Term) {
    State = YP.getValue(State);
    var functorName = YP.getFunctorName(Term);
    var functorArgs = YP.getFunctorArgs(Term);

    var pred = new Variable();
    for (var l1 in State._pred.match([functorName, functorArgs.length, pred, Atom.a("det")])) {
      if (CompilerState.isNoneOut(YP.getFunctorArgs(pred.getValue()))) {
        return true;
      }
    }

    return false;
  }

  static isSemidetNoneOut(State, Term) {
    State = YP.getValue(State);
    var functorName = YP.getFunctorName(Term);
    var functorArgs = YP.getFunctorArgs(Term);

    var pred = new Variable();
    for (var l1 in State._pred.match([functorName, functorArgs.length, pred, Atom.a("semidet")])) {
      if (CompilerState.isNoneOut(YP.getFunctorArgs(pred.getValue()))) {
        return true;
      }
    }

    return false;
  }

// Return false if any of args is out, otherwise true.
// args is an array of ::(Type,Mode) where Mode is in or out.
  static isNoneOut = function(args: any[]) {
    for (var arg of args) {
      if (arg instanceof Functor2 && arg.name == Atom.a("::") && arg.arg2 == Atom.a("out"))
        return false;
    }
    return true;
  }

  static nameArityHasModule(State, Name, Arity: number, Module) {
    State = YP.getValue(State);
    Name = YP.getValue(Name);
    Arity = YP.getValue(Arity);
    Module = YP.getValue(Module);
    if (Name instanceof Atom && typeof(Arity) == "number") {
      var FoundModule = State._moduleForNameArity[Name + "/" + Arity];
      if (!FoundModule === undefined)
        return false;
      return FoundModule == Module;
    }
    return false;
  }

}
