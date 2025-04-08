import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} from '../store/slices/companySlice';
import BankDetailsForm from '../components/BankDetailsForm';

const Companies = () => {
  const dispatch = useAppDispatch();
  const { companies, loading, error } = useAppSelector((state) => state.companies);
  const initialFormState = {
    name: '',
    type: 'client',
    contactPerson: {
      name: '',
      email: '',
      phone: '',
      designation: '',
      alternatePhone: '',
      idProof: {
        type: 'aadhar',
        number: '',
        document: null
      }
    },
    businessDetails: {
      gstNumber: '',
      panNumber: '',
      cinNumber: '',
      tdsNumber: '',
      registrationDate: '',
      registrationAuthority: '',
      registrationCertificate: null
    },
    legalDetails: {
      registeredName: '',
      registeredOffice: {
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      }
    },
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: '',
      landmark: ''
    },
    bankDetails: [{
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
    }],
    status: 'pending_verification',
    riskAssessment: {
      score: 0,
      factors: []
    }
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingCompany, setEditingCompany] = useState(null);

  useEffect(() => {
    dispatch(fetchCompanies());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field, subfield] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: subfield ? {
            ...prev[section][field],
            [subfield]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name.includes('.')) {
      const [section, field, subfield] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: subfield ? {
            ...prev[section][field],
            [subfield]: files[0]
          } : files[0]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
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
      setFormData(initialFormState);
      setEditingCompany(null);
    } catch (err) {
      console.error('Failed to save company:', err);
    }
  };

  const handleEdit = (company) => {
    setFormData(company);
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingCompany ? 'Edit Company' : 'Add New Company'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Company Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Company Name *
              </label>
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
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Company Type *
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Contact Person */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Person</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contactPerson.name" className="block text-sm font-medium text-gray-700">
                  Contact Person Name *
                </label>
                <input
                  type="text"
                  id="contactPerson.name"
                  name="contactPerson.name"
                  value={formData.contactPerson.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactPerson.email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="contactPerson.email"
                  name="contactPerson.email"
                  value={formData.contactPerson.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="contactPerson.phone" className="block text-sm font-medium text-gray-700">
                  Phone *
                </label>
                <input
                  type="tel"
                  id="contactPerson.phone"
                  name="contactPerson.phone"
                  value={formData.contactPerson.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  pattern="[0-9]{10}"
                />
              </div>

              <div>
                <label htmlFor="contactPerson.designation" className="block text-sm font-medium text-gray-700">
                  Designation
                </label>
                <input
                  type="text"
                  id="contactPerson.designation"
                  name="contactPerson.designation"
                  value={formData.contactPerson.designation}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="contactPerson.alternatePhone" className="block text-sm font-medium text-gray-700">
                  Alternate Phone
                </label>
                <input
                  type="tel"
                  id="contactPerson.alternatePhone"
                  name="contactPerson.alternatePhone"
                  value={formData.contactPerson.alternatePhone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="businessDetails.gstNumber" className="block text-sm font-medium text-gray-700">
                  GST Number *
                </label>
                <input
                  type="text"
                  id="businessDetails.gstNumber"
                  name="businessDetails.gstNumber"
                  value={formData.businessDetails.gstNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessDetails.panNumber" className="block text-sm font-medium text-gray-700">
                  PAN Number *
                </label>
                <input
                  type="text"
                  id="businessDetails.panNumber"
                  name="businessDetails.panNumber"
                  value={formData.businessDetails.panNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="businessDetails.cinNumber" className="block text-sm font-medium text-gray-700">
                  CIN Number
                </label>
                <input
                  type="text"
                  id="businessDetails.cinNumber"
                  name="businessDetails.cinNumber"
                  value={formData.businessDetails.cinNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="businessDetails.tdsNumber" className="block text-sm font-medium text-gray-700">
                  TDS Number
                </label>
                <input
                  type="text"
                  id="businessDetails.tdsNumber"
                  name="businessDetails.tdsNumber"
                  value={formData.businessDetails.tdsNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="businessDetails.registrationDate" className="block text-sm font-medium text-gray-700">
                  Registration Date
                </label>
                <input
                  type="date"
                  id="businessDetails.registrationDate"
                  name="businessDetails.registrationDate"
                  value={formData.businessDetails.registrationDate}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="businessDetails.registrationAuthority" className="block text-sm font-medium text-gray-700">
                  Registration Authority
                </label>
                <input
                  type="text"
                  id="businessDetails.registrationAuthority"
                  name="businessDetails.registrationAuthority"
                  value={formData.businessDetails.registrationAuthority}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="businessDetails.registrationCertificate" className="block text-sm font-medium text-gray-700">
                  Registration Certificate
                </label>
                <input
                  type="file"
                  id="businessDetails.registrationCertificate"
                  name="businessDetails.registrationCertificate"
                  onChange={handleFileChange}
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  accept=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>
          </div>

          {/* Legal Details */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="legalDetails.registeredName" className="block text-sm font-medium text-gray-700">
                  Registered Name
                </label>
                <input
                  type="text"
                  id="legalDetails.registeredName"
                  name="legalDetails.registeredName"
                  value={formData.legalDetails.registeredName}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="legalDetails.registeredOffice.address" className="block text-sm font-medium text-gray-700">
                  Registered Office Address
                </label>
                <input
                  type="text"
                  id="legalDetails.registeredOffice.address"
                  name="legalDetails.registeredOffice.address"
                  value={formData.legalDetails.registeredOffice.address}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="legalDetails.registeredOffice.city" className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  id="legalDetails.registeredOffice.city"
                  name="legalDetails.registeredOffice.city"
                  value={formData.legalDetails.registeredOffice.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="legalDetails.registeredOffice.state" className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  id="legalDetails.registeredOffice.state"
                  name="legalDetails.registeredOffice.state"
                  value={formData.legalDetails.registeredOffice.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="legalDetails.registeredOffice.country" className="block text-sm font-medium text-gray-700">
                  Country
                </label>
                <input
                  type="text"
                  id="legalDetails.registeredOffice.country"
                  name="legalDetails.registeredOffice.country"
                  value={formData.legalDetails.registeredOffice.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="legalDetails.registeredOffice.pincode" className="block text-sm font-medium text-gray-700">
                  Pincode
                </label>
                <input
                  type="text"
                  id="legalDetails.registeredOffice.pincode"
                  name="legalDetails.registeredOffice.pincode"
                  value={formData.legalDetails.registeredOffice.pincode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  pattern="[0-9]{6}"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                  Street Address *
                </label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                  Country *
                </label>
                <input
                  type="text"
                  id="address.country"
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="address.pincode" className="block text-sm font-medium text-gray-700">
                  Pincode *
                </label>
                <input
                  type="text"
                  id="address.pincode"
                  name="address.pincode"
                  value={formData.address.pincode}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                  pattern="[0-9]{6}"
                />
              </div>

              <div>
                <label htmlFor="address.landmark" className="block text-sm font-medium text-gray-700">
                  Landmark
                </label>
                <input
                  type="text"
                  id="address.landmark"
                  name="address.landmark"
                  value={formData.address.landmark}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
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

          <div className="flex justify-end space-x-3 mt-6">
            {editingCompany && (
              <button
                type="button"
                onClick={() => {
                  setFormData(initialFormState);
                  setEditingCompany(null);
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
              {editingCompany ? 'Update Company' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>

      {/* Company List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Company List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GST Number
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
              {companies.map((company) => (
                <tr key={company._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {company.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.contactPerson?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {company.businessDetails?.gstNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      company.status === 'active' ? 'bg-green-100 text-green-800' :
                      company.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      company.status === 'blacklisted' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(company)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(company._id)}
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
      </div>
    </div>
  );
};

export default Companies; 