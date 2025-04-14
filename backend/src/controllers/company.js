const Company = require('../models/Company');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../utils/logger');
const { uploadToStorage } = require('../utils/fileUpload');
const { validateCompanyData } = require('../utils/validation');
const { buildNestedObject } = require('../utils/helpers');
const cloudinary = require('../config/cloudinary');

class CompanyController {
    async createCompany(req, res) {
        try {
            const companyData = buildNestedObject(req.body); // Flattened form parsing
            console.log('Company data:', companyData);
            console.log('Files:', req.files);
    
            // Handle file uploads
            if (req.files && Object.keys(req.files).length > 0) {
                for (const fieldName in req.files) {
                    const files = req.files[fieldName];
    
                    for (const file of files) {
                        const uploadResult = await uploadToStorage(file);
                        console.log('uploadResult', uploadResult);
    
                        const isDocument = file.fieldname.startsWith('documents.');
                        const docKey = file.fieldname.split('.')[1];
    
                        const docData = {
                            fieldPath: file.fieldname,
                            url: uploadResult.url,
                            publicId: uploadResult.publicId,
                            originalName: uploadResult.originalName,
                            mimetype: uploadResult.mimetype,
                            size: uploadResult.size,
                            uploadDate: new Date(),
                            verificationStatus: 'pending'
                        };
    
                        // Ensure documents object exists
                        if (!companyData.documents) companyData.documents = {};
    
                        if (isDocument) {
                            if (docKey === 'otherDocuments') {
                                if (!companyData.documents.otherDocuments) {
                                    companyData.documents.otherDocuments = [];
                                }
                                companyData.documents.otherDocuments.push(docData);
                            } else {
                                companyData.documents[docKey] = docData;
                            }
                        } else {
                            // Set flat or nested non-document file field
                            const flatKey = file.fieldname;
                            companyData[flatKey] = uploadResult.url;
                        }
                    }
                }
            }
    
            // Validate company data
            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }
    
            // Create and save new company
            const newCompany = new Company(companyData);
            await newCompany.save();
    
            return res.status(201).json(ApiResponse.success('Company created successfully', newCompany));
        } catch (error) {
            logger.error('Create Company Error:', error);
            return res.status(500).json(ApiResponse.serverError());
        }
    }    

    async getCompanies(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const status = req.query.status || '';
            const type = req.query.type || '';

            console.log('Received filters:', { page, limit, search, status, type }); // Debug log

            // Build the query object
            const searchQuery = {};
            
            // Add search conditions if search term exists
            if (search) {
                searchQuery.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { 'businessDetails.gstNumber': { $regex: search, $options: 'i' } },
                    { 'businessDetails.panNumber': { $regex: search, $options: 'i' } },
                    { 'contactPerson.email': { $regex: search, $options: 'i' } },
                    { 'bankDetails.accountNumber': { $regex: search, $options: 'i' } },
                    { 'bankDetails.ifscCode': { $regex: search, $options: 'i' } }
                ];
            }
            
            // Add status filter if provided
            if (status) {
                searchQuery.status = status;
            }
            
            // Add type filter if provided
            if (type) {
                searchQuery.type = type;
            }

            console.log('Search query:', JSON.stringify(searchQuery)); // Debug log

            const totalCompanies = await Company.countDocuments(searchQuery);
            console.log('Total companies found:', totalCompanies); // Debug log
            
            const totalPages = Math.ceil(totalCompanies / limit);

            let companies = await Company.find(searchQuery)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit);

            console.log('Companies returned:', companies.length); // Debug log
            
            companies = companies.filter(company => company.name !== 'other');

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
            const companyData = buildNestedObject(req.body);
            console.log('companyData', companyData);
    
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }
    
            if (req.files && Object.keys(req.files).length > 0) {
                console.log('Files:', req.files);
    
                for (const fieldName in req.files) {
                    const files = req.files[fieldName];
    
                    for (const file of files) {
                        const uploadResult = await uploadToStorage(file);
                        console.log('uploadResult', uploadResult);
    
                        const isDocument = file.fieldname.startsWith('documents.');
                        const docKey = file.fieldname.split('.')[1];
    
                        const docData = {
                            fieldPath: file.fieldname,
                            url: uploadResult.url,
                            publicId: uploadResult.publicId,
                            originalName: uploadResult.originalName,
                            mimetype: uploadResult.mimetype,
                            size: uploadResult.size,
                            uploadDate: new Date(),
                            verificationStatus: 'pending'
                        };
    
                        if (!companyData.documents) companyData.documents = {};
    
                        if (isDocument) {
                            if (docKey === 'otherDocuments') {
                                if (!companyData.documents.otherDocuments) {
                                    companyData.documents.otherDocuments = [];
                                }
                                companyData.documents.otherDocuments.push(docData);
                            } else {
                                companyData.documents[docKey] = docData;
                            }
                        } else {
                            companyData[file.fieldname] = uploadResult.url;
                        }
                    }
                }
            }
    
            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }
    
            Object.assign(company, companyData);
            const updatedCompany = await company.save();
            console.log(companyData);
    
            return res.status(200).json(
                ApiResponse.success('Company updated successfully', updatedCompany)
            );
        } catch (error) {
            logger.error('Update Company Error:', error);
            return res.status(500).json(ApiResponse.serverError());
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
                    publicId: uploadResult.publicId,
                    uploadDate: new Date()
                });
            }

            // Initialize documents array if it doesn't exist
            if (!company.documents) {
                company.documents = {};
            }
            
            // Initialize otherDocuments array if it doesn't exist
            if (!company.documents.otherDocuments) {
                company.documents.otherDocuments = [];
            }
            
            // Add the new documents to the otherDocuments array
            company.documents.otherDocuments = [...company.documents.otherDocuments, ...uploadedDocs];
            
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

            const documentId = req.params.documentId;
            
            // Check if the document exists in otherDocuments array
            const documentIndex = company.documents.otherDocuments.findIndex(
                doc => doc._id.toString() === documentId
            );
            
            if (documentIndex === -1) {
                return res.status(404).json(
                    ApiResponse.notFound('Document not found')
                );
            }
            
            // Get the document to delete
            const documentToDelete = company.documents.otherDocuments[documentIndex];
            
            // Delete from Cloudinary if publicId exists
            if (documentToDelete.publicId) {
                try {
                    await cloudinary.uploader.destroy(documentToDelete.publicId);
                } catch (error) {
                    logger.error('Error deleting document from Cloudinary:', error);
                    // Continue with the deletion even if Cloudinary deletion fails
                }
            }
            
            // Remove the document from the array
            company.documents.otherDocuments.splice(documentIndex, 1);
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