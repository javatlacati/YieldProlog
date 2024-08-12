// An iterator that does one loop.
export class Succeed implements Generator<boolean> {
  private didIteration = false;
  next(): IteratorResult<boolean> {
    const done = this.didIteration;
    const value = !done;
    this.didIteration = true;
    return { done, value };
  }
  [Symbol.iterator](): Generator<boolean> {
    return this;
  }

  throw(error: any): never {
    throw error;
  }

  return(value?: any): IteratorResult<boolean> {
    return { done: true, value: undefined };
  }
}