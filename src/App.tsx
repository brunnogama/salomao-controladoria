import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { Contracts } from './pages/Contracts';
import { Proposals } from './pages/Proposals';
import { Clients } from './pages/Clients';
import { Finance } from './pages/Finance';
import { Volumetry } from './pages/Volumetry';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { GED } from './pages/GED';
import { Kanban } from './pages/Kanban';
import { History } from './pages/History';
import { Jurimetria } from './pages/Jurimetria'; // Importar nova página

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('salomao_auth') === 'true';
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="clients" element={<Clients />} />
          <Route path="finance" element={<Finance />} />
          <Route path="ged" element={<GED />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="history" element={<History />} />
          <Route path="jurimetria" element={<Jurimetria />} /> {/* Nova Rota */}
          <Route path="volumetry" element={<Volumetry />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;