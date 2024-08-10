import {FC, useState} from 'react';
import {Atom, Functor2, StringReader, StringWriter, Variable, YP} from "../../../../typescript/lib/esm";
import {parseInput} from "../../../../typescript/lib/esm/Parser";
import {Card} from "primereact/card";
import {Divider} from "primereact/divider";
import {InputTextarea} from "primereact/inputtextarea";
import {Button} from "primereact/button";
import {Panel} from "primereact/panel";


interface QueryEditorProps {}

const QueryEditor: FC<QueryEditorProps> = () => {
  const [prologQuery, setPrologQuery] = useState("write('Hello world!'), nl.")
  const [prologOutput, setPrologOutput] = useState("Prolog output will appear here. Please enter Prolog code or click one of the Samples")

  function *parseGoal(goalString: string, Goal: Variable, VariableList: Variable) {
// The parser requires a newline or space at the end.
    YP.see(new StringReader(goalString + " "));
    let TermList = new Variable();
    // parseInput set TermList to a list of f(Goal, VariableList).
    const goals = [];
    for (const aTerm of parseInput(TermList)) {
      // Close the input now before yielding.
      YP.seen();
      // Iterate through each member of TermList.
      for(TermList=YP.getValue(TermList);  (TermList as unknown as Functor2).name == Atom.DOT;
          TermList = YP.getValue((TermList as unknown as Functor2).arg2)){
        // Unify the head of the list with f(Goal, VariableList).
        for (const unification of  YP.unify((TermList as unknown as Functor2).arg1, new Functor2(Atom.F, Goal, VariableList))) {
          goals.push(false);
          yield false;
        }
        return;
      }
    }
    // Close the input in case parseInput failed.
    YP.seen();
  }

  function writeValues(outputWriter: StringWriter, VariableList: Variable) {
    for (VariableList = YP.getValue(VariableList);
         VariableList instanceof Functor2 && VariableList.name == Atom.DOT;
         VariableList = YP.getValue(VariableList.arg2)) {
      const variableAndValue = YP.getValue(VariableList.arg1);
      if (variableAndValue instanceof Functor2) {
        outputWriter.writeLine("");
        outputWriter.write(YP.getValue(variableAndValue.arg1).toString());
        outputWriter.write(" = ");
        outputWriter.write(YP.getValue(variableAndValue.arg2).toString());
      }
    }
  }

  function runPrologQuery() {
    if (prologQuery.trim() === "") {
      alert("Please enter Prolog code or click one of the Samples")
      return;
    }
    debugger;
    const outputWriter = new StringWriter()
    YP.tell(outputWriter);
    const Goal = new Variable();
    const VariableList = new Variable();
    for(const goal of parseGoal(prologQuery, Goal, VariableList)){
      let gotMatch = false;
      for(let match of YP.getIterator(Goal, null)){
        gotMatch = true;
        if (YP.getValue(VariableList) != Atom.NIL) {
          // We are showing values, so separate each match with ";".
          writeValues(outputWriter, VariableList);
          outputWriter.writeLine(";");
        }
      }
    }
    setPrologOutput(outputWriter.toString())
  }

  return (
    <>
      <h1>Yield Prolog Query Editor</h1>
      <Card>
        <b>Congratulations!</b> Your browser
        has just loaded the full-featured Prolog environment in YieldProlog.js, complete with a
        Prolog parser and compiler.<br/>
        Click one of the Samples or type some Prolog, then
        click Run to see the result.<br/>
        <Divider/>
        <br/>
        Query:
        <br/>
        <InputTextarea id="txtProlog" cols={80} rows={9} name="prolog" value={prologQuery}
                       onChange={(e) => setPrologQuery(e.target.value)}></InputTextarea>
        <br/> Samples:
        <br/>
        <Button onClick={() => runPrologQuery()} name="compile" severity="secondary" raised>Run</Button>
        <Divider/>
        <br/>
        <Panel header="Output">
          <p className="m-0">
            {prologOutput}
          </p>
        </Panel>

      </Card>

    </>
  )
};

export default QueryEditor;
