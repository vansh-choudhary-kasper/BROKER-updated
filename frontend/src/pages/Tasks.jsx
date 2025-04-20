import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { debounce } from 'lodash';

const Tasks = () => {
  const {
    tasks,
    companies,
    brokers,
    loading,
    error,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    fetchCompanies,
    fetchBrokers,
    totalTasks
  } = useData();
  
  const { user } = useAuth();

  const initialFormState = {
    title: '',
    description: '',
    clientCompany: '',
    providerCompany: '',
    helperBroker: {
      broker: '',
      commission: 0,
      status: 'pending',
      paymentDate: ''
    },
    payment: {
      amount: 0,
      currency: 'USD'
    }
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    page: 1,
    limit: 10
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((value) => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    fetchTasks({
      search: filters.search,
      page: filters.page,
      limit: filters.limit
    });
    fetchCompanies();
    fetchBrokers();
  }, [fetchTasks, fetchCompanies, fetchBrokers, filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Prevent changing payment status from paid to pending
    if (name === 'helperBroker.status' && formData.helperBroker.status === 'paid' && value === 'pending') {
      return; // Don't allow the change
    }
    
    // Handle nested objects
    if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      
      if (grandChild) {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandChild]: value,
            },
          },
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value,
          },
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Calculate total amounts when base amount changes
  const calculateTotals = () => {
    // No need to calculate totals anymore as we've simplified the payment structure
    // This function is kept for backward compatibility but doesn't need to do anything
  };

  // Call calculateTotals when relevant fields change
  useEffect(() => {
    calculateTotals();
  }, [
    formData.payment.amount
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        payment: {
          ...formData.payment,
          amount: parseFloat(formData.payment.amount) || 0
        }
      };
      
      if (editingTask) {
        await updateTask(editingTask._id, taskData);
      } else {
        await addTask(taskData);
      }
      setFormData(initialFormState);
      setEditingTask(null);
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save task:', err);
      const errorMessage = err.message || 'Failed to save task';
      if (typeof errorMessage === 'string' && errorMessage.includes('Authentication error')) {
        alert('Your session may have expired. Please try logging in again.');
      } else {
        alert(`Failed to save task: ${errorMessage}`);
      }
    }
  };

  const handleEdit = (task) => {
    // Format the payment date to YYYY-MM-DD if it exists
    const formattedPaymentDate = task.helperBroker?.paymentDate 
      ? new Date(task.helperBroker.paymentDate).toISOString().split('T')[0]
      : '';

    setFormData({
      title: task.title || '',
      description: task.description || '',
      clientCompany: task.clientCompany || '',
      providerCompany: task.providerCompany || '',
      helperBroker: {
        broker: task.helperBroker?.broker || '',
        commission: task.helperBroker?.commission || 0,
        status: task.helperBroker?.status || 'pending',
        paymentDate: formattedPaymentDate
      },
      payment: {
        amount: task.payment?.amount || 0,
        currency: task.payment?.currency || 'USD'
      }
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert(`Failed to delete task: ${err}`);
      }
    }
  };

  const tasksList = Array.isArray(tasks) ? tasks : [];
  const companiesList = Array.isArray(companies) ? companies : [];
  const brokersList = Array.isArray(brokers) ? brokers : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Deals</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Deal
        </button>
      </div>

      {error && error.message && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4" role="alert">
          <p className="text-red-700">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by title, deal number, or helper broker..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Search by deal title, deal number, or helper broker name
            </p>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Edit Deal' : 'Add New Deal'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormState);
                  setEditingTask(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Deal Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Company Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="clientCompany" className="block text-sm font-medium text-gray-700">
                      Client Company *
                    </label>
                    <select
                      id="clientCompany"
                      name="clientCompany"
                      value={formData.clientCompany}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a client company</option>
                      {companiesList.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="providerCompany" className="block text-sm font-medium text-gray-700">
                      Provider Company *
                    </label>
                    <select
                      id="providerCompany"
                      name="providerCompany"
                      value={formData.providerCompany}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a provider company</option>
                      {companiesList.map((company) => (
                        <option key={company._id} value={company._id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Helper Broker Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Helper Broker Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="helperBroker.broker" className="block text-sm font-medium text-gray-700">
                      Helper Broker
                    </label>
                    <select
                      id="helperBroker.broker"
                      name="helperBroker.broker"
                      value={formData.helperBroker.broker}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select a helper broker</option>
                      {brokersList.map((broker) => (
                        <option key={broker._id} value={broker._id}>
                          {broker.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="helperBroker.commission" className="block text-sm font-medium text-gray-700">
                      Helper Broker Commission (%)
                    </label>
                    <input
                      type="number"
                      id="helperBroker.commission"
                      name="helperBroker.commission"
                      value={formData.helperBroker.commission}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="0"
                      max="100"
                      step="0.01"
                      disabled={formData.helperBroker.status === 'paid'}
                    />
                  </div>

                  <div>
                    <label htmlFor="helperBroker.status" className="block text-sm font-medium text-gray-700">
                      Payment Status
                    </label>
                    <select
                      id="helperBroker.status"
                      name="helperBroker.status"
                      value={formData.helperBroker.status}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      disabled={formData.helperBroker.status === 'paid'}
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="helperBroker.paymentDate" className="block text-sm font-medium text-gray-700">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      id="helperBroker.paymentDate"
                      name="helperBroker.paymentDate"
                      value={formData.helperBroker.paymentDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      disabled={formData.helperBroker.status === 'paid'}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="payment.amount" className="block text-sm font-medium text-gray-700">
                      Amount *
                    </label>
                    <input
                      type="number"
                      id="payment.amount"
                      name="payment.amount"
                      value={formData.payment.amount}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                      min="0"
                      step="0.01"
                      disabled={formData.helperBroker.status === 'paid'}
                    />
                  </div>
                  <div>
                    <label htmlFor="payment.currency" className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <input
                      type="text"
                      id="payment.currency"
                      name="payment.currency"
                      value={formData.payment.currency}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {editingTask && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(initialFormState);
                      setEditingTask(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingTask ? 'Update Deal' : 'Add Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Deal List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Helper Broker
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Helper Commission
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasksList.map((task) => (
                <tr 
                  key={task._id}
                  className={`${
                    task.helperBroker?.status === 'paid' 
                      ? 'bg-green-50' 
                      : 'bg-red-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.taskNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {companiesList.find(c => c._id === task.clientCompany)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {companiesList.find(c => c._id === task.providerCompany)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brokersList.find(b => b._id === task.helperBroker?.broker)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.helperBroker?.commission ? `${task.helperBroker.commission}%` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.payment?.amount ? 
                      `${task.payment.currency} ${task.payment.amount}` : 
                      '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(task)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4 p-4">
          <div className="text-sm text-gray-700">
            Showing {tasks.length} of {totalTasks || tasks.length} deals
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={filters.page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={tasks.length < filters.limit || tasks.length === 0}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tasks; 