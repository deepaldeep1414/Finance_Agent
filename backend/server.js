const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data store (since no DB specified)
let expenses = [];
let budget = { total: 0, used: 0, period: 'monthly' };

app.post('/api/add-expense', (req, res) => {
    const { amount, category, date, title } = req.body;
    const newExpense = { id: Date.now(), amount, category, date, title };
    expenses.push(newExpense);
    budget.used += Number(amount);
    res.json({ success: true, expense: newExpense, budget });
});

app.get('/api/get-expenses', (req, res) => {
    res.json(expenses);
});

app.post('/api/set-budget', (req, res) => {
    const { total, period } = req.body;
    budget.total = Number(total);
    budget.period = period || 'monthly';
    res.json({ success: true, budget });
});

app.post('/api/analyze', (req, res) => {
    // Call python agent for analysis
    runPythonAgent("analyze_finances", { expenses, budget }, res);
});

app.post('/api/ai-decision', (req, res) => {
    const { query, price } = req.body;
    runPythonAgent("ai_decision", { query, price, expenses, budget }, res);
});

function runPythonAgent(action, payload, res) {
    const pythonProcess = spawn('python', [
        path.join(__dirname, '../agent_v2/agent.py'),
        action,
        JSON.stringify(payload)
    ]);

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}: ${errorData}`);
            return res.status(500).json({ error: 'Agent execution failed', details: errorData });
        }
        try {
            // Find JSON in the output
            const match = outputData.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            const jsonStr = match ? match[0] : outputData;
            const result = JSON.parse(jsonStr);
            res.json(result);
        } catch (e) {
            console.error("Failed to parse python output:", outputData);
            res.status(500).json({ error: 'Invalid agent response', raw: outputData });
        }
    });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
