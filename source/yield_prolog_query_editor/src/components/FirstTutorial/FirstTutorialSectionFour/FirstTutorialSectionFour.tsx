import {FC, useEffect, useState} from 'react';
import {UnifyingVariable} from "../FirstTutorialSectionThree/FirstTutorialSectionThree.tsx";


interface FirstTutorialSectionFourProps {
}

const FirstTutorialSectionFour: FC<FirstTutorialSectionFourProps> = () => {
  const [checkingForPerson, setCheckingForPerson] = useState<string[]>([]);

  function* personWithUnify(Person: UnifyingVariable) {
    for (let l1 of Person.unify("Chelsea"))
      yield false;
    for (let l1 of Person.unify("Hillary"))
      yield false;
    for (let l1 of Person.unify("Bill"))
      yield false;
  }

  useEffect(() => {
    const Person = new UnifyingVariable();
    /// checking for a person
    const personsFound: string[] = [];
    for (let l1 of Person.unify("Hillary")) {
      for (let l2 of personWithUnify(Person))
        personsFound.push("Hillary is a person.");
    }
    for (let l1 of Person.unify("Buddy")) {
      for (let l2 of personWithUnify(Person))
        // This won't print.
        personsFound.push("Buddy is a person.<br>");
    }
    setCheckingForPerson(personsFound)
  }, []);
  return (
    <div>
      Use unify to check a person:<br/>
      {[...checkingForPerson].map((person, index) => <><span key={'1_4_' + index}>{person}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionFour;
