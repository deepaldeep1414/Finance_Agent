const API_URL = 'http://localhost:5000/api';
let expenses = [];
let budget = { total: 0, used: 0, period: 'monthly' };
let chartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initForms();
    fetchData();
});

function initTabs() {
    const tabs = document.querySelectorAll('.sidebar li');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.sidebar li').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
}

function initForms() {
    document.getElementById('budget-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const total = document.getElementById('bud-total').value;
        const period = document.getElementById('bud-period').value;
        
        try {
            const res = await fetch(`${API_URL}/set-budget`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ total, period })
            });
            const data = await res.json();
            if (data.success) {
                budget = data.budget;
                updateDashboard();
                alert('Budget saved!');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to set budget. Is the backend running?');
        }
    });

    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('exp-title').value;
        const amount = document.getElementById('exp-amount').value;
        const category = document.getElementById('exp-category').value;
        const date = document.getElementById('exp-date').value;
        
        try {
            const res = await fetch(`${API_URL}/add-expense`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, amount, category, date })
            });
            const data = await res.json();
            if (data.success) {
                expenses.push(data.expense);
                budget = data.budget;
                updateDashboard();
                document.getElementById('expense-form').reset();
                alert('Expense added!');
            }
        } catch (err) {
            console.error(err);
            alert('Failed to add expense. Is the backend running?');
        }
    });

    document.getElementById('ask-ai-btn').addEventListener('click', async () => {
        const price = document.getElementById('ai-price').value;
        if (!price) return alert('Enter a price first!');
        
        const resBox = document.getElementById('ai-response');
        resBox.innerHTML = 'Thinking... <span style="animation: pulse 1s infinite">🧠</span>';
        
        try {
            const res = await fetch(`${API_URL}/ai-decision`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: 'can I afford this', price })
            });
            const data = await res.json();
            
            resBox.innerHTML = `
                <strong>Decision:</strong> <span style="color: ${data.decision === 'YES' || data.decision === 'INFO' ? 'var(--success)' : 'var(--danger)'}">${data.decision}</span><br>
                <strong>Reason:</strong> ${data.reason}
            `;
        } catch (err) {
            resBox.innerHTML = '<span style="color: var(--danger)">Error communicating with AI Agent. Is the backend running?</span>';
        }
    });

    document.getElementById('analyze-btn').addEventListener('click', async () => {
        const resBox = document.getElementById('analysis-response');
        resBox.innerHTML = 'Analyzing... 📊';
        
        try {
            const res = await fetch(`${API_URL}/analyze`, { method: 'POST' });
            const data = await res.json();
            
            if (data.error) {
                resBox.innerHTML = `<span style="color: var(--danger)">Agent Error: ${data.error}</span>`;
                return;
            }

            resBox.innerHTML = `
                <strong>Analysis:</strong> ${data.analysis}<br>
                <strong>Insights:</strong><ul>${data.insights.map(i => `<li>${i}</li>`).join('')}</ul>
            `;
        } catch (err) {
            resBox.innerHTML = '<span style="color: var(--danger)">Error during analysis. Is backend running?</span>';
        }
    });
}

async function fetchData() {
    try {
        const res = await fetch(`${API_URL}/get-expenses`);
        expenses = await res.json();
        updateDashboard();
    } catch (e) {
        console.log("Backend not connected yet. Using mock data.");
        updateDashboard();
    }
}

function updateDashboard() {
    // Totals
    const totalSpent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const remaining = Number(budget.total) - totalSpent;
    
    document.getElementById('total-spent-display').innerText = `$${totalSpent.toFixed(2)}`;
    document.getElementById('remaining-budget-display').innerText = `$${remaining.toFixed(2)}`;
    document.getElementById('remaining-budget-display').style.color = remaining < 0 ? 'var(--danger)' : 'var(--text-primary)';

    // List
    const list = document.getElementById('tx-list');
    list.innerHTML = '';
    [...expenses].reverse().slice(0, 5).forEach(exp => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${exp.title} (${exp.category})</span> <strong>$${Number(exp.amount).toFixed(2)}</strong>`;
        list.appendChild(li);
    });

    // Chart
    updateChart();
}

function updateChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const categories = {};
    
    expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + Number(exp.amount);
    });

    if (chartInstance) {
        chartInstance.destroy();
    }

    if (Object.keys(categories).length === 0) return;

    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'right', labels: { color: '#f8fafc' } }
            }
        }
    });
}
