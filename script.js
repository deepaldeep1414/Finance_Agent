// ==========================================
// Smart Personal Finance AI Agent - Main Script
// ==========================================

// --- State Management ---
const AppState = {
    currentUser: null,
    expenses: [
        { id: 1, description: 'Starbucks Coffee', amount: 450, category: 'Food', date: new Date().toISOString().split('T')[0] },
        { id: 2, description: 'Uber Trip', amount: 320, category: 'Travel', date: new Date().toISOString().split('T')[0] },
        { id: 3, description: 'Amazon Shopping', amount: 2500, category: 'Shopping', date: new Date().toISOString().split('T')[0] },
        { id: 4, description: 'Electricity Bill', amount: 1800, category: 'Bills', date: new Date().toISOString().split('T')[0] },
        { id: 5, description: 'Cinema Tickets', amount: 600, category: 'Entertainment', date: new Date().toISOString().split('T')[0] }
    ],
    budget: { amount: 50000, period: 'Monthly' },
    goals: [
        { name: 'Emergency Fund', target: 100000, current: 42000, targetDate: '2025-12-31' },
        { name: 'New Car', target: 500000, current: 400000, targetDate: '2025-06-30' }
    ],
    notifications: [],
    audioEnabled: true,
    audioLimitDaily: true,
    lastAudioDate: null,
    budgetAlert80Triggered: false,
    darkTheme: true,
    aiMemory: {
        spendingPatterns: {},
        commonMerchants: [],
        userPreferences: {}
    }
};

// --- DOM Elements ---
const Elements = {
    loginView: () => document.getElementById('login-view'),
    appView: () => document.getElementById('app-view'),
    loginForm: () => document.getElementById('login-form'),
    loginUsername: () => document.getElementById('login-username'),
    logoutBtn: () => document.getElementById('logout-btn'),
    profileLogoutBtn: () => document.getElementById('profile-logout-btn'),
    navButtons: () => document.querySelectorAll('.nav-btn[data-target]'),
    pages: () => document.querySelectorAll('.page'),
    userGreeting: () => document.getElementById('user-greeting'),
    profileName: () => document.getElementById('profile-name'),
    themeToggle: () => document.getElementById('theme-toggle'),
    expenseForm: () => document.getElementById('expense-form'),
    expenseName: () => document.getElementById('expense-name'),
    expenseAmount: () => document.getElementById('expense-amount'),
    expenseCategory: () => document.getElementById('expense-category'),
    expenseDate: () => document.getElementById('expense-date'),
    totalSpentDisplay: () => document.getElementById('total-spent-display'),
    remainingBalanceDisplay: () => document.getElementById('remaining-balance-display'),
    totalBudgetDisplay: () => document.getElementById('total-budget-display'),
    budgetPeriodDisplay: () => document.getElementById('budget-period-display'),
    balanceStatusText: () => document.getElementById('balance-status-text'),
    balanceCard: () => document.getElementById('balance-card'),
    budgetForm: () => document.getElementById('budget-form'),
    budgetInput: () => document.getElementById('budget-input'),
    budgetPeriod: () => document.getElementById('budget-period'),
    fullTransactionsList: () => document.getElementById('full-transactions-list'),
    goalsListContainer: () => document.getElementById('goals-list-container'),
    goalName: () => document.getElementById('goal-name'),
    goalAmount: () => document.getElementById('goal-amount'),
    goalDate: () => document.getElementById('goal-date'),
    btnCreateGoal: () => document.getElementById('btn-create-goal'),
    chatForm: () => document.getElementById('chat-form'),
    chatInput: () => document.getElementById('chat-input'),
    chatWindow: () => document.getElementById('chat-window'),
    aiAlertsContainer: () => document.getElementById('ai-alerts-container'),
    aiUserProfile: () => document.getElementById('ai-user-profile'),
    notificationsList: () => document.getElementById('notifications-list'),
    profileTxCount: () => document.getElementById('profile-tx-count'),
    profileJoinDate: () => document.getElementById('profile-join-date'),
    audioToggleBtn: () => document.getElementById('audio-toggle-btn'),
    audioLimitBtn: () => document.getElementById('audio-limit-btn'),
    exportPdfBtn: () => document.getElementById('export-pdf-btn'),
    particlesContainer: () => document.getElementById('particles-container')
};

// --- Audio Context for Beeps ---
const AudioSys = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    canPlay() {
        if (!AppState.audioEnabled) return false;
        if (AppState.audioLimitDaily && AppState.lastAudioDate === new Date().toDateString()) return false;
        return true;
    },
    beep(freq = 800, type = 'sine', duration = 0.1) {
        if (!this.canPlay()) return;
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
        AppState.lastAudioDate = new Date().toDateString();
        Storage.save();
    },
    success() { this.beep(1200, 'sine', 0.15); setTimeout(() => this.beep(1600, 'sine', 0.2), 100); },
    warning() { this.beep(400, 'sawtooth', 0.3); },
    notify() { this.beep(1000, 'sine', 0.1); }
};

