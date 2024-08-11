import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionTwo = lazy(() => import('./FirstTutorialSectionTwo'));

const FirstTutorialSectionTwo = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionTwo {...props} />
  </Suspense>
);

export default FirstTutorialSectionTwo;
