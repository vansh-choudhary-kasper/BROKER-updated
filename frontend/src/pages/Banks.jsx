import { useState, useEffect, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { debounce } from 'lodash';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PapaParse from 'papaparse';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Banks = () => {
  const {
    banks,
    loading,
    error,
    fetchBanks,
    addBank,
    updateBank,
    deleteBank,
    totalBanks,
    companies,
  } = useData();

  const { token } = useAuth();

  const initialFormState = {
    accountHolderName: '',
    accountHolderPan: '',
    accountHolderAadhar: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'savings',
    isActive: true,
    customFields: {}
  };

  const [formData, setFormData] = useState(initialFormState);
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '' });
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

  // New state for bank history upload
  const [uploadHistory, setUploadHistory] = useState({
    file: null,
    loading: false,
    error: null,
    success: false,
    preview: []
  });

  // New state for transactions
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [transactionFilters, setTransactionFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    page: 1,
    limit: 10
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

  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
      page: 1 // Reset to first page when filters change
    }));
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

  const handleAddCustomField = () => {
    if (newCustomField.name && newCustomField.value) {
      setFormData(prev => ({
        ...prev,
        customFields: {
          ...prev.customFields,
          [newCustomField.name]: newCustomField.value
        }
      }));
      setNewCustomField({ name: '', value: '' });
    }
  };

  const handleRemoveCustomField = (fieldName) => {
    setFormData(prev => {
      const updatedCustomFields = { ...prev.customFields };
      delete updatedCustomFields[fieldName];
      return {
        ...prev,
        customFields: updatedCustomFields
      };
    });
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
      accountHolderName: account.accountHolderName || '',
      accountHolderPan: account.accountHolderPan || '',
      accountHolderAadhar: account.accountHolderAadhar || '',
      accountNumber: account.accountNumber || '',
      ifscCode: account.ifscCode || '',
      bankName: account.bankName || '',
      branchName: account.branchName || '',
      accountType: account.accountType || 'savings',
      isActive: account.isActive ?? true,
      customFields: account.customFields || {}
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
            let headers = results.data[0];
            headers = headers.map(header => header.toLowerCase().replace(/ /g, '_').trim());
            const data = results.data.slice(1).map(row => ({
              date: row[headers.indexOf('date')],
              companyName: row[headers.indexOf('companyname')], 
              bankName: row[headers.indexOf('bankname')],
              accountNo: row[headers.indexOf('accountno')],
              amount: row[headers.indexOf('amount')],
              creditDebit: row[headers.indexOf('credit/debit')]
            }));
            
            // Validate headersk
            const requiredHeaders = ['date', 'companyName', 'bankName', 'accountno', 'amount', 'credit/debit'];
            const hasValidHeaders = requiredHeaders.every(header => {
              if(!headers.includes(header.toLowerCase())){
                return false;
              }
              return true;
            }
            );

            if (!hasValidHeaders) {
              throw new Error('Invalid file format. Required columns: date, companyName, bankName, accountNo, amount, credit/debit');
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
              amount: transaction.getElementsByTagName('amount')[0]?.textContent,
              creditDebit: transaction.getElementsByTagName('creditDebit')[0]?.textContent
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
          const response = await axios.post(`${backendUrl}/api/banks/statements/upload`, 
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

  // New handlers for bank transactions
  const handleViewTransactions = async (bank) => {
    setSelectedBank(bank);
    await fetchTransactions(bank._id);
    setShowTransactionsModal(true);
  };

  const fetchTransactions = async (bankId) => {
    try {
      setTransactionLoading(true);
      const queryParams = new URLSearchParams({
        ...transactionFilters
      }).toString();
      
      const response = await axios.get(
        `${backendUrl}/api/banks/${bankId}/transactions?${queryParams}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        }
      );
      
      if (response.data && response.data.data) {
        setTransactions(response.data.data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err.response?.data || err.message);
      setTransactions([]);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleTransactionFilterChange = (e) => {
    const { name, value } = e.target;
    setTransactionFilters(prev => ({
      ...prev,
      [name]: value,
      page: 1 // Reset page when filters change
    }));
  };

  // Add function to get company name by ID
  const getCompanyNameById = (companyId) => {
    if (!companyId) return 'Other';
    const company = companies?.find(c => c._id === companyId);
    return company ? company.name : 'Other';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Bank Accounts</h1>
        <button
          onClick={() => {
            setFormData(initialFormState);
            setEditingAccount(null);
            setShowForm(true);
          }}
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
                  <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    id="accountHolderName"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="accountHolderPan" className="block text-sm font-medium text-gray-700">
                    Account Holder PAN
                  </label>
                  <input
                    type="text"
                    id="accountHolderPan"
                    name="accountHolderPan"
                    value={formData.accountHolderPan}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="accountHolderAadhar" className="block text-sm font-medium text-gray-700">
                    Account Holder Aadhar
                  </label>
                  <input
                    type="text"
                    id="accountHolderAadhar"
                    name="accountHolderAadhar"
                    value={formData.accountHolderAadhar}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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

              {/* Custom Fields Section */}
              <div className="mt-6 border-t border-gray-200 pt-4">
                <h4 className="text-md font-medium text-gray-800 mb-4">Custom Fields</h4>
                
                {/* Add Custom Field Form */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={newCustomField.name}
                      onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Field Value"
                      value={newCustomField.value}
                      onChange={(e) => setNewCustomField({ ...newCustomField, value: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Custom Field
                    </button>
                  </div>
                </div>

                {/* Display Custom Fields */}
                {Object.entries(formData.customFields).length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData.customFields).map(([fieldName, fieldValue]) => (
                      <div key={fieldName} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <span className="font-medium">{fieldName}:</span>
                        <span>{fieldValue}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(fieldName)}
                          className="ml-auto text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
{`date,companyName,bankName,accountNo,amount,credit/debit
2024-03-20,Company A,HDFC Bank,1234567890,5000.00,credit
2024-03-21,Company B,ICICI Bank,0987654321,2500.00,debit
2024-03-22,Company A,SBI Bank,1122334455,7500.00,credit`}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required columns: date, companyName, bankName, accountNo, amount, credit/debit
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
    <amount>5000.00</amount>
    <creditDebit>credit</creditDebit>
  </transaction>
  <transaction>
    <date>2024-03-21</date>
    <companyName>Company B</companyName>
    <bankName>ICICI Bank</bankName>
    <accountNo>0987654321</accountNo>
    <amount>2500.00</amount>
    <creditDebit>debit</creditDebit>
  </transaction>
</transactions>`}
                </pre>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Required tags: date, companyName, bankName, accountNo, amount, creditDebit (credit/debit)
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Note:</span> Transactions with incorrect bank names or account numbers will be rejected, as the system doesn't create new accounts or companies.
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
                placeholder="Search by account holder name, number, bank name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Search by account holder name, number, or bank name
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
            <select
              value={filters.accountType}
              onChange={(e) => handleFilterChange('accountType', e.target.value)}
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
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
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
                  Account Holder Name
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
                    {account.accountHolderName}
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
                      onClick={() => handleViewTransactions(account)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Transactions
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

      {/* Transactions Modal */}
      {showTransactionsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Bank Transactions - {selectedBank?.bankName} ({selectedBank?.accountNumber})
              </h2>
              <button
                onClick={() => setShowTransactionsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Transaction Filters */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={transactionFilters.startDate}
                  onChange={handleTransactionFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={transactionFilters.endDate}
                  onChange={handleTransactionFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={transactionFilters.type}
                  onChange={handleTransactionFilterChange}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">All</option>
                  <option value="credit">Credit</option>
                  <option value="debit">Debit</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => fetchTransactions(selectedBank._id)}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Transactions Table */}
            {transactionLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transaction.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            transaction.type === 'credit' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {getCompanyNameById(transaction.companyName)}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No transactions found
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