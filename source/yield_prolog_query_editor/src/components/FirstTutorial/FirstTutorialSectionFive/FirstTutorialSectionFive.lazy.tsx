import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionFive = lazy(() => import('./FirstTutorialSectionFive'));

const FirstTutorialSectionFive = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionFive {...props} />
  </Suspense>
);

export default FirstTutorialSectionFive;
