import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Contracts } from './pages/Contracts';
import { GED } from './pages/GED';
import { Dashboard } from './pages/Dashboard';
import { Kanban } from './pages/Kanban'; // IMPORT NOVO

const PagePlaceholder = ({ title }: { title: string }) => (
  <div className="p-4">
    <h1 className="text-2xl font-bold text-gray-800 mb-4">{title}</h1>
    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg h-96 flex items-center justify-center text-gray-400">
      Módulo em desenvolvimento
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/contratos" element={<Contracts />} />
          <Route path="/ged" element={<GED />} />
          {/* Rota Kanban Ativada */}
          <Route path="/kanban" element={<Kanban />} />
          
          <Route path="/propostas" element={<PagePlaceholder title="Propostas Comerciais" />} />
          <Route path="/financeiro" element={<PagePlaceholder title="Controle Financeiro" />} />
          <Route path="/volumetria" element={<PagePlaceholder title="Análise de Volumetria" />} />
          <Route path="/compliance" element={<PagePlaceholder title="Compliance & Riscos" />} />
          <Route path="/clientes" element={<PagePlaceholder title="Carteira de Clientes" />} />
          <Route path="/historico" element={<PagePlaceholder title="Histórico de Atividades" />} />
          <Route path="/configuracoes" element={<PagePlaceholder title="Configurações do Sistema" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;