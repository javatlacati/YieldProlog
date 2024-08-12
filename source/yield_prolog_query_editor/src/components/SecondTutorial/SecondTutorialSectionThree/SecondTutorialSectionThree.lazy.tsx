import React, { lazy, Suspense } from 'react';

const LazySecondTutorialSectionThree = lazy(() => import('./SecondTutorialSectionThree'));

const SecondTutorialSectionThree = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazySecondTutorialSectionThree {...props} />
  </Suspense>
);

export default SecondTutorialSectionThree;
