const validateCompanyData = (data) => {
  const errors = [];

  // Basic company information
  if (!data.name) {
    errors.push('Company name is required');
  }
  if (!data.type || !['client', 'provider', 'both'].includes(data.type)) {
    errors.push('Valid company type is required (client, provider, or both)');
  }

  // Contact person validation
  if (!data.contactPerson) {
    errors.push('Contact person details are required');
  } else {
    if (!data.contactPerson.name) {
      errors.push('Contact person name is required');
    }
    if (!data.contactPerson.email) {
      errors.push('Contact person email is required');
    } else if (!isValidEmail(data.contactPerson.email)) {
      errors.push('Invalid contact person email format');
    }
    if (!data.contactPerson.phone) {
      errors.push('Contact person phone is required');
    } else if (!isValidPhone(data.contactPerson.phone)) {
      errors.push('Invalid contact person phone format');
    }
  }

  // Business details validation
  if (!data.businessDetails) {
    errors.push('Business details are required');
  } else {
    if (!data.businessDetails.gstNumber) {
      errors.push('GST number is required');
    } else if (!isValidGST(data.businessDetails.gstNumber)) {
      errors.push('Invalid GST number format');
    }
    if (!data.businessDetails.panNumber) {
      errors.push('PAN number is required');
    } else if (!isValidPAN(data.businessDetails.panNumber)) {
      errors.push('Invalid PAN number format');
    }
  }

  // Address validation
  if (!data.address) {
    errors.push('Address details are required');
  } else {
    if (!data.address.street) {
      errors.push('Street address is required');
    }
    if (!data.address.city) {
      errors.push('City is required');
    }
    if (!data.address.state) {
      errors.push('State is required');
    }
    if (!data.address.country) {
      errors.push('Country is required');
    }
    if (!data.address.pincode) {
      errors.push('Pincode is required');
    } else if (!isValidPincode(data.address.pincode)) {
      errors.push('Invalid pincode format');
    }
  }

  // Bank details validation
  if (data.bankDetails && data.bankDetails.length > 0) {
    data.bankDetails.forEach((bank, index) => {
      if (!bank.accountNumber) {
        errors.push(`Bank account number is required for account #${index + 1}`);
      }
      if (!bank.ifscCode) {
        errors.push(`IFSC code is required for account #${index + 1}`);
      } else if (!isValidIFSC(bank.ifscCode)) {
        errors.push(`Invalid IFSC code format for account #${index + 1}, IFSC format should be like ABCD0123456`);
      }
      if (!bank.bankName) {
        errors.push(`Bank name is required for account #${index + 1}`);
      }
      if (!bank.branchName) {
        errors.push(`Branch name is required for account #${index + 1}`);
      }
      if (!bank.accountType || !['savings', 'current', 'fixed_deposit'].includes(bank.accountType)) {
        errors.push(`Valid account type is required for account #${index + 1}`);
      }
      if (!bank.accountHolderName) {
        errors.push(`Account holder name is required for account #${index + 1}`);
      }
      if (!bank.accountHolderPan) {
        errors.push(`Account holder PAN is required for account #${index + 1}`);
      } else if (!isValidPAN(bank.accountHolderPan)) {
        errors.push(`Invalid account holder PAN format for account #${index + 1}, PAN format should be like ABCDE12345`);
      }
      if (!bank.accountHolderAadhar) {
        errors.push(`Account holder Aadhar is required for account #${index + 1}`);
      } else if (!isValidAadhar(bank.accountHolderAadhar)) {
        errors.push(`Invalid account holder Aadhar format for account #${index + 1}, Aadhar format should be like 123456789012`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateBrokerData = (data) => {
  const errors = [];

  // Basic information validation
  if (!data.name) {
    errors.push('Name is required');
  }
  if (!data.email) {
    errors.push('Email is required');
  } else if (!isValidEmail(data.email)) {
    errors.push('Invalid email format');
  }
  if (!data.phone) {
    errors.push('Phone number is required');
  } else if (!isValidPhone(data.phone)) {
    errors.push('Invalid phone number format');
  }

  // Address validation
  if (data.address) {
    if (data.address.pincode && !isValidPincode(data.address.pincode)) {
      errors.push('Invalid pincode format');
    }
  }

  // Bank details validation
  if (data.bankDetails && data.bankDetails.length > 0) {
    data.bankDetails.forEach((bank, index) => {
      if (!bank.accountNumber) {
        errors.push(`Bank account number is required for account #${index + 1}`);
      }
      if (!bank.ifscCode) {
        errors.push(`IFSC code is required for account #${index + 1}`);
      } else if (!isValidIFSC(bank.ifscCode)) {
        errors.push(`Invalid IFSC code format for account #${index + 1}`);
      }
      if (!bank.bankName) {
        errors.push(`Bank name is required for account #${index + 1}`);
      }
      if (!bank.branchName) {
        errors.push(`Branch name is required for account #${index + 1}`);
      }
      if (!bank.accountType || !['savings', 'current', 'fixed_deposit'].includes(bank.accountType)) {
        errors.push(`Valid account type is required for account #${index + 1}`);
      }
      if (!bank.accountHolderName) {
        errors.push(`Account holder name is required for account #${index + 1}`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation helper functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

const isValidGST = (gst) => {
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst);
};

const isValidPAN = (pan) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan);
};

const isValidPincode = (pincode) => {
  const pincodeRegex = /^[0-9]{6}$/;
  return pincodeRegex.test(pincode);
};

const isValidIFSC = (ifsc) => {
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(ifsc);
};

const isValidAadhar = (aadhar) => {
  const aadharRegex = /^[0-9]{12}$/;
  return aadharRegex.test(aadhar);
};

module.exports = {
  validateCompanyData,
  validateBrokerData
}; 