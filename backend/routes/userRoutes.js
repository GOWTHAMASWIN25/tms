const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleCheck');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  userController.createUser
);

router.get('/', authMiddleware, roleMiddleware(['SuperAdmin']), userController.getUsers);

router.get('/:id', authMiddleware, userController.getUserById);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  userController.updateUser
);

router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['SuperAdmin']),
  userController.deleteUser
);

module.exports = router;
