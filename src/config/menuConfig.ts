import { 
  LayoutDashboard, 
  FileSignature, 
  Users, 
  Wallet, 
  BarChart3, 
  Settings, 
  FileText,
  FolderOpen,
  Share2 // Importar ícone para Jurimetria
} from 'lucide-react';

export const menuItems = [
  {
    icon: LayoutDashboard,
    label: 'Dashboard',
    path: '/'
  },
  {
    icon: FileSignature,
    label: 'Casos',
    path: '/contracts'
  },
  {
    icon: FileText,
    label: 'Propostas',
    path: '/proposals'
  },
  {
    icon: Users,
    label: 'Clientes',
    path: '/clients'
  },
  {
    icon: Wallet,
    label: 'Financeiro',
    path: '/finance'
  },
  {
    icon: FolderOpen,
    label: 'GED',
    path: '/ged'
  },
  // --- NOVO ITEM ---
  {
    icon: Share2,
    label: 'Jurimetria',
    path: '/jurimetria'
  },
  // ----------------
  {
    icon: BarChart3,
    label: 'Volumetria',
    path: '/volumetry'
  },
  {
    icon: Settings,
    label: 'Configurações',
    path: '/settings'
  }
];