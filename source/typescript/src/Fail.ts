/**An iterator that does zero loops.*/
export class Fail implements Iterable<any> {
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