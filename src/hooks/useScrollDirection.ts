import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down';

export function useScrollDirection(elementId: string = 'main-content'): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>('up');

  useEffect(() => {
    const el = document.getElementById(elementId);
    if (!el) return;

    let lastScrollY = el.scrollTop;

    const updateScrollDirection = () => {
      const scrollY = el.scrollTop;
      const direction: ScrollDirection = scrollY > lastScrollY ? 'down' : 'up';
      
      // Impede ativar em scrolls minúsculos pra não piscar (jitter)
      if (direction !== scrollDirection && (scrollY - lastScrollY > 10 || scrollY - lastScrollY < -10)) {
        setScrollDirection(direction);
      }
      
      // Atualiza ultimo scroll, se for scroll emborrachado do iOS nao deixar negativo
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    el.addEventListener('scroll', updateScrollDirection, { passive: true });
    return () => el.removeEventListener('scroll', updateScrollDirection);
  }, [scrollDirection, elementId]);

  return scrollDirection;
}
