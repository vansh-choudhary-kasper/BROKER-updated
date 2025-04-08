import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../store/slices/companySlice';

const Companies = () => {
  const dispatch = useAppDispatch();
  const { companies, loading, error } = useAppSelector((state) => state.companies);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    email: '',
  });
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

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
      if (editingCompany) {
        await dispatch(
          updateCompany({ id: editingCompany.id, ...formData })
        ).unwrap();
      } else {
        await dispatch(createCompany(formData)).unwrap();
      }
      setFormData({
        name: '',
        address: '',
        contact: '',
        email: '',
      });
      setEditingCompany(null);
    } catch (err) {
      console.error('Failed to save company:', err);
    }
  };

  const handleEdit = (company) => {
    setFormData({
      name: company.name,
      address: company.address,
      contact: company.contact,
      email: company.email,
    });
    setEditingCompany(company);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await dispatch(deleteCompany(id)).unwrap();
      } catch (err) {
        console.error('Failed to delete company:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {editingCompany ? 'Edit Company' : 'Add New Company'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Company Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter company address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact" className="form-label">
              Contact Number
            </label>
            <input
              type="text"
              id="contact"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter contact number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter email address"
            />
          </div>

          <div className="flex justify-end space-x-3">
            {editingCompany && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    address: '',
                    contact: '',
                    email: '',
                  });
                  setEditingCompany(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingCompany ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Company List</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td>{company.name}</td>
                  <td>{company.address}</td>
                  <td>{company.contact}</td>
                  <td>{company.email}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="btn btn-outline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(company.id)}
                        className="btn btn-danger"
                      >
                        Delete
                      </button>
                    </div>
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

export default Companies; 