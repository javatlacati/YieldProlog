/**An iterator that does zero loops.*/
export class FailIterable implements Iterable<any> {
  [Symbol.iterator]() {
    let didIteration = true;
    return {
      next: () => {
        return {
          done: didIteration,
          value: didIteration
        }
      }
    }
  }
}

export class Fail implements IterableIterator<boolean> {
  iterable: FailIterable = new FailIterable()
  iterator = this.iterable[Symbol.iterator]();

  next(): IteratorResult<boolean> {
    return this.iterator.next();
  }

  [Symbol.iterator]() {
    return this;
  }
}