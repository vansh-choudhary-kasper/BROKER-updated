import { useState, useEffect } from 'react';
import PapaParse from 'papaparse';
import axios from 'axios';
import { useData } from '../context/DataContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const StatementUpload = ({ onUpload }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [companySlabs, setCompanySlabs] = useState({});
  const [formError, setFormError] = useState(null);

  const {
    companies,
  } = useData();

  // Fetch company slabs when component mounts
  useEffect(() => {
    fetchCompanySlabs();
  }, []);

  const fetchCompanySlabs = async () => {
    try {
      const slabsMap = {};
      companies?.forEach(company => {
        slabsMap[company?.name] = company?.slabs || [];
      });
      setCompanySlabs(slabsMap);
    } catch (error) {
      console.error('Error fetching company slabs:', error);
    }
  };

  const formatSlabRange = (slab) => {
    if (slab?.maxAmount === 0) {
      return `Above ₹${(slab?.minAmount).toLocaleString('en-IN')}`;
    }
    return `₹${(slab?.minAmount).toLocaleString('en-IN')} - ₹${(slab?.maxAmount).toLocaleString('en-IN')}`;
  };

  const getApplicableSlabs = (companyName, amount) => {
    const slabs = companySlabs[companyName] || [];
    // Find the single applicable slab where amount falls within the range
    return slabs.find(slab => 
      amount >= slab?.minAmount && 
      (slab?.maxAmount === 0 || amount < slab?.maxAmount)
    );
  };

  const calculateCommission = (amount, slab) => {
    if (!slab) return 0;
    return (amount * slab?.commission) / 100;
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e?.target?.files?.[0] || null;
    if (!selectedFile) return;

    setFile(selectedFile);
    setError(null);
    setPreview(null);
    setFormError(null);

    try {
      // Check file size (limit to 5MB)
      if (selectedFile?.size > 5 * 1024 * 1024) {
        throw new Error('File size exceeds 5MB limit');
      }

      if (selectedFile?.name?.endsWith('.csv')) {
        // Handle CSV file
        PapaParse.parse(selectedFile, {
          complete: (results) => {
            try {
              // Check if file has headers
              if (results?.data?.length < 2) {
                throw new Error('CSV file must contain headers and at least one row of data');
              }

              // Validate headers
              const headers = results?.data?.[0];
              const requiredHeaders = ['date', 'company', 'bank', 'account', 'amount'];
              const headerCheck = requiredHeaders?.every(header => 
                headers?.some(h => h?.toLowerCase()?.includes(header?.toLowerCase()))
              );
              
              if (!headerCheck) {
                throw new Error('CSV file is missing required headers. Please ensure your file has date, company, bank, account, and amount columns.');
              }

              // Filter out empty rows and validate data
              const data = results?.data
                ?.slice(1)
                ?.filter(row => 
                  row?.length === headers?.length && // Ensure all columns are present
                  row?.every(cell => cell !== null && cell !== undefined && cell?.toString()?.trim() !== '')
                )
                ?.map(row => ({
                  date: row[0],
                  companyName: row[1],
                  bankName: row[2],
                  accountNo: row[3],
                  creditAmount: parseFloat(row[4])
                }))
                ?.filter(transaction => 
                  !isNaN(transaction?.creditAmount) && 
                  transaction?.creditAmount > 0
                );
              
              if (data?.length === 0) {
                throw new Error('No valid transactions found in the file');
              }
              
              // Check if companies exist in our system
              const unknownCompanies = data
                ?.map(t => t?.companyName)
                ?.filter((name, index, self) => self?.indexOf(name) === index) // Get unique company names
                ?.filter(name => !companySlabs[name]);
                
              if (unknownCompanies?.length > 0) {
                setFormError(`Warning: The following companies are not recognized: ${unknownCompanies?.join(', ')}`);
              }

              const slabNotDefined = data?.filter(transaction => {
                const applicableSlab = getApplicableSlabs(transaction?.companyName, transaction?.creditAmount);
                return !applicableSlab;
              })?.map(t => t?.companyName)
              ?.filter((name, index, self) => self?.indexOf(name) === index);

              if (slabNotDefined?.length > 0) {
                setFormError(`Warning: The following companies have no slabs defined: ${slabNotDefined?.join(', ')}`);
              } 
              
              processTransactions(data);
            } catch (error) {
              setError(error.message);
            }
          },
          error: (error) => {
            setError('Error parsing CSV file: ' + error.message);
          }
        });
      } else if (selectedFile?.name?.endsWith('.xml')) {
        // Handle XML file
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e?.target?.result, "text/xml");
            
            // Check for XML parsing errors
            const parseError = xmlDoc?.getElementsByTagName('parsererror');
            if (parseError?.length > 0) {
              throw new Error('Invalid XML format: ' + parseError[0]?.textContent);
            }
            
            const transactions = Array.from(xmlDoc?.getElementsByTagName('transaction'));
            
            if (transactions?.length === 0) {
              throw new Error('No transaction elements found in XML file');
            }
            
            const data = transactions
              ?.map(transaction => {
                const date = transaction?.getElementsByTagName('date')[0]?.textContent;
                const companyName = transaction?.getElementsByTagName('companyName')[0]?.textContent;
                const bankName = transaction?.getElementsByTagName('bankName')[0]?.textContent;
                const accountNo = transaction?.getElementsByTagName('accountNo')[0]?.textContent;
                const creditAmount = parseFloat(transaction?.getElementsByTagName('creditAmount')[0]?.textContent);

                // Only return transaction if all required fields are present and valid
                if (date && companyName && bankName && accountNo && !isNaN(creditAmount) && creditAmount > 0) {
                  return {
                    date,
                    companyName,
                    bankName,
                    accountNo,
                    creditAmount
                  };
                }
                return null;
              })
              ?.filter(transaction => transaction !== null); // Remove invalid transactions

            if (data?.length === 0) {
              throw new Error('No valid transactions found in the file');
            }

            // Check if companies exist in our system
            const unknownCompanies = data
              ?.map(t => t?.companyName)
              ?.filter((name, index, self) => self?.indexOf(name) === index) // Get unique company names
              ?.filter(name => !companySlabs[name]);
              
            if (unknownCompanies?.length > 0) {
              setFormError(`Warning: The following companies are not recognized: ${unknownCompanies?.join(', ')}`);
            }

            processTransactions(data);
          } catch (error) {
            setError('Error parsing XML file: ' + error.message);
          }
        };
        reader.onerror = () => {
          setError('Error reading XML file');
        };
        reader.readAsText(selectedFile);
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or XML file.');
      }
      setFormError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const processTransactions = (data) => {
    try {
      // Group transactions by company
      const companyTransactions = data?.reduce((acc, transaction) => {
        const company = transaction?.companyName?.trim();
        if (!company) return acc; // Skip transactions with empty company names

        if (!acc[company]) {
          acc[company] = {
            transactions: [],
            totalAmount: 0
          };
        }
        acc[company]?.transactions?.push(transaction);
        acc[company].totalAmount += Number(transaction?.creditAmount || 0);
        return acc;
      }, {});

      // Create preview data with slab information
      const previewData = Object.entries(companyTransactions)
        ?.filter(([company]) => company && company?.trim() !== '') // Filter out empty company names
        ?.map(([company, data]) => {
          const applicableSlab = getApplicableSlabs(company, data?.totalAmount);
          const commission = calculateCommission(data?.totalAmount, applicableSlab);
          
          return {
            companyName: company,
            transactionCount: data?.transactions?.length,
            totalAmount: data?.totalAmount,
            applicableSlab,
            commission
          };
        });

      if (previewData?.length === 0) {
        throw new Error('No valid company transactions found');
      }

      setPreview({
        file,
        data,
        summary: previewData
      });
    } catch (error) {
      setError('Error processing transactions: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDate) {
      setError('Please select a statement date');
      return;
    }

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!preview) {
      setError('Please wait for file processing to complete');
      return;
    }

    setLoading(true);
    try {
      await onUpload({
        date: selectedDate,
        fileData: preview
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="statementDate" className="block text-sm font-medium text-gray-700">
            Statement Month
          </label>
          <input
            type="month"
            id="statementDate"
            name="statementDate"
            value={selectedDate}
            onChange={handleDateChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Upload Statement
          </label>
          <input
            type="file"
            id="file"
            accept=".csv,.xml"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            required
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}
        {formError && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{formError}</h3>
              </div>  
            </div>
          </div>
        )}  

        {preview && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Preview</h3>
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transactions
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Applicable Slab
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Est. Commission
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {preview?.summary?.map((company, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {company?.companyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company?.transactionCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR'
                            }).format(company?.totalAmount)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {company?.applicableSlab ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {formatSlabRange(company?.applicableSlab)} @ {company?.applicableSlab?.commission}%
                              </span>
                            ) : (
                              <span className="text-yellow-600">No slabs defined</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR'
                            }).format(company?.commission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading || !selectedDate || !file || !preview}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white 
              ${loading || !selectedDate || !file || !preview || formError
                ? 'bg-indigo-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Upload Statement'
            )}
          </button>
        </div>
      </form>

      {/* File Format Guide */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">File Format Guide</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Format */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">CSV Format</h4>
            <div className="bg-white p-3 rounded border border-gray-300 overflow-x-auto">
              <pre className="text-sm text-gray-700 whitespace-pre">
{`date,companyName,bankName,accountNo,creditAmount
2024-03-20,Company A,HDFC Bank,1234567890,5000.00
2024-03-21,Company B,ICICI Bank,0987654321,2500.00`}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Required columns: date, companyName, bankName, accountNo, creditAmount
            </p>
          </div>
          
          {/* XML Format */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">XML Format</h4>
            <div className="bg-white p-3 rounded border border-gray-300 overflow-x-auto">
              <pre className="text-sm text-gray-700 whitespace-pre">
{`<?xml version="1.0" encoding="UTF-8"?>
<transactions>
  <transaction>
    <date>2024-03-20</date>
    <companyName>Company A</companyName>
    <bankName>HDFC Bank</bankName>
    <accountNo>1234567890</accountNo>
    <creditAmount>5000.00</creditAmount>
  </transaction>
</transactions>`}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Required tags: date, companyName, bankName, accountNo, creditAmount
            </p>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Important Notes:</span>
            <ul className="list-disc ml-4 mt-1">
              <li>All transactions are processed as credit transactions</li>
              <li>Company names must match exactly with registered companies</li>
              <li>Dates should be in YYYY-MM-DD format</li>
              <li>Amount should be a positive number</li>
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatementUpload;