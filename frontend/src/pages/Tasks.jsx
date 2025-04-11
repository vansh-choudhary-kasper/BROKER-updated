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
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    clientCompany: '',
    providerCompany: '',
    assignedTo: '',
    broker: '',
    brokerCommissionRate: 0,
    timeline: {
      startDate: '',
      endDate: '',
    },
    financialDetails: {
      clientAmount: {
        amount: 0,
        gst: 0,
        totalAmount: 0,
      },
      providerAmount: {
        amount: 0,
        gst: 0,
        totalAmount: 0,
      },
      brokerCommission: {
        amount: 0,
        gst: 0,
        totalAmount: 0,
      },
    },
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
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
      status: filters.status,
      priority: filters.priority,
      search: filters.search,
      page: filters.page,
      limit: filters.limit
    });
    fetchCompanies();
    fetchBrokers();
  }, [fetchTasks, fetchCompanies, fetchBrokers, filters]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
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

  // Calculate total amounts when base amount or GST changes
  const calculateTotals = () => {
    const clientAmount = parseFloat(formData.financialDetails.clientAmount.amount) || 0;
    const clientGST = parseFloat(formData.financialDetails.clientAmount.gst) || 0;
    const providerAmount = parseFloat(formData.financialDetails.providerAmount.amount) || 0;
    const providerGST = parseFloat(formData.financialDetails.providerAmount.gst) || 0;
    const brokerAmount = parseFloat(formData.financialDetails.brokerCommission.amount) || 0;
    const brokerGST = parseFloat(formData.financialDetails.brokerCommission.gst) || 0;

    setFormData(prev => ({
      ...prev,
      financialDetails: {
        clientAmount: {
          ...prev.financialDetails.clientAmount,
          totalAmount: clientAmount + clientGST,
        },
        providerAmount: {
          ...prev.financialDetails.providerAmount,
          totalAmount: providerAmount + providerGST,
        },
        brokerCommission: {
          ...prev.financialDetails.brokerCommission,
          totalAmount: brokerAmount + brokerGST,
        },
      },
    }));
  };

  // Call calculateTotals when relevant fields change
  useEffect(() => {
    calculateTotals();
  }, [
    formData.financialDetails.clientAmount.amount,
    formData.financialDetails.clientAmount.gst,
    formData.financialDetails.providerAmount.amount,
    formData.financialDetails.providerAmount.gst,
    formData.financialDetails.brokerCommission.amount,
    formData.financialDetails.brokerCommission.gst,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...formData,
        assignedTo: formData.assignedTo || user?._id || '67f4b49b41e62c5fd0f06588',
        company: formData.clientCompany,
      };
      console.log("taskData", taskData);
      
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
    setFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
      clientCompany: task.clientCompany || task.company || '',
      providerCompany: task.providerCompany || '',
      assignedTo: task.assignedTo._id || '',
      broker: task.broker || '',
      brokerCommissionRate: task.brokerCommissionRate || 0,
      timeline: {
        startDate: task.timeline?.startDate || '',
        endDate: task.timeline?.endDate || '',
      },
      financialDetails: {
        clientAmount: {
          amount: task.financialDetails?.clientAmount?.amount || 0,
          gst: task.financialDetails?.clientAmount?.gst || 0,
          totalAmount: task.financialDetails?.clientAmount?.totalAmount || 0,
        },
        providerAmount: {
          amount: task.financialDetails?.providerAmount?.amount || 0,
          gst: task.financialDetails?.providerAmount?.gst || 0,
          totalAmount: task.financialDetails?.providerAmount?.totalAmount || 0,
        },
        brokerCommission: {
          amount: task.financialDetails?.brokerCommission?.amount || 0,
          gst: task.financialDetails?.brokerCommission?.gst || 0,
          totalAmount: task.financialDetails?.brokerCommission?.totalAmount || 0,
        },
      },
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'disputed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const tasksList = Array.isArray(tasks) ? tasks : [];
  const companiesList = Array.isArray(companies) ? companies : [];
  const brokersList = Array.isArray(brokers) ? brokers : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Task
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4" role="alert">
          <p className="text-red-700">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by title, description, task number..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Search by task title, description, or task number
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTask ? 'Edit Task' : 'Add New Task'}
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
                      Task Title *
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
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
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

                  <div>
                    <label htmlFor="broker" className="block text-sm font-medium text-gray-700">
                      Broker
                    </label>
                    <select
                      id="broker"
                      name="broker"
                      value={formData.broker}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="">Select a broker</option>
                      {brokersList.map((broker) => (
                        <option key={broker._id} value={broker._id}>
                          {broker.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="brokerCommissionRate" className="block text-sm font-medium text-gray-700">
                      Broker Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      id="brokerCommissionRate"
                      name="brokerCommissionRate"
                      value={formData.brokerCommissionRate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Task Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Task Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status *
                    </label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="disputed">Disputed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority *
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                      Due Date *
                    </label>
                    <input
                      type="date"
                      id="dueDate"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                      Assigned To
                    </label>
                    <input
                      type="text"
                      id="assignedTo"
                      name="assignedTo"
                      value={formData.assignedTo}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Enter user ID or leave blank to assign to yourself"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="timeline.startDate" className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      id="timeline.startDate"
                      name="timeline.startDate"
                      value={formData.timeline.startDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="timeline.endDate" className="block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <input
                      type="date"
                      id="timeline.endDate"
                      name="timeline.endDate"
                      value={formData.timeline.endDate}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Financial Details */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Details</h3>
                
                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Client Amount</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="financialDetails.clientAmount.amount" className="block text-sm font-medium text-gray-700">
                        Base Amount *
                      </label>
                      <input
                        type="number"
                        id="financialDetails.clientAmount.amount"
                        name="financialDetails.clientAmount.amount"
                        value={formData.financialDetails.clientAmount.amount}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="financialDetails.clientAmount.gst" className="block text-sm font-medium text-gray-700">
                        GST *
                      </label>
                      <input
                        type="number"
                        id="financialDetails.clientAmount.gst"
                        name="financialDetails.clientAmount.gst"
                        value={formData.financialDetails.clientAmount.gst}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="financialDetails.clientAmount.totalAmount" className="block text-sm font-medium text-gray-700">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        id="financialDetails.clientAmount.totalAmount"
                        name="financialDetails.clientAmount.totalAmount"
                        value={formData.financialDetails.clientAmount.totalAmount}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-medium text-gray-700 mb-3">Provider Amount</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="financialDetails.providerAmount.amount" className="block text-sm font-medium text-gray-700">
                        Base Amount *
                      </label>
                      <input
                        type="number"
                        id="financialDetails.providerAmount.amount"
                        name="financialDetails.providerAmount.amount"
                        value={formData.financialDetails.providerAmount.amount}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="financialDetails.providerAmount.gst" className="block text-sm font-medium text-gray-700">
                        GST *
                      </label>
                      <input
                        type="number"
                        id="financialDetails.providerAmount.gst"
                        name="financialDetails.providerAmount.gst"
                        value={formData.financialDetails.providerAmount.gst}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="financialDetails.providerAmount.totalAmount" className="block text-sm font-medium text-gray-700">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        id="financialDetails.providerAmount.totalAmount"
                        name="financialDetails.providerAmount.totalAmount"
                        value={formData.financialDetails.providerAmount.totalAmount}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Broker Commission</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="financialDetails.brokerCommission.amount" className="block text-sm font-medium text-gray-700">
                        Base Amount *
                      </label>
                      <input
                        type="number"
                        id="financialDetails.brokerCommission.amount"
                        name="financialDetails.brokerCommission.amount"
                        value={formData.financialDetails.brokerCommission.amount}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="financialDetails.brokerCommission.gst" className="block text-sm font-medium text-gray-700">
                        GST *
                      </label>
                      <input
                        type="number"
                        id="financialDetails.brokerCommission.gst"
                        name="financialDetails.brokerCommission.gst"
                        value={formData.financialDetails.brokerCommission.gst}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label htmlFor="financialDetails.brokerCommission.totalAmount" className="block text-sm font-medium text-gray-700">
                        Total Amount
                      </label>
                      <input
                        type="number"
                        id="financialDetails.brokerCommission.totalAmount"
                        name="financialDetails.brokerCommission.totalAmount"
                        value={formData.financialDetails.brokerCommission.totalAmount}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50"
                        readOnly
                      />
                    </div>
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
                  {editingTask ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Task List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Task Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Provider Company
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Broker
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commission Rate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasksList.map((task) => (
                <tr key={task._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {task.taskNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {companiesList.find(c => c._id === task.clientCompany || c._id === task.company)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {companiesList.find(c => c._id === task.providerCompany)?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {brokersList.find(b => b._id === task.broker)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {task.brokerCommissionRate ? `${task.brokerCommissionRate}%` : '-'}
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
            Showing {tasks.length} of {totalTasks || tasks.length} tasks
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