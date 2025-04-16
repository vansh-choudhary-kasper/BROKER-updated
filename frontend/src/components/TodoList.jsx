import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'high',
    status: 'pending',
    tags: []
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { token } = useAuth();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/todos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sortedTodos = response.data.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const statusOrder = { pending: 0, in_progress: 1, completed: 2 };

        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return statusOrder[a.status] - statusOrder[b.status];
      });
      setTodos(sortedTodos);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch todos');
      setLoading(false);
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    try {
      const todoData = {
        ...newTodo,
        status: 'pending'
      };

      const response = await axios.post(`${backendUrl}/api/todos`, todoData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setShowAddForm(false);
        setNewTodo({
          title: '',
          description: '',
          dueDate: '',
          priority: 'high',
          status: 'pending',
          tags: []
        });
        fetchTodos();
      } else {
        setError(response.data.message || 'Failed to add todo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add todo');
    }
  };

  const handleUpdateTodo = async (id, updates) => {
    try {
      const response = await axios.put(`${backendUrl}/api/todos/${id}`, updates, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        fetchTodos();
      } else {
        setError(response.data.message || 'Failed to update todo');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update todo');
      fetchTodos();
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await axios.delete(`${backendUrl}/api/todos/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTodos();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  const handleToggleStatus = async (todo) => {
    try {
      const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
      await handleUpdateTodo(todo._id, {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (err) {
      setError('Failed to update todo status');
    }
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTag.trim()) {
      setNewTodo(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewTodo(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTagColor = (tag) => {
    // Generate consistent colors based on the tag string
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-blue-100 text-blue-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-orange-100 text-orange-700'
    ];
    const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  // Group todos by priority
  const groupedTodos = todos.reduce((acc, todo) => {
    if (!acc[todo.priority]) {
      acc[todo.priority] = [];
    }
    acc[todo.priority].push(todo);
    return acc;
  }, {});

  if (loading) {
    return <div className="animate-pulse">Loading todos...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const priorityOrder = ['high', 'medium', 'low'];
  const priorityTitles = {
    high: 'High Priority',
    medium: 'Medium Priority',
    low: 'Low Priority'
  };

  const priorityColors = {
    high: 'text-red-600',
    medium: 'text-[#F59E0B]',
    low: 'text-green-600'
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )}
      </button>

      {/* Todo List Panel */}
      <div className={`fixed bottom-24 right-6 z-40 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%+24px)]'
        }`}>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-xl p-6 w-[400px] max-h-[80vh] overflow-y-auto 
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-transparent
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:border-2
          [&::-webkit-scrollbar-thumb]:border-transparent
          [&::-webkit-scrollbar]:hover:w-2
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-400">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Todo List</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {showAddForm ? '- Cancel' : '+ Add Task'}
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAddTodo} className="mb-6 space-y-4">
              <input
                type="text"
                placeholder="Task title"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <DatePicker
                selected={newTodo.dueDate}
                onChange={(date) => setNewTodo({ ...newTodo, dueDate: date.toISOString().split('T')[0] })}
                placeholderText="Due Date"
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newTodo.priority}
                onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value })}
                className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              {/* Tags Input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="flex-1 border rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleAddTag}
                    type="button"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Add Tag
                  </button>
                </div>
                {newTodo.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newTodo.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:opacity-75"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Add Task
              </button>
            </form>
          )}

          <div className="space-y-6">
            {priorityOrder.map((priority) => {
              const priorityTodos = groupedTodos[priority] || [];
              if (priorityTodos.length === 0) return null;

              return (
                <div key={priority} className="space-y-3">
                  <h3 className={`text-base font-medium ${priorityColors[priority]}`}>
                    {priorityTitles[priority]}
                  </h3>
                  <div className="space-y-3">
                    {priorityTodos.map((todo) => (
                      <div
                        key={todo._id}
                        className="flex items-start space-x-3 group hover:bg-gray-50 rounded-lg p-2"
                      >
                        <div
                          onClick={() => handleToggleStatus(todo)}
                          className="flex-shrink-0 w-5 h-5 mt-0.5 border border-gray-300 rounded cursor-pointer"
                        >
                          {todo.status === 'completed' && (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className={`text-gray-900 ${todo.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                                {todo.title}
                              </p>
                              {todo.description && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {todo.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-2 mt-2">
                                {/* Status Badge */}
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(todo.status)}`}>
                                  {todo.status.replace('_', ' ')}
                                </span>

                                {/* Due Date */}
                                {todo.dueDate && (
                                  <span className="text-xs text-gray-500">
                                    Due: {format(new Date(todo.dueDate), 'MMM d, yyyy')}
                                  </span>
                                )}

                                {/* Tags */}
                                {todo.tags && todo.tags.length > 0 && todo.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                Created {format(new Date(todo.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Status Update Dropdown */}
                              <select
                                value={todo.status}
                                onChange={(e) => handleUpdateTodo(todo._id, { status: e.target.value })}
                                className="text-sm border rounded p-1 bg-white"
                              >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>

                              {/* Delete Button */}
                              <button
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this task?')) {
                                    handleDeleteTodo(todo._id);
                                  }
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-gray-400 hover:text-red-500 rounded"
                                title="Delete task"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default TodoList; 