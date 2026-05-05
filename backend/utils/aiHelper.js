const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate financial advice for a student question.
 * Only includes available profile data to save tokens.
 */
const generateFinancialAdvice = async (userContext, question) => {
  // Build only the parts that exist
  const profileLines = [];
  if (userContext.monthlyIncome != null)
    profileLines.push(`Income: ₹${userContext.monthlyIncome}`);
  if (userContext.monthlyExpenses != null)
    profileLines.push(`Expenses: ₹${userContext.monthlyExpenses}`);
  if (userContext.financialGoals?.length > 0)
    profileLines.push(`Goals: ${userContext.financialGoals.join(", ")}`);
  if (userContext.riskTolerance)
    profileLines.push(`Risk tolerance: ${userContext.riskTolerance}`);

  const contextBlock =
    profileLines.length > 0
      ? `Student context:\n${profileLines.join("\n")}\n\n`
      : "";

  const prompt = `You are a friendly financial advisor for Indian college students.
${contextBlock}Question: ${question}

Give practical, short advice (under 120 words). Focus on Indian products like SIP, PPF, student bank accounts, UPI. No markdown formatting.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200 },
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "I'm having trouble connecting right now. Please try asking again in a moment.";
  }
};

/**
 * Analyze budget and give 3 key insights. No markdown.
 */
const analyzeBudgetWithAI = async (budgetData) => {
  const prompt = `Analyze this student's budget and give 3 short, actionable insights (no markdown):
Income: ₹${budgetData.totalIncome}
Expenses: ${JSON.stringify(budgetData.expenses)}
Savings rate: ${budgetData.savingsRate}%

Focus on student-friendly suggestions for improving financial health. Keep it under 120 words.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200 },
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Unable to analyze budget at the moment. Please try again later.";
  }
};

/**
 * Create a personalised learning path. Plain text only.
 */
const generatePersonalizedLearningPath = async (
  userProfile,
  completedModules,
) => {
  const prompt = `Based on this student's financial knowledge, suggest the next 3 most relevant topics to learn (plain text, no markdown):
Profile: ${JSON.stringify(userProfile)}
Completed modules: ${completedModules.length}

Keep each topic to one line.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 200 },
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Unable to generate learning path. Please try the default sequence.";
  }
};

module.exports = {
  generateFinancialAdvice,
  generatePersonalizedLearningPath,
  analyzeBudgetWithAI,
};
