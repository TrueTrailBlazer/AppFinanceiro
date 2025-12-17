import React from 'react';

export function SummaryCard({ title, value, type = 'neutral', onClick }) {
  const formatMoney = (val) => Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const colors = {
    neutral: 'border-[#222] bg-[#121212] text-white',
    highlight: 'border-blue-600/50 bg-blue-900/10 text-blue-400',
    danger: 'border-red-600/50 bg-red-900/10 text-red-400',
    success: 'border-green-600/50 bg-green-900/10 text-green-400',
  };

  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between h-32 ${colors[type]} ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <p className="text-xs uppercase tracking-wider font-semibold opacity-70">{title}</p>
      <h3 className="text-2xl font-bold text-white">{formatMoney(value)}</h3>
    </div>
  );
}