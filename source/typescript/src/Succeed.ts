// An iterator that does one loop.
export class Succeed implements Iterable<boolean> {
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