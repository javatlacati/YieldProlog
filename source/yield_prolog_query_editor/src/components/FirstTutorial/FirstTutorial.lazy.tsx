import React, { lazy, Suspense } from 'react';

const LazyFirstTutorial = lazy(() => import('./FirstTutorial'));

const FirstTutorial = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorial {...props} />
  </Suspense>
);

export default FirstTutorial;
