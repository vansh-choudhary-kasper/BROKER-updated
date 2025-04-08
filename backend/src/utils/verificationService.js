const axios = require('axios');
const logger = require('./logger');

class VerificationService {
    constructor() {
        this.gstApiKey = process.env.GST_API_KEY;
        this.panApiKey = process.env.PAN_API_KEY;
    }

    async verifyGST(gstNumber) {
        try {
            // TODO: Replace with actual GST verification API
            // This is a mock implementation
            const response = await axios.get(`https://api.example.com/gst/${gstNumber}`, {
                headers: {
                    'Authorization': `Bearer ${this.gstApiKey}`
                }
            });

            return {
                isValid: true,
                data: response.data
            };
        } catch (error) {
            logger.error('GST Verification Error:', error);
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    async verifyPAN(panNumber) {
        try {
            // TODO: Replace with actual PAN verification API
            // This is a mock implementation
            const response = await axios.get(`https://api.example.com/pan/${panNumber}`, {
                headers: {
                    'Authorization': `Bearer ${this.panApiKey}`
                }
            });

            return {
                isValid: true,
                data: response.data
            };
        } catch (error) {
            logger.error('PAN Verification Error:', error);
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    async verifyCompany(companyName, registrationNumber) {
        try {
            // TODO: Replace with actual company verification API
            // This is a mock implementation
            const response = await axios.get(`https://api.example.com/company`, {
                params: {
                    name: companyName,
                    registrationNumber: registrationNumber
                },
                headers: {
                    'Authorization': `Bearer ${process.env.COMPANY_API_KEY}`
                }
            });

            return {
                isValid: true,
                data: response.data
            };
        } catch (error) {
            logger.error('Company Verification Error:', error);
            return {
                isValid: false,
                error: error.message
            };
        }
    }
}

module.exports = new VerificationService(); 