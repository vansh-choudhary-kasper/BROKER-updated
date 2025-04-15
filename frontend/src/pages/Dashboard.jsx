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

    // Add view type state
  const [viewType, setViewType] = useState('monthly');
  const [accountFilter, setAccountFilter] = useState('all');
  const [expenseViewType, setExpenseViewType] = useState('monthly');
  const [dashboardStats, setDashboardStats] = useState({
    totalCompanies: 0,
    totalAccounts: 0,
    monthlyExpenses: {
      total: 0,
      categories: {}
    },
    yearlyExpenses: {
      total: 0,
      categories: {}
    },
    loading: true,
    error: null
  });

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

  // Combined data fetching
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchAllData = async () => {
      try {

        // Fetch dashboard statistics
        const statsResponse = await axios.get(`${backendUrl}/api/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });

        // Fetch profit and loss data
        const profitLossResponse = await axios.get(`${backendUrl}/api/dashboard/profit-loss`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });

        if (isMounted) {
          if (statsResponse.data?.success) {
            setDashboardStats({
              totalCompanies: statsResponse.data.totalCompanies || 0,
              totalAccounts: statsResponse.data.totalAccounts || 0,
              monthlyExpenses: statsResponse.data.monthlyExpenses || { total: 0, categories: {} },
              yearlyExpenses: statsResponse.data.yearlyExpenses || { total: 0, categories: {} },
              loading: false,
              error: null
            });
          }

          if (profitLossResponse.data?.success) {
            setProfitLossData({
              monthly: profitLossResponse.data.monthly || [],
              yearly: profitLossResponse.data.yearly || [],
              currentMonth: profitLossResponse.data.currentMonth || 0,
              lastMonth: profitLossResponse.data.lastMonth || 0,
              currentYear: profitLossResponse.data.currentYear || 0,
              lastYear: profitLossResponse.data.lastYear || 0,
              loading: false,
              error: null
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching dashboard data:', err);
          setDashboardStats(prev => ({
            ...prev,
            loading: false,
            error: err.message || 'Failed to fetch dashboard statistics'
          }));
          setProfitLossData(prev => ({
            ...prev,
            loading: false,
            error: err.message || 'Failed to fetch profit and loss data'
          }));
        }
      }
    };

    fetchAllData();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [token, fetchCompanies, fetchBanks, fetchExpenses]);

  // Calculate account statistics
  const accountStats = Array.isArray(banks) ? banks.reduce((acc, bank) => {
    const status = bank.status?.toLowerCase() || 'active';
    if (!acc[status]) {
      acc[status] = 0;
    }
    acc[status]++;
    acc.total++;
    return acc;
  }, { total: 0, active: 0, inactive: 0, blacklisted: 0 }) : { total: 0, active: 0, inactive: 0, blacklisted: 0 };

  // Check if any data is still loading
  const isLoading = loading.companies || loading.banks || loading.expenses || profitLossData.loading || dashboardStats.loading;

  // Check if there are any errors
  const hasError = error.companies || error.banks || error.expenses || profitLossData.error || dashboardStats.error;

  // Calculate statistics with null checks
  const totalExpenses = Array.isArray(expenses)
    ? expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    : 0;

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
  const typeOrder = ['provider', 'client', 'both', 'blacklisted'];

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
            {dashboardStats.error && <div>Dashboard Stats: {dashboardStats.error}</div>}
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
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">
              {viewType === 'monthly' ? 'Current Month Profit' : 'Current Year Profit'}
            </h3>
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-bold text-gray-900">
              ₹{viewType === 'monthly' ? profitLossData.currentMonth.toLocaleString() : profitLossData.currentYear.toLocaleString()}
            </p>
            <div className={`flex items-center ${viewType === 'monthly' ? (monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500') : (yearlyGrowth >= 0 ? 'text-green-500' : 'text-red-500')}`}>
              <span className="text-sm font-medium">
                {viewType === 'monthly' ? (monthlyGrowth >= 0 ? '+' : '') : (yearlyGrowth >= 0 ? '+' : '')}
                {viewType === 'monthly' ? monthlyGrowth.toFixed(1) : yearlyGrowth.toFixed(1)}%
              </span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {viewType === 'monthly' ? (
                  monthlyGrowth >= 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  )
                ) : (
                  yearlyGrowth >= 0 ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  )
                )}
              </svg>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            vs. {viewType === 'monthly' ? 'Last Month' : 'Last Year'}: ₹{viewType === 'monthly' ? profitLossData.lastMonth.toLocaleString() : profitLossData.lastYear.toLocaleString()}
          </p>
        </div>

        {/* Accounts Stats */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-500">Accounts</h3>
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-gray-900">
              {accountFilter === 'all' 
                ? dashboardStats.totalAccounts 
                : accountStats[accountFilter] || 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accountFilter === 'all' 
                ? 'Total Accounts' 
                : `${accountFilter.charAt(0).toUpperCase() + accountFilter.slice(1)} Accounts`}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-500">Total Companies</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">{dashboardStats.totalCompanies}</p>
        </div>
      </div>

      {/* Profit & Loss Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Profit Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {viewType === 'monthly' ? 'Monthly Profit Trend' : 'Yearly Profit Trend'}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={viewType === 'monthly' ? profitLossData.monthly : profitLossData.yearly}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={viewType === 'monthly' ? 'month' : 'year'} 
                  tickFormatter={(value) => viewType === 'monthly' ? value : `${value}`}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => `₹${value.toLocaleString()}`}
                  labelFormatter={(label) => viewType === 'monthly' ? `Month: ${label}` : `Year: ${label}`}
                />
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

        {/* Expense Categories Chart */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Expense Categories</h3>
            <div className="flex items-center gap-2">
              <select
                value={expenseViewType}
                onChange={(e) => setExpenseViewType(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
              <div className="text-sm font-medium text-gray-600">
                Total: ₹{expenseViewType === 'monthly' 
                  ? dashboardStats.monthlyExpenses.total.toLocaleString() 
                  : dashboardStats.yearlyExpenses.total.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(expenseViewType === 'monthly' 
                    ? dashboardStats.monthlyExpenses.categories 
                    : dashboardStats.yearlyExpenses.categories).map(([name, value]) => ({
                    name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
                    value
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {Object.entries(expenseViewType === 'monthly' 
                    ? dashboardStats.monthlyExpenses.categories 
                    : dashboardStats.yearlyExpenses.categories).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Company Types Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {typeOrder.map((type) => {
          const count = companyTypes[type] || 0;
          const typeName = type.charAt(0).toUpperCase() + type.slice(1);
          const bgColor = {
            provider: 'bg-blue-50',
            client: 'bg-green-50',
            both: 'bg-purple-50',
            blacklisted: 'bg-red-50'
          }[type];
          const textColor = {
            provider: 'text-blue-600',
            client: 'text-green-600',
            both: 'text-purple-600',
            blacklisted: 'text-red-600'
          }[type];
          const borderColor = {
            provider: 'border-blue-500',
            client: 'border-green-500',
            both: 'border-purple-500',
            blacklisted: 'border-red-500'
          }[type];

          return (
            <div
              key={type}
              className={`bg-white rounded-lg shadow p-4 border-l-4 ${borderColor} cursor-pointer hover:shadow-md transition-shadow duration-200`}
              onClick={() => window.location.href = `/companies?type=${type}`}
            >
              <h3 className="text-sm font-medium text-gray-500">{typeName} Companies</h3>
              <p className="text-2xl font-bold mt-2">{count}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Activities Section */}
      <div className="mt-6">
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
      </div>
    </div>
  );
};

export default Dashboard; 