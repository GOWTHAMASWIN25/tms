const express = require('express');
const roomController = require('../controllers/roomController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  roomController.createRoom
);

router.get('/', authMiddleware, roomController.getRooms);

router.get(
  '/:id',
  authMiddleware,
  roomController.getRoomById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  roomController.updateRoom
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  roomController.deleteRoom
);

module.exports = router;
