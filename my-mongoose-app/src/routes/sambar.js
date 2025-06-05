const express = require('express');
const router = express.Router();
const sambarController = require('../controllers/sambarController');

router.post('/sambar', sambarController.saveLocation);
router.get('/sambar', sambarController.getAllLocations);

module.exports = router;
