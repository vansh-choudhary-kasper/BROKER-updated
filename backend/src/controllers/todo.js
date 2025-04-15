const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class TodoController {
    async getTodos(req, res) {
        try {
            const user = await User.findById(req.user.userId).select('todos');
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }
            // Sort todos by priority and status
            const sortedTodos = user.todos.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                const statusOrder = { pending: 0, in_progress: 1, completed: 2 };
                
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return statusOrder[a.status] - statusOrder[b.status];
            });
            return res.status(200).json(sortedTodos);
        } catch (error) {
            logger.error('Get Todos Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to get todos')
            );
        }
    }

    async createTodo(req, res) {
        try {
            const { title, description, priority,dueDate, status = 'pending', tags = [] } = req.body;
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            // Validate priority
            if (!['high', 'medium', 'low'].includes(priority)) {
                return res.status(400).json(
                    ApiResponse.error('Invalid priority value')
                );
            }

            // Validate status
            if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
                return res.status(400).json(
                    ApiResponse.error('Invalid status value')
                );
            }

            console.log(tags);
            const newTodo = {
                title,
                description,
                dueDate,
                priority,
                status,
                tags,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            user.todos.push(newTodo);
            await user.save();

            return res.status(201).json(
                ApiResponse.success('Todo created successfully', newTodo)
            );
        } catch (error) {
            logger.error('Create Todo Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to create todo')
            );
        }
    }

    async updateTodo(req, res) {
        try {
            const { id } = req.params;
            const { title, description, priority, status, tags } = req.body;
            
            const user = await User.findById(req.user.userId);
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            const todo = user.todos.id(id);
            if (!todo) {
                return res.status(404).json(
                    ApiResponse.notFound('Todo not found')
                );
            }

            // Validate priority if provided
            if (priority && !['high', 'medium', 'low'].includes(priority)) {
                return res.status(400).json(
                    ApiResponse.error('Invalid priority value')
                );
            }

            // Validate status if provided
            if (status && !['pending', 'in_progress', 'completed'].includes(status)) {
                return res.status(400).json(
                    ApiResponse.error('Invalid status value')
                );
            }

            // Update fields if provided
            if (title) todo.title = title;
            if (description !== undefined) todo.description = description;
            if (priority) todo.priority = priority;
            if (status) todo.status = status;
            if (tags) todo.tags = tags;

            // Always update the updatedAt timestamp
            todo.updatedAt = new Date();

            await user.save();

            return res.status(200).json(
                ApiResponse.success('Todo updated successfully', todo)
            );
        } catch (error) {
            logger.error('Update Todo Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to update todo')
            );
        }
    }

    async deleteTodo(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            const todo = user.todos.id(id);
            if (!todo) {
                return res.status(404).json(
                    ApiResponse.notFound('Todo not found')
                );
            }

            user.todos.pull(id);
            await user.save();

            return res.status(200).json(
                ApiResponse.success('Todo deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Todo Error:', error);
            return res.status(500).json(
                ApiResponse.serverError('Failed to delete todo')
            );
        }
    }
}

module.exports = new TodoController(); 