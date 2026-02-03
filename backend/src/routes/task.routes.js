/**
 * Task Routes
 */

const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { createTaskValidation, updateTaskValidation, paginationValidation } = require('../middlewares/validate');

// All routes require authentication
router.use(authenticate);

// Task CRUD
router.get('/', paginationValidation, taskController.getTasks);
router.post('/', createTaskValidation, taskController.createTask);
router.get('/:id', taskController.getTaskById);
router.put('/:id', updateTaskValidation, taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Task actions
router.patch('/:id/complete', taskController.completeTask);
router.patch('/:id/uncomplete', taskController.uncompleteTask);

// Bulk operations
router.post('/bulk-complete', taskController.bulkCompleteTasks);
router.delete('/bulk-delete', taskController.bulkDeleteTasks);

module.exports = router;
