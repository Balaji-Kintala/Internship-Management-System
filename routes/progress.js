const express = require('express');
const router = express.Router();
const Progress = require('../models/Progress');
const Task = require('../models/Task');
const { authenticate, isAdmin } = require('../middleware/auth');

// @route   GET /api/progress/user/:userId
// @desc    Get progress for a specific user
// @access  Private
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    // Check if user is viewing their own progress or is admin
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to view this progress' 
      });
    }

    let progress = await Progress.findOne({ user: req.params.userId })
      .populate('user', 'name email status')
      .populate('team', 'name')
      .populate('reviews.reviewedBy', 'name email');

    if (!progress) {
      // Create new progress record if doesn't exist
      progress = new Progress({
        user: req.params.userId,
        team: req.user.team
      });
      await progress.save();
      progress = await Progress.findById(progress._id)
        .populate('user', 'name email status')
        .populate('team', 'name');
    }

    // Get task statistics
    const tasks = await Task.find({ assignedTo: req.params.userId });
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const averageScore = tasks.reduce((sum, t) => {
      const userSubmission = t.submissions.find(s => s.user.toString() === req.params.userId);
      return sum + (userSubmission?.score || 0);
    }, 0) / (tasks.length || 1);

    progress.tasksAssigned = tasks.length;
    progress.tasksCompleted = completedTasks;
    progress.averageScore = averageScore;
    await progress.save();

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/progress/team/:teamId
// @desc    Get progress for all users in a team (Admin only)
// @access  Private/Admin
router.get('/team/:teamId', authenticate, isAdmin, async (req, res) => {
  try {
    const progressRecords = await Progress.find({ team: req.params.teamId })
      .populate('user', 'name email status')
      .populate('team', 'name')
      .sort({ overallRating: -1 });

    res.json({
      success: true,
      count: progressRecords.length,
      progress: progressRecords
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/progress/:userId/attendance
// @desc    Mark attendance (Admin only)
// @access  Private/Admin
router.post('/:userId/attendance', authenticate, isAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;

    let progress = await Progress.findOne({ user: req.params.userId });

    if (!progress) {
      progress = new Progress({
        user: req.params.userId,
        team: req.user.team
      });
    }

    progress.attendance.push({
      status,
      notes
    });

    await progress.save();

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      progress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/progress/:userId/review
// @desc    Add review for user (Admin only)
// @access  Private/Admin
router.post('/:userId/review', authenticate, isAdmin, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    let progress = await Progress.findOne({ user: req.params.userId });

    if (!progress) {
      progress = new Progress({
        user: req.params.userId,
        team: req.user.team
      });
    }

    progress.reviews.push({
      reviewedBy: req.user.id,
      rating,
      comment
    });

    // Calculate overall rating
    const totalRating = progress.reviews.reduce((sum, r) => sum + r.rating, 0);
    progress.overallRating = totalRating / progress.reviews.length;

    await progress.save();

    progress = await Progress.findById(progress._id)
      .populate('reviews.reviewedBy', 'name email');

    res.json({
      success: true,
      message: 'Review added successfully',
      progress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/progress/:userId/milestone
// @desc    Add milestone (Admin only)
// @access  Private/Admin
router.post('/:userId/milestone', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;

    let progress = await Progress.findOne({ user: req.params.userId });

    if (!progress) {
      progress = new Progress({
        user: req.params.userId,
        team: req.user.team
      });
    }

    progress.milestones.push({
      title,
      description
    });

    await progress.save();

    res.json({
      success: true,
      message: 'Milestone added successfully',
      progress
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
