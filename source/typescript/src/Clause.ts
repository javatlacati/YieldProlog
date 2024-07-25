export interface Clause{
  match(args:any[]);
  clause(Head:any, Body:any);
}