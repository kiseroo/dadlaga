const mongoose = require('mongoose');

const khorooSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        trim: true
    },
    
    name: {
        type: String,
        required: true,
        trim: true
    },
    
    districtCode: {
        type: String,
        required: true,
        trim: true
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

module.exports = mongoose.model('Khoroo', khorooSchema);
