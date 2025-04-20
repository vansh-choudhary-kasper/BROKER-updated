const Company = require('../models/Company');
const User = require('../models/User');
const { calculateCommission } = require('../utils/commissionCalculator');

const validateTransaction = (transaction) => {
  const requiredFields = ['date', 'companyName', 'bankName', 'accountNo', 'creditAmount'];
  const missingFields = requiredFields.filter(field => !transaction[field]);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  if (isNaN(transaction.creditAmount) || transaction.creditAmount <= 0) {
    throw new Error('Credit amount must be a positive number');
  }

  const [day, month, year] = transaction.date.split('-');
  const date = new Date(`${year}-${month}-${day}`);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }

  // Additional validation for statement date
  const today = new Date();
  if (date > today) {
    throw new Error('Transaction date cannot be in the future');
  }
};

const validateStatementDate = (statementDate) => {
  const date = new Date(statementDate);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid statement date format');
  }

  const today = new Date();
  if (date > today) {
    throw new Error('Statement date cannot be in the future');
  }

  return date;
};

const uploadStatement = async (req, res) => {
  try {
    const { transactions, fileType, fileName, statementDate } = req.body;
    const userId = req.user.userId;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      throw new Error('No transactions provided');
    }

    if (!['csv', 'xml'].includes(fileType)) {
      throw new Error('Invalid file type. Must be CSV or XML');
    }

    if (!fileName) {
      throw new Error('File name is required');
    }

    if (!statementDate) {
      throw new Error('Statement date is required');
    }

    // Validate statement date
    const validatedDate = validateStatementDate(statementDate);

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    console.log("transactions", transactions);
    console.log("user.statementHistory", user.statementHistory);
    // Check for duplicate transactions
    const isDuplicate = transactions.some(newTrans => {
      return user.statementHistory.some(statement =>
        statement.originalTransactions.some(existingTrans =>
          existingTrans.date === newTrans.date &&
          existingTrans.companyName === newTrans.companyName &&
          existingTrans.creditAmount === newTrans.creditAmount &&
          existingTrans.accountNo === newTrans.accountNo
        )
      );
    });

    if (isDuplicate) {
      throw new Error('Duplicate transactions detected. These transactions have already been uploaded.');
    }

    // Validate all transactions
    transactions.forEach(validateTransaction);

    // Create new statement history entry
    const statementHistory = {
      fileName,
      fileType,
      uploadDate: validatedDate,
      status: 'pending',
      originalTransactions: transactions.map(t => ({
        date: t.date,
        companyName: t.companyName,
        bankName: t.bankName,
        accountNo: t.accountNo,
        creditAmount: t.creditAmount
      })),
      companySummaries: [],
      totalAmount: 0,
      totalCommission: 0
    };

    // Group transactions by company
    const companyTransactions = {};
    transactions.forEach(transaction => {
      const companyName = transaction.companyName;
      if (!companyTransactions[companyName]) {
        companyTransactions[companyName] = [];
      }
      companyTransactions[companyName].push({
        ...transaction,
        date: new Date(transaction.date),
        type: 'credit',
        amount: transaction.creditAmount
      });
    });

    // Process each company's transactions
    for (const [companyName, companyTrans] of Object.entries(companyTransactions)) {
      // Find the company
      const company = await Company.findOne({ name: companyName });
      if (!company) {
        throw new Error(`Company not found: ${companyName}`);
      }

      // Calculate total amount and find applicable slab
      const totalAmount = companyTrans.reduce((sum, t) => sum + t.amount, 0);
      const applicableSlab = company.slabs.find(slab =>
        totalAmount >= slab.minAmount &&
        (slab.maxAmount === 0 || totalAmount < slab.maxAmount)
      );

      if (!applicableSlab) {
        throw new Error(`No applicable commission slab found for company: ${companyName}`);
      }

      const commission = (totalAmount * applicableSlab.commission) / 100;

      // Add company summary to statement history
      statementHistory.companySummaries.push({
        company: company._id,
        totalAmount,
        commission,
        applicableSlab: {
          minAmount: applicableSlab.minAmount,
          maxAmount: applicableSlab.maxAmount,
          commission: applicableSlab.commission
        }
      });

      // Update statement totals
      statementHistory.totalAmount += totalAmount;
      statementHistory.totalCommission += commission;
    }

    // Set status to processed and save to user's history
    statementHistory.status = 'processed';
    user.statementHistory.push(statementHistory);
    const statementMonth = validatedDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const statementYear = validatedDate.getFullYear().toString(); // make sure it's a string!

    let yearData = user.totalAmount.get(statementYear);

    if (!yearData) {
      yearData = new Map();
    }

    const existingAmount = yearData.get(statementMonth) || 0;
    yearData.set(statementMonth, existingAmount + statementHistory.totalCommission);

    // Save back the year map
    user.totalAmount.set(statementYear, yearData);

    function convertMapToObject(map) {
      const obj = {};
      for (const [key, val] of map.entries()) {
        obj[key] = val instanceof Map ? convertMapToObject(val) : val;
      }
      return obj;
    }

    user.totalAmount = convertMapToObject(user.totalAmount);
    await user.save();

    // Return the populated statement
    const populatedUser = await User.findById(userId)
      .populate('statementHistory.companySummaries.company', 'name');

    const latestStatement = populatedUser.statementHistory[populatedUser.statementHistory.length - 1];

    res.status(201).json(latestStatement);
  } catch (error) {
    console.error('Error processing statement:', error);
    res.status(400).json({ message: error.message });
  }
};

const getStatements = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('statementHistory.companySummaries.company', 'name')
      .select('statementHistory');

    let statements = user?.statementHistory?.sort((a, b) =>
      new Date(b.uploadDate) - new Date(a.uploadDate)
    );

    if (!statements) {
      statements = [];
    }

    res.json(statements);
  } catch (error) {
    console.error('Error fetching statements:', error);
    res.status(500).json({ message: 'Failed to fetch statements' });
  }
};

const getStatementDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('statementHistory.companySummaries.company', 'name');

    const statement = user.statementHistory.id(req.params.id);
    if (!statement) {
      return res.status(404).json({ message: 'Statement not found' });
    }

    res.json(statement);
  } catch (error) {
    console.error('Error fetching statement details:', error);
    res.status(500).json({ message: 'Failed to fetch statement details' });
  }
};

module.exports = {
  uploadStatement,
  getStatements,
  getStatementDetails
}; 