// --- Storage Management ---
const Storage = {
    key: 'smartFinanceAI_Data',
    save() {
        const data = {
            expenses: AppState.expenses,
            budget: AppState.budget,
            goals: AppState.goals,
            audioEnabled: AppState.audioEnabled,
            audioLimitDaily: AppState.audioLimitDaily,
            lastAudioDate: AppState.lastAudioDate,
            darkTheme: AppState.darkTheme,
            aiMemory: AppState.aiMemory,
            currentUser: AppState.currentUser,
            joinDate: AppState.joinDate
        };
        localStorage.setItem(this.key, JSON.stringify(data));
    },
    load() {
        const raw = localStorage.getItem(this.key);
        if (raw) {
            try {
                const data = JSON.parse(raw);
                if (data.expenses && data.expenses.length > 0) AppState.expenses = data.expenses;
                if (data.budget && data.budget.amount > 0) AppState.budget = data.budget;
                if (data.goals && data.goals.length > 0) AppState.goals = data.goals;
                AppState.audioEnabled = data.audioEnabled !== undefined ? data.audioEnabled : true;
                AppState.aiMemory = data.aiMemory || AppState.aiMemory;
                AppState.currentUser = data.currentUser || AppState.currentUser;
                AppState.joinDate = data.joinDate || AppState.joinDate;
            } catch (e) {
                console.error("Failed to parse saved data", e);
            }
        }
    },
    clear() {
        localStorage.removeItem(this.key);
    }
};

