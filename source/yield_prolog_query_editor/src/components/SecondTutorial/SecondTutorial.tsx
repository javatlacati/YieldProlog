import {FC} from 'react';
import SecondTutorialSectionTwo from "./SecondTutorialSectionTwo/SecondTutorialSectionTwo.lazy.tsx";
import SecondTutorialSectionOne from "./SecondTutorialSectionOne/SecondTutorialSectionOne.lazy.tsx";
import SecondTutorialSectionThree from "./SecondTutorialSectionThree/SecondTutorialSectionThree.lazy.tsx";


interface SecondTutorialProps {
}

const SecondTutorial: FC<SecondTutorialProps> = () => {

  return (
    <div>
      <SecondTutorialSectionOne/><br/>
      <SecondTutorialSectionTwo/><br/>
      <SecondTutorialSectionThree/><br/>
    </div>
  );
};

export default SecondTutorial;
