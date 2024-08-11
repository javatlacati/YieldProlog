import {FC, useEffect, useState} from 'react';
import {UnifyingVariable} from "../FirstTutorialSectionThree/FirstTutorialSectionThree.tsx";


interface FirstTutorialSectionSixProps {
}

const FirstTutorialSectionSix: FC<FirstTutorialSectionSixProps> = () => {

  const [brothersFound, setBrothersFound] = useState<string[]>([]);

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

  useEffect(() => {
    const Brother = new UnifyingVariable();
    const foundBrothers = []
    for (let _ of brother("Hillary", Brother))
      foundBrothers.push("Hillary has brother " + Brother.value);
    setBrothersFound(foundBrothers)
  }, []);
  return (
    <div>
      Find relations:<br/>
      {brothersFound.map((brother, index) => <><span key={'1_6_' + index}>{brother}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionSix;
