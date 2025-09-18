const express = require('express');
const Transaction = require('../models/transactions');
const Budget = require('../models/budgets');
const Savings = require('../models/savings');

const router = express.Router();

// Dashboard home page
router.get('/', (req, res) => {
  res.render('index');
});

// Login page
router.get('/login', (req, res) => {
  res.render('login');
});

// Register page
router.get('/register', (req, res) => {
  res.render('register');
});

// Dashboard page (protected)
router.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

module.exports = router;