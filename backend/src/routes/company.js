const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/fileUpload');

// Protect all company routes
router.use(protect);

// Create a new company
router.post('/',
  upload.fields([
    { name: 'contactPerson.idProof.document', maxCount: 1 },
    { name: 'businessDetails.registrationCertificate', maxCount: 1 },
    { name: 'bankDetails[0].bankStatement', maxCount: 1 },
    { name: 'bankDetails[0].cancelledCheque', maxCount: 1 },
    { name: 'bankDetails[1].bankStatement', maxCount: 1 },
    { name: 'bankDetails[1].cancelledCheque', maxCount: 1 },
    { name: 'bankDetails[2].bankStatement', maxCount: 1 },
    { name: 'bankDetails[2].cancelledCheque', maxCount: 1 },
    { name: 'documents.incorporationCertificate', maxCount: 1 },
    { name: 'documents.memorandumOfAssociation', maxCount: 1 },
    { name: 'documents.articlesOfAssociation', maxCount: 1 },
    { name: 'documents.boardResolution', maxCount: 1 },
    { name: 'documents.taxRegistration', maxCount: 1 },
    { name: 'documents.otherDocuments', maxCount: 10 }
  ]),
  handleUploadError,
  companyController.createCompany
);

// Get all companies with pagination and search
router.get('/', companyController.getCompanies);

// Update a company
router.put('/:id',
  upload.fields([
    { name: 'contactPerson.idProof.document', maxCount: 1 },
    { name: 'businessDetails.registrationCertificate', maxCount: 1 },
    { name: 'bankDetails[0].bankStatement', maxCount: 1 },
    { name: 'bankDetails[0].cancelledCheque', maxCount: 1 },
    { name: 'bankDetails[1].bankStatement', maxCount: 1 },
    { name: 'bankDetails[1].cancelledCheque', maxCount: 1 },
    { name: 'bankDetails[2].bankStatement', maxCount: 1 },
    { name: 'bankDetails[2].cancelledCheque', maxCount: 1 },
    { name: 'documents.incorporationCertificate', maxCount: 1 },
    { name: 'documents.memorandumOfAssociation', maxCount: 1 },
    { name: 'documents.articlesOfAssociation', maxCount: 1 },
    { name: 'documents.boardResolution', maxCount: 1 },
    { name: 'documents.taxRegistration', maxCount: 1 },
    { name: 'documents.otherDocuments', maxCount: 10 }
  ]),
  handleUploadError,
  companyController.updateCompany
);

// Delete a company
router.delete('/:id', companyController.deleteCompany);

// Add documents to a company
router.post('/:id/documents',
  upload.array('documents', 10),
  handleUploadError,
  companyController.addDocuments
);

// Delete a document from a company
router.delete('/:id/documents/:documentId',
  companyController.deleteDocument
);

module.exports = router; 