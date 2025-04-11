import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { debounce } from 'lodash';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PapaParse from 'papaparse';

const Banks = () => {
  const {
    banks,
    loading,
    error,
    fetchBanks,
    addBank,
    updateBank,
    deleteBank,
    totalBanks
  } = useData();

  const { token } = useAuth();

  const initialFormState = {
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    branchName: '',
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    accountType: 'savings',
    balance: 0,
    isActive: true,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingAccount, setEditingAccount] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    accountType: '',
    isActive: '',
    page: 1,
    limit: 10
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // New state for bank statements
  const [selectedBank, setSelectedBank] = useState(null);
  const [statements, setStatements] = useState([]);
  const [statementLoading, setStatementLoading] = useState(false);
  const [showStatementsModal, setShowStatementsModal] = useState(false);

  // New state for bank history upload
  const [uploadHistory, setUploadHistory] = useState({
    file: null,
    loading: false,
    error: null,
    success: false,
    preview: []
  });

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
    fetchBanks(filters);
  }, [fetchBanks, filters]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await updateBank(editingAccount._id, formData);
      } else {
        await addBank(formData);
      }
      setFormData(initialFormState);
      setEditingAccount(null);
      setShowForm(false);
      fetchBanks(filters);
    } catch (err) {
      console.error('Failed to save bank account:', err);
      alert(`Failed to save bank account: ${err.message || err}`);
    }
  };

  const handleEdit = (account) => {
    setFormData({
      accountName: account.accountName || '',
      accountNumber: account.accountNumber || '',
      bankName: account.bankName || '',
      ifscCode: account.ifscCode || '',
      branchName: account.branchName || '',
      address: account.address || '',
      contactPerson: account.contactPerson || '',
      email: account.email || '',
      phone: account.phone || '',
      accountType: account.accountType || 'savings',
      balance: account.balance || 0,
      isActive: account.isActive ?? true,
    });
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        await deleteBank(id);
        fetchBanks(filters);
      } catch (err) {
        console.error('Failed to delete bank account:', err);
        alert(`Failed to delete bank account: ${err.message || err}`);
      }
    }
  };

  const getAccountTypeBadgeClass = (type) => {
    switch (type) {
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'current':
        return 'bg-blue-100 text-blue-800';
      case 'fixed_deposit':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeClass = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const bankAccountsList = Array.isArray(banks) ? banks : [];

  // New handlers for bank statements
  const handleViewStatements = async (bank) => {
    setSelectedBank(bank);
    await fetchStatements(bank._id);
    setShowStatementsModal(true);
  };

  const fetchStatements = async (bankId) => {
    try {
      setStatementLoading(true);
      const response = await axios.get(`/api/banks/${bankId}/statements`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
      console.error("response", response);
      
      if (response.data && response.data.data) {
        setStatements(response.data.data);
      } else {
        setStatements([]);
        console.error('Invalid response format:', response);
      }
    } catch (err) {
      console.error('Failed to fetch statements:', err.response?.data || err.message);
      setStatements([]);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('statement', file);
    formData.append('bankId', selectedBank._id);

    try {
      setStatementLoading(true);
      const response = await axios.post('/api/banks/statements/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (response.data && response.data.success) {
        await fetchStatements(selectedBank._id);
      } else {
        console.error('Failed to upload statement:', response.data);
      }
    } catch (err) {
      console.error('Failed to upload statement:', err.response?.data || err.message);
    } finally {
      setStatementLoading(false);
    }
  };

  const downloadStatement = async (statementId) => {
    try {
      const response = await axios.get(`/api/banks/statements/${statementId}/download`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/octet-stream'
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `statement-${statementId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download statement:', err.response?.data || err.message);
    }
  };

  // New function to handle bank history file upload
  const handleBankHistoryUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadHistory(prev => ({
      ...prev,
      file,
      loading: true,
      error: null,
      success: false
    }));

    try {
      if (file.name.endsWith('.csv')) {
        // Handle CSV file
        PapaParse.parse(file, {
          complete: async (results) => {
            const headers = results.data[0];
            const data = results.data.slice(1);
            
            // Validate headers
            const requiredHeaders = ['date', 'companyName', 'bankName', 'accountNo', 'credit/debit'];
            const hasValidHeaders = requiredHeaders.every(header => 
              headers.includes(header.toLowerCase())
            );

            if (!hasValidHeaders) {
              throw new Error('Invalid file format. Required columns: date, companyName, bankName, accountNo, credit/debit');
            }

            // Process and upload the data
            await uploadBankHistory(data, headers);
          },
          error: (error) => {
            throw new Error('Error parsing CSV file: ' + error.message);
          }
        });
      } else if (file.name.endsWith('.xml')) {
        // Handle XML file
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
            const transactions = Array.from(xmlDoc.getElementsByTagName('transaction'));
            
            const data = transactions.map(transaction => ({
              date: transaction.getElementsByTagName('date')[0]?.textContent,
              companyName: transaction.getElementsByTagName('companyName')[0]?.textContent,
              bankName: transaction.getElementsByTagName('bankName')[0]?.textContent,
              accountNo: transaction.getElementsByTagName('accountNo')[0]?.textContent,
              'credit/debit': transaction.getElementsByTagName('type')[0]?.textContent
            }));

            await uploadBankHistory(data);
          } catch (error) {
            throw new Error('Error parsing XML file: ' + error.message);
          }
        };
        reader.readAsText(file);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or XML file.');
      }
    } catch (error) {
      setUploadHistory(prev => ({
        ...prev,
        loading: false,
        error: error.message,
        success: false
      }));
    }
  };

  const uploadBankHistory = async (data, headers = null) => {
    try {
      const response = await axios.post('/api/banks/history/upload', 
        { transactions: data },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUploadHistory(prev => ({
        ...prev,
        loading: false,
        success: true,
        preview: data.slice(0, 5) // Show first 5 records as preview
      }));

      // Refresh the banks list
      fetchBanks(filters);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to upload bank history');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bank Accounts</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add Bank Account
        </button>
      </div>

      {error && error.message && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4" role="alert">
          <p className="text-red-700">{typeof error === 'string' ? error : 'An error occurred'}</p>
        </div>
      )}

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
                placeholder="Search by account name, number, bank name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Search by account name, number, or bank name
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={filters.accountType}
              onChange={(e) => setFilters(prev => ({ ...prev, accountType: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="fixed_deposit">Fixed Deposit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.isActive}
              onChange={(e) => setFilters(prev => ({ ...prev, isActive: e.target.value, page: 1 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bank Account Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAccount ? 'Edit Bank Account' : 'Add New Bank Account'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setFormData(initialFormState);
                  setEditingAccount(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    id="accountName"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    id="accountNumber"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="ifscCode" className="block text-sm font-medium text-gray-700">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    id="ifscCode"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    pattern="[A-Z]{4}0[A-Z0-9]{6}"
                    title="IFSC code should be 11 characters long (e.g., SBIN0123456)"
                  />
                </div>

                <div>
                  <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">
                    Branch Name *
                  </label>
                  <input
                    type="text"
                    id="branchName"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
                    title="Please enter a valid email address"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[0-9]{10}"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                    title="Please enter a valid 10-digit phone number"
                  />
                </div>

                <div>
                  <label htmlFor="accountType" className="block text-sm font-medium text-gray-700">
                    Account Type *
                  </label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  >
                    <option value="savings">Savings</option>
                    <option value="current">Current</option>
                    <option value="fixed_deposit">Fixed Deposit</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="balance" className="block text-sm font-medium text-gray-700">
                    Balance
                  </label>
                  <input
                    type="number"
                    id="balance"
                    name="balance"
                    value={formData.balance}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Active Account
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormState);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingAccount ? 'Update Account' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank History Upload Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Bank History</h2>
        
        {/* File Structure Information */}
        <div className="mb-6 bg-gray-50 p-4 rounded-md">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Expected File Structure</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CSV Format */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">CSV Format</h4>
              <div className="bg-gray-100 p-3 rounded border border-gray-300 overflow-x-auto">
                <pre className="text-sm text-gray-700 whitespace-pre">
{`date,companyName,bankName,accountNo,credit/debit
2024-03-20,Company A,HDFC Bank,1234567890,credit
2024-03-21,Company B,ICICI Bank,0987654321,debit
2024-03-22,Company A,SBI Bank,1122334455,credit`}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required columns: date, companyName, bankName, accountNo, credit/debit
              </p>
            </div>
            
            {/* XML Format */}
            <div>
              <h4 className="text-md font-medium text-gray-800 mb-2">XML Format</h4>
              <div className="bg-gray-100 p-3 rounded border border-gray-300 overflow-x-auto">
                <pre className="text-sm text-gray-700 whitespace-pre">
{`<?xml version="1.0" encoding="UTF-8"?>
<transactions>
  <transaction>
    <date>2024-03-20</date>
    <companyName>Company A</companyName>
    <bankName>HDFC Bank</bankName>
    <accountNo>1234567890</accountNo>
    <type>credit</type>
  </transaction>
  <transaction>
    <date>2024-03-21</date>
    <companyName>Company B</companyName>
    <bankName>ICICI Bank</bankName>
    <accountNo>0987654321</accountNo>
    <type>debit</type>
  </transaction>
</transactions>`}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required tags: date, companyName, bankName, accountNo, type (credit/debit)
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Note:</span> The system will automatically create or update bank accounts and companies based on the uploaded data.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".csv,.xml"
              onChange={handleBankHistoryUpload}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
            />
          </div>

          {uploadHistory.loading && (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {uploadHistory.error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-red-700">{uploadHistory.error}</p>
            </div>
          )}

          {uploadHistory.success && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4">
              <p className="text-green-700">Bank history uploaded successfully!</p>
              {uploadHistory.preview.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Preview (First 5 records):</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(uploadHistory.preview[0]).map(header => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadHistory.preview.map((record, index) => (
                          <tr key={index}>
                            {Object.values(record).map((value, i) => (
                              <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {value}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bank Account List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Bank Account List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Number
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IFSC Code
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bankAccountsList.map((account) => (
                <tr key={account._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {account.accountName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.accountNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.bankName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.ifscCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {account.branchName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getAccountTypeBadgeClass(account.accountType)}`}>
                      {account.accountType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(account.isActive)}`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewStatements(account)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Statements
                    </button>
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(account._id)}
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
            Showing {banks?.length} of {totalBanks || banks?.length} accounts
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
              disabled={banks?.length < filters.limit || banks?.length === 0}
              className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add Statements Modal */}
      {showStatementsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Bank Statements - {selectedBank?.bankName} ({selectedBank?.accountNumber})
              </h2>
              <button
                onClick={() => setShowStatementsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                Upload Statement
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xml"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {statementLoading ? (
              <div>Loading statements...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statements.map((statement) => (
                      <tr key={statement._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(statement.uploadDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {statement.fileType.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {statement.fileName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            statement.status === 'processed' 
                              ? 'bg-green-100 text-green-800'
                              : statement.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {statement.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => downloadStatement(statement._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                    {statements.length === 0 && (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No statements found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Banks;