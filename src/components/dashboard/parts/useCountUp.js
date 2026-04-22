import { useState, useEffect, useRef } from 'react';
import { UI } from '../../../constants';

export const useCountUp = (target, duration = UI.countUpMs, delay = 0) => {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        setCount(Math.floor(eased * target));
        if (t < 1) rafRef.current = requestAnimationFrame(step);
        else setCount(target);
      };
      rafRef.current = requestAnimationFrame(step);
    }, delay);
    return () => {
      clearTimeout(timer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay]);
  return count;
};
