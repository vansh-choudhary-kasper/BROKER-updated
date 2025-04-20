import { useState, useEffect, useCallback, useRef } from 'react';
import { useData } from '../context/DataContext';
import BankDetailsForm from '../components/BankDetailsForm';
import { debounce } from 'lodash';
import { useSearchParams } from 'react-router-dom';
import Slabs from './Slabs';

const Companies = () => {
  const [searchParams] = useSearchParams();
  const {
    companies,
    loading,
    error,
    fetchCompanies,
    addCompany,
    updateCompany,
    deleteCompany,
    totalCompanies
  } = useData();

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
    documents: {
      incorporationCertificate: null,
      memorandumOfAssociation: null,
      articlesOfAssociation: null,
      boardResolution: null,
      taxRegistration: null,
      otherDocuments: []
    },
    slabs: [],
    status: 'pending_verification',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingCompany, setEditingCompany] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    page: 1,
    limit: 10
  });
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
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

  const [loaded, setLoaded] = useState(false);
  // Initialize filters with URL parameters
  useEffect(() => {
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    
    setLoaded(false);
    setTimeout(() => {
      setFilters(prev => ({
        ...prev,
        type: type || '',
        status: status || '',
        search: search || '',
        page: page ? parseInt(page) : 1
      }));
      setLoaded(true);
    }, 1000);
  }, [searchParams]);

  // Fetch companies when filters change
  useEffect(() => {
    fetchCompanies(filters);
  }, [fetchCompanies, filters]);

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
      
      // Special handling for otherDocuments which can have multiple files
      if (field === 'otherDocuments') {
        // Convert FileList to Array and append to existing files
        const newFiles = Array.from(files);
        setFormData(prev => {
          const existingFiles = prev[section][field] || [];
          return {
            ...prev,
            [section]: {
              ...prev[section],
              [field]: [...existingFiles, ...newFiles]
            }
          };
        });
      } else {
        // Handle single file uploads
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
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }));
    }
  };

  // Add function to remove a file from otherDocuments
  const removeFile = (fileIndex) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        otherDocuments: prev.documents.otherDocuments.filter((_, index) => index !== fileIndex)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null); // Clear any previous form errors
    try {
      if (editingCompany) {
        await updateCompany(editingCompany._id, formData);
        // Refresh the companies list with current filters after update
        await fetchCompanies(filters);
      } else {
        await addCompany(formData);
        // Refresh the companies list with current filters after adding
        await fetchCompanies(filters);
      }
      setFormData(initialFormState);
      setEditingCompany(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      // Set form-specific error
      setFormError(error.message || 'Failed to save company. Please try again.');
    }
  };

  const handleSlabsChange = (slabs) => {
    setFormData(prev => ({
      ...prev,
      slabs: slabs
    }));
  };

  const handleEdit = (company) => {
    // Format the registration date to YYYY-MM-DD format for the date input
    const formattedCompany = {
      ...company,
      businessDetails: {
        ...company.businessDetails,
        registrationDate: company.businessDetails?.registrationDate 
          ? new Date(company.businessDetails.registrationDate).toISOString().split('T')[0]
          : ''
      }
    };
    setFormData(formattedCompany);
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await deleteCompany(id);
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  // Check if companies is an array before rendering
  const companiesList = Array.isArray(companies) ? companies : [];

  // Add useEffect to scroll to error when it appears
  useEffect(() => {
    if (formError && formErrorRef.current) {
      formErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [formError]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Add Company
          </button>
        </div>

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
                  placeholder="Search by name, contact person, GST, PAN, bank account, or IFSC code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pl-10"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Search by company name, contact person, GST number, PAN number, bank account number, or IFSC code
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => {
                  ('Status changed to:', e.target.value); // Debug log
                  setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Status</option>
                <option value="pending_verification">Pending Verification</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Types</option>
                <option value="client">Client</option>
                <option value="provider">Provider</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add this after the filters section and before the company form modal */}
        {error.companies && (!formError) && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error.companies}</span>
          </div>
        )}

        {/* Company Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingCompany ? 'Edit Company' : 'Add New Company'}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormData(initialFormState);
                    setEditingCompany(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Error Display */}
                {formError && (
                  <div 
                    ref={formErrorRef}
                    className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" 
                    role="alert"
                  >
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{formError}</span>
                  </div>
                )}

                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
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
                        <option value="pending_verification">Pending Verification</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
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
                      />
                    </div>

                    <div>
                      <label htmlFor="contactPerson.designation" className="block text-sm font-medium text-gray-700">
                        Designation *
                      </label>
                      <input
                        type="text"
                        id="contactPerson.designation"
                        name="contactPerson.designation"
                        value={formData.contactPerson.designation}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
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

                  </div>
                </div>

                {/* Legal Details */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Legal Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="legalDetails.registeredName" className="block text-sm font-medium text-gray-700">
                        Registered Name *
                      </label>
                      <input
                        type="text"
                        id="legalDetails.registeredName"
                        name="legalDetails.registeredName"
                        value={formData.legalDetails.registeredName}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="legalDetails.registeredOffice.address" className="block text-sm font-medium text-gray-700">
                        Registered Office Address *
                      </label>
                      <input
                        type="text"
                        id="legalDetails.registeredOffice.address"
                        name="legalDetails.registeredOffice.address"
                        value={formData.legalDetails.registeredOffice.address}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="legalDetails.registeredOffice.city" className="block text-sm font-medium text-gray-700">
                        City *
                      </label>
                      <input
                        type="text"
                        id="legalDetails.registeredOffice.city"
                        name="legalDetails.registeredOffice.city"
                        value={formData.legalDetails.registeredOffice.city}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="legalDetails.registeredOffice.state" className="block text-sm font-medium text-gray-700">
                        State *
                      </label>
                      <input
                        type="text"
                        id="legalDetails.registeredOffice.state"
                        name="legalDetails.registeredOffice.state"
                        value={formData.legalDetails.registeredOffice.state}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="legalDetails.registeredOffice.country" className="block text-sm font-medium text-gray-700">
                        Country *
                      </label>
                      <input
                        type="text"
                        id="legalDetails.registeredOffice.country"
                        name="legalDetails.registeredOffice.country"
                        value={formData.legalDetails.registeredOffice.country}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="legalDetails.registeredOffice.pincode" className="block text-sm font-medium text-gray-700">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        id="legalDetails.registeredOffice.pincode"
                        name="legalDetails.registeredOffice.pincode"
                        value={formData.legalDetails.registeredOffice.pincode}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        required
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
                          accountHolderAadhar: ''
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

                {/* Documents */}
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Company Documents (Optional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="documents.incorporationCertificate" className="block text-sm font-medium text-gray-700">
                        Incorporation Certificate
                      </label>
                      <input
                        type="file"
                        id="documents.incorporationCertificate"
                        name="documents.incorporationCertificate"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="documents.memorandumOfAssociation" className="block text-sm font-medium text-gray-700">
                        Memorandum of Association
                      </label>
                      <input
                        type="file"
                        id="documents.memorandumOfAssociation"
                        name="documents.memorandumOfAssociation"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="documents.articlesOfAssociation" className="block text-sm font-medium text-gray-700">
                        Articles of Association
                      </label>
                      <input
                        type="file"
                        id="documents.articlesOfAssociation"
                        name="documents.articlesOfAssociation"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="documents.boardResolution" className="block text-sm font-medium text-gray-700">
                        Board Resolution
                      </label>
                      <input
                        type="file"
                        id="documents.boardResolution"
                        name="documents.boardResolution"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="documents.taxRegistration" className="block text-sm font-medium text-gray-700">
                        Tax Registration
                      </label>
                      <input
                        type="file"
                        id="documents.taxRegistration"
                        name="documents.taxRegistration"
                        onChange={handleFileChange}
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                    </div>

                    <div>
                      <label htmlFor="documents.otherDocuments" className="block text-sm font-medium text-gray-700">
                        Other Documents
                      </label>
                      <input
                        type="file"
                        id="documents.otherDocuments"
                        name="documents.otherDocuments"
                        onChange={handleFileChange}
                        multiple
                        className="mt-1 block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-indigo-50 file:text-indigo-700
                          hover:file:bg-indigo-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">You can select multiple files</p>
                      
                      {/* Display selected files with remove button */}
                      {formData.documents.otherDocuments && formData.documents.otherDocuments.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700">Selected files:</p>
                          <ul className="mt-1 text-xs text-gray-600">
                            {formData.documents.otherDocuments.map((file, index) => (
                              <li key={index} className="flex items-center justify-between py-1">
                                <div className="flex items-center">
                                  <svg className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {file.name}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(index)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

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
          </div>
        )}

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
              {loaded ? <tbody className="bg-white divide-y divide-gray-200">
                {companiesList.map((company) => (
                  <tr key={company._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <button
                        onClick={() => handleCompanyClick(company)}
                        className="text-indigo-600 hover:text-indigo-900 hover:underline"
                      >
                        {company.name}
                      </button>
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
              </tbody> : <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex justify-center items-center h-full">
                      <div className="w-10 h-10 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              </tbody>}
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 p-4">
            <div className="text-sm text-gray-700">
              Showing {companies.length} of {totalCompanies} companies
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
                disabled={companies.length < filters.limit || companies.length === 0}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Company Details Modal */}
        {showDetailsModal && selectedCompany && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedCompany.name}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCompany(null);
                  }}
                  className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-8">
                {/* Basic Information */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">Company Type</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.type}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">Status</label>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedCompany.status === 'active' ? 'bg-green-100 text-green-800' :
                          selectedCompany.status === 'inactive' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedCompany.status}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Person */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Contact Person
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">Name</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.contactPerson?.name}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">Email</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.contactPerson?.email}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.contactPerson?.phone}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">Designation</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.contactPerson?.designation}</p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Business Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">GST Number</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.businessDetails?.gstNumber}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">PAN Number</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.businessDetails?.panNumber}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">CIN Number</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.businessDetails?.cinNumber}</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <label className="block text-sm font-medium text-gray-500">TDS Number</label>
                      <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.businessDetails?.tdsNumber}</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Bank Details
                  </h3>
                  {selectedCompany.bankDetails?.map((bank, index) => (
                    <div key={index} className="mb-6 bg-white p-6 rounded-md shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Account Number</label>
                          <p className="mt-1 text-lg font-medium text-gray-900">{bank.accountNumber}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">IFSC Code</label>
                          <p className="mt-1 text-lg font-medium text-gray-900">{bank.ifscCode}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Bank Name</label>
                          <p className="mt-1 text-lg font-medium text-gray-900">{bank.bankName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Branch Name</label>
                          <p className="mt-1 text-lg font-medium text-gray-900">{bank.branchName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Account Type</label>
                          <p className="mt-1 text-lg font-medium text-gray-900">{bank.accountType}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Account Holder Name</label>
                          <p className="mt-1 text-lg font-medium text-gray-900">{bank.accountHolderName}</p>
                        </div>
                      </div>
                      <br />
                      <hr />
                      <br />
                      <div>
                        <div className="text-lg font-medium text-gray-500">Custom Fields</div>
                        <div>
                          {Object.entries(bank.customFields || {}).map(([key, value]) => (
                              <div className="flex items-center gap-2"><label className="text-sm font-medium text-gray-900 capitalize">{key}:</label><p className="text-lg font-medium text-gray-500">{value}</p></div>
                          ))}
                          </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Address
                  </h3>
                  <div className="bg-white p-6 rounded-md shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Street</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.address?.street}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">City</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.address?.city}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">State</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.address?.state}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Country</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.address?.country}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Pincode</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.address?.pincode}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500">Landmark</label>
                        <p className="mt-1 text-lg font-medium text-gray-900">{selectedCompany.address?.landmark}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documents */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Company Documents
                  </h3>
                  <div className="bg-white p-6 rounded-md shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {selectedCompany.documents?.incorporationCertificate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Incorporation Certificate</label>
                          <div className="mt-1 flex items-center">
                            <a 
                              href={selectedCompany.documents.incorporationCertificate.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View Document
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.documents?.memorandumOfAssociation && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Memorandum of Association</label>
                          <div className="mt-1 flex items-center">
                            <a 
                              href={selectedCompany.documents.memorandumOfAssociation.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View Document
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.documents?.articlesOfAssociation && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Articles of Association</label>
                          <div className="mt-1 flex items-center">
                            <a 
                              href={selectedCompany.documents.articlesOfAssociation.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View Document
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.documents?.boardResolution && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Board Resolution</label>
                          <div className="mt-1 flex items-center">
                            <a 
                              href={selectedCompany.documents.boardResolution.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View Document
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.documents?.taxRegistration && (
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Tax Registration</label>
                          <div className="mt-1 flex items-center">
                            <a 
                              href={selectedCompany.documents.taxRegistration.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-900 flex items-center"
                            >
                              <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              View Document
                            </a>
                          </div>
                        </div>
                      )}
                      
                      {selectedCompany.documents?.otherDocuments && selectedCompany.documents.otherDocuments.length > 0 && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-500">Other Documents</label>
                          <div className="mt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedCompany.documents.otherDocuments.map((doc, index) => (
                              <div key={index} className="flex items-center">
                                <a 
                                  href={doc.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center"
                                >
                                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                  </svg>
                                  {doc.name || `Document ${index + 1}`}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(!selectedCompany.documents?.incorporationCertificate && 
                        !selectedCompany.documents?.memorandumOfAssociation && 
                        !selectedCompany.documents?.articlesOfAssociation && 
                        !selectedCompany.documents?.boardResolution && 
                        !selectedCompany.documents?.taxRegistration && 
                        (!selectedCompany.documents?.otherDocuments || selectedCompany.documents.otherDocuments.length === 0)) && (
                        <div className="md:col-span-2 text-center py-4 text-gray-500">
                          No documents uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Summary</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Tasks</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedCompany.financialSummary?.totalTasks || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Total Commission</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedCompany.financialSummary?.totalCommission || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Pending Commission</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedCompany.financialSummary?.pendingCommission || 0}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedCompany.financialSummary?.lastUpdated ?
                          new Date(selectedCompany.financialSummary.lastUpdated).toLocaleDateString() :
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Commission Slabs */}
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Commission Slabs</h3>
                  {selectedCompany.slabs && selectedCompany.slabs.length > 0 ? (
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
                          {selectedCompany.slabs.map((slab, index) => (
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

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedCompany(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Companies; 