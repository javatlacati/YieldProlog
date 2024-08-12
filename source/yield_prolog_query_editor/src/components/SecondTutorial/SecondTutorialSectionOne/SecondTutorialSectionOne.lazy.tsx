import React, { lazy, Suspense } from 'react';

const LazySecondTutorialSectionOne = lazy(() => import('./SecondTutorialSectionOne'));

const SecondTutorialSectionOne = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazySecondTutorialSectionOne {...props} />
  </Suspense>
);

export default SecondTutorialSectionOne;