// --- AI Agent Logic ---
const AIAgent = {
    // Categories with keywords for auto-detection
    categoryKeywords: {
        'Food': ['food', 'restaurant', 'dinner', 'lunch', 'breakfast', 'cafe', 'coffee', 'starbucks', 'dominos', 'pizza', 'burger', 'mcd', 'kfc', 'zomato', 'swiggy', 'eat', 'meal', 'snack', 'groceries', 'supermarket', 'bigbasket', 'blinkit'],
        'Travel': ['uber', 'ola', 'taxi', 'cab', 'bus', 'train', 'flight', 'airport', 'hotel', 'stay', 'travel', 'trip', 'vacation', 'tour', 'petrol', 'diesel', 'fuel', 'mileage'],
        'Shopping': ['shopping', 'mall', 'store', 'shop', 'amazon', 'flipkart', 'myntra', 'ajio', 'clothes', 'shoes', 'jacket', 'shirt', 'dress', 'electronics', 'phone', 'laptop', 'gadget'],
        'Bills': ['bill', 'electricity', 'water', 'gas', 'internet', 'wifi', 'broadband', 'mobile', 'recharge', 'dth', 'rent', 'emi', 'loan', 'insurance', 'tax'],
        'Health': ['hospital', 'doctor', 'medicine', 'pharmacy', 'medical', 'health', 'fitness', 'gym', 'yoga', 'clinic', 'dentist', 'healthcare'],
        'Entertainment': ['movie', 'cinema', 'theatre', 'netflix', 'prime', 'hotstar', 'disney', 'spotify', 'music', 'concert', 'event', 'game', 'pub', 'bar', 'party']
    },

    // Merchant aliases mapping
    merchantAliases: {
        'dominos': 'Domino\'s Pizza',
        'starbucks': 'Starbucks Coffee',
        'mcd': 'McDonald\'s',
        'mcdonalds': 'McDonald\'s',
        'kfc': 'KFC',
        'uber': 'Uber',
        'ola': 'Ola Cabs',
        'amazon': 'Amazon',
        'flipkart': 'Flipkart',
        'zomato': 'Zomato',
        'swiggy': 'Swiggy',
        'bigbasket': 'BigBasket',
        'blinkit': 'Blinkit'
    },

    autoDetectCategory(description) {
        const lowerDesc = description.toLowerCase();
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            for (const keyword of keywords) {
                if (lowerDesc.includes(keyword)) {
                    return category;
                }
            }
        }
        return 'Other';
    },

    normalizeMerchant(description) {
        const lowerDesc = description.toLowerCase();
        for (const [alias, canonical] of Object.entries(this.merchantAliases)) {
            if (lowerDesc.includes(alias)) {
                return canonical;
            }
        }
        // Capitalize first letter of each word
        return description.replace(/\b\w/g, l => l.toUpperCase());
    },

    processNaturalLanguage(input) {
        const lower = input.toLowerCase();
        
        // Pattern: "spent X on Y" or "X on Y" or "Y cost X"
        const spentPatterns = [
            /spent\s+(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)\s+(?:on|for|at)\s+(.+)/i,
            /(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)\s+(?:on|for|at)\s+(.+)/i,
            /(.+)\s+(?:cost|costs|costed)\s+(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)/i,
            /(.+)\s+(\d+(?:\.\d{1,2})?)\s*(?:rs|rupees?)?/i,
            /(?:paid|spent)\s+(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:for|to)?\s*(.+)/i
        ];

        for (const pattern of spentPatterns) {
            const match = input.match(pattern);
            if (match) {
                let amount, description;
                if (pattern.toString().includes('cost')) {
                    description = match[1];
                    amount = parseFloat(match[2]);
                } else if (pattern.toString().includes('(.+)\s+(\d+)')) {
                    description = match[1];
                    amount = parseFloat(match[2]);
                } else {
                    amount = parseFloat(match[1]);
                    description = match[2];
                }
                
                if (amount && description) {
                    const category = this.autoDetectCategory(description);
                    const merchant = this.normalizeMerchant(description.trim());
                    return {
                        type: 'expense',
                        amount: amount,
                        description: merchant,
                        rawDescription: description.trim(),
                        category: category,
                        date: new Date().toISOString().split('T')[0]
                    };
                }
            }
        }

        // Query patterns
        if (lower.includes('how much') || lower.includes('total') || lower.includes('spent')) {
            if (lower.includes('food') || lower.includes('eat') || lower.includes('dining')) {
                return { type: 'query', query: 'category_spending', category: 'Food' };
            }
            if (lower.includes('travel') || lower.includes('transport')) {
                return { type: 'query', query: 'category_spending', category: 'Travel' };
            }
            if (lower.includes('shopping')) {
                return { type: 'query', query: 'category_spending', category: 'Shopping' };
            }
            if (lower.includes('this month') || lower.includes('monthly')) {
                return { type: 'query', query: 'monthly_total' };
            }
            return { type: 'query', query: 'total_spent' };
        }

        if (lower.includes('can i afford') || lower.includes('should i buy')) {
            const amountMatch = input.match(/(?:rs\.?|₹)?\s*(\d+(?:\.\d{1,2})?)/);
            if (amountMatch) {
                return { type: 'query', query: 'affordability', amount: parseFloat(amountMatch[1]) };
            }
        }

        if (lower.includes('budget') || lower.includes('remaining')) {
            return { type: 'query', query: 'budget_status' };
        }

        if (lower.includes('save') || lower.includes('tips') || lower.includes('50/30/20')) {
            return { type: 'query', query: 'saving_tips' };
        }

        if (lower.includes('retirement') || lower.includes('old age') || lower.includes('long term')) {
            return { type: 'query', query: 'retirement_advice' };
        }

        if (lower.includes('emergency') || lower.includes('rainy day')) {
            return { type: 'query', query: 'emergency_fund' };
        }

        if (lower.includes('tax') || lower.includes('optimization') || lower.includes('capital gains')) {
            return { type: 'query', query: 'tax_optimization' };
        }

        if (lower.includes('inflation') || lower.includes('purchasing power')) {
            return { type: 'query', query: 'inflation_protection' };
        }

        if (lower.includes('house') || lower.includes('home') || lower.includes('mortgage')) {
            return { type: 'query', query: 'house_buying' };
        }

        if (lower.includes('fire') || lower.includes('independence') || lower.includes('early retirement')) {
            return { type: 'query', query: 'fire_movement' };
        }

        if (lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('eth')) {
            return { type: 'query', query: 'crypto_risk' };
        }

        if (lower.includes('volatile') || lower.includes('market') || lower.includes('fomo')) {
            return { type: 'query', query: 'market_volatility' };
        }

        if (lower.includes('net worth') || lower.includes('assets') || lower.includes('liabilities')) {
            return { type: 'query', query: 'net_worth' };
        }

        if (lower.includes('side hustle') || lower.includes('freelance') || lower.includes('extra income')) {
            return { type: 'query', query: 'side_hustle' };
        }

        if (lower.includes('estate') || lower.includes('will') || lower.includes('trust')) {
            return { type: 'query', query: 'estate_planning' };
        }

        if (lower.includes('geo') || lower.includes('arbitrage') || lower.includes('digital nomad')) {
            return { type: 'query', query: 'geo_arbitrage' };
        }

        if (lower.includes('recession') || lower.includes('economic crash') || lower.includes('downturn')) {
            return { type: 'query', query: 'recession_prep' };
        }

        if (lower.includes('score') || lower.includes('credit limit') || lower.includes('credit score')) {
            return { type: 'query', query: 'credit_engineering' };
        }

        if (lower.includes('child') || lower.includes('education') || lower.includes('generation')) {
            return { type: 'query', query: 'generational_wealth' };
        }

        return { type: 'unknown', message: "I am your **Fiduciary Grandmaster Advisor**. I can handle everything from daily Tracking to **Geo-arbitrage**, **Recession Preparation**, **Credit Engineering**, and **Generational Wealth Planning**. What is our long-term vision?" };
    },
    generateInsights() {
        const insights = [];
        const expenses = AppState.expenses;
        const budget = AppState.budget.amount;

        if (expenses.length === 0) {
            return [{ type: 'info', message: 'Start adding expenses to get AI insights!' }];
        }

        // Calculate totals by category
        const categoryTotals = {};
        let totalSpent = 0;
        expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
            totalSpent += e.amount;
        });

        // Find highest spending category
        let maxCategory = '';
        let maxAmount = 0;
        for (const [cat, amt] of Object.entries(categoryTotals)) {
            if (amt > maxAmount) {
                maxAmount = amt;
                maxCategory = cat;
            }
        }

        if (maxCategory) {
            insights.push({
                type: 'info',
                message: `Your highest spending category is ${maxCategory} at ₹${maxAmount.toFixed(2)}`,
                icon: 'fa-chart-pie'
            });
        }

        // Budget warning
        if (budget > 0) {
            const percentUsed = (totalSpent / budget) * 100;
            if (percentUsed >= 100) {
                insights.push({
                    type: 'warning',
                    message: `Budget exceeded! You've spent ₹${totalSpent.toFixed(2)} of ₹${budget}`,
                    icon: 'fa-triangle-exclamation'
                });
            } else if (percentUsed >= 80) {
                insights.push({
                    type: 'warning',
                    message: `You've used ${percentUsed.toFixed(1)}% of your budget`,
                    icon: 'fa-circle-exclamation'
                });
            }
        }

        // Recent spending trend
        if (expenses.length >= 3) {
            const recent = expenses.slice(-3);
            const recentTotal = recent.reduce((sum, e) => sum + e.amount, 0);
            insights.push({
                type: 'suggestion',
                message: `Last 3 transactions total ₹${recentTotal.toFixed(2)}. Average: ₹${(recentTotal/3).toFixed(2)}`,
                icon: 'fa-clock'
            });
        }

        // Day of week analysis
        const daySpending = {};
        expenses.forEach(e => {
            const day = new Date(e.date).toLocaleDateString('en-US', { weekday: 'long' });
            daySpending[day] = (daySpending[day] || 0) + e.amount;
        });
        
        let maxDay = '';
        let maxDayAmount = 0;
        for (const [day, amt] of Object.entries(daySpending)) {
            if (amt > maxDayAmount) {
                maxDayAmount = amt;
                maxDay = day;
            }
        }
        
        if (maxDay) {
            insights.push({
                type: 'info',
                message: `You tend to spend more on ${maxDay}s (₹${maxDayAmount.toFixed(2)} total)`,
                icon: 'fa-calendar'
            });
        }

        return insights;
    },

    updateUserProfile() {
        const expenses = AppState.expenses;
        const profileEl = Elements.aiUserProfile();
        if (!profileEl) return;

        if (expenses.length === 0) {
            profileEl.innerHTML = '<em>The Agent is currently gathering data...</em>';
            return;
        }

        // Calculate statistics
        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
        const avgTransaction = totalSpent / expenses.length;
        const categoryCounts = {};
        expenses.forEach(e => {
            categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        });

        // Find preferred category
        let preferredCat = '';
        let maxCount = 0;
        for (const [cat, count] of Object.entries(categoryCounts)) {
            if (count > maxCount) {
                maxCount = count;
                preferredCat = cat;
            }
        }

        // Recent merchants
        const recentMerchants = [...new Set(expenses.slice(-5).map(e => e.description))].slice(0, 3);

        // Memory Statistics Calculations
        const memoryPatterns = Object.keys(categoryCounts).length;
        const memoryHits = expenses.length * 2; // Mock calculation for "context hits"
        
        // Profile completion (mock based on data variety)
        let completion = 0;
        if (expenses.length > 0) completion += 20;
        if (expenses.length > 5) completion += 20;
        if (memoryPatterns > 2) completion += 20;
        if (AppState.budget.amount > 0) completion += 20;
        if (AppState.goals.length > 0) completion += 20;

        // Update UI Elements
        const recallPercentEl = document.getElementById('memory-recall-percent');
        if (recallPercentEl) recallPercentEl.textContent = `${completion}%`;

        const hitsEl = document.getElementById('memory-hits');
        if (hitsEl) hitsEl.textContent = memoryHits.toLocaleString();

        const patternsEl = document.getElementById('memory-patterns');
        if (patternsEl) patternsEl.textContent = memoryPatterns;

        let html = `
            <div style="margin-bottom: 0.8rem;"><strong>Spending Pattern:</strong> ${preferredCat}-heavy user</div>
            <div style="margin-bottom: 0.8rem;"><strong>Average Transaction:</strong> ₹${avgTransaction.toFixed(2)}</div>
            <div style="margin-bottom: 0.8rem;"><strong>Transaction Count:</strong> ${expenses.length}</div>
            <div><strong>Recent Merchants:</strong> ${recentMerchants.join(', ') || 'N/A'}</div>
        `;
        
        profileEl.innerHTML = html;
    }
};

