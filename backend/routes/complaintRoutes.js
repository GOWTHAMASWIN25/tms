const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const complaintController = require('../controllers/complaintController');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  },
});

const upload = multer({ storage });

router.post('/', auth, upload.single('attachment'), complaintController.createComplaint);
router.get('/stats', auth, complaintController.getStats);
router.get('/', auth, complaintController.listComplaints);
router.patch('/:id/assign', auth, complaintController.assignComplaint);
router.patch('/:id/status', auth, complaintController.updateStatus);
router.post('/:id/feedback', auth, complaintController.addFeedback);
router.post('/:id/notes', auth, complaintController.addTimelineNote);
router.get('/report', auth, complaintController.generateReport);
router.get('/:id', auth, complaintController.getComplaintById);

module.exports = router;
