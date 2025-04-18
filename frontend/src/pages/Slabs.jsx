import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Slabs = ({ slabs, onSlabsChange }) => {
  const { token } = useAuth();
  const [clientSlabs, setClientSlabs] = useState([]);
  const [providerSlabs, setProviderSlabs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingSlab, setEditingSlab] = useState(null);
  const [userData, setUserData] = useState(null);

  const initialSlabState = {
    minAmount: '',
    maxAmount: '',
    commission: '',
  };

  const [newClientSlab, setNewClientSlab] = useState(initialSlabState);
  const [newProviderSlab, setNewProviderSlab] = useState(initialSlabState);
  const [type, setType] = useState(slabs?.length > 0 ? 'client' : '');

  // Fetch user data using token
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
      return response.data;
    } catch (err) {
      setError('Failed to fetch user data');
      return null;
    }
  };

  // Handle commission input to prevent scientific notation and maintain trailing zeros
  const handleCommissionChange = (e, setSlabFunction, currentSlab) => {
    const value = e.target.value;

    // Allow empty string for clearing the input
    if (value === '') {
      setSlabFunction({ ...currentSlab, commission: '' });
      return;
    }

    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^\d.]/g, '');

    // Ensure only one decimal point
    const parts = cleanValue.split('.');
    if (parts.length > 2) return;

    // Limit decimal places to 8
    if (parts[1] && parts[1].length > 15) return;

    // Prevent values over 100
    if (parseFloat(cleanValue) > 100) return;

    setSlabFunction({ ...currentSlab, commission: cleanValue });
  };

  useEffect(() => {
    const initializeData = async () => {
      const user = await fetchUserData();
      if (user) {
        fetchSlabs(user._id);
      }
    };
    initializeData();
  }, []);

  const fetchSlabs = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        if(onSlabsChange) {
          setClientSlabs(slabs || []);
          setProviderSlabs(slabs || []);
        } else {
          setClientSlabs(response.data.clientSlabs || []);
          setProviderSlabs(response.data.providerSlabs || []);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch slabs');
    } finally {
      setLoading(false);
    }
  };

  const validateSlabRange = (type, slabData, editingId = null) => {
    const currentSlabs = type === 'client' ? clientSlabs : providerSlabs;
    const minAmount = parseInt(slabData.minAmount, 10);
    const maxAmount = parseInt(slabData.maxAmount, 10);
    const commission = parseFloat(slabData.commission);

    // Basic validation
    if (slabData.minAmount === '' || slabData.maxAmount === '' || slabData.commission === '') {
      throw new Error('All fields are required');
    }

    if (isNaN(minAmount) || isNaN(maxAmount) || isNaN(commission)) {
      throw new Error('Please enter valid numbers');
    }

    if (minAmount >= maxAmount) {
      throw new Error('Minimum amount must be less than maximum amount');
    }

    if (minAmount < 0 || maxAmount < 0) {
      throw new Error('Amounts cannot be negative');
    }

    if (commission < 0 || commission > 100) {
      throw new Error('Commission must be between 0 and 100');
    }

    // Convert and sort slabs excluding the editing slab
    const otherSlabs = currentSlabs
      .filter(slab => (!editingId || (
        parseInt(slab.minAmount) !== parseInt(editingId.minAmount) && 
        parseInt(slab.maxAmount) !== parseInt(editingId.maxAmount)
      )))
      .map(slab => ({
        ...slab,
        minAmount: parseInt(slab.minAmount, 10),
        maxAmount: parseInt(slab.maxAmount, 10)
      }))
      .sort((a, b) => a.minAmount - b.minAmount);

    // If this is the first slab, it should start from 0
    if (otherSlabs.length === 0) {
      if (minAmount !== 0) {
        throw new Error('First slab should start from 0');
      }
    }

    // Find where this slab would fit
    const insertIndex = otherSlabs.findIndex(slab => slab.minAmount > minAmount);

    // Check for overlaps and gaps
    if (insertIndex === -1) {
      // This would be the last slab
      if (otherSlabs.length > 0) {
        const lastSlab = otherSlabs[otherSlabs.length - 1];
        if (minAmount !== lastSlab.maxAmount + 1) {
          throw new Error(`Minimum amount must be ${lastSlab.maxAmount + 1}`);
        }
      }
    } else {
      // Check with previous slab if exists
      if (insertIndex > 0) {
        const prevSlab = otherSlabs[insertIndex - 1];
        if (minAmount !== prevSlab.maxAmount + 1) {
          throw new Error(`Minimum amount must be ${prevSlab.maxAmount + 1}`);
        }
      }

      // Check with next slab
      const nextSlab = otherSlabs[insertIndex];
      if (maxAmount >= nextSlab.minAmount) {
        throw new Error(`Maximum amount must be less than ${nextSlab.minAmount}`);
      }
    }

    return true;
  };

  const handleAddSlab = async (type, slabData) => {
    try {
      setError(null);
      setLoading(true);

      // Convert values to numbers
      const newSlab = {
        ...slabData,
        minAmount: parseInt(slabData.minAmount, 10),
        maxAmount: parseInt(slabData.maxAmount, 10),
        commission: parseFloat(slabData.commission)
      };

      // Validate slab range
      validateSlabRange(type, newSlab);

      const currentSlabs = type === 'client' ? clientSlabs : providerSlabs;
      
      // Convert all existing slabs to ensure numbers
      const existingSlabs = currentSlabs.map(slab => ({
        ...slab,
        minAmount: parseInt(slab.minAmount, 10),
        maxAmount: parseInt(slab.maxAmount, 10),
        commission: parseFloat(slab.commission)
      }));

      const slabsToUpdate = [...existingSlabs, newSlab]
        .sort((a, b) => parseInt(a.minAmount, 10) - parseInt(b.minAmount, 10));

      if (onSlabsChange) {
        // If onSlabsChange is provided, use it instead of API call
        onSlabsChange(slabsToUpdate);
        if (type === 'client') {
          setClientSlabs(slabsToUpdate);
          setNewClientSlab(initialSlabState);
        } else {
          setProviderSlabs(slabsToUpdate);
          setNewProviderSlab(initialSlabState);
        }
      } else {
        // Use API call if onSlabsChange is not provided
        const response = await axios.patch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/${userData?._id}`,
          {
            [type === 'client' ? 'clientSlabs' : 'providerSlabs']: slabsToUpdate
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
          if (type === 'client') {
            setClientSlabs(response.data.clientSlabs);
            setNewClientSlab(initialSlabState);
          } else {
            setProviderSlabs(response.data.providerSlabs);
            setNewProviderSlab(initialSlabState);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to add slab');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (slab, type) => {
    setEditingSlab({ ...slab, type });
    if (type === 'client') {
      setNewClientSlab({
        minAmount: slab.minAmount.toString(),
        maxAmount: slab.maxAmount.toString(),
        commission: slab.commission.toString(),
      });
    } else {
      setNewProviderSlab({
        minAmount: slab.minAmount.toString(),
        maxAmount: slab.maxAmount.toString(),
        commission: slab.commission.toString(),
      });
    }
  };

  const cancelEdit = () => {
    setEditingSlab(null);
    setNewClientSlab(initialSlabState);
    setNewProviderSlab(initialSlabState);
  };

  function normalizeSlabs(slabs) {
    if (!Array.isArray(slabs) || slabs.length === 0) return [];

    // First, sort slabs by minAmount to ensure proper order
    slabs.sort((a, b) => a.minAmount - b.minAmount);

    for (let i = 1; i < slabs.length; i++) {
      const prevMax = slabs[i - 1].maxAmount;
      if (slabs[i].minAmount !== prevMax + 1) {
        slabs[i].minAmount = prevMax + 1;
      }
    }

    return slabs;
  }

  const handleUpdateSlab = async (type, slabData) => {
    try {
      setError(null);
      setLoading(true);

      const currentSlabs = type === 'client' ? clientSlabs : providerSlabs;
      let updatedSlabs = [...currentSlabs];

      // Find the index of the slab being edited using min and max amounts
      const editingIndex = updatedSlabs.findIndex(slab => 
        parseInt(slab.minAmount) === parseInt(editingSlab.minAmount) && 
        parseInt(slab.maxAmount) === parseInt(editingSlab.maxAmount)
      );

      // Auto-adjust adjacent slabs based on changes
      if (editingIndex !== -1) {
        const oldSlab = updatedSlabs[editingIndex];

        // If maxAmount changed, adjust next slab's minAmount
        if (parseInt(slabData.maxAmount) !== parseInt(oldSlab.maxAmount) && editingIndex < updatedSlabs.length - 1) {
          updatedSlabs[editingIndex + 1] = {
            ...updatedSlabs[editingIndex + 1],
            minAmount: parseInt(slabData.maxAmount) + 1
          };
        }

        // If minAmount changed, adjust previous slab's maxAmount
        if (parseInt(slabData.minAmount) !== parseInt(oldSlab.minAmount) && editingIndex > 0) {
          updatedSlabs[editingIndex - 1] = {
            ...updatedSlabs[editingIndex - 1],
            maxAmount: parseInt(slabData.minAmount) - 1
          };
        }

        // Update the current slab
        updatedSlabs[editingIndex] = {
          ...slabData,
          minAmount: parseInt(slabData.minAmount),
          maxAmount: parseInt(slabData.maxAmount),
          commission: parseFloat(slabData.commission)
        };
      }

      // Sort and validate all slabs
      updatedSlabs.sort((a, b) => parseInt(a.minAmount) - parseInt(b.minAmount));

      // Validate continuity
      for (let i = 0; i < updatedSlabs.length - 1; i++) {
        if (parseInt(updatedSlabs[i].maxAmount) + 1 !== parseInt(updatedSlabs[i + 1].minAmount)) {
          throw new Error('Slabs must be continuous without gaps');
        }
      }

      if (onSlabsChange) {
        // If onSlabsChange is provided, use it instead of API call
        onSlabsChange(updatedSlabs);
        if (type === 'client') {
          setClientSlabs(updatedSlabs);
        } else {
          setProviderSlabs(updatedSlabs);
        }
        // Reset form
        setEditingSlab(null);
        setNewClientSlab(initialSlabState);
        setNewProviderSlab(initialSlabState);
      } else {
        // Use API call if onSlabsChange is not provided
        const response = await axios.patch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/${userData?._id}`,
          {
            [type === 'client' ? 'clientSlabs' : 'providerSlabs']: updatedSlabs
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
          if (type === 'client') {
            setClientSlabs(response.data.clientSlabs);
          } else {
            setProviderSlabs(response.data.providerSlabs);
          }
          // Reset form
          setEditingSlab(null);
          setNewClientSlab(initialSlabState);
          setNewProviderSlab(initialSlabState);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to update slab');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlab = async (slab, type) => {
    try {
      setError(null);
      setLoading(true);

      const currentSlabs = type === 'client' ? clientSlabs : providerSlabs;
      const slabIndex = currentSlabs.findIndex(s => 
        parseInt(s.minAmount) === parseInt(slab.minAmount) && 
        parseInt(s.maxAmount) === parseInt(slab.maxAmount)
      );

      if (slabIndex === -1) {
        throw new Error('Slab not found');
      }

      let updatedSlabs = [...currentSlabs];

      // If it's not the last slab, adjust the next slab's minAmount
      if (slabIndex < updatedSlabs.length - 1) {
        updatedSlabs[slabIndex + 1] = {
          ...updatedSlabs[slabIndex + 1],
          minAmount: updatedSlabs[slabIndex - 1]?.maxAmount + 1 || 0
        };
      }

      //first conform from the user using brower prompt
      const confirm = window.confirm('Are you sure you want to delete this slab?');
      if (!confirm) {
        setLoading(false);
        return;
      }

      // Remove the slab using min and max amount comparison
      updatedSlabs = updatedSlabs.filter(s => 
        parseInt(s.minAmount) !== parseInt(slab.minAmount) || 
        parseInt(s.maxAmount) !== parseInt(slab.maxAmount)
      );

      if (onSlabsChange) {
        // If onSlabsChange is provided, use it instead of API call
        onSlabsChange(updatedSlabs);
        if (type === 'client') {
          setClientSlabs(updatedSlabs);
        } else {
          setProviderSlabs(updatedSlabs);
        }
      } else {
        // Use API call if onSlabsChange is not provided
        const response = await axios.patch(
          `${import.meta.env.VITE_BACKEND_URL}/api/users/${userData?._id}`,
          {
            [type === 'client' ? 'clientSlabs' : 'providerSlabs']: updatedSlabs
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data) {
          if (type === 'client') {
            setClientSlabs(response.data.clientSlabs);
          } else {
            setProviderSlabs(response.data.providerSlabs);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to delete slab');
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out";
  const buttonClasses = "inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed";
  const tableHeaderClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider";
  const tableCellClasses = "px-6 py-4 whitespace-nowrap text-sm text-gray-900";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Commission Slabs</h1>
        <p className="mt-2 text-sm text-gray-600">Manage commission rates for clients and providers</p>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!type ? (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Slab Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (onSlabsChange) {
                if (e.target.value === 'client') {
                  onSlabsChange(clientSlabs);
                } else if (e.target.value === 'provider') {
                  onSlabsChange(providerSlabs);
                }
              }
            }}
            className="block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Type</option>
            <option value="client">Client Slabs</option>
            <option value="provider">Provider Slabs</option>
          </select>
        </div>
      ) : type === 'client' ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition duration-150 ease-in-out hover:shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Client Slabs</h2>
            <p className="mt-1 text-sm text-gray-600">Commission rates for client transactions</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Amount</label>
                <input
                  type="number"
                  placeholder="Enter minimum amount"
                  value={newClientSlab.minAmount}
                  onChange={(e) => setNewClientSlab({ ...newClientSlab, minAmount: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Amount</label>
                <input
                  type="number"
                  placeholder="Enter maximum amount"
                  value={newClientSlab.maxAmount}
                  onChange={(e) => setNewClientSlab({ ...newClientSlab, maxAmount: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Commission %</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  placeholder="Enter commission percentage"
                  value={newClientSlab.commission}
                  onChange={(e) => handleCommissionChange(e, setNewClientSlab, newClientSlab)}
                  className={inputClasses}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-end space-x-2">
                  {editingSlab?.type === 'client' ? (
                    <>
                      <button
                        onClick={() => handleUpdateSlab('client', newClientSlab)}
                        disabled={loading}
                        className={buttonClasses}
                      >
                        Update Slab
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddSlab('client', newClientSlab)}
                      disabled={loading}
                      className={buttonClasses}
                    >
                      Add Slab
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className={tableHeaderClasses}>Min Amount</th>
                    <th scope="col" className={tableHeaderClasses}>Max Amount</th>
                    <th scope="col" className={tableHeaderClasses}>Commission %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientSlabs.map((slab) => (
                    <tr key={slab._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className={tableCellClasses}>₹{slab.minAmount.toLocaleString()}</td>
                      <td className={tableCellClasses}>₹{slab.maxAmount.toLocaleString()}</td>
                      <td className={tableCellClasses}>{slab.commission}%</td>
                      <td className={tableCellClasses}>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(slab, 'client')}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSlab(slab, 'client')}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden transition duration-150 ease-in-out hover:shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Provider Slabs</h2>
            <p className="mt-1 text-sm text-gray-600">Commission rates for provider transactions</p>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Min Amount</label>
                <input
                  type="number"
                  placeholder="Enter minimum amount"
                  value={newProviderSlab.minAmount}
                  onChange={(e) => setNewProviderSlab({ ...newProviderSlab, minAmount: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Amount</label>
                <input
                  type="number"
                  placeholder="Enter maximum amount"
                  value={newProviderSlab.maxAmount}
                  onChange={(e) => setNewProviderSlab({ ...newProviderSlab, maxAmount: e.target.value })}
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Commission %</label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  placeholder="Enter commission percentage"
                  value={newProviderSlab.commission}
                  onChange={(e) => handleCommissionChange(e, setNewProviderSlab, newProviderSlab)}
                  className={inputClasses}
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-end space-x-2">
                  {editingSlab?.type === 'provider' ? (
                    <>
                      <button
                        onClick={() => handleUpdateSlab('provider', newProviderSlab)}
                        disabled={loading}
                        className={buttonClasses}
                      >
                        Update Slab
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddSlab('provider', newProviderSlab)}
                      disabled={loading}
                      className={buttonClasses}
                    >
                      Add Slab
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className={tableHeaderClasses}>Min Amount</th>
                    <th scope="col" className={tableHeaderClasses}>Max Amount</th>
                    <th scope="col" className={tableHeaderClasses}>Commission %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providerSlabs.map((slab) => (
                    <tr key={slab._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className={tableCellClasses}>₹{slab.minAmount.toLocaleString()}</td>
                      <td className={tableCellClasses}>₹{slab.maxAmount.toLocaleString()}</td>
                      <td className={tableCellClasses}>{slab.commission}%</td>
                      <td className={tableCellClasses}>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(slab, 'provider')}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-150"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteSlab(slab, 'provider')}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
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
      )}

      {error && (
        <div className="mt-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slabs; 