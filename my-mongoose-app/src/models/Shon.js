const mongoose = require('mongoose');

const shonSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        unique: true, 
        sparse: true  
    },
    coordinates: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    khorooInfo: {
        name: String,
        district: String,
        khoroo: String
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

shonSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Shon = mongoose.model('Shon', shonSchema, 'shonguud');

module.exports = Shon;
