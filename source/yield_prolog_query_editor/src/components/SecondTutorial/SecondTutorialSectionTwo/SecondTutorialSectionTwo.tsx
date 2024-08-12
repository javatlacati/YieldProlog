import {FC, useEffect} from 'react';
import {Variable, YP} from "tyieldprolog/src";
import {useStringBuilder} from "../../../utils/useStringBuilder.ts";


interface SecondTutorialSectionTwoProps {
}

const SecondTutorialSectionTwo: FC<SecondTutorialSectionTwoProps> = () => {
  const {computedOutput, append} = useStringBuilder('Check if it is square:<br/>');

  function* squaredRectangle(Width: number | Variable, Height: number | Variable) {
    for (let l1 of YP.unify(Width, Height))
      yield false;
  }

  useEffect(() => {
    for (let l1 of squaredRectangle(10, 10))
      append("10 by 10 rectangle is square.<br/>");
    append('Make it square:<br/>')

    const Width = new Variable();
    const Height = new Variable();
    for (let l1 of Width.unify(10)) {
      for (let l2 of squaredRectangle(Width, Height))
        append("A square of width " +
          Width.getValue() + " has height " +
          Height.getValue() + ".<br/>");
    }

    append("Make it square before we know the width:<br>");
    for (let l1 of squaredRectangle(Width, Height)) {
      for (let l2 of Width.unify(10))
        append("A square of width " +
          Width.getValue() + " has height " +
          Height.getValue() + ".<br>");
    }
  }, []);

  return (
    <div dangerouslySetInnerHTML={{__html: computedOutput}}>

    </div>
  );
};

export default SecondTutorialSectionTwo;
