const router = require('express').Router();
const c = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// Public: only the 3 featured teasers shown on the landing page (Home)
router.get('/featured', c.featured);

// Explore Products + Product page: login required
router.get('/', protect, c.list);
router.get('/:slug', protect, c.getBySlug);

module.exports = router;
