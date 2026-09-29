import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RepoProvider } from './context/RepoContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { ChatPage } from './pages/ChatPage';
import { SystemStatus } from './pages/SystemStatus';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400 font-mono text-sm">
        Authenticating session...
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export function App() {
  return (
    <AuthProvider>
      <RepoProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <ChatPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/status" element={<SystemStatus />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <footer className="bg-slate-950 border-t border-slate-800 py-4 text-center text-xs text-slate-500">
              AI Developer Assistant for Code Repositories — CSE Final Year Major Project (2026)
            </footer>
          </div>
        </Router>
      </RepoProvider>
    </AuthProvider>
  );
}

export default App;
