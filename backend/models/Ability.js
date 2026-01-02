const mongoose = require('mongoose');

const abilitySchema = new mongoose.Schema({
  // Ability identification
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['lightning', 'bomb', 'freeze', 'fire']
  },
  
  // Display information
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  
  // Game mechanics
  effect: {
    type: String,
    required: true,
    enum: ['destroyRow', 'destroyNeighbors', 'freezeColumn', 'burnObstacles']
  },
  pointsPerBubble: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Shop configuration
  price: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Starting inventory
  startingCount: {
    type: Number,
    default: 2,
    min: 0
  },
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
abilitySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods
abilitySchema.methods.toPublic = function() {
  return {
    id: this._id,
    name: this.name,
    displayName: this.displayName,
    description: this.description,
    icon: this.icon,
    effect: this.effect,
    pointsPerBubble: this.pointsPerBubble,
    price: this.price,
    startingCount: this.startingCount,
    sortOrder: this.sortOrder
  };
};

// Static methods
abilitySchema.statics.getActiveAbilities = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

abilitySchema.statics.getAbilityByName = function(name) {
  return this.findOne({ name, isActive: true });
};

module.exports = mongoose.model('Ability', abilitySchema);