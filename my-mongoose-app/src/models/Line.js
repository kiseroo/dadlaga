const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
  sambarCode: {
    type: String,
    required: true,
    trim: true
  },
  startShonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shon',
    required: true
  },
  endShonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shon',
    required: true
  },
  coordinates: [{
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Index for efficient querying
lineSchema.index({ sambarCode: 1 });
lineSchema.index({ startShonId: 1, endShonId: 1 });

module.exports = mongoose.model('Line', lineSchema);
