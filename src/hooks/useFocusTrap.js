import { useEffect, useRef } from 'react';

export function useFocusTrap(active) {
  const ref = useRef(null);

  useEffect(() => {
    if (!active || !ref.current) return;

    const container = ref.current;
    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    let focusedIndex = -1;

    // Find the currently focused element index
    const updateIndex = () => {
      focusedIndex = Array.from(focusable).indexOf(document.activeElement);
    };

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      updateIndex();

      if (e.shiftKey) {
        if (focusedIndex <= 0) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (focusedIndex >= focusable.length - 1) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Focus first element on open
    setTimeout(() => first.focus(), 50);

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [active]);

  return ref;
}
