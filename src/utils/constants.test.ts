import { describe, it, expect } from 'vitest';
import { CATEGORIES, getCategory, type CategoryKey } from './constants';

describe('constants - CATEGORIES', () => {
  it('deve possuir todas as categorias essenciais', () => {
    const requiredKeys: CategoryKey[] = [
      'food',
      'transport',
      'housing',
      'shopping',
      'entertainment',
      'health',
      'education',
      'bills',
      'services',
      'salary',
      'investment',
      'extra',
      'others'
    ];

    for (const key of requiredKeys) {
      expect(CATEGORIES[key]).toBeDefined();
      expect(CATEGORIES[key].label).toBeTruthy();
      expect(CATEGORIES[key].icon).toBeDefined();
      expect(CATEGORIES[key].color).toBeTruthy();
      expect(CATEGORIES[key].bg).toBeTruthy();
    }
  });
});

describe('constants - getCategory', () => {
  it('deve retornar a categoria correta para chave existente', () => {
    const cat = getCategory('food');
    expect(cat.label).toBe('Alimentação');
    expect(cat.color).toBe('text-orange-500');
  });

  it('deve retornar a categoria "others" para chave inexistente ou vazia', () => {
    expect(getCategory(null)).toEqual(CATEGORIES.others);
    expect(getCategory(undefined)).toEqual(CATEGORIES.others);
    expect(getCategory('')).toEqual(CATEGORIES.others);
    expect(getCategory('chave_que_nao_existe')).toEqual(CATEGORIES.others);
  });
});
