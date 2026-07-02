import { aiConfig } from '../config/ai.config.js';
import ApiError from '../utils/ApiError.js';

export const generateResponse = async (prompt, context = {}) => {
  const { apiKey, model } = aiConfig.groq;

  if (!apiKey) {
    throw new ApiError(500, "Groq API key is not configured.");
  }

  const url = "https://api.groq.com/openai/v1/chat/completions";

  // Groq's LLaMA 3 models typically do not support image inputs natively like Gemini does.
  // We will pass the text prompt.
  const messages = [
    {
      role: "user",
      content: prompt
    }
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_completion_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("─── GROQ API ERROR ───");
    console.error("Status:", response.status);
    console.error("Body:", errorBody);
    console.error("────────────────────────");
    throw new ApiError(502, `Groq API error: ${response.statusText}`);
  }

  const data = await response.json();
  const answer =
    data.choices?.[0]?.message?.content ||
    "No response generated.";

  return answer;
};
