const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/fileUpload');

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
    { name: 'bankDetails[2].cancelledCheque', maxCount: 1 }
  ]),
  companyController.createCompany
);

// Get all companies with pagination and search
router.get('/', companyController.getCompanies);

// Get a single company
router.get('/:id', companyController.getCompany);

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
    { name: 'bankDetails[2].cancelledCheque', maxCount: 1 }
  ]),
  companyController.updateCompany
);

// Delete a company
router.delete('/:id', companyController.deleteCompany);

// Add documents to a company
router.post('/:id/documents',
  upload.array('documents', 5),
  companyController.addDocuments
);

// Delete a document from a company
router.delete('/:id/documents/:documentId',
  companyController.deleteDocument
);

module.exports = router; 