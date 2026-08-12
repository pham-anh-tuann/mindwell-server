const express = require('express');
const router = express.Router();

const { 
  register, 
  login, 
  updateProfile, 
  changePassword,
  forgotPassword 
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword); 

router.get('/me', protect, (req, res) => {
  res.status(200).json(req.user);
});

router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword); 

module.exports = router;