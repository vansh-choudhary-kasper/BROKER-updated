const Company = require('../models/Company');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { uploadToStorage } = require('../utils/fileUpload');
const { validateCompanyData } = require('../utils/validation');

class CompanyController {
    async createCompany(req, res) {
        try {
            const companyData = JSON.parse(JSON.stringify(req.body));
            
            // Handle file uploads
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const uploadResult = await uploadToStorage(file);
                    const fieldPath = file.fieldname.split('[');
                    let target = companyData;
                    
                    // Navigate through nested object structure
                    for (let i = 0; i < fieldPath.length - 1; i++) {
                        const key = fieldPath[i].replace(/\]/g, '');
                        if (!target[key]) {
                            target[key] = fieldPath[i + 1].includes(']') ? {} : [];
                        }
                        target = target[key];
                    }
                    
                    // Set the file URL in the appropriate field
                    const lastKey = fieldPath[fieldPath.length - 1].replace(/\]/g, '');
                    target[lastKey] = uploadResult.url;
                }
            }

            // Validate company data
            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }

            const company = new Company(companyData);
            await company.save();

            return res.status(201).json(company);
        } catch (error) {
            logger.error('Create Company Error:', error);
            return res.status(500).json(
                ApiResponse.serverError()
            );
        }
    }

    async getCompanies(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';

            const searchQuery = search ? {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { 'businessDetails.gstNumber': { $regex: search, $options: 'i' } },
                    { 'businessDetails.panNumber': { $regex: search, $options: 'i' } },
                    { 'contactPerson.email': { $regex: search, $options: 'i' } }
                ]
            } : {};

            const totalCompanies = await Company.countDocuments(searchQuery);
            const totalPages = Math.ceil(totalCompanies / limit);

            const companies = await Company.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            return res.status(200).json(
                ApiResponse.success('Companies retrieved successfully', {
                    companies,
                    currentPage: page,
                    totalPages,
                    totalCompanies
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
            const companyData = JSON.parse(JSON.stringify(req.body));
            
            // Handle file uploads
            if (req.files && req.files.length > 0) {
                for (const file of req.files) {
                    const uploadResult = await uploadToStorage(file);
                    const fieldPath = file.fieldname.split('[');
                    let target = companyData;
                    
                    // Navigate through nested object structure
                    for (let i = 0; i < fieldPath.length - 1; i++) {
                        const key = fieldPath[i].replace(/\]/g, '');
                        if (!target[key]) {
                            target[key] = fieldPath[i + 1].includes(']') ? {} : [];
                        }
                        target = target[key];
                    }
                    
                    // Set the file URL in the appropriate field
                    const lastKey = fieldPath[fieldPath.length - 1].replace(/\]/g, '');
                    target[lastKey] = uploadResult.url;
                }
            }

            // Validate company data
            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }

            const company = await Company.findByIdAndUpdate(
                req.params.id,
                { $set: companyData },
                { new: true, runValidators: true }
            );

            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }

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
            const company = await Company.findByIdAndDelete(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

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

            const uploadedDocs = [];
            for (const file of req.files) {
                const uploadResult = await uploadToStorage(file);
                uploadedDocs.push({
                    name: file.originalname,
                    type: file.mimetype,
                    url: uploadResult.url,
                    uploadDate: new Date()
                });
            }

            company.documents = [...(company.documents || []), ...uploadedDocs];
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

            company.documents = company.documents.filter(
                doc => doc._id.toString() !== req.params.documentId
            );
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