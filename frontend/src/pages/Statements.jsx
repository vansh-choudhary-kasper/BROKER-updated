import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PapaParse from 'papaparse';
import StatementUpload from '../components/StatementUpload';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Statements = () => {
  const { token, checkAuth } = useAuth();
  const [statements, setStatements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [companyStatements, setCompanyStatements] = useState({});
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  useEffect(() => {
    fetchStatements();
  }, []);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${backendUrl}/api/statements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // The response.data now contains the user's statementHistory
      setStatements(response.data);
      
      // Group statements by company
      const groupedByCompany = response.data.reduce((groups, statement) => {
        statement?.companySummaries?.forEach(summary => {
          if(!summary?.company?._id) return;

          const companyId = summary?.company?._id;
          if (!groups[companyId]) {
            groups[companyId] = {
              companyName: summary?.company?.name || 'Unknown Company',
              statements: []
            };
          }
          groups[companyId]?.statements?.push({
            date: statement?.uploadDate,
            totalAmount: summary?.totalAmount,
            commission: summary?.commission,
            applicableSlab: summary?.applicableSlab // Updated to use single slab
          });
        });
        return groups;
      }, {});

      setCompanyStatements(groupedByCompany);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch statements');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (uploadData) => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      const response = await axios.post(
        `${backendUrl}/api/statements/upload`,
        {
          transactions: uploadData?.fileData?.data,
          fileType: uploadData?.fileData?.file?.name?.split('.')?.pop()?.toLowerCase() || 'csv',
          fileName: uploadData?.fileData?.file?.name || 'statement.csv',
          statementDate: uploadData?.date
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      // Only close the modal and refresh if the upload was successful
      if (response.data) {
        setShowUpload(false);
        // Add a small delay before fetching to ensure the backend has completed processing
        setTimeout(() => {
          fetchStatements();
          checkAuth();
        }, 500);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload statement';
      setError(errorMessage);
      // Don't close the modal if there's an error
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) return 'Invalid Date';
      
      return parsedDate.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatSlabRange = (slab) => {
    if (slab?.maxAmount === 0) {
      return `Above ₹${(slab?.minAmount).toLocaleString('en-IN')}`;
    }
    return `₹${(slab?.minAmount).toLocaleString('en-IN')} - ₹${(slab?.maxAmount).toLocaleString('en-IN')}`;
  };

  const handleViewDetails = async (statement, companyId = null) => {
    try {
      setSelectedStatement(statement);
      setSelectedCompanyId(companyId);
      setShowDetailsModal(true);
    } catch (error) {
      setError('Failed to load statement details');
    }
  };

  // Filter transactions for selected company
  const getCompanyTransactions = (transactions, companyName) => {
    return transactions?.filter(t => t?.companyName === companyName);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Statements</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Upload New Statement
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Upload Section */}
      {showUpload && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Upload New Statement</h2>
              <button
                onClick={() => setShowUpload(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <StatementUpload onUpload={handleUpload} />
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedStatement && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-4/5 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {selectedCompanyId 
                  ? `${selectedStatement?.companySummaries?.find(s => s?.company?._id === selectedCompanyId)?.company?.name} - Statement Details`
                  : 'Statement Details'
                }
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedStatement(null);
                  setSelectedCompanyId(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Statement Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Statement Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">File Name</p>
                    <p className="text-base font-medium">{selectedStatement.fileName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Upload Date</p>
                    <p className="text-base font-medium">{formatDate(selectedStatement.uploadDate)}</p>
                  </div>
                  {selectedCompanyId ? (
                    <>
                      {selectedStatement?.companySummaries
                        ?.filter(summary => summary?.company?._id === selectedCompanyId)
                        ?.map(summary => (
                          <React.Fragment key={summary?.company?._id}>
                            <div>
                              <p className="text-sm text-gray-500">Total Amount</p>
                              <p className="text-base font-medium">{formatCurrency(summary?.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Commission</p>
                              <p className="text-base font-medium">{formatCurrency(summary?.commission)}</p>
                            </div>
                          </React.Fragment>
                        ))
                      }
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-sm text-gray-500">Total Amount</p>
                        <p className="text-base font-medium">{formatCurrency(selectedStatement?.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Commission</p>
                        <p className="text-base font-medium">{formatCurrency(selectedStatement?.totalCommission)}</p>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedStatement?.status === 'processed' 
                        ? 'bg-green-100 text-green-800'
                        : selectedStatement?.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedStatement?.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Company-wise Details */}
              {!selectedCompanyId && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="px-4 py-5 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Company-wise Details</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Commission
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applied Slab
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedStatement?.companySummaries?.map((summary, idx) => (
                          <tr key={idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {summary?.company?.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(summary?.totalAmount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatCurrency(summary?.commission)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {summary?.applicableSlab && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {formatSlabRange(summary?.applicableSlab)} @ {summary?.applicableSlab?.commission}%
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Original Transactions */}
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Original Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        {!selectedCompanyId && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bank Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Account No.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(selectedCompanyId 
                        ? selectedStatement?.originalTransactions?.filter(t => {
                            const companySummary = selectedStatement?.companySummaries?.find(s => s?.company?._id === selectedCompanyId);
                            return t?.companyName === companySummary?.company?.name;
                          })
                        : selectedStatement?.originalTransactions
                      ).map((transaction, idx) => (
                        <tr key={idx}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {transaction?.date}
                          </td>
                          {!selectedCompanyId && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction?.companyName}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction?.bankName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {transaction?.accountNo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(transaction?.creditAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Options */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    const transactions = selectedCompanyId 
                      ? selectedStatement?.originalTransactions?.filter(t => {
                          const companySummary = selectedStatement?.companySummaries?.find(s => s?.company?._id === selectedCompanyId);
                          return t?.companyName === companySummary?.company?.name;
                        })
                      : selectedStatement?.originalTransactions;

                    const csvContent = "data:text/csv;charset=utf-8," + 
                      (selectedCompanyId 
                        ? "Date,Bank Name,Account No,Amount\n" +
                          transactions?.map(t => 
                            `${t?.date},${t?.bankName},${t?.accountNo},${t?.creditAmount}`
                          ).join("\n")
                        : "Date,Company,Bank Name,Account No,Amount\n" +
                          transactions?.map(t => 
                            `${t?.date},${t?.companyName},${t?.bankName},${t?.accountNo},${t?.creditAmount}`
                          ).join("\n")
                      );
                    
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `${selectedStatement?.fileName}_${selectedCompanyId ? 'company_' : ''}export.csv`);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Export as CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company-wise Sections */}
      {Object.entries(companyStatements).map(([companyId, company]) => (
        <div key={companyId} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">{company?.companyName}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commission Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied Slab
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {company?.statements?.map((statement, index) => {
                  const fullStatement = statements?.find(s => 
                    s?.uploadDate === statement?.date && 
                    s?.companySummaries?.some(summary => 
                      summary?.company?._id === companyId && 
                      summary?.totalAmount === statement?.totalAmount
                    )
                  );
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(statement?.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(statement?.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatCurrency(statement?.commission)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {statement?.applicableSlab && (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {formatSlabRange(statement?.applicableSlab)} @ {statement?.applicableSlab?.commission}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => fullStatement && handleViewDetails(fullStatement, companyId)}
                          className="text-indigo-600 hover:text-indigo-900"
                          disabled={!fullStatement}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Statement History */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Statement History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Companies & Slabs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statements?.map((statement) => (
                <tr key={statement?._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {statement?.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(statement?.uploadDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(statement?.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatCurrency(statement?.totalCommission)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      statement?.status === 'processed' 
                        ? 'bg-green-100 text-green-800'
                        : statement?.status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {statement?.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {statement?.companySummaries?.map((summary, idx) => (
                      <div key={idx} className="mb-2">
                        <div className="font-medium text-gray-900">{summary?.company?.name}</div>
                        <div className="mt-1">
                          {summary?.applicableSlab && (
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatSlabRange(summary?.applicableSlab)} @ {summary?.applicableSlab?.commission}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleViewDetails(statement)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      View Details
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

export default Statements; 