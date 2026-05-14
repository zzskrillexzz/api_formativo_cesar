import React, { useState, useEffect, useRef } from 'react';

export const AnimatedCounter = ({ value, duration = 800, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }

    const start = performance.now();
    const from = 0;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: suave al inicio y final
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      setDisplay(Math.floor(from + (value - from) * ease));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(value);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <>{prefix}{display.toLocaleString()}{suffix}</>;
};
