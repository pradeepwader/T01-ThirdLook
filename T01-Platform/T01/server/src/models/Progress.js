const mongoose = require('mongoose');

// What a reader has ticked / answered in one e-book
const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId }], // ids of ticked task blocks
    quizzes: [{ block: mongoose.Schema.Types.ObjectId, choice: Number, correct: Boolean, _id: false }],
  },
  { timestamps: true }
);
progressSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
