import React from 'react';
import { Settings, Check, Plus, Search, Loader2, Link as LinkIcon, AlertTriangle, Gavel, X } from 'lucide-react';
import { CustomSelect } from '../../ui/CustomSelect';
import { Contract, ContractProcess, Magistrate } from '../../../types';
import { maskMoney, maskCNPJ } from '../../../utils/masks';

interface LegalProcessFormProps {
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  currentProcess: ContractProcess;
  setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>;
  isStandardCNJ: boolean;
  setIsStandardCNJ: (v: boolean) => void;
  otherProcessType: string;
  setOtherProcessType: (v: string) => void;
  duplicateProcessWarning: boolean;
  searchingCNJ: boolean;
  handleCNJSearch: () => void;
  handleOpenJusbrasil: () => void;
  courtSelectOptions: { label: string; value: string }[];
  ufOptions: { label: string; value: string }[];
  positionOptions: { label: string; value: string }[];
  authorOptions: string[];
  opponentOptions: string[];
  duplicateOpponentCases: any[];
  magistrateTypes: { label: string; value: string }[];
  magistrateOptions: string[];
  newMagistrateTitle: string;
  setNewMagistrateTitle: (v: string) => void;
  newMagistrateName: string;
  setNewMagistrateName: (v: string) => void;
  addMagistrate: (name: string) => void;
  removeMagistrate: (index: number) => void;
  numeralOptions: { label: string; value: string }[];
  varaSelectOptions: { label: string; value: string }[];
  comarcaSelectOptions: { label: string; value: string }[];
  justiceSelectOptions: { label: string; value: string }[];
  classSelectOptions: { label: string; value: string }[];
  subjectSelectOptions: { label: string; value: string }[];
  newSubject: string;
  setNewSubject: (v: string) => void;
  addSubjectToProcess: () => void;
  removeSubject: (subject: string) => void;
  editingProcessIndex: number | null;
  handleProcessAction: () => void;
  handlePartyCNPJSearch: (type: 'author' | 'opponent') => void;
  localMaskCNJ: (v: string) => string;
  ensureDateValue: (v?: string | null) => string;
  setActiveManager: (v: string) => void;
}

