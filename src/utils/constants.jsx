import {
  Utensils, Car, Home, ShoppingBag, Gamepad2, Heart, Book, 
  Briefcase, Landmark, Zap, CircleDollarSign, Smartphone, 
  Shield
} from 'lucide-react';

export const CATEGORIES = {
  // --- DESPESAS ---
  food: { label: 'Alimentação', icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  transport: { label: 'Transporte', icon: Car, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  housing: { label: 'Casa', icon: Home, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  shopping: { label: 'Compras', icon: ShoppingBag, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  entertainment: { label: 'Lazer', icon: Gamepad2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  health: { label: 'Saúde', icon: Heart, color: 'text-red-500', bg: 'bg-red-500/10' },
  education: { label: 'Educação', icon: Book, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  bills: { label: 'Contas', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  services: { label: 'Serviços', icon: Smartphone, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  
  // --- RECEITAS ---
  salary: { label: 'Salário', icon: Briefcase, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  investment: { label: 'Rendimentos', icon: Landmark, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  extra: { label: 'Extra', icon: CircleDollarSign, color: 'text-lime-400', bg: 'bg-lime-400/10' },
  
  // --- PADRÃO ---
  others: { label: 'Outros', icon: Shield, color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

export const getCategory = (key) => CATEGORIES[key] || CATEGORIES.others;