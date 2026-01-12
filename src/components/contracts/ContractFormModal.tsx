import React from 'react';
import { X, Plus, Trash2, Save, Loader2, Search, Edit2, History } from 'lucide-react';
import { Contract, Partner, ContractProcess, TimelineEvent, Analyst } from '../../types';
import { currencyMask, phoneMask, cnpjMask, cpfMask } from '../../utils/masks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  onSave: () => void;
  loading: boolean;
  isEditing: boolean;
  partners: Partner[];
  onOpenPartnerManager: () => void;
  analysts: Analyst[];
  onOpenAnalystManager: () => void;
  // CORREÇÃO AQUI: Definindo que a função recebe uma string (cnpj)
  onCNPJSearch: (cnpj: string) => void;
  processes: ContractProcess[];
  currentProcess: ContractProcess;
  setCurrentProcess: (p: ContractProcess) => void;
  editingProcessIndex: number | null;
  handleProcessAction: () => void;
  editProcess: (idx: number) => void;
  removeProcess: (idx: number) => void;
  newIntermediateFee: string;
  setNewIntermediateFee: (v: string) => void;
  addIntermediateFee: () => void;
  removeIntermediateFee: (idx: number) => void;
  timelineData: TimelineEvent[];
  getStatusColor: (s: string) => string;
  getStatusLabel: (s: string) => string;
}

