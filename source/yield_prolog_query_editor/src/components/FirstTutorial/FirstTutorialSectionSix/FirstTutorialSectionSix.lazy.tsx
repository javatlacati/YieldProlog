import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionSix = lazy(() => import('./FirstTutorialSectionSix'));

const FirstTutorialSectionSix = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionSix {...props} />
  </Suspense>
);

export default FirstTutorialSectionSix;
