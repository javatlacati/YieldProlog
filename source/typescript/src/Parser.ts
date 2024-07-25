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

import {Variable} from "./Variable";
import {YP} from "./YP";
import {PrologException} from "./PrologException";
import {Atom} from "./Atom";
import {Functor1} from "./Functor1";
import {ListPair} from "./ListPair";
import {FindallAnswers} from "./FindallAnswers";
import {Functor2} from "./Functor2";
import {Functor3} from "./Functor3";
import {Functor} from "./Functor";

export class Parser {

  constructor() {
  }

  static *read_term2(Term, Options) {
    let Answer = new Variable();
    let Variables = new Variable();
    for (let l1 of Parser.read_termOptions(Options, Variables)) {
      for (let l2 of portable_read3(Answer, Variables, new Variable())) {
        for (let l3 of remove_pos(Answer, Term))
        yield false;
      }
    }
  }

  static *read_term3(Input, Term, Options) {
    let SaveInput = new Variable();
    let Answer = new Variable();
    let Variables = new Variable();
    for (let l1 of Parser.read_termOptions(Options, Variables)) {
      for (let l2 of YP.current_input(SaveInput)) {
        try {
          YP.see(Input);
          for (let l3 in portable_read3(Answer, Variables, new Variable())) {
            for (let l4 in remove_pos(Answer, Term))
            yield false;
          }
        }
        finally {
          YP.see(SaveInput);
        }
      }
    }
  }

// For read_term, check if Options has variable_names(Variables).
// Otherwise, ignore Options.
  static *read_termOptions(Options, Variables) {
    Options = YP.getValue(Options);
    if (Options instanceof Variable)
      throw new PrologException(Atom.a("instantiation_error"), "Options is an unbound variable");
    // First try to match Options = [variable_names(Variables)]
    for (let l1 of YP.unify(Options, ListPair.make(new Functor1("variable_names", Variables)))){
      yield false;
      return;
    }
    // Default: Ignore Options.
    yield false;
  }

  static read1(Term) {
    return Parser.read_term2(Term, Atom.NIL);
  }

  static read2(Input, Term) {
    return Parser.read_term3(Input, Term, Atom.NIL);
  }

}


function *formatError(Output:any, Format:any, Arguments: any) {
    // Debug: Simple implementation for now.
    YP.write(Format);
    YP.write(Arguments);
    YP.nl();
    yield false;
}

// Debug: Hand-modify this central predicate to do tail recursion.
function *read_tokens(arg1: Variable, arg2, arg3: Variable) {
    let repeat = true;
    while (repeat) {
        repeat = false;

        cutIf9:
        cutIf8:
        cutIf7:
        cutIf6:
        cutIf5:
        cutIf4:
        cutIf3:
        cutIf2:
        cutIf1:
        {
            let C1 = arg1;
            let Dict = arg2;
            let Tokens = arg3;
            let C2 = new Variable();
            if (YP.lessThanOrEqual(C1, new ListPair(32, Atom.NIL))) {
                if (YP.greaterThanOrEqual(C1, 0)) {
                    for (let l4 of YP.get_code(C2)) {
/*
                        for (let l5 in read_tokens(C2, Dict, Tokens)) {
                            yield false;
                        }
*/
                        arg1 = YP.getValue(C2);
                        arg2 = YP.getValue(Dict);
                        arg3 = YP.getValue(Tokens);
                        repeat = true;
                    }
                }
                break cutIf1;
            }
            if (YP.greaterThanOrEqual(C1, new ListPair(97, Atom.NIL))) {
                if (YP.lessThanOrEqual(C1, new ListPair(122, Atom.NIL))) {
                    for (let l4 of read_identifier(C1, Dict, Tokens)) {
                        yield false;
                    }
                    break cutIf2;
                }
            }
            if (YP.greaterThanOrEqual(C1, new ListPair(65, Atom.NIL))) {
                if (YP.lessThanOrEqual(C1, new ListPair(90, Atom.NIL))) {
                    for (let l4 of read_variable(C1, Dict, Tokens)) {
                        yield false;
                    }
                    break cutIf3;
                }
            }
            if (YP.greaterThanOrEqual(C1, new ListPair(48, Atom.NIL))) {
                if (YP.lessThanOrEqual(C1, new ListPair(57, Atom.NIL))) {
                    for (let l4 of read_number(C1, Dict, Tokens)) {
                        yield false;
                    }
                    break cutIf4;
                }
            }
            if (YP.lessThan(C1, 127)) {
                for (let l3 of read_special(C1, Dict, Tokens)) {
                    yield false;
                }
                break cutIf5;
            }
            if (YP.lessThanOrEqual(C1, 160)) {
                for (let l3 in YP.get_code(C2)) {
/*
                    for (let l4 in read_tokens(C2, Dict, Tokens)) {
                        yield false;
                    }
*/
                    arg1 = YP.getValue(C2);
                    arg2 = YP.getValue(Dict);
                    arg3 = YP.getValue(Tokens);
                    repeat = true;
                }
                break cutIf6;
            }
            if (YP.greaterThanOrEqual(C1, 223)) {
                if (YP.notEqual(C1, 247)) {
                    for (let l4 in read_identifier(C1, Dict, Tokens)) {
                        yield false;
                    }
                    break cutIf7;
                }
            }
            if (YP.greaterThanOrEqual(C1, 192)) {
                if (YP.notEqual(C1, 215)) {
                    for (let l4 in read_variable(C1, Dict, Tokens)) {
                        yield false;
                    }
                    break cutIf8;
                }
            }
            if (YP.notEqual(C1, 170)) {
                if (YP.notEqual(C1, 186)) {
                    for (let l4 in read_symbol(C1, Dict, Tokens)) {
                        yield false;
                    }
                    break cutIf9;
                }
            }
            for (let l2 in read_identifier(C1, Dict, Tokens)) {
                yield false;
            }
        }
    }
}

// Compiler output follows.

function getDeclaringClass() { return null; }

function *parseInput(TermList) {
  {
    let TermAndVariables = new Variable();
    let findallAnswers1 = new FindallAnswers(TermAndVariables);
    for (let l2 in parseInputHelper(TermAndVariables)) {
      findallAnswers1.add();
    }
    for (let l2 in findallAnswers1.result(TermList)) {
      yield false;
    }
  }
}

function *parseInputHelper(arg1: Variable) {
  {
    let Term = new Variable();
    let Variables = new Variable();
    let Answer = new Variable();
    let x4 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("f", Term, Variables))) {
      for (let l3 in YP.repeat()) {
        for (let l4 in portable_read3(Answer, Variables, x4)) {
          for (let l5 in remove_pos(Answer, Term)) {
            cutIf1:
            {
              if (YP.termEqual(Term, Atom.a("end_of_file"))) {
                return;
                break cutIf1;
              }
              yield false;
            }
          }
        }
      }
    }
  }
}

function *clear_errors() {
  {
    yield false;
  }
}

function *remove_pos(arg1, arg2) {
  {
    let X = new Variable();
    for (let l2 of YP.unify(arg1, X)) {
      for (let l3 of YP.unify(arg2, X)) {
        if (YP.var(X)) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let X = arg2;
    let _Pos = new Variable();
    let _Name = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("$VAR", _Pos, _Name, X))) {
      if (YP.var(X)) {
        yield true;
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let H = new Variable();
    let T = new Variable();
    let NH = new Variable();
    let NT = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(H, T))) {
      for (let l3 of YP.unify(arg2, new ListPair(NH, NT))) {
        for (let l4 in remove_pos(H, NH)) {
          for (let l5 in remove_pos(T, NT)) {
            yield false;
          }
        }
        return;
      }
    }
  }
  {
    let A = new Variable();
    let B = new Variable();
    let NA = new Variable();
    let NB = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2(",", A, B))) {
      for (let l3 of YP.unify(arg2, new Functor2(",", NA, NB))) {
        for (let l4 in remove_pos(A, NA)) {
          for (let l5 in remove_pos(B, NB)) {
            yield false;
          }
        }
        return;
      }
    }
  }
  {
    let Atom_1 = new Variable();
    let _F = new Variable();
    for (let l2 of YP.unify(arg1, Atom_1)) {
      for (let l3 of YP.unify(arg2, Atom_1)) {
        for (let l4 in YP.functor(Atom_1, _F, 0)) {
          yield false;
        }
      }
    }
  }
  {
    let Term = arg1;
    let NewTerm = arg2;
    let Func = new Variable();
    let _Pos = new Variable();
    let Args = new Variable();
    let NArgs = new Variable();
    if (YP.nonvar(Term)) {
      for (let l3 in YP.univ(Term, new ListPair(Func, new ListPair(_Pos, Args)))) {
        for (let l4 in remove_pos(Args, NArgs)) {
          for (let l5 in YP.univ(NewTerm, new ListPair(Func, NArgs))) {
            yield false;
          }
        }
      }
    }
  }
}

function *portable_read_position(Term, PosTerm, Syntax) {
  {
    for (let l2 in portable_read(PosTerm, Syntax)) {
      for (let l3 in remove_pos(PosTerm, Term)) {
        yield false;
      }
    }
  }
}

function *portable_read(Answer, Syntax) {
  {
    let Tokens = new Variable();
    let ParseTokens = new Variable();
    for (let l2 in read_tokens1(Tokens)) {
      for (let l3 in remove_comments(Tokens, ParseTokens, Syntax)) {
        for (let l4 in parse2(ParseTokens, Answer)) {
          yield false;
        }
      }
    }
  }
}

function *portable_read3(Answer: Variable, Variables, Syntax) {
  {
    let Tokens = new Variable();
    let ParseTokens = new Variable();
    for (let l2 of read_tokens2(Tokens, Variables)) {
      for (let l3 of remove_comments(Tokens, ParseTokens, Syntax)) {
        for (let l4 of parse2(ParseTokens, Answer)) {
          yield false;
        }
      }
    }
  }
}

function *remove_comments(arg1, arg2, arg3) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        for (let l4 of YP.unify(arg3, Atom.NIL)) {
          yield false;
        }
      }
    }
  }
  {
    let Ys = arg2;
    let S = new Variable();
    let E = new Variable();
    let Xs = new Variable();
    let Zs = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("comment", S, E), Xs))) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("comment", S, E), Zs))) {
        for (let l4 in remove_comments(Xs, Ys, Zs)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let Pos = new Variable();
    let Xs = new Variable();
    let Ys = new Variable();
    let Pos2 = new Variable();
    let Zs = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("/", Atom.a("["), Pos), Xs))) {
      for (let l3 of YP.unify(arg2, new ListPair(Atom.a("["), Ys))) {
        for (let l4 of YP.unify(arg3, new ListPair(new Functor2("list", Pos, Pos2), Zs))) {
          for (let l5 of YP.unify(Pos2, YP.add(Pos, 1))) {
            for (let l6 in remove_comments(Xs, Ys, Zs)) {
              yield false;
            }
          }
          return;
        }
      }
    }
  }
  {
    let Pos = new Variable();
    let Xs = new Variable();
    let Ys = new Variable();
    let Pos2 = new Variable();
    let Zs = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("/", Atom.a("]"), Pos), Xs))) {
      for (let l3 of YP.unify(arg2, new ListPair(Atom.a("]"), Ys))) {
        for (let l4 of YP.unify(arg3, new ListPair(new Functor2("list", Pos, Pos2), Zs))) {
          for (let l5 of YP.unify(Pos2, YP.add(Pos, 1))) {
            for (let l6 in remove_comments(Xs, Ys, Zs)) {
              yield false;
            }
          }
          return;
        }
      }
    }
  }
  {
    let Zs = arg3;
    let Token = new Variable();
    let Xs = new Variable();
    let Ys = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, Xs))) {
      for (let l3 of YP.unify(arg2, new ListPair(Token, Ys))) {
        for (let l4 in remove_comments(Xs, Ys, Zs)) {
          yield false;
        }
      }
    }
  }
}

