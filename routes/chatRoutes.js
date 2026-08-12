const express = require('express');
const router = express.Router();
const multer = require('multer'); 
const chatController = require('../controllers/chatController');
const voiceController = require('../controllers/voiceController'); 
const { protect } = require('../middleware/authMiddleware');
const upload = multer({ dest: 'uploads/temp_audio/' });

router.post('/', protect, chatController.chatWithAI);
router.get('/history', protect, chatController.getChatHistory); 
router.post('/voice-chat', protect, upload.single('audio'), voiceController.analyzeVoiceChat);

module.exports = router;