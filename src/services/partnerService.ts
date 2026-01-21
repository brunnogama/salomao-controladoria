import { supabase } from '../lib/supabase';
import { Partner } from '../types';

export const partnerService = {
  async getAll(): Promise<Partner[]> {
    const { data, error } = await supabase
      .from('partners')
      .select('id, name'); // Buscando apenas o necessário para o dashboard

    if (error) {
      console.error('Erro ao buscar sócios:', error);
      throw error;
    }

    return data || [];
  }
};