function *expect(Token: Atom, arg2: Variable, arg3) {
  {
    let Rest = arg3;
    for (let l2 of YP.unify(arg2, new ListPair(Token, Rest))) {
      yield true;
      return;
    }
  }
  {
    let S0 = arg2;
    let x3 = arg3;
    for (let l2 in syntax_error(ListPair.make([Token, Atom.a("or"), Atom.a("operator"), Atom.a("expected")]), S0)) {
      yield false;
    }
  }
}

function *parse2(Tokens, Answer) {
  {
    let Term = new Variable();
    let LeftOver = new Variable();
    for (let l2 of clear_errors()) {
      for (let l3 of parse(Tokens, 1200, Term, LeftOver)) {
        for (let l4 of all_read(LeftOver)) {
          for (let l5 of YP.unify(Answer, Term)) {
            yield false;
          }
          return;
        }
      }
      for  (let l3 of syntax_error1(Tokens)) {
        yield false;
      }
    }
  }
}

function *all_read(arg1: Variable) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      yield false;
    }
  }
  {
    let Token = new Variable();
    let S = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, S))) {
      for (let l3 of syntax_error(ListPair.make([Atom.a("operator"), Atom.a("expected"), Atom.a("after"), Atom.a("expression")]), new ListPair(Token, S))) {
        yield false;
      }
    }
  }
}

function *parse(arg1, arg2, arg3, arg4) {
  {
    let x1 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of syntax_error(new ListPair(Atom.a("expression"), new ListPair(Atom.a("expected"), Atom.NIL)), Atom.NIL)) {
        yield false;
      }
    }
  }
  {
    let Precedence = arg2;
    let Term = arg3;
    let LeftOver = arg4;
    let Token = new Variable();
    let RestTokens = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, RestTokens))) {
      for (let l3 in parse5(Token, RestTokens, Precedence, Term, LeftOver)) {
        yield false;
      }
    }
  }
}

function *parse5(arg1, arg2, arg3, arg4, arg5) {
  {
    let S0 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    for (let l2 of YP.unify(arg1, Atom.a("}"))) {
      for (let l3 in cannot_start(Atom.a("}"), S0)) {
        yield false;
      }
    }
  }
  {
    let S0 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    for (let l2 of YP.unify(arg1, Atom.a("]"))) {
      for (let l3 in cannot_start(Atom.a("]"), S0)) {
        yield false;
      }
    }
  }
  {
    let S0 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    for (let l2 of YP.unify(arg1, Atom.a(")"))) {
      for (let l3 in cannot_start(Atom.a(")"), S0)) {
        yield false;
      }
    }
  }
  {
    let S0 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    for (let l2 of YP.unify(arg1, Atom.a(","))) {
      for (let l3 in cannot_start(Atom.a(","), S0)) {
        yield false;
      }
    }
  }
  {
    let S0 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    for (let l2 of YP.unify(arg1, Atom.a("|"))) {
      for (let l3 in cannot_start(Atom.a("|"), S0)) {
        yield false;
      }
    }
  }
  {
    let S0 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Codes = new Variable();
    let Term = new Variable();
    let A = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("string", Codes))) {
      cutIf1:
      {
        for (let l4 in YP.current_prolog_flag(Atom.a("double_quotes"), Atom.a("atom"))) {
          for (let l5 in YP.atom_codes(Term, Codes)) {
            for (let l6 in exprtl0(S0, Term, Precedence, Answer, S)) {
              yield false;
            }
          }
          break cutIf1;
        }
        cutIf2:
        {
          for (let l5 in YP.current_prolog_flag(Atom.a("double_quotes"), Atom.a("chars"))) {
            for (let l6 in YP.atom_codes(A, Codes)) {
              for (let l7 in YP.atom_chars(A, Term)) {
                for (let l8 in exprtl0(S0, Term, Precedence, Answer, S)) {
                  yield false;
                }
              }
            }
            break cutIf2;
          }
          for (let l5 of YP.unify(Term, Codes)) {
            for (let l6 of exprtl0(S0, Term, Precedence, Answer, S)) {
              yield false;
            }
          }
        }
      }
    }
  }
  {
    let S0 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Number = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("number", Number))) {
      for (let l3 in exprtl0(S0, Number, Precedence, Answer, S)) {
        yield false;
      }
    }
  }
  {
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("["))) {
      for (let l3 of YP.unify(arg2, new ListPair(Atom.a("]"), S1))) {
        for (let l4 in read_atom(new Functor2("/", Atom.NIL, 0), S1, Precedence, Answer, S)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let S1 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Arg1 = new Variable();
    let S2 = new Variable();
    let RestArgs = new Variable();
    let S3 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("["))) {
      for (let l3 in parse(S1, 999, Arg1, S2)) {
        for (let l4 in read_list(S2, RestArgs, S3)) {
          for (let l5 in exprtl0(S3, new ListPair(Arg1, RestArgs), Precedence, Answer, S)) {
            yield false;
          }
          return;
        }
      }
    }
  }
  {
    let S1 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Term = new Variable();
    let S2 = new Variable();
    let S3 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("("))) {
      for (let l3 in parse(S1, 1200, Term, S2)) {
        for (let l4 in expect(Atom.a(")"), S2, S3)) {
          for (let l5 in exprtl0(S3, Term, Precedence, Answer, S)) {
            yield false;
          }
          return;
        }
      }
    }
  }
  {
    let S1 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Term = new Variable();
    let S2 = new Variable();
    let S3 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a(" ("))) {
      for (let l3 in parse(S1, 1200, Term, S2)) {
        for (let l4 in expect(Atom.a(")"), S2, S3)) {
          for (let l5 in exprtl0(S3, Term, Precedence, Answer, S)) {
            yield false;
          }
          return;
        }
      }
    }
  }
  {
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let _Pos = new Variable();
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", Atom.a("{"), _Pos))) {
      for (let l3 of YP.unify(arg2, new ListPair(Atom.a("}"), S1))) {
        for (let l4 in read_atom(Atom.a("{}"), S1, Precedence, Answer, S)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let S1 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Pos = new Variable();
    let Term = new Variable();
    let S2 = new Variable();
    let S3 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", Atom.a("{"), Pos))) {
      for (let l3 in parse(S1, 1200, Term, S2)) {
        for (let l4 in expect(Atom.a("}"), S2, S3)) {
          for (let l5 in exprtl0(S3, new Functor2("{}", Pos, Term), Precedence, Answer, S)) {
            yield false;
          }
          return;
        }
      }
    }
  }
  {
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Variable_1 = new Variable();
    let Name = new Variable();
    let Pos = new Variable();
    let S1 = new Variable();
    let Arg1 = new Variable();
    let S2 = new Variable();
    let RestArgs = new Variable();
    let S3 = new Variable();
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("var", Variable_1, Name, Pos))) {
      for (let l3 of YP.unify(arg2, new ListPair(Atom.a("("), S1))) {
        for (let l4 in parse(S1, 999, Arg1, S2)) {
          for (let l5 in read_args(S2, RestArgs, S3)) {
            for (let l6 in YP.univ(Term, new ListPair(Atom.a("call"), new ListPair(new Functor3("$VAR", Pos, Name, Variable_1), new ListPair(Arg1, RestArgs))))) {
              for (let l7 in exprtl0(S3, Term, Precedence, Answer, S)) {
                yield false;
              }
            }
            return;
          }
        }
        return;
      }
    }
  }
  {
    let S0 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Variable_1 = new Variable();
    let Name = new Variable();
    let Pos = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("var", Variable_1, Name, Pos))) {
      for (let l3 in exprtl0(S0, new Functor3("$VAR", Pos, Name, Variable_1), Precedence, Answer, S)) {
        yield false;
      }
    }
  }
  {
    let S0 = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Atom_1 = new Variable();
    let P = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("atom", Atom_1, P))) {
      for (let l3 in read_atom(new Functor2("/", Atom_1, P), S0, Precedence, Answer, S)) {
        yield false;
      }
    }
  }
}

function *read_atom(arg1, arg2, Precedence, Answer, S) {
  {
    let _Pos = new Variable();
    let Number = new Variable();
    let S1 = new Variable();
    let Negative = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", Atom.a("-"), _Pos))) {
      for (let l3 of YP.unify(arg2, new ListPair(new Functor1("number", Number), S1))) {
        for (let l4 of YP.unify(Negative, YP.negate(Number))) {
          for (let l5 in exprtl0(S1, Negative, Precedence, Answer, S)) {
            yield false;
          }
        }
        return;
      }
    }
  }
  {
    let Functor_1 = new Variable();
    let Pos = new Variable();
    let S1 = new Variable();
    let Arg1 = new Variable();
    let S2 = new Variable();
    let RestArgs = new Variable();
    let S3 = new Variable();
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", Functor_1, Pos))) {
      for (let l3 of YP.unify(arg2, new ListPair(Atom.a("("), S1))) {
        for (let l4 in parse(S1, 999, Arg1, S2)) {
          for (let l5 in read_args(S2, RestArgs, S3)) {
            for (let l6 in YP.univ(Term, new ListPair(Functor_1, new ListPair(Pos, new ListPair(Arg1, RestArgs))))) {
              for (let l7 in exprtl0(S3, Term, Precedence, Answer, S)) {
                yield false;
              }
            }
            return;
          }
        }
        return;
      }
    }
  }
  {
    let S0 = arg2;
    let Op = new Variable();
    let Pos = new Variable();
    let Oprec = new Variable();
    let Aprec = new Variable();
    let Flag = new Variable();
    let Term = new Variable();
    let Arg = new Variable();
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", Op, Pos))) {
      for (let l3 in prefixop(Op, Oprec, Aprec)) {
        for (let l4 in possible_right_operand(S0, Flag)) {
          cutIf1:
          {
            if (YP.lessThan(Flag, 0)) {
              for (let l7 in YP.univ(Term, new ListPair(Op, new ListPair(Pos, Atom.NIL)))) {
                for (let l8 in exprtl0(S0, Term, Precedence, Answer, S)) {
                  yield false;
                }
              }
              break cutIf1;
            }
            cutIf2:
            {
              if (YP.greaterThan(Oprec, Precedence)) {
                for (let l8 in syntax_error(ListPair.make([Atom.a("prefix"), Atom.a("operator"), Op, Atom.a("in"), Atom.a("context"), Atom.a("with"), Atom.a("precedence"), Precedence]), S0)) {
                  yield false;
                }
                break cutIf2;
              }
              cutIf3:
              {
                if (YP.greaterThan(Flag, 0)) {
                  for (let l9 in parse(S0, Aprec, Arg, S1)) {
                    for (let l10 in YP.univ(Term, ListPair.make([Op, Pos, Arg]))) {
                      for (let l11 in exprtl(S1, Oprec, Term, Precedence, Answer, S)) {
                        yield false;
                      }
                    }
                    return;
                  }
                  break cutIf3;
                }
                for (let l8 in peepop(S0, S1)) {
                  for (let l9 in prefix_is_atom(S1, Oprec)) {
                    for (let l10 in exprtl(S1, Oprec, new Functor2("/", Op, Pos), Precedence, Answer, S)) {
                      yield false;
                    }
                  }
                }
                for (let l8 in parse(S0, Aprec, Arg, S1)) {
                  for (let l9 in YP.univ(Term, ListPair.make([Op, Pos, Arg]))) {
                    for (let l10 in exprtl(S1, Oprec, Term, Precedence, Answer, S)) {
                      yield false;
                    }
                  }
                  return;
                }
              }
            }
          }
        }
        return;
      }
    }
  }
  {
    let S0 = arg2;
    let Atom_1 = new Variable();
    let Pos = new Variable();
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", Atom_1, Pos))) {
      for (let l3 in YP.univ(Term, new ListPair(Atom_1, new ListPair(Pos, Atom.NIL)))) {
        for (let l4 in exprtl0(S0, Term, Precedence, Answer, S)) {
          yield false;
        }
      }
    }
  }
}

