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
        this.deleteTask = this.deleteTask.bind(this);
    }

    async generateTaskNumber() {
        try {
            // Get the latest task
            const latestTask = await Task.findOne().sort({ taskNumber: -1 });

            if (!latestTask || !latestTask.taskNumber) {
                // If no tasks exist, start with TASK-0001
                return 'DEAL-0001';
            }

            // Extract the number part and increment it
            const currentNumber = parseInt(latestTask.taskNumber.split('-')[1]);
            const nextNumber = currentNumber + 1;

            // Format the new task number with leading zeros
            return `DEAL-${nextNumber.toString().padStart(4, '0')}`;
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

            // Verify client company exists
            const clientCompanyExists = await Company.findById(clientCompany, { createdBy: req.user.userId });
            if (!clientCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Client company not found')
                );
            }

            // Verify provider company exists
            const providerCompanyExists = await Company.findById(providerCompany, { createdBy: req.user.userId });
            if (!providerCompanyExists) {
                return res.status(404).json(
                    ApiResponse.notFound('Provider company not found')
                );
            }

            let task;

            if (helperBroker && helperBroker.broker && helperBroker.broker !== "") {
                task = new Task({
                    title,
                    description,
                    taskNumber: finalTaskNumber,
                    clientCompany,
                    providerCompany,
                    helperBroker,
                    payment,
                    createdBy: req.user.userId
                });
            } else {
                task = new Task({
                    title,
                    description,
                    taskNumber: finalTaskNumber,
                    clientCompany,
                    providerCompany,
                    payment,
                    createdBy: req.user.userId
                });
            }

            await task.save();

            // Verify helper broker exists if provided and update broker's task payments
            if (helperBroker && helperBroker.broker) {
                const brokerDoc = await Broker.findById(helperBroker.broker, { createdBy: req.user.userId });
                if (!brokerDoc) {
                    return res.status(404).json(
                        ApiResponse.notFound('Helper broker not found')
                    );
                }

                // Add task payment record with the actual task ID
                let commission = payment.amount * (helperBroker.commission / 100);
                brokerDoc.taskPayments.push({
                    taskId: task._id,
                    taskNumber: finalTaskNumber,
                    commission: helperBroker.commission,
                    amount: commission,
                    status: helperBroker.status || 'pending'
                });

                // Update financial summary
                brokerDoc.financialSummary.totalTasks++;
                if (helperBroker.status === 'paid') {
                    brokerDoc.financialSummary.totalCommission += commission;
                } else {
                    brokerDoc.financialSummary.pendingCommission += commission;
                }
                await brokerDoc.save();
            }

            // Send email notifications
            // try {
            //     await emailService.sendTaskCreatedEmail(task);
            // } catch (emailError) {
            //     logger.error('Email notification error:', emailError);
            //     // Continue execution even if email fails
            // }

            return res.status(201).json(
                ApiResponse.success('Task created successfully', task)
            );
        } catch (error) {
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

            query.createdBy = req.user.userId;

            // Add search functionality
            if (search) {
                console.error("search", search);
                // First, find brokers whose names match the search term
                const brokers = await Broker.find({
                    name: { $regex: search, $options: 'i' }
                }, { createdBy: req.user.userId }).select('_id');

                const brokerIds = brokers.map(broker => broker._id);

                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { taskNumber: { $regex: search, $options: 'i' } },
                    { 'helperBroker.broker': { $in: brokerIds } }
                ];
            }

            const tasks = await Task.find(query)
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
                ApiResponse.serverError(error.message)
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
            const task = await Task.findById(id, { createdBy: req.user.userId });
            if (!task) {
                return res.status(404).json(
                    ApiResponse.notFound('Task not found')
                );
            }

            if (task.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to update this task')
                );
            }

            // Verify client company exists if provided
            if (clientCompany) {
                const clientCompanyExists = await Company.findById(clientCompany, { createdBy: req.user.userId });
                if (!clientCompanyExists) {
                    return res.status(404).json(
                        ApiResponse.notFound('Client company not found')
                    );
                }
            }

            // Verify provider company exists if provided
            if (providerCompany) {
                const providerCompanyExists = await Company.findById(providerCompany, { createdBy: req.user.userId });
                if (!providerCompanyExists) {
                    return res.status(404).json(
                        ApiResponse.notFound('Provider company not found')
                    );
                }
            }

            // Verify helper broker exists if provided
            if (helperBroker && helperBroker.broker) {
                const brokerDoc = await Broker.findById(helperBroker.broker, { createdBy: req.user.userId });
                if (!brokerDoc) {
                    return res.status(404).json(
                        ApiResponse.notFound('Helper broker not found')
                    );
                }

                // Check if task payment already exists
                const existingTaskPayment = brokerDoc.taskPayments.find(
                    tp => tp.taskId.toString() === id
                );

                // If task payment exists and is already paid, prevent changing status back to pending
                if (existingTaskPayment && existingTaskPayment.status === 'paid' &&
                    helperBroker.status === 'pending') {
                    return res.status(400).json(
                        ApiResponse.error('Cannot change payment status from paid to pending')
                    );
                }

                // If task payment exists and is already paid, prevent changing amount, commission, and payment date
                if (existingTaskPayment && existingTaskPayment.status === 'paid') {
                    // Check if amount or commission is being changed
                    if ((payment && payment.amount !== task.payment.amount) ||
                        (helperBroker.commission !== task.helperBroker.commission)) {
                        return res.status(400).json(
                            ApiResponse.error('Cannot change amount or commission when payment status is paid')
                        );
                    }

                    // Check if payment date is being changed
                    if (helperBroker.paymentDate &&
                        task.helperBroker.paymentDate &&
                        new Date(helperBroker.paymentDate).getTime() !== new Date(task.helperBroker.paymentDate).getTime()) {
                        return res.status(400).json(
                            ApiResponse.error('Cannot change payment date when payment status is paid')
                        );
                    }
                }

                // If task payment exists and status is changing to paid, update it
                if (existingTaskPayment && existingTaskPayment.status === 'pending' &&
                    helperBroker.status === 'paid') {
                    // Update existing task payment
                    existingTaskPayment.status = 'paid';
                    existingTaskPayment.paymentDate = new Date();

                    // Update financial summary
                    let commission = payment.amount * (helperBroker.commission / 100);
                    brokerDoc.financialSummary.totalCommission += commission;
                    brokerDoc.financialSummary.pendingCommission -= commission;
                }
                // If task payment doesn't exist and status is paid, add it
                else if (!existingTaskPayment && helperBroker.status === 'paid') {
                    // Add new task payment
                    let commission = payment.amount * (helperBroker.commission / 100);
                    brokerDoc.taskPayments.push({
                        taskId: id,
                        taskNumber: task.taskNumber,
                        commission: helperBroker.commission,
                        amount: commission,
                        status: 'paid',
                        paymentDate: new Date()
                    });

                    // Update financial summary
                    brokerDoc.financialSummary.totalCommission += commission;
                    brokerDoc.financialSummary.totalTasks++;
                }
                // If task payment doesn't exist and status is pending, add it
                else if (!existingTaskPayment && helperBroker.status === 'pending') {
                    // Add new task payment
                    let commission = payment.amount * (helperBroker.commission / 100);
                    brokerDoc.taskPayments.push({
                        taskId: id,
                        taskNumber: task.taskNumber,
                        commission: helperBroker.commission,
                        amount: commission,
                        status: 'pending'
                    });

                    // Update financial summary
                    brokerDoc.financialSummary.pendingCommission += commission;
                    brokerDoc.financialSummary.totalTasks++;
                } 
                // If task payment exists, status is pending, and amount or commission changed
                else if (existingTaskPayment && helperBroker.status === 'pending' && 
                        existingTaskPayment.status === 'pending') {
                    // Calculate new commission amount
                    let newCommission = payment.amount * (helperBroker.commission / 100);
                    
                    // Update financial summary - adjust pending commission
                    brokerDoc.financialSummary.pendingCommission -= existingTaskPayment.amount;
                    brokerDoc.financialSummary.pendingCommission += newCommission;
                    
                    // Update task payment record
                    existingTaskPayment.amount = newCommission;
                    existingTaskPayment.commission = helperBroker.commission;
                }

                await brokerDoc.save();
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
            // try {
            //     await emailService.sendTaskUpdatedEmail(task);
            // } catch (emailError) {
            //     logger.error('Email notification error:', emailError);
            //     // Continue execution even if email fails
            // }

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

            if (task.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to delete this task')
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
}

module.exports = new TaskController(); 