const router = require('express').Router();
const c = require('../controllers/libraryController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', c.myLibrary);
router.get('/read/:slug', c.readContent);
router.put('/read/:slug/task', c.setTask);
router.post('/read/:slug/quiz', c.answerQuiz);
router.get('/:productId/open', c.open);
router.get('/:productId/download', c.download);

module.exports = router;
