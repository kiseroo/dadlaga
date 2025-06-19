const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    khorooCount: {
        type: Number,
        required: true,
        min: 1
        
    },
    boundaries: {
        type: String,  // KML path or URL
        default: null
    },
    cyrillicCode: {
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

// Create index on code for faster lookups
districtSchema.index({ code: 1 });

module.exports = mongoose.model('District', districtSchema);
