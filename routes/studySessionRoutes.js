const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/studySessionController');

const { protect } = require('../middleware/authMiddleware');

router.post('/start', protect, sessionController.startSession);
router.put('/end/:sessionId', protect, sessionController.endSession);

router.post('/complete', protect, sessionController.completeSession);
router.get('/weekly-report', protect, sessionController.getWeeklyReport);
router.get('/community-report', protect, sessionController.getCommunityReport);

module.exports = router;