export function LegalProcessForm(props: LegalProcessFormProps) {
  const {
    formData, setFormData, currentProcess, setCurrentProcess, isStandardCNJ, setIsStandardCNJ,
    otherProcessType, setOtherProcessType, duplicateProcessWarning, searchingCNJ, handleCNJSearch, handleOpenJusbrasil,
    courtSelectOptions, ufOptions, positionOptions, authorOptions, opponentOptions, duplicateOpponentCases,
    magistrateTypes, magistrateOptions, newMagistrateTitle, setNewMagistrateTitle, newMagistrateName, setNewMagistrateName,
    addMagistrate, removeMagistrate, numeralOptions, varaSelectOptions, comarcaSelectOptions, justiceSelectOptions,
    classSelectOptions, subjectSelectOptions, newSubject, setNewSubject, addSubjectToProcess, removeSubject,
    editingProcessIndex, handleProcessAction, handlePartyCNPJSearch, localMaskCNJ, ensureDateValue, setActiveManager
  } = props;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Processos Judiciais</h3>
          <div className="flex items-center gap-3">
              <button 
                  type="button" 
                  onClick={() => {
                      setIsStandardCNJ(false);
                      setCurrentProcess({ ...currentProcess, process_number: 'CONSULTORIA', uf: currentProcess.uf || '' });
                      setOtherProcessType('');
                  }}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 hover:bg-blue-100 font-medium transition-colors"
              >
                  Consultoria
              </button>
              <button 
                  type="button" 
                  onClick={() => {
                      setIsStandardCNJ(false);
                      setCurrentProcess({ ...currentProcess, process_number: 'ASSESSORIA JURÍDICA', uf: currentProcess.uf || '' });
                      setOtherProcessType('');
                  }}
                  className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded border border-blue-100 hover:bg-blue-100 font-medium transition-colors"
              >
                  Assessoria Jurídica
              </button>
              <div className="flex items-center">
                  <input type="checkbox" id="no_process" checked={!formData.has_legal_process} onChange={(e) => setFormData({...formData, has_legal_process: !e.target.checked})} className="rounded text-salomao-blue" />
                  <label htmlFor="no_process" className="ml-2 text-xs text-gray-600">Caso sem processo judicial</label>
              </div>
          </div>
      </div>
      {formData.has_legal_process && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          {/* Linha 1: Numero, Tribunal, UF, Posição */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4 items-end">
            <div className={isStandardCNJ ? "md:col-span-5" : "md:col-span-4"}>
                <label className="text-[10px] text-gray-500 uppercase font-bold flex justify-between mb-1">
                    Número do Processo *
                    {currentProcess.process_number && currentProcess.process_number !== 'CONSULTORIA' && currentProcess.process_number !== 'ASSESSORIA JURÍDICA' && (<button onClick={handleOpenJusbrasil} className="text-[10px] text-blue-500 hover:underline flex items-center" title="Abrir no Jusbrasil"><LinkIcon className="w-3 h-3 mr-1" /> Ver Externo</button>)}
                </label>
                <div className="flex items-center">
                    <CustomSelect 
                        value={currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA' ? 'other' : (isStandardCNJ ? 'cnj' : 'other')}
                        onChange={(val: string) => {
                            if (val === 'cnj') {
                                setIsStandardCNJ(true);
                                setCurrentProcess({ ...currentProcess, process_number: '' });
                            } else {
                                setIsStandardCNJ(false);
                                if (currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA') setCurrentProcess({ ...currentProcess, process_number: '' });
                            }
                        }}
                        options={[
                            { label: 'CNJ', value: 'cnj' },
                            { label: 'Outro', value: 'other' }
                        ]}
                        className="mr-2 w-28"
                    />
                    
                    {currentProcess.process_number !== 'CONSULTORIA' && currentProcess.process_number !== 'ASSESSORIA JURÍDICA' && (
                      <div className="flex-1 relative">
                          <input 
                              type="text" 
                              className={`w-full border-b ${duplicateProcessWarning ? 'border-orange-300 bg-orange-50' : 'border-gray-300'} focus:border-salomao-blue outline-none py-1.5 text-sm font-mono pr-8`} 
                              placeholder={isStandardCNJ ? "0000000-00..." : "Nº Processo"} 
                              value={currentProcess.process_number} 
                              onChange={(e) => setCurrentProcess({
                                  ...currentProcess, 
                                  process_number: isStandardCNJ ? localMaskCNJ(e.target.value) : e.target.value
                              })} 
                          />
                          <button 
                              onClick={handleCNJSearch} 
                              disabled={!isStandardCNJ || searchingCNJ || !currentProcess.process_number} 
                              className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold disabled:opacity-30 disabled:cursor-not-allowed transition-colors" 
                              title={isStandardCNJ ? "Identificar Tribunal e UF (Apenas CNJ)" : "Busca automática indisponível para este formato"}
                          >
                                          {searchingCNJ ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                          </button>
                      </div>
                    )}
                    {(currentProcess.process_number === 'CONSULTORIA' || currentProcess.process_number === 'ASSESSORIA JURÍDICA') && (
                       <div className="flex-1">
                          <input type="text" disabled value={currentProcess.process_number} className="w-full border-b border-gray-200 bg-gray-50 text-gray-500 py-1.5 text-sm font-bold" />
                       </div>
                    )}
                </div>
                {duplicateProcessWarning && (
                  <div className="text-[10px] text-orange-600 mt-1 flex items-center font-bold">
                     <AlertTriangle className="w-3 h-3 mr-1" /> Já cadastrado em outro caso.
                  </div>
                )}
            </div>
            
            {/* Campo Extra para Tipo de Processo (se não for CNJ e nem Consultoria/Assessoria) */}
            {!isStandardCNJ && currentProcess.process_number !== 'CONSULTORIA' && currentProcess.process_number !== 'ASSESSORIA JURÍDICA' && (
                <div className="md:col-span-2">
                    <label className="text-[10px] text-gray-500 uppercase font-bold">Tipo (ex: AgInt)</label>
                    <input 
                        type="text" 
                        className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm" 
                        value={otherProcessType} 
                        onChange={(e) => {
                            setOtherProcessType(e.target.value);
                        }} 
                    />
                </div>
            )}
            
            {/* TRIBUNAL como CustomSelect */}
            <div className="md:col-span-2">
                <CustomSelect 
                    label="Tribunal *" 
                    value={currentProcess.court || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, court: val})} 
                    options={courtSelectOptions} 
                    onAction={() => setActiveManager('court')}
                    actionLabel="Gerenciar Tribunais"
                    actionIcon={Settings}
                    placeholder="Selecione"
                    className="custom-select-small" 
                />
            </div>
            <div className="md:col-span-2"><CustomSelect label="Estado (UF) *" value={currentProcess.uf || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, uf: val})} options={ufOptions} placeholder="UF" className="custom-select-small" /></div>
            <div className={isStandardCNJ ? "md:col-span-3" : "md:col-span-2"}><CustomSelect label="Posição do Cliente" value={currentProcess.position || formData.client_position || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, position: val})} options={positionOptions} className="custom-select-small" onAction={() => setActiveManager('position')} actionLabel="Gerenciar Posições" actionIcon={Settings} /></div>
          </div>

          {/* Linha 2: Partes (Autor e Contrário) com CNPJ */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            {/* CNPJ Autor */}
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">CNPJ</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm"
                        value={(currentProcess as any).author_cnpj || ''}
                        onChange={(e) => setCurrentProcess({ ...currentProcess, author_cnpj: maskCNPJ(e.target.value) } as any)}
                    />
                    <button 
                        onClick={() => handlePartyCNPJSearch('author')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Autor */}
            <div className="md:col-span-4">
                <CustomSelect 
                    label="Autor" 
                    value={(currentProcess as any).author || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, author: val} as any)} 
                    options={authorOptions.map(o => ({ label: o, value: o }))}
                    onAction={() => setActiveManager('author')}
                    actionLabel="Gerenciar Autores"
                    actionIcon={Settings}
                    placeholder="Selecione ou adicione"
                />
            </div>

            {/* CNPJ Contrário */}
            <div className="md:col-span-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold">CNPJ</label>
                <div className="relative">
                    <input 
                        type="text" 
                        className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1.5 text-sm"
                        value={(currentProcess as any).opponent_cnpj || ''}
                        onChange={(e) => setCurrentProcess({ ...currentProcess, opponent_cnpj: maskCNPJ(e.target.value) } as any)}
                    />
                    <button 
                        onClick={() => handlePartyCNPJSearch('opponent')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-salomao-blue hover:text-salomao-gold"
                    >
                        <Search className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Contrário */}
            <div className="md:col-span-4">
                <CustomSelect 
                    label="Contrário" 
                    value={currentProcess.opponent || formData.company_name || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, opponent: val})} 
                    options={opponentOptions.map(o => ({ label: o, value: o }))}
                    onAction={() => setActiveManager('opponent')}
                    actionLabel="Gerenciar Contrário"
                    actionIcon={Settings}
                    placeholder="Selecione ou adicione"
                />
                 {duplicateOpponentCases.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                        <span className="text-[10px] text-blue-600 font-bold mr-1">Similar:</span>
                        {duplicateOpponentCases.map(c => (
                            <a key={c.contract_id} href={`/contracts/${c.contracts?.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 truncate max-w-[150px]">
                                            {c.contracts?.client_name}
                            </a>
                        ))}
                    </div>
                )}
            </div>
          </div>

          {/* Linha 3: Magistrado */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-12">
                <label className="text-[10px] text-gray-500 uppercase font-bold">Magistrado</label>
                <div className="flex gap-2">
                    <div className="w-40">
                        <CustomSelect 
                            value={newMagistrateTitle} 
                            onChange={(val: string) => setNewMagistrateTitle(val)} 
                            options={magistrateTypes} 
                        />
                    </div>
                    <div className="flex-1">
                        <CustomSelect 
                            value={newMagistrateName}
                            onChange={(val: string) => setNewMagistrateName(val)}
                            options={magistrateOptions.map(m => ({ label: m, value: m }))}
                            placeholder="Selecione magistrado"
                            onAction={() => setActiveManager('magistrate')}
                            actionLabel="Gerenciar Magistrados"
                            actionIcon={Settings}
                        />
                    </div>
                    <button onClick={() => addMagistrate(newMagistrateName)} className="text-salomao-blue hover:text-blue-700 font-bold px-2 rounded-lg bg-blue-50">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {currentProcess.magistrates?.map((m, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-gray-200">
                            <Gavel size={10} className="text-gray-400" />
                            <b>{m.title}:</b> {m.name}
                            <button onClick={() => removeMagistrate(idx)} className="ml-1 text-red-400 hover:text-red-600"><X size={10} /></button>
                        </span>
                    ))}
                </div>
            </div>
          </div>

          {/* Linha 4: Numeral | Vara | Comarca */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-3">
                <CustomSelect 
                    label="Numeral" 
                    value={(currentProcess as any).numeral || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, numeral: val} as any)} 
                    options={numeralOptions} 
                    placeholder="Nº"
                />
            </div>
            {/* VARA COMO MENU SUSPENSO */}
            <div className="md:col-span-5">
                <CustomSelect 
                    label="Vara" 
                    value={currentProcess.vara || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, vara: val})} 
                    options={varaSelectOptions}
                    onAction={() => setActiveManager('vara')}
                    actionLabel="Gerenciar Varas"
                    actionIcon={Settings}
                    placeholder="Selecione ou adicione"
                />
            </div>
            {/* COMARCA COMO MENU SUSPENSO */}
            <div className="md:col-span-4">
                <CustomSelect 
                    label="Comarca" 
                    value={currentProcess.comarca || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, comarca: val})} 
                    options={comarcaSelectOptions} 
                    onAction={() => setActiveManager('comarca')}
                    actionLabel="Gerenciar Comarcas"
                    actionIcon={Settings}
                    placeholder={currentProcess.uf ? "Selecione a Comarca" : "Selecione o Estado Primeiro"}
                    disabled={!currentProcess.uf}
                />
            </div>
          </div>

          {/* Linha 5: Data Distribuição, Justiça, Valor da Causa */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
            <div className="md:col-span-3"><label className="text-[10px] text-gray-500 uppercase font-bold">Data da Distribuição</label><input type="date" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm bg-transparent" value={ensureDateValue(currentProcess.distribution_date)} onChange={(e) => setCurrentProcess({...currentProcess, distribution_date: e.target.value})} /></div>
            <div className="md:col-span-4"><CustomSelect label="Justiça" value={currentProcess.justice_type || ''} onChange={(val: string) => setCurrentProcess({...currentProcess, justice_type: val})} options={justiceSelectOptions} onAction={() => setActiveManager('justice')} actionLabel="Gerenciar Justiças" actionIcon={Settings} /></div>
            <div className="md:col-span-5"><label className="text-[10px] text-gray-500 uppercase font-bold">Valor da Causa (R$)</label><input type="text" className="w-full border-b border-gray-300 focus:border-salomao-blue outline-none py-1 text-sm" value={currentProcess.cause_value || ''} onChange={(e) => setCurrentProcess({...currentProcess, cause_value: maskMoney(e.target.value)})} /></div>
          </div>

          {/* Linha 6: Classe, Assunto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* CLASSE COMO MENU SUSPENSO */}
            <div>
                <CustomSelect 
                    label="Classe" 
                    value={currentProcess.process_class || ''} 
                    onChange={(val: string) => setCurrentProcess({...currentProcess, process_class: val})} 
                    options={classSelectOptions}
                    onAction={() => setActiveManager('class')}
                    actionLabel="Gerenciar Classes"
                    actionIcon={Settings}
                    placeholder="Selecione a Classe"
                />
            </div>
            
            {/* ASSUNTO COM MENU SUSPENSO (ADAPTADO PARA INPUT/SELECT) */}
            <div>
                <label className="text-[10px] text-gray-500 uppercase font-bold">Assunto</label>
                <div className="flex gap-2">
                     <div className="flex-1">
                        <CustomSelect 
                            value={newSubject}
                            onChange={(val: string) => setNewSubject(val)}
                            options={subjectSelectOptions}
                            placeholder="Selecione ou digite novo"
                            onAction={() => setActiveManager('subject')}
                            actionLabel="Gerenciar Assuntos"
                            actionIcon={Settings}
                        />
                     </div>
                    <button onClick={addSubjectToProcess} className="text-salomao-blue hover:text-blue-700 font-bold px-3 rounded-lg bg-blue-50">+</button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    {currentProcess.subject && currentProcess.subject.split(';').map(s => s.trim()).filter(s => s !== '').map((subj, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 border border-gray-200">
                            {subj}
                            <button onClick={() => removeSubject(subj)} className="ml-1 text-red-400 hover:text-red-600"><X size={10} /></button>
                        </span>
                    ))}
                </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <div className="flex justify-end mt-4">
                <button onClick={handleProcessAction} className="bg-salomao-blue text-white rounded px-4 py-2 hover:bg-blue-900 transition-colors flex items-center justify-center shadow-md text-sm font-bold w-full md:w-auto">
                    {editingProcessIndex !== null ? <><Check className="w-4 h-4 mr-2" /> Atualizar Processo</> : <><Plus className="w-4 h-4 mr-2" /> Adicionar Processo</>}
                </button>
          </div>
        </div>
      )}
    </div>
  );
}