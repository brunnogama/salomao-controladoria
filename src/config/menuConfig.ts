import { 
  LayoutDashboard, 
  FileText, 
  FileSignature, 
  DollarSign, 
  BarChart3, 
  ShieldCheck, 
  Users, 
  KanbanSquare, 
  FolderOpen 
} from 'lucide-react';

export const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Contratos', path: '/contratos', icon: FileSignature },
  { label: 'Propostas', path: '/propostas', icon: FileText },
  { label: 'Financeiro', path: '/financeiro', icon: DollarSign },
  { label: 'Volumetria', path: '/volumetria', icon: BarChart3 },
  { label: 'Compliance', path: '/compliance', icon: ShieldCheck },
  { label: 'Clientes', path: '/clientes', icon: Users },
  { label: 'Kanban', path: '/kanban', icon: KanbanSquare },
  { label: 'GED', path: '/ged', icon: FolderOpen },
];