function *cannot_start(Token, S0) {
  {
    for (let l2 in syntax_error(ListPair.make([Token, Atom.a("cannot"), Atom.a("start"), Atom.a("an"), Atom.a("expression")]), S0)) {
      yield false;
    }
  }
}

function *read_args(arg1, arg2, arg3) {
  {
    let S = arg3;
    let S1 = new Variable();
    let Term = new Variable();
    let Rest = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a(","), S1))) {
      for (let l3 of YP.unify(arg2, new ListPair(Term, Rest))) {
        for (let l4 in parse(S1, 999, Term, S2)) {
          for (let l5 in read_args(S2, Rest, S)) {
            yield false;
          }
          return;
        }
        return;
      }
    }
  }
  {
    let S = arg3;
    for (let l2 of YP.unify(arg1, new ListPair(Atom.a(")"), S))) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        yield true;
        return;
      }
    }
  }
  {
    let S = arg1;
    let x2 = arg2;
    let x3 = arg3;
    for (let l2 in syntax_error(ListPair.make([Atom.a(", or )"), Atom.a("expected"), Atom.a("in"), Atom.a("arguments")]), S)) {
      yield false;
    }
  }
}

function *read_list(arg1, arg2, arg3) {
  {
    let x1 = arg2;
    let x2 = arg3;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 in syntax_error(ListPair.make([Atom.a(", | or ]"), Atom.a("expected"), Atom.a("in"), Atom.a("list")]), Atom.NIL)) {
        yield false;
      }
    }
  }
  {
    let Rest = arg2;
    let S = arg3;
    let Token = new Variable();
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, S1))) {
      for (let l3 in read_list4(Token, S1, Rest, S)) {
        yield false;
      }
    }
  }
}

function *read_list4(arg1, arg2, arg3, arg4) {
  {
    let S1 = arg2;
    let S = arg4;
    let Term = new Variable();
    let Rest = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a(","))) {
      for (let l3 of YP.unify(arg3, new ListPair(Term, Rest))) {
        for (let l4 in parse(S1, 999, Term, S2)) {
          for (let l5 in read_list(S2, Rest, S)) {
            yield false;
          }
          return;
        }
        return;
      }
    }
  }
  {
    let S1 = arg2;
    let Rest = arg3;
    let S = arg4;
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("|"))) {
      for (let l3 in parse(S1, 999, Rest, S2)) {
        for (let l4 in expect(Atom.a("]"), S2, S)) {
          yield false;
        }
        return;
      }
      return;
    }
  }
  {
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("]"))) {
      for (let l3 of YP.unify(arg2, S1)) {
        for (let l4 of YP.unify(arg3, Atom.NIL)) {
          for (let l5 of YP.unify(arg4, S1)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let Token = arg1;
    let S1 = arg2;
    let x3 = arg3;
    let x4 = arg4;
    for (let l2 in syntax_error(ListPair.make([Atom.a(", | or ]"), Atom.a("expected"), Atom.a("in"), Atom.a("list")]), new ListPair(Token, S1))) {
      yield false;
    }
  }
}

function *possible_right_operand(arg1, arg2) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    let Flag = arg2;
    let H = new Variable();
    let T = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(H, T))) {
      for (let l3 in possible_right_operand3(H, Flag, T)) {
        yield false;
      }
    }
  }
}

function *possible_right_operand3(arg1, arg2, arg3) {
  {
    let x4 = arg3;
    let x1 = new Variable();
    let x2 = new Variable();
    let x3 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("var", x1, x2, x3))) {
      for (let l3 of YP.unify(arg2, 1)) {
        yield false;
      }
    }
  }
  {
    let x2 = arg3;
    let x1 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("number", x1))) {
      for (let l3 of YP.unify(arg2, 1)) {
        yield false;
      }
    }
  }
  {
    let x2 = arg3;
    let x1 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("string", x1))) {
      for (let l3 of YP.unify(arg2, 1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a(" ("))) {
      for (let l3 of YP.unify(arg2, 1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a("("))) {
      for (let l3 of YP.unify(arg2, 0)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a(")"))) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    let x1 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("["))) {
      for (let l3 of YP.unify(arg2, 0)) {
        for (let l4 of YP.unify(arg3, new ListPair(Atom.a("]"), x1))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a("["))) {
      for (let l3 of YP.unify(arg2, 1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a("]"))) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    let x1 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("{"))) {
      for (let l3 of YP.unify(arg2, 0)) {
        for (let l4 of YP.unify(arg3, new ListPair(Atom.a("}"), x1))) {
          yield true;
          return;
        }
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a("{"))) {
      for (let l3 of YP.unify(arg2, 1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a("}"))) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a(","))) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg3;
    for (let l2 of YP.unify(arg1, Atom.a("|"))) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    let x3 = arg3;
    let x1 = new Variable();
    let x2 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("atom", x1, x2))) {
      for (let l3 of YP.unify(arg2, 0)) {
        yield false;
      }
    }
  }
}

function *peepop(arg1, arg2) {
  {
    let F = new Variable();
    let Pos = new Variable();
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("atom", F, Pos), new ListPair(Atom.a("("), S1)))) {
      for (let l3 of YP.unify(arg2, new ListPair(new Functor2("atom", F, Pos), new ListPair(Atom.a("("), S1)))) {
        yield true;
        return;
      }
    }
  }
  {
    let F = new Variable();
    let Pos = new Variable();
    let S1 = new Variable();
    let L = new Variable();
    let P = new Variable();
    let R = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("atom", F, Pos), S1))) {
      for (let l3 of YP.unify(arg2, new ListPair(new Functor(Atom.a("infixop", Atom.a("")), [new Functor2("/", F, Pos), L, P, R]), S1))) {
        for (let l4 in infixop(F, L, P, R)) {
          yield false;
        }
      }
    }
  }
  {
    let F = new Variable();
    let Pos = new Variable();
    let S1 = new Variable();
    let L = new Variable();
    let P = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("atom", F, Pos), S1))) {
      for (let l3 of YP.unify(arg2, new ListPair(new Functor3(Atom.a("postfixop", Atom.a("")), new Functor2("/", F, Pos), L, P), S1))) {
        for (let l4 in postfixop(F, L, P)) {
          yield false;
        }
      }
    }
  }
  {
    let S0 = new Variable();
    for (let l2 of YP.unify(arg1, S0)) {
      for (let l3 of YP.unify(arg2, S0)) {
        yield false;
      }
    }
  }
}

function *prefix_is_atom(arg1, arg2) {
  {
    let Precedence = arg2;
    let Token = new Variable();
    let x2 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, x2))) {
      for (let l3 in prefix_is_atom(Token, Precedence)) {
        yield false;
      }
    }
  }
  {
    let P = arg2;
    let x1 = new Variable();
    let L = new Variable();
    let x3 = new Variable();
    let x4 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor(Atom.a("infixop", Atom.a("")), [x1, L, x3, x4]))) {
      if (YP.greaterThanOrEqual(L, P)) {
        yield false;
      }
    }
  }
  {
    let P = arg2;
    let x1 = new Variable();
    let L = new Variable();
    let x3 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3(Atom.a("postfixop", Atom.a("")), x1, L, x3))) {
      if (YP.greaterThanOrEqual(L, P)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg2;
    for (let l2 of YP.unify(arg1, Atom.a(")"))) {
      yield false;
    }
  }
  {
    let x1 = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("]"))) {
      yield false;
    }
  }
  {
    let x1 = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("}"))) {
      yield false;
    }
  }
  {
    let P = arg2;
    for (let l2 of YP.unify(arg1, Atom.a("|"))) {
      if (YP.greaterThanOrEqual(1100, P)) {
        yield false;
      }
    }
  }
  {
    let P = arg2;
    for (let l2 of YP.unify(arg1, Atom.a(","))) {
      if (YP.greaterThanOrEqual(1000, P)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg2;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      yield false;
    }
  }
}

function *exprtl0(arg1, arg2, arg3, arg4, arg5) {
  {
    let x2 = arg3;
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, Term)) {
        for (let l4 of YP.unify(arg4, Term)) {
          for (let l5 of YP.unify(arg5, Atom.NIL)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let Token = new Variable();
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, S1))) {
      for (let l3 in exprtl0_6(Token, Term, Precedence, Answer, S, S1)) {
        yield false;
      }
    }
  }
}

