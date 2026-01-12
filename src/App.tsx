import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/LeadsPage';
import LeadDetailPage from './pages/LeadDetailPage';
import PipelinePage from './pages/PipelinePage';
import QuotesPage from './pages/QuotesPage';
import EmailPage from './pages/EmailPage';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';

function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/amarillo-security" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="quotes" element={<QuotesPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="projects" element={<ImportPage />} /> {/* Using Import as Projects placeholder for now per sidebar */}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="import" element={<ImportPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
