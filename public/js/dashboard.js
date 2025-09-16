let transactions = [];
let budgets = [];
let savings = [];
let expenseChart, trendChart;

document.addEventListener('DOMContentLoaded', async () => {
    if (!AuthManager.isAuthenticated()) {
        window.location.href = '/login';
        return;
    }

    await loadDashboardData();
    initializeCharts();
    
    // Set today's date as default for transaction form
    document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
});

async function loadDashboardData() {
    try {
        await Promise.all([
            loadTransactions(),
            loadBudgets(),
            loadSavings()
        ]);
        
        updateSummaryCards();
        updateCharts();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('danger', 'Failed to load dashboard data');
    }
}

async function loadTransactions() {
    const response = await AuthManager.makeAuthenticatedRequest('/api/transactions');
    if (response && response.ok) {
        const data = await response.json();
        transactions = data.transactions;
        renderTransactions();
    }
}

async function loadBudgets() {
    const response = await AuthManager.makeAuthenticatedRequest('/api/budgets');
    if (response && response.ok) {
        budgets = await response.json();
        renderBudgets();
    }
}

async function loadSavings() {
    const response = await AuthManager.makeAuthenticatedRequest('/api/savings');
    if (response && response.ok) {
        savings = await response.json();
        renderSavings();
    }
}

