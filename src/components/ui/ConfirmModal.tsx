import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info'; // Para mudar a cor do botão
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = 'danger'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-0 flex gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 flex justify-end gap-3 mt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-gray-700 font-medium bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center ${
              variant === 'danger' 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                : 'bg-salomao-blue hover:bg-blue-900 shadow-blue-500/20'
            }`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}