function *exprtl0_6(arg1, arg2, arg3, arg4, arg5, arg6) {
  {
    let x2 = arg3;
    let S1 = arg6;
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("}"))) {
      for (let l3 of YP.unify(arg2, Term)) {
        for (let l4 of YP.unify(arg4, Term)) {
          for (let l5 of YP.unify(arg5, new ListPair(Atom.a("}"), S1))) {
            yield false;
          }
        }
      }
    }
  }
  {
    let x2 = arg3;
    let S1 = arg6;
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("]"))) {
      for (let l3 of YP.unify(arg2, Term)) {
        for (let l4 of YP.unify(arg4, Term)) {
          for (let l5 of YP.unify(arg5, new ListPair(Atom.a("]"), S1))) {
            yield false;
          }
        }
      }
    }
  }
  {
    let x2 = arg3;
    let S1 = arg6;
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a(")"))) {
      for (let l3 of YP.unify(arg2, Term)) {
        for (let l4 of YP.unify(arg4, Term)) {
          for (let l5 of YP.unify(arg5, new ListPair(Atom.a(")"), S1))) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let S1 = arg6;
    let Next = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a(","))) {
      cutIf1:
      {
        if (YP.greaterThanOrEqual(Precedence, 1000)) {
          for (let l5 of parse(S1, 1000, Next, S2)) {
            for (let l6 in exprtl(S2, 1000, new Functor2(",", Term, Next), Precedence, Answer, S)) {
              yield false;
            }
            return;
          }
          break cutIf1;
        }
        for (let l4 of YP.unify(Answer, Term)) {
          for (let l5 of YP.unify(S, new ListPair(Atom.a(","), S1))) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let S1 = arg6;
    let Next = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("|"))) {
      cutIf2:
      {
        if (YP.greaterThanOrEqual(Precedence, 1100)) {
          for (let l5 in parse(S1, 1100, Next, S2)) {
            for (let l6 in exprtl(S2, 1100, new Functor2(";", Term, Next), Precedence, Answer, S)) {
              yield false;
            }
            return;
          }
          break cutIf2;
        }
        for (let l4 of YP.unify(Answer, Term)) {
          for (let l5 of YP.unify(S, new ListPair(Atom.a("|"), S1))) {
            yield false;
          }
        }
      }
    }
  }
  {
    let x2 = arg2;
    let x3 = arg3;
    let x4 = arg4;
    let x5 = arg5;
    let S1 = arg6;
    let S = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("string", S))) {
      for (let l3 in cannot_follow(Atom.a("chars"), new Functor1("string", S), S1)) {
        yield false;
      }
    }
  }
  {
    let x2 = arg2;
    let x3 = arg3;
    let x4 = arg4;
    let x5 = arg5;
    let S1 = arg6;
    let N = new Variable();
    for (let l2 of YP.unify(arg1, new Functor1("number", N))) {
      for (let l3 in cannot_follow(Atom.a("number"), new Functor1("number", N), S1)) {
        yield false;
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("{"))) {
      for (let l3 of YP.unify(arg6, new ListPair(Atom.a("}"), S1))) {
        for (let l4 in exprtl0_atom(Atom.a("{}"), Term, Precedence, Answer, S, S1)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let x1 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    let S1 = arg6;
    for (let l2 of YP.unify(arg1, Atom.a("{"))) {
      for (let l3 in cannot_follow(Atom.a("brace"), Atom.a("{"), S1)) {
        yield false;
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let S1 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("["))) {
      for (let l3 of YP.unify(arg6, new ListPair(Atom.a("]"), S1))) {
        for (let l4 in exprtl0_atom(Atom.NIL, Term, Precedence, Answer, S, S1)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let x1 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    let S1 = arg6;
    for (let l2 of YP.unify(arg1, Atom.a("["))) {
      for (let l3 in cannot_follow(Atom.a("bracket"), Atom.a("["), S1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    let S1 = arg6;
    for (let l2 of YP.unify(arg1, Atom.a("("))) {
      for (let l3 in cannot_follow(Atom.a("parenthesis"), Atom.a("("), S1)) {
        yield false;
      }
    }
  }
  {
    let x1 = arg2;
    let x2 = arg3;
    let x3 = arg4;
    let x4 = arg5;
    let S1 = arg6;
    for (let l2 of YP.unify(arg1, Atom.a(" ("))) {
      for (let l3 in cannot_follow(Atom.a("parenthesis"), Atom.a("("), S1)) {
        yield false;
      }
    }
  }
  {
    let x4 = arg2;
    let x5 = arg3;
    let x6 = arg4;
    let x7 = arg5;
    let S1 = arg6;
    let A = new Variable();
    let B = new Variable();
    let P = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3("var", A, B, P))) {
      for (let l3 in cannot_follow(Atom.a("variable"), new Functor3("var", A, B, P), S1)) {
        yield false;
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let S1 = arg6;
    let F = new Variable();
    let P = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("atom", F, P))) {
      for (let l3 in exprtl0_atom(new Functor2("/", F, P), Term, Precedence, Answer, S, S1)) {
        yield false;
      }
    }
  }
}

function *exprtl0_atom(arg1, arg2, arg3, arg4, arg5, S1) {
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let F = new Variable();
    let Pos = new Variable();
    let L1 = new Variable();
    let O1 = new Variable();
    let R1 = new Variable();
    let L2 = new Variable();
    let O2 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", F, Pos))) {
      for (let l3 in ambigop(F, Precedence, L1, O1, R1, L2, O2)) {
        for (let l4 in prefix_is_atom(S1, Precedence)) {
          for (let l5 in exprtl(new ListPair(new Functor3(Atom.a("postfixop", Atom.a("")), new Functor2("/", F, Pos), L2, O2), S1), 0, Term, Precedence, Answer, S)) {
            yield false;
          }
          return;
        }
        for (let l4 in exprtl(new ListPair(new Functor(Atom.a("infixop", Atom.a("")), [new Functor2("/", F, Pos), L1, O1, R1]), S1), 0, Term, Precedence, Answer, S)) {
          yield false;
        }
        for (let l4 in exprtl(new ListPair(new Functor3(Atom.a("postfixop", Atom.a("")), new Functor2("/", F, Pos), L2, O2), S1), 0, Term, Precedence, Answer, S)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let F = new Variable();
    let Pos = new Variable();
    let L1 = new Variable();
    let O1 = new Variable();
    let R1 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", F, Pos))) {
      for (let l3 in infixop(F, L1, O1, R1)) {
        for (let l4 in exprtl(new ListPair(new Functor(Atom.a("infixop", Atom.a("")), [new Functor2("/", F, Pos), L1, O1, R1]), S1), 0, Term, Precedence, Answer, S)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let Term = arg2;
    let Precedence = arg3;
    let Answer = arg4;
    let S = arg5;
    let F = new Variable();
    let Pos = new Variable();
    let L2 = new Variable();
    let O2 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor2("/", F, Pos))) {
      for (let l3 in postfixop(F, L2, O2)) {
        for (let l4 in exprtl(new ListPair(new Functor3(Atom.a("postfixop", Atom.a("")), new Functor2("/", F, Pos), L2, O2), S1), 0, Term, Precedence, Answer, S)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    let X = arg1;
    let x2 = arg2;
    let x3 = arg3;
    let x4 = arg4;
    let x5 = arg5;
    let x7 = new Variable();
    for (let l2 in syntax_error(ListPair.make([new Functor2("-", Atom.a("non"), Atom.a("operator")), X, Atom.a("follows"), Atom.a("expression")]), new ListPair(new Functor2("atom", X, x7), S1))) {
      yield false;
    }
    return;
  }
}

function *cannot_follow(Type, Token, Tokens) {
  {
    for (let l2 in syntax_error(ListPair.make([Type, Atom.a("follows"), Atom.a("expression")]), new ListPair(Token, Tokens))) {
      yield false;
    }
  }
}

function *exprtl(arg1, arg2, arg3, arg4, arg5, arg6) {
  {
    let x1 = arg2;
    let x3 = arg4;
    let Term = new Variable();
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg3, Term)) {
        for (let l4 of YP.unify(arg5, Term)) {
          for (let l5 of YP.unify(arg6, Atom.NIL)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let C = arg2;
    let Term = arg3;
    let Precedence = arg4;
    let Answer = arg5;
    let S = arg6;
    let Token = new Variable();
    let Tokens = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(Token, Tokens))) {
      for (let l3 in exprtl_7(Token, C, Term, Precedence, Answer, S, Tokens)) {
        yield false;
      }
    }
  }
}

function *exprtl_7(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  {
    let C = arg2;
    let Term = arg3;
    let Precedence = arg4;
    let Answer = arg5;
    let S = arg6;
    let S1 = arg7;
    let F = new Variable();
    let Pos = new Variable();
    let L = new Variable();
    let O = new Variable();
    let R = new Variable();
    let Other = new Variable();
    let S2 = new Variable();
    let Expr = new Variable();
    for (let l2 of YP.unify(arg1, new Functor(Atom.a("infixop", Atom.a("")), [new Functor2("/", F, Pos), L, O, R]))) {
      if (YP.greaterThanOrEqual(Precedence, O)) {
        if (YP.lessThanOrEqual(C, L)) {
          for (let l5 in parse(S1, R, Other, S2)) {
            for (let l6 in YP.univ(Expr, ListPair.make([F, Pos, Term, Other]))) {
              for (let l7 in exprtl(S2, O, Expr, Precedence, Answer, S)) {
                yield false;
              }
            }
          }
          return;
        }
      }
    }
  }
  {
    let C = arg2;
    let Term = arg3;
    let Precedence = arg4;
    let Answer = arg5;
    let S = arg6;
    let S1 = arg7;
    let F = new Variable();
    let Pos = new Variable();
    let L = new Variable();
    let O = new Variable();
    let Expr = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, new Functor3(Atom.a("postfixop", Atom.a("")), new Functor2("/", F, Pos), L, O))) {
      if (YP.greaterThanOrEqual(Precedence, O)) {
        if (YP.lessThanOrEqual(C, L)) {
          for (let l5 in YP.univ(Expr, ListPair.make([F, Pos, Term]))) {
            for (let l6 in peepop(S1, S2)) {
              for (let l7 in exprtl(S2, O, Expr, Precedence, Answer, S)) {
                yield false;
              }
            }
          }
          return;
        }
      }
    }
  }
  {
    let C = arg2;
    let Term = arg3;
    let Precedence = arg4;
    let Answer = arg5;
    let S = arg6;
    let S1 = arg7;
    let Next = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a(","))) {
      if (YP.greaterThanOrEqual(Precedence, 1000)) {
        if (YP.lessThan(C, 1000)) {
          for (let l5 in parse(S1, 1000, Next, S2)) {
            for (let l6 in exprtl(S2, 1000, new Functor2(",", Term, Next), Precedence, Answer, S)) {
              yield false;
            }
          }
          return;
        }
      }
    }
  }
  {
    let C = arg2;
    let Term = arg3;
    let Precedence = arg4;
    let Answer = arg5;
    let S = arg6;
    let S1 = arg7;
    let Next = new Variable();
    let S2 = new Variable();
    for (let l2 of YP.unify(arg1, Atom.a("|"))) {
      if (YP.greaterThanOrEqual(Precedence, 1100)) {
        if (YP.lessThan(C, 1100)) {
          for (let l5 in parse(S1, 1100, Next, S2)) {
            for (let l6 in exprtl(S2, 1100, new Functor2(";", Term, Next), Precedence, Answer, S)) {
              yield false;
            }
          }
          return;
        }
      }
    }
  }
  {
    let Token = arg1;
    let x2 = arg2;
    let x4 = arg4;
    let Tokens = arg7;
    let Term = new Variable();
    for (let l2 of YP.unify(arg3, Term)) {
      for (let l3 of YP.unify(arg5, Term)) {
        for (let l4 of YP.unify(arg6, new ListPair(Token, Tokens))) {
          yield false;
        }
      }
    }
  }
}

function *syntax_error(_Message, _List: any) {
  {
    return;
  }
  {
    for (let l2 of YP.fail()) {
      yield false;
    }
  }
}

function *syntax_error1(_List) {
  {
    return;
  }
  {
    for (let l2 of YP.fail()) {
      yield false;
    }
  }
}

function *prefixop(F:Variable, O, Q) {
  {
    cutIf1:
    {
      for (let l3 of YP.current_op(O, Atom.a("fx"), F)) {
        for (let l4 of YP.unify(Q, YP.subtract(O, 1))) {
          yield false;
        }
        break cutIf1;
      }
      cutIf2:
      {
        for (let l4 of YP.current_op(O, Atom.a("fy"), F)) {
          for (let l5 of YP.unify(Q, O)) {
            yield false;
          }
          break cutIf2;
        }
      }
    }
  }
}

function *postfixop(F, P, O) {
  {
    cutIf1:
    {
      for (let l3 in YP.current_op(O, Atom.a("xf"), F)) {
        for (let l4 of YP.unify(P, YP.subtract(O, 1))) {
          yield false;
        }
        break cutIf1;
      }
      cutIf2:
      {
        for (let l4 in YP.current_op(O, Atom.a("yf"), F)) {
          for (let l5 of YP.unify(P, O)) {
            yield false;
          }
          break cutIf2;
        }
      }
    }
  }
}

function *infixop(F, P, O, Q) {
  {
    cutIf1:
    {
      for (let l3 in YP.current_op(O, Atom.a("xfy"), F)) {
        for (let l4 of YP.unify(P, YP.subtract(O, 1))) {
          for (let l5 of YP.unify(Q, O)) {
            yield false;
          }
        }
        break cutIf1;
      }
      cutIf2:
      {
        for (let l4 in YP.current_op(O, Atom.a("xfx"), F)) {
          for (let l5 of YP.unify(P, YP.subtract(O, 1))) {
            for (let l6 of YP.unify(Q, P)) {
              yield false;
            }
          }
          break cutIf2;
        }
        cutIf3:
        {
          for (let l5 in YP.current_op(O, Atom.a("yfx"), F)) {
            for (let l6 of YP.unify(Q, YP.subtract(O, 1))) {
              for (let l7 of YP.unify(P, O)) {
                yield false;
              }
            }
            break cutIf3;
          }
        }
      }
    }
  }
}

function *ambigop(F, Precedence, L1, O1, R1, L2, O2) {
  {
    for (let l2 in postfixop(F, L2, O2)) {
      if (YP.lessThanOrEqual(O2, Precedence)) {
        for (let l4 in infixop(F, L1, O1, R1)) {
          if (YP.lessThanOrEqual(O1, Precedence)) {
            yield false;
          }
        }
      }
    }
  }
}

function *read_tokens1(arg1) {
  {
    let TokenList = arg1;
    let C1 = new Variable();
    let _X = new Variable();
    let ListOfTokens = new Variable();
    for (let l2 in YP.get_code(C1)) {
      for (let l3 in read_tokens(C1, _X, ListOfTokens)) {
        for (let l4 of YP.unify(TokenList, ListOfTokens)) {
          yield false;
        }
        return;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("atom", Atom.a("end_of_file"), 0), Atom.NIL))) {
      yield false;
    }
  }
}

function *read_tokens2(arg1: Variable, arg2) {
  {
    let TokenList = arg1;
    let Dictionary = arg2;
    let C1 = new Variable();
    let Dict = new Variable();
    let ListOfTokens = new Variable();
    for (let l2 in YP.get_code(C1)) {
      for (let l3 in read_tokens(C1, Dict, ListOfTokens)) {
        for (let l4 in terminate_list(Dict)) {
          for (let l5 of YP.unify(Dictionary, Dict)) {
            for (let l6 of YP.unify(TokenList, ListOfTokens)) {
              yield false;
            }
          }
          return;
        }
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("atom", Atom.a("end_of_file"), 0), Atom.NIL))) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        yield false;
      }
    }
  }
}

function *terminate_list(arg1) {
  {
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      yield false;
    }
  }
  {
    let x1 = new Variable();
    let Tail = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(x1, Tail))) {
      for (let l3 in terminate_list(Tail)) {
        yield false;
      }
    }
  }
}

