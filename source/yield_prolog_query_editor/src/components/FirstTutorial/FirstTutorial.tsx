import {FC} from 'react';
import FirstTutorialSectionOne from "./FirstTutorialSectionOne/FirstTutorialSectionOne.lazy.tsx";
import FirstTutorialSectionTwo from "./FirstTutorialSectionTwo/FirstTutorialSectionTwo.lazy.tsx";
import FirstTutorialSectionThree from "./FirstTutorialSectionThree/FirstTutorialSectionThree.lazy.tsx";
import FirstTutorialSectionFour from "./FirstTutorialSectionFour/FirstTutorialSectionFour.lazy.tsx";
import FirstTutorialSectionFive from "./FirstTutorialSectionFive/FirstTutorialSectionFive.lazy.tsx";
import FirstTutorialSectionSix from "./FirstTutorialSectionSix/FirstTutorialSectionSix.lazy.tsx";
import FirstTutorialSectionSeven from "./FirstTutorialSectionSeven/FirstTutorialSectionSeven.lazy.tsx";


interface FirstTutorialProps {
}

const FirstTutorial: FC<FirstTutorialProps> = () => {
  return (
    <div>
      <FirstTutorialSectionOne/><br/>
      <FirstTutorialSectionTwo/><br/>
      <FirstTutorialSectionThree/><br/>
      <FirstTutorialSectionFour/><br/>
      <FirstTutorialSectionFive/><br/>
      <FirstTutorialSectionSix/><br/>
      <FirstTutorialSectionSeven/><br/>
    </div>
  );
};

export default FirstTutorial;
