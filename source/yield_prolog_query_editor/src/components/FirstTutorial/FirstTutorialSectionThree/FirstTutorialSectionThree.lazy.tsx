import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionThree = lazy(() => import('./FirstTutorialSectionThree'));

const FirstTutorialSectionThree = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionThree {...props} />
  </Suspense>
);

export default FirstTutorialSectionThree;
