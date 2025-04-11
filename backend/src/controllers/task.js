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
        this.updateTaskStatus = this.updateTaskStatus.bind(this);
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
                timeline,
                financialDetails,
                broker,
                brokerCommissionRate
            } = req.body;

            // Generate task number
            const taskNumber = await this.generateTaskNumber();

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

            // Verify broker exists if provided
            let brokerDoc;
            if (broker) {
                brokerDoc = await Broker.findById(broker);
                if (!brokerDoc) {
                    return res.status(404).json(
                        ApiResponse.notFound('Broker not found')
                    );
                }
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
                broker,
                brokerCommissionRate,
                createdBy: req.user.userId
            });

            // Update broker's referrals if broker is provided
            if (brokerDoc && brokerCommissionRate) {
                brokerDoc.referrals.push({
                    company: finalClientCompany,
                    task: task._id,
                    date: new Date(),
                    commission: brokerCommissionRate,
                    status: 'pending'
                });
                await brokerDoc.save();
            }

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
                dueDate,
                priority,
                status,
                assignedTo,
                clientCompany,
                providerCompany,
                taskNumber,
                timeline,
                financialDetails,
                broker,
                brokerCommissionRate
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

            // Verify user exists if provided
            if (assignedTo) {
                const userExists = await User.findById(assignedTo);
                if (!userExists) {
                    return res.status(404).json(
                        ApiResponse.notFound('User not found')
                    );
                }
            }

            // Handle broker update
            let brokerDoc;
            if (broker) {
                brokerDoc = await Broker.findById(broker);
                if (!brokerDoc) {
                    return res.status(404).json(
                        ApiResponse.notFound('Broker not found')
                    );
                }

                // If broker is changed, update the referrals
                if (task.broker && task.broker.toString() !== broker) {
                    // Remove old referral
                    const oldBroker = await Broker.findById(task.broker);
                    if (oldBroker) {
                        oldBroker.referrals = oldBroker.referrals.filter(
                            ref => ref.task.toString() !== task._id.toString()
                        );
                        await oldBroker.save();
                    }

                    // Add new referral if commission rate is provided
                    if (brokerCommissionRate) {
                        brokerDoc.referrals.push({
                            company: clientCompany || task.clientCompany,
                            task: task._id,
                            date: new Date(),
                            commission: brokerCommissionRate,
                            status: 'pending'
                        });
                        await brokerDoc.save();
                    }
                } else if (brokerCommissionRate && task.brokerCommissionRate !== brokerCommissionRate) {
                    // Update existing referral's commission
                    const referralIndex = brokerDoc.referrals.findIndex(
                        ref => ref.task.toString() === task._id.toString()
                    );
                    if (referralIndex !== -1) {
                        brokerDoc.referrals[referralIndex].commission = brokerCommissionRate;
                        await brokerDoc.save();
                    }
                }
            }

            // Update task
            const updatedTask = await Task.findByIdAndUpdate(
                id,
                {
                    title,
                    description,
                    dueDate,
                    priority,
                    status,
                    assignedTo,
                    clientCompany,
                    providerCompany,
                    taskNumber,
                    timeline,
                    financialDetails,
                    broker,
                    brokerCommissionRate
                },
                { new: true }
            );

            return res.status(200).json(
                ApiResponse.success('Task updated successfully', updatedTask)
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
            const task = await Task.findByIdAndDelete(req.params.id);
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