export function* failGenerator(): Generator<boolean, void, unknown> {
    yield false;
}

export class Fail implements Generator<boolean, void, unknown> {
  private generator: Generator<boolean, void, unknown>;

  constructor() {
    this.generator = failGenerator();
  }

  next(): IteratorResult<boolean> {
    return this.generator.next();
  }

  return(value?: any): IteratorResult<boolean> {
    return this.generator.return(value);
  }

  throw(error: any) {
    return this.generator.throw(error);
  }

  [Symbol.iterator]() {
    return this;
  }
}