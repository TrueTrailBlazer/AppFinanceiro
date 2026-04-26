import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Reseta o scroll do window (Mobile browser address bar/safe areas)
    window.scrollTo(0, 0);
    
    // 2. Reseta o scroll interno depois do render
    requestAnimationFrame(() => {
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }
      
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto');
      scrollableContainers.forEach(container => {
        container.scrollTop = 0;
      });
    });
  }, [pathname]);

  return null;
}
