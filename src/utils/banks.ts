export interface BankInfo {
  name: string;
  shortName: string;
  color: string;
  badgeClass: string;
  localLogoUrl: string | null;
  logoUrl?: string | null;
}

export const KNOWN_BANKS: Record<string, Omit<BankInfo, 'logoUrl'>> = {
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

export function getBankInfo(bankName: string = '', customLogoUrl: string | null = null): BankInfo {
  const normalized = (bankName || '').toLowerCase().trim();

  for (const [key, info] of Object.entries(KNOWN_BANKS)) {
    if (normalized.includes(key)) {
      return {
        ...info,
        logoUrl: customLogoUrl
      };
    }
  }

  return {
    name: bankName || 'Banco Conectado',
    shortName: bankName ? bankName.slice(0, 3).toUpperCase() : 'BCO',
    color: '#3b82f6',
    badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    localLogoUrl: null,
    logoUrl: customLogoUrl
  };
}
