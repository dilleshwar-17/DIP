const SAMBANOVA_API_URL = "https://api.sambanova.ai/v1/chat/completions";

const callSambaNova = async (messages) => {
  const apiKey = process.env.SAMBANOVA_API_KEY;
  if (!apiKey) {
    throw new Error("SAMBANOVA_API_KEY is not configured");
  }

  const response = await fetch(SAMBANOVA_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "Meta-Llama-3.3-70B-Instruct",
      messages: messages,
      temperature: 0.7,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `SambaNova API Error: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage += ` - ${errorJson.error?.message || errorText}`;
    } catch (e) {
      errorMessage += ` - ${errorText}`;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  return data.choices[0].message.content;
};

const suggestSubTasks = async (taskTitle, category) => {
  try {
    const prompt = `Act as a productivity expert. For a task named "${taskTitle}" in the category "${category}", provide a list of exactly 5-7 actionable sub-tasks that are concise and specific. Return ONLY the sub-tasks in a JSON array format like this: ["subtask 1", "subtask 2", ...]`;

    const content = await callSambaNova([
      { role: "system", content: "You are a productivity expert that only responds with JSON." },
      { role: "user", content: prompt }
    ]);

    // Clean up potential markdown formatting from AI response
    const jsonStr = content.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    throw error;
  }
};

const getProductivityInsights = async (stats) => {
  try {
    if (!process.env.SAMBANOVA_API_KEY) return "AI insights are currently unavailable. Please configure SAMBANOVA_API_KEY.";

    const prompt = `Analyze these productivity stats: ${JSON.stringify(stats)}. Provide 3 brief, high-impact recommendations to improve efficiency. Keep it motivating and professional.`;

    const content = await callSambaNova([
      { role: "system", content: "You are a motivational productivity coach." },
      { role: "user", content: prompt }
    ]);

    return content;
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "Failed to generate AI insights.";
  }
};

module.exports = { suggestSubTasks, getProductivityInsights };

