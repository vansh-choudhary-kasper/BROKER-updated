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
            console.log(req.files);
    
            // Handle file uploads
            if (req.files && Object.keys(req.files).length > 0) {
                console.log('Files found:', req.files);
                for (const fieldName in req.files) {
                    console.log('Processing field:', fieldName);
                    const files = req.files[fieldName];
    
                    for (const file of files) {
                        console.log('Processing file:', file.originalname);
                        const uploadResult = await uploadToStorage(file);
                        console.log('Upload result:', uploadResult);
    
                        const isDocument = file.fieldname.startsWith('documents.');
                        const docKey = file.fieldname.split('.')[1];
                        console.log('Is document:', isDocument, 'Document key:', docKey);
    
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
    
                        console.log('Document data:', docData);
                        if (isDocument) {
                            if (docKey === 'otherDocuments') {
                                console.log('Adding to otherDocuments array');
                                if (!companyData.documents.otherDocuments) {
                                    companyData.documents.otherDocuments = [];
                                }
                                companyData.documents.otherDocuments.push(docData);
                            } else {
                                console.log('Setting document for key:', docKey);
                                companyData.documents[docKey] = docData;
                            }
                        } else {
                            // Set flat or nested non-document file field
                            const flatKey = file.fieldname;
                            console.log('Setting non-document field:', flatKey);
                            companyData[flatKey] = uploadResult.url;
                        }
                    }
                }
                console.log('Final company data:', companyData);
            }
    
            // Validate company data
            const validationResult = validateCompanyData(companyData);
            console.log(validationResult);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }
    
            // Create and save new company
            const bankDetails = [];
            for (const bank of companyData.bankDetails) {
                try {
                    console.log(bank);
                    const newBank = new Bank(bank);
                    await newBank.save();
                    bankDetails.push({_id: newBank._id});
                } catch (error) {
                    logger.error('Create Bank Error:', error);
                }
            }
            companyData.bankDetails = bankDetails;
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
                                ]
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
            const companies = result[0]?.data || [];
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
            return res.status(500).json(ApiResponse.serverError());
        }
    }
    

    async getCompany(req, res) {
        try {
            const company = await Company.findById(req.params.id).populate('bankDetails');
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
    
            const company = await Company.findById(req.params.id).populate('bankDetails');
            if (!company) {
                return res.status(404).json({ message: 'Company not found' });
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
    
            const validationResult = validateCompanyData(companyData);
            if (!validationResult.isValid) {
                return res.status(400).json({ message: validationResult.errors });
            }

            // Update bank details if provided
            if (companyData.bankDetails) {
                for (const bankData of companyData.bankDetails) {
                    if (bankData._id) {
                        // Update existing bank record
                        await Bank.findByIdAndUpdate(bankData._id, bankData);
                    } else {
                        // Create new bank record and link to company
                        const newBank = new Bank(bankData);
                        await newBank.save();
                        company.bankDetails.push(newBank._id);
                    }
                }
            }
            
            // Update other company data
            Object.assign(company, companyData);
            
            const updatedCompany = await company.save();
            await updatedCompany.populate('bankDetails');
    
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
            const company = await Company.findById(req.params.id);
            if (!company) {
                return res.status(404).json(
                    ApiResponse.notFound('Company not found')
                );
            }

            //delete banks
            await Bank.deleteMany({ _id: { $in: company.bankDetails.map(bank => bank._id) } });

            //delete company
            await Company.findByIdAndDelete(req.params.id);
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