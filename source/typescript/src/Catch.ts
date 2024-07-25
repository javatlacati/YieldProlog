// YP.Catch is an iterator that wraps another iterator in order to catch a PrologException.
// Call YP.getIterator(Goal, declaringClass) and save the returned iterator.
// If getIterator throws an exception, save it the same as next().
import {PrologException} from "./PrologException";
import {YP} from "./YP";

export class Catch {
  private _exception: PrologException;
  constructor(Goal, declaringClass) {
    this._exception = null;
    try {
      //this._enumerator = Iterator();
      YP.getIterator(Goal, declaringClass)
    }
    catch (exception) {
      if (exception instanceof PrologException)
        // next() will check this.
        this._exception = exception;
      else
        throw exception;
    }
  }

  __iterator__ = function() {
    return this;
  }

  // Call _enumerator.next().  If it throws a PrologException, set _exception
// and throw StopIteration.  After this throws StopIteration, call unifyExceptionOrThrow.
  next() {
    // if (this._exception != null)
    //   throw StopIteration;
    //
    // try {
    //   return this._enumerator.next();
    // }
    // catch (exception) {
    //   if (exception instanceof PrologException) {
    //     this._exception = exception;
    //     throw StopIteration;
    //   }
    //   else
    //     // This includes StopIteration.
    //     throw exception;
    // }
  }

// Call this after next() returns false to check for an exception.  If
// next did not get a PrologException, don't yield.
// Otherwise, unify the exception with Catcher and yield so the caller can
// do the handler code.  However, if can't unify with Catcher then throw the exception.
  *unifyExceptionOrThrow(Catcher) {
    if (this._exception != null) {
      var didUnify = false;
      for (let l1 of YP.unify(this._exception.term, Catcher)) {
        didUnify = true;
        yield false;
      }
      if (!didUnify)
        throw this._exception;
    }
  }

  close = function() {
    this._enumerator.close();
  }

}
