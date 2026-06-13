import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { ServicesHub } from './pages/ServicesHub';
import { MarketingAutomation } from './pages/MarketingAutomation';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/app/services" 
            element={
              <ProtectedRoute>
                <ServicesHub />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/app/marketing" 
            element={
              <ProtectedRoute>
                <MarketingAutomation />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/app/upload" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
