import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionOne = lazy(() => import('./FirstTutorialSectionOne'));

const FirstTutorialSectionOne = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionOne {...props} />
  </Suspense>
);

export default FirstTutorialSectionOne;