export function ContractFormModal({
  isOpen, onClose, formData, setFormData, onSave, loading, isEditing,
  partners, onOpenPartnerManager, analysts, onOpenAnalystManager, onCNPJSearch,
  processes, currentProcess, setCurrentProcess, editingProcessIndex,
  handleProcessAction, editProcess, removeProcess,
  newIntermediateFee, setNewIntermediateFee, addIntermediateFee, removeIntermediateFee,
  timelineData, getStatusColor, getStatusLabel
}: Props) {
  
  if (!isOpen) return null;

  const saveToDatabase = async () => {
    try {
      const { supabase } = await import('../../lib/supabase');
      
      const contractData = {
        ...formData,
        pro_labore: formData.pro_labore,
        fixed_monthly_fee: formData.fixed_monthly_fee,
        final_success_fee: formData.final_success_fee,
        intermediate_fees: formData.intermediate_fees
      };

      let contractId = formData.id;

      if (isEditing) {
        const { error } = await supabase.from('contracts').update(contractData).eq('id', formData.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contracts').insert([contractData]).select();
        if (error) throw error;
        contractId = data[0].id;
      }

      // Salvar processos
      if (processes.length > 0 && contractId) {
        await supabase.from('contract_processes').delete().eq('contract_id', contractId);
        
        const processesToSave = processes.map(p => ({
          ...p,
          contract_id: contractId
        }));
        
        const { error: procError } = await supabase.from('contract_processes').insert(processesToSave);
        if (procError) throw procError;
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar contrato.');
    }
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    const now = new Date().toISOString();
    let updates: any = { status: newStatus };

    if (newStatus === 'proposal' && !formData.proposal_date) updates.proposal_date = now;
    if (newStatus === 'active' && !formData.contract_date) updates.contract_date = now;
    if (newStatus === 'rejected' && !formData.rejection_date) updates.rejection_date = now;
    if (newStatus === 'probono' && !formData.probono_date) updates.probono_date = now;

    setFormData({ ...formData, ...updates });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              {isEditing ? <Edit2 className="w-5 h-5 text-salomao-blue" /> : <Plus className="w-5 h-5 text-salomao-blue" />}
              {isEditing ? 'Editar Contrato' : 'Novo Contrato'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Preencha os dados do cliente e detalhes do caso.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          <section>
            <h3 className="text-sm font-bold text-salomao-blue uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Identificação do Cliente</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-12 flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="no_cnpj"
                  checked={formData.has_no_cnpj || false} 
                  onChange={(e) => setFormData({...formData, has_no_cnpj: e.target.checked})}
                  className="rounded border-gray-300 text-salomao-blue focus:ring-salomao-blue"
                />
                <label htmlFor="no_cnpj" className="text-sm text-gray-700 font-medium cursor-pointer">Cliente sem CNPJ/CPF (Internacional ou Outro)</label>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">CNPJ / CPF</label>
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    disabled={formData.has_no_cnpj}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none disabled:opacity-50"
                    value={formData.cnpj}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 11) setFormData({ ...formData, cnpj: cpfMask(e.target.value) });
                      else setFormData({ ...formData, cnpj: cnpjMask(e.target.value) });
                    }}
                    placeholder="00.000.000/0000-00"
                  />
                  <button 
                    onClick={() => onCNPJSearch(formData.cnpj)}
                    disabled={formData.has_no_cnpj}
                    className="px-3 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors disabled:opacity-50"
                    title="Buscar dados na Receita"
                  >
                    <Search size={18} />
                  </button>
                </div>
              </div>

              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Cliente / Razão Social</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue outline-none font-medium text-gray-800"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  placeholder="Nome completo ou Razão Social"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Posição do Cliente</label>
                <select
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue cursor-pointer"
                  value={formData.client_position}
                  onChange={(e) => setFormData({ ...formData, client_position: e.target.value as 'Autor' | 'Réu' })}
                >
                  <option value="Autor">Autor</option>
                  <option value="Réu">Réu</option>
                  <option value="Terceiro">Terceiro Interessado</option>
                </select>
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">Telefone</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: phoneMask(e.target.value) })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                />
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-salomao-blue uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Dados do Caso</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Sócio Responsável <button onClick={onOpenPartnerManager} className="text-blue-500 hover:text-blue-700 ml-1 text-[10px]">(Gerenciar)</button></label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue cursor-pointer"
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {partners.map(p => (<option key={p.id} value={p.id}>{p.name}</option>))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Analista/Advogado <button onClick={onOpenAnalystManager} className="text-blue-500 hover:text-blue-700 ml-1 text-[10px]">(Gerenciar)</button></label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue cursor-pointer"
                  value={formData.analyst_id || ''}
                  onChange={(e) => setFormData({ ...formData, analyst_id: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  {analysts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Área de Atuação</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue cursor-pointer"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                >
                  <option value="">Selecione...</option>
                  <option value="Cível">Cível</option>
                  <option value="Trabalhista">Trabalhista</option>
                  <option value="Tributário">Tributário</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Societário">Societário</option>
                  <option value="Penal">Penal</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">UF</label>
                <input
                  type="text" maxLength={2}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue uppercase text-center font-bold"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-gray-700 mb-1">Número HON</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue font-mono"
                  value={formData.hon_number || ''}
                  onChange={(e) => setFormData({ ...formData, hon_number: e.target.value })}
                  placeholder="0000/2024"
                />
              </div>

              <div className="md:col-span-9">
                <label className="block text-xs font-bold text-gray-700 mb-1">Objeto do Contrato</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
                  value={formData.contract_object || ''}
                  onChange={(e) => setFormData({ ...formData, contract_object: e.target.value })}
                  placeholder="Ex: Ação de Cobrança, Defesa em Reclamação Trabalhista..."
                />
              </div>

            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-salomao-blue uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center justify-between">
              Processos Judiciais
              <span className="text-xs normal-case text-gray-500 font-normal bg-gray-100 px-2 py-0.5 rounded-full">{processes.length} cadastrados</span>
            </h3>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Número do Processo</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue font-mono"
                    value={currentProcess.process_number}
                    onChange={(e) => setCurrentProcess({...currentProcess, process_number: e.target.value})}
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Vara / Órgão</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
                    value={currentProcess.court || ''}
                    onChange={(e) => setCurrentProcess({...currentProcess, court: e.target.value})}
                    placeholder="Ex: 1ª Vara Cível"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-gray-600 mb-1">Link do Processo</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-salomao-blue"
                    value={currentProcess.link || ''}
                    onChange={(e) => setCurrentProcess({...currentProcess, link: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2">
                  <button 
                    onClick={handleProcessAction}
                    disabled={!currentProcess.process_number}
                    className="w-full py-2 bg-salomao-blue hover:bg-blue-900 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                  >
                    {editingProcessIndex !== null ? 'Atualizar' : 'Adicionar'}
                  </button>
                </div>
              </div>
            </div>

            {processes.length > 0 && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-600 font-bold">
                    <tr>
                      <th className="p-3">Número</th>
                      <th className="p-3">Vara</th>
                      <th className="p-3">Link</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {processes.map((proc, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-3 font-mono">{proc.process_number}</td>
                        <td className="p-3">{proc.court || '-'}</td>
                        <td className="p-3">
                          {proc.link ? (
                            <a href={proc.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[150px] block">Abrir Link</a>
                          ) : '-'}
                        </td>
                        <td className="p-3 text-right flex justify-end gap-2">
                          <button onClick={() => editProcess(idx)} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit2 size={14} /></button>
                          <button onClick={() => removeProcess(idx)} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h3 className="text-sm font-bold text-salomao-blue uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">Proposta Financeira</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Pró-Labore (Entrada)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-blue-50/50 border border-blue-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue font-bold text-blue-900"
                  value={formData.pro_labore}
                  onChange={(e) => setFormData({ ...formData, pro_labore: currencyMask(e.target.value) })}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Honorários Mensais (Manutenção)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue"
                  value={formData.fixed_monthly_fee || ''}
                  onChange={(e) => setFormData({ ...formData, fixed_monthly_fee: currencyMask(e.target.value) })}
                  placeholder="R$ 0,00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Êxito Final</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-green-50/50 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-salomao-blue font-bold text-green-900"
                  value={formData.final_success_fee}
                  onChange={(e) => setFormData({ ...formData, final_success_fee: currencyMask(e.target.value) })}
                  placeholder="R$ 0,00"
                />
              </div>

              <div className="md:col-span-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="block text-xs font-bold text-gray-700 mb-2">Honorários de Êxito Intermediários (Opcional)</label>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                    placeholder="Valor R$ 0,00"
                    value={newIntermediateFee}
                    onChange={(e) => setNewIntermediateFee(currencyMask(e.target.value))}
                  />
                  <button onClick={addIntermediateFee} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 rounded-lg font-bold text-sm">Adicionar</button>
                </div>
                {formData.intermediate_fees && formData.intermediate_fees.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.intermediate_fees.map((fee, index) => (
                      <span key={index} className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                        {fee}
                        <button onClick={() => removeIntermediateFee(index)} className="ml-2 text-red-500 hover:text-red-700"><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </section>

          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 border-b border-blue-200 pb-2">Status do Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">Fase Atual</label>
                <select
                  className={`w-full px-3 py-2 rounded-lg text-sm font-bold outline-none border-2 cursor-pointer ${getStatusColor(formData.status)}`}
                  value={formData.status}
                  onChange={handleStatusChange}
                >
                  <option value="analysis">Sob Análise</option>
                  <option value="proposal">Proposta Enviada</option>
                  <option value="active">Contrato Fechado</option>
                  <option value="rejected">Rejeitado</option>
                  <option value="probono">Probono</option>
                </select>
              </div>

              {formData.status === 'proposal' && (
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Data da Proposta</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm" value={formData.proposal_date ? formData.proposal_date.split('T')[0] : ''} onChange={(e) => setFormData({...formData, proposal_date: e.target.value})} />
                </div>
              )}

              {formData.status === 'active' && (
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1">Data do Fechamento</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm" value={formData.contract_date ? formData.contract_date.split('T')[0] : ''} onChange={(e) => setFormData({...formData, contract_date: e.target.value})} />
                </div>
              )}

              {formData.status === 'rejected' && (
                <div>
                  <label className="block text-xs font-bold text-red-900 mb-1">Data da Rejeição</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm" value={formData.rejection_date ? formData.rejection_date.split('T')[0] : ''} onChange={(e) => setFormData({...formData, rejection_date: e.target.value})} />
                </div>
              )}

              {formData.status === 'active' && (
                <div className="flex items-center mt-6">
                  <input 
                    type="checkbox" 
                    id="physical_signature"
                    checked={formData.physical_signature || false} 
                    onChange={(e) => setFormData({...formData, physical_signature: e.target.checked})}
                    className="w-5 h-5 text-salomao-blue rounded border-gray-300 focus:ring-salomao-blue"
                  />
                  <label htmlFor="physical_signature" className="ml-2 text-sm font-bold text-blue-900 cursor-pointer">Assinatura Física Coletada?</label>
                </div>
              )}

            </div>
          </section>

          {isEditing && timelineData.length > 0 && (
            <section>
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"><History size={16} /> Histórico de Alterações</h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-40 overflow-y-auto">
                    {timelineData.map((event) => (
                        <div key={event.id} className="flex gap-3 text-xs text-gray-600 mb-2 last:mb-0">
                            <span className="font-mono text-gray-400">{new Date(event.changed_at).toLocaleString()}</span>
                            <span className="font-bold">{event.changed_by_email || 'Sistema'}</span>
                            <span>{event.old_status ? `alterou de ${getStatusLabel(event.old_status)} para ${getStatusLabel(event.new_status)}` : `definiu como ${getStatusLabel(event.new_status)}`}</span>
                        </div>
                    ))}
                </div>
            </section>
          )}

        </div>

        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-gray-600 hover:bg-gray-200 font-bold transition-colors">Cancelar</button>
          <button 
            onClick={saveToDatabase} 
            disabled={loading}
            className="px-6 py-2 bg-salomao-gold hover:bg-yellow-600 text-white rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar Contrato
          </button>
        </div>

      </div>
    </div>
  );
}