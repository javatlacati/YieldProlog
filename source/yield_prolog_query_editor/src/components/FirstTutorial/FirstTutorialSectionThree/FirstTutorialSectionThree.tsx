import {FC, useEffect, useState} from 'react';


export class UnifyingVariable {
  private _value: string | null = null;

  constructor(value?: string) {
    if (value)
      this._value = value;
  }

  * unify(arg: string) {
    if (this._value == null) {
      this._value = arg;
      yield false;
      // Remove the binding.
      this._value = null;
    } else if (this._value == arg)
      yield false;
  }


  get value(): string | null {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
  }
}

interface FirstTutorialSectionThreeProps {
}

const FirstTutorialSectionThree: FC<FirstTutorialSectionThreeProps> = () => {
  const [namesUnified, setNamesUnified] = useState<string[]>([]);


  function* personWithUnify(Person: UnifyingVariable) {
    for (let l1 of Person.unify("Chelsea"))
      yield false;
    for (let l1 of Person.unify("Hillary"))
      yield false;
    for (let l1 of Person.unify("Bill"))
      yield false;
  }

  useEffect(() => {
    ///// fill names using UnifyingVariable
    const Person = new UnifyingVariable();
    const namesArrayUnified: string[] = [];
    for (var l1 of personWithUnify(Person)) {
      if (Person.value != null)
        namesArrayUnified.push(Person.value);
    }
    setNamesUnified(namesArrayUnified);
  }, [])
  return (
    <div>
      Names using UnifyingVariable:<br/>
      {[...namesUnified].map((name, index) => <><span key={'1_3_' + index}>{name}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionThree;
