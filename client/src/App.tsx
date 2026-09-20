import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { DashboardShell } from './components/layout/DashboardShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';

function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-display-lg text-fg-primary">404</p>
      <p className="text-body-md text-fg-secondary">That page doesn't exist.</p>
      <Link to="/" className="text-body-sm font-medium text-brand-text hover:underline">
        Back to FlowBoard
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardShell>
                <Dashboard />
              </DashboardShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/projects"
          element={
            <ProtectedRoute>
              <DashboardShell>
                <Projects />
              </DashboardShell>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
