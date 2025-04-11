const BankStatement = require('../models/BankStatement');
const Bank = require('../models/Bank');
const csv = require('csv-parser');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Upload bank statement
exports.uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { bankId } = req.body;
    const fileType = path.extname(req.file.originalname).toLowerCase().slice(1);

    if (!['csv', 'xml'].includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only CSV and XML files are allowed.'
      });
    }

    // Verify bank exists
    const bank = await Bank.findById(bankId);
    if (!bank) {
      return res.status(404).json({
        success: false,
        message: 'Bank not found'
      });
    }

    // Create bank statement record
    const statement = new BankStatement({
      bank: bankId,
      fileName: req.file.originalname,
      fileType,
      filePath: req.file.path,
      status: 'pending'
    });

    await statement.save();

    // Process the file asynchronously
    processStatement(statement._id, req.file.path, fileType, bank);

    res.status(201).json({
      success: true,
      message: 'Statement uploaded successfully',
      data: statement
    });
  } catch (error) {
    logger.error('Error uploading statement:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading statement',
      error: error.message
    });
  }
};

// Get statements for a bank
exports.getBankStatements = async (req, res) => {
  try {
    const { bankId } = req.params;
    const statements = await BankStatement.find({ bank: bankId })
      .sort({ uploadDate: -1 });

    res.json({
      success: true,
      data: statements
    });
  } catch (error) {
    logger.error('Error fetching statements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statements',
      error: error.message
    });
  }
};

// Download statement
exports.downloadStatement = async (req, res) => {
  try {
    const { statementId } = req.params;
    const statement = await BankStatement.findById(statementId);

    if (!statement) {
      return res.status(404).json({
        success: false,
        message: 'Statement not found'
      });
    }

    res.download(statement.filePath, statement.fileName);
  } catch (error) {
    logger.error('Error downloading statement:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading statement',
      error: error.message
    });
  }
};

// Process statement file
async function processStatement(statementId, filePath, fileType, bank) {
  try {
    let transactions = [];

    if (fileType === 'csv') {
      transactions = await processCSV(filePath, bank);
    } else if (fileType === 'xml') {
      transactions = await processXML(filePath, bank);
    }

    // Update statement with processed data
    await BankStatement.findByIdAndUpdate(statementId, {
      processedData: transactions,
      status: 'processed'
    });

    logger.info(`Statement ${statementId} processed successfully`);
  } catch (error) {
    logger.error(`Error processing statement ${statementId}:`, error);
    await BankStatement.findByIdAndUpdate(statementId, {
      status: 'failed',
      error: error.message
    });
  }
}

// Process CSV file
async function processCSV(filePath, bank) {
  return new Promise((resolve, reject) => {
    const transactions = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Verify if transaction belongs to this bank
        if (row.accountNumber === bank.accountNumber && 
            row.bankName.toLowerCase() === bank.bankName.toLowerCase()) {
          transactions.push({
            date: new Date(row.date),
            description: row.description,
            type: row.type.toLowerCase(),
            amount: parseFloat(row.amount),
            balance: parseFloat(row.balance),
            reference: row.reference
          });
        }
      })
      .on('end', () => resolve(transactions))
      .on('error', reject);
  });
}

// Process XML file
async function processXML(filePath, bank) {
  return new Promise((resolve, reject) => {
    const parser = new xml2js.Parser();
    fs.readFile(filePath, (err, data) => {
      if (err) return reject(err);

      parser.parseString(data, (err, result) => {
        if (err) return reject(err);

        const transactions = [];
        // Adjust the XML path according to your XML structure
        const transactionNodes = result.root.transactions || [];
        
        transactionNodes.forEach(node => {
          // Verify if transaction belongs to this bank
          if (node.accountNumber === bank.accountNumber && 
              node.bankName.toLowerCase() === bank.bankName.toLowerCase()) {
            transactions.push({
              date: new Date(node.date),
              description: node.description,
              type: node.type.toLowerCase(),
              amount: parseFloat(node.amount),
              balance: parseFloat(node.balance),
              reference: node.reference
            });
          }
        });

        resolve(transactions);
      });
    });
  });
} 