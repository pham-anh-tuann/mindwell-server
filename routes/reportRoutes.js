const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getWeeklySummary, 
  getDashboardStats, 
  getAllRedFlags, 
  updateRedFlagStatus,
  getGlobalInterventionHistory
} = require('../controllers/reportController'); 

router.get('/weekly', protect, getWeeklySummary);
router.get('/dashboard', getDashboardStats);
router.get('/red-flags', getAllRedFlags);
router.put('/red-flags/:id', updateRedFlagStatus); 
router.get('/global-history', getGlobalInterventionHistory);
module.exports = router;
