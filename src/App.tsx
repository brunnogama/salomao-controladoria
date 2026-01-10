import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';

// Componentes Placeholder para as rotas (serão criados depois)
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
        {/* Rota Pública */}
        <Route path="/" element={<Login />} />

        {/* Rotas Protegidas (Layout com Sidebar) */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<PagePlaceholder title="Dashboard Gerencial" />} />
          <Route path="/contratos" element={<PagePlaceholder title="Gestão de Contratos" />} />
          <Route path="/propostas" element={<PagePlaceholder title="Propostas Comerciais" />} />
          <Route path="/financeiro" element={<PagePlaceholder title="Controle Financeiro" />} />
          <Route path="/volumetria" element={<PagePlaceholder title="Análise de Volumetria" />} />
          <Route path="/compliance" element={<PagePlaceholder title="Compliance & Riscos" />} />
          <Route path="/clientes" element={<PagePlaceholder title="Carteira de Clientes" />} />
          <Route path="/kanban" element={<PagePlaceholder title="Fluxo de Trabalho (Kanban)" />} />
          <Route path="/ged" element={<PagePlaceholder title="Gestão Eletrônica de Documentos" />} />
          <Route path="/historico" element={<PagePlaceholder title="Histórico de Atividades" />} />
          <Route path="/configuracoes" element={<PagePlaceholder title="Configurações do Sistema" />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
