import React, { useState } from 'react';

const BankDetailsForm = ({ bankDetails, onChange, onFileChange, onAdd, onRemove, onCustomFieldChange }) => {
  const [newCustomField, setNewCustomField] = useState({ name: '', value: '' });

  const handleAddCustomField = (bankIndex) => {
    if (newCustomField.name && newCustomField.value) {
      if (!bankDetails[bankIndex]) return;
      const updatedBank = { ...bankDetails[bankIndex] };
      updatedBank.customFields = {
        ...updatedBank.customFields,
        [newCustomField.name]: newCustomField.value
      };
      onChange(bankIndex, 'customFields', updatedBank.customFields);
      setNewCustomField({ name: '', value: '' });
    }
  };

  const handleRemoveCustomField = (bankIndex, fieldName) => {
    const updatedBank = { ...bankDetails[bankIndex] };
    delete updatedBank.customFields[fieldName];
    onChange(bankIndex, 'customFields', updatedBank.customFields);
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Bank Details</h3>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Bank Account
        </button>
      </div>

      {bankDetails.map((bank, index) => (
        <div key={index} className="mb-6 p-4 border border-gray-200 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-md font-medium text-gray-800">Bank Account #{index + 1}</h4>
            {index > 0 && (
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor={`bankDetails.${index}.accountNumber`} className="block text-sm font-medium text-gray-700">
                Account Number *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.accountNumber`}
                name={`bankDetails.${index}.accountNumber`}
                value={bank.accountNumber}
                onChange={(e) => onChange(index, 'accountNumber', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.ifscCode`} className="block text-sm font-medium text-gray-700">
                IFSC Code *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.ifscCode`}
                name={`bankDetails.${index}.ifscCode`}
                value={bank.ifscCode}
                onChange={(e) => onChange(index, 'ifscCode', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.bankName`} className="block text-sm font-medium text-gray-700">
                Bank Name *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.bankName`}
                name={`bankDetails.${index}.bankName`}
                value={bank.bankName}
                onChange={(e) => onChange(index, 'bankName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.branchName`} className="block text-sm font-medium text-gray-700">
                Branch Name *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.branchName`}
                name={`bankDetails.${index}.branchName`}
                value={bank.branchName}
                onChange={(e) => onChange(index, 'branchName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.accountType`} className="block text-sm font-medium text-gray-700">
                Account Type *
              </label>
              <select
                id={`bankDetails.${index}.accountType`}
                name={`bankDetails.${index}.accountType`}
                value={bank.accountType}
                onChange={(e) => onChange(index, 'accountType', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="">Select Account Type</option>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
                <option value="fixed_deposit">Fixed Deposit</option>
              </select>
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.accountHolderName`} className="block text-sm font-medium text-gray-700">
                Account Holder Name *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.accountHolderName`}
                name={`bankDetails.${index}.accountHolderName`}
                value={bank.accountHolderName}
                onChange={(e) => onChange(index, 'accountHolderName', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.accountHolderPan`} className="block text-sm font-medium text-gray-700">
                Account Holder PAN *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.accountHolderPan`}
                name={`bankDetails.${index}.accountHolderPan`}
                value={bank.accountHolderPan}
                onChange={(e) => onChange(index, 'accountHolderPan', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label htmlFor={`bankDetails.${index}.accountHolderAadhar`} className="block text-sm font-medium text-gray-700">
                Account Holder Aadhar *
              </label>
              <input
                type="text"
                id={`bankDetails.${index}.accountHolderAadhar`}
                name={`bankDetails.${index}.accountHolderAadhar`}
                value={bank.accountHolderAadhar}
                onChange={(e) => onChange(index, 'accountHolderAadhar', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
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
                  onClick={() => handleAddCustomField(index)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Custom Field
                </button>
              </div>
            </div>

            {/* Display Custom Fields */}
            {bank?.customFields && Object.entries(bank?.customFields || {}).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(bank.customFields).map(([fieldName, fieldValue]) => (
                  <div key={fieldName} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="font-medium">{fieldName}:</span>
                    <span>{fieldValue}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(index, fieldName)}
                      className="ml-auto text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BankDetailsForm; 