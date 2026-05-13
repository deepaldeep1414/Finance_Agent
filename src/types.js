/**
 * @typedef {("spending_analysis"|"budgeting"|"subscriptions"|"savings"|"investing"|"debt"|"emotional_spending"|"lifestyle_tradeoff"|"financial_planning"|"purchase_decision"|"income_analysis"|"cashflow_analysis"|"recurring_expenses"|"general_finance_question")} Intent
 */

/**
 * @typedef {("low"|"medium"|"high")} RiskLevel
 */

/**
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} description
 * @property {number} amount
 * @property {string} category
 * @property {string} date
 * @property {boolean} [recurring]
 */

/**
 * @typedef {Object} Budget
 * @property {number} amount
 * @property {"Monthly"|"Yearly"} period
 */

/**
 * @typedef {Object} MemoryProfile
 * @property {number|null} monthlyIncome
 * @property {number|null} savingsTarget
 * @property {number|null} debtBalance
 * @property {string[]} priorities
 */

/**
 * @typedef {Object} FinancialSnapshot
 * @property {number} totalSpent
 * @property {number} monthlySpent
 * @property {number} budgetAmount
 * @property {number} budgetRemaining
 * @property {number} budgetVariance
 * @property {number|null} savingsRate
 * @property {number} discretionaryRatio
 * @property {number} essentialRatio
 * @property {number|null} debtToIncome
 * @property {number} recurringTotal
 * @property {number|null} monthlyBurn
 * @property {number|null} runwayMonths
 * @property {Record<string, number>} categoryTotals
 * @property {Record<string, number>} categoryDeltas
 * @property {number} transactionCount
 */

/**
 * @typedef {Object} AssistantResponse
 * @property {Intent} intent
 * @property {string} summary
 * @property {string} key_insight
 * @property {string} financial_impact
 * @property {string} recommendation
 * @property {RiskLevel} risk_level
 * @property {number} confidence
 * @property {string[]} metrics_used
 * @property {string} follow_up_question
 */

/**
 * @typedef {Object} IntentResult
 * @property {Intent|null} intent
 * @property {number} confidence
 * @property {Intent[]} alternatives
 */

/**
 * @typedef {Object} ChatTurn
 * @property {"user"|"assistant"} role
 * @property {string} text
 * @property {AssistantResponse|null} response
 * @property {number} ts
 */

export {};
