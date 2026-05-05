import api from "./api";

export const EXPERT_OPTIONS = [
  { value: "research", label: "Research Assistant" },
  { value: "real-estate", label: "Real Estate Expert" },
  { value: "crypto", label: "Crypto Expert" },
  { value: "investment", label: "Investment Expert" },
  { value: "stock", label: "Stock Market Expert" },
  { value: "retirement-tax", label: "Retirement & Tax Expert" },
  { value: "default", label: "General Assistant" },
];

export const sendMessageToAI = async (
  prompt,
  context = null,
  expert = "default",
) => {
  try {
    const response = await api.post("/chat/message", {
      message: prompt,
      context,
      expert,
    });
    return {
      message: response.data.message || response.data.content,
      content: response.data.message || response.data.content,
      sources: response.data.sources || [],
    };
  } catch (error) {
    console.error("Error sending message to AI:", error);
    throw error;
  }
};

export const getChatHistory = async () => {
  try {
    const response = await api.get("/chat/history");
    return {
      success: true,
      conversation: response.data.conversation || [],
    };
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return { success: false, conversation: [] };
  }
};

export const clearChatHistory = async () => {
  try {
    await api.delete("/chat/history");
    return { success: true };
  } catch (error) {
    console.error("Error clearing chat history:", error);
    throw error;
  }
};

export const analyzeBudgetWithAI = async (budgetData) => {
  try {
    const response = await api.post("/chat/analyze-budget", {
      budgetData,
    });
    return { analysis: response.data.analysis };
  } catch (error) {
    console.error("Error analyzing budget:", error);
    throw error;
  }
};

export const getLearningPath = async () => {
  try {
    const response = await api.get("/chat/learning-path");
    return {
      recommendations: response.data.recommendations || "",
    };
  } catch (error) {
    console.error("Error fetching learning path:", error);
    throw error;
  }
};

export const getQuickTip = async () => {
  try {
    const response = await api.get("/chat/quick-tips");
    return {
      tip: response.data.tip || "No tip available",
    };
  } catch (error) {
    console.error("Error fetching quick tip:", error);
    throw error;
  }
};

export const getStockAnalysis = async (prompt) => {
  try {
    const response = await api.post("/chat/message", {
      message: prompt || "current stock status of india",
      expert: "stock",
    });
    return {
      content: response.data.message || response.data.content,
    };
  } catch (error) {
    console.error("Error analyzing stocks:", error);
    throw error;
  }
};
