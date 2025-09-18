const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Transaction = require('../models/transactions');
const Budget = require('../models/budgets');
const Savings = require('../models/savings');

const router = express.Router();

// Get ALL trash (transactions, budgets, savings)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const trashedTransactions = await Transaction.find({ userId, deleted: true }).sort({ date: -1 });
    const trashedBudgets = await Budget.find({ userId, deleted: true }).sort({ createdAt: -1 });
    const trashedSavings = await Savings.find({ userId, deleted: true }).sort({ createdAt: -1 });

    res.json({
      transactions: trashedTransactions,
      budgets: trashedBudgets,
      savings: trashedSavings
    });
  } catch (error) {
    console.error('Get trash error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Restore item
router.put('/:type/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    let Model;

    if (type === 'transaction') Model = Transaction;
    else if (type === 'budget') Model = Budget;
    else if (type === 'savings') Model = Savings;
    else return res.status(400).json({ message: 'Invalid type' });

    const item = await Model.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { deleted: false },
      { new: true }
    );

    if (!item) return res.status(404).json({ message: `${type} not found` });

    res.json({ message: `${type} restored successfully`, item });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Permanently delete item
router.delete('/:type/:id', authenticateToken, async (req, res) => {
  try {
    const { type, id } = req.params;
    let Model;

    if (type === 'transaction') Model = Transaction;
    else if (type === 'budget') Model = Budget;
    else if (type === 'savings') Model = Savings;
    else return res.status(400).json({ message: 'Invalid type' });

    const item = await Model.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!item) return res.status(404).json({ message: `${type} not found` });

    res.json({ message: `${type} permanently deleted` });
  } catch (error) {
    console.error('Permanent delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;