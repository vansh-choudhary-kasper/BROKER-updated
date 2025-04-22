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
  const [brokers, setBrokers] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalBanks, setTotalBanks] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalBrokers, setTotalBrokers] = useState(0);
  const [loading, setLoading] = useState({
    companies: false,
    tasks: false,
    banks: false,
    expenses: false,
    brokers: false,
  });
  const [error, setError] = useState({
    companies: null,
    tasks: null,
    banks: null,
    expenses: null,
    brokers: null,
  });
  const [lastFetchTime, setLastFetchTime] = useState({
    companies: 0,
    tasks: 0,
    banks: 0,
    expenses: 0,
    brokers: 0,
  });

  // Debounce time in milliseconds (5 seconds)
  const DEBOUNCE_TIME = 1000;

  // Fetch companies with debounce
  const fetchCompanies = useCallback(async (filters = {}) => {
    if (!token) return;

    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.companies < DEBOUNCE_TIME) {
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
      // Clear lastFetchTime on error to allow manual retry
      setLastFetchTime(prev => ({ ...prev, companies: 0 }));
    } finally {
      setLoading(prev => ({ ...prev, companies: false }));
    }
  }, [token]);

  // Fetch tasks with debounce
  const fetchTasks = useCallback(async (filters = {}) => {
    if (!token) return;

    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.tasks < DEBOUNCE_TIME) {
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

      if (response?.data?.data) {
        const tasksData = response.data.data.tasks || [];
        const total = response.data.data.total || tasksData.length;
        
        setTasks(tasksData);
        setTotalTasks(total);
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
      // Clear lastFetchTime on error to allow manual retry
      setLastFetchTime(prev => ({ ...prev, tasks: 0 }));
    } finally {
      setLoading(prev => ({ ...prev, tasks: false }));
    }
  }, [token]);

  // Fetch banks with debounce
  const fetchBanks = useCallback(async (filters = {}) => {
    if (!token) return;

    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.banks < DEBOUNCE_TIME) {
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
      // Clear lastFetchTime on error to allow manual retry
      setLastFetchTime(prev => ({ ...prev, banks: 0 }));
    } finally {
      setLoading(prev => ({ ...prev, banks: false }));
    }
  }, [token]);

  // Fetch expenses with debounce
  const fetchExpenses = useCallback(async (filters = {}) => {
    if (!token) return;

    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.expenses < DEBOUNCE_TIME) {
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
      // Clear lastFetchTime on error to allow manual retry
      setLastFetchTime(prev => ({ ...prev, expenses: 0 }));
    } finally {
      setLoading(prev => ({ ...prev, expenses: false }));
    }
  }, [token]);

  // Fetch brokers with debounce
  const fetchBrokers = useCallback(async (filters = {}) => {
    if (!token) return;

    // Check if we've fetched recently
    const now = Date.now();
    if (now - lastFetchTime.brokers < DEBOUNCE_TIME) {
      return;
    }

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      // Convert filters object to query parameters
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      const response = await axios.get(`${backendUrl}/api/brokers?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setBrokers(response.data.data || []);
        setTotalBrokers(response.data.total || 0);
      } else {
        setBrokers([]);
        setTotalBrokers(0);
      }

      setLastFetchTime(prev => ({ ...prev, brokers: now }));
    } catch (err) {
      console.error('Error fetching brokers:', err);
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to fetch brokers'
      }));
      // Set empty array on error to prevent undefined errors
      setBrokers([]);
      setTotalBrokers(0);
      // Clear lastFetchTime on error to allow manual retry
      setLastFetchTime(prev => ({ ...prev, brokers: 0 }));
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  }, [token]);

  // Add company
  const addCompany = async (companyData) => {
    setLoading(prev => ({ ...prev, companies: true }));
    setError(prev => ({ ...prev, companies: null }));

    try {
      const formData = new FormData();

      // Add all non-file fields to FormData
      Object.keys(companyData).forEach(key => {
        if (key === 'documents') {
          Object.keys(companyData[key]).forEach(docKey => {
            if (docKey === 'otherDocuments' && Array.isArray(companyData[key][docKey])) {
              companyData[key][docKey].forEach((file) => {
                if (file instanceof File) {
                  formData.append('documents.otherDocuments', file);
                }
              });
            } else if (companyData[key][docKey] instanceof File) {
              formData.append(`documents.${docKey}`, companyData[key][docKey]);
            } else if (typeof companyData[key][docKey] === 'object' && companyData[key][docKey] !== null) {
              if (companyData[key][docKey].file instanceof File) {
                formData.append(`documents.${docKey}`, companyData[key][docKey].file);
              }
              Object.keys(companyData[key][docKey]).forEach(propKey => {
                if (propKey !== 'file') {
                  formData.append(`documents.${docKey}.${propKey}`, companyData[key][docKey][propKey]);
                }
              });
            }
          });
        } else if (key === 'bankDetails') {
          formData.append(key, JSON.stringify(companyData[key]));
        } else if (typeof companyData[key] === 'object' && companyData[key] !== null) {
          Object.keys(companyData[key]).forEach(subKey => {
            if (typeof companyData[key][subKey] === 'object' && companyData[key][subKey] !== null) {
              Object.keys(companyData[key][subKey]).forEach(deepKey => {
                if (companyData[key][subKey][deepKey] instanceof File) {
                  formData.append(`${key}.${subKey}.${deepKey}`, companyData[key][subKey][deepKey]);
                } else if (
                  typeof companyData[key][subKey][deepKey] === 'object' &&
                  companyData[key][subKey][deepKey] !== null
                ) {
                  if (companyData[key][subKey][deepKey].file instanceof File) {
                    formData.append(`${key}.${subKey}.${deepKey}`, companyData[key][subKey][deepKey].file);
                  }
                  Object.keys(companyData[key][subKey][deepKey]).forEach(propKey => {
                    if (propKey !== 'file') {
                      formData.append(`${key}.${subKey}.${deepKey}.${propKey}`, companyData[key][subKey][deepKey][propKey]);
                    }
                  });
                } else {
                  formData.append(`${key}.${subKey}.${deepKey}`, companyData[key][subKey][deepKey]);
                }
              });
            } else if (companyData[key][subKey] instanceof File) {
              formData.append(`${key}.${subKey}`, companyData[key][subKey]);
            } else {
              formData.append(`${key}.${subKey}`, companyData[key][subKey]);
            }
          });
        } else if (companyData[key] instanceof File) {
          formData.append(key, companyData[key]);
        } else {
          formData.append(key, companyData[key]);
        }
      });

      const response = await axios.post(`${backendUrl}/api/companies`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCompanies(prev => [...prev, response.data]);
      return response?.data;
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
      setTasks(prev => [...prev, response?.data?.data]);
      setError('');
      return response?.data;
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
      return response?.data;
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
      return response?.data;
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
      // Create FormData object
      const formData = new FormData();

      // Add all non-file fields to FormData
      Object.keys(companyData).forEach(key => {
        if (key === 'documents') {
          // Handle documents as nested objects
          Object.keys(companyData[key]).forEach(docKey => {
            if (docKey === 'otherDocuments' && Array.isArray(companyData[key][docKey])) {
              // Handle otherDocuments as an array of files
              companyData[key][docKey].forEach((file) => {
                if (file instanceof File) {
                  formData.append('documents.otherDocuments', file);
                }
              });
            } else if (companyData[key][docKey] instanceof File) {
              formData.append(`documents.${docKey}`, companyData[key][docKey]);
            } else if (typeof companyData[key][docKey] === 'object' && companyData[key][docKey] !== null) {
              // Handle document objects with file property
              if (companyData[key][docKey].file instanceof File) {
                formData.append(`documents.${docKey}`, companyData[key][docKey].file);
              }
              // Add other document properties
              Object.keys(companyData[key][docKey]).forEach(propKey => {
                if (propKey !== 'file') {
                  formData.append(`documents.${docKey}.${propKey}`, companyData[key][docKey][propKey]);
                }
              });
            }
          });
        } else if (key === 'bankDetails') {
          // Handle bank details as JSON
          formData.append(key, JSON.stringify(companyData[key]));
        } else if (typeof companyData[key] === 'object' && companyData[key] !== null) {
          // Handle nested objects like contactPerson, businessDetails, etc.
          Object.keys(companyData[key]).forEach(subKey => {
            if (typeof companyData[key][subKey] === 'object' && companyData[key][subKey] !== null) {
              // Handle deeply nested objects like idProof
              Object.keys(companyData[key][subKey]).forEach(deepKey => {
                if (companyData[key][subKey][deepKey] instanceof File) {
                  formData.append(`${key}.${subKey}.${deepKey}`, companyData[key][subKey][deepKey]);
                } else if (typeof companyData[key][subKey][deepKey] === 'object' && companyData[key][subKey][deepKey] !== null) {
                  // Handle nested file objects
                  if (companyData[key][subKey][deepKey].file instanceof File) {
                    formData.append(`${key}.${subKey}.${deepKey}`, companyData[key][subKey][deepKey].file);
                  }
                  // Add other properties
                  Object.keys(companyData[key][subKey][deepKey]).forEach(propKey => {
                    if (propKey !== 'file') {
                      formData.append(`${key}.${subKey}.${deepKey}.${propKey}`, companyData[key][subKey][deepKey][propKey]);
                    }
                  });
                } else {
                  formData.append(`${key}.${subKey}.${deepKey}`, companyData[key][subKey][deepKey]);
                }
              });
            } else if (companyData[key][subKey] instanceof File) {
              formData.append(`${key}.${subKey}`, companyData[key][subKey]);
            } else {
              formData.append(`${key}.${subKey}`, companyData[key][subKey]);
            }
          });
        } else if (companyData[key] instanceof File) {
          formData.append(key, companyData[key]);
        } else {
          formData.append(key, companyData[key]);
        }
      });

      const response = await axios.put(`${backendUrl}/api/companies/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCompanies(prev =>
        prev.map(company => company._id === id ? response.data : company)
      );
      return response?.data;
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
      return response?.data;
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
      return response?.data;
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
      return response?.data;
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
      const fetchAllData = async () => {
        try {
          await Promise.all([
            fetchCompanies(),
            fetchTasks(),
            fetchBanks(),
            fetchExpenses(),
            fetchBrokers()
          ]);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
      fetchAllData();
    }
  }, [token, fetchCompanies, fetchTasks, fetchBanks, fetchExpenses, fetchBrokers]);

  // Add broker
  const addBroker = async (brokerData) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.post(`${backendUrl}/api/brokers`, brokerData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Refresh brokers list
        fetchBrokers();
        return { success: true, data: response.data.data };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to add broker'
        }));
        return { success: false, message: response.data.message || 'Failed to add broker' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to add broker'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to add broker' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  // Update broker
  const updateBroker = async (id, brokerData) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.put(`${backendUrl}/api/brokers/${id}`, brokerData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Refresh brokers list
        fetchBrokers();
        return { success: true, data: response.data.data };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to update broker'
        }));
        return { success: false, message: response.data.message || 'Failed to update broker' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to update broker'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to update broker' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  // Delete broker
  const deleteBroker = async (id) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.delete(`${backendUrl}/api/brokers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Refresh brokers list
        fetchBrokers();
        return { success: true };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to delete broker'
        }));
        return { success: false, message: response.data.message || 'Failed to delete broker' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to delete broker'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to delete broker' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  // Get broker by ID
  const getBrokerById = async (id) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.get(`${backendUrl}/api/brokers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to get broker'
        }));
        return { success: false, message: response.data.message || 'Failed to get broker' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to get broker'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to get broker' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  // Add referral to broker
  const addReferral = async (brokerId, referralData) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.post(`${backendUrl}/api/brokers/${brokerId}/referrals`, referralData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Refresh brokers list
        fetchBrokers();
        return { success: true, data: response.data.data };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to add referral'
        }));
        return { success: false, message: response.data.message || 'Failed to add referral' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to add referral'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to add referral' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  // Update referral
  const updateReferral = async (brokerId, referralId, referralData) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.put(`${backendUrl}/api/brokers/${brokerId}/referrals/${referralId}`, referralData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Refresh brokers list
        fetchBrokers();
        return { success: true, data: response.data.data };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to update referral'
        }));
        return { success: false, message: response.data.message || 'Failed to update referral' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to update referral'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to update referral' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  // Delete referral
  const deleteReferral = async (brokerId, referralId) => {
    if (!token) return;

    setLoading(prev => ({ ...prev, brokers: true }));
    setError(prev => ({ ...prev, brokers: null }));

    try {
      const response = await axios.delete(`${backendUrl}/api/brokers/${brokerId}/referrals/${referralId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        // Refresh brokers list
        fetchBrokers();
        return { success: true };
      } else {
        setError(prev => ({
          ...prev,
          brokers: response.data.message || 'Failed to delete referral'
        }));
        return { success: false, message: response.data.message || 'Failed to delete referral' };
      }
    } catch (err) {
      setError(prev => ({
        ...prev,
        brokers: err.response?.data?.message || 'Failed to delete referral'
      }));
      return { success: false, message: err.response?.data?.message || 'Failed to delete referral' };
    } finally {
      setLoading(prev => ({ ...prev, brokers: false }));
    }
  };

  return (
    <DataContext.Provider
      value={{
        // State
        companies,
        tasks,
        banks,
        expenses,
        brokers,
        totalCompanies,
        totalTasks,
        totalBanks,
        totalExpenses,
        totalBrokers,
        loading,
        error,

        // Actions
        fetchCompanies,
        fetchTasks,
        fetchBanks,
        fetchExpenses,
        fetchBrokers,
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
        addBroker,
        updateBroker,
        deleteBroker,
        getBrokerById,
        addReferral,
        updateReferral,
        deleteReferral,
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