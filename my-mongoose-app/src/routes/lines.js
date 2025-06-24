const express = require('express');
const router = express.Router();
const {
  createLine,
  getLines,
  getLineById,
  updateLine,
  deleteLine,
  getLinesForShon,
  simplifyLine
} = require('../controllers/lineController');

// POST /api/lines - Create a new line
router.post('/', createLine);

// GET /api/lines - Get all lines or lines for specific sambar
router.get('/', getLines);

// GET /api/lines/shon/:shonId - Get lines for a specific shon
router.get('/shon/:shonId', getLinesForShon);

// GET /api/lines/:id - Get specific line by ID
router.get('/:id', getLineById);

// PUT /api/lines/:id - Update a line
router.put('/:id', updateLine);

// PUT /api/lines/:id/simplify - Simplify line coordinates
router.put('/:id/simplify', simplifyLine);

// DELETE /api/lines/:id - Delete a line
router.delete('/:id', deleteLine);

module.exports = router;
