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

router.post('/', createLine);

router.get('/', getLines);

router.get('/shon/:shonId', getLinesForShon);

router.get('/:id', getLineById);

router.put('/:id', updateLine);

router.put('/:id/simplify', simplifyLine);

router.delete('/:id', deleteLine);

module.exports = router;
