import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Contract } from '../../types';

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

export function ContractCards({ contracts, onEdit, onDelete, getStatusColor, getStatusLabel }: Props) {
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer' | null>(null);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setUserRole(profile.role as 'admin' | 'editor' | 'viewer');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {contracts.map(c => (
         <div key={c.id} onClick={() => onEdit(c)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer relative group">
            
            {/* Ações: Escondidas para Viewer */}
            {userRole !== 'viewer' && (
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(c); }} 
                    className="text-gray-400 hover:text-blue-500 p-1 hover:bg-blue-50 rounded"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  
                  {/* Excluir: Apenas Admin */}
                  {userRole === 'admin' && (
                      <button 
                        onClick={(e) => onDelete(e, c.id!)} 
                        className="text-gray-400 hover:text-red-500 p-1 hover:bg-red-50 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  )}
                </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>{getStatusLabel(c.status)}</span>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-1" title={c.client_name}>{c.client_name}</h3>
            <p className="text-sm text-gray-500 mb-4">{c.client_position}</p>
            <div className="border-t pt-4 flex justify-between items-center text-xs text-gray-500">
               <span>{c.process_count} Processos</span>
               <span className="font-semibold text-salomao-blue truncate max-w-[120px]" title={c.partner_name}>{c.partner_name}</span>
            </div>
         </div>
      ))}
    </div>
  );
}