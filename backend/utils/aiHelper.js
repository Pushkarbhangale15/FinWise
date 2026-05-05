const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateFinancialAdvice = async (userContext, question) => {
  const contextStr = userContext?.monthlyIncome ? `
    Student's Current Situation:
    - Monthly Income: ₹${userContext.monthlyIncome || 0}
    - Monthly Expenses: ₹${userContext.monthlyExpenses || 0}
    - Financial Goals: ${userContext.financialGoals?.join(', ') || 'Building emergency fund, investing'}
    - Risk Tolerance: ${userContext.riskTolerance || 'Conservative'}
    - Savings Rate: ${userContext.monthlyIncome && userContext.monthlyExpenses ? Math.round(((userContext.monthlyIncome - userContext.monthlyExpenses) / userContext.monthlyIncome) * 100) : 0}%
  ` : 'No financial profile provided yet.';

  const prompt = `You are a friendly and practical financial mentor for Indian college students. Provide clear, actionable advice based on their specific situation.

${contextStr}

Student's Question: "${question}"

IMPORTANT INSTRUCTIONS:
1. Answer DIRECTLY and SPECIFICALLY to their question (not generic templates)
2. Use their actual financial numbers in your response if available
3. Provide 2-3 specific, actionable steps they can take RIGHT NOW
4. Mention Indian-specific products (SIP, PPF, ELSS, UPI, student bank accounts)
5. Keep it under 200 words, conversational, encouraging
6. If they have no income/context, ask clarifying questions
7. Do NOT use markdown formatting with headers like "Budget Planning", "Saving Strategies" etc.

Respond naturally, as if texting a friend who's good with money.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Remove any markdown formatting
    return text.replace(/#+\s+/g, '').replace(/\*\*/g, '').replace(/[*]/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    return "I'm having trouble connecting right now. Please try asking your question again in a moment.";
  }
};

// Advanced Gemini functions for financial analysis
const analyzeBudgetWithAI = async (budgetData) => {
  const totalExpenses = budgetData.expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
  const income = budgetData.totalIncome || 0;
  const savingsAmount = income - totalExpenses;
  const savingsRate = income > 0 ? Math.round((savingsAmount / income) * 100) : 0;
  
  const expenseBreakdown = budgetData.expenses?.map(e => `${e.category}: ₹${e.amount}`).join(', ') || 'No expense breakdown';
  
  const prompt = `You are a financial advisor. Analyze this SPECIFIC student's budget. No generic templates.

THEIR EXACT NUMBERS:
- Monthly Income: ₹${income}
- Total Expenses: ₹${totalExpenses}
- Monthly Savings: ₹${savingsAmount} (${savingsRate}%)
- Breakdown: ${expenseBreakdown}

CRITICAL INSTRUCTIONS:
1. DO NOT use templates like "Budget Analysis / Reality Check / Recommendations" sections
2. DO use their SPECIFIC numbers in every sentence
3. Give ONE actionable change they can make THIS WEEK (not vague suggestions)
4. If they have ₹${savingsAmount} to save: Name ONE specific Indian product (SIP, PPF, savings account, RD)
5. Format: 2-3 sentences, conversational, NO markdown/bullets

EXAMPLES OF WHAT NOT TO DO:
❌ "Budget Planning\n- Track your expenses\n- Use 50/30/20 rule"
❌ "Your budget is healthy" (say specifically: "at ₹${savingsRate}% savings rate, you're doing well" or "you're only saving ₹${savingsAmount}, try reducing...")

WHAT TO DO:
✅ "Your ₹${totalExpenses} expenses leave ₹${savingsAmount} to save monthly. Put ₹${Math.round(savingsAmount*0.7)} in a SIP and ₹${Math.round(savingsAmount*0.3)} in a savings account."
✅ Mention their highest expense category and suggest ONE way to cut it`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text()
      .replace(/#+\s+/g, '')
      .replace(/\*\*/g, '')
      .replace(/[*-]\s+/g, '')
      .trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Unable to analyze budget at the moment. Please try again later.";
  }
};

const generatePersonalizedLearningPath = async (userProfile, completedModules) => {
  const completedCount = completedModules?.length || 0;
  
  const prompt = `You are a financial education advisor for Indian college students.

Student Profile:
- Income Level: ₹${userProfile?.monthlyIncome || 0}
- Financial Goals: ${userProfile?.financialGoals?.join(', ') || 'General financial literacy'}
- Modules Completed: ${completedCount} modules

Based on their income level and completed ${completedCount} modules, suggest the NEXT 3 most relevant topics they should learn about. Consider:
- If income < ₹10,000: Focus on saving, budgeting basics
- If income ₹10,000-30,000: Add investing, emergency fund
- If income > ₹30,000: Add tax planning, advanced investing

Format as a simple bullet list (3-4 lines max), no markdown. Be specific to Indian context.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().replace(/#+\s+/g, '').replace(/\*\*/g, '').replace(/[*]/g, '');
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Unable to generate learning path. Please try the default sequence.";
  }
};

module.exports = {
  generateFinancialAdvice,
  generatePersonalizedLearningPath,
  analyzeBudgetWithAI
};