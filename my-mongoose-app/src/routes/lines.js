const express = require('express');
const router = express.Router();
const {
  createLine,
  getLines,
  getLineById,
  updateLine,
  deleteLine
} = require('../controllers/lineController');

// POST /api/lines - Create a new line
router.post('/', createLine);

// GET /api/lines - Get all lines or lines for specific sambar
router.get('/', getLines);

// GET /api/lines/:id - Get specific line by ID
router.get('/:id', getLineById);

// PUT /api/lines/:id - Update a line
router.put('/:id', updateLine);

// DELETE /api/lines/:id - Delete a line
router.delete('/:id', deleteLine);

module.exports = router;
