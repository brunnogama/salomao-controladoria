import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface Option {
  label: string;
  value: string | number | boolean;
}

interface CustomSelectProps {
  label?: string;
  value: string | number | boolean | null | undefined;
  onChange: (value: any) => void;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  onAction?: () => void;
  actionIcon?: React.ElementType;
  actionLabel?: string;
  className?: string;
}

export function CustomSelect({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Selecione...", 
  disabled = false,
  onAction,
  actionIcon: ActionIcon,
  actionLabel,
  className = ""
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Normaliza o valor para string para comparação, mas mantém tipo original no onChange
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-full border ${isOpen ? 'border-salomao-blue ring-1 ring-salomao-blue' : 'border-gray-300'} rounded-lg p-2.5 text-sm bg-white flex justify-between items-center transition-all disabled:bg-gray-100 text-left`}
        >
          <span className={`truncate block ${!selectedOption ? 'text-gray-400' : 'text-gray-700'}`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {onAction && (
          <button 
            onClick={onAction} 
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 rounded-lg px-3 transition-colors flex-shrink-0"
            title={actionLabel}
          >
            {ActionIcon ? <ActionIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[60] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 left-0 custom-scrollbar">
          <div className="py-1">
            {options.map((opt) => (
              <div
                key={String(opt.value)}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors flex items-center justify-between ${String(value) === String(opt.value) ? 'bg-blue-50 text-salomao-blue font-medium' : 'text-gray-700'}`}
              >
                <span className="truncate">{opt.label}</span>
                {String(value) === String(opt.value) && <Check className="w-3 h-3 flex-shrink-0 ml-2" />}
              </div>
            ))}
            {options.length === 0 && <div className="p-3 text-xs text-gray-400 text-center">Sem opções</div>}
          </div>
        </div>
      )}
    </div>
  );
}