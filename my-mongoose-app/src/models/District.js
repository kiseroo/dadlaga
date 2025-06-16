const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
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
        },
    boundaries: {
        type: String,  // KML path or URL
        default: null
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

module.exports = mongoose.model('District', districtSchema);
