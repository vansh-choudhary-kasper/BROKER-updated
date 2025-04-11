import { useEffect } from 'react';
import { useData } from '../context/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const Dashboard = () => {
  const {
    companies,
    tasks,
    banks,
    expenses,
    loading,
    error,
    fetchCompanies,
    fetchTasks,
    fetchBanks,
    fetchExpenses,
  } = useData();
  console.log("companies", companies , "tasks", tasks, "banks", banks, "expenses", expenses);

  // Check if any data is still loading
  const isLoading = loading.companies || loading.tasks || loading.banks || loading.expenses;
  
  // Check if there are any errors
  const hasError = error.companies || error.tasks || error.banks || error.expenses;

  // Calculate statistics with null checks
  const totalExpenses = Array.isArray(expenses) 
    ? expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0) 
    : 0;
  
  const pendingTasks = Array.isArray(tasks) 
    ? tasks.filter((task) => task.status === 'pending').length 
    : 0;
  
  const inProgressTasks = Array.isArray(tasks) 
    ? tasks.filter((task) => task.status === 'in_progress').length 
    : 0;
  
  const completedTasks = Array.isArray(tasks) 
    ? tasks.filter((task) => task.status === 'completed').length 
    : 0;
  
  const cancelledTasks = Array.isArray(tasks) 
    ? tasks.filter((task) => task.status === 'cancelled').length 
    : 0;
  
  const disputedTasks = Array.isArray(tasks) 
    ? tasks.filter((task) => task.status === 'disputed').length 
    : 0;

  // Prepare data for charts
  const taskStatusData = [
    { name: 'Pending', value: pendingTasks },
    { name: 'In Progress', value: inProgressTasks },
    { name: 'Completed', value: completedTasks },
    { name: 'Cancelled', value: cancelledTasks },
    { name: 'Disputed', value: disputedTasks }
  ];

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

  const companyTypes = Array.isArray(companies) 
    ? companies.reduce((acc, company) => {
        acc[company.type] = (acc[company.type] || 0) + 1;
        return acc;
      }, {})
    : {};

  const companyTypeData = Object.entries(companyTypes).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  // Get upcoming task deadlines (next 7 days)
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const upcomingTasks = Array.isArray(tasks) 
    ? tasks
        .filter(task => {
          // Check if task has a dueDate property
          const dueDate = task.dueDate || (task.timeline && task.timeline.endDate);
          if (!dueDate) return false;
          
          const endDate = new Date(dueDate);
          return endDate >= today && endDate <= nextWeek && task.status !== 'completed' && task.status !== 'cancelled';
        })
        .sort((a, b) => {
          const dateA = new Date(a.dueDate || (a.timeline && a.timeline.endDate));
          const dateB = new Date(b.dueDate || (b.timeline && b.timeline.endDate));
          return dateA - dateB;
        })
        .slice(0, 5)
    : [];

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

  // Get recent activities
  const recentActivities = [
    ...(Array.isArray(tasks) ? tasks.map((task) => ({
      ...task,
      type: 'task',
      date: new Date(task.createdAt || task.created_at || new Date()),
    })) : []),
    ...(Array.isArray(expenses) ? expenses.map((expense) => ({
      ...expense,
      type: 'expense',
      date: new Date(expense.date || expense.createdAt || expense.created_at || new Date()),
    })) : []),
  ]
    .sort((a, b) => b.date - a.date)
    .slice(0, 5);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-200 rounded h-24"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[1, 2, 3, 4].map((i) => (
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
            {error.tasks && <div>Tasks: {error.tasks}</div>}
            {error.banks && <div>Banks: {error.banks}</div>}
            {error.expenses && <div>Expenses: {error.expenses}</div>}
          </p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              fetchCompanies();
              fetchTasks();
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

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-title">Total Companies</div>
          <div className="stat-value">{Array.isArray(companies) ? companies.length : 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Total Expenses</div>
          <div className="stat-value">₹{totalExpenses.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Pending Tasks</div>
          <div className="stat-value">{pendingTasks}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">In Progress Tasks</div>
          <div className="stat-value">{inProgressTasks}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Task Status Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Task Status Distribution</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {taskStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Categories Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Expense Categories</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={expenseCategoryData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Amount (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Company Types Chart */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Company Types</h2>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={companyTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {companyTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Upcoming Task Deadlines</h2>
          </div>
          <div className="space-y-4">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-content">
                    <div className="task-title">{task.title}</div>
                    <div className="task-details">
                      Status: {task.status.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="task-deadline">
                    Due: {new Date(task.timeline.endDate).toLocaleDateString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No upcoming task deadlines</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Bank Transactions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Bank Transactions</h2>
        </div>
        <div className="space-y-4">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((transaction, index) => (
              <div key={index} className="transaction-item">
                <div className="transaction-content">
                  <div className="transaction-title">
                    {transaction.bankName} - {transaction.accountName}
                  </div>
                  <div className="transaction-details">
                    {transaction.description || `${transaction.type} transaction`}
                  </div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  <div className="text-gray-500 text-right text-sm">
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">No recent transactions</div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Activities</h2>
        </div>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={`${activity.type}-${activity._id || activity.id}`} className="activity-item">
              <div className="activity-content">
                <div className="activity-title">
                  {activity.type === 'task' ? activity.title : 'Expense'}
                </div>
                <div className="activity-details">
                  {activity.type === 'task' ? (
                    <>
                      Status: {activity.status.replace('_', ' ')}
                      {activity.clientCompany && (
                        <span className="ml-2">
                          Client: {typeof activity.clientCompany === 'object' 
                            ? activity.clientCompany.name 
                            : 'Loading...'}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      Amount: ₹{activity.amount.toLocaleString()}
                      {activity.category && (
                        <span className="ml-2">
                          Category: {activity.category.replace('_', ' ')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="activity-date">
                {activity.date.toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 