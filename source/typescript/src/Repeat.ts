// An iterator that repeats forever.
export class Repeat implements Iterable<boolean>{
  [Symbol.iterator]() {
    return {
      next: () => {
        return {
          done: false,
          value: false
        }
      }
    }
  }
}