function *read_special(arg1, Dict, arg3) {
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 95)) {
      for (let l3 in read_variable(95, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 247)) {
      for (let l3 in read_symbol(247, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 215)) {
      for (let l3 in read_symbol(215, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let StartPos = new Variable();
    let EndPos = new Variable();
    let Tokens = new Variable();
    let Ch = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 37)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("comment", StartPos, EndPos), Tokens))) {
        for (let l4 in get_current_position(StartPos)) {
          for (let l5 in YP.repeat()) {
            for (let l6 in YP.get_code(Ch)) {
              if (YP.lessThan(Ch, new ListPair(32, Atom.NIL))) {
                if (YP.notEqual(Ch, 9)) {
                  if (YP.termNotEqual(Ch, -1)) {
                    for (let l10 in get_current_position(EndPos)) {
                      for (let l11 in YP.get_code(NextCh)) {
                        for (let l12 in read_tokens(NextCh, Dict, Tokens)) {
                          yield false;
                        }
                      }
                    }
                  }
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
    let T = arg3;
    let C2 = new Variable();
    let StartPos = new Variable();
    let EndPos = new Variable();
    let Tokens = new Variable();
    let StartPos1 = new Variable();
    let NextCh = new Variable();
    let Chars = new Variable();
    for (let l2 of YP.unify(arg1, 47)) {
      for (let l3 in YP.get_code(C2)) {
        cutIf1:
        {
          if (YP.equal(C2, new ListPair(42, Atom.NIL))) {
            for (let l6 of YP.unify(T, new ListPair(new Functor2("comment", StartPos, EndPos), Tokens))) {
              for (let l7 in get_current_position(StartPos1)) {
                for (let l8 of YP.unify(StartPos, YP.subtract(StartPos1, 1))) {
                  for (let l9 in read_solidus(32, NextCh)) {
                    for (let l10 in get_current_position(EndPos)) {
                      for (let l11 in read_tokens(NextCh, Dict, Tokens)) {
                        yield false;
                      }
                    }
                  }
                }
              }
            }
            break cutIf1;
          }
          for (let l5 of YP.unify(T, Tokens)) {
            for (let l6 in rest_symbol(C2, Chars, NextCh)) {
              for (let l7 in read_after_atom4(NextCh, Dict, Tokens, new ListPair(47, Chars))) {
                yield false;
              }
            }
          }
        }
      }
    }
  }
  {
    let Pos = new Variable();
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 33)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("atom", Atom.a("!"), Pos), Tokens))) {
        for (let l4 in get_current_position(Pos)) {
          for (let l5 in YP.get_code(NextCh)) {
            for (let l6 in read_after_atom(NextCh, Dict, Tokens)) {
              yield false;
            }
          }
        }
      }
    }
  }
  {
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 40)) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a(" ("), Tokens))) {
        for (let l4 in YP.get_code(NextCh)) {
          for (let l5 in read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 41)) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a(")"), Tokens))) {
        for (let l4 in YP.get_code(NextCh)) {
          for (let l5 in read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 44)) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a(","), Tokens))) {
        for (let l4 in YP.get_code(NextCh)) {
          for (let l5 in read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Pos = new Variable();
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 59)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("atom", Atom.a(";"), Pos), Tokens))) {
        for (let l4 in get_current_position(Pos)) {
          for (let l5 in YP.get_code(NextCh)) {
            for (let l6 in read_after_atom(NextCh, Dict, Tokens)) {
              yield false;
            }
          }
        }
      }
    }
  }
  {
    let Pos = new Variable();
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 91)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("/", Atom.a("["), Pos), Tokens))) {
        for (let l4 in get_current_position(Pos)) {
          for (let l5 in YP.get_code(NextCh)) {
            for (let l6 in read_tokens(NextCh, Dict, Tokens)) {
              yield false;
            }
          }
        }
      }
    }
  }
  {
    let Pos = new Variable();
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 93)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("/", Atom.a("]"), Pos), Tokens))) {
        for (let l4 in get_current_position(Pos)) {
          for (let l5 in YP.get_code(NextCh)) {
            for (let l6 in read_after_atom(NextCh, Dict, Tokens)) {
              yield false;
            }
          }
        }
      }
    }
  }
  {
    let Pos = new Variable();
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 123)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor2("/", Atom.a("{"), Pos), Tokens))) {
        for (let l4 in get_current_position(Pos)) {
          for (let l5 in YP.get_code(NextCh)) {
            for (let l6 in read_tokens(NextCh, Dict, Tokens)) {
              yield false;
            }
          }
        }
      }
    }
  }
  {
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 124)) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("|"), Tokens))) {
        for (let l4 in YP.get_code(NextCh)) {
          for (let l5 in read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 125)) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("}"), Tokens))) {
        for (let l4 in YP.get_code(NextCh)) {
          for (let l5 in read_after_atom(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Tokens = arg3;
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 46)) {
      for (let l3 in YP.get_code(NextCh)) {
        for (let l4 in read_fullstop(NextCh, Dict, Tokens)) {
          yield false;
        }
      }
    }
  }
  {
    let Chars = new Variable();
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 34)) {
      for (let l3 of YP.unify(arg3, new ListPair(new Functor1("string", Chars), Tokens))) {
        for (let l4 in read_string(Chars, 34, NextCh)) {
          for (let l5 in read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
  {
    let Tokens = arg3;
    let Chars = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 39)) {
      for (let l3 in read_string(Chars, 39, NextCh)) {
        for (let l4 in read_after_atom4(NextCh, Dict, Tokens, Chars)) {
          yield false;
        }
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 35)) {
      for (let l3 in read_symbol(35, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 36)) {
      for (let l3 in read_symbol(36, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 38)) {
      for (let l3 in read_symbol(38, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 42)) {
      for (let l3 in read_symbol(42, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 43)) {
      for (let l3 in read_symbol(43, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 45)) {
      for (let l3 in read_symbol(45, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 58)) {
      for (let l3 in read_symbol(58, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 60)) {
      for (let l3 in read_symbol(60, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 61)) {
      for (let l3 in read_symbol(61, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 62)) {
      for (let l3 in read_symbol(62, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 63)) {
      for (let l3 in read_symbol(63, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 64)) {
      for (let l3 in read_symbol(64, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 92)) {
      for (let l3 in read_symbol(92, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 94)) {
      for (let l3 in read_symbol(94, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 96)) {
      for (let l3 of read_symbol(96, Dict, Tokens)) {
        yield false;
      }
    }
  }
  {
    let Tokens = arg3;
    for (let l2 of YP.unify(arg1, 126)) {
      for (let l3 of read_symbol(126, Dict, Tokens)) {
        yield false;
      }
    }
  }
}

function *read_symbol(C1, Dict, Tokens) {
  {
    let C2 = new Variable();
    let Chars = new Variable();
    let NextCh = new Variable();
    for (let l2 in YP.get_code(C2)) {
      for (let l3 in rest_symbol(C2, Chars, NextCh)) {
        for (let l4 in read_after_atom4(NextCh, Dict, Tokens, new ListPair(C1, Chars))) {
          yield false;
        }
      }
    }
  }
}

function *rest_symbol(arg1, arg2, arg3) {
  {
    let C2 = arg1;
    let LastCh = arg3;
    let Chars = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(C2, Chars))) {
      cutIf1:
      {
        if (YP.greaterThan(C2, 160)) {
          if (YP.lessThan(C2, 192)) {
            if (YP.notEqual(C2, 186)) {
              if (YP.notEqual(C2, 170)) {
                for (let l8 in YP.get_code(NextCh)) {
                  for (let l9 in rest_symbol(NextCh, Chars, LastCh)) {
                    yield false;
                  }
                }
                return;
              }
            }
          }
          break cutIf1;
        }
        for (let l4 in symbol_char(C2)) {
          for (let l5 in YP.get_code(NextCh)) {
            for (let l6 in rest_symbol(NextCh, Chars, LastCh)) {
              yield false;
            }
          }
          return;
        }
      }
    }
  }
  {
    let C2 = new Variable();
    for (let l2 of YP.unify(arg1, C2)) {
      for (let l3 of YP.unify(arg2, Atom.NIL)) {
        for (let l4 of YP.unify(arg3, C2)) {
          yield false;
        }
      }
    }
  }
}

function *symbol_char(arg1) {
  {
    for (let l2 of YP.unify(arg1, 35)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 36)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 38)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 42)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 43)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 45)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 46)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 47)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 58)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 60)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 61)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 62)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 63)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 64)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 92)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 94)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 96)) {
      yield false;
    }
  }
  {
    for (let l2 of YP.unify(arg1, 126)) {
      yield false;
    }
  }
}

