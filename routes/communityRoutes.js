const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/history', protect, communityController.getCommunityHistory);

module.exports = router;