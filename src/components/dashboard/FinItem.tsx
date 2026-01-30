import React from 'react';
import { formatMoney } from './dashboardHelpers';

interface FinItemProps {
  label: string;
  value: number;
  colorClass?: string;
}

export const FinItem = ({ label, value, colorClass = 'text-gray-700' }: FinItemProps) => {
  if (!value || value === 0) return null;
  
  return (
    <div className='flex justify-between items-baseline gap-2 border-b border-gray-100/50 pb-1.5 last:border-0 last:pb-0'>
      <span className='text-[9px] font-black text-gray-500 uppercase tracking-wider'>
        {label}
      </span>
      <span className={`text-xs font-bold ${colorClass} tracking-tight`}>
        {formatMoney(value)}
      </span>
    </div>
  );
};