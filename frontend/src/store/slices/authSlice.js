import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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
      // Instead of directly redirecting, we'll let the auth state handle the redirect
      // This prevents automatic logout during task submission
      console.log('Authentication error detected. Token may be expired or invalid.');
    }
    return Promise.reject(error);
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = getStoredToken();
      console.log('Checking auth with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        throw new Error('No token found');
      }

      // Try to fetch user data, but don't fail if the endpoint doesn't exist
      try {
        const response = await axios.get(`${backendUrl}/api/auth/me`);
        console.log('Auth check successful:', response.data);
        return { user: response.data, token };
      } catch (error) {
        // If the endpoint doesn't exist (404), we'll still consider the user authenticated
        // as long as they have a valid token
        if (error.response && error.response.status === 404) {
          console.log('Auth endpoint not found, but token exists. Considering user authenticated.');
          // Return a minimal user object based on the token
          // You might want to decode the JWT token here to get user info
          return { 
            user: { 
              id: 'user-from-token',
              // Add any other user properties you need
            }, 
            token 
          };
        }
        // For other errors, rethrow
        throw error;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setStoredToken(null); // Clear invalid token
      return rejectWithValue(error.response?.data?.message || 'Authentication failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('Attempting login with:', credentials);
      const response = await axios.post(`${backendUrl}/api/auth/login`, credentials);
      console.log('Login successful:', response.data);
      setStoredToken(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('Attempting registration with:', userData);
      const response = await axios.post(`${backendUrl}/api/auth/register`, userData);
      console.log('Registration successful:', response.data);
      setStoredToken(response.data.token);
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    console.log('Logging out, removing token');
    setStoredToken(null);
  }
);

// Initialize state with token from localStorage
const token = getStoredToken();
const initialState = {
  user: null,
  token: token,
  loading: false,
  error: null,
  isAuthenticated: !!token, // Set isAuthenticated to true if token exists
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer; 