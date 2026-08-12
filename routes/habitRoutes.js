const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getMyHabits, createHabit, toggleHabitStatus, deleteHabit } = require('../controllers/habitController');

router.route('/')
  .get(protect, getMyHabits)
  .post(protect, createHabit);

router.put('/:id/toggle', protect, toggleHabitStatus);
router.delete('/:id', protect, deleteHabit);

module.exports = router;