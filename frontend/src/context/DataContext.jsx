import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { token } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [banks, setBanks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalBanks, setTotalBanks] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [loading, setLoading] = useState({
    companies: false,
    tasks: false,
    banks: false,
    expenses: false,
  });
  const [error, setError] = useState({
    companies: null,
    tasks: null,
    banks: null,
    expenses: null,
  });
  const [lastFetchTime, setLastFetchTime] = useState({
    companies: 0,
    tasks: 0,
    banks: 0,
    expenses: 0,
  });

  // Debounce time in milliseconds (5 seconds)
  const DEBOUNCE_TIME = 5000;

  // Fetch companies with debounce
  const fetchCompanies = useCallback(async (filters = {}) => {
    if (!token) return;
    
    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.companies < DEBOUNCE_TIME) {
      console.log('Skipping companies fetch - too soon since last fetch');
      return;
    }
    
    setLoading(prev => ({ ...prev, companies: true }));
    setError(prev => ({ ...prev, companies: null }));
    
    try {
      // Convert filters object to query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${backendUrl}/api/companies?${queryParams.toString()}`);
      console.log("response", response);
      // Handle both array response and paginated response
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data?.data)) {
          setCompanies(response.data?.data);
          setTotalCompanies(response.data?.data?.length);
        } else if (response.data?.data?.companies && Array.isArray(response.data?.data?.companies)) {
          setCompanies(response.data?.data?.companies);
          setTotalCompanies(response.data?.data?.total || response.data?.data?.companies?.length);
        }
      } else {
        setCompanies([]);
        setTotalCompanies(0);
      }
      setLastFetchTime(prev => ({ ...prev, companies: now }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        companies: err.response?.data?.message || 'Failed to fetch companies' 
      }));
      // Set empty array on error to prevent undefined errors
      setCompanies([]);
      setTotalCompanies(0);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, [token, lastFetchTime.companies]);

  // Fetch tasks with debounce
  const fetchTasks = useCallback(async (filters = {}) => {
    if (!token) return;
    
    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.tasks < DEBOUNCE_TIME) {
      console.log('Skipping tasks fetch - too soon since last fetch');
      return;
    }
    
    setLoading(prev => ({ ...prev, tasks: true }));
    setError(prev => ({ ...prev, tasks: null }));
    
    try {
      // Convert filters object to query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${backendUrl}/api/tasks?${queryParams.toString()}`);
      console.log("tasks get successfully", response);
      
      if (response.data && response.data.data) {
        setTasks(response.data.data.tasks || []);
        setTotalTasks(response.data.data.total || 0);
      } else {
        setTasks([]);
        setTotalTasks(0);
      }
      
      setLastFetchTime(prev => ({ ...prev, tasks: now }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        tasks: err.response?.data?.message || 'Failed to fetch tasks' 
      }));
      // Set empty array on error to prevent undefined errors
      setTasks([]);
      setTotalTasks(0);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [token, lastFetchTime.tasks]);

  // Fetch banks with debounce
  const fetchBanks = useCallback(async (filters = {}) => {
    if (!token) return;
    
    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.banks < DEBOUNCE_TIME) {
      console.log('Skipping banks fetch - too soon since last fetch');
      return;
    }
    
    setLoading(prev => ({ ...prev, banks: true }));
    setError(prev => ({ ...prev, banks: null }));
    
    try {
      // Convert filters object to query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${backendUrl}/api/banks?${queryParams.toString()}`);
      console.log("banks fetched successfully", response);
      
      if (response.data && response.data.data) {
        setBanks(response.data.data.banks || []);
        setTotalBanks(response.data.data.total || response.data.data.banks?.length || 0);
      } else {
        setBanks([]);
        setTotalBanks(0);
      }
      
      setLastFetchTime(prev => ({ ...prev, banks: now }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        banks: err.response?.data?.message || 'Failed to fetch banks' 
      }));
      // Set empty array on error to prevent undefined errors
      setBanks([]);
      setTotalBanks(0);
    } finally {
      setLoading(prev => ({ ...prev, banks: false }));
    }
  }, [token, lastFetchTime.banks]);

  // Fetch expenses with debounce
  const fetchExpenses = useCallback(async (filters = {}) => {
    if (!token) return;
    
    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.expenses < DEBOUNCE_TIME) {
      console.log('Skipping expenses fetch - too soon since last fetch');
      return;
    }
    
    setLoading(prev => ({ ...prev, expenses: true }));
    setError(prev => ({ ...prev, expenses: null }));
    
    try {
      // Convert filters object to query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${backendUrl}/api/expenses?${queryParams.toString()}`);
      console.log("expenses fetched successfully", response);
      
      if (response.data && response.data.data) {
        setExpenses(response.data.data.expenses || []);
        setTotalExpenses(response.data.data.total || response.data.data.expenses?.length || 0);
      } else {
        setExpenses([]);
        setTotalExpenses(0);
      }
      
      setLastFetchTime(prev => ({ ...prev, expenses: now }));
    } catch (err) {
      setError(prev => ({ 
        ...prev, 
        expenses: err.response?.data?.message || 'Failed to fetch expenses' 
      }));
      // Set empty array on error to prevent undefined errors
      setExpenses([]);
      setTotalExpenses(0);
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  }, [token, lastFetchTime.expenses]);

  // Add company
  const addCompany = async (companyData) => {
    setLoading(prev => ({ ...prev, companies: true }));
    setError(prev => ({ ...prev, companies: null }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/companies`, companyData);
      setCompanies(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add company';
      setError(prev => ({ ...prev, companies: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  };

  // Add task
  const addTask = async (taskData) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    setError(prev => ({ ...prev, tasks: null }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/tasks`, taskData);
      console.log("task posted successfully", response);
      setTasks(prev => [...prev, response?.data?.data]);
      setError('');
      return response?.data?.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add task';
      setError(prev => ({ ...prev, tasks: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // Add bank
  const addBank = async (bankData) => {
    setLoading(prev => ({ ...prev, banks: true }));
    setError(prev => ({ ...prev, banks: null }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/banks`, bankData);
      setBanks(prev => [...prev, response?.data?.data]);
      return response?.data?.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add bank';
      setError(prev => ({ ...prev, banks: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, banks: false }));
    }
  };

  // Add expense
  const addExpense = async (expenseData) => {
    setLoading(prev => ({ ...prev, expenses: true }));
    setError(prev => ({ ...prev, expenses: null }));
    
    try {
      const response = await axios.post(`${backendUrl}/api/expenses`, expenseData);
      setExpenses(prev => [...prev, response?.data?.data]);
      return response?.data?.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add expense';
      setError(prev => ({ ...prev, expenses: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  // Update company
  const updateCompany = async (id, companyData) => {
    setLoading(prev => ({ ...prev, companies: true }));
    setError(prev => ({ ...prev, companies: null }));
    
    try {
      const response = await axios.put(`${backendUrl}/api/companies/${id}`, companyData);
      setCompanies(prev => 
        prev.map(company => company._id === id ? response.data : company)
      );
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update company';
      setError(prev => ({ ...prev, companies: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  };

  // Update task
  const updateTask = async (id, taskData) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    setError(prev => ({ ...prev, tasks: null }));
    
    try {
      const response = await axios.put(`${backendUrl}/api/tasks/${id}`, taskData);
      setTasks(prev => 
        prev.map(task => task._id === id ? response?.data?.data : task)
      );
      return response?.data?.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update task';
      setError(prev => ({ ...prev, tasks: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // Update bank
  const updateBank = async (id, bankData) => {
    setLoading(prev => ({ ...prev, banks: true }));
    setError(prev => ({ ...prev, banks: null }));
    
    try {
      const response = await axios.put(`${backendUrl}/api/banks/${id}`, bankData);
      setBanks(prev => 
        prev.map(bank => bank._id === id ? response?.data?.data : bank)
      );
      return response?.data?.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update bank';
      setError(prev => ({ ...prev, banks: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, banks: false }));
    }
  };

  // Update expense
  const updateExpense = async (id, expenseData) => {
    setLoading(prev => ({ ...prev, expenses: true }));
    setError(prev => ({ ...prev, expenses: null }));
    
    try {
      const response = await axios.put(`${backendUrl}/api/expenses/${id}`, expenseData);
      setExpenses(prev => 
        prev.map(expense => expense._id === id ? response?.data?.data : expense)
      );
      return response?.data?.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update expense';
      setError(prev => ({ ...prev, expenses: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  // Delete company
  const deleteCompany = async (id) => {
    setLoading(prev => ({ ...prev, companies: true }));
    setError(prev => ({ ...prev, companies: null }));
    
    try {
      await axios.delete(`${backendUrl}/api/companies/${id}`);
      setCompanies(prev => prev.filter(company => company._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete company';
      setError(prev => ({ ...prev, companies: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  };

  // Delete task
  const deleteTask = async (id) => {
    setLoading(prev => ({ ...prev, tasks: true }));
    setError(prev => ({ ...prev, tasks: null }));
    
    try {
      await axios.delete(`${backendUrl}/api/tasks/${id}`);
      setTasks(prev => prev.filter(task => task._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete task';
      setError(prev => ({ ...prev, tasks: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  };

  // Delete bank
  const deleteBank = async (id) => {
    setLoading(prev => ({ ...prev, banks: true }));
    setError(prev => ({ ...prev, banks: null }));
    
    try {
      await axios.delete(`${backendUrl}/api/banks/${id}`);
      setBanks(prev => prev.filter(bank => bank._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete bank';
      setError(prev => ({ ...prev, banks: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, banks: false }));
    }
  };

  // Delete expense
  const deleteExpense = async (id) => {
    setLoading(prev => ({ ...prev, expenses: true }));
    setError(prev => ({ ...prev, expenses: null }));
    
    try {
      await axios.delete(`${backendUrl}/api/expenses/${id}`);
      setExpenses(prev => prev.filter(expense => expense._id !== id));
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete expense';
      setError(prev => ({ ...prev, expenses: errorMessage }));
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  };

  // Clear errors
  const clearError = (type) => {
    setError(prev => ({ ...prev, [type]: null }));
  };

  // Fetch all data when token changes
  useEffect(() => {
    if (token) {
      console.log('Token changed, fetching all data');
      fetchCompanies();
      fetchTasks();
      fetchBanks();
      fetchExpenses();
    }
  }, [token, fetchCompanies, fetchTasks, fetchBanks, fetchExpenses]);

  return (
    <DataContext.Provider
      value={{
        // State
        companies,
        tasks,
        banks,
        expenses,
        totalCompanies,
        totalTasks,
        totalBanks,
        totalExpenses,
        loading,
        error,
        
        // Actions
        fetchCompanies,
        fetchTasks,
        fetchBanks,
        fetchExpenses,
        addCompany,
        addTask,
        addBank,
        addExpense,
        updateCompany,
        updateTask,
        updateBank,
        updateExpense,
        deleteCompany,
        deleteTask,
        deleteBank,
        deleteExpense,
        clearError,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 