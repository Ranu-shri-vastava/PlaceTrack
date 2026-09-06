const express = require('express');
const router = express.Router();
const { chatWithAgent, globalSearch } = require('../controllers/aiAgentController');

router.post('/chat', chatWithAgent);
router.get('/search', globalSearch);

module.exports = router;
