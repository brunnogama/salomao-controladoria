import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Plus, Settings } from 'lucide-react';

interface CustomSelectProps {
  label?: string;
  value: string | number | undefined;
  onChange: (value: string) => void;
  options: { label: string; value: string }[] | string[];
  placeholder?: string;
  disabled?: boolean;
  onAction?: () => void;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  className?: string;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Selecione...',
  disabled = false,
  onAction,
  actionLabel,
  actionIcon: ActionIcon = Plus,
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Normaliza as opções para o formato { label, value }
  const normalizedOptions = options.map(opt => 
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  // Filtra opções pela busca
  const filteredOptions = normalizedOptions.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(''); // Limpa busca ao fechar
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Encontra o label do valor atual
  const selectedOption = normalizedOptions.find(opt => opt.value === value);
  const displayValue = selectedOption ? selectedOption.label : value;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-xs font-medium block mb-1 text-gray-600">{label}</label>}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:border-salomao-blue focus:ring-1 focus:ring-salomao-blue outline-none flex justify-between items-center transition-all ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-gray-400'
        } ${isOpen ? 'border-salomao-blue ring-1 ring-salomao-blue' : ''}`}
      >
        <span className={`truncate ${!displayValue ? 'text-gray-400' : 'text-gray-700'}`}>
          {displayValue || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl animate-in fade-in zoom-in-95 origin-top">
          {/* Campo de Busca */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/50 rounded-t-lg sticky top-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:border-salomao-blue focus:ring-1 focus:ring-salomao-blue outline-none bg-white"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Lista de Opções */}
          <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${
                    value === opt.value ? 'bg-blue-50 text-salomao-blue font-medium' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                  {value === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-salomao-blue" />}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-xs text-center text-gray-400">
                Nenhuma opção encontrada
              </div>
            )}
          </div>

          {/* Botão de Ação / Gerenciar */}
          {onAction && (
            <div 
              onClick={() => {
                onAction();
                // Não fechamos o menu aqui automaticamente para permitir interações como Prompts, 
                // mas se for um modal, o modal se sobrepõe.
                setIsOpen(false); 
              }}
              className="border-t border-gray-100 p-2 bg-gray-50 rounded-b-lg cursor-pointer hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center justify-center text-xs font-medium text-salomao-blue group-hover:text-blue-700">
                <ActionIcon className="w-3.5 h-3.5 mr-1.5" />
                {actionLabel || 'Gerenciar'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}