const Task = require('../models/Task');
const Company = require('../models/Company');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

class TaskController {
    async createTask(req, res) {
        try {
            console.log(req.body);
            const {
                title,
                description,
                dueDate,
                priority,
                status,
                assignedTo,
                company,
                clientCompany,
                providerCompany,
                taskNumber,
                timeline,
                financialDetails
            } = req.body;

            // Use clientCompany from new field or fall back to old company field
            const finalClientCompany = clientCompany || company;
            const finalProviderCompany = providerCompany;

            // Verify client company exists
            const clientCompanyExists = await Company.findById(finalClientCompany);
            if (!clientCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Client company not found')
                );
            }

            // Verify provider company exists
            const providerCompanyExists = await Company.findById(finalProviderCompany);
            if (!providerCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Provider company not found')
                );
            }

            // Verify user exists
            const userExists = await User.findById(assignedTo);
            if (!userExists) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            // Create task with attachments
            const attachments = req.files ? req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: file.path,
                uploadDate: new Date()
            })) : [];

            const task = await Task.create({
                title,
                description,
                dueDate,
                priority,
                status,
                assignedTo,
                clientCompany: finalClientCompany,
                providerCompany: finalProviderCompany,
                taskNumber,
                timeline,
                financialDetails,
                attachments,
                createdBy: req.user.userId
            });

            // Send email notification to assigned user
            // await emailService.sendEmail(
            //     userExists.email,
            //     'New Task Assigned',
            //     `
            //     <h1>New Task Assigned</h1>
            //     <p>You have been assigned a new task:</p>
            //     <h2>${title}</h2>
            //     <p><strong>Description:</strong> ${description}</p>
            //     <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            //     <p><strong>Priority:</strong> ${priority}</p>
            //     `
            // );

            return res.status(201).json(
                ApiResponse.created('Task created successfully', task)
            );
        } catch (error) {
            logger.error('Create Task Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getTasks(req, res) {
        try {
            const { page = 1, limit = 10, status, priority, company, clientCompany, providerCompany } = req.query;
            const query = {};

            if (status) query.status = status;
            if (priority) query.priority = priority;
            
            // Handle both old and new company fields in query
            if (clientCompany) {
                query.clientCompany = clientCompany;
            } else if (company) {
                query.clientCompany = company;
            }
            if (providerCompany) {
                query.providerCompany = providerCompany;
            }

            const tasks = await Task.find(query)
                .populate('assignedTo', 'name email')
                .populate('clientCompany', 'name')
                .populate('providerCompany', 'name')
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const count = await Task.countDocuments(query);

            return res.status(200).json(
                ApiResponse.success('Tasks retrieved successfully', {
                    tasks,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page
                })
            );
        } catch (error) {
            logger.error('Get Tasks Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getTask(req, res) {
        try {
            const task = await Task.findById(req.params.id)
                .populate('assignedTo', 'name email')
                .populate('clientCompany', 'name')
                .populate('providerCompany', 'name')
                .populate('comments.user', 'name');

            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            return res.status(200).json(
                ApiResponse.success('Task retrieved successfully', task)
            );
        } catch (error) {
            logger.error('Get Task Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async updateTask(req, res) {
        try {
            const {
                title,
                description,
                dueDate,
                priority,
                status,
                assignedTo,
                company,
                clientCompany,
                providerCompany,
                taskNumber,
                timeline,
                financialDetails
            } = req.body;

            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            // Use clientCompany from new field or fall back to old company field
            const finalClientCompany = clientCompany || company;
            const finalProviderCompany = providerCompany;

            // Verify client company exists
            const clientCompanyExists = await Company.findById(finalClientCompany);
            if (!clientCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Client company not found')
                );
            }

            // Verify provider company exists
            const providerCompanyExists = await Company.findById(finalProviderCompany);
            if (!providerCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Provider company not found')
                );
            }

            // Verify user exists
            const userExists = await User.findById(assignedTo);
            if (!userExists) {
                return res.status(404).json(
                    ApiResponse.notFound('User not found')
                );
            }

            // Update task details
            Object.assign(task, {
                title,
                description,
                dueDate,
                priority,
                status,
                assignedTo,
                clientCompany: finalClientCompany,
                providerCompany: finalProviderCompany,
                taskNumber,
                timeline,
                financialDetails
            });

            // Add new attachments if any
            if (req.files && req.files.length > 0) {
                const newAttachments = req.files.map(file => ({
                    name: file.originalname,
                    type: file.mimetype,
                    url: file.path,
                    uploadDate: new Date()
                }));
                task.attachments.push(...newAttachments);
            }

            await task.save();

            // Send email notification if assigned user changed
            if (task.assignedTo.toString() !== assignedTo) {
                await emailService.sendEmail(
                    userExists.email,
                    'Task Assigned to You',
                    `
                    <h1>Task Assigned</h1>
                    <p>You have been assigned a task:</p>
                    <h2>${title}</h2>
                    <p><strong>Description:</strong> ${description}</p>
                    <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
                    <p><strong>Priority:</strong> ${priority}</p>
                    `
                );
            }

            return res.status(200).json(
                ApiResponse.success('Task updated successfully', task)
            );
        } catch (error) {
            logger.error('Update Task Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteTask(req, res) {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            await task.remove();

            return res.status(200).json(
                ApiResponse.success('Task deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Task Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async updateTaskStatus(req, res) {
        try {
            const { status } = req.body;
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            task.status = status;
            await task.save();

            // Send email notification about status change
            const assignedUser = await User.findById(task.assignedTo);
            if (assignedUser) {
                await emailService.sendEmail(
                    assignedUser.email,
                    'Task Status Updated',
                    `
                    <h1>Task Status Updated</h1>
                    <p>The status of your task "${task.title}" has been updated to: ${status}</p>
                    `
                );
            }

            return res.status(200).json(
                ApiResponse.success('Task status updated successfully', task)
            );
        } catch (error) {
            logger.error('Update Task Status Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addComment(req, res) {
        try {
            const { comment } = req.body;
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            task.comments.push({
                user: req.user.userId,
                comment,
                date: new Date()
            });

            await task.save();

            return res.status(200).json(
                ApiResponse.success('Comment added successfully', task.comments)
            );
        } catch (error) {
            logger.error('Add Comment Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteComment(req, res) {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            const commentIndex = task.comments.findIndex(
                comment => comment._id.toString() === req.params.commentId
            );

            if (commentIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Comment not found')
                );
            }

            task.comments.splice(commentIndex, 1);
            await task.save();

            return res.status(200).json(
                ApiResponse.success('Comment deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Comment Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addAttachments(req, res) {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json(
                    ApiResponse.error('No attachments provided')
                );
            }

            const newAttachments = req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: file.path,
                uploadDate: new Date()
            }));

            task.attachments.push(...newAttachments);
            await task.save();

            return res.status(200).json(
                ApiResponse.success('Attachments added successfully', task.attachments)
            );
        } catch (error) {
            logger.error('Add Attachments Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteAttachment(req, res) {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            const attachmentIndex = task.attachments.findIndex(
                attachment => attachment._id.toString() === req.params.attachmentId
            );

            if (attachmentIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Attachment not found')
                );
            }

            task.attachments.splice(attachmentIndex, 1);
            await task.save();

            return res.status(200).json(
                ApiResponse.success('Attachment deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Attachment Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }
}

module.exports = new TaskController(); 