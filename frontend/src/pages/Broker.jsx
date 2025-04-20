import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useData } from '../context/DataContext';
import { debounce } from 'lodash';
import BankDetailsForm from '../components/BankDetailsForm';
import Slabs from './Slabs';

const Broker = () => {
  const {
    brokers,
    loading,
    error,
    totalBrokers,
    fetchBrokers,
    addBroker,
    updateBroker,
    deleteBroker,
    companies,
    banks
  } = useData();

  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    },
    gstNumber: '',
    panNumber: '',
    company: undefined,
    bankDetails: [{
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      accountType: '',
      accountHolderName: '',
      accountHolderPan: '',
      accountHolderAadhar: '',
    }],
    financialSummary: {
      totalTasks: 0,
      totalCommission: 0,
      pendingCommission: 0,
      lastUpdated: new Date()
    },
    slabs: [],
    status: 'inactive',
    referrals: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingBroker, setEditingBroker] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [formError, setFormError] = useState(null);
  const formErrorRef = useRef(null);

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
    fetchBrokers(filters);
  }, [fetchBrokers, filters]);

  // Add a new useEffect to update totalPages when totalBrokers changes
  useEffect(() => {
    if (totalBrokers > 0) {
      setTotalPages(Math.ceil(totalBrokers / filters.limit));
    }
  }, [totalBrokers, filters.limit]);

  useEffect(() => {
    if (formError && formErrorRef.current) {
      formErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested objects (address, bankDetails)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSlabsChange = (slabs) => {
    setFormData(prev => ({
      ...prev,
      slabs: slabs
    }));
  };  

  const handleBankAccountChange = (e) => {
    const selectedBankId = e.target.value;
    if (selectedBankId && selectedBankId !== 'undefined') {
      // Find the selected bank from the banks array
      const selectedBank = banks.find(bank => bank._id === selectedBankId);
      if (selectedBank) {
        setFormData(prev => ({
          ...prev,
          bankDetails: [...(prev.bankDetails || []), {
            accountNumber: selectedBank.accountNumber,
            ifscCode: selectedBank.ifscCode,
            bankName: selectedBank.bankName,
            branchName: selectedBank.branchName,
            accountType: selectedBank.accountType || 'savings',
            accountHolderName: selectedBank.accountHolderName,
            accountHolderPan: selectedBank.accountHolderPan || '',
            accountHolderAadhar: selectedBank.accountHolderAadhar || '',
          }]
        }));
      }
      // Reset the select value after adding
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingBroker) {
        const result = await updateBroker(editingBroker._id, formData);
        if (result.success) {
          toast.success('Broker updated successfully');
          setFormData(initialFormState);
          setEditingBroker(null);
          setShowForm(false);
        } else {
          setFormError(result.message || 'Failed to update broker');
        }
      } else {
        const result = await addBroker(formData);
        if (result.success) {
          toast.success('Broker added successfully');
          setFormData(initialFormState);
          setEditingBroker(null);
          setShowForm(false);
        } else {
          setFormError(result.message || 'Failed to add broker');
        }
      }
    } catch (error) {
      setFormError(error.message || 'Failed to save broker');
    }
  };

  const handleEdit = (broker) => {
    setFormData({
      name: broker.name,
      email: broker.email,
      phone: broker.phone,
      address: broker.address || {
        street: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      },
      gstNumber: broker.gstNumber || '',
      panNumber: broker.panNumber || '',
      company: broker.company,
      bankDetails: broker.bankDetails || [{
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        branchName: '',
        accountType: '',
        accountHolderName: '',
        accountHolderPan: '',
        accountHolderAadhar: '',
      }],
      financialSummary: broker.financialSummary || {
        totalTasks: 0,
        totalCommission: 0,
        pendingCommission: 0,
        lastUpdated: new Date()
      },
      slabs: broker.slabs || [],
      status: broker.status
    });
    setEditingBroker(broker);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this broker?')) {
      try {
        const result = await deleteBroker(id);
        if (result.success) {
          toast.success('Broker deleted successfully');
        } else {
          toast.error(result.message || 'Failed to delete broker');
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete broker');
      }
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const handleViewDetails = (broker) => {
    setSelectedBroker(broker);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Brokers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Broker
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, email, or phone..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Search by broker name, email, or phone number
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Broker Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingBroker ? 'Edit Broker' : 'Add New Broker'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormState);
                  setEditingBroker(null);
                  setFormError(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {formError && (
              <div ref={formErrorRef} className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {formError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company</label>
                  <select
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value={undefined}>Select a company</option>
                    {companies && companies.map(company => (
                      <option key={company._id} value={company._id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="bankDetails" className="block text-sm font-medium text-gray-700">Bank Details</label>
                  <select
                    id="bankDetails"
                    name="bankDetails"
                    onChange={handleBankAccountChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    value=""
                  >
                    <option value="">Select a bank account</option>
                    {banks && banks.map(bank => {
                      // Only show banks that haven't been selected yet
                      if (!formData.bankDetails?.some(b => b.accountNumber === bank.accountNumber)) {
                        return (
                          <option key={bank._id} value={bank._id}>
                            {bank.bankName} - {bank.accountNumber}
                          </option>
                        );
                      }
                      return null;
                    })}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">
                    Select accounts to add them to the list (optional)
                  </p>
                  {formData.bankDetails?.length > 0 && (
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700">Selected Bank Accounts</label>
                      <div className="mt-1 space-y-1">
                        {formData.bankDetails.map((bank, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span>{bank.bankName} - {bank.accountNumber}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  bankDetails: prev.bankDetails.filter((_, i) => i !== index)
                                }));
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">GST Number</label>
                  <input
                    type="text"
                    id="gstNumber"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="panNumber" className="block text-sm font-medium text-gray-700">PAN Number</label>
                  <input
                    type="text"
                    id="panNumber"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      placeholder="Street"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      placeholder="Country"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Bank Details */}
              <BankDetailsForm
                bankDetails={formData.bankDetails}
                onChange={(index, field, value) => {
                  const newBankDetails = [...formData.bankDetails];
                  newBankDetails[index] = {
                    ...newBankDetails[index],
                    [field]: value
                  };
                  setFormData(prev => ({
                    ...prev,
                    bankDetails: newBankDetails
                  }));
                }}
                onFileChange={(index, field, file) => {
                  const newBankDetails = [...formData.bankDetails];
                  newBankDetails[index] = {
                    ...newBankDetails[index],
                    [field]: file
                  };
                  setFormData(prev => ({
                    ...prev,
                    bankDetails: newBankDetails
                  }));
                }}
                onAdd={() => {
                  setFormData(prev => ({
                    ...prev,
                    bankDetails: [...prev.bankDetails, {
                      accountNumber: '',
                      ifscCode: '',
                      bankName: '',
                      branchName: '',
                      accountType: '',
                      accountHolderName: '',
                      accountHolderPan: '',
                      accountHolderAadhar: '',
                      bankStatement: null,
                      cancelledCheque: null
                    }]
                  }));
                }}
                onRemove={(index) => {
                  setFormData(prev => ({
                    ...prev,
                    bankDetails: prev.bankDetails.filter((_, i) => i !== index)
                  }));
                }}
              />

              <div onClick={(e) => e.preventDefault()}>
                <Slabs slabs={formData.slabs} onSlabsChange={handleSlabsChange} />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormState);
                    setEditingBroker(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {editingBroker ? 'Update Broker' : 'Add Broker'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broker Details Modal */}
      {showDetailsModal && selectedBroker && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Broker Details</h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedBroker(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Status</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.status}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Company</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {companies?.find(c => c._id === selectedBroker.company)?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">GST Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.gstNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.panNumber || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Bank Accounts */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Accounts</h3>
                <div className="space-y-3">
                  {selectedBroker.bankDetails && selectedBroker.bankDetails.length > 0 ? (
                    selectedBroker.bankDetails.map((bank, index) => (
                      <div key={index} className="bg-white p-3 rounded border border-gray-200">
                        <div className="space-y-2">
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                            <p className="mt-1 text-sm text-gray-900">{bank.bankName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Account Number</label>
                            <p className="mt-1 text-sm text-gray-900">{bank.accountNumber}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500">IFSC Code</label>
                            <p className="mt-1 text-sm text-gray-900">{bank.ifscCode || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-500">Branch Name</label>
                            <p className="mt-1 text-sm text-gray-900">{bank.branchName || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No bank accounts associated</p>
                  )}
                </div>
              </div>

              {/* Address Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Street</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.address?.street || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">City</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.address?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">State</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.address?.state || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Country</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.address?.country || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Pincode</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.address?.pincode || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total Tasks</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedBroker.financialSummary?.totalTasks || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Total Commission</label>
                    <p className="mt-1 text-sm text-gray-900">₹{selectedBroker.financialSummary?.totalCommission || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Pending Commission</label>
                    <p className="mt-1 text-sm text-gray-900">₹{selectedBroker.financialSummary?.pendingCommission || 0}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedBroker.financialSummary?.lastUpdated ?
                        new Date(selectedBroker.financialSummary.lastUpdated).toLocaleDateString() :
                        'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commission Slabs */}
              <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Slabs</h3>
                {selectedBroker.slabs && selectedBroker.slabs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission %</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedBroker.slabs.map((slab, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{slab.minAmount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{slab.maxAmount.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{slab.commission}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No commission slabs defined</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Broker List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Broker List</h2>
        </div>
        <div className="overflow-x-auto">
          {loading.brokers ? (
            <div className="p-4 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
              </div>
              <p className="mt-2 text-gray-500">Loading brokers...</p>
            </div>
          ) : brokers.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No brokers found
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="bg-gray-100">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Summary</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {brokers.map((broker) => (
                  <tr key={broker._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetails(broker)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {broker.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{broker.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {companies?.find(c => c._id === broker.company)?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div>Tasks: {broker.financialSummary?.totalTasks || 0}</div>
                        <div>Commission: ₹{broker.financialSummary?.totalCommission || 0}</div>
                        <div>Pending: ₹{broker.financialSummary?.pendingCommission || 0}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${broker.status === 'active' ? 'bg-green-100 text-green-800' :
                        broker.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                        {broker.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(broker)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(broker._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading.brokers && brokers.length > 0 && (
          <div className="flex justify-between items-center mt-4 p-4 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {brokers.length} of {totalBrokers} brokers
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(filters.page - 1)}
                disabled={filters.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-gray-700">
                Page {filters.page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(filters.page + 1)}
                disabled={filters.page >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Broker; 