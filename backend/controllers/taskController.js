const Task = require('../models/Task');

// @desc    Get all tasks for logged-in user (with search and filters)
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const query = { userId: req.user._id };

    // 1. Filtering by Status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // 2. Filtering by Priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // 3. Filtering by Category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // 4. Keyword Search (Title or Description)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // 5. Sorting
    let sortOptions = { dueDate: 1 }; // Default: due date ascending (soonest first)
    if (req.query.sort) {
      if (req.query.sort === 'dueDate_desc') {
        sortOptions = { dueDate: -1 };
      } else if (req.query.sort === 'createdAt_desc') {
        sortOptions = { createdAt: -1 };
      } else if (req.query.sort === 'priority_desc') {
        // High priority first. (Note: Custom sort sorting on High -> Medium -> Low string is tricky in mongo, 
        // but we can sort alphabetically or we handle it in memory if needed. 
        // For simplicity, we default to sort options like date/created).
        sortOptions = { priority: 1 }; 
      }
    }

    const tasks = await Task.find(query).sort(sortOptions);

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get Tasks Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving tasks'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: task
    });
  } catch (error) {
    console.error('Get Task Error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid task ID format'
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Server error retrieving task'
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, category, courseCode, reminders } = req.body;

    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Task title is required'
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Task due date is required'
      });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority: priority || 'Medium',
      status: status || 'Pending',
      category: category || 'Assignment',
      courseCode: courseCode || '',
      reminders: reminders || { enabled: false, option: 'none' },
      userId: req.user._id
    });

    res.status(201).json({
      status: 'success',
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    console.error('Create Task Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error creating task'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not authorized'
      });
    }

    // Update fields
    const allowedUpdates = [
      'title',
      'description',
      'dueDate',
      'priority',
      'status',
      'category',
      'courseCode',
      'reminders'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    await task.save();

    res.status(200).json({
      status: 'success',
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    console.error('Update Task Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error updating task'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!task) {
      return res.status(404).json({
        status: 'error',
        message: 'Task not found or not authorized'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete Task Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error deleting task'
    });
  }
};

// @desc    Bulk delete tasks
// @route   POST /api/tasks/bulk-delete
// @access  Private
const bulkDeleteTasks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of task IDs to delete'
      });
    }

    const result = await Task.deleteMany({
      _id: { $in: ids },
      userId: req.user._id
    });

    res.status(200).json({
      status: 'success',
      message: `${result.deletedCount} tasks deleted successfully`
    });
  } catch (error) {
    console.error('Bulk Delete Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error performing bulk delete'
    });
  }
};

// @desc    Bulk update task status
// @route   POST /api/tasks/bulk-status
// @access  Private
const bulkStatusTasks = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide an array of task IDs to update'
      });
    }

    if (!status || !['Pending', 'Completed'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid status: Pending or Completed'
      });
    }

    const result = await Task.updateMany(
      { _id: { $in: ids }, userId: req.user._id },
      { $set: { status } }
    );

    res.status(200).json({
      status: 'success',
      message: `${result.modifiedCount} tasks updated to ${status} successfully`
    });
  } catch (error) {
    console.error('Bulk Status Error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Server error performing bulk status update'
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  bulkDeleteTasks,
  bulkStatusTasks
};
