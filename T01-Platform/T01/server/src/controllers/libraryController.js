const path = require('path');
const fs = require('fs');
const Access = require('../models/Access');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const Progress = require('../models/Progress');
const { PATHS } = require('../middleware/upload');

/** User Dashboard: everything the user has unlocked */
exports.myLibrary = asyncHandler(async (req, res) => {
  const items = await Access.find({ user: req.user._id }).sort({ createdAt: -1 })
    .populate('product', 'title slug tagline category thumbnail deliveryType fileName');
  const list = items.filter((a) => a.product);
  const ids = list.map((a) => a.product._id);

  // Progress per e-book = ticked tasks / total tasks (tasks deleted by the admin are not counted)
  const [books, progs] = await Promise.all([
    Product.find({ _id: { $in: ids }, deliveryType: 'ebook' }).select('+chapters'),
    Progress.find({ user: req.user._id, product: { $in: ids } }),
  ]);
  const taskIds = new Map(books.map((b) => [String(b._id), new Set(b.chapters.flatMap((c) => c.topics.flatMap((t) => t.blocks.filter((x) => x.type === 'task').map((x) => String(x._id)))))]));
  const ticked = new Map(progs.map((p) => [String(p.product), p.tasks.map(String)]));

  res.json({
    success: true,
    items: list.map((a) => {
      const set = taskIds.get(String(a.product._id));
      const progress = set ? { total: set.size, done: (ticked.get(String(a.product._id)) || []).filter((id) => set.has(id)).length } : null;
      return { id: a._id, grantedAt: a.createdAt, product: a.product, progress };
    }),
  });
});

const requireAccess = async (req, res) => {
  const owned = await Access.exists({ user: req.user._id, product: req.params.productId });
  if (!owned) { res.status(403).json({ success: false, message: 'Purchase this product to unlock it' }); return null; }
  const product = await Product.findById(req.params.productId).select('+filePath +externalUrl');
  if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return null; }
  return product;
};

/** Use Purchased Product: link products return the URL, file products return a download route */
exports.open = asyncHandler(async (req, res) => {
  const product = await requireAccess(req, res);
  if (!product) return;
  if (product.deliveryType === 'ebook') return res.json({ success: true, type: 'ebook', url: `/read/${product.slug}` });
  if (product.deliveryType === 'link') {
    if (!product.externalUrl) return res.status(404).json({ success: false, message: 'Content is being prepared. Please check back soon.' });
    return res.json({ success: true, type: 'link', url: product.externalUrl });
  }
  res.json({ success: true, type: 'file', url: `/api/library/${product._id}/download` });
});

exports.download = asyncHandler(async (req, res) => {
  const product = await requireAccess(req, res);
  if (!product) return;
  if (!product.filePath) return res.status(404).json({ success: false, message: 'File is not available yet' });
  const full = path.join(PATHS.FILE_DIR, path.basename(product.filePath));
  if (!fs.existsSync(full)) return res.status(404).json({ success: false, message: 'File is not available yet' });
  res.download(full, product.fileName || path.basename(full));
});

/* ---------------- E-book reader ---------------- */

// Buyers (and admins, for preview) only. Returns the product WITH its chapters.
const readerProduct = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).select('+chapters');
  if (!product) { res.status(404).json({ success: false, message: 'Product not found' }); return null; }
  if (req.user.role !== 'admin') {
    const owned = await Access.exists({ user: req.user._id, product: product._id });
    if (!owned) { res.status(403).json({ success: false, message: 'Purchase this product to unlock it' }); return null; }
  }
  return product;
};

const blockOf = (product, blockId, type) => {
  for (const c of product.chapters) for (const t of c.topics) {
    const b = t.blocks.id(blockId);
    if (b && b.type === type) return b;
  }
  return null;
};

exports.readContent = asyncHandler(async (req, res) => {
  const product = await readerProduct(req, res);
  if (!product) return;
  const progress = (await Progress.findOne({ user: req.user._id, product: product._id })) || { tasks: [], quizzes: [] };
  const answered = new Map(progress.quizzes.map((q) => [String(q.block), q]));

  const chapters = product.chapters.map((c) => ({
    _id: c._id, title: c.title, summary: c.summary,
    topics: c.topics.map((t) => ({
      _id: t._id, title: t.title,
      blocks: t.blocks.map((b) => {
        const o = { _id: b._id, type: b.type, text: b.text, url: b.url };
        if (b.type === 'quiz') {
          o.options = b.options;
          const a = answered.get(String(b._id));
          // The right answer is only revealed once this reader has answered
          if (a) { o.answer = { choice: a.choice, correct: a.correct, correctIndex: b.correct, explanation: b.explanation }; }
        }
        return o;
      }),
    })),
  }));
  res.json({
    success: true,
    product: { _id: product._id, title: product.title, slug: product.slug, tagline: product.tagline },
    chapters,
    progress: { tasks: progress.tasks.map(String) },
    preview: req.user.role === 'admin',
  });
});

exports.setTask = asyncHandler(async (req, res) => {
  const product = await readerProduct(req, res);
  if (!product) return;
  const { blockId, done } = req.body;
  if (!blockOf(product, blockId, 'task')) return res.status(400).json({ success: false, message: 'Invalid task' });
  const update = done ? { $addToSet: { tasks: blockId } } : { $pull: { tasks: blockId } };
  const p = await Progress.findOneAndUpdate({ user: req.user._id, product: product._id }, { ...update, $setOnInsert: { user: req.user._id, product: product._id } }, { upsert: true, new: true });
  res.json({ success: true, tasks: p.tasks.map(String) });
});

exports.answerQuiz = asyncHandler(async (req, res) => {
  const product = await readerProduct(req, res);
  if (!product) return;
  const { blockId } = req.body;
  const choice = parseInt(req.body.choice, 10);
  const block = blockOf(product, blockId, 'quiz');
  if (!block || !(choice >= 0 && choice < block.options.length)) return res.status(400).json({ success: false, message: 'Invalid answer' });
  const correct = choice === block.correct;
  const p = (await Progress.findOne({ user: req.user._id, product: product._id })) || new Progress({ user: req.user._id, product: product._id });
  const existing = p.quizzes.find((q) => String(q.block) === String(blockId));
  if (existing) { existing.choice = choice; existing.correct = correct; } else p.quizzes.push({ block: blockId, choice, correct });
  await p.save();
  res.json({ success: true, answer: { choice, correct, correctIndex: block.correct, explanation: block.explanation } });
});
