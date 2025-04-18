const mongoose = require('mongoose');

const slabSchema = new mongoose.Schema({
    minAmount: {
        type: Number,
        required: true,
        min: 0
    },
    maxAmount: {
        type: Number,
        required: true,
        min: 0
    },
    commission: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
});

module.exports = slabSchema;