// --- Chart Management ---

const Charts = {
    init() {
        this.update();
    },

    update() {
        const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
        const categoryTotals = {};
        let total = 0;
        
        AppState.expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
            total += e.amount;
        });

        this.renderDynamicSVG(categoryTotals, total);
    },

    renderDynamicSVG(categoryTotals, total) {
        const container = document.getElementById('chart-parent');
        if (!container) return;

        const categories = ['Food', 'Travel', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
        const colors = {
            'Food': '#6ab04c',          // Forest Green
            'Travel': '#4834d4',        // Deep Blue
            'Shopping': '#be2edd',      // Bright Purple
            'Bills': '#eb4d4b',         // Carmine Red
            'Health': '#22a6b3',        // Deep Cyan
            'Entertainment': '#f9ca24', // Sun Yellow
            'Other': '#535c68'          // Slate Grey
        };

        if (total === 0) {
            // Default view if no data
            container.innerHTML = `
                <div style="text-align: center; opacity: 0.5;">
                    <i class="fa-solid fa-chart-pie" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <div>Waiting for expenses...</div>
                </div>
            `;
            return;
        }

        let currentOffset = 0;
        const radius = 40;
        const circumference = 2 * Math.PI * radius; // ~251.2

        let svgHtml = `<svg viewBox="0 0 100 100" style="width: 280px; height: 280px; transform: rotate(-90deg); filter: drop-shadow(0 10px 20px rgba(0,0,0,0.3));">`;
        let legendHtml = `<div class="chart-legend-overlay" style="position: absolute; bottom: -40px; display: flex; flex-wrap: wrap; justify-content: center; gap: 0.8rem; font-size: 0.75rem; font-weight: 600; width: 100%;">`;

        categories.forEach(cat => {
            const amount = categoryTotals[cat] || 0;
            if (amount > 0) {
                const percent = amount / total;
                const dashArray = `${percent * circumference} ${circumference}`;
                const dashOffset = -currentOffset;
                
                svgHtml += `<circle cx="50" cy="50" r="${radius}" fill="transparent" stroke="${colors[cat]}" stroke-width="18" 
                    stroke-dasharray="${dashArray}" stroke-dashoffset="${dashOffset}" style="transition: all 0.5s ease;" />`;
                
                legendHtml += `
                    <div style="display: flex; align-items: center; gap: 0.3rem;">
                        <span style="width: 8px; height: 8px; background: ${colors[cat]}; border-radius: 50%;"></span> 
                        ${cat} (${(percent * 100).toFixed(0)}%)
                    </div>`;
                
                currentOffset += percent * circumference;
            }
        });

        svgHtml += `</svg>`;
        legendHtml += `</div>`;
        
        container.innerHTML = svgHtml + legendHtml;
    },

    updateTheme() {
        this.update();
    }
};

