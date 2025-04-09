import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

const Tasks = () => {
  const {
    tasks,
    companies,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    fetchCompanies,
  } = useData();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
    companyId: '',
    taskNumber: '',
  });
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    fetchTasks();
    fetchCompanies();
  }, [fetchTasks, fetchCompanies]);

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
      if (editingTask) {
        await updateTask(editingTask.id, formData);
      } else {
        await createTask(formData);
      }
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        dueDate: '',
        companyId: '',
        taskNumber: '',
      });
      setEditingTask(null);
    } catch (err) {
      console.error('Failed to save task:', err);
      if (err.includes('Authentication error')) {
        alert('Your session may have expired. Please try logging in again.');
      } else {
        alert(`Failed to save task: ${err}`);
      }
    }
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      companyId: task.companyId,
      taskNumber: task.taskNumber,
    });
    setEditingTask(task);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert(`Failed to delete task: ${err}`);
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'in_progress':
        return 'badge-info';
      case 'completed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      case 'disputed':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'badge-danger';
      case 'medium':
        return 'badge-warning';
      default:
        return 'badge-success';
    }
  };

  // Check if tasks is an array before rendering
  const tasksList = Array.isArray(tasks) ? tasks : [];
  
  // Check if companies is an array before rendering
  const companiesList = Array.isArray(companies) ? companies : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>

      {error && (
        <div className="error-message" role="alert">
          {typeof error === 'string' ? error : 'An error occurred'}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Task Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter task title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter task description"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="status" className="form-label">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="priority" className="form-label">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyId" className="form-label">
              Company Name
            </label>
            <select
              id="companyId"
              name="companyId"
              value={formData.companyId}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a company</option>
              {companiesList.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="taskNumber" className="form-label">
              Task Number
            </label>
            <input
              type="text"
              id="taskNumber"
              name="taskNumber"
              value={formData.taskNumber}
              onChange={handleChange}
              className="form-input"
              required
              placeholder="Enter task number"
            />
          </div>

          <div className="flex justify-end space-x-3">
            {editingTask && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    title: '',
                    description: '',
                    status: 'pending',
                    priority: 'medium',
                    dueDate: '',
                    companyId: '',
                    taskNumber: '',
                  });
                  setEditingTask(null);
                }}
                className="btn btn-outline"
              >
                Cancel
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              {editingTask ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Task List</h2>
        </div>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Task Number</th>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasksList.map((task) => (
                <tr key={task.id}>
                  <td>{task.taskNumber}</td>
                  <td>{task.title}</td>
                  <td>{task.description}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>{new Date(task.dueDate).toLocaleDateString()}</td>
                  <td>
                    {companiesList.find(c => c._id === task.companyId)?.name || 'Unknown'}
                  </td>
                  <td>
                    <button
                      onClick={() => handleEdit(task)}
                      className="btn btn-sm btn-outline mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="btn btn-sm btn-danger"
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

export default Tasks; 