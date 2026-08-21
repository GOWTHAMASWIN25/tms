const express = require('express');
const blockController = require('../controllers/blockController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  blockController.createBlock
);

router.get('/', authMiddleware, blockController.getBlocks);

router.get(
  '/:id',
  authMiddleware,
  blockController.getBlockById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  blockController.updateBlock
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  blockController.deleteBlock
);

module.exports = router;
