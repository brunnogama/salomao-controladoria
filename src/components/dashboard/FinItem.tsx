import React from 'react';
import { formatMoney } from '../../utils/dashboardHelpers';

interface FinItemProps {
  label: string;
  value: number;
  colorClass?: string;
}

export const FinItem = ({ label, value, colorClass = 'text-gray-700' }: FinItemProps) => {
  if (!value || value === 0) return null;
  return (
    <div className='flex justify-between items-end text-sm mt-1 border-b border-gray-100 pb-1 last:border-0 last:pb-0'>
      <span className='text-gray-600 text-xs'>{label}</span>
      <span className={`font-bold ${colorClass}`}>{formatMoney(value)}</span>
    </div>
  );
};