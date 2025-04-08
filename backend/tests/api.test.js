const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Base URL for API requests
const BASE_URL = 'http://localhost:5000/api';

// Test data
const testData = {
  // Auth test data
  user: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!@#'
  },
  
  // Bank test data
  bank: {
    name: 'Test Bank',
    accountNumber: '1234567890',
    ifscCode: 'TEST0001',
    branch: 'Test Branch',
    address: '123 Test Street, Test City',
    contactPerson: 'Test Contact',
    email: 'bank@example.com',
    phone: '1234567890'
  },
  
  // Company test data
  company: {
    name: 'Test Company',
    registrationNumber: 'REG123456',
    address: '456 Company Street, Test City',
    contactPerson: {
      name: 'Company Contact',
      email: 'contact@example.com',
      phone: '9876543210',
      idProof: {
        type: 'Aadhar',
        number: '123456789012'
      }
    },
    businessDetails: {
      type: 'Private Limited',
      industry: 'Technology',
      registrationDate: '2020-01-01'
    },
    bankDetails: [
      {
        bankName: 'Test Bank 1',
        accountNumber: '1111111111',
        ifscCode: 'TEST0001',
        accountType: 'Savings'
      },
      {
        bankName: 'Test Bank 2',
        accountNumber: '2222222222',
        ifscCode: 'TEST0002',
        accountType: 'Current'
      }
    ]
  },
  
  // Expense test data
  expense: {
    title: 'Test Expense',
    amount: 1000,
    date: new Date().toISOString().split('T')[0],
    category: 'Office Supplies',
    description: 'Test expense description',
    company: '', // Will be set dynamically
    bank: '' // Will be set dynamically
  },
  
  // Task test data
  task: {
    title: 'Test Task',
    description: 'Test task description',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'pending',
    assignedTo: '', // Will be set dynamically
    company: '' // Will be set dynamically
  }
};

// Global variables to store IDs and tokens
let authToken = '';
let refreshToken = '';
let userId = '';
let bankId = '';
let companyId = '';
let expenseId = '';
let taskId = '';
let documentId = '';
let commentId = '';
let attachmentId = '';

// Helper function to create form data with files
const createFormData = (data, fileFields = {}) => {
  const formData = new FormData();
  
  // Add regular fields
  Object.keys(data).forEach(key => {
    if (typeof data[key] === 'object' && !Array.isArray(data[key])) {
      Object.keys(data[key]).forEach(nestedKey => {
        if (typeof data[key][nestedKey] === 'object') {
          Object.keys(data[key][nestedKey]).forEach(deepKey => {
            if (deepKey !== 'document') {
              formData.append(`${key}.${nestedKey}.${deepKey}`, data[key][nestedKey][deepKey]);
            }
          });
        } else {
          formData.append(`${key}.${nestedKey}`, data[key][nestedKey]);
        }
      });
    } else if (Array.isArray(data[key])) {
      data[key].forEach((item, index) => {
        Object.keys(item).forEach(itemKey => {
          if (itemKey !== 'bankStatement' && itemKey !== 'cancelledCheque') {
            formData.append(`${key}[${index}].${itemKey}`, item[itemKey]);
          }
        });
      });
    } else {
      formData.append(key, data[key]);
    }
  });
  
  // Add files if provided
  Object.keys(fileFields).forEach(key => {
    if (fileFields[key]) {
      formData.append(key, fileFields[key]);
    }
  });
  
  return formData;
};

// Helper function to create a test file
const createTestFile = (filename) => {
  const filePath = path.join(__dirname, filename);
  fs.writeFileSync(filePath, 'Test file content');
  return fs.createReadStream(filePath);
};

