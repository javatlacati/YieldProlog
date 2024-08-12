import { useState, useCallback } from 'react';

export const useStringBuilder = (initialValue: string) => {
  const [value, setValue] = useState(initialValue);

  const append = useCallback((str: string) => {
    setValue((prevValue) => prevValue + str);
  }, []);

  return { computedOutput: value, append };
};