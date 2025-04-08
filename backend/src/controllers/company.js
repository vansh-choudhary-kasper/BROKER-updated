const Company = require('../models/Company');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');

class CompanyController {
    async createCompany(req, res) {
        try {
            const company = await Company.create(req.body);
            return res.status(201).json(
                ApiResponse.created('Company created successfully', company)
            );
        } catch (error) {
            logger.error('Create Company Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getCompanies(req, res) {
        try {
            const { page = 1, limit = 10, type, status, search } = req.query;
            const query = {};

            if (type) query.type = type;
            if (status) query.status = status;
            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { 'businessDetails.gstNumber': { $regex: search, $options: 'i' } },
                    { 'businessDetails.panNumber': { $regex: search, $options: 'i' } }
                ];
            }

            const companies = await Company.find(query)
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .exec();

            const count = await Company.countDocuments(query);

            return res.status(200).json(
                ApiResponse.success('Companies retrieved successfully', {
                    companies,
                    totalPages: Math.ceil(count / limit),
                    currentPage: page
                })
            );
        } catch (error) {
            logger.error('Get Companies Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getCompany(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            return res.status(200).json(
                ApiResponse.success('Company retrieved successfully', company)
            );
        } catch (error) {
            logger.error('Get Company Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async updateCompany(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            Object.assign(company, req.body);
            await company.save();

            return res.status(200).json(
                ApiResponse.success('Company updated successfully', company)
            );
        } catch (error) {
            logger.error('Update Company Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteCompany(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            await company.remove();

            return res.status(200).json(
                ApiResponse.success('Company deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Company Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async updateCompanyStatus(req, res) {
        try {
            const { status } = req.body;
            const company = await Company.findById(req.params.id);
            
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            company.status = status;
            await company.save();

            return res.status(200).json(
                ApiResponse.success('Company status updated successfully', company)
            );
        } catch (error) {
            logger.error('Update Company Status Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async updateRiskAssessment(req, res) {
        try {
            const { score, factors } = req.body;
            const company = await Company.findById(req.params.id);
            
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            company.riskAssessment = {
                score,
                factors,
                lastAssessedBy: req.user.userId,
                lastAssessedDate: new Date()
            };

            await company.save();

            return res.status(200).json(
                ApiResponse.success('Risk assessment updated successfully', company)
            );
        } catch (error) {
            logger.error('Update Risk Assessment Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addBankDetails(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            company.bankDetails.push(req.body);
            await company.save();

            return res.status(200).json(
                ApiResponse.success('Bank details added successfully', company)
            );
        } catch (error) {
            logger.error('Add Bank Details Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async removeBankDetails(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            const bankIndex = company.bankDetails.findIndex(
                bank => bank._id.toString() === req.params.bankId
            );

            if (bankIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Bank details not found')
                );
            }

            company.bankDetails.splice(bankIndex, 1);
            await company.save();

            return res.status(200).json(
                ApiResponse.success('Bank details removed successfully')
            );
        } catch (error) {
            logger.error('Remove Bank Details Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async addDocuments(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json(
                    ApiResponse.error('No documents provided')
                );
            }

            const newDocuments = req.files.map(file => ({
                name: file.originalname,
                type: file.mimetype,
                url: file.path,
                uploadDate: new Date()
            }));

            company.documents = company.documents || [];
            company.documents.push(...newDocuments);
            await company.save();

            return res.status(200).json(
                ApiResponse.success('Documents added successfully', company.documents)
            );
        } catch (error) {
            logger.error('Add Documents Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async deleteDocument(req, res) {
        try {
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            const documentIndex = company.documents.findIndex(
                doc => doc._id.toString() === req.params.documentId
            );

            if (documentIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Document not found')
                );
            }

            company.documents.splice(documentIndex, 1);
            await company.save();

            return res.status(200).json(
                ApiResponse.success('Document deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Document Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }
}

module.exports = new CompanyController(); 