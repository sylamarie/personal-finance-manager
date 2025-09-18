const express = require('express');
const { body, validationResult } = require('express-validator');
const Savings = require('../models/savings');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all savings goals (exclude deleted by default)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const savings = await Savings.find({ userId: req.user._id, deleted: false }).sort({ createdAt: -1 });
    res.json(savings);
  } catch (error) {
    console.error('Get savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create savings goal
router.post('/', authenticateToken, [
  body('goalName').notEmpty().trim(),
  body('targetAmount').isFloat({ min: 1 }),
  body('targetDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const savings = new Savings({
      ...req.body,
      userId: req.user._id,
      deleted: false // ✅ ensure always active
    });

    await savings.save();
    res.status(201).json(savings);
  } catch (error) {
    console.error('Create savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update savings goal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const savings = await Savings.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deleted: false },
      req.body,
      { new: true }
    );

    if (!savings) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    res.json(savings);
  } catch (error) {
    console.error('Update savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add money to savings goal
router.post('/:id/add', authenticateToken, [
  body('amount').isFloat({ min: 0.01 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount } = req.body;
    const savings = await Savings.findOne({ _id: req.params.id, userId: req.user._id, deleted: false });

    if (!savings) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    savings.currentAmount += amount;
    await savings.save();

    res.json(savings);
  } catch (error) {
    console.error('Add to savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Soft delete savings goal (move to trash)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const savings = await Savings.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { deleted: true },
      { new: true }
    );

    if (!savings) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    res.json({ message: 'Savings goal moved to trash', savings });
  } catch (error) {
    console.error('Delete savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Restore savings goal
router.put('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const savings = await Savings.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { deleted: false },
      { new: true }
    );

    if (!savings) {
      return res.status(404).json({ message: 'Savings goal not found' });
    }

    res.json({ message: 'Savings goal restored successfully', savings });
  } catch (error) {
    console.error('Restore savings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get only trashed savings goals
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const trashed = await Savings.find({ userId: req.user._id, deleted: true }).sort({ createdAt: -1 });
    res.json(trashed);
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;