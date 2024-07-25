import {Variable} from "./Variable";
import {CopyStore} from "./CopyStore";

export interface Unifiable {
  termEqual(term: any): boolean;

  ground(): boolean;

  unify(arg: any)

  addUniqueVariables(variableSet: Array<Variable>): void;

  makeCopy(copyStore: CopyStore): any;
}