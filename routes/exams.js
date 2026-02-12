const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');

// @route   POST /api/exams
// @desc    Create a new exam (Admin only)
// @access  Private/Admin
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description, team, questions, duration, passingScore, startDate, endDate } = req.body;

    const exam = new Exam({
      title,
      description,
      team,
      createdBy: req.user.id,
      questions,
      duration,
      passingScore,
      startDate,
      endDate
    });

    await exam.save();

    const populatedExam = await Exam.findById(exam._id)
      .populate('team', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Exam created successfully',
      exam: populatedExam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/exams
// @desc    Get all exams
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { team, isActive } = req.query;
    let query = {};

    if (team) query.team = team;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // If user is intern, show only their team exams
    if (req.user.role === 'intern' && req.user.team) {
      query.team = req.user.team;
    }

    const exams = await Exam.find(query)
      .populate('team', 'name')
      .populate('createdBy', 'name email')
      .select('-questions.correctAnswer') // Hide correct answers
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/exams/:id
// @desc    Get exam by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id)
      .populate('team', 'name')
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Hide correct answers for interns
    if (req.user.role === 'intern') {
      exam = exam.toObject();
      exam.questions = exam.questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }

    res.json({
      success: true,
      exam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   POST /api/exams/:id/attempt
// @desc    Submit exam attempt (Intern)
// @access  Private/Intern
router.post('/:id/attempt', authenticate, async (req, res) => {
  try {
    const { answers } = req.body;

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    // Check if exam is active
    if (!exam.isActive) {
      return res.status(400).json({ 
        success: false, 
        message: 'This exam is not active' 
      });
    }

    // Check if user already took the exam
    const existingAttempt = exam.attempts.find(
      attempt => attempt.user.toString() === req.user.id
    );

    if (existingAttempt) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already taken this exam' 
      });
    }

    // Calculate score
    let score = 0;
    answers.forEach(answer => {
      const question = exam.questions[answer.questionIndex];
      if (question && question.correctAnswer === answer.answer) {
        score += question.points || 1;
      }
    });

    const percentage = (score / exam.totalPoints) * 100;
    const passed = percentage >= exam.passingScore;

    // Add attempt
    exam.attempts.push({
      user: req.user.id,
      answers,
      score,
      percentage,
      passed,
      startedAt: new Date(Date.now() - exam.duration * 60000), // Approximate start time
      submittedAt: new Date()
    });

    await exam.save();

    // Update user status and score
    await User.findByIdAndUpdate(req.user.id, {
      examTaken: true,
      examScore: score,
      status: passed ? 'qualified' : 'disqualified'
    });

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      result: {
        score,
        percentage,
        passed,
        totalPoints: exam.totalPoints
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/exams/:id/results
// @desc    Get exam results (Admin only)
// @access  Private/Admin
router.get('/:id/results', authenticate, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('attempts.user', 'name email');

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    res.json({
      success: true,
      results: exam.attempts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/exams/:id
// @desc    Update exam (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description, questions, duration, passingScore, isActive, startDate, endDate } = req.body;

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { title, description, questions, duration, passingScore, isActive, startDate, endDate },
      { new: true, runValidators: true }
    )
    .populate('team', 'name')
    .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    res.json({
      success: true,
      message: 'Exam updated successfully',
      exam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/exams/:id
// @desc    Delete exam (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);

    if (!exam) {
      return res.status(404).json({ 
        success: false, 
        message: 'Exam not found' 
      });
    }

    res.json({
      success: true,
      message: 'Exam deleted successfully'
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