// Helper function to clean up test files
const cleanupTestFiles = (files) => {
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

describe('API Tests', () => {
  // Test files to clean up
  const testFiles = [
    'test-document.pdf',
    'test-receipt.pdf',
    'test-attachment.pdf',
    'test-id-proof.pdf',
    'test-registration.pdf',
    'test-bank-statement.pdf',
    'test-cancelled-cheque.pdf'
  ];
  
  // Clean up test files after all tests
  afterAll(() => {
    cleanupTestFiles(testFiles);
  });
  
  // Auth API Tests
  describe('Auth API', () => {
    test('Register a new user', async () => {
      const response = await axios.post(`${BASE_URL}/auth/register`, testData.user);
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('_id');
      userId = response.data.data._id;
    });
    
    test('Login with registered user', async () => {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: testData.user.email,
        password: testData.user.password
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('token');
      expect(response.data.data).toHaveProperty('refreshToken');
      authToken = response.data.data.token;
      refreshToken = response.data.data.refreshToken;
    });
    
    test('Refresh token', async () => {
      const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {
        refreshToken
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('token');
      authToken = response.data.data.token;
    });
    
    test('Forgot password', async () => {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: testData.user.email
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('Reset password', async () => {
      // In a real test, you would get a valid token from the forgot password email
      const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: 'test-token',
        password: 'NewTest123!@#'
      });
      // This will likely fail with a 400 status since we're using a fake token
      expect(response.status).toBe(400);
    });
    
    test('Logout', async () => {
      const response = await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
  
  // Bank API Tests
  describe('Bank API', () => {
    // Create a test document file
    const testDocument = createTestFile('test-document.pdf');
    
    test('Create a new bank', async () => {
      const formData = createFormData(testData.bank, {
        documents: testDocument
      });
      
      const response = await axios.post(
        `${BASE_URL}/bank`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('_id');
      bankId = response.data.data._id;
      
      // Update test data with the bank ID
      testData.expense.bank = bankId;
    });
    
    test('Get all banks', async () => {
      const response = await axios.get(
        `${BASE_URL}/bank`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
    
    test('Get a single bank', async () => {
      const response = await axios.get(
        `${BASE_URL}/bank/${bankId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data._id).toBe(bankId);
    });
    
    test('Update a bank', async () => {
      const updatedBank = { ...testData.bank, name: 'Updated Test Bank' };
      const formData = createFormData(updatedBank, {
        documents: testDocument
      });
      
      const response = await axios.put(
        `${BASE_URL}/bank/${bankId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Test Bank');
    });
    
    test('Add documents to a bank', async () => {
      const formData = new FormData();
      formData.append('documents', testDocument);
      
      const response = await axios.post(
        `${BASE_URL}/bank/${bankId}/documents`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.documents.length).toBeGreaterThan(0);
      documentId = response.data.data.documents[0]._id;
    });
    
    test('Delete a document from a bank', async () => {
      const response = await axios.delete(
        `${BASE_URL}/bank/${bankId}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('Delete a bank', async () => {
      const response = await axios.delete(
        `${BASE_URL}/bank/${bankId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
  
  // Company API Tests
  describe('Company API', () => {
    // Create test files
    const idProofFile = createTestFile('test-id-proof.pdf');
    const registrationFile = createTestFile('test-registration.pdf');
    const bankStatementFile = createTestFile('test-bank-statement.pdf');
    const cancelledChequeFile = createTestFile('test-cancelled-cheque.pdf');
    
    test('Create a new company', async () => {
      const formData = new FormData();
      
      // Add regular fields
      formData.append('name', testData.company.name);
      formData.append('registrationNumber', testData.company.registrationNumber);
      formData.append('address', testData.company.address);
      
      // Add contact person fields
      formData.append('contactPerson.name', testData.company.contactPerson.name);
      formData.append('contactPerson.email', testData.company.contactPerson.email);
      formData.append('contactPerson.phone', testData.company.contactPerson.phone);
      formData.append('contactPerson.idProof.type', testData.company.contactPerson.idProof.type);
      formData.append('contactPerson.idProof.number', testData.company.contactPerson.idProof.number);
      formData.append('contactPerson.idProof.document', idProofFile);
      
      // Add business details fields
      formData.append('businessDetails.type', testData.company.businessDetails.type);
      formData.append('businessDetails.industry', testData.company.businessDetails.industry);
      formData.append('businessDetails.registrationDate', testData.company.businessDetails.registrationDate);
      formData.append('businessDetails.registrationCertificate', registrationFile);
      
      // Add bank details
      testData.company.bankDetails.forEach((bank, index) => {
        formData.append(`bankDetails[${index}].bankName`, bank.bankName);
        formData.append(`bankDetails[${index}].accountNumber`, bank.accountNumber);
        formData.append(`bankDetails[${index}].ifscCode`, bank.ifscCode);
        formData.append(`bankDetails[${index}].accountType`, bank.accountType);
        formData.append(`bankDetails[${index}].bankStatement`, bankStatementFile);
        formData.append(`bankDetails[${index}].cancelledCheque`, cancelledChequeFile);
      });
      
      const response = await axios.post(
        `${BASE_URL}/company`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('_id');
      companyId = response.data.data._id;
      
      // Update test data with the company ID
      testData.expense.company = companyId;
      testData.task.company = companyId;
    });
    
    test('Get all companies', async () => {
      const response = await axios.get(
        `${BASE_URL}/company`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
    
    test('Get a single company', async () => {
      const response = await axios.get(
        `${BASE_URL}/company/${companyId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data._id).toBe(companyId);
    });
    
    test('Update a company', async () => {
      const updatedCompany = { ...testData.company, name: 'Updated Test Company' };
      const formData = new FormData();
      
      // Add regular fields
      formData.append('name', updatedCompany.name);
      formData.append('registrationNumber', updatedCompany.registrationNumber);
      formData.append('address', updatedCompany.address);
      
      // Add contact person fields
      formData.append('contactPerson.name', updatedCompany.contactPerson.name);
      formData.append('contactPerson.email', updatedCompany.contactPerson.email);
      formData.append('contactPerson.phone', updatedCompany.contactPerson.phone);
      formData.append('contactPerson.idProof.type', updatedCompany.contactPerson.idProof.type);
      formData.append('contactPerson.idProof.number', updatedCompany.contactPerson.idProof.number);
      formData.append('contactPerson.idProof.document', idProofFile);
      
      // Add business details fields
      formData.append('businessDetails.type', updatedCompany.businessDetails.type);
      formData.append('businessDetails.industry', updatedCompany.businessDetails.industry);
      formData.append('businessDetails.registrationDate', updatedCompany.businessDetails.registrationDate);
      formData.append('businessDetails.registrationCertificate', registrationFile);
      
      // Add bank details
      updatedCompany.bankDetails.forEach((bank, index) => {
        formData.append(`bankDetails[${index}].bankName`, bank.bankName);
        formData.append(`bankDetails[${index}].accountNumber`, bank.accountNumber);
        formData.append(`bankDetails[${index}].ifscCode`, bank.ifscCode);
        formData.append(`bankDetails[${index}].accountType`, bank.accountType);
        formData.append(`bankDetails[${index}].bankStatement`, bankStatementFile);
        formData.append(`bankDetails[${index}].cancelledCheque`, cancelledChequeFile);
      });
      
      const response = await axios.put(
        `${BASE_URL}/company/${companyId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe('Updated Test Company');
    });
    
    test('Add documents to a company', async () => {
      const formData = new FormData();
      formData.append('documents', idProofFile);
      
      const response = await axios.post(
        `${BASE_URL}/company/${companyId}/documents`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.documents.length).toBeGreaterThan(0);
      documentId = response.data.data.documents[0]._id;
    });
    
    test('Delete a document from a company', async () => {
      const response = await axios.delete(
        `${BASE_URL}/company/${companyId}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('Delete a company', async () => {
      const response = await axios.delete(
        `${BASE_URL}/company/${companyId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
  
  // Expense API Tests
  describe('Expense API', () => {
    // Create a test receipt file
    const testReceipt = createTestFile('test-receipt.pdf');
    
    test('Create a new expense', async () => {
      const formData = createFormData(testData.expense, {
        receipts: testReceipt
      });
      
      const response = await axios.post(
        `${BASE_URL}/expense`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('_id');
      expenseId = response.data.data._id;
    });
    
    test('Get all expenses', async () => {
      const response = await axios.get(
        `${BASE_URL}/expense`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
    
    test('Get a single expense', async () => {
      const response = await axios.get(
        `${BASE_URL}/expense/${expenseId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data._id).toBe(expenseId);
    });
    
    test('Update an expense', async () => {
      const updatedExpense = { ...testData.expense, title: 'Updated Test Expense' };
      const formData = createFormData(updatedExpense, {
        receipts: testReceipt
      });
      
      const response = await axios.put(
        `${BASE_URL}/expense/${expenseId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe('Updated Test Expense');
    });
    
    test('Add receipts to an expense', async () => {
      const formData = new FormData();
      formData.append('receipts', testReceipt);
      
      const response = await axios.post(
        `${BASE_URL}/expense/${expenseId}/receipts`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.receipts.length).toBeGreaterThan(0);
      documentId = response.data.data.receipts[0]._id;
    });
    
    test('Delete a receipt from an expense', async () => {
      const response = await axios.delete(
        `${BASE_URL}/expense/${expenseId}/receipts/${documentId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('Delete an expense', async () => {
      const response = await axios.delete(
        `${BASE_URL}/expense/${expenseId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
  
  // Task API Tests
  describe('Task API', () => {
    // Create a test attachment file
    const testAttachment = createTestFile('test-attachment.pdf');
    
    test('Create a new task', async () => {
      const formData = createFormData(testData.task, {
        attachments: testAttachment
      });
      
      const response = await axios.post(
        `${BASE_URL}/task`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('_id');
      taskId = response.data.data._id;
    });
    
    test('Get all tasks', async () => {
      const response = await axios.get(
        `${BASE_URL}/task`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });
    
    test('Get a single task', async () => {
      const response = await axios.get(
        `${BASE_URL}/task/${taskId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data._id).toBe(taskId);
    });
    
    test('Update a task', async () => {
      const updatedTask = { ...testData.task, title: 'Updated Test Task' };
      const formData = createFormData(updatedTask, {
        attachments: testAttachment
      });
      
      const response = await axios.put(
        `${BASE_URL}/task/${taskId}`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.title).toBe('Updated Test Task');
    });
    
    test('Update task status', async () => {
      const response = await axios.patch(
        `${BASE_URL}/task/${taskId}/status`,
        { status: 'in-progress' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('in-progress');
    });
    
    test('Add a comment to a task', async () => {
      const response = await axios.post(
        `${BASE_URL}/task/${taskId}/comments`,
        { comment: 'Test comment' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.comments.length).toBeGreaterThan(0);
      commentId = response.data.data.comments[0]._id;
    });
    
    test('Delete a comment from a task', async () => {
      const response = await axios.delete(
        `${BASE_URL}/task/${taskId}/comments/${commentId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('Add attachments to a task', async () => {
      const formData = new FormData();
      formData.append('attachments', testAttachment);
      
      const response = await axios.post(
        `${BASE_URL}/task/${taskId}/attachments`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            Authorization: `Bearer ${authToken}`
          }
        }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.attachments.length).toBeGreaterThan(0);
      attachmentId = response.data.data.attachments[0]._id;
    });
    
    test('Delete an attachment from a task', async () => {
      const response = await axios.delete(
        `${BASE_URL}/task/${taskId}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
    
    test('Delete a task', async () => {
      const response = await axios.delete(
        `${BASE_URL}/task/${taskId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });
});