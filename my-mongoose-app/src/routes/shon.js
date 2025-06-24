const express = require('express');
const router = express.Router();
const { 
    getAllShons, 
    createShon, 
    getShonById, 
    updateShon, 
    deleteShon 
} = require('../controllers/shonController');

router.get('/', getAllShons);

router.post('/', createShon);

router.get('/:id', getShonById);

router.put('/:id', updateShon);

router.delete('/:id', deleteShon);

module.exports = router;
