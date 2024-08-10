import React, { lazy, Suspense } from 'react';

const LazyQueryEditor = lazy(() => import('./QueryEditor'));

const QueryEditor = (props: JSX.IntrinsicAttributes & { children?: React.ReactNode; }) => (
  <Suspense fallback={null}>
    <LazyQueryEditor {...props} />
  </Suspense>
);

export default QueryEditor;
