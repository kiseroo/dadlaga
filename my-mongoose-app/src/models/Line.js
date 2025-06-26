const mongoose = require('mongoose');

const lineSchema = new mongoose.Schema({
  sambarCode: {
    type: String,
    required: true,
    trim: true
  },
  // Start point - can be either Shon or Sambar
  startShonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shon',
    required: function() {
      return !this.startSambarId; // Required if startSambarId doesn't exist
    }
  },
  startSambarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sambar',
    required: function() {
      return !this.startShonId; // Required if startShonId doesn't exist
    }
  },
  // End point - can be either Shon or Sambar
  endShonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shon',
    required: function() {
      return !this.endSambarId; // Required if endSambarId doesn't exist
    }
  },
  endSambarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sambar',
    required: function() {
      return !this.endShonId; // Required if endShonId doesn't exist
    }
  },
  coordinates: [{
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  }],
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update indexes
lineSchema.index({ sambarCode: 1 });
lineSchema.index({ startShonId: 1 });
lineSchema.index({ startSambarId: 1 });
lineSchema.index({ endShonId: 1 });
lineSchema.index({ endSambarId: 1 });
lineSchema.index({ isActive: 1 });

lineSchema.virtual('inflectionPointsCount').get(function() {
  return Math.max(0, this.coordinates.length - 2);
});

lineSchema.virtual('hasInflectionPoints').get(function() {
  return this.coordinates.length > 2;
});

// Add convenience virtuals to check endpoint types
lineSchema.virtual('startsWithShon').get(function() {
  return !!this.startShonId;
});

lineSchema.virtual('startsWithSambar').get(function() {
  return !!this.startSambarId;
});

lineSchema.virtual('endsWithShon').get(function() {
  return !!this.endShonId;
});

lineSchema.virtual('endsWithSambar').get(function() {
  return !!this.endSambarId;
});

lineSchema.methods.getStats = function() {
  return {
    totalPoints: this.coordinates.length,
    inflectionPoints: this.inflectionPointsCount,
    hasInflectionPoints: this.hasInflectionPoints,
    startPoint: this.coordinates[0],
    endPoint: this.coordinates[this.coordinates.length - 1],
    startsWithShon: this.startsWithShon,
    startsWithSambar: this.startsWithSambar,
    endsWithShon: this.endsWithShon,
    endsWithSambar: this.endsWithSambar
  };
};

lineSchema.statics.findBySambar = function(sambarCode) {
  return this.find({ sambarCode, isActive: true })
    .populate('startShonId', 'code name location coordinates')
    .populate('endShonId', 'code name location coordinates')
    .populate('startSambarId', 'name coordinates')
    .populate('endSambarId', 'name coordinates')
    .sort({ createdAt: -1 });
};

lineSchema.statics.findByShon = function(shonId) {
  return this.find({
    $or: [
      { startShonId: shonId },
      { endShonId: shonId }
    ],
    isActive: true
  })
  .populate('startShonId', 'code name location coordinates')
  .populate('endShonId', 'code name location coordinates')
  .populate('startSambarId', 'name coordinates')
  .populate('endSambarId', 'name coordinates')
  .sort({ createdAt: -1 });
};

// Add method to find by Sambar ID
lineSchema.statics.findBySambarId = function(sambarId) {
  return this.find({
    $or: [
      { startSambarId: sambarId },
      { endSambarId: sambarId }
    ],
    isActive: true
  })
  .populate('startShonId', 'code name location coordinates')
  .populate('endShonId', 'code name location coordinates')
  .populate('startSambarId', 'name coordinates')
  .populate('endSambarId', 'name coordinates')
  .sort({ createdAt: -1 });
};

lineSchema.pre('save', function(next) {
  // Validate minimum coordinates
  if (!this.coordinates || this.coordinates.length < 2) {
    return next(new Error('A line must have at least 2 coordinates'));
  }

  // Validate coordinate bounds
  for (let coord of this.coordinates) {
    if (coord.lat < -90 || coord.lat > 90 || coord.lng < -180 || coord.lng > 180) {
      return next(new Error('Invalid coordinate bounds'));
    }
  }

  // Validate start/end points
  if ((!this.startShonId && !this.startSambarId) || (!this.endShonId && !this.endSambarId)) {
    return next(new Error('A line must have both start and end points (either Shon or Sambar)'));
  }

  next();
});

module.exports = mongoose.model('Line', lineSchema);
