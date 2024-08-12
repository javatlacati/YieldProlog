import {FC, useEffect, useState} from 'react';
import {Variable, YP} from "tyieldprolog/src";


interface SecondTutorialSectionOneProps {
}

const SecondTutorialSectionOne: FC<SecondTutorialSectionOneProps> = () => {
  const [foudBrothers, setFoundBrothers] = useState<string[]>([])

  function* brother(Person: string, Brother: Variable) {
    for (let l1 of YP.unify(Person, "Hillary")) {
      for (let l2 of YP.unify(Brother, "Tony"))
        yield false;
      for (let l2 of YP.unify(Brother, "Hugh"))
        yield false;
    }
    for (let l1 of YP.unify(Person, "Bill")) {
      for (let l2 of YP.unify(Brother, "Roger"))
        yield false;
    }
  }


  useEffect(() => {
    const Brother = new Variable();
    const foundHillarysBrothers = []
    for (let _ of brother("Hillary", Brother)) {
      foundHillarysBrothers.push("Hillary has brother " + Brother.getValue())
    }
    setFoundBrothers(foundHillarysBrothers)
  }, []);
  return (
    <div>
      Find relations:<br/>
      {([...foudBrothers]).map((b, index) => <><span key={'2_1_' + index}>{b}</span><br/></>)}
    </div>
  );
};

export default SecondTutorialSectionOne;
