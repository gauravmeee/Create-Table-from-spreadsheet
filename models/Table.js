const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  googleSheetId: {
    type: String,
    required: true
  },
  googleSheetUrl: {
    type: String,
    required: true
  },
  data: {
    type: Array,
    default: []
  },
  columns: {
    type: Array,
    default: []
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
tableSchema.index({ owner: 1 });
tableSchema.index({ googleSheetId: 1 });

module.exports = mongoose.model('Table', tableSchema); 