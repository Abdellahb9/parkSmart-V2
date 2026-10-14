import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services';

/**
 * Runs a fetcher and exposes { data, loading, error, reload }.
 *
 * Every page uses this so the three states always exist, late responses from
 * an unmounted page are dropped, and a failure can never be mistaken for an
 * empty result.
 */
export function useAsync(fetcher, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const alive = useRef(true);
  const runId = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const id = ++runId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (!alive.current || id !== runId.current) return undefined; // superseded
      setData(result);
      return result;
    } catch (err) {
      if (!alive.current || id !== runId.current) return undefined;
      setError(errorMessage(err));
      return undefined;
    } finally {
      if (alive.current && id === runId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return { data, loading, error, reload: run, setData };
}

export default useAsync;
