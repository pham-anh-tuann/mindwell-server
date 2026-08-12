const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const { protect } = require('../middleware/authMiddleware');

if (!moodController || !moodController.addMood || !moodController.getMoodHistory) {
    console.error("❌ LỖI: Không tìm thấy hàm trong moodController. Kiểm tra lại file controller!");
}

router.post('/', protect, moodController.addMood);

router.get('/', protect, moodController.getMoodHistory);

module.exports = router;