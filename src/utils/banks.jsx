import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

/**
 * Catálogo e utilitários de identificação visual dos bancos brasileiros.
 */
export const KNOWN_BANKS = {
  'mercado pago': {
    name: 'Mercado Pago',
    shortName: 'MP',
    color: '#00aae4',
    badgeClass: 'bg-[#00aae4]/10 text-[#00aae4] border-[#00aae4]/30',
    localLogoUrl: '/logos/mercadopago.png',
  },
  'nubank': {
    name: 'Nubank',
    shortName: 'NU',
    color: '#820AD1',
    badgeClass: 'bg-[#820AD1]/10 text-[#a855f7] border-[#820AD1]/30',
    localLogoUrl: '/logos/nubank.png',
  },
  'inter': {
    name: 'Banco Inter',
    shortName: 'Inter',
    color: '#FF7A00',
    badgeClass: 'bg-[#FF7A00]/10 text-[#FF7A00] border-[#FF7A00]/30',
    localLogoUrl: '/logos/inter.png',
  },
  'itaú': {
    name: 'Itaú',
    shortName: 'Itaú',
    color: '#EC7000',
    badgeClass: 'bg-[#EC7000]/10 text-[#EC7000] border-[#EC7000]/30',
    localLogoUrl: '/logos/itau.png',
  },
  'bradesco': {
    name: 'Bradesco',
    shortName: 'Brad',
    color: '#CC092F',
    badgeClass: 'bg-[#CC092F]/10 text-[#CC092F] border-[#CC092F]/30',
    localLogoUrl: '/logos/bradesco.png',
  },
  'santander': {
    name: 'Santander',
    shortName: 'Sant',
    color: '#EC0000',
    badgeClass: 'bg-[#EC0000]/10 text-[#EC0000] border-[#EC0000]/30',
    localLogoUrl: '/logos/santander.png',
  }
};

/**
 * Retorna os dados visuais do banco dado o nome e/ou a logoUrl da Pluggy.
 */
export function getBankInfo(bankName = '', customLogoUrl = null) {
  const normalized = (bankName || '').toLowerCase().trim();

  for (const [key, info] of Object.entries(KNOWN_BANKS)) {
    if (normalized.includes(key)) {
      return {
        ...info,
        logoUrl: customLogoUrl // Guardamos a da Pluggy como plano B
      };
    }
  }

  // Fallback caso seja outro banco não mapeado
  return {
    name: bankName || 'Banco Conectado',
    shortName: bankName ? bankName.slice(0, 3).toUpperCase() : 'BCO',
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    localLogoUrl: null,
    logoUrl: customLogoUrl
  };
}

/**
 * Componente de Tag / Badge do Banco com sistema de fallback de imagens.
 */
export function BankBadge({ bankName = 'Mercado Pago', logoUrl = null, className = '' }) {
  const bank = getBankInfo(bankName, logoUrl);
  
  const [imgSrc, setImgSrc] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Lógica de fallback estruturado
  useEffect(() => {
    setImgError(false);
    if (bank.localLogoUrl) {
      setImgSrc(bank.localLogoUrl);
    } else if (bank.logoUrl) {
      setImgSrc(bank.logoUrl);
    } else {
      setImgError(true);
    }
  }, [bank.localLogoUrl, bank.logoUrl]);

  const handleError = () => {
    if (imgSrc === bank.localLogoUrl && bank.logoUrl) {
      // Se a logo local falhou (ex: não baixamos o png ainda), tenta a da Pluggy
      setImgSrc(bank.logoUrl);
    } else {
      // Se a da Pluggy falhou (ou se ela não existia), desiste e mostra o ícone de prédio
      setImgError(true);
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${bank.badgeClass} ${className}`}>
      {!imgError && imgSrc ? (
        <img 
          src={imgSrc} 
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
