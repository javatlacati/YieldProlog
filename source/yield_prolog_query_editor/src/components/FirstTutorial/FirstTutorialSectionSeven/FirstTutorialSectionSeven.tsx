import {FC, useEffect, useState} from 'react';
import {UnifyingVariable} from "../FirstTutorialSectionThree/FirstTutorialSectionThree.tsx";


interface FirstTutorialSectionSevenProps {
}

const FirstTutorialSectionSeven: FC<FirstTutorialSectionSevenProps> = () => {

  const [checkingForUncle, setCheckingForUncle] = useState<string[]>([]);

  function generalGetValue(value: string | UnifyingVariable) {
    if (value instanceof UnifyingVariable) {
      if (value.value == null)
        return value;
      else
        return value.value;
    } else
      return value;
  }

  function* generalUnify(arg1: string | UnifyingVariable, arg2: string | UnifyingVariable) {
    const arg1Value = generalGetValue(arg1);
    const arg2Value = generalGetValue(arg2);
    if (arg1Value instanceof UnifyingVariable) {
      for (let _ of arg1Value.unify(arg2Value))
        yield false;
    } else if (arg2Value instanceof UnifyingVariable) {
      for (let _ of arg2Value.unify(arg1Value))
        yield false;
    } else {
      // Arguments are "normal" types.
      if (arg1Value == arg2Value)
        yield false;
    }
  }

  function* parent(Person, Parent) {
    for (let l1 of generalUnify(Person, "Chelsea")) {
      for (let l2 of generalUnify(Parent, "Hillary"))
        yield false;
    }
    for (let l1 of generalUnify(Person, "Chelsea")) {
      for (let l2 of generalUnify(Parent, "Bill"))
        yield false;
    }
  }


  function* brother(Person: string | UnifyingVariable, Brother: string | UnifyingVariable) {
    for (let l1 of generalUnify(Person, "Hillary")) {
      for (let l2 of generalUnify(Brother, "Tony"))
        yield false;
      for (let l2 of generalUnify(Brother, "Hugh"))
        yield false;
    }
    for (let l1 of generalUnify(Person, "Bill")) {
      for (let l2 of generalUnify(Brother, "Roger"))
        yield false;
    }
  }

  function* uncle(Person: UnifyingVariable, Uncle: UnifyingVariable) {
    const Parent = new UnifyingVariable();
    for (let l1 of parent(Person, Parent)) {
      for (let l2 of brother(Parent, Uncle))
        yield false;
    }
  }

  useEffect(() => {
    const Person = new UnifyingVariable();
    const Uncle = new UnifyingVariable();
    const unclesFound = [];
    for (let a of uncle(Person, Uncle))
      unclesFound.push(Person.value + " has uncle " + Uncle.value + ".");
    setCheckingForUncle(unclesFound)
  }, []);
  return (
    <div>
      Joining functions:<br/>
      {checkingForUncle.map((uncle, index) => <><span key={'1_7_' + index}>{uncle}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionSeven;
