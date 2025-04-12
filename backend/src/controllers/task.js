const Task = require('../models/Task');
const Company = require('../models/Company');
const User = require('../models/User');
const Broker = require('../models/Broker');
const ApiResponse = require('../utils/apiResponse');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');

class TaskController {
    constructor() {
        this.generateTaskNumber = this.generateTaskNumber.bind(this);
        this.createTask = this.createTask.bind(this);
        this.updateTask = this.updateTask.bind(this);
        this.getTasks = this.getTasks.bind(this);
        this.getTask = this.getTask.bind(this);
        this.deleteTask = this.deleteTask.bind(this);
        this.addComment = this.addComment.bind(this);
        this.deleteComment = this.deleteComment.bind(this);
        this.addAttachments = this.addAttachments.bind(this);
        this.deleteAttachment = this.deleteAttachment.bind(this);
    }

    async generateTaskNumber() {
        try {
            // Get the latest task
            const latestTask = await Task.findOne().sort({ taskNumber: -1 });
            
            if (!latestTask || !latestTask.taskNumber) {
                // If no tasks exist, start with TASK-0001
                return 'TASK-0001';
            }

            // Extract the number part and increment it
            const currentNumber = parseInt(latestTask.taskNumber.split('-')[1]);
            const nextNumber = currentNumber + 1;
            
            // Format the new task number with leading zeros
            return `TASK-${nextNumber.toString().padStart(4, '0')}`;
        } catch (error) {
            logger.error('Generate Task Number Error:', error);
            throw error;
        }
    }

    async createTask(req, res) {
        try {
            const {
                title,
                description,
                taskNumber,
                clientCompany,
                providerCompany,
                helperBroker,
                payment
            } = req.body;

            // Generate task number if not provided
            const finalTaskNumber = taskNumber || await this.generateTaskNumber();
            console.log("finalTaskNumber", finalTaskNumber);

            // Verify client company exists
            const clientCompanyExists = await Company.findById(clientCompany);
            if (!clientCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Client company not found')
                );
            }

            // Verify provider company exists
            const providerCompanyExists = await Company.findById(providerCompany);
            if (!providerCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Provider company not found')
                );
            }

            // Verify helper broker exists if provided
            if (helperBroker && helperBroker.broker) {
                const brokerDoc = await Broker.findById(helperBroker.broker);
                if (!brokerDoc) {
                    return res.status(404).json(
                        ApiResponse.notFound('Helper broker not found')
                    );
                }
            }

            // Create the task
            const task = new Task({
                title,
                description,
                taskNumber: finalTaskNumber,
                clientCompany,
                providerCompany,
                helperBroker,
                payment
            });

            await task.save();

            // Send email notifications
            try {
                await emailService.sendTaskCreatedEmail(task);
            } catch (emailError) {
                logger.error('Email notification error:', emailError);
                // Continue execution even if email fails
            }

            return res.status(201).json(
                ApiResponse.success('Task created successfully', task)
            );
        } catch (error) {
            console.log("error", error);
            logger.error('Create Task Error:', error);
            return res.status(500).json(
                ApiResponse.error('Failed to create task', error.message)
            );
        }
    }

    async getTasks(req, res) {
        try {
            const { page = 1, limit = 10, status, priority, company, clientCompany, providerCompany, search } = req.query;
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

            // Add search functionality
            if (search) {
                console.error("search", search);
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { taskNumber: { $regex: search, $options: 'i' } }
                ];
            }

            const tasks = await Task.find(query)
                .populate('providerCompany', 'name')
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const count = await Task.countDocuments(query);
            return res.status(200).json(
                ApiResponse.success('Tasks retrieved successfully', {
                    tasks,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page,
                    total: count
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
            const { id } = req.params;
            const {
                title,
                description,
                taskNumber,
                clientCompany,
                providerCompany,
                helperBroker,
                payment
            } = req.body;

            // Find the task
            const task = await Task.findById(id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            // Verify client company exists if provided
            if (clientCompany) {
                const clientCompanyExists = await Company.findById(clientCompany);
                if (!clientCompanyExists) {
                    return res.status(404).json(
                        ApiResponse.notFound('Client company not found')
                    );
                }
            }

            // Verify provider company exists if provided
            if (providerCompany) {
                const providerCompanyExists = await Company.findById(providerCompany);
                if (!providerCompanyExists) {
                    return res.status(404).json(
                        ApiResponse.notFound('Provider company not found')
                    );
                }
            }

            // Verify helper broker exists if provided
            if (helperBroker && helperBroker.broker) {
                const brokerDoc = await Broker.findById(helperBroker.broker);
                if (!brokerDoc) {
                    return res.status(404).json(
                        ApiResponse.notFound('Helper broker not found')
                    );
                }
            }

            // Update task fields
            if (title) task.title = title;
            if (description !== undefined) task.description = description;
            if (taskNumber) task.taskNumber = taskNumber;
            if (clientCompany) task.clientCompany = clientCompany;
            if (providerCompany) task.providerCompany = providerCompany;
            if (helperBroker) task.helperBroker = helperBroker;
            if (payment) task.payment = payment;

            await task.save();

            // Send email notifications
            try {
                await emailService.sendTaskUpdatedEmail(task);
            } catch (emailError) {
                logger.error('Email notification error:', emailError);
                // Continue execution even if email fails
            }

            return res.status(200).json(
                ApiResponse.success('Task updated successfully', task)
            );
        } catch (error) {
            logger.error('Update Task Error:', error);
            return res.status(500).json(
                ApiResponse.error('Failed to update task', error.message)
            );
        }
    }

    async deleteTask(req, res) {
        try {
            const { id } = req.params;
            
            const task = await Task.findByIdAndDelete(id);
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }
            
            return res.status(200).json(
                ApiResponse.success('Task deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Task Error:', error);
            return res.status(500).json(
                ApiResponse.error('Failed to delete task', error.message)
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