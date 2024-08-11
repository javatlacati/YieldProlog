import React, { lazy, Suspense } from 'react';

const LazyFirstTutorialSectionFour = lazy(() => import('./FirstTutorialSectionFour'));

const FirstTutorialSectionFour = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyFirstTutorialSectionFour {...props} />
  </Suspense>
);

export default FirstTutorialSectionFour;
