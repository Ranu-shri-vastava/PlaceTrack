const express = require('express');
const router = express.Router();
const { getInterviews, getInterview, createInterview, updateInterview, deleteInterview, getInterviewStats, getUpcomingInterviews } = require('../controllers/interviewController');

router.get('/stats', getInterviewStats);
router.get('/upcoming', getUpcomingInterviews);
router.get('/', getInterviews);
router.get('/:id', getInterview);
router.post('/', createInterview);
router.put('/:id', updateInterview);
router.delete('/:id', deleteInterview);

module.exports = router;