function *get_current_position(Pos: Variable) {
  {
    for (let l2 of YP.unify(Pos, 0)) {
      yield false;
    }
  }
}

function *read_after_atom4(Ch, Dict, arg3, Chars) {
  {
    let Atom_1 = new Variable();
    let Pos = new Variable();
    let Tokens = new Variable();
    for (let l2 of YP.unify(arg3, new ListPair(new Functor2("atom", Atom_1, Pos), Tokens))) {
      for (let l3 of YP.unify(Pos, 0)) {
        for (let l4 of YP.atom_codes(Atom_1, Chars)) {
          for (let l5 of read_after_atom(Ch, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
}

function *read_after_atom(arg1, Dict, arg3) {
  {
    let Tokens = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, 40)) {
      for (let l3 of YP.unify(arg3, new ListPair(Atom.a("("), Tokens))) {
        for (let l4 of YP.get_code(NextCh)) {
          for (let l5 of read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
        return;
      }
    }
  }
  {
    let Ch = arg1;
    let Tokens = arg3;
    for (let l2 in read_tokens(Ch, Dict, Tokens)) {
      yield false;
    }
  }
}

function *read_string(Chars, Quote, NextCh) {
  {
    let Ch = new Variable();
    let Char = new Variable();
    let Next = new Variable();
    for (let l2 in YP.get_code(Ch)) {
      for (let l3 in read_char(Ch, Quote, Char, Next)) {
        for (let l4 in rest_string5(Char, Next, Chars, Quote, NextCh)) {
          yield false;
        }
      }
    }
  }
}

function *rest_string5(arg1, arg2, arg3, arg4, arg5) {
  {
    let _X = arg4;
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg1, -1)) {
      for (let l3 of YP.unify(arg2, NextCh)) {
        for (let l4 of YP.unify(arg3, Atom.NIL)) {
          for (let l5 of YP.unify(arg5, NextCh)) {
            yield true;
            return;
          }
        }
      }
    }
  }
  {
    let Char = arg1;
    let Next = arg2;
    let Quote = arg4;
    let NextCh = arg5;
    let Chars = new Variable();
    let Char2 = new Variable();
    let Next2 = new Variable();
    for (let l2 of YP.unify(arg3, new ListPair(Char, Chars))) {
      for (let l3 in read_char(Next, Quote, Char2, Next2)) {
        for (let l4 in rest_string5(Char2, Next2, Chars, Quote, NextCh)) {
          yield false;
        }
      }
    }
  }
}

function *escape_char(arg1, arg2) {
  {
    for (let l2 of YP.unify(arg1, 110)) {
      for (let l3 of YP.unify(arg2, 10)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 78)) {
      for (let l3 of YP.unify(arg2, 10)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 116)) {
      for (let l3 of YP.unify(arg2, 9)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 84)) {
      for (let l3 of YP.unify(arg2, 9)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 114)) {
      for (let l3 of YP.unify(arg2, 13)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 82)) {
      for (let l3 of YP.unify(arg2, 13)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 118)) {
      for (let l3 of YP.unify(arg2, 11)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 86)) {
      for (let l3 of YP.unify(arg2, 11)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 98)) {
      for (let l3 of YP.unify(arg2, 8)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 66)) {
      for (let l3 of YP.unify(arg2, 8)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 102)) {
      for (let l3 of YP.unify(arg2, 12)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 70)) {
      for (let l3 of YP.unify(arg2, 12)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 101)) {
      for (let l3 of YP.unify(arg2, 27)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 69)) {
      for (let l3 of YP.unify(arg2, 27)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 100)) {
      for (let l3 of YP.unify(arg2, 127)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 68)) {
      for (let l3 of YP.unify(arg2, 127)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 115)) {
      for (let l3 of YP.unify(arg2, 32)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 83)) {
      for (let l3 of YP.unify(arg2, 32)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 122)) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
  {
    for (let l2 of YP.unify(arg1, 90)) {
      for (let l3 of YP.unify(arg2, -1)) {
        yield false;
      }
    }
  }
}

function *read_variable(C1, Dict, arg3) {
  {
    let Var = new Variable();
    let Name = new Variable();
    let StartPos = new Variable();
    let Tokens = new Variable();
    let Chars = new Variable();
    let NextCh = new Variable();
    for (let l2 of YP.unify(arg3, new ListPair(new Functor3("var", Var, Name, StartPos), Tokens))) {
      for (let l3 of get_current_position(StartPos)) {
        for (let l4 of read_name(C1, Chars, NextCh)) {
          for (let l5 of YP.atom_codes(Name, Chars)) {
            cutIf1:
            {
              if (YP.termEqual(Name, Atom.a("_"))) {
                for (let l8 of read_after_atom(NextCh, Dict, Tokens)) {
                  yield false;
                }
                break cutIf1;
              }
              for (let l7 of read_lookup(Dict, Name, Var)) {
                for (let l8 of read_after_atom(NextCh, Dict, Tokens)) {
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

function *read_lookup(arg1, Name, Var) {
  {
    let N = new Variable();
    let V = new Variable();
    let L = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(new Functor2("=", N, V), L))) {
      cutIf1:
      {
        for (let l4 of YP.unify(N, Name)) {
          for (let l5 of YP.unify(V, Var)) {
            yield false;
          }
          break cutIf1;
        }
        for (let l4 of read_lookup(L, Name, Var)) {
          yield false;
        }
      }
    }
  }
}

function *read_solidus(Ch, LastCh) {
  {
    let NextCh = new Variable();
    cutIf1:
    {
      if (YP.equal(Ch, 42)) {
        for (let l4 in YP.get_code(NextCh)) {
          cutIf2:
          {
            if (YP.equal(NextCh, 47)) {
              for (let l7 of YP.get_code(LastCh)) {
                yield false;
              }
              break cutIf2;
            }
            for (let l6 of read_solidus(NextCh, LastCh)) {
              yield false;
            }
          }
        }
        break cutIf1;
      }
      cutIf3:
      {
        if (YP.notEqual(Ch, -1)) {
          for (let l5 of YP.get_code(NextCh)) {
            for (let l6 of read_solidus(NextCh, LastCh)) {
              yield false;
            }
          }
          break cutIf3;
        }
        for (let l4 of YP.unify(LastCh, Ch)) {
          for (let l5 of formatError(Atom.a("user_error"), Atom.a("~N** end of file in /*comment~n"), Atom.NIL)) {
            yield false;
          }
        }
      }
    }
  }
}

function *read_identifier(C1: Variable, Dict, Tokens) {
  {
    let Chars = new Variable();
    let NextCh = new Variable();
    for (let l2 of read_name(C1, Chars, NextCh)) {
      for (let l3 of read_after_atom4(NextCh, Dict, Tokens, Chars)) {
        yield false;
      }
    }
  }
}

function *read_name(C1:Variable, arg2:Variable, LastCh:Variable) {
  {
    let Chars = new Variable();
    let C2 = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(C1, Chars))) {
      for (let l3 of YP.get_code(C2)) {
        cutIf1:
        {
          if (YP.greaterThanOrEqual(C2, new ListPair(97, Atom.NIL))) {
            cutIf2:
            {
              if (YP.lessThanOrEqual(C2, new ListPair(122, Atom.NIL))) {
                for (let l8 of read_name(C2, Chars, LastCh)) {
                  yield false;
                }
                break cutIf2;
              }
              cutIf3:
              {
                if (YP.lessThan(C2, 192)) {
                  if (YP.notEqual(YP.bitwiseOr(C2, 16), 186)) {
                    for (let l10 of YP.unify(Chars, Atom.NIL)) {
                      for (let l11 of YP.unify(LastCh, C2)) {
                        yield false;
                      }
                    }
                    break cutIf3;
                  }
                }
                cutIf4:
                {
                  if (YP.equal(YP.bitwiseOr(C2, 32), 247)) {
                    for (let l10 of YP.unify(Chars, Atom.NIL)) {
                      for (let l11 of YP.unify(LastCh, C2)) {
                        yield false;
                      }
                    }
                    break cutIf4;
                  }
                  for (let l9 of read_name(C2, Chars, LastCh)) {
                    yield false;
                  }
                }
              }
            }
            break cutIf1;
          }
          cutIf5:
          {
            if (YP.greaterThanOrEqual(C2, new ListPair(65, Atom.NIL))) {
              cutIf6:
              {
                if (YP.greaterThan(C2, new ListPair(90, Atom.NIL))) {
                  if (YP.notEqual(C2, new ListPair(95, Atom.NIL))) {
                    for (let l10 of YP.unify(Chars, Atom.NIL)) {
                      for (let l11 of YP.unify(LastCh, C2)) {
                        yield false;
                      }
                    }
                    break cutIf6;
                  }
                }
                for (let l8 of read_name(C2, Chars, LastCh)) {
                  yield false;
                }
              }
              break cutIf5;
            }
            cutIf7:
            {
              if (YP.greaterThanOrEqual(C2, new ListPair(48, Atom.NIL))) {
                if (YP.lessThanOrEqual(C2, new ListPair(57, Atom.NIL))) {
                  for (let l9 of read_name(C2, Chars, LastCh)) {
                    yield false;
                  }
                  break cutIf7;
                }
              }
              for (let l7 of YP.unify(Chars, Atom.NIL)) {
                for (let l8 of YP.unify(LastCh, C2)) {
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

function *read_fullstop(Ch, Dict, Tokens) {
  {
    let Number = new Variable();
    let Tokens1 = new Variable();
    let Chars = new Variable();
    let NextCh = new Variable();
    cutIf1:
    {
      if (YP.lessThanOrEqual(Ch, new ListPair(57, Atom.NIL))) {
        if (YP.greaterThanOrEqual(Ch, new ListPair(48, Atom.NIL))) {
          for (let l5 of YP.unify(Tokens, new ListPair(new Functor1("number", Number), Tokens1))) {
            for (let l6 of read_float(Number, Dict, Tokens1, new ListPair(48, Atom.NIL), Ch)) {
              yield false;
            }
          }
          break cutIf1;
        }
      }
      cutIf2:
      {
        if (YP.greaterThan(Ch, new ListPair(32, Atom.NIL))) {
          for (let l5 in rest_symbol(Ch, Chars, NextCh)) {
            for (let l6 in read_after_atom4(NextCh, Dict, Tokens, new ListPair(46, Chars))) {
              yield false;
            }
          }
          break cutIf2;
        }
        cutIf3:
        {
          if (YP.greaterThanOrEqual(Ch, 0)) {
            for (let l6 of YP.unify(Tokens, Atom.NIL)) {
              yield false;
            }
            break cutIf3;
          }
          for (let l5 in formatError(Atom.a("user_error"), Atom.a("~N** end of file just after full stop~n"), Atom.NIL)) {
          }
        }
      }
    }
  }
}

function *read_float(Number, Dict, Tokens, Digits, Digit) {
  {
    let Chars = new Variable();
    let Rest = new Variable();
    let NextCh = new Variable();
    for (let l2 in prepend(Digits, Chars, Rest)) {
      for (let l3 in read_float4(Digit, Rest, NextCh, Chars)) {
        for (let l4 in YP.number_codes(Number, Chars)) {
          for (let l5 in read_tokens(NextCh, Dict, Tokens)) {
            yield false;
          }
        }
      }
    }
  }
}

function *prepend(arg1, arg2, arg3) {
  {
    let X = arg3;
    for (let l2 of YP.unify(arg1, Atom.NIL)) {
      for (let l3 of YP.unify(arg2, new ListPair(46, X))) {
        yield false;
      }
    }
  }
  {
    let Y = arg3;
    let C = new Variable();
    let Cs = new Variable();
    let X = new Variable();
    for (let l2 of YP.unify(arg1, new ListPair(C, Cs))) {
      for (let l3 of YP.unify(arg2, new ListPair(C, X))) {
        for (let l4 in prepend(Cs, X, Y)) {
          yield false;
        }
      }
    }
  }
}

function *read_float4(C1, arg2, NextCh, Total) {
  {
    let Chars = new Variable();
    let C2 = new Variable();
    let C3 = new Variable();
    let C4 = new Variable();
    let More = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(C1, Chars))) {
      for (let l3 of YP.get_code(C2)) {
        cutIf1:
        {
          if (YP.greaterThanOrEqual(C2, new ListPair(48, Atom.NIL))) {
            if (YP.lessThanOrEqual(C2, new ListPair(57, Atom.NIL))) {
              for (let l7 of read_float4(C2, Chars, NextCh, Total)) {
                yield false;
              }
              break cutIf1;
            }
          }
          cutIf2:
          {
            if (YP.equal(YP.bitwiseOr(C2, 32), new ListPair(101, Atom.NIL))) {
              for (let l7 of YP.get_code(C3)) {
                cutIf3:
                {
                  if (YP.equal(C3, new ListPair(45, Atom.NIL))) {
                    for (let l10 of YP.get_code(C4)) {
                      for (let l11 of YP.unify(Chars, new ListPair(C2, new ListPair(45, More)))) {
                        cutIf4:
                        {
                          if (YP.greaterThanOrEqual(C4, new ListPair(48, Atom.NIL))) {
                            if (YP.lessThanOrEqual(C4, new ListPair(57, Atom.NIL))) {
                              for (let l15 of read_exponent(C4, More, NextCh)) {
                                yield false;
                              }
                              break cutIf4;
                            }
                          }
                          for (let l13 of YP.unify(More, Atom.NIL)) {
                            for (let l14 of formatError(Atom.a("user_error"), Atom.a("~N** Missing exponent in ~s~n"), new ListPair(Total, Atom.NIL))) {
                            }
                          }
                          for (let l13 of YP.unify(More, new ListPair(48, Atom.NIL))) {
                            for (let l14 of YP.unify(NextCh, C4)) {
                              yield false;
                            }
                          }
                        }
                      }
                    }
                    break cutIf3;
                  }
                  cutIf5:
                  {
                    if (YP.equal(C3, new ListPair(43, Atom.NIL))) {
                      for (let l11 of YP.get_code(C4)) {
                        for (let l12 of YP.unify(Chars, new ListPair(C2, More))) {
                          cutIf6:
                          {
                            if (YP.greaterThanOrEqual(C4, new ListPair(48, Atom.NIL))) {
                              if (YP.lessThanOrEqual(C4, new ListPair(57, Atom.NIL))) {
                                for (let l16 in read_exponent(C4, More, NextCh)) {
                                  yield false;
                                }
                                break cutIf6;
                              }
                            }
                            for (let l14 of YP.unify(More, Atom.NIL)) {
                              for (let l15 in formatError(Atom.a("user_error"), Atom.a("~N** Missing exponent in ~s~n"), new ListPair(Total, Atom.NIL))) {
                              }
                            }
                            for (let l14 of YP.unify(More, new ListPair(48, Atom.NIL))) {
                              for (let l15 of YP.unify(NextCh, C4)) {
                                yield false;
                              }
                            }
                          }
                        }
                      }
                      break cutIf5;
                    }
                    for (let l10 of YP.unify(C4, C3)) {
                      for (let l11 of YP.unify(Chars, new ListPair(C2, More))) {
                        cutIf7:
                        {
                          if (YP.greaterThanOrEqual(C4, new ListPair(48, Atom.NIL))) {
                            if (YP.lessThanOrEqual(C4, new ListPair(57, Atom.NIL))) {
                              for (let l15 in read_exponent(C4, More, NextCh)) {
                                yield false;
                              }
                              break cutIf7;
                            }
                          }
                          for (let l13 of YP.unify(More, Atom.NIL)) {
                            for (let l14 in formatError(Atom.a("user_error"), Atom.a("~N** Missing exponent in ~s~n"), new ListPair(Total, Atom.NIL))) {
                            }
                          }
                          for (let l13 of YP.unify(More, new ListPair(48, Atom.NIL))) {
                            for (let l14 of YP.unify(NextCh, C4)) {
                              yield false;
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
            for (let l6 of YP.unify(Chars, Atom.NIL)) {
              for (let l7 of YP.unify(NextCh, C2)) {
                yield false;
              }
            }
          }
        }
      }
    }
  }
}

function *read_exponent(C1, arg2, NextCh) {
  {
    let Chars = new Variable();
    let C2 = new Variable();
    for (let l2 of YP.unify(arg2, new ListPair(C1, Chars))) {
      for (let l3 of YP.get_code(C2)) {
        cutIf1:
        {
          if (YP.greaterThanOrEqual(C2, new ListPair(48, Atom.NIL))) {
            if (YP.lessThanOrEqual(C2, new ListPair(57, Atom.NIL))) {
              for (let l7 of read_exponent(C2, Chars, NextCh)) {
                yield false;
              }
              break cutIf1;
            }
          }
          for (let l5 of YP.unify(Chars, Atom.NIL)) {
            for (let l6 of YP.unify(NextCh, C2)) {
              yield false;
            }
          }
        }
      }
    }
  }
}

function *read_number(C1, Dict, arg3) {
  {
    let Number = new Variable();
    let Tokens = new Variable();
    let C2 = new Variable();
    let N = new Variable();
    let C = new Variable();
    let C3 = new Variable();
    let Digits = new Variable();
    for (let l2 of YP.unify(arg3, new ListPair(new Functor1("number", Number), Tokens))) {
      for (let l3 in read_number4(C1, C2, 0, N)) {
        cutIf1:
        {
          if (YP.equal(C2, 39)) {
            cutIf2:
            {
              if (YP.greaterThanOrEqual(N, 2)) {
                if (YP.lessThanOrEqual(N, 36)) {
                  for (let l9 in read_based(N, 0, Number, C)) {
                    for (let l10 in read_tokens(C, Dict, Tokens)) {
                      yield false;
                    }
                  }
                  break cutIf2;
                }
              }
              cutIf3:
              {
                if (YP.equal(N, 0)) {
                  for (let l9 in YP.get_code(C3)) {
                    for (let l10 in read_char(C3, -1, Number, C)) {
                      for (let l11 in read_tokens(C, Dict, Tokens)) {
                        yield false;
                      }
                    }
                  }
                  break cutIf3;
                }
                for (let l8 in formatError(Atom.a("user_error"), Atom.a("~N** ~d' read as ~d '~n"), new ListPair(N, new ListPair(N, Atom.NIL)))) {
                  for (let l9 of YP.unify(Number, N)) {
                    for (let l10 of YP.unify(C, C2)) {
                      for (let l11 in read_tokens(C, Dict, Tokens)) {
                        yield false;
                      }
                    }
                  }
                }
              }
            }
            break cutIf1;
          }
          cutIf4:
          {
            if (YP.equal(C2, 46)) {
              for (let l7 in YP.get_code(C3)) {
                cutIf5:
                {
                  if (YP.greaterThanOrEqual(C3, new ListPair(48, Atom.NIL))) {
                    if (YP.lessThanOrEqual(C3, new ListPair(57, Atom.NIL))) {
                      for (let l11 in YP.number_codes(N, Digits)) {
                        for (let l12 in read_float(Number, Dict, Tokens, Digits, C3)) {
                          yield false;
                        }
                      }
                      break cutIf5;
                    }
                  }
                  for (let l9 of YP.unify(Number, N)) {
                    for (let l10 of read_fullstop(C3, Dict, Tokens)) {
                      yield false;
                    }
                  }
                }
              }
              break cutIf4;
            }
            for (let l6 of YP.unify(Number, N)) {
              for (let l7 in read_tokens(C2, Dict, Tokens)) {
                yield false;
              }
            }
          }
        }
      }
    }
  }
}

function *read_number4(C0, C, N0, N) {
  {
    let N1 = new Variable();
    let C1 = new Variable();
    cutIf1:
    {
      if (YP.greaterThanOrEqual(C0, new ListPair(48, Atom.NIL))) {
        if (YP.lessThanOrEqual(C0, new ListPair(57, Atom.NIL))) {
          for (let l5 of YP.unify(N1, YP.add(YP.subtract(YP.multiply(N0, 10), new ListPair(48, Atom.NIL)), C0))) {
            for (let l6 in YP.get_code(C1)) {
              for (let l7 in read_number4(C1, C, N1, N)) {
                yield false;
              }
            }
          }
          break cutIf1;
        }
      }
      cutIf2:
      {
        if (YP.equal(C0, 95)) {
          for (let l5 in YP.get_code(C1)) {
            for (let l6 in read_number4(C1, C, N0, N)) {
              yield false;
            }
          }
          break cutIf2;
        }
        for (let l4 of YP.unify(C, C0)) {
          for (let l5 of YP.unify(N, N0)) {
            yield false;
          }
        }
      }
    }
  }
}

function *read_based(Base, N0, N, C) {
  {
    let C1 = new Variable();
    let Digit = new Variable();
    let N1 = new Variable();
    for (let l2 in YP.get_code(C1)) {
      cutIf1:
      {
        if (YP.greaterThanOrEqual(C1, new ListPair(48, Atom.NIL))) {
          if (YP.lessThanOrEqual(C1, new ListPair(57, Atom.NIL))) {
            for (let l6 of YP.unify(Digit, YP.subtract(C1, new ListPair(48, Atom.NIL)))) {
              cutIf2:
              {
                if (YP.lessThan(Digit, Base)) {
                  for (let l9 of YP.unify(N1, YP.add(YP.multiply(N0, Base), Digit))) {
                    for (let l10 in read_based(Base, N1, N, C)) {
                      yield false;
                    }
                  }
                  break cutIf2;
                }
                cutIf3:
                {
                  if (YP.equal(C1, new ListPair(95, Atom.NIL))) {
                    for (let l10 in read_based(Base, N0, N, C)) {
                      yield false;
                    }
                    break cutIf3;
                  }
                  for (let l9 of YP.unify(N, N0)) {
                    for (let l10 of YP.unify(C, C1)) {
                      yield false;
                    }
                  }
                }
              }
            }
            break cutIf1;
          }
        }
        cutIf4:
        {
          if (YP.greaterThanOrEqual(C1, new ListPair(65, Atom.NIL))) {
            if (YP.lessThanOrEqual(C1, new ListPair(90, Atom.NIL))) {
              for (let l7 of YP.unify(Digit, YP.subtract(C1, YP.subtract(new ListPair(65, Atom.NIL), 10)))) {
                cutIf5:
                {
                  if (YP.lessThan(Digit, Base)) {
                    for (let l10 of YP.unify(N1, YP.add(YP.multiply(N0, Base), Digit))) {
                      for (let l11 in read_based(Base, N1, N, C)) {
                        yield false;
                      }
                    }
                    break cutIf5;
                  }
                  cutIf6:
                  {
                    if (YP.equal(C1, new ListPair(95, Atom.NIL))) {
                      for (let l11 in read_based(Base, N0, N, C)) {
                        yield false;
                      }
                      break cutIf6;
                    }
                    for (let l10 of YP.unify(N, N0)) {
                      for (let l11 of YP.unify(C, C1)) {
                        yield false;
                      }
                    }
                  }
                }
              }
              break cutIf4;
            }
          }
          cutIf7:
          {
            if (YP.greaterThanOrEqual(C1, new ListPair(97, Atom.NIL))) {
              if (YP.lessThanOrEqual(C1, new ListPair(122, Atom.NIL))) {
                for (let l8 of YP.unify(Digit, YP.subtract(C1, YP.subtract(new ListPair(97, Atom.NIL), 10)))) {
                  cutIf8:
                  {
                    if (YP.lessThan(Digit, Base)) {
                      for (let l11 of YP.unify(N1, YP.add(YP.multiply(N0, Base), Digit))) {
                        for (let l12 in read_based(Base, N1, N, C)) {
                          yield false;
                        }
                      }
                      break cutIf8;
                    }
                    cutIf9:
                    {
                      if (YP.equal(C1, new ListPair(95, Atom.NIL))) {
                        for (let l12 in read_based(Base, N0, N, C)) {
                          yield false;
                        }
                        break cutIf9;
                      }
                      for (let l11 of YP.unify(N, N0)) {
                        for (let l12 of YP.unify(C, C1)) {
                          yield false;
                        }
                      }
                    }
                  }
                }
                break cutIf7;
              }
            }
            for (let l6 of YP.unify(Digit, 99)) {
              cutIf10:
              {
                if (YP.lessThan(Digit, Base)) {
                  for (let l9 of YP.unify(N1, YP.add(YP.multiply(N0, Base), Digit))) {
                    for (let l10 in read_based(Base, N1, N, C)) {
                      yield false;
                    }
                  }
                  break cutIf10;
                }
                cutIf11:
                {
                  if (YP.equal(C1, new ListPair(95, Atom.NIL))) {
                    for (let l10 in read_based(Base, N0, N, C)) {
                      yield false;
                    }
                    break cutIf11;
                  }
                  for (let l9 of YP.unify(N, N0)) {
                    for (let l10 of YP.unify(C, C1)) {
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

function *read_char(Char, Quote, Result, Next) {
  {
    let C1 = new Variable();
    let C2 = new Variable();
    let C3 = new Variable();
    let Ch = new Variable();
    cutIf1:
    {
      if (YP.equal(Char, 92)) {
        for (let l4 in YP.get_code(C1)) {
          cutIf2:
          {
            if (YP.lessThan(C1, 0)) {
              for (let l7 of formatError(Atom.a("user_error"), Atom.a("~N** end of file in ~cquoted~c~n"), new ListPair(Quote, new ListPair(Quote, Atom.NIL)))) {
                for (let l8 of YP.unify(Result, -1)) {
                  for (let l9 of YP.unify(Next, C1)) {
                    yield false;
                  }
                }
              }
              break cutIf2;
            }
            cutIf3:
            {
              if (YP.lessThanOrEqual(C1, new ListPair(32, Atom.NIL))) {
                for (let l8 of YP.get_code(C2)) {
                  for (let l9 of read_char(C2, Quote, Result, Next)) {
                    yield false;
                  }
                }
                break cutIf3;
              }
              cutIf4:
              {
                if (YP.equal(YP.bitwiseOr(C1, 32), new ListPair(99, Atom.NIL))) {
                  for (let l9 of YP.get_code(C2)) {
                    for (let l10 of read_char(C2, Quote, Result, Next)) {
                      yield false;
                    }
                  }
                  break cutIf4;
                }
                cutIf5:
                {
                  if (YP.lessThanOrEqual(C1, new ListPair(55, Atom.NIL))) {
                    if (YP.greaterThanOrEqual(C1, new ListPair(48, Atom.NIL))) {
                      for (let l11 in YP.get_code(C2)) {
                        cutIf6:
                        {
                          if (YP.lessThanOrEqual(C2, new ListPair(55, Atom.NIL))) {
                            if (YP.greaterThanOrEqual(C2, new ListPair(48, Atom.NIL))) {
                              for (let l15 of YP.get_code(C3)) {
                                cutIf7:
                                {
                                  if (YP.lessThanOrEqual(C3, new ListPair(55, Atom.NIL))) {
                                    if (YP.greaterThanOrEqual(C3, new ListPair(48, Atom.NIL))) {
                                      for (let l19 of YP.get_code(Next)) {
                                        for (let l20 of YP.unify(Result, YP.subtract(YP.add(YP.multiply(YP.add(YP.multiply(C1, 8), C2), 8), C3), YP.multiply(73, new ListPair(48, Atom.NIL))))) {
                                          yield false;
                                        }
                                      }
                                      break cutIf7;
                                    }
                                  }
                                  for (let l17 of YP.unify(Next, C3)) {
                                    for (let l18 of YP.unify(Result, YP.subtract(YP.add(YP.multiply(C1, 8), C2), YP.multiply(9, new ListPair(48, Atom.NIL))))) {
                                      yield false;
                                    }
                                  }
                                }
                              }
                              break cutIf6;
                            }
                          }
                          for (let l13 of YP.unify(Next, C2)) {
                            for (let l14 of YP.unify(Result, YP.subtract(C1, new ListPair(48, Atom.NIL)))) {
                              yield false;
                            }
                          }
                        }
                      }
                      break cutIf5;
                    }
                  }
                  cutIf8:
                  {
                    if (YP.equal(C1, new ListPair(94, Atom.NIL))) {
                      for (let l11 of YP.get_code(C2)) {
                        cutIf9:
                        {
                          if (YP.lessThan(C2, 0)) {
                            for (let l14 of formatError(Atom.a("user_error"), Atom.a("~N** end of file in ~c..~c^..~c~n"), ListPair.make([Quote, 92, Quote]))) {
                              for (let l15 of YP.unify(Result, -1)) {
                                for (let l16 of YP.unify(Next, C2)) {
                                  yield false;
                                }
                              }
                            }
                            break cutIf9;
                          }
                          cutIf10:
                          {
                            if (YP.equal(C2, new ListPair(63, Atom.NIL))) {
                              for (let l15 of YP.unify(Result, 127)) {
                                for (let l16 in YP.get_code(Next)) {
                                  yield false;
                                }
                              }
                              break cutIf10;
                            }
                            for (let l14 of YP.unify(Result, YP.bitwiseAnd(C2, 31))) {
                              for (let l15 of YP.get_code(Next)) {
                                yield false;
                              }
                            }
                          }
                        }
                      }
                      break cutIf8;
                    }
                    cutIf11:
                    {
                      for (let l11 of escape_char(C1, Result)) {
                        for (let l12 of YP.get_code(Next)) {
                          yield false;
                        }
                        break cutIf11;
                      }
                      for (let l11 of YP.unify(Result, C1)) {
                        for (let l12 of YP.get_code(Next)) {
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
        break cutIf1;
      }
      cutIf12:
      {
        if (YP.equal(Char, Quote)) {
          for (let l5 in YP.get_code(Ch)) {
            cutIf13:
            {
              if (YP.equal(Ch, Quote)) {
                for (let l8 of YP.unify(Result, Quote)) {
                  for (let l9 in YP.get_code(Next)) {
                    yield false;
                  }
                }
                break cutIf13;
              }
              for (let l7 of YP.unify(Result, -1)) {
                for (let l8 of YP.unify(Next, Ch)) {
                  yield false;
                }
              }
            }
          }
          break cutIf12;
        }
        cutIf14:
        {
          if (YP.lessThan(Char, new ListPair(32, Atom.NIL))) {
            if (YP.notEqual(Char, 9)) {
              if (YP.notEqual(Char, 10)) {
                if (YP.notEqual(Char, 13)) {
                  for (let l9 of YP.unify(Result, -1)) {
                    for (let l10 of YP.unify(Next, Char)) {
                      for (let l11 of formatError(Atom.a("user_error"), Atom.a("~N** Strange character ~d ends ~ctoken~c~n"), ListPair.make([Char, Quote, Quote]))) {
                        yield false;
                      }
                    }
                  }
                  break cutIf14;
                }
              }
            }
          }
          for (let l5 of YP.unify(Result, Char)) {
            for (let l6 of YP.get_code(Next)) {
              yield false;
            }
          }
        }
      }
    }
  }
}


