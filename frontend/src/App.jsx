import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import MainLayout from './layouts/MainLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Companies from './pages/Companies';
import Tasks from './pages/Tasks';
import Banks from './pages/Banks';
import Expenses from './pages/Expenses';
import { useAppSelector, useAppDispatch } from './store/hooks';
import { useEffect } from 'react';
import { checkAuth } from './store/slices/authSlice';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  
  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading spinner
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Auth checker component
const AuthChecker = ({ children }) => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>; // You can replace this with a proper loading spinner
  }

  return children;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthChecker>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
              <Route path="expenses" element={<Expenses />} />
            </Route>
          </Routes>
        </AuthChecker>
      </Router>
    </Provider>
  );
}

export default App;
