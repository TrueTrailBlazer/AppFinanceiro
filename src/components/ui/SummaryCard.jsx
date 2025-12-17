import React from 'react';

export function SummaryCard({ title, value, type = 'neutral', onClick }) {
  const formatMoney = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const colors = {
    neutral: 'border-[#222] bg-[#121212] text-white',
    highlight: 'border-blue-600/30 bg-blue-900/10 text-blue-400',
    danger: 'border-red-600/30 bg-red-900/10 text-red-400',
    success: 'border-green-600/30 bg-green-900/10 text-green-400',
  };

  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between min-h-[80px] ${colors[type]} ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold opacity-70 truncate">{title}</p>
      <h3 className="text-lg font-bold truncate">{formatMoney(value)}</h3>
    </div>
  );
}