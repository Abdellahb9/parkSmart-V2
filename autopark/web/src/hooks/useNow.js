import { useEffect, useState } from 'react';

/**
 * Ticking clock for live countdowns.
 *
 * One interval per page instead of one per row, and it is always cleared on
 * unmount — the old reservations table computed "overstay" once at render and
 * then froze at whatever it was when the tab was opened.
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

export default useNow;
