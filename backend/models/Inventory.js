import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  itemType: {
    type: String,
    required: true,
    enum: ['base', 'sauce', 'cheese', 'veggie', 'meat'],
    default: 'base'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'l', 'ml', 'pieces', 'packets']
  },
  threshold: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster low stock queries
inventorySchema.index({ quantity: 1, threshold: 1 });

// Method to check if item is low in stock
inventorySchema.methods.isLowStock = function() {
  return this.quantity <= this.threshold;
};

// Method to restock inventory
inventorySchema.methods.restock = function(amount) {
  this.quantity += amount;
  this.lastRestocked = Date.now();
  return this.save();
};

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
