const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middleware/auth');

// @route   POST /api/teams
// @desc    Create a new team (Admin only)
// @access  Private/Admin
router.post('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, members, startDate, endDate } = req.body;

    const team = new Team({
      name,
      description,
      admin: req.user.id,
      members,
      startDate,
      endDate
    });

    await team.save();

    // Update users with team assignment
    if (members && members.length > 0) {
      await User.updateMany(
        { _id: { $in: members } },
        { team: team._id }
      );
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('admin', 'name email')
      .populate('members', 'name email status');

    res.status(201).json({
      success: true,
      message: 'Team created successfully',
      team: populatedTeam
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/teams
// @desc    Get all teams
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('admin', 'name email')
      .populate('members', 'name email status')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: teams.length,
      teams
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email status skills');

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    res.json({
      success: true,
      team
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/teams/:id
// @desc    Update team (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { name, description, members, status, endDate } = req.body;

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description, members, status, endDate },
      { new: true, runValidators: true }
    )
    .populate('admin', 'name email')
    .populate('members', 'name email status');

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Update users with team assignment
    if (members) {
      await User.updateMany(
        { team: req.params.id },
        { $unset: { team: 1 } }
      );
      await User.updateMany(
        { _id: { $in: members } },
        { team: team._id }
      );
    }

    res.json({
      success: true,
      message: 'Team updated successfully',
      team
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/teams/:id
// @desc    Delete team (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);

    if (!team) {
      return res.status(404).json({ 
        success: false, 
        message: 'Team not found' 
      });
    }

    // Remove team reference from users
    await User.updateMany(
      { team: req.params.id },
      { $unset: { team: 1 } }
    );

    res.json({
      success: true,
      message: 'Team deleted successfully'
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
