import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Contract, ContractProcess } from '../types';
import { toTitleCase } from '../utils/masks';

// Defaults
const DEFAULT_COURTS = ['STF', 'STJ', 'TST', 'TRF1', 'TRF2', 'TRF3', 'TRF4', 'TRF5', 'TJSP', 'TJRJ', 'TJMG', 'TJRS', 'TJPR', 'TJSC', 'TJBA', 'TJDFT', 'TRT1', 'TRT2', 'TRT15'];
const DEFAULT_CLASSES = ['Procedimento Comum', 'Execução de Título Extrajudicial', 'Monitória', 'Mandado de Segurança', 'Ação Trabalhista - Rito Ordinário', 'Ação Trabalhista - Rito Sumaríssimo', 'Recurso Ordinário', 'Agravo de Instrumento', 'Apelação'];
const DEFAULT_SUBJECTS = ['Dano Moral', 'Dano Material', 'Inadimplemento', 'Rescisão Indireta', 'Verbas Rescisórias', 'Acidente de Trabalho', 'Doença Ocupacional', 'Horas Extras', 'Assédio Moral'];
const DEFAULT_POSITIONS = ['Autor', 'Réu', 'Terceiro Interessado', 'Exequente', 'Executado', 'Reclamante', 'Reclamado', 'Apelante', 'Apelado', 'Agravante', 'Agravado', 'Impetrante', 'Impetrado'];
const DEFAULT_VARAS = ['Cível', 'Criminal', 'Família', 'Trabalho', 'Fazenda Pública', 'Juizado Especial', 'Execuções Fiscais'];
const DEFAULT_JUSTICES = ['Estadual', 'Federal', 'Trabalho', 'Eleitoral', 'Militar'];

interface UseContractOptionsProps {
  formData: Contract;
  setFormData: React.Dispatch<React.SetStateAction<Contract>>;
  currentProcess: ContractProcess;
  setCurrentProcess: React.Dispatch<React.SetStateAction<ContractProcess>>;
  activeManager: string | null;
}

