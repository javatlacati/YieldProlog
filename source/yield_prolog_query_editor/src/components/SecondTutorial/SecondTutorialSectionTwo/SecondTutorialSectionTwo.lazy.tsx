import React, { lazy, Suspense } from 'react';

const LazySecondTutorialSectionTwo = lazy(() => import('./SecondTutorialSectionTwo'));

const SecondTutorialSectionTwo = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazySecondTutorialSectionTwo {...props} />
  </Suspense>
);

export default SecondTutorialSectionTwo;
