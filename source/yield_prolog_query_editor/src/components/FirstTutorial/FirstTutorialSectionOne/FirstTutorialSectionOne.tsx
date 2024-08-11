import {FC} from 'react';


interface FirstTutorialSectionOneProps {
}

const FirstTutorialSectionOne: FC<FirstTutorialSectionOneProps> = () => {
  function* personWithReturnValue(): Generator<string> {
    yield "Chelsea";
    yield "Hillary";
    yield "Bill";
  }

  return (
    <div>
      Names using a return value:<br/>
      {[...personWithReturnValue()].map((name, index) => <><span key={'1_1_' + index}>{name}</span><br/></>)}
    </div>
  );
};

export default FirstTutorialSectionOne;
