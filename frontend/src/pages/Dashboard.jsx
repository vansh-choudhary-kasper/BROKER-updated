import { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Dashboard = () => {
  const {
    companies,
    banks,
    expenses,
    loading,
    error,
    fetchCompanies,
    fetchBanks,
    fetchExpenses,
  } = useData();

  const { token } = useAuth();

  // New state for profit and loss data
  const [profitLossData, setProfitLossData] = useState({
    monthly: [],
    yearly: [],
    currentMonth: 0,
    lastMonth: 0,
    currentYear: 0,
    lastYear: 0,
    loading: true,
    error: null
  });

  // Check if any data is still loading
  const isLoading = loading.companies || loading.banks || loading.expenses || profitLossData.loading;

  // Check if there are any errors
  const hasError = error.companies || error.banks || error.expenses || profitLossData.error;

  // Calculate statistics with null checks
  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    : 0;

  // Fetch profit and loss data
  useEffect(() => {
    const fetchProfitLossData = async () => {
      try {
        setProfitLossData(prev => ({ ...prev, loading: true, error: null }));

        const response = await axios.get(`${backendUrl}/api/dashboard/profit-loss`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.success) {
          setProfitLossData({
            monthly: response.data.monthly || [],
            yearly: response.data.yearly || [],
            currentMonth: response.data.currentMonth || 0,
            lastMonth: response.data.lastMonth || 0,
            currentYear: response.data.currentYear || 0,
            lastYear: response.data.lastYear || 0,
            loading: false,
            error: null
          });
        } else {
          throw new Error('Failed to fetch profit and loss data');
        }
      } catch (err) {
        console.error('Error fetching profit and loss data:', err);
        setProfitLossData(prev => ({
          ...prev,
          loading: false,
          error: err.message || 'Failed to fetch profit and loss data'
        }));
      }
    };

    fetchProfitLossData();
  }, [token]);

  // Calculate profit growth percentages
  const monthlyGrowth = profitLossData.lastMonth > 0
    ? ((profitLossData.currentMonth - profitLossData.lastMonth) / profitLossData.lastMonth) * 100
    : 0;

  const yearlyGrowth = profitLossData.lastYear > 0
    ? ((profitLossData.currentYear - profitLossData.lastYear) / profitLossData.lastYear) * 100
    : 0;

  const expenseCategories = Array.isArray(expenses)
    ? expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + (expense.amount || 0);
      return acc;
    }, {})
    : {};

  const expenseCategoryData = Object.entries(expenseCategories).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
    value
  }));

  let unorderedCompanyTypes = Array.isArray(companies)
    ? companies.reduce((acc, company) => {
      acc[company.type] = (acc[company.type] || 0) + 1;
      return acc;
    }, {})
    : {};

  // Desired order
  const typeOrder = ['provider', 'client', 'both'];

  // Reordering companyTypes based on the specified typeOrder
  const companyTypes = {};
  typeOrder.forEach((type) => {
    if (unorderedCompanyTypes[type]) {
      companyTypes[type] = unorderedCompanyTypes[type];
    }
  });

  const companyTypeData = Object.entries(companyTypes).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Get recent bank transactions
  const recentTransactions = Array.isArray(banks)
    ? banks
      .flatMap(bank => {
        // Check if bank has transactions property
        if (!bank.transactions) return [];

        return bank.transactions.map(transaction => ({
          ...transaction,
          bankName: bank.bankName,
          accountName: bank.accountName
        }));
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
    : [];

  // Get recent activities (only expenses)
  const recentActivities = Array.isArray(expenses)
    ? expenses
      .map((expense) => ({
        ...expense,
        type: 'expense',
        date: new Date(expense.date || expense.createdAt || expense.created_at || new Date()),
      }))
      .sort((a, b) => b.date - a.date)
      .slice(0, 5)
    : [];

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  const PROFIT_COLOR = '#10B981'; // Green
  const LOSS_COLOR = '#EF4444'; // Red

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-200 rounded h-24"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-gray-200 rounded h-64"></div>
        ))}
      </div>
      <div className="bg-gray-200 rounded h-48 mb-6"></div>
      <div className="bg-gray-200 rounded h-48"></div>
    </div>
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (hasError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="card p-6 bg-red-50 border border-red-200">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Data</h2>
          <p className="text-red-600">
            {error.companies && <div>Companies: {error.companies}</div>}
            {error.banks && <div>Banks: {error.banks}</div>}
            {error.expenses && <div>Expenses: {error.expenses}</div>}
            {profitLossData.error && <div>Profit & Loss: {profitLossData.error}</div>}
          </p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              fetchCompanies();
              fetchBanks();
              fetchExpenses();
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

      {/* Profit & Loss Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Current Month Profit</h3>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">₹{profitLossData.currentMonth.toLocaleString()}</p>
            <div className={`flex items-center ${monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span className="text-sm font-medium">
                {monthlyGrowth >= 0 ? '+' : ''}{monthlyGrowth.toFixed(1)}%
              </span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {monthlyGrowth >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">vs. Last Month: ₹{profitLossData.lastMonth.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Current Year Profit</h3>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">₹{profitLossData.currentYear.toLocaleString()}</p>
            <div className={`flex items-center ${yearlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <span className="text-sm font-medium">
                {yearlyGrowth >= 0 ? '+' : ''}{yearlyGrowth.toFixed(1)}%
              </span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {yearlyGrowth >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                )}
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">vs. Last Year: ₹{profitLossData.lastYear.toLocaleString()}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Total Companies</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{Array.isArray(companies) ? companies.length : 0}</p>
        </div>
      </div>

      {/* Profit & Loss Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Monthly Profit Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Profit Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={profitLossData.monthly}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke={PROFIT_COLOR}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Yearly Profit Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Yearly Profit Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={profitLossData.yearly}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="currentYear" name="Current Year" fill={PROFIT_COLOR} />
                <Bar dataKey="lastYear" name="Last Year" fill="#93C5FD" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Expense Categories Chart */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Types Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Types</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={companyTypeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Companies" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activities and Bank Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Expenses</h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((expense, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {`Expense: ${expense.description}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {`₹${expense.amount.toLocaleString()}`} • {expense.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent expenses</p>
          )}
        </div>

        {/* Recent Bank Transactions */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Bank Transactions</h3>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.bankName} - {transaction.accountName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {`₹${transaction.amount.toLocaleString()}`} • {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent transactions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 