import { useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, X } from 'lucide-react';

export function SwipeableItem({ children, onEdit, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef(null);

  // Fecha o item se clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (offsetX !== 0) setOffsetX(0);
      }
    };
    document.addEventListener('touchstart', handleClickOutside);
    return () => document.removeEventListener('touchstart', handleClickOutside);
  }, [offsetX]);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Só permite arrastar para esquerda até um limite razoável
    if (diff < 0 && diff > -160) {
      setOffsetX(diff);
    } else if (diff > 0 && offsetX < 0) {
      // Permite fechar arrastando para a direita se já estiver aberto
      setOffsetX(Math.min(0, offsetX + diff));
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    // Ponto de ruptura para abrir ou fechar
    if (offsetX < -60) {
      setOffsetX(-120); // Abre
    } else {
      setOffsetX(0); // Fecha
    }
  };

  const reset = () => setOffsetX(0);

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl h-full select-none">
      
      {/* --- AÇÕES (Fundo) --- */}
      <div className="absolute inset-y-0 right-0 w-[120px] flex items-center justify-end">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); reset(); }} 
          className="h-full w-1/2 bg-blue-600 flex flex-col items-center justify-center text-white active:bg-blue-700 transition-colors"
        >
          <Edit2 size={18} strokeWidth={2.5} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); reset(); }} 
          className="h-full w-1/2 bg-red-600 flex flex-col items-center justify-center text-white active:bg-red-700 transition-colors"
        >
          <Trash2 size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* --- CONTEÚDO (Frente) --- */}
      <div
        className="relative bg-[#121212] border border-[#222] rounded-xl z-10 transition-transform duration-300 ease-out active:scale-[0.99] touch-pan-y"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => offsetX !== 0 && reset()}
      >
        {children}
      </div>
    </div>
  );
}