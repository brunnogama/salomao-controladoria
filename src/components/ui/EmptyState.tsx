import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center h-full min-h-[400px] animate-in fade-in zoom-in-95 duration-300 ${className}`}>
      <div className="bg-gray-50 p-6 rounded-full mb-4 border border-gray-100 shadow-sm">
        <Icon className="w-10 h-10 text-gray-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-salomao-blue hover:border-blue-200 font-medium py-2 px-6 rounded-lg transition-all text-sm shadow-sm flex items-center gap-2 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}