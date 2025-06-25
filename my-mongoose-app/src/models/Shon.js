const mongoose = require('mongoose');

const shonSchema = new mongoose.Schema({
    sambarCode: {
        type: String, 
        required: true,
        trim: true,
        ref: 'Khoroo' // Reference to Khoroo model
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    location: {
        lat: {
            type: Number,
            default: null
        },
        lng: {
            type: Number,
            default: null
        }
    },
    color: {
        type: String,
        enum: ['green', 'red', 'yellow'],
        default: 'green'
    },
    shape: {
        type: String,
        enum: ['one-line', 'two-lines', 'three-lines'],
        default: 'one-line'
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
shonSchema.index({ code: 1 });

// Pre-save middleware to update the updatedAt field
shonSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Shon = mongoose.model('Shon', shonSchema, 'shonguud');

module.exports = Shon;
