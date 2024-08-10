// An iterator that does one loop.
export class SucceedIterable implements Iterable<boolean> {
  [Symbol.iterator]() {
    let didIteration = false;
    return {
      next: () => {

        return {
          done: didIteration,
          value: !didIteration
        }
      }
    }
  }
}

export class Succeed implements IterableIterator<boolean> {
  iterable: SucceedIterable = new SucceedIterable()
  readonly iterator = this.iterable[Symbol.iterator]();

  next(): IteratorResult<boolean> {
    return this.iterator.next();
  }

  [Symbol.iterator]() {
    return this;
  }
}