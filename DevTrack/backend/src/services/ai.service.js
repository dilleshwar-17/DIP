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

    const prompt = `Analyze these productivity stats: ${JSON.stringify(stats)}. Provide 3 brief, high-impact recommendations to improve efficiency. Return ONLY 3 bullet points starting with '•'. Keep it motivating and professional.`;

    const content = await callSambaNova([
      { role: "system", content: "You are a motivational productivity coach. You respond only with bullet points." },
      { role: "user", content: prompt }
    ]);

    return content;
  } catch (error) {
    console.error("AI Insights Error:", error);
    return "Failed to generate AI insights.";
  }
};

const parseNaturalLanguageTask = async (text) => {
  try {
    const now = new Date();
    const prompt = `Convert the following natural language task request into a structured JSON object.
Text: "${text}"
Reference Current Time: ${now.toISOString()}

The output must be a JSON object with the following fields:
- category: (string, e.g., 'DSA', 'Revision', 'Meeting')
- date: (string, YYYY-MM-DD)
- startTime: (string, ISO 8601 datetime)
- hours: (number, duration in decimal hours)
- notes: (string)
- priority: (string: 'URGENT', 'HIGH', 'MEDIUM', 'LOW')

Return ONLY the JSON.`;

    const content = await callSambaNova([
      { role: "system", content: "You are a precise task parser that only outputs JSON." },
      { role: "user", content: prompt }
    ]);

    const jsonStr = content.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Natural Language Parsing Error:", error);
    throw error;
  }
};

const getDailyMotivation = async () => {
  try {
    const prompt = "Provide a single, powerful, and unique productivity tip or motivational quote for a software developer. Keep it under 20 words.";
    const content = await callSambaNova([
      { role: "system", content: "You are a world-class performance coach." },
      { role: "user", content: prompt }
    ]);
    return content;
  } catch (error) {
    return "Focus on progress, not perfection.";
  }
};

const getSmartPriority = async (taskTitle, notes) => {
  try {
    const prompt = `Task: "${taskTitle}". Notes: "${notes}". 
Based on this, suggest a priority level: URGENT, HIGH, MEDIUM, or LOW. 
Return ONLY the priority word.`;
    const content = await callSambaNova([
      { role: "system", content: "You are a logic-based task classifier." },
      { role: "user", content: prompt }
    ]);
    return content.trim().toUpperCase();
  } catch (error) {
    return "MEDIUM";
  }
};

const optimizeSchedule = async (tasks, timeframe) => {
  try {
    const prompt = `Current tasks: ${JSON.stringify(tasks)}. 
Analyze the distribution and suggest 2-3 specific time-management improvements (e.g., 'Move your DSA practice to 10 AM when focus is higher'). 
Keep it concise and actionable. Return as bullet points.`;
    const content = await callSambaNova([
      { role: "system", content: "You are a time-management expert." },
      { role: "user", content: prompt }
    ]);
    return content;
  } catch (error) {
    return "Maintain a consistent schedule for better focus.";
  }
};

module.exports = { suggestSubTasks, getProductivityInsights, parseNaturalLanguageTask, getDailyMotivation, getSmartPriority, optimizeSchedule };



