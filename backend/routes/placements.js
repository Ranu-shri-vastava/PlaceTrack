const express = require('express');
const router = express.Router();
const { getPlacements, getPlacement, createPlacement, updatePlacement, deletePlacement, getPlacementStats } = require('../controllers/placementController');

router.get('/stats', getPlacementStats);
router.get('/', getPlacements);
router.get('/:id', getPlacement);
router.post('/', createPlacement);
router.put('/:id', updatePlacement);
router.delete('/:id', deletePlacement);

module.exports = router;
