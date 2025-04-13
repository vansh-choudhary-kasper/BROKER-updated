const Bank = require('../models/Bank');
const Company = require('../models/Company');
const csv = require('csv-parser');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Upload bank statement
exports.uploadStatement = async (req, res) => {
  try {
    const transactions = req.body.transactions;
    for (const transaction of transactions) {
      // Verify bank exists
      console.log(transaction.accountNo);
      if (transaction.accountNo !== null || transaction.accountNo !== undefined) {
        transaction.accountNo = Number(transaction.accountNo).toLocaleString('fullwide', { useGrouping: false });
      }
      console.log(transaction.accountNo, transaction.bankName);
      let bank = await Bank.findOne({ accountNumber: transaction.accountNo, bankName: transaction.bankName });
      if (!bank) {
        continue;
      }

      // search for company
      let company = await Company.findOne({
        name: { $regex: new RegExp(transaction.companyName, 'i') }
      });
      if (!company) {
        const requiredFields = {
          name: 'other',
          type: 'client', // or 'provider' or 'both'
          contactPerson: {
            name: 'other',
            email: 'other@other.com',
            phone: '+91-9876543210'
          },
          businessDetails: {
            gstNumber: '27AAACB1234F1Z5',
            panNumber: 'AAACB1234F'
          }
        };
        const otherCompany = await Company.findOne({ name: 'other' });
        if (!otherCompany) {
          company = await Company.create(requiredFields);
        } else {
          company = otherCompany;
        }
      }

      function parseCustomDate(dateStr) {
        const [day, month, year] = dateStr.split("-");
        return new Date(`${year}-${month}-${day}`);
      }
      if (transaction.date !== null || transaction.date !== undefined) {
        const rawDate = transaction.date;
        const date = parseCustomDate(rawDate);
        transaction.date = date;
      }

      function calculateCommission(amount) {
        return amount * 0.01;
      }
      
      // Create bank statement record
      bank.transactions.push({
        date: transaction.date,
        companyName: company,
        amount: transaction.amount,
        type: transaction.creditDebit,
        date: isNaN(new Date(transaction.date)) ? new Date() : new Date(transaction.date)
      });
      console.log("bank", bank);
      await bank.save();
    };

    console.log("Statements uploaded successfully");
    res.status(201).json({
      success: true,
      message: 'Statements uploaded successfully',
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