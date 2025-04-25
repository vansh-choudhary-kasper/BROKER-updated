const Company = require('../models/Company');
const Bank = require('../models/Bank');
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

            companyData.createdBy = req.user.userId;

            // Validate company data
            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }
    
            // Handle file uploads
            if (req.files && Object.keys(req.files).length > 0) {
                for (const fieldName in req.files) {
                    const files = req.files[fieldName];
    
                    for (const file of files) {
                        const uploadResult = await uploadToStorage(file);
    
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
    
            // Create and save new company
            const bankDetails = [];
            for (const bank of companyData.bankDetails) {
                try {
                    let newBank = await Bank.findOne({accountNumber: bank.accountNumber}); 
                    if(!newBank) {
                        bank.createdBy = req.user.userId;
                        newBank = new Bank(bank);
                    } else if (newBank.createdBy.toString() !== req.user.userId)  {
                        continue;
                    } else {
                        Object.assign(newBank, bank);
                        await newBank.save();
                    }
                    bankDetails.push({_id: newBank._id});
                } catch (error) {
                    logger.error('Create Bank Error:', error);
                }
            }
            companyData.bankDetails = bankDetails;
            if(companyData.slabs) {
                companyData.slabs = Object.values(companyData.slabs);
            }
            const newCompany = new Company(companyData);
            await newCompany.save();
    
            return res.status(201).json(ApiResponse.success('Company created successfully', newCompany));
        } catch (error) {
            logger.error('Create Company Error:', error);
            return res.status(500).json(ApiResponse.serverError(error.message));
        }
    }    

    async getCompanies(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const status = req.query.status || '';
            const type = req.query.type || '';
    
            const bankCollectionName = Bank.collection.name;
    
            const matchStage = {};
            if (status) matchStage.status = status;
            if (type) matchStage.type = type;
    
            const searchRegex = { $regex: search, $options: 'i' };
            const searchConditions = [];
    
            if (search) {
                searchConditions.push(
                    { name: searchRegex },
                    { 'businessDetails.gstNumber': searchRegex },
                    { 'businessDetails.panNumber': searchRegex },
                    { 'contactPerson.email': searchRegex },
                    {
                        bankDetails: {
                            $elemMatch: {
                                $or: [
                                    { accountNumber: searchRegex },
                                    { ifscCode: searchRegex }
                                ],
                                createdBy: req.user.userId
                            }
                        }
                    }
                );
                matchStage.$or = searchConditions;
            }
    
            const aggregatePipeline = [
                {
                    $lookup: {
                        from: bankCollectionName,
                        localField: 'bankDetails',
                        foreignField: '_id',
                        as: 'bankDetails'
                    }
                },
                { $match: matchStage },
                { $sort: { createdAt: -1 } },
                {
                    $facet: {
                        metadata: [
                            { $count: 'total' },
                            {
                                $addFields: {
                                    currentPage: page,
                                    totalPages: {
                                        $ceil: { $divide: ['$total', limit] }
                                    }
                                }
                            }
                        ],
                        data: [
                            { $match: { name: { $ne: 'other' } } },
                            { $skip: (page - 1) * limit },
                            { $limit: limit }
                        ]
                    }
                }
            ];
    
            const result = await Company.aggregate(aggregatePipeline);
            let companies = result[0]?.data || [];
            companies = companies.filter(company => company.createdBy.toString() === req.user.userId);
            
            const meta = result[0]?.metadata[0] || {
                total: 0,
                currentPage: page,
                totalPages: 0
            };
    
            return res.status(200).json(
                ApiResponse.success('Companies retrieved successfully', {
                    companies,
                    currentPage: meta.currentPage,
                    totalPages: meta.totalPages,
                    totalCompanies: meta.total
                })
            );
        } catch (error) {
            logger.error('Get Companies Error:', error);
            return res.status(500).json(ApiResponse.serverError(error.message));
        }
    }

    async updateCompany(req, res) {
        try {
            const companyData = buildNestedObject(req.body);
    
            const company = await Company.findById(req.params.id).populate('bankDetails');
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
            }

            if (company.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to update this company')
                );
            }

            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }
    
            if (req.files && Object.keys(req.files).length > 0) {
    
                for (const fieldName in req.files) {
                    const files = req.files[fieldName];
    
                    for (const file of files) {
                        const uploadResult = await uploadToStorage(file);
    
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

            const bankDetails = [];
            // Update bank details if provided
            if (companyData.bankDetails) {
                for (const bankData of companyData.bankDetails) {
                    let bank = await Bank.findOne({accountNumber: bankData.accountNumber}); 
                    if(bank) {
                        if(bank.createdBy.toString() !== req.user.userId) {
                            continue;
                        }
                        Object.assign(bank, bankData);
                        await bank.save();
                        bankDetails.push({_id: bank._id});
                    } else {
                        bankData.createdBy = req.user.userId;
                        // Create new bank record and link to company
                        const newBank = new Bank(bankData);
                        await newBank.save();
                        bankDetails.push({_id: newBank._id});
                    }
                }
            }
            
            //convert slabs object to array
            if(companyData.slabs) {
                companyData.slabs = Object.values(companyData.slabs);
            }
            companyData.bankDetails = bankDetails;
            // Update other company data
            Object.assign(company, companyData);
            
            const updatedCompany = await company.save();
            await updatedCompany.populate('bankDetails');
    
            return res.status(200).json(
                ApiResponse.success('Company updated successfully', updatedCompany)
            );
        } catch (error) {
            logger.error('Update Company Error:', error);
            return res.status(500).json(ApiResponse.serverError(error.message));
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

            if (company.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to delete this company')
                );
            }

            //delete banks
            await Bank.deleteMany({ _id: { $in: company.bankDetails.map(bank => bank._id) }, createdBy: req.user.userId });

            //delete company
            await Company.findByIdAndDelete(req.params.id);
            return res.status(200).json(
                ApiResponse.success('Company deleted successfully')
            );
        } catch (error) {
            logger.error('Delete Company Error:', error);
            return res.status(500).json(
                ApiResponse.serverError(error.message)
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

            if (company.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to update the status of this company')
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
                ApiResponse.serverError(error.message)
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

            if (company.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to add documents to this company')
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
                ApiResponse.serverError(error.message)
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

            if (company.createdBy.toString() !== req.user.userId) {
                return res.status(403).json(
                    ApiResponse.error('Unauthorized, you are not allowed to delete this document')
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
                ApiResponse.serverError(error.message)
            );
        }
    }
}

module.exports = new CompanyController(); 