// --- UI Updates ---
const UI = {
    updateDashboard() {
        const totalSpent = AppState.expenses.reduce((sum, e) => sum + e.amount, 0);
        const budget = AppState.budget.amount;
        const remaining = budget - totalSpent;

        const totalBudgetEl = Elements.totalBudgetDisplay();
        if (totalBudgetEl) totalBudgetEl.textContent = `₹${budget.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        
        const periodEl = Elements.budgetPeriodDisplay();
        if (periodEl) periodEl.textContent = `(${AppState.budget.period || 'Monthly'})`;

        Elements.totalSpentDisplay().textContent = `₹${totalSpent.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        Elements.remainingBalanceDisplay().textContent = `₹${remaining.toLocaleString('en-IN', {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;

        const balanceCard = Elements.balanceCard();
        const statusText = Elements.balanceStatusText();

        balanceCard.classList.remove('warning', 'danger');
        
        if (budget === 0) {
            statusText.textContent = 'Set a budget first';
            statusText.style.opacity = '0.7';
        } else if (remaining < 0) {
            balanceCard.classList.add('danger');
            statusText.textContent = 'Over Budget!';
        } else if (remaining / budget < 0.2) {
            balanceCard.classList.add('warning');
            statusText.textContent = 'Low Balance';
        } else {
            statusText.textContent = 'Good Standing';
        }

        // 80% Budget Alert (One-time)
        if (budget > 0 && totalSpent / budget >= 0.8 && !AppState.budgetAlert80Triggered) {
            AudioSys.warning(); // Using warning sound for threshold
            AppState.budgetAlert80Triggered = true;
            Storage.save();
            UI.showToast("Budget Alert: You have spent over 80% of your budget!", "warning");
        }

        Charts.update();
    },

    updateTransactionsList() {
        const container = Elements.fullTransactionsList();
        if (!container) return;

        if (AppState.expenses.length === 0) {
            container.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 3rem;">No transactions yet. Add your first expense!</div>';
            return;
        }

        const categoryIcons = {
            'Food': 'fa-utensils',
            'Travel': 'fa-car',
            'Shopping': 'fa-bag-shopping',
            'Bills': 'fa-file-invoice',
            'Health': 'fa-heart-pulse',
            'Entertainment': 'fa-film',
            'Other': 'fa-box'
        };

        const sorted = [...AppState.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));

        container.innerHTML = sorted.map(tx => `
            <div class="transaction-item">
                <div class="tx-info">
                    <div class="tx-icon" style="background: linear-gradient(135deg, var(--primary), var(--secondary));">
                        <i class="fa-solid ${categoryIcons[tx.category] || 'fa-box'}"></i>
                    </div>
                    <div>
                        <div style="font-weight: 600;">${tx.description}</div>
                        <div style="font-size: 0.85rem; opacity: 0.7;">${tx.category} • ${new Date(tx.date).toLocaleDateString()}</div>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div class="tx-amount">-₹${tx.amount.toFixed(2)}</div>
                    <button class="delete-tx-btn" onclick="Handlers.deleteTransaction(${tx.id})" title="Delete Transaction" 
                        style="background: none; border: none; color: #ff4d4d; cursor: pointer; padding: 0.5rem; opacity: 0.6; transition: all 0.3s ease;">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },

    updateGoals() {
        const container = Elements.goalsListContainer();
        if (!container) return;

        if (AppState.goals.length === 0) {
            container.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">No active goals. Create one!</div>';
            return;
        }

        container.innerHTML = AppState.goals.map((goal, idx) => {
            const percent = Math.min(100, (goal.current / goal.target) * 100);
            const isPurple = idx % 2 === 1;
            return `
                <div class="goal-item">
                    <div class="goal-header">
                        <span>${goal.name}</span>
                        <span>${percent.toFixed(0)}%</span>
                    </div>
                    <div class="goal-track">
                        <div class="goal-fill ${isPurple ? 'purple' : ''}" style="width: ${percent}%;"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; opacity: 0.7; margin-top: 0.3rem;">
                        <span>₹${goal.current.toLocaleString()} of ₹${goal.target.toLocaleString()}</span>
                        <span>Target: ${new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        }).join('');
    },

    updateAIInsights() {
        const container = Elements.aiAlertsContainer();
        if (!container) return;

        const insights = AIAgent.generateInsights();
        
        container.innerHTML = insights.map(insight => `
            <div class="insight-item ${insight.type}">
                <i class="fa-solid ${insight.icon || 'fa-lightbulb'}"></i>
                <div>${insight.message}</div>
            </div>
        `).join('');

        AIAgent.updateUserProfile();
    },

    updateNotifications() {
        const container = Elements.notificationsList();
        if (!container) return;

        // Generate notifications based on state
        const notifications = [];
        const totalSpent = AppState.expenses.reduce((sum, e) => sum + e.amount, 0);
        const budget = AppState.budget.amount;

        if (budget > 0 && totalSpent > budget) {
            notifications.push({
                icon: 'fa-triangle-exclamation',
                color: 'var(--danger)',
                title: 'Budget Alert',
                message: `You've exceeded your budget by ₹${(totalSpent - budget).toFixed(2)}`,
                time: 'Just now'
            });
        }

        if (AppState.expenses.length > 0) {
            const lastTx = AppState.expenses[AppState.expenses.length - 1];
            notifications.push({
                icon: 'fa-check-circle',
                color: 'var(--success)',
                title: 'Transaction Added',
                message: `Added ${lastTx.description} for ₹${lastTx.amount.toFixed(2)}`,
                time: 'Just now'
            });
        }

        if (notifications.length === 0) {
            container.innerHTML = '<div style="text-align: center; opacity: 0.5; padding: 2rem;">No new notifications.</div>';
            return;
        }

        container.innerHTML = notifications.map(n => `
            <div style="display: flex; gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 12px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: ${n.color}20; display: flex; align-items: center; justify-content: center;">
                    <i class="fa-solid ${n.icon}" style="color: ${n.color};"></i>
                </div>
                <div style="flex-grow: 1;">
                    <div style="font-weight: 600; margin-bottom: 0.2rem;">${n.title}</div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${n.message}</div>
                </div>
                <div style="font-size: 0.8rem; opacity: 0.5;">${n.time}</div>
            </div>
        `).join('');
    },

    updateProfile() {
        Elements.profileTxCount().textContent = AppState.expenses.length;
        Elements.profileJoinDate().textContent = AppState.joinDate;
        Elements.audioToggleBtn().checked = AppState.audioEnabled;
        Elements.audioLimitBtn().checked = AppState.audioLimitDaily;
    },

    addChatMessage(message, isUser = false) {
        const chatWindow = Elements.chatWindow();
        if (!chatWindow) return;

        // Render simple markdown bold (**text**) as HTML strong
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message ${isUser ? 'user-message' : 'ai-message'}`;
        msgDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'}"></i></div>
            <div class="message-bubble">${formattedMessage}</div>
        `;
        chatWindow.appendChild(msgDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    },

    showTypingIndicator() {
        const chatWindow = Elements.chatWindow();
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'chat-message ai-message';
        typingDiv.innerHTML = `
            <div class="message-avatar"><i class="fa-solid fa-robot"></i></div>
            <div class="message-bubble typing-bubble">
                <span></span><span></span><span></span>
            </div>
        `;
        chatWindow.appendChild(typingDiv);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return typingDiv;
    },

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    },

    setDefaultDate() {
        const dateInput = Elements.expenseDate();
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
        const goalDate = Elements.goalDate();
        if (goalDate) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            goalDate.value = nextYear.toISOString().split('T')[0];
        }
    }
};

