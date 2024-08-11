import {FC, useEffect, useState} from 'react';


class SimpleVariable {

  constructor(value?: string) {
    if (value)
      this._value = value;
  }

  private _value: string | null | undefined;

  get value(): string {
    return this._value || "";
  }

  set value(value: string) {
    this._value = value;
  }
}

interface FirstTutorialSectionTwoProps {
}

const FirstTutorialSectionTwo: FC<FirstTutorialSectionTwoProps> = () => {
  const [names, setNames] = useState<string[]>([]);


  function* personWithSimpleVariable(Person: SimpleVariable) {
    Person.value = "Chelsea";
    yield false;
    Person.value = "Hillary";
    yield false;
    Person.value = "Bill";
    yield false;
  }

  useEffect(() => {
    /// fill names using simple variable
    const namesArray: string[] = [];
    let P = new SimpleVariable();
    for (let _ of personWithSimpleVariable(P)) {
      namesArray.push(P.value);
    }
    setNames(namesArray);
  }, [])

  return (
    <div>
      Names using SimpleVariable:<br/>
      {[...names].map((name, index) => <><span key={'1_2_' + index}>{name}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionTwo;
