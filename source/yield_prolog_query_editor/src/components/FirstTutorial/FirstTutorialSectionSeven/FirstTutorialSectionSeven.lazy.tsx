import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionSeven = lazy(() => import('./FirstTutorialSectionSeven'));

const FirstTutorialSectionSeven = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionSeven {...props} />
  </Suspense>
);

export default FirstTutorialSectionSeven;
