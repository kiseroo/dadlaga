const mongoose = require('mongoose');

const sambarSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
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
    },    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Create indexes for efficient querying by district and khoroo
sambarSchema.index({ 'khorooInfo.district': 1 });
sambarSchema.index({ 'khorooInfo.khoroo': 1 });
sambarSchema.index({ 'khorooInfo.district': 1, 'khorooInfo.khoroo': 1 });

module.exports = mongoose.model('Sambar', sambarSchema);
