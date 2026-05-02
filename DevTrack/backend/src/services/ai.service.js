const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const suggestSubTasks = async (taskTitle, category) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Act as a productivity expert. For a task named "${taskTitle}" in the category "${category}", provide a list of exactly 5-7 actionable sub-tasks that are concise and specific. Return ONLY the sub-tasks in a JSON array format like this: ["subtask 1", "subtask 2", ...]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting from AI response
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    throw error;
  }
};

const getProductivityInsights = async (stats) => {
  try {
    if (!process.env.GEMINI_API_KEY) return "AI insights are currently unavailable. Please configure GEMINI_API_KEY.";

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analyze these productivity stats: ${JSON.stringify(stats)}. Provide 3 brief, high-impact recommendations to improve efficiency. Keep it motivating and professional.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return "Failed to generate AI insights.";
  }
};

module.exports = { suggestSubTasks, getProductivityInsights };
