const express = require('express');
const router = express.Router();
const testResultController = require('../controllers/testResultController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, testResultController.saveTestResult);
router.get('/history', protect, testResultController.getTestHistory);
router.get('/admin/user/:userId', testResultController.getUserTestHistoryForAdmin);

module.exports = router;