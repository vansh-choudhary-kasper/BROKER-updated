import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const Expenses = () => {
  const {
    expenses,
    companies,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    fetchCompanies,
  } = useData();

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: '',
    category: '',
    paymentMethod: '',
    companyId: '',
  });
  const [editingExpense, setEditingExpense] = useState(null);

  useEffect(() => {
    fetchExpenses();
    fetchCompanies();
  }, [fetchExpenses, fetchCompanies]);

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
      if (editingExpense) {
        await updateExpense(editingExpense.id, formData);
      } else {
        await createExpense(formData);
      }
      setFormData({
        description: '',
        amount: '',
        date: '',
        category: '',
        paymentMethod: '',
        companyId: '',
      });
      setEditingExpense(null);
    } catch (err) {
      console.error('Failed to save expense:', err);
      alert(`Failed to save expense: ${err}`);
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      paymentMethod: expense.paymentMethod,
      companyId: expense.companyId,
    });
    setEditingExpense(expense);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await deleteExpense(id);
      } catch (err) {
        console.error('Failed to delete expense:', err);
        alert(`Failed to delete expense: ${err}`);
      }
    }
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'travel':
        return 'badge-warning';
      case 'office':
        return 'badge-success';
      case 'utilities':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  };

  const getPaymentMethodBadgeClass = (method) => {
    switch (method) {
      case 'cash':
        return 'badge-success';
      case 'credit_card':
        return 'badge-warning';
      case 'bank_transfer':
        return 'badge-info';
      default:
        return 'badge-primary';
    }
  };

  // Check if expenses is an array before rendering
  const expensesList = Array.isArray(expenses) ? expenses : [];
  
  // Check if companies is an array before rendering
  const companiesList = Array.isArray(companies) ? companies : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>

      {error && (
        <div className="error-message" role="alert">
          {typeof error === 'string' ? error : 'An error occurred'}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {editingExpense ? 'Edit Expense' : 'Add New Expense'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter expense description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount" className="form-label">
              Amount
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date" className="form-label">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a category</option>
              <option value="travel">Travel</option>
              <option value="office">Office</option>
              <option value="utilities">Utilities</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="paymentMethod" className="form-label">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a payment method</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
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
            {editingExpense && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    description: '',
                    amount: '',
                    date: '',
                    category: '',
                    paymentMethod: '',
                    companyId: '',
                  });
                  setEditingExpense(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingExpense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Expense List</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Category</th>
                <th>Payment Method</th>
                <th>Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expensesList.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.description}</td>
                  <td>₹{parseFloat(expense.amount).toFixed(2)}</td>
                  <td>{new Date(expense.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getCategoryBadgeClass(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getPaymentMethodBadgeClass(expense.paymentMethod)}`}>
                      {expense.paymentMethod}
                    </span>
                  </td>
                  <td>
                    {companiesList.find(c => c._id === expense.companyId)?.name || 'Unknown'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="btn btn-sm btn-outline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
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

export default Expenses; 