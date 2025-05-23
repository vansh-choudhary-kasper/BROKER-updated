import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgetPass from './pages/auth/ForgetPass';
import ResetPass from './pages/auth/ResetPass';
import VerifyOTP from './pages/auth/VerifyOTP';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Tasks from './pages/Tasks';
import Banks from './pages/Banks';
import Expenses from './pages/Expenses';
import Broker from './pages/Broker';
import Slabs from './pages/Slabs';
import Statements from './pages/Statements';
import Advances from './pages/Advances';
import { useAuth } from './context/AuthContext';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    console.error('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Auth checker component
const AuthChecker = ({ children }) => {
  const { loading, isAuthenticated } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
};

// Public route component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthChecker>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgetPass />
            </PublicRoute>
          } />
          <Route path="/reset-password/:token" element={
            <PublicRoute>
              <ResetPass />
            </PublicRoute>
          } />
          <Route path="/verify-otp" element={
            <PublicRoute>
              <VerifyOTP />
            </PublicRoute>
          } />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="companies" element={<Companies />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="banks" element={<Banks />} />
            <Route path="brokers" element={<Broker />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="advances" element={<Advances />} />
            <Route path="slabs" element={<Slabs />} />
            <Route path="statements" element={<Statements />} />
          </Route>
        </Routes>
      </AuthChecker>
    </Router>
  );
}

export default App;
