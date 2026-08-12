const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

router.route('/')
  .get(testController.getTests)
  .post(testController.createTest);

router.route('/:id')
  .get(testController.getTestById)
  .put(testController.updateTest)
  .delete(testController.deleteTest);

module.exports = router;