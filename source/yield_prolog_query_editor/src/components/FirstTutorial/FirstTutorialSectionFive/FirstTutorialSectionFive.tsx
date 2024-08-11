import {FC, useEffect, useState} from 'react';
import {UnifyingVariable} from "../FirstTutorialSectionThree/FirstTutorialSectionThree.tsx";


interface FirstTutorialSectionFiveProps {
}

const FirstTutorialSectionFive: FC<FirstTutorialSectionFiveProps> = () => {
  const [checkingForPerson, setCheckingForPerson] = useState<string[]>([]);

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

  function* person(Person: string) {
    for (let _ of generalUnify(Person, "Chelsea"))
      yield false;
    for (let _ of generalUnify(Person, "Hillary"))
      yield false;
    for (let _ of generalUnify(Person, "Bill"))
      yield false;
  }

  useEffect(() => {
    const chechedPersons = []
    for (let _ of person("Hillary"))
      chechedPersons.push("Hillary is a person");
    for (let _ of person("Buddy"))
      // This won't print.
      chechedPersons.push("Buddy is a person");
    setCheckingForPerson(chechedPersons)
  }, [])

  return (
    <div>
      Use generalUnify to check a person:<br/>
      {[...checkingForPerson].map((person, index) => <><span key={'1_5_' + index}>{person}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionFive;
