const express = require('express');
const router = express.Router();
const { getApplications, getApplication, createApplication, updateApplication, updateApplicationStatus, deleteApplication, getPipelineStats } = require('../controllers/applicationController');

router.get('/pipeline', getPipelineStats);
router.get('/', getApplications);
router.get('/:id', getApplication);
router.post('/', createApplication);
router.put('/:id/status', updateApplicationStatus);
router.put('/:id', updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;
