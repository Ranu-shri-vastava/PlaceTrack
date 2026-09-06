const express = require('express');
const router = express.Router();
const { getDashboardStats, getReports } = require('../controllers/dashboardController');

router.get('/', getDashboardStats);
router.get('/reports', getReports);

module.exports = router;