export function useContractOptions({ formData, setFormData, currentProcess, setCurrentProcess, activeManager }: UseContractOptionsProps) {
  // Estados Locais das Listas
  const [legalAreas, setLegalAreas] = useState<string[]>(['Trabalhista', 'Cível', 'Tributário', 'Empresarial', 'Previdenciário', 'Família', 'Criminal', 'Consumidor']);
  const [billingLocations, setBillingLocations] = useState(['Salomão RJ', 'Salomão SP', 'Salomão SC', 'Salomão ES', 'Salomão DF']);
  
  const [courtOptions, setCourtOptions] = useState<string[]>(DEFAULT_COURTS);
  const [classOptions, setClassOptions] = useState<string[]>(DEFAULT_CLASSES);
  const [subjectOptions, setSubjectOptions] = useState<string[]>(DEFAULT_SUBJECTS);
  const [positionsList, setPositionsList] = useState<string[]>(DEFAULT_POSITIONS);
  const [varaOptions, setVaraOptions] = useState<string[]>(DEFAULT_VARAS);
  const [justiceOptions, setJusticeOptions] = useState<string[]>(DEFAULT_JUSTICES);
  
  const [comarcaOptions, setComarcaOptions] = useState<string[]>([]);
  const [magistrateOptions, setMagistrateOptions] = useState<string[]>([]);
  const [opponentOptions, setOpponentOptions] = useState<string[]>([]);
  const [authorOptions, setAuthorOptions] = useState<string[]>([]);
  const [clientOptions, setClientOptions] = useState<string[]>([]);

  // Carregar dados iniciais
  const fetchAuxiliaryTables = async () => {
    const { data: courts } = await supabase.from('courts').select('name').order('name');
    if (courts) setCourtOptions(Array.from(new Set([...DEFAULT_COURTS, ...courts.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: classes } = await supabase.from('process_classes').select('name').order('name');
    if (classes) setClassOptions(Array.from(new Set([...DEFAULT_CLASSES, ...classes.map(c => c.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: subjects } = await supabase.from('process_subjects').select('name').order('name');
    if (subjects) setSubjectOptions(Array.from(new Set([...DEFAULT_SUBJECTS, ...subjects.map(s => s.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: positions } = await supabase.from('process_positions').select('name').order('name');
    if (positions) setPositionsList(Array.from(new Set([...DEFAULT_POSITIONS, ...positions.map(p => p.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: varas } = await supabase.from('process_varas').select('name').order('name');
    if (varas) setVaraOptions(Array.from(new Set([...DEFAULT_VARAS, ...varas.map(v => v.name)])).sort((a, b) => a.localeCompare(b)));

    const { data: justices } = await supabase.from('process_justice_types').select('name').order('name');
    if (justices) setJusticeOptions(Array.from(new Set([...DEFAULT_JUSTICES, ...justices.map(j => j.name)])).sort((a, b) => a.localeCompare(b)));

    // 🔧 CORREÇÃO: Remover duplicatas de magistrados
    const { data: mags } = await supabase.from('magistrates').select('name').order('name');
    if (mags) {
      const uniqueMagistrates = Array.from(new Set(mags.map(m => m.name))).sort((a, b) => a.localeCompare(b));
      setMagistrateOptions(uniqueMagistrates);
    }

    // 🔧 CORREÇÃO: Remover duplicatas de contrários
    const { data: opps } = await supabase.from('opponents').select('name').order('name');
    if (opps) {
      const uniqueOpponents = Array.from(new Set(opps.map(o => o.name))).sort((a, b) => a.localeCompare(b));
      setOpponentOptions(uniqueOpponents);
    }
    
    // 🔧 CORREÇÃO: Remover duplicatas de autores
    const { data: authors } = await supabase.from('authors').select('name').order('name');
    if (authors) {
      const uniqueAuthors = Array.from(new Set(authors.map(a => a.name))).sort((a, b) => a.localeCompare(b));
      setAuthorOptions(uniqueAuthors);
    }

    // 🔧 CORREÇÃO PRINCIPAL: Remover duplicatas de clientes
    const { data: clients } = await supabase.from('clients').select('name').order('name');
    if (clients) {
      const uniqueClients = Array.from(new Set(clients.map(c => c.name).filter(name => name && name.trim() !== ''))).sort((a, b) => a.localeCompare(b));
      setClientOptions(uniqueClients);
    }

    fetchComarcas(currentProcess.uf);
  };

  const fetchComarcas = async (uf?: string) => {
    let query = supabase.from('comarcas').select('name');
    if (uf) query = query.eq('uf', uf);
    const { data } = await query.order('name');
    if (data) setComarcaOptions(data.map(c => c.name).sort((a, b) => a.localeCompare(b)));
  };

  useEffect(() => {
    fetchComarcas(currentProcess.uf);
  }, [currentProcess.uf]);

  // Lógica de Adicionar
  const handleGenericAdd = async (value: string, extraData?: { title?: string, setNewSubject?: (v: string) => void, setNewMagistrateName?: (v: string) => void }) => {
      const cleanValue = toTitleCase(value.trim());
      if (!cleanValue) return false;

      let error = null;
      
      switch(activeManager) {
        case 'area':
            if (!legalAreas.includes(cleanValue)) {
                setLegalAreas(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                setFormData(prev => ({ ...prev, area: cleanValue }));
            }
            break;
        case 'position':
            if (!positionsList.includes(cleanValue)) {
                const { error: err } = await supabase.from('process_positions').insert({ name: cleanValue });
                error = err;
                if (!err) {
                    setPositionsList(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setCurrentProcess(prev => ({ ...prev, position: cleanValue }));
                }
            }
            break;
        case 'court':
             if (!courtOptions.includes(cleanValue.toUpperCase())) {
                const { error: err } = await supabase.from('courts').insert({ name: cleanValue.toUpperCase() });
                error = err;
                if (!err) {
                   setCourtOptions(prev => [...prev, cleanValue.toUpperCase()].sort((a,b)=>a.localeCompare(b)));
                   setCurrentProcess(prev => ({ ...prev, court: cleanValue.toUpperCase() }));
                }
             }
             break;
        case 'vara':
             if (!varaOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('process_varas').insert({ name: cleanValue });
                 if (err) console.warn("Aviso: Não foi possível salvar vara no banco, usando local.", err);
                 setVaraOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                 setCurrentProcess(prev => ({ ...prev, vara: cleanValue }));
             }
             break;
        case 'comarca':
             if (!currentProcess.uf) {
                 alert("Selecione um Estado (UF) antes de adicionar Comarca.");
                 return false;
             }
             if (!comarcaOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('comarcas').insert({ name: cleanValue, uf: currentProcess.uf });
                 error = err;
                 if (!err) {
                    setComarcaOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setCurrentProcess(prev => ({ ...prev, comarca: cleanValue }));
                 }
             }
             break;
        case 'class':
             if (!classOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('process_classes').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                    setClassOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    setCurrentProcess(prev => ({ ...prev, process_class: cleanValue }));
                 }
             }
             break;
        case 'subject':
             if (!subjectOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('process_subjects').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                    setSubjectOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                    if(extraData?.setNewSubject) extraData.setNewSubject(cleanValue);
                 }
             }
             break;
        case 'justice':
             if (!justiceOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('process_justice_types').insert({ name: cleanValue });
                 if (err) console.warn("Aviso: Não foi possível salvar justiça no banco, usando local.", err);
                 setJusticeOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                 setCurrentProcess(prev => ({ ...prev, justice_type: cleanValue }));
             }
             break;
        case 'magistrate':
             if (!magistrateOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('magistrates').insert({ name: cleanValue, title: extraData?.title || '' });
                 error = err;
                 if (!err) {
                     setMagistrateOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     if(extraData?.setNewMagistrateName) extraData.setNewMagistrateName(cleanValue);
                 }
             }
             break;
        case 'opponent':
             if (!opponentOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('opponents').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                     setOpponentOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setCurrentProcess(prev => ({ ...prev, opponent: cleanValue }));
                 }
             }
             break;
        case 'author':
             if (!authorOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('authors').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                     setAuthorOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setCurrentProcess(prev => ({ ...prev, author: cleanValue } as any));
                 }
             }
             break;
        case 'location':
             if (!billingLocations.includes(cleanValue)) {
                 setBillingLocations(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                 setFormData(prev => ({ ...prev, billing_location: cleanValue }));
             }
             break;
        case 'client':
             if (!clientOptions.includes(cleanValue)) {
                 const { error: err } = await supabase.from('clients').insert({ name: cleanValue });
                 error = err;
                 if (!err) {
                     setClientOptions(prev => [...prev, cleanValue].sort((a,b)=>a.localeCompare(b)));
                     setFormData(prev => ({ ...prev, client_name: cleanValue }));
                 }
             }
             break;
      }

      if (error) {
          alert("Erro ao salvar: " + error.message);
          return false;
      }
      return true;
  };

  // Lógica de Editar
  const handleGenericEdit = async (oldValue: string, newValue: string) => {
        const cleanOld = oldValue;
        const cleanNew = toTitleCase(newValue.trim());
        if (!cleanNew || cleanNew === cleanOld) return false;

        let error = null;

        switch(activeManager) {
            case 'area':
                setLegalAreas(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(formData.area === cleanOld) setFormData(prev => ({...prev, area: cleanNew}));
                break;
            case 'position':
                const { error: errPos } = await supabase.from('process_positions').update({ name: cleanNew }).eq('name', cleanOld);
                error = errPos;
                if (!errPos) {
                    setPositionsList(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.position === cleanOld) setCurrentProcess(prev => ({...prev, position: cleanNew}));
                }
                break;
            case 'court':
                const { error: errCrt } = await supabase.from('courts').update({ name: cleanNew.toUpperCase() }).eq('name', cleanOld);
                error = errCrt;
                if (!errCrt) {
                    setCourtOptions(prev => prev.map(i => i === cleanOld ? cleanNew.toUpperCase() : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.court === cleanOld) setCurrentProcess(prev => ({...prev, court: cleanNew.toUpperCase()}));
                }
                break;
            case 'vara':
                const { error: errVar } = await supabase.from('process_varas').update({ name: cleanNew }).eq('name', cleanOld);
                if (errVar) console.warn("Erro ao atualizar vara (banco):", errVar);
                setVaraOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(currentProcess.vara === cleanOld) setCurrentProcess(prev => ({...prev, vara: cleanNew}));
                break;
            case 'comarca':
                const { error: errCom } = await supabase.from('comarcas').update({ name: cleanNew }).eq('name', cleanOld).eq('uf', currentProcess.uf);
                error = errCom;
                if (!errCom) {
                    setComarcaOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.comarca === cleanOld) setCurrentProcess(prev => ({...prev, comarca: cleanNew}));
                }
                break;
            case 'class':
                const { error: errCls } = await supabase.from('process_classes').update({ name: cleanNew }).eq('name', cleanOld);
                error = errCls;
                if (!errCls) {
                    setClassOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.process_class === cleanOld) setCurrentProcess(prev => ({...prev, process_class: cleanNew}));
                }
                break;
            case 'subject':
                const { error: errSub } = await supabase.from('process_subjects').update({ name: cleanNew }).eq('name', cleanOld);
                error = errSub;
                if (!errSub) {
                    setSubjectOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                }
                break;
            case 'justice':
                const { error: errJus } = await supabase.from('process_justice_types').update({ name: cleanNew }).eq('name', cleanOld);
                if (errJus) console.warn("Erro ao atualizar justiça (banco):", errJus);
                setJusticeOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(currentProcess.justice_type === cleanOld) setCurrentProcess(prev => ({...prev, justice_type: cleanNew}));
                break;
            case 'magistrate':
                const { error: errMag } = await supabase.from('magistrates').update({ name: cleanNew }).eq('name', cleanOld);
                error = errMag;
                if (!errMag) {
                    setMagistrateOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                }
                break;
            case 'opponent':
                const { error: errOpp } = await supabase.from('opponents').update({ name: cleanNew }).eq('name', cleanOld);
                error = errOpp;
                if (!errOpp) {
                    setOpponentOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(currentProcess.opponent === cleanOld) setCurrentProcess(prev => ({...prev, opponent: cleanNew}));
                }
                break;
            case 'author':
                const { error: errAuth } = await supabase.from('authors').update({ name: cleanNew }).eq('name', cleanOld);
                error = errAuth;
                if (!errAuth) {
                    setAuthorOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if((currentProcess as any).author === cleanOld) setCurrentProcess(prev => ({...prev, author: cleanNew} as any));
                }
                break;
            case 'location':
                setBillingLocations(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                if(formData.billing_location === cleanOld) setFormData(prev => ({...prev, billing_location: cleanNew}));
                break;
            case 'client':
                const { error: errCli } = await supabase.from('clients').update({ name: cleanNew }).eq('name', cleanOld);
                error = errCli;
                if(!errCli) {
                    setClientOptions(prev => prev.map(i => i === cleanOld ? cleanNew : i).sort((a,b)=>a.localeCompare(b)));
                    if(formData.client_name === cleanOld) setFormData(prev => ({...prev, client_name: cleanNew}));
                }
                break;
        }

        if (error) {
            alert("Erro ao editar: " + error.message);
            return false;
        }
        return true;
  };

  // Lógica de Remover (Apenas visual para maioria)
  const handleGenericRemove = (value: string) => {
      switch(activeManager) {
          case 'area': setLegalAreas(prev => prev.filter(i => i !== value)); break;
          case 'location': setBillingLocations(prev => prev.filter(i => i !== value)); break;
          case 'position': setPositionsList(prev => prev.filter(i => i !== value)); break;
          case 'court': setCourtOptions(prev => prev.filter(i => i !== value)); break;
          case 'vara': setVaraOptions(prev => prev.filter(i => i !== value)); break;
          case 'comarca': setComarcaOptions(prev => prev.filter(i => i !== value)); break;
          case 'class': setClassOptions(prev => prev.filter(i => i !== value)); break;
          case 'subject': setSubjectOptions(prev => prev.filter(i => i !== value)); break;
          case 'justice': setJusticeOptions(prev => prev.filter(i => i !== value)); break;
          case 'magistrate': setMagistrateOptions(prev => prev.filter(i => i !== value)); break;
          case 'opponent': setOpponentOptions(prev => prev.filter(i => i !== value)); break;
          case 'author': setAuthorOptions(prev => prev.filter(i => i !== value)); break;
          case 'client': setClientOptions(prev => prev.filter(i => i !== value)); break;
      }
  };

  return {
    legalAreas, billingLocations, courtOptions, classOptions, subjectOptions, positionsList, varaOptions, justiceOptions, comarcaOptions, magistrateOptions, opponentOptions, authorOptions, clientOptions,
    setCourtOptions, setAuthorOptions, setOpponentOptions,
    fetchAuxiliaryTables, handleGenericAdd, handleGenericEdit, handleGenericRemove, fetchComarcas
  };
}
