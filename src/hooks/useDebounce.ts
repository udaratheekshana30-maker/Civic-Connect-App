import { useEffect, useState } from 'react';

/** Value that only updates after `delay` ms without changes (Nominatim needs ≥ 600). */
export function useDebounce<T>(value: T, delay = 600) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
