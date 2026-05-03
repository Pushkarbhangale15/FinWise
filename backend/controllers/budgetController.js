const Budget = require('../models/budgetModel');
const User = require('../models/userModel');
const { calculateBudgetHealth } = require('../utils/calculations');
const { calculateXPForAction, calculateLevel, evaluateAndAwardBadges } = require('../utils/gamification');

// Get current month budget
const getCurrentBudget = async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM format
    
    let budget = await Budget.findOne({
      userId: req.user._id,
      month: currentMonth
    });

    if (!budget) {
      // Create default budget structure with all expense categories
      const defaultExpenseCategories = ['food', 'books', 'entertainment', 'transport', 'housing', 'utilities', 'healthcare', 'clothing', 'other'];
      const expensesWithDefaults = defaultExpenseCategories.map(category => ({
        category,
        budgeted: 0,
        actual: 0,
        transactions: []
      }));

      budget = new Budget({
        userId: req.user._id,
        month: currentMonth,
        income: [],
        expenses: expensesWithDefaults,
        goals: []
      });
      await budget.save();
    }

    // Calculate budget health
    const healthData = calculateBudgetHealth(budget.income, budget.expenses);

    res.json({
      success: true,
      budget: {
        ...budget.toObject(),
        health: healthData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get budget',
      error: error.message
    });
  }
};

// Create or update budget
const createOrUpdateBudget = async (req, res) => {
  try {
    const { month, income, expenses, goals } = req.body;
    const budgetMonth = month || new Date().toISOString().substring(0, 7);

    let budget = await Budget.findOne({
      userId: req.user._id,
      month: budgetMonth
    });

    if (budget) {
      // Update existing budget
      if (income) budget.income = income;

      // Merge expenses by category to preserve existing transactions
      if (expenses) {
        const existingExpenses = Array.isArray(budget.expenses) ? budget.expenses : [];
        const mergedExpenses = expenses.map((incomingExpense) => {
          const existing = existingExpenses.find((e) => e.category === incomingExpense.category);
          return {
            category: incomingExpense.category,
            budgeted: incomingExpense.budgeted,
            // Prefer provided actual, otherwise keep existing actual (or 0)
            actual: typeof incomingExpense.actual === 'number' ? incomingExpense.actual : (existing?.actual ?? 0),
            // Always preserve existing transactions unless explicitly provided
            transactions: existing?.transactions || []
          };
        });
        budget.expenses = mergedExpenses;
      }

      if (goals) budget.goals = goals;
    } else {
      // Create new budget with default expense categories
      const defaultExpenseCategories = ['food', 'books', 'entertainment', 'transport', 'housing', 'utilities', 'healthcare', 'clothing', 'other'];
      const expensesWithDefaults = (expenses && expenses.length > 0) 
        ? expenses 
        : defaultExpenseCategories.map(category => ({
            category,
            budgeted: 0,
            actual: 0,
            transactions: []
          }));

      budget = new Budget({
        userId: req.user._id,
        month: budgetMonth,
        income: income || [],
        expenses: expensesWithDefaults,
        goals: goals || []
      });
    }

    await budget.save();

    // Award XP for first budget
    if (budget.isNew) {
      const user = await User.findById(req.user._id);
      user.gamification.totalXP += calculateXPForAction('first_budget');
      user.gamification.level = calculateLevel(user.gamification.totalXP);
      await user.save();
    }

    // Evaluate badges after any budget change (new or update)
    await evaluateAndAwardBadges(req.user._id);

    // Calculate budget health
    const healthData = calculateBudgetHealth(budget.income, budget.expenses);

    res.json({
      success: true,
      message: budget.isNew ? 'Budget created successfully' : 'Budget updated successfully',
      budget: {
        ...budget.toObject(),
        health: healthData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save budget',
      error: error.message
    });
  }
};

// Add expense transaction
const addExpense = async (req, res) => {
  try {
    const { category, description, amount } = req.body;
    const normalizedCategory = category.toLowerCase().trim(); // Normalize input
    const currentMonth = new Date().toISOString().substring(0, 7);
    const defaultExpenseCategories = ['food', 'books', 'entertainment', 'transport', 'housing', 'utilities', 'healthcare', 'clothing', 'other'];

    let budget = await Budget.findOne({
      userId: req.user._id,
      month: currentMonth
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'No budget found for current month'
      });
    }

    // Auto-fix: Add missing expense categories to existing budgets
    const existingCategories = budget.expenses.map(exp => exp.category);
    const missingCategories = defaultExpenseCategories.filter(cat => !existingCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      const newCategories = missingCategories.map(category => ({
        category,
        budgeted: 0,
        actual: 0,
        transactions: []
      }));
      budget.expenses = [...budget.expenses, ...newCategories];
    }

    // Find the expense category (case-insensitive)
    const expenseCategory = budget.expenses.find(exp => exp.category === normalizedCategory);
    
    if (!expenseCategory) {
      return res.status(400).json({
        success: false,
        message: `Invalid expense category. Valid categories are: ${budget.expenses.map(e => e.category).join(', ')}`
      });
    }

    // Add transaction
    expenseCategory.transactions.push({
      description,
      amount,
      date: new Date()
    });

    // Update actual amount
    expenseCategory.actual += amount;

    await budget.save();

    res.json({
      success: true,
      message: 'Expense added successfully',
      budget
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add expense',
      error: error.message
    });
  }
};

// Get budget analytics
const getBudgetAnalytics = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    // Get last N months of budgets
    const budgets = await Budget.find({
      userId: req.user._id
    }).sort({ month: -1 }).limit(parseInt(months));

    const analytics = budgets.map(budget => {
      const health = calculateBudgetHealth(budget.income, budget.expenses);
      return {
        month: budget.month,
        totalIncome: health.totalIncome,
        totalExpenses: health.totalExpenses,
        savings: health.savings,
        savingsRate: health.savingsRate,
        healthScore: health.healthScore
      };
    });

    // Calculate trends
    const trends = {
      avgSavingsRate: analytics.reduce((sum, a) => sum + a.savingsRate, 0) / analytics.length,
      improvingTrend: analytics.length > 1 ? 
        analytics[0].savingsRate > analytics[analytics.length - 1].savingsRate : false
    };

    res.json({
      success: true,
      analytics,
      trends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get budget analytics',
      error: error.message
    });
  }
};

module.exports = {
  getCurrentBudget,
  createOrUpdateBudget,
  addExpense,
  getBudgetAnalytics
};