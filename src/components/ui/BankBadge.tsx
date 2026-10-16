import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { getBankInfo } from '../../utils/banks';

interface BankBadgeProps {
  bankName?: string | null;
  logoUrl?: string | null;
  className?: string;
}

/**
 * Componente de Tag / Badge do Banco com sistema de fallback de imagens.
 */
export function BankBadge({ bankName = 'Banco Conectado', logoUrl = null, className = '' }: BankBadgeProps) {
  const bank = getBankInfo(bankName || 'Banco Conectado', logoUrl || null);
  const preferredSrc = bank.localLogoUrl || bank.logoUrl || null;

  const [currentSrc, setCurrentSrc] = useState<string | null>(preferredSrc);
  const [hasError, setHasError] = useState(!preferredSrc);
  const [prevPreferred, setPrevPreferred] = useState<string | null>(preferredSrc);

  if (prevPreferred !== preferredSrc) {
    setPrevPreferred(preferredSrc);
    setCurrentSrc(preferredSrc);
    setHasError(!preferredSrc);
  }

  const handleError = () => {
    if (currentSrc === bank.localLogoUrl && bank.logoUrl) {
      // Se a logo local falhou, tenta a remota da Pluggy
      setCurrentSrc(bank.logoUrl);
    } else {
      // Se já era a remota ou não há outra, cai para o ícone
      setHasError(true);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${bank.badgeClass} ${className}`}>
      {!hasError && currentSrc ? (
        <img 
          src={currentSrc} 
          alt={bank.name} 
          className="w-3.5 h-3.5 rounded-full object-cover shrink-0 bg-white"
          onError={handleError}
        />
      ) : (
        <Building2 size={12} className="shrink-0" />
      )}
      <span className="truncate max-w-[90px]">{bank.name}</span>
    </span>
  );
}

export default BankBadge;
