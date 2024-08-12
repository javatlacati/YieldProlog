import {FC, useEffect} from 'react';
import {Variable, YP} from "tyieldprolog/src";
import {useStringBuilder} from "../../../utils/useStringBuilder.ts";


interface SecondTutorialSectionThreeProps {
}

const SecondTutorialSectionThree: FC<SecondTutorialSectionThreeProps> = () => {

  const {computedOutput, append} = useStringBuilder('Get one match:<br/>');

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

  function* anyBrother(Person: string, Brother: Variable) {
    for (let l1 of brother(Person, Brother)) {
      yield false;
      break;
    }
  }

  function* noBrother(Person) {
    const Brother = new Variable();
    for (let l1 of brother(Person, Brother))
      return;
    yield false;
  }

  useEffect(() => {
    const Brother = new Variable();
    for (let l1 of anyBrother("Hillary", Brother))
      append("Hillary has a brother " +
        Brother.getValue() + ".<br/>");
    for (let l1 of anyBrother("Bill", Brother))
      append("Bill has a brother " +
        Brother.getValue() + ".<br/>");

    append("Use cut for negation:<br/>");
    for (let l1 of noBrother("Hillary"))
      append("Hillary has no brother.<br/>");
    for (let l1 of noBrother("Chelsea"))
      append("Chelsea has no brother.<br/>");
  }, []);

  return (
    <div dangerouslySetInnerHTML={{__html: computedOutput}}>
    </div>
  );
};

export default SecondTutorialSectionThree;
