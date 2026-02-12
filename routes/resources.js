const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const { authenticate, isAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// @route   POST /api/resources
// @desc    Create a new resource (Admin only)
// @access  Private/Admin
router.post('/', authenticate, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const { title, description, type, url, team, tags, isPublic } = req.body;

    const resourceData = {
      title,
      description,
      type,
      url,
      team,
      uploadedBy: req.user.id,
      tags: tags ? JSON.parse(tags) : [],
      isPublic: isPublic === 'true'
    };

    if (req.file) {
      resourceData.file = {
        filename: req.file.originalname,
        path: req.file.path,
        size: req.file.size
      };
    }

    const resource = new Resource(resourceData);
    await resource.save();

    const populatedResource = await Resource.findById(resource._id)
      .populate('team', 'name')
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource: populatedResource
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/resources
// @desc    Get all resources
// @access  Private
router.get('/', authenticate, async (req, res) => {
  try {
    const { team, type, isPublic } = req.query;
    let query = {};

    if (team) query.team = team;
    if (type) query.type = type;
    if (isPublic !== undefined) query.isPublic = isPublic === 'true';

    // If user is intern, show only their team resources or public resources
    if (req.user.role === 'intern') {
      query.$or = [
        { team: req.user.team },
        { isPublic: true }
      ];
    }

    const resources = await Resource.find(query)
      .populate('team', 'name')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   GET /api/resources/:id
// @desc    Get resource by ID
// @access  Private
router.get('/:id', authenticate, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('team', 'name')
      .populate('uploadedBy', 'name email');

    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    res.json({
      success: true,
      resource
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   PUT /api/resources/:id
// @desc    Update resource (Admin only)
// @access  Private/Admin
router.put('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { title, description, url, tags, isPublic } = req.body;

    const resource = await Resource.findByIdAndUpdate(
      req.params.id,
      { title, description, url, tags, isPublic },
      { new: true, runValidators: true }
    )
    .populate('team', 'name')
    .populate('uploadedBy', 'name email');

    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    res.json({
      success: true,
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// @route   DELETE /api/resources/:id
// @desc    Delete resource (Admin only)
// @access  Private/Admin
router.delete('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resource not found' 
      });
    }

    res.json({
      success: true,
      message: 'Resource deleted successfully'
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
