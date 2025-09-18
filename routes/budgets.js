const express = require('express');
const { body, validationResult } = require('express-validator');
const Budget = require('../models/budgets');
const Transaction = require('../models/transactions');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all budgets for user (exclude trashed)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user._id, deleted: false }).sort({ createdAt: -1 });
    
    // Calculate spent amounts for each active budget
    for (let budget of budgets) {
      const spent = await Transaction.aggregate([
        {
          $match: {
            userId: req.user._id,
            type: 'expense',
            category: budget.category,
            date: { $gte: budget.startDate, $lte: budget.endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      budget.spentAmount = spent.length > 0 ? spent[0].total : 0;
      await budget.save();
    }

    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create budget
router.post('/', authenticateToken, [
  body('category').notEmpty().trim(),
  body('budgetAmount').isFloat({ min: 0.01 }),
  body('period').isIn(['weekly', 'monthly', 'yearly']),
  body('endDate').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const budget = new Budget({
      ...req.body,
      userId: req.user._id,
      deleted: false // ✅ always active when created
    });

    await budget.save();
    res.status(201).json(budget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update budget
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, deleted: false },
      req.body,
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json(budget);
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Soft delete budget (move to trash)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { deleted: true },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget moved to trash', budget });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore budget
router.put('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { deleted: false },
      { new: true }
    );

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    res.json({ message: 'Budget restored successfully', budget });
  } catch (error) {
    console.error('Restore budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get trashed budgets only
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const trashed = await Budget.find({ userId: req.user._id, deleted: true }).sort({ createdAt: -1 });
    res.json(trashed);
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;