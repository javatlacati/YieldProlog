import {Variable} from "./Variable";
import {CopyStore} from "./CopyStore";

export interface Unifiable {
  termEqual(term: any): boolean;

  ground(): boolean;

  unify(arg: any): Generator<any>

  addUniqueVariables(variableSet: Array<Variable>): void;

  makeCopy(copyStore: CopyStore): any;
}