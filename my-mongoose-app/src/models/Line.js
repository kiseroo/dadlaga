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

lineSchema.index({ sambarCode: 1 });
lineSchema.index({ startShonId: 1, endShonId: 1 });
lineSchema.index({ isActive: 1 });

lineSchema.virtual('inflectionPointsCount').get(function() {
  return Math.max(0, this.coordinates.length - 2);
});

lineSchema.virtual('hasInflectionPoints').get(function() {
  return this.coordinates.length > 2;
});

lineSchema.methods.getStats = function() {
  return {
    totalPoints: this.coordinates.length,
    inflectionPoints: this.inflectionPointsCount,
    hasInflectionPoints: this.hasInflectionPoints,
    startPoint: this.coordinates[0],
    endPoint: this.coordinates[this.coordinates.length - 1]
  };
};

lineSchema.statics.findBySambar = function(sambarCode) {
  return this.find({ sambarCode, isActive: true })
    .populate('startShonId', 'code name location coordinates')
    .populate('endShonId', 'code name location coordinates')
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
  .sort({ createdAt: -1 });
};

lineSchema.pre('save', function(next) {
  if (!this.coordinates || this.coordinates.length < 2) {
    return next(new Error('A line must have at least 2 coordinates'));
  }

  for (let coord of this.coordinates) {
    if (coord.lat < -90 || coord.lat > 90 || coord.lng < -180 || coord.lng > 180) {
      return next(new Error('Invalid coordinate bounds'));
    }
  }

  next();
});

module.exports = mongoose.model('Line', lineSchema);