// --- Event Handlers ---
const Handlers = {
    login(e) {
        e.preventDefault();
        const username = Elements.loginUsername().value.trim();
        if (username) {
            AppState.currentUser = username;
            Storage.save();
            AudioSys.success();
            this.showApp();
        }
    },

    logout() {
        AppState.currentUser = null;
        Storage.save();
        this.showLogin();
    },

    showLogin() {
        Elements.loginView().classList.add('active');
        Elements.appView().classList.remove('active');
        Elements.appView().classList.add('hidden');
    },

    showApp() {
        Elements.loginView().classList.remove('active');
        Elements.appView().classList.remove('hidden');
        Elements.appView().classList.add('active');
        
        const userEl = Elements.userGreeting();
        if (userEl) userEl.textContent = AppState.currentUser?.name || AppState.currentUser || 'User';
        
        const profileEl = Elements.profileName();
        if (profileEl) profileEl.textContent = AppState.currentUser?.name || AppState.currentUser || 'User';
        
        UI.setDefaultDate();
        UI.updateDashboard();
        UI.updateTransactionsList();
        UI.updateGoals();
        UI.updateAIInsights();
        UI.updateNotifications();
        UI.updateProfile();
        
        setTimeout(() => Charts.init(), 100);
    },

    navigate(target) {
        Elements.pages().forEach(page => page.classList.remove('active'));
        Elements.pages().forEach(page => page.classList.add('hidden'));
        
        const targetPage = document.getElementById(`page-${target}`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.classList.add('active');
        }

        Elements.navButtons().forEach(btn => {
            if (btn.dataset.target === target) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        if (target === 'transactions') UI.updateTransactionsList();
        if (target === 'goals') UI.updateGoals();
        if (target === 'ai') UI.updateAIInsights();
        if (target === 'profile') UI.updateProfile();
        if (target === 'notifications') UI.updateNotifications();
    },

    addExpense(e) {
        e.preventDefault();
        
        const description = Elements.expenseName().value.trim();
        const amount = parseFloat(Elements.expenseAmount().value);
        let category = Elements.expenseCategory().value;
        const date = Elements.expenseDate().value;

        if (!description || !amount || !date) return;

        // Auto-detect category if not selected
        if (!category) {
            category = AIAgent.autoDetectCategory(description);
        }

        // Normalize merchant name
        const normalizedDesc = AIAgent.normalizeMerchant(description);

        const expense = {
            id: Date.now(),
            description: normalizedDesc,
            amount: amount,
            category: category,
            date: date,
            timestamp: new Date().toISOString()
        };

        AppState.expenses.push(expense);
        Storage.save();

        // Reset form
        Elements.expenseName().value = '';
        Elements.expenseAmount().value = '';
        Elements.expenseCategory().value = '';

        AudioSys.success();
        UI.updateDashboard();
        UI.updateAIInsights();
        UI.updateNotifications();
        UI.updateProfile();

        // Show success notification
        this.showToast(`Added: ${normalizedDesc} (₹${amount.toFixed(2)}) - ${category}`);
    },
    
    deleteTransaction(id) {
        if (!confirm('Are you sure you want to delete this transaction?')) return;
        
        const index = AppState.expenses.findIndex(tx => tx.id === id);
        if (index !== -1) {
            const tx = AppState.expenses[index];
            AppState.expenses.splice(index, 1);
            Storage.save();
            AudioSys.success();
            UI.updateDashboard();
            UI.updateTransactionsList();
            UI.updateAIInsights();
            UI.updateNotifications();
            UI.updateProfile();
            this.showToast(`Deleted: ${tx.description}`);
        }
    },

    saveBudget(e) {
        e.preventDefault();
        const amount = parseFloat(Elements.budgetInput().value);
        const period = Elements.budgetPeriod().value;

        if (amount && amount > 0) {
            AppState.budget = { amount, period };
            AppState.budgetAlert80Triggered = false;
            Storage.save();
            AudioSys.success();
            UI.updateDashboard();
            UI.updateAIInsights();
            this.showToast(`Budget set to ₹${amount.toLocaleString()} ${period}`);
        }
    },

    createGoal() {
        const name = Elements.goalName().value.trim();
        const target = parseFloat(Elements.goalAmount().value);
        const targetDate = Elements.goalDate().value;

        if (!name || !target || !targetDate) {
            this.showToast('Please fill all goal fields');
            return;
        }

        AppState.goals.push({
            name,
            target,
            current: 0,
            targetDate
        });

        Storage.save();
        AudioSys.success();
        UI.updateGoals();

        Elements.goalName().value = '';
        Elements.goalAmount().value = '';

        this.showToast(`Goal created: ${name}`);
    },

    async handleChat(e) {
        e.preventDefault();
        const input = Elements.chatInput().value.trim();
        if (!input) return;

        Elements.chatInput().value = '';
        UI.addChatMessage(input, true);

        // Show typing indicator
        UI.showTypingIndicator();

        // Process with delay for realism
        await new Promise(r => setTimeout(r, 600));
        UI.removeTypingIndicator();

        const result = AIAgent.processNaturalLanguage(input);
        const confidence = result.type === 'expense' ? 0.95 : 0.85; // Mock confidence for frontend
        const confidenceHtml = `<div style="font-size: 0.7rem; opacity: 0.6; margin-top: 0.3rem;">
            <i class="fa-solid fa-circle-check" style="color: #2ecc71;"></i> AI Accuracy: ${(confidence * 100).toFixed(0)}%
        </div>`;

        if (result.type === 'expense') {
            const expense = {
                id: Date.now(),
                description: result.description,
                amount: result.amount,
                category: result.category,
                date: result.date,
                timestamp: new Date().toISOString()
            };

            AppState.expenses.push(expense);
            Storage.save();

            UI.updateDashboard();
            UI.updateAIInsights();
            UI.updateProfile();

            AudioSys.success();
            UI.addChatMessage(`Added: <strong>${result.description}</strong> for <strong>₹${result.amount.toFixed(2)}</strong> under <em>${result.category}</em>` + confidenceHtml);
        } else if (result.type === 'query') {
            let response = '';
            switch (result.query) {
                case 'total_spent':
                    const total = AppState.expenses.reduce((sum, e) => sum + e.amount, 0);
                    response = `You've spent a total of <strong>₹${total.toFixed(2)}</strong>`;
                    break;
                case 'category_spending':
                    const catTotal = AppState.expenses
                        .filter(e => e.category === result.category)
                        .reduce((sum, e) => sum + e.amount, 0);
                    response = `You\'ve spent <strong>₹${catTotal.toFixed(2)}</strong> on ${result.category}`;
                    break;
                case 'monthly_total':
                    const currentMonth = new Date().toISOString().slice(0, 7);
                    const monthTotal = AppState.expenses
                        .filter(e => e.date.startsWith(currentMonth))
                        .reduce((sum, e) => sum + e.amount, 0);
                    response = `This month, you've spent <strong>₹${monthTotal.toFixed(2)}</strong>`;
                    break;
                case 'budget_status':
                    const spent = AppState.expenses.reduce((sum, e) => sum + e.amount, 0);
                    const remaining = AppState.budget.amount - spent;
                    if (AppState.budget.amount === 0) {
                        response = 'You haven\'t set a budget yet. Go to the Budget page to set one!';
                    } else if (remaining < 0) {
                        response = `You're <strong>₹${Math.abs(remaining).toFixed(2)}</strong> over budget!`;
                    } else {
                        response = `You have <strong>₹${remaining.toFixed(2)}</strong> remaining from your ₹${AppState.budget.amount} budget`;
                    }
                    break;
                case 'saving_tips':
                    response = "Based on your spending, I recommend the **50/30/20 rule**: 50% for Needs, 30% for Wants, and 20% for Savings. You can also try the 'Debt Snowball' method for any liabilities.";
                    break;
                case 'retirement_advice':
                    response = "For retirement, aim to save **15% of your gross income**. Using tax-advantaged accounts like an IRA or 401(k) can significantly boost your long-term wealth.";
                    break;
                case 'emergency_fund':
                    response = "You should aim to have **3 to 6 months of expenses** in an emergency fund. Keep this in a liquid, high-yield savings account.";
                    break;
                case 'tax_optimization':
                    response = "To optimize taxes, maximize your **401(k) or IRA contributions**, consider **Tax-Loss Harvesting** to offset gains, and hold investments for over a year to qualify for **long-term capital gains rates**.";
                    break;
                case 'inflation_protection':
                    response = "To protect against inflation, focus on **equities, real estate, and TIPS**. Avoid keeping too much cash in low-interest accounts where its purchasing power will erode.";
                    break;
                case 'house_buying':
                    response = "When buying a house, aim for a **20% down payment** to avoid PMI. Ensure your total monthly housing cost is **under 28% of your gross income**.";
                    break;
                case 'fire_movement':
                    response = "The **FIRE movement** focus is on reaching a net worth that is **25x your annual expenses**. Whether you're FatFIRE, LeanFIRE, or CoastFIRE, the key is high-savings rates and low-cost index funds.";
                    break;
                case 'crypto_risk':
                    response = "For cryptocurrency, keep exposure low (**1-5% of portfolio**). Focus on 'Blue Chip' assets like **Bitcoin and Ethereum**, and never invest more than you can afford to lose.";
                    break;
                case 'market_volatility':
                    response = "In volatile markets, avoid **FOMO and panic selling**. Time in the market beats timing the market. Stick to your diversification strategy and ignore the short-term noise.";
                    break;
                case 'estate_planning':
                    response = "Estate planning is crucial for legacy. Ensure you have a **Will**, designated **Beneficiaries** on all accounts, and consider a **Living Trust** for more complex asset transfers.";
                    break;
                case 'net_worth':
                    const totalAssets = AppState.budget.amount + AppState.expenses.reduce((s, e) => s + e.amount, 0); // Mock assets
                    response = `Your current tracked liquidity is **₹${totalAssets.toFixed(2)}**. Remember: Net Worth = Total Assets - Total Liabilities.`;
                    break;
                case 'geo_arbitrage':
                    response = "For **geo-arbitrage**, consider moving to a location where your income goes 2-3x further. This can accelerate your Financial Independence by years.";
                    break;
                case 'recession_prep':
                    response = "To prepare for a **recession**: 1. Build an 8-12 month cash buffer. 2. Pay off all non-mortgage debt. 3. Focus on career stability and 'recession-proof' assets.";
                    break;
                case 'credit_engineering':
                    response = "To engineer a **800+ credit score**: Keep utilization below 5%, never close your oldest accounts, and regularly request limit increases without using them.";
                    break;
                case 'generational_wealth':
                    response = "Build **generational wealth** by starting a **529 plan** for education, utilizing **UTMA/UGMA accounts**, and teaching your children financial literacy early.";
                    break;
                case 'side_hustle':
                    response = "To start a side hustle: 1. Identify a high-value skill. 2. Track all business expenses separately for tax write-offs. 3. Reinvest initial profits back into the business.";
                    break;
                case 'affordability':
                    const currentSpent = AppState.expenses.reduce((sum, e) => sum + e.amount, 0);
                    const currentRemaining = AppState.budget.amount - currentSpent;
                    if (result.amount <= currentRemaining * 0.5) {
                        response = `Yes, you can afford it! That's less than 50% of your remaining budget.`;
                    } else if (result.amount <= currentRemaining) {
                        response = `You can afford it, but it will use a significant portion of your remaining budget.`;
                    } else {
                        response = `That might strain your budget. You only have ₹${currentRemaining.toFixed(2)} remaining.`;
                    }
                    break;
                default:
                    response = "I'm not sure about that. Try asking about your spending or budget!";
            }
            UI.addChatMessage(response + confidenceHtml);
        } else {
            UI.addChatMessage(result.message || "I'm not sure about that. Try 'spent 450 on Dominos' or 'How much on Food?'");
        }
    },

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        AppState.darkTheme = document.body.classList.contains('dark-theme');
        Storage.save();
        Charts.updateTheme();
    },

    toggleAudio() {
        AppState.audioEnabled = Elements.audioToggleBtn().checked;
        Storage.save();
    },

    toggleAudioLimit() {
        AppState.audioLimitDaily = Elements.audioLimitBtn().checked;
        Storage.save();
    },

    exportPDF() {
        const element = document.getElementById('pdf-content');
        const header = document.getElementById('pdf-header');
        const dateEl = document.getElementById('pdf-date');

        header.classList.remove('hidden');
        dateEl.textContent = `Generated on ${new Date().toLocaleString()}`;

        const opt = {
            margin: 10,
            filename: `Finance_Report_${new Date().toISOString().split('T')[0]}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            header.classList.add('hidden');
            AudioSys.success();
            this.showToast('PDF exported successfully!');
        });
    },

    showToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, var(--primary), var(--secondary));
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    createParticles() {
        const container = Elements.particlesContainer();
        if (!container) return;

        const symbols = ['₹', '$', '€', '£', '¥'];
        
        setInterval(() => {
            if (document.hidden) return;
            
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            particle.style.left = Math.random() * 100 + 'vw';
            particle.style.animationDuration = (Math.random() * 5 + 8) + 's';
            particle.style.fontSize = (Math.random() * 20 + 15) + 'px';
            container.appendChild(particle);

            setTimeout(() => particle.remove(), 13000);
        }, 2000);
    }
};

// --- Initialization ---
function init() {
    // Load data
    Storage.load();

    // Apply theme
    if (!AppState.darkTheme) {
        document.body.classList.remove('dark-theme');
    }

    // Event listeners
    Elements.loginForm()?.addEventListener('submit', (e) => Handlers.login(e));
    Elements.logoutBtn()?.addEventListener('click', () => Handlers.logout());
    Elements.profileLogoutBtn()?.addEventListener('click', () => Handlers.logout());
    
    Elements.navButtons().forEach(btn => {
        btn.addEventListener('click', () => Handlers.navigate(btn.dataset.target));
    });

    Elements.expenseForm()?.addEventListener('submit', (e) => Handlers.addExpense(e));
    Elements.budgetForm()?.addEventListener('submit', (e) => Handlers.saveBudget(e));
    Elements.btnCreateGoal()?.addEventListener('click', () => Handlers.createGoal());
    Elements.chatForm()?.addEventListener('submit', (e) => Handlers.handleChat(e));
    Elements.themeToggle()?.addEventListener('click', () => Handlers.toggleTheme());
    Elements.audioToggleBtn()?.addEventListener('change', () => Handlers.toggleAudio());
    Elements.audioLimitBtn()?.addEventListener('change', () => Handlers.toggleAudioLimit());
    Elements.exportPdfBtn()?.addEventListener('click', () => Handlers.exportPDF());

    // Initialize particles
    Handlers.createParticles();

    // Check if user is logged in
    if (AppState.currentUser) {
        Handlers.showApp();
    } else {
        Handlers.showLogin();
    }

    // Initial Greeting
    setTimeout(() => {
        UI.addChatMessage("Greetings. I have reached the **Grandmaster Level of Financial Training**. Operating under a **Fiduciary Standard**, I am now equipped to handle **Geo-arbitrage**, **Recession Engineering**, **Credit Score Optimization**, and **Generational Wealth Design**. We are no longer just building a future—we are architecting a dynasty.");
    }, 2000);

    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !Elements.loginView().classList.contains('active')) {
            Handlers.navigate('dashboard');
        }
    });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Add CSS animations dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100px); opacity: 0; }
    }
`;
document.head.appendChild(style);
