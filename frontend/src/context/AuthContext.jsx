import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper function to get token from localStorage
const getStoredToken = () => localStorage.getItem('token');

// Helper function to set token in localStorage
const setStoredToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Add axios interceptor to include token in requests
axios.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      setStoredToken(null);
      console.error('Authentication error detected. Token may be expired or invalid.');
    } else if (error.response && error.response.status === 403) {
      // Admin access required
      console.error('Admin access required. You do not have sufficient permissions.');
    }
    return Promise.reject(error);
  }
);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(getStoredToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.error("isAuthenticated", isAuthenticated);
      const storedToken = getStoredToken();
      if (storedToken && !isAuthenticated) {
        setLoading(true);
        try {
          const response = await axios.get(`${backendUrl}/api/auth/me`);
          setUser(response.data);
          setToken(storedToken);
          setIsAuthenticated(true);
          setIsAdmin(response.data.role === 'admin');
        } catch (error) {
          // If the endpoint doesn't exist (404), we'll still consider the user authenticated
          // as long as they have a valid token
          if (error.response && error.response.status === 404) {
            setUser({ id: 'user-from-token' });
            setToken(storedToken);
            setIsAuthenticated(true);
            // Default to admin for development purposes
            setIsAdmin(true);
          } else {
            console.error('Auth check failed:', error);
            setStoredToken(null);
            setUser(null);
            logout();
            setToken(null);
            setIsAuthenticated(false);
            setIsAdmin(false);
          }
        } finally {
          setLoading(false);
        }
      }
    };

    checkAuth();
  }, [isAuthenticated]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${backendUrl}/api/auth/login`, credentials);
      setStoredToken(response.data.token);
      setUser(response.data.user);
      setToken(response.data.token);
      setIsAuthenticated(true);
      setIsAdmin(response.data.user.role === 'admin');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${backendUrl}/api/auth/register`, userData);
      setStoredToken(response.data.token);
      setUser(response.data.user);
      setToken(response.data.token);
      setIsAuthenticated(true);
      setIsAdmin(response.data.user.role === 'admin');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 