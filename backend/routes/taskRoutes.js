const express = require('express');
const router = express.Router();
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
  bulkStatusTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

// Apply auth protection middleware to all task routes
router.use(protect);

// Standard task CRUD routes
router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .get(getTaskById)
  .put(updateTask)
  .delete(deleteTask);

// Bulk action routes
router.post('/bulk-delete', bulkDeleteTasks);
router.post('/bulk-status', bulkStatusTasks);

module.exports = router;
