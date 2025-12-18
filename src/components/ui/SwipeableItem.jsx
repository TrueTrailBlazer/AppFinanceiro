import { useState, useRef } from 'react';
import { Edit, Trash2 } from 'lucide-react';

export function SwipeableItem({ children, onEdit, onDelete }) {
  const [offsetX, setOffsetX] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;

    // Só permite arrastar para a esquerda (negativo) até -120px
    if (diff < 0 && diff > -130) {
      setOffsetX(diff);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    // Se arrastou mais de 50px, abre totalmente (-120px)
    if (offsetX < -50) {
      setOffsetX(-120); 
    } else {
      setOffsetX(0); // Senão, fecha
    }
  };

  // Fecha o item se clicar nele sem arrastar (para evitar toques acidentais nos botões de trás)
  const handleClick = () => {
    if (offsetX === 0) return;
    setOffsetX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl touch-pan-y select-none group">
      
      {/* --- AÇÕES DE FUNDO (Aparecem ao deslizar) --- */}
      <div className="absolute inset-y-0 right-0 w-[120px] flex">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); setOffsetX(0); }} 
          className="w-1/2 bg-blue-600 flex flex-col items-center justify-center text-white active:bg-blue-700 transition-colors"
        >
          <Edit size={18} />
          <span className="text-[9px] font-bold mt-1">Editar</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(); setOffsetX(0); }} 
          className="w-1/2 bg-red-600 flex flex-col items-center justify-center text-white active:bg-red-700 transition-colors rounded-r-2xl"
        >
          <Trash2 size={18} />
          <span className="text-[9px] font-bold mt-1">Apagar</span>
        </button>
      </div>

      {/* --- CONTEÚDO DA FRENTE (O Gasto em si) --- */}
      <div
        className="relative bg-[#121212] border border-[#222] rounded-2xl z-10 transition-transform duration-200 ease-out active:scale-[0.98] cursor-pointer"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
      >
        {children}
      </div>
    </div>
  );
}