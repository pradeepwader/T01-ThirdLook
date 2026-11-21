const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId }],
    quizzes: [{ block: mongoose.Schema.Types.ObjectId, choice: Number, correct: Boolean, _id: false }],
  },
  { timestamps: true }
);
progressSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);