import React, { lazy, Suspense } from 'react';

const LazySecondTutorial = lazy(() => import('./SecondTutorial'));

const SecondTutorial = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazySecondTutorial {...props} />
  </Suspense>
);

export default SecondTutorial;
