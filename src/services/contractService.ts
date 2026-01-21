import { supabase } from '../lib/supabase';
import { Contract } from '../types';

export const contractService = {
  async getAll(): Promise<Contract[]> {
    const { data, error } = await supabase
      .from('contracts')
      .select('*');

    if (error) {
      console.error('Erro ao buscar contratos:', error);
      throw error;
    }

    return data || [];
  },

  subscribe(onUpdate: () => void) {
    const subscription = supabase
      .channel('contracts_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contracts' }, onUpdate)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};
