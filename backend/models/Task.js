const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add a due date']
  },
  priority: {
    type: String,
    required: [true, 'Please add a priority level'],
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: 'Priority must be Low, Medium, or High'
    },
    default: 'Medium'
  },
  status: {
    type: String,
    required: [true, 'Please add a status'],
    enum: {
      values: ['Pending', 'Completed'],
      message: 'Status must be Pending or Completed'
    },
    default: 'Pending'
  },
  category: {
    type: String,
    enum: {
      values: ['Assignment', 'Exam', 'Project', 'Personal'],
      message: 'Category must be Assignment, Exam, Project, or Personal'
    },
    default: 'Assignment'
  },
  courseCode: {
    type: String,
    trim: true,
    default: ''
  },
  reminders: {
    enabled: {
      type: Boolean,
      default: false
    },
    option: {
      type: String,
      enum: ['1 hour before', '1 day before', 'At time of due', 'none'],
      default: 'none'
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Task', TaskSchema);
