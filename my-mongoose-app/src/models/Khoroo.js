const mongoose = require('mongoose');

const khorooSchema = new mongoose.Schema({
    districtCode: {
        type: String, 
        required: true,
        trim: true,
        ref: 'District' // Reference to District model
    },
    number: {
        type: String, // Using string to preserve leading zeros (e.g. "01")
        required: true,
        trim: true
    },
    name: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index for district and khoroo number
khorooSchema.index({ districtCode: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Khoroo', khorooSchema);
