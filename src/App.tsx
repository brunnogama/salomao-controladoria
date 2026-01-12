import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Contracts } from './pages/Contracts';
import { GED } from './pages/GED';
import { Dashboard } from './pages/Dashboard';
import { Kanban } from './pages/Kanban';
import { Clients } from './pages/Clients';
import { Finance } from './pages/Finance';
import { Settings } from './pages/Settings';
import { History } from './pages/History';
import { Volumetry } from './pages/Volumetry'; // Nova Importação

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
          <Route path="/clientes" element={<Clients />} />
          <Route path="/kanban" element={<Kanban />} />
          <Route path="/financeiro" element={<Finance />} />
          <Route path="/ged" element={<GED />} />
          
          <Route path="/propostas" element={<PagePlaceholder title="Propostas Comerciais" />} />
          
          {/* Rota Atualizada para Volumetria Real */}
          <Route path="/volumetria" element={<Volumetry />} />
          
          <Route path="/compliance" element={<PagePlaceholder title="Compliance & Riscos" />} />
          <Route path="/historico" element={<History />} />
          <Route path="/configuracoes" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
