const mongoose = require('mongoose');

const BLOCK_TYPES = ['heading', 'text', 'video', 'task', 'activity', 'link', 'quiz'];

// One building block of a topic page (like a section of a Wikipedia article)
const blockSchema = new mongoose.Schema({
  type: { type: String, enum: BLOCK_TYPES, required: true },
  text: { type: String, default: '' },       // heading / paragraph(s) / task label / activity prompt / link label / quiz question
  url: { type: String, default: '' },        // video URL or link URL
  options: [{ type: String }],               // quiz answers
  correct: { type: Number, default: 0 },     // quiz: index of right answer (never sent before the user answers)
  explanation: { type: String, default: '' },// quiz: shown after answering
});
const topicSchema = new mongoose.Schema({ title: { type: String, default: '' }, blocks: [blockSchema] });
const chapterSchema = new mongoose.Schema({ title: { type: String, default: '' }, summary: { type: String, default: '' }, topics: [topicSchema] });

const CATEGORIES = ['roadmap', 'guide', 'interview', 'skills', 'planning', 'other'];

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, index: true },
    tagline: { type: String, trim: true, maxlength: 200, default: '' },
    description: { type: String, trim: true, default: '' },
    category: { type: String, enum: CATEGORIES, default: 'guide' },
    price: { type: Number, required: true, min: 0 }, // INR (rupees). 0 = free resource
    compareAtPrice: { type: Number, min: 0, default: 0 },
    thumbnail: { type: String, default: '' },
    features: [{ type: String, trim: true }],
    audience: { type: String, trim: true, default: '' }, // "Who is this for?" section
    // How the buyer receives the product after payment
    deliveryType: { type: String, enum: ['ebook', 'file', 'link'], default: 'ebook' },
    chapters: { type: [chapterSchema], select: false }, // the e-book itself: only served to buyers/admin
    filePath: { type: String, select: false }, // private file in server/storage/products
    fileName: { type: String, default: '' },
    externalUrl: { type: String, select: false }, // e.g. Drive / Notion / course link
    isPublished: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    salesCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.virtual('isFree').get(function () {
  return this.price === 0;
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.statics.CATEGORIES = CATEGORIES;
productSchema.statics.BLOCK_TYPES = BLOCK_TYPES;
module.exports = mongoose.model('Product', productSchema);