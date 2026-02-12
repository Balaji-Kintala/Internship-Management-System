const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/tasks
// @desc    Create a new task (Admin only)
// @access  Private/Admin
router.post('/', authenticate, isAdmin, upload.array('attachments', 5), async (req, res) => {
  try {
    const { title, description, team, assignedTo, priority, dueDate } = req.body;

    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path
    })) : [];

    const task = new Task({
      title,
      description,
      team,
      assignedTo: JSON.parse(assignedTo || '[]'),
      createdBy: req.user.id,
      priority,
      dueDate,
      attachments
    });

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: populatedTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/tasks
// @desc    Get all tasks
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { team, status, priority, assignedTo } = req.query;
    let query = {};

    if (team) query.team = team;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    // If user is intern, show only their tasks
    if (req.user.role === 'intern') {
      query.assignedTo = req.user.id;
    }

    const tasks = await Task.find(query)
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('team', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('submissions.user', 'name email');

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate } = req.body;

    // Only admin can update task details
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admin can update tasks' 
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, priority, status, dueDate },
      { new: true, runValidators: true }
    )
    .populate('team', 'name')
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/tasks/:id/submit
// @desc    Submit task (Intern)
// @access  Private/Intern
router.post('/:id/submit', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    const { content } = req.body;

    const files = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path
    })) : [];

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    // Check if user is assigned to this task
    if (!task.assignedTo.includes(req.user.id)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You are not assigned to this task' 
      });
    }

    task.submissions.push({
      user: req.user.id,
      content,
      files
    });

    task.status = 'review';
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('submissions.user', 'name email');

    res.json({
      success: true,
      message: 'Task submitted successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/tasks/:id/review
// @desc    Review task submission (Admin only)
// @access  Private/Admin
router.post('/:id/review', authenticate, isAdmin, async (req, res) => {
  try {
    const { submissionId, feedback, score, status } = req.body;

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    const submission = task.submissions.id(submissionId);
    if (!submission) {
      return res.status(404).json({ 
        success: false, 
        message: 'Submission not found' 
      });
    }

    submission.feedback = feedback;
    submission.score = score;
    task.status = status || 'completed';

    await task.save();

    res.json({
      success: true,
      message: 'Review submitted successfully',
      task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found' 
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

module.exports = router;