function renderTransactions() {
    const tbody = document.getElementById('transactions-table');
    tbody.innerHTML = '';
    
    transactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td><span class="badge bg-${transaction.type === 'income' ? 'success' : 'danger'}">${capitalizeFirst(transaction.type)}</span></td>
            <td>${transaction.category}</td>
            <td>${transaction.description || '-'}</td>
            <td>${formatCurrency(transaction.amount)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTransaction('${transaction._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function renderBudgets() {
    const container = document.getElementById('budgets-container');
    container.innerHTML = '';
    
    budgets.forEach(budget => {
        const progressPercentage = budget.budgetAmount > 0 ? (budget.spentAmount / budget.budgetAmount) * 100 : 0;
        const progressColor = progressPercentage > 90 ? 'danger' : progressPercentage > 70 ? 'warning' : 'success';
        
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        col.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="card-title mb-0">${budget.category}</h6>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBudget('${budget._id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-${progressColor}" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                    </div>
                    <small class="text-muted">
                        ${formatCurrency(budget.spentAmount)} / ${formatCurrency(budget.budgetAmount)}
                        (${progressPercentage.toFixed(1)}%)
                    </small>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function renderSavings() {
    const container = document.getElementById('savings-container');
    container.innerHTML = '';
    
    savings.forEach(goal => {
        const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        
        const col = document.createElement('div');
        col.className = 'col-md-6 mb-3';
        col.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h6 class="card-title mb-0">${goal.goalName}</h6>
                        <div>
                            <button class="btn btn-sm btn-outline-primary me-1" onclick="addToSavings('${goal._id}')">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteSavings('${goal._id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-info" style="width: ${Math.min(progressPercentage, 100)}%"></div>
                    </div>
                    <small class="text-muted">
                        ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}
                        (${progressPercentage.toFixed(1)}%)
                    </small>
                    <br>
                    <small class="text-muted">Target: ${formatDate(goal.targetDate)}</small>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function updateSummaryCards() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    
    const totalSavingsTarget = savings.reduce((sum, s) => sum + s.targetAmount, 0);
    const totalSavingsCurrent = savings.reduce((sum, s) => sum + s.currentAmount, 0);
    const savingsProgress = totalSavingsTarget > 0 ? (totalSavingsCurrent / totalSavingsTarget) * 100 : 0;
    
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('net-balance').textContent = formatCurrency(netBalance);
    document.getElementById('savings-progress').textContent = `${savingsProgress.toFixed(1)}%`;
    
    // Update card colors based on values
    const balanceCard = document.getElementById('net-balance').closest('.card');
    balanceCard.className = netBalance >= 0 ? 'card text-white bg-success' : 'card text-white bg-danger';
}

function initializeCharts() {
    // Initialize expense pie chart
    const expenseCtx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(expenseCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Initialize trend line chart
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Income',
                data: [],
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                tension: 0.4
            }, {
                label: 'Expenses',
                data: [],
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            }
        }
    });
}

function updateCharts() {
    updateExpenseChart();
    updateTrendChart();
}

function updateExpenseChart() {
    const expenses = transactions.filter(t => t.type === 'expense');
    const categoryTotals = {};
    
    expenses.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.update();
}

function updateTrendChart() {
    // Group transactions by month
    const monthlyData = {};
    
    transactions.forEach(transaction => {
        const monthKey = new Date(transaction.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short' 
        });
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
            monthlyData[monthKey].income += transaction.amount;
        } else {
            monthlyData[monthKey].expenses += transaction.amount;
        }
    });
    
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
    const incomeData = sortedMonths.map(month => monthlyData[month].income);
    const expenseData = sortedMonths.map(month => monthlyData[month].expenses);
    
    trendChart.data.labels = sortedMonths;
    trendChart.data.datasets[0].data = incomeData;
    trendChart.data.datasets[1].data = expenseData;
    trendChart.update();
}

async function addTransaction() {
    const formData = {
        type: document.getElementById('transactionType').value,
        amount: parseFloat(document.getElementById('transactionAmount').value),
        category: document.getElementById('transactionCategory').value,
        description: document.getElementById('transactionDescription').value,
        date: document.getElementById('transactionDate').value,
        paymentMethod: document.getElementById('paymentMethod').value
    };
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest('/api/transactions', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response && response.ok) {
            const newTransaction = await response.json();
            transactions.unshift(newTransaction);
            renderTransactions();
            updateSummaryCards();
            updateCharts();
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addTransactionModal'));
            modal.hide();
            document.getElementById('transactionForm').reset();
            
            showAlert('success', 'Transaction added successfully!');
        } else {
            const error = await response.json();
            showAlert('danger', error.message || 'Failed to add transaction');
        }
    } catch (error) {
        console.error('Add transaction error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest(`/api/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            transactions = transactions.filter(t => t._id !== id);
            renderTransactions();
            updateSummaryCards();
            updateCharts();
            showAlert('success', 'Transaction deleted successfully!');
        } else {
            showAlert('danger', 'Failed to delete transaction');
        }
    } catch (error) {
        console.error('Delete transaction error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

async function addBudget() {
    const formData = {
        category: document.getElementById('budgetCategory').value,
        budgetAmount: parseFloat(document.getElementById('budgetAmount').value),
        period: document.getElementById('budgetPeriod').value,
        endDate: document.getElementById('budgetEndDate').value
    };
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest('/api/budgets', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response && response.ok) {
            const newBudget = await response.json();
            budgets.unshift(newBudget);
            renderBudgets();
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addBudgetModal'));
            modal.hide();
            document.getElementById('budgetForm').reset();
            
            showAlert('success', 'Budget added successfully!');
        } else {
            const error = await response.json();
            showAlert('danger', error.message || 'Failed to add budget');
        }
    } catch (error) {
        console.error('Add budget error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

async function deleteBudget(id) {
    if (!confirm('Are you sure you want to delete this budget?')) return;
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest(`/api/budgets/${id}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            budgets = budgets.filter(b => b._id !== id);
            renderBudgets();
            showAlert('success', 'Budget deleted successfully!');
        } else {
            showAlert('danger', 'Failed to delete budget');
        }
    } catch (error) {
        console.error('Delete budget error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

async function addSavingsGoal() {
    const formData = {
        goalName: document.getElementById('goalName').value,
        targetAmount: parseFloat(document.getElementById('targetAmount').value),
        targetDate: document.getElementById('targetDate').value,
        category: document.getElementById('savingsCategory').value,
        description: document.getElementById('savingsDescription').value
    };
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest('/api/savings', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (response && response.ok) {
            const newGoal = await response.json();
            savings.unshift(newGoal);
            renderSavings();
            updateSummaryCards();
            
            // Close modal and reset form
            const modal = bootstrap.Modal.getInstance(document.getElementById('addSavingsModal'));
            modal.hide();
            document.getElementById('savingsForm').reset();
            
            showAlert('success', 'Savings goal added successfully!');
        } else {
            const error = await response.json();
            showAlert('danger', error.message || 'Failed to add savings goal');
        }
    } catch (error) {
        console.error('Add savings goal error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

async function addToSavings(id) {
    const amount = prompt('Enter amount to add to savings:');
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) return;
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest(`/api/savings/${id}/add`, {
            method: 'POST',
            body: JSON.stringify({ amount: parseFloat(amount) })
        });
        
        if (response && response.ok) {
            const updatedGoal = await response.json();
            const index = savings.findIndex(s => s._id === id);
            if (index !== -1) {
                savings[index] = updatedGoal;
            }
            renderSavings();
            updateSummaryCards();
            showAlert('success', `${formatCurrency(parseFloat(amount))} added to savings goal!`);
        } else {
            showAlert('danger', 'Failed to add to savings goal');
        }
    } catch (error) {
        console.error('Add to savings error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}

async function deleteSavings(id) {
    if (!confirm('Are you sure you want to delete this savings goal?')) return;
    
    try {
        const response = await AuthManager.makeAuthenticatedRequest(`/api/savings/${id}`, {
            method: 'DELETE'
        });
        
        if (response && response.ok) {
            savings = savings.filter(s => s._id !== id);
            renderSavings();
            updateSummaryCards();
            showAlert('success', 'Savings goal deleted successfully!');
        } else {
            showAlert('danger', 'Failed to delete savings goal');
        }
    } catch (error) {
        console.error('Delete savings goal error:', error);
        showAlert('danger', 'Network error. Please try again.');
    }
}