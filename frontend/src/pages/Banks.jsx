import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const Banks = () => {
  const {
    banks,
    companies,
    loading,
    error,
    fetchBanks,
    createBank,
    updateBank,
    deleteBank,
    fetchCompanies,
  } = useData();

  const [formData, setFormData] = useState({
    accountNumber: '',
    accountName: '',
    bankName: '',
    ifscCode: '',
    branch: '',
    companyId: '',
  });
  const [editingBank, setEditingBank] = useState(null);

  useEffect(() => {
    fetchBanks();
    fetchCompanies();
  }, [fetchBanks, fetchCompanies]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBank) {
        await updateBank(editingBank.id, formData);
      } else {
        await createBank(formData);
      }
      setFormData({
        accountNumber: '',
        accountName: '',
        bankName: '',
        ifscCode: '',
        branch: '',
        companyId: '',
      });
      setEditingBank(null);
    } catch (err) {
      console.error('Failed to save bank account:', err);
      alert(`Failed to save bank account: ${err}`);
    }
  };

  const handleEdit = (bank) => {
    setFormData({
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      bankName: bank.bankName,
      ifscCode: bank.ifscCode,
      branch: bank.branch,
      companyId: bank.companyId,
    });
    setEditingBank(bank);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      try {
        await deleteBank(id);
      } catch (err) {
        console.error('Failed to delete bank account:', err);
        alert(`Failed to delete bank account: ${err}`);
      }
    }
  };

  // Check if banks is an array before rendering
  const banksList = Array.isArray(banks) ? banks : [];
  
  // Check if companies is an array before rendering
  const companiesList = Array.isArray(companies) ? companies : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Bank Accounts</h1>

      {error && (
        <div className="error-message" role="alert">
          {typeof error === 'string' ? error : 'An error occurred'}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="accountNumber" className="form-label">
              Account Number
            </label>
            <input
              type="text"
              id="accountNumber"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter account number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="accountName" className="form-label">
              Account Name
            </label>
            <input
              type="text"
              id="accountName"
              name="accountName"
              value={formData.accountName}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter account name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="bankName" className="form-label">
              Bank Name
            </label>
            <input
              type="text"
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter bank name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="ifscCode" className="form-label">
              IFSC Code
            </label>
            <input
              type="text"
              id="ifscCode"
              name="ifscCode"
              value={formData.ifscCode}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter IFSC code"
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch" className="form-label">
              Branch
            </label>
            <input
              type="text"
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter branch name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyId" className="form-label">
              Company
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a company</option>
              {companiesList.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            {editingBank && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    accountNumber: '',
                    accountName: '',
                    bankName: '',
                    ifscCode: '',
                    branch: '',
                    companyId: '',
                  });
                  setEditingBank(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingBank ? 'Update Bank Account' : 'Add Bank Account'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Bank Account List</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Account Number</th>
                <th>Account Name</th>
                <th>Bank Name</th>
                <th>IFSC Code</th>
                <th>Branch</th>
                <th>Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {banksList.map((bank) => (
                <tr key={bank.id}>
                  <td>{bank.accountNumber}</td>
                  <td>{bank.accountName}</td>
                  <td>{bank.bankName}</td>
                  <td>{bank.ifscCode}</td>
                  <td>{bank.branch}</td>
                  <td>
                    {companiesList.find(c => c._id === bank.companyId)?.name || 'Unknown'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(bank)}
                      className="btn btn-sm btn-outline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bank.id)}
                      className="btn btn-sm btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Banks; 